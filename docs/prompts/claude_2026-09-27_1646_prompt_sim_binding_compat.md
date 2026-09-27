# Prompt: S11a, the binding compatibility check as a pure module

Prompt-ID: P-2026-09-27-1646
Chat: C-2026-09-27-1437
Lane: fast (two new files, a pure function and its tests; nothing imports it yet; no visual check)
Status: eseguito 2026-09-27 · lane sim-binding-compat · 3d44abce0

Worktree: `~/jjodel-sim`, branch `sim-binding-compat` (cut by the chat from `alfonso-frontend-jjtl` at `bbd9b7142`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-sim`, branch `sim-binding-compat`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Wave 1, lane 2 of the backlog report (P-2026-09-27-1625), item S11a: `BindingVerdict` exists and nothing produces it. Write `bindingVerdicts(profile, bag, sketch)` as a pure function that says, for each role of the profile, which candidates of the sketch are compatible with it, as the report specifies. It is not wired into the panel: S11 (compatible candidates only in the binding dropdowns) and the modal lane will use it later. Read the report with `git show simulation-engine:docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md` (§4.2 S11, S11a; §5 wave 1).

## DOVE

- `frontend/src/model/simulation/bindingCompat.ts` (new; verify with a global grep that the file name and the exported identifiers are free).
- `frontend/src/model/simulation/__tests__/bindingCompat.test.ts` (new).
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.

Out of scope: every existing file under `frontend/src` (including `SimulationPanel.tsx`, `simRoleStatus.ts`, `simProfiles.ts`, `roleCatalog.ts`: read only), `docs/decisions.md` except a new provisional R- row if the report asks for one.

## COME

1. Read `CLAUDE.md`, the report sections, `BindingVerdict`'s declaration and every type the function reads.
2. Tests first (red: the module does not exist), then the module, then green.
3. Mutation bench: at least five mutants of the verdict logic, each killed; say the count.
4. Gates from `frontend/`: typecheck (14 known errors), vitest on `src/model/simulation` (baseline plus the new tests), build exit 0, `check:docs`, `check:scripts`.
5. Commits: code and tests, `feat(sim): binding compatibility verdicts as a pure module (P-2026-09-27-1646)`; then the docs commit with the log entry and the Status flip.
6. `Outcome: done` with the shas, the counts and the mutant count.

Stop with `Outcome: question` and a `Recommended:` line if `BindingVerdict`'s shape cannot express the report's verdicts without changing an existing exported type.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, an existing source file, a critical-zone file, push, writes in any other tree.

## RIFERIMENTI

- Backlog report (above) §4.2, §5; `discovery_2026-09-27_sim_profiles_panel.md`; `docs/decisions.md` R-SIM-78..80; Rule 11.
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-22, RC-25.
