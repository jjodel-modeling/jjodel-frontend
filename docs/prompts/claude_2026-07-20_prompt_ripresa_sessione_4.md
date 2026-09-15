# Ripresa lavoro — Viewpoint IR su EditorV2 (post fix rendering: labels + clamp chiusi)

## Contesto

Leggi dal knowledge base, in quest'ordine:

1. `claude/sessione_2026-07-20.md` — checkpoint completo con 4 addendum: mattinata (patch applicate, fix modal), chiusura blocco (push @ 4670ab931), fix EdgeLabelRenderer (Addendum 3), clamp handle (Addendum 4).
2. Al bisogno: `claude/discovery_2026-07-20_trickle_edge_settle.md` (leve 2-4 restanti), `claude/discovery_2026-07-19_edge_mancanti_986_1000.md`, `claude/spec_2026-07-18_ir_schema_v1_2.md`, `claude/discovery_2026-07-19_de_entanglement_graph.md` (per lo Stadio 6).

## Stato

- Branch `alfonso-frontend-jjtl`, origin @ `417372c6e` (verificato via ls-remote a fine sessione precedente). Tutto pushato, working tree pulito (salvo `.claude/scheduled_tasks.lock`, session-infra, da lasciare stare).
- **Giornata del 20/07 chiusa**: patch Stadi 4+5 + fix XMI applicate e verificate (smoke a-g verde) · fix modal 1+2 (`4670ab931`) · fix EdgeLabelRenderer (`de5165504`, settle 118-148 s → 38.1 s, ~24 ms/commit) · clamp handle in critical zone con go-ahead (`2ddedca53`, rf_edges 986 → **1500/1500**, settle 42.8 s, smoke ancore ok).
- Benchmark di riferimento: `docs/benchmarks/2026-07-20_baseline_m3_postfix-clamp.json` (M3, seed 42). Commit count ~1600 all'open / 24 per mutazione: INVARIATO, è il target delle leve trickle 2-3.
- Decisioni vive: gate M1 label = hovered||selected||editing||showEdgeLabels (toggle threadato via EditorContext) · overflow handle = clamp semplice, round-robin OQ1 in backlog (bassa) · ReadCtx resta proxy L · VIEWS_RECOMPILE si spegne solo alla Fase 5 IR.
- Cruscotto: artefatto desktop `jjodel-viewpoint-ir-tracker` aggiornato a fine sessione (task 1-7, origin @ 417372c6e).
- Guardrail invariati: git dalla RADICE, npm da `frontend/` · baseline typecheck 33 locale / 14 cloud (pre-esistente noto: EditorV2.tsx:2675) · critical zone (canvasToJjom, useJjomSync.ts, portDistribution.ts) = two-phase + LIR + hard stop + go-ahead · discovery report SEMPRE salvati in `docs/discovery/` col naming `discovery_<data>_<descrizione>.md` · niente console.log in prod (nota: `import.meta.env.DEV` non tipizzato, usare `(import.meta as any).env?.DEV ?? false`) · save non atomico, mai interrompere i salvataggi · test bed `Pointer_TB*`.

## Da fare (in ordine)

1. **Generare il prompt two-phase per il cantiere wiring connect gesture + containment drop** (zona seriale, plan già derivato in `irInteraction.ts`). Fase 1 discovery read-only con report obbligatorio in `docs/discovery/` → hard stop → analisi in chat → Fase 2 solo dopo go-ahead. NON in parallelo con altri cantieri della zona seriale. Stima 1-2 sessioni.
2. Dopo il wiring, il pezzo più duro del Blocco 1: reattività cross-oggetto (dependency set multi-hop, spec sez. 9, 2-4 sessioni).
3. In coda (ordine da decidere con Alfonso): Stadio 6 de-entanglement (rename routing lib in `edges/routing/manhattan`, DerivedReferenceEdge, campi DEdge + sgancio NodeEditor) · leve trickle 2-4 (subscription mirate EndpointHandles, coalescing updateNodeInternals: tagliano il conteggio commit) · bonifica VersionFixer (critical zone) · Fix 3 modal (buildImportSummary.ts:151-164) + save atomico + riempitivi minori · riverifica nota §5.3 README benchmark ("edge non tracciabile": probabilmente era l'overflow, ora fixato).
4. Aperture su richiesta: sessione design authoring IR (prerequisito paper P1); paper P2 scrivibile da subito.

Partiamo dal punto 1.
