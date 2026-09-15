/**
 * useOrphanFeatures — M2→M1 attribute co-evolution for Editor v2.
 *
 * Protects instance feature values across metamodel attribute edits:
 *
 *  • Attribute REMOVED from the metamodel: values from existing instances
 *    are captured into a session-local OrphanStore (keyed by
 *    {classId, attrName, attrType}) BEFORE the DAttribute is deleted.
 *    The capture is triggered by canvasToJjom.syncRemoveAttribute, since
 *    the cascade delete of DValues via Dummy.get_delete makes post-hoc
 *    capture impossible.
 *
 *  • Attribute ADDED to the metamodel: the joiner framework
 *    (classes.ts DStructuralFeature init hook) auto-creates empty DValues
 *    on every existing instance of the class and its subclasses. This
 *    hook detects the new attribute tuple and, if an OrphanStore entry
 *    matches on {classId, attrName, attrType}, repopulates the values
 *    via SetFieldAction and consumes the entry.
 *
 *  • Class REMOVED from the metamodel: every OrphanStore entry bound to
 *    that classId is purged to avoid cross-session leaks.
 *
 *  • RENAME of an attribute is transparent: DAttribute.id is stable, so
 *    the signature (ID-based) doesn't change — no spurious capture or
 *    rehydrate fires. This is the chirurgical difference versus the
 *    original name-based implementation that was disabled for the
 *    undo/attr_0 bug.
 *
 * The OrphanStore is a module-level Map, NOT Redux: session-local, lost
 * on reload/unmount, immune to undo/redo state oscillation.
 *
 * Refs: docs/reports/2026-04-23-attribute-coevolution-analysis.md
 *       docs/reports/2026-04-23-undo-attr-zero-analysis.md (D + E.3)
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { Node } from '@xyflow/react';
import {
    store,
    SetFieldAction,
    TRANSACTION,
} from '../../../joiner';

// ---------------------------------------------------------------------------
// OrphanStore — module-level session state
// ---------------------------------------------------------------------------

interface OrphanAttributeEntry {
    kind: 'attribute';
    classId: string;
    className: string;
    attrName: string;
    attrType: string;
    valuesByObjectId: Map<string, unknown[]>;
    removedAt: number;
}

/** Keyed by `${classId}::${attrName}::${attrType}`. */
const orphanStore = new Map<string, OrphanAttributeEntry>();

function makeKey(classId: string, attrName: string, attrType: string): string {
    return `${classId}::${attrName}::${attrType}`;
}

if (typeof window !== 'undefined') {
    (window as any)._jjOrphanStore = orphanStore;
}

// ---------------------------------------------------------------------------
// Producer API — invoked by canvasToJjom.syncRemoveAttribute
// ---------------------------------------------------------------------------

/**
 * Snapshot every DValue bound to `attrId` into the OrphanStore, keyed by
 * {classId, attrName, attrType}. Must run BEFORE the DAttribute is deleted,
 * because the cascade (Dummy.ts 'instanceof' case) destroys the DValues
 * once `lAttr.delete()` fires and they become unreachable.
 *
 * No-op cases (all silent):
 *  - attrId does not resolve to a DAttribute
 *  - attribute has no resolvable class father, name or type
 *  - no instance carries a non-empty value for this attribute
 *    (we skip empty snapshots to keep the store focused on real data)
 */
export function captureAttributeOrphanValues(attrId: string): void {
    try {
        const state = store.getState() as any;
        const lookup = state?.idlookup;
        if (!lookup) return;

        const dAttr = lookup[attrId] as any;
        if (!dAttr || dAttr.className !== 'DAttribute') return;

        const classId: string = typeof dAttr.father === 'string' ? dAttr.father : '';
        if (!classId) return;

        const dClass = lookup[classId] as any;
        const className: string = dClass?.name ?? '';
        const attrName: string = dAttr.name ?? '';
        const attrType: string = typeof dAttr.type === 'string' ? dAttr.type : '';
        if (!attrName || !attrType) return;

        const valuesByObjectId = new Map<string, unknown[]>();
        for (const id in lookup) {
            const elem = lookup[id] as any;
            if (!elem || elem.className !== 'DValue') continue;
            if (elem.instanceof !== attrId) continue;
            const objectId = typeof elem.father === 'string' ? elem.father : '';
            if (!objectId) continue;
            const values = Array.isArray(elem.values) ? elem.values : [];
            if (values.length === 0) continue;
            valuesByObjectId.set(objectId, [...values]);
        }

        if (valuesByObjectId.size === 0) return;

        orphanStore.set(makeKey(classId, attrName, attrType), {
            kind: 'attribute',
            classId,
            className,
            attrName,
            attrType,
            valuesByObjectId,
            removedAt: Date.now(),
        });
    } catch (err) {
        console.warn('[useOrphanFeatures] captureAttributeOrphanValues failed:', err);
    }
}

// ---------------------------------------------------------------------------
// Signature — ID-based, scoped to the metamodel tree
// ---------------------------------------------------------------------------

const SIG_TUPLE_SEP = '|';
const SIG_FIELD_SEP = ':';

/**
 * Walk the model's package/subpackage tree and collect every DClass id.
 * Mirrors the traversal used by useEditorMode so that "which classes
 * belong to this metamodel" stays consistent across hooks.
 */
function collectClassIds(
    lookup: any,
    rootId: string,
    acc: string[],
    visited: Set<string>,
    depth: number,
): void {
    if (!rootId || depth > 20 || visited.has(rootId)) return;
    visited.add(rootId);
    const node = lookup?.[rootId];
    if (!node) return;

    const classes = node.classes;
    if (Array.isArray(classes)) {
        for (const c of classes) if (typeof c === 'string') acc.push(c);
    }

    const subs = node.subpackages;
    if (Array.isArray(subs)) {
        for (const sp of subs) if (typeof sp === 'string') collectClassIds(lookup, sp, acc, visited, depth + 1);
    }

    const pkgs = node.packages;
    if (Array.isArray(pkgs)) {
        for (const p of pkgs) if (typeof p === 'string') collectClassIds(lookup, p, acc, visited, depth + 1);
    }
}

/**
 * Deterministic signature of {classId, attrId, attrType} tuples under the
 * given model. Sorted so equivalent states always produce equal strings
 * (required: useEffect compares by === on the sig).
 */
function computeSignature(lookup: any, modelid: string | undefined): string {
    if (!modelid || !lookup) return '';
    const classIds: string[] = [];
    collectClassIds(lookup, modelid, classIds, new Set<string>(), 0);
    if (classIds.length === 0) return '';

    const tuples: string[] = [];
    for (const classId of classIds) {
        const dClass = lookup[classId];
        if (!dClass) continue;
        const attrs = dClass.attributes;
        if (!Array.isArray(attrs)) continue;
        for (const attrId of attrs) {
            if (typeof attrId !== 'string') continue;
            const dAttr = lookup[attrId];
            if (!dAttr || dAttr.className !== 'DAttribute') continue;
            const attrType = typeof dAttr.type === 'string' ? dAttr.type : '';
            tuples.push(`${classId}${SIG_FIELD_SEP}${attrId}${SIG_FIELD_SEP}${attrType}`);
        }
    }

    tuples.sort();
    return tuples.join(SIG_TUPLE_SEP);
}

interface SigTuple {
    classId: string;
    attrId: string;
    attrType: string;
}

function parseSignature(sig: string): SigTuple[] {
    if (!sig) return [];
    const out: SigTuple[] = [];
    for (const part of sig.split(SIG_TUPLE_SEP)) {
        if (!part) continue;
        const fields = part.split(SIG_FIELD_SEP);
        const classId = fields[0];
        const attrId = fields[1];
        const attrType = fields[2] ?? '';
        if (!classId || !attrId) continue;
        out.push({ classId, attrId, attrType });
    }
    return out;
}

function diffAddedTuples(prev: SigTuple[], curr: SigTuple[]): SigTuple[] {
    const prevKeys = new Set(prev.map(t => `${t.classId}${SIG_FIELD_SEP}${t.attrId}`));
    return curr.filter(t => !prevKeys.has(`${t.classId}${SIG_FIELD_SEP}${t.attrId}`));
}

function diffRemovedClasses(prev: SigTuple[], curr: SigTuple[]): string[] {
    const currClasses = new Set(curr.map(t => t.classId));
    const removed = new Set<string>();
    for (const t of prev) if (!currClasses.has(t.classId)) removed.add(t.classId);
    return Array.from(removed);
}

// ---------------------------------------------------------------------------
// Consumer — rehydrate + class cleanup
// ---------------------------------------------------------------------------

/**
 * Restore values on the DValues auto-created for a freshly added attribute.
 * No-op when:
 *  - no OrphanStore entry matches {classId, attrName, attrType}
 *  - type mismatch (the user re-added with a different type — intentionally
 *    skip rather than attempt a cross-type conversion)
 *
 * On a successful match the entry is consumed (removed from the store).
 */
function tryRehydrate(
    lookup: any,
    classId: string,
    newAttrId: string,
): void {
    const dAttr = lookup?.[newAttrId];
    if (!dAttr || dAttr.className !== 'DAttribute') return;

    const attrName: string = dAttr.name ?? '';
    const attrType: string = typeof dAttr.type === 'string' ? dAttr.type : '';
    if (!attrName || !attrType) return;

    const key = makeKey(classId, attrName, attrType);
    const entry = orphanStore.get(key);
    if (!entry) return;

    const dValuesByObject = new Map<string, string>();
    for (const id in lookup) {
        const elem = lookup[id] as any;
        if (!elem || elem.className !== 'DValue') continue;
        if (elem.instanceof !== newAttrId) continue;
        const objectId = typeof elem.father === 'string' ? elem.father : '';
        if (objectId) dValuesByObject.set(objectId, id);
    }

    for (const [objectId, savedValues] of entry.valuesByObjectId) {
        const dValueId = dValuesByObject.get(objectId);
        if (!dValueId) continue;
        SetFieldAction.new(
            dValueId as any,
            'values' as any,
            savedValues as any,
            '',
            false,
        );
    }

    orphanStore.delete(key);
}

function purgeEntriesForClass(classId: string): void {
    for (const [key, entry] of orphanStore) {
        if (entry.classId === classId) orphanStore.delete(key);
    }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOrphanFeatures(
    modelid: string | undefined,
    _nodes: Node[],
): void {
    const lastSigRef = useRef<string>('');

    const currentSig = useSelector((state: any) => {
        return computeSignature(state?.idlookup, modelid);
    });

    useEffect(() => {
        if (currentSig === lastSigRef.current) return;

        const prev = parseSignature(lastSigRef.current);
        const curr = parseSignature(currentSig);

        const removedClasses = diffRemovedClasses(prev, curr);
        const addedTuples = diffAddedTuples(prev, curr);

        lastSigRef.current = currentSig;

        if (removedClasses.length === 0 && addedTuples.length === 0) return;

        const lookup = store.getState()?.idlookup as any;

        TRANSACTION('editor-v2 attribute co-evolution', () => {
            for (const classId of removedClasses) purgeEntriesForClass(classId);
            if (lookup) {
                for (const { classId, attrId } of addedTuples) {
                    tryRehydrate(lookup, classId, attrId);
                }
            }
        });
    }, [currentSig]);

    useEffect(() => {
        lastSigRef.current = '';
    }, [modelid]);
}
