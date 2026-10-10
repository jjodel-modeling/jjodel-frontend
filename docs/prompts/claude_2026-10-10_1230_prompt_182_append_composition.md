# Prompt: #182, appending to a composition slot moves the element into it

Prompt-ID: P-2026-10-10-1230
Chat: C-2026-10-10-1223
Lane: fast (one function in one file, root cause already read by the chat). Phase 1 short, then Phase 2 in cascade. Tier: light, on Juri's word of 2026-10-10 («nel caso usa modello semplice», RC-32).
Depends: P-2026-10-07-0950
Status: eseguito 2026-10-10 · lane fix/182-append-composition · 9e6ecb9cf
Limite: 60 minuti

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the
RC-26 list, the visual GO), Juri decides for this lane.

Critical zone: the one code file of this lane sits under `viewpoint/ir/`, a row of the table of CLAUDE.md
§3.1, and is none of the six files of §3.2. No hook go-ahead (RC-30) is needed and none is passed. The Layer
Impact Report is still owed, on file, before the diff (step 3 of COME). Go-ahead for the file: Juri,
2026-10-10, «risolvi issue 182» (the issue names `formWrite.ts`).

Worktree: `/Users/juridirocco/development/jjodel-182`, branch `fix/182-append-composition`, cut from
`staging` at the commit that adds this file; `frontend/node_modules` is a symlink to the main tree's (P14:
do not remove it). Before anything else: `pwd` is that worktree, the branch is
`fix/182-append-composition`, `git log -1` is the commit that adds this file, `git status` is empty;
otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-10-1230 · session <id>]` (`session unknown` if you cannot
see it, never invented). Every final message ends with one line:
`Outcome: done | hard-stop | question | blocked`. Every question that has a recommendation carries it in one
line: `Recommended: <one line>`. A message with another Prompt-ID, or with none, is not acted on (P13).

## Context (read by the chat on `e9d694f81`: verify, do not trust; re-measure where a number counts)

**Issue #182** (`gh issue view 182`). `formWrite.appendSlotValue`
(`frontend/src/components/editor-v2/viewpoint/ir/formWrite.ts:259-277`) appends with a raw
`SetFieldAction.new(fresh.id, 'values', value, '+=', isPtr)`. Every other write of that module goes through
`LValue.setValueAtPosition`, which on a containment slot also re-fathers the target and evicts it from its
old container (`frontend/src/model/logicWrapper/LModelElement.tsx:7906-8006`). So a pointer appended to a
**composition** slot leaves the target where it was: `father` stays the model (or the old slot) while the
composition slot lists it. Measured in #174 as arm A8
(`docs/discovery/discovery_2026-10-07_174_nesting_forms.md`, rows A8 and D2), and still asserted as an
unchanged control by `frontend/scripts/smoke/_tmp_174_p2.ts:312-320` on the merged tree. Consequence: the
tree and the export show a root, the container's form shows a child, and deleting the container deletes it
(the cascade is slot-based, R-NEST-5).

**Who reaches `appendSlotValue` with a pointer** (three call sites of `appendValue`, read 2026-10-10):

- `InstanceManagerTab.tsx:2319` and `ConfiguratorTab.tsx:315`, «New … & link». The control is rendered from
  `refSlotsOf` (`InstanceDetail.tsx:445-468`), which scans `shape.refs`, and `shapeAdapter.ts:91` puts a
  reference there only when `r.containment` is false, with `containment: !!(ref.composition)`
  (`useEditorMode.ts:421`). **So the gesture the issue is titled after is never offered on a composition**:
  plain references and aggregations only. A composition gets «Add» (`addObject`, the nested form).
- `IRFormField.tsx:232` (`appendAt`): the `ListWidget` gives a composition no append (`:375`,
  `onAppend={field.isReference ? … : undefined}`), but the chip picker of an extended widget does:
  `onRequestAdd` is set when `field.isMultivalued && isPointerValued` (`:347-349`) with
  `isPointerValued = field.isReference || field.isComposition` (`:263`), and its pick calls
  `appendAt(id, true)` (`:510`). **This is the one user gesture that reaches the bug.**
- `writeCtxLproxy.ts:141`, the `WriteCtx.appendValue` of the form engine: no consumer calls it today.

**What the issue asks**: on a composition the link moves the element into the slot, as JjScript `set` and
the canvas connect do; plain references and aggregations keep today's behaviour.

## COSA

In `appendSlotValue`, and nowhere else: when `isPtr` is true **and** the slot's feature is a composition,
the append is a `setValueAtPosition` at the end of the raw array, and its verdict is returned. Everything
else keeps the `'+='` of today, byte for byte: plain references, aggregations (R-NEST-2: an aggregation
slot that lists an element through `appendValue` shares it), shapeless slots, primitives.

The shape, which is the one `setSlotValue` already has in the same file:

- the composition test is `fresh.instanceof?.composition === true`, on the re-wrapped proxy
  (`const fresh = slot.r ?? slot`), the same predicate as `useFormWidgets.ts:298` and as the cascade
  (`deleteDraw.ts:87`). Not `containment` (it is true for an aggregation too), not `get_containment`;
- the index is `rawValues(fresh).length` (`rawValues` is already imported; holes stay where they are, the
  new value goes after the last position, where `'+='` puts it);
- a value the slot already lists is `writeUnchanged()` and writes nothing (the guard `set_value` has at
  `LModelElement.tsx:8110`);
- otherwise `verdict = fresh.setValueAtPosition(index, value, { isPtr: true })` inside the TRANSACTION that
  is already there, then `fromCore(verdict)`, and `U.isProjectModified = true` only when the result is
  `ok && changed`. A refusal of the core (a containment loop) travels verbatim as `{ok: false, reason}`;
- the non-composition branch is the existing line and the existing unconditional dirty mark.

Update the docblock of `appendSlotValue` (and the sentence of the module header at lines 4-6 that says an
append is a `'+='`) so they say what the function now does and why, citing #182 and R-NEST-9. No other
comment, no caller, no rename, no export change (`appendSlotValue` and `appendValue` keep their
signatures).

Known and accepted, to be written in the docblock and not worked around: `setValueAtPosition` takes its
index from the caller (`LModelElement.tsx:7898-7905`), so two appends to the same composition slot inside
one propagation window target the same index. Every caller issues one append per gesture. Arm C6 below
measures it; it is reported, not fixed.

## DOVE

Phase 1 (read-only on tracked code; the probe is gitignored and may be written and run):

- `docs/discovery/discovery_2026-10-10_182_append_composition.md`, opening with `## 0. Answer in brief`
  (at most 40 lines, P16): the root cause confirmed or corrected with file and line; the reachability
  table above confirmed or corrected (arm S0 is its positive control); the probe's BEFORE column; the
  questions, each with a `Recommended:` line.
- `docs/lir/lir_2026-10-10_182_append_composition.md`, the Layer Impact Report in the template of the
  root rules file, §3.2.
- one row in `docs/decisions.md`, **R-NEST-9**, after R-NEST-8 and before `## Superate`, in the form of
  the rows above it: «`appendSlotValue` on a composition writes through `setValueAtPosition`; plain
  references, aggregations and primitives keep the raw append» (2026-10-10, decided by Juri in issue #182,
  evidence: measured, verified: none, reversible: trunk), with the report as evidence.

Phase 2:

- `frontend/src/components/editor-v2/viewpoint/ir/formWrite.ts`: `appendSlotValue`, its docblock, the
  header sentence. Nothing else in the file.
- `docs/log-inbox/core-nesting-forms.md`: the closing entry (the `log-entry` skill, P9 format).
- this prompt's `Status` line.

Not committed: `frontend/scripts/smoke/_tmp_182_probe.ts`.

Any other file (a caller, `LModelElement.tsx`, anything of the canvas sync, a test helper): stop and ask.

## COME

1. Read the root rules file (§3.1, §3.2, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`,
   `frontend/src/model/CLAUDE.md` (§3.13, §9.3), `docs/PROTOCOL.md` P4, P6, P9, P11, P12, P13, P16,
   `docs/decisions.md` RC-17, RC-20, RC-21 and R-NEST-1..8, the last five entries of
   `docs/claude-code-log.md`, the #174 report (§0, rows A8, G2, D2), and the whole of `formWrite.ts`.

2. **The probe**, `frontend/scripts/smoke/_tmp_182_probe.ts`. Start from
   `frontend/scripts/smoke/_tmp_174_p2.ts` (the chat copied it into this worktree with
   `_tmp_174_measure.ts`; both are gitignored): keep its boot, its fixture (metamodel `MM174`: `Scenario`,
   `Phase`, `Person`; `Scenario.lead` and `Scenario.spare` plain, `Scenario.team` aggregation,
   `Scenario.pathway` and `Scenario.main` composition, `Phase.sub` composition), its helpers (`place`,
   `idOf`, `settle`, `check`, `meas`) and its `page.evaluate` idiom of importing `/src/...` modules; drop
   every arm that is not below; change the port guard to `3182`. Count failures with
   `const r = await …; failures += r;`, never `failures += await …` (`npm run check:scripts` refuses it).
   Run it only through the launcher, in the foreground:
   `node frontend/scripts/lane-run.mjs probe . frontend/scripts/smoke/_tmp_182_probe.ts --port 3182 --id P-2026-10-10-1230`.
   `MODE=before` only measures (every arm is `MEAS`); `MODE=after` asserts. D1 deletes `S1`, so it runs
   last; U1 and V1 use a scenario no other arm touches. The arms:

   - **S0** (positive control of the reachability claim): `makeShapeCtx(modelId).shape().classes.Scenario`
     (`shapeAdapter.ts:118`): the keys of `refs` contain `lead`, `team`, `spare` and neither `pathway` nor
     `main`; the keys of `children` contain `pathway` and `main`. Asserted in both modes.
   - **C1** fresh target, same tick: `createInstance(m, 'Phase', null, null, {name: 'c1'})` then at once
     `appendValue(S1, 'pathway', id, true)`. After: the result is `{ok: true, changed: true}`; `c1.father`
     is the `S1.pathway` slot; the model's `objects` lists it exactly once; `S1.pathway` lists it exactly
     once; the model's `roots` do not contain it.
   - **C2** settled root: a `Phase` root created earlier and settled, then `appendValue` on `S1.pathway`.
     Same assertions as C1.
   - **C3** move: a `Phase` already contained in `S2.pathway` (put there with `formWrite.setValue`), then
     `appendValue(S1, 'pathway', id, true)`. After: father `S1.pathway`; `S2.pathway` no longer lists it
     (a hole counts as not listed); `objects` lists it once.
   - **C4** already listed: the same `appendValue` as C2 a second time. After: `{ok: true, changed: false}`
     and the raw array of `S1.pathway` has the same length as before the call.
   - **C5** loop: `q` contained in `p.sub`; `appendValue(q, 'sub', p, true)`. After: `ok` is false, the
     reason is the core's own string, `q.sub` is unchanged, `p.father` is unchanged.
   - **C6** two appends in one tick (two settled roots, same composition slot, no await between the two
     calls). `MEAS` in both modes, never asserted: both results, the raw array, the father of each.
   - **G2** control: `appendValue(S2, 'team', P2, true)` on the aggregation. Both modes: father stays the
     model, `S2.team` lists it.
   - **R1** control: `appendValue(S1, 'lead', P3, true)` on the plain reference. Both modes: father stays
     the model, `S1.lead` lists it.
   - **D1** after C1: the L proxy `.delete()` of `S1`. After: `c1` is gone, no element is left with a
     father that does not resolve.
   - **U1** `MEAS` only: one undo (`UndoAction.new(1, user).commit()`, as `_tmp_174_p2.ts` does) after a
     C2-shaped move on a fresh root: father, `objects`, the slot. Reported, never fixed here (#177).
   - **V1** `MEAS` only: after C2, the number of v2-flow vertices that represent the moved element and of
     edges from `S1`'s vertex to it, plus every console error and page error of the whole run. A page
     error that the BEFORE run does not have is a failure.

   Run `MODE=before` on the untouched code and keep the output for the report. If an arm cannot be built
   as written, say which and why in the report; do not replace it with a reading of the source.

3. Phase 1 documents: the report, the Layer Impact Report, the row R-NEST-9. One commit,
   `docs(#182): discovery, layer impact report and R-NEST-9 (P-2026-10-10-1230)`. Go on to Phase 2 in
   cascade **unless**: a question has no single recommendation; the fix needs a file outside DOVE; S0
   fails (the chat's reachability claim is wrong); the BEFORE run does not reproduce the bug in C1 and C2
   (father the model, slot listing it). Then stop with `Outcome: hard-stop`.

4. Phase 2: the edit. Then `MODE=after`. **Stop with `Outcome: question`**, without adding a deferral, a
   retry or a second write path, if C1 is refused (the freshly created target does not resolve in the same
   tick) or if G2 or R1 change.

5. Tests. `formWrite.ts` imports the `joiner` barrel: check with one throwaway vitest import whether the
   bench can load it, and report the exact error. If it cannot (expected: `window is not defined`), write
   no unit test and no source-text test (root rules file §5), and declare the gap in the entry's `Notes`:
   the probe is the measure (P11).

6. Gates, all in the foreground, from `frontend/`, each read on its **complete** output with its exit
   status: `npm run typecheck` (the known 14, by file and code as listed in the root rules file §17),
   `npm run test` (the known nine files red at import, nothing else red), `npm run build` (exit 0),
   `npm run check:docs`, `npm run check:addonly`, `npm run check:scripts`.

7. One code commit, `fix(#182): appending to a composition slot moves the element into it (P-2026-10-10-1230)`,
   with the pathspec on the commit itself (`git commit -- <path>`). Body: what changed, the AFTER table
   in three lines, the `Model:` trailer of P6 (the model your session banner shows).

8. Closure, prepared and **not committed** (RC-17): the entry in `docs/log-inbox/core-nesting-forms.md`
   and the `Status` line of this prompt. Then the final message: the two shas, the BEFORE/AFTER table of
   every arm, the gates with their numbers, the diff of `formWrite.ts`, «Decisions taken (unattended)»,
   «Decisions awaiting Juri», the visual checklist below with what the probe already covers, and
   `Outcome: hard-stop`.

9. On a message `[P-2026-10-10-1230] GO`: one commit,
   `docs(#182): lane closure, entry and Status (P-2026-10-10-1230)`, then `Outcome: done`. Do not merge.

**Visual checklist for Juri** (the chat prepares it; list it as given, do not run a browser):

1. Data Manager, an instance with a plain reference: «New … & link» creates the target, the slot lists it,
   the tree shows it as a root. Unchanged.
2. Data Manager, an instance with a composition: the slot offers «Add», and no «New … & link».
3. Configurator: the same two observations.

## NON FARE

- No edit to a tracked file under `frontend/` in Phase 1.
- No edit outside DOVE; no caller touched; no core change (`LModelElement.tsx`, the reducer); no
  VersionFixer migration; no new dependency; no renamed or removed export.
- `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git restore .`,
  `git clean`, `--no-verify`, push, merge, log rotation or folding, writes in another tree (the main tree
  is read-only for this lane), a port other than 3182, a real call to an AI provider, a background gate.

## RIFERIMENTI

- Issue #182; #174 and its report `docs/discovery/discovery_2026-10-07_174_nesting_forms.md`; the ticket
  of 2026-10-08 in `docs/log-inbox/core-nesting-forms.md`.
- `docs/decisions.md` R-NEST-1 (the model lists every instance), R-NEST-2 (aggregation), R-NEST-4
  (eviction returns to the root), R-NEST-5 (the cascade).
- `formWrite.ts` (`setSlotValue`, `fromCore`, `appendSlotValue`); `slotValues.ts` (`rawValues`);
  `LModelElement.tsx:7865-8006` (`setValueAtPosition`, `_clearValueAtPosition`) and `:8107-8114`
  (`set_value`); `useFormWidgets.ts:298`; `deleteDraw.ts:87`; `shapeAdapter.ts:84-118`;
  `InstanceDetail.tsx:421-468`; `IRFormField.tsx:232, 263, 347-349, 375, 510`.
