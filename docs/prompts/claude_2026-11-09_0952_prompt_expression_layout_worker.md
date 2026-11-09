# Expression fold: Auto layout without freezing the page (cheap algorithm or ELK in a worker)

Prompt-ID: P-2026-11-09-0952
Chat: C-2026-11-01-1434
Front: plugins
Lane: full (critical zone go-ahead of Alfonso 2026-11-08 23:39; this lane chosen 2026-11-09 09:49)
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp
Depends: P-2026-11-09-0925

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 non si applica in forma separata (motivo: step 1 is the measurement and its decision rule is stated below;
no Phase 2 GO is needed inside the scope below).

Worktree: `~/jjodel-w-exprcat`, branch `expression-catalog`, HEAD at the commit that adds this prompt. Expected tree:
the uncommitted S1 closure docs (`docs/log-inbox/plugins.md`, four prompt Status lines; leave them alone) and the four
uncommitted files of P-2026-11-09-0925 (`EditorV2.tsx`, `utils/elkLayout.ts`, `utils/__tests__/elkLayout.test.ts`,
`utils/deriveViewpoint.ts`; copy in `~/.jjodel-lanes/P-2026-11-09-0925/wip-layout-limit.patch`). They are the base of
this lane: the `EXPR_FOLD_LAYOUT` profile, its use in the fold viewpoint, the `labelPathSamples` cap, the star test.
Model and tier as pinned, effort `xhigh`.

## Lane discipline

Every reply, including interim ones, opens with `[P-2026-11-09-0952 · session <id>]`; final message ends with
`Outcome: done | hard-stop | question | blocked`; one `Recommended:` line per question. Time limit 75 minutes. Gates
through `node scripts/run-quiet.mjs`. **Seven lanes on this front stopped at the context ceiling.** Read only the files
you change and the lines a step names (±20 lines). Never print a profile, a log, the diff, a fixture or the XMI; reduce
them with a script and grep. Load gate before every probe run: `uptime`, 1-minute load ≤ 16 (wait up to 15 minutes,
then run and record the load). Write `~/.jjodel-lanes/P-2026-11-09-0952/handoff.md` before the soft ceiling and commit
nothing half-done.

## Facts (measured by P-2026-11-09-0806 and P-2026-11-09-0925, do not re-measure)

The folded DDR4 model is a star: a few owners with hundreds of leaf neighbours, 249 nodes. ELK `layered` puts the leaves
in one row. ELK `stress` with overlap removal packs them into about 4.4 × 6.5 screens of 1440x900, but the ELK call runs
9.4-12.1 s as one main-thread task; the iteration limit 150 did not change it. Auto layout total 19-22 s.

## COSA

1. **Measure two cheap algorithms first** (at most 15 minutes, one probe run each, S1b probe
   `frontend/scripts/smoke/_tmp_expr_s1b.ts`, gitignored, with its Auto layout step): (a) `layered` with
   `elk.layered.wrapping.strategy` (`MULTI_EDGE`, and `SINGLE_EDGE` if the first fails), (b) `rectpacking`. For each:
   ELK call duration, longest task, bounding box in px and in screens, overlapping node pairs, and a screenshot in the
   lane folder (look at it: are owners next to their leaves?). Express each as an `ElkLayoutProfile` variant in
   `elkLayout.ts`; if the profile type has no seam for the option, add one optional field.
2. **Decision rule** (apply it, do not ask): if one of them gives ELK call ≤ 2 s, longest task ≤ 5 s, bounding box at
   most 4 × 4 screens, zero overlaps and owners visibly next to their leaves, make it `EXPR_FOLD_LAYOUT` and go to step 4.
   Otherwise keep the stress profile and do step 3. State which branch you took and why, with the numbers.
3. **ELK in a web worker.** Run the ELK call of `elkLayout.ts` in a worker using the existing `elkjs` dependency (its
   own worker build, constructed the way Vite resolves worker URLs; read how `elkLayout.ts` constructs ELK today). No new
   dependency. Keep a synchronous fallback for the test environment (vitest has no Worker) and say how the test picks it.
   While the layout runs, the Auto layout control shows a busy state and ignores a second click; reuse an existing busy
   or disabled pattern of the toolbar, no new CSS class unless grep shows none exists. Allowed files: the four of the
   base, a new worker module next to `elkLayout.ts` if needed, and the Auto layout call site in `EditorV2.tsx`. A file
   outside this list, or a §3.2 file: stop and ask.
4. Tests: the star test stays green for the chosen profile; for step 3, a test that the layout function resolves
   through the fallback with the same positions as before.
5. Gates: typecheck, vitest (baseline: the three known import failures), build, smoke, `check:scripts`, `check:docs`,
   the expression golden test.
6. **Acceptance**, on the S1b probe at load ≤ 16, median of three runs: no main-thread task above 5 s during Auto layout
   (hard); bounding box of the 249 nodes within a few screens, numbers stated (hard); Auto layout total ≤ 10 s (target:
   report it, it does not block the commit when step 3 was taken). Screenshots before and after layout, checked to
   differ by content.
7. Code commit `perf(expression): Auto layout packs the folded model without freezing the page (P-2026-11-09-0952)`
   with explicit pathspec of the changed files. Append two lines with the numbers and the branch taken to the S1 entry of
   `docs/log-inbox/plugins.md`, uncommitted. Stop every server you started. Exit `Outcome: hard-stop` with «visual check
   due».

## HARD STOP

A hard acceptance not met, a red gate, a file outside the allowed list, a new dependency, or a §3.2 trigger: stop
before the code commit with the numbers and one `Recommended:` line. Near the ceiling: write the handoff and stop.

## NON FARE

No change to the fold views or `irStyle.ts`. No removal of folded vertices (S4). No change under
`~/Downloads/micron-proto`. No new dependencies.
