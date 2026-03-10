/**
 * Polymetric Metrics — Metric extraction from JjOM via LModel proxy.
 *
 * Extracts raw integer metrics from metamodels (LClass-level) and models
 * (LObject-level). Normalization is deferred to the rendering layer.
 */

import { LPointerTargetable } from '../../joiner';
import type { MetricKey, PolymetricNodeData } from './polymetricViews';

// ---------------------------------------------------------------------------
// Metamodel metrics (M2)
// ---------------------------------------------------------------------------

/**
 * Extract metric data from a metamodel (M2).
 * Each class becomes a node with NAttr, NOp, NSub, NRef, NInst, Abstractness.
 */
export function extractMetamodelMetrics(
    modelId: string,
    instanceModelId?: string,
): PolymetricNodeData[] {
    const lModel: any = LPointerTargetable.fromPointer(modelId);
    if (!lModel || !lModel.classes) return [];

    const classes: any[] = Array.isArray(lModel.classes) ? lModel.classes : [];
    if (classes.length === 0) return [];

    // Build a lookup of class id -> direct subclass count
    const subclassCount = new Map<string, number>();
    for (const cls of classes) {
        if (!cls) continue;
        const exts: any[] = cls.extends || [];
        for (const sup of exts) {
            if (!sup) continue;
            const supId = typeof sup === 'string' ? sup : sup.id;
            subclassCount.set(supId, (subclassCount.get(supId) || 0) + 1);
        }
    }

    // Count instances per class if an instance model is provided
    const instanceCount = new Map<string, number>();
    if (instanceModelId) {
        try {
            const lInstModel: any = LPointerTargetable.fromPointer(instanceModelId);
            if (lInstModel?.objects) {
                const objects: any[] = Array.isArray(lInstModel.objects) ? lInstModel.objects : [];
                for (const obj of objects) {
                    if (!obj?.instanceof) continue;
                    const classId = typeof obj.instanceof === 'string' ? obj.instanceof : obj.instanceof.id;
                    instanceCount.set(classId, (instanceCount.get(classId) || 0) + 1);
                }
            }
        } catch { /* ignore */ }
    }

    const nodes: PolymetricNodeData[] = [];

    for (const cls of classes) {
        if (!cls || cls.isPrimitive) continue;

        const attrs = cls.ownAttributes || cls.attributes || [];
        const ops = cls.ownOperations || cls.operations || [];
        const refs = cls.ownReferences || cls.references || [];

        // Find parent for tree layout (first superclass)
        const exts: any[] = cls.extends || [];
        const parentCls = exts.length > 0 ? exts[0] : null;
        const parentId = parentCls ? (typeof parentCls === 'string' ? parentCls : parentCls.id) : undefined;

        const nSub = subclassCount.get(cls.id) || 0;
        const nInst = instanceCount.get(cls.id) || 0;

        const metrics: Partial<Record<MetricKey, number>> = {
            NAttr: Array.isArray(attrs) ? attrs.length : 0,
            NOp: Array.isArray(ops) ? ops.length : 0,
            NSub: nSub,
            NRef: Array.isArray(refs) ? refs.length : 0,
            NInst: nInst,
            Abstractness: (nSub > 0 && nInst === 0) ? 1 : 0,
        };

        nodes.push({
            id: cls.id,
            label: cls.name || 'unnamed',
            metrics,
            parentId,
        });
    }

    return nodes;
}

// ---------------------------------------------------------------------------
// Model metrics (M1)
// ---------------------------------------------------------------------------

/**
 * Extract metric data from a model (M1).
 * Each object instance becomes a node with NVal, NLinkOut, NLinkIn, Completeness.
 */
export function extractModelMetrics(modelId: string): PolymetricNodeData[] {
    const lModel: any = LPointerTargetable.fromPointer(modelId);
    if (!lModel || !lModel.objects) return [];

    const objects: any[] = Array.isArray(lModel.objects) ? lModel.objects : [];
    if (objects.length === 0) return [];

    // Build incoming link count
    const incomingLinks = new Map<string, number>();
    for (const obj of objects) {
        if (!obj) continue;
        const refFeatures: any[] = obj.referenceFeatures || [];
        for (const val of refFeatures) {
            if (!val) continue;
            const values: any[] = val.values || [];
            for (const target of values) {
                if (!target) continue;
                const targetId = typeof target === 'string' ? target : target.id;
                if (targetId) {
                    incomingLinks.set(targetId, (incomingLinks.get(targetId) || 0) + 1);
                }
            }
        }
    }

    const nodes: PolymetricNodeData[] = [];

    for (const obj of objects) {
        if (!obj) continue;

        const features: any[] = obj.features || [];
        const attrFeatures: any[] = obj.attributeFeatures || [];
        const refFeatures: any[] = obj.referenceFeatures || [];

        // Count set values (non-null, non-empty)
        let nVal = 0;
        for (const feat of attrFeatures) {
            if (!feat) continue;
            const values: any[] = feat.values || [];
            for (const v of values) {
                if (v !== null && v !== undefined && v !== '') nVal++;
            }
        }

        // Count outgoing reference links
        let nLinkOut = 0;
        for (const feat of refFeatures) {
            if (!feat) continue;
            const values: any[] = feat.values || [];
            nLinkOut += values.filter((v: any) => v !== null && v !== undefined).length;
        }

        // Completeness = NVal / total metaclass attributes
        const metaclass: any = obj.instanceof;
        const totalAttrs = metaclass
            ? (metaclass.allAttributes || metaclass.attributes || []).length
            : features.length;
        const completeness = totalAttrs > 0 ? nVal / totalAttrs : 1;

        const metrics: Partial<Record<MetricKey, number>> = {
            NVal: nVal,
            NLinkOut: nLinkOut,
            NLinkIn: incomingLinks.get(obj.id) || 0,
            Completeness: completeness,
        };

        nodes.push({
            id: obj.id,
            label: obj.name || 'unnamed',
            metrics,
        });
    }

    return nodes;
}

// ---------------------------------------------------------------------------
// Max-node subsampling for performance
// ---------------------------------------------------------------------------

const MAX_NODES = 500;

/**
 * If nodes exceed MAX_NODES, subsample by keeping the top-N by sum of all metrics.
 * Returns [nodes, wasSubsampled].
 */
export function subsampleIfNeeded(nodes: PolymetricNodeData[]): [PolymetricNodeData[], boolean] {
    if (nodes.length <= MAX_NODES) return [nodes, false];

    const scored = nodes.map(n => ({
        node: n,
        score: Object.values(n.metrics).reduce((sum, v) => sum + (v ?? 0), 0),
    }));
    scored.sort((a, b) => b.score - a.score);

    return [scored.slice(0, MAX_NODES).map(s => s.node), true];
}
