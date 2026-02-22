// CredentialsService.ts - NO ENCRYPTION VERSION
// Works immediately without npm install
// Add encryption later when npm works

import JodieConfigService from "./JodieConfig";

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';

export interface ProviderCredentials {
  provider: ProviderType;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  enabled: boolean;
  lastUsed?: string;
  displayName?: string;
}

interface CredentialsStore {
  providers: ProviderCredentials[];
  activeProvider?: string;
  appVersion: string;
}

class CredentialsService {
  private readonly STORAGE_KEY = 'jjodie-credentials';
  
  constructor() {
    console.log('[CredentialsService] Initialized (plain text mode)');
    console.warn('[CredentialsService] WARNING: API keys stored in plain text');
  }
  
  /**
   * Get store from localStorage
   */
  private getStore(): CredentialsStore {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      
      if (!data) {
        return {
          providers: [],
          activeProvider: undefined,
          appVersion: '1.0.0',
        };
      }
      
      return JSON.parse(data);
    } catch (error) {
      console.error('[CredentialsService] Failed to load store:', error);
      return {
        providers: [],
        activeProvider: undefined,
        appVersion: '1.0.0',
      };
    }
  }
  
  /**
   * Save store to localStorage
   */
  private saveStore(store: CredentialsStore): void {
    try {
      const json = JSON.stringify(store);
      localStorage.setItem(this.STORAGE_KEY, json);
      console.log('[CredentialsService] Store saved successfully');
    } catch (error) {
      console.error('[CredentialsService] Failed to save store:', error);
      throw new Error('Failed to save credentials');
    }
  }
  
  /**
   * Save or update provider credentials
   */
  saveProvider(credentials: Omit<ProviderCredentials, 'lastUsed'>): void {
    const store = this.getStore();
    const existingIndex = store.providers.findIndex(
      p => p.provider === credentials.provider
    );
    
    const newCredentials: ProviderCredentials = {
      ...credentials,
      lastUsed: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      store.providers[existingIndex] = newCredentials;
      console.log(`[CredentialsService] Updated ${credentials.provider}`);
    } else {
      store.providers.push(newCredentials);
      console.log(`[CredentialsService] Added ${credentials.provider}`);
    }
    
    this.saveStore(store);
    
    // Set as active if it's the first provider or explicitly enabled
    if (store.providers.length === 1 || credentials.enabled) {
      this.setActiveProvider(credentials.provider);
    }
  }
  
  /**
   * Get all configured providers
   */
  getProviders(): ProviderCredentials[] {
    const store = this.getStore();
    return store.providers;
  }
  
  /**
   * Get enabled providers only
   */
  getEnabledProviders(): ProviderCredentials[] {
    return this.getProviders().filter(p => p.enabled);
  }
  
  /**
   * Get specific provider credentials
   */
  getProvider(provider: string): ProviderCredentials | undefined {
    const store = this.getStore();
    return store.providers.find(p => p.provider === provider);
  }
  
  /**
   * Remove provider credentials
   */
  removeProvider(provider: string): void {
    const store = this.getStore();
    store.providers = store.providers.filter(p => p.provider !== provider);
    
    // If we removed the active provider, set a new one
    if (store.activeProvider === provider) {
      const newActive = store.providers.find(p => p.enabled);
      store.activeProvider = newActive?.provider;
    }
    
    this.saveStore(store);
    console.log(`[CredentialsService] Removed ${provider}`);
  }
  
  /**
   * Get active provider credentials
   */
  getActiveProvider(): ProviderCredentials | undefined {
    return JodieConfigService.getActiveProvider();
    /*const store = this.getStore();
    
    if (!store.activeProvider) {
      // Return first enabled provider if no active set
      const enabled = this.getEnabledProviders();
      return enabled[0];
    }
    
    return this.getProvider(store.activeProvider);*/
  }
  
  /**
   * Set active provider
   */
  setActiveProvider(provider: string): void {
    const providerData = this.getProvider(provider);
    
    if (!providerData) {
      console.error(`[CredentialsService] Cannot set active provider: ${provider} not found`);
      return;
    }
    
    const store = this.getStore();
    store.activeProvider = provider;
    this.saveStore(store);
    
    console.log(`[CredentialsService] Active provider set to: ${provider}`);
  }
  
  /**
   * Toggle provider enabled/disabled
   */
  toggleProvider(provider: string, enabled: boolean): void {
    const store = this.getStore();
    const index = store.providers.findIndex(p => p.provider === provider);
    
    if (index >= 0) {
      store.providers[index].enabled = enabled;
      this.saveStore(store);
    }
  }
  
  /**
   * Check if any providers are configured
   */
  hasProviders(): boolean {
    const store = this.getStore();
    return store.providers.length > 0;
  }
  
  /**
   * Check if specific provider is configured
   */
  hasProvider(provider: string): boolean {
    return this.getProvider(provider) !== undefined;
  }
  
  /**
   * Update API key for existing provider
   */
  updateApiKey(provider: string, apiKey: string): void {
    const providerData = this.getProvider(provider);
    
    if (providerData) {
      this.saveProvider({
        ...providerData,
        apiKey,
      });
    }
  }
  
  /**
   * Get API key for provider (convenience method)
   */
  getApiKey(provider: string): string | undefined {
    const providerData = this.getProvider(provider);
    return providerData?.apiKey;
  }
  
  /**
   * Clear all credentials (logout all providers)
   */
  clearAll(): void {
    if (confirm('Are you sure you want to remove all provider credentials?')) {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('[CredentialsService] All credentials cleared');
    }
  }
  
  /**
   * Export credentials (for backup)
   */
  exportCredentials(): string {
    const store = this.getStore();
    return JSON.stringify(store, null, 2);
  }
  
  /**
   * Import credentials (from backup)
   */
  importCredentials(json: string): void {
    try {
      const data = JSON.parse(json) as CredentialsStore;
      
      // Validate structure
      if (!data.providers || !Array.isArray(data.providers)) {
        throw new Error('Invalid credentials format');
      }
      
      if (confirm('This will overwrite existing credentials. Continue?')) {
        this.saveStore(data);
        console.log('[CredentialsService] Credentials imported successfully');
      }
    } catch (error) {
      console.error('[CredentialsService] Import failed:', error);
      throw new Error('Failed to import credentials');
    }
  }
  
  /**
   * Check if LocalStorage is available
   */
  isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
}

// Export singleton instance
export const credentialsService = new CredentialsService();