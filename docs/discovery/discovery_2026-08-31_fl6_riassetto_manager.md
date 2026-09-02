# Referto — FL6, il riassetto del manager

**Data**: 2026-08-31 · **Prompt**: `docs/prompts/PROMPT_FL6_manager_layout.md`
**Corsia**: completa (5 file sorgente toccati, 1 nuovo di test — RC-3)
**Esito**: ✅ completato, con una clausola del prompt **non implementabile come
scritta** e chiusa per constatazione (§2), e una riga attesa **misurata diversa**
per una ragione aritmetica che non e' di questa slice (§6).

---

## 1. Che cosa il prompt presupponeva, e che cosa c'era

| # | Ipotesi del prompt | Esito |
|---|--------------------|-------|
| H1 | Esiste un draft di edit, con Save e Discard «di FL4». | **Falsificata**. §2. |
| H2 | `Manager Admin Form Bottom.dc.html` e' nel repo. | **Falsificata**, per la terza volta in questo handoff. §3. |
| H3 | Il vicinato richiede un walk nuovo per il nastro. | **Falsificata**: `neighborhoodDraw` ha gia' le tre sorgenti. §4. |
| H4 | La riga 1 della form e' `[name, kind, isHistory]`. | **Vera a condizione**, e la condizione e' misurata. §6. |

I quattro punti aperti del referto FL5 sono **chiusi tutti**: l'innesto (§4),
il fallback testuale (§5), il barrel (§4.1). Il terzo — i sei centesimi di alfa
dell'anello — resta una decisione di design e non e' toccato.

## 2. Save e Discard non hanno un motore, e non sono stati resi

**La form di edit scrive DIRITTO nello store.** `formWrite.ts` esegue un commit
per ogni cambiamento reale e alza `U.isProjectModified`; non esiste un buffer,
non esiste un `save()`, non esiste un annullamento. Misurato:

- `SaveManager` (`components/topbar/SaveManager.ts`) **non ha** un metodo `save()`
  — il commento di `IRForm.tsx:257` che ne parla descrive una cosa che non c'e';
- l'unico salvataggio del progetto e' `SaveAndCloseProject`, in `Navbar.tsx:508`;
- `U.isProjectModified` e' un **campo statico**, non sottoscrivibile: lo si legge
  al render (`isProjectModified()` da `common/libraries/projectModified.ts`).

Quindi «Save/Delete restano quelli di FL4/12d» non e' applicabile per Save: FL4
non ne ha lasciato uno. Le tre strade sono state poste in chat e la risposta e'
stata la prima: **header con nome, metaclasse, badge e Delete; Save e Discard non
resi, punto aperto dichiarato.** Due bottoni inerti sarebbero una bugia, e un
buffer di edit sarebbe un motore nuovo sul write path — un'altra slice, e una che
tocca semantica gia' verificata (Regola 3).

Il badge dice cio' che il flag dice davvero — «il progetto ha modifiche non
salvate» — e non «questa istanza». La ragione e' nel sorgente, accanto al markup.

**Punto aperto 1** — il draft di edit, se lo si vuole. Sarebbe: snapshot degli
slot alla selezione, Discard che li riscrive con `setSlotValue`/`clearSlotValue`,
Save che azzera la baseline. Non e' difficile; e' semplicemente un'altra cosa.

## 3. Il board dichiarato autoritativo continua a non esistere (RC-10)

`Manager Admin Form Bottom.dc.html` non e' nel repo. Misurato:
`find . -name "*.dc.html" -not -path "*/node_modules/*"` restituisce nove file;
positivo di controllo, `Jjodel Form Views.dc.html` e
`13a Diagramma Embedded.dc.html` ci sono entrambi. E' lo stesso reperto di FL1,
FL2 e FL5: la famiglia dei board di questo handoff e' citata e non depositata.
Non blocca — il prompt si dichiara normativo — e le regole normative sono state
seguite alla lettera tranne dove la §2 lo rende impossibile.

## 4. L'innesto, e perche' non e' costato un walk

`egoInputOf(idlookup, subjectId, shape)` sta in `neighborhoodDraw.ts`, accanto a
`neighborhoodOf`, e **non cammina niente di nuovo**: `makeDrawReadCtx` per il
nome, `createDraw.filledSlotValues` per gli uscenti, `shapeDraw.referencedBy` per
gli entranti. Le tre sorgenti che 13a compone gia'.

Non riusa `neighborhoodOf` perche' `Neighborhood` ha **gia' fuso** i due lati in
nodi con un ruolo e applicato la sua precedenza e il suo dedup; `EgoInput` vuole
il dato PRIMA di quelle scelte — uscenti uno per POSIZIONE, entranti verbatim col
contenimento marcato. Ricavarli da `Neighborhood` vorrebbe dire disfare due volte
lo stesso nodo. L'owner non c'e', ed e' la differenza fra i due disegni.

### 4.1 Il barrel, chiuso

`jjform/index.ts` esporta ora `egoNeighborhood` (8 tipi, 5 tipi di layout,
14 valori). FL4 e' mergiato, la contesa che aveva bloccato FL5 non esiste piu'.
`EgoDiagram.tsx` **non e' stato toccato**: il suo import per path continua a
compilare, e il file e' fuori perimetro per il prompt. E' l'unica riga del punto
aperto 4 di FL5 che resta.

### 4.2 L'aside e' andato via per intero

Rimossi da `InstanceManagerTab.tsx`: `NeighborhoodPanel` (130 righe),
`neighborEdgePath`, il mount, e i sette import diventati morti
(`neighborhoodOf`, `neighborhoodLayout`, `neighborhoodNote`, `neighborLabel`,
`NeighborhoodLayout`, `PlacedNode`, `PlacedEdge`). Da
`instanceManagerTab.scss`: le undici regole `&__graph*` e `&__pane--graph`.
I moduli di 13a in `jjform/` e in `neighborhoodDraw.ts` **restano**: sono di
un'altra superficie e questa slice non ne dispone.

## 5. Il fallback stretto, e la soglia che non e' un numero

La clausola «textual list where space is narrow» della specifica ratificata era
il punto aperto 2 di FL5. E' `EgoList`, in `InstanceManagerTab.tsx`: tre gruppi
impilati — incoming / this object / outgoing — che leggono lo **stesso** `Ego` e
instradano il click dagli **stessi** due puri, `egoDispatch` e `egoShowAll`.
Cambia la geometria, non il motore.

**La soglia e' `egoLayout(ego).width`**, cioe' quanto il nastro misura, contro
quanto il contenitore gli lascia. Non il viewport, e per una ragione misurabile:
una finestra larga con l'outline aperto e dodici colonne lascia alla riga meno
spazio di una finestra stretta con la tabella sola. La misura e' UN
`ResizeObserver` sul contenitore di scorrimento della tabella, nel tab e non
nella riga (la riga espansa e' una sola per costruzione).

La scatola porta una larghezza in **pixel**, ed e' l'unica cosa non ovvia della
slice: in `table-layout: auto` la larghezza minima del contenuto di una cella
spinge la tabella, e un nastro da 900px dentro un `<td colSpan>` allargherebbe
ogni altra riga — cioe' introdurrebbe esattamente lo scorrimento orizzontale che
la riga espandibile esiste per evitare. `position: sticky; left: 0` la tiene in
vista se la tabella scorre per le sue colonne.

## 6. La riga della board esiste, e la sua condizione e' misurata

Il prompt attende `riga 1 = [name, kind, isHistory]`. **Misurato sul fixture
StateMachine: `[name, kind]`.** Non e' un difetto di FL6, ed e' aritmetica del
registro di FL1 (`layout.ts`, `WIDTH_MAP`):

| campo | tipo | span |
|---|---|---|
| `name` | EString | 6 |
| `kind` | EString | 6 |
| `isHistory` | EBoolean | 3 |

`6 + 6 = 12` riempie la riga esatta, e `isHistory` scende. La riga della board
esiste quando `kind` e' **corta**: `6 + 3 + 3 = 12`. Non e' stato dichiarato, e'
stato **dimostrato**: ritipizzando `kind` a `EINT` (span 3) a runtime con una
`SetFieldAction` pura, la stessa form rende `[name, kind, isHistory]`
(sonda E2, verde). `layout.ts` e' fuori perimetro e non e' toccato.

Il board disegna quasi certamente `kind` come enumerazione a poche voci
(`ENUM_SEGMENTED_MAX = 3`, span 3). Il fixture usa una EString, ed e' il fixture
a divergere dal board, non il packer.

## 7. Le misure

| Gate | Valore | Note |
|---|---|---|
| `npm run typecheck` | **33** | baseline invariata; conteggio su output COMPLETO |
| `npm run build` | exit **0** | solo il warning chunk-size preesistente |
| `npm run test` | **2488 passati / 0 falliti** | 9 file rossi = i noti `window is not defined` |
| unita' proprie | **54 / 54** | 32 su `neighborhoodDraw` (di cui 11 nuove), 22 su FL6 |
| `npx sass instanceManagerTab.scss` | exit 0 | il foglio compila da solo |
| `npm run smoke` | **GREEN 12 / 0 / 3** | corsa quiescente, un boot per stato |
| sonda `_tmp_fl6_verify.ts` | **24 PASS / 0 FAIL / 0 errori** | l'app vera, fixture Heater |

### 7.1 Le unita', messe alla prova

Sette mutazioni, sette rossi, e il verde ritorna al ripristino:

| Mutazione | Rossi |
|---|---|
| il contenimento non e' filtrato dagli uscenti | 4 |
| gli uscenti sono deduplicati nell'adapter invece che nel modulo | 1 |
| il puntatore morto viene saltato | 2 |
| gli entranti sono filtrati dal contenimento gia' nell'adapter | 1 |
| la soglia del fallback diventa `window.innerWidth` | 1 |
| la form torna a essere la quarta colonna | 2 |
| il chevron diventa un secondo bersaglio di click | 1 |

### 7.2 Che cosa lo smoke NON prova

Nulla di questa slice: nessuno dei tre stati di `states.ts` monta il manager.
Lo smoke dice che **nulla e' regredito**, non che il riassetto sia giusto. Cio'
che lo dice e' la sonda del §7.3. Misura di contorno che invece riguarda
l'innesto: il CSS emesso da `npm run build` conteneva **0** occorrenze di
`ego-diagram` (referto FL5 §8.2, perche' nulla importava il componente) e ora ne
contiene **31**, piu' 26 di `instance-manager__ego`. `pane--graph`: **0**.

### 7.3 La sonda, e i cinque difetti che erano suoi

`scripts/smoke/_tmp_fl6_verify.ts`, non committata (convenzione
`README-probes.md`). Fixture: la macchina Heater di `_tmp_dense.ts`, con `kind` e
`isHistory` su `State` e una `next : State` **non di contenimento** — senza
quest'ultima ogni vicino di uno State e' una Transition o lo Heater che lo
contiene, e «il click su un vicino espande la sua riga» non sarebbe misurabile.

Le prime corse hanno dato 7 rossi. **Cinque erano della sonda**, e sono scritti
qui perche' sono lezioni sul codebase, non sul prodotto:

1. **`hasText` sul `<tr>` cerca in ogni cella.** Con `Idle.next = Running` la
   riga di Idle contiene la parola «Running», e `.first()` sceglieva quella.
2. **Le istanze nate nello stesso tick del metamodello nascono monche.**
   `DObject.new` costruisce gli slot dalle feature che la classe ha in
   quell'istante, e le collezioni in avanti si posano un tick dopo (CLAUDE.md
   §3.6). Misurato: il `DClass` portava `[name, kind, isHistory]` e la form ne
   rendeva **uno**. Le create sono state spostate in un `evaluate` successivo.
3. **`lModel.objects` e' stantio subito dopo una create.** Diciotto link su
   diciotto rispondevano «oggetti non trovati». Risolti per scansione
   dell'`idlookup`, che e' la regola di §3.6 applicata alla lettera.
4. **`addValue(undefined, refId, [target], false)` crea un SECONDO `DValue`**
   per la stessa feature. Misurato: `outgoing` e `next` comparivano due volte fra
   le `features` di `Idle`, uno vuoto e uno pieno, e ogni lettore che risolve una
   feature per nome trovava il primo. Sostituito con una `SetFieldAction` pura
   sullo slot che esiste.
5. **`State` non ha un New, ed e' giusto**: e' contenuta da `StateMachine`, e la
   route 1 del catalogo e' della metaclasse radice (Turno 10).

**Due erano del prodotto**, ed erano CSS, trovati solo perche' la sonda misura il
`scrollWidth` della scatola e non il suo aspetto: la testata della lista e la
chiave di feature sbordavano di 38px e poi di 48px in resa stretta, e —
`overflow: hidden` — venivano **tagliate** invece che mostrate. Chiusi con
`flex-wrap` sulla testata e l'ellissi sulla chiave; residuo misurato **0**.

## 8. Quello che la sonda NON prova

**I quattro preset del tab Style.** Il fixture non ha una vista IR con un
`formSpec`, quindi `spec` e' `undefined` e `theme` cade su `defaultTheme`
(`IRForm.tsx:309`): con un solo tema raggiungibile, quattro schermate sarebbero
quattro copie della stessa. Il selettore del preset e' superficie di FL4 e questa
slice non lo tocca — la form e' **spostata, non modificata**. Confronto rimandato
a chi apra un viewpoint con una form dichiarata.

**Punto aperto 2** — la verifica visiva dei quattro preset nella nuova
collocazione.
