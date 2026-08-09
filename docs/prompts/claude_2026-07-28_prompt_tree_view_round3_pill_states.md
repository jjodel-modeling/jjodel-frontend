# Tree View redesign · round 3 (stati di riga a pillola)

**Tipo:** refactor (UI restyle, solo CSS)
**Data prompt:** 2026-07-28
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** high
**Contesto:** adottiamo nel tree la rifinitura di riga del mockup card (approvato): **hover e selezione come pillole arrotondate inset**, non barre a piena larghezza. È indipendente dalla card container (che arriva in una fase dedicata): qui si tocca solo lo stile delle righe. Se il round 2 (icone + highlight attivo) è già stato eseguito, questo lo rifinisce; se non ancora, gira comunque, sono regole diverse.

> Solo CSS, restyle-only, nessun rename, nessun cambio di markup o handler. 1 commit, hard stop per verifica visiva su `localhost:3001`. `git add` mirato (mai `git add .`). Build verde. Niente em dash.

---

## File in scope (SOLO questi)

1. `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss`
2. Il file di stile di `PropertiesWithTreeView` (`properties-with-tree-view.scss`), solo se lo stato hover/selezione della riga vive anche nella copia `.tree-view-panel-body`.

**Must-NOT-touch:** markup, handler, nomi di classe (solo restyle); i token globali.

---

## Commit unico · `refactor(tree): pill-shaped hover and selection row states`

**COME:**
- **Forma pillola inset sulla riga.** Su `.tree-row` aggiungi un piccolo margine orizzontale (es. `margin: 1px 4px`) e `border-radius` (es. `9px`), così lo sfondo di hover/selezione appare come una pillola arrotondata che non tocca i bordi del pannello. L'indentazione (padding-left calcolato) resta invariata dentro la pillola.
- **Hover:** `.tree-row:hover` → sfondo grigio tenue (es. `#f1f5f9` / token neutro equivalente), dentro la forma a pillola. Niente barra, niente full-width.
- **Selezione / elemento attivo:** `.tree-row--selected` (e l'eventuale highlight dell'elemento aperto nella Properties introdotto nel round 2) → sfondo tenue di selezione (`var(--color-selection-bg)`) **nella stessa forma a pillola** (stesso `border-radius` e inset dell'hover), così i due stati sono coerenti. Se nel round 2 l'highlight attivo era stato reso in un altro modo, riconducilo a questa pillola di selezione.
- Mantieni il dot/marker statico dell'elemento attivo se il round 2 lo ha aggiunto; qui cambia solo la **forma dello sfondo** riga.
- Nessuna `@keyframes`, niente pulse, niente cyan. Verifica light e dark.

**Verifica visiva (hard stop):** passando il mouse, la riga mostra una **pillola grigia arrotondata** (non una barra a tutta larghezza); la riga selezionata / l'elemento aperto nella Properties mostra una **pillola tenue** con lo stesso raggio e inset; gli stati sono coerenti; nessun layout shift; il resto del tree invariato.

## Chiusura

- Dopo l'OK visivo: `git add` dei soli file toccati + commit `refactor(tree): pill-shaped hover and selection row states`. Aggiorna `docs/claude-code-log.md` con una entry breve. Riga finale `Nome del documento prompt: 2026-07-28 Tree View round 3 pill states`.
- Se serve toccare un file fuori scope o rinominare una classe: fermati e segnala.
