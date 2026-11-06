/**
 * access — the target profile a template reads, `target` in its context, for JavaScript (R-GEN-6, R-GEN-16
 * provisional, P-2026-10-10-2029; spec 2026-10-10 §6, §8).
 *
 * A template reaches the printer of the target profile through this value, next to `stc` (generate.ts). It is the
 * active target, JavaScript in the pilot, so a later target plugs in under the same name:
 * - `name`: `'javascript'`;
 * - `runtime`: the helpers the printed code calls (`JS_RUNTIME`), declared once at the top of a generated program;
 * - `ids`: the declaration of the program's `$ID` table (R-GEN-17, identifiers.ts `elementIdTable`), the model and
 *   then every object of the model in model order, each id once, declared once near the top of a generated program;
 * - `ref(element)`: the expression naming one element of the table, `$ID.<name>`, for an id or an object that
 *   carries one (`id`, else `element`); an element the table does not hold throws;
 * - `initial`: the initial σ the simulator compiles for the model, as a JavaScript literal over the state of
 *   R-GEN-11 (`toJsState`: marking, semantic attributes, derived values, keyed by model id), its element keys
 *   computed from `$ID` (`{ marking: { [$ID.ready]: 1 }, … }`), not JSON;
 * - `net`: the compiled net as data: places and transitions with their arcs, triggers, the guard and action sites
 *   that carry a guard or an action, `else` siblings, the bound, the final places, the declarations and the derived
 *   attributes in their order;
 * - `guard(site)`: a JavaScript expression over `state` and `event` whose value is the simulator's outcome of the
 *   site's guards, `{ kind: 'true' | 'false' | 'defect' }` (several Guard attributes conjoined as the bridge
 *   conjoins them, R-SIM-90);
 * - `actions(site)`: the body of a function over `state` and `event` that returns the next state, the printer's
 *   own (`printActions`), for an action site `{element, role}` or an element id (role `transition`);
 * - `equation(d)`: a JavaScript expression over `state` for a derived attribute `{element, attr}` of `net.derived`.
 * Guards, actions and equations name their elements through the `$ID` table, so a program that interpolates
 * `ids` once and these everywhere else writes each element id exactly once.
 * A guard, an action or an equation the printer refuses throws its refusal: the hole is an error fragment and
 * «Run» is refused while it stands (origin.ts).
 *
 * The compilation is the run the simulator would start (simBridge.ts `startRun`), rebuilt from the core:
 * `compileModelRun` gives the STC, the net with its declarations and derived initial values, the snapshot of M
 * frozen from the caller's `buildEvalContext` record, and the compiled guards and actions, for this module and
 * for the oracle (codegen/oracle/oracle.ts). `collectModelObjectIds`, `runBag`, `modelRunBag`, `storedProfile`,
 * `guardTexts`, `siteTexts`, `compileGuards` and `compileActionTable` are copied from simBridge.ts and
 * simRoleStatus.ts, reduced, because the bridge imports the run singleton and, through it, React (the stcAccess.ts
 * precedent, U8); `__tests__/access.test.ts` compares the run with the bridge's own.
 *
 * Freezing the snapshot freezes the record's objects in place, as Reset does: a generation reads them only.
 *
 * Pure: JjEL, the simulator's core and the printer.
 */

import { createFunction } from '../../../jjel';
import type { JjelValue } from '../../../jjel';
import { actionSiteKey, compileActions } from '../../../model/simulation/actionEvaluator';
import type { CompiledAction } from '../../../model/simulation/actionEvaluator';
import { compileDerived, makeDerivedOracle } from '../../../model/simulation/derivedEvaluator';
import type { CompiledDerived } from '../../../model/simulation/derivedEvaluator';
import { SimSnapshotError, freezeSnapshot } from '../../../model/simulation/guardContext';
import { isBitVector } from '../../../jjel/evaluator/context';
import type { SimSnapshot } from '../../../model/simulation/guardContext';
import { compileGuard } from '../../../model/simulation/guardEvaluator';
import type { CompiledGuard } from '../../../model/simulation/guardEvaluator';
import { isKindOf } from '../../../model/simulation/isKindOf';
import { compileNet, featuresOf, netStcFromRoles, withDerivedEventRole, withDerivedInitial } from '../../../model/simulation/netCompile';
import type {
    ActionSite, CompiledNet, DerivedOracle, NetModelView, NetStc, StateAttributeDecl,
} from '../../../model/simulation/netTypes';
import { objectReferences, objectSlotValues } from '../../../model/simulation/objectSlots';
import { decodeProfile, inferCustomProfile } from '../../../model/simulation/profileCodec';
import { ROLE_CATALOG } from '../../../model/simulation/roleCatalog';
import type { SimProfile } from '../../../model/simulation/simProfiles';
import { STATE_ATTRIBUTES_KEY, decodeStateAttributes, mergeDeclarations } from '../../../model/simulation/stateAttributesCodec';
import { elementIdTable, jsString } from './identifiers';
import type { JsElement, JsIdTable } from './identifiers';
import { JS_RUNTIME, bitVectorLiteral, printActions, printGuard, toJsState } from './printer';
import type { JsPrintContext, JsState } from './printer';

type Lookup = Record<string, any>;

/** The name of this target profile. */
export const JS_TARGET_NAME = 'javascript';

/** The run of a model as the simulator starts it at Reset, rebuilt from the core. */
export interface ModelRun {
    readonly stc: NetStc;
    readonly net: CompiledNet;
    readonly snapshot: SimSnapshot;
    /** The guards of each guard site, one per Guard attribute it carries (simBridge.ts `compileGuards`). */
    readonly guards: ReadonlyMap<string, readonly CompiledGuard[]>;
    /** The actions of each action site, by `actionSiteKey`; empty without an action role. */
    readonly actions: ReadonlyMap<string, readonly CompiledAction[]>;
    /** An action role is bound: without one a step moves the marking only (R-SIM-69). */
    readonly actionRoles: boolean;
    readonly equations: CompiledDerived;
    /** Only when a derived attribute is declared (R-SIM-73). */
    readonly derived?: DerivedOracle;
}

export type ModelRunResult =
    | { readonly kind: 'ok'; readonly run: ModelRun }
    | { readonly kind: 'refused'; readonly reason: string };

/** The `simProfile` key of the bag (R-SIM-55). */
const PROFILE_KEY = 'simProfile';

/** Copy of simBridge.ts `collectModelObjectIds`: the DObjects whose `father` chain reaches the model. */
function collectModelObjectIds(lookup: Lookup, modelId: string): string[] {
    const ids: string[] = [];
    for (const id in lookup) {
        const d = lookup[id];
        if (!d || d.className !== 'DObject') continue;
        let owner: any = d;
        let depth = 0;
        while (owner && owner.className !== 'DModel' && depth++ < 40) {
            const fatherId = typeof owner.father === 'string' ? owner.father : null;
            owner = fatherId ? lookup[fatherId] : null;
        }
        if (owner?.id === modelId) ids.push(id);
    }
    return ids;
}

/** Copy of simRoleStatus.ts `storedProfile`, the profile alone: `simProfile` decoded, else «Custom» from the bag. */
function storedProfile(bag: Readonly<Record<string, unknown>>): SimProfile {
    const raw = bag[PROFILE_KEY];
    const profile = raw === undefined || raw === null || raw === '' ? null : decodeProfile(raw);
    return profile ?? inferCustomProfile(bag).profile;
}

/** Copy of simBridge.ts `runBag`: the keys of the roles the profile turns off dropped, the event derived. */
function runBag(raw: Record<string, unknown>, lookup: Lookup): Record<string, unknown> {
    const profile = storedProfile(raw);
    const bag: Record<string, unknown> = { ...raw };
    for (const d of ROLE_CATALOG) if (d.key !== null && profile.modes[d.id].mode === 'off') delete bag[d.key];
    const derived = withDerivedEventRole(bag, lookup);
    if (profile.modes.event.mode === 'off') delete derived.simEvent;
    return derived;
}

/** Copy of simBridge.ts `modelRunBag`: the model's `sim*` keys, its declarations dropped when the profile turns them off. */
function modelRunBag(lookup: Lookup, modelId: string, configRaw: Record<string, unknown> | undefined): Record<string, unknown> {
    const own = lookup[modelId]?._state;
    const bag: Record<string, unknown> = {};
    if (!own || typeof own !== 'object') return bag;
    for (const key of Object.keys(own)) if (key.startsWith('sim')) bag[key] = own[key];
    if (storedProfile(configRaw ?? {}).modes.stateAttributes.mode === 'off') delete bag[STATE_ATTRIBUTES_KEY];
    return bag;
}

/** Copy of simBridge.ts `makeNetModelView`, without the label: what `compileNet` reads. */
function netModelView(lookup: Lookup): NetModelView {
    return {
        exists: id => !!lookup[id],
        isInstanceOf: (id, classId) => isKindOf(lookup, id, classId),
        outgoingTransitions: () => [],
        transitionTarget: () => null,
        references: (objectId, featureId) => objectReferences(lookup, objectId, featureId),
        values: (objectId, featureId) => objectSlotValues(lookup, objectId, featureId),
    };
}

/** Copy of simBridge.ts `guardTexts`: the first value of each Guard feature of the site, blanks and `else` left out. */
function guardTexts(lookup: Lookup, site: string, features: readonly string[]): string[] {
    const out: string[] = [];
    for (const feature of features) {
        const value = objectSlotValues(lookup, site, feature)[0];
        if (value === undefined) continue;
        const text = String(value);
        if (text.trim() !== '' && text.trim() !== 'else') out.push(text);
    }
    return out;
}

/** Copy of simBridge.ts `compileGuards`: per guard site, one compiled guard per Guard attribute it carries. */
function compileGuards(net: CompiledNet, stc: NetStc, lookup: Lookup): Map<string, CompiledGuard[]> {
    const out = new Map<string, CompiledGuard[]>();
    const features = featuresOf(stc, 'guard');
    if (features.length === 0) return out;
    for (const t of net.transitions) {
        for (const site of t.guardSites) {
            if (out.has(site)) continue;
            out.set(site, guardTexts(lookup, site, features).map(text => compileGuard(text)));
        }
    }
    return out;
}

/** Copy of simBridge.ts `siteTexts`: a value that is not a string is still an action, its text a defect. */
function siteTexts(lookup: Lookup, element: string, features: readonly string[]): Array<string | undefined> {
    return features.flatMap(f => objectSlotValues(lookup, element, f)).map(v => (v === undefined || v === null ? undefined : String(v)));
}

/** Copy of simBridge.ts `compileActionTable`: the actions of every action site, by `actionSiteKey`. */
function compileActionTable(net: CompiledNet, stc: NetStc, lookup: Lookup): Map<string, CompiledAction[]> {
    const out = new Map<string, CompiledAction[]>();
    for (const t of net.transitions) {
        for (const site of t.actionSites) {
            const key = actionSiteKey(site);
            const role = featuresOf(stc, site.role === 'transition' ? 'action' : site.role);
            if (out.has(key) || role.length === 0) continue;
            const list = compileActions(siteTexts(lookup, site.element, role));
            if (list.length > 0) out.set(key, list);
        }
    }
    return out;
}

/**
 * The run of the M1 model `modelId` as Reset starts it (simBridge.ts `startRun`), over `globals`, the record
 * `buildEvalContext` returns for the model. Refused when the roles do not make an STC or M cannot be frozen.
 */
export function compileModelRun(lookup: Lookup, modelId: string, globals: Record<string, JjelValue>): ModelRunResult {
    const configModelId = lookup[modelId]?.instanceof;
    const raw = typeof configModelId === 'string' ? lookup[configModelId]?._state : undefined;
    const bag = raw && typeof raw === 'object' ? runBag(raw, lookup) : undefined;
    const stc = netStcFromRoles(bag);
    if (!stc || !bag) return { kind: 'refused', reason: 'The simulation roles are incomplete.' };
    const ids = collectModelObjectIds(lookup, modelId);
    const stored = bag[STATE_ATTRIBUTES_KEY];
    const declarations = decodeStateAttributes(stored === undefined || stored === null ? undefined : String(stored));
    const own = modelRunBag(lookup, modelId, raw)[STATE_ATTRIBUTES_KEY];
    const modelDeclarations = decodeStateAttributes(own === undefined || own === null ? undefined : String(own));
    const merged = mergeDeclarations(declarations, modelDeclarations);
    const plain = compileNet(stc, netModelView(lookup), modelId, ids, merged.decls);
    let snapshot: SimSnapshot;
    try {
        snapshot = freezeSnapshot(globals, { id: modelId, name: String(lookup[modelId]?.name ?? '') });
    } catch (e) {
        if (e instanceof SimSnapshotError) return { kind: 'refused', reason: `The model cannot be frozen: ${e.message}.` };
        throw e;
    }
    const equations = compileDerived(plain.attributes, { snapshot, net: plain });
    const derived = plain.attributes.some(d => d.equation !== undefined) ? makeDerivedOracle(snapshot, plain, equations) : undefined;
    const net = derived ? withDerivedInitial(plain, derived, equations.defects) : plain;
    const actionRoles = !!(stc.action || stc.entry || stc.exit);
    return {
        kind: 'ok',
        run: {
            stc, net, snapshot, actionRoles, equations,
            guards: compileGuards(net, stc, lookup),
            actions: actionRoles ? compileActionTable(net, stc, lookup) : new Map(),
            ...(derived ? { derived } : {}),
        },
    };
}

/**
 * The derived semantic attributes of the run, in the order the derived oracle evaluates them
 * (derivedEvaluator.ts `makeDerivedOracle`: the plan over M, else the order by name on every element whose
 * declaration it is). Presentation is left out: the generated state holds none (R-GEN-11).
 */
export function derivedPlan(run: ModelRun): Array<{ element: string; attr: string; decl: StateAttributeDecl; expr: CompiledDerived['order'][number]['expr'] }> {
    const plan: Array<{ eq: CompiledDerived['order'][number]; owner: string }> = run.equations.plan ? [...run.equations.plan] : [];
    if (!run.equations.plan) {
        for (const eq of run.equations.order) {
            for (const [owner, byName] of run.net.declared) if (byName.get(eq.decl.name) === eq.decl) plan.push({ eq, owner });
        }
    }
    return plan
        .filter(p => p.eq.decl.space === 'semantic')
        .map(p => ({ element: p.owner, attr: p.eq.decl.name, decl: p.eq.decl, expr: p.eq.expr }));
}

/** The elements a generated program names (R-GEN-17): the model, then every object of the model in model order. */
function modelElements(lookup: Lookup, modelId: string): JsElement[] {
    const metaclass = (id: string): string => {
        const name = lookup[lookup[id]?.instanceof]?.name;
        return typeof name === 'string' && name !== '' ? name : 'Object';
    };
    return [
        { id: modelId, name: lookup[modelId]?.name, metaclass: 'Model' },
        ...collectModelObjectIds(lookup, modelId).map(id => ({ id, name: lookup[id]?.name, metaclass: metaclass(id) })),
    ];
}

/** `{ k: v, … }`, or `{}`. */
function objectLiteral(entries: ReadonlyArray<readonly [string, string]>): string {
    return entries.length === 0 ? '{}' : `{ ${entries.map(([k, v]) => `${k}: ${v}`).join(', ')} }`;
}

/** A property key: bare when it is an identifier, computed for `__proto__` (a literal would set the prototype), else quoted. */
function propertyKey(k: string): string {
    if (k === '__proto__') return `[${jsString(k)}]`;
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : jsString(k);
}

/**
 * A value of σ as a JavaScript literal: the value `JSON.parse` gave back from `JSON.stringify`, strings in single
 * quotes; a bit-vector as the call that rebuilds it, `$bv(8, false, 0xffn)` (R-BV-9).
 */
export function valueLiteral(v: unknown): string {
    if (typeof v === 'string') return jsString(v);
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'null';
    if (typeof v === 'boolean') return String(v);
    if (isBitVector(v)) return bitVectorLiteral(v);
    if (Array.isArray(v)) return `[${v.map(valueLiteral).join(', ')}]`;
    if (v !== null && typeof v === 'object') return objectLiteral(Object.entries(v).map(([k, x]) => [propertyKey(k), valueLiteral(x)] as const));
    return 'null';
}

/** σ as a JavaScript literal whose element keys are computed from the `$ID` table (R-GEN-17). */
function stateLiteral(state: JsState, table: JsIdTable): string {
    const byElement = (record: Record<string, unknown>) =>
        objectLiteral(Object.entries(record).map(([id, v]) => [`[${table.refs.get(id) ?? jsString(id)}]`, valueLiteral(v)] as const));
    const parts: Array<readonly [string, string]> = [['marking', byElement(state.marking)], ['attrs', byElement(state.attrs)]];
    if (state.derived) parts.push(['derived', byElement(state.derived)]);
    return objectLiteral(parts);
}

/** The id of a site a template passes: an element id, or an object that carries one. */
function idOf(x: unknown): string {
    if (typeof x === 'string') return x;
    const id = x && typeof x === 'object' ? (x as Record<string, unknown>).id ?? (x as Record<string, unknown>).element : undefined;
    return typeof id === 'string' ? id : '';
}

function refusalText(what: string, refusals: readonly { code: string; message: string }[]): string {
    return `${what} has no JavaScript: ${refusals.map(r => `${r.code} ${r.message}`).join('; ')}`;
}

/** The guard outcome of one site as a JavaScript expression: true without a guard, else its guards conjoined. */
function printSiteGuard(run: ModelRun, ctx: JsPrintContext, lookup: Lookup): string {
    const list = run.guards.get(ctx.site) ?? [];
    const printed: string[] = [];
    for (const g of list) {
        const name = String(lookup[ctx.site]?.name ?? ctx.site);
        if (g.defect) throw new Error(`The guard of ${name}, '${g.source}', is a defect: ${g.defect.detail}`);
        if (g.expr === null) continue;
        const out = printGuard(g.expr, ctx);
        if (!out.ok) throw new Error(refusalText(`The guard of ${name}, '${g.source}',`, out.refusals));
        printed.push(`() => (${out.code})`);
    }
    if (printed.length === 0) return `({ kind: 'true' })`;
    if (printed.length === 1) return `$guard(${printed[0]})`;
    // A defect wins, then false; none is true (simBridge.ts `makeGuardOracle`).
    return `((guards) => { let r = { kind: 'true' }; for (const g of guards) { const o = $guard(g); if (o.kind === 'defect') return o; if (o.kind === 'false') r = o; } return r; })([${printed.join(', ')}])`;
}

/** The `target` value of a template's context: `null` when the model has no STC or M cannot be frozen. */
export function jsTarget(globals: Record<string, JjelValue>, lookup: Lookup, modelId: string): JjelValue | null {
    const compiled = compileModelRun(lookup, modelId, globals);
    if (compiled.kind !== 'ok') return null;
    const run = compiled.run;
    const net = run.net;
    const nameOf = (id: string) => String(lookup[id]?.name ?? id);
    const table = elementIdTable(modelElements(lookup, modelId));
    const ctxFor = (site: string): JsPrintContext => ({ snapshot: run.snapshot, site, places: net.places, declared: net.declared, refs: table.refs });
    // A global's equation runs with `self` the model root (derivedEvaluator.ts): its handle, for the printer's fold.
    const withModel: SimSnapshot = {
        ...run.snapshot,
        handleById: new Map([...run.snapshot.handleById, [net.modelId, run.snapshot.model]]),
    };
    const plan = derivedPlan(run);
    const declared: Array<Record<string, unknown>> = [];
    for (const [element, byName] of net.declared) {
        for (const [attr, d] of byName) {
            declared.push({ element, name: nameOf(element), attr, space: d.space, domain: d.domain, derived: d.equation !== undefined, input: d.input === true });
        }
    }

    const data = {
        places: [...net.places].map(id => ({ id, name: nameOf(id) })),
        transitions: net.transitions.map(t => ({
            id: t.id,
            name: t.origin.length > 0 ? t.origin.map(nameOf).join(' + ') : nameOf(t.id),
            origin: [...t.origin],
            preset: t.preset.map(a => ({ place: a.place, weight: a.weight })),
            postset: t.postset.map(a => ({ place: a.place, weight: a.weight })),
            inhibitors: t.inhibitors.map(a => ({ place: a.place, weight: a.weight })),
            triggers: [...t.triggers],
            // The sites that carry a guard or an action: one without is true, or writes nothing.
            guardSites: t.guardSites.filter(site => (run.guards.get(site)?.length ?? 0) > 0),
            elseOf: t.elseOf === null ? null : [...t.elseOf],
            actionSites: t.actionSites
                .filter(site => (run.actions.get(actionSiteKey(site))?.length ?? 0) > 0)
                .map(site => ({ element: site.element, role: site.role })),
        })),
        bound: net.bound,
        final: net.final ? [...net.final] : null,
        activityFinal: net.activityFinal ? [...net.activityFinal] : null,
        declared,
        derived: plan.map(p => ({ element: p.element, attr: p.attr })),
    };

    const guard = (site: unknown): string => printSiteGuard(run, ctxFor(idOf(site)), lookup);
    const actions = (site: unknown): string => {
        const s: ActionSite = typeof site === 'string'
            ? { element: site, role: 'transition' }
            : { element: idOf(site), role: ((site as Record<string, unknown>)?.role ?? 'transition') as ActionSite['role'] };
        const list = run.actions.get(actionSiteKey(s)) ?? [];
        const defect = list.find(c => c.defect !== null || c.action === null);
        if (defect) throw new Error(`The action '${defect.source}' of ${nameOf(s.element)} is a defect: ${defect.defect ?? 'it does not parse'}`);
        const out = printActions(list.map(c => c.action as NonNullable<CompiledAction['action']>), ctxFor(s.element));
        if (!out.ok) throw new Error(refusalText(`The actions of ${nameOf(s.element)}`, out.refusals));
        return out.code;
    };
    const equation = (d: unknown): string => {
        const element = idOf(d);
        const attr = d && typeof d === 'object' ? (d as Record<string, unknown>).attr : undefined;
        const p = plan.find(x => x.element === element && x.attr === attr);
        if (!p) throw new Error(`No derived attribute '${String(attr)}' on ${nameOf(element)}`);
        const out = printGuard(p.expr, { snapshot: withModel, site: element, places: net.places, declared: net.declared, refs: table.refs });
        if (!out.ok) throw new Error(refusalText(`The equation of ${String(attr)} on ${nameOf(element)}`, out.refusals));
        return out.code;
    };
    const ref = (element: unknown): string => {
        const id = idOf(element);
        const named = table.refs.get(id);
        if (named === undefined) throw new Error(`No element '${id}' in the model`);
        return named;
    };
    const fn = (f: (x: unknown) => string): JjelValue => createFunction(['site'], ([x]) => f(x) as JjelValue) as unknown as JjelValue;

    return Object.freeze({
        __type: 'Target',
        name: JS_TARGET_NAME,
        runtime: JS_RUNTIME,
        ids: table.declaration,
        ref: fn(ref),
        initial: stateLiteral(toJsState(net.initial), table),
        net: deepFreeze(data),
        guard: fn(guard),
        actions: fn(actions),
        equation: fn(equation),
    }) as unknown as JjelValue;
}

/** Freezes `value` and every object and array under it. Only for what this module builds. */
function deepFreeze<T>(value: T): T {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const v of Object.values(value)) deepFreeze(v);
    }
    return value;
}

