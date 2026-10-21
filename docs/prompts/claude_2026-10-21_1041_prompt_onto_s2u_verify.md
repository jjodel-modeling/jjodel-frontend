# Ontological instantiation, S2u Phase 2: probes, build and close (continuation in a fresh session)

Prompt-ID: P-2026-10-21-1041
Chat: C-2026-10-20-1835
Front: instance-of
Lane: full (verification of a core change; visual check owed)
Status: da eseguire
Request: https://claude.ai/code/session_015eDtjagjBtuPHhhhfUTTo5
Depends: none
Corregge: P-2026-10-21-1016, whose session (624797fb) reached the context ceiling (AM-8) after the code commits
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s2u`, branch `oi-s2u` at `f62d6edb0`, clean. Check `pwd`, the branch, a clean `git status`;
otherwise stop with `Outcome: blocked`. Model and tier: heavy.

## Lane discipline

Every reply opens with `[P-2026-10-21-1041 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Time limit 60 minutes. **No subagent, no background task.** Foreground gates and probes (P16). **Context
economy:** read `~/.jjodel-lanes/P-2026-10-21-1016/handoff.md` first («Remaining checks»); grep; short output; never a
whole diff. Commit each step as soon as its gate is green. No push, no merge. Do not touch `Status`. Product code may be
edited only to fix a failing acceptance check, in the files of P-2026-10-21-1016's DOVE, never a §3.2 file.

## COSA

The acceptance of `docs/prompts/claude_2026-10-21_1016_prompt_onto_s2u_phase2.md`, unchanged, on the committed code
(`55f3bd556` undo groups in the reducer, `f62d6edb0` instantiate on the group, placement and sizing):

1. Probe `frontend/scripts/probe/onto-s2-instantiate.ts` on port 3087, three runs where timing matters: 1 entry and
   1 Cmd+Z from the cascade and from the class-node entry, no orphan in `idlookup` after the Cmd+Z (count it); Member 1
   entry; the cascade instance placed at the right click within 4 px; S2-5o (class-node instance sized in the object
   diagram); S2-3m as decided; page errors `[]`. First check the risk the previous session named: if `seedLanded` waits
   6 s and reports «its seed never landed», fix the comparison in `instantiate.ts` and commit it as its own `fix(onto)`.
2. `frontend/scripts/probe/undo-inline-edit.ts` on this branch and on `9bfc0cc78`: identical outcomes.
3. Refresh the screenshots in `docs/discovery/assets/onto-s2/`; commit `chore(probe): S2u undo, placement and sizing
   checks (P-2026-10-21-1016)`, then the assets in a separate `docs(onto):` commit (P13 guard).
4. `npm run build` exit 0. Report with a table of the measures and stop for the GO. After the GO: the log entry in
   `docs/log-inbox/instance-of.md` closing tickets (a) and (c) and opening the shallow-merge defect ticket (undo outside
   a group leaves `idlookup` orphans, discovery P-2026-10-21-0947), plus the surviving mutant M8 as a note.
