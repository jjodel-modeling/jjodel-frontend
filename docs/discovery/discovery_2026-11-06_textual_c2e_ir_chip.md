# Discovery 2026-11-06 — C2e, the `: <Class>` label of a nameless target on the IR form chip

- Prompt-ID: P-2026-11-06-2041 (`docs/prompts/claude_2026-11-06_2041_prompt_textual_c2e_ir_chip.md`)
- Session: b234cc36-d004-49fe-8207-b74472791020
- Tree: `~/jjodel-w-c2e`, branch `textual-c2e-ir-chip`, HEAD `2edce622d` (the prompt's commit) on `fc79098ad`, clean
- Executor model: claude-opus-5-5
- Phase 1, read only. This report is a set of hypotheses with evidence, not a reference: whoever uses it downstream rereads the real files.

## 0. Objective

Row 5 of `docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md` §4 (R-TXT-47 D6): the IR form's chip for a reference to a
nameless object should read `: <Class>`, as the default view does after C2d, instead of `''`. A named target and a broken
pointer stay as they are. The prompt asks Phase 2 to **import C2d's helper, not copy it**, to touch only `displayValue`
in `IRFormField.tsx` and the test file, and to stop with Outcome: question if the helper has to change before it can be imported.

## 1. Files read (full paths under `/Users/alfonso/jjodel-w-c2e/`)

| File | Window |
|------|--------|
| `frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx` | whole (1-540) |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | :330-410 (the reference branch), the `^import` and `^export` lines |
| `frontend/src/components/editor-v2/utils/__tests__/namelessRefTarget.test.ts` | whole (1-192) |
| `frontend/src/components/editor-v2/viewpoint/ir/widgets/ReferenceWidget.tsx` | :14-30, :50-60, and a grep for `fromPointer`/`.name`/`label` |
| `frontend/src/components/editor-v2/viewpoint/ir/widgets/ListWidget.tsx` | grep for `name =`/`referenceName`, hit :89 |
| `docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md` | :251-340 (§3.3, §4, §5, §7) |
| `CLAUDE.md` §3.1, §3.2; `frontend/src/model/CLAUDE.md` §3.12; `frontend/src/components/editor-v2/CLAUDE.md` | whole sections |
| `docs/log-inbox/codegen.md` | the C2d entries, :1867-1890 |

## 2. Hypotheses under test

- **H1. C2d left a helper that IRFormField can import.** **Falsified** (read). §3.1.
- **H2. The change is confined to the view layer: it reads the L proxy and writes nothing.** **Holds** (read). §3.2.
- **H3. `displayValue` is the only code that labels a reference target in the IR form.** **Falsified** (read): the
  writable single reference and the writable list label through `referenceName` in `ReferenceWidget.tsx`, not through `displayValue`. §3.3.
- **H4. The broken-chip test still works once the label is no longer `''`.** **Holds** (read). §3.4.
- **H5. D6's precondition, the D5 crop accepted, is met.** **Holds** (read): `docs/log-inbox/codegen.md:1890`,
  «crops c2d-* checked by the chat (RC-23) and by Alfonso («Go», 07:24)».

## 3. Findings

### 3.1 There is no C2d helper to import (H1)

C2d wrote the label inline in the reference branch of `objectVertexToRFNode`. Quoted from `frontend/src/components/editor-v2/utils/jjomTransformers.ts:375`:

```ts
if (!rv.name) labels.set(rv.id, `: ${rv.instanceof?.name || 'Object'}`);
```

Search: `command grep -rn "instanceof?.name || 'Object'\|instanceof?.name ?? 'Object'\|': ' + \|\`: \${"` over
`components/editor-v2`, `common/DV.tsx` and `model/nameLookup.ts`, measured on `2edce622d`. It returns this one line and
nothing else. That line is the positive control: the search does find the label where C2d put it. The file's exports, from
`command grep -n "^export"`, are three: `jjomVertexToRFNode` (:498), `jjomEdgeToRFEdge` (:572) and `transformJjomGraph` (:725).
None of them is a label function.

Importing from `jjomTransformers.ts` would also be the wrong direction if a helper existed there. The file imports
`../sync/syncState` (:31) and the layout adapter (:35-36): the IR form would take the sync layer as a dependency to get
one template literal.

**Consequence.** The prompt forbids a copy, and an import needs a helper that does not exist yet. Adding one means
touching a file outside the prompt's file list (`jjomTransformers.ts`, plus a new module if it goes there). That is the case
for which the prompt prescribes stopping with Outcome: question. See Q1.

### 3.2 Layers (H2)

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [x] L-layer (computed proxies)        — read only
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] View: IR form rendering (viewpoint/ir/, CLAUDE.md §3.1)
```

- **What changes.** The string `displayValue` returns for a pointer whose L target resolves with `name === ''`. Today it
  returns `''` (IRFormField.tsx:154, «`if (l && typeof l.name === 'string') return l.name;`»). After the change it returns
  `: <l.instanceof.name>`, or `: Object` when the metaclass is not readable.
- **What it reads.** `LPointerTargetable.fromPointer(raw)` (:151), and on that proxy `name` (as today) and `instanceof?.name`
  (new). Both are getters with no side effects. No `idlookup` read, no store subscription of its own.
- **Subscriptions.** None added. `displayValue` runs in render and in two `useMemo`s, `rowTexts` (:215-218, deps
  `[field.values]`) and `chips` (:276-297, deps `[field.values, field.options, isPointerValued]`). As the module
  comment says (:142-143), «the caller's subscription already covers the slot values this resolves». What it does not
  cover: renaming the target's **metaclass** while the form is open does not re-render the chip. That is the same limit as
  renaming the target today, and C2d's node has it as well. It is not in scope.
- **What it cannot affect.** It makes no writes: `commitAt`/`clearAt`/`appendAt` (:228-236) receive pointer ids, never
  labels. It does not touch the picker offer (`getOptions`, :210-213), the chip `key` (:290, still the pointer `v`), the colour slot
  (`optionSlot(field.options, v)`, :290), the D-layer `name`, or the name memory (`brokenRefMemory` is not imported here).
  It touches no edge, handle or sync guard: `IRFormField.tsx` imports nothing from `sync/` or `hooks/` (imports :65-83).
- **Cross-layer interaction.** None. §3.12's slot↔name asymmetry concerns writes, and this change makes none.
  The label is display only, as in C2d, and `name` stays `''`.
- **Smoke scenarios.** An IR view with a reference to a nameless target, beside a named target and a deleted one: the
  extended chip input, the read-only single value, and the read-only multivalued rows (§3.3).

### 3.3 The three readers of `displayValue`, and the two that do not use it (H3)

`command grep -rn "displayValue" .../viewpoint/ir/` found four hits in IRFormField.tsx (:147 the definition, then :216,
:282, :359) and the comment at ReferenceWidget.tsx:22. The search reached the file and found its known definition. What
each call site shows for a nameless target today, and after the change:

| Site | Today | After |
|------|-------|-------|
| :282, the chip of the extended chip input (`ChipInputWidget`, multivalued reference or composition when `extendedWidgetFor` picks it) | chip with label `''` | chip `: Port` |
| :359, a read-only or locked single value | the slot is set but shows «empty» (`displayValue(first) \|\| <span …>empty</span>`) | `: Port` |
| :216, the rows of a read-only multivalued field | the row is **dropped** (`.filter(t => t !== '')`) | the row `: Port` is shown |

All three are corrections in the direction the prompt asks for. The second and third go beyond «chip» in name, but they are
the same function.

**Not reached by the change, read:** the writable single reference (`ReferenceWidget`) and the writable reference list
(`ListWidget`) label through `referenceName` (ReferenceWidget.tsx:51-60), quoted:

```ts
const l: any = LPointerTargetable.fromPointer(id);
if (l?.name) return String(l.name);
```

For a nameless target that returns `''`. `ListWidget.tsx:89` then falls back to the raw id, «`const name = referenceName(target) || target;`»,
so a writable list row would show the **pointer id** of a nameless target. This is read, not measured in the app.
R-TXT-46 D4 did not list `ReferenceWidget.tsx`, and the prompt's file list excludes it. See Q2.

### 3.4 The broken test (H4)

IRFormField.tsx:285, «`const broken = label === v;`». A label of the form `: X` cannot equal a pointer id, so a nameless
target stays not-broken. A pointer that resolves to nothing still falls through to `String(raw)` (:156-160) and stays
broken. A non-pointer string (an attribute value) is unaffected, because `fromPointer` does not resolve it and the branch is not taken.
The test's control `displayValue('Running') === 'Running'` (namelessRefTarget.test.ts:114) pins that.

### 3.5 What the test file pins today

- namelessRefTarget.test.ts:106-109 asserts `displayValue('p_nameless')` is `''`. That is R-TXT-46 D4's behaviour, and C2e
  flips it to `: <Class>`. This is the red the prompt asks for first, an existing assertion that changes, not only a new test.
- :74, `compile(displayBody, ['raw', 'LPointerTargetable'])`: the bench extracts the body of `displayValue` and injects its
  free names. A body that calls an imported helper needs that helper injected as a third parameter, or the bench throws
  `ReferenceError` (read; the same holds for the reference-branch bench at :51-54 if `jjomTransformers.ts` starts calling a helper).
- :75, the fixture `p_nameless: { name: '' }` has no `instanceof`, so it would label `: Object`. The new tests add a
  fixture with `instanceof: { name: 'Port' }` for `: Port`.

## 4. Options for the helper (Q1)

- **A. A new pure module**, for example `frontend/src/components/editor-v2/utils/namelessTargetLabel.ts`, exporting
  `namelessTargetLabel(l: any): string`, which returns `` `: ${l?.instanceof?.name || 'Object'}` ``. `jjomTransformers.ts:375`
  calls it instead of the inline literal, and `displayValue` calls it. It has no imports, so vitest can import it directly and
  test it by execution: CLAUDE.md §5 names `model/nameLookup.ts` as the model for this. Files: IRFormField.tsx, the
  test, the new module, and jjomTransformers.ts (one line plus one import). Four files, so rule 19 does not apply, but two of
  them are outside the prompt's file list. jjomTransformers.ts is imported by `useJjomSync.ts` and `portDistribution.ts` (critical zone).
  The change there swaps one expression for a call that returns the same string, and the reference-branch bench (:51-54)
  checks that the output is identical.
- **B. Export the helper from `jjomTransformers.ts`.** One file fewer, but the IR form then imports the sync layer (§3.1).
  Not recommended.
- **C. Copy the literal into `displayValue`.** The prompt forbids it.

## 5. Risks

- **R1.** jjomTransformers.ts sits next to the critical zone. Under option A its diff is one expression and one import, and
  the existing D5 tests (namelessRefTarget.test.ts:126-160) must pass unchanged. That is the proof that its output is byte-identical.
- **R2.** The read-only single value (:359) stops showing «empty» for a set nameless slot. Correct, but the change is visible.
  The app check includes it.
- **R3.** If Q2 is left out, the writable list keeps showing a pointer id for a nameless target, and the IR form then
  labels the same target in two different ways depending on the widget.

## 6. Open questions

1. **Q1.** The helper does not exist: is option A (new pure module `utils/namelessTargetLabel.ts`, and `jjomTransformers.ts:375`
   calling it) approved, which adds two files to C2e's scope?
2. **Q2.** Should `referenceName` (ReferenceWidget.tsx:51-60, reached by ListWidget.tsx:89) get the same label in C2e,
   one more file, or in a lane of its own?
