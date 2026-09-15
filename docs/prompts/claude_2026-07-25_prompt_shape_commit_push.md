# Prompt Claude Code: commit unico della shape WIP (A+B) + push del branch

**Data**: 2026-07-25
**Tipo**: feat (commit di lavoro gia' implementato e verificato; nessuna nuova implementazione)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Prerequisito**: `d1e6f9992` (R3) e' HEAD. Se manca, STOP.
**Precondizione visiva (Alfonso, prima di lanciare questo prompt)**: sul canvas, resize libero degli shape node (ellipse sotto la dimensione della label) OK e forme `circle`/`diamond` rese correttamente. Se non e' ok, NON lanciare questo prompt.

## Contesto

R3 e' committato (`d1e6f9992`) e isolato. Nel working tree resta SOLO la shape WIP, due filoni impilati gia' mappati dal triage (`docs/discovery/discovery_2026-07-25_wip_7_file_triage.md`):
- **A = free-resize / content-hug**: `nodeSizing.ts` (nuovo) + gate `isNodeResizable` in ObjectNode/ClassNode/EnumNode + `ellipse` min:0 in `irStyle.ts`.
- **B = circle/diamond**: `ShapeForm` in `irTypes.ts`, forme in `irStyle.ts`, diamond-SVG in `IRNodeContent.tsx`, `FORM_OPTIONS` in `VertexAuthoringPanel.tsx`, `keepAspectRatio` in `ObjectNode.tsx`.

Decisione di Alfonso: **un unico commit** "shape" (A+B insieme), niente split col bisturi (A e B condividono `ObjectNode` e `irStyle`, e sono entrambi lavoro verificato). Poi **push** del branch.

## COSA (in ordine)

### 1. Verifica del set uncommitted
`git status`: l'uncommitted deve essere ESATTAMENTE la shape WIP:
- modified (7): `ObjectNode.tsx`, `ClassNode.tsx`, `EnumNode.tsx`, `VertexAuthoringPanel.tsx`, `IRNodeContent.tsx`, `irStyle.ts`, `irTypes.ts`
- untracked: `nodes/nodeSizing.ts`, `docs/discovery/discovery_2026-07-24_shape_node_min_resize.md`, `docs/discovery/discovery_2026-07-24_shapes_circle_diamond.md`

Se compare qualcosa fuori da questa lista, STOP e segnala (non stageare nulla di extra).

### 2. Log
In `docs/claude-code-log.md` scrivi UNA entry (tipo `feat`) che copre entrambi i filoni:
- A: free-resize/content-hug (nodeSizing + gate isNodeResizable + ellipse min:0);
- B: circle/diamond (ShapeForm in irTypes, forme in irStyle, diamond-SVG in IRNodeContent, FORM_OPTIONS in VertexAuthoringPanel, keepAspectRatio in ObjectNode).
Cita i due discovery doc del 2026-07-24. **Se esiste gia' una vecchia entry per A che descrive uno stato "ellipse-only" anteriore al codice attuale, correggila/integrala** cosi' non resta fuorviante (non lasciarla contraddire lo stato committato). Premetti data e ora al nome del documento prompt.

### 3. Staging filtrato
`git add` SOLO i file del punto 1 + `docs/claude-code-log.md`. **Mai `git add .` / `git add -A`.** Poi `git status` per confermare lo staged set (10 file: 7 modified shape + nodeSizing + 2 discovery doc, piu' il log).

### 4. Gate
La build era gia' verde sul tree combinato (R3 + shape) in fase R3; ri-esegui `npm run build` come conferma finale prima del commit. Se fallisce, STOP e riporta.

### 5. Commit
Una riga, inglese:
`feat: circle/diamond shape forms and free-resize/content-hug nodes in editor-v2`

### 6. Push
`git push` del branch `alfonso-frontend-jjtl` su origin. Questo spinge TUTTI i commit locali non pushati (docs discovery, R1, R2, eventuale merge staging/shapes, R3, shape): origin era indietro (il working note del cruscotto era errato).

### 7. HARD STOP e report
- hash del commit shape;
- conferma push riuscito: `git status` deve dire "up to date with origin";
- `git log --oneline -8`;
- conferma che il working tree e' ora **pulito** (nessun uncommitted residuo).

## Vincoli
- Nessuna modifica al codice: questo e' solo staging/commit/push di lavoro esistente. L'unico file di testo che scrivi e' `docs/claude-code-log.md`.
- Se il working tree contiene qualcosa oltre la shape WIP attesa, STOP.
