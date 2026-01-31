/**
 * Jodie Configuration Service
 * Reads AI provider configuration from the unified Settings storage ('jjodie-settings')
 * and manages window position/size separately
 */

import { JodieConfig, ProviderConfig, AIProvider, DEFAULT_JODIE_CONFIG } from '../types/jodie';

// Storage keys
const SETTINGS_KEY = 'jjodie-settings';  // Shared with Settings page
const WINDOW_STATE_KEY = 'jjodel_jodie_window';  // Window position/size only

// Settings page uses different provider names - this maps them
const SETTINGS_TO_JODIE_PROVIDER: Record<string, AIProvider | null> = {
    'anthropic': 'claude',
    'openai': 'openai',
    'google': 'gemini',
    'deepseek': 'deepseek',
    // These providers from Settings are not yet supported by Jodie chat
    'mistral': null,
    'groq': null,
    'ollama': null,
    'custom': null,
};

const JODIE_TO_SETTINGS_PROVIDER: Record<AIProvider, string> = {
    'claude': 'anthropic',
    'openai': 'openai',
    'gemini': 'google',
    'deepseek': 'deepseek',
};

interface SettingsFormat {
    provider: string;
    model: string;
    apiKey: string;
    enabled: boolean;
    autoSuggestOnErrors?: boolean;
    baseUrl?: string;
}

interface WindowState {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
}

export class JodieConfigService {
    /**
     * Load configuration from Settings storage
     */
    static load(): JodieConfig {
        try {
            // Load AI settings from unified storage
            const settingsJson = localStorage.getItem(SETTINGS_KEY);
            const windowStateJson = localStorage.getItem(WINDOW_STATE_KEY);

            // Start with defaults
            const config: JodieConfig = { ...DEFAULT_JODIE_CONFIG };

            // Apply window state if exists
            if (windowStateJson) {
                const windowState: WindowState = JSON.parse(windowStateJson);
                config.position = windowState.position;
                config.size = windowState.size;
            }

            // If no settings, return defaults
            if (!settingsJson) {
                return config;
            }

            const settings: SettingsFormat = JSON.parse(settingsJson);

            // Map settings provider to Jodie provider
            const jodieProvider = SETTINGS_TO_JODIE_PROVIDER[settings.provider];

            if (jodieProvider && settings.apiKey && settings.enabled) {
                // Update the provider config
                config.providers[jodieProvider] = {
                    provider: jodieProvider,
                    apiKey: settings.apiKey,
                    model: settings.model,
                    enabled: true,
                };
                config.activeProvider = jodieProvider;
            }

            return config;
        } catch (error) {
            console.error('Failed to load Jodie config:', error);
            return DEFAULT_JODIE_CONFIG;
        }
    }

    /**
     * Get the raw settings from Settings page storage
     */
    static getSettings(): SettingsFormat | null {
        try {
            const settingsJson = localStorage.getItem(SETTINGS_KEY);
            if (!settingsJson) return null;
            return JSON.parse(settingsJson);
        } catch {
            return null;
        }
    }

    /**
     * Check if any provider is configured and enabled
     */
    static hasValidConfiguration(): boolean {
        const settings = this.getSettings();
        if (!settings) return false;

        const jodieProvider = SETTINGS_TO_JODIE_PROVIDER[settings.provider];
        return !!(jodieProvider && settings.apiKey && settings.enabled);
    }

    /**
     * Get configuration for a specific provider
     */
    static getProvider(provider: AIProvider): ProviderConfig | null {
        const config = this.load();
        return config.providers[provider] || null;
    }

    /**
     * Get the active provider
     */
    static getActiveProvider(): AIProvider {
        const config = this.load();
        return config.activeProvider;
    }

    /**
     * Set the active provider (updates Settings storage)
     */
    static setActiveProvider(provider: AIProvider): void {
        const settings = this.getSettings();
        if (!settings) return;

        const settingsProvider = JODIE_TO_SETTINGS_PROVIDER[provider];
        if (settingsProvider) {
            settings.provider = settingsProvider;
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent('ai-settings-changed', { detail: settings }));
        }
    }

    /**
     * Get list of enabled providers (with valid API keys)
     */
    static getEnabledProviders(): AIProvider[] {
        const settings = this.getSettings();
        if (!settings || !settings.apiKey || !settings.enabled) {
            return [];
        }

        const jodieProvider = SETTINGS_TO_JODIE_PROVIDER[settings.provider];
        return jodieProvider ? [jodieProvider] : [];
    }

    /**
     * Check if a provider is properly configured
     */
    static isProviderConfigured(provider: AIProvider): boolean {
        const settings = this.getSettings();
        if (!settings || !settings.apiKey || !settings.enabled) {
            return false;
        }

        const settingsProvider = JODIE_TO_SETTINGS_PROVIDER[provider];
        return settings.provider === settingsProvider;
    }

    /**
     * Update window position (stored separately)
     */
    static updatePosition(position: { x: number; y: number }): void {
        try {
            const windowStateJson = localStorage.getItem(WINDOW_STATE_KEY);
            const windowState: WindowState = windowStateJson ? JSON.parse(windowStateJson) : {};
            windowState.position = position;
            localStorage.setItem(WINDOW_STATE_KEY, JSON.stringify(windowState));
        } catch (error) {
            console.error('Failed to save window position:', error);
        }
    }

    /**
     * Update window size (stored separately)
     */
    static updateSize(size: { width: number; height: number }): void {
        try {
            const windowStateJson = localStorage.getItem(WINDOW_STATE_KEY);
            const windowState: WindowState = windowStateJson ? JSON.parse(windowStateJson) : {};
            windowState.size = size;
            localStorage.setItem(WINDOW_STATE_KEY, JSON.stringify(windowState));
        } catch (error) {
            console.error('Failed to save window size:', error);
        }
    }

    /**
     * Reset window state to defaults
     */
    static resetWindowState(): void {
        localStorage.removeItem(WINDOW_STATE_KEY);
    }
}

export default JodieConfigService;
