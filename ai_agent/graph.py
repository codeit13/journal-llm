from typing import Annotated, TypedDict, Any, Dict, List
import urllib
import os
import argparse
import time
import json
import sys

# Add the parent directory to the path so we can import from ai_agent
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langgraph.graph import StateGraph, START, END
from ai_agent.nodes import (
    parse_journal_entry_node, 
    analyze_mood_node, 
    analyze_topics_node, 
    generate_questions_node, 
    create_journal_response_node
)
from ai_agent.pydantic_types import JournalEntry, MoodAnalysis, TopicAnalysis, ReflectionQuestions, JournalResponse

def create_graph():
    class State(TypedDict):
        """State definition for the journal analysis agent graph"""
        journal_text: str
        journal_structured: JournalEntry
        mood_analysis: MoodAnalysis
        topic_analysis: TopicAnalysis
        reflection_questions: ReflectionQuestions
        journal_response: JournalResponse
        formatted_output: str

    workflow = StateGraph(State)

    # Add nodes
    workflow.add_node("JournalParser", parse_journal_entry_node)
    workflow.add_node("MoodAnalyzer", analyze_mood_node)
    workflow.add_node("TopicAnalyzer", analyze_topics_node)
    workflow.add_node("QuestionGenerator", generate_questions_node)
    workflow.add_node("ResponseCreator", create_journal_response_node)

    # Add Edges
    workflow.add_edge(START, "JournalParser")
    workflow.add_edge("JournalParser", "MoodAnalyzer")
    workflow.add_edge("MoodAnalyzer", "TopicAnalyzer")
    workflow.add_edge("TopicAnalyzer", "QuestionGenerator")
    workflow.add_edge("QuestionGenerator", "ResponseCreator")
    workflow.add_edge("ResponseCreator", END)

    graph = workflow.compile()

    try:
        os.makedirs('tmp', exist_ok=True)
        graph.get_graph().draw_mermaid_png(
            output_file_path='tmp/graph.png')
        print("✅ Graph visualization saved to tmp/graph.png")
    except Exception as e:
        print(f"Warning: Could not generate graph visualization: {str(e)}")

    return graph


def extract_text_from_file(file_path: str) -> str:
    """
    Extract text from a file based on its extension.

    Args:
        file_path (str): Path to the file.

    Returns:
        str: Extracted text.
    """
    file_extension = os.path.splitext(file_path)[1].lower()

    if file_extension == ".txt":
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        print(f"Unsupported file format: {file_extension}")
        return ""





def run_journal_analyzer(journal_text: str) -> dict:
    """
    Executes the compiled LangGraph with the given journal text and returns the full state including
    structured journal entry, mood analysis, topic analysis, reflection questions, and formatted response.

    :param journal_text: User's journal entry text
    :return: A dict containing the complete analysis and response
    """
    initial_state = {
        "journal_text": journal_text
    }
    graph = create_graph()
    result = graph.invoke(initial_state)
    return result


def main():
    parser = argparse.ArgumentParser(description="AI Journal Analyzer")
    parser.add_argument("--journal", type=str, required=True,
                        help="Path to journal entry file or direct text")
    parser.add_argument("--output", type=str,
                        default="journal_analysis.md", help="Output file path")

    args = parser.parse_args()

    # Get journal text from file or direct input
    if os.path.isfile(args.journal):
        print(f"📄 Reading journal entry from: {args.journal}")
        journal_text = extract_text_from_file(args.journal)

        if not journal_text:
            print("Error: Failed to extract text from journal file")
            return
    else:
        # Assume the journal text is directly provided
        journal_text = args.journal

    # Create and run the graph
    print("🚀 Running AI Journal Analyzer...")
    start_time = time.time()
    result = run_journal_analyzer(journal_text)
    end_time = time.time()

    # Write output to file
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(result["formatted_output"])

    # Print summary
    print(f"\n✅ Analysis completed in {end_time - start_time:.2f} seconds")
    print(f"📝 Results saved to {args.output}")
    print(f"\nMood detected: {result['mood_analysis']['primary_mood']}")
    print(f"Main topics: {', '.join(result['topic_analysis']['main_topics'])}")
    print(f"\nGenerated {len(result['reflection_questions']['questions'])} reflection questions")

    # Save full results as JSON for debugging
    with open(f"{args.output}.json", "w", encoding="utf-8") as f:
        # Convert to dict for JSON serialization
        result_dict = {k: v for k, v in result.items()}
        json.dump(result_dict, f, indent=2, ensure_ascii=False)

    print(f"✅ Full structured results saved to {args.output}.json")


if __name__ == "__main__":
    main()
