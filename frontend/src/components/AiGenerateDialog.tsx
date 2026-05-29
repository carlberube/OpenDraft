/**
 * AI Generate Dialog
 *
 * A modal dialog for generating screenplay content using AI.
 * Allows users to enter a prompt, preview generated content, and insert it into the editor.
 */
import React, { useState, useRef, useEffect } from 'react';
import { generateScreenplayContent } from '../ai/api';
import type { ScreenplayContext } from '../ai/types';

interface AiGenerateDialogProps {
  onClose: () => void;
  onInsert: (content: string) => void;
  context?: ScreenplayContext;
}

const AiGenerateDialog: React.FC<AiGenerateDialogProps> = ({
  onClose,
  onInsert,
  context,
}) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus the prompt input when dialog opens
    promptRef.current?.focus();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Enter a prompt first.');
      return;
    }

    setError('');
    setWarnings([]);
    setGenerating(true);

    try {
      const response = await generateScreenplayContent({
        prompt: prompt.trim(),
        context,
      });

      setGeneratedContent(response.fountain);
      if (response.warnings && response.warnings.length > 0) {
        setWarnings(response.warnings);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI generation failed. Please try again.';
      setError(message);
      setGeneratedContent('');
    } finally {
      setGenerating(false);
    }
  };

  const handleInsert = () => {
    if (generatedContent) {
      onInsert(generatedContent);
      onClose();
    }
  };

  const handleRegenerate = () => {
    setGeneratedContent('');
    setError('');
    setWarnings([]);
    promptRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !generating && prompt.trim()) {
      handleGenerate();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--fd-bg)',
          border: '1px solid var(--fd-border)',
          borderRadius: 8,
          width: '90%',
          maxWidth: 700,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--fd-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            AI Generate Screenplay Content
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: 'var(--fd-text)',
              padding: '0 8px',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {/* Privacy notice */}
          {!generatedContent && (
            <div
              style={{
                padding: '8px 12px',
                marginBottom: 16,
                background: 'rgba(46, 125, 215, 0.1)',
                border: '1px solid rgba(46, 125, 215, 0.3)',
                borderRadius: 6,
                fontSize: 12,
                color: 'var(--fd-text)',
              }}
            >
              Your prompt and screenplay context will be sent to the configured AI provider.
            </div>
          )}

          {/* Context info */}
          {context && !generatedContent && (
            <div
              style={{
                padding: '8px 12px',
                marginBottom: 16,
                background: 'rgba(100, 100, 100, 0.1)',
                border: '1px solid rgba(100, 100, 100, 0.2)',
                borderRadius: 6,
                fontSize: 12,
                color: 'var(--fd-text-secondary)',
              }}
            >
              Using {context.currentSceneText ? 'current scene' : context.nearbyText ? 'nearby' : 'document'} context
            </div>
          )}

          {/* Prompt input (shown when no generated content) */}
          {!generatedContent && (
            <div>
              <label
                htmlFor="ai-prompt"
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--fd-text)',
                }}
              >
                Prompt
              </label>
              <textarea
                id="ai-prompt"
                ref={promptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Write an engaging dialogue between a husband and wife fighting."
                style={{
                  width: '100%',
                  minHeight: 120,
                  padding: 12,
                  fontSize: 14,
                  border: '1px solid var(--fd-border)',
                  borderRadius: 6,
                  background: 'var(--fd-bg-input)',
                  color: 'var(--fd-text)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {/* Generated content preview */}
          {generatedContent && (
            <div>
              <div
                style={{
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--fd-text)',
                }}
              >
                Preview
              </div>
              <div
                style={{
                  padding: 16,
                  background: 'var(--fd-bg-input)',
                  border: '1px solid var(--fd-border)',
                  borderRadius: 6,
                  maxHeight: 400,
                  overflowY: 'auto',
                  fontFamily: 'Courier New, monospace',
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  color: 'var(--fd-text)',
                }}
              >
                {generatedContent}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                background: 'rgba(255, 165, 0, 0.1)',
                border: '1px solid rgba(255, 165, 0, 0.3)',
                borderRadius: 6,
                fontSize: 12,
                color: 'var(--fd-text)',
              }}
            >
              {warnings.map((warning, i) => (
                <div key={i}>⚠ {warning}</div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: 6,
                fontSize: 12,
                color: '#EF4444',
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--fd-border)',
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          {!generatedContent ? (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  border: '1px solid var(--fd-border)',
                  borderRadius: 6,
                  background: 'var(--fd-bg)',
                  color: 'var(--fd-text)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  border: 'none',
                  borderRadius: 6,
                  background: generating || !prompt.trim() ? 'var(--fd-border)' : '#2E7DD7',
                  color: generating || !prompt.trim() ? 'var(--fd-text-secondary)' : '#ffffff',
                  cursor: generating || !prompt.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                }}
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRegenerate}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  border: '1px solid var(--fd-border)',
                  borderRadius: 6,
                  background: 'var(--fd-bg)',
                  color: 'var(--fd-text)',
                  cursor: 'pointer',
                }}
              >
                Regenerate
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  border: '1px solid var(--fd-border)',
                  borderRadius: 6,
                  background: 'var(--fd-bg)',
                  color: 'var(--fd-text)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleInsert}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  border: 'none',
                  borderRadius: 6,
                  background: '#10B981',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Insert
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiGenerateDialog;
