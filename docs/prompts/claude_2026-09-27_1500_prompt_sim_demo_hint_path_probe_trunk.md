# Prompt: measure the demo script's `Add attribute` hint path on the trunk (ESM preset)

Prompt-ID: P-2026-09-27-1500
Chat: C-2026-09-27-1428
Lane: fast (probe only: no source change, a discovery report, one log entry; the chat reads the crops)
Status: eseguito 2026-09-27 · lane sim-hint-path-probe · the commit of this line (docs-only probe: report, entry and flip in one commit, so no sha of its own)

Worktree: `~/jjodel-icons`, branch `sim-hint-path-probe` (cut by the chat from `alfonso-frontend-jjtl` at `86520a8f3`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-icons`, branch `sim-hint-path-probe`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

The demo script `docs/demo/models_2026_simulator_demo.md` (lane P-2026-09-27-1430, on `simulation-engine` in `~/jjodel-sim`, commit `6fd1da38f`) drives the ESM preset through the hint's `Add attribute` path (its steps at lines 194-198: click `Add attribute` in the summary line, the groups unfold with Data open, the focus lands on the table's own `Add attribute`; row 1 `coins`, domain `range`, maximum `3`; row 2 `paid`, `derived`, equation `model.[coins] >= 2`; then Apply). That path was measured once, by lane R2 on its own branch (`86401f845`), never on the trunk; the script itself flags it as the one unrehearsed path (readiness-2 report §7 risk 4). This lane measures it on the trunk so the script's claim is either confirmed or amended before the freeze of 2026-10-01. Chat decision, unattended (RC-25): a probe lane, no code.

## DOVE

- `frontend/scripts/smoke/_tmp_hint_*` (gitignored): copies of `~/jjodel-sim/frontend/scripts/smoke/_tmp_demo2_esm.ts`, `_tmp_demo2_common.ts`, `_tmp_demo2_scenario.js`, `_tmp_demo2_vite.config.ts`, read from `~/jjodel-sim` and written here under the `_tmp_hint_` prefix, extended to drive the hint path. Never write in `~/jjodel-sim`.
- `docs/discovery/discovery_2026-09-27_sim_demo_hint_path_trunk.md` (new): objective, files read, the readings step by step against the script's lines 194-198, crops, divergences, open questions.
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.
- Screenshots in `~/.jjodel-lanes/shots_hint/` (outside the tree).

Out of scope: every file under `frontend/src`, `docs/demo/models_2026_simulator_demo.md` (it lives on another branch; divergences go in the report, not in the script), `docs/decisions.md`.

## COME

1. Read the script's ESM section (`docs/demo/models_2026_simulator_demo.md` in `~/jjodel-sim`, read-only) and readiness-2 §4 ESM scenario and §7 risk 4.
2. Copy the four probe files as `_tmp_hint_*`; adapt the ESM probe to: open the ESM preset, click `Add attribute` in the summary line, read whether the groups unfold with Data open and where `document.activeElement` is (assert it is the table's `Add attribute`), add the two rows exactly as the script types them (names, `range` with maximum 3, `derived` with the equation), read the resulting declarations table from the DOM, click Apply, read the panel's proposal list and the marking line after Apply. Crop a screenshot after each of the four moments.
3. Dev server from this tree on port 3013 (never 3000-3006, 3010-3012). Run the probe with `node scripts/lane-run.mjs probe` if available, otherwise as the `_tmp_demo2_*` probes were run (see their header comments).
4. Report: one row per script step with the reading and `confirmed` or `diverges` (with what the trunk does instead). Then the log entry and the Status flip in one docs commit with the report, subject `docs(sim): hint path of the demo script measured on the trunk (P-2026-09-27-1500)`.
5. `Outcome: done` with the sha and, below it, one line per step: confirmed or diverges. If any step diverges, `Outcome: question` instead, with a `Recommended:` line that says whether the script or the code should change (default: the script, before the freeze; the code only if the divergence would break the demo).

Stop with `Outcome: blocked` if the ESM preset does not load on the trunk or the dev server does not start; say the error.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a source file, push, writes in any other tree, ports other than 3013.

## RIFERIMENTI

- `~/jjodel-sim/docs/demo/models_2026_simulator_demo.md` lines 181-200; `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` §4 (ESM), §7, §8, §12 (probe files and how they run).
- Lane R2 (`86401f845`) for the original measurement of the hint path.
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-23, RC-25.
