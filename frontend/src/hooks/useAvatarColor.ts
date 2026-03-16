import { useState, useEffect, useCallback } from 'react';
import { AVATAR_COLORS, DEFAULT_AVATAR_COLOR, AVATAR_COLOR_STORAGE_KEY, AvatarColor } from '../constants/avatarColors';

export function useAvatarColor(): [AvatarColor, (color: AvatarColor) => void] {
    const [color, setColorState] = useState<AvatarColor>(() => {
        try {
            const stored = localStorage.getItem(AVATAR_COLOR_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                const found = AVATAR_COLORS.find(c => c.name === parsed.name);
                if (found) return found;
            }
        } catch { /* ignore */ }
        return DEFAULT_AVATAR_COLOR;
    });

    const setColor = useCallback((newColor: AvatarColor) => {
        setColorState(newColor);
        localStorage.setItem(AVATAR_COLOR_STORAGE_KEY, JSON.stringify(newColor));
        window.dispatchEvent(new CustomEvent('avatar-color-change', { detail: newColor }));
    }, []);

    useEffect(() => {
        const handler = (e: Event) => {
            const custom = e as CustomEvent<AvatarColor>;
            setColorState(custom.detail);
        };
        window.addEventListener('avatar-color-change', handler);
        return () => window.removeEventListener('avatar-color-change', handler);
    }, []);

    return [color, setColor];
}
