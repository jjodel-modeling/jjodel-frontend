/**
 * The revoke pass of the duplicate-name producer — whose entries it may mark resolved
 * (UNQ1 C5, discovery_2026-09-01_unq1_duplicate_name.md §A.4; UNQ1 C6 moved the ownership
 * it keys on from a module-level Map onto `NodeProblem.ownerModelId`, and the second
 * describe below is about the field).
 *
 * Why the barrel is mocked and nothing else is: what `UniquenessProblemSync` and
 * `nameUniqueness` take from `joiner` at RUNTIME is three `cname` strings, the pending
 * dictionary and `LPointerTargetable.fromPointer` — every other import in those files is
 * a type, and erased. The real barrel is not importable under vitest anyway (monaco ->
 * `window is not defined`), and the environment is `node`. So the dependency is the fake
 * one: the two scans, the registry and the register/revoke diff all run for real, on
 * duck-typed L proxies of exactly the shape they read on the field.
 *
 * The subject is `reconcileDuplicateProblems`, the body of the effect: React is not what
 * is being measured here, and one call of it is one run of the producer on one model —
 * which is precisely how the defect was staged (open M1, then open M2, then come back).
 *
 * The collisions are by EXPLICIT name — two elements named the same on purpose — so the
 * fixture owes nothing to the default-name path.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const H = vi.hoisted(() => ({ proxies: {} as Record<string, any> }));

vi.mock('../../../../joiner', () => ({
    DModel: { cname: 'DModel' },
    DObject: { cname: 'DObject' },
    DValue: { cname: 'DValue' },
    DPointerTargetable: { pendingCreation: {} as Record<string, any> },
    LPointerTargetable: { fromPointer: (id: string) => H.proxies[id] ?? null },
}));

// The subject imports `useSelector` at module scope. The effect body is what is called
// here, never the hook, so the stub keeps the node env free of a store.
vi.mock('react-redux', () => ({ useSelector: () => '' }));

type Any = any;

// ── the fixture: the two collisions of §A.4, one per level ───────────────────
//
// M1  Book_0 with two nested children both named `Edition_0` (the containment slot is
//     an LValue, which is the father `getNamespaceOf` resolves the siblings from).
// M2  one package with two classifiers both named `Book`.
let m1: Any, book: Any, slot: Any, ed0: Any, ed1: Any;
let mm: Any, pkg: Any, b1: Any, b2: Any;

function klass(id: string, name: string, father: Any): Any {
    const c: Any = {
        className: 'DClass', id, name, father,
        ownAttributes: [], ownReferences: [], ownOperations: [],
        allAttributes: [], allReferences: [], allOperations: [],
    };
    father.classes.push(c);
    return c;
}

function buildFixture(): void {
    m1 = { className: 'DModel', id: 'm1', name: 'M1', isMetamodel: false, allSubObjects: [] };
    book = { className: 'DObject', id: 'book', name: 'Book_0', father: m1 };
    slot = { className: 'DValue', id: 'slot', father: book, values: [] };
    ed0 = { className: 'DObject', id: 'ed0', name: 'Edition_0', father: slot };
    ed1 = { className: 'DObject', id: 'ed1', name: 'Edition_0', father: slot };
    slot.values.push(ed0, ed1);
    m1.allSubObjects.push(book, ed0, ed1);

    mm = { className: 'DModel', id: 'mm', name: 'MM', isMetamodel: true, allSubPackages: [] };
    pkg = {
        className: 'DPackage', id: 'pkg', name: 'P', father: mm,
        classes: [], enumerators: [], datatypes: [], subpackages: [], children: [],
    };
    mm.allSubPackages.push(pkg);
    b1 = klass('b1', 'Book', pkg);
    b2 = klass('b2', 'Book', pkg);
    pkg.children = [...pkg.classes];

    H.proxies = { m1, book, ed0, ed1, mm, pkg, b1, b2 };
}

let SUT: typeof import('../UniquenessProblemSync');
let REG: typeof import('../registry');

beforeEach(async () => {
    // A fresh module graph per test: both the registry Map and the producer's
    // ownership bookkeeping are module-level, and a test that inherited either from
    // the previous one would be measuring the order of the file.
    vi.resetModules();
    REG = await import('../registry');
    SUT = await import('../UniquenessProblemSync');
    // markResolved schedules the 5s removal of the entry; fake timers keep the
    // resolved entry readable instead of racing its TTL.
    vi.useFakeTimers();
    buildFixture();
});

afterEach(() => { vi.useRealTimers(); });

function dup(nodeId: string): Any {
    return REG.getNodeProblemsSnapshot(nodeId).find(p => p.kind === 'duplicate-name');
}
/** Registered and not revoked. */
function active(nodeId: string): boolean {
    const p = dup(nodeId);
    return !!p && p.resolvedAt === undefined;
}
/** Registered and revoked by a producer (the green transient, then the TTL). */
function revoked(nodeId: string): boolean {
    const p = dup(nodeId);
    return !!p && p.resolvedAt !== undefined;
}

describe('UNQ1 C5 — the revoke pass is scoped to the model that was scanned', () => {
    it('registers one entry per colliding element, and none on what does not collide', () => {
        SUT.reconcileDuplicateProblems('m1');
        expect([active('ed0'), active('ed1')]).toEqual([true, true]);
        expect(dup('book')).toBeUndefined();
        expect(dup('ed0').description).toBe('Name "Edition_0" is also used by another element in this scope.');
    });

    it('opening the metamodel leaves the entries of the model next door alone', () => {
        SUT.reconcileDuplicateProblems('m1');
        expect([active('ed0'), active('ed1')]).toEqual([true, true]);

        // The defect of §A.4: this call used to walk the whole registry and revoke
        // every duplicate-name entry its own scan did not want — the two M1 ones
        // included, for the rest of the session.
        SUT.reconcileDuplicateProblems('mm');

        expect([active('ed0'), active('ed1')]).toEqual([true, true]);
        expect([active('b1'), active('b2')]).toEqual([true, true]);
    });

    it('coming back to the model leaves the metamodel entries alone (the mirror case)', () => {
        SUT.reconcileDuplicateProblems('m1');
        SUT.reconcileDuplicateProblems('mm');
        SUT.reconcileDuplicateProblems('m1');
        expect([active('ed0'), active('ed1'), active('b1'), active('b2')]).toEqual([true, true, true, true]);
    });

    it('still revokes its OWN entries when the collision is resolved, and only those', () => {
        SUT.reconcileDuplicateProblems('m1');
        SUT.reconcileDuplicateProblems('mm');

        // The rename the user performs: both sides of a PAIR stop colliding at once,
        // so the model goes from two entries to zero — not to one.
        ed1.name = 'seconda edizione';
        SUT.reconcileDuplicateProblems('m1');

        expect([revoked('ed0'), revoked('ed1')]).toEqual([true, true]);
        expect([active('b1'), active('b2')]).toEqual([true, true]);
    });

    it('with three homonyms, renaming one leaves the other two standing', () => {
        const ed2: Any = { className: 'DObject', id: 'ed2', name: 'Edition_0', father: slot };
        slot.values.push(ed2);
        m1.allSubObjects.push(ed2);
        H.proxies.ed2 = ed2;

        SUT.reconcileDuplicateProblems('m1');
        expect([active('ed0'), active('ed1'), active('ed2')]).toEqual([true, true, true]);

        ed2.name = 'terza edizione';
        SUT.reconcileDuplicateProblems('m1');
        expect([active('ed0'), active('ed1'), revoked('ed2')]).toEqual([true, true, true]);
    });

    it('never touches another producer\'s kind on the same node', () => {
        REG.registerProblem({
            id: 'conformance:ed0', nodeId: 'ed0', kind: 'conformance', severity: 'error',
            title: 'Conformance', description: 'kind is required', relatedNodeIds: [], createdAt: 1,
        });
        SUT.reconcileDuplicateProblems('m1');
        ed1.name = 'seconda edizione';
        SUT.reconcileDuplicateProblems('m1');

        const conf = REG.getNodeProblemsSnapshot('ed0').find(p => p.kind === 'conformance');
        expect(conf?.resolvedAt).toBeUndefined();
        expect(revoked('ed0')).toBe(true);
    });

    it('revokes its own entry even when the element it named is gone', () => {
        SUT.reconcileDuplicateProblems('m1');

        // The deletion a father-walk would lose and a field WRITTEN AT REGISTRATION keeps:
        // the proxy no longer resolves, so the entry cannot be traced back to any model —
        // but it still names `m1` as its owner, because that was written when it was
        // registered. This is the case that decided UNQ1 C6 point 4.
        slot.values = [ed0];
        m1.allSubObjects = [book, ed0];
        delete H.proxies.ed1;
        SUT.reconcileDuplicateProblems('m1');

        expect([revoked('ed0'), revoked('ed1')]).toEqual([true, true]);
    });
});

describe('UNQ1 C6 — the owner is a field on the entry, not bookkeeping in the module', () => {
    it('stamps ownerModelId on every entry it registers, at M1 and at M2', () => {
        SUT.reconcileDuplicateProblems('m1');
        SUT.reconcileDuplicateProblems('mm');

        expect([dup('ed0').ownerModelId, dup('ed1').ownerModelId]).toEqual(['m1', 'm1']);
        // A metamodel is a DModel too: the field holds `mm`, not a metamodel-shaped name.
        expect([dup('b1').ownerModelId, dup('b2').ownerModelId]).toEqual(['mm', 'mm']);
    });

    it('leaves a duplicate-name entry owned by another model alone, on a node it does not want', () => {
        // The direct test of the field, which the fixture's two disjoint models only test
        // indirectly: an entry of THIS producer's own kind, sitting on a node this scan
        // does not desire, owned by somebody else. The old bookkeeping could not tell the
        // difference — the id was simply not in its set, which is the same silence as an
        // entry it had never registered.
        REG.registerProblem({
            id: 'duplicate-name:foreign', nodeId: 'foreign', kind: 'duplicate-name',
            severity: 'warning', title: 'Duplicate name', description: 'elsewhere',
            relatedNodeIds: [], ownerModelId: 'someOtherModel', createdAt: 1,
        });

        SUT.reconcileDuplicateProblems('m1');
        ed1.name = 'seconda edizione';
        SUT.reconcileDuplicateProblems('m1');

        expect(revoked('ed0')).toBe(true);
        expect(dup('foreign').resolvedAt).toBeUndefined();
    });

    it('does not revoke an entry of its own model whose owner was never written', () => {
        // An entry with no owner belongs to nobody: `getProblemIdsOwnedBy` never returns
        // it. No producer writes one — the assertion pins that the filter is on the field
        // and not on the kind alone, which is exactly the mutation "revoke ignores the
        // field and goes global again".
        REG.registerProblem({
            id: 'duplicate-name:ownerless', nodeId: 'ownerless', kind: 'duplicate-name',
            severity: 'warning', title: 'Duplicate name', description: 'no owner',
            relatedNodeIds: [], createdAt: 1,
        });

        SUT.reconcileDuplicateProblems('m1');

        expect(dup('ownerless').resolvedAt).toBeUndefined();
    });

    it('does not claim a conformance entry of its own model', () => {
        // Same owner, different kind: the neighbour of §C5.3, now that owner alone would
        // match. `getProblemIdsOwnedBy` filters on both.
        REG.registerProblem({
            id: 'conformance:ed0', nodeId: 'ed0', kind: 'conformance', severity: 'error',
            title: 'Conformance', description: 'kind is required', relatedNodeIds: [],
            ownerModelId: 'm1', createdAt: 1,
        });
        SUT.reconcileDuplicateProblems('m1');
        ed1.name = 'seconda edizione';
        SUT.reconcileDuplicateProblems('m1');

        const conf = REG.getNodeProblemsSnapshot('ed0').find(p => p.kind === 'conformance');
        expect(conf?.resolvedAt).toBeUndefined();
        expect(revoked('ed0')).toBe(true);
    });

    it('hands an entry over when another model re-registers it, instead of revoking it', () => {
        // What the module-level bookkeeping got wrong and the field does not: the id stayed
        // in m1's owned set forever, so m1's next scan revoked an entry mm had just claimed.
        SUT.reconcileDuplicateProblems('m1');
        expect(dup('ed0').ownerModelId).toBe('m1');

        REG.registerProblem({
            ...dup('ed0'), ownerModelId: 'mm',
        });

        // ed0 stops colliding as far as m1 is concerned: its scan no longer desires the id.
        ed1.name = 'seconda edizione';
        SUT.reconcileDuplicateProblems('m1');

        expect(dup('ed0').resolvedAt).toBeUndefined();
        expect(revoked('ed1')).toBe(true);
    });
});
