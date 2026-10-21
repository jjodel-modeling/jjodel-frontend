# Canvas: measure and commit the intrinsic measure cache (continuation of P-2026-10-21-1355)

Prompt-ID: P-2026-10-21-1535
Chat: C-2026-10-20-0839
Front: maintenance
Lane: full (critical zone: `viewpoint/ir/`, CLAUDE.md §3.1 table; continuation, RC-51)
Status: da eseguire
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: P-2026-10-21-1355
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Critical-zone go-ahead: Alfonso, 2026-10-21 10:07, «procedi» (carried by P-2026-10-21-1240 and 1355); started with
`--critical-zone-goahead P-2026-10-21-1535`. LIR `e42b8e120`.

Worktree: `~/jjodel-w-perfround3`, branch `perf-round3`; the code, tests and probe step are in the working tree,
uncommitted, and the two production builds are in `/tmp` (see the handoff). Model and tier: heavy, as pinned
(RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1535 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. No push, no merge. Context discipline: read
only `~/.jjodel-lanes/P-2026-10-21-1355/handoff.md`; no rebuild, no re-run of gates already green there (typecheck
0, build 0; the vitest reds are the 9 known import files, `criticalZone.test.ts` under the go-ahead variable, and 4
`scripts/` files that time out under load and pass alone 267/267: state that, do not re-run them); never cat a probe
log, grep its summary lines only.

## COSA

The acceptance of P-2026-10-21-1355 has one valid run of the new build (new-2, load 11.7: ring p50 82, move p95 92,
drag 361, open 2321, clicks 215/186) and no base run at load ≤ 16. Complete it and commit.

## COME

1. Load gate: `uptime` before each run; start a run only when the 1-minute load is ≤ 16, waiting up to 25 minutes
   in total; if the load never allows it, write that in the handoff and end with `Outcome: question`.
2. Two more runs of the new build and one of the base build, same window, `CLICK_PROD=1 CLICK_LAYOUTS=1
   CLICK_STEPS=open,lat,drag,commit,vp,stale`, preview servers on free ports (never 3001), stopped after.
3. Acceptance on the medians of the three new runs: ring p50 ≤ 85, move p95 ≤ 100, drag long tasks ≤ 400, open and
   click not worse than the base run (within 10 %), node sizes string-equal, BPMN 48/42, stale 0 with the re-measure
   control telling the builds apart (41 on the new build after a CSS change, 0 on the base).
4. One `fix(editor-v2):` commit by path (`intrinsicMeasureCache.ts`, `useContentSize.ts`, the test, the probe) with
   all four 1355 runs plus these in the body, the mutation table from the 1240 handoff, and the note that on this
   fixture the node boxes do not come from the cached reading (so the staleness control is the re-measure count),
   `Model:` trailer; closure docs commit (RC-17: `docs/log-inbox/maintenance.md`, Status of P-2026-10-21-1240, 1355
   and this prompt); remove the `frontend/node_modules` symlink and `/tmp/p1240-dist-*`. `Outcome: done`. If the
   medians miss a threshold, commit nothing and end with `Outcome: question` naming it.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-10-21-1355/handoff.md`, `handoff.diff`; `~/.jjodel-lanes/P-2026-10-21-1240/handoff.md`
(mutation table only, grep «m1»).
