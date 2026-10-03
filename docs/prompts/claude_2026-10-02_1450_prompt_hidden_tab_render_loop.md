# Prompt: T9, a hidden metamodel tab re-renders about 60 times a second with nothing dispatched

Prompt-ID: P-2026-10-02-1450
Chat: C-2026-10-01-1725
Lane: full (two-phase: Phase 1 finds who drives the loop, Phase 2 after the chat's GO, same session). Tier: heavy.
Status: eseguito 2026-10-03 · lane hidden-tab-loop · 4afbb321a · verifica visiva passata 2026-10-03 (scripted interaction smoke and scene dumps by the lane, crops md5-checked by the chat; Alfonso's own check pending in the morning digest)

Worktree: `~/jjodel-w-hiddenloop`, branch `hidden-tab-loop` (cut by the chat from `jjscript-run-perf` at `7bd293e37`, so the run-slowdown probe and fix 2 are in the tree; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-hiddenloop`, branch `hidden-tab-loop`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Ticket T9 from P-2026-10-01-2136 (report `docs/discovery/discovery_2026-10-01_jjscript_run_slowdown.md`, Phase 2 addendum): on `4bbf7e640`, with no fix applied, a metamodel tab that is hidden (rc-dock keeps a visited tab mounted with `visibility:hidden; height:0`) and holds at least one reference re-renders about 60 times a second while nothing is dispatched. The inactive-tab gate written in that lane (parked, not committed, in `~/jjodel-w-runperf/frontend/scripts/smoke/_tmp_fix1_*`) cannot stop it, because the loop is not driven by the Redux store. It is the likely main share of the hidden-tab cost measured there (208 ms of React render per command for the hidden editor against 73 ms for the visible one) and it burns CPU between Runs. On 2026-10-01 at 23:53 a Microsoft Edge renderer was seen at 120% CPU on Alfonso's Mac; whether that was a Jjodel tab in this loop is not known. Whether the visible editor loops too was not measured. MODELS demo on 2026-10-07, merges until then.

What is wanted: the component and the line that set state on every frame, why, whether the visible editor does it too, and the smallest fix that stops it without changing what a tab shows.

Hypotheses to confirm or refute, none to assume: a `useEffect` or `ResizeObserver` callback that sets nodes, edges or a measured size every time (a hidden pane measures 0 height, so a layout or fit computation never converges and writes again); a `requestAnimationFrame` loop that is not stopped when the pane is hidden; React Flow's `onNodesChange`/dimension updates fed back into props that are rebuilt each render (new array identity, so React Flow re-measures, emits changes, and the parent sets state again); edge routing that recomputes and stores paths each frame. The reference matters: a tab with classes only does not loop.

## DOVE

Phase 1 writes only its discovery report and, if useful, an extension of `frontend/scripts/probe/jjscript-run-slowdown.ts` or a new probe under `frontend/scripts/probe/` (name grepped first), plus `_tmp_` files (gitignored, not committed). No production change in Phase 1.

Phase 2: the files the report names. Critical-zone files (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`) are allowed only with a Layer Impact Report first (RC-30 applies to this lane: the chat gives the critical-zone go-ahead now, the Layer Impact Report stays the first step).

## COME

### Phase 1, read-only, ends at a hard stop

1. Read `CLAUDE.md` (§3, §6, §17, §21.2), `docs/PROTOCOL.md` P16, RC-20/21/25/26/30, the report of P-2026-10-01-2136 with its Phase 2 addendum, and the parked `_tmp_fix1_*` files in `~/jjodel-w-runperf/frontend/scripts/smoke/` (read only, never write there).
2. Reproduce with the probe through `lane-run probe` on a free port other than 3001: a project with two metamodels, one class with a reference in the first, switch to the second, then sample for 5 s with nothing dispatched. Count commits per second per editor with `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`, and record which fibers re-render and which state hook changed (the fiber's `memoizedState` chain before and after). Controls: the same with classes only and no reference (expected: no loop); the same with the first tab visible (does the visible editor loop?); the same after closing the first tab (expected: no loop).
3. From the hook that changes, read the code that sets it and the effect or callback that calls it, with file and line; explain why it never settles (show the two values it alternates between, or the identity that changes).
4. Check whether the loop exists on the trunk too (`alfonso-frontend-jjtl`, via `git show` of the files involved, no checkout) and since when (`git log -L` or blame on the lines), so the chat knows whether the demo build has it.
5. Write `docs/discovery/discovery_2026-10-02_hidden_tab_render_loop.md`: `## 0. Answer in brief` first (at most 40 lines: the loop's driver with file and line, commits per second hidden and visible, the recommended fix and its expected effect, whether it touches the critical zone, what the user would see differently: nothing is the target); then objective, files read, the probe and how to rerun it, findings, risks, «Decisions taken (unattended)», «Decisions awaiting Alfonso». Commit it (docs) and the probe (`chore(probe): ...`) separately if `bash-guard` asks for it. Stop with `Outcome: hard-stop`.

### Phase 2, after `[P-2026-10-02-1450] GO` from the chat, same session

6. The GO names the fix. Tests first where testable under vitest; the probe of step 2 is the acceptance measure (commits per second hidden and visible, before and after, and the run-slowdown `two-mm` variant at run 12).
7. Gates: `npm run typecheck` (baseline 14, known set), vitest of the touched folders with counts before and after, `npm run build`, `npm run check:docs`; the four demo scenes (`/Users/alfonso/jjodel-demo-exports/`, read only) dumped before and after with the scene-dump mode of the probe: nodes, handles and edge paths identical.
8. Commits per concern with `(P-2026-10-02-1450)` in the subject, then one docs commit with the log entry in `docs/log-inbox/jjscript.md` (or the inbox the rotation left for it) and this prompt's Status. No merge. Stop with `Outcome: hard-stop`, shas, the before/after table.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, port 3001, writes in any other tree, dark-theme work.

## RIFERIMENTI

- `docs/discovery/discovery_2026-10-01_jjscript_run_slowdown.md` (§2 H2 figures, §3 mechanism, Phase 2 addendum with T9).
- `frontend/scripts/probe/jjscript-run-slowdown.ts` (variants `baseline`, `two-mm`, scene-dump mode, tab-switch check).
- The parked inactive-tab gate in `~/jjodel-w-runperf/frontend/scripts/smoke/_tmp_fix1_*`.
