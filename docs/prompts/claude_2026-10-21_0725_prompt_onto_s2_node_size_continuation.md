# Ontological instantiation, S2 ticket (b): commit and close (continuation in a fresh session)

Prompt-ID: P-2026-10-21-0725
Chat: C-2026-10-20-1835
Front: instance-of
Lane: full (instantiate.ts, visual check owed)
Status: eseguito 2026-10-21 · lane oi-s2 · fix c1a005725, probe b3e6aacee, assets f39138504, log 7999d5d5a · build 0, undo 1 entry 1 press, S2-3m unchanged · visual check passed (book1 : Book, four rows) · S2-5 (class-diagram entry) open as ticket c
Request: https://claude.ai/code/session_015eDtjagjBtuPHhhhfUTTo5
Depends: none
Corregge: P-2026-10-21-0655, whose session (b70de1aa) reached the context ceiling (AM-8) with the fix uncommitted
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s2`, branch `oi-s2` at `b65bb3e41`, with uncommitted changes in `instantiate.ts`, its test, the
probe `frontend/scripts/probe/onto-s2-instantiate.ts` and `docs/discovery/assets/onto-s2/`. Check that state; otherwise
stop with `Outcome: blocked`. Model and tier: heavy.

## Lane discipline

Every reply opens with `[P-2026-10-21-0725 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Time limit 60 minutes. **No subagent, no background task.** Foreground gates (P16). **Context economy:** read
`~/.jjodel-lanes/P-2026-10-21-0655/handoff.md` first; grep, short output, never a whole diff. **Commit first**: step 1
comes before anything else. No push, no merge. Do not touch `Status`.

## COSA

The chat accepts the fix of P-2026-10-21-0655 (option a, `instanceBoxSize` and `sizeInstanceNode` in `instantiate.ts`;
the RC-23 check of the refreshed screenshot passes: `book1 : Book` with four rows, `member1 : Member` with two). The
chat also accepts the undo change as an improvement: one instantiation is now 1 entry and 1 Cmd+Z (it was 2 presses,
the first empty), and a later instantiation is unchanged.

1. **Commit now:** `fix(onto): size a new instance's node from its rows (P-2026-10-21-0655)` with `instantiate.ts` and
   its test, the cause and the undo table of the handoff in the body; then `chore(probe): S2 node size checks
   (P-2026-10-21-0655)` with the probe and the assets. Typecheck zero and the unit tests green before the first.
2. **S2-3m:** run the probe three times and record the undo numbers of S2-3m against a baseline of three runs at
   `4f1e07953` (checkout of the two files into a temporary copy, or `git stash`, your choice; restore). If the fix moves
   them beyond the run-to-run spread, stop with `Outcome: question` and the numbers.
3. **Gap S2-5:** «New instance» on a class node in the class diagram leaves the instance's node at 280x60 in the object
   diagram, because the instance is hidden in the active viewpoint and nothing is sized. Size it for every viewpoint in
   which the instance's view is drawn with a default size, with the same rule, in `instantiate.ts` only; add a probe
   check (S2-5 then switch to the object diagram, header and rows inside the node). If this needs a file outside
   `instantiate.ts`, do not do it: record a ticket in the log entry instead.
4. `npm run build` exit 0; report and stop for the GO. After the GO, the log entry in `docs/log-inbox/instance-of.md`
   closes ticket (b) (and records the S2-5 outcome).

## DOVE

`instantiate.ts`, its test, the probe, `docs/discovery/assets/onto-s2/`, and after the GO the log entry. Nothing else.
