"""
Configuration settings for the journal-llm application.
"""
import os
from typing import Optional

class Settings:
    """Application settings."""
    
    # OpenAI API settings
    OPENAI_API_KEY: Optional[str] = os.environ.get("OPENAI_API_KEY")
    
    # Default model settings
    DEFAULT_MODEL: str = "gpt-4o-mini"
    DEFAULT_TEMPERATURE: float = 0.7
    
    # Application paths
    TMP_DIR: str = os.path.join(os.getcwd(), "tmp")
    
    def __init__(self):
        """Initialize settings and create required directories."""
        os.makedirs(self.TMP_DIR, exist_ok=True)

# Create a singleton settings instance
settings = Settings()
