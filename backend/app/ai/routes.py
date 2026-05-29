"""
AI generation API routes
"""
import logging
from fastapi import APIRouter, HTTPException

from app.ai.schemas import GenerateScreenplayContentRequest, GenerateScreenplayContentResponse
from app.ai.prompts import SYSTEM_PROMPT, build_user_prompt
from app.ai.providers import get_provider, sanitize_screenplay_output

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate-screenplay-content", response_model=GenerateScreenplayContentResponse)
async def generate_screenplay_content(request: GenerateScreenplayContentRequest):
    """
    Generate screenplay content based on a user prompt and context.

    Requires environment configuration:
    - AI_PROVIDER_MODEL: The model to use (e.g., 'openai/gpt-4o-mini', 'anthropic/claude-3-5-sonnet-latest')
    - Appropriate API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.) for the chosen provider
    """
    # Validate prompt
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")

    # Get provider
    provider = get_provider()

    # Check configuration
    if not provider.is_configured():
        raise HTTPException(
            status_code=503,
            detail=(
                "AI is not configured. Set AI_PROVIDER_MODEL environment variable "
                "and the appropriate provider API key (e.g., OPENAI_API_KEY, ANTHROPIC_API_KEY)."
            )
        )

    # Build context-aware user prompt
    context_dict = request.context.model_dump() if request.context else None
    user_prompt = build_user_prompt(request.prompt, context_dict)

    # Generate content
    try:
        raw_output = await provider.generate(SYSTEM_PROMPT, user_prompt)
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI generation failed. Please try again."
        )

    # Sanitize output
    screenplay_text = sanitize_screenplay_output(raw_output)

    # Validate we got something
    if not screenplay_text:
        raise HTTPException(
            status_code=500,
            detail="AI returned empty content. Please try a different prompt."
        )

    warnings = []

    # Optionally warn about non-screenplay content
    # (This is a simple heuristic - you can make it more sophisticated)
    if len(screenplay_text) < 20:
        warnings.append("Generated content is very short. Consider refining your prompt.")

    return GenerateScreenplayContentResponse(
        fountain=screenplay_text,
        explanation=None,  # Could add explanatory text if desired
        warnings=warnings if warnings else None,
    )
