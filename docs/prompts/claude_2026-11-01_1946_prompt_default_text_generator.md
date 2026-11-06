# Codegen: a shipped JjEL generator that prints any model in the default textual notation (R-TXT-7)

Prompt-ID: P-2026-11-01-1946
Chat: C-2026-11-01-1713
Front: codegen
Status: eseguito 2026-11-01 · lane default-text-generator · c29dde42a
Lane: full, Phase 2 only (the discovery is P-2026-11-01-1709); a short inline discovery first, reported in the log entry
Depends: P-2026-11-01-1709 (merged 5b069a615); decisions R-TXT-1..10 (404452168). Independent of P-2026-11-01-1945
Worktree: ~/jjodel-w-defaulttextgen, branch default-text-generator (from the trunk commit that adds this prompt, on top of 71aee8fde)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, «ok alle raccomandazioni», 2026-11-01 19:39, questions 1-5, 7-9 of the report

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-defaulttextgen` on
`default-text-generator`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-1946 · session <id>]`.
No subagents, no background tasks. Read `docs/decisions.md` section R-TXT and the report
`docs/discovery/discovery_2026-11-01_default_textual_notation.md` (§2 and §3) in full before writing anything.

## COSA

A generator written in JjEL, valid for every metamodel, that prints a model in the default textual notation fixed by
R-TXT-1..9: untyped templates `obj(o)`, `feature(o, f)`, `value(a, v)`, `ref(o, t)` and the entry template, so that a
DSL author overrides a class with a typed template (`obj:Requester(o)`) or one keyword of one class with
`kw:Core(o, f)` through the existing metaclass dispatch (R-TXT-8, `templates.ts:183-197`). The default must expose its
per-feature templates, so that an override of `obj` can call the default for the features it does not change
(report §2.3). Shipped as a generator file in the `jjodel-generator 1.0` format, importable from the Templates tab.
No engine change, no built-in (R-TXT-7). The EBNF printer (report §2.4) is not asked.

## DOVE

Inline discovery (10 lines in the log entry): where shipped or example generators live today (the SyncRTL acceptance
files of 2026-10-30, the import path of `GeneratorImportDialog`), and how a test runs a generator against a metamodel
built in code (`frontend/src/codegen/engine/__tests__/`). Then: the new generator file in that place; one test file
in `frontend/src/codegen/engine/__tests__/`; a short page or section in the codegen user docs if one exists (find it,
do not create a new docs tree). If the work needs more than these files, stop with `Outcome: question` and list them.

## COME

Tests first, on a fixture metamodel built in the test (like the discovery's: a `Named` supertype, `Sys` with integer,
boolean, string, enum, multi-valued and defaulted attributes, a containment `parts` and a reference `main`, a `Link`
class with no `name`, two `Part`s with the same name). Expected text written out by hand from R-TXT-1..9: feature
order (R-TXT-1), quoted strings and declared-case literals (R-TXT-2/3), unique name vs containment path vs `[a, b]`
for references (R-TXT-4), unset optional attributes and empty lists omitted, mandatory and defaulted ones printed
(R-TXT-5), a feature-named object printed unquoted in a name position (R-TXT-9). Then one override test: a typed
`obj` for one class and a typed `kw` renaming one keyword, the rest printed by the default. Do not assert origins of
index reads (that is P-2026-11-01-1945).

Acceptance outside the repo, read-only: run the generator on the hardware prototype's CoreSpec and ArbiterSpec
(`~/Downloads/micron-proto/metamodels/`, `models/`) and put the output in the log entry. Copy nothing from that
folder into the repo. If a rule of R-TXT cannot be met in JjEL, stop with `Outcome: question` and say which, with
the measured reason: do not change the rule.

## Lane discipline

`git add <specific files>` only. Commits `feat(codegen): default textual notation generator (P-2026-11-01-1946)` and,
if any, `docs(codegen): ...`. Gates: `npx tsc --noEmit` (baseline, no new errors), `npx vitest run src/codegen`,
`npm run build`, `npm run check:docs`. Log entry in `docs/log-inbox/codegen.md` and the `Status:` flip of this prompt
(edit the line directly) in one docs-only commit. Visual check: import the generator in the app on a probe port
(30xx, not 3000/3001/3003) and save two crops (Templates tab after import, output for the fixture model) under the
lane folder. No push, no merge. End with «Decisions taken (unattended)», «Decisions awaiting Alfonso»,
`Outcome: done | hard-stop | question | blocked`.
