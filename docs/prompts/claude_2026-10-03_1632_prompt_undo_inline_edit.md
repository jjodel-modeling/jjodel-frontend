# Prompt: Cmd+Z does not revert an inline edit on the canvas (discovery with Layer Impact Report, then fix)

Prompt-ID: P-2026-10-03-1632
Chat: C-2026-10-03-1610
Lane: full (two-phase: Phase 1 discovery read-only with the Layer Impact Report, hard stop; Phase 2 after the chat's GO in the same session). Tier: heavy (RC-32: critical zone). Model: the default of `.claude/settings.json`, no deviation. Critical-zone go-ahead: RC-30, given by the chat at launch (`--critical-zone-goahead P-2026-10-03-1632`); the Layer Impact Report is still the first step of Phase 2.
Status: eseguito 2026-10-03 · lane undo-inline-edit · ac64b213b · non fuso: hard-stop, fix (A) of the report adopted as recommended (RC-21, unattended), gates green (typecheck 14, vitest 6990 with the 9 known import reds and 4 env-only hook reds, build), lane probe on 3077 (light) 33/33 (Phase 1 base 21 PASS / 12 FAIL, the fix patched in flight 35/35), mutation bench 6/6, the four default scenes 0 px from the d2a1866b6 reducer (second pair; DemoFlowB varies run to run on the same code), crops in ~/.jjodel-lanes/P-2026-10-03-1632/crops/, verifica visiva alla chat

Worktree: `~/jjodel-w-undoinline`, branch `undo-inline-edit`, cut by the chat from `alfonso-frontend-jjtl` at `d2a1866b6`, `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this prompt); if any differs, stop with `Outcome: blocked`.

## COSA

Ticket in `docs/log-inbox/symbol-editor.md` (about line 92, found by lane P-2026-10-02-1647): an attribute written through `syncUpdateFeatureValue` (the IR compartment row value edit, the R-IRN-41 path label edit, a direct call) pushes an undo entry whose only key is `action_title`, with no `idlookup` delta. One Cmd+Z pops it (history depth 11 to 10) and the value stays. Measured on `aa04b92fb`, with the row edit of the trunk path as control. Either the value change is merged into another entry or `Uobj.objectDelta` (`frontend/src/redux/reducer/reducer.ts` about lines 1203-1265) misses it. Pre-existing on the trunk. Alfonso had postponed it to after MODELS and on 2026-10-03 asked to run it now.

Related, read only, not to fix here unless the report shows it is the same cause: the 2026-09-30 ticket «two writes under 450 ms merge into one undo step keeping only the first change» (`sessione_CORRENTE.md`, section of chat C-2026-09-30-1815).

The question: why does undo not restore the value, and what is the smallest fix that makes Cmd+Z restore it (and Cmd+Shift+Z redo it) for every inline write on the canvas, without changing undo for any other action.

## DOVE

Phase 1: read-only on the app. You may add a probe under `frontend/scripts/probe/` (grep the name first) and copy fixtures from `/Users/alfonso/jjodel-demo-exports/` (read-only) into `frontend/scripts/probe/fixtures/` only if needed, plus the discovery report `docs/discovery/discovery_2026-10-03_undo_inline_edit.md` (§0 «Answer in brief» first, at most 40 lines) and the Layer Impact Report under `docs/lir/`.

Phase 2: only the files the report names and the GO approves. Expected: `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (critical zone, go-ahead given) or the reducer's undo code (`frontend/src/redux/reducer/reducer.ts` and the `Uobj` helpers), plus their tests. Lane P-2026-10-03-1304 (another chat, branch `derived-notations-edges`) is changing `viewpoint/ir/`, `edges/` and `utils/edgeUtils.ts`; never touch those; if the fix needs one of them, stop with `Outcome: question`. `useJjomSync.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`: not in this lane; stop with `Outcome: question` if the fix needs one.

## COME

### Phase 1, read-only, ends at a hard stop

1. Read `CLAUDE.md` (sections 3, 5, 6, 17, 21.2), `docs/PROTOCOL.md` P16, RC-14, RC-21, RC-25, RC-26, RC-30, the ticket in `docs/log-inbox/symbol-editor.md`, the undo code of the reducer (`Uobj`, `objectDelta`, the history push and its merge window), `syncUpdateFeatureValue` and its callers (the IR row edit, the path label edit `irLabelEdit.ts`), and one action that undoes correctly as control (for example a node rename from the properties panel).
2. Reproduce with a probe through `lane-run probe <worktree> <probe.ts> --port 3077` (never 3000, 3001 or 3003), light theme, on DemoFlowB or DemoPetri imported from `~/jjodel-demo-exports/`: an inline row value edit, a path label edit, and the control action; for each, the history entry pushed (keys, delta present or not), the depth before and after Cmd+Z, the value after Cmd+Z and after Cmd+Shift+Z. Numbers, not impressions.
3. Name the cause with file and line, and propose the smallest fix with its layer impact (which layers write, which read, what other actions share the path). Say whether the 450 ms merge ticket has the same cause.
4. Commit the probe and the report (`docs:` / `probe:`), then stop with `Outcome: hard-stop`, the report's path and its «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

### Phase 2, after the chat's GO

5. Layer Impact Report first, committed before the edit. Tests red first (undo restores the row value; undo restores the path label; redo reapplies both; the control action unchanged).
6. Implement. Gates in the foreground: `npm run typecheck` (no new errors over §17's baseline), the full vitest suite (`npm test`), `npm run build` exit 0. Mutation bench on the fix (each mutant killed or explained). Rerun the probe of step 2: the three cases restore and redo.
7. Crops in `~/.jjodel-lanes/P-2026-10-03-1632/` of the value before, after the edit, after Cmd+Z, after Cmd+Shift+Z. The four demo scenes open with no console error and their default views are byte-identical to `d2a1866b6`.
8. Take the trunk if it moved (RC-14) and rerun gates and probe. Commits: `fix:` code and tests, then the closure docs commit (Status flip with lane, shas, gates, probe outcome; append under the ticket in `docs/log-inbox/symbol-editor.md`); stage by explicit path. Stop with `Outcome: hard-stop` for the chat's visual check. Do not merge to the trunk.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, removing the `frontend/node_modules` link.

## RIFERIMENTI

Ticket in `docs/log-inbox/symbol-editor.md` (P-2026-10-02-1647); R-IRN-41 (path label edit); RC-30 (critical-zone go-ahead for orchestrated lanes); `sessione_CORRENTE.md`, sections of chats C-2026-09-30-1815 and C-2026-10-01-2220.
