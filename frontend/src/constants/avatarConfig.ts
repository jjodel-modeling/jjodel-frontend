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

// null = initials (default), otherwise Bootstrap Icons class
export const AVATAR_ICONS: (string | null)[] = [
    null,                       // initials — DEFAULT
    'bi-person-fill',
    'bi-star-fill',
    'bi-lightning-fill',
    'bi-heart-fill',
    'bi-gem',
    'bi-rocket-takeoff-fill',
    'bi-code-slash',
    'bi-mortarboard-fill',
    'bi-palette-fill',
    'bi-controller',
    'bi-music-note-beamed',
    'bi-cup-hot-fill',
];

export const AVATAR_STORAGE_KEY = 'jjodel-avatar-config';

export interface AvatarConfig {
    colorIndex: number;    // index in AVATAR_COLORS (default: 1 = cyan)
    iconIndex: number;     // index in AVATAR_ICONS (default: 0 = initials)
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
    colorIndex: 1,    // cyan
    iconIndex: 0,     // initials
};
