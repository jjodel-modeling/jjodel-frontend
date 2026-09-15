# Ratifiche 2026-07-23 — Doppio click su vista nel tree-view attiva il pin

Continuazione di `sessione_2026-07-05_2.md` (feature "Pin su Properties", completata e verificata visivamente il 2026-07-05).

## Richiesta di Alfonso

Quando si fa doppio click su una vista nel tree-view, il Properties panel deve aprirsi mostrando quella vista **e rimanere pinnato**, senza dover cliccare manualmente il bottone pin dopo la selezione.

## Decisioni ratificate — round 1 (prima della discovery)

- **Ri-targeting**: se il pannello è già pinnato su un'altra vista, il doppio click su una vista diversa ri-targetizza sempre il pin alla nuova vista, sganciando quella precedente. Coerente col precedente già esistente nel pin (`clearSelection` con pin attivo ri-targetizza a tripla vuota).
- **Scope iniziale**: solo i nodi vista nel tree-view (poi raffinato in round 2, vedi D1).

## Fase 1 — Discovery

Eseguita da Claude Code. Report: `docs/discovery/discovery_2026-07-23_treeview_doubleclick_pin.md` (repo). Findings chiave:
- Nessun doppio click esiste oggi su alcun nodo del tree: nessun conflitto da preservare.
- Il pin è state locale (`useState`) in `PropertiesWithTreeView.tsx`, catturato imperativamente da `togglePin` via `store.getState()._lastSelected` — **non riusabile as-is** per il doppio click perché il dispatch Redux è asincrono (`setTimeout(…,0)` in `Action.fire`): la tripla va costruita esplicitamente dall'id del nodo, mai letta dallo store.
- Il ri-targeting è già il comportamento nativo di `setPinnedSelected` (via `handleInternalNavigate`): nessuna variante necessaria.
- Rischio reale identificato: doppio click dentro l'input di rename inline di una view andrebbe guardato con `if (isRenaming) return;`.
- Nessun canale oggi fra `TreeViewContent` e il meccanismo di pin: due opzioni proposte, CustomEvent (pattern già in uso nel progetto) vs prop drilling.

## Decisioni ratificate — round 2 (dopo la discovery)

- **D1 — Scope nodi**: SOLO `SubViewItem` (badge `v`, `DViewElement`, apre `ViewData`). `ViewpointNode` (badge `VP`, `DViewPoint`) **escluso esplicitamente**: un Viewpoint non è una vista, nessun auto-pin su doppio click su un VP.
- **D2 — Canale**: CustomEvent (nuova costante `PROPERTIES_PIN_VIEW` in `JjodelEvents`), non prop drilling.
- **D3 — Pannello collassato**: il doppio click deve riportare il pannello Properties a visibile, non solo pinnare uno stato invisibile.
- **D4 — Feedback visivo nel tree**: nessun marker aggiuntivo sulla riga pinnata, per ora. Decisione presa in autonomia da Claude (chat di progetto), scope-minimo, riapribile in futuro con prompt dedicato se in uso risulta insufficiente.
- **D5 — Text selection**: autorizzata una riga `user-select: none` in `tree-view-sidebar.scss` sulle righe del tree, per evitare l'evidenziazione del nome al doppio click.

## Documenti generati

- `claude/2026-07-23_prompt_discovery_treeview_doubleclick_pin.md` — Fase 1 (discovery, eseguita).
- `claude/2026-07-23_prompt_faseB2c-i_treeview_doubleclick_pin_impl.md` — Fase 2 (implementazione), con vincoli tecnici non negoziabili dal report (tripla esplicita, mai letta dallo store; guardia rename) e verifica manuale in 8 punti.

## Prossimi passi

1. Alfonso fa eseguire il prompt Fase 2 a Claude Code.
2. Verifica visiva sugli 8 punti elencati nel prompt, hard-refresh su `localhost:3001`.
3. Commit solo dopo conferma visiva; `git add` solo i file esplicitamente elencati.
4. Push e aggiornamento `docs/claude-code-log.md` (già richiesto nel prompt stesso).
