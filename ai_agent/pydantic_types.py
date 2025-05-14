from pydantic import BaseModel, Field
from typing import Optional, List


class JournalEntry(BaseModel):
    """Represents a user's journal entry with parsed content and metadata."""
    raw_text: str = Field(..., description="User's original journal entry text")
    date: Optional[str] = Field(None, description="Date mentioned in the journal entry")
    mood_indicators: List[str] = Field(default_factory=list, description="Words or phrases indicating mood")
    key_topics: List[str] = Field(default_factory=list, description="Main topics discussed in the entry")
    people_mentioned: List[str] = Field(default_factory=list, description="People mentioned in the entry")
    activities: List[str] = Field(default_factory=list, description="Activities mentioned in the entry")
    locations: List[str] = Field(default_factory=list, description="Places mentioned in the entry")


class MoodAnalysis(BaseModel):
    """Analysis of the user's mood based on their journal entry."""
    primary_mood: str = Field(..., description="Primary detected mood")
    mood_score: float = Field(..., description="Mood score from -10 (very negative) to 10 (very positive)")
    mood_indicators: List[str] = Field(..., description="Words or phrases that indicate mood")
    mood_analysis: str = Field(..., description="Brief analysis of the mood")

class TopicAnalysis(BaseModel):
    """Analysis of the main topics in the journal entry."""
    main_topics: List[str] = Field(..., description="Main topics identified")
    topic_importance: List[float] = Field(..., description="Importance score for each topic (0-10)")
    topic_analysis: str = Field(..., description="Brief analysis of the topics")

class ReflectionQuestions(BaseModel):
    """Open-ended questions generated based on the journal entry."""
    questions: List[str] = Field(..., description="List of 5 open-ended questions")
    question_context: List[str] = Field(..., description="Context or reasoning behind each question")


class JournalResponse(BaseModel):
    """Complete response to a journal entry, including analysis and questions."""
    entry_analysis: str = Field(..., description="Brief analysis of the journal entry")
    mood_analysis: MoodAnalysis = Field(..., description="Analysis of the user's mood")
    topic_analysis: TopicAnalysis = Field(..., description="Analysis of the topics discussed")
    reflection_questions: ReflectionQuestions = Field(..., description="Generated reflection questions")
    summary: str = Field(..., description="Summary of insights and suggestions")


