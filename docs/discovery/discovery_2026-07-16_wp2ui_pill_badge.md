# Discovery — WP2-UI: validation pill (toolbar) + per-node conformance badge/popover

**Date**: 2026-07-16 (real date; header per convention)
**Type**: FASE 1 — targeted discovery, READ-ONLY. Ends at a hard gate.
**Prompt**: "WP2-UI: pill di validazione in toolbar + badge per-nodo con popover" (supersedes the two appbar-dot prompts 2026-07-15 18-09 / 18-27).
**Verdict**: **GATE TRIGGERED — STOP AND ASK.** The prompt's core premise ("ObjectNode e TreeView usano lo stesso nodeId") is **false**. The two surfaces key the registry on **two different id spaces**, so a single registry entry keyed by `objectId` cannot light both. Details in §2 + §7.

---

## 0. Scope reminder & working-tree state

Files the prompt anticipates touching (all read, none written in FASE 1). The full expected FASE-2 file list is in §6 (>5 files ⇒ must be confirmed before implementing).

### 0.1 Uncommitted leftovers found in the working tree (must be reported before proceeding)

- **`frontend/src/pages/components/Navbar.tsx`** — **MODIFIED, uncommitted (9 insertions).** This is the leftover from the **superseded** appbar-dot prompt. It imports `ConformanceIndicator` and renders it inside each `tab.type === 'model'` appbar tab (`Navbar.tsx:1847-1853`, class `appbar-tab__conformance`, inline styles only — no SCSS rule exists for that class). **The current prompt explicitly says the appbar/tab dot is NOT implemented and the pill replaces it.** → This diff conflicts with the new design. **Recommendation: revert `Navbar.tsx` to HEAD** (leaving it in-tree would ship BOTH the tab dot AND the pill). Not staged, not touched pending Alfonso's call.
- **`ConformanceIndicator` orphan in `TabDataMaker.tsx:29`** — prompt says leave as-is (hidden tree, harmless). Confirmed not touched.
- **jjtl transformation fix (ANOTHER task)** — `DockManager.tsx`, `ExecuteTransformationDialog.tsx`, `JjtlDevelopmentEnv.tsx` (M), `sourceConformance.ts` + `__tests__/` (untracked). Per prompt: **do not stage.** Left intact.

### 0.2 Prompt premise that is STALE (correction)

- Prompt "Fatti accertati" says *"validateConformance funziona live (WP1 completo nel working tree, uncommitted)"* and commit plan step 1 is *"feat(conformance): add … checks (WP1, già pronto nel tree)"*. **This is stale: WP1 is ALREADY committed** as `6a438569c` ("feat(conformance): complete WP1 checks on raw shapes + realistic tests"). `git status frontend/src/model/conformance/` is **clean**. → **Commit plan step 1 has already happened.** Only step 2 (this increment) remains.

---

## 1. Q1 — Toolbar: where to hook the pill, is `modelId` reachable?

- **`Toolbar.tsx` does NOT currently receive `modelId`.** Props interface `ToolbarProps` (`Toolbar.tsx:12-55`) has `isMetamodel?: boolean` but no model id.
- **`modelid` IS available at the mount site** in `EditorV2.tsx`: it is already passed to the sibling producer at `EditorV2.tsx:3457` — `<UniquenessProblemSync modelid={modelid} />`. `isModelMode` is available too (used at `:3497` as `isMetamodel={!isModelMode}`).
- **Hook point for the pill (right side of the toolbar):** the toolbar renders a `.toolbar-spacer` at `:440` then the editor-mode toggle + zoom (`:442-524`). The natural right-aligned slot is **after `.toolbar-spacer`, before the editor-mode toggle** (or between zoom and the panel toggle). Concretely: render `<ValidationPill modelId={modelId} />` immediately after the spacer at `Toolbar.tsx:440`.
- **Threading:** add an **optional** `modelId?: string` prop to `ToolbarProps` (additive — allowed by CLAUDE.md rule 11) and pass `modelId={modelid}` from `EditorV2.tsx:3465`.
- **Metamodel suppression:** `useConformance` already returns `null` for metamodels (`useConformance.ts:29`, `lModel.isMetamodel`) and for models with no metamodel it returns `status:'unknown'`. `ValidationPill` renders nothing on `null`/`conformant`. So passing `modelId` unconditionally is safe; "Metamodelli: mai la pill" is satisfied by the hook. (The hook must be called unconditionally ⇒ `ValidationPill` calls it internally; Toolbar renders `<ValidationPill>` only when `modelId` is defined.)

**Not a blocker.** `modelId` is reachable; threading is additive.

---

## 2. Q2 — Registry key convention: how does `ConformanceViolation.objectId` map to the registry `nodeId`? ⚠️ **GATE**

`registerProblem(p)` keys on `p.nodeId` (registry.ts:36-47, snapshots by `p.nodeId` at `rebuildSnapshots` :69-89). `UniquenessProblemSync` uses `nodeId = LObject.id` (**DObject id**), from `detectDuplicateNames(model)` whose keys are `obj.id` (`nameUniqueness.ts:106`), and `relatedNodeIds = colliding.map(o => o.id)` (DObject ids). Problem id = `` `${kind}:${nodeId}` `` (`UniquenessProblemSync.tsx:36`).

`ConformanceViolation.objectId` is the **DObject id** in every per-object violation (`ConformanceValidator.ts` sets `objectId: objId` where `objId = obj.id`, e.g. `:54,:61,:405`). The single **model-level** violation uses `objectId: modelId` (`:419`, the CHECK-11 fail-visible post-pass).

**So far consistent with UniquenessProblemSync — BUT the two consumer surfaces do NOT share one id space:**

| Surface | Reads registry with nodeId = | Source |
|---|---|---|
| **TreeView row** | `expandKey` = **DObject id** (entity id in the tree) | `TreeViewContent.tsx:585-586` `problemKey = expandKey; useNodeProblems(problemKey)` |
| **Canvas ObjectNode** | `id` = **DVertex id** (ReactFlow node id) | `ObjectNode.tsx:34` `function ObjectNode({ id, … }: NodeProps)`, `:359` `<NodeProblemIndicator nodeId={id} />` |

**Proof the canvas node id is the DVertex id (NOT the DObject id):**
- Steady-state build: `jjomTransformers.ts:328-338` — `objectVertexToRFNode` returns `{ id: vertex.id, type:'objectNode', … }`. `vertex.model` is the DObject; `vertex.id` is the DVertex.
- Interactive create paths agree: `EditorV2.tsx:623` and `:2282` set `id: vertexId`, where `vertexId = syncCreateObject(...)` → `createVertexForObject(...)` → **`return dv?.id`** (the DVertex id) — `canvasToJjom.ts:1182-1193`.
- The two entities are provably distinct: `DVertex.new(0, dObjectId, graphId, …)` creates a fresh DVertex whose `.model` field = the DObject; `findVertexIdForObject` (`canvasToJjom.ts:1203-1213`) exists precisely to scan `graph.subElements` for `ge.className === 'DVertex' && ge.model === objectId`.

**Consequence (high-confidence static finding):**
- A problem registered with `nodeId = objectId` (DObject) lights the **TreeView row** ✅ but is **invisible on the canvas ObjectNode** (which reads by DVertex id) ❌.
- Therefore the **existing `UniquenessProblemSync` canvas dot appears to be inert on the canvas** — it registers by DObject id, but the canvas looks it up by DVertex id. It works on the TreeView only. (Not runtime-confirmed — see §8 probe. The uniqueness feature is rarely exercised because setters hard-block duplicates; the canvas gap could have gone unnoticed.)

**Why this is a gate, not a "just do it":**
- Verification step 1 of the prompt requires **both** "badge rosso su A_0" (canvas) **and** "TreeView con triangolo sulla riga di A_0". A single registry entry per object cannot satisfy both because the two surfaces use different keys.
- `findVertexIdForObject` is **not exported** (local to `canvasToJjom.ts:1203`); there is **no exported object→vertex helper** for a producer. `ObjectNode.data` (`{label, instanceOfClassName, instanceOfClassId, features}`) does **not** carry the DObject id, so the canvas component cannot currently self-map either.

**Resolution options (design decision needed — see §7).**

---

## 3. Q3 — Where `UniquenessProblemSync` is mounted (mimic its placement)

`EditorV2.tsx:3457` — `<UniquenessProblemSync modelid={modelid} />`, first child of the `editor-v2` root div, sibling to `PalettePanel`/`Toolbar`. It is a render-null producer.

→ **`ConformanceProblemSync` should mount right next to it** at `EditorV2.tsx:3457`: `<ConformanceProblemSync modelid={modelid} />`. Same `modelid` prop.

**Note (double compute):** the pill (`ValidationPill` in the Toolbar) and the producer (`ConformanceProblemSync`) would each call `useConformance(modelid)` independently ⇒ **two debounced `validateConformance` runs per change**. The prompt forbids modifying `useConformance`, so this duplication is accepted; validateConformance is a pure read-only pass (WP1 log: "reads L-proxy shapes, writes nothing"). Flagged, not a blocker.

---

## 4. Q4 — Extending the `NodeProblemKind` union (consumers that switch/narrow on kind)

`NodeProblemKind = 'duplicate-name'` (registry.ts:28) — closed union. Consumers examined:
- `UniquenessProblemSync.tsx:98` — `if (p.kind !== DUPLICATE_KIND) continue;` — only touches its **own** kind; additive-safe.
- `NodeProblemIndicator.tsx` — `pickSeverityClass` narrows on **severity**, not kind. No kind switch.
- `NodeProblemOverlay.tsx` — `pickSeverityClass` on severity; renders `title`/`description`/`action` generically. **No kind switch** today; I will ADD a `kind === 'conformance'` branch for the per-violation rows.
- `TreeViewContent.tsx:587-602` — `topProblem` picks by **severity**; tooltip uses `description||title`. No kind switch.

**Extension is additive:** `NodeProblemKind = 'duplicate-name' | 'conformance'` + an **optional** payload field on `NodeProblem` (e.g. `conformance?: { violations: {violationType; severity; message}[] }`) to carry the aggregated list for the overlay/count. Adding an optional interface property is allowed (rule 11). **No structural registry change.** ⇒ this half of the gate ("estensione non additiva") is **NOT** triggered; only the id-space half (§2/§7) is.

---

## 5. Q5 — Indicator/Overlay structure (count badge + conformance rows)

**`NodeProblemIndicator.tsx`** (dot):
- Renders `null` if no problems (`:23`). Picks `severityClass` from severity (`:11-16,:25`), `primaryProblem = problems[0]` for overlay toggling (`:26-33`). Dot is a `<button class="node-problem-dot node-problem-dot--{severity}">` (`:39-47`), overlay rendered when open (`:48-54`).
- **SCSS** (`NodeProblemIndicator.scss`): `.node-problem-dot` is `position:absolute; top:-6px; right:-6px; 12×12; border-radius:50%`, `--warning #f59e0b`, `--error #dc2626`, `--resolved #22c55e`, pulsing `::before` aura, `box-shadow: 0 0 0 2px white …` (the 2px white ring). No numeric-count element today.
- **For the count** (prompt: badge 16px, offset −7px top-right, white 2px border, number when >1): add an inner count element. **Count semantics** = number of violations on the node = `sum over node's problems of (p.conformance?.violations.length ?? 1)`. `>1` ⇒ show number; `==1` ⇒ plain dot (keeps duplicate-name unchanged: it has no payload ⇒ counts as 1 ⇒ no number). No layout shift (absolute-positioned).

**`NodeProblemOverlay.tsx`** (popover):
- Portal to `document.body` (`:173`), placement engine (`:112-155`), outside-click/Escape close (`:95-109`). Maps over `problems` rendering `title`/`description`/optional `action` (`:190-214`). `pickSeverityClass` drives the left accent border (`--warning/--error/--resolved`, SCSS `:17-19`).
- **For conformance kind**: when `p.kind === 'conformance'`, render **rows** from `p.conformance.violations` — each row = severity icon + human message + a mono 10px chip with `violationType`. Reuse the existing `.node-problem-overlay__problem` container; add row/chip classes in `NodeProblemOverlay.scss`. **No redesign for the `duplicate-name` kind** (its existing title/description/action branch stays).
- **Overlay node-navigation caveat**: the overlay's `relatedNodeIds`→`querySelector('.react-flow__node[data-id="…"]')` (`:125`) and `action.targetNodeId` navigation (`:157-166`, `rf.fitView({nodes:[{id:target}]})`) operate on the **canvas node id = DVertex id**. For conformance rows we do **not** need cross-node navigation (single-object detail), so `relatedNodeIds` can be empty and no action is set — sidestepping the id-space issue for navigation. (The dot/overlay *appearing at all* on the canvas still depends on §2/§7.)

---

## 6. Q6 — Full FASE-2 file list (>5 ⇒ confirm before implementing)

**C — ValidationPill (toolbar):**
1. `components/editor-v2/problems/ValidationPill.tsx` — NEW. `useConformance(modelId)`; render nothing on `null`/`conformant`; error/warn/unknown variants; fixed slot (no reflow).
2. `components/editor-v2/problems/ValidationPill.scss` — NEW. Classes `validation-pill`, `--errors`, `--warnings`, `--unknown` (grep-verified free — see §9).
3. `components/editor-v2/Toolbar.tsx` — MOD. Add optional `modelId?`; render `<ValidationPill>` after `.toolbar-spacer` (`:440`).
4. `components/editor-v2/EditorV2.tsx` — MOD. `modelId={modelid}` on `<Toolbar>` (`:3465`); mount `<ConformanceProblemSync modelid={modelid} />` (`:3457`).

**A — producer + badge/popover:**
5. `components/editor-v2/problems/ConformanceProblemSync.tsx` — NEW. Consume `useConformance(modelid)`; aggregate violations per object (skip model-level / unresolvable); register/cleanup.
6. `components/editor-v2/problems/registry.ts` — MOD (additive). `NodeProblemKind += 'conformance'`; optional `conformance?` payload on `NodeProblem`.
7. `components/editor-v2/problems/NodeProblemIndicator.tsx` — MOD. Count badge when total>1.
8. `components/editor-v2/problems/NodeProblemIndicator.scss` — MOD. Count-badge styles.
9. `components/editor-v2/problems/NodeProblemOverlay.tsx` — MOD. `conformance` rows (severity icon + message + violationType chip).
10. `components/editor-v2/problems/NodeProblemOverlay.scss` — MOD. Row/chip styles.

**Test:**
11. `components/editor-v2/problems/__tests__/conformanceProblems.test.ts` (or a pure `conformanceToProblems.ts` mapping module + test) — NEW. Mapping violations→problems, per-object aggregation, cleanup. (Registry is module-level + timers; a **pure mapping function** extracted from the producer is the testable unit — the producer itself is a hook/effect. Recommend extracting `conformanceToProblems(result, resolveNode)` as a pure fn.)

**Extra files IF the canvas mapping needs Option A/B (§7):**
- Option A (dual-register, producer-only): no new files, but the producer needs an **object→vertex resolver** (store scan) since none is exported.
- Option B (canvas reads object id): also `ObjectNode.tsx` + `jjomTransformers.ts` + `types.ts` (add object id to `ObjectNodeData`) + overlay highlight/nav review — and it **changes committed uniqueness behavior**.

**Revert (per §0.1):** `pages/components/Navbar.tsx` → HEAD (pending Alfonso's OK).

Total: **~11 files** (excluding the Navbar revert and any Option-A/B additions). Over the 5-file threshold ⇒ explicit confirmation required.

---

## 7. THE GATE — canvas `objectId → nodeId` mapping decision

The registry entry that must light the **canvas ObjectNode** has to be keyed by the **DVertex id**, but the entry that lights the **TreeView row** has to be keyed by the **DObject id**. `ConformanceViolation.objectId` is a DObject id. Pick one:

- **Option A — dual registration (producer-only, additive, RECOMMENDED).** For each violated object, `ConformanceProblemSync` registers **two** problems: one `nodeId = objectId` (TreeView) and one `nodeId = <resolved DVertex id on the open graph>` (canvas). Needs an object→vertex resolver (build a `Map<objectId, vertexId>` from the store for the open model's graph — same idea as `vertexIdByModelId` in `useJjomSync.ts`, or export/duplicate `findVertexIdForObject`). Pros: no change to committed components; both surfaces light. Cons: two entries per object; the count badge must not double-count (dedupe by surface); does **not** fix the uniqueness canvas gap (out of scope).
- **Option B — make the canvas key by object id (fixes uniqueness too, but invasive + changes committed behavior).** Pass the DObject id to `NodeProblemIndicator` on the canvas (add object id to `ObjectNodeData` via `jjomTransformers.ts` + `types.ts`, then `<NodeProblemIndicator nodeId={data.objectId}/>`). Then one registry entry (object id) lights both surfaces. Cons: touches `ObjectNode`/transformers/types (not in the prompt's file set), changes the semantics of a committed component, and the overlay's node navigation (`data-id` = vertex id) needs reconciling. Requires approval (rule 3/20).
- **Option C — TreeView-only badge, canvas deferred.** Register only by object id (mimic uniqueness exactly). TreeView triangle works; canvas dot does not appear (consistent with the current apparent uniqueness behavior). **Fails prompt verification step 1** ("badge rosso su A_0" on canvas). Only viable if Alfonso accepts deferring the canvas badge.

**My recommendation: Option A** — smallest blast radius, keeps committed components untouched, satisfies both verification surfaces. But this is Alfonso's call because it contradicts the prompt's stated premise and because it exposes a probable pre-existing uniqueness-canvas gap.

---

## 8. Suggested 20-second runtime confirmation (before FASE 2)

On `localhost:3000`, project `ddddd`, `model_10` open with A_0 duplicated-name or required-empty:
1. DevTools console: `Object.keys(window._jjNodeProblems)` after a uniqueness collision — are the keys DObject ids or DVertex ids?
2. Inspect the A_0 canvas node: `document.querySelector('.react-flow__node[data-id]')` — its `data-id`. Compare to the registry key.
3. If the registry key ≠ the canvas `data-id`, the canvas uniqueness dot is confirmed inert on canvas ⇒ Option A/B needed for conformance. (Static analysis already indicates this with high confidence.)

---

## 9. Grep-verified new-identifier safety (§4.3)

- `validation-pill`, `validation-pill--errors|--warnings|--unknown` — `grep -rn "validation-pill" frontend/src` = 0 (to run at implement time).
- `ConformanceProblemSync`, `ValidationPill`, `conformanceToProblems` — no existing symbol (to confirm at implement time).
- CSS `.appbar-tab__conformance` exists ONLY in the uncommitted Navbar leftover (no SCSS) — will vanish on the recommended revert.

---

## 10. Open questions for Alfonso (gate)

1. **Canvas mapping (§7): A, B, or C?** (Recommend **A**.)
2. **Navbar leftover (§0.1): revert to HEAD?** (Recommend **yes** — the pill supersedes the tab dot.)
3. **Commit plan: step 1 already committed (`6a438569c`).** Confirm the only commit for this session is step 2 `feat(validation-ui): …`. (No re-commit of WP1.)
4. **Double `validateConformance` compute (§3):** accept the pill + producer each running the hook? (Recommend accept; hook is pure/read-only and forbidden to modify.)
</content>
</invoke>
