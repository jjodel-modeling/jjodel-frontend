# log-inbox — lane «views»

Entries written by the views lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-02 — fix(editor-v2): IR node corners and shadow no longer clipped at rest (P-2026-10-01-2336)
**Prompt**: `claude_2026-10-01_2336_prompt_ir_corner_clip.md`, fast lane, light tier, Phase 1 then Phase 2 in cascade on `~/jjodel-w-irclip` (branch `ir-corner-clip`). The corners of an IR rect symbol on an M1 node (an Activity action drawn as `rect`) were clipped at rest by the wrapper's `overflow: hidden`; the fix lifts the clip for every wrapper that hosts an IR shape. Q1 (one test added to the scope) answered by the chat as recommended.
**Files touched**: Phase 1 `8cd4adb69`: `docs/discovery/discovery_2026-10-01_ir_corner_clip.md`. Code `0070222d8`: `frontend/src/components/editor-v2/nodes/instanceNode.scss` (one rule and its comment), `frontend/src/components/editor-v2/nodes/__tests__/irSelectionRing.test.ts` (one test). This commit: the report addendum (section 6) and this entry. The Status line of the prompt file is left at `da eseguire`: the `status-flip` skill is reserved for the user, so the flip is owed to the chat.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gates on `0070222d8`: `npm run typecheck` exit 2, 14 errors, the §17 set by file and code; `npx vitest run src/components/editor-v2` 105 files, 2559 tests, exit 0; `npm run build` exit 0. The one committed test that pinned the old rest state was changed on purpose (see Out-of-scope changes). The four default scenes and the two metamodel tabs 0 px from the before run; a census of 20 nodes finds nothing drawn past the wrapper's box at rest.
**Out-of-scope changes**: yes — `irSelectionRing.test.ts`, one test, not listed in the prompt: `expect(rgb).toEqual(CANVAS)` for an unselected IR node failed once the resting shadow showed (240,244,248 against 241,245,249). Added to the scope by the chat's ratified answer to Q1; the ring tests are untouched, mutation bench 1/1. Every other path is as the prompt listed.
**Layer Impact Report**: not-required (no §3.1 file touched)
**Smoke visivo**: chat (pending), lane probe on 3077, light, DPR 2: before run 49/49, after run 103/103; crops `sips -Z 600` in `frontend/scripts/smoke/_tmp_irclip_crops/` (gitignored): `ic_triptych_<label>_600.png` [before rest | after rest | after selected] per form, `ic_before_triptych_*` the defect, `ic_after_hover_*` the anchors.
**Notes**: Reading confirmed on 19 nodes. Corrections: no M2 IR node exists (IRNodeContent renders only in ObjectNode); radius 7 and up and the Activity action at 14 keep their corners but lost the shadow. irSelectionRing.test.ts pinned the old rest state: stopped with a question, scope added by the chat. Anchors on hover now draw whole (accepted). Report with addendum: docs/discovery/discovery_2026-10-01_ir_corner_clip.md.
**Prompt document name**: 2026-10-01 23:36

**Ticket** (observation, low, not a ticket of its own): the Chromium-laid-out vitest files (`irSelectionRing`, `irCollapsedRender`, `irActivityRender`, `irC2Render`) time out (hook 10 s, test 15 s) when the machine load is above about 25; a gate run in that state reads red without an assertion failing. `lane-run probe` also met a cold-server flake twice ("Failed to fetch dynamically imported module", "Execution context was destroyed"), absorbed by a warm-up in the probe, not in the app.

## 2026-10-02 — merge: ir-corner-clip into alfonso-frontend-jjtl (P-2026-10-02-1501)
**Prompt**: `claude_2026-10-02_1501_prompt_merge_ir-corner-clip.md`, a merge in a session (`lane-run merge --direct` fell back: a union hunk edits a base section of `docs/log-inbox/views.md`): `ir-corner-clip` at `50d87c3ba` into `alfonso-frontend-jjtl`, merge base `4b9bc5836`, 5 commits on the branch side.
**Files touched**: merge `3db161e62`: 5 files from the branch side (`docs/discovery/discovery_2026-10-01_ir_corner_clip.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-10-01_2336_prompt_ir_corner_clip.md`, `frontend/src/components/editor-v2/nodes/__tests__/irSelectionRing.test.ts`, `frontend/src/components/editor-v2/nodes/instanceNode.scss`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `3db161e62`: typecheck 14, the §17 set; typecheck:scripts exit 0; vitest 6457 in 260 files (the trunk tip's 6457 in 260, the branch adds no test: `irSelectionRing.test.ts` counts 5 on both sides), 0 failed, the 9 known files red at import; hooks 344; build exit 0; check:docs 4/4; check:agents, check:scripts and check:addonly PASS.
**Out-of-scope changes**: no. 5 files, all from the branch side, listed above; the merge is the prompt's scope.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: the lane's crops checked before the merge (rect 4 and the derived action as rect: corners whole at rest, resting shadow, rest and selected differ by ring and band only, hover anchors whole); the merge shares no code file with the trunk side
**Notes**: Union in `docs/log-inbox/views.md`: the trunk's preamble, then the branch's entry P-2026-10-01-2336 and its ticket paragraph; the base's 80 entries, folded by `d2eb5fb83` and byte-identical in the log and its archive, not carried back. No rollback tag, pre-merge tip `eaead2d71`. The session started with nvm node v18 first on PATH (trunk tip 277 red there); gates ran on `~/.hermes/node/bin` v26.8.1. The tip then moved by `0be127357`, docs only.
**Prompt document name**: 2026-10-02 15:01

## 2026-10-02 — fix(editor-v2): IR node and row re-resolve on object and metaclass rename (P-2026-10-02-1645)
**Prompt**: `claude_2026-10-02_1645_prompt_ir_label_name_refresh.md`, fast lane, light tier, Phase 1 then Phase 2 in cascade on `~/jjodel-w-labelname` (branch `ir-label-name-refresh`). After a double-click rename of an M1 object whose class has no `name` attribute the store held the new name and the IR node kept drawing the old label: the `useIRView` signature carried the slot values but not `dObject.name`. The session was killed once by the Mac sleeping during the docs closure and resumed from the committed state.
**Files touched**: Phase 1 `acf5a9fc3`: `docs/discovery/discovery_2026-10-02_ir_label_name_refresh.md`. Code `7c92ffc2c`: `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (`objectSnapshotParts`, additive), `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` (the two selectors and one import name), `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irObjectSnapshot.test.ts` (new, 11 tests). Docs `8f5102d29`: the report addendum (section 7) and `docs/decisions.md` (R-IRN-39). This commit: this entry and the ticket below. The Status line of the prompt file is left at `da eseguire`: `status-flip` is user-only, so the flip is owed to the chat.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — gates on `7c92ffc2c`: typecheck exit 2, 14 errors, the §17 set by file and code; vitest 262 files, 6507 tests, 0 failed, the 9 known files red at import (`window is not defined`); build exit 0; `check:scripts` and `check:addonly` clean. Probe: the name-attribute control (B) follows by +5 s and after the tab round trip as before, and the four demo scenes are 0 px from `adb5d9731`.
**Out-of-scope changes**: no — three code files, all in the prompt's list (`irResolveCore.ts` additive, as the prompt allows). `useIRRowView`, a second selector of `irResolve.ts`, is fixed with the first: the report's Q1, answered by its recommendation, and the probe shows its row stale before and right after.
**Layer Impact Report**: skipped — the §3.1 table lists `viewpoint/ir/`, which holds both files; Phase 1 wrongly said it did not. The §3.2 trigger list names other files, the prompt named these two, and the change writes nothing to the D-layer or the sync layer; no report was written before the diff. The layers it would have named are in section 7.1 of the report.
**Smoke visivo**: passato — lane probe on 3171, light, DPR 2, 1600x1000: before (the two files at `adb5d9731`) 11 pass, 7 fail, the defect on A, C and D; after (`7c92ffc2c`) 21 pass, 1 fail; the one failure is the probe's own two-frame limit on the metaclass rename (stale at about 33 ms, right at the next read). Memo re-runs of the renamed node 0 to 1, of every other node 0 to 0; chat check pending. Crops `sips -Z 600` in `frontend/scripts/smoke/_tmp_labelname_crops/` (gitignored): `ln_<before|after>_{labels_rest,A_after_rename,final}_600.png`.
**Notes**: Q1 to Q4 answered as recommended (row hook fixed too, metaclass term the class's own name, edge-label gap and the stale comment at `useIRFormView.ts:79-82` ticketed). Bench 11/12, then 14/14: an inverted name/initialName fallback survived until a test held both. The hook wiring cannot load in the bench; the probe runs it. Report with addendum: docs/discovery/discovery_2026-10-02_ir_label_name_refresh.md.
**Prompt document name**: 2026-10-02 16:45

**Ticket** (observation, low, not a ticket of its own): a rename of a SUPERCLASS mid-session leaves an inherited view match stale, the metaclass term of `objectSnapshotParts` stops at the class itself (R-IRN-39). Also: three of four `lane-run probe` after runs died at start under a machine load of 131 to 60 (`page.goto` timeout, `Failed to fetch dynamically imported module` twice, `Execution context was destroyed`); the run that passed was at load 14. Same flakes as the corner-clip lane's ticket above.

## 2026-10-02 — ticket: IR edge labels and the form-hook comment after a rename
**Ticket**: an edge view's label (centre, template segment, end label) may take an `intrinsic` name or `metaclassName` (`irCompile.ts` `compileTextSource`), and the decoration memo of `useIRContainment.ts` (deps `[nodes, edges, irSig, collapseVersion, edgeInteractionVersion, oaeSlotsSig, markDep]`) observes no name: whether a rename re-runs it depends on `nodes`/`edges` changing identity, which was NOT measured (the probe scene has no edge view). Measure first with a reference-as-edge and an object-as-edge view carrying an intrinsic name label, then fix in `oaeSlotsSig` or the deps. Also: the comment at `useIRFormView.ts:79-82` says `useIRView` can leave the object's name out of its snapshot; after R-IRN-39 that is no longer true.
**Priority**: medium
**Found in**: P-2026-10-02-1645
**Detail**: docs/discovery/discovery_2026-10-02_ir_label_name_refresh.md
