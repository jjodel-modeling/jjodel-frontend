# Expression fold: Auto layout packs the folded model into a few screens

Prompt-ID: P-2026-11-09-0925
Chat: C-2026-11-01-1434
Front: plugins
Lane: fast (one cause, one fix, one measure; critical zone go-ahead of Alfonso 2026-11-08 23:39, this lane 2026-11-09 08:55)
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp
Depends: P-2026-11-09-0900

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 non si applica (motivo: cause measured by P-2026-11-09-0806 and the fix drafted in its saved patch, stated below).

Worktree: `~/jjodel-w-exprcat`, branch `expression-catalog`, HEAD at the commit that adds this prompt, on top of
`1123ced34`. Expected tree: only the uncommitted S1 closure docs (`docs/log-inbox/plugins.md`, four prompt Status
lines); leave them alone. Model and tier as pinned, effort `xhigh`.

## Lane discipline

Every reply, including interim ones, opens with `[P-2026-11-09-0925 · session <id>]`; final message ends with
`Outcome: done | hard-stop | question | blocked`. Time limit 45 minutes. **This lane is small on purpose: six lanes on
this front stopped at the context ceiling.** Read nothing except the hunks of the patch named below, the lines they
touch (±20 lines) and the files you change. Never print a profile, a log, the diff, a fixture or the XMI; grep summary
lines. Load gate before the probe: `uptime`, 1-minute load ≤ 16.

## Cause (measured by P-2026-11-09-0806, do not re-measure)

The folded model is a star: a few owners with hundreds of leaf neighbours. ELK `layered` puts the leaves in one row,
so after Auto layout the 249 nodes span a strip many screens wide. ELK `stress` with overlap removal packs them, but
took about 11 s in the previous lane. The previous lane drafted the fix and saved it in
`~/.jjodel-lanes/P-2026-11-09-0806/wip-layout.patch` (4 files: `EditorV2.tsx`, `utils/elkLayout.ts`, its test,
`utils/deriveViewpoint.ts`; +30 −5): an `EXPR_FOLD_LAYOUT` stress profile stored in the fold viewpoint's
`_state[DERIVED_LAYOUT_KEY]`, a `labelPathSamples(len)` cap replacing `Math.max(2, Math.ceil(len / 6))` in
`EditorV2.tsx`, and a star test (120 leaves: aspect ratio < 3 with the profile, > 10 with layered).

## COSA

1. Apply the patch: `git apply --check`, then `git apply`. If a hunk fails on the current tree, stop and report which.
2. Add an ELK iteration limit to the stress profile so Auto layout finishes within the time below (the stress option
   `elk.stress.iterationLimit`, or whatever key the profile mapping in `elkLayout.ts` already passes through; if the
   profile type has no seam for it, add one optional field there, no other file). Keep the star test green, and add a
   case that the profile's ELK options carry the limit.
3. Gates: typecheck; vitest on `src/components/editor-v2/utils`, `src/model/expression`, `src/utils`;
   full vitest only if those are green (baseline: the three known import failures); build.
4. Measure once with the S1b probe (`frontend/scripts/smoke/_tmp_expr_s1b.ts`, gitignored) including its Auto layout
   step: layout duration, longest task during layout, bounding box of the 249 nodes after layout in px and in screens of
   1440x900. Acceptance: layout ≤ 10 s, no task above 5 s, bounding box within a few screens (state the numbers).
   Screenshot after layout in the lane folder, checked to differ by content from the one before layout.
5. Code commit `perf(expression): Auto layout packs the folded model (P-2026-11-09-0925)` with explicit pathspec of the
   changed files. Append two lines with the numbers to the S1 entry of `docs/log-inbox/plugins.md`, uncommitted. Stop
   every server you started. Exit `Outcome: done`.

## HARD STOP

Acceptance not met, a patch hunk that does not apply, or a fix that needs a file outside the four of the patch: stop
before the commit with the numbers and one `Recommended:` line. Near the ceiling: stop at once, commit nothing.

## NON FARE

No change to the fold views or `irStyle.ts` (done by P-2026-11-09-0900). No removal of folded vertices (S4). No change
under `~/Downloads/micron-proto`. No new dependencies.
