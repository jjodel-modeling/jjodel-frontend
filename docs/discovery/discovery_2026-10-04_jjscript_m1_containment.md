# Discovery — JjScript at M1: deferred retries and creation inside a container

Prompt-ID: P-2026-10-04-0946 · prompt `docs/prompts/claude_2026-10-04_0946_prompt_jjscript_m1_containment.md` ·
session `5560e1ae-853f-46ad-9b13-a8c3f4f18353` · tree `~/jjodel-w-jjsm1`, branch `jjscript-m1`, read at `c1a49f5eb`
(trunk `d6bd5c5f6` plus the prompt), probe and fixture committed in `4cd1fce10` · executor: Claude Opus 5.5
(`claude-opus-5-5`) · Phase 1, no file under `frontend/src` changed.

This report is a set of hypotheses with evidence, not a reference. Whoever uses it rereads the files.
Tags: **[measured]** = a probe run in this phase, on `c1a49f5eb` plus the probe; **[read]** = a file read at `c1a49f5eb`.
The chat's own reading was on `95c38845d`; every line number below is from `c1a49f5eb`.

## 0. Answer in brief

- **Q7 reproduced [measured].** The microwave script (24 commands, forward references, containment lines before the transition they attach) run through Jjodie's Run in an ESM model: 8 final errors, all `Target instance '…' not found` (4 containment `+=`, 4 `event`), the 4 `Transition` at the model root. Identical on the seeded project and twice on the fixture.
- **Q1.** At M1 one code means «a name did not resolve»: `INSTANCE_NOT_FOUND`, from `set` on its target (`instance.ts:663`) and on its value (`instance.ts:820`), both before any write. **Recommended:** a separate `M1_DEFERRABLE_ERROR_CODES`, read by `isDeferrable` beside the M2 set, which a test pins by equality to 12 codes (`runPasses.test.ts:192-197`).
- **Q2 [measured].** `set s.transitions += t` on a root `t` **reparents but does not detach**: `t.father` becomes `s.transitions`, and `t` stays in `model.objects`. That leaves one object in two collections, not a copy. A second `+=` lists it twice. Moving it to another state nulls the old slot entry instead of removing it. A `State` into the `Transition` slot is accepted. No line is ever refused.
- **Q3.** The grammar is half there. `create instance of T in s.ref "n"` already parses into `CreateArgs.parent`, and the executor ignores it. `create instance of T "n" in s.ref` parses with the clause silently dropped. Both create at the root and report success [measured]. No new AST field is needed. The father of a contained object is the parent's **slot (`DValue`)**, not the parent `DObject` (`LModelElement.tsx:7277`, DemoESM, prototype E4).
- **Q4 [measured].** A fresh instance is in the store at 0 ms, but its metaclass, its slots and its `model.objects` entry land together **284–352 ms later** (`U.UpdatingTimer` is 300). The Run spaces commands by 20 ms. So the next line finds no slot on the parent, and the `set` handler, called at once, fails `NO_METACLASS`. Today only the waiter's poll on `model.objects` hides this. A child born in a slot never enters `model.objects`. Within the run, each `set` on it costs the full 500 ms wait (522–549 ms). In a later run it is not found at all (`INSTANCE_NOT_FOUND`), while a root control resolves in 1 ms.
- **Q5.** The live text is `CHAT_PROMPT` in `constants/defaultPrompts.ts`: `:195` «root-level only», `:218` «Emit ALL create instance lines first», `:232` forbids nesting, example at `:234`. `jjscriptGenerationPrompt.ts` has no importer. **Recommended:** rewrite the M1 section around the `in` form and bump `chat` to version 5. Align the dead file too, for consistency.
- **Q6.** Yes. `topLevelReason(cls)` (`joiner/environmentConfig.ts:149`) already answers `created inside State` for `Transition` [measured]. Separate finding: the summary's `instances` figure counts `model.objects` only (`runFigures.ts:100`). It would read 3 where the model holds 4 [measured].

Decisions awaiting Alfonso (each a provisional R-JS row in Phase 2):
- **D1:** (a) via a separate M1 set of deferrable codes.
- **D2:** both word orders accepted, `.ref` mandatory, father = slot.
- **D3:** the M1 name lookup becomes model-wide (roots plus contained). This amends R-S1-5's scope.
- **D4:** the M1 wait counts an instance as present only once its metaclass is in the store, and the instance parent becomes a required dependency.
- **D5:** the `set +=` hybrid and the Q6 summary items stay out of this lane, as tickets.

Questions (§7), each with one recommendation:
1. Syntax order. Recommended: accept both, document `create instance of <Class> "<name>" in <Parent>.<ref>`.
2. Model-wide lookup (D3) in this lane. Recommended: yes; without it every instance (b) creates is unreachable from the next reply.
3. Upper bound with lagging slot values. Recommended: count committed values plus this run's pending children of that slot, kept beside the handles.
4. Q6 orphan note and figure fix in this lane. Recommended: no; two tickets, R-JS-6 amended separately.
5. `set +=` hybrid (Q2). Recommended: no fix here (it is L-layer core, `LModelElement.tsx:7916`); ticket, named as the likely cause of the canvas defect.

## 1. Hypotheses under test

| # | Hypothesis (from the prompt's context) | Verdict | Evidence |
|---|---|---|---|
| H1 | `DEFERRABLE_ERROR_CODES` holds only M2 codes, and M1 emits `INSTANCE_NOT_FOUND`, which is not deferrable | **holds** | `runPasses.ts:94-99` [read]; E1 final errors [measured] |
| H2 | `create instance` always takes the model as father | **holds** | `instance.ts:363-369` [read]; E1, E2 [measured] |
| H3 | `parser.ts` has no form for a container | **partly falsified** | `in <Parent>.<ref>` after the class name already parses into `CreateArgs.parent` (`parser.ts:279-283`), and the executor ignores it; after the name string the clause is dropped (§4.4) [measured] |
| H4 | A child becomes contained only through a later `set … +=`, and a failure leaves it at the root | **holds** | E1 [measured]; E3 shows what a successful `+=` leaves behind (§4.3) |
| H5 | `elementWaiter.ts` has an M1 branch older than R-JS-3 that only waits within its timeout | **holds, and it is what makes `set` after `create` work** | `elementWaiter.ts:74`, `:122-134` [read]; E6 [measured] |
| H6 | The father of a contained instance is a `DObject` (the prompt's «DObject.new with a DObject father») | **falsified** | the father is the parent's `DValue` slot: `LModelElement.tsx:7277`, `classes.ts:784-795`, DemoESM fixture, E4 [read, measured] |

## 2. Files read

`frontend/src/jjscript/executor/runPasses.ts` (whole), `executor/commands/instance.ts` (whole), `executor/elementWaiter.ts` (whole),
`executor/handleRegistry.ts` (whole), `executor/dependencies.ts` (whole), `executor/executor.ts` (whole),
`executor/commands/create.ts:225-260`, `executor/commands/set.ts:40-70`, `executor/scriptValidator.ts:13-40, 265-300`,
`parser/parser.ts:1-560, 1184-1300`, `parser/grammar.ts:28-68`, `parser/lexer.ts:360-400`, `types.ts:128-200, 578-598`,
`components/ScriptBlock.tsx:240-300, 365-620`, `components/runFigures.ts` (whole), `components/RunSummaryDialog.tsx` (class names),
`services/JjScriptService.ts:16-60`, `executor/__tests__/runPasses.test.ts:1-30, 185-210`, `__tests__/handleRegistry.test.ts:1-40`,
`jjscript/CLAUDE.md`;
`frontend/src/model/logicWrapper/LModelElement.tsx:2826-2850, 3055-3095, 6085-6110, 6670-6700, 7236-7420, 7868-8080`;
`frontend/src/joiner/classes.ts:576-700, 780-800`; `frontend/src/joiner/environmentConfig.ts:135-162`;
`frontend/src/components/TreeViewSidebar/TreeViewContent.tsx:95-120, 1225-1262, 2870-2930, 3075-3092`;
`frontend/src/components/StatusBar.tsx:170-176`; `frontend/src/components/Jodie/ChatMessages.tsx:395-460`;
`frontend/src/components/common/MarkdownRenderer.tsx:85-130`; `frontend/src/components/project/ProjectEditor.tsx:1110-1170, 2125-2145`;
`frontend/src/components/editor-v2/hooks/createAdapter.ts:36-50`; `frontend/src/components/editor-v2/CLAUDE.md` §3.3;
`frontend/src/pages/components/Navbar.tsx:102-121`; `frontend/src/constants/defaultPrompts.ts:1-40, 180-262, 670-702`;
`frontend/src/jjodie-integration/jjscriptGenerationPrompt.ts:1-30, 60-125`; `frontend/src/common/U.tsx:178, 405-445`;
`frontend/src/services/export/JsonModelService.ts:276` (through a search agent, one line verified);
`docs/decisions.md:5494-5575` (R-JS-1..7); `docs/claude-code-log.md:180-215` (tickets T1..T7); `docs/log-inbox/jjscript.md`;
`docs/PROTOCOL.md`; `frontend/scripts/probe/jjscript-run-slowdown.ts`, `tree-crossing.ts`, `object-edge-delete.ts` (the probe idioms);
`frontend/scripts/probe/fixtures/scene_3_DemoESM.jjodel` (decompressed).

## 3. Method

The probe is `frontend/scripts/probe/jjscript-m1-containment.ts` (`4cd1fce10`). It runs with `lane-run probe … --port 3096`.
It seeds the ESM metamodel by JjScript at M2: `State`; `Initial` and `Terminal` extend `State`; `Transition`; `Event`;
`transitions` is a composition `0..*` of `Transition`; `nextState` is `0..1 State`; `event` is `0..1 Event`. Its shape is
checked [measured]: `transitions` composition, upper −1; `Transition.rootable` false.

The fixture is `frontend/scripts/probe/fixtures/jjscript-m1-esm.jjodel`, 17146 bytes, metamodel only. Each experiment
runs in a fresh M1 model made by `Navbar.createM1`, the function behind «New model».

Three runs, all green: seed (`probe_before.json`), then fixture twice (`probe_before_fixture.json`). E1 and E2 were
identical across the three. The JSON and the log are in `~/.jjodel-lanes/P-2026-10-04-0946/`, outside the tree. Tree
crops are under `crops/` there: `before_E1_tree.png`, `before_E2_tree.png`, `before_E4_tree.png`.

- **E1, E2** go through the user's path. A scoped M1 Jjodie reply is injected into the chat's state hook, the same
  technique as `jjscript-run-slowdown.ts`. Then «Run as JjScript» and «Run». The summary is read from the DOM. That
  path is `ScriptBlock.handleExecute` → `runPasses` → `ChatMessages.handleJjScriptExecute` → `JjScriptService.execute(command, scope)`.
- **E3** sends single commands through `JjScriptService.execute` with the M1 scope. That is the per-line call of the
  same path, without `ScriptBlock`'s 20 ms delay; the probe waits 500 ms after each.
- **E4** prototypes the write of (b) with `DObject.new(<Transition id>, <slot id>, DValue, name, true)`. It is the
  call the executor would make, run in the page, not in `src`.
- **E6** calls the M1 `set` handler directly, below the executor's wait, to isolate one precondition. It is declared
  as such: it is not the user path.

## 4. Findings

### 4.1 Q7 — the reproduction [measured]

The script is `MICROWAVE_TODAY` in the probe. Each state names its transitions before they exist, for example line 3
`set idle.transitions += tStart`. Each transition names its event before it exists, for example line 12
`set tStart.event = evStart`.

| | before (all three runs) |
|---|---|
| summary | `Script executed with 8 errors` · `16 commands executed` · instances 0 → 12 |
| final errors | lines 3, 5, 6, 8 (`set <state>.transitions += tX`) and 12, 15, 18, 21 (`set tX.event = evX`), each `Target instance 'X' not found in active model` |
| Transitions | `tStart`, `tOpen`, `tClose`, `tDone` with `@root [objects]`; `nextState` set, `event` empty |
| tree | 12 rows, all at the first level |

Nothing was deferred, because `INSTANCE_NOT_FOUND` is not in the set (H1).

### 4.2 Q1 — the M1 codes for a name that does not resolve [read]

A search for every `code: '` in `executor/commands/instance.ts` (the M1 handlers) returned these.

| code | where | name-related | before any write | defer? |
|---|---|---|---|---|
| `INSTANCE_NOT_FOUND` | set target `:663`; set value `:820` | yes | yes: `:656-667` and `:813-824` return before the `TRANSACTION` at `:710`/`:828` | **yes** |
| `INSTANCE_NOT_FOUND` | delete `:464`, rename `:563` | yes | yes | no: destructive verbs, filtered by `CONSTRUCTIVE_VERBS` (`runPasses.ts:106`) |
| `AMBIGUOUS_INSTANCE` | `:454`, `:553`, `:653`, `:810` | yes | yes | no: a later constructive line cannot remove an ambiguity |
| `CLASS_NOT_FOUND` | create `:299` | yes (metaclass) | yes | no: an M1 run cannot create a metaclass; `create class` at M1 is `WRONG_LEVEL` (`create.ts:239-265`) |
| `NO_METACLASS` | set `:676` | no, readiness | yes | no; see §4.5: the wait has to cover it |
| `NO_FEATURE_PROXY` | set `:717`, `:835` | no, readiness | yes, inside the `TRANSACTION`, before the write | no, same reason |
| `WRONG_LEVEL`, `NO_METAMODEL`, `NO_MODEL`, `ABSTRACT_CLASS`, `SINGLETON_CLASS`, `HANDLE_IN_USE`, `UNKNOWN_PROPERTY`, `TYPE_MISMATCH`, `*_ERROR` | — | no | — | no |

A search for `INSTANCE_NOT_FOUND|AMBIGUOUS_INSTANCE|CLASS_NOT_FOUND` over `frontend/src/jjscript` (excluding tests)
returned only `instance.ts` for the first two. Control: the same command found `CLASS_NOT_FOUND` in
`executor/commands/remove.ts:151`. So no M2 handler emits `INSTANCE_NOT_FOUND`, and adding it changes nothing at M2.

**Recommended:** a second set, `M1_DEFERRABLE_ERROR_CODES = {INSTANCE_NOT_FOUND, CONTAINER_NOT_READY}`, the second
being the new code of §4.4. `isDeferrable` accepts a code from either set with the same verb rule. Reasons:

1. `runPasses.test.ts:192-197` asserts the M2 set by equality ( `'defers exactly the twelve unresolved-name codes of
   the report'` ). A separate set leaves that test and R-JS-3's list untouched.
2. The M1 rationale (a handle created by a later line) differs from the M2 one.

Superseded handling (`findSupersedingSet`, `runPasses.ts:147-166`) applies unchanged: the key is `target#property`,
and `+=` never supersedes `+=`.

### 4.3 Q2 — `set <Parent>.transitions += <child>` on a child at the root [measured]

These are E3 steps, in model q2. In the two lane runs, every step gave the same result except the `=` step, noted below.

| step | result |
|---|---|
| `set s1.transitions += t1` | ok; `t1.father` = `s1.transitions` (DValue); **`t1` still in `model.objects`**; one DObject named `t1` |
| the same line again | ok; `s1.transitions = [t1, t1]` |
| `set s2.transitions += t1` | ok; `t1.father` = `s2.transitions`; `s1.transitions = [null, null]`; `t1` still in `model.objects` |
| `set s1.transitions = t1` (`=`) | ok, appended: `s1.transitions` = `[t1]` on the seed run and `[t1, null]` on both fixture runs (not deterministic); `s2.transitions = [null]` |
| `set s1.transitions += s2` (a State) | ok; `s2.father` = `s1.transitions` |
| tree | `s1`, `t1 < s1`, `s2 < s1`: the tree hides the stale root entry |

**Verdict:** a move. It is not a duplicate and never a refusal. It leaves an incoherent state: the child is listed
both in `model.objects` and in the slot. The code reads the same way:

- `LModelElement.tsx:7916-7917`: `let oldContainerValue: LValue = (oldContainer.className === DModel.cname) ? undefined as any : …` /
  `// detach contaied object from old parent`. Nothing detaches from a `DModel`.
- The containment dedupe at `:8010` returns `true` on both branches:
  `val = val.filter((e: any)=> { if (typeof e !== 'string' || !idmap[e]) return true; idmap[e] = true; return true;} )`.
- The type check is commented out at `:7910`: `// if (… !(lvalmeta as LClass)?.isExtending(info.type))) … damiano todo`.

The M1 handler ignores the operator: every link appends.
- `instance.ts:841`: `refProxy.values = [...meaningful, targetInstance.id];`.
- The live prompt already says so (`defaultPrompts.ts:219`).

The tree is built to hide this state: `TreeViewContent.tsx:2874-2876`, `il contained calcolato qui sotto e' una difesa
contro uno stato incoerente (un oggetto che compare sia in objects sia come subObject)`. The DemoESM export carries the
same state: its 4 Transitions have a `DValue` father and are listed in `objects`.

Hypothesis for the separate canvas lane, not tested here: a reparented Transition is still drawn as a node because it
is still a root of `model.objects`.

### 4.4 Q3 — the grammar and the write path of (b)

**Parser today [measured, E2].** E2 parsed each `in` line with `parse()` and with `parse(…, {strict: true})`.

- `create instance of Transition in cooking.transitions "tDone"`:
  - `parent = {segments:["cooking"], member:"transitions"}`, `instanceName = "tDone"`, strict ok.
  - It works because `parseCreateCommand` tests `in` right after the class name (`parser.ts:279-283`) and
    `parseCreateOptions` then takes the string (`:345-349`).
- `create instance of Transition "tStart" in idle.transitions`:
  - `success: true, parent: null`, strict fails with `Unexpected trailing input`.
  - The option loop breaks on `in` (`:442` «If we can't parse more options, break»). The non-strict `parse()` returns
    success without checking the end of input (`parser.ts:87-104`, the end-of-input check runs only under `opts?.strict`).

The Run executes all 4 lines as successes, and the 4 Transitions land at the root. `executeCreateInstance` never reads
`args.parent` (`instance.ts:259-415`). This is a silent failure. A prompt teaching the new form, run on a build that
does not have it, produces root instances with no error.

**AST.** `CreateArgs.parent?: QualifiedName` already exists (`types.ts:132`). No interface change is needed.

**Recommended grammar.** Accept `create instance of <Class> ["<name>"] in <Parent>.<ref>` (the prompt's form, documented
as canonical) and the order already parsed today. `.<ref>` is mandatory. A bare `in <Parent>` is a parse error naming
the form; inferring the ref would be the inference the prompt rules out. One caveat: a qualified class name
(`pkg::Transition`) overwrites `parent` with the class path (`parser.ts:292-293`,
`parent: typeof name === 'string' ? parent : name`). Phase 2 has to keep the instance branch out of that rule.

**Father and its type [read + measured].** `LValue.addObject`, the UI's «Add» into a slot, sets
`father = isContainment ? c.data.id : this.get_model(c).id;` (`LModelElement.tsx:7277`). It then calls
`DObject.new3(constructorPointers, () => { }, isDModel?DModel:DValue, true)` (`:7383`). Its constructor appends to the
father's `values`: `classes.ts:790-791`, `// object containing object is not in any direct child collection. access
through values` and `this.setExternalPtr(thiss.father, "values", "+=")`.

The prototype E4, `DObject.new(Transition, p1.transitions, DValue, 'tNested', true)`, gives `tNested @p1.transitions`,
not in `model.objects`. The tree shows `tNested < p1`. **Recommended:** `DObject.new` directly, as `instance.ts:363`
does today, with no outer `TRANSACTION` (`editor-v2/CLAUDE.md` §3.3). `addObject` wraps the creator in one (`:7382-7383`)
and toasts its own refusals.

**Checks before any write, in this order, with codes:**

1. The parent resolves through `resolveInstanceHandle`. Missing → `INSTANCE_NOT_FOUND`, deferrable. Ambiguous →
   `AMBIGUOUS_INSTANCE`, final.
2. `<ref>` is a reference of the parent's metaclass (`allReferences`, as `classifyMetaclassProperty`, `instance.ts:232-240`).
   An attribute or unknown name → `UNKNOWN_PROPERTY`, final.
3. It is a containment: `LReference.containment` = `composition || aggregation` (`LModelElement.tsx:4202`); measured
   `containment: true`. Otherwise `NOT_A_CONTAINMENT`, final.
4. The class conforms: `metaclass.isExtending(ref.type)`, which includes equality (`LModelElement.tsx:3601` `orEqual = true`);
   measured `typeOk: true` in E4. Otherwise `TYPE_MISMATCH`, final.
5. The upper bound is not reached: `ref.upperBound`, −1 meaning unbounded, measured −1. The count has to include
   this run's pending children (§4.5). Otherwise `MULTIPLICITY_EXCEEDED`, final.
6. The parent's slot exists (`parent['$' + ref]`). Absent → `CONTAINER_NOT_READY`, deferrable.

Then the abstract and singleton checks run as today. A missing parent or slot never falls back to the root.

### 4.5 Q4 — the registry, the lagging commit, and a child created in a parent of the same pass [measured]

E4 and E6 measure a `create instance` from the moment it returns.

| instance | in store | `instanceof` | `features` / slot | `model.objects` |
|---|---|---|---|---|
| root `State` q1 (two runs) | 0 ms | 323 / 352 ms | 323 / 352 ms | 323 / 352 ms |
| root `Transition` q2 | 0 ms | 330 / 313 ms | 330 / 313 ms | 330 / 313 ms |
| child via `DObject.new(…, slot, DValue)` | 0 ms | 284 ms | 284 ms (listed in the slot at 284 ms) | never (2 s) |

Probing the parent at return, after a macrotask, and after 20 ms all give `features: 0, slotId: null`. At 420 ms the
slot is there. A child written at return finds `slot: null` (E4 `atOnce`). The `set` handler called at return answers
`NO_METACLASS` («Cannot resolve metaclass for instance 'q3'»).

The codebase states the same delay for `addObject`:
- `ProjectEditor.tsx:2133-2135`: «the child's DValues do not exist before that».
- `U.tsx:178`: `UpdatingTimer: number = 300`.

**Why `set` after `create` works today.** The `set` target is a required dependency (`dependencies.ts:81`). The M1 wait
polls the name in `model.objects` (`elementWaiter.ts:133`: `if (findInstanceByName(m1Model, instanceName).length > 0) return false;`).
A root's `objects` entry lands in the same commit as its metaclass and slots, so the wait ends exactly when the handler
can work.

**What (b) changes:**

1. **The parent of the same pass.**
   - Its handle resolves at once (`handleRegistry.ts`, by id, `instance.ts:190-193`), but its slot is ~300 ms away and
     the Run moves on after 20 ms (`ScriptBlock.tsx:165` `BATCH_DELAY_MS = 20`).
   - Today the instance parent is a dependency with `required: false` (`dependencies.ts:153-157` lists the nested M2
     types only), so pass 1 does not wait for it.
   - **Recommended:** `required: true` for `instance` with a parent, so pass 1 waits for it as it does for a `set`
     target. Keep `CONTAINER_NOT_READY` as the backstop for a timeout.
2. **A child born in a slot is invisible to the name lookup.** `findInstanceByName` filters `model.objects` only
   (`instance.ts:117-120`), and its comment says so: «`model.objects` … the ROOTS of one model».
   - Within the run, the handler resolves the child by handle. The wait, which does not read the registry, polls the
     full `MAX_WAIT_MS`. Measured: `set tNested.nextState = p1` took 549 and 522 ms and succeeded.
   - The nested microwave has 8 such lines, about +4 s per Run.
   - In a later run, with the registry cleared, the same `set` fails `INSTANCE_NOT_FOUND` after 510/516 ms. Control:
     `set tRoot.nextState = p2` on a root `Transition` succeeds in 1 ms.
   - Jjodie's M1 context shows contained instances nested under their container (`JsonModelService.ts:276` marks
     `containment`; contained objects are listed under `children`). The next reply will address them by name.
3. **Recommended (D3, D4):**
   - `findInstanceByName` walks the model: roots plus every object reachable through containment slot values,
     deduplicated by id.
   - The M1 wait counts an instance resolved when the registry or that lookup finds it **and** its `instanceof` is in
     the store. That is the readiness signal measured above.
   - Do not make the wait accept a bare registry hit: at 0 ms that is a `NO_METACLASS` at the handler.
   - The model-wide lookup amends R-S1-5's scope. A name unique among roots but shared with a contained instance becomes
     ambiguous and is refused where today it resolves the root.
4. **Upper bound.** The child appears in the slot's `values` only at ~284 ms, so a `values`-only count lets two creates
   into a `0..1` slot pass 20 ms apart. **Recommended:** a per-run count of the children created into each slot, kept
   beside the handles in `handleRegistry.ts` and cleared with them. It would be one additive export.
5. **Auto-names.** `generateInstanceName` reads `objects` plus this run's handles (`instance.ts:214-224`). Across runs,
   a nested auto-named instance can get a name a contained sibling already has. This is low risk because the live
   prompt demands explicit names (`defaultPrompts.ts:200`).

### 4.6 Q5 — the Jjodie prompts [read]

`constants/defaultPrompts.ts`, `CHAT_PROMPT`, is the live text. `PromptService.ts:15` and `usePrompt.ts:9` import
`DEFAULT_PROMPTS`. The M1 section reads:

- `:195` `**Create an instance** (root-level only — you cannot nest an instance inside another):`
- `:218` `- (a) **Create before link** — … Emit ALL \`create instance\` lines first, then ALL \`set\` lines.`
- `:232` `- Creating an instance inside another instance (no containment/nesting at creation time).` (under «Forbidden in M1»)
- `:234-246`, the M1 example: two `State` and one `Transition` linked by `source`/`target`, no containment.

`jjodie-integration/jjscriptGenerationPrompt.ts:67-115` has its own M1 section. It has no importer. Searching
`frontend/src` for `jjodie-integration` with `command grep -rn` over `*.ts`/`*.tsx` found only three comments.
Control: the same command over `constants/defaultPrompts` found its three importers. Its claim
`Mixed M2 + M1 scripts are valid` (`:99`) is false at runtime: `create class` at M1 is `WRONG_LEVEL`, and
`create instance` at M2 is `WRONG_LEVEL` (`instance.ts:264-273`).

**Recommended change, `defaultPrompts.ts`:**
1. `:195` becomes «Create an instance at the root, or inside its container». It adds
   `create instance of ClassName "name" in parentName.containmentRef`, with the rule: a class whose instances the context
   shows only under a `containment: true` reference is created inside its container, never at the root and attached later.
2. The container line comes after the line that creates the parent.
3. `(a)` stays for plain references.
4. `:232` is removed.
5. Add «never attach a contained instance with `set parent.ref += child`».
6. Replace the example with the ESM one: `transitions` composition, `nextState`, `event`.
7. `DEFAULT_PROMPT_VERSIONS.chat` becomes 5, with one changelog line, as the file's bump rule requires
   (`defaultPrompts.ts:8-24`). Users with a customized chat prompt are not migrated, as by design.

**Recommended for the dead file:** the same M1 text, plus the false «Mixed» line corrected.

### 4.7 Q6 — reporting an instance left at the root [read + measured]

`topLevelReason(cls)` (`joiner/environmentConfig.ts:149-161`) answers `created inside <Owner>` for a composed class
that is not rootable. It is the core's own `LClass.rootable`: `LModelElement.tsx:3091-3094`,
`return this.get_instantiable(c) && !this.get_isComposed(c)`. Measured on the ESM:
`{"State":null,"Initial":null,"Terminal":null,"Transition":"created inside State","Event":null}`.

**Recommendation (no inference of a parent):** after a Run, list under «Left at the model root» each instance that
- this Run created (its handles),
- has a `DModel` father,
- and whose class `topLevelReason` does not return `null`.

This is a notice, not an error, and not counted.

**Caveat.** `isComposedBy` comes from `referencedBy` of the class itself. A subclass of a composed type is not composed
by that rule; unmeasured here.

**Separate finding.** The `instances` figure is `list(model.objects).length` (`runFigures.ts:100`), as is the status
bar (`StatusBar.tsx:173-175`).
- After (b), the summary of the nested microwave would show +8 for 12 instances. E5 measured figure 3 against 4
  DObjects.
- Counting contained instances amends R-JS-6's «as the status bar counts them».
- Recommended: a ticket. Out of this lane.

## 5. Phase 2 plan (Rule 19: more than five files, listed for the GO)

1. **`jjscript/executor/runPasses.ts`**
   - `M1_DEFERRABLE_ERROR_CODES`.
   - `isDeferrable` reads both sets.
2. **`jjscript/parser/parser.ts`**
   - `in <Parent>.<ref>` after the name string.
   - `.ref` required for `instance`.
   - Instance branch kept out of the qualified-name override.
3. **`jjscript/executor/commands/instance.ts`**
   - `create … in`, with the six checks of §4.4 and `DObject.new(…, slot, DValue, …)`.
   - Model-wide `findInstanceByName` (D3).
4. **`jjscript/executor/dependencies.ts`**: an instance parent is `required: true`.
5. **`jjscript/executor/elementWaiter.ts`**: M1 readiness, D4.
6. **`jjscript/executor/handleRegistry.ts`**: the per-run count of pending children per slot (additive).
7. **`constants/defaultPrompts.ts`**: the M1 section, version 5.
8. **`jjodie-integration/jjscriptGenerationPrompt.ts`**: the same M1 section.
9. **Tests**
   - New: `jjscript/executor/__tests__/m1Containment.test.ts` (handlers with the mocked joiner, as `handleRegistry.test.ts:19`).
   - Appended to existing files, which stay untouched otherwise: `executor/__tests__/runPasses.test.ts`,
     `__tests__/parser.test.ts`, the waiter tests.
10. **`frontend/scripts/probe/jjscript-m1-containment.ts`**: an `after` mode with the acceptance checks. Also every
    `Transition` under its source `State` in the tree, zero failed lines, and crops at 600 px.

Docs: `docs/decisions.md` (R-JS-8..), `docs/log-inbox/jjscript.md`, the prompt's Status line.

**Layer note.** Item 3 is a D-layer write (`DObject.new` with a `DValue` father), which the prompt names. No sync file
is touched, and `useJjomSync.ts`, `canvasToJjom.ts`, `portDistribution.ts` and `viewpoint/ir/` are not needed.

What the canvas draws for a Transition born in a slot was not measured. The default view of DemoESM draws Transitions
as edges after a derived notation (`object-edge-delete.ts` header). It belongs to the canvas lane, and the Phase 2 crop
will show it.

**Baseline [measured on `c1a49f5eb`].**
- `npm run typecheck`: 14 errors, exit 2, the §17 count.
- `npx vitest run src/jjscript`: 500 passed in 20 of 21 files; `context-binding.test.ts` red at import
  (`window is not defined`, known).
- `npm run typecheck:scripts` exit 0; `check:scripts` PASS (51 files).

## 6. Risks

- **R1.** The model-wide lookup (D3) makes some names ambiguous that resolve today: a root and a contained instance
  sharing one. That case cannot arise from a root-only script, so the exposure is to models built by hand.
- **R2.** The readiness wait relies on `instanceof`, slots and the `objects` entry landing together. Measured on four
  instances in two runs, it is a fact about the current `Constructors`/`UpdatingTimer`, not a contract.
- **R3.** Every forward parent costs up to 500 ms in pass 1 (required dependency), as R-JS-3 accepted for M2 (its R3).
- **R4.** `set +=` keeps producing the Q2 hybrid for scripts that still attach late, and (a) will now make those lines
  succeed on retry. The tree hides the hybrid, but the canvas probably does not.
- **R5.** One console error, seen only in fixture mode: `Invalid action path 0 … key: <project id>` from
  `reducer.ts:43`, on the imported project. Not seen in seed mode, not investigated, not this lane's.
- **R6.** `set s1.transitions = t1` left `[t1]` once and `[t1, null]` twice (§4.3). The excess-removal path of
  `set_values` (`LModelElement.tsx:8018-8021`) depends on timing. Not this lane's.

## 7. Open questions

1. Syntax: both orders, `"<name>" in <Parent>.<ref>` documented? Recommended: yes, `.ref` mandatory, no ref inference.
2. D3, model-wide M1 name lookup, in this lane? Recommended: yes, with D4. Otherwise what (b) creates cannot be addressed
   by the next reply (§4.5 item 2).
3. Upper bound counted with this run's pending children (`handleRegistry.ts`, additive)? Recommended: yes.
4. Q6 orphan notice and the contained-instance figure: this lane or tickets? Recommended: tickets; R-JS-6 amended in its own lane.
5. The `set +=` hybrid (§4.3): a ticket for the L-layer, `LModelElement.tsx:7916` and `:8010`, named to the canvas
   lane as the probable cause? Recommended: yes, no core change here (Rule 5).
6. `jjscriptGenerationPrompt.ts` has no importer: align it or mark it `TODO: cleanup`? Recommended: align the M1
   section, fix the false «Mixed» line, keep the file.

## Addendum 2026-10-04 — Phase 2

The GO of the chat adopted D1-D4, Q3 (upper bound with this run's pending children) and Q5, as R-JS-8..11 (provisional), and
kept D5 out of the lane as tickets. Code: `602f64413` (R-JS-8), `9916cefce` (R-JS-9..11), `9163f0b28` (prompts),
probe `ffb23e6dd`.

**Probe, `JSM1_TAG=after`, fixture mode, port 3096 [measured on `ffb23e6dd`]. All checks PASS, exit 0.**
- E1, the script as written today: `Script executed`, 24 commands, «8 resolved on retry (lines 3, 5, 6, 8, 12, 15, 18, 21)», no
  `not found` left, every event linked once. The containment lines now succeed on retry and leave the §4.3 hybrid: the
  Transitions keep a place in `model.objects` and the canvas draws them as nodes as well as chips (`after_E1_canvas_600.png`).
- E2, the microwave with `in`: `Script executed`, 20 commands, «7 resolved on retry (lines 7, 9, 10, 13, 14, 15, 16)», 0 errors;
  `tStart@idle.transitions`, `tOpen@cooking.transitions`, `tDone@cooking.transitions`, `tClose@doorOpen.transitions`, none in
  `model.objects`; the tree nests each under its State. The canvas shows them as chips of their State node, with no Transition
  node (`after_E2_canvas_600.png`, `after_E2_tree_600.png`). E2b: a later reply renames `tClose` by name, 0 errors.
- E4: the contained child found by name in a new run (was `INSTANCE_NOT_FOUND`); a same-run `set` on it in 1 ms (was 522-549 ms).
- E6 unchanged: a fresh instance's metaclass and slots land 267-362 ms after its create; the handler called directly at return
  still answers `NO_METACLASS` (it is the wait that covers it, R-JS-11).

**New finding, E7 [measured on `ffb23e6dd` and on the base `8f84740c6`, identical].** A `set <s>.transitions += <x>` link
reaches the store 84-89 ms after the command returns, and the M1 link reads the slot's committed values and writes them back
plus one id (`instance.ts`, link branch, `refProxy.values = [...meaningful, targetInstance.id]`). Two such lines 20 ms apart
through Run keep the second only: `s.transitions = [a, c]`, `b` with `s.transitions` as father but absent from it. Pre-existing;
R-JS-8 makes legacy scripts reach it more often (E1: `tOpen` lost from `cooking.transitions`, line 5 then line 6 on pass 2).
`create … in` is not affected: its child is appended by the constructor. Ticket in `docs/log-inbox/jjscript.md`. The base was
measured in a temporary detached worktree of `8f84740c6` (`/tmp/jjsm1-base`, port 3097) with a temporary `node_modules`
symlink, both removed after.

**Mutation bench, 28/28 killed** (`runPasses.test.ts`, `parser.test.ts`, `m1Containment.test.ts`, `elementWaiter.test.ts`,
`handleRegistry.test.ts`): the M1 set read or emptied, both parser branches, the class path override, father and father type,
`args.parent` ignored, each of the six checks, the pending count (dropped, doubled, off by one, not recorded, kept after delete,
kept across runs), the lookup roots-only, non-objects counted, roots-only auto-name, bare handle hit as ready, registry ignored,
the wait never resolving, the dependency not required. Not run: removing the lookup's dedupe, which loops forever on the cycle
test by construction.

**Gates.** Typecheck 14, the §17 set. Full vitest 7330 passed, 0 failed, the 9 files of §17 red at import; jjscript 541 in 21 of
22 files (500 before). Build exit 0 (14 min 35 s under load, chunk-size and Sass deprecation warnings only). `typecheck:scripts`
exit 0, `check:scripts` PASS.
