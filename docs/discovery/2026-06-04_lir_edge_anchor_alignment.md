# Layer Impact Report (read-only) — Edge anchor pair-alignment (Fix A + B2)

**Date**: 2026-06-04
**Type**: Layer Impact Report / read-only (no code changes)
**Author**: Claude Code (Opus 4.8)
**Builds on**: `docs/discovery/2026-06-04_edge_anchor_placement.md` (data-flow map; not repeated here)
**Scope**: blast radius + seam feasibility for **Fix A** (bidirectional side policy) and
**Fix B / B2** (coordinated per-pair slot, index-authoritative fraction). Static analysis only.

> Conflict check vs CLAUDE.md: none. This touches the critical zone (§3.1: `portDistribution.ts`,
> `useJjomSync`-adjacent, `EditorV2` distribution). The report is the mandatory §3.2 Layer
> Impact Report; no diff is proposed. The §3.10 note (nodeHandles discarded) is re-confirmed
> below with current line numbers.

---

## 0. Executive verdict

**B2 is viable but NOT a drop-in "read the index" change at `computeSidePositions`.** The seam
diverges (L1): today the physical fraction is driven by a **locally recomputed cross-role
centroid rank**, and the slot index (`side-k`) is only a *tiebreaker*. Worse, for a
bidirectional pair the two pair edges currently receive the **same** slot index (`bottom-0` on
both, because `computePortDistribution` indexes per *role* bucket and each bucket holds one
edge). So "derive fraction from the index" would make them **coincide**, not align.

B2 therefore requires **two coordinated edits, not one**:
1. `computePortDistribution` must assign **cross-role-unique, pair-matched** indices (the same
   edge gets the same index on both its facing sides; the two pair edges get *different*
   indices). The needed cross-role union logic already exists — but only in the **dead**
   STEP-4 `nodeHandles` path (and even there it dedups-collapses; see L1).
2. `computeSidePositions` must read that index instead of re-sorting by centroid — which
   **invalidates the existing `handlePosition.test.ts` invariants** (Cases 1, 4, fallback,
   regression-free all assert geometry-driven fractions). Those tests must be rewritten, not
   merely extended.

**Go / no-go: GO, conditioned on doing the index assignment in `portDistribution` first** (make
the index the genuine single source of truth, baking geometry + pair-matching into it), then
reducing `computeSidePositions` to an index→fraction map. A lighter, test-preserving
alternative exists and is flagged in Risks (it changes only the *tiebreaker*); the decision is
B2, so it is assessed as the primary path and the alternative is noted, not pushed.

**Fix A** is **confinable to `deconflictBidirectionalEdges`** (L5). Self-ref, inheritance, and
pinned anchors are all handled by early-`continue` *before* deconfliction and re-skipped in its
merge pass, so they are not disturbed. Load-time `computeOptimalHandles` already routes pairs to
*facing* sides (no same-side forcing) — it likely needs **no change**; Fix A makes drag-time
agree with load-time.

---

## L1 — The seam (fraction basis): slot-index vs centroid-rank

**Verdict: they DIVERGE. The fraction is centroid-rank-driven; the slot index is only a
tiebreaker.**

`computeSidePositions` (`handlePosition.ts:177-251`):
- builds `ref = endpoints.filter(reference).sort(byGeometry)` (`:221`);
- `byGeometry` orders by the *opposite node's* centroid along the side axis (`:210-215`), and
  only **falls back** to `bySortKey` (role-primary: source<target, then handle index) on a tie
  or missing centroid (`:200-205`, `:213`);
- assigns `refPositions[k]` to `ref[k]` where `k` is the **local sorted rank**, fraction
  `(k+1)/(N+1)` (`:231`, `:243`). The result is keyed `${handleId}:${role}` (`:225`).

So the handle's numeric index (`side-k`) does **not** set the fraction; the endpoint's *rank in
the locally re-sorted array* does. The index influences the result only through the `bySortKey`
tiebreaker.

**Tests enshrine this** (`utils/__tests__/handlePosition.test.ts`):
- Case 1 (`:12-25`): two endpoints both `left-0` (different roles, different opposite nodes) →
  geometry orders them target-above-source by opposite Y. Pure index-driven cannot reproduce
  this (both index 0).
- Case 4 / "centroid tie" (`:94-103`) and the cross-role mixed fallback (`:122-131`): **equal
  opposite Y ⇒ role tiebreak, source→1/3, target→2/3**. This is exactly the bidirectional-pair
  geometry (same opposite node on both facing sides), and it is what **inverts** the matched
  edge across the two sides (source-rank on side A ≠ target-rank on side B) → the defect-2/3
  misalignment.

**What B2 needs at this seam.** For "equal indices on the two facing sides ⇒ equal fractions":
- the index must be **cross-role-unique on a side** (else two endpoints at index 0 collapse to
  the same fraction), and
- the same edge must carry the **same index** on both its facing endpoints (pair-matching).

Neither holds today. `computePortDistribution` buckets per `node:side:**role**`
(`portDistribution.ts:78`, `:111`) and indexes each bucket independently (`:159-178`); for a
pair, each role bucket has one edge → **both endpoints get `side-0`**. The cross-role *union*
that would de-collide them exists only in the **discarded** STEP-4 `nodeHandles` block
(`:207-235`) — and that block **dedups by `handleId`** (`:217-220`), so `bottom-0`(source) +
`bottom-0`(target) collapse to a single `bottom-0` at 0.5; it would *coincide*, not separate.
Conclusion: the cross-role-unique, pair-matched index does not exist anywhere yet and must be
built in STEP 1-3 of `computePortDistribution`.

---

## L2 — Call sites + signatures

| Function | Signature (current) | Live callers | B2 impact |
|---|---|---|---|
| `computePortDistribution` | `portDistribution.ts:61` `(edges, nodeIds, nodePositions?) → { edgeHandles, nodeHandles }` | **`EditorV2.tsx:836`** (destructures `{ edgeHandles }` only). `edgeUtils.ts:1064` via `computeDistributedHandles` — **dead** (the wrapper has 0 callers in `frontend/src`). | **Internal logic change** (cross-role-unique + pair-matched indices). Signature can stay; `nodeHandles` remains unused (could be deleted, out of scope). Single live caller → low caller-churn, high internal-logic risk. |
| `computeSidePositions` | `handlePosition.ts:177` `(endpoints, nodePositions?) → Map<\`${handleId}:${role}\`, number>` | `DynamicHandles.tsx:112` (with positions); `computeHandlePositionForNode` `handlePosition.ts:273` (without positions). | **Behavioral change** (fraction basis index-driven). Signature unchanged. Breaks `handlePosition.test.ts` invariants — must rewrite. |
| `computeSideEndpoints` | `handlePosition.ts:124` `(edges, nodeId, side) → SideEndpoint[]` | `DynamicHandles.tsx:112`; `computeHandlePositionForNode:273`; tests. | Likely **unchanged** (already emits `handleId`, `role`, `oppositeNodeId`). The index is already on `handleId`. |
| `computeHandlePositionForNode` | `handlePosition.ts:261` `({edges,nodeId,nodeX,nodeY,nodeWidth,nodeHeight,handleId,role}) → {x,y}` | `useTreeLayout.ts:121`. | **No signature change.** Inheritance endpoints stay centered (0.5) regardless of basis (L6), so the tree-branch landing is unaffected. |
| `deconflictBidirectionalEdges` | `useAutoAnchor.ts:47` (internal) | `computeAnchorsWithHysteresis:409`; `getOptimalAnchorsForAllEdges:688`. | **Fix A target.** Internal; no external signature. |
| `getNextFreeHandleIndex` | `portDistribution.ts:267` `(nodeId, side, role, existingEdges) → number` | `EditorV2.tsx:1311/1312/1453/1454/2200/2201` (new-connection slot pick). | **Per-role today** (`:276-287` scans only same-role handles). If indices become cross-role-unique, this must also count cross-role occupancy or new edges will collide with existing opposite-role handles. **Affected — must update in lockstep.** |

Re-confirmed §3.10: only `edgeHandles` is consumed (`EditorV2.tsx:836`); `nodeHandles` has no
live reader (`grep` shows references only inside `portDistribution.ts`).

---

## L3 — Global blast radius (non-pair edges)

**Verdict: index-driven fractions are safe for non-pair *same-role* sides BECAUSE the slot
index already inherits the centroid order — but UNSAFE for any *mixed-role* side under the
current per-role indexing.**

- `computePortDistribution` STEP 2 sorts each `node:side:role` bucket by the opposite node's
  centroid (`:142-157`), then STEP 3 stamps the index by that order (`:159-178`). So for a side
  hosting several edges of the **same role** to different opposite nodes, `side-k`'s `k` is the
  centroid rank. An index-driven fraction `(k+1)/(N+1)` then reproduces the centroid order.
  **This is exactly what the "regression-free" test asserts** (`handlePosition.test.ts:67-78`:
  "in production portDistribution assigns the lower index to the lower-Y opposite, so index ==
  geometry"). Safe.
- **Mixed-role sides** (both a source and a target endpoint, e.g. Case 1 `has`/`labs`): the two
  role buckets are indexed *independently* starting at 0, so a source and a target can both be
  `side-0` (collision). Switching `computeSidePositions` to index-driven without first making
  the index cross-role-unique would **collapse** these onto one fraction. This is the same
  defect that affects pairs, generalized.

Therefore L1's change is safe globally **only if** STEP 3 is reworked so indices are unique
*across roles* on a side (and ordered by the same centroid key, so non-pair behavior is
preserved). That rework is the core of B2, not an optional extra.

---

## L4 — Count mismatch (N vs M on the two facing sides)

**Verdict: matched index aligns the pair ONLY when the two facing sides have equal endpoint
counts (N = M). All three target cases are N = M = 2, so they are covered. For N ≠ M, a matched
index does NOT guarantee equal fractions and must be sub-channeled or accepted as diagonal.**

The fraction is `(k+1)/(count+1)`. Even with the same matched index `k`, if Loan-bottom has
`N=3` endpoints and BookCopy-top has `M=2`, the fractions are `(k+1)/4` vs `(k+1)/3` — unequal
⇒ not aligned ⇒ the router takes the Z/curve branch (R4), and (worse) the 4-point Z re-enables
`applyBundleSpread` (L6).

Recommendation for scope:
- **In scope now**: the N = M = 2 facing-pair cases (the three defects). Implement matched index
  + identical divisor; they will hit the `SNAP` straight branch.
- **General case (N ≠ M)**: accept diagonal-but-coordinated for now (no coincidence, R3 still
  holds because indices are unique), and **`log()`/comment** that asymmetric facing-side counts
  are not yet aligned. True alignment there needs **sub-channeling** (group endpoints by
  opposite node, distribute the pair within its own sub-band with a shared local divisor) —
  defer to a follow-up. Do not silently truncate (CLAUDE.md §20 "No silent caps").

---

## L5 — Invariants Fix A must preserve

**Verdict: Fix A is confinable to `deconflictBidirectionalEdges`; the protected cases are all
handled before/around it.**

Order of operations in `computeAnchorsWithHysteresis` (`useAutoAnchor.ts:274-439`):

| Invariant | Location | Relative to deconflict |
|---|---|---|
| Self-ref fixed `right/top` | `:304-313` (early `continue`) | **before** — never reaches deconflict |
| Pinned-anchor freeze | `:318-326` (early `continue`) | **before**; also re-skipped in merge `:425-427` |
| Inheritance forced `top/bottom` | `:334-343` (early `continue`) | **before**; also re-skipped in merge `:421` |
| Angular dead-zone hysteresis | `:389-395` | **before** (inside per-edge pass) |
| `deconflictBidirectionalEdges` | `:409` (2nd pass) | **the Fix-A site** |
| merge results | `:413-435` | skips inheritance + pinned |

The same protections live in the creation/all-edges path: `computeBestAnchorsWithContext`
self-ref `:484`, inheritance `:489`; `getOptimalAnchorsForAllEdges` calls
`deconflictBidirectionalEdges` at `:688`. Fix A (use facing/opposing sides instead of same-side
for bidirectional reference pairs) edits only the same-side assignment block
(`useAutoAnchor.ts:91-115`); the protected branches are untouched.

**Load-time policy** `computeOptimalHandles` (`jjomTransformers.ts:373-419`): dominant-axis,
inheritance forced `top/bottom` (`:399-402`), **no deconfliction** — it already places a
bidirectional pair on *facing* sides (both directions resolve to the same opposing pair, e.g.
Loan-right ↔ Member-left). So the same-side "loop" originates at **drag/recompute time** via
`deconflictBidirectionalEdges`, not at load. `computeOptimalHandles` therefore likely needs
**no change**; verify during impl that load and post-drag produce identical sides for the three
cases (the prompt's "load-time and drag-time agree").

---

## L6 — Downstream path interactions (once anchors align)

| Claim | Verdict | Evidence |
|---|---|---|
| (a) Aligned ⇒ `computeManhattanPath` straight branch | **Confirmed** for the facing cases | opposite-H straight when `\|ty−sy\|<SNAP` (`edgeUtils.ts:154`); opposite-V straight when `\|tx−sx\|<SNAP` (`:196`); `SNAP=8` (`:106`). Equal fractions on facing sides ⇒ equal Y (or X) ⇒ 2-point straight path. |
| (b) `applyBundleSpread` goes inert | **Confirmed** for straight pairs; **caveat** for near-aligned | `UnifiedEdge.tsx:71` `if (points.length !== 4) return points` — a straight edge is 2 points ⇒ untouched. **Caveat**: if alignment is off by >`SNAP` (e.g. the L4 N≠M divisor mismatch), the path is a 4-point Z and `applyBundleSpread` **fires again** (`:64-103`), re-introducing the jog. So B2 must achieve *exact* fraction equality for the in-scope cases, not just "close". |
| (c) `buildFinalPath` crossing bridges unaffected | **Confirmed** | Bridges fire only when `crossings.length>0` (`UnifiedEdge.tsx:280`); they are orthogonal to anchor alignment and to Fix A/B. Aligned parallel pair edges do not cross each other; crossings with unrelated edges still bridge as before. |
| (d) Inheritance tree-branch landing | **Confirmed unaffected** | `computeSidePositions` pins inheritance at 0.5 (`handlePosition.ts:246-248`) regardless of fraction basis; `useTreeLayout` queries only the inheritance source handle (`useTreeLayout.ts:120-130`). Index-vs-geometry change does not move it. |

---

## Change-surface table (summary)

| Function | Change for Fix A / B2 | Signature | Callers affected | Risk |
|---|---|---|---|---|
| `deconflictBidirectionalEdges` (`useAutoAnchor.ts:47-120`) | **Fix A**: opposing/facing sides for bidir reference pairs (rely on B2 to separate directions) | none (internal) | `computeAnchorsWithHysteresis`, `getOptimalAnchorsForAllEdges` | **Medium** — pair branch only; protected cases isolated (L5) |
| `computePortDistribution` (`portDistribution.ts:61-238`) | **B2 core**: cross-role-unique + pair-matched index in STEP 1-3 (port the union idea from the dead STEP-4, but *without* the handleId dedup-collapse) | keep `(edges, nodeIds, nodePositions?)`; `edgeHandles` shape unchanged | **`EditorV2.tsx:836` only** (live) | **High** — single caller but feeds every node's handle IDs, DynamicHandles active-set, `MAX_HANDLES_PER_SIDE=4` overflow, M1 ref edges, EndpointHandles |
| `computeSidePositions` (`handlePosition.ts:177-251`) | **B2 seam**: fraction from authoritative index instead of centroid re-sort | unchanged | `DynamicHandles.tsx:112`, `computeHandlePositionForNode:273` | **High** — invalidates `handlePosition.test.ts` Cases 1/4/fallback/regression-free; must rewrite tests as part of the change |
| `getNextFreeHandleIndex` (`portDistribution.ts:267-294`) | If indices become cross-role-unique: count cross-role occupancy, not just same-role | likely add awareness, keep arity | `EditorV2.tsx:1311/1312/1453/1454/2200/2201` | **Medium** — new-connection slot collisions if skipped |
| `computeOptimalHandles` (`jjomTransformers.ts:373-419`) | **Review only**; already facing-sided. Change only if load≠drag for the 3 cases | n/a | `jjomEdgeToRFEdge` | **Low** |

---

## Go / No-Go on B2 (at the L1 seam)

**GO — with one mandatory sequencing condition.** B2's "index-authoritative fraction" is sound,
but it is only safe if the index is *first* made authoritative inside `computePortDistribution`:
cross-role-unique on each side and pair-matched across the two facing sides, with the index
ordered by the **same** opposite-centroid key the current geometry sort uses (so non-pair
behavior — L3, and the regression-free test — is preserved by construction). Then
`computeSidePositions` collapses to `index → (index+1)/(count+1)`, with inheritance still pinned
at center. Doing it in the other order (change `computeSidePositions` to read the index while
the index is still per-role) **regresses** every mixed-role side into coincidence.

This is not a re-litigation of B2; it is the minimal correct decomposition of B2 across its two
named modules.

---

## Risks & open questions (for the implementation phase)

1. **Pair-matching key.** To give the *same* edge the same index on both facing sides, STEP 3
   needs a direction-stable key. The edge **id is identical** viewed from either endpoint, so
   ordering each side's endpoints by a key that resolves the same-opposite-node tie via a
   pair-stable criterion (e.g. `source<target` direction sign, as `applyBundleSpread` already
   does at `UnifiedEdge.tsx:75`, or edge id) will make e1 rank identically on A and B. Confirm
   the chosen key also keeps the non-tie (distinct opposite) ordering = centroid.

2. **Test rewrite is in-scope.** `handlePosition.test.ts` Cases 1, 4, fallback (`:31-39`), and
   regression-free (`:67-78`) assert geometry-driven fractions on shared-index cross-role
   endpoints. Under B2 they must be rewritten to assert index-driven fractions on
   cross-role-unique indices. Per CLAUDE.md §5.1, validate the new behavior by **executing**
   end-to-end (edge set → assigned indices → fractions → rendered `<path>`), not by reading the
   comparator.

3. **N ≠ M general case** (L4): matched index ≠ equal fraction. Decide explicitly: sub-channel,
   or accept coordinated-diagonal and `log()` the limitation. The three target defects are
   N = M = 2 and unaffected.

4. **`getNextFreeHandleIndex` cross-role occupancy** (L2): if not updated alongside, new
   manually-drawn connections can land on an index already used by the opposite role on that
   side. Six call sites in `EditorV2.tsx`.

5. **Defect-2 "coincidence" still a hypothesis.** The static read explains *how* coincidence
   arises (per-role index 0 on both pair edges + cross-role tie → if ever index-driven, or
   near-equal fractions in some layouts). Per the prior report and §5.1, confirm on the live
   branch with temporary `[diagN]` logs (assigned handles + fractions + measured `sourceX/Y`,
   `targetX/Y`) during implementation — not in this read-only pass.

6. **Lighter alternative (noted, not chosen).** Because the misalignment is produced *purely* by
   the `bySortKey` source-before-target tiebreak on the same-opposite-node tie
   (`handlePosition.ts:200-205`, tests `:94-103`), changing only that tiebreak to a pair-stable
   key would align the three cases while **preserving** the existing geometry-driven fractions
   and most of the test suite — without touching `computePortDistribution` or
   `getNextFreeHandleIndex`. Flagged for the implementer's cost/benefit call; the chosen
   decision remains B2.

---

## Hard stop

Layer Impact Report complete. No source modified, no diagnostics added, no build, no commit.
Awaiting instructions before implementation.
