import type { ChatCheckpointInfo } from '../services/api';

function shortHash(hash?: string | null): string | null {
    if (!hash) return null;
    return hash.slice(0, 7);
}

export function formatCheckpointOptionLabel(checkpoint: ChatCheckpointInfo): string {
    const label = checkpoint.label?.trim() || 'Unnamed checkpoint';
    const hash = shortHash(checkpoint.commit_hash);
    const hashPart = hash ? ` [${hash}]` : '';
    return `${label}${hashPart} • ${checkpoint.message_count} msgs`;
}

export function buildCheckpointPreviewMeta(checkpoint: ChatCheckpointInfo | null): {
    label: string;
    commitHashShort: string | null;
    messageCount: number;
} {
    if (!checkpoint) {
        return {
            label: 'Unnamed checkpoint',
            commitHashShort: null,
            messageCount: 0,
        };
    }

    return {
        label: checkpoint.label?.trim() || 'Unnamed checkpoint',
        commitHashShort: shortHash(checkpoint.commit_hash),
        messageCount: checkpoint.message_count,
    };
}
