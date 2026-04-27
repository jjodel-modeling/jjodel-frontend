import { JjodelEvents } from '../../events/registry';

const STORAGE_KEY = 'jjodel-toast-history';
const MAX_HISTORY = 20;

export type HistoryEntryType = 'warning' | 'error';

export interface HistoryEntry {
    id: string;
    type: HistoryEntryType;
    title?: string;
    message: string;
    timestamp: number;
    read: boolean;
}

interface AddInput {
    type: HistoryEntryType;
    title?: string;
    message: string;
    timestamp?: number;
}

function read(): HistoryEntry[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function write(entries: HistoryEntry[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch { /* quota exceeded etc. */ }
    window.dispatchEvent(new CustomEvent(JjodelEvents.HISTORY_CHANGED));
}

function newId(): string {
    return `hist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const toastHistory = {
    add(input: AddInput): void {
        const entry: HistoryEntry = {
            id: newId(),
            type: input.type,
            title: input.title,
            message: input.message,
            timestamp: input.timestamp ?? Date.now(),
            read: false,
        };
        const next = [entry, ...read()].slice(0, MAX_HISTORY);
        write(next);
    },

    getAll(): HistoryEntry[] {
        return read();
    },

    getUnreadCount(): number {
        return read().filter(e => !e.read).length;
    },

    markAllRead(): void {
        const current = read();
        if (current.every(e => e.read)) return;
        write(current.map(e => ({ ...e, read: true })));
    },

    remove(id: string): void {
        const current = read();
        const next = current.filter(e => e.id !== id);
        if (next.length !== current.length) write(next);
    },

    clearAll(): void {
        write([]);
    },
};
