# Prompt Claude Code — Fix edge mancanti: clamp handle in portDistribution (CRITICAL ZONE, con LIR)

**Data**: 2026-07-20
**Branch di lavoro**: `alfonso-frontend-jjtl`
**Tipo**: fix chirurgico in CRITICAL ZONE (`portDistribution.ts`). Un commit + docs.
**QUANDO**: SOLO dopo il fix EdgeLabelRenderer (prompt 2026-07-20_prompt_fix_trickle_edgelabel) verificato col benchmark: questo fix porta a rendering ~514 edge in più a scala 1000 (+52% di subscription), farlo prima peggiorerebbe il trickle. Richiede il GO-AHEAD esplicito di Alfonso su questo prompt.
**Fonte di verità**: `docs/discovery/discovery_2026-07-19_edge_mancanti_986_1000.md` (committato col prompt precedente).

## Layer Impact Report (prodotto in chat di progetto, 2026-07-20)

```
LAYER IMPACT REPORT

Layers touched:
  [x] Canvas v2-flow (ReactFlow nodes/edges): handleId assegnati agli edge
  [ ] D-layer / [ ] L-layer / [ ] JjOM / [ ] Sync layer / [ ] Persistence

What changes: computePortDistribution STEP 3 smette di emettere indici handle
  oltre la capacità del pool DOM (MAX_HANDLES_PER_SIDE=4): gli edge eccedenti
  per bucket (nodo, lato, ruolo) condividono l'ultimo handle del lato invece
  di puntare a un handle inesistente ed essere scartati da React Flow.
What does NOT change: nessuna scrittura D/L; nessun campo persistito (gli
  handleId sono sessione-relativi, MAI persistiti: decisione D4 del 19/07);
  bucket keys role-aware invariate; STEP 4/5 invariati; DynamicHandles invariato.
Cross-layer interaction: solo verso React Flow (matching handleId → handle DOM).
Side-effect safety: edge già entro capacità ricevono gli stessi indici di oggi
  (il clamp è un min(), identità per index < 4). Il rischio è solo visivo:
  sovrapposizione delle ancore sui nodi ad alto grado.

Smoke-test scenarios potentially affected:
  - import Families.ecore: attesi gli stessi edge di oggi (nessun nodo satura)
  - benchmark 1000: attesi 1500/1500 edge renderizzati (oggi 986)
  - progetto reale con nodo ad alto grado: edge prima invisibili ora visibili
    e sovrapposti sull'ultima ancora del lato
  - viewpoint IR con edge sintetici: pin di lato e waypoints invariati
```

## COSA

1. Two-phase ridotto: leggere `frontend/src/components/editor-v2/utils/portDistribution.ts` per intero e confermare che STEP 3 assegna `handleId = ${side}-${index}` senza limite (righe ~162-178 nel discovery, indicative) e che `MAX_HANDLES_PER_SIDE = 4` (~riga 258). Se il codice reale differisce dal discovery: STOP e segnalare.
2. Applicare il clamp nel punto di assegnazione: `const handleId = `${side}-${Math.min(index, MAX_HANDLES_PER_SIDE - 1)}`;`. Diff minima, nient'altro.
3. NON toccare STEP 4/5, le bucket keys, `getNextFreeHandleIndex`, `DynamicHandles.tsx`.
4. Guard di sviluppo (OQ3 del discovery, approvato): dove avviene il clamp, un unico `console.warn` throttled (es. una volta per nodo per sessione) SOLO in dev (`import.meta.env.DEV`) che segnala l'overflow: il drop silenzioso non deve tornare invisibile. Se il file ha già un pattern di logging condizionale, usare quello.

## Gate e misura

- `npm run typecheck` (33, delta zero) + `npm run build` + suite senza peggioramenti.
- Benchmark 1 run: attesi ~1500/1500 edge renderizzati a scala 1000; riportare settle e mutazione per confronto col post-fix-labels (json in `docs/benchmarks/` con suffisso `_m3_postfix-clamp`).
- Smoke visivo di Alfonso: progetto reale + scenario benchmark, verifica sovrapposizioni accettabili.

Commit: `fix(editor-v2): clamp handle index to pool capacity so high-degree edges render`

## Vincoli

- Critical zone: se durante la lettura emerge QUALSIASI consumer degli indici > 3 (per esempio codice che deriva posizioni dall'indice senza passare dal DOM), STOP e segnalare prima di applicare.
- La policy round-robin di distribuzione dell'eccedenza (OQ1 del discovery) è ESCLUSA da questo fix: eventuale evoluzione separata.
- La correzione del denominatore nel README benchmark (986/1500, di cui 978/1000 next) può entrare nel commit docs di questo task.
- Aggiornare `docs/claude-code-log.md` (Layer Impact Report: produced, riferimento a questo prompt).
- Hard stop finale: report con hash, gate, numeri benchmark, output del guard in dev.
