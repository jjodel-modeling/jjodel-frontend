# Discovery 2026-08-17 — Sync fra tab e ipotesi loop (P1 freeze)

**Tipo**: discovery read-only (Fase 1), nessuna modifica al codice.
**Base**: `origin/alfonso-frontend-jjtl` @ `3a6436ff6` (verificato identico al working tree locale: `git status` pulito, stesso HEAD).
**Obiettivo**: falsificare o sostanziare l'ipotesi prioritaria della RCA dei due freeze dell'editor: "loop di sync fra due tab dello stesso progetto". Punto di partenza: il trap `set` di `TargetableProxyHandler`, filo recuperato da una sessione precedente andata persa.

## File letti

- `frontend/src/joiner/proxy.ts` :231-537 (classe `TargetableProxyHandler`: `get` :276-293, `get0` :295-429, `set` :451-504, `deleteProperty` :511, `defaultSetter` :446-449, costruttore :241-253)
- `frontend/src/joiner/classes.ts` :111, :262-283 (import del tipo, uso via `windoww` in `wrap`), :2915 (default `DProject.type`), :2737-2742
- `frontend/src/redux/action/action.ts` :289, :305 (`sender`)
- `frontend/src/components/collaborative/Collaborative.ts` (intero)
- `frontend/src/components/collaborative/CollaborativeAttacher.tsx` (intero)
- `frontend/src/redux/reducer/reducer.ts` :225-254, :435-455, :610-720
- `frontend/src/common/U.tsx` :2851-2933 (`U.throttle`)
- Grep globali su `frontend/src`: `BroadcastChannel` (0 hit), `addEventListener('storage')` (4 hit, tutti preferenze UI: `Navbar.tsx:609`, `useInterfaceMode.ts:76`, `StatusBarRightZone.tsx:36`, `NotificationCenter.tsx:33`), `socket.io` (solo `Collaborative.ts` e `iot/IoT.ts`), `window.opener` (0 hit), `U.throttle(` (2 soli caller reali, entrambi in `Collaborative.ts`), `Collaborative.(send|connect|online)`, `'collaborative'`.

## Findings

### F1 — Il filo perso: TargetableProxyHandler non è in classes.ts
La classe vive in `proxy.ts:231-537`. `classes.ts` importa solo il tipo (`:111`) e recupera la classe runtime da `windoww.TargetableProxyHandler` (`:276-277`). I grep della sessione persa erano vuoti per questo.

### F2 — Un solo canale di sync fra tab, e condizionato
L'unico meccanismo che propaga stato del modello fra tab è socket.io (`Collaborative.ts`), attivo solo se `project.type === 'collaborative'` (`Project.tsx:81`, `App.tsx:198`). Il default di `DProject.type` è `'public'` (`classes.ts:2915`); il loader di persistenza coerce i valori non validi a `'private'` (`api/persistance/projects.ts:330`). Nessun `BroadcastChannel`, nessun evento `storage` per lo stato modello, nessun uso di `window.opener`.

### F3 — L'echo diretto è bloccato tre volte, ma il ping-pong derivato no
Ogni azione che passa dal reducer viene inviata se online (`reducer.ts:641`). Protezioni: `canSend` scarta azioni con `sender !== DUser.current` (`Collaborative.ts:46`); `filterSender` in ricezione scarta azioni con `sender === DUser.current` (`:91-103`); `fire()` dedup per `action.id` (`:138-148`). Nessuna di queste protegge dal loop di azioni DERIVATE: azione ricevuta → COMMIT → re-render → hook (es. useJjomSync) generano azioni nuove con id freschi e sender locale → reinviate → l'altro tab deriva a sua volta. Se la derivazione non converge, il ciclo è infinito con id sempre nuovi.

### F4 — U.throttle è globalmente inerte (gate di debug)
`U.tsx:2859-2861`: `if (id !== (window as any).dd && (window as any).dd !== 'all') { f(); return; }`. Con `window.dd` undefined (caso normale) ogni chiamata esegue subito, in modo sincrono; tutta la macchina di throttling sotto non gira mai. I due soli caller sono esattamente `collab_send` (batch previsto 300ms) e `collab_receive` (50ms): le difese anti-loop che l'autore stesso anticipava (commento `Collaborative.ts:80-82`, "prevent eternal retention in case of loop") non operano. Su localhost un eventuale ping-pong gira a velocità piena di event loop: main thread saturo, zero errori in console. Coerente col sintomo dei freeze.

### F5 — Due tab dello stesso utente non dovrebbero sincronizzarsi affatto
`Action.sender = DUser.current` alla costruzione (`action.ts:305`); `DUser.current` deriva dall'utente loggato (localStorage), identico in due tab dello stesso browser. Quindi `filterSender` scarta tutto ciò che arriva dall'altro tab: client-side, due tab same-user non si sincronizzano via collaborative. Questo contraddice l'osservazione della sessione (3) ("il tab progetto riceve le scritture via sync"). Da risolvere empiricamente: o i sender differivano (un tab con utente offline/anonimo?), o il progetto non era collaborative e la "sync" osservata era altro (reload?), o esiste un canale non trovato.

### F6 — Findings collaterali
- `CollabRefreshAction` ricevuta da altro sender esegue `window.location.reload()` (`reducer.ts:443-446`).
- `fire()` marca `actions[id] = true` PRIMA del COMMIT throttled (`Collaborative.ts:141-147`): se il throttle fosse mai attivo (`window.dd` settato) e droppasse, l'azione sarebbe persa per sempre. Oggi innocuo perché il throttle è inerte.
- Il trap `set` ingoia le eccezioni dei setter (`proxy.ts:479-481`: `Log.eDevv` e `return true`): una scrittura fallita appare riuscita al chiamante. Speculare dello swallow nel `get` (`:284-288`) già documentato nella microdiscovery del bug G (2026-05-13).
- Il blocco recompile del reducer (`:648-720`) muta solo `transientProperties`, non dispatcha azioni: nessuna re-entrancy da lì.
- `defaultSetter` pubblico (`proxy.ts:446-449`) non è mai chiamato dal trap: il fallback reale è `this.lg._defaultSetter`.

## Conseguenze per l'ipotesi P1

Albero di decisione:
1. Se il progetto dei freeze non era `collaborative`: ipotesi loop-fra-tab FALSIFICATA (nessun canale attivo). La causa è in-tab (render o sync) e la strada resta la riproduzione con DevTools Performance.
2. Se era `collaborative`: ipotesi viva e credibile, con amplificatore noto (F4). Il candidato è il ping-pong di azioni derivate (F3), non l'echo diretto.

## Dipendenze e rischi

- Un eventuale fix del gate `window.dd` in `U.throttle` riattiverebbe throttling per i due caller collaborative: cambio di timing in zona sync, da trattare con Layer Impact Report.
- `Collaborative.send` con throttle riattivato e `cumulative: true` emetterebbe in batch ritardato: verificare l'ordine relativo alle TRANSACTION prima di toccare qualsiasi cosa.
- Nessuna modifica proposta in questa fase.

## Domande aperte per Alfonso (check da 1 minuto, console del tab progetto)

1. Visibility del progetto dei freeze (quello vero e `test_B4_B6`): `Object.values(windoww.store.getState().idlookup).filter(d => d.className === 'DProject').map(d => [d.name, d.type])`
2. Network tab: esiste una connessione websocket con path `/collaborative` attiva?
3. In ENTRAMBI i tab: `windoww.DUser?.current` (o `DUser.current` se esposto): stesso valore o diverso?

Con 1 = `collaborative` e 3 = valori diversi, il loop fra tab diventa il candidato primario e la riproduzione col Performance profiler va fatta anche con un solo tab aperto, come controllo.

## Esito dei check (2026-08-17, stesso giorno)

Check 3 eseguito da Alfonso: `windoww.DUser?.current` = `'Pointer_OfflineUser'`. È la costante fissa dell'utente offline (`classes.ts:2654`), identica per costruzione in ogni tab dello stesso browser. Due conseguenze: `filterSender` scarta lato client qualsiasi azione proveniente dall'altro tab (sender identico), e il gate `!DUser.offlineMode` in `App.tsx:198` esclude il mount di `CollaborativeAttacher`. I check 1 e 2 diventano superflui: con sender identico l'applicazione cross-tab è impossibile a prescindere dalla connessione.

**Ipotesi "loop di sync fra tab": FALSIFICATA.**

## Conseguenze della falsificazione

1. Il secondo tab nei due freeze era passivo: nessun canale lo collega al tab editor. La RCA si sposta interamente in-tab (render o sync a valle della TRANSACTION).
2. La "sync fra tab" osservata nella sessione (3) va reinterpretata: con utente offline nessun canale la supporta nel codice. Spiegazione più probabile: le asserzioni giravano nello stesso contesto JS delle scritture, e il ritardo osservato in B6 era la normale propagazione Redux entro il tab, non fra tab. Da riverificare alla prossima occasione operativa, senza urgenza.
3. Lead in-tab per la prossima fase:
   - `reducer.ts:678`: `VIEWS_RECOMPILE_all === true` viene espanso in `Object.keys(ret.idlookup)` e `:700` pusha ogni id in OGNI coda `VIEWS_RECOMPILE_*` dello stato. Burst O(N*K) su progetti grandi. Da solo però non spiega il non-recupero: un burst finito termina.
   - Il non-recupero suggerisce un ciclo render → scrittura → render. Candidati: scritture di misura (useContentSize, pointRects, Measurable) innescate dal render stesso. Nota: `useContentSize.ts` è stato toccato da `1932c21ff` poco prima dei freeze; correlazione da verificare, non un'accusa.
   - `windoww.jjactions` (`reducer.ts:611-612`) accumula ogni azione senza limite: utile come discriminatore (cresce durante il freeze = ciclo di azioni; statico = ciclo di render puro). È anche un leak di memoria minore, da tracciare a parte.

## Protocollo di riproduzione (superato dalla riclassificazione sotto)

1. UN solo tab aperto (controllo coerente con la falsificazione).
2. DevTools Performance, Record.
3. Riprodurre freeze 1 (click "Add view" sulla riga Viewpoint) o freeze 2 (Enable IR edge).
4. Lasciar saturare 5-10 s, poi Stop: il trace resta leggibile anche se la pagina è bloccata.
5. Bottom-Up / Call Tree: una singola task lunga = loop sincrono (guardare la funzione dominante); task ripetute = guardare chi le scheda (setTimeout / rAF / microtask).
6. Prima del click annotare `windoww.jjactions.length`; nel trace verificare se il reducer compare ripetutamente (ciclo di azioni) o se il tempo è tutto in render/hook.

## Riclassificazione P1 (2026-08-17, sessione live con strumentazione)

Tentata la riproduzione in una sessione live via estensione Chrome su `localhost:3000`, con strumentazione installata in pagina (wrapper sul dispatch con breaker, PerformanceObserver longtask, heartbeat 500ms, tracer dei reload). Esito, in ordine di scoperta:

1. Un blocco totale del renderer osservato sulla dashboard (injection e `Runtime.evaluate` in timeout a 45s) si è rivelato **Chrome che congela i tab nascosti** (Energy/Memory Saver): appena il tab è tornato visibile, heartbeat regolare, zero long task, zero azioni, pagina sana. `document.visibilityState` era `hidden` durante i timeout.
2. F8 su pagina inattiva atterra nel **pump di flush**: `reducer.ts:1443` installa `setInterval(() => COMMIT(undefined, false), U.UpdatingTimer)` con `UpdatingTimer = 300` (`U.tsx:176`). Stack a un solo frame: pagina sana, nessuna saturazione.
3. Il marker `mismatching END() - transaction already closed` è **rumore di routine del pump** (`action.ts:149`, primo tick a transazione chiusa), non un sintomo.
4. Alfonso conferma: **nessun freeze gli risulta nell'uso normale dell'app.**

Conclusione: i due "freeze" della sessione (3) sono con ogni probabilità lo stesso artefatto. I test B4/B6 giravano via estensione con tab in background; Chrome li ha congelati; i timeout dei tool sono stati letti come "main thread saturo senza recupero e senza errori in console", che è esattamente la firma di un tab congelato da Chrome osservato solo attraverso i tool. **P1 riclassificato da "bug freeze editor" ad "artefatto di misura"; si riapre solo se un freeze viene osservato a schermo con tab in foreground.** Anche il reload loop al boot osservato oggi (5 giri autoestinti al primo load dopo l'avvio del dev server) è compatibile con i reload di ottimizzazione dipendenze di Vite a server freddo; derubricato.

### Regola operativa per i test via estensione Chrome

- Tenere il tab di test attivo e visibile durante i test; niente diagnosi con tab in background.
- Mai diagnosticare un freeze dai soli timeout dei tool: verificare prima `document.visibilityState`, poi un heartbeat in pagina.
- Su MacBook a batteria considerare Energy Saver/Memory Saver come primo sospetto; valutare l'esenzione di `localhost` dal Memory Saver nelle impostazioni di Chrome.

### Findings collaterali che restano validi (bassa priorità)

- `U.throttle` globalmente inerte (gate di debug `window.dd`, `U.tsx:2859-2861`); unici caller: pacing di Collaborative.
- Il trap `set` del proxy ingoia le eccezioni dei setter (`proxy.ts:479-481`); speculare dello swallow nel `get`.
- `R.navigate()` fa sempre full reload con la guardia anti-doppia-navigazione commentata (`U.tsx:129-140`).
- L'apertura di un progetto fa un full reload che non passa da `R.navigate`/`R.refresh` (terzo percorso da identificare: `R.replace` o `location.href`).
- `windoww.jjactions` cresce senza limite (`reducer.ts:611-612`): leak di memoria minore in sessioni lunghe.
- Progetto `test_B4_B6` a stato anomalo: 0 metamodelli e 0 modelli ma 21 views nel viewpoint Default (da verificare rispetto alle attese della sessione 3).
