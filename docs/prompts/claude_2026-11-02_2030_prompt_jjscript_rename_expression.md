# JjScript: `rename ... to <expression>`

Prompt-ID: P-2026-11-02-2030
Chat: C-2026-11-02-1319
Front: maintenance
Status: eseguito 2026-11-02 · lane maintenance · branch jjscript-rename-expression · commit 62522c9bf · verifica visiva non applicabile
Lane: full (JjScript grammar and executor, two-phase in one session)
Depends: none
Worktree: ~/jjodel-w-jjsrenameexpr, branch jjscript-rename-expression (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R4VAKm7quiJen8TK1D · Alfonso, 2026-11-02 19:21 and 20:27, see request.md of this lane

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjsrenameexpr` on
`jjscript-rename-expression`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2030 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green.

## COSA

`rename` takes a name token today, so inside a `forall` every element gets the same name:
`forall a, b in classes such that a != b and a.name == b.name do rename b to dup` is of little use. Required:

```
forall c in classes do rename c to "Abstract_" + c.name
forall a, b in classes such that a != b and a.name == b.name do rename b to b.name + "_dup"
rename Foo to "Bar"
```

The rule (R-FA-9, provisional, the chat writes it on the trunk when this lane merges; a measured reason to change it goes
in the report):

- a single bare identifier after `to`/`as`, followed by the end of the command, stays the literal name, exactly as today,
  even when a variable has that name (`rename b to dup` never reads `dup`);
- anything else is a JjEL expression, evaluated once per execution in the same context as the `forall` filter, so the
  `forall` variables and the `let` bindings are visible. To use a variable's value alone, write `rename c to x + ""` or
  a string interpolation.
- The result must be a non-empty string that is a legal name by the rule the command applies today: anything else is that
  element's command error, with the expression and the value in the message, and never a rename to `null` or `undefined`.
- Two elements of one `forall` reaching the same name behave as two consecutive `rename` commands do today: say in the
  report what that is, do not add a new check.

Inside a block, the expression stops at the end of the command, like the other raw expressions of the parser
(`collectExprRawUntil`). Single-token forms keep their AST exactly.

Acceptance, tests in `frontend/src/jjscript/`: the three forms above; the literal form with a variable of the same name;
`as` as well as `to`; `rename attribute x in C to ...`; a non-string, an empty string and a null result; a block with a
following command; preflight and permission behaviour unchanged for the literal form; the rename in the effects preview
says what it does for an expression (a computed name is not known statically outside a `forall`? measure, and report).

## DOVE

`frontend/src/jjscript/parser/parser.ts` (`parseRenameCommand`, line 554), `frontend/src/jjscript/types.ts`
(`RenameArgs`: optional field beside `newName`, nothing removed), `frontend/src/jjscript/executor/commands/rename.ts`, the
tests, the help text of `rename`, one line in `frontend/src/constants/defaultPrompts.ts`. To be confirmed in discovery, and
touched only if a reader of `newName` would break: `executor/effectsPlanner.ts`, `executor/permissionGuard.ts`,
`executor/scriptValidator.ts`, `executor/runPasses.ts`, `executor/executor.ts:375`. Out of scope: JjEL, JjTL, the other
commands (`set` and `create` are not changed), the critical zone.

Stop with `Outcome: question` and a `Recommended:` line if `RenameArgs.newName` is read outside `frontend/src/jjscript/` in
a way the optional field would break.

## COME

Phase 1, read-only: one probe of how `b` as a rename target resolves inside a `forall` today, and how the parser reads a
string literal and a dotted name after `to`. Every reader of `newName`. Save
`docs/discovery/discovery_2026-11-02_jjscript_rename_expression.md` (objective, files read with full paths, findings,
risks, open questions), commit it alone, continue into Phase 2 in the same session unless the stop above applies.

Phase 2: tests first, parser, type, executor, help. Gates from `frontend/` through `node scripts/run-quiet.mjs`:
`npx tsc --noEmit`, `npx vitest run src/jjscript src/jjel`, `npm run build`, `npm run check:docs`. Never paste a long log.
Verifica visiva non applicabile; the chat runs the command on 3001 after the merge.

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-11-02-2030)`. Log
entry in `docs/log-inbox/maintenance.md`. Replace the Status line with date, lane, branch and sha in the same docs-only
commit as the entry. No push, no merge into the trunk. Report closes with «Decisions taken (unattended)» and «Decisions
awaiting Alfonso», then `Outcome: done | hard-stop | question | blocked`.
