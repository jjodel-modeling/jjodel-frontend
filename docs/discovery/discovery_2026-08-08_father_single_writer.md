# Discovery — voce 4, `father` writer unico (R-F1..R-F5)

**Documento prompt**: 2026-08-08 voce 4 fase 1 discovery father single writer
**Tipo**: Fase 1 read-only, two-phase. Nessun file sorgente toccato.
**Branch**: `alfonso-frontend-jjtl` — HEAD `7de92c6cd` al momento della lettura.
**Report precedente sullo stesso oggetto**: `docs/discovery/discovery_2026-08-07_father_single_writer.md` (776 righe, addendum N1-N11).

---

## 0. Rettifica d'ingresso — la voce 4 è già chiusa, Fase 1 e Fase 2

Il prompt descrive lo stato del repo **prima** del 2026-08-07 e chiede una discovery per
una Fase 2 che è **già atterrata**. Non è una sfumatura di ancoraggio: i due Select che il
prompt descrive come difetto vivo non esistono più, e il file che indica come secondo
writer è stato cancellato.

Evidenza, in ordine cronologico:

| Commit | Data | Cosa ha portato |
|--------|------|-----------------|
| `0eb281ce7` | 2026-08-07 | `set_father`, correzione del peso `indexOf("Copy")` truthy |
| `f5c71d5db` | 2026-08-08 | **cascata** del `viewpoint` sul sottoalbero dentro `set_father` + `viewSubtree.ts` (nuovo, 9 test) |
| `65f18ceb1` | 2026-08-08 | **writer unico** in Applies to: riga viewpoint read-only, Select parent filtrato, azione «Move to viewpoint…» (`components/viewParenting/`, 10 test) |
| `1dd464162` | 2026-08-08 | `git rm` del workbench irraggiungibile, **incluso `ViewProperties.tsx`** |
| `ca2b67c0a` | 2026-08-08 | visited set in `get_viewpoint` e `get_fatherChain` (voce 5, residuo N7) |

Le decisioni corrispondenti sono già a registro come **D-4-1..D-4-8** (`docs/decisions.md:80-110`,
ratificate il 2026-08-07), e il log le documenta all'entry «feat: `father` writer unico,
cascata sul sottoalbero, superficie Applies to (voce 4, Fase 2)» (`docs/claude-code-log.md:94`).

**Conseguenza sul mandato di questa fase.** Non ho rifatto la discovery: sarebbe stata la
terza passata sullo stesso codice. Ho invece verificato **sul codice a HEAD, non sul report
del 2026-08-07** (CLAUDE.md §5, sotto-regola «non fidarsi dei fixture a memoria fra
sessioni») che ciascun punto R-F1..R-F5 sia effettivamente soddisfatto, e ho misurato il
delta fra il testo delle ratifiche R-F e ciò che è atterrato. Le 7 domande sono risposte
sotto, ma con risposte «stato attuale», non «cosa servirebbe».

---

## 1. File letti

| Path | Cosa ci ho verificato |
|------|-----------------------|
| `frontend/src/view/viewElement/view.tsx` | `:1414-1431` `get_fatherChain`, `:1436-1453` `get_viewpoint`, `:1457-1460` `set_viewpoint` no-op, `:1461-1539` `set_father` con la cascata, `:988` `get_allSubViews`, `:1542-1550` `get_subViews` |
| `frontend/src/view/viewElement/viewSubtree.ts` | `:43-69` `collectViewSubtree`, BFS su `father`, visited set |
| `frontend/src/components/viewParenting/ViewParentingFields.tsx` | `:61-68` sottoscrizione e fatti, `:71-77` conferma del move, `:84-130` riga viewpoint read-only + azione, `:133-151` Select parent |
| `frontend/src/components/viewParenting/viewParentingOptions.ts` | `:46-83` `readViewParenting` |
| `frontend/src/components/editors/views/data/InfoData.tsx` | `:27` import, `:295-299` unico punto di montaggio del blocco |
| `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` | `:4` import, `:100-123` `IRIdentityFields`, montaggio del blocco condiviso |
| `frontend/src/components/forEndUser/Input.tsx` | `:107` select senza stato locale, `:151` risync che esclude select, `:191-211` `onChange`, `:253-254` write path, `:431-446` ramo `jjSelect`, `:450-453` ramo nativo con l'opzione vuota |
| `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` | `:77`+`:84` firma, `:99`+`:113` indice — entrambi filtrano `d.viewpoint !== vp` |
| `frontend/src/redux/selectors/selectors.ts` | `:421-422` peso da `subViews`, `:553-559` `viewPointMatch` da `dview.viewpoint` |
| `frontend/src/components/editors/views/NestedView.tsx` | `:109-127` `select()`, `:254` setter del boost |
| `frontend/src/redux/VersionFixer.tsx` | `:427` migrazione `2.2 -> 2.201`, `:1167` FASE C di `2.226 -> 2.227` |
| `frontend/src/components/editors/viewpoint/properties/` | contenuto reale a HEAD: solo `ViewpointProperties.tsx` + `properties.scss` |
| `docs/decisions.md`, `docs/claude-code-log.md`, `docs/discovery/discovery_2026-08-07_father_single_writer.md` | registro, entry di voce 4/5, report di Fase 1 precedente |

**Test eseguiti** (read-only, nessun edit):
`npx vitest run src/components/viewParenting/__tests__/viewParentingOptions.test.ts src/view/viewElement/__tests__/viewSubtree.test.ts`
→ **2 file, 19 test, tutti verdi**, 129 ms.

---

## 2. Mappa R-F1..R-F5 → registro → codice a HEAD

| Ratifica del prompt | A registro come | Stato a HEAD | Ancoraggio |
|---------------------|-----------------|--------------|------------|
| **R-F1** writer unico, viewpoint riga read-only, via la maschera `getter={() => vpid}` | D-4-1 + D-4-2 | ✅ **fatto** | `ViewParentingFields.tsx:84-94` riga derivata; nessun `getter` di maschera in repo |
| **R-F2** lista filtrata per costruzione, niente cicli, nessun setter custom | D-4-2 + D-4-6 + D-4-7 | ✅ **fatto** | `viewParentingOptions.ts:53-73`; il `Select` a `:138-145` **non** passa `setter` |
| **R-F3** move cross-viewpoint esplicito + cascata sul sottoalbero | D-4-3 + D-4-4 + D-4-8 | ✅ **fatto, cascata piena** | `ViewParentingFields.tsx:96-129` azione; `view.tsx:1486-1501` cascata |
| **R-F4** breadcrumb `viewpoint › parent › view` in testa ad Applies to | **U-2** (arco U), sbloccata da Q2 del 2026-08-08 | ❌ **non fatta** — unico residuo vero | zero occorrenze di breadcrumb in `irTabs.tsx`; `Info.tsx:1265-1310` è la breadcrumb dei model element, altro oggetto |
| **R-F5** perimetro: due file writer; `NestedView.tsx` non si tocca, si verifica soltanto | D-4-5 emendata | ✅ **verificato**, ma il perimetro è cambiato | `ViewProperties.tsx` **cancellato** in `1dd464162`; `NestedView.tsx` non scrive `father` |

### Tre punti in cui il testo R-F e il registro divergono

1. **R-F1/R-F5 nominano `ViewProperties.tsx`; il file non esiste più.** D-4-5 emendata
   (2026-08-07) lo aveva già escluso dal perimetro perché irraggiungibile (host
   `WorkbenchProperties` senza importatori); il 2026-08-08 il sottoalbero è stato rimosso
   in blocco (14 file, `1dd464162`). Il write path difettoso che il prompt cita
   (`ViewProperties.tsx:70-73,121-133`) è morto con lui, incluso il
   `e.target.value || undefined` che sollevava TypeError dentro `set_father`.
   **A HEAD i writer UI di `father` sono due call site di un solo componente, non due file.**

2. **R-F3 offre una v1 depotenziata («se la cascata risulta rischiosa, limitarla alle view
   senza figli»); D-4-8 ha scelto la cascata piena, ed è quella atterrata.** In più D-4-8 la
   fa girare **sempre**, anche nei reparent intra-viewpoint, perché il test «scrivi solo se
   diverso» la rende idempotente e sana lazy le divergenze legacy del ramo toccato. Il ripiego
   non serve più: si veda §4, domanda 3.

3. **Collisione di identificatore.** `docs/decisions.md:57` ha già un **R-F** (2026-08-05,
   pin d'identità della metaclasse escluso da `canonicalize`), che non c'entra nulla con
   `father`. Aggiungere una serie `R-F1..R-F5` renderebbe ambiguo ogni riferimento futuro a
   «R-F». Vedi §7.

---

## 3. Layer Impact pre-assessment

**Non dovuto, e lo dico con la verifica in mano invece che per esclusione.** §3.2 elenca
`useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`,
`useM1ReferenceEdges.ts`, `VersionFixer.tsx` e i write path D adiacenti al sync:
`view.tsx` non è in quell'elenco, e nessun percorso della cascata lo raggiunge.

- `useJjomSync.ts` non nomina `DViewElement`/`LViewElement`/`viewpoint`; le sole occorrenze
  di «father» sono tre commenti sulla reference di Families.ecore. Riverificato per grep in
  questa sessione, coerente con la regola di uscita 1 della discovery del 2026-08-07.
- La cascata atterrata vive dentro una **TRANSACTION di sole `SetFieldAction`**
  (`view.tsx:1495-1537`): nessun `.new()`/`.new2()`/`.new3()`, quindi il caso dichiarato
  **SAFE** da CLAUDE.md §3.3, non il caso pericoloso dell'annidamento di creator.
- Nessuna rilettura sincrona post-setter: l'insieme dei discendenti **e** il test «solo se
  diverso» sono decisi su uno `store.getState()` preso **prima** della TRANSACTION
  (`view.tsx:1489`), con il motivo scritto in commento a `:1478-1481`.
- Persistenza: nessun `jsxString` toccato, nessuna migrazione dovuta (§3.9 non si applica —
  `father`/`viewpoint` sono campi D, non sorgente di default view).

Questa fase, in ogni caso, non ha modificato nulla.

---

## 4. Le 7 domande, risposte sullo stato a HEAD

### 1) Censimento dei writer di `father`

I due Select del prompt **non esistono più**. A HEAD i writer UI di `DViewElement.father`
sono due, entrambi dentro lo stesso componente:

- `ViewParentingFields.tsx:138-145` — `<Select data={view} field={'father'} jjSelect …>`,
  **senza `setter`**: `Input.tsx:254` esegue `data[field] = serializeValue(newValue)`, cioè
  l'assegnazione sul proxy L, che entra in `set_father`.
- `ViewParentingFields.tsx:75` — `(view as any).father = moveTarget` nella conferma del move.
  Stessa identica rotta di scrittura, cascata inclusa: la root del viewpoint di destinazione
  **è** il viewpoint.

Un solo scrittore effettivo del campo, quindi, e una sola semantica.

Fuori dalla UI, gli altri writer di `father` su view sono: `view.tsx:1496` (dentro
`set_father` stesso) e due migrazioni — `VersionFixer.tsx:427` (`2.2 -> 2.201`, pone
`father = viewpoint` su tutti i `viewelements`) e `VersionFixer.tsx:1167` (FASE C di
`2.226 -> 2.227`, che in pratica non intercetta view). Tutte le altre occorrenze di
`.father =` in `src/` (`api/data.ts`, `LModelElement.tsx`, `Dummy.ts`,
`GraphDataElements.tsx`) sono sui **model element** M1/M2, non su `DViewElement`.

**Sulla domanda esplicita «stesso componente verbatim o copia?»**: R-H (2026-08-06) aveva
ricollocato i controlli **duplicandoli**; la voce 4 ha chiuso la duplicazione. Oggi c'è
**un solo componente** montato da due host —
`irTabs.tsx:123` (Applies to IR) e `InfoData.tsx:299` (tab legacy per le view senza `ir`).
Il fix di un difetto in quel blocco si propaga a entrambe le superfici senza lavoro doppio.
Motivazione della collocazione in `components/viewParenting/` invece che in
`components/ui/`: quest'ultima è presentazione pura con zero import dal barrel `joiner`, e
il blocco legge lo store (nota 4 dell'entry di log del 2026-08-08).

### 2) Semantica di `set_father`

`view.tsx:1461-1539`. Ordine effettivo delle scritture, tutte dentro una sola TRANSACTION:

1. `:1496` `father` della view che si muove;
2. `:1497` `viewpoint` della view che si muove, **solo se diverso** da `dfather.viewpoint`;
3. `:1501` `viewpoint` di ogni discendente da riallineare (la cascata);
4. `:1502-1509` rimozione dell'entry da `subViews` del vecchio padre (`-=`);
5. `:1510-1535` inserimento nell'`subViews` del nuovo padre (`+=`), peso `1.5`.

`father` dei discendenti **non** cambia: restano appesi alla view che si muove. Nessuna
entry di `subViews` sotto quel nodo viene toccata. È esattamente il minimo corretto: dei
tre indici di appartenenza (`d.viewpoint`, `subViews`, catena `father`) il move conserva per
costruzione il secondo e il terzo, e denormalizza solo il primo.

**Helper di traversata** e loro affidabilità:

| Helper | Layer | Direzione | Protetto dai cicli | Fonte |
|--------|-------|-----------|--------------------|-------|
| `collectViewSubtree` (`viewSubtree.ts:43`) | puro, su `DState` grezzo | discendente | ✅ visited set `:55-61` | scansione di `father` |
| `get_allSubViews` (`view.tsx:988`) | L-proxy | discendente | ✅ | `subViews` |
| `get_fatherChain` (`view.tsx:1414`) | L-proxy | ascendente | ✅ dal `ca2b67c0a` | `father` |
| `get_viewpoint` (`view.tsx:1436`) | L-proxy | ascendente | ✅ dal `ca2b67c0a` | `father` |

Per enumerare i discendenti l'unico affidabile è `collectViewSubtree`, e la ragione è
scritta nel suo header (`viewSubtree.ts:10-18`): `subViews` — l'opposite persistito — ha
**quattro writer**, uno dei quali, `LViewElement.updateDefaultView` (`view.tsx:1758`), è una
mutazione D grezza fuori da ogni azione che gira a **ogni caricamento progetto**; e la
migrazione `2.2 -> 2.201` scrive `father` senza ricostruire le voci reciproche. Scansionare
il backward link è immune a entrambe, ed è la disciplina che CLAUDE.md §3.6 prescrive per
questa esatta situazione.

Nota di layer, per il futuro: `viewSubtree.ts` è **puro** — nessun accesso allo store,
nessun import dal barrel `joiner` (che ha `view.tsx` nel proprio grafo). Chi lo chiama passa
lo stato già fotografato. Va tenuto così.

### 3) Fattibilità della cascata

Domanda superata dai fatti: la cascata è **atterrata ed è piena**. La scrittura scelta è la
prima delle tre che il prompt elencava — **`SetFieldAction` diretta sul campo denormalizzato**
(`view.tsx:1501`) — e le altre due sono entrambe sbagliate, per motivi diversi:

- **ri-set di `father` a se stesso**: `set_father` esce subito su `if (pvid === oldpvid) return true`
  (`:1467`). Inerte.
- **rotta proxy `child.viewpoint = x`**: `LViewElement.set_viewpoint` (`:1457-1460`) logga
  «call view.setFather(viewpoint) instead» e **ritorna `true` senza scrivere**. È il punto più
  facile da sbagliare dell'intera voce: fallisce in silenzio e riporta successo. Il commento
  a `:1498-1500` lo presidia.

Classificazione rispetto ai vincoli noti: nessuna TRANSACTION annidata (nessun creator nel
corpo, caso SAFE §3.3); nessuna rilettura sincrona post-setter (snapshot a `:1489`, **prima**
della TRANSACTION); nessun percorso sync-adjacent incapsulato. Conto delle azioni
`1 + 1 + 2 + N`, una sola `CompositeAction`, **un solo passo di undo**.

### 4) Albero Viewpoints — `NestedView.tsx`

**Non soffre del problema, perché non riparenta affatto.** Il `NestedView.tsx:111` citato dal
prompt è `project.activeViewpoint = ptr`, cioè l'**attivazione** di un viewpoint, non uno
spostamento di view: non scrive `father` e non tocca `viewpoint`. L'unica altra scrittura
dell'albero è `:254`, il boost di priorità, che scrive `pv.subViews` (il peso) e neppure lì
il `father`.

Nessun drag & drop su view esiste nel repo: zero `draggable`/`onDrop`/`onDragStart` in
`components/editors/views/`, riverificato per grep in questa sessione (le uniche occorrenze
sono `NodeData.tsx:79-80`, il flag `draggable` **del nodo sul canvas**, e
`CustomData.tsx:47`, l'editor JS dell'handler `onDragStart`). Coerente con N8 del report
precedente. **Nessuna voce da aprire.** R-F5 soddisfatta senza toccare il file.

### 5) Sorgente dati del Select filtrato

`readViewParenting(state, viewId)` (`viewParentingOptions.ts:46-83`), che legge **solo stato
persistito**:

- enumerazione: lista piatta `state.viewelements` filtrata su `dv.viewpoint === viewpointId`
  (`:61-64`) — **lo stesso campo che la riga read-only mostra**, per costruzione: riga e lista
  non possono contraddirsi;
- pointer della radice: è `viewpointId` stesso, anteposto come prima voce con label
  `(root of ‹nome›)` (`:71-72`). «Nessun parent» **è** la root: non esiste più un'opzione
  "None" che scriveva `''` (D-4-7);
- esclusione di sé e dei discendenti: `Set` costruito da `collectViewSubtree` + il proprio id
  (`:53-55`), consultato in testa al loop. Costo: **due passate lineari** sui `viewelements`
  del progetto (una per costruire `childrenByFather`, una per filtrare) più un sort sui soli
  co-locati. Nessun selettore memoizzato, ma la scala è quella delle view di un progetto.

**Trappola dell'opzione vuota antepositiva (voce 3): evitata, e per costruzione.** Il ramo
che antepone `<option value="" disabled selected>` è `Input.tsx:450-453`, cioè il `<select>`
**nativo**; il Select del parent passa `jjSelect={true}` (`ViewParentingFields.tsx:142`) e
prende quindi il ramo `:431-446`, dove il placeholder è una prop di `JjSelect` e nessuna
option vuota entra nella lista. In più `readViewParenting` non emette mai un `value` vuoto,
ed è uno dei 10 test di `viewParentingOptions.test.ts`.

### 6) Riga read-only del viewpoint e breadcrumb

**Riga read-only — fatta.** `ViewParentingFields.tsx:84-94`. Il viewpoint derivato vero si
legge da `facts.viewpointId/viewpointName`, cioè da `state.idlookup[viewId].viewpoint` — il
campo **persistito**, quello che il resolver IR legge (`irResolveCore.ts:84,113`) e su cui lo
scoring classico classifica (`selectors.ts:553-559`). **Non** da `get_viewpoint`, che risale
la catena `father` e su dati legacy divergenti contraddirebbe la riga. Lo stato attivo/non
attivo viene da `LProject.getProject()?.activeViewpoint?.id` confrontato con
`facts.viewpointId` (`:64-65`), reso come `<span>` con classe `is-active`.

Non esisteva un primitivo read-only riusabile: la riga è markup nuovo dentro il blocco, con
il suo `viewParenting.scss`.

**Breadcrumb — non fatta, ed è l'unico residuo vero di R-F4.** Zero occorrenze in
`irTabs.tsx`. La breadcrumb esistente (`Info.tsx:1265-1310`) è quella dei model element:
altro oggetto, altro host, non riusabile qui così com'è. A registro il lavoro **non** è in
voce 4 ma nell'arco U come **U-2**, con la sospensiva di R-H sciolta da Q2 (2026-08-08,
`decisions.md:183-187`) e con il vincolo già ratificato: legge `readViewParenting`, **mai**
`get_viewpoint`. La discovery di U-2 esiste già:
`docs/discovery/discovery_2026-08-08_uniformazione_card_properties.md:207` («D2 — Breadcrumb
`jj-context-bar`»).

### 7) Effetti collaterali all'apertura

**Nessuna scrittura spuria, e il motivo è strutturale, non fortuito.** Per `tag === 'select'`
`InputComponent` **non usa stato locale**: `Input.tsx:107` forza `value = oldValue`, e il
ramo di risincronizzazione che potrebbe scrivere è esplicitamente escluso per i select
(`:151`, `props.tag !== 'select'`). Non esiste quindi il draft-init che ha prodotto il difetto
della voce 3. Le sole scritture partono da `onChange` (`:191-211` → `confirmValue` → `:253-254`),
cioè da un'azione dell'utente.

Lato blocco: `ViewParentingFields` non ha alcun `useEffect`; i due `useState` (`:54-55`)
governano solo l'apertura del pannellino di move, e la conferma è dietro un click su un
bottone disabilitato finché `moveTarget` è vuoto (`:122`). Nessun dirty flag, nessun
autosave.

**Un rilievo minore, non un difetto**: `:61` sottoscrive lo store intero
(`useSelector((s: any) => s)`), quindi il blocco si ri-renderizza a ogni azione Redux. La
scelta è motivata in commento (due dei tre host non selezionano nulla, e dopo un move la riga
e la lista devono aggiornarsi), ed è corretta funzionalmente; resta un candidato a
restringimento se il pannello dovesse mostrare lentezza. Da non toccare senza misura.

---

## 5. Rischi

1. **Rischio principale: rifare la voce 4.** Una Fase 2 lanciata sul testo del prompto così
   com'è riscriverebbe da zero un blocco già a HEAD, con test verdi, e su un file
   (`ViewProperties.tsx`) che non esiste. È il rischio che questo report esiste per fermare.
2. **Lo smoke visivo della Fase 2 non è mai stato riportato.** L'entry di log del 2026-08-08
   dice testualmente «GO ricevuto sulla checklist, **esiti puntuali non riportati in chat**»,
   e segnala che il punto 4 — move di una view **con sub-view**, fixture a tre livelli — è
   quello che verifica ciò che nessun test copre: la cascata dentro `set_father`, che
   richiede Redux e il proxy e non è montabile in node. **Questo è il buco di verifica
   residuo della voce 4**, ed è la stessa forma dello smoke di voce 3 chiuso da `7de92c6cd`.
3. **Difetto registrato e non corretto, ancora in piedi**: `subViews` è chiavato per
   **pointer** (`view.tsx:224`), ma il blocco del peso in `set_father` confronta
   `copiedFromName` (un **nome**) con quelle chiavi (`:1516-1522`). Dopo il fix di `0eb281ce7`
   `insertBefore` resta `''` sempre e il ramo `preserveOrder` è irraggiungibile — era comunque
   già morto, perché il proxy invoca il setter con due soli argomenti. Codice scritto contro
   una mappa che non esiste. Fuori mandato allora, fuori mandato adesso: se si vuole chiudere,
   è una voce di igiene a sé.
4. **Nessun VersionFixer per i dati divergenti**, per scelta (D-4-8): le view legacy con
   `viewpoint` disallineato dalla catena `father` si sanano **lazy**, al primo reparent del
   ramo. Un progetto mai riparentato resta divergente. Accettato con la ratifica; lo ricordo
   perché non emerga come sorpresa.
5. **Ambiguità di identificatore su «R-F»** se le righe del prompt entrano a registro con
   quel prefisso (vedi §7).

---

## 6. Raccomandazione secca su R-F3

> **Cascata in v1: SÌ — ed è già in v1.** Non c'è una scelta da prendere: la cascata piena è
> atterrata in `f5c71d5db`, gira su **ogni** reparent (non solo cross-viewpoint), ed è
> idempotente per il test «scrivi solo se diverso».

Motivo per cui il ripiego «v1 limitata alle view senza figli» non va riaperto: il rischio che
lo giustificava non si è materializzato in nessuno dei tre punti che lo avrebbero prodotto —
la TRANSACTION resta di sole `SetFieldAction` (caso SAFE §3.3, classificazione **invariata**
rispetto a prima della cascata), non c'è alcuna rilettura di stato scritto dal corpo della
TRANSACTION (snapshot a `:1489`), e nessun file di zona critica è coinvolto. In compenso la
cascata piena è ciò che rende il move **corretto per i discendenti**: senza, un sotto-albero
resterebbe indicizzato sotto il viewpoint di partenza (`irResolveCore.ts:113`) e smetterebbe
di renderizzare mentre l'albero lo mostra sotto quello di arrivo.

L'unica cosa che manca alla cascata **non** è codice: è il punto 4 dello smoke (rischio 2).

---

## 7. Righe proposte per `docs/decisions.md`

**Raccomandazione: non aggiungere R-F1..R-F5 verbatim.** Otto decisioni sullo stesso oggetto
sono già a registro (D-4-1..D-4-8), sono quelle **implementate**, e sono più specifiche; in
due punti il testo R-F le contraddirebbe (perimetro con `ViewProperties.tsx`, ripiego sulla
cascata), lasciando il registro a dire due cose diverse su codice che ne fa una sola. In più
`R-F` è già preso (`decisions.md:57`, pin d'identità della metaclasse).

Proposta: **una sola riga di riconciliazione**, in coda alla sezione «Voce 4», da committare
in Fase 2 e non ora.

```markdown
- **D-4-9, riconciliazione R-F** (2026-08-08) — Le ratifiche R-F1..R-F5 del 2026-08-08 sono
  la stessa decisione di D-4-1..D-4-8 (2026-08-07), già implementata in `f5c71d5db` +
  `65f18ceb1`: valgono le D-4-x, che sono più specifiche e corrispondono al codice. Tre
  delta registrati. (1) Perimetro: `ViewProperties.tsx`, secondo writer nel testo R-F, è
  stato cancellato con l'intero workbench irraggiungibile (`1dd464162`); i writer UI di
  `father` sono oggi due call site di **un** componente condiviso,
  `components/viewParenting/ViewParentingFields.tsx`, montato da `irTabs.tsx:123` e
  `InfoData.tsx:299`. (2) Cascata: il ripiego previsto da R-F3 («v1 limitata alle view senza
  figli») **non si applica** — la cascata piena è atterrata e gira su ogni reparent (D-4-8).
  (3) Breadcrumb: R-F4 non è voce 4, è **U-2** dell'arco U, sbloccata da Q2 e non ancora
  implementata. La sigla `R-F` resta quella del 2026-08-05 (canonicalize): non riusarla.
```

Se invece Alfonso vuole le R-F a registro **verbatim** per tracciabilità del prompt, vanno
rinumerate (es. `R-F4-1..R-F4-5`) e marcate come «assorbite da D-4-x»: lo faccio in Fase 2 su
sua indicazione, non lo decido io.

---

## 8. Domande aperte per Alfonso

1. **Il punto 4 dello smoke della Fase 2 è stato eseguito dopo il GO del 2026-08-08?**
   (Move di una view con sub-view verso un altro viewpoint, fixture a tre livelli costruita
   dalla UI: i discendenti seguono e continuano a renderizzare?) È l'unica verifica che
   nessun test copre. Se non è stato eseguito, è la prima cosa da fare — e non richiede una
   Fase 2, richiede una sessione di smoke con esito a log, esattamente come `7de92c6cd` per
   la voce 3.
2. **Il prompt di oggi era una re-emissione involontaria, o volevi che verificassi la voce 4
   a distanza?** Cambia cosa committo: nel primo caso questo report è la chiusura, nel secondo
   posso allargare la verifica ai dati legacy divergenti (che però da qui non sono misurabili:
   nessun progetto reale è raggiungibile da Claude Code, C1 del report precedente).
3. **Confermi la riga D-4-9 di §7, o preferisci le R-F verbatim rinumerate?**
4. **U-2 (breadcrumb) parte come slice dell'arco U**, con l'host e i token della card
   uniformata, o la vuoi anticipata come coda della voce 4? A registro sta in arco U, e
   `discovery_2026-08-08_uniformazione_card_properties.md:207` ha già la sua discovery (D2).
5. **Il difetto `subViews` chiavato per pointer vs confronto per nome** (rischio 3) resta
   registrato e non corretto, o apro una voce di igiene? È codice morto oggi, ma è una trappola
   per chiunque tocchi il blocco del peso in futuro.

---

## 9. Regola di uscita

Fase 1 chiusa con questo report. **Nessun file sorgente toccato.** La Fase 2 della voce 4
**non va lanciata**: è già atterrata. Il lavoro residuo reale è, in ordine: lo smoke del
punto 4, poi U-2 nell'arco U.
