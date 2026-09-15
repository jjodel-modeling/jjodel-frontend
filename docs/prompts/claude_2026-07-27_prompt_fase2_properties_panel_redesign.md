# Fase 2 — Implementazione scoped: Properties panel (redesign lato destro)

**Tipo:** refactor + feat (UI, no cambi di modello dati)
**Data prompt:** 2026-07-27
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Basato su:** `docs/discovery/discovery_2026-07-28_properties_panel_redesign.md` (Fase 1). Leggilo prima.

> Implementazione del redesign del Properties panel, **scoped** ai soli file dichiarati sotto. Nessun cambio al modello dati (`visible` resta `Conditional<boolean>`, `shape.border` invariato). Struttura in **4 commit ordinati**, ognuno con **hard stop per verifica visiva** di Alfonso prima del commit successivo.

---

## 0. Vincoli di ingaggio (leggere prima)

- Leggi `CLAUDE.md` (fonte di verità). Se qualcosa qui lo contraddice, **segnala e fermati**.
- **Tocca SOLO i 5 file in §2.** Nessun altro file. Se ritieni ne serva un altro, **chiedi prima**.
- Leggi **ogni file per intero** prima di editarlo. Preferisci `str_replace` puntuali a riscritture.
- **Zero refactoring opportunistico.** **Mai rinominare identificatori esistenti** (classi CSS/SCSS, props, funzioni, componenti). Prima di introdurre un **nuovo** identificatore (classe, modifier), verifica con `grep -r` che non sia già in uso.
- Critical-zone: la discovery ha confermato **nessun import** di `useJjomSync`/`portDistribution` qui → **niente Layer Impact Report**.
- `git add <file specifici>` a ogni commit, **mai `git add .`**. Commit message convenzionale, inglese, una riga.
- Dopo ogni edit, `npm run build` deve passare senza errori. Poi **HARD STOP**: attendi la conferma visiva di Alfonso (localhost:3001, hard-refresh) prima del commit e del passo successivo.

## 0-bis. Decisioni ratificate (non re-interpretare)

- **Lingua:** relabel IT→EN **solo** nei componenti toccati (`VertexAuthoringPanel`, `ConditionalEditor`, `ViewData`). **Non** toccare Edge/Row/Matching/TextStyle né `views/data/*` né `Info.tsx`.
- **ConditionalEditor (condiviso):** sì, relabel EN + valore sotto la modalità. L'impatto sugli altri consumatori (fill, line, textstyle, edge) è **accettato e voluto**.
- **Progressive disclosure (Basic/Advanced):** **fuori scope**. Non wirare `useInterfaceMode`. **Non** toccare il sub-tab locale `basic/advanced` di `VertexAuthoringPanel` (`:55`): lasciarlo esattamente com'è.
- **P4 label:** resta **"Border"** (è `shape.border`; "Line" sarebbe scorretto per i nodi). Si aggiungono solo micro-label ai controlli.
- **Checkbox:** canone `ui/Checkbox` (fill **slate `#334155`**, non cyan). I **pill switch** (`ui/Toggle`/`.bool-toggle`) restano switch, non si convertono. Checkbox native legacy del tab Style **fuori scope**.
- **Header:** collasso **solo** le due righe di `ViewData` (`.props-header` + breadcrumb). La tab "Properties" del dock **non si tocca**.

---

## 1. Obiettivo

Applicare i 6 fix del redesign al path **View for State / View for Transition** (stesso `ViewDataComponent`):
tab su una riga, header collassato, gruppo "Border" etichettato, visibilità con valore annidato sotto la modalità, stringhe in inglese, ritmo di spaziatura più pulito. Riferimento visivo: Properties "after" del mockup (artifact `jjodel-panel-redesign`).

---

## 2. File in scope (SOLO questi)

1. `frontend/src/components/editors/views/ViewData.tsx`
2. `frontend/src/components/editors/views/nestedView.scss`
3. `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`
4. `frontend/src/components/ui/ConditionalEditor/ConditionalEditor.tsx`
5. Il file di stile di `ConditionalEditor` (module.css/scss nella stessa cartella `ui/ConditionalEditor/`). **Conferma il path reale** leggendo la cartella; tocca solo quello.

**Must-NOT-touch** (anche se "sarebbe meglio"): la base `.props-header` / `.props-header__icon` / `.props-header__name` (condivisa con l'inspector metaclasse, `Info.tsx`); il componente `ui/Button`; `ui/Checkbox`; il layer `jj-*` in `_form-system.scss`; la scala privata di `nestedView.scss`; il sub-tab locale `basic/advanced` di `VertexAuthoringPanel`.

---

## 3. Commit ordinati (hard stop dopo ognuno)

### Commit 1 — `fix: single-line scrollable tab bar in view editor`
**File:** `nestedView.scss`
**COME:**
- Su `.view-editor-tab-bar` (`~:3592`): impedisci il wrap e abilita lo scroll orizzontale (`flex-wrap: nowrap; overflow-x: auto`), nascondi la scrollbar (`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`).
- Su `.view-editor-tab` (`~:3601`): `white-space: nowrap` e **altezza fissa** coerente (allinea all'altezza attuale del tab più alto, così `Apply to` non manda più a capo). Non cambiare padding/underline attivo se non serve ad ottenere l'altezza fissa.
- **Solo aggiunta di proprietà**, nessun rename di classe. Non toccare `.view-editor-tab-content`.
**Verifica visiva (Alfonso):** aprire un View for State → i tab stanno su **una riga**, `Apply to` non va a capo, altezze uguali, se non entrano scrollano in orizzontale. Controllare che il tab attivo (underline cyan) sia invariato.

### Commit 2 — `refactor: collapse view header into a single context row`
**File:** `ViewData.tsx` (JSX zone header `~:152-178`), `nestedView.scss`
**COME:**
- In `ViewData.tsx`: unire la riga `.props-header` (back + `bi-eye` + nome + badge `VIEW` + help) e la breadcrumb band (`.view-header-breadcrumb-band` con `.path-list`) in **una sola riga di contesto**: back + eye + **breadcrumb** (`State Machine › View for State`, che già termina col nome della view) + badge `VIEW` + help. Rimuovere dal JSX il rendering della band separata e l'elemento `.props-header__name` duplicato (il nome è già in coda alla breadcrumb).
- **Non** modificare le regole SCSS base `.props-header*` (le usa l'inspector metaclasse). Introdurre un **modifier ViewData-only**, es. `.props-header--view` (verifica con `grep -r` che non esista già), e mettere lì **solo** gli aggiustamenti di layout della riga unita (allineamento breadcrumb inline, gap). Le `.path-*` restano le classi esistenti; se servono micro-tweak di layout, scoparli sotto `.props-header--view .path-list` (verifica prima dove altro sono usate le `.path-*`).
- **Non rimuovere** le regole SCSS della band ora non renderizzata (codice apparentemente inutilizzato: lasciarlo, cleanup separato).
**Verifica visiva (Alfonso):** header su **una riga** (niente più doppio "View for State"); breadcrumb cliccabile funziona; badge VIEW/VIEWPOINT corretto; **controllare che l'header dell'inspector metaclasse (selezionando una metaclasse) sia INVARIATO**; verificare sia su View for State sia su View for Transition.

### Commit 3 — `refactor: English strings, labeled Border group, tidy spacing in vertex authoring`
**File:** `VertexAuthoringPanel.tsx`
**COME:**
- **EN relabel** di tutte le stringhe IT del file (label, `HelpText`, `title`/tooltip, `ErrorText`, `FEATURES_HINT`), tra cui: `:268` → `"Forces the resize handles. Uncheck to lock. When unset, follows the shape."`, `:277` `"Propaga dimensione"` → `"Propagate size"`, `:272` title → EN, `:34`/`:323` hint/HelpText → EN, `:212` ErrorText → EN. Dopo l'edit, `grep` nel file per residui IT. Stringhe **concise, senza filler, senza em dash** (regole di scrittura del progetto).
- **Gruppo "Border"** (`:252-258`): tenere la label di gruppo **"Border"**; aggiungere **micro-label per i 3 controlli**: `Color` (ColorPicker), `Width` (NumberInput/stepper), `Style` (Select). Riusa la classe di field-label esistente se il layout regge; altrimenti una classe minima scoped (grep-verificata), 11px slate. **Bindings invariati** (`border.color/width/style`, `DEFAULT_BORDER`).
- **Spaziatura (P6, minimale):** normalizzare solo gli offender locali di spaziatura dei gruppi del tab IR usando i token `--space-*` a livello locale. **Non** editare `_form-system.scss`/`jj-*` condivisi. Se il ritmo dipende da classi condivise, lascialo e annotalo (cleanup sistemico separato).
- Bottone disabilitato `Propagate size`: se `ui/Button` espone una variant più leggera (ghost/tertiary) usala per de-enfatizzarlo da disabilitato; **non modificare** `ui/Button`. Se non c'è variant adatta, lascialo e annotalo.
- **Non** toccare il sub-tab locale `basic/advanced` (`:55`).
**Verifica visiva (Alfonso):** tab IR di un vertex → tutte le stringhe in inglese; sotto "Border" si leggono Color/Width/Style; niente layout shift; spaziatura più regolare.

### Commit 4 — `refactor: English labels and value-below-mode layout in ConditionalEditor`
**File:** `ui/ConditionalEditor/ConditionalEditor.tsx` + il suo file di stile
**COME:**
- **EN relabel:** `:66` `"Fisso"` → `"Fixed"`, `:67` `"Condizionale"` → `"Conditional"`, `:78` `"Quando"` → `"When"`, `:88` `"Allora"` → `"Then"`, `:93` `"Includi ramo else"` → `"Include else branch"`, `:102` `"Altrimenti"` → `"Otherwise"`, `:48` `"conditional (regole multiple, non ancora editabile)"` → `"conditional (multiple rules, not yet editable)"`. `grep` per residui IT.
- **Layout valore sotto la modalità:** il `renderValue` (in modalità Fixed) e i rami When/Then/Otherwise (in Conditional) vanno resi su una **riga propria sotto** i due bottoni segmentati `Fixed/Conditional`, a piena larghezza, non affiancati al segmented. Modifica solo il file di stile del componente (scoped alla sua classe root).
- Ricorda: è **condiviso**. La modifica si propaga a `visible`, `fill`, `line.*`, TextStyle, Edge: è previsto.
**Verifica visiva (Alfonso):** nella card Labels, "Visibility" mostra il segmented `Fixed/Conditional` e **sotto** lo switch `Visible`; passare a `Conditional` mostra When/Then sotto; **spot-check** su fill/line e su un asse TextStyle che il valore-sotto-il-mode non rompa quei consumatori.

---

## 4. Chiusura

- Dopo il **Commit 4** e la conferma visiva finale di Alfonso: aggiorna `docs/claude-code-log.md` con **una entry** per l'intera Fase 2 (tipo `refactor`, prompt riassunto in una riga, i 5 file toccati, esito, nota "redesign Properties panel — Fase 2, 4 commit"). Formato come da `CLAUDE.md`, con `Nome del documento prompt: 2026-07-27 Fase 2 Properties panel redesign`.
- Se in qualsiasi punto emerge che un fix richiede di toccare un file fuori §2 o una classe must-not-touch: **fermati e segnala**, non procedere.

## 5. Riferimenti

- Discovery Fase 1: `docs/discovery/discovery_2026-07-28_properties_panel_redesign.md`.
- Mockup target: artifact `jjodel-panel-redesign` (Properties "after").
- **Design tokens:** slate `#334155`, cyan `#0ea5e9` (solo accent, non per il fill delle checkbox), focus `#334155` + rgba shadow, label 11px, griglia 8px (`--space-*`), **solo Bootstrap Icons**, **no layout shift** (dimensioni fisse tra gli stati).
- **Semantica preservata:** `Apply to` invariato; `visible: Conditional<boolean>` = modalità + valore; `shape.border` invariato.
