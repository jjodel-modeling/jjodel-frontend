# Prompt: the checker rules R1-R5 (P2b), on a branch that carries the derived recursion

Prompt-ID: P-2026-09-27-2235
Chat: C-2026-09-27-1437
Lane: full (more than 3 files; an exported union extended; no critical zone; no visual check, report §14 P2b)
Status: eseguito 2026-09-27 · lane sim-checker-rules · 8beb4b28e

Worktree: `~/jjodel-w-rules`, branch `sim-checker-rules` (cut by the chat from `sim-checker-gap` at `811cb4ee5`, P2a closed; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-rules`, branch `sim-checker-rules`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Implement slice P2b of `docs/discovery/discovery_2026-09-27_sim_checker_gap.md` exactly as §8, §10 (P2b tests) and §14 («P2b `sim-checker-rules`») define it: the pure module `model/simulation/stcChecks.ts` with rules R1-R5 (R6 only if it costs nothing, say which), called by `guardDefectsOf` and `actionDefectsOf`, `CompileDefect.reason` gaining `'unresolved'` and `'value'`.

P2b's wiring (`simBridge.ts`, its test) and R3 (`actionEvaluator.ts`, splitting `foldActionTarget`'s `null`) sit on files that branch `sim-derived-recursion` (P-2026-09-27-1727, closed at `e6d25ef5d`) already changed. So the first step is to merge that branch into this one: `git merge --no-ff --no-edit sim-derived-recursion`. A conflict limited to `docs/log-inbox/simulation.md` or `docs/decisions.md` is resolved by union (both sides kept whole, no duplicate headings or rows); a conflict in any code file stops the lane with `Outcome: question`. Both branches merge on the trunk after MODELS, recursion first; this branch then carries only P2b.

Nothing here reaches the trunk before 2026-10-04 (ratified). Out of P2b, as §8 says: `else` with no sibling, the W-* and T-* warnings, A11 and every σ- or event-dependent value.

## DOVE

- `frontend/src/model/simulation/stcChecks.ts` (new; verify the name is free first), `frontend/src/components/editor-v2/sim/simBridge.ts`, `frontend/src/model/simulation/actionEvaluator.ts` (R3 only, a new function beside `foldActionTarget`, never changing its callers' contract), and their tests (`model/simulation/__tests__/stcChecks.test.ts` new, `sim/__tests__/simBridge.test.ts`).
- `docs/decisions.md`: the R-SIM-70 extension P2b writes (provisional, unattended; R-SIM-70 is a row the chat wrote, report §11). `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.

Out of scope: every file under `problems/**` (P2a is closed), `SimulationPanel.tsx` and every panel or SCSS file (another lane holds the panel), every critical-zone file.

## COME

1. Read `CLAUDE.md`, the report §5.2, §8, §10, §11, §14, and the files of the DOVE whole after the merge.
2. The merge of step COSA, then baseline from `frontend/`: typecheck (14 known), vitest on `src/model/simulation` and `src/components/editor-v2/sim` (counts, 0 failed).
3. Tests first (red, say how many), one per rule on the §5.2 rows it closes, A11 silent at Reset, A0 and G0 clean. Then the module and the wiring. Green.
4. Mutation bench: one mutant per rule, plus R3 answering `unresolved` for a σ-dependent target; each killed.
5. The four demo presets through `startRun` (a vitest or a node probe, no browser): the defects line of each preset is unchanged, or say exactly what it gains and why.
6. Gates: typecheck same 14, vitest green, build exit 0, `check:docs`, `check:scripts`.
7. Commits: `merge: sim-derived-recursion into sim-checker-rules (P-2026-09-27-2235)` (the step-1 merge), `feat(sim): the checker rules R1-R5 (P2b) (P-2026-09-27-2235)`, then docs.
8. `Outcome: done` with the shas, counts before and after, the mutant count and the four preset readings.

Stop with `Outcome: question` and a `Recommended:` line on a code conflict in the merge, if a demo preset gains a defect, or if a test outside `sim/` and `model/simulation/` turns red.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone file, push, writes in any other tree, a dev server.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_sim_checker_gap.md` (on this branch); `docs/discovery/discovery_2026-09-27_sim_derived_attributes.md` (the recursion report); the P-2026-09-27-1805 and P-2026-09-27-1727 entries in `docs/log-inbox/simulation.md`.
- `docs/decisions.md` R-SIM-61, R-SIM-70, R-SIM-74; Rule 11.
- `docs/PROTOCOL.md` P13, P14, P16; RC-17, RC-21, RC-22, RC-25.
