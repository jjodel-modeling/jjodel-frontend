# Textual syntax, ticket D2d: the suggest widget's selected row overflows to the right

Prompt-ID: P-2026-11-08-0738
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: fast (CSS of the Text tab's suggest widget; crops)
Worktree: ~/jjodel-w-textd2d, branch textual-d2d-suggest (from trunk ce18b0c02, own node_modules)
Request: Alfonso 2026-11-08 07:36 «Procedi con tutto in lane auto»

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency, no global Monaco rule (ticket #206: global rules on Monaco live in skeleton.scss and are worked around only in the Text tab; scope every rule to the Text tab's root class). Every reply opens with [P-2026-11-08-0738 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD.

## COSA

Ticket D2d (found in lane D2c, 2026-11-06): in the Text tab's completion widget the blue bar of the selected row overflows past the widget's right edge. First measure it from the DOM (the selected row's right edge against the widget's right edge, in px) and find which rule causes it (likely a width or padding rule on Monaco's suggest rows from the Text tab or skeleton.scss). Fix it with a rule scoped to the Text tab, light theme only (D-UI-15). Acceptance: the selected row's right edge is at or inside the widget's right edge, measured, with no change to row height or text position. Crops in ~/.jjodel-lanes/P-2026-11-08-0738/: 1-before, 2-after (same suggest list, same row selected), reusing the probe of ~/.jjodel-lanes/P-2026-11-07-1622/ on its own port. Gates: npm run typecheck, npm run build, npm run check:docs, and the textual tests (npx vitest run src/codegen/textual). Log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters), Status flip, both uncommitted (RC-17); edit only your entry's lines. No push, no merge.

## DOVE

frontend/src/codegen/textual/ui/TextualTab.scss (or the stylesheet the Text tab already uses for Monaco widgets). Nothing else; ask first. Grep before any new class.

## RIFERIMENTI

The D2c log entry in docs/log-inbox/codegen.md; ticket #206 (skeleton.scss margin rules).
