# Prompt: the demo script walks the Simulation roles dialog

Prompt-ID: P-2026-09-27-2105
Chat: C-2026-09-27-1437
Lane: fast (docs only: the demo script and one log entry; every gesture and reading measured by a probe on this tree, not by reading code)
Status: da eseguire

Worktree: `~/jjodel-w-demo-modal`, branch `sim-demo-script-modal` (a new worktree cut by the chat from `alfonso-frontend-jjtl` at `22aa888de`, the sim-modal merge P-2026-09-27-2049 included, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-demo-modal`, branch `sim-demo-script-modal`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

The Simulation roles dialog (P-2026-09-27-1740, merged by P-2026-09-27-2049) replaced the inline Configure… groups of the Simulation panel. Alfonso decided on 2026-09-27 at 17:39 that the MODELS demo walks the dialog (row in `docs/decisions.md`). `docs/demo/models_2026_simulator_demo.md` still walks the old groups: the 1740 lane's High ticket names §2.2 step 3 (Petri Bound), §2.3 (ESM declarations) and §2.4 (Flowchart declarations), and the hint gestures of P-2026-09-27-1540 may land elsewhere now.

Re-walk the four scenes (State machine, Petri net P/T, Extended state machine, Flowchart / Activity B) through the dialog and rewrite every step that names a control, a gesture or a reading that changed. Keep each scene's model, story and ending unless a probe proves they no longer hold. The 1740 lane's per-preset readings are the expected values (Phase 2 entry in `docs/log-inbox/simulation.md`): State machine 7 of 10 roles, Checkable, 10 steps to `Terminated`; Petri `Bound → 4` with the engine's explanation, 4 steps to `Deadlock · ε: t2 false`; ESM coins and paid declared in the dialog, 10 steps to the `Halted: coins of demoESM would be 4, outside its domain.` line; Flowchart B count declared in the dialog, 6 steps to `Terminated`. The «Add attribute» hint now opens the dialog on Data with the button focused: say so where the script uses it.

Keep the interaction counts honest: count clicks and keystrokes per scene on the probe and update the script's counts, `[M]` on each.

## DOVE

- `docs/demo/models_2026_simulator_demo.md`: the scenes and the §3/§4 constraint and count lines the dialog changes; nothing else.
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.
- Probes: copies of the 1740 lane's walk probe (`frontend/scripts/smoke/_tmp_modal_*` in `~/jjodel-w-modal`, read-only) as `_tmp_demomodal_*` (gitignored), dev server from this tree on port 3024 only. Crops of each scene's dialog and final panel, light, 1600x1000, in `~/.jjodel-lanes/shots_demo_modal/`.

Out of scope: every file under `frontend/src`, `docs/decisions.md`, the discovery reports, the ratification memos.

## COME

1. Read `CLAUDE.md`, the script whole, the 1740 Phase 2 log entry and its report `docs/discovery/` for the modal, and the 1540 and 1738 entries.
2. Probe on 3024: the four scenes as a presenter would run them, fresh page per scene, reading every value the script states. Record the click and keystroke count per scene.
3. Edit the script, minimal diff, `[M]` on each new measured value, the «Say» lines short and spoken, no em dashes.
4. Gates: `check:docs`; `grep -c '—'` on the script is 0.
5. One commit with the script, the log entry and the Status flip: `docs(sim): demo script walks the Simulation roles dialog (P-2026-09-27-2105)`.
6. `Outcome: hard-stop` with the sha, the diff stat, the four readings, the counts before and after, and the crop paths: the chat checks the crops (RC-23) and merges.

Stop with `Outcome: question` and a `Recommended:` line if a scene no longer reaches its ending, or if a reading differs from the 1740 lane's.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a source file, push, writes in any other tree, ports other than 3024.

## RIFERIMENTI

- `docs/demo/models_2026_simulator_demo.md`; the P-2026-09-27-1740 and P-2026-09-27-2049 entries in `docs/log-inbox/simulation.md`; `docs/decisions.md` (the 2026-09-27 17:39 row).
- `docs/PROTOCOL.md` P13, P14, P16; RC-17, RC-23, RC-25.
