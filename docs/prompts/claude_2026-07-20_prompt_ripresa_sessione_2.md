Ripresa lavoro — Viewpoint IR su EditorV2 (post de-entanglement 0-5 e indagini rendering)

Contesto
Leggi dal knowledge base, in quest'ordine:

1. `claude/sessione_2026-07-20.md` — checkpoint completo: benchmark M3 + decisione ReadCtx (proxy L), 7 OQ ratificate, de-entanglement Stadi 0-5 (0-3 pushati, 4+5 in patch), fix XMI in patch, root cause edge mancanti e trickle, prompt sequenziati.
2. Al bisogno: `claude/discovery_2026-07-20_trickle_edge_settle.md` (trickle render-side), `claude/discovery_2026-07-19_edge_mancanti_986_1000.md` (overflow handle, 514/1500), `claude/report_2026-07-20_fix_xmi_duplicati.md` (fix XMI + analisi bonifica VersionFixer), `claude/spec_2026-07-18_ir_schema_v1_2.md`.

Stato

* Origin `alfonso-frontend-jjtl` a `2d312654f`. In attesa di `git am` di Alfonso (dalla RADICE del repo): 2 patch Stadi 4+5 (purge barrel + delete graph/, ~3.400 righe) e 2 patch fix XMI (riuso slot mirage in XMIService.ts). Basi identiche su `2d312654f`, file disgiunti, ordine libero. Le patch sono state consegnate nella chat del 19-20/07: se non ancora applicate, recuperarle da lì (il container cloud della vecchia sessione NON persiste: clone e worktree sono da ricreare al bisogno).
* Dopo il git am: typecheck locale atteso 33 (baseline; quella cloud è 14), smoke completo (load progetto, viewpoint IR, default delegate, editing, undo, fallback displayError con jsxString invalido, import XMI senza righe duplicate + edit di un attributo importato), poi push.
* Decisioni prese: ReadCtx resta proxy L; 7 OQ de-entanglement ratificate (dettagli nel checkpoint); sequenza fix rendering: PRIMA EdgeLabelRenderer, POI clamp handle.
* Prompt pronti nel KB: `claude/2026-07-20_prompt_fix_trickle_edgelabel.md` (fix labels + commit dei 2 discovery report + benchmark prima/dopo obbligatorio) e `claude/2026-07-20_prompt_fix_handle_clamp.md` (critical zone, LIR incluso, richiede go-ahead esplicito, SOLO dopo il fix labels).
* Cruscotto: artefatto desktop jjodel-viewpoint-ir-tracker, aggiornato al 20/07; aggiornarlo a ogni avanzamento (basta chiedere "aggiorna il cruscotto").
* Guardrail invariati: comandi git dalla RADICE; save non atomico (non interrompere i salvataggi); critical zone = two-phase + LIR + hard stop (useJjomSync, canvasToJjom, portDistribution, VersionFixer); niente verifiche via console.log in prod; test bed Pointer_TB* (sm.ecore/sm.xmi + 2 snippet, chat del 19/07).

Da fare (in ordine)

1. Esito git am + smoke + push dei 2 set di patch. Con l'esito: aggiornare cruscotto e log. Se qualcosa fallisce nello smoke: root cause in chat prima di qualunque fix.
2. Passare a Claude Code `claude/2026-07-20_prompt_fix_trickle_edgelabel.md`. Coi numeri del benchmark prima/dopo: review in chat.
3. Go-ahead sul clamp handle → passare `claude/2026-07-20_prompt_fix_handle_clamp.md` → attesi ~1500/1500 edge; smoke visivo sovrapposizioni.
4. Cantiere seriale successivo: wiring connect gesture + containment drop (plan in irInteraction.ts; generare il prompt two-phase). NON in parallelo con altri cantieri della zona seriale.
5. In coda: Stadio 6 de-entanglement (rename `edges/routing/classic` → `edges/routing/manhattan`, DerivedReferenceEdge, campi DEdge + sgancio NodeEditor) · decisione bonifica VersionFixer per progetti con slot XMI duplicati già salvati (analisi nel report fix) · leve trickle 2-4 (EndpointHandles, coalescing updateNodeInternals, micro-fix querySelector) · spegnimento VIEWS_RECOMPILE alla Fase 5 IR.
6. Quando vuoi aprirli: sessione design authoring IR (da cui dipende il paper P1); paper P2 (IR-as-contract) scrivibile da subito.

Todo minori in coda (riempitivo, branch separato): save atomico (media), styling di linea sugli edge sintetici (bassa), placeholder view legacy, popover enum path IR, marker SVG, fixture dietro flag, log laneA, correzione denominatore README benchmark (entra nel task clamp).

Partiamo dal punto 1.
