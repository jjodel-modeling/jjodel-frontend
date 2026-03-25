import { useState, useEffect, useCallback } from 'react';
import {
    AvatarConfig,
    DEFAULT_AVATAR_CONFIG,
    AVATAR_STORAGE_KEY,
    AVATAR_COLORS,
    AVATAR_ICONS,
} from '../constants/avatarConfig';

const AVATAR_CHANGE_EVENT = 'avatar-config-change';

function loadConfig(): AvatarConfig {
    try {
        const stored = localStorage.getItem(AVATAR_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (
                parsed.colorIndex >= 0 && parsed.colorIndex < AVATAR_COLORS.length &&
                parsed.iconIndex >= 0 && parsed.iconIndex < AVATAR_ICONS.length
            ) {
                // Strip legacy patternIndex if present
                return { colorIndex: parsed.colorIndex, iconIndex: parsed.iconIndex };
            }
        }
    } catch { /* ignore */ }

    // Migrate from old avatar-color format
    try {
        const oldStored = localStorage.getItem('jjodel-avatar-color');
        if (oldStored) {
            const parsed = JSON.parse(oldStored);
            const colorIdx = AVATAR_COLORS.findIndex(c => c.name === parsed.name);
            if (colorIdx >= 0) {
                const migrated: AvatarConfig = { ...DEFAULT_AVATAR_CONFIG, colorIndex: colorIdx };
                localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(migrated));
                localStorage.removeItem('jjodel-avatar-color');
                return migrated;
            }
        }
    } catch { /* ignore */ }

    return DEFAULT_AVATAR_CONFIG;
}

export function useAvatar(): [AvatarConfig, (config: AvatarConfig) => void] {
    const [config, setConfigState] = useState<AvatarConfig>(loadConfig);

    const setConfig = useCallback((newConfig: AvatarConfig) => {
        setConfigState(newConfig);
        localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(newConfig));
        window.dispatchEvent(new CustomEvent(AVATAR_CHANGE_EVENT, { detail: newConfig }));
    }, []);

    useEffect(() => {
        const handler = (e: Event) => {
            setConfigState((e as CustomEvent<AvatarConfig>).detail);
        };
        window.addEventListener(AVATAR_CHANGE_EVENT, handler);
        return () => window.removeEventListener(AVATAR_CHANGE_EVENT, handler);
    }, []);

    return [config, setConfig];
}

export function getStoredAvatarConfig(): AvatarConfig {
    return loadConfig();
}
