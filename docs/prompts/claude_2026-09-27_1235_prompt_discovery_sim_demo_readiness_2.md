# Prompt: demo readiness, second measurement on the trunk with R1, R2 and R3 (read-only)

Prompt-ID: P-2026-09-27-1235
Chat: C-2026-09-27-1140
Lane: discovery (read-only probes and one report; no code change; the screenshots are the chat's and Alfonso's visual check of the demo path)
Status: da eseguire

Worktree: `~/jjodel-sim`, branch `simulation-engine`, fast-forwarded by the chat to the trunk after the R3 merge (`git log -1` is the commit that adds this file; its parent is the merge of `sim-r3-face` or its Status flip), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, and `git log --oneline -30` contains `766b9643c` (R3), `86401f845` (R2) and `cda1fdb4e` (R1). Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1235 · session <id>]` and ends with a bare `Outcome:` line, the shas on the line above. Run gates in the foreground.

## COSA

The readiness report of this morning (`docs/discovery/discovery_2026-09-27_sim_demo_readiness.md`, `567dc25da`, measured on `ee1b7bfc8`) found 11 gaps; R1 (`cda1fdb4e`), R2 (`86401f845`) and R3 (`766b9643c`) were written against G1, G2, G3, G5, G8, G9, G10, G11, and G4 closed on the trunk by `7455d0075`. Each lane re-ran its own probes on its own branch; nobody has yet measured the four demo scenarios together, on the trunk, with the three lanes merged and interacting in `SimulationPanel.tsx`. This lane measures them, read-only, and writes the second readiness report. It changes no source file.

## DOVE

- Read: everything. Write: `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` (new); `docs/log-inbox/simulation.md`, one entry; this prompt's Status flip; the probe copies `frontend/scripts/smoke/_tmp_demo2_*` (gitignored). Screenshots in `~/.jjodel-lanes/shots_readiness2/`, never inside the tree.

Out of scope: every file under `frontend/src/`, `docs/decisions.md`, the first report (not edited: the second one refers to it).

## COME

1. Copy the readiness probes `frontend/scripts/smoke/_tmp_demo_*.ts|js` of this tree as `_tmp_demo2_*`, port 3011 (dev server from this tree, `strictPort`; never 3001-3006, 3010 is free again but leave it), screenshot root `~/.jjodel-lanes/shots_readiness2/`. Keep the scenarios as they are (Petri runs A and B, flowchart A/B/C, PEST SM, ESM, undo); do not add the lanes' own `_tmp_r*_` probes, the point is the first report's yardstick.
2. Extend the readers, not the scenarios, so that every step of every run records: the marking line text and title (R3), the choice list position relative to the buttons and Step's top (R3, R-SIM-66), the event button labels (R1), the summary proposals and the `simBound` value after Apply (R2), the hint line and whether «Add attribute» is in view (R2), the halt and «Last step» texts (R3). Print JSON, one line per reading, as the first report did.
3. Run the five probes, each with exit code and log in `/tmp/demo2_scratch/`. Stop the server.
4. Write the report with the same sections as the first (0 answer in brief, 1 hypotheses, 2 objective, 3 setup, 4 the scenarios, 5 gaps, 6 what works, 7 risks, 8 recommendation, 9 decisions taken unattended, 10 decisions awaiting Alfonso, 11 questions, 12 files and probes), and in §5 the table G1..G11 with three columns added: `first report`, `now`, `closed by` (sha), so that each gap reads measured-closed, measured-open, or not re-measurable; new gaps continue the numbering (G12…). §4 quotes the readings verbatim, with the screenshot file names. §8 says whether anything remains demo-critical before the freeze of 2026-10-01 evening, and if so proposes the lane in one paragraph; if nothing does, it says so and lists the script constraints that still hold (decision E, Initial/Final as classes, undo right after Apply). Every claim of absence with a positive control in the same probe run.
5. Gates: `check:docs` 4/4 (the report and the inbox entry lint); nothing else changes.
6. One commit, pathspec after `--`: the report, the inbox entry, the Status flip `eseguito 2026-09-27 · lane readiness-2 · <sha>` on this file, subject `docs: demo readiness, second measurement on the trunk with R1-R3 (P-2026-09-27-1235)`, body with the gap counts (closed, open, new) and the probe exit codes, `Model:` trailer.
7. `Outcome: hard-stop`, the sha on the line above, and below it, for the chat, the three most consequential readings in three lines.

Stop with `Outcome: question` and a `Recommended:` line if a probe cannot reach a scenario it reached this morning (a selector gone, a dock tab renamed) after one fix of the reader; do not change the scenario to make it pass.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a source file, push, any other tree.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md` whole, §3 setup and §12 probes above all.
- `docs/decisions.md` R-SIM-80, R-SIM-81, R-SIM-82; the commit bodies of `cda1fdb4e`, `86401f845`, `766b9643c` (probe readings of each lane, to compare).
- `docs/PROTOCOL.md` P13, P16; RC-25..28 (the report's closing sections).
