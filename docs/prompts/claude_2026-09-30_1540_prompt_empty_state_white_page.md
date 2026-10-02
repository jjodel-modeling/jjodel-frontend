# Prompt: Phase 1 and 2 in cascade, a project saved with an empty state opens to a white page

Prompt-ID: P-2026-09-30-1540
Chat: C-2026-09-30-1458
Lane: Phase 1 then Phase 2 in cascade. Tier: heavy.
Status: eseguito 2026-09-30 · lane empty-state-guard · 28a98534e · non fuso

Worktree: `~/jjodel-w-emptystate`, branch `empty-state-guard`, created from the trunk at `ecbc0e92c`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-emptystate`, branch `empty-state-guard`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Measured by the chat on 2026-09-30 in Alfonso's Chrome, 3001, trunk `ecbc0e92c`. The project «DemoESM copy» (`Pointer1790629757416_USER_177`, imported 2026-09-28 23:09 from `~/jjodel-demo-exports/scene_3_DemoESM.jjodel`) has `state: ""` in `localStorage['projects']`, with `lastModified` 2026-09-28 23:46 and `metamodels`/`models` still listing pointers. Opening it leaves `#root` empty: `project.metamodels` points to `Pointer1790629757427_USER_179`, absent from `idlookup`; `LeftBar` (`pMetamodels.map(m => ({ id: m.id ... }))`) and `ProjectEditor` (`.name` of undefined) throw, `TryComponent.componentDidCatch` loops into «Maximum update depth exceeded», and React unmounts the tree. Two other entries have `state` empty but were never saved after creation («Display MM», «UML2»).

Two defects:

1. **Write side.** Something saved an empty state over a project that had content. The save of 28/9 23:46 predates the live-save fix (`9ef223452`, 2026-09-29, `projectsSaveLive.test.ts`). Establish whether an empty state can still be written on today's trunk, by which path (Cmd+S, autosave, tab close, project switch), and guard it: a save never writes an empty or unparsable state over a stored non-empty one; it refuses, keeps the stored copy and says so (toast, and the console).
2. **Read side.** A project whose state is empty or does not load opens the existing error screen (`fix(redux): a project that cannot be opened shows an error screen`, grep the commit), never a white page; the pointer lists tolerate a missing target instead of throwing (`LeftBar`, `ProjectEditor`, filter out the absent ones); `TryComponent` must not loop on `componentDidCatch`.

No migration and no automatic repair of stored projects: a damaged project stays as it is, readable by the error screen.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-09-30_empty_state_white_page.md`: the save paths and which can emit `state: ""`, with a reproduction on today's trunk or the evidence that none exists; the load path of `state`; the files and lines for both fixes; questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade, unless a question has no single recommendation, the fix needs a critical-zone file (`useJjomSync.ts`, `canvasToJjom.ts`, `portDistribution.ts`), or it leaves the files below.

Phase 2: `frontend/src/api/` (the project save and load), `frontend/src/pages/components/LeftBar.tsx`, `frontend/src/components/project/ProjectEditor.tsx` (only the pointer lists), `frontend/src/components/forEndUser/Try.tsx` (only the loop), the error screen's component, their tests; a log entry in `docs/log-inbox/` (the inbox of persistence, grep which), this prompt's Status. Anything else: stop and ask.

## COME

1. Read `CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, the live-save discovery and `projectsSaveLive.test.ts`.
2. Phase 1 report, committed.
3. Tests first: a save with an empty serialization over a non-empty stored state is refused and the stored copy is unchanged; a first save of a new empty project still works; opening a project with `state: ""` renders the error screen (no throw from `LeftBar` or `ProjectEditor`); `TryComponent` catches once. Mutation bench on the guard; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme, a seeded project with `state: ""`: the error screen, crop under `frontend/scripts/smoke/_tmp_emptystate_crops/`; the four demo scenes open and run as before.
6. Commits: `fix:` code and tests, `docs:` report, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the questions adopted.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, touching Alfonso's browser storage, a call to an AI model.

## RIFERIMENTI

`9ef223452` (live-save merge); `frontend/src/api/__tests__/projectsSaveLive.test.ts`; `~/jjodel-demo-exports/scene_3_DemoESM.jjodel`.
