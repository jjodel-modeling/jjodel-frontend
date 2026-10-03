# Prompt: fast fix, the run inspector's trace scrolls instead of growing the card

Prompt-ID: P-2026-10-03-1015
Chat: C-2026-10-02-2340
Lane: fast (two files, the inspector's trace list, visual check by the chat). Tier: light.
Status: da eseguire

Worktree: `~/jjodel-w-simtrace`, branch `sim-trace-scroll`, cut by the chat from `alfonso-frontend-jjtl` at `4d190162f`, `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this prompt); if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso, 2026-10-03: in the run inspector (R-SIM-105, R-SIM-106) the trace grows with every step and makes the card grow with it. He wants the latest steps shown and the older ones reachable with a scrollbar.

1. The trace section has a fixed-height scroll area: it shows the latest six steps (newest first, as today) and scrolls for the older ones. Its height does not depend on the number of steps; with fewer than six steps it keeps the same height (no layout shift, CLAUDE.md design rule).
2. The card's height no longer depends on the trace: σ, the concrete section and the trace header stay where they are while the run advances. The card's existing `max-height` stays.
3. When a new step is committed the list stays scrolled to the top (the newest step visible), unless the user has scrolled down to read older steps; then it does not jump.
4. Choosing a past step, from the list or the step dots if any, scrolls that step into view (`block: 'nearest'`), so the highlighted row is never hidden.
5. The step count in the trace header («N steps») stays.

## DOVE

Exactly: `frontend/src/components/editor-v2/sim/SimInspector.tsx`, `frontend/src/components/editor-v2/sim/SimInspector.scss`. Plus the closure docs: this prompt's Status and `docs/log-inbox/simulation.md`.

## COME

1. Read `CLAUDE.md` (design tokens only, BEM, grep before naming any new class), P16, RC-17, RC-23, R-SIM-105, R-SIM-106, and the two files whole. Measure the row height in the probe rather than guessing it; the six-row height is a token or a computed value, not a magic number scattered in rules.
2. Gates in the foreground: `npm run typecheck` (no new errors over §17's baseline), the sim suites and `src/components/editor-v2/viewpoint/ir/__tests__/irActivityRender.test.ts`, `npm run build`.
3. Lane probe at 1600×1000, light theme (`lane-run probe`, port 3072, never 3001; kit `~/.jjodel-lanes/probe-kit/simgate/`, scenes `~/jjodel-demo-exports/`): on DemoESM run 12 steps with the inspector open; measure the card's height at step 2, 6 and 12 (must be equal from step 1 on) and the trace area's scrollHeight vs clientHeight; view step 1 and check it is scrolled into view. Crops as gitignored `docs/discovery/harness/_tmp_simtrace_*.png` at step 3 and step 12 (scrolled and viewed).
4. Commits: code, then the closure docs commit. Stop with `Outcome: hard-stop` for the chat's visual check, with the shas, the three heights and the crops' paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, a critical-zone file.

## RIFERIMENTI

R-SIM-105, R-SIM-106; Lane C P-2026-10-03-0120 (the inspector); its merge P-2026-10-03-0345.
