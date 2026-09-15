# Discovery — gli handle cardinali collidono con gli handle di connessione

**Data**: 2026-08-26
**Fase**: ripresa della Parte 2 del prompt delle 00:20, read-only, effort xhigh
**Sintomo dichiarato dalla sessione precedente** (`7d17367cb`): «gli handle cardinali si
posizionano ma non ridimensionano».
**Esito**: la diagnosi precedente è **rettificata**. Non è il ridimensionamento a fallire:
è il gesto che non arriva mai al resizer. Hard stop, nessuna modifica al codice.
**Sonda**: `frontend/scripts/smoke/_tmp_resize_sides.ts` (gitignored), Chromium headless
contro `http://localhost:3000/`, fixture sintetica costruita in pagina.

---

## 0. Sommario

I quattro punti cardinali del bounding box di un nodo IR **sono già occupati** dagli handle di
connessione di `DynamicHandles`. Un `NodeResizeControl` a `top | right | bottom | left` nasce
esattamente sotto di essi, il `mousedown` va all'handle di connessione e `onResizeStart` non
viene mai chiamato. La resa è indistinguibile da «l'handle c'è e non fa niente», che è quello
che la sessione precedente ha misurato e interpretato male.

La misura non riguarda solo il diff scartato: lo stesso vale **oggi, su HEAD**, per i quattro
controlli `line` che il `NodeResizer` monta già sui lati. Il resize dai lati del nodo è
un'affordance dichiarata e in gran parte non funzionante, indipendentemente dalla Parte 2.

## 1. Come è stata presa la misura

Sonda Playwright, fixture sintetica (due classi che esistono solo nella sonda, viewpoint IR con
due view exclusive: `ellipse` su `Alpha`, `rect` con `resizable: true` su `Beta`). Per ogni
trascinamento la sonda registra, campionato passo per passo: stile inline e bounding box del
wrapper `.react-flow__node`, record del `DVertex` in Redux (`w`, `h`, `isResized`,
`layoutByViewpoint`), listener DOM sul controllo letti via CDP `DOMDebugger.getEventListeners`,
e due sonde sul `mousedown` — una in **cattura** su `window` (scatta prima di ogni listener
sull'elemento) e una in **bubble** su `document` (scatta solo se nessuno ha chiamato
`stopImmediatePropagation`, che è ciò che `d3-drag` fa appena la sua `beforestart` è andata a
buon fine). Istrumentazione temporanea `[diagRS]` su `onResizeStart`/`onResize`/`onResizeEnd`
del `NodeResizer` di `ObjectNode.tsx`, rimossa e verificata a diff nullo prima di scrivere
questo documento.

## 2. Le tre misure che chiudono la questione

**(a) Il listener c'è.** `DOMDebugger.getEventListeners` sul controllo di lato riporta
`mousedown`, esattamente come sul controllo d'angolo. Il resizer è agganciato.

**(b) `onResizeStart` non parte.** Su otto trascinamenti misurati, `[diagRS] start` compare a
ogni trascinamento d'**angolo** (4/4) e quasi mai su un trascinamento di **lato** (1/8 fra le
due corse, con la stessa sequenza di gesti: l'esito è instabile, non deterministico). Quando
non parte, non c'è alcun campione intermedio: né la taglia, né la posizione, né il record del
`DVertex` si muovono. Non è un ridimensionamento annullato a valle: è un gesto che non comincia.

**(c) Il `mousedown` va a un altro elemento.** La sonda in cattura riporta il bersaglio reale:

```
drag line.right   → capture target = react-flow__handle react-flow__handle-right nodrag nopan …
                    bubble-su-document (nessuno ha fermato la propagazione)
drag handle.bottom-right
                  → capture target = react-flow__resize-control nodrag bottom right handle …
                    [diagRS] start {"width":54,"height":66,…}
```

Il bubble su `document` conferma il verso della catena: sul lato nessuno chiama
`stopImmediatePropagation`, cioè `d3-drag` del resizer non è mai entrato in gioco.

## 3. Perché: la geometria degli handle di connessione

Censimento sul nodo ellisse (box 54×66), stessa sonda:

```
32 handle .react-flow__handle, 8×8, z-index auto, otto per lato, tutti impilati sullo stesso punto
  react-flow__handle-top     centro (27, 0)
  react-flow__handle-right   centro (54, 33)
  react-flow__handle-bottom  centro (27, 66)
  react-flow__handle-left    centro (0, 33)
```

Cioè: **la mezzeria esatta di ciascun lato**, che è per definizione il punto cardinale. Un
controllo di resize a `right` nasce a `left: 100%; top: 50%`, cioè nello stesso punto, con la
stessa area di 8-9px. Gli angoli sono liberi, ed è per questo che funzionano sempre.

`getComputedStyle` letto **prima** del gesto riporta `pointer-events: none` su quasi tutti gli
handle (due soli a `all`); il bersaglio del `mousedown` è comunque un handle di connessione.
L'hover li arma, e quale dei tratti impilati si arma cambia da corsa a corsa: è questa la
sorgente dell'instabilità del punto (b), e dell'«1 volta su 3» già osservato dalla sessione
precedente senza spiegazione.

Contro-prova nella stessa corsa: `document.elementsFromPoint` alle stesse coordinate, invocato
prima del `mousemove`, riporta il controllo del resizer come elemento più in alto. La
discrepanza fra quella lettura e il bersaglio reale del `mousedown` è precisamente l'effetto
dell'hover, ed è il motivo per cui una verifica fatta con `elementsFromPoint` — o a occhio su
uno screenshot — dice che l'handle «c'è» mentre il gesto non lo raggiunge.

## 4. Il resto della Fase 1 del prompt, per completezza

**`NodeResizeControl` accetta `top | right | bottom | left`?** Sì. `@xyflow/react` 12.10.2:
`XY_RESIZER_LINE_POSITIONS = ['top','right','bottom','left']`, `getControlDirection` li tratta
(`isHorizontal`/`isVertical` senza `affectsX`/`affectsY`), e `style.css` ha già
`.react-flow__resize-control.handle.left/.right/.top/.bottom` con il posizionamento a mezzeria.
La variante `handle` a una posizione di lato è supportata dalla libreria: il vincolo non è lì.

**Come `ObjectNode.tsx` monta il resizer.** Ramo IR, `ObjectNode.tsx:419`, dentro
`isNodeResizable('objectNode', canResize)`: `<NodeResizer isVisible={selected}
minWidth={SHAPE_MIN_SIZE} minHeight={SHAPE_MIN_SIZE}
keepAspectRatio={keepAspectRatioForForm(shapeForm)} lineClassName="node-resize-line"
handleClassName="node-resize-handle" />`. Nessun `maxWidth`/`maxHeight`, nessun `shouldResize`.

**Il predicato «contorno non rettangolare» non esiste nel registry.** I due candidati sbagliano
entrambi ai bordi, e sbagliano su forme diverse:

| forma | `insetFractionAt !== NO_INSET` | `hasSizeSupplement` | `defaultResizable` | contorno non rettangolare |
|---|---|---|---|---|
| rect, rounded | no | no | no | no |
| stadium | **no** (approssimazione dichiarata) | **no** | **no** | **sì** |
| ellipse, circle | sì | sì | sì | sì |
| diamond | sì | sì | sì | sì |
| hexagon, parallelogram | sì | sì | sì | sì |
| cylinder | **no** (rientro nullo, dichiarato) | sì | sì | sì |

`defaultResizable` è il più vicino ma dice un'altra cosa (l'affordance di resize di default) e
manca `stadium`. Servirebbe un campo esplicito nel `ShapeDescriptor` — nome proposto
`rectangularOutline: boolean`, letto come «il contorno coincide col bounding box», con
`stadium` e `cylinder` scritti a mano perché le loro approssimazioni di rientro non lo dicono.
Non è stato aggiunto: è materia del hard stop del prompt, e comunque subordinato alla decisione
del §5.

## 5. Le tre vie, se e quando si riapre

Nessuna è stata scritta: Alfonso ha scelto «report e basta» il 2026-08-26.

1. **Handle sulla banda, fuori dal contorno.** Quattro `NodeResizeControl` a N/E/S/O spostati
   in fuori di ~9px con uno `style`, cioè sulla banda di selezione appena spedita in
   `e8d554b9a`. Semantica cardinale intatta, affordance di connessione intatta, nessuna
   collisione. È un offset di stile sui quattro controlli.
2. **Il resize vince sulla mezzeria.** Impilamento a favore del resize ai quattro punti
   cardinali. Costo: si perde la creazione di archi trascinando dalla mezzeria del lato.
3. **Handle sul contorno, in diagonale.** Quattro handle sui punti diagonali proiettati sul
   contorno. Nessuna collisione, ma non sono i punti cardinali richiesti.

## 6. Difetto separato, non chiuso qui

Il resize dai **lati** su HEAD (i quattro `line` del `NodeResizer`) è affetto dalla stessa
collisione e funziona per caso. Non è una regressione introdotta da nessuno dei commit di
questi giorni: è la conseguenza geometrica di due affordance che chiedono lo stesso punto.
Qualunque delle tre vie del §5 lo chiude o lo dichiara insieme agli handle cardinali; nessuna
lo lascia com'è senza dirlo.
