# Prompt: `else` on Petri transitions, and the panel lines that appear go above the buttons

Prompt-ID: P-2026-09-26-1535
Chat: C-2026-09-26-1100
Lane: full (more than 3 files)
Status: eseguito 2026-09-26 · lane simulation · b76d75cc9, f58456c63 · verifica visiva passata 2026-09-26 (passo 5 verificato dalla sessione)

Worktree: `~/jjodel-sim`, branch `simulation-engine`, a fresh session (`/clear`). Before anything else: `pwd` is `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, `git log -1` is the commit that adds this file and R-SIM-64..65 (subject `docs: ratify R-SIM-64..65 and add the Petri else and panel lines prompt (P-2026-09-26-1535)`), its parent is `5a398eaee` (closure of `P-2026-09-26-1315`), `git status` empty apart from the three untracked, gitignored `frontend/scripts/smoke/_tmp_b2_*` files. Otherwise stop.

## COSA

Two fixes, each closing a Ticket paragraph of the `P-2026-09-26-1315` entry in `docs/log-inbox/simulation.md` (`5a398eaee`). Read R-SIM-25, R-SIM-31, R-SIM-63, R-SIM-64, R-SIM-65 whole in `docs/decisions.md`.

1. **R-SIM-64, core.** A Petri transition whose guard text is `else` becomes the complement of its siblings (same preset with weights, same triggers: the existing `siblingKey`), exactly as a control-flow edge does today (`netCompile.ts`, the `isElse` block); two `else` among siblings are `else-twice`. Today it is parsed as an ordinary guard and is a defect (probe of the 1315 closure).
2. **R-SIM-65, panel.** The lines that appear and disappear (`runError`, `runWarning`, the interruption, the defects line at Reset, the halt line) move above the actions row, so the bottom-anchored panel grows upward without moving the buttons. The status row and «Last step» stay below the actions. User-initiated growth (the choice list of R-SIM-35, the reason list of R-SIM-58) stays where it is.

## DOVE

- `frontend/src/model/simulation/netCompile.ts`: the Petri branch (around the transition build, `guardSites: stc.guard ? [t] : []`) recognises `else` and sets `elseOf` from the sibling group, reusing `siblingKey` and the control-flow logic; extract a shared helper only if it avoids duplicating the `else-twice` rule, and say so.
- `frontend/src/model/simulation/__tests__/netCompile.test.ts` (and `netStep.test.ts` if the end-to-end case sits better there; say which).
- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: the JSX order only.
- `frontend/src/components/editor-v2/sim/simulation-panel.scss`: only if the move needs spacing; existing class names unchanged.

Out of scope: `netStep.ts` logic (the `else` evaluation already exists), `netTypes.ts`, `simBridge.ts` (its texts already name `else`), the `else` on fused fork/join edges in control flow (today `elseOf: null` there too: note it in the report if you see it, do not fix it), every critical-zone file.

## COME

1. Baseline: `npm run typecheck` (exit 2, 14, the §17 set), `npx vitest run` (4828 passed, same 9 red at import, 0 failed), `npm run build` (exit 0, 51 warning lines), `check:docs` 4/4, `check:scripts` as the baseline. State expected, record measured.
2. Tests first, red: a Petri net with `p` (1 token) feeding `tf` (guard `false`) and `te` (guard `else`): `te.elseOf` is `[tf]`, `te` has no guard site, and `candidates` gives `te`; with `tf` guard `true`, `te` is `else(false)`; with `tf` defective, `te` is a defect (R-SIM-31); two `else` on the same preset are `else-twice`; transitions with different presets or different triggers are not siblings; every control-flow `else` test still passes unchanged.
3. Implement, minimal diffs, no rename.
4. Mutants, table in the code commit body: (1) Petri `else` still parsed as a guard; (2) siblings by preset places ignoring weights; (3) siblings ignoring triggers; (4) `else-twice` not reported in Petri; (5) the `else` keeps its own guard site. A survivor is a stop.
5. Gates: typecheck as the baseline, vitest baseline plus the new tests (state the delta first), 0 failed, build exit 0, `check:docs` 4/4, `check:scripts` as the baseline; `git diff --stat` outside DOVE empty.
6. Code commit, pathspec after `--`, subject `fix(sim): else on Petri transitions, panel lines above the buttons (P-2026-09-26-1535)` (within §6.2 without the suffix), body with baseline, gates, mutants, `Model:` trailer.
7. **Visual check, hard stop.** Dev server on 3002 from this tree (your scratch Vite config with `fs.allow` is allowed, not committed). Take your own screenshots, measure the Step button's position, then give Alfonso the steps: (1) a Petri net with `p → tf [false]` and `p → te [else]` (build it with a console script like the B2 fixture, name the script): Reset, `te` is the candidate and fires; (2) in `b2net` set the guard to `a b` and press Reset: the defects line appears above the buttons and the Step button does not move (compare before and after); (3) a run that halts (an unsafe firing, for example `b2net` with k = 1 and a second token): the halt line appears above the buttons, Step does not move; (4) edit the model during a run: the interruption line appears above the buttons; (5) `flow` to `Terminated` as before. Wait.
8. After the GO, one closure commit (P13, RC-17): the entry in `docs/log-inbox/simulation.md` (Layer Impact Report: not required; `Smoke visivo:` Alfonso's answer), which closes both Ticket paragraphs of the 1315 entry; the Status of this file flipped to `eseguito 2026-09-26 · lane simulation · <code sha>` plus the visual outcome.
9. Closing report opening with `[P-2026-09-26-1535 · session <id>]` (every reply of this session opens that way): the two shas, gates, mutants, the fork/join note if any, deviations. Stop the dev server. Then stop: the merge toward the trunk gets its own prompt from chat.

Stop and ask if: the Petri fix needs `netStep.ts` or `netTypes.ts`; the control-flow `else` tests change; moving a line above the buttons changes a behaviour and not only its position.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `rm` of the `node_modules` symlink, a critical-zone edit, push, any tree or server you did not start.

## RIFERIMENTI

- `docs/decisions.md` R-SIM-25, R-SIM-31, R-SIM-35, R-SIM-58, R-SIM-63..65.
- The 1315 lane: code `fa56c14de`, closure `5a398eaee` (the two tickets, the probe).
- `docs/discovery/discovery_2026-09-26_sim_guard_outcomes.md` §4.4 (the panel geometry).
- `docs/PROTOCOL.md` P13.
