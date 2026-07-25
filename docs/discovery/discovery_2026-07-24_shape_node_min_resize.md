# Discovery — Shape node min-size & resize affordance (editor-v2)

**Data**: 2026-07-24
**Tipo**: passo 0 read-only + perimetro (Fase 2 resize, single-phase autorizzata)
**Prompt**: `2026-07-24_prompt_fase2_resize_shape_nodes_ir_ellipse` (sostituisce integralmente il superato `2026-07-23_prompt_fase2_resize_affordance_content_hug.md`).

---

## 1. Obiettivo

Rendere ridimensionabili liberamente (sotto la label, floor 24px) i nodi Object su ramo IR
la cui view risolta dichiara una **shape geometrica** (`ellipse`, la "pallina" delle state
machine), e trasformare tutte le altre node card (object/class/enum senza shape) in
**content-hug senza maniglie**. Emendamento 2026-07-24: il discriminante è la shape, non il
solo tipo di nodo.

---

## 2. File letti (path completi)

- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (intero)
- `frontend/src/components/editor-v2/nodes/ClassNode.tsx` (import + rami resizer 400-510)
- `frontend/src/components/editor-v2/nodes/EnumNode.tsx` (import + ramo resizer 130-190)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (intero) — **home delle regole shape**
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (intero)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (ShapeForm / ShapeSpec / CompiledView)
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (READ-ONLY, punto 4)
- `frontend/src/components/editor-v2/EditorV2.scss` (regole `.mm-node` 1208-, `.mm-object` 1654-)

---

## 3. Come la shape ellipse diventa rendering (ramo IR)

- Enum shape: `ShapeForm = 'rect' | 'rounded' | 'ellipse'` (`irTypes.ts:38`). `rect` = box
  rettangolare di default; `ellipse` = shape geometrica (caso motivante).
- La forma è **conditional per-istanza**: `compiled.form(readCtx, objectId)` restituisce la
  `ShapeForm` risolta per quell'oggetto (`IRNodeContent.tsx:35`). È una funzione, valutata a
  render-time, non un valore statico.
- Il rendering applica la classe `ir-shape--${form}` sull'elemento `.ir-node-content`
  (`IRNodeContent.tsx:108`).
- Le regole CSS della shape **NON stanno in un file SCSS**: vivono nella stringa `BASE_CSS`
  iniettata a runtime in `<style id="ir-views-css">` da `irStyle.ts`. La regola ellipse è
  `irStyle.ts:46` → `.ir-node-content.ir-shape--ellipse { border-radius: 50%; justify-content: center; }`.

**Guardia di perimetro (punto 3 del prompt): SUPERATA.** La shape ellipse passa dal ramo IR
di `ObjectNode` in editor-v2 (`ObjectNode.tsx` blocco `if (irResolution && !irDelegated)`,
righe 365-418, che renderizza `IRNodeContent`). Non è confinata all'editor classico → si
prosegue con l'implementazione nello stesso run.

---

## 4. Censimento delle sorgenti del minimo dimensionale (shape node ellipse)

| # | Sorgente | file:riga | Neutralizzata da |
|---|----------|-----------|------------------|
| a | Props NodeResizer `minWidth={140} minHeight={40}` (ramo IR) | `ObjectNode.tsx:374-380` (mount al 374) | Punto 2: min → `SHAPE_MIN_SIZE=24` |
| b | `.mm-node { min-width:140px; min-height:40px }` (wrapper condiviso) | `EditorV2.scss:1212-1213` | Punto 3: override `:has(> .ir-node-content.ir-shape--ellipse)` |
| c | `.mm-object { min-width:140px }` (wrapper object) | `EditorV2.scss:1655` | idem (specificità 0,3,0 vince su 0,1,0) |
| d | Contenuto (label) via flex | `irStyle.ts:19` `.ir-label` | Già clippa: `overflow:hidden; text-overflow:ellipsis; white-space:nowrap` — nessuna azione |
| e | `.ir-node-content` min-height | `irStyle.ts:18` (ha `min-width:0` ma non `min-height:0`) | Punto 3: aggiunta `min-height:0` sul variant ellipse |
| f | Dimensioni dal transformer | vedi §6 | **Nessuna**: objectNode NON riceve width/height/style |

Nota: `.ir-node-content` base ha già `min-width:0; width:100%; height:100%; overflow:hidden`
(`irStyle.ts:18,44`), e `.mm-node:has(> .ir-node-content)` neutralizza già
background/border/shadow per i nodi IR (`irStyle.ts:41-43`) — precedente diretto per lo
scoping via `:has`.

---

## 5. File SCSS da toccare al punto 3 → **sostituzione dichiarata**

Il prompt prevede "UN solo file SCSS, sede delle regole della shape". **Nel codebase reale le
regole della shape IR NON sono in SCSS**: stanno in `irStyle.ts` (CSS iniettato via JS). Le
occorrenze `border-radius: 50%` in `EditorV2.scss` (489, 932, 1083, 2283, 2311, 3736) sono per
altri elementi (handle, badge, connection dots), **non** per `.ir-shape--ellipse`.

**Decisione (dichiarata come richiesto dal prompt)**: il file editato al posto del "file SCSS"
è `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`. È lo stesso slot single-file
(non un file in più), non è in critical zone (§3.1), ed è la home coesa di
`.ir-shape--ellipse` e dei neutralizzatori `.mm-node:has(> .ir-node-content)` già presenti.
Il conteggio dei file toccati resta nel perimetro dichiarato.

---

## 6. Punto 4 — transformer (READ-ONLY, nessuna modifica)

`utils/jjomTransformers.ts` (NON `sync/`, path del prompt corretto qui):

- `classVertexToRFNode` (160-174): emette `{ id, type:'classNode', position, data }` — **niente width/height/style**.
- `enumVertexToRFNode` (201-209): `{ id, type:'enumNode', position, data }` — **niente width/height/style**.
- `objectVertexToRFNode` (328-338): `{ id, type:'objectNode', position, data }` — **niente width/height/style**.
- `packageVertexToRFNode` (224-236): **sì**, `style: { zIndex:-1, width:w, height:h }` da `raw.w/raw.h` (default 400x300). packageNode è fuori scope.

**Conseguenze / follow-up (adiacenti alla critical-zone sync, richiedono go-ahead separato):**

1. **Text card intrappolata grande**: rischio **NULLO** dal transformer. Non emette dimensioni,
   quindi al reload la card torna a content-hug (la size manuale non è mai persistita per
   questi tipi via transformer).
2. **Shape node che perde la size al reload**: rischio **REALE**. objectNode non emette
   width/height e il transformer NON legge `raw.w/raw.h` (a differenza di packageNode). Una
   ellipse ridimensionata a mano a 24px, al reload, non ha dimensione persistita/ricostruita →
   torna alla size content-hug. Questo è il follow-up "R2 persisted geometry": per farla
   sopravvivere servirebbe (i) write-back della size su `DVertex.w/h` e (ii) lettura in
   `objectVertexToRFNode` come per packageNode. **Fuori scope di questo prompt** (tocca il
   write-back canvas→JjOM / transformer, sync-adjacent). Da segnalare, non da fixare qui.

---

## 7. Discriminante `hasGeometricShape`

`ShapeForm` ha oggi tre valori: `rect` (box default), `rounded` (rettangolo arrotondato),
`ellipse` (geometrica). Il caso motivante e l'unica shape "non-box" reale è `ellipse`.
`hasGeometricShape` è definito come `form === 'ellipse'` (letto in `ObjectNode` via
`irResolution.compiled.form(irResolution.readCtx, irResolution.objectId)`, la stessa funzione
che `IRNodeContent` valuta per renderizzare). `rounded` resta content-hug/box come `rect`:
scelta conservativa e allineata al caso motivante (non introduce maniglie su view rounded non
richieste).

---

## 8. Correzioni ai riferimenti del prompt (discovery > prompt)

- **Righe ObjectNode invertite**: il prompt etichetta `:374` come "ramo nativo" e `:422` come
  "ramo IR". Nel file reale è l'opposto: `:374` è dentro il blocco IR
  (`if (irResolution && !irDelegated)`), `:422` è il return nativo. **Si segue la semantica del
  ramo**, non il numero di riga: il ramo IR riceve `isNodeResizable('objectNode', hasGeometricShape)`,
  il ramo nativo `isNodeResizable('objectNode')`.
- **Path transformer**: il prompt dice `sync/jjomTransformers.ts`; reale = `utils/jjomTransformers.ts`.
- **File SCSS**: sostituito da `irStyle.ts` (vedi §5).

---

## 9. Perimetro file (confermato prima dell'edit)

Scrittura:
1. NUOVO `frontend/src/components/editor-v2/nodes/nodeSizing.ts`
2. EDIT `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (import + gate 2 resizer + `hasGeometricShape`)
3. EDIT `frontend/src/components/editor-v2/nodes/ClassNode.tsx` (import + gate 2 resizer)
4. EDIT `frontend/src/components/editor-v2/nodes/EnumNode.tsx` (import + gate 1 resizer)
5. EDIT `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (**al posto** del file SCSS; ellipse min + wrapper floor scoped)
6. NUOVO questo report
7. EDIT `docs/claude-code-log.md` (entry finale)

Read-only: `utils/jjomTransformers.ts`.
Fuori perimetro (non toccati): packageNode, `views.ts`, data model/flag, `useJjomSync.ts`,
`portDistribution.ts`, editor classico, `VertexAuthoringPanel.tsx`.

---

## 10. Rischi / domande aperte

- **`:has()`**: usato per scoprire l'ellipse wrapper. Già in uso in `irStyle.ts:41-43` per i
  nodi IR → supporto browser assunto ok (stesso pattern committato).
- **Specificità**: override wrapper `.mm-node:has(> .ir-node-content.ir-shape--ellipse)` =
  (0,3,0), vince su `.mm-node`/`.mm-object` (0,1,0); iniettato in `<head>` dopo il bundle →
  vince anche sul tie di ordine. Stesso ragionamento già affidabile per i neutralizzatori
  esistenti.
- **Ellipse fresca non ridimensionata**: con CSS min:0 e nessuna dimensione dal transformer,
  una ellipse appena creata fa content-hug sulla label (dot piccolo). Il floor `24` è del
  **resizer** (drag), non un floor CSS: una ellipse con label cortissima può misurare <24 in
  modo naturale. Coerente col prompt (min CSS = 0). Valutazione visiva ad Alfonso.
- **Persisted geometry al reload**: follow-up §6.2, fuori scope. Segnalato.
