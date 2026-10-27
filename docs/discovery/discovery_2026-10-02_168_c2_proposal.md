# Discovery — #168 C2 (J4), the consumer sees Jodie's proposal and applies it (Phase 1)

**Prompt-ID**: P-2026-10-02-2215
**Prompt file**: `docs/prompts/claude_2026-10-02_2215_prompt_168_c2_proposal.md`
**Session**: af4c7481-05dd-4563-b04e-a2a86d2f869d (from this session's scratchpad path; the banner shows no id)
**Tree / HEAD**: `/Users/juridirocco/development/jjodel-168-proposal`, branch `168-proposal`, `4e2382f36` ("docs(#168): lane prompts C2 (consumer proposal) and D (Jodie's voice)")
**Executor**: Anthropic Claude Opus 5.5
**Stato**: Phase 1, read-only on the code. No tracked file under `frontend/` was modified. The scratchpad scripts `parse_probe.ts` and `load_probe.mts` ran the parser and the imports in `node`. No browser probe ran in this phase.

This report is a set of hypotheses with evidence, not a definitive reference. Whoever acts on it rereads the real files. MEAS = measured in this phase on `4e2382f36`; READ = code or report reading only.

---

## 0. Answer in brief

- **Where the branch goes**: in `CodeBlock` (`MarkdownRenderer.tsx:73`), after the hooks and before `if (jjscriptMode)` (`:100`), on `isConsumerMode()` and an executor. The developer path is unchanged, byte for byte.
- **Execution**: «Apply» calls the `onJjScriptExecute` it receives, once per line, as `ScriptBlock` does (`ScriptBlock.tsx:467`). That callback is already bound to the reply's scope (`ChatMessages.tsx:72-75`). The handler drops `data` and `affectedElements` (`:438-446`, a lane D file), so the created ids come from the handle registry (`instance.ts:392` `registerHandle(instanceName, dObject.id)`) and the existing ones from the store by name.
- **Descriptions**: the parser runs in `node` (MEAS). Attribute vs reference vs containment, and what can sit at the root, come from the store through an adapter in `ConsumerProposal.tsx`. The pure module `consumerProposal.ts` takes a plain «world» object.
- **Failures**: in consumer mode the guard runs before the handler, so a name not found or ambiguous arrives as `PROFILE_UNRESOLVED` carrying the handler's sentence (`executor.ts:383-384`), not as `INSTANCE_NOT_FOUND`.
- **State**: closing Jodie unmounts the messages (`Jodie.tsx:865`). With local state, «Apply» would come back and apply the proposal a second time.
- **Selection**: a new `EnvGenEvents.CONFIGURATOR_SELECT_INSTANCE` event `{ instanceId }`. For a nested element, the Configurator opens the row of the nearest top-level ancestor and drills down (`pathTo`, `multiDraw.ts:142`).
- **Code files: 7** (DOVE confirmed, Rule 19): `consumerProposal.ts` and its test, `ConsumerProposal.tsx` and `.scss`, `MarkdownRenderer.tsx`, `registry.ts`, `ConfiguratorTab.tsx`. `npx tsc --noEmit` baseline: 14, the §17 set (MEAS).
- **Decisions awaiting Alfonso (RC-26)**: none. No §3.1 file and no interface changed. `U.userHasInteracted` is raised on a user gesture outside editor-v2, which is compatible with R-UNDO-2 (§3.6).

Questions, each with its recommendation:
1. Where does the consumer branch sit, and which blocks does it cover?
   Recommended: in `CodeBlock`, for a block labelled `jjscript`/`jjs` or recognised by the developer heuristic, single-line blocks included, only when an executor is passed.
2. Where does a proposal's state (applying, applied, failed, discarded) live?
   Recommended: in a store in `consumerProposal.ts` keyed by the script text, read with `useSyncExternalStore`. Declared limit: a later byte-identical script shows the earlier outcome.
3. A step fails: stop or continue?
   Recommended: stop at the first failure. The step shows why it failed, and the steps after it show «Not applied».
4. What does the check before «Apply» refuse?
   Recommended: three things. An unreadable line. Any step that is not a create, set, rename or delete of elements. A create of a type that cannot sit at the root unless a later `set` puts it in a containment slot: the owner must resolve, the slot must accept the type, and the profile must let the user change the owner's type.
5. Which element ends up selected after «Apply»?
   Recommended: the first created element that no other new element points to; otherwise the element changed by the first applied step; nothing when the proposal only deletes.
6. How does the Configurator reach a nested element?
   Recommended: the row of the nearest visible top-level ancestor, then `nav` from `pathTo`. The selection is applied by an effect declared after the two reset effects (`ConfiguratorTab.tsx:133`, `:166`), with a deadline.
7. Where do the failure messages come from?
   Recommended: the guard's own sentence for `PROFILE_*` except `UNRESOLVED`. For the name family, the name is read from the executor's sentence and checked against the world (absent, ambiguous, or nested). A sentence per code for the rest. The technical text is never shown.

Tickets proposed at closure (not fixed here): «Test in console mode» and «Source» under a proposal message (lane D); name lookup only among roots, so a nested element cannot be changed (§3.7); an unquoted name in `create instance of X name` is dropped (§3.3, C1 prompt).

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|-----------|---------|----------|
| H1 | The consumer branch can sit in `CodeBlock` without changing the developer path | **holds** | READ `MarkdownRenderer.tsx:73-111`, §3.1 |
| H2 | The per-command result carries the id of the created or changed element (`affectedElements`) | **falsified on the proposal's path** | READ `ChatMessages.tsx:437-446` maps 5 fields; `instance.ts:397-404` has `data`/`affectedElements`, dropped on the way (§3.2) |
| H3 | The parser alone is enough to describe a step | **partly** | MEAS AST shapes (§3.3); the kind of feature, containment and `rootable` need the metamodel (§3.4) |
| H4 | Component state is enough for Apply/Discard | **falsified** | READ `Jodie.tsx:862-866`, `MarkdownMessage.tsx:52-63`, `ChatMessages.tsx:69-71` (§3.5) |
| H5 | The Configurator selects from outside with type plus row | **partly** | READ the reset effects `ConfiguratorTab.tsx:133`, `:166` clobber a same-commit set; a nested element needs `nav` (§3.8) |
| H6 | In consumer mode, a name not found arrives as `INSTANCE_NOT_FOUND` / `AMBIGUOUS_INSTANCE` | **falsified** | READ `executor.ts:130-141`, `:383-384`, `permissionGuard.ts:219-220` (§3.7) |
| H7 | Ctrl+Z undoes an applied proposal once `U.userHasInteracted` is raised | **holds per M0** (measured there, 2 presses for 4 lines), not re-measured here | READ `discovery_2026-10-01_168_m0_measures.md` §5.1; Phase 2 probe measures it (§3.6) |

## 2. Files read

In full: `CLAUDE.md`, `docs/PROTOCOL.md`, `frontend/src/styles/CLAUDE.md`, `frontend/src/jjscript/CLAUDE.md`, `frontend/scripts/smoke/README-probes.md`, `docs/log-inbox/jodie-consumer.md`, `docs/discovery/discovery_2026-10-01_168_m0_measures.md`, `docs/discovery/discovery_2026-10-01_168_a_context.md`, `frontend/src/components/common/MarkdownRenderer.tsx`, `frontend/src/components/Jodie/MarkdownMessage.tsx`, `frontend/src/jjscript/executor/handleRegistry.ts`, `frontend/src/joiner/environmentConfig.ts`, `frontend/src/components/environment/consumerMode.ts`, `frontend/src/components/environment/ConfiguratorTab.tsx`, `frontend/src/jjform/nav.ts`, `frontend/src/jjscript/services/JjScriptService.ts` (head to `:120`, the class body), `frontend/src/common/libraries/projectModified.ts`.

By window: `docs/decisions.md` 1-272 (Processo, RC-3..RC-32), 2960-2980 (R-UNDO), 4371-4395; `docs/discovery/discovery_2026-10-01_168_b_guard.md` 1-150; `docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md` 1-110; `docs/prompts/claude_2026-10-02_1255_prompt_168_c1_executor_prompt.md` (whole), `_2216_prompt_168_d_voice.md` 1-80; `frontend/src/components/Jodie/ChatMessages.tsx` 1-200, 320-520; `frontend/src/jjscript/components/ScriptBlock.tsx` 1-180, 250-480; `frontend/src/jjscript/types.ts` 36-500; `frontend/src/jjscript/executor/commands/instance.ts` 55-875; `frontend/src/jjscript/executor/executor.ts` 40-70, 95-160, 349-440; `frontend/src/jjscript/executor/permissionGuard.ts` 60-230; `frontend/src/components/abstract/tabs/InstanceDetail.tsx` 223-330; `frontend/src/components/editor-v2/hooks/multiDraw.ts` 1-30, 99-177; `frontend/src/components/Jodie/Jodie.tsx` 800-880 plus grep; `frontend/src/components/Jodie/JodieWindow.tsx` 180-215; `frontend/src/contexts/TreeViewPanelContext.tsx` 300-380; `frontend/src/pages/components/Navbar.tsx` 1060-1260, 1985-2000; `frontend/src/common/libraries/lastSaved.ts` 55-100; `frontend/src/model/logicWrapper/LModelElement.tsx` 3084-3096; `frontend/src/components/environment/consumerJodieContext.ts` 1-40 plus export list; `frontend/src/events/registry.ts` (`JjScriptEvents`, `EnvGenEvents`); `frontend/src/styles/tokens/_colors-light.scss` (token names only); lane A's fixture and probe, read-only: `/Users/juridirocco/development/jjodel-168-context/frontend/scripts/smoke/_tmp_168_a_verify.ts` 1-90, `.../scratchpad/p0/fixture.json`, `S1_dev_model_tab-body.json` (metamodel shape).

Not read: `ScriptBlock.tsx` 480-1579 (the dialogs and the step mode, which the consumer branch does not use), the rest of `decisions.md` (domain series).

## 3. Findings

### 3.1 How `CodeBlock` picks `ScriptBlock` (READ)

`MarkdownRenderer.tsx:93-97`:
```
const couldBeJjScript = !isSingleLine && (
    language === 'jjscript' ||
    language === 'jjs' ||
    isJjScriptCode(code)
);
```
`:100-111`: `if (jjscriptMode) { return ( <div className="md-jjscript-wrapper"> <ScriptBlock code={code} onExecute={onJjScriptExecute} … /> …`, where `jjscriptMode` turns true only on the «Run» click (`:124-133`). Every hook of `CodeBlock` (`useState` ×2, `useCallback`) is called before `:87`, so an early return placed after them breaks no hook order. A one-line `jjscript` block gets no «Run» today (`!isSingleLine`). A single-command proposal is a legitimate case for the consumer, so the consumer branch does not inherit that restriction (question 1).

The renderer is mounted only by `MarkdownMessage.tsx:57-61`, and `MarkdownMessage` only by `ChatMessages.tsx:175-179` (MEAS, `command grep -rn -E "MarkdownRenderer|onJjScriptExecute"` over `frontend/src`, exit 0; the hits are the `Jodie/` chain and `TreeViewPanelContext.tsx`, which matched only `handleJjScriptExecuted`).

### 3.2 What execution returns, and where the ids come from (READ)

`ChatMessages.tsx:72-75` binds each reply to its scope: `(commands: string[]) => onJjScriptExecute!(commands, scope)`. `:437-446`:
```
const result = await JjScriptService.execute(command, scope);
results.push({
    command,
    success: result.success,
    message: result.message,
    warnings: result.warnings,
    …
    errors: result.errors,
});
```
`data` and `affectedElements` (`types.ts:448-457`; filled by `instance.ts:397-404` on create) do not get through. `ChatMessages.tsx` is a lane D file, so it is not opened. Without the scope (`:419-425`) or the project, the handler answers `success: false` **without `errors`**, with a sentence written for the developer.

The ids:
- **Created**: `instance.ts:392` `registerHandle(instanceName, dObject.id);`, where the handle is the quoted name or the generated one. The registry is cleared on `JjScriptEvents.EXECUTION_START` (`handleRegistry.ts:80` `window.addEventListener(JjScriptEvents.EXECUTION_START, clearHandles);`). The proposal therefore dispatches `EXECUTION_START` before its loop, as `ScriptBlock.tsx:407` does. Otherwise a handle from an earlier run would turn `create … "h"` into `HANDLE_IN_USE` (`instance.ts:350-357`). It reads `getHandleId(handle)` right after the loop, before any other run.
- **Pre-existing**: the world's name → ids map, taken before «Apply» (§4.2).

Other listeners of the start and end events (MEAS, grep `EXECUTION_START|EXECUTION_END|JjScriptEvents.EXECUTED`): `TreeViewPanelContext.tsx:364-367` (badges, no forced open), `JodieWindow.tsx:195` (clears the executing indicator) and `useMetamodelGeneration.ts` (dispatcher only). Nothing in them writes the model.

### 3.3 The parser describes the shape, not the meaning (MEAS)

`parse()` from `jjscript/parser/parser.ts` run through `npx tsx` (scratchpad `parse_probe.ts`):

| line | AST (`args`) |
|---|---|
| `create instance of Competency "teamwork"` | `{elementType:"instance", name:"Competency", options:{defaultValue:{kind:"string",value:"teamwork"}}}` |
| `create instance of Competency teamwork` | `{elementType:"instance", name:"Competency"}`: **the unquoted name disappears** |
| `set s1.competencies = teamwork` | `{target:{segments:["s1"]}, property:"competencies", value:{segments:["teamwork"],raw:"teamwork"}, operator:"="}` |
| `set s1.title = "Hello"` | `value:{kind:"string",value:"Hello"}` |
| `set s1.lead = null` | `value:{kind:"null"}` |
| `set s1.kind = Kind.Big` | `value:{segments:["Kind"],member:"Big",raw:"Kind.Big"}`: a name, not a literal |
| `set s1.people += p2` | `operator:"+="` (today the handler ignores it, `instance.ts:838-841`) |
| `delete instance c1` / `delete c1` | `{target:{segments:["c1"]}, elementType:"instance"}` / without `elementType` |
| `rename instance c1 to c2` | `{target:{segments:["c1"]}, newName:"c2", elementType:"instance"}` |
| `do` | `{command:"block", commands:[]}`: a multi-line block does not survive the line split |
| `set "my scenario".title = "x"` | parse error: a name with spaces cannot be addressed |

`create instance of X teamwork` runs and produces `X`, `X2`… (`instance.ts:277-280`, `:343`), and a later `set s1.r = teamwork` then fails. The AST keeps no trace of it, so the proposal cannot flag it. It goes into the C1 prompt as a ticket: always quote names.

The split is `ScriptBlock`'s (`ScriptBlock.tsx:259-264`: `.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('#') && !l.toLowerCase().startsWith('target '))`), and the proposal reuses that predicate. `types.ts` has no imports and the parser imports only `./lexer`, `./grammar` and `../types`. MEAS `load_probe.mts`: `parse`, `pathTo`, `drillInto`, `navFor`, `topLevelReason` and `getHandleId` load in `node`. The positive control holds: the `joiner` barrel fails (`Unknown file extension ".scss"`), so the bench can tell the two apart.

### 3.4 Attribute, reference, containment, root: the source is the store (READ)

The handler distinguishes by the class of the resolved instance (`instance.ts:232-240` `classifyMetaclassProperty`: an attribute wins over a reference of the same name), and a `null` clears (`:751`). Containment and `rootable` are properties of the metamodel: `LModelElement.tsx:3091-3095`:
```
protected get_rootable(c: Context): this["rootable"] {
    …
    if (c.data.rootable !== undefined) return c.data.rootable;
    else return this.get_instantiable(c) && !this.get_isComposed(c);
}
```
`topLevelReason` (`environmentConfig.ts`, the last function) reads the same rule and names the owners (`isComposedBy[].father.name`).

There are two candidate sources:
- **The context of the reply** (the envelope sent to the model) is built in `Jodie.tsx` at send time and is not saved on the message as far as `CodeBlock` can see. `CodeBlock` receives only `code` and the callback, so this source is not reachable.
- **The store** is reachable. The adapter in `ConsumerProposal.tsx` reads the L-layer: the metamodel of the model of `getConsumerSelection()` (`consumerJodieContext.ts`, lane A, read-only import), with `allAttributes`, `allReferences` (`containment`, `upperBound`, `type`), `rootable` and `superTypes`. For the model it reads every element with its name, class and whether it is a root. It falls back to the project's first metamodel.

The boundary of the pure part is `consumerProposal.ts`, which takes that plain object. The selection may change between the reply and «Apply». The world only drives the descriptions and the checks; the execution stays in the reply's scope (§3.2). That gap is declared in §6.

### 3.5 A proposal's state does not survive in the component (READ)

- `Jodie.tsx:855-866`: on close, `setWindowVisible(false); exitTimeout = window.setTimeout(() => { setWindowRendered(false); }, JODIE_EXIT_DURATION_MS);`, so `JodieWindow` leaves the tree and every `CodeBlock` with it. `:823`: «History is non-persisted, so we just filter the in-memory unified array.» The messages stay in `chatState`, and on reopening they render from scratch.
- `MarkdownMessage.tsx:52-63`: the «Source» toggle replaces `MarkdownRenderer` with `<pre>` and back, which is another remount.
- `ChatMessages.tsx:69-71`: «MarkdownRenderer rebuilds its component map whenever this callback changes identity, which would remount an open ScriptBlock and drop it mid-run». `createMarkdownComponents` builds a new `code` function on every render (`MarkdownRenderer.tsx:303-305`), and `handleJjScriptExecute` changes identity when `projectContext` changes (`ChatMessages.tsx:462`).

With state in `useState`, a consumer who closes and reopens Jodie sees «Apply» again, and a second click creates the same elements a second time. Question 2's store holds the state by script text, and the component reads it with `useSyncExternalStore` (React `^18.3.1`, `frontend/package.json:53`). A loop that is running writes its progress into the store, so a mid-run remount loses nothing. The module state is reset in `beforeEach` (P11).

### 3.6 Undo, «Unsaved», and R-UNDO-2 (READ)

- `U.tsx:211-212`: `public static userHasInteracted: boolean = false;` and `public static isProjectModified: boolean = false;`. M0 §5.1 measured that, with the flag off in consumer mode, Ctrl+Z is a no-op; with it on, 4 lines are undone in 2 presses, the first leaving an intermediate state. The Navbar handler intercepts it in every `PROJECT_EDITOR` context, focus included (`Navbar.tsx:1209-1215` `UndoAction.new(1, user?.id, false).commit();`).
- R-UNDO-2 (`docs/decisions.md`, R-UNDO): «Editor-v2 lo alza al primo pointerdown o keydown sul pannello … Nessun altro scrittore del flag in editor-v2.» The new writer is not in editor-v2, it is raised on a user gesture (the «Apply» click, not a boot write), and it is Juri's decision (a) for J4. I read this as no amendment to R-UNDO-2, so nothing waits for Alfonso. Declared side effect: from the first «Apply» on, the consumer's own Configurator edits become undoable too, which they are not today.
- «Unsaved»: `LastSavedIndicator` is mounted for developer and consumer alike (`Navbar.tsx:1993` `{project && <LastSavedIndicator />}`). It rereads the flag on a 10 s tick (`lastSaved.ts:58` `LAST_SAVED_TICK_MS = 10_000`, `:81-87`), like every other writer of the flag (`formWrite.ts:160` …). The immediate feedback is the proposal's own «Applied» state. The probe waits for the tick (at most about 11 s).

### 3.7 What the consumer sees when a step fails (READ)

In consumer mode the guard runs before the handler (`executor.ts:130-141`), and for `set`/`rename`/`delete` it resolves the name itself (`:383-384`: `const instanceName = args.target.segments.join('::') || args.target.raw;` / `const resolved = resolveInstanceHandle(model, instanceName);`). A name that does not resolve becomes `{ unresolved: resolved.reason }`, which `permissionGuard.ts:219-220` returns as `{ code: 'PROFILE_UNRESOLVED', message }`. `create` of an unknown class does the same, with «Class 'X' not found in metamodel» (`executor.ts:368-370`). So the consumer never sees `INSTANCE_NOT_FOUND`/`AMBIGUOUS_INSTANCE` on the subject, only `PROFILE_UNRESOLVED` with a developer sentence («No instance named 'x' in 'scen_a'», «Ambiguous instance name 'x': …», `instance.ts:166-170`).

What the consumer gets:
- **The guard's own codes** are already plain language: «You can't create Learner elements in this environment.» (`permissionGuard.ts:215`), «You can't link to … elements in this environment.» (`:154-155`). They are shown verbatim, `PROFILE_UNRESOLVED` excepted.
- **The name family** (`PROFILE_UNRESOLVED`, `INSTANCE_NOT_FOUND`, `AMBIGUOUS_INSTANCE`, `CLASS_NOT_FOUND`): the name is read from the executor's sentence and checked against the world.
  - Ambiguous: «More than one element is called "x", so it isn't clear which one is meant.»
  - Absent: «There is no element called "x".»
  - Absent from the roots but present nested: «"x" is inside another element, and changes to it can't be made from here yet.»
  - Class not found: «"X" isn't a kind of element in this project.»
  - Unrecognised sentence: a generic plain one.
- **The nested case is real.** `findInstanceByName` searches only the roots (`instance.ts:117-120` `const objects = (model as any).objects ?? []; return objects.filter(…)`). Any element that is visible nested in the Configurator cannot be changed by a proposal: `Phase_0` in the fixture, or the very `ph1` that «Apply» has just put inside `Scenario_0`. This is question 2 of report R, never carried into C1's prompt. Ticket at closure.
- **The other codes** get a sentence each: `UNKNOWN_PROPERTY`, `TYPE_MISMATCH`, `ABSTRACT_CLASS`, `SINGLETON_CLASS`, `SINGLETON_INSTANCE`, `NAME_CONFLICT`, `HANDLE_IN_USE`.
- **No `errors`** (the handler refuses for lack of a scope or project): «This change can't be made from here. Select an element in the list, then ask Jodie again.» Default: «This change could not be made.»

Codes emitted by the executor (MEAS census, `command grep -rhoE "code: '[A-Z_]+'" frontend/src/jjscript/executor`): 72 distinct ones, most of them M2. Those reachable by the four instance commands are listed in `instance.ts` at lines 268-862.

### 3.8 How the Configurator selects from outside (READ)

- State: `ConfiguratorTab.tsx:68-69` (`selectedTypeId`, `selectedInstanceId`), `nav` at `:165`. Two reset effects: `:133` `useEffect(() => { setSelectedInstanceId(null); setCreateFailed(false); }, [selectedTypeId]);` and `:166` `useEffect(() => { setNav(null); }, [selectedInstanceId]);`. Setting all three in one handler would leave the instance and `nav` null after the effects. The selection is therefore applied by an effect declared **after** those two and keyed on `[idlookup, selectedTypeId, selectedInstanceId, tick]`. It does one step per commit: type, then row, then `nav`. Within the same commit its `set` comes after the reset's, and React keeps the last one. A pending request has a deadline, so one that never resolves does not take over a later selection.
- The listener mirrors the one for the type (`:115-123`, `isPage` only).
- A nested element: `pathTo(idlookup, id)` (`multiDraw.ts:142-177`) gives the road from the root, each step carrying the slot it was reached through (`childKey`). The row is the nearest ancestor whose class is in `visibleTopLevelTypes` (rows include nested instances, lane A report §4.6). `nav = { path: road.slice(i) }`, with `childKey: null` on the row, the way `InstanceDetail.drillTo` seeds it (`InstanceDetail.tsx:303-306`). The form then shows the element itself (`formSubjectId`, `:263-268`). Lane A's `consumerFocusOf` takes the deepest step, so Jodie follows. A step of a hidden type on the road: row only, `nav` null (`drillTo` refuses hidden elements, `:297`).
- Resolution is the pure function `configuratorTargetOf(idlookup, topTypeIds, instanceId, isHidden)` in `consumerProposal.ts`, tested on the bench (`pathTo` and `nav.ts` have no live imports, MEAS §3.3).

## 4. Proposed design

### 4.1 The `CodeBlock` branch (`MarkdownRenderer.tsx`)

```tsx
// #168 J4 — in the stand-alone consumer a JjScript block is Jodie's proposal: a readable list
// with Apply and Discard (`ConsumerProposal`), never the developer's editor.
if (isConsumerMode() && onJjScriptExecute
    && (language === 'jjscript' || language === 'jjs' || couldBeJjScript)) {
    return <ConsumerProposal code={code} onExecute={onJjScriptExecute} />;
}
```
It sits after `couldBeJjScript` and before `if (jjscriptMode)`, with two imports added. It needs no new prop and no change to the interface.

### 4.2 The pure module `components/Jodie/consumerProposal.ts`

Its imports are `jjscript/parser/parser`, `jjscript/types` (types), `editor-v2/hooks/multiDraw` (`pathTo`) and `jjform` (types only), all bench-loadable.

```ts
export interface ProposalWorld {
    classes: Record<string, { rootable: boolean; editable: boolean; superTypes: string[];
        attributes: string[]; references: { name: string; containment: boolean; upper: number; type: string }[] }>;
    elements: Record<string, { id: string; className: string; root: boolean }[]>;   // by name, the scope model
}
export interface ProposalStep { line: string; kind: 'create' | 'attribute' | 'link' | 'contain' | 'clear'
    | 'delete' | 'rename' | 'unsupported' | 'unreadable'; text: string; /* names it touches */ }
export function readProposal(code: string, world: ProposalWorld): { steps: ProposalStep[]; blocked: string | null };
export function failureText(step: ProposalStep, result: { message: string; errors?: { code: string; message: string }[] }, world: ProposalWorld): string;
export function proposalFocus(steps: ProposalStep[], applied: boolean[]): { handle: string; created: boolean } | null;
export function configuratorTargetOf(idlookup, topTypeIds: readonly string[], instanceId: string, isHidden?: (classId: string) => boolean)
    : { typeId: string; rowId: string; nav: NavState | null } | null;
// the outcome store, by script text
export function proposalOutcome(code: string): ProposalOutcome | undefined;
export function setProposalOutcome(code: string, o: ProposalOutcome): void;
export function subscribeProposals(fn: () => void): () => void;
export function resetProposals(): void;   // tests
```

The texts, with no M1, M2, metaclass, instance or JjScript in them (the test runs the vocabulary over every text it produces):
- «Create Competency "teamwork"», or «Create a new Competency» when there is no name.
- «Set Title of s1 to "x"» (feature in human case), «Clear Title of s1».
- «Link s1 to p1 (Lead)», «Put c1 inside s1».
- «Rename c1 to "c2"», «Delete c1».
- «A step that can't be done here» for an unsupported command.

The `blocked` reasons:
- «Part of this proposal could not be read, so nothing will be changed.»
- «This proposal includes a step that can't be done here.»
- «"ph9" (a new Phase) has to go inside another element, and this proposal doesn't say which one.», plus variants for an owner that does not resolve, a slot that does not accept the type, and an owner the profile cannot change.

### 4.3 `ConsumerProposal.tsx` + `.scss`

On screen, top to bottom:
- A heading, «Jodie suggests these changes».
- The list of steps. After «Apply» each step carries its state: applied, not applied with the reason, or «Not applied, because an earlier change failed».
- The `blocked` notice, when there is one.
- «Apply» (primary, slate) and «Discard».
- After applying, the line «Undo with Ctrl+Z (⌘Z on Mac): it goes back one step at a time, so it may take more than one press.»
- `<details>` «Details», closed, with the script.

«Apply»:
1. Set state `applying`.
2. `U.userHasInteracted = true`.
3. Dispatch `JjScriptEvents.EXECUTION_START`.
4. Run each line with `await onExecute([line])`, stopping at the first failure.
5. Dispatch `EXECUTION_END`.
6. If at least one step was applied, `U.isProjectModified = true`.
7. Work out the focus: the handle → `getHandleId` for an element created in this run, otherwise the world map taken before the run. Dispatch `EnvGenEvents.CONFIGURATOR_SELECT_INSTANCE` with `{ instanceId }`.
8. Set state `applied` or `failed`.

«Discard» only sets the state. It writes nothing.

The stylesheet uses only existing tokens (`--color-success`, `--color-error-text`, `--color-warning-bg`, `--color-text-secondary`, `--color-border-primary`, `--color-bg-secondary`, MEAS on `_colors-light.scss`). It defines no variables (Rule 28) and uses no legacy tokens (Rule 27).

### 4.4 `registry.ts` and `ConfiguratorTab.tsx`

`EnvGenEvents.CONFIGURATOR_SELECT_INSTANCE: 'envgen-configurator-select-instance'`, detail `{ instanceId }`. MEAS census: neither the name nor the string occurs in `frontend/src`; the only hits are the M0 report's recommendation. Positive control: `CONFIGURATOR_SELECT_TYPE` occurs in 3 files.

In `ConfiguratorTab`, `isPage` only:
- the listener, which writes `pendingSelectRef = { instanceId, deadline: now + 3 s }` and bumps a `tick`;
- the effect of §3.8, after `:166`.

## 5. Files (Rule 19: 7 code files, the DOVE list unchanged)

| file | change |
|---|---|
| `frontend/src/components/Jodie/consumerProposal.ts` | new, pure: §4.2 |
| `frontend/src/components/Jodie/__tests__/consumerProposal.test.ts` | new: descriptions, containment check, failure messages per code, focus, `configuratorTargetOf`, outcome store; reset in `beforeEach` |
| `frontend/src/components/Jodie/ConsumerProposal.tsx` | new: the component and the world adapter |
| `frontend/src/components/Jodie/ConsumerProposal.scss` | new, paired sheet |
| `frontend/src/components/common/MarkdownRenderer.tsx` | the consumer branch in `CodeBlock`, 2 imports |
| `frontend/src/events/registry.ts` | one constant in `EnvGenEvents` |
| `frontend/src/components/environment/ConfiguratorTab.tsx` | listener and selection effect |

Docs: this report; at closure `docs/log-inbox/jodie-consumer.md` and the prompt's Status line. Probes `frontend/scripts/smoke/_tmp_168_c2_*.ts`, untracked, port 3047.

Mutation bench, planned:
- no reference-vs-attribute distinction;
- no containment check;
- containment accepted without the slot's type;
- containment accepted without the owner's permission;
- `PROFILE_TYPE_LOCKED` sentence not passed through;
- nested case read as absent;
- focus = first created even when pointed at;
- `configuratorTargetOf` without the ancestor (row = the element);
- outcome store keyed by line instead of script.

## 6. Dependencies and risks

- **C1** (`168-exec`, merges first): it changes `set` on a single reference (replace) and the writes still pending. Nothing here depends on it. The probe makes one `set` per slot. The C1 prompt v5 will teach the containment pattern, which is exactly what the check in §4.2 enforces.
- **D** (`168-voice`): `ChatMessages.tsx:182-190` shows «Test in console mode» under any message with a code block, proposals included. The «Source» toggle (`MarkdownMessage.tsx:65-72`) exposes the raw script, and toggling it remounts the proposal; the store of §3.5 covers that. Both items belong to D (tickets).
- **World vs scope**: the world is built from the current selection, the execution uses the reply's scope. If the user moves to another model between the reply and «Apply», the texts and the check are computed on the wrong model. Rare in an environment with one model per metamodel; declared.
- **Same text, same state**: a later reply with a byte-identical script shows the earlier outcome (question 2). The other keys within reach were measured as unusable: the message id is unreachable without touching D's files, and the callback identity changes on reopen.
- **Stopping at the first failure leaves what came before**: a containment `set` that fails after its `create` leaves the child at the root, invisible to the consumer (M0 Q5). The check in §4.2 prevents the predictable cases (owner unresolved, slot not accepting the type, profile). An ambiguous name or a nested element is caught only at runtime. Declared, and the failure sentence names it.
- **Undo in steps**: 2 presses for 4 lines measured by M0. The first press leaves an intermediate state, declared in the text.
- **Environment**: several lanes run vite. On `write EPIPE`, retry once, as the prompt says.

## 7. Phase 2 probe plan (port 3047, simulated provider, real clicks)

Fixture: lane A's (ScenarioMM), copied into the scratchpad. A `title: EString` attribute is added to `Scenario` in the setup, and the setup is asserted.

| # | scene | what is asserted |
|---|---|---|
| P1 | consumer, `Scenario_0` selected, reply `create instance of Phase "ph1"` / `set Scenario_0.pathway = ph1` / `set Scenario_0.title = "T"` | the list holds 3 readable items and no `.md-jjscript-wrapper` |
| P1 | then «Apply» | `ph1` lies inside the `pathway` slot and not among the roots; «Unsaved» is on after the tick; row `Scenario_0` is `.selected` with the breadcrumb on `ph1`; Ctrl+Z restores, presses counted |
| P2 | reply `create instance of Learner "l9"` (`read`) | after «Apply» the plain-language refusal; `idlookup` unchanged (P12 sentinel) |
| P3 | `create instance of Phase "ph9"` with no `set` | «Apply» disabled and the reason shown; nothing written |
| P4 | «Discard» on a valid proposal | nothing written; state «Discarded» |
| P5 | close and reopen Jodie after P1 | still «Applied», no «Apply» |
| P6 | developer, no `?profile=`, same reply | the «Run» button, which opens `ScriptBlock`; no proposal |

## 8. Method notes

- `parse_probe.ts` and `load_probe.mts` live in the scratchpad, not in the tree. The first `load_probe` failed as a `.ts` file (`ERR_REQUIRE_ASYNC_MODULE`, top-level `await`). That was a fault of the instrument, and it went through renamed to `.mts`.
- Typecheck baseline: `npx tsc --noEmit`, full output into the scratchpad, exit 2, **14** `error TS`, the same files and codes as §17.
- The session id is read from the scratchpad path (`…/af4c7481-05dd-4563-b04e-a2a86d2f869d/scratchpad`), not from a banner.
