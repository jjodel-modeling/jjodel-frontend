# Textual syntax, step B1 closure: in-app check, crops, docs (continues P-2026-11-04-0020 after the context ceiling)

Prompt-ID: P-2026-11-04-0046
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: fast (closure of work already written and unit-tested)
Depends: P-2026-11-04-0020 (hard-stop at the ceiling; code at 52154bc57, handoff in its lane folder)
Worktree: ~/jjodel-w-textb, branch textual-b-navigation (the same tree)
Request: none (RC-51 continuation, no new words from Alfonso)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 52154bc57 and the tree is clean, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md or the core; no new dependency. Every reply opens with [P-2026-11-04-0046 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. No subagents, no background tasks except the foreground probe server. Never cat a gate or probe log: summary lines only, through node scripts/run-quiet.mjs LABEL -- CMD. One probe run per tool call; a probe result is valid only if its mtime follows the run. A fix gets a test red first and its own commit.

## COSA
Read ~/.jjodel-lanes/P-2026-11-04-0020/handoff.md. (1) One colour change, chat decision: names and references use cyan-600 `#0891b2` instead of `#06b6d4`, for contrast on white (about 4.5:1); keep the rest of the theme. (2) npm run check:docs. (3) In the app, on a free port, keystrokes in the Text tab on demoESM and on a second non-hardware model (the library or turnstile example): highlighting of every role, an unresolved reference shown as such, folding (measure the decorations margin with folding on, in px, before and after), go to definition (F12), find references (Shift+F12 on a name with two uses), hover on a class, a feature and a reference showing metaclass, bounds and documentation where the data has it, the EBNF tab highlighted, a broken text still highlighted and not applied, a JjScript editor open beside the tab keeping its colours, the Text tab editors still mounting (dynamic import). Say which steps are keystrokes and which setup is a direct write. (4) Crops of every visible change, light theme, device scale 1, in ~/.jjodel-lanes/P-2026-11-04-0046/, Quick tip toast closed. (5) RISC-V Briefs, read-only: the service answers on them, figures. (6) Log entry in docs/log-inbox/codegen.md (Notes under 500 characters) and the Status flips of 2350, 0020 and this prompt, written and left uncommitted until the visual check (RC-17). Stop the probe server. Public repo: name no partner company. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then the Outcome.
