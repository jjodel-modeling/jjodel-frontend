# Fase 2 · F2-fix — Collisione `:last-child`, altezza Tree, offset overlay

**Tipo:** hotfix su F2 (regressione bloccante) + due regolazioni visive. Commit unico.
**Data prompt:** 2026-07-29
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Precondizione:** F2 committato (`refactor(panels): float properties+tree overlay over full-width canvas`).

> Verifica visiva di F2 su `localhost:3000`: (1) aprendo un progetto la dashboard di progetto non compare, schermata bianca; (2) la Tree card è troppo bassa; (3) i due pannelli coprono la destra della toolbar del canvas. Il punto (1) e il fatto che il canvas NON sia full-width hanno con ogni probabilità la stessa radice: vedi §2.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Contraddizioni: **segnala e fermati**.
- **Critical-zone: nessun file coinvolto.** Non toccare `EditorV2.tsx`, `useJjomSync.ts`, `portDistribution.ts`, `sync/*`. Gli inset di fitView e MiniMap restano F3/F4.
- **Root cause prima del fix** (§CLAUDE.md). La §2 è diagnosi obbligatoria: se il root cause reale diverge dall'ipotesi, **riporta e fermati** invece di applicare il fix ipotizzato.
- **`git add` scoped** per path espliciti. **MAI `git add .`** (possibile WIP TextStyle concorrente nel working tree).
- Zero refactoring opportunistico. Diff minimale, `str_replace` puntuali.

## 1. Sintomi osservati (evidenza dallo screenshot)

Misure sullo screenshot di verifica, area dock che inizia dopo la LeftBar INSTANCES:
- La **toolbar del canvas** (undo/redo/copy/delete, `VIEW`, `Theme`) e la **MiniMap** finiscono **alla stessa ascissa**, a circa il **29-30%** della larghezza disponibile del dock. Oltre quel bordo: **bianco vuoto** fino all'overlay.
- La MiniMap è `position:absolute; right:20px` dentro il container ReactFlow: il suo bordo destro **prova** che il container del canvas finisce lì. Quindi **il canvas non è full-width**, è largo circa il 30%.
- Aprendo un progetto (vista dashboard/summary, `ProjectEditor`): **schermata bianca**, la dashboard non si vede.

## 2. Diagnosi obbligatoria (due ipotesi da discriminare)

Rimosso il figlio destro, il pannello canvas è rimasto **unico figlio** del dockbox: quindi è **contemporaneamente `:first-child` E `:last-child`**.

**Ipotesi A (probabile).** Le regole SCSS scritte per dimensionare/nascondere la vecchia colonna Properties tramite `.dock-hbox > .dock-panel:last-child` ora **colpiscono il canvas**:
- `abstract/style.scss:1042-1108` (sizing last-child per split / sidebar / responsive): spiega il **30% di larghezza**.
- `abstract/style.scss:1171-1288` (hide-in-mode: documentation / **summary** / transformation / viewpoint / canvas-only): la variante **summary** nasconde il last-child, cioè oggi **nasconde il canvas**: spiega la **schermata bianca** sulla dashboard di progetto.
- `abstract/style.scss:1119-1128` (width-lock) e `:1140-1168` (both-collapsed) puntano allo stesso selettore: inerti solo finché nessuno scrive gli attributi body, ma vanno verificati.

**Ipotesi B (alternativa).** Il figlio destro **esiste ancora** come pannello vuoto (push non rimosso davvero o tabs svuotate): il bianco sarebbe quel pannello e la larghezza sarebbe il vecchio ratio.

**Come discriminare, in DevTools su `localhost:3000` con un modello aperto:**
1. Conta i pannelli: `document.querySelectorAll('.dock-hbox > .dock-panel').length`. **1** conferma A; **2** conferma B.
2. Se 1: seleziona quel pannello e leggi in "Computed / Styles" **quale regola** ne imposta `width` (attesa: una regola `:last-child` di `style.scss`). Sulla vista summary, verifica quale regola imposta `display:none` o width 0.
3. Riporta l'esito in chiaro prima di procedere. Se emerge B, **fermati e segnala**: il fix è diverso (completare la rimozione del push in `Dock.tsx`), non quello di §3.

## 3. FIX A (bloccante): neutralizzare le regole `:last-child` orfane

Confermata l'ipotesi A: quelle regole miravano alla colonna Properties, che **non esiste più nel dock**. Non possono più avere un bersaglio legittimo, quindi vanno ritirate (il ritiro width-lock era pianificato per F5: la collisione lo anticipa, limitatamente ai selettori che colpiscono il canvas).

Procedi **blocco per blocco**, in `src/components/abstract/style.scss`, sui quattro gruppi citati in §2:
- Se il blocco **mira solo** a `.dock-hbox > .dock-panel:last-child` (o suoi discendenti): **rimuovilo**.
- Se il blocco **mescola concern** (regola anche il first-child, il divider, o altri elementi ancora vivi): **non rimuoverlo**; restringi il solo selettore last-child aggiungendo `:not(:first-child)`, così con un pannello unico non matcha mai e con due pannelli il comportamento storico resta identico. Esempio: `.dock-hbox > .dock-panel:not(:first-child):last-child`.
- **Prima di rimuovere**, verifica con `grep` che il blocco non serva ad altri layout ancora attivi (`vertical-console`, `MetamodelTab`, viste non-canvas).
- Elenca nella risposta i blocchi rimossi e quelli solo ristretti, con numeri di riga.

Atteso dopo il fix: il canvas riempie **tutta** la larghezza disponibile (toolbar e MiniMap arrivano al bordo destro della finestra) e la dashboard di progetto torna visibile.

*(Nota: con il canvas full-width la MiniMap finirà sotto l'overlay. È previsto e si risolve in F4, non qui.)*

## 4. FIX B: Tree card più alta

**Sospetto da verificare per primo:** se il riorientamento width -> height ha **riusato la chiave localStorage della larghezza** (`jjodel_property_tree_view_width`), il valore persistito dalle sessioni precedenti (una larghezza, ~260) viene **riletto come altezza**, e qualunque nuovo default resta invisibile. Verifica la chiave usata dallo stato altezza del Tree in `PropertiesWithTreeView.tsx`.

- Se la chiave è condivisa con la larghezza: introduci una **chiave dedicata** (es. `jjodel_property_tree_view_height`), così i valori vecchi non inquinano e il nuovo default si applica. Verifica con `grep` che il nome non sia già in uso.
- Alza il **default** dell'altezza del Tree a circa **360px** (dal valore attuale), min ~180px, max ~60vh. Resta resizabile con l'handle orizzontale.
- L'overlay deve avere `max-height: calc(100vh - <top> - 8px)` in modo che, con il Tree più alto, la Properties sotto resti sempre visibile e scrollabile invece di uscire dallo schermo.

File: `PropertiesWithTreeView.tsx` (default/chiave) e `properties-with-tree-view.scss` (clamp/max-height), scope `floating`.

## 5. FIX C: overlay sotto la toolbar del canvas

Oggi il bordo superiore dell'overlay è alla stessa altezza della toolbar del canvas e ne copre la parte destra. La toolbar (heading del canvas) deve avere **sempre la larghezza massima**.

- Abbassa il `top` dell'overlay in modo che inizi **sotto** la toolbar: `top = (altezza navbar) + (altezza .editor-v2-toolbar, 40px) + 8px`.
- **Non usare un numero magico isolato**: se esistono già costanti o variabili CSS per l'altezza di navbar e toolbar, componile (`calc(...)`) e lascia un commento di una riga sul perché. Se non esistono, usa un valore tarato con commento esplicito.
- Mantieni `right: 8px` e `z-index: 900`.

## 6. Cosa NON fare

- Non insettare fitView, MiniMap o FAB (sono F3/F4).
- Non rimuovere `groups.editors` / `calculatePanelSizes` (orfani innocui, cleanup separato).
- Non toccare i mode `tab` / `popup` / `inline`.
- Non introdurre migrazioni VersionFixer (nessun layout persistito).
- Non `git add .`.

## 7. Verifica

- `npm run build` senza errori.
- A vista (`localhost:3000`, hard refresh, e **svuota le chiavi localStorage interessate** se serve per vedere i nuovi default):
  1. Apri un progetto: la **dashboard di progetto si vede** (niente schermata bianca).
  2. Apri un modello: il canvas occupa **tutta** la larghezza; la toolbar (`VIEW`, `Theme`) arriva fino al bordo destro senza essere coperta dall'overlay.
  3. L'overlay parte **sotto** la toolbar, a 8px dal bordo destro; Tree sopra visibilmente più alta, Properties sotto sempre visibile.
  4. Resize: handle orizzontale (altezze) e bordo sinistro (larghezza) funzionanti, senza segno invertito.
  5. Nascondi entrambe le card: compare la pill di riapertura; riclicca: torna l'overlay.
  6. Passa tra summary, modello e Documentation: nessuna vista resta bianca, l'overlay compare solo sul canvas.

## 8. Chiusura

- Aggiorna `docs/claude-code-log.md` (tipo `fix`, con **root cause in una riga**: regole `:last-child` orfane che colpivano il pannello canvas divenuto figlio unico).
- `git add` solo i file toccati, per path esplicito. Controlla `git status`: nessun WIP estraneo staged.
- Commit convenzionale, inglese, una riga. Es: `fix(dock): retire orphan last-child rules squeezing the full-width canvas`.
- **Hard stop dopo il commit:** verifica visiva di Alfonso prima di F3.

## 9. Riferimenti

- Report F2: `docs/discovery/discovery_2026-07-29_f2_overlay_mount_migration.md`.
- Report floating: `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md`, in particolare B8 (retire-candidates width-lock) e la nota su `style.scss:1042-1108` / `:1171-1288` come cleanup separato: la collisione lo anticipa.
- Ratifiche 2026-07-29: overlay portal su body, offset 8px, z 900, Tree sopra e Properties sotto.
