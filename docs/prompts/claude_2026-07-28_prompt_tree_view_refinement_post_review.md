# Tree View redesign · refinement post-review (2 commit)

**Tipo:** refactor (UI restyle)
**Data prompt:** 2026-07-28
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Contesto:** rifinitura dopo la review visiva della Fase 2 Tree View (commit `863afe887`, `39477b86b`, `651fcee6c`, `d0cfcc44b`). Due modifiche richieste da Alfonso guardando l'app: rimuovere il dot pulsante dagli item attivi, e calmare le icone (le classi rosse sembrano errori).

> Restyle-only, scoped ai file già toccati in Fase 2. Nessun rename di identificatori. 2 commit, ognuno con **hard stop** per verifica visiva su `localhost:3001` (hard-refresh). `git add` mirato (nel working tree c'è WIP di un altro thread, mai `git add .`). `npm run build` verde a ogni passo. Niente em dash.

---

## File in scope (SOLO questi)

1. `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`
2. `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss`
3. Il file di stile di `PropertiesWithTreeView` (`properties-with-tree-view.scss`), solo se il colore icona Class vive anche nella copia `.tree-view-panel-body`.

**Invarianti (non ricablare):** double-click → `PROPERTIES_PIN_VIEW`, selezione (`_lastSelected`), espandi/collassa (`expandedTreeNodes`), `data-element-id`, hover-actions, inline-rename. Solo restyle.

---

## Commit A · `refactor(tree): remove pulsing active-in-editor dot`

**COSA:** togliere il dot pulsante mostrato sugli item attivi (arancione sul model attivo, magenta sul viewpoint attivo).

**COME:**
- In `TreeViewContent.tsx` (`EntityRow`, `~:657-661`): rimuovi il render dello `<span className="tree-row__active-dot--viewpoint|model">`. Se il flag/variabile che decideva se mostrarlo resta inutilizzato dopo la rimozione, toglilo; se è usato altrove, lascialo (verifica con grep, non rimuovere logica condivisa).
- In `tree-view-sidebar.scss` (`~:1813-1837`): rimuovi le regole `.tree-row__active-dot*`. Se l'animazione `@keyframes` del pulse è usata **solo** da questo dot (verifica con `grep -r`), rimuovila; altrimenti lasciala.
- Nota: questo elimina l'unico indicatore "aperto nell'editor" (distinto dalla selezione). È voluto.

**Verifica visiva (hard stop):** nessun dot su `model_1` né sul viewpoint attivo (`STATE MACHINE`); selezione (sfondo tenue) e tutto il resto invariati; nessun layout shift.

---

## Commit B · `refactor(tree): calmer class color and clearer type glyphs`

**COSA:** le classi non devono più essere rosse (si leggono come errori); attributo con un glifo più chiaro del trattino. Il resto della mappa resta.

**COME (solo questi tre, in `TreeViewContent.tsx` per i glifi + SCSS per il colore):**
- **Class**: glifo `bi-square` → `bi-square-fill`; colore da rosso a **slate `#334155`**.
  - Colore: preferisci il layer token. Con `grep -r` verifica dove è usato il token del colore Class (`--color-entity-*` per la classe). Se è **tree-only** o il calmare-la-classe è desiderabile ovunque, cambia il valore del token a slate. Se il token è **condiviso** con altri contesti (es. nodi canvas) dove il colore attuale va bene, NON toccare il token globale: applica un override slate **scoped all'albero** (sulla classe per-tipo di `.tree-node__icon`, es. `.tree-DClass`) nel/i file SCSS in scope. Annota al hard-stop quale via hai preso.
- **Attribute**: glifo `bi-dash-lg` → `bi-tag`. Colore invariato.
- **Non toccare** gli altri tipi: Metamodel `bi-diagram-3`, Package `bi-folder2`, Reference `bi-arrow-right`, Model `bi-file-earmark`, Viewpoint `bi-eye`, Sub-view `bi-easel`, Transformation/Rule/Helper invariati.
- Mantieni il wrapper `.tree-node__icon {typeClass}` e il `title`/`aria-label` del tipo introdotti in Fase 2.

**Verifica visiva (hard stop):** le classi sono slate (quadrato pieno), non più rosse e non più simili a box di errore; gli attributi hanno un tag, non un trattino-meno; tutti gli altri tipi invariati; light e dark ok; double-click→pin sulle view ancora funzionante.

---

## Chiusura

- Dopo i due hard stop e la conferma di Alfonso: aggiorna `docs/claude-code-log.md` con **una entry** (tipo `refactor`, nota: "Tree View refinement post-review: rimosso active-dot pulsante; Class slate + `bi-square-fill`; Attribute `bi-tag`"). Riga finale `Nome del documento prompt: 2026-07-28 Tree View refinement post-review`.
- Se serve toccare un file fuori scope o rinominare una classe: **fermati e segnala**.

## Riferimenti

- Ratifiche Fase 2: `claude/ratifiche_2026-07-28_tree_view.md` (questa modifica supera D1 sul dot e aggiusta D2 su Class/Attribute).
- Discovery: `docs/discovery/discovery_2026-07-28_tree_view_redesign.md`.
- Tokens: slate `#334155`, cyan `#0ea5e9` (solo accent), solo Bootstrap Icons, no layout shift.
