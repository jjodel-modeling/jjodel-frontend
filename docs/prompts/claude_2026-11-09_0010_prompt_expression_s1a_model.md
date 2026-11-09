# Expression catalog S1a: codec, printer, batch and the golden test (pure model, no UI)

Prompt-ID: P-2026-11-09-0010
Chat: C-2026-11-01-1434
Front: plugins
Lane: full (first half of S1, pure model code under `frontend/src/model/expression/`, outside the critical zone)
Status: eseguito 2026-11-09 · lane full · 985c27b54 · verifica visiva dovuta · log entry in docs/log-inbox/plugins.md
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp
Depends: P-2026-11-08-2345

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 non si applica (motivo: discovery and design done; `~/.jjodel-lanes/P-2026-11-08-2345/handoff.md` and the
committed LIR `docs/discovery/lir_2026-11-08_expression_fold.md`).

Worktree: `~/jjodel-w-exprcat`, branch `expression-catalog`, HEAD at the commit that adds this prompt. Clean tree. Model
and tier as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-09-0010 · session <id>]`; final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 75 minutes. Gates through
`node scripts/run-quiet.mjs`.

**Context is the binding constraint: two sessions in a row stopped at AM-8 while reading.** Read ONLY:
`~/.jjodel-lanes/P-2026-11-08-2345/handoff.md` (the whole design), the R-EXP section of `docs/decisions.md`
(`grep -n 'R-EXP' docs/decisions.md`, then those lines), and `frontend/src/model/ontological/bindingCodec.ts` as the
codec pattern. Do not read the discovery report, the LIR beyond its file list, `brief_view.py` beyond lines 160-198,
or any canvas/IR file: this lane writes no UI. Never print the fixtures (`ddr4_closed_v.model.json` is 167 KB, the
expected view 15 KB): read them only from tests; on a mismatch print the first differing line and its number, never the
whole text. For the feature names the handoff lists as not yet read, grep the fixture (`grep -o '"name":"[^"]*"'` on
the class entry) instead of reading `Brief.ecore`.

## COSA

1. Tests first in `frontend/src/model/expression/__tests__/`: the codec (unknown `v` refused, unknown keys kept), the
   printer (precedence climbing, `parens: always | minimal`, per-row override, the pattern holes of the handoff, the
   sharing pass `D1, D2`), and the golden test: build a D-shaped lookup from `fixtures/ddr4_closed_v.model.json`, run
   the real batch with the Brief binding, assemble the view as `brief_view.py:160-198` does, and compare with
   `fixtures/ddr4_closed_v.brief.txt` byte for byte.
2. Code, as the handoff's «Decisions taken»: `exprBinding.ts` (codec), `exprPrinter.ts` (pure), `exprBatch.ts` (batch
   per `idlookup` identity, fold set by slot closed downward, owners), and the Brief binding as data in
   `frontend/src/model/expression/bindings/brief.json`, with the 12 stand-ins as roles and patterns (no JjGen
   templates). If a stand-in cannot be expressed so that the golden test passes, stop and say which.
3. Gates: typecheck, vitest (baseline: the 9 known import failures), `check:scripts`, `check:docs`. No build, smoke or
   probe needed: nothing is wired.
4. Code commit with explicit pathspec. Write `~/.jjodel-lanes/P-2026-11-09-0010/result.md`: the exported API of the three
   modules (signatures only) and the facts S1b needs (how `exprFold` is read, how owners are listed). No log entry or
   Status flip here: S1b closes S1. Exit `Outcome: done`.

## HARD STOP

Golden test not byte-identical after the stand-ins are expressed: stop before the commit with the first differing line
and one `Recommended:` line. A file outside `frontend/src/model/expression/`: stop and ask. Near the ceiling: write the
handoff and stop, commit nothing half-done.

## NON FARE

No UI, no canvas, no `viewpoint/ir/`, no `problems/`, no sync file. No change under `~/Downloads/micron-proto`.
No new dependencies.
