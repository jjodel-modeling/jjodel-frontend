# Discovery — Console multi-linguaggio: mappa del routing attuale per il refactor `LanguageRegistry`

**Data:** 2026-07-11 (Fase 1, read-only)
**Tipo:** discovery read-only. NESSUNA implementazione, nessuna modifica al sorgente.
**Branch:** alfonso-frontend-jjtl
**Metodo:** lettura diretta dei file di routing/console + 3 subagent Explore (rendering/input, provider-registry/eventi, test/dipendenze/collisioni).

> ⚠️ **Correzione di premessa (CLAUDE.md §5/§discovery: segnalare i conflitti).** Il prompt descrive la disambiguazione attuale come "prima-parola (`isJjScriptCommand`) **più alcuni special-case (extends infisso, `abstract`, `let`)**". L'analisi mostra che gli special-case `extends`-infisso / `abstract` / `let` vivono nel **parser** JjScript (`parser.ts`), **non** nel gateway. Il gateway (`isJjScriptCommand`) è una pura whitelist a prima-parola e **non** riconosce `extends`/`abstract`/`let`/`export`/`import`: quegli input cadono all'LLM. Questo *è* la radice della fragilità, non un mitigante. Dettaglio in §A1/§A5.

---

## Obiettivo

Mappare fedelmente routing + console + rendering attuali per progettare (in Fase 2, in chat) la sostituzione del gateway euristico con un multiplexer a registro di `LanguageProvider`.

---

## File letti/analizzati

Routing / servizi:
- `frontend/src/jjscript/services/JjScriptService.ts` (gateway `isJjScriptCommand`, `execute`, `formatResultForChat`)
- `frontend/src/jjscript/index.ts`, `frontend/src/jjscript/types.ts` (COMMANDS, ExecutionResult), `frontend/src/jjscript/executor/executor.ts` (executeCommand), `frontend/src/jjscript/parser/parser.ts` (special-case infissi), `frontend/src/jjscript/autocomplete/context.ts`, `frontend/src/jjscript/executor/errors.ts`
- `frontend/src/jjscript/executor/commands/eval.ts` (eval JjEL da JjScript)
- `frontend/src/jjel/index.ts` (superficie JjEL riusabile)
- `frontend/src/services/AIProviderService.ts` (chiamata LLM)

Console UI / stato:
- `frontend/src/components/Jodie/Jodie.tsx` (submit chat/code, consoleMode, promozioni, Cmd+J)
- `frontend/src/components/Jodie/JodieWindow.tsx`, `JodieHeader.tsx`, `ChatInput.tsx`, `ChatMessages.tsx`
- `frontend/src/components/Jodie/jodieJjelContext.ts` (eval JjEL Code-mode)
- `frontend/src/components/Jodie/CommandPalette.tsx` (scaffold morto)
- `frontend/src/types/jodie.ts` (ChatMessage/CodeEntry/ConsoleEntry/ConsoleMode + AI registry `AI`/`AIConfig`/`JodieConfig`)

Estensibilità / rischi:
- `frontend/src/events/registry.ts`, `frontend/src/hooks/useInterfaceMode.ts`
- `frontend/src/jjscript/__tests__/*`, `frontend/coevolution-tests/m2-reference-delete.test.ts`
- `frontend/src/components/GlobalSearch/GlobalSearch.tsx`, `frontend/src/pages/components/catalog/Catalog.tsx`, `frontend/src/utils/keyboardShortcuts.ts`, `frontend/src/services/JjodieCommandParser.ts` (dead code)

---

## A. Routing attuale

### A1. `isJjScriptCommand` — logica completa e keyword esatti

`JjScriptService.ts:24-56`.
- `:24-37` `isJjScriptCommand(message)`: trim; se inizia con `/` (prefisso "explicit command"), toglie lo slash e applica `startsWithCommand`; altrimenti applica `startsWithCommand` sul trimmed.
- `:42-56` `startsWithCommand(text)`: guarda **solo la prima parola** (`text.split(/\s+/)[0].toLowerCase()`) contro:
  - `commands = ['create','delete','rename','set','add','remove','move','copy','list','show','help','undo','redo','validate','clear','eval']` (`:43-47`) — **16 comandi**.
  - `jjelTriggers = ['forall','exists','with']` (`:52`) — trigger JjEL, ritornano true.

**Nessun special-case per `extends` infisso / `abstract` / `let` in questo file.** Il "fix del gateway" (per far eseguire `Person extends NamedElement`) **NON è presente**: `startsWithCommand('Person extends …')` → prima parola `person` → non è comando → `false` → LLM. Il `/`-prefix **non salva** questi casi: `/abstract Foo` → toglie `/`, prima parola `abstract` → non in lista → `false`; `/Person extends Y` → prima parola `person` → `false`. Quindi il `/` non è un escape "forza-JjScript": applica la stessa whitelist.

**Divergenza dei vocabolari di comando (rischio di manutenzione).** Il gateway ha una lista *hardcoded, disallineata* dalla lista canonica del parser:
- Canonica `types.ts:570-575` (22): `create delete rename set add remove move copy list show help undo redo clear export import validate extends eval let forall abstract`.
- Gateway `JjScriptService.ts:43-52` (16 + 3 jjel): manca **`export import extends let abstract`**; ha in più `exists`,`with` (JjEL).
- Altre due liste duplicate: autocomplete `autocomplete/context.ts:57` (15, senza `eval`) ed executor `executor/errors.ts:89` `VALID_COMMANDS` (8). **≥4 liste di comandi non sincronizzate.**

Conseguenza concreta: `let x = …`, `abstract Foo`, `export …`, `import …` (tutti parse-abili) digitati in chat → gateway rifiuta → LLM li *descrive*. Falsa conferma di uno stato mai applicato.

### A2. Flusso submit e caller del gateway

Caller di `isJjScriptCommand`: **unico reale = `Jodie.tsx:375`** (l'occorrenza `jjscript/index.ts:16` è un commento-esempio nel docstring, non codice). CONFERMATO "unico caller Jodie.tsx:375".

Topologia dei due submit (in `Jodie.tsx`, selezione per `consoleMode`, wiring `:651`/`:666` → JodieWindow → ChatInput):
- **Chat mode** → `handleSendMessage` (`:373-558`):
  - `:375` `if (isJjScriptCommand(content))` → ramo JjScript: push user msg (kind 'chat'), `await JjScriptService.execute(content)` (`:394`), `formatResultForChat` (`:397`), assistant msg con `jjscriptResult:{success,command}` (`:405-408`). Errore → assistant msg d'errore.
  - `:437+` else → ramo LLM: valida/auto-switch provider (`:442-479`), push user msg, `AIProviderService.chat(...)` (`:523`), assistant msg con `provider` (`:526-533`).
- **Code mode** → `handleSubmitCode` (`:307-326`): `evaluateJjelInJodie(input)` (JjEL) → `CodeEntry` (kind 'code').

Non esiste altro punto di routing: in chat solo `isJjScriptCommand` decide JjScript-vs-LLM; in code solo JjEL.

### A3. Invocazione LLM (Jjodie)

`AIProviderService.chat(...)` — `services/AIProviderService.ts:32-107`. **`static async`, NON-streaming**, ritorna `Promise<string>` (attende l'intera risposta HTTP; estrazione per provider es. Claude `data.content[0].text` `:217`, OpenAI `data.choices[0].message.content` `:159`; Ollama `stream:false` `:622`). Consumata a `Jodie.tsx:523`; la stringa va verbatim in `assistantMessage.content` (`:526-533`). Provider scelto via `AIConfig.getPreferred('chat')`/`activeProvider`, modello via `AIConfig.getPreferredModel('chat')` (`:522`). Storia filtrata a `ChatMessage[]` con `isChatEntry` (`:502`); RAG opzionale (`JjodieRagService.getAugmentedContext`, `:508`).

### A4. JjEL dalla console — entry point esistente

**Sì, esiste già (Code mode).** `jodieJjelContext.ts:64` `evaluateJjelInJodie(expression)` → `jjelEvalWithDiagnostics(expression, variables)` (da `src/jjel`, `:13/:67`); variabili da `buildEvalContext` (da `src/jjscript`, `:11/:39`) — **stessa shape** dell'`eval` JjScript e della console JjEL standalone. Ritorna `JjelEvalOutcome {ok, text, value?, warnings}` (`:49-61`).

Superficie JjEL riusabile come provider (`jjel/index.ts`): `jjelEval(source,vars?)` (`:74-90`), `jjelEvalWithDiagnostics(source,vars?)→{value,warnings}` (`:124-140`), `JjelEvaluator`, `parse`, `isValidJjel`, `getJjelErrors`. **Un solo `JjelEvaluator`** dietro entrambe le vie: JjScript `eval` (`executor/commands/eval.ts:22-38`, `jjelEval`) e console (`jjelEvalWithDiagnostics`) — differiscono solo perché la console usa la variante con diagnostics. `buildEvalContext` è la sorgente comune delle variabili.

Doppia via JjEL da considerare in Fase 2: (1) Code-mode diretto; (2) in Chat-mode via `eval <expr>` o `forall/exists/with …` che il gateway instrada a `JjScriptService.execute` → executor `eval`.

### A5. Executor JjScript + special-case infisso del parser

Entry executor: `executor/executor.ts:337` `export async function executeCommand(...)` (usato da `JjScriptService.execute` `:90`).

Special-case **nel parser** (`parser/parser.ts`), raggiungibili solo *dopo* che il gateway ha scelto JjScript:
- `abstract <Target>` (`:140-151`) — `abstract` seguito da identificatore ≠ `class`.
- **`ChildClass extends ParentClass`** (`:153-159`) — primo token identifier/qualified-name + next `extends` → comando `extends`.
- `do … end` block (`:161-167`); `let` (`:227`, corpo `:846-888`).

Il gap è qui: il **parser** sa parsare `X extends Y`, `abstract X`, `let …`, ma il **gateway** non li instrada mai al parser (prima-parola non in whitelist). Parser capace ⟂ gateway cieco.

---

## B. Stato e UI della console

### B6. Componenti e shape dello stato

Componente radice `Jodie.tsx` (`Jodie()` `:58`). Stato chat: `chatState: ChatState { messages: ConsoleEntry[], isOpen, isMinimized, isWaiting, hasUnread }` (`:63-69`). **`messages` è un array unificato** `ConsoleEntry = ChatMessage | CodeEntry` (`types/jodie.ts:914`), discriminato da `kind`.
- `ChatMessage` (`jodie.ts:853-868`): `kind?:'chat'`, `role`, `content`, `provider?` (tag AI), `jjscriptResult?:{success,command}` (tag JjScript), `images/documents`.
- `CodeEntry` (`jodie.ts:878-896`): `kind:'code'`, `flavor:'jjel'|'js'`, `input`, `output:{ok:true,value}|{ok:false,error}`, `warnings?`, `rawValue?`.
- Discriminatori `isCodeEntry`/`isChatEntry` (`jodie.ts:916-922`).

**Esiste già una nozione di "modo"**: `ConsoleMode='chat'|'code'` + `CodeFlavor='jjel'|'js'` (`jodie.ts:874-875`; JS riservato/disabilitato). Stato in `Jodie.tsx:86-87`, **persistito in localStorage** (`CONSOLE_MODE_KEY='jjodel.console.mode'` `:38`, via `useLocalStorageString` `:42`). Toggle **Cmd/Ctrl+J** (`:283-303`). Promozioni fra modi: `handleTestInCode` (chat→code, prefill snippet, `:330-337`), `handleAskJjodie` (code-fallito→chat, prefill template errore, `:341-347`). Clear per-modo `handleClearCurrentMode` (`:589-607`).

> ⚠️ **Conflitto col design.** Il design vuole "modo sticky **entro la sessione**, boot sempre da Jjodie, **non persiste tra riaperture**". Il `consoleMode` **attuale persiste** in localStorage tra riaperture. Da riconciliare in Fase 2 (vedi domande aperte).

### B7. Badge "Test in console mode" e concetto di "console mode"

Il badge è a livello di messaggio in `ChatMessages.tsx:126-135` (non nel renderer del code-block): classe `jodie-promote-btn`, icona `bi-arrow-right-square`, **testo letterale `Test in console mode`** (`:133`), `title="Switch to console mode and prefill this snippet"`. Mostrato solo per reply assistant non-user, non-JjScript, con un code-block estratto (`extractFirstCodeBlock` `:33-40`, `promoteCodeBlock` `:63`). onClick → `onTestInCode(content, language)` → `handleTestInCode` (`Jodie.tsx:330`): `setConsoleMode('code')`, `setCodeFlavor('jjel')`, prefill (nessun auto-run). I renderer di code-block (`EnhancedMarkdown.tsx:145-189`, `common/MarkdownRenderer.tsx:66-176`) **non** hanno questo badge (solo header lingua / copy / un "run JjScript" separato).

**Sì, "console mode" esiste già** (§B6). Il refactor dovrà riusarlo/generalizzarlo, non introdurlo da zero.

### B8. Rendering dei result card

`ChatMessages.tsx`. Split di primo livello (`:386-397`): `isCodeEntry(entry)` → `<CodeReplEntry>` (`:388`); altrimenti `<MessageBubble>` (`:390-395`). Dentro `MessageBubble`, flag derivati (`:52-56`): `isUser`, `providerInfo=message.provider?AI[provider]:null`, `isJjScript=!!message.jjscriptResult`, `jjScriptSuccess`.
- **Card AI/"Claude"** (provider, assistant, no jjscriptResult): avatar `ProviderIcon` con `providerInfo.bgColor/.color` (`:84-91`); footer con `providerInfo.name`/colore (`:141-148`); contenuto via `MarkdownMessage` (`:118-124`).
- **Card JjScript** ("Deleted"/"Class created"): avatar `jodie-jjscript-avatar` + success/error (icona `bi-check-lg`/`bi-x-lg`, `:78-82`); bubble `jodie-jjscript-bubble(-success/-error)` (`:93`); footer label letterale `JjScript` colorata (`:149-153`). Tutto keyato su `jjscriptResult.success`; `command` non mostrato qui.
- **Card Code (REPL)** `CodeReplEntry` (`:160-227`): prompt `›` + `input` + badge `flavor` (`:170-174`); output/errore (`:175-189`); **inline JjEL inspector** `JjelValueInspector` su `rawValue` con chevron (`:177-195`); warnings per `w.kind` (`:196-212`); bottone "Ask Jjodie" solo su errore (`:213-222`).

Props promozione di `ChatMessages` (`:17-26`): `onTestInCode(code,language)`, `onAskJjodie(entry)`. `ChatMessages` **non** riceve `consoleMode` (vive in `Jodie.tsx`); mode/flavor vanno a `ChatInput`/`JodieHeader`.

### B9. Keyboard handling nell'input

`ChatInput.tsx` `handleKeyDown` (`:330-450`):
- **Backtick** `` ` `` a input vuoto in chat → `onConsoleModeChange('code')` (`:339-344`). Unico mode-switch da tastiera nell'input.
- Autocomplete (solo Code+JjEL): ArrowDown/Up, Tab/Enter accetta, Escape chiude (`:348-374`).
- **Enter** submit / **Shift+Enter** newline (`:376-397`); bypass esatto `/clear` (`:382-385`).
- History nav ArrowUp/Down con guardie caret (`:415-449`); Escape ripristina draft solo in history-nav (`:401-408`).
- **`Cmd/Ctrl+K`: LIBERO nell'input** (nessun handler meta/ctrl salvo backtick). **`Ctrl+.`: LIBERO.** **Leading `/`: nessun menu**; solo il match esatto `/clear` a submit-time (`:281-288`,`:382-385`).

---

## C. Estensibilità e convenzioni locali

### C10. Pattern registry/provider esistenti + custom events

**Precursore più vicino = il registro dei provider AI** (`types/jodie.ts`):
- Descrittori: `class AI` (`:142-238`) registrati per side-effect di costruzione (`(AI as any)[name]=this` `:185-191`), decorati fluent con `.add(modelId,label,pdf,vision,deprecated,ctx)` che popola `versions` (`:201-205`); istanze a load `:260-271`; enumerazione `ALL_AI_PROVIDERS` (`:77`); accessor `AI.get(p)`/`AI[p]`.
- Config per-provider: `class AIConfig` (`:407-729`), `isConfigured()` (`:721`) = test "abilitato".
- Aggregato/enumerazione abilitati: `JodieConfig.getEnabledProviders()` (`:819-825`).
- **Selezione per-feature** (analogo a "quale provider per il modo X"): `AIFeature='documentation'|'chat'|'scriptblock'|'mappings'|'explain'` (`:80`); `AIConfig.getPreferred(feature)` (`:461-475`) con fallback **first-enabled** (`:482-486`); `setPreferred(...)` persiste **e dispatcha `AIEvents.SETTINGS_CHANGED`** (`:504`). Nessun default globale (migrato via `migrateGlobalDefaultToPerFeature` `:642`).
- UI selezione: `Jodie/ProviderSelector.tsx` + `common/ProviderSelector.tsx`/`ProviderModelSelector.tsx`.

Questa è la forma da rispecchiare per `LanguageRegistry` (provider = {id, descrittore, entry-point, default per-scope, evento su cambio). Entry-point naturali per provider: **JjEL** → `jjelEvalWithDiagnostics`+`buildEvalContext`; **JjScript** → `executeCommand`/`JjScriptService`; **Jjodie** → `AIProviderService.chat`.

**Custom DOM events** (`events/registry.ts`, gruppi `:7-102`): `JjodelEvents`, `JjScriptEvents` (EXECUTED ecc.), `AIEvents` (PROVIDER_CHANGED/SETTINGS_CHANGED), `JjodieEvents` (OPEN, METAMODEL_UPDATED), `SystemEvents` (INTERFACE_MODE_CHANGE). **Non esiste un evento "console mode switch"**: il modo è React-state+localStorage+props, non annunciato via evento. Pattern emit-azione/consume-via-CustomEvent **esiste**: `hooks/useInterfaceMode.ts:87,96` fa `dispatchEvent(new CustomEvent(SystemEvents.INTERFACE_MODE_CHANGE,{detail:{mode}}))` e altri ascoltano — **è esattamente l'analogo** per uno "switch annunciato da Jjodie" (aggiungere un membro a un gruppo del registry e dispatchare con `detail`). Jodie già partecipa al bus (ascolta `JjodieEvents.OPEN` `:146`, `EDITOR_TYPE_CHANGE` `:211`, `AIEvents.SETTINGS_CHANGED` `:245`; dispatcha `JjScriptEvents.EXECUTED` `:578`).

**Scaffold riusabile/da rimuovere:** `Jodie/CommandPalette.tsx` esiste ma è **dead code** (zero importer, mai montato; ha un proprio `handleKeyDown` ma nessun binding). Base possibile per il picker `Cmd/Ctrl+K` — oppure da eliminare.

### C11. Test attorno al gateway/console

**Il gateway NON è testato.** Zero file citano `isJjScriptCommand`/`JjScriptService`/`formatResultForChat`/`ConsoleMode`/`isChatEntry`. I test coprono il livello *sotto* il gateway:
- `jjscript/__tests__/`: `parser.test.ts`, `grammar.test.ts`, `lexer.test.ts`, `commands.test.ts`, `context-binding.test.ts`, `elementWaiter.test.ts`, `handleRegistry.test.ts`, `scriptValidator.test.ts`.
- `coevolution-tests/m2-reference-delete.test.ts` (delete M2, non tocca il gateway).

Implicazione: sostituire la disambiguazione a prima-parola **non richiede aggiornare test esistenti**, ma non c'è rete di sicurezza — la copertura va scritta da zero.

---

## D. Rischi e dipendenze

### D12. Cosa dipende dalla forma del gateway

**Superficie esterna da preservare = 3 metodi**: `isJjScriptCommand` (`Jodie.tsx:375`), `execute` (`Jodie.tsx:394`, `ChatMessages.tsx:344`), `formatResultForChat` (`Jodie.tsx:397`). Nessun caller esterno usa `parseCommand/getSuggestions/getHistory/...` (interni a `JjScriptService`).

**Tipi console** (`types/jodie.ts`) consumati da 5 componenti Jodie: `Jodie.tsx`, `JodieWindow.tsx`, `JodieHeader.tsx` (toggle chat `:196`/code `:206`/jjel `:298`), `ChatInput.tsx` (filtri history `:151/:156`, switch `:342`), `ChatMessages.tsx` — **più** `services/AIProviderService.ts` che consuma `ChatMessage[]` (rompe se cambia la shape di `ChatMessage`).

**`ExecutionResult` JjScript** (`jjscript/types.ts:448-457`): `{success,command,message,data?,errors?,warnings?,affectedElements?,undoable?}`. Campi letti esternamente da preservare: **`.success`,`.command`,`.message`,`.warnings`** (`formatResultForChat` `:164-414`; `Jodie.tsx:406-407`; `ChatMessages.tsx:347-349`). ⚠️ Distinto dall'omonimo `ExecutionResult` JjTL (`jjtl/executor/executor.ts:293`) — il refactor tocca solo quello JjScript.

### D13. Collisioni prefissi e shortcut

- **`Cmd/Ctrl+K`: COLLIDE (2 binding esistenti).** `GlobalSearch.tsx:18` (focus ricerca globale, document-level) e `Catalog.tsx:162` (focus ricerca catalogo, window-level). Il `CommandPalette` che *dovrebbe* stare su Cmd+K è dead code (nessun handler Cmd+K, mai montato). ⇒ un picker Jjodie su Cmd+K collide a seconda del focus.
- **`Ctrl+.` / Period: LIBERO.** Nessun handler `.`+ctrl/meta in `src/`. L'unica punteggiatura+meta è **virgola** (`SettingsModalContext.tsx:56`, Cmd+, apre settings).
- **`Cmd/Ctrl+J`: già usato** = toggle console Chat↔Code (`Jodie.tsx:288`).
- Altri: `Cmd+/` (`HelpDrawer.tsx:89`), `Cmd+L` (Console JS `:831`), `Cmd+S`/`F5`/`Cmd+Enter` ecc. Tabella centrale `utils/keyboardShortcuts.ts:117-149` (K e `.` NON registrati lì — i Cmd+K vivono inline).
- **`/` come slash-command: convenzioni MULTIPLE e non coordinate.** (a) gateway JjScript (`JjScriptService.ts:30,65,107`); (b) `services/JjodieCommandParser.ts:55` parser slash completo ma **dead code** (zero importer); (c) Console JS (`editors/Console.tsx:586,598`, `/help /clear /history …`); (d) `JjodieHelpSystem.ts:342` (usato solo dal `CommandPalette` morto). Un registry che unifica il routing dovrà scegliere una convenzione `/` unica.

---

## Sintesi — cosa esiste già come precursore del `LanguageRegistry`

1. **History unificata multi-tipo** già presente: `ConsoleEntry = ChatMessage | CodeEntry`, discriminata da `kind`, resa da un unico `ChatMessages` con branch per tipo. Un provider produrrebbe la propria entry-kind.
2. **Modo sticky** già presente come `consoleMode` (chat/code) + `codeFlavor` (jjel/js), con toggle (Cmd+J, backtick, header buttons) e **promozioni fra modi** (`handleTestInCode`, `handleAskJjodie`). Manca la generalizzazione a N provider e il picker/cycle.
3. **Fallback non-silenzioso** già modellato per Code/JjEL: `evaluateJjelInJodie` ritorna errore esplicito + affordance "Ask Jjodie". Il problema del *fallback silenzioso* è solo il ramo Chat→LLM di `isJjScriptCommand` (per design, Chat=home Jjodie; i modi formali devono errorare invece di cadere all'LLM).
4. **Pattern registry** già presente e maturo nel sistema provider AI (`AI`/`AIConfig`/`JodieConfig`, per-feature preference, evento su cambio) — modello diretto per `LanguageRegistry`.
5. **Pattern evento annunciato** già presente (`useInterfaceMode` → `SystemEvents.INTERFACE_MODE_CHANGE`) — modello per lo switch annunciato da Jjodie.
6. **Entry-point provider** già isolati e riusabili: JjEL (`jjelEvalWithDiagnostics`+`buildEvalContext`), JjScript (`executeCommand`/`JjScriptService`), LLM (`AIProviderService.chat`).
7. **Scaffold picker**: `CommandPalette.tsx` (dead) riusabile o da rimuovere.

---

## Domande aperte per Alfonso (da decidere in Fase 2)

1. **Persistenza del modo.** Il design dice sticky-entro-sessione, boot-da-Jjodie, *non* persiste tra riaperture; l'attuale `consoleMode` **persiste** in localStorage (`jjodel.console.mode`). Si abbandona la persistenza (boot sempre Jjodie) o si mantiene? Impatta `useLocalStorageString` in `Jodie.tsx:86`.
2. **Shortcut picker.** `Cmd/Ctrl+K` **collide** (GlobalSearch + Catalog). Alternative: (a) scoping "solo se focus in Jjodie" come già fa Cmd+J (`:292-294`); (b) altra combinazione. `Ctrl+.` per il cycle è libero. Conferma le combinazioni.
3. **Convenzione `/`.** Oggi 3 convenzioni `/` non coordinate (+1 dead). I meta-comandi `/jjel /js /ask` del design entrano in questo spazio: unifichiamo su un'unica autorità `/` gestita dal registry? Cosa fare del `JjodieCommandParser` morto e del `/clear` esistente?
4. **`CommandPalette.tsx`**: riusare lo scaffold morto per il picker o rimuoverlo e ripartire?
5. **Vocabolari di comando duplicati** (≥4 liste disallineate, §A1): il registry li unifica in una singola sorgente (es. `types.ts:570` `COMMANDS`)? È un cleanup collaterale desiderato o fuori scope v1?
6. **Superficie da preservare** confermata (3 metodi + `ExecutionResult{.success/.command/.message/.warnings}` + tipi console): il provider JjScript deve mantenerla, o si accetta un adapter?

---

## Discrepanze rilevate (CLAUDE.md / prompt)

- **Prompt**: gli special-case `extends`/`abstract`/`let` **non** sono nel gateway (sono nel parser); il gateway è pura prima-parola e li ignora (§A1/§A5). Il `/`-prefix non è un escape forza-JjScript.
- **CLAUDE.md §16** cita `docs/ai-providers.md` e l'hook `useAIProviderPreference`: il subagent riporta che **`docs/ai-providers.md` non esiste** e **`useAIProviderPreference` non è codice live** (solo un commento in `DocumentationTab.tsx:583`); il pattern reale è statico-imperativo (`AIConfig.getPreferred`) + evento `AIEvents.SETTINGS_CHANGED`. Analogamente `PROVIDER_MODELS` è dentro un blocco commentato (`jodie.ts:924-1053`); il registro modelli reale è `AI[provider].versions`. (Segnalato come possibile stale in CLAUDE.md, da verificare a parte — fuori scope di questo task.)

---

## HARD STOP

Fase 1 completa. Nessuna modifica al sorgente. La progettazione del `LanguageRegistry` avviene in chat dopo l'analisi di questo report; non procedere alla Fase 2 senza go-ahead esplicito.
