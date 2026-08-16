/**
 * irKindConvert — reversible conversion between authorable IR kinds (slice B,
 * 2026-08-16, decisions D6..D10 in docs/sessioni/claude_sessione_2026-08-16_2.md).
 *
 * Pure module: no React, no joiner, no store. The caller (the Kind selector in
 * `irTabs.tsx` IRIdentityFields) writes the results through the L proxy, so the
 * `appliableTo` derivation stays where it lives, inside `set_ir` (view.tsx).
 *
 * Contract:
 * - Shared fields (`metaclasses`, `authoringMetaclassPins`, `label`) never enter
 *   the stash (D7): they are lifted from the CURRENT ir and overlaid on the target
 *   ir whatever its source, so coming back to a kind restores its specific fields
 *   on the current metaclasses instead of stale ones.
 * - Everything else of the departing ir (including `irVersion`) goes into the
 *   stash slot of its kind. Entering a kind whose slot is occupied restores and
 *   CONSUMES the slot, so the status line in the selector always reflects what a
 *   switch would actually recover.
 * - The stash lives OUTSIDE `ir`, as the sibling field `irStash` on the
 *   DViewElement (D6): `irHash` hashes `JSON.stringify(ir)` and feeds both the
 *   compile cache and `irDefaults.isMigratedDefaultView`; a foreign key inside
 *   `ir` would break both silently.
 */

import { defaultEdgeViewIR, defaultObjectViewIR } from './irDefaults';
import type { AnyViewIR, RowViewIR } from './irTypes';

/** The three kinds with an authoring panel; graphVertex is not authorable (R-6). */
export type AuthorableIRKind = 'vertex' | 'row' | 'edge';

const AUTHORABLE_KINDS: readonly AuthorableIRKind[] = ['vertex', 'row', 'edge'];

/**
 * Per-kind slots holding the kind-specific fields of an abandoned ir (everything
 * except the shared fields and the `kind` discriminator, which is implied by the
 * slot). Persisted as `DViewElement.irStash`; `undefined` when no slot is occupied.
 */
export interface IRKindStash {
    vertex?: Record<string, unknown>;
    row?: Record<string, unknown>;
    edge?: Record<string, unknown>;
}

export interface IRKindConversion {
    /** The new active ir, of the target kind. */
    ir: AnyViewIR;
    /** The updated stash: departing slot written, target slot consumed. */
    stash: IRKindStash;
}

/**
 * Fields that live in the active ir of EVERY kind and survive every conversion
 * (D7). `kind` is excluded on purpose: it is the discriminator, not a payload.
 */
const SHARED_KEYS = ['metaclasses', 'authoringMetaclassPins', 'label'] as const;

const isSharedKey = (k: string): boolean => (SHARED_KEYS as readonly string[]).includes(k);

/**
 * Minimal seed for a kind whose stash slot is empty. Same seeds EnableIRPanel
 * uses: a row without a `template` does not compile (compileRowView rejects it),
 * an edge starts with the compile defaults (`edge: {}`). Shared fields of the
 * seed are placeholders: the caller's overlay replaces them.
 */
function seedForKind(kind: AuthorableIRKind): AnyViewIR {
    switch (kind) {
        case 'vertex': return defaultObjectViewIR();
        case 'edge': return defaultEdgeViewIR();
        case 'row': {
            const seed: RowViewIR = {
                irVersion: 'ir-1.0',
                kind: 'row',
                metaclasses: [],
                template: [{ from: 'intrinsic', prop: 'name' }],
            };
            return seed;
        }
    }
}

/** The kinds whose stash slot is occupied, in canonical order. Drives the status line. */
export function stashedKinds(stash: IRKindStash | undefined): AuthorableIRKind[] {
    if (!stash) return [];
    return AUTHORABLE_KINDS.filter(k => stash[k] !== undefined);
}

/**
 * Convert `current` to `target`, threading the per-kind stash. Does not mutate its
 * arguments. `target === current.kind` is a no-op (current ir, stash unchanged).
 */
export function convertIRKind(
    current: AnyViewIR,
    target: AuthorableIRKind,
    stash: IRKindStash | undefined,
): IRKindConversion {
    const nextStash: IRKindStash = { ...(stash ?? {}) };
    if (current.kind === target) return { ir: current, stash: nextStash };

    // Shared fields lifted from the current ir. Collected before anything else so
    // the overlay below is a plain spread of ONE source of truth.
    const shared: Record<string, unknown> = {};
    for (const k of SHARED_KEYS) {
        const v = (current as unknown as Record<string, unknown>)[k];
        if (v !== undefined) shared[k] = v;
    }

    // Departing slot: everything kind-specific, `irVersion` included.
    const departing: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(current)) {
        if (k === 'kind' || isSharedKey(k) || v === undefined) continue;
        departing[k] = v;
    }
    if (current.kind === 'vertex' || current.kind === 'row' || current.kind === 'edge') {
        nextStash[current.kind] = departing;
    }

    // Target ir: restored slot (consumed) or minimal seed.
    const restored = nextStash[target];
    const base: Record<string, unknown> = restored ? { ...restored } : { ...(seedForKind(target) as unknown as Record<string, unknown>) };
    if (restored) delete nextStash[target];

    const ir: Record<string, unknown> = { ...base, kind: target, ...shared };
    // A shared field ABSENT on the current ir must not leak in from the seed (e.g.
    // the seed label 'Object (IR default)'): D7 reads "the shared fields are the
    // current ones", absence included.
    for (const k of SHARED_KEYS) {
        if (!(k in shared) && k !== 'metaclasses') delete ir[k];
    }

    return { ir: ir as unknown as AnyViewIR, stash: nextStash };
}
