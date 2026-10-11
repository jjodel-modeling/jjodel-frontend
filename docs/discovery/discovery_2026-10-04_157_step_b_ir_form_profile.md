# Discovery 2026-10-04 — #157 step B: the IR form and InstanceDetail learn the profile

- Request: Juri in chat, 2026-10-04 («appena finito torniamo allo step B»). No prompt file; this session names the request `C-2026-10-04-1453`. Plan source: `docs/discovery/discovery_2026-10-04_157_closing_defects.md` §6 «Step B», which asked for «a short discovery of the offer» first.
- Session: `370af495-384d-49c9-b09e-4acf1b18b261` (from the scratchpad path) · tree `/Users/juridirocco/development/jjodel`, branch `feat/157-environment-config`, HEAD `dcb13dc55`
- Executor: Anthropic Claude Opus 5.5 (session banner)
- Phase 1, read-only on tracked files. Probe `frontend/scripts/smoke/_tmp_157_b_measure.ts` (untracked, `_tmp_*`): a copy of `_tmp_157_close_measure.ts` that closes the delete dialog step A now blocks, plus two measures (B.D3e, B.D3f). Run against a vite on 3000 that this session started (`npm start -- --port 3000 --strictPort`), since no server was listening (`curl` exit 7). Zero page errors, zero fixture/control failures. Logs in the session scratchpad (`verify_B0.log`, `measure_B1.log` … `measure_B3.log`).
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it re-reads the real files.

## 0. Answer in brief

- **D2 and D3d reproduce on `dcb13dc55`**, after step A and #173 (measured). `vault_alpha` (type Vault, hidden) is painted twice on `Scenario_0`, the word «Vault» three times. The `guard` picker on `Scenario_1` lists `vault_alpha` and `vault_beta`. The `lead` picker (single containment, Phase is `read`) lists five Phase elements, and picking `Phase_r` moves it (father DModel → DValue).
- **Two more cases, measured for the first time:** the `pathway` list on `Scenario_2` shows a remove × on `Phase_2` (read), and the `lead` control holding `Phase_r` (read) offers «(none)» and other Phases, so the consumer can evict a read element (D3e, D3f).
- **One premise of the plan is falsified:** the IR form is NOT mounted by the canvas rail. `IRForm` has one import site (`InstanceDetail.tsx:38`) and two mounts (`:589`, `:625`). The Data Manager reaches it through `InstanceDetail` without `permissionOf`, so an optional prop stays inert there.
- **One choke point for the candidates:** every picker offer comes from `offer` (`IRForm.tsx:272-275`), both at render (`useFormWidgets.ts:354`) and when a popover opens (`IRFormField.tsx:194`). Filtering there covers both.
- **The descriptor has no type id** (`typeName` only, `useFormWidgets.ts:77`), so hiding a field typed by a hidden class reads the id off the slot proxy in `IRForm`, with no change to the exported interface.

**Recommendation: Phase 2 with 6 files (Rule 19, list in §6), view only, every change behind an optional prop.**
- A pure `ir/formPermissions.ts` with its test. `IRForm` takes `permissionOf?`, filters the offer (no hidden candidate anywhere; only free `edit` candidates in a containment picker), drops fields typed by a hidden class, and tells each field which values are locked.
- `IRFormField` + `ListWidget`: no × on a locked contained value, and a single containment holding a locked value renders read-only.
- `InstanceDetail` passes `permissionOf` to both mounts, and drops the hidden target, the hidden-typed reference section and the hidden-typed child slot instead of naming them.
- Layer Impact Report in chat with the GO request (CLAUDE.md §3.2). Visual check by Juri.

**Decisions awaiting Juri:** none of RC-26 class. **Questions:** 4, §8, each with `Recommended:`.

---

## 1. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|-----------|---------|----------|
| H1 | D2 and D3d, measured on `705502f0f`, still reproduce after step A (`04d04e100`) and #173 (`88b295f6d` touched `InstanceDetail.tsx`) | **holds** | measured, §3 D2.1, D2.2, D3d.2 |
| H2 | The IR form is mounted by the canvas rail and the Data Manager too (closing report §5) | **falsified** for the rail, **holds** for the Data Manager (through `InstanceDetail`) | read, §4.1 |
| H3 | All picker candidates flow through one function, so filtering there covers render-time and open-time offers | **holds** | read, §4.2 |
| H4 | A read element contained in an `edit` container can be removed from the form (D3e) | **holds** | measured, §3 B.D3e. The closing report's D3e read 0 only because step A now refuses the move that built its fixture (`D3c`) |
| H5 | A single containment holding a read element can be cleared or replaced by the consumer (D3f) | **holds** | measured, §3 B.D3f |
| H6 | The field descriptor carries the feature type id needed to hide a field typed by a hidden class | **falsified** | read, §4.3 |

## 2. Files read

- `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` (lines 44-110, 240-345, mounts of `IRFormField` near 633-640)
- `frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx` (lines 89-110, 159-200, 286-400)
- `frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts` (lines 44-110, 190-240, 279-360)
- `frontend/src/components/editor-v2/viewpoint/ir/widgets/ListWidget.tsx` (lines 1-52, plus `readOnly`/remove grep)
- `frontend/src/components/abstract/tabs/InstanceDetail.tsx` (lines 108-160, 211-256, 368-500, 700-716, plus grep)
- `frontend/src/components/environment/ConfiguratorTab.tsx` (lines 238-246, grep for `permissionOf`)
- `frontend/src/jjform/writeCtx.ts` (`TargetOption`, 106-111)
- `frontend/src/joiner/environmentConfig.ts` (`EnvPermission` :21, `resolveTypePermission` :79, by grep)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (:8141, by grep)
- `frontend/src/components/editor-v2/CLAUDE.md` (§3.11), `docs/PROTOCOL.md` (P4, P5)

## 3. Measures (on `dcb13dc55`, `_tmp_157_b_measure.ts`, consumer = `&profile=`, Vault hidden, Phase read, Scenario edit)

- **D2.1** detail of `Scenario_0`: `{"alpha":2,"alphaAt":["span.ir-ref__name <- ir-field__control","span.instance-manager__ref-name <- instance-manager__ref-text"],"vaultWord":3,"vaultAt":["span.instance-manager__draft-card <- instance-manager__eyebrow","span.instance-manager__ref-name <- instance-manager__ref-text","span.instance-manager__draft-card <- instance-manager__row-name"]}`. Per contrasto, D2.0 PASS: the developer overlay paints `vault_alpha` too, so the instrument has signal.
- **D2.2** `Scenario_1.guard` picker (typed Vault, hidden): `["(none)","Vvault_alphaFree     Objects","Vvault_betaBound Objects"]`.
- **D3d.1** `Scenario_1` form pickers: `["Select a Vault","Select a Phase"]`.
- **D3d.2** `Scenario_1.lead` picker (single containment, Phase read): rows `["(none)","PPhase_rFree Objects","PPhase_sFree Objects","PPhase_0Bound Objects","PPhase_2Bound Objects","PPhase_3Bound Objects"]`; clicking `Phase_r` moves it: father `DModel` → `DValue`.
- **B.D3e** `Scenario_2`, `Phase_2` (read) in `pathway` (father `DValue`): painted in `span.ir-list__name < div.ir-list__row < div.ir-list < div.ir-field`, with `removeInRow: 2` (the `.ir-list__remove` button and its `.bi-x` icon, both matched by the selector, so one ×). Also painted as the inline child's open button and inside its `ReadOnlyGate` form.
- **B.D3f** `Scenario_1.lead` now holding `Phase_r` (read): control text `"PPhase_r"`, picker rows `["(none)","PPhase_sFree Objects","PPhase_0Bound Objects","PPhase_2Bound Objects","PPhase_3Bound Objects","PPhase_rBound Objects"]`. «(none)» evicts `Phase_r`. With #174 open, an eviction leaves an orphan.
- **D3e (old instrument)** reads `0` remove controls on a `Phase_s` row, but `D3c` (step A) now refuses `set Scenario_1.pathway = Phase_s`, so the row does not exist. This is not a measure of absence. B.D3e replaces it.

## 4. Findings (read)

**4.1 One mount site.** `InstanceDetail.tsx:38` «`import IRForm from '../../editor-v2/viewpoint/ir/IRForm';`», mounted at `:589` «`<IRForm objectId={formSubjectId ?? subjectId} host="manager" />`» and `:625` «`<IRForm objectId={childId} host="manager" />`». Search: `command grep -rn "IRForm'"` over `frontend/src` (`.ts`/`.tsx`, tests excluded) returns that one line, and the hit itself shows the search reaches the tree. The canvas renders IR nodes through `IRNodeContent.tsx`, not `IRForm`. `ConfiguratorTab.tsx:537` «`permissionOf={permissionOf}`» passes the profile; `InstanceManagerTab.tsx` has 0 matches for `permissionOf` (control: 4 matches for `InstanceDetail` in the same file, same tool).

**4.2 The offer is one function.** `IRForm.tsx:271` «`const ctx = useMemo(() => makeWriteCtx(), []);`», `:273` «`(featureKey: string) => targetOptions(ctx, objectId, featureKey),`». At render: `useFormWidgets.ts:354` «`const options = isEnum || isPlainRef || isCompositionRef ? offerGroups(offer, name) : [];`». At open: `IRFormField.tsx:194` «`() => (offer ? offerGroups(offer, field.name) : field.options),`». The offer is `FieldOffer = (featureKey: string) => TargetOption[]` (`useFormWidgets.ts:196`), and `TargetOption` is `{ id, label, group? }` (`jjform/writeCtx.ts:106`). The «Bound Objects» heading is a core string (`LModelElement.tsx:8141` «`if (out) out.push({label: 'Bound Objects', options: boundObjects.map(map)});`»). A filter should decide «bound» from the D-layer father, not from that label.

**4.3 No type id in the descriptor.** `useFormWidgets.ts:77` «`typeName: string;`» (a name). The id is on the slot proxy that `describeSlot` reads: `:292` «`const featureType = feature?.type;`». `IRForm` holds the slot proxies (`:334` «`() => describeSlots(slots, spec, offer),`»), so it can drop the hidden-typed slots before or after describing them, with no change to `FormFieldDescriptor`.

**4.4 The remove × and the single containment.** `IRFormField.tsx:341` «`} else if (writable && field.treatment === 'list' && (field.isReference || field.isComposition)) {`» mounts `ListWidget` with `:352` «`onRemove={(i) => clearAt(i, true)}`». `ListWidget.tsx:35` «`onRemove: (index: number) => void;`» applies to every row, gated only by `:47` «`readOnly?: boolean;`» and `:93` «`{!readOnly && (`». Per-row removal needs a new optional prop. The single control: `IRFormField.tsx:370` «`} else if (writable && (field.isReference || field.isComposition) && !field.isMultivalued) {`», with `:381` «`allowNone={field.lowerBound < 1}`», `:383` «`onPick={(id) => commitAt(0, id, true)}`», `:384` «`onClear={() => clearAt(0, true)}`». Both evict the current value.

**4.5 InstanceDetail already knows the profile.** `:88` «`permissionOf?: (classId: string) => DetailPermission;`», `:252` «`const permOfInstance = (id: string | null | undefined): DetailPermission =>`» (exact class of the instance, through `instanceof`). It keeps hidden targets LISTED on purpose, `:112` «`` `isHidden` (#157): a target of a type the profile hides stays LISTED — the form's own``» chips already name it. That reason goes away once the form stops naming them. The «Vault» words: the reference section header `:135` «`{slot.ref.of} [{slot.count}/…]`», the locked label `:140` «`if (isHidden?.(targetId)) {`», and the child bar `:708` «`<span className="instance-manager__row-name">`» with `{child.of}`. Inline children already drop hidden ids: `:364` «`.filter(id => permOfInstance(id) !== 'hidden')`». A read subject's form is wrapped read-only (`:588` «`<ReadOnlyGate readOnly={permOfInstance(formSubjectId ?? subjectId) === 'read'}>`»), so B concerns `edit` subjects holding non-`edit` values.

**4.6 Permission type.** `joiner/environmentConfig.ts:21` «`export type EnvPermission = 'hidden' | 'read' | 'edit';`» and `InstanceDetail.tsx:66` «`export type DetailPermission = 'edit' | 'read' | 'hidden';`». The IR module can take `EnvPermission` from `joiner`. Importing a type from `components/abstract` would point the dependency the wrong way.

## 5. Dependencies and risks

- **Critical zone** (`editor-v2/viewpoint/ir/`, CLAUDE.md §3.1): P5 requires an explicit GO and a Layer Impact Report before any change. No D-layer write path changes: the form writes through the same `WriteCtx` and simply offers fewer writes. No sync, JjOM, canvas or persistence file is involved (§4.1).
- **Developer path byte-identical.** With `permissionOf` absent (the Data Manager, §4.1), the offer, the fields and the controls must be exactly today's. The pure module returns its input unchanged when it has no permission function. A test pins this.
- **Indices.** `ListWidget` addresses removal by raw index (its module comment: «the index is what a removal is addressed by»). Filtering `values` would misaddress removals, so B hides the × per row and never removes rows from the list.
- **Residual, not covered by B:** a value of a hidden SUBTYPE inside a reference typed by a visible supertype still shows its name in the form's chip. The fixture has none, so it is not measured. Pickers are covered anyway, because they filter by the candidate's own class.
- **#174 (two nesting forms, eviction orphan)** stays open. B removes the consumer's gestures that would evict a read element, and changes nothing in the core.
- **Environment.** Vite on 3000 was started by this session. A save of a source file mid-probe would void a run.

## 6. Plan (Phase 2, after GO)

| # | File | Change |
|---|------|--------|
| 1 | `frontend/src/components/editor-v2/viewpoint/ir/formPermissions.ts` (new) | Pure: `offerForProfile(options, { containment, permOfInstance, isBound })` drops hidden candidates, and in a containment also non-`edit` and bound ones; `isLockedValue(id, permOfInstance)`; `hiddenTypedSlot(typeId, permissionOf)`. Identity when no permission function. |
| 2 | `.../ir/__tests__/formPermissions.test.ts` (new) | Executed tests plus a mutation bench (CLAUDE.md §5), including identity without a profile. |
| 3 | `.../ir/IRForm.tsx` | Optional `permissionOf?: (classId: string) => EnvPermission`. Wraps `offer`, drops hidden-typed slots, passes `isLocked` to each `IRFormField`. |
| 4 | `.../ir/IRFormField.tsx` | Optional `isLocked?: (id: string) => boolean`: a single containment holding a locked value renders as the read-only branch; a containment list passes per-row removability. |
| 5 | `.../ir/widgets/ListWidget.tsx` | Optional `canRemove?: (index: number) => boolean`; absent = every row, as today. |
| 6 | `frontend/src/components/abstract/tabs/InstanceDetail.tsx` | Passes `permissionOf` to both `IRForm` mounts; drops hidden targets, hidden-typed reference sections and hidden-typed child slots instead of naming them; the `isHidden` doc comment is updated to say why. |

Gates: `npx tsc --noEmit` complete (baseline 14), `npm run build`, vitest on the new test and on `abstract/tabs/__tests__` (the source-reading tests of `InstanceDetail`), the probe turned into a verifier (D2.1, D2.2, D3d, B.D3e, B.D3f asserted, D2.0 and a developer control unchanged), `npm run smoke`, then Juri's visual check.

## 7. Tickets to open at closure

- None new from this phase. The residual of §5 (hidden subtype in a visible-typed reference) goes in the closing entry's Notes, and becomes a ticket only if Juri wants it tracked.

## 8. Questions

1. GO for Phase 2 with the 6 files of §6 (Rule 19), Layer Impact Report in chat? Recommended: yes.
2. Containment picker in consumer: only free (at root) `edit` elements, or also bound ones whose current container is `edit`? Recommended: only free. A picker that takes an element out of another container is a move the consumer does not see.
3. A hidden target in a reference section: drop it silently, or keep a count without the name («1 hidden»)? Recommended: drop it. The Configurator hides hidden types everywhere else, and a count names their existence.
4. Hidden-subtype values in a visible-typed reference (§5 residual): leave out of B? Recommended: yes, note only. Not measured, and no fixture has one.
