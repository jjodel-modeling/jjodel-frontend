# Prompt: the choice list is named a nondeterministic choice

Prompt-ID: P-2026-09-29-1221
Chat: C-2026-09-28-1936
Lane: fast (one component, its style if needed, its tests, the demo script lines). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-nondet`, branch `sim-nondet-label` (cut by the chat from `alfonso-frontend-jjtl` at `12ac29f74`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-nondet`, branch `sim-nondet-label`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

In the simulation panel, when more than one transition is enabled, a list opens under the heading «CHOOSE A TRANSITION (ε)» (the `(ε)` is the event; with an input event it shows that event). Alfonso, 2026-09-29, wants the list named for what it is:

- heading: «Nondeterministic choice (<event>)», rendered uppercase by the existing heading style, so `NONDETERMINISTIC CHOICE (ε)`;
- under it, one line «Choose a transition» in the panel's secondary text (11 px, the existing secondary class; grep, do not invent a class);
- options, Cancel and everything else unchanged.

The list's extra line must not push the Step button or the status row out of their measured positions in a way that breaks the no-layout-shift rule of the panel: measure before and after; if the list grows by one line, say by how much and whether anything below it moves while the list is open (it already takes space; only the open state changes).

Record a row **R-SIM-98** in `docs/decisions.md` after R-SIM-97, header exactly: `- **R-SIM-98** (2026-09-29, ratified by Alfonso 2026-09-29, evidence: read, verified: none, reversible: branch).` Body: the new heading and subline.

Update `docs/demo/models_2026_simulator_demo.md` wherever it quotes «Choose a transition» / «CHOOSE A TRANSITION» (grep), with the measured text.

## DOVE

- The component that renders the choice list (grep `CHOOSE A TRANSITION`, `Choose a transition`), its tests; its SCSS only if needed; `docs/decisions.md` (the row, add-only); the demo script lines.
- Closure: `docs/log-inbox/simulation.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (Rule 11, §21.2, SCSS and naming), `docs/PROTOCOL.md` P16, RC-20, RC-33, RC-34, R-SIM-97.
2. Test first (red, then green): the heading text for an ε list and for an input-event list; the subline; nothing else in the list changes.
3. Gates: `npm run typecheck` (14, the known set), the sim vitest folders green, full vitest with the 9 known reds only, `npm run build`, `check:docs` 4/4, `check:addonly`.
4. A lane probe on port 3051 (`lane-run probe`, never 3001), light theme. The simulation pill now needs Advanced mode and a Semantic type (R-SIM-97): use the probe in `~/.jjodel-lanes/probe-kit/simgate/` (copy it into `scripts/smoke/`, gitignored `_tmp_*`) for the setup. Petri scene: open the list at step 1, read heading, subline, options; measure the list's height and the Step button's top, before and after the change; crop at `sips -Z 600` under `docs/discovery/harness/_tmp_nondet_*.png` (gitignored).
5. One code commit, one docs commit (row, demo lines, log entry, Status). Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff and the measurements.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, `netStep.ts`, `netCompile.ts`.

## RIFERIMENTI

- R-SIM-97; the demo script §2.2.
