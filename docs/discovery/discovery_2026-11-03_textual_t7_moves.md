# Discovery 2026-11-03 — textual T7: moves between containers and reorder of ordered features

- Prompt-ID: P-2026-11-03-1225 (`docs/prompts/claude_2026-11-03_1225_prompt_textual_t7_moves.md`)
- Session: bd5a9d00-ceb6-4e29-b7d9-0cd41a15d20f
- Tree: `~/jjodel-w-textt7`, branch `textual-t7`, HEAD `0f2126a8b`
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

## Objective

Phase 1 of T7: read the JjScript M1 path a move and a reorder would take, say where the textual layer can read
whether a feature is ordered, and decide whether any stop condition of the prompt fires (planner change beyond the
planner's own files, a change to the metamodel's data or a breaking exported interface, an amended R- row).

## Hypotheses under test

1. **H1: an M1 move needs a new JjScript command.** Falsified. A containment `+=` (or `=` on a single-valued
   containment) already moves the object through the core; the planner does not mirror it (H2).
2. **H2: the effects planner mirrors an M1 move.** Falsified, two defects in `effectsPlanner.ts`, both inside the
   planner's own files (see F3, F4).
3. **H3: `ordered` is in the data the textual layer reads.** Partly. It is not in the eval context's shells (read,
   F6), but it is in the D-layer of every feature, reachable from the lookup by the shell's `id` (F5, F6): a local
   read, no change to the metamodel's data or to `eval.ts`.
4. **H4: a reorder of an ordered containment has a JjScript form.** Holds, as `-=` then `+=` of each object that has
   to go to the end; there is no insert-at-index (F7, F8).
5. **H5: a stop condition fires.** Falsified, with one decision recorded for Alfonso (D-2), which reads R-TXT-19 as
   written and does not amend it.

## Files read

- `frontend/src/codegen/textual/textDiff.ts`, `textMatch.ts`, `textApply.ts`, `metamodel.ts` (whole)
- `frontend/src/codegen/textual/ui/TextualTab.tsx` (lines 60-644)
- `frontend/src/codegen/textual/parser.ts` (236-265, 385-414, 586-681)
- `frontend/src/jjscript/executor/commands/move.ts` (whole), `types.ts` (215-239)
- `frontend/src/jjscript/executor/effectsPlanner.ts` (1-120, 290-569), `referenceWrite.ts` (whole)
- `frontend/src/jjscript/executor/commands/instance.ts` (436-450, 1280-1380), `commands/eval.ts` (490-539)
- `frontend/src/jjscript/executor/planWorld.ts` (grep `root`)
- `frontend/src/components/editor-v2/preview/PreviewBar.tsx` (1-110)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (1236-1250, 7885-7984, 8040-8116)
- `docs/decisions.md` (R-NEST-1..8, 5815-5884; R-TXT-21, 7027-7036)
- `docs/discovery/discovery_2026-11-01_textual_viewpoint.md` (765-789)

## Findings

**F1 (read).** `move` is the M2 command: `commands/move.ts:92` writes `SetFieldAction.new(targetElement, 'parent',
toElement.id, undefined, true)` and `validateMove` (`:137-220`) knows classes, attributes, packages, literals only.
The planner declares it unsupported: `effectsPlanner.ts:45` «Declared limits: `let`, `forall`, blocks, `move`, `copy`
and an M2 `remove` are `unsupported`». Not the path for M1.

**F2 (read).** The core moves a contained object on a containment write. `LModelElement.tsx:7964-7978`:
«let oldContainer: LValue | LModel = lvalo.father; ... // detach contaied object from old parent ...
oldContainerValue.setValueAtPosition(i, undefined as any, undefined); ... SetFieldAction.new(val as Pointer<DObject>,
"father", c.data.id, undefined, true)». The old slot keeps a hole at that index (written `undefined`), which
`linkedIds` (`referenceWrite.ts:42-44`) and `textInputOf` (`TextualTab.tsx:148`, `.filter(... !== null)`) drop. The
eviction on the way (`LModelElement.tsx:7899-7905`) lists the object in `model.objects`, which R-NEST-1 wants
(«`DModel.objects` lists every instance of the model, nested ones included»). The prior report said the same
(`discovery_2026-11-01_textual_viewpoint.md:772-773`: «A containment `set p.f += x` moves `x` through the core»).

**F3 (read).** The planner's `putIn` (`effectsPlanner.ts:543-551`) re-fathers but leaves the id in the old slot:
«source.references[ref.name] = [...write]; ... if (e) e.container = { owner: source.id, feature: ref.name };». A
plan of a move therefore shows the object in two slots. Fix inside the planner: take it out of the previous slot.

**F4 (read).** The planner's `-=` refuses what the executor accepts. Planner, `effectsPlanner.ts:521-523`:
«const bornHere = ...; if (ref.containment && bornHere && !target.root) return fail('WOULD_ORPHAN', ...)», with
`root: o.father === modelId` (`planWorld.ts:173`). Executor, `instance.ts:1335`: «if (containment && father ===
refProxy.id && !isListedAtRoot(targetModel, targetId))», where `isListedAtRoot` reads `model.__raw.objects`
(`instance.ts:440-443`), and R-NEST-1 lists every instance there. A move to the top level (`-=`) is planned as
`WOULD_ORPHAN` and runs. Fix inside the planner: a `listed` flag on `PlanElement` (optional, additive), filled by
`planWorld.ts`, read by the `-=` guard.

**F5 (read).** `ordered` is a D-layer field with the Ecore default: `LModelElement.tsx:1244` «ordered: boolean = true;»
(`DTypedElement`), with `get_ordered` at `:1552`. The export emits only the non-default (`EcoreService.ts:312`
«if (attr.ordered === false) parts.push(`ordered="false"`)», `:367` for references). The Info panel exposes it in
advanced mode (`components/editors/Info.tsx:172` «{ field: 'ordered', label: 'Ordered', ... hint: 'position
matters', advancedOnly: true }»).

**F6 (read).** The eval context's shells carry no `ordered`: `commands/eval.ts:499-531` builds attributes with `id,
name, type, className, isDerived, isId, multiValued, defaultValue` and references with `id, name, type, containment,
multiplicity, upperBound, lowerBound, opposite, className`. Search `grep -n "multiValued\|containment:\|upperBound:\|ordered"
eval.ts`: hits at 507, 523, 525 (the positive control), none for `ordered`. The shell's `id` is the D id, and
`TextualTab.tsx:201-205` holds the lookup when it builds the reading. So the textual layer can read
`lookup[shell.id].ordered` locally, in `textInputOf`, into an optional `ordered` of `TextAttribute` /
`TextReference` / `TextFeature` (additive). `diffText` already takes `ordered` as a predicate (`textDiff.ts:84-85`);
today no caller passes it (`TextualTab.tsx:283-288`), so every feature compares as unordered.

**F7 (read).** No insert-at-index in JjScript M1 (`referenceWrite.ts:4-8`: `=` appends on a many-valued slot, `+=`
appends, `-=` takes out by value). `+=` of an object a containment slot already holds appends a duplicate: the
de-duplication of `set_values` never marks an id (`LModelElement.tsx:8059` «val = val.filter((e: any)=> { if (typeof e
!== 'string' || !idmap[e]) return true; idmap[e] = true; return true;} )»). So a reorder is `-=` then `+=` of each
object that goes after the ones that stay. With append only, the objects that stay are the longest prefix of the
text order whose relative order the slot already has; the rest are re-appended in text order. This is minimal for
append-only writes (the moved set must be a suffix of the target order); an LIS-minimal reorder would need
insert-at-index.

**F8 (read).** The executor's `-=` on a containment child takes it out by value and fathers it to the model
(`instance.ts:426-431`, `removeLinked`), which with R-NEST-1 leaves it a listed root until the `+=` that follows
puts it back. Both lines run inside the one undo group of `applyAsOneStep` (`PreviewBar.tsx:60-70`).

**F9 (read).** The textual apply does not consult the planner: `applyScript` reads only `preview.world.level`
(`PreviewBar.tsx:82`) and runs each line through `JjScriptService.execute`. The planner changes (F3, F4) are for the
preview and for parity, not a gate of T7.

**F10 (read).** Identity on cut and paste. `textMatch.ts:7-8`: «A span collapsed to nothing (a cut) is no
evidence», so a cut-and-paste matches by step 3, «Class and name elsewhere in the model ... a move», uncertain
(`textMatch.ts:199-206`), and R-TXT-26 asks the panel. The editor can carry the cut spans itself: the decorations
inside the cut selection (`TextualTab.tsx:454-463`, `carriedSpans`) are known at the cut; a paste of the same text
can re-attach them at the paste offset. That is span evidence of R-TXT-22, not a guess; a copy (no cut) carries
nothing, and the original keeps its span, so the copy is new.

**F11 (read).** The outer refusal has no position. `MisplacedOuter` is `{ target, feature, id }`
(`textDiff.ts:60-64`), and the parser drops the token when it resolves an outer reference (`parser.ts:661` «if
(r.syntax.outer !== undefined) return { outer: r.syntax.outer };»). The tab can find the `@` token of that id inside
the owner's parsed span (`parsed.spans`), without a parser change.

**F12 (read).** The small item: the textual parser does check enum literals (`parser.ts:395-400`, a `lit` node
accepts only an `ID` among the literals). The unchecked quoted string is in the JjScript planner and executor
(`effectsPlanner.ts:363-376`, `attributeScalar`: a string literal returns `{ ok: true, value: ... }` before the
enumeration check). Outside the textual files of the prompt: left, listed in the closing report.

## Dependencies and risks

- R1: the holes the core leaves in an old slot (F2). Read, not yet measured in the app: the acceptance measures the
  slot after a move.
- R2: D-2 below makes every many-valued feature of an existing model ordered, since the D default is `true`. A text
  that reverses a list now reorders the model, where before T7 it was refused (references) or ignored (attributes,
  unordered by default in the pure layer). The printer prints model order, so an unedited text never reorders.
- R3: a move and a reorder both land as `+=` / `-=` lines in the one undo step; a failed line leaves the others
  applied, as today for every T6 line.
- R4: transient containment loops on a swap of nesting: the lines move in text order, a container before what it
  contains; covered by a test.

## Decisions taken

- D-1: a move is written as containment `+=` (many-valued) or `=` (single-valued) into the new slot, and `-=` from
  the old slot to the top level; no new JjScript syntax (R-TXT-21 (6)), no change to `move.ts`.
- D-2: `ordered` is read from the D-layer by feature id, Ecore semantics: ordered unless the feature says
  `ordered: false`. The pure layer keeps its default (no predicate: unordered), so its tests stand.
- D-3: a reorder is the append-only minimum of F7, as `-=` / `+=` pairs after every other line.
- D-4: the planner learns the move (F3) and the listed-root `-=` (F4), with an optional `listed` on `PlanElement`
  and an optional move origin on the planned reference; nothing breaks outside.
- D-5: the Text tab carries the spans of a cut to an identical paste (F10); otherwise a move stays uncertain and
  goes through the panel.
- D-6: the outer marker is found in the owner's span by the tab (F11); no parser change.

## Decisions awaiting Alfonso

1. D-2: confirm the Ecore default (every feature ordered unless set otherwise), versus ordered only where the
   data says `true` and a later annotation, which would read every feature as ordered today anyway.
2. D-5: confirm that a cut and an identical paste are certain evidence (no panel), as R-TXT-18 «a rename or a move
   keeps the object» suggests inside the editor.
3. F12: the unchecked quoted string on an enum attribute in JjScript (`attributeScalar`): a lane of its own?
