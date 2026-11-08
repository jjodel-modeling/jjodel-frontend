# Ontological instantiation, lane B continuation: probe, mutants, docs for the binding editor

Prompt-ID: P-2026-11-08-0151
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (continuation of P-2026-11-08-0113 after its context ceiling; probe, bench and docs only)
Status: da eseguire
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 00:35: «rail e dichiarazione e procedi in /lane auto»)
Depends: P-2026-11-08-0113
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `c55874212`
(lane B's code). **Expected state**: one untracked file, `frontend/scripts/probe/onto-binding-editor.ts` (lane B's probe,
never run); anything else uncommitted means stop with `Outcome: blocked`. Model and tier: heavy, effort `xhigh`.
Alfonso's dev server runs on port 3005 from `~/jjodel-release`: do not stop it; probe ports outside 3000, 3001, 3005,
3015.

## Lane discipline

Every reply opens with `[P-2026-11-08-0151 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 60 minutes.

- One test or probe run per call; `uptime` beside each probe; before a probe wait for the 1-minute load under 20 (one
  `uptime` per call, never a sleep over 60 s). Assets under `/tmp`.
- Short tool output: never a whole diff or a whole product file; windows of at most 80 lines.
- Product code (`frontend/src`) changes only to fix a probe check that fails for a real defect; then stop and report it
  with `Outcome: question` before committing the fix, unless the fix is under 10 lines in lane B's own new files.
- No push, no merge. No edit to `reducer.ts`, a CLAUDE.md §3.1 or §3.2 file, or an exported interface.

## Source

Read first `~/.jjodel-lanes/P-2026-11-08-0113/handoff.md` (exact commands, what each mutant changes) and the prompt
`docs/prompts/claude_2026-11-08_0113_prompt_onto_binding_editor.md`, steps 5 to 7. Lane B's result is in
`~/.jjodel-lanes/P-2026-11-08-0113/log.jsonl` (last `result` event).

## COSA (lane B's steps 5 to 7)

1. Run the probe on `UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`: Detect, Confirm, the bag equals the
   probe table, +1 undo entry, one Cmd+Z restores the previous bag (**measure and report whether the key goes or
   stays**; a Cmd+Z that leaves a defective bag is a hard stop), the pane menu opens with the same options as the console
   setup. Crops (`sips -Z 1200`) to `~/.jjodel-lanes/P-2026-11-08-0151/crops/`: the editor after Detect, a row corrected
   by hand with its defect message, «Semantic type class» in Advanced and its absence in Basic. Regression, one run each:
   `onto-s2-instantiate.ts`, `onto-s3a-slot-problems.ts`. `chore(probe)` commit with the probe.
2. The three mutants of the handoff, each red and reverted, to `~/.jjodel-lanes/P-2026-11-08-0151/bench.txt`.
3. Docs commit: one entry in `docs/log-inbox/instance-of.md` covering P-2026-11-08-0049, P-2026-11-08-0113 and this lane:
   the adopted recommended answers Q1..Q8 of the discovery, lane B's two own choices (Confirm allowed with
   `checkBindings` defects, R-VAL-4; value kinds editable but not addable, follow-up ticket), the undo measure. Flip
   `Status:` of the three prompts. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier as stated.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-08-0113/handoff.md`, `handoff.diff`; `docs/discovery/discovery_2026-11-08_onto_rail_binding_declaration.md` §5 lane B, §6.
