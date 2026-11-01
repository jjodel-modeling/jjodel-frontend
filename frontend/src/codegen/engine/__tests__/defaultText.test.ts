/**
 * The default textual notation generator (P-2026-11-01-1946; decisions R-TXT-1..9, docs/decisions.md; discovery
 * docs/discovery/discovery_2026-11-01_default_textual_notation.md §2, §3): the shipped file
 * frontend/public/examples/codegen/default-text.generator.json, read as the import reads it and run through `generate`.
 *
 * The globals are shaped like `buildEvalContext`'s (jjscript/executor/commands/eval.ts), as in dispatch.test.ts: class
 * shells with own `attributes` and `references`, `superTypes` as shared shells, `instances`/`allInstances`; handles with
 * every feature slot, `instanceOf` and `parent`; `enumerations` with their literals. A handle holds what the L getter
 * gives it (eval.ts `fillInstanceSlots`): an unset optional attribute `null`, a defaulted one its default, a mandatory
 * one its type's default; so `level` and `count` below hold 7 and 0 with nothing set (R-TXT-5).
 *
 * The expected texts are written out by hand from the rules. Origins of index reads are not asserted (P-2026-11-01-1945).
 */

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { generate } from '../generate';
import { decodeGeneratorFile } from '../generatorFile';
import type { GenerateResult } from '../generate';
import type { TemplateRecord } from '../templates';

const FILE = new URL('../../../../public/examples/codegen/default-text.generator.json', import.meta.url);

function shippedTemplates(): TemplateRecord[] {
    const decoded = decodeGeneratorFile(readFileSync(FILE, 'utf8'));
    expect(decoded.problems).toEqual([]);
    expect(decoded.generators).toHaveLength(1);
    return [...decoded.generators[0].templates];
}

interface AttrSpec { readonly name: string; readonly type: string; readonly many?: boolean; readonly defaultValue?: unknown }
interface RefSpec { readonly name: string; readonly type: string; readonly containment?: boolean; readonly many?: boolean }
interface ClassSpec { readonly name: string; readonly supers?: readonly string[]; readonly isAbstract?: boolean; readonly attributes?: readonly AttrSpec[]; readonly references?: readonly RefSpec[] }
interface ObjSpec { readonly id: string; readonly cls: string; readonly slots: Record<string, unknown> }

/** Globals as `buildEvalContext` returns them; `slots` name other objects by id, under a reference. */
function model(classSpecs: readonly ClassSpec[], enums: Record<string, readonly string[]>, objs: readonly ObjSpec[]) {
    const shells = new Map<string, any>();
    for (const c of classSpecs) {
        shells.set(c.name, {
            name: c.name, className: 'DClass', isAbstract: !!c.isAbstract, isInterface: false, __type: 'Class',
            attributes: (c.attributes ?? []).map(a => ({ name: a.name, type: a.type, className: c.name, multiValued: !!a.many, defaultValue: a.defaultValue ?? null, __type: 'Attribute' })),
            references: (c.references ?? []).map(r => ({ name: r.name, type: r.type, containment: !!r.containment, multiplicity: r.many ? '*' : '1', upperBound: r.many ? -1 : 1, lowerBound: 0, opposite: null, className: c.name, __type: 'Reference' })),
            superTypes: [], subTypes: [], instances: [], allInstances: [],
        });
    }
    for (const c of classSpecs) shells.get(c.name).superTypes = (c.supers ?? []).map(s => shells.get(s));
    const handles = new Map<string, any>();
    for (const o of objs) {
        const shell = shells.get(o.cls);
        handles.set(o.id, { id: o.id, __type: 'Object', name: o.slots.name ?? `${o.cls}_${o.id}`, instanceOf: shell, instanceof: shell, parent: null });
    }
    const all = (c: any): any[] => [c, ...c.superTypes.flatMap(all)];
    for (const o of objs) {
        const h = handles.get(o.id);
        for (const level of all(h.instanceOf)) {
            for (const a of level.attributes) h[a.name] = o.slots[a.name] ?? (a.multiValued ? [] : null);
            for (const r of level.references) {
                const v = o.slots[r.name];
                const resolve = (id: unknown) => handles.get(id as string);
                h[r.name] = r.multiplicity === '*' ? ((v as string[] | undefined) ?? []).map(resolve) : (v === undefined ? null : resolve(v));
                if (r.containment) for (const child of [h[r.name]].flat()) if (child) child.parent = h;
            }
        }
        h.instanceOf.instances.push(h);
        for (const level of new Set(all(h.instanceOf))) level.allInstances.push(h);
    }
    const globals: Record<string, any> = {
        classes: [...shells.values()],
        enumerations: Object.entries(enums).map(([name, literals]) => ({ name, literals: literals.map(l => ({ name: l, value: -1 })), literalCount: literals.length, __type: 'Enumeration' })),
        instances: [...handles.values()],
    };
    for (const [name, shell] of shells) globals[name] = shell;
    return globals;
}

const LOOKUP = { MM: { className: 'DModel', id: 'MM', name: 'mm' }, M: { className: 'DModel', id: 'M', name: 'm', instanceof: 'MM' } };

function run(globals: Record<string, any>, templates: readonly TemplateRecord[]): GenerateResult {
    return generate(globals, LOOKUP, 'M', templates, 'main', [], {}, 'none');
}

// The discovery's fixture (report, Method), in code: `doc` on Named shows the supertype's features first.
const CLASSES: ClassSpec[] = [
    { name: 'Named', isAbstract: true, attributes: [{ name: 'name', type: 'EString' }, { name: 'doc', type: 'EString' }] },
    {
        name: 'Sys', supers: ['Named'],
        attributes: [
            { name: 'width', type: 'EInt' }, { name: 'depth', type: 'EInt' }, { name: 'enabled', type: 'EBoolean' }, { name: 'ready', type: 'EBoolean' },
            { name: 'label', type: 'EString' }, { name: 'note', type: 'EString' }, { name: 'mode', type: 'Mode' },
            { name: 'tags', type: 'EString', many: true }, { name: 'empty', type: 'EString', many: true },
            { name: 'level', type: 'EInt', defaultValue: 7 }, { name: 'count', type: 'EInt' },
        ],
        references: [
            { name: 'parts', type: 'Part', containment: true, many: true }, { name: 'links', type: 'Link', containment: true, many: true },
            { name: 'main', type: 'Part' },
        ],
    },
    { name: 'Part', supers: ['Named'], attributes: [{ name: 'size', type: 'EInt' }, { name: 'kind', type: 'Mode' }], references: [{ name: 'peers', type: 'Part', many: true }] },
    { name: 'Link', attributes: [{ name: 'weight', type: 'EInt' }], references: [{ name: 'from', type: 'Part' }, { name: 'to', type: 'Link' }] },
];
const ENUMS = { Mode: ['FAST', 'Fast', 'slow'] };
const OBJECTS: ObjSpec[] = [
    {
        id: 's1', cls: 'Sys', slots: {
            name: 's1', doc: 'top', width: 0, enabled: false, label: 'say "hi" \\ bye', mode: 'Fast', tags: ['a', 'b-c'], level: 7, count: 0,
            parts: ['p1', 'p2', 'p3', 'p4', 'p5'], links: ['l1', 'l2'], main: 'p2',
        },
    },
    { id: 'p1', cls: 'Part', slots: { name: 'dup', size: 1, kind: 'FAST', peers: ['p3', 'p2'] } },
    { id: 'p2', cls: 'Part', slots: { name: 'dup', size: 2, kind: 'slow' } },
    { id: 'p3', cls: 'Part', slots: { name: 'size', size: 3 } },
    { id: 'p4', cls: 'Part', slots: { name: 'FAST', kind: 'Fast', peers: ['p5'] } },
    { id: 'p5', cls: 'Part', slots: { name: 'has space' } },
    { id: 'l1', cls: 'Link', slots: { weight: 5, from: 'p3', to: 'l2' } },
    { id: 'l2', cls: 'Link', slots: { from: 'p1' } },
];

const EXPECTED = `Sys s1 {
  doc "top"
  width 0
  enabled false
  label "say \\"hi\\" \\\\ bye"
  mode Fast
  tags ["a", "b-c"]
  level 7
  count 0
  parts {
    Part dup {
      size 1
      kind FAST
      peers [size, parts[1]]
    }
    Part dup {
      size 2
      kind slow
    }
    Part size {
      size 3
    }
    Part FAST {
      kind Fast
      peers ["has space"]
    }
    Part "has space" {}
  }
  links {
    Link {
      weight 5
      from size
      to links[1]
    }
    Link {
      from parts[0]
    }
  }
  main parts[1]
}`;

describe('the default textual notation (R-TXT-1..9)', () => {
    it('prints the fixture as written out by hand from the rules (kills: any rule of R-TXT-1..5, 9 broken)', () => {
        const out = run(model(CLASSES, ENUMS, OBJECTS), shippedTemplates());
        expect(out.errors).toEqual([]);
        expect(out.code).toBe(EXPECTED);
    });

    it('feature order: the supertypes first, most general first, then own; attributes before references within each (R-TXT-1; kills: own features first, or references before attributes)', () => {
        const classes: ClassSpec[] = [
            { name: 'A', isAbstract: true, attributes: [{ name: 'a', type: 'EInt' }], references: [{ name: 'ra', type: 'C' }] },
            { name: 'B', isAbstract: true, supers: ['A'], attributes: [{ name: 'b', type: 'EInt' }] },
            { name: 'C', supers: ['B'], attributes: [{ name: 'c', type: 'EInt' }], references: [{ name: 'rc', type: 'C' }] },
        ];
        const out = run(model(classes, {}, [{ id: 'x', cls: 'C', slots: { a: 1, b: 2, c: 3, ra: 'x', rc: 'x' } }]), shippedTemplates());
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('C {\n  a 1\n  ra [0]\n  b 2\n  c 3\n  rc [0]\n}');
    });

    it('feature order on a diamond: A before both its heirs, which keep their declaration order (R-TXT-1; kills: the ancestors in reverse of their walk)', () => {
        const classes: ClassSpec[] = [
            { name: 'A', isAbstract: true, attributes: [{ name: 'a', type: 'EInt' }] },
            { name: 'B1', isAbstract: true, supers: ['A'], attributes: [{ name: 'b1', type: 'EInt' }] },
            { name: 'B2', isAbstract: true, supers: ['A'], attributes: [{ name: 'b2', type: 'EInt' }] },
            { name: 'C', supers: ['B1', 'B2'], attributes: [{ name: 'c', type: 'EInt' }] },
        ];
        const out = run(model(classes, {}, [{ id: 'x', cls: 'C', slots: { a: 1, b1: 2, b2: 3, c: 4 } }]), shippedTemplates());
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('C {\n  a 1\n  b1 2\n  b2 3\n  c 4\n}');
    });

    it('several roots: a containment path opens with the root\'s index among the roots (kills: path ambiguous across roots)', () => {
        const objs: ObjSpec[] = [
            { id: 's1', cls: 'Sys', slots: { name: 'a', parts: ['p1'] } },
            { id: 's2', cls: 'Sys', slots: { name: 'b', parts: ['p2'], main: 'p1' } },
            { id: 'p1', cls: 'Part', slots: { name: 'x' } },
            { id: 'p2', cls: 'Part', slots: { name: 'x' } },
        ];
        const out = run(model(CLASSES, ENUMS, objs), shippedTemplates());
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('Sys a {\n  parts {\n    Part x {}\n  }\n}\nSys b {\n  parts {\n    Part x {}\n  }\n  main [0].parts[0]\n}');
    });
});

describe('overrides through the metaclass dispatch (R-TXT-8)', () => {
    it('a typed obj for one class and a typed kw for one keyword of one class; the rest is the default (kills: override ignored, or applied to every class)', () => {
        const overrides: TemplateRecord[] = [
            { name: 'obj', params: ['o'], paramType: 'Part', mode: 'text', body: 'part ${nm(o.name)}${if o.size != null then " (" + feature(o, o.instanceOf.attributes.filter(a => a.name == "size").first) + ")" else ""}' },
            { name: 'kw', params: ['o', 'f'], paramType: 'Sys', body: 'if f.name == "width" then "w" else f.name' },
        ];
        const out = run(model(CLASSES, ENUMS, OBJECTS), [...shippedTemplates(), ...overrides]);
        expect(out.errors).toEqual([]);
        expect(out.code).toBe(EXPECTED
            .replace('  width 0', '  w 0')
            .replace(/ {4}Part dup \{\n {6}size 1\n[^]*?\n {4}Part "has space" \{\}/, '    part dup (size 1)\n    part dup (size 2)\n    part size (size 3)\n    part FAST\n    part "has space"'));
    });
});
