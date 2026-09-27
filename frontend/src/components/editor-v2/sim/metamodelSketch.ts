/**
 * metamodelSketch — the plain sketch of a metamodel the profile binder reads
 * (R-SIM-77, discovery report 2026-09-27 §3.1).
 *
 * Reads the raw idlookup, no L proxies, with the traversal of
 * `collectMetaOptions` (SimulationPanel.tsx), which stays as it is: classes
 * hang off the model directly and off packages and subpackages. Unlike the
 * option lists it keeps what the binder's tests need: abstract classes,
 * `extends`, the type of every feature, compositions and aggregations.
 *
 * Pure: no React, no store, no import from the joiner, so it runs under the
 * node test bench (sim/__tests__/metamodelSketch.test.ts).
 */

import type {
    MetamodelSketch, SketchAttribute, SketchClass, SketchReference,
} from '../../../model/simulation/profileBinder';

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** The sketch of the metamodel `modelId`, in walk order; empty for an unknown model. */
export function sketchOfMetamodel(lookup: Record<string, any>, modelId: string): MetamodelSketch {
    const classes: SketchClass[] = [];
    const attributes: SketchAttribute[] = [];
    const references: SketchReference[] = [];
    const seenContainers = new Set<string>();

    const visit = (containerId: string, depth: number): void => {
        if (depth > 10 || seenContainers.has(containerId)) return;
        seenContainers.add(containerId);
        const container = lookup[containerId];
        if (!container) return;

        for (const cid of strings(container.classes)) {
            const dClass = lookup[cid];
            if (!dClass) continue;
            classes.push({ id: cid, name: dClass.name ?? cid, abstract: !!dClass.abstract, supers: strings(dClass.extends) });
            for (const aid of strings(dClass.attributes)) {
                const dAttr = lookup[aid];
                if (!dAttr) continue;
                attributes.push({ id: aid, name: dAttr.name ?? aid, owner: cid, type: typeof dAttr.type === 'string' ? dAttr.type : '' });
            }
            for (const rid of strings(dClass.references)) {
                const dRef = lookup[rid];
                if (!dRef) continue;
                references.push({
                    id: rid, name: dRef.name ?? rid, owner: cid, type: typeof dRef.type === 'string' ? dRef.type : '',
                    composition: !!dRef.composition, aggregation: !!dRef.aggregation,
                });
            }
        }

        for (const sid of strings(container.subpackages)) visit(sid, depth + 1);
    };

    visit(modelId, 0);
    for (const pid of strings(lookup[modelId]?.packages)) visit(pid, 0);
    return { classes, attributes, references };
}
