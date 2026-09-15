# Discovery, layout dei contenitori: rail a filo, overlay del canvas, toast

**Data**: 2026-08-19 - **Branch**: `alfonso-frontend-jjtl` - **HEAD**: `363e121c0`
**Prompt**: `claude_2026-08-19_2336_prompt_ui_A_layout_contenitori.md`
**Fase**: 1, read-only. Nessun file di codice modificato, nessun commit.

> Nota sulla lingua: il report e' in italiano come tutti i documenti di `docs/discovery/`.
> La regola "tutto in inglese" del prompt e' applicata a commenti, commit message e stringhe UI,
> che sono gli artefatti citati esplicitamente. Se intendevi anche i documenti, dillo e lo traduco.

---

## 0. Obiettivo

Censire, senza toccare nulla, i sei punti richiesti: i due contenitori laterali, l'origine dello
stile a card del rail destro, i tre elementi accatastati in basso a sinistra, il toast, l'esistenza
di una scala di z-index, e le collisioni di nome per eventuali classi nuove.

**Il metodo e' stato la misura, non la sola lettura.** Ogni numero qui sotto viene dal DOM vivo sul
dev server (`http://localhost:3000`, confermata la porta 3000), catturato con una sonda Playwright
temporanea `frontend/scripts/smoke/_tmp_uiA.ts` (non committata) su un progetto creato ex novo,
modalita' avanzata, viewport 1440x900, tab del modello M1 aperto. Le prime due esecuzioni hanno
prodotto misure inutilizzabili, perche' avevano agganciato l'istanza di editor del tab non visibile
(rect con `x = -1437`). I numeri riportati sono quelli dell'istanza visibile, filtrata per
`rect.left >= 0`.

Questo ha cambiato tre conclusioni rispetto a quello che la sola lettura del codice suggeriva. Sono
segnate come **CORREZIONE** dove capita.

---

## 1. File letti

Codice:
- `frontend/src/components/editor-v2/EditorV2.tsx` (composizione del layout, `PalettePanel`, `SimulationPanel` portalato)
- `frontend/src/components/editor-v2/EditorV2.scss` (`.editor-v2`, `.editor-v2-palette`, `.palette-hints`)
- `frontend/src/components/editor-v2/panels/PalettePanel.tsx` (blocco dei tre hint)
- `frontend/src/components/editor-v2/_themes.scss` (definizione di `--border-subtle`)
- `frontend/src/components/abstract/tabs/EditorSwitch.scss` (`.editor-switch-container`, `.editor-switch-stage`)
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (classi radice del rail destro)
- `frontend/src/components/editors/properties-with-tree-view.scss` (`.properties-tree-overlay`, `.properties-with-tree-view--rail`, `.properties-tree-floating-cluster`)
- `frontend/src/components/editor-v2/sim/simulation-panel.scss` (`.sim-panel`)
- `frontend/src/components/Jodie/JodieWindow.css` (`.jodie-minimized`)
- `frontend/src/components/JjodieWidget/jjodie-widget.scss` (`.jjodie-fab`)
- `frontend/src/components/StatusBar.scss` (`.app-statusbar`)
- `frontend/src/components/Toast/toast.scss`, `ToastContainer.tsx`, `toastTypes.ts`
- `frontend/src/styles/tokens/_z-index.scss`, `frontend/src/styles/tokens/_spacing.scss`

Documenti:
- `docs/decisions.md`, serie `R-RAIL-1..41`
- `docs/claude-code-log.md`, ultime voci

---

## 2. Findings

### 2.1 Punto 1: i due contenitori laterali

| | rail sinistro | rail destro |
|---|---|---|
| Componente | `panels/PalettePanel.tsx`, elemento `<aside>` | `editors/PropertiesWithTreeView.tsx` |
| SCSS | `editor-v2/EditorV2.scss` (`.editor-v2-palette` e `.editor-v2-palette--m1`) | `editors/properties-with-tree-view.scss` |
| Classi radice | `editor-v2-palette editor-v2-palette--m1` | `properties-tree-overlay` (wrapper) e dentro `properties-with-tree-view properties-with-tree-view--floating properties-with-tree-view--rail` |
| Innesto | **in flusso**, flex item di `.editor-v2` (chain: `aside < div.editor-v2 < div.editor-switch-stage < div.editor-switch-container`) | **portalato su `<body>`**, `position: fixed` (chain: `div.properties-tree-overlay < body`) |
| Rect misurato | x=1, y=50, w=200, h=900 | x=1032, y=100, w=400, h=760 |
| Bordo | `border-right: 1px solid rgba(0, 0, 0, 0.06)` | `border: 1px solid rgb(226, 232, 240)` |

I due non sono innestati nello stesso contenitore, e questa e' la differenza strutturale che governa
tutto il resto: il sinistro e' un flex item che vive dentro l'editor, il destro e' un overlay
`position: fixed` figlio di `<body>`, montato via portal da `PropertiesWithTreeView.tsx` (la classe
`.properties-tree-overlay` compare li' con la larghezza inline, `style={{ width: overlayWidth }}`).

### 2.2 Punto 2: da dove viene lo stile a card del rail destro

Le cinque proprieta' non stanno tutte nello stesso posto, e questo e' il fatto operativo piu'
importante del report.

**Il margine esterno non e' un `margin`.** Il computed `margin` del rail destro e' `0px`. La distanza
dai bordi viene dagli **inset del wrapper portalato**, in `properties-with-tree-view.scss`, regola
`.properties-tree-overlay`:

- `top: calc(60px + 40px)` (navbar 60 piu' toolbar 40), misurato 100px
- `right: 8px`, con il commento in loco `ratified 8px gutter from the canvas edge`
- `bottom: calc(32px + 8px)`, misurato 40px (status bar 32 piu' 8 di stacco)
- `z-index: 900`

**Angoli, ombra e bordo stanno sul guscio interno**, regola `.properties-with-tree-view--rail`:

- `border-radius: var(--radius-lg)`, misurato **12px**
- `box-shadow: 0 4px 16px var(--color-node-shadow)`, misurato `rgba(15, 23, 42, 0.06) 0px 4px 16px`
- `border: 1px solid var(--color-panel-border)`, misurato `rgb(226, 232, 240)` cioe' `#e2e8f0`
- `background: var(--color-panel-bg)`, `overflow: hidden`

**Nessuna `height` calcolata**: l'altezza (760px misurati) e' il risultato di `top` e `bottom` sul
wrapper fisso, non una `calc()` sull'altezza.

Quindi il punto di intervento per D-UI-1 e' **duplice**: gli inset stanno su `.properties-tree-overlay`
(righe con `right: 8px` e `bottom: calc(32px + 8px)`), il chrome sta su `.properties-with-tree-view--rail`
(le tre dichiarazioni `border-radius`, `box-shadow`, `border`). Toccarne una sola lascia il difetto a meta'.

Esiste un terzo elemento vicino ma **fuori perimetro**: `.properties-tree-floating-cluster`, un
cluster di bottoni `position: fixed; top: 150px; right: 16px; z-index: 900` con card propria. Non e'
il rail, e' la pulsantiera che lo affianca. Se il rail va a filo, quel cluster resta a 16px dal bordo
e la relazione visiva cambia. Censito, non toccato: vedi domanda 3.

### 2.3 Punto 3: i tre elementi in basso a sinistra. CORREZIONE alla diagnosi

La premessa del prompt (tre elementi che si accavallano sul canvas in circa 60px) non regge alla
misura. I fatti, con i rect presi dal DOM vivo:

| Elemento | File | Posizionamento | Rect (x, y, w, h) | Banda verticale | z-index |
|---|---|---|---|---|---|
| Cerchio di Jjodie | `Jodie/JodieWindow.css`, regola `.jodie-minimized` | `fixed` | 30, 742, 58, 58 | 742 - 800 | **10000** |
| Pill `Simulation` | `editor-v2/sim/simulation-panel.scss`, regola `.sim-panel` con `&--closed` | `fixed`, `left: 16px`, `bottom: 48px` | 16, 820, 107, 32 | 820 - 852 | 850 |
| Riga di aiuto | `panels/PalettePanel.tsx`, blocco `.palette-hints` | **in flusso, dentro il rail sinistro** | 15, 842, 171, 94 | 842 - 936 | auto |

Tre correzioni.

**(a) La riga di aiuto non e' un overlay del canvas.** Sta dentro `<aside class="editor-v2-palette">`,
nel blocco `.palette-hints` (`margin-top: auto`, quindi appoggiato al fondo del rail). E non e' una
riga: sono **tre**, e il testo completo, letto dal sorgente e non dedotto, e':

```
drag         to canvas for root instances
right-click  on a node to add children
dbl-click    to edit values
```

**(b) Non c'e' nessun troncamento orizzontale.** Misurato per ciascuno dei tre `.palette-hint__text`:
`scrollWidth` uguale a `clientWidth`, `clipped: false`. Il testo va a capo dentro la larghezza del
rail, non viene tagliato di lato. Quello che si legge a schermo come "finisce con `to canvas for
root`" e' la **prima riga di un testo andato a capo**, con la seconda ("instances") gia' sotto il
bordo superiore della status bar.

**(c) La causa non sono il FAB e la pill.** Le loro bande (742-800 e 820-852) stanno **sopra** il
blocco hint (842-936) e non lo coprono. La causa e' che il rail sinistro sfora il proprio slot:

- `.editor-v2` dichiara `height: 100vh` (`EditorV2.scss`, regola `.editor-v2`), cioe' 900px
- lo slot reale va da y=50 (sotto la navbar) a y=868 (sopra la status bar), cioe' **818px**
- il rail misura quindi y=50, h=900, con fondo a **950**, 50px oltre il viewport
- `.app-statusbar` occupa 868-900 con `z-index: 50` e ci passa sopra

Risultato per le tre righe: riga 1 a y=853, alta 28 su due righe di testo, con la seconda coperta
dalla status bar da 868 in giu'; riga 2 a y=887, interamente sotto la status bar; riga 3 a y=921,
interamente fuori dal viewport. Il rail non scrolla (`scrollHeight` 900 uguale a `clientHeight` 900),
quindi il contenuto non e' raggiungibile in nessun modo.

**Conseguenza per il commit 2**: spostare la pill e il FAB, che e' l'ordine di sacrificio indicato
dal prompt, **non renderebbe leggibile la riga di aiuto**. Il difetto e' l'altezza del contenitore.
Vedi la proposta in §4.2 e la domanda 2.

### 2.4 Punto 4: il toast

- Componente: `frontend/src/components/Toast/`, container `ToastContainer.tsx`, stili `toast.scss`.
- Sistema: `ToastProvider` con contesto React. `U.alert()` (`common/U.tsx`) e' un facade deprecato che
  rimappa su `toast.*`; `Project Saved!` arriva da li' (`Offline.save` chiama `U.alert('i', 'Project Saved!', '')`).
- Posizione: default `bottom-right` (`ToastContainer.tsx`, valore di default del parametro `position`),
  classe `.jj-toast-container--bottom-right`, con `bottom: var(--space-4)` e `right: var(--space-4)`,
  cioe' 16px (`tokens/_spacing.scss`, `--space-4: 1rem`).
- `z-index: var(--z-toast)`, misurato **999998**.
- Durata: `toastTypes.ts`, `DEFAULT_TOAST_PREFS`: info 5000ms, success 3000ms, warning e error 0
  (persistenti). `Project Saved!` e' un `info`, quindi **5 secondi**.

Misura della sovrapposizione, subito dopo `Cmd+S`:

- container: rect x=1032... (misurato x=1104, y=825, w=320, h=59), inset `bottom: 16px; right: 16px`
- `.app-statusbar`: rect x=0, y=868, w=1440, h=32, `z-index: 50`, testo
  `model_1 0 instances - metamodel_1 v3.0.0-beta (2533)`
- **`overlapsStatusBar: true`**: il toast va da 825 a 884, la status bar da 868 a 900, quindi
  **16px di sovrapposizione**, e il toast e' quasi un milione di livelli sopra.

La stringa di versione sta nella zona destra della status bar, che e' esattamente la porzione coperta.

### 2.5 Punto 5: la scala di z-index esiste

`frontend/src/styles/tokens/_z-index.scss`, definita su `:root`, quindi globale e disponibile anche
agli elementi portalati su `<body>`. Gradini rilevanti: `--z-base: 0`, `--z-content: 1`,
`--z-elevated: 10`, `--z-sticky: 100`, `--z-dropdown: 1000`, `--z-modal: 9999`, `--z-alert: 10000`,
`--z-toast: 999998`, `--z-debug: 999999`. Il file porta gia' un blocco "LEGACY COMPATIBILITY" che
elenca valori hardcoded da migrare.

**I quattro attori di questo prompt sono tutti fuori scala**, con valori letterali:

| Elemento | z-index attuale | Gradino piu' vicino |
|---|---|---|
| `.app-statusbar` | 50 | nessuno esatto (tra `--z-elevated` 10 e `--z-sticky` 100) |
| `.sim-panel` | 850 | nessuno |
| `.properties-tree-overlay` | 900 | nessuno |
| `.jodie-minimized` | 10000 | `--z-alert` |

Come chiede il prompt, **non creo ne' estendo la scala in questo giro**: censito e basta. Da notare
pero' che il commento di `--z-navbar` nel file token documenta gia' la tensione fra `.nav-container`
e `.properties-tree-overlay` a 900, quindi il 900 del rail e' un valore noto e discusso, non un caso.

### 2.6 Punto 6: collisione preventiva sui nomi

Gli interventi proposti in §4 **non introducono nessuna classe nuova**: modificano dichiarazioni
dentro regole gia' esistenti. La ricerca di collisione si e' quindi spostata sull'uso delle classi
che tocco, per verificare che non servano ad altro:

- `.properties-tree-overlay`: 5 occorrenze totali. Una in `PropertiesWithTreeView.tsx` (il montaggio),
  tre in `properties-with-tree-view.scss` (la regola e due kill-switch su `body[data-layout-mode]` e
  `body[data-active-tab]`), una in un commento di `_z-index.scss`. Nessun altro consumatore.
- `.properties-with-tree-view--rail`: applicata solo nel ramo `isFloating` di
  `PropertiesWithTreeView.tsx`, piu' le regole di `properties-with-tree-view.scss`. Esiste un
  modificatore fratello `--rail-focus` che si somma al primo: le sue regole non toccano radius,
  ombra ne' bordo del guscio, quindi non entrano in conflitto.
- `.editor-v2` e `.editor-v2-palette`: la seconda vive solo in `EditorV2.scss` e `PalettePanel.tsx`.

Nessuna collisione trovata.

---

## 3. Dipendenze e rischi

### 3.1 Rischio alto: `--border-subtle` non e' visibile al rail destro

Il prompt chiede, per il commit 1, di "riusare il token o la variabile gia' impiegata dal bordo del
rail sinistro". **Non e' eseguibile alla lettera.** Il bordo del rail sinistro usa `var(--border-subtle)`,
che e' definita in `editor-v2/_themes.scss` su `.editor-v2.theme-dark` e `.editor-v2.theme-light`,
cioe' **scoping sul contenitore dell'editor**. Il rail destro e' portalato su `<body>`, fuori da quel
sottoalbero: li' `var(--border-subtle)` non risolve e il bordo sparirebbe.

Le tre vie possibili sono in §5, domanda 1. Va decisa prima di scrivere il commit 1.

### 3.2 I due rail non diventeranno verticalmente identici

Il rail sinistro parte da **y=50** (sotto la sola navbar), perche' la toolbar dell'editor vive dentro
`.editor-v2__main`, cioe' nella colonna del canvas, alla destra della palette. Il rail destro parte da
**y=100** (sotto navbar piu' toolbar). Portare il destro a filo non li allinea in alto: la richiesta
del prompt, "dal bordo inferiore della toolbar al bordo superiore della status bar", tiene il destro a
100 e li lascia sfalsati di 50px. E' coerente con il testo del prompt, ma non con la lettura "entrambi
dello stesso tipo" presa alla lettera. Segnalato, non deciso: domanda 4.

### 3.3 Il commit 2 dipende da una modifica piu' invasiva di quella prevista

Come da §2.3, la causa e' `height: 100vh` su `.editor-v2`. Cambiarla tocca **tutta** la colonna
dell'editor (palette, toolbar, canvas), non solo il blocco hint. E' una riga sola con raggio d'azione
largo, e i suoi effetti si vedono su ogni tab di editor, M1 e M2. Non e' un intervento da fare
"di slancio" dentro un commit intitolato agli overlay: va isolato e verificato a schermo.

### 3.4 Nessun conflitto con la serie R-RAIL

Ricerca eseguita su `docs/decisions.md`, serie `R-RAIL-1..41` (41 voci). **Nessuna ratifica prescrive
che il rail destro sia flottante, ne' fissa il gutter di 8px o il raggio.** R-RAIL-10 vincola le
ombre a essere composte a mano da un token colore invece che da `var(--shadow-*)`, il che riguarda
come si scrive un'ombra, non se ci debba essere. Il commento `ratified 8px gutter from the canvas edge`
in `properties-with-tree-view.scss` risale al blocco "FLOATING OVERLAY (F2 2026-07-29)", quindi a una
ratifica anteriore alla serie R-RAIL e non registrata li'. **D-UI-1 non contraddice nessuna decisione
in vigore a registro**, ma supera quel commento, che va aggiornato contestualmente per non lasciare in
codice una nota che dichiara ratificato l'opposto di quello che il codice fara'.

---

## 4. Proposte per i tre commit (da approvare, non eseguite)

### 4.1 Commit 1, rail destro a filo

`frontend/src/components/editors/properties-with-tree-view.scss`, due regole:

- `.properties-tree-overlay`: `right: 8px` a `right: 0`; `bottom: calc(32px + 8px)` a `bottom: 32px`.
  `top` resta `calc(60px + 40px)`. Aggiornare i due commenti in loco, che oggi spiegano il gutter e
  lo stacco dalla status bar.
- `.properties-with-tree-view--rail`: rimuovere `border-radius` e `box-shadow`; portare `border:
  1px solid ...` a `border-left: 1px solid ...` (solo il lato verso il canvas), colore secondo la
  decisione della domanda 1. `overflow: hidden` resta: serve ancora a contenere le zone.

Padding interno non toccato, larghezza non toccata, logica del chevron non toccata. Il chevron vive
in `.properties-panel-toggle-btn` e non e' sfiorato.

### 4.2 Commit 2, overlay in basso a sinistra

Qui il prompt e la misura divergono, quindi propongo e non decido. Tre pezzi, separabili:

1. **L'altezza del rail** (`.editor-v2 { height: 100vh }`). E' la causa. Il candidato e'
   `height: 100%`, dato che `.editor-switch-container` e `.editor-switch-stage` sono gia' entrambi
   `height: 100%` e lo slot di rc-dock ha l'altezza giusta (819px misurati). Da verificare a schermo
   su M1 e M2, perche' tocca anche il canvas.
2. **La pill `Simulation`** (`.sim-panel`, `left: 16px; bottom: 48px`): sta sopra il rail, non sopra
   il canvas. Con il rail alto correttamente, la banda 820-852 cade dentro l'area del rail e continua
   a coprirne il contenuto. Va spostata, ed e' il primo sacrificio previsto dal prompt.
3. **Il cerchio di Jjodie** (`.jodie-minimized`, banda 742-800): stesso discorso, secondo sacrificio.

Nota su `.jodie-minimized`: `JodieWindow.css` contiene gia' una regola
`body:has(.leftbar) .jodie-minimized`, cioe' un precedente di riposizionamento condizionato alla
presenza di un rail. Va letta prima di spostarlo, per non scrivere una seconda regola che litiga con
la prima.

Il testo dei tre hint non si tocca, come da vincolo.

### 4.3 Commit 3, toast

`frontend/src/components/Toast/toast.scss`, regola `.jj-toast-container--bottom-right` (e per
simmetria `--bottom-left`, che ha lo stesso difetto): portare `bottom` da `var(--space-4)` a un valore
che parta sopra la status bar. Il valore coerente con quello che il rail destro gia' usa e'
`calc(32px + var(--space-4))`, cioe' l'altezza della status bar piu' lo stacco standard. Durata, testo
e meccanismo non toccati, come da vincolo.

Alternativa piu' pulita ma fuori dal minimo: un token per l'altezza della status bar, oggi ripetuta
come letterale `32px` in almeno tre punti (`StatusBar.scss`, `properties-with-tree-view.scss`, e qui).
Non la propongo per questo giro; la segnalo perche' e' la terza ripetizione dello stesso numero.

---

## 5. Domande aperte per Alfonso

1. **Colore del bordo del rail destro** (blocca il commit 1). `--border-subtle` non e' raggiungibile
   fuori da `.editor-v2` (§3.1). Tre opzioni: (a) tenere `--color-panel-border` (`#e2e8f0`), che e'
   gia' li' e globale, accettando che il bordo destro sia leggermente diverso dal sinistro
   (`rgba(0,0,0,0.06)`); (b) promuovere il valore in `styles/tokens/` e farlo usare a entrambi i rail,
   che allinea davvero i due bordi ma tocca anche il rail sinistro, fuori dal perimetro dichiarato;
   (c) altro. Io propongo (a) per questo giro e (b) come voce a parte, perche' (b) modifica un file di
   token e un rail che il prompt non nomina.
2. **Il commit 2 cambia natura** (§2.3). La riga di aiuto e' illeggibile perche' il rail e' alto
   100vh dentro uno slot da 818px, non perche' il FAB la copra. Vuoi che il commit 2 diventi "il rail
   sinistro sta dentro il proprio slot" piu' lo spostamento dei due overlay, oppure preferisci
   spezzare in due commit distinti, altezza prima e overlay poi? La seconda e' piu' bisecabile,
   visto che l'altezza tocca anche il canvas.
3. **`.properties-tree-floating-cluster`** resta a `right: 16px` mentre il rail va a 0. La pulsantiera
   si stacchera' visivamente dal rail. La lascio com'e' (fuori perimetro) o la allineo nel commit 1?
4. **I due rail resteranno sfalsati in alto di 50px** (§3.2), perche' la toolbar sta nella colonna del
   canvas e non sopra la palette. Confermi che va bene, o "dello stesso tipo" implica anche partire
   dalla stessa y?
5. **Lingua dei documenti**: confermi che la regola "tutto in inglese" vale per commenti, commit
   message e stringhe UI, e non per i documenti in `docs/`, che sono tutti in italiano?

---

## 6. Stato

Fase 1 chiusa. Nessun file di codice modificato, nessun commit. Sonda temporanea
`frontend/scripts/smoke/_tmp_uiA.ts` lasciata untracked insieme a due screenshot
(`_tmp_uiA_before.png`, `_tmp_uiA_toast.png`), riutilizzabile per verificare i tre commit; da
cancellare a fine giro.

Prossimo passo, **su go-ahead**: commit 1, dopo la risposta alla domanda 1.
