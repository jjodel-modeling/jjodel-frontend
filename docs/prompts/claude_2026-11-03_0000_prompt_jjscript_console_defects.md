# JjScript console: four defects found by running it

Prompt-ID: P-2026-11-03-0000
Chat: C-2026-11-02-1319
Front: maintenance
Status: da eseguire
Lane: full (auto; four independent fixes in JjScript, two-phase in one session)
Depends: none
Worktree: ~/jjodel-w-jjsconsole, branch jjscript-console-defects (from 34b82af49 plus this prompt)
Request: https://claude.ai/code/session_01DQt9R4VAKm7quiJen8TK1D · Alfonso, 2026-11-02 23:58 «Si vai in lane auto», see request.md of this lane

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjsconsole` on
`jjscript-console-defects`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-0000 · session <id>]`.
No subagents, no background tasks, no load generators. One probe run per tool call. Commit each fix as soon as its tests are
green, one commit per defect, so a ceiling stop loses nothing.

## COSA

Seen by the chat on 2026-11-02 at 23:45 in the app on 3001, in the JjScript console, on a new project with one empty metamodel:

1. `create package P2` answers `Failed to create package: Cannot read properties of undefined (reading 'cname')`.
2. `create class Foo in P1` answers «Class created», and the class is nowhere: `list classes` says «No elements found», the status bar 0 classes (P1 had not been created, per 1, or P1's creation had the same fate: measure). A plain `create class Foo` works. A success reported for something not done is the worst of the four: the command must either place the class in the package or fail naming the missing parent.
3. `eval` refuses what JjEL accepts: `eval classes.map(c => c.name)` gives `Unexpected '='`, and `eval forall c in classes : c.name + " " + c.id` gives `Expected expression`. Probably `eval` rebuilds the text from tokens: measure. Fix it so the raw source reaches JjEL, as `collectExprRawUntil` does elsewhere.
4. `let`: `let $x = forall a in classes : a.name in eval $x` silently binds `forall a`, because the value stops at the first top-level `in` (`collectValueExprRaw`); with two variables it fails with `Expected '$'`. And `let $x = (forall a, b in classes : a.name) in eval $x.size` fails with `Unexpected '$'`, so a binding's value cannot be read in `eval`. Required: an unparenthesized `forall` or `exists` value parses whole, by keeping the `in` of its own bindings and the commas of R-FA-5 inside the value; and `$x` reads in `eval`. Nothing in `let` silently truncates: a value that does not parse is an error.

For each: root cause, regression test that fails before the fix, smallest fix. If one of the four turns out to be larger than a local fix (a change in the model layer, a critical-zone file, an exported type read outside `frontend/src/jjscript/` changed incompatibly): do not do it, leave it as a written ticket with the cause, finish the others, and say so. RC-26 items stop the lane as usual.

## DOVE

`frontend/src/jjscript/` (parser, `executor/commands/`, types with optional fields only) and its tests, `frontend/src/jjscript` help text if a syntax is documented wrongly, `docs/jjscript/` if the grammar is there. Out of scope: JjEL, JjTL, the critical zone.

## COME

Phase 1, read-only: reproduce the four with tests on real resolvers, as `executor/__tests__/forallById.test.ts` does. Save `docs/discovery/discovery_2026-11-03_jjscript_console_defects.md` (objective, files read with full paths, findings, risks, open questions), commit it alone, continue into Phase 2 in the same session.

Phase 2: fix in the order 2, 1, 3, 4. Gates from `frontend/` through `node scripts/run-quiet.mjs`: `npx tsc --noEmit`, `npx vitest run src/jjscript src/jjel`, `npm run build`, `npm run check:docs`. Never paste a long log. Verifica visiva non applicabile; the chat repeats the commands on 3001 after the merge.

## Lane discipline

`git add <specific files>` only. Conventional commits in English, one line, suffix `(P-2026-11-03-0000)`. Log entry in `docs/log-inbox/maintenance.md`; Status flip of this prompt in the same docs-only commit: do both yourself, never leave them to Alfonso. No push, no merge. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», then `Outcome: done | hard-stop | question | blocked`.
