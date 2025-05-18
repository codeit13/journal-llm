"""
Journal Analyzer - A tool for analyzing and generating reflective questions from journal entries.

This script provides a simple command-line interface to the journal analysis functionality.
Supports both OpenAI and fine-tuned Hugging Face models.
"""
import sys
import os
from langchain_core.prompts import ChatPromptTemplate
from utils.helper import extract_json_from_string

# Add the parent directory to the path so we can import from ai_agent
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_agent.pydantic_types import JournalAnalysis
from ai_agent.llm import create_llm

def analyze_journal_entry(journal_text: str) -> JournalAnalysis:
    """
    Analyze a journal entry to extract mood and generate follow-up questions.
    
    Args:
        journal_text: The journal entry text to analyze
        
    Returns:
        JournalAnalysis object containing mood and questions
    """
    try:
        # llm = create_llm("ollama")
        llm = create_llm("openai")

        # Create the prompt
        prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

        ### Instruction:
        Given a journal entry. Generate 5 follow-up questions for the user.

        ### Input:
        {input}
        
        Format your response as a JSON object with the following structure:
        {{
            "mood": "<mood of the journal entry>",
            "mood_score": <int out of 100>,
            "questions": ["...", "...", ]
        }}

        ### Response:
        """

        prompt = ChatPromptTemplate.from_template(prompt)

        # Call the LLM
        model = prompt | llm
        response = model.invoke({"input": journal_text})
        if isinstance(response, str):
            content = response
        else:
            content = response.content
        

        print("******************************")
        print(content)
        print("******************************")
        
        # Parse the response
        result = extract_json_from_string(content)
        
        # Create and return the JournalAnalysis object
        return JournalAnalysis(
            mood=result.get("mood", "neutral"),
            mood_score=result.get("mood_score", 67.4),
            questions=result['questions']
        )
    except Exception as e:
        print("Error analyzing journal entry:", e)
        # Fallback for error cases
        return JournalAnalysis(
            mood="neutral",
            mood_score=67.4,
            questions=[
                "What was the most meaningful part of your day?",
                "Did anything happen today that made you feel challenged or uncomfortable?",
                "What's one thing you learned or realized today?",
                "How did your actions today align with your personal values?",
                "What would you like to focus on or improve tomorrow?"
            ]
        )

