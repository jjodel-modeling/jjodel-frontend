/**
 * #196 L6 lane 1: the provider GUI table against today's `AI[p]` of `types/jodie.ts`, compared by
 * value for every provider it defines. Lane 2 deletes `types/jodie.ts` and rewrites this comparison
 * to literal values.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROVIDER_IDS } from '../../../services/ai';
import { PROVIDER_VISUALS, providerVisual } from '../providerVisuals';

vi.mock('../../../joiner', () => ({
    RuntimeAccessible: () => (target: unknown) => target,
    Log: { eDevv: vi.fn() },
    U: { toInstanceOf: (value: object | null, ctor: { prototype: object }) =>
        value ? Object.assign(Object.create(ctor.prototype), value) : null },
}));

beforeEach(() => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined, removeItem: () => undefined });
    vi.stubGlobal('window', { dispatchEvent: () => true });
});
afterEach(() => vi.unstubAllGlobals());

const today = () => import('../../../types/jodie');

describe('PROVIDER_VISUALS', () => {
    it('has a row for every provider of today, parked ones included, and no other', async () => {
        const { ALL_AI_PROVIDERS } = await today();
        expect(Object.keys(PROVIDER_VISUALS).sort()).toEqual([...ALL_AI_PROVIDERS].sort());
    });

    it('answers the GUI values AI[p] answers today', async () => {
        const { AI, ALL_AI_PROVIDERS } = await today();
        for (const p of ALL_AI_PROVIDERS) {
            const llm = AI[p];
            expect(providerVisual(p), p).toEqual({
                initial: llm.initial,
                keyPlaceholder: llm.keyPlaceholder,
                color: llm.color,
                bgColor: llm.bgColor,
                logo: llm.logo,
                keyUrl: llm.keyUrl,
            });
        }
    });

    it('covers every registry provider', () => {
        for (const p of PROVIDER_IDS) expect(providerVisual(p), p).toBeDefined();
    });
});

describe('providerVisual', () => {
    it('answers undefined for no name, an unknown name and an inherited property', () => {
        expect(providerVisual(undefined)).toBeUndefined();
        expect(providerVisual(null)).toBeUndefined();
        expect(providerVisual('')).toBeUndefined();
        expect(providerVisual('Copilot2')).toBeUndefined();
        expect(providerVisual('toString')).toBeUndefined();
    });
});
