# Sessione 2026-07-29_2: F5, chiusura fase floating, union mode, 2B completa

## Stato a fine sessione

**Fase floating panels CHIUSA.** F5 committato e verificato a vista su tutti gli 8 contesti della §8. Push del branch e cleanup dei tag `reconstruct-base-*` eseguiti (Task 1). Union `mode` di `PropertiesWithTreeView` ristretta a `'floating'` (commit dedicato).

**Fase 2B progressive disclosure COMPLETA** (vertex-only): B1 sezioni FormSection ✅, B2 toggle unico nell'header della card cablato su `useInterfaceMode` ✅ (4 check verdi: gating Compartments/Badges/Matching, fallback da matching, sync bidirezionale Navbar, persistenza reload), B3 `allowConditional` + chip read-only ✅, B4 skin del mockup ✅ con B4-fix per i due residui (checkbox reali, icona hint) ✅.

**Metodo nuovo consolidato per il lavoro estetico**: replica HTML pixel-fedele del mockup approvata da Alfonso → prompt one-shot con valori letterali (token + regole per elemento) → Claude Code fa mappatura, non interpretazione. L'iterazione avviene sulla replica (costo zero), non nel codebase (costo un commit + verifica). File: `properties-card-mockup-replica.html` (contiene la tabella token `--pc-*`).

**Diagnosi runtime via browser (nuova capacità usata)**: ispezione diretta dell'app viva su localhost:3000 via Chrome (DOM, stili computati, scan degli stylesheet). Ha permesso di verificare che la skin B4 era live e di individuare con certezza i due residui, senza round-trip con Claude Code.

**Git**: commit locali non pushati a fine sessione: union narrowing, B1, B2, B3, B4, B4-fix. **Primo passo prossima sessione: push.** WIP TextStyle concorrente sempre nel working tree: mai `git add .`.

## Decisioni prese

1. **Parte D di F5 (pointer-events)**: check dentro F5; se assente applicare nello stesso commit. Esito: NON applicata, correttamente: la ratifica C9 era sbagliata (vedi bug risolti).
2. **Union `mode`**: ristretta a `'floating'`; rimozione dei soli rami che il typecheck segnala; Info.tsx non correlato. Rationale: il tipo documenta la realtà; restringimento auto-verificante via compilatore.
3. **Push prima del lavoro nuovo**, cleanup tag con guardia (`merge-base --is-ancestor`; un tag non raggiungibile si conserva).
4. **2B, sezioni in Basic**: Basic mantiene Shape, Fill, Border (decisione del 28 confermata); il mockup vale come riferimento VISIVO, non come inventario. "Border" resta "Border".
5. **2B, header**: ibrido: toggle nell'header + restyle breadcrumb/chip, affordance funzionali conservate (indietro, occhio, aiuto).
6. **B4 ridisegnato due volte su frustrazione legittima di Alfonso**: da spec in prosa (D1-D7) a one-shot con valori esatti dalla replica HTML approvata. Lezione: per lo stile, mai aggettivi nei prompt, solo valori.
7. (Altra chat, recepita) **B5**: il toggle Basic/Advanced migra dalla card al Navbar; un solo writer visibile; nessun residuo di modalità nella card. Prompt già in KB.

## Bug risolti / Root cause

- **"Split non è più presente" (verifica F5, punto 4)**: NON è una regressione della fase. Lo switcher con i bottoni Split/Sidebar/Canvas-only fu rimosso da Navbar nel commit `59d0e3f5b` (2026-03-16), mesi prima. Orfani residui (tipo `LayoutMode`, blocco SCSS `:1042`, handler mai cablati) nel backlog.
- **Ratifica C9 (pointer-events) SBAGLIATA e corretta**: `pointer-events:none` sul wrapper fu provato e revertito perché rompeva l'hit-testing dello splitter (che vive nel wrapper, fuori dalle card). Il requisito è soddisfatto PER STRUTTURA (wrapper fixed largo quanto la colonna card). Verificato a vista (punto 8 verde). Ratifiche aggiornate: NON reintrodurre la regola.
- **"B4 non ha cambiato nulla"**: falso in gran parte, con due residui veri. Diagnosi runtime: (1) la skin era LIVE su :3000 (chip `#e0f2fe/#0284c7`, hint `32px/290px/#94a3b8`, bottoni ghost `10px/#e2e8f0`: valori conformi); il "nulla" era probabilmente pagina stale o porta sbagliata (abitudine storica :3001 vs :3000 attuale). (2) Residuo A: la regola checkbox targetava `button[role="checkbox"]`, 0 match nel DOM; pattern reali: `input.checkbox` nativo nascosto in `<label>` con `span.toggle-label` (`.css-scope-toggle`, tab Style) + componente a CSS module (`_toggleChecked_*`) nell'authoring IR. (3) Residuo B: icona `(i)` degli hint ancora renderizzata. Fixati con B4-fix.

## Bug nuovi / Todo

- Push dei 6 commit locali (PRIORITÀ 1).
- `groups.editors` in `Dock.tsx`: deferito da F5 Parte C (const orfane lo dichiarano ancora). Cleanup futuro.
- 3 commenti stale in `properties-with-tree-view.scss` lasciati per regola di ingaggio (annotati nel log F5).
- Kill-switch `data-active-tab="documentation"` LASCIATO: `activeEditorType` è sticky (solo EDITOR_TYPE_CHANGE lo aggiorna), il gate JS non copre il caso.

## Documenti aggiornati

- `claude/ratifiche_2026-07-29_floating_panels.md`: correzione C9, sequenza chiusa, finding post-F5 (union/split/vertical-console), backlog dual-canvas, autorizzazione push+tag.
- `claude/2026-07-29_prompt_fase2_F5_retire_widthlock.md`: v2 in place (Parte D).
- Replica mockup: `properties-card-mockup-replica.html` (consegnata in chat; fonte dei valori B4).

## Prompt generati per Claude Code (con esito)

1. `2026-07-29_prompt_fase2_F5_retire_widthlock.md` (v2, Parte D) — ✅ eseguito; D non applicata (C9 superata), union riportata, log ok.
2. Query read-only post-F5 (`2026-07-29_1520_query_readonly_post_f5.md`, non in KB) — ✅ eseguita: 4 punti chiariti.
3. `2026-07-29_prompt_push_tags_union_mode.md` — ✅ Task 1 (push + tag) e Task 2 (union → `'floating'`) eseguiti.
4. `2026-07-29_prompt_fase2B_progressive_disclosure.md` (v2, 4 commit) — ✅ B1, B2, B3 eseguiti e verificati.
5. `2026-07-29_prompt_B4_spec_estesa.md` — ⚠️ SUPERATO dal one-shot prima dell'esecuzione.
6. `2026-07-30_prompt_B4_oneshot_mockup_skin.md` — ✅ eseguito (con 2 residui).
7. `2026-07-30_prompt_B4fix_checkbox_hint_icon.md` — ✅ eseguito.

## Prompt pendenti

- `2026-07-30_prompt_B5_mode_toggle_to_navbar.md` (two-phase, ratifiche 2026-07-30 in testa): toggle dalla card al Navbar. Fase 1 discovery con report `docs/discovery/discovery_2026-07-30_navbar_interface_mode.md`, hard stop, poi Fase 2 su go-ahead. DA ESEGUIRE, primo lavoro della prossima sessione dopo il push.

## Prossimi passi

1. **Push** del branch (6 commit locali).
2. **B5** (prompt pronto): Fase 1 discovery → analisi in chat → go-ahead → Fase 2.
3. Fase **INSTANCES / rail sinistro** (ultimo grosso pezzo del redesign pannelli; ospita le tab canvas, struttura diversa dal lato destro).
4. Backlog: dual-canvas (riuso concettuale di split per affiancare due modelli); orfani split (`LayoutMode`, SCSS `:1042`, handler Navbar); `groups.editors`; language sweep Edge/Row/Matching; token orfani (`--color-selection-bar`).

## Info strutturali scoperte (per sessioni future)

- **Catena DOM della card**: `.properties-tree-overlay > .properties-with-tree-view.properties-with-tree-view--floating > .properties-panel-container > .properties-panel-header`. Il blocco skin B4 è scoped sotto `.properties-panel-container`.
- **Hook B4 nel JSX** (introdotti dalla serie B): `.properties-mode-switch(__opt,--active)` (segmented), `.props-header--view` con `.path-element`/`.path-separator`, `.jj-type-badge--view` (chip), `.view-editor-tab-bar`/`.view-editor-tab(.active)`, `.jj-field(-label)`, `.props-label-entry-split` (divider tratteggiato).
- **Checkbox reali**: tab Style = `label > span.toggle-label + input.checkbox` (input nativo nascosto 0×0) in `.css-scope-toggle`; authoring IR = componente a CSS module (classi hashate tipo `_toggleChecked_*`). NESSUN `button[role="checkbox"]` nel DOM.
- **`props-section__title`** (pannello class/metamodel): 13px/500 con `font-weight !important` e `var(--text-muted)`: è un componente DIVERSO dal FormSection dell'authoring. Non confonderli nelle prossime skin.
- **IR authoring visibile solo se la view non usa il template classico** (jsxString): nel progetto "State Machine Notation copy" la View for State ha IR disabilitato e il tab IR mostra il pannello di abilitazione. Per verifiche visive dell'authoring serve una view IR-enabled (il progetto "State Machine" di Alfonso).
- **vertical-console**: mode JS-only attivabile da console (`window.setVerticalConsole…`), branch in `Dock.tsx:296`, nessuna regola SCSS, nessun bottone UI. Layout canvas sopra / `<Console/>` sotto con resize handle. Fuori dalla passata visiva standard.
- **Porta di verifica**: il dev server corrente è su **localhost:3000** (verificato live). L'abitudine storica :3001 può mostrare una build stale: controllare la porta prima di dichiarare "non è cambiato niente".

## Cronologia (sintetica)

Sessione in quattro atti. **Atto 1**: kickoff; F5 aggiornato a v2 (Parte D pointer-events) ed eseguito; passata visiva 8/8 con la sorpresa split (risolta come archeologia: rimosso a marzo) e la scoperta che C9 era una ratifica sbagliata (esperimento già revertito per l'hit-testing dello splitter); query read-only per union/log/layout/pointer-events; ratifiche aggiornate; push + cleanup tag + union ristretta. **Atto 2**: generato il prompt 2B (3 commit) e subito rifatto in v2 (4 commit) quando gli screenshot di Alfonso hanno mostrato che il bersaglio era il mockup della card: due ratifiche via AskUserQuestion (Basic tiene Shape/Fill/Border; header ibrido) e toggle spostato nell'header in B2. B1-B2-B3 eseguiti e verificati con hard stop regolari. **Atto 3**: sul B4 estetico, frustrazione legittima di Alfonso per i giri a piccoli passi; svolta di metodo: replica HTML pixel-fedele del mockup costruita in chat, approvata, e prompt one-shot con i valori letterali. **Atto 4**: "resta diverso" → diagnosi runtime nel browser sull'app viva: skin B4 verificata live su :3000, individuati i due residui reali (selettore checkbox morto, icona hint) e il sospetto porta stale; B4-fix eseguito. 2B chiusa. Checkpoint.
