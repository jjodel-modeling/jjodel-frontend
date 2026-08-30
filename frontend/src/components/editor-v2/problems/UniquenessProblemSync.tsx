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
 * MEASURED (badge reconciliation, 2026-08-31): the defect the two notes above described
 * as "the badge lights one write late" was a MISSED NOTIFICATION, with no upper bound —
 * a batch of same-tick duplicates left the registry empty until the user happened to
 * touch a name, a father, or create another named element. Mechanism, measured anew:
 * `idlookup` is a plain object whose `__proto__` is `DPointerTargetable.pendingCreation`,
 * so `for...in` DOES enumerate a pending create (122 keys in `for...in` vs 120 own).
 * The signature therefore reached its FINAL value in the create's own tick, while every
 * COLLECTION `detect*DuplicateNames` walks (`pkg.classes`, `cls.allAttributes`,
 * `father.children`) was still stale — the scan ran and found nothing. One tick later the
 * persist callback filled those collections, but the commit only moves a key from the
 * proto to the own keys: it touches none of `id`, `name`, `father`, so the signature did
 * not change and the effect was never re-run. Sampled every 200 ms on two same-named
 * creates: `detect*` returned 2 while the registry stayed at 0, signature identical
 * before and after the commit (-622776247 -> -622776247).
 *
 * THE FIX is the `hasOwnProperty` guard in the signature loop below: pending keys are
 * skipped, so the commit itself is what makes the signature change. It also removes the
 * scan that used to run, guaranteed empty-handed, inside the create's tick. Cost per call,
 * measured on the diff itself (`_tmp_badge_fix_verify.ts`, state grown to 150/154 keys):
 * M2 0.042 ms shipped vs 0.053 before, M1 0.0405 vs 0.0395 — a wash, as the report's own
 * measure on a 120-element state predicted (0.032 vs 0.033). The scan it now schedules costs
 * `detectM2DuplicateNames` 0.87 ms / `detectDuplicateNames` 2.59 ms, once per settling
 * BATCH, not per element. See
 * docs/discovery/discovery_2026-08-31_badge_riconciliazione.md §3 and §5 (variant b).
 *
 * WHAT IS COUNTED DID NOT CHANGE — only WHEN it is recounted. The badge still reports
 * COMMITTED state: the two scans below leave `nameUniqueness.ts`'s `includePending` at its
 * default, `false`. That is a choice, not an omission: a collision the store has not
 * accepted yet is not a problem the user can act on, and an Ecore parse runs with
 * `Constructors.paused`, so its whole output sits in the pending dictionary until `persist`
 * (R-GT-2) — counting it would make the badge flash on every import. Passing
 * `{includePending: true}` to either scan is measured, and not taken. See
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
            // Skip pending creates: `idlookup`'s `__proto__` is
            // `DPointerTargetable.pendingCreation`, so `for...in` enumerates elements the
            // store has not committed yet. Counting them made the signature reach its final
            // value in the create's own tick — the commit one tick later changed no field of
            // the signature, so the effect was never re-run and the registry stayed empty
            // until an unrelated write. See the note above.
            if (!Object.prototype.hasOwnProperty.call(lookup, id)) continue;
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
