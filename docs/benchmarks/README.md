# Benchmark baseline — Fase 0 (classic vivo, pre-rimozione)

Harness riproducibile per la baseline di performance del piano di deprecazione
del classic editor (sessione 2026-07-17_2). I numeri qui sotto sono la
fotografia PRIMA di ogni rimozione; la Fase 4 ripete la misura sull'interprete
IR e confronta.

## Harness

- `frontend/scripts/benchmarks/generate_synthetic_model.py` — genera
  `bench.ecore` (Board ⊃ Task{name,done,weight,next*}) e `bench.xmi`
  (default: 500 Task, 1000 next-link; seed deterministico 42).
- `frontend/scripts/benchmarks/bench_baseline.mjs` — driver Playwright sulla
  build di produzione: progetto offline fresco per run, import ecore+xmi,
  apertura modello, misure flow, mutazione singola, attivazione viewpoint
  Default, switch classic.

Esecuzione:

```bash
cd frontend
python3 scripts/benchmarks/generate_synthetic_model.py 500 1000 scripts/benchmarks
npm run build && npx vite preview --port 3001 &
node scripts/benchmarks/bench_baseline.mjs http://localhost:3001/ docs/benchmarks/results.json
```

Prerequisiti: `playwright-core` risolvibile, Chromium (`PLAYWRIGHT_CHROMIUM`
o `/opt/pw-browsers/chromium`).

## Metriche

| Metrica | Cosa misura |
| --- | --- |
| `t_import_ecore_ms` / `t_import_xmi_ms` | import file → dialog di successo |
| `t_mount_flow_nodes_ms` | click sul modello → 500 nodi RF nel DOM |
| `t_edges_settle_ms` | click → conteggio edge RF stabile per 30s |
| `t_responsive_after_open_ms` | click → main thread risponde a un probe sub-secondo |
| `edit_flow.ms` | SetFieldAction su un DValue → valore visibile nello store + 2 rAF |
| `commits_*` | commit React nella finestra (hook DevTools iniettato) |
| `t_viewpoint_activation_block_ms` | selezione viewpoint Default → main thread di nuovo reattivo |
| `t_mount_classic_ms` | click toggle classic → DOM classic popolato |

## Risultati 2026-07-18 (500 Task / 1000 link)

Ambiente: container cloud condiviso (8 GB RAM, CPU contesa), build di
produzione servita da `vite preview`, Chromium headless. I tempi assoluti NON
sono confrontabili con l'hardware di sviluppo (M3); il confronto valido è
same-machine (questa baseline vs l'interprete IR in Fase 4, stesso harness).

| Metrica | run1 (carico minimo) | run4 | run5 |
| --- | --- | --- | --- |
| import ecore | 136 ms | 119 ms | 125 ms |
| import xmi (502 oggetti) | 1.6 s | 1.8 s | 2.3 s |
| mount flow (500 nodi) | **163 s** | 530 s | 771 s |
| responsive dopo open | 195 s | 561 s | — |
| edge RF renderizzati | 986/1000 | 986 | 986 |
| commit React durante open | 582 | 1508 | 1514 |
| mutazione singola (store settle) | — | 18.3 s | **16.1 s** |
| commit React per la mutazione | — | 23 | 21 |
| attivazione viewpoint Default (block) | — | — | **649 s** |
| mount classic (dal click) | — | — | 651 s (4444 elementi DOM) |
| commit React mount classic | — | — | 5 |

Note di lettura:

1. **Il mount flow è dominato dalla creazione vertex/edge al primo open** (il
   main thread resta bloccato: `t_responsive_after_open_ms` > mount). La
   varianza run1→run5 (163→771 s) è carico del container (typecheck/build
   concorrenti in run4/5); il valore meno inquinato è run1.
2. **La mutazione singola costa ~16 s di settle** con ~21 commit React: è la
   firma dell'amplificatore documentato nel discovery report (dispatch async
   per-field, batchedUpdates commentato). Questo è il numero che l'interprete
   IR con dependency set deve abbattere.
3. **L'attivazione del viewpoint Default blocca il main thread ~11 min** su
   500 oggetti (ricompilazioni VIEWS_RECOMPILE_* + scoring). Anche questo è
   baseline: la risoluzione indicizzata IR non passa da quel percorso.
4. 986 edge su 1000: 14 link mancanti al settle (coerente col bug noto "edge
   non tracciabile nel flow", candidati in discovery §5.3; non investigato qui).
5. `rf_nodes = 501` include il ghost/stub node; `classic_nodes = 4444` conta
   gli elementi DOM `[id^=Pointer]` del GraphContainer (nodi + field).

File: `2026-07-18_baseline_run{1,4,5}.json` in questa cartella.
