# Prompt: prepare the four demo projects on the 3001 instance

Prompt-ID: P-2026-09-28-1015
Chat: C-2026-09-27-1437
Lane: fast (no code change; one discovery step with a saved report). Tier: light.
Status: eseguito 2026-09-28 · lane demo-prep, this worktree · the report and the log entry are in the commit that carries this line (a commit cannot name its own sha) · four scenes built headless against trunk 447e4239b, four JSON exports in /Users/alfonso/jjodel-demo-exports/, Alfonso imports them via the app's own Import

Worktree: `/Users/alfonso/jjodel-w-demoprep`, branch `demo-prep`, created from trunk `888ea9a9d`, `frontend/node_modules` symlinked (P14). Before anything else run `pwd` and `git branch --show-current`: if the answer is not that worktree on `demo-prep`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-1015 · session <id>]` and ends with an `Outcome:` line (P16). Run gates and probes in the foreground.

## COSA

Prepare the four demo projects of `docs/demo/models_2026_simulator_demo.md` (§2.1 to §2.4) in the instance of Alfonso on `http://localhost:3001`: `DemoPEST` with `demoSM`, `DemoPetri` with `demoNet`, `DemoESM` with `demoESM`, `DemoFlowB` with `demoFlowB`, one project per preset, each exactly as the builder draws it, with an empty simulation bag. Then Cmd+S, one reload, check the four initial readings, and export one JSON per scene.

Deliverables: the four projects present in Alfonso's 3001 instance (or the fallback below), four JSON exports in `/Users/alfonso/jjodel-demo-exports/` named `scene_1_DemoPEST.json`, `scene_2_DemoPetri.json`, `scene_3_DemoESM.json`, `scene_4_DemoFlowB.json` with their md5, and the report `docs/discovery/discovery_2026-09-28_demo_prep_3001.md`.

If creating or importing projects in Alfonso's own 3001 instance is not possible, stop with `Outcome: question` and one `Recommended:` answer. Expected recommendation in that case: build the four projects in a headless context, export the four JSON files, and Alfonso imports them with the app's Import project.

## DOVE

- Read and write nothing under `frontend/src`. Files you may add: the report above, this prompt file, one entry in `docs/log-inbox/simulation.md`. Commit them on `demo-prep`, `git add` with explicit paths, never `git add .`.
- Builder and helpers to reuse, as scratch, not committed: `/Users/alfonso/jjodel-sim/frontend/scripts/smoke/_tmp_demo2_scenario.js` and the helpers it names (`_tmp_sim3b_scenarios.js`, same folder). Copy them under `~/.jjodel-lanes/P-2026-09-28-1015/` and adapt the port from 3011 to 3001 there.
- Port 3001 (pid 61660) is Alfonso's dev server: never restart, kill or reconfigure it. Do not touch his Chrome profile, and do not restart his Chrome.
- Do not push. Do not merge. Do not touch the trunk tree `/Users/alfonso/jjodel-release`.

## COME

1. Discovery, read-only, 10 minutes at most. Find where a project of the 3001 app persists (browser storage of the origin, or a backend) and which channels can write into Alfonso's instance without touching his browser profile: a headless context on `localhost:3001` has its own storage and is not his; a Chrome attached over a remote debugging port only counts if one is already listening (do not start or restart one). Find the app's Import and Export project paths and the JSON format. Write the finding in the report (goal, files read, findings, risks, open questions). Choose the route that works. If none puts the projects inside his instance, stop as described in COSA.
2. Build. In a page of `localhost:3001` with a project open (the RowViewSmoke seed, as the probes did), run the builder for each preset from an empty bag, in the shape of §2.1 to §2.4 (names, types, abstract flags, references, model objects). Name each project after its metamodel. Set no simulation role: no Apply, no Configure, no run.
3. Save check. Cmd+S in each project, reload the page once, then check that the metamodel, the model and its objects are intact (counts of classes, references and objects equal to §2.x). Then check the two initial readings from the demo script for each preset: the M2 face reads `Custom · Not checkable` with its `Missing:` line, and the M1 face reads `Simulation not configured. Missing on <metamodel>: ...`, verbatim as §1 and §2.x quote them. Anything that differs goes in the report with the measured text.
4. Export each project as JSON with the app's Export, write the four files to `/Users/alfonso/jjodel-demo-exports/`, print name, size and md5 in the report.
5. Report one line per scene: built, saved, reload intact, two readings, export md5. Log entry in `docs/log-inbox/simulation.md`, flip Status of this prompt, one closure commit on `demo-prep`. English only in every committed file, no em dashes.

## RIFERIMENTI

`docs/demo/models_2026_simulator_demo.md` (§1 setup, Save check, §2.1 to §2.4), `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` §4, `docs/discovery/discovery_2026-09-27_freeze_readiness.md` (F1, Cmd+S), `frontend/scripts/smoke/README-probes.md`, `docs/PROTOCOL.md` P14, P16.
