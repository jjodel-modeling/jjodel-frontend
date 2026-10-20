# JjEL parser: a keyword is a valid member name after `.` (implementation)

Prompt-ID: P-2026-10-21-0011
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (JjEL parser, shared by validation, JjTL and the simulator)
Status: da eseguire
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-20-2350
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-kwmember`, branch `jjel-keyword-member`, cut from `alfonso-frontend-jjtl` at the commit that
adds this prompt. Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link `frontend/node_modules` (P14),
remove it at the end. Heavy tier (RC-16), effort `high`. Single phase.

## Lane discipline

Every reply opens with `[P-2026-10-21-0011 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 60 minutes. Read only the parser function you edit and
its tests. Commit the code as soon as the gates are green.

## COSA

Slice S1 of the bit-vector values (commit `de0ce082c`) implements `x.and(y)`, `x.or(y)`, `x.not()` but they do not
parse: `and`, `or`, `not` lex as keywords and the parser accepts only an `IDENTIFIER` after `.` (`parser.ts` near line
402, member access). Make the member-name position after `.` (and after `?.` if the parser has it) accept any keyword
token as a name, so `x.and(y)`, `x.not()`, `self.in`, `e.if` parse as member access or method call. Nothing else
changes: a keyword anywhere else keeps its meaning; `.[` (state access) is untouched.

Tests: the three bit-vector calls evaluate (remove the workaround the S1 test uses to reach them, `bitvector.test.ts`,
and the limit sentence in `frontend/src/jjel/SPEC.md` §7.5); member access on an object with a property named `not`;
every existing JjEL, JjTL and simulation test unchanged. Also add `and`, `or`, `not` back to the bit-vector
autocomplete entries if S1 left them out (`frontend/src/jjel/metadata/builtins.ts`).

## DOVE

`frontend/src/jjel/parser/parser.ts`, its test file, `frontend/src/jjel/__tests__/bitvector.test.ts`,
`frontend/src/jjel/SPEC.md`, `frontend/src/jjel/metadata/builtins.ts`. JjTL has its own parser: if its member access
has the same restriction, report it and do not change it. Docs closure: amend the limit sentence of R-BV-4 in
`docs/decisions.md` (header vocabulary unchanged; `npm run -s docs:digest` must parse), the Status line, one entry in
`docs/log-inbox/jjel-bitvector.md`, `npm run check:docs` green.

## COME

Gates: typecheck 0 through `node scripts/run-quiet.mjs`; `npx vitest run src/jjel src/jjtl src/model/simulation
src/codegen` green but the seven known jjtl files of CLAUDE.md §17; `npm run build`. One `fix(jjel): ...` commit and one
docs closure commit, `git add` by path, `Model:` trailer. No push, no merge. Do not name the industrial partner.
