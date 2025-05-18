from fastapi import APIRouter, HTTPException, BackgroundTasks, status, Depends
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from models.journal import Journal, JournalEntry, JournalAnswer, UserStreak
from ai_agent.run import analyze_journal_entry
from beanie import PydanticObjectId
import uuid

router = APIRouter(prefix="/api", tags=["journal"])

# Request and response models
class JournalEntryRequest(BaseModel):
    journalEntry: str

class JournalAnswersRequest(BaseModel):
    journalId: str
    answers: List[JournalAnswer]

class JournalResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    journalId: Optional[str] = None
    mood: Optional[str] = None
    mood_score: Optional[float] = None
    questions: Optional[List[str]] = None

class StreakResponse(BaseModel):
    success: bool
    streakCount: int
    lastEntryDate: datetime

# Helper function to update user streak
async def update_user_streak(user_id: str = "default_user") -> int:
    """Update the user's streak count and return the current streak"""
    # For now, we're using a default user ID since authentication isn't implemented
    streak = await UserStreak.find_one({"user_id": user_id})
    
    if not streak:
        # First journal entry, create a new streak
        streak = UserStreak(user_id=user_id, streak_count=1)
        await streak.insert()
        return 1
    
    # Check if the last entry was within the last 48 hours (allowing for some flexibility)
    now = datetime.utcnow()
    time_diff = now - streak.last_entry_date
    
    if time_diff <= timedelta(hours=48):
        # If the last entry was within 48 hours, update the streak
        # But only increment if it's a new day
        if streak.last_entry_date.date() < now.date():
            streak.streak_count += 1
    else:
        # Streak broken, reset to 1
        streak.streak_count = 1
    
    # Update the last entry date
    streak.last_entry_date = now
    await streak.save()
    
    return streak.streak_count

@router.post("/journal/answers", response_model=JournalResponse)
async def save_journal_answers(answers_request: JournalAnswersRequest):
    """
    Save answers to follow-up questions
    """
    try:
        # Find the journal entry
        journal = await Journal.find_one({"journal_id": answers_request.journalId})
        if not journal:
            raise HTTPException(
                status_code=404,
                detail=f"Journal with ID {answers_request.journalId} not found"
            )
        
        # Update answers
        for answer in answers_request.answers:
            if 0 <= answer.question_index < len(journal.questions):
                # Ensure the answer array is large enough
                while len(journal.answers) <= answer.question_index:
                    journal.answers.append(None)
                
                journal.answers[answer.question_index] = answer.answer
        
        # Update the journal entry
        journal.updated_at = datetime.utcnow()
        await journal.save()
        
        return {
            "success": True,
            "message": "Answers saved successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save answers: {str(e)}"
        )

@router.get("/journals", response_model=Dict[str, Any])
async def get_journals(limit: int = 10, skip: int = 0):
    """
    Get the user's journal history
    """
    try:
        # For now, we're not filtering by user since authentication isn't implemented
        journals = await Journal.find_all().sort("-created_at").skip(skip).limit(limit).to_list()
        
        # Format the response
        formatted_journals = []
        for journal in journals:
            formatted_journals.append({
                "id": journal.journal_id,
                "date": journal.created_at,
                "entry": journal.entry,
                "questions": journal.questions,
                "answers": journal.answers,
                "updated_at": journal.updated_at
            })
        
        return {
            "success": True,
            "journals": formatted_journals,
            "total": await Journal.find_all().count()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch journals: {str(e)}"
        )

@router.get("/journal/{journal_id}", response_model=Dict[str, Any])
async def get_journal(journal_id: str):
    """
    Get a specific journal entry by ID
    """
    try:
        journal = await Journal.find_one({"journal_id": journal_id})
        if not journal:
            raise HTTPException(
                status_code=404,
                detail=f"Journal with ID {journal_id} not found"
            )
        
        return {
            "success": True,
            "journal": {
                "id": journal.journal_id,
                "date": journal.created_at,
                "entry": journal.entry,
                "questions": journal.questions,
                "answers": journal.answers,
                "updated_at": journal.updated_at
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch journal: {str(e)}"
        )

@router.get("/user/streak", response_model=StreakResponse)
async def get_user_streak():
    """
    Get the user's current journaling streak
    """
    try:
        # For now, we're using a default user ID since authentication isn't implemented
        user_id = "default_user"
        streak = await UserStreak.find_one({"user_id": user_id})
        
        if not streak:
            return {
                "success": True,
                "streakCount": 0,
                "lastEntryDate": datetime.utcnow()
            }
        
        return {
            "success": True,
            "streakCount": streak.streak_count,
            "lastEntryDate": streak.last_entry_date
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user streak: {str(e)}"
        )
