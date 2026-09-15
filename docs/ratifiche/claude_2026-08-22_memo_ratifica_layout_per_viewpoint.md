# Ratifiche 2026-08-22 — Layout per viewpoint

**Contesto**: discovery `docs/discovery/discovery_2026-08-22_layout_per_viewpoint.md`, tre sessioni e
tre addendum (Fase 1 su D0, Fase 1bis sui tre fatti di Q0, Fase 1 ripresa su D9), eseguite e
analizzate in chat. Le decisioni qui sotto sono ratificate da Alfonso il 2026-08-22 e valgono come
vincoli per le slice future. Non vanno ridiscusse nei prompt: chi le contraddice segnala il conflitto
e si ferma.

**Serie**: `R-LAY-1..10`, iscritte in `docs/decisions.md` con `d0f4bf5fb` (2026-08-23).

**Nota sulla provenienza di questo file, da leggere prima del resto.** Il memo è stato **messo a
terra il 2026-08-23**, un giorno dopo la ratifica, e la sessione che lo scrive non ha accesso al
testo originale della chat del 22. Le dieci righe della sezione «Le ratifiche» sono **verbatim da
`docs/decisions.md`**, che è la fonte normativa. Tutto il resto (contesto, tracciabilità ai finding,
conseguenze) è **ricostruito dai documenti nel repo** e va letto come apparato, non come verbale.
Dove la ricostruzione non arriva è dichiarato esplicitamente in §8. Questo è il travaso che
`discovery_2026-08-22_layout_per_viewpoint.md` §B.0.2 segnalava mancante, ed è la seconda occorrenza
dello schema dopo `R-SIM` del 2026-08-17.

---

## Il fatto che riformula il capitolo

Il fronte nasce dalla tesi che il layout dei nodi debba essere per viewpoint. La discovery ha
falsificato l'ipotesi di partenza, ma **non nel verso atteso**: il layout condiviso non è un
accidente storico, è una decisione presa da Alfonso il **2026-07-19** e ri-ratificata come premessa
portante il **2026-08-03** dentro R-2, con la motivazione opposta alla tesi del fronte (il layout è
proprietà del disegno del modello, non della rappresentazione).

Il fronte quindi non è un progetto su terreno libero: è un **ribaltamento** di una decisione viva, e
richiede la revoca esplicita che R-LAY-3 formalizza. Questo è il senso della serie.

Il secondo fatto, dall'addendum di Fase 1 ripresa (§B.4, §B.6), è che **attivazione e resa non sono
la stessa cosa**. Il controllo di attivazione scrive un id singolo; il renderer classico applica tre
categorie di viewpoint insieme, e l'insieme che rende non è memorizzato ma ricalcolato per nodo e per
view a ogni scoring (`selectors.ts:552-559`). Su `editor-v2` le due risposte coincidono
(`irResolveCore.ts:139`). R-LAY-6, R-LAY-8 e R-LAY-9 sono le tre righe che sciolgono questo nodo, e
insieme chiudono il gate D9.

---

## Le ratifiche

Testo verbatim da `docs/decisions.md` (righe 1675-1693).

**R-LAY-1** (2026-08-22) — La posizione persistita di un nodo è per **viewpoint esclusivo**. Un gesto di disposizione compiuto mentre un viewpoint esclusivo è attivo non modifica la disposizione sotto gli altri viewpoint esclusivi.

**R-LAY-2** (2026-08-22) — La sintassi astratta è un viewpoint ai fini del layout e ha un record proprio. Non è il record condiviso su cui gli altri ricadono.

**R-LAY-3** (2026-08-22) — Emendamento a `claude_ratifiche_2026-08-03_state_actions_events.md:28`: la clausola «con la stessa semantica delle posizioni dei nodi» è ritirata. La decisione del 2026-07-19 su `irEdgeLayout` e `irCollapsed` resta vigente e non toccata; R-2 dello stesso memo resta intatta (cita la premessa, non ci poggia).

**R-LAY-4** (2026-08-22) — La taglia scelta dall'umano e il flag `isResized` sono per viewpoint esclusivo. La taglia derivata dal contenuto resta in sessione e non raggiunge il D-layer (`useContentSize.ts:82-89`), quindi è già per viewpoint per costruzione.

**R-LAY-5** (2026-08-22) — Il record di layout non si cancella quando l'elemento non è renderizzato nel viewpoint corrente. `NOT IN THIS VIEWPOINT` è reversibile e il layout deve sopravvivere al ritorno.

**R-LAY-6** (2026-08-22) — La chiave del layout è l'id del viewpoint esclusivo attivo, con una sentinella per la sintassi astratta. Non è l'insieme di ciò che rende: quell'insieme (`selectors.ts:552-559`) non è memorizzato, è ricalcolato per nodo e per view a ogni scoring, e le sue componenti non attive sono invarianti rispetto alla navigazione dell'utente, quindi non discriminano. Chiude il gate D9.

**R-LAY-7** (2026-08-22) — La prima slice di codice apre dopo la slice 2 di `2.228`: la chiave è definita in termini di `activeViewpoint` a 0..1. La discovery non ha questa dipendenza.

**R-LAY-8** (2026-08-22) — Solo i viewpoint esclusivi hanno un record di layout. I non esclusivi entrano nel rendering senza essere attivi (`selectors.ts:552-559`, terzo ramo) e non hanno interruttore (`NestedView.tsx:364` è gated su `isVP && d.isExclusiveView`): non sono navigabili, quindi non sono una dimensione della chiave.

**R-LAY-9** (2026-08-22) — Perimetro: `editor-v2`, dove attivazione e resa coincidono (`irResolveCore.ts:139`). Il renderer classico, la cui resa è cumulativa, non è esente ma governato: scrive sul record del viewpoint esclusivo attivo come editor-v2, e il fatto che la sua resa cumulativa non sia catturata dalla chiave è accettato e dichiarato. Un'esenzione lascerebbe due scrittori sullo stesso campo persistito con due contratti.

**R-LAY-10** (2026-08-22) — Nessuna implementazione finché non è accertato che esista **una sola sorgente** del viewpoint attivo. `NestedView.tsx:111` e `:315` scrivono `project.activeViewpoint` senza passare da `activateViewpoint`, quindi senza aggiornare `state.viewpoint`: se confermato, la chiave del layout è ambigua alla radice. Verifica e rimedio in perimetro `2.228` slice 2, non in un fronte a parte.

---

## Tracciabilità ai finding

Ogni riga contro il punto della discovery che la sostiene. Serve a chi riprende per sapere **quale
misura cade** se la riga viene emendata.

| Riga | Finding che la sostiene |
|---|---|
| R-LAY-1 | §A.3 (l'asimmetria taglia/posizione è viva a schermo: la posizione persistita è un angolo, non c'è anticollisione, la misura in §A.3.4) |
| R-LAY-2 | §B.6.2 (su `editor-v2` il confronto sul viewpoint attivo è secco, la sintassi astratta è il caso `null`) |
| R-LAY-3 | §3.1 e §3.2 (R-2 del 2026-08-03 riga 28, e la decisione a monte del 2026-07-19); §A.5 (R-2 **cita** la premessa, non ci poggia: è la misura che rende l'emendamento chirurgico invece che distruttivo) |
| R-LAY-4 | §A.3.3 (perché la taglia diverge per viewpoint mentre la posizione no, sta scritto nel codice) |
| R-LAY-5 | §A.4.2 (i due layout **convivono**, nessuno sovrascrive l'altro) |
| R-LAY-6 | §B.4 (lo stato scritto è un id singolo, l'insieme che rende è derivato); §B.6.3 (l'insieme che rende non è nemmeno stabile) |
| R-LAY-7 | §4 (dipendenza L-8, dichiarata dal prompt del 10:30 e **non verificata** in discovery); prompt `claude_2026-08-18_1656_prompt_2228_fase2.md`, slice 2 commit 2b |
| R-LAY-8 | §B.4 (terzo ramo di `selectors.ts:552-559`); §B.3 (i tre `bi-eye` che non sono il comando di attivazione) |
| R-LAY-9 | §B.6.1 contro §B.6.2 (l'asimmetria fra i due renderer) |
| R-LAY-10 | §B.5 (`activeViewpoint`, `state.viewpoint` e `getLastEditedViewpointId()` sono tre cose diverse); §B.8, secondo rischio, **non verificato a runtime** |

**Due gradi di certezza da non perdere.** Il rischio che R-LAY-10 codifica è **tracciato a codice e
non verificato a runtime**: la discovery lo registra come rischio, non come misura. E la dipendenza
di R-LAY-7 è **dichiarata dal prompt del 10:30 e mai verificata in discovery**. Nessuna delle due va
citata altrove come fatto misurato.

---

## Conseguenze operative

1. **Il percorso critico del fronte layout passa da `2.228`, non da sé stesso.** R-LAY-7 e R-LAY-10
   convergono sulla stessa slice. Il doppio scrittore che R-LAY-10 chiede di accertare
   (`NestedView.tsx:110-111`, `:314-315`) è già in perimetro nel commit 2b della slice 2 di `2.228`,
   che al 2026-08-23 non risulta eseguito: il log porta il commit preliminare e il 2a del 2026-08-19,
   non il 2b né il 2c.
2. **La discovery D1..D8 e D10 non ha queste dipendenze** ed è read only: può correre in parallelo.
3. **La sede del record resta aperta.** Le tre candidate (mappa sul carrier attuale, tabella a livello
   progetto, dizionario su `DViewPoint`) si decidono sui dati di D1 e D2, non prima. Il prompt del
   2026-08-22 17:05 vieta esplicitamente all'esecutore di sceglierne una.
4. **R-2 del 2026-08-03 resta intatta.** R-LAY-3 ritira la clausola citata, non la ratifica che la
   cita. Chi legge R-2 dopo questo memo la applica invariata.

---

## §8 — Addendum: lacuna dichiarata

Il prompt `claude_2026-08-22_1705_prompt_layout_per_viewpoint_d1_d8_d10.md` cita in RIFERIMENTI
«questo memo e il suo addendum §8».

**L'addendum §8 è perduto.** Non compare in nessun documento del repo, la sessione che mette a terra
il memo non ha il testo originale della chat, e Alfonso lo ha cercato il 2026-08-23 senza trovarlo.
Non è una lacuna in attesa di essere colmata: è chiuso così.

**Conseguenza operativa, che vale come clausola.** Un prompt che cita «l'addendum §8» in RIFERIMENTI
sta citando un documento inesistente. Chi lo legge lo dichiara nel report e procede sul resto, invece
di trattare come noto ciò che quella sezione avrebbe dovuto contenere. Se emerge che una decisione
poggiava su §8 e su nient'altro, quella decisione va rifatta, non ricostruita.

**Precedente da non ripetere.** §8 è andato perso perché il memo è stato consegnato in chat e non
messo a terra lo stesso giorno. È esattamente il rischio che la clausola di processo (b) della serie
`RC` è destinata a chiudere.

---

## Hard stop

Nessuna implementazione aperta da questo memo. R-LAY-10 è il divieto vigente; R-LAY-7 è l'ordine.
