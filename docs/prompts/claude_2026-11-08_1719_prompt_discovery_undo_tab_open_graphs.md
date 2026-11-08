# Discovery: duplicate graphs after an Undo below a tab open (#682 residue)

Prompt-ID: P-2026-11-08-1719
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-08 · discovery · b41af1105 · report docs/discovery/discovery_2026-11-08_undo_tab_open_graphs.md · closed by P-2026-11-08-1800
Lane: discovery (read-only, no source change, report and hard stop)
Depends: #682 Phase 2 merged (d79d51f90), its LIR docs/discovery/lir_2026-11-08_canvas_create_undo_682.md and log entry
Worktree: ~/jjodel-w-disc682b, branch disc-682b-tab-graphs (from trunk 2df3c9a32, own node_modules)
Request: Alfonso 2026-11-08 16:23 «procedi in lane auto» on the candidate tickets of the checkpoint

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. This lane changes NO source file: the undo machinery is core (frontend/src/redux/reducer/reducer.ts). Every reply opens with [P-2026-11-08-1719 · session <id>]. Final line: Outcome: hard-stop (or blocked). Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole log. If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-1719/handoff.md first.

## COSA

The #682 Phase 2 lane (P-2026-11-08-1202, handoff in ~/.jjodel-lanes/P-2026-11-08-1202/) reported: undoing below a tab open still leaves duplicate graphs; that path keeps the old merge; not measured on the tree before the fix.

(1) **Measure** on the trunk and on the tag pre-undo-682-create-entry (a detached worktree under ~/.jjodel-lanes/P-2026-11-08-1719/, its own node_modules, removed at the end), with the probe of P-2026-11-08-1202 copied: open a model tab (its graph is created), make an edit, Undo twice or until the entry before the tab open; count graphs per model in the store and idlookup, before and after, and what one more Redo does. Also with two tabs on one model (multi-tab L6, on the trunk). Say whether the defect predates #682.

(2) **Read** why the tab open writes a graph through the undo stack at all, and where (file:line): the graph creation path on tab open, the merge rule path it takes, and how the tab rebuilds a missing graph under a new id.

(3) **Options** for a fix with cost, for example: a tab open's graph creation marked noUndo, or excluded from the stack like a view-only write; or undo stopping at a graph-creating entry. Touches, tests needed, a Recommended line, and a Layer Impact Report draft.

(4) **Report** in docs/discovery/discovery_2026-11-08_undo_tab_open_graphs.md: objective, files read with paths, measures and how to rerun them, findings with file:line, options, risks, LIR draft, open questions for Alfonso. Commit only the report. No log entry, no Status flip, no push, no merge. Final message: what was measured, the Recommended option, Decisions taken (unattended), Outcome: hard-stop.

## DOVE

Read anything under frontend/src/. Write only the report and files in ~/.jjodel-lanes/P-2026-11-08-1719/.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_canvas_create_undo_682.md; docs/discovery/lir_2026-11-08_canvas_create_undo_682.md; ~/.jjodel-lanes/P-2026-11-08-1202/handoff.md; docs/decisions.md R-UNDO-5; the multi-tab L6 entries in docs/log-inbox/multi-tab.md.
