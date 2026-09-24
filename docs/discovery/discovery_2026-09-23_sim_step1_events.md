# Discovery — simulation step 1, events as M1 instances

- **Prompt-ID**: `P-2026-09-23-1850`, `docs/prompts/claude_2026-09-23_1850_prompt_sim_step1_events.md`, Phase 1 (read-only).
- **Session**: unknown (the harness does not show it to this session).
- **Tree**: `~/jjodel-sim`, branch `simulation-engine`, HEAD `293e7fec6` after `git merge --ff-only alfonso-frontend-jjtl` from `577cc52b5` (fast-forward accepted, 44 files, tree clean before and after).
- **Executor**: Anthropic Claude Opus 5.5 (`claude-opus-5-5`), as the session banner shows it.
- **Normative input**: R-SIM-16 and R-SIM-12 in `docs/decisions.md` (read first), spec `docs/spec/claude_spec_2026-09-13_computational_model.md` §3.1, §4, §7.

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real files. Tags: **[M]** measured in this phase (a run), **[R]** read (a file or a doc), **[D]** deduced.

## 0. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The event enters the step in one place, and `event: null` is threaded through a small, enumerable set of sites. | **Holds.** 6 code sites and 1 test site, §3.1. [M] |
| H2 | The event role can be added as optional flat keys without touching the four keys that gate the run controls. | **Holds.** `stcFromRoles.ts:23` and `ENGINE_ROLE_KEYS` (`SimulationPanel.tsx:77`) require only the four engine keys, §3.3. [R] |
| H3 | The core can enumerate the event instances through `SimModelView` without touching `idlookup` or L proxies. | **Partly.** The core never enumerates the model: the caller passes the ids, as `initialConfiguration` already does (`step.ts:50`). The adapter needs two new methods, §3.4. [R] |
| H4 | `isKindOf.ts` already offers what the disjointness check needs. | **Falsified.** It walks from an *object* (`isKindOf.ts:27`, `lookup[objectId]?.instanceof`). The check is between *classes*: a class-level entry point is needed, §3.5. [R] |
| H5 | Restricting today's fire-all to the transitions whose trigger matches keeps the parity oracle literal on models without the event role. | **Holds by construction**, provided the core ignores triggers whenever the STC declares no trigger role. Today's step executed on the three fixtures of §3.2. [M] |
| H6 | None of the proposed names is already in use. | **Holds**, with one name dropped (`isSubclassOf`, taken) and one file name dropped (`slotValues`, taken), §3.3 and §3.4. [M] |

## 1. Objective

Prepare step 1 of the six-step plan (spec §9): events as M1 instances, identity match of the trigger, one button per event instance plus ε, structural enabling, total engine with discard, optional event role, disjoint role metaclasses. Answer the eight items of the prompt's COME, and put in front of Alfonso the choice between restricted fire-all (a) and minimal interleaving (b).

## 2. Files read (full paths)

- `/Users/alfonso/jjodel-sim/CLAUDE.md`, `/Users/alfonso/jjodel-sim/docs/PROTOCOL.md` (P1..P15), `/Users/alfonso/jjodel-sim/docs/decisions.md` lines 1247-1410 (R-SIM-1..19)
- `/Users/alfonso/jjodel-sim/frontend/src/components/editor-v2/CLAUDE.md` (§3.11), `/Users/alfonso/jjodel-sim/frontend/src/model/CLAUDE.md` (§3.8, §3.12, §3.13, §9.3)
- `/Users/alfonso/jjodel-sim/docs/spec/claude_spec_2026-09-13_computational_model.md` (whole, 284 lines)
- `/Users/alfonso/jjodel-sim/docs/prompts/claude_2026-09-14_0140_prompt_sim_slice0_foundations.md` (whole)
- `/Users/alfonso/jjodel-sim/docs/discovery/discovery_2026-09-13_simulation_engine_state.md` §4 and §7 step 1 only (lines 332-470)
- `/Users/alfonso/jjodel-sim/docs/claude-code-log.md` head (header and first entries), `/Users/alfonso/jjodel-sim/docs/log-inbox/simulation.md`
- `/Users/alfonso/jjodel-sim/frontend/src/model/simulation/types.ts`, `step.ts`, `stcFromRoles.ts`, `isKindOf.ts`, `__tests__/step.test.ts` (all whole)
- `/Users/alfonso/jjodel-sim/frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `simRunState.ts`, `simulation-panel.scss` (all whole)
- `/Users/alfonso/jjodel-sim/frontend/src/model/logicWrapper/LModelElement.tsx`, the raw fields only: `DClass` 2715-2723, `DObject` 6004-6009, `DValue` 6750-6751
- `/Users/alfonso/jjodel-sim/frontend/tsconfig.json`, `/Users/alfonso/jjodel-sim/frontend/vitest.config.ts`

The M2-side writer of the `sim*` keys and the `SimModelView` adapter both live in `SimulationPanel.tsx` (`writeRole` at `:254-262`, `makeSimModelView` at `:206-221`). Measured that they are the only ones: the six role keys occur in 4 files, all under `model/simulation/` or `editor-v2/sim/` (`command grep -rnE` over `frontend/src`, exit 0, 34 lines; control: the same command lists `SimulationPanel.tsx` 18 times).

A note on the first search round: the first `grep` loop of this phase used unquoted `--include=*.ts` under zsh, which failed with `no matches found` for every name. Its silence was void and every search in this report was re-run with quoted globs, `command grep`, and a positive control (CLAUDE.md §5).

## 3. Findings

### 3.1 The step as it runs today (item 1)

- **The step**: `stepFlowchartBoolean(config, stc, view)`, `step.ts:63-89`. Terminal freeze first, `step.ts:70-72`: `if (marked.some(id => view.isInstanceOf(id, stc.roles.terminal))) { return { next: config, label }; }`. Then every outgoing transition of every marked instance fires, `step.ts:74-83`; the one line that decides which transitions fire is `step.ts:75`, `const transitions = view.outgoingTransitions(id);`, and `step.ts:76`, `if (transitions.length === 0) continue;`, keeps a stuck instance marked. The effect is `applyStepLabel`, `step.ts:29-38` (deactivate, then activate: activation wins). [R]
- **The panel call**: `onStep`, `SimulationPanel.tsx:290-297`: builds `{ marking: new Set(getSimActiveIds(modelid)), event: null }` (`:294`), calls the core with the adapter `makeSimModelView(lookup, ownedTransitionsName, nextStateName)` (`:295`), hands only `label.deactivated` / `label.activated` to `simApplyStep(modelid, ...)` (`:296`). The label's `fired` is dropped; `next` is dropped (the store re-applies the label). The Step button, `:369-377`, is disabled only on `runStatus === 'Terminated'` (`:374`). [R]
- **Where `event: null` is threaded** (measured, `command grep -rn "event"` on the two folders, 12 lines, exit 0; 5 of them are comments in `types.ts`):
  - `types.ts:24`, `readonly event: null;` (the type);
  - `step.ts:53` (`initialConfiguration`), `step.ts:86` (`next` of the step);
  - `simRunState.ts:37`, `configurations.set(modelId, { marking, event: null })`;
  - `SimulationPanel.tsx:271` (status memo) and `:294` (`onStep`);
  - `__tests__/step.test.ts:48` (fixture) and `:63` (`expect(c.event).toBeNull()`).
- **Consumers outside the two folders**: none for the core types. `command grep -rn` of `SimConfiguration`, `StepLabel`, `StcDescriptor`, `StcRoles`, `SimModelView`, `stepFlowchartBoolean`, `initialConfiguration`, `stcFromRoles`, `model/simulation` over `frontend/src`, excluding the two folders: 0 lines each. Control: `applyStepLabel` over the same tree, 9 lines. The run-state has external readers, `ObjectNode.tsx:40,272` (`isSimActive`, `useSimVersion`) and the IR (`irReadCtxLproxy.ts:10,21,63`, `irResolve.ts:14`, `useIRContainment.ts:15`, `useIRFormView.ts:25`, all `useSimVersion` or `isSimActive`); none reads `event`. [M]

### 3.2 Restricted fire-all (a) against minimal interleaving (b) (item 2)

Today's step was **executed** (esbuild bundle of `step.ts` run under node, fake `SimModelView`, P11) on three fixtures. Under (a) the step is today's step over the transitions whose trigger matches the event, so where all the transitions of a fixture carry the same trigger `coin`, today's output on the untriggered fixture **is** (a)'s output for `coin`:

| Fixture | Today, measured [M] | (a) on `coin` | (b) on `coin` |
|---|---|---|---|
| M1: `A` marked, `t1: A -coin-> B`, `t2: A -coin-> C` | `{B, C}`, label `fired [t1,t2] deactivated [A] activated [B,C]` | `{B, C}`: one event, two states marked in a boolean machine | `{B}` or `{C}`, the selector picks; candidates `{t1, t2}` |
| M2: `A`, `X` marked, `t1: A -coin-> B`, `t2: X -coin-> Y` | `{B, Y}`, label `fired [t1,t2] deactivated [A,X] activated [B,Y]` | `{B, Y}`: one event consumed by two tokens | `{B, X}` or `{A, Y}`; the other token needs a second `coin` |
| Turnstile, one token on `Locked`, `coin1: L->U`, `push1: L->L`, `push2: U->L` | with triggers ignored: `{L, U}`, `fired [coin1,push1]` | `coin` fires `coin1` only: `{U}`; `push` fires `push1` only: `{L}` | identical to (a): one candidate per (state, event) |

The turnstile row matters for the Phase 2 visual check: the acceptance model is deterministic (one token, at most one transition per state and event), so (a) and (b) produce the same trace on it and the check cannot tell them apart. It also shows that without the trigger restriction today's engine would split the turnstile's token on the first step, so the check does exercise the restriction.

Where (a) and (b) differ is exactly M1 (non-determinism on one node) and M2 (concurrency across tokens, which in a boolean machine arises only from a fork or from two instances of the initial metaclass).

**The two diffs.**

- **(a)**, `step.ts` only on the semantic side: the filter of `step.ts:75` becomes "the transitions of `id` accepted by `config.event`" (accepted: no trigger role declared, or `trigger === event`, with `null === null` for ε), and `step.ts:76` then skips a marked node none of whose transitions is accepted. The rest of the function is unchanged, `runStatus` is unchanged. Without the trigger role every transition is accepted by ε and the function is today's, line for line, so `step.test.ts` stays byte-identical and green (the parity oracle of R-SIM-16). About +15 lines in the step, +40 for the enabling and enumeration helpers of §3.4.
- **(b)**, a candidate type `(transition)`, a selector input, the progress constraint (spec §4.3), and a chooser in the panel whenever a step has more than one candidate (a list of candidates in the panel: the canvas channel is critical zone and belongs to step 3). Then one of two things: either ε interleaves too, and four tests of `step.test.ts` change (the fork `:89-97` and the join `:99-107`, the dangling pair `:109-117`, where one transition fires instead of two, and the re-entry `:149-156`, where `{A, B}` becomes `{B}` or `{A}`), so parity on existing models is broken, against R-SIM-16; or ε keeps the fire-all and only events interleave, which is two step semantics side by side, against R-SIM-7 ("viene sostituito, non affiancato"). `runStatus` would also want the step-3 definition (deadlock = no candidate, spec §9 step 3) to stay coherent. About +80 lines in the core, a new panel control, and test rewrites.

**Recommendation: (a).** It is the only one of the two that satisfies R-SIM-16 (parity oracle) and R-SIM-7 (no two semantics) at the same time; step 3 then replaces the fire-all once, for ε and events together, when guards make the candidate set carry information. The cost of (a) is M1: one event marks two states of a boolean machine, a visible violation of exclusivity (spec §3.3). It is the same class of quirk the fire-all already produces with an ε fork, and in Phase 2 it gets a test named `quirk:`, like the slice 0 ones. **Not decided here.**

### 3.3 Three new flat keys, and how the STC grows (item 3)

Proposed, in the style of R-SIM-2 (flat, `sim` prefix, pointer values, the role named, not the feature):

| Key | Points to | Role kind in the panel | Grep over `frontend/src` [M] |
|---|---|---|---|
| `simEvent` | the event metaclass (`DClass` id) | `class` | `command grep -rnw simEvent`: 0 lines |
| `simTrigger` | the trigger reference on the transition metaclass (`DReference` id) | `reference` | `-w simTrigger`: 0 lines |
| `simEventIdentifier` | the identifier feature of the event metaclass (`DAttribute` id) | `attribute` (new) | `-w simEventIdentifier`: 0 lines |

Also searched, all 0 lines: `simEventName`, `simEventId`, `simEventLabel`, `simEvents`, `simIdentifier`; substring `simEvent`: 0 lines. Positive control through the same command: `simNextState`, 8 lines. In `docs/`, the only `sim*` key not in code is `simSource` (R-SIM-10, not implemented); none of the three proposed is mentioned. `simEventName` is the shorter alternative; `simEventIdentifier` is proposed because R-SIM-12 and R-SIM-16 say "feature identificatore" and the feature need not be called `name`.

**How the types grow**, all additive:

- `StcRoles` (`types.ts:34-41`) gains three optional properties, `event?`, `trigger?`, `eventIdentifier?`. `StcDescriptor` (`types.ts:44-47`) is unchanged: the kind stays `'boolean'`.
- `stcFromRoles` (`stcFromRoles.ts:17-34`) reads the three keys with the existing `pointer()` and sets them like `node` and `transition` (`:29-32`). The `null` rule at `:23` is untouched, so `rolesComplete` and the run controls of every metamodel configured today are unchanged. Proposed rule for a partial role: the descriptor carries `event` and `trigger` only when **both** are set, and `eventIdentifier` only with them; one of the two alone is treated as no event role at all (alphabet {ε}, today's behaviour), and the M2 face shows a hint. Question 4.
- Panel (`SimulationPanel.tsx`): `RoleKey` (`:40-46`) gains the three keys; `ROLE_SPECS` (`:57-64`) three entries (`Event`, `Trigger`, `Event identifier`); `RoleKind` (`:48`) gains `'attribute'`; the internal `MetaOptions` (`:82`) gains `attributes`, filled by `collectMetaOptions` (`:97-145`) from `dClass.attributes` (`LModelElement.tsx:2721`) with the same qualified `Class.attr` label it uses for references (`:124`). This is the gap the engine-state discovery §7 named: "`collectMetaOptions` offers no attributes, so the *identifier feature* has no option list yet." `ENGINE_ROLE_KEYS` (`:77`) is **not** touched. `MetaOptions`, `RoleKey` and `RoleKind` are not exported.

### 3.4 Enumerating the events through `SimModelView` (item 4)

The core does not enumerate the model today and should not start: `initialConfiguration(stc, view, ids)` (`step.ts:50`) receives the model's ids from the caller, who reads them with `collectModelObjectIds` (`SimulationPanel.tsx:152-166`, a raw `idlookup` walk, already pure). Events follow the same path: the alphabet is the subset of those ids for which `view.isInstanceOf(id, stc.roles.event)` holds, with `isKindOf` ancestry (R-SIM-8) coming from the adapter as it does for the initial role. Event instances live in the same M1 model as the machine (R-SIM-16), so the same id list serves both.

Two methods are added to `SimModelView` (`types.ts:78-83`), both **optional** (P3, rule 11: the two fake views of `step.test.ts:38-45` and `:242-247` keep compiling unchanged):

```ts
/** The event instance held by the transition's trigger slot, or null when unset. */
transitionTrigger?(transitionId: string): string | null;
/** Display label of an element: the value of the event identifier feature, with a fallback. */
label?(id: string): string;
```

The core reads `transitionTrigger` **only when `stc.roles.trigger` is set**. Without the role it never calls it, so parity does not depend on the adapter (§3.2, (a)).

Core functions proposed (signatures only; names grepped, 0 lines each with `-w`: `eventAlphabet`, `enabledEvents`, `triggerMatches`, `transitionTrigger`, `SimEventInfo`; control `stepFlowchartBoolean`, 22 lines):

```ts
export interface SimEventInfo { readonly id: string; readonly label: string }
/** The event instances among `ids`, sorted by label then id; [] without the event role. */
export function eventAlphabet(stc: StcDescriptor, view: SimModelView, ids: readonly string[]): SimEventInfo[];
/** R-SIM-16: events that trigger at least one transition leaving a marked node. Structural, no guards. */
export function enabledEvents(config: SimConfiguration, stc: StcDescriptor, view: SimModelView): ReadonlySet<string>;
```

The adapter implements the two methods on the **raw D-layer by pointer**, not on the L proxy by name: an object's slot is the `DValue` among `lookup[id].features` (`LModelElement.tsx:6009`) whose `instanceof` (`:6751`) is the role pointer, and its content is `values` (`:6750`), ids for a reference. That makes both readers pure over `idlookup`, so they can live in `model/simulation/` and run under the test bench, which the proxy readers of the panel cannot (the joiner does not import under node; `isKindOf.ts:14-16` records the same constraint). Reference slots are counted on the raw values with the falsy entries filtered out, per `model/CLAUDE.md` §9.3 ("A single-valued reference that was never set reads back as `[null]`" on the proxy). Label fallback when the identifier slot is empty or the role unset: `DObject.name`, then `initialName` (`LModelElement.tsx:6004-6005`, the latter commented "Used as fallback display name when identity slot is empty"), then the id. The name `slotValues` is taken (`editor-v2/viewpoint/ir/slotValues.ts`, 8 lines), `rawSlotValues` is a local of `hooks/outlineDraw.ts:99`; proposed `objectSlotValues` (0 lines) in a new `model/simulation/objectSlots.ts`. The existing readers (`outgoingTransitions`, `transitionTargetId`, `:174-198`) stay as they are: no refactor, and the asymmetry (old by name on the proxy, new by pointer on raw data) is declared. **[D], not measured**: that the `DValue` of an inherited attribute carries the declaring `DAttribute`'s id in `instanceof`; Phase 2 measures it on the live turnstile before relying on it.

When the panel computes the alphabet: in `mapStateToProps` on the M1 face, only when the event role is declared, as a JSON signature `eventSig` (0 lines in grep) so that `connect`'s shallow compare holds (`:20-22` of the header). It costs one `collectModelObjectIds` scan per dispatched action on the M1 face, the same order as `collectMetaOptions` on the M2 face. Enablement is derived in a `useMemo` on `simVersion`, like `runStatus` (`:266-276`), and inherits its known limit (engine-state discovery §4: "editing the M1 model during a run refreshes the status only at the next `simVersion` bump").

### 3.5 The disjointness check (item 5)

- **Where**: `writeRole`, `SimulationPanel.tsx:254-262`, is the STC save path: the only writer of the `sim*` keys (§2). The check runs before `lmm.state = {...}` (`:261`) for a write to a class role; on a violation the write is refused and the M2 face shows the reason in a hint line (the select falls back to the stored value on re-render).
- **What**: three sorts, node = {`simNode`, `simInitial`, `simTerminal`}, transition = {`simTransition`}, event = {`simEvent`}, counting only the keys that are set. The roles are disjoint when no concrete class of the metamodel is a kind of two sorts. Checking on concrete classes covers the three shapes at once: the same class in two roles, one role's class a subclass of another's, and a class inheriting from both through multiple `extends` (an array, `LModelElement.tsx:2723`). Initial and terminal are subclasses of the node class by design, which is why the check is between sorts and not between keys.
- **Does `isKindOf.ts` offer it?** No (H4). `isKindOf(lookup, objectId, classId)` starts at `lookup[objectId]?.instanceof` (`:27`). Proposed: a second export `classIsKindOf(lookup, classId, ancestorId)` holding the walk of `:29-41`, and `isKindOf` becomes its caller after the `instanceof` read; behaviour of `isKindOf` unchanged, still pinned by the `classAncestry` agreement test (`step.test.ts:280-292`). `isSubclassOf` was the obvious name and is taken (`LModelElement.tsx:3757`, `XMIService.ts:1157`); `classIsKindOf`, 0 lines. The IR's `classAncestry` (`irReadCtx.ts:109`) cannot be imported by the core (R-SIM-14). The check itself is a pure function (`roleOverlaps`, 0 lines) next to `stcFromRoles` in `stcFromRoles.ts`.
- **Gap**: the check at save does not see a later edit of the metamodel (an `extends` added after the roles were set). Question 5.

### 3.6 `SimConfiguration.event` and `StepLabel` (item 6)

- `SimConfiguration.event` (`types.ts:24`): from `null` to `string | null`, `null` meaning absent, the ε step. It is the **input** of one step and nothing more: the panel puts the pressed event in the configuration it passes, the step consumes it, `next.event` is always `null` (spec §4.4, "e' is absent after any firing", and the discard consumes it too). The run-state keeps storing `event: null` (`simRunState.ts:37`) and needs no change. The engine-state discovery's open "whether the current event is session state (singleton) or panel React state" (§7) is answered: neither, it is an argument. Every slice 0 writer passes `null`, still assignable, so every consumer compiles. **Rule 11 / P3 flag**: this widens the type of an existing property of an exported interface, which is more than adding an optional one; it needs the GO to authorize it.
- `StepLabel` (`types.ts:57-61`): two optional properties, `event?: string` and `discarded?: boolean`, **both present if and only if the step received an event**. An ε step's label keeps exactly the slice 0 shape, so the `toEqual` assertions of `step.test.ts` (`:82`, `:86`, `:106`, `:116`, `:127`, `:146`, `:162`) keep passing without a line changed. `discarded` is `true` when an event was supplied and nothing fired. Spec §4.3 calls ε-with-nothing-enabled "quiescence", not a discard, so an ε step never carries the flag.
- Terminal freeze with an event (`step.ts:70-72`): today it returns `config` itself (`step.test.ts:126`, `expect(s.next).toBe(frozen)`). With an event, returning `config` would leave `next.event` set. Proposed: keep the identity return when `config.event === null` (parity), and with an event return `{ marking: config.marking, event: null }` and a label with `discarded: true`.

### 3.7 Test plan, one mutation per rule (item 7)

`step.test.ts` stays **byte-identical**: it is the parity oracle, and a diff on it would be the first sign parity was traded away. New tests go in a new `model/simulation/__tests__/events.test.ts`, executing the core (P11), each "nothing happens" paired with a control where something does (P12).

| Rule | Test | Mutation it must kill |
|---|---|---|
| Parity without the event role | Fixtures of slice 0 (fork, join, self-loop, dangling, freeze) with a view whose `transitionTrigger` **does** return ids, and an STC without `trigger`: the step equals the slice 0 step on each | the core consults `transitionTrigger` without checking `stc.roles.trigger` |
| Parity, oracle | `step.test.ts` unchanged, green | any change to the ε path (verified by the existing tests themselves) |
| Identity match | two instances `coin1`, `coin2` of the same `Event` class, both labelled `coin`; `t: A -coin1-> B`: `coin1` fires `t`, `coin2` is discarded | (i) match by metaclass (`isInstanceOf(event, class of trigger)`); (ii) match by label |
| ε restriction | with the trigger role, ε fires only untriggered transitions; an event fires only its triggered ones | `trigger === null \|\| trigger === event` (untriggered also on events); `event === null` treated as a wildcard |
| Stuck-on-event node stays marked | `A` has only `push`-triggered transitions; `coin` step leaves `A` marked while `X -coin-> Y` fires | dropping the `continue` after the filter (source deactivated with nothing fired) |
| Structural enabling | turnstile: `{Locked}` enables `{coin, push}`, `{Unlocked}` enables `{push}` only | (i) scan all nodes instead of marked ones; (ii) ignore the trigger (every event enabled when any transition leaves) |
| Discard | `coin` on `{Unlocked}`: marking unchanged, label `{fired:[],deactivated:[],activated:[],event:'coin',discarded:true}`, `next.event === null`; control `push` moves the token, `discarded:false` | flag not set; event not consumed (`next.event === 'coin'`) |
| Alphabet | `eventAlphabet` lists instances of a subclass of the event metaclass, sorted by label; `[]` without the role | exact-class match instead of `isKindOf`; missing sort |
| Disjointness | violation for: same class in two sorts; event class subclass of node class (and the reverse); a concrete class extending both `Event` and `State`; none for disjoint roles; initial ⊂ node is **not** a violation | (i) equality only; (ii) direct `extends` only, not transitive; (iii) one direction only; (iv) no common-subclass check; (v) initial/terminal counted as their own sort |
| `stcFromRoles` | the three keys optional; partial role (`simEvent` without `simTrigger`) yields no event role | `simEvent` added to the required keys (already killed by `step.test.ts:315-320`) |
| Raw readers | `objectSlotValues` on a raw lookup: set reference, unset reference (`[]` and `[null]`), attribute | not filtering falsy entries |

Not executable, declared as a gap: the panel itself (buttons, disabled state, layout), since `SimulationPanel.tsx` imports the joiner and does not load under the node bench. Its coverage is the visual check.

### 3.8 Baseline gates (item 8), measured on `293e7fec6` in `~/jjodel-sim`

- `npm run typecheck`: exit 2, **14** errors, full output read (32 lines): `api/data.ts(868,22)`, `(868,34)`, `(1126,44)`; `common/Dummy.ts(46,17)`; `editor-v2/EditorV2.tsx(3114,86)`; `forEndUser/Measurable.tsx` ×6 (`271,86`, `287,21`, `289,32`, `292,40`, `298,79`, `302,36`); `Jodie/ChatMessages.tsx(271,13)`; `project/ProjectEditor.tsx(226,67)`; `pages/components/Dashboard.tsx(586,66)`. None in the simulation files. CLAUDE.md §17 still says 33 (with 19 casing errors); the 19 are absent here, consistent with the trunk entry of 2026-09-21 ("14 errors, the baseline set").
- `npx vitest run`: exit 1, **182 files, 173 passed, 9 failed at import** (7 `jjtl/__tests__/*`, `jjscript/__tests__/context-binding.test.ts`, `utils/__tests__/UDComparator.test.ts`), **4185 tests passed, 0 failed**. `npx vitest run src/model/simulation`: 1 file, **27 passed**, exit 0.
- `npm run build`: exit 0, only the chunk-size warning; `git status --short` empty before and after.

## 4. Risks

1. **Rule 11 on `SimConfiguration.event`** (§3.6): a widened property type, not an added optional one. No consumer breaks (§3.1), but it needs explicit authorization in the GO.
2. **(a) marks two states on non-determinism** (§3.2, M1). A visible quirk until step 3; pinned by a `quirk:` test.
3. **Spec §7 vs R-SIM-16 on stability.** The spec admits an event "only in a stable configuration" (no untriggered edge is a candidate); R-SIM-16's enabling rule is structural and says nothing about stability. On the turnstile it makes no difference (no untriggered transitions). Question 3.
4. **The turnstile needs a terminal metaclass.** `simTerminal` is an engine key (`SimulationPanel.tsx:77`), so the M1 controls stay hidden until it is set, even though the turnstile has no final state. The test metamodel needs a `Final` class with no instance. [R]
5. **The save-time check misses later metamodel edits** (§3.5). Question 5.
6. **Multi-valued triggers.** R-SIM-12 speaks of "un riferimento"; if the trigger reference has `upperBound > 1`, the proposed `transitionTrigger` reads one value and ignores the others. Proposed: take the first non-falsy raw value and record the limit; the array form (`transitionTriggers`, 0 lines in grep) is the alternative.
7. **Cost on the M1 face**: one `idlookup` scan per dispatched action when the event role is declared (§3.4). Same order as the M2 face today; not measured.
8. **Unmeasured D-layer assumption** (§3.4): the `instanceof` of an inherited attribute's `DValue`. Measured in Phase 2 before the readers rely on it.
9. **File count above five** (rule 19): eight files, §6.

## 5. Open questions for Alfonso

1. **(a) or (b)?** Restricted fire-all now and interleaving in step 3, or a minimal selector already in step 1 (§3.2). Recommended: (a).
2. **When is the ε button enabled?** (i) today's rule, disabled only on `Terminated` (`SimulationPanel.tsx:374`), so an existing flowchart runs literally as before; or (ii) structural, by analogy with R-SIM-16 (enabled iff an untriggered transition leaves a marked node), which also disables it at `Not started` and in a full deadlock, where today's click is a no-op. Recommended: (i) in step 1, plus event buttons also disabled on `Terminated` (a freeze makes them no-ops).
3. **Stability (spec §7)**: do event buttons also require that no untriggered transition leaves a marked node? Recommended: no in step 1 (R-SIM-16 literal); run-to-completion comes with the macro-step presentation (spec §11).
4. **Partial event role**: `simEvent` and `simTrigger` both required for the role to exist, `simEventIdentifier` optional with a label fallback, one alone treated as no role plus a hint (§3.3)? Recommended: yes.
5. **Disjointness after a metamodel edit**: save-time only (R-SIM-16 literal), or also re-checked on the M1 face, which then hides the run controls with a hint? Recommended: save-time only in step 1, the gap recorded.
6. **Where the ε button sits**: (i) today's Step button (`bi-play-fill`) *is* the ε step, and an Events section below lists only the event buttons, shown only when the role is declared (no change at all for existing models); or (ii) an Events section with ε first and the event buttons after, Step removed from the action row. Recommended: (i).
7. **Key names**: `simEvent`, `simTrigger`, `simEventIdentifier` (or `simEventName`)?

## 6. Proposed Phase 2 diff, in prose

Core first, pure, no React (R-SIM-14):

1. `frontend/src/model/simulation/types.ts`: `SimConfiguration.event` to `string | null`; `StcRoles` + `event?`, `trigger?`, `eventIdentifier?`; `StepLabel` + `event?`, `discarded?`; `SimModelView` + optional `transitionTrigger?`, `label?`; new `SimEventInfo`.
2. `frontend/src/model/simulation/step.ts`: `stepFlowchartBoolean` filters by trigger per (a), sets `event`/`discarded` on event steps, consumes the event, handles the freeze with an event; new `eventAlphabet`, `enabledEvents`. `runStatus`, `initialConfiguration`, `applyStepLabel` unchanged.
3. `frontend/src/model/simulation/stcFromRoles.ts`: reads the three keys (partial rule of question 4); new `roleOverlaps`.
4. `frontend/src/model/simulation/isKindOf.ts`: new export `classIsKindOf`, `isKindOf` delegates to it.
5. `frontend/src/model/simulation/objectSlots.ts` (new): `objectSlotValues(lookup, objectId, featureId)`, raw, falsy filtered.
6. `frontend/src/model/simulation/__tests__/events.test.ts` (new): the table of §3.7, with the mutation bench reported in the commit message. `step.test.ts` untouched.

Then adapter and panel:

7. `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: three role specs, `'attribute'` kind and option list; `writeRole` runs `roleOverlaps` and refuses with a hint; the adapter gains `transitionTrigger` and `label` over `objectSlotValues`; `mapStateToProps` gains `eventSig` on the M1 face; an Events section per questions 2 and 6, one button per event (`bi-chevron-right` glyph plus the label), disabled buttons stay visible, fixed row height so enablement does not shift the layout; `onEvent(id)` calls the core with `event: id`.
8. `frontend/src/components/editor-v2/sim/simulation-panel.scss`: the Events section and event button (8px grid, 11px secondary text), the hint variant for the refusal; class names grepped, 0 lines (`sim-panel__events`, `sim-panel__event`, `sim-panel__warning`, `&__event` in the sim folder); control `sim-panel__hint`, 2 lines. No variable defined (rule 28).

Not touched: `simRunState.ts` (stores `event: null` as today), `ObjectNode.tsx`, everything under `editor-v2/viewpoint/ir/`, `joiner/*`, `jjel/*`. No critical zone file, so no Layer Impact Report is due; the report says so in the log entry.

**Eight files (two new), above the five of rule 19**, listed with their change above for the GO to confirm. Docs at close, in their own commit (P13): `docs/log-inbox/simulation.md` (entry), the prompt's `Status` line.
