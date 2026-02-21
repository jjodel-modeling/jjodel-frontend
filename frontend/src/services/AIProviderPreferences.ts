/**
 * AIProviderPreferences - Gestisce le preferenze di AI provider per ogni feature.
 * Salva e recupera le preferenze da localStorage.
 *
 * Resolution order:
 * 1. Per-feature override (if set)
 * 2. Global default provider (if set in Settings)
 * 3. Feature-specific default ('local' for documentation, 'auto' for others)
 */

// Tipi
export type AIFeature = 'documentation' | 'chat' | 'scriptblock' | 'mappings';

export interface ProviderPreference {
    providerId: string;
    updatedAt: number;
}

// Costanti
const STORAGE_PREFIX = 'jjodel_provider_';
const GLOBAL_DEFAULT_KEY = 'jjodel_default_provider';

const DEFAULT_PROVIDERS: Record<AIFeature, string> = {
    documentation: 'local',
    chat: 'auto', // 'auto' = usa il primo provider configurato
    scriptblock: 'auto',
    mappings: 'auto',
};

/**
 * Service per gestire le preferenze AI provider
 */
export class AIProviderPreferences {

    /**
     * Ottiene il provider preferito per una feature.
     * Resolution order:
     * 1. Per-feature override
     * 2. Global default (if available and configured)
     * 3. Feature-specific default
     */
    static getPreferred(feature: AIFeature): string {
        try {
            // 1. Check per-feature override
            const stored = localStorage.getItem(`${STORAGE_PREFIX}${feature}`);
            if (stored) {
                const pref: ProviderPreference = JSON.parse(stored);
                return pref.providerId;
            }

            // 2. Check global default (but not for features that have 'local' as default)
            if (DEFAULT_PROVIDERS[feature] !== 'local') {
                const globalDefault = this.getGlobalDefault();
                if (globalDefault && this.isProviderAvailable(globalDefault)) {
                    return globalDefault;
                }
            }
        } catch (e) {
            console.warn(`Failed to read provider preference for ${feature}:`, e);
        }

        // 3. Feature-specific default
        return DEFAULT_PROVIDERS[feature];
    }

    /**
     * Imposta il provider preferito per una feature
     */
    static setPreferred(feature: AIFeature, providerId: string): void {
        try {
            const pref: ProviderPreference = {
                providerId,
                updatedAt: Date.now(),
            };
            localStorage.setItem(`${STORAGE_PREFIX}${feature}`, JSON.stringify(pref));
        } catch (e) {
            console.warn(`Failed to save provider preference for ${feature}:`, e);
        }
    }

    /**
     * Resetta la preferenza al default
     */
    static resetPreference(feature: AIFeature): void {
        try {
            localStorage.removeItem(`${STORAGE_PREFIX}${feature}`);
        } catch (e) {
            console.warn(`Failed to reset provider preference for ${feature}:`, e);
        }
    }

    /**
     * Ottiene tutte le preferenze correnti
     */
    static getAllPreferences(): Record<AIFeature, string> {
        return {
            documentation: this.getPreferred('documentation'),
            chat: this.getPreferred('chat'),
            scriptblock: this.getPreferred('scriptblock'),
            mappings: this.getPreferred('mappings'),
        };
    }

    /**
     * Get the global default provider (set in Settings)
     */
    static getGlobalDefault(): string | null {
        try {
            return localStorage.getItem(GLOBAL_DEFAULT_KEY);
        } catch {
            return null;
        }
    }

    /**
     * Set the global default provider (from Settings)
     */
    static setGlobalDefault(providerId: string | null): void {
        try {
            if (providerId) {
                localStorage.setItem(GLOBAL_DEFAULT_KEY, providerId);
            } else {
                localStorage.removeItem(GLOBAL_DEFAULT_KEY);
            }
            // Dispatch event for cross-component sync
            window.dispatchEvent(new CustomEvent('ai-provider-changed', {
                detail: { type: 'global-default', providerId }
            }));
        } catch (e) {
            console.warn('Failed to save global default provider:', e);
        }
    }

    /**
     * Check if a feature has a per-feature override (vs using global default)
     */
    static hasFeatureOverride(feature: AIFeature): boolean {
        try {
            return localStorage.getItem(`${STORAGE_PREFIX}${feature}`) !== null;
        } catch {
            return false;
        }
    }

    /**
     * Verifica se un provider è disponibile/configurato
     */
    static isProviderAvailable(providerId: string): boolean {
        if (providerId === 'local') return true;
        if (providerId === 'auto') return true;

        // Importa JodieConfigService per verificare
        // Questo evita dipendenze circolari
        try {
            const { JodieConfigService } = require('./JodieConfig');
            const provider = JodieConfigService.getProvider(providerId);

            if (providerId === 'ollama') {
                return !!provider?.baseUrl;
            }
            return !!provider?.apiKey;
        } catch {
            return false;
        }
    }

    /**
     * Risolve 'auto' al primo provider disponibile.
     * If global default is set and available, use it first.
     */
    static resolveProvider(providerId: string): string {
        if (providerId !== 'auto') {
            return providerId;
        }

        // Check global default first
        const globalDefault = this.getGlobalDefault();
        if (globalDefault && this.isProviderAvailable(globalDefault)) {
            return globalDefault;
        }

        // Ordine di preferenza per 'auto'
        // Note: 'claude' is the internal ID for Anthropic in JodieConfigService
        const preferenceOrder = ['openai', 'claude', 'deepseek', 'mistral', 'gemini', 'groq', 'kimi', 'ollama'];

        for (const id of preferenceOrder) {
            if (this.isProviderAvailable(id)) {
                return id;
            }
        }

        return 'local'; // Fallback
    }

    /**
     * Get list of all configured (available) providers
     */
    static getConfiguredProviders(): string[] {
        // Note: 'claude' is the internal ID for Anthropic in JodieConfigService
        const allProviders = ['openai', 'claude', 'deepseek', 'mistral', 'gemini', 'groq', 'kimi', 'ollama'];
        return allProviders.filter(id => this.isProviderAvailable(id));
    }
}

export default AIProviderPreferences;
