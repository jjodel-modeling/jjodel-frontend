# Ecore: export defaults again; import keeps the literal label and the enum's serializable flag

Prompt-ID: P-2026-11-01-2351
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: fast (export line re-enabled, two import reads, round-trip tests)
Depends: P-2026-11-01-2300/2325 (merged 44c6794f2); its open points 2 and 3
Worktree: ~/jjodel-w-ecoreexport, branch ecore-export-defaults (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, 2026-11-01 23:44, «Sono d'accordo» (question 3)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-ecoreexport` on
`ecore-export-defaults`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-2351 · session <id>]`.
No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

1. The Ecore export of `defaultValueLiteral` is commented out (`frontend/src/services/export/EcoreService.ts:316-318`),
   so an import followed by an export loses every default. First find out why it was commented (`git log -L` on those
   lines, the commit message, any test or ticket): if there is a stated reason that still holds, stop with
   `Outcome: question` and quote it. Otherwise re-enable it, escaped as the line already does.
2. On import, the literal's label (`literal`) and the enumeration's `serializable` flag are read without the `-`
   prefix of the XML-to-JSON attributes, so they are lost: the same bug 2300 fixed for the literal value
   (`frontend/src/services/export/ecoreFeatureReads.ts`, `frontend/src/api/data.ts`). Read them through the same helper.

## DOVE

`EcoreService.ts` (the export line), `ecoreFeatureReads.ts` and `data.ts` (the two reads). Tests next to
`frontend/src/services/export/__tests__/ecore-import-losses.test.ts`. No other file; if one must change, stop with
`Outcome: question`.

## COME

Tests first, red before the change: a metamodel with defaults on EInt, EBoolean, EString and an enum attribute, an enum
whose literals have labels different from their names, and an enum with `serializable="false"`. Export then import:
defaults, literal values, labels and the serializable flag all survive. The XML produced by the export carries
`defaultValueLiteral` only for attributes that have one. Existing import/export tests stay green.

## Lane discipline

`git add <specific files>` only. Commit `fix(ecore): export defaults; import literal labels and serializable
(P-2026-11-01-2351)`. Gates: `npx tsc --noEmit` (baseline), `npx vitest run` on the import/export test folders,
`npm run build`, `npm run check:docs`. Visual check not applicable; say so. Log entry in `docs/log-inbox/codegen.md`
and the `Status:` flip of this prompt (edit the line directly) in one docs-only commit. No push, no merge. End with
«Decisions taken (unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
