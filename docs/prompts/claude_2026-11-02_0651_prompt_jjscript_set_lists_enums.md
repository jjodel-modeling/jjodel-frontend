# JjScript: M1 `set` accepts lists for many-valued attributes and enumeration literals (R-TXT-25 (2))

Prompt-ID: P-2026-11-02-0651
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: full, Phase 2 (inline discovery with file list first)
Depends: T2c (`frontend/src/codegen/textual/modelLines.ts` blocks texts with many-valued attributes today); R-TXT-25
Worktree: ~/jjodel-w-jjsset, branch jjscript-set-lists (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, 2026-11-02 06:43, «Ok alle raccomandazioni»

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjsset` on
`jjscript-set-lists`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-0651 · session <id>]`.
No subagents, no background tasks. Keep context low.

## COSA

1. JjScript M1 `set h.attr = [v1, v2, ...]` on a many-valued attribute replaces its values with the list (empty list
   clears). On a single-valued attribute a list is an error with a clear message.
2. JjScript M1 `set h.attr = Literal` on an enum-typed attribute accepts the literal (by name, and qualified
   `Enum.Literal` if the grammar already has that form); an unknown literal is an error naming the enumeration.
3. `modelLines.ts` then writes many-valued attributes with a list instead of blocking, and enum values as literals;
   its blocking marker for many-valued attributes is removed.
The planner, preview and `applyAsOneStep` path must handle both (the effects planner lists the write; undo restores).

## DOVE

Inline discovery first: the M1 `set` command (`frontend/src/jjscript/executor/commands/set.ts`), the effects planner,
the parser of JjScript values, and `modelLines.ts`; list files in your first message. If more than 5 files or the
critical zone, stop with `Outcome: question`.

## COME

Tests first: list set on many-valued, list on single-valued (error), enum literal by name, unknown literal (error),
planner preview of both, undo. Then the T2c round trip: a text with a two-valued attribute and an enum value creates a
model equal to the source up to ids. Existing JjScript tests stay green.

## Lane discipline

`git add <specific files>` only. Commits `feat(jjscript): set lists and enum literals (P-2026-11-02-0651)` and, if
separate, `feat(codegen): model lines write lists and literals (P-2026-11-02-0651)`. Gates: `npx tsc --noEmit`,
`npx vitest run src/jjscript src/codegen`, `npm run build`, `npm run check:docs`. Visual check not applicable unless
the preview UI changes; say which. Log entry in `docs/log-inbox/codegen.md` and the `Status:` flip (edit the line) in
one docs-only commit. No push, no merge. End with «Decisions taken (unattended)», «Decisions awaiting Alfonso»,
`Outcome: done | hard-stop | question | blocked`.
