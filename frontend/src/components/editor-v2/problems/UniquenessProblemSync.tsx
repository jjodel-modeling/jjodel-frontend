/**
 * Scan-driven producer that mirrors duplicate-name violations from the L-layer
 * validator (nameUniqueness.ts) into the NodeProblem registry. Mounts once at
 * the EditorV2 root; returns null.
 *
 * Reactivity matches the old useDuplicateBadges hook: a Redux-derived signature
 * string over all DObjects (id + name + father) invalidates detectDuplicateNames
 * whenever a rename or reparent lands. On each signature change we diff the
 * desired problem set against the registry and register/markResolved accordingly.
 *
 * Duplicates never arise via LObject.set_name / set_father (hard-blocked with
 * U.alert), so this producer exists specifically to surface pre-existing
 * duplicates loaded from the model or introduced by paths that bypass setters.
 */

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DObject, DState, LModel, LObject, LPointerTargetable } from '../../../joiner';
import { detectDuplicateNames } from '../../../model/logicWrapper/nameUniqueness';
import {
    registerProblem,
    markResolved,
    type NodeProblem,
} from './registry';

interface Props {
    modelid: string | undefined;
}

// Snapshot of registry IDs managed by this producer. We treat any registry
// entry whose id matches our kind prefix as ours — avoids coupling to the
// registry internals.
const DUPLICATE_KIND: NodeProblem['kind'] = 'duplicate-name';

function duplicateProblemId(nodeId: string): string {
    return `${DUPLICATE_KIND}:${nodeId}`;
}

function getRegistryState(): Map<string, NodeProblem> {
    if (typeof window === 'undefined') return new Map();
    return (window as unknown as { _jjNodeProblems?: Map<string, NodeProblem> })._jjNodeProblems ?? new Map();
}

export function UniquenessProblemSync({ modelid }: Props) {
    const sig = useSelector((state: DState) => {
        const lookup = state?.idlookup ?? {};
        const parts: string[] = [];
        for (const id in lookup) {
            const raw = lookup[id] as DObject;
            if (!raw || raw.className !== DObject.cname) continue;
            parts.push(`${id}:${raw.name ?? ''}:${raw.father ?? ''}`);
        }
        parts.sort();
        return parts.join('|');
    });

    useEffect(() => {
        if (!modelid) return;
        const model = LPointerTargetable.fromPointer(modelid) as LModel | null;
        if (!model) return;

        const dupMap = detectDuplicateNames(model);
        const desiredIds = new Set<string>();

        for (const [nodeId, colliding] of dupMap) {
            const id = duplicateProblemId(nodeId);
            desiredIds.add(id);

            const self = LPointerTargetable.fromPointer(nodeId) as LObject | null;
            const selfName = self?.name ?? '';
            const n = colliding.length;
            const description = n === 1
                ? `Name "${selfName}" is also used by another element in this scope.`
                : `Name "${selfName}" is also used by ${n} other elements in this scope.`;

            registerProblem({
                id,
                nodeId,
                kind: DUPLICATE_KIND,
                severity: 'warning',
                title: 'Duplicate name',
                description,
                relatedNodeIds: colliding.map(o => o.id),
                action: {
                    label: 'Go to duplicate',
                    type: 'focus-node',
                    targetNodeId: colliding[0]?.id,
                },
                createdAt: Date.now(),
            });
        }

        // Mark-resolved any previously-registered duplicate problem that no
        // longer appears in the scan. markResolved is a no-op for entries
        // already resolving, so the diff is idempotent.
        const registry = getRegistryState();
        for (const [id, p] of registry) {
            if (p.kind !== DUPLICATE_KIND) continue;
            if (desiredIds.has(id)) continue;
            markResolved(id);
        }
    }, [modelid, sig]);

    return null;
}
