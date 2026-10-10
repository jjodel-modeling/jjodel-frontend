# JjScript parser: a `do` block whose body is not a command must not loop forever

Prompt-ID: P-2026-10-10-0810
Chat: C-2026-10-10-0039
Lane: fast (one source file, `frontend/src/jjscript/parser/parser.ts`, plus one new test file and the log entry; root cause already measured). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-dofreeze`, branch `do-freeze`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a
clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-0810 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)

Source: `docs/discovery/discovery_2026-10-10_jjodie_reserved_identifiers.md` §4.4, on branch `jjodie-reserved`
(commit `1153700ce`). Read §4.4 with `git -C ~/jjodel show 1153700ce:docs/discovery/discovery_2026-10-10_jjodie_reserved_identifiers.md`.

Every Jjodie chat message is first parsed as JjScript (`Jodie.tsx:508`, `jjscriptProvider.ts:41-46`). A message
whose first token is `do` enters the standalone block branch (`parser.ts:173-180`) and then `parseBlockBody`.
There, `commands.push(this.parseCommand())` (`:1041`) loops while not at end (`:1025`), and `parseCommand` on a
non-command word returns an `eval` node through `remainingInput()` (`:182-186`, `:1009-1012`) without consuming a
token. The loop pushes until the heap is exhausted. Measured: `do not use copy`, `Do not use copy`, `do it again`
and `Do the same without copy end` each end in `JavaScript heap out of memory` under a 256 MB heap; in the browser
the tab's main thread blocks and the renderer crashes about 16 s later, before any model call. Controls
(`please avoid copy`, `don't use copy`, `do create class A end`) return in 1 ms or less.

## WHAT

1. **Tests first.** New `frontend/src/jjscript/__tests__/parserTermination.test.ts`. Every case runs `parse()` under
   both `strict: true` and the default, inside a guard that fails the test instead of hanging (for example a
   token-count or iteration bound checked through the result, or vitest `timeout` of 1000 ms per case):
   - `do not use copy`, `Do not use copy`, `do it again`, `Do the same without copy end`, `do x.name end` and
     `do` alone each return within the bound with `success === false` (or, for `do x.name end`, whatever the
     current grammar intends, see 3);
   - `do create class A end` still parses to the same AST as on the base commit (snapshot taken on the base);
   - a `forall … do … end` that is valid today parses unchanged.
   Run the file on the base commit first and record that it fails or times out (the negative control).
2. **Fix.** In `parser.ts`, every loop that calls `parseCommand()` or `parseBlockBody()` until a terminator
   (`parseBlockBody` and any sibling found by `grep -n "parseCommand()" parser.ts`) records the position before the
   call; if the position has not advanced, it stops with a parse error that names the offending token, for example
   `Unexpected 'not' in do block`. No other behaviour changes.
3. **`do <eval> end`.** If the grammar documents an `eval` statement inside a block, say so in the report and keep
   it working by making that branch consume up to the block terminator; otherwise it becomes a parse error like the
   rest. Pick the smaller change and state which one.
4. **Gates.** `npx tsc --noEmit`, the new test file, the whole `src/jjscript` vitest suite, `npm run build`.
5. **Browser check.** Reuse the gitignored probe `frontend/scripts/smoke/_tmp_jjres_tworun.ts` if present in
   `~/jjodel-w-jjodiereserved` (copy it, do not commit it), variant A (`do not use copy` as second message) against
   this tree's own Vite on a free port: the second send must return, the mocked model must receive call #2, and no
   `Target crashed`. Report the heartbeat's maximum gap.
6. Commit the test and the fix as one `fix(jjscript): …` commit, then the log entry, then stop with
   `Outcome: done`. No merge.

## DO NOT

- Touch `lexer.ts`, `types.ts`, `defaultPrompts.ts`, `Jodie.tsx`, `ScriptBlock.tsx` or any Jjodie file: lane
  P-2026-10-10-0045 owns them in parallel.
- Change how `detect` decides that a chat message is JjScript (a separate question, record any observation).
- Change error messages other than the new one.
- Add dependencies.

## REFERENCES

- `docs/PROTOCOL.md` P9, P13, P14, P16.
- Discovery report above, §4.4 and §7 (probe commands).
