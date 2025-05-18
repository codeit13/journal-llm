from typing import Optional, Union, Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.language_models import BaseLLM
from langchain_core.messages import BaseMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import Runnable
from langchain_openai import ChatOpenAI
from langchain_ollama.llms import OllamaLLM
from config import settings, ModelProvider

# Import Hugging Face components conditionally to avoid import errors if not installed
try:
    from langchain_huggingface import HuggingFacePipeline
    from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    HUGGINGFACE_AVAILABLE = False


def create_llm(model_provider: Optional[ModelProvider] = None) -> BaseLLM:
    """
    Create a language model instance using the configured settings.
    
    Args:
        model_provider: Override the model provider from settings. If None, uses the configured provider.
    
    Returns:
        BaseLLM: A configured language model instance.
    """
    # Determine which model provider to use
    provider = model_provider if model_provider else settings.MODEL_PROVIDER
    
    if provider == ModelProvider.OPENAI:
        return create_openai_llm()
    elif provider == ModelProvider.HUGGINGFACE:
        return create_huggingface_llm()
    elif provider == ModelProvider.OLLAMA:
        return create_ollama_llm()
    else:
        raise ValueError(f"Unsupported model provider: {provider}")


def create_openai_llm() -> ChatOpenAI:
    """
    Create an OpenAI language model instance.
    
    Returns:
        ChatOpenAI: A configured OpenAI language model instance.
    """
    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        temperature=0.6,
        api_key=settings.OPENAI_API_KEY
    )
    return llm

def create_ollama_llm() -> ChatOpenAI:
    """
    Create an Ollama language model instance.
    
    Returns:
        ChatOpenAI: A configured Ollama language model instance.
    """
    print("Creating Ollama LLM: ", settings.OLLAMA_BASE_URL, settings.OLLAMA_MODEL)
    llm = OllamaLLM(
        model=settings.OLLAMA_MODEL,
        temperature=0.6,
        base_url=settings.OLLAMA_BASE_URL
    )
    return llm

def create_huggingface_llm() -> BaseLLM:
    """
    Create a Hugging Face language model instance using the journal-llm model.
    
    Returns:
        BaseLLM: A configured Hugging Face language model instance.
    """
    if not HUGGINGFACE_AVAILABLE:
        raise ImportError(
            "Hugging Face dependencies are not installed. "
            "Install them with 'pip install transformers torch langchain-huggingface'"
        )
    
    # Load the model and tokenizer
    tokenizer = AutoTokenizer.from_pretrained(settings.HUGGINGFACE_MODEL_ID)
    model = AutoModelForCausalLM.from_pretrained(
        settings.HUGGINGFACE_MODEL_ID,
        load_in_4bit=settings.HUGGINGFACE_LOAD_IN_4BIT,
        device_map=settings.HUGGINGFACE_DEVICE_MAP
    )
    
    # Create a text generation pipeline
    text_gen_pipeline = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=settings.HUGGINGFACE_MAX_NEW_TOKENS,
        return_full_text=False
    )
    
    # Create a LangChain HuggingFacePipeline
    llm = HuggingFacePipeline(pipeline=text_gen_pipeline)
    
    return llm


def create_prompt_template(template_str: str) -> ChatPromptTemplate:
    """
    Creates a ChatPromptTemplate from a template string.

    Args:
        template_str (str): The template string.

    Returns:
        ChatPromptTemplate: A configured ChatPromptTemplate.
    """

    return ChatPromptTemplate.from_template(template_str)
