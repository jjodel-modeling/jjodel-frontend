# Ratifiche 2026-07-28 · Tree View redesign (Fase 2)

Decisioni prese su "decidi tu" dopo la discovery (`docs/discovery/discovery_2026-07-28_tree_view_redesign.md`). Valgono come ratificate per la Fase 2. Prompt collegato: `claude/2026-07-28_prompt_fase2_tree_view_redesign.md`.

## Scope

- Fase 2 tocca **solo il path vivo**: `TreeViewContent.tsx` (markup icona) + `tree-view-sidebar.scss` (stili riga) + le copie override in `.tree-view-panel-body` di `properties-with-tree-view.scss`.
- `TreeViewSidebar.tsx` (host orfano) non si tocca e non si cancella (§9).
- Nessuna critical-zone, nessun Layer Impact Report.
- **Rename vietato** ovunque (classi = public API + scope-guard tooltip in `Tooltip.tsx:167`): solo restyle.

## D1 Active state

- Rimuovere `.tree-row--selected::before` (barra cyan, `tree-view-sidebar.scss:1694-1703`).
- Tenere lo sfondo tenue `.tree-row--selected { background-color: var(--color-selection-bg) }`. "Pulito" = selezione leggibile, non invisibile.
- Dot active-in-editor (`.tree-row__active-dot`) invariato.
- Token `--color-selection-bar`: resta orfano, `// TODO: cleanup` separato. Non ritirare ora, non toccare i file colori.

## D2 Icone (lettere → glifi Bootstrap per tipo)

Mappa ratificata:

- Metamodel → `bi-diagram-3`
- Package → `bi-folder2`
- Class → `bi-square`
- Attribute → `bi-dash-lg`
- Reference → `bi-arrow-right`
- Model (M1) → `bi-file-earmark`
- Viewpoint → `bi-eye`
- Sub-view → `bi-easel`
- Transformation → `bi-arrow-left-right`
- Rule → `bi-list-check`
- Helper → `bi-wrench`

- Le collisioni di lettera (C class/transformation, R reference/rule) si dissolvono coi glifi distinti.
- Colore icona: **fonte unica** = token `--color-entity-*` (`tree-view-sidebar.scss:645-706`). Portare l'hardcode text-only di `.tree-view-panel-body` (`properties-with-tree-view.scss:652-664`) agli stessi token, così vince il token e non il literal.
- Il wrapper `.tree-node__icon` + la classe per-tipo (`tree-DClass`, ...) restano (portano il colore); dentro va il glifo `bi` al posto della lettera. Preservare l'accessibilità con `title`/`aria-label` del tipo.

## D3 Dimensione icona/chevron

- Unificare toggle + icona a **14px** in entrambe le copie (panel-body da 20px a 14px; sidebar già 14px). Più proporzionato alla label 11px.

## D4 Indentazione (guida)

- Hairline **per-container** via `.tree-children::before` (ancora `.tree-children position:relative` già presente), **non** linea unica full-height dal root (rimossa il 2026-05-12 per invasività).
- 1px, slate a bassa opacità: light `rgba(51,65,85,0.12)`, dark `rgba(148,163,184,0.15)` (o token neutro equivalente). Mai cyan.
- Always-on ma sottile. Ripiego se a densità reale risulta invasiva: alzare/abbassare alpha o renderla hover-only (decisione al hard-stop C4).

## D5 Ritmo + tipografia

- `--space-*` introdotti solo dove il redesign tocca la spaziatura (normalizzo gli offender, non converto tutto l'albero).
- Label 11px su `.tree-row__name`, `.tree-feature__name`, `.tree-instance__name`.

## Struttura commit Fase 2

- **C1** active state (rimuovi barra cyan, tieni tint): `tree-view-sidebar.scss`.
- **C2** tipografia + ritmo (11px ×3 + 8px sugli spot toccati): SCSS.
- **C3** icone (lettere→glifi bi per tipo + colore su `--color-entity-*` + 14px): `TreeViewContent.tsx` + SCSS.
- **C4** guida di indentazione (hairline per-container): `tree-view-sidebar.scss`.

Ordine: dal più sicuro (C1) al più rischioso/greenfield (C4), isolato in fondo per iterare o fare revert senza toccare il resto.

## Fuori scope (annotare, non toccare)

- `--accent-cyan` (token non definito → literal `#0ea5e9`) su resize-handle/search-toggle, non sulle righe.
- Dead code `.tree-node__header*` / `.metamodel-tree__*`: lasciare (`// TODO`), non cancellare.
- Dedup completo delle doppie definizioni SCSS: smell da annotare, non sistemare ora.

## Interazioni invarianti (da preservare)

- double-click → `PROPERTIES_PIN_VIEW` (SubViewItem, `EntityRow onDoubleClick`).
- selezione (`_lastSelected`), espandi/collassa (`expandedTreeNodes`), `data-element-id` su ogni riga, `.tree-row__actions` hover-reveal, inline-rename, context-menu.
