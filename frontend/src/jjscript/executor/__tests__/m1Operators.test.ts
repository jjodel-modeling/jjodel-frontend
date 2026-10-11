/**
 * #175 — `+=`, `-=`, `remove … from`, the link type check and the free M1 rename
 * (`docs/discovery/discovery_2026-10-07_175_jjscript_m1_operators.md`).
 *
 * The handlers run for real on an in-memory model, as in `m1Containment.test.ts`; the joiner is
 * reduced to what they touch, and every write is recorded: `SetFieldAction.new` (the by-value
 * removal and the re-father of `removeLinked`) and the `values` setter of a slot (the proxy write a
 * link goes through). The commands are parsed by the real parser, so the AST the handlers read is
 * the one Run hands them. What the store does with a write is not simulated: the browser probe
 * `_tmp_175_measure.ts` measures the slots after the commit.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
    store: new Map<string, any>(),
    actions: [] as Array<{ id: string; field: string; value: any; op: any }>,
    writes: [] as Array<{ slot: string; values: string[] }>,
    project: null as any,
}));

vi.mock('../../../joiner', () => {
    class DModel {}
    class DValue {}
    return {
        LPointerTargetable: { fromPointer: (id: string) => h.store.get(id) },
        DObject: { new: () => null },
        DModel,
        DValue,
        SetFieldAction: { new: (id: string, field: string, value: any, op: any) => { h.actions.push({ id, field, value, op }); } },
        TRANSACTION: (_: string, fn: () => void) => fn(),
        LModel: class {},
        LProject: class {},
        LClass: class {},
    };
});

vi.mock('../utils', () => ({
    getProject: () => h.project,
    getTargetMetamodel: () => null,
}));

vi.mock('../resolvers', () => ({
    resolveElementInMetamodel: () => null,
    resolveElement: () => null,
}));

vi.mock('../../../model/logicWrapper/nameUniqueness', () => ({
    checkM2NameUniqueness: () => ({ ok: true }),
    m2KindOf: () => 'class',
}));

vi.mock('../../../redux/action/action', () => ({ COMMIT: () => undefined }));

import { parse } from '../../parser/parser';
import { executeSetInstance, executeRemoveInstance } from '../commands/instance';
import { executeRemove } from '../commands/remove';
import { executeRename } from '../commands/rename';
import { clearHandles } from '../handleRegistry';

// ── The metamodel ────────────────────────────────────────────────────────────────────────────────

function cls(name: string, supers: any[] = []): any {
    const c: any = {
        id: `c_${name}`, name, abstract: false, isSingleton: false, references: [] as any[], attributes: [] as any[], supers,
        get allReferences() { return [...c.references, ...c.supers.flatMap((s: any) => s.allReferences)]; },
        get allAttributes() { return [...c.attributes, ...c.supers.flatMap((s: any) => s.allAttributes)]; },
        isExtending(t: any): boolean { return !!t && (t.id === c.id || c.supers.some((s: any) => s.isExtending(t))); },
    };
    return c;
}
const Scenario = cls('Scenario');
const Phase = cls('Phase');
const Step = cls('Step', [Phase]);
const Learner = cls('Learner');
const lead = { name: 'lead', containment: false, type: Phase, upperBound: -1 };
const coach = { name: 'coach', containment: false, type: Learner, upperBound: 1 };
const pathway = { name: 'pathway', containment: true, type: Phase, upperBound: -1 };
const trio = { name: 'trio', containment: false, type: Phase, upperBound: 3 };
Scenario.references.push(lead, coach, pathway, trio);
Scenario.attributes.push({ name: 'title' });
const metamodel = { id: 'mm1', name: 'ScenarioMM', classes: [Scenario, Phase, Step, Learner] };

/** A committed instance: metaclass in the store, its father, and its slots with their reference. */
function inst(id: string, name: string, metaclass: any, father = 'm1', slots: Record<string, string[]> = {}): any {
    const o: any = { id, name, className: 'DObject', instanceof: metaclass, __raw: { id, instanceof: metaclass?.id, father }, subObjects: [] };
    for (const [ref, values] of Object.entries(slots)) {
        const meta = metaclass.allReferences.find((r: any) => r.name === ref);
        const slotId = `${id}_${ref}`;
        const slot: any = { id: slotId, instanceof: meta, __raw: { values: [...values] } };
        Object.defineProperty(slot, 'values', { set(v: string[]) { h.writes.push({ slot: slotId, values: [...v] }); } });
        o['$' + ref] = slot;
        h.store.set(slotId, slot);
    }
    if (metaclass === Scenario) o.$title = { id: `${id}_title`, value: undefined };
    h.store.set(id, o);
    return o;
}

let model: any;
function setModel(objects: any[]) {
    model = { id: 'm1', name: 'M1', isMetamodel: false, objects, __raw: { objects: objects.map((o) => o.id) } };
    h.project = { id: 'p', models: [model], metamodels: [metamodel] };
}

const context: any = { projectId: 'p', modelId: 'm1', targetMetamodelId: 'mm1', level: 'M1', history: [], variables: new Map() };
const argsOf = (line: string): any => {
    const r = parse(line);
    if (!r.success) throw new Error(`parse failed: ${line}: ${r.errors?.[0]?.message}`);
    return r.ast!.args;
};
const set = (line: string) => executeSetInstance(argsOf(line), context, h.project);
const codeOf = (r: any) => r.errors?.[0]?.code;
/** The ids taken out of a slot by value. */
const removedFrom = (slot: string) => h.actions.filter((a) => a.id === slot && a.field === 'values' && a.op === '-=').map((a) => a.value);
const nothingWritten = () => { expect(h.actions).toEqual([]); expect(h.writes).toEqual([]); };

beforeEach(() => {
    h.store.clear();
    h.actions = [];
    h.writes = [];
    clearHandles();
    setModel([
        inst('s0', 'Scenario_0', Scenario, 'm1', { lead: [], coach: [], pathway: [], trio: [] }),
        inst('p1', 'p1', Phase),
        inst('p2', 'p2', Phase),
        inst('st1', 's1', Step),
        inst('ant', 'Antonio', Learner),
        inst('ann', 'Anna', Learner),
    ]);
});

// ── -= and remove ─────────────────────────────────────────────────────────────────────────────

describe('`-=` takes the target out by value (#175 point 1)', () => {
    it('removes p1 from a multi-valued slot and says so (dies on the old append: «Linked», a write of [p1, p1])', async () => {
        h.store.get('s0_lead').__raw.values = ['p1', 'p2'];
        const r = await set('set Scenario_0.lead -= p1');
        expect(r.success).toBe(true);
        expect(r.message).toBe('Removed p1 from Scenario_0.lead');
        expect(removedFrom('s0_lead')).toEqual(['p1']);
        expect(h.writes).toEqual([]);
    });

    it('a target the slot does not hold: NOT_LINKED, nothing written (dies if absence is not checked)', async () => {
        h.store.get('s0_lead').__raw.values = ['p2'];
        const r = await set('set Scenario_0.lead -= p1');
        expect(codeOf(r)).toBe('NOT_LINKED');
        nothingWritten();
    });

    it('a root-born child taken out of a containment goes back to the model (dies without the re-father)', async () => {
        h.store.get('s0_pathway').__raw.values = ['p2'];
        h.store.get('p2').__raw.father = 's0_pathway';
        const r = await set('set Scenario_0.pathway -= p2');
        expect(r.success).toBe(true);
        expect(removedFrom('s0_pathway')).toEqual(['p2']);
        expect(h.actions).toContainEqual({ id: 'p2', field: 'father', value: 'm1', op: undefined });
    });

    it('a child born in the slot (not among the roots): WOULD_ORPHAN, nothing written (dies if the roots are not read)', async () => {
        const born = inst('pIn', 'pIn', Phase, 's0_pathway');
        h.store.get('s0_pathway').__raw.values = ['pIn'];
        h.store.get('s0').subObjects = [born];
        const r = await set('set Scenario_0.pathway -= pIn');
        expect(codeOf(r)).toBe('WOULD_ORPHAN');
        expect(r.errors![0].suggestion).toBe('To take it away, delete it: delete instance pIn');
        nothingWritten();
    });

    it('a plain reference never orphans: a child born elsewhere is only unlinked', async () => {
        const born = inst('pIn', 'pIn', Phase, 's0_pathway');
        h.store.get('s0').subObjects = [born];
        h.store.get('s0_lead').__raw.values = ['pIn'];
        const r = await set('set Scenario_0.lead -= pIn');
        expect(r.success).toBe(true);
        expect(removedFrom('s0_lead')).toEqual(['pIn']);
        expect(h.actions.some((a) => a.field === 'father')).toBe(false);
    });

    it('takes out an element of the wrong type, which is how such a slot is repaired (dies if `-=` is type-checked)', async () => {
        h.store.get('s0_lead').__raw.values = ['ant'];
        const r = await set('set Scenario_0.lead -= Antonio');
        expect(r.success).toBe(true);
        expect(removedFrom('s0_lead')).toEqual(['ant']);
    });

    it('`-= null` names nothing: TYPE_MISMATCH, the slot is not emptied (dies if it falls into the unlink)', async () => {
        h.store.get('s0_lead').__raw.values = ['p1'];
        const r = await set('set Scenario_0.lead -= null');
        expect(codeOf(r)).toBe('TYPE_MISMATCH');
        nothingWritten();
    });
});

describe('`remove <instance> from <Owner>.<reference>` at M1 (#175 point 1)', () => {
    it('is the `-=` of the same slot (dies on the M2 route: ELEMENT_NOT_FOUND)', async () => {
        h.store.get('s0_lead').__raw.values = ['p1', 'p2'];
        const r = await executeRemove(argsOf('remove p2 from Scenario_0.lead'), context);
        expect(r.success).toBe(true);
        expect(r.command).toBe('remove');
        expect(r.message).toBe('Removed p2 from Scenario_0.lead');
        expect(removedFrom('s0_lead')).toEqual(['p2']);
    });

    it('without the reference: REFERENCE_REQUIRED, nothing written', async () => {
        h.store.get('s0_lead').__raw.values = ['p1'];
        const r = await executeRemoveInstance(argsOf('remove p1 from Scenario_0'), context, h.project);
        expect(codeOf(r)).toBe('REFERENCE_REQUIRED');
        nothingWritten();
    });

    it('a target the slot does not hold: NOT_LINKED under the command `remove`', async () => {
        const r = await executeRemove(argsOf('remove p1 from Scenario_0.lead'), context);
        expect(r.command).toBe('remove');
        expect(codeOf(r)).toBe('NOT_LINKED');
    });
});

// ── += ────────────────────────────────────────────────────────────────────────────────────────

describe('`+=` adds while the slot has room (#175 point 1)', () => {
    it('appends on a multi-valued slot', async () => {
        h.store.get('s0_lead').__raw.values = ['p1'];
        const r = await set('set Scenario_0.lead += p2');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 's0_lead', values: ['p1', 'p2'] }]);
    });

    it('sets an empty single-valued slot', async () => {
        const r = await set('set Scenario_0.coach += Antonio');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 's0_coach', values: ['ant'] }]);
    });

    it('a single-valued slot holding another: MULTIPLICITY_EXCEEDED with the `=` hint, nothing written (dies on the old replace)', async () => {
        h.store.get('s0_coach').__raw.values = ['ann'];
        const r = await set('set Scenario_0.coach += Antonio');
        expect(codeOf(r)).toBe('MULTIPLICITY_EXCEEDED');
        expect(r.errors![0].suggestion).toBe('To replace it: set Scenario_0.coach = Antonio');
        nothingWritten();
    });

    it('a single-valued slot already holding the target: success, nothing written, no undo entry', async () => {
        h.store.get('s0_coach').__raw.values = ['ant'];
        const r = await set('set Scenario_0.coach += Antonio');
        expect(r.success).toBe(true);
        expect(r.undoable).toBe(false);
        nothingWritten();
    });

    it('a bounded multi-valued slot at its bound: MULTIPLICITY_EXCEEDED (dies if only single-valued slots are bounded)', async () => {
        h.store.get('s0_trio').__raw.values = ['p1', 'p2', 'st1'];
        const r = await set('set Scenario_0.trio += p1');
        expect(codeOf(r)).toBe('MULTIPLICITY_EXCEEDED');
        expect(r.message).toBe("'Scenario_0.trio' is full (at most 3)");
        nothingWritten();
    });

    it('`=` on a multi-valued slot still appends, unchanged (dies if `=` takes the `+=` route)', async () => {
        h.store.get('s0_trio').__raw.values = ['p1', 'p2', 'st1'];
        const r = await set('set Scenario_0.trio = p1');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 's0_trio', values: ['p1', 'p2', 'st1', 'p1'] }]);
    });
});

// ── The link type check ──────────────────────────────────────────────────────────────────────

describe('a link writes only the reference type or a subclass (#175 point 2)', () => {
    it('a Learner into a Phase containment: TYPE_MISMATCH, nothing written', async () => {
        const r = await set('set Scenario_0.pathway = Antonio');
        expect(codeOf(r)).toBe('TYPE_MISMATCH');
        expect(r.message).toBe("'Antonio' is a Learner: Scenario.pathway holds Phase and its subclasses");
        nothingWritten();
    });

    it('a Learner into a Phase plain reference: TYPE_MISMATCH (dies if only containments are checked)', async () => {
        const r = await set('set Scenario_0.lead = Antonio');
        expect(codeOf(r)).toBe('TYPE_MISMATCH');
        nothingWritten();
    });

    it('`+=` is checked too', async () => {
        const r = await set('set Scenario_0.lead += Antonio');
        expect(codeOf(r)).toBe('TYPE_MISMATCH');
        nothingWritten();
    });

    it('a subclass conforms (Step extends Phase)', async () => {
        const r = await set('set Scenario_0.lead = s1');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 's0_lead', values: ['st1'] }]);
    });

    it('a target whose class is not in the store: NO_METACLASS, nothing written (dies if a missing class passes the check)', async () => {
        const fresh = inst('pf', 'pFresh', Phase);
        fresh.instanceof = undefined;
        model.objects.push(fresh);
        model.__raw.objects.push('pf');
        const r = await set('set Scenario_0.lead = pFresh');
        expect(codeOf(r)).toBe('NO_METACLASS');
        nothingWritten();
    });
});

// ── Attributes ───────────────────────────────────────────────────────────────────────────────

describe('`+=` and `-=` on an attribute (#175 point 1)', () => {
    it('are refused: OPERATOR_NOT_SUPPORTED (dies on the old write of the bare value)', async () => {
        for (const line of ['set Scenario_0.title += "x"', 'set Scenario_0.title -= "x"']) {
            const r = await set(line);
            expect(codeOf(r)).toBe('OPERATOR_NOT_SUPPORTED');
        }
        expect(h.store.get('s0').$title.value).toBeUndefined();
    });
});

// ── Rename at M1 ─────────────────────────────────────────────────────────────────────────────

describe('rename at M1 takes the name `create` takes (#175 point 3)', () => {
    it('a quoted name with a space renames (dies if the M2 identifier check runs at M1)', async () => {
        const r = await executeRename(argsOf('rename p1 to "Fase uno"'), context);
        expect(r.success).toBe(true);
        expect(h.actions).toContainEqual({ id: h.store.get('p1'), field: 'name', value: 'Fase uno', op: undefined });
    });

    it('an empty name: INVALID_NAME, nothing written', async () => {
        const r = await executeRename(argsOf('rename p1 to ""'), context);
        expect(codeOf(r)).toBe('INVALID_NAME');
        expect(h.actions).toEqual([]);
    });

    it('at M2 the identifier check still refuses a name with a space', async () => {
        const r = await executeRename(argsOf('rename Foo to "Fase uno"'), { ...context, level: 'M2' });
        expect(codeOf(r)).toBe('INVALID_NAME');
    });
});
