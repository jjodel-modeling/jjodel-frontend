# Ontological instantiation, lane A continuation: commits, regressions, mutant, crops, docs for the rail

Prompt-ID: P-2026-11-08-0241
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (continuation of P-2026-11-08-0212 after its context ceiling; probe, bench and docs only)
Status: eseguito 2026-11-08 · lane full · ba69124a9
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 00:35: «rail e dichiarazione e procedi in /lane auto»)
Depends: P-2026-11-08-0212
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `910558ef4`
(lane A's code). **Expected state**: exactly two modified files, `docs/decisions.md` (the R-OI-18 row) and
`frontend/scripts/probe/onto-s2-instantiate.ts` (S2-R0..R4, 28/28 measured by lane A); anything else uncommitted means
stop with `Outcome: blocked`. Model and tier: heavy, effort `xhigh`. Alfonso's dev server runs on port 3005 from
`~/jjodel-release`: do not stop it; probe ports outside 3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-08-0241 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 60 minutes.

- Context economy: short tool output, windows of at most 60 lines, never a whole diff or a whole product file.
- Check `uptime` in a separate call before each probe; start it only with the 1-minute load under 20; never a sleep
  over 60 s. One probe run per call. If a probe rewrites committed assets under `docs/discovery/assets/`, restore them.
- Product code (`frontend/src`) does not change; a probe failure that needs a product fix stops the lane with
  `Outcome: question`.
- No push, no merge.

## Source

Read first `~/.jjodel-lanes/P-2026-11-08-0212/handoff.md` (remaining steps 1 to 5, exact commands, lane A's own
choices) and the prompt `docs/prompts/claude_2026-11-08_0212_prompt_onto_rail_section.md`.

## COSA (the handoff's remaining steps)

1. `check:scripts`, then a `chore(probe)` commit of `onto-s2-instantiate.ts`.
2. Regression, one run each: `onto-s3a-slot-problems.ts` (default), `onto-s3b-ghost-rows.ts`
   (`UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`), `onto-binding-editor.ts` (`uml-s3b`).
3. The third mutant (the drop bypasses `runInstantiate`, S2-R1 red), reverted; append to
   `~/.jjodel-lanes/P-2026-11-08-0212/bench.txt`.
4. Crops (`sips -Z 1200`) to `~/.jjodel-lanes/P-2026-11-08-0241/crops/` from the probe run (handoff names the source):
   the rail with the binding (both blocks, the disabled link group), the empty state «Declare binding…» (Advanced),
   Basic without binding (no section), the canvas after a drop with the node at the cursor.
5. Docs commit: the R-OI-18 row (already written), one entry in `docs/log-inbox/instance-of.md` for P-2026-11-08-0212 and
   this lane (adopted Q1, Q2, Q4, Q5; lane A's own choices from the handoff; the S2-R1/R2 grid-snap tolerance; the S2-R4
   switch to the Petri export; ticket: `new-model-instantiate.ts` out of date, already listed earlier, mention only),
   flip `Status:` of both prompts. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier as stated.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-08-0212/handoff.md`, `handoff.diff`, `bench.txt`; `docs/discovery/discovery_2026-11-08_onto_rail_binding_declaration.md` §5 lane A.
