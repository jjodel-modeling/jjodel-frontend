# Discovery — Entry, Exit, Action and Guard multi-valued (R-SIM-90)

- Prompt-ID: `P-2026-09-28-2306` (chat `C-2026-09-28-1936`)
- Prompt file: `docs/prompts/claude_2026-09-28_2306_prompt_discovery_sim_multi_roles.md`
- Session: `2bdff479-f921-4208-bd7c-ee3936559a6b` (`~/.jjodel-lanes/P-2026-09-28-2306/session.txt`)
- Tree: `~/jjodel-w-multi`, branch `sim-multi-roles`, HEAD `d73f17383` (the prompt commit; cut from
  `alfonso-frontend-jjtl` at `fb044365b`). `git status` empty at the start.
- Executor: Opus 5.5 (session banner)
- Phase 1, read-only. No file under `frontend/src` written. Two probes, gitignored (`.gitignore:68`):
  `frontend/scripts/smoke/_tmp_multi_probe.ts` and `_tmp_multi_scenes.ts`, run with `npx tsx`, exit 0 both.
  No dev server.

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads
the real files. Tags: **[M]** measured in this phase on HEAD `d73f17383`; **[R]** read in a file of that HEAD or in
the document named.

---

## 0. Answer in brief

- **No codec to reuse.** The prompt's premise is false: `simTrigger` is a single pointer. «Multi-valued Trigger»
  (R-SIM-38) is the M1 reference's multiplicity, read any-of (`netStep.ts:95-97`), not a list in the bag (§3) [R].
- **Storage.** Same key. A plain id for one attribute, a JSON array string for two or more, key removed for none.
  Every saved bag and every demo bag after Apply stays byte-identical. Apply keeps its one `lmm.state = patch`
  (`SimRolesModal.tsx:462`), one undo. The codec is new, in `roleCatalog.ts` (§3).
- **Engine.** `netStep.ts` does not change. The bridge compiles per site the guard texts of every Guard attribute
  and conjoins them in the oracle. It gives the site the union of the action texts of every Action, Entry or Exit
  attribute. An attribute the class does not carry already reads `[]` (`objectSlots.ts:20-29`): true for a guard,
  nothing for an action [R, M]. `NetStc` keeps `guard/action/entry/exit` as the first attribute and gains
  optional lists. So the problems producer, in the critical zone, needs no edit (§4).
- **Silent failure, measured.** Today's engine reads a list value as one pointer. The guard text is `null`, the
  guard is absent, so it is **true**: an unconverted reader enables transitions. The dialog fails loudly instead:
  «Not in this metamodel», «Not checkable» [M, §4.3]. Every reader in §4.1 moves in one commit.
- **Double assignment.** Already a Reset defect for known targets, per transition, across its sites
  (`simBridge.ts:371-377`); a run-time halt otherwise (`netStep.ts:260-261`). The union puts two attributes of
  one element in the same site, so both checks cover them with no new rule (§5).
- **Verdicts.** `judge` runs per element. The role takes its worst element, so any incompatible element means
  «Not checkable» and any warning «with warnings». `checkability`, the pill and the badge are unchanged (§6).
- **Dialog.** Today's select stays, holding the first attribute; the others are 24 px tags in a strip that does
  not wrap; a 24 px «+» select adds one; the control stays 32 px high. The «+» exists only with two or more
  candidates that are not incompatible: 0 or 1 on every multi role of the four scenes [M], so their dialogs
  render and read as today, the chat's row reader (first `select` of the row) included (§7, §10).
- **Binder.** It keeps proposing one attribute, and `profileBinder.ts` is unchanged (§8).
- **Plan.** Tests first, 10 code files and 6 test files, no critical-zone file, cut from the trunk after the
  `sim-outputs-accepting` merge: no conflict, its outputs stay single-valued and independent (§9).
- **Decisions awaiting Alfonso: none.** No item of the RC-26 list is touched: the demo reads and renders the same,
  there is no critical-zone edit, and the interfaces only gain optional members.

Open points, each with its recommendation (§12):

1. Storage encoding. Recommended: plain id for one, JSON array string for two or more, `roleValues`/`encodeRoleValues` in `roleCatalog.ts`, duplicates dropped, a parse failure read as `[raw]`.
2. `NetStc` shape. Recommended: `guard/action/entry/exit` stay the first attribute; add optional `guards/actions/entries/exits`.
3. `else` with several Guard attributes. Recommended: `else` in any of them marks the element; its other non-blank guards stay conjuncts after the complement (G7 generalised).
4. Double-assignment defect at Reset. Recommended: no new rule; pin the existing one with a two-attribute test.
5. Role verdict. Recommended: the worst element's verdict; optional `currents` on `RoleCompatibility`.
6. Dialog. Recommended: primary select unchanged, tags for the rest, «+» only with ≥ 2 compatible candidates.
7. Binder. Recommended: proposes one; unchanged.
8. Problems dedup on a second attribute of another type. Recommended: leave `simCheckToProblems.ts` alone before the freeze; ticket.
9. Order. Recommended: Phase 2 from the trunk after the outputs merge.

## 1. Objective

Plan R-SIM-90 (Entry, Exit, Action and Guard multi-valued, `docs/decisions.md:2320-2327`) precisely enough to
implement it in one lane before the freeze. Measure the risks for the four demo scenes. Close the open points,
each with a recommendation.

## 2. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The Trigger list has a bag codec the four keys can reuse (prompt, DOVE) | **falsified** | `pointer()` reads one non-empty string, `netCompile.ts:34-37`; `simTrigger` is one row of `ROLE_KEYS`, `:54`; the list is the M1 slot, `objectReferences`, `objectSlots.ts:31-37` [R] |
| H2 | A saved single string reads as a one-element list, no migration | **holds, with the §3 codec** | Every writer writes one id string: `draftPatch`, `simRolesDraft.ts:200-208`; `profilePatch`, `simRoleStatus.ts:501-515` [R]. The demo exports carry no `sim*` key (0 hits in all four `.json`, positive control `_state` found) [M] |
| H3 | The engine skips an attribute the class does not carry, for guards and actions | **holds** | `objectSlotValues` returns `[]` without a slot of that feature, `objectSlots.ts:25-28`: a guard text `undefined` is absent, true (`simBridge.ts:183-185`, `guardEvaluator.ts:62`); an action list empty assigns nothing (`simBridge.ts:227-229`, `actionEvaluator.ts:233-234`) [R]; test `actionEvaluator.test.ts:434-458` (R-SIM-89); probe `M1.notCarried` = `[]` [M] |
| H4 | `netStep.ts` needs no change | **holds** | Its guard is a conjunction over `guardSites` through the oracle, `netStep.ts:104-112`; the actions come per site through the oracle, `:251-268`. Both lists live in the bridge's tables (§4) [R] |
| H5 | A double assignment across attributes is already detected | **holds** | Reset: `simBridge.ts:371-377` keys the targets of one transition across all its sites; run: `netStep.ts:260-261`; pinned by `simBridge.test.ts:896-905` [R] |
| H6 | The four demo scenes read the same after | **holds by construction** | One attribute per role, stored as the plain id (§3); at most one non-incompatible candidate per multi role on every scene, so no «+» (§10) [M on sketches from the builder spec] |
| H7 | Phase 2 needs no critical-zone file | **holds** | With `guard` etc. kept as the first attribute, `simCheckToProblems.ts:111-120` still type-checks and reads a real pointer (§4.4) [R] |
| H8 | A reader missed in Phase 2 fails loudly | **falsified for the engine** | Probe `M1.list`: guard text `null`, `absent: true` [M] |

## 3. Storage (question a)

**There is no list codec for Trigger [R].** The bag holds flat string keys (R-SIM-2, `simRoleStatus.ts:24-27`).
Every reader filters on `typeof value === 'string' && value`: `netCompile.ts:34-37`, `bindingCompat.ts:170-171`
and `:293`, `simRoleStatus.ts:309-312`, `simRolesDraft.ts:54-56`, `SimulationPanel.tsx:862-866`. The any-of
reading of R-SIM-38(3) is over the M1 slot: `triggersOf`, `netCompile.ts:445`; `accepts`, `netStep.ts:95-97`:
`return event === null ? t.triggers.length === 0 : t.triggers.includes(event);`.
The two JSON codecs of the bag are `simProfile` (`profileCodec.ts:73`) and `simStateAttributes`
(`stateAttributesCodec.ts:105`). Both are JSON in a string, which is the precedent to follow.

**Recommended encoding.** Same key.
- `encodeRoleValues(ids)`: `undefined` for `[]`, the id itself for one, `JSON.stringify(ids)` for two or more.
- `roleValues(raw)`: a non-string or blank value is `[]`. A trimmed text that starts with `[` is parsed and
  filtered to non-empty strings, **duplicates dropped** (first kept). A repeated attribute would otherwise assign
  every one of its targets twice, which is a spurious `double-assignment`. **A parse failure reads `[raw]`**, a
  dangling pointer that the dialog judges «Not in this metamodel», so it fails loudly and is never silently
  unbound. Any other string is `[raw]`. Both amendments come from the RC-27 verifier (§12).
- Ids cannot start with `[`: `makeID` produces `Pointer…` ids (`joiner/classes.ts:596`), and `isPointer` tests
  that prefix (`:1809`) [R].

A single string is therefore read as a one-element list, as R-SIM-90 asks. Kept as a string, it keeps every
presence check right with no edit: `isSetKey`, `isFirstOpen`, `inferCustomProfile`, `setButOff`, `declareHint`,
`profileBagSigOf` (`SimulationPanel.tsx:891-898`). It also keeps the exported types `Roles`
(`simRoleStatus.ts:121`), `DraftEdits` (`simRolesDraft.ts:149`) and the patch type
`Record<string, string | undefined>` (`:200`) unchanged.

A native array would be dropped by each of those `typeof … 'string'` filters. The panel would then read the role
as unset (`SimulationPanel.tsx:865`), and the types would change. Both would break Rule 11.

**Apply and undo [R].** One `lmm.state = result.patch` (`SimRolesModal.tsx:462`). The patch values stay strings,
so an Apply is still one undo step (R-SIM-78 D3, the header of `simRolesDraft.ts:6-10`). With one attribute
per role the patch is byte-identical to today's. `runSignature` serialises each key with `JSON.stringify`
(`simBridge.ts:534`), so a list string changes the signature only when the list changes.

Persistence, read by the verifier and spot-checked here [R]:
- `set_state` (`joiner/classes.ts:2356`) passes string values through.
- The assignment runs in one `TRANSACTION` (`redux/action/action.ts:210`), so it is one undo step.
- The verifier measured a save/load round trip (`JSON.stringify` plus lz) that returns a JSON string
  byte-identical.
- No VersionFixer, export or import path touches `_state` keys.

## 4. Engine (question b)

### 4.1 Every site that reads the four keys [R]

A search of `simGuard|simAction|simEntry|simExit|stc.guard|stc.action|stc.entry|stc.exit` over `frontend/src` and
`frontend/scripts` (`command grep -rn`, exit 0) found the sites below. As a positive control, the same search finds
the catalog rows `roleCatalog.ts:145-157`.

| # | Site | Reads | Change |
|---|---|---|---|
| 1 | `netCompile.ts:46-55`, `:74-77` | the keys as pointers into `NetStc` | decode the four with `roleValues`: first → `guard`…, all → `guards`… |
| 2 | `netCompile.ts:248` | `stc.guard ?` gates the guard sites | unchanged (the first exists iff the list is non-empty) |
| 3 | `netCompile.ts:260-263`, `:362-363` | `saysElse`: `view.values(edge, stc.guard)[0]` | over every Guard feature (§4.2, Q3) |
| 4 | `simBridge.ts:177-189` `compileGuards` | `objectSlotValues(lookup, site, stc.guard)[0]` | a list per site, one text per feature carried, `else` skipped |
| 5 | `simBridge.ts:196-201` `makeGuardOracle` | one compiled guard per site | conjunction: a defect first, then false, else true (the rule of `netStep.ts:104-112`) |
| 6 | `simBridge.ts:207-233` `actionFeature`, `compileActionTable` | one feature per site role | the texts of every feature, in feature order, concatenated |
| 7 | `simBridge.ts:273-284`, `:416-446` | guard defects and input reads per site | iterate the site's list |
| 8 | `simBridge.ts:290-299`, `:802-806`, `:851` | `guardText`: the `else` edge and the reason sources | every non-blank text of the site |
| 9 | `simBridge.ts:577-612` `siteSources`, `haltSource` | the halt title's action text | over every feature of the role |
| 10 | `SimulationPanel.tsx:391`, `:398`, `:403`, `:410` | passes `roles.simGuard`, `roles.simAction`… (raw strings) as features | pass the decoded lists |
| 11 | `modelMarkings.ts:88-96` | `compileNet` for the Bound exploration, guards aside | follows #1 and #3, nothing else |
| 12 | `problems/simCheckToProblems.ts:111-120` | `featureOf(stc, role)` for the parse-error dedup | **not touched** (critical zone): reads the first attribute; ticket (§11) |
| 13 | `bindingCompat.ts:290-294`; `simRoleStatus.ts:438-440`, `:483`; `simRolesDraft.ts:263-269`; `SimRolesModal.tsx:498-548` | the dialog and the summary | §6, §7 |

### 4.2 Union and conjunction

- **Actions (union).** For a site, the table is
  `features.flatMap(f => objectSlotValues(lookup, site.element, f))`, then `compileActions`. A feature the element
  does not carry contributes `[]`, which is the reading R-SIM-89 already proved (`actionEvaluator.test.ts:453-457`).
  The oracle, the parallel write and the halts stay as they are (`actionEvaluator.ts:227-247`,
  `netStep.ts:247-268`). The order among attributes changes only the order of `label.assignments`, never σ′
  (R-SIM-17).
- **Guard (conjunction).** `compileGuards` gives each site the list of compiled texts of the features it carries.
  A feature it does not carry, or leaves blank, is absent and contributes true (R-SIM-17). The oracle conjoins that
  list per site. The core already conjoins the sites (`netStep.ts:103-112`), so the guard of t is the conjunction
  over its sites and features. Disjunction appears nowhere, so adding a binding never enables a transition.
- **`else` (Q3).** An edge says `else` when any Guard feature it carries holds the literal. When every other Guard
  feature of that edge is blank, `resolveElse` drops its site as today (`netCompile.ts:165`). Otherwise the site
  stays, and the bridge compiles its texts without the `else`. Its other guards are then conjoined after the
  complement, as G7 does for a fused transition's other edges (`netStep.ts:167-171`). With one attribute this
  path never runs, so the demo is unchanged. The alternative, a new «mixed else» defect, adds a `NetDefectCode`
  literal that the registry would not see (`simCheckToProblems.ts:158`).

### 4.3 The silent failure [M]

`_tmp_multi_probe.ts` ran `netStcFromRoles` and `compileNet` on a one-transition net, then read the guard text as
the bridge does.
- With `simGuard: 'A_guard'` the text is `"false"`, so the guard is not absent (the positive control).
- With `simGuard: '["A_guard","A_cond"]'`, `stc.guard` is the JSON string itself. The text is `null` and the
  guard is `absent: true`: the transition is enabled.

So a Phase 2 that misses one reader of §4.1 #1-#9 degrades a guard to true without any signal. The same happens
to a project saved with a list and opened on a build without R-SIM-90, such as 3001 before it is rebuilt. Each
reader needs a test (§9.1), and multi-bound metamodels must not be saved to a shared file before the MODELS build
carries the lane.

### 4.4 `NetStc` and the outputs slice

`NetStc` is exported (`netTypes.ts:129-154`). Changing `guard?: string` to a list would break Rule 11 and
`simCheckToProblems.ts:113`, which is in the critical zone. The recommendation keeps the four fields as the first
attribute and adds `guards`, `actions`, `entries`, `exits` as `readonly string[]`, optional. A hand-built STC in
the tests (`guard: 'A_guard'` only) still works through a helper `featuresOf(stc, role)`, which returns
`stc.guards ?? (stc.guard ? [stc.guard] : [])`.

R-SIM-50/51 coexist unchanged. On `sim-outputs-accepting` (`0c488fad3`), `simStateOutput` and
`simTransitionOutput` are single-valued rows of `ROLE_KEYS`. `transitionOutputs` reads `t.actionSites` filtered
to `role === 'transition'`, and this lane leaves the action sites as they are [R, `git diff` of that branch
against its merge base `93e964141`]. The codec applies only to the four keys flagged `multi` in the catalog.

## 5. Double assignment (question c)

**Today [R].**
- At Reset, `actionDefectsOf` keeps one `targets` set per transition across all its sites (exit, own, entry). A
  folded target met twice is the defect `double-assignment` on the transition (`simBridge.ts:371-377`:
  `` `${target.attr} of ${where} is assigned twice in one step` ``).
- A target that reads σ or the event is left to the run, which halts on the second write
  (`netStep.ts:260-261`: `if (written.has(key)) return halted({ kind: 'double-assignment', … })`).
- Both are pinned by `simBridge.test.ts:896-905`. `stcChecks.ts` has no such rule (0 hits for `double` in its
  source, `command grep -n`; positive control `checkElse` at `:259`).

**With several attributes.** The union puts every attribute of one element into the same site's list (§4.2). Two
attributes of one class that write the same known target therefore meet in that `targets` set at every transition
touching an instance that carries both. That is the chat's «static defect at Reset», per instance rather than per
class. A class-level check without M1 cannot fold targets (they are paths over M1, `judgeActionTarget`,
`actionEvaluator.ts:165-177`), and a class with no instance has nothing to run.

**Q4, Recommended:** no new rule. Add one test: two Entry attributes of one class write `p2.[visits]`, which gives
one Reset defect `double-assignment` and then the halt; distinct targets fire. It pins the reading.

## 6. Verdicts (question d)

- **Per element.** `bindingVerdicts` judges `bag[d.key]` as one id (`bindingCompat.ts:290-294`). On a list it
  must judge each element with `judge` (R-SIM-89 included, `:216-225`).
- **The role.** `current` becomes the worst element: incompatible above warn above ok, the first of the worst in
  list order. An optional `currents` member (additive) carries every element. `currentVerdicts`
  (`bindingCompat.ts:300-306`) and `checkability` (`simProfiles.ts:304-309`: any `incompatible` →
  `notCheckable`, any `warn` → `warnings`) are unchanged. The worst element is right because the engine reads
  every element: an incompatible type makes a defective guard or action (R-SIM-17), not an ignored one.
- **Today on a list [M].** Probe `M2.list.current`: `{"id":"[\"Transition.guard\",\"Transition.cond\"]",
  "verdict":"incompatible","why":"Not in this metamodel"}`, and `profileVerdict` gives `notCheckable`. With one
  attribute the verdict is `ok` and `checkable` (the control).
- **The pill and the badge** both read `profileVerdict` (`simRoleStatus.ts:260-264`), so they change together and
  need no edit.
- **The «Kept» line.** It must name each element. Today it prints the JSON
  (`Kept: Guard (["Transition.guard","Transition.cond"]).` [M]; `simRoleStatus.ts:438-440`, `:483`). With the
  change it reads `Kept: Guard (Transition.guard, Transition.cond).`.

## 7. The dialog (question e)

**Today [R].** A row is a 208 px label column and a value column (`SimRolesModal.scss:301-306`). The value is a
32 px select (`:459-483`) plus a fixed 16 px verdict slot, «a verdict appearing never moves the row»
(`SimRolesModal.tsx:533-542`, `.scss:375-381`). Nothing fixes the row height: it is its content, the 32 px control
plus 2×4 px padding. Nothing clips it either, so wrapping tags would grow the row (`.scss:368-373`).

**Recommended control.** Keep the fixed 32 px, flex, no wrap. Its slots, in DOM order:
1. **The primary select.** It is today's element: aria-label the role, value the first attribute, the
   `--proposed|stored|edited|unset` class and the «Proposed: …» title. Nothing about it changes.
2. **A tag strip** for attributes 2..n: `white-space: nowrap; overflow: hidden; min-width: 0`.
   - Each tag is `sim-roles-modal__tag`: `height: var(--control-height-sm)` (24 px, «chips» per
     `_spacing.scss:37`), `border-radius: var(--radius-sm)` («inputs, tags», `_radius.scss:14`),
     `--color-bg-tertiary`, `--color-border-primary`.
   - Each tag carries a remove button, `aria-label="Remove Transition.cond from Guard"`, the pattern of
     `InstanceManagerTab.tsx:345` and `ChipInputWidget.tsx:127`, with `:focus-visible` on `--color-border-focus`.
   - A clipped strip ends in `+n`, whose title lists every attribute.
3. **The «+» select**, 24 px wide, `aria-label="Add another Guard attribute"`. Its options are the S10 list
   (`compatibleOptions`, `simRolesDraft.ts:402-407`) minus the attributes already chosen.
4. **The existing verdict slot.** It shows the worst element; its title gives each non-ok element as
   `Owner.attr: why`.

Rules for the «+»:
- It is rendered only when the role has two or more candidates that are not incompatible. That count depends on
  the metamodel and the context roles, not on the edits, so it never appears or disappears while the user edits.
- Hidden with `visibility` while the primary is empty, so its slot still holds the width.

Editing the list:
- Clearing the primary promotes the first tag; the pure helpers go in `simRolesDraft.ts`.
- One more rule for the draft: the source class of a tag is `--edited` or `--stored`. The binder proposes one
  attribute, so a tag is never `--proposed`.

**No new dependency.** `JjSelect` supports `isMulti` through `react-select`, but it is 36 px high with hard-coded
colours (`JjSelect.tsx:35-36`, `:91`) and nothing in `sim/` uses it. The recommendation reuses the dialog's own
select and the existing tokens instead. The class `sim-roles-modal__chip` is already taken by the model-kind
picker (`SimRolesModal.tsx:672-677`), and the chat's walk probe counts it
(`~/jjodel-w-demo-modal/frontend/scripts/smoke/_tmp_demomodal_walk.ts:106`), so the tags need a class of their own.

**Keyboard [R].** The dialog root stops every key (`SimRolesModal.tsx:892`:
`onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') onClose(); }}`), so a Backspace on a tag never
reaches the editor (header `:28-31`). The tab order is primary select, then each remove button, then «+».
Enter and Space on a remove button remove the tag, and Delete or Backspace on a focused remove button do the same.
Escape still closes the dialog. The strip is `role="list"`, `aria-label="Other Guard attributes"`.

## 8. The binder (question f)

`bindProfile` proposes one value or none per role: `one()`, `profileBinder.ts:89-93`, and `dataRoles`, `:305-341`.
It looks for attributes on the lineage only (`attributesOf`, `:147-150`), so a mixin's attribute is never a
proposal. Two Expression attributes on T give `candidates`, which are never picked (D3, `:309-310`).

**Q7, Recommended:** the binder still proposes one, and Apply writes it as the plain id. Binding every tie would
widen the union of actions without a user's choice. It would also end the D3 rule. `profileBinder.ts` is
therefore unchanged, although R-SIM-90's «Touches» line names it: a declared deviation, not an amendment.

## 9. Phase 2 plan (question g)

### 9.1 Tests to write first (red on the trunk after the outputs merge)

1. `roleCatalog.test.ts`, the codec:
   - `undefined` and `''` read `[]`; `'A'` reads `['A']`; `'["A","B"]'` reads `['A','B']`;
     `'["A","A"]'` reads `['A']`; `'[bad'` reads `['[bad']`.
   - Encoding `[]` gives `undefined`, `['A']` gives `'A'` (byte-identical), `['A','B']` gives JSON.
   - `multi` is set on the four Data roles only.
2. `netCompile.test.ts`:
   - The list fills `guard` with the first and `guards` with all; a single string gives `guards: ['A']`.
   - The outputs keys are not decoded.
   - `else` in a second feature, alone and mixed (Q3).
3. `simBridge.test.ts`, on the `cnet` fixture of `:896`:
   - Conjunction: two Guard attributes, one false, so the transition is not a candidate, and the reason names both
     texts.
   - A second Guard attribute the class does not carry reads true.
   - Union of two Action attributes: both assignments appear in Last step.
   - Two Entry attributes on one target: the Reset defect, then the halt.
   - The halt title quotes the second attribute's text.
   - Parity: the existing file stays green unchanged.
4. `bindingCompat.test.ts`: a list is judged per element; `current` is the worst; a list with one incompatible
   element gives `notCheckable` through `profileVerdict`.
5. `simRoleStatus.test.ts`: the «Kept» text names each attribute; `declareHint` works on a list.
6. `simRolesDraft.test.ts`:
   - Row helpers: set the primary, clear it and promote the first tag, add, remove.
   - `draftPatch` writes the plain id for one, JSON for two or more, `undefined` for none, all in one patch.

Mutants to kill:
- any-of in place of the conjunction;
- the first feature only;
- a single element encoded as JSON;
- the first element's verdict in place of the worst;
- an `else` that drops the other conjuncts;
- a repeated attribute left in the list.

### 9.2 Files, sizes

| File | Change | Size (lines) |
|---|---|---|
| `model/simulation/roleCatalog.ts` | `multi?: true` on four descriptors; `roleValues`, `encodeRoleValues` | +30 |
| `model/simulation/netTypes.ts` | four optional lists on `NetStc` | +8 |
| `model/simulation/netCompile.ts` | decode in `netStcFromRoles`; `saysElse` over the features; mixed `else` keeps its site | +25 / −6 |
| `model/simulation/bindingCompat.ts` | judge per element, worst `current`, optional `currents` | +15 / −3 |
| `components/editor-v2/sim/simBridge.ts` | §4.1 #4-#9, `featuresOf`, `ActionFeatures` gains the lists | +45 / −20 |
| `components/editor-v2/sim/simRoleStatus.ts` | «Kept» compare and text on lists | +8 / −2 |
| `components/editor-v2/sim/simRolesDraft.ts` | list helpers for a multi row | +30 |
| `components/editor-v2/sim/SimRolesModal.tsx` | the multi row of §7 | +70 / −10 |
| `components/editor-v2/sim/SimRolesModal.scss` | strip, tag, «+» slot, tokens only | +45 |
| `components/editor-v2/sim/SimulationPanel.tsx` | decode the features it passes (#10) | +5 / −3 |
| the six test files of §9.1 | | about +250 |

That is 16 files, above the five of Rule 19, so they are listed before the first edit.
- Unchanged: `netStep.ts`, `actionEvaluator.ts`, `guardEvaluator.ts`, `stcChecks.ts`, `profileBinder.ts`,
  `simCheckToProblems.ts`.
- No critical-zone file, so no Layer Impact Report. The two sim directories are not in `CLAUDE.md` §3.1.

Two code commits:
1. codec, engine and bridge, with their tests;
2. the dialog.

The chat then checks the four scenes, plus one fixture with two Guard attributes and a mixin Entry.

### 9.3 Order and conflicts with `sim-outputs-accepting`

That branch changes `netCompile.ts`, `netStep.ts`, `netTypes.ts`, `roleCatalog.ts` and three tests
(`git diff --stat` against its merge base: 7 files, +245 −7) [M].

**Q9, Recommended:** cut Phase 2 from the trunk after that merge; then there is nothing to merge. If Phase 2 had
to start before it, the textual conflicts expected are these:
- `roleCatalog.ts`: both edit the header's provisional-roles sentence (`:9-12`).
- `roleCatalog.test.ts`: likely a union.
- `netTypes.ts` and `netCompile.ts`: the hunks are apart (their rows after `eventIdentifier`, `netTypes.ts:142`,
  and after `netCompile.ts:54`; ours at `:146-150` and `:50-51`), so both merge clean.
- `netStep.ts`: untouched here.

There is no semantic conflict (§4.4).

## 10. The four demo scenes, before and after

Sketches were built from the builder spec (`docs/demo/models_2026_simulator_demo.md` §2.1-2.4, lines 54-57,
114-116, 171-174, 252-256). The exports are `DProject` records with no metamodel and no `sim*` key [M, §2 H2].
`_tmp_multi_scenes.ts` bound each scene with its profile on an empty bag, as a first Apply does [M]:

| Scene | Proposals (script) | Guard | Action | Entry | Exit |
|---|---|---|---|---|---|
| State machine | 7 («7 of 10») | unset, 0 candidates | off | off | off |
| Petri net | 9 («9 of 10») | `Transition.guard`, 1 | off | off | off |
| Extended SM | 10 («10 of 13») | `Transition.guard`, 1 | `Transition.effect`, 1 | `State.entry`, 1 | unset, 1 (`State.entry`) |
| Flowchart B | 10 («10 of 13») | `ControlFlow.guard`, 1 | `ControlFlow.effect`, 1 | unset, 0 | off |

«1» and «0» count the candidates that are not incompatible. All four scenes read `checkable`. The proposal counts
match the script's match lines, which is the positive control that the sketches are faithful. Consequences:
- Every multi row holds at most one attribute, so it is stored as the plain id and the bags stay byte-identical.
- No multi row has two candidates, so no «+» is rendered, and the rows render and read as today.
- The pill, the badge, the summary and the run are unchanged.

Phase 2 re-measures the scenes on its own dev server.

## 11. Risks

1. **A missed reader degrades a guard to true** (§4.3). Mitigation: each reader of §4.1 #1-#10 gets a test in §9.1.
2. **A list saved, then opened on an older build** silently loses its extra guards. The demo is unaffected
   (no scene binds a list). Do not share a multi-bound project before the MODELS build carries the lane.
3. **The problems-registry dedup** (`simCheckToProblems.ts:117-120`) reads the first attribute's type. A parse
   error in a second attribute of another type is either dropped (Expression first, EString second) or shown twice
   (EString first, Expression second). The panel's defects line is unaffected. Ticket, low.
4. **A long attribute list** is clipped to `+n`. The title holds it all. The row does not grow.

## 12. Decisions

**Decisions taken (unattended): none.** This lane is read-only; the chat adopts the recommendations below under RC-21.

**Decisions awaiting Alfonso: none.** No RC-26 item is touched.

**RC-27.** Points 1 and 2 choose a data model (bag encoding, `NetStc` shape). A second agent checked them; its
line is below.

1. Recommended: plain id for one, JSON array string for two or more, `undefined` for none; `roleValues`/`encodeRoleValues` in `roleCatalog.ts`, duplicates dropped, a parse failure read as `[raw]`.
2. Recommended: keep `NetStc.guard/action/entry/exit` as the first attribute; add optional `guards/actions/entries/exits`.
3. Recommended: `else` in any carried Guard attribute marks the element; its other non-blank guards stay as conjuncts after the complement.
4. Recommended: no new double-assignment rule; pin the existing Reset check with a two-attribute test.
5. Recommended: the role's verdict is its worst element's; optional `currents` on `RoleCompatibility`.
6. Recommended: primary select unchanged, 24 px tags for the rest, «+» only with two or more compatible candidates, fixed 32 px.
7. Recommended: the binder proposes one attribute; `profileBinder.ts` unchanged.
8. Recommended: `simCheckToProblems.ts` untouched before the freeze; ticket for the dedup of a second attribute.
9. Recommended: Phase 2 from the trunk after the `sim-outputs-accepting` merge.

The RC-27 second opinion was a read-only sub-agent with its own probe (`_tmp_verify_multi_roles.ts`, deleted by
it). Its verdict was «holds-with-changes». The changes, and what this report does with each:
1. Read `else` over every Guard feature, in `compileNet`, `elseDefectsOf` and `guardText`. Already in the plan:
   §4.1 #3 and #8, Q3.
2. `CompileDefect` gains an optional `feature`, and the producer dedups on it. This touches the critical-zone
   producer, which needs its own approval. Not adopted before the freeze: Q8, the ticket of §11 risk 3.
3. The panel passes decoded lists. Already in the plan: §4.1 #10.
4. `roleValues` drops duplicates, and a parse failure reads `[raw]`. Adopted in §3 and §9.1.

Verified: every reader of the four keys and of the four `stc` fields (`command grep -rn`, exit 0, positive
control `simNode` in 24 files), plus a probe of the `else` case, the dedup, the halt title, the save round trip,
and both encodings on today's reader. It would be falsified if a single-attribute bag decoded differently from
today, or if `set_state` or save changed a string.

## 13. Files read

- **Model** (`frontend/src/model/simulation/`): `roleCatalog.ts`, `netCompile.ts`, `netStep.ts`, `netTypes.ts`
  (105-260), `actionEvaluator.ts`, `guardEvaluator.ts`, `objectSlots.ts`, `bindingCompat.ts`, `profileBinder.ts`,
  `simProfiles.ts` (299-310), `stcChecks.ts` (grep).
- **Model tests**: `__tests__/actionEvaluator.test.ts` (290-330, 430-459).
- **Dialog and panel** (`frontend/src/components/editor-v2/sim/`): `simBridge.ts` (100-1088), `simRoleStatus.ts`,
  `simRolesDraft.ts`, `SimRolesModal.tsx` (349-608, 668-680, 892), `SimRolesModal.scss` (298-484),
  `SimulationPanel.tsx` (370-415, 855-905).
- **Bridge tests**: `sim/__tests__/simBridge.test.ts` (880-905).
- **Problems producer**: `frontend/src/components/editor-v2/problems/simCheckToProblems.ts` (1-200).
- **UI survey** (by a read-only sub-agent, citations re-checked): `components/ui/JjSelect/JjSelect.tsx`,
  `components/abstract/tabs/InstanceManagerTab.tsx`, `components/editor-v2/viewpoint/ir/widgets/ChipInputWidget.tsx`,
  `formWidgets.scss`, `styles/tokens/_spacing.scss`, `_radius.scss`.
- **Docs**: `docs/decisions.md` (RC-20..28, RC-33, R-SIM-17, 24, 38, 50-52, 86-90), `docs/PROTOCOL.md` (P3, P4,
  P16), `docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`.
- **Other trees, read-only**: the `sim-outputs-accepting` diff (`git diff 93e964141 sim-outputs-accepting`) and
  the chat's walk probe in `~/jjodel-w-demo-modal` (85-130).
