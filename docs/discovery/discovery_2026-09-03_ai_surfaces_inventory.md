# Discovery — inventario delle superfici AI di Jjodel 3.0

Data: 2026-09-03 · Branch: `alfonso-frontend-jjtl` · Fase 1, read-only, nessun file di codice toccato.
Nome del documento prompt: 2026-09-03 22:20.

## 0. Obiettivo e ipotesi falsificate

Obiettivo: censire ogni punto in cui l'applicazione invoca un LLM, il pannello Providers, i
system prompt e il loro ciclo di vita, per scrivere la sezione «AI in Jjodel» di `jjodel-docs`
sui fatti del codice.

Ipotesi del prompt, e cosa dice la misura:

- **«I client sono in `frontend/src/ai/`»** — **falsa**. `frontend/src/ai/` **non esiste**
  (`ls frontend/src/ai` → *No such file or directory*; `find frontend/src -type d -name ai` → zero
  risultati). Il client unico e' `frontend/src/services/AIProviderService.ts`; il registro dei
  provider e la persistenza stanno in `frontend/src/types/jodie.ts`. Regola 15 di `CLAUDE.md`
  («un path citato che non esiste → STOP») dichiarata qui e non applicata come hard stop, perche'
  trovare i path corretti **e' l'oggetto** di questa discovery: il referto prosegue con i path reali.
- **«L'AI produce sempre un artefatto che l'utente rivede prima che abbia effetto»** — **vera per
  tre superfici su quattro, falsa per la quarta**. Console (JjScript) e JjTL (mappature) richiedono
  un gesto esplicito dell'utente; Explain non ha effetto (e' sola lettura); la **generazione della
  documentazione scrive l'artefatto senza revisione preventiva** (§1.3). Nessuna superficie scrive
  direttamente nel modello: ogni scrittura passa da JjScript eseguito a comando, o da codice JjTL
  inserito nell'editor e poi eseguito dall'utente.
- **«Esistono system prompt configurabili»** — **vera, ma solo due dei sette sono davvero usati**
  a runtime (§3.4).

## 1. File letti (path completi, tutti sotto `/Users/alfonso/jjodel/`)

Trasporto e registro
- `frontend/src/services/AIProviderService.ts` (978 righe)
- `frontend/src/types/jodie.ts` (1087)
- `frontend/src/services/PromptService.ts` (439), `frontend/src/types/prompts.ts` (142)
- `frontend/src/constants/defaultPrompts.ts` (702)

Console / Jjodie
- `frontend/src/components/Jodie/Jodie.tsx` (809), `JodieWindow.tsx` (499), `JodieHeader.tsx` (288),
  `ChatInput.tsx` (842), `ChatMessages.tsx` (481), `MarkdownMessage.tsx` (77)
- `frontend/src/components/Jodie/console/providers/{jjodieProvider,jjscriptProvider,jjelProvider}.ts`
- `frontend/src/components/common/MarkdownRenderer.tsx`, `frontend/src/components/common/AIDisclaimer.tsx`
- `frontend/src/jjscript/components/ScriptBlock.tsx` (1477),
  `frontend/src/jjscript/executor/scriptValidator.ts`,
  `frontend/src/jjscript/executor/executor.ts`, `frontend/src/jjscript/executor/commands/undoredo.ts`
- `frontend/src/services/JjodieContext.ts` (884), `frontend/src/services/export/JsonModelService.ts`
- `frontend/src/services/JjodieRagService.ts`, `frontend/src/jjodie/rag/embeddings.ts`

Documentazione
- `frontend/src/services/DocumentationService.ts`,
  `frontend/src/components/abstract/tabs/DocumentationTab.tsx`

Trasformazioni (JjTL)
- `frontend/src/jjtl/services/AIMatcher.ts` (294),
  `frontend/src/jjtl/services/MappingSuggestionService.ts`,
  `frontend/src/jjtl/views/SuggestedMappingsPanel.tsx` (802),
  `frontend/src/jjtl/views/InferredMappingsPanel.tsx`,
  `frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx`

Explain
- `frontend/src/components/ExplainModal.tsx` (263),
  `frontend/src/components/contextMenu/ContextMenu.tsx`,
  `frontend/src/components/editor-v2/EditorV2.tsx`

Settings
- `frontend/src/components/Settings/AISettingsContent.tsx` (463),
  `PromptsSettingsSection.tsx`, `PromptEditor.tsx`, `ProviderSettings.tsx`
- `frontend/src/components/Settings/UnifiedSettingsModal/sections/{ProvidersSection,PromptsSection}.tsx`
- `frontend/src/contexts/SettingsModalContext.tsx`, `frontend/src/components/StatusBarRightZone.tsx`
- `frontend/src/pages/settings/AIAssistantSettings.tsx`, `pages/settings/ProviderConfigModal.tsx`,
  `frontend/src/components/GlobalDrawer/SettingsDrawerContent.tsx`, `frontend/src/pages/Settings.tsx`

Non raggiungibili / fuori perimetro (verificati, §4.3)
- `frontend/src/jjodie-integration/*` (5 file), `frontend/src/components/envgen/*`,
  `frontend/src/components/Jodie/SettingsModal.tsx`, `frontend/src/components/Jodie/ProviderSelector.tsx`

Versione: `frontend/package.json`, `frontend/src/version.ts`, `frontend/vite.config.ts`.
Docs: `/Users/alfonso/jjodel-docs/src/content/docs/user-guide/console.md`,
`/Users/alfonso/jjodel-docs/src/content/docs/whats-new.md` (branch `docs/2026-09-update`).

---

## 2. Le superfici

Sono **quattro** le superfici che raggiungono davvero un provider, piu' una quinta parzialmente
morta. Il conteggio si regge su due misure indipendenti:

1. `grep -rn "AIProviderService" frontend/src --include='*.ts*'` (escluso `__tests__`) → tre soli
   chiamanti di `.chat(`: `Jodie/console/providers/jjodieProvider.ts:53`,
   `jjtl/services/AIMatcher.ts:62`, `services/DocumentationService.ts:622`. Piu' tre chiamanti di
   `.testConnection(` (tutti in Settings).
2. `grep -rn "fetch(" frontend/src` filtrato su endpoint/provider → oltre a `AIProviderService.ts`
   (righe 144, 192, 405, 749, 817, 887) l'unico altro `fetch` verso un LLM e'
   `components/ExplainModal.tsx:28` e `:80`, che **bypassa** `AIProviderService` con un trasporto
   SSE proprio.

Il tipo `AIFeature` (`types/jodie.ts:80`) enumera le cinque feature con preferenza provider/modello
indipendente: `'documentation' | 'chat' | 'scriptblock' | 'mappings' | 'explain'`. `scriptblock`
non ha nessun chiamante che risolva una preferenza propria: e' dichiarata e non usata (cercato
`getPreferred('scriptblock')` e `AIFeature` in tutto `frontend/src` — solo le enumerazioni interne
di `types/jodie.ts:569,623,654` e le prop dei tre componenti comuni).

---

### 2.1 Console — Jjodie (modo `Jjodie`)

**Nome e ingresso in UI.** Console flottante, modo Jjodie. Il componente e'
`components/Jodie/Jodie.tsx`, montato in `App.tsx:175` (`{user && <Try><Jodie/></Try>}` — richiede
un utente loggato, nessun altro flag). L'utente la apre da: l'icona robot nella status bar
(`components/StatusBarRightZone.tsx:63-73` — attenzione: quel bottone **apre le Settings**, non la
Console: `handleJjodieClick` → `openSettings('providers')`, riga 51-53), il bottone flottante sul
canvas — che e' la stessa `Jodie` in stato minimizzato (`JodieMinimized`, reso da
`Jodie.tsx:798-803`, handler `handleOpen` :408-414) — oppure l'evento `jjodel:jodie-prefill-and-open`
(`events/registry.ts:73`, emesso da `components/NotificationCenter.tsx:118`). I tre modi
(Jjodie / JjScript / JjEL) si commutano con i chip in `JodieHeader.tsx:200`, con Cmd+J / Ctrl+J
(`Jodie.tsx:323-328`) e con i meta-comandi `/ask`, `/js`, `/jjel`, `/help`
(`ChatInput.tsx:303-306`; il testo dell'aiuto e' in `Jodie.tsx:59`).

**Cosa fornisce l'utente.** Testo libero; opzionalmente immagini e PDF allegati
(`ChatInput.tsx:515-568`, letti in base64; i tipi accettati dipendono dalle capability del modello
attivo, `ChatInput.tsx:621-622` su `AI.hasVision`/`hasPdf`, `types/jodie.ts:219-233`). Il contesto
del progetto **non e' fornito dall'utente**: e' raccolto automaticamente (sotto).

**Cosa viene serializzato e inviato.** Il payload lo compone
`AIProviderService.chat` (`services/AIProviderService.ts:32-106`) piu' il metodo per-provider
(`chatClaude` :165, `chatOpenAI` :269, `chatDeepSeek` :331, `chatGemini` :362, `chatMistral` :475,
`chatGroq` :535, `chatKimi` :566, `chatOllama` :597, `chatCustom` :632). Parti:

| Parte | Origine | Forma |
|---|---|---|
| system prompt | `PromptService.getRendered('chat', context)` — `AIProviderService.ts:79` | testo, default `CHAT_PROMPT` di 250 righe (§3.1) |
| contesto del progetto | `JjodieContextService.getContextJSON` — `Jodie.tsx:129-159`, `services/JjodieContext.ts:338-386` | **JSON pretty-printed** iniettato nel system prompt al posto del placeholder `{{projectContext}}` |
| contesto RAG | `JjodieRagService.getAugmentedContext(input)` — `jjodieProvider.ts:38` | testo, appeso al contesto sotto `**Relevant Information:**` (`jjodieProvider.ts:41-43`) |
| storia della conversazione | `chatState.messages.filter(isChatEntry)` — `Jodie.tsx:566` | array `{role, content}` completo, **senza troncamento** |
| messaggio corrente | input dell'utente | testo (+ blocchi `image`/`document` base64 se allegati) |
| modello | `AIConfig.getPreferredModel('chat')` — `jjodieProvider.ts:52` | id stringa |

Il contesto JSON e' scoped all'artefatto attivo (`JjodieContext.ts:338-386`): con un M2 attivo
manda `metamodel` in forma `buildMetamodelDocumentLight` (`services/export/JsonModelService.ts:119`,
che rimuove `id`, `externalMetamodels`, `exportedAt`, `jjodelVersion`, `formatVersion`); con un M1
attivo manda `model` in forma `buildModelDocumentLight` (:181, che **conserva gli id**, perche'
servono a indirizzare le istanze) piu' un report di conformance deterministico
(`envelope.conformance`, righe 362-368); senza artefatto attivo manda **tutti** i metamodelli del
progetto (righe 373-379). Piu' un `currentlyEditing: {name, level}` (righe 343-348).

**Ordine di grandezza del payload** (stima calcolata sulla forma, non misurata su un progetto
reale): il JSON e' `JSON.stringify(envelope, null, 2)`. Con la forma di `buildClass`
(`JsonModelService.ts:242-258`) e `buildAttribute` (:260-268), un attributo pesa ~5 righe
(~110-130 caratteri), una reference ~6-8 righe (~150-200), una classe con 4 attributi e 2
reference ~900-1200 caratteri. Un metamodello «medio» di 15-20 classi sta quindi intorno a
**15-25 KB** di solo contesto, cui si sommano ~9 KB di system prompt di default (§3.1) e l'intera
storia della conversazione. Su un M1 il documento include anche tutti gli oggetti istanza, quindi
cresce con la dimensione del modello e non ha alcun tetto nel codice: **non esiste troncamento,
finestra scorrevole o budget di token in nessun punto del percorso** (cercato `slice(`, `substring(`,
`maxChars`, `truncat`, `token` in `services/JjodieContext.ts`, `services/AIProviderService.ts`,
`components/Jodie/` — l'unico limite e' `CHAT_MAX_OUTPUT_TOKENS = 8192` in
`AIProviderService.ts:18`, che riguarda l'**output**).

**Cosa torna.** Testo Markdown. Se contiene un blocco di codice multi-riga marcato ` ```jjscript `
/ ` ```jjs `, oppure riconosciuto da `isJjScriptCode(code)`, il renderer mostra un bottone «Run as
JjScript» (`components/common/MarkdownRenderer.tsx:92-96, 122-131`).

**Dove l'utente lo vede e lo modifica prima che abbia effetto.** Il testo compare come bolla di
chat (`ChatMessages.tsx`), con toggle Formatted/Source (`MarkdownMessage.tsx:64-72`). Il JjScript
richiede **due gesti**: (1) «Run as JjScript» trasforma il blocco in uno `ScriptBlock`
(`MarkdownRenderer.tsx:100-110`), (2) dentro lo `ScriptBlock` l'utente sceglie **Run** (esegue
tutto) o **Step** (una riga per volta), scegliendo il metamodello di destinazione dal selettore
`Target` quando lo script non lo dichiara (`ScriptBlock.tsx:1294-1319, 1354-1396`). Nulla parte da
solo. **Il codice non e' editabile in linea**: lo `ScriptBlock` e' un `SyntaxHighlighter` in sola
lettura (`ScriptBlock.tsx:1417-1432`) con un bottone Copy (:1333-1340); per correggere lo script
l'utente lo copia altrove o chiede una correzione a Jjodie. Sotto il blocco compare il disclaimer
(`AIDisclaimer` con `feature="chat"`, `JodieWindow.tsx:494`; e dentro `ScriptBlock.tsx:16`).

Se l'input dell'utente e' esso stesso un comando JjScript completo, Jjodie **non chiama l'LLM**:
offre di eseguirlo con un bottone Run (`Jodie.tsx:489-503`, parsing stretto in
`jjscriptProvider.ts:41-47`).

**Come viene applicato.** `ScriptBlock` chiama `onExecute` → `ChatMessages.handleJjScriptExecute`
(`ChatMessages.tsx:388-437`) → `JjScriptService.execute(command)`, un comando per volta, che entra
nell'esecutore (`jjscript/executor/executor.ts`); le scritture sul D-layer avvengono dentro
`TRANSACTION` per comando (p.es. `jjscript/executor/commands/move.ts:90`,
`commands/copy.ts:85`, `commands/instance.ts:11-13`).

**Undo.** Coperto **solo dallo undo globale di Redux**, che e' per-azione:
`redux/reducer/reducer.ts:1118-1157` (`doUndoRedo`), stack capped a `MAX_HISTORY = 100`
(`reducer.ts:78`). Uno script di 200 comandi **non e' annullabile con un gesto**: servono N undo, e
oltre 100 delta la coda piu' vecchia e' persa. Il comando JjScript `undo` **non funziona**: il suo
stack `undoStack` (`jjscript/executor/executor.ts:47`) non riceve mai un push — `grep -rn
"undoStack.push" frontend/src` trova occorrenze **solo** in `jjscript/__tests__/commands.test.ts`.
`executeUndo` restituisce percio' sempre «Nothing to undo» (`commands/undoredo.ts:20-27`).

**Stato.** Completo e raggiungibile, nessun flag. Il modo Jjodie e' il default della Console.

**Errori.**
- provider non configurato e nessun altro disponibile → messaggio in chat «No AI providers
  configured. Please click the Settings button…» (`Jodie.tsx:509-518`), nessuna chiamata;
- provider corrente non configurato ma un altro si' → **auto-switch silenzioso** al primo provider
  configurato, con messaggio «Switched to X (your configured provider).» (`Jodie.tsx:531-547`);
- chiave incoerente col provider → messaggio in chiaro **prima** della rete
  (`AIProviderService.validateKeyCoherence`, :957-976: «This looks like a Anthropic (Claude) API
  key, but the active provider is …»);
- provider che non risponde / 4xx / 5xx → `Error: <provider> API error: <status> - <body>`
  propagato fino alla bolla «Sorry, I encountered an error: … Please check your API key in
  Settings.» (`Jodie.tsx:589-603`);
- risposta troncata dal tetto di output → **solo un `console.warn`**, nessun segnale in UI
  (`AIProviderService.ts:157, 215, 425`);
- script generato che non compila → l'esecuzione e' **rifiutata in blocco prima del primo comando**
  da `validateScriptIntegrity` (`ScriptBlock.tsx:308-310`,
  `jjscript/executor/scriptValidator.ts:83`), che intercetta stringhe non chiuse e comandi
  impartibili; un errore a meta' script apre `ExecutionErrorDialog` con Skip e azioni di recupero
  (`ScriptBlock.tsx:1452-1460`), e le righe gia' applicate **restano applicate**;
- errore di parse su input JjScript digitato → card d'errore con bottone «Chiedi a Jjodie»
  (`ChatMessages.tsx:183-188`, handler `Jodie.tsx:610-640`).

### 2.2 Trasformazioni JjTL — «Analyze Metamodels» (mappature suggerite)

**Nome e ingresso.** Pannello «Suggested mappings» dentro l'ambiente di sviluppo JjTL:
`jjtl/views/SuggestedMappingsPanel.tsx`, montato da `jjtl/components/JjtlDevelopmentEnv.tsx:741`,
aperto come tab dal `components/abstract/DockManager.tsx:393`. Il gesto e' il bottone
`btn-analyze` (`SuggestedMappingsPanel.tsx:599-604`) con i due metamodelli caricati
(`canAnalyze`, :553-556). Il selettore provider/modello della feature `mappings` e' in testa al
pannello (`ProviderModelSelector`, :570).

**Cosa fornisce l'utente.** La coppia sorgente/target (nessun testo libero): il pannello legge i
due alberi di metamodello via getter, freschi al momento dell'analisi (:38-40, 375).

**Cosa viene inviato.** `MappingSuggestionService.analyze` (`jjtl/services/MappingSuggestionService.ts:44-75`)
in modo `ai` chiama `AIMatcher.analyze` (`jjtl/services/AIMatcher.ts:21-80`), che compone il prompt
in `buildPrompt` (:107-121) con `PromptService.getRendered('mappings', …)`: i due metamodelli sono
serializzati da `formatMetamodel` (:126-169) in un **testo indentato**, non JSON — una riga per
classe (`Class: X (abstract)`), attributo (`  - nome: tipo [molteplicita']`), reference
(`  -> nome: tipo [molt.]`), enum e literal — e sostituiti nei placeholder `{{sourceMetamodel}}`,
`{{targetMetamodel}}`, `{{sourceName}}`, `{{targetName}}`. **Nessuna storia di conversazione**
(`AIMatcher.ts:62` passa `[]`), **nessun contesto di progetto** (passa `undefined`). Ordine di
grandezza: ~40-60 caratteri per riga, una riga per elemento — due metamodelli da 20 classi con 5
feature ciascuna stanno sotto i **10 KB**, cui si somma il prompt `mappings` di default (~6 KB).

**Cosa torna.** Un array JSON di suggerimenti (`sourceClass`, `sourceAttribute`, `targetClass`,
`targetAttribute`, `confidence`, `reason`, `conversionHint`, `guardHint`), estratto anche se
avvolto in un blocco Markdown (`AIMatcher.parseResponse`, :174-190).

**Dove l'utente lo rivede.** Il pannello elenca i suggerimenti come card con confidence e
motivazione; l'utente li accetta, li rifiuta (`handleReject`, :490-493), li marca tutti
(`handleMarkAllForInsert`, :495-499) o li esporta in JSON (`handleExportJson`, :513-541). Il
disclaimer AI e' mostrato (`InferredMappingsPanel.tsx:230` per il pannello gemello;
per questo il selettore in testa nomina provider e modello).

**Come viene applicato.** «Insert» genera **sorgente JjTL** da i soli suggerimenti marcati
(`generateJjtlCode`, :176; `handleInsertMappings`, :502-511) e lo consegna a
`JjtlDevelopmentEnv.handleInsertCode` (:414-439), che lo **scrive nell'editor di testo** dopo
l'intestazione `transformation … from … to …` e ne fa il parse. Da li' in poi l'utente vede,
modifica ed esegue il codice come qualunque trasformazione scritta a mano: **il modello target non
viene toccato dall'AI**. Undo: quello dell'editor di testo, piu' `hasUnsavedChanges` (:428). La
trasformazione, quando eseguita, e' un'azione normale sul modello.

**Stato.** Completo, nessun flag. Il modo alternativo `simple` (matcher deterministico su nomi,
`SimpleMatcher`) non chiama nessun LLM (`MappingSuggestionService.ts:54-55`).

**Errori.** Nessun provider → il servizio ritorna un risultato con
`error: 'AI provider not configured. Please configure an AI provider in Settings.'` e zero
suggerimenti (`MappingSuggestionService.ts:58-64`), e il pannello offre il link alle Settings
(`SuggestedMappingsPanel.tsx:480, 573`). Provider che non risponde → l'errore di `chat()` risale e
viene mostrato nel pannello (`AIMatcher.ts:76-79`). Risposta non parsabile → `parseResponse`
restituisce lista vuota / errore. **La cancellazione non funziona davvero**: `AIProviderService.chat`
non accetta `AbortSignal` (TODO dichiarato in `AIMatcher.ts:54-56`), il segnale e' controllato solo
**dopo** che la risposta e' arrivata (:63-67).

### 2.3 Documentazione — «Generate with Jjodie»

**Nome e ingresso.** Tab Documentation del progetto:
`components/abstract/tabs/DocumentationTab.tsx`, bottoni Generate (`handleGenerate`, :640-681) e
Regenerate (`handleRegenerate`, :692-791, con modale di avanzamento a passi). Selettore
provider/modello della feature `documentation` alla riga 967; disclaimer alla riga 1110.

**Cosa fornisce l'utente.** Solo il gesto. Non c'e' testo libero.

**Cosa viene inviato.** `DocumentationService.generateWithJjodie`
(`services/DocumentationService.ts:584-665`): (1) estrae i dati lessicali del progetto
(`extractLexicalData`, :668-...: nome progetto, metamodelli, classi con `isAbstract`, attributi con
tipo e molteplicita', reference con target/tipo/molteplicita', superclasse, enumerazioni);
(2) **interroga Wikidata** per i termini estratti (`fetchWikidataDefinitions`, chiamata di rete a
`DocumentationService.ts:720` — un secondo servizio esterno, oltre al provider LLM);
(3) compone il prompt con `buildJjodiePrompt` (:740-...), un template **hardcoded nel file**
(righe 759-800+), in Markdown, con le classi elencate a punti; (4) chiama
`AIProviderService.chat(prompt, provider, [], undefined, undefined, undefined, model)` (:622-630):
niente storia, niente `projectContext` — il metamodello e' **dentro** il messaggio utente, non nel
system prompt. Il system prompt applicato resta comunque quello **`chat`** (`AIProviderService.ts:79`
lo applica a ogni chiamata): il default `documentation` di `defaultPrompts.ts` **non entra mai nel
payload** (§3.4). Ordine di grandezza: la forma e' piu' compatta del JSON del contesto Console
(~80-150 caratteri per classe piu' una riga per feature): un progetto da 20 classi sta sotto i
**10 KB**, piu' la sezione Wikidata.

**Cosa torna.** Un oggetto JSON (`domain`, `domainConfidence`, `projectDescription`, `metamodels[]`
con descrizioni per classe/attributo/reference), estratto in modo tollerante
(`extractJsonFromResponse`), con un fallback che tenta di ricavare descrizioni dal testo libero
(`createFallbackResponse`, :644-649). Poi convertito in **Markdown** da `convertJjodieToMarkdown`
(:659).

**Dove l'utente lo vede e lo modifica — attenzione.** **Non c'e' revisione preventiva.** Il
Markdown generato viene messo in stato e **salvato subito**: `setDocumentation(newDoc)` +
`DocumentationService.save(project.id, newDoc)` (`DocumentationTab.tsx:657-659` per Generate,
:775-779 per Regenerate). L'utente lo rivede e lo corregge **dopo**, nella vista edit del tab
(`handleSaveEdit`, :802-812). L'unico presidio contro la perdita di lavoro umano sono le sezioni
`@protected`, che il rigenerato preserva (`mergeProtectedSections`, :760-764). L'artefatto e'
**documentazione, non modello**: nessuna scrittura sul D-layer, quindi nessun problema di undo del
modello; la persistenza e' `localStorage` sotto il prefisso `jjodie_doc_`
(`types/jodie.ts:159`, `AI.DOCUMENTATION_STORAGE_PREFIX`).

**Stato.** Completo. La scelta AI/locale non e' dell'utente: e' automatica —
`const useJjodie = JodieConfig.hasEnabledProviders()` (`DocumentationTab.tsx:646`, e :700 per il
rigenera). Con almeno un provider configurato la generazione **passa dall'LLM senza chiederlo**.

**Errori.** Qualunque errore (rete, chiave, JSON non parsabile) → `catch` che **ricade sulla
generazione locale deterministica** (`generateLocal`, `DocumentationTab.tsx:661-680`) e salva
quella, con `confidence: 0` e `generatedWith: 'local'`. Nel percorso Regenerate l'errore marca il
passo corrente come `error` nella modale (:781-785). Nessuna chiave → `hasEnabledProviders()` e'
falso e si va direttamente in locale.

### 2.4 Explain — «Explain this» (menu contestuale)

**Nome e ingresso.** Voce «Explain this» del menu contestuale su un elemento:
`components/contextMenu/ContextMenu.tsx:462-483` (canvas classico) e
`components/editor-v2/EditorV2.tsx:3234-3236` (editor v2). Entrambe emettono
`jjodel:explain-open` (`events/registry.ts:38`); la modale e'
`components/ExplainModal.tsx`, montata in `App.tsx:179`.

**Cosa fornisce l'utente.** La sola selezione. Nessun testo libero.

**Cosa viene inviato.** Prompt costruito in `ExplainModal.buildPrompt` (:14-24) — **hardcoded, non
passa da `PromptService`, non e' modificabile dalle Settings**: nome elemento, tipo, nome del
metamodello, e `JSON.stringify(properties, null, 2)` delle proprieta' raccolte dal chiamante
(EditorV2 include attributi, reference con containment, operazioni, literal, `instanceOf`, feature
di istanza — :3200-3232; il menu classico solo `isAbstract`/`isSingleton` — `ContextMenu.tsx:476-478`).
**Nessun system prompt, nessuna storia, nessun contesto di progetto**: il body e' un solo messaggio
utente (`ExplainModal.ts:36-41`, `:86-91`). Payload: qualche centinaio di caratteri, al piu' 1-2 KB.

**Cosa torna.** Testo Markdown in **streaming SSE**, reso via `ReactMarkdown` mentre arriva
(:191-206, 244).

**Dove l'utente lo vede.** In una modale di sola lettura. **Nessun effetto sul modello**: la
superficie e' puramente esplicativa. Niente da annullare.

**Stato.** **Parziale.** Il trasporto e' scritto due volte (`streamClaude` :27, `streamOpenAI` :79)
e copre **solo cinque provider**: Claude, GPT, DeepSeek, Mistral, Groq (`:140-152`). Gemini, Kimi,
Ollama e Custom cadono nel `default:` con l'errore «Streaming not supported for provider "X".
Configure Claude or OpenAI in Settings.» — pur essendo provider pienamente configurabili altrove.
Inoltre usa `llm.endpoint` (:148) e non `getEndpoint()`, quindi **ignora il proxy CORS**
(§4.2). `max_tokens: 1024` fisso (:38, :88).

**Errori.** Nessuna chiave (e provider != Ollama) → «No AI provider configured. Please add an API
key in Settings.» (:132-134). Errore HTTP → «API error <status>: <body>» nel corpo della modale
(:245-249). Chiusura/Esc → `AbortController.abort()` (:164, :212).

### 2.5 RAG — indicizzazione locale (nessuna chiamata a provider)

`services/JjodieRagService.ts` + `jjodie/rag/`. Le embedding sono **TF-IDF locali**, dichiarato in
testa a `jjodie/rag/embeddings.ts:1-11` e nel default `model: 'tfidf-local'` (:26-31). Nessuna
chiamata di rete (nessun `fetch` in `jjodie/rag/`). Alimenta solo il contesto della Console
(`jjodieProvider.ts:36-48`) ed e' inizializzato periodicamente da `Jodie.tsx:292-299`. **Non e' una
superficie AI**: va detto nei docs perche' «RAG» suggerisce il contrario.

---

## 3. Provider e Settings

### 3.1 Dove si configurano — tre superfici, non una

1. **Unified Settings Modal, sezione «Providers»** — la principale.
   `contexts/SettingsModalContext.tsx` monta `UnifiedSettingsModal` in `App.tsx:118`; si apre con
   **Cmd+, / Ctrl+,** (`SettingsModalContext.tsx:52-64`) o via `openSettings('providers')` da:
   status bar (`StatusBarRightZone.tsx:51`), Console (`Jodie.tsx:683`), Documentation tab
   (`DocumentationTab.tsx:970`), pannello JjTL (`SuggestedMappingsPanel.tsx:480, 573`), i selettori
   comuni (`components/common/ProviderSelector.tsx:140`, `ProviderModelSelector.tsx:106`).
   La sezione avvolge `components/Settings/AISettingsContent.tsx`
   (`UnifiedSettingsModal/sections/ProvidersSection.tsx:28`).
2. **Global drawer → Settings → AI Assistant** — `components/GlobalDrawer/SettingsDrawerContent.tsx:26`
   rende `pages/settings/AIAssistantSettings.tsx`, che apre `pages/settings/ProviderConfigModal.tsx`
   (:92). **UI diversa dalla prima**, con un campo Modello.
3. **Route `/settings`** — `App.tsx:154` (`<Route path='settings' element={<SettingsPage/>}/>`),
   `pages/Settings.tsx:23` rende lo stesso `AIAssistantSettings`.

`components/Settings/ProviderSettings.tsx` (253 righe) **non e' importato da nessuno**
(`grep -rn "ProviderSettings" frontend/src --include='*.tsx' --include='*.ts'` → solo il file
stesso): codice morto. Idem `components/Jodie/SettingsModal.tsx` e
`components/Jodie/ProviderSelector.tsx`, esportati da `components/Jodie/index.ts:9` ma senza
consumatori (§4.3).

### 3.2 Provider supportati, come sono nel codice

Registro: `types/jodie.ts:260-270` (istanze), `:274-284` (info GUI), `:286-370` (modelli),
`:378-385` (endpoint), `:388-398` (schema di autenticazione).

| Provider (`AIProvider`) | Company | Endpoint | Auth | Chiave? | Modelli in registro |
|---|---|---|---|---|---|
| `GPT` | OpenAI | `https://api.openai.com/v1/chat/completions` | `bearer` | si', prefisso atteso `sk-` | 5 (gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-4, gpt-3.5-turbo) |
| `Claude` | Anthropic | `https://api.anthropic.com/v1/messages` | `x-api-key` | si', `sk-ant-` | 7 (Opus 4.7/4.6, Sonnet 4.6, Haiku 4.5 + 3 legacy) |
| `Gemini` | Google | `https://generativelanguage.googleapis.com/v1beta/models` | `query-key` | si' | 6 (3.6 Flash, 3.5 Flash Lite + 4 legacy) |
| `DeepSeek` | DeepSeek | `https://api.deepseek.com/v1/chat/completions` | `bearer` | si', `sk-` | 2 |
| `Mistral` | Mistral | `https://api.mistral.ai/v1/chat/completions` | `bearer` | si' | 6 |
| `Groq` | Groq | `https://api.groq.com/openai/v1/chat/completions` | `bearer` | si', `gsk_` | 15 (modelli di terzi serviti da Groq) |
| `Kimi` | Moonshot | `https://api.moonshot.cn/v1/chat/completions` | `bearer` | si' | 3 |
| `Ollama` | Ollama | `http://localhost:11434/v1/chat/completions` (override con `baseUrl`) | `none` | **no** (`AI.Ollama.requiresKey = false`, :271) | 7 |
| `Custom` | Custom | nessuno: **richiede** `baseUrl` | `bearer` | opzionale | 1 placeholder |
| `Llama` | Meta | **nessuno** | — | — | 5 dichiarati ma irraggiungibili |
| `Copilot` | Microsoft | **nessuno** | — | — | 0 |

`Llama` e `Copilot` sono **parcheggiati**: `chat()` lancia «Llama is not yet supported (no endpoint
configured).» / «Copilot is not yet supported.» (`AIProviderService.ts:98-101`) e `testConnection`
ritorna lo stesso errore (:719-722). Compaiono comunque nella lista delle Settings, perche' il
pannello itera `ALL_AI_PROVIDERS` (`AISettingsContent.tsx:411`).

**Provider di default: nessuno.** `AIConfig.getPreferred(feature)` (`types/jodie.ts:466-479`) legge
la preferenza per-feature da `localStorage`; se manca ricade sul **primo provider configurato in
ordine di dichiarazione** (`getFirstEnabledProvider`, :487-491), e se nessuno e' configurato sul
primo dichiarato in assoluto — cioe' `GPT`, essendo `ALL_AI_PROVIDERS` derivato dall'ordine di
`aimap` (`:55-68, :77`). Il commento alla riga 485 dice «Claude was the pre-seeded default»: **non
e' piu' vero**, l'ordine mette OpenAI per primo. Esiste una chiave legacy
`jjodel_default_provider` (`AI.GLOBAL_DEFAULT_KEY`, :159) migrata una tantum a preferenze
per-feature (`migrateGlobalDefaultToPerFeature`, :548-...), non ancora rimossa per finestra di
deprecazione.

### 3.3 Campi, test di connessione, persistenza

**Campi.** Nel pannello principale (`AISettingsContent.fieldsFor`, :395-407) il form espanso mostra:
per tutti i provider **solo `API Key`** (password, placeholder dal registro
`AI[name].keyPlaceholder`), con link alla pagina delle chiavi del provider quando c'e'
(`AI.keyUrl`, :328-330); per **Custom**: `Base URL`, `API Key`, `Model Name` (testo libero).
Il **modello non si sceglie qui**: lo dichiara il commento alle righe 393-394 («the model is chosen
by the app-level picker»), cioe' i selettori per-feature `ProviderModelSelector` in Console,
Documentation e JjTL. La seconda UI (`ProviderConfigModal.tsx:168-222`) ha invece `Base URL`,
`API Key` e una `<select>` di modelli: **le due UI non offrono gli stessi campi.**

**Test di connessione: si', esiste.** `AIProviderService.testConnection`
(`services/AIProviderService.ts:670-729`), invocato da tutte e tre le UI
(`AISettingsContent.tsx:162`, `ProviderConfigModal.tsx:78`, `Jodie/SettingsModal.tsx:60` — l'ultima
morta). E' una chiamata **reale** all'endpoint con `max_tokens: 10` (`:689-716`; per Ollama
`{stream:false}`), con test dedicati per Claude (:736) e Gemini (:813) e uno condiviso per gli
OpenAI-compatibili (:863). Restituisce messaggi mirati: chiave non valida per provider, «Model "X"
not found. Make sure it's pulled in Ollama.», «Cannot connect to Ollama at <endpoint>. Make sure
Ollama is running.» L'esito e' persistito su `lastTested` / `lastTestOk` / `enabled` e pilota la
pastiglia di stato (`AISettingsContent.tsx:152-186`); il bottone torna «idle» dopo 3 secondi
(`REVERT_DELAY_MS`, :111).

**Dove sta la chiave.** In `localStorage`, **in chiaro, per dispositivo/browser** — non per account,
non sul server. Chiavi esatte:

| Chiave `localStorage` | Contenuto | Definizione |
|---|---|---|
| `jjodie_provider_<nome minuscolo>` (es. `jjodie_provider_claude`, `jjodie_provider_gpt`) | l'intero `AIConfig` serializzato: `apiKey`, `model`, `baseUrl`, `enabled`, `lastTested`, `lastTestOk`, **`messages`** (storia chat), `isOpen`, `isMinimized`, `lastUsed` | `AI.storageKey`, `types/jodie.ts:186`; scritture `:681`, `:697` |
| `jjodie-credentials` | copia aggregata di tutti i provider (`JodieConfig`) | `AI.STORAGE_GLOBAL_CONFIG`, `:162`; scrittura `:772` |
| `jjodel_provider_<feature>` (`…chat`, `…documentation`, `…mappings`, `…explain`, `…scriptblock`) | `{providerId, modelId, updatedAt}` | `AI.STORAGE_PREFIX`, `:161`; scrittura `:507` |
| `jjodel_default_provider` | legacy, in deprecazione | `AI.GLOBAL_DEFAULT_KEY`, `:159` |
| `jjodie-settings` | legacy | `AI.LEGACY_SETTINGS_KEY`, `:158` |
| `jjodie_active_provider`, `jjodel_jodie_window` | provider attivo della Console, geometria finestra | `:156-157` |
| `jjodie_doc_<projectId>` | documentazione generata per progetto | `AI.DOCUMENTATION_STORAGE_PREFIX`, `:159` |

Il pannello lo dichiara all'utente: «API keys are stored locally in your browser.»
(`AISettingsContent.tsx:446-449`). Due conseguenze da scrivere nei docs: (a) la configurazione
**non segue l'account** — cambiando browser o macchina va rifatta; (b) la **storia della chat
finisce nella stessa chiave della chiave API** (`messages` e' campo di `AIConfig`,
`types/jodie.ts:426`), quindi «cancellare le credenziali» e «cancellare la conversazione» sono lo
stesso gesto sullo stesso record.

### 3.4 Cosa succede senza nessun provider configurato

Il predicato unico e' `JodieConfig.hasEnabledProviders()` → `getEnabledProviders()`
(`types/jodie.ts:823-830`), che filtra su `AIConfig.isConfigured()` (`:726-733`: chiave non vuota;
per Ollama `baseUrl`; per Custom l'uno o l'altro). Nota: **«configurato» non vuol dire «testato»**,
basta che il campo non sia vuoto.

- Console: messaggio in chat con rimando alle Settings, nessuna chiamata (§2.1).
- JjTL: risultato con `error` e link alle Settings (§2.2).
- Documentazione: **silenziosamente locale** (§2.3).
- Explain: errore nella modale (§2.4).
- Status bar: pallino grigio e tooltip «AI not configured — Open settings»
  (`StatusBarRightZone.tsx:66-73`).

---

## 4. System prompt

### 4.1 Quanti sono e dove vivono

**Sette** default, tutti in un file solo: `frontend/src/constants/defaultPrompts.ts`, esportati come
`DEFAULT_PROMPTS` (:667-675). I tipi sono in `frontend/src/types/prompts.ts:12-19`
(`chat | documentation | validation | refactoring | ocl | import | mappings`) con metadati in
`PROMPT_REGISTRY` (:84-134). Non c'e' un prompt per provider ne' uno per modo della Console:
**la granularita' e' per funzione**.

Piu' **due prompt hardcoded fuori da questo sistema**, non modificabili dall'utente:
- `ExplainModal.buildPrompt` (`components/ExplainModal.tsx:14-24`);
- `DocumentationService.buildJjodiePrompt` (`services/DocumentationService.ts:740-...`, corpo alle
  righe 759-820 circa).

E uno **morto**: `frontend/src/jjodie-integration/jjscriptGenerationPrompt.ts:6`
(`JJSCRIPT_GENERATION_PROMPT`, 150 righe) — §4.3.

### 4.2 Solo due dei sette arrivano davvero a un provider

`grep -rn "getRendered\|PromptService.get(" frontend/src --include='*.ts*'` (escluso `__tests__`)
restituisce **due soli punti di consumo**:
- `services/AIProviderService.ts:79` → `PromptService.getRendered('chat', context)`, applicato a
  **ogni** chiamata `chat()` (quindi anche a documentazione e mappature, che nel loro payload
  portano il proprio prompt **come messaggio utente**);
- `jjtl/services/AIMatcher.ts:113` → `PromptService.getRendered('mappings', …)`.

Gli altri cinque (`documentation`, `validation`, `refactoring`, `ocl`, `import`) sono **editabili
nelle Settings ma non vengono mai inviati a nessuno**: `documentation` e' scavalcato dal prompt
hardcoded di `DocumentationService`; `validation`, `refactoring`, `ocl`, `import` non hanno alcun
chiamante (nessuna occorrenza fuori da `defaultPrompts.ts`, `types/prompts.ts` e la UI che li
elenca). Questo va detto nei docs, o l'utente personalizzera' testi inerti.

### 4.3 Sovrascrittura, cascata, versioni

`services/PromptService.ts`. Cascata a tre livelli, `get(type, projectId)` :100-118:
**progetto → globale → default**. Persistenza in `localStorage`:
`jjodel_prompt_global_<type>` e `jjodel_prompt_project_<projectId>_<type>`
(`types/prompts.ts:140-142`; scritture `PromptService.ts:148-163` e nella sezione progetto).
Ogni salvataggio emette `AIEvents.PROMPT_CHANGED` (:160).

**UI.** Settings → sezione **Prompts** (`UnifiedSettingsModal/sections/PromptsSection.tsx:28` →
`components/Settings/PromptsSettingsSection.tsx`), raggiungibile anche dal drawer
(`GlobalDrawer/SettingsDrawerContent.tsx:9`). Elenca **tutti e sette** i tipi
(`promptTypes = Object.keys(PROMPT_REGISTRY)`, :25) raggruppati per categoria (assistant /
generation / analysis, :44-48), con filtro «solo personalizzati» (:28-34). L'editor
(`components/Settings/PromptEditor.tsx`) mostra la fonte attiva (`getPromptSource`, :35), permette
salvataggio globale o di progetto (:54-56), **ripristino del default** (`resetGlobalPrompt` /
`resetProjectPrompt`, :65-79) e una **anteprima renderizzata** con le variabili sostituite
(`renderTemplate`, :84).

**Versioni e changelog.** `DEFAULT_PROMPT_VERSIONS` (`defaultPrompts.ts:684-700`): `chat` e' alla
**versione 4** con changelog di quattro voci; gli altri sei sono alla versione 1. Una
personalizzazione salva la `baseVersion` (`PromptService.ts:155`), e la UI segnala quando il default
e' andato avanti (`isDefaultUpdated`, `PromptsSettingsSection.tsx:99`; le note della versione sono
mostrate in `PromptEditor.tsx:41-42`). **Non c'e' migrazione automatica** della personalizzazione
(commento `defaultPrompts.ts:23-25`). Esiste pero' un **reset forzato**: `PromptService.runMigration`
(:44-77) con `PROMPT_VERSION = 4` (:31) cancella la personalizzazione **globale** del prompt `chat`
se le manca uno dei marcatori critici `['JjScript', 'create class', '```jjscript', 'conversational,
flowing style', 'projectContext']` (:26-28). Cioe': **una personalizzazione del prompt chat che
tolga uno di quei cinque frammenti viene silenziosamente buttata via** alla migrazione successiva.

**Placeholder e sostituzione.** La sostituisce `PromptService.renderTemplate` (:325-360): variabili
`{{nome}}` risolte prima sul `PromptContext` tipizzato e poi su `context.customVariables`
(:335-338), condizionali `{{#if var}}…{{/if}}` (:341-347), cicli `{{#each array}}…{{/each}}`
(:350-...). Un contesto assente e' normalizzato a `{}` **apposta**, cosi' i marcatori vengono
comunque rimossi e non raggiungono mai il provider (:326-330).

Placeholder effettivamente presenti nei default:
- `chat` → `{{projectContext}}`, riempito da `AIProviderService.ts:76-79` con il JSON di
  `JjodieContextService.getContextJSON`;
- `mappings` → `{{sourceName}}`, `{{sourceMetamodel}}`, `{{targetName}}`, `{{targetMetamodel}}`,
  riempiti da `AIMatcher.buildPrompt` (`jjtl/services/AIMatcher.ts:113-120`);
- `validation`, `refactoring`, `ocl`, `import` → `{{#if projectName}}…{{/if}}`, mai riempito da
  nessuno (sono i prompt non consumati).

### 4.4 Testo integrale dei default

#### `chat` — `CHAT_PROMPT`, `frontend/src/constants/defaultPrompts.ts:31-280` (250 righe, oltre le 80: prime 20)

```
const CHAT_PROMPT = `You are Jjodie, an expert AI assistant specialized in metamodeling and the Jjodel tool.

## YOUR ROLE
You help users design and build metamodels using Jjodel, a web-based metamodeling tool. You provide expert guidance on metamodeling concepts, best practices, and specific instructions for implementing solutions in Jjodel.

## YOUR EXPERTISE

### 1. Metamodeling Concepts
- **Metaclasses**: The building blocks that define types in a metamodel
- **Attributes**: Properties that metaclasses can have (name, type, multiplicity)
- **References**: Relationships between metaclasses (associations, compositions, inheritance)
- **Constraints**: Rules that ensure model validity (using OCL-like syntax)
- **Inheritance**: Metaclass hierarchies and specialization
- **Abstract classes**: Metaclasses that cannot be instantiated
- **Enumerations**: Predefined sets of values
- **Packages**: Organizing metaclasses into logical groups

### 2. Jjodel Tool Features
- **Visual Editor**: Graph-based interface for designing metamodels
- **Tree View**: Hierarchical view of metamodel structure
```

#### `documentation` — `DOCUMENTATION_PROMPT`, `defaultPrompts.ts:286-335` (50 righe, integrale). **Non consumato a runtime** (§4.2)

```
You are a documentation expert specializing in metamodel documentation.

## YOUR TASK
Analyze the provided metamodel structure and generate comprehensive, detailed documentation.

## ANALYSIS STEPS

1. **Identify the Application Domain**: Based on class names, attributes, and relationships, determine the specific domain (e.g., "Vehicle Fleet Management", "Healthcare Records", "E-commerce Platform")

2. **Write Extended Project Description** (3-5 sentences): Explain the purpose, scope, and potential use cases

3. **For Each Metamodel**: Write a description (2-3 sentences) explaining what it models

4. **For Each Class**: Write a detailed description including:
   - What real-world concept it represents
   - Its role in the domain
   - How it relates to other classes

5. **For Each Attribute**: Explain its purpose and what data it holds

6. **For Each Reference**: Explain the relationship semantics

7. **Confidence Score**: Rate 0-100 how confident you are in your domain identification

## OUTPUT FORMAT (JSON)
{
    "domain": "Specific domain name",
    "domainConfidence": 85,
    "projectDescription": "Extended description (3-5 sentences)...",
    "metamodels": [
        {
            "name": "metamodel name",
            "description": "Extended description (2-3 sentences)...",
            "classes": [
                {
                    "name": "ClassName",
                    "description": "Detailed description (2-4 sentences)...",
                    "attributeDescriptions": {
                        "attrName": "What this attribute represents..."
                    },
                    "referenceDescriptions": {
                        "refName": "The semantic meaning of this relationship..."
                    }
                }
            ]
        }
    ]
}

Be specific, detailed, and use domain terminology. Avoid generic descriptions.
```

#### `validation` — `VALIDATION_PROMPT`, `defaultPrompts.ts:341-385` (45 righe, integrale). **Non consumato**

```
You are a metamodel validation expert.

## YOUR TASK
Analyze the provided metamodel for potential issues and suggest improvements.

## CHECKS TO PERFORM

1. **Naming Conventions**
   - Classes should use PascalCase
   - Attributes should use camelCase
   - Names should be meaningful and domain-specific

2. **Structural Issues**
   - Orphan classes (no relationships)
   - Circular containment references
   - Missing required attributes (e.g., id, name)
   - Overly deep inheritance hierarchies

3. **Design Patterns**
   - Missing abstract base classes for common behavior
   - Duplicated attributes across classes
   - Inappropriate use of composition vs association

4. **Completeness**
   - Missing inverse references
   - Undefined multiplicity bounds
   - Missing constraints for business rules

{{#if projectName}}
## PROJECT: {{projectName}}
{{/if}}

## OUTPUT FORMAT (JSON)
{
    "issues": [
        {
            "severity": "error" | "warning" | "suggestion",
            "element": "ClassName or ClassName.attributeName",
            "message": "Description of the issue",
            "suggestion": "How to fix it"
        }
    ],
    "score": 85,
    "summary": "Overall assessment of metamodel quality"
}
```

#### `refactoring` — `REFACTORING_PROMPT`, `defaultPrompts.ts:391-424` (34 righe, integrale). **Non consumato**

```
You are a metamodel refactoring expert.

## YOUR TASK
Analyze the provided metamodel and suggest refactoring improvements.

## REFACTORING PATTERNS TO CONSIDER

1. **Extract Superclass**: Common attributes/references -> abstract base class
2. **Introduce Enumeration**: Limited string values -> enum
3. **Replace Inheritance with Composition**: Deep hierarchies -> composition
4. **Extract Interface**: Shared behavior -> interface/abstract class
5. **Merge Classes**: Highly coupled classes with 1:1 relationship
6. **Split Class**: Class with too many responsibilities
7. **Add Missing References**: Implicit relationships -> explicit references
8. **Normalize Attributes**: Repeated patterns -> separate class

{{#if projectName}}
## PROJECT: {{projectName}}
{{/if}}

## OUTPUT FORMAT (JSON)
{
    "refactorings": [
        {
            "type": "extract_superclass" | "introduce_enum" | "merge_classes" | "split_class" | ...,
            "priority": "high" | "medium" | "low",
            "elements": ["Class1", "Class2"],
            "description": "What to do",
            "rationale": "Why this improves the metamodel",
            "steps": ["Step 1", "Step 2", ...]
        }
    ],
    "summary": "Overall refactoring recommendations"
}
```

#### `ocl` — `OCL_PROMPT`, `defaultPrompts.ts:430-484` (55 righe, integrale). **Non consumato**

````
You are an OCL (Object Constraint Language) expert.

## YOUR TASK
Generate OCL constraints for the provided metamodel based on inferred business rules.

## OCL SYNTAX REFERENCE

```ocl
-- Invariant
context ClassName
inv constraintName: self.attribute > 0

-- Derived attribute
context ClassName::derivedAttr : Type
derive: self.relatedObjects->size()

-- Pre/Post conditions
context ClassName::operation(param: Type): ReturnType
pre: param > 0
post: result = self.value + param

-- Collections
self.items->size()
self.items->isEmpty()
self.items->notEmpty()
self.items->forAll(i | i.value > 0)
self.items->exists(i | i.name = 'test')
self.items->select(i | i.active)
self.items->collect(i | i.name)
```

## COMMON CONSTRAINT PATTERNS

1. **Non-null/Non-empty**: Required fields
2. **Range validation**: Min/max values
3. **Uniqueness**: No duplicates in collections
4. **Referential integrity**: Valid references
5. **Business rules**: Domain-specific logic

{{#if projectName}}
## PROJECT: {{projectName}}
{{/if}}

## OUTPUT FORMAT (JSON)
{
    "constraints": [
        {
            "class": "ClassName",
            "name": "constraintName",
            "type": "invariant" | "derived" | "precondition" | "postcondition",
            "ocl": "context ClassName inv ...",
            "description": "What this constraint ensures"
        }
    ]
}
````

#### `import` — `IMPORT_PROMPT`, `defaultPrompts.ts:490-523` (34 righe, integrale). **Non consumato**

```
You are a data import mapping expert.

## YOUR TASK
Help map external data (CSV, JSON, XML) to the metamodel structure.

## MAPPING CONSIDERATIONS

1. **Field Matching**: Match source fields to metamodel attributes
2. **Type Conversion**: Handle type mismatches (string -> number, date parsing)
3. **Reference Resolution**: Map foreign keys to metamodel references
4. **Data Validation**: Identify values that don't fit the metamodel
5. **Missing Data**: Handle null/empty values
6. **Transformation**: Suggest data transformations if needed

{{#if projectName}}
## TARGET METAMODEL: {{projectName}}
{{/if}}

## OUTPUT FORMAT (JSON)
{
    "mappings": [
        {
            "sourceField": "field_name",
            "targetClass": "ClassName",
            "targetAttribute": "attributeName",
            "transformation": null | "toUpperCase" | "parseDate" | ...,
            "confidence": 95,
            "notes": "Any special considerations"
        }
    ],
    "unmappedSource": ["field1", "field2"],
    "unmappedTarget": ["ClassName.attr1"],
    "warnings": ["Warning message about potential issues"]
}
```

#### `mappings` — `MAPPINGS_PROMPT`, `defaultPrompts.ts:529-661` (133 righe, oltre le 80: prime 20)

```
const MAPPINGS_PROMPT = `You are an expert in model-driven engineering and metamodel transformations.
You generate mappings for JjTL (Jjodel Transformation Language).

Analyze these two metamodels and suggest semantic mappings between them.

## Source Metamodel: {{sourceName}}

{{sourceMetamodel}}

## Target Metamodel: {{targetName}}

{{targetMetamodel}}

## Task

Identify which elements from the Source metamodel should map to which elements in the Target metamodel.
Consider:
1. Semantic similarity (even if names are different)
2. Structural similarity
3. Type compatibility
```

Il resto (righe 549-661) fissa le regole di sintassi JjEL per `conversionHint` (== e non ===,
`if/then/else` e non `?:`, commenti `--`), il divieto di mappare su classi astratte, il formato di
risposta JSON, le due-passate per le reference incrociate (`resolve(<feature>, <Type>)`), i binding
di contenitore (`sourceAttribute: "parent"`) e le reference irrisolvibili.

---

## 5. Versione e stato

- `frontend/package.json:3` → `"version": "3.0.0-beta"`.
- Costanti mostrate in UI: `frontend/src/version.ts` — `APP_VERSION` (da `package.json`),
  `BUILD_COUNT` (`git rev-list --count HEAD`), `BUILD_SHA` (`git rev-parse --short HEAD`), iniettate
  da `frontend/vite.config.ts:65-67`. Etichette: `VERSION_LABEL = "v3.0.0-beta (<build>)"` e
  `VERSION_FULL_BASE = "<versione> · build <n> · <sha>"`, rese nella status bar
  (`components/StatusBarRightZone.tsx:57-59`, col numero di schema Redux appeso).
- Nessuna costante di versione **specifica dell'AI** e' mostrata in UI: l'unica versionatura del
  sottosistema e' quella dei prompt (§4.3), visibile solo dentro Settings → Prompts.

### 5.1 Codice AI presente ma non raggiungibile dalla UI

Verificato con `grep -rn "<simbolo>" frontend/src --include='*.ts' --include='*.tsx'` escludendo il
file che lo definisce:

| Cosa | Path | Evidenza |
|---|---|---|
| **Intero modulo di generazione metamodelli** — hook `useMetamodelGeneration` (448 righe), UI di flusso `GenerationFlowComponents.tsx` (393), API `JjodieAPIImpl.ts` (226) con snapshot/undo propri, prompt `JJSCRIPT_GENERATION_PROMPT` (164) | `frontend/src/jjodie-integration/` | nessun import fuori dalla cartella; l'unica occorrenza esterna e' un **commento** in `components/TreeViewSidebar/TreeViewContent.tsx:1720` |
| Pannello mappature inferite | `jjtl/views/InferredMappingsPanel.tsx` | esportato da `jjtl/views/index.ts:20-21`, nessun consumatore |
| Pannello provider alternativo | `components/Settings/ProviderSettings.tsx` | zero occorrenze fuori dal file |
| Modale settings della Console | `components/Jodie/SettingsModal.tsx` | esportata da `components/Jodie/index.ts`, nessun consumatore |
| Selettore provider della Console | `components/Jodie/ProviderSelector.tsx` | idem (in uso e' `components/common/ProviderModelSelector.tsx`) |
| Widget flottante alternativo | `components/JjodieWidget/JjodieWidget.tsx` | in ascolto su `jodie:open` ma **mai montato**: `grep -rn "JjodieWidget" frontend/src --include='*.tsx'` fuori dalla cartella → 0 |
| Feature `scriptblock` | `types/jodie.ts:80` | dichiarata in `AIFeature`, nessuna risoluzione di preferenza propria |
| Provider `Llama`, `Copilot` | `types/jodie.ts:268-269` | elencati nelle Settings, `chat()`/`testConnection()` lanciano «not yet supported» |

**Wizard EnvGen** (`components/envgen/`, aperto da `components/project/ProjectEditor.tsx:2915`):
**non e' una superficie AI**. Costruisce un prompt Markdown a strati
(`services/EnvGenPromptBuilder.ts`) che l'utente **scarica** (`hooks/useEnvGenWizard.ts:143-153`,
`a.download = "<nome>-prompt.md"`) per portarlo altrove. Nessuna chiamata a provider (nessun
`fetch`, nessun import di `AIProviderService` nella cartella).

**Generazione AI di viewpoint / IR**: nessuna traccia. Cercato
`grep -rniE "ai.?generat|generate.*viewpoint|viewpoint.*(ai|llm)"` in
`components/editor-v2/viewpoint/`, `jjel/`, `jjtl/` → due soli falsi positivi lessicali
(`ViewpointRenderer.tsx:28`, `ir/irDefaults.ts:57`). Coerente con la spec IR v1.2: **il perimetro e'
pulito**.

---

## 6. Confronto con `jjodel-docs` (branch `docs/2026-09-update`)

Letti `src/content/docs/user-guide/console.md` e `src/content/docs/whats-new.md`.

| Affermazione nei docs | Verdetto | Cosa dice il codice |
|---|---|---|
| `console.md:39` «It answers questions about your models and, **for editing requests, generates JjScript commands and executes them**» | **Da correggere — e' l'affermazione piu' importante** | Jjodie **non esegue nulla**. Il blocco generato richiede due gesti dell'utente: «Run as JjScript» (`MarkdownRenderer.tsx:122-131`) e poi Run/Step nello `ScriptBlock` (`ScriptBlock.tsx:1354-1396`). Anche quando l'utente digita un comando JjScript in modo Jjodie, l'assistente **offre** di eseguirlo invece di eseguirlo (`Jodie.tsx:489-503`) |
| `console.md:39` «The AI backend is configurable in Settings under Providers (OpenAI, Anthropic, Ollama, and others)» | Corretta, imprecisa | Vero; vale la pena dire che la chiave sta in `localStorage` del browser e non segue l'account |
| `console.md:13` «Click the assistant icon in the status bar…, or the round assistant button on the canvas» | **Meta' sbagliata** | L'icona robot della status bar apre **le Settings**, non la Console (`StatusBarRightZone.tsx:51-53, 63-73`). La Console si apre dal bottone flottante sul canvas, cioe' la stessa finestra in stato minimizzato (`Jodie.tsx:798-803`) |
| `console.md:17` «il header porta il provider in uso (**Configure a provider** finche' non ne imposti uno)» | Coerente | `JodieHeader.tsx:182` monta `ProviderModelSelector` per la feature `chat`, che rimanda alle Settings quando manca (`ProviderModelSelector.tsx:106`) |
| `whats-new.md:70` «Configurable providers: OpenAI, Anthropic, DeepSeek, Mistral, Gemini, Groq, Kimi, Ollama, **or local**» | Da precisare | Gli otto nomi sono giusti. Manca **Custom** (endpoint OpenAI-compatibile arbitrario con Base URL, `types/jodie.ts:270`, `AIProviderService.chatCustom:632`), che e' probabilmente cio' che «or local» voleva dire; «local» in senso proprio e' **Ollama**. In lista compaiono anche **Llama** e **Copilot**, che pero' non sono usabili (errore «not yet supported») |
| `whats-new.md:70` «natural-language requests are **translated to JjScript and executed**» | Stessa correzione della prima riga | vedi sopra |
| `whats-new.md:68-70` sezione «AI assistance» limitata alla Console | **Incompleta** | Mancano tre superfici: **generazione della documentazione** (§2.3), **suggerimento di mappature JjTL** (§2.2), **«Explain this»** dal menu contestuale (§2.4). E manca il fatto che **i system prompt sono modificabili** in Settings → Prompts (§4.3) |
| `console.md:33` meta-comandi `/jjel`, `/js`, `/ask`, `/help` | Corretta | `ChatInput.tsx:303-306` |

Da aggiungere ai docs e oggi assente ovunque: il **selettore provider/modello per funzione** (chat,
documentazione, mappature, explain hanno preferenze indipendenti — `types/jodie.ts:80`), e il fatto
che la generazione della documentazione **passa automaticamente dall'AI** appena un provider e'
configurato, senza chiedere (`DocumentationTab.tsx:646`).

---

## 7. Rischi e dipendenze

1. **Chiavi API in `localStorage` in chiaro**, nello stesso record della storia della chat
   (`types/jodie.ts:426, 697`). Qualunque script nella pagina le legge. Da dire nei docs senza
   drammatizzare, ma da dire.
2. **Chiamate dal browser direttamente ai provider**, con `anthropic-dangerous-direct-browser-access:
   true` per Claude (`AIProviderService.ts:196`). Esiste un proxy Cloudflare
   (`types/jodie.ts:206-217`, `https://jjodel-ai-proxy.alfonso99.workers.dev`, con
   `AI.Claude.proxy = '/v1/anthropic/messages'` a riga 375) usato solo da chi passa per
   `getEndpoint()`. **`ExplainModal` usa `llm.endpoint` e quindi salta il proxy** (:148): su Claude
   funziona per il flag `dangerous-direct-browser-access`, su altri provider e' esposto al CORS.
3. **Nessun budget di contesto.** Su un M1 grande, il JSON di contesto della Console cresce senza
   limite e la storia della conversazione non viene mai potata: il fallimento arriva dal provider
   (errore di token) e l'utente vede solo «Sorry, I encountered an error».
4. **Il troncamento dell'output e' invisibile.** `finish_reason=length` / `stop_reason=max_tokens`
   finiscono solo in `console.warn` (`AIProviderService.ts:157, 215, 425`). Il presidio reale e'
   `validateScriptIntegrity`, che rifiuta lo script prima del primo comando — ma con il limite
   dichiarato in testa al file (`scriptValidator.ts:22-28`): un troncamento che cade su un comando
   sintatticamente completo **non e' rilevabile**.
5. **Undo di uno script lungo.** Nessun raggruppamento: N comandi = N (o piu') delta Redux, tetto
   100 (`reducer.ts:78`). Il comando JjScript `undo` e' inerte (§2.1).
6. **Cancellazione non implementata**: nessun `AbortSignal` in `AIProviderService` (TODO
   `AIMatcher.ts:54-56`, `ChatInput.tsx:650`); il bottone di stop della Console e' **solo UI**.
7. **Cinque prompt su sette sono personalizzabili ma inerti** (§4.2). Rischio di documentare una
   funzione che non produce effetti.
8. **Tre UI diverse per configurare gli stessi provider**, con campi diversi (§3.1, §3.3). Una
   `getStatus()` con i rami invertiti (`types/jodie.ts:713-721`: `if (this.isConfigured()) return
   {text: 'Not configured'}`) e' usata da `pages/settings/AIAssistantSettings.tsx:57`, cioe' dalla
   seconda UI: mostra «Not configured» proprio quando il provider **e'** configurato.
9. **Dipendenza esterna non-LLM nella documentazione**: la generazione interroga Wikidata
   (`DocumentationService.ts:720`) prima del provider.

---

## 8. Domande aperte per Alfonso

1. **La sezione dei docs deve descrivere le quattro superfici o solo quelle che vuoi supportare?**
   Explain copre cinque provider su nove e salta il proxy; documentare «Explain this» oggi significa
   documentare qualcosa che si rompe su Gemini/Ollama/Kimi/Custom.
2. **La generazione della documentazione senza revisione preventiva e' voluta?** E' l'unica
   superficie che scrive l'artefatto prima che l'utente lo veda. Se il principio «l'AI produce un
   artefatto che l'utente rivede» va tenuto anche qui, e' una modifica di codice, non di docs.
3. **`Llama` e `Copilot` restano nella lista dei provider?** Oggi sono visibili e non usabili. Nei
   docs li elenco, li ometto, o li dichiaro «annunciati e non attivi»?
4. **I cinque prompt inerti restano visibili in Settings → Prompts?** Documentarli come
   personalizzabili sarebbe fuorviante; nasconderli e' una modifica di UI.
5. **Il reset forzato del prompt `chat`** che perde la personalizzazione priva dei cinque marcatori
   (`PromptService.ts:26-28`) va documentato all'utente, o considerato dettaglio interno?
6. **Vuoi che i docs dichiarino la conservazione della chiave in `localStorage`** e il fatto che la
   configurazione e' per browser e non per account?
7. **Il modulo `jjodie-integration/`** (1250 righe di generazione metamodelli con snapshot e undo
   propri) e' lavoro in corso da riattivare o codice da rimuovere? Cambia se la sezione dei docs
   deve accennare a una roadmap.

---

## 9. Ricerche a supporto delle affermazioni di assenza (R-RAIL-28)

| Affermazione | Ricerca | Esito |
|---|---|---|
| `frontend/src/ai/` non esiste | `ls frontend/src/ai`; `find frontend/src -type d -name ai` | nessun risultato |
| Solo tre chiamanti di `chat()` | `grep -rn "AIProviderService" frontend/src --include='*.ts' --include='*.tsx'` (escluso `__tests__`) | 3 `.chat(`, 3 `.testConnection(` |
| Nessun altro `fetch` verso un LLM | `grep -rn "fetch(" frontend/src` filtrato su `api|proxy|endpoint|url|completions|generate` | solo `AIProviderService.ts`, `ExplainModal.tsx`, piu' Wikidata (`DocumentationService.ts:720`), help (`HelpDrawer.tsx:65`) e notifiche (`NotificationWidget.tsx:80`) |
| Solo `chat` e `mappings` consumano un prompt del registro | `grep -rn "getRendered\|PromptService.get(" frontend/src --include='*.ts' --include='*.tsx'` (escluso `__tests__`) | due sole chiamate di consumo |
| `undoStack` di JjScript mai popolato | `grep -rn "undoStack.push\|redoStack.push" frontend/src` | solo `jjscript/__tests__/commands.test.ts` |
| `jjodie-integration/` non raggiungibile | `grep -rn "useMetamodelGeneration\|GenerationFlowMessage\|JJSCRIPT_GENERATION_PROMPT\|buildSystemPromptWithJjScript\|getJjodieAPI\|createJjodieAPI" frontend/src` escludendo la cartella | 0 riferimenti di codice, 1 commento |
| `ProviderSettings.tsx` morto | `grep -rn "ProviderSettings" frontend/src --include='*.tsx' --include='*.ts'` escludendo il file | 0 |
| RAG non chiama provider | `grep -rn "fetch(" frontend/src/jjodie/rag frontend/src/services/JjodieRagService.ts` | 0 |
| Nessun troncamento del contesto | `grep -nE "slice\(|substring\(|maxChars|truncat|token" frontend/src/services/JjodieContext.ts frontend/src/services/AIProviderService.ts frontend/src/components/Jodie/*.tsx` | solo `CHAT_MAX_OUTPUT_TOKENS` (output) e usi non pertinenti |
| Nessuna generazione AI di viewpoint nell'IR | `grep -rniE "ai.?generat\|generate.*viewpoint\|viewpoint.*(ai\|llm)" frontend/src/components/editor-v2/viewpoint frontend/src/jjel frontend/src/jjtl` (escluso `__tests__`) | 2 falsi positivi lessicali, nessuna traccia |
| Nessun `AbortSignal` nel client | `grep -n "AbortSignal" frontend/src/services/AIProviderService.ts` | 0 (solo i TODO nei chiamanti) |

---

## 10. Conflitti con il protocollo, dichiarati e non risolti in autonomia

1. **P1 / regola 15** — il prompt cita `frontend/src/ai/` come sede dei client. Il path non esiste.
   Non ho fatto hard stop perche' l'oggetto della Fase 1 e' proprio individuare quei file; i path
   reali sono in §1.
2. **P9 / `CLAUDE.md` §21.2** — il blocco di entry di log fornito dal prompt e' in italiano
   (`**File toccati**`, `**Esito**`, `**Nome del documento prompt**`) e privo dei campi
   `Corregge`, `Causa`, `Regressions`, `Out-of-scope changes`, `Layer Impact Report`,
   `Smoke visivo`. Il formato canonico e' verificato byte a byte da `npm run check:docs`
   (`docs/PROTOCOL.md`, nota a P9). Ho scritto l'entry nel **formato canonico** portandone il
   contenuto: la scelta e' segnalata qui e in chat, non nascosta.
3. **P8** — derogata dal prompt (task read-only). Nessuno smoke eseguito.
