# Prompt ripresa sessione — dopo 2026-07-22_3 (B2a verificata, si apre il design B2b)

Contesto. Leggi dal knowledge base, in quest'ordine:

1. `claude/sessione_2026-07-22_3.md` — checkpoint completo: fix dello staging Fase B (commit `82a3a6c9a`), verifica visiva B2a positiva sui 7 criteri, catena di mount del pannello, todo aperti. Leggi "Prossimi passi", "Info strutturali scoperte" (contiene lo schema IR verificato e la grammatica `Predicate`, entrambi rilevanti per B2b), "Bug nuovi / Todo".
2. Al bisogno: `claude/sessione_2026-07-22_2.md` (ri-stratificazione box + diagnosi live preview) · `claude/2026-07-22_prompt_faseB2a_breadth_labels_compartments_badges.md` (il prompt eseguito) · `claude/ratifiche_2026-07-21_authoring_slice1.md` (D1-D6, Q3/Q5, A1/A2).

Stato

* Branch `alfonso-frontend-jjtl`, repo locale `/Users/alfonso/jjodel`. Baseline typecheck 33.
* Fase B committata davvero (`82a3a6c9a`; attenzione: due commit condividono lo stesso subject "phase B" — `bc012ac93` rendering + `82a3a6c9a` pannello, è voluto).
* Fase B2a COMPLETA e verificata visivamente (lista label, fieldCompartments, badge, tab Basic/Advanced con Advanced placeholder). Commit B2a demandato a Code: messaggio `feat: authoring slice-1 breadth — label list, fieldCompartments, badges, Basic/Advanced tab shell (phase B2a)` + log entry. All'apertura verificare che sia avvenuto (log + `git log`); se no, farlo eseguire subito.
* Dev server in questa fase gira su `localhost:3000` (non 3001 come da convenzione scritta) — da tenere presente per le verifiche visive.

Da fare (in ordine)

1. Verifica commit B2a (punto sopra).
2. Verificare che Code abbia salvato su file la discovery della catena di mount di `VertexAuthoringPanel` (`docs/discovery/discovery_2026-07-22_*.md`); se è rimasta solo in chat, fargliela scrivere (i contenuti sono ricapitolati in "Info strutturali scoperte" del checkpoint).
3. Fix guard `computeIRSignature` — prompt già pronto (`claude/2026-07-22_prompt_fix_computeIRSignature_guard.md`), MAI eseguito. Con una sola vista IR la firma resta `''` e la live preview muore: da chiudere prima di B2b.
4. **Design Fase B2b (Conditional/Predicate builder)** — il piatto forte della sessione. Proposta sul tavolo, non ancora ratificata da Alfonso: `ConditionalEditor<T>` generico (toggle valore-fisso/condizionale; se condizionale, scelta when/then/else vs rules+default) + `PredicateBuilder` ricorsivo (gruppi and/or con righe; not che wrappa un sotto-gruppo; confronti eq/neq/lt/lte/gt/gte con lati path-o-literal riusando il pattern `TextSourceEditor`/`PathBuilder`; exists/empty su path; isKind). Punti da decidere prima del prompt: (a) includere `rules` subito o solo when/then/else in prima battuta; (b) quali dei sei siti Conditional abilitare per primi (`shape.form`, `shape.fill`, `label.visible`, `badge.icon`, `badge.visible`, `fieldCompartment.visible`); (c) `Literal` nei confronti: che tipi supportare nella UI (boolean/number/string). Lo schema `Predicate` completo è nel checkpoint. Fixture di test ideale: i due badge del testbed "IR Test Bed" hanno già `visible` Conditional `{when,then,else}` su `isInitial`/`isFinal`.
5. Poi: edge/graphVertex editor, theming BASE_CSS (token in `irStyle.ts`), aggancio "Suggest syntax" (P1), rinfrescare il cruscotto `jjodel-viewpoint-ir-tracker`.

Todo minori in vista: R4 clipping label ai poli dell'ellipse; R5 specificità notation-er (marginale).

Guardrail invariati: prompt Code autocontenuti (COSA/DOVE/COME/RIFERIMENTI, MD, salvati in /home/claude/ con timestamp); scope file stretto, mai `git add .`; critical zone = two-phase + LIR + go-ahead; discovery report obbligatorio in `docs/discovery/`; sui bug visivi si osserva prima di indovinare, e prima di diagnosticare codice si controlla l'operativo (il "pannello introvabile" di questa sessione era un dev server non riavviato per intero dopo una manovra manuale di file — precedente da ricordare); Alfonso fa la verifica visiva e approva i commit; checkpoint al ~60% contesto o su keyword.

Partiamo dal punto 1 (verifica commit B2a) e poi dritti sul design di B2b, con i tre punti aperti (a/b/c) da decidere.
