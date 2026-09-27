# Prompt: the demo script names the gestures of the ESM hint path, measured on the trunk

Prompt-ID: P-2026-09-27-1540
Chat: C-2026-09-27-1437
Lane: fast (docs only: one section of the demo script, one log entry; no code, no visual check)
Status: eseguito 2026-09-27 · lane sim-demo-script-hint · the commit of this line

Worktree: `~/jjodel-open`, branch `sim-demo-script-hint` (cut by the chat from `alfonso-frontend-jjtl` at `d7fe8871f`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-open`, branch `sim-demo-script-hint`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Lane P-2026-09-27-1500 measured the ESM hint path of `docs/demo/models_2026_simulator_demo.md` on the trunk. Every value the script quotes holds; two steps need gestures the script does not name: the new row's third line and the second `Add attribute` sit below the panel's fold (19 to 28 px), and the cells come prefilled (`x1`, `false`, maximum `1`), so a click leaves the caret after the text and a double-click is needed before typing. The report proposes the exact wording in its §6. Chat decisions, unattended (RC-25), answering the report's §8: the script takes §6's wording step by step (not one general "scroll first" line), because the three positions are measured and a presenter needs to know where; the post-MODELS ticket (scroll the new row into view, select a prefilled cell on focus) stays open; the chat's RC-23 browser check before the freeze re-reads the three below-the-fold positions.

The report lives on branch `sim-hint-path-probe` (commit `6acdb7080`), not yet on the trunk: read it with `git show sim-hint-path-probe:docs/discovery/discovery_2026-09-27_sim_demo_hint_path_trunk.md`.

## DOVE

- `docs/demo/models_2026_simulator_demo.md`, §2.3 (Extended state machine) steps 1 to 4 and the sentence on the count of interactions right after them (around lines 194 to 203); §3 or §4 only where they repeat the claim that the hint path was measured only by lane R2 (around lines 195, 326 to 328): replace that claim with the trunk measurement. Every other line of the script unchanged, including §2.2 and decision H (Bound = 4 on screen, already in the script).
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.

Out of scope: every file under `frontend/`, the discovery reports, `docs/decisions.md`, `docs/PROTOCOL.md`.

## COME

1. Read the report (via `git show`, above) §0, §4, §6 and §8; read the script whole.
2. Apply §6's wording to steps 2, 3 and 4 and to the count sentence; step 1 gets the trunk measurement tag instead of the R2 one. Keep the script's conventions: `[M]` marks a measured value, measurements cite their numbers, the HTML comment at lines 199-200 goes away (its content is now measured). No em dashes.
3. Where §3 or §4 say the hint path is unrehearsed on the trunk, say it was measured on the trunk by P-2026-09-27-1500 and that the RC-23 browser check re-reads the three below-the-fold positions before the freeze.
4. Gates: `check:docs` from `frontend/`; `grep -c '—'` on the script is 0.
5. One commit, pathspec after `--`, with the script, the log entry and the Status flip (`eseguito 2026-09-27 · lane sim-demo-script-hint · the commit of this line`): subject `docs(sim): demo script names the ESM hint path gestures (P-2026-09-27-1540)`.
6. `Outcome: done` with the sha and the diff stat of the script.

Stop with `Outcome: question` and a `Recommended:` line if §6's wording contradicts a value the script quotes elsewhere (say which line).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a file under `frontend/src`, push, writes in any other tree.

## RIFERIMENTI

- `sim-hint-path-probe:docs/discovery/discovery_2026-09-27_sim_demo_hint_path_trunk.md` §0, §4, §6, §8.
- `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` §7 risk 4, §8.
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-23, RC-25.
