from datetime import datetime, timezone

from pydantic import BaseModel, Field


class EvaluationScores(BaseModel):
    correctness: int  # 0-10
    relevance: int
    completeness: int
    communication: int
    justification: str


class QuestionEvaluation(BaseModel):
    question_id: str
    question: str
    answer_text: str | None
    was_skipped: bool
    scores: EvaluationScores | None  # None if skipped
    keyword_overlap_ratio: float | None  # spaCy-based sanity signal, 0-1


class EvaluateSessionRequest(BaseModel):
    session_id: str


class EvaluateSessionResponse(BaseModel):
    session_id: str
    evaluations: list[QuestionEvaluation]
    evaluated_at: datetime


class EvaluationInDB(BaseModel):
    evaluations: list[dict]
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))