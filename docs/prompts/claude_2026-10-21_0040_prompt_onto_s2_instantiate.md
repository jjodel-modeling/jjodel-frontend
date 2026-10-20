# Ontological instantiation, S2: the creation menu and slot synthesis

Prompt-ID: P-2026-10-21-0040
Chat: C-2026-10-20-1835
Front: instance-of
Lane: full (first UI of the front, EditorV2.tsx, visual check owed)
Status: da eseguire
Request: https://claude.ai/code/session_015eDtjagjBtuPHhhhfUTTo5
Depends: P-2026-10-20-2330
Corregge: —
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s2`, branch `oi-s2`, cut from the trunk tip after the merges of `oi-s1` and `uml-fixture`,
`frontend/node_modules` symlinked (P14). Model and tier: heavy, effort
`xhigh`. Before anything else check `pwd`, the branch, a clean `git status`, that
`frontend/src/model/ontological/bindingReader.ts` and `frontend/scripts/probe/uml-class-object-fixture.ts` exist;
otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-10-21-0040 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes per phase. A question carries one `Recommended:`
line; one recommendation inside this perimeter is adopted and recorded (RC-21). **No subagent and no background task**
(a `claude -p` lane kills them on exit). Every gate and probe in the foreground (P16). Keep tool output short. No push,
no merge. Do not touch the `Status` line. Nothing of this lane may reach the trunk before the 3.2.0 tag.

## Contesto (non rifare l'analisi)

R-OI-1..11 in `docs/decisions.md`; discovery `docs/discovery/discovery_2026-10-20_ontological_instantiation.md` §3.2
(the 14 creation paths, no pane context menu today), §3.3 (createInstance, the 9 Cmd+Z measured), §8 S2. The pure layer
of S1 is in `frontend/src/model/ontological/` (`bindingCodec.ts`, `bindingReader.ts` with `OntoReadView`, `recordsFor`,
`recordFor`, `instantiableClassifiers`, `featureClosure`, `slotDiff`; `bindingCheck.ts`). The fixture of
P-2026-10-20-2330 builds the UML library project (`docs/archivio/claude_2026-10-14_uml_class_object_notation.md` §2, §6)
and exports it to `~/jjodel-demo-exports/uml/uml-class-object.jjodel`.

## COSA

1. **Store adapter.** `frontend/src/components/editor-v2/hooks/instantiate.ts` (new): an `OntoReadView` over the live
   store (L-API reads only), whose `conformsTo` follows multiple inheritance and tolerates cycles in `extends`; the
   reading of the `ontoBindings` record from the metamodel's `_state` bag through `bindingCodec`.
2. **Slot synthesis.** In the same file, `instantiate(classifierId, record)`: creates the instance with
   `createInstance` (`createAdapter.ts:491`), sets its type reference, and for each feature of `featureClosure` in order
   creates one slot with its defining feature and, when the feature has a `defaultValue` and the record a `valueKinds`
   entry for its type, one value object. No write path other than `createInstance` and the existing L-API setters.
3. **Creation menu.** A pane context menu on the editor-v2 canvas (none exists today) with the cascade «New instance of ▸
   <Class>» listing `instantiableClassifiers` for the record `object` (closure order of names, alphabetical), and an
   entry «New instance» on the node menu of a node whose object is an instantiable classifier. The menu appears only
   when the metamodel declares an `ontoBindings` record; with none, the canvas behaves as today. `ContextMenu.tsx` gains
   an optional `children?` for the cascade; tokens only for any style (rule 28).
4. **Fixture binding.** The fixture does not write `ontoBindings`; the acceptance probe writes the UML record into the
   metamodel bag through `mm.state` (R-OI-6, R-OI-8: records `object` and `link`).

Declare, do not fix, the undo count: one instantiation is N undo entries today (S2u will make it one; that lane touches
the core and waits for Alfonso).

## DOVE

`frontend/src/components/editor-v2/hooks/instantiate.ts` (new), `frontend/src/components/editor-v2/EditorV2.tsx`,
`frontend/src/components/editor-v2/ContextMenu.tsx`, its stylesheet if the cascade needs one, a new probe
`frontend/scripts/probe/onto-s2-instantiate.ts`, unit tests for the adapter under
`frontend/src/components/editor-v2/hooks/__tests__/`, and at closure the log entry in `docs/log-inbox/instance-of.md`.
No critical-zone file (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`,
`handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`), nothing under `redux/`, `joiner/`, `viewpoint/`, `problems/`. If the
design needs one, stop with `Outcome: question`.

## COME

Phase 1 (read-only, short): read the files above, write `docs/discovery/discovery_2026-10-20_onto_s2_plan.md` (objective,
files read with full paths, the exact insertion points in `EditorV2.tsx`, risks, open questions), commit it, and
continue to Phase 2 in the same session unless a question needs an answer (RC-25: the chat is not a gate on the plan).

Phase 2:
1. Baseline typecheck through `node scripts/run-quiet.mjs` from `frontend/` (zero errors).
2. Adapter and synthesis with unit tests; then the menu.
3. Acceptance probe (`lane-run probe`, port 3087), measured, on the fixture library with the binding written:
   the pane menu lists exactly Book, Library, Magazine, Member (no Publication, no Genre, no Association);
   «New instance of ▸ Book» gives one instance with `classifier = Book` and 4 slots whose defining features are, in
   order, the closure of S1 for Book; «Member» gives a slot `active` with a LiteralBoolean `true` from `defaultValue`;
   the class-node entry on Book gives the same result as the cascade; a metamodel without `ontoBindings` shows no menu;
   record the undo entries and Cmd+Z presses for one instantiation; page errors `[]`.
4. Screenshots of the open cascade and of the new instance in the object diagram viewpoint, light theme, in
   `docs/discovery/assets/onto-s2/`, plus the measures JSON (RC-23: the chat runs the visual check on them).
5. Typecheck zero, unit tests green, `npm run check:docs` green; commits `feat(onto): ...` (code and tests) and
   `chore(probe): ...` (probe and assets), `git add` by path, `Model:` trailer. Stop for the GO.

## RIFERIMENTI

R-OI-1..11, R-VAL-4; discovery P-2026-10-20-1835 §3.2, §3.3, §8 S2; S1 P-2026-10-20-2010; fixture P-2026-10-20-2330;
editor-v2 `CLAUDE.md` §3.3-§3.5 (safe write paths).
