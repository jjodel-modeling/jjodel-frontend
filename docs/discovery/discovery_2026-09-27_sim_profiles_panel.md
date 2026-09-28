# Discovery — the simulation profiles reach the panel (R-SIM-47..56, the R-SIM-55 modal)

- Prompt-ID: `P-2026-09-27-0150` (chat `C-2026-09-26-1702`)
- Prompt file: `docs/prompts/claude_2026-09-27_0150_prompt_sim_profiles_panel_discovery.md`
- Session: `9f77c390-e83d-4344-9f80-0e65bbe1ff4e`
- Tree: `~/jjodel-gate`, branch `sim-profiles`, HEAD `6cb857874` (parent `8b5871f29`, the closure of lane C1).
  The tree was clean at the start.
- Executor: Opus 5.5 (session banner)
- Phase 1, read-only. No source file was edited. A dev server of this tree ran on **3005** for the measurements
  (3000, 3001, 3003 and 3004 were held by other trees; 3002 was not touched). It was stopped at the end.

This report is a set of hypotheses with evidence, not a definitive reference. Anyone who uses it downstream should
re-read the real files. Tags: **[R]** read in a file or doc of HEAD `6cb857874`; **[M]** measured in this phase on
the same HEAD, by the probes named in §9.

---

## 0. Answer in brief

- **The shortest path goes through a binder, not through the modal.** The pure modules give modes, the
  required set, the verdict and the codec. They do not turn a profile into concrete `sim*` values:
  `SYSTEM_PROFILES` holds modes only (`simProfiles.ts:114-135`). What the demo needs ("simulable in a few clicks
  from a preset") is a pure `profileBinder.ts` that matches the preset's roles to the metamodel by structure and
  name, plus a single `state` write. A throwaway prototype of that binder **[M]** was run on 16 sketch/profile
  pairs. 12 of them came out checkable with every required item bound and no candidate to choose, among them the
  turnstile, PEST SM (reconstructed), Extended SM with actions, flowchart, Moore sketch and both Petri nets. The
  four misses are the expected ones:
  - turnstile × DFA and Moore sketch × Mealy: the metamodel has no accepting class and no transition output;
  - the textbook FSM with `isInitial: EBoolean`, under State machine and under DFA: Initial is a class role (§6.5).
- **Recommended for the demo build: M3.** It puts a preset select, Apply and a one-line summary in the inline
  panel. It also adds «Configure…», which folds the groups away and brings them back. It is one full lane of eight
  files, with no `VersionFixer` step and no exported-interface change.
  - It also fixes a defect measured today. On the metamodel face with all five groups open, the panel is 1006 px
    tall in a 1000 px viewport. Its top sits at −55 px against the editor's 51 px, so the header and its collapse
    button are hidden (§6.4).
  - The full modal (M1) is two to three lanes. It needs the compatibility check (`BindingVerdict` has no
    producer) and user profiles. It belongs after MODELS.
- **Four findings change what the demo can promise. All four are RC-26 items (§8):**
  - The Petri row of R-SIM-54 turns off Guard, Action, Entry and State attributes. So the b2net and C1 nets fit no
    system profile as is (§6.1).
  - No engine code reads Accepting, State output or Transition output. DFA, NFA, Moore and Mealy would show
    «checkable» and run exactly like a state machine (§2(e)).
  - Initial, Terminal and Accepting are class roles. A metamodel with boolean flags cannot be made runnable
    (§3.3).
  - The prompt expected «with warnings» for Flowchart without declarations. Nothing produces «with warnings» today:
    the status comes only from binding verdicts, and nobody computes them (§6.2).

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | Production code still imports none of the three profile modules | **holds** | grep with control, §2(a) [R]; on 3005 the M2 face shows no profile, and `simProfile` written in the bag changes nothing on either face (§6.4) [M] |
| H2 | Applying a system profile produces the concrete `sim*` key set | **falsified** | a profile holds modes only (`simProfiles.ts:23-26`, `:114-135`); no function maps a role to a metaclass or feature [R] |
| H3 | One write of many keys is one action and one undo step | **holds** | `set_state` wraps both `SetFieldAction`s in one `TRANSACTION` (`joiner/classes.ts:2375-2378`) [R]; one assignment of seven keys → `undoable` 0→1, and one undo removes all seven; seven assignments → 0→7, and one undo removes one (§6.3) [M] |
| H4 | «Custom» rebuilt from a C1 bag is complete and reads every key the engine reads | **partly** | complete for the C1 Petri bag (checkable, `ignoredKeys: []`); a control-flow bag with `simAction` and no `simStateAttributes` puts `simAction` in `ignoredKeys` while the engine still runs it (§6.2) [M] |
| H5 | A preset can be bound to a real metamodel automatically | **partly** | prototype: all required roles on the class-typed fixtures; none of Initial/Terminal/Accepting on boolean flags (§3, §6.5) [M] |
| H6 | Flowchart applied to a bag without declarations shows «with warnings» | **falsified** | `checkability` → `checkable`; `warnings` only with a `warn` verdict, which nothing produces (§6.2) [M] |
| H7 | The `validateProfile` ticket blocks a preset-only UI | **falsified** | the defect needs a user profile; the check "derived `from` an off role" finds 0 roles on each of the 8 system profiles and 1 on the ticket's profile (§6.2) [M] |
| H8 | The engine and the profile verdict agree on what can run | **falsified** | a control-flow bag without Node and Transition runs (the M1 face shows Reset/Step/Stop on 3005) while every control-flow profile says `notCheckable` (§6.1, §6.4) [M] |

---

## 2. What exists [R]

### (a) The API surface, and who calls it

`roleCatalog.ts`:
- `ROLE_IDS` (28 roles), `ROLE_CATALOG`, `roleDescriptor(id)`, `roleOfKey(key)`, `dependentsOf(id)`.
- Each descriptor carries `group`, `key`, `kind` (`class | reference | attribute | intAttribute | expressionAttribute
  | actionListAttribute | int | derived | declarations`), `dependsOn`, `label` and `description`
  (`roleCatalog.ts:34-55`).

`simProfiles.ts`:
- `SYSTEM_PROFILES`, `systemProfile(id)` and `requiredRoles(profile)` (closure plus `addedRequired`, `:187-191`).
- `validateProfile(profile)` (`:218-248`) and `checkability(profile, bag, verdicts?)` (`:295-306`).
- The types `SimProfile`, `RoleMode` (`edit | derived{value?, from?, note} | off{reason}`), `ProfileParams`
  (`bound`, `selector: 'list'`), `ProfileConstraint`, `RequiredItem` and `BindingVerdict`.

`profileCodec.ts`: `encodeProfile`, `decodeProfile` (all or nothing, never throws) and `inferCustomProfile(bag)` →
`{ profile, ignoredKeys }` (`:143-196`).

Search for importers, run with `command grep -rn "from '.*\(simProfiles\|profileCodec\|roleCatalog\)'"` over
`frontend/src`, exit 0:
- It found only the modules themselves and their three tests.
- Positive control, the same command for `stateAttributesCodec`: it found `SimulationPanel.tsx:46`,
  `simRoleStatus.ts:10` and `simBridge.ts:43`.

The lane C report (`06d911dd9`, §2(e)) had already seen this, and it still holds.

### (b) What a UI needs that the modules do not give

1. **Concrete values.** `systemProfileOf` sets a mode for every role (`simProfiles.ts:117-124`). Nothing says which
   metaclass is Node on a given metamodel. The design input's «N of M roles matched by name · Undo» and «Match by
   name» (`docs/design/claude_2026-09-25_simulation_roles_modal_design.md`, Step 2) name the missing piece.
2. **Binding verdicts.** `checkability` accepts `verdicts` (`:295-299`) and derives `warnings` from them
   (`:302-304`), but `BindingVerdict` is described as "a later lane" (`:254`). No code produces one.
3. **A resolved bag for the engine.** The `isBound` comment says "An `off` role is not, even with its key set (the
   bridge does not read it, R-SIM-55)" (`simProfiles.ts:268-269`). The bridge reads every key regardless:
   - `startRun` → `netStcFromRoles(bag ? withDerivedEventRole(bag, lookup) : undefined)` (`simBridge.ts:305`).
   - `mapStateToProps` copies every `ROLE_KEYS` entry (`SimulationPanel.tsx:940`).
   - No function drops off keys or substitutes derived values.

### (c) How the panel writes the bag, and the undo granularity

- A role select writes one key: `lmm.state = { [key]: value === '' ? undefined : value };`
  (`SimulationPanel.tsx:470`).
- The declarations write their one string (`:478`).
- `set_state` merges into `_state`. It collects the changed keys and dispatches them in one
  `TRANSACTION(this.get_name(c)+'.state', …)` holding a `+=` and a `-=` `SetFieldAction` (`joiner/classes.ts:2375-2378`).
- A preset Apply written as one assignment is therefore one transaction. It is measured as one undo step, and one
  undo reverts all its keys (§6.3).

Deltas closer than `U.UpdatingTimer*1.5` (450 ms) merge (`redux/reducer/reducer.ts:1276-1279`). Nothing is recorded
before `U.userHasInteracted` and `statehistory.globalcanundostate` (`reducer.ts:1278-1280`).

Rule 12 is not concerned: the transaction holds only `SetFieldAction`, the safe case.

### (d) «Custom» from a C1 bag

`inferCustomProfile` builds the profile as follows:
- It puts the closure roles, and every other role whose key is set, in `edit`.
- In control flow, Bound and Initial marking are derived unless set (R-SIM-56).
- It turns off, with `ignoredKeys`, the other shape's group, Initial in Petri, and "a role left without a
  dependency" (`profileCodec.ts:171-182`).

Since R-SIM-68, `action`, `entry` and `exit` depend on `stateAttributes`
(`roleCatalog.ts:148`: `dependsOn: ['transition', 'stateAttributes']`). So a bag with an action key and no
declarations loses the action in Custom (§6.2).

### (e) What the engine reads

`netStcFromRoles` builds `NetStc` from 22 keys (`netCompile.ts:46-55`). Its runnability test is weaker than the
profile closure in control flow. It asks for neither Node nor Transition:
`!!(stc.nextState && (stc.ownedTransitions || stc.source) && (stc.initial || stc.initialMarking))`
(`netCompile.ts:85`).

`simAccepting`, `simActivityFinal`, `simStateOutput` and `simTransitionOutput` have no reader:
- The search `command grep -rn "simAccepting\|simActivityFinal\|simStateOutput\|simTransitionOutput\|simProfile"`
  over `frontend/src`, tests excluded, found only `roleCatalog.ts` (`:9`, `:76`, `:80`, `:164`, `:168`) and the
  codec comments.
- The same command found `simProfile` in `profileCodec.ts` and `stateAttributesCodec.ts`, so it reached the
  directory.
- `roleCatalog.ts:10` says so itself: "nothing reads or writes them yet".

### (f) The modal pattern of the codebase (for M1 and the later modal lane)

The codebase has no shared modal shell. Each modal repeats the pattern by hand:
- a backdrop with `onClick` close;
- `role="dialog" aria-modal="true"`;
- an Escape listener on `window`;
- `__header/__body/__footer`.

The closest precedent is `SymbolEditorModal`:
- It is opened from a panel through `JjodelEvents.SYMBOL_EDITOR_OPEN` (`events/registry.ts:92`).
- Its listener is local (`SymbolEditorModal.tsx:205-212`) and it is mounted once in `App.tsx:185`.
- It is portaled with `createPortal(` (`SymbolEditorModal.tsx:421`).
- Its z-index is `var(--z-alert, 10000)`, because "`--z-modal` is not enough and never was: it resolves to 1050"
  (`SymbolEditorModal.scss:10-16`, `styles/tokens.css:204` against `styles/tokens/_z-index.scss:31`).

`ValidationRulesModal` follows the same pattern (`VALIDATION_RULES_OPEN`, `registry.ts:55`, `App.tsx:187`). No
simulation event exists in the registry.

A new modal would need:
- `JjodelEvents.SIM_ROLES_OPEN`;
- a mount in `App.tsx`;
- the portal at `--z-alert`.

Sizes of the precedents: `SymbolEditorModal.tsx` is 585 lines and `ValidationRulesModal.tsx` 442.

---

## 3. Binding a preset to a real metamodel

### 3.1 The binder, `model/simulation/profileBinder.ts` (proposed)

**Input: a `MetamodelSketch`.** Plain data, no joiner:
- classes with `abstract` and `supers`;
- attributes with owner, type pointer and upper bound;
- references with owner, type, `composition` and upper bound.

A collector `sketchOfMetamodel(lookup, modelId)` fills it from the raw lookup. It uses the traversal of
`collectMetaOptions` (`SimulationPanel.tsx:83-155`), which it leaves in place (Rule 9). It is pure, so it runs under
the node bench.

**Output.** One `RoleBinding` per `edit` role of the profile:
- `{ status: 'bound', value, why }`;
- `{ status: 'candidates', values }`;
- `{ status: 'none', why? }`.

**Also.** A function `applyPatch(profile, bag, bindings)` returns the keys to write: the bound values of unset keys,
plus `simProfile`.

Resolution order, with the rules the prototype measured (§6.5):

| Role | Rule | Automatic when |
|---|---|---|
| Node, Transition, Next state (control flow) | a plain reference T → N between unrelated classes, scored by the reference's name (`next/target/to/dest`), T's name (`trans/edge/flow/step`), N's name (`state/node/place/vertex/activity`), and a composition N → T | one best-scored reference |
| Owned transitions | a composition from N's lineage to T | exactly one |
| Source | a plain reference T → N other than Next state, named `source/src/from` | one match |
| Initial / Terminal / Accepting / Fork / Join / Activity final | a concrete subclass of N named `init/start/begin`, `final/end/terminal/stop`, `accept/final`, `fork`, `join`, `activityfinal` | one match; a boolean attribute with such a name is reported as `none` with its reason |
| Trigger | a plain reference from T's lineage to a class outside N's and T's lineages, preferring `trigger/event/input/symbol/on` | one match; restricted to T's references, unlike today's select (ticket 2026-09-25, medium) |
| Event identifier | not bound: the default `name` | — |
| Guard | an attribute of T's lineage typed `Expression`, else an EString named `guard/cond` | exactly one |
| Action / Entry / Exit | `Action` attributes of T (named `action/effect/do`) and N (`entry/enter`, `exit/leave`) | one match |
| State output / Transition output | an attribute of N / T named `out…` | one match |
| Arc, Arc source, Arc target (Petri) | a class with two plain references to a common supertype, named `arc/edge/flow`; its references `src/source/from`, `tgt/target/to` | one match |
| Node, Transition (Petri) | the concrete subclasses of that supertype: the one with an `EInt` named `token/marking`, or named `place`; the other, named `trans` | one each |
| Initial marking, Arc weight, Inhibitor arc | `EInt` of the place named `token/marking/initial`; `EInt` of the arc named `weight`; a subclass of the arc named `inhib` | one match |
| Bound | a parameter: not bound (k = 1 by the engine's default, or the profile's derived value) | — |
| State attributes | a table, not a binding | — |

**Cost.**
- The binder is about 250 to 300 lines, plus about 300 lines of tests over seven fixtures (the six of §6.5 plus
  b2net). The collector is about 80 lines plus its test.
- The prototype in the probe is 110 lines and covers everything except the `why` strings and the overlap check.
- Before writing, the proposed bag goes through the check `writeRole` already uses (`overlapVerdict` on the bag with
  the derived event role, `SimulationPanel.tsx:457-466`). A refusal writes nothing and shows the existing
  `roleError` line.

### 3.2 What needs a choice

- **Ties in the Node/Transition/Next state score.** The prototype returned `candidates`. None of the eight
  fixtures tied.
- **Several classes that could be Initial or Terminal.** The binder returns `candidates` and leaves them to the
  group's select.
- **Guard when there are two `Expression` attributes.**
- **Trigger when T has two references to event-like classes.**

The binder never picks among candidates. The summary line reports them.

### 3.3 What cannot be bound

**Boolean flags.** Initial, Terminal, Accepting, Fork, Join and Activity final are class roles (`kind: 'class'`, `roleCatalog.ts:63-110`).
The engine marks an Initial place by class membership: `} else if (kind(p, stc.initial)) {` (`netCompile.ts:430`).

Binding Initial marking to a boolean instead fails: the marking reader refuses anything that is not an integer.
`if (typeof raw !== 'number' || …` becomes an `initial-over-bound` defect (`netCompile.ts:425-427`).

So a metamodel `State { isInitial: EBoolean; isFinal: EBoolean }` has no runnable binding. The prototype matched 4
of 5 required items for State machine, with Initial missing (§6.5).

---

## 4. Options

All three options share the pure layer:
- `profileBinder.ts` and its test;
- `metamodelSketch.ts` and its test;
- a pure `profileSummary(profile, bag)` in `simRoleStatus.ts`, for the text of the summary line, testable under
  node.

`SimulationPanel.tsx` does not load under the bench (window, joiner). So its wiring is covered by the visual check
only, as in every earlier sim lane.

**`VersionFixer`: zero in all three.**
- `simProfile` is an additive key (R-SIM-55).
- An absent key decodes to Custom.
- A malformed key decodes to `null`, which the panel treats as Custom with a warning line.
- Measured on 3005: a `simProfile` string lands in the raw bag with the six role keys of the same write (§6.3).

**Exported interfaces: new ones only.** `OwnProps` does not change. `StateProps` is internal and gains
`profileRaw: string | null`, a primitive, so the shallow compare of connect still holds.

### M1 — the full modal of R-SIM-55

**New files.**
- `sim/SimRolesModal.tsx`, about 700-900 lines. It holds the preset list, Required, Optional, and the derived/off
  row with its reasons. It has binding dropdowns with a filter and the count of incompatible candidates hidden. It
  also has Save as…, the modified state, Apply, Cancel, and an inert SMV placeholder.
- `sim/SimRolesModal.scss`.
- A producer of `BindingVerdict`, the type/owner/multiplicity check: a pure module of its own plus its test.
- Mode editing for user profiles.

**Modified files.**
- `registry.ts`: `SIM_ROLES_OPEN`.
- `App.tsx`: the mount.
- `SimulationPanel.tsx`: the summary and «Configure…», with the groups removed.
- `simulation-panel.scss`.

**Also owed.** The `validateProfile` ticket becomes reachable (user profiles) and must be fixed in the same lane.

**Size.** About 12-15 files, above Rule 19. Two to three lanes:
- modal and system presets;
- compatibility check;
- user profiles and Save as….

It carries the most visual surface to verify. It cannot be done before a 2026-10-01 freeze with a visual GO on
each lane.

### M2 — a preset select at the top of the inline panel

**The row.** «Profile: State machine ▾ · Apply» above the groups on the M2 face. The select lists the system
profiles; «Custom» shows only as the current state.

**Apply.** It runs the binder on the sketch and writes one `state` patch: the unset keys of `edit` roles that bind,
plus `simProfile`. It never overwrites a set key and never deletes one.

**The line under the row.** «n of m required matched» and the missing items. The groups stay as they are.

**Files.**
- `profileBinder.ts`, `metamodelSketch.ts` and their two tests;
- `simRoleStatus.ts` and its test;
- `SimulationPanel.tsx`;
- `simulation-panel.scss`.

That is 8 files, above Rule 19 and listed before the first edit.

**Size.** One full lane: pure layer first, then the panel. About 700-900 lines in total, tests included.

**Height.** One more row, about 32 px, on a panel that already overflows with all groups open (§6.4).

### M3 — M2 plus the summary line and «Configure…»

**Summary.** The M2 face opens on:
- the profile row;
- the summary: profile name, the badge `Checkable` or `Not checkable` with the missing items, and the keys set but
  off in this profile, as an information line;
- a «Configure…» button.

**Groups.** They are folded under «Configure…».
- They are unfolded by default only when the verdict is `notCheckable`, so the user lands where the work is.
- «Configure…» is the seam the modal lane later points at the modal. Its handler changes, not the row.

**Files.** The same eight as M2.

**Size.** About 40-60 lines of panel code more than M2.

**What it solves.** The measured overflow in the default state. A checkable metamodel shows 3 rows instead of 13
(§6.4).

**The deviation.** It departs from R-SIM-55 until the modal lane: «Configure…» expands inline groups instead of
opening the modal. That changes what the demo shows, so it is an item of §8.

### Visual checklist for M3 (proposed)

1. **A metamodel with an empty bag.** Profile row, «Custom · Not checkable», the missing items, groups unfolded.
2. **Apply State machine on the turnstile metamodel.**
   - The bag holds exactly the six bound keys plus `simProfile`.
   - Ctrl+Z once removes all seven.
   - The summary reads «Checkable» and the groups fold away.
3. **Apply State machine on a metamodel with Node already set to another class.** Node is kept, the rest is
   filled, and the summary names what was kept.
4. **Apply on a metamodel with two candidate Initial subclasses.** Initial stays unset, the summary says «Initial:
   2 candidates», and the Initial select lists them.
5. **Apply Petri net on b2net.**
   - Checkable, with the information line «Set but off in Petri net: Guard» (or no line, if §8 A3 is adopted).
   - The M1 run is unchanged: the guard still gates `t1`.
6. **A run live on an M1 of the metamodel, then Apply on the metamodel.** The M1 shows «Run interrupted: the model
   changed. Reset to run again.» (R-SIM-34; `runSignature` covers every `sim*` key, `simBridge.ts:366`).
7. **Height.**
   - With the groups folded, the panel top stays below the editor top at a viewport of 1600×1000.
   - «Configure…» unfolds the groups upward; the header stays visible at a viewport height of 900.
   - The M1 face is unchanged. Step's top does not move (R-SIM-65, R-SIM-66).
8. **Light and dark.** Every state above in both themes.

### Recommendation

**M3 for the demo build**, freeze proposed 2026-10-01 evening. It is one full lane after this report: the pure
layer and the panel, two code commits.

What the modal lane adds after MODELS:
- the modal shell and «Configure…» pointed at it;
- the compatibility check that produces `BindingVerdict`, and so the «with warnings» status;
- binding dropdowns that show only compatible candidates;
- user profiles, Save as… and the modified state, with the `validateProfile` ticket fixed in that lane;
- the Step 1 cards of the design input;
- the inert SMV placeholder;
- the resolver that makes the bridge skip off keys (§7 D4).

---

## 5. Risks

1. **A preset overwriting user bindings.** The patch writes only unset keys, so R-SIM-55's "changing profile does
   not delete bindings" holds by construction.
   - Deleting is not available anyway: writing `undefined` through `set_state` left the key in the raw bag, as the
     lane C report measured (`06d911dd9` §7.6).
   - So the design's «Reset clears the bindings» cannot be built on today's `set_state`.
2. **Off keys the engine still reads.** In the recommended lane the profile governs the verdict and the UI. The
   engine keeps reading every key (§7 D4). Wiring the resolver now would change a run silently:
   - it would drop b2net's guard under the Petri preset (§6.1);
   - it would drop a control-flow action whose declarations are missing (§6.2).
3. **Flowchart and `stateAttributes` (R-SIM-68).** Flowchart validates and is `checkable` on a bag without
   declarations, not «with warnings» (§6.2). Custom of such a bag drops `simAction` into `ignoredKeys`, while the
   engine runs the action and reports its targets as undeclared at Reset (C1). The information line of M3 is where
   that shows.
4. **The `validateProfile` ticket.**
   - Measured: a user profile with Initial off and Initial marking «derived from Initial» validates (`[]`) and is
     `notCheckable` on a complete SM bag.
   - It is not reachable in M2 or M3, which use system profiles only; the candidate check finds 0 cases on all
     eight (§6.2).
   - It is owed to the lane that brings user profiles. The fix is a new `ProfileDefectCode` literal: an additive
     union, Rule 11.
5. **Run interruption (R-SIM-13, R-SIM-34).** `runSignature` concatenates every `sim*` key of the bag
   (`simBridge.ts:366`), `simProfile` included. So an Apply interrupts a live run of any M1 of that metamodel, with
   the existing line. This is intended, but a demo that applies a preset while a run is open elsewhere shows the
   interruption.
6. **Panel height.**
   - Measured today on the turnstile bag: 676 px with the default groups (13 rows), and 1006 px with all five open
     (22 rows).
   - With all five open the top is at −55 px against the editor's 51 px, and the header is under the top bar
     (§6.4).
   - The panel is anchored at the bottom (`simulation-panel.scss:56`) and `__body` has no `max-height`
     (`:169-171`). Every added row grows the panel upward and moves nothing below it, but the overflow grows.
   - M3 reduces the overflow in the default state. The fully unfolded state still needs a `max-height` with scroll
     on `__body`: one SCSS rule in the same lane, or a ticket.
7. **Engine and verdict disagree.** A control-flow bag without Node and Transition runs, while every profile says
   not checkable (§6.1, §6.4).
   - The M1 gate stays the engine's (`missingEngineRoles`). The M2 summary shows the profile's verdict.
   - The binder always binds Node and Transition, so a preset never produces this state. A hand-made bag can.
8. **Presets whose roles nothing reads.**
   - DFA and NFA require Accepting; Moore requires State output; Mealy requires Transition output.
   - No engine code reads these (§2(e)). The run shows no «accepting» and no output (R-SIM-50, R-SIM-51 are not
     implemented).
   - A demo that shows DFA as «Checkable» promises what the run does not do (§8 A2).
9. **Concurrent lanes.** P-2026-09-27-0140 (derived attributes, `sim-derived`) reads `SimulationPanel.tsx` and
   `simulation-panel.scss` for the declarations table. Its Phase 2 will edit them. The two Phase 2 lanes overlap on
   those two files: RC-22 check 3, merge order fixed by the chat.
10. **The binder's heuristics are names.** A metamodel with opaque names (`A`, `B`, `r1`) falls back to structure
    and can tie. Ties become candidates and are never guessed. The PEST SM fixture is a reconstruction (§6.5): the
    real PEST SM lives in the localStorage of 3001, which this lane may not touch.

---

## 6. Measurements [M]

The pure probe ran with `npx vitest run --config scripts/smoke/_tmp_prof_probe.vitest.config.ts --silent=false
--reporter=verbose`: exit 0, 6 tests, 145 `[P]` lines. The bags are raw objects with fake pointer ids: the pure
modules only test for non-empty strings.

`withDerivedEventRole` ran on a two-entry lookup (Trigger → DReference typed `C_Event`), as every reader of the bag
does.

### 6.1 Bags × system profiles (`checkability` on the derived bag; engine = `netStcFromRoles`)

`C` checkable, `N` not checkable. `+k` is the number of set keys whose role is `off` in that profile.

| Bag | engine | petri | flowchart | stateMachine | extSM | dfa | nfa | moore | mealy |
|---|---|---|---|---|---|---|---|---|---|
| b2net (Petri + guard) | petri | **C +1 (Guard)** | N | N | N | N | N | N | N |
| C1 `cnet` (+ Action, Entry, State attributes) | petri | **C +4** | N | N | N | N | N | N | N |
| SM (PEST / turnstile shape) | control-flow | N | C +2 (Trigger, Ev. id.) | **C** | **C** | N Accepting | N Accepting | N State output | N Transition output |
| Extended SM with declarations | control-flow | N | C +3 | C +4 (Data) | **C** | N +6 | N +6 | N +6 | N +6 |
| flow (3b flowchart) | control-flow | N | **C** | C | C | N | N | N | N |
| control flow + Action, no declarations | control-flow | N | **C** | C +1 (Action) | C | N | N | N | N |
| control flow without Node, Transition | control-flow | N | N Node, Transition | N Node, Transition | N | N | N | N | N |
| control flow, k = 2, marking, no Initial | control-flow | N | N Initial\|Initial marking | N | N | N | N | N | N |

In every control-flow profile the last bag also has `simBound` and `simInitialMarking` set on roles the profile
derives.

### 6.2 «Custom», the ticket, Flowchart

**`inferCustomProfile`.**

| Bag | shape, k | `ignoredKeys` | validate | verdict | system profiles that fit as is (no set key off, checkable) |
|---|---|---|---|---|---|
| b2net | petri, 3 | `[]` | `[]` | checkable | **none** |
| C1 `cnet` | petri, 3 | `[]` | `[]` | checkable | **none** |
| SM | control flow, 1 | `[]` | `[]` | checkable | stateMachine, extendedStateMachine |
| Extended SM | control flow, 1 | `[]` | `[]` | checkable | extendedStateMachine (same active set) |
| flow 3b | control flow, 1 | `[]` | `[]` | checkable | flowchart, stateMachine, extendedStateMachine |
| control flow + Action, no declarations | control flow, 1 | **`["simAction"]`** | `[]` | checkable | flowchart, extendedStateMachine |
| without Node, Transition | control flow, 1 | `[]` | `[]` | notCheckable (Node, Transition) | none |
| k = 2, marking, no Initial | control flow, 2 | `[]` | `[]` | checkable | none |

**The ticket.**
- The profile: a copy of State machine with Initial `off`, and Initial marking `{"mode":"derived","from":"initial"}`.
- `validateProfile` → `[]`.
- On the SM bag → `{"status":"notCheckable","missing":[{"anyOf":["initial","initialMarking"]}]}`.
- The candidate check (a derived role whose `from` is off) returns `["initialMarking"]` on this profile and 0 on
  each of the 8 system profiles.
- `validateProfile` of each of the 8 system profiles: `[]`.

**Flowchart.**
- Modes: `action=edit entry=edit exit=off stateAttributes=edit`, `addedRequired=[]`, and `validateProfile` → `[]`.
- On the bag «control flow + Action, no declarations» → `checkable`.
- Only with an injected `{ action: 'warn' }` verdict does it become `warnings`.
- Extended SM on the SM bag, which has no Data keys → `checkable`.

**Codec.**
- System profiles encode as their id, 3 to 20 B.
- A user copy of each encodes as 1525 to 1728 B.
- Every copy round-trips through `decodeProfile` (field order aside).
- `decodeProfile('custom')` and `decodeProfile('')` are `null`.

### 6.3 On 3005: one write of many keys, and undo

Probe `_tmp_prof_undo.ts`, `npx tsx`, exit 0, in the RowViewSmoke seed project. Two fresh metamodels, the page
clicked first, and `U.userHasInteracted = true` set as a first canvas edit sets it (`EditorV2.tsx:1050`). Without
that flag the history stayed at 0 in a first run of the probe (`reducer.ts:1278`).

```
UNDO {"canUndo":true,"interacted":true,
      "one":  {"lenBefore":0,"lenAfter":1,"keys":7,"afterOneUndo":{"len":0,"keys":0}},
      "seven":{"lenBefore":0,"lenAfter":7,"keys":7,"afterOneUndo":{"len":6,"keys":6}}}
```

One assignment `L(mm).state = {simNode, simInitial, simTransition, simOwnedTransitions, simNextState, simTrigger,
simProfile}` is one undo step. The same seven keys written one at a time, 900 ms apart, are seven steps.

### 6.4 On 3005: what the panel shows today

Probe `_tmp_prof_visual.ts`, `npx tsx`, exit 0, viewport 1600×1000. The scenario is `_tmp_prof_scenario.js`: the
turnstile metamodel of the 3b scenario, with its bag written in one assignment that includes
`simProfile: 'stateMachine'`.

```
M2 default  groups General/Control flow/Events open, Petri net/Data closed; rows 13; hints ["Shape: control flow.
            Set Arc for a Petri net.", "TEvent"]; height 676; top 275; editorTop 51; the word "profile" absent
M2 all-open rows 22; height 1006; top -55; editorTop 51           (screenshot: header and General title hidden)
BAG         simInitial simNextState simNode simOwnedTransitions simProfile simTransition simTrigger
M1 mini     (bag without Node, Transition) hints []; 3 action buttons; status "Not started"
M1 turn     (bag with simProfile) hints []; 3 action buttons; 1 event button; status "Not started"
ERRORS 1    console: failed to get project {project: null}   (seen at load in B2 too; not investigated)
```

### 6.5 The binder prototype on sketches

The prototype lives in `_tmp_prof_probe/profiles.test.ts`, part F, and is thrown away with the probe. For each pair
the table gives the required items matched by the bound values, and the `checkability` of the bag the binder
proposes.

| Sketch | Profile | required matched | verdict | edit roles bound / candidates / none |
|---|---|---|---|---|
| turnstile (3b) | State machine | 5/5 | checkable | 6 / 0 / 4 |
| turnstile (3b) | DFA | 6/7 | notCheckable: Accepting (no accepting class) | 6 / 0 / 3 |
| PEST SM (reconstructed: State, Initial, Final, Transition, Event, `transitions`, `nextState`, `event`, `guard: Expression`) | State machine | 5/5 | checkable | 8 / 0 / 2 |
| same | Extended SM | 5/5 | checkable | 8 / 0 / 5 |
| same | DFA, NFA | 7/7 | checkable (Accepting := Final) | 7 / 0 / 2 |
| same | Flowchart | 5/5 | checkable | 7 / 0 / 6 |
| Extended SM with `effect`, `entry`, `exit: Action` | Extended SM | 5/5 | checkable | 11 / 0 / 2 |
| flow (3b) | Flowchart | 5/5 | checkable | 7 / 0 / 6 |
| textbook FSM (`isInitial`, `isFinal: EBoolean`, `source`, `target`) | State machine | 4/5 | notCheckable: Initial | 4 / 0 / 6 |
| same | DFA | 4/7 | notCheckable: Initial, Trigger, Accepting | 4 / 0 / 5 |
| Moore sketch (`Start`, `input`, `output`) | Moore | 7/7 | checkable | 7 / 0 / 2 |
| same | Mealy | 6/7 | notCheckable: Transition output | 6 / 0 / 3 |
| Petri (3b) | Petri net | 6/6 | checkable | 8 / 0 / 1 |
| Petri C1 | Petri net | 6/6 | checkable | 6 / 0 / 3 |

The `none` counts are optional roles with nothing to bind (Fork, Join, Activity final, Event identifier). No pair
returned candidates.

---

## 7. Decisions taken (unattended)

These are recommendations for the Phase 2 prompt. None amends a ratified row. RC-27 applies to D1 and D2, the new
interfaces.

- **D1.** The binder is a pure module `model/simulation/profileBinder.ts` over a plain `MetamodelSketch`.
  - A pure collector `components/editor-v2/sim/metamodelSketch.ts` reads the raw lookup.
  - Output per `edit` role: `bound | candidates | none`, with a reason.
  - `collectMetaOptions` stays as it is (Rule 9).
- **D2.** Apply writes one `state` assignment: the bound values of **unset** keys of `edit` roles, plus
  `simProfile`.
  - It never overwrites a set key and never writes `undefined`.
  - The proposed bag passes the overlap check of `writeRole` first; a refusal writes nothing.
  - It is one undo step (§6.3).
- **D3.** Candidates are never chosen by the binder. The summary names them and the group's select offers them.
- **D4.** In the demo lane the engine keeps reading the bag as today. The resolver that makes the bridge skip off
  keys (R-SIM-55 memo, `simProfiles.ts:268-270`) comes after the Petri row is settled (§8 A3). The profile governs
  the verdict and the UI only.
- **D5.** The M2 summary shows `checkability(profile, derivedBag)`, with no verdicts: «Checkable» or «Not
  checkable» plus the missing items. No «with warnings» until the compatibility check exists. The M1 gate is
  unchanged (`missingEngineRoles`).
- **D6.** `simProfile` absent → Custom. A present but unreadable value (`decodeProfile` → `null`) → Custom plus one
  warning line, «The stored profile is not readable», as the declarations table does.
- **D7.** The preset select lists system profiles only. «Custom» is a state, not an option. «Save as…» and user
  profiles wait for the modal lane, and so does the `validateProfile` ticket, which is not reachable before it
  (§6.2).
- **D8.** Keys that are set but whose role is `off` in the active profile are listed in one information line of the
  summary, never deleted.
- **D9.** Tests:
  - the binder on seven fixtures: the six sketches of §6.5, with the PEST SM reconstruction named as such, plus
    b2net;
  - the collector on a fake lookup;
  - `profileSummary` in `simRoleStatus.test.ts`;
  - a mutation bench over the binder's tie rule, the unset-only rule of the patch, and the lineage restriction of
    Trigger.
- **D10.** One SCSS rule gives `__body` a `max-height` with scroll, in the same lane, closing the measured overflow
  (§5.6).

---

## 8. Decisions awaiting Alfonso (RC-26 items only)

1. **A1 — what the demo shows: M3, M2 or M1.** Chat recommendation: **M3**, the inline preset row, summary and
   «Configure…» that folds the inline groups.
   - It fits one lane before the proposed 2026-10-01 freeze.
   - It departs from R-SIM-55 until the modal lane: «Configure…» expands groups instead of opening the modal. That
     is staging, not a change of the ratified target.
   - M1, the full modal, is two to three lanes and goes after MODELS.
2. **A2 — which presets the demo lists.** Chat recommendation: four, namely Petri net, Flowchart / Activity, State
   machine and Extended state machine.
   - Hide DFA, NFA, Moore and Mealy until R-SIM-50 and R-SIM-51 are in the engine.
   - Today they would show «Checkable» and run without accepting or output (§2(e), §5.8).
3. **A3 — amend R-SIM-54 (ratified): the Petri row activates the Data group.** That means Guard, Action, Entry, Exit
   and State attributes.
   - The engine already runs guards on Petri transitions (B2, R-SIM-64) and actions on Petri sites (R-SIM-69).
   - The row turns them off, so b2net and the C1 net fit no system profile (§6.1).
   - With a resolver, the Petri preset would drop their guards and actions.
   - Chat recommendation: amend, like R-SIM-68 amended the Flowchart row. Without it, the demo's Petri preset shows
     «Set but off: Guard» on the demo net.
4. **A4 — the demo metamodels use class-typed Initial / Final.** For example `Initial extends State`, not
   `isInitial: EBoolean`.
   - A boolean flag cannot be bound to any role today (§3.3).
   - Chat recommendation: yes, and say so in the demo script. Supporting boolean flags is an engine change for
     after MODELS.

---

## 9. Files read and probes

**Read**, full paths under `/Users/alfonso/jjodel-gate/`.

Simulation core:
- `frontend/src/model/simulation/roleCatalog.ts`, `simProfiles.ts` and `profileCodec.ts`, whole.
- `frontend/src/model/simulation/stateAttributesCodec.ts`: `:1-60` and its exports.
- `frontend/src/model/simulation/__tests__/simProfiles.test.ts`: the `describe`/`it` list.
- `frontend/src/model/simulation/netCompile.ts`: `:25-110` and `:405-445`.

Panel and bridge:
- `frontend/src/components/editor-v2/sim/simRoleStatus.ts`, whole.
- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: `:1-520`, `:600-981`, and grep.
- `frontend/src/components/editor-v2/sim/simBridge.ts`: `:300-380` and grep.
- `frontend/src/components/editor-v2/sim/simulation-panel.scss`: `:56-125`, `:169-181`, and grep.

Joiner, redux and model layer:
- `frontend/src/joiner/classes.ts`: `:2320-2400` and `:3345-3375`.
- `frontend/src/redux/action/action.ts`: `:205-275`.
- `frontend/src/redux/reducer/reducer.ts`: `:1170-1290` and `:1430-1445`.
- `frontend/src/redux/store.tsx`: `:75-83`.
- `frontend/src/model/logicWrapper/LModelElement.tsx`: `DClass :2694-2740`, `DReference :3932-3960`,
  `DTypedElement :1227-1250`.
- `frontend/src/common/Defaults.ts`: `:75-97`.

Modals and styles:
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx`: `:205-212` and `:421`.
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.scss`: `:10-17`.
- `frontend/src/events/registry.ts`: grep.
- `frontend/src/App.tsx`: `:60-63` and `:184-187`.
- `frontend/src/styles/tokens.css`: `:203-204`.
- `frontend/src/styles/tokens/_z-index.scss`: `:30-31`.
- A sweep of the modal pattern by a read-only search agent. Its citations above were re-read.

Docs:
- `docs/design/claude_2026-09-25_simulation_roles_modal_design.md` and
  `docs/ratifiche/claude_2026-09-25_1759_memo_simulation_roles_profiles.md`, whole.
- `docs/decisions.md`: R-SIM-13, R-SIM-34..37, R-SIM-47..56 and the R-SIM-54 correction, R-SIM-67..72, RC-20..24.
- RC-25..28, from the commit `88fe737b7` (not on this branch).
- `docs/prompts/claude_2026-09-25_1805_prompt_sim_role_catalog_profiles.md`: `:20-40` and `:140-150`.
- `docs/discovery/discovery_2026-09-26_sim_state_declarations.md`: §0, §1, §2(e), §7.6, §7.8 and §10.
- `docs/log-inbox/simulation.md`, whole (86 lines).
- `docs/claude-code-log.md`: `:1-120`.
- `docs/PROTOCOL.md`: P4 and P16.
- The prompt `P-2026-09-27-0140`: its DOVE list, via `git show 4faa9de7a`.

Probe templates read, not modified: `/Users/alfonso/jjodel-sim/frontend/scripts/smoke/_tmp_c_probe.vitest.config.ts`,
`_tmp_c1_vite.config.ts`, `_tmp_c1_visual.ts`, `_tmp_c_scenario.js` and `_tmp_sim3b_scenarios.js`.

**Probes** (gitignored, `frontend/scripts/smoke/_tmp_prof_*`, kept on disk):

- `_tmp_prof_probe.vitest.config.ts` and `_tmp_prof_probe/profiles.test.ts`: the pure modules and the binder
  prototype (§6.1, §6.2, §6.5). Exit 0, 6 tests.
- `_tmp_prof_vite.config.ts`: the 3005 server of this tree, with its cache in the session scratchpad.
- `_tmp_prof_scenario.js` and `_tmp_prof_visual.ts`: the panel on 3005 (§6.4). `npx tsx`, exit 0. Screenshots in the
  session scratchpad.
- `_tmp_prof_undo.ts`: undo granularity (§6.3). `npx tsx`, exit 0. A first run without `U.userHasInteracted`
  recorded no history at all.
