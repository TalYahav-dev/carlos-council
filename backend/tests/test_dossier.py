"""Business-dossier parsing/normalisation/rendering helpers."""

import pytest

from dossier import (
    empty_business_profile,
    normalize_business_profile,
    parse_business_dossier_markdown,
    render_profile_context,
)


def test_empty_profile_has_all_known_sections():
    profile = empty_business_profile()
    assert {"company", "offer", "audience", "notes"} <= set(profile)
    assert profile["notes"] == []


def test_normalize_none_returns_empty_profile():
    assert normalize_business_profile(None) == empty_business_profile()


def test_normalize_preserves_values_and_unknown_keys():
    out = normalize_business_profile({"company": {"name": "Acme"}, "extra": "keep"})
    assert out["company"] == {"name": "Acme"}
    assert out["extra"] == "keep"  # unknown key carried through
    assert out["offer"] == {}  # missing section filled with default


def test_parse_markdown_extracts_summary_profile_and_questions():
    text = (
        "Executive Summary\n"
        "Acme sells widgets to SMBs.\n\n"
        '{"company": {"name": "Acme"}}\n\n'
        "Missing Questions:\n"
        "- What is the budget?\n"
        "- Who is the buyer?\n"
    )
    parsed = parse_business_dossier_markdown(text)
    assert parsed.executive_summary == "Acme sells widgets to SMBs."
    assert parsed.profile["company"] == {"name": "Acme"}
    assert parsed.missing_questions == ["What is the budget?", "Who is the buyer?"]


def test_parse_markdown_without_json_raises():
    with pytest.raises(ValueError):
        parse_business_dossier_markdown("no json object anywhere here")


def test_render_context_blank_for_empty_profile():
    assert render_profile_context(None) == ""


def test_render_context_includes_populated_sections():
    out = render_profile_context({"company": {"name": "Acme"}})
    assert "## Business Dossier" in out
    assert "Company" in out
    assert "Acme" in out
