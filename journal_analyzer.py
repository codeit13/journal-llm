#!/usr/bin/env python3
"""
Journal Analyzer - A tool for analyzing and generating reflective questions from journal entries.

This script provides a simple command-line interface to the journal analysis functionality.
"""
import sys
import os
import argparse
from ai_agent.graph import run_journal_analyzer

def main():
    """Main entry point for the journal analyzer."""
    parser = argparse.ArgumentParser(
        description="Analyze journal entries and generate reflective questions"
    )
    parser.add_argument(
        "journal_path", 
        help="Path to a text file containing your journal entry"
    )
    parser.add_argument(
        "-o", "--output", 
        default="journal_analysis.md",
        help="Path to save the analysis output (default: journal_analysis.md)"
    )
    args = parser.parse_args()
    
    # Check if the journal file exists
    if not os.path.exists(args.journal_path):
        print(f"Error: Journal file '{args.journal_path}' not found.")
        return 1
    
    # Read the journal entry
    try:
        with open(args.journal_path, 'r', encoding='utf-8') as f:
            journal_text = f.read()
    except Exception as e:
        print(f"Error reading journal file: {str(e)}")
        return 1
    
    # Run the journal analyzer
    print(f"Analyzing journal entry from: {args.journal_path}")
    print("This may take a moment...")
    
    try:
        result = run_journal_analyzer(journal_text)
        
        # Save the analysis to the output file
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(result["formatted_output"])
        
        print(f"\n✅ Analysis complete!")
        print(f"📝 Results saved to: {args.output}")
        print(f"\nMood detected: {result['mood_analysis']['primary_mood']}")
        print(f"Main topics: {', '.join(result['topic_analysis']['main_topics'])}")
        print(f"\nGenerated {len(result['reflection_questions']['questions'])} reflection questions")
        
        # Show the first question as a preview
        if result['reflection_questions']['questions']:
            print(f"\nSample question: {result['reflection_questions']['questions'][0]}")
            print("\nOpen the output file to see all questions and the full analysis.")
    
    except Exception as e:
        print(f"Error analyzing journal entry: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
