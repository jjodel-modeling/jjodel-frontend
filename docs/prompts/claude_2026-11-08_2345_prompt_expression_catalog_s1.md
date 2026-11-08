# Expression catalog S1: the DDR4 brief readable (fold expression subtrees, print them in the owner)

Prompt-ID: P-2026-11-08-2345
Chat: C-2026-11-01-1434
Front: plugins
Lane: full (critical zone CLAUDE.md §3.1, `viewpoint/ir/`; go-ahead of Alfonso 2026-11-08 23:39)
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp
Depends: P-2026-11-08-2310

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 non si applica (motivo: discovery done, `docs/discovery/discovery_2026-11-08_expression_catalog.md` at `e137e6a8f`).

Worktree: `~/jjodel-w-exprcat`, branch `expression-catalog`, HEAD at the commit that adds this prompt (after the R-EXP
decisions commit). Clean tree. Model and tier as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-08-2345 · session <id>]`; final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 90 minutes. Gates through
`node scripts/run-quiet.mjs`. Context is the binding constraint: read the R-EXP section of `docs/decisions.md`, then
only §2.3, §3, §5 of the discovery report and the files they cite; grep, never cat whole large files, logs or the XMI;
write the handoff before the soft ceiling (RC-51) and commit nothing half-done. Load gate before any probe run: `uptime`,
1-minute load ≤ 16 (wait up to 15 minutes, then run and record it). No push, no merge.

## COSA

Slice S1 of R-EXP-14, as designed in §5 of the report and fixed by R-EXP-1..13:

1. Layer Impact Report `docs/discovery/lir_2026-11-08_expression_fold.md` before the code (critical zone §3.1). Rule
   19: more than 5 files, so list every file and what changes in it first, in the LIR.
2. Tests first:
   - the binding codec (version refused when unknown, unknown keys preserved);
   - the printer (precedence climbing, `parens: always | minimal`, per-row override, the sharing pass with `D1, D2`);
   - the golden test: the 246 slots of `ddr4_closed_v` print byte for byte as `brief_view.py` (generate the expected
     text with `python3 ~/Downloads/micron-proto/tools/kernel/brief_view.py` into a committed fixture; do not edit
     anything under `~/Downloads/micron-proto`). Replace the discovery's 12 hand-coded stand-ins with real roles or
     templates; if one cannot match, stop and say which.
3. The code: binding codec in the metamodel `_state` key `exprBinding` (R-EXP-3); pure printer with batch memo on
   D-record identity (R-EXP-6, R-EXP-7); slot fold by hiding (the IR `visible` path of §2.3, vertex records kept,
   R-EXP-5, R-EXP-10); the `TextSource` member `{from:'expression', slot}` and its handlers (R-EXP-13), with long text
   wrapped, monospace, clamped with «show all»; a viewpoint field that activates the fold (R-EXP-4); JSON import of a
   binding; the Brief binding as a JSON file; explicit degradation when the binding is missing or invalid (R-EXP-12).
4. Gates: typecheck, vitest (baseline: the 9 known import failures), build, smoke, `check:scripts`, `check:docs`, the
   `bpmn-lanes` probe 12/12.
5. Measure with a probe on this worktree (the discovery's gitignored `_tmp_expr_ddr4.ts` as a start): import
   `Brief.ecore` and `ddr4_closed_v.xmi`, apply the Brief binding, activate the fold, run Auto layout. Record: nodes and
   edges (expected 249 and 248), the printed formula present in each owner (sample), editing a constant in the tree
   updates the owner's text, and open time against §4 of the report (16-19 s). Screenshots for the chat.
6. Code commit with explicit pathspec, LIR commit, log entry in the front's inbox and Status flip, uncommitted (RC-17).
   Stop every server you started. Exit `Outcome: hard-stop (visual check due)`.

## HARD STOP

A red gate, the golden test not byte-identical, a change outside the LIR's file list, or a D-layer write or sync file
change (CLAUDE.md §3.2): stop before the code commit with the evidence and one `Recommended:` line.

## NON FARE

No removal of folded vertices (S4). No rows for parameters and properties (S5). No auto-binding (S6). No editing (S7).
No worker plugin runtime. No change under `~/Downloads/micron-proto`. No new dependencies.

## RIFERIMENTI

`docs/decisions.md` R-EXP, R-PLG, R-OI (`ontoBindings`), R-IRN, R-VP; `docs/discovery/discovery_2026-11-08_expression_catalog.md`;
`~/Downloads/micron-proto/tools/kernel/brief_view.py`, `docs/brief-text.md`, `docs/syncrtl-text.md`, `tools/kernel/build_ecore.py`;
`~/Downloads/micron-proto/out/dram/jjodel/ddr4_closed_v.xmi` (md5 `42019bebff2a826aaf49682b8ae248ac`).
