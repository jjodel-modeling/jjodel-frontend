# Prompt Claude Code — Benchmark comparativo su M3 (harness Fase 0)

**Data**: 2026-07-19
**Branch di lavoro**: `alfonso-frontend-jjtl`
**Tipo**: esecuzione benchmark + commit dei soli risultati. Nessuna modifica al codice applicativo.
**QUANDO**: solo a working tree fermo. NON lanciare mentre il task "Fase 2 persistenza" (o altro task che builda) è in corso: due build concorrenti sulla stessa working tree si corrompono a vicenda.

## Obiettivo

Rifare sul M3 di Alfonso le misure della Fase 0 (fatte nel container cloud, numeri validi solo same-machine) con l'harness canonico committato. I numeri servono a: (1) baseline di riferimento hardware reale; (2) alimentare la decisione sul backend ReadCtx (proxy L vs D-diretto), che verrà presa nella chat di progetto, NON in questa sessione.

## COSA

1. Leggere `docs/benchmarks/README.md` per intero e seguire ESATTAMENTE la procedura documentata (build di produzione, avvio, scenari, output). Il README è la fonte di verità sull'uso dell'harness; questo prompt non la duplica.
2. Eseguire gli scenari documentati della baseline (`node scripts/benchmarks/bench_baseline.mjs` o come da README) sulle stesse scale della Fase 0 (500/1000).
3. Se il README documenta già uno scenario con viewpoint IR attivo, eseguire anche quello. Se NON è documentato: fermarsi lì e segnalarlo nel report; NON estendere l'harness (richiederebbe un prompt dedicato).
4. Salvare i risultati in `docs/benchmarks/` accanto ai json esistenti, con naming coerente coi file presenti più suffisso che identifichi la macchina e la data (es. `_m3_2026-07-19`). Annotare nel json o in una nota: modello macchina (MacBook Air M3), versione Node, versione branch (hash HEAD).
5. Aggiornare `docs/benchmarks/README.md` SOLO se contiene già una tabella risultati da estendere con la riga M3; altrimenti non toccarlo.
6. Riportare a fine task un confronto sintetico M3 vs baseline cloud (mount, mutazione singola, settle, edge renderizzati) in chat, senza trarre conclusioni sul ReadCtx.

## Vincoli

- Nessuna modifica a codice applicativo, harness incluso (eccezione: fix banale di path/invocazione se l'harness non parte, da annotare nel log).
- Verificare prima di iniziare che `git status` sia pulito e che nessun altro task stia girando.
- Un solo commit, soli file risultati (+ eventuale riga README): `docs: add M3 benchmark results (baseline harness)`. Mai `git add .`.
- Aggiornare `docs/claude-code-log.md` a fine task.
- Baseline typecheck di riferimento se servisse: 33 errori.

## RIFERIMENTI

- `docs/benchmarks/README.md` + json risultati cloud esistenti (Fase 0, 2026-07-18).
- Numeri cloud di riferimento (contesto, non confronto diretto: macchina diversa): import xmi 502 oggetti ~1.7s; mount flow 500 nodi 163s run scarico; mutazione singola ~16s settle; edge 986/1000.
- La decisione ReadCtx (proxy L vs D-diretto) si prende in chat con questi numeri: riportarli, non deciderla.
