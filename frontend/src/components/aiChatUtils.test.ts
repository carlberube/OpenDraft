import { describe, expect, it } from 'vitest';
import { buildCheckpointPreviewMeta, formatCheckpointOptionLabel } from './aiChatUtils';

describe('aiChatUtils', () => {
    it('formats checkpoint option with label fallback and short hash', () => {
        const label = formatCheckpointOptionLabel({
            id: 'cp1',
            created_at: '2026-01-01T00:00:00Z',
            message_count: 12,
            label: '',
            commit_hash: 'abcdef1234567890',
        });

        expect(label).toContain('Unnamed checkpoint');
        expect(label).toContain('[abcdef1]');
        expect(label).toContain('12 msgs');
    });

    it('builds preview metadata with label fallback and null hash when missing', () => {
        const preview = buildCheckpointPreviewMeta({
            id: 'cp2',
            created_at: '2026-01-01T00:00:00Z',
            message_count: 3,
            label: undefined,
            commit_hash: null,
        });

        expect(preview.label).toBe('Unnamed checkpoint');
        expect(preview.commitHashShort).toBeNull();
        expect(preview.messageCount).toBe(3);
    });
});
