# Discovery — 10b: l'outline di containment nel manager

Fase 1 (P4). Read-only. Chiude con l'hard stop e la lista Regola 19.

## Ipotesi che questa discovery sta falsificando

1. «L'outline è una superficie nuova che ha bisogno di un motore nuovo.»
2. «Montare la form su un nodo dell'outline richiede di cambiare come la form è montata.»
3. «Il design `Q8 Catalogo vs Outline.dc.html` è nel repo e si può misurare.»

Esito: (1) falsa in parte — il motore c'è, servono due funzioni pure nuove e un
builder d'albero; (2) falsa — basta cambiare **una espressione** (`subjectId`);
(3) **vera come assenza**: il file non c'è né in repo né fra gli artifact.

## Obiettivo

Stabilire dove va l'outline, quale codice esiste già, e quale è il delta minimo.

## File letti (path completi)

- `docs/PROTOCOL.md`, `docs/CLAUDE.md` (root), `docs/claude-code-log.md` (testa)
- `docs/decisions.md` righe 2172-2199 (Q8 e la sua sciolta)
- `docs/prompts/PROMPT_2c_create.md`, `docs/prompts/PROMPT_12d_delete.md`
- `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` (1472 righe, intero)
- `frontend/src/components/abstract/tabs/instanceManagerModel.ts` (143, intero)
- `frontend/src/components/abstract/tabs/instanceManagerTab.scss` (righe 1-90)
- `frontend/src/jjform/index.ts`, `shape.ts`, `nav.ts`, `create.ts` (righe 1-215)
- `frontend/src/components/editor-v2/hooks/multiDraw.ts` (intero)
- `frontend/src/components/editor-v2/hooks/createDraw.ts` (righe 95-180)
- `frontend/src/components/editor-v2/hooks/createAdapter.ts` (righe 85-145)
- `frontend/src/components/editor-v2/hooks/deleteAdapter.ts` (righe 100-130)
- `frontend/src/components/editor-v2/hooks/__tests__/multiDraw.test.ts` (righe 1-105)

## Findings

### 1. Il grafo di containment è già camminabile, e da funzioni pure

- `multiDraw.ts:childrenIn(idlookup, id, key)` — i figli di UNO slot, buchi esclusi e
  puntatori morti scartati. È esattamente il passo di ricorsione dell'albero.
- `multiDraw.ts:pathTo(idlookup, id)` — la strada dal modello giù, con `childKey` su
  ogni segmento. Già usata dal breadcrumb di 12c.
- `createDraw.ts:145 ownerOf(idlookup, objectId)` — «null» significa *il modello lo
  possiede direttamente*: è il predicato delle radici dell'outline.
- `createDraw.ts:87 modelOfObject` e `instanceManagerModel.ts:modelIdOfObject` —
  appartenenza al modello per risalita di `father` (backward-link, §3.6).
- `createDraw.ts:107 childCount` — il conteggio filled-only che `addChildReason` vuole.

Nessuna di queste importa il barrel del joiner (R-FORM-5): un `outlineDraw.ts` che le
compone resta testabile sotto vitest.

### 2. Il menu del «+» è già deciso dal motore, in due funzioni che esistono

- `jjform/create.ts:168 addChildReason(child, count)` → stringa o null. Null = la voce
  c'è; stringa = **voce assente + riga di motivo**, che è letteralmente l'idioma
  chiesto dal prompt. La barra «Add contained» di 2c
  (`InstanceManagerTab.tsx`, blocco `childSlots`) la consuma già così.
- `jjform/create.ts:146 newInstanceReason(cls, instanceCount)` → stessa forma per le
  rootable, singleton compreso.

Quindi il menu del «+» non è una regola nuova: è la stessa regola letta per nodo
invece che per soggetto della form. Ciò che manca è il **modello del menu** (l'elenco
delle voci ammesse più le righe di motivo), che oggi è cablato nel JSX di `childSlots`.

### 3. La create è già un evento solo, e l'outline lo emette invariato

`openCreate(clsName, ownerId, childKey)` (`InstanceManagerTab.tsx`) è chiamata dal
catalogo con `(cls, null, null)` e dallo slot figlio con `(cls, ownerId, childKey)`.
Il docstring di `jjform/create.ts` dichiara che *nulla a valle si ramifica sulla
provenienza*, «il Q8 honoured in code, since where the rootable create is offered from
is re-decided in 10b». **L'outline chiama la stessa funzione. Zero rami nuovi.**

Stessa cosa per la delete: `openDelete(instanceId)` costruisce il preflight di 12d e
apre `DeleteDialog`. L'outline la chiama; non reimplementa niente (vincolo del prompt).

### 4. Il punto che va toccato davvero: `subjectId` è risolto contro le righe

```
const subjectId = selectedObjectId && rows.some(r => r.id === selectedObjectId)
    ? selectedObjectId
    : null;
```

`rows` sono le istanze **della metaclasse selezionata**. Un nodo dell'outline di
un'altra metaclasse è quindi oggi invisibile alla form: `subjectId` cadrebbe a null e
il pannello destro mostrerebbe l'EmptyState.

Il prompt chiede espressamente che la selezione nell'outline **non** cambi la tabella
(«evidenzia la riga *se* la tabella mostra quella metaclasse»). Quindi il verso è
allargare la risoluzione, non forzare il cambio di collezione:

> `selectedObjectId` è un soggetto valido se è una riga viva **oppure** un `DObject`
> vivo di questo modello.

Delta: una espressione. Tutto il resto sta in piedi da sé —
- l'evidenziazione della riga è già `row.id === subjectId` (sincronia outline→tabella **gratis**);
- `subjectShape` passa da `shapeCtx.classOf(subjectId)`, non dalla classe selezionata;
- `inlineChildren`/`childSlots`/`drillTo` passano da `formSubjectId` e da `pathTo`;
- il multi-select non si accende: l'outline azzera `alsoSelected`, quindi `selectedIds`
  ha un elemento e `isMulti` resta falso.

**Rischio dichiarato**: `confirmMultiDelete` e `toggleSelected` continuano a ragionare
su `rows`. Restano corretti perché l'outline non alimenta `alsoSelected`; se una slice
futura lo facesse, quel confine va rifatto.

### 5. Lo stato dello store è unico: la sincronia non va costruita, va non-rotta

Tutto il tab pende da **una** `useSelector(state => state.idlookup)`. Tabella, form,
conteggi e (nuovo) outline sono `useMemo` sulla stessa sorgente. «Verifica, non doppiare
lo stato» del prompt è quindi soddisfatto per costruzione: l'unico modo di violarlo
sarebbe tenere una copia dell'albero in stato locale. Non lo farò: lo stato locale
dell'outline sarà **solo** l'espansione (chiavi id → boolean) e il menu aperto.

### 6. Il fixture ha esattamente i 4 livelli chiesti dal test

`components/editor-v2/hooks/__tests__/multiDraw.test.ts:29` — `m` (DModel) → `s1`
(Sensor, radice) → `p2` (Port, via slot `ports`) → `f1` (Filter, via `filters`).
Con la radice = il modello sono 4 livelli, ed è la catena che il test di 10b deve
rendere visibile. Il fixture porta anche i due casi sporchi che servono: un buco in
`s3.tint` e un puntatore morto (`'ghost'`) in `p2.filters`.

### 7. Layout: il design non è misurabile

`Q8 Catalogo vs Outline.dc.html` **non esiste nel repo** (nessun match per `Q8` fra i
file, `docs/design/` contiene solo `design_handoff_instance_node/` e
`design_handoff_jjodel_form_views/`) **né fra gli artifact pubblicati** (due, entrambi
non pertinenti). La ricerca è stata verificata con controllo positivo: la stessa
ricerca trova `Q8` in `docs/decisions.md` righe 2172 e 2194.

Misure disponibili, da `instanceManagerTab.scss:47-53`:

```
&__pane--classes { flex: 0 0 200px; }
&__pane--table   { flex: 1 1 auto; overflow: hidden; }
&__pane--detail  { flex: 0 0 400px; padding: 0; }
```

**Domanda aperta 1** (sotto) — senza il design non decido io fra «accanto» e «al suo
posto». La ratifica R-Q8-1 dice «NON sostituzione, divisione di ruoli», e la tabella
per metaclasse resta con il suo `New`: la lettura coerente è **accanto**, quarta
colonna a sinistra. Procederei con quella, dichiarata come assunzione.

### 8. Critical zone: nessun contatto

Nessuno dei file previsti è in §3.1. `viewpoint/ir/` non viene toccato (la form si
monta già, `IRForm objectId={...}`, e resta com'è). `problems/` **non viene toccato**
(vincolo di coordinamento con S1-M2). Layer Impact Report: **not-required**.

## Delta proposto — 8 file (Regola 19: elenco e pausa)

| # | File | Stato | Cosa cambia |
|---|---|---|---|
| 1 | `frontend/src/jjform/outline.ts` | **nuovo** | Tipi `OutlineNode`/`OutlineMenu`; `childMenu()` e `rootMenu()` (voci ammesse + righe di motivo, sopra `addChildReason`/`newInstanceReason`); `outlineOpenByDefault(depth)` con `OUTLINE_DEFAULT_OPEN_DEPTH = 2`; `outlineLabel()`. Zero import oltre i tipi fratelli. |
| 2 | `frontend/src/jjform/index.ts` | modifica | Solo i nuovi export, in coda. |
| 3 | `frontend/src/jjform/__tests__/outline.test.ts` | **nuovo** | Menu: slot pieno → voce assente + motivo; radice → sole rootable; singleton già esistente → assente + motivo. Default di apertura. |
| 4 | `frontend/src/components/editor-v2/hooks/outlineDraw.ts` | **nuovo** | `outlineRoots(idlookup, modelId)` e `outlineTree(idlookup, modelId, shape)`. Ordine: slot nell'ordine della shape, poi ordine dell'array; radici nell'ordine di scoperta. Cintura antianello come `pathTo`. Importa solo moduli senza barrel. |
| 5 | `frontend/src/components/editor-v2/hooks/__tests__/outlineDraw.test.ts` | **nuovo** | I 4 livelli del fixture; il puntatore morto scartato; l'ordine non alfabetico. |
| 6 | `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` | modifica | Il pannello `OutlinePanel` come componente locale (stesso idioma di `DraftDialog`/`MultiForm`); tre stati locali (espansione, menu aperto); `subjectId` allargato (finding 4); il pannello montato come prima colonna. |
| 7 | `frontend/src/components/abstract/tabs/instanceManagerTab.scss` | modifica | `&__pane--outline` più i blocchi dell'albero, del «+» e del menu, nei token già in uso dal file. Nessuna variabile nuova (Regola 28). |
| 8 | `docs/claude-code-log.md` | modifica | L'entry, in commit separato (patologia da race del 30-08). |

Più questo report, che si committa nella task che lo ha prodotto (P4/Regola 16).

## Fuori scope, dichiarato

Drag-per-spostare (R-2C-3), multi-selezione dall'outline, ricerca nell'albero,
`problems/` e il badge M2.

## Domande aperte

1. **Layout** — «accanto» (quarta colonna, ~260px a sinistra delle metaclassi) oppure
   «al suo posto» (l'outline sostituisce la colonna metaclassi, che perde la sua sede)?
   Il design che deciderebbe non è nel repo. Procedo con **accanto** salvo diverso
   ordine: è l'unica lettura compatibile con «la tabella per metaclasse resta» e con il
   suo `New` per le rootable.
2. **Ordine delle radici** — la shape non dà un ordine per le istanze possedute dal
   modello. Uso l'ordine di scoperta in `idlookup` (stabile, di inserimento) e NON
   quello alfabetico, coerente con «è un modello, non una rubrica». `DModel.objects`
   è scartato di proposito: è la collezione forward, stale dopo il parse (§3.6).
3. **Righe di motivo sulla radice** — elencare il motivo di OGNI metaclasse non
   rootable farebbe un muro. Le riporto per le sole `root && !abstract` bloccate
   (singleton già istanziato); le non-rootable sono semplicemente fuori da quel menu,
   e il loro motivo lo dà già il catalogo.

---

## Poscritto — cosa la Fase 2 ha misurato che la Fase 1 non poteva

Scritto a valle dell'implementazione, senza toccare nulla di quanto sopra: il
referto resta il documento di Fase 1, e questo e' la sua chiusa.

1. **Domanda aperta 1, sciolta dal disegno.** `Q8 Catalogo vs Outline.dc.html` e'
   arrivato nel repo dopo la Fase 1 (`docs/design/design_handoff_instance_node/`).
   L'opzione **1b** e' la referenza: pannello **300px** (non 260), «+» sui nodi,
   metaclasse in mono a destra, indent **14 + 16 per livello**, selezione
   `--color-selection-bg`. La nota del mock — «outline per il dove, tabella per il
   quanto» — e' il layout contract: **accanto**, come il finding 7 proponeva.
2. **Domanda aperta 3, misurata invece che decisa.** In jjodel un singleton non e'
   **mai** `root` (`shapeDraw`: «concrete, not singleton, not the target of any
   containment reference»), quindi il ramo singleton di `newInstanceReason` e'
   **irraggiungibile dal menu del modello** — e nemmeno il catalogo offre il `New`
   di un singleton. L'outline non inventa un'offerta che il resto dell'app non fa:
   Red/Green/Blue sono assenti da **entrambe** le meta' del menu. Dichiarato nel
   test unitario e nella sonda.
3. **`childrenIn` non bastava, ed e' il punto.** Il finding 1 lo dava come «il
   passo di ricorsione dell'albero». Lo e' per la forma, non per il contenuto:
   `childrenIn` **scarta** un puntatore morto (per non montare una sotto-form su un
   fantasma), e l'outline deve invece **renderlo**. `outlineDraw` legge lo slot
   grezzo e ne fa un nodo `broken` col token della tabella. Misurato a schermo.
4. **Un'aggiunta al disegno, dichiarata.** Il mock e' una figura statica e non
   mostra il **chevron**: il click sulla riga seleziona, il chevron apre. Senza,
   l'unica alternativa era un click che fa entrambe le cose — e non si potrebbe
   guardare la form di un nodo senza sfogliargli sotto i figli.
5. **Fuori dal diff, dichiarato.** Il finding 3 osservava che l'outline **puo'**
   chiamare `openDelete` senza reimplementare niente. Non lo fa: il mock 1b non
   porta un gesto di delete nell'albero, e la delete resta dove 12d l'ha messa
   (riga della tabella e dialogo). E' una superficie in piu' da aggiungere, non un
   pezzo mancante di questa.

---

## Addendum — 2026-08-31, la ri-lettura post-FL6 (R-E/E-1)

Un secondo prompt 10b e' arrivato il 31-08 («PARALLELO a FL7»), chiedendo di
decidere l'innesto misurando la struttura del manager **dopo** FL6. Il referto
esisteva gia' al path: per R-E/E-1 non lo si riscrive. Questo addendum riporta
le sole cose che la prima Fase 1 non poteva coprire, e nulla sopra e' toccato.

### A1. La slice e' gia' a terra, e sopravvive a FL6

`git log -- frontend/src/jjform/outline.ts` da' **un solo commit**, `8c0caef49`
«feat(manager): l'outline di containment, accanto al catalogo (10b)», con la sua
entry di log al 2026-08-30 (`docs/claude-code-log.md:400`). Misurato sul working
tree di oggi, dopo FL5/FL6:

| Clausola del prompt del 31-08 | Dove sta | Esito |
|---|---|---|
| Pannello «Model outline» nel manager | `InstanceManagerTab.tsx:823` (`OutlinePanel`), montato a `:1638` | c'e' |
| Innesto post-FL6 | prima colonna a sinistra; FL6 ha impilato **la colonna centrale** (`__main`: tabella sopra, form sotto) e ha lasciato le due letture a sinistra affiancate (`instanceManagerTab.scss:49-56`) | invariato, gia' coerente |
| Albero di containment dallo store | `outlineTree(idlookup, modelid, shape)` a `:1426`, una `useSelector` sola | c'e' |
| Riga: icona, nome, classe in mono, «+» | `:838` (icona per genere), `:894`, `:896` (`__code`), `:901` (`bi-plus-square`, `--color-accent`) | c'e' |
| Indentazione per profondita' | `style={{ paddingLeft: 14 + node.depth * 16 }}` a `:869` | c'e' |
| Selezione = vocabolario cyan | `--color-selection-bg` a `instanceManagerTab.scss:1042` — **ma senza la barra** | **mancava**, vedi A2 |
| «+» = child-slot leciti di QUEL nodo | `outlineMenuOf` a `:1459` → `childMenu`/`rootMenu` | c'e' |
| upper pieno = voce assente + motivo | `menu.blocked` a `:938`, mai una riga grigia | c'e' |
| Radice: sole rootable | `rootMenu(shape, countsByName)` a `:1461` | c'e' |
| Create dal motore esistente | `openCreate` → `newDraft` → `DraftDialog` → `applyCreate` | c'e' |
| Selezione condivisa outline ↔ tabella ↔ form | un solo `selectedObjectId` (`:1128`), `subjectId` allargato (`:1239`) | c'e' |
| Catalogo-New e outline-+ = stesso evento | `openCreate(...)` da tre siti, un solo `newDraft(` nel file | c'e' |

Le sole due cose che il prompt chiede e che il repo **non** aveva sono in A2 e A3.
Il resto non e' stato rifatto: rifarlo sarebbe stato riscrivere codice verificato
(Regola 3).

### A2. La barra della selezione mancava davvero

La riga della tabella porta la **coppia**: `background: var(--color-selection-bg)`
piu' `box-shadow: inset 2px 0 0 var(--color-selection-bar)` sulla cella del nome
(`instanceManagerTab.scss:263-268`). Il nodo dell'outline portava la sola
campitura. Due superfici che dicono «questo e' selezionato» in due modi diversi
sono due vocabolari, non uno: aggiunta la barra al nodo selezionato, sul bordo
della **colonna** e non sull'inserto del livello (un indicatore che scorre con la
profondita' si leggerebbe come un secondo dato). Misurato nel CSS emesso da
`npm run build`.

### A3. Due delle quattro prove attese non erano committate

Le prove 1 e 2 del prompt erano gia' coperte dai moduli puri: i quattro livelli e
il puntatore morto in `outlineDraw.test.ts` (22 casi), lo slot pieno e le sole
rootable in `jjform/__tests__/outline.test.ts` (20 casi). Le prove 3 e 4 —
selezione coerente su id, e «stesso evento, assert sull'evento non sulla UI» —
erano state misurate **solo** dalla sonda `_tmp_10b_verify.ts`, che non e'
committata e quindi non regge nel tempo. Sono ora in
`components/abstract/tabs/__tests__/instanceManagerOutline.test.ts`, 15 casi:

- la clausola 4 e' provata sul **motore**, dove e' misurabile invece che leggibile:
  `newDraft(SHAPE, 'Region', 'm1', 'regions')` da' lo stesso draft comunque lo si
  chiami, e per diramarsi sulla provenienza servirebbe prima un argomento che la
  nomina, che la firma non ha. Sul sorgente: i tre siti passano tutti da
  `openCreate`, e `newDraft(` compare **una volta sola** nel tab;
- la clausola 3 su `subjectId`, `selectedObjectId` unico, nessun secondo stato
  dell'albero, e il contrasto che conta — `selectFromOutline` **non** chiama
  `setSelectedClassId`, mentre `commitDraft` si', quindi selezionare nell'albero
  non cambia la collezione sotto.

Meta' del file e' asserito sul sorgente per la ragione gia' dichiarata in
`instanceManagerFl6.test.ts`: `environment: 'node'`, nessun jsdom (Regola 4), e
`InstanceManagerTab` muore all'import su `window`. Il controllo positivo e' in
ogni blocco che afferma un'assenza; la sola asserzione sul foglio ha signal
misurata per mutazione (tolta la `box-shadow`: 1 rosso; ripristinata: 15 verdi).

### A4. Divergenza dichiarata, non chiusa

Il prompt scrive «classe in mono **10px slate-400**». Il markup usa
`instance-manager__code`, che il foglio da' a **11px** e `--color-form-section`
(slate-500), ed e' lo **stesso** token della tabella e del menu. Ritoccarlo per
il solo albero spezzerebbe la parita' fra le due superfici; ritoccarlo per tutte
e' una modifica alla tabella, fuori dal perimetro di questa slice. Lasciato
com'e' e dichiarato qui.

### A5. Coordinamento con FL7

`InstanceManagerTab.tsx` **non e' toccato** da questo passo: il delta e' una
regola nel foglio piu' un file di test nuovo. `egoNeighborhood.ts`,
`EgoDiagram.tsx` e `egoDiagram.scss` non sono toccati. Zero contesa con FL7.
