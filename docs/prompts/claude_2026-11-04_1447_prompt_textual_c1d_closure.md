# Textual syntax, step C lane C1d, closure: app check, crops, docs (continues P-2026-11-04-1355 after the context ceiling)

Prompt-ID: P-2026-11-04-1447
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: fast (closure of C1d; code at cc7235435)
Depends: P-2026-11-04-1355 (hard-stop at the ceiling after items 1-7; handoff in its lane folder)
Worktree: ~/jjodel-w-textc1, branch textual-c1-operators (the same tree)
Request: none (RC-51 continuation, no new words from Alfonso)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of cc7235435 and the tree is clean, otherwise stop with Outcome: blocked. Same rules as P-2026-11-04-1312: no CLAUDE.md 3.2 file, no docs/decisions.md, no core, no executor, no new dependency, no change under ui/ or in languageService.ts; every reply opens with [P-2026-11-04-1447 · session <id>]; final line Outcome: done | hard-stop | question | blocked; summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call, a probe result is valid only if its mtime follows the run. Read ~/.jjodel-lanes/P-2026-11-04-1355/handoff.md once and the probe of C1c in ~/.jjodel-lanes/P-2026-11-04-1241/ (its setup is the model to copy: direct write, localStorage flag for the banner, light theme, scale 1); no other reading tour.

## COSA

(8) The app check of the 1312 prompt, on a free port, with a metamodel of this lane's own (the port corpus of portCorpus.ts, or a module with input and output ports, a port with an optional name and a typed width; no partner metamodel): the Text tab in C-like and in Pascal/Ada shows the port lines; keystrokes change a width, rename a port, add a port line, remove the name of a port; each applies with one Undo or is refused with a reason, never half applied; the EBNF mode shows the four shapes. Crops per edit and per mode in ~/.jjodel-lanes/P-2026-11-04-1447/, light theme, scale 1, donation banner closed or suppressed. Report the outline as it shows today for the per-item keyword (one input group per port, the open point of the 1355 report) with one crop, no fix. Stop the probe server.

(9) Log entry in docs/log-inbox/codegen.md covering P-2026-11-04-1312, 1355 and this prompt (Notes under 500 characters; Corregge and Causa are the dash or their allowed values; the 1355 decisions listed: stricter D3 rule, roots uncontained and the driver keyword in the Briefs record, the per-item outline grouping as an open point), the Status flips of 1312, 1355 and this prompt, left uncommitted (RC-17). Run npm run check:docs after the entry. No code change unless the app check shows a half-applied edit: then a test red first, its own commit, and the gates again (tsc, full vitest, build).

No push, no merge. Public repo: name no partner company. Final message: what was verified and how (direct model write is not a canvas gesture; a unit test is not the app check), Decisions taken (unattended), Decisions awaiting Alfonso, then the Outcome.

## DOVE

The probe script and crops in the lane folder; docs/log-inbox/codegen.md; the Status lines of docs/prompts/claude_2026-11-04_1312_prompt_textual_c1d_port_line.md, claude_2026-11-04_1355_prompt_textual_c1d_cont.md and this file. Code only in the case of (9).

## RIFERIMENTI

docs/prompts/claude_2026-11-04_1312_prompt_textual_c1d_port_line.md; ~/.jjodel-lanes/P-2026-11-04-1355/handoff.md; ~/.jjodel-lanes/P-2026-11-04-1241/ (C1c probe and crops); docs/decisions.md R-TXT-41 (D3), R-TXT-39.
