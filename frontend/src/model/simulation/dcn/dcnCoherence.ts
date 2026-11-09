/**
 * dcnCoherence — coherence constraints over a trajectory (R-DCN-28, R-DCN-31;
 * SoSyM 2026, §3.1 Examples 1 and 2, §4.2 Definition 5).
 *
 * A trajectory σ0, σ1, … is admissible under C = (φ, ψ) iff φ holds at every σi
 * and ψ holds on the trajectory. σ0 is the state at Reset, σi the state after
 * the i-th committed step.
 *
 * - φ: a hit at step i when φ(σi) is false.
 * - BoundedPersistence(condition, k): a hit at step i when the condition holds
 *   at σ(i−k), …, σi, k+1 consecutive states; every further step of the run is
 *   a hit again.
 * - BoundedResponse(trigger, response, k): a trigger at σi needs a response at
 *   some σj, i ≤ j ≤ i+k. A hit at step i+k when there is none; a trigger still
 *   open at the end is pending, not violated.
 * - A constraint is monitored per instance whose classifier's generalization
 *   closure holds its context, with `self` that instance; each constraint and
 *   instance has at most one hit per step (φ first, the pattern still counts).
 *
 * Two lifetimes. `compileDcnCoherence` runs once per run: the texts become
 * guards of the DCN subset, in the context the invariants are read in (`event`
 * null, no state accessor, `.in(V::D)` and the instances by name). A text that
 * does not compile is a `DeclarationDefect` and drops its own part only, φ or
 * the pattern. `coherenceHits` is a fold over the configurations: the counters
 * are not part of σ and are recomputed from σ0 at every call, so step back,
 * scenarios and the slider replay them (R-DCN-31). What is remembered, per
 * configuration object, is what each expression answered on it: a configuration
 * already seen is not evaluated again, and the fold over it is arithmetic.
 *
 * An expression that fails on a σ (an absent name, a non-boolean) is a failure
 * of the report and holds nothing: no φ hit, no step of a run, no trigger, no
 * response. Generalization is followed as in dcnHandles.ts, whose
 * `generalizationClosure` is not exported. Pure: JjEL, no React, no store.
 */

import type { OntoBinding } from '../../ontological/bindingCodec';
import { buildGuardContext } from '../guardContext';
import type { SimSnapshot } from '../guardContext';
import { compileGuard, evaluateGuard } from '../guardEvaluator';
import type { CompiledGuard, GuardOutcome } from '../guardEvaluator';
import type { DeclarationDefect, NetConfiguration } from '../netTypes';
import type { DcnReadView } from './dcnCompile';
import { bindDcn } from './dcnHandles';
import type { DcnModel } from './dcnHandles';
import type { DcnCoherenceConstraint } from './dcnRoles';

export interface DcnCoherenceInput {
    /** What `dcnCoherenceFromRoles` read. */
    readonly constraints: readonly DcnCoherenceConstraint[];
    readonly model: DcnModel;
    readonly view: DcnReadView;
    readonly binding: OntoBinding;
    readonly snapshot: SimSnapshot;
}

type DcnCompiledPattern =
    | { readonly kind: 'persistence'; readonly condition: CompiledGuard; readonly k: number }
    | { readonly kind: 'response'; readonly trigger: CompiledGuard; readonly response: CompiledGuard; readonly k: number };

/** One constraint on one instance. */
interface DcnCoherenceMonitor {
    readonly instance: string;
    readonly constraint: string;
    readonly pointwise: CompiledGuard | null;
    readonly pattern: DcnCompiledPattern | null;
}

/** What the expressions of a monitor answered on one configuration. */
interface DcnCoherenceReading {
    readonly pointwise: GuardOutcome | null;
    /** The condition, or the trigger. */
    readonly first: GuardOutcome | null;
    readonly response: GuardOutcome | null;
}

export interface DcnCompiledCoherence {
    readonly monitors: readonly DcnCoherenceMonitor[];
    /** The shape of `CompiledNet.declarationDefects`. */
    readonly defects: readonly DeclarationDefect[];
    readonly snapshot: SimSnapshot;
    readonly model: DcnModel;
    readonly readings: WeakMap<NetConfiguration, readonly DcnCoherenceReading[]>;
}

export interface DcnCoherenceHit {
    readonly step: number;
    readonly instanceId: string;
    readonly constraintId: string;
    readonly kind: 'pointwise' | 'persistence' | 'response';
}

/** A trigger with no response so far, whose bound lies beyond the end of the trajectory. */
export interface DcnPendingResponse {
    /** The step of the trigger. */
    readonly step: number;
    /** The last step a response can meet it. */
    readonly deadline: number;
    readonly instanceId: string;
    readonly constraintId: string;
}

/** An expression that gave no verdict on the configuration of `step`. */
export interface DcnCoherenceFailure {
    readonly step: number;
    readonly instanceId: string;
    readonly constraintId: string;
    readonly detail: string;
}

export interface DcnCoherenceReport {
    /** By step, then in constraint and instance order. */
    readonly hits: readonly DcnCoherenceHit[];
    readonly pending: readonly DcnPendingResponse[];
    readonly failures: readonly DcnCoherenceFailure[];
}

/** The classifier and its generals, each once (as dcnHandles.ts). */
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

/** Once per run: the monitors of `input`, and the defects of the texts that do not compile. */
export function compileDcnCoherence(input: DcnCoherenceInput): DcnCompiledCoherence {
    const { constraints, model, view, binding, snapshot } = input;
    const defects: DeclarationDefect[] = [];

    /** The guard of `source`, or `null` with a defect when it is blank or does not compile. */
    const expression = (name: string, element: string, what: string, source: string | null): CompiledGuard | null => {
        if (source === null) {
            defects.push({ index: null, name, code: 'record', message: `a pattern with no ${what}`, element });
            return null;
        }
        const guard = compileGuard(source, { dcn: true });
        if (guard.defect === null) return guard;
        defects.push({ index: null, name, code: guard.defect.reason === 'parse-error' ? 'parse' : 'subset', message: `${what}: ${guard.defect.detail}`, element });
        return null;
    };

    const patternOf = (c: DcnCoherenceConstraint): DcnCompiledPattern | null => {
        const p = c.pattern;
        if (p === null) return null;
        if (p.kind === 'persistence') {
            const condition = expression(c.name, p.id, 'condition', p.condition);
            return condition === null ? null : { kind: 'persistence', condition, k: p.k };
        }
        const trigger = expression(c.name, p.id, 'trigger', p.trigger);
        const response = expression(c.name, p.id, 'response', p.response);
        return trigger === null || response === null ? null : { kind: 'response', trigger, response, k: p.k };
    };

    const closures = new Map<string, readonly string[]>();
    const closureOf = (classifier: string): readonly string[] => {
        let closure = closures.get(classifier);
        if (!closure) closures.set(classifier, closure = generalizationClosure(view, binding, classifier));
        return closure;
    };

    const monitors: DcnCoherenceMonitor[] = [];
    for (const c of constraints) {
        if (c.context === null) {
            defects.push({ index: null, name: c.name, code: 'record', message: 'a constraint with no context', element: c.id });
            continue;
        }
        const pointwise = c.pointwise !== null ? expression(c.name, c.id, 'pointwise', c.pointwise) : null;
        const pattern = patternOf(c);
        if (pointwise === null && pattern === null) continue;
        for (const info of model.instances.values()) {
            if (closureOf(info.classifier).includes(c.context)) monitors.push({ instance: info.id, constraint: c.id, pointwise, pattern });
        }
    }
    return { monitors, defects, snapshot, model, readings: new WeakMap() };
}

/** What every monitor's expressions answer on `cfg`; remembered per configuration object. */
function readingsOf(c: DcnCompiledCoherence, cfg: NetConfiguration): readonly DcnCoherenceReading[] {
    const known = c.readings.get(cfg);
    if (known) return known;
    const binding = bindDcn(c.model, cfg.state, c.snapshot);
    const out = c.monitors.map((m): DcnCoherenceReading => {
        const ctx = buildGuardContext(c.snapshot, { transitionId: m.instance }, { event: null }, undefined, undefined, binding);
        const read = (g: CompiledGuard | null): GuardOutcome | null => (g !== null ? evaluateGuard(g, ctx) : null);
        const p = m.pattern;
        return {
            pointwise: read(m.pointwise),
            first: p === null ? null : read(p.kind === 'persistence' ? p.condition : p.trigger),
            response: p?.kind === 'response' ? read(p.response) : null,
        };
    });
    c.readings.set(cfg, out);
    return out;
}

/** The hits, the pending responses and the failures of the trajectory σ0..σn. */
export function coherenceHits(compiled: DcnCompiledCoherence, configurations: readonly NetConfiguration[]): DcnCoherenceReport {
    const { monitors } = compiled;
    const hits: DcnCoherenceHit[] = [];
    const failures: DcnCoherenceFailure[] = [];
    const runs = monitors.map(() => 0);
    const open: number[][] = monitors.map(() => []);

    configurations.forEach((cfg, step) => {
        const readings = readingsOf(compiled, cfg);
        monitors.forEach((m, at) => {
            const { pointwise, first, response } = readings[at];
            const base = { step, instanceId: m.instance, constraintId: m.constraint };
            for (const o of [pointwise, first, response]) if (o?.kind === 'defect') failures.push({ ...base, detail: o.detail });

            let broken: DcnCoherenceHit['kind'] | null = null;
            if (m.pattern?.kind === 'persistence') {
                runs[at] = first?.kind === 'true' ? runs[at] + 1 : 0;
                if (runs[at] > m.pattern.k) broken = 'persistence';
            } else if (m.pattern?.kind === 'response') {
                // Ascending, and the oldest is the only one that can expire at this step.
                if (response?.kind === 'true') open[at].length = 0;
                else if (first?.kind === 'true') open[at].push(step);
                if (open[at][0] === step - m.pattern.k) {
                    open[at].shift();
                    broken = 'response';
                }
            }

            const kind = pointwise?.kind === 'false' ? 'pointwise' : broken;
            if (kind !== null) hits.push({ ...base, kind });
        });
    });

    const pending = monitors.flatMap((m, at) => {
        const p = m.pattern;
        return p?.kind === 'response' ? open[at].map(step => ({ step, deadline: step + p.k, instanceId: m.instance, constraintId: m.constraint })) : [];
    });
    return { hits, pending, failures };
}
