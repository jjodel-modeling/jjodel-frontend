/**
 * setting — the experimental code generation setting, and the rule of its «Code» pill (slice S5, P-2026-10-10-1825;
 * spec §2, R-GEN-2, discovery §E.1-§E.2, U4).
 *
 * The one module of `src/codegen/` that loads with the setting off: Settings → Advanced reads and writes it, and
 * EditorV2 reads it to decide whether to mount the pill and, once pressed, the lazy code panel
 * (`React.lazy(() => import('../../codegen/ui/CodePanel'))`). So it imports nothing of the generator, and the lazy
 * gate (`scripts/gates/check-codegen-lazy.ts`) allows it alone in the entry's closure.
 *
 * Per browser, like every preference (the `useInterfaceMode` precedent, hooks/useInterfaceMode.ts): one localStorage
 * key, off unless it holds `'true'`. A change in this tab is announced by `JjodelEvents.EXPERIMENTAL_CODEGEN_CHANGED`,
 * one in another tab by the `storage` event; «Clear local data» removes the key, which is off again.
 */

import { useSyncExternalStore } from 'react';
import { JjodelEvents } from '../events/registry';

/** The localStorage key of the setting (0 hits before this slice, discovery §E.2). */
export const CODEGEN_SETTING_KEY = 'jjodel.experimental.codegen';

/**
 * The setting: on only when the build carries the flag and the key holds `'true'`; off with no key, no storage, or a
 * storage that throws. The flag (P-2026-10-12-0012, release 3.1): `VITE_CODEGEN=true` at build time, unset in 3.1 and
 * in vitest; read on every call, so `vi.stubEnv` reaches it. Written as the bare text `import.meta.env.VITE_CODEGEN`:
 * Vite's build replaces that form with a literal and vitest's env replacer matches that text, while a cast such as
 * `(import.meta as any).env` or a `?.` is seen by neither. tsconfig has no vite/client types, hence the ts-ignore.
 */
export function getCodegenEnabled(): boolean {
    try {
        // @ts-ignore -- `env` is not on ImportMeta for tsc here (vite-env.d.ts); see above.
        if (import.meta.env.VITE_CODEGEN !== 'true') return false;
        return typeof localStorage !== 'undefined' && localStorage.getItem(CODEGEN_SETTING_KEY) === 'true';
    } catch {
        return false;
    }
}

/** Writes the setting and announces it in this tab. */
export function setCodegenEnabled(enabled: boolean): void {
    localStorage.setItem(CODEGEN_SETTING_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent(JjodelEvents.EXPERIMENTAL_CODEGEN_CHANGED, { detail: { enabled } }));
}

/**
 * Calls `onChange` when the setting may have changed: the event of this tab, or a `storage` event of another tab on
 * the key (or on the whole storage, `key` null, a `clear()`). Returns the unsubscribe.
 */
export function subscribeCodegenEnabled(onChange: () => void): () => void {
    const onStorage = (e: StorageEvent) => {
        if (e.key === CODEGEN_SETTING_KEY || e.key === null) onChange();
    };
    window.addEventListener(JjodelEvents.EXPERIMENTAL_CODEGEN_CHANGED, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
        window.removeEventListener(JjodelEvents.EXPERIMENTAL_CODEGEN_CHANGED, onChange);
        window.removeEventListener('storage', onStorage);
    };
}

/** The setting, re-read on every change `subscribeCodegenEnabled` reports. */
export function useCodegenEnabled(): boolean {
    return useSyncExternalStore(subscribeCodegenEnabled, getCodegenEnabled, getCodegenEnabled);
}

/**
 * The «Code» pill of an editor (discovery §I.5): the setting on, and either the metamodel holds `genTemplates` or
 * `genGenerators` in its `_state` (R-GEN-12, R-GEN-32, P-2026-10-24-0001), or Advanced mode (Redux `state.advanced`, as `simPillVisible`), where the first template is
 * written. The metamodel is the one the model is an instance of on an M1, the editor's own on an M2 (R-GEN-19,
 * P-2026-10-23-1910: the templates live there). The key is read as stored, never decoded: the codec is the
 * generator's, and this module loads without it.
 */
export function codePillVisible(
    enabled: boolean, advanced: boolean, lookup: Readonly<Record<string, any>>, modelid: string, isModelMode: boolean,
): boolean {
    if (!enabled) return false;
    if (advanced) return true;
    const metamodelId = isModelMode ? lookup[modelid]?.instanceof : modelid;
    if (typeof metamodelId !== 'string') return false;
    const bag = lookup[metamodelId]?._state;
    const present = (stored: unknown) => typeof stored === 'string' && stored !== '';
    return present(bag?.genTemplates) || present(bag?.genGenerators);
}

/** The id of the default generator, as `engine/generatorCodec.ts` names it (`DEFAULT_GENERATOR_ID`), not imported. */
const DEFAULT_ENTRY_ID = 'default';

/** A generator row of the left bar's GENERATORS section (R-GEN-42). */
export interface GeneratorEntry {
    readonly id: string;
    readonly name: string;
}

/**
 * The generators of the metamodel `metamodelId` for the left bar (R-GEN-42, P-2026-10-24-0004): the default first,
 * named by `genGenerators` or «Default», then the others in their stored order; none when the metamodel holds neither
 * key. A key read and a guarded `JSON.parse` of `genGenerators` only, never the codec (this module loads with the
 * setting off): a key that does not parse, or has no version 1 and no list, gives the default alone, as
 * `decodeGenerators` does. A row is kept with a non-empty id and name and an id no earlier kept row holds; the
 * codec's finer checks (root, files, target, templates) are not repeated, so a hand-broken generator can be listed
 * here and refused by the tab.
 */
export function generatorEntries(lookup: Readonly<Record<string, any>>, metamodelId: string): GeneratorEntry[] {
    const bag = lookup[metamodelId]?._state;
    const present = (stored: unknown) => typeof stored === 'string' && stored !== '';
    if (!present(bag?.genTemplates) && !present(bag?.genGenerators)) return [];
    let defaultName = 'Default';
    const others: GeneratorEntry[] = [];
    let parsed: any = null;
    try {
        parsed = present(bag.genGenerators) ? JSON.parse(bag.genGenerators) : null;
    } catch {
        parsed = null;
    }
    if (parsed && typeof parsed === 'object' && parsed.v === 1 && Array.isArray(parsed.generators)) {
        const ids = new Set<string>();
        for (const g of parsed.generators) {
            if (!g || typeof g !== 'object') continue;
            if (typeof g.id !== 'string' || g.id === '' || ids.has(g.id)) continue;
            if (typeof g.name !== 'string' || g.name === '') continue;
            ids.add(g.id);
            if (g.id === DEFAULT_ENTRY_ID) defaultName = g.name;
            else others.push({ id: g.id, name: g.name });
        }
    }
    return [{ id: DEFAULT_ENTRY_ID, name: defaultName }, ...others];
}
