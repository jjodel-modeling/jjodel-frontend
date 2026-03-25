/**
 * Editor V2 — useEditorMode: detects and manages the editor mode (M2 vs M1).
 *
 * - M2 (metamodel): editing classes, enums, packages, datatypes
 * - M1 (model): editing object instances of a metamodel
 *
 * Detection logic:
 * 1. If mode is explicitly provided → use it
 * 2. If the model has a metamodelId / instanceof → M1
 * 3. Otherwise → M2
 *
 * For M1 mode, also resolves:
 * - All metamodel classes with their attributes and references
 * - Concrete subclasses for abstract types (hierarchy resolution)
 * - Rootable classes (concrete classes NOT targeted by any composition reference)
 *
 * IMPORTANT: Uses useSelector to subscribe to Redux store changes so that
 * mode detection and class resolution re-evaluate when the underlying JjOM
 * data changes (e.g. model loaded asynchronously, metamodel classes updated).
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { LPointerTargetable, store } from '../../../joiner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EditorMode = 'metamodel' | 'model';

export interface EditorModeInfo {
    /** The resolved editor mode */
    mode: EditorMode;
    /** If M1: the metamodel ID */
    metamodelId: string | null;
    /** All instantiable classes from the metamodel */
    allClasses: MetaclassInfo[];
    /** Classes that can be placed directly on the canvas (not composition targets) */
    rootableClasses: MetaclassInfo[];
}

export interface MetaclassInfo {
    id: string;
    name: string;
    isAbstract: boolean;
    attributes: MetaclassAttribute[];
    /** All references (including composition and non-composition) */
    references: MetaclassReference[];
    /** Pre-computed: concrete (non-abstract) subclasses, recursively */
    concreteSubclasses: MetaclassInfo[];
}

export interface MetaclassAttribute {
    id: string;
    name: string;
    type: string;          // type name (e.g. 'EString')
    lowerBound: number;
    upperBound: number;
}

export interface MetaclassReference {
    id: string;
    name: string;
    targetClassId: string;
    targetClassName: string;
    containment: boolean;  // true = composition
    aggregation: boolean;  // true = aggregation (not full containment)
    lowerBound: number;
    upperBound: number;    // -1 = unbounded
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Detect editor mode and gather M1 metadata.
 *
 * Subscribes to Redux via useSelector so that:
 * - metamodel reference detection re-evaluates when model data loads
 * - class/reference resolution re-evaluates when metamodel data changes
 */
export function useEditorMode(
    modelId: string | undefined,
    explicitMode?: EditorMode,
): EditorModeInfo {
    // ── Subscribe to Redux for metamodel reference ──────────────────────
    // This selector extracts the metamodel ID from the model's raw data
    // in the Redux store. When the model loads or its instanceof changes,
    // this triggers a re-render so the useMemo below re-evaluates.
    const metamodelRefFromStore = useSelector((state: any) => {
        if (!modelId) return null;
        const raw = state.idlookup?.[modelId] as any;
        if (!raw) return null;
        // Check instanceof (can be a string ID or an array of IDs)
        const ref = raw.instanceof ?? raw.metamodel;
        if (!ref) return null;
        if (Array.isArray(ref)) return ref[0] ?? null;
        return typeof ref === 'string' ? ref : null;
    });

    // ── Subscribe to metamodel class count for reactivity ───────────────
    // When the metamodel's classes change (added/removed), this triggers
    // re-evaluation of the rootable classes computation.
    // Classes can be at the model level OR inside packages/subpackages.
    const metamodelClassSignature = useSelector((state: any) => {
        const mmId = metamodelRefFromStore;
        if (!mmId) return '';
        const raw = state.idlookup?.[mmId] as any;
        if (!raw) return '';

        // Collect all class IDs from model + packages + subpackages
        const allClassIds: string[] = [];

        const collectClassIds = (containerId: string, depth = 0) => {
            if (depth > 10) return;
            const container = state.idlookup?.[containerId] as any;
            if (!container) return;
            // Direct classes on this container
            const classIds = container.classes ?? [];
            if (Array.isArray(classIds)) {
                for (const cid of classIds) {
                    const id = typeof cid === 'string' ? cid : null;
                    if (id) allClassIds.push(id);
                }
            }
            // Recurse into subpackages
            const subPkgs = container.subpackages ?? [];
            if (Array.isArray(subPkgs)) {
                for (const spId of subPkgs) {
                    const sid = typeof spId === 'string' ? spId : null;
                    if (sid) collectClassIds(sid, depth + 1);
                }
            }
        };

        // Collect from model directly
        collectClassIds(mmId);

        // Collect from packages
        const pkgIds = raw.packages ?? [];
        if (Array.isArray(pkgIds)) {
            for (const pid of pkgIds) {
                const pkgId = typeof pid === 'string' ? pid : null;
                if (pkgId) collectClassIds(pkgId);
            }
        }

        // Build signature from all collected class IDs
        const parts: string[] = [];
        for (const id of allClassIds) {
            const cls = state.idlookup?.[id] as any;
            if (!cls) continue;
            const refs = cls.allReferences ?? cls.references ?? [];
            const refCount = Array.isArray(refs) ? refs.length : 0;
            parts.push(`${id}:${cls.name}:${cls.abstract}:${refCount}`);
        }
        return parts.join('|');
    });

    return useMemo(() => {
        const empty: EditorModeInfo = {
            mode: 'metamodel',
            metamodelId: null,
            allClasses: [],
            rootableClasses: [],
        };

        if (!modelId) return empty;

        // If explicitly set, use it
        if (explicitMode) {
            if (explicitMode === 'model') {
                return resolveM1Info(modelId);
            }
            return empty;
        }

        // Auto-detect: use the metamodel reference from the Redux selector
        if (metamodelRefFromStore) {
            return resolveM1Info(modelId, metamodelRefFromStore);
        }

        // Fallback: try LProxy (in case the selector missed something)
        try {
            const lModel: any = LPointerTargetable.fromPointer(modelId);
            const metamodelRef = lModel?.instanceof ?? lModel?.metamodel ?? lModel?.__raw?.instanceof;

            if (metamodelRef) {
                const metamodelId = typeof metamodelRef === 'string' ? metamodelRef : metamodelRef?.id;
                if (metamodelId) {
                    return resolveM1Info(modelId, metamodelId);
                }
            }
        } catch {
            // LProxy fallback failed — fall through to M2
        }

        return empty;
    }, [modelId, explicitMode, metamodelRefFromStore, metamodelClassSignature]);
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/**
 * Resolve M1 info: find the metamodel and its full class hierarchy.
 */
function resolveM1Info(modelId: string, knownMetamodelId?: string): EditorModeInfo {
    let metamodelId: string | null = knownMetamodelId ?? null;

    try {
        // Find the metamodel if not provided
        if (!metamodelId) {
            const lModel: any = LPointerTargetable.fromPointer(modelId);
            const metamodelRef = lModel?.instanceof ?? lModel?.metamodel ?? lModel?.__raw?.instanceof;
            metamodelId = typeof metamodelRef === 'string' ? metamodelRef : metamodelRef?.id ?? null;
        }

        if (!metamodelId) {
            return {
                mode: 'model',
                metamodelId: null,
                allClasses: [],
                rootableClasses: [],
            };
        }

        // Read all classes from the metamodel.
        // Classes can be at the model level AND/OR nested inside packages/subpackages.
        // We traverse the full hierarchy to collect every class.
        const lMetamodel: any = LPointerTargetable.fromPointer(metamodelId);

        const allLClasses: any[] = [];

        // Strategy 1: Collect class IDs from raw Redux state, then resolve via LProxy
        // This is more reliable than traversing LProxy containers because
        // LProxy getters can silently return empty arrays.
        try {
            const state = store.getState();
            const allClassIds: string[] = [];

            const collectClassIdsFromRaw = (containerId: string, depth = 0) => {
                if (depth > 10) return;
                const container = state.idlookup?.[containerId] as any;
                if (!container) return;
                // Direct classes on this container
                const classIds = container.classes ?? container.classifiers ?? [];
                if (Array.isArray(classIds)) {
                    for (const cid of classIds) {
                        const id = typeof cid === 'string' ? cid : null;
                        if (id) allClassIds.push(id);
                    }
                }
                // Recurse into subpackages
                const subPkgs = container.subpackages ?? [];
                if (Array.isArray(subPkgs)) {
                    for (const spId of subPkgs) {
                        const sid = typeof spId === 'string' ? spId : null;
                        if (sid) collectClassIdsFromRaw(sid, depth + 1);
                    }
                }
            };

            // Collect from model directly
            collectClassIdsFromRaw(metamodelId);

            // Collect from packages
            const rawMM = state.idlookup?.[metamodelId] as any;
            const pkgIds = rawMM?.packages ?? [];
            if (Array.isArray(pkgIds)) {
                for (const pid of pkgIds) {
                    const pkgId = typeof pid === 'string' ? pid : null;
                    if (pkgId) collectClassIdsFromRaw(pkgId);
                }
            }

            // Resolve each class ID via LProxy
            for (const classId of allClassIds) {
                try {
                    const lClass: any = LPointerTargetable.fromPointer(classId);
                    if (lClass?.id) allLClasses.push(lClass);
                } catch { /* skip unresolvable */ }
            }

        } catch {
            // Redux class collection failed — fall through to LProxy strategy
        }

        // Strategy 2 (fallback): Try LProxy traversal if Redux approach found nothing
        if (allLClasses.length === 0) {
            const collectClasses = (container: any, depth = 0) => {
                if (!container || depth > 10) return;
                try {
                    const directClasses = container.classes ?? [];
                    for (const cls of directClasses) {
                        if (cls?.id) allLClasses.push(cls);
                    }
                } catch { /* proxy can throw */ }
                try {
                    const subPkgs = container.subpackages ?? [];
                    for (const subPkg of subPkgs) {
                        collectClasses(subPkg, depth + 1);
                    }
                } catch { /* proxy can throw */ }
            };

            collectClasses(lMetamodel);
            try {
                const packages = lMetamodel?.packages ?? [];
                for (const pkg of packages) {
                    collectClasses(pkg);
                }
            } catch { /* proxy can throw */ }

            // Also try allSubClasses if available (JjOM computed property)
            if (allLClasses.length === 0) {
                try {
                    const allSub = lMetamodel?.allSubClasses ?? [];
                    for (const cls of allSub) {
                        if (cls?.id) allLClasses.push(cls);
                    }
                } catch { /* ignore */ }
            }

        }

        // First pass: build raw class info (without concreteSubclasses)
        const rawClasses: MetaclassInfo[] = [];
        const classById = new Map<string, MetaclassInfo>();

        // Track which classes extend which (child → parent IDs)
        const extendsMap = new Map<string, string[]>();

        for (const cls of allLClasses) {
            const classId = cls.id ?? '';
            if (!classId) continue;

            // Gather attributes
            const attributes: MetaclassAttribute[] = [];
            try {
                for (const attr of (cls.attributes ?? [])) {
                    attributes.push({
                        id: attr.id ?? '',
                        name: attr.name ?? 'unnamed',
                        type: attr.type?.name ?? 'EString',
                        lowerBound: attr.lowerBound ?? 0,
                        upperBound: attr.upperBound ?? 1,
                    });
                }
            } catch { /* proxy can throw */ }

            // Gather references
            const references: MetaclassReference[] = [];
            try {
                for (const ref of (cls.allReferences ?? cls.references ?? [])) {
                    references.push({
                        id: ref.id ?? '',
                        name: ref.name ?? 'unnamed',
                        targetClassId: ref.type?.id ?? '',
                        targetClassName: ref.type?.name ?? '',
                        containment: !!(ref.composition),
                        aggregation: !!(ref.aggregation),
                        lowerBound: ref.lowerBound ?? 0,
                        upperBound: ref.upperBound ?? -1,
                    });
                }
            } catch { /* proxy can throw */ }

            // Track extends
            try {
                const supers = cls.extends ?? [];
                const superIds: string[] = [];
                for (const sup of supers) {
                    const supId = typeof sup === 'string' ? sup : sup?.id;
                    if (supId) superIds.push(supId);
                }
                if (superIds.length > 0) extendsMap.set(classId, superIds);
            } catch { /* ignore */ }

            const info: MetaclassInfo = {
                id: classId,
                name: cls.name ?? 'Unnamed',
                isAbstract: !!(cls.abstract || cls.interface),
                attributes,
                references,
                concreteSubclasses: [],  // filled in second pass
            };

            rawClasses.push(info);
            classById.set(classId, info);
        }

        // Second pass: compute concrete subclasses for each class
        // Build reverse map: parent → direct children
        const childrenMap = new Map<string, string[]>();
        for (const [childId, parentIds] of extendsMap) {
            for (const parentId of parentIds) {
                const existing = childrenMap.get(parentId) ?? [];
                existing.push(childId);
                childrenMap.set(parentId, existing);
            }
        }

        // Recursive function to get all concrete descendants
        const getConcreteDescendants = (classId: string, visited: Set<string> = new Set()): MetaclassInfo[] => {
            if (visited.has(classId)) return [];
            visited.add(classId);

            const result: MetaclassInfo[] = [];
            const directChildren = childrenMap.get(classId) ?? [];

            for (const childId of directChildren) {
                const childInfo = classById.get(childId);
                if (!childInfo) continue;

                if (!childInfo.isAbstract) {
                    result.push(childInfo);
                }
                // Recurse to get grandchildren etc.
                result.push(...getConcreteDescendants(childId, visited));
            }

            return result;
        }

        // Fill concreteSubclasses for each class
        for (const cls of rawClasses) {
            cls.concreteSubclasses = getConcreteDescendants(cls.id);
        }

        // Third pass: compute rootable classes
        // A rootable class is: concrete AND not targeted by any composition reference
        const compositionTargetIds = new Set<string>();
        for (const cls of rawClasses) {
            for (const ref of cls.references) {
                if (ref.containment) {
                    // The target class and all its concrete subclasses are composition targets
                    compositionTargetIds.add(ref.targetClassId);
                    const targetInfo = classById.get(ref.targetClassId);
                    if (targetInfo) {
                        for (const sub of targetInfo.concreteSubclasses) {
                            compositionTargetIds.add(sub.id);
                        }
                    }
                }
            }
        }

        const rootableClasses = rawClasses.filter(
            c => !c.isAbstract && !compositionTargetIds.has(c.id)
        );

        return {
            mode: 'model',
            metamodelId,
            allClasses: rawClasses,
            rootableClasses,
        };
    } catch {
        return {
            mode: 'model',
            metamodelId,
            allClasses: [],
            rootableClasses: [],
        };
    }
}
