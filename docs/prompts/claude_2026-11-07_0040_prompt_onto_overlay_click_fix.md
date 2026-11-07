# Ontological instantiation, undo groups L3c: a click inside the problem overlay does not select the node

Prompt-ID: P-2026-11-07-0040
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (`editor-v2/problems/` is in the critical-zone table of CLAUDE.md 3.1: short Layer Impact Report first)
Status: eseguito
Request: none (adopts the recommendation of P-2026-11-07-0005, RC-21, Alfonso away under /lane auto)
Depends: P-2026-11-07-0005
Corregge: P-2026-11-07-0005 (stopped at the context ceiling before its report; this lane writes it)
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3a`, branch `oi-s3a`, its tip this prompt's `docs:` commit, whose parent is `ccb3abd2b`.
Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier:
heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-07-0040 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 60 minutes.

- **No subagent, no task in background.** One test or probe run per call; `uptime` beside each probe; before a probe
  wait for the 1-minute load under 20 (one `uptime` per call, never a sleep over 60 s).
- **Commit the code as soon as typecheck and the tests are green.** Subjects at most 72 characters, `Model:` trailer.
- Short tool output; never `EditorV2.tsx` or `reducer.ts` whole (grep, windows of at most 80 lines). Read the previous
  lane's `~/.jjodel-lanes/P-2026-11-07-0005/handoff.md` first, then only what you need.
- No push, no merge. No edit to `reducer.ts`, `EditorV2.tsx` or a CLAUDE.md 3.2 file; if one becomes necessary, stop
  with `Outcome: question`.

## Finding of P-2026-11-07-0005 (handoff)

S3-4 of `onto-s3a-slot-problems.ts` failed once on `6b52b905d` with an extra, empty undo entry under the exact «Sync
slots» entry. Clicking «Sync slots» in the problem overlay also selects the node: the overlay is a portal that stops
only `mousedown` (`NodeProblemOverlay.tsx:183`), so the click bubbles to the node's `onNodeClick` (`EditorV2.tsx:5055`),
which writes `isSelected` and `_lastSelected`. The store sends writes every 300 ms; if a batch leaves between the click
and the opening of the sync's undo group, the selection lands outside the group and, past 450 ms from the last entry,
gets an entry of its own. Three instrumented runs folded it (8/8); the failure is a race. The same write is the
2026-10-21 M4 ticket («an undo entry with nothing created after a problem-dot click»). The trunk has the same overlay but
no «Sync slots».

## COSA

1. First reply: a short Layer Impact Report (canvas v2 UI layer, `problems/`; what changes: a click inside the overlay
   no longer reaches the node's click handler; what does not: overlay actions, dot click, node selection by a click on
   the node itself, context menus).
2. `NodeProblemOverlay.tsx`: stop the propagation of `click` (and `dblclick`, `contextmenu` if they also bubble to the
   node, check) at the overlay root, as it already does for `mousedown`. Nothing else.
3. A test that fails without the fix: preferably a unit test in `problems/__tests__/` rendering the overlay inside a
   parent with an `onClick` spy (a click on an overlay action does not call the parent); if the overlay cannot be
   rendered under vitest, an assertion added to the probe capture is acceptable only as a measure, and say so.
4. Gates: typecheck 0; the new test and `instantiate.test.ts` green; `npm run build` 0. Commit the code.
5. `onto-s3a-slot-problems.ts` three times on the default export (`~/jjodel-demo-exports/uml/uml-class-object.jjodel`):
   8/8 each, S3-4 `undo` deltas recorded. The `uml-s3b` export still aborts in the probe setup (`"vid":null`, dune not
   drawn in the active pane): do not chase it here, record it as a proposed ticket.
6. Mutant: the `click` stop removed, the test red, reverted. To `~/.jjodel-lanes/P-2026-11-07-0040/bench.txt`.
7. Write the report of the previous lane, `docs/discovery/discovery_2026-11-07_onto_s3_4_extra_undo_entry.md`, from its
   handoff plus this lane's results (objective, hypotheses with verdicts, files read, the race, the fix, the three runs,
   the `uml-s3b` setup ticket, the trunk note). One `docs:` commit.

## DOVE

`frontend/src/components/editor-v2/problems/NodeProblemOverlay.tsx`, one new test file under
`frontend/src/components/editor-v2/problems/__tests__/`, `docs/discovery/discovery_2026-11-07_onto_s3_4_extra_undo_entry.md`.
Nothing else.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier with `Outcome: question` if S3-4 still fails with
the fix in place, with the deltas.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-07-0005/handoff.md`; `~/.jjodel-lanes/P-2026-11-06-2340/closing.md`;
`docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md`; CLAUDE.md §3.1.
