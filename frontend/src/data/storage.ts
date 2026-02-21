import {DUser, LUser, type GObject} from "../joiner";

export class Storage {
    static read<T>(key: string): T {
        let val: string | null | T = localStorage.getItem(key);

        if (val) try {
            // NB: JSON.parse can parse to correct type also null/number/boolean from strings
            val = JSON.parse(val) as unknown as T;
            if (key === 'user') LUser.replace((val as DUser));
        } catch (e) { }
        return val as T;

    }

    static write(key: string, obj: unknown): void {
        let str: string = '';
        if (obj === null) obj = undefined;
        // console.trace('store.write('+key+', '+obj+')', {key, obj});
        if (key === 'user') LUser.replace((obj as DUser));
        switch (typeof obj){
            case undefined: localStorage.removeItem(key); break;
            case 'object': str = JSON.stringify(obj); break;
            default: str = ''+obj; break;
        }
        localStorage.setItem(key, str);
    }

    /**
     * Reset session-related storage while preserving user preferences.
     *
     * This method clears localStorage but keeps:
     * - AI provider API keys and configurations
     * - Layout preferences
     * - Theme settings
     * - Prompt customizations
     */
    static reset(): void {
        // Keys to PRESERVE across logout (user preferences, not session data)
        const keysToPreserve: string[] = [
            // Jjodie AI provider configurations (API keys)
            'jjodie_provider_claude',
            'jjodie_provider_openai',
            'jjodie_provider_deepseek',
            'jjodie_provider_gemini',
            'jjodie_provider_mistral',
            'jjodie_provider_groq',
            'jjodie_active_provider',
            'jjodel_jodie_window',

            // Prompt customizations
            'jjodie_prompt_chat',
            'jjodie_prompt_documentation',
            'jjodie_prompt_version',

            // Layout preferences
            'jjodel_layout_mode',
            'jjodel_vertical_console_height',

            // Theme/appearance preferences
            'jjodel_theme',
            'jjodel_appearance',

            // Settings page preferences
            'jjodel_settings_sidebar_section',
        ];

        // Save values to preserve
        const preserved: Record<string, string | null> = {};
        for (const key of keysToPreserve) {
            const value = localStorage.getItem(key);
            if (value !== null) {
                preserved[key] = value;
            }
        }

        // Clear all localStorage
        localStorage.clear();

        // Restore preserved values
        for (const [key, value] of Object.entries(preserved)) {
            if (value !== null) {
                localStorage.setItem(key, value);
            }
        }
        console.debug('[Storage.reset] Cleared session data, preserved user preferences:', Object.keys(preserved));
    }

    static resetLogin(): void {
        localStorage.removeItem('offline');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('refreshTokenExp');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExp');
        localStorage.removeItem('user');
        // localStorage.clear();  NO! never fully reset the state or project recovery mode and offline completely loses data.
    }
        /**
         * Completely clear all localStorage including user preferences.
         * Use with caution - this removes API keys and all settings.
         */
    static hardReset(): void {
            localStorage.clear();
            console.debug('[Storage.hardReset] Cleared ALL localStorage');
        }
}

export default Storage;
(window as any).JStorage = Storage;

