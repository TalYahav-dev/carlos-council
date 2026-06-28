from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from orchestrator import Orchestrator


class CouncilSession:
    """Manages the state of one council session."""

    def __init__(self, session_id: str, brief: str, profile_snapshot: dict | None = None) -> None:
        self.session_id = session_id
        self.brief = brief
        self.phase: int = 1
        self.transcript: dict[str, dict[str, str]] = {}  # {phase_name: {agent_id: text}}
        self.clarification_event = asyncio.Event()
        self.clarification_questions: list[str] = []
        self.clarification_answers: dict[str, str] = {}
        self.status: str = "running"
        self.orchestrator: Orchestrator | None = None
        self.event_history: list[dict] = []  # replay buffer
        self.profile_snapshot: dict = profile_snapshot or {}
