# Discovery: `ShapeForm` nell'IR e posizionamento degli handle

**Data**: 2026-08-14
**Autore**: sessione Cowork (Claude), lettura diretta del working tree
**Branch**: `alfonso-frontend-jjtl`
**Working tree alla lettura**: nessun sorgente modificato prima del task; `M docs/claude-code-log.md`
e tre path untracked (`.claude/settings.local.json`, `_to_delete/`,
`docs/discovery/discovery_2026-08-13_metaclass_picker_flat.md`).

**Obiettivo**: stabilire come l'IR rappresenta e rende la forma dei nodi, e se le
ancore degli archi possono seguire il contorno di una forma non rettangolare.

---

## 1. Il tipo e la sua superficie

`viewpoint/ir/irTypes.ts:38`

```ts
export type ShapeForm = 'rect' | 'rounded' | 'ellipse' | 'circle' | 'diamond';
```

Cinque forme, non tre. Sette riferimenti in sei file, ricerca su tutto `frontend/src`:

| File | Uso |
|------|-----|
| `ir/irTypes.ts:38,116,187,351,407` | definizione; `shape.form`; `containment.collapsed.form`; `CompiledConditional`; `collapsedForm` |
| `nodes/nodeSizing.ts:6,34` | `defaultResizableForForm` |
| `viewpoint/authoring/VertexAuthoringPanel.tsx:8,324,327` | `FORM_OPTIONS` + `ConditionalEditor<ShapeForm>` |
| `ir/IRNodeContent.tsx:62,156,179,183` | risoluzione per istanza, ramo `isDiamond`, classe CSS, layer SVG |
| `ir/irStyle.ts` | regole `.ir-shape--<form>` |
| `nodes/ObjectNode.tsx:388,389,402` | gate di resize, `keepAspectRatio` |

La superficie è piccola: il refactoring non è un lavoro di scala.

## 2. La forma è condizionale

`irTypes.ts:116` dichiara `form: Conditional<ShapeForm>`, compilata in
`CompiledConditional<ShapeForm>` (`:351`) e risolta per istanza a ogni render:
`IRNodeContent.tsx:62` → `compiled.form(readCtx, objectId)`. Esiste inoltre
`containment.collapsed.form` come override sullo stato collassato (`:187`, compilato
in `collapsedForm` `:407`). `Conditional<T>` (`:34-37`) ha tre varianti: valore nudo,
`{when, then, else}`, `{rules[], default}`.

Conseguenze:

1. Qualunque geometria derivata dal descriptor sta in un **hot path** e va memoizzata
   su `(form, params, w, h)`.
2. Le capacità della forma sono **per istanza, non per view**: un gate di authoring
   del tipo «questa forma non ospita scomparti» non è decidibile staticamente, va
   valutato sul dominio dei valori possibili del conditional.
3. Il selettore di forma vive dentro un `ConditionalEditor`, quindi può comparire più
   volte nello stesso pannello, uno per ramo.

## 3. Come le forme diventano pixel

Rendering **CSS-first con una sola eccezione SVG**. `irStyle.ts`:

```css
.ir-node-content.ir-shape--rounded { border-radius: 10px; }
.ir-node-content.ir-shape--ellipse { border-radius: 50%; min-width:0; min-height:0; }
.ir-node-content.ir-shape--circle  { border-radius: 50%; aspect-ratio: 1/1; ... }
```

`rect` non ha regola: è il box base. `diamond` sopprime il box CSS e dipinge un
`<polygon points="50,0 100,50 50,100 0,50">` dentro `.ir-diamond-svg`, con
`viewBox="0 0 100 100"`, `preserveAspectRatio="none"`, `vectorEffect="non-scaling-stroke"`.

**Costo misurato di una forma non esprimibile in CSS**, prendendo il diamante:
(1) blocco di regole in `irStyle.ts`; (2) neutralizzatore `:has()` per il floor 140×40
di `EditorV2.scss`; (3) ramo `isDiamond` in `IRNodeContent.tsx:156` che salta fill e
border inline (`:161`, `:166`); (4) mappa `DIAMOND_DASH` dedicata; (5) caso in
`defaultResizableForForm`; (6) `keepAspectRatio={shapeForm === 'circle'}` in
`ObjectNode.tsx:402`. Sei punti per una forma.

## 4. Il contenuto è HTML, il contorno no

`.ir-node-content` è un div flex con `overflow: hidden` che ospita label, compartimenti
e badge. Su rect/rounded/ellipse/circle il clipping è gratis (border-radius). Per il
diamante `overflow` torna `visible` e il contenuto è solo centrato.

Ne segue che su una forma non rettangolare il contenuto HTML non sa nulla del contorno.
Un `labelBox` calcolato dal descriptor e applicato come inset inline non è un
raffinamento estetico: è il meccanismo che rende usabili le forme non rettangolari.

## 5. Il posizionamento degli handle (la domanda che decide il resto)

**B1.** Gli `<Handle>` sono montati in un unico punto: `components/DynamicHandles.tsx:288`
(target) e `:296` (source). Pool pre-allocato: `MAX_HANDLES_PER_SIDE` per lato, quattro
lati, sempre in DOM dal mount, chiavi stabili `${side}-${index}`.

**B2 / B3.** La posizione è la combinazione di due cose:
- `position={SIDE_TO_POSITION[side]}` (`:290`, `:298`), che àncora l'handle a un lato
  del box tramite le classi di React Flow;
- uno **stile inline su un solo asse** (`:266-267`):
  ```ts
  const positionProp = side === 'left' || side === 'right' ? 'top' : 'left';   // :212
  const sourceConnectedStyle = { [positionProp]: `${sourcePercent * 100}%` };
  const targetConnectedStyle = { [positionProp]: `${targetPercent * 100}%` };
  ```
  con le percentuali prese da `computeSidePositions` (`utils/handlePosition.ts`).

Quindi: **l'handle scorre lungo il lato del bounding box; l'asse trasversale è fissato
da React Flow al bordo del box.** `DynamicHandles` riceve solo `nodeId`
(`interface DynamicHandlesProps`, `:15-17`): la forma non entra in questo calcolo in
nessun punto, né direttamente né indirettamente.

**B4.** `nodeHandles` di `portDistribution.ts` è **prodotto e consumato solo dentro il
proprio modulo** (`:218,227,242,256`) e restituito a `:265`. I due chiamanti esterni
destrutturano solo `edgeHandles`: `EditorV2.tsx:1033` e `edgeUtils.ts:1064`. Nessun
consumatore esterno. Controllo positivo sulla stessa ricerca: `edgeHandles` torna 11
righe in 3 file, exit 0. **CLAUDE.md §3.10 è confermata.**

**B5 — esiste un punto di innesto?** Sì, ed è preciso: gli oggetti
`sourceConnectedStyle` / `targetConnectedStyle` a `DynamicHandles.tsx:266-267`. Sono già
stili inline sotto il controllo del progetto; aggiungere la **seconda** proprietà d'asse
(`left`/`right` per i lati verticali, `top`/`bottom` per gli orizzontali) sposta l'handle
verso l'interno fino al contorno, senza toccare la politica di ordinamento, che è decisa
a monte da `computeSidePositions` e resta invariata.

Due condizioni, entrambe da verificare prima di scrivere il codice:
1. `DynamicHandles` deve conoscere forma e dimensioni del nodo. Oggi riceve solo
   `nodeId`, ma usa già `useStoreApi()`: il dato è raggiungibile senza cambiare la firma.
2. React Flow misura i bound degli handle al mount e sui cambi di dimensione del nodo.
   Uno spostamento a parità di dimensioni richiede quasi certamente un
   `useUpdateNodeInternals()` sul cambio di forma, altrimenti il bordo misurato resta
   quello precedente. **Non verificato.**

**B6.** Sul diamante gli archi si agganciano al **rettangolo circoscritto**, non al rombo.
Dedotto dal codice (§B2: l'asse trasversale è al bordo del box, e la forma non entra nel
calcolo), non osservato a schermo. Un commento indipendente in `irStyle.ts` afferma la
stessa cosa: «React Flow piazza gli handle sulla box `.mm-node` con il floor applicato →
gli archi mancano il bordo visibile». **Da confermare visivamente.**

**Nota.** `ir/edgeEndpoints.ts` non riguarda la geometria: decide quale elemento del
modello sia l'estremo di un edge view (`natureOf`, `isUsableEndpointExpr`).

## 6. Persistenza

L'IR è persistito come campo strutturato `e.ir` su `DViewElement`, **non** dentro
`jsxString`: `VersionFixer.tsx:1009`, migrazione `2.225 -> 2.226`, che assegna
`e.ir = { ...defaultObjectViewIR(), migratedFrom: 'classic-default' }` alle default view
classiche riconosciute per marker, saltando quelle già dotate di `ir` o marcate
`irLegacyClassic`. Ultima migrazione dichiarata: `2.226 -> 2.227` (`:1067`).

Promuovere `ShapeForm` da stringa a oggetto strutturato è quindi una riscrittura JSON
ricorsiva sulle tre varianti di `Conditional` più `containment.collapsed.form`,
idempotente per costruzione. Costo e rischio bassi.

## 7. Rischi

| Rischio | Impatto | Nota |
|---------|---------|------|
| Handle sul box rettangolare (§5) | Alto | Punto di innesto individuato; resta da verificare il re-measure di React Flow. |
| Risoluzione per istanza in hot path (§2.1) | Medio | Memoizzazione necessaria. |
| Caps non statiche (§2.2) | Medio | Invalida il gate di authoring nella forma disegnata in chat. |
| Contenuto HTML non clippato (§4) | Medio | Richiede `labelBox` come inset inline. |

## 8. Domande aperte

1. Il gate «questa forma non ospita scomparti» deve valutare il dominio del conditional
   (avviso se almeno una forma possibile non è contenitore), o la composizione va
   permessa e il problema lasciato all'autore della view?
2. `collapsedForm` eredita i parametri geometrici della forma espansa o li ridichiara?
3. B6 va confermato a schermo prima di aprire il capitolo ancore.

## 9. File letti

`ir/irTypes.ts` (parziale), `ir/irStyle.ts` (integrale), `ir/irDefaults.ts` (grep),
`ir/IRNodeContent.tsx` (righe 150-200 più grep), `ir/edgeEndpoints.ts` (1-40 più firme),
`nodes/nodeSizing.ts` (integrale), `nodes/ObjectNode.tsx` (370-412 più grep),
`components/DynamicHandles.tsx` (1-70, 205-312 più grep), `utils/portDistribution.ts` (grep),
`redux/VersionFixer.tsx` (grep), `viewpoint/authoring/VertexAuthoringPanel.tsx` (grep).

**Non letti**, rilevanti: `irCompile.ts`, `utils/handlePosition.ts` integrale,
`IRContainmentHulls.tsx`.
