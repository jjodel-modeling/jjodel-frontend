# log-inbox — lane «jjodie-ui-m2»

Entries written by the Jjodie M2 scripts lane (front jjodie-ui, branch `jjp-m2`) in a file of its own, so parallel lanes do not collide (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — feat: jjodie M2 scripts in the planner, the script card and the ghost preview
**Prompt**: P-2026-10-24-1520 (stopped at the context ceiling before its first test run, wip 4ad31c758) and its continuation P-2026-10-24-1600: plan the M2 JjScript commands read-only, M2 chips on the card, ghost preview on M2 canvases, planned/real Apply check on M2, mixed scripts per level; the M2 probe and the gates.
**Files touched**: frontend/src/jjscript/executor/effectsPlanner.ts, planWorld.ts, __tests__/effectsPlannerM2.test.ts (new) (4ad31c758); __tests__/effectsPlanner.test.ts, __tests__/effectsPlannerM2.test.ts (c66d3c049); frontend/src/components/Jodie/ChatMessages.tsx, ScriptCard.tsx, frontend/src/components/editor-v2/preview/PreviewBar.tsx, previewApplyCheck.ts, __tests__/previewApplyCheck.test.ts (c4015260b); previewElements.ts, __tests__/scriptPreview.test.ts (977552f80); frontend/scripts/probe/jjodie-m2-preview.ts (new) (850148d93); docs/log-inbox/jjodie-ui-m2.md (new), the Status of prompts 1520 and 1600 (this commit)
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 15:20
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Causa (g): 1520 hit the 200k context ceiling. Out of scope: PreviewBar.tsx and ChatMessages.tsx, authorised by the Deroga of 1600 (RC-25); 15 files over the lane (RC-11), listed above. Bench 10/10 killed (M6 survived first, new test). Probe m2-preview 20/20 on 3016; smoke GREEN on the re-run after the known first-load timeout; s4c ALL PASS, udo DONE exit 0; vitest 11968 passed, 9 known import failures. Evidence: ~/.jjodel-lanes/P-2026-10-24-1520/handoff.md.
**Prompt document name**: 2026-10-24 16:00

**Discovery** (section 1 of P-2026-10-24-1520). Dispatcher `executor.ts:161-232`: create, delete, rename, set, add, remove, move, copy, list, show, help, undo, redo, clear, validate, extends, eval, let, forall, abstract, block. `create.ts:215-452`: `instance` is M1 (:234), the M1 level refuses the rest with `WRONG_LEVEL` (:239-269); parent kinds `PARENT_KINDS_BY_ELEMENT_TYPE` (:128-142); default parent `utils.ts:225-279` (first package of the metamodel, else the metamodel); uniqueness `checkM2NameUniqueness` (:371-378, classifiers metamodel-wide, features own and inherited); superclasses settled before the class (:493-501, `PARENT_NOT_FOUND`); type clause `TYPE_CLAUSE_RULES` (:592-625); attribute default EString (:737-739). `set.ts:53-156`, `rename.ts:65-142`, `delete.ts:47-135`, `extends.ts:44-137`, `add.ts:19-42` (a create with `to` as parent), deferral `runPasses.ts:94-142`. Canvas: `EditorV2.tsx:143-148` node types `classNode`, `enumNode`, `packageNode`, `objectNode`; edge types `reference`, `inheritance`, `composition`, `instanceRef` (:189-194); ghost styles `PreviewBar.scss:73-120`. Positive control for the absences: the probe's planner call returns `level: 'M2'` with six creates and one generalization on the live fixture, and the S2 probe (below) still finds the M1 card next to the new M2 one. Declared limits: `move`, `copy`, an M2 `remove`, `let`, `forall`, blocks stay `unsupported`; M2 names resolve inside the metamodel only; M2 ghosts stack in one column, so an edge between two stacked ghosts runs through them (crop `m2-canvas-ghosts.png`).

## 2026-10-24 — ticket: jjodie S2 probe pins the interim no-card rule for M2 replies
**Ticket**: `frontend/scripts/probe/jjodie-s2-script-card.ts` injects an M2 reply before the M1 one, reads `cards[0]` and checks (line 246) that an M2 reply keeps the open block with Run: the interim rule of R-JJD-10 that P-2026-10-24-1600 retires. On the jjp-m2 tip it fails 8 checks (20 pass), all from the M2 card now drawn first. Fix: read the card of `msg_s2_card` by message, and turn line 246 into "an M2 reply gets the card". Not edited here: outside the DOVE.
**Priority**: medium
**Found in**: P-2026-10-24-1600
**Detail**: ~/.jjodel-lanes/P-2026-10-24-1600/probe-s2.log
