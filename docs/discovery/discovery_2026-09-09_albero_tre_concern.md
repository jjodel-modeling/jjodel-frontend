# Discovery — i tre concern sotto VIEWPOINTS nell'albero del megamodello

**File**: `docs/discovery/discovery_2026-09-09_albero_tre_concern.md`
**Data**: 2026-09-09
**Ramo**: `validation-skeleton`
**Fase**: 1, READ-ONLY. Nessuna modifica al codice, nessuna proposta di implementazione.
**Normativa**: R-VAL-19 (`874199048`), spec §8bis
(`docs/spec/claude_spec_2026-09-08_user_defined_validation.md`).
**Ambito**: cosa c'e' oggi e cosa si rompe. Le vie d'uscita non sono qui per mandato del prompt.

---

## 0. Sintesi in sei righe

1. L'albero e' **uno solo e dichiarativo**: `TreeViewContent.tsx`, un blocco JSX di sezioni
   annidate a mano. Non c'e' modello di albero da riordinare: si sposta del JSX.
2. **`SYNTAX` e `VALIDATION` esistono gia'** sotto `VIEWPOINTS`, chiavi comprese. Quello che manca
   e' la visibilita' a zero: entrambe sono dietro un `length > 0`.
3. La riga `DATA MANAGER` **ha un clic** e ne ha piu' di uno: etichetta, riga di stato, ogni riga
   figlia. Tutti scrivono lo stesso `_lastSelected.view`. Sono scritture indipendenti dalla
   posizione nell'albero: **sopravvivono a uno spostamento**. Quello che non sopravvive intatto e'
   la *raggiungibilita'*: nidificando, la riga di stato passa da un'espansione a due.
4. I conteggi **non significano gia' oggi la stessa cosa**: `VIEWPOINTS` conta viewpoint,
   `DATA MANAGER` conta **classi personalizzate**. R-VAL-19 chiede l'omogeneita': e' un cambio di
   semantica del numero del Data Manager, non un ricalcolo.
5. L'espansione di default e' **aperto salvo collasso esplicito**, persistita su
   `DProject.expandedTreeNodes` (per **progetto**, non per utente). Nessuna migrazione serve per
   una chiave nuova; serve invece iscriverla in `STATIC_SECTION_KEYS`.
6. **L'occhio accanto a «State Machines Syntax» non e' un occhio della visibilita'.** E' il
   glifo di tipo del badge `VP`, statico, con `title="Viewpoint"`. Non attiva niente e non e'
   riusabile per R-VAL-2: l'attivazione oggi vive nel **picker della Toolbar**, ed e' **esclusiva**
   (uno per volta), che e' l'opposto di quello che R-VAL-2 chiede.

---

## 1. Dove l'albero e' costruito

**Un solo albero**, e il montaggio e' questo:

```
pages/components/Dashboard.tsx:643   <PropertiesWithTreeView mode={'floating'} />
  components/editors/PropertiesWithTreeView.tsx:988   <TreeViewContent />
    components/TreeViewSidebar/TreeViewContent.tsx     (2943 righe)
```

Non e' l'unico posto dove compaiono le parole `METAMODELS` e `VIEWPOINTS`:
`components/project/ProjectEditor.tsx:2532,2898` ha sezioni omonime, ma e' la **dashboard di
progetto** — schede in `list-card`, non un albero, senza `SYNTAX`, senza `DATA MANAGER`, senza
`DOCUMENTATION`. I rami che il prompt nomina esistono solo in `TreeViewContent`. Nota per
il §5: e' pero' li' che vive un bottone `bi-eye` *vero*, e non e' quello di cui parla R-VAL-19.

### 1.1 La struttura e' dichiarativa, ma non e' dato: e' JSX

Non esiste un array di nodi. La gerarchia e' **scritta a mano** come annidamento di `<SectionNode>`
nel `return` del componente (`TreeViewContent.tsx:2268-2500`):

```
<SectionNode MEGAMODEL depth=0>
  <SectionNode METAMODELS depth=1 counter={displayMetamodels.length}>   :2306-2346
  <SectionNode VIEWPOINTS depth=1 counter={viewpointCount}>             :2349-2440
      <SectionNode VIEWPOINTS_SYNTAX      depth=2>  se syntaxVps.length > 0      :2358
      <SectionNode VIEWPOINTS_VALIDATION  depth=2>  se validationVps.length > 0  :2388
      otherVps.map(<ViewpointNode depth=2>)   -- viewpoint sciolti, senza sotto-sezione
  <SectionNode DATA_MANAGER depth=1 counter={dataManager.classes.length}>  :2444-2473
  <SectionNode DOCUMENTATION depth=1>                                      :2475-2486
  displayTransformations.map(<TransformationItem depth=1>)
```

Conseguenze operative:

- **`SYNTAX` e `VALIDATION` sono gia' li'.** Chiavi `SECTION_KEYS.VIEWPOINTS_SYNTAX` /
  `VIEWPOINTS_VALIDATION` (`:61-62`), gia' in `STATIC_SECTION_KEYS` (`:71-72`), gia' seminate dalla
  migrazione `2.215 -> 2.216` (`VersionFixer.tsx:727-732`). Il partizionamento per tipo e' al
  `:2226-2240` e usa `getViewpointType` (`view/viewPoint/viewpoint.ts:17-22`), che riconosce
  `'validation'` da `vp.isValidation`. **La chiave `DATA_MANAGER` non e' fra quelle seminate dalla
  migrazione**, e non serve che lo sia (§4).
- La `depth` e' un **numero passato a mano** a ogni nodo, e governa solo il `padding-left`
  (`TREE_INDENT_STEP = 12`, `:52`). Non c'e' calcolo: spostare un ramo significa riscrivere i
  numeri, e un numero dimenticato non e' un errore di tipo, e' un rientro sbagliato.
- Il terzo gruppo, `otherVps` (tutto cio' che non e' `syntax` ne' `validation` — oggi
  `'decoration'`), e' reso **piatto a depth 2**, come fratello delle due sotto-sezioni. Nell'albero
  di oggi `VIEWPOINTS` puo' quindi contenere una forma mista: sezioni e righe-viewpoint accanto.
  R-VAL-19 nomina tre concern e non dice dove finisce il quarto gruppo.
- Lo stile non distingue i livelli: `.tree-section__label` e' 11px maiuscolo terziario a **ogni**
  profondita' (`tree-view-sidebar.scss:1258-1265`). `SYNTAX` a depth 2 e `VIEWPOINTS` a depth 1
  differiscono per il solo rientro. Il `text-transform: uppercase` di quella regola e' anche il
  motivo per cui le etichette sorgente `"Data Manager"`, `"Syntax"`, `"Viewpoints"` si leggono
  a schermo come le maiuscole del prompt.

---

## 2. La riga DATA MANAGER: cosa sa fare, e cosa sopravvive

**Ha un comportamento al clic, e ne ha quattro.** Tutti chiamano `selectDataManager()` (`:717-726`),
che fa **una sola** scrittura:

```typescript
SetRootFieldAction.new('_lastSelected' as any, {
    node: '', view: DATA_MANAGER_VIEWPOINT_ID, modelElement: '',
});
```

I quattro bersagli:

| bersaglio | riga | cosa fa |
|---|---|---|
| l'etichetta `DATA MANAGER` | `:2451` `onLabelClick` | seleziona il singleton |
| il resto dell'header + il chevron | `SectionNode:679,684` `onToggle` | espande/collassa, **non** seleziona |
| la riga di stato a vuoto | `:820` `onClick` | seleziona il singleton |
| ogni riga di classe e ogni riga di feature | `:740-746`, `DataManagerClassNode` | seleziona il singleton |

Il pannello a valle e' `Info.tsx:1381-1394`: il ramo si accende su `props.viewId ===
DATA_MANAGER_VIEWPOINT_ID` **oppure** sul tipo del `__raw`, e rende `DataManagerViewpointPanel`
identico che il singleton esista o no — e' cosi' che si raggiunge lo *stub* di R-DMV-6 senza
materializzare niente (il test `dataManagerSection.test.ts:104-110` sorveglia proprio che
`selectDataManager` non chiami `ensureDataManagerViewpoint`).

**Sopravvive a uno spostamento di un livello?** Il *comportamento* si': la scrittura non legge la
posizione nell'albero, non passa dal `depth`, non dipende dal padre. `SectionNode` e' generico e
`onLabelClick` e' un suo parametro, quindi la stessa sezione resa a depth 2 sotto `VIEWPOINTS`
conserva etichetta cliccabile, riga di stato cliccabile e righe figlie cliccabili.

Quello che **non** sopravvive intatto e' l'*esposizione*, e sono tre cose distinte:

1. **Doppia espansione.** I figli di `SectionNode` si rendono solo se `expanded`
   (`SectionNode:690`). Nidificando, la riga di stato e' visibile solo se `VIEWPOINTS` **e**
   `DATA MANAGER` sono aperti. Oggi ne basta uno. R-VAL-19 tiene `VIEWPOINTS` espanso per
   default proprio per questo, ma «espanso per default» significa «finche' l'utente non lo
   collassa», e il collasso e' persistito (§4): un utente che chiude `VIEWPOINTS` una volta
   perde il Data Manager dall'indice per sempre, su quel progetto.
2. **La `depth` e' letterale.** `<DataManagerEmptyState depth={2}` (`:2456`) e
   `<DataManagerClassNode depth={2}` (`:2461`) sono costanti scritte a mano. `DataManagerEmptyState`
   calcola il proprio `padding-left` da quel numero (`:817`) — non ha altro allineamento — e il
   `.tree-empty-dmv` in SCSS (`:1595-1608`) non porta indentazione propria. Una `depth` non
   aggiornata da' una riga di stato allineata al livello sbagliato: nessun test rosso di
   comportamento, solo un pixel.
3. **La riga di stato e' la riga di un ramo vuoto.** Il testo `All classes use the type-derived
   defaults` e' letterale in `DataManagerEmptyState` (`:823`), reso **solo** nel ramo
   `dataManager.classes.length === 0` del ternario a `:2455`. Non e' una proprieta' della sezione:
   e' l'`else` di un conteggio. Se il conteggio cambia semantica (§3), cambia anche quando la riga
   compare.

### 2.1 Cosa si rompe, misurato

- `frontend/src/components/TreeViewSidebar/__tests__/dataManagerSection.test.ts:59` asserisce alla
  lettera `'<DataManagerEmptyState depth={2}'` **sul sorgente**. Uno spostamento a depth 3 lo fa
  **fallire**. E' l'unica rete che copre il rientro, e va letta come tale: e' una canarina, non una
  specifica.
- Lo stesso file `:88-92` asserisce
  `'viewpointCount: syntax.length + validation.length + other.length'` e
  `.not.toContain('counter={displayViewpoints.length}')`. Se il contatore di `VIEWPOINTS` deve
  contare il totale compreso il Data Manager (R-VAL-19), la prima asserzione **fallisce**.
- `docs/discovery/harness/probe_2026-09-04_rdmv_sliceE_sidebar.mts:233` (check **D5**) asserisce
  che dentro `[data-section-key="__section:viewpoints"]` il contatore sia `'1'` e che nessuna
  `.tree-row__name` contenga `Data Manager`. Il contatore **cambia** se il totale include il
  singleton: D5 va rosso. La seconda meta' del check resta verde per un accidente — l'etichetta di
  sezione e' `.tree-section__label`, non `.tree-row__name` — e questo e' il tipo di verde che non
  misura piu' niente: va riscritto, non rifatto passare.
- Sempre in quella sonda, `:148-153` raccoglie `[data-section-key]` in un array **piatto**: e'
  cieco all'annidamento e restera' verde qualunque cosa si sposti. `dmvSection()` (`:111-118`)
  interroga per `data-section-key` senza contesto: sopravvive allo spostamento.

---

## 3. I conteggi

`SectionNode` rende il numero se `typeof counter === 'number'` (`:685-687`), quindi **uno zero si
vede**. Chi lo calcola, sezione per sezione:

| ramo | espressione | riga | cosa conta |
|---|---|---|---|
| `METAMODELS` | `displayMetamodels.length` | `:2310` | metamodelli (filtrati dalla ricerca) |
| `VIEWPOINTS` | `viewpointCount` | `:2353` | **viewpoint**: `syntax + validation + other` |
| `SYNTAX` | `syntaxVps.length` | `:2362` | viewpoint di tipo `syntax` |
| `VALIDATION` | `validationVps.length` | `:2392` | viewpoint di tipo `validation` |
| `DATA MANAGER` | `dataManager.classes.length` | `:2448` | **classi personalizzate**, non viewpoint |
| `DOCUMENTATION` | — | `:2477` | nessun contatore |

Il numero accanto a `VIEWPOINTS` (`:2226-2240`) e' il totale dei tre secchi **meno il singleton
del Data Manager**, escluso con un `continue` prima del partizionamento — e l'esclusione e'
deliberata e sorvegliata (R-DMV-5; test `:75-86` verifica che il `continue` preceda i rami, cosi'
il singleton non cada nel secchio `other`). Il conteggio e' per **viewpoint**, non per view: le
`subViews` non entrano.

**Il disallineamento che R-VAL-19 chiede di sanare esiste ed e' piu' profondo di un ricalcolo.**
Oggi due numeri allo stesso livello visivo dicono cose di specie diversa: `VIEWPOINTS` = quanti
viewpoint, `DATA MANAGER` = quante classi deviano dal default. Portare il Data Manager sotto
`VIEWPOINTS` con «i conteggi significano la stessa cosa a ogni livello» implica che il numero del
Data Manager diventi `0` o `1` (esiste il singleton?), e che il totale di `VIEWPOINTS` lo includa.
Il costo non e' aritmetico: `dataManager.classes.length` e' anche il **discriminante della riga di
stato** (`:2455`) e il soggetto del check D3 della sonda (`:216-218`, «il contatore della sezione
conta le classi personalizzate»). Sono tre consumatori dello stesso numero, e due parlano di classi.

`buildDataManagerData` (`:2880-2926`) restituisce anche un campo `exists: !!dVp` che **oggi nessuno
legge** — verificato: le uniche letture di `dataManager` nel componente sono `.classes.length`
(`:2448`, `:2455`) e `.classes.map` (`:2458`). Un conteggio «0 o 1» avrebbe gia' il suo dato.

---

## 4. L'espansione per default

**Regola**: una chiave assente e' **espansa**. `isExpandedFromArray` (`:311-318`):

```
'!' + key presente  -> collassato      (COLLAPSED_PREFIX, :309)
key presente         -> espanso
nessuno dei due      -> espanso        <- il default
```

Il collasso e' quindi registrato **positivamente**, con un marcatore sentinella, e l'array
`DProject.expandedTreeNodes` (`joiner/classes.ts:3050,3141`) mescola le due specie di voce.

**Persistenza**: e' un campo di `DProject`, scritto con `SetFieldAction.new(projectId,
'expandedTreeNodes', ...)` (`:2093`). Sta nello **stato del progetto**, non nelle preferenze
utente: viaggia col progetto, si salva col progetto, e due utenti sullo stesso progetto condividono
lo stesso albero aperto. Non e' ricalcolato a ogni apertura.

Tre cose non ovvie, tutte rilevanti per un ramo nuovo:

1. **Serve l'iscrizione in `STATIC_SECTION_KEYS` (`:67-75`), non una migrazione.** L'effetto di
   pulizia degli orfani (`:2099-2154`) tiene una voce solo se e' una chiave statica nota, un
   `__section:models:<id>` di un metamodello vivo, o un id vivo. Una chiave di sezione **non**
   iscritta viene potata al giro immediatamente successivo al collasso: il chevron si riapre da
   solo e il gesto non si registra mai. Il commento del test `:41-44` descrive esattamente questo
   guasto, e non e' teorico — e' la ragione per cui la chiave `DATA_MANAGER` e' li'.
2. **La migrazione `2.215 -> 2.216` (`VersionFixer.tsx:713-766`) e' storia, non contratto.** Semina
   sei chiavi di sezione (`megamodel`, `metamodels`, `viewpoints`, `viewpoints/syntax`,
   `viewpoints/validation`, `documentation`) piu' gli id vivi, ed e' idempotente: salta i progetti
   che hanno gia' un array. `__section:dataManager` **non c'e'** — aggiunto dopo — e la sezione
   funziona lo stesso, perche' l'assenza vale espanso. Una sezione nuova **non ha bisogno** di una
   nuova migrazione per essere aperta di default.
3. **Durante una ricerca la persistenza e' scavalcata.** `isExpandedFn` (`:2071-2075`) legge
   `searchCollapsed`, un `Set` locale ed effimero; `onToggleFn` (`:2077-2094`) non dispaccia
   affatto mentre la ricerca e' attiva. Voluto e commentato.

**Il rischio concreto per R-VAL-19.** «`VIEWPOINTS` resta espanso per default» e' gia' vero e non
costa niente. Ma il default e' *solo* il default: `!__section:viewpoints` e' una voce che l'utente
puo' scrivere con un clic, sopravvive al salvataggio, e da quel momento nasconde tutti e tre i
concern in un colpo. Oggi `DATA MANAGER` e' immune a quel gesto perche' e' un fratello.

---

## 5. L'occhio accanto a «State Machines Syntax»

**Non e' un occhio della visibilita'. E' il glifo del tipo, e non fa niente di suo.**

`ViewpointNode` (`:1695-1805`) rende un `EntityRow` con `badge="VP"` e
`badgeClassName="tree-viewpoint"` (`:1767-1769`). `EntityRow` risolve il glifo dalla tabella
`BADGE_ICON` (`:836-851`):

```typescript
'tree-viewpoint': { icon: 'bi-eye', label: 'Viewpoint' },
```

e lo rende dentro uno `<span className="tree-node__icon ..."  title="Viewpoint"
aria-label="Viewpoint">` (`:939-945`). Quello `span` **non ha `onClick` proprio**: il gestore vive
sul `div.tree-row__content` che lo contiene (`:938`), cioe' cliccare l'occhio fa esattamente quello
che fa cliccare il nome — `SetRootFieldAction` su `_lastSelected.view` (`:1727-1737`), la selezione,
non l'attivazione. E' un'icona di tipo esattamente come `bi-box-seam` per una classe o
`bi-diagram-3` per un metamodello: la stessa tabella, la stessa meccanica.

Controllo positivo e negativo, entrambi eseguiti (`command grep`, non il wrapper `ugrep`):

- in `TreeViewContent.tsx` ci sono **due** occorrenze di `bi-eye` — `:637` (voce «Create View» del
  menu contestuale del classifier) e `:843` (la tabella qui sopra). Controllo positivo sullo stesso
  file: `bi-chevron` da' 3 occorrenze, quindi il pattern trova.
- **zero** occorrenze di `bi-eye-slash` in tutto il file, mentre nel repo ce ne sono (per esempio
  `InstanceManagerTab.tsx:2541`, `StructureGroups.tsx:385`). Un toggle di visibilita' che si
  spegne non c'e' — e non e' un silenzio, e' un negativo con controllo.
- l'unica `actions` della riga viewpoint e' il bottone `+` «Add view» (`:1755-1763`). Non c'e' altro
  bersaglio cliccabile sulla riga.

### 5.1 Dov'e' davvero l'attivazione, e perche' non e' riusabile com'e'

L'attivazione e' `activateViewpoint(id | null)` in `utils/lastViewpoint.ts:49-74`, una **doppia
scrittura** deliberatamente fuori TRANSACTION: `project.activeViewpoint` via `SetFieldAction`, e la
radice `state.viewpoint` via `SetRootFieldAction`. I chiamanti sono due soltanto:
`Toolbar.tsx:352` (il picker di sintassi) e `EditorSwitch.tsx:93` (ripristino allo switch).
**L'albero non la chiama mai.**

Il picker (`Toolbar.tsx:279-293, 385-405`) e' una listbox a **valore singolo**: elenca ogni
viewpoint non di sistema e non-Data-Manager — quindi **anche quelli di tipo `validation`**, senza
distinzione — piu' la voce sintetica «Data manager» che e' intercettata prima di
`activateViewpoint` e apre una tab (`dataManagerOption.ts`, test `dataManagerPicker.test.ts`).

Due conseguenze da tenere ferme:

- **Non esiste oggi nessuna affordance a occhio per attivare un viewpoint**, ne' sulla sintassi ne'
  altrove nell'albero. La frase di R-VAL-19 «l'occhio che la sintassi ha gia'» descrive
  un'affordance che nel rail **non c'e'**: c'e' il glifo omonimo. (L'unico `bi-eye` cliccabile del
  prodotto sta nella dashboard, `ProjectEditor.tsx:2947-2950`, bottone `title="View"` che chiama
  `handleOpenViewpoint` — apre, non attiva, e non e' nell'albero.)
- **Il canale che esiste e' esclusivo per costruzione.** Una radice sola, un valore solo,
  `activateViewpoint(null)` per spegnere. R-VAL-2 vuole viewpoint di validazione **multipli e
  contemporaneamente selezionabili**: non e' lo stesso stato, e non e' una questione di dove si
  mette il bottone. Un occhio per-riga nell'albero che scrivesse `state.viewpoint` spegnerebbe la
  sintassi attiva, con effetti su cinque lettori della radice (elencati nel commento di
  `lastViewpoint.ts:66-71`: `EditorSwitch:55`, `Toolbar:202`, `irResolveCore:117,139`,
  `vertexLayoutAdapter:32`) piu' il filtro dell'albero stesso (`treeViewScope.ts`, che dimma i
  classifier non resi dal viewpoint attivo).

---

## 6. Il ramo a zero: generico o scritto per il Data Manager

**Scritto per lui, e per la Documentazione. Non c'e' meccanismo generico.** Le sei sezioni si
rendono con quattro guardie diverse:

| ramo | guardia | riga | visibile a zero? |
|---|---|---|---|
| `METAMODELS` | `!searchActive \|\| displayMetamodels.length > 0 \|\| ...` | `:2306` | si' |
| `VIEWPOINTS` | `!searchActive \|\| viewpointCount > 0` | `:2349` | si' |
| `SYNTAX` | `syntaxVps.length > 0 &&` | `:2358` | **no** |
| `VALIDATION` | `validationVps.length > 0 &&` | `:2388` | **no** |
| `DATA MANAGER` | `!searchActive &&` | `:2444` | **si'** |
| `DOCUMENTATION` | `!searchActive &&` | `:2475` | si' |

Il vuoto dichiarato e' anch'esso per sezione, non condiviso: due componenti distinti
(`DataManagerEmptyState :813-827`, `DocumentationEmptyState :1891+`) con due regole SCSS distinte
(`.tree-empty-dmv :1595-1608`, `.tree-empty-doc :1548-1561`) e il commento in testa alla prima
(`scss:1590-1594`) spiega perche' non riusa la seconda: `.tree-empty-doc` e' `space-between` per
via del bottone Generate. Non c'e' un `<EmptyBranch label=...>` da riusare: **oggi «vedersi a zero»
si scrive, non si eredita**, e per `SYNTAX` e `VALIDATION` significa **cambiare la guardia**, non
solo aggiungere una riga.

**Il ramo a zero-zero, che nessuna delle guardie sopra copre.** A monte di tutto c'e' `hasContent`
(`:2242-2246`):

```typescript
const hasContent = metamodels.length > 0 || standaloneModels.length > 0
                || viewpoints.length > 0 || transformations.length > 0;
```

Se e' falso, il `return` a `:2255-2265` sostituisce **l'intero albero** con lo stato vuoto «No
metamodels / Create a metamodel to see the hierarchy». In quel progetto non si vedono ne'
`VIEWPOINTS`, ne' `DATA MANAGER`, ne' `DOCUMENTATION`, a nessun livello di zero. Questa e' la
frontiera vera del «si vedono anche a zero» di R-VAL-19: la scoperta che la decisione vuole
garantire e' esattamente cio' che questo `return` nega nel progetto appena creato — che e' il
momento in cui un utente ha piu' bisogno di sapere che la funzione esiste. Il termine
`viewpoints.length` e' quello del *props* non filtrato, che include il singleton del Data Manager
quando esiste: la sonda D5 lo misura indirettamente, il singleton c'e' e il contatore filtrato dice
comunque `1`.

Ultima nota di contorno: `DATA MANAGER` e `DOCUMENTATION` **spariscono durante una ricerca**
(`!searchActive`), mentre `SYNTAX` e `VALIDATION` no — spariscono per il conteggio a zero, che in
ricerca coincide quasi sempre. Nidificando il Data Manager dentro `VIEWPOINTS` le due guardie si
compongono senza contraddirsi (`!searchActive` implica il ramo esterno), ma la sezione esterna
resterebbe visibile con dentro il nulla quando la ricerca non produce viewpoint: una `VIEWPOINTS 0`
aperta e vuota, che oggi non si verifica perche' `viewpointCount > 0` la nasconde.

---

## 7. Inventario dei file che il cambiamento tocca

Nessuna proposta, solo il perimetro accertato. Per Fase 2 conta che siano **sei**, oltre la soglia
di 5 della regola 19.

| file | perche' |
|---|---|
| `components/TreeViewSidebar/TreeViewContent.tsx` | il JSX delle sezioni, le `depth` letterali, il memo dei conteggi, `STATIC_SECTION_KEYS` |
| `components/TreeViewSidebar/tree-view-sidebar.scss` | solo se la riga di stato o le sezioni annidate cambiano forma; l'indentazione oggi e' inline, non SCSS |
| `components/TreeViewSidebar/__tests__/dataManagerSection.test.ts` | asserisce `depth={2}` e la formula di `viewpointCount` **sul sorgente**: rosso garantito |
| `docs/discovery/harness/probe_2026-09-04_rdmv_sliceE_sidebar.mts` | D3 (contatore = classi) e D5 (contatore `VIEWPOINTS` = `'1'`) |
| `redux/VersionFixer.tsx` | **non necessario** per l'espansione (assente = aperto). Iscritto qui per dire che e' stato verificato e escluso, non dimenticato |
| `view/viewPoint/viewpoint.ts` | **non toccato**: `getViewpointType` riconosce gia' `'validation'`; nessun tipo nuovo serve |

Fuori perimetro accertato, e da non toccare: `Info.tsx` (il ramo del pannello e' per pointer, non
per posizione), `Toolbar.tsx` e `lastViewpoint.ts` (l'attivazione non passa dall'albero oggi, e
R-VAL-2 non e' questa fetta), `ProjectEditor.tsx` (altra superficie).

---

## 8. Cosa resta non accertato

- **Non e' stato misurato a schermo.** Questo referto e' lettura di sorgente con controlli positivi
  sui comandi, piu' le asserzioni della sonda `probe_2026-09-04_rdmv_sliceE_sidebar.mts` gia'
  committata, che e' un comportamento misurato ma **al 2026-09-04**. Per CLAUDE.md §5 («non fidarsi
  di fixture a memoria fra sessioni») lo stato descritto da quella sonda e' un'ipotesi sul codice di
  allora: coincide con il sorgente di oggi in ogni punto che ho riletto, ma nessuno ha rieseguito la
  sonda in questo giro.
- **Il quarto secchio.** `otherVps` (viewpoint `decoration`) e' reso piatto sotto `VIEWPOINTS`.
  R-VAL-19 nomina tre concern e non dice se quel gruppo diventa un quarto ramo, resta sciolto, o
  sparisce. Non e' una domanda che il codice possa rispondere.
- **La semantica del contatore del Data Manager** e' una scelta ratificata da fare, non un dato:
  `0/1` (viewpoint) o `N` (classi) sono entrambe difendibili, e la prima rompe D3 della sonda
  mentre la seconda rompe l'omogeneita' che R-VAL-19 chiede. Questo referto registra il conflitto;
  non lo scioglie.

---

## 9. Addendum di Fase 2 (2026-09-09, dopo il diff)

Aggiunto in coda e non al posto di quanto sopra (R-E/E-1). Qui stanno le cose che la Fase 2 ha
dovuto **decidere** e che nessuna decisione ratificata copriva, piu' l'unico pezzo di perimetro
consegnato a meta'. Il resto della Fase 2 sta nella entry di log del giro.

### 9.1 Il pezzo consegnato a meta': «apre l'ambiente **su quella regola**»

R-VAL-19 dice che cliccare una regola apre l'ambiente su quella regola. Consegnato: il clic
dispaccia `JjodelEvents.VALIDATION_RULES_OPEN` con lo stesso `detail` del bottone della Toolbar, e
il modale si apre sul **metamodello della classe di contesto** della regola. Non consegnato: la
regola non e' preselezionata dentro l'ambiente.

Il motivo e' di perimetro, non tecnico. `ValidationRulesOpenDetail` non porta un `ruleId`, e il
consumatore che dovrebbe leggerlo — `ValidationRulesModal.tsx`, che al montare azzera
`selectedClassId` e `selectedRuleId` — e' uno dei due file sporchi di un'altra corsia, che RC-13 e
il prompt mettono fuori portata. **Non e' stato dispacciato un `ruleId` che nessuno legge**: un
campo scritto e mai consumato e' la scrittura morta che §5 insegue, e sarebbe sembrato lavoro fatto.
Il seguito e' una riga nel `detail` piu' due `setState` nel modale, da fare nella corsia che quel
file possiede.

### 9.2 Tre scelte prese in assenza di decisione

**(a) Sotto `VALIDATION` convivono due specie.** I `DViewPoint` con `isValidation` (viewpoint di
*view*, creabili dalla dialog «New viewpoint», gia' resi li' prima di questo giro) e i
`DValidationViewpoint` dello scheletro R-VAL (che portano *regole*). Entrambi si dichiarano
viewpoint di validazione, e togliere i primi avrebbe degradato comportamento committato senza una
decisione che lo dica (regola 3). Il contatore del concern li somma. Da ratificare: se i primi
debbano restare li', migrare, o sparire.

**(b) `otherVps` resta sciolto a depth 2.** R-VAL-19 nomina tre concern e tace sul quarto gruppo —
oggi i viewpoint `decoration`. Sono rimasti dove stavano, righe sciolte sotto `VIEWPOINTS` accanto
alle tre sezioni, e sono contati nel totale. La forma mista era gia' quella di prima; questo giro
non l'ha creata e non l'ha risolta.

**(c) La riga del `DValidationViewpoint` non ha click.** Un `DValidationViewpoint` **non e'** un
`DViewElement`: scriverne l'id in `_lastSelected.view` manderebbe `Info.tsx` a risolvere una view
che non esiste. La riga resta contenitore — si apre e si chiude — e le cose da aprire sono le
regole. Un click che aprisse l'ambiente «sul viewpoint» dovrebbe scegliere un metamodello, e le
regole di un viewpoint possono starne su piu' d'uno: sarebbe una scelta arbitraria travestita da
navigazione.

### 9.3 Due cose viste e non toccate

- **Le righe di classe del Data Manager si accendono tutte insieme.** `DataManagerClassNode` passa
  `selected={selectedViewId === DATA_MANAGER_VIEWPOINT_ID}`: la pillola di selezione e' sul
  *viewpoint*, non sulla riga, quindi con il singleton selezionato **ogni** classe risulta
  selezionata. Si vede nello scatto `_tmp_concern_z_rail.png`. E' comportamento committato dal
  2026-09-05, fuori dal perimetro di questo giro, e non e' stato toccato.
- **`enabled` della regola non si vede.** R-VAL-19 vieta la spunta Active nell'albero, e mostrare
  lo stato senza il controllo e' una domanda di disegno a se': una regola spenta oggi si legge come
  una accesa. Iscritto, non risolto.

### 9.4 Cosa e' cambiato rispetto a quanto §7 prevedeva

§7 elencava sei file e dava `VersionFixer.tsx` come «verificato e escluso». Confermato: nessuna
migrazione. Ma il perimetro reale e' **sette**, perche' rendere eseguibile la formula dei conteggi
(P11, che il prompt chiedeva esplicitamente) ha richiesto un modulo puro nuovo,
`concernCounts.ts` — senza un solo import, altrimenti monaco rientra nel grafo e il test muore
all'import come prima.
