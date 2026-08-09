# Ripresa lavoro — Viewpoint IR su EditorV2 (post chiusura cantiere persistenza)

## Contesto
Leggi dal knowledge base, in quest'ordine:
1. `claude/sessione_2026-07-19.md` — sessione completa: cantiere persistenza CHIUSO (smoke 8/8), incident bbb risolto (blob corrotto da save interrotto), indagini cloud, backlog paper P1/P2, prossimi passi.
2. `claude/spec_2026-07-18_ir_schema_v1_2.md` — spec IR v1.2 emendata (sez. 6 palette fallback, sez. 7 persistenza + persistWaypoints esteso, sez. 8 irCollapsed, sez. 11 delega default).
3. Al bisogno: `claude/sessione_2026-07-18.md` (checklist 7/7, merge, delega CSS, palette) e i due discovery cloud (`claude/discovery_2026-07-19_de_entanglement_graph.md`, `claude/discovery_2026-07-19_dvalue_duplicati_import_xmi.md`).

## Stato
- Branch `alfonso-frontend-jjtl` pushato e pulito: `12f7b32bf` (Fase 2 persistenza, verificata smoke 8/8) + commit docs (3 discovery report + log). Test IR 41/41, typecheck **33 = baseline** (la cifra "14" è stale), build verde.
- Persistenza operativa: `DVertex.irEdgeLayout` (lati + waypoints degli edge sintetici) e `DVertex.irCollapsed`, write-through a fine gesto, seed all'attivazione del viewpoint IR, gate `persistWaypoints` esteso (waypoints + pin).
- Cruscotto: artefatto desktop **jjodel-viewpoint-ir-tracker** — aggiornarlo a ogni avanzamento (basta chiedere "aggiorna il cruscotto").
- Test bed pronto (id fissi `Pointer_TB*`): `sm.ecore` + `sm.xmi` + `snippet_transitions.js` (viewpoint persistente + NoPersist) + `snippet_containment.js` (Machine collassabile). Files consegnati in chat il 19/07.
- Guardrail: comandi git dalla RADICE del repo (non `frontend/`); salvare SEMPRE prima dei refresh nei test round-trip; **non interrompere i salvataggi** (il save non è atomico: può corrompere il blob del progetto, è un todo aperto); critical zone = two-phase + LIR + hard stop; niente verifiche via console.log in prod.

## Da fare (in ordine)
1. **Benchmark M3**: passare a Claude Code `claude/2026-07-19_prompt_benchmark_m3.md` (tree fermo, ora lo è). Coi numeri: decisione backend ReadCtx (proxy L vs D-diretto) in chat. Sblocca la reattività cross-oggetto.
2. **Verifica duplicati XMI** (5 min): snippet console nel report duplicati → attese due righe per feature (mirage + import) su un oggetto importato. Con la conferma: generare il prompt di fix chirurgico su `XMIService.ts` (riuso dello slot mirage) + valutare bonifica VersionFixer.
3. **7 OQ del de-entanglement** (report nel KB, §8): rispondere in chat → generare i prompt degli Stadi 0-1 (poi 2-5 in serie). Le due pesanti: i getter routing (`segments`/`d`/`headPos`) sono API JjScript da mantenere? quando si spegne VIEWS_RECOMPILE/jsxString nel reducer?
4. **Cantiere seriale successivo**: wiring connect gesture + containment drop (plan già derivato e testato in `irInteraction.ts`; prompt two-phase da generare). NON in parallelo con altri cantieri della zona seriale.
5. **Design authoring IR** (sessione dedicata in chat): superfici (tree view + properties panel + canvas preview), Basic/Advanced, "Suggest syntax" a tre livelli (strutturale / PoN-neutro / domain-aware via Jjodie), theming BASE_CSS, `IconSource` (bi | SVG inline). Da qui dipende il paper P1; il paper P2 (IR-as-contract) è scrivibile già ora.

Todo minori in coda (riempitivo, branch separato): save atomico (media), styling di linea sugli edge sintetici (bassa), placeholder view legacy, popover enum path IR, marker SVG, fixture dietro flag, log laneA.

Partiamo dal punto 1.
