import type { EnvGenConfig, EnvGenConfigSummary } from '../types';

const STORAGE_KEY = 'jjodel_envgen_configs';
const CHANGE_EVENT = 'envgen-config-changed';

export class EnvGenPersistence {
    static getAll(): EnvGenConfigSummary[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const configs: EnvGenConfig[] = JSON.parse(raw);
            return configs.map(c => ({
                id: c.id,
                name: c.general.name || 'Untitled',
                metamodelName: c.general.metamodelId ? 'Metamodel' : '',
                techStackSummary: EnvGenPersistence.buildTechStackSummary(c),
                status: c.status,
                updatedAt: c.updatedAt,
            }));
        } catch {
            return [];
        }
    }

    static getById(id: string): EnvGenConfig | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const configs: EnvGenConfig[] = JSON.parse(raw);
            return configs.find(c => c.id === id) || null;
        } catch {
            return null;
        }
    }

    static save(config: EnvGenConfig): void {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const configs: EnvGenConfig[] = raw ? JSON.parse(raw) : [];
            const idx = configs.findIndex(c => c.id === config.id);
            if (idx >= 0) {
                configs[idx] = config;
            } else {
                configs.push(config);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
            window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
        } catch (e) {
            console.error('[EnvGenPersistence] Failed to save config:', e);
        }
    }

    static delete(id: string): void {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const configs: EnvGenConfig[] = JSON.parse(raw);
            const filtered = configs.filter(c => c.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
        } catch (e) {
            console.error('[EnvGenPersistence] Failed to delete config:', e);
        }
    }

    static updateMetamodelName(configId: string, metamodelName: string): void {
        const config = EnvGenPersistence.getById(configId);
        if (!config) return;
        config.updatedAt = Date.now();
        EnvGenPersistence.save(config);
    }

    private static buildTechStackSummary(config: EnvGenConfig): string {
        const parts: string[] = [];
        const frameworkMap: Record<string, string> = {
            react: 'React', vue: 'Vue 3', angular: 'Angular', svelte: 'Svelte', vanilla: 'Vanilla JS',
        };
        const uiMap: Record<string, string> = {
            bootstrap: 'Bootstrap 5', tailwind: 'Tailwind', mui: 'MUI', antdesign: 'Ant Design', custom: 'Custom CSS',
        };
        const themeMap: Record<string, string> = {
            dark: 'Dark theme', light: 'Light theme', system: 'Auto theme',
        };

        if (config.techStack.framework) parts.push(frameworkMap[config.techStack.framework] || config.techStack.framework);
        if (config.techStack.uiLibrary) parts.push(uiMap[config.techStack.uiLibrary] || config.techStack.uiLibrary);
        if (config.design.theme) parts.push(themeMap[config.design.theme] || config.design.theme);

        return parts.join(' · ') || 'No tech stack configured';
    }
}

export const ENVGEN_CHANGE_EVENT = CHANGE_EVENT;
export const ENVGEN_OPEN_WIZARD_EVENT = 'envgen-open-wizard';
