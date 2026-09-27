# Prompt: `validateProfile` rejects a derived role whose source role is off

Prompt-ID: P-2026-09-27-1437
Chat: C-2026-09-27-1428
Lane: fast (one additive defect code in the profile validator, engine only, unit tests; no visual check)
Status: eseguito 2026-09-27 · lane sim-validate-profile-from · 6ade65d90

Worktree: `~/jjodel-open` (moved from `~/jjodel-gate`, taken by lane P-2026-09-27-1440 of the sibling chat while the first run started; that run stopped blocked at 0 min), branch `sim-validate-profile-from` (cut by the chat from `alfonso-frontend-jjtl` at `86520a8f3`, the trunk with the `harness-lanerun-wait` merge), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-open`, branch `sim-validate-profile-from`, `git log -1` is the docs commit whose subject starts with `docs: P-2026-09-27-1437 moves to ~/jjodel-open`; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Ticket of `docs/log-inbox/simulation.md` (M3 closure, priority medium): `validateProfile` in `frontend/src/model/simulation/simProfiles.ts` accepts a user profile in which a role is `derived` with `from: <role>` while that source role is `off`. Example: Initial `off` and Initial marking `{ mode: 'derived', from: 'initial' }`. The profile passes validation and the binding is then not checkable on a complete bag. `docs/discovery/discovery_2026-09-27_sim_profiles_panel.md` §6.2 measured it: 0 of the 8 system profiles hit it, the ticket's profile does. The ticket was owed to the modal lane that brings user profiles; chat decision, unattended (RC-25): taken now as its own fast lane because the fix is additive, engine only and disjoint from every other open lane, and it closes a silent acceptance before the freeze.

Fix, in the role loop of `validateProfile`, next to the existing `derivedWithoutSource` check: when `mode.mode === 'derived'` and `mode.from !== undefined` and the source role is not active (`profile.modes[mode.from].mode === 'off'`), push a defect with a new code `derivedFromOff`, `roles: [r, mode.from]`, message `` `${label(r)} is derived from ${label(mode.from)}, which is off` ``. Add the literal `'derivedFromOff'` to the `ProfileDefectCode` union (additive, Rule 11). A role that is both `derived` with `from` and whose source is active raises nothing new. Do not touch the `derivedWithoutSource` branch, the closure checks, `dependsOn`, the name checks, or the order of the existing defects.

## DOVE

- `frontend/src/model/simulation/simProfiles.ts`: the `ProfileDefectCode` union (one literal) and the role loop of `validateProfile` (one `if`); nothing else.
- `frontend/src/model/simulation/__tests__/simProfiles.test.ts`: two new `it` cases next to the existing `derivedWithoutSource` case (around line 204): (a) a user profile with `initial` off and `initialMarking` derived from `initial` yields exactly `[['derivedFromOff', 'initialMarking', 'initial']]` plus whatever the existing checks already report for `initial` off (assert the `derivedFromOff` entry is present with those roles and that no `derivedWithoutSource` entry appears); (b) the same profile with `initial` active yields no `derivedFromOff` entry. Keep every one of the 34 existing cases untouched.
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.

Out of scope: `profileCodec.ts`, `roleCatalog.ts`, `simBridge.ts`, `SimulationPanel.tsx`, every SCSS file, `docs/decisions.md`, `docs/PROTOCOL.md`, the discovery reports. No UI change: the panel already lists defects by message.

## COME

1. Baseline from `frontend/`: vitest on `src/model/simulation` (count and 0 failed); typecheck.
2. Read `simProfiles.ts` whole before editing; confirm that `profile.modes[mode.from]` is always defined for a `RoleId` (it is a total record) and that no `switch` over `ProfileDefectCode` with an exhaustive `never` exists in `frontend/src` (`grep -rn "ProfileDefectCode" frontend/src`; today only `simProfiles.ts` names it). If a consumer switches exhaustively, stop with `Outcome: question` and a `Recommended:` line.
3. The two edits, minimal diffs, no rename.
4. Gates: typecheck; vitest green, baseline count plus 2; build exit 0; `check:docs`; `check:scripts`.
5. Two commits, pathspec after `--`: code and test, subject `fix(sim): validateProfile rejects a derived role whose source is off (P-2026-09-27-1437)` or, if over 72 once the Prompt-ID suffix is dropped, `fix(sim): derived role with an off source is a defect (P-2026-09-27-1437)`, body naming the ticket, the new code and the two tests; then the docs commit with the log-inbox entry and the Status flip of this prompt (`eseguito 2026-09-27 · lane sim-validate-profile-from · <code sha>`), subject `docs(sim): log entry and Status flip for P-2026-09-27-1437`.
6. `Outcome: done`, shas on the line above, and below it the vitest counts before and after.

Stop with `Outcome: question` and a `Recommended:` line if the source lookup cannot be typed without a cast, or if an existing test asserts the exact defect list of a profile that now also raises `derivedFromOff` (say which test; recommended answer: extend that expectation, do not weaken the check).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone file, push, any other tree.

## RIFERIMENTI

- `docs/log-inbox/simulation.md`, the M3 ticket on `validateProfile`; `docs/discovery/discovery_2026-09-27_sim_profiles_panel.md` §6.2 and H7.
- `docs/decisions.md` R-SIM-28, R-SIM-56 (derived roles and system profiles); Rule 11 (additive literals).
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-25, RC-26.
