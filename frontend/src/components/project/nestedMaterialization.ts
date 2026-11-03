/**
 * Materialization of JjTL nested creations, level by level, to any depth (P-2026-10-30-1335).
 *
 * The executor returns every object a rule creates inside a feature (`-> feature { ... }`) as a plain
 * object marked `__nested`, held by the feature of the object that owns it, and that object may own
 * nested objects in turn. STEP 6c of `handleExecuteTransformation` (ProjectEditor.tsx) hands this module
 * the nested values found on the ROOTS, each with the root's id, and this module creates them and
 * everything below them.
 *
 * Measured in docs/discovery/discovery_2026-10-30_jjtl_nested_materialization.md §4:
 * - the slots of an object `LValue.addObject` just created do not exist synchronously; they answer
 *   90-316 ms later. So each level waits for the slots of the level above, polled by id;
 * - an explicit name in the `addObject` json is refused for a second sibling of the same name in one
 *   slot (R-S1-2), and refused outright on a class with no `name` attribute (schema mismatch).
 *   So every nested object is created with `{}` and gets `name` by id with its other attributes
 *   (R-S1-6, docs/decisions.md).
 *
 * Rule targets placed in a containment (slice A, SPEC §5.3.1) take the same path: the executor
 * marks them `__nested` in the container's feature (P-2026-11-02-2108) and lists them in
 * `targetModel.containment`, so the walk finds them with one test; an unmarked rule target is
 * never walked. A placed target is created where it is placed and nowhere else, in the
 * feature's order, and the walk returns its created id so that pointers to it can be written
 * once everything exists.
 *
 * Pure: no store, no joiner import (the joiner barrel does not load under vitest). The caller passes
 * the slot reader, the class table and the clock.
 */

/** The slice of an `LValue` slot this module calls. */
export interface NestedSlot {
    addObject(json: Record<string, any>, className: string): any;
}

/** What the walk needs to know of a target class. */
export interface NestedClassInfo {
    attributeNames: Set<string>;
    referenceNames: Set<string>;
}

export interface NestedDeps {
    /** The `$feature` slot of the object with this id, once it answers `addObject`; undefined before. */
    slotOf(objectId: string, featureName: string): NestedSlot | undefined;
    classInfo(className: string): NestedClassInfo | undefined;
    sleep(ms: number): Promise<void>;
    now(): number;
    warn(message: string): void;
    /** Commits the writes queued in the open transaction block, once per level before its wait (#486). */
    flush?(): Promise<void>;
}

/** A feature of an object already in the store, and the executor objects to create inside it. */
export interface NestedJob {
    parentId: string;
    /** Where the parent sits, for messages: `root.feature[i].feature[j]`. */
    path: string;
    featureName: string;
    children: any[];
}

export interface NestedUnplaced {
    /** Path of the object (or of the feature, when a whole feature is lost). */
    path: string;
    className?: string;
    /** The object itself and every nested object below it. */
    count: number;
    reason: string;
}

export interface NestedAttributeSet {
    objectId: string;
    className: string;
    attributes: Record<string, any>;
}

/** Pointer values of an object the walk created, written once every level exists. */
export interface NestedReferenceSet {
    objectId: string;
    className: string;
    path: string;
    references: Record<string, { targets: any[] }>;
}

export interface NestedResult {
    created: number;
    levels: number;
    attributeSets: NestedAttributeSet[];
    unplaced: NestedUnplaced[];
    /** Executor object -> id `addObject` returned for it. */
    createdIds?: Map<any, string>;
    /** `__ref_result` values of created objects, by created id (no longer dropped). */
    referenceSets?: NestedReferenceSet[];
}

/** What the nested-attribute writer could not write (#482): said to the user, never only to the console. */
export interface NestedUnwritten {
    /** Objects with at least one attribute value not written. */
    objects: number;
    /** Attribute values not written. */
    attributes: number;
    reason: string;
}

/** Detail of `SystemEvents.JJTL_NESTED_MATERIALIZED`, read by the JjTL output panel. */
export interface NestedMaterializationReport {
    modelName: string;
    created: number;
    unplaced: NestedUnplaced[];
    /** Set when some attribute values of the created objects were not written (#482). */
    unwritten?: NestedUnwritten;
}

export const SLOT_POLL_MS = 50;
/**
 * The walk gives up the slots of a level after this long WITHOUT PROGRESS (#486): no slot of the
 * level answered for this many polls, counted as `SLOT_WAIT_CAP_MS / SLOT_POLL_MS` poll intervals,
 * not read off the clock. A long task holds the commit as well as the poll, so it is one interval,
 * never the whole window: at load 13.4 one 3,004 ms task used to drop 2,048 `Const`.
 */
export const SLOT_WAIT_CAP_MS = 3000;
/**
 * Bound of all the walk's slot waits together, on the clock (#486): the stall window alone would
 * wait without end under a store that keeps answering one slot at a time, or for 60 polls of any
 * length. 60 s is above every whole run measured from the click (b11_9 at load 102.6: 44.7 s), so
 * it fires only on a store that has stopped; what it drops is reported as not placed.
 */
export const NESTED_WALK_WAIT_CAP_MS = 60000;
/** Bound of the attribute writer's wait for the slots of the last level (#482). */
export const ATTRIBUTE_WAIT_CAP_MS = 10000;

const isNested = (v: any): boolean => !!(v && typeof v === 'object' && v.__nested);

/**
 * The features of an executor object that hold nested creations or placed rule targets
 * (both marked `__nested`), with those objects in the feature's order.
 */
export function nestedFeaturesOf(obj: any): Array<[string, any[]]> {
    const out: Array<[string, any[]]> = [];
    if (!obj || typeof obj !== 'object') return out;
    for (const [key, val] of Object.entries(obj)) {
        if (key.startsWith('__')) continue;
        const children = (Array.isArray(val) ? val : [val]).filter(isNested);
        if (children.length > 0) out.push([key, children]);
    }
    return out;
}

/** The objects, nested ones included, that a list of executor objects stands for. */
export function countSubtree(children: any[]): number {
    let n = 0;
    for (const child of children) {
        n++;
        for (const [, kids] of nestedFeaturesOf(child)) n += countSubtree(kids);
    }
    return n;
}

/**
 * The root targets STEP 6 created, by the executor object that stands for each (slice B2).
 * Called, lazy and fresh rules may give one source element several targets, so a pointer
 * resolves by the object it holds, never by its source id alone. The source id is a fallback
 * for a target that is not the same object, and only when it names one root: two roots of one
 * source make it ambiguous, reported rather than guessed.
 */
export interface RootTargetIndex {
    add(target: any, objectName: string): void;
    /** The D-layer name of a root target, or why there is none. */
    nameOf(target: any): { name?: string; reason?: string };
}

export function makeRootTargetIndex(): RootTargetIndex {
    const byIdentity = new Map<any, string>();
    const bySourceId = new Map<string, string[]>();
    return {
        add(target, objectName) {
            if (target && typeof target === 'object') byIdentity.set(target, objectName);
            const sourceId = target?.__sourceId;
            if (sourceId == null) return;
            const names = bySourceId.get(String(sourceId)) ?? [];
            names.push(objectName);
            bySourceId.set(String(sourceId), names);
        },
        nameOf(target) {
            const own = target && typeof target === 'object' ? byIdentity.get(target) : undefined;
            if (own) return { name: own };
            const sourceId = target?.__sourceId;
            if (sourceId == null) {
                return target?.name ? { name: target.name } : { reason: 'target has no __sourceId or name' };
            }
            const names = bySourceId.get(String(sourceId)) ?? [];
            if (names.length === 1) return { name: names[0] };
            if (names.length === 0) return { reason: `sourceId not found in map: ${sourceId}` };
            return { reason: `sourceId ${sourceId} names ${names.length} root targets (${names.join(', ')}); none chosen` };
        },
    };
}

/** The json `addObject` receives for a nested object: always empty (R-S1-6). */
export function nestedCreationJson(): Record<string, any> {
    return {};
}

/** The attribute values of an executor object that its class declares, `name` included when declared. */
export function nestedAttributesOf(child: any, info: NestedClassInfo): Record<string, any> {
    const attrs: Record<string, any> = {};
    for (const [k, v] of Object.entries(child)) {
        if (!info.attributeNames.has(k)) continue;
        if (v === undefined || v === null) continue;
        attrs[k] = v;
    }
    return attrs;
}

/**
 * Creates the nested objects of `jobs` and, level by level, the nested objects of what it created.
 * Before each level it flushes once (`deps.flush`, when given), then polls the slots that level writes
 * into, every `pollMs`, until `capMs` of polls pass with no slot answering, or every wait of the walk
 * together reaches `totalCapMs` (#486); a slot that does not answer loses its objects, which are warned
 * and counted as unplaced. Attributes are not written here: they come back in `attributeSets`, keyed by
 * the created id.
 */
export async function materializeNested(
    jobs: NestedJob[],
    deps: NestedDeps,
    pollMs: number = SLOT_POLL_MS,
    capMs: number = SLOT_WAIT_CAP_MS,
    totalCapMs: number = NESTED_WALK_WAIT_CAP_MS,
): Promise<NestedResult> {
    const createdIds = new Map<any, string>();
    const referenceSets: NestedReferenceSet[] = [];
    const result: NestedResult = { created: 0, levels: 0, attributeSets: [], unplaced: [], createdIds, referenceSets };
    const subtree = (children: any[]) => countSubtree(children);
    const lose = (u: NestedUnplaced) => {
        result.unplaced.push(u);
        deps.warn(`Nested: ${u.path}${u.className ? ' (' + u.className + ')' : ''} not placed, `
            + `${u.count} object(s): ${u.reason}`);
    };

    let waitedMs = 0;
    let level = jobs.filter(j => j.children.length > 0);
    while (level.length > 0) {
        result.levels++;

        // Wait for every slot this level writes into: the flush commits what the level above
        // created, so the slots need not wait for the interval's commit; the polls cover the rest.
        const ready = new Map<NestedJob, NestedSlot>();
        let waiting = level;
        const start = deps.now();
        if (deps.flush) await deps.flush();
        let stalledMs = 0;
        let gaveUp = '';
        for (;;) {
            const answered = ready.size;
            waiting = waiting.filter(job => {
                const slot = deps.slotOf(job.parentId, job.featureName);
                if (slot) ready.set(job, slot);
                return !slot;
            });
            if (waiting.length === 0) break;
            if (ready.size > answered) stalledMs = 0;
            if (stalledMs >= capMs) { gaveUp = ` after ${capMs} ms without a slot answering`; break; }
            if (waitedMs + deps.now() - start >= totalCapMs) {
                gaveUp = `: the walk waited ${totalCapMs} ms for slots in total`;
                break;
            }
            await deps.sleep(pollMs);
            stalledMs += pollMs;
        }
        waitedMs += deps.now() - start;
        for (const job of waiting) {
            lose({
                path: `${job.path}.${job.featureName}`, count: subtree(job.children),
                reason: `feature "${job.featureName}" not available${gaveUp}`,
            });
        }

        // Create the level, in order, and collect the next one against the ids just returned.
        const next: NestedJob[] = [];
        for (const job of level) {
            const slot = ready.get(job);
            if (!slot) continue;
            job.children.forEach((child, i) => {
                const path = `${job.path}.${job.featureName}[${i}]`;
                const className: string | undefined = child.__type || child.className;
                const info = className ? deps.classInfo(className) : undefined;
                if (!className || !info) {
                    lose({ path, className, count: subtree([child]), reason: `class "${className}" not found in the target metamodel` });
                    return;
                }
                let created: any;
                let failure = 'addObject returned nothing';
                try {
                    created = slot.addObject(nestedCreationJson(), className);
                } catch (e: any) {
                    failure = 'addObject failed: ' + (e && e.message || e);
                }
                if (!created || !created.id) {
                    lose({ path, className, count: subtree([child]), reason: failure });
                    return;
                }
                result.created++;
                createdIds.set(child, created.id);

                const attributes = nestedAttributesOf(child, info);
                if (Object.keys(attributes).length > 0) {
                    result.attributeSets.push({ objectId: created.id, className, attributes });
                }

                const nestedKeys = new Set<string>();
                for (const [key, kids] of nestedFeaturesOf(child)) {
                    nestedKeys.add(key);
                    if (!info.referenceNames.has(key)) {
                        lose({ path: `${path}.${key}`, count: subtree(kids), reason: `'${key}' is not a reference of '${className}'` });
                        continue;
                    }
                    next.push({ parentId: created.id, path, featureName: key, children: kids });
                }

                // Pointers to rule targets: queued by the created id and written by the caller
                // once every level exists, so a target placed further on is there to point at.
                const references: Record<string, { targets: any[] }> = {};
                for (const [key, val] of Object.entries(child)) {
                    if (key.startsWith('__') || nestedKeys.has(key)) continue;
                    if (!val || typeof val !== 'object' || !(val as any).__ref_result) continue;
                    nestedKeys.add(key);
                    if (!info.referenceNames.has(key)) {
                        deps.warn(`Nested: ${path} (${className}): '${key}' is not a reference of '${className}'. `
                            + `Pointer dropped.`);
                        continue;
                    }
                    references[key] = val as { targets: any[] };
                }
                if (Object.keys(references).length > 0) {
                    referenceSets.push({ objectId: created.id, className, path, references });
                }

                // Anything left over is a value the model will not receive (SPEC.md §9.2).
                for (const [key, val] of Object.entries(child)) {
                    if (key.startsWith('__')) continue;
                    if (key === 'id' || key === 'name' || key === 'className') continue;
                    if (val === undefined || val === null) continue;
                    if (info.attributeNames.has(key) || nestedKeys.has(key)) continue;
                    deps.warn(`Nested: ${path} (${className}): '${key}' is neither an attribute nor a nested `
                        + `creation nor a resolved reference of '${className}'. Value dropped.`);
                }
            });
        }
        level = next;
    }
    return result;
}

/** What a bounded wait for slots needs of the store (#482). */
export interface NestedWaitDeps {
    /** Lets every write already queued in the open transaction block reach the store now. */
    flush(): Promise<void>;
    /** The slots of this object that do not answer yet; all of them while the object does not resolve. */
    missing(objectId: string, slots: string[]): string[];
    sleep(ms: number): Promise<void>;
    now(): number;
}

/** An object the walk created, and the slots a writer is about to write into. */
export interface NestedSlotWait {
    objectId: string;
    slots: string[];
}

/**
 * Waits until the slots of objects the walk created answer, bounded (#482).
 *
 * The last level's objects sit in the app's open transaction block until a commit dispatches them:
 * the interval's every `U.UpdatingTimer`, whose dispatch is a `setTimeout(0)`. A writer started on a
 * fixed timer ran before that dispatch when long tasks held the thread (5,119 objects: 2,048 `num` lost,
 * docs/discovery/discovery_2026-11-03_jjtl_writeback_time.md §5). So this flushes, then polls, every
 * `pollMs` for at most `capMs`, in creation order, which is also commit order: the scan stops at the
 * first object that does not answer. Returns how many answered, in order, and how long it took.
 */
export async function awaitNestedSlots(
    waits: NestedSlotWait[],
    deps: NestedWaitDeps,
    pollMs: number = SLOT_POLL_MS,
    capMs: number = ATTRIBUTE_WAIT_CAP_MS,
): Promise<{ answered: number; waitedMs: number }> {
    if (waits.length === 0) return { answered: 0, waitedMs: 0 };
    const start = deps.now();
    let answered = 0;
    for (;;) {
        await deps.flush();
        while (answered < waits.length && deps.missing(waits[answered].objectId, waits[answered].slots).length === 0) answered++;
        if (answered === waits.length || deps.now() - start >= capMs) break;
        await deps.sleep(pollMs);
    }
    return { answered, waitedMs: deps.now() - start };
}

/** What the nested-attribute writer needs of the store (#482). */
export interface NestedAttributeDeps extends NestedWaitDeps {
    /** Writes one value; false when the slot is missing at write time. */
    write(set: NestedAttributeSet, attrName: string, value: any): boolean;
    warn(message: string): void;
}

export interface NestedAttributeResult {
    /** Attribute values written. */
    written: number;
    /** From the call to the first write, flushes included. */
    waitedMs: number;
    /** Absent when every value was written. */
    unwritten?: NestedUnwritten;
}

/**
 * Writes the attributes the walk queued, once their slots answer (`awaitNestedSlots`), then counts
 * every value it could not write, slot missing, refused or throwing, for the caller to report (#482).
 *
 * `addObject` also seeds its json values on a timer of `U.UpdatingTimer * 2`; the walk gives it `{}`
 * (`nestedCreationJson`), so that timer writes nothing this writer waits for.
 */
export async function writeNestedAttributeSets(
    sets: NestedAttributeSet[],
    deps: NestedAttributeDeps,
    pollMs: number = SLOT_POLL_MS,
    capMs: number = ATTRIBUTE_WAIT_CAP_MS,
): Promise<NestedAttributeResult> {
    if (sets.length === 0) return { written: 0, waitedMs: 0 };
    const waits = sets.map(s => ({ objectId: s.objectId, slots: Object.keys(s.attributes) }));
    const { answered, waitedMs } = await awaitNestedSlots(waits, deps, pollMs, capMs);
    const capped = answered < sets.length;

    let written = 0;
    let lostObjects = 0;
    let lostValues = 0;
    for (const set of sets) {
        let lost = 0;
        for (const [attrName, value] of Object.entries(set.attributes)) {
            let ok = false;
            try { ok = deps.write(set, attrName, value); } catch { ok = false; }
            if (ok) written++;
            else lost++;
        }
        if (lost > 0) { lostObjects++; lostValues += lost; }
    }
    if (lostValues === 0) return { written, waitedMs };
    const unwritten: NestedUnwritten = {
        objects: lostObjects, attributes: lostValues,
        reason: capped ? `attribute slots not available after ${capMs} ms` : 'attribute slot missing when written',
    };
    deps.warn(`Nested: ${lostValues} attribute value(s) of ${lostObjects} object(s) not written: ${unwritten.reason}`);
    return { written, waitedMs, unwritten };
}

/** The output panel's line for attribute values the writer could not write (#482); null when none. */
export function formatNestedUnwritten(report: NestedMaterializationReport): string | null {
    const u = report.unwritten;
    if (!u || u.attributes === 0) return null;
    return `Attributes not written in "${report.modelName}": ${u.attributes} value(s) of ${u.objects} object(s): ${u.reason}`;
}

/** How long the store must go without a dispatch before a run's undo group closes: above the 300 ms batch interval. */
export const RUN_QUIET_MS = 800;
/** How often the closer of a run's undo group looks again. */
export const RUN_UNDO_POLL_MS = 100;
/**
 * The longest a run's undo group stays open, on the clock (#458): a write-back that never settles, or a store
 * that never goes quiet, would otherwise fold every later edit into the run's step. Above the whole b11_9 run.
 */
export const RUN_UNDO_CAP_MS = 180000;

/** What the undo step of a JjTL run needs of the store (#458). */
export interface RunUndoDeps {
    /** `beginUndoGroup` / `endUndoGroup` (reducer.ts, R-JJD-6). */
    begin(): void;
    end(): void;
    /** Lets every write already queued in the open transaction block reach the store now. */
    flush(): Promise<void>;
    /** Called on every store notification; returns the unsubscribe. */
    subscribe(listener: () => void): () => void;
    sleep(ms: number): Promise<void>;
    now(): number;
}

export interface RunUndoClose {
    /** From the call to close to the end of the group. */
    waitedMs: number;
    /** True when the group closed at `RUN_UNDO_CAP_MS`, not after the last write. */
    capped: boolean;
}

export interface RunUndoStep {
    /**
     * Closes the group once `writes` has settled and the store has been quiet for `RUN_QUIET_MS` since its last
     * write and since `notBefore`; at `RUN_UNDO_CAP_MS` in any case. A second call returns the first call's promise.
     */
    close(writes?: Promise<unknown>, notBefore?: number): Promise<RunUndoClose>;
}

/**
 * Opens the undo group of a JjTL run (#458, as a script Apply, R-PLG-5): one Undo removes everything the run
 * wrote. The run writes after `handleExecuteTransformation` returns (STEP 7 opens the tab on a timer, STEP 8
 * writes on another, the tab's canvas makes its vertices once mounted), so the group closes on a quiet store,
 * not at a line. The group is not a TRANSACTION: it wraps no creator (CLAUDE.md rule 12).
 */
export async function openRunUndoStep(
    deps: RunUndoDeps,
    quietMs: number = RUN_QUIET_MS,
    pollMs: number = RUN_UNDO_POLL_MS,
    capMs: number = RUN_UNDO_CAP_MS,
): Promise<RunUndoStep> {
    await deps.flush();
    deps.begin();
    let closing: Promise<RunUndoClose> | null = null;
    return {
        close: (writes = Promise.resolve(), notBefore = 0) =>
            closing ??= closeRunUndoStep(deps, writes, notBefore, quietMs, pollMs, capMs),
    };
}

async function closeRunUndoStep(
    deps: RunUndoDeps, writes: Promise<unknown>, notBefore: number, quietMs: number, pollMs: number, capMs: number,
): Promise<RunUndoClose> {
    const start = deps.now();
    const deadline = start + capMs;
    let lastWrite = start;
    const off = deps.subscribe(() => { lastWrite = deps.now(); });
    let settled = false;
    writes.then(() => { settled = true; }, () => { settled = true; });
    let capped = false;
    try {
        for (;;) {
            await deps.flush();
            const now = deps.now();
            // Quiet counts from the deadline too: the tab opened at it writes its canvas only once mounted.
            if (settled && now - Math.max(lastWrite, notBefore) >= quietMs) break;
            if (now >= deadline) { capped = true; break; }
            await deps.sleep(Math.min(pollMs, deadline - now));
        }
    } finally {
        off();
        deps.end();
    }
    return { waitedMs: deps.now() - start, capped };
}
