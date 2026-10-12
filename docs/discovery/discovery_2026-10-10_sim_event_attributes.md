# Discovery: event attributes read by guards and actions

Prompt-ID: P-2026-10-10-1630 · prompt `docs/prompts/claude_2026-10-10_1630_prompt_sim_event_attributes_discovery.md`
Session: 8e8ac895-709d-4d71-8f57-fd4f7dc579b6 · tree `~/jjodel-w-eventattrs`, branch `sim-event-attrs`, HEAD `f13f6f489` at start, probe commit `413f0096d`
Model: Anthropic Claude Opus 5.5 · Phase 1, read-only on `frontend/src/`

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the real files.
Tags: **[measured]** a run in this phase (node probe `frontend/scripts/probe/sim-event-attrs.ts`, browser probe
`frontend/scripts/probe/sim-event-attrs-browser.ts`, outputs under `docs/discovery/assets/sim-event-attrs/`, on
`413f0096d`); **[read]** a file read at `f13f6f489`.

## 0. Answer in brief

- **`event.amount` works today** in guards, arc actions, entry and exit on a triggered arc, in the node bench and in
  the app [measured, §1]: the memo's vending machine gives credit 10, 30, 80 with one arc and
  `model.[credit] := model.[credit] + event.amount`. The premise «events carry no payload» is wrong; readings (a) to
  (e) hold. The scope is checks, not a new root.
- **Where the reading is wrong or incomplete:**
  1. An unset attribute makes **no guard defect** (memo P4): `event.amount > 15` is **false** (null compares below
     every number), the arc is discarded. Only an action halts. In the app an unset mandatory `EInt` reads **0** and an
     attribute with a declared default reads it, never null [measured, browser].
  2. Every guard and action compile defect already reaches the **problems registry** (`simCheckToProblems.ts:137-147`,
     R-SIM-70), against the memo's «never».
  3. A merged transition takes its trigger from the **choice edge only**; a trigger on a fork's out edge is dropped
     silently [measured]. No system preset has Trigger with Fork/Join, or Petri with Trigger: Custom only.
  4. `event.amount := 1` is already a parse defect; `event.[x] := 1` **writes σ of the event instance** when `x` is
     declared on its metaclass [measured], a form the memo does not name and tests use.
- **Compile time:** `actionDefectsOf` knows transition, triggers and site role; `guardDefectsOf` knows the site, and
  `NetTransition.guardSites`/`.triggers` decide P3; P4 needs `stc.event`, which `startRun` has and does not pass (§3).
  Core types, parser, subset checker, autocomplete: nothing needed (§4).
- **Recommendation:** one slice, two Reset checks in `stcChecks.ts` (P3, P4) called from `guardDefectsOf` and
  `actionDefectsOf`, two additive reason literals, one Reset warning for unset reads on the run warning line, the
  spec §8 row; the run unchanged. No shipped model reads `event` (§6), so parity holds by construction.
- **Guard errors (item 9, map only):** a halt rule would also halt every run whose guard reads an input not yet
  given, since `runStatus` relies on that defect (§9.4).

Decisions awaiting Alfonso (§12):

1. Name of the root. Recommended: `event`, already reserved, bound, used by R-SIM-121 and tests.
2. Entry and exit see `event`. Recommended: no, as P3, a Reset defect only; the break is nil (§6).
3. Unset attribute. Recommended: a Reset warning; guards and actions read as today; no refusal.
4. Problems registry. Recommended: P3 and P4 defects go there like every compile defect (R-SIM-70).
5. `event.[x]` (σ of the event instance). Recommended: keep it, outside this slice.

Open questions (§11):

1. P3 on an ε arc guard that only tests `event == null`? Recommended: a defect too (always true there).
2. A trigger on a non-choice edge of a fork or join? Recommended: a ticket, not this slice.

## Hypotheses under test

| # | Hypothesis (prompt and memo) | Verdict |
|---|---|---|
| H1 | (a) `event` is a root of the guard and action context, reserved in one list | **holds** [read] `stateReserved.ts:18`, `guardContext.ts:173` |
| H2 | (b) `buildGuardContext` binds `event` to the instance's handle, `null` on ε, returns `null` without a handle | **holds** [read] `guardContext.ts:159-176`; [measured] §1, cells 1d, 2 |
| H3 | (c) both oracles pass the step's event to every action site, entry and exit included | **holds** [read] `simBridge.ts:322`, `actionEvaluator.ts:235`, `netStep.ts:290-291`; [measured] cell 1c |
| H4 | (d) `event` is refused in equations, outputs and watches, and step-dependent in `dependsOnStep` and `folds` | **holds** [read] §2.4 |
| H5 | (e) R-SIM-16 already ratified attributes of an event instance; R-SIM-121 assumes `event.digit` | **holds** [read] `docs/decisions.md:1670-1671`, `:2599-2600` |
| H6 | memo premise: «events carry no payload» | **falsified** [measured] §1, cells 1a, 1b |
| H7 | memo P4: an unset attribute becomes a guard or action defect | **partly**: actions yes, guards no (false) [measured] §1, cell 1g, §5 |
| H8 | memo P3: a P3 defect never reaches the problems registry | **falsified as a description of today's pipeline** [read] §3.5 |
| H9 | memo P5: assigning `event.x` is (to be) a compile defect | **holds already** for `event.f :=`; `event.[x] :=` is a different, working form [measured] cell 1h |
| H10 | memo P3: «has a trigger» is decidable on a merged transition | **holds** (`NetTransition.triggers`), with the choice-edge rule [measured] cell 1e |
| H11 | the probe's stand-in and the app read an event attribute the same way | **falsified**: four differences [measured] §1.3 |

## 1. Today's behaviour (item 1)

### 1.1 The bench

The node probe builds the model as a raw idlookup in the D-layer shape the bridge reads (`collectModelObjectIds`,
`makeNetModelView`, `objectSlotValues`).

- **Metamodel:**
  - `State` (`entry`, `exit`: Action `[0..*]`; `transitions` containment), with subclasses `Initial`, `Final`, `Fork`.
  - `Transition` (`guard`: Expression; `effect`: Action `[0..*]`; `event`: EString, for item 2; `nextState`;
    `trigger -> Coin [0..*]`).
  - `Coin` (`amount: EInt`, `hot: EBoolean`, `size: Size` with literals {S, M, L}, `label: EString`, `home -> State`,
    `tags: EInt [0..*]`, `need: EInt [1..1]`), and `BigCoin extends Coin` (`bonus: EInt`).
  - The Petri classes `Place` (`init`), `PTrans` (`guard`, `act`, `trigger -> Coin [0..*]`) and `Arc`.
- **Instances:** `coin10`, `coin20`, `coin50` (a BigCoin), and `coinX`, whose slots exist with `values: []`. That is
  the shape the M2 edit leaves on existing instances (`classes.ts:749-758`, and the browser probe's `stop`).
- **Declared state:** the model declares `credit`, `last`, `seen` (range 0..200), and the metaclass Coin declares
  `x` (0..5).
- **Roles:** the Extended state machine preset, `simProfile` written as `encodeProfile(systemProfile(...))`, the
  value Apply writes (`simRoleStatus.ts:622`). Cells 1e (fork) and 1f (Petri) leave `simProfile` unset, so the
  profile is the Custom one inferred from the keys (`profileCodec.ts:145-196`). The reason is under 1e.
- **Run and readings:** every run starts with `startRun` and every press goes through `pressInput`. A guard's
  outcome is read from `run.guards`, the oracle the core calls. The JjEL record is the stand-in of `sim-verif-bench.ts`
  (`recordOf`, copied unchanged), the only part that is not the app's. §1.3 compares it with the app.

Output: `docs/discovery/assets/sim-event-attrs/node-probe-run.txt`. The line numbers below refer to that file
(`run:N`). The run is ALL GREEN with exit 0. Its positive controls are a known fire (`run:11`), a known discard
(`run:12`) and the credit 80 (`run:17`).

### 1.2 Cells [measured, node, stand-in record]

| Cell | Text | Input | Reading | run |
|---|---|---|---|---|
| guard, triggered arc | `event.amount > 15` | coin10 / coin20 / coin50 / coinX | oracle `false` / `true` / `true` / `false`; Last step `coin10: discarded, tIns guard false`, `coin20: tIns (idle → idle) fired`; Reset defects none | 2-10 |
| arc action, triggered arc | `model.[credit] := model.[credit] + event.amount` | coin10, coin20, coin50 | credit 10, 30, **80** | 14-17 |
| same, unset | same | coinX | `coinX: tIns (idle → idle) halted the run`; halt `Halted: the transition action of tIns failed: '…': the value is null, not a boolean, a number or a string.` (`action-defect`) | 18 |
| entry and exit, triggered arc | exit of idle `model.[seen] := event.amount`, entry of ready `model.[last] := event.amount` | coin20 on `tPay` idle → ready | fired; `last` 20, `seen` 20 | 20 |
| entry and exit, ε arc | same | ε on `tGo` | `ε: tGo (idle → ready) halted the run`; `Halted: the exit action of idle failed: '…': JjelEvaluationError: Cannot access property 'amount' of null.` | 22 |
| entry depends on the path | entry of ready `model.[last] := if event == null then 0 else event.amount` | coin20 / ε | `last` 20 / 0, both fire | 23-24 |
| guard, ε arc | `event.amount > 0` | ε | oracle `defect exception: JjelEvaluationError: Cannot access property 'amount' of null`; `ε: nothing to fire, tGo defect, Cannot access property 'amount' of null`; Deadlock; Reset defects none | 25-27 |
| action, ε arc | `model.[credit] := event.amount` | ε | halted, `action-defect`, same message | 28-29 |
| guard, ε arc | `event == null` | ε | `true` | 30 |
| fork, triggered choice edge | e1 idle → f triggered by all coins; guard of e2 `event.amount > 15`; effect of e2 `model.[last] := event.amount` | coin10 / coin20 | one transition `f`, origins e1, f, e2, e3, triggers the four coins, guard sites e1, e2, e3; `coin10: discarded, e2 guard false`; `coin20: f (idle → a, bb) fired`, `last` 20 | 31-35 |
| fork, trigger on an out edge | e1 untriggered; e2 triggered, guard `event.amount > 15` | coin20 / ε | fused transition triggers `[]`; `coin20: discarded, no transition accepted it`; `ε: nothing to fire, e2 defect, Cannot access property 'amount' of null` | 36-39 |
| fork under the ESM preset | same model, ESM preset | — | the Fork node is a place (`simFork` off, R-SIM-78) | 40 |
| Petri transition with a trigger | t1 triggered by the coins, guard `event.amount > 15`, action `model.[credit] := model.[credit] + event.amount` | coin10 / coin20 | `coin10: discarded, t1 guard false`; `coin20: t1 (p1 → p2) fired`, credit 20 | 41-45 |
| presets | — | — | Petri: trigger off, action off; ESM: fork off, join off; Flowchart: fork on, trigger off | 46-48 |
| attribute types | `event.<f>` | each coin | see 1.3 | 49-52 |
| unset in a guard | `event.amount > 15` / `== null` / `+ 1 > 0` / `event.need > 0` | coinX | `false` / `true` / `false` / `false`, never a defect | 53-56 |
| subclass attribute | `event.bonus > 0` | coin50 / coin10 | `true` / `defect absent-identifier: 'bonus' does not exist`; Reset defects none | 57-59 |
| subset checker | `event.amount > 15`, `event.size == "M"`, `event.tags.size > 0`, … | — | no diagnostic; `event != null and event.amount > 15` is `E-EAGER` | 60-65 |
| assign a feature | `event.amount := 1` | coin20 | parse error `1:14 The target of an action must end in '.[attribute]'`; Reset line `1 defect: tIns action (parse error 1:14 …)`; the press halts `action-defect` | 66-69 |
| assign σ of the event | `event.[x] := 1` (`x` declared on Coin) | coin20 | **fires**; σ of coin20 `{x: 1}`; Reset defects none | 70-72 |
| same, global name | `event.[credit] := 1` | coin20 | halted `undeclared`: `'credit' is not declared on coin20.`; Reset defects none | 73-74 |
| same, no declaration | `event.[nope] := 1` | coin20 | Reset `1 defect: tIns action (undeclared 'nope').`; press halts `undeclared` | 75-76 |

A merged transition with a trigger, and a Petri transition with a trigger, can be reached only under a Custom
profile. No system preset has both roles on (`simProfiles.ts:140-169`, measured at `run:46-48`). Under the ESM preset
`runBag` drops `simFork` (`simBridge.ts:182-189`), so the fork node is compiled as a place (`run:40`).

### 1.3 The stand-in and the app's `buildEvalContext` [read, then measured]

They do not read event attributes the same way.

- **The stand-in** copies the raw values (`vals[0] ?? null`, `sim-event-attrs.ts` `recordOf`).
- **`buildEvalContext`** reads an attribute through the L getter (`eval.ts:686-697`) and fills an empty single slot
  with `emptyAttributeDefault` (`eval.ts:726-790`). The order is: the declared default; then the canonical default
  when `lowerBound >= 1` (`if (isNum)  return 0;`); then `null`. An enumeration literal is collapsed to its name
  (`eval.ts:628-645`).

The browser check (`lane-run probe … --port 3097`) measured both on the same idlookup. It ran on the ESM demo
fixture, with nine features added to `Event` through the L API: `coin` has every slot set, `push` some, and `stop`
has none. Output: `assets/sim-event-attrs/browser-probe-run.txt` and `browser-probe-out.json`. ALL GREEN, exit 0, with
two positive controls: `coin.amount` reads 50, and pressing coin adds 50 to `credit`.

| Read | Raw DValue | App (`buildEvalContext`) | Stand-in |
|---|---|---|---|
| `amount` set (EInt) | `[50]` | `50` | `50` |
| `amount` unset, lower bound 0 | `[]` | `null` | `null` |
| `need` unset, `[1..1]` | `[]` | **`0`** | `null` |
| `dflt` unset, default 7 | `[]` (default stored as `[7]` on the attribute) | **`7`** | `null` |
| `text: EInt` written as `"50"` | `["50"]` | **`50`** | `"50"` |
| `size` (enum) | `["Pointer…_128"]` (literal pointer) | **`"L"`** | the pointer string |
| `home` (reference) | `["Pointer…_33"]` | `<locked>` | `<locked>` |
| `tags` `[0..*]` | `[1,2]` / `[]` | `[1,2]` / `[]` | `[1,2]` / `[]` |
| `hot`, `label` | `[true]`, `["fifty"]` | `true`, `"fifty"` | `true`, `"fifty"` |

The probe printed this line:

```
MEAS  app and stand-in differ on  ["coin.size: app \"L\", stand-in \"Pointer1791643355704_USER_128\"","coin.dflt: app 7, stand-in null","coin.text: app 50, stand-in \"50\"","push.size: app \"M\", stand-in \"Pointer1791643355704_USER_127\"","push.need: app 0, stand-in null","push.dflt: app 7, stand-in null","stop.need: app 0, stand-in null","stop.dflt: app 7, stand-in null"]
```

The app also read the event in the run's own guard context, the frozen snapshot that `startRun` builds with
`buildEvalContext`. The readings were `event.size == "L"` → `true`, `event.need` → `0` on `stop`, `event.amount + 1`
→ `null` on `stop`, and `guard event.amount > 15` → `false` on `stop` (`browser-probe-run.txt`).

What this changes for §1.2: the node cells of the enumeration, the default, the mandatory attribute and the text int
show the stand-in's values. In the app they read as the table says. The other cells read the same in both.
`browser-probe-run.txt` logs one console error, `init_dash`. It appears on every run of the page and was not
investigated.

## 2. Name resolution (item 2, memo question 1)

### 2.1 The reserved list

`frontend/src/jjel/stateReserved.ts:18` [read]:

```ts
    roots: Object.freeze(['self', 'event', 'model', 'node']) as readonly string[],
```

It is read by the subset checker (`subsetChecker.ts:57` `export const GUARD_ROOTS: readonly string[] = STATE_RESERVED.roots;`),
by `checkBinder` (`subsetChecker.ts:249-252`, E-SHADOW on a binder named like a root), and by `simStateUsage.ts:138`.
`event` is not a lexer keyword. The keyword table `src/jjel/types/tokens.ts:108-127` has no `event`: `command grep -c event`
over those lines gives 0, and the same command finds `if`, `then`, … on lines 109-112. The lexer lowercases only for
the keyword lookup (`lexer.ts:564-567`).

### 2.2 Bare identifiers do not resolve against `self`

`evaluator.ts:218-227` [read]:

```ts
    private evaluateIdentifier(expr: IdentifierExpr, ctx: EvaluationContext): JjelValue {
        // Check for builtins first
        if (ctx.hasBuiltin(expr.name)) {
            return ctx.getBuiltin(expr.name)!;
        }

        // Check context variables
        if (ctx.has(expr.name)) {
            return ctx.get(expr.name)!;
        }
```

Builtins are absent on path B (`guardEvaluator.ts:14-19`). The roots sit in a child scope above the globals
(`guardContext.ts:146-151`, `:173` `snapshot.base.child({ self, event, model: snapshot.model })`). There is no
fallback to `self`'s features [measured]:

- `nextState` (a feature of the arc) is `defect absent-identifier: 'nextState' does not exist` (`run:80`).
- `amount` (a feature of the event) gives the same defect (`run:81`).

### 2.3 A feature or an instance named `event`

With `Transition.event = "arc-feature"` [measured]:

- On a triggered arc with coin20, `event` → `<coin20>` and `self.event` → `"arc-feature"` (`run:78`).
- On an ε arc, `event` → `null` and `self.event` → `"arc-feature"` (`run:79`).

With an instance renamed `event` (the record binds unique names, `eval.ts:372`; the stand-in does the same), `event`
on the ε arc is `null` and on coin20 `<coin20>` (`run:82-83`). The root wins both times, and the feature stays
reachable as `self.event`.

### 2.4 The refusals of (d) [read]

- `derivedEvaluator.ts:450-457`: `if (e.type === 'Identifier' && e.name === 'event') event = true;` …
  `defect('event', 'the equation reads event');`
- `boardOutputs.ts:112-118`: `if (event) return defective(text, 'event', 'reads event', 'the output reads event, which is null after a step: an output is a function of σ alone');`
- `watchEvaluator.ts:53`: `output: compileOutput(watch.text, scope)`, the same check.
- `actionEvaluator.ts:140-147` (`dependsOnStep`) and `stcChecks.ts:96-104` (`folds`) treat `Identifier 'event'` as
  step-dependent.

### 2.5 Autocomplete

The JjEL autocompletion (`src/jjel/autocomplete/`) is imported outside its own folder only by
`src/components/Jodie/ChatInput.tsx`. The search was `command grep -rln "getJjelIdentifierSuggestions\|jjel/autocomplete\|getJjelSuggestions\|JjelAutocomplete" src | command grep -v __tests__`,
exit 0, and its hits include the module's own files, which is the positive control. The module offers `classes`,
`attributes`, `references`, `packages`, `enumerations`, `instances`, `data` and `node`, plus the class names
(`identifier.ts:26-43`), and no `self`, `event` or `model`. No editor of an `Expression` or `Action` value uses it, so
it offers nothing for `event` or `event.f`.

## 3. What compile time knows (item 3, memo question 2)

### 3.1 The trigger and its declared type

- `netCompile.ts:128-136` `withDerivedEventRole` [read]: «`simEvent` becomes the declared type of the `simTrigger`
  reference, read from the raw `lookup` at every call and never stored».
- `runBag` (`simBridge.ts:182-189`) applies it on every read of the bag.
- `compileNet` (`netCompile.ts:522-523`) [read]:

  ```ts
      const hasEventRole = !!(stc.event && stc.trigger);
      const triggersOf = (id: string) => (hasEventRole ? view.references(id, stc.trigger as string) : []);
  ```

- `CompiledNet` keeps `hasEventRole: boolean` (`netTypes.ts:262`) and `NetTransition.triggers` (`netTypes.ts:220-221`,
  «Event instance ids; `[]`: accepted by ε only»). It does not keep the event class.
- `startRun` has the class: `stc` from `netStcFromRoles(bag)` with `stc.event` (`simBridge.ts:612-616`). Nothing
  downstream of it receives the class.

### 3.2 Guards

- `compileGuards` (`simBridge.ts:298-309`) is keyed by **site element**: `out.set(site, guardTexts(lookup, site, features).map(text => compileGuard(text)))`.
- `guardDefectsOf` (`simBridge.ts:415-429`) calls `checkGuard(g.expr, element, scope)`.
- `checkGuard` (`stcChecks.ts:198`) receives the site id and `StcScope` (`snapshot`, `net: Pick<CompiledNet, 'attributes' | 'declared' | 'places'>`, `nameOf`; `stcChecks.ts:56-61`).
- So the guard check knows the arc but not the transition, its triggers or the event class. All three are derivable:
  the transitions whose `guardSites` include the site, and their `triggers`.

There is one subtlety: a guard site can belong to several transitions. A fork with in edges e1 and e1b fuses `f#e1`
and `f#e1b`, and both carry every out edge as a guard site (`netCompile.ts:357-361`). Their triggers can differ
(`triggersOf(e.id)` of each in edge). So «has a trigger» is a property of (site, transition), and P3 on a guard site is
a defect when **some** transition carrying it has `triggers.length === 0`.

### 3.3 Actions

`actionDefectsOf` (`simBridge.ts:455-530`) iterates `for (const t of net.transitions)` and `for (const site of t.actionSites)`.
It knows the transition with its `triggers`, and `site.role` ∈ {`exit`, `transition`, `entry`}
(`netTypes.ts:200-203`). It reports a site once (`judged`, `simBridge.ts:459-463`), at its first transition. For P3:

- An entry or exit site is a defect whatever the transition.
- A `transition` site is a defect when some transition carrying it is untriggered, as for guards. A dedicated pass is
  needed, because the first-transition gate would miss the second fused transition.

### 3.4 Merged transitions (R-SIM-31(3))

Origins are recorded in `NetTransition.origin` (`netTypes.ts:213`), e.g. `["e1","f","e2","e3"]` (`run:31`).

- **Triggers:** fork, from the in edge, `triggersOf(e.id)` (`netCompile.ts:360-361`). Join, from the out edge
  (`:367-368`). A node that is both, the union of every edge (`:371-372`).
- **«Has a trigger»:** decidable, `t.triggers.length > 0`.
- **Silent drop** [measured]: a trigger on a fork's out edge is dropped silently. The transition is ε (`run:36`), the
  coin is still in the alphabet (`run:37`), and pressing it gives `discarded, no transition accepted it` (`run:38`).
  That is a defect the compiler does not report today (question 2).

### 3.5 Where the checks go, with their literals (proposal)

- **P3 (no `event` where no trigger is set, and in entry and exit).**
  - **Where.** A new exported function in `stcChecks.ts`, `checkEventRead(expr): boolean`, reusing the module's `walk`
    and true when an unbound `Identifier 'event'` occurs. It is called from `guardDefectsOf`, for a site that some
    untriggered transition carries, and from a new pass in `actionDefectsOf`, for entry and exit sites and for
    untriggered transition sites. It is a separate function, not a branch inside `checkGuard`, so
    `stcChecks.test.ts:77,104` (`event.[coins] > 0` on the untriggered `TPx`) keep their expectations.
  - **Literal.** `CompileDefect.reason` gains **`'event'`**, additive, rule 11 as R-SIM-70 used it.
  - **Proposed wording.**
    - detail: `reads event, but <arc> has no trigger: event is null in its step`
    - entry/exit detail: `an <entry|exit> action cannot read event: what a node does on <entry|exit> does not depend on the path`
    - short: `reads event, no trigger` / `reads event in <entry|exit>`
- **P4 (the feature is looked up on the trigger's declared type, no downcast).**
  - **Scope.** `StcScope` gains the optional `event?: { readonly name: string; readonly features: ReadonlySet<string> }`
    (rule 11, optional property). `startRun` computes it from `stc.event`: every `DAttribute` and `DReference` name of
    the class and its ancestors (`extends`, transitively, the walk `isKindOf.ts` uses), plus the handle's own keys
    `name`, `id`, `instanceOf`, `instanceof`, `parent` (`eval.ts:570-583`, `:704-706`).
  - **Check.** `checkEventFeature(expr, scope)` flags `MemberAccess` / `NullSafeMemberAccess` whose object is
    `Identifier 'event'` and whose property is not in the set.
  - **Literal.** A new literal **`'event-feature'`**. Reusing `'undeclared'` is wrong: `undeclaredGlobals`
    (`simBridge.ts:1064-1074`) turns every `undeclared '<x>'` short into the «Declare in State…» offer (R-SIM-94), so
    `amount` would be offered as a global.
  - **Proposed wording.** detail `'bonus' is not a feature of Coin, the type of the trigger`, short
    `event.bonus: not on Coin`. Measured today: `event.bonus` reads 7 on a BigCoin and is
    `absent-identifier` on a Coin (`run:58-59`), with no Reset defect (`run:57`).
- **Both** flow to the defects line (R-SIM-61) and, through `simCheckEntries`, to the problems registry
  (`simCheckToProblems.ts:137-147`):

  ```ts
      for (const d of compileDefects) {
          if (d.role === 'declaration') continue;
  ```

  The memo says «never in the problems registry», which contradicts R-SIM-70 as extended
  (`docs/decisions.md:2156-2157`). That is decision 4.

## 4. Core types (item 4, memo question 3)

Nothing beyond the checks of §3 is needed.

- **`Expression` and `Action`.** Their value check is syntactic: `parseExpressionStrict` / `parseAction` in
  `ConformanceValidator.ts:250-255`. `event.amount > 15` parses (`run:60`, no diagnostic). `event.amount := 1` fails
  `parseAction` (`run:66`), so conformance already flags it as a `type_mismatch` warning (R-SIM-44). The types have no
  root list and need none.
- **Parser.** `event.f` is `Identifier` then `MemberAccess` (§8). No new production.
- **Evaluator.** No change. The context already binds the root.
- **Subset checker.** It has no rule on `event` (`subsetChecker.ts:270-274` flags `node` and `data` only), and none
  is needed. P3 and P4 need the site, which the checker does not have (it is syntactic, `subsetChecker.ts:26-31`).
- **Autocomplete.** Nothing (§2.5).
- **Trace (memo P7).** `SimTraceStep` records the event id only (`simRunState.ts:70-78`), so the values follow from
  the frozen M. Showing the read attributes is optional and outside the slice.

## 5. Unset attributes (item 5, memo open choice 3)

### 5.1 Today [measured]

- **Guard: never a defect.**
  - `null > 15` is `false` (`compare`, `evaluator.ts:1123-1126`: `if (a === null) return -1;`), and `null + 1` is
    `null` (`evaluator.ts:295-305`: `return null;`).
  - So `event.amount > 15` is false (`run:53`), `event.amount + 1 > 0` false (`run:55`), and `event.amount == null`
    true (`run:54`). The press is `discarded, tIns guard false` (`run:10`).
- **Action: a halt.** `model.[credit] := model.[credit] + event.amount` on coinX halts with
  `the value is null, not a boolean, a number or a string` (`run:18`; `actionEvaluator.ts:217`).
- **In the app, «unset» is narrower than an empty slot.** A mandatory `EInt` reads 0 and an attribute with a default
  reads its default (§1.3). A run sees null only for an optional attribute without a default, or for a value the
  getter cannot coerce.

### 5.2 Where a warning lives

R-SIM-61 lists defects only. The panel's run warning line (R-SIM-37, R-SIM-65) is `runWarning`
(`SimulationPanel.tsx:329`, set at `:629-639`, drawn at `:1197`):

```tsx
                        {runWarning && <div className="sim-panel__hint sim-panel__hint--warning sim-panel__hint--line" title={runWarning}>{runWarning}</div>}
```

Today it carries the role overlap only, and with the event role an overlap refuses the run instead (R-SIM-37,
`SimulationPanel.tsx:613-625`). So on a model with events the line is always empty. It is the free channel. Proposal:

- `RunStart` gains `runWarnings?: readonly string[]` (optional, rule 11), filled in `startRun`.
- The rule: for every `event.f` read in a guard or action of a triggered transition, and every trigger instance `e` of
  that transition, if the snapshot's handle of `e` has `f === null`, list `e (f)`.
- The panel joins it to the overlap text on the same line, with the full list in the `title`.
- It reads the snapshot, so it sees what the run sees: `need` 0 and `dflt` 7 are not unset.

Draft text (one line, R-SIM-63 clamp; full list in the title):

```
2 events leave a read attribute unset: coinX (amount), stop (amount, hot). A guard reads it as null; an action that uses it halts.
```

## 6. Usage census (item 6)

Every search below is listed with its exit status. Positive controls: `simGuard` found across the simulation sources;
the DValue dump of the fixtures found every guard and action text.

- **Shipped models: zero JjEL uses of `event`.**
  - **The four demo scenes:**
    - PEST: 5 triggered arcs, no guard and no action feature.
    - Petri: one guard `p3.[tokens] < 1`.
    - ESM: guard `model.[paid]` on tp; actions `model.[coins] := model.[coins] + 1` on tc and `model.[coins] := 0` on
      tp; three entry slots, all empty; no exit.
    - FlowB: guards `model.[count] < 2` and `model.[count] >= 2`, action `model.[count] := model.[count] + 1`.
  - **The other fixtures:** `jjscript-m1-esm.jjodel` and `tree-crossing.jjodel` are metamodel only.
  - **Bags:** every `_state` in the fixtures is `{}` (roles and declarations are added at demo time).
  - **Docs:** `docs/demo/models_2026_simulator_demo.md` has no JjEL `event`. Its 4 backticked `event` are the
    reference `Transition.event` (lines 94, 99, 117, 239). `frontend/public/docs/help` has no `event`.
  - **Other `.jjodel` files:** only these six exist (`find`, excluding node_modules and .git).
- **Probe scripts** (they add texts at run time, not models): `sim-verif-bench.ts:174` watch `event == null`;
  `io-board-outputs.ts:229` outputs `event.name` and `model.[coins] + event` (both expected to be flagged).
- **Tests** (`src/model/simulation/__tests__`, `src/components/editor-v2/sim/__tests__`; 469 lines with the word, all
  reviewed). JjEL uses:
  - **Guards on a triggered arc:** `self.trigger == event` (`sim/simBridge.test.ts:91`, `sim/simScenarios.test.ts:63`;
    also `codegen/__tests__/stcAccess.test.ts:75,290,301`).
  - **Guard unit tests without a net:** `guardEvaluator.test.ts:140-142` (`event == null`,
    `event == go and event.name == "go"`); `subsetChecker.test.ts:25,60,192`.
  - **σ of the event:**
    - `event.[coins] > 0` on the untriggered site `TPx` (`stcChecks.test.ts:77,104`);
    - `event.[coins] := 1` on the triggered `tc` (`stcChecks.test.ts:79,119,124`; `sim/simBridge.test.ts:1365`);
    - `event.[coins] := self` (`stcChecks.test.ts:146`);
    - `event.[n] := 1` on an untriggered site (`actionEvaluator.test.ts:145`); `self.[n] := if event == null then 1 else 2`
      (`actionEvaluator.test.ts:184`).
  - **Refusal tests:** equations, outputs, watches (`derivedEvaluator.test.ts:167`, `watchEvaluator.test.ts:83`,
    `boardOutputs.test.ts:99-100`, `sim/simBridge.test.ts:1136`).
  - **Elsewhere:** `model/conformance/__tests__/ConformanceValidator.test.ts:766`, `jjel/__tests__/parser.test.ts:739`.
- **Entry and exit actions reading `event`: none** in shipped models or tests. So P3 on entry and exit breaks nothing.
  P3 on untriggered arcs touches only unit tests that do not go through `startRun`, plus `stcChecks.test.ts:77,104` if
  the check were put inside `checkGuard`, which §3.5 avoids.

## 7. nuXmv row (item 7, memo P6)

There is no `.smv` exporter in the code. `command grep -rln "MODULE main\|FROZENVAR\|\.smv" src` finds only comments
(`simBoardClock.ts:7`, `simBoardEditorLayout.ts:272`, `boardOutputs.ts:30`, `subsetChecker.ts:6`). The event `IVAR`
appears only in the board's captions (`simBoard.ts:527-548`, `event = …`, `event ∈ {…}`). Draft row for spec §8:

| This spec | nuXmv | Note |
|---|---|---|
| attribute `a` of the current event (`event.a`, R-SIM-144) | `DEFINE event_a := case event = coin10 : 10; event = coin20 : 20; event = coin50 : 50; TRUE : 10; esac;` | one DEFINE per attribute of the trigger's declared type that a guard or an action reads; the cases range over the values of the event `IVAR`, the constants come from the frozen M; the closing `TRUE` repeats the first case and is never read where P3 holds, since a read sits only on an arc whose trigger is set; integer and boolean attributes map directly, enumeration literals and strings to symbolic constants prefixed by their type, a reference to the element's constant; multi-valued and real attributes, and a trigger instance whose read attribute is unset (§5), are refused by the exporter; no new variable |

**Code generation** [read: `git branch -a`, `git diff <merge-base> <branch>`, `git show <branch>:<path>`]:

| Branch | State | Reads guards, actions, `event` |
|---|---|---|
| `codegen-stc` (in HEAD) | merged | guards and actions as **text** (`stcAccess.ts`), not the `event` root |
| `codegen-jjel-template` (in HEAD) | merged | the JjEL lexer, parser and evaluator (`parseTemplate`, `readObserver`); no `event` |
| `codegen-engine` (`0bebec308`, 2 ahead) | open | guard and action text exposed to templates; no `event` |
| `codegen-runner` (`312927556`, 2 ahead) | open | **all three** |

`codegen-runner` reads `event` in three places:

- `printer.ts:300` `if (e.type === 'Identifier' && e.name === 'event') return true;` (its own `dependsOnStep`);
- `:444-445` `// The one name that depends on the step: the event, as an element.` `return '$E(event)';`;
- `:465-467`, where `MemberAccess` on a step value is refused (`return step(\`'.${e.property}'\`)`, code `P-STEP`).
  So `event.amount` is refused by the generator today, without a crash.

Its imports from this area: `buildGuardContext`, `judgeActionTarget`, `checkGuardSubset`, `STATE_RESERVED`.

None of these branches edits `stcChecks.ts`, `guardContext.ts`, `actionEvaluator.ts`, `netCompile.ts`, `simBridge.ts`,
`stateReserved.ts` or `subsetChecker.ts`. The Phase 2 of §10 adds functions and optional fields and changes no
signature that `codegen-runner` imports, so it stays disjoint. Supporting `event.f` in generated code (a case over
`$E(event)`, as P6) is a codegen lane of its own.

## 8. Grammar fragment for the formal semantics chat (item 8)

Quoted verbatim from `frontend/src/jjel/parser/parser.ts` at `f13f6f489`.

The identifier, `primary`, `parser.ts:553-591`:

```ts
        // Identifier or single-param lambda or function call
        if (this.match(JjelTokenType.IDENTIFIER)) {
            const token = this.previous();
            …
            // Regular identifier
            return {
                type: 'Identifier',
                name: token.value,
                location: this.makeLocation(token, token),
            } as IdentifierExpr;
        }
```

Member access, `postfix`, `parser.ts:389-423`:

```ts
    /**
     * postfix = primary (
     *     . IDENTIFIER (( argList ))?
     *   | ?. IDENTIFIER (( argList ))?
     *   | .[ IDENTIFIER ]
     *   | [ expression ]
     * )*
     */
    private postfix(): JjelExpression {
        let expr = this.primary();

        while (true) {
            if (this.match(JjelTokenType.DOT)) {
                const propToken = this.consume(JjelTokenType.IDENTIFIER, "Expected property name after '.'");
                …
                } else {
                    // Member access
                    expr = {
                        type: 'MemberAccess',
                        object: expr,
                        property: propToken.value,
                        location: this.makeLocation(this.getStartToken(expr), propToken),
                    } as MemberAccessExpr;
                }
```

So `event.amount` is `MemberAccess(Identifier("event"), "amount")`. `event` is not a keyword (§2.1). An action target
must be a `StateAccess` (`parser.ts:115-118`: `if (target.type !== 'StateAccess') { throw this.error(this.peek(), "The target of an action must end in '.[attribute]'"); }`).

Evaluation, `frontend/src/jjel/evaluator/evaluator.ts:393-404`, member access on `null` (an ε step):

```ts
    private evaluateMemberAccess(expr: MemberAccessExpr, ctx: EvaluationContext): JjelValue {
        const obj = this.evaluate(expr.object, ctx);

        if (obj === null) {
            throw new JjelEvaluationError(
                `Cannot access property '${expr.property}' of null`,
                expr
            );
        }

        return this.getProperty(obj, expr.property, ctx);
    }
```

An absent property on an object, `evaluator.ts:530-561`. It returns `null` and, with diagnostics on, as on every guard
and action path, it pushes `property-not-found`, which the tri-state turns into a defect (`jjelTriState.ts:56-61`):

```ts
            // Check if property exists before accessing
            if (property in obj) {
                const value = obj[property] ?? null;
                ctx.readObserver?.(obj, property, value);
                return value;
            }
```

The null-safe form `event?.amount` returns `null` on `null` (`evaluator.ts:406-414`). The subset checker gives
`W-NULLCMP` when an ordering compares it (`subsetChecker.ts:277-284`).

## 9. Guard errors: impact map only (item 9)

Not designed here. A parallel chat proposes that a guard evaluation error halts the run, where today the transition
leaves the candidates (R-SIM-17, spec §5.2).

### 9.1 Producers [read]

- **Static, the same in every configuration:**
  - parse, `guardEvaluator.ts:65-70`;
  - subset error, `:73-79`, handed back again at every evaluation, `:89`;
  - Reset reports that do not change the run: `checkGuard` R1, R2, R6 (`stcChecks.ts:198-210`) and `else-alone`
    (`stcChecks.ts:259-262`);
  - net defects that leave the element out: `else-twice`, `else-position` (`netCompile.ts:212-214`, `:353`).
- **Dynamic:**
  - `no-handle` (`guardEvaluator.ts:91-93`), `exception` (`:99-102`), `absent-identifier` (`:103-109`),
    `non-boolean` (`:110-111`);
  - conjoined per site in the oracle (`simBridge.ts:318-331`) and per transition (`netStep.ts:142-151`);
  - an `else` inherits a defective sibling (`netStep.ts:153-165`).
- **One case is both:** an undeclared `.[x]` is an R1 Reset defect and also throws at every evaluation (ESM without its
  declarations, §9.3).

### 9.2 Consumers [read]

| Consumer | file:line | Today |
|---|---|---|
| candidates | `netStep.ts:212-215` | `if (g.kind !== 'true') continue;` the outcome stays in `evaluated` |
| `else` | `netStep.ts:207-210` | `{ kind: 'else', outcome: e }` with the sibling's defect |
| step | `netStep.ts:268-279` | none left: discard (event) or quiescence (ε); a halt happens only after a selector, `:281-323` |
| status | `netStep.ts:345-350`, `simBridge.ts:1311-1315` | a defect on one input is invisible if another input has a candidate; Deadlock otherwise |
| explanation lines (R-SIM-57..63, R-SIM-96) | `simBridge.ts:1167-1223` (`blocked`, `explain`), `:1195` | `defect, <short>`; `else, <sibling> is defective`; only when the input has no candidate |
| Last step | `simBridge.ts:1376-1379`, `firstBlocked` `:1339-1346` | `discarded, …` / `nothing to fire, …` |
| halt line | `simBridge.ts:788-806` | an exhaustive switch over 7 `HaltReason` kinds (`netTypes.ts:343-353`); no guard kind |
| Play (R-SIM-101) | `simBridge.ts:1454-1464` | stops on Terminated, Deadlock, Halted, and `'event'` when no ε candidate exists |
| watches | `watchEvaluator.ts:6-7`, `:71-75` | never read guards |
| scenarios | `simScenarios.ts:75-88`, `:121-146` | divergence on status (`:77`), on a choice not offered (`:85-87`), on the step kind (`:134-136`) |
| coverage | `simCoverage.ts:101` | counts `fired` only |
| board clocks | `simBoardClock.ts:90-92`, `:151-152` | `clockEnables` reads structural inputs only; off on Terminated, Deadlock, Halted |
| step back | `simRunState.ts:406-420`, `configAt` `:329-334` | replay through the same oracle, compares kinds |
| problems registry, Reset line | `simCheckToProblems.ts:137-153`, `simBridge.ts:1037-1045` | static only |

`HaltReason` kinds today: `unsafe` (`netStep.ts:284`), `action-defect` (`:292`), `undeclared` (`:295`), `read-only`
(`:296`, `:298`), `double-assignment` (`:300`), `domain` (`:303`, `:323`), `derived` (`:319`). A guard halt would be
the first raised before a selector is chosen, and the first with `selector === null`.

### 9.3 The demo scenes [measured, node, `run:85-90`]

Each scene runs on the preset and the scripted path of `sim-verif-bench.ts`, with and without the demo's declarations.
At every step, for ε and every event, the probe reads the outcome of every guard and stops where the run halts (the
panel turns every input off then).

| Scene | Guard sites | Dynamic defects on the path | At the pressed input | Readings that would change under «halt» |
|---|---|---|---|---|
| PEST | 0 | 0 | — | none |
| Petri | t1, t2, t3 | 0 | — | none |
| ESM, with declarations | tc, tp, ts, tu | 0 | — | none |
| ESM, without declarations | same | 3 (step 0: tp `exception`, on push) | step 0, push | `push: discarded, tp defect, 'paid' is not a state attribute of demoESM` would halt; today the run halts at the next press (coin, the tc action, `undeclared`) |
| FlowB, with declarations | f1..f9 | 0 | — | none |
| FlowB, without declarations | same | 0 (the f2 action halts at step 2 before f3 or f4 is read) | — | none |

So with the demo's declarations no guard of the four scenes fails dynamically. Without them, one reading changes: ESM,
first press. The four scenes have 16 guard sites (Petri 3, ESM 4, FlowB 9, PEST none) and 4 non-empty guard texts: Petri 1, ESM 1, FlowB 2.

The count over the test fixtures is in §9.4.

### 9.4 Test fixtures

The count was read by an Explore agent with `command grep` (positive control `compileGuard` in
`model/simulation/__tests__`, exit 0). It covers `src/model/simulation/__tests__` and
`src/components/editor-v2/sim/__tests__`. It excludes `else` markers, blank guards, and watch, output and equation
texts, and it classifies each text against its own test model [read]. Spot checks of the cited lines are in §6.

- **102 distinct guard texts.**
  - **11 static defects:** parse errors, `E-NOELSE`, `E-NODE`, `E-EAGER`, e.g. `a b` at `guardEvaluator.test.ts:246`
    and `simBridge.test.ts:590`.
  - **53 compile but can fail at evaluation:**
    - 18 have that failure asserted by a test, e.g. `self.requires.locked` (`guardEvaluator.test.ts:185`,
      `netStep.test.ts:378`), `p2.[visits] > 0` (`simBridge.test.ts:503`), `D.[decision]` (`simBridge.test.ts:1720`);
    - 12 more are asserted only through a Reset check of `stcChecks.ts`;
    - 3 are evaluated with the failure never asserted, among them `event == go and event.name == "go"`
      (`guardEvaluator.test.ts:142`, run only with `go`);
    - 20 are never evaluated by the real evaluator: stub oracles, usage analysis, static checks only.
  - **38 cannot fail** in their model.
- **Tests whose assertions rest on «a guard defect removes the transition».** These would change under «halt»:
  - `netStep.test.ts:367` (real oracle, `candidates` empty);
  - `guardEvaluator.test.ts:327, 333`;
  - `simBridge.test.ts:502, 588, 622, 751, 1914` (quiescence, Deadlock and reason lines with `defect, …` and
    `else, e2 is defective`);
  - with stub oracles: `netStep.test.ts:296, 302, 345`, `netCompile.test.ts:499`.
- **The input mechanism rests on the same rule.** A guard that reads an input not yet given throws. The core reads
  `Deadlock`, and `runStatus` turns it into `Running` while an input asks (`simBridge.ts:1311-1315`). Tests:
  `simBridge.test.ts:1768, 2672`, `simScenarios.test.ts:200, 258, 272, 280`. A halt on any guard evaluation error would
  halt every run with an input on its first status read, unless the input-not-given case is excluded. The parallel
  chat should know this before designing.

## 10. Slice plan (item 10)

One lane, `sim-event-attrs`.

- **Lane:** full, because it changes an exported interface (additive).
- **Scope:** `frontend/src/` code only, no critical-zone file (`simBridge.ts` and `stcChecks.ts` are not in §3.1 of
  `CLAUDE.md`; `editor-v2/problems/` is, and it is not touched).

**Files.**

1. `frontend/src/model/simulation/stcChecks.ts`:
   - `checkEventRead(expr): boolean` (P3);
   - `checkEventFeature(expr, scope): StcDefect | null` (P4);
   - `StcScope.event?` optional;
   - `StcDefectReason` gains `'event' | 'event-feature'`.
2. `frontend/src/components/editor-v2/sim/simBridge.ts`:
   - `CompileDefect.reason` gains `'event' | 'event-feature'` (rule 11);
   - `startRun` builds `scope.event` from `stc.event` and the lookup;
   - `guardDefectsOf` runs P3 against `net.transitions` (some untriggered transition carrying the site) and P4;
   - a pass in `actionDefectsOf` runs P3 on entry and exit sites and on untriggered transition sites, and P4 on target
     objects and right sides;
   - `RunStart.runWarnings?` (unset reads, §5.2).
3. `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: `setRunWarning` joins `started.runWarnings` to the
   overlap text (one line, R-SIM-63).
4. Tests: `frontend/src/model/simulation/__tests__/stcChecks.test.ts`,
   `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`.
5. `docs/spec/claude_spec_2026-09-13_computational_model.md` §8 (the row of §7), in a docs lane of its own (this lane
   may not touch `docs/spec/`).

The run is not changed: `guardEvaluator.ts`, `actionEvaluator.ts`, `guardContext.ts`, `netStep.ts`, `jjel/` stay as
they are. P3 and P4 are Reset defects, like R1 to R7 (R-SIM-70: «Il run resta com'è»). There are 4 code files plus 2
test files, so the lane lists them first (P6).

**Tests written red first, each with the mutation that kills it:**

- P3, guard:
  - `event.amount > 0` on an ε arc → defect `'event'`;
  - the same on a triggered arc → none;
  - a guard on a fork out edge, one fused transition triggered and one not → defect (mutation: check only the first
    transition);
  - `event == null` on ε → defect (question 1).
- P3, actions:
  - entry and exit reading `event` → defect, whatever the arc;
  - a transition action reading `event` on an ε arc → defect;
  - on a triggered arc → none.
- P4:
  - `event.bonus` with `Coin` as the trigger type → `'event-feature'`;
  - `event.amount` → none;
  - `event.name` → none (a handle key);
  - a feature of a superclass → none (mutation: own features only).
- Unset warning:
  - coinX with `amount` read → listed;
  - `need` `[1..1]` → not listed (the snapshot reads 0; test it with a record that gives 0, as `buildEvalContext` does);
  - no `event.f` read → no warning.
- The `'event-feature'` short does not start with `undeclared '` (mutation: reuse `'undeclared'`, and
  `undeclaredGlobals` lists `amount`).

**Parity oracle.** A model whose guards and actions never read `event` behaves as today:

- the four demo scenes give the same Last step lines and statuses as `sim-verif-bench.ts` (and `run:85-90` here);
- the simulation test suite is unchanged except the new tests. Baseline measured here:
  `npx vitest run src/model/simulation src/components/editor-v2/sim` gives 47 files and 1461 tests passed, exit 0;
- `compileDefects` of a model without `event` reads is byte-identical, measured on the four scenes before and after.

The census (§6) says no shipped model reads `event`, so the oracle covers every shipped model.

**Draft row R-SIM-144:**

> - **R-SIM-144** (2026-10-10, proposal; evidence: measured, verified: none, reversible: branch). **The attributes of
>   the event that fired the step are read as `event.a`; compile time checks where and what.** Today a guard or an
>   action reads `event.a` on the pool handle of the event instance (R-SIM-14, R-SIM-16: the parameters of an event are
>   frozen attributes of its instance), measured in guards, arc actions, entry and exit, on Petri and fused transitions.
>   At Reset two checks are added, defects of the line of R-SIM-61 and of the problems registry as R-SIM-70: (P3) a read
>   of `event` in a guard or an action of a transition without a trigger, or in an entry or an exit action, is the
>   defect `event`; a guard site or an action site that more than one transition carries is judged on each, and the
>   trigger of a transition fused by a fork or a join is that of its choice edge (R-SIM-31(3)); (P4) `event.a` where
>   `a` is not a feature of the trigger's declared type or of its ancestors (R-SIM-38), nor a key of the handle (`name`,
>   `id`, `instanceOf`, `parent`), is the defect `event-feature`: no downcast. The run is unchanged: `event` is `null`
>   on ε and a read on it fails as today. An unset attribute is read as `null`: a guard compares it (false, or true for
>   `== null`), an action that uses it halts as it does today; a warning on the run warning line (R-SIM-37) at Reset
>   lists the trigger instances whose read attributes are unset in the frozen M. `event.a := …` stays a parse error
>   (R-SIM-40); `event.[x]`, σ of the event instance, is unchanged. nuXmv: one `DEFINE event_a` by cases on the event
>   `IVAR` (spec §8). A model that never reads `event` behaves as before (parity oracle). Evidence:
>   `docs/discovery/discovery_2026-10-10_sim_event_attributes.md`.

## 11. Open questions

1. P3 on an ε arc: is `event == null` in a guard a defect too (always true there)? Recommended: yes, the rule is «no
   `event` without a trigger», with no exception by form.
2. A trigger on a fork's out edge, or on a join's in edge, is silently dropped (`run:36-38`). Recommended: a ticket for
   a compile defect `trigger-position`, outside this slice.
3. The browser probe logs `init_dash` as a console error on every page. Recommended: no action here; check it against
   the smoke console baseline in its own lane if it is new.

## Decisions taken (unattended)

- The node stand-in was kept as `sim-verif-bench.ts` has it (P11: the subject is `startRun`/`pressInput`, the record is
  injected). The app's reading was measured in the browser instead of re-implemented, and §1.3 lists the four cells
  where the two differ.
- The fused and Petri cells used a Custom profile, the only way to switch both roles on (`run:46-48`).
- Two new `CompileDefect.reason` literals are proposed instead of reusing `'undeclared'`, because `undeclaredGlobals`
  would turn the latter into a «Declare in State…» offer (§3.5).
- P3 is proposed as a separate function, not inside `checkGuard`, so that `stcChecks.test.ts:77,104` keep their
  expectations.
- The unset warning is proposed on the run warning line, since R-SIM-61's line is defects only and the warning line is
  always empty on a model with events (§5.2).
- Item 9 is a map. No design and no recommendation on the halt proposal.

## 12. Decisions awaiting Alfonso

1. **Name of the root (memo choice 1): `event` or `trigger`.**
   - Facts: `event` is already reserved (`stateReserved.ts:18`), bound (`guardContext.ts:173`), refused where it must be
     (§2.4), and used by R-SIM-121 (`event.digit`) and by tests (`self.trigger == event`). `trigger` is the name of the
     arc's feature in the tests' metamodels, so `self.trigger == trigger` would read badly.
   - Recommended: `event`.
2. **Entry and exit see `event` (memo choice 2).**
   - Facts: today they do (`run:20`), and on an ε arc they halt (`run:22`). No shipped model and no test reads `event`
     in an entry or an exit (§6).
   - Recommended: no, as P3, as a Reset defect only; the run unchanged.
3. **Unset attribute on a trigger instance (memo choice 3).**
   - The memo's alternatives assume a guard halts. It does not: a guard reads null and compares it (`run:53-56`).
   - Options:
     - (a) a Reset warning; the guard reading as today; the action halt as today;
     - (b) the same plus a guard that reads an unset attribute becomes a defect (needs a hook in the guard oracle, a
       run change);
     - (c) refusal to start.
   - Recommended: (a). It changes no run, and the warning reads what the run reads (a mandatory attribute reads 0, a
     default its default, §1.3).
4. **P3 and P4 defects in the problems registry.**
   - The memo says never. Today every guard and action compile defect goes there (`simCheckToProblems.ts:137-147`,
     R-SIM-70 as extended). Excluding these two would need a filter in `simCheckEntries`, a critical-zone file.
   - Recommended: let them go there like every compile defect.
5. **`event.[x]`, σ attributes declared on the event metaclass.**
   - Today `event.[x] := 1` writes σ of the event instance (`run:70-72`), and tests use it (§6). The memo's P5 covers
     `event.x :=`, which already fails to parse (`run:66-69`).
   - Recommended: keep `event.[x]` as it is, outside this slice; reword the parse error for an `event.f` target in a
     later slice if wanted.
6. **The P3 break.** Item 6 found no use in shipped models and none in entry or exit anywhere. Untriggered `event`
   reads exist only in unit tests that do not pass through `startRun` (`actionEvaluator.test.ts:145,184`,
   `guardEvaluator.test.ts:140`) and in `stcChecks.test.ts:77,104`, which a separate function leaves untouched.
   - Recommended: proceed; no migration and no notice needed.

## Files read

`docs/PROTOCOL.md`; `docs/decisions.md` (R-SIM-14..46, 57..71, 75, 96..101, 118..121, 137..143, R-GEN-1..15);
`docs/spec/claude_spec_2026-09-13_computational_model.md` §4-§8; `docs/ratifiche/claude_2026-10-10_memo_proposta_event_attributes.md`;
`docs/log-inbox/simulation.md`.

Under `frontend/src/`:

- `model/simulation/`: `guardContext.ts`, `guardEvaluator.ts`, `actionEvaluator.ts`, `stcChecks.ts`, `subsetChecker.ts`,
  `netCompile.ts`, `netStep.ts`, `netTypes.ts`, `objectSlots.ts`, `derivedEvaluator.ts` (parts), `boardOutputs.ts`
  (parts), `watchEvaluator.ts` (parts), `simProfiles.ts` (parts), `profileCodec.ts` (parts), `roleCatalog.ts` (groups);
- `components/editor-v2/sim/`: `simBridge.ts` (lines 1-345, 345-830, 985-1140, 1306-1440, 1590-1639), `SimulationPanel.tsx`
  (lines 320-330, 595-645, 1190-1205), `simStateUsage.ts` (lines 100-140), `simBoard.ts` (lines 477-548), `simRunState.ts`
  (types);
- `components/editor-v2/problems/simCheckToProblems.ts` (lines 95-200);
- `jjel/`: `stateReserved.ts`, `parser/parser.ts` (lines 100-150, 380-600), `evaluator/evaluator.ts` (lines 210-305,
  385-561, 1015-1040, 1123-1142), `evaluator/modelContext.ts`, `lexer/lexer.ts` (lines 560-570), `types/tokens.ts`
  (lines 108-127), `autocomplete/providers/identifier.ts` (lines 1-80);
- `jjscript/executor/commands/eval.ts` (lines 1-830);
- `model/logicWrapper/LModelElement.tsx` (lines 3268-3310, 4380-4400, 7505-7780); `joiner/classes.ts` (lines 730-790);
- `model/conformance/ConformanceValidator.ts` (lines 244-262); `model/jjelTriState.ts` (lines 56-104).

Branches `codegen-runner`, `codegen-engine`, `codegen-stc`, `codegen-jjel-template`, `codegen-pilot` (§7). The census
and the impact map were read by Explore agents with `command grep`, their commands and exit statuses recorded in §6 and
§9. Their claims quoted here were checked against the files where a line is cited.
