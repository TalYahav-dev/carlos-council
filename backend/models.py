from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator

# Upper bounds on user-supplied text. Generous enough for real briefs, but
# bounded to prevent runaway prompt size / token-cost abuse.
MAX_BRIEF_LEN = 20_000
MAX_ANSWER_LEN = 5_000
MAX_ANSWERS = 20


class Phase(str, Enum):
    INITIAL_ANALYSIS = "initial_analysis"
    SYNTHESIS = "synthesis"
    DEBATE = "debate"
    FINAL = "final"


class AgentId(str, Enum):
    CARLOS = "carlos"
    STORYTELLER = "storyteller"
    PRODUCT_ARCHITECT = "product_architect"
    REVENUE_STRATEGIST = "revenue_strategist"
    GROWTH_HUNTER = "growth_hunter"
    FIELD_OPERATOR = "field_operator"


class SessionStatus(str, Enum):
    RUNNING = "running"
    AWAITING_CLARIFICATION = "awaiting_clarification"
    COMPLETED = "completed"
    ERROR = "error"


# --- Request models ---

class BriefRequest(BaseModel):
    brief: str = Field(min_length=1, max_length=MAX_BRIEF_LEN)

    @field_validator("brief")
    @classmethod
    def _strip_brief(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Brief must not be empty.")
        return v


class ClarificationAnswer(BaseModel):
    answers: dict[str, str]

    @field_validator("answers")
    @classmethod
    def _check_answers(cls, v: dict[str, str]) -> dict[str, str]:
        if len(v) > MAX_ANSWERS:
            raise ValueError(f"Too many answers (max {MAX_ANSWERS}).")
        for value in v.values():
            if len(value) > MAX_ANSWER_LEN:
                raise ValueError(f"Answer too long (max {MAX_ANSWER_LEN} characters).")
        return v


class BusinessProfile(BaseModel):
    company: dict[str, Any] = Field(default_factory=dict)
    offer: dict[str, Any] = Field(default_factory=dict)
    audience: dict[str, Any] = Field(default_factory=dict)
    channels: dict[str, Any] = Field(default_factory=dict)
    social: dict[str, Any] = Field(default_factory=dict)
    metrics: dict[str, Any] = Field(default_factory=dict)
    tech_stack: dict[str, Any] = Field(default_factory=dict)
    constraints: dict[str, Any] = Field(default_factory=dict)
    strategy: dict[str, Any] = Field(default_factory=dict)
    brand: dict[str, Any] = Field(default_factory=dict)
    notes: list[str] = Field(default_factory=list)


class BusinessProfileResponse(BaseModel):
    profile: BusinessProfile
    updated_at: str | None = None


class ProfileSourceCreate(BaseModel):
    source_type: str
    source_name: str
    payload: Any


# --- Response models ---

class PhaseData(BaseModel):
    phase: Phase
    agents: dict[str, str] = {}


class SessionResponse(BaseModel):
    id: str
    brief: str
    status: SessionStatus
    phases: dict[str, Any] = {}
    created_at: str
    updated_at: str


class SessionListItem(BaseModel):
    id: str
    brief: str
    status: SessionStatus
    created_at: str
