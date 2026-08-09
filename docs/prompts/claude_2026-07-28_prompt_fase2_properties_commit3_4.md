# Fase 2 (completamento) · Properties panel: Commit 3 e 4

**Tipo:** refactor (UI, nessun cambio al modello dati)
**Data prompt:** 2026-07-28
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Contesto:** completa la Fase 2 del redesign del Properties panel. I **Commit 1** (tab su una riga) e **Commit 2** (header collassato via modifier `.props-header--view`) sono **già fatti** (thread F8, committati nel working tree ricostruito). Questo prompt esegue i **due commit rimanenti**, numerati **3** e **4** per continuità con il log e il checkpoint.
**Basato su:** `docs/discovery/discovery_2026-07-28_properties_panel_redesign.md` (Fase 1). **Leggilo prima.**

> Due commit ordinati, ognuno con **hard stop per verifica visiva** di Alfonso su `localhost:3001` (hard-refresh) prima di passare al successivo. Nessun cambio di modello dati: `visible` resta `Conditional<boolean>`, `shape.border` invariato.

---

## 0. Vincoli di ingaggio (leggere prima)

- Leggi `CLAUDE.md` (fonte di verità). Se qualcosa qui lo contraddice, **segnala e fermati**, non eseguire in silenzio.
- **Tocca SOLO i file elencati in §2.** Nessun altro file. Se ritieni ne serva un altro (anche solo un import), **chiedi prima**.
- Leggi **ogni file per intero** prima di editarlo. Preferisci `str_replace` puntuali a riscritture complete.
- **Zero refactoring opportunistico.** **Mai rinominare identificatori esistenti**: classi CSS/SCSS, props, funzioni, componenti, chiavi di context, **custom event**. Prima di introdurre un **nuovo** identificatore (es. una classe micro-label), verifica con `grep -r` nel codebase che non sia già in uso (le collisioni CSS non danno errori di build, si manifestano come bug visivi altrove).
- **Critical-zone:** la discovery ha confermato **nessun import** di `useJjomSync`/`portDistribution` in questi file → **niente Layer Impact Report**.
- `git add <file specifici>` a ogni commit, **mai `git add .`**. Commit message convenzionale, inglese, una riga.
- Dopo ogni edit `npm run build` deve passare **senza errori**. Poi **HARD STOP**: attendi la conferma visiva di Alfonso prima del commit e del passo successivo.
- **I numeri di riga qui sono approssimativi** (`~:NNN`, dal discovery del 2026-07-27): **individua le stringhe e i blocchi per contenuto** leggendo il file, non fidarti del numero (e ricorda che i tuoi stessi edit spostano le righe).
- **Niente em dash** in nessuna stringa o commento che scrivi (usa punto, due punti, punto e virgola o parentesi), nemmeno nei commit message. Stringhe EN concise, senza filler.

## 0-bis. Decisioni ratificate (NON re-interpretare, NON riaprire)

- **Border:** la label del gruppo resta **`Border`** (è `shape.border`; "Line" sarebbe scorretto per i nodi). Si aggiungono **solo** micro-label ai 3 controlli. Non toccare i binding.
- **ConditionalEditor è condiviso.** Relabel EN + valore-sotto-la-modalità sono **voluti**: l'impatto su `visible`, `fill`, `line.*`, TextStyle ed Edge è **accettato**. Non aggiungere guardie per "isolare" i consumatori.
- **Progressive disclosure (Basic/Advanced): fuori scope.** Non wirare `useInterfaceMode`. **Non toccare** il sub-tab locale `basic/advanced` di `VertexAuthoringPanel` (`~:55`): lascialo esattamente com'è.
- **Checkbox / switch:** il canone è `ui/Checkbox` (fill **slate `#334155`**, non cyan); i **pill switch** (`ui/Toggle`/`.bool-toggle`) restano switch. In questi due commit **non si converte e non si ri-stila alcun checkbox/switch**: è solo relabel + layout.
- **Language sweep** degli altri authoring panel (Edge/Row/Matching/TextStyle) e di `views/data/*`/`Info.tsx`: **fuori scope**, fase dedicata separata.

---

## 1. Obiettivo

Chiudere il redesign del Properties panel per il path **View for State / View for Transition** completando le due voci residue: stringhe in **inglese** e gruppo **Border** etichettato nel pannello di authoring del vertice; layout della **visibilità/condizionale** con il valore su riga propria sotto la modalità. Riferimento visivo: Properties "after" del mockup (artifact `jjodel-panel-redesign`).

---

## 2. File in scope (SOLO questi)

1. `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (Commit 3)
2. `frontend/src/components/ui/ConditionalEditor/ConditionalEditor.tsx` (Commit 4)
3. Il **file di stile** di `ConditionalEditor` nella stessa cartella `ui/ConditionalEditor/` (module.css/scss). **Conferma il path reale** leggendo la cartella; tocca **solo** quello (Commit 4).

**Must-NOT-touch** (anche se "sarebbe meglio"): il sub-tab locale `basic/advanced` di `VertexAuthoringPanel` (`~:55`); il componente `ui/Button`; `ui/Checkbox`; `ui/Toggle`; il layer `jj-*` in `_form-system.scss`; la scala privata di `nestedView.scss`; qualsiasi file di `views/data/*` o `Info.tsx`; il custom event `PROPAGATE_VIEW_SIZE` (`'jjodel:propagate-view-size'`) e i suoi handler.

---

## 3. Commit 3 · `refactor: English strings and labeled Border group in vertex authoring`

**File:** `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`

### COSA
1. Tradurre in **inglese** tutte le stringhe IT rivolte all'utente del file.
2. Aggiungere **micro-label `Color` / `Width` / `Style`** ai 3 controlli sotto il gruppo **Border** (label di gruppo "Border" **invariata**).
3. Ripulire la **spaziatura locale** dei gruppi del tab IR usando i token `--space-*`, senza toccare il layer condiviso `jj-*`.

### DOVE
- Stringhe IT (riferimenti da discovery, verifica per contenuto): helper del resize `~:268`; `"Propaga dimensione"` `~:277`; `title`/tooltip `~:272`; `FEATURES_HINT` `~:34` e `HelpText` `~:323`; `ErrorText` `~:212`. Più eventuali residui.
- Gruppo Border: blocco `~:252-258` (ColorPicker + NumberInput/stepper + Select su `border.color` / `border.width` / `border.style`, con `DEFAULT_BORDER`).
- Spaziatura: gruppi/contenitori locali del tab IR nello stesso file.

### COME
- **EN relabel** di label, `HelpText`, `title`/tooltip, `ErrorText`, `FEATURES_HINT`. Traduzioni fissate:
  - helper resize `~:268` → `"Forces the resize handles. Uncheck to lock. When unset, follows the shape."`
  - `"Propaga dimensione"` `~:277` → `"Propagate size"`
  - `title`/tooltip `~:272`, `FEATURES_HINT` `~:34`, `HelpText` `~:323`, `ErrorText` `~:212` → EN **concise**, stesso significato, senza filler e **senza em dash**.
  - Dopo l'edit, `grep` nel file per residui IT (accenti, parole chiave IT) e traducili.
- **Micro-label Border:** sotto la label di gruppo **"Border"** (che resta), aggiungi le 3 micro-label `Color` (ColorPicker), `Width` (NumberInput/stepper), `Style` (Select). **Riusa la classe di field-label già esistente** nel file se il layout regge; solo se non esiste, introduci **una** classe minima scoped (11px, colore slate), **grep-verificata** che non collida. **Binding invariati** (`border.color/width/style`, `DEFAULT_BORDER`): è solo presentazione.
- **Spaziatura (minimale):** normalizza **solo** gli offender locali di spaziatura dei gruppi del tab IR con i token `--space-*`, a livello locale. **Non** editare `_form-system.scss` né classi `jj-*` condivise. Se il ritmo dipende da classi condivise, **lascialo e annotalo** (cleanup sistemico in fase separata).
- **Vincoli di identità:** il pulsante `Propagate size` dispatcha il custom event `PROPAGATE_VIEW_SIZE` (`'jjodel:propagate-view-size'`): il relabel è **solo testo**, non rinominare event/handler/props. **Non toccare** il sub-tab locale `basic/advanced` (`~:55`). Non convertire né ri-stilare checkbox/switch.

### VERIFICA VISIVA (Alfonso, hard stop)
Aprire il tab IR di un vertex: tutte le stringhe in **inglese**; sotto "Border" si leggono `Color` / `Width` / `Style`; nessun layout shift; spaziatura più regolare tra i gruppi. Il pulsante "Propagate size" funziona come prima (evento invariato). Il sub-tab basic/advanced è identico a prima.

**Commit** (dopo l'OK visivo): `git add frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` → `refactor: English strings and labeled Border group in vertex authoring`.

---

## 4. Commit 4 · `refactor: English labels and value-below-mode layout in ConditionalEditor`

**File:** `frontend/src/components/ui/ConditionalEditor/ConditionalEditor.tsx` + il suo file di stile (stessa cartella).

### COSA
1. Tradurre in **inglese** le stringhe IT del componente.
2. Portare il **valore** (il `renderValue` in modalità Fixed; i rami When/Then/Otherwise in modalità Conditional) su una **riga propria a piena larghezza, sotto** i due bottoni segmentati `Fixed/Conditional` (non affiancato al segmented).

### DOVE
- Stringhe IT (riferimenti da discovery, verifica per contenuto): `"Fisso"` `~:66`, `"Condizionale"` `~:67`, `"Quando"` `~:78`, `"Allora"` `~:88`, `"Includi ramo else"` `~:93`, `"Altrimenti"` `~:102`, `"conditional (regole multiple, non ancora editabile)"` `~:48`. Più eventuali residui.
- Layout: contenitore root del componente (segmented `Fixed/Conditional` + `renderValue` / rami) nel file `.tsx` e nel file di stile del componente.

### COME
- **EN relabel** (traduzioni fissate):
  - `"Fisso"` → `"Fixed"`
  - `"Condizionale"` → `"Conditional"`
  - `"Quando"` → `"When"`
  - `"Allora"` → `"Then"`
  - `"Includi ramo else"` → `"Include else branch"`
  - `"Altrimenti"` → `"Otherwise"`
  - `"conditional (regole multiple, non ancora editabile)"` → `"conditional (multiple rules, not yet editable)"`
  - Poi `grep` per residui IT nel file e traducili. Nessun em dash.
- **Layout valore-sotto-la-modalità:** il segmented `Fixed/Conditional` resta in alto; `renderValue` (Fixed) e i rami `When`/`Then`/`Otherwise` (Conditional) vanno resi **sotto**, su riga propria a **piena larghezza**. Ottienilo **nel file di stile**, scoped alla **classe root** del componente (es. `flex-direction: column` / `order`, senza rinominare classi esistenti). **Preferisci CSS puro**: solo se la struttura JSX rende segmented e valore in modo non separabile, aggiungi un **wrapper JSX minimo** scoped, senza rinominare classi esistenti e senza cambiare la logica.
- **Componente condiviso:** la modifica si propaga a `visible`, `fill`, `line.*`, TextStyle, Edge. È **previsto e voluto**: non isolare, non duplicare il componente.

### VERIFICA VISIVA (Alfonso, hard stop)
Nella card Labels, "Visibility" mostra il segmented `Fixed/Conditional` e **sotto** lo switch `Visible`; passando a `Conditional` compaiono `When`/`Then` (e `Otherwise` con else) **sotto** il segmented, a piena larghezza. **Spot-check** su `fill`, `line` e su un asse TextStyle che il valore-sotto-il-mode non rompa quei consumatori. Tutte le stringhe in inglese.

**Commit** (dopo l'OK visivo): `git add frontend/src/components/ui/ConditionalEditor/ConditionalEditor.tsx <file-di-stile>` → `refactor: English labels and value-below-mode layout in ConditionalEditor`.

---

## 5. Chiusura

- Dopo il **Commit 4** e la conferma visiva finale di Alfonso: aggiorna `docs/claude-code-log.md` con **una entry** che chiude la Fase 2 (tipo `refactor`, prompt riassunto in una riga, i file toccati nei due commit, esito, nota "redesign Properties panel, Fase 2, Commit 3-4 di 4"). Formato come da `CLAUDE.md`, con riga finale `Nome del documento prompt: 2026-07-28 Fase 2 Properties panel, Commit 3-4`.
- Se in qualsiasi punto emerge che un fix richiede di toccare un file fuori §2 o un identificatore/classe must-not-touch: **fermati e segnala**, non procedere.

## 6. Riferimenti

- **Discovery Fase 1:** `docs/discovery/discovery_2026-07-28_properties_panel_redesign.md`.
- **Prompt Fase 2 originale (4 commit, per contesto):** `claude/2026-07-27_prompt_fase2_properties_panel_redesign.md`. Commit 1-2 già eseguiti (thread F8).
- **Mockup target:** artifact `jjodel-panel-redesign` (Properties "after").
- **Design tokens:** slate `#334155`, cyan `#0ea5e9` (solo accent, mai per il fill di checkbox), focus `#334155` + rgba shadow, label 11px, griglia 8px (`--space-*`), **solo Bootstrap Icons**, **no layout shift** (dimensioni fisse tra gli stati).
- **Semantica preservata:** `visible: Conditional<boolean>` = modalità + valore; `shape.border` invariato; custom event `PROPAGATE_VIEW_SIZE` invariato; sub-tab locale `basic/advanced` invariato.
