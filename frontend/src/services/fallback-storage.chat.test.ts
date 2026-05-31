import { describe, expect, it, beforeEach } from 'vitest';
import { createFallbackStorage } from './fallback-storage';

class MemoryStorage {
    private store = new Map<string, string>();

    get length(): number {
        return this.store.size;
    }

    clear(): void {
        this.store.clear();
    }

    getItem(key: string): string | null {
        return this.store.has(key) ? this.store.get(key)! : null;
    }

    key(index: number): string | null {
        return Array.from(this.store.keys())[index] ?? null;
    }

    removeItem(key: string): void {
        this.store.delete(key);
    }

    setItem(key: string, value: string): void {
        this.store.set(key, value);
    }
}

describe('fallback storage chat flow', () => {
    beforeEach(() => {
        (globalThis as any).localStorage = new MemoryStorage();
    });

    it('appends messages and restores conversation from checkpoint', async () => {
        const storage = createFallbackStorage() as any;
        const projectId = 'proj-1';
        const scriptId = 'script-1';

        await storage.appendChatMessage(projectId, scriptId, {
            role: 'user',
            content: 'First prompt',
            context: null,
        });
        await storage.appendChatMessage(projectId, scriptId, {
            role: 'assistant',
            content: 'First reply',
            context: null,
        });

        const checkpoint = await storage.createChatCheckpoint(projectId, scriptId, {
            label: 'First turn',
            commit_hash: '1234567890abcdef',
        });

        await storage.appendChatMessage(projectId, scriptId, {
            role: 'user',
            content: 'Second prompt',
            context: null,
        });

        const beforeRestore = await storage.getChatConversation(projectId, scriptId);
        expect(beforeRestore.messages).toHaveLength(3);

        const restored = await storage.restoreChatCheckpoint(projectId, scriptId, checkpoint.id);
        expect(restored.messages).toHaveLength(2);
        expect(restored.messages[0].content).toBe('First prompt');
        expect(restored.messages[1].content).toBe('First reply');
    });
});
