export interface AvatarColor {
    name: string;
    hex: string;
}

export const AVATAR_COLORS: AvatarColor[] = [
    { name: 'slate',   hex: '#475569' },
    { name: 'cyan',    hex: '#0ea5e9' },
    { name: 'violet',  hex: '#7c3aed' },
    { name: 'rose',    hex: '#e11d48' },
    { name: 'amber',   hex: '#d97706' },
    { name: 'emerald', hex: '#059669' },
    { name: 'indigo',  hex: '#4f46e5' },
    { name: 'teal',    hex: '#0d9488' },
];

export const DEFAULT_AVATAR_COLOR = AVATAR_COLORS[1]; // cyan
export const AVATAR_COLOR_STORAGE_KEY = 'jjodel-avatar-color';

export function getStoredAvatarColor(): AvatarColor {
    try {
        const stored = localStorage.getItem(AVATAR_COLOR_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            const found = AVATAR_COLORS.find(c => c.name === parsed.name);
            if (found) return found;
        }
    } catch { /* ignore */ }
    return DEFAULT_AVATAR_COLOR;
}
