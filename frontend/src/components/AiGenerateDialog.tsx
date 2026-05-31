import React, { useEffect, useMemo, useState } from 'react';
import { generateScreenplayContent } from '../ai/api';
import type { ScreenplayContext } from '../ai/types';
import { api, type ChatConversation } from '../services/api';
import { buildCheckpointPreviewMeta, formatCheckpointOptionLabel } from './aiChatUtils';
import { showToast } from './Toast';
import './AiGenerateDialog.css';

interface AiGenerateDialogProps {
    onClose: () => void;
    onInsert: (content: string) => void;
    context?: ScreenplayContext;
    projectId?: string;
    scriptId?: string;
    style?: React.CSSProperties;
    dock: 'right' | 'bottom';
    onDockChange: (dock: 'right' | 'bottom') => void;
}

const AiGenerateDialog: React.FC<AiGenerateDialogProps> = ({
    onClose,
    onInsert,
    context,
    projectId,
    scriptId,
    style,
    dock,
    onDockChange,
}) => {
    const [prompt, setPrompt] = useState('');
    const [conversation, setConversation] = useState<ChatConversation | null>(null);
    const [loadingConversation, setLoadingConversation] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCheckpointId, setSelectedCheckpointId] = useState<string>('');

    const canUseChat = Boolean(projectId && scriptId);

    const checkpoints = conversation?.checkpoints || [];
    const sortedCheckpoints = useMemo(
        () => [...checkpoints].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        [checkpoints]
    );

    const selectedCheckpoint = useMemo(
        () => sortedCheckpoints.find((cp) => cp.id === selectedCheckpointId) || null,
        [sortedCheckpoints, selectedCheckpointId]
    );
    const selectedPreview = useMemo(
        () => buildCheckpointPreviewMeta(selectedCheckpoint),
        [selectedCheckpoint]
    );

    const loadConversation = async () => {
        if (!projectId || !scriptId) {
            setConversation(null);
            return;
        }
        setLoadingConversation(true);
        setError(null);
        try {
            const next = await api.getChatConversation(projectId, scriptId);
            setConversation(next);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load chat history';
            setError(message);
        } finally {
            setLoadingConversation(false);
        }
    };

    useEffect(() => {
        void loadConversation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, scriptId]);

    const handleGenerate = async () => {
        if (!projectId || !scriptId) {
            setError('Open a saved script to use chat history.');
            return;
        }
        if (!prompt.trim()) {
            showToast('Please enter a prompt', 'error');
            return;
        }

        const promptText = prompt.trim();
        setIsGenerating(true);
        setError(null);

        try {
            await api.appendChatMessage(projectId, scriptId, {
                role: 'user',
                content: promptText,
                context: context || null,
            });

            const response = await generateScreenplayContent({
                prompt: promptText,
                context,
            });

            await api.appendChatMessage(projectId, scriptId, {
                role: 'assistant',
                content: response.fountain,
                context: null,
            });

            if (response.warnings && response.warnings.length > 0) {
                showToast(response.warnings.join(' '), 'info');
            }

            if (response.explanation) {
                console.log('AI explanation:', response.explanation);
            }

            setPrompt('');
            await loadConversation();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'AI generation failed';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInsert = (content: string) => {
        try {
            onInsert(content);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to insert content';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        }
    };

    const handleCreateCheckpoint = async () => {
        if (!projectId || !scriptId) return;
        try {
            await api.createChatCheckpoint(projectId, scriptId, {});
            showToast('Chat checkpoint saved', 'success');
            await loadConversation();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save checkpoint';
            setError(message);
            showToast(message, 'error');
        }
    };

    const handleRestoreCheckpoint = async () => {
        if (!projectId || !scriptId || !selectedCheckpointId) return;
        try {
            const restored = await api.restoreChatCheckpoint(projectId, scriptId, selectedCheckpointId);
            setConversation(restored);
            setError(null);
            showToast('Chat restored from checkpoint', 'success');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to restore checkpoint';
            setError(message);
            showToast(message, 'error');
        }
    };

    const getContextSummary = (): string => {
        if (!context) return 'Using document context';

        const parts: string[] = [];
        if (context.selectedText) parts.push('selected text');
        if (context.currentSceneText) parts.push('current scene');
        else if (context.nearbyText) parts.push('nearby text');

        return parts.length > 0 ? `Using ${parts.join(', ')}` : 'Using document context';
    };

    const getContextDetails = (): string[] => {
        if (!context) return ['Document context'];

        const details: string[] = [];
        if (context.selectedText) details.push('Selected text');
        if (context.currentSceneText) details.push('Current scene');
        else if (context.nearbyText) details.push('Nearby text');
        if (context.documentTitle) details.push(`Document: ${context.documentTitle}`);

        return details.length > 0 ? details : ['Document context'];
    };

    const formatTs = (value: string): string => {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        return d.toLocaleString();
    };

    return (
        <div className={`ai-generate-dialog dock-${dock}`} style={style}>
            <div className="dialog-header ai-panel-header">
                <div className="ai-panel-title-group">
                    <h2>AI Screenplay Chat</h2>
                    <div className="ai-panel-subtitle">
                        One conversation per script file. History is restored when you reopen this script.
                    </div>
                </div>
                <div className="ai-panel-actions">
                    <div className="ai-dock-toggle" role="group" aria-label="AI chat panel dock position">
                        <button
                            type="button"
                            className={`ai-dock-btn${dock === 'right' ? ' active' : ''}`}
                            onClick={() => onDockChange('right')}
                            title="Dock right"
                        >
                            Right
                        </button>
                        <button
                            type="button"
                            className={`ai-dock-btn${dock === 'bottom' ? ' active' : ''}`}
                            onClick={() => onDockChange('bottom')}
                            title="Dock bottom"
                        >
                            Bottom
                        </button>
                    </div>
                    <button className="dialog-close" onClick={onClose} aria-label="Close AI chat panel">
                        &times;
                    </button>
                </div>
            </div>

            <div className="dialog-body ai-panel-body">
                <div className="ai-context-info">
                    <div className="ai-context-title">Context sent with your next message</div>
                    {getContextDetails().map((detail, idx) => (
                        <div key={idx} className="ai-context-item">{detail}</div>
                    ))}
                </div>

                {!canUseChat && (
                    <div className="ai-error">
                        <strong>Chat unavailable:</strong> Open and save a script first so chat can be tied to that file.
                    </div>
                )}

                {canUseChat && (
                    <>
                        <div className="ai-checkpoint-row">
                            <select
                                value={selectedCheckpointId}
                                onChange={(e) => setSelectedCheckpointId(e.target.value)}
                                className="ai-checkpoint-select"
                                disabled={isGenerating || sortedCheckpoints.length === 0}
                            >
                                <option value="">Select checkpoint...</option>
                                {sortedCheckpoints.map((cp) => (
                                    <option key={cp.id} value={cp.id}>
                                        {formatCheckpointOptionLabel(cp)} • {formatTs(cp.created_at)}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleRestoreCheckpoint}
                                disabled={!selectedCheckpointId || isGenerating}
                            >
                                Restore
                            </button>
                            <button type="button" onClick={handleCreateCheckpoint} disabled={isGenerating}>
                                Save Checkpoint
                            </button>
                        </div>

                        {selectedCheckpoint && (
                            <div className="ai-checkpoint-preview" aria-live="polite">
                                <span className="ai-checkpoint-label">{selectedPreview.label}</span>
                                {selectedPreview.commitHashShort && (
                                    <span className="ai-checkpoint-hash-badge">{selectedPreview.commitHashShort}</span>
                                )}
                                <span className="ai-checkpoint-meta">{selectedPreview.messageCount} messages</span>
                            </div>
                        )}

                        <div className="ai-thread" role="log" aria-live="polite">
                            {loadingConversation && <div className="ai-thread-empty">Loading chat history...</div>}
                            {!loadingConversation && (!conversation || conversation.messages.length === 0) && (
                                <div className="ai-thread-empty">
                                    No messages yet. Ask for beats, dialogue, or scene rewrites for this script.
                                </div>
                            )}
                            {conversation?.messages.map((message) => (
                                <div key={message.id} className={`ai-message ai-message-${message.role}`}>
                                    <div className="ai-message-meta">
                                        <span className="ai-message-role">{message.role}</span>
                                        <span className="ai-message-time">{formatTs(message.created_at)}</span>
                                    </div>
                                    <pre className="ai-message-content">{message.content}</pre>
                                    {message.role === 'assistant' && (
                                        <div className="ai-message-actions">
                                            <button type="button" onClick={() => handleInsert(message.content)}>
                                                Insert at Cursor
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {error && (
                    <div className="ai-error">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <div className="ai-privacy-notice">
                    <small>
                        Your prompt and screenplay context are sent to the configured AI provider. Assistant replies are saved in this script's chat history.
                    </small>
                </div>
            </div>

            <div className="dialog-footer ai-panel-footer">
                <textarea
                    className="ai-chat-input"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask for the next beat, rewrite dialogue, or continue from the scene context..."
                    rows={dock === 'right' ? 4 : 3}
                    autoFocus
                    disabled={isGenerating || !canUseChat}
                />
                <div className="ai-footer-actions">
                    <button onClick={onClose} disabled={isGenerating}>
                        Close
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim() || !canUseChat}
                        className="primary"
                    >
                        {isGenerating ? 'Generating...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiGenerateDialog;
