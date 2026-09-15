# Prompt Claude Code: E0b — marker e label center ereditano `line.color` (incremento su E0, stesso commit)

**Data**: 2026-07-26
**Tipo**: feat (incremento sull'implementazione E0 NON ancora committata)
**Repo/branch**: jjodel-frontend / `alfonso-frontend-jjtl`
**Contesto**: E0 è implementato e verificato visivamente (stroke/width/dash + terminazione + label center sempre visibile arrivano a canvas). Rifinitura mancante: il marker di terminazione e il testo della label center sono resi col colore di default (grigio), non col colore della linea IR. Da chiudere PRIMA del commit, così E0 resta un commit unico e completo.
**Vincolo**: NON committare finché Alfonso non dà il GO; a fine E0b, commit UNICO di tutto E0 (i 4 file + entry di log).

## COSA
Quando `data.irEdgeViewId` è presente, il **marker di terminazione** E il **testo della label center** devono ereditare il colore della linea IR (`line.color`, cioè il `data.irStroke` che E0 già scrive nel `data`). Edge classici/M2 (senza `data.irEdgeViewId`): marker e label devono restare **BYTE-IDENTICI** a oggi.

## DOVE
Solo il ramo gated già introdotto in E0 dentro `edges/UnifiedEdge.tsx` (dove applichi stroke/width/dash e mappi le terminazioni ai marker, e dove rendi la label center). Nessun altro file, nessun file nuovo. **NON toccare in place le definizioni `<marker>` condivise usate dagli edge classici.**

## COME
- **Label center**: nel ramo gated, applica `color: <irStroke>` allo stile inline del testo della label.
- **Marker**: il più piccolo cambiamento che colora il marker SOLO per gli edge IR senza toccare i classici. Due tecniche ammesse, scegli la minima nel contesto reale del file:
  1. marker con `fill`/`stroke = "context-stroke"` referenziati SOLO dal ramo IR (l'edge IR ha già `stroke = irStroke` sul path, quindi il marker segue). Se i `<marker>` sono condivisi coi classici, NON modificarli in place: crea la variante IR-only.
  2. istanza di marker per-colore (id derivato dal colore, verificato anti-collisione con `grep`) referenziata solo quando `irEdgeViewId` è presente.
- Verifica anti-collisione (`grep -r`) su qualunque nuovo id di marker. Non rinominare id di marker esistenti.

## Verifica
- Re-esegui lo snippet smoke (`snippet_2026-07-26_edge_view_ir_e0.js`): il marker `hollowTriangle` e la label `E0` devono ora essere dello **stesso ciano** della linea.
- Edge senza view IR: marker e label **invariati** (confronto visivo con prima).
- `npm run build` + typecheck + vitest verdi.
- HARD STOP → conferma visiva di Alfonso.

## Commit (solo dopo GO)
- Commit UNICO di E0 (E0 + E0b insieme): `feat(editor-v2): IR-driven edge rendering (gated style consumption + pre-lift matching)`
- Nell'entry di log, aggiungi alla nota E0 che marker di terminazione e label center ereditano `line.color` nel ramo gated.
