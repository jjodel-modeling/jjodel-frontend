# Prompt: demo polish from the freeze readiness findings F2, F3 and the F1 workaround

Prompt-ID: P-2026-09-28-0014
Chat: C-2026-09-27-1437
Lane: full (two small fixes outside the simulator, one demo-script change; visual check by the chat on the lane's crops, RC-23)
Status: eseguito 2026-09-28 · lane demo-polish · 813a73ff5 · verifica visiva OK (chat, RC-23) · F3 accepted for MODELS, ticket after MODELS

Worktree: `~/jjodel-w-polish`, branch `demo-polish`, cut by the chat from `alfonso-frontend-jjtl` at `e87df1ff6`; `frontend/node_modules` symlinked (P14); a fresh session started by `lane-run`. Before anything else: `pwd` is that worktree, the branch is `demo-polish`, `git log -1` is the commit that adds this file, `git status` is empty; otherwise stop with `Outcome: blocked` and say which.

## COSA

The freeze readiness discovery (P-2026-09-27-2236, report `docs/discovery/discovery_2026-09-27_freeze_readiness.md` on branch `freeze-readiness`, commit `c6933dded`; read it with `git show c6933dded:docs/discovery/discovery_2026-09-27_freeze_readiness.md`) found the trunk ready with caveats. Alfonso set the chat to auto mode on 2026-09-28 at 00:07 («esegui tutto»). This lane closes the three findings visible in the MODELS demo:

1. **F2.** Switching the theme in Settings while a project is open does not reach the open editor: `AppearanceSettings.tsx` changes the theme without firing the event the editor listens for, so light and dark mix. Fix it at the source with the minimal change: fire the same event (or call the same function) the other theme path uses. Find that path first and quote it. No new event name unless none exists (then grep that the name is free).
2. **F3.** Toolbar labels are cut: `LAYOUT` and `Abstract syntax` on the model tab at 1600x1000, `Structured` and `Abstract syntax` on both tabs at 1280x800. Fix with the smallest CSS change that lets the labels read whole at both sizes without moving any other control (R-SIM-65 spirit: no layout shift in the rest of the bar). If whole labels cannot fit at 1280 without a redesign, stop with `Outcome: question` and a `Recommended:` line.
3. **F1 workaround in the script.** Without Cmd+S model edits are not reliably saved though the bar says `Saved just now`. Do not touch persistence in this lane. Add to `docs/demo/models_2026_simulator_demo.md` §1 Setup one step: after preparing each project, Cmd+S, reload once, check the project is intact. Minimal diff, no em dashes.

Out of scope: F4, F5, F6, F7, F8 (tickets, after MODELS), persistence and save code, every simulator file, every critical-zone file.

## DOVE

- The file that holds `AppearanceSettings` (find it), and the theme-event source it must reuse; the toolbar component and its SCSS (find them from the labels); `docs/demo/models_2026_simulator_demo.md` §1 only; `docs/log-inbox/` one entry in the right front; this prompt's Status.
- Verify any new class or identifier is free with a global grep first.
- Probe: copy read-only the freeze probe files from `~/jjodel-w-freeze/frontend/scripts/smoke/_tmp_freeze_*` as `_tmp_polish_*` (gitignored); dev server from this tree on port 3030 only. Crops in `~/.jjodel-lanes/shots_polish/`: the toolbar on both tabs at 1600x1000 and 1280x800, light and dark; the editor after a theme switch in Settings with a project open, before and after the fix.

## COME

1. Read `CLAUDE.md`, the freeze report §F2, §F3, §F1, and the files of the DOVE whole.
2. Baseline: typecheck (14 known), vitest on the touched directories.
3. F2: test first if a unit test can hold it, else the probe is the test; the fix; green.
4. F3: measure the label widths and the bar before; the CSS; measure after; nothing else in the bar moves.
5. The script step for F1.
6. Gates: typecheck same 14, vitest green, build exit 0, `check:docs`, `check:scripts`.
7. Commits: `fix: the theme switch reaches the open editor (P-2026-09-28-0014)`, `fix: toolbar labels read whole at 1600 and 1280 (P-2026-09-28-0014)`, then one docs commit (script step, log entry, Status).
8. `Outcome: hard-stop` with the shas, the before/after measures and the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone file, push, writes in any other tree, ports other than 3030.

## RIFERIMENTI

- `c6933dded:docs/discovery/discovery_2026-09-27_freeze_readiness.md`; `docs/demo/models_2026_simulator_demo.md`; `docs/decisions.md` RC-31, R-SIM-65.
- `docs/PROTOCOL.md` P13, P14, P16; RC-17, RC-21, RC-23, RC-25.
