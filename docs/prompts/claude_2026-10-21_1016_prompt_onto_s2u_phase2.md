# Ontological instantiation, S2u Phase 2: an undo group per instantiation, tickets (a) and (c)

Prompt-ID: P-2026-10-21-1016
Chat: C-2026-10-20-1835
Front: instance-of
Lane: full (core: redux/reducer/reducer.ts; Layer Impact Report in the discovery; visual check owed)
Status: da eseguire
Request: https://claude.ai/code/session_015eDtjagjBtuPHhhhfUTTo5
Depends: P-2026-10-21-0947
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s2u`, branch `oi-s2u` at `9bfc0cc78`, clean. Check `pwd`, the branch, a clean `git status`;
otherwise stop with `Outcome: blocked`. Model and tier: heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1016 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Time limit 90 minutes. **No subagent, no background task.** Foreground gates and probes (P16). **Context
economy:** grep, never read `reducer.ts`, `U.tsx` or `EditorV2.tsx` whole; short tool output; never a whole diff.
**Commit the code as soon as typecheck and unit tests are green**, before probes and bench. No push, no merge. Do not
touch `Status`. No critical-zone §3.2 file; if one becomes necessary, stop with `Outcome: question`.

## Decisions (Alfonso said yes to the core change, 2026-10-21 09:46; the chat adopts the report's recommendations)

The plan is `docs/discovery/discovery_2026-10-21_onto_s2u_undo_group.md` (its Layer Impact Report and Phase 2 plan).
Its six questions are answered as recommended:

1. The group lives in the reducer's history (`beginUndoGroup()` / `endUndoGroup(id)`), not in `BEGIN`/`END`/`TRANSACTION`.
2. Undo is complete (deep, `idlookup` included) only for group entries; the shallow merge elsewhere stays as it is and
   is logged as a separate defect ticket in the closure log entry.
3. While a group is open, other writes join it, with a 10 s cap; undo and redo close it.
4. «New instance» on a class node places the instance at the centre of the object diagram's view.
5. S2-3m reads as: plain `createInstance` stays +2, `instantiate` is +1 and may need 1 Cmd+Z instead of 2.
6. The 7 files of the report's plan are accepted (rule 19 pause waived for this lane).

## COSA

Implement the report's Phase 2 plan: the undo group in `reducer.ts` (no behaviour change with no group open, pinned by a
test); `instantiate.ts` opens the group, creates instance, slots and values, waits for the values to land, lets Step 2bis
create the vertex, writes its position (ticket a: the right click for the cascade, the object diagram's view centre for
the class-node entry) and its per-viewpoint sizes (ticket c, from `~/.jjodel-lanes/P-2026-10-21-0725/s2-5-wip.diff`) in
one write, then closes the group.

Acceptance (probe on port 3087, measured, three runs where timing matters):
- one instantiation from the cascade and from the class-node entry is 1 undo entry and 1 Cmd+Z, and that Cmd+Z leaves
  no orphan in `idlookup` (count `idlookup` entries before and after, not only `model.objects`);
- Member (with a default value) is 1 entry, not 2;
- the cascade instance is placed at the right click (node box contains the click point, within 4 px);
- the class-node instance, viewed in the object diagram (zoom to fit), shows `name : Class` and all its slot rows inside
  the node (S2-5o);
- the cases of `frontend/scripts/probe/undo-inline-edit.ts` unchanged; S2-3m as in decision 5; page errors `[]`;
- unit tests for the group: no-group behaviour identical, one entry per group, deep undo restores `idlookup`, the 10 s
  cap, undo closes an open group; mutation bench of at least four mutants on the group code, each red.

## DOVE

The 7 files of the report's Phase 2 plan, their tests, the probe and `docs/discovery/assets/onto-s2/`, and after the GO
the log entry in `docs/log-inbox/instance-of.md` (closing tickets a and c, opening the shallow-merge defect ticket).

## COME

1. Baseline typecheck through `node scripts/run-quiet.mjs` from `frontend/` (zero errors).
2. Reducer group with its unit tests; typecheck zero; commit `feat(core): undo groups in the history reducer
   (P-2026-10-21-1016)`.
3. `instantiate.ts` on the group, tickets (a) and (c); unit tests; commit `fix(onto): one undo group per instantiation,
   placement and sizing (P-2026-10-21-1016)`.
4. Probe and screenshots; commit `chore(probe): S2u undo, placement and sizing checks (P-2026-10-21-1016)`.
5. Mutation bench (results in a commit body or the report), `npm run build` exit 0; report and stop for the GO.
