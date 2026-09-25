# Prompt: project open path, failures that nobody catches (discovery)

Prompt-ID: P-2026-09-25-0030
Chat: C-2026-09-25-0016
Status: eseguito 2026-09-25 · lane open-path · 0609e9793 · verifica visiva passata 2026-09-25

Worktree: `~/jjodel-open`, branch `open-path`, created from the trunk at `2dd17270b` (the harness gate merge). Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-open` on `open-path`, stop and say so; never work by absolute path on another worktree.

Parallel lane: `P-2026-09-25-0016` (harness gate merge) may still be running on the trunk in `~/jjodel-release`. Do not touch `~/jjodel-release`, `~/jjodel-gate`, `~/jjodel-sim`, `~/jjodel`, or `~/jjodel-harness`. Do not commit on the trunk: every commit of this lane goes on `open-path`.

Two-phase. **This prompt covers Phase 1 only**: read-only, it ends with a saved and committed report and a hard stop. Phase 2 is written in chat from the report and reaches this session as a GO that opens with this ID. `VersionFixer.tsx` is in the critical zone (`CLAUDE.md` §3.2); if the Phase 2 proposal touches it, or any D-layer write path, the report carries a Layer Impact Report draft.

## COSA

One ticket joining Q1 and Q5 of `P-2026-09-24-1610` (entry in `docs/log-inbox/versionfixer.md`, first **Ticket** paragraph). When a saved project cannot be loaded, the user sees "Loading Project..." forever. Two classes of failure, measured by 1610:

- A throw in `VersionFixer.update` lands in the `stateInitializer` catch and is logged as `Failed to fetch projects` (`reducer.ts:1578`), a false label.
- A throw inside the `LoadAction` dispatch (`reducer.ts:708`, `:776`, element level `:740`, `:852`, `:930`) is an uncaught page error that no catch sees.
- `ProjectsApi.isLoading` goes false only in `checkLoaded` (`reducer.ts:1529-1538`), so neither class ever ends the loading screen.

Wanted in the end (Phase 2, not now): both classes caught, a message the user can read, the loading stopped, the label corrected, with **one** catch placed upstream of the open path rather than one per site.

Hypotheses this phase must try to falsify, each with evidence:

- **H1.** Every way of opening a project (project list, URL or deep link, import of a file, reload of the current project, offline `localStorage` and online server fetch, anything else found) goes through one function where a single `try/catch` can see both the migration and the dispatch. If there is more than one such entry, list them all.
- **H2.** A `dispatch` that throws inside the reducer propagates synchronously to the caller of `dispatch`, so a catch around the dispatch sees it. Measure it, do not assume it: the reducer may be wrapped (`unsafereducer` inside `reducer`, `reducer.ts:461`) in a way that swallows or rethrows.
- **H3.** After a failed load the store is in a usable state (the previous project or an empty one), so a message plus a return to the project list is enough. If the failure leaves a half-applied state (the `SaveManager.tmpsave` half-migrated of risk 4 in the 1610 report, or a partial `LoadAction`), say what a recovery would need.
- **H4.** No real saved project dies on the reducer path today. Test it against what can be measured: the offline `localStorage` corpus (80 projects on 2026-08-04, `discovery_2026-08-05_legacy_view_census_real_projects.md`) and the code path of server projects. Projects saved between 2024-06-28 and 2024-08-27 carry a `version` but lack `NODES_RECOMPILE_labels` and would die at `reducer.ts:776` (1610 report §6, risk 3).

Out of scope: any code edit; the `VersionFixer` steps; backfilling root fields in the reducer (risk 3 is a finding here, not a fix); the examples of `frontend/src/examples/` (the other ticket of 1610); the smoke harness.

## DOVE

Phase 1 reads, at least: `frontend/src/redux/reducer/reducer.ts` (`stateInitializer`, `checkLoaded`, `LoadAction` handling, the `reducer`/`unsafereducer` wrapper), `SaveManager.ts` (`load`, `tmpsave`), `frontend/src/redux/VersionFixer.tsx` (`update` only, no step), `ProjectsApi` and whatever sets and reads `isLoading`, the component that renders "Loading Project...", every caller of `SaveManager.load` and of `LoadAction`, the routing that opens a project, `App.tsx` (the `ToastProvider` mount at `:121` and any error boundary). Follow the calls; read whole functions, not only the lines cited above, which come from the 1610 report and may have moved.

## COME

1. **Open-path map (H1).** A table: entry point (UI action or route), file:line, the chain of calls down to `VersionFixer.update` and to the `LoadAction` dispatch, sync or async at each hop, and every `try/catch`, `.catch`, error boundary or `window.onerror` on the way. For each catch: what it logs, whether it touches `isLoading`, what the user sees.
2. **Throw propagation (H2).** Measure on a dev server of this worktree, on a free port (3003 suggested; declare the port, and use the P14 temporary `node_modules` symlink, removed at the end). Inject a throw at the two classes of site with an in-page probe (init script or console wrapper, no source edit), open a project by each entry point of item 1 that can be driven, and record verbatim which catch fires, what is logged, and whether the loading screen ends. Fonts in 403 on the dev server are a known environmental failure; note them, do not chase them.
3. **State after failure (H3).** After each probe of item 2: what the store holds, whether navigating back to the project list works, whether a second open of a healthy project works in the same page.
4. **Population (H4).** Static: how an online project is fetched and whether its state goes through the same path. Measured: nothing on the server is reachable from here, so do not try; instead state exactly what a measurement would need. For the offline corpus, the console snippet in the 1610 entry counts by `version.n` in the origin where it runs: report which origin holds the 2026-08-04 corpus (it was a dev session in offline mode) and leave the run to Alfonso as an open question.
5. **Proposal for Phase 2, in prose.** Where the single catch goes (file:line), what it catches, how it ends the loading, the message text and where it renders (`toast` or the loading screen itself), the label fix at `reducer.ts:1578`, what happens to `tmpsave`. Files touched, with the count. A test plan with one mutation per rule: migration throw caught and shown; dispatch throw caught and shown; loading ends in both; a healthy project still opens unchanged; the label no longer says `Failed to fetch projects` for a load failure. If the proposal touches `VersionFixer.tsx` or a D-layer write path, a Layer Impact Report draft.
6. **Baseline gates now**, from `frontend/` with the symlink: `npm run typecheck` (14 expected, the baseline set), `npx vitest run` (report the exact number and the 9 files red at import named in `CLAUDE.md` §17), `npm run build`, `npm run check:docs`.

**Discovery report (mandatory).** Save it as `docs/discovery/discovery_2026-09-25_project_open_path.md` (path `docs/discovery/`, naming `discovery_<YYYY-MM-DD>_<description>.md`). Content: the hypotheses H1-H4 with the verdict and evidence of each (file:line and verbatim quotes), the objective, files read with full paths, the map of item 1 as a table, the probe outputs of item 2 verbatim, findings, dependencies and risks, **open questions for Alfonso first** (at least: message text and placement; whether a failed open returns to the project list; the `localStorage` count), then the Phase 2 proposal of item 5. Commit it alone on `open-path`, pathspec after `--`, subject `docs: discovery on the project open path (P-2026-09-25-0030)`, `Model:` trailer. **Hard stop**: the phase is not complete until the report is on disk and committed. Then report in chat, opening with `[P-2026-09-25-0030 · session <id>]`, and wait.

No log entry in Phase 1. `git status` in `~/jjodel-open` empty at the end (symlink removed, dev server stopped, probes kept outside the tree or deleted).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, commits outside `open-path`, push, any edit to a source file.

## RIFERIMENTI

- `docs/log-inbox/versionfixer.md`, entry of `P-2026-09-24-1610`, first **Ticket** paragraph and the console snippet.
- `docs/discovery/discovery_2026-09-24_versionfixer_old_states.md`, §4 (reducer failures measured), §6 (risks 1-4), §7 Q1.
- `docs/discovery/discovery_2026-08-05_legacy_view_census_real_projects.md` (the offline corpus).
- `CLAUDE.md` §3.2 (critical zone, Layer Impact Report), `docs/PROTOCOL.md` P4 (discovery report), P13, P14.
