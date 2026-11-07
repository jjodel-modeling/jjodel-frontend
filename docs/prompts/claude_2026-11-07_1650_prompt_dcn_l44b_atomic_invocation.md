# DCN L4.4b: an invocation is one step (R-DCN-22)

Prompt-ID: P-2026-11-07-1650
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (behaviour change in the DCN nucleus)
Depends: R-DCN-4 as amended by R-DCN-22, R-DCN-23, R-SIM-17; L4.4 (`dcnStep.ts`, on the trunk since 601b46ceb)
Worktree: ~/jjodel-w-dcn-l44b, branch dcn-l44b, from the trunk at the commit that adds this prompt (P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-07 16:46 «procedi in lane auto»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. Commit the code as soon as the targeted suites are green, before the full run. Every reply opens with [P-2026-11-07-1650 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log.

## Contesto (non rifare l'analisi)

Read the rows R-DCN-22 and R-DCN-23 in `docs/decisions.md` (added by the commit before this prompt), then `frontend/src/model/simulation/dcn/dcnStep.ts` and its test. Today, under Interleave, an invocation offers the static operation and each active redefinition as separate candidates, so the selector can run `land()` without its redefinition in Flying; the test «a redefinition expands the invocation … Interleave may run the static one alone, unclassified» pins that. R-DCN-22 replaces it: an invocation is one step under every policy.

## COSA

(1) `dcnStep.ts`: an invocation offers one candidate, whose assignment is the parallel union of the static operation's body and the bodies of every redefinition of an active dynamic class, read on the previous σ; two of them writing one slot is the double-assignment defect of R-SIM-17. Interleave keeps one contribution per step for tick monitors of different viewpoints and for distinct invocations, exactly as today. Update the comment that cites the SoSyM Definition 3 so it states both rules and R-DCN-22.
(2) Tests first: replace the old W5-gap test with «`land()` under Interleave runs with its redefinition in one step: speed 0, distance 0, Mode Charging», keep the Sync case, add «a redefinition and its operation writing the same slot halt double-assignment under Interleave too», and keep every other test unchanged. Mutation bench on the changed lines (P5).
(3) Gates: typecheck at the baseline of CLAUDE.md §17, the simulation suites and the full vitest run at its baseline, `npm run build`, `npm run check:docs`. One code commit; the log entry appended to `docs/log-inbox/dcn.md` and the Status flip in one docs commit. No visual check is owed. W6 itself is lane L2.4, not this one.

## HARD STOP

A need to touch any file other than `dcnStep.ts` and its test: stop with Outcome: question.

## NON FARE

No W6 check, no wiring into the run, no push, no merge. Public repo: name no partner company.
