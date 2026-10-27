# Discovery: the faces of Accepting and the outputs, their M2 rows, and the four hidden presets

- Prompt-ID `P-2026-09-29-0239`, prompt `docs/prompts/claude_2026-09-29_0239_prompt_discovery_sim_outputs_faces.md`, chat `C-2026-09-28-1936`.
- Session `a6588dc6-7ee4-4a19-a871-8388b915062e`, tree `~/jjodel-w-faces`, branch `sim-outputs-faces-disc`, HEAD `07dd278e3` (trunk `c2560b69e` plus the prompt).
- Executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`). Read-only; one gitignored probe, no dev server, no port.
- A set of hypotheses with evidence, not a reference: whoever uses it downstream rereads the files. **[M]** measured in this
  phase on `07dd278e3` (probe of §7), **[R]** read on the same HEAD.

## 0. Answer in brief

- **M2 rows: the dialog already builds them; what blocks them is the preset list [M, R].** The dialog's rows come from
  `ROLE_CATALOG` through `roleSections` (`simRolesDraft.ts:88-119`), not from `ROLE_SPECS`. With DFA picked, Accepting is
  a Required row (probe A), `judge` lists `Initial ok, Accepting ok, State warn, Transition and Symbol incompatible` (B),
  and picking a class turns `Missing: Accepting.` into `checkable` (C). Two things hide it: DFA, NFA, Moore and Mealy are
  not in `PANEL_PROFILE_IDS` (`simRoleStatus.ts:209`), which feeds both selects; `UNREAD_ROLES` (`simRolesDraft.ts:57`)
  hides the three roles in every other profile and refuses to switch them on. `ROLE_SPECS` needs `simAccepting` anyway:
  the panel's Reset overlap check reads only its keys (`SimulationPanel.tsx:439-441`, `:919-922`).
- **S5 is covered by R-SIM-86 [M].** SM then DFA leaves `simTerminal` in the bag; `runBag` drops it (`simBridge.ts:137-143`):
  on the accepting state the run reads `Running`, accepting true, where S4 measured `Terminated` (probe D). The engine's
  readers give the faces their values: DFA accepting per step, Moore `red`/`green`, Mealy `unlock`, `lock` (B, F).
- **The faces, one line each, in fixed slots [R]:**
  - status row: `Running · accepting`, a span after the status text, only while the run's net has an accepting set and
    σ accepts. The row is one line (`simulation-panel.scss:532-572`): no height change.
  - Moore: `Output: green` on its own line under `Marking:`, with the marking line's classes. It is there from Reset to Stop
    whenever the net has state outputs, `Output: none` when the marked state has none: it never appears mid-run.
  - Mealy: `Last step: coin: t1 (locked → unlocked) fired, output unlock`, title `output: unlock`; clamped
    (`simulation-panel.scss:506-510`), so a long label hides it: the visual check measures it.
- **The four presets go into the two selects [R]:** the panel's Profile select (`SimulationPanel.tsx:629`) and the
  dialog's header select (`SimRolesModal.tsx:731`), after Extended state machine, through `PANEL_PROFILE_IDS`. Not into the
  first-open picker (`SimRolesModal.tsx:101-108`): its chips are a 32 px column (`SimRolesModal.scss:1057-1066`), so four
  more would lengthen the Control flow card on step 1 of every demo scene.
- **«Checkable» on a plain metamodel means the closure plus Trigger plus Accepting (DFA, NFA), State output (Moore) or
  Transition output (Mealy) [M].** The constraints are not checked (`simProfiles.ts:12-13`). A «Checkable» DFA with a
  nondeterministic edge and an ε-edge opens a choice list and enables ▶ (probe E).
- **The four demo scenes [M, R]:** no key written (G), M1 lines identical (G), picker unchanged. Visible: the closed
  «not used» fold of the dialog grows by 3 (SM `3 derived · 11 not used` → `14`, ESM 8 → 11, Flowchart 9 → 12, Petri 13
  → 16), and the two selects list eight presets when opened (§3.7).

Recommended: one lane, `sim-outputs-faces`, ten files (six code, four test), launched today, merged by 2026-09-30 evening
after the four scenes' parity re-run that the demo script requires (`models_2026_simulator_demo.md:11-13`).

Decisions awaiting Alfonso:
1. R-SIM-93 shows the presets «dopo MODELS (decisione H)»; the prompt says Alfonso wants them before the freeze.
   Recommended: record it as an amendment on his words of 2026-09-28 23:00 (head of R-SIM-90), with no new question.
2. A DFA or Moore scene in the demo. Recommended: no; the script keeps «The outputs profiles» out (§5, `:433`).

Questions: 1. Keep the four presets out of the first-open picker? Recommended: yes. 2. Drop `UNREAD_ROLES`, so the three
become ordinary rows, switchable on in a user profile? Recommended: yes.

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The M2 face has no row for the three keys, so DFA's `Missing: Accepting.` is a dead end (prompt, COSA 1) | **partly** | `ROLE_SPECS` lacks them [M: A, `[false,false,false]`, control `simActivityFinal`, `simTerminal` `[true,true]`]; but the dialog's rows are the catalog's, and DFA's Required holds `["accepting"]` [M: A, C] with its candidates judged [M: B, C]. The dead end is the preset list (`simRoleStatus.ts:209`) and `UNREAD_ROLES` (`simRolesDraft.ts:57`) [R] |
| H2 | R-SIM-86 covers S5 on the trunk | **holds** | probe D: `runBag has simTerminal / simAccepting: [false,true]`; control `netStcFromRoles(raw).terminal / (runBag).terminal: ["C_Acc",null]`; `press b … Running; accepting=true` |
| H3 | The engine's readers give the faces their values | **holds** | `isAccepting`, `stateOutputOf`, `transitionOutputOf` (`netStep.ts:88-112`) on three fixtures [M: B, F, H] |
| H4 | Showing the presets is one constant | **partly** | the two selects read `PANEL_PROFILE_IDS` [R: `SimulationPanel.tsx:76`, `:629`; `SimRolesModal.tsx:697`, `:731`]; the picker has its own list `KINDS` [R: `SimRolesModal.tsx:101-108`]; two tests pin the hidden state [R: `simRoleStatus.test.ts:252-255`, `simRolesDraft.test.ts:97-104`, `:242-243`] |
| H5 | The four demo scenes see no change | **partly** | bags and M1 lines unchanged [M: G]; the dialog's closed fold counts three more roles once `UNREAD_ROLES` goes [M: A] |
| H6 | A class playing Accepting and Transition is refused (R-SIM-16) | **falsified** | `ROLE_SORTS` has no `simAccepting` (`stcFromRoles.ts:24-25`) [R]; probe G `overlapVerdict simAccepting on Transition: null`, control `simTerminal on Transition: … "refuse":true` [M]. Still the open item of R-SIM-91 |
| H7 | A «Checkable» DFA is deterministic and ε-free | **falsified** | probe E: `DFA · Checkable after Apply`, `inputs on: ε,a,b`, `press a: null PENDING t00,tx` [M]; «identifiers only here» (`simProfiles.ts:12-13`) [R] |
| H8 | A DFA whose initial state accepts binds by Apply | **falsified** | with `InitialAccepting extends Initial, Accepting`, Apply proposes neither: `Choose Initial: 2 candidates (Initial, InitialAccepting); Accepting: 2 candidates (Accepting, InitialAccepting).`, Reset refused; picked by hand, Reset reads `accepting=true` [M: E, H] |

## 2. Sources read

- `CLAUDE.md` (§5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `frontend/src/model/CLAUDE.md` (loaded on read);
  `docs/PROTOCOL.md` P16 (`:368-420`); `docs/decisions.md` RC-20, RC-21 (`:145-166`), RC-33 (`:272-273`), R-SIM-78/79
  (`:2160-2179`), R-SIM-86 (`:2268-2289`), R-SIM-89/90 (`:2317-2330`), R-SIM-91..93 (`:2332-2380`), R-SIM-94 (`:2382-2387`).
- `docs/discovery/discovery_2026-09-27_sim_outputs_accepting.md` whole; `docs/demo/models_2026_simulator_demo.md` whole;
  `docs/log-inbox/simulation.md` `:1-80`; `docs/claude-code-log.md` `:1-60`.
- Whole: `frontend/src/components/editor-v2/sim/simRoleStatus.ts`, `simRolesDraft.ts`, `SimRolesModal.tsx`,
  `SimulationPanel.tsx`; `frontend/src/model/simulation/roleCatalog.ts`, `simProfiles.ts`, `bindingCompat.ts`.
- In part: `simBridge.ts` `:1-60`, `:130-165`, `:550-660`, `:770-845`, `:1115-1229`; `netStep.ts` `:55-115`, `:332-360`;
  `netCompile.ts` `:438-448`, `:560-610`; `stcFromRoles.ts` `:15-40`; `profileBinder.ts` `:185-215`, `:270-360`, `:387-415`;
  `simulation-panel.scss` `:55-80`, `:195-215`, `:500-580`; `SimRolesModal.scss` `:1006-1070`.
- Tests, by grep of the three roles and `PANEL_PROFILE_IDS` (`command grep`, exit 0, hits in three files): `simRoleStatus.test.ts:248-258`,
  `simRolesDraft.test.ts:90-110`, `:236-248`, `simBridge.test.ts:1285-1350`.

## 3. Findings

### 3.1 The M2 rows

- **Where the rows come from.** `roleSections` walks the catalog (`simRolesDraft.ts:108`: `for (const d of ROLE_CATALOG) {`);
  the dialog renders its sections (`SimRolesModal.tsx:851`: `{sections.required.flatMap(item => item.map((r, i) => bindingRow(r, …`).
  The inline groups of `ROLE_GROUPS` are gone: `command grep -n ROLE_GROUPS SimulationPanel.tsx` has no hit, while the same
  command finds `ROLE_SPECS` at `:42`, `:70`, `:864`. S4's «Output group» of `ROLE_GROUPS` (its §5.3) is obsolete.
- **What `ROLE_SPECS` still does** [R]: the `roleSig` keys (`SimulationPanel.tsx:70`, `:919-922`), which the Reset
  overlap check reads (`:439-441`: `overlapVerdict(lookup, roles, …)`); `missingEngineRoles` labels. So `simAccepting`
  needs a `RoleKey` literal and a row for the check to see it once `ROLE_SORTS` has it. The outputs need a row only for
  parity with `simActivityFinal` (E2's G6).
- **The three rows as the dialog shows them** (group, label, kind, candidates, `judge`):
  - Accepting: catalog group `general`, class, `dependsOn: ['node']` (`roleCatalog.ts:83-86`); select placeholder
    `Select a metaclass` (`SimRolesModal.tsx:133`); `judge` = concrete, proper subclass of Node (`bindingCompat.ts:93-95`,
    `:219-227`). On DemoDFA: `["State","warn","every State would be Accepting: choose a subclass of State"],["Initial","ok",""],["Accepting","ok",""],["Transition","incompatible","Transition is not a kind of State"],["Symbol","incompatible","Symbol is not a kind of State"]` [M: B].
  - State output: group `output`, `attribute`, owner Node (`roleCatalog.ts:171-174`, `bindingCompat.ts:100`); Transition
    output: owner Transition (`:175-178`, `:102`). No type rule applies to `attribute` (`bindingCompat.ts:273-282` tests
    `intAttribute`, `expressionAttribute`, `actionListAttribute` only): an Expression or Action attribute is `ok` as an
    output. Probe F: `[["output","ok",""]]` for each.
- **The binder** proposes Accepting by `/accept|final/` (`profileBinder.ts:201`), the outputs by `/^out/`
  (`:320-323`, `:336-339`). Measured: `Moore with State.lamp (not out…): … "missing":"Missing: State output."` [M: F]; the
  Required row is then the fix.
- **Hidden elsewhere.** `const UNREAD_ROLES: ReadonlySet<RoleId> = new Set<RoleId>(['accepting', 'stateOutput', 'transitionOutput']);`
  (`simRolesDraft.ts:57`), read by `shown` (`:90-91`) and `roleSwitch` (`:337`). Measured on the four demo profiles: the three
  hidden and `roleSwitch` `[null,null,null]` [M: A]. Its premise, «The roles nothing reads yet», is false since R-SIM-91/92.

### 3.2 S5 today

`runBag` (`simBridge.ts:137-143`): `for (const d of ROLE_CATALOG) if (d.key !== null && profile.modes[d.id].mode === 'off') delete bag[d.key];`.
`startRun` and `runSignature` read it (`:563`, `:643`). Probe D, verbatim: `SM Apply patch: {…"simTerminal":"C_Acc"…}`, `DFA Apply
patch / setButOff before: [{"simAccepting":"C_Acc","simProfile":"dfa"},"Set but off: Terminal."]`, `press b: b: t01 (q0 → q1) fired
| … Running; accepting=true; … Marking: q1`. Residue, not measured: the panel still passes the raw `roles.simGuard` to
`inputReason` and `stopReason` (`SimulationPanel.tsx:401`, `:404`, `:416`), the R-SIM-86 ticket for readers outside the run.

### 3.3 The engine readers

`isAccepting` (`netStep.ts:88-93`), `stateOutputOf` (`:100-104`: «a marked place with no output is left out»),
`transitionOutputOf` (`:110-112`). `CompiledNet.accepting` is `null` without the role (`netCompile.ts:582`), the output maps
too (`:585-588`), and a role `off` never reaches them (§3.2). So the faces can test the net, not the bag. Probe H: a
two-valued slot gives `["red","buzz"]`; a marked place without a value gives `[]`.

### 3.4 The faces

- **Status row** (`SimulationPanel.tsx:819-834`): dot, `<span className="sim-panel__status-text">{status}</span>`, then the
  Deadlock reason. `· accepting` goes between them, shown when `r.net.accepting` is a set and `isAccepting(r.net, σ)`.
  The row is `display: flex`, one line; the reason is the only shrinking item (`simulation-panel.scss:564-572`). A class
  `sim-panel__status-accepting` with the existing `--color-success` token, or none: a perceptual call.
- **Moore line**: a `div` with `sim-panel__hint sim-panel__hint--line sim-panel__hint--marking` right under the marking line
  (`:760-762`), from a pure `outputLine(state, net, lookup)` in `simBridge.ts` (`null` without the role). One marked place:
  `Output: red, buzz`; several (no `singleToken` check): `Output: s1 red; s2 green`; none: `Output: none`. Title: the line.
- **Mealy suffix**: `lastStepText`'s `fired` case (`simBridge.ts:1172-1173`) gets `, output <values>` when
  `net.transitionOutputs` is set and the transition has one; `lastStepTitle` (`:1222-1227`) gets `output: <values>`.
  The line is one row whatever its text (`simulation-panel.scss:504-510`); ESM's `Last step:` was cut at 264 px of text in
  262 (`models_2026_simulator_demo.md:277`), so the output of a long label will be cut. Fallback, if the visual check finds
  the output hidden on the fixture: `coin / unlock: t1 (…) fired`, the textbook «input/output» first.
- Enumeration outputs remain unmeasured (S4 §5.6). A string value that is an element id would print as the id.

### 3.5 The four presets: where and how

- `PANEL_PROFILE_IDS` gains `'dfa', 'nfa', 'moore', 'mealy'` in the order of `SYSTEM_PROFILE_IDS` (`simProfiles.ts:35-37`).
  It feeds `PANEL_PROFILES` (`SimulationPanel.tsx:76`), the Profile select (`:629`), `storedPreset` (`:278`), and the
  dialog's header select (`SimRolesModal.tsx:697`, `:731`). A closed select does not change size.
- The first-open picker is `KINDS` (`SimRolesModal.tsx:101-108`), `presets: ['stateMachine', 'extendedStateMachine',
  'flowchart']` for Control flow. Adding four chips of `height: 32px` in a column (`SimRolesModal.scss:1057-1066`) makes the
  card four rows longer: Question 1 keeps it as it is.

### 3.6 What «Checkable» means for each on a plain metamodel [M]

`requiredRoles` (probe A): the control-flow closure `node, transition, nextState, initial|initialMarking,
source|ownedTransitions`, then `trigger` and `accepting` (DFA, NFA), `stateOutput` (Moore), `transitionOutput` (Mealy); no
binding `incompatible` (`profileVerdict`). Constraints: DFA, Moore, Mealy `singleToken, noEpsilon, deterministic`; NFA
`singleToken`; none enforced. Measured: DFA on DemoDFA `Checkable after Apply`, `7 of 9` matched (B); Moore and Mealy
turnstiles `Checkable after Apply` (F); DFA on DemoPEST `Missing: Accepting.`, `Terminal` not matched by `/accept|final/` (G);
nondeterministic DFA still `Checkable` (E). NFA acceptance is per run path (S4 §4).

### 3.7 The four demo scenes, line by line (after Phase 2, Questions 1 and 2 as recommended)

| Scene, step | Today | After |
|---|---|---|
| every scene, `Configure…` picker (§2.1:77) | 3 Control flow chips, 1 Petri | same |
| §2.1 dialog (`:79-83`): `Checkable`, `7 of 10 roles matched`, Required 5, Optional 4 | as quoted | same; closed fold `3 derived · 11 not used` → `3 derived · 14 not used` [M: A]; header select 8 options when opened |
| §2.1 summary `State machine · Checkable`, run table, `Terminated` | as quoted | same; Profile select 8 options when opened; no `· accepting`, no `Output:` (no key, [M: G]) |
| §2.2 Petri dialog, Bound `4`, run to `Deadlock · ε: t2 false` | as quoted | fold `13 not used` → `16 not used`; the rest the same |
| §2.3 ESM dialog, `Data…`, run to the halt | as quoted | fold `3 derived · 8` → `3 derived · 11 not used`; the rest the same |
| §2.4 Flow B dialog, `Declare in Data…`, run to `Terminated` | as quoted | fold `2 derived · 9` → `2 derived · 12 not used`; the rest the same |

The script quotes none of the fold titles [R: `command grep -n 'not used' docs/demo/models_2026_simulator_demo.md`, no hit;
control `command grep -n 'roles matched'` hits `:79`, `:139`]. Its rule stands: a trunk commit to `SimulationPanel.tsx` or
`simBridge.ts` needs the readiness probes re-run (`:11-13`).

### 3.8 Example metamodels (built by the probe, to rebuild by console script for the visual check)

- **DemoDFA**, strings over {a, b} ending in b: `State` (`transitions` composition → `Transition`), `Initial` and
  `Accepting` extend `State`, `Transition` (`nextState` → `State`, `event` → `Symbol`), `Symbol`. Model: `q0 : Initial`,
  `q1 : Accepting`, `a`, `b : Symbol`; `t00 q0 -a-> q0`, `t01 q0 -b-> q1`, `t10 q1 -a-> q0`, `t11 q1 -b-> q1`.
- **DemoMoore**, the demo turnstile with `State.output : EString`: `locked : Initial` (`red`), `unlocked : State` (`green`);
  `t1 locked -coin-> unlocked`, `t2 unlocked -push-> locked`, `t3 locked -push-> locked`, `t4 unlocked -coin-> unlocked`.
- **DemoMealy**: the same with `Transition.output : EString`: `t1 unlock`, `t2 lock`, `t3 alarm`, `t4 refund`.

## 4. Phase 2 plan (one lane, `sim-outputs-faces`)

Ten files, above Rule 19's five: listed before the first edit. No critical-zone file (§3.1 of `CLAUDE.md`), no exported
interface changed but `RoleKey` (+3 literals, additive, as E2 did).

Commit 1, pure, red first:
1. `frontend/src/model/simulation/stcFromRoles.ts`: `simAccepting` in the node sort (R-SIM-91's open item); test
   `model/simulation/__tests__/events.test.ts`. Mutant: the key dropped.
2. `frontend/src/components/editor-v2/sim/simRoleStatus.ts`: `RoleKey` and `ROLE_SPECS` +3 (Accepting after Terminal;
   State output, Transition output at the end), `PANEL_PROFILE_IDS` +4, the comment at `:204-208`; test
   `sim/__tests__/simRoleStatus.test.ts` (`:252-255` rewritten, red by design).
3. `simRolesDraft.ts`: `UNREAD_ROLES` gone (Question 2), header `:12-17`; test `simRolesDraft.test.ts` (`:97-104`,
   `:243` rewritten). Mutant: the set kept.
4. `simBridge.ts`: `outputLine`, the Mealy suffix and title line; test `simBridge.test.ts`. Mutants: all places for the
   marked ones; the suffix on `halted`; the output read from `origin`.

Commit 2, faces: 5. `SimulationPanel.tsx` (the span, the Output line, the «twenty keys» comment at `:864`);
6. `simulation-panel.scss` (the span's class), only if the visual keeps a color.

Gates: typecheck at 14; vitest with the nine known import reds; build; `check:scripts`; mutation bench; the four scenes'
readiness probes on a port of its own, trace identical but the fold counts of §3.7; RC-23 checklist on DemoDFA, DemoMoore,
DemoMealy and the four scenes, light and dark. Closure: the R- row (R-SIM-93 timing, `UNREAD_ROLES`), the inbox entry.

**Timing.** No branch ahead of the trunk touches `sim/` or `model/simulation/` [M: `git rev-list --count c2560b69e..<b>`
and `git diff --name-only c2560b69e...<b>` over 33 `sim-*`, `scenes*`, `demo*` branches: 0 files each], so RC-22 check 1 passes. Launch
today; merge by 2026-09-30 evening; 2026-10-01 stays for the rehearsal on 3001.

## 5. Risks

1. The demo script's rule (`:11-13`): the lane touches both files it names, so the parity re-run is a gate, not an option.
2. The Mealy suffix may be clipped at the panel's width (§3.4): measured only at the visual check.
3. «Checkable» DFA or Moore does not mean a deterministic model (H7): say so if a preset is shown.
4. An initial state that accepts needs a class extending both, and the user picks both rows (H8).
5. Enumeration outputs and element-id values unmeasured (§3.4).
6. The raw `roles.simGuard` in the panel's reasons (§3.2) under DFA after SM: unmeasured.
7. RC-23: Alfonso's GO is mandatory until 2026-10-03, so the merge waits for it.

## 6. Questions

1. Keep the first-open picker without the four presets? Recommended: yes.
2. Drop `UNREAD_ROLES`? Recommended: yes.
3. Record the before-the-freeze timing as an amendment of R-SIM-93? Recommended: yes, on Alfonso's words of 2026-09-28 23:00.
4. A DFA or Moore scene in the demo? Recommended: no.

## 7. Probe

`frontend/scripts/smoke/_tmp_faces_probe.ts`, gitignored (`.gitignore:68`, `git check-ignore -v` exit 0), `npx tsx` from
`frontend/`, `EXIT=0`, log `/tmp/p0239_probe.log`, 91 lines (three are node's ExperimentalWarning). Readings, verbatim:

```
[A] PANEL_PROFILE_IDS: ["petri","flowchart","stateMachine","extendedStateMachine"]
[A] ROLE_SPECS has simAccepting / simStateOutput / simTransitionOutput: [false,false,false]
[A] control: ROLE_SPECS has simActivityFinal / simTerminal: [true,true]
[A] roleSections(dfa, {}) required / optional / derived / off count: [[["node"],["initial"],["accepting"],["transition"],["ownedTransitions","source"],["nextState"],["trigger"]],["eventIdentifier"],["initialMarking","bound","event"],13]
[A] roleSections(moore, {}) required / optional / derived / off count: [[["node"],["initial"],["transition"],["ownedTransitions","source"],["nextState"],["trigger"],["stateOutput"]],["eventIdentifier"],["initialMarking","bound","event"],13]
[A] demo profile stateMachine: fold title today / roles hidden (D8) / roleSwitch …: ["3 derived · 11 not used",["accepting","stateOutput","transitionOutput"],[null,null,null]]
[A] demo profile extendedStateMachine: …: ["3 derived · 8 not used",[…],[null,null,null]]
[A] demo profile flowchart: …: ["2 derived · 9 not used",[…],[null,null,null]]
[A] demo profile petri: …: ["13 not used",[…],[null,null,null]]
[B] DFA Apply patch: {"simNode":"C_State","simInitial":"C_Init","simAccepting":"C_Acc","simTransition":"C_Trans","simOwnedTransitions":"R_transitions","simNextState":"R_next","simTrigger":"R_event","simProfile":"dfa"}
[B] matchLine: {"matched":7,"total":9}
[B] Reset: Running; accepting=false; moore=n/a; inputs on: a,b; Marking: q0
[B] press b: b: t01 (q0 → q1) fired | mealy=n/a | Running; accepting=true; moore=n/a; inputs on: a,b; Marking: q1
[B] press a: a: t10 (q1 → q0) fired | mealy=n/a | Running; accepting=false; moore=n/a; inputs on: a,b; Marking: q0
[C] DFA summary (Good for Accepting): {"status":"DFA · Not checkable after Apply","missing":"Missing: Accepting.","choose":null}
[C] after picking Good in the row: checkability: {"status":"checkable","missing":[]}
[D] runBag has simTerminal / simAccepting: [false,true]
[D] control: netStcFromRoles(raw).terminal / (runBag).terminal: ["C_Acc",null]
[D] press b: b: t01 (q0 → q1) fired | mealy=n/a | Running; accepting=true; moore=n/a; inputs on: a,b; Marking: q1
[E] DFA with q0 -a-> q0 | q1 and q0 -ε-> q1: summary: DFA · Checkable after Apply
[E] press a: null PENDING t00,tx | mealy=n/a | Running; accepting=false; moore=n/a; inputs on: ε,a,b; Marking: q0
[E] startRun: {"kind":"refused","reason":"The simulation roles are incomplete."}
[F] press coin: coin: t1 (locked → unlocked) fired | mealy=n/a | Running; accepting=n/a; moore=[["unlocked",["green"]]]; …
[F] press coin: coin: t1 (locked → unlocked) fired | mealy=["unlock"] | Running; accepting=n/a; moore=n/a; …
[G] DemoPEST SM Apply patch has none of the three keys: true
[G] DemoPEST after SM, dfa picked: summary: {"status":"DFA · Not checkable after Apply","missing":"Missing: Accepting.","proposals":[],"setButOff":"Set but off: Terminal."}
[G] overlapVerdict simAccepting on Transition (ROLE_SORTS): null
[G] control: simTerminal on Transition: {"overlap":{"classId":"C_Trans","sorts":["node","transition"]},"refuse":true}
[H] InitialAccepting: choose line: Choose Initial: 2 candidates (Initial, InitialAccepting); Accepting: 2 candidates (Accepting, InitialAccepting).
[H] Reset: Running; accepting=true; moore=n/a; inputs on: a,b; Marking: q0
[H] press coin: coin: t1 (locked → unlocked) fired | mealy=n/a | Running; accepting=n/a; moore=[]; …
```

Not covered: the panel's DOM (no dev server), the demo exports (`~/jjodel-demo-exports/*.json` are project files, not
lookups: DemoPEST is rebuilt from the script's §2.1), an enumeration output, a fused transition's output.
