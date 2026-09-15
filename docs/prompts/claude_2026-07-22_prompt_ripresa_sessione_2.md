# Prompt ripresa sessione — dopo 2026-07-22 (Authoring Fase B)

Contesto. Leggi dal knowledge base, in quest'ordine:

1. `claude/sessione_2026-07-22.md` — checkpoint completo: cross-oggetto chiuso end-to-end, wiring ratificato, authoring IR aperto fino a Fase B. Correzioni (§A1 view editor = ViewData a tab; F2 allAttributes getter) e info strutturali chiave. Leggi "Prossimi passi", "Info strutturali scoperte", "Bug nuovi / Todo".
2. Al bisogno: `claude/2026-07-22_prompt_faseB_fix_livepreview.md` (**diagnosi live-preview + decision tree del probe**, la root cause TRANSACTION era sbagliata) · `claude/ratifiche_2026-07-21_authoring_slice1.md` · `claude/discovery_2026-07-21_authoring_surface.md` · design doc slice-1 (nel repo, docs/).

Stato

- Branch `alfonso-frontend-jjtl`, repo locale `/Users/alfonso/jjodel`. Baseline typecheck 33.
- Cross-oggetto CHIUSO end-to-end (fix A+ `navigateRefHop`, committato). Wiring chiuso (ratificato).
- Authoring: **Fase A committata** (layer abilitante). **Fase B costruita, NON committata** (`VertexAuthoringPanel` come tab "IR" in `ViewData.tsx`). C'è una probe temporanea `[irdiag]` di Code (2 file, da togliere dopo).
- Il pannello si apre selezionando una vertex IR view dall'albero → tab "IR" nell'editor di view. Criteri (1)(3)(5) verdi. **(2) live-preview NON funziona; root cause DA CONFERMARE**: la mia ipotesi TRANSACTION era sbagliata (SetFieldAction dispatcha già via `.fire`). Il write persiste (reload mostra la forma). Break in signature/re-render/CSS: lo pinpoint la probe.

Da fare (in ordine)

1. **Girare la probe `[irdiag]` di Code** (Alfonso): seleziona vertex view → tab IR → cambia forma → incolla la riga `[irdiag] commit {…}`. Il fix segue il verdetto (decision tree in `claude/2026-07-22_prompt_faseB_fix_livepreview.md`: storedForm/sigChanged/render/CSS). **NON dare il vecchio fix TRANSACTION.** Al fix + verifica visiva, commit dell'intera Fase B (e strip della probe).
2. Fix latente `computeIRSignature` (irResolveCore.ts:65): ritorna `''` se il viewpoint attivo ha ≤1 vista IR (guard `parts.length > 1`). Task a sé (potrebbe anche essere lui il bug del punto 1, la probe lo dirà).
3. Design + prompt **Fase B2 (breadth)**: lista label, `fieldCompartments`, badge, Conditional builder, tab Basic/Advanced.
4. Poi: edge/graphVertex editor, theming BASE_CSS (token in `irStyle.ts`), aggancio "Suggest syntax" (P1).
5. Rinfrescare il cruscotto `jjodel-viewpoint-ir-tracker`.

Guardrail invariati: prompt Code autocontenuti (COSA/DOVE/COME/RIFERIMENTI, MD); scope file stretto; critical zone = two-phase + LIR + go-ahead; discovery in `docs/discovery/`; **§5.1: sui bug visivi si osserva prima di indovinare**; Alfonso fa la verifica visiva e approva i commit (rule 18); checkpoint al ~60% contesto o su keyword. Clone del branch in `/home/claude/jjodel-frontend` per discovery read-only.

Partiamo dal punto 1 (girare la probe e chiudere il live-preview), oppure apriamo il design di Fase B2.
