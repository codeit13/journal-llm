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
    DEFAULT_MODEL: str = "gpt-3.5-turbo"
    DEFAULT_TEMPERATURE: float = 0.7
    
    # Application paths
    TMP_DIR: str = os.path.join(os.path.dirname(__file__), "tmp")
    
    def __init__(self):
        """Initialize settings and create required directories."""
        os.makedirs(self.TMP_DIR, exist_ok=True)

# Create a singleton settings instance
settings = Settings()
