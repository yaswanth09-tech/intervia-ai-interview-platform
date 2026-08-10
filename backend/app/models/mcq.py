"""
Pydantic models for the MCQ round: submitting a candidate's answers and
returning the scored results.

This module was referenced by app/routes/interview.py (generate-questions /
mcq-submit endpoints) but did not exist yet in the project - without it the
backend fails at import time with:
    ModuleNotFoundError: No module named 'app.models.mcq'
"""

from pydantic import BaseModel, Field


class MCQAnswer(BaseModel):
    """A single answer submitted by the candidate for one MCQ question."""
    question_id: str
    selected_option: str


class SubmitMCQAnswersRequest(BaseModel):
    """Body of POST /interview/mcq/submit."""
    session_id: str
    answers: list[MCQAnswer] = Field(default_factory=list)


class MCQScore(BaseModel):
    """Per-question scoring detail, returned as part of MCQRoundResults."""
    question_id: str
    selected: str | None = None
    correct_answer: str
    correct: bool


class MCQRoundResults(BaseModel):
    """Response shape for POST /interview/mcq/submit."""
    score_percentage: float
    correct_count: int
    total_questions: int
    question_results: list[MCQScore] = Field(default_factory=list)
