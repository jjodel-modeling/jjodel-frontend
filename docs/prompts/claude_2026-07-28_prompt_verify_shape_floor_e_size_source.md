# Verifica (mirata): tenuta del floor `.ir-node-content` sulle shape geometriche + sorgente di size delle shape

> **Nome del documento prompt**: 2026-07-28 17:06
> Micro-task. **Q1 read-only + eventuale rescope CSS deterministico** (a regola fissa, nessuna
> decisione architetturale). **Q2 read-only.** **HARD STOP dopo, nessun commit.**

Leggi `CLAUDE.md`. Branch: `alfonso-frontend-jjtl`.

## Contesto

È stato appena implementato **Commit 1** del fix edge-gap degli object node IR (NON ancora
committato). Unica aggiunta in `viewpoint/ir/irStyle.ts`:

```css
.ir-node-content { min-width: 140px; min-height: 40px; }
```

Serve floorare il bordo visibile (`.ir-node-content`) allo stesso 140×40 del `.mm-node`, così il
bordo raggiunge il box misurato su cui React Flow àncora gli handle. Prima di committare vanno chiusi
due punti, entrambi su `irStyle.ts` (+ il rendering shape). Nessun altro file va editato qui.

## Q1 — Il floor NON deve toccare ellipse/circle/diamond (regressione da escludere)

Le shape geometriche devono restare a `min-width/min-height: 0` per poter scendere sotto 140×40 nel
free-resize. La regola nuova `.ir-node-content { min:140/40 }` ha specificità `(0,1,0)`.

1. Cita **verbatim, con `file:riga`**, le regole di `irStyle.ts` che impostano `min-width`/
   `min-height` per `ir-shape--ellipse`, `ir-shape--circle`, `ir-shape--diamond` (e, se ci sono, per
   `ir-shape--rect`/`ir-shape--rounded`). Per ognuna riporta il **selettore esatto** e la sua
   **posizione nel file** rispetto alla nuova regola `.ir-node-content { min:140/40 }`.

2. Applica questa **regola deterministica** (niente valutazioni soggettive):
   - **SE** le regole `min:0` di ellipse/circle/diamond hanno specificità **strettamente maggiore** di
     `(0,1,0)` — cioè sono compound tipo `.ir-node-content.ir-shape--ellipse { … }` o hanno
     qualificatori aggiuntivi — **allora** vincono comunque sul nuovo floor: **lascia Commit 1
     com'è**, non toccare nulla.
   - **ALTRIMENTI** (specificità uguale a `(0,1,0)`, quindi dipendente dall'ordine nel file; **oppure**
     le shape geometriche non impostano affatto `min:0`): il bare `.ir-node-content { min:140/40 }` è
     fragile o le floorerebbe. **Sostituiscilo** con lo scoping esplicito ai soli box:
     ```css
     .ir-node-content.ir-shape--rect,
     .ir-node-content.ir-shape--rounded { min-width: 140px; min-height: 40px; }
     ```
     Prima verifica con `grep` che ogni vertex view IR porti effettivamente una classe `ir-shape--*`
     (il `form` default è `rect`, quindi un box di default dovrebbe avere `ir-shape--rect`); se così,
     questo scoping copre State/class-box/default e **esclude per costruzione** le geometriche. Poi
     `npm run build` pulito.

   Riporta quale dei due rami hai preso e perché (dalla specificità reale trovata al punto 1).

## Q2 — Come ottengono una size le shape geometriche oggi (gate per il prossimo Commit 2, SOLO lettura)

Commit 2 (prossimo, NON in questo task) sposterà il neutralizer di collasso da `.mm-node.ir-resizable`
a `.mm-node.ir-sized` (size esplicita presente). Rischio: se ellipse/circle/diamond oggi dipendono dal
neutralizer `.mm-node.ir-resizable { width/height:100%; min:0 }` per rendersi a una dimensione
sensata, e **non** hanno una size esplicita propria, sotto `ir-sized` collasserebbero come faceva il
rect.

**Read-only**, rispondi con `file:riga` e citazioni:

1. Come viene resa una shape (in particolare il diamond-SVG e ellipse/circle) dentro
   `.ir-node-content`: c'è un SVG con dimensione intrinseca/`viewBox`? Le regole `ir-shape--*`
   impostano una `width`/`height`/`aspect-ratio`/base-size, o solo `border-radius`/`clip-path`?
2. Le shape geometriche vengono **create con una size esplicita** sul `DVertex` (o sul nodo RF)?
   Cioè: un ellipse/circle/diamond appena creato ha `raw.w/raw.h` (o `node.width/height` top-level)
   valorizzati, oppure è content-hug come il rect?
3. **Verdetto**: al passaggio del neutralizer da `ir-resizable` a `ir-sized`, le shape geometriche
   restano rese correttamente (hanno una loro sorgente di size: SVG intrinseco / CSS / size esplicita)
   **oppure** rischiano di collassare e vanno gestite in Commit 2 (es. emettere `ir-sized` anche per
   loro, o dar loro un default)? Indica quale.

## HARD STOP

Dopo Q1 (con l'eventuale rescope + build) e Q2 (sola lettura), **FERMATI**. **Nessun commit, nessun
`git add`.** Restituisci in chat: le citazioni delle regole shape (Q1.1), il ramo preso (Q1.2), e il
verdetto Q2. Da lì decido se committare Commit 1 e come impostare Commit 2.

## RIFERIMENTI

- `viewpoint/ir/irStyle.ts` (nuova regola `.ir-node-content` min; regole `ir-shape--*`;
  `.mm-node.ir-resizable` neutralizer ~:80; `.ir-node-content` base ~:18).
- Rendering shape: `nodes/ObjectNode.tsx` / il componente che rende `.ir-node-content` e il diamond-SVG.
- Floor `.mm-node`: `EditorV2.scss` (~:1212-1213).
