from fastapi import APIRouter, Form, HTTPException, status
from typing import Dict, Any
from datetime import datetime
from ai_agent.run import analyze_journal_entry
from models.journal import Journal

router = APIRouter(prefix="/api", tags=["agent"])

@router.post("/journal-analysis", status_code=status.HTTP_200_OK)
async def analyze_journal(
    journal_text: str = Form(...),
) -> Dict[str, Any]:
    """Analyze a journal entry to extract mood and generate follow-up questions"""
    # Validate journal text
    if not journal_text or len(journal_text.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="Journal text cannot be empty"
        )
    
    try:
        # Analyze the journal entry
        analysis = analyze_journal_entry(journal_text)
        
        # Create a new journal entry in the database
        journal = Journal(
            entry=journal_text,
            mood=analysis.mood,
            mood_score=analysis.mood_score,
            questions=analysis.questions,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Save to database
        await journal.insert()
        
        # Return the analysis result with the journal ID
        return {
            "success": True,
            "journalId": journal.journal_id,
            "mood": analysis.mood,
            "mood_score": analysis.mood_score,
            "questions": analysis.questions
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze journal entry: {str(e)}"
        )
