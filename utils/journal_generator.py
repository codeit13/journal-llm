"""Journal entry and questions generator module."""
import logging
import time
from typing import List, Dict, Any, Optional, Tuple
import random
from concurrent.futures import ThreadPoolExecutor

from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from langchain.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from utils.helpers import unique_id

class JournalingQuestions(BaseModel):
    """Model for journaling follow-up questions."""
    questions: List[str] = Field(
        description="A list of max 5 insightful journaling questions that prompt deeper reflection",
    )

def create_llm(temperature: float = 0.8):
    """Create a ChatOpenAI instance.
    
    Args:
        temperature: Temperature parameter for the LLM.
        
    Returns:
        ChatOpenAI instance.
    """
    try:
        llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=temperature)
        return llm
    except Exception as e:
        logging.error(f"Error initializing ChatOpenAI: {e}")
        raise

def generate_journal_entry_from_event(life_event: str) -> str:
    """Generate a journal entry based on a life event.
    
    Args:
        life_event: Description of a life event.
        
    Returns:
        Generated journal entry.
    """
    prompt = (
        f"🎯 Generate a unique, authentic, and personal journal entry (1-2 short sentences) about this life event: {life_event}. "
        f"The entry should be in first person, as if someone is writing in their journal about experiencing this event. "
        f"Include specific details and emotions. Make it sound authentic and personal, as a norml averga ehuman would write in their digital journal in a journaling mental health app. "
        f"Avoid quotes or generic language."
    )
    
    try:
        llm = create_llm()
        response = llm.invoke([HumanMessage(content=prompt)])
        raw = response.content.strip()
        entry = raw.rstrip(".")
        
        # Add period back if needed for consistency
        if not entry.endswith("."):
            entry = entry + "."
            
        return entry
    except Exception as e:
        logging.error(f"Error generating journal entry: {e}")
        return f"Today I experienced {life_event}. It was a significant moment in my life that made me reflect on my journey."

def generate_followup_questions(entry: str) -> Dict[str, List[str]]:
    """Generate follow-up questions for a journal entry.
    
    Args:
        entry: Journal entry text.
        
    Returns:
        Dictionary containing follow-up questions.
    """
    prompt = (
        f"You are a compassionate journaling coach specialized in mental health and personal growth.\n\n"
        f"Given this journal entry:\n\"{entry}\"\n\n"
        f"Generate exactly 5 probing, open-ended follow-up questions that prompts the user to be more expressive and get most out of journaling:\n"
        f"1. Explore their emotions and feelings more deeply\n"
        f"2. Identify underlying patterns or triggers\n"
        f"3. Consider alternative perspectives\n"
        f"4. Connect with their values and goals\n"
        f"5. Develop actionable insights\n\n"
        f"Make questions empathetic, non-judgmental, and varied in focus."
    )
    
    try:
        llm = create_llm()
        llm = llm.with_structured_output(JournalingQuestions)
        result = llm.invoke(prompt)
        questions = result.model_dump()
        
        logging.info(f"Successfully generated follow-up questions")
        return questions
    except Exception as e:
        logging.error(f"Error generating follow-up questions: {e}")
        # Return default questions on error
        return {
            "questions": [
                "How did this experience make you feel?",
                "What thoughts came up for you during this moment?",
                "How does this connect to your broader life patterns?",
                "What might this experience be teaching you?",
                "How might you approach similar situations in the future?"
            ]
        }

def process_single_event(event: str) -> Dict[str, Any]:
    """Process a single life event to generate a journal entry and follow-up questions.
    
    Args:
        event: Description of a life event.
        
    Returns:
        Dictionary containing the journal entry and follow-up questions.
    """
    try:
        # Generate journal entry
        entry = generate_journal_entry_from_event(event)
        
        # Generate follow-up questions
        questions = generate_followup_questions(entry)
        
        return {
            "input": entry,
            "output": questions
        }
    except Exception as e:
        logging.error(f"Error processing event '{event}': {e}")
        # Return default entry and questions on error
        return {
            "input": f"Today I experienced {event}. It was a significant moment in my life that made me reflect on my journey.",
            "output": {
                "questions": [
                    "How did this experience make you feel?",
                    "What thoughts came up for you during this moment?",
                    "How does this connect to your broader life patterns?",
                    "What might this experience be teaching you?",
                    "How might you approach similar situations in the future?"
                ]
            }
        }

def batch_generate_entries_and_questions(events: List[str]) -> List[Dict[str, Any]]:
    """Generate journal entries and follow-up questions for a batch of life events.
    
    This function processes multiple events in parallel using ThreadPoolExecutor
    to improve efficiency when making multiple API calls.
    
    Args:
        events: List of life event descriptions.
        
    Returns:
        List of dictionaries containing journal entries and follow-up questions.
    """
    results = []
    
    try:
        # Process events in parallel using ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=5) as executor:
            # Submit all tasks
            future_to_event = {executor.submit(process_single_event, event): event for event in events}
            
            # Collect results as they complete
            for future in future_to_event:
                try:
                    result = future.result()
                    results.append(result)
                    logging.info(f"Completed processing event: {future_to_event[future][:30]}...")
                except Exception as e:
                    event = future_to_event[future]
                    logging.error(f"Error in thread processing event '{event}': {e}")
                    # Add default entry on error
                    results.append({
                        "input": f"Today I experienced {event}. It was a significant moment in my life that made me reflect on my journey.",
                        "output": {
                            "questions": [
                                "How did this experience make you feel?",
                                "What thoughts came up for you during this moment?",
                                "How does this connect to your broader life patterns?",
                                "What might this experience be teaching you?",
                                "How might you approach similar situations in the future?"
                            ]
                        }
                    })
    except Exception as e:
        logging.error(f"Error in batch processing: {e}")
    
    return results
