from datetime import datetime, timezone
from pydantic import BaseModel, Field


class RoadmapItem(BaseModel):
    step: int
    topic: str
    description: str
    target_skill_level: str  # e.g., "Intermediate", "Advanced"
    recommended_resources: list[str]


class FeedbackSection(BaseModel):
    overall_score: float  # 0 - 100 percentage
    mcq_score_percentage: float
    descriptive_score_percentage: float
    strengths: list[str]
    weak_topics: list[str]
    skipped_topics: list[str]
    suggestions: list[str]


class FullInterviewReport(BaseModel):
    session_id: str
    user_id: str
    difficulty: str
    feedback: FeedbackSection
    roadmap: list[RoadmapItem]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
