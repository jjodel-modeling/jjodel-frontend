# Textual syntax T4a-2: annotation storage, wiring and language name

Prompt-ID: P-2026-11-02-1830
Chat: C-2026-11-02-1814
Front: codegen
Status: eseguito 2026-11-02 · hard-stop at the ceiling, closed by P-2026-11-02-1930 · verifica visiva passata 2026-11-02 (chat, unattended)
Lane: full (more than three files; persisted data in `_state`)
Depends: none
Worktree: ~/jjodel-w-textt4a2, branch textual-t4a2 (from the trunk commit that adds this prompt)
Request: none (Alfonso 2026-11-02 18:18; his words are in request.md of this lane)

Before anything else run `pwd`, `git branch --show-current` and `git status --short`; if the tree is not
`~/jjodel-w-textt4a2` on `textual-t4a2` and clean, stop with `Outcome: blocked`. Every reply opens with
`[P-2026-11-02-1830 · session <id>]`. No subagents, no background tasks. One probe run per tool call. Never `cat` a
probe or gate log: grep the summary lines. Commit as soon as the gates are green.

## COSA

T4a-1 (merge c41033a9a) made syntax annotations plain data, applied by the grammar, printer and parser, and tested only
through fixtures. No metamodel can hold them yet. This lane makes them real:

1. **Storage (R-TXT-21 (2)).** One versioned record in the metamodel's `_state`, keyed by element id, next to the
   generators and written and read the way `genTemplates` is (`codegen/engine/generatorCodec.ts`,
   `templateCodec.ts`). Search that the new key is free. One small read/write API. A malformed or newer record reads as
   no annotations with an issue, never a throw. Additive: no migration, no VersionFixer bump.
2. **Element ids.** Build `ElementIds` (`textual/annotations.ts`) from the metamodel's shells, including each feature's
   lower bound, which R-TXT-21 (4) needs for grouping. Renaming a class or feature must not lose its annotation.
3. **Wiring.** The Text tab, the EBNF view and «New model from text» use one shared path:
   read the record, `resolveAnnotations`, `withStyleOptions`, `deriveConcreteGrammar`. `annotationIssues` reach the
   surface where style notices already appear. A metamodel with no record prints byte-identically to today.
4. **Language name (R-TXT-23, R-TXT-25 (12)).** The textual entry of the viewpoint picker shows `language` when set and
   the metamodel's name otherwise. Check whether the tab title uses the same name; if it does, keep them equal.

No editing UI: that is T4b. No apply on pause: that is T6. The operator annotation stays stored and not applied.

## Generality

The prototype's RISC-V and arbiter metamodels were the litmus test of T4a-1, not the target. Do not read
`~/Downloads/micron-proto`, and no behaviour or test here may depend on hardware concepts. The new acceptance uses a
small metamodel from another domain (a library: `Library` containing `Book` and `Member`, with an enum attribute), with
annotations that rename a keyword, drop one, group by a mandatory enum attribute and set the language name. If a
generic case exposes a defect of T4a-1, fix it when small and inside `frontend/src/codegen/textual/`; otherwise report
it and stop.

## DOVE

`frontend/src/codegen/textual/` (a new storage module beside `annotations.ts`, the shared path),
`frontend/src/components/editor-v2/Toolbar.tsx` and its picker helper,
`frontend/src/components/editor-v2/__tests__/textualPicker.test.ts`, the Text tab and «New model from text» files that
consume the grammar (find them from `Toolbar.tsx` and `LeftBar.tsx`). Any other file: a question with `Recommended:`.
The critical zone is out of scope: if the work seems to need it, stop.

## COME

Discovery inline, at most ten lines in the log entry: the `genTemplates` write path and its undo behaviour; every
consumer of `deriveConcreteGrammar`. Then tests first:

- round trip of the record, including through a project save and reload (in the app or the existing codec harness);
- a malformed record, a newer version, a stale id: no throw, a visible issue;
- rename of an annotated class: annotation kept, label and text correct;
- no record: output byte-identical (existing T1 and JjGen equality tests stay green);
- the library acceptance: print, parse without errors, reprint equal;
- picker label: language name set and unset.

Mutation bench, stated in the commit body: storage key ignored, ids built without lower bound, label ignoring
`language`, annotations not passed to the parser.

In-app check with a probe, setting the record through the API since no UI exists yet: label in the picker, printed
text, reload, then undo of the write if the `genTemplates` path has undo. Crops in light theme, in
`~/.jjodel-lanes/P-2026-11-02-1830/`.

## HARD STOP

- Stop with `Outcome: question` on an exported interface that breaks outside this lane, or an amendment to an R- row.
- Stop with `Outcome: hard-stop` at the context ceiling, after writing the handoff.

## NON FARE

No push, no merge, no form, no change to the prototype's files, no new dependency, no `git add .`.

## Gates and closure

From `frontend/`, through `node scripts/run-quiet.mjs`: `npx tsc --noEmit`, `npx vitest run src/codegen
src/components/editor-v2/__tests__/textualPicker.test.ts`, `npm run build`, `npm run check:docs`,
`npm run check:codegen-lazy` (both modes).

Code commit `feat(codegen): store textual syntax annotations and show the language name (P-2026-11-02-1830)`, trailer
`Model:`. Log entry in `docs/log-inbox/codegen.md` and the `Status:` flip in one docs-only commit, left uncommitted
until the visual check per RC-17. Final message: «Decisions taken (unattended)», «Decisions awaiting Alfonso», then
`Outcome:`.

## RIFERIMENTI

`docs/decisions.md` R-TXT-21, R-TXT-23, R-TXT-25, R-TXT-27; `docs/PROTOCOL.md` P9, P13, P16;
`~/.jjodel-lanes/P-2026-11-02-0846/handoff.md`, design of the record.
