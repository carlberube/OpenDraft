"""
AI provider abstraction and implementations
"""
import os
import re
import logging
from abc import ABC, abstractmethod
from typing import Optional

logger = logging.getLogger(__name__)


class AIProvider(ABC):
    """Abstract base class for AI providers"""

    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Generate text based on system and user prompts"""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if the provider is properly configured"""
        pass


class LiteLLMProvider(AIProvider):
    """
    Provider using LiteLLM for multi-model support.
    Requires litellm package and appropriate API keys.
    """

    def __init__(self, model: Optional[str] = None):
        self.model = model or os.environ.get('AI_PROVIDER_MODEL', '')

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Generate text using LiteLLM"""
        try:
            from litellm import acompletion
        except ImportError:
            raise RuntimeError(
                "LiteLLM is not installed. "
                "Add 'litellm' to requirements.txt or use a different provider."
            )

        if not self.model:
            raise ValueError(
                "AI_PROVIDER_MODEL environment variable is not set. "
                "Set it to a model like 'openai/gpt-4o-mini' or 'anthropic/claude-3-5-sonnet-latest'"
            )

        try:
            response = await acompletion(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"LiteLLM generation failed: {e}")
            raise RuntimeError(f"AI generation failed: {str(e)}")

    def is_configured(self) -> bool:
        """Check if model is set"""
        return bool(self.model)


class MockProvider(AIProvider):
    """
    Mock provider for testing and development.
    Returns a simple placeholder response.
    """

    def is_configured(self) -> bool:
        return True

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Return mock screenplay content"""
        return """INT. COFFEE SHOP - DAY

ALEX (30s, confident) sits across from JORDAN (20s, nervous).

ALEX
So, what did you want to talk about?

JORDAN
(hesitating)
It's about the project. I think we need to make a change.

ALEX
What kind of change?

Jordan pulls out a folder and slides it across the table."""


def get_provider() -> AIProvider:
    """
    Get the configured AI provider based on environment variables.

    Returns LiteLLMProvider if AI_PROVIDER_MODEL is set,
    otherwise returns MockProvider.
    """
    model = os.environ.get('AI_PROVIDER_MODEL', '')
    if model:
        return LiteLLMProvider(model)
    else:
        logger.warning(
            "AI_PROVIDER_MODEL not set. Using MockProvider. "
            "Set AI_PROVIDER_MODEL and appropriate API keys for real AI generation."
        )
        return MockProvider()


def sanitize_screenplay_output(text: str) -> str:
    """
    Clean up AI-generated text to ensure it's screenplay-ready.

    - Strip markdown code fences
    - Trim whitespace
    - Remove common non-screenplay artifacts
    """
    if not text:
        return text

    # Remove markdown code fences (```fountain, ```text, etc.)
    text = re.sub(r'^```\w*\n?', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n?```$', '', text, flags=re.MULTILINE)

    # Trim leading/trailing whitespace
    text = text.strip()

    return text
