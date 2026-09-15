# Fase 1 (discovery) · Floating panels: canvas esteso sotto le card

**Tipo:** discovery read-only (nessuna modifica al codice)
**Data prompt:** 2026-07-28
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Contesto:** evoluzione ratificata della fase card (2A, commit `refactor(panels): render properties and tree as inset cards`). Direzione: il canvas si estende a tutta larghezza e le due card (Properties + Tree) **galleggiano sopra** come overlay, stile Figma/tldraw. Sparisce la striscia di sfondo dietro le card, sparisce il divider destro, e la macchineria del width-lock diventa candidata al ritiro. Questa è la **Fase 1: solo discovery** per capire come farlo senza rompere canvas, dock e interazioni. Nessuna implementazione.

> Two-phase: Fase 1 read-only con salvataggio **obbligatorio** del report. Hard stop a fine report: si torna in chat per l'analisi, poi si genera la Fase 2. Non toccare il codice.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Se qualcosa qui lo contraddice, **segnala e fermati**.
- **READ-ONLY:** nessuna modifica a codice/stile, nessun `git`, nessun edit. Solo lettura e analisi.
- **Discovery report OBBLIGATORIO** in `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md` (se esegui in un altro giorno usa quella data; suffisso `_N` per più discovery nello stesso giorno). Contenuto minimo: obiettivo, file letti con path completi, findings per ogni domanda sotto, dipendenze e rischi, domande aperte per Alfonso. **L'hard stop non è completo finché il report non è scritto.**
- **Critical-zone, attenzione speciale:** questa discovery tocca il lato canvas (`editor-v2`). Verifica esplicitamente, per ogni file letto della catena canvas, se importa `useJjomSync` / `portDistribution` / `sync/*`. L'aspettativa è che il lavoro overlay resti CSS/layout/viewport e NON tocchi la sync, ma se un intervento previsto (es. inset del fitView) vive in un file critical-zone, **segnalalo in evidenza**: la Fase 2 su quel punto richiederà go-ahead + Layer Impact Report.
- Riusa la Parte A di `docs/discovery/discovery_2026-07-28_card_panels_progressive_disclosure.md` (dock, width-lock, collapse, handle): non rimapparla, referenziala.

## 1. Obiettivo

Mappare tutto ciò che serve per trasformare la coppia Properties+Tree da tab dockata (rc-dock, colonna destra) a **overlay flottante sopra il canvas**, con il canvas che si estende a tutta larghezza sotto le card. Output: piano di Fase 2 con rischi quantificati e lista di ciò che si ritira (width-lock).

## 2. Parte A · Canvas host e viewport

1. **Chi rende il canvas:** quale componente monta l'area diagramma (ReactFlow) dentro il figlio sinistro del dockbox? Path completi della catena da `Dock.tsx:330` (tab ModelsSummary / canvas) al componente ReactFlow reale. Dove vive il wrapper del viewport.
2. **Fit e centratura:** dove si usano `fitView` / zoom-to-fit / "centra sul nodo" / calcoli di centro viewport? ReactFlow supporta padding/inset sul fitView: verificare versione e opzioni disponibili. Elencare OGNI call-site che assumerebbe il viewport intero (fit al load, fit su cambio modello, focus su nodo, ecc.).
3. **Elementi ancorati a destra:** minimappa (componente, posizione, come è ancorata), controlli zoom, scrollbar, toolbar "Concrete syntax" in alto, FAB/chat in basso a destra. Per ciascuno: cosa succede se il canvas si estende sotto le card e come si insetta.
4. **Critical-zone:** import di `useJjomSync`/`portDistribution` nei file di questa catena (verifica esplicita, file per file, come da §0).

## 3. Parte B · Uscita dal dock

5. **Dipendenze dalla tab destra:** cosa dipende oggi dall'esistenza del figlio destro del dockbox (`Dock.tsx:348`)? In particolare: `PinnableDock`/`MyRcDock` (cosa fa il pin nell'header della tab PROPERTIES?), `DockManager` e il tab-loading, il kill-switch `body[data-active-tab]`/`[data-layout-mode]` (`properties-with-tree-view.scss:934-936`), eventuali altri consumatori.
6. **Strategia overlay:** dove posizionare l'overlay? Opzioni da valutare col codice alla mano: (a) position absolute dentro il container del canvas; (b) portal su body come il cluster flottante esistente (`.properties-tree-floating-cluster`, `:874-916`, precedente perfetto). Mappa la z-index landscape esistente (context menu, modali, tooltip, FAB) per collocare le card senza coprire ciò che non va coperto.
7. **Resize e persistenza nel mondo flottante:** come rifunzionano i due resize (oggi handle interni alla giunzione)? Proposta attesa: drag sul bordo sinistro di ciascuna card. Le larghezze persistite (localStorage `jjodel_property_panel_visible`, width Redux/state) restano valide? Il collapse diventa hide della card + cluster flottante esistente per riaprire: verifica che il cluster funzioni indipendentemente dal dock.
8. **Cosa si ritira:** inventario preciso del codice width-lock che diventa morto se il pannello esce dal dock: `PropertiesWithTreeView.tsx:257-280` (effect che scrive `--properties-tree-tab-width`), `style.scss:1119-1168` (selettori last-child + dragging + entrambi-collassati), `COLLAPSED_PANEL_TOGGLE_WIDTH` e i suoi accoppiamenti SCSS. NON si cancella in Fase 2 per forza: lista retire-candidates con dipendenze.

## 4. Parte C · Semantica e UX (da confermare con Alfonso)

9. **Pan-under:** il contenuto del diagramma può finire sotto le card (semantica Figma). Confermato come accettato; il report deve solo verificare che nessuna interazione critica (context menu su nodo vicino al bordo, drag di edge) diventi impossibile, solo coperta.
10. **INSTANCES a sinistra:** resta dockato (rail stile VS Code) o flotta anche lui? Il report mappa cosa comporterebbe estendere l'overlay anche a sinistra (stesso pattern, stessa uscita dal dock), senza deciderlo.
11. **Inset di default:** proposta di offset delle card dal bordo (es. 8-12px, coerente con la griglia 8px) e inset destro per fitView/minimappa = larghezza card + offset. Da ratificare in chat.

## 5. Deliverable e hard stop

- Report salvato in `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md`, con parti A/B/C distinte, rischi quantificati e la lista retire-candidates.
- Nessuna modifica al codice. **Hard stop:** si torna in chat col report per l'analisi e la pianificazione della Fase 2 (che sarà spezzata in commit con verifica visiva pesante: overlay, insets, ritiro width-lock).

## 6. Riferimenti

- Discovery precedente (Parte A dock/width-lock): `docs/discovery/discovery_2026-07-28_card_panels_progressive_disclosure.md`.
- Precedente overlay già in produzione: `.properties-tree-floating-cluster` (`properties-with-tree-view.scss:874-916`), portalato su body.
- Card chrome esistente (sopravvive, cambia solo casa): commit Fase 2A.
- Tokens: slate `#334155`, cyan `#0ea5e9` (solo accent), griglia 8px, no layout shift.
