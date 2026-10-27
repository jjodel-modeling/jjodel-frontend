/**
 * containmentToProblems — the IR containment diagnostics (R-GV-2, spec addendum 2026-10-10 §4): objects that more than
 * one container claims, and objects that no container claims although they sit beside claimed ones (§4.1). Read from
 * the containment model the presentation pass builds (`irContainment.buildContainmentModel`); mapped here to
 * NodeProblems of kind `'containment'`, one per node, owned by the canvas that built the model.
 *
 * Pure mapping plus a reconcile that only writes when the set changed: `registerProblem` notifies every subscriber,
 * and the presentation pass that feeds this runs on every node change.
 */

import { clearProblem, getProblemIdsOwnedBy, registerProblem, type NodeProblem } from './registry';
import type { ContainmentModel } from '../viewpoint/ir/irContainment';

/** The problems of one containment model. `nameOf` names an object for the text; `owner` keys the revoke pass. */
export function containmentProblemsOf(
    model: Pick<ContainmentModel, 'multiClaimed' | 'unclaimed' | 'parentOf' | 'vertexByObj'>,
    nameOf: (objectId: string) => string,
    owner: string,
    now: number = Date.now(),
): NodeProblem[] {
    const out: NodeProblem[] = [];
    const quote = (objectId: string) => `«${nameOf(objectId) || objectId}»`;
    for (const [child, claimants] of model.multiClaimed ?? []) {
        const nodeId = model.vertexByObj.get(child);
        if (!nodeId) continue;
        const winner = model.parentOf.get(child);
        out.push({
            id: `containment:multi:${nodeId}`,
            nodeId,
            kind: 'containment',
            severity: 'warning',
            title: `Claimed by ${claimants.length} containers`,
            description: `${quote(child)} is listed by ${claimants.map(quote).join(', ')}; `
                + (winner ? `it is drawn inside ${quote(winner)}, the innermost (R-GV-2).` : 'it is drawn inside none of them.'),
            relatedNodeIds: claimants.map(c => model.vertexByObj.get(c)).filter((v): v is string => !!v),
            ownerModelId: owner,
            createdAt: now,
        });
    }
    for (const child of model.unclaimed ?? []) {
        const nodeId = model.vertexByObj.get(child);
        if (!nodeId) continue;
        out.push({
            id: `containment:unclaimed:${nodeId}`,
            nodeId,
            kind: 'containment',
            severity: 'warning',
            title: 'In no container',
            description: `${quote(child)} sits beside objects a container lists, and no container lists it.`,
            relatedNodeIds: [],
            ownerModelId: owner,
            createdAt: now,
        });
    }
    return out;
}

/** The last set registered per owner, as one string, so an unchanged set writes nothing. */
const lastSignature = new Map<string, string>();

/** Register `problems` for `owner` and clear what `owner` registered before and no longer has. */
export function reconcileContainmentProblems(problems: NodeProblem[], owner: string): void {
    const signature = problems.map(p => `${p.id}|${p.description}|${p.relatedNodeIds.join(',')}`).join('\n');
    if (lastSignature.get(owner) === signature) return;
    lastSignature.set(owner, signature);
    const wanted = new Set(problems.map(p => p.id));
    for (const id of getProblemIdsOwnedBy('containment', owner)) {
        if (!wanted.has(id)) clearProblem(id);
    }
    for (const p of problems) registerProblem(p);
}

/** Test seam: forget the last signatures. */
export function resetContainmentProblemSignatures(): void {
    lastSignature.clear();
}
