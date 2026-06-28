"""End-to-end orchestrator run with the LLM mocked.

Verifies the four-phase flow executes in order, records every phase, runs all
five specialists in phase 1, and persists a completed session — without any
network call.
"""

import pytest

import orchestrator as orchestrator_module
from database import create_session, get_session, init_db
from orchestrator import Orchestrator
from session import CouncilSession


@pytest.fixture
def mock_council(monkeypatch):
    """Replace LLM streaming and lesson-memory side effects with stubs."""

    async def fake_stream(self, messages):
        # Deterministic, no clarification trigger (no "## Clarification Questions").
        yield f"[{self.agent_id}] mocked response"

    async def noop_extract(*args, **kwargs):
        return []

    async def empty_lessons_prompt(*args, **kwargs):
        return ""

    monkeypatch.setattr("agents.base.BaseAgent.stream", fake_stream)
    monkeypatch.setattr(orchestrator_module, "extract_and_store_lessons", noop_extract)
    monkeypatch.setattr(orchestrator_module, "get_past_lessons_prompt", empty_lessons_prompt)


@pytest.mark.asyncio
async def test_full_council_run_completes_and_persists(mock_council):
    await init_db()
    session_id = "test-run-session"
    await create_session(session_id, "Launch a new product line")

    session = CouncilSession(session_id, "Launch a new product line")
    orchestrator = Orchestrator(session)
    session.orchestrator = orchestrator

    await orchestrator.run()

    assert session.status == "completed"

    # All four phases recorded.
    assert set(session.transcript) == {"initial_analysis", "synthesis", "debate", "final"}

    # Phase 1 ran every specialist.
    assert set(session.transcript["initial_analysis"]) == {
        "storyteller",
        "product_architect",
        "revenue_strategist",
        "growth_hunter",
        "field_operator",
    }

    # Carlos produced synthesis and final plan.
    assert session.transcript["synthesis"]["carlos"]
    assert session.transcript["final"]["carlos"]

    # Lifecycle events emitted, ending with completion.
    event_types = [event["event"] for event in session.event_history]
    assert "phase_change" in event_types
    assert event_types[-1] == "council_complete"

    # Persisted as completed.
    row = await get_session(session_id)
    assert row is not None
    assert row["status"] == "completed"


@pytest.mark.asyncio
async def test_run_marks_session_error_on_failure(monkeypatch):
    async def boom_stream(self, messages):
        raise RuntimeError("LLM exploded")
        yield  # pragma: no cover - generator marker

    monkeypatch.setattr("agents.base.BaseAgent.stream", boom_stream)

    await init_db()
    session_id = "test-error-session"
    await create_session(session_id, "This run will fail")

    session = CouncilSession(session_id, "This run will fail")
    orchestrator = Orchestrator(session)
    session.orchestrator = orchestrator

    await orchestrator.run()

    assert session.status == "error"
    event_types = [event["event"] for event in session.event_history]
    assert "error" in event_types

    row = await get_session(session_id)
    assert row is not None
    assert row["status"] == "error"
