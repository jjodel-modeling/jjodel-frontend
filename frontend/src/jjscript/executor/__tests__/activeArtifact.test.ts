/**
 * The cache decides which artefact is on screen, and therefore which level.
 *
 * The bug this pins: with a metamodel tab focused and an element selected in an M1 model at any
 * earlier time, `getActiveModel()` walked past the cache to `_lastSelected` and answered M1,
 * while `getActiveLevel()` answered M2. A Jjodie reply was stamped M1 and `create enum` was
 * refused by the M2 guard in `commands/create.ts`. Measured in
 * `docs/discovery/discovery_2026-09-16_jjodie_scope_level_m1_on_metamodel.md`.
 *
 * Pure-function tests on purpose: `utils.ts` cannot be imported under the repo's
 * `environment: 'node'` (it reaches monaco through `joiner` and the dock through `DockManager`),
 * the same constraint `scopeGuard.test.ts` declares. The fallbacks are injected here, so the
 * whole decision is executed, not read.
 *
 * Mutation bench (2026-09-16), three mutants run against `activeArtifact.ts`, each reverted:
 *
 * M1 (the pre-fix rule): a level mismatch falls through to the chain instead of returning null.
 *   4 red: "asking for the active M1 model gets null", "level and artefact agree", the symmetric
 *   "asking for the active metamodel gets null", and "the other level is still refused, stale id
 *   or not". `resolveActiveLevel` is untouched by this mutant, so "the level is M2" stays green:
 *   it is about the other half of the disagreement, and the agreement test pins the two together.
 * M2 (any populated cache decides the level): `return cache.editorType !== 'model';`
 *   4 red, all of them the non-artefact-tab controls. Jodie stamps the cache on every
 *   EDITOR_TYPE_CHANGE that carries a modelId, so without that guard a JjTL or viewpoint tab
 *   would suppress the fallbacks the fix deliberately keeps.
 * M3 (the stale-cache softening removed): `return resolveCached();` on a level match.
 *   1 red, "falls through to the chain rather than answering null", and only that one. The level
 *   rule is what the other tests are about; this is the only test that asks what happens when the
 *   cache is right about the level and wrong about the id.
 *
 * The cold-cache controls stay green under all three, which is their job: they prove the chain is
 * still live, so the nulls asserted above come from the cache rule and not from a broken loop.
 */

import { describe, it, expect } from 'vitest';
import {
    resolveActiveArtifact,
    resolveActiveLevel,
    cachedArtifactIsMetamodel,
} from '../activeArtifact';
import type { ActiveArtifactCache } from '../activeArtifact';

// ─── fixtures ────────────────────────────────────────────────────────────────

const M1 = { id: 'model-micro-instances', name: 'Micro M1', isMetamodel: false };
const MM = { id: 'model-micro-mm-v1', name: 'Micro MM v1', isMetamodel: true };

const cache = (editorType: string, modelId: string): ActiveArtifactCache => ({ editorType, modelId });

/** The dock leg never answers on the level we are not on: the focused tab is the other artefact. */
const dockSees = (m: typeof M1 | typeof MM | null) => () => m;
/** The last click, which is the stale leg the bug came through. */
const lastSelectionIn = (m: typeof M1 | typeof MM | null) => () => m;

// ─── the bug ─────────────────────────────────────────────────────────────────

describe('a metamodel tab is focused, an M1 element was selected earlier', () => {
    const c = cache('metamodel', MM.id);
    const fallbacks = [dockSees(MM), lastSelectionIn(M1)];

    it('asking for the active M1 model gets null, not the model of the last selection', () => {
        const model = resolveActiveArtifact(/* expectMetamodel */ false, c, () => MM, fallbacks);
        expect(model).toBeNull();
    });

    it('the level is M2', () => {
        expect(resolveActiveLevel(c, () => true)).toBe('M2');
    });

    it('the metamodel resolves from the cache, without consulting a fallback', () => {
        let fallbacksRan = 0;
        const counted = fallbacks.map((f) => () => { fallbacksRan++; return f(); });
        const mm = resolveActiveArtifact(/* expectMetamodel */ true, c, () => MM, counted);
        expect(mm).toBe(MM);
        expect(fallbacksRan).toBe(0);
    });

    it('level and artefact agree, so the disagreement that produced the M1 stamp cannot recur', () => {
        const level = resolveActiveLevel(c, () => true);
        const model = resolveActiveArtifact(false, c, () => MM, fallbacks);
        const metamodel = resolveActiveArtifact(true, c, () => MM, fallbacks);
        expect(level === 'M1' ? model : metamodel).not.toBeNull();
        expect(level === 'M1' ? metamodel : model).toBeNull();
    });
});

// ─── the symmetric case ──────────────────────────────────────────────────────

describe('an M1 model tab is focused, a metamodel element was selected earlier', () => {
    const c = cache('model', M1.id);
    const fallbacks = [dockSees(M1), lastSelectionIn(MM)];

    it('asking for the active metamodel gets null, not the metamodel of the last selection', () => {
        expect(resolveActiveArtifact(/* expectMetamodel */ true, c, () => M1, fallbacks)).toBeNull();
    });

    it('the level is M1 and the model resolves from the cache', () => {
        expect(resolveActiveLevel(c, () => false)).toBe('M1');
        expect(resolveActiveArtifact(false, c, () => M1, fallbacks)).toBe(M1);
    });
});

// ─── controls: the fallbacks are still live ──────────────────────────────────

describe('CONTROL: a cold cache keeps the fallback chain', () => {
    const fallbacks = [dockSees(null), lastSelectionIn(M1)];

    it('the same fallbacks that were refused above now answer', () => {
        expect(resolveActiveArtifact(false, null, () => null, fallbacks)).toBe(M1);
    });

    it('the chain is tried in order and skips a candidate of the wrong level', () => {
        expect(resolveActiveArtifact(true, null, () => null, [dockSees(M1), lastSelectionIn(MM)])).toBe(MM);
    });

    it('the level comes from the cold fallback', () => {
        expect(resolveActiveLevel(null, () => true)).toBe('M1');
        expect(resolveActiveLevel(null, () => false)).toBe('M2');
    });

    it('nothing anywhere is null, not a throw', () => {
        expect(resolveActiveArtifact(false, null, () => null, [dockSees(null)])).toBeNull();
        expect(resolveActiveArtifact(false, null, () => null, [])).toBeNull();
    });
});

// ─── the stale cache ─────────────────────────────────────────────────────────

describe('the cache names this level but its id no longer resolves', () => {
    // Nothing ever clears `_activeArtifactCache`: `setActiveArtifactCache` has exactly three
    // callers, all in Jodie, and `MyRcDock.removeTab` is a stub. Delete the artefact whose tab
    // is active and the cache keeps naming it with no EDITOR_TYPE_CHANGE to restamp.
    const c = cache('metamodel', 'model-deleted-while-its-tab-was-open');

    it('falls through to the chain rather than answering null', () => {
        const live = { id: 'mm-other', name: 'Other MM', isMetamodel: true };
        expect(resolveActiveArtifact(true, c, () => null, [dockSees(live)])).toBe(live);
    });

    it('but the other level is still refused, stale id or not', () => {
        expect(resolveActiveArtifact(false, c, () => null, [lastSelectionIn(M1)])).toBeNull();
    });

    it('null when the chain has nothing either', () => {
        expect(resolveActiveArtifact(true, c, () => null, [dockSees(null)])).toBeNull();
    });
});

describe('CONTROL: a tab that is not an artefact does not decide', () => {
    // Jodie stamps the cache for any EDITOR_TYPE_CHANGE carrying a modelId, and the dock sends
    // 'summary', 'transformation' and 'viewpoint' too. Those must not suppress the fallbacks.
    for (const editorType of ['summary', 'transformation', 'viewpoint', '']) {
        it(`'${editorType}' falls through to the chain`, () => {
            const c = cache(editorType, 'jjtl_whatever');
            expect(cachedArtifactIsMetamodel(c)).toBeNull();
            expect(resolveActiveArtifact(false, c, () => null, [lastSelectionIn(M1)])).toBe(M1);
            expect(resolveActiveLevel(c, () => true)).toBe('M1');
        });
    }
});

describe('cachedArtifactIsMetamodel', () => {
    it('reads the two artefact levels and nothing else', () => {
        expect(cachedArtifactIsMetamodel(cache('metamodel', MM.id))).toBe(true);
        expect(cachedArtifactIsMetamodel(cache('model', M1.id))).toBe(false);
        expect(cachedArtifactIsMetamodel(null)).toBeNull();
        expect(cachedArtifactIsMetamodel(undefined)).toBeNull();
    });
});
