/**
 * Test for the VersionFixer migration `2.227 -> 2.228`
 * (`DProject.activeViewpoint` normalized to `null` when it holds a system viewpoint).
 *
 * SOURCE: `frontend/src/redux/VersionFixer.tsx`, adapter `['2.227 -> 2.228']`.
 * The body below is a COPY of that adapter, not an import: `VersionFixer.tsx` drags the whole
 * joiner in and is not loadable in the node vitest environment. The two copies are born in the
 * same commit, so they start aligned — whoever edits the adapter must edit this file too
 * (R-IRN-20, which accepts the duplication because it is the only automatic verification this
 * front can have: the smoke never opens a saved project, so it never runs VersionFixer.update).
 *
 * `Defaults.isSystemViewpoint` is likewise reproduced instead of imported (`common/Defaults.ts`
 * imports from `../joiner`). It reads `Defaults.viewpoints`, which holds exactly one id
 * (`Pointer_ViewPointDefault`) and stays full by R-IRN-14.
 */
import { describe, it, expect } from 'vitest';

type AnyRec = Record<string, any>;
interface DStateLike { idlookup: AnyRec; version?: { n: number; date?: string; conversionList?: number[] }; [k: string]: any; }

/** Copy of `Defaults.viewpoints` (common/Defaults.ts:26). */
const SYSTEM_VIEWPOINTS: string[] = ['Pointer_ViewPointDefault'];
/** Copy of `Defaults.isSystemViewpoint` (common/Defaults.ts:105). */
const isSystemViewpoint = (id: any): boolean => SYSTEM_VIEWPOINTS.includes(id as string);

// ---------------------------------------------------------------------------
// MIGRATION BODY — kept byte-aligned with VersionFixer.tsx `['2.227 -> 2.228']`.
// ---------------------------------------------------------------------------
export function migrate_2227_to_2228(s: DStateLike): DStateLike {
    const idlookup: any = s.idlookup;
    if (!idlookup || typeof idlookup !== 'object') return s;

    let normalized = 0;
    for (const k in idlookup) {
        const e = idlookup[k];
        // R-IRN-13: `idlookup.clonedCounter` is a number sitting among the records.
        if (!e || typeof e !== 'object') continue;
        if (e.className !== 'DProject') continue;
        if (!isSystemViewpoint(e.activeViewpoint)) continue;
        e.activeViewpoint = null;
        normalized++;
    }

    if (normalized) {
        console.log(`[VersionFixer 2.227 -> 2.228] activeViewpoint: ${normalized} progetto/i `
            + `riportato/i a null (era un viewpoint di sistema).`);
    }
    return s;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const project = (id: string, activeViewpoint: any): AnyRec =>
    ({ id, className: 'DProject', name: id, activeViewpoint, viewpoints: [] });

const stateWith = (entries: AnyRec, extra: AnyRec = {}): DStateLike =>
    ({ idlookup: { ...entries, ...extra }, version: { n: 2.227, date: '', conversionList: [] } });

describe('VersionFixer 2.227 -> 2.228 — activeViewpoint normalized to null', () => {

    it('rewrites a system viewpoint to null', () => {
        const s = stateWith({ P1: project('P1', 'Pointer_ViewPointDefault') });
        migrate_2227_to_2228(s);
        expect(s.idlookup.P1.activeViewpoint).toBe(null);
    });

    it('leaves a user viewpoint untouched', () => {
        const userVp = 'Pointer_DViewPoint_ab12cd34';
        const s = stateWith({
            P1: project('P1', userVp),
            [userVp]: { id: userVp, className: 'DViewPoint', name: 'My viewpoint' },
        });
        migrate_2227_to_2228(s);
        expect(s.idlookup.P1.activeViewpoint).toBe(userVp);
    });

    it('normalizes every DProject in idlookup, not just the first', () => {
        const s = stateWith({
            P1: project('P1', 'Pointer_ViewPointDefault'),
            P2: project('P2', 'Pointer_DViewPoint_keepme'),
            P3: project('P3', 'Pointer_ViewPointDefault'),
        });
        migrate_2227_to_2228(s);
        expect(s.idlookup.P1.activeViewpoint).toBe(null);
        expect(s.idlookup.P2.activeViewpoint).toBe('Pointer_DViewPoint_keepme');
        expect(s.idlookup.P3.activeViewpoint).toBe(null);
    });

    it('is idempotent: a second run is deep-equal to the first', () => {
        const s = stateWith({
            P1: project('P1', 'Pointer_ViewPointDefault'),
            P2: project('P2', 'Pointer_DViewPoint_keepme'),
        });
        const afterFirst = JSON.parse(JSON.stringify(migrate_2227_to_2228(s)));
        const afterSecond = JSON.parse(JSON.stringify(migrate_2227_to_2228(s)));
        expect(afterSecond).toEqual(afterFirst);
    });

    it('is a no-op on a clean fixture (already null, and no DProject at all)', () => {
        const s = stateWith({
            P1: project('P1', null),
            V1: { id: 'V1', className: 'DViewElement', name: 'a view' },
        });
        const before = JSON.parse(JSON.stringify(s));
        migrate_2227_to_2228(s);
        expect(JSON.parse(JSON.stringify(s))).toEqual(before);
    });

    it('survives idlookup.clonedCounter, which is a number and not a record (R-IRN-13)', () => {
        const s = stateWith(
            { P1: project('P1', 'Pointer_ViewPointDefault') },
            { clonedCounter: 178, aNull: null, aString: 'not a record' },
        );
        expect(() => migrate_2227_to_2228(s)).not.toThrow();
        expect(s.idlookup.P1.activeViewpoint).toBe(null);
        expect(s.idlookup.clonedCounter).toBe(178);
    });

    it('handles a project whose activeViewpoint key is absent', () => {
        const s = stateWith({ P1: { id: 'P1', className: 'DProject', name: 'P1' } });
        migrate_2227_to_2228(s);
        expect(s.idlookup.P1.activeViewpoint).toBeUndefined();
    });

    it('returns s unchanged when idlookup is missing', () => {
        const s = { version: { n: 2.227 } } as any as DStateLike;
        expect(migrate_2227_to_2228(s)).toBe(s);
    });
});
