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
            fill: 'var(--color-inode-surface)',
            cornerRadius: 8,
            border: { color: 'var(--color-inode-border)', width: 1, style: 'solid' },
            labels: [
                {
                    position: 'top',
                    source: { from: 'intrinsic', prop: 'qualifiedName' },
                    style: { fontSize: 14, color: 'var(--color-inode-name)', underline: true },
                },
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

/**
 * Snapshot of `defaultObjectViewIR()` as it stood from `637a5e238` (2026-07-18, the
 * inverse migration that first persisted it via `VersionFixer` 2.225 -> 2.226) through
 * `400095370^` (2026-09-19, immediately before the parity batch of P-2026-09-18-2219
 * added `cornerRadius`, `border` and the label's `color`/`underline`). Every project
 * migrated in that window has this exact object, verbatim, sitting in `ir` on its
 * default M1 views — never re-read from the live factory, never touched by a
 * migration (decision 3 of that prompt: no `VersionFixer` change, seed-only).
 *
 * R-IRN-33 (2026-09-19): the parity batch changed the live factory without this
 * constant, which silently flipped `isMigratedDefaultView` to `false` for every one of
 * those views — they stopped delegating to the native renderer and fell back to the
 * IR interpreter on their old, now-stale `ir`, rendering with the pre-parity chrome
 * (4px radius, grey border, no underline) instead of native's. `isMigratedDefaultView`
 * below must keep recognizing this frozen shape, not just the live one, or the same
 * class of regression returns on the next factory edit. See "Debito" in R-IRN-33 for
 * why this is a stopgap, not the real fix.
 */
const LEGACY_OBJECT_VIEW_SNAPSHOT: Omit<VertexViewIR, 'metaclasses' | 'label'> = {
    irVersion: 'ir-1.2',
    kind: 'vertex',
    priority: 0,
    exclusive: true,
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

/**
 * Snapshot of `defaultObjectViewIR()` as it stood from `400095370` (2026-09-19, the
 * parity batch of P-2026-09-18-2219 that added `cornerRadius`, `border` and the
 * label's `color`/`underline`) through immediately before P-2026-09-22-2105 added
 * `shape.fill`. Every project migrated in that window has this exact object,
 * verbatim, sitting in `ir` on its default M1 views (cornerRadius 8, the grey
 * border, the underlined 14px name — but no fill).
 *
 * P-2026-09-22-2105 (discovery `docs/discovery/discovery_2026-09-22_ir_default_fill.md`
 * Finding 6): adding `fill` to the live factory changes its hash the same way the
 * 2026-09-19 batch did (R-IRN-33), and would silently flip `isMigratedDefaultView`
 * to `false` for every one of these views if this snapshot were not added alongside
 * it. `isMigratedDefaultView` below must keep recognizing this frozen shape too, not
 * just `LEGACY_OBJECT_VIEW_SNAPSHOT` and the live one — same debt, same stopgap, one
 * more instance of it (R-IRN-33's "Debito" is still not closed by this).
 *
 * Correction (P-2026-09-24-1455, discovery_2026-09-24_migrated_view_identity.md F1):
 * the window above held two shapes, not one. This one starts at `6ee6efcd5`; at
 * `400095370` alone the label had no `color` (LEGACY_OBJECT_VIEW_SNAPSHOT_400095370).
 */
const LEGACY_OBJECT_VIEW_SNAPSHOT_2026_09_18: Omit<VertexViewIR, 'metaclasses' | 'label'> = {
    irVersion: 'ir-1.2',
    kind: 'vertex',
    priority: 0,
    exclusive: true,
    shape: {
        form: 'rect',
        cornerRadius: 8,
        border: { color: 'var(--color-inode-border)', width: 1, style: 'solid' },
        labels: [
            {
                position: 'top',
                source: { from: 'intrinsic', prop: 'qualifiedName' },
                style: { fontSize: 14, color: 'var(--color-inode-name)', underline: true },
            },
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

/**
 * Snapshot of `defaultObjectViewIR()` at `400095370` alone (2026-09-19 00:51 to 01:02,
 * the first commit of the parity batch of P-2026-09-18-2219): `cornerRadius`, `border`
 * and the underlined 14px name, but no label `color` yet — `6ee6efcd5` added it eleven
 * minutes later. A project migrated and saved while the trunk sat on that commit has
 * this shape, which neither neighbouring snapshot matches (measured,
 * discovery_2026-09-24_migrated_view_identity.md §2).
 */
const LEGACY_OBJECT_VIEW_SNAPSHOT_400095370: Omit<VertexViewIR, 'metaclasses' | 'label'> = {
    irVersion: 'ir-1.2',
    kind: 'vertex',
    priority: 0,
    exclusive: true,
    shape: {
        form: 'rect',
        cornerRadius: 8,
        border: { color: 'var(--color-inode-border)', width: 1, style: 'solid' },
        labels: [
            {
                position: 'top',
                source: { from: 'intrinsic', prop: 'qualifiedName' },
                style: { fontSize: 14, underline: true },
            },
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

/**
 * Snapshot of `defaultObjectViewIR()` as it stood from `fb876efaa` (P-2026-09-22-2105,
 * which added `shape.fill`) until P-2026-09-24-1455 closed the list below. Every
 * project migrated in that window carries this shape with no `migratedHash`. It is
 * the last shape the migration ever wrote unstamped.
 */
const LEGACY_OBJECT_VIEW_SNAPSHOT_2026_09_22: Omit<VertexViewIR, 'metaclasses' | 'label'> = {
    irVersion: 'ir-1.2',
    kind: 'vertex',
    priority: 0,
    exclusive: true,
    shape: {
        form: 'rect',
        fill: 'var(--color-inode-surface)',
        cornerRadius: 8,
        border: { color: 'var(--color-inode-border)', width: 1, style: 'solid' },
        labels: [
            {
                position: 'top',
                source: { from: 'intrinsic', prop: 'qualifiedName' },
                style: { fontSize: 14, color: 'var(--color-inode-name)', underline: true },
            },
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

let factoryHashes: Set<string> | null = null;

/** Per-ir memo — the D-layer replaces the ir ref on edit (same assumption as irResolveCore's refToken). */
const delegationCache = new WeakMap<object, boolean>();

/**
 * Hash of the SEMANTIC identity of an ir: key order canonicalized, and the three
 * keys that describe the ir instead of being part of it removed — `migratedFrom`
 * (where it came from), `authoringMetaclassPins` (see isMigratedDefaultView below)
 * and `migratedHash` (the stamp itself: a stamp that entered the hash it is compared
 * against could never match).
 */
function structuralHash(ir: object): string {
    const structural: Record<string, unknown> = { ...ir };
    delete structural.migratedFrom;
    delete structural.authoringMetaclassPins;
    delete structural.migratedHash;
    return irHash(canonicalize(structural) as VertexViewIR);
}

/**
 * Stamp a migrated default view with the structural hash of its own ir at migration
 * time (`migratedHash`, P-2026-09-24-1455, closing R-IRN-33's debt). Called by
 * `VersionFixer` 2.225 -> 2.226 on the ir it writes. The stamp lives INSIDE `ir`, next
 * to `migratedFrom`, because `LViewElement.updateDefaultView` rebuilds a
 * never-edited view on the same load and carries `ir` alone (view.tsx), so a
 * sibling field would be dropped on the very load that wrote it.
 */
export function withMigratedHash<T extends object>(ir: T): T & { migratedHash: string } {
    return { ...ir, migratedHash: structuralHash(ir) };
}

/**
 * True when the resolved view must render through the native abstract branch of
 * ObjectNode instead of the IR interpreter (delegation, spec v1.2 sez. 11):
 * - the view carries `migratedFrom: 'classic-default'` AND is untouched since the
 *   migration. A stamped view (`migratedHash`, P-2026-09-24-1455) is untouched when
 *   its structural hash equals its stamp: robust to any change of the factory, with
 *   no hook on the edit paths, since every edit changes the hash; a view reverted by
 *   hand to its migrated shape delegates again. An unstamped view (migrated before
 *   the stamp existed) is untouched when its structural hash equals one of the
 *   frozen shapes below;
 * - or the view id is IR_DEFAULT_OBJECT_VIEW_ID (built-in default wildcard).
 *
 * THE LIST OF FROZEN SHAPES IS CLOSED. It holds every shape `defaultObjectViewIR()`
 * ever had on the trunk while the migration wrote it unstamped: 07-18
 * (LEGACY_OBJECT_VIEW_SNAPSHOT), 400095370, 09-18 and 09-22. It does NOT call the live
 * factory: had it done so, the next factory change would have silently flipped every
 * view saved with the 09-22 shape off native rendering, the regression of R-IRN-33,
 * twice already. Every view migrated from now on carries its stamp, so a factory
 * change never needs a new entry here, and none is ever added.
 *
 * `migratedFrom`, `authoringMetaclassPins` and `migratedHash` are excluded from the
 * comparison (structuralHash). They answer the same question — what counts as the
 * SEMANTIC identity of an ir — and none of them is part of it. `migratedFrom` records
 * where the ir came from; `authoringMetaclassPins` records which concrete class each
 * name in `metaclasses` stands for, and the resolver never reads it (see irTypes).
 * Letting the pin into the comparison would flip every migrated default view off
 * native delegation the moment its metaclass is edited — a diffuse rendering change
 * with no visible cause, on nearly the whole view stock of a migrated project.
 */
export function isMigratedDefaultView(compiled: Pick<CompiledView, 'viewId' | 'ir'>): boolean {
    if (compiled.viewId === IR_DEFAULT_OBJECT_VIEW_ID) return true;
    const ir = compiled.ir as { migratedFrom?: string; migratedHash?: unknown } | null;
    if (!ir || typeof ir !== 'object') return false;
    const cached = delegationCache.get(ir);
    if (cached !== undefined) return cached;
    let delegated = false;
    if (ir.migratedFrom === 'classic-default') {
        const hash = structuralHash(ir);
        if (typeof ir.migratedHash === 'string') {
            delegated = hash === ir.migratedHash;
        } else {
            if (factoryHashes === null) {
                factoryHashes = new Set([
                    irHash(canonicalize({ ...LEGACY_OBJECT_VIEW_SNAPSHOT, metaclasses: '*', label: 'Object (IR default)' }) as VertexViewIR),
                    irHash(canonicalize({ ...LEGACY_OBJECT_VIEW_SNAPSHOT_400095370, metaclasses: '*', label: 'Object (IR default)' }) as VertexViewIR),
                    irHash(canonicalize({ ...LEGACY_OBJECT_VIEW_SNAPSHOT_2026_09_18, metaclasses: '*', label: 'Object (IR default)' }) as VertexViewIR),
                    irHash(canonicalize({ ...LEGACY_OBJECT_VIEW_SNAPSHOT_2026_09_22, metaclasses: '*', label: 'Object (IR default)' }) as VertexViewIR),
                ]);
            }
            delegated = factoryHashes.has(hash);
        }
    }
    delegationCache.set(ir, delegated);
    return delegated;
}
