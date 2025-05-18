from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
import os
import dotenv
from langchain_openai import ChatOpenAI

# Load environment variables
dotenv.load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Check for API key
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is not set. Please set it in your .env file.")

# Initialize the LLM
try:
    llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0.7)
except Exception as e:
    logging.error(f"Error initializing ChatOpenAI: {e}")
    raise

# Define Pydantic models
class JournalEntry(BaseModel):
    """Model for a journal entry from the user."""
    content: str = Field(..., description="The journal entry content")

class JournalingQuestions(BaseModel):
    """Model for journaling follow-up questions."""
    questions: List[str] = Field(
        description="A list of insightful journaling questions that prompt deeper reflection",
        min_items=1,
        max_items=5
    )

class JournalResponse(BaseModel):
    """Model for the response to a journal entry."""
    questions: List[str] = Field(..., description="Follow-up questions for the journal entry")
    message: Optional[str] = Field(None, description="Optional message to the user")

# Create FastAPI app
app = FastAPI(title="Intellect Journaling API", version="1.0.0")

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/journal", response_model=JournalResponse)
async def process_journal_entry(entry: JournalEntry = Body(...)):
    """
    Process a journal entry and return follow-up questions.
    
    This endpoint takes a journal entry from the user and returns
    thoughtful follow-up questions to prompt deeper reflection.
    """
    try:
        # Create a prompt for the LLM
        prompt = (
            f"You are a compassionate journaling coach specialized in mental health and personal growth.\n\n"
            f"Given this journal entry:\n\"{entry.content}\"\n\n"
            f"Generate between 1-5 probing, open-ended follow-up questions that help the writer:\n"
            f"1. Explore their emotions and feelings more deeply\n"
            f"2. Identify underlying patterns or triggers\n"
            f"3. Consider alternative perspectives\n"
            f"4. Connect with their values and goals\n"
            f"5. Develop actionable insights\n\n"
            f"Make questions empathetic, non-judgmental, and varied in focus."
        )
        
        # Use structured_output to get a properly formatted response
        result = llm.structured_output(JournalingQuestions, prompt)
        
        # Log successful generation
        logging.info(f"Generated {len(result.questions)} follow-up questions")
        
        # Return the response
        return JournalResponse(
            questions=result.questions,
            message="Thank you for sharing. Here are some questions to help you reflect further."
        )
    
    except Exception as e:
        logging.error(f"Error processing journal entry: {e}")
        # Return default questions on error
        default_questions = [
            "How did this experience make you feel?",
            "What thoughts came up for you during this moment?",
            "How does this connect to your broader life patterns?",
            "What might this experience be teaching you?",
            "How might you approach similar situations in the future?"
        ]
        return JournalResponse(
            questions=default_questions,
            message="I've prepared some reflection questions for you."
        )

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "Intellect Journaling API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("journal_api:app", host="0.0.0.0", port=8000, reload=True)
