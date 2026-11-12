/**
 * #213 — `set <Instance>.<reference> = <Model>::<instance>` links across M1 models
 * (`docs/discovery/discovery_2026-11-12_213_m1_cross_model_links.md`).
 *
 * The handlers run for real on in-memory models, as in `m1Operators.test.ts`; the joiner is
 * reduced to what they touch, and every write is recorded: `SetFieldAction.new` (the by-value
 * removal of `-=`/`remove … from`) and the `values` setter of a slot (the proxy write a link
 * goes through). The commands are parsed by the REAL parser, so the AST the handlers read is
 * the one Run hands them. The fixture is extended with three other M1 models — `Other`,
 * `Second` and one named `My Model` — and one metaclass from a DIFFERENT metamodel whose
 * superclass chain reaches the declared ref type (the issue's actual scenario).
 *
 * Mutation bench (recorded in the commit message): the tests die when (a) the qualified path
 * consults the handle registry (the registry-leak guard and its control), (b) the first-`::`
 * split becomes a last-`::` or an every-`::` split (the `x::y` address), (c) model selection
 * takes the first case-insensitive match over an exact hit (the `other`/`Other` pair, pinned
 * here and in the pure bench), (d) a bare-name cross-model fallback is introduced (the
 * bare-`p` refusal with no write).
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
import { executeSetInstance } from '../commands/instance';
import { executeRemove } from '../commands/remove';
import { clearHandles, registerHandle } from '../handleRegistry';

// ── The metamodels ───────────────────────────────────────────────────────────────────────────────

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
Scenario.references.push(lead, coach);
const metamodel = { id: 'mm1', name: 'ScenarioMM', classes: [Scenario, Phase, Step, Learner] };

// A metaclass of a DIFFERENT metamodel whose superclass chain reaches the declared ref type —
// the conformance `linkTypeMismatch` tests by pointer, the issue's actual cross-metamodel case.
const otherMetamodel = { id: 'mm2', name: 'OtherMM', classes: [] as any[] };
const PhaseExt: any = cls('PhaseExt');
PhaseExt.supers.push(Phase);
otherMetamodel.classes.push(PhaseExt);

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
    h.store.set(id, o);
    return o;
}

function mkModel(id: string, name: string, objects: any[]): any {
    return { id, name, isMetamodel: false, objects, __raw: { objects: objects.map((o) => o.id) } };
}

let active: any;
let otherModel: any;

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

    const s0 = inst('s0', 'Scenario_0', Scenario, 'm1', { lead: [], coach: [] });
    const p1 = inst('p1', 'p1', Phase);
    const p2 = inst('p2', 'p2', Phase);
    const st1 = inst('st1', 's1', Step);
    const ant = inst('ant', 'Antonio', Learner);
    const ann = inst('ann', 'Anna', Learner);

    const op = inst('op', 'p', Phase, 'm2');
    const q = inst('q', 'q', Learner, 'm2');
    const sp = inst('sp', 'p', Phase, 'm3');
    const mpm = inst('mpm', 'pm', Phase, 'm4');

    active = mkModel('m1', 'M1', [s0, p1, p2, st1, ant, ann]);
    otherModel = mkModel('m2', 'Other', [op, q]);
    const secondModel = mkModel('m3', 'Second', [sp]);
    const myModel = mkModel('m4', 'My Model', [mpm]);
    h.project = { id: 'p', models: [active, otherModel, secondModel, myModel], metamodels: [metamodel, otherMetamodel] };
});

// ── qualified addresses link across models ───────────────────────────────────────────────────────

describe('`set <inst>.<ref> = <Model>::<instance>` (#213)', () => {
    it('links the other model\'s instance, the message keeping the typed spelling (dies if the qualified form never resolves)', async () => {
        const r = await set('set Scenario_0.lead = Other::p');
        expect(r.success).toBe(true);
        expect(r.message).toBe('Linked Scenario_0.lead → Other::p');
        expect(h.writes).toEqual([{ slot: 's0_lead', values: ['op'] }]);
    });

    it('`+=` appends the cross-model target', async () => {
        h.store.get('s0_lead').__raw.values = ['p1'];
        const r = await set('set Scenario_0.lead += Other::p');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 's0_lead', values: ['p1', 'op'] }]);
    });

    it('`=` replaces on a single-valued slot: the cross-model target in, the old one out by value (dies without the by-value removal)', async () => {
        h.store.get('s0_coach').__raw.values = ['ant'];
        const r = await set('set Scenario_0.coach = Other::q');
        expect(r.success).toBe(true);
        expect(removedFrom('s0_coach')).toEqual(['ant']);
        expect(h.writes).toEqual([{ slot: 's0_coach', values: ['q'] }]);
    });

    it('the quoted form links a model whose name has a space (dies if the string is not split on the first `::`)', async () => {
        const r = await set('set Scenario_0.lead = "My Model::pm"');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 's0_lead', values: ['mpm'] }]);
    });

    it('an address with several `::` splits on the FIRST one (dies on a last-`::` or every-`::` split)', async () => {
        const weird = inst('wx', 'x::y', Phase, 'm2');
        otherModel.objects.push(weird);
        const r = await set('set Scenario_0.lead = "Other::x::y"');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 's0_lead', values: ['wx'] }]);
    });

    it('a target of ANOTHER metamodel links when its class conforms — the issue\'s actual scenario (dies on a metamodel-identity check)', async () => {
        const pe = inst('pe', 'pe', PhaseExt, 'm2');
        otherModel.objects.push(pe);
        const r = await set('set Scenario_0.lead = Other::pe');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 's0_lead', values: ['pe'] }]);
    });

    it('a qualifier naming the active model keeps the local path (dies if it is treated as cross-model)', async () => {
        const r = await set('set Scenario_0.lead = M1::p1');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 's0_lead', values: ['p1'] }]);
    });

    it('a case-variant qualifier resolves to its model', async () => {
        const r = await set('set Scenario_0.lead = other::p');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 's0_lead', values: ['op'] }]);
    });
});

// ── removal across models ────────────────────────────────────────────────────────────────────────

describe('taking a cross-model target out (#213)', () => {
    it('`remove Other::p from Scenario_0.lead` takes it out by value (dies on the M2 route: ELEMENT_NOT_FOUND)', async () => {
        h.store.get('s0_lead').__raw.values = ['op'];
        const r = await executeRemove(argsOf('remove Other::p from Scenario_0.lead'), context);
        expect(r.success).toBe(true);
        expect(r.command).toBe('remove');
        expect(r.message).toBe('Removed Other::p from Scenario_0.lead');
        expect(removedFrom('s0_lead')).toEqual(['op']);
        expect(h.writes).toEqual([]);
    });

    it('`set Scenario_0.lead -= Other::p` does the same by the `set` route', async () => {
        h.store.get('s0_lead').__raw.values = ['op'];
        const r = await set('set Scenario_0.lead -= Other::p');
        expect(r.success).toBe(true);
        expect(removedFrom('s0_lead')).toEqual(['op']);
        expect(h.writes).toEqual([]);
    });
});

// ── refusals ─────────────────────────────────────────────────────────────────────────────────────

describe('refusals of a cross-model link (#213)', () => {
    it('a cross-model target of the wrong class: TYPE_MISMATCH with the typed spelling, nothing written (dies if the check is skipped)', async () => {
        const r = await set('set Scenario_0.lead = Other::q');
        expect(codeOf(r)).toBe('TYPE_MISMATCH');
        expect(r.message).toContain('Other::q');
        nothingWritten();
    });

    it('no model named `Nope`: MODEL_NOT_FOUND, the suggestion listing the project\'s M1 models (dies if the miss degrades to a bare INSTANCE_NOT_FOUND)', async () => {
        const r = await set('set Scenario_0.lead = Nope::p');
        expect(codeOf(r)).toBe('MODEL_NOT_FOUND');
        expect(r.errors![0].suggestion).toBe("Models in the project: 'M1', 'Other', 'Second', 'My Model'");
        nothingWritten();
    });

    it('two models named `Other`: AMBIGUOUS_MODEL, nothing written (dies if the first is silently taken)', async () => {
        const second = h.project.models.find((m: any) => m.id === 'm3');
        second.name = 'Other';
        const r = await set('set Scenario_0.lead = Other::p');
        expect(codeOf(r)).toBe('AMBIGUOUS_MODEL');
        expect(r.message).toContain('Other');
        nothingWritten();
    });

    it('model exists, no such instance: INSTANCE_NOT_FOUND naming the model', async () => {
        const r = await set('set Scenario_0.lead = Other::nobody');
        expect(codeOf(r)).toBe('INSTANCE_NOT_FOUND');
        expect(r.message).toBe("Target instance 'Other::nobody' not found in model 'Other'");
        nothingWritten();
    });

    it('two instances of the name inside the model: AMBIGUOUS_INSTANCE, the existing refusal', async () => {
        const twin = inst('op2', 'p', Step, 'm2');
        otherModel.objects.push(twin);
        const r = await set('set Scenario_0.lead = Other::p');
        expect(codeOf(r)).toBe('AMBIGUOUS_INSTANCE');
        expect(r.errors![0].message).toContain('Other::p');
        expect(r.errors![0].message).toContain('2 candidates');
        nothingWritten();
    });

    it('a bare name stays active-model-only: refused, with both qualified spellings in the suggestion, no write (dies if a cross-model fallback is introduced)', async () => {
        const r = await set('set Scenario_0.lead = p');
        expect(codeOf(r)).toBe('INSTANCE_NOT_FOUND');
        expect(r.errors![0].suggestion).toBe("Found in 'Other', 'Second': qualify as Other::p or Second::p.");
        nothingWritten();
    });
});

// ── the handle registry ──────────────────────────────────────────────────────────────────────────

describe('the handle registry stays a run-local affair (#213)', () => {
    it('a run-local `p` in the active model is NOT what `Other::p` links (dies if the qualified path consults the registry)', async () => {
        const local = inst('lp', 'p', Phase, 'm1');
        active.objects.push(local);
        active.__raw.objects.push('lp');
        registerHandle('p', 'lp');

        const r = await set('set Scenario_0.lead = Other::p');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 's0_lead', values: ['op'] }]);
    });

    it('CONTROL: a bare name still resolves to the run-local handle first (the registry wins for the local path)', async () => {
        const local = inst('lp', 'p', Phase, 'm1');
        active.objects.push(local);
        active.__raw.objects.push('lp');
        registerHandle('p', 'lp');

        const r = await set('set Scenario_0.lead = p');
        expect(r.success).toBe(true);
        expect(h.writes).toEqual([{ slot: 's0_lead', values: ['lp'] }]);
    });
});
