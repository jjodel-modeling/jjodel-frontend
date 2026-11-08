/**
 * One populate owner per model (multi-tab L4, P-2026-11-08-0131, R-MT-17).
 *
 * The instances of a model are kept in mount order; the first is the owner, and releasing it hands the
 * populate to the next. The release says when the model has no instance left, which is when
 * `useJjomSync` clears the sync registries. See docs/discovery/lir_2026-11-07_l4_populate_owner.md §1.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { acquirePopulateOwner, releasePopulateOwner, isPopulateOwner } from '../syncState';

const held: Array<[string, object]> = [];
const acquire = (modelId: string, token: object) => { held.push([modelId, token]); acquirePopulateOwner(modelId, token); };
afterEach(() => { for (const [m, t] of held.splice(0)) releasePopulateOwner(m, t); });

describe('populate owner registry', () => {
    it('the first mounted instance of a model owns the populate, the second does not', () => {
        const a = {}, b = {};
        acquire('m', a); acquire('m', b);
        expect(isPopulateOwner('m', a)).toBe(true);
        expect(isPopulateOwner('m', b)).toBe(false);
    });

    it('releasing the owner hands the populate to the next instance in mount order', () => {
        const a = {}, b = {}, c = {};
        acquire('m', a); acquire('m', b); acquire('m', c);
        expect(releasePopulateOwner('m', a)).toBe(false);
        expect(isPopulateOwner('m', b)).toBe(true);
        expect(isPopulateOwner('m', c)).toBe(false);
    });

    it('releasing a non-owner keeps the owner', () => {
        const a = {}, b = {};
        acquire('m', a); acquire('m', b);
        expect(releasePopulateOwner('m', b)).toBe(false);
        expect(isPopulateOwner('m', a)).toBe(true);
    });

    it('the release of the last instance of a model returns true, and only that one', () => {
        const a = {}, b = {};
        acquire('m', a); acquire('m', b);
        expect(releasePopulateOwner('m', a)).toBe(false);
        expect(releasePopulateOwner('m', b)).toBe(true);
        expect(isPopulateOwner('m', b)).toBe(false);
    });

    it('a release run twice counts once', () => {
        const a = {}, b = {};
        acquire('m', a); acquire('m', b);
        expect(releasePopulateOwner('m', a)).toBe(false);
        expect(releasePopulateOwner('m', a)).toBe(false);
        expect(isPopulateOwner('m', b)).toBe(true);
    });

    it('an acquire run twice does not add the instance twice', () => {
        const a = {};
        acquire('m', a); acquire('m', a);
        expect(releasePopulateOwner('m', a)).toBe(true);
    });

    it('models are independent: each has its own owner and its own last release', () => {
        const a = {}, b = {};
        acquire('m', a); acquire('n', b);
        expect(isPopulateOwner('m', a)).toBe(true);
        expect(isPopulateOwner('n', b)).toBe(true);
        expect(isPopulateOwner('n', a)).toBe(false);
        expect(releasePopulateOwner('m', a)).toBe(true);
        expect(isPopulateOwner('n', b)).toBe(true);
    });

    it('a model never acquired has no owner, and its release is not a last release', () => {
        expect(isPopulateOwner('x', {})).toBe(false);
        expect(releasePopulateOwner('x', {})).toBe(false);
    });
});
