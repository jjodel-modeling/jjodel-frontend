# Prompt: R1, event labels fall back to the instance name (G1 of the demo readiness report)

Prompt-ID: P-2026-09-27-1105
Chat: C-2026-09-26-1702
Lane: fast (one pure helper and its tests; no panel change, no critical zone; a probe re-run replaces the visual check)
Status: da eseguire

Worktree: `~/jjodel-icons`, branch `sim-r1-labels` (cut by the chat from `simulation-engine` at `54999f9ae`, which holds the trunk with 0935 and the rows R-SIM-80..82), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-icons`, branch `sim-r1-labels`, `git log -1` is the commit that adds this file (its parent `54999f9ae`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*` and the untracked `frontend/c2p_*.png` screenshots of an earlier lane (leave them). Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1105 · session <id>]` and ends with a bare `Outcome:` line, the sha on the line above. Run gates in the foreground.

## COSA

R-SIM-80 (ratified 2026-09-27, decision A of `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md` §10): on the PEST shape the event buttons and the «Last step» line read `…_136` instead of `coin`, because `objectLabel` in `frontend/src/model/simulation/objectSlots.ts` looks for a slot of an attribute named `name` and, when the Event class has none, returns `shortId(objectId)` (report §5 G1, `objectSlots.ts:72`). After this lane the label falls back to the instance's own name in the lookup (`lookup[objectId].name`, the name every DObject carries) before `shortId`, so the SM demo's only input buttons are readable without touching the demo metamodel.

## DOVE

- `frontend/src/model/simulation/objectSlots.ts`: `objectLabel`, one fallback added between the slot search and `shortId`; a non-empty string only (trim), otherwise `shortId` as today.
- Tests: the existing test file of `objectSlots.ts` (find it with `grep -rl objectSlots frontend/src --include=*.test.ts`); if none tests `objectLabel`, add the cases to `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts` where the event labels are asserted (`grep -n 'events' simBridge.test.ts`). Cases: an Event with a `name` attribute keeps the slot value; an Event without it and with a lookup name gives that name; without both gives the short id; an empty or whitespace lookup name gives the short id.
- `docs/log-inbox/simulation.md`: one entry. This prompt's Status flip.

Out of scope: every other file. `simBridge.ts` is not touched (the label is read through the helper).

## COME

1. Baseline from `frontend/`: `npx vitest run src/model/simulation src/components/editor-v2/sim` count, 0 failed; `typecheck` exit 2 with the 14 of §17.
2. Red first (the lookup-name case), then the fallback, then green with the count plus the new cases.
3. Re-run the readiness probe of the State machine scenario, which the report left gitignored in `~/jjodel-sim/frontend/scripts/smoke/_tmp_demo_sm.ts` (with `_tmp_demo_common.ts` or whatever it imports, read `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md` §3 and §12 for the files and the port rule): copy those files read-only into this tree's `frontend/scripts/smoke/` as `_tmp_r1_*`, start a dev server from this tree on a free port at or above 3007 (never 3001-3006; check `lsof`), run it, and read `"events":["coin", …]` where the report read `"…_136"`. Stop the server. If the probe cannot be copied or run, say why and stop with `Outcome: question` and a `Recommended:` line.
4. Gates: typecheck 14; vitest green; `build` exit 0; `check:docs` 4/4; `check:scripts` PASS.
5. Code commit, pathspec after `--`, subject `fix(sim): event labels fall back to the instance name (P-2026-09-27-1105)`; body with G1, R-SIM-80, the probe reading, `Model:` trailer. Docs commit: inbox entry (`Smoke visivo: probe SM re-run, events read by name; no visual change beyond the labels`), Status flip `eseguito 2026-09-27 · lane sim-r1-labels · <code sha>`; subject `docs: close R1, event labels (P-2026-09-27-1105)`.
6. `Outcome: done`, shas on the line above. The merge into `simulation-engine` and the trunk gets its own prompt (`lane-run merge` when v2 is on the trunk).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a panel or engine file, push, any other tree except the read-only copy of the `_tmp_demo_*` probes from `~/jjodel-sim`.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md` §4.3, §5 G1, §8 R1, §10 A; `docs/decisions.md` R-SIM-80, R-SIM-62 (texts).
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-25..30.
