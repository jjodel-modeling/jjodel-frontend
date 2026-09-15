# Ratifiche 2026-07-28 — Size ↔ geometria object node IR (fix edge-gap + collapse)

## Contesto
Due anomalie su view IR State (`rounded`, pill S1/S2): **A** = collapse all'attivazione del Resizable;
**B** = edge non toccano il bordo in content-hug. Discovery unica eseguita.
Report: `docs/discovery/discovery_2026-07-28_size_geometry_reconciliation.md`.

## Verdetti RCA
- **A — CONFERMATO.** Neutralizer `.mm-node.ir-resizable { min:0; width/height:100% }` su un `.mm-node`
  senza size definita → collasso a min-content.
- **B — ipotesi iniziale SMENTITA.** Gli handle vengono dal **DOM misurato** (`DynamicHandles` →
  `getBoundingClientRect` del `.mm-node`), non da `raw.w/h`. Causa reale: **box-model** — `.mm-node`
  floorato 40px, `.ir-node-content` (`height:100%`) non si risolve contro l'altezza indefinita del
  `.mm-node` → resta content-hug (~24px) → gap. Artefatto del **floor** (solo quando contenuto < floor;
  con contenuto ≥ floor coincidono già).
- **Radice comune**: l'object node IR non ha una size definita sul box che React Flow misura.

## Decisioni ratificate
1. **Fix A = marker `ir-sized` (niente seed, niente stato).** Il neutralizer si applica **solo con
   size esplicita** (RF top-level `width/height`), non con `resizable`. Abilitare Resizable mantiene il
   content-hug (niente collasso); primo drag → `ir-sized` → riempie. Sopravvive al reload. **Nessun
   `view.ir.size` / schema in questa fetta.**
2. **Fix B = reconcile box-model render-side.** `.ir-node-content` riempie il `.mm-node` floorato
   (flex-stretch se `.mm-node` è flex; altrimenti floor sul figlio + azzeramento sotto `ir-sized`).
   Preserva il content-hug. Meccanismo scelto al Passo 0 di Fase 2.
3. **Read-back RIMANDATO** (al momento di questa ratifica). Con `ir-sized` il collapse è risolto anche
   al reload senza toccare la critical zone. La persistenza al reload del resize per-istanza resta un
   gap. → **SUPERATO**: vedi sezione "Read-back" sotto (discovery successiva l'ha reso leggero).
4. **Tutto render-side, fuori critical zone, niente LIR.** Fase 2 in 2 commit (B poi A), hard-stop +
   verifica visiva in mezzo.

## Fetta / prompt (filone size↔geometria)
- Prompt Fase 2 A+B: `claude/2026-07-28_prompt_fase2_size_geometry_reconciliation.md`.
- Verifica shape floor + size source: `claude/2026-07-28_prompt_verify_shape_floor_e_size_source.md`.
- **Commit 1 (edge-gap)**: `irStyle.ts` — floor su `.ir-node-content` (variante block; scoping shape
  da verifica). **Commit 2 (collapse)**: `ObjectNode.tsx` (`useStore` su `nodeLookup.width/height` →
  `ir-sized`) + `irStyle.ts` (neutralizer su `.mm-node.ir-sized` + azzeramento min sotto `ir-sized`).
  Entrambi build-verdi, in attesa di commit dopo verifica visiva.

## Read-back — aggiornamento (discovery `size_readback`, 2026-07-28)
Il read-back (persistenza del resize al reload) era dato per critical-zone + LIR. La discovery
`docs/discovery/discovery_2026-07-28_size_readback.md` l'ha **flippato a leggero**:
- **Insight confermato**: emettere `width/height` **top-level** (non `style`) dal transformer
  (a) compone con `ir-sized` (al load il box rende alla size salvata) e (b) **non** risveglia il gate
  `sizeChanged` di `useJjomSync` (che confronta `style`, mai toccato per gli object node). Argomento
  chiave: `NodeResizer`/propagazione **già** scrivono top-level senza svegliare il gate.
- **Perimetro**: il **solo** `objectVertexToRFNode` (legge `raw.w/raw.h` accanto a x/y, emette
  top-level **solo se `typeof number`**, mai il fallback 400/300). **Fuori critical zone, niente LIR.**
- **Persistenza D-layer confermata** end-to-end (`DVertex.w/h` serializzate nel `idlookup`,
  `VersionFixer` non le tocca).
- **Decisioni ratificate**: opzione **(i)** (emit per qualunque `w/h` persistita, nessun gate
  `resizable`: `undefined` non ha mai `w/h` → content-hug automatico); **scope reload-only** (la sync
  live cross-editor resterebbe critical zone, fuori requisito); emit condizionato a `typeof number`.
- **Prompt Fase 2**: `claude/2026-07-28_prompt_fase2_size_readback.md` (terza commit, dopo A+B).
- **Deferred**: la size stantia su una view portata a `resizable:false` (renderà alla size persistita)
  è lasciata al size-default-lock, che ridefinirà lo stato `false`.

## Deferred / coda
- **Opzione (M) scelta-lato**: `computeOptimalHandles` legge `raw.w/h` (fallback 180/80) per scegliere
  il LATO dell'handle; su content-hug (raw undefined) può scegliere lato sbagliato. NON è il bug
  osservato (edge sul lato giusto, solo gap). Latente, da valutare se emerge.
- **Size default-lock** (`view.ir.size`, `resizable:false` = box fisso a default view): fetta separata;
  riusa il marker `ir-sized` estendendone la condizione a `ir.size`; definirà anche il render dello
  stato `false` (e quindi il caso "size stantia" del read-back).
- **Classe `ir-resizable`**: dopo lo spostamento del neutralizer su `ir-sized` potrebbe restare inerte;
  non rimossa (decisione separata).
- **Live sync cross-editor della size**: patchare top-level width/height sui nodi già montati in
  `useJjomSync` → quello **sì** critical zone + LIR. Fuori requisito attuale.
