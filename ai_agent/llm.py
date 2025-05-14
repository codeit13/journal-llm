from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from config import settings


def create_llm():
    """
    Create a language model instance using the configured settings.
    
    Returns:
        ChatOpenAI: A configured language model instance.
    """
    llm = ChatOpenAI(
        model=settings.DEFAULT_MODEL,
        temperature=settings.DEFAULT_TEMPERATURE,
        api_key=settings.OPENAI_API_KEY
    )
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
