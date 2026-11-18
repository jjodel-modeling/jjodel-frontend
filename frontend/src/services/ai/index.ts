/**
 * Public surface of the AI provider module (#196, spec §4): types, registry, stores, catalog.
 * Nothing in the app imports it before L2.
 */
export * from './types';
export type { BaseProvider } from './BaseProvider';
export { PROVIDER_IDS, PROVIDER_SPECS, SEEDS, claudeLegacyIdMap, modelDirectory, registry } from './registry';
export type { SeedRow } from './registry';
export { claudeFamily } from './AnthropicCompatibleProvider';
export { geminiFamilyRank } from './GoogleCompatibleProvider';
export { openaiFamily } from './OpenAICompatibleProvider';
export { ProviderConfigStore } from './config/ProviderConfigStore';
export type { StoredProviderConfig } from './config/ProviderConfigStore';
export { AI_FEATURES, FeaturePreferenceStore } from './config/FeaturePreferenceStore';
export type { FeaturePreference, ModelDirectory } from './config/FeaturePreferenceStore';
export { CATALOG_PROVIDERS, CATALOG_TTL_MS, cachedModels, needsRefresh, refreshCatalog, refreshIfStale } from './catalog/catalogCache';
