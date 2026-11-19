# Multi-tab editor groups, lane 2b finish: the group-1 widening, probe, gates, commits

Prompt-ID: P-2026-11-19-1915
Chat: C-2026-11-18-2337
Front: multi-tab
Status: eseguito 2026-11-19 · lane full · 021642d48, b25a2b494 · verifica visiva passata 2026-11-19
Lane: full (finish of P-2026-11-19-1820, stopped at the context ceiling, RC-51)
Depends: P-2026-11-19-1820 (uncommitted work in the tree, six files; handoff in `~/.jjodel-lanes/P-2026-11-19-1820/handoff.md`, full diff in `handoff.diff`, base and HEAD 850775e3b)
Worktree: ~/jjodel-w-mtg2b, branch multi-tab-groups-2b, at this prompt's commit, with the uncommitted work of P-2026-11-19-1820 in the tree
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (words in `~/.jjodel-lanes/P-2026-11-19-1915/request.md`)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short. HEAD is this prompt's commit. The tree is NOT clean by design: it carries exactly the six files of the parent (`DockManagerStyles.scss`, `TabsOverflowMenu.tsx`, `BottomToolbar.tsx`, `Dashboard.tsx`, `Navbar.tsx`, `navbar.scss`) and `git diff HEAD` matches the parent's `handoff.diff`; anything else: stop with Outcome: blocked. No subagents, no background tasks. The parent's dev server may still run on 3082 (pid 57444): reuse or restart it there; restart Vite after any `.tsx` edit before probing (the parent's note). Leave it running at the hard stop with port and pid. Every reply opens with [P-2026-11-19-1915 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs; never cat a log. Read the parent prompt and handoff, not the code it already changed, except where you fix.

## COSA

1. The open defect: in the full probe run, closing a tab in group 1 left group 1 showing the project summary, group 1 widened to about 1034 px and pushed group 2's strip off-screen at 1280. Find whether the strips cause it or it predates them (compare with the trunk at 9ada8807b on the same steps, read-only), and fix it. Expected: a group whose only visible content is the hidden project summary does not take width from the other groups; at most, when group 1 has no model tab left and another group exists, the remaining groups share the width. If the fix needs `DockManager.tsx` or `tabs/dockGroups.ts` (2a files), they are approved for this; anything else needs a question.
2. Then read the 1280 squeezed-tab failure again after the fix; if it remains, fix it within the same files.
3. Rerun the whole mouse probe of the parent at 1600 and 1280; all eight checks must pass. Gates: typecheck at baseline, vitest green (three known import failures excepted), build ok, `npm run check:docs`. Crops of both strips at both widths in this lane folder.
4. Commits: code (pathspec, the parent's six files plus any you touched), then docs: one sentence added to R-MT-30 for the strips and the generator panels now showing their own strip (write it inside the row text, never in the header: the register grammar refuses free text in a header), and run `scripts/gates/__tests__/decisionsQuery.test.ts` and `docsDigest.test.ts` before committing it.

HARD STOP for Alfonso's visual check, dev server running. The log entry comes after his GO.
