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
 *
 * ── M2 (S1-M2, R-M2U-6) ──────────────────────────────────────────────────────
 *
 * The same producer covers M2 when the open model IS a metamodel: classifiers,
 * datatypes, features, literals and parameters go through `detectM2DuplicateNames`,
 * whose namespaces are the ratified ones (metamodel-wide for classifiers, own +
 * inherited for features). The reactivity signature widens to match — it used to
 * discard every `className !== 'DObject'`, which is why four `Concept_0` in a
 * metamodel left the registry empty.
 *
 * MEASURED (tick-fix, 2026-08-31), and DELIBERATE: the badge reports COMMITTED state,
 * so it still lights one write after a batch of same-tick duplicates. The earlier
 * diagnosis in this comment was wrong on the mechanism — `idlookup` is not a Proxy, it
 * is a plain object whose `__proto__` is `DPointerTargetable.pendingCreation`, and the
 * `for...in` on line 73 DOES enumerate a pending create (measured 114 vs 112 own keys).
 * What is stale at notify time is every COLLECTION `detect*DuplicateNames` walks
 * (`pkg.classes`, `cls.allAttributes`, `father.children`), written by the persist
 * callback's SetFieldAction one tick later. Baseline re-measured with four `Concept_0`:
 * registry 0 at 1s, 0 at 10s, exactly 4 the moment any other write lands.
 *
 * The tick-fix gives `nameUniqueness.ts` an `includePending` option and the two scans
 * below leave it at its default, `false`. That is a choice, not an omission: a
 * collision the store has not accepted yet is not a problem the user can act on, and
 * an Ecore parse runs with `Constructors.paused`, so its whole output sits in the
 * pending dictionary until `persist` (R-GT-2) — counting it would make the badge flash
 * on every import. Passing `{includePending: true}` to either scan closes the one-write
 * delay; measured, and not taken. See
 * docs/discovery/discovery_2026-08-31_tick_fix_defaultname.md.
 *
 * MEASURED, and NOT fixed here (2): the registry entry is keyed by the ELEMENT id,
 * while `NodeProblemIndicator` is mounted with the ReactFlow node id, which is the
 * DVertex id — so the dot does not appear on the canvas, at M1 either. That is a
 * pre-existing mismatch (`ConformanceProblemSync` works around it by registering
 * under both ids) and is out of this slice's perimeter. See
 * docs/discovery/discovery_2026-08-30_s1m2_una_regola.md §4.
 */

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DObject, DState, LModel, LObject, LPointerTargetable } from '../../../joiner';
import { detectDuplicateNames, detectM2DuplicateNames, m2KindOf } from '../../../model/logicWrapper/nameUniqueness';
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
            if (!raw) continue;
            // M1 instances, plus every M2 named element (m2KindOf returns null for
            // DModel / DValue / DVertex / …, so nothing else widens the signature).
            if (raw.className !== DObject.cname && !m2KindOf(raw.className)) continue;
            parts.push(`${id}:${raw.name ?? ''}:${raw.father ?? ''}`);
        }
        parts.sort();
        return parts.join('|');
    });

    useEffect(() => {
        if (!modelid) return;
        const model = LPointerTargetable.fromPointer(modelid) as LModel | null;
        if (!model) return;

        // One map, two producers: M1 instances for an ordinary model, M2 elements for
        // a metamodel. A metamodel has no DObjects and a model has no M2 elements of
        // its own, so the two never overlap and the merge cannot mask either.
        const dupMap = (model as unknown as { isMetamodel?: boolean }).isMetamodel
            ? (detectM2DuplicateNames(model) as unknown as Map<string, LObject[]>)
            : detectDuplicateNames(model);
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
