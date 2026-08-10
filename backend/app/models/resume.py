from datetime import datetime, timezone

from pydantic import BaseModel, Field


class EducationEntry(BaseModel):
    raw_text: str
    institution: str | None = None
    date_range: str | None = None


class ExperienceEntry(BaseModel):
    organization: str | None = None
    date_range: str | None = None
    details: list[str] = []


class ParsedResume(BaseModel):
    skills: list[str] = []
    education: list[EducationEntry] = []
    experience: list[ExperienceEntry] = []
    projects: list[str] = []
    certifications: list[str] = []
    raw_text_length: int = 0


class ResumeOut(BaseModel):
    id: str
    user_id: str
    filename: str
    parsed: ParsedResume
    created_at: datetime


class ResumeInDB(BaseModel):
    user_id: str
    filename: str
    parsed: ParsedResume
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
