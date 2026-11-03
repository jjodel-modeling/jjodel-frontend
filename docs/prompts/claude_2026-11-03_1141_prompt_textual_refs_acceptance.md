# Textual references outside the text, in-app acceptance (continues P-2026-11-03-1045 after the context ceiling)

Prompt-ID: P-2026-11-03-1141
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-03 · lane fast · 5a9ce5ec4 (no code in this lane) · verifica visiva passata 2026-11-03 (chat, RC-23, crops in ~/.jjodel-lanes/P-2026-11-03-1141/; R-TXT-32 ratified by Alfonso)
Lane: fast (closure of work already written and unit-tested)
Depends: P-2026-11-03-1045 (hard-stop at the ceiling, RC-51; code commit 5a9ce5ec4, handoff in its lane folder)
Worktree: ~/jjodel-w-textrefs, branch textual-refs-outside (the same tree)
Request: none (RC-51 continuation, no new words from Alfonso)

Before anything else run pwd, git branch --show-current, git log -1 and git status --short: HEAD is this prompt's commit on top of 5a9ce5ec4 and the tree is clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-03-1141 · session <id>]. No subagents, no background tasks except the foreground probe server. Never cat a gate or probe log: summary lines only. One probe run per tool call. A probe result is valid only if its mtime follows the run. Commit as soon as a step is green.

## COSA
Read ~/.jjodel-lanes/P-2026-11-03-1045/handoff.md only; do not extend scope and do not change the syntax or docs/decisions.md. R-TXT-32 is provisional and amends the ratified R-TXT-4: this branch does not merge in this lane. If the app shows a defect in the code, fix it with a test first; if the fix needs a CLAUDE.md 3.2 file, stop with Outcome: question.

(1) Rerun npx tsc --noEmit on the commit, then npm run check:docs, through node scripts/run-quiet.mjs. (2) In-app acceptance on a free port: a model with a single-valued reference and a list holding a target in a second model opens; its Text tab parses and shows @"<id>"; an attribute edit typed in the Text tab applies; the reference is intact; one Undo restores both. Report plainly that the setup of the outer reference is a direct model write, not a canvas gesture, if it is. (3) Measure in the app open question 1 (a deleted target: null or dangling id, and whether the missing-target warning fires) and open question 3 (deleting one outer entry from a list: does the run unlink it, else refusal unwritable). (4) Briefs of the RISC-V prototype, read-only: the text prints and parses; report the figures. (5) Crops of the Text tab, light theme, device scale 1, in ~/.jjodel-lanes/P-2026-11-03-1141/: printed reference, after the edit, after Undo, the outer refusal. (6) Log entry in docs/log-inbox/codegen.md and the Status flips of 1045 and this prompt, written and left uncommitted until the visual check (RC-17). Stop the probe server.

No push, no merge. The repo is public: name no partner company. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then Outcome: hard-stop, or a handoff if the ceiling comes first.
