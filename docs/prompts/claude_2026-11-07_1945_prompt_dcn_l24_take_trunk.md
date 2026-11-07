# Take the trunk into dcn-l24 (RC-14), one hand-resolved conflict in problems/registry.ts

Prompt-ID: P-2026-11-07-1945
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-07 · lane full · ea08a0f8b · verifica visiva non dovuta (crops di P-2026-11-07-1900) · log entry in docs/log-inbox/dcn.md
Lane: full (merge of the trunk into a front branch; code conflict in `editor-v2/problems/`, critical-zone go-ahead of Alfonso 2026-11-07 18:21 on L2.4)
Worktree: ~/jjodel-w-dcn-l24, branch dcn-l24, at the commit that adds this prompt on top of 63e44ede5
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; `MERGE_HEAD` absent; otherwise stop with Outcome: blocked. No subagents, no background tasks. Every reply opens with [P-2026-11-07-1945 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a log.

## Contesto (non rifare l'analisi)

`lane-run merge dcn-l24 --into alfonso-frontend-jjtl` refused at 19:38: since the base 63b99779b the trunk merged the R-OI branches (`cbc392c69`, oi-s3b), which add the problem kind `'instantiation'` to `NodeProblemKind` in `frontend/src/components/editor-v2/problems/registry.ts`; dcn-l24 adds `'dcn'` to the same union. `EditorV2.tsx` changed on both sides too (dcn-l24: one import and one mount line of `DcnProblemSync`; the trunk: the R-OI syncs). RC-14: the branch takes the trunk first.

## COSA

(1) `git merge --no-ff --no-commit alfonso-frontend-jjtl` (record its sha). Resolve `registry.ts` by union: the union type holds both `'instantiation'` and `'dcn'` (trunk's member first), both documentation paragraphs are kept whole (trunk's first), and the one that calls itself «the seventh» on the branch side is renumbered «the eighth»; nothing else changes. If `EditorV2.tsx` conflicts, keep both sides whole (every sync of the trunk and the `DcnProblemSync` import and mount). Any other conflict, or a conflict that needs more than these edits: `git merge --abort` and stop with Outcome: question.
(2) Gates on the merge: typecheck at the baseline of CLAUDE.md §17, the problems, simulation, ontological and sim suites, the full vitest run at its baseline, `npm run build`, `npm run check:docs`. `docs/log-inbox/*.md` conflicts are resolved entry by entry, both sides whole, trunk first.
(3) Commit the merge: subject `merge: alfonso-frontend-jjtl into dcn-l24 (P-2026-11-07-1945)`, body with the trunk sha, the resolution, the gates, `Model:` and `Co-Authored-By` trailers. Then the log entry appended to `docs/log-inbox/dcn.md` and this prompt's Status flip in one docs commit. No visual check is owed (the crops of P-2026-11-07-1900 stand; the resolution adds no behaviour). Outcome: done.

## NON FARE

No push, no merge into the trunk (the chat launches it afterwards), no edit beyond the resolution. Public repo: name no partner company.
