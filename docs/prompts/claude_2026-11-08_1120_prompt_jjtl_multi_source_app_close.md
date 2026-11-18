# S4: close the run dialog lane after its context ceiling, with two visual fixes

Prompt-ID: P-2026-11-08-1120
Chat: C-2026-11-03-1202
Front: hw-notation
Status: eseguito 2026-11-08 · lane full · af756e1ea (two visual fixes), 7849b01ca (SPEC), 67e2f1a7f (report)
Lane: full (continues P-2026-11-08-1026 after its context ceiling; unattended)
Depends: P-2026-11-08-1026
Worktree: ~/jjodel-w-multisrcapp, branch jjtl-multi-source-app (the same tree, with its uncommitted work)
Request: none (continuation of P-2026-11-08-1026)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-multisrcapp` on `jjtl-multi-source-app`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1120 · session <id>]`. No subagents, no background tasks. One probe run per tool call. Print only summary lines of suites and probes. Commit as soon as each item's gates are green. The repo is public: name no partner company and no path outside this tree in anything committed.

## COSA

Read only `~/.jjodel-lanes/P-2026-11-08-1026/handoff.md` and `git status`. Do not redo the design.

1. Commit the uncommitted code and tests as they are (code commit), after typecheck and the new tests pass.
2. Two defects the chat found on `crops/2_dialog_list_open.png` (RC-23), to fix in the dialog's own `.scss` with new classes only, no renamed class:
   (a) the checkbox of each model in the open «Also include» list renders as a full-width text-input box with a divider, not as a checkbox: a global input rule is reaching it. Give the row a real checkbox of the project's size, label beside it, one row per model;
   (b) the open list floats over the next field and covers its label («Name for the generated … instance»). Keep no layout shift of the form, but do not cover a label: either the list opens inside the row's own reserved height with a scroll, or it opens upward or as a popover anchored so that no label is hidden. Choose, say why.
   Rerun the probe, replace the three crops, and view each of them yourself before committing.
3. Write the rest of the report `docs/discovery/discovery_2026-11-08_jjtl_multi_source_app.md` from the handoff, in English, `## 0. Answer in brief` first, each figure marked measured or read; SPEC §9; the log entry; the `Status:` lines of this prompt and of P-2026-11-08-1026. Note the candidate defect of the handoff (`envLookup(x) + _w` with `x` unbound succeeds) as a ticket with `lane-run ticket --front hw-notation --found P-2026-11-08-1026`, with its reproduction; do not fix it.
4. Gates: typecheck, the FULL vitest suite, build, `check:docs`.

## DOVE

The files of the handoff's scope, the dialog's `.scss`, the crops in `~/.jjodel-lanes/P-2026-11-08-1026/crops/`. Stop with `Outcome: question` for a critical-zone file or a renamed CSS class.

## COME

Atomic commits, named paths, docs and code never in one commit. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
