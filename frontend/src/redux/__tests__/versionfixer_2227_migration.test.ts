/**
 * PROOF / PROTOTYPE for the VersionFixer migration `2.226 -> 2.227`
 * (bonifica slot DValue duplicati da import XMI pre-fix 4811db8).
 *
 * The migration body below is the EXACT code to inline as
 * `private ['2.226 -> 2.227'](s: DState): DState { ... }` in VersionFixer.tsx.
 * It is duplicated here (not imported) so the proof runs in the node vitest
 * environment without dragging VersionFixer.tsx's heavy deps (same constraint
 * that keeps other pure migrations testable). See discovery report
 * docs/discovery/discovery_2026-07-20_versionfixer_bonifica_slot.md.
 *
 * Assunzioni ratificate (5 domande del discovery):
 *   1. Opzione A (superstite = slot valorizzato non-mirage) + riordino di
 *      `features` secondo l'ordine della metaclasse, SOLO sugli oggetti bonificati.
 *   2. fix push radici in XMIService.ts nello stesso giro (task gemello, non qui).
 *   3. fixture fabbricata a mano (questo file).
 *   4. dedup dei target pointer nel merge Format B: sì (EMF garantisce unicità).
 *   5. versione 2.226 -> 2.227.
 */
import { describe, it, expect } from 'vitest';

type AnyRec = Record<string, any>;
interface DStateLike { idlookup: AnyRec; objects?: string[]; values?: string[]; version?: { n: number }; [k: string]: any; }

// ---------------------------------------------------------------------------
// MIGRATION BODY — paste verbatim into VersionFixer.tsx as ['2.226 -> 2.227'].
// ---------------------------------------------------------------------------
export function migrate_2226_to_2227(s: DStateLike): DStateLike {
    const idlookup = s.idlookup;
    if (!idlookup || typeof idlookup !== 'object') return s;

    const dedupKeepFirst = (arr: any[]): any[] => {
        if (!Array.isArray(arr)) return arr;
        const seen = new Set<any>();
        const out: any[] = [];
        for (const x of arr) { if (seen.has(x)) continue; seen.add(x); out.push(x); }
        return out;
    };
    const isPointerArray = (vals: any[]): boolean =>
        Array.isArray(vals) && vals.length > 1
        && vals.every(v => typeof v === 'string' && idlookup[v] && idlookup[v].className === 'DObject');

    const removed = new Set<string>();
    const reparent = new Map<string, string>(); // loser DValue id -> survivor id
    let dedupSlots = 0, mergedVals = 0, dupRoots = 0, dupChildPtrs = 0, reordered = 0;

    // FASE A — dedup slot per (DObject, meta-feature); merge Format B; reorder touched.
    for (const k in idlookup) {
        const e = idlookup[k];
        if (!e || typeof e !== 'object' || e.className !== 'DObject' || !Array.isArray(e.features)) continue;

        // A1: dedup features by id (a valued slot id can appear twice — Firma 1).
        e.features = dedupKeepFirst(e.features);

        // A2: group resolvable slots by instanceof (skip undefined = schema-less).
        const groups = new Map<string, string[]>();
        for (const fid of e.features) {
            const dv = idlookup[fid];
            if (!dv || dv.className !== 'DValue') continue;
            const inst = dv.instanceof;
            if (typeof inst !== 'string') continue;
            const arr = groups.get(inst) ?? [];
            arr.push(fid);
            groups.set(inst, arr);
        }

        let touched = false;
        for (const [, fids] of groups) {
            if (fids.length <= 1) continue;
            const slots = fids.map(f => idlookup[f]).filter(Boolean);
            // survivor: first non-mirage valued; else first non-mirage; else first.
            const survivor = slots.find(v => v.isMirage === false && Array.isArray(v.values) && v.values.length > 0)
                ?? slots.find(v => v.isMirage === false)
                ?? slots[0];
            for (const loser of slots) {
                if (loser === survivor) continue;
                // merge values (Format B multi-slot reference); dedup pointers.
                if (Array.isArray(loser.values)) {
                    if (!Array.isArray(survivor.values)) survivor.values = [];
                    for (const v of loser.values) if (!survivor.values.includes(v)) { survivor.values.push(v); mergedVals++; }
                }
                reparent.set(loser.id, survivor.id);
                removed.add(loser.id);
                delete idlookup[loser.id];
                dedupSlots++;
            }
            if (survivor.isMirage && Array.isArray(survivor.values) && survivor.values.length > 0) survivor.isMirage = false;
            touched = true;
        }
        // Drop deleted losers from features.
        if (touched) e.features = e.features.filter((f: string) => !removed.has(f));

        // Opzione A + riordino: only on bonified objects, order features by the
        // metaclass feature order (cosmetic: IR raw-order renderer; zero
        // referential risk). Clean objects are left untouched (strict no-op).
        if (touched) {
            const meta = e.instanceof ? idlookup[e.instanceof] : null;
            const order: string[] | null = meta && Array.isArray(meta.features) ? meta.features : null;
            if (order && order.length) {
                const rank = (fid: string): number => {
                    const inst = idlookup[fid]?.instanceof;
                    const i = typeof inst === 'string' ? order.indexOf(inst) : -1;
                    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
                };
                const before = e.features.join(',');
                e.features = [...e.features].sort((a: string, b: string) => rank(a) - rank(b));
                if (e.features.join(',') !== before) reordered++;
            }
        }
    }

    // FASE B — dedup duplicate pointers (independent of FASE A; runs on post-fix saves too).
    for (const k in idlookup) {
        const e = idlookup[k];
        if (!e || typeof e !== 'object') continue;
        if (e.className === 'DModel' && Array.isArray(e.objects)) {
            const b = e.objects.length; e.objects = dedupKeepFirst(e.objects); dupRoots += b - e.objects.length;
        }
        if (e.className === 'DValue' && isPointerArray(e.values)) {
            const b = e.values.length; e.values = dedupKeepFirst(e.values); dupChildPtrs += b - e.values.length;
        }
    }

    // FASE C — purge references to removed ids (single pass).
    if (removed.size > 0) {
        if (Array.isArray(s.values)) s.values = s.values.filter((id: string) => !removed.has(id));
        for (const k in idlookup) {
            const e = idlookup[k];
            if (!e || typeof e !== 'object') continue;
            if (Array.isArray(e.instances)) e.instances = e.instances.filter((id: string) => !removed.has(id));
            if (e.model && removed.has(e.model)) e.model = undefined;
            if (typeof e.father === 'string' && reparent.has(e.father)) e.father = reparent.get(e.father);
            if (Array.isArray(e.pointedBy)) {
                e.pointedBy = e.pointedBy.filter((p: any) => {
                    const src = p && typeof p.source === 'string' ? p.source : '';
                    const seg = src.split('.')[1]; // "idlookup.<id>.<field>"
                    return !removed.has(seg);
                });
            }
        }
    }

    if (dedupSlots || dupRoots || dupChildPtrs || reordered) {
        console.log(`[VersionFixer 2.226 -> 2.227] bonifica: ${dedupSlots} slot duplicati rimossi, `
            + `${mergedVals} value migrati (Format B), ${dupRoots} radici dedup, `
            + `${dupChildPtrs} pointer figli dedup, ${reordered} oggetti riordinati.`);
    }
    return s;
}

// ---------------------------------------------------------------------------
// FIXTURES
// ---------------------------------------------------------------------------

/** Metamodel: Person(name:EString, pets:Animal[containment], friends:Person[ref]). */
function meta(idlookup: AnyRec) {
    idlookup.C_Person = { id: 'C_Person', className: 'DClass', name: 'Person', features: ['A_name', 'R_pets', 'R_friends'] };
    idlookup.C_Animal = { id: 'C_Animal', className: 'DClass', name: 'Animal', features: ['A_aname'] };
    idlookup.A_name = { id: 'A_name', className: 'DAttribute', name: 'name', instances: [] };
    idlookup.R_pets = { id: 'R_pets', className: 'DReference', name: 'pets', instances: [] };
    idlookup.R_friends = { id: 'R_friends', className: 'DReference', name: 'friends', instances: [] };
    idlookup.A_aname = { id: 'A_aname', className: 'DAttribute', name: 'aname', instances: [] };
}

/** Clean object p1 (name='Bob'), one slot per feature, correct order. */
function cleanState(): DStateLike {
    const idlookup: AnyRec = {};
    meta(idlookup);
    idlookup.DM = { id: 'DM', className: 'DModel', name: 'M', objects: ['p1'] };
    idlookup.p1 = { id: 'p1', className: 'DObject', name: 'obj_p1', instanceof: 'C_Person', father: 'DM', features: ['v_name', 'v_pets', 'v_friends'] };
    idlookup.v_name = { id: 'v_name', className: 'DValue', instanceof: 'A_name', father: 'p1', isMirage: false, values: ['Bob'] };
    idlookup.v_pets = { id: 'v_pets', className: 'DValue', instanceof: 'R_pets', father: 'p1', isMirage: false, values: [] };
    idlookup.v_friends = { id: 'v_friends', className: 'DValue', instanceof: 'R_friends', father: 'p1', isMirage: false, values: [] };
    idlookup.A_name.instances = ['v_name'];
    idlookup.R_pets.instances = ['v_pets'];
    idlookup.R_friends.instances = ['v_friends'];
    return { idlookup, objects: ['p1'], values: ['v_name', 'v_pets', 'v_friends'], version: { n: 2.226 } };
}

/** Corrupted save reproducing all three signatures from the pre-fix XMI import. */
function corruptedState(): DStateLike {
    const idlookup: AnyRec = {};
    meta(idlookup);
    // Root duplication (Firma 3): p1 appears twice in DModel.objects.
    idlookup.DM = { id: 'DM', className: 'DModel', name: 'M', objects: ['p1', 'p1', 'p2'] };

    // p1: mirage 'name' (empty, first) + valued 'name' (Firma: mirage+import);
    //     valued 'name' id appears twice in features (Firma 1);
    //     'pets' containment slot with duplicated child pointers (Firma 2);
    //     'friends' Format B: mirage + TWO valued slots (one target each) -> merge.
    idlookup.p1 = {
        id: 'p1', className: 'DObject', name: 'obj_p1', instanceof: 'C_Person', father: 'DM',
        // order deliberately messy: mirages first, valued appended (in coda), name id twice
        features: ['v_name_mir', 'v_pets_mir', 'v_friends_mir', 'v_pets', 'v_name', 'v_name', 'v_friends_a', 'v_friends_b'],
    };
    idlookup.v_name_mir = { id: 'v_name_mir', className: 'DValue', instanceof: 'A_name', father: 'p1', isMirage: true, values: [], pointedBy: [{ source: 'idlookup.p1.features' }] };
    idlookup.v_name = { id: 'v_name', className: 'DValue', instanceof: 'A_name', father: 'p1', isMirage: false, values: ['Bob'] };
    idlookup.v_pets_mir = { id: 'v_pets_mir', className: 'DValue', instanceof: 'R_pets', father: 'p1', isMirage: true, values: [] };
    idlookup.v_pets = { id: 'v_pets', className: 'DValue', instanceof: 'R_pets', father: 'p1', isMirage: false, values: ['a1', 'a2', 'a1', 'a2'] };
    idlookup.v_friends_mir = { id: 'v_friends_mir', className: 'DValue', instanceof: 'R_friends', father: 'p1', isMirage: true, values: [] };
    idlookup.v_friends_a = { id: 'v_friends_a', className: 'DValue', instanceof: 'R_friends', father: 'p1', isMirage: false, values: ['p2'] };
    idlookup.v_friends_b = { id: 'v_friends_b', className: 'DValue', instanceof: 'R_friends', father: 'p1', isMirage: false, values: ['p3'] };

    idlookup.p2 = { id: 'p2', className: 'DObject', name: 'obj_p2', instanceof: 'C_Person', father: 'DM', features: [] };
    idlookup.p3 = { id: 'p3', className: 'DObject', name: 'obj_p3', instanceof: 'C_Person', father: 'DM', features: [] };
    idlookup.a1 = { id: 'a1', className: 'DObject', name: 'rex', instanceof: 'C_Animal', father: 'v_pets', features: [] };
    idlookup.a2 = { id: 'a2', className: 'DObject', name: 'fido', instanceof: 'C_Animal', father: 'v_pets', features: [] };

    // meta-feature.instances contain ALL DValue ids (mirages included).
    idlookup.A_name.instances = ['v_name_mir', 'v_name'];
    idlookup.R_pets.instances = ['v_pets_mir', 'v_pets'];
    idlookup.R_friends.instances = ['v_friends_mir', 'v_friends_a', 'v_friends_b'];

    return {
        idlookup,
        objects: ['p1', 'p2', 'p3', 'a1', 'a2'],
        values: ['v_name_mir', 'v_name', 'v_pets_mir', 'v_pets', 'v_friends_mir', 'v_friends_a', 'v_friends_b'],
        version: { n: 2.226 },
    };
}

const slotsOf = (s: DStateLike, oid: string, featureName: string): string[] =>
    (s.idlookup[oid].features as string[]).filter(f => {
        const dv = s.idlookup[f];
        const meta = dv && s.idlookup[dv.instanceof];
        return meta && meta.name === featureName;
    });

// ---------------------------------------------------------------------------
// TESTS
// ---------------------------------------------------------------------------

describe('VersionFixer 2.226 -> 2.227 — slot dedup + merge + roots', () => {
    it('collapses each (object, feature) to a single slot', () => {
        const s = migrate_2226_to_2227(corruptedState());
        expect(slotsOf(s, 'p1', 'name')).toHaveLength(1);
        expect(slotsOf(s, 'p1', 'pets')).toHaveLength(1);
        expect(slotsOf(s, 'p1', 'friends')).toHaveLength(1);
    });

    it('keeps the valued slot and drops the mirage (Opzione A)', () => {
        const s = migrate_2226_to_2227(corruptedState());
        const nameSlot = slotsOf(s, 'p1', 'name')[0];
        expect(nameSlot).toBe('v_name');
        expect(s.idlookup.v_name.values).toEqual(['Bob']);
        expect(s.idlookup.v_name_mir).toBeUndefined();
    });

    it('merges Format B multi-slot references (union of targets)', () => {
        const s = migrate_2226_to_2227(corruptedState());
        const friendsSlot = slotsOf(s, 'p1', 'friends')[0];
        expect(friendsSlot).toBe('v_friends_a');
        expect(s.idlookup.v_friends_a.values.sort()).toEqual(['p2', 'p3']);
        expect(s.idlookup.v_friends_b).toBeUndefined();
    });

    it('dedups duplicated containment child pointers (Firma 2)', () => {
        const s = migrate_2226_to_2227(corruptedState());
        expect(s.idlookup.v_pets.values).toEqual(['a1', 'a2']);
    });

    it('dedups duplicated roots in DModel.objects (Firma 3)', () => {
        const s = migrate_2226_to_2227(corruptedState());
        expect(s.idlookup.DM.objects).toEqual(['p1', 'p2']);
    });

    it('dedups the doubled valued-slot id in features (Firma 1)', () => {
        const s = migrate_2226_to_2227(corruptedState());
        const names = (s.idlookup.p1.features as string[]).filter(f => f === 'v_name');
        expect(names).toHaveLength(1);
    });

    it('reorders bonified features by metaclass order (name, pets, friends)', () => {
        const s = migrate_2226_to_2227(corruptedState());
        expect(s.idlookup.p1.features).toEqual(['v_name', 'v_pets', 'v_friends_a']);
    });
});

describe('VersionFixer 2.226 -> 2.227 — reference cleanup (FASE C)', () => {
    it('purges every removed id from instances, root values, pointedBy and re-parents', () => {
        const s = migrate_2226_to_2227(corruptedState());
        const removed = ['v_name_mir', 'v_pets_mir', 'v_friends_mir', 'v_friends_b'];
        // meta-feature.instances
        expect(s.idlookup.A_name.instances).toEqual(['v_name']);
        expect(s.idlookup.R_pets.instances).toEqual(['v_pets']);
        expect(s.idlookup.R_friends.instances).toEqual(['v_friends_a']);
        // root values array
        for (const id of removed) expect(s.values).not.toContain(id);
        // no dangling pointedBy referencing a removed id
        expect(s.idlookup.v_name.pointedBy ?? []).toEqual([]);
    });

    it('leaves NO removed id anywhere in the serialized state (infallible check)', () => {
        const before = corruptedState();
        const beforeKeys = new Set(Object.keys(before.idlookup));
        const s = migrate_2226_to_2227(corruptedState());
        const afterKeys = new Set(Object.keys(s.idlookup));
        const removed = [...beforeKeys].filter(k => !afterKeys.has(k));
        expect(removed.length).toBeGreaterThan(0);
        const json = JSON.stringify(s);
        for (const id of removed) expect(json.includes(`"${id}"`)).toBe(false);
    });
});

describe('VersionFixer 2.226 -> 2.227 — idempotency & no-op', () => {
    it('is idempotent (second run is a deep no-op)', () => {
        const once = migrate_2226_to_2227(corruptedState());
        const onceSnapshot = JSON.parse(JSON.stringify(once));
        const twice = migrate_2226_to_2227(once);
        expect(twice).toEqual(onceSnapshot);
    });

    it('is a strict no-op on a clean project', () => {
        const clean = cleanState();
        const snapshot = JSON.parse(JSON.stringify(clean));
        const out = migrate_2226_to_2227(clean);
        expect(out).toEqual(snapshot);
    });

    it('ignores slots with undefined instanceof (schema-less)', () => {
        const clean = cleanState();
        clean.idlookup.p1.features.push('v_orphan');
        clean.idlookup.v_orphan = { id: 'v_orphan', className: 'DValue', instanceof: undefined, father: 'p1', isMirage: false, values: ['x'] };
        const out = migrate_2226_to_2227(clean);
        expect(out.idlookup.v_orphan).toBeDefined();
        expect(out.idlookup.v_orphan.values).toEqual(['x']);
    });
});
