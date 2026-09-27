# Prompt: the demo script after E1 and E2

Prompt-ID: P-2026-09-27-1738
Chat: C-2026-09-27-1437
Lane: fast (docs only: the demo script and one log entry; the constraints it lifts are verified by a probe, not by reading)
Status: da eseguire

Worktree: `~/jjodel-w-script`, branch `sim-demo-script-e1e2` (a new worktree cut by the chat from `alfonso-frontend-jjtl` at `d9e88f792`, E1 and E2 merged, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-script`, branch `sim-demo-script-e1e2`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

`docs/demo/models_2026_simulator_demo.md` still carries three constraints that E1 (P-2026-09-27-1610) and E2 (P-2026-09-27-1611), now on the trunk, make obsolete. Alfonso ratified the change on 2026-09-27 (answers memo, item B).

1. Petri scene §2.2: step 3 «Bound = 4 on screen (decision H)» and its «Say» go away. Apply now proposes `Bound → 4` itself; the step becomes the reading «Apply proposes Bound 4 (largest reachable marking, 9 markings explored)» with the Say «Apply finds the bound by exploring the net.». §3's «Petri: Bound = 4 on screen after Apply» constraint and its footnote are removed or rewritten accordingly.
2. Decision E, §2.4 and §3: the flow final may now be named `ActivityFinal` (G6: the engine reads the activity final), and `[else]` into a Fork or out of a Join now resolves (G7). Keep the script's current model if it still works, but drop the constraint wording; say what is now allowed.
3. Any interaction count or measurement these changes affect.

Every claim the script makes as measured (`[M]`) must be measured on this tree, not inferred.

## DOVE

- `docs/demo/models_2026_simulator_demo.md`: §2.2, §2.4, §3, §4 where they mention the three constraints; nothing else.
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.
- Probes: copies of `~/jjodel-sim/frontend/scripts/smoke/_tmp_demo2_petri.ts`, `_tmp_demo2_flow.ts` and their common and vite files, read-only, as `_tmp_script_*` (gitignored), on port 3022 only.

Out of scope: every file under `frontend/src`, `docs/decisions.md`, the discovery reports.

## COME

1. Read the script whole, the E1 and E2 log entries, and the answers memo (`git show sim-canvas-state:docs/ratifiche/claude_ratifiche_2026-09-27_sim_backlog_answers.md` if not yet on the trunk).
2. Probe on 3022: Petri preset, Apply, read the Bound proposal and its title; run the scene with the proposed bound and read that it does not halt `unsafe` at step 2; Flowchart B with a flow final named `ActivityFinal` ends `Terminated`.
3. Edit the script, minimal diff, `[M]` on each new measured value, no em dashes.
4. Gates: `check:docs`; `grep -c '—'` on the script is 0.
5. One commit with the script, the log entry and the Status flip: `docs(sim): demo script after E1 and E2 (P-2026-09-27-1738)`.
6. `Outcome: done` with the sha, the diff stat and the three readings.

Stop with `Outcome: question` and a `Recommended:` line if a probe reading contradicts E1's or E2's reports.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a source file, push, writes in any other tree, ports other than 3022.

## RIFERIMENTI

- `docs/demo/models_2026_simulator_demo.md`; E1 and E2 entries in `docs/log-inbox/simulation.md`; `docs/discovery/discovery_2026-09-27_sim_post_models_engine.md`.
- `docs/PROTOCOL.md` P13, P14, P16; RC-17, RC-23, RC-25.
