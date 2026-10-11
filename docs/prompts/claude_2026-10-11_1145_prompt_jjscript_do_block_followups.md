# JjScript parser: two follow-ups of the do-block fix (eval swallows `end`, a bare `do` parses clean)

Prompt-ID: P-2026-10-11-1145
Chat: C-2026-10-10-0039
Lane: fast (one source file, `frontend/src/jjscript/parser/parser.ts`, plus the existing test file `frontend/src/jjscript/__tests__/parserTermination.test.ts` and the log entry). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead. Unattended (lane auto): adopt your own `Recommended:` answers inside this perimeter and continue.
Depends: P-2026-10-10-0810
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-dotickets`, branch `do-tickets`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a
clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1145 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured by lane P-2026-10-10-0810, do not redo the analysis)

The do-block fix (`e5c8fa126`, merged `294a29084`) added a no-progress check to the `do` block loop in
`parser.ts`. Its log entry (`docs/log-inbox/jjscript.md`, entry of 2026-10-10 for P-2026-10-10-0810) filed two
observations, now tickets:

1. `do eval x.name end` parses as an eval of `x.name end`: `parseEvalCommand` reads to the end of the line and
   swallows the block's `end`. Relatedly, a `let ... in <non-command> end` body now fails with
   `Unexpected '<w>' in do block`, which names the wrong opener.
2. A bare `do` (no body, no `end`) parses clean as an empty block, `success === true`, also under `strict: true`.
   Jjodie's chat decides whether a message is JjScript with `parse(input, { strict: true }).success`
   (`jjscriptProvider.ts:41-46`), so the one-word message `do` is taken as a script.

## WHAT

1. **Tests first**, added to `parserTermination.test.ts`, each under both `strict: true` and the default, and run
   on the base first (negative control, record which fail):
   - `do eval x.name end` parses to a block whose single command is an eval of `x.name` (the `end` is the block's
     terminator, not part of the expression). The same with `eval` followed by a quoted string containing the
     word `end`, which must stay inside the string.
   - `do`, `do ` and `Do` alone: `success === false`, with an error that names the missing `end`. `do end` (an
     explicitly empty block): keep whatever it does on the base and record it.
   - a `let … in <non-command> end` body fails with a message that names `let` (or the block kind actually
     opened), not `do`.
   - every case the existing file already covers stays green, and the two AST snapshots stay unchanged.
2. **Fix**, in `parser.ts` only:
   - inside a block, an eval body stops before a bare `end` token that closes the block (a token, not a substring
     of a string literal or an identifier such as `endDate`);
   - a `do` block reaching end of input without its `end` is a parse error naming the missing `end`;
   - the no-progress error names the block kind that is open.
   Choose the smallest change that makes the tests pass; if one of the three needs more than a local change,
   stop with `Outcome: question` and a `Recommended:` line instead of widening the scope.
3. **Gates**: `npx tsc --noEmit` (the §17 set unchanged), the test file, the whole `src/jjscript` vitest suite,
   `npm run build`.
4. Commit the tests and the fix as one `fix(jjscript): …` commit, then the log entry in
   `docs/log-inbox/jjscript.md` closing the two tickets, then stop with `Outcome: done`. No merge.

## DO NOT

- Touch any file outside the three named above (not `lexer.ts`, `types.ts`, `jjscriptProvider.ts`, `Jodie.tsx`).
- Change how `detect` decides that a chat message is JjScript: the bare-`do` case is fixed in the grammar.
- Change any other error message.
- Add dependencies.

## REFERENCES

- `docs/PROTOCOL.md` P9, P13, P14, P16.
- `docs/discovery/discovery_2026-10-10_jjodie_reserved_identifiers.md` §4.4.
- `docs/prompts/claude_2026-10-10_0810_prompt_jjscript_do_block_freeze.md`.
