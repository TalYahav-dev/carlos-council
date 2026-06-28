"""Request-model validation: bounds and sanitisation on user-supplied text."""

import pytest
from pydantic import ValidationError

from models import (
    MAX_ANSWER_LEN,
    MAX_ANSWERS,
    MAX_BRIEF_LEN,
    BriefRequest,
    ClarificationAnswer,
)


def test_brief_strips_surrounding_whitespace():
    assert BriefRequest(brief="  launch a product  ").brief == "launch a product"


def test_brief_rejects_empty_string():
    with pytest.raises(ValidationError):
        BriefRequest(brief="")


def test_brief_rejects_whitespace_only():
    with pytest.raises(ValidationError):
        BriefRequest(brief="    ")


def test_brief_rejects_over_max_length():
    with pytest.raises(ValidationError):
        BriefRequest(brief="x" * (MAX_BRIEF_LEN + 1))


def test_brief_accepts_max_length():
    assert len(BriefRequest(brief="x" * MAX_BRIEF_LEN).brief) == MAX_BRIEF_LEN


def test_answers_accepts_normal_input():
    model = ClarificationAnswer(answers={"What is the budget?": "10k"})
    assert model.answers["What is the budget?"] == "10k"


def test_answers_rejects_too_many():
    with pytest.raises(ValidationError):
        ClarificationAnswer(answers={str(i): "a" for i in range(MAX_ANSWERS + 1)})


def test_answers_rejects_overlong_answer():
    with pytest.raises(ValidationError):
        ClarificationAnswer(answers={"q": "x" * (MAX_ANSWER_LEN + 1)})
