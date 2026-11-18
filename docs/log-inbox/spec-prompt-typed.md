# log-inbox — lane «spec-prompt-typed» (P-2026-10-31-2025)

Entries written by the SPEC §3.5 prompt-typed-form lane (front release-3-2) on branch `spec-prompt-typed`,
worktree `jjodel-w-specprompt`. Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim
and in this order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-31 — docs(jjtl): SPEC §3.5 documents prompt(message, Type [, default]) (P-2026-10-31-2025)
**Prompt**: rewrite SPEC §3.5 for both prompt forms (bare name in second position is the type, any other expression the default, typed `EString`), one example each, say whether `input` shares the rule, update the grammar diagram if it shows the arguments; no code changes.
**Files touched**: `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/components/GrammarDiagram/types.ts` (8e5ee511b); this inbox, prompt file Status line
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (docs only; the diagram prints the EBNF string verbatim, GrammarDiagram.tsx:108)
**Notes**: Rule read in parser.ts:803-818 (JjEL path) and :1457-1473 (legacy). Both reject `prompt(message)`, so §3.5 documents `prompt(message, default)`, not `prompt(message [, default])`. `input` does not share the rule (string-literal kind). Not touched: §3.5 and §8.3 status notes saying prompt/input return null; Appendix A comment. Typecheck 0 (types.ts edited); check:docs below.
**Prompt document name**: 2026-10-31 20:25

**Ticket** (P-2026-10-31-2025): the executor drops the default of `input(message, kind, default)`: `evaluateExpressionAsync` passes `undefined` to `showInput` (executor.ts:2686-2691), so the parsed `defaultValue` never reaches the dialog.

## 2026-10-31 — merge: spec-prompt-typed into alfonso-frontend-jjtl (P-2026-10-31-2230)
**Prompt**: Bring `spec-prompt-typed` at `164a91bce` into the trunk `alfonso-frontend-jjtl` with one `--no-ff` merge commit of the explicit sha (RC-14), probes on the merge-tree, union resolution of decisions and log inboxes if they conflict, gates on the merge commit, then the Status flip and this entry after the GO.
**Files touched**: merge commit 4586d0e17 (4 files from the branch: `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/components/GrammarDiagram/types.ts`, the branch prompt and inbox); `docs/prompts/claude_2026-10-31_2230_prompt_merge_spec-prompt-typed.md` Status line; `docs/log-inbox/spec-prompt-typed.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat on 3001, unattended: docs-only merge, SPEC §3.5 and the grammar diagram string in types.ts)
**Notes**: Tip moved during the vitest baseline: a20220f45, 92e099b78 (another chat, docs only) accepted as trunk; re-measured at 92e099b78: zero conflicts, tree b69080093 = index. No file on both sides, no union, 1 probe once. Gates on 4586d0e17: typecheck 0, typecheck:scripts 0; vitest 12583, 471 files, same 9 red at import; hooks 967; build 0; check:docs 5/5 (prompt said 4/4); agents, scripts, addonly PASS. Lane board untouched; 3001 up, not restarted.
**Prompt document name**: 2026-10-31 22:30
