# Discovery — metaclass identity across metamodels (homonymous classes in one view)

Prompt-ID: P-2026-09-19-1610 · session 21a23f84 · 2026-09-19 · Fase 1 (read-only)

## Objective

Make `metamodel_1.State` and `metamodel_2.State` two different metaclasses inside one view: the view
can list both or one, and the resolver honours the choice. Design is settled in the prompt
(`AuthoringMetaclassPins = { [name]: string | string[] }`, additive, no `irVersion` bump). This
report confirms the premises of the design against the code and lists what the implementation will
run into. It changes no file.

## Files read

Full paths under `frontend/src/components/`:

- `editor-v2/viewpoint/ir/irTypes.ts` (doc comment and type, lines 219-242)
- `editor-v2/viewpoint/ir/irResolveCore.ts` (`pinAccepts` and its six call sites)
- `editor-v2/viewpoint/ir/metaclassPin.ts` (whole file)
- `editor-v2/viewpoint/ir/tableViews.ts` (lines 55-90)
- `editor-v2/viewpoint/ir/irCreationSeed.ts` (lines 55-120)
- `editor-v2/viewpoint/ir/irPrune.ts` (lines 55-90), `irDefaults.ts` (lines 120-150), `irKindConvert.ts` (grep), `irValidate.ts` (grep), `irInteraction.ts` (grep)
- `editor-v2/viewpoint/ir/__tests__/metaclassPin.test.ts` (header), `ir.test.ts` (lines 455-535)
- `editor-v2/viewpoint/authoring/MatchingSection.tsx` (whole file)
- `editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` (lines 200-232, 405-426, 560-600), `RowAuthoringPanel.tsx` (lines 105-130, 230-258, 336-357), `VertexAuthoringPanel.tsx` (lines 240-275, 515-525)
- `editor-v2/viewpoint/authoring/__tests__/committableMatching.test.ts` (header)
- `editors/viewpoint/properties/DataManagerViewpointPanel.tsx` (lines 120-170)
- `TreeViewSidebar/treeViewScope.ts`, `editor-v2/viewpoint/authoring/authoringMessages.ts` (grep, comment-only hits)
- `ui/Select/Select.tsx` (group rendering)
- `frontend/vitest.config.ts`, `docs/discovery/discovery_2026-07-23_ir_feature_picker_stale.md` (line 243-249), `docs/PROTOCOL.md` (P9 and the inbox rule), `docs/decisions.md` (headers)

Search: `command grep -rn -e authoringMetaclassPins -e 'pins?\.\[' -e 'pins\[' frontend/src`
(`--include='*.ts' --include='*.tsx'`, exit 0, positive control: hits in files known to hold the
string). `frontend/scripts` and `backend` searched separately: one hit, a `_tmp_` smoke script.

## Findings

### (a) Does anything else read the pin as a string?

Every reader that assumes a string, and what it does when handed an array:

| Site | Assumption | Effect of an array, unchanged | In DOVE? |
|------|-----------|-------------------------------|----------|
| `irResolveCore.ts:48-51` `pinAccepts` | `pinned === classId` | `['a','b'] === 'a'` is false: a pinned-to-both view matches nothing | yes |
| `metaclassPin.ts:82-83` `resolveMetaclassId` | `declared(pinned)` with `c.id === id` | false, silently falls through to `appliesTo` / first by name. tsc catches it (`declared(id: string)`) | yes |
| `metaclassPin.ts:99-104` `samePins` | `a[k] === b[k]` | reference inequality for arrays: every reconcile rewrites the map | yes |
| `metaclassPin.ts:151-153` `withMetaclassPins` | `pins[name] = hit.id` | can only produce strings, so an array is normalized away on the first reconcile | yes |
| `MatchingSection.tsx:68` `metaclassChipLabel` | `homonyms.find(c => c.id === pinned)` | no hit, bare name | yes |
| `MatchingSection.tsx:124`, `EdgeAuthoringPanel.tsx:425`, `RowAuthoringPanel.tsx:247` `addMetaclass` | overwrites `[hit.name]: hit.id` | would replace the existing pin instead of appending | yes |

Readers that are safe without a change, all confirmed by reading:

- `tableViews.ts:73` and `DataManagerViewpointPanel.tsx:141` go through the exported `pinAccepts`,
  so they inherit the array semantics. Neither is in DOVE; neither needs a change.
- `DataManagerViewpointPanel.tsx:166` and `irCreationSeed.ts:108,115` write a single string pin.
  A string stays valid by the normalization rule.
- `irKindConvert.ts:54` (`SHARED_KEYS`), `irPrune.ts:68` (`SKELETON_KEYS`, key names only),
  `irDefaults.ts:146` (`delete structural.authoringMetaclassPins`) copy, list or drop the field as
  a whole. `irValidate.ts` has no rule on the field, so an array passes `validateIR`.
- `irInteraction.ts:218`, `treeViewScope.ts:50`, `authoringMessages.ts:17`: comments only.
- `frontend/scripts/smoke/_tmp_plusdlg_verify.ts:365` compares `pins.State === id`: string case only,
  unaffected while a single identity is written as a string.
- Resolver call sites of `pinAccepts` (`irResolveCore.ts:292,296,340,378,413,417`, `tableViews.ts:73`)
  pass `(entry, ancestor.name, ancestor.id)`: the per-ancestor comparison the array case needs.
  The index cache keys on ir object identity (`irRefHashes`), so an edited array is a new ref.
- `ir.test.ts:455-535` already holds a `homonymWorld()` fixture (two metamodels, both `State`, plus
  `A_Sub extends A_State`) and four pin tests: the resolver-level test of the prompt reuses it.

The three panels do not all carry local handlers: `VertexAuthoringPanel` delegates to
`MatchingSection` (line 515). Only `EdgeAuthoringPanel` and `RowAuthoringPanel` hold copies of
`removeMetaclass` / `addMetaclass`; the two blocks are byte-identical (diffed).
`VertexAuthoringPanel.tsx` therefore stays out of the diff.

### (b) Where do the tests of `metaclassGroups` / `metaclassChipLabel` live?

**They do not exist.** `command grep -rn -e metaclassGroups -e metaclassChipLabel -e MatchingSection`
over every `*.test.ts(x)` in `frontend/src` and `frontend/scripts`: one hit, a comment in
`committableMatching.test.ts`. Positive control, same command shape and same paths: searching
`withMetaclassPins` returns `ir/__tests__/metaclassPin.test.ts` (exit 0).

More important, **they cannot be tested where they live.** `vitest.config.ts` includes only
`src/**/__tests__/**/*.test.ts` (no `.tsx`), and `committableMatching.test.ts` states that
`MatchingSection` and the panels are not import-safe in the node env (ui barrel to scss, measured
2026-09-18). `MatchingSection.tsx` imports the `../../../ui` barrel at runtime. So the prompt's
"`metaclassEntries` exported, tested" cannot be met by exporting it from `MatchingSection.tsx`.

CLAUDE.md §5 names the way out: move the pure logic to a module the bench can import
(`nameLookup.ts`, `committableMatching.ts` are the worked examples). `MetaclassChoice` and
`SelectOptionGroup` are types only, so a pure module can `import type` them and stay import-safe.

### (c) Is `metamodelName` unique per metamodel?

**No, and it has happened.** `metaclassChoices` (identical in the three panels) takes
`(mm as any).name || 'unnamed metamodel'` and nothing enforces uniqueness. The 2026-07-23 discovery
(`discovery_2026-07-23_ir_feature_picker_stale.md:243-249`) measured a project with two metamodels
of the same name (`USER_185`), each with its own `State`. Consequences, reported, not solved:

1. `metaclassChipLabel` would print `USER_185.State` for both rows: indistinguishable.
2. `metaclassGroups` keys its `Map` by `metamodelName`, so two same-named metamodels are merged
   into ONE group, and `Select` also uses `key={option.label}` for `<optgroup>`.
3. `metaclassChoices` is built once per mount (`useMemo(..., [])`), so a metamodel renamed while the
   panel is open is stale until remount. Pre-existing.

A tiebreak would need the metamodel id (already available as `mm.id` in the builder) added to
`MetaclassChoice`. `MetaclassChoice` is an exported interface (rule 11): an optional property is
allowed. Not done here; decision requested below.

### (d) Does `Select` render an `<optgroup>` label for a one-option group?

Yes. `Select.tsx:112-120` maps every `SelectOptionGroup` to `<optgroup key={label} label={label}>`
with no special case for one option. The label is shown by the native control. Cosmetic only.

## Risks

1. **Test location (b).** The design's testable helper cannot live in `MatchingSection.tsx`. Needs
   a new pure module (outside DOVE) or a stated gap.
2. **Empty array is inconsistent by design.** `pinAccepts` with `[]` (hand-written ir) is
   `[].includes(id)`, false for everything: the view matches nothing. `withMetaclassPins` treats an
   emptied array as unpinned. The UI never writes `[]`, so this only bites hand-edited IR. The
   prompt's rule for `pinAccepts` ("array pin: `pinned.includes(classId)`") is followed as written
   unless told otherwise.
3. **Same-named metamodels (c)** make two rows look identical and merge picker groups.
4. **Edge help text is not the sentence in the prompt.** The Edge panel has two variants
   (`EdgeAuthoringPanel.tsx:595-596`: "Endpoints and PathBuilder features..." and "References and
   PathBuilder features..."), Row has "PathBuilder features are resolved from...", Matching has the
   sentence embedded in a longer help. The suffix will be replaced per panel, keeping each prefix.
5. **`removeMetaclass` must write the reconciled pin itself** (prompt already says so). Verified in
   the code: `patch` calls `withMetaclassPins`, which returns `next` untouched when `metaclasses`
   is unchanged (`metaclassPin.ts:137`). Removing one of two identities of a name is exactly that
   case.
6. **Unpinned listed name blocks the picker for every homonym** (prompt's rule). A legacy view
   listing an unpinned `State` cannot be narrowed from the dropdown; the author removes the row and
   re-adds. Intended, noted for the visual check.
7. **Log entry position.** The prompt says "entry at the end"; CLAUDE.md §21 / R-RAIL-45 say newest
   first at the top, and PROTOCOL P13 routes a parallel lane's entry to `docs/log-inbox/<lane>.md`.
   I will follow CLAUDE.md/P9 unless told otherwise.

## Open questions

1. **Test module.** OK to create `frontend/src/components/editor-v2/viewpoint/authoring/metaclassEntries.ts`
   (pure, `import type` only) holding `metaclassEntries`, `metaclassGroups`, `metaclassChipLabel`
   and `MetaclassChoice`, with `MatchingSection.tsx` re-exporting them so the three panels keep
   their imports, plus `__tests__/metaclassEntries.test.ts`? It is a file outside DOVE (rule 1b
   does not cover it), and it moves `MetaclassChoice` (rule 2 is respected by the re-export). The
   alternative is to leave the three helpers untested and say so in the log.
2. **Same-named metamodels (c).** Leave as is (report only, as the prompt says), or add an optional
   `metamodelId` to `MetaclassChoice` for grouping and labelling?
3. **Decisions series.** New `## R-MCID` header, or under `## Serie R-IRN`?
4. **Empty array in `pinAccepts`.** Keep `includes` as written (matches nothing), or treat `[]`
   as no pin?
5. **Rule 19 listing for Fase 2.** Expected files: `irTypes.ts`, `irResolveCore.ts`,
   `metaclassPin.ts`, `MatchingSection.tsx`, `EdgeAuthoringPanel.tsx`, `RowAuthoringPanel.tsx`, the
   new module (if Q1 is yes), tests in `ir/__tests__/` (`metaclassPin.test.ts`, `ir.test.ts`) and
   `authoring/__tests__/`, `docs/decisions.md`, the log. That is above five files overall, but the
   work is split in commits of at most five each (steps 1, 2, 3, 4 of the prompt).
