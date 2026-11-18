# Textual syntax T4a-2, closure (continues P-2026-11-02-1830 after the context ceiling)

Prompt-ID: P-2026-11-02-1930
Chat: C-2026-11-02-1814
Front: codegen
Status: eseguito 2026-11-02 · lane fast · bb620d93c · verifica visiva passata 2026-11-02 (chat, unattended)
Lane: fast (closure of work already written and tested)
Depends: P-2026-11-02-1830 (hard-stop at the ceiling, RC-51; uncommitted work in the tree, handoff in its lane folder)
Worktree: ~/jjodel-w-textt4a2, branch textual-t4a2 (the same tree)
Request: none (RC-51 continuation, no new words from Alfonso)

Before anything else run `pwd`, `git branch --show-current` and `git status --short`; if the tree is not
`~/jjodel-w-textt4a2` on `textual-t4a2` with 1830's changes in place (seven modified files and the two untracked
`frontend/src/codegen/textual/syntaxRecord.ts` and `__tests__/syntaxRecord.test.ts`), stop with `Outcome: blocked`. Every
reply opens with `[P-2026-11-02-1930 · session <id>]`. No subagents, no background tasks. One probe run per tool call.
Never `cat` a probe or gate log: grep the summary lines.

## COSA

Read `~/.jjodel-lanes/P-2026-11-02-1830/handoff.md` and only the parts of the diff you need. Scope and decisions are
those of 1830 and its handoff: do not extend them, do not read `~/Downloads/micron-proto`.

In this order: run the gates on the final tree; commit the code as soon as they are green; run the in-app check; write
the log entry and the `Status:` flips. Committing first protects the work from a second ceiling.

## Gates

From `frontend/`, through `node scripts/run-quiet.mjs`: `npx tsc --noEmit`, `npx vitest run src/codegen
src/components/editor-v2/__tests__/textualPicker.test.ts`, `npm run build`, `npm run check:docs`,
`npm run check:codegen-lazy` (both modes).

Commit `feat(codegen): store textual syntax annotations and show the language name (P-2026-11-02-1830)`, trailer `Model:`,
with the mutation bench and the 8-line T4a-1 grouping fix in the body, staging the nine files by name.

## In-app check

One probe in light theme, on a metamodel from a non-hardware domain, setting the record with `writeTextualSyntax`: the
language name in the picker, the tab header and the app-bar title; the annotated text printed and free of parse errors;
the same after a reload; the name back to the metamodel's after undo of the write, if that write has undo (state what
you measured); a malformed record showing its issue under the bar. Crops in `~/.jjodel-lanes/P-2026-11-02-1930/`.

## Closure

Log entry in `docs/log-inbox/codegen.md`, recording that the tests followed the code, contrary to 1830's prompt, and the
discovery notes. `Status:` flips of 1830 (`eseguito 2026-11-02 · hard-stop at the ceiling, closed by P-2026-11-02-1930`) and
of this prompt, in one docs-only commit, left uncommitted until the visual check per RC-17. No push, no merge. Final
message: «Decisions taken (unattended)», «Decisions awaiting Alfonso», then `Outcome:`.
