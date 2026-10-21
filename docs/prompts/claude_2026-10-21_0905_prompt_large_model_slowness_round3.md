# Large model: the residual delay after the night fixes (discovery, round 3)

Prompt-ID: P-2026-10-21-0905
Chat: C-2026-10-20-0839
Front: maintenance
Lane: full (the fixes may touch persistence and the canvas; Phase 1 read-only)
Status: da eseguire
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: P-2026-10-21-0335
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-perfround3`, branch `perf-round3`, cut from `alfonso-frontend-jjtl` at the commit that adds
this prompt. Model and tier: heavy, as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-0905 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. Every gate runs in the foreground (P16). No
push, no merge. Phase 1 only: hard stop on the report; no product code edited. Keep the context lean (short probe
logs, no full report re-reads) and write the report before the AM-8 soft ceiling (RC-51).

## COSA

After the three merges of the night (lazy References `bfab138ba`, core name scans `2e9a4dd6c`, incremental sync
`d9ea6a486`) the probe medians in dev on «Jjodel harness» are: click 0.45 s, drag 1.7 s, rename commit 0.35 s,
viewpoint switch 1.4 s, open 2.7 s. Alfonso reports on 2026-10-21 08:50 that the experience is better but «always a
bit delayed». Find where the remaining delay is, from what a user actually feels, not only from the single steps.

1. The save path. Round 2 measured one `U.compressedState` at 6.1 to 6.9 s in production on this project
   (`JSON` with `proxyToIdReplacer` plus `async-lz-string`, about 422k chars). Measure in dev and production: how
   often a save runs during ordinary work (the layout autosave after a drag, any autosave after an edit, the
   viewpoint switch), how much of it blocks the main thread (long tasks inside the save window, including the
   `async-lz-string` chunks), and whether it runs when nothing changed. A probe step: three edits spaced like a user
   (drag, wait 3 s, rename, wait 3 s, drag), long tasks over the whole 20 s window, split by cause.
2. The residual per step, from the round 2 list: `measureIntrinsic` (`viewpoint/ir/useContentSize.ts`, forced
   layout), the React Flow MiniMap (round 2 counted 1,182 `NodeComponentWrapperInner` renders per click, 11,666 per
   drag), edge `parsePathPoints`, the proxy `get0` self time. For each, an ablation in the probe (MiniMap hidden,
   intrinsic measure cached, and so on), measured, reverted.
3. Input latency as felt: from `pointerdown` to the first frame that shows the selection ring, and from a drag
   `pointermove` to the next painted frame (use `requestAnimationFrame` timestamps and the Event Timing API
   `PerformanceEventTiming` / INP-like durations). Report p50 and p95.
4. Dev versus production for the steps above (one production build).
5. A ranked list of fixes, each with the measured saving, its layers, and whether it touches persistence, the core
   or the critical zone. Candidates to evaluate, not to assume: serialising the save in a Web Worker or with
   `requestIdleCallback` slices; skipping a save whose state is unchanged; a cheaper autosave format for layout only;
   MiniMap off by default above N nodes or memoised; caching the intrinsic size per content hash.

## DOVE

Read anything. Write only the probe `frontend/scripts/probe/large-model-click-profile.ts` (new opt-in steps) and the
report `docs/discovery/discovery_2026-10-21_large_model_round3.md` (mandatory, CLAUDE.md: objective, files read with
full paths, findings with numbers, dependencies and risks, open questions for Alfonso, ranked fixes). Ablations are
temporary, measured and reverted, never committed. Fixture:
`~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel` (do not copy it into the repo).

## COME

1. Baseline `npm run typecheck` (0, RC-48) through `node scripts/run-quiet.mjs` from `frontend/`.
2. Items 1 to 5 in order; record every run in the report.
3. `chore(probe):` commit and `docs:` commit (separately, P13), `git add` by path, `Model:` trailer. Hard stop.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-20_large_model_slowness_round2.md` (§3.7 save cost, §5 residual);
`docs/discovery/discovery_2026-10-21_jjomsync_incremental.md`; `useLayoutAutosave.ts`; `U.compressedState`.
