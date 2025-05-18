import time
import json
import os
import random
import dotenv
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor

# Import modules from the build_dataset package
from build_dataset.utils import unique_id, load_life_events
from build_dataset.journal_generator import create_llm, generate_journal_entry_from_event, generate_followup_questions, batch_generate_entries_and_questions

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
dotenv.load_dotenv()

# Check for API key
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is not set. Please set it in your .env file.")

def save_batch_to_jsonl(batch_data: List[Dict[str, Any]], out_path: str) -> None:
    """Save a batch of data to a JSONL file.
    
    Args:
        batch_data: List of dictionaries containing journal entries and follow-up questions.
        out_path: Path to the output JSONL file.
    """
    with open(out_path, "a") as f:
        for row in batch_data:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    logging.info(f"✅ Saved {len(batch_data)} records to {out_path}")

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
    
    # Process in batches of 50
    BATCH_SIZE = 50
    all_data = []
    
    try:
        for batch_start in range(0, len(events_to_use), BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, len(events_to_use))
            batch_events = events_to_use[batch_start:batch_end]
            
            logging.info(f"Processing batch {batch_start//BATCH_SIZE + 1}: events {batch_start+1} to {batch_end}")
            
            # Process batch of events
            batch_data = batch_generate_entries_and_questions(batch_events)
            
            # Format questions
            for item in batch_data:
                item["output"] = '\n'.join([f"{questionId+1}. {q}" for questionId, q in enumerate(item["output"]["questions"])])
            
            # Save batch to file immediately
            save_batch_to_jsonl(batch_data, out_path)
            
            # Add to full dataset
            all_data.extend(batch_data)
            
    except Exception as e:
        logging.error(f"Error building dataset: {e}")
    
    return all_data

if __name__ == "__main__":
    try:
        # Path to life events file
        life_events_path = Path(__file__).parent / "build_dataset" / "life_events.json"
        
        # Load life events
        life_events = load_life_events(str(life_events_path))
        
        if not life_events:
            logging.error(f"No life events found in {life_events_path}")
            print(f"❌ No life events found in {life_events_path}")
            exit(1)
            
        # Number of samples to generate
        N = 400  # Number of samples to generate - set to your desired value
        
        # Output path
        out_path = "train.jsonl"
        
        # Build the dataset - now saves incrementally to the JSONL file
        logging.info(f"Starting dataset generation with up to {N} samples")
        data = build_dataset_from_life_events(life_events, N, out_path)
        
        logging.info(f"✅ Successfully generated {len(data)} unique records → {out_path}")
        print(f"✅ Generated {len(data)} unique records → {out_path}")
    except Exception as e:
        logging.error(f"Dataset generation failed: {e}")
        print(f"❌ Dataset generation failed: {e}")

