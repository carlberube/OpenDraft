# AI-Assisted Screenplay Generation - MVP

This is a minimal viable product (MVP) implementation of AI-assisted screenplay generation for OpenDraft.

## Features

The MVP adds a simple "AI Generate" feature accessible from the Tools menu that allows users to:

1. Open the screenplay editor
2. Place the cursor somewhere in the script
3. Trigger "Tools → AI Generate..." from the menu
4. Enter a prompt such as: "Write an engaging dialogue between a husband and wife fighting."
5. Preview the generated screenplay content
6. Insert it at the current cursor position after confirmation

## Architecture

### Backend

Located in `backend/app/ai/`:

- **`schemas.py`**: Pydantic models for request/response
- **`prompts.py`**: System prompts and prompt construction
- **`providers.py`**: AI provider abstraction with LiteLLM support
- **`routes.py`**: FastAPI endpoint `/api/ai/generate-screenplay-content`

The backend uses LiteLLM for multi-provider support, allowing you to use OpenAI, Anthropic, Mistral, or any other LiteLLM-compatible provider.

### Frontend

Located in `frontend/src/ai/` and `frontend/src/components/`:

- **`ai/types.ts`**: TypeScript types
- **`ai/api.ts`**: API client for the AI endpoint
- **`components/AiGenerateDialog.tsx`**: The dialog component for prompting and previewing

## Configuration

### Environment Variables

The backend AI provider is configured via environment variables:

- **`AI_PROVIDER_MODEL`**: The model to use (e.g., `openai/gpt-4o-mini`, `anthropic/claude-3-5-sonnet-latest`)
- **Provider API keys**: Depending on the provider you choose:
  - `OPENAI_API_KEY` for OpenAI models
  - `ANTHROPIC_API_KEY` for Anthropic models
  - `MISTRAL_API_KEY` for Mistral models
  - `XAI_API_KEY` for xAI models
  - etc.

### Example Configuration

```bash
# .env file in backend/
AI_PROVIDER_MODEL=openai/gpt-4o-mini
OPENAI_API_KEY=sk-...your-key-here...
```

or

```bash
AI_PROVIDER_MODEL=anthropic/claude-3-5-sonnet-latest
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
```

### Installing LiteLLM

The backend now includes `litellm==1.57.17` in `requirements.txt`. Install it with:

```bash
cd backend
pip install -r requirements.txt
```

### Mock Provider (Development)

If `AI_PROVIDER_MODEL` is not set, the backend will use a `MockProvider` that returns placeholder content. This is useful for testing the UI without configuring API keys.

## Usage

1. **Configure the backend** with the environment variables above
2. **Start the backend** (e.g., `cd backend && uvicorn app.main:app --reload`)
3. **Open OpenDraft** and open a screenplay
4. **Click "Tools → AI Generate..."** in the menu
5. **Enter a prompt** and click "Generate"
6. **Preview the result** and click "Insert" to add it to your screenplay

## Context Handling

The AI receives context from the screenplay:

- **Selected text**: If any text is selected
- **Current scene**: Text from the current scene heading to the next scene heading
- **Nearby text**: If no scene is found, ~500 characters before and after the cursor
- **Document title**: The title of the screenplay

This context helps the AI maintain continuity, character names, and tone.

## Limitations (Intentional for MVP)

This MVP intentionally does NOT include:

- Streaming responses
- Full chat history
- Embeddings or RAG/vector search
- Model picker UI
- Advanced diff viewer
- Persistent AI memory
- Automatic rewrite of existing screenplay content
- Beats/cards integration
- A persistent Chat Assistant panel

These features may be added in future iterations.

## Error Handling

- **Missing configuration**: Shows "AI is not configured. Set AI_PROVIDER_MODEL and the appropriate provider API key on the backend."
- **Generation failure**: Shows "AI generation failed. Please try again."
- **Empty prompt**: Disables the Generate button with "Enter a prompt first."

## Privacy

Before generating, the dialog shows a notice: "Your prompt and screenplay context will be sent to the configured AI provider."

API keys are only used on the backend and are never exposed to the frontend.

## Future Enhancements

Possible future improvements:

- Generate new beats between existing beats
- Summarize scenes into cards
- Use context from the selection, current scene, current beat/card, or entire screenplay
- Expose AI features through both a Chat Assistant panel and contextual menu actions
- Streaming responses for better UX
- More sophisticated Fountain parsing for insertion
- Integration with the beat board and index cards
- Model selection UI
- Token usage tracking and limits

## Testing

Manual testing:

1. Verify the dialog opens from the Tools menu
2. Enter a prompt and verify generation works
3. Verify preview is shown
4. Verify insert works at cursor position
5. Verify cancel does not modify the document
6. Verify backend missing config produces a readable error

Backend tests can be added for:

- The sanitizer/helper functions in `providers.py`
- Prompt construction in `prompts.py`
- Error handling in `routes.py`

## Implementation Notes

- The implementation follows OpenDraft's existing architecture patterns
- It respects the plugin system (could be moved to a plugin in the future)
- Changes are minimal and focused
- The AI dialog is a standalone component that can be easily removed or refactored
- The backend AI module is isolated and can be extended independently
