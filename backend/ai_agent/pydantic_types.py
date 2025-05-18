from pydantic import BaseModel, Field
from typing import List

class JournalAnalysis(BaseModel):
    """Represents the analysis of a journal entry."""
    mood: str = Field(..., description="The overall mood detected in the journal entry")
    mood_score: float = Field(..., description="Mood score from -10 (very negative) to 10 (very positive)")
    questions: List[str] = Field(..., description="Five follow-up questions based on the journal entry")
