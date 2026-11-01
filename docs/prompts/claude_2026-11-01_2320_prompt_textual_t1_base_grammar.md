# Textual syntax T1: base grammar and C-like style over the metamodel, printer, read-only EBNF (R-TXT-16)

Prompt-ID: P-2026-11-01-2320
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: full, Phase 2 only (the design is the addendum of P-2026-11-01-2210/2232); new module, no change to existing behaviour
Depends: decisions R-TXT-1..22; addendum `docs/discovery/discovery_2026-11-01_textual_viewpoint.md` §A.1, §A.2, §A.7 (step T1)
Worktree: ~/jjodel-w-textt1, branch textual-t1 (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, 2026-11-01 23:14, «ok alle raccomandazioni», /lane auto

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-textt1` on
`textual-t1`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-2320 · session <id>]`.
No subagents, no background tasks. Read `docs/decisions.md` section R-TXT and the addendum (§A.1, §A.2, §A.7) first.

## COSA

Step T1 of the plan, and nothing after it:
1. The **base grammar** derived from a metamodel (R-TXT-1..12, R-TXT-16 level 1), as plain data: one rule per
   metaclass, Xtext-like feature assignments (`f=`, `f+=`, `f?=`), cross-references, enumeration rules, terminals.
2. A **style** as data (R-TXT-16 level 2) with the parameters of §A.2, and the **C-like style** as its first value.
   The style type must already admit the Pascal/Ada and indentation styles (T5) without changing its shape; only
   C-like is implemented and tested now.
3. The **concrete grammar** (base grammar plus style) and its **EBNF text**, annotated with the features, as a
   function that returns a string. No UI in this lane: the EBNF is shown read-only in a later step.
4. A **printer** from a model and the concrete grammar to text, with the spans of each object returned alongside the
   text (the origins that R-TXT-22 will match against, not used yet).
5. A **differential test**: on the 1709 fixture of `frontend/src/codegen/engine/__tests__/defaultText.test.ts` and on
   a small corpus of metamodels built in the test, the C-like printer's output equals byte for byte what the JjGen
   generator `frontend/public/examples/codegen/default-text.generator.json` prints (R-TXT-14).

Not in this lane: parser (T2), style checks (T3), annotations (T4), other styles (T5), anything in the editor.

## DOVE

A new folder `frontend/src/codegen/textual/` (check with a global search that the name and every exported identifier
are free): the grammar types, the derivation, the style type and the C-like value, the concrete grammar and EBNF
printer, the model printer. Tests in `frontend/src/codegen/textual/__tests__/`. The probes of the discovery are the
reference implementation to port, not to copy blindly: `~/.jjodel-lanes/P-2026-11-01-2232/probe/lib.mjs`,
`printer.mjs`, `models.mjs` and the outputs `out-base.txt`, `out-ebnf-fixture-clike.txt`, `out-fixture-clike.txt`.
No existing file changes, except an import of a test helper if the differential test needs one; if any other existing
file must change, stop with `Outcome: question` and say which and why.

## COME

Tests first: the base grammar of the fixture equals the addendum's (§A.1 or `out-base.txt`); its C-like EBNF equals
`out-ebnf-fixture-clike.txt` up to whitespace normalization stated in the test; the printed fixture equals the JjGen
generator's output; on the corpus (at least: a diamond and a non-diamond multiple inheritance, an enum with mixed-case
literals that triggers the R-TXT-21 (10) fallback with a notice, a class without `name`, homonyms needing paths,
multiple roots with the `[k]` prefix of R-TXT-11), printer and JjGen generator agree. Run the JjGen generator in the
test the way `defaultText.test.ts` does. TypeScript strict, no new dependency. Mutation check as in P-2026-11-01-1946:
break the derivation in a few ways and show each is caught.

## Lane discipline

`git add <specific files>` only. Commit `feat(codegen): textual base grammar, C-like style and printer (P-2026-11-01-2320)`.
Gates: `npx tsc --noEmit` (baseline, no new errors), `npx vitest run src/codegen`, `npm run build`, `npm run
check:docs`. Visual check not applicable (no UI); say so. Log entry in `docs/log-inbox/codegen.md` and the `Status:`
flip of this prompt (edit the line directly) in one docs-only commit. No push, no merge. End with «Decisions taken
(unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
