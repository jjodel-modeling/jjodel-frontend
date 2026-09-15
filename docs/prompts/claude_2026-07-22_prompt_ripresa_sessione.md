# Prompt ripresa sessione — dopo 2026-07-21

Contesto. Leggi dal knowledge base, in quest'ordine:
1. `claude/sessione_2026-07-21.md` — checkpoint completo della giornata: cross-oggetto (opzione d) e bonifica VersionFixer, entrambi chiusi; bug nuovi di backlog; info strutturali (formato .jjodel, globali runtime, snippet fabbrica-fixture).
2. Al bisogno: `claude/discovery_2026-07-20_cross_object_reactivity.md` (meccanismo opzione d) · `claude/discovery_2026-07-20_versionfixer_bonifica_slot.md` (migration 2.226→2.227) · `claude/discovery_2026-07-20_wiring_connect_containment_ir.md` (D1-D5 + 3 domande da ratificare) · `claude/spec_2026-07-18_ir_schema_v1_2.md` (sez. 9 cross-oggetto).

Stato
- Branch `alfonso-frontend-jjtl`. Origin a inizio 21/07 era `0145ceb00`. Alfonso ha applicato via `git am` due cantieri interi: reattività cross-oggetto (opzione d, 2 patch) e bonifica VersionFixer (fix XMIService + migration 2.226→2.227 landed, 3 mbox). **Verificare col primo `git ls-remote`/`git log` se è stato fatto il push su origin** (i git am erano in locale).
- Gate a fine 21/07: typecheck 14 cloud / 33 locale Δ0 nei file toccati; test IR 64/64; ecore-io 36/36; migration proof 12/12. Build cloud richiede `NODE_OPTIONS=--max-old-space-size=4096`.
- Cross-oggetto: meccanismo two-phase (render pubblica fids, selector consuma), registry passivo `irCrossDeps.ts`, niente store.subscribe/rAF. Applicato; manca solo lo smoke discriminante del caso vertex in-app.
- VersionFixer: CHIUSA end-to-end (unit 12/12 + smoke in-app verde: migration scatta al load, rimuove la corruzione, `{dupSlot:0, dupRoot:0}`).

Da fare (in ordine)
1. Smoke discriminante cross-oggetto (caso vertex): label vertex multi-hop che legge una feature di un ALTRO oggetto → editando la feature sul target la label dell'osservatore si aggiorna senza toccarlo. In-app da Alfonso, o E2E cloud (pattern harness: chromium `/opt/pw-browsers/chromium`, ma NB in cloud l'app headless non inizializza l'utente — vedi info strutturali nel checkpoint). Se serve fabbricare uno stato, riusare lo snippet `build_dirty_project.js`.
2. Ratifiche formali wiring D1-D5 + 3 domande (raccomandazioni già in chat: auto-expand al drop = rifiuto in v1; palette estesa = default; wording popup = "New Transition").
3. Backlog bug (scollegati dai cantieri di oggi): cantiere `edgeHeadSize` — discovery + VersionFixer che riscrive il jsxString delle edge classiche (Edge, EdgeInheritance, EdgeAssociation, EdgeComposition, EdgeAggregation, EdgeDependency) da `edgeHeadSize` nudo a `view.edgeHeadSize` (§3.9); diagnosi 6 Transition test bed (id duplicati vs distinti = double import); quota localStorage su import progetto (scalabilità persistenza, parente di "save atomico").
4. APERTURA MAGGIORE — Blocco 2 Authoring IR: il core interattivo (persistenza + wiring + cross-oggetto) è consegnato, quindi l'authoring è la variabile che domina la chiusura totale ed è prerequisito del paper P1. Prima design in chat (editor strutturati al posto del TemplateEditor Monaco + theming BASE_CSS), poi implementazione (~2-3 settimane).
5. In coda: Fix 3 modal, save atomico, batch minori.

Guardrail invariati: git dalla RADICE, npm da `frontend/` · critical zone = two-phase + LIR + go-ahead · discovery report SEMPRE in `docs/discovery/` · consegna a patch per esecuzioni cloud (author Alfonso, committer Claude) · `npm run build` cloud con `NODE_OPTIONS=--max-old-space-size=4096` · baseline typecheck 14 cloud / 33 locale.

Partiamo dal punto 1 (smoke vertex cross-oggetto) o, se preferisci consolidare, dalle ratifiche del punto 2. In alternativa apriamo direttamente il design dell'authoring (punto 4), che è il pezzo grosso che resta.
