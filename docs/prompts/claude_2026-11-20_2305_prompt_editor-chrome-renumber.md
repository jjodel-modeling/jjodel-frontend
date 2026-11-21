# Editor chrome parity: renumber the branch's R-MT-33 and R-MT-34 before the merge

Prompt-ID: P-2026-11-20-2305
Chat: C-2026-11-20-1610
Front: multi-tab
Status: eseguito 2026-11-20 · lane fast · eb6a17b4d
Lane: fast (docs and code comments only, id renumbering on the branch, RC-14)
Depends: P-2026-11-20-1610 (closed 0d3eba646); P-2026-11-20-2257 (merge, stopped on Outcome: question)
Worktree: ~/jjodel-w-edchrome, branch editor-chrome-parity, at 0d3eba646 plus this prompt's commit
Request: none (follow-up of the merge question of P-2026-11-20-2257, recommendation adopted by chat C-2026-11-20-1610, RC-21)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks, no dev server. Every reply opens with [P-2026-11-20-2305 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked.

## COSA

The merge lane P-2026-11-20-2257 stopped: the trunk already holds R-MT-33 (editor groups persist per user and project, P-2026-11-19-2328) and R-MT-34 (full-screen dashboard, P-2026-11-20-1632), while this branch added its own R-MT-33 and R-MT-34 with different content (P-2026-11-20-1610). The branch's R-MT-35 and R-MT-36 collide with nothing. Under RC-14 the branch resolves the semantic conflict before the merge.

Renumber on this branch only: R-MT-33 becomes R-MT-37, R-MT-34 becomes R-MT-38. R-MT-35 and R-MT-36 stay.

1. `docs/decisions.md`: the two branch rows (headings and every in-row mention, including the amendments of R-MT-34 written by commits a4e38f8f3 and edf889c00). Do not touch any row that is not from P-2026-11-20-1610.
2. Every other mention of the branch's R-MT-33 and R-MT-34 in files this branch added or changed since d4ddede1d: the discovery report `docs/discovery/discovery_2026-11-20_editor_chrome_parity.md` and code comments (`EditorBar.tsx`, `EditorBar.scss`, `Toolbar.tsx`, `TextualTab.tsx`, `TextualTab.scss`, `DockManagerStyles.scss`, `representationSwitch.ts` and its test). Use `git diff d4ddede1d HEAD` to find them; list each changed line in the reply.
3. `docs/log-inbox/multi-tab.md`: do not edit existing entries (add-only). Add one correction entry, in the inbox grammar, saying that in the entries of P-2026-11-20-1610 R-MT-33 reads R-MT-37 and R-MT-34 reads R-MT-38, with the reason (id collision with the trunk found by P-2026-11-20-2257).
4. The closed prompt file of P-2026-11-20-1610 keeps its text and Status unchanged.

Gates: typecheck at baseline, `npm run check:docs`, `check:addonly` if it exists, `scripts/gates/__tests__/decisionsQuery.test.ts` and `docsDigest.test.ts`, vitest on `representationSwitch.test.ts`. Then `git -C ~/jjodel-release merge-tree --write-tree --name-only alfonso-frontend-jjtl HEAD` and count `- **R-MT-3[3-8]**` headings in the result's `docs/decisions.md`: each id exactly once. Report the counts.

Commit code comments and docs separately, pathspec only, trailers Model: claude-opus-5-5, Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>, Claude-Session: https://claude.ai/code/session_01DQt9R3rFJe5AMqrdonBxgx. Flip this prompt's Status to `eseguito <date> · lane fast · <sha>` in the last docs commit. Outcome: done.
