/**
 * The M2 classifier-kind producer (enum step B, S24, P-2026-09-27-1806): the register/revoke
 * diff of `reconcileClassifierKindProblems`, the body of its effect in `UniquenessProblemSync`.
 *
 * The barrel is mocked as in `UniquenessProblemSync.test.ts`: it is not importable under
 * vitest (monaco -> `window is not defined`), and this reconciler reads nothing from it at
 * runtime. The detector, the registry and the diff run for real, on a plain idlookup of the
 * shape the store holds.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../../joiner', () => ({
    DModel: { cname: 'DModel' },
    DObject: { cname: 'DObject' },
    DValue: { cname: 'DValue' },
    DPointerTargetable: { pendingCreation: {} as Record<string, any> },
    LPointerTargetable: { fromPointer: () => null },
}));
vi.mock('react-redux', () => ({ useSelector: () => '' }));

type Any = any;

function lookup(): Record<string, Any> {
    return {
        Pointer_mm: { className: 'DModel', isMetamodel: true, name: 'MM' },
        Pointer_pkg: { className: 'DPackage', name: 'p', father: 'Pointer_mm' },
        Pointer_person: { className: 'DClass', name: 'Person', father: 'Pointer_pkg', extends: [] },
        Pointer_other: { className: 'DClass', name: 'Other', father: 'Pointer_pkg', extends: [] },
        Pointer_enum: { className: 'DEnumerator', name: 'Color', father: 'Pointer_pkg', extends: ['Pointer_person'] },
        Pointer_s1: { className: 'DReference', name: 'badRef', father: 'Pointer_person', type: 'Pointer_enum' },
        Pointer_gone: { className: 'DReference', name: 'goneRef', father: 'Pointer_other', type: 'Pointer_nothing' },
        Pointer_m1: { className: 'DModel', isMetamodel: false, name: 'M1' },
    };
}

let SUT: typeof import('../UniquenessProblemSync');
let REG: typeof import('../registry');

beforeEach(async () => {
    // Fresh registry per test: its Map is module-level state (P11).
    vi.resetModules();
    REG = await import('../registry');
    SUT = await import('../UniquenessProblemSync');
    vi.useFakeTimers();
});
afterEach(() => { vi.useRealTimers(); });

const kindEntries = (nodeId: string) => REG.getNodeProblemsSnapshot(nodeId).filter((p) => p.kind === 'classifier-kind');
const activeIds = (nodeId: string) => kindEntries(nodeId).filter((p) => p.resolvedAt === undefined).map((p) => p.id).sort();
const resolvedIds = (nodeId: string) => kindEntries(nodeId).filter((p) => p.resolvedAt !== undefined).map((p) => p.id).sort();

describe('reconcileClassifierKindProblems: registers the saved shapes of a metamodel', () => {
    it('writes S1 and S5b under the element and under the class row that carries it', () => {
        SUT.reconcileClassifierKindProblems('Pointer_mm', lookup());
        expect(activeIds('Pointer_s1')).toEqual(['classifier-kind:Pointer_s1@Pointer_s1']);
        expect(activeIds('Pointer_enum')).toEqual(['classifier-kind:Pointer_enum@Pointer_enum']);
        expect(activeIds('Pointer_person')).toEqual([
            'classifier-kind:Pointer_enum@Pointer_person',
            'classifier-kind:Pointer_s1@Pointer_person',
        ]);
        const p = kindEntries('Pointer_s1')[0];
        expect(p.ownerModelId).toBe('Pointer_mm');
        expect(p.severity).toBe('error');
        expect(p.relatedNodeIds).toEqual(['Pointer_enum']);
        expect(p.description).toContain('Reference "Person.badRef" is typed by the enumeration "Color"');
    });
    it('does not publish a missing type (its own verdict, report decision 6)', () => {
        SUT.reconcileClassifierKindProblems('Pointer_mm', lookup());
        expect(kindEntries('Pointer_gone')).toEqual([]);
        expect(kindEntries('Pointer_other')).toEqual([]);
    });
    it('writes nothing for a model that is not a metamodel', () => {
        const L = lookup();
        L.Pointer_pkg.father = 'Pointer_m1';
        SUT.reconcileClassifierKindProblems('Pointer_m1', L);
        expect(kindEntries('Pointer_s1')).toEqual([]);
        expect(kindEntries('Pointer_person')).toEqual([]);
    });
});

describe('reconcileClassifierKindProblems: revokes what the next scan no longer finds', () => {
    it('marks S1 resolved after a retype and keeps S5b', () => {
        const L = lookup();
        SUT.reconcileClassifierKindProblems('Pointer_mm', L);
        L.Pointer_s1.type = 'Pointer_other';
        SUT.reconcileClassifierKindProblems('Pointer_mm', L);
        expect(resolvedIds('Pointer_s1')).toEqual(['classifier-kind:Pointer_s1@Pointer_s1']);
        expect(activeIds('Pointer_person')).toEqual(['classifier-kind:Pointer_enum@Pointer_person']);
        expect(resolvedIds('Pointer_person')).toEqual(['classifier-kind:Pointer_s1@Pointer_person']);
    });
    it('leaves the duplicate-name entries of the same model and the entries of another model alone', () => {
        REG.registerProblem({
            id: 'duplicate-name:Pointer_person', nodeId: 'Pointer_person', kind: 'duplicate-name', severity: 'warning',
            title: 'Duplicate name', description: '', relatedNodeIds: [], ownerModelId: 'Pointer_mm', createdAt: 0,
        });
        REG.registerProblem({
            id: 'classifier-kind:Pointer_x@Pointer_person', nodeId: 'Pointer_person', kind: 'classifier-kind', severity: 'error',
            title: 't', description: '', relatedNodeIds: [], ownerModelId: 'Pointer_other_mm', createdAt: 0,
        });
        const L = lookup();
        L.Pointer_s1.type = 'Pointer_other';
        L.Pointer_enum.extends = [];
        SUT.reconcileClassifierKindProblems('Pointer_mm', L);
        const all = REG.getNodeProblemsSnapshot('Pointer_person');
        expect(all.find((p) => p.kind === 'duplicate-name')?.resolvedAt).toBeUndefined();
        expect(all.find((p) => p.id === 'classifier-kind:Pointer_x@Pointer_person')?.resolvedAt).toBeUndefined();
    });
});
