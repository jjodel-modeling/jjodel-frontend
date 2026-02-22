/**
 * Jodie Configuration Service
 * Manages per-provider AI configuration with separate API keys for each provider
 */

import {
    JodieConfig,
    ProviderConfig,
    AIProvider,
    TAIProvider,
    DEFAULT_JODIE_CONFIG,
    PROVIDER_MODELS,
    ALL_AI_PROVIDERS, AI, AIConfig
} from '../types/jodie';


// Map from Settings page provider names to Jodie provider names
const SETTINGS_TO_JODIE_PROVIDER: Record<string, TAIProvider | null> = {
    'anthropic': AIProvider.Claude,
    'openai': AIProvider.GPT,
    'google': AIProvider.Gemini,
    'deepseek': AIProvider.DeepSeek,
    'mistral': AIProvider.Mistral,
    'groq': AIProvider.Groq,
    'ollama': AIProvider.Ollama,
    'kimi': AIProvider.Kimi,
    'custom': null,
};

type ProviderStorageFormat = AIConfig

interface WindowState {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
}

interface LegacySettingsFormat {
    provider: string;
    model: string;
    apiKey: string;
    enabled: boolean;
    autoSuggestOnErrors?: boolean;
    baseUrl?: string;
}


export class JodieConfigService {
    /**
     * Initialize and migrate from legacy settings if needed
     * /
    static initialize(): void {
        this.migrateFromLegacySettings();
    }

    / **
     * Migrate from old single-key settings to new per-provider format
    private static migrateFromLegacySettings(): void {
        try {
            const legacyJson = localStorage.getItem(AI.LEGACY_SETTINGS_KEY);
            if (!legacyJson) return;

            const legacy: LegacySettingsFormat = JSON.parse(legacyJson);
            const jodieProvider = SETTINGS_TO_JODIE_PROVIDER[legacy.provider];

            // If we have a valid provider with an API key, migrate it
            if (jodieProvider && legacy.apiKey) {
                const existingConfig = this.getProviderConfig(jodieProvider);

                // Only migrate if we don't already have this provider configured
                if (!existingConfig || !existingConfig.apiKey) {
                    this.saveProviderConfig(jodieProvider, {
                        apiKey: legacy.apiKey,
                        model: legacy.model,
                        enabled: legacy.enabled,
                    });

                    // Set as active provider if enabled
                    if (legacy.enabled) {
                        this.setActiveProvider(jodieProvider);
                    }
                }
            }

            // Don't delete legacy settings - Settings page still uses them
            // localStorage.removeItem(LEGACY_SETTINGS_KEY);
        } catch (error) {
            console.error('Failed to migrate legacy settings:', error);
        }
    }
*/

    /**
     * Load full configuration from storage
     */
    static load(): JodieConfig {
        if (JodieConfig.current) return JodieConfig.current;
        try {
            // Start with defaults
            const config = JodieConfig.current = new JodieConfig();
            // Load each provider's config
            for (const provider of ALL_AI_PROVIDERS) this.getProviderConfig(provider);


            // Load active provider
            const activeProvider = localStorage.getItem(AI.ACTIVE_PROVIDER_KEY)||'';
            if (activeProvider && AIProvider.isValidProvider(activeProvider)) {
                config.activeProvider = activeProvider;
            } else {
                // Default to first enabled provider
                config.activeProvider = this.getEnabledProviders()[0] || AI.Claude;
            }

            // Load window state
            const windowStateJson = localStorage.getItem(AI.WINDOW_STATE_KEY);
            if (windowStateJson) {
                let windowState: WindowState;
                try {
                    windowState = JSON.parse(windowStateJson);
                    config.position = windowState.position;
                    config.size = windowState.size;
                } catch (error) {
                    console.error('Failed to load Jodie window config:', error);
                    // windowState = {position: {x:0, y:0}, size: {width:500, height:300}} as WindowState;
                }
            }
            return config;
        } catch (error) {
            console.error('Failed to load Jodie config:', error);
            return JodieConfig.current = new JodieConfig();
        }
    }

    /**
     * Get configuration for a specific provider
     */
    static getProviderConfig(provider: TAIProvider): AIConfig {
        return AIConfig.get(provider);
    }

    /**
     * Save configuration for a specific provider
     */
    static saveProviderConfig(provider: TAIProvider, config: Partial<AIConfig>): void {
        AIConfig.set(provider, config);
    }

    /**
     * Check if any provider is configured and enabled
     */
    static hasValidConfiguration(): boolean {
        return this.getEnabledProviders().length > 0;
    }

    /**
     * Get list of providers with valid API keys
     */
    static getConfiguredProviders(): TAIProvider[] {
        return ALL_AI_PROVIDERS.filter(provider => {
            const config = this.getProviderConfig(provider);
            return config && config.apiKey;
        });
    }

    /**
     * Get list of enabled providers (with valid API keys and enabled flag)
     */
    static getEnabledProviders(): TAIProvider[] {
        return ALL_AI_PROVIDERS.filter(provider => {
            const config = this.getProviderConfig(provider);
            let llm = AI[provider];
            return config && (!llm.requiresKey || config.apiKey) && config.enabled;
        });
    }

    /**
     * Check if a specific provider is properly configured
     * Note: Ollama doesn't require an API key
     */
    static isProviderConfigured(provider: TAIProvider): boolean {
        const config = this.getProviderConfig(provider);
        let llm = AI[provider];
        if (!config) return false;
        return !llm.requiresKey || !!config.apiKey;
    }

    /**
     * Check if a specific provider is enabled (configured + enabled flag)
     * Note: Ollama doesn't require an API key
     */
    static isProviderEnabled(provider: TAIProvider): boolean {
        const config = this.getProviderConfig(provider);
        if (!config || !config.enabled) return false;
        // Ollama doesn't require API key
        if (provider === AIProvider.Ollama) return true;
        return !!config.apiKey;
    }

    /**
     * Get the currently active provider
     */
    static getActiveProvider(): TAIProvider {
        if (AI.activeProvider) return AI.activeProvider;
        const saved = localStorage.getItem(AI.ACTIVE_PROVIDER_KEY);
        if (saved && ALL_AI_PROVIDERS.includes(saved as TAIProvider)) {
            // Verify the saved provider is still enabled
            if (this.isProviderEnabled(saved as TAIProvider))
                return AI.activeProvider = saved as TAIProvider;
        }

        // Fall back to first enabled provider
        const enabled = this.getEnabledProviders();
        return AI.activeProvider = enabled[0] || AIProvider.Claude;
    }

    /**
     * Set the active provider
     */
    static setActiveProvider(provider: TAIProvider): void {
        localStorage.setItem(AI.ACTIVE_PROVIDER_KEY, provider);
        AI.activeProvider = provider;

        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('ai-settings-changed', {
            detail: { activeProvider: provider }
        }));
    }

    /**
     * Mark a provider's connection as tested
     * /
    static markProviderTested(provider: TAIProvider): void {
        const config = this.getProviderConfig(provider);
        if (config) {
            this.saveProviderConfig(provider, {
                ...config,
                lastTested: Date.now(),
            });
        }
    }

    /**
     * Get provider test timestamp
     * /
    static getProviderLastTested(provider: TAIProvider): number | null {
        const config = this.getProviderConfig(provider);
        return config?.lastTested || null;
    }

    /**
     * Update window position
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
     * Update window size
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

    /**
     * Clear all provider configurations
     */
    static clearAllProviders(): void {
        for (const provider of ALL_AI_PROVIDERS) {
            localStorage.removeItem(STORAGE_KEYS[provider]);
        }
        localStorage.removeItem(ACTIVE_PROVIDER_KEY);
    }

    /**
     * Export all configurations as JSON (for backup)
     */
    static exportConfig(): string {
        const config: Record<string, any> = {};

        for (const provider of ALL_AI_PROVIDERS) {
            const providerConfig = this.getProviderConfig(provider);
            if (providerConfig) {
                config[provider] = providerConfig;
            }
        }

        config.activeProvider = this.getActiveProvider();

        return JSON.stringify(config, null, 2);
    }

    /**
     * Import configurations from JSON
     */
    static importConfig(json: string): boolean {
        try {
            const config = JSON.parse(json);

            for (const provider of ALL_AI_PROVIDERS) {
                if (config[provider]) {
                    this.saveProviderConfig(provider, config[provider]);
                }
            }

            if (config.activeProvider && ALL_AI_PROVIDERS.includes(config.activeProvider)) {
                this.setActiveProvider(config.activeProvider);
            }

            return true;
        } catch (error) {
            console.error('Failed to import config:', error);
            return false;
        }
    }

    static setProvider(service: string, param2: { apiKey: string; model: string, baseUrl?: string }) {
        console.error('JodieConfigService.setProvider: todo');
    }

    static removeProvider(service: string) {
        console.error('JodieConfigService.removeProvider: todo');
    }

    static save(newConfig: any): any {
        console.error('JodieConfigService.save: todo');
    }
    static reset(): any {
        console.error('JodieConfigService.reset: todo');
    }
}

// Initialize on module load
JodieConfigService.initialize();

export default JodieConfigService;
