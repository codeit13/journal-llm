import json
import os
import sys
from typing import Dict, Any, List, Optional

# Add the parent directory to the path so we can import from ai_agent
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langgraph.graph import StateGraph, START, END
from ai_agent.utils.llm import create_llm
from ai_agent.pydantic_types import JournalEntry, MoodAnalysis, TopicAnalysis, ReflectionQuestions, JournalResponse

def parse_journal_entry_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse a user's journal entry to extract structured information.
    """
    journal_text = state["journal_text"]
    journal_llm = create_llm().with_structured_output(JournalEntry)

    messages = [
        (
            "system",
            f"""
            Extract structured information from this journal entry. Identify:
            - Any dates mentioned
            - Words or phrases indicating mood
            - Main topics discussed
            - People mentioned
            - Activities described
            - Locations or places mentioned
            
            The journal entry is:
            {journal_text}
            """
        )
    ]

    try:
        journal_structured = journal_llm.invoke(messages)
        journal_structured = journal_structured.model_dump()
        print("✅ Journal Entry Parsed")
    except Exception as e:
        print(f"Error parsing journal entry: {str(e)}")
        # Fallback structure
        journal_structured = {
            "raw_text": journal_text,
            "date": None,
            "mood_indicators": [],
            "key_topics": [],
            "people_mentioned": [],
            "activities": [],
            "locations": []
        }

    return {**state, "journal_structured": journal_structured}


def analyze_mood_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze the mood from the journal entry.
    """
    journal_structured = state["journal_structured"]
    journal_text = journal_structured["raw_text"]
    mood_indicators = journal_structured["mood_indicators"]
    
    mood_llm = create_llm().with_structured_output(MoodAnalysis)
    
    messages = [
        (
            "system",
            f"""
            Analyze the mood in this journal entry. Consider:
            - The overall tone of the writing
            - Specific mood indicators: {', '.join(mood_indicators) if mood_indicators else 'None detected'}
            - Emotional language used
            - Context of events described
            
            Provide:
            - Primary mood (e.g., happy, sad, anxious, excited, etc.)
            - A mood score from -10 (extremely negative) to 10 (extremely positive)
            - Words/phrases that indicate mood
            - A brief analysis explaining your assessment
            
            The journal entry is:
            {journal_text}
            """
        )
    ]
    
    try:
        mood_analysis = mood_llm.invoke(messages)
        mood_analysis = mood_analysis.model_dump()
        print("✅ Mood Analysis Complete")
    except Exception as e:
        print(f"Error analyzing mood: {str(e)}")
        # Fallback structure
        mood_analysis = {
            "primary_mood": "neutral",
            "mood_score": 0.0,
            "mood_indicators": mood_indicators or [],
            "mood_analysis": "Unable to analyze mood from the provided text."
        }
    
    return {**state, "mood_analysis": mood_analysis}


def analyze_topics_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze the main topics from the journal entry.
    """
    journal_structured = state["journal_structured"]
    journal_text = journal_structured["raw_text"]
    key_topics = journal_structured["key_topics"]
    
    topic_llm = create_llm().with_structured_output(TopicAnalysis)
    
    messages = [
        (
            "system",
            f"""
            Analyze the main topics in this journal entry. Consider:
            - Key themes mentioned: {', '.join(key_topics) if key_topics else 'None detected'}
            - Recurring subjects
            - What seems most important to the writer
            - Underlying concerns or interests
            
            Provide:
            - A list of main topics identified
            - Importance score for each topic (0-10)
            - A brief analysis explaining the significance of these topics
            
            The journal entry is:
            {journal_text}
            """
        )
    ]
    
    try:
        topic_analysis = topic_llm.invoke(messages)
        topic_analysis = topic_analysis.model_dump()
        print("✅ Topic Analysis Complete")
    except Exception as e:
        print(f"Error analyzing topics: {str(e)}")
        # Fallback structure
        topic_analysis = {
            "main_topics": key_topics or ["general"],
            "topic_importance": [5.0] * len(key_topics or ["general"]),
            "topic_analysis": "Unable to analyze topics from the provided text."
        }
    
    return {**state, "topic_analysis": topic_analysis}


def generate_questions_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate 5 open-ended reflection questions based on the journal entry.
    """
    journal_structured = state["journal_structured"]
    journal_text = journal_structured["raw_text"]
    mood_analysis = state["mood_analysis"]
    topic_analysis = state["topic_analysis"]
    
    questions_llm = create_llm().with_structured_output(ReflectionQuestions)
    
    messages = [
        (
            "system",
            f"""
            Based on this journal entry, generate 5 thoughtful, open-ended reflection questions that will help the user gain deeper insights about themselves and their experiences. Consider:
            
            - Primary mood: {mood_analysis['primary_mood']}
            - Main topics: {', '.join(topic_analysis['main_topics'])}
            - People mentioned: {', '.join(journal_structured['people_mentioned']) if journal_structured['people_mentioned'] else 'None'}
            - Activities: {', '.join(journal_structured['activities']) if journal_structured['activities'] else 'None'}
            
            The questions should:
            - Be thought-provoking and encourage deeper reflection
            - Address underlying feelings, motivations, or patterns
            - Help the user gain new perspectives
            - Be specific to their situation, not generic
            - Be phrased in a supportive, non-judgmental way
            
            For each question, provide context explaining why you're asking it.
            
            The journal entry is:
            {journal_text}
            """
        )
    ]
    
    try:
        reflection_questions = questions_llm.invoke(messages)
        reflection_questions = reflection_questions.model_dump()
        print("✅ Reflection Questions Generated")
    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        # Fallback structure
        reflection_questions = {
            "questions": [
                "How did you feel about the events you described?",
                "What patterns do you notice in your reactions?",
                "What would you do differently next time?",
                "What are you grateful for in this situation?",
                "What have you learned from this experience?"
            ],
            "question_context": [
                "Understanding your emotions helps with self-awareness.",
                "Identifying patterns helps recognize behavioral tendencies.",
                "Considering alternatives promotes growth and learning.",
                "Practicing gratitude improves wellbeing and perspective.",
                "Reflecting on lessons learned reinforces personal development."
            ]
        }
    
    return {**state, "reflection_questions": reflection_questions}


def create_journal_response_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create the final journal response that combines all analyses and questions.
    """
    journal_structured = state["journal_structured"]
    journal_text = journal_structured["raw_text"]
    mood_analysis = state["mood_analysis"]
    topic_analysis = state["topic_analysis"]
    reflection_questions = state["reflection_questions"]
    
    response_llm = create_llm().with_structured_output(JournalResponse)
    
    messages = [
        (
            "system",
            f"""
            Create a thoughtful response to the user's journal entry that includes:
            
            1. A brief analysis of their entry
            2. The mood analysis you've already performed
            3. The topic analysis you've already performed
            4. The reflection questions you've already generated
            5. A summary with insights and gentle suggestions
            
            Your response should be empathetic, supportive, and personalized to their specific situation.
            
            Journal entry: {journal_text}
            
            Mood analysis: {mood_analysis['primary_mood']} (Score: {mood_analysis['mood_score']})
            Mood indicators: {', '.join(mood_analysis['mood_indicators'])}
            Mood assessment: {mood_analysis['mood_analysis']}
            
            Topic analysis:
            Topics: {', '.join(topic_analysis['main_topics'])}
            Topic assessment: {topic_analysis['topic_analysis']}
            
            Reflection questions:
            {chr(10).join([f'- {q}' for q in reflection_questions['questions']])}
            """
        )
    ]
    
    try:
        journal_response = response_llm.invoke(messages)
        journal_response = journal_response.model_dump()
        print("✅ Journal Response Created")
    except Exception as e:
        print(f"Error creating journal response: {str(e)}")
        # Fallback structure
        journal_response = {
            "entry_analysis": "Thank you for sharing your thoughts in this journal entry.",
            "mood_analysis": mood_analysis,
            "topic_analysis": topic_analysis,
            "reflection_questions": reflection_questions,
            "summary": "I hope these reflections and questions help you gain new insights."
        }
    
    # Format the output for presentation
    formatted_output = format_journal_output(state, journal_response)
    
    return {**state, "journal_response": journal_response, "formatted_output": formatted_output}


def format_journal_output(state: Dict[str, Any], journal_response: Dict[str, Any]) -> str:
    """
    Format the journal response for presentation.
    """
    output = "# Journal Analysis\n\n"
    
    # Add entry analysis
    output += "## Overview\n"
    output += f"{journal_response['entry_analysis']}\n\n"
    
    # Add mood analysis
    output += "## Mood Analysis\n"
    output += f"**Primary Mood**: {journal_response['mood_analysis']['primary_mood']}\n"
    output += f"**Mood Score**: {journal_response['mood_analysis']['mood_score']}\n"
    output += f"**Analysis**: {journal_response['mood_analysis']['mood_analysis']}\n\n"
    
    # Add topic analysis
    output += "## Topics Identified\n"
    for i, topic in enumerate(journal_response['topic_analysis']['main_topics']):
        importance = journal_response['topic_analysis']['topic_importance'][i] if i < len(journal_response['topic_analysis']['topic_importance']) else 5.0
        output += f"- **{topic}** (Importance: {importance}/10)\n"
    output += f"\n**Analysis**: {journal_response['topic_analysis']['topic_analysis']}\n\n"
    
    # Add reflection questions
    output += "## Reflection Questions\n"
    for i, question in enumerate(journal_response['reflection_questions']['questions']):
        context = journal_response['reflection_questions']['question_context'][i] if i < len(journal_response['reflection_questions']['question_context']) else ""
        output += f"**{i+1}. {question}**\n"
        if context:
            output += f"   *Why this matters: {context}*\n\n"
    
    # Add summary
    output += "## Summary\n"
    output += f"{journal_response['summary']}\n"
    
    return output
