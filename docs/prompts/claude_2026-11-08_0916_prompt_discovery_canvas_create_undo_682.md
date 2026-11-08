# Discovery #682: a canvas create gets no undo step of its own

Prompt-ID: P-2026-11-08-0916
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: discovery (read-only, no code change, report and hard stop)
Depends: ticket #682 (jjodel-lanes), found by P-2026-11-07-0654
Worktree: ~/jjodel-w-disc682, branch disc-682-canvas-undo (from trunk 18ce96017, own node_modules)
Request: none (lane auto, «Procedi con tutto in lane auto», 2026-11-08 07:36; the queue listed #682)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. This lane changes NO source file: reducer.ts is core (redux reducer, two-phase, Layer Impact Report), so the fix is only proposed and parked for Alfonso. Every reply opens with [P-2026-11-08-0916 · session <id>]. Final line: Outcome: hard-stop (or blocked). Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole log. If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-0916/handoff.md first.

## COSA

Ticket #682: an object dropped on the v2 canvas never gets an undo step of its own. P-2026-11-07-0654 measured undoDelta 0 after syncCreateObject (docs/discovery/discovery_2026-11-07_slot_identity_656.md §9, on branch slot-identity-656 if it is not on the trunk), and one Undo reverts the previous action while the new object stays. Read cause: frontend/src/redux/reducer.ts near :1280 merges every delta that touches a vertex (vertexs, graphvertexs, graphelements, edgepoints, edges, graphs) into the previous undo entry.

(1) **Read** the undo machinery end to end: the merge rule near reducer.ts:1280 and why it exists (git log -L or git blame on those lines, the commit messages, any decision row in docs/decisions.md), how an undo entry is built and when a delta opens a new one, how syncCreateObject and the canvas drop reach the store, and every other path that creates a DObject together with a vertex (palette, paste, duplicate, the Text tab apply, JjTL, the Instance Manager). Quote file:line for each.

(2) **Measure**, without changing source: a vitest or a probe under ~/.jjodel-lanes/P-2026-11-08-0916/ (not committed) that reproduces undoDelta 0 on a canvas create and shows what one Undo reverts; and, for contrast, that a vertex move or resize is still merged as intended. If a measure needs a source change, do not make it: describe it.

(3) **Proposed fix**, at least two options with their cost, for example: a delta that creates a DObject (or a new vertex id) opens its own entry; or the create path marks its action so the merge rule skips it. For each: the exact lines, what else it touches (drag sequences, multi-step creates that should stay one step, the Text tab apply which T8 and E2 rely on, the undo tab), the tests it needs, and a Recommended line.

(4) **Report** in docs/discovery/discovery_2026-11-08_canvas_create_undo_682.md (create docs/discovery/ if missing): objective, files read with full paths, findings with file:line, the measures and how to rerun them, the options, risks, a Layer Impact Report draft for the recommended option, and open questions for Alfonso. Commit only the report (docs: discovery #682 ..., Model trailer). No log entry, no Status flip, no push, no merge. Final message: what was read and measured, the recommended option, Decisions taken (unattended), then Outcome: hard-stop.

## DOVE

Read anything under frontend/src/. Write only docs/discovery/discovery_2026-11-08_canvas_create_undo_682.md and files in ~/.jjodel-lanes/P-2026-11-08-0916/.

## RIFERIMENTI

Ticket #682 in docs/log-inbox/codegen.md (2026-11-07); docs/discovery/discovery_2026-11-07_slot_identity_656.md §9; docs/decisions.md R-TXT-57 (4); CLAUDE.md on core changes and the Layer Impact Report.
