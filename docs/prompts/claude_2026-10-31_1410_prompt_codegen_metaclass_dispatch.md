# Codegen: templates dispatched on the metaclass of their first parameter

Prompt-ID: P-2026-10-31-1410
Chat: C-2026-10-31-1328
Front: codegen
Status: eseguito 2026-10-31, lane full, branch cg-dispatch, 49aa0cc56
Lane: full (template record and generator file format, call resolution, editor warning; discovery report first, one session)
Depends: P-2026-10-31-1341 (branch cg-origin-concat, fe8bb988e, not merged into the trunk)
Worktree: ~/jjodel-w-cgdispatch, branch cg-dispatch (from cg-origin-concat fe8bb988e)
Request: none (typed in the project chat on 2026-10-31; kept locally via --request)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-cgdispatch` on
`cg-dispatch`, stop with `Outcome: blocked`. Check that `P-2026-10-31-1410` exists only as this file in
`docs/prompts/` and as this lane in `~/.jjodel-lanes/`. Every reply opens with `[P-2026-10-31-1410 · session <id>]`.

No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green.

## COSA

Today an expression printer is one template with a chain of
`if e.instanceOf.name == "Ref" then ... else if e.instanceOf.name == "Const" then ...` (15 branches in a real
hardware generator). Add templates that share a name and differ by the metaclass of their first parameter,
chosen at call time by the most specific class of the argument (polymorphic dispatch, as in Acceleo and
Xtend): `expr(e: Ref, L)`, `expr(e: Conj, L)`, ..., with `expr(e: Expr, L)` as the fallback.

What it gives: adding a metaclass means adding a template, not editing a chain, and the editor can warn when a
concrete subclass of the parameter's type has no template and no fallback applies.

Rules, fixed here unless discovery shows a conflict with an R-GEN row (then stop with `Outcome: question`):

- The template record gains an optional type for its first parameter, a metaclass name of the generator's
  metamodel. Untyped templates behave exactly as today.
- Name uniqueness becomes uniqueness of (name, first-parameter type). Two untyped templates with the same name
  stay an error; an untyped template and typed ones with the same name: the untyped one is the fallback.
- A call resolves to the template whose type is the most specific supertype (or the class itself) of the
  argument's metaclass; the untyped one if none matches; an error naming the class if nothing applies. Two
  equally specific matches (multiple inheritance) are an error at validation time, not a choice at run time.
- The arity of all templates sharing a name is the same; a mismatch is a validation error.
- The editor warns, per name, for each concrete subclass of the most general typed parameter that has no
  matching template and no untyped fallback.
- Generator file format: the parameter type is written and read (`paramType` or the name discovery finds
  consistent with the format); raise `formatVersion` to 1.1 only if a 1.0 reader would misread a typed file,
  and keep reading 1.0 files unchanged. Round trip byte-identical as in P-2026-10-30-1430.
- Origins (P-2026-10-31-1341) flow through a dispatched call exactly as through a direct one.

## DOVE

Expected: `frontend/src/codegen/engine/templates.ts` (record, validation, name checks), the call resolution in
`generate.ts` or wherever template calls are bound, `generatorFile.ts` (format), the Templates tab parameter
editing (a type select for the first parameter, built from the metamodel's classes) and its warnings, tests in
`frontend/src/codegen/engine/__tests__/` and `frontend/src/codegen/ui/__tests__/`. Out of scope: the `files`
mechanism, indentation, the JjEL evaluator beyond what call binding needs.

## COME

First write `docs/discovery/discovery_2026-10-31_codegen_metaclass_dispatch.md`: where calls are bound, how the
metaclass and its supertypes are read from an argument (model object proxy, `instanceOf`, superclasses), where
uniqueness is checked, how the format and the tab store parameters, and a grep for every new identifier.
Commit it. Then implement.

Tests: an abstract class with two concrete subclasses and a grandchild; dispatch picks the most specific
template, falls back to the untyped one, errors with the class name when nothing applies; ambiguity and arity
mismatch are validation errors; the warning lists the uncovered concrete subclass; a 1.0 file imports
unchanged and a typed file round trips; origins of a member read inside a dispatched template are kept.
Existing codegen tests unchanged.

Gates: `npx tsc --noEmit`, `npx vitest run src/codegen`, `npm run build`, `npm run check:docs`.

### Visual check (by the chat)

Templates tab: the type select on the first parameter, its empty state for untyped, the warning row. No layout
shift when a type is set.

## RIFERIMENTI

- P-2026-10-30-1430 (generator file format), P-2026-10-31-1341 (origins through `+` and `join`)
- R-GEN rows in `docs/decisions.md` (R-GEN-25 on `mode`, R-GEN-33 on `root`/`entry`)

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-31-1410)`.
Log entry per the current log convention (`docs/log-inbox/`) and the `Status: da eseguire` flip with date, lane,
branch and sha in one docs-only commit. No push, no merge into the trunk. Report closes with «Decisions taken
(unattended)» and «Decisions awaiting Alfonso», then `Outcome: done | hard-stop | question | blocked`.
