# Multi-tab lane 6: the remaining `children[0]` readers go through the active group

Prompt-ID: P-2026-11-19-2336
Chat: C-2026-11-18-2337
Front: multi-tab
Status: da eseguire
Lane: full (small, no critical-zone file)
Depends: lanes 2a, 2b, R-MT-31, R-MT-32 merged into the trunk (d29dcd79c)
Worktree: ~/jjodel-w-mtread, branch multi-tab-readers, created from the trunk at d29dcd79c, at this prompt's commit
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (Alfonso 2026-11-19 23:21 «prosegui fino a chiusura»; §8.1 row 6 of the discovery)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. Dev server on a free port (lsof first; never 3000, 3001, 3003, 3061, 3062, 3081, 3087, 3095, 3790, 4700, nor the port of the persistence lane running in ~/jjodel-w-mtpers), left running at the hard stop with port and pid. Every reply opens with [P-2026-11-19-2336 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs; never cat a log. Read only §2.6 and §8.1-§8.2 (row 6) of `docs/discovery/discovery_2026-11-19_multi_tab_editor_groups.md` and R-MT-30, R-MT-32 from `docs/decisions.md`; read code by regions.

## COSA

Five files still take "the active tab" as the active tab of the dock's first panel (`dockbox.children[0]`), so with two groups they act on the left group even when Alfonso works on the right one: `Console.tsx`, `navigationUtils.ts`, `jjscript/executor/utils.ts`, `codegen/ui/openTemplateEditor.ts`, `codegen/ui/canvasSelection.ts` (paths under `frontend/src/`). Re-grep `dockbox\??\.children\??\.\[0\]` first: list every hit left in the whole `src` (tests and comments excluded) with file and line, and say which are in the five files.

Each reader of the five files goes through the existing accessors of `components/abstract/tabs/dockGroups.ts` (`activeGroup`, `activeTabId`) or `DockManager.activeGroupPanel()`, whichever the file can import without a cycle; no new accessor unless none fits, and then a question. Behaviour with one group is unchanged. A hit outside the five files: report it, do not touch it.

Files approved: the five, their tests if any exist, a new small test where a pure piece can be tested. Anything else needs a question. No decisions row needed unless a rule changes; if one does, ask.

## COME

Gates: typecheck at baseline, vitest green (the three known import failures excepted), build ok, `npm run check:docs`. Mouse probe at 1600, real clicks, two groups with a different model in each, group 2 active: run a JjScript line from the console that reads the active model and check it names group 2's model; a navigation from the console or a link that targets the active tab lands in group 2; with codegen on (Advanced), canvas selection and the template editor act on group 2's model. Then make group 1 active and check one of them flips. No console errors. Crops in the lane folder. Commit code and docs separately, pathspec only, with the trailers Model: claude-opus-5-5, Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>, Claude-Session: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP.

HARD STOP for Alfonso's visual check, dev server running.
