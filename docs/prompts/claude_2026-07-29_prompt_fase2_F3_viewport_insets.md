# Fase 2 · F3 — Il canvas rispetta l'overlay: inset di fitView, MiniMap e FAB

**Tipo:** implementazione scoped. Commit unico (accorpa i vecchi F3 e F4).
**Data prompt:** 2026-07-29
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Precondizione:** F2 e F2-fix committati e verificati a vista (canvas full-width, overlay impilato in alto a destra sotto la toolbar).

> Con il canvas a tutta larghezza, ogni centratura e ogni elemento ancorato a destra ragiona su un'area che l'overlay copre in parte: il contenuto viene centrato sotto le card e la MiniMap finisce sepolta. Questo commit fa rispettare l'inset a fit del viewport, MiniMap e FAB Jodie.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Contraddizioni: **segnala e fermati**.
- **Critical-zone: attenzione.** `EditorV2.tsx` **importa** la sync (`:50` `portDistribution`, `:55` `useJjomSync`, `:66/:92` `sync/*`) ma questo lavoro è **viewport-only**: padding e math di centratura. **Verdetto già dato: LIR non dovuto.** Vincoli operativi:
  - **NON toccare** `useJjomSync.ts`, `portDistribution.ts`, `sync/canvasToJjom.ts`, `sync/syncState.ts`.
  - **NON toccare** il call-site `useJjomSync(...)` (`EditorV2.tsx:412-433`) né il suo callback, né la firma dell'hook.
  - Se per completare il task ti servisse toccare uno di questi, **fermati e produci un Layer Impact Report** invece di procedere.
- **`git add` scoped** per path espliciti. **MAI `git add .`**.
- Commit che tocca >3 file: **elenca prima** i file e cosa cambia in ciascuno (già in §2), poi procedi.
- Zero refactoring opportunistico, `str_replace` puntuali.

## 1. Architettura della soluzione (leggere prima di editare)

La larghezza dell'overlay è **resizabile dall'utente** e l'overlay può essere **nascosto** (modalità pill). Un inset hard-coded sarebbe sbagliato dopo il primo resize. Quindi: **un solo writer, tre reader.**

- **Writer**: l'overlay (mode `floating`) scrive su `document.body` una variabile CSS con l'inset destro corrente, cioè la propria larghezza più l'offset di 8px. Quando l'overlay è nascosto scrive `0px` (o rimuove la var, purché i reader abbiano fallback `0px`).
- **Reader 1**: la MiniMap, via `calc()`.
- **Reader 2**: il FAB Jodie, via `calc()`.
- **Reader 3**: un helper JS che legge la stessa var e la passa a `fitView` come padding destro.

Nome proposto della var: `--jj-canvas-right-inset`. **Verifica con `grep -r` che non sia già in uso** prima di introdurlo (collisioni CSS: §CLAUDE.md).

Nota: si è appena ritirata la var `--properties-tree-tab-width` del width-lock. Questa è diversa e legittima: writer unico, non dimensiona il dock, serve solo a far rispettare l'inset agli ancoraggi visivi. Non reintrodurre in alcun modo gli attributi body del width-lock (`data-properties-tree-*`).

## 2. File toccati (5 + log)

1. **`src/components/editors/PropertiesWithTreeView.tsx`** (writer): effect, attivo **solo** per `mode === 'floating'`, che scrive `--jj-canvas-right-inset` su `document.body` con `larghezza overlay + 8px`; aggiorna a ogni resize della larghezza e quando l'overlay passa a nascosto/visibile (valore `0px` da nascosto); cleanup all'unmount.
2. **nuovo file util** (es. `src/components/editor-v2/viewportInset.ts`, nome e path da verificare con `grep`): esporta un helper, es. `getCanvasRightInset(): number`, che legge la var da `getComputedStyle(document.body)` e la parsa in px, con fallback `0`. Nessun import di sync. Tienilo minuscolo.
3. **`src/components/editor-v2/EditorV2.tsx`** (viewport + MiniMap): vedi §3.
4. **`src/components/editor-v2/problems/NodeProblemOverlay.tsx`** (`:162`): stesso trattamento del padding sul `fitView` di focus (oggi `padding: 0.3`). Fuori critical-zone.
5. **`src/components/Jodie/JodieWindow.css`** (`:871-876`): il FAB (oggi `right: 30px`) diventa `right: calc(var(--jj-canvas-right-inset, 0px) + 30px)`. Non toccare `bottom`, dimensioni, `z-index`.
6. **`docs/claude-code-log.md`**: entry a fine task.

## 3. EditorV2.tsx, punto per punto

### 3.1 Call-site di fitView da insettare
Applica lo stesso padding per-lato a tutti questi (elenco dal report base, verifica le righe sul codice attuale):

| # | Riga | Contesto |
|---|------|----------|
| a | `:572` | `fitViewRef` (fit dopo il sync iniziale) |
| f | `:3113-3114` | reset-zoom |
| g | `:3115` | `handleFitView` (bottone fit in toolbar) |
| i | `:3281` | dopo auto-layout ELK |
| j | `:3809-3810` | `fitViewOptions` dichiarativo su `<ReactFlow>` |

**Come**: `padding` in ReactFlow 12 accetta un oggetto per-lato con unità (`` `${number}px` ``, `` `${number}%` ``, o number relativo). **Verifica la semantica esatta nei tipi installati** (`@xyflow/system`, `types/general.d.ts`) prima di scrivere i valori.

Intento da preservare: il respiro attuale (`padding: 0.2`, e `0.3` per NodeProblemOverlay) resta su **top, bottom e left**; sul **right** si aggiunge l'inset dell'overlay più un piccolo respiro. Esempio della forma attesa, da adattare alla semantica verificata:

```ts
const inset = getCanvasRightInset();
const opts = { padding: { top: '20%', bottom: '20%', left: '20%', right: `${inset + 20}px` }, maxZoom: 1 };
```

**Requisito non negoziabile**: con `inset === 0` (overlay nascosto) il comportamento deve coincidere con quello di oggi. Se la conversione da `0.2` a percentuale non è equivalente, **preferisci mantenere il valore relativo dove possibile** e segnalalo.

Nota sul caso (j), fit dichiarativo al load: al primissimo render l'overlay potrebbe non essere ancora misurato e l'inset risultare 0, con un fit leggermente decentrato. È accettabile: il fit esplicito dopo il sync (call-site a) corregge subito. **Non costruire retry o observer per questo.**

### 3.2 Il caso hard-coded (`:906-907`)
Evento `jjodel:selectNode` (focus nodo dalla TreeView). Oggi:

```
setViewport({ x: -x*zoom + window.innerWidth/3, y: -y*zoom + window.innerHeight/3, zoom }, ...)
```

`setViewport` non accetta padding: la correzione è manuale. Sottrai l'inset dalla larghezza utile, preservando l'intento "il nodo finisce a un terzo da sinistra dell'area visibile":

```
x: -x*zoom + (window.innerWidth - getCanvasRightInset())/3
```

Lascia **invariato** il termine `y` (l'overlay non copre in verticale l'area utile) e la durata dell'animazione.

### 3.3 MiniMap (`:3846-3857`)
Inline style oggi `right: '20px'`. Diventa `right: 'calc(var(--jj-canvas-right-inset, 0px) + 20px)'`. Non toccare `bottom: '100px'` né le altre prop della MiniMap.

### 3.4 Da NON toccare
- Call-site di solo zoom (`:3105`, `:3110`, `:3124`): sono neutri.
- `screenToFlowPosition` (`:1944`, `:2152`): math del drop pointer-relative, non centratura.
- `repro/ReproHarness.tsx`: harness dev, fuori produzione.
- Tutto ciò che è elencato in §0 come critical-zone.

## 4. Cosa NON fare

- Non ritirare altro width-lock (residuo a F5).
- Non reintrodurre gli attributi body `data-properties-tree-*`.
- Non modificare la disposizione, le dimensioni o il gating dell'overlay (assestati in F2-fix).
- Non `git add .`.

## 5. Verifica

- `npm run build` senza errori.
- A vista (`localhost:3000`, hard refresh):
  1. Apri un modello e premi il bottone **fit** in toolbar: il diagramma si centra nell'area **visibile**, non sotto le card. Nessun nodo resta nascosto dietro l'overlay per effetto del fit.
  2. **Reset zoom** e **auto-layout**: stesso comportamento.
  3. Clicca un nodo nella **Tree View**: il nodo va a fuoco nell'area visibile, non sotto l'overlay.
  4. La **MiniMap** è interamente visibile, a sinistra dell'overlay.
  5. Il **FAB Jodie** è a sinistra dell'overlay, non ci si sovrappone.
  6. **Ridimensiona** l'overlay dal bordo sinistro, poi rifai fit: l'inset segue la nuova larghezza. MiniMap e FAB si spostano di conseguenza.
  7. **Nascondi** l'overlay (pill): fit, MiniMap e FAB tornano a usare tutta la larghezza, esattamente come prima di questa fase.

## 6. Chiusura

- Aggiorna `docs/claude-code-log.md` (tipo `feat` o `fix` secondo il tuo giudizio; cita la var introdotta e i call-site insettati).
- `git add` solo i file toccati, per path esplicito. Controlla `git status`: nessun WIP estraneo staged.
- Commit convenzionale, inglese, una riga. Es: `feat(canvas): inset viewport fit and anchored controls by the floating overlay`.
- **Hard stop dopo il commit:** verifica visiva di Alfonso. Dopo questo resta solo F5 (ritiro width-lock residuo e finalizzazione del gating del cluster).

## 7. Riferimenti

- Report floating: `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md`, A2 (tabella call-site fit e centratura), A3 (padding per-lato in ReactFlow 12.10 e caveat su `setViewport`/`fitBounds`), A4 (MiniMap, FAB, toolbar), A5.bis e verdetto LIR.
- Ratifiche 2026-07-29: overlay portal su body, offset destro 8px, z 900.
