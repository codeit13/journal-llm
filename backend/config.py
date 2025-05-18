from pydantic_settings import BaseSettings
import os
from typing import Optional
from enum import Enum


class ModelProvider(str, Enum):
    """Enum for model providers."""
    OPENAI = "openai"
    HUGGINGFACE = "huggingface"
    OLLAMA = "ollama"


class Settings(BaseSettings):
    # MongoDB settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "agent"
    
    # OpenAI API settings
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # Model provider settings
    MODEL_PROVIDER: ModelProvider = ModelProvider.OPENAI  # Can be 'openai', 'huggingface', or 'ollama'
    
    # Ollama settings
    OLLAMA_BASE_URL: str = "https://ollama.sleebit.com"
    OLLAMA_MODEL: str = "hf.co/thesleebit/llama3-7b-finetuned-journal:Q4_K_M"
    
    # Hugging Face model settings
    HUGGINGFACE_MODEL_ID: str = "thesleebit/journal-llm-v2"
    HUGGINGFACE_LOAD_IN_4BIT: bool = True
    HUGGINGFACE_DEVICE_MAP: str = "auto"
    HUGGINGFACE_MAX_NEW_TOKENS: int = 512
    
    # Application paths
    TMP_DIR: str = os.path.join(os.getcwd(), "tmp")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        """Initialize settings and create required directories."""
        os.makedirs(self.TMP_DIR, exist_ok=True)

    class Config:
        env_file = ".env"


settings = Settings()