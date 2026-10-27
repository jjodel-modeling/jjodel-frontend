# Canvas: finish the batched intrinsic measure and the inset fix (continuation of P-2026-10-21-1010)

Prompt-ID: P-2026-10-21-1115
Chat: C-2026-10-20-0839
Front: maintenance
Lane: full (critical zone: `viewpoint/ir/`, CLAUDE.md §3.1 table; continuation of a ceiling-stopped lane, RC-51)
Status: eseguito 2026-10-21 · lane perf-round3 · 365f9ca9a, 1f9d718fd; inset only, batch measured and dropped, MiniMap skipped for load · verifica visiva: alla chat, pending
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: P-2026-10-21-1010
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Critical-zone go-ahead: Alfonso, 2026-10-21 10:07, «procedi» (carried by P-2026-10-21-1010); this lane is started
with `--critical-zone-goahead P-2026-10-21-1115`. The LIR is `2c4331c68` and stays valid: the diff is the one it
describes.

Worktree: `~/jjodel-w-perfround3`, branch `perf-round3` (same as P-2026-10-21-1010; the code and tests are in the
working tree, uncommitted). Model and tier: heavy, as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1115 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. Every gate runs in the foreground (P16). No
push, no merge. Keep the context lean: read `~/.jjodel-lanes/P-2026-10-21-1010/handoff.md` and its «Remaining
checks», not the round 3 report; keep probe output short (grep the summary lines).

## COSA

The code of fixes 1 and 2 is written and its unit gates pass (handoff «Evidence»): the batch coordinator
`intrinsicMeasureBatch.ts` with `useContentSize.ts` on it, `viewportInset.ts` with a cached inset and
`useFitViewOptions()`, the `EditorV2.tsx` call site, the tests, the three hook benches adjusted, the probe's
`CLICK_LAYOUTS=1` step. What remains is the build, the measurements, the MiniMap decision and the commits.

## DOVE

The files of the handoff's «Current diff», nothing else; `EditorV2.tsx` MiniMap props only if item 3 is confirmed;
closure in `docs/log-inbox/maintenance.md` and the Status lines of P-2026-10-21-0905, P-2026-10-21-1010 and this
prompt.

## COME

Handoff «Remaining checks» 1 to 5, in order:
1. `npm run build` of the change through `node scripts/run-quiet.mjs` (recreate the temporary `frontend/node_modules`
   symlink, P14; remove it before the closure); `dist` to `/tmp/p1010-dist-new`; the base build is at
   `/tmp/p1010-dist-base`. `vite preview` both on free ports, never 3001.
2. Probe acceptance, `uptime` before each run (wait while the 1-minute load is above 16, up to 20 minutes in total,
   then run anyway and record the load): three runs on the new build and one on the base,
   `CLICK_PROD=1 CLICK_LAYOUTS=1 CLICK_STEPS=open,lat,drag,commit,vp` on
   `~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`: ring p50 ≤ 85 ms, move p95
   ≤ 100 ms, drag long tasks median ≤ 400 ms, open and click not worse than `prod-r3b-1` (open 3345, click
   441/367), `maxLayoutsPerBurst` = 1 on the new build and > 1 on the base, node sizes string equal between the two
   builds, BPMN 48 nodes and 42 edges.
3. MiniMap: only if the load is ≤ 8, one `CLICK_ABLATE=minimap` run and one baseline in the same session; memoise
   only if the drag saving is ≥ 0.4 s of long tasks; otherwise record the two runs (or that the load never allowed
   it) and leave the MiniMap alone.
4. Full vitest count; one `fix(editor-v2):` commit by path with measurements and the mutation table of the handoff
   in the body, `Model:` trailer; closure docs commit (RC-17). `Outcome: done`. The visual check is the chat's.
5. Remove the symlink and `/tmp/p1010-dist-*`.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-10-21-1010/handoff.md` and `handoff.diff`; `docs/lir/lir_2026-10-21_intrinsic_batch_inset.md`;
`docs/discovery/discovery_2026-10-21_large_model_round3.md` §3.3, §3.4 (numbers only).
