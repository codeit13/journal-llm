from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import BaseModel, Field
import uuid

class JournalEntry(BaseModel):
    """User's initial journal entry"""
    text: str

class JournalQuestion(BaseModel):
    """Follow-up question generated based on journal entry"""
    text: str

class JournalAnswer(BaseModel):
    """User's answer to a follow-up question"""
    question_index: int
    question: str
    answer: str

class Journal(Document):
    """Journal document model"""
    journal_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique ID for the journal entry")
    user_id: Optional[str] = Field(None, description="User ID for future authentication")
    entry: str = Field(..., description="User's journal entry text")
    mood: str = Field(..., description="Detected mood from the journal entry")
    mood_score: float = Field(..., description="Mood score from -10 (very negative) to 10 (very positive)")
    questions: List[str] = Field(..., description="Follow-up questions generated for the entry")
    answers: List[Optional[str]] = Field(default_factory=list, description="User's answers to the follow-up questions")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "journals"
        
    class Config:
        schema_extra = {
            "example": {
                "journal_id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "user123",
                "entry": "Today I had a productive day at work. I completed a major project and received positive feedback from my manager.",
                "questions": [
                    "What was the most meaningful part of your day?",
                    "Did anything happen today that made you feel challenged?",
                    "What's one thing you learned or realized today?",
                    "How did your actions today align with your personal values?",
                    "What would you like to focus on or improve tomorrow?"
                ],
                "answers": [
                    "The most meaningful part was seeing my hard work pay off.",
                    "I was challenged when I had to present to the team.",
                    "I learned that I work well under pressure.",
                    "My actions aligned with my value of dedication.",
                    "Tomorrow I want to focus on starting my next project."
                ],
                "created_at": "2025-05-18T10:00:00.000Z",
                "updated_at": "2025-05-18T11:30:00.000Z"
            }
        }

class UserStreak(Document):
    """User streak document model"""
    user_id: str
    streak_count: int = 0
    last_entry_date: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "user_streaks"
