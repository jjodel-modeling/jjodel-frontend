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
 * leaves them unmarked in the container's feature and lists them in `targetModel.containment`,
 * and the caller's `isPlacedIn` tells the walk which values of a feature they are. A placed
 * target is created where it is placed and nowhere else, in the feature's order, and the walk
 * returns its created id so that pointers to it can be written once everything exists.
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
    /**
     * `child` is a rule target placed in `featureName` of `parent` (slice A). Absent: only
     * `__nested` objects are created, as before.
     */
    isPlacedIn?(child: any, parent: any, featureName: string): boolean;
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

/** Detail of `SystemEvents.JJTL_NESTED_MATERIALIZED`, read by the JjTL output panel. */
export interface NestedMaterializationReport {
    modelName: string;
    created: number;
    unplaced: NestedUnplaced[];
}

export const SLOT_POLL_MS = 50;
export const SLOT_WAIT_CAP_MS = 3000;

const isNested = (v: any): boolean => !!(v && typeof v === 'object' && v.__nested);

/** Tells whether a value of `parent.featureName` is a rule target placed there (slice A). */
export type IsPlacedIn = (child: any, parent: any, featureName: string) => boolean;

/**
 * The features of an executor object that hold nested creations or placed rule targets,
 * with those objects in the feature's order.
 */
export function nestedFeaturesOf(obj: any, isPlacedIn?: IsPlacedIn): Array<[string, any[]]> {
    const out: Array<[string, any[]]> = [];
    if (!obj || typeof obj !== 'object') return out;
    for (const [key, val] of Object.entries(obj)) {
        if (key.startsWith('__')) continue;
        const children = (Array.isArray(val) ? val : [val]).filter(
            v => isNested(v) || (!!isPlacedIn && !!v && typeof v === 'object' && isPlacedIn(v, obj, key))
        );
        if (children.length > 0) out.push([key, children]);
    }
    return out;
}

/** The objects, nested ones included, that a list of executor objects stands for. */
export function countSubtree(children: any[], isPlacedIn?: IsPlacedIn): number {
    let n = 0;
    for (const child of children) {
        n++;
        for (const [, kids] of nestedFeaturesOf(child, isPlacedIn)) n += countSubtree(kids, isPlacedIn);
    }
    return n;
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
 * Before each level it polls the slots that level writes into, every `pollMs`, for at most `capMs`;
 * a slot that does not answer loses its objects, which are warned and counted as unplaced.
 * Attributes are not written here: they come back in `attributeSets`, keyed by the created id.
 */
export async function materializeNested(
    jobs: NestedJob[],
    deps: NestedDeps,
    pollMs: number = SLOT_POLL_MS,
    capMs: number = SLOT_WAIT_CAP_MS,
): Promise<NestedResult> {
    const createdIds = new Map<any, string>();
    const referenceSets: NestedReferenceSet[] = [];
    const result: NestedResult = { created: 0, levels: 0, attributeSets: [], unplaced: [], createdIds, referenceSets };
    const placedIn = deps.isPlacedIn;
    const subtree = (children: any[]) => countSubtree(children, placedIn);
    const lose = (u: NestedUnplaced) => {
        result.unplaced.push(u);
        deps.warn(`Nested: ${u.path}${u.className ? ' (' + u.className + ')' : ''} not placed, `
            + `${u.count} object(s): ${u.reason}`);
    };

    let level = jobs.filter(j => j.children.length > 0);
    while (level.length > 0) {
        result.levels++;

        // Wait for every slot this level writes into.
        const ready = new Map<NestedJob, NestedSlot>();
        let waiting = level;
        const start = deps.now();
        for (;;) {
            waiting = waiting.filter(job => {
                const slot = deps.slotOf(job.parentId, job.featureName);
                if (slot) ready.set(job, slot);
                return !slot;
            });
            if (waiting.length === 0 || deps.now() - start >= capMs) break;
            await deps.sleep(pollMs);
        }
        for (const job of waiting) {
            lose({
                path: `${job.path}.${job.featureName}`, count: subtree(job.children),
                reason: `feature "${job.featureName}" not available after ${capMs} ms`,
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
                for (const [key, kids] of nestedFeaturesOf(child, placedIn)) {
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
