# Multi-tab demo project: finish the build, export and deliver (continuation of P-2026-11-07-1417)

Prompt-ID: P-2026-11-07-1439
Chat: C-2026-11-07-0425
Front: multi-tab
Status: da eseguire
Lane: full (builds a demo project through the running app; no source change)
Depends: P-2026-11-07-1417 and its handoff ~/.jjodel-lanes/P-2026-11-07-1417/handoff.md
Worktree: ~/jjodel-w-mtdemo, branch multi-tab-demo, at this prompt's commit (node_modules symlink already in place; remove it at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (continuation after the context ceiling)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Read `handoff.md` of 1417 first and nothing of its log. No source changes, no subagents. Dev servers on a free port, stopped before exit (only your own PIDs). Every reply opens with [P-2026-11-07-1439 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe or build log. Scripts stay in `~/.jjodel-lanes/P-2026-11-07-1417/` (copy into `~/.jjodel-lanes/P-2026-11-07-1439/` if you change them).

## COSA

Items (3), (4) and (5) of `docs/prompts/claude_2026-11-07_1417_prompt_multi_tab_demo_project.md`, from where the handoff stops: look at Apartment's «Floor plan» first; run `build.mjs` end to end in a fresh profile (both models, both viewpoints, positions); check the two-tab effect and the viewpoint switch inside one tab; save, Download Project, re-import into a second fresh profile and compare object counts and three positions per viewpoint; deliver `~/Downloads/jjodel-multitab-demo.jjodel`, `~/Downloads/jjodel-multitab-demo.md` (English, the four steps, the two limits, and what differs from the request: colour by subclass rather than by `DeviceKind`) and two crops (one per tab) next to them; then the Status flips of 1417 and this prompt and one log entry, one docs commit. If the Save, File-menu or file-drop steps of `build.mjs` fail, fix the script, not the app. Exit with Outcome: done.

## HARD STOP

After the docs commit. Any change outside the lane folders, `~/Downloads/` and the docs files is a stop with Outcome: question. No push, no merge.
