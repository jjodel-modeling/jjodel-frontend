# Discovery (read-only) — Properties panel (redesign lato destro)

**Data**: 2026-07-28
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: discovery Fase 1 (read-only). Nessuna modifica al sorgente, nessun commit, nessun build.
**Nome documento prompt**: 2026-07-27 (Fase 1 Properties panel redesign)

---

## Obiettivo

Mappare **com'è implementato oggi** il Properties panel (l'inspector di destra: dock tab
"PROPERTIES" → "View for State" → tab `Apply to / Template / IR / Style / Events / Options`),
per poter scopare con precisione la Fase 2 sui 6 punti del redesign + i cross-cutting. Nessuna
implementazione qui.

## Architettura del pannello (catena di host)

```
Dock.tsx:282  tab "Properties"  →  PropertiesWithTreeView (mode 'tab')
   → editors/Info.tsx  (router per tipo di elemento selezionato)
       • DViewPoint            → ViewpointProperties
       • DViewElement (view)   → editors/views/ViewData.tsx   ← IL pannello "View for State/Transition"
       • metaclass elements    → Info.tsx stesso (props-header + sezioni)
```

`ViewData.tsx` (`ViewDataComponent`) rende: **header** (`.props-header` + breadcrumb band) +
**tab bar inline** + contenuto del tab attivo. I tab instradano a componenti di `views/data/*`
(Apply to/Template/Style/Events/Options) e, per il tab **IR**, ai pannelli di authoring in
`editor-v2/viewpoint/authoring/*`.

## File letti / analizzati (path completi)

Diretti (io):
- `frontend/src/components/editors/views/ViewData.tsx` (intero)
- `frontend/src/components/editors/Info.tsx` (regioni: 535-554, 900-915, 1184-1312 — è 1427 righe)
- `frontend/src/components/abstract/Dock.tsx` (regione tab/title)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (regione shape/border/resizable/propagate)
- `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx` (Visible/Editable/Stile)
- `frontend/src/components/ui/ConditionalEditor/ConditionalEditor.tsx` (già letto in sessioni precedenti)

Via 3 agenti read-only paralleli (inventari esaustivi):
- **Lingua/i18n** → tutti i file `editors/*` + `editor-v2/viewpoint/authoring/*` + `ui/ConditionalEditor`.
- **Basic/Advanced + pannello condiviso** → `hooks/useInterfaceMode.ts`, `common/U.tsx`, `redux/store.tsx`, `pages/components/Navbar.tsx`, `ViewData.tsx`, `Info.tsx`, `views/data/*`, authoring.
- **SCSS/classi + checkbox** → `styles/components/_form-system.scss`, `editors/{info,info-improvements,editors,style}.scss`, `views/nestedView.scss`, `views/data/{viewapplyto,viewoptions}.scss`, `skeleton.scss`, `styles/tokens/_spacing.scss`, `ui/{Checkbox,Toggle}`.

---

## Findings per punto del redesign

### P1 — Lingua unica (English): oggi mix IT/EN, **hardcoded, nessun i18n**

**Verdetto i18n**: **NON esiste alcun layer di internazionalizzazione** nel repo. `package.json` non
ha dipendenze i18n; grep globale per `useTranslation`/`i18next`/`react-intl`/`FormattedMessage`/`t(`/`intl.`/`LOCALE`
→ zero match. Ogni stringa è un literal inline. → il cambio lingua è un'edit dei literal in loco
(semplice ma multi-sito), **senza catalogo**; nessun impatto su un sistema condiviso di traduzioni
(non c'è).

**Pattern del mix (sistematico, non casuale)**: label strutturali/di campo e le option-set di
`Select`/`Checkbox` sono **EN**; gli `HelpText`, gli hint (`FEATURES_HINT`), gli `ErrorText`, i
`title`/tooltip e alcune label di controllo dell'IR-authoring sono **IT**. L'italiano è concentrato
**interamente** in `editor-v2/viewpoint/authoring/*` + `ui/ConditionalEditor` + **1 riga** di `ViewData`.

**Classificazione per file**:
- **EN-only** (nessun IT): `Info.tsx`, `LabelListEditor.tsx`, `LabelEntryEditor.tsx`,
  `BadgeListEditor.tsx`, `TextSourceEditor.tsx`, `FieldSegmentEditor.tsx`.
- **MIXED** (IT+EN nello stesso componente — pattern dominante): `ViewData.tsx`,
  `VertexAuthoringPanel.tsx`, `FieldCompartmentListEditor.tsx`, `TextStyleEditor.tsx`,
  `TextStyleField.tsx`, `EnableIRPanel.tsx`, `EdgeAuthoringPanel.tsx`, `RowAuthoringPanel.tsx`,
  `MatchingSection.tsx`, `ConditionalEditor.tsx`.
- **IT-only**: nessuno.

**Inventario stringhe italiane (campione con `file:linea`; lista esaustiva nel corpo)** — prefisso
`editor-v2/viewpoint/authoring/`:
- `ConditionalEditor.tsx` (**ui, condiviso**): `:48` "conditional (regole multiple, non ancora editabile)", `:66` **"Fisso"**, `:67` **"Condizionale"**, `:78` "Quando", `:88` "Allora", `:93` "Includi ramo else", `:102` "Altrimenti".
- `VertexAuthoringPanel.tsx`: `:34` FEATURES_HINT "imposta una metaclasse…", `:212`/ErrorText, `:268` "Forza le maniglie di resize…", `:272` title "Applica la dimensione…", `:277` **"Propaga dimensione"**, `:323` HelpText Advanced.
- `TextStyleEditor.tsx`: `:17` "Normale", `:18` "Corsivo", `:101` "Condizionale", `:108` title "Rendi condizionale (ƒx)", `:170` "Dimensione", `:205` "Peso", `:224` "Stile", `:244` "Colore", `:258` title "Rimuovi (Default)".
- `TextStyleField.tsx`: `:68` "Personalizzato", `:99` "Stile", `:160` title, `:169` "Tipografia", `:176` title.
- `EdgeAuthoringPanel.tsx`: ~25 stringhe IT (label + HelpText): `:269` "Metaclasse sorgente", `:317` "Condizione", `:341` "Priorità", `:350` "Linea", `:352` "Colore", `:364` "Spessore", `:376` "Tratto", `:395` "Terminazioni", `:397` "Sorgente", `:405` "Destinazione", `:419` "Label al centro" + HelpText.
- `RowAuthoringPanel.tsx`, `MatchingSection.tsx`: label ("Metaclassi", "Condizione", "Priorità", "Esclusiva") + molti HelpText IT.
- `FieldCompartmentListEditor.tsx`: `:194` "Filtro children", `:202` "filtra per metaclasse (isKind)" + chip/help.
- `EnableIRPanel.tsx`: 7 HelpText IT + `:142` "Abilita authoring IR".
- `ViewData.tsx`: `:99` "View IR di kind …: authoring non ancora disponibile." (unica IT del file).

**Rischio P1**: `ConditionalEditor` è **condiviso** (vedi P5) → tradurre "Fisso/Condizionale/Quando/Allora/Altrimenti"
tocca **tutti** i suoi consumatori (TextStyleEditor, EdgeAuthoringPanel, LabelEntryEditor, VertexAuthoringPanel fill, …).
Molte stringhe IT vivono in componenti authoring condivisi tra view-State e view-Transition e Row.

### P2 — Header collassato: oggi 3 zone su 2 componenti

- **Zona 1 — "PROPERTIES"**: è la **tab del dock** (`Dock.tsx:282`, `<TabHeader>Properties</TabHeader>`,
  content `PropertiesWithTreeView`). Chrome esterno al pannello (l'uppercase è probabile `text-transform`).
- **Zona 2 — riga contestuale "View for State"**: `ViewData.tsx:152-165`, `.props-header`:
  back `Btn` (CommandBar), `bi-eye` (`.props-header__icon`), `view.name` (`.props-header__name`),
  `.jj-type-badge` `VIEW`/`VIEWPOINT`, `HelpButton helpKey="properties-panel"`.
- **Zona 3 — breadcrumb "STATE MACHINE › View for State"**: `ViewData.tsx:167-178`,
  `.view-header-breadcrumb-band` → `.path-list` con `.path-element` (click → `setSelectedView`) +
  `.path-separator` (`bi-chevron-right`), da `view.fatherChain`.

`.props-header*` è **condiviso** con l'header metaclasse di `Info.tsx:905-913` (il commento
`ViewData.tsx:154` lo dichiara "homogeneous with the metaclass .props-header"). Definizioni:
`.props-header` `info-improvements.scss:865`, `__icon` `:880`, `__name` `:892`; header band
`nestedView.scss:3664`; badge `.jj-type-badge` `_form-system.scss:1242` (+`--view/--viewpoint`
`nestedView.scss:3681-3682`).

**Rischio P2**: collassare le 3 zone "in una riga" tocca `ViewData.tsx` (zone 2+3) e forse la tab del
dock (zona 1). Restilare `.props-header*` impatta **anche** l'inspector metaclasse (classe condivisa).
`.view-editor-header` è agganciata da un selettore sibling in `DockManagerStyles.scss:69`
(`.view-editor-header+.dock-layout`) → **non rinominare**.

### P3 — Tab su una riga: bar **inline in ViewData**, non condivisa

Nessun componente Tabs condiviso: la tab bar è renderizzata inline in `ViewData.tsx:182-198`:
`.view-editor-tabs` › `.view-editor-tab-bar` (role tablist) › N `<button className="view-editor-tab">`
(+ `.active`) › `.view-editor-tab-content`. Tab attivo: `useState<TabId>` (`:145`), fallback `:149`.
Il set di tab è **domain-driven** (`:65-142`): `apply-to`(sempre), `template`(isV), `ir`(showIRTab),
`style`(sempre), `events`(isV), `options`(isV), `components`(isVP). **Le label di dominio (`Apply to`,
ecc.) NON vanno rinominate.**

Definizioni SCSS in `nestedView.scss`: `.view-editor-tabs:3582`, `.view-editor-tab-bar:3592`,
`.view-editor-tab:3601` (+`.active:3615`, sottolineatura cyan `#0ea5e9`), `.view-editor-tab-content:3622`.
Il "wrap su due righe" di `Apply to` e le altezze disuguali sono un fatto **CSS** del `.view-editor-tab-bar`/`.view-editor-tab`
(nessun `white-space:nowrap`/altezza fissa/scroll orizzontale oggi — da verificare/aggiungere in Fase 2).

**Rischio P3**: `.view-editor-tab-content` è target di scoping in `viewapplyto.scss:28` e `viewoptions.scss`;
`.view-editor-root` è referenziato in `_form-system.scss:656/714`, `properties-with-tree-view.scss:75` (`:has()`),
`dock-tabs.scss`, ecc. → cambiare layout/altezza è locale al CSS di questi selettori ma **le classi non si rinominano**.

### P4 — Riga "Line" etichettata: oggi "Border" + 3 controlli **senza micro-label**

`VertexAuthoringPanel.tsx:252-258`: un `.jj-field` con label **"Border"** e, sotto, 3 controlli
**in fila senza label individuali**:
- `ColorPicker` (`border.color`)
- `NumberInput` (`border.width`) — lo **stepper**
- `Select` `BORDER_STYLE_OPTIONS` (`border.style`) — il dropdown **"Solid"** (Solid/Dashed/Dotted)

Bound al campo IR `shape.border` (`{ color, width, style }`), `DEFAULT_BORDER = {#334155, 1, 'solid'}`
(`:32`), patch via `patchBorder` (`:189-191`).

**Nota di dominio (open question)**: la label attuale è **"Border"**; il mockup chiama il gruppo
**"Line"** con micro-label `Width`/`Style`. Rinominare la *label visibile* Border→Line non tocca
l'identificatore di codice (`shape.border` resta) ma è un cambio di terminologia UI → **conferma di
Alfonso** (§6 dice "label di dominio invariate").

### P5 — Un solo controllo di visibilità: oggi **un** `ConditionalEditor` (mode + checkbox annidata)

Il controllo "Visible" della label è **un solo** `ConditionalEditor` — `LabelEntryEditor.tsx:85-96`:
```tsx
<ConditionalEditor value={label.visible} onChange={…}
  renderValue={(v, onCh) => <Checkbox checked={v} onChange={onCh} label="visible" />}
  defaultValue={true} … />
```
`ConditionalEditor` (`ui/ConditionalEditor/ConditionalEditor.tsx`) rende **internamente**: i due
Button segmentati **"Fisso"/"Condizionale"** (`:66-67`) + (in Fisso) il `renderValue` = la `Checkbox`
"visible"; (in Condizionale) `PredicateBuilder` "Quando" + `renderValue` "Allora" + opzionale "Altrimenti".
Semantica confermata: **`visible` è `Conditional<boolean>`** — cioè una **modalità** (valore fisso
`T` vs oggetto `{when,then,else}`) + un **valore** booleano dipendente. Questo è **già** lo schema che
il redesign vuole ("modalità Fixed/Conditional + Visible switch annidato"); il redesign è
essenzialmente un **restyling/relabel** (Fisso→Fixed, annidare Visible sotto il mode, unificare lo
stile checkbox), non un cambio di modello dati.

`ConditionalEditor` è **condiviso** (vedi P1): usato per `visible`, `fill`, `line.color/width/style`,
e ogni asse di `TextStyleEditor`. Non espone un modo per nascondere il suo switch interno.

**Checkbox: 5 implementazioni distinte** (il "quadrato pieno scuro vs outline" = `ui/Checkbox`
checked vs unchecked, accanto ai pill-switch):
1. **`ui/Checkbox`** (`<button role="checkbox">`, `Checkbox.module.css`): 18×18; **unchecked = outline**,
   **checked = riempito slate `#334155`** + check bianco (regola DS: cyan solo accent, slate per il fill).
   È **la** checkbox dell'IR-authoring — usata in tutti i pannelli authoring (`VertexAuthoringPanel:263`,
   `LabelEntryEditor:78,90`, `EdgeAuthoringPanel:270,318,416`, `RowAuthoringPanel`, `MatchingSection`,
   `FieldCompartmentListEditor`, `FieldSegmentEditor`, `BadgeListEditor`).
2. **`ui/Toggle`** (pill switch, NON checkbox): off slate-300 `#cbd5e1`, on cyan `#0ea5e9`. Flag booleani
   metaclasse (`Info.tsx:99` PropertiesToggle) + opzioni Apply-to (`InfoData.tsx:166,186`).
3. **`.bool-toggle`** (pill custom, `Info.tsx:718-731` / `info-improvements.scss:1630`): valori slot `EBoolean`.
4. **`<input type="checkbox">` grezza** override `info.scss:881-912`: checked = fill `var(--color-accent)`
   + SVG. Legacy/fallback dentro `.properties-panel .input-container` (es. Style tab `PaletteData:776`).
5. **`.viewpoint-checkbox`** (`nestedView.scss:1184-1295`): albero viewpoints (fill cyan `#0891b2`).

**Rischio P5**: "un solo stile di checkbox" richiede di decidere **quale** è il canone (verosimilmente
`ui/Checkbox`) e come trattare i **pill switch** (semanticamente *switch* per flag booleani, non checkbox)
e le **checkbox native legacy** (#4). Toccare `ConditionalEditor` (per annidare Visible / relabel) impatta
**tutti** i suoi consumatori.

### P6 — Ritmo 8px: scala token esiste ma **usata a macchia di leopardo**

Scala token reale in `styles/tokens/_spacing.scss:13-25` (`--space-1`=4px … `--space-2`=8px … fino a `--space-24`)
+ derivate (`--panel-padding`, `--gap-*`, `--tab-*`, `:38-62`). Ma:
- **Usa i token**: `info.scss` (es. `.properties-panel { padding: var(--space-3) }` `:415`).
- **Ad-hoc**: tutto il layer `jj-*` di `_form-system.scss` (`.jj-field { margin-bottom:14px }` `:946`,
  `.jj-field-label { margin-bottom:5px }` `:958`, `.jj-toggle-row { padding:5px 0 15px 0 }` `:1178`);
  `info-improvements.scss` header (`gap:8px; height:40px; padding:0 12px`); `nestedView.scss` con una
  **scala privata** `$spacing-xs..lg` (`:30-33`) + px grezzi (tab `padding:8px 16px` `:3602`).

Bottone disabilitato "Propaga dimensione": `VertexAuthoringPanel.tsx:269-278` `Button variant="secondary"
disabled={!canResize}` → lo stile disabilitato "pesante" viene dal componente `ui/Button` (variant secondary),
non da CSS locale del pannello.

**Rischio P6**: il ritmo 8px coerente richiede di intervenire sul layer `jj-*` (form-system) e/o su
`nestedView.scss` — entrambi condivisi da molti pannelli; meglio agire per-sezione con i token `--space-*`
senza toccare le classi condivise a tappeto.

---

## Cross-cutting (per scopare la Fase 2)

- **Pannello condiviso State/Transition — SÌ**. Stesso `ViewDataComponent` per view-State (vertex/plain)
  e view-Transition (`view.isEdge` classic o `ir.kind==='edge'`): entrambi `isV=true`, condividono
  **tutti** i tab non-IR. Divergenza **solo** a `showIRTab` (`ViewData.tsx:61`) e nel corpo del tab IR
  (`:89-102`: Vertex/Row/Edge/Enable per `ir.kind`). → **una modifica a `ViewData.tsx`/`Info.tsx`
  impatta entrambe**; il comportamento node/edge-specifico va aggiunto ai due branch, non allo scaffold.
- **Basic/Advanced esistente — NON consumato dal pannello view**. Due rappresentazioni: (A) hook
  `useInterfaceMode` (`hooks/useInterfaceMode.ts`, localStorage `jjodel.interfaceMode` + statico
  `U.interfaceMode` `common/U.tsx:214`, evento `SystemEvents.INTERFACE_MODE_CHANGE`); (B) Redux
  `state.advanced` (`redux/store.tsx:215`). Riconciliate nel Navbar (`Navbar.tsx:838-866`). **`Info.tsx`
  consuma entrambe** (`:33,:111,:1408`); **`ViewData.tsx`, `views/data/*`, `editor-v2/viewpoint/authoring/*`
  NON consumano NESSUNA** (il `'basic'|'advanced'` in `VertexAuthoringPanel.tsx:55` è un **sub-tab locale**,
  scollegato dal mode globale; `FieldCompartmentListEditor:24` è un `ChildFilterKind`). → il progressive
  disclosure del redesign è **greenfield** sul lato view: **riusare `useInterfaceMode`** (hook) — non
  crearne uno nuovo, non appoggiarsi al sub-tab locale.
- **Critical-zone — NESSUN import** di `useJjomSync`/`portDistribution` in `editors/*` o `authoring/*`.
  → la Fase 2 **non** richiede Layer Impact Report. (`VertexAuthoringPanel` importa `defaultResizableForForm`
  da `nodes/nodeSizing`, non critical-zone.)
- **Pattern CLAUDE.md**: un solo **CustomEvent** nel pannello — `PROPAGATE_VIEW_SIZE`
  (`VertexAuthoringPanel.tsx:273`, via `JjodelEvents`); il resto è **callback-prop chain**
  (`setSelectedView`, `onChange`, `readonly`). Nessun `DObject.new`/temp-ID nel pannello; `LModel` solo
  in `edgeCandidate.ts`. `windoww` in `NestedView.tsx:24` (albero viewpoints).
- **Inventario classi (must-not-rename)**: `.props-header*`, `.view-editor-{root,header,tabs,tab-bar,tab,tab-content}`,
  `.view-header-breadcrumb-band`, `.path-{list,element,separator}`, `.properties-{panel,tab}`, `.jj-type-badge`,
  e l'intera famiglia `jj-*` (`jj-field`, `jj-field-label`, `jj-context-bar`, `jj-toggle-row`, `jj-slot*`).
  Cross-referenziate da selettori di scoping/`:has()`/sibling in `DockManagerStyles.scss`,
  `properties-with-tree-view.scss`, `viewapplyto.scss`, `viewoptions.scss`, `_form-system.scss`.

## Dipendenze e rischi (sintesi)

1. **`ConditionalEditor` condiviso (ui)** — impatta P1 (Fisso/Condizionale→Fixed/Conditional) e P5
   (annidare Visible / relabel). Ogni modifica si propaga a **tutti** i consumatori (fill, line, textstyle,
   visible, edge). Se la Fase 2 deve toccarlo → cambio di componente condiviso, **conferma esplicita**.
2. **`ViewData.tsx` = pannello unico State/Transition** — header/tab (P2/P3) impattano entrambe le viste.
3. **Classi CSS condivise** (`.props-header*`, `.view-editor-*`, `jj-*`) — restyling sì, **rename no**;
   attenzione ai selettori di scoping esterni.
4. **Nessun i18n** — il cambio lingua (P1) è multi-sito su literal; concentrato in `authoring/*` +
   `ConditionalEditor` + 1 riga `ViewData`. Ampio ma meccanico.
5. **5 varianti checkbox** — "un solo stile" (P5) richiede una policy (canone = `ui/Checkbox`; i pill
   switch sono *switch* semantici, non checkbox; le native legacy #4 sono in tab non-IR).
6. **Spacing token esistono ma non uniformi** (P6) — intervenire per-sezione coi `--space-*`, non a
   tappeto sulle classi condivise.
7. **Progressive disclosure**: usare `useInterfaceMode`; il lato view non lo consuma ancora (greenfield).

## Domande aperte per Alfonso

1. **"Border" → "Line" (P4)**: rinominare la label visibile? "Border" è il concetto IR (`shape.border`);
   §6 dice "label di dominio invariate". Confermi il relabel display-only, o teniamo "Border"?
2. **Scope della Fase 2**: solo i 6 pain-point nel **tab IR** (VertexAuthoringPanel + ConditionalEditor)
   + header/tab di `ViewData`? O anche il language-sweep di **tutti** i pannelli authoring
   (Edge/Row/Matching/TextStyle), che sono condivisi con la view-Transition?
3. **`ConditionalEditor` (condiviso)**: la Fase 2 può toccarlo (relabel EN + eventuale restyle del
   Visible annidato), accettando l'impatto su tutti i consumatori? O si vuole un wrapper locale per non
   toccarlo?
4. **"Un solo stile di checkbox" (P5)**: canone = `ui/Checkbox`. I **pill switch** (`ui/Toggle`/`.bool-toggle`,
   flag booleani) restano switch (semantica diversa) o vanno uniformati anche loro? Le checkbox **native
   legacy** (#4, tab Style/permessi) sono in scope?
5. **Header (P2)**: il collasso in una riga tocca **solo** le 2 righe di `ViewData` (`.props-header` +
   breadcrumb), o anche la **tab "Properties" del dock** (`Dock.tsx:282`)?
6. **Progressive disclosure**: confermi `useInterfaceMode` come meccanismo (il lato view è greenfield);
   e il **sub-tab locale** `basic/advanced` di `VertexAuthoringPanel:55` va mantenuto, sostituito, o
   ricondotto al mode globale?

---

## Hard stop

Report scritto. **STOP.** Nessuna modifica ai sorgenti, nessun commit, nessuna Fase 2. Nessuna entry
in `docs/claude-code-log.md` (fase read-only, come da prompt §4). L'analisi prosegue in chat a partire
da questo documento.
