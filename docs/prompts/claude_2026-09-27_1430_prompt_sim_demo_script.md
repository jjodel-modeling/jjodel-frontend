# Prompt: the MODELS 2026 demo script for the simulator, compiled from the readiness reports

Prompt-ID: P-2026-09-27-1430
Chat: C-2026-09-27-1428
Lane: fast (docs only: one new file under `docs/demo/`, one inbox entry; no frontend code, no critical zone; the probes are read, re-run only if a quoted line is missing)
Status: eseguito 2026-09-27 · lane simulation-engine · 6fd1da38f

Worktree: `~/jjodel-sim`, branch `simulation-engine`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, `git log -1` is the commit that adds this file (its parent `4edc8bed5`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1430 · session <id>]` and ends with a bare `Outcome:` line, the shas on the line above. Run gates in the foreground.

## COSA

Write the demo script of the simulator for MODELS 2026 (Málaga, demo on 2026-10-04) as one Markdown file, `docs/demo/models_2026_simulator_demo.md`, in English. The freeze of the demo build is 2026-10-01 evening; after it only this script is rehearsed. The script is for the presenter (Alfonso), who draws the four presets live and runs them: every line he types, clicks or says must be there, and every line the panel is expected to show must be a line the readiness lanes measured (`discovery_2026-09-27_sim_demo_readiness_2.md` §4, its logs and screenshots), quoted verbatim. Nothing in the script is a guess: a line you cannot find in the report, its logs (`/tmp/demo2_scratch/*.log`) or the probes' builder (`_tmp_demo2_scenario.js`) is either measured now by re-running that one probe, or left out with a `<!-- not measured -->` marker.

Structure, in this order:

1. **Setup** (one screen): the URL, light theme, window 1600×1000, the Simulation panel open, the four preset projects prepared or drawn live (say which, per preset, from the builder), «Reset starts the run: before Reset every input is off».
2. **Four scenes, one per preset, in the order PEST state machine, Petri net (P/T), extended state machine, flowchart B.** Each scene has: the metamodel and the model as the builder creates them (classes, attributes, references, instance names, arc weights, initial marking), the Apply step (what the proposal list shows, the `why` titles if the report quotes them, the fold height), the run step by step (which button, the expected `Last step:` line, the expected `Marking:` line, σ where present), and the sentence the presenter says at each step (short, technical, no marketing).
3. **Script constraints**, one per line, each with the gap it comes from, taken from the report's §8 and closed by the decisions below:
   - Decision H, taken by Alfonso on 2026-09-27 14:27: **Petri Bound = 4 set on screen** after Apply (Configure…, Bound: two interactions, as run B does), no code change; the reachability bound (G12) stays after MODELS. Write it as the script's rule, and the alternative firing order only as a fallback footnote.
   - Decision E: a flow final named `FinalNode` (or `Final`), never `ActivityFinal` (G6); an explicit complement instead of `[else]` into a Fork or a Join (G7).
   - A4: Initial and Final as classes, a boolean flag is `none` with its reason.
   - Undo right after Apply only with the focus in the editor: click the empty canvas first, never a node.
4. **Risks and what to say if they show** (report §7): the canvas contradicts the panel on Petri during a run (point at the panel line; the canvas view is after MODELS); the `∅` glyph reads like `ø` at 11-12 px (say «empty postset»); the declarations table below the fold via Configure… on ESM (use the hint's button).
5. **Out of the demo** (one list): the canvas side of G3, G6, G7, the `.smv` exporter, the modal lane, the outputs (Moore/Mealy) profiles.

Length: as long as the four scenes need, no more; no introduction about Jjodel, no summary. Every measured value carries `[M]` as the reports do.

Then one entry in `docs/log-inbox/simulation.md`: the script written, decision H recorded as the script's rule (G12's script side closed; the engine side stays after MODELS), and the report's §10 H marked decided.

## DOVE

- `docs/demo/models_2026_simulator_demo.md`: new (create `docs/demo/`).
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.

Out of scope: anything under `frontend/src/`, `docs/decisions.md` (no R- row: decision H is a script constraint, not an invariant), the readiness reports (read only, never edited), the probes (read; a re-run writes only under `/tmp/demo2_scratch/`), `docs/PROTOCOL.md`.

## COME

1. Read the whole of `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` and §4, §6, §8 of `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md`; read `frontend/scripts/smoke/_tmp_demo2_scenario.js` for the exact shapes the four presets are built from, and the logs in `/tmp/demo2_scratch/` for the per-step lines (`/tmp/demo2_scratch/digest.js` prints them). Look at the screenshots in `~/.jjodel-lanes/shots_readiness2/` when a line's wording is in doubt.
2. If a step's expected line is in none of these, re-run that one probe from `frontend/` (`npx tsx scripts/smoke/_tmp_demo2_<preset>.ts`, dev server on port 3011 via `_tmp_demo2_vite.config.ts`, as the report's §12 says); stop the server afterwards. Do not start anything on 3000, 3001, 3003 (Alfonso's) or 3010.
3. Write the file. Style: CLAUDE.md §writing rules (no em dashes, no filler, short sentences, active voice); the presenter's sentences in quotes.
4. Gates: `check:docs` green from `frontend/`; `grep -c '—' docs/demo/models_2026_simulator_demo.md` is 0.
5. Two commits, pathspec after `--`: the script, subject `docs(sim): MODELS 2026 demo script from the readiness reports (P-2026-09-27-1430)`, body naming the report sha `a41e63496` and decision H; then the inbox entry and the Status flip `eseguito 2026-09-27 · lane simulation-engine · <script sha>`, subject `docs: close the demo script lane (P-2026-09-27-1430)`.
6. `Outcome: done`, shas on the line above.

Stop with `Outcome: question` and a `Recommended:` line only if the builder's shapes and the report's §4 disagree on a preset (then the report wins and the disagreement is a line in the inbox entry).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, any other tree.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` (`a41e63496`), §4 scenes, §5 gaps, §7 risks, §8 constraints, §9-§11 decisions and questions, §12 probes and logs.
- `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md` §6, §8, §11.
- `frontend/scripts/smoke/_tmp_demo2_scenario.js`, `_tmp_demo2_{petri,flow,sm,esm}.ts`, `/tmp/demo2_scratch/`.
- `docs/decisions.md` R-SIM-80..82 (Apply, the M1 face, `Marking:` on every preset), R-SIM-53 (G6), RC-25..28.
- Session checkpoint `docs/sessioni/sessione_2026-09-27_3.md`, «New bugs and tickets».
