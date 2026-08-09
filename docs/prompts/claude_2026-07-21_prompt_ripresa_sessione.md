Ripresa lavoro — Viewpoint IR su EditorV2: cantiere reattività cross-oggetto (design + implementazione)

Contesto. Leggi dal knowledge base, in quest'ordine:
1. `claude/sessione_2026-07-20_2.md` — checkpoint completo della giornata precedente (wiring connect+containment pushato, Stadio 6 pushato, leve trickle pushate, incident edge sintetici risolto, finding tecnici chiave).
2. `claude/discovery_2026-07-20_cross_object_reactivity.md` — discovery del cantiere corrente, con raccomandazione (opzione d, ibrido: crossPaths strutturati da irCompile + registry passivo irCrossDeps + firme estese useIRView/useIRContainment).
3. Al bisogno: `claude/discovery_2026-07-20_versionfixer_bonifica_slot.md` (5 domande aperte) · `claude/discovery_2026-07-20_wiring_connect_containment_ir.md` (decisioni D1-D5 da ratificare) · `claude/spec_2026-07-18_ir_schema_v1_2.md` sez. 9.

Stato
- Branch `alfonso-frontend-jjtl`, origin @ `0145ceb` (verificato via ls-remote). Contiene TUTTO il lavoro del 20/07: wiring connect gesture + containment drop (validato E2E) · Stadio 6 de-entanglement (routing lib → edges/routing/manhattan, DerivedReferenceEdge rimosso, NodeEditor sganciato) · leve trickle 2+4 (la 3 provata e revertita su evidenza benchmark, storia nei commit e272265/61928c8). Smoke di Alfonso ok, incluso il comportamento bridge-arc a fine drag.
- PENDENTE MINORE: `claude/patch_2026-07-20_discovery_reports_0001_docs.patch` (solo docs: i 2 discovery report cross-oggetto + VersionFixer) consegnata in chat il 20/07 sera, da applicare con git am --3way + push al primo giro utile.
- Gate: typecheck 33 locale / 14 cloud Δ0 (pre-esistente EditorV2 slitta di riga, ~:2890) · test IR 47/47 · suite 874 passed (9 file env-failure noti in cloud).
- Numeri trickle (cloud, stessa macchina): edit flow ~20-30 s → ~15 s, settle 126 → ~102 s, commit count NON stabilmente ridotto (bimodale): la leva vera sul conteggio resta il cantiere reattività.
- Incident risolto (non regressione): rename feature M2 `source`→`sorgente` invalidava i PathExpr delle view IR persistite; il meccanismo cross-deps raccomandato può rilevarlo a costo zero (warning one-shot). Da portare anche al design authoring.
- Discovery VersionFixer pronta; Fase 2 = critical zone, serve LIR + go-ahead.
- Guardrail invariati: git dalla RADICE, npm da `frontend/` · critical zone = two-phase + LIR + hard stop + go-ahead · discovery report SEMPRE in docs/discovery/ col naming standard · esecuzioni cloud a patch (author Alfonso, committer Claude; git am --3way) · build cloud con `NODE_OPTIONS=--max-old-space-size=4096` · harness E2E riusabile (host localhost, handle `mm-anchor--connected`, pattern in checkpoint) · save non atomico, mai interrompere i salvataggi · test bed sm (nota: feature Transition rinominata `sorgente` o riallineata, verificare stato).

Da fare (in ordine)
1. Applicare la patch docs pendente (30 secondi) + push.
2. Ratifiche rapide in chat (le decisioni sono già istruite nei report):
   a. Wiring D1-D5 + 3 domande (auto-expand del container collassato al drop?, palette estesa ai child droppabili default o dietro toggle?, wording voci popup "New <Metaclasse>").
   b. VersionFixer: 5 domande del report (raccomandazioni: opzione A per il superstite; sì al fix dei push radici in XMIService.ts nello stesso giro).
   c. Cross-oggetto: domande aperte della discovery (semantica draw dei dep pair, cap fan-out reference multivalore ~100, destinazione del warning rename: console vs problems panel, decoration edge monolitica ok per il Blocco 1).
3. CANTIERE PRINCIPALE — reattività cross-oggetto sull'opzione (d): design fine in chat sulle risposte 2c, poi two-phase: micro-discovery di conferma se serve → implementazione (irCompile crossPaths additivi · nuovo modulo irCrossDeps.ts, registry passivo two-phase senza store.subscribe · firma estesa useIRView per i vertex · firma per coppie in useIRContainment per gli edge · test vitest puri + scenario E2E vertex-label). Perimetro: solo modulo ir + hooks, NO critical zone. Esecuzione delegabile in cloud a patch, 2-3 sessioni. Chiude il Blocco 1.
4. Dopo il cantiere: Fase 2 VersionFixer (LIR + go-ahead) · verifica 6 Transition duplicate nel test bed · riempitivi (Fix 3 modal, save atomico, round-robin OQ1, §5.3 README benchmark).
5. Apertura maggiore: sessione design authoring IR (prerequisito paper P1; include la validazione PathExpr al rename). Il paper P2 resta scrivibile da subito.

Partiamo dal punto 1.
