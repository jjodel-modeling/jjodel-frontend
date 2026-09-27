# Prompt: R3, the M1 face for the audience: the marking and σ line, the choice list above the buttons, the texts G10 and G11

Prompt-ID: P-2026-09-27-1145
Chat: C-2026-09-27-1140
Lane: full (the marking line is what the audience sees at MODELS; probe re-runs by the lane, then a visual check by the chat and by Alfonso)
Status: da eseguire

Worktree: `~/jjodel-gate`, branch `sim-r3-face` (cut by the chat from `simulation-engine` at `5e8b67ac0`, the trunk with R1 and R2 merged), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-gate`, branch `sim-r3-face`, `git log -1` is the commit that adds this file (its parent `5e8b67ac0`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1145 · session <id>]` and ends with a bare `Outcome:` line, the shas on the line above. Run gates in the foreground.

## COSA

R-SIM-82 (ratified 2026-09-27, decisions D and F of `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md` §10; read the row whole in `docs/decisions.md`). Four pieces, all measured in the report (§5 G3, G8, G10, G11):

1. **The marking and σ line (G3).** While a run exists (from Reset until Stop), the M1 face shows one line, above the buttons with the other lines (R-SIM-65), that reads the current σ of the run (`run.config.state`) and updates at every committed step: first the marking, then the stored semantic attributes, then the derived semantic ones. Format: `Marking: p2 ×2, p3 · coins = 2, paid = true`. Places are named by `elementName`, sorted by name, `×n` only when n > 1; a place with 0 tokens is not listed; an empty marking reads `Marking: ∅`. Attributes read `attr = value` for a global (element id = model id) and `element.attr = value` otherwise, sorted by element name then attribute; the ` · ` separator and the σ part appear only when there is at least one attribute. Presentation values (`node.[x]`) stay out of the line. One row, clamped, full text in the `title` (R-SIM-63); Step's top must not move when the line appears or grows (R-SIM-66): it exists for the run's whole lifetime, `Marking: …` from the first render after Reset. Pure text helper in `simBridge.ts` (`markingLine(state, net, lookup): { line: string; title: string }`, name check first), the panel only renders it. A halted run keeps showing the σ it halted on.

2. **The choice list above the buttons (G8).** The `{pending && run && (…)}` block (`SimulationPanel.tsx` around line 1010, after the events) moves above `sim-panel__actions`, with the other lines that appear (R-SIM-65): the panel is anchored at the bottom and grows upward, so Step's top stays where it is when the list opens (the report measured 854.5 → 751.9 with the list below). Order from top: the choice list (section title, choices, Cancel), then warnings, defects, halt, the marking line, then the buttons. Keep the DOM identical otherwise (same class names, same keys). If moving the block changes a `sim-panel__choices` rule that depends on a sibling selector, adjust only that rule in `simulation-panel.scss`.

3. **`JjelEvaluationError:` prefix (G10).** `haltSource` (`simBridge.ts`, lines 465-480) strips the leading `JjelEvaluationError: ` from `detail` for `action-defect`, as `haltMessage` already does inline for `derived` (line 499). Do it once, in `haltSource`, and drop the inline `.replace` from the `derived` case only if both paths then read the same helper; the visible text of every halt line is unchanged except for the prefix.

4. **Empty side of a transition (G11).** `arcsText` (`simBridge.ts` line 515) returns `∅` for an empty arc list, so `t3 (lock → )` reads `t3 (lock → ∅)`; a transition with both sides empty reads `t (∅ → ∅)`. `candidateLabel` and every text built on it (choice list, «Last step») follow.

## DOVE

- `frontend/src/components/editor-v2/sim/simBridge.ts`: `markingLine` (new, exported), `haltSource` (prefix), `arcsText` (`∅`). A C2 file: minimal diffs, no other function touched.
- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: the marking line rendered from the run's σ (read the run through the same subscription the panel already uses for `view`, so the line re-renders on every `bump`); the choice list block moved above the buttons.
- `frontend/src/components/editor-v2/sim/simulation-panel.scss`: only if the moved block or the new line needs a rule (name check first; reuse `sim-panel__hint sim-panel__hint--line` for the marking line, plus one modifier `sim-panel__hint--marking` if a distinct look is needed).
- Tests: `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts` (`markingLine`: two places with 2 and 1 tokens plus a global and an element attribute give the exact string above; empty marking gives `Marking: ∅`; no attributes gives no ` · `; derived values listed after stored ones; presentation excluded. `haltSource`: `action-defect` detail without the prefix. `candidateLabel`: empty postset reads `∅`).
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.

Out of scope: every file in `frontend/src/model/simulation/`, `simRunState.ts`, `simRoleStatus.ts`, `profileBinder.ts`, the canvas (`ObjectNode.tsx`, the R-SIM-4 files), `docs/decisions.md`, the M2 face of the panel.

## COME

1. Baseline from `frontend/`: vitest on `src/model/simulation src/components/editor-v2/sim` count, 0 failed; typecheck 14.
2. Tests first, red, then the four pieces, minimal diffs, no rename. Rule 19: list the files and the change per file before the first edit.
3. Mutation bench, table in the commit body, a survivor is a stop: (1) a place with 0 tokens listed in the marking; (2) `×1` printed; (3) ` · ` printed with no attribute; (4) a presentation value in the line; (5) the prefix left on an `action-defect`; (6) an empty side printed as blank.
4. Re-run the readiness probes the report left in `~/jjodel-sim/frontend/scripts/smoke/` (`_tmp_demo_petri.ts`, `_tmp_demo_esm.ts` and their common file; report §3 and §12): copy them read-only into this tree as `_tmp_r3_*`, adapt only the port and paths, dev server from this tree on a free port at or above 3007 (never 3001-3006). Extend the copies to read, and print as JSON: (a) the marking line text right after Reset and after the first fired step on the Petri net (expected: it changes and matches the marking the probe computes from the model); (b) `stepTop` before and while the choice list is open (expected: equal, where the report read 854.5 against 751.9); (c) the halt line of the ESM without declarations (expected: no `JjelEvaluationError:`); (d) the «Last step» text of a transition with an empty postset (expected: `∅`). Screenshots, if any, go to `~/.jjodel-lanes/shots_r3/`, never into the tree (a stray png under `frontend/` blocks the next lane's precondition). Stop the server.
5. Gates: typecheck 14; vitest green with the new count; build exit 0; `check:docs` 4/4; `check:scripts` PASS.
6. Two commits, pathspec after `--`: code, subject `feat(sim): marking and σ line, choice list above the buttons (P-2026-09-27-1145)` or, if over 72 once the Prompt-ID is dropped, `feat(sim): the M1 face for the audience (P-2026-09-27-1145)`, body with G3/G8/G10/G11, R-SIM-82, the mutant table, the four probe readings, `Model:` trailer; docs, the inbox entry (`Smoke visivo: probes re-run, four readings as above; visual GO by the chat pending`) and the Status flip `eseguito 2026-09-27 · lane sim-r3-face · <code sha>`, subject `docs: close R3, the M1 face for the audience (P-2026-09-27-1145)`.
7. `Outcome: done`, shas on the line above. The chat then runs its own visual check on a server it starts, before Alfonso's GO on 3001.

Stop with `Outcome: question` and a `Recommended:` line if the current σ is not reachable from the panel without a new subscription in `simRunState.ts`, if moving the choice list breaks a layout rule that is not local to `simulation-panel.scss`, or if `elementName` cannot name a global (model id) without an engine file.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, an engine file, push, any other tree except the read-only copy of the `_tmp_demo_*` probes from `~/jjodel-sim`.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md` §4.1, §4.4, §5 G3/G8/G10/G11, §6 (layout of the lines), §8 R3, §10 D/F.
- `docs/decisions.md` R-SIM-63, R-SIM-65, R-SIM-66, R-SIM-71, R-SIM-73, R-SIM-82; lanes C2 (`5060657c5`, `53c24b1fc`) and M3 (`48ab676df`, `d1d1bba2b`) for the current panel; R2 (`86401f845`) for the last change to `SimulationPanel.tsx`.
- `frontend/src/model/simulation/netTypes.ts` `SimState` (marking, attrs, presentation, derived); `netStep.ts` `tokens`, `isMarked`; `simBridge.ts` `derivedText` (the same walk over derived values, reuse it).
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-25..30.
