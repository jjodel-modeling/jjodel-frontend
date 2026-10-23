# Code generation 3.3, slice G1: the generator codec

Prompt-ID: P-2026-10-24-0001
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (implementation; new engine file and its tests, no critical-zone file)
Depends: P-2026-10-24-0000
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-23 23:54, in the project chat (kept locally in the chain folder as `request.md`)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-23_codegen_generator_viewpoint.md`). P8 does not apply
(nothing visible).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-24-0001 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as
the gates are green. One probe run per tool call. Never `cat` a whole large file.

## Read first, and only this

The report above: §0, §1.1..§1.6, §4 (option (c) in detail), §5, §8 (row G1). The rows R-GEN-31..R-GEN-43 now in
`docs/decisions.md`. `frontend/src/codegen/engine/templateCodec.ts` in full (126 lines): G1 follows its contract.

## COSA

1. New `frontend/src/codegen/engine/generatorCodec.ts`. Key `GEN_GENERATORS_KEY = 'genGenerators'`, format
   `{"v":1,"generators":[...]}`. A generator record: `id` (string, unique in the list; the default is `"default"`),
   `name`, `root` (template name, optional), `files` (array of `{ path, entry }`, optional), `target`
   (`"js"` or `"none"`, optional, default `"js"` for the default generator and `"none"` for others), `templates`
   (only for non-default generators, in today's `TemplateRecord` shape, decoded with the existing template codec's
   rules). The default generator's templates are always `genTemplates`, untouched (R-GEN-32).
2. `readGenerators(lookup, metamodelId)` returns the decoded list, default first, with defects reported as the
   template codec reports them (a bad generator is one defect; the others decode). Absent `genGenerators` reads as
   one default generator: root = `main` if present else the first template, one file `{ path: 'main.js', entry:
   <root> }`, target `js`. `readModelGenerators` mirrors `readModelTemplates` (M1 → `instanceof` → metamodel).
3. `generatorsPatch(rawTemplates, rawGenerators, next)` returns the one `state` delta a Save writes, or `null` when
   nothing changes: `genTemplates` only when the default's templates change, `genGenerators` only when any
   generator's metadata or a non-default list changes; never a removed key; an emptied list is written `[]`
   (the `templatesPatch` contract, `templateCodec.ts:13-14`). One `state` set, one undo step.
4. Pure helpers the later slices need: `newGeneratorId(list)`, `renameGenerator`, `removeGenerator` (refuses the
   default), `addGenerator(list, name)` (empty template list, target `none`, one file named after it).
5. Tests in `frontend/src/codegen/engine/__tests__/generatorCodec.test.ts`, each killing the mutation named in the
   report's G1 row: a 3.2 string reads as the default generator with its templates in order; saving a non-default
   generator leaves `genTemplates` byte-identical; two generators with a template of the same name decode
   independently; an unchanged list writes nothing; a bad generator is one defect and the others decode. Add: a
   3.3 value read by the 3.2 codec (`readTemplates`) still yields the default's templates; the turnstile and
   petri example lookups decode to one default generator.
6. `setting.ts` (eager, R-GEN-2): `codePillVisible` also counts a metamodel whose `genGenerators` is present, by a
   key read only (no import from `engine/`). Its test gets the rows for that case.

## DOVE

New `frontend/src/codegen/engine/generatorCodec.ts` and its test; `frontend/src/codegen/setting.ts` and
`frontend/src/codegen/__tests__/setting.test.ts`; `docs/log-inbox/codegen.md`; this prompt's `Status:` line.

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen src/jjel`;
`npm run check:codegen-lazy -- --on`; `examples/__tests__/importable.test.ts` unchanged and green. A mutation
bench: apply each mutation of item 5 by hand, run the test, revert; report killed/total.

## Close

`feat(codegen): generator codec, genGenerators beside genTemplates (P-2026-10-24-0001)`, then one docs commit with
the log entry and the `Status:` flip `eseguito 2026-10-24 · lane codegen · <feat sha> · <bench k/n>`.
`Outcome: done`.

## NON FARE

No UI change. No change to `templateCodec.ts`'s exported behaviour. No migration, no write on open. Nothing in
the critical zone. No new dependency. No push, no merge.
