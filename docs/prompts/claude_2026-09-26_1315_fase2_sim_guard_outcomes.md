# Prompt: Phase 2, the Simulation panel says why an input has no candidate

Prompt-ID: P-2026-09-26-1315
Chat: C-2026-09-26-1100
Lane: full (more than 3 files, changed exported interface)
Status: da eseguire

Worktree: `~/jjodel-sim`, branch `simulation-engine`, the same session that wrote the Phase 1 report `7abb57eaa` (`935b4b47`). Before anything else: `pwd` is `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, `git log -1` is the commit that adds this file and R-SIM-57..63 (subject `docs: ratify R-SIM-57..63 and add Phase 2 of the guard outcomes (P-2026-09-26-1315)`), its parent is `7abb57eaa`, `git status` empty apart from the three untracked, gitignored `frontend/scripts/smoke/_tmp_b2_*` files. Otherwise stop.

## COSA

Implement options C1 and A of the report plus the discard wording, as ratified in R-SIM-57..63 (read them whole in `docs/decisions.md`; they settle the eleven questions of report §7, with three precisions of the chat: the defects line changes its wording, the bridge explains outcomes per guard site, and no Basic/Advanced mode is introduced). The core (`model/simulation/`) is not touched.

## DOVE

- `frontend/src/components/editor-v2/sim/simBridge.ts`: `RunStart.started` gains the optional `compileDefects` (R-SIM-61), filled from the map `compileGuards` builds; the defects line (today `defectsLine`) covers net defects and guard defects with a wording true for both; a new export for the stop reason (report §5 C, for example `stopReason`), per input, per guard site (R-SIM-59); the discard and quiescence texts of `lastStepText` read `label.evaluated` (R-SIM-57).
- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: the reason in the status row, computed in the `view` memo only (R-SIM-58, report §3.4 and risk 2); the click-to-open list per input; the `title` of an enabled button whose input has no candidate (R-SIM-60); the defects line at Reset.
- `frontend/src/components/editor-v2/sim/simulation-panel.scss`: the one-line reason with ellipsis in the status row; the list; the one-line clamp with `title` of «Last step», halt, error and interruption lines (R-SIM-63). Existing class names unchanged; new ones after a name check.
- `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`.

Five files, the Rule 19 threshold. Out of scope: every file under `model/simulation/` (`netStep.ts`, `netTypes.ts`, `guardEvaluator.ts`, `actionEvaluator.ts`, `netCompile.ts`), `simRunState.ts`, the M2 roles UI, the trace, every critical-zone file.

Name check before writing (`command grep -rn '<name>' frontend/src` empty) for every new export, field and CSS class; one positive control (for example `defectsLine`).

## COME

### Rulings for this lane

- **Per site (R-SIM-59).** For a transition that is not a candidate, the explanation comes from the guard oracle called on each of its `guardSites`, not from the transition's outcome alone. A fused fork/join transition names the edge whose guard is `false` or defective. An `else` names its defective sibling, without repeating the sibling's detail (report §5 C, texts).
- **When.** In `Deadlock`, every input among ε and the alphabet; in `Running`, only the inputs whose button is on and that have no candidate, and only in their `title`; `null` in `Not started`, `Terminated`, `Halted` (the halt keeps `haltMessage`). Computed inside the `tick` memo, never in the render body, and the panel is not subscribed to the version.
- **Texts (R-SIM-62).** The short forms of report §5 C: `t: false`, `t: defect, parse error 1:14 …`, `t: defect, E-NODE`, `t: defect, 'visits' is not a state attribute of p2` (the `JjelEvaluationError: ` prefix stripped), `t: defect, returns number`, `e3: else, a sibling is defective`, `tb: inhibited by a1` (place id resolved), «nothing enabled» for an input with an empty `evaluated` list. First three inputs, then a count. The guard source only in `title`. Names in the list and in `title` as `name (S → D)` (`candidateLabel`).
- **Defects line (R-SIM-61).** One line at Reset for net defects and guard compile defects (`parse-error`, `subset`), never run-time ones; wording that is true for both (for example `2 defects: t1 guard (E-NODE); f1 (no target)`); subset warnings are not listed. The field name `compileDefects` is general because lane C will put action and declaration defects there.
- **Discard (R-SIM-57).** When `label.evaluated` is not empty, `discard` and `quiescence` name the first blocked transition (`Push: discarded, tPushL false`); when it is empty the old wording stays.
- **Layout (R-SIM-63).** After this lane no text of the panel can change its height except the list the user opens.

### Steps

1. Baseline on this commit: `npm run typecheck` (exit 2, 14, the §17 set), `npx vitest run` (4818 passed, the same 9 files red at import, 0 failed), `npm run build` (exit 0, 51 warning lines), `check:docs` 4/4, `check:scripts` as the baseline. State the expected numbers, then record the measured ones.
2. Tests first, red where the feature is missing, in `simBridge.test.ts` over `startRun` fixtures (the bench cannot load the panel): the four cases of the ticket on the b2net shape (`false`, `a b`, `node.[x] > 0`, `p2.[visits] > 0`); a fused fork whose second edge has a false guard names that edge; `else` with a true and with a defective sibling; `inhibited` with the place named; an input with no enabled transition; `null` in `Terminated`, `Halted`, `Not started`, and for an input that has a candidate; the reason is `Deadlock`-consistent: for every fixture, a non-null reason for every input exactly when `netRunStatus` says `Deadlock`; `compileDefects` lists `parse-error` and `E-NODE`, not `false` or `exception`; the defects line wording; the discard text of the turnstile with `tPushL: false`.
3. Implement: bridge, then panel, then SCSS. Minimal diffs; no refactor of adjacent code; no rename.
4. Mutation bench, table in the code commit body, a survivor is a stop:
   1. The reason is computed on the configuration of the last label.
   2. An input with an empty `evaluated` list is reported as a defect.
   3. The `else` repeats the sibling's detail.
   4. The inhibiting place is printed as an id.
   5. A reason is returned in `Terminated`.
   6. The explanation uses the transition outcome, not the sites: the fused fork names no edge.
   7. `compileDefects` also lists run-time defects.
   8. `compileDefects` is always empty.
   9. The discard keeps «no transition accepted it» with a non-empty `evaluated`.
   10. A reason is returned for an input that has a candidate.
   11. The defects line keeps «not compiled» for a guard defect.
5. Gates on the code commit: typecheck as the baseline, vitest the baseline plus the new tests (state the delta first), 0 failed, same 9 red; build exit 0, warnings as the baseline; `check:docs` 4/4; `check:scripts` as the baseline. `git diff --stat` outside DOVE empty.
6. Code commit, pathspec after `--`, subject `feat(sim): the panel says why an input has no candidate (P-2026-09-26-1315)` (within §6.2 without the suffix), body with baseline, gates, mutant table, `Model:` trailer.
7. **Visual check, hard stop.** Dev server on 3002 from this tree (port free first; your scratch Vite config with `fs.allow` for the symlinked `node_modules` is allowed, not committed: say so). Take your own screenshots, then give Alfonso the steps: (1) b2net, Reset, Step twice: `Deadlock · ε: t1 false` in the status row, the list opens on click; (2) b2net with `a b`, then `node.[x] > 0`: after Reset the defects line lists the guard, the status row gives the reason; (3) b2net with `p2.[visits] > 0`: the reason names the attribute; (4) turnstile with guards (the §4.2 fixture): Push's `title` in `Running` says `tPushL: false`, pressing it prints `Push: discarded, tPushL false`, after Coin the status row names `tPushU`; (5) a long «Last step» or halt line stays on one line and the buttons do not move (compare the Step button's position before and after); (6) `flow` to `Terminated`: no reason shown. Wait.
8. After the GO, one closure commit (P13, RC-17): the entry in `docs/log-inbox/simulation.md` (Layer Impact Report: not required, no D/L or sync layer; `Smoke visivo:` Alfonso's answer), the Status of this file and of the Phase 1 file `claude_2026-09-26_1315_prompt_sim_guard_outcomes_discovery.md` flipped (`eseguito 2026-09-26 · lane simulation · <sha>`, the Phase 1 one with `7abb57eaa`). The entry closes the B2 ticket «the panel shows no guard outcome». Add one Ticket paragraph: `else` on a Petri transition is compiled as an ordinary guard expression (`netCompile.ts:228` recognises it on control-flow edges only), while R-SIM-25 and R-SIM-31 define it as the complement of its siblings. Before writing it, probe it once on the pure core (a Petri fixture with two transitions sharing a preset, one guard `false`, the other `else`; not committed) and state the measured outcome in the ticket.
9. Closing report opening with `[P-2026-09-26-1315 · session <id>]`: the two shas, gates, mutants, the probe result, any deviation. Stop the dev server. Then stop: the merge toward the trunk gets its own prompt from chat.

Stop and ask if: a ruling needs a file under `model/simulation/`; the status row cannot hold the reason on one line without changing its height; `RunStart` needs more than the one optional field.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `rm` of the `node_modules` symlink, a critical-zone edit, push, any tree or server you did not start.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-26_sim_guard_outcomes.md` (`7abb57eaa`) §3-§7.
- `docs/decisions.md` R-SIM-16, R-SIM-25, R-SIM-29, R-SIM-31, R-SIM-36, R-SIM-37, R-SIM-57..63.
- The B2 lane (`81373fab0`, `61c5b98a0`) and its ticket.
- `docs/PROTOCOL.md` P13.
