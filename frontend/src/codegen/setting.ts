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

/** The setting: on only when the key holds `'true'`; off with no key, no storage, or a storage that throws. */
export function getCodegenEnabled(): boolean {
    try {
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
 * The «Code» pill of an editor (discovery §I.5): the setting on, an M1 (generation runs on a model), and either the
 * metamodel the model is an instance of holds `genTemplates` in its `_state` (R-GEN-12), or Advanced mode (Redux
 * `state.advanced`, as `simPillVisible`), where the first template is written. The key is read as stored, never
 * decoded: the codec is the generator's, and this module loads without it.
 */
export function codePillVisible(
    enabled: boolean, advanced: boolean, lookup: Readonly<Record<string, any>>, modelid: string, isModelMode: boolean,
): boolean {
    if (!enabled || !isModelMode) return false;
    if (advanced) return true;
    const metamodelId = lookup[modelid]?.instanceof;
    if (typeof metamodelId !== 'string') return false;
    const stored = lookup[metamodelId]?._state?.genTemplates;
    return typeof stored === 'string' && stored !== '';
}
