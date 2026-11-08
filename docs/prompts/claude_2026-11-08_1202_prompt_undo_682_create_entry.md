# #682 Phase 2: a canvas create opens its own undo entry (core, reducer)

Prompt-ID: P-2026-11-08-1202
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full, core change (redux reducer), two-phase Phase 2 with Layer Impact Report
Depends: discovery P-2026-11-08-0916, report docs/discovery/discovery_2026-11-08_canvas_create_undo_682.md (on this branch)
Worktree: ~/jjodel-w-undo682, branch undo-682-create-entry (from disc-682-canvas-undo 2eb74325d, own node_modules)
Request: Alfonso 2026-11-08 11:59: GO on #682, a container create is one Undo step, «decidi tu» on the other questions of §10, «procedi in lane auto»

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Core change allowed only in frontend/src/redux/reducer/reducer.ts and its tests; no CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-08-1202 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole probe or gate log, grep its summary lines. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-1202/handoff.md (what is committed, what is left, the next command) before anything else.

## Decisions (answers to §10 of the report)

1. Adopt option 1 with the compose branch (§7), as a core change.
2. M2 in the same lane: the rule treats a delta that adds to root classs like one that adds to root objects (§6.2 measured the same defect). enumerators and packages: measure first with the same probe; include them only if they show the same defect, and say which in the report.
3. A container create is ONE Undo step (Alfonso): the container, its children and their vertexs created by one gesture undo together. If option 1 alone splits it, use the compose route for the append, and measure it.
4. A create inside the 450 ms window also opens its own entry (R1 of §8): one Undo removes the dropped object and nothing older. Deltas that only touch the graph and arrive after it (the sync vertex, §6.3) still merge into the create's entry, exactly, through composeUndoDeltas, so no orphan vertex is left.
5. reducer.ts:1284 (§6.4) is NOT touched here: open a separate ticket with lane-run ticket (front codegen, priority low, found P-2026-11-08-1202).

## COSA

(1) **Layer Impact Report** first: finalize the draft of §9 into docs/discovery/lir_2026-11-08_canvas_create_undo_682.md with the decisions above, and commit it before code.

(2) **Reducer**: the change of §7 option 1 at frontend/src/redux/reducer/reducer.ts:1290 and the compose branch between :1305 and :1306, extended per decisions 2, 3 and 4. Re-read the lines first: the trunk may have moved since the report. Keep R-UNDO-5: the time-window merge of two non-graph writes keeps objectMergeInPlace. The Text tab apply, T8, E2, Preview, JjTL and the Instance Manager leave at :1279 and must stay unchanged; the group path and the tail branch :1300 unchanged.

(3) **Tests** in the undoGroup.test.ts harness with the real _reducer, as §7 lists: a delta with objects and vertexs at +1000 ms is an entry and one undo restores idlookup and the root arrays; the same at +300 ms (decision 4) is also an entry; a vertexs-only delta right after a create merges into it and one undo leaves no DVertex; a move is an entry; a container create is one step; the M2 class case; the group path and the tail branch unchanged. Mutation bench: drop !delta.objects, drop the compose branch, drop the window override; each must kill a test.

(4) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run smoke if the script exists.

(5) **App check**: rerun the discovery probe of ~/.jjodel-lanes/P-2026-11-08-0916/ (copy it and what it imports) against the real tree on its own port, cases A to G of §5 plus the container create; crops 1-create-undo (after one Undo the dropped object and its vertex are gone and the previous edit is intact), 2-move-undo (a move still undoes as before), 3-container (one Undo removes the container and its children) in ~/.jjodel-lanes/P-2026-11-08-1202/. Measure from the store and idlookup, not from the screenshot.

(6) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge the dash, Causa from the taxonomy in parentheses, Layer Impact Report the LIR path), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/redux/reducer/reducer.ts (the merge rule and the compose branch only), its undo tests (undoGroup.test.ts or a new test beside it, grep the name first), docs/discovery/lir_2026-11-08_canvas_create_undo_682.md. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_canvas_create_undo_682.md (§4 to §10); ticket #682; docs/decisions.md R-UNDO-5; CLAUDE.md on core changes and the Layer Impact Report.
