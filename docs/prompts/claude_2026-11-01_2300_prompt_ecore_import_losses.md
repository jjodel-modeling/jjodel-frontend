# Import: the Ecore import keeps default values, literal values and the class's feature list (ticket #395, R-TXT-10)

Prompt-ID: P-2026-11-01-2300
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: fast (discovery inline, then the fix in the import code and its tests)
Depends: ticket #395 (71aee8fde); the base grammar of R-TXT-16 is derived from the metamodel, so what the import drops it cannot see
Worktree: ~/jjodel-w-ecoreimport, branch ecore-import-losses (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, 2026-11-01 22:57, «d'accordo su tutto»

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-ecoreimport` on
`ecore-import-losses`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-2300 · session <id>]`.
No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

Importing an `.ecore` metamodel (report `docs/discovery/discovery_2026-11-01_default_textual_notation.md` §1.1 and the
side finding; ticket #395 in `docs/log-inbox/codegen.md`):
1. drops `defaultValueLiteral` on attributes: an attribute with a default in Ecore has none after the import;
2. drops the `value` of enumeration literals;
3. leaves `DClass.features` empty, while a metamodel built in the editor has it.

After the fix the three are kept as a metamodel built in the editor keeps them. An Ecore export followed by an import
gives back the same defaults and literal values (round trip, where the export already writes them; if the export drops
them too, say so and do not fix the export in this lane).

## DOVE

Inline discovery first, reported in at most 10 lines in the log entry: the import path for `.ecore` (start from
`frontend/src/services/export/EcoreService.ts` and whatever it calls), where `defaultValue`, the literal value and
`features` are set for a metamodel built in the editor, and where the import skips them. Then the fix in the import code
only, and tests next to the existing import tests. If the fix needs `useJjomSync.ts` or `portDistribution.ts` (critical
zone), or more than 3 files, stop with `Outcome: question` and list them.

## COME

Tests first, red before the fix: an `.ecore` with an EInt attribute `level` defaulting to 7, an EBoolean defaulting to
true, an EString with a default, an EEnum whose literals have explicit values (0, 5, 9), and a class with own and
inherited features. After the import: `defaultValue` of each attribute, each literal's `value`, and `DClass.features`
listing the class's own features in declaration order. Then the round trip export, import if the export writes them.
Existing import and export tests stay green.

## Lane discipline

`git add <specific files>` only. Commit `fix(import): keep default values, literal values and features on Ecore import
(P-2026-11-01-2300)`. Gates: `npx tsc --noEmit` (baseline, no new errors), `npx vitest run` on the import/export test
folders and `src/codegen`, `npm run build`, `npm run check:docs`. Visual check: on a probe port (30xx, not
3000/3001/3003) import the test `.ecore` and save one crop of the attribute with its default in the properties panel,
under the lane folder. Log entry in `docs/log-inbox/codegen.md` (it closes #395) and the `Status:` flip of this prompt
(edit the line directly) in one docs-only commit. No push, no merge. End with «Decisions taken (unattended)»,
«Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
