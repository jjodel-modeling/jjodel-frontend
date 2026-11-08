# Undo below a tab open: a graph-only delta writes no undo entry (option B, core)

Prompt-ID: P-2026-11-08-1800
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full, core change (frontend/src/redux/reducer/reducer.ts), two-phase Phase 2 with Layer Impact Report
Depends: discovery P-2026-11-08-1719, report docs/discovery/discovery_2026-11-08_undo_tab_open_graphs.md (on this branch, b41af1105); #682 Phase 2 (d79d51f90)
Worktree: ~/jjodel-w-undotabb, branch undo-tab-graphs-b (from disc-682b-tab-graphs b41af1105, own node_modules)
Request: Alfonso 2026-11-08 17:58 «si a tutto» on option B; the chat decides the minor questions of §9

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Core change allowed only in frontend/src/redux/reducer/reducer.ts and its undo tests; no CLAUDE.md 3.1 file (no VersionFixer, no useJjomSync), no new dependency. Every reply opens with [P-2026-11-08-1800 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole log. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-1800/handoff.md first.

## Decisions (§9 of the report)

1. Option B: a delta that lengthens root graphs and writes no model root writes no undo entry.
2. The M2 open-time layout entry: its own ticket, not this lane.
3. The vertex-only populate (R1): measure it in this lane with the same probe and report; fix only if option B covers it unchanged, otherwise a ticket.
4. A graph left behind after the Undo of its model's creation (R3) is acceptable, since Redo reuses it.
5. Saved projects with orphan graphs are left as inert data: no migration (VersionFixer is critical zone).
6. Tickets for the dead guard (§4.4, ModelTab.tsx:33-34) and for the v2-flow id written twice in root graphs (§4.7).

## COSA

(1) **Layer Impact Report**: finalize the §8 draft into docs/discovery/lir_2026-11-08_undo_tab_open_graphs.md with the decisions above, committed first. Re-read the reducer lines: the trunk moved with #682 Phase 2.

(2) **Fix** in reducer.ts, the guard of option B, placed so it composes with the #682 rule (a create's own entry, compose only into a create's entry) and leaves the transformation path, the group path and R-UNDO-5 unchanged. Measure the transformation path the report did not try.

(3) **Tests** in the undo harness with the real _reducer, red first: a tab open (graphs only) writes no entry; Undo below it leaves DGraph totals unchanged and no orphan; two tabs on one model; empty stack; a model create still opens its entry (#682 tests stay green); mutation bench on the guard condition, each mutant killed.

(4) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 import reds baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run smoke if the script exists.

(5) **App check** with the probe of ~/.jjodel-lanes/P-2026-11-08-1719/ copied, on its own port, the cases of §5 (M2 tab, M1 tab, two tabs, empty stack, deeper Undos, one Redo): DGraph totals and orphans before and after, from the store; crops 1-m1-undo, 2-two-tabs in ~/.jjodel-lanes/P-2026-11-08-1800/.

(6) **Tickets** with node scripts/lane-run.mjs ticket --front codegen --priority low --found P-2026-11-08-1800: the M2 layout entry (decision 2), R1 if not fixed (decision 3), the dead guard and the twice-written id (decision 6).

(7) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge the dash, Causa the dash, Layer Impact Report the LIR path), Status flips of this prompt and of the discovery prompt P-2026-11-08-1719; left uncommitted (RC-17). Edit only your new entry's lines. No push, no merge. Final message: what was verified and how, ticket numbers, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/redux/reducer/reducer.ts (the undo entry rules only), its undo tests, the LIR. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_undo_tab_open_graphs.md; docs/discovery/lir_2026-11-08_canvas_create_undo_682.md; docs/decisions.md R-UNDO-5; CLAUDE.md on core changes.
