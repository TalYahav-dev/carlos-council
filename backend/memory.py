from __future__ import annotations

import json
import logging
from pathlib import Path

from agents.carlos import Carlos
from database import get_lessons, save_lessons

logger = logging.getLogger(__name__)

_LESSON_PROMPT = (Path(__file__).resolve().parent / "prompts" / "lesson_extraction.md").read_text(encoding="utf-8")


async def extract_and_store_lessons(session_id: str, transcript: dict) -> list[dict]:
    """Send the full transcript to Carlos to extract lessons, then store them."""
    try:
        carlos = Carlos()
        flat_transcript = _flatten_transcript(transcript)
        messages = [
            {"role": "user", "content": f"{_LESSON_PROMPT}\n\n---\n\n{flat_transcript}"},
        ]
        raw = await carlos.complete(messages)

        # Parse JSON from the response (handle markdown code blocks)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]  # remove first line
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()

        lessons = json.loads(raw)
        if isinstance(lessons, list) and lessons:
            await save_lessons(session_id, lessons)
            return lessons
    except Exception as e:
        logger.warning("Failed to extract lessons for session %s: %s", session_id, e)
    return []


async def get_past_lessons_prompt(limit: int = 20) -> str:
    """Retrieve past lessons and format them for injection into Carlos's context."""
    lessons = await get_lessons(limit=limit)
    if not lessons:
        return ""

    lines = ["## Lessons from Previous Council Sessions", ""]
    for lesson in lessons:
        lines.append(f"- [{lesson['category']}] {lesson['lesson']}")
    return "\n".join(lines)


def _flatten_transcript(transcript: dict) -> str:
    """Flatten the nested transcript dict into readable text."""
    parts = []
    for phase_name, agents in transcript.items():
        parts.append(f"=== {phase_name.upper()} ===\n")
        if isinstance(agents, dict):
            for agent_id, text in agents.items():
                parts.append(f"**{agent_id}:**\n{text}\n")
        elif isinstance(agents, str):
            parts.append(agents)
        parts.append("")
    return "\n".join(parts)
