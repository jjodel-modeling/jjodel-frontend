# Textual syntax: paths never coincide with names; fold onto style words; shared test corpus (R-TXT-25 (5), (6), (7), (11))

Prompt-ID: P-2026-11-02-0652
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: fast (changes inside `frontend/src/codegen/textual/` and its tests only)
Depends: T1, T2a, T3 merged; R-TXT-25 (amends R-TXT-4 and R-TXT-11 on paths)
Worktree: ~/jjodel-w-textpaths, branch textual-paths (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, 2026-11-02 06:43, «Ok alle raccomandazioni»

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-textpaths` on
`textual-paths`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-0652 · session <id>]`.
No subagents, no background tasks. Read `docs/decisions.md` R-TXT-25 first. Keep context low.

## COSA

1. **Paths (R-TXT-25 (5, 6)).** Printer and parser: a root is `Class[k]` (k = position among the top-level objects of
   that class), a contained object `feature[k]` even for a single containment, segments joined by `.`. Names stay
   identifiers or quoted strings, so a path never equals a name. The fixture `inner` case (T2a's ticket) round-trips.
   The DemoESM-like references print as `State[0]` instead of `[0]`.
2. **Fold onto a style word (7).** When a style's case folding would turn a class keyword into a style word, the
   derivation falls back to the declared case for that metamodel, with the notice T1 uses; T3's check then reports a
   notice, not an error.
3. **Shared corpus (11).** The test corpus copied in `textual.test.ts`, `parser.test.ts` and `styleCheck.test.ts` moves
   to one shared test module imported by all three.
The JjGen generator (`frontend/public/examples/codegen/default-text.generator.json`) is the reference for the default
(R-TXT-14): update it so the differential test still holds byte for byte with the new path form, in the same lane.

## Lane discipline

`git add <specific files>` only. Commit `feat(codegen): unambiguous paths, fold fallback, shared corpus
(P-2026-11-02-0652)`. Gates: `npx tsc --noEmit`, `npx vitest run src/codegen`, `npm run build`, `npm run check:docs`,
`npm run check:codegen-lazy` (on mode). Visual check not applicable. Log entry in `docs/log-inbox/codegen.md` and the
`Status:` flip (edit the line) in one docs-only commit. No push, no merge. End with «Decisions taken (unattended)»,
«Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
