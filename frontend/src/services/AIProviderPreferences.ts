/**
 * AIProviderPreferences - Gestisce le preferenze di AI provider per ogni feature.
 * Salva e recupera le preferenze da localStorage.
 */

// Tipi
export type AIFeature = 'documentation' | 'chat';

export interface ProviderPreference {
    providerId: string;
    updatedAt: number;
}

// Costanti
const STORAGE_PREFIX = 'jjodel_provider_';

const DEFAULT_PROVIDERS: Record<AIFeature, string> = {
    documentation: 'local',
    chat: 'auto', // 'auto' = usa il primo provider configurato
};

/**
 * Service per gestire le preferenze AI provider
 */
export class AIProviderPreferences {

    /**
     * Ottiene il provider preferito per una feature
     */
    static getPreferred(feature: AIFeature): string {
        try {
            const stored = localStorage.getItem(`${STORAGE_PREFIX}${feature}`);
            if (stored) {
                const pref: ProviderPreference = JSON.parse(stored);
                return pref.providerId;
            }
        } catch (e) {
            console.warn(`Failed to read provider preference for ${feature}:`, e);
        }
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
        };
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
     * Risolve 'auto' al primo provider disponibile
     */
    static resolveProvider(providerId: string): string {
        if (providerId !== 'auto') {
            return providerId;
        }

        // Ordine di preferenza per 'auto'
        const preferenceOrder = ['openai', 'anthropic', 'mistral', 'gemini', 'ollama'];

        for (const id of preferenceOrder) {
            if (this.isProviderAvailable(id)) {
                return id;
            }
        }

        return 'local'; // Fallback
    }
}

export default AIProviderPreferences;
