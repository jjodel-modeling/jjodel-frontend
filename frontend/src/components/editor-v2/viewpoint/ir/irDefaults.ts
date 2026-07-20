/**
 * irDefaults — IR default views (Fase 2a, spec v1.2 sez. 2/11).
 *
 * IR equivalents of the classic default M1 views (CLASSIC_OBJECT_VIEW_JSX /
 * CLASSIC_SINGLETON_VIEW_JSX). They use the '*' wildcard (minimum specificity:
 * any metaclass-declared view beats them at equal priority) and replicate the
 * UML instance notation already rendered natively by ObjectNode: underlined
 * "name : Metaclass" header plus an attribute compartment.
 *
 * Notes:
 * - CLASSIC_VALUE_VIEW_JSX has no IR equivalent: in EditorV2 values are rows
 *   inside the object node, never standalone nodes.
 * - M2 (metamodel) needs no IR default: ClassNode/EnumNode/PackageNode are the
 *   native abstract rendering and never went through jsxString in the flow.
 * - Consumed by the Fase 4 inverse migration (marker-matched classic views →
 *   these factories, migratedFrom: 'classic-default') and by dev fixtures.
 */

import { irHash } from './irCompile';
import type { CompiledView, VertexViewIR } from './irTypes';

/** Stable id for the migrated default view (Fase 4 idempotency). */
export const IR_DEFAULT_OBJECT_VIEW_ID = 'Pointer_IRDefaultObjectView';

export function defaultObjectViewIR(): VertexViewIR {
    return {
        irVersion: 'ir-1.2',
        kind: 'vertex',
        metaclasses: '*',
        priority: 0,
        exclusive: true,
        label: 'Object (IR default)',
        shape: {
            form: 'rect',
            labels: [
                { position: 'top', source: { from: 'intrinsic', prop: 'qualifiedName' } },
            ],
        },
        fieldCompartments: [
            {
                id: 'attributes',
                source: { from: 'attributes' },
                rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }] },
                separator: true,
            },
        ],
    };
}

/*
 * No singleton IR default: singleton-ness lives on the metaclass
 * (DClass.isSingleton), which the Predicate grammar deliberately cannot reach,
 * and ObjectNode renders the singleton diamond badge natively on the IR branch
 * (the badge sits outside IRNodeContent in the wrapper). The classic
 * CLASSIC_SINGLETON_VIEW_JSX therefore migrates onto defaultObjectViewIR.
 */

// ---- Delegation of migrated defaults (spec v1.2 sez. 11, amendment 2026-07-18) ----

/**
 * Deep copy with object keys sorted, so that irHash equality is insensitive to
 * key insertion order (persistence round-trips or spreads may reorder keys).
 * Arrays keep their order — it is semantic (labels, segments, declaration order).
 */
function canonicalize(x: unknown): unknown {
    if (Array.isArray(x)) return x.map(canonicalize);
    if (x !== null && typeof x === 'object') {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(x).sort()) out[k] = canonicalize((x as Record<string, unknown>)[k]);
        return out;
    }
    return x;
}

let factoryHash: string | null = null;

/** Per-ir memo — the D-layer replaces the ir ref on edit (same assumption as irResolveCore's refToken). */
const delegationCache = new WeakMap<object, boolean>();

/**
 * True when the resolved view must render through the native abstract branch of
 * ObjectNode instead of the IR interpreter (delegation, spec v1.2 sez. 11):
 * - the view carries `migratedFrom: 'classic-default'` AND its structure,
 *   normalized (key order canonicalized, `migratedFrom` excluded — no identity
 *   fields live inside `ir` today: view identity is the DViewElement id, spec
 *   sez. 12), equals defaultObjectViewIR(). An edited view diverges from the
 *   factory and returns to the interpreter as a custom view;
 * - or the view id is IR_DEFAULT_OBJECT_VIEW_ID (built-in default wildcard).
 */
export function isMigratedDefaultView(compiled: Pick<CompiledView, 'viewId' | 'ir'>): boolean {
    if (compiled.viewId === IR_DEFAULT_OBJECT_VIEW_ID) return true;
    const ir = compiled.ir as { migratedFrom?: string } | null;
    if (!ir || typeof ir !== 'object') return false;
    const cached = delegationCache.get(ir);
    if (cached !== undefined) return cached;
    let delegated = false;
    if (ir.migratedFrom === 'classic-default') {
        const structural: Record<string, unknown> = { ...ir };
        delete structural.migratedFrom;
        if (factoryHash === null) factoryHash = irHash(canonicalize(defaultObjectViewIR()) as VertexViewIR);
        delegated = irHash(canonicalize(structural) as VertexViewIR) === factoryHash;
    }
    delegationCache.set(ir, delegated);
    return delegated;
}
