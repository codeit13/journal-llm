import time
import json
import os
import random
import dotenv
import logging
from pathlib import Path
from typing import List, Dict, Any

# Import modules from the build_dataset package
from utils.helpers import load_life_events
from utils.journal_generator import process_single_event

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
dotenv.load_dotenv()

# Check for API key
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is not set. Please set it in your .env file.")

def save_entry_to_jsonl(entry: Dict[str, Any], out_path: str) -> None:
    """Save a single entry to a JSONL file.
    
    Args:
        entry: Dictionary containing a journal entry and follow-up questions.
        out_path: Path to the output JSONL file.
    """
    with open(out_path, "a") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    logging.info(f"✅ Saved entry to {out_path}")

def build_dataset_from_life_events(life_events: List[str], num_samples: int, out_path: str) -> List[Dict[str, Any]]:
    """Build a dataset of journal entries and follow-up questions from life events.
    
    Args:
        life_events: List of life event descriptions.
        num_samples: Number of samples to generate. Will be capped by the number of life events.
        out_path: Path to the output JSONL file.
        
    Returns:
        List of dictionaries containing journal entries and follow-up questions.
    """
    # Use only the requested number of samples, or all life events if fewer
    events_to_use = life_events[:num_samples] if num_samples < len(life_events) else life_events
    
    # Shuffle the events to get random ones each time
    random.shuffle(events_to_use)
    
    # Initialize output file
    with open(out_path, "w") as f:
        pass  # Create empty file or clear existing one
    
    logging.info(f"Building dataset with {len(events_to_use)} life events...")
    
    all_data = []
    
    try:
        # Process each event one by one
        for i, event in enumerate(events_to_use):
            logging.info(f"Processing event {i+1}/{len(events_to_use)}: {event[:30]}...")
            
            # Process single event
            entry = process_single_event(event)
            
            # Format questions
            entry["output"] = '\n'.join([f"{questionId+1}. {q}" for questionId, q in enumerate(entry["output"]["questions"])])
            
            # Save entry to file immediately
            save_entry_to_jsonl(entry, out_path)
            
            # Add to full dataset
            all_data.append(entry)
            
    except Exception as e:
        logging.error(f"Error building dataset: {e}")
    
    return all_data

if __name__ == "__main__":
    try:
        # Path to life events file
        life_events_path = Path(__file__).parent / "utils" / "life_events.json"
        
        # Load life events
        life_events = load_life_events(str(life_events_path))
        
        if not life_events:
            logging.error(f"No life events found in {life_events_path}")
            print(f"❌ No life events found in {life_events_path}")
            exit(1)
            
        # Number of samples to generate
        N = 5  # Number of samples to generate - set to your desired value
        
        # Output path
        out_path = "dataset.jsonl"
        
        # Build the dataset - now saves incrementally to the JSONL file
        logging.info(f"Starting dataset generation with up to {N} samples")
        data = build_dataset_from_life_events(life_events, N, out_path)
        
        logging.info(f"✅ Successfully generated {len(data)} unique records → {out_path}")
        print(f"✅ Generated {len(data)} unique records → {out_path}")
    except Exception as e:
        logging.error(f"Dataset generation failed: {e}")
        print(f"❌ Dataset generation failed: {e}")

