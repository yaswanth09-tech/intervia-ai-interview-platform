from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


# (mcq_count, descriptive_count) per your project spec
DIFFICULTY_CONFIG = {
    Difficulty.easy: {"mcq_count": 5, "descriptive_count": 5},
    Difficulty.medium: {"mcq_count": 10, "descriptive_count": 5},
    Difficulty.hard: {"mcq_count": 15, "descriptive_count": 10},
}


class MCQQuestion(BaseModel):
    id: str
    question: str
    options: list[str]
    correct_answer: str  # stored server-side; never sent back to a client mid-quiz view if hidden


class DescriptiveQuestion(BaseModel):
    id: str
    question: str
    topic: str


class GenerateQuestionsRequest(BaseModel):
    resume_id: str
    difficulty: Difficulty


class MCQQuestionPublic(BaseModel):
    """What the client sees before answering - no correct_answer field."""
    id: str
    question: str
    options: list[str]


class GenerateQuestionsResponse(BaseModel):
    session_id: str
    difficulty: Difficulty
    mcq_count: int
    descriptive_count: int
    created_at: datetime


class InterviewSessionInDB(BaseModel):
    user_id: str
    resume_id: str
    difficulty: Difficulty
    mcqs: list[dict]
    descriptive: list[dict]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))