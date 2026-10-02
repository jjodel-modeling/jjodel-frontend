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
