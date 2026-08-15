# Discovery: anteprima realistica nella modale Symbol (cablaggio della misura D8)

**Data**: 2026-08-15
**Autore**: sessione Cowork su `/Users/alfonso/jjodel` via bridge
**Branch**: `alfonso-frontend-jjtl`, HEAD `f20429fa2` (chiusura sessione D18), working tree pulito
salvo i due untracked deliberati (`.claude/settings.local.json`, `_to_delete/`)
**Prompt**: `docs/prompts/claude_2026-08-15_2230_prompt_anteprima_realistica_d8.md`
**Natura**: discovery read-only, Fase 1. Le sezioni sono marcate `[letto]` o `[inferito]`.
Nessuna misura a runtime: l'app non e' stata eseguita in questa fase.

---

## 1. Obiettivo e ipotesi

La striscia di anteprima della modale Symbol deve mostrare il box che la taglia da contenuto (D8)
produce per la view corrente, con caption `W × H px`, e dichiarare la taglia manuale quando
`isResized` vince. La discovery doveva stabilire da dove leggere quel box (la modale sta fuori dal
provider ReactFlow), cosa mostrare senza nodo sul canvas, come rendere la forma a proporzioni
libere, e con che ritmo aggiornare.

**Ipotesi falsificata**: "per l'anteprima serve ricomputare il box nella modale riusando il
primitivo di misura di `useContentSize`". Falsificata due volte: il primitivo e' privato del modulo
(riusarlo pulito richiederebbe un ritocco al motore, che il prompt dichiara hard stop), e un
ricomputo sull'ink della modale non coincide per costruzione con l'ink del nodo reale, quindi
fallirebbe il criterio di accettazione (a) (caption coerente col nodo sul canvas). La strada che
regge e' leggere il box del nodo reale dal DOM del canvas, che resta montato sotto la modale.

Esito in una riga: **il box derivato vive gia' sul wrapper `.react-flow__node` come stile inline;
la modale puo' risolverlo via `data-viewid` senza toccare il motore, con ResizeObserver per il
live update e fallback dichiarato quando il nodo non c'e'.**

---

## 2. File letti (path completi)

- `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts` (integrale, 141 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/shapeRegistry.ts` (integrale, 459 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (integrale, 375 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` (integrale, 276 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.scss` (integrale, 427 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolPreview.tsx` (integrale, 93 righe)
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (:1-80, `manualSizeOf`)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (grep mirato :36-77, :388-424)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (grep :57, :132, :149)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (grep `VertexViewIR`, :157-167)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (grep :18, :25, :69, :82-83)
- `frontend/src/components/editor-v2/EditorV2.tsx` (grep `useReactFlow`, :573)
- `frontend/src/components/abstract/DockManager.tsx` (:100-135)
- `frontend/src/App.tsx` (grep, :145, :179)
- `frontend/src/events/registry.ts` (grep, :66)
- `frontend/package.json` (`@xyflow/react`), `node_modules/@xyflow/react/dist/esm/index.js` (grep),
  `node_modules/rc-dock/dist/rc-dock.css` (:123-134, :214-217)
- Docs: `docs/PROTOCOL.md`; `docs/claude-code-log.md` (entry recenti, newest-first);
  `docs/decisions.md` (testa); `docs/sessioni/claude_sessione_2026-08-15_6.md`;
  `docs/ratifiche/claude_2026-08-15_memo_ratifica_symbol_due_superfici_stencil.md`;
  `docs/ratifiche/claude_2026-08-15_memo_contratto_contentrect_nel_registry.md`;
  `docs/discovery/discovery_2026-08-15_cablaggio_taglia_da_contenuto.md`;
  `docs/discovery/discovery_2026-08-15_d18_catalogo_sezioni.md`;
  `docs/redesign/claude_2026-08-15_mockup_catalogo_stencil_nuova_forma.html` (:79-82, :196-209)

---

## 3. Q1: dove vive il box derivato a runtime `[letto]`

### 3.1 Il produttore

`useContentDrivenSize` (`useContentSize.ts:88-141`) e' chiamato da `IRNodeContent.tsx:76-77` con
un ref sul content box. Scrive la taglia sul nodo RF con
`setNodes(... { ...n, width: size.w, height: size.h, measured: undefined })`
(`useContentSize.ts:137-139`). L'hook usa `useReactFlow()` (`:93`), quindi vive dentro il provider.
La taglia non raggiunge mai il D-layer (commento `:74-86`): e' stato di sessione del canvas.

Con `@xyflow/react` 12 (`package.json`: `^12.10.0`) un `node.width` esplicito e' applicato come
stile inline sul wrapper DOM del nodo: verificato nel dist installato,
`width: node.width ?? node.style?.width` (`node_modules/@xyflow/react/dist/esm/index.js`), e il
wrapper porta `data-id` (grep positivo sullo stesso file). Il precedente d'uso e' `manualSizeOf`
(`jjomTransformers.ts:50-56`), che emette esattamente questi campi e i nodi ridimensionati rendono
alla loro taglia: il canale funziona in produzione.

### 3.2 Il consumatore e' fuori dal provider

`SymbolEditorModal` e' montata alla radice: `App.tsx:179` (`<Try><SymbolEditorModal/></Try>`),
fuori da ogni `EditorV2` (route `App.tsx:145`, tab `EditorSwitch.tsx:116,134`). Niente
`useReactFlow` ne' store RF: le due strade sono il DOM del canvas o il ricomputo.

### 3.3 Strada A: leggere il nodo reale dal DOM

Il ramo IR di `ObjectNode` marca il wrapper interno con la view:
`className={... ir-view-${irResolution.compiled.viewId} ...}` e
`data-viewid={irResolution.compiled.viewId}` (`ObjectNode.tsx:394-395`), dove `compiled.viewId` e'
il `viewId` passato a `compileView` (`irCompile.ts:236,322`), lo stesso id che la modale riceve da
`SymbolCard.tsx:67`. La risoluzione e':

1. `document.querySelector('.mm-node[data-viewid="<viewId>"]')`, filtrato sul pane attivo;
2. `closest('.react-flow__node')` per il wrapper RF: `offsetWidth`/`offsetHeight` sono il box,
   `data-id` e' il `vertexId` rappresentativo (serve per Q3).

`offsetWidth`/`offsetHeight` e non client rect, per la stessa ragione misurata dal motore: il
viewport RF porta `scale()` e un client rect seguirebbe lo zoom, mentre le metriche di layout no
(`useContentSize.ts:44-48`, misura nella discovery del cablaggio §7).

Il filtro sul pane attivo e' necessario: rc-dock tiene i pane inattivi MONTATI e impaginati
off-screen in un contenitore clippato (commento operativo in `DockManager.tsx:115-118`), quindi una
query nuda puo' pescare un nodo di un tab non visibile, con metriche reali ma stantie. Il
discriminatore esiste: il pane attivo porta `.dock-tabpane-active`
(`node_modules/rc-dock/dist/rc-dock.css:130`, la regola inattiva e' `:not(.dock-tabpane-active)`).
Guardia proposta: accettare un match solo se `closest('.dock-tabpane')` e' assente o attivo.

Costi e rischi della strada A: accoppiamento a tre selettori esterni (`.react-flow__node` e
`data-id` di React Flow, `.dock-tabpane-active` di rc-dock) piu' uno nostro (`data-viewid`);
elezione di un rappresentante quando piu' istanze condividono la view (proposta: primo match nel
pane attivo); l'elemento puo' sparire o essere sostituito (mitigazione: ri-risoluzione a ogni
render della modale, che gia' segue l'ir via `useSelector`, `SymbolEditorModal.tsx:137-138`).

### 3.4 Strada B: ricomputare nella modale

`boxFromIntrinsic` e' esportata e pura (`shapeRegistry.ts:445-459`), quindi la matematica e'
disponibile. Ma il primitivo DOM che la alimenta, `measureIntrinsic`, e' privato del modulo
(`useContentSize.ts:50-71`, `function` senza export): riusarlo pulito richiede un export, cioe' un
ritocco a `useContentSize.ts`, che il prompt dichiara hard stop e non diff; duplicarlo crea il
rischio di divergenza che il checkpoint documenta (lettura del chrome, offsetWidth vs client rect,
rimisura a font pronti, `useContentSize.ts:104-110`).

E c'e' un difetto piu' strutturale: l'ink della modale non e' l'ink del nodo. La label
dell'anteprima e' `ir.label` o `view.name` (`SymbolEditorModal.tsx:157`), mentre il nodo reale
valuta accessor per istanza (`IRNodeContent.tsx:267-269`) e puo' includere compartimenti e badge.
Un box ricomputato su ink diversi produce numeri diversi da quelli del canvas, e il criterio (a)
del prompt (caption coerente col nodo sul canvas) fallirebbe per costruzione. In piu' ogni
ricomputo forza un reflow sincrono nel contesto della modale.

### 3.5 Proposta

**Strada A.** Zero tocchi al motore, coerenza col canvas garantita per costruzione (si legge il box
che il motore ha davvero scritto), fallback naturale sul caso senza nodo (Q2). La strada B resta
documentata come non percorribile senza hard stop sul motore.

---

## 4. Q2: il caso "nessun nodo sul canvas" `[letto]`

Il caso esiste ed e' triplice: metaclasse senza istanze renderizzate; view aperta da un tab dove il
canvas della sua metaclasse non e' quello attivo; canvas non montato. In tutti, la risoluzione di
§3.3 non trova un match nel pane attivo.

Fallback proposto (dichiarato, nessun numero inventato): la striscia mostra il glifo simbolico
attuale (`SymbolPreview` a 168px, com'e' oggi in `SymbolEditorModal.tsx:232`) e la caption dichiara
lo stato, ad esempio `symbolic preview · no node on canvas`. Niente `W × H`: un numero senza nodo
sarebbe un ricomputo mascherato (§3.4). Il testo esatto e' tra le domande aperte.

Le forme condizionali restano com'e' oggi: `currentAxesPreset` risponde `null`
(`SymbolEditorModal.tsx:80-81`) e il messaggio `Conditional form: no static preview`
(`:238-240`) non si tocca.

---

## 5. Q3: il caso `isResized` `[letto]`

Lettura: il `vertexId` rappresentativo arriva dal `data-id` del wrapper (§3.3); da li'
`s.idlookup[vertexId].isResized` via `useSelector`, la stessa lettura che il motore usa
(`useContentSize.ts:94`). I numeri della taglia manuale sono i campi D-layer `w`/`h`, col gate
esatto di `manualSizeOf` (`jjomTransformers.ts:50-56`): valgono solo se `isResized` e' alzato e
`w > 0 && h > 0`.

Precedenza: identica a quella del motore, `active = hasSizeSupplement(desc) && !isResized`
(`useContentSize.ts:96`): il manuale vince e spegne il derivato. Quindi:

- `isResized` falso: box e numeri dal DOM (derivato), caption
  `${w} × ${h} px · derived from ink (D8)`.
- `isResized` vero (e w/h validi): numeri dal D-layer (criterio (c) del prompt: "i numeri sono
  quelli del D-layer"), caption `${w} × ${h} px · manual size`.

I testi sono in inglese per il vincolo UI del prompt; la caption del mockup e' italiana
(`190 × 58 px · derivata dall'inchiostro (D8)`, mockup `:208`) e va tradotta, non copiata. Nessuna
em dash nei testi; `×` e `·` sono ammessi. Copy esatta tra le domande aperte.

Caso limite dichiarato: `isResized` vero ma `w`/`h` non validi (il gate di `manualSizeOf` risponde
`{}`). Il nodo rende in content-hug CSS; proposta: numeri dal DOM e caption `manual size` comunque
(il flag e' l'intento dell'utente). Segnalato tra le domande aperte perche' e' un caso raro con due
letture difendibili.

---

## 6. Q4: la resa a proporzioni libere `[letto]`

`SymbolPreview` ha viewBox fisso `72×48` (`SymbolPreview.tsx:18-19`) con contorni a coordinate
cablate per quel rettangolo (`contourEl`, `:30-39`) e tratti tarati per la miniatura (stroke 1.25 o
2.5, dash `4 3` e `1 3`, `:52-53`). Una prop additiva "box" dovrebbe parametrizzare ogni contorno,
i tratti e il dash, cioe' biforcare internamente ogni ramo del componente che tutte le tile usano:
il rischio di regressione al pixel su catalogo, recenti e card del rail (criterio (e)) sta tutto
li'.

Proposta: **componente nuovo** `SymbolBoxPreview` in `viewpoint/authoring/`, che prende gli assi
scalari correnti (riuso di `currentAxesPreset`), il box `{w, h}` e la label, e rende un `<svg>` con
`viewBox="0 0 w h"` scalato per stare nella striscia (solo riduzione, mai ingrandimento),
`vectorEffect="non-scaling-stroke"` per bordi a larghezza costante (precedente:
`IRNodeContent.tsx:217`), double come overdraw a due tracciati (precedenti: `SymbolPreview.tsx:65-69`
e `IRNodeContent.tsx:213-229`), marker riscalato da `getMarkerDef` (precedente:
`SymbolPreview.tsx:73-87`) e label come overlay HTML dentro il contorno, come nel mockup
(`:199-207`). `SymbolPreview` resta byte-identico, quindi tile e card del rail sono invarianti per
costruzione: i suoi consumatori oggi sono `SymbolCatalogPicker.tsx`, `SymbolCard.tsx`,
`SymbolEditorModal.tsx` (grep su tutto `src/`).

Grep di collisione sui nomi previsti (GNU grep 3.7 nella VM del bridge, nota del checkpoint (6)),
su `*.ts`, `*.tsx`, `*.scss` sotto `frontend/src/`, `node_modules` escluso:

| Nome | Occorrenze |
|------|-----------|
| `SymbolBoxPreview` | 0 |
| `useCanvasNodeBox` | 0 |
| `useViewNodeBox` | 0 |
| `RealisticPreview` | 0 |
| `preview-caption` | 0 |
| `symbol-box-preview` | 0 |

Controllo positivo, stesso comando e stessi filtri: `SymbolPreview` risponde 4 file (i tre
consumatori piu' la definizione). La pipeline di ricerca ha segnale.

---

## 7. Q5: ricomputo senza canvas `[letto]`

Con la strada A il ricomputo non serve: la risposta operativa e' §3.4. In sintesi, se mai servisse:
`boxFromIntrinsic` e' gia' esportata e pura; il primitivo di misura no, e le due opzioni sono
export (ritocco al motore, hard stop da prompt) o duplicazione (divergenza su chrome, metriche e
font-ready). Costo a regime: un reflow sincrono per ricomputo nel contesto della modale. Lo zoom
non c'entra nella modale (nessun transform), ma la divergenza dell'ink (§3.4) resta e basta da sola
a scartare la strada.

---

## 8. Q6: aggiornamento live `[letto]`

La catena degli edit e': pannello ospitato → debounce `COMMIT_DEBOUNCE_MS = 300`
(`VertexAuthoringPanel.tsx:57`) → `set_ir` → Redux. Da li' due rami concorrenti: la modale
ri-renderizza (gia' oggi, `useSelector` su `ir`, `SymbolEditorModal.tsx:137-138`) e il canvas
ri-renderizza, il `useLayoutEffect` senza deps del motore rimisura (`useContentSize.ts:113-140`) e
`setNodes` aggiorna lo stile inline del wrapper.

Ritmo proposto per la striscia: **ResizeObserver sul wrapper risolto**, piu' ri-risoluzione
dell'elemento a ogni render della modale (la query e' O(nodi) e la modale renderizza solo al cambio
dell'ir, gia' a valle del debounce). Proprieta':

- niente lavoro per keystroke: i tasti restano nello stato locale del pannello fino al commit
  debounced, quindi la striscia si muove al piu' ogni 300 ms;
- il callback del ResizeObserver corre dopo il layout: la lettura di `offsetWidth` li' non forza
  reflow;
- l'observer spara solo su un cambio reale di taglia, che e' esattamente l'evento da seguire,
  qualunque ne sia la causa (edit della label, cambio forma, resize manuale, reset size);
- la label testuale dell'anteprima segue gia' il re-render su `ir`, come oggi.

Nessun canale nuovo, nessun evento custom, nessun polling.

---

## 9. Perimetro atteso di Fase 2 (da confermare al go-ahead)

- `SymbolEditorModal.tsx`: cablaggio della striscia (risoluzione DOM + ResizeObserver + lettura
  `isResized`/`w`/`h`), caption nei due stati, fallback senza nodo; il ramo condizionale invariato.
- `SymbolEditorModal.scss`: stile della caption (mockup `:81`: 10px, angolo basso destro, mono) e
  dello stage; `height: 132px` della striscia e `min(760px, 90vh)` × 1040 della modale INVARIATI
  (`SymbolEditorModal.scss:17-30, :315-325`): un box grande si scala, non allarga.
- Nuovo `SymbolBoxPreview.tsx` in `viewpoint/authoring/`.
- Helper puri (scala-per-stare, formato caption) con test; sede naturale accanto al componente.
- Nessun file del motore (`useContentSize.ts`, `shapeRegistry.ts`), nessun file di §3.2.

`viewpoint/authoring/` e' in critical zone (§3.1): il Layer Impact Report va in chat prima del
diff di Fase 2, anche se nessun file di §3.2 e' toccato.

---

## 10. Dipendenze e rischi

1. **Accoppiamento a selettori esterni** (`.react-flow__node`, `data-id`, `.dock-tabpane-active`):
   un upgrade di React Flow o rc-dock puo' romperli in silenzio. Mitigazione: risoluzione in una
   funzione sola, fallback simbolico (§4) quando la risoluzione fallisce; il degrado e' onesto, mai
   un numero sbagliato.
2. **Rappresentante tra piu' istanze**: numeri diversi per istanze con ink diverso; il primo match
   nel pane attivo e' una scelta, non una verita'. Da ratificare (domanda aperta 1).
3. **Pane inattivi montati**: senza il filtro `.dock-tabpane-active` la query pesca nodi stantii di
   tab nascosti. Il filtro e' parte del design, non un'ottimizzazione.
4. **`measured: undefined` transiente** (`useContentSize.ts:138`): tra il `setNodes` e
   l'applicazione dello stile puo' esserci un frame incoerente; il ResizeObserver riallinea al
   frame successivo. Nessun jank atteso, da confermare allo smoke visivo (criterio (b)).
5. **Smoke visivo**: i criteri (a)-(f) del prompt richiedono una view geometrica con nodo sul
   canvas, un caso con resize manuale, una forma condizionale, e il confronto al pixel su catalogo,
   tile, recenti e card del rail.

---

## 11. Domande aperte per Alfonso

1. **Rappresentante**: con piu' istanze della stessa view sul canvas, va bene "primo match nel pane
   attivo" (ordine DOM), o preferisci un criterio diverso (es. il nodo selezionato se appartiene
   alla view)?
2. **Copy delle caption** (inglese, senza em dash): proposte
   `${w} × ${h} px · derived from ink (D8)` e `${w} × ${h} px · manual size`. In alternativa
   `derived from content (D8)`. Quale?
3. **Copy del fallback senza nodo**: proposta `symbolic preview · no node on canvas` sotto il
   glifo attuale a 168px. Confermi glifo + caption, o solo testo?
4. **Caso limite** `isResized` vero con `w`/`h` non validi nel D-layer: caption `manual size` con
   numeri dal DOM (proposta), o trattarlo come derivato?
5. **Sede della risoluzione DOM**: hook dedicato (`useCanvasNodeBox`, nome libero da collisioni) in
   file proprio accanto alla modale, o funzione interna a `SymbolEditorModal.tsx`? Il file proprio
   tiene la modale leggibile e i selettori esterni in un posto solo.
