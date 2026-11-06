# Multi-tab, lane L1: a model tab stops rewriting the viewpoint of the other open tabs

Prompt-ID: P-2026-11-07-0105
Chat: C-2026-11-06-2333
Front: multi-tab
Status: da eseguire
Lane: fast (two files, no critical zone; app check with crops)
Depends: R-MT-16, docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §1.1, §2.3, §7 row L1
Worktree: ~/jjodel-w-mtl1, branch multi-tab-l1, at this prompt's commit on alfonso-frontend-jjtl (node_modules by the P14 symlink, removed at the end)
Request: none (lane L1 of the discovery's plan, launched under /lane auto)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 critical-zone file, no new dependency, no subagents. Every reply opens with [P-2026-11-07-0105 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Commit as soon as the gates are green.

## COSA

The defect (report §1.1, W4), live today between tabs of different models, because inactive rc-dock tabs stay mounted (§2.3): at `components/abstract/tabs/EditorSwitch.tsx:93` the mount-only restore of a model's saved viewpoint runs for every mounting tab, so opening model B switches the syntax shown in model A's tab; at `:108` every mounted `EditorSwitch` writes the root viewpoint as its own model's preference, so a pick in A is saved as B's preference too. Re-read both sites first; line numbers are from `6fcf5d5df`.

(1) Fix, per R-MT-16: the restore at `:93` runs only when the mounting tab is the dock's active tab; the preference at `:108` is written only by the instance whose picker changed, for its own model (the picker lives in `components/editor-v2/Toolbar.tsx`). No per-tab viewpoint state yet: that is lane L2. If the fix cannot stay in these two files, stop with Outcome: question and say which file and why.
(2) Tests first, red then green, beside the existing tests of these components (create one test file if none exists; it counts as the third file).
(3) Gates, one tool call each, from frontend/: npm run typecheck (baseline in CLAUDE.md §17), full npx vitest run (known import reds rerun alone), npm run build, npm run check:docs.
(4) App check on a free port (check with lsof first; never 3000, 3001, 3003), light theme, scale 1, crops in ~/.jjodel-lanes/P-2026-11-07-0105/. Copy the app probe of a recent lane folder (for example ~/.jjodel-lanes/P-2026-11-05-2220/probe.mjs, banner and What's new suppressed). Fixture: one project with two models of one metamodel and one syntax viewpoint. Scenes, each measured from the DOM and the store, before (on the base commit) and after: A open on the viewpoint, B opened on abstract syntax, A still shows the viewpoint; a pick in B leaves A's saved preference unchanged; reload, A and B reopen on their own preferences. Stop the server.
(5) Log entry in docs/log-inbox/multi-tab.md via the log-entry skill (Notes under 500 characters), Status flip, both uncommitted (RC-17). Remove the node_modules symlink. No push, no merge.

## DOVE

frontend/src/components/abstract/tabs/EditorSwitch.tsx, frontend/src/components/editor-v2/Toolbar.tsx, one test file. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §1.1, §2.3, §6, §7; docs/decisions.md R-MT-1, R-MT-16, R-LAY-11, R-LAY-19.
