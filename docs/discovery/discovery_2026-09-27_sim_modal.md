# Discovery 2026-09-27: the Simulation roles modal (S11b, S11c), Phase 1

- Prompt-ID: P-2026-09-27-1740, `docs/prompts/claude_2026-09-27_1740_prompt_sim_modal.md`
- Chat: C-2026-09-27-1437. Session: `03ce9bb6-8dbb-409e-a686-4e2176c22cfb` (`~/.jjodel-lanes/P-2026-09-27-1740/session.txt`)
- Tree: `~/jjodel-w-modal`, branch `sim-modal`, HEAD `d318b6a40` (the prompt's docs commit). Executor: Opus 5.5 (`claude-opus-5-5`).
- Read-only phase. No file under `frontend/` written; the one measurement ran from `/tmp/p1740/` against the
  design folder served on 3023, port free before and after, `git status` empty after it.
- This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.
  Tags: **[R]** read in a file at HEAD, **[M]** measured in this phase.

---

## 1. Objective and hypotheses

Answer the design README's five «To confirm» points from the code, compare the modal with today's M2 face field
by field, map every mockup element to an engine key or «presentation only», and cut Phase 2 into slices that
touch no file of the conflict map (`simBridge.ts` and its test, `net*.ts`).

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The bag keys the README calls placeholders exist, and the modal needs no new key | **holds** (§3.1) |
| H2 | A per-role `off` mode exists and the run honours it | **partly**: it exists and the validator and the summary read it; the run does not (§3.2) |
| H3 | E2's exploration gives a proposed value, the markings explored, and whether it closed | **holds**; the mockup's wording of both lines is **falsified** (§3.3) |
| H4 | The validator rejects a derived role whose source is off | **holds**, and its message is the mockup's 4e line verbatim (§3.4) |
| H5 | Data does not apply to Petri nets | **falsified** for the engine, **holds** for the Petri preset except Guard (§3.5) |
| H6 | The mockups' role partitions (4b, 4c) are the presets' | **falsified**: eleven mismatches (§4) |
| H7 | S11b and S11c can be built without a conflict-map file | **holds**; only the resolver that skips `off` keys needs `simBridge.ts` (§11) |
| H8 | The 4a card holds its chips | **falsified**, measured: «Flowchart» ends 39.5 px below the card (§4, item 11) |

## 2. Files read

- `docs/design/simulation-roles/README.md`, `Simulation Roles v2.dc.html`, `Roles Modal.dc.html`,
  `Role Kind Badge.dc.html` (source, and the overview rendered once, §4 item 11).
- `frontend/src/model/simulation/`: `simProfiles.ts`, `roleCatalog.ts`, `profileCodec.ts`, `profileBinder.ts`,
  `bindingCompat.ts` (header and exports), `boundExploration.ts`, `stateAttributesCodec.ts` (1-70 and exports),
  `netCompile.ts` (40-132, 320-556).
- `frontend/src/components/editor-v2/sim/`: `SimulationPanel.tsx` (whole), `simRoleStatus.ts` (whole),
  `modelMarkings.ts`, `metamodelSketch.ts`; `simBridge.ts` by search only (it is not this lane's to edit).
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` (portal, Escape, dialog lines, by
  search) and `SymbolEditorModal.scss:1-40` (the z-index note): the modal precedent, read only (critical-zone folder).
- `frontend/src/styles/tokens/_colors-light.scss` (the semantic colours), `_colors-dark.scss:9`,
  `services/ThemeService.ts:33`.
- `docs/decisions.md` R-SIM-47..55, 65, 78..81, 83, 84, RC-17, RC-21..26; `docs/PROTOCOL.md` P4, P6, P16;
  `docs/log-inbox/simulation.md` (every entry since C1); `docs/discovery/discovery_2026-09-27_sim_profiles_panel.md`
  (§2(f), §4); the backlog report on `simulation-engine`, `discovery_2026-09-27_sim_backlog_lanes.md` §4.2 S9, S10,
  S11, §6-7.

---

## 3. The five «To confirm» points

### 3.1 Bag keys [R]

All flat keys of the M2 bag (R-SIM-2), written by `lmm.state = {...}`:

- **Preset id and profile name: one key, `simProfile`.** `simRoleStatus.ts:197` «export const PROFILE_KEY =
  'simProfile';». A system profile is stored as its id, a user profile as its JSON (`profileCodec.ts:23-25`):
  «return profile.system && isSystemProfileId(profile.id) ? profile.id : JSON.stringify(profile);». The ids are
  `simProfiles.ts:35-37`: `'petri', 'flowchart', 'stateMachine', 'extendedStateMachine', 'dfa', 'nfa', 'moore',
  'mealy'`; the panel lists the first four (`simRoleStatus.ts:194`). The README's `sm, esm, flowchart, pt` are
  `stateMachine, extendedStateMachine, flowchart, petri`. The name is the profile's `name` field
  (`simProfiles.ts:43`); a system profile's name is fixed («Petri net (P/T)», «Flowchart / Activity», «State
  machine», «Extended state machine», `:140-151`). There is no «Default» profile: the mockup's name field shows a
  value no profile has.
- **Per-role mode: inside `simProfile`, not a key of its own.** `modes` of `SimProfile` (`simProfiles.ts:48`),
  serialised only for a user profile; a system profile's modes are rebuilt from its id (`profileCodec.ts:68`).
  Without `simProfile` the modes are inferred from the set keys («Custom», `profileCodec.ts:143-196`).
- **Role bindings:** one `sim*` key per role, `roleCatalog.ts:59-172` (`simNode` … `simTransitionOutput`); Event
  has none (`:137`, `key: null`), it is Trigger's declared type (R-SIM-38).
- **Declarations: `simStateAttributes`**, one JSON string (`stateAttributesCodec.ts:32`), records
  `{name, metaclass, space, domain, initial, equation?}` (`:38-45`), written by `encodeStateAttributes` (`:71`).

No new key is needed (H1 holds). The modal writes the same keys the panel writes today.

### 3.2 The `off` mode [R]

- Exists: `simProfiles.ts:23-26` «| { readonly mode: 'off'; readonly reason: string };». The system profiles give
  every role not in the closure nor in the row's `active` list an `off` with a reason (`:121-123`), e.g.
  «Compiled from control flow» for the Petri group in control flow.
- Read by: `validateProfile` (`:221` «const active = (r: RoleId) => profile.modes[r].mode !== 'off';»),
  `checkability` (`:287` «if (mode.mode === 'off') return false;»), the binder (`profileBinder.ts:397`, only `edit`
  roles get a binding), `bindingVerdicts` (`bindingCompat.ts:275`), the summary's «Set but off» (`simRoleStatus.ts:371-373`).
- **Not read by the run.** `netStcFromRoles` takes every set key whatever the profile (`netCompile.ts:66-86`), and
  the bridge reads `simStateAttributes` unconditionally (`simBridge.ts:337` «const stored = bag?.[STATE_ATTRIBUTES_KEY];»).
  Search: `command grep -rn -E 'simProfile|decodeProfile|storedProfile|mode ===' simBridge.ts stcFromRoles.ts
  netStep.ts`, exit 1, no line; positive control through the same tool, `command grep -rln "mode === 'off'"` over
  `src`, found `simRoleStatus.ts`, `profileCodec.ts`, `simProfiles.ts` and its test. R-SIM-78 already says so:
  «il risolutore che salta le chiavi `off` arriva dopo» (`decisions.md:2087-2094`).
- Consequence for the modal: «Not used» is a statement about the profile, never about the run. A role that is off
  with its key set must say that the key is set (today's «Set but off: …», D8), not that the run ignores it.

### 3.3 Bound exploration output (E2) [R]

- `boundExploration.ts:38-44`: `BoundExploration { max, end: 'closed' | 'unbounded' | 'cap', markings }`;
  `modelMarkings.ts:65-73`: `BoundEstimate { largestInitial, exploration: BoundExploration | null }` (`null` when
  the bag as Apply leaves it makes no net). The cap is 2000 markings over all models (`boundExploration.ts:36`).
- The proposal and its reason are `boundValue` (`simRoleStatus.ts:272-284`): closed gives `max` with «The most
  tokens a place holds over the ${e.markings} reachable markings of the models, guards aside»; otherwise the
  largest initial marking with one of three reasons («the roles after Apply make no net to explore», «a reachable
  marking covers an earlier one with more tokens, so no bound was found», «more than ${e.markings} reachable
  markings, not all explored»).
- A proposal exists only when the value is above 1 (`:298` «if (bound && bound.value > 1)») and the key is unset
  (`:295`); `boundProposalInputs` returns `null` when Bound is not `edit` or is set (`:318`).
- The mockup's lines are wrong twice. «Proposed 4: largest reachable marking, 9 markings explored»: the value is
  the most tokens on one place, not a marking. «Kept 2: exploration did not close»: «Kept» is the summary's word
  for a set key kept over a proposal (`simRoleStatus.ts:239`), and the fallback is a proposal of the largest
  initial marking, not a kept value. The modal quotes `boundValue`'s reason, shortened, never its own paraphrase.

### 3.4 Derived needs its source [R]

`simProfiles.ts:242-244`: «if (mode.mode === 'derived' && mode.from !== undefined && !active(mode.from)) {
defects.push({ code: 'derivedFromOff', roles: [r, mode.from], message: `${label(r)} is derived from
${label(mode.from)}, which is off` });». For Initial marking from Initial this prints «Initial marking is derived
from Initial, which is off», the mockup's 4e text verbatim. The rule is reachable only from a user profile: every
system profile validates (P-2026-09-27-1437 entry). Checkability follows the source too: a derived role with `from`
is bound exactly when its source is (`:283-286`).

### 3.5 Data on Petri nets [R]

- **The engine: yes, all of it.** A Petri transition gets guard sites and action sites (`netCompile.ts:362-366`
  «guardSites: stc.guard ? [t] : [], elseOf: null, actionSites: actionSites(preset, [t], postset)»), and
  `actionSites` is exit on preset places, the transition's own action, entry on postset places (`:122-129`).
  Declarations are compiled after either shape, shape-blind (`:464-492`). The binder's `dataRoles` runs for both
  shapes (`profileBinder.ts:392`).
- **The Petri preset: Guard only.** `simProfiles.ts:140` `active: ['arcWeight', 'inhibitorArc', 'bound',
  'terminal', 'guard']` (R-SIM-54 amended 2026-09-27); Action, Entry, Exit and State attributes fall to `:123`
  «Not used by Petri net (P/T)».
- So in the Petri preset the modal shows Guard as an Optional row and the Data section as not used; a user profile
  based on Petri may turn Action, Entry, Exit and State attributes on, and the engine will run them.

---

## 4. The mockups against the engine

Each item is a place where the mockup states what the code does not do. Phase 2 follows the code.

1. 4b puts **Guard** in «not used»; the State machine preset has it `edit` (`simProfiles.ts:147`).
2. 4b puts **Source** in «not used»; it is half of the closure's either-item `{ anyOf: ['source',
   'ownedTransitions'] }` (`:67`), `edit` in every control-flow preset.
3. 4b shows **Event** as an Optional class row; Event has no key and is derived from Trigger (`roleCatalog.ts:137`,
   `simProfiles.ts:103`, `:120`).
4. 4b shows **Arc, Arc source, Arc target, Arc weight** as «derived from Owned transitions»; in control flow the
   Petri group is `off` «Compiled from control flow» (`:121`), and R-SIM-54 says so in words: «il gruppo Petri net
   è `off` («compiled from control flow»), non `derived`» (`decisions.md:1874-1877`).
5. 4b omits **Inhibitor arc** from Arc's company and lists **Fork, Join** as off: right for State machine.
6. 4c puts **Bound** among the required roles; the Petri closure is Node, Transition, Arc, Arc source, Arc target,
   Initial marking (`:68`). Bound is a parameter of the profile (R-SIM-49, `decisions.md:1849`), `edit` in Petri.
7. 4c puts **Terminal** and **Guard** in «not used»; both are `edit` in Petri (`:140`).
8. 4c's Bound helper texts, §3.3.
9. The match line «N of M roles matched **by name**»: the binder matches by structure first; a name only filters
   or narrows (`profileBinder.ts:10-14`).
10. The Data table has Name, Domain, Min, Max, Initial, Kind, Equation; a record also has **metaclass** (global or
    per metaclass, R-SIM-19), **space** (semantic or presentation, R-SIM-18) and the **enum literals**
    (`stateAttributesCodec.ts:38-45`). The table loses three things the engine reads.
11. **4a overflow [M]** (overview served on 3023, Chromium 1600×1000, `/tmp/p1740/measure.cjs`, exit 1 only at the
    screenshot call after the measure printed): the Control flow card is 192 px high, bottom at 473.0; the chips
    wrap one per row, «State machine» 400.5-432.5, «Extended state machine» 440.5-472.5, «Flowchart» 480.5-512.5,
    so the third chip ends 39.5 px below the card. The engine's name is longer still: «Flowchart / Activity»
    (`simProfiles.ts:142`, R-SIM-54 merged the two).
12. **Reset** and the match line's **Undo / «Bindings cleared»** clear bindings. Clearing is not buildable on
    today's `set_state`: two measurements disagree on whether `{ key: undefined }` removes a key (backlog S9, C1
    report §7.6 against the C1 entry), and R-SIM-78 defers «Clear bindings».
13. The name field shows «Default» and «My profile»: no profile is called Default (§3.1).
14. Accepting, State output and Transition output are in the catalog (`roleCatalog.ts:76`, `:164`, `:168`) and
    nothing reads them (`:9-10`); the mockup does not show them, and the prompt forbids features the engine lacks.

---

## 5. What the modal shows as Required (the chat's point 2)

The code holds two different requirements, and the modal must not merge them:

- **Must be bound for «Checkable»** (R-SIM-48, ratified, `decisions.md:1842`): `requiredRoles(profile)` = the
  shape's closure plus `addedRequired` (`simProfiles.ts:187-191`), checked by `checkability` (`:299-310`).
- **Must not be off** (the validator): a closure item with every side off is `closureRoleOff`; a role that an
  active role depends on and is off is `dependencyOff` (`:223-238`). This is a rule on the mode, not on the binding.

The chat's reading, «in the shape's closure or a dependency of an active role», is exactly the second set. On the
four visible presets it adds to the first set (computed from `simProfiles.ts:139-151` and `roleCatalog.ts`
`dependsOn`): State machine and Extended state machine add **Trigger** (Event identifier and Event depend on it);
Flowchart / Activity and Extended state machine add **State attributes** (Action, Entry, Exit depend on it); Petri
adds nothing. If the modal titled those «Required» while the pill said «Checkable» with Trigger unbound (a turnstile
run by ε steps is checkable today), the pill's own title «All required roles are bound and valid» would state a rule
`checkability` does not apply.

The modal therefore shows, from the code and nothing else:

- **Required**: the items of `requiredRoles(profile)` that are not derived. An either-item with two `edit` sides
  («Owned transitions or Source») is one item of two rows joined by «or»; an either-item whose other side is derived
  from this one (Initial marking from Initial) shows the editable side alone. The count counts items.
- **Parameters**: Bound when it is `edit` (R-SIM-49's word), with the proposal and its reason.
- **Optional**: every other `edit` role. A role that an active role depends on carries «Needed by Event
  identifier» and cannot be turned off: that is `dependencyOff`, the validator's rule and the validator's word
  («needs», `:237`).
- **Derived** (folded with Not used): `derived` roles with `note` and, when `from` is set, its source.
- **Not used**: `off` roles with their reason; set-but-off ones say so.
- The pill: `checkability` with the S11a verdicts once S11c wires them (§8, slice C).

This is decision D1 (§10). The alternative, making the dependency set gate «Checkable», amends R-SIM-48 (§11, item 2).

---

## 6. Today's M2 face against the modal, field by field

References are to `SimulationPanel.tsx` at HEAD.

| Today (M2 face) | In the modal | Status |
|---|---|---|
| Profile select with the four presets, Apply, summary (`:924-945`, R-SIM-79) | stay on the panel; the modal header repeats the preset and the pill | **kept** (the quick path of the demo script) |
| «Configure…» folds the inline groups (`:946-954`) | opens the modal | **moves** (closes R-SIM-79's declared deviation from R-SIM-55) |
| «Shape: control flow. Set Arc for a Petri net.» (`:955-959`) | the preset's shape icon in the header | **disappears**; a Custom bag still flips shape on `simArc` (`profileCodec.ts:144`) but the modal switches shape only by preset |
| Five group folds: General, Control flow, Petri net, Events, Data (`:188-196`, `:960-981`) | sections by mode: Required, Parameters, Optional, Derived · Not used, Data | **replaced**; the group is lost as a heading |
| Role rows, each write immediate with its own undo step (`writeRole`, `:556-579`) | a draft; Apply writes proposals, the rows the user changed and `simProfile` in one assignment, one undo step; Cancel discards | **changes** (D3) |
| Overlap refusal and warning on each write (`:567-574`) | the same check on the whole Apply patch (`profilePatch` does it for proposals, `simRoleStatus.ts:453-455`) | **kept**, moved to Apply |
| «Invalid: Bound (a whole number ≥ 1)» (`:984-986`) | inline under the Bound row | **moves** |
| Event class read-only row (`:860-869`) | Derived row «Event · Declared type of Trigger», its class name or «Set Trigger to enable events.» | **moves** |
| Data selects filtered by type (`:744-765`) | the S11a verdicts: compatible candidates, warn marked, the bound value kept even when incompatible | **changes** (S10, slice C) |
| Declarations table, three lines per row (`:238-426`) | Data section, sticky header with Add attribute, two lines per row keeping metaclass, space and literals | **moves**, restyled |
| Hint «Declare the state attributes…» + Add attribute (`:846-851`, R-SIM-81(3)) | opens the modal on Data with Add attribute focused: still one click from the summary | **kept** |
| «The stored profile is not readable.» (`:852-854`, D6) | also in the modal header | **kept** |
| — | kind badge per row (class, ref, attr, value) | **new** |
| — | match line «N of M roles matched» + Match | **new** (binder output) |
| — | first-open model kind picker (4a) | **new** |
| — | profile name, Save as, modified state, per-role Turn on / Turn off (S11c) | **new** |
| — | validator defects inline and the problem count, Apply disabled (4e) | **new** |
| — | «with warnings» in the pill (S11a verdicts) | **new** |
| seeing the canvas while binding | the modal covers it | **lost** |

## 7. Element map

| Mockup element | Engine key or function | Status |
|---|---|---|
| Model kind cards (4a) | `ProfileShape` `controlFlow` / `petri` (`simProfiles.ts:19`) | exists |
| Preset chips, header preset | `simProfile` = `petri`, `flowchart`, `stateMachine`, `extendedStateMachine` (`PANEL_PROFILE_IDS`) | exists |
| Profile name field | `SimProfile.name` inside the `simProfile` JSON of a user profile; system names fixed | exists (codec, `profileCodec.ts:66-103`); UI new |
| Checkable / Not checkable pill | `checkability(profile, bag, verdicts)` (`simProfiles.ts:299`) | exists; «with warnings» needs `currentVerdicts` (`bindingCompat.ts:288`) |
| Required / Optional / Derived / Not used | §5: `requiredRoles`, `modes`, `dependsOn` | computed, presentation of engine data |
| Role rows | `ROLE_CATALOG` (`roleCatalog.ts:175`) minus the three unread roles (§4 item 14) | exists |
| Binding value | the `sim*` key, or the binder's proposal (`bindProfile`) | exists |
| Kind badge | `RoleDescriptor.kind`: `class` → class; `reference` → ref; the four attribute kinds → attr; `int` → value | exists |
| Derived value text | `RoleMode.note` and `from` (`simProfiles.ts:25`) | exists |
| Bound row and helper | `simBound` digit string; `boundValue` of `BoundEstimate` | exists |
| Data table | `simStateAttributes` records | exists; columns added (§4 item 10) |
| Error line, problem count | `validateProfile` defects (`simProfiles.ts:219`) | exists |
| Match line, Match | `bindProfile` statuses | binder output; Undo of the match is draft-only |
| Reset | revert the dialog's edits to the stored bag | presentation only; never clears a key (§4 item 12) |
| Folds, Cancel, Apply, close | dialog actions; Apply is one `lmm.state = patch` | presentation, Apply exists (`SimulationPanel.tsx:586-602`) |

---

## 8. Phase 2 slices

Six files in all, four of them new, above Rule 19's five: listed here for the GO, per file.

- `frontend/src/components/editor-v2/sim/simRolesDraft.ts` (new): the pure layer of the modal.
- `frontend/src/components/editor-v2/sim/__tests__/simRolesDraft.test.ts` (new): its tests.
- `frontend/src/components/editor-v2/sim/SimRolesModal.tsx` (new): the modal and its declarations table.
- `frontend/src/components/editor-v2/sim/SimRolesModal.scss` (new): its styles (§8.1 names a paired SCSS after the component).
- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: Configure… opens the modal, the inline groups and the
  table leave the panel.
- `frontend/src/components/editor-v2/sim/simulation-panel.scss`: the group and table rules left unused get
  `// TODO: cleanup` (Rule 9), nothing deleted.

Not touched: `simBridge.ts` and its test, `net*.ts`, `simRoleStatus.ts`, `simProfiles.ts`, `profileCodec.ts`, `App.tsx`,
`events/registry.ts`. Identifiers checked free with `command grep -rl` over `frontend/src` [M]: `SimRolesModal`,
`sim-roles-modal`, `sim-roles`, `simRolesDraft`, `roleSections`, `simRoleSections`, `SIM_ROLES_OPEN` all 0 files;
control `SimulationPanel` 6 files.

### Slice A: the pure layer (tests first)

Files: `simRolesDraft.ts`, `simRolesDraft.test.ts`. Exports, all pure:
- `roleSections(profile)`: §5's partition, with either-pairs, `neededBy`, derived notes, off reasons; the three
  unread roles left out unless set.
- `roleKindBadge(role)`: class, ref, attr, value.
- `isFirstOpen(bag)`: no `simProfile` and no catalog key set.
- `draftPatch(profile, bag, bindings, edits, lookup, classIds, estimate)`: proposals on unset keys (R-SIM-78 as is),
  then the user's explicit edits, then `simProfile`; the overlap verdict on the whole; never `undefined` except an
  explicit clear, which writes what `writeRole` writes today.
- `boundHelp(estimate, bagValue)`: the proposal line and title from `boundValue`'s reasons.
- `matchLine(profile, bindings)`: «N of M roles matched».
Tests: the four presets' sections (the Trigger and State attributes cases of §5, Guard in Petri, the Petri group
off in control flow), either-pairs, a Custom bag, the patch never writing over a set key with no explicit edit, an
explicit edit over a set key, the refusal writing nothing, Bound only above 1. A mutation bench on the section
rules, the unset-key rule and the edit merge. No crop: nothing renders.

### Slice B: the modal shell, system presets (S11b)

Files: `SimRolesModal.tsx`, `SimRolesModal.scss`, `SimulationPanel.tsx`, `simulation-panel.scss`.
- Portaled from the panel with `createPortal` onto `document.body` at `var(--z-alert, 10000)` (the precedent's
  stacking note, `SymbolEditorModal.scss:10-16`); `role="dialog"`, `aria-modal`, Escape and backdrop close; no
  registry event and no `App.tsx` mount (D4). `data-theme` sits on the root element (`ThemeService.ts:33`), so the
  portal gets the dark tokens.
- 640 × 600, `height: min(600px, calc(100vh - 32px))`; header, match line and footer fixed, body scrolls; folds and
  value changes do not move the footer.
- 4a with the cards holding their chips (chips in a column, card height by content, both cards stretched).
- Sections of §5; selects over the current option lists; Bound row with `boundHelp`; Derived and Not used; Data with
  a sticky header, Add attribute, rows of two fixed lines.
- The panel: «Configure…» and the declarations hint open the modal (the hint on Data, add focused); the groups and
  the inline table go.
- Probe on 3023, crops into `~/.jjodel-lanes/shots_modal/` at 1600×1000 and 1280×800, light and dark: 4a with a chip
  picked, State machine, Petri with Bound proposed and with a fallback, Data open with two rows, the panel after
  Apply. Readings: the dialog's box, the footer's top before and after each fold, every chip inside its card.

### Slice C: user profiles and compatible selects (S11c, with S10)

Files: `simRolesDraft.ts` and its test (mode edits, the modified copy, the name), `SimRolesModal.tsx`,
`SimRolesModal.scss`.
- Turn on / Turn off per role; a system profile edited becomes a user copy `{ system: false, basedOn, name: '' }`,
  shown «modified» until named; `validateProfile` defects inline under their role and counted in the footer, Apply
  disabled while any stands (4e: «Turn Initial on»).
- The selects list the S11a candidates that are not incompatible, warn ones marked with their `why`; a bound
  incompatible value stays listed and marked. The pill reads `checkability` with `currentVerdicts`, so «with
  warnings» appears in the modal.
- Probe crops: 4e, a modified profile before and after naming, a warn mark, dark.

## 9. Risks

1. **The panel's badge and the modal's pill may disagree** once the pill reads verdicts: `profileSummary` calls
   `checkability` without them (`simRoleStatus.ts:364`, «never «with warnings» (D5)»). Slice C passes the verdicts
   only in the modal unless the panel's badge is computed in `SimulationPanel.tsx` too; `simRoleStatus.ts` stays
   out, since the queued S6-S8 bundle owns `profileSummary`. Decided in slice C, measured on the four demo
   metamodels.
2. **Incompatible verdicts on the demo metamodels** would turn their pill to Not checkable. Measure before wiring.
3. **The dark select rule** `[data-theme="dark"] select` (`_form-system.scss:760`, as quoted by the P-2026-09-27-1501 entry) paints an SVG chevron that
   `.sim-panel__select` cancels (P-2026-09-27-1501); the portaled modal is outside `.sim-panel`, so its selects need
   the same `background-image: none`.
4. **Explicit edits over set keys** go through Apply now, not one write per change: the patch must keep `writeRole`'s
   overlap check, and a clear must write what `writeRole` writes (`undefined`), whatever S9 later decides.
5. **The draft against a live bag**: a collaborative write while the modal is open. The draft holds only the user's
   edits and the chosen preset; stored values are re-read live, and Apply judges the live bag.
6. **Fixtures for the probe**: the modal needs a metamodel per preset. The demo builder
   (`_tmp_demo2_scenario.js`, gitignored in another tree) is read, never written; the probe copies what it needs
   into `/tmp` or a gitignored `_tmp_modal_*`.
7. **Focus and Escape**: a select open inside the modal takes Escape first; the precedent handles an inner popover
   first (`SymbolEditorModal.tsx:227-235`).

## 10. Decisions taken (unattended)

Each inside the lane's perimeter, each reversible on the branch (RC-25).

- **D1.** Required is `requiredRoles(profile)` (R-SIM-48 as ratified); the dependency set shows as «Needed by …»
  and locks the Off toggle (§5).
- **D2.** Bound is shown under «Parameters» (R-SIM-49), not under Required; its helper quotes `boundValue`'s
  reasons, not the mockup's lines (§3.3).
- **D3.** The modal is a draft: Apply writes proposals on unset keys (R-SIM-78 unchanged), the rows the user
  changed, and `simProfile`, in one assignment and one undo step; Cancel discards. An explicit row change over a set
  key is the write the inline select does today, moved into Apply, not a proposal over a set key.
- **D4.** The modal is portaled from the panel, which holds every input it reads: no `SIM_ROLES_OPEN` event and no
  `App.tsx` mount, against the backlog's S11b file list (a plan, not an R- row).
- **D5.** The panel keeps its Profile row, Apply and summary (R-SIM-79); only «Configure…» changes, to open the modal.
- **D6.** Reset reverts the dialog's edits; nothing in the modal clears a stored key (S9 open, R-SIM-78).
- **D7.** Engine names everywhere: «Flowchart / Activity», not «Flowchart»; the match line says «matched», not
  «matched by name»; no «Default» name.
- **D8.** Accepting, State output and Transition output are not shown unless their key is set (then under «Set but
  off»): nothing reads them, and the prompt forbids a feature the engine lacks.
- **D9.** The Data table keeps metaclass, space and enum literals on a second fixed line.
- **D10.** 4a shows only when `isFirstOpen(bag)`; a bag with role keys and no `simProfile` opens on «Custom».

## 11. Decisions awaiting Alfonso

1. **The resolver that makes the run skip `off` keys** needs `simBridge.ts`, a conflict-map file. Without it «Not
   used» speaks for the profile only, which the modal says. Recommended: not in this lane; a lane of its own after
   `sim-derived-diagnostics` and `sim-empty-glyph` release `simBridge.ts`.
2. **The chat's Required definition as a gate.** Making «a dependency of an active role» gate Checkable amends
   R-SIM-48, which Alfonso ratified. Recommended: no; D1 shows the dependency as «Needed by …» and leaves R-SIM-48
   as written.
