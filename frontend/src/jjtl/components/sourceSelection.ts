/**
 * Pure logic of the source models of a run (R-JTG-26, R-JTG-27, R-JTG-31).
 * A run has one primary model and, optionally, further models of the same metamodel.
 * Kept out of the dialog and of ProjectEditor so that it can run in a test.
 */

/** The record of a run, written on the output model as `_state.generatedBy`. */
export interface RunRecord {
    transformationId: string;
    sourceModelId: string;
    /** The models included besides the primary. Absent when there were none, and on older records. */
    includedModelIds?: string[];
    timestamp: number;
}

/** The ids to pass to a run: checked, not the primary, in the order of the list. */
export function orderIncludedIds(
    compatibleIds: string[],
    checkedIds: string[],
    primaryId: string
): string[] {
    return compatibleIds.filter(id => id !== primaryId && checkedIds.includes(id));
}

/**
 * The source argument of the executor. With nothing included it is the primary's
 * array, as it has always been; otherwise the list of R-JTG-31, primary first.
 */
export function buildSourceArgument<T>(primary: T[], included: T[][]): T[] | T[][] {
    return included.length === 0 ? primary : [primary, ...included];
}

/** The record of a run. With nothing included it has no `includedModelIds` key at all. */
export function buildRunRecord(
    transformationId: string,
    sourceModelId: string,
    includedModelIds: string[],
    timestamp: number
): RunRecord {
    if (includedModelIds.length === 0) return { transformationId, sourceModelId, timestamp };
    return { transformationId, sourceModelId, includedModelIds, timestamp };
}

/** The most recent record of a transformation, among those of the output models. */
export function latestRunOf(
    records: Array<RunRecord | null | undefined>,
    transformationId: string
): RunRecord | null {
    let latest: RunRecord | null = null;
    for (const record of records) {
        if (record?.transformationId !== transformationId) continue;
        if (!latest || record.timestamp > latest.timestamp) latest = record;
    }
    return latest;
}

/**
 * The selection a new run of the dialog starts from, or null when the dialog starts
 * as usual: no record, an older record, a run with nothing included, a primary that
 * is gone, or no included model left.
 */
export function restoredSources(
    record: RunRecord | null | undefined,
    compatibleIds: string[]
): { primaryId: string; includedIds: string[] } | null {
    if (!record?.includedModelIds?.length) return null;
    if (!compatibleIds.includes(record.sourceModelId)) return null;
    const includedIds = orderIncludedIds(compatibleIds, record.includedModelIds, record.sourceModelId);
    if (includedIds.length === 0) return null;
    return { primaryId: record.sourceModelId, includedIds };
}
