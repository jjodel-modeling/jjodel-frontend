# Prompt: F2, Cmd+S saves the live project, not a stale copy
Prompt-ID: P-2026-09-29-2120
Chat: C-2026-09-29-1840
Lane: fast (Phase 2; persistence API; no critical zone). Tier: heavy.
Status: da eseguire
Worktree: `~/jjodel-w-livesave`, branch `live-save` (cut by the chat from `alfonso-frontend-jjtl` at `5626b3364`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-livesave`, branch `live-save`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-2120 · session <id>]` and ends with an `Outcome:` line (P16).

## COSA

Alfonso ratified on 2026-09-29 the Phase 2 lane F2 of the discovery `docs/discovery/discovery_2026-09-29_ir_authoring_freeze.md` (branch `ir-freeze-disc`, commit `a50fa6607`; read it with `git show a50fa6607:docs/discovery/discovery_2026-09-29_ir_authoring_freeze.md`), side finding 1: the Cmd+S handler holds the `LProject` of Navbar's last render (`Navbar.tsx:564`, effect deps `:1300`), `ProjectsApi.save` copies `project.__raw` (`api/persistance/projects.ts:125`) and `U.compressedState` writes that copy over the live project entry (`common/U.tsx:437`). Measured: `+ New` viewpoint then Cmd+S saves `project.viewpoints` with 5 entries against 6 live; after a reload the viewpoint is in the root `viewpoints` but not in `project.viewpoints`. This is data loss.

Fix: `save` reads the live project, `store.getState().idlookup[project.id]`, instead of `project.__raw`; the VER2 realignment stays as it is. Touch `Navbar.tsx` only if the evidence says the stale reference also matters elsewhere on the save path, and say why.

## DOVE

- `frontend/src/api/persistance/projects.ts` (the fix); `frontend/src/pages/components/Navbar.tsx` only as above.
- A test: a vitest over the pure part if it can be imported; `window` is not defined through `joiner`, so if it cannot, declare the gap and prove the fix with a lane probe instead (`lane-run probe`, port 3057, never 3001), replaying the discovery's side-finding probe (`frontend/scripts/smoke/_tmp_irfreeze_side.ts` on `ir-freeze-disc`: copy it into this tree as a gitignored `_tmp_*`): 5/6 before the fix, 6/6 after.
- Log entry in `docs/log-inbox/` (the file that fits the persistence area; say which) and this prompt's Status.

## COME

1. Read `CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20, RC-21, and the discovery §0 and §6.
2. Red first: the probe (or test) fails on the current code; record the numbers.
3. The fix, minimal diff, no refactor, no renamed identifier.
4. Gates from `frontend/`: typecheck at the §17 baseline, `typecheck:scripts` exit 0, vitest 0 failed (state the expected total before running), build ok. The probe 6/6.
5. Commits: `fix(persistence): save the live project on Cmd+S (P-2026-09-29-2120)` with the code and test only; then one docs commit with the log entry and the Status line `eseguito <date> · lane live-save · <fix sha> · non fuso`. Pathspec after `--`.
6. Stop with `Outcome: hard-stop`, the shas, the red/green numbers.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file.

## RIFERIMENTI

- Discovery `a50fa6607` §0 side finding 1 and §6 F2; `docs/PROTOCOL.md` P9, P14, P16.
