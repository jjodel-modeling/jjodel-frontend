import { useState, useCallback } from 'react';
import { AIProviderPreferences, AIFeature } from '../services/AIProviderPreferences';

/**
 * Hook per gestire la preferenza AI provider di una feature
 */
export function useAIProviderPreference(feature: AIFeature) {
    const [selectedProvider, setSelectedProviderState] = useState<string>(() =>
        AIProviderPreferences.getPreferred(feature)
    );

    // Aggiorna localStorage quando cambia
    const setSelectedProvider = useCallback((providerId: string) => {
        setSelectedProviderState(providerId);
        AIProviderPreferences.setPreferred(feature, providerId);
    }, [feature]);

    // Risolvi 'auto' al provider effettivo
    const resolvedProvider = AIProviderPreferences.resolveProvider(selectedProvider);

    // Verifica se il provider selezionato è disponibile
    const isProviderAvailable = AIProviderPreferences.isProviderAvailable(selectedProvider);

    // Reset al default
    const resetToDefault = useCallback(() => {
        AIProviderPreferences.resetPreference(feature);
        setSelectedProviderState(AIProviderPreferences.getPreferred(feature));
    }, [feature]);

    return {
        selectedProvider,
        setSelectedProvider,
        resolvedProvider,
        isProviderAvailable,
        resetToDefault,
    };
}

export default useAIProviderPreference;
