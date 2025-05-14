"""
Configuration settings for the journal-llm application.
"""
import os
from typing import Optional, Literal
from enum import Enum

class ModelProvider(str, Enum):
    """Enum for model providers."""
    OPENAI = "openai"
    HUGGINGFACE = "huggingface"
    
class Settings:
    """Application settings."""
    
    # Model provider settings
    MODEL_PROVIDER: ModelProvider = ModelProvider.OPENAI  # Can be 'openai' or 'huggingface'
    
    # OpenAI API settings
    OPENAI_API_KEY: Optional[str] = os.environ.get("OPENAI_API_KEY")
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_TEMPERATURE: float = 0.7
    
    # Hugging Face model settings
    HUGGINGFACE_MODEL_ID: str = "thesleebit/journal-llm-v2"
    HUGGINGFACE_LOAD_IN_4BIT: bool = True
    HUGGINGFACE_DEVICE_MAP: str = "auto"
    HUGGINGFACE_MAX_NEW_TOKENS: int = 512
    
    # Application paths
    TMP_DIR: str = os.path.join(os.getcwd(), "tmp")
    
    def __init__(self):
        """Initialize settings and create required directories."""
        os.makedirs(self.TMP_DIR, exist_ok=True)

# Create a singleton settings instance
settings = Settings()
