# Prompt ripresa sessione — dopo 2026-07-22_2 (Fase B chiusa, ri-stratificazione IR)

Contesto. Leggi dal knowledge base, in quest'ordine:

1. `claude/sessione_2026-07-22_2.md` — checkpoint completo: diagnosi live preview chiusa (root cause CSS, non dispatch), ri-stratificazione del box painting su `.ir-node-content`, decisioni ratificate (path A inline, outline selezione, ombra preservata, rect 4px). Leggi "Prossimi passi", "Info strutturali scoperte", "Bug nuovi / Todo".
2. Al bisogno: `claude/sessione_2026-07-22.md` (prima parte della giornata) · `claude/2026-07-22_prompt_faseB_ristratificazione_box.md` (il prompt eseguito, con le decisioni) · nel repo: `docs/discovery/discovery_2026-07-22_ir_box_layering.md` (mappa strutturale del painting, riferimento primario).

Stato

- Branch `alfonso-frontend-jjtl`, repo locale `/Users/alfonso/jjodel`. Baseline typecheck 33.
- **Fase B COMPLETA e verificata visivamente**: vertex authoring panel (tab "IR" in ViewData) con live preview funzionante per shape (rect/rounded/ellipse), border (stile/colore/spessore) e fill. Probe `[irdiag]` rimossa, decisione A applicata (bare `view.ir = draft`, niente TRANSACTION).
- Ri-stratificazione: il box dei nodi IR lo dipinge `.ir-node-content` (inline border/fill + classi ir-shape per il radius); `.mm-node` neutralizzato per i soli nodi IR via bridge `:has()`; `staticCssFor` non emette più border/bg (once-guard di `ensureViewCss` non più nel path critico).
- **Commit unico di Fase B**: demandato a Code con messaggio `feat: vertex authoring panel with live IR preview (phase B)` + entry in `docs/claude-code-log.md`. All'apertura, verificare che sia avvenuto (log + `git log`); se no, farlo eseguire subito.

Da fare (in ordine)

1. **Verifica commit Fase B** (punto sopra). Poi si riparte a working tree pulito.
2. **Fix guard `computeIRSignature`** (irResolveCore.ts:65): ritorna `''` se il viewpoint attivo ha una sola vista IR o nessuna (guard `parts.length > 1`). Task piccolo e isolato, prompt da generare. Con una sola vista IR la firma non cambia mai e la live preview morirebbe di nuovo: da chiudere prima di B2.
3. Design + prompt **Fase B2 (breadth)**: lista label, `fieldCompartments`, badge, Conditional builder, tab Basic/Advanced.
4. Poi: edge/graphVertex editor, theming BASE_CSS (token in `irStyle.ts`), aggancio "Suggest syntax" (P1).
5. Rinfrescare il cruscotto `jjodel-viewpoint-ir-tracker`.

Todo minori da tenere in vista: R4 clipping label ai poli dell'ellipse con label lunghe (padding se serve); R5 pareggio di specificità col border-radius di `.notation-er` (marginale, risolto dall'ordine di iniezione).

Guardrail invariati: prompt Code autocontenuti (COSA/DOVE/COME/RIFERIMENTI, MD); scope file stretto; critical zone = two-phase + LIR + go-ahead; discovery report in `docs/discovery/`; sui bug visivi si osserva prima di indovinare (la probe `[irdiag]` di questa sessione è il precedente da imitare); Alfonso fa la verifica visiva e approva i commit; checkpoint al ~60% contesto o su keyword. Clone del branch in `/home/claude/jjodel-frontend` per discovery read-only.

Partiamo dal punto 1 (verifica commit) e poi dritti sul fix `computeIRSignature`, oppure apriamo il design di Fase B2.
