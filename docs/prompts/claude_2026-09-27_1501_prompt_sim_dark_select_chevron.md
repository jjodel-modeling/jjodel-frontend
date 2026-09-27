# Prompt: the doubled chevron of the declarations table selects in dark

Prompt-ID: P-2026-09-27-1501
Chat: C-2026-09-27-1428
Lane: fast (a short discovery inside the lane, then one SCSS fix scoped to the simulation panel; a probe crop in dark replaces the visual check, the chat reads the pixels)
Status: da eseguire

Worktree: `~/jjodel-open`, branch `sim-dark-select-chevron` (cut by the chat from `alfonso-frontend-jjtl` at `86520a8f3`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-open`, branch `sim-dark-select-chevron`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Ticket of `docs/log-inbox/simulation.md` (lane C1, priority low): with `data-theme="dark"` every select of the simulation panel's declarations table paints two chevrons. Cause not investigated; the usual shape of this defect is two rules that each set `appearance: none` plus a `background-image` arrow (a global form rule and a component or theme rule), or a dark-theme rule that adds a second background layer on `select`. Chat decision, unattended (RC-25): fixed now as a fast lane because it is cosmetic, disjoint from the engine and from every other open lane, and the fix is confined to the simulation panel's own styles; light mode must not change by a pixel.

## DOVE

- Discovery (read-only, 15 minutes at most): `frontend/src/components/editor-v2/sim/simulation-panel.scss`, `frontend/src/styles/components/_form-system.scss`, `frontend/src/components/editor-v2/_color-schemes.scss`, and whatever `grep -rn "chevron" frontend/src --include=*.scss` names that applies to a `select` inside `.sim-panel`. Report: `docs/discovery/discovery_2026-09-27_sim_dark_select_chevron.md` (short: the two or more rules that paint an arrow, their selectors and files, which one wins in light and which both apply in dark).
- Fix: `frontend/src/components/editor-v2/sim/simulation-panel.scss` only, a rule scoped under the panel's selects that removes the second arrow in dark (or in both themes if the second arrow is theme-independent and only visible in dark). No global file changes.
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.
- Screenshots in `~/.jjodel-lanes/shots_chevron/` (outside the tree).

Out of scope: `_form-system.scss`, `_color-schemes.scss`, `EditorV2.scss`, any `.tsx`, every engine file, `docs/decisions.md`.

## COME

1. Baseline from `frontend/`: typecheck (14 known errors); vitest on `src/components/editor-v2/sim` count, 0 failed.
2. Discovery, report written.
3. Measure before the edit: a probe copied read-only from `~/jjodel-sim/frontend/scripts/smoke/_tmp_demo2_esm.ts` and its common file as `_tmp_chevron_*` (gitignored), dev server from this tree on port 3014 (never 3000-3006, 3010-3013), open the ESM preset, set `document.documentElement.dataset.theme = 'dark'` (or the app's own theme toggle if the attribute lives elsewhere: say where), crop one select of the declarations table at 2x, and read its computed `background-image` and `appearance`, plus the same for `::after` / `::before` pseudo-elements of its wrapper if any.
4. The edit, minimal diff, no rename.
5. Re-run the probe in dark and in light: one chevron in dark, light identical to the baseline crop (compare the light crops byte-wise or by a pixel diff; say the method).
6. Gates: typecheck; vitest green, same count; build exit 0; `check:docs`; `check:scripts`.
7. Two commits, pathspec after `--`: `fix(sim): one chevron on the declarations table selects in dark (P-2026-09-27-1501)`, then the docs commit with the report, the log entry and the Status flip.
8. `Outcome: done`, shas, and the two readings (dark before/after, light before/after).

Stop with `Outcome: question` and a `Recommended:` line if the second arrow can only be removed by editing a global file (recommended: an override scoped under `.sim-panel` in `simulation-panel.scss` with the same specificity plus one class), or if the defect is not reproducible on the trunk in dark (then close with the report only and `Outcome: done`, ticket closed as not reproducible).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a global SCSS file, an engine file, push, writes in any other tree, ports other than 3014.

## RIFERIMENTI

- `docs/log-inbox/simulation.md`, the C1 ticket on the doubled chevron; lane C1's dark screenshots if still in `~/.jjodel-lanes/`.
- `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md` §12 (how the probes run).
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-23, RC-25.
