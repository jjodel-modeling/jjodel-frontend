# Discovery — editabilita' della label centrale degli edge IR

**Documento prompt**: 2026-08-02 17:10
**Tipo**: mini-discovery obbligatoria (fix one-shot)
**Branch**: `alfonso-frontend-jjtl` — HEAD `b3aa05378`
**Protocollo**: `docs/PROTOCOL.md` P1..P9. Deroga implicita a P4 (two-phase): il prompt
autorizza a proseguire con l'edit se le quattro risposte sono chiare, con hard stop
spostato sul diff invece che sul report.

---

## 1. Obiettivo

Stabilire se l'affordance di edit inline della label centrale di un edge sia
disattivabile per i soli edge IR-autorati (gate `data.irEdgeViewId`) senza toccare
il comportamento delle edge classiche non-IR e delle label dei vertici.

## 2. Ipotesi che la discovery sta falsificando

- **H1** — «la modifica della label di un edge IR e' una scrittura morta»: la modifica
  non raggiunge JjOM e/o viene sovrascritta al primo ricalcolo.
- **H2** — «l'affordance e' separabile»: il punto in cui nasce la gesture di edit conosce
  gia' `data.irEdgeViewId`, quindi la disattivazione e' un gate locale e non un refactor.
- **H3** — «l'affordance e' condivisa in modo non separabile con le edge classiche o coi
  vertici» (ipotesi di STOP prevista dal prompt).

**Esito**: H1 **confermata** (in due forme distinte, sez. 4). H2 **confermata**.
H3 **falsificata** — condivisione con le edge classiche c'e', ma passa per un
discriminante gia' calcolato nello stesso componente; i vertici sono una superficie
completamente separata.

## 3. File letti (path completi)

| File | Righe rilevanti |
|------|-----------------|
| `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` | intero (814) |
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts` | 798-844 |
| `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` | intero (256) |
| `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` | 100-186 |
| `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` | 60-129, 190-215, 349 |
| `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` | 300-315, 441-442 |
| `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | 250-280 |
| `frontend/src/components/editor-v2/EditorV2.tsx` | 119-129, 1590-1610, 2670-2695, 3790-3800 |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | 426-470 |
| `frontend/src/components/editor-v2/EditorV2.scss` | 2150-2265 |
| `frontend/src/joiner/classes.ts` | 243-277, 2436-2456 |

---

## 4. Findings — le quattro domande del prompt

### D1 — Dove nasce l'affordance di edit

**Un solo sito, un solo componente**: `UnifiedEdge.tsx`, il div della label centrale.

`UnifiedEdge.tsx:753-763`:

```tsx
{!isInheritance && (
    <div
        className={`edge-label ...`}
        style={{ ..., pointerEvents: 'all' }}
        onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
        onClick={(e) => { e.stopPropagation(); if (selected) { setEditing(true); return; } selectEdge?.(id); }}
    >
```

Due gesture, non una:

1. **doppio click** sulla label → `setEditing(true)` incondizionato;
2. **click singolo su edge gia' selezionato** → `setEditing(true)` (il primo click seleziona,
   il secondo entra in edit).

Terza via, non applicabile agli edge IR: `autoEdit` (`UnifiedEdge.tsx:125-132`) apre l'editor
alla creazione. L'unico produttore su edge e' `EditorV2.tsx:1601`, cioe' la creazione di una
**reference M2** (`type: 'reference'`), che non e' mai un edge IR — vedi D4.

Stato che governa l'affordance: `const [editing, setEditing] = useState(false)`
(`UnifiedEdge.tsx:114`) e `labelText` (`:115`, ri-sincronizzato da `props.label` quando non si
sta editando, `:118-122`). Il render dell'input e' il ramo `editing ?` di
`UnifiedEdge.tsx:764-776`, classe CSS `edge-label__input`.

### D2 — Dove finisce oggi la modifica

Handler di commit: `commitLabel` (`UnifiedEdge.tsx:308-328`), invocato da `onBlur` (`:770`) e
da `Enter` (`onKeyDown`, `:330-340`). Fa due cose:

1. **`:312-324`** — `setEdges(...)` di React Flow: aggiorna in modo ottimistico `e.label` e
   `e.data.reference.name`;
2. **`:327`** — `syncEdgeRefProperty(id, 'name', labelText)`, unica via verso JjOM.

`syncEdgeRefProperty` (`canvasToJjom.ts:798-844`) risolve l'edge con
`LPointerTargetable.fromPointer(edgeId)` e scrive su `edgeProxy.model`.

**Due esiti distinti, entrambi confermano H1.**

**(a) Object-as-edge sintetico — scrittura morta accertata.**
L'edge sintetico ha id `irobj_${objectId}` (`irEdgeViews.ts:205`), che **non e' un pointer
JjOM**: non esiste in `idlookup`. La catena e' deterministica:
`fromPointer` (`classes.ts:2455`) → `LPointerTargetable.wrap` (`classes.ts:257`) →
`DPointerTargetable.from(data, state)` (`:260`) → falsy → `Log.e(canThrow=false, 'Cannot wrap:')`
→ **`return undefined`** (`:263`). Rientrando in `syncEdgeRefProperty`, `if (!edgeProxy)`
(`canvasToJjom.ts:816`) → `console.warn('edge not found')` → **`return`**. Nessuna scrittura,
nessun errore visibile all'utente. **Da qui non esiste alcun percorso verso JjOM.**

Anche il ramo ottimistico e' inefficace: gli edge sintetici non stanno nello stato base
(`EditorV2.tsx:331` `useEdgesState`) ma sono aggiunti a valle dal memo `useIRContainment`
(`useIRContainment.ts:158-165`), e il canvas e' controllato (`EditorV2.tsx:3793`
`edges={irContainment.edges}`). Al primo ricalcolo del memo `applyEdgeStyle` ri-semina
`label` dal testo compilato (`irEdgeViews.ts:41,45`), quindi il pixel modificato torna
indietro. La label mostrata **non** e' un dato dell'edge: e' il risultato di
`cv.labelText(ctx, evalId)`, cioe' della `TextSource` autorata in `edge.labels.center`.

**(b) Reference-as-edge decorata — scrittura reale ma sul bersaglio sbagliato.**
Per un edge M1 (`type` `instanceRef`/`composition`) decorato da `decorateReferenceEdges`
(`irEdgeViews.ts:114-139`), l'id **e'** un pointer JjOM (`jjomTransformers.ts:459` `id: edge.id`)
e `edgeProxy.model` e' la **DReference M2** (`jjomTransformers.ts:450` `const refModel = edge.model`).
`syncEdgeRefProperty` scrive quindi `name` sulla reference del **metamodello**. Se la view IR
autora `labels.center`, la label a schermo non viene da li' e torna al valore compilato al primo
ricalcolo: l'utente rinomina silenziosamente una EReference M2 e vede la label tornare com'era.
Questo caso e' **peggiore** della scrittura morta, non migliore.

Conclusione D2: la modifica **non sopravvive al re-render** in nessuno dei due casi; nel caso (b)
lascia in piu' un effetto collaterale non richiesto sul metamodello.

### D3 — L'affordance e' condivisa?

**Consumatori del componente** (`EditorV2.tsx:124-129`): `reference`, `inheritance`,
`composition`, `instanceRef` — tutti mappati su `UnifiedEdge`. Piu' `ReproHarness.tsx:9`
(`{ reference: UnifiedEdge }`, banco di prova isolato) e `edges/ManhattanEdge-toDelete.tsx:255`,
che contiene una copia dell'input ma e' un file `-toDelete` **non registrato in nessun
`edgeTypes`** (nessun import: verificato con grep globale).

Quindi si': l'affordance e' condivisa fra edge M2 (`reference`), inheritance (esclusa dal ramo
`!isInheritance`) e edge M1 (`composition`/`instanceRef`), IR e non-IR. **Ma e' separabile**,
perche' il discriminante e' gia' calcolato nello stesso scope — vedi D4.

**Label dei vertici: superficie completamente diversa, nessuna condivisione.**
L'editabilita' del nome di un vertice e' compilata in `editsName` (`irCompile.ts:308-311`,
che legge `LabelSpec.editable`, `irTypes.ts:80-81`) e consumata da `IRNodeContent.tsx`
(righe di compartimento `:257`, `:275-276`, classe `ir-row__value--editable`, cursore
`cursor: text` in `irStyle.ts:101`). Nessun import incrociato con `UnifiedEdge`. Toccare il
gate degli edge non puo' raggiungerle.

### D4 — Il gate `data.irEdgeViewId` e' disponibile nel punto giusto?

**Si', gia' calcolato 650 righe sopra il sito da modificare**, nello stesso componente:

`UnifiedEdge.tsx:97-98`
```tsx
const irData = (data ?? {}) as Record<string, any>;
const isIREdge = !!irData.irEdgeViewId;
```

`isIREdge` e' gia' il gate che pilota marker IR (`:514`, `:520`), stile inline del path (`:527`),
visibilita' della label (`:559`) e colore del testo (`:775`). Il div della label (`:754`) e'
nello stesso scope: **nessun prop drilling, nessun campo nuovo, nessun accesso a contesto.**

Chi scrive `irEdgeViewId`: **solo** `applyEdgeStyle` (`irEdgeViews.ts:55`), su due percorsi —
`decorateReferenceEdges` (che filtra `e.type !== 'instanceRef' && e.type !== 'composition'` a
`irEdgeViews.ts:124`) e `synthesizeObjectAsEdges` (`:217`, edge `type: 'instanceRef'`).
**Corollario che vincola il blast radius**: un edge M2 `type: 'reference'` non puo' mai avere
`irEdgeViewId`, quindi il gate **non puo' toccare la rinomina delle reference nel class diagram
M2** — cioe' l'unico percorso di edit label che oggi funziona davvero end-to-end.

---

## 5. Verdetto rispetto alla regola di procedura del prompt

Le quattro risposte sono chiare, l'affordance e' separabile e il gate e' disponibile in loco.
**Si procede con l'edit**, hard stop sul diff. La condizione di STOP (affordance non separabile
o gate assente) **non** si e' verificata.

## 6. Modifica prevista (un solo file, un solo blocco)

`frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` — un derivato locale
(`labelEditable = !isIREdge`) usato in tre punti gia' esistenti: `onDoubleClick` (`:761`),
`onClick` (`:762`), ramo `editing` del render (`:764`). Nessun campo IR nuovo, nessun tocco a
`irTypes.ts` / `irCompile.ts` / `irValidate.ts`, nessun tocco a SCSS, nessuna rinomina.

Sul terzo punto (ramo di render): con le due gesture chiuse `editing` non puo' piu' diventare
`true` per un edge IR, quindi il guardia sul render e' **ridondante per costruzione**. E' tenuto
per il caso di transizione — un edge classico in edit che diventa IR a meta' editing (indicizzazione
di una edge view mentre l'input e' aperto): il componente e' lo stesso, l'input resterebbe montato
e il `blur` committerebbe. Costo: un'espressione booleana.

## 7. Codice che resta senza consumer (P3 / regola 9 — NON rimosso)

Per gli edge IR restano vivi ma non piu' raggiungibili dalla UI:

- `commitLabel` (`:308-328`) e `onKeyDown` (`:330-340`) — continuano a servire le edge classiche,
  quindi non sono morti in assoluto: sono morti **solo sul ramo IR**. Nessuna azione.
- `syncEdgeRefProperty` (`canvasToJjom.ts:798`) — invariata, ha altri chiamanti.
- Lo stato `editing` resta necessario (edge classiche).

**Nulla e' rimosso.** Il materiale che E-lab dovra' riusare (le due gesture, `commitLabel`, il
ramo di render dell'input) resta interamente in piedi: E-lab sostituira' il gate `!isIREdge` con
il flag di editabilita' autorato e dovra' rimpiazzare `syncEdgeRefProperty` con una scrittura
verso lo slot risolto.

## 8. Dipendenze e rischi

| # | Rischio | Valutazione |
|---|---------|-------------|
| R1 | Regressione sulla rinomina delle reference M2 | **Escluso per costruzione**: `irEdgeViewId` non e' mai posato su `type: 'reference'` (`irEdgeViews.ts:124`, `:217`). |
| R2 | Regressione su edge M1 classiche (viewpoint senza edge view) | **Escluso**: senza una edge view risolta `applyEdgeStyle` non viene chiamato, `irEdgeViewId` e' assente, `isIREdge === false`, il ramo e' byte-identico a oggi. |
| R3 | Il gate cattura anche edge M1 decorate **senza** `labels.center` autorata | **Reale e voluto.** Vedi Q1 in sez. 9: su queste la scrittura oggi arriva a JjOM (rinomina la DReference M2), quindi il fix toglie un comportamento non morto. Il prompt prescrive esplicitamente il gate su `data.irEdgeViewId`, non su `irLabelText`: la lettera del prompt prevale. |
| R4 | `cursor: pointer` residuo su `.edge-label__text` (`EditorV2.scss:2185`) | **Accettato, nessun edit SCSS.** Non e' un cursore di testo (l'unico `cursor: text` del sistema IR e' su `ir-row__value--editable`, `irStyle.ts:101`, superficie vertici). Il click sulla label continua a **selezionare** l'edge (`selectEdge?.(id)`), quindi il cursore a mano resta veritiero. L'`&:hover { border-color }` di `:2187-2189` e' inerte (`border: none` a `:2159`). |
| R5 | Perdita della selezione via click sulla label | **Da evitare nell'edit**: sul ramo IR il click deve continuare a chiamare `selectEdge?.(id)`, non solo saltare l'edit. L'anchor/reconnect degli edge IR passa dalla selezione. |
| R6 | Critical zone | **Non toccata.** `canvasToJjom.ts` letto in sola lettura; nessuno dei file di `CLAUDE.md` §3.1 e' modificato. Layer Impact Report non richiesto. |
| R7 | Copertura dei test | `viewpoint/ir/__tests__/ir.test.ts` copre `applyEdgeStyle` e la sintesi, **non** il rendering di `UnifiedEdge` (componente non montabile in node: import chain `canvasToJjom` → `joiner`). La verifica del gate resta a lettura del JSX + verifica visiva di Alfonso. |

## 9. Domande aperte

- **Q1 — la granularita' del gate.** `irEdgeViewId` marca *ogni* edge IR-stilato, incluse le
  reference-as-edge decorate con solo `line`/`terminations` e **nessuna** `labels.center`. Su
  quelle la label mostrata e' ancora il nome della reference M2 e l'edit **raggiunge** il modello
  (rinomina la DReference). Un gate piu' stretto sarebbe `irLabelText !== undefined`
  (`irEdgeViews.ts:63`), che toglierebbe l'affordance solo dove la label e' davvero prodotta
  dall'IR. Il prompt prescrive `data.irEdgeViewId` e cosi' e' stato implementato; la scelta e'
  riaperta da E-lab quando il flag di editabilita' rendera' il punto esplicito.
- **Q2 — dove scrivera' E-lab.** Per l'object-as-edge lo slot corretto non e' deducibile dalla
  label: `edge.labels.center` e' una `TextSource` arbitraria (puo' navigare, es.
  `$source.value.$name.value`). Serve una nozione di *label scrivibile* — probabilmente
  restringere l'editabilita' alle `TextSource` a un solo salto sullo self, come gia' fa
  `editsName` per i vertici (`irCompile.ts:308-311`). Materia della discovery E-lab.
- **Q3 — il caso (b) resta un bug aperto.** Anche dopo questo fix, su un edge M1 **non**-IR il
  doppio click sulla label rinomina la DReference M2 condivisa da tutte le istanze. Fuori scope
  per prescrizione del prompt («le edge classiche non-IR restano esattamente com'erano»), ma
  registrato qui perche' e' lo stesso `commitLabel`.
- **Q4 — `ManhattanEdge-toDelete.tsx`** contiene una seconda copia dell'input di label
  (`:255`) e non e' registrato in nessun `edgeTypes`. Non toccato (P3), segnalato come debito.
