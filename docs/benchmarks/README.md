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
| edge RF renderizzati | 986/1500 | 986 | 986 |
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
4. 986 edge su **1500** (non su 1000): 978/1000 next + 8/500 tasks (containment
   Board→Task). I 514 mancanti NON sono il bug "edge non tracciabile nel flow"
   ma overflow dell'indice handle oltre `MAX_HANDLES_PER_SIDE=4` con drop
   silenzioso di React Flow — root cause confermata in
   `docs/discovery/discovery_2026-07-19_edge_mancanti_986_1000.md`. Risolto dal
   clamp in `portDistribution.ts` (2026-07-20):
   `2026-07-20_baseline_m3_postfix-clamp.json` misura 1500/1500.
5. `rf_nodes = 501` include il ghost/stub node; `classic_nodes = 4444` conta
   gli elementi DOM `[id^=Pointer]` del GraphContainer (nodi + field).

File: `2026-07-18_baseline_run{1,4,5}.json` in questa cartella.

## Risultati 2026-07-19 (500 Task / 1000 link — MacBook Air M3)

Ambiente: MacBook Air M3 (24 GB, macOS 26.2), Node v23.3.0, HEAD `1f6045f4f`
(branch `alfonso-frontend-jjtl`), stesso harness e stessa procedura (build di
produzione + `vite preview`, Chromium headless). Macchina scarica (solo un dev
server vite idle su :3000, ~0% CPU). Baseline hardware reale; NON confrontare
i tempi assoluti con la tabella cloud sopra (macchina diversa) — il confronto
valido resta same-machine.

| Metrica | run1 | run2 | run3 |
| --- | --- | --- | --- |
| import ecore | 90 ms | 73 ms | 109 ms |
| import xmi (502 oggetti) | 837 ms | 819 ms | 787 ms |
| mount flow (500 nodi) | 18.0 s | 17.6 s | 19.2 s |
| edge settle | 148 s | 119 s | 119 s |
| responsive dopo open | 178 s | 122 s | 144 s |
| edge RF renderizzati | 986/1500 | 986 | 986 |
| commit React durante open | 1538 | 1556 | 1546 |
| mutazione singola (store settle) | 8.9 s | **6.0 s** | 8.9 s |
| commit React per la mutazione | 22 | 22 | 20 |
| attivazione viewpoint Default (block) | — | — | — |
| mount classic (dal click) | — | — | — |

Note di lettura:

1. **Il toggle classic non è stato trovato in nessun run** su questo HEAD
   (`classic_toggle_found: 0`): il selettore viewpoint c'è e il viewpoint
   Default viene attivato dall'harness, ma il pulsante "Concrete syntax only"
   non compare, quindi `t_viewpoint_activation_block_ms` e `t_mount_classic_ms`
   non sono misurabili (l'harness registra il blocco solo dentro il ramo
   toggle). Nel cloud lo stesso era accaduto in run1; solo run5 lo catturò.
2. **Nessuno scenario "viewpoint IR attivo" è documentato in questo harness**:
   non eseguito (richiederebbe un'estensione dedicata, fuori scope qui).
3. Mount nodi ~9× più veloce del cloud run1, ma **l'edge settle resta ~2 min**
   anche su M3: il trickle degli edge post-mount non è dominato dalla CPU
   contesa del container. Idem la firma dell'amplificatore sulla mutazione
   singola: ~6–9 s di settle con ~20–22 commit React.
4. 986/**1500** edge come nel cloud (978/1000 next + 8/500 tasks): i 514
   mancanti sono stabili cross-machine perché l'overflow degli handle è
   deterministico (geometria ELK + ordinamento bucket + drop). Non è il bug
   "edge non tracciabile nel flow"; root cause in
   `docs/discovery/discovery_2026-07-19_edge_mancanti_986_1000.md`, risolta dal
   clamp (2026-07-20, `2026-07-20_baseline_m3_postfix-clamp.json` = 1500/1500).

File: `2026-07-19_baseline_m3_run{1,2,3}.json` in questa cartella (con blocco
`env` annotato a mano dopo il run).
