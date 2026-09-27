# Prompt: small cleanups (bordr typo, probe dark theme, R-SIM-85 header wrap)

Prompt-ID: P-2026-09-28-0055
Chat: C-2026-09-27-1437
Lane: fast (three independent small fixes, no simulator file, no critical zone)
Status: eseguito 2026-09-28 · lane small-cleanups · dbcc9f2e9

Worktree: `~/jjodel-w-cleanups`, branch `small-cleanups`, cut by the chat from `alfonso-frontend-jjtl` at `b452d9e5c`; `frontend/node_modules` symlinked (P14); a fresh session started by `lane-run`. Before anything else: `pwd` is that worktree, the branch is `small-cleanups`, `git log -1` is the commit that adds this file, `git status` is empty; otherwise `Outcome: blocked`.

## COSA

Three tickets opened by the lanes of 2026-09-27, each with its own commit:

1. **`bordr` typo** in `properties-with-tree-view.scss` (a Sass warning in every build, reported by P-2026-09-27-2248). Fix the property name to what the rule clearly meant; read the surrounding rule and the git blame of the line first; if the intent is not obvious, stop with `Outcome: question`.
2. **Probe dark theme.** Probes set `data-theme` on the root only, so canvas and tree stay light in dark crops (tickets from P-2026-09-27-1647, 1806, 2324, 0023). Find how the app itself switches theme (Settings, and the path P-2026-09-28-0014 fixed in `AppearanceSettings`), and add to the shared smoke helper (the common file the `_tmp_*` probes copy, tracked under `frontend/scripts/smoke/`) one function that switches the theme the app way. Do not rewrite existing probes. Verify with one short probe that a dark crop is dark everywhere.
3. **R-SIM-85 header wrap.** `npm run docs:digest` exits 2 because the header of R-SIM-85 in `docs/decisions.md` wraps before its closing parenthesis. Reflow that header only, text unchanged, so `docs:digest` exits 0. No other row changes.

## DOVE

`properties-with-tree-view.scss` (one line); the shared smoke helper under `frontend/scripts/smoke/` (tracked, one function added); `docs/decisions.md` (R-SIM-85 header lines only); `docs/log-inbox/` one entry; this prompt's Status. Port 3032 only for the verification probe.

## COME

1. Read `CLAUDE.md` and the three places.
2. Each fix, its check (build warning gone; dark crop dark; `docs:digest` exit 0), its commit: `fix: bordr typo in properties-with-tree-view (P-2026-09-28-0055)`, `chore: smoke helper switches the theme the app way (P-2026-09-28-0055)`, `docs: R-SIM-85 header on one line for docs:digest (P-2026-09-28-0055)`.
3. Gates: typecheck same 14, build exit 0, `check:docs`, `check:scripts`, `typecheck:scripts`.
4. One docs closure commit (log entry, Status). `Outcome: done` with the shas.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a simulator or critical-zone file, push, writes in any other tree, ports other than 3032.

## RIFERIMENTI

The log entries of P-2026-09-27-2248, 1647, 1806, 2324, P-2026-09-28-0014, 0023 in `docs/log-inbox/`; `docs/PROTOCOL.md` P13, P16; RC-17, RC-31.
