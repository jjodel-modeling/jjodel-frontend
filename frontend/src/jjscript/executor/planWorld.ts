/**
 * PlanWorld builder — the world `planEffects` reads, built from the store's `idlookup` (S4b, R-JJD-2)
 *
 * The planner (`effectsPlanner.ts`) reads plain data and never the store; this is the one
 * place that reads the store for it. D-layer only, so a plain `idlookup` fixture is enough to
 * test it (the L-layer pulls in `window` through the `joiner` barrel):
 *
 *  - classes: every `DClass` whose `father` chain ends at the model's metamodel (backward
 *    links, CLAUDE.md §3.6), first name wins as `findMetaclassByName` (`instance.ts:93-115`);
 *    attributes and references inherited included, own before inherited, first name wins;
 *    `containment` is `composition || aggregation` (`LReference.get_containment`);
 *    `opposite` and `type` by name; `upper` is `upperBound` (`-1` unbounded);
 *  - elements: every `DObject` whose `father` chain ends at the model, roots and contained
 *    alike (R-JS-10); the name by the `makeDrawReadCtx` rule; `root` when its father is the
 *    model; `container` when its father is a `DValue`; reference slots by feature, ids only,
 *    holes dropped.
 *  - m2 (P-2026-10-24-1520): every package, class, enum, feature, literal and parameter whose
 *    `father` chain ends at the metamodel (the open one, or the one the M1 model conforms to),
 *    with its father, `extends`, `type`, containment and upper bound; `level` is the open editor's.
 *    A metamodel is a `DModel` with `isMetamodel`; its world has no M1 elements.
 *  - m2.slotValues, a metamodel world only (P-2026-10-24-2320): per attribute or reference, the
 *    conforming models (`instanceof` the metamodel) whose `DValue` slots of it hold values, with
 *    the count; null, undefined and '' are holes. Not read for an M1 world, so an M1 preview does
 *    not go stale on an attribute edit.
 *
 * Read-only: nothing here writes, dispatches or allocates in the store.
 */

import { classAncestry, makeDrawReadCtx } from '../../components/editor-v2/viewpoint/ir/irReadCtx';
import { modelIdOfObject } from '../../components/abstract/tabs/instanceManagerModel';
import type { M2Kind, PlanAttribute, PlanClass, PlanElement, PlanM2Element, PlanMetamodel, PlanReference, PlanSlotValues, PlanWorld } from './effectsPlanner';

type Idlookup = Record<string, any>;

const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

const upperOf = (f: any): number => (typeof f?.upperBound === 'number' ? f.upperBound : 1);

function readClass(idlookup: Idlookup, classId: string): PlanClass {
    const c = idlookup[classId];
    const ancestry = classAncestry(idlookup, classId);
    const attributes: PlanAttribute[] = [];
    const references: PlanReference[] = [];
    for (const a of ancestry) {
        const k = idlookup[a.id];
        for (const id of ids(k?.attributes)) {
            const f = idlookup[id];
            if (!f?.name || attributes.some((x) => x.name === f.name)) continue;
            attributes.push({ name: f.name, upper: upperOf(f) });
        }
        for (const id of ids(k?.references)) {
            const f = idlookup[id];
            if (!f?.name || references.some((x) => x.name === f.name)) continue;
            const ref: PlanReference = {
                name: f.name,
                containment: !!(f.composition || f.aggregation),
                upper: upperOf(f),
                type: (typeof f.type === 'string' ? idlookup[f.type]?.name : undefined) ?? '',
            };
            const opposite = typeof f.opposite === 'string' ? idlookup[f.opposite]?.name : undefined;
            if (opposite) ref.opposite = opposite;
            references.push(ref);
        }
    }
    return {
        name: c.name,
        abstract: !!c.abstract,
        singleton: !!c.isSingleton,
        kinds: ancestry.map((a) => a.name),
        attributes,
        references,
    };
}

const M2_KINDS: Record<string, M2Kind> = {
    DPackage: 'Package', DClass: 'Class', DEnumerator: 'Enumeration', DAttribute: 'Attribute',
    DReference: 'Reference', DOperation: 'Operation', DEnumLiteral: 'Literal', DParameter: 'Parameter',
};

/** The elements of the metamodel `metamodelId`, by their `father` chain. */
function readMetamodel(idlookup: Idlookup, metamodelId: string): PlanMetamodel {
    const mm = idlookup[metamodelId];
    const elements: PlanM2Element[] = [];
    for (const id in idlookup) {
        const o = idlookup[id];
        const kind = o ? M2_KINDS[o.className] : undefined;
        if (!kind || typeof o.name !== 'string' || modelIdOfObject(idlookup, id) !== metamodelId) continue;
        const e: PlanM2Element = { id, name: o.name, kind, father: typeof o.father === 'string' ? o.father : null };
        if (kind === 'Class') {
            e.abstract = !!o.abstract;
            if (o.interface) e.interface = true;
            e.extends = ids(o.extends);
        }
        if (kind === 'Attribute' || kind === 'Reference' || kind === 'Operation' || kind === 'Parameter') {
            e.type = typeof o.type === 'string' ? o.type : null;
            e.upper = upperOf(o);
        }
        if (kind === 'Reference') e.containment = !!(o.composition || o.aggregation);
        elements.push(e);
    }
    const firstPackage = ids(mm?.packages).find((p) => idlookup[p]?.className === 'DPackage')
        ?? elements.find((e) => e.kind === 'Package' && e.father === metamodelId)?.id;
    return { id: metamodelId, name: typeof mm?.name === 'string' ? mm.name : '', defaultParent: firstPackage ?? metamodelId, elements };
}

/** The values the conforming models of `metamodelId` hold, per feature of `features`. */
function readSlotValues(idlookup: Idlookup, metamodelId: string, features: ReadonlySet<string>): Record<string, PlanSlotValues[]> | undefined {
    const counts = new Map<string, Map<string, number>>();
    for (const id in idlookup) {
        const v = idlookup[id];
        if (v?.className !== 'DValue' || !features.has(v.instanceof) || !Array.isArray(v.values)) continue;
        const n = v.values.filter((x: unknown) => x !== null && x !== undefined && x !== '').length;
        if (!n) continue;
        const modelId = modelIdOfObject(idlookup, id);
        const model = modelId ? idlookup[modelId] : undefined;
        if (!model || model.isMetamodel || model.instanceof !== metamodelId) continue;
        const perModel = counts.get(v.instanceof) ?? new Map<string, number>();
        perModel.set(modelId as string, (perModel.get(modelId as string) ?? 0) + n);
        counts.set(v.instanceof, perModel);
    }
    if (!counts.size) return undefined;
    const out: Record<string, PlanSlotValues[]> = {};
    for (const [feature, perModel] of counts) {
        out[feature] = [...perModel].map(([modelId, count]) => ({ modelId, model: idlookup[modelId]?.name || modelId, count }));
    }
    return out;
}

/**
 * The `PlanWorld` of the model `modelId`: an M1 model with its metamodel, or a metamodel (M2,
 * no M1 elements); empty when it is neither.
 */
export function buildPlanWorld(idlookup: Idlookup, modelId: string): PlanWorld {
    const world: PlanWorld = { classes: {}, elements: [] };
    const model = idlookup?.[modelId];
    if (model?.className === 'DModel' && model.isMetamodel === true) {
        for (const id in idlookup) {
            const o = idlookup[id];
            if (o?.className !== 'DClass' || !o.name || world.classes[o.name] || modelIdOfObject(idlookup, id) !== modelId) continue;
            world.classes[o.name] = readClass(idlookup, id);
        }
        world.level = 'M2';
        world.m2 = readMetamodel(idlookup, modelId);
        const features = new Set(world.m2.elements.filter((e) => e.kind === 'Attribute' || e.kind === 'Reference').map((e) => e.id));
        const slotValues = readSlotValues(idlookup, modelId, features);
        if (slotValues) world.m2.slotValues = slotValues;
        return world;
    }
    const metamodelId = model?.instanceof;
    if (model?.className !== 'DModel' || typeof metamodelId !== 'string') return world;
    world.level = 'M1';
    world.m2 = readMetamodel(idlookup, metamodelId);

    const names = makeDrawReadCtx(idlookup);
    for (const id in idlookup) {
        const o = idlookup[id];
        if (o?.className === 'DClass') {
            if (!o.name || world.classes[o.name] || modelIdOfObject(idlookup, id) !== metamodelId) continue;
            world.classes[o.name] = readClass(idlookup, id);
            continue;
        }
        if (o?.className !== 'DObject' || modelIdOfObject(idlookup, id) !== modelId) continue;
        const father = idlookup[o.father];
        const element: PlanElement = {
            id,
            name: names.getName(id) ?? '',
            className: idlookup[o.instanceof]?.name ?? '',
            root: o.father === modelId,
        };
        if (father?.className === 'DValue' && typeof father.father === 'string') {
            const feature = idlookup[father.instanceof]?.name;
            if (feature) element.container = { owner: father.father, feature };
        }
        for (const fid of ids(o.features)) {
            const slot = idlookup[fid];
            const feature = slot ? idlookup[slot.instanceof] : undefined;
            if (feature?.className !== 'DReference' || !feature.name) continue;
            (element.references ??= {})[feature.name] = ids(slot.values);
        }
        world.elements.push(element);
    }
    return world;
}
