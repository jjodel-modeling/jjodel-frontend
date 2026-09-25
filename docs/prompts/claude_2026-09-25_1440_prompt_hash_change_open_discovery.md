# Prompt: an in-page hash change between two projects starts no open (discovery)

Prompt-ID: P-2026-09-25-1440
Chat: C-2026-09-25-1353
Lane: fast
Status: da eseguire

Worktree: `~/jjodel-open`. Its branch `open-path` is merged into the trunk (`74ca160e7`) and closed. Setup, in this order, each a hard stop if it fails: `pwd` is `/Users/alfonso/jjodel-open`; `git status` empty; `git switch -c open-hash alfonso-frontend-jjtl` (confirm with `git log -1` that it reads `docs: add prompts P-2026-09-25-1440 and P-2026-09-25-1445`; if the trunk has moved past it, stop and say so). Every commit of this lane goes on `open-hash`. Never work by absolute path on another worktree.

**Parallel lane.** `P-2026-09-25-1445` (the `.[x]` operator discovery) runs at the same time in `~/jjodel-sim`, on another branch and another port. The perimeters are disjoint. Do not touch `~/jjodel-release`, `~/jjodel-sim`, `~/jjodel-gate`, `~/jjodel`, `~/jjodel-harness`, nor any server you did not start.

**Environment (P14, amended in `d2eb241a7`).** This tree has no `node_modules`: create the temporary symlink `frontend/node_modules -> ~/jjodel/frontend/node_modules`, name it in the report, and remove it at the end only because you created it. The Vite cache is per tree (`frontend/.vite-cache`, ignored). Dev server on 3003, from this tree only; check with `lsof -nP -iTCP:3003 -sTCP:LISTEN` that the port is free first.

Two-phase. **This prompt covers Phase 1 only**: read-only on the source, it ends with a saved and committed report and a hard stop. Phase 2 is written in chat from the report and reaches this session as a GO that opens with this ID, and declares its own `Lane:` line. If the Phase 2 proposal touches a critical-zone file (`CLAUDE.md` §3.2; `VersionFixer.tsx` is one), the report carries a Layer Impact Report draft.

## COSA

The high ticket of `P-2026-09-25-0030` (`docs/log-inbox/versionfixer.md` before the fold, now in `docs/claude-code-log.md`; detail in `docs/discovery/discovery_2026-09-25_project_open_path.md`, addendum A4). In an open tab, a hash change from `#/project?id=A` to `#/project?id=B` (address bar, back and forward between two projects) starts no open. `PathChecker` calls `U.resetState` on `pathname` changes only (`PathChecker.tsx:7-14`), and both URLs have pathname `/project`. The store keeps A under B's URL; `LProject.getProject()` reads B from the URL, finds nothing, and `Project.tsx` throws on `project.type`, caught by `Try` with cascading page errors.

Wanted in the end (Phase 2, not now): a change of project id in the URL opens the new project through the same open path that `0609e9793` fixed (one catch in `stateInitializer`, `loadError`, save guard, open counter, `PROJECT_OPEN_CHANGED`), and `Project.tsx` never renders a project that is not the one in the URL.

Hypotheses to falsify, each with evidence:

- **H1.** The project id is the only part of the location that should start an open. List every location change that reaches `/project` (hash edit, back/forward, link from the dashboard, deep link at load, anything else) and which of them start an open today.
- **H2.** Keying the open on the project id (not on `pathname`) is enough, and it does not start a second open where one already runs (deep link at load, dashboard click that already calls the open path). Read how the dashboard opens a project and whether it also changes the hash.
- **H3.** The superseded-open guard of `0609e9793` (the counter) already handles A → B while A is still loading. Measure it with the hash change, not only with `#/allProjects` in between (A4 measured only that form).
- **H4.** The medium ticket on `pointedBy` (addendum A5: `pointedBy` grows by one per in-page reopen and save) comes from the same in-page reset. Say whether the Phase 2 fix of H1-H2 changes it, makes it worse, or leaves it. Its fix is not in scope unless the report shows it falls out of the same change at no extra cost.

Out of scope: any source edit; `VersionFixer` steps; the save format; the examples; the smoke harness; routing outside `/project`.

## DOVE

Phase 1 reads, at least: `PathChecker.tsx` and where it is mounted; `U.resetState` (`joiner`); `LProject.getProject()` and whatever reads the project id from the URL; `frontend/src/pages/Project.tsx` (the `project.type` read); `ProjectLoadingScreen.tsx`; the open path of `0609e9793` in `frontend/src/redux/reducer/reducer.ts` (`stateInitializer`, the counter) and `frontend/src/api/persistance/projects.ts`; the router setup (`HashRouter` or equivalent, `App.tsx`); the dashboard code that opens a project. Read whole functions; the line numbers above come from the 0030 report and may have moved.

## COME

1. **Location map (H1, H2).** A table: navigation kind, what changes (`pathname`, `search`, `hash`), what fires today (`PathChecker`, other effects, the open path), file:line for each hop.
2. **Measure on 3003** with an in-page probe (init script or console wrapper, no source edit): (a) A open, edit the hash to B; (b) A open, back/forward to B; (c) A still loading (throttle or delay the fetch in the probe), hash to B; (d) dashboard → A → dashboard → B, as control, must open B. For each: what the store holds, what the URL says, which component throws, what the user sees. Record verbatim. Font 403s on the dev server are known; note them, do not chase them.
3. **Candidate fix, not applied.** The smallest change that makes (a)-(c) open B through the fixed path, with the files it touches, and for each hypothesis whether it held. Tell which tests would pin it (the 0030 test `frontend/src/components/topbar/__tests__/saveManager_load.test.ts` and its mutant table are the model) and at least four mutants the tests must kill.
4. **Report** in `docs/discovery/discovery_2026-09-25_hash_change_open.md` (the path `docs/discovery/` and the naming `discovery_<date>_<description>.md` are mandatory): objective, files read with full paths, the table of item 1, the measurements of item 2, the candidate of item 3, risks, the H4 answer, open questions for Alfonso numbered Q1.., each with a recommended answer.
5. Commit the report alone: `git commit -- docs/discovery/discovery_2026-09-25_hash_change_open.md`, subject `docs: discovery of the hash change between two projects (P-2026-09-25-1440)`, `Model:` trailer. No log entry and no Status flip in Phase 1: both go in the Phase 2 closure commit (P13, RC-17). Remove the temporary symlink, stop your server on 3003, confirm `git status` empty.
6. **Hard stop.** Closing message opening with `[P-2026-09-25-1440 · session <id>]`: report sha, the answers to H1-H4 in one line each, the questions. Wait.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a source edit, `rm` of a symlink you did not create, push.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14 (amended `d2eb241a7`); `docs/decisions.md` RC-13, RC-17.
- `docs/discovery/discovery_2026-09-25_project_open_path.md`, §8 and addendum A1-A5; code commit `0609e9793`; prompt `docs/prompts/claude_2026-09-25_0030_prompt_project_open_path.md`.
