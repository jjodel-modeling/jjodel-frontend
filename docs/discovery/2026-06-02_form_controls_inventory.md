# Discovery — Inventario dei controlli di form del Properties panel

**Data**: 2026-06-02
**Tipo**: discovery, read-only (nessuna modifica al codice)
**Branch**: `alfonso-frontend-jjtl`
**Metodo**: grep + lettura statica del working tree locale. 4 sotto-aree esplorate in parallelo (primitivi `ui/`, New UI `Info.tsx`, editor VIEW `views/data/`, sorgenti colore), poi verifica diretta dei tre "fatti da accertare" (numeri arancioni, errore GInput, focus cyan).
**Nota di affidabilità (§5.1)**: i colori e i `file:riga` sono accertati staticamente. Dove la resa dipende dalla cascata CSS a runtime (numeri arancioni, focus cyan su Applicable to) il file lo dichiara esplicitamente e NON inventa una sorgente: la conferma richiede ispezione del DOM/computed-style, non eseguibile in read-only.

---

## 1. Sommario

- **Condivisi o duplicati? Entrambi, in fase di migrazione parziale.** Esiste una libreria di primitivi atomici in `components/ui/` (Toggle, Select, NumberInput, Input, Field, FormSection, …). I pannelli New UI M2 (`components/editors/Info.tsx`) **adottano solo Toggle e NumberInput** di quella libreria; per text input e select continuano a usare il **componente legacy `Input`/`Select` del joiner** (`components/forEndUser/Input.tsx`) e `react-select` (per i MultiSelect). L'editor VIEW (`components/editors/views/data/*`) usa **lo stesso `Input`/`Select` legacy + `GenericInput` + checkbox nativi**. Quindi: i toggle e gli stepper sono primitivi condivisi; select, text input e checkbox sono il vecchio sistema, inline o wrappato, **non** i primitivi `ui/`. L'intervento sarà **misto**: fix sui primitivi `ui/` per i pochi controlli migrati, **consolidamento** per tutto il resto (select native, checkbox, GenericInput).
- **Sistema di token o hex sparsi? Token formalmente presenti, di fatto bypassati.** Coesistono **tre** sistemi di token in conflitto (`styles/tokens/*.scss` semantico theme-aware; `styles/tokens.css` legacy; `editor-v2/_themes.scss` locale) più **hardcoding pervasivo**: `#334155` ricorre ~776 volte fuori dai file token, `#0ea5e9` ~210 volte (con **una sola** definizione token), `#06b6d4` ~25 volte. I primitivi `ui/` stessi sono incoerenti: Input/Select/Textarea usano `var(--…)`, mentre **Toggle, NumberInput, VerticalToggle hardcodano hex**.
- **New UI e VIEW separati? Sì, file/cartelle distinte, ma condividono il motore legacy.** New UI M2 = `components/editors/Info.tsx` (+ `info.scss`, `info-improvements.scss`, badge in `styles/components/_form-system.scss`). Editor VIEW = `components/editors/views/` e `views/data/` (+ `viewapplyto.scss`, `viewoptions.scss`, `nestedView.scss`). I due insiemi convergono però sullo stesso `forEndUser/Input.tsx` e su `react-select`.
- **Focus incoerente per generazione**: i primitivi `ui/` focusano **cyan #06b6d4**; il New UI Info.tsx e l'editor VIEW (Apply to) focusano **slate #334155**. La divergenza cyan percepita su "Applicable to" è il **default di react-select / token cyan** che la SCSS redesign (`viewapplyto.scss`) cerca di sovrascrivere a slate con `!important`.

---

## 2. Inventario per famiglia

> Legenda risposte: **(a)** componente condiviso? **(b)** call site (conteggio) **(c)** duplicati/inline **(d)** sorgente colore/stile `file:riga`.

### 2.1 Toggle / Switch

- **(a) Sì.** Primitivo condiviso `components/ui/Toggle/Toggle.tsx` (`role="switch"`, headless, CSS-module `Toggle.module.css`). Nel New UI è wrappato dal locale `PropertiesToggle` (`Info.tsx:79-103`) che rende `<Toggle … size="xs">` a `Info.tsx:100`.
- **(b)** `import { …, Toggle, … } from '../ui'` a `Info.tsx:32`. **22** occorrenze `PropertiesToggle`/`<Toggle` in `Info.tsx`; usato anche in `views/data/NodeData.tsx:38`. (NB: `Info.tsx:30` importa anche `Toggle as JoinerToggle` da `joiner/components` ma **non lo rende mai** — import morto.)
- **(c)** Esistono toggle "fantasma" legacy mai resi: `forEndUser/Toggle.tsx`, e due `<input class="toggle-input">` con handler `alert()` placeholder in `forEndUser/Control.tsx:571` e `forEndUser/Panel.tsx:254`. Vertical toggle a parte: `components/ui/VerticalToggle.tsx` (navbar, classi globali SCSS, non CSS-module).
- **(d) Stato "on" = slate #334155 HARDCODED, non token.** `Toggle.module.css:79` → `.toggleChecked { background:#334155 }` (hover `#1e293b` :83). Off-track `#cbd5e1` (:41). Focus ring `box-shadow … rgba(51,65,85,.3)` (:50). Il commento `Toggle.module.css:77` dice esplicitamente "not cyan!". Taglie xs/sm/md (xs=24×14, sm=28×16, md=36×20). **Coerente col design system** (slate attivo), ma via hex literal anziché token.
  - VerticalToggle: ON `#475569` (`VerticalToggle.scss:100`), hover `#334155` (:112), tutto hardcoded.
  - Apply-to tab usa una classe SCSS propria `.apply-to-toggle` 36×20 slate solido `#334155` (commento `viewapplyto.scss:7`, regola `:204`).

### 2.2 Boolean resi come checkbox

- **(a) No primitivo dedicato**; il booleano-checkbox passa dal legacy `Input` (`forEndUser/Input.tsx`) o da `GenericInput`.
- **(b/c) SPARSI su molti componenti dell'editor VIEW** (non concentrati). Punto di dispatch unico per i booleani edge/options: `GenericInput.tsx:166` (`EBoolean → type='checkbox'`). Call site con `type="checkbox"`:
  - `views/data/GraphData.tsx:76` — `<Input type='checkbox'>` (graph)
  - `views/data/PaletteData.tsx:776` — field `cssIsGlobal`, label "global"
  - `views/data/PermissionViewpointTab.tsx:16,20,26`; `PermissionModelTab.tsx:16,20,24`; `views/data/PermissionViewTab.tsx:32` — esempi permessi
  - `views/NestedView.tsx:157`; `NodeEditor.tsx:522,565`; `MTM.tsx:423`
  - `editors/Logger.tsx:326,330` (ricerca, fuori scope pannello)
  - Nel New UI gli attributi EBoolean slot-value usano invece un **bool-toggle a pulsante**, non checkbox nativo: `Info.tsx:605` (`field='checkbox'`) reso come bottone `bool-toggle` (`Info.tsx:683-707`).
- **(d)** Stile checkbox nativo = default browser (nessuna classe DS dedicata attiva). Le regole di restyling in `viewoptions.scss` (vedi 2.6) sono **codice morto**.
- **Asimmetria chiave**: New UI M2 → `Toggle` (slate); editor VIEW → checkbox nativo via `Input`/`GenericInput`. Stessa semantica booleana, due rese diverse.

### 2.3 Select / dropdown

- **Nativi (`<select>`): 22 occorrenze** in `components/editors/` + `forEndUser/`. Quelli rilevanti al Properties panel:
  - `Info.tsx:573` "Force type" (override tipo LObject), label `Info.tsx:572`
  - `Info.tsx:720` slot EEnum; `:726` slot reference; `:739` composition reference (popup); `:757` shapeless value — tutti classe `select.jj-slot-value-select`
  - `Info.tsx:797` "Topic" IoT (tab, label :796); `:825` "Topic" IoT (popup, label :824)
- **Wrapper `<Select>` (joiner, rende `<select>` nativo sotto): 14 occorrenze** in `components/editors/`. È `forEndUser/Input.tsx` con `tag:'select'` (`Input.tsx:550-552`, render nativo `:408`). Usato per:
  - Type (Attribute/Reference) `Info.tsx:414`; return type Operation `Info.tsx:481`
  - VIEW Apply to: "Preferred appearance" `forceNodeType` (`InfoData.tsx:263`), "Applicable to" `appliableToClasses` (`InfoData.tsx:294`, multiselect), "Viewpoint"/"Parent view" `father` (`InfoData.tsx:310,327`), "Edge Routing" `edgeRouting` (`InfoData.tsx:215`)
- **Custom (react-select): 2 occorrenze** `<MultiSelect>` in `Info.tsx`: Extends/superclass `Info.tsx:125-129` (`classNamePrefix="jj-select"`, `placeholder="Select superclass..."`), Dependencies/models `Info.tsx:331-337`. `MultiSelect = react-select` (`joiner/index.ts:64,10`).
- **(a)** Il primitivo `components/ui/Select` (native `<select>`, focus cyan) **NON è usato** in questi pannelli.
- **(d)** Freccia chevron slate (`viewapplyto.scss:116`). Focus: vedi 2.8.

### 2.4 Tab bar (Apply to / Template / Style / Events / Options)

- **(a) Sì, una.** Render in `views/ViewData.tsx:136-149`; array tab `:48-103` con label `'Apply to'`(:51) `'Template'`(:60) `'Style'`(:69) `'Events'`(:78) `'Options'`(:86) + `'Components'`(:95, solo viewpoint).
- **(d) Indicatore tab attiva = underline `border-bottom: 2px solid var(--color-accent)`** (`nestedView.scss:3617`, classe `.view-editor-tab.active`; transparent da inattiva `:3608`). **`--color-accent` = slate `#334155`** (`_colors-light.scss:118` → `$slate-700` :32). Separatore container `1px solid var(--color-border-primary)` (#e2e8f0, `nestedView.scss:3592`). **Già slate, coerente.**

### 2.5 Badge tipo (CLASS / ATTRIBUTE / REFERENCE)

- **(a) Mappa in due livelli, non un singolo componente.** JS `getElementTypeInfo(className)` (`Info.tsx:837-863`) mappa `DClass→'class'`, `DAttribute→'attribute'`, `DReference→'reference'`, `DEnumerator→'enum'`, `DOperation→'operation'`, `DModel→'metamodel'/'model'` (`:875-877`), … → `badgeClass` (stringa). Reso a `Info.tsx:885` come `<span class="jj-type-badge jj-type-badge--{badgeClass}">`.
- **(b)** classe applicata a 1 punto (`:885`); 11 varianti CSS.
- **(c)** Esiste una classe legacy concorrente `.properties-header-badge` (`info.scss:489-504`) che dà **cyan uniforme** a tutti i tipi — **non usata** dal `PropertiesHeader` (che usa `jj-type-badge--*`).
- **(d) Colore = mappa CSS hardcoded per-tipo** (coppie pastello fisse), `styles/components/_form-system.scss:1076-1084`:
  - `--package` `#f1f5f9`/`#475569`; `--class` `#e0f2fe`/`#0369a1`; `--attribute` `#fef3c7`/`#92400e`; `--reference` `#fce7f3`/`#9d174d`; `--operation` `#ede9fe`/`#6d28d9`; `--enum` `#d1fae5`/`#065f46`; `--literal` `#e0e7ff`/`#3730a3`; `--metamodel` `#f1f5f9`/`#475569`; `--model` `#dbeafe`/`#1e40af`. Base `.jj-type-badge` (`:1067`) `text-transform:uppercase`.

### 2.6 Stepper / number input (Lower, Upper, Snap, offset, decorator)

- **(a) Misto, due componenti condivisi.**
  - Lower/Upper bounds → `PropertiesNumberInput` (`Info.tsx:152-164`) → primitivo `components/ui/NumberInput`. Call site `Info.tsx:419-420` (lowerBound), `:423-424` (upperBound).
  - Snap / Default W/H / offset / decorator → `forEndUser/SizeInput.tsx` (per i field `GraphPoint`) e/o `<Input type="number" inputClassName="number-input-compact">`. `NodeData.tsx:98-103` (Snap via SizeInput), `:107-119` (W/H). Offset/decorator edge: `view.tsx` `edgeStartOffset/edgeEndOffset` (`:1270-1274`), `edgeHeadSize/edgeTailSize` (`:1317-1320`) → `GenericInput.tsx:123` → SizeInput. Nessuno spinner inline custom.
- **(d) NumberInput primitivo: hardcoded.** Valore `#1e293b` (`NumberInput.module.css:57`), bottoni step `#94a3b8`/`#f8fafc` (:31), focus-within `#94a3b8` + `rgba(100,116,139,.08)` (:14-17), bordo `#e2e8f0` (:4). Number input via `Input`/SizeInput: regola attiva globale `_form-system.scss:44,58` → `color: var(--form-input-color)` (#0f172a, scuro). **Sui numeri arancioni vedi §4 (Fatti accertati).**

### 2.7 Chip / token (multi-select "Applicable to")

- **(a)** Non un primitivo proprio: chip di **react-select** (`<Select isMultiSelect>` su `appliableToClasses`, `InfoData.tsx:294-302`), stilizzati via attribute-selector SCSS.
- **(d) Colore chip = slate, hardcoded** `viewapplyto.scss`: sfondo `#f1f5f9` (slate-100) + bordo `#e2e8f0` (`:368-374`), label `#1e293b` (`:376-382`), bottone remove `#94a3b8` (:385). **Nessun cyan/amber sui chip.**

### 2.8 Focus ring

- **(a) Frammentato per generazione** (tre sorgenti):
  - **Primitivi `ui/` (Input/Select/Textarea): CYAN.** `Input.module.css:69`, `Select.module.css:39-43`, `Textarea.module.css:42-43` → `border-color: var(--input-border-color-focus)` = `var(--color-cyan-500)` = **#06b6d4** (`tokens.css:245,33`). Solo cambio bordo a 2px, niente box-shadow. (Ma questi primitivi non sono usati nei pannelli.)
  - **New UI Info.tsx (text input/select legacy): SLATE.** `info-improvements.scss:246-250` (`.form-input:focus` → `#334155` + `rgba(51,65,85,.15)`), `:303-308` (`.form-select:focus`, commento "✅ SLATE focus state"). Legacy `info.scss:645-647` → `var(--color-accent)` = #334155.
  - **Editor VIEW Apply to: SLATE forzato.** `viewapplyto.scss:99-101` (`#334155 !important`), `:333-335` (`-control--is-focused` → `#334155 !important`), commento `:311` "Simplified, slate-only, no cyan borders".
- **(d) Origine del bordo CYAN su "Applicable to"**: la SCSS redesign **vuole slate** (`viewapplyto.scss:334`, `!important`). Il cyan, se compare, è il **default di react-select** e/o i token cyan globali che la redesign sovrascrive: `tokens.css:116` `--color-border-focus:#06b6d4`, `tokens.css:245` `--input-border-color-focus: var(--color-cyan-500)`, `tokens.css:250` `--input-focus-ring-color: var(--color-cyan-500)`; più il fallback cyan `info.scss:454` `rgba(6,182,212,.1)`. **Verdetto**: la divergenza è strutturale (token focus = cyan vs override SCSS = slate). Quale vince dipende dal match del selettore `.apply-to-tab .form-field [class*="-control--is-focused"]` sul DOM reale: se non matcha, vince il cyan base. **Conferma a runtime richiesta (§5.1).**

### 2.9 Section header (collassabile)

- **(a)** New UI: `CollapsibleSection` (`Info.tsx:50`) rende `<span class="props-section__title">{title}</span>`.
- **(d) GENERAL / FLAGS / INHERITANCE = stringhe LETTERALMENTE maiuscole nel JSX** passate come prop `title`, **E** `text-transform:uppercase` CSS che le rinforza:
  - JSX: `title="INHERITANCE"` (`Info.tsx:115`), `title="GENERAL"` (`:324,353,378,398,407,474,488`), `title="FLAGS"` (`:385,454,465`).
  - CSS: `info-improvements.scss:940-947` `.props-section__title { text-transform:uppercase; … }`.
  - I header **Title Case** dell'editor VIEW (`Field`, `Vertex`, `Edge`, `EdgePoint`) sono invece **stringhe scritte in Title Case** (label dei field/tab in `views/data/*`), **senza** `text-transform`. Quindi la differenza maiuscolo vs Title Case = **stringa scritta diversa + componente diverso** (props-section vs tab/label dell'editor VIEW), non un solo `text-transform` divergente.

### 2.10 Input text

- **(a) No primitivo `ui/Input`** nei pannelli; si usa il legacy `Input` del joiner (`forEndUser/Input.tsx:539`, render nativo `<input>` `:414`, classe `form-input`).
- **(b)** `Info.tsx:292` (name), `:357` (uri), `:362` (prefix), `:709/:753` (slot values).
- **(d) Bordo/focus = SLATE** (vedi 2.8: `info-improvements.scss:246`). Il primitivo `components/ui/Input` (focus cyan) **non è usato qui**.

---

## 3. Trasversali

### A. Primitivi UI

**Esiste** la cartella `components/ui/` con barrel `index.ts`. File: **Button, EmptyState, ErrorText, Field, FormSection, HelpText, Input, Label, NumberInput, Select, Textarea, Toggle** (ciascuno cartella `.tsx` + `.module.css` + `index.ts`) più **VerticalToggle.tsx/.scss** (non-module). Pattern: CSS Modules headless.
- **Token-based** (usano `var(--…)`): Input, Select, Textarea, Label, HelpText, ErrorText, Field, FormSection, Button.
- **Hex hardcoded** (bypassano i token): **Toggle, NumberInput, VerticalToggle**.
- **Token pendenti/non definiti**: `--input-bg`, `--input-bg-disabled` referenziati da Select/Textarea ma **mai dichiarati** in `tokens.css` (riferimenti danglanti). Bug minore: `Input.module.css:107` ha un `calc()` malformato (manca `var(`).
- **Adozione bassa**: i pannelli reali (`Info.tsx`, `views/data/*`) usano solo **Toggle** e **NumberInput**; per il resto usano il motore legacy `forEndUser/Input.tsx` + react-select.

### B. Sorgenti colore / token

**Tre sistemi paralleli + hardcoding pervasivo. Nessuna single-source-of-truth realmente rispettata.**

1. `styles/tokens/_colors-light.scss` + `_colors-dark.scss` (SCSS, theme-aware, **semantico**):
   - `$slate-700: #334155` (`_colors-light.scss:32`) → esposto come `--color-accent`(:118), `--color-brand`(:109), `--color-text-secondary`(:99), `--color-interactive-default`(:135).
   - cyan canvas `--color-canvas-accent: #06b6d4` (`_colors-light.scss:205`, dark `:109`).
   - **#0ea5e9 ha UNA sola definizione token**: `--color-toolbar-btn-active-text: #0ea5e9` (`_colors-light.scss:281`). Nessun `$`-var per esso.
   - focus semantico = slate `--color-border-focus: $slate-500` (#64748b, `:93`); panel focus cyan `--color-panel-input-focus: var(--color-canvas-accent)` (:266); viewpoint focus blue `$blue-500` (:305).
2. `styles/tokens.css` (CSS legacy, mono-tema): `--color-slate-700:#334155` (:21), `--color-cyan-500:#06b6d4` (:33), `--color-border-focus:#06b6d4` (:116), `--input-border-color-focus: var(--color-cyan-500)` (:245). **Focus = cyan** qui (in conflitto col semantico).
3. `components/editor-v2/_themes.scss` (custom-prop locali hardcoded): `--accent:#0ea5e9` (:29), `--edge-selected:#0ea5e9` (:78), `--surface-1:#334155` (:12), `--node-bg:#334155` (:40).

**Hardcoding fuori dai file token** (i componenti **non** usano i token, scrivono l'hex):
| Colore | Definizioni token | Literal sparsi fuori dai token |
|---|---|---|
| `#334155` slate-700 | 1 `$`-var + ~15 prop nei token | **~776** |
| `#0ea5e9` sky-500 | **1** prop soltanto | **~210** |
| `#06b6d4` cyan-500 | 3 prop | ~25 |

Esempi rappresentativi: `App.scss:465,488`; `_form-system.scss:16,388`; `common/DV.tsx:1580,1621` (inline React); `DocumentationTab.scss:24` (`$color-accent:#0ea5e9`); `jjtl.scss:12`, `EnvGenWizardModal.scss:7` (`$color-primary:#0ea5e9`); `Jodie/JodieWindow.css` (27× #0ea5e9); `editor-v2/edges/EndpointHandles.tsx:177`, `SegmentHandles.tsx:159` (inline). **#0ea5e9 vs #06b6d4 = due cyan diversi (sky-500 vs cyan-500) usati in modo intercambiabile → "dual-cyan confusion".**

### C. New UI vs editor VIEW (mappa dei due insiemi)

| Generazione | File principali | Stili | Motore controlli |
|---|---|---|---|
| **New UI M2** (Class/Attr/Ref) | `components/editors/Info.tsx` (1387 righe) | `info.scss`, `info-improvements.scss`, badge in `styles/components/_form-system.scss` | `ui/Toggle` + `ui/NumberInput` + **legacy** `forEndUser/Input.tsx` (`Input`/`Select`) + react-select (MultiSelect) |
| **Editor VIEW** (Apply to/Template/Style/Events/Options) | `components/editors/views/ViewData.tsx`, `views/NestedView.tsx`, `views/data/*` (InfoData, TemplateData, EdgeData, NodeData, FieldData, EdgePointData, GraphData, ComponentsTab, PaletteData, …) | `nestedView.scss`, `viewapplyto.scss`, `viewoptions.scss`, `events-tab.scss`, `palette-data.scss` | `forEndUser/Input.tsx` + `forEndUser/GenericInput.tsx` + checkbox nativi + `ui/Toggle` (solo NodeData) + react-select |

Tab bar e Properties header risiedono in `Info.tsx`/`ViewData.tsx`. I due insiemi sono separati come file ma **convergono su `forEndUser/Input.tsx` e react-select** — è lì che vive davvero gran parte della resa dei controlli.

---

## 4. Fatti accertati

### 4.1 Numeri arancioni (offset 50, decorator 20 nei tab Options/Edge)

**Origine NON localizzabile con certezza staticamente; richiede conferma a runtime (§5.1).** Catena accertata:
- I number input offset/decorator sono resi da `SizeInput.tsx` (→ `<Input type="number">`). `SizeInput` **non** applica `color` inline (`SizeInput.tsx:78-99`).
- L'override **inteso** a slate per questi campi vive in `viewoptions.scss` (`color:#334155 !important` su `input[type="number"]`, es. `:695`), **ma l'INTERO file è codice morto**: tutto è annidato in `.editor-switch-v2-wrapper { … }` (`viewoptions.scss:1`) e quella classe **non è resa in nessun TSX** (grep `editor-switch-v2-wrapper` = 0 in `*.tsx`). → §5.1 "dead write".
- La regola **attiva** globale per i number input è `_form-system.scss:44,58` → `color: var(--form-input-color)` = **#0f172a (scuro)**, non arancione.
- Gli unici literal arancioni nel CSS dell'editor VIEW (`#f59e0b`, `#fb923c`, `#f97316`) sono **tutti scoped a icone-tipo dell'albero e badge statistici**, NON a number input: `nestedView.scss:495` (`.tree-Package`), `:603` (`.tree-Anchors`), `info.scss:589` (`.operations` stat badge). Token `--color-warning`/`--accent-secondary` = `#f59e0b` (`variables.scss:25`) ma non applicato come text-color ai number input in nessuna regola trovata.
- **Conclusione**: dato che l'override slate è morto e il fallback attivo è scuro, l'arancione osservato deve provenire da un selettore più specifico o da uno stile calcolato a runtime **non emerso dai grep**. Per stabilire se l'arancione **codifica qualcosa** (override/ereditato/validazione) o è **incidentale** serve leggere il computed-style del campo nel DOM e la regola vincente — **non determinabile in read-only**. Nessuna sorgente viene inventata qui.

### 4.2 Checkbox

**Sparsi su più componenti dell'editor VIEW**, non in uno solo (vedi 2.2): `GraphData.tsx:76`, `PaletteData.tsx:776`, `PermissionViewpointTab.tsx:16/20/26`, `PermissionModelTab.tsx:16/20/24`, `PermissionViewTab.tsx:32`, `NestedView.tsx:157`, `NodeEditor.tsx:522/565`, `MTM.tsx:423`. Dispatch comune dei booleani edge/options: `GenericInput.tsx:166` (`EBoolean→checkbox`). Il New UI M2 invece usa `Toggle` (no checkbox nativi, tranne il bool-toggle a pulsante per gli slot value `Info.tsx:683-707`).

### 4.3 Errore `Invalid GInput type`

**La premessa del prompt diverge dal codice: i campi che mostrano l'errore non sono "Path mode" e "Gap mode", ma "Edge Routing".**
- Stringa: `forEndUser/GenericInput.tsx:119-121` — branch `default:` dello `switch(type.toLowerCase())` → `<div … >Invalid GInput type: '{type}'</div>`.
- Logica dispatch (`GenericInput.tsx:51-118`): se `info.enum` è truthy → `type='EEnum'` → render `<Select>` (`:137`); altrimenti `type = info.type` (stringa); se non matcha alcun `case` → `default` (errore).
- **"path mode" e "gap mode" FUNZIONANO**: `__info_of__bendingMode` (`view.tsx:1247`, label "path mode") e `__info_of__edgeGapMode` (`view.tsx:1252`, label "gap mode") hanno **`enum:`** valorizzato con enum **runtime** (`EdgeBendingMode`/`EdgeGapMode` = `enum` veri in `joiner/types.ts:125,136`) → `info.enum` truthy → rendono un `<Select>`. **Non** producono l'errore.
- **Il campo che cade nel `default` è `edgeRouting`** ("Edge Routing"): `__info_of__edgeRouting` (`view.tsx:915`) ha `type: '"straight" | "manhattan-rounded" | "bezier"'` **e NESSUN `enum:`** → `type` = quella union-string, nessun `case` → errore `Invalid GInput type: '"straight" | "manhattan-rounded" | "bezier"'`. È `isEdge:true` e non `hidden`, quindi compare nel tab Edge. **Le opzioni `straight/manhattan-rounded/bezier` citate nel prompt sono esattamente quelle di `edgeRouting`** — quindi il campo è lui, etichettato erroneamente "Path/Gap mode" nel prompt.
- (Altri field con union-string senza `enum:` — `edgeStrokeColor` `view.tsx:923`, `edgeStrokeStyle` `:931` — sarebbero nello stesso stato ma sono `hidden:true`, filtrati a `EdgeData.tsx:28`.)
- **Causa-radice**: `edgeRouting` manca della chiave `enum:` che `bendingMode`/`edgeGapMode` hanno; GenericInput non sa trasformare una union-string TS in `<Select>` (nessun parser di stringhe-tipo nel `switch`). *(Solo diagnosi; nessun fix proposto qui.)*
- **Caveat §5.1**: conclusione da analisi statica, non eseguita. Il match perfetto delle opzioni è forte evidenza; la conferma definitiva (e l'eventuale presenza dell'errore anche su altri campi) va vista a runtime nel tab Edge.

---

## 5. Tabella riassuntiva

| Controllo | Componente condiviso? | Call site (≈) | Sorgente colore/stato (`file:riga`) |
|---|---|---|---|
| Toggle/Switch | **Sì** `ui/Toggle` (via `PropertiesToggle`) | 22 in Info.tsx + NodeData | on=slate **#334155** hardcoded `Toggle.module.css:79` |
| VerticalToggle | Sì `ui/VerticalToggle` (navbar) | — | ON #475569 `VerticalToggle.scss:100`, hardcoded |
| Boolean→checkbox | No (legacy `Input`/`GenericInput`) | ~10 file VIEW, sparsi | default browser; dispatch `GenericInput.tsx:166`; override morto `viewoptions.scss` |
| Select nativo | No (`<select>` inline o joiner) | 22 native + 14 wrapper `<Select>` | freccia slate `viewapplyto.scss:116`; focus §2.8 |
| MultiSelect (chip) | react-select | 2 (`Info.tsx:125,331`) | chip slate **#f1f5f9** `viewapplyto.scss:370` |
| Tab bar | Sì (`ViewData.tsx`) | 1 (5–6 tab) | underline `--color-accent`=**#334155** `nestedView.scss:3617` |
| Badge tipo | Mappa JS→CSS class | 1 render (`Info.tsx:885`) | per-tipo hardcoded `_form-system.scss:1076-1084` |
| Stepper/number | Sì `ui/NumberInput` (bounds) + `SizeInput` (offset/dec) | bounds `Info.tsx:419-424` | NumberInput value **#1e293b** `NumberInput.module.css:57`; SizeInput→`--form-input-color` |
| Chip/token | react-select | vedi MultiSelect | slate, no cyan `viewapplyto.scss:368-385` |
| Focus ring | Frammentato (3 sorgenti) | — | ui=cyan **#06b6d4** `Input.module.css:69`; New UI/VIEW=slate **#334155** `info-improvements.scss:246`, `viewapplyto.scss:334` |
| Section header | `CollapsibleSection` (New UI) | ~10 (Info.tsx) | uppercase JSX + `text-transform` `info-improvements.scss:944` |
| Input text | No (legacy joiner `Input`) | 5+ (Info.tsx) | bordo/focus slate `info-improvements.scss:246` |

---

## 6. Punti che restano da confermare a runtime (non risolvibili in read-only)

1. **Numeri arancioni**: computed-color reale e regola vincente sui number input di Edge/Options (l'override slate è dead code; il fallback attivo è scuro → l'arancione non emerge dai grep).
2. **Focus cyan su "Applicable to"**: se il cyan compare nonostante l'override slate `!important`, verificare che il selettore `.apply-to-tab .form-field [class*="-control--is-focused"]` matchi davvero il DOM di react-select.
3. **`Invalid GInput type`**: confermare nel tab Edge che il campo in errore è "Edge Routing" (e non altri), come indica l'analisi statica.
