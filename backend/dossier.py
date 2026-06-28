from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

PROFILE_SECTION_ORDER = [
    "company",
    "offer",
    "audience",
    "channels",
    "social",
    "metrics",
    "tech_stack",
    "constraints",
    "strategy",
    "brand",
    "notes",
]


@dataclass(slots=True)
class ParsedBusinessDossier:
    executive_summary: str
    profile: dict[str, Any]
    missing_questions: list[str]


def empty_business_profile() -> dict[str, Any]:
    return {
        "company": {},
        "offer": {},
        "audience": {},
        "channels": {},
        "social": {},
        "metrics": {},
        "tech_stack": {},
        "constraints": {},
        "strategy": {},
        "brand": {},
        "notes": [],
    }


def normalize_business_profile(profile: dict[str, Any] | None) -> dict[str, Any]:
    normalized = empty_business_profile()
    if not profile:
        return normalized

    for key in PROFILE_SECTION_ORDER:
        value = profile.get(key)
        if value is None:
            continue
        normalized[key] = value

    for key, value in profile.items():
        if key not in normalized and value is not None:
            normalized[key] = value

    return normalized


def parse_business_dossier_markdown(text: str) -> ParsedBusinessDossier:
    start = text.find("{")
    if start == -1:
        raise ValueError("Could not find JSON object in dossier document")

    preamble = text[:start].strip()
    json_blob = text[start:]
    profile, end = json.JSONDecoder().raw_decode(json_blob)
    trailing_text = json_blob[end:].strip()

    return ParsedBusinessDossier(
        executive_summary=_extract_executive_summary(preamble),
        profile=normalize_business_profile(profile),
        missing_questions=_extract_missing_questions(trailing_text),
    )


def render_profile_context(profile: dict[str, Any] | None) -> str:
    normalized = normalize_business_profile(profile)
    sections: list[str] = []

    for key in PROFILE_SECTION_ORDER:
        value = normalized.get(key)
        if _is_empty(value):
            continue

        title = key.replace("_", " ").title()
        rendered = _render_value(value)
        if rendered:
            sections.append(f"### {title}\n{rendered}")

    if not sections:
        return ""

    return "## Business Dossier\n" + "\n\n".join(sections)


def _render_value(value: Any, depth: int = 0) -> str:
    if _is_empty(value):
        return ""

    indent = "  " * depth
    child_indent = "  " * (depth + 1)

    if isinstance(value, dict):
        lines: list[str] = []
        for key, child in value.items():
            if _is_empty(child):
                continue
            label = key.replace("_", " ").title()
            if isinstance(child, (dict, list)):
                rendered_child = _render_value(child, depth + 1)
                if rendered_child:
                    lines.append(f"{indent}- {label}:")
                    lines.append(rendered_child)
            else:
                lines.append(f"{indent}- {label}: {child}")
        return "\n".join(lines)

    if isinstance(value, list):
        lines = []
        for item in value:
            if _is_empty(item):
                continue
            if isinstance(item, (dict, list)):
                rendered_item = _render_value(item, depth + 1)
                if rendered_item:
                    lines.append(f"{indent}-")
                    lines.append(rendered_item.replace(child_indent, f"{indent}  ", 1))
            else:
                lines.append(f"{indent}- {item}")
        return "\n".join(lines)

    return f"{indent}- {value}"


def _is_empty(value: Any) -> bool:
    return value in (None, "", [], {})


def _extract_executive_summary(preamble: str) -> str:
    if not preamble:
        return ""

    lines = [line.strip() for line in preamble.splitlines()]
    filtered_lines = [line for line in lines if line]
    if filtered_lines and filtered_lines[0].lower() == "executive summary":
        filtered_lines = filtered_lines[1:]
    return "\n".join(filtered_lines).strip()


def _extract_missing_questions(trailing_text: str) -> list[str]:
    if not trailing_text:
        return []

    questions: list[str] = []
    in_missing_questions = False

    for raw_line in trailing_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.lower() == "missing questions:":
            in_missing_questions = True
            continue
        if not in_missing_questions:
            continue
        if line.startswith(("* ", "- ")):
            questions.append(line[2:].strip())
            continue
        if questions:
            questions[-1] = f"{questions[-1]} {line}".strip()

    return questions
