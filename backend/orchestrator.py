from __future__ import annotations

import asyncio
import logging
import re
from pathlib import Path

from agents import (
    Carlos,
    FieldOperator,
    GrowthHunter,
    ProductArchitect,
    RevenueStrategist,
    Storyteller,
)
from agents.base import BaseAgent
from database import update_session
from dossier import render_profile_context
from memory import extract_and_store_lessons, get_past_lessons_prompt
from session import CouncilSession
from streaming import format_sse_event

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"


def _load_prompt(name: str) -> str:
    return (PROMPTS_DIR / name).read_text(encoding="utf-8").strip()


class Orchestrator:
    def __init__(self, session: CouncilSession) -> None:
        self.session = session
        self.agents: dict[str, BaseAgent] = {
            "storyteller": Storyteller(),
            "product_architect": ProductArchitect(),
            "revenue_strategist": RevenueStrategist(),
            "growth_hunter": GrowthHunter(),
            "field_operator": FieldOperator(),
        }
        self.carlos = Carlos()
        self.event_queue: asyncio.Queue[dict | None] = asyncio.Queue()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _emit(self, event_type: str, data: dict) -> None:
        evt = format_sse_event(event_type, data)
        self.session.event_history.append(evt)
        await self.event_queue.put(evt)

    async def _stream_agent_to_queue(self, agent: BaseAgent, messages: list[dict]) -> str:
        """Stream an agent's response as token events and return the full text."""
        await self._emit("agent_start", {"agent_id": agent.agent_id, "name": agent.name})
        tokens: list[str] = []
        async for token in agent.stream(messages):
            tokens.append(token)
            await self._emit("agent_token", {"agent_id": agent.agent_id, "token": token})
        text = "".join(tokens)
        await self._emit("agent_complete", {"agent_id": agent.agent_id, "text": text})
        return text

    def _business_context(self) -> str:
        sections = []
        profile_context = render_profile_context(self.session.profile_snapshot)
        if profile_context:
            sections.append(profile_context)
        sections.append(f"## Current Session Brief\n{self.session.brief}")
        return "\n\n".join(sections)

    # ------------------------------------------------------------------
    # Main run loop
    # ------------------------------------------------------------------

    async def run(self) -> None:
        try:
            await self._phase1_initial_analysis()
            await self._phase2_synthesis()
            await self._phase3_debate()
            await self._phase4_final()

            self.session.status = "completed"
            await update_session(
                self.session.session_id,
                transcript=self.session.transcript,
                status="completed",
            )

            # Extract lessons in the background
            asyncio.create_task(
                extract_and_store_lessons(self.session.session_id, self.session.transcript)
            )

            await self._emit("council_complete", {"session_id": self.session.session_id})

        except Exception as e:
            logger.exception("Orchestrator error for session %s", self.session.session_id)
            self.session.status = "error"
            await update_session(self.session.session_id, status="error")
            await self._emit("error", {"message": str(e)})
        finally:
            await self.event_queue.put(None)  # Signal end of stream

    # ------------------------------------------------------------------
    # Phase 1 — Initial Analysis (Parallel)
    # ------------------------------------------------------------------

    async def _phase1_initial_analysis(self) -> None:
        self.session.phase = 1
        await self._emit("phase_change", {"phase": 1, "name": "initial_analysis"})

        messages = [{"role": "user", "content": self._business_context()}]

        # Run all 5 specialists in parallel. gather(return_exceptions=True) waits
        # for every task so a failure in one never orphans its siblings; we then
        # surface the first error to the run() handler.
        agent_ids = list(self.agents)
        outcomes = await asyncio.gather(
            *(
                self._stream_agent_to_queue(self.agents[agent_id], messages)
                for agent_id in agent_ids
            ),
            return_exceptions=True,
        )
        results: dict[str, str] = {}
        for agent_id, outcome in zip(agent_ids, outcomes):
            if isinstance(outcome, BaseException):
                raise outcome
            results[agent_id] = outcome

        self.session.transcript["initial_analysis"] = results
        await update_session(self.session.session_id, transcript=self.session.transcript)

    # ------------------------------------------------------------------
    # Phase 2 — Carlos Synthesis + Clarification
    # ------------------------------------------------------------------

    async def _phase2_synthesis(self) -> None:
        self.session.phase = 2
        await self._emit("phase_change", {"phase": 2, "name": "synthesis"})

        # Build context for Carlos: brief + all Phase 1 outputs
        phase1 = self.session.transcript.get("initial_analysis", {})
        specialist_summaries = "\n\n".join(
            f"### {agent_id.replace('_', ' ').title()}\n{text}"
            for agent_id, text in phase1.items()
        )

        # Inject past lessons if available
        lessons_prompt = await get_past_lessons_prompt()
        synthesis_instructions = _load_prompt("phase_synthesis.md")

        context = (
            f"{synthesis_instructions}\n\n"
            f"{self._business_context()}\n\n"
            f"## Specialist Analyses\n{specialist_summaries}"
        )
        if lessons_prompt:
            context = f"{lessons_prompt}\n\n{context}"

        messages = [{"role": "user", "content": context}]
        carlos_text = await self._stream_agent_to_queue(self.carlos, messages)
        self.session.transcript["synthesis"] = {"carlos": carlos_text}
        await update_session(self.session.session_id, transcript=self.session.transcript)

        # Parse clarification questions from Carlos's output
        questions = self._parse_clarification_questions(carlos_text)
        if questions:
            self.session.clarification_questions = questions
            self.session.status = "awaiting_clarification"
            await update_session(self.session.session_id, status="awaiting_clarification")
            await self._emit("clarification", {"questions": questions})

            # Wait for human answers, sending keep-alive pings
            while not self.session.clarification_event.is_set():
                try:
                    await asyncio.wait_for(
                        self.session.clarification_event.wait(), timeout=15.0
                    )
                except asyncio.TimeoutError:
                    await self._emit("ping", {"message": "waiting for clarification"})

            self.session.status = "running"
            await update_session(self.session.session_id, status="running")
            await self._emit("clarification_received", {
                "answers": self.session.clarification_answers
            })

    @staticmethod
    def _parse_clarification_questions(text: str) -> list[str]:
        """Extract numbered questions from the Clarification Questions section."""
        # Look for the section header
        match = re.search(r"##\s*Clarification Questions\s*\n(.*)", text, re.DOTALL | re.IGNORECASE)
        if not match:
            return []

        section = match.group(1).strip()
        # Extract numbered items
        questions = re.findall(r"\d+\.\s*(.+?)(?=\n\d+\.|\Z)", section, re.DOTALL)
        return [q.strip() for q in questions if q.strip()]

    # ------------------------------------------------------------------
    # Phase 3 — Debate (2 rounds)
    # ------------------------------------------------------------------

    async def _phase3_debate(self) -> None:
        self.session.phase = 3
        await self._emit("phase_change", {"phase": 3, "name": "debate"})

        debate_instructions = _load_prompt("phase_debate.md")
        debate_transcript: dict[str, list[str]] = {}

        # Build context: brief + phase 1 + carlos synthesis + clarification answers
        phase1 = self.session.transcript.get("initial_analysis", {})
        synthesis = self.session.transcript.get("synthesis", {}).get("carlos", "")
        clarification = self.session.clarification_answers

        base_context = (
            f"{self._business_context()}\n\n"
            f"## Carlos's Synthesis\n{synthesis}\n\n"
        )
        if clarification:
            answers_text = "\n".join(f"- **Q:** {q}\n  **A:** {a}" for q, a in clarification.items())
            base_context += f"## Clarification Answers from Decision-Maker\n{answers_text}\n\n"

        num_rounds = 2
        for round_num in range(1, num_rounds + 1):
            await self._emit("debate_round", {"round": round_num, "total": num_rounds})

            # Carlos poses a debate topic at the start of each round
            if round_num == 1:
                carlos_debate_prompt = (
                    f"{base_context}"
                    "Based on the tensions identified in your synthesis, pose the single most important "
                    "strategic debate question for the specialists. Frame it as a clear either/or or "
                    "priority question. Be specific and provocative."
                )
            else:
                prior_debate = self._format_debate_history(debate_transcript)
                carlos_debate_prompt = (
                    f"{base_context}"
                    f"## Prior Debate\n{prior_debate}\n\n"
                    "Based on the debate so far, pose a follow-up question that pushes the specialists "
                    "to go deeper or address an unresolved tension. Be specific."
                )

            carlos_question = await self._stream_agent_to_queue(
                self.carlos, [{"role": "user", "content": carlos_debate_prompt}]
            )
            debate_transcript.setdefault(f"round_{round_num}", []).append(
                f"**Carlos (moderator):** {carlos_question}"
            )

            # Each specialist responds in sequence, seeing all prior messages
            for agent_id, agent in self.agents.items():
                prior_debate = self._format_debate_history(debate_transcript)
                agent_prompt = (
                    f"{debate_instructions}\n\n"
                    f"{base_context}"
                    f"## Debate So Far\n{prior_debate}\n\n"
                    f"Carlos has posed the above question/challenge. Respond from your perspective as {agent.name}. "
                    f"Engage with what others have said. Be direct and concise."
                )
                response = await self._stream_agent_to_queue(
                    agent, [{"role": "user", "content": agent_prompt}]
                )
                debate_transcript[f"round_{round_num}"].append(
                    f"**{agent.name}:** {response}"
                )

        self.session.transcript["debate"] = {
            k: "\n\n".join(v) for k, v in debate_transcript.items()
        }
        await update_session(self.session.session_id, transcript=self.session.transcript)

    @staticmethod
    def _format_debate_history(debate_transcript: dict[str, list[str]]) -> str:
        parts = []
        for round_key, entries in debate_transcript.items():
            parts.append(f"### {round_key.replace('_', ' ').title()}")
            parts.extend(entries)
            parts.append("")
        return "\n\n".join(parts)

    # ------------------------------------------------------------------
    # Phase 4 — Final Strategic Plan
    # ------------------------------------------------------------------

    async def _phase4_final(self) -> None:
        self.session.phase = 4
        await self._emit("phase_change", {"phase": 4, "name": "final"})

        final_instructions = _load_prompt("phase_final.md")

        # Build the full context for Carlos
        phase1 = self.session.transcript.get("initial_analysis", {})
        specialist_summaries = "\n\n".join(
            f"### {aid.replace('_', ' ').title()}\n{txt}"
            for aid, txt in phase1.items()
        )
        synthesis = self.session.transcript.get("synthesis", {}).get("carlos", "")
        debate = self.session.transcript.get("debate", {})
        debate_text = "\n\n".join(
            f"### {k.replace('_', ' ').title()}\n{v}" for k, v in debate.items()
        )
        clarification = self.session.clarification_answers
        answers_text = ""
        if clarification:
            answers_text = "\n".join(
                f"- **Q:** {q}\n  **A:** {a}" for q, a in clarification.items()
            )

        full_context = (
            f"{final_instructions}\n\n"
            f"{self._business_context()}\n\n"
            f"## Phase 1: Specialist Analyses\n{specialist_summaries}\n\n"
            f"## Phase 2: Your Synthesis\n{synthesis}\n\n"
        )
        if answers_text:
            full_context += f"## Clarification Answers\n{answers_text}\n\n"
        full_context += f"## Phase 3: Debate\n{debate_text}\n\n"
        full_context += "Now deliver the definitive 10-point strategic plan."

        messages = [{"role": "user", "content": full_context}]
        final_text = await self._stream_agent_to_queue(self.carlos, messages)

        self.session.transcript["final"] = {"carlos": final_text}
        await update_session(self.session.session_id, transcript=self.session.transcript)
