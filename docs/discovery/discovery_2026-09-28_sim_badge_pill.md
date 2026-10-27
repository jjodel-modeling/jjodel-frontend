# Discovery — the panel's summary badge against the dialog's pill

- Prompt-ID: `P-2026-09-28-0140` (chat `C-2026-09-27-1437`)
- Prompt file: `docs/prompts/claude_2026-09-28_0140_prompt_sim_badge_pill.md`
- Session: `f2e5d051-f261-496b-a50a-96fbd661f2c3` (`~/.jjodel-lanes/P-2026-09-28-0140/session.txt`)
- Tree: `~/jjodel-w-badge`, branch `sim-badge-pill`, HEAD `0e1454831` (the prompt commit; cut from
  `alfonso-frontend-jjtl` at `d861cc922`). `git status` empty at the start and after every probe run.
- Executor: Opus 5.5 (session banner)
- Phase 1, read-only. No file under `frontend/src` written. One probe, gitignored:
  `frontend/scripts/smoke/_tmp_badge_probe/` (`badge.test.ts`, `reencode.test.ts`, its own `vitest.config.ts`),
  run by `npx vitest run --config scripts/smoke/_tmp_badge_probe/vitest.config.ts`, exit 0, logs in
  `/tmp/p0140_probe.log` and `/tmp/p0140_reenc.log`. No dev server started.

This report is a set of hypotheses with evidence, not a definitive reference. Anyone who uses it downstream should
re-read the real files. Tags: **[M]** measured in this phase on HEAD `0e1454831`; **[R]** read in a file of that
HEAD, or in the document named.

---

## 0. Answer in brief

- The badge and the pill are two computations over the same bag, and they differ on **two** inputs, not one:
  the S11a verdicts (the ticket) and the **bindings rule** (the panel binds system profiles only, the dialog every
  profile but «Custom»).
- Measured disagreements, five of eight cases [M]: a warning binding («Checkable» against «Checkable with
  warnings», the ticket), an **incompatible** binding and a **stale id of a deleted class** («Checkable» against
  «Not checkable», worse than the ticket says), «Custom» with a warning binding, and a **user profile** with a
  required key unset («Not checkable» against «Checkable» after Apply). The two controls agree.
- Found on the way [M]: after the first Apply of a user profile the dialog stays **pending** (Apply enabled, pill
  title «After Apply.»), because `decodeProfile` reorders the keys of a derived mode, so the re-encoded
  `simProfile` differs from the stored string. Aligning the panel's bindings rule with the dialog's would carry
  this onto the panel, so the fix has to come with it.
- Proposed single source: `profileVerdict(profile, after, sketch)` in `simRoleStatus.ts`, which is `checkability`
  with the S11a verdicts of `after`, with `VERDICT_LABEL` for the words and `profileBindings(profile, sketch)` for
  the bindings rule. The panel reaches it through `profileSummary`, the dialog through `draftStatus`. Six code
  files and two test files, none in the critical zone (§6).
- S6, S7 and S8 are **not** panel/dialog verdict mismatches. They are M2 summary defects, all three still open
  [R]. S8 has a twin in the dialog. Recommended: keep them in `sim-summary-fixes`, not in this lane (§5, Q4).
- Demo: none of the four demo metamodels triggers a disagreement [R, the 1740 entry: «S11a ok on every bound demo
  role»]. The demo shows the panel's `Custom · Not checkable` (`docs/demo/models_2026_simulator_demo.md:41`), so
  the colour of `not-checkable` must not change (Q3). Phase 2 re-measures the four scenes on 3034.

## 1. Objective

Find where the panel's summary badge and the dialog's pill compute their verdict, list every consumer, build the
inputs on which they disagree, give the current state of S6-S8, and propose the minimal change that makes one
function the single source of the verdict, with no change to what the four demo scenes show.

## 2. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The two verdicts differ only by the S11a verdicts (the 1740 ticket, `docs/log-inbox/simulation.md:341`) | **partly** | The verdicts differ (§3.1 vs §3.2). The bindings rule also differs: `SimulationPanel.tsx:261` binds `selected.system`, `SimRolesModal.tsx:370` binds `!custom` (§3.3) [R]. Case U disagrees for that reason alone [M] |
| H2 | They disagree only on a `warn` binding, «Checkable» against «Checkable with warnings» | **falsified** | Cases I and D: an `incompatible` binding gives «Checkable» on the panel and «Not checkable» in the dialog [M]. `checkability` turns any `incompatible` into `notCheckable` (`simProfiles.ts:306-308`) [R] |
| H3 | No demo metamodel triggers a disagreement | **holds, not re-measured here** | 1740 Phase 2 entry, `simulation.md:338`: «S11a ok on every bound demo role» [R]. Phase 2 re-measures (§8) |
| H4 | S6-S8 are panel/dialog verdict mismatches (the prompt's COSA) | **falsified** | They are M2 summary defects (backlog report §4.2). S8's hint is computed twice, once in the panel and once in the dialog (§5) [R] |
| H5 | On a pristine dialog, the panel and the dialog judge the same `after` bag | **holds** | The dialog's `draftBag` of a pristine input is the bag plus `profileSummary`'s proposals plus `simProfile`, a key that neither `checkability` nor `bindingVerdicts` reads (§3.4) [R]. Controls C0 and C1 agree [M] |
| H6 | The single source needs no critical-zone file | **holds** | §6's files are all under `components/editor-v2/sim/` and `model/simulation/`. Neither directory is in `CLAUDE.md` §3.1 [R] |

## 3. The two computations, side by side

### 3.1 The panel's badge [R]

`frontend/src/components/editor-v2/sim/SimulationPanel.tsx`:

- `:258` `const selected: SimProfile = (chosen ? systemProfile(chosen) : undefined) ?? stored.profile;`
- `:260-263` the bindings, system profiles only:
  `() => (selected.system && sketch ? bindProfile(selected, sketch) : null),`
- `:285-288` `() => profileSummary(selected, profileBag, bindings, largestMarking),`
- `:480` `const text = profileSummaryText(summary, nameOf);`
- `:485` `<span className={`sim-panel__badge sim-panel__badge--${summary.status === 'checkable' ? 'checkable' : 'not-checkable'}`}>`

`frontend/src/components/editor-v2/sim/simRoleStatus.ts`:

- `:231` `/** `checkability` on the bag as Apply leaves it, with no verdicts: never «with warnings» (D5). */`
- `:232` `readonly status: 'checkable' | 'notCheckable';`
- `:361-364` `const proposals = bindings ? proposalsOf(profile, bag, bindings, largestMarking) : [];` … `const verdict = checkability(profile, after);`
- `:384` `status: verdict.status === 'notCheckable' ? 'notCheckable' : 'checkable',`
- `:390` `pending: bindings !== null && (proposals.length > 0 || bag[PROFILE_KEY] !== encodeProfile(profile)),`
- `:399` `readonly badge: 'Checkable' | 'Not checkable';`
- `:414` `const badge = summary.status === 'checkable' ? 'Checkable' : 'Not checkable';`

`frontend/src/components/editor-v2/sim/simulation-panel.scss:651-671`: `// The verdict of R-SIM-79: Checkable or Not
checkable, never «with warnings» (D5).`, `&--checkable` on `--color-success-muted`, `&--not-checkable` on
`--color-warning-muted` / `--color-warning-text`.

### 3.2 The dialog's pill [R]

`frontend/src/components/editor-v2/sim/SimRolesModal.tsx`:

- `:366` `const profile: SimProfile = draftProfile ?? (preset ? systemProfile(preset) : undefined) ?? stored.profile;`
- `:368-371` `const custom = profile.id === CUSTOM_ID;` … `() => (!custom && sketch ? bindProfile(profile, sketch) : null),`
- `:394` `writeProfile: preset !== null || draftProfile !== null || !stored.custom,`
- `:400-402` `const after = draftBag(input);` `const verdicts: BindingVerdicts | null = sketch ? bindingVerdicts(profile, after, sketch) : null;` `const status = draftStatus(input, verdicts ? currentVerdicts(verdicts) : undefined);`
- `:593` `const statusText = status.status === 'checkable' ? 'Checkable' : status.status === 'warnings' ? 'Checkable with warnings' : 'Not checkable';`
- `:605` `<span className={`sim-roles-modal__pill sim-roles-modal__pill--${status.status}`} title={`${pending ? 'After Apply. ' : ''}${statusTitle}`}>`
- `:865` Apply: `disabled={!pending || defects.length > 0}` (a `notCheckable` draft can be applied).

`frontend/src/components/editor-v2/sim/simRolesDraft.ts:247-250`:
`export function draftStatus(input: DraftInput, verdicts?: …): DraftStatus {` `const c = checkability(input.profile, draftBag(input), verdicts);`

`frontend/src/components/editor-v2/sim/SimRolesModal.scss:96-128`: `// The verdict of the bag as Apply leaves it
(`checkability`).`, `&--checkable` success-muted, `&--warnings` warning-muted / warning-text, `&--notCheckable`
bg-tertiary / text-tertiary.

### 3.3 The shared rule and the two differences [R]

`frontend/src/model/simulation/simProfiles.ts:299-310`, `checkability(profile, bag, verdicts?)`:

```
const status: CheckabilityStatus = missing.length > 0 || given.includes('incompatible')
    ? 'notCheckable'
    : given.includes('warn') ? 'warnings' : 'checkable';
```

`frontend/src/model/simulation/bindingCompat.ts:288-294`, `currentVerdicts`: «The verdicts `checkability` reads:
the bag's value of each role whose key is set.»

| Input | Panel | Dialog |
|---|---|---|
| profile | `chosen` preset, else the stored one | `initialPreset` (= the panel's `chosen`, `SimulationPanel.tsx:608`), else the stored one: equal on open |
| bindings | `selected.system && sketch` | `!custom && sketch` (`custom` is `profile.id === 'custom'`) |
| `after` | bag + `proposalsOf` (`simRoleStatus.ts:361-363`) | `draftBag(input)`: bag + `draftProposals` (which is `profileSummary(...).proposals`) + edits + declarations + `simProfile` |
| verdicts | none | `currentVerdicts(bindingVerdicts(profile, after, sketch))` |
| Bound estimate | `boundEstimate` over `boundProposalBag(selected, profileBag, bindings)` (`:272-284`) | the same over `boundProposalBag(profile, edited, bindings)` (`:377-385`): equal on open |
| words | `Checkable`, `Not checkable` | `Checkable`, `Checkable with warnings`, `Not checkable` |

«Custom» agrees on both sides: `inferCustomProfile` gives `id: 'custom'`, `system: false`
(`model/simulation/profileCodec.ts:185-187`), unbound by both rules. A **user profile** (`system: false`,
`id: 'user'`, `simRolesDraft.ts:285`, `:296-308`) is bound by the dialog and not by the panel.

### 3.4 Why the pristine `after` bags are equal [R]

`simRolesDraft.ts:183-187` builds the proposals through `profileSummary` on `bagWithEdits(bag, {})`, a copy of the
bag. `:200-207` adds `simProfile` when `writeProfile` and drops every entry equal to the stored one. `checkability`
reads role keys only (`simProfiles.ts:288-291`). `bindingVerdicts` reads the role keys, and `simNode`,
`simTransition`, `simArc` and `simTrigger` for the context (`bindingCompat.ts:158-171`, `:278`). Neither reads
`simProfile`.

## 4. The inputs on which they disagree [M]

Probe `_tmp_badge_probe/badge.test.ts` computes both sides with the components' own expressions, the panel's from
`SimulationPanel.tsx:255-288` and `:480-486`, the dialog's from `SimRolesModal.tsx:347-402` and `:593`. It runs
them on a pristine dialog opened on the stored profile. Sketch: PEST SM as `profileBinder.test.ts` reconstructs it
(`State`, `Initial ⊂ State`, `Final ⊂ State`, `Transition`, `Event`, `State.transitions` composition,
`Transition.nextState`, `Transition.event`, `Transition.guard: Expression`), plus `Timed ⊂ Transition` with
`when: Expression` and an unrelated `Other`. The full bag is `bindProfile(stateMachine)`'s:
`{"simNode":"State","simInitial":"Initial","simTerminal":"Final","simTransition":"Transition","simOwnedTransitions":"State.transitions","simNextState":"Transition.nextState","simTrigger":"Transition.event","simGuard":"Transition.guard","simProfile":"stateMachine"}`.

| Case | Bag | Panel (verbatim) | Dialog pill | M1 gate missing | |
|---|---|---|---|---|---|
| C0 control | the full bag | `State machine · Checkable` | `Checkable`, not pending | `[]` | agree |
| C1 control | `{ simProfile: 'stateMachine' }` | `State machine · Checkable after Apply` | `Checkable`, pending | three items | agree |
| **W** | full, `simGuard: 'Timed.when'` (declared on a subclass of Transition) | `State machine · Checkable` | `Checkable with warnings` (`guard: warn`) | `[]` | **disagree** |
| **I** | full, `simInitial: 'Other'` (not a kind of State) | `State machine · Checkable` | `Not checkable` (`initial: incompatible`) | `[]` | **disagree** |
| **D** | full, `simInitial: 'C_gone'` (the id of a deleted class) | `State machine · Checkable` | `Not checkable` (`initial: incompatible`, «Not in this metamodel») | `[]` | **disagree** |
| **U** | named user copy of State machine (Terminal off), `simNextState` unset | `Mine · Not checkable`, `Missing: Next state.` | `Checkable`, pending (the binder proposes Next state) | `["Next state"]` | **disagree** |
| U0 | the same user copy, full bag | `Mine · Checkable` | `Checkable`, **pending** | `[]` | agree on the word; see §4.1 |
| **K** | «Custom» (no `simProfile`), `simGuard: 'Timed.when'` | `Custom · Checkable` | `Checkable with warnings` | `[]` | **disagree** |
| K0 | «Custom», the full bag without `simProfile` | `Custom · Checkable` | `Checkable` | `[]` | agree |

Discrimination (P12): the comparator returns AGREE on C0, C1, U0 and K0 and DISAGREE on W, I, D, U and K. Its
verdict moves with the input.

Reachability [R]. W and I come from a select choice in the dialog: warn options are listed and marked
`(warning)`, and an incompatible current value stays listed (`simRolesDraft.ts:398-403`). A change of Node
re-judges Initial against the new Node, and Apply is not gated on the verdict (`SimRolesModal.tsx:865`). D comes
from deleting the bound class of a stored bag: `checkability` counts any non-empty string as bound
(`simProfiles.ts:290-291`). U comes from clearing a required row of a stored user profile and applying:
`draftPatch` writes `undefined` for a cleared key (`simRolesDraft.ts:203`), and on reopening the binder proposes it
again. Measured through the pure functions only, not in a browser.

The fix prototyped in the probe (`panelFixed`: the dialog's bindings rule and the verdicts on the panel's own
`after`) gives AGREE on all nine cases, pill and pending alike [M].

### 4.1 Found on the way: a user profile never stops being pending [M]

`reencode.test.ts`: for three user copies (named with Terminal off, unnamed with Terminal off, named without a
mode change), `encodeProfile(decodeProfile(raw)) === raw` is **false**. The second pass is stable. First
difference:

```
raw   «"initialMarking":{"mode":"derived","from":"initial","note":"1 on Initial"}»
again «"initialMarking":{"mode":"derived","note":"1 on Initial","from":"initial"}»
```

Cause [R]: `profileCodec.ts:47-52` builds `{ mode: 'derived', note, ...value, ...from }`. The system literals are
`{ mode, value, note }` and `{ mode, from, note }` (`simProfiles.ts:98-99`, `:103`), the order of the type
(`simProfiles.ts:25`, `{ mode: 'derived'; value?; from?; note }`).

Effect [R]: the first Apply of a user profile stores the system-ordered JSON. On reopening, the stored profile is
the decoded one, `draftPatch` re-encodes it, and `same` finds a different string (`simRolesDraft.ts:205-206`).
Apply stays enabled and the pill's title reads «After Apply.» until a second Apply. The 1740 tests check the round
trip with `toEqual` (`simRolesDraft.test.ts:284`), which cannot see key order. Today the panel does not bind user
profiles, so its `pending` is false (`simRoleStatus.ts:390`, `bindings !== null && …`). A panel that binds them
(Option B) would show `after Apply` in the same state: case U0 of `panelFixed` gives pending true on both sides
[M].

With `readMode` emitting `{ mode, value?, from?, note }`, re-encoding is identical on all three copies [M,
simulated in the probe].

### 4.2 Observation, not in scope

The M1 gate is presence-only (`missingEngineRoles`, `simRoleStatus.ts:143-153`; D5 of the profiles report: «The
M1 gate is unchanged»). Under the fix, cases I and D read «Not checkable» on the M2 face while the M1 face offers
the run. The dialog already reads that way today.

## 5. Consumers, and S6-S8

### 5.1 Every consumer [M]

Searches with `command grep -rn` over `frontend/src` and `frontend/scripts` (probes excluded). Each search returned
hits, so the tool has signal. `checkability(` was rerun with `-F` after a `-E` run whose pipeline status hid the
regex error.

| Symbol | Consumers |
|---|---|
| `profileSummary` | `SimulationPanel.tsx:286`; `simRolesDraft.ts:185` (reads `.proposals` only); `simRoleStatus.test.ts` (27 calls, `:265-535`) |
| `profileSummaryText` / `.badge` | `SimulationPanel.tsx:480`, `:486`; `simRoleStatus.test.ts` (`:270-534`, `.badge` at `:272`) |
| `ProfileSummary.status` | `SimulationPanel.tsx:485`; `simRoleStatus.ts:414` |
| `checkability(` | `simRoleStatus.ts:364`; `simRolesDraft.ts:248`; tests `profileBinder.test.ts` (10), `simProfiles.test.ts` (21), `bindingCompat.test.ts:347`, `profileCodec.test.ts:153` |
| `draftStatus` | `SimRolesModal.tsx:402`; `simRolesDraft.test.ts:191-192` (no second argument) |
| `bindingVerdicts` / `currentVerdicts` | `SimRolesModal.tsx:401-402`; `bindingCompat.test.ts` |
| `sim-panel__badge` | `SimulationPanel.tsx:485`; `simulation-panel.scss:652` |
| `sim-roles-modal__pill` | `SimRolesModal.tsx:605`; `SimRolesModal.scss:97` |
| DOM readers (probes) | `~/jjodel-release/frontend/scripts/smoke/_tmp_m0059_common.ts:93` (`.sim-panel__summary-status` text); `_tmp_m0059_walk.ts:105` (`.sim-roles-modal__pill` text and title) |

### 5.2 S6, S7, S8: current state [R]

Source: the backlog report, read with `git show simulation-engine:docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md`
(§4.2 `:270-307`, table `:584-586`, wave 2b `:664`, bundle `:730`). The report is not on this branch.

- **S6, «Kept: Node»: the other proposals come from the binder's own Node.** Still open.
  `profileBinder.ts:376` `export function bindProfile(profile: SimProfile, sketch: MetamodelSketch): ProfileBindings {`
  sees no bag, and `simRoleStatus.ts:378-380` only records the difference (`kept.push(...)`). The dialog binds the
  same way (`SimRolesModal.tsx:370`).
- **S7, a stale `simEvent` changes the event class silently.** Still open. `command grep -rn simEvent` over the
  sim files outside tests gives 11 hits (`simBridge.ts:436`, `simRoleStatus.ts:49,51,93,97,99`,
  `SimulationPanel.tsx:305,773,810,826,853`), and none compares the stored value with the derived one.
  `SimulationPanel.tsx:810`: `// The derived bag (R-SIM-38): simEvent is the Trigger's type, a stale value in the bag ignored.`
- **S8, the declarations hint shows when `simStateAttributes` is set but unreadable.** Still open, now at
  `simRoleStatus.ts:391-392` (the backlog cites `:349-350`, the lines drifted): `.rows.length === 0` without
  `readable`, while `stateAttributeRows` returns `{ rows: [], readable: false }` for an unreadable value
  (`stateAttributesCodec.ts:158-161`). **Twin in the dialog**, `SimRolesModal.tsx:408`:
  `const declareHint = [...].some(...) && rows.length === 0;`, with `rows` from `storedRows.rows` (`:387-388`).

None of the three moves the verdict of the badge or the pill. They share `simRoleStatus.ts` and `SimulationPanel.tsx`
with this lane, so RC-22 queues `sim-summary-fixes` behind it.

## 6. Proposed change

### 6.1 The single source

One rule, one set of words, one bindings rule, all in `simRoleStatus.ts`. The names are free: `command grep -rn
'profileVerdict\|VERDICT_LABEL\|profileBindings' frontend/src` exits 1, and the control on `profileSummary`
exits 0.

- `profileVerdict(profile, after, sketch)`: `checkability(profile, after, sketch ?
  currentVerdicts(bindingVerdicts(profile, after, sketch)) : undefined)`. This is the verdict of the bag as Apply
  leaves it, and the only place the rule is written.
- `VERDICT_LABEL: Record<CheckabilityStatus, string>`: `Checkable`, `Checkable with warnings`, `Not checkable`.
- `profileBindings(profile, sketch)`: `profile.id !== 'custom' && sketch ? bindProfile(profile, sketch) : null`.
  This is the dialog's rule (user profiles bound, «Custom» not).

The panel reaches the rule through `profileSummary(…, sketch?)`, which computes `status` with `profileVerdict` on
its own `after`. The dialog reaches it through `draftStatus(input, sketch?)`, which calls `profileVerdict` on
`draftBag(input)`. On a pristine dialog both pass the same profile, the same bindings and an `after` that differs
only in `simProfile` (§3.4). The verdict is then the same function on equal inputs.

### 6.2 Option B (recommended): the verdict, the bindings rule, the codec order

Eight paths, above the Rule 19 five, listed here as Rule 19 asks:

| File | Change |
|---|---|
| `frontend/src/components/editor-v2/sim/simRoleStatus.ts` | `profileVerdict`, `VERDICT_LABEL`, `profileBindings` (new exports); `profileSummary` gains an optional `sketch` (a new optional last parameter) and takes `status` from `profileVerdict`; `ProfileSummary.status` and `ProfileSummaryText.badge` take the third value (Q2); the `:231` comment rewritten |
| `frontend/src/components/editor-v2/sim/simRolesDraft.ts` | `draftStatus(input, sketch?)` calls `profileVerdict`; its second parameter becomes the sketch. The only caller that passes one is `SimRolesModal.tsx:402` |
| `frontend/src/components/editor-v2/sim/SimulationPanel.tsx` | bindings through `profileBindings(selected, sketch)`; `profileSummary(…, largestMarking, sketch)` with `sketch` in the memo deps; badge modifier three-way (`checkable`, `warnings`, `not-checkable`) |
| `frontend/src/components/editor-v2/sim/SimRolesModal.tsx` | bindings through `profileBindings(profile, sketch)`; `draftStatus(input, sketch)`; `statusText` from `VERDICT_LABEL`. `verdicts` stays for the selects (`:489`); `CUSTOM_ID` stays for `:637-638` |
| `frontend/src/components/editor-v2/sim/simulation-panel.scss` | `&__badge &--warnings` with the pill's tokens (Q3); the `:651` comment rewritten |
| `frontend/src/model/simulation/profileCodec.ts` | `readMode` emits `{ mode, value?, from?, note }` (§4.1), so the panel does not inherit the dialog's stuck pending |
| `frontend/src/components/editor-v2/sim/__tests__/simRoleStatus.test.ts` | the disagreement tests (§7) |
| `frontend/src/model/simulation/__tests__/profileCodec.test.ts` | `encodeProfile(decodeProfile(s)) === s` for system-based copies, the three modes of §4.1 |

What changes for the user, off the demo path:

- the panel reads «Checkable with warnings» (W, K) and «Not checkable» (I, D) where the dialog already does;
- on a stored user profile the panel now shows the binder's proposals and enables Apply, as the dialog does (U);
- after the first Apply of a user profile, neither side is left pending (§4.1).

### 6.3 Option A: the verdict only

`simRoleStatus.ts`, `SimulationPanel.tsx`, `simulation-panel.scss`, `simRoleStatus.test.ts`. Plus
`simRolesDraft.ts` and `SimRolesModal.tsx` if the rule is to have one home and not two copies. This fixes W, I, D
and K. **U stays**: the badge and the pill still disagree on a stored user profile, so the prompt's «can never
disagree» does not hold.

## 7. Phase 2 test plan (for the approved option)

- Red first in `simRoleStatus.test.ts`, executing the two public paths the components call (P11): the panel's
  `profileSummaryText(profileSummary(…, sketch)).badge` against the dialog's `VERDICT_LABEL[draftStatus(input,
  sketch).status]`, on the same bag, for W, I, D, U, K and the controls C0, C1, K0.
  - Red before: the extra argument is ignored and the labels differ.
  - `profileBindings` is absent, so the file is red at collection until it exists.
- Pending: U0 not pending on either side.
- Mutation bench:
  - `profileSummary` ignoring `sketch` (W, I, D, K die);
  - `profileBindings` back to `profile.system` (U dies);
  - `readMode` back to `note` first (the codec test and U0 die);
  - `profileVerdict` dropping `incompatible` (I, D die).
- Declared gap: the badge's class mapping in `SimulationPanel.tsx:485` does not load under the node bench (joiner).
  The browser leg covers it.
- Browser leg on 3034:
  - the four demo scenes with `_tmp_m0059_*` copied as `_tmp_badge_*`; panel summary status, proposals and hints,
    and the pill text and title, identical to the trunk readings;
  - one extra fixture on DemoESM: a class `Timed ⊂ Transition` with `when: Expression`, and the bag's `simGuard`
    set to it. The panel should read `Extended state machine · Checkable with warnings` and the pill `Checkable
    with warnings`;
  - `simInitial` set to the `Event` class: both should read `Not checkable`;
  - crops light and dark for the badge colour (Q3).

## 8. Risks

1. **Critical zone.** Untouched: no path of §6 is in `CLAUDE.md` §3.1. `useJjomSync.ts` and `portDistribution.ts`
   are not read or written. No Layer Impact Report is required.
2. **Demo.** The demo's panel shows `Custom · Not checkable` (`models_2026_simulator_demo.md:41`, `:107`) and
   `<preset> · Checkable` (`:78`, `:140`, `:190`, `:282`). `not-checkable` keeps its class and colour, and
   `Checkable` keeps its text. The 1740 lane measured every bound demo role `ok` (`simulation.md:338`), so no demo
   scene should gain a third state. Phase 2 confirms it on 3034 against the trunk.
3. **Width.** «Extended state machine · Checkable with warnings after Apply» is longer than today's line.
   `__summary-status` is `flex-wrap: wrap` (`simulation-panel.scss:631-640`), so it wraps to a second line in the
   warn state only, which is off the demo path.
4. **Colour collision.** The panel's `not-checkable` already uses the amber tokens that the pill uses for
   `warnings`. The panel's warnings and not-checkable would share a colour and differ in words only (Q3).
5. **Existing user profiles.** A user profile stored after two Applies under today's codec has the reordered form.
   Under the fixed codec it reads pending once more, then stays stable. Only a user profile is affected, and the
   demo has none.
6. **Cost.** `bindingVerdicts` runs once more per summary memo on the panel. That is the dialog's per-render cost
   today, linear in roles times sketch elements.
7. **Exported shapes.** Two unions widen and two functions change a parameter (Q2). Every consumer is listed in
   §5.1 and is in this lane. None is outside it (RC-26).

## 9. Questions for the chat

1. Scope: Option B (§6.2, eight paths) or Option A (§6.3)?
   Recommended: B, the only one under which the badge and the pill cannot disagree, U included.
2. Rule 11: `ProfileSummary.status` widens to `CheckabilityStatus`, and `ProfileSummaryText.badge` to the three
   labels. Every consumer is in this lane. The additive alternative keeps a two-valued `status`, which is the lossy
   value behind the bug.
   Recommended: widen, with the Rule 11 go-ahead written in the GO text.
3. Colour of the panel's new `sim-panel__badge--warnings`.
   Recommended: the pill's `--warnings` tokens (`--color-warning-muted`, `--color-warning-text`), `not-checkable`
   unchanged because it is on the demo path; the shared amber goes in a low ticket for after MODELS; the colour is
   a perceptual item for Alfonso's visual GO.
4. Fold S6, S7 and S8 into this lane?
   Recommended: no; they stay `sim-summary-fixes`, queued after this lane on the shared files (RC-22), with S8's
   dialog twin (`SimRolesModal.tsx:408`) added to its list.
5. R-SIM-79 says «mai «with warnings» finché non esiste il controllo di compatibilità» (`decisions.md:2155-2156`).
   Does it need an amendment?
   Recommended: no row change: the condition ended with S11a (`3d44abce0`), and the log entry cites it.
6. The M1 gate stays presence-only (§4.2).
   Recommended: leave it as D5 has it, and open a low ticket in the closure entry.

## 10. Decisions taken (unattended)

- The probe mirrors the components' expressions instead of loading them. They import the joiner and do not load
  under the node bench (the `simRolesDraft.ts` header says the same). The browser leg of Phase 2 closes the gap
  (P11).
- The dialog's bindings rule, not the panel's, is taken as the correct one. It is the later decision (S11c,
  `SimRolesModal.tsx:367`: «a user profile is, as its preset»), and reversing it would remove the proposals from
  user copies.

## 11. Decisions awaiting Alfonso

None from the RC-26 list: no critical-zone file, no ratified row amended (Q5), no file deleted, and no change to
what the demo shows by construction (Phase 2 measures it). The badge colour (Q3) is a perceptual item of the visual
GO, not a pre-approval.
