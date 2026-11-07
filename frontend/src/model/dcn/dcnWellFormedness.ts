/**
 * dcnWellFormedness — the static checks of DCN (spec §5; R-DCN-3, R-DCN-13, R-DCN-16, R-DCN-17, R-DCN-23).
 *
 * From the resolved dcn roles (`dcnStcFromRoles`), the R-OI `object` binding and a read view of the class-level
 * model, the diagnostics below, every one an error. Visibility is strict (P-2026-11-07-1825, F2): the features a
 * dynamic class D of viewpoint V sees are those of the closure of the static class C that owns V (C and its
 * generals, `featureClosure` without feature sources) and the attributes of D; a name is resolved against them as
 * `dcnHandles.ts` resolves it, so an association end owned by the association is not reachable from `self` (F3).
 * `self.name`, `self.classifier` and `self.id` are members of every handle and always resolve.
 *
 * - W1: an invariant, a precondition, an operation body or a monitor of D reads, on `self`, only a visible feature,
 *   or an attribute of another dynamic class D' of the closure of C when the same expression holds the guard
 *   `self.in(V'::D')`. In an action the expression is its value (and the receiver of its target). A read of an end
 *   owned by an association that has another end typed by a class of the closure of C says so (R-DCN-24).
 * - W2: an expression of V that tests a class of V', on any receiver, is an edge V -> V', V' every viewpoint of
 *   the model so named; each viewpoint on a cycle, a self-loop included (spec §5), is an error.
 * - W3: an operation of D redefines at most one operation, an operation of the closure of C, with the same name
 *   and the same number of parameters.
 * - W4: a body (of an operation of D, of a monitor of D, of a static operation of C) assigns on `self` only a
 *   visible feature; a static operation sees the closure of C only.
 * - W6 (R-DCN-23): for every static class K, among the viewpoints and the static operations of the closure of K,
 *   two viewpoints never write the same property, and a static operation writes no property a viewpoint writes.
 *   Writes are the slot targets on `self` of every body, resolved to the feature; a diagnostic is on the writer.
 * - R-DCN-13: a range bound on a property whose type is not `Integer`, or `rangeMin` above `rangeMax`.
 * - R-DCN-16: a blank invariant. A second instance of an `isSingleton` class is an object-level check: not here.
 *
 * A text that does not parse is skipped: conformance parses the Expression and Action features already. A receiver
 * other than `self` is not typed, so its reads and writes are not judged; nor are the reads of a static operation,
 * which W1 does not name. W5 is lane L6.1. The generalization walk is a copy of `dcnCompile.ts` (the cleanup ticket
 * of L4.4 covers the copies). Pure: no React, no store.
 */

import { parseAction, parseExpressionStrict } from '../../jjel/parser';
import type { JjelExpression } from '../../jjel/types/ast';
import type { OntoBinding } from '../ontological/bindingCodec';
import { featureClosure } from '../ontological/bindingReader';
import type { DcnFeatures, DcnReadView } from '../simulation/dcn/dcnCompile';
import type { DcnStc } from '../simulation/dcn/dcnRoles';

export type DcnRule = 'W1' | 'W2' | 'W3' | 'W4' | 'W6' | 'R-DCN-13' | 'R-DCN-16';

export interface DcnDiagnostic {
    readonly rule: DcnRule;
    /** The M1 element it is about: a dynamic class, an operation, a monitor, a viewpoint or a property. */
    readonly element: string;
    readonly message: string;
    readonly severity: 'error';
    /** The other elements it names (the other writers, the redefined operation, the viewpoints of the cycle). */
    readonly related: readonly string[];
}

export interface DcnWellFormednessInput {
    readonly stc: DcnStc;
    readonly binding: OntoBinding;
    readonly view: DcnReadView;
    readonly features?: DcnFeatures;
    /** `Association.ownedEnds`: with it, W1 names a read of an end the association owns (R-DCN-24). */
    readonly associationEnds?: string;
}

/** Members of every DCN handle besides its slots (`dcnHandles.ts`). */
const HANDLE_MEMBERS = new Set(['name', 'classifier', 'id']);

interface Viewpoint { readonly id: string; readonly name: string; readonly owner: StaticClass; readonly classes: DynamicClass[] }
interface DynamicClass { readonly id: string; readonly name: string; readonly viewpoint: Viewpoint; readonly own: Map<string, string> }
interface StaticClass {
    readonly id: string;
    readonly name: string;
    /** The class and its generals that are static classes, level by level. */
    closure: string[];
    /** Feature name to id over the closure, own first; the first of a name wins. */
    readonly features: Map<string, string>;
    readonly viewpoints: Viewpoint[];
    readonly operations: string[];
}

/** One text of the model and where it sits. */
interface Site {
    readonly element: string;
    /** «The invariant of Flying», «The body of rampUp», for the messages. */
    readonly what: string;
    readonly text: string;
    readonly kind: 'expression' | 'action';
    readonly owner: StaticClass;
    /** `null` for a static operation. */
    readonly dc: DynamicClass | null;
}

interface Test { readonly viewpoint: string; readonly dynamicClass: string; readonly onSelf: boolean }

/** What one expression reads on `self` and the classes it tests. */
interface Facts { readonly reads: string[]; readonly tests: Test[] }

const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);

const texts = (v: unknown): string[] =>
    (Array.isArray(v) ? v : [v]).filter((x): x is string => text(x) !== null);

const asInt = (v: unknown): number | undefined => {
    if (typeof v === 'number' && Number.isInteger(v)) return v;
    if (typeof v === 'string' && /^-?\d+$/.test(v.trim())) return Number(v.trim());
    return undefined;
};

/** The classifier and its generals, level by level, each once (copy of `dcnCompile.ts`). */
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

const isSelf = (e: JjelExpression, shadowed: boolean): boolean => !shadowed && e.type === 'Identifier' && e.name === 'self';

/** The reads on `self` and the class tests of `e`; a lambda or quantifier variable named `self` hides it. */
function collect(e: JjelExpression | null | undefined, out: { reads: string[]; tests: Test[] }, shadowed = false): void {
    if (!e) return;
    const go = (x: JjelExpression | null | undefined, s = shadowed) => collect(x, out, s);
    switch (e.type) {
        case 'MemberAccess':
        case 'NullSafeMemberAccess':
            if (isSelf(e.object, shadowed)) out.reads.push(e.property);
            go(e.object);
            return;
        case 'ClassificationTest':
            out.tests.push({ viewpoint: e.viewpoint, dynamicClass: e.dynamicClass, onSelf: isSelf(e.object, shadowed) });
            go(e.object);
            return;
        case 'MethodCall':
        case 'NullSafeMethodCall':
            go(e.object);
            e.args.forEach(a => go(a));
            return;
        case 'FunctionCall': e.args.forEach(a => go(a)); return;
        case 'Binary': case 'NullCoalesce': case 'Implies': go(e.left); go(e.right); return;
        case 'Unary': go(e.operand); return;
        case 'IfThenElse': go(e.condition); go(e.thenBranch); go(e.elseBranch); return;
        case 'IsType': go(e.expression); return;
        case 'Lambda': go(e.body, shadowed || e.params.includes('self')); return;
        case 'ForAll': go(e.collection); go(e.filter, shadowed || e.variable === 'self'); go(e.projection, shadowed || e.variable === 'self'); return;
        case 'Exists': go(e.collection); go(e.predicate, shadowed || e.variable === 'self'); return;
        case 'WithDo': go(e.context); go(e.body); return;
        case 'IndexAccess': go(e.object); go(e.index); return;
        case 'StateAccess': go(e.object); return;
        case 'ArrayLiteral': e.elements.forEach(x => go(x)); return;
        case 'ObjectLiteral': e.entries.forEach(x => go(x.value)); return;
        case 'InterpolatedString': e.parts.forEach(p => { if (p.kind === 'expression') go(p.expr); }); return;
        default: return;
    }
}

/** The facts of a site and its write on `self`, or `null` when the text does not parse. */
function factsOf(site: Site): { facts: Facts; write: string | null } | null {
    const out = { reads: [] as string[], tests: [] as Test[] };
    if (site.kind === 'expression') {
        const parsed = parseExpressionStrict(site.text);
        if (parsed.errors.length > 0 || !parsed.expression) return null;
        collect(parsed.expression, out);
        return { facts: out, write: null };
    }
    const parsed = parseAction(site.text, { dcn: true });
    if (parsed.errors.length > 0 || !parsed.action) return null;
    const { target, value } = parsed.action;
    collect(value, out);
    collect(target.object, out);
    const write = target.type === 'SlotTarget' && isSelf(target.object, false) ? target.attribute : null;
    return { facts: out, write };
}

/** The diagnostics of the model: see the module comment. */
export function checkDcnWellFormedness(input: DcnWellFormednessInput): DcnDiagnostic[] {
    const { stc, binding, view } = input;
    const features = input.features ?? {};
    const out: DcnDiagnostic[] = [];
    const nameOf = (id: string) => view.nameOf(id) ?? id;
    const diag = (rule: DcnRule, element: string, message: string, related: readonly string[] = []) =>
        out.push({ rule, element, message, severity: 'error', related });
    const operationsOf = (owner: string) => (stc.operation ?? []).flatMap(r => view.referenceTargets(owner, r));
    /** The association that owns an end named `n` and has another end typed by a class of `closure` (R-DCN-24). */
    const associationOf = (n: string, closure: readonly string[]): string | undefined => {
        const ends = input.associationEnds;
        if (ends === undefined) return undefined;
        const typeOf = (e: string) => (binding.featureType !== undefined ? view.referenceTargets(e, binding.featureType)[0] : undefined);
        return view.objects().find(a => {
            const owned = view.referenceTargets(a, ends);
            return owned.some(e => view.nameOf(e) === n
                && owned.some(o => o !== e && closure.includes(typeOf(o) ?? '')));
        });
    };

    // ── the class level: static classes, their viewpoints and dynamic classes ──
    const statics = new Map<string, StaticClass>();
    const staticBinding: OntoBinding = { ...binding, featureSources: undefined };
    for (const id of view.objects()) {
        const meta = view.metaclassOf(id);
        if (meta === undefined || !view.conformsTo(meta, stc.staticClass)) continue;
        const sc: StaticClass = { id, name: nameOf(id), closure: [], features: new Map(), viewpoints: [], operations: operationsOf(id) };
        for (const f of featureClosure(view, staticBinding, id).features) {
            const n = view.nameOf(f);
            if (n !== undefined && !sc.features.has(n)) sc.features.set(n, f);
        }
        const dormantOwner = featureClosure(view, binding, id).dormantOwner ?? {};
        for (const vp of view.referenceTargets(id, stc.viewpoints)) {
            const v: Viewpoint = { id: vp, name: nameOf(vp), owner: sc, classes: [] };
            for (const dc of view.referenceTargets(vp, stc.dynamicClasses)) {
                const own = new Map<string, string>();
                for (const [f, owner] of Object.entries(dormantOwner)) {
                    const n = view.nameOf(f);
                    if (owner === dc && n !== undefined && !own.has(n)) own.set(n, f);
                }
                v.classes.push({ id: dc, name: nameOf(dc), viewpoint: v, own });
            }
            sc.viewpoints.push(v);
        }
        statics.set(id, sc);
    }
    for (const sc of statics.values()) sc.closure = generalizationClosure(view, binding, sc.id).filter(k => statics.has(k));
    const closureViewpoints = (sc: StaticClass) => sc.closure.flatMap(k => statics.get(k)!.viewpoints);
    const viewpoints = [...statics.values()].flatMap(sc => sc.viewpoints);

    // ── R-DCN-16: a blank invariant ──
    for (const v of viewpoints) {
        for (const dc of v.classes) {
            if (text(view.attributeValue(dc.id, stc.invariant)) === null) {
                diag('R-DCN-16', dc.id, `The invariant of ${dc.name} (viewpoint ${v.name}) is blank: every dynamic class needs one.`);
            }
        }
    }

    // ── R-DCN-13: range bounds ──
    if (features.rangeMin !== undefined || features.rangeMax !== undefined) {
        const seen = new Set<string>();
        const properties: Array<[string, string]> = [];
        for (const sc of statics.values()) {
            for (const f of binding.featureContainer !== undefined ? view.referenceTargets(sc.id, binding.featureContainer) : []) properties.push([f, sc.name]);
            for (const v of sc.viewpoints) for (const dc of v.classes) for (const f of dc.own.values()) properties.push([f, dc.name]);
        }
        for (const [p, ownerName] of properties) {
            if (seen.has(p)) continue;
            seen.add(p);
            const min = features.rangeMin !== undefined ? asInt(view.attributeValue(p, features.rangeMin)) : undefined;
            const max = features.rangeMax !== undefined ? asInt(view.attributeValue(p, features.rangeMax)) : undefined;
            if (min === undefined && max === undefined) continue;
            const label = `${ownerName}.${nameOf(p)}`;
            const type = binding.featureType !== undefined ? view.referenceTargets(p, binding.featureType)[0] : undefined;
            const typeName = type !== undefined ? view.nameOf(type) : undefined;
            if (typeName !== 'Integer') {
                diag('R-DCN-13', p, `${label} has a range bound but its type is ${typeName ?? 'unset'}: ranges apply to Integer properties only.`);
            } else if (min !== undefined && max !== undefined && min > max) {
                diag('R-DCN-13', p, `${label} has rangeMin ${min} above rangeMax ${max}.`);
            }
        }
    }

    // ── the sites: every invariant, precondition and body ──
    const sites: Site[] = [];
    const bodies = (element: string) => (stc.body ?? []).flatMap(b => texts(view.attributeValue(element, b)));
    for (const sc of statics.values()) {
        for (const op of sc.operations) {
            for (const t of bodies(op)) sites.push({ element: op, what: `The static operation ${nameOf(op)}`, text: t, kind: 'action', owner: sc, dc: null });
        }
        for (const v of sc.viewpoints) {
            for (const dc of v.classes) {
                const inv = text(view.attributeValue(dc.id, stc.invariant));
                if (inv !== null) sites.push({ element: dc.id, what: `The invariant of ${dc.name}`, text: inv, kind: 'expression', owner: sc, dc });
                for (const op of operationsOf(dc.id)) {
                    const pre = stc.precondition !== undefined ? text(view.attributeValue(op, stc.precondition)) : null;
                    if (pre !== null) sites.push({ element: op, what: `The precondition of ${nameOf(op)}`, text: pre, kind: 'expression', owner: sc, dc });
                    for (const t of bodies(op)) sites.push({ element: op, what: `The body of ${nameOf(op)}`, text: t, kind: 'action', owner: sc, dc });
                }
                for (const mon of stc.monitor !== undefined ? view.referenceTargets(dc.id, stc.monitor) : []) {
                    for (const t of bodies(mon)) sites.push({ element: mon, what: `The monitor ${nameOf(mon)}`, text: t, kind: 'action', owner: sc, dc });
                }
            }
        }
    }

    // ── W1, W4 per site; the W2 edges and the W6 writes gathered on the way ──
    const edges = new Map<string, Set<string>>();
    /** Viewpoint id (or `static:` and the operation id) to feature id to its writers. */
    const writes = new Map<string, Map<string, string[]>>();
    const noteWrite = (key: string, feature: string, writer: string) => {
        const byFeature = writes.get(key) ?? new Map<string, string[]>();
        writes.set(key, byFeature);
        const ws = byFeature.get(feature) ?? [];
        if (!ws.includes(writer)) ws.push(writer);
        byFeature.set(feature, ws);
    };
    const reported = new Set<string>();
    for (const site of sites) {
        const r = factsOf(site);
        if (r === null) continue;
        const { facts, write } = r;
        const { owner, dc } = site;
        const others = (n: string) => closureViewpoints(owner).flatMap(v => v.classes).filter(d => d !== dc && d.own.has(n));
        if (dc !== null) {
            for (const n of facts.reads) {
                if (HANDLE_MEMBERS.has(n) || owner.features.has(n) || dc.own.has(n)) continue;
                const holders = others(n);
                if (holders.some(d => facts.tests.some(t => t.onSelf && t.viewpoint === d.viewpoint.name && t.dynamicClass === d.name))) continue;
                const key = `${site.element}|${n}`;
                if (reported.has(key)) continue;
                reported.add(key);
                const h = holders[0];
                const a = h === undefined ? associationOf(n, owner.closure) : undefined;
                diag('W1', site.element, h !== undefined
                    ? `${site.what} reads ${n}, an attribute of ${h.name} (viewpoint ${h.viewpoint.name}), with no guard self.in(${h.viewpoint.name}::${h.name}) in the same expression.`
                    : a !== undefined
                        ? `${n} is owned by the association ${nameOf(a)}, so it is not navigable from self: own it on ${owner.name} (R-DCN-24)`
                        : `${site.what} reads ${n}, which is no feature of ${owner.name} or of ${dc.name}.`);
            }
            const from = edges.get(dc.viewpoint.id) ?? new Set<string>();
            edges.set(dc.viewpoint.id, from);
            for (const t of facts.tests) for (const v of viewpoints) if (v.name === t.viewpoint) from.add(v.id);
        }
        if (write === null) continue;
        const feature = owner.features.get(write) ?? dc?.own.get(write);
        if (feature === undefined) {
            const h = others(write)[0];
            const visible = dc !== null ? `${owner.name} or of ${dc.name}` : owner.name;
            diag('W4', site.element, h !== undefined
                ? `${site.what} assigns ${write}, an attribute of ${h.name}: a body assigns only the features of ${visible}.`
                : `${site.what} assigns ${write}, which is no feature of ${visible}.`);
            continue;
        }
        noteWrite(dc !== null ? dc.viewpoint.id : `static:${site.element}`, feature, site.element);
    }

    // ── W3: redefinitions ──
    if (stc.redefines !== undefined) {
        const redefines = stc.redefines;
        const params = (op: string) => (features.parameters !== undefined ? view.referenceTargets(op, features.parameters).length : 0);
        for (const v of viewpoints) {
            const inherited = v.owner.closure.flatMap(k => statics.get(k)!.operations);
            for (const dc of v.classes) {
                for (const op of operationsOf(dc.id)) {
                    const targets = view.referenceTargets(op, redefines);
                    const name = nameOf(op);
                    if (targets.length > 1) {
                        diag('W3', op, `${name} of ${dc.name} redefines ${targets.length} operations: an operation redefines at most one.`, targets);
                    }
                    for (const t of targets) {
                        const tName = nameOf(t);
                        if (!inherited.includes(t)) {
                            diag('W3', op, `${name} of ${dc.name} redefines ${tName}, which is no operation of ${v.owner.name}.`, [t]);
                        } else if (tName !== name) {
                            diag('W3', op, `${name} of ${dc.name} redefines ${tName}: a redefinition has the name of the operation it redefines.`, [t]);
                        } else if (params(op) !== params(t)) {
                            diag('W3', op, `${name} of ${dc.name} has ${params(op)} parameters and redefines ${tName} of ${v.owner.name}, which has ${params(t)}.`, [t]);
                        }
                    }
                }
            }
        }
    }

    // ── W2: each viewpoint on a cycle of class tests ──
    /** The shortest path of edges from `from` back to itself, both ends included, or `null`. */
    const cycleFrom = (from: string): string[] | null => {
        const prev = new Map<string, string>();
        const queue: string[] = [];
        for (const n of edges.get(from) ?? []) { prev.set(n, from); queue.push(n); }
        for (let i = 0; i < queue.length; i++) {
            const n = queue[i];
            if (n === from) {
                const path = [from];
                for (let p = prev.get(from)!; p !== from; p = prev.get(p)!) path.unshift(p);
                return [from, ...path];
            }
            for (const m of edges.get(n) ?? []) if (!prev.has(m)) { prev.set(m, n); queue.push(m); }
        }
        return null;
    };
    for (const v of viewpoints) {
        const cycle = cycleFrom(v.id);
        if (cycle === null) continue;
        diag('W2', v.id, `Viewpoint ${v.name} is on a cycle of class tests: ${cycle.map(nameOf).join(' -> ')}. The dependencies between viewpoints are acyclic.`,
            cycle.slice(1, -1));
    }

    // ── W6: write ownership, per static class over the closure ──
    const w6 = new Map<string, { element: string; feature: string; isStatic: boolean; viewpoints: Set<string>; writers: Set<string> }>();
    const note = (element: string, feature: string, isStatic: boolean, others: Array<[string, string[]]>) => {
        const key = `${element}|${feature}`;
        const e = w6.get(key) ?? { element, feature, isStatic, viewpoints: new Set<string>(), writers: new Set<string>() };
        w6.set(key, e);
        for (const [vp, ws] of others) { e.viewpoints.add(vp); ws.forEach(w => e.writers.add(w)); }
    };
    for (const k of statics.values()) {
        const byFeature = new Map<string, Map<string, string[]>>();
        for (const v of closureViewpoints(k)) {
            for (const [f, ws] of writes.get(v.id) ?? []) {
                const m = byFeature.get(f) ?? new Map<string, string[]>();
                byFeature.set(f, m);
                m.set(v.id, ws);
            }
        }
        for (const [f, byVp] of byFeature) {
            if (byVp.size < 2) continue;
            for (const [vp, ws] of byVp) {
                const others = [...byVp].filter(([o]) => o !== vp);
                for (const w of ws) note(w, f, false, others);
            }
        }
        for (const op of k.closure.flatMap(c => statics.get(c)!.operations)) {
            for (const f of (writes.get(`static:${op}`) ?? new Map()).keys()) {
                const byVp = byFeature.get(f);
                if (byVp !== undefined) note(op, f, true, [...byVp]);
            }
        }
    }
    for (const e of w6.values()) {
        const vps = [...e.viewpoints].map(nameOf).join(', ');
        const ws = [...e.writers].map(nameOf).join(', ');
        const f = nameOf(e.feature);
        diag('W6', e.element, e.isStatic
            ? `The static operation ${nameOf(e.element)} writes ${f}, which viewpoint ${vps} writes (${ws}): a static operation writes only properties no viewpoint writes.`
            : `${nameOf(e.element)} writes ${f}, which viewpoint ${vps} also writes (${ws}): two viewpoints never write the same property.`,
            [...e.writers]);
    }
    return out;
}
