import React, { useState } from 'react';
import { generateScreenplayContent } from '../ai/api';
import type { ScreenplayContext } from '../ai/types';
import { showToast } from './Toast';
import './AiGenerateDialog.css';

interface AiGenerateDialogProps {
  onClose: () => void;
  onInsert: (content: string) => void;
  context?: ScreenplayContext;
}

const AiGenerateDialog: React.FC<AiGenerateDialogProps> = ({ onClose, onInsert, context }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a prompt', 'error');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setWarnings([]);

    try {
      const response = await generateScreenplayContent({
        prompt: prompt.trim(),
        context,
      });

      setGeneratedContent(response.fountain);
      setWarnings(response.warnings || []);

      if (response.explanation) {
        console.log('AI explanation:', response.explanation);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI generation failed';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = () => {
    if (generatedContent) {
      onInsert(generatedContent);
      onClose();
    }
  };

  const handleRegenerate = () => {
    setGeneratedContent(null);
    setError(null);
    setWarnings([]);
    handleGenerate();
  };

  const getContextSummary = (): string => {
    if (!context) return 'No context';

    const parts: string[] = [];
    if (context.selectedText) parts.push('selected text');
    if (context.currentSceneText) parts.push('current scene');
    else if (context.nearbyText) parts.push('nearby context');
    if (context.documentTitle) parts.push(`document: ${context.documentTitle}`);

    return parts.length > 0 ? `Using ${parts.join(', ')}` : 'Using document context';
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog ai-generate-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>AI Generate Screenplay Content</h2>
          <button className="dialog-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="dialog-body">
          {!generatedContent ? (
            <>
              <div className="ai-context-info">
                <small>{getContextSummary()}</small>
              </div>

              <div className="form-group">
                <label htmlFor="ai-prompt">Prompt</label>
                <textarea
                  id="ai-prompt"
                  className="ai-prompt-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Write an engaging dialogue between a husband and wife fighting."
                  rows={4}
                  autoFocus
                  disabled={isGenerating}
                />
              </div>

              <div className="ai-privacy-notice">
                <small>
                  ⓘ Your prompt and screenplay context will be sent to the configured AI provider.
                </small>
              </div>

              {error && (
                <div className="ai-error">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="ai-preview-label">
                <strong>Generated Content (Preview):</strong>
              </div>
              <div className="ai-preview">
                <pre>{generatedContent}</pre>
              </div>

              {warnings.length > 0 && (
                <div className="ai-warnings">
                  {warnings.map((warning, idx) => (
                    <div key={idx} className="ai-warning">
                      ⚠ {warning}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="dialog-footer">
          {!generatedContent ? (
            <>
              <button onClick={onClose} disabled={isGenerating}>
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="primary"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose}>
                Cancel
              </button>
              <button onClick={handleRegenerate} disabled={isGenerating}>
                Regenerate
              </button>
              <button onClick={handleInsert} className="primary">
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
