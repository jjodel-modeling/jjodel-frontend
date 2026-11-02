# Discovery 2026-11-02: #196 L0, AI-layer inventory and SDK spike

- **Prompt-ID**: P-2026-11-02-1020 (phase 1)
- **Prompt file**: `docs/prompts/claude_2026-11-02_1020_prompt_196_l0_ai_spec_discovery.md`
- **Chat**: C-2026-11-02-1016. The session id is not exposed to the agent in this run; replies carry the chat id.
- **Tree**: worktree `~/development/jjodel-196`, branch `docs/196-l0-spec`, HEAD `288425992` (`staging` `58ac7a61d` + the prompt commit)
- **Executor model**: Opus 5.5 (`claude-opus-5-5`)
- **Plan under test**: second half of issue #196 («Jjodie AI-layer refactoring plan», 2026-10-21), copy at `~/.jjodel-lanes/spike196/issue196.md:160-420`

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

Tags: **[M]** measured in this phase on HEAD `288425992` (or on the spike install named), **[R]** read in a file.
Paths are relative to `frontend/` unless they start with `cloudflare-worker/`, `docs/` or `~`.

---

## 0. First finding (hard-stop check A3)

No shipped content uses `AI`, `AIConfig` or `JodieConfig` as an identifier. There are no hits in default views, `jsxString` templates,
`public/`, examples, the library catalog, fixtures, or JjEL/JjScript/OCL snippets in docs (§A3). The prompt's A3 hard stop is
**not** triggered. The names are still reachable from user code at runtime: every view's evaluation context and the OCL type
registry contain them. The open gap is user projects on the server, which this phase cannot reach.

## 1. Hypotheses and verdicts

| # | Hypothesis (from the plan) | Verdict | Evidence |
|---|---|---|---|
| H1 | `types/jodie.ts` is imported by ~25 files (R4) | **partly**: 29 files (26 production + 3 tests) | §A1 [M] |
| H2 | The OCL contract on `AI`/`AIConfig`/`JodieConfig` has no real usage (④) | **holds for the repo**; server projects unmeasured | §A3 [M] |
| H3 | The plan's L2/L3/L6 file lists cover every consumer | **falsified**: 3 known misses confirmed, 6 more found, 2 listed files are orphans, 1 listed file is not an importer | §A4 [M] |
| H4 | Per-provider storage is `jjodel_provider_<name>` (L1) | **falsified**: it is `jjodie_provider_<name lowercase>`; `jjodel_provider_<feature>` is the per-feature preference | §A5 [R] `types/jodie.ts:229`, `:199` |
| H5 | The `@anthropic-ai/sdk` browser build works without the Worker | **partly**: `messages.create` and `messages.stream` reach Anthropic and come back readable (401, ACAO `*`). With an invalid key, `models.list` is **blocked by CORS** in the browser. The real-key arm was skipped (no key) | §B3 [M] |
| H6 | Gemini via `@google/genai` works from a browser origin, including `inlineData` PDFs | **holds** | §B3 [M] |
| H7 | The OpenAI-compatible family works from the browser with the `openai` SDK | **partly**: `models.list` 200 and the invalid key's 401 are readable. Chat and stream reached the API but got 429 «no credits remaining» on the account | §B3 [M] |
| H8 | The Worker's only remaining job is a fallback for Anthropic CORS | **holds, and is narrower**: one code path reaches it, the model-catalog fallback (Claude and Gemini) on a rejected fetch | §A8 [M] |
| H9 | The proxy surface to delete in L4 includes `providerNeedsProxy` | **falsified**: `providerNeedsProxy`, `PROVIDER_ENDPOINTS` and five more symbols sit inside a block comment | §A4 [M] |
| H10 | `useAIProviderPreference` (CLAUDE.md §16) exists | **falsified**: the only occurrence is a comment | §A4 [M] |

---

## A1. Importers of `src/types/jodie.ts`

**Method [M]**: a TypeScript-compiler scan (`~/.jjodel-lanes/spike196/inv/imports.mjs`, `ts.createSourceFile` on every `.ts/.tsx/.js/.jsx/.mjs`
under `src/`, 1584 files). It covers static imports, `import type`, `export … from`, `import()` and `require()` whose specifier
matches `(^|/)jodie(\.ts)?$`, and exited 0.
- Positive control: the known dynamic imports `aiModelCatalog.test.ts:138` and `AIProviderService.test.ts:30` both appear.
- A first, narrower pattern (`types/jodie$`) missed `types/__tests__/aiProxyEndpoint.test.ts`, which imports `'../jodie'`. A plain
  `grep "jodie['\"]"` caught that miss, and the scan was re-run with the wider pattern.
- Namespace uses in tests (`jodie.AI`, `...jodie`) are listed as «namespace».

Classification: **AI** = registry/config/models/enums. **Chat** = chat/console types. **Doc** = documentation types, a third
group the plan does not name.

| File (line of import) | AI-layer symbols | Chat / Doc symbols | Plan lane |
|---|---|---|---|
| `components/ExplainModal.tsx:3` | JodieConfig, AIConfig, AI, AIProvider | | L3 |
| `components/Jodie/ChatInput.tsx:7` | JodieConfig, AI, AIConfig | ChatImage, ChatDocument, ConsoleMode, ConsoleModeSwitchVia, CodeFlavor, ConsoleEntry, ChatMessage, CodeEntry, CONSOLE_MODES, CONSOLE_MODE_LABELS | L2 |
| `components/Jodie/ChatMessages.tsx:7` | **AI** (runtime read at `:85`) | ChatMessage, ConsoleEntry, CodeEntry, CodeWarning, isCodeEntry, JjodieScope | L6 only, **missing from L2** |
| `components/Jodie/Jodie.tsx:10` | AIProvider, TAIProvider, AIConfig, AI, JodieConfig | ChatMessage, ChatImage, ChatDocument, ChatState, ConsoleMode, CodeFlavor, CodeEntry, isChatEntry, CONSOLE_MODES, ConsoleModeSwitchVia, JjodieScope, ConsoleEntry | L2 |
| `components/Jodie/JodieHeader.tsx:7` | TAIProvider, AIProvider | ConsoleMode, ConsoleModeSwitchVia, CodeFlavor | **missing** |
| `components/Jodie/JodieMinimized.tsx:7` | AIProvider | | L6 (plan spells it `JjodieMinimized`) |
| `components/Jodie/JodieWindow.tsx:14` | TAIProvider, **JodieConfig** (runtime at `:140`, `:144`, `:208-209`, `:263`) | ChatImage, ChatDocument, ConsoleEntry, ConsoleMode, ConsoleModeSwitchVia, CodeFlavor, CodeEntry | L6 only, **missing from L2** |
| `components/Jodie/console/providers/jjelProvider.ts:10` | | CodeEntry (type) | L6 |
| `components/Jodie/console/providers/jjodieProvider.ts:16-17` | AIConfig | ChatMessage (type) | L3 |
| `components/Jodie/console/providers/jjscriptProvider.ts:22` | | ChatMessage (type) | L6 |
| `components/Jodie/console/types.ts:11` | TAIProvider (type) | ChatImage, ChatDocument, ChatMessage, CodeFlavor, ConsoleEntry (type) | L6 |
| `components/StatusBarRightZone.tsx:16` | AIConfig, JodieConfig | | **missing** (known) |
| `components/abstract/tabs/DocumentationTab.tsx:22`, `:24` | AI, AIConfig, AIProvider, JodieConfig, TAIProvider, ALL_AI_PROVIDERS | DocumentationStatus (Doc) | L2 «preference reads only», which understates it |
| `components/common/AIDisclaimer.tsx:13` | AI, AIConfig, AIFeature | | L2 |
| `components/common/ProviderModelSelector.tsx:6` | AI, AIConfig, AIFeature, AIVersion, JodieConfig, TAIProvider, hasLiveCatalog | | L2 |
| `components/common/ProviderSelector.tsx:4` | AI, AIConfig, AIProvider, ALL_AI_PROVIDERS, JodieConfig, TAIProvider, AIFeature | | L2, but **orphan** (§A4) |
| `components/settings/AISettingsContent.tsx:2` | AI, AIConfig, AIProvider, AIVersion, ALL_AI_PROVIDERS, JodieConfig, TAIProvider | | L2 |
| `components/settings/ProviderSettings.tsx:9` | AI, AIConfig, AIProvider, ALL_AI_PROVIDERS, JodieConfig, TAIProvider | | L2, but **orphan** (§A4) |
| `jjtl/services/AIMatcher.ts:11` | AIConfig, JodieConfig, TAIProvider | | L3 |
| `jjtl/services/MappingSuggestionService.ts:15` | JodieConfig, TAIProvider | | **missing** (known) |
| `jjtl/views/SuggestedMappingsPanel.tsx:30` | AI, AIConfig, JodieConfig | | L2 «preference reads only», which understates it |
| `pages/settings/AIAssistantSettings.tsx:7` | TAIProvider, AI, ALL_AI_PROVIDERS, AIConfig | | **missing** (known) |
| `pages/settings/ProviderConfigModal.tsx:7` | TAIProvider, AI, AIConfig, AIProvider, JodieConfig | | L2 |
| `services/AIProviderService.ts:6` | AIProvider, TAIProvider, AI, AIConfig, resolveCurrentModelId, isForeignModel, getAICompany, applyModelCatalog, getProxyBase | ChatMessage, ChatImage, ChatDocument | L3 delete |
| `services/DocumentationService.ts:14` | AI, AIConfig, JodieConfig | | L3 |
| `services/JjodieContext.ts:12` | | DocumentationSection (Doc) | **missing** |
| `services/__tests__/AIProviderService.test.ts:30,100,156,281,301` (dynamic) | AI, AIConfig, AIProvider, hasLiveCatalog, namespace | | L3 delete |
| `services/__tests__/aiModelCatalog.test.ts:138,151,159,169,222,243,375` (dynamic) | AI, hasLiveCatalog, namespace; it also imports `AIProviderService` at `:160,170,254,376` | | **missing** (breaks at L3) |
| `types/__tests__/aiProxyEndpoint.test.ts:29,36,42,48` (dynamic `'../jodie'`) | AI | | L4 delete |

Real exports of `types/jodie.ts` per the TS parser: 42 [M]. The Doc group (`DocumentationSectionType`, `DocumentationSection`,
`DocumentationStatus`, `ProjectDocumentation`, `:1204-1224`) has no destination in the L6 plan, which names only
`services/ai/types.ts` and `components/Jodie/types.ts`.

## A2. Readers of `getAICompany`, `companymap`, `aimap`

Search [M]: `command grep -rnwE "getAICompany|companymap|aimap|getAIProvider|ALL_AI_COMPANIES|AICompany|TAICompany" src`, exit 0.
- Inside `types/jodie.ts`: `:26-27` (`isValidProvider`/`isValidCompany`), `:56-80` (definitions), `:203`/`:225` (`AI.company`),
  `:303-313` (registrations).
- Outside it there is **one** reader: `services/AIProviderService.ts:977` `const company = getAICompany(provider);`. It dies with
  the file in L3.
- `getAIProvider` and `ALL_AI_COMPANIES` have no reader outside their definitions.
- `.company`: `command grep -c "\.company\b" src/types/jodie.ts` = 1, and there are no hits outside `jodie.ts`.

Positive control (same tool): `command grep -rlw AIConfig src | wc -l` = 20.

## A3. The OCL contract (decision ④)

**Registrations [R]**:
- `types/jodie.ts:180` `@RuntimeAccessible('AI')`
- `:507` `@RuntimeAccessible('AIConfig')`
- `:905` `@RuntimeAccessible('JodieConfig')` (the prompt cited only `:180` and `:507`)

**What registration does [R]** `joiner/classes.ts:460-494`:
- `RuntimeAccessibleClass.classes[constructor.cname] = constructor` (`:465`)
- `if (!windoww[constructor.cname]) (windoww[constructor.cname] as any) = constructor;` (`:466`)
- `RuntimeAccessibleClass.annotatedClasses[constructor.cname] = …` (`:494`)

**Code paths that resolve a runtime-accessible class by name [M]**:
1. `RuntimeAccessibleClass.get(dclassname)`, `joiner/classes.ts:343-346`, `return this.classes[dclassname]`. Its callers pass
   D-object `className`s: `classes.ts:297`, `:369-370`, `joiner/proxy.ts:245`, `redux/reducer/reducer.ts:1570`. No caller uses a
   literal `'AI'`, `'AIConfig'` or `'JodieConfig'` (`command grep` exit 1; the `RuntimeAccessibleClass.get` hits above are the
   control).
2. **View evaluation context**: `redux/reducer/reducer.ts:1571`
   `windoww.defaultContext = {$: windoww.$, getPath, React: React, Selectors, ...RuntimeAccessibleClass.getAllClassesDictionary(), ...windoww.Components};`,
   used as the prototype of every view context at `view/viewElement/view.tsx:1566` `context.__proto__ = windoww.defaultContext;`.
   **Any view JSX/JS can name `AI`, `AIConfig`, `JodieConfig` today.**
3. **OCL**: `ocl/ocl.tsx:98` `oclEngine.registerTypes(RuntimeAccessibleClass.getOCLClasses(rootModel.id));`. Through
   `classes.ts:426` `{...RuntimeAccessibleClass.classes}` and `:445-447`, that includes the three classes. `ocl/ocl.tsx:137`
   `const types = RuntimeAccessibleClass.getAllClasses();` does the same.
4. **Global**: `window.AI`, `window.AIConfig`, `window.JodieConfig` (from `:466`). No source reads them as globals: the
   `command grep` for `window+(as any)?.(AI|AIConfig|JodieConfig)` and `window['…']` exited 1.

**Occurrences as identifiers in persisted or shipped content [M]**, repo-wide, `--exclude-dir=node_modules --exclude-dir=.git`, exit 0:
- `\bAIConfig\b` and `\bJodieConfig\b` (`-lw`) hit only `frontend/src/**` TypeScript, which is the importers above, plus internal
  docs: `docs/discovery/*` (11 files), `docs/audit-ai-system.md`, `docs/decisions.md`, `docs/claude-code-log-archive.md`,
  `docs/log-inbox/{orphan-sweep-196,jjodie-ui}.md`, `docs/prompts/*`, `docs/ratifiche/…`, `docs/sessioni/*`. Every docs hit
  discusses TypeScript code. None is a JjEL/JjScript/OCL snippet meant for a user.
- `AI` followed by `.`, `[` or `(` hits the same `src` TypeScript plus prose. Examples:
  - `docs/CHANGELOG.md:102` «in AI (less bullet points…»
  - `docs/feature-inventory.md:657` «Toggle modalità AI (LLM)»
  - `cloudflare-worker/README.md:50` «`AI.getEndpoint()` in `frontend/src/types/jodie.ts`»
  - two PNGs that match as binary
- Zero hits in: default views (`utils/defaultViewTemplate.ts`, `common/DV.tsx`), `frontend/public/` (`examples/codegen`,
  `library/catalog.json`, `library/gallery`), `frontend/docs/`, `src/codegen/examples/`, and any JSON fixture.
- Positive control (same tool, same exclusions): `command grep -rlw className frontend/public frontend/docs` = 58 files.

**Count for ④**: 0 uses in shipped or persisted content in the repo. There are 3 runtime channels through which user content
*could* use the names: view context, OCL types, and `window` globals.

**Gaps**:
- User projects on the server, and projects that live only in users' browsers, are out of reach. Nobody can say whether a
  user-authored view or OCL constraint names `AI.Claude` or `AIConfig`.
- When `types/jodie.ts` dies (L6), such content would fail at evaluation with an undefined identifier. Nothing breaks at load.

## A4. The plan's citations against today's tree, and missed consumers

### Cited lines [M]

| Plan citation | Today | Status |
|---|---|---|
| `ExplainModal.tsx:34` browser header | `:34` `'anthropic-dangerous-direct-browser-access': 'true',`; `streamClaude` `:27`, `streamOpenAI` `:79` | there |
| `aiModelCatalog.ts:309` | `:309-310` `headers: (apiKey, direct) => ({ 'x-api-key': apiKey, … ...(direct ? { 'anthropic-dangerous-direct-browser-access': 'true' } : {}) })` | there |
| `AIProviderService.ts:23` `CHAT_MAX_OUTPUT_TOKENS` | `:21` `const CHAT_MAX_OUTPUT_TOKENS = 8192;` | moved (-2) |
| `AIProviderService.ts:~115` `effectiveModel` | `:115` `static effectiveModel(provider: TAIProvider, requested?: string): string {` | there |
| `AIProviderService.ts:~159` `resolveChatCompletionsUrl` | `:159` `private static resolveChatCompletionsUrl(baseUrl: string): string {` | there |
| `AIProviderService.ts:240` header in `chatClaude` | `:240` (the request goes to `AI.Claude.endpoint`, `:234`) | there |
| `AIProviderService.ts:~980` `validateKeyCoherence` | `:987` (called at `:68`) | there |
| `types/jodie.ts:216` `authScheme` | `:216`; per-provider values `:434-442` | there |
| `types/jodie.ts:662-824` migrations | `migrateLegacyModelIds` `:665`, `sanitizeForeignFeatureModels` `:723`, `retireModels` `:756`, `migrateGlobalDefaultToPerFeature` `:803`; called from `JodieConfig.load` (`:940`) at `:945-951` | there (665-822) |
| `events/registry.ts:111` `AIEvents` | `:111` is `JjScriptEvents`; `AIEvents` is at `:122-127` | moved (+11) |
| `jjodieProvider.ts:53` | `:53` `const response = await AIProviderService.chat(` | there |
| `DocumentationService.ts:614` | `:614` `const activeProvider = AIConfig.getPreferred('documentation');` | there |
| `jjtl/services/AIMatcher.ts:52` | `:52` `const provider = aiProvider ?? AIConfig.getPreferred('mappings');` | there |
| `DocumentationTab.tsx:583` | `:583` `const selectedProvider = AIConfig.getPreferred('documentation'); // useAIProviderPreference('documentation');` | there |
| `SuggestedMappingsPanel.tsx:262` | `:262` `const resolvedProvider= AIConfig.getPreferred('mappings');` | there |
| `aiModelCatalog.test.ts:100` | `:99-101` (URL `:99`, header assertion `:101`) | there |

### The three known misses [M]

- `components/StatusBarRightZone.tsx`: **confirmed**. It imports `AIConfig, JodieConfig` at `:16` and calls
  `JodieConfig.hasEnabledProviders()` at `:28`, `:34`. It is live through `components/StatusBar.tsx:24` and
  `jjtl/components/JjtlStatusBar.tsx:7`.
- `jjtl/services/MappingSuggestionService.ts`: **confirmed**. `:15`, `:58` `if (!JodieConfig.hasEnabledProviders()) {`. It is
  live through `jjtl/services/index.ts:7` and then `jjtl/views/SuggestedMappingsPanel.tsx:19`.
- `pages/settings/AIAssistantSettings.tsx`: **confirmed, live**. The chain is `pages/settings/index.ts:1`,
  `components/GlobalDrawer/SettingsDrawerContent.tsx:8`/`:26`, `GlobalDrawer`, then `App.tsx:52`. `pages/Settings.tsx:4`/`:23` also
  imports it. It is the **only importer** of `ProviderConfigModal` (`:8`).

### Further misses [M]

1. `components/Jodie/JodieHeader.tsx:7` (`TAIProvider, AIProvider`): an L6 type migration.
2. `components/Jodie/JodieWindow.tsx`: a runtime `JodieConfig` consumer, not only an L6 type importer.
   - `:144` `useState<boolean>(() => JodieConfig.hasEnabledProviders())`
   - `:208-209` `JodieConfig.current.dockWidth = w; JodieConfig.current.save();`
   - `dockWidth` (R-JJD-1) is panel UI state stored inside the AI credentials blob `jjodie-credentials` (§A5). The new stores need a
     home for it, or the width is lost.
3. `components/Jodie/ChatMessages.tsx:85` `const providerInfo = message.provider ? AI[message.provider] : null;` reads the registry
   at runtime, so it belongs in L2/L3 as well as L6.
4. `services/JjodieContext.ts:12` (`DocumentationSection`): an L6 type migration with no destination yet (Doc group).
5. `services/__tests__/aiModelCatalog.test.ts` imports `AIProviderService` dynamically at `:160`, `:170`, `:254`, `:376` and
   `types/jodie` at seven sites. **L3's deletion of `AIProviderService` breaks it.** It belongs in L3 (rewrite) or L4 (with
   `aiModelCatalog.ts`).
6. AIEvents consumers outside the plan:
   - `services/PromptService.ts:160`, `:172`, `:215`, `:227` fire `AIEvents.PROMPT_CHANGED`; `hooks/usePrompt.ts` listens.
   - The plan says the events are «fired by `AIConfig`». Only `SETTINGS_CHANGED` (`jodie.ts:610`) and `PROVIDER_CHANGED`
     (`:841`, `:855`) are. `MODELS_UPDATED` is fired by `AIProviderService.ts:826`, and `PROMPT_CHANGED` by `PromptService`.
7. `AIDisclaimer` consumers not in any list: `jjscript/components/ScriptBlock.tsx:21`, `jjtl/views/InferredMappingsPanel.tsx:7`.
   They are affected only if its props change.

### Listed files that should not be there [M]

- `components/common/ProviderSelector.tsx` (L2): **zero importers**.
- `components/settings/ProviderSettings.tsx` (L2): **zero importers**.
- Evidence for both: the TS scan with `ProviderSelector$` and `ProviderSettings$` returned 0, while the control `ProviderModelSelector$`
  returned 3. A plain `command grep -rnw` finds only their own files, their stylesheets and comments (`jjtl/styles/jjtl.scss:1876`,
  `SuggestedMappingsPanel.tsx:257`).
- Both are orphans that L5 did not sweep. CLAUDE.md §16 still advertises `<ProviderSelector feature="chat" compact />`.
- `components/Jodie/MarkdownMessage.tsx` (L6) does not import `types/jodie`. Its only importer is `ChatMessages.tsx:9`.
- `Jjie…` (L6) is a truncated name that matches no file.

### Proxy surface that is already dead text [M]

- The TS parser lists 42 exports, the last being `ProjectDocumentation:1224`.
- Everything from `types/jodie.ts:1232` (`/**` followed by `// Provider endpoints`) sits inside a block comment:
  `PROVIDER_ENDPOINTS` (`:1234`), `providerNeedsProxy` (`:1239`), `ModelCapabilities`, `getModelInfo`, `getModelCapabilities`.
- `supportsVision` (`:1141`), `supportsPDF` (`:1162`) and `supportsAttachments` (`:1182`) are not exports either.
- L4's «delete `providerNeedsProxy`» therefore removes a comment. The live proxy surface is `getProxyBase` (`:173`),
  `AI.proxy` (`:211`, set only for Claude at `:419`; Gemini's is commented at `:420`) and `AI.getEndpoint` (`:246-254`).

### `useAIProviderPreference` [M]

It does not exist. `command grep -rn useAIProviderPreference src docs` returns only the comment at `DocumentationTab.tsx:583`; the
other hit is `CLAUDE.md:585`, the documentation itself. The control `command grep -rln "useAIProvider\|getPreferred" src` gives 14
files. The real pattern is `AIConfig.getPreferred(feature)` / `getPreferredModel(feature)` (e.g. `ExplainModal.tsx:129`, `:137`).

## A5. localStorage keys (L1 stores must reuse them) [R]

| Key | Content | Read / write |
|---|---|---|
| `jjodie_provider_<name lowercase>` (e.g. `jjodie_provider_claude`) | per-provider `AIConfig` JSON: apiKey, model, baseUrl, enabled, … | built at `types/jodie.ts:229` `this.storageKey = "jjodie_provider_" + name.toLowerCase();`; read `:488`, `:553`, `:692`, `:784`; written `:700`, `:795`, `:837`, `:853`. Pinned by `AIProviderService.test.ts:240`, `:243` |
| `jjodel_provider_<feature>` (`AI.STORAGE_PREFIX`, `:199`) | per-feature `ProviderPreference` (`{provider, modelId}`); feature ∈ `documentation, chat, scriptblock, mappings, explain` (`:82`) | read `:570`, `:623`, `:674`, `:729`, `:764`; written `:608`, `:683`, `:738`, `:775`, `:815`; removed `:829` |
| `jjodel_default_provider` (`AI.GLOBAL_DEFAULT_KEY`, `:198`) | legacy global default, read once by the migration and not deleted | `:807` |
| `jjodie-credentials` (`AI.STORAGE_GLOBAL_CONFIG`, `:200`) | the whole `JodieConfig` JSON: `providers` (a **second copy of every API key**), `dockWidth`, legacy `position`/`size`, `appVersion` | written `:930`; read `:954` |
| `jjodel_migration:legacy_model_ids_v1` | sentinel | `:666`, `:668`, `:705` |
| `jjodel_migration:global_to_per_feature` | sentinel | `:804`, `:806`, `:819` |
| `jjodel_models_<provider>` (`CATALOG_STORAGE_PREFIX`) | live catalog cache, 24 h, keyed to a hash of the API key | `services/aiModelCatalog.ts:47`; read `:73`; write `:85` |
| `jjodie_doc_<projectId>` (`AI.DOCUMENTATION_STORAGE_PREFIX`, `:197`) | generated documentation, not AI config | `services/DocumentationService.ts:163`, `:174`, `:181` |
| `jjodel_jodie_window` (`AI.WINDOW_STATE_KEY`, `:195`) | declared, **no reader or writer** (`command grep -rn WINDOW_STATE_KEY src`: only `:195`) | none |

`retireModels` (`:756`) has no sentinel and runs on every `JodieConfig.load` (`:951`).

## A6. Behaviour-transport table, today's locations and pinning tests

| Behaviour | Lives today | Pinned by |
|---|---|---|
| Key-prefix coherence | `AIProviderService.ts:987-1005` `validateKeyCoherence` (called `:68`); tables `DISTINCTIVE_KEY_PREFIXES` `:957-961` and `EXPECTED_KEY_PREFIX` `:967-973`. **The `AIza` (Gemini) entries are commented out** (`:959`, `:970`), so the live prefixes are `sk-ant-` (Claude), `sk-` (GPT, DeepSeek), `gsk_` (Groq). The testConnection paths repeat the checks at `:734` (`sk-`), `:785` (`sk-ant-`), `:903` (`expectedKeyPrefix`) | `aiModelCatalog.test.ts:372` («refuses a key without sk- before any call», the testConnection copy). The chat-side `validateKeyCoherence`: **no test** |
| Foreign-model guard + fallback with warning | `AIProviderService.ts:115-138` (`:132` `if (effectiveModel && provider !== AIProvider.Custom && isForeignModel(provider, effectiveModel))`); `isForeignModel` `types/jodie.ts:162` | `AIProviderService.test.ts:73` (other providers keep explicit selection), `:291`; `aiModelCatalog.test.ts:161`. The foreign-discard branch itself: **no direct test** found |
| Legacy/retired model migration | `types/jodie.ts:665` `migrateLegacyModelIds`, `:723` `sanitizeForeignFeatureModels`, `:756` `retireModels`, `:803` `migrateGlobalDefaultToPerFeature`; `claudeLegacyIdMap` `:100` | `retireModels`: `AIProviderService.test.ts:174`, `:183`, `:219`, `:229`, `:238`, `:286`, `:299`. The other three: **no test** |
| `CHAT_MAX_OUTPUT_TOKENS = 8192` | `AIProviderService.ts:21` | **no test** (grep `8192|max_tokens|CHAT_MAX` over the three test files: 0) |
| Per-provider `authScheme` | `types/jodie.ts:216`, values `:434-442`; applied `AIProviderService.ts:184` | indirect: `aiModelCatalog.test.ts:101` (Claude `x-api-key`), `AIProviderService.test.ts:198` (Gemini `x-goog-api-key` on the model list). No test of the field |
| Ollama enabled without a key; Custom key-or-baseUrl | `types/jodie.ts:882-889` `isConfigured`: Custom `!!(config.baseUrl \|\| config.apiKey)`, others `!!(llm.requiresKey ? config.apiKey : config.baseUrl)`; `AI.Ollama.requiresKey = false` `:314`. The plan's wording «enabled **without** key» is half right: Ollama needs a `baseUrl` instead. The default `JodieConfig` passes `llm.requiresKey ? llm.endpoint : undefined` (`:921`), so Ollama starts unconfigured | **no test** |
| Anthropic direct-browser header | `AIProviderService.ts:240`, `aiModelCatalog.ts:310`, `ExplainModal.tsx:34` | `aiModelCatalog.test.ts:92`, `:101` (direct), `:104` (Worker fallback without it) |
| OpenAI-compatible base-URL normalisation | `AIProviderService.ts:159` `resolveChatCompletionsUrl` | `AIProviderService.test.ts:39` (`:49` expects `https://openrouter.ai/api/v1/chat/completions`), `:54`, `:60`. That is one of the three forms; the other two: **no test** |
| `AIEvents.*` names | `events/registry.ts:122-127`; fired at `types/jodie.ts:610` (SETTINGS_CHANGED), `:841`, `:855` (PROVIDER_CHANGED), `AIProviderService.ts:826` (MODELS_UPDATED), `services/PromptService.ts:160,172,215,227` (PROMPT_CHANGED) | **no test** (grep over the three files: 0) |
| Catalog 24 h TTL, key-hash cache | `services/aiModelCatalog.ts:47`, `:73`, `:85` (`hashKey`, `CATALOG_TTL_MS` imported by the test at `:3`) | `aiModelCatalog.test.ts:77` («refreshes when missing, for another key or past 24 h; never without a key»), `:148`, `:206` |
| Jodie feature layer (scope, offer cards, reserved gate, RAG) | out of scope | `components/Jodie/__tests__/reservedIdentifierGate.test.ts` and others; untouched |

Also observed [R]: `AIConfig.getStatus` (`types/jodie.ts:876`) reads `if (this.isConfigured()) return { text: 'Not configured', … }`.
The condition looks inverted. It is reported here, not judged: L2 decides whether the status label moves as-is.

## A7. Tests covering the AI layer today [M]

Run: `node scripts/run-quiet.mjs L0-ai-tests -- npm run test -- <three files>` → `[run-quiet] exit 0`, «Test Files 3 passed (3) /
Tests 57 passed (57)», 254 ms. Log: `.agent-logs/L0-ai-tests-20261102-103306.log`.

| File | Lines | `it`/`test` call sites | Lane fate |
|---|---|---|---|
| `services/__tests__/AIProviderService.test.ts` | 305 | 17 (`it.each` expands) | L3 delete |
| `services/__tests__/aiModelCatalog.test.ts` | 386 | 28 | L4 modify; it also breaks at L3 (§A4 item 5) |
| `types/__tests__/aiProxyEndpoint.test.ts` | 51 | 4 | L4 delete |

Total 57 tests after `it.each` expansion. Search: `command grep -rlE "AIProviderService|AIConfig|JodieConfig|aiModelCatalog|types/jodie|\.\./jodie|ProviderModelSelector|AIDisclaimer|ExplainModal|resolveChatCompletionsUrl" --include='*.test.ts' --include='*.test.tsx' src`.
It also returned `components/Jodie/__tests__/conversationDeadline.test.ts`, a JjEL deadline test outside the AI layer. There are no
component tests for `ProviderModelSelector`, `AISettingsContent`, `ExplainModal`, `AIDisclaimer` or the settings modals.

## A8. The Worker [R + M]

- `cloudflare-worker/` holds `README.md`, `.gitignore`, `package.json`, `package-lock.json`, `tsconfig.json`, `wrangler.toml` and
  `src/index.ts` (297 lines).
- `wrangler.toml`: `name = "jjodel-ai-proxy"`,
  `ALLOWED_ORIGINS = "https://jjodel.io,https://www.jjodel.io,https://app.jjodel.io,https://beta.jjodel.io,http://localhost:3000,http://localhost:5173"`.
  `src/index.ts:15` and `:51-62` also allow any local hostname on any port. A refused origin gets 403 (`:247-248`).
- Routes (`src/index.ts:257-283`):
  - `/health`
  - `POST /v1/anthropic/messages`
  - `GET /v1/anthropic/models`
  - `GET /v1/gemini/models`
  - `POST /v1/gemini/*`
- Deployed at `https://jjodel-ai-proxy.alfonso99.workers.dev` (`types/jodie.ts:174`; `VITE_AI_PROXY_URL` overrides it, `:176`).

Places in `src/` that can still send a request to it [M]. The search was `command grep -rnE "getEndpoint\(\)|getProxyBase\(\)|fetchCatalog\(|fetchAnthropicCatalog\(|providerNeedsProxy\(" src`
outside `__tests__`, exit 0:
1. **The only live path**: `services/AIProviderService.ts:821`
   `const result = await fetchCatalog(provider, apiKey, getProxyBase());` (model refresh and the catalog part of the connection
   test), then `services/aiModelCatalog.ts:362-364`, the retry on `<proxyBase><proxyPath>` when `fetch` rejects. Only Claude
   (`proxyPath: '/v1/anthropic/models'`, `:307`) and Gemini (`'/v1/gemini/models'`, `:324`) have a `proxyPath`.
2. `AI.getEndpoint()` returns the Worker only when `this.proxy` is set (`types/jodie.ts:247`). Only `AI.Claude.proxy` is set
   (`:419`), and **no code calls `AI.Claude.getEndpoint()`**: the callers are GPT, DeepSeek, Gemini, Mistral, Groq and Kimi
   (`AIProviderService.ts:336`, `:391`, `:445`, `:542`, `:595`, `:626`, `:739-749`). `chatClaude` posts to `AI.Claude.endpoint`
   directly (`:234`). The branch is exercised only by `types/__tests__/aiProxyEndpoint.test.ts`.
3. `ExplainModal.tsx` streams Claude to `AI.Claude.endpoint` (`:28`) and the others to `llm.endpoint` (`:80`, `:148`), never through `getEndpoint`.

Adjacent, not the AI proxy: `components/NotificationWidget/NotificationWidget.tsx:24` `const API_URL = 'https://jjodel-notifications.alfonso99.workers.dev';`.
It is a second Worker on the same account and subdomain, with no source in this repo (`command grep -rn jjodel-notifications cloudflare-worker`:
no hit; the same search finds the `jjodel-ai-proxy` lines in the README). Removing the AI-proxy deployment (⑥) must leave this
Worker alone.

---

## B. Spike (outside the repo, `~/.jjodel-lanes/spike196/`)

### B1. Packages [M]

- Installed with `npm install --save-exact` in the spike folder, Node v22.22.2.
- The `latest` dist-tags came from `npm view <pkg> dist-tags.latest` on 2026-11-02.
- An earlier install in the same folder used three versions I had not taken from that query. It was overwritten by the
  `latest` versions below, and nothing was measured on it.

| Package | Version (published) | Licence | Prod transitive deps | Peer deps | Browser ESM entry |
|---|---|---|---|---|---|
| `openai` | 7.47.0 (2026-10-31) | Apache-2.0 | 0 | 7, all optional (`@aws-sdk/credential-provider-node`, `@smithy/*`, `google-auth-library`, `undici`, `ws`, `zod`) | universal ESM `index.mjs` (`exports['.'].default`); fetch-based; no `browser` condition; `engines.node >=22` |
| `@anthropic-ai/sdk` | 1.3.0 (2026-10-23) | Apache-2.0 | 7 (`@opentelemetry/api`, `standardwebhooks`, `@stablelib/base64`, `fast-sha256`, `json-schema-to-ts`, `@babel/runtime`, `ts-algebra`) | `zod` (optional) | universal ESM `index.mjs`; a `browser` field swaps `internal/node.*` for `internal/node.browser.*` |
| `@google/genai` | 2.32.0 (2026-10-29) | Apache-2.0 | 40 (`google-auth-library`, `ws`, `protobufjs`, `p-retry`, `node-fetch`, …, mostly Node-side) | `@modelcontextprotocol/sdk` (optional) | explicit `browser` export condition, `dist/web/index.mjs`; `engines.node >=20` |

The node images (`Dockerfile:2`, `Dockerfile.microservices:2`) are `node:22-alpine`; local Node is v22.22.2. None of the three is
already in `frontend/package.json` (`command grep` exit 1).

### B2. Bundle size [M]

esbuild 0.27.7 from the worktree's `frontend/node_modules`, `--bundle --format=esm --platform=browser --minify`. There is one
entry per SDK (`entries/*.mjs`), and each uses client construction, chat, streaming and the model list (Gemini adds
`generateContent` with `inlineData` and `generateContentStream`). Gzip is level 9.

| SDK | Raw bytes | Gzip bytes |
|---|---|---|
| `@anthropic-ai/sdk` 1.3.0 | 347 950 | 77 941 |
| `@google/genai` 2.32.0 | 415 721 | 77 748 |
| `openai` 7.47.0 | 389 180 | 85 938 |
| **total** | 1 152 851 | 241 627 |

The plan's lazy-chunk rule (dynamic `import()` inside provider methods) keeps all of this out of the initial bundle. L1's
`vite build` chunk diff is where that is proven.

### B3. Browser calls [M]

- **Setup**: a static page at `http://localhost:3010` (port free per `lsof`), served in-process by the driver and closed at the end.
  `lsof` after the run reports 3010 free. Chromium came through `@playwright/test` 1.62.1 from the worktree.
- **Key presence**: `ANTHROPIC_API_KEY` absent, `GEMINI_API_KEY` set, `GROQ_API_KEY` absent, `KIMI_API_KEY` absent,
  `DEEPSEEK_API_KEY` absent, `MISTRAL_API_KEY` absent, `OPENAI_API_KEY` set.
- **Call count**: 18 of the 20 allowed, in two passes (`drive.mjs` 11, `drive2.mjs` 7, two of them keyless Node preflights).
  `max_tokens` was 16 for chat; Gemini `maxOutputTokens` was 32.
- **Results**: `results.json` and `results2.json` in the spike folder. Both are checked for key material before they are written.

| Family / arm | Op | Status | Latency | Shape |
|---|---|---|---|---|
| Anthropic / real | all | **skipped**: `ANTHROPIC_API_KEY` absent | | |
| Anthropic / invalid | `models.list` | **no HTTP status: CORS-blocked** («Connection error.», cause `TypeError`; console: «No 'Access-Control-Allow-Origin' header is present on the requested resource») | 607 ms | |
| Anthropic / invalid | `messages.create` (`claude-haiku-4-5`) | 401, readable, ACAO `*`, `authentication_error` | 423 ms | |
| Anthropic / invalid | `messages.stream` | 401, readable, ACAO `*` | 407 ms | |
| Anthropic / preflight (Node, keyless) | `OPTIONS /v1/models`, `OPTIONS /v1/messages` | 200 / 200, ACAO `*`, ACAH lists `anthropic-dangerous-direct-browser-access, anthropic-version, content-type, x-api-key, x-stainless-*` | | |
| Gemini / real | `models.list` | 200, ACAO `http://localhost:3010` | 652 ms | 60 models; first 3 `models/gemini-2.5-flash`, `models/gemini-2.5-pro`, `models/gemini-2.5-flash-preview-tts` |
| Gemini / real | `generateContent` `gemini-2.5-flash-lite` | 404 «This model models/gemini-2.5-flash-lite is no longer available to new users. Please update your code to use models/gemini-3.5-flash-lite…» | 317 ms | (it is still in the list) |
| Gemini / real | same + `inlineData` PDF | 404, same | 261 ms | |
| Gemini / real | `generateContent` `gemini-3.5-flash-lite` | 200 | **15 015 ms** | 4 chars, «pong» |
| Gemini / real | `generateContent` + `inlineData` PDF (590-byte one-page PDF made in the spike, `mkpdf.mjs`) | 200 | **22 825 ms** | 16 chars, «Jjodel spike 196» (the exact text on the page) |
| Gemini / invalid | `models.list` | **400** (not 401), readable, `API key not valid…`, reason `API_KEY_INVALID` | 67 ms | |
| OpenAI / real | `models.list` | 200, ACAO `*` | 1 288 / 1 748 ms | 136 models; first 3 `gpt-4-turbo-2024-04-09`, `gpt-realtime-2.1-mini`, `gpt-realtime-2025-08-28` |
| OpenAI / real | `chat.completions.create` `gpt-4.1-nano` | 404 «has been deprecated» | 1 414 ms | |
| OpenAI / real | stream `gpt-4.1-nano` | 404, same | 517 ms | |
| OpenAI / real | `chat.completions.create` `gpt-4o-mini` | **429** «You have no credits remaining. Add credits to continue» | 1 121 ms | |
| OpenAI / real | stream `gpt-4o-mini` | 429, same | 570 ms | |
| OpenAI / invalid | `models.list` | 401, readable, ACAO `*`, «Incorrect API key provided» | 250 ms | |

**What the SDKs need in a browser** [R, `node_modules` of the spike]:
- `@anthropic-ai/sdk`: `dangerouslyAllowBrowser: true`, otherwise it throws «It looks like you're running in a browser-like
  environment» (`client.mjs:144-145`).
  - With the flag it adds `anthropic-dangerous-direct-browser-access: true` itself (`client.mjs:969-970`). The header was seen
    on all three requests, `browserAccessHeader: true`.
  - It sends `anthropic-version: 2026-10-21` (`:971`). Today's code sends `2023-06-01` (`aiModelCatalog.ts:309`).
  - It authenticates with `Authorization: Bearer <apiKey>` (`client.mjs:452`), not `x-api-key`. The observed request headers
    carry `authorization` and no `x-api-key`.
- `openai`: `dangerouslyAllowBrowser: true`, the same guard (`client.mjs:233-234`); `Authorization: Bearer`.
- `@google/genai`: no browser flag. It sends the key as `x-goog-api-key` (observed on every request); no `?key=` query
  (`queryHasKey: false`).

**Error classes → `FailureCatalog`**:
- The minified bundles mangle constructor names. Pass 2 mapped them back to the SDK exports where it could:
  - OpenAI 401 → `AuthenticationError` [M]
  - OpenAI 404 → `NotFoundError` [M]
  - OpenAI 429 → `RateLimitError` [R, by the SDK's status mapping]
- The Anthropic and Gemini names could not be mapped from the bundle, so these come from source and message [R]:
  - Anthropic 401 → `AuthenticationError`
  - Anthropic CORS block → `APIConnectionError` (message «Connection error.», `core/error.mjs`)
  - Gemini → `ApiError` (`dist/web/index.mjs:7820`) with `status` 400 and reason `API_KEY_INVALID`
- AUTH from a readable 401 is proven for Anthropic `/v1/messages` and OpenAI `/v1/models`. For Gemini AUTH has to be read from a
  400 plus the reason, as today's code already does (`AIProviderService.test.ts:246`).

**Consequences**:
- **Anthropic connection test.** A bad Anthropic key on `models.list` is **not readable from the browser**: preflight passes,
  but the 401 response has no `Access-Control-Allow-Origin`, so the SDK reports a network failure. Today
  `testConnection('Claude')` lists models (`aiModelCatalog.test.ts:166-195`); without the Worker, an invalid Claude key would be
  classified NETWORK, not AUTH. Whether a **valid** key's 200 on `/v1/models` carries ACAO is **not measured** (no key). This
  is the Worker's real remaining job, and it gates L4/⑥, not L1.
- **OpenAI quota.** OpenAI reports an empty balance as 429 `RateLimitError`. Mapped to `FailureCatalog.RATE` it would read as
  «retry later». The classifier needs the error code if the message should say «no credits».
- **Model drift.** `gemini-2.5-flash-lite` is listed by `models.list` but refused for new users, and `gpt-4.1-nano` is deprecated.
  The list endpoints are not a guarantee that a model answers, which matters for `resolveModel()`. `types/jodie.ts:350` already
  seeds `gemini-3.5-flash-lite`.
- **Gemini latency.** 15 s and 23 s were measured once each, on `gemini-3.5-flash-lite`. That is one sample, not a benchmark.

## C. Version freeze proposal

| Package | Version | Reason |
|---|---|---|
| `openai` | `7.47.0` | current `latest`; zero transitive deps; universal fetch-based ESM; browser use proven for models.list, the readable 401 and a readable 429 on chat; 85.9 KB gzip |
| `@anthropic-ai/sdk` | `1.3.0` | current `latest`; adds the browser header itself under `dangerouslyAllowBrowser`; `/v1/messages` create and stream reach Anthropic from the browser with a readable 401; 77.9 KB gzip. Real-key arm still owed |
| `@google/genai` | `2.32.0` | current `latest`, the package of decision ①; dedicated `browser` ESM build; models.list, generateContent and `inlineData` PDF proven from the browser; 77.7 KB gzip |

Lines L1 would add to `frontend/package.json` `dependencies` (exact pins, rule 4). This lane does not add them:

```json
"@anthropic-ai/sdk": "1.3.0",
"@google/genai": "2.32.0",
"openai": "7.47.0",
```

---

## Corrections to the L1..L6 file lists (from A4/A5/A8)

1. L1: per-provider key is `jjodie_provider_<name lowercase>`, not `jjodel_provider_<name>`; add `jjodie-credentials` (keeps `dockWidth` and a second key copy), the two migration sentinels and `jjodel_models_<provider>` to the store round-trip tests.
2. L1: `validateKey()` prefixes are `sk-ant-`, `sk-`, `gsk_`. `AIza` is commented out today (`AIProviderService.ts:959`, `:970`); adding it changes behaviour.
3. L1: «Ollama enabled without key» means `baseUrl` instead of key (`types/jodie.ts:888`).
4. L1: Anthropic SDK sends `Authorization: Bearer` and `anthropic-version: 2026-10-21`; existing fetch-mock assertions on `x-api-key` (`aiModelCatalog.test.ts:101`) do not carry over.
5. L2: remove `components/common/ProviderSelector.tsx` and `components/settings/ProviderSettings.tsx` (orphans). Delete them in a sweep instead (deletion is on the RC-26 list).
6. L2: add `components/StatusBarRightZone.tsx`, `jjtl/services/MappingSuggestionService.ts`, `pages/settings/AIAssistantSettings.tsx` (sole importer of `ProviderConfigModal`), `components/Jodie/JodieWindow.tsx` (`JodieConfig.hasEnabledProviders`, `dockWidth`), `components/Jodie/ChatMessages.tsx` (`AI[message.provider]`).
7. L2: `DocumentationTab.tsx` and `SuggestedMappingsPanel.tsx` are more than preference reads (`AI`, `JodieConfig`, `ALL_AI_PROVIDERS`).
8. L2 or L3: `pages/settings/ProviderConfigModal.tsx:78` and `components/settings/AISettingsContent.tsx:9` and `components/common/ProviderModelSelector.tsx:15` call `AIProviderService`; L3's deletion depends on them having moved.
9. L3: add `services/__tests__/aiModelCatalog.test.ts` (imports `AIProviderService` at `:160`, `:170`, `:254`, `:376`).
10. L3: `AIEvents.MODELS_UPDATED` is fired by `AIProviderService.ts:826`; it must move with the catalog refresh. `PROMPT_CHANGED` is fired by `PromptService.ts` and is not part of the stores.
11. L4: `providerNeedsProxy` and `PROVIDER_ENDPOINTS` are already inside a comment (`types/jodie.ts:1232` on); the live proxy surface is `getProxyBase` `:173`, `AI.proxy` `:211`/`:419`, `getEndpoint` `:246-254`, and `aiModelCatalog.ts` `proxyPath` `:296`, `:307`, `:324`, `:362-364`, plus `AIProviderService.ts:821`.
12. L4/⑥: removing the Worker loses AUTH classification for a bad Claude key on `models.list` (§B3). L4 needs either `test()` on `/v1/messages` or the real-key measure first.
13. L6: add `components/Jodie/JodieHeader.tsx` and `services/JjodieContext.ts`; drop `MarkdownMessage.tsx` (not an importer); `JjodieMinimized` is `JodieMinimized.tsx`; `Jjie…` matches nothing.
14. L6: the Doc types (`DocumentationSectionType`, `DocumentationSection`, `DocumentationStatus`, `ProjectDocumentation`) need a destination, e.g. `services/DocumentationService.ts` or a `types/documentation.ts`.
15. L6 docs: CLAUDE.md §16 `useAIProviderPreference` and `<ProviderSelector …>` are stale (§A4).

## Risks and dependencies

- **R-④**: the view context and the OCL registry make the three names reachable from user content. Nothing in the repo uses
  them, and server projects are unmeasured. The failure would be a runtime `ReferenceError` in a user's view after L6, not a
  load failure.
- **R-⑥**: a valid-key `/v1/models` CORS behaviour from the browser is unmeasured. An invalid key's 401 is not readable.
- **R-dockWidth**: `JodieConfig.current.dockWidth` lives in the credentials blob. A store rewrite that drops unknown fields
  loses the dock width.
- **R-double keys**: API keys are stored twice (`jjodie_provider_<name>` and `jjodie-credentials.providers`). Which copy wins at
  load is a behaviour to pin in L1 before the stores replace both.
- **R-quota**: a 429 for an empty balance is indistinguishable from rate limiting unless the error code is read.

## Decisions taken (unattended)

1. The Anthropic real-key arm was skipped because the key line is empty. The invalid-key arm also covered `models.list` and
   `messages.stream`, and two keyless preflight probes were added (counted against the 20-call budget).
2. Model picks were adjusted inside the budget after 404s. Gemini moved to the model the API itself named; OpenAI moved to
   `gpt-4o-mini`.
3. The minified error names were mapped back through the SDK exports where possible, and through source otherwise. Each mapping
   is marked [M] or [R].

## Decisions awaiting Alfonso (RC-26)

1. Deleting `cloudflare-worker/` and the Cloudflare deployment (⑥), the account being Alfonso's, and whether the notifications
   Worker stays.
2. Deleting the two orphans `components/common/ProviderSelector.tsx` and `components/settings/ProviderSettings.tsx` (with their
   stylesheets).

## Questions for Juri

1. Decision ④: is the OCL/view contract on `AI` / `AIConfig` / `JodieConfig` declared dead? There are 0 uses in repo content
   (§A3) and server projects are unmeasured. **Recommended:** yes, declare it dead, and announce it in the CHANGELOG at L6.
2. Rule 4: are `openai@7.47.0`, `@anthropic-ai/sdk@1.3.0` and `@google/genai@2.32.0` approved, exact-pinned, dynamically
   imported? **Recommended:** approve these three pins for L1.
3. Decision ⑤: abstract class `BaseProvider`, module `src/services/ai/`. **Recommended:** confirm both names as written.
4. Decision ⑥: delete `cloudflare-worker/` after the deployment is removed? A8 found one live path, the catalog fallback for
   Claude and Gemini, and the spike shows a bad Claude key on `models.list` is CORS-blocked without it. **Recommended:** keep ⑥,
   but gate L4 on a real-key Anthropic spike arm and on moving the Claude `test()` to `/v1/messages`. Leave the notifications
   Worker untouched.
5. Are the fifteen corrections to the L1..L6 file lists above adopted as one list in the frozen spec? **Recommended:** adopt all
   fifteen. The two orphan deletions go to Alfonso (RC-26).
6. Can you add an Anthropic key (and, optionally, credit on the OpenAI account) for a short real-key re-run before L4?
   **Recommended:** yes, before L4; it does not block L1.
