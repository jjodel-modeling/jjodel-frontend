# Discovery — Layout per viewpoint, Fase 1b: la macchina `storeSize` osservata

**Data**: 2026-08-24. **Fase**: 1b, misura di caratterizzazione. **Zona critica**: no.
**Branch**: `alfonso-frontend-jjtl`. **Base**: `6f38f37a6`.
**Decisioni che governano**: `R-LAY-1..12`, `R-RAIL-28`, `R-IRN-27`.
**Report che precede**: `discovery_2026-08-24_layout_d1_d8_d10.md`, §2.2, §2.3, §12.

---

## 0. Esito in una riga

**Il test chiesto dal prompt non è stato scritto, perché non è scrivibile.** La condizione di
arresto prevista dal prompt — «se il pattern esistente non permette di costruire viewpoint con view
figlie, fermati e dillo nel report: è un risultato» — si è verificata, ed è stata **misurata con
cinque sonde eseguite**, non dedotta. Nessun file di test è stato aggiunto; nessun file di
produzione è stato toccato.

Il punto 2 di §12 del report del 24 («nulla è stato eseguito a runtime») **resta aperto**, e questo
report spiega perché non è chiudibile con l'attrezzatura attuale del repo.

---

## 1. Passo zero — passato

```
$ command grep -c "R-LAY" docs/decisions.md
19                                    # atteso 19  ✓   (exit 0)

$ command grep -c "storeSize" frontend/src/view/viewElement/view.tsx
7                                     # controllo positivo, > 0  ✓   (exit 0)
```

Entrambi i valori attesi. Nessuna riga di eccezione da scrivere.

## 1.1 Convenzione dei gradi di certezza

La stessa del report del 24 (§0.4): **[MISURATO]** = eseguito e letto il risultato;
**[TRACCIATO]** = catena di codice letta, non eseguita; **[CITAZIONE]** = riportato da un
documento. Strumento: `command grep` (BSD grep 2.6.0-FreeBSD), mai il wrapper `ugrep
--ignore-files`; ogni asserzione di assenza porta il controllo positivo nella stessa invocazione
(`R-RAIL-28`).

---

## 2. Il pattern di fixture: quale ho cercato, e perché nessuno serve

Il prompt indica due riferimenti. Li ho letti entrambi.

| Riferimento | Pattern reale | Costruisce proxy L veri? |
|---|---|---|
| `redux/__tests__/versionfixer_2228_migration.test.ts` | **copia** del corpo dell'adapter + record `idlookup` a mano | no, per dichiarazione propria |
| `view/viewElement/__tests__/viewSubtree.test.ts` | funzione **pura** (`collectViewSubtree`) su slice `idlookup` a mano | no |

Il primo dichiara il motivo nella propria intestazione, verbatim [CITAZIONE]:

> The body below is a COPY of that adapter, not an import: `VersionFixer.tsx` drags the whole
> joiner in and **is not loadable in the node vitest environment**.

Il secondo importa una funzione pura che non tocca il joiner. **Nessuno dei due costruisce un
`LViewElement`**, e quindi nessuno dei due è estendibile alle cinque domande, che richiedono di
eseguire `get_updateSize` e `get_getSize` su un `Context` vero.

Censimento dell'intero parco test, per non fondare l'affermazione su due campioni [MISURATO]:

```
$ command grep -rln "joiner" --include="*.test.ts" src/     # 16 file
```

Dei 16, **nessuno importa il joiner davvero**. I quattro modi in cui lo nominano:

| File | Come nomina il joiner | Riga |
|---|---|---|
| `edges/routing/manhattan/__tests__/routing.test.ts` | `vi.mock('../../../../joiner', …)` — lo **sostituisce** | `:13` |
| `services/export/__tests__/ecore-io.test.ts` | lo legge **come file di testo** (`path.resolve`) | `:122` |
| `jjel/__tests__/ambiguous-instance.test.ts` | commento: «the joiner barrel -> `window is not defined`» | `:8` |
| `components/…/ir/__tests__/ir.test.ts` | commento: «the real lproxy backend imports the joiner and …» | `:170` |

`jjtl/__tests__/executor-llayer.test.ts`, il nome più promettente del parco, dichiara in testa di
**simulare** i proxy: «plain objects with the same property structure as L-layer proxies».

L'asserzione «nessuno dei 16 importa il joiner» è un'assenza, e porta il suo controllo positivo
sullo stesso comando (`R-RAIL-28`) [MISURATO]. Cercando una `import ... from '...joiner'` reale
(esclusi i `vi.mock`) sui 16 file: **zero righe**. Lo stesso pattern su `view.tsx`, importatore
noto, ne trova tre:

```
9:} from "../../joiner";
43:} from "../../joiner";
44:import {DUser, EPSize, Pack1, transientProperties } from "../../joiner/classes";
```

Il controllo ha segnale, quindi il silenzio sui 16 è un risultato e non un comando rotto.

**Conclusione del censimento [MISURATO]**: il repo non possiede, oggi, un solo test che costruisca
un proxy L vero. Non è una lacuna di questo tentativo: è lo stato dell'attrezzatura.

---

## 3. Le cinque sonde: dov'è il muro, misurato

Il prompt chiede di eseguire, non di leggere. Ho quindi tentato di eseguire, per **non** dichiarare
un'impossibilità sulla fede di un commento altrui (`R-RAIL-28`, emendamento: vale anche per le
asserzioni di presenza). Cinque sonde in escalation, ciascuna un file di test temporaneo poi
rimosso.

| # | Sonda | Esito [MISURATO] |
|---|---|---|
| 1 | `import('../view')`, env node nudo | `ReferenceError: window is not defined` — `monaco-editor/esm/vs/base/browser/window.js:14` |
| 2 | `import('../../../common/Geom')` (il solo `GraphSize`) | idem, stessa riga di monaco |
| 3 | sonda 1 + shim `window`/`document`/`matchMedia` | supera monaco, poi `TypeError: Cannot read properties of undefined (reading 'createElement')` — `jquery.js:979` (`assert` → Sizzle `setDocument`) |
| 4 | sonda 2 + lo stesso shim | idem, stessa riga di jQuery |
| 5 | `ls -d node_modules/jsdom node_modules/happy-dom` | entrambe assenti; **controllo positivo** sullo stesso comando: `node_modules/jquery` e `node_modules/monaco-editor` presenti |

Lettura delle sonde:

- Il muro **non è** `view.tsx`: è a monte. Anche `common/Geom.ts`, che definisce `GraphSize`
  (`Geom.ts:677`), tira dentro monaco e jQuery. La domanda 5 non è quindi separabile dalle altre.
- Lo shim `window`/`document` **sposta** il muro da monaco a jQuery, non lo abbatte: jQuery
  pretende un DOM vero (`document.implementation`, `documentElement.nodeType`), non un oggetto
  letterale. Da qui in poi la strada è «scrivere jsdom a mano», che è jsdom.
- jsdom e happy-dom non sono installati, con controllo positivo nella stessa invocazione.
  Installarne uno è **una dipendenza nuova**: Regola 4 (approvazione), e comunque fuori dal
  perimetro di un prompt che vieta ogni modifica di produzione.

**Corroborazione indipendente, dalla baseline del repo [MISURATO]:**

```
$ npm run test
Test Files  9 failed | 51 passed (60)
     Tests  1323 passed (1323)
```

I 9 file rossi non eseguono **zero** test ciascuno (`0 test`): non falliscono asserzioni, non si
caricano. Causa unica, per `uniq -c` sull'output: `ReferenceError: window is not defined`. Fra
loro c'è proprio `jjtl/__tests__/executor-llayer.test.ts`. Il muro che ho misurato è quindi una
proprietà permanente e già visibile di questa suite, non un incidente della mia sonda.

---

## 4. Perché anche il mock del barrel non salverebbe la misura

Resta l'ipotesi «mocka il joiner come fa `routing.test.ts`, e chiama i closure veri». Va scartata,
e il motivo è **semantico**, non tecnico. Vale la pena scriverlo perché è la trappola in cui questa
fase poteva finire producendo un file verde e privo di valore.

Entrambe le funzioni sotto misura prendono il viewpoint da un'unica sorgente, verbatim
(`view.tsx:1684` in `get_updateSize`, `:1731` in `get_getSize`):

```typescript
let vp = c.proxyObject.viewpoint;
```

`viewpoint` è `get_viewpoint` (`view.tsx:1563-1580`), che risale la catena dei padri fino alla
radice via `LPointerTargetable.fromPointer` → `LPointerTargetable.wrap`
(`joiner/classes.ts:2394-2414`), cioè la macchina dei proxy appoggiata allo store vero.

**La domanda che questa fase esiste per misurare è precisamente "chi è `vp`".** Un test che
stubba `c.proxyObject.viewpoint` *decide* la risposta invece di osservarla: sarebbe verde, e
misurerebbe il mio stub. È la sotto-regola di `CLAUDE.md` §5 sui sort, nella sua forma generale —
la sola validazione valida è l'esecuzione su input vero.

Nota di precedente [CITAZIONE]: `routing.test.ts:8-12` ha già incontrato e dichiarato questo
confine, deferendolo — «require either jsdom or a full mock of GraphPoint/GraphSize/EdgeSegment/
LViewElement/LGraph; those are deferred to a follow-up that introduces the necessary test
scaffolding».

---

## 5. Le cinque risposte: la tabella richiesta

Colonna «osservato» compilata onestamente. Nessuna riga è stata eseguita.

| # | Domanda | Atteso dalla lettura (report del 24) | **Osservato a runtime** | Riga che l'avrebbe esercitata |
|---|---|---|---|---|
| 1 | Chi scrive dove, con `activeViewpoint = B` e nodo reso da `vA` | `A.size[n.id]`: `vp` è la radice dei padri di `vA`, non il viewpoint attivo — [TRACCIATO] | **non osservato** (muro §3) | `view.tsx:1684-1688`, scrittura a `:1715` |
| 2 | Chi legge da dove | `vA.getSize` → `A`; `vB.getSize` → `B`; `activeViewpoint` ininfluente — [TRACCIATO] | **non osservato** | `view.tsx:1727-1736` |
| 3 | La view come sede (`vA.storeSize=true`, `A.storeSize=false`) | scrittura su `vA`, non su `A`: il gate `:1685` è `c.data.storeSize` della view — [TRACCIATO] | **non osservato** | `view.tsx:1685`, `:1715` |
| 4 | Il fallback con tutti gli `storeSize` a `false` | `updateSize` torna `false` (`:1687`), scalari D unica sede | **non osservato** | `view.tsx:1685-1688` |
| 5 | `GraphSize` porta `x`/`y`, non solo `w`/`h` | sì: `newSize.x`/`.y` assegnati `:1692-1703` prima di `w`/`h` `:1710-1711` | **non osservato** | `Geom.ts:677`, `view.tsx:1692-1715` |

---

## 6. L'unico avanzamento di questa fase, e il suo grado

Una cosa è stata accertata, ed è **[MISURATO]** benché non a runtime, perché è un conteggio su file
e non una semantica d'esecuzione:

```
$ command grep -n "activeViewpoint" frontend/src/view/viewElement/view.tsx
373:        let activeVP: LViewPoint | null | undefined = LProject.getProject()?.activeViewpoint;
909:            if (!(dproject && dproject.activeViewpoint === c.data.id)) return '';
--- controllo positivo, stesso file, stesso comando ---
$ command grep -c "viewpoint" frontend/src/view/viewElement/view.tsx
42
```

Due sole occorrenze in tutto `view.tsx`, **entrambe fuori dalla catena della taglia**:

- `:373` — scelta della view padre alla **creazione** di una view;
- `:909` — gate del CSS compilato per i viewpoint esclusivi.

`get_updateSize` (`:1681-1718`) e `get_getSize` (`:1721-1738`) **non nominano mai**
`activeViewpoint`. Il loro unico riferimento al viewpoint è `c.proxyObject.viewpoint`, cioè la
radice della catena dei padri.

**Conseguenza, di grado [TRACCIATO] e da non ratificare senza runtime**: la macchina esistente
sembra indicizzare per *radice dei padri della view che rende*, mentre `R-LAY-6` sceglie come
chiave *l'id del viewpoint esclusivo attivo*, e `R-LAY-9` afferma che il renderer classico «scrive
sul record del viewpoint esclusivo attivo come editor-v2». Le due chiavi coincidono solo quando la
view resa discende dal viewpoint attivo. È esattamente il sospetto che il prompt voleva mettere
alla prova; questa fase lo **rafforza staticamente** e **non lo dimostra**.

---

## 7. Scostamenti fra letto e osservato

Nessuno, e la voce non è vuota per fortuna ma per costruzione: non essendoci osservato, non c'è
scostamento misurabile. Registrarlo come «nessuno scostamento» senza questa precisazione sarebbe
una falsa conferma del report del 24.

Un solo scostamento **fra prompt e repo**, minore e già assorbito: il prompt cita
`frontend/src/redux/__tests__/versionfixer_2228_migration.test.ts`, che esiste; una mia prima
lettura lo aveva dato per assente per deriva di `cd` della shell, non per assenza reale. Corretto
prima di qualunque conclusione, e citato qui perché è il modo tipico in cui nasce una falsa
asserzione di assenza (`R-RAIL-28`).

---

## 8. Ciò che NON è stato accertato

1. **Le cinque domande del prompt, tutte.** Nessuna riga di `get_updateSize` o `get_getSize` è
   stata eseguita. Il punto 2 di §12 del report del 24 resta aperto e invariato.
2. **La chiave reale della macchina esistente.** §6 la argomenta su un conteggio di occorrenze e
   sulla lettura di `get_viewpoint`: resta [TRACCIATO]. Un `vp` che a runtime risultasse diverso
   dalla radice dei padri smentirebbe §6 senza smentire il conteggio.
3. **Se un DOM vero cambierebbe l'esito.** Le sonde 3 e 4 dicono dove si ferma uno shim
   letterale, **non** che con jsdom i cinque test passerebbero: dopo jQuery potrebbero esserci
   altri consumatori di DOM nella catena del joiner. Non l'ho misurato, e non potevo senza
   installare la dipendenza.
4. **Il costo di introdurre quell'attrezzatura.** Non ho stimato quanto valga portare jsdom (o un
   `environment: 'jsdom'` per-file) in questo repo, né quali dei 9 file oggi rossi tornerebbero
   verdi. È una decisione di architettura del testing, fuori perimetro.
5. **La verifica a schermo.** Il paragrafo «per Alfonso» del prompt (due viewpoint esclusivi,
   `bind sizes to view` acceso su entrambe le view) **non è stato eseguito da me**: è la prova
   che oggi può effettivamente rispondere alle domande 1 e 2, e resta da fare.

---

## 9. Dove mi sono fermato, e perché

Fermato **prima di scrivere il file di test**, sulla condizione di arresto esplicita del prompt.
Le alternative scartate, con il motivo:

| Alternativa | Perché scartata |
|---|---|
| Installare `jsdom` + `environment: 'jsdom'` | dipendenza nuova (Regola 4) e modifica di configurazione: il prompt vieta ogni modifica di produzione |
| Mockare il barrel `joiner` | stubberebbe `c.proxyObject.viewpoint`, cioè la risposta stessa (§4) |
| Scrivere i test come copia della logica di `updateSize` | misurerebbe la copia, non `view.tsx`; e a differenza di `VersionFixer` qui non c'è il vincolo di migrazione che in `R-IRN-20` giustifica la duplicazione |
| Scrivere i cinque `it` con `.skip` | un file verde che non misura nulla, e un falso segnale di copertura a registro |

Il divieto del prompt su sede e `R-LAY-13` è rispettato: §6 riporta uno scostamento fra la macchina
esistente e `R-LAY-6`/`R-LAY-9`, e **non propone** quale delle due chiavi debba prevalere. È
decisione della chat.

---

## 10. Gate [MISURATO]

| Gate | Esito |
|---|---|
| `npm run test` | **1323 pass, 9 file rossi** — identico alla baseline. Il prompt prevedeva `1323 + N`: qui `N = 0`, perche' il file di test non e' stato aggiunto |
| `npm run typecheck` | **33 errori**, esattamente la baseline di `CLAUDE.md` §17. Diff vuoto. Conteggio preso sull'output completo, non su una finestra `tail` |
| `npm run check:docs` | **2/3**. A e B verdi. **C rosso su due entry preesistenti** del 2026-08-23 (545 e 3314 caratteri), nessuna delle due mia, non corrette per istruzione del prompt. La entry di questa sessione e' a 481 caratteri e passa |

Nota sul prompt: annunciava «Check C è già rosso su una entry altrui», al singolare. Le entry
rosse sono **due**. Nessuna delle due e' stata toccata.

---

## 11. Hard stop

Fase 1b chiusa senza il test. Un commit con il solo report più la entry di log.
