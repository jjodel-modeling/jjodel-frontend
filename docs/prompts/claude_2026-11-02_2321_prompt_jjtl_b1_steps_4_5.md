# JjTL B1 continued: lazy rules and containment under B

Prompt-ID: P-2026-11-02-2321
Chat: C-2026-11-02-1541
Front: hw-notation
Status: eseguito 2026-11-02 · lane hw-notation · 105140d39, 6bf6e6578, b0ad73715
Lane: full (closes B1: steps 4 and 5)
Depends: P-2026-11-02-2247
Worktree: ~/jjodel-w-jjtlcalled, branch jjtl-called-rules (the same tree, at the commit that adds this prompt)
Request: none (continuation; Alfonso's GO of 2026-11-02 22:21)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlcalled` on
`jjtl-called-rules`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2321 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit after each step. Read only the closing report of P-2026-11-02-2247 (`tail` of `~/.jjodel-lanes/P-2026-11-02-2247/log.jsonl`, the last result event), SPEC 5.3.3 and the COSA of `docs/prompts/claude_2026-11-02_2224_prompt_jjtl_b1_called_lazy_rules.md`. Print little.

## COSA

Step 4, lazy rules, as listed under «Remaining for the next lane» there: indexed by source class; a guard selects one rule, with 0 or 2+ an error; matched and lazy on one class an ambiguity error; `unique` memoised on (rule, source, environment).

Step 5, containment under B: a non-`unique` call always creates a fresh subtree; the double-claim error only for implicit resolutions and `unique` rules.

The toy's expression rules become lazy, so pass 1 lowers nothing extra and no stray roots stay. Ruling on the question left open: a bound value whose binding site has an empty environment lowers to a fresh target like any lazy rule, never a shared pass-1 target (R-JTG-6, R-JTG-7).

All remaining acceptance tests: case (3), the template per `Op`; the same expression placed twice with the same and with different bindings; `unique lazy` created once; no roots for unreached lazy nodes; a second implicit claim still errors. Update SPEC 5.3.3 and section 12, and write the list for B2.

## DOVE

`frontend/src/jjtl/` (executor, tests, SPEC.md), `docs/log-inbox/hw-notation.md`, the `Status:` line. Not `frontend/src/jjel/`, not `frontend/src/components/project/`; no CLAUDE.md 3.2 file. Stop with `Outcome: question` if one proves necessary.

## COME

Named paths only. Gates: `frontend/src/jjtl/` tests and `tsc` after each step; full suite and `check:docs` before closing. Timeouts in Chromium or load-sensitive tests: rerun alone before calling them failures. Do not merge. Close with the list for B2, «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line. The repo is public: name no partner company.
