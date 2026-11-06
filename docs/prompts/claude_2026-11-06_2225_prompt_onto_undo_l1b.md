# Ontological instantiation, undo groups L1b: one deadline per instantiation, instantiations serialized

Prompt-ID: P-2026-11-06-2225
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (follows the core lane P-2026-11-06-2150; this lane touches no core file)
Status: da eseguire
Request: none (Alfonso: «ok», 2026-11-06 21:45, to the chat's amendments 3 and 4 of option (c))
Depends: P-2026-11-06-2150
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s2u`, branch `oi-s2u`, its tip this prompt's `docs:` commit, whose parent is `197ae1fd1`
(the merge of P-2026-11-06-2150). Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with
`Outcome: blocked`. Model and tier: heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-06-2225 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 60 minutes.

- **No subagent, no task in background.** Gates and the probe in the foreground (P16), one run per call, load average
  beside each probe run.
- **Commit the code as soon as typecheck and the unit tests are green.** Subject at most 72 characters, `Model:` trailer.
- Short tool output; grep, then windows of at most 80 lines of `instantiate.ts`; never `EditorV2.tsx` (not touched).
- No push, no merge. Do not touch `Status`. No file outside DOVE.

## What the chat found before this lane

- The group already closes in every case: `history.endUndoGroup()` sits in a `finally` (`instantiate.ts:516-523`) and
  every wait goes through `waitFor`, which gives up after `WAIT_LIMIT_MS = 6000` (`:411-422`). But there are six
  `await waitFor(...)` in the write half, several per slot, so a layout that never lands can keep the group open for
  N × 6 s. Amendment 3 becomes: **one deadline for the whole instantiation**, not one per wait.
- `runInstantiate` (`EditorV2.tsx:3230`) calls `instantiate(...)` with `void` and no guard, from the node menu
  (`:3541`) and the pane cascade (`:3927`). Two quick clicks run two instantiations concurrently, and under the trunk's
  nesting their groups fold into one entry. Amendment 4 becomes: **serialize inside `instantiate.ts`**, so a second
  request waits for the first to close its group and then runs in its own group. This keeps G1 (one instantiation, one
  undo entry) without touching `EditorV2.tsx`, and the second click is not lost.

## COSA

1. `instantiate.ts`: a deadline set when the group opens (constant `INSTANTIATE_DEADLINE_MS`, value chosen and
   justified in the reply, between 6000 and 10000); every `waitFor` in the write half uses the time left, not a fresh
   6 s; past the deadline the instantiation stops waiting, records a problem («the node layout did not land within …»),
   and the `finally` closes the group. Nothing else of the synthesis changes.
2. `instantiate.ts`: a module-level queue: `instantiate` chains on the previous call's promise (also on its failure), so
   at most one instantiation holds a group at a time. Export nothing new unless a test needs it (then a test-only reset).
3. Unit tests in `instantiate.test.ts`: two calls started back to back produce two undo entries, in order, each removed
   by one undo with exact `idlookup` restore; a layout that never lands closes the group by the deadline (fake timers or
   an injected clock), records the problem, and leaves no group open (`history` begin depth back to zero).
4. Gates: typecheck 0; `instantiate.test.ts`, `undoGroup.test.ts` and the reducer tests green; `npm run build` 0.
   Commit the code.
5. Probe `onto-s2-instantiate.ts` once with `UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel` and
   `ONTO_OUT=/tmp/...` (never into the repo): all checks pass; record `S2-3b1` (late sync entries) as a measure.
6. Mutation bench, one mutant per call, each red, each reverted: Q1 the queue removed; D1 the per-wait limit restored
   instead of the shared deadline. Results and load average to `~/.jjodel-lanes/P-2026-11-06-2225/bench.txt`.

## DOVE

`frontend/src/components/editor-v2/hooks/instantiate.ts`, `frontend/src/components/editor-v2/hooks/__tests__/instantiate.test.ts`.
Nothing else.

## HARD STOP

After step 6 with `Outcome: done` and a clean tree. Earlier with `Outcome: question` if the queue or the deadline needs
a change outside the two files, or if `onto-s2-instantiate.ts` fails a check that is not a measure.

## RIFERIMENTI

`docs/discovery/discovery_2026-11-06_onto_undo_groups_reconcile.md` (branch `oi-undo-discovery`, §2 G1, §3);
`~/.jjodel-lanes/P-2026-11-06-2150/bench.txt`; `docs/decisions.md` R-OI-12.
