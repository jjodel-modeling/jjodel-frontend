/**
 * One spec of a metamodel and a model, read two ways: as the globals `buildEvalContext` gives a JjGen generator (the
 * builder of engine/__tests__/defaultText.test.ts, copied: that file exports nothing), and as the plain data of
 * textual/metamodel.ts. The differential tests run the shipped JjGen generator on the first and the printer on the
 * second (R-TXT-14).
 */

import { readFileSync } from 'node:fs';
import { expect } from 'vitest';
import { generate } from '../../engine/generate';
import { decodeGeneratorFile } from '../../engine/generatorFile';
import type { TemplateRecord } from '../../engine/templates';
import type { TextMetamodel, TextObject } from '../metamodel';

export interface AttrSpec { readonly name: string; readonly type: string; readonly many?: boolean; readonly defaultValue?: unknown }
export interface RefSpec { readonly name: string; readonly type: string; readonly containment?: boolean; readonly many?: boolean }
export interface ClassSpec { readonly name: string; readonly supers?: readonly string[]; readonly isAbstract?: boolean; readonly attributes?: readonly AttrSpec[]; readonly references?: readonly RefSpec[] }
export interface ObjSpec { readonly id: string; readonly cls: string; readonly slots: Record<string, unknown> }
export interface Spec { readonly classes: readonly ClassSpec[]; readonly enums: Record<string, readonly string[]>; readonly objects: readonly ObjSpec[] }

const FILE = new URL('../../../../public/examples/codegen/default-text.generator.json', import.meta.url);

export function shippedTemplates(): TemplateRecord[] {
    const decoded = decodeGeneratorFile(readFileSync(FILE, 'utf8'));
    expect(decoded.problems).toEqual([]);
    expect(decoded.generators).toHaveLength(1);
    return [...decoded.generators[0].templates];
}

/** Globals as `buildEvalContext` returns them; `slots` name other objects by id, under a reference. */
function globalsOf(spec: Spec): Record<string, any> {
    const shells = new Map<string, any>();
    for (const c of spec.classes) {
        shells.set(c.name, {
            name: c.name, className: 'DClass', isAbstract: !!c.isAbstract, isInterface: false, __type: 'Class',
            attributes: (c.attributes ?? []).map(a => ({ name: a.name, type: a.type, className: c.name, multiValued: !!a.many, defaultValue: a.defaultValue ?? null, __type: 'Attribute' })),
            references: (c.references ?? []).map(r => ({ name: r.name, type: r.type, containment: !!r.containment, multiplicity: r.many ? '*' : '1', upperBound: r.many ? -1 : 1, lowerBound: 0, opposite: null, className: c.name, __type: 'Reference' })),
            superTypes: [], subTypes: [], instances: [], allInstances: [],
        });
    }
    for (const c of spec.classes) shells.get(c.name).superTypes = (c.supers ?? []).map(s => shells.get(s));
    const handles = new Map<string, any>();
    for (const o of spec.objects) {
        const shell = shells.get(o.cls);
        handles.set(o.id, { id: o.id, __type: 'Object', name: o.slots.name ?? `${o.cls}_${o.id}`, instanceOf: shell, instanceof: shell, parent: null });
    }
    const all = (c: any): any[] => [c, ...c.superTypes.flatMap(all)];
    for (const o of spec.objects) {
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
        enumerations: Object.entries(spec.enums).map(([name, literals]) => ({ name, literals: literals.map(l => ({ name: l, value: -1 })), literalCount: literals.length, __type: 'Enumeration' })),
        instances: [...handles.values()],
    };
    for (const [name, shell] of shells) globals[name] = shell;
    return globals;
}

const LOOKUP = { MM: { className: 'DModel', id: 'MM', name: 'mm' }, M: { className: 'DModel', id: 'M', name: 'm', instanceof: 'MM' } };

/** The text the shipped JjGen generator prints for the spec. */
export function referenceText(spec: Spec, templates: readonly TemplateRecord[] = shippedTemplates()): string {
    const out = generate(globalsOf(spec), LOOKUP, 'M', templates, 'main', [], {}, 'none');
    expect(out.errors).toEqual([]);
    return out.code;
}

export function metamodelOf(spec: Spec): TextMetamodel {
    return {
        classes: spec.classes.map(c => ({ name: c.name, isAbstract: c.isAbstract, supers: c.supers, attributes: c.attributes, references: c.references })),
        enumerations: Object.entries(spec.enums).map(([name, literals]) => ({ name, literals })),
    };
}

/** The objects as the printer reads them: an unset slot reads as the L getter gives it (null, or [] when many-valued). */
export function objectsOf(spec: Spec): TextObject[] {
    return spec.objects.map(o => ({ id: o.id, cls: o.cls, slots: o.slots }));
}

// The discovery's fixture (P-2026-11-01-1709, as defaultText.test.ts writes it).
export const FIXTURE: Spec = {
    classes: [
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
    ],
    enums: { Mode: ['FAST', 'Fast', 'slow'] },
    objects: [
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
    ],
};
