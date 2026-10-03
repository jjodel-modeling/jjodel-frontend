# Prompt: simulation UI polish (role tags, roles counter, state heading, initial value on role switches)

Prompt-ID: P-2026-10-03-1630
Chat: C-2026-10-03-1610
Lane: full (five small fixes in the simulation UI, tests first, lane probe; visual check by the chat). Tier: heavy (RC-32 default). Model: the default of `.claude/settings.json`, no deviation.
Status: da eseguire

Worktree: `~/jjodel-w-simpolish`, branch `sim-polish`, cut by the chat from `alfonso-frontend-jjtl` at `d2a1866b6`, `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this prompt); if any differs, stop with `Outcome: blocked`.

## COSA

Five defects, all inside the simulation UI. The first four were found by the chat's walks on port 3001 on 2026-10-02; the fifth was decided by Alfonso on 2026-10-03 (ticket of chat C-2026-10-03-1520). Alfonso asked on 2026-10-03 to run them now, before the MODELS demo; the demo shows this UI, and that change is authorised.

1. **Long role tags truncate** in the Simulation roles window (`SimRolesModal.tsx` and `SimRolesModal.scss`). A long role tag is cut with an ellipsis and its full text is not reachable. Fix: the tag shows its full text, wrapping inside its cell or growing the column within the modal width, with no layout shift of the other rows; if a cut is unavoidable at some width, the full text is in a `title` tooltip. Measure the widest tag of the eight system profiles and of the four demo scenes and say which rule you applied.
2. **The roles counter does not move after manual choices.** The line `N of M roles matched` (`SimRolesModal.tsx` about line 980) counts only the automatic proposal of `profileBinder.ts`; after the user assigns or clears a role by hand it stays where it was. Fix: the counter reads the roles assigned now, whatever their origin. Decide whether the wording still fits (`N of M roles assigned` if the count is no longer «matched») and say which one you kept and why.
3. **«Marking» shown on a state machine.** The heading `Marking` (`SimInspector.tsx` about line 315, `SimulationPanel.tsx` about line 1017) is Petri vocabulary (R-SIM-21..26). Fix: the heading follows the profile of the run: `Marking` for the Petri profiles, `Configuration` for state machines, statecharts, automata, flowcharts and activities (the spec `docs/spec/claude_spec_2026-09-13_computational_model.md` names the state of a run a configuration). One helper, tested, used by both places. If another place shows the same word for a non-Petri profile, list it and fix it the same way.
4. **Derived to stored leaves the initial empty.** Switching a state attribute row from derived (equation) to stored leaves `initial` empty (`formPatch` in `simInputs.ts`). Fix: the row takes `defaultInitialOf(domain)` from `stateAttributesCodec.ts` (P-2026-10-03-1520, merged as `f614230e8`).
5. **Presentation to semantic keeps a stale initial.** Switching a row from presentation to semantic keeps an initial that may not belong to the row's domain. Fix: the initial follows `initialFollowingDomain` as in P-2026-10-03-1520 (kept when it is a value of the domain and was typed by the user, else the default). Derived and input rows keep having no initial (R-SIM-72, R-SIM-88).

No migration of stored records (Alfonso, 2026-10-03: `netCompile.ts` already reports out-of-domain initials).

## DOVE

Exactly: `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `SimRolesModal.scss`, `SimInspector.tsx`, `SimulationPanel.tsx`, `simInputs.ts`, a new helper file under `frontend/src/components/editor-v2/sim/` or `frontend/src/model/simulation/` if point 3 needs one (grep the name first), and their tests under the matching `__tests__/`. A file outside `editor-v2/sim/` and `model/simulation/`: stop with `Outcome: question`. Lane P-2026-10-03-1304 (another chat, branch `derived-notations-edges`) is running on `viewpoint/`, `edges/` and `utils/`; never touch those folders. Plus the closure docs: this prompt's Status and `docs/log-inbox/simulation.md`.

## COME

1. Read `CLAUDE.md` (sections 5, 6, 17, 21.2), P16, RC-17, RC-21, RC-23, RC-25, R-SIM-19, R-SIM-21..26, R-SIM-47..55, R-SIM-72, R-SIM-88, R-SIM-94, the prompt `docs/prompts/claude_2026-10-03_1520_prompt_sim_initial_default.md`, and the files of DOVE whole.
2. Tests first: the counter after a manual assign and after a manual clear; the heading helper on every system profile; `formPatch` derived to stored on boolean, range and enum; presentation to semantic with an initial inside and outside the domain. Red before the fix.
3. Implement. Gates in the foreground: `npm run typecheck` (no new errors over the §17 baseline), the sim and simulation suites, `npm run build` exit 0. Mutation bench on the heading helper and the counter (each mutant killed or explained).
4. Lane probe at 1600×1000, light theme, then dark (`lane-run probe`, port 3076, never 3000, 3001 or 3003; kit `~/.jjodel-lanes/probe-kit/simgate/`, scenes `~/jjodel-demo-exports/`, never written): DemoESM metamodel, Simulation roles: crop the longest tag, assign one role by hand and crop the counter, clear it and crop again; run DemoESM and DemoPetri models: crop the state heading of each (`Configuration`, `Marking`); a state attribute row switched derived to stored (crop, default initial shown) and presentation to semantic with an out-of-domain initial (crop). Crops in `~/.jjodel-lanes/P-2026-10-03-1630/`. The four demo scenes open with no console error.
5. Commits: `fix:` code and tests (one per concern is fine), then the closure docs commit (Status flip with lane, shas, gates and the probe's outcome; log inbox entry); stage by explicit path. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso» (RC-26). Stop with `Outcome: hard-stop` for the chat's visual check, with the shas and the crops' paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, a critical-zone file, removing the `frontend/node_modules` link.

## RIFERIMENTI

R-SIM-19, R-SIM-21..26, R-SIM-47..55, R-SIM-72, R-SIM-88, R-SIM-94; P-2026-10-03-1520 (same lane shape, `defaultInitialOf`); walks of 2026-10-02 in `sessione_CORRENTE.md`, section of chat C-2026-10-01-2220.
