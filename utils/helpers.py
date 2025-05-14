"""Utility functions for dataset building."""
import hashlib
import logging
import json
import os
import random
import time
from typing import List, Dict, Any, Optional

def unique_id(text: str) -> str:
    """Generate a unique identifier for a text string."""
    return hashlib.sha1(text.encode()).hexdigest()

def load_life_events(file_path: str) -> List[str]:
    """Load life events from a JSON file.
    
    Args:
        file_path: Path to the JSON file containing life events.
        
    Returns:
        List of life event descriptions.
    """
    try:
        if not os.path.exists(file_path):
            logging.error(f"Life events file not found: {file_path}")
            return []
            
        with open(file_path, 'r') as f:
            events = json.load(f)
        
        logging.info(f"Loaded {len(events)} life events from {file_path}")
        return events
    except Exception as e:
        logging.error(f"Error loading life events: {e}")
        return []
