# Discovery — Checkbox native invisibili (Slice 0, Fase 1)

**Data**: 2026-08-05
**Tipo**: Fase 1 read-only, con hard stop. Nessuna modifica a file sorgente, nessun `git add`, nessun commit.
**Repo**: `jjodel`, branch `alfonso-frontend-jjtl`, HEAD `85fc8aa3e`. Working tree non pulito, lasciato intatto.
**Perimetro dei path**: tutti relativi a `frontend/`.
**Critical zone**: non toccata.

---

## 0. Il difetto, verificato

`src/styles/tokens/index.scss:106-112` nasconde ogni checkbox nativo, senza `!important`:

```scss
input[type="checkbox"] {
  position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;
}
```

`index.scss` è il **primo** `@import` di `src/App.scss:6`, quindi la regola è globale e precede
ogni foglio di componente. Specificità `(0,1,1)`.

Il blocco di ridisegno (`::before` con `width`, `height`, `border`) alle righe **115-132** è
commentato; commentato anche il blocco react-select alle righe **133-140**. Restano attive le
regole di stato alle righe **143-174**, che colorano un `::before` mai dimensionato — e che
diverse superfici neutralizzano a loro volta con `display: none !important`
(`info.scss:935`, `viewoptions.scss:619-638`, `catalog.scss:563-567` (su `.toolbar-filter-count::before`)).

### Conseguenza sulla specificità — il criterio usato per i verdetti

Un override di componente vince sulle proprietà **che ridichiara**, e solo su quelle. Le
proprietà non ridichiarate restano quelle della regola globale. Un `.foo input[type="checkbox"]`
ha specificità `(0,2,1)` e batte `(0,1,1)`, ma se dichiara solo `width` e `height` allora
`position: absolute`, `opacity: 0` e `pointer-events: none` **continuano ad applicarsi**:
l'elemento è dimensionato, fuori flusso, trasparente e non cliccabile.

È esattamente il caso di sette dei tredici controlli dentro il perimetro vivo. Per questo il
verdetto non è stato dato sulla presenza di una regola, ma sulla presenza contestuale di
`opacity` **e** `position` **e** `pointer-events` insieme alle dimensioni.

---

## 1. Da quando

Le due date richieste, con i due commit.

| Evento | Commit | Data | Autore |
|---|---|---|---|
| **Introduzione della regola globale** `input[type="checkbox"] { position:absolute; opacity:0; … }` — **insieme** al blocco di ridisegno `::before` che la rendeva funzionante | `b8b00eaec` «lots of improvements / dialogs etc» | **2026-01-17 20:31:35 +0100** | Alfonso Pierantonio |
| Modifica del selettore di ridisegno per escludere gli input interni di react-select (blocco ancora **attivo**) | `151a488b7` «drag & drop con features + problema di creazione ripetuto di grafi» | 2026-01-28 15:12:30 +0100 | Alfonso Pierantonio |
| **Commento del blocco di ridisegno** (righe 115-132) e del blocco react-select (133-140), lasciando attiva la regola di nascondimento | `3979b5e1a` «version compatibility + some css fixes … removed some styles too generic» | **2026-03-17 19:05:52 +0100** | Damiano Di Vincenzo |

Il diff di `3979b5e1a` sul file è di sole 4 righe: `*/` aggiunto, `/* … */` trasformato in
apertura di commento. Il messaggio di commit («removed some styles too generic») dice che il
`::before` su ogni `label:has(input[type=checkbox])` era intenzionalmente troppo ampio e andava
tolto. **Quello che è rimasto indietro è la riga 106**: nasconde ancora, ma non c'è più nulla che
ridisegni.

Nessun commit successivo ha toccato `tokens/index.scss` (`git log --follow` si ferma a
`3979b5e1a`). Il difetto è quindi in piedi da **141 giorni**, dal 17 marzo 2026.

Il fatto che il problema sia noto è documentato dai workaround: `project-card.scss:1291`
dice testualmente `// CRITICAL: Override global hiding from tokens/index.scss`, e
`catalog.scss:572` `// Override global hiding`. Due componenti hanno pagato il conto; gli
altri no.

---

## 2. Le 30 occorrenze

Le 30 occorrenze contate dal censimento (`discovery_2026-08-05_censimento_primitive_ui.md`, §2.1)
si dividono in **19 `<input type="checkbox">` nativi** e **11 `<Input type={'checkbox'}>`**, cioè il
componente `src/components/forEndUser/Input.tsx`. Questi ultimi contano perché `Input.tsx:457`
rende comunque un `<input>` nativo (`case "input": input = <input {...inputProps} />`) con
`type="checkbox"` e classe `checkbox` (`Input.tsx:306`). Sono quindi soggetti alla stessa regola
globale.

**Dettaglio che cambia due verdetti**: `Input.tsx:337-344` imposta `wrap = false` quando non ci
sono `label`, `postlabel` né `isMultiSelect`. **Tutti e undici** i call site passano solo `data`,
`field`, `getter`/`setter` e `type`, quindi `Input` restituisce l'`<input>` **nudo**
(`Input.tsx:473`), senza il `<label class="input-container">` che avvolge gli altri casi
(`Input.tsx:489`). Il contenitore `.input-container` esiste solo dove è il call site a scriverlo
nel proprio JSX — vero per `GraphData.tsx:74`, falso per `NodeEditor.tsx:519`.

### 2.1 Superficie `#/allProjects`

| # | `file:riga` | Wrapper / classe | Override locale | Verdetto | Cosa fa, e su cosa scrive |
|---|---|---|---|---|---|
| 1 | `src/pages/components/catalog/Catalog.tsx:514` | `.toolbar-checkbox`, dentro `.projects-toolbar > .toolbar-left` | **SÌ, completo** — `src/pages/components/catalog/catalog.scss:571-580`: `position:relative !important; opacity:1 !important; width/height:18px !important; pointer-events:auto !important; visibility:visible !important` + `appearance:none` | **VISIBILE** | Seleziona o deseleziona tutti i progetti; scrive `selectedProjects` (`useState<Set>` locale di `Catalog`) |
| 2 | `src/pages/components/Project.tsx:492` | `.project-checkbox`, dentro `.project-row__checkbox` | **SÌ, completo** — `src/pages/components/project-card.scss:1292-1302`, stesse cinque proprietà con `!important` + `z-index: 10` | **VISIBILE** | Seleziona il singolo progetto, con range su Shift; chiama `onSelect(id, shiftKey)` → stato locale di `Catalog` |

### 2.2 Superficie `#/project`

| # | `file:riga` | Wrapper / classe | Override locale | Verdetto | Cosa fa, e su cosa scrive |
|---|---|---|---|---|---|
| 3 | `src/components/editors/views/NestedView.tsx:157` | `<label class="viewpoint-checkbox">` | **SÌ, ma di nascondimento** — `src/components/editors/views/nestedView.scss:1243-1252` nasconde l'input in proprio (`position:absolute; opacity:0; width/height:0; visibility:hidden`) | **SOSTITUITO (rotto)** | Dovrebbe attivare un viewpoint overlay. **Non scrive nulla**: `checked={false}` è costante e `onChange` è `{/* TODO: overlay selection logic */}` (`:158-160`) |
| 4 | `src/components/editors/NodeEditor.tsx:522` (`<Input type={'checkbox'}>`) | `<label class="node-editor__field-row"> > <div class="node-editor__field-inputs">` — **nessun** `.input-container` | **NO, nessuna regola** — `node-editor-redesign.scss:192-205` stila sotto `.node-editor__field-inputs` solo `input[type="number"]` e `input[type="text"]`. Il checkbox non è coperto da niente | **INVISIBILE** (caso più netto dei sei) | «Grid visible» del grafo; scrive `LGraph.grid = {visible}` (L-layer → D-layer) |
| 5 | `src/components/editors/NodeEditor.tsx:562-567` (`<Input type="checkbox">`) | `.node-editor__inline-field--checkbox` | **Parziale** — `src/components/editors/node-editor-redesign.scss:262-267`: `width:16px; height:16px; accent-color; cursor`. **Nessun** `opacity`/`position`/`pointer-events` | **INVISIBILE** | Flag `isResized` del vertice; scrive sul `LVertex` via `Input.setter` |
| 6 | `src/components/editors/views/data/GraphData.tsx:76` (`<Input type={'checkbox'}>`) | `<label class="input-container">` scritto dal call site (`GraphData.tsx:74`), dentro `<section class="graph">`, montata da `Info.tsx:1208` dentro `<section class="properties-tab properties-panel">` (`Info.tsx:1200`) | **SÌ, completo** — `src/components/editors/info.scss:881-891`, nel blocco `.properties-panel .input-container` (aperto a `:769`): `position:relative !important; opacity:1 !important; width/height:18px !important; pointer-events:auto !important` + bordo e sfondo | **VISIBILE** | «Grid visible» della view; scrive `LViewElement.grid = {visible}` |

**Nota sul #6, e sul perché il #4 e il #5 differiscono.** Il ripristino di `info.scss:881` è
efficace ma è agganciato alla classe **esatta** `.properties-panel`, che nell'albero del pannello
Properties è applicata solo da `Info.tsx:1200`, `:1254` e `:1294`. `NodeEditor` è montato da
`PropertiesWithTreeView.tsx:498` dentro `.properties-panel-container > .properties-panel-body >
.properties-node-section__content`: `properties-panel-container` è un token di classe **distinto**
da `properties-panel`, quindi il selettore non lo raggiunge. Due controlli identici nello stesso
pannello visivo hanno esito opposto per un dettaglio di nesting.

`viewoptions.scss:497-514` interviene su `.graph input[type="checkbox"]` ma solo con
`background-color` e `background` in `:checked`: è il caso letterale della "regola di colore su
un elemento senza dimensioni", e non cambia nessun verdetto.

### 2.3 Superficie modali

| # | `file:riga` | Wrapper / classe | Override locale | Verdetto | Cosa fa, e su cosa scrive |
|---|---|---|---|---|---|
| 7 | `.../UnifiedSettingsModal/sections/NotificationsSection.tsx:145` | `<label class="settings-toggle">` | **NO** — nessuna regola su `input[type=checkbox]` sotto `.settings-toggle` (il blocco `UnifiedSettingsModal.scss:659-712` stila `&-switch` e `&-thumb`, che qui non sono renderizzati) | **INVISIBILE** | Abilita un tipo di notifica; `updateType(meta.id, {enabled})` → preferenze notifiche |
| 8 | `.../sections/NotificationsSection.tsx:177` | `<label class="settings-toggle">` | **NO**, idem | **INVISIBILE** | «Show guard violation warnings»; `updateGuardViolations()` |
| 9 | `src/components/Settings/PromptsSettingsSection.tsx:74` | `<label class="prompts-checkbox-label">` | **Parziale** — `PromptsSettingsSection.scss:37-41`: `input { cursor; width:16px; height:16px }`. Nessun `opacity`/`position`/`pointer-events` | **INVISIBILE** | Filtro «Show customized only»; `setShowCustomOnly` (useState) + `onDirtyChange(true)` |
| 10 | `src/pages/settings/AdvancedSettings.tsx:70` | `<label class="settings-checkbox">` | **Parziale** — `src/pages/settings.scss:307-314`: `width:18px; height:18px; margin; cursor; accent-color; flex-shrink`. Nessun `opacity`/`position`/`pointer-events` | **INVISIBILE** | «Enable debug mode»; `toggleDebugMode()` |
| 11 | `src/jjtl/components/dialogs/JjtlPromptDialog.tsx:103` | `<label style={{display:'flex',…}}>` — **nessuna classe** | **NO**, e non è nemmeno possibile: non c'è un selettore su cui agganciarsi | **INVISIBILE** | Valore booleano richiesto da uno script JjTL; `setChecked` (useState del dialogo) → risolve la promise del prompt |
| 12 | `src/components/Jodie/SettingsModal.tsx:90` | `<label class="jodie-settings-toggle">` + fratello `<span class="jodie-toggle-slider">` (`:94`) | **SÌ, di nascondimento** — `Jodie/SettingsModal.css:178-190` nasconde l'input in proprio, con `!important` | **SOSTITUITO** (legittimo) | Abilita un provider AI; `change('enabled', …)` → `localStorage['jjodie-settings']` |
| 13 | `src/components/common/ProviderModelSelector.tsx:192` | `<label class="pm-legacy-toggle">` | **NO** — `ProviderModelSelector.scss:128-138` stila solo il `<label>` (flex, gap, padding, font, border-top), niente sull'input | **INVISIBILE** | «Show legacy models»; `setShowLegacy` (useState del menu) |

### 2.4 Fuori perimetro — elencate, non toccate

| # | `file:riga` | Perché è fuori perimetro | Verdetto (per completezza) |
|---|---|---|---|
| 14 | `src/components/BulkActionsBar/BulkActionsBar.tsx:39` | `BulkActionsBar` ha **0 call site**: `grep -rn "BulkActionsBar" --include="*.tsx" src/` non trova consumatori fuori dalla sua cartella | INVISIBILE — `bulk-actions-bar.scss:46-55` dà `width/height:18px` e `position:relative`, ma **non** `opacity:1` né `pointer-events:auto` |
| 15-16 | `src/components/editors/Logger.tsx:326`, `:330` | Il tab Logger appartiene al gruppo `editors` del dock, **non più costruito** dalla F2 del 2026-07-29: `src/components/abstract/Dock.tsx:329-336` («the right dock child (editors group — Properties, Node, Console, MTM, Logger) is no longer built … the editors tab consts above are still left in place (orphaned)») | INVISIBILE se mai montato |
| 17-18 | `src/components/export/ExportImageMenu.tsx:161`, `:170` | `ExportImageMenu` ha **0 riferimenti** in tutto `src/` | n.d. |
| 19 | `src/components/forEndUser/Control.tsx:571` | `ToggleComponent_Obsolete`, raggiungibile solo da `jsxString` (`joiner/components.tsx:41` → `DV.tsx:1320-1321`). **Ed è un toggle**, escluso dalla slice | SOSTITUITO — `_form-system.scss:334-352` (`.toggle`) nasconde l'input in proprio |
| 20 | `src/components/forEndUser/Panel.tsx:254` | Duplicato letterale del #19, stesso file diverso modulo | SOSTITUITO, idem |
| 21 | `src/components/forEndUser/Toggle.tsx:33` | **Riga commentata**: il file è `export let deleted = true;` più 40 righe di commento. Non è codice | n.d. |
| 22 | `src/components/widgets/Widgets.tsx:42` | `InternalToggle` è **importato ma mai renderizzato**: in `NestedView.tsx` compare solo alla riga 33 (l'import). Ed è un toggle | SOSTITUITO — `.toggle` di `_form-system.scss` |
| 23-25 | `src/components/editors/PermissionModelTab.tsx:16`, `:20`, `:24` | Montato solo da `Dock.tsx:290`, gruppo `editors` orfano (vedi #15) | INVISIBILE se mai montato |
| 26-28 | `src/components/editors/views/data/PermissionViewpointTab.tsx:16`, `:20`, `:26` | **0 consumatori** | n.d. |
| 29-30 | `src/components/editors/views/data/PermissionViewTab.tsx:25` (`checkbox3`), `:32` | **0 consumatori** | n.d. |

### 2.5 Riepilogo

| | Dentro perimetro | Fuori perimetro | Totale |
|---|---|---|---|
| `VISIBILE` | 3 | — | 3 |
| `INVISIBILE` | **8** | 6 (se montate) | 14 |
| `SOSTITUITO` | 2 (di cui **1 rotto**) | 4 | 6 |
| non valutabile (morto o commentato) | — | 7 | 7 |
| **Totale** | **13** | **17** | **30** |

**Gli otto controlli da riparare** sono: `NodeEditor.tsx:522`, `NodeEditor.tsx:562-567`,
`NotificationsSection.tsx:145`, `NotificationsSection.tsx:177`,
`PromptsSettingsSection.tsx:74`, `AdvancedSettings.tsx:70`, `JjtlPromptDialog.tsx:103`,
`ProviderModelSelector.tsx:192`.

Più un nono caso, di natura diversa: `NestedView.tsx:157`, dove il controllo è correttamente
sostituito ma il sostituto **non viene renderizzato** e la logica non è mai stata scritta.

---

## 3. Chi dipende dal nascondimento globale

**Nessun componente vivo.** È la risposta più utile del report, perché sblocca l'opzione più
semplice per la Fase 2.

Ho verificato ogni occorrenza che usa il pattern legittimo *input nascosto più elemento
sostitutivo*, cercando se il nascondimento venga dalla regola globale o da una regola propria:

| Componente | Sostituto renderizzato | Chi nasconde l'input | Dipende dalla regola globale? |
|---|---|---|---|
| `.viewpoint-checkbox` — `NestedView.tsx:155` | `<span class="viewpoint-checkbox__custom">` — **assente nel JSX** | `nestedView.scss:1243-1252` (regola propria: `position:absolute; opacity:0; width/height:0; visibility:hidden`) | **NO** |
| `.viewpoint-radio` — `NestedView.tsx:145` | `<span class="viewpoint-radio__custom">` (`:152`), presente | `nestedView.scss:1188-1193` (regola propria). È un `radio`, che la regola globale non tocca comunque | **NO** |
| `.jodie-settings-toggle` — `Jodie/SettingsModal.tsx:88` | `<span class="jodie-toggle-slider">` (`:94`) | `Jodie/SettingsModal.css:178-190`, con `!important` | **NO** |
| `.toggle` / `.form-toggle` / `.toggle-switch` — `Control.tsx:570`, `Panel.tsx:253`, `Widgets.tsx:41` | `<label class="toggle-label">` + `.toggle-labels` | `_form-system.scss:334-352` (regola propria, dentro il blocco `.toggle, .form-toggle, .toggle-switch`) | **NO** |
| `forEndUser/toggle.scss:118` (`.toggle input[type=checkbox] { width:0; height:0 }`) | — | regola propria, ma il foglio **non è importato**: l'unico `@import` è commentato a `forEndUser/Toggle.tsx:5` | irrilevante |

Ogni pattern legittimo si nasconde da solo. **La regola globale di `tokens/index.scss:106-112`
non ha un solo dipendente**: è puro danno collaterale.

Vincolo derivato per la Fase 2: rimuovere le righe 106-112 **non rompe niente**. Rende visibili i
checkbox nativi dove oggi sono nascosti, e non tocca i cinque pattern sopra, che continuano a
nascondersi con le proprie regole. Non serve restringere il selettore: non c'è nulla da
proteggere.

**Due effetti collaterali da mettere in conto** — nessuno dei due è una regressione, ma vanno
guardati a video:

1. I sei controlli fuori perimetro che oggi sono invisibili (`Logger` ×2, `PermissionModelTab` ×3,
   `BulkActionsBar`) resterebbero comunque irraggiungibili, perché non sono montati. Nessun
   effetto.
2. Le regole di stato orfane alle righe **143-174** colorerebbero il `::before` di ogni
   `label:has(input[type=checkbox])`, `+ span` e `+ label` in tutta l'app. Oggi quel `::before`
   non ha `content` (il blocco che lo generava è commentato) e le tre superfici che se ne
   preoccupavano lo neutralizzano già con `display:none !important`. Rimuovendo anche le
   143-174, come previsto dal punto 1 della Fase 2, il problema non si pone: **vanno rimosse
   insieme alla 106-112, non separatamente**.

---

## 4. `ui/Checkbox` è una destinazione valida?

**Risposta breve: sì per il problema di visibilità, no così com'è per tre dei call site.** Serve
un'estensione compatibile in aggiunta, non una riscrittura.

### 4.1 Perché è immune al difetto

`src/components/ui/Checkbox/Checkbox.tsx:54-65` **non rende un `<input>`**: rende un
`<button type="button" role="checkbox" aria-checked={checked}>` con dentro una `<i class="bi bi-check">`.
La regola globale `input[type="checkbox"]` non lo intercetta in nessun modo. Il difetto è
strutturalmente assente, non mitigato.

Stile in `Checkbox.module.css`: box 18×18 (`:13-14`), bordo `var(--input-border-width) solid
var(--input-border-color)` (`:17`), raggio `--radius-sm`, fondo `--color-bg-primary`, spunta
bianca 12px; checked `#334155` slate con hover `#1e293b` (`:39-47`); focus ring cyan
`rgba(14,165,233,0.35)` (`:35`); dark mode via `html[data-theme="dark"]` (`:61-65`).

Tutti i token consumati esistono: `--input-border-width`, `--input-border-color`,
`--input-border-color-hover`, `--radius-sm`, `--transition-fast`, `--disabled-cursor`,
`--disabled-opacity`, `--font-size-base`, `--spacing-2`, `--color-bg-primary`,
`--color-bg-secondary`, `--color-text-primary` — verificati uno per uno in `src/styles/`.
Il nesting nativo `html[data-theme="dark"] { .box { … } }` è lo stesso costrutto già usato da
`Input.module.css:159`, che ha una ventina di call site funzionanti: non è un rischio nuovo.

Il colore `checked` slate `#334155` è coerente con `CLAUDE.md` §7.1 e **non** entra in conflitto
con il canone cyan appena ratificato per i toggle: sono due primitive diverse, e il commento a
`Checkbox.module.css:38` lo dice già («cyan is accent-only, never a fill»).

### 4.2 Cosa gli manca, con il call site che lo dimostra

Ha zero call site, quindi non è mai stato provato sul campo. Tre lacune sono bloccanti per
altrettante occorrenze:

1. **Nessun `indeterminate`.** `Catalog.tsx:514` imposta `el.indeterminate = someSelected` con una
   `ref` callback. `CheckboxProps` non espone né `indeterminate` né `ref`, e `React.FC` senza
   `forwardRef` non inoltra la ref. Servirebbe `aria-checked="mixed"` più un terzo stato visivo.
   *(Nota: `Catalog.tsx:514` ha verdetto `VISIBILE` e non è nella lista degli otto da riparare —
   la lacuna conta solo se in futuro si vuole unificare anche quello.)*
2. **`onChange` perde l'evento.** La firma è `onChange: (checked: boolean) => void`.
   `Project.tsx:492` usa `onClick={(e) => onSelect?.(data.id, e.shiftKey)}`: la **selezione a
   intervallo con Shift** non è esprimibile. Stessa considerazione del punto 1: quel call site è
   già visibile, ma la lacuna va conosciuta prima di allargare la migrazione.
3. **Non inoltra props aggiuntive.** Il componente destruttura cinque prop e non fa spread del
   resto. `Catalog.tsx:514` passa `aria-label` e `title`, `Project.tsx:492` passa `aria-label`:
   migrando, quelle etichette **si perderebbero silenziosamente**. Per gli otto call site da
   riparare il problema si presenta solo su `JjtlPromptDialog.tsx:103`, che non passa nulla di
   extra, quindi non blocca — ma è la lacuna più facile da chiudere e la più insidiosa da
   scoprire dopo.

Una quarta osservazione, minore: `<label htmlFor={id}>` su un `<button>` è formalmente valido
(`button` è un elemento etichettabile), quindi non è un difetto.

### 4.3 Verdetto

Per gli **otto** call site con verdetto `INVISIBILE` dentro il perimetro, `ui/Checkbox` va bene
**così com'è**: nessuno dei tre usa `indeterminate`, `shiftKey` o prop extra. Ciascuno passa un
booleano e riceve un booleano.

Se invece si volesse migrare anche i due call site oggi `VISIBILE` (`Catalog`, `Project`) — che
questa slice non prevede — servono prima le tre estensioni sopra, tutte additive e nessuna in
conflitto con l'API attuale.

---

## 5. Nota su una raccomandazione della Fase 2

Il punto 1 della Fase 2 propone l'alternativa «rimuovere, oppure restringere il selettore ai
componenti che usano davvero il pattern input nascosto più span custom». La §3 chiude la
questione: **i dipendenti sono zero**, quindi restringere non ha oggetto. Resta la sola opzione
di rimozione, che va estesa alle righe **143-174** (regole di stato orfane) e alle righe
**115-140** (i due blocchi commentati, per il punto 4 della Fase 2). In pratica l'intero blocco
`tokens/index.scss:100-174` esce, e resta il solo wrapper `.checkbox-wrapper, .auth-checkbox-row`
delle righe 176-189 — che però contiene due regole figlie
(`input[type="checkbox"] + span::before`, `+ label::before`) anch'esse orfane, e va valutato
nello stesso passaggio.

Tre file contengono neutralizzazioni difensive di quel `::before` che diventerebbero morte con la
rimozione: `info.scss:935-938`, `viewoptions.scss:619-638`, `catalog.scss:563-567` (su `.toolbar-filter-count::before`). Non sono
dannose se restano, ma vale la pena registrarle qui per non riscoprirle fra sei mesi. Anche i due
override completi con `!important` (`catalog.scss:571-580`, `project-card.scss:1292-1302`)
diventerebbero ridondanti: **non vanno rimossi nella stessa commit**, perché toglierli è un
cambiamento visivo e non un cambiamento di visibilità.

---

## 6. Domande aperte

- **OQ-1** — Il punto 2 della Fase 2 dice «migrare a `ui/Checkbox` le occorrenze `INVISIBILE`
  dentro il perimetro». Fra le otto, tre appartengono a superfici che sono *anche* toggle
  semantici — `NotificationsSection.tsx:145` e `:177` stanno dentro `<label class="settings-toggle">`,
  cioè il markup di una riga-toggle, e `ProviderModelSelector.tsx:192` si chiama
  `.pm-legacy-toggle`. Migrare a `ui/Checkbox` li renderebbe visivamente checkbox in righe
  disegnate per un interruttore. Vanno migrati a `ui/Checkbox` comunque, o messi in coda alla
  slice dei toggle?
- **OQ-2** — `NestedView.tsx:157` non è in nessuna delle tre categorie: il pattern è corretto ma
  il sostituto non è renderizzato e la logica non esiste (`checked={false}`, `onChange` vuoto).
  Si ripristina lo `<span class="viewpoint-checkbox__custom">` in questa slice — un edit di una
  riga che riattiva ~130 righe di CSS già scritte — o si lascia com'è perché la selezione
  overlay non è implementata a monte?
- **OQ-3** — Il ripristino di `info.scss:881-891` è agganciato alla classe esatta
  `.properties-panel`, e per questo `GraphData` funziona mentre `NodeEditor` no (§2.2). Dopo la
  rimozione della regola globale quel blocco diventa un override senza avversario: si lascia, o
  si toglie nella stessa commit? Toglierlo cambia l'aspetto (bordo e sfondo espliciti), quindi
  propendo per lasciarlo e trattarlo in una slice di pulizia.
- **OQ-4** — Le tre estensioni di `ui/Checkbox` della §4.2 (`indeterminate` + `forwardRef`,
  evento nell'`onChange`, spread delle prop residue) si fanno adesso, così la primitiva è
  completa alla prima adozione, o solo quando serviranno per `Catalog` e `Project`? Sono
  additive e non rompono l'API.

---

## 7. File letti

`src/styles/tokens/index.scss` (integrale, righe 100-194); `src/App.scss` (ordine degli import);
`src/components/forEndUser/Input.tsx` (percorso di rendering per `type='checkbox'`);
`src/components/ui/Checkbox/Checkbox.tsx` e `Checkbox.module.css` (integrali);
i 21 file `.tsx` che contengono le 30 occorrenze;
`src/styles/components/_form-system.scss` (righe 215-250, 328-360);
`src/components/editors/info.scss` (righe 769-938);
`src/components/editors/views/nestedView.scss` (righe 1170-1300);
`src/components/editors/views/data/viewoptions.scss` (righe 488-645);
`src/components/editors/node-editor-redesign.scss` (righe 255-270);
`src/pages/components/catalog/catalog.scss` (righe 555-600);
`src/pages/components/project-card.scss` (righe 1285-1330);
`src/pages/settings.scss` (righe 305-335, 995-1015);
`src/components/Settings/PromptsSettingsSection.scss` (righe 30-50);
`src/components/Settings/UnifiedSettingsModal/UnifiedSettingsModal.scss` (righe 655-715);
`src/components/Jodie/SettingsModal.css` (righe 168-240);
`src/components/common/ProviderModelSelector.scss` (righe 128-140);
`src/components/forEndUser/toggle.scss`; `src/components/BulkActionsBar/bulk-actions-bar.scss`;
`src/components/abstract/Dock.tsx` (righe 275-340);
`src/components/editors/PropertiesWithTreeView.tsx` (righe 430-505);
`src/components/editors/Info.tsx` (righe 1180-1215, 1290-1360).

Storia git: `git log --follow` su `frontend/src/styles/tokens/index.scss`; `git show` di
`151a488b7` e `3979b5e1a` sul solo file.

Documenti: `CLAUDE.md`, `docs/claude-code-log.md`,
`docs/discovery/discovery_2026-08-05_censimento_primitive_ui.md` §2, §2.1, §14.

---

**HARD STOP.** Fase 1 chiusa. Nessun file sorgente modificato, nessun `git add`, nessun commit.
La Fase 2 attende go-ahead esplicito.

---

# Correzione — 2026-08-05, durante la Fase 2

**Cosa cambia rispetto alla versione sopra**: la diagnosi centrale del report è
sbagliata. I checkbox nativi **non erano invisibili**. Erano visibili — 20×20, contorno
grigio — e **morti al click diretto sul quadratino**. Tutto il resto del report (censimento
delle 30 occorrenze, perimetro, dipendenze, valutazione di `ui/Checkbox`) regge; cambia la
gravità del difetto e con essa la giustificazione dei commit 2 e 3.

## L'errore

Il report ha ricostruito la cascata a partire da `tokens/index.scss` **senza cercare altre
regole globali sullo stesso selettore**. Ne esiste una seconda:

`src/styles/style.scss:221-230`, importata da `App.tsx:6`:

```scss
input[type="checkbox"]{
  opacity: 1;
  position: relative;
  width: 20px;
  height: 20px;
  accent-color: white;
  outline: 1.5px solid gray;
  outline-offset: -1px;
}
```

Stessa specificità `(0,1,1)` della regola di nascondimento, ma **più avanti nell'ordine di
valutazione**: `App.tsx:2` importa `./App.scss` (che a sua volta importa `tokens/index.scss`
alla riga 6) prima di `./styles/style.scss` alla riga 6 dello stesso file. A parità di
specificità vince l'ultima, quindi `style.scss` **si riprendeva `opacity`, `position`,
`width` e `height`**. Alla regola di `tokens/index.scss` restava una sola proprietà senza
concorrenti: `pointer-events: none`.

Il file compariva nell'output della `grep` del censimento del 5 agosto (`2` occorrenze in
`src/styles/style.scss`) e non è stato aperto. È il difetto di metodo: contare i file che
contengono una regola non è leggerli.

## La misura

Eseguita sull'app in esecuzione, non dedotta. La regola rimossa è stata **re-iniettata a
runtime** come `<style>` inserito *prima* del tag che porta `style.scss`, riproducendo
l'ordine di cascata originale senza toccare nessun file. Sonda in scratchpad, zero file
creati sotto `frontend/`.

| | prima del commit 1 | dopo il commit 1 |
|---|---|---|
| dimensioni | 20×20 | 20×20 |
| `opacity` | 1 | 1 |
| `position` | `relative` | `relative` |
| `pointer-events` | **`none`** | **`auto`** |
| `outline` | 1px solid | 1px solid |
| chi riceve il click al centro del box | **il `div` genitore** | **l'elemento stesso** |
| click diretto sul quadratino | **NON toggla** | toggla |
| click sulla `<label>` circostante | toggla | toggla |

## Cosa significa per gli otto

**Tutti e otto i call site stanno dentro un `<label>`** — verificato uno per uno:
`node-editor__field-row`, `node-editor__inline-field--checkbox`, `settings-toggle` ×2,
`prompts-checkbox-label`, `settings-checkbox`, il `<label style>` di `JjtlPromptDialog`,
`pm-legacy-toggle`. L'attivazione via `<label>` non passa dai pointer events dell'input,
quindi **erano tutti operabili cliccando la riga**. Quello che non funzionava era il click
sul quadratino.

Il verdetto `INVISIBILE` delle tabelle §2.2, §2.3 e §2.4 va letto come **`VISIBILE MA INERTE
AL CLICK DIRETTO`**. Il verdetto `VISIBILE` delle tre righe che ce l'avevano resta corretto,
e resta corretto il motivo: `catalog.scss:571` e `project-card.scss:1292` ridichiarano
`pointer-events: auto !important`, quindi erano pienamente funzionanti.

Anche la §5 va corretta: l'affermazione che le regole di stato orfane (143-174) fossero
inerti resta vera, ma la §3 («la regola globale non ha un solo dipendente») resta valida e
anzi si rafforza — nessuno dipendeva neanche da `pointer-events: none`.

## Conseguenze sulla slice

- **Il commit 1 resta corretto e va tenuto.** Rimuove `pointer-events: none`, che era il
  difetto reale, e toglie le regole di stato orfane prima che diventassero dannose. Il
  messaggio di commit è stato riscritto sui dati misurati prima del push.
- **I commit 2 e 3 perdono la premessa.** Erano giustificati da «otto controlli invisibili».
  Gli otto sono visibili e, dopo il commit 1, pienamente cliccabili. Migrarli a `ui/Checkbox`
  e `ui/Toggle` resta difendibile come **uniformità del design system** — cinque di essi non
  hanno regole proprie e ricadono quindi sull'aspetto imposto da `style.scss:221`, 20×20 con
  `outline: 1.5px solid gray` e `accent-color: white`, che non appartiene ad alcuna scala del
  design system — ma non è più una riparazione. È una decisione di Alfonso, non una
  conseguenza del report.
- **`style.scss:221-230` è ora il vero canone de facto del checkbox nativo**, e non è
  registrato da nessuna parte: non è in `styles/tokens/`, contraddice la regola 28 di
  `CLAUDE.md` («no CSS variables in component files» — qui è peggio, è uno stile di
  controllo in un foglio globale non tokenizzato), e il suo `outline: 1.5px solid gray` non
  appartiene ad alcuna scala del design system. Va nel censimento come quindicesima
  implementazione di controllo booleano.

## Cosa resta non misurato

La sonda ha misurato il meccanismo e i due controlli di `#/allProjects` (18×18, `opacity 1`,
`appearance: none`, invariati — nessuna regressione). **Non** ha raggiunto la modale Settings
(il selettore dell'avatar in navbar non ha aperto il menu) né il pannello Viewpoints (nessun
`input[type=checkbox]` nel DOM del progetto appena creato, il pannello non è montato). Le
righe corrispondenti delle tabelle §2.2 e §2.3 restano quindi dedotte dal CSS, non misurate.
