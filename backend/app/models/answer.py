from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


class AnswerType(str, Enum):
    text = "text"
    voice = "voice"
    skip = "skip"


class SubmitTextAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer_text: str


class SkipQuestionRequest(BaseModel):
    session_id: str
    question_id: str


class DescriptiveAnswerOut(BaseModel):
    question_id: str
    answer_type: AnswerType
    answer_text: str | None
    answered_at: datetime


class DescriptiveAnswerRecord(BaseModel):
    answer_type: AnswerType
    answer_text: str | None = None
    answered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))