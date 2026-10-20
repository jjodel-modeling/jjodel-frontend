# UML class and object diagrams: fixture, run and commit (continuation in a fresh session)

Prompt-ID: P-2026-10-20-2330
Chat: C-2026-10-20-1835
Front: instance-of
Lane: fast (one probe file, no app code), unattended (RC-21)
Status: da eseguire
Request: https://claude.ai/code/session_015eDtjagjBtuPHhhhfUTTo5
Depends: none
Corregge: P-2026-10-20-2005, whose session (9b6292f7) passed the 250k context ceiling (AM-8) before any probe run; nothing was committed
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-umlfixture`, branch `uml-fixture` (the tree of P-2026-10-20-2005, reused), `frontend/node_modules`
symlinked. Check `pwd`, the branch and that `git status` shows exactly two untracked paths,
`frontend/scripts/probe/uml-class-object-fixture.ts` and `docs/discovery/assets/uml-class-object/`; otherwise stop with
`Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-10-20-2330 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question with one `Recommended:` answer inside
this perimeter is answered as recommended and recorded. **No subagent and no background task**: a `claude -p` lane kills
them when it exits, and that is how P-2026-10-20-2005 lost its run. Every gate and every probe run in the foreground
(P16). Keep tool output short (grep, tail, head) to stay well under the context ceiling. No push, no merge. Do not touch
the `Status` line.

## COSA

Finish the work of `docs/prompts/claude_2026-10-20_2005_prompt_uml_class_object_fixture_reissue.md`: its COSA 1..6 are
the acceptance, unchanged. Start from `~/.jjodel-lanes/P-2026-10-20-2005/handoff.md` (read it whole) and the untracked
draft probe, which is complete code that has never run. The decisions already accepted by the chat:
`Property.defaultValue` is 0..1; the O1 seed removes nature's `issue` slot while it runs and the undo restores it; each
undo is checked by a snapshot keyed by `class:name`; the IR fallbacks listed in the handoff (one children compartment,
one edge view per multiplicity pair, first parameter only, first slot value only) are asserted as fallbacks. If the
reference edges of hidden Properties are drawn on the class nodes, measure the edge count, assert the measured count as
a fallback and add a §7 line; never change app code.

## DOVE

Write only `frontend/scripts/probe/uml-class-object-fixture.ts`, `docs/discovery/assets/uml-class-object/` (rerun
overwrites the leftover JSON), §7 of `docs/archivio/claude_2026-10-14_uml_class_object_notation.md`, the export
`~/jjodel-demo-exports/uml/uml-class-object.jjodel` (outside the repository) and, at closure after the GO, the log entry
in `docs/log-inbox/instance-of.md`.

## COME

1. Baseline typecheck through `node scripts/run-quiet.mjs` from `frontend/` (zero errors, CLAUDE.md §17).
2. Bounded grep of the probe log of the earlier partial run in `~/.jjodel-lanes/P-2026-10-14-1955/` for failing checks.
3. Run the probe with `lane-run probe` on port 3085 with `GV_SAVE`, fix the probe, rerun until it exits 0.
4. Add the §7 lines; typecheck zero; `npm run check:docs` green.
5. Commits: `chore(probe): UML class and object fixture (P-2026-10-20-2330)` with the probe and the assets, and
   `docs: UML notation §7 fallbacks (P-2026-10-20-2330)`; `git add` by path, `Model:` trailer. Then stop for the GO.
