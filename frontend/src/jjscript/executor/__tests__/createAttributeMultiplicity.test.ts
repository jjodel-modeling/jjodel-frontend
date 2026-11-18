/**
 * #214 — `create attribute` (and, the same clause on the same fields, `create parameter`)
 * drops the multiplicity the command writes: every created attribute came out [0..1],
 * the `DStructuralFeature` seed (model/logicWrapper/LModelElement.tsx:2168-2169),
 * because the executor never read `options.multiplicity`.
 *
 * The lexer (MULTIPLICITY token, parser/lexer.ts:241-258) and the parser
 * (`options.multiplicity` for every element type, parser/parser.ts:419-423) were never
 * the gap — this bench runs the REAL parser and the REAL `executeCreate`, so the AST the
 * handler reads is the one Run hands it. The fix mirrors the `createReference` block
 * (executor/commands/create.ts:872-880). This file pins, per the §5 mutation discipline:
 *
 *   - the bound writes on attribute and parameter, one case per clause form;
 *   - the `'*'` → `-1` conversion (kill: dropping it leaves `'*'` on the field);
 *   - the lower write (kill: the [1..1] / [1..*] cases die, not the [0..*] ones);
 *   - the SEEDS control: no clause → zero writes, [0..1] stands (kill: a blanket
 *     write of the default bounds);
 *   - the reference path itself: deleting the block the fix mirrors kills THIS control,
 *     not the new cases — the two cannot be "harmonised" away.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
    actions: [] as Array<{ el: any; field: string; value: any; op: any; isPointer: any }>,
    created: [] as Array<{ ctor: string; name: any; type: any; father: any; el: any }>,
    project: null as any,
    resolveParent: null as null | ((parent: any) => any),
    typeTarget: null as any,
}));

vi.mock('../../../joiner', () => {
    const mk = (ctor: string) => ({
        new: (name: any, type: any, father: any) => {
            const el: any = { id: `${ctor.toLowerCase()}_${h.created.length + 1}`, name, type, father, className: ctor };
            h.created.push({ ctor, name, type, father, el });
            return el;
        },
    });
    return {
        DClass: mk('DClass'),
        DAttribute: mk('DAttribute'),
        DReference: mk('DReference'),
        DOperation: mk('DOperation'),
        DParameter: mk('DParameter'),
        DPackage: mk('DPackage'),
        DEnumerator: mk('DEnumerator'),
        DEnumLiteral: mk('DEnumLiteral'),
        DObject: { new: () => null },
        DModel: class {},
        DValue: class {},
        LModel: class {},
        LProject: class {},
        LClass: class {},
        LPointerTargetable: { fromPointer: () => null },
        TRANSACTION: (_: string, fn: () => void) => fn(),
        SetFieldAction: {
            new: (el: any, field: string, value: any, op: any, isPointer: any) => {
                h.actions.push({ el, field, value, op, isPointer });
            },
        },
        // the real spellings (common/Defaults.ts: `Pointer_<UPPER>`, as pointerFor's toUpperCase() asks)
        Defaults: {
            Pointer_ESTRING: 'Pointer_ESTRING',
            Pointer_EINT: 'Pointer_EINT',
            Pointer_EBOOLEAN: 'Pointer_EBOOLEAN',
            Pointer_EDATE: 'Pointer_EDATE',
            Pointer_EDOUBLE: 'Pointer_EDOUBLE',
            Pointer_EFLOAT: 'Pointer_EFLOAT',
            Pointer_ELONG: 'Pointer_ELONG',
            Pointer_ESHORT: 'Pointer_ESHORT',
            Pointer_EBYTE: 'Pointer_EBYTE',
            Pointer_ECHAR: 'Pointer_ECHAR',
            Pointer_EVOID: 'Pointer_EVOID',
        },
    };
});

vi.mock('../utils', () => ({
    getProject: () => h.project,
    getTargetMetamodel: () => null,
    getDefaultParent: () => null,
    // the real list (executor/utils.ts needsParent), mirrored
    needsParent: (t: string) => ['attribute', 'reference', 'operation', 'parameter', 'literal'].includes(t),
}));

vi.mock('../resolvers', () => ({
    resolveElement: () => null,
    resolveElementInMetamodel: () => null,
    resolveTargetInMetamodel: () => ({ element: null }),
    resolveTargetInProject: (parent: any) => ({ element: h.resolveParent ? h.resolveParent(parent) : null }),
    resolveTypeTarget: () => ({ element: h.typeTarget ?? null }),
    kindLabel: (kinds?: string[]) => (kinds || []).map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(' or '),
    memberMissingMessage: () => 'member not found',
    ambiguityMessage: () => 'ambiguous',
    QUALIFY_ADVICE: 'Qualify as Metamodel::Name.',
}));

vi.mock('../../../model/logicWrapper/nameUniqueness', () => ({
    checkM2NameUniqueness: () => ({ ok: true }),
    m2KindOf: () => 'class',
}));

vi.mock('../../../redux/action/action', () => ({ COMMIT: () => undefined }));

import { parse } from '../../parser/parser';
import { executeCreate } from '../commands/create';

// ── The metamodel ────────────────────────────────────────────────────────────────────────────────
// Duck-typed like the L proxies the executor sees on the field: it reads `className`, `id`,
// `name` and the collections, never a method.

const Person: any = { className: 'DClass', id: 'cPerson', name: 'Person', father: 'mm1', attributes: [], references: [], operations: [] };
const greet: any = { className: 'DOperation', id: 'opGreet', name: 'greet', father: 'cPerson', parameters: [] };
Person.operations.push(greet);
const metamodel: any = { id: 'mm1', name: 'TestMM', isMetamodel: true };

const context: any = { projectId: 'p', targetMetamodelId: 'mm1', level: 'M2', history: [], variables: new Map() };

const argsOf = (line: string): any => {
    const r = parse(line);
    if (!r.success) throw new Error(`parse failed: ${line}: ${r.errors?.[0]?.message}`);
    return r.ast!.args;
};

const inPerson = () => { h.resolveParent = (p: any) => (p.member ? null : Person); };
const inGreet = () => { h.resolveParent = (p: any) => (p.member === 'greet' ? greet : null); };

/** The bound writes on one element, in order. */
const bounds = (el: any) => h.actions.filter((a) => a.el === el);

beforeEach(() => {
    h.actions = [];
    h.created = [];
    h.project = { id: 'p', metamodels: [metamodel] };
    h.resolveParent = null;
    h.typeTarget = null;
});

// ── create attribute ─────────────────────────────────────────────────────────────────────────────

describe('create attribute — the multiplicity clause is written (#214)', () => {
    it('[0..1] writes the written bounds, type and father as settled', async () => {
        inPerson();
        const r = await executeCreate(argsOf('create attribute age in Person type Integer [0..1]'), context);
        expect(r.success).toBe(true);
        const attr = h.created[0];
        expect(attr.ctor).toBe('DAttribute');
        expect(attr.type).toBe('Pointer_EINT');
        expect(attr.father).toBe('cPerson');
        expect(bounds(attr.el)).toEqual([
            { el: attr.el, field: 'lowerBound', value: 0, op: undefined, isPointer: false },
            { el: attr.el, field: 'upperBound', value: 1, op: undefined, isPointer: false },
        ]);
        expect(r.message).toBe(`Created attribute 'age' [0..1]`);
    });

    it('[1..1] writes a required single-valued bound', async () => {
        inPerson();
        const r = await executeCreate(argsOf('create attribute age in Person type Integer [1..1]'), context);
        expect(r.success).toBe(true);
        const el = h.created[0].el;
        expect(bounds(el)).toEqual([
            { el, field: 'lowerBound', value: 1, op: undefined, isPointer: false },
            { el, field: 'upperBound', value: 1, op: undefined, isPointer: false },
        ]);
    });

    it('[0..*] converts the unbounded upper to -1', async () => {
        inPerson();
        const r = await executeCreate(argsOf('create attribute tags in Person type String [0..*]'), context);
        expect(r.success).toBe(true);
        const el = h.created[0].el;
        expect(bounds(el)).toEqual([
            { el, field: 'lowerBound', value: 0, op: undefined, isPointer: false },
            { el, field: 'upperBound', value: -1, op: undefined, isPointer: false },
        ]);
        expect(r.message).toBe(`Created attribute 'tags' [0..*]`);
    });

    it('[1..*] converts the unbounded upper to -1 and keeps lower 1', async () => {
        inPerson();
        const r = await executeCreate(argsOf('create attribute tags in Person type String [1..*]'), context);
        expect(r.success).toBe(true);
        const el = h.created[0].el;
        expect(bounds(el)).toEqual([
            { el, field: 'lowerBound', value: 1, op: undefined, isPointer: false },
            { el, field: 'upperBound', value: -1, op: undefined, isPointer: false },
        ]);
    });

    it('[*] is zero-or-more', async () => {
        inPerson();
        const r = await executeCreate(argsOf('create attribute tags in Person type String [*]'), context);
        expect(r.success).toBe(true);
        const el = h.created[0].el;
        expect(bounds(el)).toEqual([
            { el, field: 'lowerBound', value: 0, op: undefined, isPointer: false },
            { el, field: 'upperBound', value: -1, op: undefined, isPointer: false },
        ]);
    });

    it('[0..5] writes the reachable bound, not -1', async () => {
        inPerson();
        const r = await executeCreate(argsOf('create attribute trio in Person type Integer [0..5]'), context);
        expect(r.success).toBe(true);
        const el = h.created[0].el;
        expect(bounds(el)).toEqual([
            { el, field: 'lowerBound', value: 0, op: undefined, isPointer: false },
            { el, field: 'upperBound', value: 5, op: undefined, isPointer: false },
        ]);
    });

    it('no clause: the seeds stand, nothing is written (control)', async () => {
        inPerson();
        const r = await executeCreate(argsOf('create attribute age in Person type Integer'), context);
        expect(r.success).toBe(true);
        expect(h.actions).toEqual([]);
        expect(r.message).toBe(`Created attribute 'age'`);
    });
});

// ── create parameter: the same clause on the same DStructuralFeature fields ──────────────────────

describe('create parameter — the same clause on the same fields (#214)', () => {
    it('[1..1] writes the written bounds, type and father as settled', async () => {
        inGreet();
        const r = await executeCreate(argsOf('create parameter p in Person.greet type String [1..1]'), context);
        expect(r.success).toBe(true);
        const par = h.created[0];
        expect(par.ctor).toBe('DParameter');
        expect(par.type).toBe('Pointer_ESTRING');
        expect(par.father).toBe('opGreet');
        expect(bounds(par.el)).toEqual([
            { el: par.el, field: 'lowerBound', value: 1, op: undefined, isPointer: false },
            { el: par.el, field: 'upperBound', value: 1, op: undefined, isPointer: false },
        ]);
        expect(r.message).toBe(`Created parameter 'p' [1..1]`);
    });

    it('[0..*] converts the unbounded upper to -1', async () => {
        inGreet();
        const r = await executeCreate(argsOf('create parameter p in Person.greet type String [0..*]'), context);
        expect(r.success).toBe(true);
        const el = h.created[0].el;
        expect(bounds(el)).toEqual([
            { el, field: 'lowerBound', value: 0, op: undefined, isPointer: false },
            { el, field: 'upperBound', value: -1, op: undefined, isPointer: false },
        ]);
    });

    it('no clause: the seeds stand, nothing is written (control)', async () => {
        inGreet();
        const r = await executeCreate(argsOf('create parameter p in Person.greet type String'), context);
        expect(r.success).toBe(true);
        expect(h.actions).toEqual([]);
        expect(r.message).toBe(`Created parameter 'p'`);
    });
});

// ── create reference: the block the fix mirrors — the control that pins the pattern itself ──────

describe('create reference — the block the fix mirrors (control)', () => {
    it('still writes type and bounds, in order', async () => {
        inPerson();
        h.typeTarget = Person;
        const r = await executeCreate(argsOf('create reference friends in Person type Person [0..*]'), context);
        expect(r.success).toBe(true);
        const ref = h.created[0];
        expect(ref.ctor).toBe('DReference');
        expect(h.actions).toEqual([
            { el: ref.el, field: 'type', value: 'cPerson', op: undefined, isPointer: true },
            { el: ref.el, field: 'lowerBound', value: 0, op: undefined, isPointer: false },
            { el: ref.el, field: 'upperBound', value: -1, op: undefined, isPointer: false },
        ]);
        expect(r.message).toBe(`Created reference 'friends' → Person [0..*]`);
    });
});
