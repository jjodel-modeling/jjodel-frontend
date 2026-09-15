# Memo di ratifica, 2026-08-24: la slice 1 del layout per viewpoint (R-LAY-14..17, RC-8..10)

**Stato: RATIFICATO.** Ratifica di Alfonso in chat di progetto (Cowork) il 2026-08-24, sulla
proposta `claude_2026-08-24_memo_proposta_layout_slice1.md` (architetto, notte fra il 23 e il 24).
Le righe del §2 sono il testo vincolante, iscritto verbatim in `docs/decisions.md` lo stesso
giorno (RC-9). Base: R-LAY-1..13, `discovery_2026-08-24_layout_d1_d8_d10.md`,
`discovery_2026-08-24_layout_fase1b_storesize_runtime.md`.

## 1. Cosa è stato ratificato, e cosa è cambiato rispetto alla proposta

La proposta è passata **con tre emendamenti**, tutti chiusure di buchi che il resolver avrebbe
incontrato al primo giorno di implementazione, nessuno un cambio di impianto:

1. **Materializzazione completa al primo gesto** (entra in R-LAY-15). Il testo proposto diceva
   «il primo gesto crea il record» senza dire cosa contiene. Se il primo gesto è un drag, la
   patch è `{x, y}`: un record parziale sotto la chiave nuova farebbe leggere a `manualSizeOf`
   (`jjomTransformers.ts:50-57`) campi indefiniti dal record invece che dagli scalari, e il
   fallback diventerebbe per campo, contro la lettera del read-through. Chiusura: la prima
   scrittura materializza il record completo dai valori efficaci in lettura, poi applica la patch.
2. **Regola esplicita per viewpoint attivo nullo o non esclusivo** (entra in R-LAY-16). R-LAY-8
   la implica, il contratto del resolver la scrive: in quei casi si legge e si scrive sugli
   scalari. È la clausola che rende operativo il «classico governato» di R-LAY-9 (drop di
   `MetamodelTab.tsx:138-139`). Il predicato di esclusività e la sorgente dell'attivazione sono
   quelli di `irResolveCore.ts:139`, per non aprire una seconda lettura (R-LAY-11).
3. **Record orfani accettati e dichiarati** (riga nuova, R-LAY-17). Un viewpoint cancellato
   lascia la sua chiave nei dizionari dei vertici toccati sotto di lui. R-LAY-5 copre l'elemento
   che smette di rendere, non la chiave che muore. Per la slice 1: garbage inerte, il
   read-through non lo consulta, nessuna pulizia; l'eventuale pulizia è una decisione futura,
   messa a registro ora perché nessuno la «scopra» come leak.

Confermati senza modifica: la sede (`DVertex.layoutByViewpoint`, scalari = record della sintassi
astratta, sentinella = assenza di chiave, zero migrazione), il fallback **(a) read-through**
contro (b) copia al primo accesso, il resolver unico come modulo puro senza DOM, `set_size`
dichiarato e non instradato, l'affettatura 1a/1b con `canvasToJjom.ts` in critical zone (two-phase
con Layer Impact Report; `jjomTransformers.ts` nel LIR come file toccato).

## 2. Le righe iscritte (verbatim in `docs/decisions.md`)

**R-LAY-14** (2026-08-24) — Sede: campo opzionale `layoutByViewpoint` su `DVertex` (`GraphDataElements.tsx:1662`), dizionario indicizzato dall'id del viewpoint esclusivo attivo al momento del gesto (R-LAY-6), record `VertexLayout = {x, y, w, h, isResized}` (il `GraphSize` di R-LAY-13 più `isResized` di R-LAY-4). I quattro scalari esistenti sono il record della sintassi astratta: la sentinella di R-LAY-6 è l'**assenza di chiave**, non un id. Nessuna migrazione: il dizionario nasce assente, i progetti esistenti sono già conformi, D7 non chiede un numero di versione; la collisione di grafia di D10.a resta un difetto dell'adapter (prompt delle 00:50), fuori dal layout. Idioma già in uso nel D-layer a tre righe di distanza (`isSelected` per utente, `ghostOffsets` per `refId`; D2). Alternativa scartata: chiave sentinella `Defaults.Pointer_ViewPointDefault` dentro il dizionario, che costa una migrazione dei quattro scalari per ogni vertice e porta la grafia doppia dentro la chiave del layout. Verbale: `claude_2026-08-24_memo_ratifica_layout_slice1.md`.

**R-LAY-15** (2026-08-24) — Lettura read-through: in assenza di record per il viewpoint esclusivo attivo si leggono gli scalari; nessuna copia implicita all'attivazione (alternativa (b) scartata: scrittura di massa alla prima attivazione e un record per ogni elemento anche mai toccato, contro lo spirito di D8). Il primo gesto sotto quel viewpoint **materializza il record completo dai valori efficaci in lettura e poi applica la patch**: mai record parziali, il fallback è per record e non per campo (emendamento del 2026-08-24: senza questa clausola un primo gesto di solo drag lascerebbe `w`/`h`/`isResized` indefiniti sotto la chiave nuova e `manualSizeOf`, `jjomTransformers.ts:50-57`, leggerebbe dal record invece che dagli scalari). Conseguenza dichiarata e accettata: finché nessun gesto tocca il nodo sotto `vp`, muoverlo in sintassi astratta lo muove anche sotto `vp`.

**R-LAY-16** (2026-08-24) — Scrittori e lettori passano da un resolver unico (`writeVertexLayout` / `readVertexLayout`): modulo puro, nessuna dipendenza dal joiner, testato senza DOM (lezione della Fase 1b, R-LAY-13). Contratto: con viewpoint attivo **nullo o non esclusivo** il resolver legge e scrive gli scalari (emendamento del 2026-08-24: R-LAY-8 lo implica ma il contratto lo scrive; è la clausola che rende il classico «governato» di R-LAY-9, drop di `MetamodelTab.tsx:138-139` incluso). Il predicato di esclusività e la sorgente del viewpoint attivo sono quelli che `irResolveCore.ts:139` già usa: nessuna seconda lettura dell'attivazione (R-LAY-11). `set_size` del proxy L (`GraphDataElements.tsx:668-685`) resta sugli scalari e viene **dichiarato, non instradato**, finché `storeSize` è fuori perimetro: il resize via proxy sotto viewpoint attivo scrive sulla sintassi astratta, atteso e non regressione, da riportare come non-obiettivo nella verifica visiva della slice 1b.

**R-LAY-17** (2026-08-24) — I record orfani di un viewpoint cancellato (chiavi di `layoutByViewpoint` il cui viewpoint non esiste più) si accettano e si dichiarano: garbage inerte che il read-through non consulta mai, nessuna pulizia nella slice 1. L'eventuale pulizia (nel delete del viewpoint o in una slice propria) è una decisione futura da prendere a registro, non un leak da scoprire. R-LAY-5 protegge il record quando l'elemento smette di rendere; questa riga copre il caso in cui a morire è la chiave.

## 3. Tracciabilità riga → fonte

| Riga | Da |
|---|---|
| R-LAY-14 | memo proposta §2 e §6 (candidata), verbatim più il rinvio al verbale |
| R-LAY-15 | memo proposta §3 opzione (a) e §6 (candidata), più emendamento 1 (chat 24/8) |
| R-LAY-16 | memo proposta §4 e §6 (candidata), più emendamento 2 (chat 24/8) |
| R-LAY-17 | emendamento 3 (chat 24/8), nessuna riga candidata nel memo proposta |
| RC-8 | memo proposta §7 ricostruzione (a) = regola del 23/8 (entry di log di `c2cbe814f`), confermata a voce |
| RC-9 | memo proposta §7 ricostruzione (b) = «clausola di processo (b)» del memo del 22/8, confermata a voce |
| RC-10 | memo proposta §7 ricostruzione (c) = clausola §8 del memo del 22/8 generalizzata, confermata a voce |

## 4. RC-8, RC-9, RC-10

Alfonso ha confermato a voce (chat del 24/8) che le tre ricostruzioni del §7 del memo proposta
**sono** le clausole del 22: si iscrivono come RC-8 (automazione: non è un difetto finché un umano
non riproduce a mano, `Causa (g)`), RC-9 (memo e prompt a terra nel repo lo stesso giorno,
corollario di RC-4) e RC-10 (documento inesistente: dichiarare e procedere; decisione che poggiava
solo su quello si rifà, non si ricostruisce). Testi in `docs/decisions.md` §Processo. Il todo 3
del checkpoint del 23/8 («le tre clausole di processo non sono iscritte») si chiude.

## 5. Fuori da questa ratifica

- Il rimedio per i gate «Create View» (§7 del memo proposta): proposta condivisa, prompt piccolo
  di corsia veloce, parte dopo un «vai» suo. Non è materia di questa ratifica.
- La slice 2 del layout (il classico oltre il drop, la sorte di `storeSize`): fuori dal memo, come
  già dichiarato nella proposta.
- La verifica a schermo di R-LAY-13 (b) resta conferma, non condizione (todo 1c del checkpoint).

## 6. Prossimo passo operativo

La slice 1a parte con un prompt two-phase: Fase 1 discovery read-only (sede del modulo resolver,
`viewpoint/ir/` o `sync/`; forma della patch action sul dizionario, sul precedente di
`ghostOffsets`) con report obbligatorio in `docs/discovery/`
(`discovery_<data>_<descrizione>.md`), hard stop, poi Fase 2 su go-ahead. `canvasToJjom.ts` non si
tocca nella 1a (solo nella 1b, con LIR).

## 7. Addendum 2026-08-24 (dopo la Fase 1 della slice 1a)

La Fase 1 (`discovery_2026-08-24_layout_slice1a_sede_resolver.md`, commit `04b13ab37`) ha
misurato cinque scostamenti dalla lettera delle righe ratificate, nessuno dall'impianto.
Decisioni di Alfonso in chat, 2026-08-24:

1. **Emendamento a R-LAY-13 e R-LAY-14**: di `GraphSize` si riusa la forma `{x, y, w, h}`, non la
   classe (nominale per il membro `private`, TS2740 misurato, discovery §2.3). `VertexLayout` è
   un'interfaccia autonoma nel modulo, senza `import type`; su `DVertex` il tipo è il literal
   strutturale inline (precedente `ghostOffsets`, `irEdgeLayout`), per non aprire l'arco
   `model/` → `editor-v2/`.
2. **Precisazione a R-LAY-15**: una sola action `'+='` (merge superficiale, `reducer.ts:240-252`;
   su campo assente agisce come `'='`, `reducer.ts:186-188`); «materializza poi applica» è ordine
   di calcolo. Divieto di bump di versione, anche no-op: rigenererebbe le default view non
   toccate (`VersionFixer.tsx:133-143`).
3. **Emendamento a R-LAY-16**: sorgente (`state.viewpoint`, `irResolveCore.ts:139`) separata dal
   predicato di esclusività, che non esiste come funzione e viene scritto nella 1b dentro
   l'adapter impuro, accanto al resolver (modello `irResolve.ts`/`irResolveCore.ts`); l'adapter
   mappa nullo o non esclusivo su `null` prima del modulo puro.
4. **Sede**: `components/editor-v2/viewpoint/layout/` (sorella di `ir/`, stesso perimetro di
   dipendenza, discovery §1.2-1.3). Il resolver descrive la scrittura
   (`resolveVertexLayoutWrite`) e non la esegue.
5. **Undo**: lettura statica del reducer sufficiente per la 1a; il gesto ⌘Z entra nelle prove
   della verifica visiva della 1b. Nessun test sul reducer nella 1a.

Le note di emendamento in place sono in `docs/decisions.md` sulle quattro righe, stile R-LAY-9.
