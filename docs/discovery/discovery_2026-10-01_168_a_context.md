# Discovery 2026-10-01 — #168 A: what Jodie sees in the stand-alone (J1, J2)

- Prompt-ID: `P-2026-10-01-2301` · prompt `docs/prompts/claude_2026-10-01_2301_prompt_168_a_context.md`
- Session: `473b3061-eb23-419d-bb4b-315b94042414` · tree `/Users/juridirocco/development/jjodel-168-context`, branch `168-context`, HEAD `8961023e1`
- Executor: Anthropic Claude Opus 5.5 (session banner)
- Phase 1, read-only on tracked files. Probes `frontend/scripts/smoke/_tmp_168_a_p0.ts` and `_tmp_168_a_dev.ts` (untracked, `_tmp_*`), run by `lane-run probe` on **3042**, OpenAI simulated by `ctx.route` (fake key `sk-probe-168-fake`): **0 real calls**, 7 + 3 requests intercepted. Logs in `~/.jjodel-lanes/P-2026-10-01-2301/`.
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it re-reads the real files.

## 0. Answer in brief

**Step 0, measured on `8961023e1`:** fixture ScenarioMM (Scenario, Phase, Learner, Vault), models `scen_a` and `scen_b`, profile Edu with Vault `hidden` and Learner `read`.
- **Fresh stand-alone load, `Arco_0` selected:** the context has **no `currentlyEditing`** and sends every metamodel (`metamodels`). No model and no instance are sent, the reply has `scope: null`, and the header chip reads «M2 · ScenarioMM». Changing the selection (`Scenario_0`, then `Antonio` of the read type) leaves the context identical and adds no line to the chat. A reload gives the same result.
- **Developer opens ScenarioMM, then `&profile=` without a reload:** the context is `currentlyEditing: ScenarioMM (M2 metamodel)` and the reply is stamped **M2**. The metamodel tab under the hidden Dock becomes the active artifact, which is the J1 case.
- **Hidden type:** `Vault` appears in **every** consumer request (2 occurrences: the class and the type of `guard`). No hidden instance appears today, but only because no model is sent. The developer M1 request carries Vault ×3, `vault_alpha` ×1 and its id ×2 (the object and a `$ref`), and that is what J1 would send if J2 did not filter it.
- **RAG:** initialized, with the project indexed. It returns nothing on 5 of 5 queries, including a control query on its built-in JjScript documentation. The channel is silent today, so whether it would leak cannot be measured.
- **Developer body:** 3 runs on the saved fixture are byte-identical (sha1 `dc3a1380…`). That body is the Phase 2 reference.
- **Outside this lane:** after developer → `&profile=` without a reload, the right rail stays on the metamodel (tree and Properties, Vault included), and the instance row is painted under the LeftBar (`elementFromPoint` → `.psb-action--danger`).

**Design: confirmed, with six corrections (§5):**
1. The selection lives in the pure module, written by the Configurator, which also dispatches the event. Jodie reads it at every recomputation and uses the event for its counter and the chat line.
2. The selection enters the context: in consumer mode `currentlyEditing` gains `type` and `instance {id, name}`. The original design only named the model.
3. The filter recognises classes by (metamodel name, package, class name), because the context carries no class ids. Objects and `$ref` are matched by id. It covers both shapes: `model` (with a selection) and `metamodels` (without one).
4. Visible descendants of a hidden object move up to `objects`. References and `superTypes` naming a hidden class are dropped, and so are violations that name a hidden object or type.
5. In consumer mode `ragInitialized: false` is passed to the provider (two sites in `Jodie.tsx`).
6. The «Context switched to … (M2 metamodel)» notice does not fire in consumer mode.

**Decisions taken (unattended):** none. **Decisions awaiting Alfonso (RC-26):** none.

**Questions:**
1. The header chip (`JodieHeader.tsx:70-90`, outside DOVE) shows «M2 · <first metamodel>» in consumer mode. Who fixes it?
   Recommended: J7 (Jodie's language) with a ticket now; this lane stays at 5 code files.
2. The detail panel shows the name of a hidden referenced element, locked (`InstanceDetail.tsx:139-151`). J2 asks to omit it. Which rule applies?
   Recommended: J2. Omit the target and the reference declaration typed by a hidden class.
3. What happens to the visible children of a hidden object?
   Recommended: they move up to `objects` with no container named, because the Configurator lists them (`instancesOfClass`, every model).
4. What about a hidden superclass?
   Recommended: drop the `superTypes` entry and do not describe its inherited features (rare case, declared).
5. Should RAG be off in consumer mode?
   Recommended: yes, `ragInitialized: false` in consumer only (it returns nothing today).
6. What about the developer → consumer without reload defect (right rail, rows under the LeftBar)?
   Recommended: a ticket in `docs/log-inbox/jodie-consumer.md` at the closure, not fixed here.
7. Where does the selection go in the JSON?
   Recommended: `currentlyEditing.type` and `currentlyEditing.instance` in consumer mode, filtered like the rest.

---

## 1. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|-----------|---------|----------|
| H1 | In the stand-alone, Jodie's active artifact is empty, or a tab left under the hidden Dock | **holds** | measured: S2/S2b/S2c/S4 `currentlyEditing: null`; S3 `ScenarioMM (M2 metamodel)` (§3) |
| H2 | The context does not know the profile: hidden types reach the model | **holds** | measured: `Vault` ×2 in every consumer body, ×3 in the developer M1 body (§3) |
| H3 | The Configurator selection does not reach Jodie | **holds** | measured: three selections, one context; `S2b.notices = []` (§3) |
| H4 | The context JSON can be filtered by type id | **falsified for classes, holds for objects** | read: `JsonModelService.ts:332` ClassifierRef `{name, package?, metamodel?}`, `:501-502` the light M2 drops `id`; measured: the M1 envelope has `id` on objects and `$ref`, never on classes (§4.4) |
| H5 | It is enough for Jodie to listen to the event | **partly** | read: Jodie is mounted in `App.tsx:177` (`{user && <Try><Jodie/></Try>}`), the Configurator publishes in a mount effect (`ConfiguratorTab.tsx:123-126`); listener order is not guaranteed, not measured |
| H6 | RAG does not carry hidden types | **undecidable** | measured: RAG silent on 5/5 queries, control query included (§3.4) |
| H7 | The developer body is stable enough for a byte-for-byte comparison | **holds** | measured: `dev-r1`, `dev-r2`, `dev-r3` identical, sha1 `dc3a138024db027b2ec79afad6387d08bbc39f47` |

## 2. Files read

`CLAUDE.md`; `docs/PROTOCOL.md` (whole); `docs/decisions.md` (Processo, RC-15..RC-32); `docs/log-inbox/jodie-consumer.md`, `docs/log-inbox/standalone-environment.md` (last 5 entries); `frontend/scripts/smoke/README-probes.md`; `docs/prompts/claude_2026-10-01_2300_prompt_168_m0_measures.md` and `_2302_prompt_168_b_guard.md` (head, for the boundaries); `docs/json-export-schema.md` (head).
Code: `frontend/src/components/environment/consumerMode.ts`, `frontend/src/joiner/environmentConfig.ts`, `frontend/src/components/environment/ConfiguratorTab.tsx`, `frontend/src/events/registry.ts`, `frontend/src/components/Jodie/Jodie.tsx` (whole); `frontend/src/jjscript/executor/utils.ts` (1-200), `frontend/src/jjscript/executor/activeArtifact.ts`; `frontend/src/services/JjodieContext.ts` (20-130, 320-452); `frontend/src/services/export/JsonModelService.ts` (whole); `frontend/src/model/conformance/ConformanceTypes.ts` (1-90), `ConformanceValidator.ts` (message lines only); `frontend/src/components/abstract/tabs/instanceManagerModel.ts` (40-140); `frontend/src/components/abstract/tabs/InstanceDetail.tsx` (20-64, 125-160, permission lines); `frontend/src/components/envgen/steps/ProfilesStep.tsx` (80-120); `frontend/src/components/Jodie/JodieHeader.tsx` (40-105, 200-225); `frontend/src/components/Jodie/console/providers/jjodieProvider.ts` (25-60); `frontend/src/services/AIProviderService.ts` (1-140, 961-979); `frontend/src/types/jodie.ts` (430-530, 670-760, 825-840); `frontend/src/services/JjodieRagService.ts` (380-430); `frontend/src/components/abstract/DockManager.tsx` (140-160); `frontend/src/App.tsx` (150-190); `frontend/scripts/smoke/states.ts` (1-40, 170-260, 355-372); `frontend/scripts/lane-run.mjs` (677-830). Partial reads are reported as windows.

## 3. Step 0 — measures

### 3.1 Fixture and method

Built by `_tmp_168_a_p0.ts` through the UI (`New Project`) on 3042. `states.createProject` was not used because it is pinned to `http://localhost:3000` (`states.ts:15`). Metamodel `ScenarioMM`: `Scenario ◇pathway→ Phase[*]`, `Phase learners→ Learner[*]`, `Scenario guard→ Vault[0..1]`. Model `scen_a`: `Scenario_0` (with `Phase_0` inside it), `Antonio` (Learner), `vault_alpha` (Vault, linked from `Scenario_0.guard`). Model `scen_b`: `Arco_0` (Scenario). Config: `topLevelTypes = [Scenario, Learner, Vault]`; profile `Edu` with `{Vault: hidden, Learner: read}`. Every setup step is asserted (F0-F6: package, classes, references with composition, typed instances with slots, father of `Phase_0` = DValue, environment, save by the `lastModified` sentinel). The localStorage dump goes to the scratchpad (`p0/fixture-localStorage.json`), so `_tmp_168_a_dev.ts` reopens the same ids.

Provider: in-page `AIConfig.get(AI.GPT.name).update({apiKey, enabled, model})` + `AIConfig.setPreferred('chat', …)`. Every host in `AI.*.endpoint` is routed: the body is recorded, then the reply is `MOCK_REPLY_168`. Recorded external hosts: fonts, `jjodel-notifications…workers.dev`, and `api.openai.com` (7/7 intercepted). The chip and the reply scope are read from Jodie's React state, both fibers (§9).

### 3.2 Results (run 3 of `_tmp_168_a_p0`, ALL GREEN, zero page errors)

| Scenario | `currentlyEditing` | envelope keys | reply scope | chip | Vault / vault_alpha / object id in body |
|---|---|---|---|---|---|
| S1 developer, `scen_a` tab | `scen_a` · M1 model | currentlyEditing, model, conformance | M1 · ScenarioMM · scen_a | M1 · scen_a | 3 / 1 / 2 |
| S2 consumer, fresh load, `Arco_0` (scen_b) | — | metamodels | null | M2 · ScenarioMM | 2 / 0 / 0 |
| S2b same page, `Scenario_0` (scen_a) | — | metamodels | null | M2 · ScenarioMM | 2 / 0 / 0 |
| S2c type Learner (read), `Antonio` | — | metamodels | null | M2 · ScenarioMM | 2 / 0 / 0 |
| S2d RAG question | — | metamodels | null | M2 · ScenarioMM | 2 / 0 / 0, no RAG section |
| S3 developer on ScenarioMM tab → `&profile=` without reload, `Arco_0` | ScenarioMM · M2 metamodel | currentlyEditing, metamodel | **M2** · ScenarioMM | M2 · ScenarioMM | 2 / 0 / 0 |
| S4 same, after a reload | — | metamodels | null | M2 · ScenarioMM | 2 / 0 / 0 |

Other measurements: `S2.events.load` = two `envgen-configurator-type-changed` events (`null`, then the Scenario id), no `editor-type-change`. On the active-artifact resolvers (`getActiveLevel`/`getActiveModel`/`getActiveMetamodel`, imported live), S2 read `M2 / null / null`, S3 read `M2 / null / ScenarioMM`, and S4 read `M2 / null / null`. After the reload in S4 the Dock holds only `project_summary`. `S2b.notices = []`. The column hides Vault (`["Scenario","Learner"]`, S2.0 PASS).

Per contrasto: S1 (developer) PASS, with the context naming `scen_a` (M1) and the reply stamped M1, so the instrument sees a model when there is one. S3.0 PASS, with the developer on ScenarioMM reading M2 / ScenarioMM, which is the positive control of the S3 leak.

### 3.3 Developer reference for Phase 2

`_tmp_168_a_dev.ts` seeds the dump (once per tab, with a sessionStorage flag), opens `scen_a` with `DockManager.open2`, sends «p0 developer on scen_a» and saves the body. Runs `r1`, `r2` and `r3` gave 17705 bytes each and byte-identical output (`cmp`); sha1 `dc3a138024db027b2ec79afad6387d08bbc39f47`. Two attempts at `r3` failed on the environment, not on the code: `ERR_NETWORK_IO_SUSPENDED` on `page.goto`, then vite's esbuild exiting with `write EPIPE` (`vite-3042.log`). The third attempt went through.

### 3.4 RAG

`JjodieRagService` reports `initialized: true`, `currentProjectId` = the fixture project. `getAugmentedContext` returns `null` on `how do I create a class with JjScript` (control: built-in docs), `Scenario`, `Vault`, the class-list question, and `guard reference`. The 7 intercepted bodies contain no `**Relevant Information:**`. A silent control means the instrument has no signal, not that nothing leaks (P12). The channel exists (`jjodieProvider.ts:36-43`) and the index covers `project.classes` (`JjodieRagService.ts:88-90`), hidden types included.

### 3.5 Outside the lane: developer → consumer without a reload

S3, after `location.hash = …&profile=`: the instance row `Arco_0` is at `[17, 832, 299×36]` in a 900px viewport, and `elementFromPoint` at its centre returns `psb-action psb-action--danger` (LeftBar). The screenshot (`scratchpad/p0/S3-intercepted.png`) shows an empty body, the right rail with the ScenarioMM tree (with `guard → Vault`) and the Properties of the metamodel, and the status bar «ScenarioMM 4 classes». It belongs to #157 (R5/R9 in the opposite direction, measured only in the developer direction). With lane A, Jodie no longer follows that tab, but the rail still shows Vault.

## 4. Findings (read)

**4.1 The level decides the resolver, and in consumer mode the resolvers read state the consumer cannot see.** `Jodie.tsx:143-145`:
```
const activeLevel = getActiveLevel();
const activeModel = activeLevel === 'M1' ? getActiveModel() : null;
const activeMetamodel = activeLevel === 'M2' ? getActiveMetamodel() : null;
```
`utils.ts:173-176`: `return resolveActiveLevel(_activeArtifactCache, () => getActiveModel() !== null);`. On a cold cache with no model in the Dock, the level is `'M2'` (`activeArtifact.ts:94` `return coldCacheHasModel() ? 'M1' : 'M2';`), and `getActiveMetamodel()` reads the Dock and `_lastSelected`. On a fresh load it found nothing (S2: `metamodel: null`), so `activeArtifact` stays `undefined`.

**4.2 No artifact means every metamodel.** `JjodieContext.ts:375-379`:
```
const docs = metamodels
    .filter((mm) => !!mm)
    .map((mm) => JsonModelService.buildMetamodelDocumentLight(mm));
...
envelope.metamodels = docs;
```
With an artifact, `currentlyEditing` holds only `{ name, level }` (`:345-348`), and the M1 branch adds `model` and `conformance` (`:359`, `:361-365`).

**4.3 The notice on tab change.** `Jodie.tsx:244` `content: \`_Context switched to: **${newName}** (${newLevel})_\``, with `newLevel` equal to `'M1 model'` or `'M2 metamodel'` (`:224`). That is jargon, and in consumer mode it would name a metamodel the consumer cannot see.

**4.4 No class ids in the context.** `JsonModelService.ts:332` `const out: JsonClassifierRef = { name: classifier?.name || '' };`, with `package` and `metamodel {id, name, nsURI}` added only for cross-metamodel classes. Classes are emitted as `{ name, abstract?, superTypes?, attributes?, references? }` (`buildClass`, `:245-261`). The light M2 drops `id` everywhere (`:501-502` `'externalMetamodels', 'id', 'exportedAt', …`), so in the `metamodels` branch a metamodel is identifiable only by `metadata.name`. The light M1 keeps `id` (`:510-512`), which covers `metadata.id`, `metamodel.id`, object `id` and `{ $ref }` (`:447` `.map((v) => ({ $ref: v as string }))`). Measured shape (S1): `model.metamodel.packages[].classes[]`, `model.objects[]` with `class {name, package}`, `references {guard: [{$ref}]}`, `children {pathway: [...]}`.

**4.5 Conformance violations are free text.** `ConformanceTypes.ts:38-63`: `{ objectId, objectName?, violationType, severity, message, metamodelElementName? }`. The messages quote names (`ConformanceValidator.ts:536` `points to "${target.name || refId}" of type "${targetMeta.name}"`), except `duplicate_id_value`, which lists them unquoted (`:601`).

**4.6 What the consumer sees.** The list holds every instance of the type in its models, including contained ones (`instanceManagerModel.ts:97-118`, `instancesOfClass` scans `idlookup`). The detail hides children of hidden types (`InstanceDetail.tsx:349` `.filter(id => permOfInstance(id) !== 'hidden')`) but shows a hidden reference target as a locked label (`:139-144` `if (isHidden?.(targetId)) { … title="Hidden for this profile"`). Permissions are keyed by the exact class (`environmentConfig.ts:79-84`). The wizard writes `typePermissions` only for marked types (`ProfilesStep.tsx:103-107`), but a permission survives if its type is later unmarked.

**4.7 The chip is outside this lane.** `JodieHeader.tsx:70` `const activeModel = getActiveModel() ?? Selectors.getActiveModel();`, `:86` `targetMetamodel = metamodels[0];`, `:90` `const level: 'M1' | 'M2' = targetMetamodel?.isMetamodel ? 'M2' : 'M1';`.

**4.8 RAG goes through Jodie's ctx.** `jjodieProvider.ts:36` `if (ctx.ragInitialized) {`, and `Jodie.tsx:596` and `:641` pass `ragInitialized` in both LLM calls (`handleSendMessage`, `askJjodie`).

**4.9 DockManager already refuses metamodels in consumer mode, but only on new opens.** `DockManager.tsx:147-150` `if (isConsumerMode() && me?.isMetamodel) { … return; }`. A tab opened before `&profile=` stays open (S3).

**4.10 Identifier census.** `command grep -rn` over `frontend/src` finds no `CONFIGURATOR_SELECTION_CHANGED`, `envgen-configurator-selection`, `consumerJodieContext`, `resolveConsumerArtifact` or `filterContextForProfile`. Positive control, same command: `envgen-configurator-select-type` is found in `events/registry.ts` (1).

## 5. The design checked

| Point of the design | Verdict | Note |
|---|---|---|
| `EnvGenEvents` constant, detail `{typeId, instanceId, modelId}` | confirmed | `CONFIGURATOR_SELECTION_CHANGED: 'envgen-configurator-selection-changed'`, a name in the style of `:125-127` |
| Published by `ConfiguratorTab` | confirmed, `isPage` only | like `CONFIGURATOR_TYPE_CHANGED` (`:123-126`); the overlay is the developer's |
| How Jodie gets the current selection | **module-level state** | written by the Configurator (`setConsumerSelection`) before the dispatch; reset to `null` on unmount. Re-publishing on request would need a second constant, and a Jodie listener can attach late (H5) |
| `resolveConsumerArtifact` | confirmed | instance model (`modelIdOfObject`) → otherwise `modelsForType(...)[0]`; Jodie re-resolves from the ids at every recomputation (a deleted instance falls back to the type). The Configurator fills `modelId` with the same function: one rule |
| `filterContextForProfile` on the envelope | confirmed, **name keys** | (metamodel name, package, name) for classes; ids for objects and `$ref` (§4.4); covers `model` and `metamodels` |
| `environment {profile, editableTypes, readOnlyTypes}` block | confirmed | names; `editableTypes` = classes that are not abstract or interface and are `edit`; `readOnly: true` on the class entry too |
| Permissions via `resolveTypePermission` | confirmed | imported from `joiner/environmentConfig.ts`, zero imports; `modelIdOfObject` from `instanceManagerModel.ts`, which imports only `irReadCtx` (no imports): the module stays importable by the `node` bench |
| Consumer branch in Jodie, never `getActive*` | confirmed | `JSON.parse` → filter → `JSON.stringify(…, null, 2)` (the format of `JjodieContext.ts:367` and `:382`); with no profile, no round trip |
| Scope stamped as today | confirmed | `resolveMetamodelScope` unchanged; `level: 'M1'`, `modelId` of the selection |
| Chat line on selection change | confirmed | «Now looking at: Scenario «Arco_0»» (type only when there is no instance); only if the chat is not empty, deduplicated on `(typeId, instanceId)` |
| **Additions** | — | the selection in `currentlyEditing` (Q7); RAG off in consumer (Q5); EDITOR_TYPE_CHANGE notice skipped in consumer (§4.3) |
| Scope without the profile, no interface shared with B | confirmed | nothing exported from `jjscript/**` is touched |

## 6. Proposed shapes for Phase 2 (new, exported from the new module only)

```ts
export interface ConsumerSelection { typeId: string | null; instanceId: string | null; modelId: string | null; }
export function setConsumerSelection(sel: ConsumerSelection | null): void;   // module state, reset in tests (P11)
export function getConsumerSelection(): ConsumerSelection | null;
export function consumerModelId(idlookup, projectModelIds: readonly string[], typeId, instanceId): string | null;
export function resolveConsumerArtifact(sel, idlookup, projectModelIds): { id; name; level: 'M1'; metamodelId? } | undefined;
export function filterContextForProfile(envelope: Record<string, unknown>, idlookup, profile, selection?): Record<string, unknown>;
```
`ActiveArtifact` (`JjodieContext.ts:33-39`) is not changed. The return type is structurally compatible with it.

## 7. Phase 2 plan (5 code files, confirmed by Juri, Rule 19)

1. `events/registry.ts`: one constant in `EnvGenEvents`.
2. `environment/consumerJodieContext.ts` (new): §6.
3. `environment/ConfiguratorTab.tsx`: an `isPage` effect on `[selectedTypeId, selectedInstanceId, modelId resolved]`, which writes the selection and dispatches; cleanup sets `null`.
4. `Jodie/Jodie.tsx`, under `isConsumerMode()` only: the artifact from the selection, the context through the filter, a counter on the new event, the chat line, the EDITOR_TYPE_CHANGE notice skipped, and `ragInitialized: false` at the two sites.
5. `environment/__tests__/consumerJodieContext.test.ts`. A hidden type is absent by name and by id from the serialized JSON (both branches, `$ref`, children, violations, `superTypes`). The instance's model beats the type's first model. `read` is marked. With no profile the envelope is unchanged. Module state is reset in `beforeEach`.

Mutation bench: no reference filter, no instance-model preference, no `read` mark, plus no filter on the `metamodels` branch. Gates: `npx tsc --noEmit` complete (**14**, the §17 set, measured in this phase), `npm run build`, vitest on the new test and `environmentConfig.test.ts`. Probe: `_tmp_168_a_verify.ts` (selection in the context, zero hidden names or ids, the chat line, M1 scope in S3), and `_tmp_168_a_dev.ts` again compared with `dc3a1380…`.

## 8. Dependencies and risks

- **Lane B** reads the profile from the URL and guards execution. The two lanes share no interface. A `set` on `guard` is refused by B; with A the reference is not even described.
- **The chip** (Q1) stays wrong until J7: the consumer will read «M2 · ScenarioMM» above answers that are now about the model.
- **Name collisions:** two same-named metamodels, each with a same-named package and class, would hide both. That errs towards hiding, which is acceptable for a coherence filter (D1).
- **Free attribute values** that contain a hidden type's name are not cleaned. The filter works on structure, not on text, except for the violation messages.
- **History:** a conversation started as developer and continued in consumer mode without a reload keeps in its history what it saw before (measured in S3: 8 earlier messages). Not addressed here.
- **Environment:** three lanes run vite on this machine; one esbuild crash (EPIPE) was measured. Probes are repeated on failure, and the failure is declared.

## 9. Method notes

- The first `p0` run died on the class creation: the package lands deferred (README-probes, «Assert the setup»). Fixed with F0 polling.
- The first fiber read missed replies: `.jodie-root` can hold the alternate fiber, and its state was stale (S1 FAIL, `replies [0,0]`, while S2b already saw the S2 reply). The fix is to read both fibers and keep the longer history. After it S1 PASS and every reply is counted (`[0,1]`, `[1,2]` …). The FAIL was the probe's, not the code's.
- In S3 the row click is intercepted. The probe records the hit (`elementFromPoint`) and the screenshot, then goes on with a DOM click. A user's click would not reach the row (§3.5).
