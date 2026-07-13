# Discovery — Console Jjodie: indicatore di modo + affordance di switch (Fase 2b.2, Fase 1 read-only)

**Data:** 2026-07-12
**Tipo:** discovery read-only. NESSUNA implementazione, nessuna modifica al sorgente (solo questo report).
**Branch:** alfonso-frontend-jjtl
**Metodo:** lettura diretta del **working tree locale** (la 2b.1 NON è ancora committata — vedi §0), traccia statica dei submit/keyboard handler, dell'executor JjScript, del bus eventi.

> ⚠️ **Nota di stato (0).** La **Fase 2b.1** è presente nel working tree ma **non committata** (`console/` è untracked, `Jodie.tsx` è `M` non-staged). I riferimenti a `Jodie.tsx` in questo report usano la numerazione **post-2b.1** (lo stato reale su disco); i riferimenti agli altri file Jodie sono pre-2b.1 e non cambiati dalla 2b.1. I numeri di riga dei "Riferimenti pre-2b.1" del prompt sono stati riconfermati/aggiornati qui.

---

## Obiettivo

Ricostruire l'API reale uscita dalla 2b.1 e i punti esatti di aggancio per (a) indicatore di modo sempre visibile e (b) affordance di switch (`Cmd+J` cycle, `Ctrl+.`, click-chip→picker, autorità `/`), **senza modificare nulla**. Preparare il terreno per la Fase 2 con il blast-radius completo del passaggio da modo binario a 3 modi.

---

## File letti (path completi)

Registro/provider (2b.1, working tree):
- `frontend/src/components/Jodie/console/types.ts` — `LanguageProvider`, `ConsoleContext`, `ConsoleResult`, `LanguageProviderId`
- `frontend/src/components/Jodie/console/languageRegistry.ts` — `LanguageRegistry` + singleton `consoleLanguageRegistry`
- `frontend/src/components/Jodie/console/providers/{jjodieProvider,jjscriptProvider,jjelProvider}.ts`

Console UI/stato:
- `frontend/src/components/Jodie/Jodie.tsx` (state modo, Cmd+J, submit handlers, promozioni, clear)
- `frontend/src/components/Jodie/JodieWindow.tsx` (threading props → header/messages/input)
- `frontend/src/components/Jodie/JodieHeader.tsx` (`jodie-mode-switch` esistente, flavor subrow)
- `frontend/src/components/Jodie/ChatInput.tsx` (keyboard handler, submit, backtick, `/clear`)
- `frontend/src/components/Jodie/ChatMessages.tsx` (badge `jodie-promote-btn`)
- `frontend/src/components/Jodie/CommandPalette.tsx` (scaffold picker)
- `frontend/src/components/Jodie/JodieWindow.css` (classi `jodie-mode-switch*`, `jodie-flavor-switch*`, `jodie-code-subrow`)
- `frontend/src/types/jodie.ts` (`ConsoleMode`, `CodeFlavor`, `ConsoleEntry`, `CodeEntry`, `ChatMessage`)

Routing/executor/eventi:
- `frontend/src/jjscript/services/JjScriptService.ts` (`isJjScriptCommand`, `execute`, `formatResultForChat`)
- `frontend/src/jjscript/executor/executor.ts` (`executeCommand`, `execute`, `executeAST`)
- `frontend/src/jjscript/types.ts` (`ExecutionResult`)
- `frontend/src/events/registry.ts` (bus)
- `frontend/src/hooks/useInterfaceMode.ts` (pattern evento annunciato)

---

## Findings per punto

### 1. API del registro (2b.1) — reale

- **`LanguageProvider`** (`console/types.ts`): `{ id: LanguageProviderId; displayName: string; run(input: string, ctx: ConsoleContext): Promise<ConsoleResult> }`. `LanguageProviderId = 'jjodie' | 'jjscript' | 'jjel'`.
- **`ConsoleResult`** = `{ entries: ConsoleEntry[] }`. **`ConsoleContext`** = `{ makeId: () => string; codeFlavor?; activeProvider?; history?; projectContext?; ragInitialized?; images?; documents? }` (solo `makeId` required; il resto opzionale per-provider).
- **`LanguageRegistry`** (`console/languageRegistry.ts`): `register(p)` (throw su id duplicato), `get(id): LanguageProvider|undefined`, `list()`. Singleton **`consoleLanguageRegistry`** con i 3 provider registrati al load.
- **Provider risolti** a module-scope in `Jodie.tsx` (post-2b.1): `const jjodieProvider = consoleLanguageRegistry.get('jjodie')!` (+ `jjscriptProvider`, `jjelProvider`).
- **Selezione/invocazione nei due submit handler** (`Jodie.tsx`):
  - `handleSendMessage` (chat): `if (JjScriptService.isJjScriptCommand(content))` → `jjscriptProvider.run` (dentro un `try/catch`); altrimenti auto-switch provider LLM + `jjodieProvider.run`.
  - `handleSubmitCode` (code): `jjelProvider.run` (ora `async`, ctx `{ makeId, codeFlavor }`).
- **`isJjScriptCommand` è ANCORA il router chat-mode** (`Jodie.tsx:372`), esattamente come pre-2b.1. La 2b.1 non ha toccato la decisione, solo il dispatch.

### 2. Stato del modo

- Tipo: **`ConsoleMode = 'chat' | 'code'`** (`types/jodie.ts:874`); **`CodeFlavor = 'jjel' | 'js'`** (`:875`). `js` disabilitato in UI.
- Persistenza: `useLocalStorageString<ConsoleMode>(CONSOLE_MODE_KEY, 'chat')` (`Jodie.tsx:93`), chiave **`'jjodel.console.mode'`** (`:45`); flavor su **`'jjodel.console.codeFlavor'`** (`:46`, default `'jjel'`, `:94`). Hook helper `useLocalStorageString` (`:49`) — legge la stringa raw da localStorage, default se assente.
- **Boot** = valore persistito o `'chat'`. Lo state vive in `Jodie.tsx` (non in `chatState`, che tiene solo `messages/isOpen/isWaiting/hasUnread`). `onConsoleModeChange={setConsoleMode}` passato ai figli (`Jodie.tsx:633`).
- **Contenimento del tipo:** `ConsoleMode` è definito in `types/jodie.ts:874` e consumato SOLO da `Jodie.tsx`, `JodieWindow.tsx`, `JodieHeader.tsx`, `ChatInput.tsx`. (Il match in `components/abstract/Dock.tsx` è un **falso positivo**: sottostringa in `setVerticalConsoleMode`/`activateVerticalConsoleMode`, funzione di layout verticale non correlata.) → **widening contenuto ai 4 componenti Jodie + la definizione del tipo.**

### 3. Handler tastiera e submit

- **`Cmd/Ctrl+J`** = listener document-level in **`Jodie.tsx:290-310`** (NON in ChatInput). `isToggle = (metaKey||ctrlKey) && key.toLowerCase()==='j'` (`:295`); guardia focus-in-Jjodie/editable (`:296-301`); toggle **`setConsoleMode(consoleMode === 'chat' ? 'code' : 'chat')`** (`:304`); apre la finestra; deps `[consoleMode, setConsoleMode]` (`:310`).
- **`ChatInput.tsx` `handleKeyDown` (`:330-450`)**: backtick su input chat vuoto → `onConsoleModeChange('code')` (`:340-344`); autocomplete solo Code+JjEL (`:348-374`); **Enter** submit / Shift+Enter newline (`:376-397`) con **bypass esatto `/clear`** (`:382-385`); Esc history-restore (`:401-408`); history ↑/↓ (`:415-449`).
- **`ChatInput.tsx` `handleSubmit` (`:275-328`)**: bypass esatto **`/clear`** → `onClearRequested?.()` (`:282-307`); poi `if (isCode) onSubmitCode(trimmed)` (`:292`) **else** `onSend(...)` (`:312`). `isCode = consoleMode === 'code'` (`:122`).
- **Il gate `/`-prefix→whitelist NON è in ChatInput.** Vive dentro `JjScriptService.isJjScriptCommand` (`:30-37`: se `startsWith('/')` toglie lo slash e applica `startsWithCommand`), invocato da `Jodie.tsx:372`. ChatInput ha solo il bypass letterale `/clear`. → **i meta-comandi `/js /jjel /ask /help` vanno intercettati PRIMA di quel gate**: o in `ChatInput.handleSubmit` (dove già vive `/clear`, ma serve accesso a un callback per `/help` che stampa una entry), o in testa a `handleSendMessage` (prima della riga `:372`).
- `Ctrl+.` / period: **LIBERO** (nessun handler in `src/`), confermato. `Cmd+K` da NON usare (collide `GlobalSearch`/`Catalog`).

### 4. Ancoraggio JSX dell'indicatore

- Esiste già una UI di modo: **`jodie-mode-switch`** (segmented control 2 tab) in **`JodieHeader.tsx:189-211`**, dentro `jodie-header-left`, a destra del blocco titolo. Bottone "Chat" → `onConsoleModeChange('chat')` (`:191-200`), "Console" → `onConsoleModeChange('code')` (`:201-210`). CSS in **`JodieWindow.css:2154-2205`** (`.jodie-mode-switch`, `__opt`, `__opt--active`, varianti dark). Colori attivo già slate.
- **Flavor subrow** condizionata `{consoleMode === 'code' && ...}` (`JodieHeader.tsx:290-320`): `jodie-flavor-switch` JjEL/JS (JS disabled) + hint `jodie-code-scope` "scope: self, model, classes". CSS `JodieWindow.css:2206+` (`.jodie-code-subrow`, `.jodie-flavor-switch`).
- **`jodie-promote-btn` "Test in console mode"** (`ChatMessages.tsx:128-133`, `:215`) è un bottone di **promozione per-messaggio**, NON un indicatore di modo → non riusabile come chip; è un concetto diverso.
- **Anchor consigliato per il chip:** lo **stesso slot di `jodie-mode-switch`** in `jodie-header-left` (`JodieHeader.tsx:189`). Il chip è un singolo elemento a dimensione fissa (label del modo) → il layout non shifta ciclando (a differenza dei 3 tab che cambierebbero larghezza). Vedi **Domanda aperta Q1** (chip sostituisce o affianca `jodie-mode-switch`).

### 5. Bus eventi + pattern annunciato

- Bus in **`events/registry.ts`**: gruppi `JjodelEvents`, `JjScriptEvents`, `AIEvents`, `JjodieEvents (:81-84: METAMODEL_UPDATED, OPEN)`, `EnvGenEvents`, `AvatarEvents`, `SystemEvents (:98-102: INTERFACE_MODE_CHANGE='interfaceModeChange', JJTL_EXECUTION_RESULT, TREEVIEW_SCROLL)`.
- **Nessun evento di console-mode-switch esiste.**
- Pattern annunciato (template per D6): **`useInterfaceMode.ts:87,96`** → `window.dispatchEvent(new CustomEvent(SystemEvents.INTERFACE_MODE_CHANGE, { detail: { mode: newMode } }))`. Da rispecchiare: aggiungere una costante nel gruppo (naturale: **`JjodieEvents`**) e dispatchare con `detail: { from, to, via }`.
- **Collision check** dei nomi candidati (`CONSOLE_MODE_CHANGE`, `'jodie:console-mode-change'`, `cycleMode`): **LIBERI** (`grep -r` senza match).

### 6. Scaffold picker

- **`CommandPalette.tsx`** (`:1-213`): palette VS-Code-style a **overlay full-screen** (`.command-palette-overlay`), con ricerca+filtro+categorie, dipendente da **`JjodieHelpSystem.getCommandDescriptions()`** (`:7,:35`) — un **orfano** (dead code collaterale). È **dead code** (zero importer) ma è pensato per "cerca comando", non per un picker a 3 voci ancorato al chip. **Riusarlo trascinerebbe `JjodieHelpSystem` e un overlay pesante** → sproporzionato.
- **Raccomandazione:** **componente minimale nuovo** (popover ancorato al chip, 3 voci, evidenza attivo, chiusura click-fuori/`Esc`), coerente col design system. NON riusare `CommandPalette`; NON fare revival di `JjodieHelpSystem` (per `/help` basta una `ConsoleEntry` di sistema statica, §5 del prompt).

### 7. Robustezza provider jjscript su input arbitrario — **CONFERMATO GRACEFUL, NO THROW**

- `JjScriptService.execute` → `executeCommand` (`executor.ts:337-345`) → `executor.execute(input)` (`executor.ts:64-87`):
  - `parse(input)` (`:67`); se **parse fallisce** (`!parseResult.success || !parseResult.ast`, `:71`) → **ritorna** `{ success:false, command:'help', message:'Parse error', errors:[...] }` (`:72-83`). **Nessun throw.**
  - Altrimenti `executeAST` (`:93`), che ha **`try { ... } catch (error) { return { success:false, ... } }`** (`try` `:100`, `catch` `:202-215`) → anche gli errori runtime tornano graceful.
- **Conseguenza:** input prosa/non-parsabile in **modo JjScript esplicito** → `ExecutionResult{success:false, message:'Parse error'}` → `formatResultForChat` → card JjScript d'errore. **Il provider jjscript NON va incapsulato ulteriormente** in Fase 2.
- ⚠️ Working tree: `executor.ts` contiene righe `// TEMP-DISCOVERY` (`:65,:68,:69`) di una sessione precedente (timing discovery), pre-esistenti e **fuori scope** — non toccarle.

### 8. Superficie da preservare — **intatta**

- `ExecutionResult{.success/.command/.message/.warnings}` (`jjscript/types.ts:447-457`) — invariato (distinto dall'omonimo JjTL).
- `ChatMessage`, `ConsoleEntry = ChatMessage | CodeEntry`, `CodeEntry` (`types/jodie.ts:853/914/878`) — invariati dalla 2b.1. Il chip/switch/`/help` NON richiedono modifiche a questi tipi (una `ConsoleEntry` di sistema per `/help` è una normale `ChatMessage` assistant con `content` statico).

---

## Blast radius del widening `ConsoleMode` → `'jjodie' | 'jjscript' | 'jjel'`

Mappatura (D1): `chat→jjodie`, `code→jjel`, `jjscript` nuovo. Siti da adattare in Fase 2 (tutti nei 4 componenti Jodie + la def del tipo):

| File:riga | Oggi | Cambio in Fase 2 |
|---|---|---|
| `types/jodie.ts:874` | `type ConsoleMode='chat'\|'code'` | estendere a `'jjodie'\|'jjscript'\|'jjel'` (stesso tipo, non parallelo) |
| `Jodie.tsx:93` | default `'chat'` | migrazione boot `chat→jjodie`/`code→jjel`/legacy→default; default `'jjodie'` |
| `Jodie.tsx:304` | toggle `chat↔code` | **cycle** `jjodie→jjscript→jjel→jjodie` (via fn centralizzata) |
| `Jodie.tsx:331` | `setConsoleMode('code')` (handleTestInCode) | `'jjel'` |
| `Jodie.tsx:342` | `setConsoleMode('chat')` (handleAskJjodie) | `'jjodie'` |
| `Jodie.tsx:372` | `isJjScriptCommand` gate | **resta** in modo jjodie; in modo `jjscript` instrada TUTTO a `jjscriptProvider` (nuovo branch su `consoleMode`) |
| `Jodie.tsx:566,575` | clear/canClear `=== 'code'` | `jjel`=entry code; `jjodie`+`jjscript`=entry non-code (remap filtro) |
| `ChatInput.tsx:122` | `isCode = === 'code'` | `=== 'jjel'` (solo jjel usa `onSubmitCode`; jjodie+jjscript usano `onSend`) |
| `ChatInput.tsx:151,156` | history filter per `isCode` | jjel→CodeEntry stesso flavor; jjodie+jjscript→ChatMessage user (condiviso? vedi Q3) |
| `ChatInput.tsx:340-342` | backtick → `'code'` | → `'jjel'` (da jjodie/jjscript) |
| `JodieHeader.tsx:189-211` | `jodie-mode-switch` 2 tab | **chip+picker** (Q1: sostituisce o affianca) |
| `JodieHeader.tsx:247-248` | clear title `=== 'code'` | remap |
| `JodieHeader.tsx:290` | flavor subrow `=== 'code'` | `=== 'jjel'` |
| `JodieWindow.tsx:34-35,413,452` | prop type/threading `ConsoleMode` | invariato come threading; tipo si allarga da solo |

**Terzo submit path (modo `jjscript`):** oggi il routing binario è `isCode ? onSubmitCode : onSend`. Con 3 modi, `jjscript` va su **`onSend` → `handleSendMessage`**, dove un branch `if (consoleMode === 'jjscript')` instrada tutto a `jjscriptProvider` **bypassando `isJjScriptCommand`** (che resta il router del solo modo `jjodie`). Le entry del modo jjscript sono `ChatMessage` (come l'attuale path jjscript-in-chat) → raggruppate con le non-code per history/clear. Da confermare in chat (nessuna decisione unilaterale qui).

---

## Piano di aggancio proposto (per Fase 2 — solo dopo go-ahead)

1. **Modo:** estendere `ConsoleMode` in `types/jodie.ts`; funzione centralizzata in `Jodie.tsx` (`setMode(next)`/`cycleMode()` — nomi liberi) che fa `setConsoleMode` + dispatch evento (§6); migrazione boot nel/attorno a `useLocalStorageString` (gestire sia legacy `chat`/`code` sia i nuovi valori).
2. **Chip:** nuovo elemento in `JodieHeader.tsx` (slot di `jodie-mode-switch`), classi **`jodie-mode-chip`** (+ `__label`), dimensione fissa, slate/cyan-attivo, click→picker. Classi **grep-verificate libere**.
3. **`Cmd+J`→cycle + `Ctrl+.`:** modificare l'handler `Jodie.tsx:290-310` (o aggiungerne uno) per chiamare `cycleMode()`; `Ctrl+.` stesso cycle. Preservare `preventDefault`/guardie.
4. **Picker:** componente minimale nuovo (classi **`jodie-mode-picker`** libere), 3 voci, `Esc`/click-fuori. NON `CommandPalette`.
5. **Autorità `/`:** intercettare `/js /jjel /ask /help` **solo in modo jjodie**, prima del gate `isJjScriptCommand`. `/clear` invariato e mode-agnostico. Ogni altro `/…` cade nel comportamento odierno (whitelist, fino a 2b.3).
6. **Evento:** `JjodieEvents.CONSOLE_MODE_CHANGE = 'jodie:console-mode-change'` (nome libero), dispatch `detail:{from,to,via}`, nessun consumer in 2b.2.

---

## Divergenze rispetto alle assunzioni del prompt

- **D5 / "gate `/`-prefix→whitelist":** il prompt lo descrive come "l'attuale gate `/`-prefix→whitelist esistente" sull'input. In realtà quel gate **non è nell'input** (`ChatInput`): è dentro `JjScriptService.isJjScriptCommand` (`:30-37`), invocato da `handleSendMessage`. ChatInput ha solo il bypass letterale `/clear`. I meta-comandi vanno intercettati **prima di `handleSendMessage:372`** (in ChatInput submit o in testa a handleSendMessage). Sostanza invariata, ma il punto di aggancio è diverso da come suona il prompt.
- **D4 / anchor:** esiste già un `jodie-mode-switch` (2 tab Chat/Console) — non un "nessun indicatore". Il chip **generalizza/sostituisce** quella UI, non nasce da zero (vedi Q1).
- **`js` flavor:** ortogonale al modo, resta in `CodeFlavor` + subrow (che oggi appare in `code`, domani in `jjel`). Non entra nei 3 modi selezionabili (coerente col prompt).

---

## Rischi

- **R1 — Terzo submit path (jjscript mode):** è l'unico pezzo di semantica NUOVA (gli altri due modi sono behavior-preserving). Va deciso in chat come instradare `onSend` in modo jjscript senza toccare il router `isJjScriptCommand` del modo jjodie (proposta: branch su `consoleMode` in testa a `handleSendMessage`).
- **R2 — `jodie-mode-switch` vs chip:** rimuovere/nascondere il segmented control esistente è una modifica JSX (le classi CSS `jodie-mode-switch*` resterebbero inutilizzate → lasciarle per §4.2 CLAUDE.md, non rinominarle). Decisione di design (Q1).
- **R3 — History/clear per-modo:** con jjscript come modo separato ma entry ChatMessage, la history ↑/↓ e il clear raggruppano jjodie+jjscript insieme (non-code). Se si vuole separazione per-modo serve lavoro extra (Q3) — probabilmente fuori scope 2b.2.
- **R4 — Migrazione localStorage:** il valore persistito oggi è `chat`/`code`; dopo il primo switch diventa `jjodie`/`jjscript`/`jjel`. La migrazione di boot deve accettare **entrambe** le forme (legacy + nuova) e non rimuovere la chiave (2b.3).
- **R5 — `TEMP-DISCOVERY` in `executor.ts`:** righe di strumentazione pre-esistenti nel working tree, non mie, fuori scope — non toccarle in Fase 2.
- **R6 — 2b.1 non committata:** la Fase 2 costruirà su file untracked. Consigliabile committare la 2b.1 (dopo il gate visivo) prima di iniziare la 2b.2, per un diff pulito.

---

## Domande aperte per Alfonso (da decidere in chat prima della Fase 2)

1. **Q1 — Chip vs `jodie-mode-switch`.** Il chip+picker **sostituisce** il segmented control 2-tab esistente (`JodieHeader.tsx:189-211`, CSS `:2154+`), oppure il chip è un elemento separato e il segmented control diventa a 3 tab? (Raccomando: **sostituire** con chip+picker — un solo indicatore, coerente con D4, niente ridondanza; le classi `jodie-mode-switch*` restano orfane ma non rinominate.)
2. **Q2 — Terzo submit path.** Confermi l'approccio "modo `jjscript` usa `onSend`, e `handleSendMessage` branch-a `if consoleMode==='jjscript'` → `jjscriptProvider` bypassando `isJjScriptCommand`"? (È l'unica semantica nuova della 2b.2.)
3. **Q3 — History/clear.** In 2b.2 accettiamo che jjodie+jjscript **condividano** la history ↑/↓ e il clear (entrambi non-code, come oggi chat), con solo jjel separato (code)? O serve history per-modo a 3 vie (più lavoro, forse 2b.3)?
4. **Q4 — `/help` output.** `/help` stampa **una `ConsoleEntry` di sistema statica** (ChatMessage assistant con testo fisso: 3 modi + scorciatoie + meta-comandi), niente `JjodieHelpSystem`. Confermi il formato minimale?
5. **Q5 — Home evento.** Metto `CONSOLE_MODE_CHANGE` nel gruppo **`JjodieEvents`** (`'jodie:console-mode-change'`) o preferisci `SystemEvents`? (Raccomando `JjodieEvents`: la console è di Jjodie.)
6. **Q6 — Commit 2b.1.** Committiamo la 2b.1 (dopo il tuo gate visivo) prima di iniziare la 2b.2, così la 2b.2 parte da un working tree pulito? (Vedi R6.)

---

## Note per la 2b.3 (fuori scope 2b.2, emerse qui)

- Rimozione `isJjScriptCommand` + whitelist a prima-parola (`JjScriptService.ts:24-56`); oggi resta come router del modo jjodie e come gate dei `/…` non-meta.
- Detection-con-offerta in modo jjodie ("Sembra un comando JjScript · [Esegui] · [Chiedi a Jjodie]").
- Rimozione localStorage del modo / flip del boot.
- Affordance "manda a Jjodie" sull'errore dei modi formali.
- Eventuale unificazione delle ≥4 liste-comandi disallineate (segnalata nella discovery 2026-07-11).

---

## HARD STOP

Fase 1 completa. Nessuna modifica al sorgente (solo questo report). La progettazione della Fase 2 avviene in chat a partire da questo documento; **non procedere alla Fase 2 senza go-ahead esplicito**.
