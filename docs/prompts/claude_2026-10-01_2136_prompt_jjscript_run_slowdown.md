# Prompt: JjScript Run slows down run after run, attribute the main-thread cost of each dispatch

Prompt-ID: P-2026-10-01-2136
Chat: C-2026-10-01-1725
Lane: full (two-phase: Phase 1 measures and attributes, Phase 2 after the chat's GO, same session). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-runperf`, branch `jjscript-run-perf` (cut by the chat from `alfonso-frontend-jjtl` at `ac3890b7e`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-runperf`, branch `jjscript-run-perf`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso, 2026-10-01: the first script runs fast; if he runs more, each one gets slower. MODELS demo is on 2026-10-07, merges until then.

The chat measured it on `localhost:3001` (trunk at `ac3890b7e`), built-in browser, one project, the same 16-line script (7 classes, 4 attributes, 5 references, one forward reference) injected as a scoped Jjodie reply and run with Run, prefix changed each time. Figures from the `TEMP-DISCOVERY` lines already in the tree (`[JjScript-TIMING]` of `ScriptBlock.tsx` and of `executor.ts`):

| run | target | objects in store | wall to summary | DOM nodes | JS heap |
|---|---|---|---|---|---|
| 1 | metamodel_1 | 52 | 1.8 s | 2 049 | 480 MB |
| 5 | metamodel_1 | 176 | 1.8 s | 4 931 | 551 MB |
| 8 | metamodel_1 | 276 | 3.4 s | 7 219 | 859 MB |
| 11 | metamodel_1 | 372 | 5.8 s | 9 435 | 1 221 MB |
| 14 | metamodel_2 (new, empty) | 473 | 10.3 s | 9 936 | 1 275 MB |
| 16 | metamodel_2 | 537 | 11.9 s | 11 413 | 599 MB |
| 17 | metamodel_2, Jjodie chat emptied first | 569 | 6.0 s | 11 099 | 877 MB |

What the per-command lines say, run 16: `apply` stays at 1.5 to 3 ms for every command. The growth is in `wait`: a command whose parent or type was created by the previous command waits 700 to 950 ms (about 250 ms in run 1) for the element to become visible to the resolvers, and `ScriptBlock`'s `iter` for commands with no wait at all is 400 to 800 ms against 22 ms in run 1. So each dispatch now costs the main thread most of a second of work after the reducer has finished, the poll of `waitForDependencies` (30 ms, `MAX_WAIT_MS` 500) is starved by it (waits overrun the 500 ms cap), and the cost grows with what has accumulated in the session, not with the size of the target metamodel: an empty metamodel_2 was the slowest. Emptying the Jjodie chat (16 past `ScriptBlock`s) halved the time, so the past chat blocks are part of it but not all. Also seen: the inactive metamodel_1 editor stays mounted (91 nodes, 5 433 DOM nodes, 2 912 `react-flow__handle` elements, 32 per node), the tree panel has 292 rows, the heap swings between 0.5 and 1.3 GB. `Jodie.tsx` reads `store.getState()` without subscribing (`:117`), so why the chat re-renders on each dispatch is an open question.

Hypotheses to confirm or refute, none to assume: H1 every past `ScriptBlock` (and its `MarkdownRenderer`) re-renders on every dispatch, and its cost is proportional to the number of blocks and their highlighted lines; H2 the inactive editor tab re-renders (or re-lays out) on every dispatch; H3 the tree panel re-renders whole on every dispatch; H4 an accumulation independent of what is mounted (undo deltas, listeners, subscriptions that survive their component, caches) grows the cost per dispatch; H5 `RunSummaryDialog`'s `useSelector` (always mounted, `isOpen` false) is negligible. The share of each, in milliseconds per dispatch, is what Phase 1 must deliver.

## DOVE

Phase 1 writes only its discovery report and a probe under `frontend/scripts/probe/` (new file, name grepped first, committed with the report), plus whatever `_tmp_` files it needs (gitignored, not committed). No production file changes in Phase 1.

Phase 2, decided by the chat after the report: expected to be in the components the attribution names (candidates: `jjscript/components/ScriptBlock.tsx`, `components/common/MarkdownRenderer.tsx`, `components/Jodie/ChatMessages.tsx`, `components/Jodie/Jodie.tsx`, the tree panel, the editor tab host). Any file in the critical zone (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`) is out unless the report shows it is the cause; then the report says so and Phase 2 starts with a Layer Impact Report.

## COME

### Phase 1, measurement only, ends at a hard stop

1. Read `CLAUDE.md` (§6, §17, §21.2, Rule 11), `docs/PROTOCOL.md` P16, RC-20/21/25/26, R-JS-1..6 in `docs/decisions.md`, `docs/discovery/discovery_2026-10-01_jjscript_requeue.md`, and the existing probes in `frontend/scripts/probe/` and `frontend/scripts/smoke/` to reuse their launch and wait helpers.
2. Write the probe: it drives the app with Playwright through `lane-run probe` (port 3004 or any free port other than 3001; never 3001), creates a project and a metamodel, opens Jjodie, and runs the same 16-line script N times (N = 12, prefix `R<n>_`), injecting each script as an assistant message with `jjodieScope` the way the chat did (the React state hook of `Jodie` holding `{ messages, isOpen }`, `queue.dispatch`), then clicking «Run as JjScript» and «Run» and waiting for `.run-summary`. If a cleaner injection path exists in the code (a test hook, a dev-only entry point), use it and say which. Record per run: wall time, the `[JjScript-TIMING]` lines, store object count, DOM node count, `performance.memory.usedJSHeapSize`.
3. Attribution, per dispatch, on runs 1, 6 and 12: with the React Profiler (`<Profiler>` wrapping under a `_tmp_` dev-only patch is allowed in Phase 1 only if reverted before the commit, or React DevTools' hook `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot` installed by the probe, preferred) count the components that commit and their actual duration after one `create attribute` dispatch; group by H1..H5. Add three ablations, each a separate probe run of 12 scripts: (a) Jjodie chat emptied before each run; (b) only one editor tab open (close the others before running); (c) tree panel collapsed or hidden if the UI allows it. Report the per-dispatch milliseconds of each ablation against the baseline.
4. Check H4 directly: after run 12, reload the page, reopen the same project if it persists (say whether it does: on 2026-10-01 a project made in the built-in browser lost its metamodels after a reload), and run once more on a store of the same size. Same wall time as run 12 means size, a run-1 time means accumulation.
5. Read, do not change: which subscriptions each past `ScriptBlock` holds (`useSelector`, store subscribe, window listeners) and whether they survive unmount; what makes `ChatMessages` or `MarkdownRenderer` re-render on a store change; whether the inactive editor tab's tree is mounted and subscribed.
6. Write the report `docs/discovery/discovery_2026-10-01_jjscript_run_slowdown.md`: `## 0. Answer in brief` first (at most 40 lines: the share of each hypothesis in ms per dispatch at run 12, the recommended fix for the top one or two, expected gain measured or estimated, and what is out of reach before 2026-10-07); then objective, files read, the probe and how to rerun it, the tables, risks, «Decisions taken (unattended)», «Decisions awaiting Alfonso». Commit report and probe: `docs(jjscript): discovery for the Run slowdown (P-2026-10-01-2136)` (probe in the same commit only if `bash-guard` accepts docs and a script together; otherwise two commits, the probe as `chore(probe): ...`). Stop with `Outcome: hard-stop`.

### Phase 2, after `[P-2026-10-01-2136] GO` from the chat, same session

7. The GO names the fix. Tests first where the change is testable under vitest; the probe of Phase 1 rerun before and after is the acceptance measure (run 12 wall time and per-dispatch ms).
8. Gates: `npm run typecheck` (baseline 14, known set), vitest of the touched folders green with counts before and after, `npm run build`, `npm run check:docs`.
9. Commits per concern, conventional subject with `(P-2026-10-01-2136)`, then one docs commit with the log entry in `docs/log-inbox/jjscript.md` and this prompt's Status. No merge. Stop with `Outcome: hard-stop`, shas, the before/after table of the probe.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, port 3001, writes in any other tree, dark-theme work, removing the `TEMP-DISCOVERY` lines (they are the instrument; ticket T5 stays open).

## RIFERIMENTI

- The chat's measurements above (C-2026-10-01-1725, 2026-10-01 21:10 to 21:35, built-in browser on 3001, trunk `ac3890b7e`).
- `jjscript/executor/elementWaiter.ts` (`POLL_INTERVAL_MS` 30, `MAX_WAIT_MS` 500), `jjscript/executor/executor.ts` and `jjscript/components/ScriptBlock.tsx` (`TEMP-DISCOVERY` timing lines), `jjscript/components/RunSummaryDialog.tsx` (`useSelector` at `:87`), `components/Jodie/Jodie.tsx` (`store.getState()` at `:117`), `components/Jodie/ChatMessages.tsx`, `components/common/MarkdownRenderer.tsx`.
- R-JS-1 (the wait for required dependencies), `discovery_2026-09-17_superclass_same_script_race.md`.
