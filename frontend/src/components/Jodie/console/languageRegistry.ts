/**
 * LanguageRegistry — id-keyed registry of console LanguageProviders.
 *
 * Step 1 of the console v1 refactor (behavior-preserving). The registry only
 * stores and looks up providers; the routing decision (which provider to run)
 * stays in the Jodie handlers for this step. A shared singleton is exported
 * with the three built-in providers registered at module load.
 */
import type { LanguageProvider } from './types';
import { jjodieProvider } from './providers/jjodieProvider';
import { jjscriptProvider } from './providers/jjscriptProvider';
import { jjelProvider } from './providers/jjelProvider';

export class LanguageRegistry {
    private readonly providers = new Map<string, LanguageProvider>();

    /** Register a provider. Throws if the id is already registered. */
    register(provider: LanguageProvider): void {
        if (this.providers.has(provider.id)) {
            throw new Error(`LanguageRegistry: provider id "${provider.id}" is already registered`);
        }
        this.providers.set(provider.id, provider);
    }

    /** Look up a provider by id. Returns undefined when absent. */
    get(id: string): LanguageProvider | undefined {
        return this.providers.get(id);
    }

    /** All registered providers, in registration order. */
    list(): LanguageProvider[] {
        return Array.from(this.providers.values());
    }
}

/** Shared singleton with the three built-in console providers registered. */
export const consoleLanguageRegistry = new LanguageRegistry();
consoleLanguageRegistry.register(jjodieProvider);
consoleLanguageRegistry.register(jjscriptProvider);
consoleLanguageRegistry.register(jjelProvider);
