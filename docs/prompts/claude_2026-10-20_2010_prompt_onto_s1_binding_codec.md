# Ontological instantiation, S1: the binding codec, its reader and its check

Prompt-ID: P-2026-10-20-2010
Chat: C-2026-10-20-1835
Front: instance-of
Lane: fast (new files and their tests only, no critical zone, plan fixed by the discovery §8 S1)
Status: eseguito 2026-10-20 · lane oi-s1 · code bd633a5e0 + 73d68cea6, log b88ec7927 · vitest green, mutation bench 6/6 red · no visual check (pure layer, no importer) · branch unmerged until the 3.2.0 tag
Request: https://claude.ai/code/session_015eDtjagjBtuPHhhhfUTTo5
Depends: none
Corregge: —
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s1`, branch `oi-s1`, cut from `alfonso-frontend-jjtl` at the commit that adds this prompt,
`frontend/node_modules` symlinked (P14). Model and tier: as pinned (RC-16). Before anything else check `pwd`, the branch
and a clean `git status`; otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-10-20-2010 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line, and
a question with one recommendation inside this perimeter is answered as recommended and recorded (unattended, RC-21).
Every gate runs in the foreground (P16). No push, no merge: the branch waits for the 3.2.0 tag (release freeze
2026-10-23), nothing of this front enters 3.2. Do not touch the `Status` line.

## Contesto (non rifare l'analisi)

Decisions R-OI-1..11 in `docs/decisions.md`; the discovery
`docs/discovery/discovery_2026-10-20_ontological_instantiation.md`, read §0, §3.1 (the record shape), §3.7 (FTG+PM, the
type reference alone) and §8 S1. The first client is the UML metamodel of
`docs/archivio/claude_2026-10-14_uml_class_object_notation.md` §2. Precedents to imitate, not to edit:
`frontend/src/codegen/engine/templateCodec.ts` (versioned codec, unknown keys survive),
`frontend/src/model/simulation/bindingCompat.ts` with `frontend/src/components/editor-v2/sim/metamodelSketch.ts`
(a pure judge over a sketch of the metamodel), `frontend/src/model/nameLookup.ts` (a pure module importable by vitest).

## COSA

A pure layer, with no React, no store access and no write, that S2 and later slices will call through a thin adapter.

1. `frontend/src/model/ontological/bindingCodec.ts`: the shape `{ v: 1, bindings: OntoBinding[] }` stored under the bag
   key `ontoBindings` (export the key as a constant; it must not start with `sim`, see
   `frontend/src/model/simulation/__tests__/watchCodec.test.ts:21`). `OntoBinding` has `name` and the roles of R-OI-2 and
   R-OI-7: `typeReference` (required); `featureContainer`, `generalization` (`{ via, general }` or `{ direct }`),
   `slotContainer`, `definingFeature`, `valueHolder`, `abstractFlag`, `featureType`, `defaultValue`, `valueKinds`
   (optional). Every id is an M2 id string. `decode(raw)` returns `{ ok: true, value }` or `{ ok: false, errors }`, keeps
   unknown keys of the record and of the root, refuses an unknown `v`; `encode(value)` is its inverse.
2. `frontend/src/model/ontological/bindingReader.ts`: functions over a small read interface defined in the same file
   (`OntoReadView`: the metaclass id of an M1 object, the M1 ids held by a reference of an object, the value of an
   attribute of an object, the owner metaclass of a reference). No import from the store. It gives: the record that
   applies to an instance (by the metaclass of its classifier, through the type reference, R-OI-8); the instantiable
   classifiers of a model for a record (M1 objects whose metaclass owns the feature container, minus those whose
   abstract flag is true); the feature closure of a classifier over the generalization, own features first then
   inherited ones in breadth-first order, each feature once, with the cycles reported as data and not followed; for an
   instance, the missing features (no slot) and the orphan slots (defining feature not in the closure), as data.
3. `frontend/src/model/ontological/bindingCheck.ts`: a judge on a record against a metamodel sketch (reuse the
   `MetamodelSketch` type of `metamodelSketch.ts` by import, do not copy it): every id exists and has the right sort
   (reference or attribute); the type reference and the slot container are owned by the same instance metaclass; the
   defining feature is owned by the slot metaclass; the four slot roles (slot container, defining feature, value holder,
   value kinds) are all present or all absent (R-OI-7); two records with the same name are refused.
4. Tests in `frontend/src/model/ontological/__tests__/`, one file per module, on hand-built views and sketches of the
   UML subset of the design §2 and §6 (the library: Publication abstract, Book and Magazine under it, Library, Member).
   Required cases: codec round trip and unknown keys kept; Book's closure is `isbn, genre, title, year` in the order the
   reader defines; a cycle Publication ⇄ Book is reported and the closure still terminates; Publication is not
   instantiable, Book is; an Association classifier selects the `link` record and an Enumeration selects none; a record
   with the type reference alone (the FTG+PM case) is valid; a record with three of the four slot roles is refused;
   missing and orphan slots on an instance whose class gained `pages` and lost `isbn`.

## DOVE

Write only the three modules above, their tests, and the log entry of the closure (P9, `docs/log-inbox/instance-of.md`).
The chat flips the Status. Nothing under `components/`, `redux/`, `joiner/`, `viewpoint/`, and no critical-zone file.
If the design needs one, stop with `Outcome: question`.

## COME

1. Baseline: `npm run typecheck` through `node scripts/run-quiet.mjs` from `frontend/` (zero errors, RC-48).
2. Write the modules and the tests; `npx vitest run src/model/ontological` green; typecheck zero.
3. Mutation bench (P12): remove the cycle guard, remove the inherited hop, drop the abstract filter, accept three slot
   roles; each mutation must turn at least one test red. Restore, record the four results in the commit body.
4. One `feat(onto):` commit with the modules and tests (`git add` by path, `Model:` trailer, P6), then report and stop
   for the chat's GO; the closure commit (log entry, Status flip) follows the GO (RC-17).

## RIFERIMENTI

R-OI-1..11, R-VAL-4 (`docs/decisions.md`); discovery P-2026-10-20-1835; the precedents named in Contesto.
