# Discovery — Ritiro dei log di debug runtime dalla console

**Data**: 2026-07-26
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: chore, basso rischio (Fase 1 — discovery read-only)
**Prompt document**: 2026-07-26 — chore: ritiro dei log di debug runtime dalla console
**Stato**: Fase 1 completata. **Nessuna rimozione eseguita.** Servono 2 decisioni di Alfonso prima della Fase 2 (vedi §6).

---

## 1. Obiettivo

Console pulita in uso normale: rimuovere i log di **dev-trace di debug** tag-brackettati stampati per
render/interazione (famiglia lane produttore/consumatore `[laneA:...]` e analoghi), senza toccare la
logica, la gestione errori, né i log diagnostici intenzionali. Anchor noto: `[laneA:producer]` in
`EditorV2.tsx` (todo 2026-07-18, indicava ~riga 940; oggi riga 996).

## 2. Pattern e file grepati (path completi)

Comandi eseguiti su `frontend/src/` (solo `*.ts`, `*.tsx`):

1. `console\.(log|debug|info)\s*\(` → **931** occorrenze totali (incluse quelle commentate).
2. `console\.(log|debug|info)\s*\(\s*['"`+"`"+`]\[` (primo argomento = stringa che inizia con `[`) → **344** occorrenze (incluse commentate).
3. Stessa (2) filtrando le righe commentate (`^\s*//`) → **~50** occorrenze **attive**, inventariate in §3.
4. `\[lane` → **1** sola occorrenza: `EditorV2.tsx:996`.
5. `console\.(log|debug|info)\s*\(\s*['"`+"`"+`]\[(DEBUG|DIAG|BUG|trace|TRACE|wp|waypoint|anchor|lane|render|diag)` → famiglie self-labeled debug (§3, categoria a).
6. `LANE_DEBUG`, `reconstructEdgePoints`, `LaneRect`, `ReconstructEdge` → consumatori dello scaffold lane (§4).

## 3. Inventario completo (log attivi tag-brackettati)

Legenda categoria: **(a)** da rimuovere · **(b)** da tenere (diagnostica intenzionale / errore) · **(c)** ambiguo o bloccato (non rimuovere in questo task, girato ad Alfonso).

### 3.a — Dev-trace di debug (categoria a, per definizione del prompt)

| Tag | `file:riga` | Cat | Purezza / note |
|-----|-------------|-----|----------------|
| `[laneA:producer]` | `components/editor-v2/EditorV2.tsx:996` | **(c) — bloccato** | **ENTANGLED**. Vive dentro `if (LANE_DEBUG) { ... }` (blocco 974–998) che ricostruisce la geometria degli edge via `reconstructEdgePoints`. Non è un log a sé: rimozione pulita ⇒ togliere l'intero blocco + import riga 52 + export morti in `laneSeparation.ts`. Fuori dal vincolo "sole righe di log". `LANE_DEBUG = true` ⇒ **è la causa dello spam segnalato**. Vedi §4. |
| `[BUG-DIAG-DROP]` ×10 | `components/editor-v2/EditorV2.tsx:1365,1385,1394,1410,1425,1450,1470,1477,1490,1499` | **(a) — pulito** | Ogni statement è `console.log('[tag]', {objectLiteral})` che **legge** valori già calcolati (connection.*, sourceNode?.type, compatibleRefs.map…). Nessun side effect negli argomenti; il control-flow `if/return` è separato dai log. Rimozione riga-per-riga sicura. In-scope (editor-v2, stesso file del lane). Spam su ogni tentativo connect/drop. |
| `[DEBUG-GLOBAL]` | `App.tsx:74` | **(c) — bloccato + fuori scope** | **ENTANGLED**: l'intero `useEffect` (70–84) esiste solo per attaccare un listener globale `mousedown` il cui unico corpo è questo log ("DEBUG: Track mousedown events to diagnose context menu issue"). Rimozione pulita ⇒ togliere tutto lo useEffect, non solo il log. File fuori dall'area editor-v2. |
| `[BUG-DIAG-GUARD]` | `model/conformance/ConformanceGuard.ts:70` | **(c) — fuori scope** | Log puro, ma in `model/conformance/` (fuori editor-v2). Sibling di `[BUG-DIAG-DROP]`. Possibile entanglement con l'array `featureTrace` costruito a monte (da verificare in Fase 2 se autorizzato). |
| `[JjScript-TIMING]` ×2 | `jjscript/components/ScriptBlock.tsx:455`, `jjscript/executor/executor.ts:199` | **(c) — bloccato + fuori scope** | **ENTANGLED**: self-labeled `// TEMP-DISCOVERY`; dipendono da variabili di timing (`_iterStart`, `_parseMs`, `_waitMs`, `_applyMs`, `_tTotalStart`, `_tApplyStart`, `_tParseMs`, `_tLastInput`) misurate a monte solo per alimentare i log. Rimozione pulita ⇒ togliere anche l'apparato TEMP-DISCOVERY su 2 file. Fuori dall'area editor-v2 (jjscript). |

### 3.b — Diagnostica intenzionale / errori (categoria b — tenere verbatim)

| Tag | `file:riga` | Motivo |
|-----|-------------|--------|
| `[VersionFixer 2.x -> 2.y]` ×15 | `redux/VersionFixer.tsx` (636,663,688,709,764,796,830,866,907,949,982,1037,1163 …) | Notice di completamento migrazione; file **critical-zone** (§3.1). Intenzionali. |
| `[XMI …]` ×3 | `services/export/XMIService.ts:56,638,703` | `console.info` diagnostici di import intenzionali. |
| `[Storage.reset]` / `[Storage.hardReset]` | `data/storage.ts:86,104` | `console.debug` diagnostici intenzionali. |
| `[JSX Parse Error]` | `common/jsxErrorView.tsx:31` | `console.debug` su path di errore. |
| `[View Error]` ×2 | `common/DV.tsx:576,580` | `console.debug` su path di errore; **critical-zone** (§3.1). |
| `[jodie] sanitizeForeignFeatureModels` | `types/jodie.ts:636` | `console.info` notice di riparazione intenzionale. |
| `[jjscript recovery]` | `jjscript/components/ScriptBlock.tsx:1100` | Notice di auto-recovery intenzionale. |
| `[NodeTransientProperties.sort]` | `joiner/classes.ts:4079` | `console.debug` diagnostica old-save; file core. |

### 3.c — Ambigui / bloccati (categoria c — non rimuovere, girati ad Alfonso)

| Tag | `file:riga` | Motivo del blocco |
|-----|-------------|-------------------|
| `[useM1ReferenceEdges]` ×2 | `components/editor-v2/hooks/useM1ReferenceEdges.ts:164,183` | **CRITICAL-ZONE** (§3.1/§3.5). Il prompt vieta la rimozione qui: elencare in (c) e fermarsi. |
| `[segDrag]` ×2 | `model/dataStructure/GraphDataElements.tsx:2277,2475` | **GATED** dietro `windoww.__segDragDebug` (flag runtime, OFF di default) ⇒ **non** spamma la console in uso normale. Tooling di debug opt-in, in file core. Tema affine ai waypoint ma non viola l'obiettivo. Leave. |
| `[ProjectEditor]` ×7 | `components/project/ProjectEditor.tsx:1533,1766,1775,1882,1894,1930,1937` | Progress log dell'esecuzione trasformazione (alcuni con emoji ✅). Fuori scope; ambiguo se intenzionali. |
| `[JjTL] PASS/Pass/…` ×7 | `jjtl/executor/executor.ts:461,465,469,473,804,1238,1280` | Progress dell'esecuzione JjTL. Fuori scope. |
| `[JjtlEditor] Full token stream` | `jjtl/editor/JjtlEditor.tsx:54` | Dump del token stream (debug). Fuori scope. |
| `[scuStorm] action` | `redux/reducer/reducer.ts:602` | Debug del reducer core; fuori scope. |

### 3.d — Già commentati (nessuna azione: non stampano)

`[singleton]` (`EditorV2.tsx:706,729`), `[EditorV2] Create View / resolved classId` (`EditorV2.tsx:3074,3080`),
`[ContextMenu] clicked` (`ContextMenu.tsx:44`), `[DEBUG classVertexToRFNode]` (`utils/jjomTransformers.ts:156`),
`[DEBUG …]` in `api/persistance/projects.ts` (125–282) e `pages/components/Project.tsx` (187–280).
Tutti preceduti da `//` ⇒ silenti. Non toccati.

## 4. Focus: lo scaffold `LANE_DEBUG` (l'anchor del task)

```
EditorV2.tsx:52   import { LANE_DEBUG, reconstructEdgePoints, type LaneRect, type ReconstructEdge } from './utils/laneSeparation';
EditorV2.tsx:974  if (LANE_DEBUG) {
      975–992         // costruisce nodeRects + distributedEdges
      994             const reconstructed = reconstructEdgePoints(e, distributedEdges, nodeRects, positions);
      996             console.log('[laneA:producer]', e.id, JSON.stringify(reconstructed));   // ← spam
      997–998      }
laneSeparation.ts:37   export const LANE_DEBUG = true;   // ← perché la console spamma
```

- Il commento del blocco dichiara: *"Gated by LANE_DEBUG; produces no offsets and mutates nothing."* → l'unico effetto osservabile del blocco è il `console.log`.
- `reconstructEdgePoints` / `LaneRect` / `ReconstructEdge` sono importati **solo** da `EditorV2.tsx` (grep confermato).
- Il guard **non** è il caso banale `if (DEBUG) { console.log(...) }`: contiene ~20 righe di scaffold. Per la regola §5-passo-5 del prompt ("se c'è qualsiasi dubbio ... lasciarla e flaggare in (c)") → **non rimosso in questo task**.

## 5. Rischi individuati

1. **Sotto-rimozione del bersaglio**: rimuovere solo la riga 996 lascia `reconstructed` inutilizzato + un blocco `if(LANE_DEBUG)` che calcola e scarta ⇒ dead code (non un miglioramento). `noUnusedLocals` **non** è attivo in `tsconfig.json`, quindi non è un errore di typecheck, ma resta residuo.
2. **Sovra-scope**: `[DEBUG-GLOBAL]`, `[BUG-DIAG-GUARD]`, `[JjScript-TIMING]` vivono fuori da editor-v2 (App.tsx, model/conformance, jjscript) e sono anch'essi entangled (useEffect / featureTrace / var di timing). Rimuoverli tocca 3–4 sottosistemi e supera "sole righe di log".
3. **Critical-zone**: `useM1ReferenceEdges.ts` contiene 2 log della famiglia ma è vietato toccarlo (§3.1/§3.5) → lasciati.
4. **Il testbed `[cd-ir…]`** citato dal prompt non è nel codebase (documenti di progetto): fuori scope, ignorato. Confermato: nessun match `[cd-ir` in `frontend/src`.

## 6. Domande aperte per Alfonso (2 decisioni prima della Fase 2)

**D1 — `[laneA:producer]` (bersaglio, entangled).** Come procedere?
- (A) Rimuovere l'intero blocco `if (LANE_DEBUG) {…}` (974–998) + import riga 52 **solo in `EditorV2.tsx`**; gli export in `laneSeparation.ts` restano come export morti (innocui, nessun errore typecheck). Diff contenuta in 1 file.
- (B) Come (A) **+** rimuovere anche gli export ora morti in `laneSeparation.ts` (`LANE_DEBUG`, `reconstructEdgePoints`, `LaneRect`, `ReconstructEdge`, o l'intero file se dedicato). Tocca un 2° file, non-log.
- (C) Solo `LANE_DEBUG = true → false` (spegne lo spam, mantiene lo scaffold). Non è una rimozione.
- (D) Lasciare per ora.
- *Nota*: (A) è la rimozione minima che uccide lo spam senza refactor cross-file. Consigliata se si vuole restare vicini al vincolo "log-only".

**D2 — Ampiezza di "log di debug-trace di questo tipo".** Fin dove si estende la pulizia?
- (i) **Solo editor-v2**: rimuovere `[BUG-DIAG-DROP]` ×10 in `EditorV2.tsx` (pulito, sicuro) + trattare il lane per D1. Tutto il resto lasciato.
- (ii) **Anche gli altri sottosistemi**: includere `[DEBUG-GLOBAL]` (App.tsx), `[BUG-DIAG-GUARD]` (conformance), `[JjScript-TIMING]` (jjscript) — ognuno entangled, richiede cleanup > log-line su file fuori editor-v2.
- *Nota*: (i) è coerente con "famiglia estesa a editor-v2 e file vicini" e "basso rischio". (ii) massimizza la console pulita ma allarga lo scope a 3–4 sottosistemi.

## 7. Cosa NON è stato fatto (e perché)

- Nessuna riga rimossa: la Fase 1 è read-only e la discovery ha rivelato che (a) il bersaglio è entangled e (b) l'ampiezza è una scelta di Alfonso. Rimuovere autonomamente significherebbe indovinare su D1/D2 (rischio di scope-violation, cfr. §6.4 CLAUDE.md).
- Fase 2 (rimozione scoped + gate build/typecheck/test + entry di log + commit `chore: remove runtime debug console logs (lane waypoints residue)`) parte solo dopo le risposte a D1/D2.
