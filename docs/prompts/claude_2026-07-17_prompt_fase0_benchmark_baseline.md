# Prompt Fase 0 — Benchmark baseline di rendering: classic vs flow (prima di ogni rimozione)

**Data**: 2026-07-17 18:18
**Tipo**: feat (harness dev-only; zero impatto sul comportamento di produzione)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Prerequisito di lettura**: `CLAUDE.md` (fonte di verità; in caso di conflitto, segnalare e fermarsi); `docs/discovery/discovery_2026-07-17_classic_editor_deprecation_viewpoint_v2.md`, §4-ter (hotspot di performance: tutte le voci [SOSPETTO] richiedono misura, nessun profiling esiste nel repo).

## Contesto (autocontenuto)

Il classic editor (v1) verrà rimosso e sostituito da un interprete IR in EditorV2 (spike già committato: `components/editor-v2/viewpoint/ir/`). La claim di performance dell'interprete deve diventare verifica: serve una baseline misurata sul classic PRIMA della rimozione, altrimenti il confronto si perde per sempre. Questo prompt costruisce un micro-benchmark riproducibile e registra la baseline su classic e flow.

Metriche concordate: (1) mount time dell'editor; (2) latenza di una mutazione singola (dispatch → DOM aggiornato); (3) conteggio re-render su mutazione singola; (4) latenza di una raffica di 20 mutazioni sequenziali (misura l'amplificatore del dispatch async per-field, `action.ts:349`). Serie di scala: 100, 300, 500 nodi (con edge ≈ 2× nodi). Il modello sintetico è generato dall'harness, non caricato da file.

## COSA

1. **Modulo harness dev-only** in `frontend/src/dev/benchmark/` (cartella nuova):
   - `syntheticModel.ts`: genera un progetto sintetico parametrico: metamodello minimo (una metaclasse `BenchNode` con attributo string `name`, attributo boolean `flag`, reference `next` verso `BenchNode` con upperBound -1) + modello M1 con N oggetti e ~2N valori di reference distribuiti (catena + collegamenti casuali con seed fisso, NIENTE Math.random senza seed: generatore deterministico). Creazione via path canonici dell'app (azioni/factory correnti), MAI scritture dirette nello store. Vertici con posizioni a griglia per entrambi gli editor. Id deterministici e idempotenti (secondo run = riuso, non duplicazione).
   - `metrics.ts`: strumenti di misura: mount time (da trigger di mount a doppio requestAnimationFrame dopo il primo commit); latenza mutazione (da dispatch di una SetFieldAction su `name` di un oggetto centrale a MutationObserver che vede il DOM aggiornato, con timeout di guardia); raffica (20 SetFieldAction sequenziali, tempo totale a DOM quiescente); conteggio re-render via callback `onRender` del `<Profiler>` React (vedi punto 2).
   - `runBenchmark.ts`: registrazione `window.__jjodelBenchmark = { setup(n), run(opts), results() }`. `setup(n)` genera il progetto sintetico; `run({editor: 'classic'|'flow', runs: 3})` esegue le misure sull'editor correntemente visibile e accumula; `results()` stampa e restituisce JSON completo (mediana su 3 run per metrica, ambiente: user agent, timestamp, conteggi nodi/edge). L'harness NON cambia editor da solo: il toggle lo fa Alfonso dalla UI (EditorSwitch), l'harness verifica solo quale modalità è attiva e la registra nel risultato.
2. **Wrapper Profiler in EditorSwitch** (`components/abstract/tabs/EditorSwitch.tsx`): avvolgere il contenuto renderizzato in un `<Profiler>` React SOLO quando `window.__jjodelBenchActive === true` (altrimenti render identico a oggi, nessun Profiler montato). Il callback accumula conteggio commit e actualDuration in una struttura letta da `metrics.ts`. Diff minima, nessun altro comportamento di EditorSwitch toccato.
3. **Import del modulo**: un import side-effect di `runBenchmark.ts` dallo stesso `EditorSwitch.tsx` (o punto di mount equivalente già toccato), così `window.__jjodelBenchmark` esiste senza altri file modificati.
4. **Baseline registrata** in `docs/benchmarks/` (cartella nuova): `baseline_2026-07-17_classic_vs_flow.md` (tabella risultati per editor × scala × metrica, ambiente di esecuzione, istruzioni di riproduzione) + `baseline_2026-07-17_raw.json` (output integrale). I numeri arrivano dai run manuali di Alfonso (vedi COME).

## DOVE (scope stretto, elenco chiuso)

File modificati:

- `frontend/src/components/abstract/tabs/EditorSwitch.tsx` (SOLO wrapper Profiler condizionale + import side-effect)

File nuovi:

- `frontend/src/dev/benchmark/syntheticModel.ts`
- `frontend/src/dev/benchmark/metrics.ts`
- `frontend/src/dev/benchmark/runBenchmark.ts`
- `docs/benchmarks/baseline_2026-07-17_classic_vs_flow.md`
- `docs/benchmarks/baseline_2026-07-17_raw.json`
- `docs/discovery/discovery_2026-07-17_benchmark_harness_seams.md` (report Fase A; se la data di esecuzione è diversa, usare quella)
- entry in `docs/claude-code-log.md` a fine task

VIETATO toccare: `useJjomSync.ts`, `portDistribution.ts` (critical zone), `defaultViewTemplate.ts`, `common/DV.tsx`, `VersionFixer.tsx`, `reducer.ts`, `selectors.ts`, `action.ts`, qualunque file sotto `graph/` e sotto `components/editor-v2/` (il modulo ir/ dello spike compreso). L'harness osserva e dispatcha azioni esistenti, non modifica nessun motore. Se una modifica a questi file sembra necessaria, fermarsi e segnalare.

Nessuna nuova dipendenza esterna: solo API browser (performance.now, MutationObserver, requestAnimationFrame) e `<Profiler>` di React 18, già disponibile.

Prima di introdurre i nuovi identificatori (`__jjodelBenchmark`, `__jjodelBenchActive`, `BenchNode`, nomi esportati): `grep -r` globale per collisioni.

## COME

### Fase A — Verifica mirata (read-only, prima di scrivere codice)

Report OBBLIGATORIO in `docs/discovery/discovery_2026-07-17_benchmark_harness_seams.md` (obiettivo, file letti con path, findings, rischi, domande aperte). Da verificare:

1. Il path canonico per creare programmaticamente metamodello, modello, oggetti, valori di reference e vertici con posizione (riferimenti utili: la fixture dello spike `irDemoFixture.ts` per il pattern di creazione idempotente; `examples/StateMachine/views/index.ts`; le factory usate dai path di drop di EditorV2 SOLO come lettura, per capire le azioni giuste). Attenzione nota di progetto: gli id di `DObject.new()` sono temporanei.
2. Come rilevare a runtime quale editor è attivo (il toggle 3-stati di EditorSwitch, localStorage `jjodel.editorPrefs.${modelid}`) senza modificare EditorSwitch oltre il wrapper Profiler.
3. Se il mount dell'editor è ri-triggerabile senza reload (cambio tab, cambio modalità) per misurare il mount time in modo ripetibile; altrimenti la metrica mount si misura con hard refresh cronometrato dall'harness via `performance.mark` persistito (decidere e documentare nel report).
4. Un target DOM affidabile per il MutationObserver in entrambi gli editor (classic: il nodo con `data-nodeid`; flow: il testo dentro `.mm-node`), senza dipendere da classi che potrebbero cambiare.

HARD STOP condizionale: fermarsi e riportare in chat SOLO SE la generazione programmatica del progetto sintetico richiede modifiche a file vietati o scritture dirette nello store fuori dai path canonici. Altrimenti proseguire.

### Fase B — Implementazione e misura

**Commit 1** `feat: add dev benchmark harness for classic vs flow baseline`: i 3 file dell'harness + wrapper Profiler. Verifica gate: `npm run build` verde; app visivamente identica con `__jjodelBenchActive` non settato (hard refresh su http://localhost:3001/).

**HARD STOP**: conferma visiva di Alfonso, poi Alfonso esegue i run secondo queste istruzioni (da riportare pari pari nel messaggio di hard stop):

1. Hard refresh, `window.__jjodelBenchActive = true`, `window.__jjodelBenchmark.setup(100)`.
2. Con editor classic attivo: `window.__jjodelBenchmark.run({editor:'classic', runs:3})`.
3. Toggle a flow dalla UI: `window.__jjodelBenchmark.run({editor:'flow', runs:3})`.
4. Ripetere i punti 1-3 con `setup(300)` e `setup(500)`. Se il classic a 500 nodi è inutilizzabile (timeout, freeze), registrare il fatto come dato: È un risultato, non un fallimento del benchmark.
5. `window.__jjodelBenchmark.results()` e incollare il JSON a Claude Code.

**Commit 2** `docs: record rendering baseline classic vs flow`: baseline md + raw json dal JSON incollato + entry nel log. Nella baseline md riportare esplicitamente: le metriche NON coprono l'interprete IR (verrà misurato con lo stesso harness in Fase 4) e i limiti noti (misure single-machine, browser di Alfonso, no CI).

Git: `git add` dei SOLI file elencati in DOVE, mai `git add .`. Commit message convenzionali, una riga, in inglese.

## RIFERIMENTI

- `docs/discovery/discovery_2026-07-17_classic_editor_deprecation_viewpoint_v2.md`, §4-ter (inventario hotspot con classificazione [COMMENTATO]/[SOSPETTO]: il benchmark è ciò che promuove o smentisce i [SOSPETTO])
- `frontend/src/components/editor-v2/viewpoint/ir/irDemoFixture.ts` (pattern di creazione idempotente dallo spike)
- KB di progetto: `claude/sessione_2026-07-17_2.md` (piano a fasi; questa è la Fase 0)

Fuori scope esplicito: misurare l'interprete IR (Fase 4, stesso harness), profiling con DevTools, ottimizzazioni di qualunque tipo, CI per il benchmark, modifiche ai motori di rendering.
