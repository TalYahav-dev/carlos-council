"""Pure parsing helpers on the orchestrator (no LLM, no I/O)."""

from orchestrator import Orchestrator


def test_parse_clarification_questions_extracts_numbered_list():
    text = (
        "Here is my synthesis.\n\n"
        "## Clarification Questions\n"
        "1. What is your budget?\n"
        "2. Who is the decision maker?\n"
    )
    assert Orchestrator._parse_clarification_questions(text) == [
        "What is your budget?",
        "Who is the decision maker?",
    ]


def test_parse_clarification_questions_absent_returns_empty():
    assert Orchestrator._parse_clarification_questions("No questions section.") == []


def test_format_debate_history_renders_rounds():
    out = Orchestrator._format_debate_history(
        {"round_1": ["**Carlos (moderator):** topic", "**Storyteller:** reply"]}
    )
    assert "Round 1" in out
    assert "**Carlos (moderator):** topic" in out
    assert "**Storyteller:** reply" in out
