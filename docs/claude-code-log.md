# Claude Code Session Log

## 2026-04-21 — fix: remove horizontal slide animation on tab switch
**Prompt**: Tab switches in the top tab bar (Test Matching / Unnamed / metamodel_1 / metamodel_2 / transformation tabs) animated the content panel with a horizontal slide. Remove only that slide; leave every other animation intact.
**File toccati**:
- frontend/src/components/abstract/style.scss (`.dock-content-animated { transition: margin 0.3s }` → `transition: none`)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Case C (CSS puro)** per the prompt's taxonomy. The slide was produced by the rc-tabs pattern (used via rc-dock): rc-tabs' `TabPanelList/index.js:44` sets an inline `style={{ marginLeft: "-N00%" }}` on the content container to scroll to the active tab pane, and `.dock-content-animated { transition: margin 0.3s }` turns the margin change into a 300ms horizontal slide. Removing only the transition keeps the positioning logic intact (tabs still display correctly) while making the switch instantaneous. **Discovery subtlety**: the `.dock-content-animated` rule exists in 3 places: (1) `node_modules/rc-dock/dist/rc-dock.css:114` — NOT imported by our code, (2) `src/components/abstract/style.scss:194` — **imported transitively via `Dock.tsx:1`, this is the live one**, (3) `src/components/abstract/style_ap.scss:199` — orphan copy, never imported. Fixed only the live source (option 2). No `!important` needed — rc-dock's own CSS is never imported, so nothing fights with our rule. The orphan `style_ap.scss` copy is left untouched (cleanup is out of scope). The vertical fade-in animation (`tabFadeIn` at `dock-tabs.scss:400-413`, 150ms translateY 4→0 + opacity) is **intentionally preserved** — it's not a horizontal slide and the prompt's Case C instructs to avoid touching unrelated transitions. All other transitions in the dock area (hover, focus, ink-bar, pinned-strip rotation, etc.) unchanged. Build `✓ built in 1m 12s`. Manual smoke test (steps 1-4 in the prompt) required on the user's side.
**Nome del documento prompt**: 2026-04-21 (remove tab switch slide animation)

---

## 2026-04-21 — fix: restore match arrows rendering in Suggested Mappings (one-line uncomment)
**Prompt**: Suggested Mappings generates 12 mappings but the SVG arrows between source/target metamodels on the center canvas no longer render. Diagnosis (prior prompt) traced the silent failure to a bulk console.log cleanup on 2026-04-16 that over-shot by one line, commenting the functionally-essential `onSuggestionsChange(suggestionsCopy)` call along with the log's orphan arguments.
**File toccati**:
- frontend/src/jjtl/views/SuggestedMappingsPanel.tsx (line 214: removed `// ` prefix restoring the parent-notification call)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: One-line change. Regression commit `4d81bbed33` (Juri Di Rocco, 2026-04-16, "Fixed synbtax errors: refactorung console.log") had commented three consecutive lines: two were orphan arguments of a multi-line `console.log` that the previous day's commit `0787639fdf` (2026-04-15) had only partially commented (first line only), leaving the rest as invalid expressions — correct to comment. The third line was `onSuggestionsChange(suggestionsCopy);`, a separate essential call that ran the parent-notify pipeline. Uncommented that one only. Lines 211-213 (the original console.log and its arguments) remain commented — they were the genuine target of the cleanup and restoring them would reintroduce verbose logging. Data pipeline now fully connected: SuggestedMappingsPanel.setResult → useEffect → onSuggestionsChange → JjtlDevelopmentEnv.handleSuggestionsChange → setSuggestions → suggestionMappings memo → DualMetamodelPanel → MappingLinesOverlay (SVG renderer, 12-color palette at MappingLinesOverlay.tsx:51-64). Build `✓ built in 47.17s`. Manual smoke test (click Analyze → verify 12 arrows appear between the two trees) required on the user's side. Sibling observation (noted but not addressed in this fix): commit 4d81bbed33 touched 18 files with the same multi-line-log-overshoot pattern; a follow-up audit of those files would be prudent since the same mistake could have caught other essential calls.
**Nome del documento prompt**: 2026-04-21 (restore match arrows one-line uncomment)

---

## 2026-04-20 — fix: common ProviderSelector — gate option disable by `isConfigured()` not `.enabled`
**Prompt**: In the Suggested Mappings (and DocumentationTab) dropdown, every provider except the currently-selected one appeared disabled even with a valid API key. Regression introduced in commit 1ed5f4862 (24 Feb 2026, "nearly done refractor ai") which changed `disabled={!provider.available}` to `disabled={!AIConfig.get(provider).enabled}`. The `.enabled` flag is flipped true ONLY from `ProviderConfigModal.tsx:84` after a successful "Test Connection"; providers with saved keys but never-tested stayed disabled indefinitely.
**File toccati**:
- frontend/src/components/common/ProviderSelector.tsx (line 120, single-line change: `!AIConfig.get(provider).enabled` → `!AIConfig.get(provider).isConfigured()`)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Defensive Option B chosen (per the diagnostic report): align the per-option disable gate with the upstream list filter `JodieConfig.getEnabledProviders()` which already uses `isConfigured()`. Option A (remove the attribute entirely) would have been equivalent functionally but less defensive — keeping the check means that if an entry somehow bypasses the list filter, it still gets gated by the same predicate. Both predicates now resolve to "has API key (or baseUrl for Ollama/Custom)". `JodieConfig.getEnabledProviders()` unchanged; `Jodie/ProviderSelector.tsx` unchanged (has no per-option gate); `AIConfig.enabled` field + its write paths in `ProviderConfigModal.tsx` unchanged — the `.enabled` flag is now unused in this read site, but it's still written after Test Connection and consulted by `getStatus()` for the "Connected"/"Error" badge in Settings. Build `✓ built in 1m 15s`. Manual smoke test (Claude+Groq with Groq untested) required on the user's side to confirm Groq is now clickable.
**Nome del documento prompt**: 2026-04-20 (fix disabled options common ProviderSelector)

---

## 2026-04-20 — fix: scope edge-crossing jump markers to the active canvas only
**Prompt**: In editor v2, switching between metamodel_1 / metamodel_2 tabs showed phantom jump arcs on edges that only cross edges from the *other* metamodel. Scope the crossing detection to the active React Flow instance.
**File toccati**:
- frontend/src/components/editor-v2/utils/edgeUtils.ts (getEdgeCrossings: new optional `activeNodeIds?: Set<string>` 3rd param; registry filter inside the loop skips entries whose source or target isn't in the active set; `nodeRects?` shifts to 4th param)
- frontend/src/components/editor-v2/edges/UnifiedEdge.tsx (build activeNodeIds from `useNodes()`, pass as 3rd arg to getEdgeCrossings; useMemo dep list updated)
- frontend/src/components/editor-v2/hooks/useTreeLayout.ts (same: compute activeNodeIds once from allNodes; both getEdgeCrossings call sites — trunk + tree segments — now pass activeNodeIds as 3rd arg and keep `[]` as 4th for nodeRects)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Scenario B confirmed**: `edgePathRegistry` at edgeUtils.ts:1141 is a module-level singleton `Map<string, EdgePathEntry>`. Every UnifiedEdge across every React Flow instance writes into it; with DockManager keeping tabs mounted, edges from hidden tabs persist in the registry and contaminate the visible tab's crossing detection. **Fix chosen: Option 1** (React Flow hook-based scoping). Both call sites (UnifiedEdge.tsx and useTreeLayout.ts) already use `useNodes()` which returns canvas-scoped nodes — just built a Set of node IDs from it and threaded to `getEdgeCrossings`. Filter logic: `if (activeNodeIds && (!has(sourceNode) || !has(targetNode))) continue` — both endpoints must be in the active canvas (no false positives from edges crossing the boundary; in v2 this case doesn't happen). Backward-compatible: omitted `activeNodeIds` → no filter (legacy behaviour). **Alternative considered and rejected**: clearing the registry on canvas unmount — doesn't work because Jjodel's DockManager keeps tabs in DOM. **No Redux touched, no store-side change**: fix is purely on the consumer (detection side), per the constraint. Tree-segment entries registered by useTreeLayout (suffixed edge IDs like `__trunk`, `__tree_0`) share source/target node IDs with the parent inheritance edge, so they're scoped correctly for free. Manual smoke test (metamodel_1 ↔ metamodel_2 switching) still required; code-level math: Set lookup is O(1), filter runs inside the existing O(N) registry scan, no performance regression. Build `✓ built in 1m 14s`.
**Nome del documento prompt**: 2026-04-20 (scope edge-crossing jumps to active canvas)

---

## 2026-04-20 — docs: Jjodie system prompt — add "reserved keywords" rule
**Prompt**: Jjodie was emitting commands like `create attribute abstract in Project type String` where `abstract` is a JjScript keyword, causing parser errors. Add an explicit rule forbidding reserved words (keywords + primitive types) as identifiers, with concrete FORBIDDEN/CORRECT examples and a matching bullet in Best Practices.
**File toccati**:
- frontend/src/constants/defaultPrompts.ts (CHAT_PROMPT only — added rule #8 + new Best Practices bullet)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: MANDATORY RULES now ends at point 8. Rule 7 (enum vs attribute, added earlier today) still resolves correctly. Reserved-word list as provided in the prompt: keywords (create, delete, rename, class, abstract, attribute, reference, containment, enum, literal, extends, in, to, type) + primitive types (String, int, boolean, Date). Applied case-insensitive rule per spec. Prompt's closing note flagged that list was deduced from the Syntax Reference; if parser exposes more keywords (e.g. package, import, constraint), a follow-up prompt will extend it. No other CHAT_PROMPT content changed; other prompt constants in the same file (DOCUMENTATION, VALIDATION, REFACTORING, OCL, IMPORT) untouched. tsc clean for defaultPrompts.ts.
**Nome del documento prompt**: 2026-04-20 (reserved keywords rule)

---

## 2026-04-20 — feat: contextual recovery actions for JjScript execution error modal
**Prompt**: When JjScript execution fails on a systematic, mechanically-fixable pattern (e.g. repeated `create literal X in Y` where Y is actually an attribute, not an enum), offer one-click recovery actions in the error modal instead of forcing N manual Skip Line clicks. Extensible architecture for future rules.
**File toccati**:
- frontend/src/jjscript/recovery/types.ts (NEW — RecoveryContext/RecoveryAction/RecoveryRule)
- frontend/src/jjscript/recovery/rules.ts (NEW — literalInAttributeRule, RECOVERY_RULES registry, findRecoveryActions scanner, isCreateLiteralInTarget utility)
- frontend/src/jjscript/recovery/index.ts (NEW — barrel)
- frontend/src/jjscript/components/ExecutionErrorDialog.tsx (+2 optional props: recoveryActions + onRecoveryAction; new "Quick actions" section above the existing Skip/Close row)
- frontend/src/jjscript/components/ExecutionErrorDialog.scss (new .exec-error-recovery + .exec-error-recovery-title + .exec-error-recovery-list + .exec-error-recovery-btn styles, additive only)
- frontend/src/jjscript/components/ScriptBlock.tsx (recoveryActions state + effect computing it from pauseInfo; runCommandsFromIndex helper; handleRecoveryAction dispatcher with cases 'createEnumAndRetry' and 'skipMatchingCreateLiteral'; props passed to dialog)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Architecture**: rules are pure matchers returning discriminated-union actions (id/kind/label/icon + kind-specific payload); no closures cross the rule→component boundary, so rule authors can't accidentally hold references to component state. Handlers live in ScriptBlock.tsx where they have access to state setters + onExecute. Adding a new rule is 4 steps documented in types.ts. **First match wins** in the registry to avoid action-button spam. **Rule implemented**: `literalInAttributeRule` checks 4 conditions (command matches regex, error contains "Literals can only be added to enums", an attribute with case-insensitive name Y exists, NO enum with exact name Y exists); proposes 2 actions: (A) "Create enum Y and retry" — runs `create enum Y` via onExecute, then re-runs from the failed line; if enum creation itself fails, surfaces that as the new pause (not swallowed); (B) "Skip all `create literal ... in Y`" — scans remaining lines case-sensitive on Y, marks all matches as skipped in lineStates + skippedLinesSet, resumes from first non-matching line. **ScriptExecutionWindow.tsx** (another consumer of the dialog) NOT wired — props are optional so backward compatible; only ScriptBlock gets recovery UX in this iteration. **Did not refactor** handleSkipAndContinue; instead duplicated the execution loop in a new local `runCommandsFromIndex(startIdx, skipSet)` helper used only by recovery dispatchers. **Enum existence check** tries model.children, model.classes (filtering by className containing "Enum"), model.enumerators, and project.enumerators — robust to whichever representation the framework uses. **No CSS class collisions** (verified via grep: `exec-error-recovery` was not previously used). Recovery action logged via `JjScriptEvents.EXECUTED` with `recovery: true` detail flag so console listeners can visually distinguish. Build `✓ built in 1m 14s`. Manual UI smoke test by user still required.
**Nome del documento prompt**: 2026-04-20 (recovery actions in JjScript error modal)

---

## 2026-04-20 — docs: Jjodie system prompt — add "enum vs attribute" disambiguation rule
**Prompt**: Jjodie was generating JjScript that creates an attribute and then tries to add literals to it, triggering "Cannot create literal in attribute 'X'". Add a mandatory rule explaining the correct two-step pattern (declare enum + literals first, then attribute typed on the enum).
**File toccati**:
- frontend/src/constants/defaultPrompts.ts (CHAT_PROMPT — added rule #7 + expanded Enumerations example)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Verified current state before editing: MANDATORY RULES ended at point 6 (comments), so the no-circular-inheritance rule from earlier orphan fragments was NEVER actually applied — the prompt's conditional wording ("se la regola no-circular-inheritance è già stata inserita come punto 6, questa diventa punto 7") resolved to point 7 since point 6 is "Add comments with #". Both modifications applied verbatim from spec. Enumerations block expanded with inline FORBIDDEN example mirroring the runtime error message. No refactoring, no rename; only CHAT_PROMPT modified (other prompt constants untouched). tsc clean for defaultPrompts.ts.
**Nome del documento prompt**: 2026-04-20 (enum vs attribute rule)

---

## 2026-04-20 — fix: AI picker popover — correct width overrides (compact mode specificity + stray flex:1)
**Prompt**: Previous popover width fix didn't take effect. All model names showed ellipsis even for short ones (e.g. "Claude Opus 4.7"). Root-cause and fix properly.
**File toccati**:
- frontend/src/components/common/ProviderModelSelector.scss (two fixes below)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Root cause discovery (CSS specificity)**: (1) `.provider-selector.compact .provider-menu { min-width: 180px }` in ProviderSelector.scss (specificity 0,3,0) was beating my `.pm-popover { min-width: 280px }` (0,1,0) because both JodieHeader and DocumentationTab pass `compact`. Popover stayed at 180px. (2) `.provider-option span { flex: 1 }` (0,1,1) was applying to **every** span inside a model button, including my `.pm-caps` icon span. So label AND caps both had `flex: 1` and split the row equally — label got narrow → ellipsis fired even for 15-char names. **Fix (1)**: scoped my popover rule as `.provider-selector .pm-popover, .provider-selector.compact .pm-popover` to match/beat the compact override; bumped values to `min-width: 320px / max-width: 480px` per new prompt. **Fix (2)**: explicitly set `.pm-model-label { flex: 0 0 auto }` and `.pm-caps { flex: 0 0 auto; margin-left: auto }` inside `.pm-model-option`, neutralizing the inherited `flex: 1` from ProviderSelector's span rule; removed `text-overflow: ellipsis` and `min-width: 0` from the label (with `width: max-content` on popover, the container now widens naturally to fit the longest nowrap label; for labels that still exceed max-width, the parent `.provider-menu { overflow: hidden }` clips and the `title` attribute tooltip already added previously provides the full name). No `!important` used — specificity increase was sufficient. Trigger dedup (Option B) was already correct in the prior turn: "Groq Canopy Labs Orphe…" in the header is correct output of the dedup (Groq + "Canopy…") truncated by the trigger's own compact 160px max-width, NOT a "Groq Groq" duplication. Build `✓ built in 1m 13s`. **Manual visual verification by user required** — I cannot run dev server; CSS specificity math verified against the actual rules in ProviderSelector.scss.
**Nome del documento prompt**: 2026-04-20 16:30

---

## 2026-04-20 — fix: AI picker popover — single-line model names with ellipsis overflow
**Prompt**: Fix multi-line wrapping of long model names in ProviderModelSelector popover (observed with Groq: "Whisper Large V3 Turbo", "Canopy Labs Orpheus V1 English"). Widen popover within sensible bounds and truncate long names with tooltip fallback.
**File toccati**:
- frontend/src/components/common/ProviderModelSelector.scss (.pm-popover → width:max-content + min-width:280px + max-width:420px; .pm-model-label → white-space:nowrap + overflow:hidden + text-overflow:ellipsis + min-width:0 for flex-child shrinkage)
- frontend/src/components/common/ProviderModelSelector.tsx (title={m.version.label} on both non-legacy and legacy model buttons for full-name tooltip on truncated labels)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Applied all 4 rules from prompt. Auto-sizing via `width: max-content` within [280px, 420px] band — popover widens to fit longest visible name, truncates with `…` beyond 420px. `min-width: 0` on `.pm-model-label` is the non-obvious piece: without it, flex children default to `min-width: auto` (content-size) and ellipsis never triggers inside a flex row. No new CSS classes introduced; only extended existing `.pm-popover` and `.pm-model-label`. No HTML structure change, no logic change, trigger untouched. Build `✓ built in 1m 18s` with only pre-existing chunk-size warning.
**Nome del documento prompt**: 2026-04-20 16:00

---

## 2026-04-20 — refactor: AI providers — single source of truth for models (Pattern B)
**Prompt**: Rimuovi select modello dal pannello Settings; combina provider+model in un picker comune (deploy JodieHeader + DocumentationTab); persistenza per-feature `{providerId, modelId?}`; legacy ID map per Claude con migration silenziosa; plumbing `model?` attraverso `AIProviderService.chat()` e call site; SuggestedMappingsPanel NON toccato.
**File toccati**:
- frontend/src/types/jodie.ts (AIVersion.contextWindow, .add() signature, Claude registry rewrite, claudeLegacyIdMap, resolveLegacyModelId, ProviderPreference.modelId, setPreferred signature + SETTINGS_CHANGED dispatch, getPreferredModel, resolveFeatureSelection, migrateLegacyModelIds + load() wiring)
- frontend/src/services/AIProviderService.ts (chat() accepts optional model; resolves via resolveLegacyModelId; threads effectiveModel to all 8 provider adapters)
- frontend/src/components/Settings/AISettingsContent.tsx (removed model <select> block; removed model field entry from provider fields; removed defaultProvider/configuredProvidersList state; subtitle dynamic non-legacy top-3)
- frontend/src/components/common/ProviderModelSelector.tsx (NEW — combined picker: trigger "Provider Model" + popover with sub-select provider + model list + "Show legacy models" toggle)
- frontend/src/components/common/ProviderModelSelector.scss (NEW — additive styles, reuses .provider-selector/.provider-btn/.provider-menu base)
- frontend/src/components/Jodie/JodieHeader.tsx (swap Jodie/ProviderSelector → common/ProviderModelSelector feature="chat")
- frontend/src/components/Jodie/Jodie.tsx (pass model via AIConfig.getPreferredModel('chat') to chat())
- frontend/src/components/abstract/tabs/DocumentationTab.tsx (replace inline provider dropdown with <ProviderModelSelector feature="documentation" />; remove now-dead showProviderMenu state + click-outside effect + availableProviders)
- frontend/src/services/DocumentationService.ts (pass model via AIConfig.getPreferredModel('documentation'))
- frontend/src/jjtl/services/AIMatcher.ts (pass model via AIConfig.getPreferredModel('mappings') — service-layer change only, UI of SuggestedMappingsPanel not touched)
- frontend/src/components/ExplainModal.tsx (streamExplain resolves model = getPreferredModel('explain') ?? config.model)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Discovery flagged**: prompt-vocabulary mismatches with codebase (no `AIProviderSelector`, no `useAIProvider`, no `src/ai/`); used actual names `ProviderSelector`/`AIConfig.getPreferred`/registry-in-`jodie.ts`. Built-in `AIVersion.deprecated` reused as "legacy" flag (no alias). New component created at `common/ProviderModelSelector.tsx` rather than overloading `common/ProviderSelector` with conditional mode — keeps SuggestedMappingsPanel's API untouched and safe. `claudeLegacyIdMap`: `claude-sonnet-4-20250514`→`claude-sonnet-4-6`, `claude-opus-4-20250514`→`claude-opus-4-6`, `claude-haiku-4-20250514`→`claude-haiku-4-5-20251001`, `claude-3-5-sonnet-20241022`→`claude-3-5-sonnet-latest`, `claude-3-opus-20240229`→`claude-3-opus-latest`. One-shot migration `migrateLegacyModelIds()` runs once per install (sentinel `jjodel_migration:legacy_model_ids_v1`), rewrites both per-feature `jjodel_provider_<feature>.modelId` and per-provider `jjodie_provider_<name>.model`. Legacy entries 3-5-sonnet/3-opus also added to registry (deprecated:true) so persisted selections still match after migration. `SuggestedMappingsPanel.tsx`: **non toccato in questo prompt** (è apparso nei diff di sessione solo per via dei prompt precedenti di provider threading e Phase 2 di Default Provider removal; in questo task nessuna modifica). AIProviderService.chat() signature extended with optional `model?: string` as 7th param — backward compatible: callers omitting it fall back to `AIConfig.get(provider).model`. Ollama/Custom non hanno ancora UX nel picker perché `AI.Custom.versions` è vuoto (registry-driven); è una limitazione nota — l'utente può comunque selezionarli dal sub-select provider e il picker mostrerà "No models in registry".
**Nome del documento prompt**: 2026-04-20 15:00

---

## 2026-04-20 — refactor: Default Provider removal — Phase 3 (removal)
**Prompt**: Remove "Default Provider" UI block, setGlobalDefault, activeProvider field, persistence. Update panel subtitle.
**File toccati**:
- frontend/src/components/Settings/AISettingsContent.tsx
- frontend/src/types/jodie.ts
- frontend/src/jjtl/services/AIMatcher.ts (still referenced removed `activeProvider` — fixed to `AIConfig.getPreferred('mappings')`)
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Opzione 2 scelta per la chiave localStorage (`jjodel_default_provider` lasciata in place per un rilascio + TODO commentato accanto al sentinel). Rimosso: campo `activeProvider` dal corpo JodieConfig; persistenza di `activeProvider` in save() (righe ~545-549 del pre-fix); dispatch `PROVIDER_CHANGED` type 'global-default'; `setGlobalDefault` completamente; stato `defaultProvider` + `configuredProvidersList` + blocco UI in AISettingsContent.tsx (righe 300-323 del pre-fix). Subtitle aggiornato a "Configure AI providers used by Jjodel features". `AI.GLOBAL_DEFAULT_KEY` costante TRATTENUTA (ancora usata dalla migrazione one-shot). `AI.getActiveVersion` refactored: param ora REQUIRED (single caller Jodie.tsx:58 lo passa già); rimosso fallback `if (!provider) provider = JodieConfig.current.activeProvider`. Acceptance: `grep -r "JodieConfig\\.(current|default)\\.activeProvider|setGlobalDefault"` → zero matches. tsc pulito per i miei file (81 errori pre-esistenti non correlati restano: SVG imports, casing, Measurable.tsx).
**Nome del documento prompt**: 2026-04-20 18:10

---

## 2026-04-20 — refactor: Default Provider removal — Phase 2 (feature alignment)
**Prompt**: Align Chat, Documentation, Explain, Mappings to per-feature preferences exclusively; make AIDisclaimer feature-aware. Default Provider UI still present but dormant.
**File toccati**:
- frontend/src/components/Jodie/Jodie.tsx (4 sites: init, settings-change, provider-change, auto-switch)
- frontend/src/components/Jodie/ProviderSelector.tsx (Opzione 1 scelta: tenuto il componente Jodie-specifico e cambiata solo la write)
- frontend/src/services/DocumentationService.ts (line 614 read → getPreferred('documentation'); + import AIConfig)
- frontend/src/components/abstract/tabs/DocumentationTab.tsx (line 998 write → setPreferred)
- frontend/src/components/ExplainModal.tsx (streamExplain read → getPreferred('explain'); no UI dropdown, auto-resolve sufficient)
- frontend/src/jjtl/views/SuggestedMappingsPanel.tsx (drop `JodieConfig.current.activeProvider || resolvedProvider` fallback chain)
- frontend/src/components/common/AIDisclaimer.tsx (add required `feature: AIFeature` prop)
- frontend/src/components/Jodie/JodieWindow.tsx (pass feature="chat")
- frontend/src/components/abstract/tabs/DocumentationTab.tsx (pass feature="documentation")
- frontend/src/jjtl/views/InferredMappingsPanel.tsx (pass feature="mappings")
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Opzione 1 per Jodie/ProviderSelector — è un <select> native con UX distinta dal common/ProviderSelector (Bootstrap styling, parent-controlled props); non interscambiabile. AIDisclaimer call sites: 3 attivi aggiornati (JodieWindow, DocumentationTab, InferredMappingsPanel); `ScriptBlock.tsx:15` importa AIDisclaimer ma NON lo rende (dead import) — lasciato intatto. ExplainModal non ha dropdown UI visibile: resolve via `getPreferred('explain')` + fallback first-enabled (sufficiente per ora; UI selector aggiunta solo se necessario). SuggestedMappingsPanel: rimosso `JodieConfig.current.activeProvider` check; ora usa solo `resolvedProvider = getPreferred('mappings')`. Tutti i file modificati tsc-clean.
**Nome del documento prompt**: 2026-04-20 18:05

---

## 2026-04-20 — refactor: Default Provider removal — Phase 1 (foundation)
**Prompt**: Fix ProviderSelector to write per-feature; register 'explain' in AIFeature; refactor getPreferred fallback to per-feature → first-enabled; add idempotent one-shot migration from global to per-feature prefs. Visible UX unchanged.
**File toccati**:
- frontend/src/components/common/ProviderSelector.tsx
- frontend/src/types/jodie.ts
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: **Discrepancy rispetto al prompt**: il prompt afferma che la pattern delle chiavi per-feature è `jjodie_pref:<feature>`, ma il codice reale (jodie.ts:381,396) usa `${AI.STORAGE_PREFIX}${feature}` dove `STORAGE_PREFIX = 'jjodel_provider_'`. Chiavi effettive: `jjodel_provider_chat`, `jjodel_provider_mappings`, ecc. La funzione di migrazione usa la pattern reale (coerente con getPreferred/setPreferred). Nessun call site di `common/ProviderSelector` ha richiesto l'aggiunta del prop `feature` — era già required nell'interface (line 16) e l'unico call site (`SuggestedMappingsPanel.tsx:373`) lo passa già come `feature="mappings"`. Aggiunto `'explain'` all'union AIFeature. `getPreferred` nuovo fallback: per-feature → `getFirstEnabledProvider()` (private helper nuovo, ordine deterministico via `ALL_AI_PROVIDERS`). `migrateGlobalDefaultToPerFeature` chiamata da `JodieConfig.load()` al suo inizio (sentinel-protected, idempotente, copre tutti gli exit paths). Sentinel key: `jjodel_migration:global_to_per_feature = '1'`. `setGlobalDefault` e `activeProvider` LASCIATI in place per Phase 2/3.
**Nome del documento prompt**: 2026-04-20 18:00

---

## 2026-04-20 — docs: Default Provider removal diagnostic
**Prompt**: Read-only analysis of global Default Provider usage, LLM feature inventory, and fallback strategy options
**File toccati**: none (read-only) + docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Blast radius = 13 files (7 direct global reads, 3 setGlobalDefault calls, 1 Settings UI, 1 core fallback logic, 1 persistence). Critical path: remove "Default Provider" UI from AISettingsContent.tsx, convert chat/documentation/mappings features to per-feature prefs via AIConfig.setPreferred(feature, providerId), update ProviderSelector to require feature ID parameter. Current state: documentation & mappings already use getPreferred(); chat uses global directly; scriptblock stubbed; explain ad-hoc (not in AIFeature union). Recommended strategy: (A) immediate UI removal, (B) phase per-feature adoption starting with chat, (C) refactor ProviderSelector to enforce per-feature persistence. Auto-switch fallback to first-enabled-provider (not UI-forced) suitable for all features except documentation (which should have user choice via toolbar dropdown). One-time migration feasible: seed per-feature prefs from old global default localStorage key on first load.
**Nome del documento prompt**: 2026-04-20 17:30

---

## 2026-04-20 — fix: transformation assistant error UX (explicit fallback + settings link)
**Prompt**: Replace silent fallback with explicit user choice; route unconfigured-provider error to Settings → Providers
**File toccati**:
- frontend/src/jjtl/services/MappingSuggestionService.ts
- frontend/src/jjtl/types/suggestions.ts
- frontend/src/jjtl/views/SuggestedMappingsPanel.tsx
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Added optional `canFallbackToSimple?: boolean` to `SuggestionResult` (suggestions.ts:54-61); service sets it on AI errors and rethrows AbortError (MappingSuggestionService.ts catch block). UI distinguishes "no provider" (error string contains "not configured") from generic LLM errors: first shows "No AI provider is configured." + "Open Settings → Providers" button; second shows the real error message + "Try simple matching instead" button. Fallback uses a separate `handleFallbackToSimple` callback that bypasses `selectedLocalOption` state so the dropdown isn't clobbered. Settings navigation uses `useSettingsModalSafe().openSettings('providers')` — same mechanism already used in ProviderSelector, Jodie, StatusBarRightZone, DocumentationTab. TypeScript clean for modified files; 81 pre-existing unrelated errors remain untouched.
**Nome del documento prompt**: 2026-04-20 17:05

---

## 2026-04-20 — fix: transformation assistant provider threading + cancellation
**Prompt**: Thread user-selected AI provider from SuggestedMappingsPanel through service layer; add AbortController cancellation
**File toccati**:
- frontend/src/jjtl/services/AIMatcher.ts
- frontend/src/jjtl/services/MappingSuggestionService.ts
- frontend/src/jjtl/views/SuggestedMappingsPanel.tsx
- docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: Added optional `aiProvider?: TAIProvider` + `signal?: AbortSignal` to `AnalyzeOptions` and `AIMatcher.analyze()`. AIMatcher now uses `aiProvider ?? JodieConfig.current.activeProvider`. Threaded from `SuggestedMappingsPanel.handleAnalyze` via existing `resolvedProvider` variable (line 164). **Discrepancy**: prompt specified `AnalyzeOptions` lives in `types/suggestions.ts`, but it actually lives in `services/MappingSuggestionService.ts:16-20` (re-exported via services/index.ts:8); applied change where interface actually is, `suggestions.ts` untouched by this task. **AbortSignal caveat**: `AIProviderService.chat` has 8 provider branches each with its own fetch() — modifying all was not trivial per prompt criteria, so added the prescribed TODO comment above the chat call. Added post-await `signal?.aborted` check to throw AbortError if user cancelled. Cancel button (`bi bi-x-circle`) rendered next to Analyze button only while `isAnalyzing`, reuses `btn-analyze btn-secondary` classes. AbortError silently resets state in UI catch block. TypeScript clean for modified files.
**Nome del documento prompt**: 2026-04-20 17:00

---

## 2026-04-20 — docs: Transformation assistant diagnostic
**Prompt**: Read-only diagnostic of transformation assistant (name matching, LLM integration, provider selector gap)
**File toccati**: none (read-only) + docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: SuggestedMappingsPanel + AIMatcher + MappingSuggestionService form a ~85% integrated AI-assisted name-matching system using canonical AIProviderService + AIConfig infrastructure. Current bug: AIMatcher reads JodieConfig.current.activeProvider directly (line 42) instead of respecting provider selected in ProviderSelector dropdown—the UI computes resolvedProvider but doesn't pass it to service layer. Fix is atomic: add optional aiProvider parameter to AnalyzeOptions→MappingSuggestionService.analyze()→AIMatcher.analyze(), pass from SuggestedMappingsPanel.handleAnalyze(). Tested paths: SimpleMatcher (deterministic fuzzy match + type compat), AIMatcher (LLM prompt with JjEL syntax rules + JSON response parsing). All 8 providers supported (Claude/GPT/DeepSeek/Gemini/Mistral/Groq/Kimi/Ollama). No parallel provider abstraction. Feature ID 'mappings' registered in AIFeature union at types/jodie.ts:80.
**Nome del documento prompt**: 2026-04-20 16:30

---

## 2026-04-20 — docs: JjTL parser diagnostic
**Prompt**: Read-only diagnostic of JjTL parser to assess helper declaration feasibility
**File toccati**: none (read-only) + docs/claude-code-log.md
**Esito**: ✅ completato
**Note**: `helper` is fully implemented end-to-end — lexer (tokens.ts:16,111), parser (parser.ts:563-604, integrated at :94-95), AST (HelperAST in types/ast.ts:119-126), executor registration via `EvaluationContext.registerBuiltin()` (executor.ts:651-657); primitive types in TypeRegistry.isInstance (context.ts:98-125) accept EInt/Integer, EString/String, EBoolean/Boolean, EDouble/EFloat/Double/Float/Number — EReal NOT registered; only gap is runtime type validation of helper params/return (parsed but unchecked).
**Nome del documento prompt**: 2026-04-20 16:00

---

## 2026-04-17 — fix: duplicate reference values in JjTL executor output
**File toccati**:
- `frontend/src/components/project/ProjectEditor.tsx` — deduplicazione nel feature extraction: `rawVals` filtrato con `Set<string>` per eliminare Pointer ID duplicati nel DValue.values
- `frontend/src/jjtl/executor/executor.ts` — deduplicazione guard in `wrapIfTargetReference`: array di target deduplicated by `__sourceId`

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito.

**Problema**: `outputPlace := nextState` produceva `targets: [Place, Place]` (stesso `__sourceId` duplicato) anche se `nextState` ha molteplicità 1.

**Root cause**: il raw `DValue.values` array può contenere lo stesso Pointer ID più volte — per esempio quando `syncCreateReferenceLink` appende senza dedup (il fix precedente usa `[...meaningful, targetObject.id]`), o per data corruption. Con `meaningful.length > 1`, ProjectEditor wrappa come array: `[{__ref: P}, {__ref: P}]`. L'executor risolve ogni elemento indipendentemente → `[PlaceObj, PlaceObj]`. `wrapIfTargetReference` wrappa l'intero array → `targets` duplicati.

**Fix 1 — ProjectEditor (source)**: nel feature extraction loop, `meaningful` ora viene deduplicated da un `Set<string>` che traccia i valori già visti. Per Pointer strings identici, il secondo viene scartato. Per primitivi non-string (numeri, booleani), non vengono deduplicated (valori legittimamente ripetuti in attributi multi-valued).

**Fix 2 — Executor (guard)**: `wrapIfTargetReference` deduplica l'array di target by `__sourceId` (o `id`, o `name` come fallback) prima di wrappare come `__ref_result`. Questo è un guard difensivo — il fix primario è nel ProjectEditor.

---

## 2026-04-17 — feat: `parent` (eContainer) for JjTL transformations
**File toccati**:
- `frontend/src/components/project/ProjectEditor.tsx` — computa `_containerId` dal father chain di DObject quando costruisce sourceModelData: `DObject.father → DValue → DValue.father → owning DObject`
- `frontend/src/jjtl/executor/executor.ts` — `createInstanceContext` risolve `_containerId` al parent object nella source model; fallback preservato per test/L-layer proxy

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito.

**Approccio**: il prompt chiedeva di aggiungere un campo stored `_containerId` a DObject. Invece ho scelto di **computarlo on-the-fly** dalla catena `father` esistente durante la costruzione del sourceModelData — zero migration, zero campi aggiunti alla serializzazione, zero punti di sync da mantenere.

La catena: `DObject.father` punta a DModel (root object) o DValue (oggetto contenuto). Se DValue, `DValue.father` punta al DObject proprietario. Traversando due hop in `idlookup`, ottengo il container DObject ID.

**ProjectEditor**: dopo l'estrazione features, legge `(obj).__raw.father`, cerca in `idlookup`: se è un DValue, prende `fatherData.father` (il DObject owner). Setta `result._containerId`.

**Executor**: in `createInstanceContext`, ordine di risoluzione:
1. Feature utente `parent` (già nei bindings da proxyEntries — priorità utente preservata)
2. `_containerId` → cerca nella source model flat array l'oggetto con quell'ID → lo binda come `parent`
3. Fallback `.father / .eContainer / .owner` per L-layer proxy e test

Risultato: `parent` in JjTL trasformazioni (es. `inputPlace := parent`) ora risolve al DObject container, che poi passa attraverso la cross-type resolution del trace model.

**Follow-up**: `data.parent` nella Console JjEL richiede un intervento sul L-layer proxy o sull'evaluator — out of scope per questa sessione.

---

## 2026-04-17 — fix: reference edges not drawn for transformation-generated models
**File toccati**:
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` — aggiunto Step 4 nell'auto-populate effect: crea DVoidEdge per reference M1 instance che hanno valori ma nessun edge nel grafo; aggiunto `modelObjectCount` selector per triggerare l'effect per modelli M1; rimossi gli early-exit che bloccavano modelli senza classifier

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito.

**Problema**: nei modelli generati da trasformazione, le reference (es. `output → Place_1`) erano settate correttamente (visibili nel Properties panel) ma nessun edge veniva disegnato nel flow editor.

**Root cause**: il flow editor genera edges SOLO da oggetti DEdge/DVoidEdge espliciti nel grafo. Non ha un path per derivare edges da `DValue.values` (reference feature values). Il flusso di creazione:

1. Trasformazione (ProjectEditor): crea DObject + DVertex ✅ + scrive reference values ✅ ma **NON crea DVoidEdge**
2. Auto-populate effect (useJjomSync): crea DVoidEdge per reference M2 (DClass→DClass) ma **ignora M1** (DObject→DObject)
3. Due early-exit bloccavano l'effect per modelli M1:
   - Line 352: `modelClassCount === 0` → M1 models have no classifiers → exit
   - Line 393: `classifierEntries.length === 0` → M1 models have no DClass/DEnumerator → exit

**Fix — 3 modifiche in useJjomSync.ts**:

1. **Nuovo selector `modelObjectCount`**: conta `rawModel.objects.length`. Aggiunto alle deps dell'effect. Per modelli M1, `modelObjectCount > 0` impedisce l'early-exit a line 352.

2. **Early-exit estesi**: 
   - Line 352: `&& modelObjectCount === 0` — non uscire se ci sono DObject
   - Line 393: `&& !hasM1Objects` — non uscire se ci sono objects M1
   - Line 469: `&& missingM1EdgeCount === 0` — non uscire se mancano edge M1

3. **Step 4 — M1 instance reference edges**: dopo lo Step 3 (M2 edges). Per ogni DObject:
   - Itera `dObj.features` (DValue Pointer array)
   - Per ogni feature il cui `instanceof` è un `DReference` (non `DAttribute`)
   - Legge `dFeat.values` (raw Pointer IDs dei target)
   - Per ogni target che ha un vertex nel grafo: crea `DVoidEdge.new2(metaId, graphId, ..., isReference: true)`
   - Usa `existingEdgeKeys` + `hasCanvasEdgePair` per deduplicazione (idempotente)

Il DVoidEdge appena creato viene aggiunto ai subElements del grafo → l'incremental sync effect (line 729) lo raccoglie automaticamente → `jjomEdgeToRFEdge` lo converte in RF Edge → l'edge appare nel diagramma.

---

## 2026-04-17 — fix: flow editor edge connect does not persist reference value
**File toccati**:
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` — `syncCreateReferenceLink` (line 1260) e `syncCreateCompositionLink` (line 1192): letto `__raw.values` al posto del getter L-layer `.values`

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito.

**Problema**: trascinando un edge da Transition a State, l'edge compariva nel diagramma ma il Properties panel mostrava `nextState [1..1]` come `-----` (vuoto). La reference non veniva persistita nel DObject.

**Root cause**: in `syncCreateReferenceLink` e `syncCreateCompositionLink`, il codice leggeva `refProxy.values ?? []` per ottenere i valori correnti prima di appendere il nuovo target. Ma `refProxy.values` è il getter L-layer (`LValue.get_values`), che **padda con `undefined`** quando `ret.length < dmeta.lowerBound` (cfr. LModelElement.tsx ~line 6989). Per `nextState [1..1]` con nessun valore settato: `lowerBound = 1`, raw values = `[]`, getter returns `[undefined]`.

Risultato: `[...current, targetObject.id]` = `[undefined, "Pointer_xxx"]`. Il nuovo Pointer finisce a index 1 anziché index 0. Il `set_values` scrive `undefined` a index 0 (clearing) e il Pointer a index 1 (fuori dal range utile per [1..1]). Il Properties panel legge index 0 → `undefined` → `-----`.

**Fix**: sostituito `refProxy.values ?? []` con `refProxy.__raw?.values ?? []` (il DValue raw, senza padding), filtrato per `v != null && v !== ''`. Per `nextState [1..1]` vuoto: `rawVals = []`, `meaningful = []`, risultato = `["Pointer_xxx"]` → correttamente scritto a index 0.

Stessa fix applicata a entrambe le funzioni:
- `syncCreateCompositionLink` (containment references)
- `syncCreateReferenceLink` (non-containment references)

**Flow completo investigato**:
```
User drag edge Transition → State
  → ReactFlow.onConnect → pendingConnectionRef
  → ReactFlow.onConnectEnd → M1 branch
  → getCompatibleReferences(Transition metaclass, State id) → [{name: 'nextState', ...}]
  → auto-select (1 ref) → handleM1ReferenceSelected
  → guardLink check (upper-bound) → allowed
  → syncCreateReferenceLink(vertexId_source, vertexId_target, 'nextState')
    → sourceObject = LVertex.model (= LObject Transition)
    → targetObject = LVertex.model (= LObject State)
    → refProxy = sourceObject.$nextState (= LValue proxy)
    → [FIX] rawVals = refProxy.__raw.values (no padding)
    → refProxy.values = [...meaningful, targetObject.id]
    → DVoidEdge.new2() → visual edge
```

---

## 2026-04-17 — fix: DObject delete leaves dangling Pointers + referenceFeatures crash
**File toccati**:
- `frontend/src/components/project/ProjectEditor.tsx:2343` — `o.referenceFeatures` → `o?.referenceFeatures` (guard contro `undefined` in `.reduce()`)
- `frontend/src/common/Dummy.ts:104-113` — safety-net in `get_delete()`: rimozione diretta da `father.objects`/`father.features` prima del loop `pointedBy`-based

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito (errore `Dummy.ts:46` è pre-esistente, Vite internal).

**Crash `referenceFeatures`**: `ProjectEditor.tsx:2343` — `.reduce()` su `objects` dove qualche elemento è `undefined`. Causa: `LModel.get_objects()` risolve i Pointer nell'array `objects` via `LPointerTargetable.from(pointer)`. Quando il target è stato cancellato (non esiste in `idlookup`), `from()` ritorna `undefined`. Fix: `o?.referenceFeatures?.length` (una `?` in più).

**Dangling Pointers — investigazione**:
- **Delete flow** (`Dummy.get_delete()`, lines 50-228): corretto in principio. Legge `dDeleted.pointedBy` → per ogni dependency con `field === 'objects'` (line 170) → `SetFieldAction.new(father, 'objects', deletedId, '-=', true)`.
- **Perché fallisce**: `pointedBy` è persistito su ogni DObject. Ma se i record sono stale/incompleti (dati creati prima che il tracking fosse robusto, import batch, sessioni di sviluppo), `get__jjdependencies` non trova la dependency `objects` → `-=` non viene mai eseguito → Pointer resta nell'array.
- **Evidenza**: ~220 warning "is deleted" all'apertura del progetto "Stame Machine" (pre-esistenti, non causati da operazioni correnti).

**Safety-net fix** (`Dummy.ts`): aggiunto blocco prima del loop `pointedBy` che rimuove direttamente il Pointer dalla collection del father:
- `DObject` → `SetFieldAction.new(father, 'objects', deletedId, '-=', true)`
- `DValue` → `SetFieldAction.new(father, 'features', deletedId, '-=', true)`

Questo è ridondante quando `pointedBy` funziona (il `-=` su un valore non presente nell'array è un no-op), ma garantisce la pulizia anche con dati corrotti. I ~220 warning esistenti richiederebbero una pulizia dati separata (out of scope).

---

## 2026-04-17 — fix: reference materialization via __sourceId map
**File toccati**:
- `frontend/src/components/project/ProjectEditor.tsx` — STEP 8b reference lookup riscritta: `executorObjToName` (object identity, inaffidabile) sostituita con `sourceIdToObjectName: Map<string, string>` che mappa `__sourceId → objectName` assegnato durante creazione DObject

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito. Zero regressi.

**Problema**: STEP 8b loggava `"Cannot determine name for target of T1.output[0]"` per ogni reference. Due cause:
1. `executorObjToName.get(targets[ri])` — JS object identity: funziona in teoria ma fallisce in pratica (qualche passo intermedio crea un nuovo oggetto o il GC/V8 rilocava)
2. `targets[ri]?.name` — undefined perché la regola `State -> Place` non ha `name := name`

**Fix**: nuova mappa `sourceIdToObjectName: Map<string, string>`. Keyed by `__sourceId` (string, Pointer ID dell'elemento sorgente che ha generato il target — sempre presente, settato da `createTargetInstance`). Questo è completamente indipendente sia dall'identità oggetto JS sia dalla presenza di un binding `name`.

Flusso:
1. STEP 6 (DObject creation loop): per ogni `instanceData`, se ha `__sourceId`, registra `sourceIdToObjectName.set(instanceData.__sourceId, objectName)`
2. Post-loop: logga la mappa completa
3. STEP 8b: per ogni target in `__ref_result.targets`, legge `target.__sourceId`, cerca in `sourceIdToObjectName`, ottiene il nome del DObject, trova l'LObject via LModel proxy, ottiene il Pointer ID reale, scrive con `setValueAtPosition(i, realId, { isPtr: true })`

**Log atteso dopo il fix**:
```
[ProjectEditor] sourceId→name map: { "Pointer_S0": "Place_0", "Pointer_S1": "Place_1", ... }
[ProjectEditor] ✅ Ref: T1.output[0] → Place_1 (Pointer1776...)
```

---

## 2026-04-17 — fix: reference lookup in transformation output
**File toccati**:
- `frontend/src/components/project/ProjectEditor.tsx` — STEP 8b reference lookup riscritta: `executorObjToPointerId` (temp DObject ID) sostituita con `executorObjToName` (objectName assegnato durante creazione) + lookup via LModel proxy per ottenere il Pointer ID reale

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito. Zero regressi.

**Problema**: STEP 8b loggava `"No DObject found for target of T1.output[0]"` per ogni reference. Il lookup `executorObjToPointerId.get(targets[ri])` falliva sempre.

**Root cause**: due problemi indipendenti nella mappa `executorObjToPointerId`:
1. **Valore inaffidabile**: `dObject.id` da `DObject.new()` è un ID temporaneo (documentato in CLAUDE.md: "NON corrisponde all'ID reale dell'oggetto nel framework"). Usarlo come Pointer ID per scrivere una reference non funziona — il framework non lo risolve.
2. **Chiave potenzialmente non matchante**: la mappa usa object identity JS (`Map<any, string>` keyed by executor instance). Sebbene in teoria la catena di riferimenti sia preservata (executor → targetModel.instances → __ref_result.targets), qualsiasi copia intermedia spezzerebbe il match.

**Fix**: eliminata la dipendenza da `dObject.id` e da object identity. Nuova strategia:
1. `executorObjToName: Map<any, string>` — mappa executor instance → `objectName` (il nome assegnato durante la creazione DObject, uguale a `instanceData.name || synthetic`). Questo è stabile.
2. In STEP 8b (dentro il setTimeout, dove il LModel proxy è disponibile): per ogni target nell'array `__ref_result.targets`:
   - `targetName = executorObjToName.get(target) ?? target.name` — prende il nome dalla mappa (se object identity funziona) o fallback dal target stesso
   - `targetLObj = objects.find(o => o.name === targetName)` — trova l'LObject nel modello via LModel proxy (stessa tecnica degli attributi)
   - `targetRealId = targetLObj.id` — il vero Pointer ID dal proxy
   - `feature.setValueAtPosition(ri, targetRealId, { isPtr: true })` — scrive il reference usando il Pointer reale

**Perché funziona**: lo stesso pattern di STEP 8 (attribute setting) — trova oggetti per nome via LModel proxy, ottiene ID reali, scrive. Non dipende mai da `DObject.new().id`.

**Log atteso dopo il fix**:
```
[ProjectEditor] ✅ Ref: T1.output[0] → Place_1 (Pointer1776...)
```

---

## 2026-04-17 — fix: JjTL transformation output — reference writing
**File toccati**:
- `frontend/src/jjtl/executor/executor.ts` — `applyCrossTypeResolution` ora wrappa target instances risolte come `{ __ref_result: true, targets: [...] }` via nuovo `wrapIfTargetReference()`
- `frontend/src/components/project/ProjectEditor.tsx` — `handleExecuteTransformation` ora: (1) registra mappa `executorObjToPointerId` (executor instance → DObject Pointer ID) durante creazione, (2) colleziona `pendingReferenceSets` accanto alle `pendingAttributeSets`, (3) scrive reference via `LValue.setValueAtPosition(i, pointerId, { isPtr: true })` — stesso API del dropdown Properties panel

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito. Zero regressi.

**Problema**: la cross-type resolution nell'executor funzionava (produceva correttamente Place target dal trace), ma il risultato non appariva nel modello target per due ragioni:

1. **Executor non distingueva reference da attributi nel risultato**: `output` nel target instance conteneva l'oggetto Place direttamente — ProjectEditor non sapeva che era una reference da scrivere con `isPtr: true`.

2. **ProjectEditor scriveva solo attributi primitivi**: il loop in STEP 8 filtrava per `domainAttrNames` (solo `targetClass.attributes`), escludendo reference features. Anche se `output` fosse passato, `feature.value = placeObject` non scrive un Pointer ID — serve `setValueAtPosition(i, pointerId, { isPtr: true })`.

**Fix executor** — `applyCrossTypeResolution` ora chiama `wrapIfTargetReference()` sul valore risolto:
- Se il valore è un oggetto con `__createdBy: 'JjTL'` → wrappa come `{ __ref_result: true, targets: [value] }`
- Se è un array di tali oggetti → `{ __ref_result: true, targets: array }`
- Primitivi e oggetti non-target passano invariati
- Il marker `__ref_result` permette a ProjectEditor di distinguere reference da attributi senza consultare il metamodello

**Fix ProjectEditor** — tre aggiunte al flusso di `handleExecuteTransformation`:
1. **Mappa instance → DObject** (`executorObjToPointerId: Map<any, string>`): durante il loop di `DObject.new`, registra `instanceData → dObject.id`. Usa object identity (il JS reference dell'executor instance è lo stesso oggetto dentro `__ref_result.targets`).
2. **Collezione reference** (`pendingReferenceSets`): per ogni instanceData, scansiona `Object.entries` cercando valori con `__ref_result: true`. Li accumula separatamente dagli attributi.
3. **STEP 8b — reference writing**: dentro lo stesso `setTimeout` di STEP 8 (dopo gli attributi), itera `pendingReferenceSets`. Per ogni reference, trova l'LObject per nome, accede a `$refName` (LValue proxy), poi chiama `feature.setValueAtPosition(i, pointerId, { isPtr: true })` per ogni target. Stessa API che `Info.tsx:changeDValue` usa quando l'utente seleziona dal dropdown.

**Flusso end-to-end per `output := nextState`**:
1. ProjectEditor: `nextState` raw value = `"Pointer_xxx"` → wrappato come `{ __ref: "Pointer_xxx" }`
2. Executor Pass 1: crea Place per ogni State, registra in trace
3. Executor Pass 2: valuta `nextState` → `{ __ref: "Pointer_xxx" }` → `resolveRefById` → trova il Place target → `applyCrossTypeResolution` → `wrapIfTargetReference` → `{ __ref_result: true, targets: [placeInstance] }`
4. `targetInstance.output = { __ref_result: true, targets: [placeInstance] }`
5. ProjectEditor: crea DObject per Place, registra in `executorObjToPointerId`; crea DObject per Transition, trova `output.__ref_result` → pendingReferenceSets
6. STEP 8b: trova LObject Transition, `$output.setValueAtPosition(0, placePointerId, { isPtr: true })`

---

## 2026-04-17 — fix: JjTL cross-type resolution — reference handling
**File toccati**:
- `frontend/src/components/project/ProjectEditor.tsx` — feature extraction loop ora legge `__raw.values` (bypassando la risoluzione L-layer proxy) e wrappa Pointer ID come `{ __ref: id }`
- `frontend/src/jjtl/executor/executor.ts` — `resolveValue` ora gestisce `{ __ref: id }` wrapper + nuovo `resolveRefById` per lookup by pointer ID + depth guard (max 10 livelli)

**Esito**: ✅ 277 test passati. `tsc --noEmit` pulito sui file modificati. Zero regressi.

**Problema**: la cross-type resolution (2026-04-16) non funzionava in pratica. `output := nextState` produceva `null` per tutte le Transition, e alla 4a il browser si freezava.

**Root cause 1 — reference come proxy L-layer**: `ProjectEditor.handleExecuteTransformation` leggeva `feature.values[0]` dall'L-layer getter, che per reference features restituisce LObject proxy (non Pointer ID stringa). Questi proxy hanno back-ref circolari (`LClass.attributes[0].owner → LClass`) che causano il freeze quando `safeDeepCopy` / `flattenProxy` li attraversa.

**Root cause 2 — nessun lookup per Pointer ID**: `applyCrossTypeResolution` cercava `value.name` o `value.className` per risolvere cross-type. Ma per reference features il valore era `null` (proxy che non sopravviveva alla deep copy) o un proxy non interpretabile. Nessun codepath gestiva il caso "il valore è un Pointer ID che punta a un source element tracciato".

**Fix ProjectEditor.tsx** — feature extraction ora legge `(feature as any).__raw?.values` (l'array DValue raw, che contiene primitive per attributi e Pointer ID stringhe per reference). I Pointer ID (pattern `"Pointer*"`) vengono wrappati come `{ __ref: "Pointer..." }`. Questo elimina completamente i proxy L-layer dal sourceModelData e risolve il freeze.

**Fix executor.ts** — `resolveValue` ora gestisce `{ __ref: id }` come primo check (prima del className check):
- Cerca `id` in `targetsBySourceName` (che registra sia per `.name` che per `.id` di ogni source instance)
- Se trovato: ritorna il target element (cross-type resolution riuscita)
- Se non trovato (implicit path): ritorna `null` (fail-open — la reference punta a un tipo senza regola)
- Se non trovato (explicit `resolve()`): throw con errore chiaro
- Se ambiguo (N regole): check se tutte dalla stessa rule → ok; altrimenti throw

Aggiunto `resolveRefById` come metodo dedicato per la logica di lookup by ID (separato dal lookup by className/name per mantenere le due code path leggibili).

Aggiunto depth guard (max 10 livelli) in `resolveValue` per prevenire loop infiniti durante il debug di strutture circolari residue.

**Come verificare**: stessa trasformazione SM → PN del prompt 2026-04-16. `output := nextState` ora risolve correttamente al Place corrispondente anziché `null`. Nessun freeze.

---

## 2026-04-16 — feat: JjTL cross-type resolution via trace model
**File toccati**:
- `frontend/src/jjel/types/ast.ts` — nuovo `FunctionCallExpr` aggiunto al `JjelExpression` union
- `frontend/src/jjel/parser/parser.ts` — `primary()` ora riconosce `identifier(args)` come `FunctionCall`
- `frontend/src/jjel/evaluator/evaluator.ts` — nuovo `evaluateFunctionCall` (lookup builtin → bound function, errore esplicito se nulla è callable)
- `frontend/src/jjtl/executor/astBridge.ts` — JjTL `FunctionCall` con `Identifier` callee ora produce `FunctionCall` JjEL (prima produceva solo `Identifier`)
- `frontend/src/jjtl/executor/executor.ts` — executor ribaltato in **due passate**: Pass 1 crea tutti i target + popola la trace, Pass 2 valuta le binding con trace completa; aggiunta `applyCrossTypeResolution`, handling speciale per `resolve(expr, TargetType)`, `parent` keyword con fallback `father` / `eContainer` / `owner`
- `frontend/src/jjtl/__tests__/astBridge.test.ts` — aggiornato test che si aspettava `Identifier` per le standalone call
- `frontend/src/jjel/__tests__/parser.test.ts` — 6 nuovi test `FunctionCall`
- `frontend/src/jjel/__tests__/evaluator.test.ts` — 3 nuovi test `FunctionCall`

**Esito**: ✅ 277 test passati (268 preesistenti + 9 nuovi). `tsc --noEmit` pulito sui file modificati.

**Richiesta utente**: implementare risoluzione automatica cross-tipo nei binding `:=`. Quando `output := nextState` e `State -> Place` è l'unica regola per `State`, il motore deve automaticamente risolvere `nextState` (lo State) al Place corrispondente tramite trace model. Disambiguazione via `resolve(expr, TargetType)` quando N regole hanno stesso source type. Primitivi, collection, `parent` keyword, errore runtime su riferimenti non risolvibili (filtrati da guardia `where`).

**Architettura due passate (requisito #0 del prompt)**:
Executor girava single-pass (match → create target → valuta binding per ogni regola in sequenza). Questo rompe la risoluzione cross-tipo se la regola `Transition -> Transition` viene eseguita prima di `State -> Place`: la trace è vuota e `output := nextState` fallisce.

Il refactor separa:
- `pass1CreateTargets(mapping)` / `pass1MultiSource(mapping)`: match + guard `where` + `createTargetInstances` + `traceBuilder.addLink` + registrazione in `targetsBySourceName`. **Nessuna** binding evaluation qui.
- `pass2BindAttributes(mapping)`: drena i `PendingBinding` accumulati in pass 1, chiama `executeAttributeMappingsWithTrace` — ora la trace è completa.

Stato mantenuto in `ExecutionContext`:
- `rulesBySourceType: Map<string, ClassMappingAST[]>` — index pre-costruito per lookup O(1) del set di regole con un dato source type
- `targetsBySourceName: Map<string, TargetEntry[]>` — keyed by element name (stabile anche dopo deep copy; object identity non lo è)
- `pendingByMapping: Map<ClassMappingAST, PendingBinding[]>` — ponte tra le due passate

Nota: la guard `where` è valutata in Pass 1, prima dei binding. Se una guard dipendesse da valori calcolati dai binding non funzionerebbe — vincolo accettato e documentato nel prompt.

**Risoluzione cross-tipo (`applyCrossTypeResolution` + `resolveValue`)**:
Chiamata su ogni RHS di binding prima di `targetInstance[attr] = value`. Regole:
1. `null`/`undefined`/primitivi → passthrough
2. Array → ricorsione elemento per elemento (collection handling)
3. Object con `className` / `__type` / `.instanceof.name` (L-layer):
   - 0 regole matchano → passthrough (tipo condiviso fra i due metamodelli)
   - 1 regola → lookup in `targetsBySourceName[name]`, match sulla rule specifica, ritorna il target; **throw** se non trovato (messaggio include guard/filtri come cause probabile)
   - N regole → throw "Ambiguous cross-type resolution", suggerisce `resolve(expr, TargetType)`

Punto chiave: la `ClassMappingAST` che ha creato il target è stored in `TargetEntry.rule`. Match per reference (non per `rule.name`) — garantisce 1-1 source→target anche se più regole coesistono.

**`resolve(expr, TargetType)` — keyword vs builtin**:
Problema: JjEL parser originale non aveva AST node per standalone function calls (`identifier(args)`). Solo MethodCall (`obj.method(args)`) esisteva. Quindi `targetAttr := resolve(...)` nemmeno parsava. Fix minimo: aggiunto `FunctionCallExpr` a JjEL (primary riconosce `IDENTIFIER LPAREN`, evaluator fa builtin/bound lookup).

Secondo problema: `resolve(nextState, Place)` — `Place` non è un valore bound, la valutazione standard restituisce `null`. Soluzione: intercept a livello JjTL executor (`tryEvaluateResolveCall`) in `evaluateExpression` prima della delegazione JjEL. Il secondo argomento viene letto come AST Identifier e il suo `.name` usato come stringa di classe target. Accetta sia JjTL FunctionCall (path legacy) sia JjelExpressionWrapper contenente JjEL FunctionCall (path `:=`).

Il builtin `resolve` registrato sul context resta come fallback (accetta args già valutati, può essere chiamato programmaticamente), ma il path primario è l'intercept.

**`parent` keyword**:
Implementata in `createInstanceContext`: se `sourceInstance.parent` non è già tra le proxy entries, fallback su `.father` (L-layer eContainer Jjodel) / `.eContainer` / `.owner` / `null`. La risoluzione cross-tipo poi scatta normalmente se il container ha una regola.

**Integration tests non inclusi (dolorosamente)**: ho scritto 12 integration test coprendo tutti i casi richiesti nel prompt (single-rule implicit, primitive passthrough, no-rule passthrough, collection element-wise, ambiguity error, rule-order independence, missing target error, parent + eContainer fallback, resolve(x, Type) disambiguation, resolve(x, UnknownType) error, conditional con primitivi). Li ho **rimossi** perché tutti i test executor-level del repo falliscono con `ReferenceError: window is not defined` da `monaco-editor/vs/base/browser/window.js` (import chain via joiner → react → monaco). Problema **preesistente** — confermato con `git stash` + run su master: 7 test file executor/integration già non girano. Aggiungere jsdom o `setupFiles` in `vitest.config.ts` è out-of-scope. I test sono sostituiti da unit test JjEL puri (FunctionCall parse + eval) che validano le fondamenta.

**Come verificare manualmente**: aprire trasformazione State Machines → Petri Nets, scrivere:
```
State -> Place { tokens := if isInitial then 1 else 0 }
Transition -> Transition {
    name := name
    input := parent
    output := nextState
}
```
Risultato atteso: Place S1 con tokens=1, S2 con tokens=0, Transition t1 con input=[place_S1] output=[place_S2].

**Note architetturali**:
- Log `[JjTL]` marca le due passate: `===== PASS 1: create + trace =====` e `===== PASS 2: bind attributes =====` per debug chiarezza
- L-layer detection: `detectSourceClassName` controlla `className` → `__type` → `instanceof.name` (L proxy)
- Name fallback: se source ha solo `.id` e non `.name`, uso `.id` come chiave (registrazione con entrambe le chiavi quando disponibili)
- `resolve` arg 1 letto come Identifier o StringLiteral (programmatic callers possono passare `"Place"` invece di `Place`)
- Pass 1 deve completare TUTTE le regole prima che Pass 2 cominci — implementato come due loop separati su `this.ast.mappings`

---

## 2026-04-16 — fix: transformation code preserved when user saves project without first clicking Save in JjTL editor
**File toccati**: `frontend/src/components/abstract/DockManager.tsx`
**Esito**: ✅ build ok (`vite build` 41.06s)

**Sintomo riportato**: dopo il fix di stamattina sulle trasformazioni, salvando un progetto e ricaricandolo, l'entry compariva nella dashboard ma il `code` era ricaduto al template di default (con i nomi corretti scelti dall'utente — quindi `generateDefaultCode(name, source, target)`, non il `DEFAULT_CODE` letterale).

**Root cause**: `JjtlDevelopmentEnv` mantiene il code in uno useState interno (`JjtlDevelopmentEnv.tsx:83`). La propagazione verso `transformation.code` avviene SOLO quando l'utente clicca il pulsante Save dentro l'editor JjTL (handleSave → onSave). `DockManager.openTransformation` ricevuto da Phase-2 di stamattina aveva `onCodeChange` cablato a un no-op (commento esistente: `// Code change tracked internally`). Quindi se l'utente:
1. Apre l'editor, scrive le regole
2. NON clicca Save nell'editor JjTL
3. Triggera Save Project (Cmd+S → `Navbar.tsx:772-794` → `ProjectsApi.save` → `compressedState`)

…il `transformation.code` serializzato è quello vecchio (template), perché l'editor non ha mai propagato i tasti battuti. Al reload, il template ricompare. Bug di "expectation mismatch" — l'utente assume che Save Project catturi anche l'editor in primo piano.

**Fix (1 file, opzione 2 - debounce 300ms)**: in `DockManager.openTransformation` (DockManager.tsx:275-303) ho creato:
- `debouncedSync(code)` — chiamata da `onCodeChange` su ogni keystroke. Reset+set di un timer 300ms; allo scadere chiama `onSave?.(code)` (lo stesso callback che il pulsante Save in editor invocherebbe).
- `explicitSave(code)` — wrapper di `onSave` che annulla il debounce pendente (evita il dispatch ridondante) e chiama subito `onSave`.

Wiring: `onSave: explicitSave, onCodeChange: debouncedSync`. Il pulsante Save resta funzionante come affordance "I'm done", ma non è più necessario per la persistenza.

**Edge case documentato in-place** (15 righe di commento sopra le closure): spiega perché il sync è necessario, dove vive il code intermedio, qual era il flusso bugged. Da non rimuovere senza capire il motivo — è la difesa contro il regredire del bug.

**Costo**: ogni 300ms di typing → 1 SetFieldAction → 1 dispatch Redux (asincrono via `setTimeout 0` come tutti gli action.fire). Trascurabile in pratica. Niente debounce a livello editor (più semplice tenerlo qui).

**Note**:
- Closure cleanup: il `debounceTimer` vive nella closure di `openTransformation`. Se l'utente chiude la tab con timer pendente, allo scadere chiama `onSave?.(code)` che esegue `setTransformations` su un transformation.id che potrebbe non esistere più (es. dopo delete). `prev.map(t => t.id === id ? ...: t)` è no-op in quel caso. Innocuo.
- `tabContent` è ricostruito anche per existing tab (`updateTab`), quindi una nuova chiusura debounceTimer è creata ad ogni openTransformation — ok, perché i closure vecchi non vengono più chiamati (nuovo JjtlDevelopmentEnv = nuovo onCodeChange).

## 2026-04-16 — fix: project save now includes transformations (data loss bug)
**File toccati**: `frontend/src/joiner/classes.ts`, `frontend/src/components/project/ProjectEditor.tsx`
**Esito**: ✅ build ok (`vite build` 45.11s)

**Root cause**: Le trasformazioni JjTL erano memorizzate solo in `useState` di `ProjectEditor.tsx:158` (commento esplicito: `// Transformations state (in-memory for now)`). Il save flow (`SaveManager.save` → `ProjectsApi.save` → `U.compressedState`) serializza esclusivamente il Redux store; le trasformazioni, vivendo in component state, non finivano mai nel JSON salvato. Al ricaricamento, l'`useState` ripartiva da `[]` e tutte le regole/guardie/mappings/trace della trasformazione venivano persi (data loss).

**Fix minimo (2 file)**:
1. **`joiner/classes.ts`**: aggiunto campo `transformations: any[] = []` a `DProject` e `transformations!: any[]` a `LProject`. Tipo `any[]` per evitare dipendenza circolare `joiner` → `jjtl`. Posizionato accanto a `tagNames` (stesso pattern di campo serializzabile non-pointer).
2. **`components/project/ProjectEditor.tsx`**: `useState` ora inizializzato da `(project as any).transformations || []`. Wrapper `setTransformations` (via `useCallback`) intercetta ogni update e dispatcha `SetFieldAction.new(project.id, 'transformations', next, '', false)`, scrivendo in Redux. Le 5 call-site esistenti (`setTransformations(prev => ...)`) continuano a funzionare invariate grazie alla firma `React.SetStateAction<JjtlTransformation[]>` del wrapper.

**Perché funziona**:
- `U.compressedState` (`common/U.tsx:426`) fa `state.idlookup[id] = {...dproject, state: ''}` — qualunque campo presente sul DProject viene serializzato.
- `LoadAction` ricostruisce l'intero state in Redux. La proxy `LProject` espone automaticamente `project.transformations` (stesso meccanismo di `tagNames`).
- Retrocompatibile: progetti vecchi senza il campo → `project.transformations` è `undefined` → fallback a `[]`.

**Documentation (bassa priorità)**: lasciato `// TODO: include documentation in project save` accanto allo state hydration. Stesso pattern di in-memory state riscontrato in `DocumentationSection`, ma rigenerabile e fuori scope di questo fix.

**Note architetturali per futuro**:
- Il megamodel (`model/megamodelPersistence.ts`) ha lo stesso problema sul flow `SaveManager.save` (è persistito solo nel `.jjodel` export tramite `buildProjectExportJson`, non in `compressedState`). Bug separato, non in scope.
- Il pattern wrapper `setTransformations` evita refactor invasivi delle 5 call-site esistenti.

## 2026-04-14 — fix: Dashboard CSS injection reactive + includes all views
**File toccati**: `frontend/src/pages/components/Dashboard.tsx`
**Esito**: ✅ build ok (80 errori TS, `vite build` 40.54s)

**Root cause**: `ProjectDashboard` had NO Redux subscription — it read project data via `LProject.fromPointer(id)` (one-shot `store.getState()`). The `<style>` tag only updated when the component re-rendered for other reasons (tab switch, hideLeftBar, etc.). Views created after the initial render or views whose CSS was edited were missed because:
1. No `useSelector` → no re-render on Redux state change
2. The `allSubViews` traversal depended on the L-proxy hierarchy being fully up-to-date (timing issue with async dispatches)

**Fix**: Replaced the one-shot `vparr.flatMap(vp => vp.allSubViews)` gathering with a `useSelector` that iterates `state.idlookup`, filtering for `DViewElement` and `DViewPoint` classNames, and calling `compiled_css` on each. This ensures:
- The `<style>` tag re-renders whenever ANY view's state changes in Redux
- ALL views in the project are included (not just those reachable via the subViews hierarchy)
- Newly created views are picked up immediately after their Redux dispatch propagates

**Performance**: iterating `state.idlookup` on every Redux change is O(n) where n = total elements. For typical projects (~100-500 elements, ~10-30 views), this is negligible (<1ms). The `compiled_css` getter is lazy — it returns the cached string immediately if `css_MUST_RECOMPILE` is false.

## 2026-04-14 — fix: view CSS not injected into DOM after project load
**File toccati**: `frontend/src/redux/reducer/reducer.ts`
**Esito**: ✅ build ok (80 errori TS, `vite build` 36.95s)

**Root cause**: After `LoadAction` (project load, reducer.ts:517-529), the Redux state is replaced wholesale with the deserialized project data. `css_MUST_RECOMPILE` and `compiled_css` are transient fields NOT included in the serialized project — they default to `undefined`/`false` and `''` respectively. The `get_compiled_css()` getter (view.tsx:793) checks `if (!c.data.css_MUST_RECOMPILE) return c.data.compiled_css` — since `!undefined` is `true`, it returns the cached empty string without ever compiling.

The Dashboard's `<style id="views-css-injector-d">` tag (Dashboard.tsx:595-597) maps `v.compiled_css` for all views → all return `''` → empty style tag → no view CSS in DOM.

**Fix**: Added `newState.VIEWS_RECOMPILE_all = true` after `LoadAction` processing (reducer.ts:529). This triggers the existing recompilation loop (reducer.ts:661-686) which sets `css_MUST_RECOMPILE = true` on every DViewElement. The next access to `compiled_css` then compiles the CSS (palettes + user CSS wrapped in the scoping selector) and caches it.

**How the CSS reaches the DOM**:
```
LoadAction → newState.VIEWS_RECOMPILE_all = true
  → reducer line 661: expands to all element IDs
  → reducer line 679: sets css_MUST_RECOMPILE = true per view
  → Dashboard.tsx: <style>{views.map(v => v.compiled_css)}</style>
  → compiled_css getter: css_MUST_RECOMPILE is true → compiles user CSS + palettes
  → wraps in scoping selector: .Pointer_View_XXX { user CSS }
  → <style> tag contains actual CSS → applied to canvas instances
```

## 2026-04-14 — fix: view CSS not applied to instances on canvas
**File toccati**: `frontend/src/components/forEndUser/Aliases.tsx`
**Esito**: ✅ build ok (80 errori TS, `vite build` 42.46s)

**Root cause**: The `<View>` component (Aliases.tsx:10-13) renders `<view className={"view " + className} {...props}>`. The spread `{...props}` passes `classNameAdd` as a **custom DOM attribute** instead of merging it into `className`. The `classNameAdd` prop (injected by `UX.tsx:340`) contains the view ID (e.g., `"mainView,Pointer_View_123,..."`) which is the CSS scoping selector used by `view.tsx:875` (`.${c.data.id} { ... }`). Without merging, the scoped CSS selector `.Pointer_View_123 { .state { ... } }` never matches because `Pointer_View_123` isn't in the element's class list.

**Fix**: Destructure `classNameAdd` from props, replace commas with spaces (UX.tsx joins with `,`), and merge into `className`:
```tsx
const { classNameAdd, className, ...rest } = props;
const addClasses = classNameAdd ? String(classNameAdd).replace(/,/g, ' ') : '';
const merged = ('view ' + (className || '') + ' ' + addClasses).trim();
return <view className={merged} {...rest}>{children}</view>;
```

Before: `<view class="state bg-white p-1" classnameadd="mainView,Pointer_View_123">` — CSS can't match
After: `<view class="view state bg-white p-1 mainView Pointer_View_123">` — `.Pointer_View_123 { .state { border: 1px solid red } }` matches

## 2026-04-14 — fix: Maximum Update Depth — reference-stabilizing guard on ReactFlow props
**File toccati**: `frontend/src/components/editor-v2/EditorV2.tsx`
**Esito**: ✅ build ok (80 errori TS, `vite build` 38.40s)

**WHY PREVIOUS FIXES WEREN'T ENOUGH**: Memoizing nodes/edges and debouncing the sync reduce the frequency but can't eliminate reference-only changes caused by the Jjodel action system's `setTimeout(dispatch, 0)` (action.ts:349) + periodic `setInterval → COMMIT` (reducer.ts:1381). Any code path that calls `setNodes(prev => ...)` and returns a new array (even with identical content) produces a new reference → StoreUpdater sees "change" → calls internal `setNodes()` → re-render → possible loop.

**THE FIX — Reference stabilizer**: Added `stableNodes`/`stableEdges` useMemo guards between the React state (`nodes`/`edges` from `useNodesState`/`useEdgesState`) and the `<ReactFlow>` props. The guard compares each node/edge structurally (id, type, data reference, selected, position within 0.1px, measured dimensions). If ALL elements match, it returns the **previous array reference** from a `useRef`. StoreUpdater sees the same reference → no sync → no loop.

```tsx
<ReactFlow
    nodes={stableNodes}   // ← stabilized reference
    edges={stableEdges}   // ← stabilized reference
    ...
/>
```

**Comparison fields checked per node**: `id`, `type`, `data` (reference), `selected`, `dragging`, `hidden`, `position.x/y` (±0.1px), `measured.width/height` (exact).

**Comparison fields checked per edge**: `id`, `source`, `target`, `sourceHandle`, `targetHandle`, `type`, `data` (reference), `selected`, `hidden`.

**When the guard DOES return a new reference**: only when genuine structural changes are detected (node added/removed, position changed >0.1px, data object replaced, selection toggled, etc.). These are legitimate changes that StoreUpdater should process.

**Retained from previous fixes**: dimension rate limiter (EditorV2.tsx), deeper shallowDataEqual (useJjomSync.ts), requestAnimationFrame debounce (useJjomSync.ts), Input.tsx value normalization.

## 2026-04-14 — fix: Maximum Update Depth Exceeded — debounced incremental sync
**File toccati**:
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` — debounced setNodes/setEdges via requestAnimationFrame + deeper shallowDataEqual + debug log cleanup

**ROOT CAUSE IDENTIFIED**: `action.ts:349` wraps EVERY Redux dispatch in `setTimeout(fn, 0)`, forcing it outside React's render batch. The periodic `setInterval(() => COMMIT(undefined, false), N)` at `reducer.ts:1381` flushes buffered mutations through this async dispatch. Each dispatch arrives as a SEPARATE render cycle → `elementSnapshots` selector fires → incremental sync effect → `setNodes` → StoreUpdater → re-measure → dimension changes → `handleNodesChange` → new nodes ref → StoreUpdater fires AGAIN → LOOP.

**FIX — Debounced push via requestAnimationFrame**: Instead of calling `setNodes`/`setEdges` synchronously inside the incremental sync `useEffect`, patches are accumulated in `pendingNodePatchRef`/`pendingEdgePatchRef` arrays. A single `requestAnimationFrame` callback (`scheduleFlush`) flushes ALL accumulated patches into ONE `setNodes` call (using `reduce` to compose the patch functions). Multiple rapid COMMIT→dispatch→effect cycles within the same animation frame are coalesced into a single React state update. This breaks the loop because StoreUpdater only sees ONE nodes reference change per frame, not N.

**Previous fix (retained)**:
- `EditorV2.tsx`: rate limiter (`dimRateLimitRef`) for dimension changes — safety net
- `useJjomSync.ts`: deeper `shallowDataEqual` — prevents unnecessary patches for object nodes with recreated FeatureValueRow objects
- `Input.tsx`: `value ?? ''` — prevents uncontrolled→controlled React warning

## 2026-04-14 — fix: Maximum Update Depth Exceeded in EditorV2 (ReactFlow infinite loop)
**File toccati**:
- `frontend/src/components/editor-v2/EditorV2.tsx` — rate limiter for dimension changes + debug log cleanup
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` — deeper `shallowDataEqual` comparison + debug log cleanup
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` — debug log cleanup
- `frontend/src/components/forEndUser/Input.tsx` — fix uncontrolled→controlled warning
**Esito**: ✅ build ok (80 errori TS, `vite build` 40.23s)

**Root cause (rename trigger)**: `objectVertexToRFNode()` creates NEW `FeatureValueRow` objects every time it's called. The old `shallowDataEqual` compared array elements by reference identity (`va[i] !== vb[i]`) — always FALSE for freshly-created objects, even with identical values. Result: incremental sync always considered object-node data "changed" → always called `setNodes` → StoreUpdater → measurement → loop.

The rename flow: ObjectNode `commitName()` → `setNodes` (label update) + `syncNodeLabel` → Redux dispatch → `elementSnapshots` selector detects hash change → incremental sync fires → calls `jjomVertexToRFNode()` → new features array with new object references → `shallowDataEqual` returns false → patches node data → `setNodes` → StoreUpdater → re-measure → dimension change (label width changed) → `handleNodesChange` → new nodes ref → loop.

**Fix 1 — Deeper `shallowDataEqual`** (useJjomSync.ts): Rewrote to do TWO levels of shallow comparison:
- Level 1: top-level keys compared by identity (same as before)
- Level 2 (NEW): for array elements that are objects, compare their properties shallowly (string/number/boolean values). For nested arrays of primitives (e.g. enumLiterals), compare elements by identity.

This correctly identifies that `{ name: "State", kind: "attribute", value: "idle" }` from two separate `objectVertexToRFNode` calls is EQUAL, even though the objects are different references. When data is actually equal, `patchedNodeData` is NOT populated → `hasNodeChanges` is false → `setNodes` is NOT called → loop broken.

**Fix 2 — Rate limiter** (EditorV2.tsx): Added `dimRateLimitRef` — max 3 auto-measurement dimension changes per node per 500ms. Safety net for cases where dimensions genuinely oscillate (ErrorDisplay badge, font loading, CSS transitions).

**Fix 3 — Input uncontrolled→controlled** (Input.tsx:286): `value: serializeValue(value)` could be `undefined` (when `serializeValue` returns `undefined` at line 130 or when initial getter returns `undefined` at line 96). Changed to `value: serializeValue(value) ?? ''`. This prevents React's "A component is changing an uncontrolled input to be controlled" warning, which caused extra re-renders during composition-child rename and contributed to the StoreUpdater cascade. The `setTimeout` in Jjodel's action system (action.ts) makes these extra re-renders arrive as SEPARATE render cycles (outside React batching), each triggering a full StoreUpdater sync.

**Debug log cleanup**: Removed 7 `console.log('[DEBUG ...]')` statements across EditorV2.tsx, useJjomSync.ts, jjomTransformers.ts.

## 2026-04-14 — fix: context menu text color (dark on dark)
**File toccati**: `frontend/src/components/editor-v2/EditorV2.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 42.60s)
**Root cause**: Context menu is rendered via `createPortal(menu, document.body)` (EditorV2.tsx:2663-2671) — portaled OUTSIDE the `.editor-v2.theme-dark` / `.editor-v2.theme-light` scope where `--float-text`, `--float-bg`, etc. are defined. At `<body>` level these CSS variables are undefined → `var(--float-text)` resolves to the initial value (browser default: black text) → dark text on dark `#1e293b` background.
**Fix**: Added hardcoded fallback values to every `var()` call in `.context-menu` rules — `var(--float-bg, #1e293b)`, `var(--float-text, #cbd5e1)`, `var(--float-hover, rgba(255,255,255,0.06))`, `var(--float-danger, #f87171)`, `var(--float-danger-bg, rgba(239,68,68,0.12))`, `var(--float-shadow, rgba(0,0,0,0.3))`, `var(--float-border, #334155)`, `var(--float-divider, rgba(255,255,255,0.08))`. Also set `i { color: inherit }` on icons (was commented out `//color: var(--float-icon)`). If the menu IS inside the theme scope (e.g. portal target changes), the variables override the fallbacks — backward compatible.

## 2026-04-13 — fix: update documentation and GitHub links
**Prompt**: Update all documentation links from www.jjodel.io to docs.jjodel.io and GitHub links from MDEGroup to jjodel-modeling
**File toccati**: Navbar.tsx, LeftBar.tsx, EmptyDashboard.tsx, RightPanel.tsx, About.tsx, AboutDialog.tsx, useHelpResolver.ts, U.tsx, Try.tsx, classes.ts, Dashboard.tsx, shareUtils.ts
**Esito**: ✅ completato (80 errori TS pre-esistenti invariati)

**Docs links** (www.jjodel.io → docs.jjodel.io):
- Navbar Help menu: Learn Jjodel, Getting Started, Video Tutorials, User Guide, Glossary, FAQ (enabled from disabled)
- LeftBar: Manual, Getting Started, API Reference
- EmptyDashboard: 3 resource links
- RightPanel: user-manual, documentation
- AboutDialog: Website → `jjodel.io`, Changelog → Documentation
- useHelpResolver.ts: WEB_BASE for "open in browser" in HelpDrawer

**GitHub links** (MDEGroup → jjodel-modeling/jjodel-frontend):
- Navbar: Roadmap → milestones, What's New → releases, Support → 3 enabled sub-items (Report Bug, Request Feature, Contact)
- About.tsx: changelog → GitHub releases
- U.tsx: error report issue link
- Try.tsx: automatic bug report owner/repo
- classes.ts: wiki link → docs.jjodel.io/reference/jjom/

**HTTP → HTTPS**:
- Dashboard.tsx: `http://app.jjodel.io` → `https://`
- shareUtils.ts: same

**Remaining www.jjodel.io** (expected exceptions): `Auth.tsx` terms-conditions, `LeftBar.tsx` explore
**Zero MDEGroup** references remaining

## 2026-04-12 — fix: RGB input values visible with proper width
**File toccati**: `frontend/src/components/forEndUser/color.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 43.01s)
**Fix**: `.cpanel__input-group input` was fixed at `width: 44px; text-align: center` — with the global `padding-right: 16px` for spinners, only ~22px remained for text (invisible "255"). Changed to: `width: 100%; min-width: 52px; text-align: left; padding: 4px 18px 4px 6px; box-sizing: border-box`. The parent `.cpanel__input-group` now has `flex: 1 1 auto; min-width: 0` so inputs share space equally.

## 2026-04-12 — fix: number input padding-right for spinner arrows
**File toccati**: `frontend/src/styles/components/_form-system.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 59.02s)
**Fix**: `input[type="number"] { padding-right: 2px }` → `padding-right: 16px`. The 2px was too tight — multi-digit values (e.g. "255" in RGB inputs) overlapped the spinner arrows. 16px provides ~14px clearance matching typical spinner width.

## 2026-04-12 — fix: restore number spinners, remove right padding
**File toccati**: `frontend/src/styles/components/_form-system.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 39.74s)
**Fix**: reversed the hide rule — `_form-system.scss:189-198` now explicitly restores spinners with `-webkit-appearance: inner-spin-button; margin: 0; padding: 0; opacity: 1` and sets `padding-right: 2px` on `input[type="number"]` to eliminate the gap. Removed the unused `.number-input-with-spinner` class (was dead code).

## 2026-04-12 — style: remove native number input spinners globally
**Prompt**: nascondere frecce up/down native su input[type=number]
**File toccati**: `frontend/src/components/editors/skeleton.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 49.26s)
**Root cause**: `skeleton.scss:226-242` had a GLOBAL rule re-enabling spinners with `!important`: `input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: auto !important; width: 24px; }`. This overrode the hide rule in `_form-system.scss:194-197` (`-webkit-appearance: none` — no `!important`). The skeleton rule was a legacy "spin buttons v1.0" style.
**Fix**: removed the 16-line block at skeleton.scss:226-242 (replaced with a one-line comment). The `_form-system.scss` global hide rule now takes effect uncontested: `-webkit-appearance: none` on `::-webkit-inner-spin-button` / `::-webkit-outer-spin-button`, plus `-moz-appearance: textfield` for Firefox.

## 2026-04-12 — fix: opacity slider track height + hide plus icon on hover
**File toccati**: `frontend/src/components/forEndUser/color.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 46.77s)
**Fix 1 — Opacity slider track mismatch**: root cause was `::-webkit-slider-runnable-track { height: 6px }` and `::-moz-range-track { height: 6px }` at lines 510-518 (legacy path) that overrode the element-level `height: 10px`. WebKit/Firefox render the track via pseudo-elements, not the input element height. Fixed both legacy and portal paths: track pseudo-elements → `10px; border-radius: 5px` matching the hue slider exactly.
**Fix 2 — Plus icon hidden by default**: `.cpanel .btn.color-suggestion i.bi` now has `opacity: 0; transition: opacity 0.15s`, with `&:hover i.bi { opacity: 1 }`. Clean circles when idle, `+` appears on hover.

## 2026-04-12 — style: opacity slider matches hue slider (both paths)
**File toccati**: `frontend/src/components/forEndUser/color.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 1m1s)
**Fix**: aligned both opacity slider instances to the hue slider dimensions:
- `.cpanel .suggestcontent input[type="range"]` (portal path, ~line 915) — already aligned in prev session
- `.suggestions input[type="range"]` (legacy path, ~line 478) — aligned now: track `6px; radius 3px` → `10px; 5px`, thumb `14×14` → `16×16`, shadow `0 1px 3px` → `0 1px 4px`, border `#cbd5e1` → `rgba(0,0,0,0.2)`, margin `8px 0` → `4px 0`

## 2026-04-12 — fix: suggestion panel color swatches → perfect circles
**Prompt**: i cerchi dentro il pannello scuro erano ancora ovali
**File toccati**: `frontend/src/components/forEndUser/color.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 47.85s)
**Fix**: riscritta la regola `.cpanel .btn.color-suggestion` con "nuclear approach" — ogni possibile dimensione forzata: `width/height/min-width/min-height/max-width/max-height: 22px !important`, `box-sizing: border-box`, `overflow: hidden`, `display: inline-flex` con center/center alignment, `font-size: 0` sul button (kills text baseline offset), `line-height: 1` su button e `i.bi`. Triple-selector `.btn.color-suggestion, button.btn.color-suggestion, .roww > .btn.color-suggestion` per massima specificity. Border ridotto da 2px a 1px per guadagnare spazio dentro il cerchio più piccolo. Icon `i.bi` ridotta da 12px a 10px.

## 2026-04-12 — fix: color swatches perfect circles, 20% smaller
**Prompt**: forzare cerchi perfetti (width === height) e ridurre 20%
**File toccati**:
- `frontend/src/components/editors/views/data/palette-data.scss` — root cause fix + size reduction
- `frontend/src/components/forEndUser/color.scss` — suggestion circle size in panel + legacy block
**Esito**: ✅ build ok (80 errori TS, `vite build` 43.70s)

**Root cause dell'ovale**: `palette-data.scss:492-496` dentro `#root .style-tab-redesign .controls .color-picker-root` aveva `height: 200% !important; transform: translateY(-25%) !important`. Specificity `(1,3,0)` con `!important` batteva la regola base `height: 24px !important` a specificity `(0,1,0)`. Risultato: width 24px ma height 48px → **ovale**. Le regole erano un hack per il vecchio `<input type="color">` nativo (rendere l'area cliccabile più grande verticalmente) — non più necessarie con il custom swatch `<div>`.

**Fix**: rimossi `height: 200% !important` e `transform: translateY(-25%) !important` dal blocco nested. Anche rimossi i sub-rules `input { min-width: 25px; height: 25px }` e `.delete-color { width: auto }` (target elementi che non esistono più nel DOM).

**Size reduction (-20%)**:
| Element | Before | After |
|---|---|---|
| `.color-picker-root` (palette-data.scss:282-283) | `24px × 24px` | `20px × 20px` |
| `.color-suggestion` (palette-data.scss:344-345) | `24px × 24px` | `20px × 20px` |
| `.cpanel .btn.color-suggestion` (color.scss) | `28px × 28px` | `22px × 22px` |
| Legacy `button.btn.color-suggestion` (color.scss:298-299) | `28px × 28px` | `22px × 22px` |
| `.jj-color-swatch` (color.scss:758-760) | `100% × 100%` | unchanged (fills parent) |

## 2026-04-12 — fix: unified color picker panel definitive layout (createPortal)
**Prompt**: ristrutturare Color.tsx per avere un singolo pannello contenuto
**File toccati**:
- `frontend/src/components/forEndUser/Color.tsx` — rewrite: panel rendered via `createPortal(panel, document.body)`
- `frontend/src/components/forEndUser/color.scss` — rewrite del blocco jj-color-* → `.cpanel` namespace
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 44.64s)

**Root cause del layout rotto**: `palette-data.scss:333` forza `.content.suggestions { position: absolute !important; z-index: 99999 !important }`. Il mio precedente override in `.jj-color-panel .content.suggestions { position: static !important }` aveva STESSA specificity `(0,2,0)` — palette-data.scss caricato dopo vince. Inoltre `.color-picker-root` è forzato a `24×24px` (palette-data.scss:282-283), troppo piccolo per ancorare un panel da 260px.

**Fix definitivo: `createPortal`**: il panel è renderizzato fuori dal DOM hierarchy via `createPortal(panel, document.body)`. Questo bypassa:
- `overflow: hidden` su qualsiasi parent
- z-index stacking contexts
- palette-data.scss's !important position rules
- Il constraint 24×24px del `.color-picker-root`

**Architettura nuova**:
```
<body>
  ...
  <div class="cpanel" style="position: fixed; top: {swatchBottom+4}; left: {centered}">
    <div class="cpanel__sv">canvas + cursor</div>
    <input class="cpanel__hue" />
    <div class="cpanel__inputs">HEX + R + G + B</div>
    <div class="cpanel__divider" />
    {childrenn}  ← .content.suggestions flows inline (overridden to position:static)
  </div>
  ...
</body>
```

**Posizionamento**: `position: fixed` basato su `anchorRef.getBoundingClientRect()` → `top = swatchBottom + 4`, `left = swatchCenterX - 130` (centrato 260px), `Math.max(4, left)` per non fuoriuscire a sinistra.

**CSS specificity fix per `.content.suggestions`**: `.cpanel .content.suggestions.suggestions` = specificità `(0,4,0)` > `(0,2,0)` di palette-data.scss → override vince anche con !important su entrambi (higher specificity wins when both have !important).

**Click-outside dismissal**: `useEffect` su `ColorPanel` ascolta `mousedown` globale, chiude se click fuori sia dal panel che dal swatch (due ref check).

**Namespace `.cpanel`** scelto perché: corto, unico nel codebase (verificato), evita collisioni con `.jj-color-panel` / `.color-panel` / `.color-picker-root` etc. che hanno regole conflittuali sparse in palette-data.scss + color.scss.

**Cosa rimane in color.scss (legacy)**: le vecchie regole `.pinned`, `.hoverable`, `.color-picker-root` etc. dalle righe 1-754 sono ora parzialmente dead code (il pinned highlight, il hover trigger, etc.) ma non rompono nulla — le regole di palette-data.scss che forzano `!important` su `.color-picker-root` rendono le vecchie regole irrilevanti. Cleanup di queste regole legacy delegato a post-release.

## 2026-04-12 — style: color picker refinements (oval border, scrollbar, circle shape)
**Prompt**: 3 fix cosmetici sul color picker panel
**File toccati**: `frontend/src/components/forEndUser/color.scss`
**Esito**: ✅ build ok (80 errori TS, `vite build` 41.15s)

**Fix 1 — Oval border on pinned swatch**: `.pinned { background; outline: 1px solid; border-radius: 20% }` applicava un bordo ovale al container `.color-picker-root` rettangolare (width > height → 20% radius = ellisse). Rimossi `background`, `outline`, `border-radius` — il pannello aperto è sufficiente come visual indicator.

**Fix 2 — Scrollbar nel panel**: `.jj-color-panel { max-height: 500px; overflow-y: auto }` causava scrollbar interna. Rimossi entrambi — il panel si espande per mostrare tutto il contenuto.

**Fix 3 — Oval suggestion circles**: `button.btn.color-suggestion` usava `width/height: var(--input-height)` (variabile non risolta nell'ambito del panel dark → fallback potenzialmente non quadrato). Cambiato a `width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0` — dimensioni fisse, sempre circolari, non comprimibili dal flex parent.

## 2026-04-12 — feat: unified color picker panel (custom HSV canvas + palette in single popup)
**Prompt**: sostituire `<input type="color">` con color picker custom, integrare nel pannello palette
**File toccati**:
- `frontend/src/components/forEndUser/Color.tsx` — rewrite completo (~170 → ~200 righe)
- `frontend/src/components/forEndUser/color.scss` — aggiunto blocco `jj-color-*` (~150 righe)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 47.93s)

**Architettura del nuovo componente**:
```
<div className="color-picker-root pinned">      ← root (click toggles pinned)
  <div className="jj-color-swatch">              ← circle showing current color (replaces input[type=color])
  <div className="jj-color-panel">               ← unified popup (absolute, z-index 10000)
    <ColorPicker>                                 ← NEW: inline HSV picker component
      <div className="jj-color-picker__sv">       ← SV canvas (CSS gradients + mouse drag)
      <input className="jj-color-picker__hue">    ← Hue slider (0-360, rainbow gradient)
      <div className="jj-color-picker__inputs">   ← HEX + R/G/B number inputs
    </ColorPicker>
    <div className="jj-color-panel__divider">     ← separator
    {props.childrenn}                             ← existing: Opacity + Analogous/Lighten/... + Delete
  </div>
</div>
```

**Cosa è stato rimosso**:
- `<input type="color" ...>` nativo — sostituito dal swatch + custom picker. Nessun popup nativo del browser.
- L'intero blocco `otherprops` cleanup (delete data/field/getter/setter/etc.) — non serve più, l'input nativo era l'unico consumer
- I `<label>` wrapper per tooltip (erano dentro la vecchia `<label>` root) → convertiti a `<span>` già nel fix precedente, ora semplicemente rimossi (il tooltip label era ridondante)

**ColorPicker (nuovo componente inline, ~60 righe)**:
- **SV Canvas**: `<div>` con `background: linear-gradient(to right, #fff, hsl(H, 100%, 50%))` + overlay `linear-gradient(to bottom, transparent, #000)`. Mouse handler su `mousedown` + `mousemove/mouseup` via document listeners. Il cursor circle si muove via `left` + `top` percentuali.
- **Hue Slider**: `<input type="range" min=0 max=360>` con `background: linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`.
- **Inputs**: HEX (text, 70px) + R/G/B (number 0-255, 44px ciascuno). Tutti sincronizzati bidirezionalmente via tinycolor.
- **Conversioni**: `hexToHsv()` e `hsvToHex()` wrapper su `tinycolor2` (già installato nel codebase).

**Sincronizzazione bidirezionale**:
- User drags SV canvas → `hsvToHex(h, newS, newV)` → `setter(hex)` → getter aggiorna → RGB inputs si aggiornano
- User drags Hue slider → `hsvToHex(newH, s, v)` → setter → SV canvas gradient si aggiorna (via `hsl(H, 100%, 50%)` nello style)
- User types RGB → `tinycolor({r, g, b}).toHexString()` → setter → SV cursor + hue slider si aggiornano
- User types HEX → `tinycolor(hex)` se valido → setter → tutto si aggiorna
- User clicks palette suggestion (Analogous, Lighten, etc.) → PaletteData.tsx chiama `setColor(prefix, i, newVal)` → getter/setter chain aggiorna il picker

**Panel posizionamento e dismissal**:
- `position: absolute; top: calc(100% + 4px); left: 50%; transform: translateX(-50%)` — centrato sotto il swatch
- `width: 260px; max-height: 500px; overflow-y: auto` — contenuto scrollabile se supera viewport
- Click outside → `document.addEventListener('mousedown')` handler chiude il pannello (invariato dal fix precedente)
- `onClick={e.stopPropagation()}` sul panel evita che click interni chiudano il panel

**Childrenn integration**: il `props.childrenn` (passato da PaletteData.tsx, contiene `<div className="content suggestions">` con Opacity slider + Analogous/Lighten/Darken/... + Delete button) viene renderizzato DENTRO `.jj-color-panel`. La regola CSS `.jj-color-panel .content.suggestions { position: static; background: transparent }` fa si che il pannello suggestions fluisca inline nel popup unificato (non assoluto come prima).

**Dark theme naturale**: il panel usa `background: #1e293b` (slate-800), inputs `background: #0f172a` (slate-900), text `#e2e8f0` (slate-200) — lo stesso schema dark del pannello suggestions esistente. Tutto si integra visivamente.

## 2026-04-12 — fix: color palette panel closed by default
**Prompt**: il pannello suggerimenti colore appariva automaticamente quando si apriva il tab Style
**File toccati**: `frontend/src/components/forEndUser/color.scss` (1 riga aggiunta)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati)
**Root cause**: nel fix precedente (hover→click), rimuovendo il blocco di trigger `:hover/:focus-within/:active` da color.scss, avevo anche rimosso la regola `.controls:focus-within .content.suggestions:not(:focus-within) { display: none !important }` che serviva come default-hide. Senza quella regola, `.content.suggestions` non aveva nessun `display: none` → visibile di default.
**Fix**: aggiunto `display: none` alla regola `.color-container .suggestions` (color.scss:264). Il `.pinned .content.suggestions { display: flex }` override lo mostra solo quando l'utente clicca.

## 2026-04-12 — fix: color picker hover→click, opacity slider styling
**Prompt**: cambiare hover→click per pannello palette colori, stilizzare slider opacity, evitare sovrapposizione popup
**File toccati**:
- `frontend/src/components/forEndUser/Color.tsx` — TSX refactor
- `frontend/src/components/forEndUser/color.scss` — CSS trigger change + slider styling

**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 47.72s)

**Fix P1 — hover→click (Color.tsx)**:
- Changed root element from `<label>` to `<div>` — prevents automatic forwarding of clicks to the child `<input type="color">` (browser `<label>` behavior). Now clicking the color circle area toggles the suggestions panel instead of opening the native color picker.
- Added `[pinned, setPinned]` state + `.pinned` CSS class on root `<div>`
- `handleRootClick`: toggles pinned, but skips if click target is inside `.content.suggestions` (let suggestion buttons handle their own clicks) or is the `<input>` element itself (let native picker open on direct input click)
- Added `useEffect` click-outside handler (`document.addEventListener('mousedown')`) that unsets pinned when clicking outside the root `<div>`

**Fix P3 — no overlap (color.scss)**:
- Removed `:hover`, `:focus-within`, `:active` from the `.content.suggestions` display trigger (was `.hoverable:hover, .hoverable:focus-within, .hoverable:active, .hoverable.pinned` at line 426)
- Only `.pinned` now shows the panel → click-only behavior, no accidental hover popup
- The native color picker (browser's `<input type="color">`) opens only when the user clicks directly on the `<input>` element (not via label forwarding since root is now `<div>`)
- Since `.pinned` toggle and native picker are separate interactions, they don't overlap

**Fix P2 — opacity slider (color.scss)**:
- Added custom styling for `input[type="range"]` inside `.suggestions`:
  - `-webkit-appearance: none; appearance: none` — kills browser default
  - Track: 6px height, 3px radius, `linear-gradient(to right, transparent, currentColor)` background
  - Thumb: 14×14px white circle with `#cbd5e1` border and subtle shadow
  - Both `-webkit-slider-thumb` and `-moz-range-thumb` covered for cross-browser

**Root `<label>` → `<div>` blast radius**:
- `<Color>` JSX element is rendered ONLY in `PaletteData.tsx:376` (verified via grep: 1 usage)
- Inner `<label>` elements (for tooltip labels) changed to `<span>` to avoid nested-`<label>` issues now that root is `<div>`
- The `color-picker-root` CSS class styles are unaffected — they used the class selector, not element-type selectors

**Other hover rules left intact**:
- `.value.hoverable:hover` (color.scss:401) — for SVG path value rows, different component from color circles, not changed
- `.controls:not(:focus-within) .color-picker-root:hover` (was line 462) — removed along with the old trigger block (now replaced by `.pinned` which provides the same visual feedback: outline + overflow + bg)
- `.controls:focus-within .content.suggestions:not(:focus-within)` (was line 471) — removed (no longer needed since suggestions are pinned-only, not focus-driven)

## 2026-04-11 — fix: JSX editor header alignment + language label
**Prompt**: allineare titolo header, cambiare TYPESCRIPT → JSX in status bar
**File toccati**:
- `frontend/src/components/editors/EditorFullscreenModal.scss` — header tightened
- `frontend/src/components/editors/EditorFullscreenModal.tsx` — nuova prop `languageLabel`
- `frontend/src/components/editors/languages/Jsx.tsx` — passa `languageLabel="jsx"`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 39.78s)

**Fix 1 — Header alignment** (`EditorFullscreenModal.scss:43-75`):
| Property | Before | After | Motivo |
|---|---|---|---|
| `.editor-fullscreen-header { padding }` | `16px 24px` | `8px 16px` | Tighter, matches task hint "padding 8px 16px" |
| `&__left { gap }` | `12px` | `8px` | Icon→title spacing più compatto |
| `&__left i { font-size }` | `20px` | `18px` | Icon leggermente più piccola |
| `&__left i { line-height }` | (not set → 1.2) | `1` | Evita offset verticale del line-height default |
| `&__left h2 { font-size }` | `18px` | `16px` | Header più compatto |
| `&__left h2 { line-height }` | (not set → 1.2) | `1` | **Fix critico**: senza questo il `h2` ha browser-default line-height 1.2 che offsetta il testo verticalmente di ~3-4px pur con `align-items: center` sul parent |
| `&__left h2 { padding }` | (not set → 0) | `0` (esplicito) | Safety |

**Fix 2 — Language label** (`EditorFullscreenModal.tsx` + `Jsx.tsx`):
Root cause: `EditorFullscreenModal` prop `language` serviva sia come Monaco language id (per syntax highlighting, es. `'typescript'`) sia come display label nel footer (`.editor-fullscreen-footer__language` con CSS `text-transform: uppercase`). Per il JSX editor Monaco richiede `language='typescript'` (configurato con `typescriptDefaults.setCompilerOptions({jsx: JsxEmit.React})` in `Jsx.tsx:44-54`), ma l'utente vedeva "TYPESCRIPT" nel footer invece di "JSX".

Fix: separato il display label dall'id Monaco. Aggiunta prop opzionale `languageLabel?: string` a `EditorFullscreenModalProps`. Il footer ora renderizza `{languageLabel ?? language}` — se la prop è fornita, usa quella; altrimenti fallback al `language` id (backward-compatible con tutti gli altri callers OCL/JS/MTM/Palette/Function che continuano a mostrare il language id grezzo).

`Jsx.tsx` passa `languageLabel="jsx"` insieme a `language="typescript"`. Il footer mostra "JSX" (uppercase via CSS) mentre Monaco usa l'ancora `typescript` engine per syntax highlighting JSX.

**Perché non cambiare `language="typescript" → "javascript"`**: Monaco's `typescript` language (via `typescriptDefaults.setCompilerOptions({jsx: JsxEmit.React})`) è configurato specificamente per JSX/TSX in `Jsx.tsx:44-54`. Passare a `javascript` perderebbe questa configurazione e potenzialmente rompe type-checking + autocomplete per il template.

**Perché non usare `'typescriptreact'` / `'javascriptreact'`**: Monaco non ha di default questi language id come top-level languages (solo via extensions), e il `typescriptDefaults` helper usa l'id `typescript`. Cambiarlo rompe il setCompilerOptions.

**Non toccato**:
- `Jsx.tsx` Monaco config (`typescriptDefaults.setCompilerOptions`, `setDiagnosticsOptions`, etc.) — invariato
- Altri callers di `EditorFullscreenModal` (OCL/JS/Javascript/PaletteData/MTM/Function) — tutti continuano a mostrare il `language` grezzo nel footer (backward-compatible)
- Stili `.editor-fullscreen-footer__language` (text-transform: uppercase, slate bg) — invariati

## 2026-04-11 — fix: Monaco editor invisible in JSX full-screen
**Prompt**: fix dimensioni container Monaco nel full-screen editor dopo rimozione split mode
**File toccati**: `frontend/src/components/editors/EditorFullscreenModal.tsx`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 44.08s)

**Root cause**: il rendering di `EditorFullscreenModal.tsx` wrappa il Monaco Editor in un `<div>` con `className` condizionale:

```tsx
<div className={viewMode === 'split' ? 'editor-fullscreen-editor-pane' : undefined}>
  <Editor width="100%" height="100%" ... />
</div>
```

In **split mode**, il wrapper ha la classe `.editor-fullscreen-editor-pane { flex: 1; display: flex; flex-direction: column; min-width: 0 }` che gli dà dimensioni corrette via flex row del parent `.editor-fullscreen-body--split`.

In **source mode** (l'unico mode ora dopo il fix precedente per disabilitare split), il wrapper ha `className={undefined}` — è un block div senza CSS rules → dimensioni auto. Monaco con `height="100%"` risolve contro parent auto-height → **0 pixel** → Monaco collassa invisibile anche se montato (status bar mostra 143 lines / 5386 chars).

**Perché gli altri editor (OCL/JS/MTM/Palette/Function) non mostrano lo stesso bug**: probabilmente l'`automaticLayout: true` option di Monaco + il ResizeObserver interno li salvano in alcuni casi. Il bug si è manifestato solo dopo la rimozione dello split mode dal JSX editor perché il JSX era SEMPRE in split mode prima, quindi il wrapper aveva sempre la classe `.editor-fullscreen-editor-pane`. Gli altri editor rendevano source-mode fin dall'inizio e avevano già workaround via automaticLayout (tested in real-time da Monaco ResizeObserver).

**Fix**: aggiunto inline `style={viewMode === 'source' ? { width: '100%', height: '100%' } : undefined}` sul wrapper `<div>`. Solo in source mode viene applicato — in split mode il wrapper usa la classe `.editor-fullscreen-editor-pane` invariata.

```tsx
<div
  className={viewMode === 'split' ? 'editor-fullscreen-editor-pane' : undefined}
  style={viewMode === 'source' ? { width: '100%', height: '100%' } : undefined}
>
  <Editor width="100%" height="100%" ... />
</div>
```

Ora Monaco's `height="100%"` risolve contro parent con altezza esplicita → dimensioni corrette → editor visibile.

**Non toccato**:
- `handleEditorMount` con `setTimeout(..., 50)` + `editor.layout()` — lasciato in place come safety net
- `automaticLayout: true` nelle editorOptions — invariato
- SCSS `.editor-fullscreen-body { flex: 1; position: relative; min-height: 0 }` — invariato
- `.editor-fullscreen-editor-pane` SCSS (flex layout per split mode) — invariato
- `Jsx.tsx` — il fix precedente per disabilitare split mode rimane valido; ora funziona correttamente grazie a questo fix complementare

**Impatto collaterale positivo**: tutti gli altri callers di `EditorFullscreenModal` (OCL, JS, Javascript, PaletteData, MTM, FunctionComponent) ora beneficiano dello stesso inline style esplicito in source mode — anche se erano apparentemente funzionanti prima, ora hanno dimensioni garantite senza dipendere dall'automaticLayout di Monaco (che è una race condition potenziale).

## 2026-04-11 — fix: disable split mode in JSX template full-screen editor
**Prompt**: rimuovere split view/preview dal template editor full-screen, forzare solo codice (preview mostrava errori per mancanza di contesto runtime completo, source-only mode aveva bug di rendering)
**File toccati**: `frontend/src/components/editors/languages/Jsx.tsx`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing)

**Architettura scoperta**: `EditorFullscreenModal.tsx` (il modal wrapper condiviso) ha una prop opzionale `renderPreview?: (code: string) => React.ReactNode`. La presenza di questa prop è il GATE per mostrare la toolbar con i 3 bottoni Source/Split/Preview (righe 235-265). Senza renderPreview, i bottoni non sono renderizzati e il modal è permanentemente in source-only mode.

**Callers di EditorFullscreenModal grepati**:
- `languages/Jsx.tsx:166` — passa `renderPreview={(code) => <TemplatePreview jsxCode={code} className={view.name} />}` ← **unico con split mode**
- `languages/Ocl.tsx:61` — no renderPreview (source-only)
- `languages/Js.tsx:105` — no renderPreview (source-only)
- `languages/Javascript.tsx:114` — no renderPreview (source-only)
- `views/data/PaletteData.tsx:762` — no renderPreview (source-only)
- `MTM.tsx:195` — no renderPreview (source-only)
- `forEndUser/FunctionComponent.tsx:399` — no renderPreview (source-only)

**Fix minimale (opzione A)**: rimossa la prop `renderPreview` dal caller Jsx.tsx:166 + rimosso l'import di `TemplatePreview` a riga 13. Il modal rende ora solo l'editor Monaco a tutta larghezza, senza split. **Nessun altro editor impattato** — tutti gli altri callers già usano source-only mode.

**Dead code flaggato (non rimosso)**:
- `frontend/src/components/editors/TemplatePreview.tsx` — ora zero importers, candidato a cleanup post-release ma lasciato in place per mantenere lo scope del task minimale. Se si vuole rimuoverlo: `rm src/components/editors/TemplatePreview.tsx` — verificato che nessun altro file lo importa.

**Non toccato**:
- `EditorFullscreenModal.tsx` — il modal wrapper rimane capable di rendere split mode se qualche futuro caller passa `renderPreview`. L'infrastruttura resta in place.
- `EditorFullscreenModal.scss` — stili split mode invariati (dead CSS selettivo, zero impact se nessun caller li attiva)
- Altri editor fullscreen (OCL, JS, Style/CSS, Options, Languages MTM, Function) — invariati, già source-only

**Verifica manuale post-deploy**:
- JSX full-screen → solo editor Monaco, nessuna toolbar split/preview, codice visibile
- Style/CSS full-screen, OCL/JS full-screen, MTM full-screen → invariati (sempre stati source-only)

## 2026-04-11 — style: reduce observed properties row spacing
**Prompt**: ridurre gap tra righe observed properties (troppo spaziate, ~20-24px invece di ~8px)
**File toccati**:
- `frontend/src/components/forEndUser/FunctionComponent.scss` — 2 regole modificate
- `frontend/src/styles/style.scss` — 1 regola modificata
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 2m27s)

**Componente identificato**: le righe "Observed Properties" e "Constants" sono renderizzate da `<Function>` (aka `FunctionComponent`) in `TemplateData.tsx:32-36`. Ogni riga è un `<label className="d-flex template-item my-1">` contenente identifier input + arrow + expression input + delete button.

**Valori prima/dopo**:
| Regola | Prima | Dopo |
|---|---|---|
| `.template-item { margin-bottom }` (FunctionComponent.scss:63) | `8px !important` | `4px !important` |
| `.function-editor-root[data-mode="simpleMode"] .template-item { padding }` (FunctionComponent.scss:243) | `6px 0 !important` | `2px 0 !important` |
| `.template-item:last-of-type { margin-bottom }` (style.scss:766) | `10px` | `4px` |

**Spaziatura totale per riga**:
- Prima: 6px (top) + content + 6px (bottom) + 8px (margin) = ~20px per row
- Dopo: 2px (top) + content + 2px (bottom) + 4px (margin) = ~8px per row

**Non toccato**:
- `.template-item:first-of-type { margin-top: 0 }` (style.scss:715) — già 0, nessun cambio
- La Bootstrap utility `my-1` (margin-y 4px) applicata nel TSX quando NOT in advanced mode — interagisce con le regole SCSS ma non la tocco (non SCSS)
- La struttura grid `grid-template-columns: 35% auto 1fr auto` (FunctionComponent.scss:239) — invariata, serve per il layout identifier / arrow / expression / delete
- `gap: 8px` nel grid — invariato, è il gap tra le colonne (identifier, arrow, expression, delete), non tra le righe

**Scope**: le 3 modifiche agiscono su `.template-item` che è usato da TUTTI i `<Function>` components — quindi sia "Constants" che "Observed Properties" nel Template tab beneficiano. Se ci sono altri usi di `FunctionComponent` nel codebase, anche quelli avranno le righe più compatte (positive side effect, consistenza).

## 2026-04-11 — fix: reverse spacing direction in Apply to tab
**Prompt**: la spaziatura era stata ridotta invece che allineata alla baseline (più ariosa)
**File toccati**: `frontend/src/components/editors/views/data/viewapplyto.scss` (+1 regola scoped)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 37.51s)

**Root cause**: il fix precedente (`.view-editor-tab-content { padding: 8px → 0 }`) ha ridotto di 8px la spaziatura EXTERNAL attorno al contenuto — direzione sbagliata. Il Properties panel è PIÙ ARIOSO di quanto Apply to fosse prima, non meno. L'errore era assumere che il Properties panel mettesse padding sull'outer container; in realtà la sua airiness viene da `.props-section__body { padding: 4px 14px 12px }` (info-improvements.scss:971) — ogni CollapsibleSection in `Info.tsx` ha 14px di horizontal inset attorno al suo content. InfoData non usa CollapsibleSections (rende `.jj-field` flat), quindi senza il 14px horizontal inset il content tocca i bordi del container.

**Valori reali estratti dal Properties panel**:
- `.properties-panel { padding: 0 !important }` (info-improvements.scss:1208) — outer 0
- `.properties-fields { padding: 0 }` (info-improvements.scss:1310) — wrapper 0
- `.props-section { margin-bottom: 2px }` (info-improvements.scss:919) — tra sezioni
- `.props-section__header { padding: 6px 14px }` (info-improvements.scss:928) — header con 14px horiz
- **`.props-section__body { padding: 4px 14px 12px }`** (info-improvements.scss:971) — **questo è il 14px horizontal + 12px bottom che dà l'airiness**
- `.jj-field { margin-bottom: 14px }` (_form-system.scss:950) — spacing tra campi (invariato per entrambi i path)

**Fix**: aggiunta regola scoped in viewapplyto.scss:

```scss
.view-editor-tab-content > section.properties-tab.properties-panel {
  padding: 12px 14px !important;
}
```

Questo matcha `.props-section__body { padding: 4px 14px 12px }` approssimativamente (12px vs 4px top è una differenza intenzionale — `.props-section__body` ha 4px top perché il `.props-section__header` sopra ha il suo padding; InfoData non ha header sopra quindi usa 12px per simmetria). Il valore `14px` horizontal è identico.

**Scope del selettore**: `.view-editor-tab-content > section.properties-tab.properties-panel` targetta SOLO InfoData perché:
- Template (`.template-tab`), Style (`.style-tab`), Events (`.events-tab`), Options (`.options-tab`) rendono root elements differenti con le loro proprie regole di padding interno (24px per Events, 20px per Options, ecc.)
- Solo InfoData rende `<section class="properties-tab properties-panel">` come direct child di `.view-editor-tab-content`

**Specificità cascade**: il selettore ha specificità `(0,3,1)` (1 combinatore child + 3 classi + 1 elemento) vs `(0,1,0)` della regola `.properties-panel { padding: 0 !important }` (info-improvements.scss:1207). Entrambi hanno `!important` → vince la specificità più alta → mio override prevale.

**Non toccato**:
- `.view-editor-tab-content { padding: 0 }` (dal fix precedente) — mantenuto perché gli altri sub-tab hanno già la loro padding interna
- `.jj-field` / `.jj-toggle-row` — invariati, design system shared con Properties
- `InfoData.tsx` — gli InfoTooltip aggiunti indipendentemente dal user non sono impattati

**Differenza prima/dopo**:
| Proprietà | Prima (fix errato) | Dopo (corretto) |
|---|---|---|
| Outer `.view-editor-tab-content` padding | 0 (my previous mistake) | 0 (unchanged) |
| Inner `section.properties-tab.properties-panel` padding | 0 (inherited from `!important`) | **12px 14px** (new scoped rule) |
| Effective content inset | 0px | **12px vertical + 14px horizontal** |

Visualmente: Apply to content ora ha 14px di inset horizontale e 12px di inset verticale, matchando l'airiness del `.props-section__body` di Properties.

## 2026-04-11 — style: fix spacing + add tooltips to Apply to tab
**Prompt**: uniformare padding/margin, aggiungere InfoTooltip a 7 campi
**File toccati**:
- `frontend/src/components/editors/views/nestedView.scss` — `.view-editor-tab-content`: `padding: 0` → `padding: 4px 14px 12px` (valori esatti di `.props-section__body` da `info-improvements.scss:970-972`, che è il wrapper usato da `CollapsibleSection` in Info.tsx per le sezioni GENERAL/FLAGS/TYPE&BOUNDS delle Properties). `.jj-field` resta al baseline `form-system.scss:950` (`margin-bottom: 14px; &:last-child { margin-bottom: 0 }`) — nessun override scoped necessario.
- `frontend/src/components/editors/views/data/InfoData.tsx` — aggiunto `useState` all'import React + copia locale del componente `InfoTooltip` (pattern identico a `Info.tsx:65-76`, non esportato quindi va duplicato per vincolo "non toccare Info.tsx"). Wired in 7 campi (Name, Is Exclusive, Priority, Preferred appearance, Applicable to, Viewpoint, Parent view) — inserito dopo il label text + dentro lo stesso `<label>`/`<div>`/`<span>` del label, così il wrapper flex di `.jj-field-label { display: flex; align-items: center; gap: 4px }` allinea icona "i" alla baseline del label.

**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 47.00s, zero regressioni). Un diagnostic TS `6133` ("useState dichiarato ma non letto") segnalato dall'IDE subito dopo l'aggiunta dell'import era transitorio — risolto automaticamente non appena `InfoTooltip` ha cominciato a usare `useState` nel passo successivo.

**Key insight (Fix 1)**: le classi `.jj-info-icon-wrapper`, `.jj-info-icon`, `.jj-info-tooltip` in `info-improvements.scss:975-1016` sono scoped GLOBALMENTE (non sotto un selettore padre), quindi funzionano anche nel contesto del view editor senza serve un import o una regola aggiuntiva. `.jj-field-label` ha già `display: flex; align-items: center; gap: 4px` da `form-system.scss:955-963` — l'icona "i" si allinea correttamente al testo senza override.

**Key insight (Fix 2)**: il valore giusto di padding per `.view-editor-tab-content` è `4px 14px 12px`, NON `padding: 8px` (come era in pre-regresion) né `padding: 0` (come era subito prima di questo task). Il path diretto delle Properties NON è edge-to-edge — usa `CollapsibleSection` → `.props-section__body` che ha esattamente `padding: 4px 14px 12px`. Replicando quel valore sull'outer container del view editor, i `.jj-field` si allineano visivamente al Properties panel (14px horizontal gutter, 4px top inset, 12px bottom inset) senza bisogno di un `CollapsibleSection` wrapper.

**Note**: 
- `InfoTooltip` duplicato invece che importato perché `Info.tsx:65` lo dichiara come `function` locale (non esportato) — esportarlo richiederebbe toccare Info.tsx, proibito dal vincolo. Il pattern è 12 righe, duplicazione accettabile.
- Pattern InfoTooltip per il toggle "Is Exclusive": inserito il tooltip DENTRO lo `<span className="jj-toggle-row__label">` dopo il testo "Is Exclusive", stesso pattern del componente `PropertiesToggle` in `Info.tsx:93-102` (`<span className="jj-toggle-row__label">{label}{tooltip && <InfoTooltip text={tooltip} />}</span>`). Così il tooltip appare a destra della label ma a sinistra del toggle.
- Regressione verificata: il test precedente con `padding: 0` faceva toccare il content al bordo del pannello slate-50 — asimmetrico rispetto al path Properties. Con `padding: 4px 14px 12px` si torna al comportamento baseline.

## 2026-04-11 — style: align view editor spacing to Properties baseline
**Prompt**: uniformare padding/margin del view editor tab content alla properties-tab
**File toccati**: `frontend/src/components/editors/views/nestedView.scss` (1 regola modificata)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, `vite build` 40.01s)

**Root cause**: `.view-editor-tab-content { padding: 8px }` aggiungeva 8px extra attorno al contenuto di ogni sub-tab (Apply to, Template, Style, Events, Options) rispetto al path diretto delle Properties. Il path diretto non ha un wrapper `.view-editor-tab-content`, quindi il content dei `.jj-field` tocca direttamente i bordi del `.properties-panel-container` che è slate-50.

**Catene DOM confrontate**:
- Properties diretta: `.properties-panel-container (slate-50) → section.properties-tab.properties-panel (padding: 0!) → content`
- View editor: `.properties-panel-container (slate-50) → section.properties-tab.properties-panel (padding: 0 via :has) → .view-editor-root (padding-right: 4px) → .view-editor-tabs → .view-editor-tab-content (padding: 8px ← EXTRA, slate-50) → section.properties-tab.properties-panel (padding: 0!) → content`

**Fix**: `.view-editor-tab-content { padding: 8px }` → `padding: 0`. Il `background-color: rgb(248, 250, 252)` (slate-50) è rimasto perché matcha già `.properties-panel-container { background: #f8fafc }`.

**Non toccato**:
- `.view-editor-root { padding-right: 4px }` — cosmetic asymmetric padding che affetta breadcrumb + tab bar oltre al content, rischio di regressioni non legate al task; lasciato in place
- `.properties-tab { padding: 24px }` (info-improvements.scss:140) — è override completamente dal successivo `.properties-panel { padding: 0px!important }` (info-improvements.scss:1207) quindi il valore effettivo è 0 in entrambi i path; non serve toccarlo
- Rule `:has(.view-editor-root)` in info.scss:425 — ancora utile per vincolare l'outer section quando contiene il view editor; lasciata in place

**Note**: il doppio wrapper `section.properties-tab.properties-panel` (outer dal view-branch di Info.tsx, inner dal rewrite di InfoData.tsx) non causa problemi perché entrambi i livelli hanno `padding: 0 !important`. La spaziatura interna è ora interamente gestita dai `.jj-field { margin-bottom: 14px }` e `.jj-toggle-row { padding: 5px 0 }` ereditati dal design system form (`styles/components/_form-system.scss`).

## 2026-04-11 — style: refactor InfoData.tsx to use jj-* classes from Info.tsx baseline
**Prompt**: sostituire classi form-* con jj-*, adottare pattern Toggle, rimuovere className custom da Input/Select
**File toccati**: `frontend/src/components/editors/views/data/InfoData.tsx` (rewrite: 205 → 200 righe)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, `vite build` 1m11s, zero regressioni)

**Trasformazioni className applicate**:
- `<section className='apply-to-tab'>` → `<section className='properties-tab properties-panel'>`
- `form-field` → `jj-field` (6 istanze: Name, Priority, Preferred appearance, Applicable to, Viewpoint, Parent view)
- `form-field form-field--toggle` + struttura interna → `jj-toggle-row` con `<span className="jj-toggle-row__label">` + `<Toggle size="xs">`
- `form-label` → `jj-field-label` (usa `<div>` per tutti tranne Name che usa `<label>` con `<span className="jj-field-required">*</span>` inline per matchare `builder.class()` in Info.tsx:290-291)
- Rimossa `className="form-input"` da `<Input>` (5 istanze — il componente Input ha già i suoi stili)
- Rimossa `className="form-select"` da `<Select>` (5 istanze — idem)
- **Eliminati** `<div className="toggle-content">`, `<span className="toggle-label">`, `<span className="toggle-description">`, `<button className="apply-to-toggle">`, `<span className="apply-to-toggle-thumb">` — sostituiti dal pattern `jj-toggle-row` + componente `Toggle`

**Pattern Is Exclusive**: inlined il pattern di `PropertiesToggle` (Info.tsx:79-103) invece di usare il componente direttamente, perché `PropertiesToggle` prende `data: LModelElement + field: string` per settare via `(data as any)[field] = checked`, mentre `view.isExclusiveView` è un setter via proxy su LViewElement. Il pattern inline replica la struttura: `handleExclusiveRowClick` (click sulla row salvo se targetta il button role=switch) + `handleExclusiveToggle` (click diretto sul Toggle component).

**Import aggiunto**: `import {Toggle} from '../../../ui'` — verificato che `ui/index.ts:19` esporta `Toggle`, che `Toggle.tsx` accetta `checked/onChange/disabled/size='xs'`, e che Info.tsx usa lo stesso import a riga 32.

**CollapsibleSection non usato**: verificato che `CollapsibleSection` in Info.tsx è una funzione locale NON esportata (`function CollapsibleSection` a riga 37). Per vincolo del task ("non toccare Info.tsx"), ho seguito l'opzione B — raggruppamento senza CollapsibleSection, usando solo le classi `.jj-field` plain. Questo mantiene InfoData in scope minimo. Se si volesse raggruppamento in sezioni (GENERAL / DISPLAY / APPLICABILITY), servirebbe esportare CollapsibleSection da Info.tsx in un task separato.

**Cleanup**: rimosso il `console.log("infodatacomponent", {...})` di debug a riga 34 del file originale. Rimosso anche `classesOptionsJSX` variable inutilizzata (era definita ma mai referenziata).

**Fixes collaterali minor**: cambiato `let` → `const` per `view`, `viewpoints`, `readOnly`, `vp`, `vpid`, `dallVP`, `objectTypes`, `classesOptions`, `isVP`, `isV` (erano tutti assegnati una sola volta). Aggiunto `disabled={readOnly}` al `<Toggle>` per coerenza con il comportamento readOnly degli altri campi.

**Non toccato**:
- `Info.tsx` — baseline, solo lettura (usato per pattern reference)
- `Input`, `Select`, `OclEditor`, `JsEditor` — componenti intatti, stesse props
- `viewapplyto.scss` — gli stili custom `.apply-to-tab`, `.form-field`, `.form-label`, `.form-input`, `.form-select`, `.apply-to-toggle`, `.apply-to-toggle-thumb` sono ora **dead code** ma il file SCSS è lasciato in place (cleanup post-release — rimuoverlo comporterebbe audit di `viewoptions.scss` import che potrebbe cascade). Il file è anche importato dal componente per mantenere la side effect injection di stili legacy usati da altre `section.page-root` (rule a fine file).
- `InfoData.tsx` logica getter/setter/filtro viewpoint — invariata al 100%

## 2026-04-11 — style: restyle aggressivo Apply to tab
**Prompt**: allineare Apply to alla baseline Properties — 9 fix specifici (Name input, Is Exclusive card, Priority, Preferred appearance, Applicable to chip, Viewpoint/Parent view, OCL/JS editor colors, spacing, labels)
**File toccati**: `frontend/src/components/editors/views/data/viewapplyto.scss` (rewrite completo, ~550 righe → ~470 righe)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, `vite build` 41.60s, zero regressioni). **Nessuna modifica TSX** — tutti i fix applicati tramite CSS overrides.

**Fix applicati (9)**:
- **P1 — Name**: input ora 28px height / 12px font / 4px radius / 1px #e2e8f0 border (era 40px/14px/6px) con focus slate (era rgba(71,85,105,...) che sembrava cyan-ish con `var(--color-accent, #475569)` — ora #334155 solid come baseline)
- **P2 — Is Exclusive**: rimossa completamente la "card" attorno — `.form-field--toggle` era `padding: 12px 16px; background: white; border: 1px solid; border-radius: 6px; margin-bottom: 16px` → ora `flex-row; padding: 5px 0; no background; no border; no radius`. La `.toggle-description` ("This view is exclusive to its viewpoint") è `display: none` per matchare le righe FLAGS semplici delle Properties (Abstract, Final, ecc.)
- **P3 — Priority**: stesso trattamento input (28px/12px/4px/slate focus)
- **P4 — Preferred appearance**: select con freccia dropdown slate invece di cyan, stesse dimensioni
- **P5 — Applicable to (react-select)**: `.[class*="-control"]` border da transparent/0px → `1px solid #e2e8f0`, border-radius 4px, focus state `#334155` con shadow slate. Chip tags: `#f1f5f9 bg` + `#e2e8f0 border` + `#1e293b text` (era slate-700 solid, ora più light e leggibile). Chip X da red hover → `#64748b subtle hover`. Indicator caret 12px → slate-400, hover → slate-500
- **P6 — Viewpoint / Parent view**: stessi select generici, nessun teal/cyan, `color: #1e293b` sul text e `background: white` + readonly `#f8fafc/#64748b`
- **P7 — OCL Editor / JS Editor**: `.section-header--collapsible` padding 12px → 8px, `.section-header__left i` color → `#94a3b8` (slate-400), `.section-header__right i` color → `#94a3b8` con hover `#334155`, `.section-title` uppercase 11px #64748b (era già ok)
- **P8 — Spacing**: container padding da `16px` (con margin `8px`) → `8px 12px` con margin `0`. `.form-field` margin-bottom `16px` → `0` con `padding: 5px 0` e `gap: 4px` interno (matches `info-improvements.scss:1084`). Tra sezioni (es. OCL Editor) `.section-header--collapsible` ha `margin-top: 12px`
- **P9 — Labels**: `.form-label` font-weight `500` → `400`, color `var(--color-text-secondary, #334155)` → `#64748b` hardcoded (slate-500 — matches baseline `info-improvements.scss:1111`), font-size `13px` confermato

**Toggle switch**: `.apply-to-toggle` active state era `linear-gradient(135deg, #64748b 0%, #475569 100%)` → ora `#334155` solid (matches `.properties-toggle.active` in `info-improvements.scss:419`). Aggiunto hover:not(.active) `#94a3b8` (come Properties). Focus shadow allineato a `rgba(51, 65, 85, 0.15)`. Dimensioni 36×20 + thumb 16×16 invariate (erano già corrette).

**Dark mode**: completamente riscritto con stessi token slate della baseline (era mix di `var()` con fallback che a volte non matchavano). Il toggle dark ora usa slate-600→slate-400 per inactive→active.

**Non toccato**:
- `InfoData.tsx` — zero modifiche, mantengo la struttura di className esistente
- `info.scss` / `info-improvements.scss` — baseline intatta
- `.apply-to-header` rule — già OK (se mai renderizzata)
- `section.page-root` legacy rule — lasciata per retrocompatibilità con altri percorsi
- Hover state della `.section-header--collapsible` rimosso (era `rgba(0,0,0,0.02)` che non matchava il comportamento hover discreto di Properties)

**Key insight**: la baseline Properties è molto più compatta di quanto Apply to fosse (28px vs 40px inputs, 12px vs 14px font, 4px vs 6px radius, 5px vs 16px row padding). L'aspetto salmon/arancio del Name field era dovuto al mix tra `var(--color-text-primary, #0f172a)` e qualche global style sovrastante con colori warm — risolto forzando `color: #1e293b !important`.

## 2026-04-11 — style: uniformare sub-tab viewpoint editor alla baseline Properties
**Prompt**: allineare stile Apply to/Template/Style/Events/Options al pannello Properties
**File toccati** (solo SCSS, nessun TSX modificato):
- `frontend/src/components/editors/views/data/viewapplyto.scss` — **Apply to**:
  - `.section-title` color da `var(--color-text-tertiary)` → `var(--color-text-secondary)` (baseline)
  - `.form-field [class*="-option--is-selected"]`: rimosso cyan `#0ea5e9` + `rgba(14,165,233,...)` → slate `#334155` + `rgba(51,65,85,...)`
- `frontend/src/components/editors/views/data/palette-data.scss` — **Style**:
  - `.marker-edit-btn:hover color` light mode: `#0ea5e9` → `#334155` (slate-700)
  - `.marker-edit-btn:focus-visible` light mode: shadow da cyan → slate-600, border-color da `#0ea5e9` → `#475569`
  - `.marker-edit-btn:hover color` dark mode: `#0ea5e9` → `#e2e8f0` (slate-200)
  - `.marker-edit-btn:focus-visible` dark mode: shadow da cyan → slate-400, border-color da `#0ea5e9` → `#94a3b8`
  - `.style-section-header .section-title` già allineato (no change)
  - Lasciato `.text i { color: #10b981 }` + gli altri color type icons (number/color/path) — sono type indicator semantici, NON section header
- `frontend/src/components/editors/views/data/events-tab.scss` — **Events**:
  - `.events-section-title` font-size da `13px` → `11px`; letter-spacing allineato a `0.5px`; colore hardcoded `#475569/#1e293b` da variant `--default/--custom` consolidato in `var(--color-text-secondary)` (unificato — niente più distinzione cromatica default vs custom)
  - Icone `.events-section-title i` da `16px` → `14px`
  - `.events-add-btn:hover color`: `#0ea5e9` → `#334155`
  - Empty state già ok (`1px dashed #e2e8f0` — non blu)
- `frontend/src/components/editors/views/data/viewoptions.scss` — **Options**:
  - Rimosse variabili dead code `$color-cyan-500: #06b6d4` + `$color-cyan-600: #0891b2` (dichiarate ma mai usate)
  - Section header già allineato (no change: `font-size: 11px`, `color: $color-text-secondary = #64748b`, uppercase, letter-spacing)
- `frontend/src/components/editors/info.scss` — **Template**:
  - Aggiunta regola scoped `.template-tab .jj-editor-title` per allineare i label "Constants" e "Observed properties" al pattern baseline: `11px` (da 14px), uppercase, letter-spacing 0.5px, color `var(--color-text-secondary)`. La regola è scoped a `.template-tab` per non rompere altri usi di `.jj-editor-title` (es. FunctionComponent in altri contesti) — la regola base in `FunctionComponent.scss` rimane invariata

**Non toccati** (volontariamente):
- `TemplateData.tsx` — inline style su `<HRule style={{paddingTop: '40px!important', display: 'block'}}/>`: segnalato come inline style residuo ma non migrato (sarebbe una regola SCSS per `.template-tab .HRule` che aggiungerebbe accoppiamento; lasciato come micro debt)
- `CustomData.tsx` — inline style `style={{paddingTop: '9px'}}` sul CommandBar: simile, micro debt lasciato in place
- `PaletteData.tsx` — diversi inline styles tramite tinycolor per background dinamici dei color picker: **NON migrabili** in SCSS (calcolati a runtime per colori dinamici)
- `FunctionComponent.scss` — regola base `.jj-editor-title` lasciata invariata (riutilizzo in altri contesti)
- Icon type colors in palette-data.scss (`#10b981 #3b82f6 #f59e0b #8b5cf6` per text/number/path/color) — type indicator semantici, non header; task specificava "NO teal/colori forti per **header sezioni**"
- Toggle switch in viewapplyto.scss (36×20px) vs baseline (40×22px) — lasciato come micro-variazione; entrambi hanno colore slate/bianco corretto, dimensioni leggermente diverse ma visivamente coerenti
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, `vite build` 40.98s — SCSS compilato clean, zero regressioni)
**Note**: **6 cyan violations eliminate** (2 in viewapplyto, 4 in palette-data, 1 in events-tab + 2 variabili dead code in viewoptions). **Section headers unificati** a 11px/uppercase/slate/0.5px letter-spacing su tutti e 5 i tab. **Events tab** era l'unico con section header a 13px — ora allineato. Baseline Properties in `info.scss:509` usa 12px per `.properties-section-title` — leggera divergenza accettata (il task chiedeva 11px per i sub-tab). **No TSX modifiche** — constraint rispettato. **No breaking changes** alle Properties normali (classe/attributo/reference) — le regole modificate sono scoped ai sub-tab.

## 2026-04-11 — fix: batch funzionalità viewpoint (6 fix)
**Prompt**: rimuovi sidebar duplicata editor, key ViewData, ViewpointProperties click, back button, dashboard click, cleanup dead code
**File toccati**:
- `frontend/src/pages/components/Navbar.tsx` — Fix 1: 2 call sites `TabDataMaker.metamodel/model + DockManager.open('models', tab)` → `DockManager.open2(lModel)` (per emettere `EDITOR_TYPE_CHANGE` e nascondere LeftBar). Rimosso import `TabDataMaker` ora inutilizzato.
- `frontend/src/components/project/ProjectEditor.tsx` — Fix 1: 1 call site nel post-transformation handler `TabDataMaker.model(modelToOpen) + DockManager.open(...)` → `DockManager.open2(LModel.fromD(modelToOpen))`. Rimosso import `TabDataMaker` inutilizzato.
- `frontend/src/components/editors/Info.tsx` — Fix 2: aggiunto `key={selectedView.id}` sia su `<ViewpointProperties>` che su `<ViewData>` nel view-branch del Properties panel, forzando il remount quando l'utente seleziona una view/viewpoint diversa nel Tree View (altrimenti i componenti interni catturano il viewID al mount e restano stale).
- `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx` — Fix 3: aggiunto `import './properties.scss'`. Il file SCSS (che definisce `.wp-type-segmented`, `.wp-field`, `.workbench-properties`) era importato SOLO da `WorkbenchProperties.tsx` — ma il mio view-branch in Info.tsx rende `<ViewpointProperties>` direttamente, bypassando WorkbenchProperties, quindi il CSS non veniva mai caricato → segmented control non stilizzato. Self-import risolve.
- `frontend/src/components/abstract/DockManager.tsx` — Fix 5: `openViewpoint()` riscritto. Prima (pre-fix): settava solo `_lastSelected.view`, inefficace se chiamato dalla dashboard (Properties panel CSS-hidden via `body[data-editor-type="summary"]`). Ora: controlla `document.body.getAttribute('data-editor-type')`; se è `'metamodel'` o `'model'` applica solo la selezione; altrimenti chiama `DockManager.open2(firstMetamodel)` per aprire il primo metamodello del progetto (via `LProject.getProject()?.metamodels?.[0]`), poi con `setTimeout(..., 200)` setta `_lastSelected.view` dopo il mount del tab e la propagazione di `EDITOR_TYPE_CHANGE`. Fallback: se non ci sono metamodelli, tenta comunque la selezione con warning.
- **Rimossi** (Fix 6 — dead code, zero importers esterni):
  - `frontend/src/components/editors/ViewpointWorkbench.tsx` (legacy workbench, orfano)
  - `frontend/src/components/editors/ViewpointWorkbench.scss`
  - `frontend/src/components/panels/viewpoint-editor/` — 23 file (ViewpointEditorRoot, ViewpointEditorPanel, EditorFullscreenModal, EditorToolbar, ViewpointEditorBreadcrumb, viewpoint-editor.scss, sections/*, tabs/*). Questi erano stati restaurati ieri da commit `5999f50c6~1` ma il routing era stato successivamente spostato al pannello destro.
**Non toccati** (volontariamente):
- Fix 4 (back button) — la catena `setSelectedView(undefined)` in ViewData → `clearSelection` callback in Info.tsx → `SetRootFieldAction.new('_lastSelected', {view: ''})` era già corretta dai task precedenti, verificata ma non modificata
- Dashboard.tsx — il fix `hideLeftBar` per `'metamodel'` e `'model'` è già in place dal precedente round
- `ViewData.tsx`, `NestedView.tsx`, `InfoData/TemplateData/PaletteData/CustomData/GenericNodeData/ComponentsTab` — tutti intatti
- Commenti "TODO: redirect to panels/viewpoint-editor" in Dashboard.tsx/ProjectEditor.tsx — lasciati come TODO bookmark (no code impact)
- Regola CSS `body[data-editor-type="viewpoint"]` in `abstract/style.scss:1178` — lasciata perché `MyRcDock.tsx:592` può ancora settare `editorType = 'viewpoint'` in alcuni scenari
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, `vite build` 38.44s, zero regressioni)
**Note**: Fix 1 è la scoperta principale — il `hideLeftBar` in Dashboard.tsx era corretto ma 3 call sites bypassavano il meccanismo chiamando `DockManager.open('models', tab)` direttamente invece di `DockManager.open2(lModel)`. Solo `open2` emette l'evento `EDITOR_TYPE_CHANGE`. Fix 2 è il remount pattern classico React per evitare stale state quando l'identità del target cambia ma il componente container rimane lo stesso. Fix 3 era un bug di import SCSS che si manifestava solo nel nuovo rendering path (ViewpointProperties dentro Info.tsx invece che dentro WorkbenchProperties). Fix 4 è stato verificato ma non modificato — già funzionante. Fix 5 sfrutta il body attribute `data-editor-type` che Dock.tsx mantiene in sync via EDITOR_TYPE_CHANGE listener. Fix 6 cleanup: ~1.5MB di codice morto rimosso (inclusi `bootstrapIconCatalog.ts` da 1.3MB). Build time invariato (rc-dock non era già importato da questo path).

## 2026-04-11 — refactor: replace rc-dock DockLayout with simple React tabs in ViewData
**Prompt**: sostituire DockLayout con tab React semplici, eliminare tutti i workaround altezza (ResizeObserver, relative+absolute, :has(), flex 1 1 0, ecc.) — rc-dock è troppo complesso per un semplice tab panel in una sidebar
**File toccati**:
- `frontend/src/components/editors/views/ViewData.tsx` — rewrite completo:
  - Rimossi import `DockLayout`, `LayoutData` da `rc-dock`
  - Rimossi import inutilizzati `PermissionViewTab`, `PermissionViewpointTab` (erano commentati nei tab ma ancora importati)
  - Rimossi `useRef`, `useEffect`, stato `dockHeight`, `rootRef`, e tutto il ResizeObserver code
  - Rimossa costruzione oggetto `layout: LayoutData` + variabile `tabidprefix` + funzione `id()` generatrice di id dock-specific
  - Aggiunto tipo `TabId` (union string literal) e interfaccia `TabDescriptor`
  - Array `tabs: TabDescriptor[]` costruito con spread conditionals (`...(isV ? [{...}] : [])`) per preservare la stessa logica isV/isVP del codice precedente
  - Le `render` closure catturano `view.id`, `readOnly`, `viewpoints` — stesse identiche props dei componenti tab (InfoData riceve `viewID` + `viewpointsID` + `readonly`; TemplateData/PaletteData/EventsData/GenericNodeData/ComponentsTab ricevono `viewID` + `readonly`). Tutte ancora wrappate in `<Try>`.
  - Nuovo stato `const [activeTab, setActiveTab] = useState<TabId>(tabs[0].id)` — default al primo tab (sempre 'apply-to')
  - Fallback `activeDescriptor = tabs.find(t => t.id === activeTab) ?? tabs[0]` gestisce il caso in cui l'utente passi da una view a un viewpoint e il tab corrente non sia più disponibile
  - JSX: `<div className="view-editor-tabs">` contiene `<div className="view-editor-tab-bar">` (con `role="tablist"` + `<button role="tab" aria-selected>`) e `<div className="view-editor-tab-content" role="tabpanel">`. Solo il contenuto del tab attivo è renderizzato (unmount degli altri, evitando memory overhead di editor Monaco non visibili).
- `frontend/src/components/editors/views/nestedView.scss` — aggiunta sezione `VIEW EDITOR TABS` in fondo al file con 4 regole:
  - `.view-editor-tabs { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden }`
  - `.view-editor-tab-bar { display: flex; flex: 0 0 auto; border-bottom; padding: 0 8px; background: var(--color-bg-secondary) }`
  - `.view-editor-tab { padding: 8px 16px; border: none; cursor: pointer; font-size: 12px; color: var(--color-text-secondary); border-bottom: 2px solid transparent; transition; &:hover; &.active { color primary + border-bottom-color accent + font-weight 500 } }`
  - `.view-editor-tab-content { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 8px }`
  - Tutte usano token del design system (`--color-border-primary`, `--color-bg-secondary`, `--color-text-secondary`, `--color-text-primary`, `--color-accent`) verificati in `styles/tokens/_colors-light.scss`
**Non toccati**:
- `InfoData.tsx`, `TemplateData.tsx`, `PaletteData.tsx`, `CustomData.tsx` (EventsData), `GenericNodeData.tsx`, `ComponentsTab.tsx` — nessun cambio, ricevono esattamente le stesse props di prima
- `Info.tsx` — il view-branch non cambia, continua a renderizzare `<ViewData>` dentro `<section.properties-tab.properties-panel>`
- `PropertiesWithTreeView.tsx` — invariato
- `properties-with-tree-view.scss` e `info.scss` — le regole `:has(.view-editor-root)` del fix precedente rimangono in place, ora sono no-op harmless (non c'è più un DockLayout da vincolare) ma non hanno impatto. Se si volesse cleanup, sono in `info.scss:407-414` e `properties-with-tree-view.scss:65-80`.
- `nestedView.scss` linee 2233-2248 — la regola `.view-editor-root .dock-layout` del fix precedente è ora dead code (no match), lasciata in place perché `NestedView.tsx` (file ancora presente ma senza importer) potrebbe teoricamente usarla in futuro
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, `vite build` completato in 37.91s — più veloce del precedente 1m12s perché rc-dock non è più importato da questo modulo)
**Note**: Approccio molto più semplice dei fix precedenti (ResizeObserver + pixel explicit height + :has() + flex 1 1 0 + overflow: hidden chain). rc-dock è pensato per layout dockable complessi dove l'utente può trascinare panels — overkill per un semplice tab container. React tabs con `useState` + `role="tab/tablist/tabpanel"` è più leggero, accessibile, e vincolato naturalmente dal parent via flex sizing (tutto si risolve con `flex: 1 1 auto; min-height: 0; overflow: hidden` sul `.view-editor-tabs` wrapper). Zero workaround. Il ResizeObserver e il pixel height sono spariti — non servono più perché rc-dock non c'è più. Le classi CSS (`view-editor-tabs`, `view-editor-tab-bar`, `view-editor-tab`, `view-editor-tab-content`) sono state verificate con grep: nessuna collisione preesistente.

## 2026-04-10 — fix: constrain DockLayout parent overflow for proper tab behavior
**Prompt**: overflow hidden sulla catena di container per forzare rc-dock a usare tabs (il DockLayout cresceva a 1422px perché `section.properties-tab.properties-panel` aveva `overflow: auto` che lasciava espandere `.view-editor-root`)
**File toccati**:
- `frontend/src/components/editors/properties-with-tree-view.scss` — aggiunta regola `&:has(.view-editor-root)` sotto `.properties-panel-container > .properties-tab, .properties-panel`: quando ViewData è presente, la section diventa `overflow: hidden; min-height: 0; flex: 1 1 0; height: auto; padding: 0`. Il `flex: 1 1 0` forza la section a prendere esattamente lo spazio flex rimanente del parent column (invece di usare `height: 100%` che era ambiguo in flex context). Il `padding: 0` lascia a ViewData il pieno spazio edge-to-edge.
- `frontend/src/components/editors/info.scss` — aggiunta regola simmetrica `&:has(.view-editor-root)` sotto `.properties-panel` (globale, non scoped a container): override di `overflow: auto` → `overflow: hidden` e `padding: 0`. Questa regola è globale perché `.properties-panel` ha un padding default di `var(--space-3)` che va rimosso quando ViewData prende il controllo.
**Non toccati**:
- `ViewData.tsx` — il ResizeObserver ora misurerà l'altezza corretta del root (vincolata dal parent) e `dockHeight` sarà ragionevole
- `PropertiesWithTreeView.tsx` — non serve modificarlo, la soluzione è pura CSS
- `nestedView.scss` — `.view-editor-root` e `.dock-layout` hanno già le regole flex corrette dai fix precedenti
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, vite build completato in 1m1s senza errori SCSS, `:has()` pseudo-class compila correttamente con Sass)
**Note**: **Scope critico**: `:has(.view-editor-root)` è usato per scopare il fix SOLO quando ViewData è presente. Senza questo scope, il cambio da `overflow: auto` a `overflow: hidden` romperebbe lo scroll dei form proprietà normali (quando si seleziona una classe/attributo il form può essere molto lungo e deve scrollare). Con `:has()`, il comportamento di default `overflow: auto` rimane invariato per i form proprietà; solo quando ViewData entra nel DOM il comportamento cambia a `overflow: hidden` + flex sizing.

**Perché `flex: 1 1 0` invece di `height: 100%`**: in flex column parents, `height: 100%` sui children può essere ambiguo — alcuni browser lo trattano come hint, altri come obbligatorio, altri lo ignorano se il parent è in overflow: auto. `flex: 1 1 0` è deterministico: grow=1 (prendi tutto lo spazio libero), shrink=1 (puoi rimpicciolirti), basis=0 (parti da 0). Combinato con `min-height: 0` (bypassa il default `min-height: auto` che altrimenti forzerebbe l'elemento a essere grande almeno quanto il content), la section prende ESATTAMENTE lo spazio flex rimanente.

**Come la catena ora si risolve**: `.properties-panel-container` (height: 100%, flex col, overflow: hidden) → `section` (flex: 1 1 0, min-h: 0, overflow: hidden) → `.view-editor-root` (height: 100% dell'altezza risolta della section, overflow: hidden) → `ResizeObserver` misura l'altezza corretta (~600px invece di 1458px) → `dockHeight` ~564px → rc-dock usa la tab bar invece di stacked rendering.

## 2026-04-10 — fix: DockLayout height via ResizeObserver (pixel measurement)
**Prompt**: dare altezza esplicita al DockLayout, rimuovere pattern relative+absolute (che non aveva funzionato), usare approccio calc() o ResizeObserver
**File toccati**: `frontend/src/components/editors/views/ViewData.tsx`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, zero regressioni)
**Note**: Scelto l'approccio **ResizeObserver** (opzione 3 tra quelle suggerite) invece di `calc(100% - 36px)` o `calc(100vh - 200px)` perché:
1. Più robusto: non dipende dalla catena di altezze CSS (che si era dimostrata fragile con rc-dock)
2. Gestisce automaticamente il resize della finestra e i cambi di layout del pannello destro
3. Più preciso: misura l'header effettivo invece di hardcodare 36px

**Implementazione**:
- Aggiunti hook `useRef`, `useState`, `useEffect` all'import React
- `rootRef` attaccato al `<div className="view-editor-root">`
- `dockHeight` state con default 400px (fallback prima della prima misurazione)
- `useEffect` setup un `ResizeObserver` sul root element. Il callback misura `rootRect.height` e sottrae l'altezza effettiva di `.view-editor-header` (query via `querySelector`, fallback 36px se non trovato). Min-clamp a 100px per evitare valori degenerati.
- Guard `typeof ResizeObserver === 'undefined'` per environment senza l'API (non dovrebbe mai scattare nel browser, ma è safe)
- `setDockHeight(prev => prev === next ? prev : next)` evita re-render non necessari se l'altezza non cambia
- Cleanup: `observer.disconnect()` on unmount
- `<DockLayout>` riceve `style={{ width: '100%', height: dockHeight }}` — pixel esplicito, no percentuali, no flex

**Rimosso**: il wrapper `<div style={{ position: 'relative', flex: '1 1 auto', minHeight: 0 }}>` del fix precedente (non aveva funzionato in pratica nonostante fosse il pattern "corretto" sulla carta).

**Nota di design**: il fix SCSS in `nestedView.scss` (`.view-editor-root .dock-layout { flex: 1 1 auto; min-height: 0; position: relative }`) è tecnicamente ora redundant visto che il pixel height inline wins, ma rimane in place come zero-cost fallback. Se si volesse eliminarlo, è in `nestedView.scss:2233-2246` — cleanup non necessario per questo fix.

## 2026-04-10 — fix: DockLayout explicit sizing via absolute positioning
**Prompt**: wrappare DockLayout in relative+absolute per dare altezza a rc-dock (il precedente fix SCSS su `.dock-layout` non bastava perché rc-dock usa `position: absolute` internamente)
**File toccati**: `frontend/src/components/editors/views/ViewData.tsx`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, zero regressioni)
**Note**: Verificato tramite `node_modules/rc-dock/lib/DockLayout.d.ts:59` che `DockLayout` accetta una prop `style?: React.CSSProperties`. Applicato il pattern "relative wrapper + absolute child":
```tsx
<div style={{ position: 'relative', flex: '1 1 auto', minHeight: 0 }}>
    <DockLayout
        defaultLayout={layout}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
</div>
```
Il wrapper prende l'altezza residua via flex (sotto il `view-editor-header`), il DockLayout si incastra dentro con position absolute. Questo è il pattern standard per dare a rc-dock le dimensioni del parent senza bisogno di pixel espliciti. Il fix SCSS precedente in `nestedView.scss` (flex: 1 1 auto su `.dock-layout`) rimane in place come belt-and-suspenders — non è in conflitto perché la prop `style` sul DockLayout wins via specificity (inline style > SCSS). Default layout (`{dockbox: {mode: 'horizontal', children: []}}`) invariato. ViewData è l'unico file toccato.

## 2026-04-10 — fix: ViewData full width + flex height for DockLayout
**Prompt**: rimuovere max-width cap (450px) quando view selezionata e garantire che `.view-editor-root` > `.dock-layout` (rc-dock) abbia altezza flex corretta
**File toccati**:
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` — **Fix 1 (width)**: aggiunto inline `style={viewSelected ? { maxWidth: 'none' } : undefined}` su `.properties-panel-container`. Sovrascrive il `max-width: 450px` della SCSS solo quando una view/viewpoint è selezionato. Transitorio: quando `_lastSelected.view` si svuota, lo style inline diventa `undefined` e la regola SCSS originale torna in vigore.
- `frontend/src/components/editors/views/nestedView.scss` — **Fix 2 (height)**: `.view-editor-root > .dock-layout` aveva solo `flex-grow: 1` che non basta (flex-basis di default è 0%). Cambiato in `flex: 1 1 auto; min-height: 0; position: relative`. Il `min-height: 0` è cruciale per permettere al flex child di scendere sotto l'altezza del contenuto. Il `position: relative` ancora i wrapper assoluti interni di rc-dock. Anche `.view-editor-header` ora ha `flex: 0 0 auto` esplicito per garantire che non si espanda.
**Non toccati**:
- `ViewData.tsx`, `Info.tsx` — per vincolo del task
- `properties-with-tree-view.scss` — `.properties-panel-container` aveva già `height: 100%; overflow: hidden` (Fix 3 non necessario)
- `.view-editor-root` — aveva già `display: flex; flex-flow: column` (non serviva aggiungerlo)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, `vite build` completato in 1m12s senza errori)
**Note**: Verificato che rc-dock renderizza `<div className="dock-layout">` (non `dock_layout` o altro) grepping `node_modules/rc-dock/lib/DockLayout.js:432`. La catena di altezze ora è: `.properties-panel-container (100%) → section.properties-tab (100%) → .view-editor-root (100% flex col) → .view-editor-header (flex: 0 0 auto) + .dock-layout (flex: 1 1 auto, min-h: 0, pos: relative) → Monaco editors riempiono lo spazio`. La catena di larghezze: `right panel (es. 700px) → .properties-panel-container (full width quando viewSelected) → ViewData`.

## 2026-04-10 — fix: auto-collapse tree when view selected for full-width ViewData
**Prompt**: Tree View si collassa quando `_lastSelected.view` è truthy, ripristina quando falsy (per dare a ViewData/Monaco editors la larghezza piena del pannello destro)
**File toccati**: `frontend/src/components/editors/PropertiesWithTreeView.tsx`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, zero regressioni)
**Note**: Aggiunto `useSelector` per leggere `state._lastSelected?.view` come booleano `viewSelected`. Computato `effectiveTreeVisible = viewSelected ? false : isTreeViewVisible` — override transitoria che NON muta lo stato `isTreeViewVisible` del context (quando l'utente deseleziona la view, la preferenza manuale del tree torna automaticamente). La rendering logic ora:
- Se `viewSelected` → nessun tree renderizzato (nemmeno la barra collapsed da 32px), Properties panel full-width
- Se `!viewSelected && effectiveTreeVisible` → tree panel da 260px
- Se `!viewSelected && !effectiveTreeVisible` → barra collapsed da 32px (preferenza manuale utente)
Aggiunta classe `tree-suppressed` al container quando viewSelected (utile per future regole CSS). Nessuna modifica a `Info.tsx`, `ViewData`, `TreeViewContent` o al context `useTreeViewPanel`. Il diagnostic log offerto nella sessione precedente non era mai stato applicato — nessun cleanup necessario.

## 2026-04-10 — feat: view selection in tree shows editor sub-tabs in Properties
**Prompt**: click view nel Tree View → Properties mostra ViewData sub-tab, click viewpoint → mostra ViewpointProperties, rimuovi tab Viewpoints separato dal pannello destro
**File toccati**:
- `frontend/src/components/editors/Info.tsx` — aggiunto branch di rendering precedente allo switch su `ddata?.className`: se `props.view` è un `DViewElement` → renderizza `<ViewData>`, se è un `DViewPoint` → renderizza `<ViewpointProperties>`. Aggiunti import `DViewElement`, `DViewPoint`, `LProject`, `LViewPoint`, `ViewData`, `ViewpointProperties`. Il branch legge `props.view` (già popolato da `mapStateToProps` da `state._lastSelected?.view`, ma non era mai usato prima)
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` — `SubViewItem.handleClick` e `ViewpointItem.handleClick` ora settano direttamente `_lastSelected.view` via `SetRootFieldAction.new(...)` invece di chiamare `DockManager.openViewpoint()` + dispatch `SELECT_VIEW_IN_WORKBENCH`. Rimossa la logica legacy con `setTimeout`
- `frontend/src/components/abstract/Dock.tsx` — rimosso il tab "Viewpoints" dal pannello destro: `const views = ...` eliminato, `tabs.push(views)` eliminato, import di `NestedView` rimosso. Il commento dead-code è stato ripulito (no "removed comment for removed code" per CLAUDE.md)
- `frontend/src/components/abstract/DockManager.tsx` — `openViewpoint(vp)` riscritto: invece di `dock.updateTab('right-panel-viewpoints', ...)` ora setta `_lastSelected.view = vp.id` via `SetRootFieldAction`. Callers (Dashboard, ProjectEditor, TreeViewContent) non toccati — ricevono lo stesso comportamento API. Aggiunto import di `SetRootFieldAction` dai joiner. **CLAUDE.md**: evitato `require()` nel frontend (restituisce `{}`)
**Non toccati**:
- `ViewData.tsx`, `InfoData.tsx`, `TemplateData.tsx`, `PaletteData.tsx`, `CustomData.tsx` (EventsData), `GenericNodeData.tsx`, `ViewpointProperties.tsx` — tutti già funzionanti
- `NestedView.tsx` — lasciato in place ma senza importer (il tab separato non esiste più, ma il componente potrebbe servire in futuro)
- `panels/viewpoint-editor/` — 23 file restaurati restano in place (cleanup post-release)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, zero regressioni)
**Note**: Discriminazione per tipo implementata in `Info.tsx` tramite `selectedViewClass === DViewPoint.cname` / `DViewElement.cname`. Il branch view/viewpoint precede quello del model element nello stesso `render()`, quindi se un view è selezionato, il rendering del Properties panel lo mostra invece dei campi GENERAL/INHERITANCE/FLAGS. Click su una classe invece resetta `_lastSelected.view=''` (esistente — Clicked handlers del tree già lo fanno) e il branch view non si attiva, ritornando al rendering originale. `setSelectedView` callback di `ViewData` (back button) ora resetta tutto `_lastSelected`.

## 2026-04-10 — feat: riportare viewpoint editing nel pannello destro
**Prompt**: riattivare tab Viewpoints nel pannello destro con sub-tab Apply to/Template/Style/Events/Options (no Permissions) invece di aprire una pagina dedicata via `ViewpointEditorPanel`
**File toccati**:
- `frontend/src/components/abstract/Dock.tsx` — assegnato id stabile `'right-panel-viewpoints'` al tab Viewpoints (era generato via `id()`, non targhettabile)
- `frontend/src/components/abstract/DockManager.tsx` — `openViewpoint()` riscritto: ora chiama `dock.updateTab('right-panel-viewpoints', null, true)` per attivare il tab nel pannello destro invece di creare un tab dock dedicato. Parametro `vp` mantenuto per compatibilità API ma prefissato `_vp` (unused)
- `frontend/src/components/abstract/tabs/TabDataMaker.tsx` — rimosso metodo `viewpoint()` e import di `ViewpointEditorPanel`, `DockManager`, `LPointerTargetable`, `LViewPoint`, `DViewPoint`. Lasciato comment esplicativo
**Non toccati**:
- `src/components/panels/viewpoint-editor/` — 23 file restaurati ieri restano in place (cleanup post-release per task Phase 5)
- `src/components/editors/ViewpointWorkbench.tsx` — legacy, già orfano di importer
- `src/components/editors/views/ViewData.tsx` — le sub-tab Permissions erano già commentate fuori dal codice (non serviva toccarle)
- `src/components/editors/views/NestedView.tsx` — già funzionante, renderizza il tree nel tab "Viewpoints" del pannello destro
- `lastViewpoint.ts` — dispatch `VIEW_CREATED` restaurato ieri resta in place (non rompe nulla con il nuovo flusso)
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, zero regressioni)
**Note**: Contesto — l'infrastruttura del tab "Viewpoints" nel pannello destro era già completa e funzionante (`Dock.tsx:329` lo pushava sempre nel tabs array, `NestedView` + `ViewData` + sub-tab `InfoData`/`TemplateData`/`PaletteData`/`EventsData`/`GenericNodeData`/`ComponentsTab` tutti funzionanti). L'unico problema era il routing di `DockManager.openViewpoint()` che, dopo il restore di ieri, apriva `ViewpointEditorPanel` come tab dedicato. Fix minimale: 3 file modificati, nessun componente nuovo, nessun file rimosso. Callers di `DockManager.openViewpoint()` (Dashboard, ProjectEditor, TreeViewContent) sono invariati — ricevono lo stesso comportamento a livello API ma ora attivano il tab del pannello destro.

## 2026-04-10 — feat: ripristino ViewpointEditor redesign da git
**Prompt**: ripristinare 23 file da commit `5999f50c6~1` (parent del cleanup V3), ricablare routing in `TabDataMaker` per usare il nuovo `ViewpointEditorPanel` invece del vecchio `ViewpointWorkbench`
**File toccati**:
- **Ripristinati** (23 file) da `5999f50c6~1` via `git checkout`:
  - `src/components/panels/viewpoint-editor/ViewpointEditorRoot.tsx` (411 righe)
  - `src/components/panels/viewpoint-editor/ViewpointEditorPanel.tsx` (170 righe, wrapper esterno)
  - `ViewpointEditorBreadcrumb.tsx`, `EditorToolbar.tsx`, `EditorFullscreenModal.tsx`, `viewpoint-editor.scss`
  - `sections/`: BehaviorSection, CollapsibleSection, ConstantsSection, EdgeSection, EventsSection, ObservedPropsSection, ViewConfiguration, ViewProperties
  - `tabs/`: ColorPickerPopover, CssVariablesEditor, PathEditorModal, PathPresetsPopover, PredicateTab, StyleTab, TemplateTab, bootstrapIconCatalog, pathPresets
- **Modificati**:
  - `src/events/registry.ts` — aggiunto `JjodelEvents.VIEW_CREATED: 'jjodel:viewCreated'` (re-introdotto dopo la rimozione del 2026-04-06; è necessario al ViewpointEditorPanel per refresh della tree quando una view viene creata dal context menu del canvas)
  - `src/components/panels/viewpoint-editor/ViewpointEditorPanel.tsx` — 2 stringhe hardcoded → costanti registry (`JjodelEvents.VIEW_CREATED`, `JjodelEvents.CANVAS_ELEMENT_SELECTED`)
  - `src/utils/lastViewpoint.ts` — restaurato dispatch di `VIEW_CREATED` dopo `createViewInWorkbench()` (era stato rimosso nel cleanup V3 ma serviva al panel per refresh automatico)
  - `src/components/abstract/tabs/TabDataMaker.tsx` — routing viewpoint: import `ViewpointEditorPanel` invece di `ViewpointWorkbench`, `TabDataMaker.viewpoint()` ora risolve `vp.id` → `LViewPoint` via `LPointerTargetable.fromPointer()` e passa l'istanza + callback `onClose={() => DockManager.closeTab(tabId)}` (la breadcrumb back-arrow chiude il tab invece che fare un no-op)
**Non toccati**:
- `src/components/editors/ViewpointWorkbench.tsx` — lasciato in place per reference, ma senza nessun importer (verrà rimosso in cleanup separato post-release)
- Grammatica/struttura dei file ripristinati — solo fix di: stringhe evento → registry constants
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati, 491 test passing, zero regressioni)
**Note**: 23 file ripristinati, 2 stringhe evento migrate a registry, 1 evento re-introdotto nel registry (VIEW_CREATED), 1 dispatch site restaurato in lastViewpoint.ts, routing TabDataMaker aggiornato. Nessun fix di token CSS legacy necessario (grep `--accent|--bg-[1-5]|--secondary|--terziary|--radius|var(--color)` in `panels/viewpoint-editor/` → zero match: i file erano già puliti al momento della rimozione).

## 2026-04-10 — fix: rimuovi struttura progetto duplicata dalla sidebar model editor
**Prompt**: rimuovere sezioni Structure/Behaviour/Other dalla sidebar sinistra dell'editor modello
**File toccati**: `frontend/src/pages/components/Dashboard.tsx`
**Esito**: ✅ build ok (80 errori TS pre-esistenti invariati)
**Note**: La sidebar `LeftBar` (che contiene le sezioni Structure/Behaviour/Other col nome progetto, Metamodels, Models, Transforms, Viewpoints, Docs) era già nascosta quando l'editor metamodello era attivo (fix 2026-04-06). Il task chiedeva lo stesso comportamento per il model editor. Fix: esteso `ProjectDashboard.useEffect` handlers — il predicato `hideLeftBar` ora usa `isEditorTab(editorType)` che accetta sia `'metamodel'` che `'model'`. Nessuna rimozione di componenti/JSX — solo estensione del predicato esistente. `LeftBar` invariata (serve ancora per la dashboard progetto).

## 2026-04-10 — fix: 5 bug release testing sezione B (tree select, conformsTo, context menu, File tab, slots)
**Prompt**: fix tree view selection per istanze modello, mostra conformsTo nella property panel del modello, fix posizione context menu del flow editor, fix highlight File tab nel menu, sblocca inline editing slot per istanze M1.
**File toccati**:
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` — Bug A: `InstanceItem.handleClick` ora dispatcha `SetRootFieldAction.new('_lastSelected', { node: '', view: '', modelElement: instance.objectId })` PRIMA di dispatchare `SELECT_NODE`. Prima, il click su un'istanza nel tree view aggiornava solo la selezione su React Flow (via custom event), ma il pannello Properties (`Info.tsx`) legge `state._lastSelected?.modelElement` → non si aggiornava. Aggiunto anche `instance.objectId` alla deps di `useCallback`.
- `frontend/src/components/editors/Info.tsx` — Bug B: aggiunto banner "Conforms to" in `builder.model()` quando `!l.isMetamodel` e `l.instanceof` esiste. Riusa lo stesso markup usato in `builder.object()`: `<div className="jj-conformance-bar"><span className="jj-conformance-dot" /> Conforms to <strong>{metamodel.name}</strong></div>`. Zero CSS aggiunto — classi già esistenti.
- `frontend/src/components/editor-v2/EditorV2.tsx` — Bug C: wrap del `<ContextMenu>` con `createPortal(..., document.body)` (import già presente). `position: fixed` falliva perché il tab rc-dock applicava transform ancestor che rompeva il containing block. Portal al body → coord viewport assoluti → menu al click point anche con zoom/pan canvas attivo.
- `frontend/src/pages/components/navbar.scss` — Bug D: in `.nav-hamburger:hover span.menu-title` cambiato `background-color: var(--color-text-tertiary)` → `var(--color-bg-hover)`. La regola usava un token di text color (`slate-600` in light) come background — incongruente con la regola sibling `.nav-container span.menu-title:hover` che usava già `--color-bg-hover`. Specificità identica (0,3,1), quindi vinceva la regola later-in-file → tutti i menu tab avevano hover sbagliato.
- `frontend/src/components/editor-v2/EditorV2.scss` — Bug E: rimosso `pointer-events: none` da `.mm-object__feature--placeholder`. Il CSS bloccava i click sugli slot placeholder (attributi del metaclass non ancora valorizzati), anche se `ObjectNode.tsx:510-519` ha `onDoubleClick`/`onClick` che setta `editingFeature` per abilitare l'inline editing. Sostituito con commento che spiega la dipendenza dai handler in JSX. Note: l'inline editing degli slot _esiste già_ (vedi `startEditFeature`/`commitFeatureEdit`/`syncUpdateFeatureValue`) — era solo il CSS che lo disabilitava per i placeholder.
**Esito**: ✅ build ok, 491 test passing (nessuna regressione — stessi 8 file pre-fallenti per `window is not defined` in `PerformanceMetrics.ts`)
**Note**: Bug E non era "by design" — tutta la pipeline di inline editing (startEditFeature → commitFeatureEdit → syncUpdateFeatureValue via proxy `$attr.value =`) era implementata. Il solo ostacolo era il `pointer-events: none` sulla classe placeholder, che veniva applicata quando `!isEditingThis` → impossibile uscire dallo stato placeholder via click. Gli slot con valori esistenti (non-placeholder) funzionavano già. Bug C fix è minimal e robusto: portalizza solo il ContextMenu, lascia tutto il resto invariato.

## 2026-04-10 — fix: 3 bug release testing (infinite loop, bottom drawer, enum icon)
**Prompt**: fix ErrorDisplay forwardRef (infinite loop xyflow), rimuovi bottom property drawer, allinea icona enum
**File toccati**:
- `frontend/src/common/ErrorPortal.tsx` — Bug A: wrap `ErrorDisplay` con `React.forwardRef<HTMLDivElement, ErrorDisplayProps>`, attach ref al div `.error-badge-slick` root, add `displayName`. Fix del re-render loop infinito quando Measurable cloneElement tentava di passare ref a function component senza forwardRef.
- `frontend/src/components/editor-v2/EditorV2.tsx` — Bug B: rimossi import `BottomDrawer` + `ElementPropertiesDrawer`, state `bottomDrawerOpen`/`bottomDrawerElementName`, callback `openBottomDrawer`/`closeBottomDrawer`, `onNodeDoubleClick` handler, voce "Properties" dal context menu, JSX `<BottomDrawer>` render block, prop `onNodeDoubleClick` dal ReactFlow. Componenti `BottomDrawer.tsx` e `ElementPropertiesDrawer.tsx` NON toccati (potrebbero servire altrove).
- `frontend/src/components/editor-v2/EditorV2.scss` — Bug C: aggiunto `.mm-enum .mm-node__header { justify-content: flex-start; }` per allineare l'icona enum a sinistra (override del base `justify-content: center` che centrava icon+name come gruppo spostando visivamente il testo).
**Esito**: ✅ build ok — 0 nuovi errori TS (80 pre-esistenti invariati), 491 test passing (nessuna regressione)
**Note**: Bug A root cause confermata — `MeasurableComponent.render()` a line 426 fa `React.cloneElement(child, {ref: ...})` che non funziona su function components senza `forwardRef`. Il ref fallito causava re-misure continue da xyflow → `setNodes` → re-render loop. Bug B: anche se il task diceva di rimuovere solo il render, ho rimosso anche state/callbacks/import per evitare dead code + warning TypeScript. Bug C: fix minimale — solo override CSS in `.mm-enum`, `<i>` e struttura JSX invariati.

## 2026-04-09 — feat: JjScript test suite
**Prompt**: Creare test suite completa per tutti i comandi JjScript (0 test esistenti su ~19 comandi)
**File creati**:
- `frontend/src/jjscript/__tests__/lexer.test.ts` — 36 test: tokenizzazione comandi, keyword, identifier, qualified names, literals, multiplicity, operatori, commenti, edge cases
- `frontend/src/jjscript/__tests__/grammar.test.ts` — 54 test: parseQualifiedName, parseMultiplicity, parseTypeReference, parseLiteralValue, isValidIdentifier, suggestCorrection, tutti gli helper di formattazione
- `frontend/src/jjscript/__tests__/parser.test.ts` — 66 test: parsing di tutti i 19 comandi (create, delete, rename, set, add, remove, move, copy, list, show, help, undo, redo, clear, validate, extends, eval, let, forall, abstract, do...end block), error handling, JjEL delegation
- `frontend/src/jjscript/__tests__/commands.test.ts` — 39 test: executeHelp (general + tutti i topic), executeUndo/executeRedo (happy path, multi-step, error, roundtrip), executeClear (history, console, selection, all)
**Esito**: ✅ 195 test passing, 0 skipped
**Note**: 19 comandi inventariati. Test coprono: lexer (tokenizzazione), grammar (utility pure), parser (input→AST per tutti i comandi), 3 executor comandi puri (help, undo/redo, clear). I restanti 16 comandi (create, delete, rename, set, add, remove, move, copy, list, show, validate, extends, abstract, eval, let, forall) richiedono Redux store + Jjodel framework — testati a livello parser (AST output) ma non executor (necessita `jsdom` + mock store). Framework: vitest 4.1.1 (pre-esistente).

## 2026-04-09 — refactor: event registry — migrate post-migration stragglers
**Prompt**: Completare migrazione event registry: 3 eventi aggiunti dopo la migrazione originale (2026-04-06) non usavano il registry centralizzato.
**File creato/modificato**:
- `frontend/src/events/registry.ts` — aggiunto `EnvGenEvents` (2 costanti) + `AvatarEvents` (1 costante) + type helpers
- `frontend/src/pages/components/Navbar.tsx` — `'envgen-open-wizard'` → `EnvGenEvents.OPEN_WIZARD`
- `frontend/src/components/envgen/services/EnvGenPersistence.ts` — rimossi `CHANGE_EVENT`, `ENVGEN_CHANGE_EVENT`, `ENVGEN_OPEN_WIZARD_EVENT` locali → `EnvGenEvents.*`
- `frontend/src/components/envgen/index.ts` — rimosso re-export costanti evento (ora in registry)
- `frontend/src/components/project/ProjectEditor.tsx` — `ENVGEN_CHANGE_EVENT`/`ENVGEN_OPEN_WIZARD_EVENT` → `EnvGenEvents.*`
- `frontend/src/hooks/useAvatar.ts` — `AVATAR_CHANGE_EVENT` locale → `AvatarEvents.CONFIG_CHANGE`
**Esito**: ✅ build ok, 0 stringhe hardcoded residue
**Note**: 3 eventi trovati, 6 file modificati, 0 eventi dinamici non migrabili. Registry ora a 40 costanti in 7 gruppi.

## 2026-04-06 — fix: Pulizia header dashboard progetto

**Prompt**: Migliorare l'header della dashboard: descrizione duplicata, matita sempre visibile, "View Megamodel" fuori posto, "+ Tags" stile tratteggiato incongruente.
**Modifiche**:
- **Descrizione**: textarea non si apre automaticamente — stato iniziale solo testo statico. Placeholder cliccabile "Add a description..." quando vuota. Icona matita visibile solo su hover della riga descrizione (via `__desc-row:hover .edit-btn--inline`). Rimosso "Created by" dalla row2 per pulizia.
- **View Megamodel**: Rimosso dall'header, spostato nella sezione METAMODELS come primo bottone (ghost btn--xs) prima di Import e + New. SectionHeader ora rende `children` prima di secondary/primary actions.
- **+ Tags**: Rimosso bordo tratteggiato, ora usa `btn btn--ghost btn--xs` con icona `bi-tag` come gli altri bottoni secondari.
- **SCSS**: Aggiunto `__desc-row` (inline-flex, pencil opacity 0 → 0.5 on hover), `__desc-placeholder` (italic grigio, cliccabile), rimosso `opacity: 0.5` da `edit-btn--inline` (ora controllato dal parent), `__desc-editor` non più absolute.
- **Import rimosso**: `Button` component non più importato (era usato solo per View Megamodel).
**File modificati**: `ProjectEditor.tsx`, `project-editor.scss`

## 2026-04-06 — fix: Nascondi sidebar navigazione progetto nell'editor metamodello (v2)

**Prompt**: La sidebar LeftBar (navigazione progetto) restava visibile accanto alla palette editor quando un metamodello era aperto. Rimuoverla SOLO nell'editor di metamodello.
**Root cause**: Il meccanismo originale si basava solo su `ACTIVE_TAB` con `tabType` estratto da `(activeTab.title).props['data-type']`. Questo falliva perché rc-dock non preserva i props dei React element nel callback `onLayoutChange`, producendo `tabType: null` → `hideLeftBar` restava `false`.
**Fix**: In `Dashboard.tsx`, `ProjectDashboard` ora ascolta DUE eventi:
1. `EDITOR_TYPE_CHANGE` — emesso da `DockManager.open2()` all'apertura di un nuovo tab. Registra `{activeId → editorType}` in un `useRef<Map>` locale e setta `hideLeftBar` immediatamente.
2. `ACTIVE_TAB` — emesso da `Dock.tsx` su ogni switch di tab. Risolve il tipo usando prima il `tabType` dall'evento, poi la mappa locale come fallback.
**Impatto**: Solo `Dashboard.tsx` modificato. LeftBar nascosta solo per `metamodel`, visibile per `model`, `viewpoint`, `project_summary` e tutti gli altri tab.
**File modificati**: `frontend/src/pages/components/Dashboard.tsx`

## 2026-04-06 — fix: Header dashboard centrato e restyling

**Prompt**: L'header della dashboard (titolo, badge versione, metadata) non era allineato al contenuto centrato. Richiesto restyling più pulito.
**Modifiche**:
- **TSX**: Spostato `project-header-compact` da fuori `project-editor__body` a dentro `project-editor__main` (stesso container centrato max-width 900px)
- **TSX**: Badge versione/Rev sostituiti da `<span class="__version">` più sobri (erano Badge component)
- **SCSS**: Titolo 20px → 24px, colore `var(--color-text-primary)`; input editing allineato
- **SCSS**: Aggiunto `&__version` — 12px, `var(--color-text-secondary)`, font-weight 500
- **SCSS**: Row2 metadata — 12px, `var(--color-text-secondary)`, opacity 0.6, margin-top 6px
- **SCSS**: Header — padding-top 24px, border-bottom con `var(--color-border-primary)`, margin-bottom 24px
**File modificati**: `ProjectEditor.tsx`, `project-editor.scss`

## 2026-04-06 — fix: Centro orizzontale contenuto dashboard
**Prompt**: Il contenuto della dashboard progetto era allineato a sinistra anziché centrato.
**Fix**: Aggiunto `margin-left: auto; margin-right: auto` a `.project-editor__main` in `project-editor.scss`. Il `max-width: 900px` era già presente — mancava solo il margin auto per centrare il blocco nell'area disponibile.
**File modificati**: `frontend/src/components/project/project-editor.scss`

## 2026-04-06 — chore: Rimozione dipendenze inutilizzate
**Prompt**: Verifica e rimozione delle dipendenze con zero import nel codebase.
**Pacchetti rimossi** (4):
- `react-itertools@0.0.6` — zero imports
- `nearley-unparse@1.0.1` — zero imports
- `react-scripts@4.0.3` — legacy CRA, progetto migrato a Vite; solo riferimento in `react-app-env.d.ts` (rimosso)
- `webpack-cli@4.9.1` — zero riferimenti in source e config attivi
**Pacchetti tenuti**:
- `path-data-polyfill` — usato in `joiner/index.ts` via `require()`
- `xml-formatter` — usato in `common/libraries/prj_xml2json.js`
- `jquery` + `jqueryui` — usati in 7+ file (Vertex.tsx, MyRcDock.tsx, index.tsx, ecc.)
**File modificati**: `src/react-app-env.d.ts` (rimosso `/// <reference types='react-scripts' />`)
**node_modules**: 757MB → 531MB (−226MB, −30%), 1604 pacchetti rimossi
**Esito**: build ok

## 2026-04-06 — refactor: Event registry centralizzato
**Prompt**: Creare `src/events/registry.ts` con tutti i custom DOM events come costanti tipizzate, sostituire stringhe hardcoded.
**File creato**: `frontend/src/events/registry.ts` — 5 gruppi (`JjodelEvents`, `JjScriptEvents`, `AIEvents`, `JjodieEvents`, `SystemEvents`), 37 costanti evento, 5 type helpers
**File modificati** (44):
- Dock/DockManager/MyRcDock (3 file) — `jjodel:editor-type-change`, `layout-mode-change`, `active-tab`
- TreeViewContent/TreeViewSidebar (2 file) — `selectNode`, `openMegamodel`, `openTransformation`, `transformations`, `treeview:scroll-to-element`, `selectViewInWorkbench`, `toggle-tree-view`
- EditorV2/Toolbar/ClassNode/useJjomSelection/useClassRemoval (5 file) — `child-context-menu`, `toggle-singletons`, `selectNode`, `open-polymetric`, `help-open`, `explain-open`, `layout-mode-change`, `canvas-element-selected`, `toast`
- Navbar/StatusBar/StatusBarRightZone (3 file) — `active-tab`, `toggle-tree-view`, `toggle-singletons`, `layout-mode-change`, `new-project`, `export-canvas`, `open-polymetric`, `transformations`, `jjtl-statusbar`, `ai-provider-changed`
- ProjectEditor (1 file) — `jjtl-execution-result`, `openTransformation`, `openMegamodel`, `transformations`
- Toast/toastDispatch (2 file) — `toast`, `toast-prefs-changed`, `guard-violation`
- Services: ThemeService, JjodieActionExecutor, PromptService, ActivityLogger (4 file) — `theme-changed`, `jjodie:metamodel-updated`, `prompt-changed`, `activity-logged`
- Contexts: TreeViewPanelContext, FeaturesPanelContext (2 file) — 8 jjscript events + `editor-type-change`, `treeview:scroll-to-element`
- Hooks: useInterfaceMode, usePrompt (2 file) — `interfaceModeChange`, `prompt-changed`
- Jodie/JodieWindow/JjodieWidget (3 file) — `jodie:open`, `ai-settings-changed`, `jjscript:executed/executing/execution-end`
- ScriptBlock (1 file) — 14 jjscript event occurrences
- useMetamodelGeneration (1 file) — `jjscript:executing`, `jjscript:execution-end`
- JjtlDevelopmentEnv (1 file) — `jjtl-execution-result`, `jjtl-statusbar`
- Other: ExplainModal, HelpDrawer, HelpButton, MetamodelTab, ContextMenu, MegamodelGraph-toDelete, PolymetricView, AllProjects, Dashboard, AIAssistantSettings, AppearanceSettings, PropertiesWithTreeView, ViewpointWorkbench, ConformanceGuard, types/jodie.ts (15 file)
**Stringhe sostituite**: ~130 occorrenze
**Residui hardcoded**: 0 (esclusi registry.ts, commenti, non-event class names, shortcut labels)
**Esito**: build ok

## 2026-04-06 — refactor: Rimozione editor V3 (viewpoint-editor panel)
**Prompt**: Rimozione sicura dell'editor V3 (panels/viewpoint-editor/) — mappatura dipendenze, pulizia 5 file esterni, build, rm -rf directory.
**File rimossi**: `frontend/src/components/panels/viewpoint-editor/` (23 file, ~1.5MB incl. bootstrapIconCatalog.ts da 1.3MB)
**File modificati**:
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` — rimosso import ViewpointEditorPanel, state sidebarMode, event listeners (openViewpointEditor, closeViewpointEditor), render condizionale V3
- `frontend/src/components/editor-v2/Toolbar.tsx` — rimosso vpEditorState, listener jjodel:viewpoint-editor-state, back button + badge JSX
- `frontend/src/components/project/ProjectEditor.tsx` — handleOpenViewpoint e handleCreateViewpoint ora usano DockManager.openViewpoint() diretto + TODO comment
- `frontend/src/pages/components/Dashboard.tsx` — viewpoint click e Open button ora usano DockManager.openViewpoint() diretto + TODO comment
- `frontend/src/utils/lastViewpoint.ts` — rimosso dispatch jjodel:viewCreated (consumato solo da V3)
**Non toccati**: `components/abstract/DockLayout.tsx` (riferimenti V3 già commentati), `components/editors/viewpoint/` (vecchio workbench — ora unico editor viewpoint), `components/editor-v2/viewpoint/ViewpointRenderer.tsx` (utility V2)
**Custom events rimossi**: jjodel:openViewpointEditor, jjodel:viewpoint-editor-state, jjodel:closeViewpointEditor, jjodel:viewCreated
**Esito**: build ok

## 2026-04-05 — audit: Git history analysis (pre vs post Natale 2025)
**Prompt**: Confronto stato codebase prima del 24 dicembre 2025 vs oggi. Volume cambiamenti, snapshot temporali, feature introdotte, aree cresciute, file eliminati.
**File toccati**: `docs/git-analysis-2026-04-05.md` (nuovo)
**Esito**: completato
**Metriche chiave**:
- 301 commit in ~100 giorni (3/giorno), 76% Alfonso, 22% Damiano
- Codebase 3.6× più grande: 303→959 file, 78K→281K LOC (+262%)
- 3 linguaggi DSL creati da zero (JjTL 26K, JjScript 20K, JjEL 6.5K LOC)
- Editor riscritto 2 volte (v2 + v3), AI system interamente nuovo (8 provider + RAG)
- Solo 1 file eliminato — crescita quasi esclusivamente additiva
- Punto di svolta: gennaio 2026 (101 commit, codebase raddoppiato)

## 2026-04-05 — audit: Censimento completo codebase
**Prompt**: Audit completo del codebase Jjodel — struttura directory, inventario componenti React, model layer, JjTL/JjEL/JjScript, AI/Jjodie, styling, dipendenze, TypeScript health, custom events, TODO/bug, metriche sintetiche, red flags.
**File toccati**: `docs/audit-2026-04-05.md` (nuovo)
**Esito**: completato
**Metriche chiave**:
- 400 .tsx + 376 .ts + 183 .scss = ~281K LOC
- 307 componenti React, 42+ custom DOM events
- 3,672 istanze any/as any/@ts-ignore (strict mode attivo)
- 55 dipendenze runtime (5 probabilmente inutilizzate)
- JjTL: 11 test files, JjEL: 2, JjScript: 0
- 8 AI providers supportati, RAG system con IndexedDB
**Red flags**: build system ibrido (react-scripts+Vite), ~600 inline styles, 50+ classi SCSS duplicate, JjScript senza test, jQuery residuo

## 2026-04-04 — feat: AllProjects page redesign
**Prompt**: redesign visivo AllProjects — sidebar light, card accent bar, activity feed grouping, load more, cyan accents
**File toccati**: `frontend/src/pages/dashboard.scss`, `frontend/src/pages/components/LeftBar.tsx`, `frontend/src/pages/components/project-card.scss`, `frontend/src/pages/components/Project.tsx`, `frontend/src/pages/components/catalog/Catalog.tsx`, `frontend/src/pages/components/catalog/catalog.scss`, `frontend/src/pages/components/RightPanel/RightPanel.tsx`, `frontend/src/pages/components/RightPanel/RightPanel.scss`
**Esito**: ✅ completato
**Note**:
- Sidebar active item: cyan text + icon with subtle border (was slate bg)
- Recently Modified: added colored dots (amber for favorites) + relative timestamps (now/3h/2d/1w)
- Project cards: accent bar moved from left-side to top, colored by type (cyan=public, amber=collab/favorite, neutral=private); version badge de-emphasized from green to neutral slate; actions hidden by default, visible on hover
- Tab bar: replaced segmented-control style with underline tabs, active = cyan border-bottom
- Activity feed: already well-implemented with time grouping, colored dots, load more — no changes needed
- Slider pagination: replaced dot carousel with progressive grid + "Load More" button (same pattern as list view)
- Modified Today stat: cyan highlight background (#e0f2fe) on overview grid cell
**Nome del documento prompt**: 2026-04-04 11:30 allprojects-redesign.md

## 2026-03-26 — Fix: `do...end` block executes only the first command

**Prompt**: In a `do...end` block, only the first command is executed. Subsequent commands are ignored.
**File toccati**: `frontend/src/jjscript/types.ts`, `frontend/src/jjscript/parser/parser.ts`, `frontend/src/jjscript/executor/executor.ts`, `frontend/src/jjscript/executor/commands/forall.ts`, `frontend/src/jjscript/executor/commands/let.ts`, `frontend/src/jjscript/executor/dependencies.ts`, `frontend/src/jjscript/components/ScriptExecutionWindow.tsx`
**Esito**: ✅ completato

**Root cause (3 layers)**:
1. **Parser**: No concept of `do...end` blocks. `parseCommand()` returned a single `CommandNode`. After `do` in forall/let, only one command was parsed.
2. **Executor**: No `'block'` command type existed. Even if multiple commands were parsed, there was no way to execute them sequentially.
3. **Script pipeline**: Both `executeScript()` and `ScriptExecutionWindow` split input by newlines, so multiline `do...end` blocks were broken into individual lines.

**Fix**:
1. Added `BlockArgs` type with `commands: CommandNode[]` and `'block'` to `CommandType`
2. Added `parseBlockBody()` (parses commands until `end`), `parseBlockOrCommand()` (detects block vs single command via `hasEndAhead()`), and standalone `do` handling in `parseCommand()`
3. Updated `parseForAllCommand()` and `parseLetCommand()` to use `parseBlockOrCommand()` for body parsing
4. Added `executeBlock()` method in executor — iterates all commands, stops on first error
5. Updated `resolveVariableInBody()` in forall and `resolveVariablesInBody()` in let to handle block nodes recursively
6. Added `groupBlockCommands()` utility to aggregate multiline `do...end` blocks before batch execution
7. Updated `ScriptExecutionWindow` line parser to group `do...end` blocks into single logical lines
8. Updated `extractDependencies()` to handle block nodes

**Design decisions**:
- `do` and `end` are NOT added to COMMANDS/KEYWORDS — they're recognized contextually by the parser (as IDENTIFIER tokens matched via `checkKeyword()`)
- Single-command forall/let (no `end`) remains backward compatible — `parseBlockOrCommand()` falls back to `parseCommand()` when no `end` is found ahead
- Block execution stops on first error (fail-fast semantics)

---

## 2026-03-26 — Fix: `abstract Person` still gives "Unknown command: abstract" after initial fix

**Prompt**: Previous session added all the pieces (types, executor, parser special case) but `abstract Person` still fails.
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ✅ completato

**Root cause**:
`abstract` is in BOTH `COMMANDS` and `KEYWORDS` arrays. The lexer checks `COMMANDS` first (lexer.ts:371), so it tokenizes `abstract` as `COMMAND` type. But the parser's special-case check (line 139) only matched `IDENTIFIER` or `KEYWORD` — **not `COMMAND`**. So the special case was skipped, and `abstract` fell through to the main switch statement which had no `case 'abstract'`, hitting `default: throw new Error('Unknown command: abstract')`.

**Fix**:
1. Added `token.type === 'COMMAND'` to the special-case condition for abstract toggle
2. Added `case 'abstract'` to the switch as a safety fallback (handles edge case where abstract reaches the switch)

**Lesson**: When a word appears in multiple token-type lists (`COMMANDS` + `KEYWORDS`), the lexer picks the first match. Parser special cases must account for all possible token types.

---

## 2026-03-26 — Fix: `abstract Person` command returns SUCCESS but has no effect (initial fix)

**Prompt**: `abstract Person` in JjScript Console returns SUCCESS + null, but the class doesn't become abstract. The toggle in Properties panel stays off.
**File toccati**: `frontend/src/jjscript/types.ts`, `frontend/src/jjscript/parser/parser.ts`, `frontend/src/jjscript/executor/executor.ts`, `frontend/src/jjscript/executor/commands/abstract.ts` (new), `frontend/src/jjscript/executor/commands/index.ts`
**Esito**: ✅ ma con bug residuo (vedi entry sopra)

**Root cause**:
`abstract` was tokenized as `KEYWORD` (not `COMMAND`). In `parseCommand()`, the check `if (token.type !== 'COMMAND')` was true, so the entire input `abstract Person` was delegated to JjEL as an eval expression. JjEL evaluated it and returned null — no model mutation occurred.

There was no `abstract` command type, no parser handler, and no executor for it.

**Fix**:
- Added `'abstract'` to `CommandType` union and `COMMANDS` array in `types.ts`
- Created `AbstractArgs` interface with `target: QualifiedName`
- Added special case in `parseCommand()`: when first token is `abstract` and next token is an identifier (not `class`), parse as the `abstract` toggle command
- Created `abstract.ts` executor that resolves the class, reads `element.abstract`, toggles with `SetFieldAction.new(element, 'abstract', !currentValue)`
- Wired in `executor.ts` switch and `index.ts` exports

**Semantics**: `abstract Person` toggles — if concrete, makes abstract; if abstract, makes concrete. Message: "Class 'Person' is now abstract/concrete".

**Note**: `abstract class Person` (with `class` keyword) still routes to `create` command as before — the special case only fires when `abstract` is followed directly by an identifier.

---

## 2026-03-25 — Fix: let binding $variable empty in body (missing metamodel context)

**Prompt**: `let $cls = (forall c in classes: c.name) in $cls` parses correctly but returns "Empty result (0 items)" — the forall works standalone but not inside let.
**File toccati**: `frontend/src/jjscript/executor/commands/let.ts`
**Esito**: ✅ completato

**Root cause**:
`evaluateJjel()` in `let.ts` only passed `context.variables` to `jjelEval()` — it did NOT call `buildEvalContext(context)` to include `classes`, `attributes`, `metamodel`, `project`. So when evaluating the valueExpr `(forall c in classes: c.name)`, the identifier `classes` was undefined and the forall returned an empty array.

Compare with `executeEval` in `eval.ts` which correctly calls `buildEvalContext(context)` first, then overlays `context.variables`.

**Fix**:
- Imported `buildEvalContext` from `./eval` into `let.ts`
- Changed `evaluateJjel()` to call `buildEvalContext(context)` first, then overlay `context.variables` on top (so let bindings can reference earlier bindings AND metamodel context)

---

## 2026-03-25 — Fix: forallExistsDepth counter never fires (token type mismatch)

**Prompt**: The `forallExistsDepth` fix in `collectValueExprRaw()` had no effect — same error persisted.
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ✅ completato

**Root cause**:
`forall` and `exists` are NOT in the JjScript `KEYWORDS` array (`types.ts:560`), so the lexer tokenizes them as `IDENTIFIER`, not `KEYWORD`. The guard at line 864 checked `token.type === 'KEYWORD'` only, so the `forallExistsDepth` counter was never incremented — the fix was dead code.

**Fix**:
- Changed the check from `token.type === 'KEYWORD'` to `(token.type === 'KEYWORD' || token.type === 'IDENTIFIER')` for forall/exists detection in `collectValueExprRaw()`

---

## 2026-03-25 — Fix (ineffective): ambiguità keyword 'in' nel let binding con espressioni JjEL

**Prompt**: `let $cls = forall c in classes: c.name in $cls` produces `[LET_ERROR] Expected 'in' after variable name` because the parser grabs the first `in` (belonging to `forall`) instead of the outer `in` (belonging to `let`).
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ⚠️ Logic was correct but never executed due to token type mismatch (see fix above)

**Fix**:
- Added `forallExistsDepth` counter alongside the existing `parenDepth`
- When a `forall` or `exists` keyword is encountered, increment `forallExistsDepth`
- When `in` is encountered: if `forallExistsDepth > 0`, decrement it (the `in` belongs to the inner construct); otherwise, if `parenDepth === 0`, break (the `in` belongs to the `let`)
- Comma break also requires `forallExistsDepth === 0`
- Handles arbitrarily nested `forall`/`exists` (e.g., `forall ... exists ... in ... in ... in`)

---

## 2026-03-25 — Fix: let binding delegates entire input to JjEL instead of body only

**Prompt**: `let $attribute = prompt('Attribute', EString) in forall c in classes such that c.name == $attribute` produces `[JJEL_ERROR] Unexpected '='`
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ✅ completato

**Root cause**:
When `parseCommand()` is called recursively from `parseLetCommand()` to parse the body, and the body is a JjEL expression (e.g. `forall` without `do`, `exists`, `with`, or any non-command identifier), the parser used `this.originalInput.trim()` as the JjEL expression text. `originalInput` is the **entire** input string including the `let $var = expr in` prefix, so JjEL received the full let binding syntax and choked on the `=` assignment operator.

**Fix**:
- Added `remainingInput()` helper method that returns `this.originalInput.substring(currentToken.position).trim()` — only the unparsed portion from the current token forward
- Replaced all 3 occurrences of `this.originalInput.trim()` in `parseCommand()`'s JjEL fallback paths with `this.remainingInput()`
- No changes to JjEL or JjTL

---

## 2026-03-25 — Fix: Titolo progetto troncato nell'header della dashboard

**Prompt**: Il titolo H1 del progetto veniva troncato con ellissi — deve andare a capo liberamente
**File toccati**: `project-editor.scss`
**Esito**: ✅ completato

**Changes**:
- Removed `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`, `max-width: 300px` from `.project-header-compact__title`
- Removed `max-width: 300px` from `__title-input` for consistency
- Added `flex-wrap: wrap` to `__row1` so version badges wrap below the title when space is tight

---

## 2026-03-25 — Fix: Documentation section padding/margin alignment

**Prompt**: Align Documentation section margins/padding with Viewpoints and other sections
**File toccati**: `DocumentationSection.tsx`, `DocumentationSection.scss`
**Esito**: ✅ completato

**Changes**:
- Replaced custom `documentation-section` wrapper with shared `project-section` class
- Wrapped documentation card in `list-card` container for consistent border/radius/spacing
- Replaced custom `doc-icon`/`doc-content` structure with `list-card__icon`/`list-card__content`/`list-card__name`/`list-card__type` — pixel-perfect match with Viewpoints cards
- Simplified `DocumentationSection.scss`: removed ~100 lines of custom card/icon/content styles now handled by shared `list-card` classes
- Kept documentation-specific styles: empty state (dashed border), disabled state, status badges, confidence badges, dark mode overrides

---

## 2026-03-25 — Fix: Docs icon in Section Navigator → lettera "D" con sfondo

**Prompt**: Replace Bootstrap icon with letter "D" on colored square, matching M/m/V/⇄ pattern
**File toccati**: `ProjectEditor.tsx`, `project-editor.scss`
**Esito**: ✅ completato

**Changes**:
- Changed Docs section from `iconBootstrap: 'bi-file-earmark-text'` to `iconLetter: 'D'` with `iconClass: 'list-card__icon--docs'`
- Added `&--docs` style: background `#dbeafe` (blue-100), color `#3b82f6` (blue-500)
- Removed unused `section-nav__icon--plain` dark-mode style

---

## 2026-03-25 — Fix: Documentation icon for "not generated" state

**Prompt**: Change empty-state Documentation icon from `bi-file-earmark-plus` to `bi-file-earmark-text`
**File toccati**: `DocumentationSection.tsx`
**Esito**: ✅ completato

**Changes**:
- Changed empty-state icon from `bi-file-earmark-plus` to `bi-file-earmark-text` to better communicate "documentation available but not yet generated"
- Existing CSS (`doc-icon--empty`) already handles grey color (`#94a3b8`) and sizing

---

## 2026-03-25 — UI: Section group visual hierarchy in Project Dashboard

**Prompt**: Create visual groupings to communicate MDE workflow structure (Structure → Transformation → Perspectives)
**File toccati**: `ProjectEditor.tsx`, `project-editor.scss`
**Esito**: ✅ completato, build passes

**Changes**:
- **Section groups**: Wrapped dashboard sections into 3 logical groups: Structure (Metamodels + Models), Transformation (Transformations), Perspectives (Viewpoints + Documentation)
- **Group labels**: Discrete uppercase watermark labels ("Structure", "Transformation", "Perspectives") above each group
- **Dashed separators**: `1px dashed #e2e8f0` between groups; reduced intra-group spacing (20px) vs inter-group spacing
- **Sidebar nav dividers**: Added `section-nav__divider` between group boundaries in the section navigator
- **Dark mode**: Full support for group separators (`#334155`), labels (`#475569`), and nav dividers
- **IntersectionObserver**: Still works — `div[id="section-*"]` elements preserved as observer targets inside group wrappers

---

## 2026-03-25 — UI: Standardize section headers and actions in Project Dashboard

**Prompt**: Uniform section header pattern across all dashboard sections
**File toccati**: `ProjectEditor.tsx`, `project-editor.scss`, `DocumentationSection.tsx`, `DocumentationSection.scss`
**Esito**: ✅ completato, build passes

**Changes**:
- **SectionHeader component**: Inline component with standardized title + count `(N)` always shown + ghost button actions
- **Metamodels**: Uses `SectionHeader` with Import (secondary, ghost xs) + "+ New" (primary, ghost sm)
- **Models**: Uses manual `project-section-header` div (needs ref for dropdown positioning) with count always shown
- **Transformations**: Uses `SectionHeader` with count + "+ New"; added CTA to empty state
- **Viewpoints**: Changed "+ Add" to "+ New" (disabled); count always shown including `(0)`
- **Documentation**: Updated header from `.section-header` to `.project-section-header`; added "Generate" button in header actions
- **New CSS classes**: `.project-section-header`, `.btn--ghost`, `.btn--sm`, `.btn--xs`
- **Dark mode**: Full support for ghost buttons and section header

---

## 2026-03-25 — UI: Sidebar section navigator + compact header for Project Dashboard

**Prompt**: Transform sidebar from action list to section navigator; compact header with actions in ⋮ menu
**File toccati**: `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/components/project/project-editor.scss`
**Esito**: ✅ completato, build passes

**Changes**:
- **Sidebar**: New section navigator with 5 entries (Metamodels, Models, Transforms, Viewpoints, Docs). Each shows type icon + label + count. Click scrolls to section via `scrollIntoView({ behavior: 'smooth' })`. Active section tracked via `IntersectionObserver`.
- **Header compacted**: From ~120px multi-row layout to ~56px 2-row layout. Row 1: title + version badges + "View Megamodel" (promoted to primary button) + "+ Tags" + ⋮ menu. Row 2: description + author + date + inline tags.
- **⋮ menu**: Download project, Make public/private, Close project. Click-outside to dismiss.
- **Layout**: `project-editor` now uses flex column. Body is flex row with `section-nav` sidebar (180px) + scrollable main content.
- **Section IDs**: Added `id="section-{name}"` to each section div for scroll targeting.
- **Dark mode**: Full support for compact header, sidebar, and dropdown.

---

## 2026-03-25 — Fix: JjEL result rendering and error handling in JjScript Console

**Prompt**: Fix 3 problemi nel rendering dei risultati JjEL nella console JjScript
**File toccati**: `frontend/src/jjscript/components/JjScriptOutput.tsx`, `frontend/src/jjscript/executor/commands/eval.ts`
**Esito**: ✅ completato

**Problema 1 — "Eval" + "element" badge**: eval/forall results went through `parseExecutionResult()` which produced generic "Eval" + "element" badges instead of actual values. The `formatJjelResult()` in eval.ts already produced good messages (`**2** results`, actual values) but they were never displayed.
**Fix**: Added `'eval'` and `'forall'` to `isDisplayCommand` in JjScriptOutput.tsx so they use classic status+message rendering. Added `data.items` rendering block (eval stores array items in `data.items`, but output only rendered `data.elements`).

**Problema 2 — No error on invalid input**: `blablabla` returned success because JjEL evaluator silently returns `null` for undefined identifiers (evaluator.ts:191).
**Fix**: Added `isBareIdentifier()` check in eval.ts — after jjelEval returns `null`, if the expression is a simple identifier not in the variables context, return `UNDEFINED_VARIABLE` error with suggestion. Also propagated `context.variables` (let/forall bindings) into eval context.

**Problema 3 — ForAll display**: forall executor already produced good summary messages ("forall: 2/2 executed successfully") but they were hidden by the badge notification. Fixed by Problem 1's `isDisplayCommand` change.

**TypeScript**: `npx tsc --noEmit` — no new errors in changed files.

---

## 2026-03-25 — Fix: JjScript parser no longer delegates JjEL expressions

**Prompt**: Diagnosi + fix regressione — JjScript non delega a JjEL
**File toccati**: `frontend/src/jjscript/parser/parser.ts`
**Esito**: ✅ completato
**Root cause**: Commit `8e9509e16` added `'forall'` to the `COMMANDS` array in `types.ts`. The lexer then tokenized `forall` as `COMMAND` type, but the JjEL delegation check at `parseCommand()` only matched `IDENTIFIER` or `KEYWORD` — so the forall→JjEL path became dead code. The input fell through to the `switch(command)` which had no `case 'forall':`, hitting `default: throw 'Unknown command'`.
**Fix (3 changes)**:
1. Added `token.type === 'COMMAND'` to the forall token type check (line 116) so `forall`-as-COMMAND still reaches the JjEL/JjScript disambiguation via `isForAllDoCommand()`
2. Replaced the hard error at line 144 (non-COMMAND tokens) with JjEL delegation — arbitrary expressions like `classes.size` now fall through to JjEL instead of erroring
3. Added `case 'forall':` in the parser switch (line 207) as safety net for JjScript `forall...do` commands

---

## 2026-03-25 — Feat: Add "Show Console" to View menu

**Prompt**: Add JjScript console overlay accessible from View menu
**File toccati**: `frontend/src/pages/components/Navbar.tsx`
**Esito**: ✅ completato
**Note**: Added `showConsole` state, "Show Console" toggle item in View menu (with checkmark and filled icon when active), and a fixed-position overlay (560×420px, bottom-right) rendering `<JjScriptConsole />` with a dark header bar and close button. No backdrop — canvas remains interactive. TypeScript clean (`npx tsc --noEmit` — no new errors).

---

## 2026-03-25 — Audit: language documentation vs implementation

**Prompt**: Systematic audit of `docs/jjtl-jjel-paper.tex` against the codebase (JjEL, JjTL, JjModal, JjLet, JjScript)
**File toccati**: `docs/LANGUAGE-DOCS-AUDIT.md` (creato)
**Esito**: ✅ completato
**Note**: 55 punti verificati — 35 allineati, 13 parzialmente disallineati, 7 disallineati, 3 non documentati. Le discrepanze critiche sono: (1) `when` vs `where` keyword mismatch in tutto il documento, (2) short-circuit evaluation dichiarato ma non implementato, (3) `filter()`/`map()` dichiarati rimossi ma ancora presenti, (4) JjScript completamente non documentato nel paper. Vedi report completo per dettagli e priorità di aggiornamento.

---

## 2026-03-25 — Feat: implement `let` command in JjScript (Phase 3 of JjLet)

### Changes
- Added `'let'` to `CommandType` union, `LetArgs` interface, `CommandArgs` union, and `COMMANDS` array in `types.ts`
- Added `parseLetCommand()` in `parser.ts` with helpers: `consumeDollarIdentifier()`, `collectValueExprRaw()`, `matchComma()`, `skipNewlines()`
- Added `$variable` support in `parseValueOrQualified()` — parses `$name` as a QualifiedName for use in set/rename values
- Added optional `contextOverride` parameter to `JjScriptExecutor.executeAST()` for scoped context injection
- Added `case 'let'` in executor switch dispatch
- Created `executor/commands/let.ts` handler with:
  - `executeLet()` — creates child context, evaluates bindings sequentially, resolves variables in body AST, executes body
  - `evaluateBindingValue()` — dispatches to prompt/confirm (UIBridge) or JjEL evaluation
  - `resolveVariablesInBody()` — walks body AST to replace `$variable` references with concrete LiteralValues (handles SetArgs.value, RenameArgs.newName)
- Re-exported `executeLet` from `commands/index.ts` and `jjscript/index.ts`

### Files changed
- `frontend/src/jjscript/types.ts` — `LetArgs`, `CommandType`, `CommandArgs`, `COMMANDS`
- `frontend/src/jjscript/parser/parser.ts` — `parseLetCommand()`, `$variable` in values
- `frontend/src/jjscript/executor/executor.ts` — `contextOverride`, `case 'let'`
- `frontend/src/jjscript/executor/commands/let.ts` — new handler
- `frontend/src/jjscript/index.ts` — re-export

### Type check
- `npx tsc --noEmit` — zero new errors (only pre-existing legacy errors)

---

## 2026-03-25 — Fix: `let` binding expression stops at COMMA and IN

### Bug
`let $name = prompt('Name', EString), $upper = $name.toUpper() in { ... }` failed with "Expected '$identifier' after 'let'" because `expression()` is greedy and consumed the comma/`in` as part of the binding value.

### Fix
In `letStatement()`, replaced `this.expression()` with `this.parseJjELExpression([COMMA, IN, NEWLINE, RBRACE])` (when source string is available) so the expression parser stops at binding separators. Added `skipNewlines()` calls to support multi-line binding lists.

### Files changed
- `frontend/src/jjtl/parser/parser.ts` — boundary-aware expression parsing in `letStatement()`
- `frontend/src/jjtl/__tests__/let-prompt-bug.test.ts` — updated JjEL delegation test expectation, added 4 new test cases (multi-binding, multi-line, newline-before-in, source-string path)

### Tests
- 9/9 let-prompt-bug tests passing
- 232 total JjTL+JjEL tests passing (no regressions)

---

## 2026-03-24 — Feat: implement `let` statement in JjTL (Phase 2 of JjLet)

### Changes
- Added `LET` token type and `DOLLAR_IDENT` token type to JjTL `TokenType` enum and `JJTL_KEYWORDS` map
- Added `$identifier` scanning in JjTL lexer (`case '$'` handler)
- Added `LetStatementAST` interface to AST types; updated `MappingBodyItemAST` union
- Added `letStatement()` parser method with support for multiple bindings and `in { body }` block
- Added `LET` dispatch in `mappingBody()` (before forall/alert/notify)
- Added `LetStatement` handling in all 3 executor body-iteration methods:
  - `executeAttributeMappings()` — delegates to new `executeLetBody()` helper
  - `executeAttributeMappingsWithTrace()` — delegates to new `executeLetBodyWithTrace()` helper
  - `executeObjectCreation()` — inline let body execution on the parent object
- Both helpers support nested `let` statements recursively

### Syntax
```jjtl
let $var = expr (, $var2 = expr2)* in {
    -- body items use $var in JjEL expressions
}
```

### Files changed
- `frontend/src/jjtl/types/tokens.ts` — LET + DOLLAR_IDENT tokens
- `frontend/src/jjtl/types/ast.ts` — LetStatementAST interface
- `frontend/src/jjtl/lexer/lexer.ts` — `$identifier` scanning
- `frontend/src/jjtl/parser/parser.ts` — letStatement() + mappingBody() dispatch
- `frontend/src/jjtl/executor/executor.ts` — LetStatement execution in 3 methods + 2 helpers

### TypeScript
- `npx tsc --noEmit` — zero new errors (all errors are pre-existing legacy)

---

## 2026-03-24 — Feat: add $identifier (DOLLAR_IDENT) token to JjEL lexer/parser

### Changes
- Added `DOLLAR_IDENT` token type to `JjelTokenType` enum in `tokens.ts`
- Modified lexer `case '$'` to recognize `$letter...` sequences as `DOLLAR_IDENT` tokens (bare `$` and `${` behavior unchanged)
- Added `DOLLAR_IDENT` handling in parser `primary()` — produces `Identifier` AST node with `$`-prefixed name (e.g. `$name`)
- Added 4 tests in `parser.test.ts`: simple `$name`, binary expression with `$prefix`, `$my_var2` with mixed chars, bare `$` error

### Files changed
- `frontend/src/jjel/types/tokens.ts`
- `frontend/src/jjel/lexer/lexer.ts`
- `frontend/src/jjel/parser/parser.ts`
- `frontend/src/jjel/__tests__/parser.test.ts`

### Tests
- 176/176 passing (89 parser + 87 evaluator)

---

## 2026-03-24 — Docs: add JjLet chapter to jjtl-jjel-paper.tex

### Changes
- Added `\jjlet` macro to preamble alongside existing `\jjmodal`
- Added `let` keyword to `jjtl` and `jjel` listing language definitions
- Updated Document Structure paragraph in Introduction to reference `\cref{sec:jjmodal}` and `\cref{sec:jjlet}`
- Inserted full JjLet section (§5) after JjModal (§4) and before Comparative Analysis (now §6)
  - Subsections: Motivation, Design Position and Architecture, Variable Sigil, Syntax, Semantics, Usage Examples, Implementation Plan, Design Tensions
- Updated comment section numbers for Examples (→7), Discussion (→8), Conclusion (→9)

### Files changed
- `docs/jjtl-jjel-paper.tex`

---

## 2026-03-24 — Feat: add confirm() to JjTL Monaco autocomplete

### Changes
- `jjtlCompletions.ts`: added `confirm` entry to `INTERACTIVE_FUNCTIONS` array with label, detail, documentation, and snippet insertText

### Files changed
- `frontend/src/jjtl/editor/jjtlCompletions.ts`

---

## 2026-03-24 — Feat: show rule + instance context in prompt() and confirm() dialogs

### Goal
When `prompt()` or `confirm()` is called during a JjTL transformation, the dialog shows a subtitle with execution context: e.g. "Person → Human :: Mario" (rule → source instance name).

### Approach
Added `currentRuleName` and `currentInstanceName` optional fields to `ExecutionContext`. The executor populates them during `executeClassMapping`. A new `buildDialogContext()` helper formats them as a display string and passes it through the UIBridge → ReactUIBridge → DialogManager → dialog component chain.

### Changes
- `executor.ts`: added `currentRuleName`/`currentInstanceName` to `ExecutionContext`, populated in `executeClassMapping` loop, added `buildDialogContext()` helper, passed `executionContext` to `showPrompt`/`showConfirm` calls
- `UIBridge.ts`: added optional `executionContext` parameter to `showPrompt` and `showConfirm` in interface + `NoopUIBridge` + `ConsoleUIBridge`
- `ReactUIBridge.ts`: added `executionContext` to `DialogRequest` prompt/confirm variants, propagated in `showPrompt`/`showConfirm`
- `JjtlDialogManager.tsx`: passes `executionContext` prop to `JjtlPromptDialog` and `JjtlConfirmDialog`
- `JjtlPromptDialog.tsx`: added `executionContext` prop, renders `.jjtl-dialog-context` subtitle
- `JjtlConfirmDialog.tsx`: added `executionContext` prop, renders `.jjtl-dialog-context` subtitle
- `JjtlDialogs.scss`: added `.jjtl-dialog-context` style (11px, slate-500, italic)

### Files changed
- `frontend/src/jjtl/executor/executor.ts`
- `frontend/src/jjtl/executor/UIBridge.ts`
- `frontend/src/jjtl/executor/ReactUIBridge.ts`
- `frontend/src/jjtl/components/dialogs/JjtlDialogManager.tsx`
- `frontend/src/jjtl/components/dialogs/JjtlPromptDialog.tsx`
- `frontend/src/jjtl/components/dialogs/JjtlConfirmDialog.tsx`
- `frontend/src/jjtl/components/dialogs/JjtlDialogs.scss`

---

## 2026-03-24 — Feat: implement confirm() command — full stack

### Goal
Add `confirm(label)` — a JjModal command that opens a Yes/No dialog and returns a boolean.

### Changes
- `tokens.ts`: added `CONFIRM` to `TokenType` enum and `JJTL_KEYWORDS`
- `ast.ts`: added `ConfirmExpressionAST` interface and union member in `ExpressionAST`
- `parser.ts`: imported `ConfirmExpressionAST`, added `TokenType.CONFIRM` check in `primary()`, added `confirmExpression()` method
- `UIBridge.ts`: added `showConfirm(message): Promise<boolean>` to interface + `NoopUIBridge` (returns false) + `ConsoleUIBridge` (logs and returns false)
- `ReactUIBridge.ts`: added `{ type: 'confirm' }` variant to `DialogRequest` union + `showConfirm()` implementation
- `executor.ts`: imported `ConfirmExpressionAST`, added to `isUserProvidedExpression()`, added `ConfirmExpression` case in `evaluateExpressionAsync()`
- `JjtlConfirmDialog.tsx`: new component — Yes/No buttons, Enter=Yes, Escape=No, `bi-question-circle` icon
- `JjtlDialogManager.tsx`: imported `JjtlConfirmDialog`, added `'confirm'` case in `renderDialog()`
- `dialogs/index.ts`: exported `JjtlConfirmDialog`

### Files changed
- `frontend/src/jjtl/types/tokens.ts`
- `frontend/src/jjtl/types/ast.ts`
- `frontend/src/jjtl/parser/parser.ts`
- `frontend/src/jjtl/executor/UIBridge.ts`
- `frontend/src/jjtl/executor/ReactUIBridge.ts`
- `frontend/src/jjtl/executor/executor.ts`
- `frontend/src/jjtl/components/dialogs/JjtlConfirmDialog.tsx` (new)
- `frontend/src/jjtl/components/dialogs/JjtlDialogManager.tsx`
- `frontend/src/jjtl/components/dialogs/index.ts`

---

## 2026-03-24 — Fix: prompt dialog passes typeRef, renders correct widget, validates by type

### Goal
Fix JjtlPromptDialog so it receives the `typeRef` from the DialogRequest and uses it to:
- Render the appropriate input widget (text, number, date, checkbox)
- Validate input on submit (reject non-numeric for EInt/EFloat)
- Show inline error message without closing the dialog

### Changes
- `JjtlDialogManager.tsx`: pass `typeRef={request.typeRef}` to JjtlPromptDialog
- `JjtlPromptDialog.tsx`: add `typeRef` prop; render `<input type="number">` for EInt/EFloat, `<input type="date">` for EDate, `<input type="checkbox">` for EBoolean, `<input type="text">` for everything else; validate EInt (parseInt) and EFloat (parseFloat) on submit with inline red error; return string values in all cases

### Files changed
- `frontend/src/jjtl/components/dialogs/JjtlDialogManager.tsx`
- `frontend/src/jjtl/components/dialogs/JjtlPromptDialog.tsx`

---

## 2026-03-24 — Feat: trace shows rule name and userProvided flag per binding

### Goal
Enhance trace model and MappingTraceView to:
1. Show `TraceLink.rule` (e.g. "Person -> Human") — already wired, confirmed visible
2. Add `userProvided` flag to `BindingTrace` for prompt()/input() values
3. Show a "user input" badge (cyan, `bi-person-fill` icon) next to user-provided binding values

### Changes
- `traceModel.ts`: added `userProvided?: boolean` to `BindingTrace` interface and `TraceLinkBuilder.addBinding()` parameter
- `executor.ts`: added `isUserProvidedExpression()` helper; passes `userProvided` to `addBinding()` when the top-level expression is `PromptExpression` or `InputExpression`
- `MappingTraceView.tsx`: added `userProvided?: boolean` to `AttributeMapping` interface; renders "user input" badge with `bi-person-fill` icon when `binding.userProvided === true`
- `MappingTraceView.scss`: added `.trace-binding-user-provided` style (cyan badge, 10px font)
- `useJjtlExecutor.ts`: both adapter paths now pass `invertible`, `expression`, and `userProvided` from `BindingTrace` to `AttributeMapping`

### Files changed
- `frontend/src/jjtl/executor/traceModel.ts`
- `frontend/src/jjtl/executor/executor.ts`
- `frontend/src/jjtl/views/MappingTraceView.tsx`
- `frontend/src/jjtl/views/MappingTraceView.scss`
- `frontend/src/jjtl/hooks/useJjtlExecutor.ts`

---

## 2026-03-24 — Fix: prompt() shows typeRef as default value in dialog

### Bug
`prompt('Age', EInt)` pre-filled the input field with "EInt" because `ReactUIBridge.showPrompt` had a 2-param signature `(message, defaultValue?)` while `UIBridge` interface had 3 params `(message, typeRef, defaultValue?)`. The executor passed `typeRef` as the second arg, which ReactUIBridge treated as `defaultValue`.

### Fix
- `ReactUIBridge.ts`: added `typeRef` parameter to `showPrompt` signature and to the emitted `DialogRequest`
- `DialogRequest` prompt type: added `typeRef: string` as a separate field from `defaultValue`
- `JjtlPromptDialog` and `JjtlDialogManager` already correctly use only `defaultValue` — no changes needed

### Files changed
- `frontend/src/jjtl/executor/ReactUIBridge.ts`

---

## 2026-03-24 — Feat: wire JjTL interactive commands to executor

### Goal
Connect the 4 interactive AST nodes (AlertStatement, NotifyStatement, PromptExpression, InputExpression) — already parsed but not executed — to the UIBridge so they actually trigger UI dialogs during transformation execution.

### Design decisions
- `evaluateExpression` stays synchronous (JjelFunction.call returns JjelValue, not Promise)
- New `evaluateExpressionAsync` wrapper handles PromptExpression/InputExpression via UIBridge
- Body iteration methods and the execution chain up to `execute()` are now async
- AlertStatement/NotifyStatement handled directly in the 3 body iteration loops
- PromptExpression/InputExpression intercepted at the attribute mapping level via evaluateExpressionAsync

### Changes
- `executor.ts`: added imports for interactive AST types + getUIBridge
- `executor.ts`: added `evaluateExpressionAsync()` — async wrapper that intercepts Prompt/Input, delegates rest to sync evaluateExpression
- `executor.ts`: added AlertStatement + NotifyStatement handling in executeAttributeMappings, executeAttributeMappingsWithTrace, executeObjectCreation
- `executor.ts`: made execution chain async: execute → executeClassMapping → executeMultiSourceClassMapping → executeAttributeMappings/WithTrace → executeAttributeMapping/WithTrace → executeConversion, executeObjectCreation, executeForAllMapping, executeForAllMappingOnObject
- `ProjectEditor.tsx`: added `await` to executeTransformation call (already in async function)

### Files changed
- `frontend/src/jjtl/executor/executor.ts`
- `frontend/src/components/project/ProjectEditor.tsx` (1 line: added await)

---

## 2026-03-24 — Fix: context menu icon color inherits from text

### Goal
Icon color in context menu items must match text color, not be dimmed independently.

### Change
- Removed hardcoded `color: #64748b` on `.item i.bi` — now uses `color: inherit`
- Removed separate `:hover i.bi` color override (no longer needed)
- Icons now match text color in all states: normal (`#cbd5e1`), danger, muted, hover

### Files changed
- `frontend/src/components/contextMenu/style.scss` — 2 lines removed, 1 changed

---

## 2026-03-24 — Style: unified dark slate floating surfaces

### Goal
Unify all floating surfaces (context menus, edge type popup) to a single dark slate style with consistent design tokens.

### Design tokens applied
- background: `#1e293b`, border: `1px solid #334155`, border-radius: `8px`
- box-shadow: `0 2px 12px rgba(0,0,0,0.2)`
- item: 12px, `#cbd5e1`, padding `5px 8px`, border-radius `4px`
- item icon: `#64748b`, 13px
- hover: `rgba(255,255,255,0.06)`
- active: `#38bdf8` text, `rgba(14,165,233,0.12)` bg
- danger: `#f87171`, hover `rgba(239,68,68,0.12)`
- divider: `0.5px solid rgba(255,255,255,0.08)`
- section label: 10px, `#475569`, uppercase, letter-spacing `.08em`

### Files changed
- `frontend/src/components/editor-v2/_themes.scss` — added `--float-*` CSS variables to both theme-dark and theme-light (identical dark floating surface in both themes, except shadow intensity)
- `frontend/src/components/editor-v2/EditorV2.scss` — editor-v2 `.context-menu` now uses `var(--float-*)` tokens
- `frontend/src/components/editor-v2/components/EdgeTypePopup.scss` — replaced hardcoded dark values with `var(--float-*)` tokens; unified border-radius to 8px, padding to 4px
- `frontend/src/components/contextMenu/style.scss` — legacy context menu updated to dark slate (hardcoded values since it's outside editor-v2 scope)

### Notes
- **FeaturesPalette** is a sidebar panel (not a floating surface) — left unchanged. If "primitives popover" refers to a different component, it should be identified separately.
- **No TSX changes** — all three surfaces use CSS classes (no inline styles for the floating container itself).
- **No class renames** — existing class names preserved.
- Pre-existing TS errors unrelated to this change (GraphDataElements, EcoreService, view.tsx).

---

## 2026-03-24 — Style: context menu visual polish

### Changes
- Reduced border-radius from `var(--radius-lg)` (12px) to 8px for a tighter look
- Reduced `<hr>` separator margin from `var(--space-1)` to 2px to tighten vertical spacing
- Added subtle 0.5px divider before Delete item (targeted via `[data-cannotdelete]` attribute)
- Added subtle 0.5px divider before Help item (targeted via `:has(> .bi-question-circle)`)

### Files changed
- `frontend/src/components/contextMenu/style.scss`

## 2026-03-23 — Fix: white page — U.toHtml() undefined at module load (MyRcDock.tsx)

### Problem
App shows white page with error loop: `MyRcDock.tsx: Cannot read properties of undefined (reading 'toHtml')` — first at line 308 (`dropIndicator`), then at line 419 (`makeAnchorControl` → `anchorControls`).

### Root cause
Two top-level variable initializers called `U.toHtml(...)` at **module scope**:
1. `dropIndicator` (line 308) — dead code, never used elsewhere
2. `anchorControls` array (lines 421-426) — calls `makeAnchorControl()` which uses `U.toHtml()`

`U` is resolved from `windoww.U` at import time (`joiner/index.ts:105`). Due to module load order, `U` can be `undefined` when `MyRcDock.tsx` is first evaluated, crashing the app before any component renders.

### Fix
Deferred both into lazy-init getter functions:
- `getDropIndicator()` — creates `dropIndicator` on first access
- `getAnchorControls()` — creates `anchorControls` array on first access, updated the one call site (line 614)

### Files changed
| File | Change |
|------|--------|
| `frontend/src/components/dock/MyRcDock.tsx` | Lazy-init `dropIndicator` and `anchorControls`; updated call site at line 614 |

### Verification
- Vite dev server starts cleanly

---

## 2026-03-23 — Fix: white page regression (ansi-to-html require)

### Problem
After the scoping fix commit, the app showed a white page with error loop:
`MyRcDock.tsx:308: Cannot read properties of undefined (reading 'toHtml')`

### Root cause
`UX.tsx` imported `ansi-to-html` via `require()` (line 23), which returns `{}` in the Vite/browser environment. This could cause module initialization failures cascading to other components. Additionally, `U.objectInspect()` had a typo: it cached the `Convert` instance under `window.ansiconvert` (lowercase) but read from `window.ansiConvert` (uppercase), so the instance was never cached and recreated on every call.

### Fix
1. **UX.tsx**: Removed unused `require('ansi-to-html')` — `Convert` was imported but never referenced in UX.
2. **U.tsx `objectInspect()`**: Fixed cache key typo (`ansiconvert` → `ansiConvert`) and added null-check safety net — if `ansiConvert.toHtml` is not a function, falls back to plain `util.inspect()` without ANSI colors.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/common/UX.tsx` | Removed unused `require('ansi-to-html')` |
| `frontend/src/common/U.tsx` | Fixed `objectInspect()` cache key typo + null-check on `toHtml` |

### Verification
- Vite dev server starts cleanly
- Zero TypeScript errors
- Scoping fix (commit `7bd2bd05f`) untouched — it did not modify UX.tsx, U.tsx, or MyRcDock.tsx

---

## 2026-03-23 — Fix: `classes` scoped to active metamodel tab

### Problem
`forall c in classes : c.name` returned classes from the wrong metamodel (metamodel_1) when the user was viewing metamodel_3 — because both code paths (`getActiveMetamodel()` and Console `getFallbackModel()`) relied on `_lastSelected` which tracks the last clicked element, NOT the currently visible tab.

### Root cause
Two independent code paths build the JjEL evaluation context:
1. **JjScript executor** (`eval.ts` → `buildEvalContext` → `getTargetMetamodel` → `getActiveMetamodel`)
2. **Console component** (`Console.tsx` → `mapStateToProps` + `getFallbackModel` → `jjelEval`)

Both used `state._lastSelected` (stale after tab switch without clicking an element) and fell back to `m2models[0]` / first metamodel.

### Fix
Use **DockManager active tab ID** as primary source of truth (tab IDs = metamodel pointer IDs):

1. `getActiveMetamodel()` now queries `DockManager.dock.getLayout().dockbox.children[0].activeId` first, falling back to `_lastSelected` only when dock is unavailable.
2. Console `getFallbackModel()` similarly uses DockManager active tab before falling back to `m2models[0]`.
3. Console `mapStateToProps` clears stale `_lastSelected.node` when the node belongs to a different metamodel than the active tab.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/jjscript/executor/utils.ts` | `getActiveMetamodel()` uses DockManager active tab; added helper `getActiveTabMetamodel()` |
| `frontend/src/components/editors/Console.tsx` | `getFallbackModel()` uses DockManager; `mapStateToProps` clears cross-tab stale node |

### Tests
329 tests passing (172 JjEL + 157 JjTL), unchanged.

---

## 2026-03-23 — JjEL: object literals

### What
Added object literal syntax to JjEL: `{key: value, ...}`. Keys can be identifiers or quoted strings. Supports empty objects `{}`, dot access `{name: "x"}.name`, index access `{"my-key": v}["my-key"]`, nesting, and use as forall projections.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/jjel/types/ast.ts` | Added `ObjectLiteralExpr`, `ObjectLiteralEntry` types to union |
| `frontend/src/jjel/types/tokens.ts` | Added `LBRACE` token type |
| `frontend/src/jjel/lexer/lexer.ts` | Handle `{` → `LBRACE` token |
| `frontend/src/jjel/parser/parser.ts` | Added `objectLiteral()` production in `primary()` |
| `frontend/src/jjel/evaluator/evaluator.ts` | Added `evaluateObjectLiteral()` — produces plain JS objects |
| `frontend/src/jjel/__tests__/parser.test.ts` | 11 new parser tests for object literals |
| `frontend/src/jjel/__tests__/evaluator.test.ts` | 16 new evaluator tests (dot/index access, sortBy, groupBy, forall) |
| `frontend/src/jjel/SPEC.md` | Updated grammar, composite types table, operators |

### Tests
172 JjEL tests passing (was 145), 157 JjTL tests passing (unchanged).

---

## 2026-03-23 — JjEL grammar update: `|` as alias, `:` reserved for projection

### What
Updated JjEL grammar with three changes:
1. **`|` added as alias for `such that`** — works in both `forall` and `exists` filter clauses
2. **`:` removed from `exists`** — `:` is now reserved exclusively for `forall` projections (breaking change)
3. **Nested parenthesized expressions** work correctly: `forall c in classes | (exists a in c.attrs | a.isPublic) : c.name`

### Breaking change
`exists x in S : pred` is no longer valid syntax. Must use `exists x in S such that pred` or `exists x in S | pred`.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/jjel/types/tokens.ts` | Added `PIPE` token type |
| `frontend/src/jjel/lexer/lexer.ts` | Handle `\|` → `PIPE` token |
| `frontend/src/jjel/parser/parser.ts` | `exists()`: reject `:`, accept `\|`; `forAll()`: accept `\|` as alias |
| `frontend/src/jjel/types/ast.ts` | Updated doc comments |
| `frontend/src/jjel/__tests__/parser.test.ts` | Updated exists tests, added rejection test |
| `frontend/src/jjel/__tests__/evaluator.test.ts` | Changed `exists ... :` → `exists ... such that` |
| `frontend/src/jjtl/__tests__/jjel-delegation.test.ts` | Changed 4 exists expressions |
| `frontend/src/jjel/SPEC.md` | Updated exists syntax, examples, summary table |
| `CLAUDE.md` | Updated core constructs table |
| `docs/jjel-jjtl-audit.md` | Updated exists example |
| `docs/jjtl-jjel-paper.tex` | Updated 3 exists examples + description |
| `docs/claude-code-log.md` | This entry |

---

## 2026-03-22 — JjEL integration in JjScript (forall, exists, with)

### What
Added JjEL expression evaluation support to JjScript. Users can now type `forall`, `exists`, and `with` expressions directly in the JjScript console/chat, and the expression is evaluated against the active metamodel context via JjEL delegation (same pattern as JjTL).

### How it works
1. **Parser detection:** When the first token is `forall`, `exists`, or `with`, the parser captures the entire input as a raw JjEL expression string (no AST construction — JjEL has its own parser).
2. **Executor delegation:** The new `executeEval` command handler builds an `EvaluationContext` from the active metamodel (classes, attributes, metamodel, project), then calls `jjelEval(expression, variables)`.
3. **Context building:** L-layer proxy objects are converted to plain JjelValue objects using shallow conversion to avoid circular reference issues. Available context variables: `classes`, `attributes`, `metamodel`, `project`.
4. **Result display:** Array results are shown as bulleted lists; scalars are shown directly; errors show the JjEL error message with a syntax hint.

### Examples
- `forall c in classes : c.name` → list of class names
- `forall c in classes such that c.isAbstract : c.name` → abstract class names only
- `forall c in classes | (exists a in c.attributes | a.name == "pippo")` → classes with attribute "pippo"
- `eval 2 + 3` → `5` (explicit eval command also supported)

### Files changed
| File | Change |
|------|--------|
| `frontend/src/jjscript/types.ts` | Added `'eval'` to `CommandType`, `COMMANDS`, `CommandArgs`; added `EvalArgs` interface |
| `frontend/src/jjscript/parser/parser.ts` | Added JjEL trigger detection (`forall`/`exists`/`with`); added `parseEvalCommand()` for explicit `eval` syntax |
| `frontend/src/jjscript/executor/commands/eval.ts` | Created — `executeEval` with context building and `jjelEval` delegation |
| `frontend/src/jjscript/executor/executor.ts` | Added `case 'eval'` dispatch |
| `frontend/src/jjscript/services/JjScriptService.ts` | Added JjEL trigger detection in `startsWithCommand`; added `formatEvalResult` for chat display |
| `docs/claude-code-log.md` | Updated with this entry |

---

## 2026-03-22 — JjEL delegation architecture exploration (JjTL → JjScript)

### What
Read-only exploration of how JjTL delegates expression evaluation to JjEL, to plan replicating the same mechanism in JjScript.

### Key findings
- **Delegation pattern:** JjTL executor holds a persistent `JjelEvaluator` instance. All expressions pass through `evaluateExpression()` → `toJjelAst()` (bridge) → `jjelEvaluator.evaluate(jjelExpr, ctx)`. The same `EvaluationContext` object is shared by reference.
- **Standalone function calls bypass the bridge** — executor intercepts `FunctionCall` with `Identifier` callee and calls builtins directly via `ctx.getBuiltin()`.
- **JjScript has zero JjEL integration** — no imports, no expression evaluation, no variable bindings. The `ExecutionContext.variables` map exists but is never used.
- **Integration is surgical, not a refactoring** — JjEL's `EvaluationContext.child()` and `JjelEvaluator.evaluate(expr, ctx)` are already designed for external consumers. JjScript can use the JjEL parser directly (no bridge needed). Estimated ~200-300 lines of new code.

### Output
- Created `docs/jjel-delegation-architecture.md` — full report with exact signatures, context flow, gap analysis, and recommended integration approach.

### Files changed
| File | Change |
|------|--------|
| `docs/jjel-delegation-architecture.md` | Created — delegation architecture report |
| `docs/claude-code-log.md` | Updated with this entry |

---

## 2026-03-22 — Singleton instances rendering on M1 canvas (Phase 2)

### What
Connected the View menu "Show singleton instances" toggle to the EditorV2 canvas. When enabled, singleton class instances are created/revealed on the M1 canvas with a diamond badge; when disabled, they are hidden (DVertices persist in Redux for position preservation).

### Architecture
- **syncState.ts**: New `suppressedSingletonIds` Set — module-level coordination between EditorV2 and useJjomSync. When singletons are hidden, their DVertex IDs are added to this set so both init and incremental sync paths skip them.
- **useJjomSync.ts**: Checks `isSingletonSuppressed(id)` in both the full init path (mount/modelid change) and the incremental additions path. Suppressed vertices are skipped entirely.
- **EditorV2.tsx**: Listens for `jjodel:toggle-singletons` custom event. On show: clears suppression, transforms existing DVertices to RF nodes (or creates new DObject+DVertex via `syncCreateObject` for singletons without instances). On hide: suppresses vertex IDs, removes RF nodes. On mount with toggle off: pre-suppresses existing singleton vertices.
- **ObjectNode.tsx**: Reads `isSingleton` flag from metaclass in Redux, renders diamond badge in top-right corner.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/components/editor-v2/sync/syncState.ts` | Added `suppressedSingletonIds` Set with suppress/unsuppress/clear/get functions |
| `frontend/src/components/editor-v2/hooks/useJjomSync.ts` | Import `isSingletonSuppressed`, skip suppressed vertices in init + incremental sync |
| `frontend/src/components/editor-v2/EditorV2.tsx` | Added singleton toggle event listener, show/hide logic, initial suppression on mount |
| `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` | Read `isSingleton` from Redux metaclass, render diamond badge conditionally |
| `frontend/src/components/editor-v2/EditorV2.scss` | Added `.singleton-badge` styles (16×16px slate badge with white diamond icon) |

### Key decisions
- **DVertices persist when hidden** — positions preserved in Redux store, no localStorage backup needed
- **Suppression set** pattern (not RF node filtering) — integrates cleanly with existing anti-bounce coordination in syncState.ts
- **New instances auto-positioned** — below existing nodes (y = maxY + 60), spaced horizontally (gap 220px)
- **Badge uses same slate style** (#334155) as other UI indicators per design system

---

## 2026-03-22 — "Show singleton instances" toggle in View menu (Phase 1)

### What
Added a per-model toggle "Show singleton instances" to the View menu (between Fullscreen Mode and Debug Mode). The toggle is disabled when the active tab is a metamodel or the dashboard — only enabled for M1 model tabs.

### State management
- **Per-model localStorage**: key `jjodel.showSingletons.<modelId>`
- Syncs on active tab change via `jjodel:active-tab` event
- Dispatches `jjodel:toggle-singletons` custom event with `{ modelId, show }` for canvas consumption
- Console logs `[singleton] show=<bool>, modelId=<id>` for Phase 2 verification

### Files changed
| File | Change |
|------|--------|
| `frontend/src/pages/components/Navbar.tsx` | Added singleton toggle state, `getActiveModelTab()` helper, `toggleShowSingletons()`, menu item with diamond icon and contextual disable |

### Pattern
Follows the TreeView toggle pattern: localStorage-backed `useState` + custom event for cross-component sync. Menu item uses the Debug Mode checkmark pattern (`✓` suffix + filled/outline icon).

---

## 2026-03-22 — Singleton class underline on canvas

### What
Added visual indicator for singleton classes on the editor-v2 canvas: the class name appears underlined when `isSingleton === true`, following UML convention.

### Files changed
| File | Change |
|------|--------|
| `frontend/src/components/editor-v2/types.ts` | Added optional `isSingleton` to `ClassNodeData` |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | Pass `isSingleton` from LClass proxy to node data |
| `frontend/src/components/editor-v2/nodes/ClassNode.tsx` | Read `isSingleton`, add `singleton` CSS class |
| `frontend/src/components/editor-v2/EditorV2.scss` | `.singleton .mm-node__name { text-decoration: underline }` |
| `frontend/src/components/editor-v2/EditorV2.tsx` | Added `isSingleton: false` to new class node data |

### Pattern
Follows the same pattern as `isAbstract` → `.abstract` → italic name. Singleton uses `.singleton` → underline name.

---

## 2026-03-21 — Surface hierarchy variables in editor-v2 _themes.scss

### What
Added surface hierarchy CSS variables (`--topbar-bg`, `--topbar-border`, `--topbar-text`, `--panel-bg`, `--panel-border`, `--sidebar-bg`, `--sidebar-border`) to both dark and light theme blocks in `_themes.scss`. Also updated light theme canvas: `--canvas-bg` from `#f8fafc` → `#f1f5f9`, `--canvas-dots` from `rgba(0,0,0,0.08)` → `rgba(100,116,139,0.25)` for more visible dot grid.

### Light theme surface values
| Variable | Value | Purpose |
|----------|-------|---------|
| `--topbar-bg` | `#1e293b` | Dark topbar (slate-800) |
| `--topbar-border` | `#334155` | Topbar bottom border |
| `--topbar-text` | `#94a3b8` | Muted topbar text |
| `--panel-bg` | `#ffffff` | White properties panel |
| `--panel-border` | `#e2e8f0` | Panel divider |
| `--sidebar-bg` | `#f8fafc` | Sidebar (slate-50) |
| `--sidebar-border` | `#e2e8f0` | Sidebar divider |

### Dark theme surface values
| Variable | Value |
|----------|-------|
| `--topbar-bg` | `#0f172a` |
| `--topbar-border` | `#1e293b` |
| `--topbar-text` | `#64748b` |
| `--panel-bg` | `#1e293b` |
| `--panel-border` | `rgba(255,255,255,0.08)` |
| `--sidebar-bg` | `#253347` |
| `--sidebar-border` | `rgba(255,255,255,0.06)` |

### STEP 4 note
Grep found no hardcoded panel/sidebar/topbar backgrounds in editor-v2 or abstract SCSS that needed migration — existing rules already use `var(--surface-*)` CSS variables. The new variables are ready for consumption by future component work.

### Files Modified
- `frontend/src/components/editor-v2/_themes.scss` — both theme blocks updated

---

## 2026-03-21 — Remove editor-v3

### What
Removed `src/components/editor-v3/` entirely and cleaned up all external references. Editor V3 was a viewpoint-first architecture experiment; editor-v2 remains the active editor.

### Deleted
- `frontend/src/components/editor-v3/` — entire directory (EditorV3Shell, EditorV3Inner, contexts, hooks, nodes, edges, panels, styles, sync, toolbar, viewpoint, types, constants)

### Modified
| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Removed `EditorV3Shell` import and `editor-v3` route |
| `frontend/src/components/abstract/tabs/EditorSwitch.tsx` | Removed `EditorV3Shell` import, `'v3'` from `EditorMode` type, localStorage v3 override, and v3 render branch |
| `frontend/src/styles/tokens/_colors-dark.scss` | Removed "editor-v3" from comment |
| `frontend/src/styles/tokens/_colors-light.scss` | Removed "editor-v3" from comment |

### Verification
- `npx tsc --noEmit`: no new errors introduced (all errors are pre-existing)

## 2026-03-21 — Editor Surface Hierarchy (visual depth)

### What
Applied visual surface hierarchy to the editor-v3 surfaces: canvas, palette, properties panel, toolbar, tree view, and panel headers. Creates clear visual layering between zones.

### Surface map applied (light theme)

| Zone | Background | Border | Notes |
|------|-----------|--------|-------|
| Canvas | `#f1f5f9` (slate-100) | — | Dot grid: `#cbd5e1` 0.8px / 14px |
| Left sidebar (palette) | `#f8fafc` (slate-50) | right `#e2e8f0` | New `--color-palette-bg` token |
| Properties panel | `#ffffff` | left `#e2e8f0` | Unchanged `--color-panel-bg` |
| Panel headers | `#1e293b` (dark) | bottom `#334155` | Text `#94a3b8` |
| Canvas toolbar | `#f8fafc` (slate-50) | `#e2e8f0` all-around | Plus existing shadow |
| Tree view panel | `#f8fafc` | left `#e2e8f0` | Updated `$color-bg-primary` |
| Nodes on canvas | `#ffffff` | — | Shadow already `rgba(0,0,0,0.06)` ✓ |

### Files modified (SCSS only)

| File | Changes |
|------|---------|
| `styles/tokens/_colors-light.scss` | `--color-canvas-bg` → slate-100, `--color-canvas-grid` → slate-300, `--color-panel-header-bg` → #1e293b (dark), `--color-panel-header-text` → #94a3b8, new `--color-palette-bg`, `--color-panel-header-border`, `--color-toolbar-border`, `--color-toolbar-bg` → slate-50 |
| `styles/tokens/_colors-dark.scss` | Added matching `--color-palette-bg`, `--color-panel-header-border`, `--color-toolbar-border` tokens |
| `editor-v3/styles/editor-v3.scss` | Canvas `.react-flow` now uses `background-color` + `background-image` (radial dot grid) + `background-size` |
| `editor-v3/styles/panels.scss` | `.v3-palette` uses `--color-palette-bg`, header borders use `--color-panel-header-border`, added `.v3-properties__type-badge` styles |
| `editor-v3/styles/toolbar.scss` | Added `border: 1px solid var(--color-toolbar-border)` |
| `TreeViewSidebar/tree-view-sidebar.scss` | `$color-bg-primary` → #f8fafc, `$color-border` → #e2e8f0 |

### TSX notes (not modified per constraints)
- **Entity type badge** (`.v3-properties__type-badge`): CSS class added but needs TSX wiring in `PropertiesPanel.tsx` to render `<span class="v3-properties__type-badge">MODEL</span>` in the header
- Editor-v2 does not use CSS custom properties from the token system — no regression risk

### Build
SCSS compiles cleanly. Pre-existing build error (Vite `import.meta.url` in react-scripts webpack) unchanged.

---

## 2026-03-21 — Centralized Entity Icons & Colors (`entityMeta.ts`)

### What
Created `frontend/src/common/entityMeta.ts` as the single source of truth for entity type icons (Bootstrap Icon names), colors, and badge letters. Migrated three high-priority files to consume it.

### New file: `frontend/src/common/entityMeta.ts`
- `EntityType` union type (15 types: metamodel, model, class, attribute, etc.)
- `ENTITY_META` record with icon, color, badgeBg/badgeText (light+dark), letter per type
- Colors sourced from `docs/DESIGN-SYSTEM.md` §2.2 (artifact types) and `tree-view-sidebar.scss` $color-* variables (sub-entity types)
- `resolveEntityType(raw)` — maps D-prefixed class names, ElementBadge strings, and palette action types to canonical `EntityType`
- Helpers: `entityIcon()`, `entityColor()`, `entityLetter()`, `entityIsAbstract()`

### Files migrated
| File | What changed |
|------|-------------|
| `TreeViewContent.tsx` | Icon letter derivation now uses `resolveEntityType()` + `entityLetter()` instead of `className.slice(1,2)`. Transformation icon uses `entityIcon('transformation')`. |
| `AdaptivePalette.tsx` | All hardcoded `bi-*` icon strings in M2_SECTIONS replaced with `entityIcon()` calls. M1 instance icon also migrated. |
| `ElementBadge.tsx` | Removed `TYPE_LETTERS` record; now uses `resolveEntityType()` + `entityLetter()` from entityMeta. |

### NOT migrated (noted for future)
- **Tree View colors** (`tree-view-sidebar.scss`): uses SCSS $color-* variables and CSS classes (`.tree-DClass`, etc.) — separate SCSS migration needed
- **element-badge.scss**: badge bg/text colors are hardcoded in SCSS, not inline — separate migration to CSS custom properties from `ENTITY_META` needed
- **tab-title.scss**: uses `::before` pseudo-elements with hardcoded colors — SCSS migration
- **Icons.tsx** (`pages/components/icons/`): action icons (undo, redo, delete), not entity types — no migration needed
- **Project.tsx**: project type icons (public/private/collaborative), not entity types — no migration needed

### Build
Zero TypeScript errors in modified files. Pre-existing errors unchanged.

---

## 2026-03-21 — Fix: Restore colored badges in Project Dashboard

### Problem
`ElementBadge` for metamodel, model, and transformation types used muted slate gray in the dashboard. The design system (`docs/DESIGN-SYSTEM.md` §2.2) defines distinct artifact type colors that should be used consistently across the UI.

### Fix (element-badge.scss only)
Updated badge colors to match **DESIGN-SYSTEM.md §2.2** canonical artifact type colors:
- **Metamodel (Violet):** `#EEEDFE` / `#534AB7` (light), `rgba(127,119,221,0.2)` / `#AFA9EC` (dark)
- **Model (Amber):** `#FAEEDA` / `#854F0B` (light), `rgba(186,117,23,0.2)` / `#FAC775` (dark)
- **Transformation (Teal):** `#E1F5EE` / `#0F6E56` (light), `rgba(29,158,117,0.2)` / `#5DCAA5` (dark)
- Viewpoint (Pink) was already correct — no change needed

### Files Modified
- `frontend/src/components/common/element-badge.scss` — updated metamodel, model, transformation/epsilon colors (light + dark mode)

---

## 2026-03-21 — Fix: Context menu missing background/border in Project Dashboard

### Problem
The ⋮ context menu on metamodel/model rows in the project dashboard rendered without background, border, or box-shadow — text was unreadable over the list content.

### Root Cause
CSS specificity collision: `contextMenu/style.scss` defines a generic `.context-menu` using CSS custom properties (`var(--color-bg-elevated)`, etc.) that aren't defined in the project dashboard context. Since both definitions have equal specificity, load order determined the winner, and the generic one (with unresolved variables) won.

### Fix (project-editor.scss only)
Scoped `.context-menu` under `.project-editor` (both light and dark mode blocks) to increase specificity and guarantee the hardcoded project-dashboard styles always win.

### Files Modified
- `frontend/src/components/project/project-editor.scss` — changed `.context-menu` to `.project-editor .context-menu` (lines 535 and 949)

---

## 2026-03-19 — Fix: Properties panel empty when metamodel is empty or nothing selected

### Problem
When a metamodel had no elements (empty) or when clicking the canvas to deselect, the Properties panel showed nothing. `_lastSelected.modelElement` was either `undefined` (deselectAll else branch) or not set at all (useEffect guard skipped when `findModelElement` returned falsy for empty models).

### Root Cause
1. **useEffect:** `findModelElement()` returns a class/package ID, but for empty metamodels there are none. The `if (modelElement)` guard prevented setting `_lastSelected` at all.
2. **deselectAll else branch:** When `findModelElement` returned null/undefined, the code set `_lastSelected` to `undefined`, which meant Info.tsx received no `dataID` and rendered the empty state.

### Fix (useJjomSelection.ts only)
1. **useEffect:** Removed the `if (modelElement)` guard. Now always sets `_lastSelected` with `modelElement ?? modelid` — falls back to the model ID itself.
2. **deselectAll else branch:** Instead of setting `undefined`, sets `modelElement: modelid` — points to the model itself.

### Why it works
`Info.tsx` receives `dataID = modelid`, resolves it via `LModelElement.fromPointer(modelid)` which returns the `LModel` root, and renders `PropertiesOverview` with the metamodel stats.

### Files Modified
- `frontend/src/components/editor-v2/hooks/useJjomSelection.ts` — two changes (useEffect fallback + deselectAll else branch)

### Build Verification
- TypeScript: no new errors (`npx tsc --noEmit`)
- Pre-existing errors in DockManager.ts:237, MetamodelTab.tsx unchanged

---

## 2026-03-19 — Rollback: revert "Properties panel shows model overview" (caused white page)

### What happened
The previous change added a DockManager-based fallback in `mapStateToProps` (Info.tsx) to show the active model's overview when nothing was selected. This caused a white page on load — `LModel.fromPointer(activeId)` likely threw before DockManager was fully initialized, despite the try/catch.

### Rollback
- Removed the `// When nothing is selected` block from `mapStateToProps`
- Removed the `DockManager` import
- `mapStateToProps` restored to its original form (just nodeID/viewID/dataID + topics + advanced)

### Files Modified
- `frontend/src/components/editors/Info.tsx` — reverted to original `mapStateToProps`

---

## 2026-03-19 — UI polish: empty state scrollbar + minimal resize handle

### Fix 1: No scrollbar when "No element selected"
**Problem:** The Properties panel showed a scrollbar even when displaying the empty state (no element selected). The `.properties-panel` rule had `overflow-y: auto` which created a scrollbar when the empty state content was slightly taller than the container.
**Fix:** Added `.properties-panel--empty { overflow: hidden; }` inside `.properties-panel-container` in `properties-with-tree-view.scss`. The `--empty` class is already applied by Info.tsx when no element is selected.

### Fix 2: Minimal resize handle
**Problem:** The resize handle used a 16px grip icon with cyan hover effects — visually heavy and inconsistent with the app's minimal aesthetic.
**Fix:** Replaced with a 1px line design:
- Visually: 1px line in `#e2e8f0` (slate-200), becomes `#94a3b8` (slate-400) on hover
- Hit area: 5px (transparent padding around the line)
- Supports both `horizontal` (row-resize) and `vertical` (col-resize) orientations via `orientation` prop
- No decorative elements (no grip dots, no icon, no shadow)
- Removed debug console.log statements
- Simplified keyboard handling (removed synthetic mouse event hack)

### Files Modified
- `frontend/src/components/editors/properties-with-tree-view.scss` — added `overflow: hidden` for empty state
- `frontend/src/components/ResizeHandle/ResizeHandle.tsx` — simplified to minimal divider with orientation prop
- `frontend/src/components/ResizeHandle/resize-handle.scss` — rewritten: 1px line + 5px hit area

---

## 2026-03-19 — Refactor: remove duplicate editor-type-change dispatch from Dock.tsx

### Problem
`editor-type-change` was dispatched from three places: `DockManager.open2()`, `_detectActiveTabChange()` in MyRcDock.tsx, and `handleLayoutChange` in Dock.tsx. The Dock.tsx dispatch was redundant (and had the same `state[activeId]` bug) now that MyRcDock catches all tab switches via `componentDidUpdate`.

### Changes
- Removed the `editor-type-change` dispatch block from `handleLayoutChange` in Dock.tsx. Kept only `jjodel:active-tab` (StatusBar) and `data-active-tab` (documentation panel hiding).
- Removed the `setTimeout` initial dispatch block — `_detectActiveTabChange()` fires on first `componentDidUpdate` and handles initial detection.
- Removed unused `store` and `LProject` imports.

### Dispatch points after this change
- `DockManager.open2()` — card click opens model/metamodel
- `DockManager.openDocumentation()` — opens documentation tab
- `DockManager.openTransformation()` — opens transformation tab
- `_detectActiveTabChange()` in MyRcDock.tsx — all tab switches (componentDidUpdate)

### Files Modified
- `frontend/src/components/abstract/Dock.tsx` — removed redundant dispatch, cleaned imports

---

## 2026-03-19 — Fix: click on active tab hides panels

### Problem
Clicking the already-active tab caused panels (TreeView, Properties) to disappear. The `_detectActiveTabChange()` method treated `DockComponent_rightbar_*` IDs as real editor switches, dispatching `editorType: 'summary'` which collapsed the panels via CSS.

### Root Cause
When rc-dock internally refocuses the first panel, `activeId` can momentarily resolve to a `DockComponent_rightbar_*` tab. `_detectActiveTabChange()` processed this as a real tab change and dispatched a `summary` editor type, triggering the CSS rules that hide TreeView and Properties panels.

### Fix
Added an early return guard in `_detectActiveTabChange()` to ignore `DockComponent_rightbar_*` IDs entirely — these are internal rc-dock artifacts, not real editor switches.

### Files Modified
- `frontend/src/components/dock/MyRcDock.tsx` — added `DockComponent_rightbar_` guard

---

## 2026-03-19 — Fix: _detectActiveTabChange resolves metamodel/model correctly

### Problem
`_detectActiveTabChange()` in MyRcDock.tsx always resolved model/metamodel tabs as `summary`. When clicking a metamodel tab, the `[DETECT]` log showed `editorType: 'summary'` instead of `editorType: 'metamodel'`.

### Root Cause
The Redux store lookup used `store.getState()[activeId]` which is always `undefined`. Jjodel's Redux store does not store objects as top-level keys — they live under `state.idlookup[id]`.

### Fix
Changed `store.getState()[activeId]` → `store.getState().idlookup[activeId]` in `_detectActiveTabChange()`. This matches the pattern used throughout the codebase (see `DPointerTargetable.from()` in `joiner/classes.ts:1454`).

**Note:** The same bug exists in `Dock.tsx` (lines 267 and 382) but was not fixed per instructions to only modify MyRcDock.tsx.

### Files Modified
- `frontend/src/components/dock/MyRcDock.tsx` — fixed `idlookup` access in `_detectActiveTabChange()`

### Build Verification
- TypeScript: no errors (`npx tsc --noEmit`)

---

## 2026-03-19 — Fix: tab click now dispatches jjodel:editor-type-change

### Problem
Clicking an existing rc-dock tab to switch to it bypassed `DockManager` entirely. The `jjodel:editor-type-change` event was only dispatched by `DockManager.open2()` (new tab creation) and the `onLayoutChange` prop in Dock.tsx. However, rc-dock does not always fire `onLayoutChange` for simple tab switches within the same panel (treats them as "silent changes").

### Root Cause
rc-dock's `onLayoutChange` callback fires on structural layout changes (add/remove/move tabs) but may not fire when only the `activeId` changes within a panel. Tab clicks update `activeId` without changing the layout structure.

### Fix
Overrode `componentDidUpdate` in `PinnableDock` (MyRcDock.tsx) to detect active tab changes after every state update:
- Added `_lastActiveId` field to track the previous active tab ID
- Added `_detectActiveTabChange()` method that reads the current layout's `activeId` for the first (models) panel
- Only dispatches `jjodel:editor-type-change` when `activeId` actually changes (prevents redundant dispatches)
- Uses the same editor type detection logic as Dock.tsx: `jjtl_*` → transformation, `doc_*`/`DockComponent_rightbar_*` → summary, otherwise checks Redux store for DModel

### Why `componentDidUpdate` works
`componentDidUpdate` fires after every React state update, including rc-dock's internal `setState` when a tab is clicked. This catches ALL tab changes regardless of whether rc-dock considers them "silent" or not.

### Dispatch deduplication
- `_lastActiveId` prevents duplicate dispatches on re-renders that don't change the active tab
- When `open2()` creates a new tab and dispatches, `componentDidUpdate` may also fire — the double dispatch is harmless (listeners are idempotent)
- The `open2()` dispatch was intentionally kept per user request

### Files Modified
- `frontend/src/components/dock/MyRcDock.tsx` — added `store` import, `_lastActiveId` field, `_detectActiveTabChange()` method, call in `componentDidUpdate`

### Build Verification
- TypeScript: no new errors from MyRcDock.tsx (`npx tsc --noEmit`)

---

## 2026-03-19 — Rollback: revert tab-switch fix that broke card flow

### What happened
A previous attempt to fix "tab click not updating panels" added:
1. `resolveEditorType()` + dispatch in `DockManager.open()` found branch
2. `currentTabId` fallback in `Dock.tsx handleLayoutChange`
3. Removed debug logs from multiple files

This broke the working card→panel flow.

### Rollback
- **DockManager.ts**: Removed `resolveEditorType()`, removed dispatch in found branch, removed `store` import. Kept Session 1's duplicate tab guard (`updateTab` + early return).
- **Dock.tsx**: Reverted to HEAD (Session 1 debug logs were the only diff; removing them restored HEAD state which already has full `handleLayoutChange` + editor type detection).
- **Dashboard.tsx**: Minor debug log removal kept (functionally identical).
- **TreeViewPanelContext.tsx**: Minor debug log removal kept (functionally identical).

### Current state: card=✅, tab=❌
Card flow works: `open2()` → `open()` (guard or dockMove) → `open2()` dispatches `editor-type-change`.
Tab click flow broken: clicking a tab in rc-dock tab bar doesn't go through `DockManager` — relies on `onLayoutChange` in Dock.tsx which may not fire for tab switches.

### All `editor-type-change` dispatch/listen points
**Dispatchers:**
- `DockManager.ts:102` — `open2()` after opening model/metamodel
- `DockManager.ts:132` — `openDocumentation()` existing tab
- `DockManager.ts:154` — `openDocumentation()` new tab
- `DockManager.ts:237` — `openTransformation()` existing tab
- `DockManager.ts:266` — `openTransformation()` new tab
- `Dock.tsx:273` — initial type detection on mount (setTimeout)
- `Dock.tsx:393` — `handleLayoutChange` (via `onLayoutChange` prop)
- `Dashboard.tsx:259` — GenericDashboard mount (dispatches 'summary')

**Listeners:**
- `Dock.tsx:253` — sets `body[data-editor-type]`
- `TreeViewPanelContext.tsx:186` — auto-opens tree view for modeling editors

---

## 2026-03-19 — Properties Panel & Navbar: duplicate key, visibility, persistence fixes

### Bug 1: Duplicate key warning in Navbar (DockManager.ts)
**Symptom:** `Warning: Encountered two children with the same key` in NavbarComponent when opening metamodels.
**Root Cause:** `DockManager.open()` called `dockMove()` without checking if a tab with the same ID already existed. Opening the same metamodel twice added a duplicate tab to rc-dock. The Navbar syncs tabs from rc-dock and rendered both with the same key.
**Fix:** Added a guard in `DockManager.open()` that checks `dock.find(tab.id)` before adding. If the tab exists, it activates it via `updateTab()` instead. This matches the pattern already used by `openDocumentation()` and `openTransformation()`.

### Bug 2: Properties Panel empty on first metamodel open (PropertiesWithTreeView.tsx)
**Symptom:** Opening a metamodel for the first time showed an empty Properties panel. Second open worked.
**Root Cause:** `PropertiesWithTreeView` had an early return (`return <div className="...--empty" />`) when `activeEditorType` was not `model`/`metamodel`. On first open, the `jjodel:editor-type-change` event hadn't fired yet (async), so the component rendered the empty div. By the second open, the state was already set.
**Fix:** Removed the early-return guard for non-modeling editors. The component now always renders its full content. Right panel visibility for non-modeling contexts is handled at the CSS level (see Bug 3).

### Bug 3: Properties Panel persists on dashboard + aria-hidden error (style.scss)
**Symptom:** Returning to dashboard left the Properties panel visible. Also caused `aria-hidden on element because its descendant retained focus` error.
**Root Cause:** The right panel was always present in the rc-dock layout. Visibility was only controlled by internal conditional rendering (`{isModelingEditor && ...}`), but rc-dock keeps unmounted tab content hidden with `visibility:hidden` — not removed. Focus could remain trapped in the hidden panel.
**Fix:** Added CSS rules for `body[data-editor-type="summary"]` and `body[data-editor-type="transformation"]` that collapse the right panel (width: 0, opacity: 0, pointer-events: none). Same pattern already used for `data-active-tab="documentation"` and `data-layout-mode="canvas-only"`. The `data-editor-type` attribute is already managed by Dock.tsx's `handleLayoutChange` and the Dashboard's mount effect.

### Files Modified
- `frontend/src/components/abstract/DockManager.ts` — duplicate tab guard in `open()`
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` — removed empty-div early return, removed unused `activeEditorType`/`isModelingEditor`
- `frontend/src/components/abstract/style.scss` — CSS rules for summary/transformation editor types

### Build Verification
- TypeScript: no new errors in modified files (`npx tsc --noEmit`)
- Pre-existing error in DockManager.ts:237 (`openTransformation` method) unchanged

---

## 2026-03-17 — Documentation Tab UI Fixes

### Changes

**1. Fix toolbar buttons compression (DocumentationTab.scss)**
- Added `flex-shrink: 0`, `flex-wrap: nowrap`, `overflow-x: auto` to `.toolbar-right` — prevents buttons from being squeezed
- Added `white-space: nowrap`, `flex-shrink: 0` to `.toolbar-btn` — prevents label text from wrapping or overlapping icons
- Added `flex-shrink: 0` to button icons (`i` elements)
- Added `flex-shrink: 0` and `white-space: nowrap` to `.provider-selector` and `.provider-btn`

**2. Hide Properties panel when Documentation tab is active (Dock.tsx, style.scss)**
- In `Dock.tsx` `handleLayoutChange`: detect when active tab is a documentation tab (`activeId === 'documentation'` or starts with `doc_`) and set `body[data-active-tab="documentation"]`
- In `style.scss`: added CSS rule for `body[data-active-tab="documentation"]` that hides the right panel (same pattern as `canvas-only` mode)
- Properties panel is only hidden while Documentation is the active tab; switching to any other tab restores it

### Files Modified
- `frontend/src/components/abstract/tabs/DocumentationTab.scss` — toolbar button spacing fixes
- `frontend/src/components/abstract/Dock.tsx` — active tab detection for documentation
- `frontend/src/components/abstract/style.scss` — CSS rule to hide right panel for documentation

### Build Verification
- TypeScript: no errors in modified files (`npx tsc --noEmit`)
- SCSS: compiles without errors
- Note: `npm run build` fails due to pre-existing Monaco `import.meta.url` / webpack incompatibility (unrelated)

---

## 2026-03-17 — Fix toolbar buttons still compressed (CSS specificity)

### Root Cause
The previous fix added correct properties to `.toolbar-btn` but they were overridden by a **global** `.toolbar-btn` in `EditorV2.scss` (line 225) which sets `width: 28px; height: 28px`, forcing all toolbar buttons to be 28×28px icon-only squares.

Multiple files define global `.toolbar-btn`: `EditorV2.scss`, `catalog.scss`, `console-tab.scss`, `bottomToolbar.scss`, `logger.scss`. CSS load order made one of these win over the DocumentationTab definition.

### Fix
Scoped all toolbar-related selectors (`.toolbar-left`, `.toolbar-right`, `.toolbar-title`, `.toolbar-btn` and variants) **under `.documentation-toolbar`** parent selector. This gives them higher specificity (`.documentation-toolbar .toolbar-btn` beats global `.toolbar-btn`).

Also added explicit `width: auto; height: auto` to reset the 28×28px constraint from EditorV2.

Dark mode overrides for `.toolbar-btn` also scoped under `.documentation-toolbar`.

### Files Modified
- `frontend/src/components/abstract/tabs/DocumentationTab.scss` — nested toolbar selectors under `.documentation-toolbar`
