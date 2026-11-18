/**
 * dcnCompile — the DCN compiler (R-DCN-11, R-DCN-14; discovery 2026-11-06 §3.2, §3.3).
 *
 * From the resolved dcn roles (`dcnStcFromRoles`), a read view of the model and
 * the R-OI `object` binding, a `CompiledNet` with no places: a guarded command
 * is a Petri transition with an empty preset and postset, run by the shared
 * `step`. One transition per (instance, operation) invocation and one per
 * (instance, viewpoint, monitor) tick contribution, each with a nucleus-owned
 * opaque id recorded in the side table `entries`. Classification, completeness,
 * exclusivity, Interleave, Sync and redefinition expansion are the step lane's
 * (L4.4); nothing here evaluates an expression, and nothing calls this yet.
 *
 * - Instances: the objects the binding applies to whose classifier is a static
 *   class; an enumeration literal is an instance specification too, and is not
 *   one. The classifiers of an instance are its classifier and its generals,
 *   level by level (R-DCN-17): their own operations, then for each viewpoint and
 *   each of its dynamic classes, its operations and then its monitors.
 * - Ids: `dcn-` and a hash of the kind, the instance, the viewpoint and the
 *   operation or monitor. They depend on those M1 ids only, so they are the
 *   same on every compilation and do not move when another element is added;
 *   a scenario names them and never parses them (scenarioCodec.ts unchanged).
 *   An invocation is triggered by its own id; every tick by `DCN_TICK_EVENT`.
 * - Guards: the precondition as text, and for a dynamic class's operation or
 *   monitor the class that must be active, a separate field (`classifiedAs`).
 *   The guard and action site of a transition is its own id, so the oracle finds
 *   `self` and the text in `entries`. Bodies stay text, parsed by the evaluator.
 * - Arguments: the operation's parameters are R-SIM-88 inputs of the transition
 *   (R-DCN-15), never events; one without a finite domain is a `no-domain` defect.
 * - σ: per instance, one attribute per feature of `featureClosure` (own,
 *   inherited, dormant through `featureSources`, R-DCN-3), keyed by the
 *   feature's name, declared per instance (`StateAttributeDecl.instance`). The
 *   value is the slot's, else the feature's default, else the least value of
 *   the domain with an `initial` defect. Domains: Boolean, the enumeration's
 *   literals, `Integer` with both range bounds (R-DCN-13); an unbounded
 *   `Integer` or a String has none and is listed in `unexportable` (R-DCN-6).
 *   The marking is empty.
 *
 * The M2 features the roles do not name (range bounds, literals, parameters)
 * come in `features`. Pure: no React, no store, no JjEL.
 */

import type { OntoBinding } from '../../ontological/bindingCodec';
import { featureClosure, recordsFor } from '../../ontological/bindingReader';
import type { OntoReadView } from '../../ontological/bindingReader';
import type {
    CompiledNet, DeclarationDefect, Domain, InputRead, NetTransition, SimValue, StateAttributeDecl,
} from '../netTypes';
import type { DcnStc } from './dcnRoles';

/** The event every tick contribution is triggered by: the Clock's press (R-SIM-122). */
export const DCN_TICK_EVENT = 'dcn-tick';

/** The binding's read view, plus the objects of the model and their names. */
export interface DcnReadView extends OntoReadView {
    /** The M1 ids of the model's objects, in model order. */
    objects(): string[];
    nameOf(objectId: string): string | undefined;
}

/** M2 feature ids no dcn role names; each is optional, and what it reads is then absent. */
export interface DcnFeatures {
    /** The two range bounds of a property (R-DCN-13). */
    readonly rangeMin?: string;
    readonly rangeMax?: string;
    /** An enumeration to its literals. */
    readonly literals?: string;
    /** An operation to its parameters. */
    readonly parameters?: string;
}

export interface DcnCompileInput {
    readonly modelId: string;
    readonly stc: DcnStc;
    readonly binding: OntoBinding;
    readonly view: DcnReadView;
    readonly features?: DcnFeatures;
}

/** What a transition of the DCN net stands for. */
export interface DcnEntry {
    readonly id: string;
    readonly kind: 'invocation' | 'tick';
    readonly instance: string;
    /** The operation (invocation) or the monitor (tick). */
    readonly element: string;
    /** `null` for an operation of the static class. */
    readonly viewpoint: string | null;
    /** The dynamic class that owns the element; `null` for an operation of the static class. */
    readonly dynamicClass: string | null;
    readonly guard: {
        /** The precondition as text; `null` when absent (true). */
        readonly precondition: string | null;
        /** The dynamic class that must classify the instance; `null` for the static class. Not evaluated here. */
        readonly classifiedAs: string | null;
    };
    /** The actions as text, in order. */
    readonly body: readonly string[];
    /** The arguments, asked at the press (R-SIM-88); `element` is the transition id. */
    readonly inputs: readonly InputRead[];
}

/** The feature behind an attribute of σ. */
export interface DcnSlot {
    readonly feature: string;
    /** The dynamic class a dormant feature comes from; `null` for a feature of the classifier's closure. */
    readonly dormantOwner: string | null;
}

/** An attribute the exporter cannot verify (R-DCN-6). */
export interface DcnUnexportable {
    readonly element: string;
    readonly attr: string;
    readonly feature: string;
    readonly reason: 'unbounded-integer' | 'no-domain';
}

export interface DcnCompiled {
    readonly net: CompiledNet;
    /** Transition id to what it stands for, in transition order. */
    readonly entries: ReadonlyMap<string, DcnEntry>;
    /** Instance to attribute name to its feature. */
    readonly slots: ReadonlyMap<string, ReadonlyMap<string, DcnSlot>>;
    readonly unexportable: readonly DcnUnexportable[];
}

/** cyrb53: a 53-bit string hash, base 36. */
function hash(s: string): string {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 2654435761);
        h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** The classifier and its generals, level by level, each once (bindingReader.ts `generalsOf`). */
function generalizationClosure(view: DcnReadView, binding: OntoBinding, classifier: string): string[] {
    const out = [classifier];
    const g = binding.generalization as { direct?: string; via?: string; general?: string } | undefined;
    const generalsOf = (id: string): string[] => {
        if (!g) return [];
        if (g.direct !== undefined) return view.referenceTargets(id, g.direct);
        if (g.via === undefined || g.general === undefined) return [];
        const general = g.general;
        return view.referenceTargets(id, g.via).flatMap(link => view.referenceTargets(link, general));
    };
    for (let i = 0; i < out.length; i++) {
        for (const general of generalsOf(out[i])) if (!out.includes(general)) out.push(general);
    }
    return out;
}

const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);

const texts = (v: unknown): string[] =>
    (Array.isArray(v) ? v : [v]).filter((x): x is string => text(x) !== null);

type TypeKind = 'boolean' | 'integer' | 'enum' | 'string';

interface Typed {
    readonly kind: TypeKind;
    readonly domain: Domain | null;
    /** Set when the bounds are there but wrong. */
    readonly badBounds?: string;
}

const asInt = (v: unknown): number | undefined => {
    if (typeof v === 'number' && Number.isInteger(v)) return v;
    if (typeof v === 'string' && /^-?\d+$/.test(v.trim())) return Number(v.trim());
    return undefined;
};

/** The kind and the finite domain of a typed element (a property or a parameter). */
function typeOf(view: DcnReadView, binding: OntoBinding, features: DcnFeatures, element: string): Typed {
    const type = binding.featureType !== undefined ? view.referenceTargets(element, binding.featureType)[0] : undefined;
    const typeName = type !== undefined ? view.nameOf(type) : undefined;
    if (typeName === 'Boolean') return { kind: 'boolean', domain: { kind: 'boolean' } };
    if (typeName === 'Integer') {
        const min = features.rangeMin !== undefined ? asInt(view.attributeValue(element, features.rangeMin)) : undefined;
        const max = features.rangeMax !== undefined ? asInt(view.attributeValue(element, features.rangeMax)) : undefined;
        if (min === undefined || max === undefined) return { kind: 'integer', domain: null };
        if (min > max) return { kind: 'integer', domain: null, badBounds: `bounds ${min}..${max}` };
        return { kind: 'integer', domain: { kind: 'range', min, max } };
    }
    const literals = type !== undefined && features.literals !== undefined
        ? view.referenceTargets(type, features.literals).map(l => view.nameOf(l)).filter((n): n is string => n !== undefined)
        : [];
    if (literals.length > 0) return { kind: 'enum', domain: { kind: 'enum', literals } };
    return { kind: 'string', domain: null };
}

/** `raw` as a value of the type, or `undefined` when it is not one. */
function coerce(t: Typed, raw: unknown): SimValue | undefined {
    switch (t.kind) {
        case 'boolean':
            return raw === true || raw === 'true' ? true : raw === false || raw === 'false' ? false : undefined;
        case 'integer':
            return asInt(raw);
        case 'enum':
            return typeof raw === 'string' && t.domain?.kind === 'enum' && t.domain.literals.includes(raw) ? raw : undefined;
        case 'string':
            return typeof raw === 'string' ? raw : undefined;
    }
}

/** The least value of the type: what a feature with no slot and no default starts from. */
function least(t: Typed): SimValue {
    if (t.domain?.kind === 'range') return t.domain.min;
    if (t.domain?.kind === 'enum') return t.domain.literals[0];
    return t.kind === 'boolean' ? false : t.kind === 'integer' ? 0 : '';
}

/** The value of a slot: its first value specification read through the value kinds, or the holder as an attribute. */
function slotValue(view: DcnReadView, binding: OntoBinding, slot: string): unknown {
    if (binding.valueHolder === undefined) return undefined;
    const spec = view.referenceTargets(slot, binding.valueHolder)[0];
    if (spec === undefined) {
        const v = view.attributeValue(slot, binding.valueHolder);
        return Array.isArray(v) ? v[0] : v;
    }
    const meta = view.metaclassOf(spec);
    const vk = meta !== undefined ? (binding.valueKinds ?? []).find(k => view.conformsTo(meta, k.create)) : undefined;
    if (vk === undefined) return undefined;
    if (vk.when === 'instance') {
        const target = view.referenceTargets(spec, vk.field)[0];
        return target !== undefined ? view.nameOf(target) : undefined;
    }
    return view.attributeValue(spec, vk.field);
}

/** Feature to the raw value of its slot on `instance`; the first slot of a feature wins. */
function slotsOf(view: DcnReadView, binding: OntoBinding, instance: string): Map<string, unknown> {
    const out = new Map<string, unknown>();
    if (binding.slotContainer === undefined || binding.definingFeature === undefined) return out;
    for (const slot of view.referenceTargets(instance, binding.slotContainer)) {
        const feature = view.referenceTargets(slot, binding.definingFeature)[0];
        if (feature === undefined || out.has(feature)) continue;
        const v = slotValue(view, binding, slot);
        if (v !== undefined && v !== null) out.set(feature, v);
    }
    return out;
}

/** The DCN net of the model: see the module comment. */
export function compileDcn(input: DcnCompileInput): DcnCompiled {
    const { modelId, stc, binding, view } = input;
    const features = input.features ?? {};
    const transitions: NetTransition[] = [];
    const entries = new Map<string, DcnEntry>();
    const attributes: StateAttributeDecl[] = [];
    const declared = new Map<string, Map<string, StateAttributeDecl>>();
    const attrs = new Map<string, Map<string, SimValue>>();
    const slots = new Map<string, Map<string, DcnSlot>>();
    const unexportable: DcnUnexportable[] = [];
    const defects: DeclarationDefect[] = [];
    const used = new Set<string>([DCN_TICK_EVENT]);

    const isStatic = (classifier: string | undefined): classifier is string => {
        const meta = classifier !== undefined ? view.metaclassOf(classifier) : undefined;
        return meta !== undefined && view.conformsTo(meta, stc.staticClass);
    };

    const seed = (instance: string, classifier: string) => {
        const meta = view.metaclassOf(instance) ?? null;
        const { features: closure, dormantOwner } = featureClosure(view, binding, classifier);
        const values = slotsOf(view, binding, instance);
        const decls = new Map<string, StateAttributeDecl>();
        const sigma = new Map<string, SimValue>();
        const bySlot = new Map<string, DcnSlot>();
        for (const feature of closure) {
            const name = view.nameOf(feature);
            if (name === undefined) {
                defects.push({ index: null, name: null, code: 'record', message: 'a feature with no name', element: instance });
                continue;
            }
            if (decls.has(name)) {
                defects.push({ index: null, name, code: 'twice', message: `${name} declared twice`, element: instance });
                continue;
            }
            const t = typeOf(view, binding, features, feature);
            if (t.badBounds !== undefined) defects.push({ index: null, name, code: 'bounds', message: t.badBounds, element: instance });
            if (t.domain === null) {
                unexportable.push({ element: instance, attr: name, feature, reason: t.kind === 'integer' ? 'unbounded-integer' : 'no-domain' });
            }
            const fromDefault = binding.defaultValue !== undefined ? text(view.attributeValue(feature, binding.defaultValue)) : null;
            let value = values.has(feature) ? coerce(t, values.get(feature)) : fromDefault !== null ? coerce(t, fromDefault.trim()) : undefined;
            if (value === undefined) {
                const why = values.has(feature) ? 'the slot holds no value of its type' : fromDefault !== null ? 'the default is no value of its type' : 'no slot and no default';
                defects.push({ index: null, name, code: 'initial', message: why, element: instance });
                value = least(t);
            } else if (t.domain?.kind === 'range' && typeof value === 'number' && (value < t.domain.min || value > t.domain.max)) {
                defects.push({ index: null, name, code: 'initial', message: `initial ${value} outside ${t.domain.min}..${t.domain.max}`, element: instance });
            }
            const decl: StateAttributeDecl = { name, metaclass: meta, instance, space: 'semantic', domain: t.domain, initial: value };
            decls.set(name, decl);
            attributes.push(decl);
            sigma.set(name, value);
            bySlot.set(name, { feature, dormantOwner: dormantOwner?.[feature] ?? null });
        }
        declared.set(instance, decls);
        attrs.set(instance, sigma);
        slots.set(instance, bySlot);
    };

    const contribute = (kind: DcnEntry['kind'], instance: string, element: string, viewpoint: string | null, dynamicClass: string | null) => {
        const base = `dcn-${hash([kind, instance, viewpoint ?? '', element].join('\u0000'))}`;
        let id = base;
        for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
        used.add(id);
        const precondition = kind === 'invocation' && stc.precondition !== undefined ? text(view.attributeValue(element, stc.precondition)) : null;
        const body = (stc.body ?? []).flatMap(b => texts(view.attributeValue(element, b)));
        const inputs: InputRead[] = [];
        if (kind === 'invocation' && features.parameters !== undefined) {
            for (const p of view.referenceTargets(element, features.parameters)) {
                const attr = view.nameOf(p);
                const { domain } = typeOf(view, binding, features, p);
                if (attr !== undefined && domain !== null) inputs.push({ element: id, attr, domain });
                else defects.push({ index: null, name: attr ?? null, code: 'no-domain', message: 'an argument with no finite domain', element: id });
            }
        }
        entries.set(id, { id, kind, instance, element, viewpoint, dynamicClass, guard: { precondition, classifiedAs: dynamicClass }, body, inputs });
        transitions.push({
            id,
            origin: [instance, element],
            preset: [], postset: [], inhibitors: [],
            triggers: kind === 'tick' ? [DCN_TICK_EVENT] : [id],
            guardSites: precondition !== null ? [id] : [],
            elseOf: null,
            actionSites: body.length > 0 ? [{ element: id, role: 'transition' }] : [],
        });
    };

    for (const instance of view.objects()) {
        if (recordsFor(view, [binding], instance).length === 0) continue;
        const classifier = view.referenceTargets(instance, binding.typeReference)[0];
        if (!isStatic(classifier)) continue;
        seed(instance, classifier);
        for (const k of generalizationClosure(view, binding, classifier)) {
            for (const r of stc.operation ?? []) {
                for (const op of view.referenceTargets(k, r)) contribute('invocation', instance, op, null, null);
            }
            for (const vp of view.referenceTargets(k, stc.viewpoints)) {
                for (const dc of view.referenceTargets(vp, stc.dynamicClasses)) {
                    for (const r of stc.operation ?? []) {
                        for (const op of view.referenceTargets(dc, r)) contribute('invocation', instance, op, vp, dc);
                    }
                    if (stc.monitor === undefined) continue;
                    for (const mon of view.referenceTargets(dc, stc.monitor)) contribute('tick', instance, mon, vp, dc);
                }
            }
        }
    }

    const net: CompiledNet = {
        modelId,
        places: new Set(),
        transitions,
        bound: 1,
        final: null,
        hasEventRole: true,
        attributes,
        declared,
        initial: { marking: new Map(), attrs, presentation: new Map() },
        defects: [],
        declarationDefects: defects,
    };
    return { net, entries, slots, unexportable };
}
