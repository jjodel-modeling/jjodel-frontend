// Every metric Tack computes, with the layer it needs. Layer 1: transcripts and git; layer 2:
// unit-of-work identity; layer 3: the self-assessment log.
import { LAYER1 } from './layer1.mjs';
import { STUBS } from './stubs.mjs';

export { loadSelection, resolveRepo } from './select.mjs';

export const METRICS = [...LAYER1, ...STUBS];

/** { name: value } for every metric over sel; params: { name: { param: value } } overrides the defaults. */
export function computeAll(sel, params = {}) {
  return Object.fromEntries(METRICS.map((m) => [m.name, m.compute(sel, { ...m.params, ...(params[m.name] ?? {}) })]));
}
