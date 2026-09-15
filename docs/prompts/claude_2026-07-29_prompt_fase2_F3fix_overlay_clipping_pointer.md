# Fase 2 · F3-fix — Clipping della Tree, ancoraggio verticale dell'overlay, MiniMap

**Tipo:** fix visivi e di interazione su F2/F3. Commit unico.
**Data prompt:** 2026-07-29
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Precondizione:** F3 committato (inset di fitView, MiniMap e FAB via `--jj-canvas-right-inset`).

> Tre difetti dalla verifica visiva: (1) le righe dell'albero scorrono **sotto** il campo di ricerca e restano visibili; (2) la card Properties si sovrappone alla status bar in basso; (3) la MiniMap "non funziona". Il (3) va diagnosticato prima di essere corretto: vedi §3.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Contraddizioni: **segnala e fermati**.
- **Critical-zone:** non toccare `useJjomSync.ts`, `portDistribution.ts`, `sync/*`, né il call-site `useJjomSync(...)` in `EditorV2.tsx:412-433`. Su `EditorV2.tsx` è ammesso **solo** l'eventuale ritocco della MiniMap (§3).
- **Root cause prima del fix** per il punto 3.
- **`git add` scoped** per path espliciti. **MAI `git add .`**.
- Zero refactoring opportunistico. Non rinominare classi esistenti. `str_replace` puntuali.
- Ogni nome di classe o variabile nuovo va verificato con `grep -r` prima di introdurlo.

## 1. FIX A — L'albero non deve scorrere sotto la ricerca

**Sintomo:** scorrendo la Tree View, le righe (`Class Diagram IR`, `Class Diagram IR v3`) sono visibili **dietro e attorno** al campo `Filter...`, sia sopra sia ai lati dell'input. Il contenuto scorrevole non è clippato dall'area di ricerca.

**Causa da verificare:** il campo di ricerca è **dentro** il container che scrolla (oppure è sticky con sfondo non opaco o non a piena larghezza), quindi le righe passano sotto e restano visibili.

**Fix atteso:** la barra di ricerca sta **fuori** dall'area scrollabile, come elemento fisso nell'intestazione della card, e lo scroll container inizia **sotto** di essa. Struttura target della card Tree, in colonna: header (`TREE VIEW` + collapse) / barra di ricerca / area scrollabile (`overflow-y:auto`, `flex:1`). Nessuna riga deve essere visibile sopra il primo pixel dell'area scrollabile.

Se per ragioni strutturali la ricerca deve restare dentro il container (evitalo se puoi), allora deve essere `position:sticky; top:0` con **sfondo opaco a piena larghezza** e `z-index` sufficiente, e il padding-top del contenuto deve impedire la sovrapposizione iniziale. **Prima scelta: spostarla fuori dallo scroll.**

Verifica dove vive oggi il campo (componente Tree View e i suoi SCSS, `tree-view-sidebar.scss` e gli override in `properties-with-tree-view.scss`) e applica la modifica **scoped al mode floating** se la stessa struttura è usata anche altrove.

## 2. FIX B — L'overlay non deve sovrapporsi alla status bar

**Sintomo:** in basso la card Properties finisce sopra la status bar (`model_1 · N instances · ...`).

**Causa:** l'altezza dell'overlay è governata da un `max-height` che tiene conto solo dell'offset superiore.

**Fix atteso, senza numeri magici inseguiti a mano:** ancorare l'overlay **sia in alto sia in basso**. Sul wrapper `position:fixed`:
- `top`: come oggi (sotto navbar e toolbar del canvas),
- `bottom`: `altezza della status bar + 8px`,
- rimuovere il `max-height` diventato ridondante.

L'altezza della status bar va presa da una costante o variabile esistente se c'è (cerca il componente `StatusBar` e il suo SCSS); solo se non esiste usa un valore tarato con un commento di una riga che spieghi da dove viene.

Con l'overlay ancorato ai due estremi, la colonna interna distribuisce: Tree ad altezza fissa (resizabile) in alto, Properties `flex:1` sotto, con **scroll interno proprio** in modo che il contenuto lungo scorra dentro la card invece di traboccare. Verifica che il resize verticale continui a funzionare e che il Tree non possa essere trascinato oltre lo spazio disponibile (clamp).

## 3. FIX C — MiniMap: prima diagnosticare

"Non funziona" è ambiguo. **Determina quale dei casi è**, poi correggi:

1. **Non è visibile**: controlla in DevTools il computed style di `.react-flow__minimap`. Se `right` risulta non applicato, la causa probabile è un `calc()` invalido: verifica che `--jj-canvas-right-inset` sia scritta **con unità** (`408px`, non `408`). Un valore senza unità rende il `calc()` invalido, la dichiarazione viene scartata e l'elemento torna alla posizione di default. Correggi il writer in `PropertiesWithTreeView.tsx` perché scriva sempre una stringa con `px`, inclusa la scrittura di `0px` da nascosto.
2. **È visibile ma non risponde a click e drag**: **ipotesi principale**, il wrapper `position:fixed` dell'overlay copre un'area più grande delle card visibili (colonna intera, gap fra le due card, zone trasparenti) e **intercetta i pointer event** sul canvas sottostante, MiniMap inclusa. Fix: `pointer-events: none` sul **wrapper** dell'overlay e `pointer-events: auto` sulle **card** (e su ogni elemento interattivo che vive nel wrapper: handle di resize, pill di riapertura). Questa è anche la mitigazione prevista dalla discovery per il pan-under: recupera i click sul canvas in tutte le zone vuote dell'overlay.
3. **È visibile e cliccabile ma non riflette il diagramma**: allora non è una regressione di F2/F3 (nessuna delle due fasi ha toccato i dati della MiniMap). **Fermati e segnala** invece di intervenire a caso.

Applica comunque il `pointer-events` di (2), che è corretto a prescindere: l'overlay non deve rubare click al canvas nelle sue zone non interattive. Riporta nella risposta quale caso hai riscontrato.

## 4. Cosa NON fare

- Non modificare la disposizione, la larghezza o il gating dell'overlay (assestati).
- Non toccare gli inset di fitView introdotti in F3 (funzionano).
- Non reintrodurre gli attributi body del width-lock.
- Non `git add .`.

## 5. Verifica

- `npm run build` senza errori.
- A vista (`localhost:3000`, hard refresh):
  1. Scorri la Tree View: **nessuna riga** compare sopra o dietro il campo `Filter...`; la ricerca resta ferma, il contenuto scorre sotto e viene tagliato in modo netto.
  2. La card Properties termina **sopra** la status bar, con 8px di respiro; a finestra ridotta il contenuto scorre dentro la card invece di traboccare.
  3. Resize verticale fra Tree e Properties ancora funzionante, senza far uscire l'overlay dai suoi ancoraggi.
  4. **MiniMap**: visibile a sinistra dell'overlay, e cliccabile (click e drag spostano la vista del canvas).
  5. Click e pan sul canvas **nelle zone trasparenti** attorno alle card (se ce ne sono): funzionano, non vengono più intercettati.
  6. Nascondi l'overlay: canvas intero, MiniMap alla posizione di default, nessun blocco di interazione.

## 6. Chiusura

- Aggiorna `docs/claude-code-log.md` (tipo `fix`; indica quale caso della MiniMap hai riscontrato).
- `git add` solo i file toccati, per path esplicito. Controlla `git status`.
- Commit convenzionale, inglese, una riga. Es: `fix(panels): clip tree scroll, anchor overlay above status bar, restore canvas pointer events`.
- **Hard stop dopo il commit:** verifica visiva di Alfonso.

## 7. Riferimenti

- Ratifiche 2026-07-29 (`claude/ratifiche_2026-07-29_floating_panels.md`): architettura writer/reader di `--jj-canvas-right-inset`, offset 8px, z 900.
- Report floating `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md`, C9: `pointer-events:none` sulle zone vuote della card era già indicata come mitigazione del pan-under.
