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
import type { CompiledView, EdgeViewIR, RowViewIR, VertexViewIR } from './irTypes';

/** Stable id for the migrated default view (Fase 4 idempotency). */
export const IR_DEFAULT_OBJECT_VIEW_ID = 'Pointer_IRDefaultObjectView';

/** Stable id for the built-in default row view (Fase R2). Used as the compile-cache
 *  key so `compileRowView(IR_DEFAULT_ROW_VIEW_ID, defaultRowViewIR())` is memoized by
 *  rowCompileCache (R1) — compiled once, never persisted as a DViewElement. */
export const IR_DEFAULT_ROW_VIEW_ID = 'Pointer_IRDefaultRowView';

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

/**
 * Built-in default row view (Fase R2): the runtime fallback used by IRRow when no
 * row view of the active viewpoint matches a containment child (cascade tail after
 * exact > inherited > wildcard row). Renders the child's intrinsic name. Compiled at
 * runtime (via compileRowView + IR_DEFAULT_ROW_VIEW_ID cache key); MAI persisted as a
 * DViewElement.
 */
export function defaultRowViewIR(): RowViewIR {
    return {
        irVersion: 'ir-1.0',
        kind: 'row',
        metaclasses: '*',
        template: [{ from: 'intrinsic', prop: 'name' }],
    };
}

/**
 * Seed for a new reference-as-edge view (Fase E-ref, ratifica R-8): minimal,
 * authored from EdgeAuthoringPanel afterwards. `metaclasses` empty (the author sets
 * the SOURCE metaclass), `edge` empty so the compile defaults apply (terminations
 * none / openArrow, labelPlacement auto — irCompile.ts:415-420; not duplicated
 * here). `reference` absent = matches any reference of the source metaclass until
 * the author restricts it.
 */
export function defaultEdgeViewIR(): EdgeViewIR {
    return {
        irVersion: 'ir-1.2',
        kind: 'edge',
        metaclasses: [],
        edge: {},
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
 *   normalized (key order canonicalized, `migratedFrom` and
 *   `authoringMetaclassPins` excluded), equals defaultObjectViewIR(). An edited
 *   view diverges from the factory and returns to the interpreter as a custom
 *   view;
 * - or the view id is IR_DEFAULT_OBJECT_VIEW_ID (built-in default wildcard).
 *
 * Both exclusions answer the same question — what counts as the SEMANTIC identity
 * of an ir — and neither field is part of it. `migratedFrom` records where the ir
 * came from; `authoringMetaclassPins` records which concrete class each name in
 * `metaclasses` stands for, and the resolver never reads it (see irTypes). Letting
 * the pin into the comparison would flip every migrated default view off native
 * delegation the moment its metaclass is edited — a diffuse rendering change with
 * no visible cause, on nearly the whole view stock of a migrated project.
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
        delete structural.authoringMetaclassPins;
        if (factoryHash === null) factoryHash = irHash(canonicalize(defaultObjectViewIR()) as VertexViewIR);
        delegated = irHash(canonicalize(structural) as VertexViewIR) === factoryHash;
    }
    delegationCache.set(ir, delegated);
    return delegated;
}
