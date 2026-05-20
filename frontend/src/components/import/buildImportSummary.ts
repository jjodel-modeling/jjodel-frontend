import { LModel, store } from '../../joiner';
import {
    EcoreImportSummary,
    XmiImportSummary,
    ImportSummary,
    ImportStatus,
} from './ImportSummary.types';

// Counter access strategy: bypass L-getter AND forward-links on the D-layer.
// Discovery 2026-05-19 (diag3/diag4): at the time buildEcoreImportSummary fires,
// `DPackage.classes` (forward link parent → children) is still empty because the
// SetFieldAction populating the collection has not been applied by the batched reducer
// yet. The DClass entries DO exist in `state.idlookup` and their `father` (backward link)
// IS set correctly by the parser during the synchronous Constructor pass.
//
// Therefore we count via idlookup filter on (className + father), not via package.classes.

function resolveRaw<T = any>(proxy: any): T | undefined {
    return (proxy?.__raw ?? proxy) as T | undefined;
}

function getState(): any {
    return store.getState() ?? {};
}

function getIdlookup(): Record<string, any> {
    return getState().idlookup ?? {};
}

function deriveStatus(warnings: string[]): ImportStatus {
    return warnings.length === 0 ? 'success' : 'success-with-warnings';
}

/**
 * Collect all package IDs reachable from a model: root packages + recursive subpackages.
 * Uses BFS via `subpackages` forward-link, which the parser populates synchronously
 * during parsePackageBody (different code path from `.classes`, hence reliable here).
 */
function collectAllPackageIds(modelRaw: any): Set<string> {
    const ids = new Set<string>();
    const idlookup = getIdlookup();
    const stack: string[] = [...((modelRaw?.packages as string[] | undefined) ?? [])];
    while (stack.length > 0) {
        const id = stack.pop()!;
        if (ids.has(id)) continue;
        ids.add(id);
        const pkg = idlookup[id];
        if (pkg?.subpackages?.length) stack.push(...pkg.subpackages);
    }
    return ids;
}

/**
 * Count entries in idlookup whose `className` matches and whose `father` is in the given set.
 * Robust to forward-link lag because `father` (backward link) IS eagerly set by the parser.
 */
function countByClassNameWithFatherIn(
    className: string,
    fatherIds: Set<string>
): number {
    const idlookup = getIdlookup();
    let count = 0;
    for (const id in idlookup) {
        const e = idlookup[id];
        if (e?.className === className && fatherIds.has(e.father)) count++;
    }
    return count;
}

/**
 * Collect IDs of all entries in idlookup whose className matches and whose father is in the set.
 */
function collectIdsByClassNameWithFatherIn(
    className: string,
    fatherIds: Set<string>
): Set<string> {
    const idlookup = getIdlookup();
    const out = new Set<string>();
    for (const id in idlookup) {
        const e = idlookup[id];
        if (e?.className === className && fatherIds.has(e.father)) out.add(id);
    }
    return out;
}

export function buildEcoreImportSummary(
    model: LModel,
    fileName: string,
    warnings: string[]
): EcoreImportSummary {
    const modelRaw = resolveRaw<any>(model);
    const idlookup = getIdlookup();

    const rootPackageId: string | undefined = (modelRaw?.packages ?? [])[0];
    const rootPkgRaw = rootPackageId ? idlookup[rootPackageId] : undefined;
    const rootPackageName = rootPkgRaw?.name || '(unnamed package)';
    const rawUri = rootPkgRaw?.uri ?? '';
    const rootPackageNsURI = rawUri || `(name: ${rootPackageName})`;

    const allPackageIds = collectAllPackageIds(modelRaw);
    const allClassIds = collectIdsByClassNameWithFatherIn('DClass', allPackageIds);

    const packageCount = allPackageIds.size;
    const classCount = allClassIds.size;
    const enumCount = countByClassNameWithFatherIn('DEnumerator', allPackageIds);
    // In Jjodel the D-layer datatype className is 'DDataType' (no 'DPrimitiveType' in the
    // current RuntimeAccessible registry); we still sum both in case a future variant lands.
    const dataTypeCount =
        countByClassNameWithFatherIn('DDataType', allPackageIds) +
        countByClassNameWithFatherIn('DPrimitiveType', allPackageIds);
    const attributeCount = countByClassNameWithFatherIn('DAttribute', allClassIds);
    const referenceCount = countByClassNameWithFatherIn('DReference', allClassIds);

    return {
        kind: 'metamodel',
        fileName,
        status: deriveStatus(warnings),
        modelName: modelRaw?.name ?? '(unnamed model)',
        rootPackageName,
        rootPackageNsURI,
        packageCount,
        classCount,
        attributeCount,
        referenceCount,
        enumCount,
        dataTypeCount,
        warnings,
    };
}

export function buildXmiImportSummary(
    model: LModel,
    metamodel: LModel | undefined,
    pattern: 'wrapper' | 'single-root' | 'unknown',
    fileName: string,
    warnings: string[]
): XmiImportSummary {
    const modelRaw = resolveRaw<any>(model);
    const metamodelRaw = metamodel ? resolveRaw<any>(metamodel) : undefined;
    const modelId: string | undefined = modelRaw?.id;
    const idlookup = getIdlookup();

    // Root objects: DObject whose father === modelId (parser-side eager backward link).
    // Nested objects: DObject whose father is a DValue (which itself lives under a DObject
    // chain rooted at modelId). For B.1 we keep the approximation rootCount = total;
    // B.2+ will distinguish.
    let rootObjectCount = 0;
    let allObjectsCount = 0;
    let valueCount = 0;
    if (modelId) {
        for (const id in idlookup) {
            const e = idlookup[id];
            if (e?.className === 'DObject') {
                allObjectsCount++;
                if (e.father === modelId) rootObjectCount++;
            } else if (e?.className === 'DValue' && e.father) {
                const ownerObj = idlookup[e.father];
                if (ownerObj?.className === 'DObject' && ownerObj.father === modelId) {
                    valueCount++;
                }
            }
        }
    }
    const nestedObjectCount = Math.max(0, allObjectsCount - rootObjectCount);

    const mmRootPkgId: string | undefined = metamodelRaw?.packages?.[0];
    const mmRootPkgRaw = mmRootPkgId ? idlookup[mmRootPkgId] : undefined;
    const metamodelName = mmRootPkgRaw?.name || metamodelRaw?.name || '(unknown metamodel)';
    const mmUri = mmRootPkgRaw?.uri ?? '';
    const metamodelNsURI = mmUri || `(name: ${metamodelName})`;

    return {
        kind: 'model',
        fileName,
        status: deriveStatus(warnings),
        modelName: modelRaw?.name ?? '(unnamed model)',
        metamodelName,
        metamodelNsURI,
        xmiPattern: pattern,
        rootObjectCount,
        nestedObjectCount,
        valueCount,
        warnings,
    };
}

export function buildErrorImportSummary(
    kind: 'metamodel' | 'model',
    fileName: string,
    errorMessage: string
): ImportSummary {
    if (kind === 'metamodel') {
        return {
            kind: 'metamodel',
            fileName,
            status: 'error',
            modelName: '',
            rootPackageName: '',
            rootPackageNsURI: '',
            packageCount: 0,
            classCount: 0,
            attributeCount: 0,
            referenceCount: 0,
            enumCount: 0,
            dataTypeCount: 0,
            warnings: [],
            errorMessage,
        };
    }
    return {
        kind: 'model',
        fileName,
        status: 'error',
        modelName: '',
        metamodelName: '',
        metamodelNsURI: '',
        xmiPattern: 'unknown',
        rootObjectCount: 0,
        nestedObjectCount: 0,
        valueCount: 0,
        warnings: [],
        errorMessage,
    };
}
