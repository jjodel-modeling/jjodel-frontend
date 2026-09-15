# Discovery — Stratificazione del box painting nelle viste IR (ellipse rotta, border props inerti)

**Data**: 2026-07-22
**Tipo**: discovery read-only (Fase 1)
**Branch**: alfonso-frontend-jjtl
**Critical zone**: no
**Stato**: HARD STOP di Fase B attivo. Nessun commit. Unica scrittura applicata:
decisione A ratificata (revert wrapper TRANSACTION → bare `view.ir = draft`,
rimozione commento errato), indipendente da questa discovery.

## Obiettivo

Dopo il fix `:has()` (irStyle.ts:35-37) rect/rounded funzionano, ma:
- **ellipse**: il bordo ellittico c'è, ma dentro si vede un rettangolo che sborda
  e copre la sagoma (manca il clipping);
- **border props** (stile/colore/spessore) del pannello: nessun effetto visibile.

Questa discovery mappa la stratificazione del painting (chi disegna il box, dove
atterrano le proprietà authored) e valuta la fattibilità di ri-stratificare il
box su `.ir-node-content`.

## File letti (path completi)

- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` — pannello, campi border.
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` — render del contenuto IR.
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` — `BASE_CSS`, `staticCssFor`, `ensureViewCss`.
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` — compilazione (border).
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` — call site `ensureViewCss`.
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` — struttura DOM (ramo IR + ramo nativo).
- `frontend/src/components/editor-v2/EditorV2.scss` — stili base `.mm-node`.
- `frontend/src/components/editor-v2/_notations.scss` — override notazione su `.mm-node`.

---

## §1 — Flusso dei border props

**Pannello.** I campi border vivono in `VertexAuthoringPanel.tsx`:
- helper `patchBorder` (`:132-135`): scrive su `draft.shape.border = { color, width, style }`.
- controlli (`:170-175`): `ColorPicker` → `patchBorder({ color })`, `NumberInput` → `patchBorder({ width })`, `Select` → `patchBorder({ style })`.
- default `DEFAULT_BORDER = { color:'#334155', width:1, style:'solid' }` (`:32`).

**Raggiungono lo store?** Sì. Stesso path del form: `patch()` → `setDraft` →
commit debounced `view.ir = draft` → `set_ir` (`view.tsx:484`) → `SetFieldAction`
(dispatcha) → reducer `current.ir = draft` (nuovo ref). Verificato staticamente,
identico al form che è confermato funzionante.

**Emissione / compilazione.** Il border NON è renderizzato inline né da IRNodeContent:
- `IRNodeContent.tsx:98-99` applica inline **solo** `background` (fill):
  `if (fill) inlineStyle.background = fill;`. **Nessun border inline.**
- `irCompile.ts:262` calcola `const border = ir.shape.border ?? null;` e lo mette
  nel compiled (`:336`). **MA `compiled.border` è morto**: gli unici accessi a
  `border` nel modulo IR sono la sua definizione (`irCompile.ts:262`) e
  `staticCssFor` che legge `ir.shape.border` **diretto** (`irStyle.ts:64-67`), non
  `compiled.border`. IRNodeContent non lo consuma mai (usa form, fill, labels,
  badges, fieldCompartments).
- Quindi il border è emesso **solo** da `staticCssFor` (`irStyle.ts:62-73`):
  `\n.ir-view-<viewId> { border: <w>px <style> <color>; background: <fill>; }`.
  Selettore `.ir-view-<viewId>`, che è una classe su **`.mm-node`** (ObjectNode:371).

**Perché non si vede? → root cause trovata.** `staticCssFor` è iniettato da
`ensureViewCss` (`irStyle.ts:83-87`), che ha una **guardia once-per-viewId**:

```
export function ensureViewCss(viewId, ir) {
    const tag = ensureStyleTag();
    if (!tag || viewCssNodes.has(viewId)) return;   // ← esce se già iniettato
    ...
}
```

Chiamata da `irResolveCore.ts:141` dentro il loop di `getIRIndex`. Al **primo**
build dell'indice il CSS per-view viene iniettato; a ogni edit successivo la firma
cambia, `getIRIndex` ricostruisce, ma `ensureViewCss` **esce subito** perché
`viewCssNodes.has(viewId)` è già true. **Il border (e la background per-view) sono
congelati alla prima iniezione e non si aggiornano mai.**

Asimmetria che spiega tutto:
- **form**: reattivo, è una `className` su `.ir-node-content` (IRNodeContent:105) → cambia live.
- **fill**: reattivo, applicato **inline** su `.ir-node-content` (IRNodeContent:99) → cambia live (e la copia in `staticCssFor` è congelata ma su un altro elemento).
- **border**: **solo** via `staticCssFor` congelato → **inerte**.

---

## §2 — Mappa del painting di `.mm-node`

**Base** (`EditorV2.scss:1208-1220`):
- `background: var(--node-bg)` (1209)
- `border: 1px solid var(--border-default)` (1210)
- `border-radius: 4px` (1211)
- `min-width: 140px; min-height: 40px` (1212-1213)
- `overflow: hidden` **COMMENTATO** (1215) → overflow **visibile**
- `box-shadow: 0 1px 3px …, 0 4px 12px …` (1219)

**Stati interattivi**:
- `.mm-node.selected` (1222-1225): `border-color: var(--color-accent)`, box-shadow accentuato.
- `.mm-node.drop-target` (1227-1230): border-color accent, glow.
- `.mm-node.viewpoint-wrapper` (1232-1244): transparent/no-border (non pertinente ai nodi oggetto).
- **Nessuna** regola `.mm-node:hover` (grep vuoto). Nessuno stato drag che ridipinge `.mm-node` base.

**Per-view** (`staticCssFor`, `irStyle.ts:62-73`): `.ir-view-<viewId> { border; background }`
su `.mm-node`. Specificità `(0,1,0)` (una classe), pari a base `.mm-node`; regola
runtime-injected in `<head>` dopo il bundle → vincerebbe su base per ordine sorgente
**se ri-emessa** (ma è congelata, §1).

**Override notazione** (`_notations.scss`): `.notation-er .mm-node { border-radius: 12px }`
(:70-72 circa), `.notation-wireframe .mm-node { box-shadow: none !important }`,
`.notation-compact .mm-node { min-width: 100px }`. Il fix `:has()` (specificità
`(0,3,0)`) collide in specificità con `.editor-v2.notation-er .mm-node` (`(0,3,0)`):
in notazione ER l'ordine sorgente decide. Rischio marginale (test bed non-ER).

**Il mio fix `:has()`** (`irStyle.ts:35-37`): border-radius su `.mm-node` quando
contiene `.ir-node-content.ir-shape--rounded|ellipse`.

---

## §3 — Struttura DOM

**Ramo IR** (ObjectNode:369-393):

```
.react-flow__node                                (wrapper React Flow)
  └─ .mm-node.mm-object.ir-view-<viewId>          (ObjectNode:371 — box: border+bg+radius+shadow)
       ├─ NodeResizer  (sibling)
       ├─ DynamicHandles → handle React Flow  (sibling)
       ├─ .singleton-badge  (sibling, opz.)
       ├─ NodeProblemIndicator  (sibling)
       └─ .ir-node-content.ir-shape--<form>        (IRNodeContent:105 — figlio DIRETTO)
            └─ style inline: background = fill (se presente)   ← RETTANGOLO
```

- `.ir-node-content` è **figlio diretto** di `.mm-node`. Sibling: handle RF,
  resizer, badge singleton, problem indicator, collapse chip (graphVertex).
- **Chi dipinge sfondi rettangolari dentro l'ellisse**: `.ir-node-content` stesso,
  via **background inline = fill** (IRNodeContent:99). Dopo il mio fix il radius è
  su `.mm-node`, non più su `.ir-node-content`, quindi la background inline è un
  **rettangolo a spigoli vivi** che sborda dall'ellisse di `.mm-node` (che ha
  `overflow: visible`). I figli labels/compartment/row **non** hanno background
  propri in `BASE_CSS` (solo `.ir-row__value--editable:hover` ha bg, `irStyle.ts:43`).
  Quindi la "title bar / righe" percepite nello screenshot = il singolo rettangolo
  `.ir-node-content` colorato dal fill, con testo interno.
- **Wrapper `react-flow__node` con `ir-shape--ellipse`**: **SMENTITO**. Grep
  esaustivo: unica emissione `ir-shape` = `IRNodeContent:105` su `.ir-node-content`.
  Nessun `node.className`, nessun `cloneElement`, nessun `nodeClassName` (grep su
  ObjectNode ed EditorV2 vuoti). Il paste DevTools era mis-livellato: la classe è
  sul `.ir-node-content` annidato in `.mm-node`, non sul wrapper.

**Ramo nativo (non-IR)** (ObjectNode:420-421): `.mm-node.mm-object` con
`.mm-node__header` ecc., **senza `.ir-node-content`**. Quindi
`.mm-node:has(> .ir-node-content)` isola i nodi IR e **non tocca i nativi**.
Condizione sufficiente confermata.

---

## §4 — Fattibilità della ri-stratificazione

### Soluzione candidata (dal prompt)

```css
.mm-node:has(> .ir-node-content) { background: transparent; border-color: transparent; box-shadow: none; }
.ir-node-content { /* replica box base: background, border, radius */ }
.ir-node-content.ir-shape--ellipse { border-radius: 50%; overflow: hidden; }
```

**Cosa funziona**
- **Isolamento non-IR**: `:has(> .ir-node-content)` matcha solo nodi IR (§3). I
  nativi restano intatti. ✔
- **Handle non clippati**: gli handle RF sono **sibling** di `.ir-node-content`
  (figli di `.mm-node`). `overflow: hidden` su `.ir-node-content` clippa solo i
  **suoi** figli, non i sibling. ✔ (Nota: mettere `overflow: hidden` su `.mm-node`
  invece li clipperebbe — da evitare.)
- **Ellipse**: box+fill+radius sullo stesso elemento (`.ir-node-content`) →
  clipping coerente, niente rettangolo che sborda. ✔
- **Sizing**: width/height del nodo li fissa lo style del nodo RF (NodeResizer) e
  i `min-width/height` di `.mm-node`; `.ir-node-content` è `width/height:100%`
  (`BASE_CSS:17`). Neutralizzare il painting non tocca il sizing. ✔

**Cosa si rompe / richiede lavoro**
1. **`staticCssFor` assume `.mm-node`** (§1): emette border+bg su `.ir-view-<viewId>`
   = `.mm-node`. Se rendo trasparente `.mm-node`, quel border/bg (già congelato,
   §1) sparisce. Serve ridipingere border+bg su `.ir-node-content`. Ma
   `.ir-node-content` non ha la classe `.ir-view-<viewId>`. Due strade:
   - (a) aggiungere `ir-view-<viewId>` anche a `.ir-node-content`, e cambiare il
     selettore di `staticCssFor`; **oppure**
   - (b) **applicare border inline in IRNodeContent** (come già si fa per fill,
     :99) e abbandonare il border di `staticCssFor`. (b) **risolve
     contemporaneamente il bug del border congelato** (§1): il border diventa
     reattivo perché passa dal path inline, non da `ensureViewCss`. **Raccomandata.**
2. **Stati selected / shadow**: `.mm-node.selected` dà feedback via `border-color`
   + `box-shadow` (EditorV2.scss:1222-1225) e il box-shadow base (1219). La
   candidata azzera `box-shadow` e `border-color` sui nodi IR → **si perde il
   ring di selezione e l'ombra** per i nodi IR. Serve ri-applicare selected/shadow
   su `.ir-node-content` (es. `.mm-node.selected:has(> .ir-node-content) .ir-node-content { … }`,
   o box-shadow spostata su `.ir-node-content`). **Rischio medio, va gestito
   esplicitamente.**
3. **Notazione ER** (§2): collisione di specificità sul border-radius. Marginale.
4. **Clipping del testo nell'ellisse**: con `overflow:hidden` + `border-radius:50%`
   il testo vicino ai poli verticali può essere tagliato dalla curva. Le label
   sono centrate (`justify-content:center` per ellipse, irStyle.ts:37). Potrebbe
   servire un padding contenuto — da valutare in preview, non preventivo.

### Soluzione raccomandata (candidata + rifiniture)

Direzione unica coerente che chiude **entrambi** i bug (ellipse + border inerte):

1. **Spostare TUTTO il painting authored su `.ir-node-content`, inline in
   IRNodeContent** (già fatto per fill; aggiungere border + border-radius):
   - `IRNodeContent.tsx:98-99`: oltre a `background = fill`, aggiungere
     `border` (da `compiled.border`, oggi morto → renderlo vivo) e il
     `border-radius` per forma. Border/fill diventano **reattivi** senza dipendere
     da `ensureViewCss` (bug §1 chiuso alla radice).
2. **Neutralizzare il painting di `.mm-node` per i soli nodi IR** via
   `.mm-node:has(> .ir-node-content) { background/border/box-shadow → transparent/none }`,
   **preservando** il feedback di selezione ridefinendolo su `.ir-node-content`
   (o mantenendo un solo segnale, es. outline sul `.mm-node.selected`).
3. **Clipping** su `.ir-node-content` (`overflow:hidden` + radius), che NON tocca
   gli handle (sibling).
4. **Ritirare/aggiornare `staticCssFor`**: se border+bg passano inline, le regole
   border/bg di `staticCssFor` diventano ridondanti; valutare se lasciarle (innocue
   ma congelate) o rimuoverle. La `ensureViewCss` once-guard resterebbe rilevante
   solo per eventuali parti statiche residue.

Vantaggio: un solo elemento (`.ir-node-content`) dipinge e clippa il box, tutte le
proprietà authored sono reattive per lo stesso meccanismo (inline in IRNodeContent),
`.mm-node` torna a essere solo il contenitore RF (handle, resizer, sizing).

**Costo/superficie**: tocca `IRNodeContent.tsx` (aggiunta border/radius inline +
consumo di `compiled.border`), `irStyle.ts` (`:has()` neutralizzazione + regole box
su `.ir-node-content` + gestione selected), potenzialmente `staticCssFor`
(ritiro border/bg) e la once-guard di `ensureViewCss`. Non tocca il path reattivo
(set_ir/computeIRSignature/refToken) né i nodi nativi.

---

## Rischi individuati

- **R1 — perdita del feedback di selezione/ombra** sui nodi IR se si neutralizza
  `.mm-node` senza ri-applicare selected/shadow su `.ir-node-content`. Da gestire.
- **R2 — `compiled.border` oggi morto**: renderlo vivo (consumo inline) è additivo,
  ma va verificato che `ir.shape.border` sia sempre nella forma `{color,width,style}`
  attesa (default garantito dal pannello; viste migrate/demo da controllare).
- **R3 — `ensureViewCss` once-guard**: se si decide di NON passare border/bg inline
  ma di sistemare `staticCssFor`, va rimossa/riprogettata la guardia once-per-viewId
  (altrimenti border resta congelato). Questo è un cambio di lifecycle
  dell'iniezione CSS: verificare che il re-emit non causi leak di `<style>` o
  duplicati (oggi `viewCssNodes` mappa 1 nodo per viewId).
- **R4 — clipping testo nell'ellisse** (poli verticali). Estetico, gestibile con padding.
- **R5 — specificità notazione ER** sul border-radius. Marginale.

## Domande aperte per Alfonso

1. **Path del painting authored**: preferisci (A) tutto **inline in IRNodeContent**
   su `.ir-node-content` (chiude border-inerte + ellipse insieme, `staticCssFor`
   border/bg ritirato), oppure (B) mantenere `staticCssFor` su `.mm-node` e
   **rimuovere la once-guard** di `ensureViewCss` per renderlo reattivo (ma resta il
   problema clipping/rettangolo su `.mm-node` con overflow, e gli handle)? Raccomando **A**.
2. **Feedback selezione** sui nodi IR una volta neutralizzato `.mm-node`: ring su
   `.ir-node-content`, oppure tenere un `outline` su `.mm-node.selected` (che non
   dipende da border/box-shadow)?
3. **`box-shadow`/ombra** dei nodi IR: la vuoi preservare (spostata su
   `.ir-node-content`) o i nodi IR possono essere piatti?
4. **rect a spigolo vivo**: confermi che `rect` resta al default 4px di `.mm-node`,
   o con la ri-stratificazione su `.ir-node-content` vuoi `rect = 0`?

## HARD STOP

Analisi consegnata. Nessuna implementazione oltre la decisione A. Decisione sul fix
in chat.
