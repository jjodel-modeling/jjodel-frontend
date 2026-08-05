# Discovery 2026-08-04 — Tab map delle view IR-authored: triage dell'autorità

**Tipo**: discovery read-only, HEAD `c43a296a3` (branch `alfonso-frontend-jjtl`). Nessun file sorgente
toccato. Aggiorna e sostituisce `2026-07-24_prompt_discovery_tab_map_ir_authored.md`, mai eseguito.

**Obiettivo**: per ciascuno dei sette tab oggi visibili sul pannello Properties di una view, stabilire
*chi è la sorgente di verità* del dato che scrive e *se qualcuno lo legge* a render-time, così che la
riduzione della barra a **Applies to · Shape · Content** (ratificata 2026-08-03) sia una sottrazione
misurata e non una scommessa.

**Ipotesi che questa discovery sta falsificando**

1. *«Il rischio principale è la doppia autorità sullo stesso pixel fra tab Style e interprete IR.»*
   → **Falsificata nella forma prevista.** Oggi il tab Style in modalità locale (default) non dipinge
   nulla: il suo selettore non esiste nel DOM di editor-v2. La doppia autorità esiste solo dietro il
   toggle `cssIsGlobal`, e passa dal testo CSS annidato, non dai nomi delle palette (§2.4, misurato
   in §2.5 il 2026-08-05).
2. *«Il sub-tab Basic/Advanced di `VertexAuthoringPanel` è scollegato dal mode globale.»*
   → **Falsificata.** È già cablato su Redux `state.advanced` (§3.2). La domanda sospesa è cambiata:
   non "come unificarlo" ma "perché Row ed Edge non lo hanno".
3. *«I tab morti sono morti perché la view è IR-authored.»*
   → **Falsificata.** Sono morti per **tutte** le view: il canvas classico è spento (Fase 5a) e il
   resolver classico non è mai invocato (§1.0). Questo rende la sottrazione molto più sicura di quanto
   il perimetro "solo IR-authored" lasciasse sperare.

---

## File letti (path completi)

Pannello e tab:
- `frontend/src/components/editors/views/ViewData.tsx` (intero, 249 righe)
- `frontend/src/components/editors/views/data/InfoData.tsx` (intero, 375)
- `frontend/src/components/editors/views/data/TemplateData.tsx` (intero, 72)
- `frontend/src/components/editors/views/data/PaletteData.tsx` (:80-95, :215-330, :353-440, :760-870)
- `frontend/src/components/editors/views/data/CustomData.tsx` (intero, 166)
- `frontend/src/components/editors/views/data/GenericNodeData.tsx` (intero, 79)
- `frontend/src/components/editors/views/data/NodeData.tsx` (intero, 158)
- `frontend/src/components/editors/views/data/FieldData.tsx` (intero, 72)
- `frontend/src/components/editors/views/data/GraphData.tsx` (intero, 118)
- `frontend/src/components/editors/views/data/EdgeData.tsx` (intero, 71)
- `frontend/src/components/editors/views/data/EdgePointData.tsx` (intero, 70)
- `frontend/src/components/editors/views/data/ComponentsTab.tsx` (intero, 40)
- `frontend/src/components/editors/views/nestedView.scss` (:3582-3640)
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (:245-260, :455-490)

Authoring IR:
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (:30-170, :180-356)
- `frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx` (intero, 167)
- `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` (intero, 149)
- `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx` (grep struttura)
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` (grep struttura)

Interprete e rendering:
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (intero, 363)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` (:1-25)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (intero, 152)
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` (:1-40, :118-145)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (grep style inline)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (:371-450)
- `frontend/src/components/editor-v2/nodes/ClassNode.tsx` (:410-455)
- `frontend/src/components/editor-v2/nodes/nodeSizing.ts` (intero, 37)
- `frontend/src/components/editor-v2/EditorV2.tsx` (:3913, :3960-3990)

D/L layer e persistenza:
- `frontend/src/view/viewElement/view.tsx` (:740-900, :1420-1640, :1750-1775)
- `frontend/src/joiner/classes.ts` (:1085-1240 `Constructors.DViewElement`)
- `frontend/src/redux/VersionFixer.tsx` (:1000-1045)
- `frontend/src/pages/components/Dashboard.tsx` (:590-620)
- `frontend/src/common/UX.tsx` (:139-200)
- `frontend/src/common/graphComponentRegistry.ts` (intero)
- `frontend/src/utils/edgeExpressionEval.ts` (:1-30)
- `frontend/src/utils/defaultViewTemplate.ts` (:15-45)
- `frontend/src/redux/selectors/selectors.ts` (:609 `getAppliedViewsNew`, per verificare i chiamanti)
- `frontend/src/hooks/useInterfaceMode.ts`, `frontend/src/pages/components/BottomBar.tsx` (:52-72)

---

## §0 Censimento: confermato, con tre correzioni

L'array `tabs: TabDescriptor[]` parte a `ViewData.tsx:65` e **chiude a `:142`**: non ci sono altri tab
oltre i sette elencati nel prompt. Il gate `showIRTab` è a `:61` e il route del corpo IR a `:89-102`,
esattamente come descritto. La tabella del prompt è **vera al `c43a296a3`**.

Tre correzioni / precisazioni:

**C1 — Il ramo "kind ignoto" è irraggiungibile.** Il route (`ViewData.tsx:95-101`) prevede un
placeholder «authoring non ancora disponibile» per una view con `ir` presente ma di kind diverso da
vertex/row/edge. Ma `showIRTab` (`:61`) ammette il tab solo per kind ∈ {vertex, row, edge} oppure per
`!ir`. Quel ramo non può quindi mai renderizzare: è codice morto dentro un tab vivo.

**C2 — `ir.kind === 'graphVertex'` non ha alcuna superficie di authoring.** Il resolver lo accetta
(`irResolveCore.ts:167`: `if (ir.kind !== 'vertex' && ir.kind !== 'graphVertex') continue`) e lo compila
come una vertex view a tutti gli effetti. Ma `showIRTab` non lo elenca → **nessun tab IR**, e nemmeno
l'`EnableIRPanel` (che richiede `!ir`). Una view di quel kind renderizza sul canvas e non è editabile da
nessuna parte. Non ho trovato produttori di `kind: 'graphVertex'` nel codice attuale, quindi oggi è un
buco teorico; diventa reale al primo che ne scrive uno.

**C3 — Il tab Events è già marcato inerte.** `CustomData.tsx:29-34` porta la notice persistente
introdotta da `b32c2dbd9`. Il prompt lo dava per fatto: confermato.

---

## §1 Cosa persiste ciascun tab, e chi lo legge

### §1.0 Premessa che governa tutta la tabella: i due lettori superstiti

Prima di attribuire un consumatore a un campo, va fissato **quali pipeline di rendering esistono
ancora**. Sono due, e una terza è spenta:

| pipeline | stato | evidenza |
|---|---|---|
| **Interprete IR** (`ObjectNode.tsx:377` ramo `irResolution && !irDelegated` → `IRNodeContent`) | **viva** | `irResolveCore.ts`, `IRNodeContent.tsx:157-180` |
| **Nodi nativi editor-v2** (`ObjectNode` ramo `mm-node` a `:447`, `ClassNode`, `EnumNode`) | **viva** | `ObjectNode.tsx:447` |
| **Canvas classico** (`GraphElementComponent` + `jsxString`) | **spenta** | `graphComponentRegistry.ts:4` «with classic unmounted it stays empty»; `MetamodelTab.tsx:182` «Classic shutdown (Fase 5a)»; `EditorSwitch.tsx:126` «classicSlot/editorMode wiring intentionally dropped»; `debug.tsx:11` «windoww.GraphElementComponent no longer exists» |

E il **resolver classico è codice morto**: `SelectorOutput.getAppliedViewsNew`
(`redux/selectors/selectors.ts:609`) non ha **nessun chiamante** in tutto `frontend/src` (grep globale:
solo la definizione e un commento in `irResolve.ts:7`). Tutto ciò che entrava lì —
`appliableToClasses`, `oclCondition`, `jsCondition`, `explicitApplicationPriority` — non decide più
nulla a render-time.

**Conseguenza metodologica**: il verdetto "morto" che segue non è una proprietà delle view IR-authored.
Vale per ogni view aperta in editor-v2. Le view IR-authored lo rendono solo *visibile*, perché l'IR
occupa lo spazio semantico che quei campi rivendicavano.

### §1.1 La tabella

Legenda dei consumatori: **[R]** = render-time sul canvas; **[A]** = superficie di authoring (albero,
pannelli, badge); **[P]** = solo persistenza/migrazione.

| tab | controllo | campo persistito | forma | chi lo legge |
|---|---|---|---|---|
| **apply-to** | Name | `name` | string | props-header `ViewData.tsx:180` **[A]**; `NestedView.tsx` **[A]**; seed `EnableIRPanel.tsx:91` (`vertexSeed.label`) **[A]** |
| | Is Exclusive | `isExclusiveView` | bool | `view.tsx:778` gate di `compiled_css` (**solo se il record è un `DViewPoint`**); `NestedView.tsx:106,243,263,338,364` badge **[A]** |
| | Is Edge | `isEdge` | bool | `ViewData.tsx:61` (gate del tab IR); `PaletteData.tsx:360` (mostra Edge Style); `TreeViewContent.tsx:2086` **[A]**; `defaultViewTemplate.ts:18,24,36` **[P, dentro jsxString]** |
| | Edge Source / Target | `edgeSource`, `edgeTarget` | JjEL string | **solo** `defaultViewTemplate.ts:20,21,38,39` via `windoww.evalEdgeExpression`. `evalEdgeExpression` è registrato (`ExecuteOnRead.ts:129`) e non ha altri chiamanti |
| | Edge Routing | `edgeRouting` | enum | **nessuno**. Unico sito: la migration che lo semina (`VersionFixer.tsx:706`) **[P]** |
| | Edge Label | `edgeLabel` | JjEL string | **nessuno**. Unici siti: default `classes.ts:1215` e dichiarazione `view.tsx:290,930` |
| | Priority | `explicitApplicationPriority` | number? | `NestedView.tsx:245,430` **[A]**; `ViewProperties.tsx:94-102` **[A]**. Nessun lettore di rendering |
| | Preferred appearance | `forceNodeType` | string? | `view.tsx:1590` dentro `set_appliableTo`; `ViewProperties.tsx:140` **[A]**. Nessun lettore in editor-v2 |
| | Applicable to | `appliableToClasses` | Pointer[] | `VertexAuthoringPanel.tsx:118` (pin d'identità per il PathBuilder) **[A]**; `EnableIRPanel.tsx:37` (seed di `ir.metaclasses`) **[A]**; `edgeCandidate.ts` **[A]**. **Non letto dal resolver IR** |
| | Viewpoint | `father` → derivato `viewpoint` | Pointer | `irResolveCore.ts:84,113` (`d.viewpoint !== vp` → filtro d'indice) **[R]** |
| | Parent view | `father` (**stesso campo**) | Pointer | come sopra |
| | OCL editor | `oclCondition` | OCL string | `LazyOCL.ts:85-90`; reducer di ricompilazione; badge `NestedView.tsx` **[A]**. Il consumatore finale era `getAppliedViewsNew` |
| | JS editor | `jsCondition` | JS string | `reducer.ts:968` compile; badge `NestedView.tsx:262,442` **[A]**; `PredicateEditor.tsx:28,48` **[A]**. Idem |
| **template** | JSX editor | `jsxString` | JSX string | `set_jsxString` (`view.tsx:682-684`) dispara `VIEWS_RECOMPILE_jsxString`; il reducer ricompila. **Consumatori di render**: `GraphElementComponent` (rimosso) e `ClassNode.tsx:424` `data.jsxString`, campo di `ClassNodeData` (`types.ts:125`) che **nessuno popola** (grep `jsxString:` → nessun writer in editor-v2) |
| | Constants | `constants` | JS string | `view.tsx:827` `get_constants` dentro `get_compiled_css`, ramo palette di tipo `path` — vivo solo per quella via |
| | Observed properties | `usageDeclarations` | string | reducer di ricompilazione **[P]** |
| **ir** | tutto | `ir` | oggetto IR | `irResolveCore.ts:114-189` (indice), `resolveIRView`/`resolveEdgeView`/`resolveRowView`; `IRNodeContent` **[R]** |
| **style** | Edge Style (3 campi) | `edgeStrokeColor`, `edgeStrokeWidth`, `edgeStrokeStyle` | string/number | **nessuno**. (`MegamodelView.tsx:1091` è una variabile locale omonima, non il campo) |
| | Style Variables | `palette` | Dictionary | `view.tsx:793-863` → `compiled_css` → `Dashboard.tsx:603-615` `<style id="views-css-injector-d">` **[R condizionato, §2.4]** |
| | CSS/LESS editor | `css` | CSS/LESS string | idem |
| | Local/Global toggle | `cssIsGlobal` | bool | `view.tsx:866`: sceglie il selettore fra `.{viewId}` e `body` **[R condizionato]** |
| **events** | Default Events (7) | `onDataUpdate`, `onDragStart`, `whileDragging`, `onDragEnd`, `onResizeStart`, `whileResizing`, `onResizeEnd` | JS string | nessuno (già ratificato R-1) |
| | Custom Events | `events` | Dictionary | nessuno |
| **options** → `FieldData` | Applicable to | `appliableTo` | enum | `GenericNodeData.tsx:26-34` (il proprio switch); `view.tsx:1590` `set_appliableTo` → riscrive `forceNodeType`; `NestedView.tsx:96` **[A]** |
| **options** → `NodeData` | Store Size in View | `storeSize` | bool | `view.tsx:1513,1555` dentro `updateSize`/`getSize`, il cui unico chiamante è `GraphDataElements.tsx:677` (layer classico). Nessun sito in `components/editor-v2/` (grep `set_size|updateSize|storeSize` → 0 hit) |
| | Lazy Update | `lazySizeUpdate` | bool | `U.tsx:2430` (`Measurable`, classico) |
| | Adapt Width / Height | `adaptWidth`, `adaptHeight` | bool | **specchio hardcoded**: `nodeSizing.ts:2-5` dichiara «quei flag NON sono cablati fino a editor-v2 (niente plumbing R6, decisione D4)». `NODE_SIZING_DEFAULTS` è una costante |
| | Draggable | `draggable` | bool | nessun lettore in editor-v2 |
| | Resizable | `resizable` (su `DViewElement`) | bool | **nessuno**. `ObjectNode.tsx:390` legge `(compiled.ir as VertexViewIR).resizable`, campo **omonimo ma distinto**, dentro l'IR |
| | Snap | `snap` | GraphPoint | `NodeData.tsx:98` monta `SizeInput` con `readOnly={true}` **hardcoded**: il controllo non è nemmeno editabile |
| | Default Width / Height | `defaultVSize` | GraphSize | `view.tsx:1532` dentro `get_size`, stessa catena classica di `storeSize` |
| **options** → `GraphData` | Grid x/y, snaps to, visible | `grid` | oggetto | nessun lettore in editor-v2. La griglia del canvas è `EditorV2.tsx:3830` (`dot-grid-pattern`, 24px fissi) |
| **options** → `EdgeData` / `EdgePointData` | riflessione su `__info_of__*` con `isEdge`/`isEdgePoint` | `edgeStartOffset`, `edgeEndOffset`, `bendingMode`, `edgeGapMode`, `edgeHeadSize`, … | vari | geometria degli archi classici; nessun lettore in editor-v2 |
| **components** | — | — | — | `ComponentsTab.tsx:8` renderizza la stringa letterale `'components tab todo'` |

---

## §2 Triage dell'autorità — il deliverable

Tre secchi: **morto** (nessun consumatore vivo a render-time), **ridondante** (c'è un consumatore ma
l'IR scrive lo stesso aspetto e vince), **autoritativo** (unico posto da cui il dato si scrive).
Dove il comportamento non dipende da `ir.kind`, la riga è unica; dove dipende, è spezzata.

### §2.1 Tabella del triage

| tab / controllo | vertex | row | edge | verdetto | evidenza minima |
|---|---|---|---|---|---|
| **apply-to** · Name | — | — | — | **autoritativo** | unico writer di `DViewElement.name`; letto dall'albero, dall'header e dal seed IR |
| **apply-to** · Viewpoint (`father`) | — | — | — | **autoritativo** | `irResolveCore.ts:113` filtra l'indice su `d.viewpoint !== vp`: cambiare viewpoint sposta la view fra gli indici |
| **apply-to** · Parent view (`father`) | — | — | — | **incerto** | scrive lo **stesso** campo `father` del select Viewpoint (`InfoData.tsx:306` e `:322`). Due controlli, un campo, nessuna riconciliazione visibile: o uno dei due è rotto, o la semantica "parent view" è implicita nella catena `father`. Non risolvibile per lettura (§7 Q3) |
| **apply-to** · Applicable to (`appliableToClasses`) | **autoritativo** | ridondante | ridondante | per vertex è l'**input** del pin d'identità del PathBuilder (`VertexAuthoringPanel.tsx:118-123`): senza, il PathBuilder ricade sul match per nome e può pescare la classe del metamodello sbagliato (discovery 2026-07-23 §9). Row ed Edge non lo leggono (i loro `featureInfo` usano `draft.metaclasses`, cfr. `RowAuthoringPanel.tsx:140`, `EdgeAuthoringPanel.tsx:260`, che lo citano solo come dep del memo) |
| **apply-to** · Priority | — | — | — | **ridondante** | l'IR ha `ir.priority`, letto da `compareCandidates` (`irResolveCore.ts:39`). `explicitApplicationPriority` non entra in nessun ordinamento vivo |
| **apply-to** · Is Exclusive | — | — | — | **ridondante** | l'IR ha `ir.exclusive` (`irResolveCore.ts:168`). `isExclusiveView` su una **view** è solo un badge d'albero; su un **viewpoint** gate `compiled_css`, ma i viewpoint non ricevono il tab IR |
| **apply-to** · OCL condition | — | — | — | **morto** | il solo consumatore semantico era `getAppliedViewsNew`, senza chiamanti. L'IR usa `ir.predicate` |
| **apply-to** · JS condition | — | — | — | **morto** | idem |
| **apply-to** · Preferred appearance | — | — | — | **morto** | `forceNodeType` non è letto da nessun nodo di editor-v2 |
| **apply-to** · Is Edge + Edge Source/Target/Routing/Label | — | — | — | **morto**, con un cavo di servizio | i 4 campi edge non hanno lettori di rendering (`edgeRouting` ed `edgeLabel` non ne hanno **nessuno**). Ma `isEdge` è letto da `ViewData.tsx:61` come **gate del tab IR** e da `PaletteData.tsx:360`: è morto come dato, vivo come flag di UI. Rimuoverlo dal tab senza toccare il gate è sicuro; rimuovere il **campo** rompe `showIRTab` |
| **template** · JSX editor | — | — | — | **morto** | nessuna pipeline lo valuta (§1.0). `ClassNode.tsx:424` è un ramo il cui input non viene mai popolato |
| **template** · Constants | — | — | — | **incerto** | letto da `get_compiled_css` (`view.tsx:827`) solo per le palette di tipo `path`, che a loro volta finiscono nel CSS iniettato: vive o muore insieme al verdetto §2.4 |
| **template** · Observed properties | — | — | — | **morto** | solo ricompilazione di qualcosa che non viene eseguito |
| **ir** · tutto | **autoritativo** | **autoritativo** | **autoritativo** | è l'unica sorgente letta dal resolver e dall'interprete |
| **style** · Style Variables (`palette`) | — | — | — | **morto in locale, autoritativo-per-accidente in globale** — vedi §2.4 |
| **style** · CSS/LESS editor (`css`) | — | — | — | idem §2.4 |
| **style** · Local/Global (`cssIsGlobal`) | — | — | — | **autoritativo sul rischio**: è l'interruttore che trasforma il tab da inerte a sovrascrittura globale |
| **style** · Edge Style (3 campi) | — | — | — | **morto** | zero lettori. In più è mostrato solo se `view.isEdge`, cioè dietro un flag anch'esso morto |
| **events** · tutto | — | — | — | **morto, già deciso** (R-1) | notice già in `CustomData.tsx:29-34` |
| **options** · Applicable to (`appliableTo`) | — | — | — | **morto** | governa solo quali sotto-pannelli dello stesso tab Options compaiono, più un effetto collaterale su `forceNodeType` (già morto) |
| **options** · Store Size / Default W-H (`storeSize`, `defaultVSize`) | — | — | — | **morto** | catena `updateSize`/`getSize` → unico chiamante `GraphDataElements.tsx:677`, layer classico |
| **options** · Lazy Update | — | — | — | **morto** | `U.tsx:2430`, `Measurable` classico |
| **options** · Adapt Width / Adapt Height | — | — | — | **morto** | `nodeSizing.ts:2-5` lo dichiara per iscritto: specchio temporaneo, non cablato |
| **options** · Draggable | — | — | — | **morto** | nessun lettore |
| **options** · Resizable | **ridondante e insidioso** | morto | morto | `DViewElement.resizable` e `VertexViewIR.resizable` sono **omonimi e distinti**. Il canvas legge il secondo (`ObjectNode.tsx:390`), il tab Options scrive il primo. Il tab IR (Sizing, `VertexAuthoringPanel.tsx:271-293`) scrive il secondo. Due toggle con la stessa etichetta, in due tab, di cui uno inerte |
| **options** · Snap | — | — | — | **morto e già inerte in UI** | `NodeData.tsx:98`: `readOnly={true}` hardcoded |
| **options** · Grid (3 controlli) | — | — | — | **morto** | griglia del canvas hardcoded a 24px |
| **options** · Edge / EdgePoint (riflessione) | — | — | — | **morto** | geometria archi classici |
| **components** | n/a | n/a | n/a | **morto** | stub letterale. Fuori perimetro: è `isVP`, e i viewpoint non hanno tab IR |

**Riepilogo numerico**: su 7 tab, **1 è integralmente autoritativo** (IR), **1 è misto** (Apply to: 3
controlli autoritativi o incerti su 12), **1 è condizionalmente pericoloso** (Style), **4 sono morti**
(Template, Events, Options, Components).

### §2.2 Perché "morto" qui è un verdetto forte

Il prompt chiedeva di non concludere "morto" per assenza apparente di effetto. Per ognuno dei campi
sopra il verdetto poggia su un grep del **lettore**, non su un'ispezione dello scrittore:

- `getAppliedViewsNew` → grep globale su `frontend/src`: 2 occorrenze, la definizione e un commento.
- `jsxString` come input di rendering → grep `jsxString:` in tutto `frontend/src` esclusi test/examples:
  nessun writer che popoli `ClassNodeData.jsxString`.
- `edgeRouting`, `edgeLabel`, `edgeStrokeColor/Width/Style` → grep con `--include=*.scss` incluso:
  nessun lettore, in nessun linguaggio.
- `storeSize`/`defaultVSize` → tracciati fino a `GraphDataElements.tsx:677`, poi grep di `set_size` e
  `updateSize` dentro `components/editor-v2/`: zero occorrenze.
- `adaptWidth/adaptHeight` → il commento in `nodeSizing.ts:2-5` è una dichiarazione esplicita
  dell'autore, non una deduzione.

### §2.3 Il caso Template, per esteso (domanda diretta del prompt)

**Su una view IR-authored il JSX classico viene ancora valutato?** No. E non perché la view sia
IR-authored: **non viene valutato per nessuna view**.

La catena era: `UX.parseAndInject(jsxString, v)` (`UX.tsx:260`) compilava il template e iniettava le
props di root, fra cui `classNameAdd: [... props.viewid, ...props.viewsid]` (`UX.tsx:162`) — ed è **da
lì** che nasceva la classe `.{viewId}` sul DOM. Il consumatore di quel compilato era
`GraphElementComponent`, il cui registry è oggi permanentemente vuoto
(`graphComponentRegistry.ts:4`) e la cui classe non esiste più (`debug.tsx:11`).

Chi sceglie il ramo, e dove: la scelta non avviene più a livello di view, ma a livello di **editor**.
`EditorV2Inner` monta il canvas classico solo se riceve la prop `classicSlot`
(`EditorV2.tsx:3966,3975`), e nessun host la passa più — `MetamodelTab.tsx:182` e
`EditorSwitch.tsx:126` documentano entrambi la rimozione (Fase 5a). All'interno di editor-v2 la scelta
vertex-IR / nativo avviene in `ObjectNode.tsx:377`, su `irResolution && !irDelegated`, e nessuno dei
due rami tocca `jsxString`.

`jsxString` resta quindi **persistito e inerte**. La `set_jsxString` continua a dispatchare
`SetRootFieldAction('VIEWS_RECOMPILE_jsxString', …)` (`view.tsx:682-684`) e il reducer continua a
ricompilare: lavoro svolto per un consumatore che non c'è.

### §2.4 Il caso Style, per esteso — il finding più importante

La catena reale è: `PaletteData` scrive `css` e `palette` → `set_css`/`set_palette` alzano
`css_MUST_RECOMPILE` → il getter `get_compiled_css` (`view.tsx:777-871`) emette le variabili di palette
come custom properties **più** il testo CSS dell'utente, e infine **avvolge tutto in un selettore**:

```ts
// view.tsx:865-866
const localViewSelector = (c.data.className === 'DViewPoint') ? '.GraphContainer' : '.' + c.data.id;
s = (!c.data.cssIsGlobal ? localViewSelector : 'body') + ' {\n' + s + '\n}';
```

Il risultato viene raccolto reattivamente per **tutte** le view del progetto e iniettato in
`<style id="views-css-injector-d">` (`Dashboard.tsx:595-615`).

**Modalità locale (default: `cssIsGlobal = false`, `classes.ts:1175`) → il tab è inerte.**
Il selettore è `.{viewId}`, cioè il pointer usato come nome di classe. Nel DOM di editor-v2 quella
classe **non esiste**:
- il nodo IR emette `ir-view-{viewId}` e `data-viewid={viewId}` (`ObjectNode.tsx:394-395`), non il
  pointer nudo;
- il nodo nativo emette solo `mm-node mm-object …` (`ObjectNode.tsx:447`);
- la root dell'editor emette `editor-v2 theme-… notation-… scheme-…` (`EditorV2.tsx:3913`);
- l'unico produttore storico della classe nuda era `UX.tsx:162`, dentro il compilato jsxString (§2.3).

Per i **viewpoint** il selettore locale è `.GraphContainer`, classe montata dal canvas classico e da
`MetamodelTab`: fuori dal canvas modello di editor-v2.

Quindi: in modalità locale né il CSS dell'utente né **le variabili di palette** vengono mai definite su
un elemento del canvas. Il tab Style oggi non dipinge nulla.

**Modalità globale (`cssIsGlobal = true`) → autoritativo per accidente.**
Il selettore diventa `body`, e il testo dell'utente finisce *dentro* quel blocco. Due conseguenze,
**entrambe misurate il 2026-08-05** (§2.5): una si conferma, l'altra si ridimensiona.

1. **Il CSS dell'utente diventa una regola annidata, e vince sugli inline dell'interprete.**
   `body { .ir-node-content { … } }` è CSS Nesting valido nella sintassi rilassata (una regola annidata
   può iniziare con `.`). Il testo è arbitrario — l'editor è Monaco in `defaultLanguage='less'`
   (`PaletteData.tsx:815-820`), senza alcun filtro — quindi un `!important` **batte gli inline** che
   `IRNodeContent` applica su `.ir-node-content` (`IRNodeContent.tsx:157-180`:
   `inlineStyle.background = fill`, `inlineStyle.border = …`). **Confermato a runtime.**
   Aggravante: il `css` di default che ogni `DViewElement` riceve alla creazione
   (`classes.ts:1125-1170`) è **già scritto in forma annidata e già pieno di `!important`** — era LESS
   per il compilatore classico, oggi è CSS Nesting nativo iniettato raw.
2. **Le variabili di palette diventano globali su `body`, ma raggiungono solo una parte dei token.**
   Vale solo per i token dichiarati su `:root` o più in alto; quelli ridichiarati su un antenato **più
   vicino** al nodo sono schermati. La divisione, per i token che `.ir-node-content` consuma:

   | token | dichiarato su | una palette omonima su `body` lo sovrascrive? |
   |---|---|---|
   | `--node-bg` | `.editor-v2.theme-*` (`_themes.scss:40,186`) | **no**, schermato |
   | `--border-default` | `.editor-v2.theme-*` (`_themes.scss:19,165`) | **no**, schermato |
   | `--node-shadow`, `--node-shadow-deep` | `.editor-v2.theme-*` (`:41-42,187-188`) | **no**, schermato |
   | `--color-accent` (outline di selezione, `irStyle.ts:92-93`) | `:root` (`_colors-light.scss:75-76,118`) | **sì** |

   La versione precedente di questa sezione dava `node-bg` come esempio funzionante: **era sbagliata**.
   Il canale esiste, ma è più stretto di come era descritto.

### §2.5 Misura di §2.4 (2026-08-05, Chrome headless)

Pagina isolata che replica la catena esatta: token su `:root`, token di tema su `.editor-v2.theme-light`,
`BASE_CSS` dell'interprete, `<style id="views-css-injector-d">` costruito con la stessa concatenazione di
`view.tsx:864-866`, e un `.ir-node-content` con il paint inline di `IRNodeContent`.

```
nesting-parsed        : YES (1 nested rule)
background-computed   : rgb(9, 9, 9)      ← regola annidata !important, non l'inline rgb(50,50,50)
outline-color         : rgb(0, 255, 0)    ← palette su body, non il --color-accent di :root
var--node-bg-at-node  : rgb(255, 255, 255) ← valore del tema, NON il rgb(255,0,0) messo su body
var--node-bg-at-body  : rgb(255, 0, 0)     ← il valore esiste su body e non arriva al nodo
```

Riproducibile: `scratchpad/q1-css-authority.html` + `Google Chrome --headless --dump-dom`.

**Il tab Style *può* emettere `!important`**: sì, il campo è testo libero senza sanitizzazione, ed è
esattamente il caso peggiore ipotizzato dal prompt — misurato, non dedotto. Il canale principale è la
regola annidata, non le variabili: quelle raggiungono solo i token di `:root`, e fra quelli che l'IR
consuma solo `--color-accent`.

---

## §3 Le tre domande sospese

### §3.1 Unificazione dell'autorità sul matching

**Le superfici che scrivono oggi un criterio di applicabilità sono cinque**, in tre tab e due pannelli
diversi:

| superficie | campo scritto | letto dal resolver? |
|---|---|---|
| Apply to → Applicable to (`InfoData.tsx:287-294`) | `appliableToClasses` | **no** |
| Apply to → OCL editor (`InfoData.tsx:331`) | `oclCondition` | **no** |
| Apply to → JS editor (`InfoData.tsx:334-337`) | `jsCondition` | **no** |
| Apply to → Priority / Is Exclusive | `explicitApplicationPriority`, `isExclusiveView` | **no** |
| Options → Field → Applicable to (`FieldData.tsx:33-38`) | `appliableTo` | **no** |
| IR → Matching (`MatchingSection.tsx`, e gli equivalenti inline di Row/Edge) | `ir.metaclasses`, `ir.predicate`, `ir.priority`, `ir.exclusive` | **sì** |

**Si sovrappongono?** Semanticamente sì e completamente: `appliableToClasses` ↔ `ir.metaclasses`,
`ocl`/`jsCondition` ↔ `ir.predicate`, `explicitApplicationPriority` ↔ `ir.priority`,
`isExclusiveView` ↔ `ir.exclusive`. Tecnicamente **no**: sono coppie disgiunte di campi, e solo il lato
IR è letto. Non c'è conflitto di runtime — c'è un intero pannello che sembra decidere il matching e non
lo decide. Il codice lo sa e lo dice: `MatchingSection.tsx:33` («For IR views this replaces the classic
Apply-to tab, which the IR resolver ignores») e `:76` («per le view IR sostituiscono il tab Apply-to,
che su di esse non ha effetto»).

**Il nodo non banale**: `appliableToClasses` non è del tutto scollegato. È letto **due volte** dal lato
IR, in direzione opposta al matching:
- `EnableIRPanel.tsx:37-46` lo usa per **seminare** `ir.metaclasses` all'attivazione;
- `VertexAuthoringPanel.tsx:118-123` lo usa per **pinnare l'identità** della metaclasse target, così che
  il PathBuilder legga le feature della classe giusta quando due metamodelli dichiarano lo stesso nome.
  È la mitigazione del bug della discovery 2026-07-23 §9.

Quindi togliere il controllo "Applicable to" dalla UI senza sostituire quel pin **regredisce il
PathBuilder** su progetti con metamodelli duplicati. `ir.metaclasses` è una lista di **nomi**;
`appliableToClasses` è una lista di **pointer**. L'unificazione richiede una decisione di schema (o
l'IR passa ai pointer, o il pin si sposta su un altro campo), non solo una rimozione di UI. **Questo è
il vero contenuto della domanda sospesa.**

### §3.2 Ritiro del Basic/Advanced locale — la premessa è superata

**Il sub-tab locale non esiste più.** `VertexAuthoringPanel.tsx:56-61`:

```ts
// Disclosure mode — read-only here. The single Basic/Advanced toggle lives in the
// Properties card header (PropertiesWithTreeView), which owns the write path; this
// panel only reads the resulting global mode.
const advanced = useSelector((s: any) => !!s.advanced);
```

Il canale è Redux `state.advanced` (`store.tsx:215`, default `false`). Gli scrittori sono il
`ModeIndicator` della app bar (`BottomBar.tsx:52-58`: `SetRootFieldAction.new('advanced', …)` +
`localStorage 'jjodel.interfaceMode'` + `U.interfaceMode`), `ProfileSection.tsx:394-397` e
`LockedFeature.tsx:41`. `PropertiesWithTreeView.tsx:252` legge lo stesso selettore e a `:255-258`
documenta che il controllo vive nella Navbar.

**Cosa nasconde oggi il mode Basic in `VertexAuthoringPanel`** (l'unico che lo legge):
- `allowConditional={advanced}` su Shape form (`:236`), Fill (`:252`) e sulla lista Labels (`:302`):
  in Basic i campi restano editabili ma non si possono rendere condizionali;
- l'intera sezione **Field compartments** (`:310-320`);
- l'intera sezione **Badges** (`:323-333`);
- l'intera sezione **Matching** (`:337-350`) — cioè, in Basic, **metaclassi, predicate, priorità ed
  esclusività non sono raggiungibili da nessuna parte** per una view IR.

Il dato nascosto **round-trippa integralmente**: il commit riscrive l'intero `draft` clonato
(`:81`, `(view as any).ir = draft`), quindi ciò che è nascosto non viene perso (commenti espliciti a
`:307-309` e `:322`).

**Chi si romperebbe se sparisse in favore del mode globale**: nessuno — *è già* il mode globale. La
domanda va riformulata, e la risposta della discovery è la **divergenza**:

| pannello | legge `state.advanced`? | dove sta il Matching |
|---|---|---|
| `VertexAuthoringPanel` | **sì** (`:61`) | in `MatchingSection`, gated Advanced (`:337`) |
| `RowAuthoringPanel` | **no** (nessun `useSelector`) | inline nel pannello, **sempre visibile** (`:219-291`) |
| `EdgeAuthoringPanel` | **no** (nessun `useSelector`) | inline nel pannello, **sempre visibile** (`:398-500`) |

**Questo è un finding.** Tre pannelli dello stesso tab hanno tre politiche di disclosure diverse: uno
nasconde il matching in Basic, due lo mostrano sempre. E i due che lo mostrano sempre non usano nemmeno
`MatchingSection` — lo riscrivono inline, con motivazione documentata (`RowAuthoringPanel.tsx:48`,
`EdgeAuthoringPanel.tsx:103-104`: `MatchingSection` è tipizzata `VertexViewIR`). Qualunque tab map che
tocchi la disclosure deve decidere per tutti e tre.

### §3.3 Scioglimento di Options — elenco puntuale

`GenericNodeData` è un contenitore che monta fino a **cinque** sotto-pannelli in base a
`dview.appliableTo` (`:26-34`). Il default alla creazione è `'Any'` (`classes.ts:1099`), e `'Any'`
accende **tutti** i rami: `isField` è `true` incondizionatamente, gli altri quattro dal `case 'Any'`.
Il "sacco piatto" percepito nel dogfooding è quindi lo stato di default, non un caso limite.

**Opzioni che hanno effetto sull'aspetto e che l'authoring IR duplica:**

| opzione (Options) | duplicata da | nota |
|---|---|---|
| Resizable | `VertexAuthoringPanel` → Sizing → Resizable (`:273-278`) | **omonimia su due campi distinti** (§2.1). Il tab IR scrive quello letto |
| Adapt Width / Adapt Height | forma e sizing dell'IR (`shape.form` + `resizable` + il floor di `irStyle.ts:53`) | l'IR governa il content-hug via CSS, non via flag |
| Default Width / Default Height | dimensione esplicita del nodo, propagata da **Propagate size** (`VertexAuthoringPanel.tsx:282-291`, evento `PROPAGATE_VIEW_SIZE`) e dal `NodeResizer` | è il vero sostituto: la size vive sul nodo, non sulla view |
| Store Size in View | idem, dal lato persistenza | |
| Grid (x/y, snaps to, visible) | nulla nell'IR; il canvas ha la propria griglia fissa | non duplicata, semplicemente scollegata |
| Snap | nulla | già inerte (readOnly hardcoded) |
| Draggable | nulla | |
| Lazy Update | nulla | |
| Field / Applicable to (`appliableTo`) | `ir.metaclasses` + il route per `ir.kind` | |
| Edge / EdgePoint (geometria archi) | `EdgeAuthoringPanel` → Linea / Terminazioni / Capi (`:502-600`) | l'IR edge copre lo stesso spazio con uno schema proprio |

**Cosa sparisce e cosa migra**: **niente migra**. Nessuna delle opzioni di Options è autoritativa
(§2.1). Le tre che *sembrano* riguardare l'aspetto — Resizable, Adapt W/H, Default W/H — hanno già il
loro sostituto vivo nel tab IR. Options è l'unico dei quattro tab morti che può essere rimosso senza
alcuna compensazione funzionale.

---

## §4 Mappa di migrazione verso Applies to · Shape · Content

Solo i controlli con verdetto **autoritativo** o **incerto** hanno bisogno di una casa.

| controllo | oggi | casa proposta | criterio |
|---|---|---|---|
| Name | Apply to | **Applies to** (o header della card) | identità della view, non applicabilità né aspetto. Vedi la nota sotto |
| Viewpoint (`father`) | Apply to | **Applies to** | determina l'indice in cui la view entra: è la prima clausola del matching |
| Parent view (`father`) | Apply to | **Applies to**, se sopravvive | vedi §7 Q3: prima va chiarito se è un controllo reale |
| Applicable to (`appliableToClasses`) | Apply to | **Applies to** | è la sola superficie che pinna l'identità della metaclasse (§3.1) |
| IR → Matching: metaclassi, predicate, priorità, esclusiva | IR (Advanced, solo vertex) | **Applies to** | è la definizione operativa di "quando la view si applica" |
| IR → Shape: form, fill, border | IR | **Shape** | |
| IR → Sizing: resizable, Propagate size | IR | **Shape** | il sizing è geometria |
| IR → Labels (lista, con stile testo) | IR | **Content** | il testo è contenuto; il suo `TextStyle` viaggia col segmento |
| IR → Field compartments | IR (Advanced) | **Content** | |
| IR → Badges | IR (Advanced) | **Content** | |
| IR row → Template (segmenti, visible, label) | IR | **Content** | |
| IR row → Matching inline | IR | **Applies to** | |
| IR edge → Linea (colore, spessore, tratto), Terminazioni | IR | **Shape** | |
| IR edge → Label + centro label | IR | **Content** | |
| IR edge → Matching inline (metaclasse, reference, predicate, priorità) | IR | **Applies to** | |

### §4.1 I tre controlli che non stanno comodi in nessuno dei due

Il prompt chiedeva di segnalarli esplicitamente. Sono tre, e sono di natura diversa fra loro.

**(a) Name.** Non è applicabilità e non è aspetto: è l'identità del documento che si sta editando.
Metterlo in "Applies to" è la scelta meno peggiore, ma è una forzatura; la casa naturale è l'header
della card, accanto al badge VIEW/VIEWPOINT già presente (`ViewData.tsx:177-185`) — che però è spazio
condiviso con l'inspector metaclasse via `.props-header*` (`Info.tsx:905-913`), quindi non è gratis.

**(b) IR edge → Natura + Capi (source / target).** `EdgeAuthoringPanel.tsx:386-395` (Natura: reference
vs object) e `:502-530` (Capo sorgente / Capo destinazione, espressioni di path). Questi non descrivono
né quando la view si applica né come appare: descrivono **quale topologia l'arco realizza**. È una terza
categoria — *struttura* — che i due tab ratificati non prevedono. Forzarli in Applies to li confonde col
matching; forzarli in Shape li confonde con la linea.

**(c) L'escape hatch CSS.** Se si decide che una via di fuga CSS deve sopravvivere alla rimozione del tab
Style, non ha casa: non è una proprietà di forma né di contenuto, è un override trasversale. Oggi è
inerte in locale (§2.4), quindi la scelta di **non** dargli casa è difendibile — ma va presa
esplicitamente, perché è l'unica cosa che il tab Style offriva e che l'IR non offre.

**Nessun controllo autoritativo resta senza casa se si accettano (a) nell'header e (b) in Applies to
con un separatore proprio.** Il punto (c) è una decisione, non un problema di collocazione.

---

## §5 Reversibilità

**L'operazione di disabilitazione dell'authoring IR non esiste.** Verificato per grep su tutto
`frontend/src`: gli unici writer di `ir` sono

| sito | operazione |
|---|---|
| `EnableIRPanel.tsx:106` | `(view as any).ir = seed` — attivazione |
| `VertexAuthoringPanel.tsx:81`, `RowAuthoringPanel.tsx:73`, `EdgeAuthoringPanel.tsx:142` | `(view as any).ir = draft` — replace immutabile whole-object |
| `VersionFixer.tsx:1026` | `e.ir = { ...defaultObjectViewIR(), migratedFrom: 'classic-default' }` — migration |
| `view.tsx:1762` | carry-over di `ir` attraverso `updateDefaultView` |
| `irDemoFixture.ts:106,112` | fixture dev-only |

Nessun sito scrive `ir = undefined`, nessuno fa `delete`. Non esiste un pulsante "Disabilita IR", né in
`EnableIRPanel` (che anzi a `:68-75` si auto-blocca se un `ir` esiste già) né altrove. **L'attivazione è
a senso unico.**

Le altre due sotto-domande, di conseguenza:

- **L'oggetto `ir` viene cancellato o resta orfano?** Domanda inapplicabile: non c'è operazione che lo
  cancelli. Resta.
- **Il Template classico è ancora quello di prima?** **Sì, intatto.** `EnableIRPanel.enable()`
  (`:79-107`) scrive solo `view.ir`; non tocca `jsxString`. Il tab Template continua a mostrare e a
  salvare il JSX originale — inerte prima e inerte dopo (§2.3), ma byte-identico.

**Conclusione sulla reversibilità della tab map**: la tab map *in sé* è reversibile — è UI, e nascondere
un tab non tocca i dati. Ma poggia su una transizione (`!ir` → `ir`) che oggi **non ha inversa**. Se un
utente abilita l'IR per errore su una view, non può tornare indietro dall'interfaccia, e da quel momento
i tab che la tab map rimuove sarebbero l'unico posto dove i suoi vecchi campi restano visibili.
Attenuante forte: quei campi sono già tutti inerti (§2.1), quindi non c'è perdita funzionale — solo
perdita di *visibilità* su dati persistiti.

**Nota che allarga il perimetro**: la migration `2.225 -> 2.226` (`VersionFixer.tsx:1007-1041`) assegna
un `ir` a **ogni** default view riconosciuta, e marca `irLegacyClassic` tutte le altre. Su un progetto
migrato, quindi, la maggioranza delle view è già "IR-authored" ai fini del gate `showIRTab` — anche
quelle che renderizzano ancora per delega nativa (`isMigratedDefaultView`, `irDefaults.ts:128-145`). La
tab map non riguarda una minoranza sperimentale: riguarda quasi tutto il parco view.

---

## §6 Precedenti UI per nascondere o marcare

Esistono **tre** meccanismi già in casa, di forza crescente. Non serve inventarne un quarto.

**P1 — Tab condizionale (rimozione dalla barra).** È il pattern nativo di `ViewData.tsx` stesso:
lo spread condizionale nell'array.

```tsx
// ViewData.tsx:124-132
...(isV ? [{
    id: 'options' as TabId,
    label: 'Options',
    render: () => (<Try><GenericNodeData viewID={view.id} readonly={readOnly} /></Try>),
}] : []),
```

Il fallback di `activeTab` è già scritto per reggere la sparizione di un tab attivo
(`ViewData.tsx:149`: `tabs.find(t => t.id === activeTab) ?? tabs[0]`), quindi rimuovere condizionalmente
un tab non lascia il pannello in stato vuoto. **Questo è il meccanismo che la tab map ratificata richiede
ed è già disponibile a costo zero.**

**P2 — Tab visibile ma marcato inerte (notice persistente).** Il precedente diretto e recente è Events,
`b32c2dbd9`:

```tsx
// CustomData.tsx:29-34
{/* Inert runtime notice: covers both the default and the custom section */}
<HelpText>
    Handlers defined here are saved with the view, but the current editor does not execute them.
    Their execution channel belonged to the classic editor, which has been retired.
    Nothing written here is lost.
</HelpText>
```

Il meccanismo è `HelpText` da `components/ui`, un componente generico senza aggancio a Events:
**si generalizza a qualunque tab senza una riga di infrastruttura**. Lo stesso commit ha rimosso il
puntino di stato da `ViewProperties.tsx` (21 righe) applicando la regola complementare: un indicatore
che non può essere vero in nessuno dei suoi stati va tolto, non riformulato.

**P3 — Controllo visibile ma disabilitato.** Due varianti già in uso:
- classe `disabled` sul contenitore: `PaletteData.tsx:358`
  (`'p-3 style-tab style-tab-redesign' + (readOnly ? " disabled" : "")`);
- prop `readOnly` hardcoded sul singolo widget: `NodeData.tsx:98` (`SizeInput … readOnly={true}`), che è
  di fatto un controllo già congelato senza che nulla lo dichiari all'utente — precedente da **non**
  imitare, citato qui perché è la forma degradata dello stesso pattern;
- affordance greyed-out con default evidenziato: `Toolbar.tsx:178-182`
  («the buttons are visible but inert (greyed out, "flow" stays highlighted as the default)»).

**Quello che non esiste**: uno stato `disabled` sulla classe `.view-editor-tab`
(`nestedView.scss:3606-3628` ha solo base, `:hover` e `.active`). Se la scelta cadesse su "tab presente
ma non cliccabile", servirebbe uno stile nuovo — mentre P1 e P2 non costano nulla.

---

## §7 Rischi e domande aperte per Alfonso

**R1 — Il campo `isEdge` è morto come dato ma vivo come gate.** `ViewData.tsx:61` lo usa per decidere se
mostrare l'entry-point IR (`view.isEdge !== true`). Rimuovere il **controllo** dalla UI è sicuro;
rimuovere il **campo** rompe il gate. Da tenere presente quando il triage diventerà diff.

**R2 — Rimuovere il controllo "Applicable to" senza sostituire il pin d'identità regredisce il
PathBuilder** su progetti con metamodelli omonimi duplicati (§3.1). È l'unico punto in cui la
sottrazione ha un costo funzionale misurabile.

**R3 — Il toggle `cssIsGlobal` è oggi l'unico interruttore che rende il tab Style capace di sovrascrivere
l'IR** (§2.4, misurato in §2.5). Se il tab viene rimosso ma il campo resta, un progetto salvato con
`cssIsGlobal = true` e una regola annidata `!important` continuerà a ridipingere i nodi IR **senza alcuna
superficie da cui capirlo**. Questo è il caso peggiore concreto di doppia autorità: non due tab che
competono, ma un tab rimosso che continua a vincere. Il canale delle variabili di palette esiste ma è
stretto (solo i token di `:root`, cioè `--color-accent` fra quelli che l'IR consuma): il vettore da
sorvegliare è il testo CSS, non i nomi delle palette.

**R4 — Tre politiche di disclosure divergenti fra i tre pannelli IR** (§3.2). Con la tab map, il
Matching migra in "Applies to": la divergenza diventa visibile all'utente come un tab che cambia
contenuto a seconda del kind.

**R5 — `graphVertex` senza authoring** (C2). Oggi teorico; da chiudere prima che qualcuno lo produca.

### Domande

**Q1 — CHIUSA il 2026-08-05.** Misurata in §2.5 su pagina isolata, non sull'app: la catena riprodotta è
quella di `view.tsx:864-866` più `irStyle.ts` più il paint inline di `IRNodeContent`, che è tutto ciò che
serve — il resto dell'app non entra nel meccanismo. Esito: la regola annidata `!important` **batte**
l'inline dell'interprete; il canale delle variabili di palette funziona solo per i token di `:root`.
Il verdetto sul tab Style resta **inerte in locale, autoritativo in globale**, ora misurato.
Residuo non verificato, di rilevanza bassa: che l'iniettore di `Dashboard.tsx:613` monti effettivamente
la regola nel documento dell'editor — è un `<style>` alla radice dell'app, quindi lo dà per scontato la
stessa catena che oggi rende visibili i CSS dei viewpoint.

**Q2 — semantica di "ridondante" sui campi.** Il triage distingue rimuovere il *tab* dal rimuovere il
*campo*. Per Style e Options la mia lettura è: rimuovere i tab, **non** toccare i campi (nessuna
migration, nessun rischio sui salvati). Confermi che la Fase 2 si ferma alla UI?

**Q3 — i due select su `father`.** In "Apply to" convivono un select "Viewpoint" (`InfoData.tsx:298-312`)
e un select "Parent view" (`:314-328`) che scrivono **lo stesso campo** `father`. Il primo ha un getter
che forza `vpid`, il secondo no. Non riesco a stabilire per lettura se sia intenzionale (catena `father`
in cui il viewpoint è il parent di default) o un bug latente. È l'unico "incerto" del triage che
richiede la tua memoria di progetto, non altro grep.

**Q4 — Natura e Capi degli edge IR** (§4.1b). Sono topologia, non forma né contenuto. Vanno in "Applies
to" con un separatore, o la ratifica Applies to · Shape · Content ammette un quarto raggruppamento
locale al kind edge?

---

## Sintesi in tre righe

La barra si può ridurre a **Applies to · Shape · Content** rimuovendo quattro tab interi (Template,
Events, Options, Components) **senza perdere una sola funzione viva**: sono morti per tutte le view, non
solo per quelle IR, perché il canvas classico e il resolver classico sono spenti. Da "Apply to"
sopravvivono tre controlli (Name, Viewpoint, Applicable to) e uno è dubbio (Parent view). Il tab Style è
il solo caso delicato: inerte nel default, ma capace — dietro `cssIsGlobal` — di battere gli inline
dell'interprete IR con una regola annidata `!important`, misurato in §2.5.

> **Nota sulla ratifica successiva (2026-08-05)**: la partizione ratificata è a cinque tab
> — `Applies to · Structure · Appearance · Text · Source` — non a tre. La mappa di migrazione di §4 va
> letta con `Shape → Structure + Appearance` e `Content → Text`; i due controlli che §4.1 dava senza casa
> (Natura e Capi degli edge) la trovano in **Structure**.
