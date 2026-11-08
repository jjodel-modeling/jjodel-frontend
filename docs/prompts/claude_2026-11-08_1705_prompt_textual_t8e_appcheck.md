# T8e continuation: app check and docs

Prompt-ID: P-2026-11-08-1705
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-08 · lane textual-t8e-match · 52c8422ea
Lane: full, continuation of P-2026-11-08-1625 after its context ceiling (RC-51)
Depends: P-2026-11-08-1625 (commits 723eb1233, ad25337a7, 52c8422ea; gates green on 52c8422ea), its ~/.jjodel-lanes/P-2026-11-08-1625/handoff.md and handoff.diff, table-before.md, table-after.md
Worktree: ~/jjodel-w-textt8e, branch textual-t8e-match (same worktree)
Request: Alfonso 2026-11-08 16:23 «procedi in lane auto»

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Read handoff.md first. No source change: if the app check shows a defect, stop with Outcome: question and a Recommended line. Every reply opens with [P-2026-11-08-1705 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole log. If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-1705/handoff.md first.

## COSA

(1) **App check** with crops in ~/.jjodel-lanes/P-2026-11-08-1705/, reusing the T8c probe (~/.jjodel-lanes/P-2026-11-08-0739/) and the TABFIX probe (~/.jjodel-lanes/P-2026-11-08-0859/), copied with what they import, on its own port: 1-swap (re-import a text with two swapped homonyms: the confirm panel pairs each with its own model object, read from the DOM rows), 2-offscreen (select a canvas node, pan it out of the viewport so it leaves the DOM, open the Text tab: its span is highlighted, read from Monaco's decorations; and no SELECT_NODE or new publication, as TABFIX measured). Measure from the DOM and Monaco, not from the screenshot.

(2) **Docs**: one log entry in docs/log-inbox/codegen.md via the log-entry skill for the whole T8e (both Prompt-IDs, the three commits, the bench numbers before and after in short, the grid and the Recommended line keep 0.6 and 0.2, the read path _lastSelected.node, Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flips of the 1625 prompt and this one; left uncommitted (RC-17). Edit only your new entry's lines. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

No source file. docs/log-inbox/codegen.md (your entry only), the two prompts' Status lines, files in ~/.jjodel-lanes/P-2026-11-08-1705/.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-1625/handoff.md; the T8c, T8d and TABFIX log entries in docs/log-inbox/codegen.md.
