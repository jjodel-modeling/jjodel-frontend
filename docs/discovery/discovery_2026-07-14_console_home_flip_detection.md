# Discovery — Console Jjodie: flip home + detection-con-offerta + rimozione whitelist (Fase 2b.3, Fase 1 read-only)

**Data:** 2026-07-14
**Tipo:** discovery read-only. NESSUNA modifica al sorgente permanente (solo questo report; harness temporaneo creato/eseguito/rimosso).
**Branch:** alfonso-frontend-jjtl
**Prerequisito:** working tree pulito ✅ (2b.2 già committato nello sweep `6a6cfade9`; log aggiornato in `2db234ac2`).
**Metodo:** lettura del working tree post-2b.2, esecuzione reale del parser JjScript su input campione (harness vitest `_detect_probe.test.ts`, rimosso), grep di stato.

---

## Obiettivo

Riconfermare lo stato post-2b.2 (righe stale) e chiudere le incognite della detection strict: come rendere `detect()` strict a diff minimo (F3), matrice falsi positivi/negativi eseguita sul parser reale (F4), punto di aggancio dei bottoni card (F5/F6), superficie da rimuovere (`isJjScriptCommand`, F7).

---

## File letti (path completi)

- `frontend/src/components/Jodie/Jodie.tsx` (stato modo, setMode/cycleMode, handleSendMessage, boot migration)
- `frontend/src/components/Jodie/ChatInput.tsx` (handleSubmit/handleKeyDown, gate meta-comandi, isCode/isJjodie)
- `frontend/src/components/Jodie/ChatMessages.tsx` (MessageBubble, CodeReplEntry, jodie-promote-btn)
- `frontend/src/components/Jodie/console/providers/jjscriptProvider.ts`, `console/types.ts`, `console/languageRegistry.ts`
- `frontend/src/jjscript/parser/parser.ts` (Parser class, `parse()`), `frontend/src/jjscript/types.ts` (ParseResult, ExecutionResult)
- `frontend/src/jjscript/services/JjScriptService.ts` (isJjScriptCommand, execute, formatResultForChat), `jjscript/index.ts`
- `frontend/src/jjscript/executor/executor.ts` (execute graceful)

---

## Findings

### F1 — Stato post-2b.2 reale (righe aggiornate)

`Jodie.tsx`:
- `normalizeConsoleMode(raw)` :52 (migrazione boot `chat→jjodie`/`code→jjel`).
- Stato modo: `const [persistedConsoleMode, setConsoleMode] = useLocalStorageString<ConsoleMode>(CONSOLE_MODE_KEY, 'jjodie')` :116; `const consoleMode = normalizeConsoleMode(persistedConsoleMode)` :119.
- `setMode(next, via?)` :319 (funnel: dispatch `JjodieEvents.CONSOLE_MODE_CHANGE {from,to,via}` + `setConsoleMode`); `cycleMode(via)` :329-333.
- Boot migration effect (one-shot) :337-340 (`if (persistedConsoleMode !== consoleMode) setConsoleMode(consoleMode)`).
- Cmd+J/Ctrl+. listener :345-363 (`cycleMode('cmdj'|'ctrl-dot')`, deps `[cycleMode]`).
- `handleSendMessage` :436; ramo jjscript :439 `if (consoleMode === 'jjscript' || JjScriptService.isJjScriptCommand(content))`.
- `/help` handler = `handleHelpRequested` (append entry statica); threading `onHelpRequested`, `onConsoleModeChange={setMode}` :700.

`ChatInput.tsx`:
- `isCode = consoleMode === 'jjel'` :126; `isJjodie = consoleMode === 'jjodie'` :128.
- Meta-comandi in `handleSubmit` :300-301 **gated `consoleMode === 'jjodie'`** (D7: da allargare); bypass Enter in `handleKeyDown` :411-412 (stesso gate).
- backtick → `onConsoleModeChange('jjel', 'backtick')` :365.

`JjodieEvents.CONSOLE_MODE_CHANGE = 'jodie:console-mode-change'`; via usati: `cmdj/ctrl-dot/pill/slash/backtick`. Switcher = segmented pill (classi `jodie-mode-switch*`), NON più chip.

### F2 — Persistenza modo (contenuta)

`grep 'jjodel.console.mode'` → SOLO `Jodie.tsx`: `CONSOLE_MODE_KEY` :46, `useLocalStorageString(...)` :116, `normalizeConsoleMode(persistedConsoleMode)` :119, boot migration write :338. **Nessun altro lettore/scrittore.** Flip = sostituire :116/:119 con `const [consoleMode, setConsoleMode] = useState<ConsoleMode>('jjodie')`, rimuovere `normalizeConsoleMode` (:52, resta senza caller) e l'effect :337-340. `codeFlavor` (`CONSOLE_CODE_FLAVOR_KEY`) resta persistito, invariato.

### F3 — Parser: strictness per `detect()` — RACCOMANDAZIONE

- `ParseResult = { success: boolean; ast?: CommandNode; errors?: ParseError[]; tokens?: Token[] }` (`types.ts:470`). **NON espone l'indice consumato**; espone la lista token completa.
- `Parser.parse(input)` (`parser.ts:66-107`): tokenizza, `parseCommand()` UNA volta dal primo token, ritorna `success: this.errors.length === 0`. **NON verifica il consumo completo** → i token residui sono ignorati (confermato: matrice F4). La classe traccia `this.current`/`this.tokens`/`isAtEnd()`/`check('EOF')` (privati). Standalone `parse(input)` :1329 = `new Parser().parse(input)`.
- Sincrono, senza side-effect (nessun redux/window): sicuro da chiamare a ogni submit. **Costo**: tokenize+parse di una riga ≈ sub-millisecondo (22 input parsati in ~3ms nell'harness). Trascurabile vs la string-compare della whitelist, ma comunque impercettibile per un submit umano.
- **Raccomandazione (diff minimo, additiva)**: parametro opzionale `strict` su `Parser.parse` e sul wrapper `parse`:
  ```ts
  parse(input: string, opts?: { strict?: boolean }): ParseResult
  ```
  Dopo `parseCommand()`, se `opts?.strict`: salta i NEWLINE finali e, se `!isAtEnd() && !check('EOF')`, spingi un errore (es. "Unexpected trailing input") → `success` diventa `false`. Default (nessun opts) = comportamento attuale ⇒ `executor.execute`, `JjScriptService.parseCommand`, autocomplete **invariati**. `detect()` chiama `parse(input, { strict: true }).success`. ~5 righe in `parser.ts`, zero cambio all'executor/run.
  - Alternativa scartata: campo additivo `consumedAll` su ParseResult (equivalente ma detect dovrebbe combinare `success && consumedAll`; il param strict è più diretto e non fa filtrare a valle).

### F4 — Matrice detect (STRICT) — eseguita sul parser reale

| Input | lenient | cmd | residual | **strict → detect** |
|---|---|---|---|---|
| `help` | ✓ | help | — | **TRUE** ⚠️ bare-cmd |
| `create class A` | ✓ | create | — | **TRUE** ✓ |
| `Temp extends A` | ✓ | extends | — | **TRUE** ✓✓ (bug-fix) |
| `abstract Foo` | ✓ | abstract | — | **TRUE** ✓ |
| `let $x = 5` | ✗ | — | — | **FALSE** (parse-fail; gap noto) |
| `delete the class please` | ✓ | delete | `class please` | **FALSE** ✓ (LLM) |
| `list all classes and tell me…` | ✓ | list | `classes and …` | **FALSE** ✓ (LLM) |
| `che classi ci sono nel modello?` | ✓ | eval | tutto | **FALSE** ✓ (LLM) |
| `how do I add inheritance` | ✓ | eval | tutto | **FALSE** ✓ (LLM) |
| `the cat sat on the mat` | ✓ | eval | tutto | **FALSE** ✓ (LLM) |
| `list` `undo` `redo` `clear` `validate` | ✓ | (cmd) | — | **TRUE** ⚠️ bare-cmd |
| `show A` `delete A` `rename A to B` `set A.x = 1` | ✓ | (cmd) | — | **TRUE** ✓ |
| `create` `delete` (bare) | ✗ | — | — | **FALSE** (incompleti → LLM) |

**Insight load-bearing:** la lingua naturale non-comando cade nel **fallback eval** del parser (`parseCommand` avvolge input non riconosciuto come `{command:'eval', expression: remainingInput()}` **senza avanzare `current`**), quindi `current=0`, residual=tutto → **strict FALSE**. Ecco perché `detect()` DEVE controllare i token residui (non basta `success`): senza strictness, il fallback eval + i residui ignorati produrrebbero falsi positivi a valanga. Confermato empiricamente.

**Nota:** anche `forall (senza do)`/`exists`/`with` finiscono nell'eval passthrough → strict FALSE → in modo jjodie vanno all'LLM (corretto: le espressioni JjEL non vanno offerte come JjScript; per JjEL c'è il modo jjel / `/jjel`). Solo il `forall…do…end` JjScript consuma davvero → strict TRUE.

**Falsi positivi residui (accettabili):** i comandi **mono-parola** validi a 0 argomenti (`help`, `list`, `undo`, `redo`, `clear`, `validate`) → offerta. Sono comandi JjScript legittimi; l'offerta è **non-silenziosa** (`[Chiedi a Jjodie]` disponibile), quindi coerente col design deterministico parse-based. Da citare nella checklist di verifica, NON da mitigare con euristiche. (`clear` nudo ≠ `/clear`: il meta-comando è già intercettato prima in ChatInput.)

**Gap noto:** `let $x = 5` non parsa (lenient FALSE) → i comandi `let` non vengono offerti in jjodie. Fuori scope (non toccare il parser oltre lo strict param); annotare.

### F5 — Rendering card con bottoni (pattern + design offerta)

- `MessageBubble` (`ChatMessages.tsx:51`) renderizza `jodie-promote-btn` quando `promoteCodeBlock && onTestInCode` (:126-129) → `onTestInCode(content, language)`. `isJjScript = !!message.jjscriptResult`.
- `CodeReplEntry` (:160) renderizza `[Ask Jjodie]` (`jodie-promote-btn jodie-code-entry__promote`) quando `isError && onAskJjodie` (:213-216) → `onAskJjodie(entry)`.
- Threading callback: `ChatMessages` props (:23-25 `onTestInCode`, `onAskJjodie`) ← `JodieWindow` ← `Jodie.tsx` (`handleTestInCode`/`handleAskJjodie`).
- **Design card offerta (su carta):**
  - Campo additivo opzionale su `ChatMessage` (`types/jodie.ts`): nome **grep-verificato libero** consigliato `jjscriptOffer?: { input: string; consumed?: boolean }` (evitare `offer` generico). Grep `jjscriptOffer` = 0 risultati (da riverificare in Fase 2).
  - Render: in `ChatMessages` un branch per `message.jjscriptOffer` (entry di sistema "Sembra un comando JjScript" + preview `input` + 2 bottoni, riuso `jodie-promote-btn` o nuove classi `jodie-offer-*` grep-verificate).
  - Callback: `onOfferExecute(entryId, input)` e `onOfferAsk(entryId, input)` threaded Jodie→JodieWindow→ChatMessages. L'handler in Jodie: appende il risultato (`jjscriptProvider.run`/`jjodieProvider.run`) **e** marca `jjscriptOffer.consumed = true` sull'entry (via setChatState per id) → bottoni disabilitati (`disabled={!!offer.consumed}`). Nessun cambio modo.

### F6 — Punto entry d'errore nei modi formali (D6)

- **jjscript**: `jjscriptProvider.run` (`console/providers/jjscriptProvider.ts:19-42`) fa `execute` + `formatResultForChat` + costruisce `ChatMessage` con `jjscriptResult:{success, command}`. Su **parse-failure**, `execute` ritorna graceful `{success:false, message:'Parse error'}` (executor.ts:71-83, **no throw**) → la card d'errore è un normale `ChatMessage` con `jjscriptResult.success === false`, resa da `MessageBubble` come card JjScript d'errore. **Non ha oggi alcun bottone.** ⚠️ `jjscriptResult` porta `{success, command}` ma **NON l'input originale**; il `command` è il `CommandType` (es. 'help'), non la stringa digitata. D6 (one-shot `[Chiedi a Jjodie]` che re-invia l'input) richiede quindi di **trasportare l'input originale** sull'entry d'errore → estensione additiva (es. `jjscriptResult.input?` opzionale, o un campo a parte). Aggancio: aggiungere il bottone in `MessageBubble` quando `isJjScript && !jjScriptSuccess`.
- **jjel**: la card d'errore è un `CodeEntry` reso da `CodeReplEntry`, che **ha già** `[Ask Jjodie]` (:213) → `onAskJjodie(entry)` → `handleAskJjodie` che **cambia modo a jjodie + prefila** (NON one-shot, NON mode-invariato). Conflitto diretto con D6 ("modo invariato, one-shot").
- **RACCOMANDAZIONE**: **D6 limitato al solo jjscript in 2b.3.** Lasciare l'affordance jjel esistente com'è (mode-switch+prefill). Aggiungere D6 a jjel richiederebbe o duplicare un bottone o cambiare la semantica del bottone esistente (rischioso, fuori dal minimo). Annotare nel log.

### F7 — Rimozione `isJjScriptCommand`

`grep -rn isJjScriptCommand` → 4 hit:
- `jjscript/services/JjScriptService.ts:24` — definizione metodo (`:24-56`, whitelist prima-parola + gate `/`-prefix `:30-37`).
- `jjscript/index.ts:16` — **commento** dentro un docstring d'esempio (non codice).
- `Jodie.tsx:438` — **commento**.
- `Jodie.tsx:439` — **unico caller runtime** (ramo jjscript di handleSendMessage).

Rimozione: cancellare il metodo (JjScriptService.ts:24-56) + la sub-func `startsWithCommand` (:42-56, usata solo da isJjScriptCommand — **verificare in Fase 2** che non abbia altri caller), aggiornare il caller :439 (→ `if (consoleMode === 'jjscript')` per il ramo esplicito), togliere il commento :438 e l'esempio nel docstring :16. **Post-rimozione: `grep -r isJjScriptCommand` = 0.** Nessun test cita il metodo (confermato dalla discovery 2b.1 §C11). Nessun special-case post-2026-07-10 trovato nel metodo (è la whitelist pura vista in 2b.1).

### F8 — Superficie da preservare

`ExecutionResult` (`jjscript/types.ts:447-457`), `ConsoleEntry`/`CodeEntry`/`ChatMessage` (`types/jodie.ts`), `CodeFlavor`, `ParseResult` — il piano resta **puramente additivo**: `detect?` opzionale su `LanguageProvider`, `jjscriptOffer?`/`jjscriptResult.input?` opzionali su `ChatMessage`, `strict?` opzionale su `parse()`. Nessun campo esistente cambiato/rimosso.

---

## Raccomandazioni sintetiche

1. **F3 strict**: parametro additivo `parse(input, { strict?: boolean })` + check residui in `Parser.parse` (default off). `detect()` = `parse(input,{strict:true}).success`.
2. **F6 D6**: **jjscript-only** in 2b.3; jjel invariato. Serve trasportare l'input originale sull'entry d'errore jjscript (additivo).
3. **F5**: campo `jjscriptOffer?` su ChatMessage + callback `onOfferExecute/onOfferAsk` + `consumed` per disabilitare i bottoni; riuso pattern `jodie-promote-btn`.
4. **F4**: accettare i bare-cmd (`help/list/undo/redo/clear/validate`) come detect-TRUE (offerta non-silenziosa); documentarli nella checklist.

---

## Divergenze rispetto al prompt

- **D3 "check dei token residui dentro detect()"** come alternativa: non praticabile pulita perché `current`/`isAtEnd` sono privati e `ParseResult` non espone l'indice consumato. L'opzione preferita del prompt (param strict additivo su `parse()`) è quindi anche l'unica pulita. Confermata.
- **D6** su jjel: il prompt prevedeva "se il punto è pulito"; NON è pulito (bottone `[Ask Jjodie]` esistente con semantica diversa) → raccomando jjscript-only (come il prompt stesso suggeriva).
- **D5** card offerta: `jjscriptResult` non porta l'input → per [Esegui]/[Chiedi] serve un campo che trasporti l'input (parte del design additivo F5); il `command` non basta.

---

## Rischi

- **R1 — Bare-cmd falsi positivi** (`help`, `list`, …): mitigati dal design (offerta non-silenziosa), ma da confermare visivamente che non infastidiscano (es. `help` in jjodie apre un'offerta invece di rispondere l'LLM). Nessuna euristica da aggiungere.
- **R2 — Eval passthrough**: la robustezza dello strict dipende dal fatto che il fallback eval NON avanza `current`. Confermato empiricamente su 22 input, ma è un invariante del parser non documentato: se un futuro cambio del parser facesse avanzare `current` nel fallback, lo strict darebbe falsi positivi. Da riverificare se il parser cambia.
- **R3 — Input originale su entry d'errore jjscript**: richiede un campo additivo; verificare che nessun altro consumer di `jjscriptResult` si rompa (è `{success,command}` letto in `MessageBubble` e in `Jodie.tsx`).
- **R4 — `startsWithCommand`**: verificare in Fase 2 che non abbia caller oltre `isJjScriptCommand` prima di rimuoverla (grep).
- **R5 — TEMP-DISCOVERY** in `executor.ts:65,68,69` (altra sessione): non toccare.

---

## Domande aperte per Alfonso

1. **Q1 — Bare-cmd**: OK offrire `help`/`list`/`undo`/`redo`/`clear`/`validate` (mono-parola) come JjScript in jjodie? (Deterministico + non-silenzioso; alternativa = lista di stop-word, ma reintrodurrebbe euristica — sconsigliato.)
2. **Q2 — D6 scope**: confermi **jjscript-only** (jjel mantiene il suo `[Ask Jjodie]` mode-switch attuale)?
3. **Q3 — Campo input su entry d'errore**: preferisci `jjscriptResult.input?` (estendo l'oggetto esistente) o un campo separato su `ChatMessage`? (Entrambi additivi.)
4. **Q4 — `/foo` sconosciuto in jjodie** (D4.1): entry statica "Unknown command. Type /help…", nessun LLM — confermi il testo e che valga solo in jjodie (in jjscript `/foo` va al provider che gestisce il `/`-prefix)?
5. **Q5 — Nome campo offerta**: `jjscriptOffer` va bene o preferisci altro (grep-verificato libero)?

---

## HARD STOP

Fase 1 completa. Nessuna modifica al sorgente permanente (harness rimosso, working tree pulito). La Fase 2 procede **solo dopo go-ahead esplicito** in chat a partire da questo report.
