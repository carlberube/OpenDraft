# AI-Assisted Screenplay Generation MVP

This document describes the AI-assisted screenplay generation feature in OpenDraft.

## Quick Start

### With Mock Provider (No API Key Required)

```bash
# Terminal 1: Start backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Then open the app, click `Tools → AI Generate...`, and test with any prompt. The MockProvider will return placeholder content.

### With Real AI Provider

```bash
# Terminal 1: Start backend with AI configuration
cd backend
export AI_PROVIDER_MODEL=openai/gpt-4o-mini
export OPENAI_API_KEY=sk-proj-your-key-here
uvicorn app.main:app --reload

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Then use `Tools → AI Generate...` to generate real screenplay content.

## Overview

OpenDraft now includes a minimal viable product (MVP) for AI-assisted screenplay writing. This feature allows users to generate screenplay content by providing a prompt, with the AI taking into account the current screenplay context.

## Features

### What's Included

- **AI Generate Dialog**: Accessible via `Tools → AI Generate...` menu item
- **Context-Aware Generation**: Captures and sends:
  - Selected text (if any)
  - Current scene text
  - Nearby text around cursor
  - Document title
- **Preview Before Insert**: Generated content is shown for review before insertion
- **Multiple Provider Support**: Works with any LiteLLM-compatible AI provider:
  - OpenAI (GPT-4, GPT-4o-mini, etc.)
  - Anthropic (Claude 3.5 Sonnet, etc.)
  - Mistral AI
  - xAI (Grok)
  - And many others supported by LiteLLM
- **Mock Provider**: Works without API keys for testing (returns placeholder content)
- **Error Handling**: Clear messages for configuration issues, API failures, and validation errors
- **Privacy Notice**: Users are informed that data will be sent to the AI provider

### What's NOT Included (Intentionally)

This is an MVP. The following features are NOT included:

- Streaming responses
- Chat history / conversational interface
- Embeddings / RAG / vector search
- Model picker UI
- Advanced diff viewer
- Persistent AI memory
- Automatic content rewriting
- Integration with beats/cards
- Persistent Chat Assistant panel

These features may be added in future iterations.

## Architecture

### Backend (`backend/app/ai/`)

- **`schemas.py`**: Pydantic models for request/response validation
- **`prompts.py`**: System prompts and context-aware prompt construction
- **`providers.py`**: AI provider abstraction layer
  - `AIProvider` abstract base class
  - `LiteLLMProvider` for real AI generation
  - `MockProvider` for testing without API keys
  - `get_provider()` factory function
  - `sanitize_screenplay_output()` for cleaning AI responses
- **`routes.py`**: FastAPI endpoint `/api/ai/generate-screenplay-content`

### Frontend

- **`frontend/src/ai/types.ts`**: TypeScript type definitions
- **`frontend/src/ai/api.ts`**: API client for the AI endpoint
- **`frontend/src/components/AiGenerateDialog.tsx`**: React dialog component
- **`frontend/src/components/AiGenerateDialog.css`**: Styling for the dialog
- **Updates to `ScreenplayEditor.tsx`**: Integration with editor
- **Updates to `MenuBar.tsx`**: "AI Generate..." menu item in Tools menu

## Configuration

### Backend Environment Variables

Set these environment variables in your backend `.env` file or deployment environment:

#### Required

- `AI_PROVIDER_MODEL`: The AI model to use (LiteLLM model format)
  - Examples:
    - `openai/gpt-4o-mini`
    - `openai/gpt-4`
    - `anthropic/claude-3-5-sonnet-latest`
    - `anthropic/claude-3-opus-latest`
    - `mistral/mistral-large-latest`
    - `xai/grok-beta`

#### Provider API Keys (one required based on chosen provider)

- `OPENAI_API_KEY`: For OpenAI models
- `ANTHROPIC_API_KEY`: For Anthropic Claude models
- `MISTRAL_API_KEY`: For Mistral AI models
- `XAI_API_KEY`: For xAI Grok models

### Example `.env` Configuration

```bash
# OpenAI
AI_PROVIDER_MODEL=openai/gpt-4o-mini
OPENAI_API_KEY=sk-proj-...

# or Anthropic
AI_PROVIDER_MODEL=anthropic/claude-3-5-sonnet-latest
ANTHROPIC_API_KEY=sk-ant-...

# or Mistral
AI_PROVIDER_MODEL=mistral/mistral-large-latest
MISTRAL_API_KEY=...

# or xAI
AI_PROVIDER_MODEL=xai/grok-beta
XAI_API_KEY=...
```

### No Configuration (Mock Mode)

If `AI_PROVIDER_MODEL` is not set, the backend will use `MockProvider`, which returns placeholder screenplay content. This is useful for:
- Testing the UI without API costs
- Development without API keys
- Demonstrations

#### Local Mock Provider Workflow

To test the AI feature without configuring API keys:

1. **Start the backend without AI_PROVIDER_MODEL**:
   ```bash
   cd backend
   # Do NOT set AI_PROVIDER_MODEL
   uvicorn app.main:app --reload
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Use the feature**:
   - Open a screenplay in the editor
   - Click `Tools → AI Generate...`
   - Enter any prompt
   - Click Generate
   - The MockProvider will return placeholder dialogue
   - Click Insert to add it to your screenplay

The backend will log a warning: `"AI_PROVIDER_MODEL not set. Using MockProvider."`

This is expected and allows you to test the full workflow without external API calls.

## Usage

### For Users

1. Open a screenplay in the editor
2. Place your cursor where you want to insert AI-generated content
3. Click `Tools → AI Generate...` in the menu bar
4. Enter a prompt (e.g., "Write an engaging dialogue between a husband and wife fighting")
5. Click **Generate**
6. Review the generated content in the preview
7. Click **Insert** to add it to your screenplay, **Regenerate** to try again, or **Cancel** to discard

### For Developers

#### Installing Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs `litellm==1.83.0` (patched version addressing security vulnerabilities).

#### Running the Backend

```bash
cd backend
# Set environment variables first
export AI_PROVIDER_MODEL=openai/gpt-4o-mini
export OPENAI_API_KEY=sk-proj-...
# Then start the server
uvicorn app.main:app --reload
```

#### Testing Without API Keys

```bash
cd backend
# Don't set AI_PROVIDER_MODEL - MockProvider will be used
uvicorn app.main:app --reload
```

## Context Handling

The AI receives screenplay context to generate relevant content:

### Context Priority

1. **Selected Text**: If the user has text selected, it's included as primary context
2. **Current Scene**: The system finds the nearest scene heading and extracts all text until the next scene heading
3. **Nearby Text**: If no scene is found, 500 characters before and after the cursor are sent
4. **Document Title**: The screenplay title is included for additional context

### Context in Prompts

The backend constructs a prompt like:

```
=== CONTEXT ===
Document: My Screenplay
Current scene:
INT. COFFEE SHOP - DAY
...

=== USER REQUEST ===
Write an engaging dialogue between two friends catching up.
```

This helps the AI:
- Use consistent character names
- Match the existing tone
- Maintain continuity
- Generate appropriate scene content

## Prompt Engineering

### System Prompt

The system instructs the AI to:
- Generate only screenplay content (no explanations)
- Use Fountain-like formatting
- Avoid Markdown, code fences, bullet lists
- Format with:
  - Scene headings: `INT. LOCATION - DAY`
  - Character names: UPPERCASE
  - Dialogue under character names
  - Parentheticals in (parentheses)
  - Action lines as plain paragraphs

### Output Sanitization

The backend:
- Strips Markdown code fences (```fountain, ```text, etc.)
- Trims whitespace
- Validates non-empty output
- Returns warnings for very short content

## Error Handling

### Configuration Errors

**Error**: "AI is not configured. Set AI_PROVIDER_MODEL environment variable and the appropriate provider API key."

**Solution**: Set `AI_PROVIDER_MODEL` and the corresponding API key in backend environment.

### Generation Errors

**Error**: "AI generation failed. Please try again."

**Causes**:
- API key invalid or expired
- Network issues
- Rate limits exceeded
- Model unavailable

**Solution**: Check backend logs for detailed error messages.

### Empty Prompt

**Error**: "Please enter a prompt"

**Solution**: Enter a prompt before clicking Generate.

### Empty AI Response

**Error**: "AI returned empty content. Please try a different prompt."

**Solution**: Rephrase your prompt to be more specific.

## Security & Privacy

### API Keys

- API keys are **NEVER** sent to the frontend
- All AI requests go through the backend
- Keys are configured via environment variables
- No API keys in version control

### Data Privacy

- Users are notified that prompts and context will be sent to the AI provider
- No data is stored persistently by OpenDraft (unless user saves the generated content)
- AI provider terms of service and privacy policies apply

### Vulnerabilities

This implementation uses `litellm==1.83.10`, which patches all known security vulnerabilities including:
- Sandbox escape in custom-code guardrail
- Authenticated command execution via MCP stdio test endpoints
- Server-Side Template Injection in /prompts/test endpoint
- SQL Injection in Proxy API key verification

**Important**: We use LiteLLM **only as a library** (via `acompletion`), not as a proxy server. No LiteLLM proxy, test, or admin routes are exposed by our FastAPI application.

## Future Enhancements

Potential future improvements (not in this MVP):

- **Streaming**: Real-time generation with progressive display
- **Chat Interface**: Persistent chat panel for iterative refinement
- **Beats Integration**: Generate screenplay beats and expand them
- **Cards Integration**: Summarize scenes into beat cards
- **RAG/Embeddings**: Search and use the entire screenplay as context
- **Model Picker UI**: Let users choose models from the UI
- **Advanced Diff**: Side-by-side comparison before insert
- **Templates**: Pre-built prompts for common tasks
- **Tone Control**: Adjust formality, genre, pacing
- **Character Consistency**: Track and enforce character voice
- **Auto-Format**: Parse and apply screenplay formatting automatically

## Testing

### Manual Testing Checklist

- [ ] Open screenplay editor
- [ ] Click Tools → AI Generate
- [ ] Dialog opens
- [ ] Context summary displays correctly
- [ ] Enter a prompt
- [ ] Click Generate
- [ ] Generated content appears in preview
- [ ] Click Insert
- [ ] Content inserts at cursor position
- [ ] Dialog closes
- [ ] Test Regenerate button
- [ ] Test Cancel button (before and after generation)
- [ ] Test with no configuration (should show error)
- [ ] Test with invalid API key (should show error)
- [ ] Test with empty prompt (should show error)

### Automated Testing

Currently, no automated tests are included in this MVP. Consider adding:

- Backend unit tests for `sanitize_screenplay_output()`
- Backend integration tests for the endpoint (with MockProvider)
- Frontend unit tests for the dialog component
- E2E tests for the full workflow

## Troubleshooting

### "AI is not configured"

Check backend logs. Ensure `AI_PROVIDER_MODEL` is set:

```bash
echo $AI_PROVIDER_MODEL
```

### "litellm module not found"

Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

### Generated content has code fences

This is a sanitization failure. Report as a bug. The backend should strip these automatically.

### Content doesn't insert at cursor

Check browser console for JavaScript errors. This may indicate a compatibility issue with the editor.

### Rate limit errors

You're exceeding the AI provider's rate limits. Consider:
- Using a different model with higher limits
- Implementing request queuing
- Upgrading your API plan

## License

This feature is part of OpenDraft (MIT License). AI providers have separate terms of service.

## Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/your-org/OpenDraft/issues
- Documentation: See main OpenDraft README.md
