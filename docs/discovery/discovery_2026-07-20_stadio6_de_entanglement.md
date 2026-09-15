# Discovery — Stadio 6 de-entanglement (routing lib rename, DerivedReferenceEdge, campi DEdge, NodeEditor)

**Data**: 2026-07-20
**Branch**: `wt/stadio6` (worktree dedicato, base `d1de6d4`)
**Tipo**: Fase 1 del cantiere Stadio 6. Decisioni già ratificate da Alfonso (vedi prompt); questa discovery verifica i consumer reali sul worktree corrente prima dell'implementazione.

---

## Obiettivo

Verificare sul codice corrente i quattro punti dello Stadio 6 del piano di de-entanglement
(`docs/discovery/discovery_2026-07-19_de_entanglement_graph.md`, sezione "Stadio 6"):

a. rename `edges/routing/classic` → `edges/routing/manhattan` (la lib resta: getter
   `segments`/`d`/`headPos` sono API JjScript da mantenere);
b. rimozione di `DerivedReferenceEdge` (muore coi template DV), previa verifica consumer;
c. campi DEdge classic-era (`anchorStart`/`anchorEnd`/`segmentOffsets`): restano orfani nei
   salvataggi, NIENTE VersionFixer; rimozione del solo uso a runtime previsto dal report;
d. sgancio NodeEditor secondo il report (unico consumer UI vivo dei campi (c)).

## Stato del worktree (pre-implementazione)

- Stadi 0–5 già applicati: `src/graph/` non esiste più; `joiner/components.tsx` è il barrel
  purgato (stage 4) con soli dizionari `{cname}` metadata; `EditorSwitch`/`ModelTab` montano solo
  EditorV2.
- Baseline gates verificati: `npm run typecheck` → **14 error TS** (baseline cloud attesa,
  confermata); `npx vitest run src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` →
  **47/47 passed**.

## File letti (path completi)

- `frontend/src/edges/routing/classic/index.ts` (intero) + `ls` della directory (10 file:
  index, labels, markers, points, round, segments, snap, stride, types + `__tests__/routing.test.ts`)
- `frontend/src/edges/derived/DerivedReferenceEdge.tsx` (header, import block, export tail 199-227)
- `frontend/src/joiner/components.tsx` (intero)
- `frontend/src/joiner/index.ts` (righe 295-330, blocco re-export da `./components`)
- `frontend/src/joiner/ExecuteOnRead.ts` (righe 15, 94: copia del barrel su `windoww`)
- `frontend/src/common/DV.tsx` (righe 1195-1310: occorrenze `<DerivedReferenceEdge>`; header import block)
- `frontend/src/model/dataStructure/GraphDataElements.tsx` (righe 64-68, 885-905, 2270-2290,
  2300-2320, 2350-2450, 2485-2530, 2600-2610)
- `frontend/src/components/editors/NodeEditor.tsx` (righe 1-60, 320-365, 440-470, 530-545, 600-700)
- Grep sistematici su `frontend/src`, `frontend/coevolution-tests`, `frontend/scripts`,
  `vite.config.ts`, `tsconfig.json`, `package.json` per: `routing/classic`, `edges/routing`,
  `edges/derived`, `DerivedReferenceEdge`, `anchorStart|anchorEnd|segmentOffsets`,
  `SizeInput|GenericInput|asEdge` (in NodeEditor).

## Consumer trovati per ciascun punto

### (a) `edges/routing/classic` — import in ingresso

| File:riga | Cosa | Azione |
|---|---|---|
| `GraphDataElements.tsx:64-68` | import `computePoints`, `snapSegmentsToBorders`, `computeHeadPosition`, `computeRouting`, `roundManhattanCorners` | aggiornare path |
| `GraphDataElements.tsx:2309, 2393, 2440, 2485` | commenti che citano il path `edges/routing/classic` | aggiornare path nei commenti (parte del rename, non cleanup) |
| `DerivedReferenceEdge.tsx:12-13, 19` | import `computeRouting`, `roundManhattanCorners`, `type RoutingInput` + commento | aggiornare path (il file muore comunque al punto b) |

Nessun alias in `vite.config.ts`/`tsconfig.json`; nessun riferimento in `package.json`,
`coevolution-tests/`, `scripts/`. Il test interno (`__tests__/routing.test.ts`) usa solo import
relativi (`../stride`, ecc.): trasloca con la directory senza edit. L'unico "classic" testuale
interno alla lib è prosa in `round.ts:4` ("classic edges"), non un path: resta.
Il rename NON tocca nomi di funzioni/classi esportate (`computeRouting`, `roundManhattanCorners`,
`svgLetterSize`, ecc. invariati); i getter L-layer `get_segments`/`get_d`/`headPos_impl` in
GraphDataElements restano intatti (API JjScript).

### (b) `DerivedReferenceEdge` — consumer

| File:riga | Tipo | Verdetto |
|---|---|---|
| `joiner/components.tsx:13` | export barrel (→ `ExecuteOnRead.ts:15,94` copia su `windoww` per la eval dei jsxString, mai eseguita a runtime) | censito dal report (categoria (d)/Stadio 6, dead a runtime) — rimuovere la riga |
| `common/DV.tsx:1243, 1281` | occorrenze DENTRO template string (backtick, `DefaultView.model()`), non JSX compilato: nessun import, si risolverebbe su `windoww` solo alla eval mai eseguita | string-level, censito — DV.tsx critical zone, NON toccato |
| `redux/VersionFixer.tsx:988, 991` | soli commenti | critical zone, NON toccato; innocuo |
| `joiner/index.ts` | nessun re-export nominale di DerivedReferenceEdge | nessuna azione |

**Nessun consumer vivo non censito** → rimozione confermata: delete di
`src/edges/derived/DerivedReferenceEdge.tsx` (unico file della dir `edges/derived/`, che sparisce)
+ rimozione della riga di export dal barrel.

### (c) Campi DEdge `anchorStart`/`anchorEnd`/`segmentOffsets` — uso a runtime

| Sito | Verdetto |
|---|---|
| `NodeEditor.tsx:650-690` (sezione "EDGE ANCHORS") | **unico consumer UI vivo** citato dal report (Rischio 2 / decisione (3)) → rimuovere (= punto d) |
| `GraphDataElements.tsx` (getter/setter proxy: `get/set_segmentOffsets` 2273-2280, letture nei getter routing 2361-2362, 2419-2420, 2442, 2603; `assignEdgeAnchor` 885-905; dichiarazioni campo 1866-1870, 2141, 2518-2522) | parte dell'API proxy L-layer che RESTA (i getter routing sono l'API JjScript mantenuta al punto a) → intatti |
| lib routing (`points.ts`, `segments.ts`, `types.ts`) | interna alla lib mantenuta → intatta |
| `joiner/classes.ts:1011-1012` (default `'0'` alla creazione DEdge) | inizializzazione D-layer, non "uso" — fuori dallo scope del report → intatta |
| `common/sharedTypes.tsx:126-127` | tipi del template engine (traslocati allo Stadio 1) → intatti |
| `DV.tsx` (props nei template string) | string-level, critical zone → intatto |

Nessun VersionFixer (decisione ratificata): i campi restano orfani nei salvataggi.

### (d) Sgancio NodeEditor

Sezione "EDGE ANCHORS" = `NodeEditor.tsx` righe 649-690 (blocco `{isEdge && asEdge && (<Section
title="EDGE ANCHORS" ...>)}` incluso il commento). Verifiche di sicurezza:
- `SizeInput` e `GenericInput` restano usati altrove nel file (righe 443, 450, 469, 532, 542) →
  import invariati;
- `asEdge` resta usato per `edgeStart`/`edgeEnd` (361-362) → dichiarazione invariata;
- le classi SCSS `node-editor__edge-anchors` ecc. NON vengono rimosse dagli SCSS (regola: le
  classi sono API; niente cleanup di codice non richiesto).

## Piano dei commit

1. `refactor(edges): rename routing lib classic -> manhattan` — `git mv
   src/edges/routing/classic src/edges/routing/manhattan`; aggiornati i path di import (5 in
   GraphDataElements, 2 in DerivedReferenceEdge) e i 5 commenti-path (4 GraphDataElements +
   1 header DerivedReferenceEdge). Grep post: zero `routing/classic` in `src/`.
2. `refactor: remove DerivedReferenceEdge` — delete `src/edges/derived/DerivedReferenceEdge.tsx`
   (+ dir), rimozione riga 13 dal barrel `joiner/components.tsx`.
3. `refactor(editors): remove classic-era edge anchor editing from NodeEditor` — rimozione
   sezione EDGE ANCHORS (NodeEditor.tsx 649-690).
4. `docs: discovery report + log entry stadio 6` — questo report + entry in
   `docs/claude-code-log.md`.

Gate dopo ogni commit: typecheck (delta 0 su baseline 14), `npm run build` (solo chunk-warning),
IR test 47/47; `npm run test` completo a fine cantiere (baseline 874 passed).

## Rischi

- **Superficie `windoww`**: post commit 2, `windoww.DerivedReferenceEdge` non è più registrato;
  un jsxString persistito che lo nomina darebbe ReferenceError SE eseguito — ma la eval dei
  jsxString non avviene più (classic smontato, Stadio 5); identico al Rischio 1 del report padre,
  già accettato per gli altri componenti purgati allo Stadio 4.
- **NodeEditor**: la sezione era `defaultOpen={false}` e agiva su campi che nessun renderer vivo
  legge (classic smontato); rimozione = zero impatto funzionale sull'editor v2. I campi restano
  scrivibili via JjScript (proxy L intatto).
- **Test della lib**: `routing.test.ts` trasloca col rename; nessun path assoluto interno.
- **VIEWS_RECOMPILE**: resta acceso (Fase 5, fuori scope) — nessun file del reducer toccato.
- **Critical zone**: nessuno degli 8 file intoccabili viene modificato (DV.tsx e VersionFixer.tsx
  contengono riferimenti string-level/commenti a DerivedReferenceEdge che restano innocui).

## Domande aperte per Alfonso

Nessuna bloccante. Una nota: `joiner/classes.ts:1011-1012` continua a inizializzare
`anchorStart`/`anchorEnd` a `'0'` su ogni DEdge nuovo (default innocuo, letto solo dai getter
routing mantenuti). Se in futuro si vorrà lo scrub completo dei campi, quel default andrà rimosso
insieme ai getter — fuori dallo scope ratificato dello Stadio 6.
