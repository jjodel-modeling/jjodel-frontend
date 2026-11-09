# Expression catalog S1b, finish: green gates, probes, commit (continuation of P-2026-11-09-0035)

Prompt-ID: P-2026-11-09-0108
Chat: C-2026-11-01-1434
Front: plugins
Lane: full (critical zone CLAUDE.md §3.1, `viewpoint/ir/`; go-ahead of Alfonso 2026-11-08 23:39)
Status: eseguito 2026-11-09 · lane full · b42ddc837 · verifica visiva dovuta · log entry in docs/log-inbox/plugins.md
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp
Depends: P-2026-11-09-0035

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 non si applica (motivo: the code is written; this lane only verifies, fixes the named regression and commits).

Worktree: `~/jjodel-w-exprcat`, branch `expression-catalog`, HEAD at the commit that adds this prompt. Expected tree:
the uncommitted S1b wiring of P-2026-11-09-0035 (12 modified files, 3 untracked) and nothing else. Model and tier as
pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-09-0108 · session <id>]`; final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 60 minutes. Gates through
`node scripts/run-quiet.mjs`. Load gate before each probe and before the Chromium test files: `uptime`, 1-minute load
≤ 16 (wait up to 15 minutes, then run and record it).

**Context: four sessions in a row stopped at AM-8.** Read ONLY `~/.jjodel-lanes/P-2026-11-09-0035/handoff.md`, section
«Remaining checks» and «Scope» (`grep -n` them, then those lines). Read code only where a failing test points, around
the failing line. Never print a whole test log, the diff, the fixtures or the XMI: grep summary and failure lines.

## COSA

Steps 1 to 9 of «Remaining checks» in that handoff, in that order, with these limits:

- Step 1: move the `.ir-label--expr` / `.ir-label__expr-*` rules to the end of `irStyle.ts`; never update a pinned hash.
- Step 2: fix the false test name; mutation bench on at most five seams, each reverted with `cmp`.
- Steps 3 to 6: full vitest (only the three §17 import failures may stay), smoke, `bpmn-lanes` 12/12, the S1b probe
  (`_tmp_expr_s1b.ts`, never run before: fix harness bugs in the probe only). Expected 249 nodes, 248 edges.
- Step 7: code commit only with every gate and both probes green, explicit pathspec of the Scope paths.
- Step 8: log entry in the `plugins` inbox closing S1 (P-2026-11-08-2345, P-2026-11-09-0010, P-2026-11-09-0035 and this
  prompt) and the Status flips, uncommitted (RC-17).
- Exit `Outcome: hard-stop` with «visual check due» in the body.

## HARD STOP

A gate that stays red after step 1, a fix that needs a product file outside the Scope, a pinned hash that would have to
change, or a node count other than 249 without an explanation: stop before the commit with the evidence and one
`Recommended:` line. Near the ceiling: write a handoff and stop, commit nothing half-done.
