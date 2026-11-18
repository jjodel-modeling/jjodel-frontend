/**
 * #213 — the pure decision core of a M1 link target's address
 * (`docs/discovery/discovery_2026-11-12_213_m1_cross_model_links.md`).
 *
 * Benchable under `environment: 'node'`: `instanceAddress.ts` imports nothing, so these tests
 * pin the DECISION — the first-`::` split, the model pick, the local-vs-cross verdict with
 * its `consultRegistry` data point, and the suggestion spellings — the way `referenceWrite.test.ts`
 * pins the write plans. The behavioral consequences (which id is written, which refusal is
 * emitted) are measured on the real handler in `crossModelLink.test.ts`.
 *
 * Mutation bench (recorded in the commit message): the tests die when (a) the qualified path
 * consults the handle registry (the `consultRegistry` data point flips), (b) the first-`::`
 * split becomes a last-`::` or an every-`::` split (the multi-`::` addresses), (c) the model
 * pick takes the first case-insensitive match over an exact hit (the `other`/`Other` pair),
 * (d) a bare-name cross-model fallback is introduced (the bare-name verdict stays `local`).
 */
import { describe, it, expect } from 'vitest';
import {
    parseInstanceAddress,
    pickModel,
    resolveInstanceAddress,
    elsewhereSuggestion,
    ModelRef,
} from '../instanceAddress';

const M1: ModelRef = { id: 'm1', name: 'M1' };
const OTHER: ModelRef = { id: 'm2', name: 'Other' };
const SECOND: ModelRef = { id: 'm3', name: 'Second' };
const MY_MODEL: ModelRef = { id: 'm4', name: 'My Model' };

// ── parseInstanceAddress ─────────────────────────────────────────────────────────────────────────

describe('parseInstanceAddress — split on the FIRST `::`, both halves verbatim', () => {
    it('a name without `::` is bare', () => {
        expect(parseInstanceAddress('p')).toEqual({ qualified: false, name: 'p' });
    });

    it('a `Model::instance` keeps both halves verbatim', () => {
        expect(parseInstanceAddress('Other::p')).toEqual({ qualified: true, model: 'Other', instance: 'p' });
    });

    it('a model name with a space is kept (the quoted form arrives as this string)', () => {
        expect(parseInstanceAddress('My Model::p')).toEqual({ qualified: true, model: 'My Model', instance: 'p' });
    });

    it('an address with several `::` splits on the FIRST one, the rest stays in the instance (dies on a last-`::` or every-`::` split)', () => {
        expect(parseInstanceAddress('Other::x::y')).toEqual({ qualified: true, model: 'Other', instance: 'x::y' });
        expect(parseInstanceAddress('A::B::p')).toEqual({ qualified: true, model: 'A', instance: 'B::p' });
    });

    it('a missing half stays an empty string: the handler refuses it, the parser does not invent one', () => {
        expect(parseInstanceAddress('::p')).toEqual({ qualified: true, model: '', instance: 'p' });
        expect(parseInstanceAddress('Other::')).toEqual({ qualified: true, model: 'Other', instance: '' });
    });
});

// ── pickModel ────────────────────────────────────────────────────────────────────────────────────

describe('pickModel — exact name first, then one case-insensitive match', () => {
    it('an exact hit wins even when a case-variant is listed before it (dies if the pick takes the first case-insensitive match)', () => {
        const models: ModelRef[] = [{ id: 'a', name: 'other' }, OTHER];
        expect(pickModel(models, 'Other')).toEqual({ kind: 'one', model: OTHER });
    });

    it('a lone case-insensitive match is the model', () => {
        const models: ModelRef[] = [M1, { id: 'a', name: 'other' }];
        expect(pickModel(models, 'Other')).toEqual({ kind: 'one', model: models[1] });
    });

    it('two exact names are ambiguous', () => {
        const models: ModelRef[] = [OTHER, { id: 'x', name: 'Other' }];
        const pick = pickModel(models, 'Other');
        expect(pick.kind).toBe('ambiguous');
        expect((pick as any).matches).toHaveLength(2);
    });

    it('two case-variants are ambiguous (neither is the exact name)', () => {
        const models: ModelRef[] = [{ id: 'a', name: 'other' }, { id: 'b', name: 'OTHER' }];
        expect(pickModel(models, 'Other').kind).toBe('ambiguous');
    });

    it('no match is absent, with the project models as the caller\'s suggestion list', () => {
        const models: ModelRef[] = [M1, OTHER];
        expect(pickModel(models, 'Nope')).toEqual({ kind: 'absent', models });
    });
});

// ── resolveInstanceAddress ───────────────────────────────────────────────────────────────────────

describe('resolveInstanceAddress — local vs cross, registry rule as data', () => {
    const models = [M1, OTHER, SECOND, MY_MODEL];

    it('a bare name stays local and consults the registry (dies if a bare name is cross-model or registry-free)', () => {
        expect(resolveInstanceAddress('p', M1, models)).toEqual({ kind: 'local', name: 'p', consultRegistry: true });
    });

    it('a cross-model address names the model and does NOT consult the registry (dies if the registry rule flips)', () => {
        expect(resolveInstanceAddress('Other::p', M1, models)).toEqual({
            kind: 'cross', model: OTHER, instance: 'p', consultRegistry: false,
        });
    });

    it('a qualifier naming the active model is local, registry included (the committed path)', () => {
        expect(resolveInstanceAddress('M1::p', M1, models)).toEqual({ kind: 'local', name: 'p', consultRegistry: true });
    });

    it('a quoted form with a space in the model name resolves to that model', () => {
        expect(resolveInstanceAddress('My Model::p', M1, models)).toEqual({
            kind: 'cross', model: MY_MODEL, instance: 'p', consultRegistry: false,
        });
    });

    it('a multi-`::` address stays with the model of the FIRST segment (dies on a last-`::` split)', () => {
        expect(resolveInstanceAddress('Other::x::y', M1, models)).toEqual({
            kind: 'cross', model: OTHER, instance: 'x::y', consultRegistry: false,
        });
    });

    it('an absent model is model-absent with the project models attached', () => {
        expect(resolveInstanceAddress('Nope::p', M1, models)).toEqual({
            kind: 'model-absent', qualifier: 'Nope', models,
        });
    });

    it('two models with the qualifier are model-ambiguous', () => {
        const r = resolveInstanceAddress('Other::p', M1, [M1, OTHER, { id: 'x', name: 'Other' }]);
        expect(r.kind).toBe('model-ambiguous');
        if (r.kind === 'model-ambiguous') {
            expect(r.qualifier).toBe('Other');
            expect(r.matches).toHaveLength(2);
        }
    });

    it('a case-insensitive qualifier resolves, and its cross verdict does not consult the registry', () => {
        const r = resolveInstanceAddress('other::p', M1, models);
        expect(r).toEqual({ kind: 'cross', model: OTHER, instance: 'p', consultRegistry: false });
    });
});

// ── elsewhereSuggestion ──────────────────────────────────────────────────────────────────────────

describe('elsewhereSuggestion — point a bare name at its qualified spellings', () => {
    it('one model: the plan sentence exactly', () => {
        expect(elsewhereSuggestion('p', ['Other'])).toBe("Found in 'Other': qualify as Other::p.");
    });

    it('several models: every qualified spelling, in the order given (dies if one is dropped)', () => {
        expect(elsewhereSuggestion('p', ['Other', 'Second']))
            .toBe("Found in 'Other', 'Second': qualify as Other::p or Second::p.");
    });

    it('a model name with a space is spelled verbatim in the suggestion', () => {
        expect(elsewhereSuggestion('pm', ['My Model'])).toBe("Found in 'My Model': qualify as My Model::pm.");
    });
});
