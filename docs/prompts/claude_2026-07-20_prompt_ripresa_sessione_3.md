Ripresa lavoro — Viewpoint IR su EditorV2 (post apply patch, smoke round-trip, fix modal XMI)

Contesto
Leggi dal knowledge base, in quest'ordine:

1. `claude/sessione_2026-07-20.md` — checkpoint completo CON ADDENDUM mattinata: benchmark M3 + ReadCtx (proxy L), 7 OQ, de-entanglement 0-5, fix XMI, patch applicate, gate locali, falso allarme round-trip, fix 1+2 del modal.
2. Al bisogno: `claude/discovery_2026-07-20_roundtrip_xmi_unknown_metamodel.md` (verdetto pre-esistente + corruzione xmi:id eliminata dal fix), `claude/discovery_2026-07-20_trickle_edge_settle.md`, `claude/discovery_2026-07-19_edge_mancanti_986_1000.md`, `claude/report_2026-07-20_fix_xmi_duplicati.md`, `claude/spec_2026-07-18_ir_schema_v1_2.md`.

Stato

* Macchina di Alfonso, branch `alfonso-frontend-jjtl`: le 4 patch sono APPLICATE (Stadi 4+5 + fix XMI; la 0004 docs è stata rigenerata per un conflitto di contesto sul log, risolto). Gate locali verdi: typecheck 33 = baseline, build ok. In più Claude Code ha implementato i fix 1+2 del modal import (campo `metamodel` nel return di importM1FromXML + warning `xmi:Documentation` declassato a console.info), commit unico autorizzato dalla chat.
* Quindi sopra `2d312654f` (origin) ci sono ~5 commit locali: chiedere ad Alfonso l'esito di smoke e push prima di qualsiasi assunzione. Se il push non è ancora fatto, è il primo passo.
* Smoke round-trip già chiarito: "(unknown metamodel)" e warning Documentation erano pre-esistenti e display-only (riproduzione cloud su entrambe le build); il fix mirage ha anzi eliminato una corruzione reale del round-trip (xmi:id duplicati sui contained). Post-fix modal atteso: "Import successful" pulito col nome del metamodello.
* Decisioni vive: sequenza fix rendering PRIMA EdgeLabelRenderer POI clamp handle (il clamp aumenta del 52% le subscription); ReadCtx resta proxy L; Fix 3 del modal (conteggio "Nested objects" gonfiato, buildImportSummary.ts:151-164) DIFFERITO al riempitivo; bonifica VersionFixer per progetti sporchi = task separato (analisi nel report fix XMI).
* Prompt pronti nel KB: `claude/2026-07-20_prompt_fix_trickle_edgelabel.md` (da passare a Claude Code coi 2 discovery report, benchmark prima/dopo obbligatorio) e `claude/2026-07-20_prompt_fix_handle_clamp.md` (critical zone, LIR incluso, richiede go-ahead esplicito, SOLO dopo il fix labels).
* Cruscotto: artefatto desktop jjodel-viewpoint-ir-tracker con checklist task (spuntare 3-4 quando smoke e push sono confermati, registrando gli hash reali).
* Guardrail invariati: git dalla RADICE, npm da `frontend/`; save non atomico (mai interrompere i salvataggi); baseline typecheck 33 locale / 14 cloud; critical zone = two-phase + LIR + hard stop; niente console.log in prod; test bed `Pointer_TB*`.

Da fare (in ordine)

1. Chiedere ad Alfonso: esito della verifica visiva post-fix del modal, della checklist smoke a-g, e del push. Con la conferma: aggiornare cruscotto (task 3-4 spuntati, hash reali) e chiudere il blocco.
2. Passare a Claude Code `claude/2026-07-20_prompt_fix_trickle_edgelabel.md` + i 2 discovery report. Review dei numeri benchmark prima/dopo in chat.
3. Go-ahead di Alfonso sul clamp → `claude/2026-07-20_prompt_fix_handle_clamp.md` → attesi ~1500/1500 edge; smoke visivo sovrapposizioni.
4. Cantiere seriale: wiring connect gesture + containment drop (plan in irInteraction.ts; generare prompt two-phase). NON in parallelo con altri cantieri della zona seriale.
5. In coda: Stadio 6 de-entanglement (rename routing lib in `edges/routing/manhattan`, DerivedReferenceEdge, campi DEdge + sgancio NodeEditor) · leve trickle 2-4 · bonifica VersionFixer · Fix 3 modal + save atomico + riempitivi minori · spegnimento VIEWS_RECOMPILE alla Fase 5 IR.
6. Aperture su richiesta: sessione design authoring IR (prerequisito paper P1); paper P2 scrivibile da subito.

Partiamo dal punto 1.
