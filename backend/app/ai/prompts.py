"""
System prompts and prompt construction for AI screenplay generation
"""

SYSTEM_PROMPT = """You are an AI screenwriting assistant inside OpenDraft.
Generate screenplay content suitable for direct insertion into a screenplay editor.
Use Fountain-like formatting.
Do not use Markdown.
Do not wrap the answer in code fences.
Return only the screenplay text.
Preserve tone, character names, and continuity from the provided context.

Formatting guidelines:
- Scene headings: INT. LOCATION - DAY or EXT. LOCATION - NIGHT (only when needed)
- Character names: UPPERCASE
- Dialogue: appears under character names
- Parentheticals: short and wrapped in parentheses
- Action lines: plain paragraphs
- Avoid Markdown, avoid explanations, avoid code fences, avoid bullet lists unless explicitly asked for notes

Use the context to preserve:
- Existing characters
- Tone
- Current scene situation
- Nearby continuity
"""


def build_user_prompt(prompt: str, context: dict | None) -> str:
    """Construct the user prompt with context"""
    parts = []

    if context:
        context_parts = []

        if context.get('documentTitle'):
            context_parts.append(f"Document: {context['documentTitle']}")

        if context.get('currentSceneText'):
            context_parts.append(f"Current scene:\n{context['currentSceneText']}")
        elif context.get('nearbyText'):
            context_parts.append(f"Nearby context:\n{context['nearbyText']}")

        if context.get('selectedText'):
            context_parts.append(f"Selected text:\n{context['selectedText']}")

        if context_parts:
            parts.append("=== CONTEXT ===")
            parts.extend(context_parts)
            parts.append("\n=== USER REQUEST ===")

    parts.append(prompt)

    return "\n\n".join(parts)
