# Tree View redesign · refinement round 2 (icone metaclassi + highlight attivo)

**Tipo:** refactor (UI restyle)
**Data prompt:** 2026-07-28
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Contesto:** secondo giro di rifinitura del Tree View dopo review visiva. Due punti di Alfonso: (1) le icone delle metaclassi non si leggono (i quadrati scuri erano tutti uguali); (2) l'elemento aperto nella Properties panel non è più evidenziato nel tree (nel giro precedente ho rimosso il dot pulsante, che era l'unico indicatore).

> Restyle-only, scoped ai file già toccati. Nessun rename di identificatori. 2 commit, ognuno con **hard stop** per verifica visiva su `localhost:3001` (hard-refresh). `git add` mirato (nel working tree c'è WIP di un altro thread, mai `git add .`). `npm run build` verde a ogni passo. Niente em dash.

---

## File in scope (SOLO questi)

1. `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (glifo icona classe)
2. `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (colori icona per tipo, highlight attivo)
3. Il file di stile di `PropertiesWithTreeView` (`properties-with-tree-view.scss`), solo se i colori icona o l'highlight vivono anche nella copia `.tree-view-panel-body`.

**Must-NOT-touch:** i file token `_colors-*.scss` (il colore va applicato scoped all'albero, non ai token globali, per non ricolorare i nodi del canvas); `TreeViewSidebar.tsx` (host orfano); qualsiasi classe/handler esistente (solo restyle). Invarianti da preservare: double-click → `PROPERTIES_PIN_VIEW`, selezione (`_lastSelected`), espandi/collassa (`expandedTreeNodes`), `data-element-id`, hover-actions, inline-rename.

---

## Commit A · `refactor(tree): readable metaclass type icons`

**COSA:** glifi Bootstrap riconoscibili + colore calmo e distinto per tipo, così classe/attributo/reference/package/metamodel/model si distinguono a colpo d'occhio. Risolve i "quadrati scuri tutti uguali".

**COME:**
- **Glifo classe:** cambia il glifo del type-icon della classe dal quadrato attuale (`bi-square-fill`) a **`bi-box-seam`**. Nel markup di `TreeViewContent.tsx`, nella mappa tipo→glifo introdotta in Fase 2, cambia solo la voce Class. Gli altri glifi restano: Metamodel `bi-diagram-3`, Package `bi-folder2`, Attribute `bi-tag`, Reference `bi-arrow-right`, Model `bi-file-earmark`.
- **Palette calma per tipo (scoped all'albero):** imposta il colore dell'icona per ciascun tipo di metaclasse, sulle classi per-tipo di `.tree-node__icon` (verifica i nomi reali: `tree-DModel` = metamodel, `tree-DPackage`, `tree-DClass`, `tree-DAttribute`, `tree-DReference`, `tree-nested-model` = model M1):
  - Metamodel `#6366F1`
  - Package `#D97706`
  - Class `#2563EB`
  - Attribute `#0D9488`
  - Reference `#7C3AED`
  - Model `#334155`
- **Dove applicare il colore:** scoped all'albero. **Non** cambiare i token globali `--color-entity-*` (colorano anche i nodi del canvas): applica gli override di colore sulle classi per-tipo dentro i file SCSS in scope. Se nel giro precedente il colore della classe era stato messo come token globale, riconducilo qui allo scoped e annotalo. Verifica il risultato anche in dark mode; se serve un valore dark diverso, tienilo scoped.
- Viewpoint (`bi-eye`) e sub-view (`bi-easel`) invariati, non contestati.

**Verifica visiva (hard stop):** ogni metaclasse ha il suo glifo e il suo colore calmo; la classe è una scatola (box-seam) blu, non più un quadrato scuro; i tipi si distinguono a colpo d'occhio; nessun quadrato-blob; i nodi sul **canvas** sono invariati (colore non cambiato lì); light e dark ok.

---

## Commit B · `refactor(tree): restore a calm static highlight for the active element`

**COSA:** l'elemento attualmente aperto nella Properties panel deve essere evidenziato nel tree, con un highlight **statico e calmo** (non il dot pulsante rimosso).

**COME:**
- **Prima capisci la causa** (breve indagine, read prima di editare): l'elemento mostrato nella Properties non è evidenziato perché (a) è stato rimosso il dot active-in-editor nel giro precedente, oppure (b) per certi tipi di riga la selezione usa una classe priva di regola CSS (la discovery aveva notato `.tree-row__content--selected` applicata ma **senza regola**, diversa da `.tree-row--selected`). Determina quale dei due casi vale per l'elemento che finisce nella Properties (view/sub-view, model, viewpoint).
- **Poi ripristina un highlight statico:**
  - Se è il caso (b): aggiungi la regola CSS mancante per quella classe di selezione, riusando lo stile di selezione esistente (`background: var(--color-selection-bg)`, come `.tree-row--selected`), così la riga aperta si evidenzia in modo coerente con la selezione normale.
  - Se è il caso (a): reintroduci un marker **statico** (non pulsante, nessuna `@keyframes` pulse) sull'elemento attivo, sobrio, tipo un pallino pieno piccolo nel colore del tipo (lo stile del pallino statico che precede "Label #1" nel mockup), oppure il peso del testo. **Niente pulse, niente barra cyan.**
- Scegli la soluzione più semplice e coerente con la selezione esistente. Nessun rename di classi.

**Verifica visiva (hard stop):** aprendo una view/model/viewpoint nella Properties, la sua riga nel tree è evidenziata in modo chiaro ma calmo (statico, niente pulse); la selezione normale al click continua a funzionare; nessun layout shift.

---

## Chiusura

- Dopo i due hard stop e la conferma di Alfonso: aggiorna `docs/claude-code-log.md` con **una entry** (tipo `refactor`, nota: "Tree View refinement round 2: icone metaclassi a glifi+colore per tipo (Class box-seam), highlight statico dell'elemento attivo ripristinato"). Riga finale `Nome del documento prompt: 2026-07-28 Tree View refinement round 2`.
- Se serve toccare un file fuori scope o rinominare una classe: **fermati e segnala**.

## Riferimenti

- Ratifiche Fase 2 Tree View: `claude/ratifiche_2026-07-28_tree_view.md`.
- Discovery: `docs/discovery/discovery_2026-07-28_tree_view_redesign.md` (nota su `.tree-row__content--selected` senza regola CSS).
- Tokens: cyan `#0ea5e9` solo accent (mai sulle righe), solo Bootstrap Icons, no layout shift. Colori metaclasse scoped all'albero, non ai token globali.
