# Discovery, il rail sinistro diventa una Palette

**Data**: 2026-08-19 - **Branch**: `alfonso-frontend-jjtl` - **HEAD**: `363e121c0`
**Prompt**: `claude_2026-08-19_2336_prompt_ui_B_palette_rail_sinistro.md`
**Fase**: 1, read-only. Nessun file di codice modificato, nessun commit.

> **Prerequisito non soddisfatto.** Il prompt dichiara come prerequisito "prompt A completato e
> verificato visivamente". Il prompt A e' fermo al suo hard stop di Fase 1, con due domande bloccanti
> aperte e zero commit. Questa discovery e' read-only e indipendente, quindi si e' potuta fare lo
> stesso; la Fase 2 di B tocca pero' lo stesso file SCSS della Fase 2 di A. Vedi rischio 5.4.

---

## 0. Obiettivo

Censire i cinque punti richiesti prima di toccare il rail sinistro: dove vivono le tre stringhe, come
si popolano le due liste, che meccanismo di drag c'e' gia', perche' `Transition` non compare in
nessuna delle due liste mentre `Event` sta in quella "fuori viewpoint", e se i nomi `palette` e
`operations` sono liberi.

Tre findings **correggono** premesse del prompt. Sono segnati.

---

## 1. File letti

- `frontend/src/components/editor-v2/panels/PalettePanel.tsx` (componente, tutte e tre le stringhe, handler di drag)
- `frontend/src/components/editor-v2/EditorV2.scss` (blocco `.editor-v2-palette`, sotto-blocchi `.palette-instances`, `.palette-empty`, `.palette-notice`, `.palette-title`)
- `frontend/src/components/editor-v2/EditorV2.tsx` (memo `irPalette`, montaggio di `PalettePanel`)
- `frontend/src/components/editor-v2/hooks/useEditorMode.ts` (`resolveM1Info`, calcolo di `rootableClasses`, tipo `MetaclassReference`)
- `frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` (`applyIRPaletteFilter`)
- `frontend/src/components/editor-v2/utils/dragState.ts` (riferimento, `setDraggedMetaclassId`)
- `frontend/src/components/editors/views/data/PaletteData.tsx` e `palette-data.scss` (verifica di collisione)
- `frontend/src/examples/statechartplus.ts` (verifica sul metamodello, esito negativo, vedi §2.4)

---

## 2. Findings

### 2.1 Punto 1: componente, SCSS, e dove stanno le stringhe

- **Componente**: `panels/PalettePanel.tsx`. Il ramo M1 (`if (editorMode === 'model')`) restituisce
  `<aside className="editor-v2-palette editor-v2-palette--m1">`. Il ramo M2 e' un secondo `return`
  piu' in basso con `<aside className="editor-v2-palette">`.
- **SCSS**: `editor-v2/EditorV2.scss`. Tutte le regole della palette sono **annidate dentro**
  `.editor-v2-palette { ... }`, piu' un blocco di override `.editor-v2-palette--m1`.
- **Nessun sistema di i18n.** Non esiste `frontend/src/i18n`, e la ricerca di `i18next`,
  `react-i18next`, `useTranslation` non restituisce nulla. Controllo positivo sulla stessa forma di
  ricerca: `reactflow` restituisce piu' file, quindi la ricerca ha segnale. **Le stringhe sono
  letterali nel JSX**, e il punto di intervento e' il componente.

Le tre stringhe, con la classe che le porta:

| A schermo | Nel codice | Classe |
|---|---|---|
| `INSTANCES` | `Instances` | `.palette-instances__title` |
| `NOT IN THIS VIEWPOINT` | `Not in this viewpoint` | `.palette-instances__subtitle` |
| `Select an element to see available operations` | uguale | `.palette-empty palette-empty--centered` |

**CORREZIONE 1.** Le prime due sono in codice in **title case**: sono le regole SCSS a renderle
maiuscole, con `text-transform: uppercase` su `__title` e su `__subtitle`. Il prompt scrive le
sostituzioni in maiuscolo (`PALETTE`, `NOT IN VIEWPOINT`), che e' come si leggono a schermo ma non
come sono scritte nel file. Scrivere `PALETTE` nel JSX darebbe lo stesso risultato visivo e romperebbe
la convenzione locale. Vedi domanda 1.

### 2.2 Punto 2: come si costruiscono le due liste

Tre stadi, in tre file diversi.

**Stadio 1, strutturale** (`useEditorMode.ts`, `resolveM1Info`, terzo passaggio). Si raccoglie
`compositionTargetIds`: per ogni reference con `containment` vero si aggiungono il target **e tutte
le sue sottoclassi concrete**. Poi:

```
rootableClasses = rawClasses.filter(c => !c.isAbstract && !compositionTargetIds.has(c.id))
```

`MetaclassReference.containment` e' popolata come `containment: !!(ref.composition)`, cioe' legge il
campo canonico `composition` del D-layer, coerente con CLAUDE.md §3.8.

**Stadio 2, ripescaggio dai contenitori IR** (`EditorV2.tsx`, memo `irPalette`). Se il piano IR
dichiara `dropContainers`, `deriveDroppableChildMetaclasses` restituisce i nomi delle metaclassi
concrete droppabili dentro quei contenitori, e le classi corrispondenti **non gia' presenti** vengono
aggiunte ai candidati. E' la via per cui una classe contenuta puo' tornare in palette.

**Stadio 3, viewpoint** (`viewpoint/ir/irInteraction.ts`, `applyIRPaletteFilter`):

- se il piano non ha `paletteMetaclasses`, tutto finisce in `classes` e `undeclared` resta vuoto;
- altrimenti si partiziona per **nome**: dentro `paletteMetaclasses` va in `classes`, fuori va in
  `undeclared`;
- se la partizione lascia `classes` vuoto, scatta il fallback normativo: si mostra tutto,
  `fallback: true`, e **`undeclared` torna vuoto**.

Quindi `NOT IN THIS VIEWPOINT` contiene esattamente i **candidati** (rootable, piu' gli eventuali
ripescati dallo stadio 2) il cui nome non e' dichiarato dal viewpoint attivo.

Da censire, fuori perimetro: il confronto dello stadio 3 e' **per nome, non per id**. Due metaclassi
omonime in package diversi si comportano come una sola.

### 2.3 Punto 3: il meccanismo di drag

**HTML5 drag and drop nativo, nessuna libreria.** In `PalettePanel.tsx`, `onDragStart` scrive tre
chiavi su `dataTransfer`:

- `application/reactflow` con il tipo di nodo (`'objectNode'` nel ramo M1),
- `metaclassId` con l'id della metaclasse,
- `application/jjodel-classic` con lo stesso id, per il drop handler dell'editor classico,

piu' `setDraggedMetaclassId(metaclassId)` da `utils/dragState`, e `effectAllowed = 'move'`.
`onDragEnd` azzera lo stato di modulo.

**Entrambe le liste hanno `draggable`.** Anche gli item sotto `Not in this viewpoint` portano
l'attributo e gli stessi due handler: sono trascinabili e funzionanti, per progetto (il commento in
loco e la spec v1.2 sez. 6 dicono che sono creabili e rendono astratto finche' non si autora una view).

**CORREZIONE 2, che cambia il commit 2.** Il cursore c'e' gia'. La regola `.palette-instances__item`
dichiara **`cursor: grab`** a riposo e **`cursor: grabbing`** su `:active`. L'opzione 1 dell'ordine di
preferenza del prompt e' quindi **gia' implementata**, e non c'e' niente da fare su quel punto.

Quello che resta di D-UI-5 e' l'opzione 2, il fill. Oggi a riposo l'item ha
`background: var(--surface-2)` con `border: 0.5px solid var(--border-subtle)`, e in hover
`background: var(--surface-hover)`. E' il fill pieno a riposo che li fa leggere come spenti.

### 2.4 Punto 4: perche' `Transition` non compare da nessuna parte

**Il meccanismo e' certo, e sono due filtri diversi a due livelli diversi.**

- Una classe **bersaglio di una composizione** viene esclusa gia' allo stadio 1: non entra mai fra i
  candidati, quindi `applyIRPaletteFilter` non la vede, quindi **non puo' finire neanche in
  `undeclared`**. Sparisce senza traccia.
- Una classe **rootable ma non dichiarata dal viewpoint** viene esclusa allo stadio 3, che ha un
  contenitore visibile per gli scarti. Finisce sotto `Not in this viewpoint`.

I due trattamenti diversi che hai visto non sono quindi un'incoerenza di rendering: sono due
esclusioni con natura diversa, strutturale la prima e di viewpoint la seconda, di cui **solo la
seconda e' stata progettata per essere raccontata all'utente**. `Transition` e' quasi certamente
bersaglio di una composizione (tipicamente `State` o la macchina che contiene le transizioni), quindi
cade nel primo caso; `Event` e' rootable e cade nel secondo.

**Non ho potuto confermarlo sul tuo metamodello, e non lo affermo.** Verifica eseguita su
`frontend/src/examples/statechartplus.ts`, l'unico esempio a tema in repo: contiene `"name":"Transition"`
e `"name":"State"` una volta ciascuno, ma **zero** occorrenze di `Initial`, `Final` e `Event`. Non e'
il metamodello dello screenshot, quindi il repo non ha il caso da esaminare.

Il controllo che lo chiude in un colpo, da console sul progetto aperto: cercare se **una qualsiasi**
classe dichiara una reference con `composition` vera che punta a `Transition`. Se si', il caso e'
quello previsto e non c'e' nessun altro difetto da cercare.

Terza via, per completezza: lo stadio 2 puo' **rimettere in palette** una classe contenuta, se il
viewpoint IR attivo dichiara `dropContainers` che l'accettano. Se il tuo viewpoint li dichiarasse e
`Transition` restasse assente, allora la spiegazione sopra non basterebbe e servirebbe un secondo giro.

Come chiede il prompt, **non implemento nulla su questo punto**. La scelta fra sezione `CONNECTIONS`
separata, icona diversa o esclusione dichiarata resta a te: vedi domanda 5.

### 2.5 Punto 5: collisione di nomi

- **`palette`**: il prefisso e' gia' usato **fuori** da editor-v2, in
  `components/editors/views/data/PaletteData.tsx` con `.palette-row` e `.palette-row-container`
  (l'editor delle palette di colore), piu' le regole gemelle in `palette-data.scss` e
  `nestedView.scss`. Namespace diverso (`palette-row*` contro `palette-instances*`) e, soprattutto,
  **tutte le regole di editor-v2 sono annidate dentro `.editor-v2-palette`**, quindi scoped. Nessuna
  collisione, ne' attuale ne' introdotta.
- **`operations`**: zero occorrenze come nome di classe in `editor-v2/EditorV2.scss` e in
  `frontend/src/styles/`. Il nome e' libero.
- **Classi di header di sezione gia' esistenti**: ce ne sono **due**, con tipografia diversa.
  `.palette-instances__title` (font-size 10px, weight 500, letter-spacing .05em, uppercase,
  `--text-muted`, margin-bottom 8px, padding 0 2px) e `.palette-title` (font-size **11px**, uppercase,
  `--text-muted`, margin-bottom 8px, padding 0 **8px**), quest'ultima usata dalla palette M2.
  D-UI-3 chiede "stessa tipografia di `PALETTE`", quindi il riferimento e' la prima, non la seconda.

---

## 3. Rischi

### 3.1 D-UI-5 come scritta riduce la differenza fra le due liste

Gli item `--undeclared` hanno **gia'** `background: transparent`, `border-style: dashed` e
`opacity: 0.7`. Se gli item normali passano a fondo trasparente, come chiede l'opzione 2, i due stati
restano distinti solo per il tratteggio del bordo e per un 30% di opacita'. Il prompt pero' vincola
esplicitamente: "la differenza fra le due liste deve diventare piu' leggibile, non meno".

E' risolvibile, ma serve un terzo asse. Vedi domanda 3.

### 3.2 Gli item "fuori viewpoint" sono davvero trascinabili

Il prompt chiede che non ricevano l'affordance di drag. Oggi la ricevono, perche' `cursor: grab` e'
dichiarato sul blocco padre `&__item` e loro sono un modificatore. Toglierla renderebbe l'interfaccia
**meno** veritiera, non piu': quegli item si trascinano e il drop funziona, per progetto ratificato
(spec v1.2 sez. 6). Vedi domanda 4.

### 3.3 L'header `OPERATIONS` ha due posti possibili, non uno

Il contenitore `.palette-info-cards` compare in **entrambi** i rami: con una selezione porta le card
`Children` e `References`, senza selezione porta il solo empty state centrato. D-UI-3 parla solo
dell'empty state. Mettere l'header solo li' produce una sezione che si intitola quando e' vuota e
perde il titolo quando si riempie, che e' il contrario di quello che serve. Vedi domanda 2.

Attenzione anche a non confondere i due empty state: `.palette-empty` senza `--centered` e' usata pure
per `No rootable classes found`, che sta dentro `.palette-instances` e non c'entra.

### 3.4 Sovrapposizione con il prompt A

Entrambe le Fasi 2 scrivono in `frontend/src/components/editor-v2/EditorV2.scss`. Il prompt A tocca
`.editor-v2` (l'altezza) e non le regole della palette; il prompt B tocca `.palette-instances__item` e
aggiungerebbe una regola per l'header nuovo. Regole disgiunte, quindi il rischio di conflitto e'
basso, ma non nullo se le due Fasi 2 vengono aperte in parallelo. Consiglio di chiudere A prima, anche
perche' A e' il prompt che rende **visibile** il fondo del rail: oggi le tre righe di hint stanno sotto
la status bar o fuori dal viewport, quindi una verifica visiva di B sul fondo del rail non e' possibile
finche' A non e' fatto.

---

## 4. Proposte per i due commit (da approvare, non eseguite)

### 4.1 Commit 1, le tre stringhe

`frontend/src/components/editor-v2/panels/PalettePanel.tsx`, ramo M1, tre punti:

- `Instances` diventa `Palette` nel div `.palette-instances__title` (title case, la CSS lo rende
  maiuscolo; vedi domanda 1);
- `Not in this viewpoint` diventa `Not in viewpoint` nel div `.palette-instances__subtitle`;
- nuovo header `Operations` sopra il contenuto di `.palette-info-cards`, con la classe scelta alla
  domanda 2.

`frontend/src/components/editor-v2/EditorV2.scss`: solo se la domanda 2 sceglie una classe nuova.

Nessun tocco alla logica delle liste, al filtro di viewpoint, ne' ai nomi delle classi esistenti.

### 4.2 Commit 2, affordance di drag

`frontend/src/components/editor-v2/EditorV2.scss`, regola `.palette-instances__item`:

- stato a riposo: `background: transparent`, bordo **solido** e piu' visibile dell'attuale 0.5px;
- hover: resta `var(--surface-hover)`, che diventa cosi' il solo fill pieno e significa "sto puntando
  questo";
- `cursor: grab` e `:active { cursor: grabbing }` **restano come sono**: ci sono gia'.

Il modificatore `--undeclared` mantiene `border-style: dashed` e `opacity: 0.7`, che diventano i due
discriminanti residui. Se non bastano, la domanda 3 propone il terzo asse.

Altezza degli item non toccata, icone non toccate, comportamento del drag non toccato.

---

## 5. Domande aperte per Alfonso

1. **Maiuscolo nel JSX o nella CSS?** Le stringhe in codice sono title case e la CSS le rende
   maiuscole. Scrivo `Palette` e `Not in viewpoint` mantenendo la convenzione, oppure vuoi
   letteralmente `PALETTE` e `NOT IN VIEWPOINT` nel sorgente? Propongo la prima.
2. **Dove va `OPERATIONS`, e con quale classe** (§3.3 e §2.5). Due sotto-domande.
   (a) Header solo sopra l'empty state, come dice D-UI-3 alla lettera, o sopra `.palette-info-cards`
   in entrambi i rami, cosi' che la sezione resti intitolata anche quando mostra le card? Propongo la
   seconda, che e' quello che D-UI-3 vuole ottenere.
   (b) Quale classe: riuso `.palette-instances__title`, che e' semanticamente sbagliata perche' e' un
   figlio BEM di un altro blocco; oppure creo `.palette-section-title` e la applico **anche**
   all'header esistente come classe aggiuntiva, senza rinominare nulla, cosi' che la tipografia abbia
   una definizione sola; oppure creo `.palette-operations__title` duplicando le sei dichiarazioni.
   Propongo la seconda, ma comporta toccare l'elemento dell'header esistente, quindi la chiedo.
3. **Il terzo asse fra le due liste** (§3.1). Con gli item normali a fondo trasparente, restano
   tratteggio e opacita' a distinguere gli "undeclared". Opzioni: (a) accettarli come sufficienti;
   (b) abbassare ancora l'opacita' degli undeclared, a 0.55; (c) dare agli item normali un bordo di
   colore piu' marcato (`--border-default` invece di `--border-subtle`) tenendo il tratteggio agli
   altri. Propongo (c), che e' additiva e non spegne ulteriormente niente.
4. **Gli item "fuori viewpoint" tengono `cursor: grab`?** (§3.2). Sono davvero trascinabili. Il prompt
   dice di non dargli l'affordance; io propongo di **lasciargliela**, perche' toglierla mentirebbe su
   una interazione che funziona, e di affidare la distinzione al bordo e all'opacita'. Se preferisci
   il vincolo del prompt alla lettera, lo applico, ma volevo che la scelta fosse esplicita.
5. **`Transition`** (§2.4, punto obbligatorio). Confermi che nel tuo metamodello `Transition` e'
   bersaglio di una reference con `composition` vera? Se si', non c'e' nessun difetto da correggere e
   la decisione e' solo di design: sezione `CONNECTIONS` separata, icona diversa, o esclusione
   dichiarata con una riga tipo "contained classes are created from their container". Se invece il
   tuo viewpoint dichiara `dropContainers`, la spiegazione non basta e serve un giro di indagine in
   piu'.

---

## 6. Stato

Fase 1 chiusa. Nessun file di codice modificato, nessun commit.
Prossimo passo, **su go-ahead**: commit 1, dopo le risposte alle domande 1 e 2.
