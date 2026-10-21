# Canvas: finish the intrinsic measure cache (continuation of P-2026-10-21-1240)

Prompt-ID: P-2026-10-21-1355
Chat: C-2026-10-20-0839
Front: maintenance
Lane: full (critical zone: `viewpoint/ir/`, CLAUDE.md §3.1 table; continuation of a ceiling-stopped lane, RC-51)
Status: da eseguire
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: P-2026-10-21-1240
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Critical-zone go-ahead: Alfonso, 2026-10-21 10:07, «procedi» (carried by P-2026-10-21-1240); this lane is started
with `--critical-zone-goahead P-2026-10-21-1355`. The LIR is `e42b8e120` and stays valid.

Worktree: `~/jjodel-w-perfround3`, branch `perf-round3` (same as P-2026-10-21-1240; the code and tests are in the
working tree, uncommitted). Model and tier: heavy, as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1355 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. Every gate runs in the foreground (P16). No
push, no merge. Context discipline, this lane has already stopped twice at the ceiling on measurement output: read
only `~/.jjodel-lanes/P-2026-10-21-1240/handoff.md`; never cat a probe log or a profile, grep the summary lines
only; run gates through `node scripts/run-quiet.mjs`; do not re-read the report or the LIR.

## COSA

Done and uncommitted (handoff «Scope» and «Evidence»): `intrinsicMeasureCache.ts`, `useContentSize.ts` on it, 15
tests green and red first, mutations m1-m4 killed. Remaining: handoff «Remaining checks» 1 to 4.

## DOVE

The three files of the handoff plus the probe step in `frontend/scripts/probe/large-model-click-profile.ts`;
closure in `docs/log-inbox/maintenance.md` and the Status lines of P-2026-10-21-1240 and this prompt.

## COME

1. Gates on the change: typecheck (0), full vitest count, build; copy `dist` to `/tmp/p1240-dist-new`; the base
   build is at `/tmp/p1240-dist-base`.
2. Probe step `stale` as designed in the handoff (fonts fresh-mount, theme attribute, the discriminating
   `letter-spacing` style as positive control and its removal); keep it opt-in.
3. Acceptance, production, three runs on the new build and one same-window base run, `uptime` before each (wait
   while the 1-minute load is above 16, up to 20 minutes, then run and record): ring p50 ≤ 85 ms, move p95 ≤ 100 ms,
   drag long tasks median ≤ 400 ms, open and click not worse than the same-window base, node sizes string-equal to
   the base, BPMN 48 nodes 42 edges, stale 0 in every sub-step and the positive control moving some size.
4. One `fix(editor-v2):` commit (module, hook, test, probe step) with the measurements and the mutation table of the
   handoff in the body, `git add` by path, `Model:` trailer; closure docs commit (RC-17); remove the
   `frontend/node_modules` symlink. `Outcome: done`. If the acceptance is missed, commit nothing of the code, write
   the numbers in the handoff and end with `Outcome: question` naming the missed criterion.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-10-21-1240/handoff.md` and `handoff.diff`; `docs/lir/lir_2026-10-21_intrinsic_cache.md`
(do not re-read); `~/.jjodel-lanes/P-2026-10-21-1115/measurements.md` for the base numbers (grep, do not cat).
