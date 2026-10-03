# Prompt: fast fix, a state attribute's initial value follows its domain

Prompt-ID: P-2026-10-03-1520
Chat: C-2026-10-03-1520
Lane: fast (one pure helper with its tests, the declaration editors that change a domain; visual check by the chat). Tier: light.
Status: eseguito 2026-10-03 · lane sim-initial-default · 777a5da2f · `defaultInitialOf` and `initialFollowingDomain` in `stateAttributesCodec.ts` (pure, tested), `patchOf` in `SimRolesModal.tsx` uses them (the model's State dialog shares it through `Declarations`; `simBridge.ts` untouched, new rows stay boolean `false`); typecheck 14 (the §17 set), sim and simulation suites 1022/1022, build exit 0, mutation bench 12/12 killed, lane probe on 3075 (light, 1600×1000, DemoESM) 17 PASS 0 FAIL: range 0..100 shows 0, min 5 shows 5, typed 7 kept at min 2, enum A, B shows A, boolean shows false, the model's State dialog follows too; crops `~/.jjodel-lanes/P-2026-10-03-1520/` · verifica visiva della chat in attesa (RC-23) · non fuso
Worktree: `~/jjodel-w-siminit`, branch `sim-initial-default`, cut by the chat from `alfonso-frontend-jjtl` at `cceec3f05`, `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this prompt); if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso, 2026-10-03: in the simulation configuration every state attribute starts at `false`, whatever its domain. A row declared `coins`, Global, stored, semantic, `range 0..100` shows `false` as its initial value. Read on the trunk at `cceec3f05`: a new row is created as `{ domain: { kind: 'boolean' }, initial: 'false' }` (`SimRolesModal.tsx` about line 671, `simBridge.ts` about line 202), and `patchOf` (`SimRolesModal.tsx` about line 177) replaces the domain on a `kind`, `min`, `max` or `literals` edit without touching `initial`. The stale `false` survives the switch to range or enum.

The rule, decided by Alfonso:

1. The default initial value of a domain is: boolean, `false`; range, its minimum written as a JjEL integer literal (`0` for `0..100`, `-3` for `-3..5`); enum, its first literal as a bare identifier (`A` for `A, B, C`), the text `parseInitialLiteral` in `stateAttributesCodec.ts` already accepts; an enum with no literals yet, the empty string (the row stays a defect until literals exist, as today).
2. A pure exported helper `defaultInitialOf(domain)` in `frontend/src/model/simulation/stateAttributesCodec.ts` gives that text (grep the name first; additive export only, no change to existing signatures or to the encoder's output for unchanged rows).
3. In every declaration editor that changes a domain (the metamodel's Simulation roles table in `SimRolesModal.tsx`, and the model's globals dialog of R-SIM-94 if it edits domains through its own code): a `kind` change sets `initial` to the new domain's default; a `min`, `max` or `literals` edit sets `initial` to the new default when the current initial is not a value of the new domain or equals the previous domain's default (so a value the user typed inside the domain is kept). A derived row (equation) and an input row keep having no initial (R-SIM-72, R-SIM-88): the patch never adds `initial` to them.
4. A new row stays boolean with `false`, as today.
5. Not in this lane: no new codec defect for a stored initial outside its domain, no migration of stored records. Report instead, read only, whether any of the four demo exports in `~/jjodel-demo-exports/` carries a record whose initial is outside its domain (name, file, domain, initial), and what the run does today with such a record (one sentence, read in the code, not guessed).

## DOVE

Exactly: `frontend/src/model/simulation/stateAttributesCodec.ts` and its test `frontend/src/model/simulation/__tests__/stateAttributesCodec.test.ts`; `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`; `frontend/src/components/editor-v2/sim/simBridge.ts` and the component of the model's globals dialog only if point 3 needs them (grep `kind: 'range', min:` and `case 'kind'` under `frontend/src/components/editor-v2/sim/` and list what you found in the report). A file outside `editor-v2/sim/` and `model/simulation/`: stop with `Outcome: question`. Plus the closure docs: this prompt's Status and `docs/log-inbox/simulation.md`.

## COME

1. Read `CLAUDE.md` (sections 3, 5, 6, 17, 21.2), P16, RC-17, RC-21, RC-23, R-SIM-19, R-SIM-67, R-SIM-72, R-SIM-88, R-SIM-94, and the files whole.
2. Tests first, in `stateAttributesCodec.test.ts`: `defaultInitialOf` on boolean, a range with min 0, a range with a negative min, an enum with literals, an enum with none; each default parses with `parseInitialLiteral` (except the empty enum). If `patchOf` can be exported for tests without changing its behaviour, export it and test the four edits of point 3 (kind to range, kind to enum, min edit with the old default, min edit with a typed value inside the range); otherwise say why in the report.
3. Implement. Gates in the foreground: `npm run typecheck` (no new errors over §17's baseline), the sim and simulation suites, `npm run build` exit 0.
4. Lane probe at 1600×1000, light theme (`lane-run probe`, port 3075, never 3000, 3001 or 3003; kit `~/.jjodel-lanes/probe-kit/simgate/`, scenes `~/jjodel-demo-exports/`, never written): import DemoESM, open its metamodel's Simulation roles, add a state attribute, switch it to range, set min 0 and max 100: crop the row (initial shows `0`); set min 5: crop (`5`); type `7` as initial then set min 2: crop (`7` kept); switch to enum with literals `A, B`: crop (`A`); back to boolean: crop (`false`). Crops in `~/.jjodel-lanes/P-2026-10-03-1520/`.
5. Commits: `fix:` code and tests, then the closure docs commit (Status flip with lane, shas and the probe's outcome, log inbox entry); stage by explicit path. Stop with `Outcome: hard-stop` for the chat's visual check, with the shas, the files found in point 3, the demo-exports finding of point 5 and the crops' paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, a critical-zone file.

## RIFERIMENTI

R-SIM-19 (state attribute declarations), R-SIM-67/68 (codec), R-SIM-72 (derived rows), R-SIM-88 (inputs), R-SIM-94 (the model's globals); lane C1 and C2 of the simulator; P-2026-10-03-1420 (the last sim panel fix, same lane shape).
