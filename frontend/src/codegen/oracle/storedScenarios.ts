/**
 * storedScenarios — the scenarios stored on a model, as the oracle reads them (slice S7b, P-2026-10-11-1053;
 * R-SIM-139, R-GEN-11).
 *
 * The model bag's `runScenarios` key (scenarioCodec.ts), decoded tolerantly: a defective scenario is left out and the
 * others are read, in their stored order; no key, or a value that is not a string, is no scenario. One reading for
 * the probes' hook (oracle.ts `hookRun`) and the code panel's «Check» (CodePanel.tsx).
 *
 * Pure: the codec only.
 */

import { RUN_SCENARIOS_KEY, decodeScenarios } from '../../model/simulation/scenarioCodec';
import type { ScenarioRecord } from '../../model/simulation/scenarioCodec';

type Lookup = Record<string, any>;

/** The model's stored key, `undefined` when it has none or the value is not a string. */
export function storedScenariosRaw(lookup: Lookup, modelId: string): string | undefined {
    const raw = lookup[modelId]?._state?.[RUN_SCENARIOS_KEY];
    return typeof raw === 'string' ? raw : undefined;
}

/** The scenarios of a stored key's value, in order; the defective ones left out. */
export function decodeStoredScenarios(raw: unknown): ScenarioRecord[] {
    return decodeScenarios(typeof raw === 'string' ? raw : undefined).scenarios;
}

/** The scenarios stored on the model, in order. */
export function storedScenarios(lookup: Lookup, modelId: string): ScenarioRecord[] {
    return decodeStoredScenarios(storedScenariosRaw(lookup, modelId));
}
