import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { sketchOfMetamodel } from '../../../components/editor-v2/sim/metamodelSketch';
import { EXPR_BINDING_KEY, EXPR_FOLD_KEY, decodeExprBinding, encodeExprBinding, resolveBindingNames } from '../exprBinding';
import {
    exprBindingStatus, exprFoldActive, exprFoldDep, exprFoldedObjects, exprOwnersOf, exprSnapshotOf, exprTextOf,
    type ExprLookup,
} from '../exprBatch';
import briefFile from '../bindings/brief.json';

const FIXTURES = resolve(__dirname, 'fixtures');
const MODEL = 'm1';
const METAMODEL = 'mm';

interface Built {
    lookup: ExprLookup;
    idOf: Map<object, string>;
    kernel: any;
    objectCount: number;
}

/** The fixture as the D-layer holds it: DClass, DAttribute, DReference; DObject and one DValue per feature. */
function buildLookup(fixture: any): Built {
    const lookup: ExprLookup = {};
    const classId = (name: string): string => `c:${name}`;
    const classes = new Map<string, any>(fixture.classes.map((c: any) => [c.name, c]));
    lookup[METAMODEL] = { id: METAMODEL, className: 'DModel', name: 'Brief', classes: fixture.classes.map((c: any) => classId(c.name)), packages: [], _state: {} };
    for (const c of fixture.classes) {
        const attributes = c.attributes.map((a: string) => `a:${c.name}.${a}`);
        const references = c.references.map((r: any) => `r:${c.name}.${r.name}`);
        lookup[classId(c.name)] = { id: classId(c.name), className: 'DClass', name: c.name, father: METAMODEL, abstract: c.abstract, extends: c.supers.map(classId), attributes, references };
        c.attributes.forEach((a: string, i: number) => { lookup[attributes[i]] = { id: attributes[i], className: 'DAttribute', name: a, father: classId(c.name), type: '' }; });
        c.references.forEach((r: any, i: number) => { lookup[references[i]] = { id: references[i], className: 'DReference', name: r.name, father: classId(c.name), type: '', composition: r.composition }; });
    }
    const featuresOf = (name: string): string[] => {
        const c = classes.get(name);
        return [...c.supers.flatMap(featuresOf), ...lookup[classId(name)].attributes, ...lookup[classId(name)].references];
    };
    lookup[MODEL] = { id: MODEL, className: 'DModel', name: 'ddr4', instanceof: METAMODEL, objects: [] };

    let count = 0;
    const idOf = new Map<object, string>();
    const make = (o: any, father: string): string => {
        const id = `o:${count++}`;
        idOf.set(o, id);
        const features: string[] = [];
        lookup[id] = { id, className: 'DObject', name: o.name ?? id, father, instanceof: classId(o.__type), features };
        const featureIds = featuresOf(o.__type);
        const names = new Map<string, string>(featureIds.map(f => [lookup[f].name, f]));
        for (const key of Object.keys(o)) {
            if (key !== '__type' && !names.has(key)) throw new Error(`${o.__type} has no feature ${key}`);
        }
        for (const [name, f] of names) {
            const raw = o[name];
            const items: unknown[] = raw === undefined || raw === null ? [] : Array.isArray(raw) ? raw : [raw];
            const vid = `${id}/${f}`;
            const record: Record<string, unknown> = { id: vid, className: 'DValue', father: id, instanceof: f, values: [] };
            features.push(vid);
            lookup[vid] = record;
            record.values = items.map(x => (x && typeof x === 'object' ? make(x, vid) : x));
        }
        return id;
    };
    make(fixture.kernel, MODEL);
    return { lookup, idOf, kernel: fixture.kernel, objectCount: count };
}

function installBinding(lookup: ExprLookup): void {
    const file = decodeExprBinding(briefFile);
    if (!file.ok || !file.value) throw new Error(`brief.json: ${file.ok ? 'empty' : file.errors.join('; ')}`);
    const resolved = resolveBindingNames(file.value, sketchOfMetamodel(lookup, METAMODEL));
    if (!resolved.ok) throw new Error(`brief.json: ${resolved.errors.join('; ')}`);
    lookup[METAMODEL]._state[EXPR_BINDING_KEY] = encodeExprBinding(resolved.value);
}

/** `sig()` of brief_view.py: a design element as its header lines. */
function sig(x: any, kind: string, text: (o: any, slot: string) => string): string[] {
    if (x.__type === 'ForEach') {
        return [`for ${x.v} ${x.names ? `in ${x.names}` : 'over the picked items'}:`, ...x.body.flatMap((b: any) => sig(b, kind, text)).map((l: string) => `  ${l}`)];
    }
    const monitor = x.monitor ? 'monitor ' : '';
    switch (kind) {
        case 'in':
        case 'out':
            return [`${kind} ${x.name}: ${text(x, 'type')}${x.driver ? ` = ${text(x, 'driver')}` : ''}`];
        case 'regs':
            return [`${monitor}reg ${x.name}: ${text(x, 'type')} ${x.reset ? `reset ${text(x, 'reset')}` : '(no reset)'}`,`    next = ${text(x, 'next')}`];
        case 'wires':
            return [`${monitor}wire ${x.name}: ${text(x, 'type')} = ${text(x, 'expr')}`];
        default:
            return [`${x.kind.toLowerCase()} ${x.name} = ${text(x, 'expr')}`];
    }
}

/** `view()` of brief_view.py:160-198, from the printed slots and the raw attributes. */
function view(b: any, shared: string, text: (o: any, slot: string) => string): string {
    const props = (list: any[]): string => list.map(p => `${p.key} = ${p.value}`).join(', ');
    const out: string[] = [`brief ${b.name}`, '', 'params'];
    out.push(...b.params.map((p: any) => `  ${p.name} = ${p.value}`));
    if (shared) {
        out.push('', 'derived (written out in full wherever used: the kernel has no named integer definitions)');
        out.push(...shared.split('\n').map(l => `  ${l}`));
    }
    out.push('', `picks ${b.picks.map((p: any) => p.name).join(' ')}`, '', 'requirements');
    for (const r of b.requirements) {
        const list = props(r.props ?? []);
        out.push(`  require ${r.kind} as ${r.name}${list ? ` (${list})` : ''}`);
    }
    const lib = b.lib;
    out.push('', `library ${lib.name}`, '  items');
    for (const it of lib.items) out.push(`    ${it.name}: ${props(it.props)}`);
    out.push('  patterns');
    for (const p of lib.patterns) {
        out.push(`    ${p.kinds ? `observer for ${p.kinds}` : `pattern ${p.kind}`}`);
        for (const k of ['regs', 'wires', 'properties']) {
            for (const x of p[k] ?? []) out.push(...sig(x, k, text).map(l => `      ${l}`));
        }
    }
    const t = b.realization;
    out.push('', `realization ${t.name}`);
    for (const [k, kind] of [['inputs', 'in'], ['outputs', 'out']]) {
        for (const x of t[k]) out.push(...sig(x, kind, text).map(l => `  ${l}`));
    }
    for (const k of ['regs', 'wires']) {
        for (const x of t[k]) out.push(...sig(x, k, text).map(l => `  ${l}`));
    }
    out.push('  exposes');
    out.push(...(t.exposes ?? []).map((a: any) => `    ${a.name} = ${text(a, 'expr')}`));
    return `${out.join('\n')}\n`;
}

/** The first line that differs, around its first differing column: the fixtures are never printed whole. */
function firstDifference(actual: string, expected: string): string | null {
    if (actual === expected) return null;
    const a = actual.split('\n');
    const e = expected.split('\n');
    for (let i = 0; i < Math.max(a.length, e.length); i++) {
        if (a[i] === e[i]) continue;
        const la = a[i] ?? '<no line>';
        const le = e[i] ?? '<no line>';
        let c = 0;
        while (c < la.length && c < le.length && la[c] === le[c]) c++;
        const from = Math.max(0, c - 50);
        return `line ${i + 1} of ${e.length}, column ${c + 1}\nexpected: ${le.slice(from, c + 70)}\nactual:   ${la.slice(from, c + 70)}`;
    }
    return 'same lines, different bytes';
}

describe('the DDR4 brief', () => {
    let built: Built;
    let expected: string;

    beforeAll(() => {
        built = buildLookup(JSON.parse(readFileSync(resolve(FIXTURES, 'ddr4_closed_v.model.json'), 'utf8')));
        expected = readFileSync(resolve(FIXTURES, 'ddr4_closed_v.brief.txt'), 'utf8');
        installBinding(built.lookup);
    });

    it('folds 4020 objects under 246 roots and keeps 249', () => {
        const status = exprBindingStatus(built.lookup, MODEL);
        expect(status).toMatchObject({ kind: 'ok', roots: 246, folded: 4020 });
        expect(built.objectCount - exprFoldedObjects(built.lookup, MODEL).size).toBe(249);
    });

    it('prints the view of brief_view.py, byte for byte', () => {
        const { lookup, idOf, kernel } = built;
        const owner = (o: any): string => {
            const id = idOf.get(o);
            if (!id) throw new Error('not an object of the fixture');
            return id;
        };
        const shared = exprTextOf(lookup, owner(kernel), '@shared');
        const actual = view(kernel, shared, (o, slot) => exprTextOf(lookup, owner(o), slot));
        expect(firstDifference(actual, expected)).toBeNull();
        expect(Buffer.byteLength(actual)).toBe(14967);
    });

    it('prints the slots of a design-level ForEach, whose view shows only a header', () => {
        const { lookup, idOf, kernel } = built;
        const loops = kernel.lib.patterns.flatMap((p: any) => (p.wires ?? []).filter((w: any) => w.__type === 'ForEach'));
        expect(loops.length).toBe(1);
        const [wire] = loops[0].body;
        expect(exprTextOf(lookup, idOf.get(wire)!, 'expr')).not.toBe('');
        expect(exprTextOf(lookup, idOf.get(wire)!, 'type')).not.toBe('');
    });

    it('lists as owners the objects with slots that are not folded', () => {
        const { lookup, idOf, kernel } = built;
        const owners = new Set(exprOwnersOf(lookup, MODEL));
        expect(owners.has(idOf.get(kernel.realization.regs[0])!)).toBe(true);
        expect(owners.has(idOf.get(kernel.realization.regs[0].next)!)).toBe(false);
        expect(owners.has(idOf.get(kernel)!)).toBe(false);
    });

    it('gives a snapshot of the slot texts of an owner, and nothing for another object', () => {
        const { lookup, idOf, kernel } = built;
        const reg = kernel.realization.regs[0];
        expect(exprSnapshotOf(lookup, idOf.get(reg)!)).toContain(exprTextOf(lookup, idOf.get(reg)!, 'next'));
        expect(exprSnapshotOf(lookup, idOf.get(reg.next)!)).toBe('');
    });
});

describe('the batch', () => {
    const fresh = (): Built => {
        const built = buildLookup(JSON.parse(readFileSync(resolve(FIXTURES, 'ddr4_closed_v.model.json'), 'utf8')));
        installBinding(built.lookup);
        return built;
    };

    /** The DValue of the IntLit of a Const reset, and the owning register. */
    const literalResets = (built: Built): Array<{ reg: any; value: string }> => built.kernel.realization.regs
        .filter((r: any) => r.reset?.value?.__type === 'IntLit')
        .map((r: any) => {
            const lit = built.lookup[built.idOf.get(r.reset.value)!];
            const value = lit.features.find((f: string) => built.lookup[built.lookup[f].instanceof].name === 'value');
            return { reg: r, value };
        });

    it('reprints only the chain of an edited constant', () => {
        const built = fresh();
        const [edited, untouched] = literalResets(built);
        const record = built.lookup[untouched.value];
        const original = record.values;
        let reads = 0;
        Object.defineProperty(record, 'values', { get: () => { reads++; return original; }, enumerable: true });

        const before = exprTextOf(built.lookup, built.idOf.get(edited.reg)!, 'reset');
        const otherBefore = exprTextOf(built.lookup, built.idOf.get(untouched.reg)!, 'reset');
        expect(reads).toBeGreaterThan(0);

        reads = 0;
        const next: ExprLookup = { ...built.lookup, [edited.value]: { ...built.lookup[edited.value], values: [37] } };
        expect(exprTextOf(next, built.idOf.get(edited.reg)!, 'reset')).not.toBe(before);
        expect(exprTextOf(next, built.idOf.get(edited.reg)!, 'reset')).toContain('37');
        expect(exprTextOf(next, built.idOf.get(untouched.reg)!, 'reset')).toBe(otherBefore);
        expect(reads).toBe(0);
    });

    it('computes once per idlookup identity', () => {
        const built = fresh();
        const first = exprFoldedObjects(built.lookup, MODEL);
        expect(exprFoldedObjects(built.lookup, MODEL)).toBe(first);
        expect(exprFoldedObjects({ ...built.lookup }, MODEL)).not.toBe(first);
    });

    const withBinding = (built: Built, raw: unknown): ExprLookup => ({
        ...built.lookup,
        [METAMODEL]: { ...built.lookup[METAMODEL], _state: raw === undefined ? {} : { [EXPR_BINDING_KEY]: raw } },
    });

    it('degrades explicitly: no binding folds nothing', () => {
        const lookup = withBinding(fresh(), undefined);
        expect(exprBindingStatus(lookup, MODEL)).toEqual({ kind: 'none' });
        expect(exprFoldedObjects(lookup, MODEL).size).toBe(0);
    });

    it('degrades explicitly: a bad binding says why and folds nothing', () => {
        const lookup = withBinding(fresh(), '{"v":2}');
        expect(exprBindingStatus(lookup, MODEL)).toEqual({ kind: 'invalid', errors: ['Unknown version 2: only 1 is read.'] });
        expect(exprFoldedObjects(lookup, MODEL).size).toBe(0);
        expect(exprTextOf(lookup, 'o:0', 'x')).toBe('');
    });

    it('degrades explicitly: a stale id says which', () => {
        const built = fresh();
        const lookup: ExprLookup = { ...built.lookup };
        delete lookup['r:Register.next'];
        const status = exprBindingStatus(lookup, MODEL);
        expect(status.kind).toBe('invalid');
        expect(status.kind === 'invalid' && status.errors[0]).toContain('r:Register.next');
    });

    it('keeps working with an unknown root key, even one named like a status field', () => {
        const built = fresh();
        const stored = JSON.parse(built.lookup[METAMODEL]._state[EXPR_BINDING_KEY]);
        const lookup = withBinding(built, JSON.stringify({ ...stored, kind: 'future', status: 'future' }));
        expect(exprBindingStatus(lookup, MODEL)).toMatchObject({ kind: 'ok', folded: 4020 });
    });

    it('reads the activation from the viewpoint, and depends on the raw binding only when it folds', () => {
        const built = fresh();
        const lookup: ExprLookup = {
            ...built.lookup,
            on: { id: 'on', _state: { [EXPR_FOLD_KEY]: true } },
            off: { id: 'off', _state: {} },
        };
        expect(exprFoldActive(lookup, 'on')).toBe(true);
        expect(exprFoldActive(lookup, 'off')).toBe(false);
        expect(exprFoldDep(lookup, 'off', MODEL)).toBe('');
        expect(exprFoldDep(lookup, 'on', MODEL)).toBe(lookup[METAMODEL]._state[EXPR_BINDING_KEY]);
    });
});
