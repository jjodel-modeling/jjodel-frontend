/**
 * dcnHandles — σ-backed handles and the classification accessor of the DCN
 * nucleus (R-DCN-2, R-DCN-3, R-DCN-7, R-DCN-12, R-DCN-17; discovery 2026-11-06 §3.4).
 *
 * On the R-OI level an instance is an `InstanceSpecification`: its pool handle
 * in the snapshot carries `classifier` and `slots`, so `self.battery` is an
 * absent name there. The DCN nucleus binds `self`, and every instance by name,
 * to a handle built from σ instead, at each evaluation of σ.
 *
 * Two lifetimes, as in guardContext.ts. `readDcnModel` runs once per run over
 * the compile input: per instance, its name, its classifier, the viewpoints of
 * its generalization closure by name (R-DCN-17) with their dynamic classes and
 * parsed invariants, and its links. `bindDcn` runs per σ: one frozen handle per
 * instance and one classification accessor, whose memo lives as long as that σ.
 *
 * - A handle: `id`, `name`, `classifier` (the classifier's pool handle), then
 *   one member per attribute of σ for the instance, own, inherited and dormant
 *   alike (W1 is static, R-DCN-3); a feature named `name` or `classifier` hides
 *   those two, `id` is never hidden.
 * - A link: a feature typed by a static class. Links are fixed (spec §6), so
 *   they are read from the model's slots, not from σ, where compileDcn keeps the
 *   first target's name; the member is the linked handle, or a list of them
 *   unless the feature's upper bound (`options.upper`) reads 1. A target that is
 *   no DCN instance is left out.
 * - `isIn(o, V, D)`: the invariant of D evaluated with `self` the handle of `o`,
 *   the named handles and `model`, `event` null (a classification is a function
 *   of σ alone, R-DCN-2), memoized per (instance, dynamic class). An unknown
 *   viewpoint or class, a missing or unparsable invariant, an absent name, a
 *   non-boolean and a cycle of classification reads (W2 violated) throw, so the
 *   tri-state of the expression that asked reports `exception`.
 * - A name two instances share binds neither: the snapshot's binding of it stays.
 *
 * Generalization is followed as in dcnCompile.ts `generalizationClosure`, which
 * that module does not export. Pure: JjEL, no React, no store.
 */

import { JjelEvaluator } from '../../../jjel/evaluator';
import type { JjelValue } from '../../../jjel/evaluator';
import type { JjelClassificationAccess } from '../../../jjel/evaluator/context';
import { parseExpressionStrict } from '../../../jjel/parser';
import type { JjelExpression } from '../../../jjel/types/ast';
import { describeType, firstAbsence } from '../../jjelTriState';
import type { OntoBinding } from '../../ontological/bindingCodec';
import type { SimDcnBinding, SimSnapshot } from '../guardContext';
import type { SimState } from '../netTypes';
import type { DcnCompileInput, DcnCompiled, DcnReadView } from './dcnCompile';

export interface DcnModelOptions {
    /** M2 feature id of a property's upper bound: a link whose bound reads 1 is one handle, else a list. */
    readonly upper?: string;
}

/** A dynamic class as `isIn` finds it. */
export interface DcnDynamicClass {
    readonly id: string;
    readonly viewpoint: string;
    readonly name: string;
    /** `null` with `problem` set when the invariant is missing or does not parse. */
    readonly invariant: JjelExpression | null;
    readonly problem: string | null;
}

export interface DcnLink {
    readonly targets: readonly string[];
    readonly many: boolean;
}

export interface DcnInstance {
    readonly id: string;
    readonly name: string;
    readonly classifier: string;
    /** Viewpoint name to dynamic class name to the class; the nearest classifier wins a name. */
    readonly viewpoints: ReadonlyMap<string, ReadonlyMap<string, DcnDynamicClass>>;
    /** Attribute name to the instances it links. */
    readonly links: ReadonlyMap<string, DcnLink>;
}

/** What `bindDcn` needs of the model, read once per run. */
export interface DcnModel {
    readonly compiled: DcnCompiled;
    readonly instances: ReadonlyMap<string, DcnInstance>;
}

/** The handles and the accessor over one σ (SimDcnBinding, guardContext.ts). */
export interface DcnBinding extends SimDcnBinding {
    /** Instance id to its handle. */
    readonly handles: ReadonlyMap<string, JjelValue>;
}

/** A classification cannot be answered: see the module comment. */
export class DcnClassificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DcnClassificationError';
    }
}

const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);

const asInt = (v: unknown): number | undefined => {
    if (typeof v === 'number' && Number.isInteger(v)) return v;
    if (typeof v === 'string' && /^-?\d+$/.test(v.trim())) return Number(v.trim());
    return undefined;
};

/** The classifier and its generals, level by level, each once (as dcnCompile.ts). */
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

/** The instances the first slot of `feature` on `instance` holds through instance values. */
function linkTargets(view: DcnReadView, binding: OntoBinding, instance: string, feature: string): string[] {
    if (binding.slotContainer === undefined || binding.definingFeature === undefined || binding.valueHolder === undefined) return [];
    const definingFeature = binding.definingFeature;
    const slot = view.referenceTargets(instance, binding.slotContainer)
        .find(s => view.referenceTargets(s, definingFeature)[0] === feature);
    if (slot === undefined) return [];
    const out: string[] = [];
    for (const spec of view.referenceTargets(slot, binding.valueHolder)) {
        const meta = view.metaclassOf(spec);
        const vk = meta !== undefined ? (binding.valueKinds ?? []).find(k => view.conformsTo(meta, k.create)) : undefined;
        if (vk?.when !== 'instance') continue;
        const target = view.referenceTargets(spec, vk.field)[0];
        if (target !== undefined) out.push(target);
    }
    return out;
}

function dynamicClass(view: DcnReadView, invariantFeature: string, vpName: string, id: string, name: string): DcnDynamicClass {
    const source = text(view.attributeValue(id, invariantFeature));
    if (source === null) return { id, viewpoint: vpName, name, invariant: null, problem: 'it has no invariant' };
    const parsed = parseExpressionStrict(source);
    if (parsed.errors.length > 0 || !parsed.expression) {
        const e = parsed.errors[0];
        return { id, viewpoint: vpName, name, invariant: null, problem: e ? `its invariant does not parse at ${e.line}:${e.column}: ${e.message}` : 'its invariant does not parse' };
    }
    return { id, viewpoint: vpName, name, invariant: parsed.expression, problem: null };
}

/** Once per run: the instances of `compiled`, their viewpoints, invariants and links. */
export function readDcnModel(input: DcnCompileInput, compiled: DcnCompiled, options: DcnModelOptions = {}): DcnModel {
    const { stc, binding, view } = input;
    const isStatic = (classifier: string | undefined): boolean => {
        const meta = classifier !== undefined ? view.metaclassOf(classifier) : undefined;
        return meta !== undefined && view.conformsTo(meta, stc.staticClass);
    };
    const instances = new Map<string, DcnInstance>();
    for (const [id, slots] of compiled.slots) {
        const classifier = view.referenceTargets(id, binding.typeReference)[0];
        if (classifier === undefined) continue;
        const viewpoints = new Map<string, Map<string, DcnDynamicClass>>();
        for (const k of generalizationClosure(view, binding, classifier)) {
            for (const vp of view.referenceTargets(k, stc.viewpoints)) {
                const vpName = view.nameOf(vp);
                if (vpName === undefined || viewpoints.has(vpName)) continue;
                const classes = new Map<string, DcnDynamicClass>();
                for (const dc of view.referenceTargets(vp, stc.dynamicClasses)) {
                    const name = view.nameOf(dc);
                    if (name !== undefined && !classes.has(name)) classes.set(name, dynamicClass(view, stc.invariant, vpName, dc, name));
                }
                viewpoints.set(vpName, classes);
            }
        }
        const links = new Map<string, DcnLink>();
        for (const [attr, slot] of slots) {
            const type = binding.featureType !== undefined ? view.referenceTargets(slot.feature, binding.featureType)[0] : undefined;
            if (!isStatic(type)) continue;
            const targets = linkTargets(view, binding, id, slot.feature).filter(t => compiled.slots.has(t));
            const upper = options.upper !== undefined ? asInt(view.attributeValue(slot.feature, options.upper)) : undefined;
            links.set(attr, { targets, many: upper !== 1 });
        }
        instances.set(id, { id, name: view.nameOf(id) ?? id, classifier, viewpoints, links });
    }
    return { compiled, instances };
}

/** Path B, as for guards and outputs: no context at construction. */
const EVALUATOR = new JjelEvaluator();

/** Per σ: a frozen handle per instance, the named handles, and the classification accessor over them. */
export function bindDcn(model: DcnModel, state: Pick<SimState, 'attrs'>, snapshot: SimSnapshot): DcnBinding {
    const handles = new Map<string, Record<string, JjelValue>>();
    const idOf = new Map<unknown, string>();
    for (const info of model.instances.values()) {
        const h: Record<string, JjelValue> = { __type: 'Object', id: info.id, name: info.name, classifier: snapshot.handleById.get(info.classifier) ?? null };
        const sigma = state.attrs.get(info.id);
        for (const attr of model.compiled.slots.get(info.id)?.keys() ?? []) h[attr] = sigma?.get(attr) ?? null;
        handles.set(info.id, h);
        idOf.set(h, info.id);
    }
    for (const info of model.instances.values()) {
        const h = handles.get(info.id)!;
        for (const [attr, link] of info.links) {
            const linked = link.targets.map(t => handles.get(t)!);
            h[attr] = link.many ? linked : linked[0] ?? null;
        }
        h.id = info.id;
        h.__type = 'Object';
    }
    for (const h of handles.values()) {
        for (const v of Object.values(h)) if (Array.isArray(v)) Object.freeze(v);
        Object.freeze(h);
    }

    const named: Record<string, JjelValue> = {};
    const shared = new Set<string>();
    for (const info of model.instances.values()) {
        if (shared.has(info.name)) continue;
        if (info.name in named) {
            delete named[info.name];
            shared.add(info.name);
            continue;
        }
        named[info.name] = handles.get(info.id)!;
    }
    Object.freeze(named);

    const memo = new Map<string, boolean>();
    const asking: Array<{ key: string; label: string }> = [];

    const classification: JjelClassificationAccess = {
        isIn(object, viewpoint, dynamicClassName) {
            const id = idOf.get(object);
            if (id === undefined) throw new DcnClassificationError(`${viewpoint}::${dynamicClassName}: the receiver is not a DCN instance`);
            const info = model.instances.get(id)!;
            const label = `${info.name} in ${viewpoint}::${dynamicClassName}`;
            const classes = info.viewpoints.get(viewpoint);
            if (classes === undefined) {
                throw new DcnClassificationError(`${label}: ${info.name} has no viewpoint ${viewpoint}, on its classifier or on a general of it`);
            }
            const dc = classes.get(dynamicClassName);
            if (dc === undefined) throw new DcnClassificationError(`${label}: viewpoint ${viewpoint} has no dynamic class ${dynamicClassName}`);
            const key = `${id}\u0000${dc.id}`;
            const known = memo.get(key);
            if (known !== undefined) return known;
            const at = asking.findIndex(a => a.key === key);
            if (at >= 0) {
                const cycle = [...asking.slice(at).map(a => a.label), label].join(' -> ');
                throw new DcnClassificationError(`a cycle of classification reads (W2): ${cycle}`);
            }
            if (dc.invariant === null) throw new DcnClassificationError(`${label}: ${dc.problem}`);
            asking.push({ key, label });
            let answer: boolean;
            try {
                const ctx = snapshot.base.child({ ...named, self: handles.get(id)!, event: null, model: snapshot.model });
                ctx.classification = classification;
                const out = EVALUATOR.evaluateWithDiagnostics(dc.invariant, ctx);
                const absent = firstAbsence(out.warnings);
                if (absent) throw new DcnClassificationError(`${label}: the invariant reads '${absent.identifier}', which does not exist`);
                if (typeof out.value !== 'boolean') throw new DcnClassificationError(`${label}: the invariant is ${describeType(out.value)}, not a boolean`);
                answer = out.value;
            } finally {
                asking.pop();
            }
            memo.set(key, answer);
            return answer;
        },
    };

    return {
        handles,
        named,
        classification,
        selfOf: site => handles.get(model.compiled.entries.get(site)?.instance ?? site),
    };
}
