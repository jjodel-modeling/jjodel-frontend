# Codegen: model origins for member reads inside `+` and `join`

Prompt-ID: P-2026-10-31-1341
Chat: C-2026-10-31-1328
Front: codegen
Status: da eseguire
Lane: full (codegen engine evaluator and origin rules, discovery report first, one session)
Depends: none
Worktree: ~/jjodel-w-cgorigin, branch cg-origin-concat (from alfonso-frontend-jjtl 5b19ebfc8)
Request: none (typed in the project chat on 2026-10-31; kept locally via --request)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-cgorigin` on
`cg-origin-concat`, stop with `Outcome: blocked`. Check that `P-2026-10-31-1341` exists only as this file in
`docs/prompts/` and as this lane in `~/.jjodel-lanes/`. Every reply opens with `[P-2026-10-31-1341 · session <id>]`.

No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green.

## COSA

A real generator (a small synchronous hardware DSL printed to nuXmv, SystemVerilog and SVA, with full
traceability measured by a probe counting, per output, the signal names the origin map links to a model
element) needed 61 templates. Reason: a bare member read inside a `+` concatenation
(`"logic " + r.name + ";"`) is opaque as a whole, because `OriginHost.concat` turns each operand into a Text
with `toText`, which has no expression to attribute. Rewritten with two one-line text templates
`nm(x)` = `${x.name}` and `org(x)` = `${x.origin}` it has 24 templates, byte-identical output and complete
coverage; writing `r.name` instead of `nm(r)` in one line silently drops 3 links.

Expected: in `"logic " + r.name + ";"`, evaluated with the template's Text host, the fragment printed by
`r.name` gets the model origin `(r, name, identity)`, exactly as `${r.name}` does; the literals stay opaque
(or literal, if cheap). The same for the items of `list.map(r => r.name).join(", ")`. Rule 1 of `origin.ts`
(a member read, or a named builtin with literal arguments on one) applies per operand, not only per hole.

A possible route, to be judged in discovery: in the evaluator's binary `+` with a text host present, evaluate
each operand through the host's read frame (as `evaluateHole` does), so that `attribute` sees the operand's
expression and its reads; `map` with a lambda whose body is a member read can go the same way.

## DOVE

Expected: `frontend/src/codegen/engine/origin.ts`, `frontend/src/codegen/engine/generate.ts`, the JjEL evaluator
entry the engine hooks into (confirm where the Text host is consulted for `+` and `join`), tests in
`frontend/src/codegen/__tests__/` or `frontend/src/codegen/engine/__tests__/`. Out of scope: the generator file
format and import/export, the Templates tab UI, indentation and the `files` mechanism.

Stop conditions: a change in the shared JjEL evaluator that alters values (not only origins) for other
consumers, or for evaluations without a text host, is an exported behaviour change: stop with
`Outcome: question` and the recommendation.

## COME

First write `docs/discovery/discovery_2026-10-31_codegen_origins_through_concat.md`: how origins flow today
for a hole and for `+`/`join` (file and line), the chosen route and why, what happens with no text host, and a
grep for every new identifier. Commit it (`git add` that file only). Then implement.

Tests: an expression-mode template returning `"logic " + r.name + ";"` links exactly the characters of
`r.name`'s value to `(r, name)`; `list.map(r => r.name).join(", ")` links each item; a `+` mixing a hole-made
Text and a member read keeps both origins; evaluation without a text host returns the same values as before.
Existing codegen tests unchanged; the generated text of every existing test byte-identical.

Gates: `npx tsc --noEmit`, `npx vitest run src/codegen`, `npm run build` at the end.

## RIFERIMENTI

- `frontend/src/codegen/engine/origin.ts` (`OriginHost`, `concat`, `toText`, rule 1), `generate.ts`
  (`evaluateHole`)
- R-GEN rows in `docs/decisions.md` on provenance

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-31-1341)`.
Log entry in `docs/claude-code-log.md` at the end. Replace `Status: da eseguire` with date, lane, branch and sha
in the same docs-only commit as the log entry. No push, no merge into the trunk. Report closes with «Decisions
taken (unattended)» and «Decisions awaiting Alfonso», then `Outcome: done | hard-stop | question | blocked`.
