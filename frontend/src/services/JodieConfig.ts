/**
 * Jodie Configuration Service
 * Manages AI provider configuration storage in localStorage
 */

import { JodieConfig, ProviderConfig, AIProvider, DEFAULT_JODIE_CONFIG } from '../types/jodie';

const STORAGE_KEY = 'jjodel_jodie_config';

export class JodieConfigService {
    /**
     * Load configuration from localStorage
     */
    static load(): JodieConfig {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return DEFAULT_JODIE_CONFIG;

            const parsed = JSON.parse(stored);
            // Merge with defaults to handle new providers
            return {
                ...DEFAULT_JODIE_CONFIG,
                ...parsed,
                providers: {
                    ...DEFAULT_JODIE_CONFIG.providers,
                    ...parsed.providers,
                },
            };
        } catch (error) {
            console.error('Failed to load Jodie config:', error);
            return DEFAULT_JODIE_CONFIG;
        }
    }

    /**
     * Save configuration to localStorage
     */
    static save(config: JodieConfig): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (error) {
            console.error('Failed to save Jodie config:', error);
        }
    }

    /**
     * Get configuration for a specific provider
     */
    static getProvider(provider: AIProvider): ProviderConfig | null {
        const config = this.load();
        return config.providers[provider] || null;
    }

    /**
     * Update configuration for a specific provider
     */
    static updateProvider(provider: AIProvider, updates: Partial<ProviderConfig>): void {
        const config = this.load();
        config.providers[provider] = {
            ...config.providers[provider],
            ...updates,
        };
        this.save(config);
    }

    /**
     * Set the active provider
     */
    static setActiveProvider(provider: AIProvider): void {
        const config = this.load();
        config.activeProvider = provider;
        this.save(config);
    }

    /**
     * Get the active provider
     */
    static getActiveProvider(): AIProvider {
        const config = this.load();
        return config.activeProvider;
    }

    /**
     * Get list of enabled providers (with valid API keys)
     */
    static getEnabledProviders(): AIProvider[] {
        const config = this.load();
        return Object.entries(config.providers)
            .filter(([_, cfg]) => cfg.enabled && cfg.apiKey)
            .map(([provider, _]) => provider as AIProvider);
    }

    /**
     * Check if a provider is properly configured
     */
    static isProviderConfigured(provider: AIProvider): boolean {
        const config = this.load();
        const providerConfig = config.providers[provider];
        return !!(providerConfig?.apiKey && providerConfig?.enabled);
    }

    /**
     * Update window position
     */
    static updatePosition(position: { x: number; y: number }): void {
        const config = this.load();
        config.position = position;
        this.save(config);
    }

    /**
     * Update window size
     */
    static updateSize(size: { width: number; height: number }): void {
        const config = this.load();
        config.size = size;
        this.save(config);
    }

    /**
     * Reset configuration to defaults
     */
    static reset(): void {
        this.save(DEFAULT_JODIE_CONFIG);
    }
}

export default JodieConfigService;
