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
 *
 * MEASURED, and FIXED here (UNQ1 C5, 2026-09-02): the revoke pass below used to walk the
 * WHOLE registry and mark-resolve every `duplicate-name` entry its own scan did not want.
 * The registry is ONE session-wide Map and this producer is mounted once per open model,
 * so opening a metamodel tab erased the M1 warnings of the model tab next door — and they
 * did not come back, because the M1 effect re-runs on a signature change, not on a tab
 * switch. Measured with two REAL collisions at once (two `Edition_0` in M1, two `Book` in
 * M2): M1 registers 2, open M2 -> 0 M1 left, return to M1 -> still 0, for the rest of the
 * session. See docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md §A.4.
 *
 * THE FIX is `ownedIdsByModel`: the producer revokes only the ids IT registered for the
 * model it is scanning. The entries carry no model of their own — giving them one means
 * `registry.ts` and the conformance producer that writes into the same Map — and the
 * bookkeeping needs none: a `duplicate-name` entry on an element of model M can only have
 * been written by the producer mounted on M. Same shape as `ConformanceProblemSync`'s
 * `ownedIds`, module-level rather than a ref so that it survives the remount of an editor
 * tab. Nothing else moves: the signature is unchanged, the two scans are unchanged, and no
 * scan was added — WHAT is counted and WHEN it is recounted both stay as they were.
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

// The kind this producer writes, and the prefix of every id it assembles. It no
// longer decides ownership: until UNQ1 C5 the revoke pass claimed every registry
// entry of this kind, whatever model it belonged to — see the header note and
// `ownedIdsByModel` below.
const DUPLICATE_KIND: NodeProblem['kind'] = 'duplicate-name';

function duplicateProblemId(nodeId: string): string {
    return `${DUPLICATE_KIND}:${nodeId}`;
}

/**
 * The ids this producer registered, per model it scanned — the ownership the registry
 * entries do not carry. Module-level, not a `useRef`: an editor tab that unmounts and
 * comes back must still recognise the entries its own model left in the registry, or a
 * collision resolved while the tab was closed would never be revoked.
 */
const ownedIdsByModel = new Map<string, Set<string>>();

/**
 * The body of the effect. Exported for the test: React is not the subject here, the
 * register/revoke diff is, and rendering it would need a DOM the node-env suite does
 * not have. Never called from outside the effect in application code.
 */
export function reconcileDuplicateProblems(modelid: string): void {
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

    // Mark-resolved the entries THIS model's scan registered last run and no longer
    // wants. Scoped to `ownedIdsByModel`, never a scan of the whole registry: the
    // entries of another open model are not ours to revoke, and neither are the
    // conformance ones (their ids never enter this set). markResolved is a no-op on
    // an id already resolving or already dropped, so the diff stays idempotent, and
    // an element deleted meanwhile is still revoked — the id was ours, whatever
    // became of the element it named.
    const owned = ownedIdsByModel.get(modelid);
    if (owned) {
        for (const id of owned) {
            if (desiredIds.has(id)) continue;
            markResolved(id);
        }
    }
    ownedIdsByModel.set(modelid, desiredIds);
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
        reconcileDuplicateProblems(modelid);
    }, [modelid, sig]);

    return null;
}
