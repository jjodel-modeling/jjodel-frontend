# Discovery — uniformazione delle due property card (sintassi astratta e view)

**Data**: 2026-08-08 08:45 · **Fase**: 1 (read-only) · **HEAD**: `40820fe21`
**Branch**: `alfonso-frontend-jjtl` · **Effort**: xhigh
**Prompt document name**: `2026-08-08 08:45 discovery uniformazione card properties`

---

## 0. Obiettivo e ipotesi sotto falsificazione

Mappare come sono implementate **oggi** le due card del pannello Properties — quella
della sintassi astratta e quella delle view IR — per scopare la Fase 2 dei punti U-1..U-8.
Nessuna modifica al sorgente.

Ipotesi che la discovery doveva falsificare (formulate leggendo il prompt, non il codice):

| # | Ipotesi | Esito |
|---|---------|-------|
| H1 | Le due card condividono il componente di header, quindi U-1 è un riuso | **FALSIFICATA** — condividono la *classe CSS* `.props-header`, non il componente. Sono due alberi JSX distinti con contenuto diverso (§D1) |
| H2 | `jj-context-bar` è un componente riusabile con una API di segmenti | **FALSIFICATA** — non esiste alcun componente: è markup inline dentro `Info.tsx`, con la sola classe come contratto (§D2) |
| H3 | I titoli di sezione dei tab IR usano un componente condiviso | **PARZIALMENTE FALSIFICATA** — `FormSection` esiste ed è usato solo da `VertexAuthoringPanel`; `Applies to`, `Row` ed `Edge` usano `div.jj-field-label` come titolo di sezione (§D3) |
| H4 | Il segmented Fixed/Conditional è il primitivo `SegmentedControl` | **FALSIFICATA** — è markup + CSS module interni a `ConditionalEditor`; il primitivo `SegmentedControl` (creato il 2026-08-08) non ha **nessun** consumatore (§D4) |
| H5 | Gli stepper mostrano la casella vuota perché il valore è assente nell'IR | **NON RIPRODOTTA A CODICE** — i due path leggibili scrivono `0` e `1`. Vedi §D5 e §Domande aperte Q1 |
| H6 | La doppia label dei toggle è una convenzione ripetuta a mano | **CONFERMATA** — `jj-field-label` del campo + prop `label` del `Toggle` (§D6) |
| H7 | Il pannello view usa un solo sistema di aiuto | **FALSIFICATA** — ne convivono tre: `InfoTooltip` (ⓘ), `HelpText` (inline) e `HelpButton` (drawer) (§D7) |

---

## 1. File letti (path completi, tutti a HEAD `40820fe21`)

Sorgenti letti **per intero**:

- `frontend/src/components/editors/Info.tsx` (1427)
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (648)
- `frontend/src/components/editors/views/ViewData.tsx` (297)
- `frontend/src/components/editors/views/data/InfoData.tsx` (345)
- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` (155)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (427)
- `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx` (415)
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` (763)
- `frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx` (166)
- `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` (148)
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` (269)
- `frontend/src/components/editor-v2/viewpoint/authoring/BadgeListEditor.tsx` (117)
- `frontend/src/components/editor-v2/viewpoint/authoring/LabelListEditor.tsx` (76)
- `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx` (117)
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx` (78)
- `frontend/src/components/viewParenting/ViewParentingFields.tsx` (156)
- `frontend/src/components/viewParenting/viewParentingOptions.ts` (83)
- `frontend/src/components/ui/ConditionalEditor/ConditionalEditor.tsx` + `.module.css`
- `frontend/src/components/ui/SegmentedControl/SegmentedControl.tsx` + `.module.css`
- `frontend/src/components/ui/NumberInput/NumberInput.tsx` + `.module.css`
- `frontend/src/components/ui/Toggle/Toggle.tsx`
- `frontend/src/components/ui/HelpText/HelpText.tsx` + `.module.css`
- `frontend/src/components/ui/FormSection/FormSection.tsx` + `.module.css`
- `frontend/src/components/ui/ListEditor/ListEditor.tsx` + `.module.css`
- `frontend/src/components/ui/EmptyState/EmptyState.tsx`
- `frontend/src/components/ui/index.ts`
- `frontend/src/components/HelpButton.tsx`
- `frontend/src/components/viewParenting/viewParenting.scss` (151)

Letti **per sezione** (blocchi pertinenti):

- `frontend/src/styles/components/_form-system.scss` — 940-975, 1165-1266
- `frontend/src/components/editors/info-improvements.scss` — 800-1000, 1318-1340
- `frontend/src/components/editors/properties-with-tree-view.scss` — 230-475, 994-1030
- `frontend/src/components/editors/views/nestedView.scss` — 3620-3737
- `frontend/src/components/editors/views/data/viewoptions.scss` — 830-890
- `frontend/src/pages/components/navbar.scss` — 2105-2145
- `frontend/src/styles/tokens.css` — token lookup
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` (152, intero)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` — 300-340, 386-450
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` — 155-180
- `frontend/src/view/viewElement/view.tsx` — 1405-1460

Documenti di contesto: `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/decisions.md`,
`docs/claude-code-log.md` (ultime 20 intestazioni + entry 1),
`docs/discovery/discovery_2026-08-08_property_card_segmented_control.md`.

---

## 2. Correzioni ai path del prompt

Il prompt avvisa che i nomi dei file sono in parte ipotesi. Verificati:

| Path nel prompt | Realtà a HEAD |
|---|---|
| `components/editors/Info.tsx` | ✅ esiste |
| `components/editors/InfoData.tsx` | ❌ — è `components/editors/views/data/InfoData.tsx` |
| `components/editors/views/ViewData.tsx` | ✅ esiste |
| `components/editors/views/nestedView.scss` | ✅ esiste (3736 righe) |
| `components/editor-v2/viewpoint/authoring/` | ✅ esiste, con `irTabs.tsx` |
| `styles/components/_form-system.scss` | ✅ esiste |
| classe `properties-node-section` | ✅ ma **non** è dentro la card astratta: è sezione sorella, vedi §D10.3 |

Aggiunta non citata dal prompt e **centrale** per tutti i punti: il blocco
"B4 mockup skin" in `properties-with-tree-view.scss:237-475`, che riveste **entrambe**
le card (vedi §D10.1).

---

## D1 — Header della view (per U-1)

### Chi rende cosa

Non c'è un componente condiviso: ci sono **tre righe di intestazione sovrapposte**, di
tre proprietari diversi.

**Riga 1 — `PROPERTIES`** — `PropertiesWithTreeView.tsx:448-476`. Proprietario: l'host.
È presente **sempre**, per entrambe le card.

```
.properties-panel-header                       PropertiesWithTreeView.tsx:449
  i.bi-sliders                                 :453
  span "PROPERTIES"                            :454
  div.properties-panel-header__actions         :459   ← slot vuoto
  button.properties-panel-pin-btn              :460-468
  button.properties-panel-toggle-btn           :469-475
```

Il **pin è dell'host**, non della card: vale identico per astratta e view. Il
doppio click sull'header fa maximize/restore (`:450-451`).

**Riga 2 — card astratta** — `Info.tsx:892-916`, componente `PropertiesHeader`,
invocato a `Info.tsx:1296`:

```tsx
<div className="props-header">                          Info.tsx:905
    <div className="props-header__icon"><i className={`bi ${typeInfo.icon}`}/></div>   :906-908
    <span className="props-header__name">{data.name || 'Unnamed'}</span>               :909
    <span className={`jj-type-badge jj-type-badge--${badgeClass}`}>{badge}</span>      :910-912
    <HelpButton helpKey="properties-panel" />                                          :913
</div>
```

**Riga 2 — card view** — `ViewData.tsx:222-230`, markup inline, nessun componente:

```tsx
<div className="props-header props-header--view">                    ViewData.tsx:222
    {headerSlot ? createPortal(headerActions, headerSlot) : headerActions}   :223
    <div className="path-list">
        <div className="path-element">{U.cropStr(view.name, 1, 1, 10, 10)}</div>   :225
    </div>
    <span className={`jj-type-badge ${isVP ? '--viewpoint' : '--view'}`}>VIEW</span>  :227-229
</div>
```

### Conseguenze operative per U-1

1. **`props-header__icon` e `props-header__name` hanno UN SOLO call site ciascuno**:
   `Info.tsx:906` e `Info.tsx:909`. Verificato con `grep -rn "props-header" --include='*.tsx'`
   → 4 occorrenze totali, tutte elencate sopra. La view **non li usa**: al loro posto ha
   `.path-list > .path-element`.
   → Uniformare la view sul modello `props-header` significa **aggiungere** l'uso di
   quelle classi in `ViewData.tsx`, non modificarle. Il CSS base
   (`info-improvements.scss:865-915`) resta must-not-touch senza eccezioni.

2. **Il titolo "centrato" osservato a DOM non è centrato via CSS**: `.props-header` è
   `display:flex; gap:8px` (`info-improvements.scss:865-878`), e il `.path-list` prende
   `flex: 1 1 auto` (`nestedView.scss:3698`). L'effetto centrato dipende dalla larghezza
   del contenuto fra back-portalato (a sinistra) e chip VIEW (`margin-left:auto`,
   `properties-with-tree-view.scss:336`). Non c'è nessuna regola `justify-content:center`
   da rimuovere.

3. **Back e help della view vivono nella riga 1, per portal** — `ViewData.tsx:201-213`:

```tsx
const [headerSlot, setHeaderSlot] = useState<HTMLElement|null>(null);
useEffect(() => {
    setHeaderSlot(document.querySelector<HTMLElement>('.properties-panel-header__actions'));
}, []);                                                          ViewData.tsx:202-204
const headerActions = (<>
    <CommandBar><Btn icon={'back'} action={() => props.setSelectedView(undefined)} tip={'Back'}/></CommandBar>
    <HelpButton helpKey="properties-panel" />
</>);                                                            ViewData.tsx:206-213
```

   **Rischi registrati su questo meccanismo** (nessuno da risolvere qui):
   - `document.querySelector` è **globale**, non scoped al proprio container. Con due
     `PropertiesWithTreeView` montati contemporaneamente il portal atterrerebbe nel primo.
   - Il lookup gira **una sola volta** (`[]` come deps): se l'header si rimontasse, lo slot
     resterebbe uno stale node.
   - Il fallback inline (`headerSlot ? portal : headerActions`) è quello che rende il
     pannello usabile fuori dall'host (`NestedView`).

4. **Il back non ha stack di navigazione.** `props.setSelectedView` è
   `clearSelection` di `Info.tsx:1189-1198`: azzera la tripla `_lastSelected`
   (`node:'', view:'', modelElement:''`) e ri-targetta il pin. È un "chiudi", non
   un "indietro". Il glifo `back` viene da `CommandBar`, e la sua cornice è
   neutralizzata card-scoped (`properties-with-tree-view.scss:303`).

5. **Asimmetria help.** L'astratta ha `HelpButton` **dentro** `.props-header`
   (`Info.tsx:913`); la view lo ha **nella riga PROPERTIES** (portalato). Stesso
   `helpKey="properties-panel"`, stesso componente (`HelpButton.tsx:13-32`, dispatch di
   `JjodelEvents.HELP_OPEN`). U-1, se porta il back nella riga PROPERTIES solo per la
   view, deve decidere dove finisce l'help dell'astratta: oggi sono in due righe diverse.

6. **Il badge non è lo stesso oggetto.** `Info.tsx` sceglie il modificatore da
   `getElementTypeInfo` (`Info.tsx:862-889`, 12 casi) + override Model/Metamodel
   (`:897-902`); la view ha due soli valori hardcoded (`ViewData.tsx:227-229`).
   I modificatori `--view` / `--viewpoint` sono definiti in `nestedView.scss:3709-3710`,
   **non** in `_form-system.scss` (che ne definisce altri 9, righe 1251-1259) — la nota
   a `nestedView.scss:3657-3658` lo dichiara esplicitamente come scelta additiva.

---

## D2 — Breadcrumb `jj-context-bar` (per U-2)

### API: non esiste

`jj-context-bar` **non ha un componente**. È markup inline in un solo punto —
`Info.tsx:1299-1317` — e la sua unica altra occorrenza nel repo è il CSS
(`_form-system.scss:1197-1239`). Verificato:
`grep -rn "jj-context-bar"` → `Info.tsx`, `_form-system.scss`. Nient'altro.

Struttura resa:

```tsx
{breadcrumbParts.length > 1 && (
  <div className="jj-context-bar">                                  Info.tsx:1300
    {breadcrumbParts.map((part, i) => {
      const isCurrent = i === breadcrumbParts.length - 1;            :1302
      return (<React.Fragment key={i}>
        {i > 0 && <span className="jj-context-bar__sep">›</span>}    :1305
        <span className={`jj-context-bar__segment${isCurrent ? ' jj-context-bar__segment--current' : ''}`}
              onClick={!isCurrent ? () => handleBreadcrumbClick(part.elementId) : undefined}>   :1306-1309
          <i className={`bi ${part.icon}`} />{part.name}             :1310-1311
        </span>
      </React.Fragment>);
    })}
  </div>
)}
```

Contratto dei dati: `Array<{ name: string; icon: string; elementId?: string }>`,
costruito a `Info.tsx:1266-1279` risalendo **al massimo due livelli** di `father`
(nonno + padre + sé), dentro un `try/catch` silenzioso (`:1279`).

**Stato "corrente"**: sì, esiste — `--current` (`_form-system.scss:1226-1234`):
`cursor:default`, `color:#334155`, `font-weight:500`, hover neutralizzato. È l'unico
modificatore. Non c'è alcuno stato "active/non active" tipo chip: quello è un altro
oggetto, `.jj-viewpoint-row__state` (`viewParenting.scss:35-49`), che vive nel campo
Viewpoint, non nella breadcrumb.

**Visibilità condizionata**: la barra è resa solo con `breadcrumbParts.length > 1`
(`Info.tsx:1299`). Un elemento senza padre (es. un `DModel` radice) non la mostra affatto.

### Dati disponibili nel punto di rendering del pannello view

Sono **quasi** tutti già a portata di mano, ma non nella stessa forma.

`readViewParenting(state, view.id)` — `viewParentingOptions.ts:46-83` — ritorna:

```ts
export interface ViewParentingFacts {
    viewpointId?: string;      // d.viewpoint (campo persistito)   :48-49
    viewpointName?: string;    // idlookup[viewpointId].name       :70
    fatherId?: string;         // d.father                        :50-51
    detached: boolean;         // !fatherId                       :79
    parentOptions: ParentOption[];
    descendantCount: number;
}
```

Quindi per `viewpoint › parent › view`:
- **viewpoint**: `viewpointName` ✅ disponibile;
- **parent**: `fatherId` ✅ disponibile, **il nome no** — serve un `state.idlookup[fatherId]?.name`
  che oggi `readViewParenting` non calcola. È una riga, ma è un'aggiunta all'interfaccia
  esportata `ViewParentingFacts` (CLAUDE.md regola 11: solo proprietà opzionali);
- **questa view**: `view.name` ✅, già usato a `ViewData.tsx:225`.

**Attenzione alla sorgente del viewpoint** — sono due, e non coincidono per costruzione:

| sorgente | dove | semantica |
|---|---|---|
| `d.viewpoint` (persistito, denormalizzato) | `viewParentingOptions.ts:48-49` | quello che il **resolver IR** legge; è quello che la riga read-only mostra (D-4-1) |
| `get_viewpoint(c)` (calcolato) | `view.tsx:1436-1453` | risale la catena `father` fino alla radice, con visited set |

D-4-2 ha reso riga e lista coerenti **perché leggono lo stesso campo**. Una breadcrumb
che usasse `get_viewpoint` reintrodurrebbe la possibilità che riga e breadcrumb si
contraddicano su dati legacy divergenti. → **La Fase 2 deve leggere `readViewParenting`**,
non i getter del proxy.

C'è anche `get_fatherChain` (`view.tsx:1414-1431`), che darebbe la catena completa
(non solo due livelli) e ha già il visited set anti-ciclo delle voci 5. È l'unico modo
per una breadcrumb a profondità arbitraria, ma legge il proxy, non `d.viewpoint`.

### Write path di Viewpoint e Parent view — il doppio writer è risolto, non mascherato

Verificato a codice, non per fiducia nel log:

- **Viewpoint**: `ViewParentingFields.tsx:84-94`. È `<div className="jj-viewpoint-row">`
  con `<span>{facts.viewpointName || 'none'}</span>` + chip active/not active. **Zero
  handler, zero scrittura.** Non è un select disabilitato: è testo.
- **Move to viewpoint…**: `ViewParentingFields.tsx:96-129`. `confirmMove` (`:71-77`)
  scrive `(view as any).father = moveTarget` — cioè **lo stesso identico path** del
  select Parent view, come dichiara il commento a `:73-74`.
- **Parent view**: `ViewParentingFields.tsx:138-145`. `<Select data={view} field={'father'} .../>`
  — binding `joiner`, quindi `set_father`, unico writer.

**Conclusione**: i writer di `father` sono **due call site di una sola API**
(`view.father = …`), non due semantiche concorrenti. Il difetto R-H (2026-08-06) — due
select che scrivevano lo stesso campo con significati diversi — è **realmente chiuso**,
non nascosto in lettura. `LViewElement.set_viewpoint` resta un no-op che logga
(`view.tsx:1457-1459`), coerente con D-4-1.

**Un solo componente per due host** — `ViewParentingFields` è montato da:
- `irTabs.tsx:123` (dentro `IRIdentityFields`, corpo IR `Applies to`);
- `InfoData.tsx:299` (tab Apply-to legacy).

→ Flag §D10: qualunque modifica a questo blocco tocca **entrambe** le superfici.

---

## D3 — Titoli di sezione nei tab (per U-3)

### Tre meccanismi diversi, nello stesso pannello

| Meccanismo | Componente | Dove | Tab |
|---|---|---|---|
| `FormSection` | `ui/FormSection` | `VertexAuthoringPanel.tsx:296,311,327,343,356,381,397,405,419` | Structure, Appearance, Text, Source (solo vertex) |
| `div.jj-field-label` usato come titolo | nessuno | `EdgeAuthoringPanel.tsx:448,469,600,645,705,728,756`; `RowAuthoringPanel.tsx:264,283,363,408`; `MatchingSection.tsx:75`; `EnableIRPanel.tsx:71,111` | Applies to (tutti i kind), tutto Edge, tutto Row |
| `props-section__title` dentro `CollapsibleSection` | locale a `Info.tsx:36-61` | `Info.tsx:49` | card astratta (solo) |

`FormSection` ha **9 call site nel pannello view**, tutti in `VertexAuthoringPanel`, più
2 in `ui/examples/FormExample.tsx`. Verificato con `grep -rn "<FormSection"`.
`RowAuthoringPanel` e `EdgeAuthoringPanel` **non lo importano affatto**.

### Censimento tipografico reale (valori risolti)

Dentro la card, cioè sotto `.properties-panel-container`:

| ruolo | classe | size | weight | transform | letter-spacing | colore | file:riga |
|---|---|---|---|---|---|---|---|
| titolo sezione astratta | `.props-section__title` | **13px** | 500 `!important` | uppercase | 0.5px | `var(--text-muted)` | `info-improvements.scss:940-947` |
| titolo sezione `FormSection` | `.title` (CSS module) | **12px** | **700** | uppercase | **0.07em** | `#64748b` | `FormSection.module.css:13-20` |
| titolo di sezione in Applies to / Edge / Row | `.jj-field-label` | **14px** | 500 | *nessuna* | *nessuna* | `#64748b` | base `_form-system.scss:951-959`, **override card** `properties-with-tree-view.scss:372-375` |
| label di campo | `.jj-field-label` | **14px** | 500 | — | — | `#64748b` | *stessa regola della riga sopra* |
| helper inline | `.jj-field > p` (HelpText) | **13px** | — | — | — | `#94a3b8` | `properties-with-tree-view.scss:431-437` |
| hint legacy | `.jj-field-hint` | 11px | — | — | — | `#94a3b8` | `_form-system.scss:968-973` |

**Il finding che conta per U-3**: in `Applies to` (e in tutto il pannello Edge e Row) il
titolo di sezione e la label di campo sono **la stessa identica classe con gli stessi
identici valori**. Non c'è alcuna gerarchia tipografica da correggere: c'è una gerarchia
**assente**. `Matching` (`MatchingSection.tsx:75`) e `Metaclassi`
(`MatchingSection.tsx:80`) sono indistinguibili a CSS; li distingue solo il `marginTop`
inline (4px vs 8px) e la nidificazione DOM.

Secondo finding: nella card astratta il titolo di sezione (13px) è **più piccolo** delle
label di campo (14px), perché la skin B4 alza `jj-field-label` ma non tocca
`props-section__title`. L'inversione è già a HEAD, non la introduce U-3.

### `props-section__title` è estraibile?

**Sì, ed è già di fatto disaccoppiato.** La regola CSS
(`info-improvements.scss:940-947`) è una classe piatta: non è annidata dentro
`.props-section__header`, non usa selettori discendenti, non ha pseudo-elementi.
Il bottone accordion è un fratello di markup, non un ancestor:

```tsx
<div className="props-section__header-row">                 Info.tsx:42
  <button className="props-section__header" ...>            :43-51
    <span className="props-section__title">{title}</span>   :49
    <i className="... props-section__chevron ..." />        :50
  </button>
  {headerRight && <div className="props-section__header-right" ...>}   :52
</div>
```

Uno `<span class="props-section__title">` fuori dal bottone eredita gli stessi valori.
**Precedente già in repo**: `viewoptions.scss:852-862` replica quei valori a mano su
`h5` per il tab Options ("→ match the metaclass `.props-section__title`"), con un commento
che lo dichiara. Cioè: la duplicazione per copia è già la prassi locale, e un mixin
condiviso sarebbe la prima estrazione reale. Da decidere in Fase 2, non qui.

Il tema dark di quella classe è a `info-improvements.scss:826-828` (`color: #94a3b8`).

---

## D4 — Segmented Fixed/Conditional (per U-6)

### Chi lo rende

`ConditionalEditor` — `frontend/src/components/ui/ConditionalEditor/ConditionalEditor.tsx:87-104`.
Due `<button>` in un `<div role="group" aria-label="Value mode">`, styled da
`ConditionalEditor.module.css:12-66`. **Non** usa il primitivo `SegmentedControl`.

**Il primitivo `SegmentedControl` ha zero consumatori**: `grep -rn "SegmentedControl"`
restituisce solo la sua definizione e i due barrel export
(`ui/index.ts:25-26`, `ui/SegmentedControl/index.ts:1-2`). Confermato quanto dichiarato
nel discovery del 2026-08-08 sul segmented: il primitivo è consegnato ma non wired.

### Call site di `ConditionalEditor` — 11, tutti nel pannello view

```
FieldCompartmentListEditor.tsx:252   (Visible di un compartment)
LabelEntryEditor.tsx:94              (Visible di una label)
BadgeListEditor.tsx:65               (Icon di un badge)
BadgeListEditor.tsx:92               (Visible di un badge)
VertexAuthoringPanel.tsx:313         (Shape → form)
VertexAuthoringPanel.tsx:329         (Fill)
EdgeAuthoringPanel.tsx:648           (Linea → Colore)
EdgeAuthoringPanel.tsx:660           (Linea → Spessore)
EdgeAuthoringPanel.tsx:672           (Linea → Tratto)
RowAuthoringPanel.tsx:386            (Visible della row)
TextStyleEditor.tsx:116              (campi di stile testo)
```

**Nessun call site fuori dal pannello view.** `Info.tsx` non lo importa
(`Info.tsx:31` importa `Button, EmptyState, Toggle, NumberInput, JjSelect`).
→ **Un restyle di `ConditionalEditor.module.css` non tocca la card astratta.**

Il segmento non è sempre reso: con `allowConditional={false}` (modalità Basic) il
controllo **sparisce** e resta il solo editor del valore (`ConditionalEditor.tsx:64-73`).
Passano `allowConditional={advanced}` solo `VertexAuthoringPanel.tsx:321,337,411` e
`LabelEntryEditor` (via `LabelListEditor`). Gli altri 7 call site non lo passano →
default `true` (`:49`) → segmento sempre visibile anche in Basic.

### Distanza puntuale dalla spec D1

| proprietà | D1 (spec) | `ConditionalEditor.modeToggle/.modeOpt` | `SegmentedControl` (primitivo) |
|---|---|---|---|
| track background | slate-100 `#f1f5f9` | `#f1f5f9` ✅ | `var(--color-slate-100)` = `#f1f5f9` ✅ |
| track radius | **8** | **10px** ❌ (`:18`) | `var(--radius-md)` = 8px ✅ |
| track padding | **2** | **3px** ❌ (`:17`) | `var(--spacing-1)`… no: **2px** ✅ (`:15`) |
| track gap | **2** | **1px** ❌ (`:16`) | 2px ✅ (`:13`) |
| `flex-wrap: wrap` | richiesto | **assente** ❌ | ✅ (`:8`) |
| `width: fit-content` | richiesto | **assente** (`inline-flex` + `align-self:flex-start`) ⚠️ | ✅ (`:9`) |
| `max-width: 100%` | richiesto | **assente** ❌ | ✅ (`:10`) |
| pillola selezionata | bianca | `#ffffff` ✅ (`:43`) | `#ffffff` ✅ (`:55`) |
| ombra pillola | `0 1px 2px rgba(15,23,42,.14)` | `0 1px 2px rgba(15,23,42,0.1)` ❌ (**.10 anziché .14**) (`:45`) | `…0.14` ✅ (`:58`) |
| testo selezionato | slate-900, peso 600 | **`#0284c7` (cyan-600)**, peso 600 ❌ | `var(--color-slate-900)` = `#0f172a` ✅ |
| cyan | solo al glifo | **è il testo**, e non c'è glifo ❌ | solo `.segmentIcon` ✅ |
| radius segmento | — | 8px (`:33`) | `var(--radius-base)` = 6px |
| padding segmento | — | `4px 10px` (`:32`) | `var(--spacing-1) var(--spacing-3)` = `4px 12px` |
| font | — | 12px / 600 / ls 0.2px (`:28-30`) | `--font-size-sm` 12px / `--font-weight-medium` 500 |
| focus ring | slate `rgba(51,65,85,.18)` | **assente** ❌ | ✅ (`:47-52`) |
| tastiera (frecce/Home/End) | — | **assente** | ✅ (`:65-87`) |
| ruolo ARIA | — | `group` + `aria-pressed` | `radiogroup` + `radio` + `aria-checked` |

**Nota di sistema, non banale.** Il commento a `ConditionalEditor.module.css:7-11`
dichiara che questo controllo è "della stessa famiglia" dello switch Basic|Advanced
dell'app bar. Verificato: `navbar.scss:2111-2145` ha **la stessa geometria**
(gap 1, padding 3, radius 10/8, 12px/600/0.2px) ma testo attivo **`#1e293b` slate-800**,
non cyan. Cioè le due copie sono **già divergenti sul colore** e il commento è stale.
Portare `ConditionalEditor` alla spec D1 lo allontana da `.appbar-mode-switch`: è una
decisione da prendere consapevolmente (vedi Q3).

**Deviazione del primitivo dalla spec**: `SegmentedControl.module.css:63` usa
`var(--color-cyan-500)`, che in `tokens.css:33` vale **`#06b6d4`**, non il `#0ea5e9`
del design system (§7.1). Il glifo cyan del primitivo è quindi di un cyan diverso da
quello usato ovunque nel pannello (`.view-editor-tab.active`, `$pc-accent`).

---

## D5 — Stepper (per U-5)

### Stesso componente, due wrapper

**Un solo componente**: `frontend/src/components/ui/NumberInput/NumberInput.tsx`.

- **Card astratta**: wrappato in `PropertiesNumberInput` (`Info.tsx:151-163`), che legge
  `(data as any)[field]` e normalizza con `typeof rawValue === 'number' ? rawValue : parseInt(rawValue) || 0`
  (`:154`) — quindi **non produce mai `undefined`**. Call site: `Info.tsx:444` (Lower),
  `:448` (Upper), `:520` (Ordinal).
- **Card view**: usato direttamente. Call site: `MatchingSection.tsx:144` (Priorità),
  `RowAuthoringPanel.tsx:349` (Priorità), `EdgeAuthoringPanel.tsx:567` (Priorità),
  `EdgeAuthoringPanel.tsx:663` (Spessore, dentro `ConditionalEditor`),
  `VertexAuthoringPanel.tsx:348` (Border → Width).

Skin comune: la regola strutturale `properties-with-tree-view.scss:401-422`
(`.jj-field > div:has(> button:not([role="checkbox"]) + input)`) riveste **entrambi** —
border slate-200, radius 12, input 15px/600 centrato, bottoni 38px. Il CSS module resta
`NumberInput.module.css` (wrapper 96px fisso, `:9-10`).

### Perché la casella risulta vuota — NON riprodotto a codice

Tracciati tutti i path che alimentano i due controlli citati:

**Priorità (IR)** — `MatchingSection.tsx:144-147`, identico in Row (`:349-352`) ed Edge (`:567-570`):
```tsx
<NumberInput value={draft.priority ?? 0} onChange={(n) => patch({ ...draft, priority: n })} />
```
`?? 0` copre `null` e `undefined`. Il valore reso è **`0`**, non vuoto.

**Width (bordo del vertex)** — `VertexAuthoringPanel.tsx:348`:
```tsx
<NumberInput value={border.width} min={0} onChange={(w) => patchBorder({ width: w })} />
```
con `const border = shape.border ?? DEFAULT_BORDER` (`:239`) e
`DEFAULT_BORDER = { color:'#334155', width: 1, style:'solid' }` (`:46`).
`defaultObjectViewIR()` **non emette affatto la chiave `border`** (`irDefaults.ts:38-43`),
quindi il ramo che si attiva è il fallback: il valore reso è **`1`**.
`patchBorder` (`:247-250`) fa sempre spread su `DEFAULT_BORDER`, quindi `width` non può
diventare `undefined` per via della UI. Solo dati legacy/editati a mano con un
`shape.border` parziale produrrebbero `value={undefined}` → input non controllato → casella vuota.

**L'unico controllo del pannello Properties che rende genuinamente una casella vuota con
placeholder** è il campo **Priority del tab Apply-to legacy** — `InfoData.tsx:244-253`:
```tsx
getter={(data) => { let v = data.__raw.explicitApplicationPriority; return v === undefined ? v : ''+v; }}
placeholder={'automatic: ' + view.explicitApplicationPriority}
```
Ma quello **non è uno stepper** (è un `Input type=number` di `joiner`) e **non è nel
pannello a cinque tab**: `InfoData` è montato solo per view **senza** `ir`
(`ViewData.tsx:106-119`).

→ Vedi **Q1** nelle domande aperte. Applico CLAUDE.md §5 ("do not trust fixtures from
memory across sessions"): non costruisco una Fase 2 su uno stato che non riesco a
riprodurre dal codice.

### Default effettivi (file:riga, non supposizioni)

**Priorità — cosa usa il resolver quando `priority` è assente: `0`.**
Non c'è un default "automatico" o derivato. La compile lo materializza in tre punti,
uno per kind:
```
irCompile.ts:322   priority: typeof ir.priority === 'number' ? ir.priority : 0,   // vertex
irCompile.ts:386   priority: typeof ir.priority === 'number' ? ir.priority : 0,   // row
irCompile.ts:446   priority: typeof ir.priority === 'number' ? ir.priority : 0,   // edge
```
Il tipo lo dichiara: `irTypes.ts:316-317` e `:337-338`, «Explicit priority (0 when absent)».
L'ordinamento lo consuma a `irResolveCore.ts:39` (`b.…priority - a.…priority`, poi
specificità, poi `declarationIndex`).
→ **Il placeholder corretto per U-5 su Priorità è `0`.** Coincide col valore già mostrato:
su questo campo U-5 non ha nulla da correggere, a meno che Q1 non riveli altro.

**Border width — cosa applica il renderer quando `shape.border.width` è assente: `1`.**
`IRNodeContent.tsx:166`:
```tsx
if (b && !isDiamond) inlineStyle.border = `${b.width ?? 1}px ${b.style ?? 'solid'} ${b.color ?? 'var(--border-default)'}`;
```
e per il rombo, `IRNodeContent.tsx:174`: `const svgStrokeWidth = compiled.border?.width ?? 1;`.
Quando `compiled.border` è **null** (nessun bordo autorato) non si applica alcuno stile
inline e vale il bordo CSS della box: `irStyle.ts:44`,
`.ir-node-content { border: 1px solid var(--border-default) }` → **anche lì 1px**.
→ **Il placeholder corretto per U-5 su Width è `1`**, coerente su tutti e tre i rami.

**Spessore della linea edge**: `irCompile.ts:395`,
`lineWidth: e.line?.width !== undefined ? compileConditional(e.line.width, 1, deps) : null` →
default **1** anche qui; lato UI il `ConditionalEditor` passa già `defaultValue={1}`
(`EdgeAuthoringPanel.tsx:665`), quindi la casella mostra `1`.

**Limite noto di `NumberInput` rilevante per U-5**: `handleInput` (`NumberInput.tsx:36-43`)
ignora ogni input non parsabile e ogni valore fuori range — non chiama `onChange`, e il
componente è controllato. Conseguenza: **l'utente non può svuotare la casella**, quindi
un "placeholder al posto del default" richiede o un valore sentinella o un cambio di API
del primitivo (che ha 5 call site nella view + 3 nell'astratta: §D10).

---

## D6 — Doppia label dei toggle (per U-7)

### Da dove viene la seconda riga

Non è né `children` né una prop dedicata all'helper: è la **prop `label` del `Toggle`**
(`ui/Toggle/Toggle.tsx:36`, resa a `:105-116` dentro `.labelWrapper`), messa **sotto** una
`<label className="jj-field-label">` che dice quasi la stessa cosa. È una convenzione
ripetuta a mano, file per file.

Occorrenze nel pannello view (label di campo → label del Toggle):

| file:riga (campo) | testo campo | file:riga (toggle) | testo toggle |
|---|---|---|---|
| `LabelEntryEditor.tsx:78` | `Editable` | `:84` | `editable inline` |
| `LabelEntryEditor.tsx:93` | `Visible` | `:97` | `visible` |
| `FieldSegmentEditor.tsx` (nessuna label di campo) | — | `:70` | `editable inline` |
| `FieldCompartmentListEditor.tsx:241` | `Separator` | `:246` | `row separators` |
| `FieldCompartmentListEditor.tsx:251` | `Visible` | `:255` | `visible` |
| `FieldCompartmentListEditor.tsx:194` | `Filtro children` | `:203` | `filtra per metaclasse (isKind)` |
| `BadgeListEditor.tsx:91` | `Visible` | `:95` | `visible` |
| `RowAuthoringPanel.tsx:385` | `Visible` | `:389` | `visible` |
| `MatchingSection.tsx:80` | `Metaclassi` | `:84` | `Tutte le metaclassi (*)` |
| `MatchingSection.tsx:118` | `Condizione` | `:122` | `Applica solo se (predicate)` |
| `MatchingSection.tsx:153` | `Esclusiva` | `:157` | `exclusive` |
| `RowAuthoringPanel.tsx:285` | `Metaclassi` | `:289` | `Tutte le metaclassi (*)` |
| `RowAuthoringPanel.tsx:323` | `Condizione` | `:327` | `Applica solo se (predicate)` |
| `EdgeAuthoringPanel.tsx:471` | `Metaclasse sorgente` / `dell'oggetto` | `:475` | `Tutte le metaclassi (*)` |
| `EdgeAuthoringPanel.tsx:539` | `Condizione` | `:543` | `Applica solo se (predicate)` |
| `EdgeAuthoringPanel.tsx` (nessuna label) | — | `:733` | `Label al centro` |
| `ConditionalEditor.tsx:129` (interno) | — | — | `Include else branch` |

**16 occorrenze di doppia label**, più 3 casi in cui la label del Toggle è l'**unica**
(FieldSegmentEditor, Label al centro, Include else branch) — su quelli U-7 non deve
togliere nulla, pena perdere il nome del controllo.

Le coppie non sono tutte ridondanti allo stesso modo. Tre classi:
1. **ridondanza pura** — `Visible`/`visible`, `Editable`/`editable inline` (5 casi);
2. **ridondanza parziale** — `Separator`/`row separators`, `Filtro children`/`filtra per metaclasse (isKind)`;
3. **la seconda label porta informazione che la prima non ha** — `Metaclassi`/`Tutte le metaclassi (*)`,
   `Condizione`/`Applica solo se (predicate)`, `Esclusiva`/`exclusive`. Qui il toggle
   commuta un **modo** (wildcard vs lista, con vs senza predicate) e la sua label lo dice.
   Rimuoverla senza riscrivere la label di campo perde significato.

### `jj-toggle-row` — supporta label + helper senza seconda label?

Sì, ed **è già il pattern della card astratta**, che quindi non ha il problema:

```tsx
<div className="jj-toggle-row" onClick={handleRowClick}>            Info.tsx:93
    <span className="jj-toggle-row__label">                         :94
        {label}
        {badge && <span className="jj-toggle-row__badge">{badge}</span>}   :96
        {tooltip && <InfoTooltip text={tooltip} />}                  :97
    </span>
    <Toggle checked={value} onChange={handleChange} size="xs" />     :99   ← nessuna prop label
</div>
```

CSS: `_form-system.scss:1174-1194` (`display:flex; justify-content:space-between`),
label a 13px/`#334155`.

**Il pannello view non usa quasi mai `jj-toggle-row`**: `grep -rn "jj-toggle-row"` →
`Info.tsx`, `InfoData.tsx` (`:159`, `:179`), `NodeData.tsx`, più i due SCSS. **Zero**
occorrenze nei pannelli di authoring IR. Lì il layout è `.jj-field` + `<label>` + `<Toggle label>`
in colonna.

Il `Toggle` ha anche una prop `description` (`Toggle.tsx:41`, resa a `:112-114` come
`.description` sotto la label) **mai usata in tutto il repo** — sarebbe il canale
"helper del toggle" già disponibile senza aggiungere API.

→ Per U-7 esistono due strade già supportate dal codice: (a) portare i toggle IR su
`jj-toggle-row` (uniforma con l'astratta, ma cambia il layout da colonna a riga e va
verificato su 16 punti); (b) togliere la prop `label` e lasciare solo `jj-field-label`
(minimo diff, ma i 3 casi della classe 3 perdono informazione). Decisione di Fase 2.

---

## D7 — Sistemi di aiuto (per U-4)

### Tre sistemi coesistono nel pannello view

**1. `InfoTooltip` (ⓘ) — hover tooltip inline.** Non è un componente condiviso: è
**duplicato per copia in 4 file**, ciascuno con la propria definizione locale, e nessuno
lo esporta. Verificato con `grep -rln "function InfoTooltip"`:

```
components/editors/Info.tsx:64-75
components/editors/views/data/InfoData.tsx:33-44
components/editor-v2/viewpoint/authoring/irTabs.tsx:66-77
components/viewParenting/ViewParentingFields.tsx:33-44
```

Le quattro copie sono **identiche** (span `.jj-info-icon-wrapper` > `.jj-info-icon` "i",
+ `.jj-info-tooltip` su hover). CSS in `info-improvements.scss:975-1000`. Le copie 3 e 4
portano un commento che dichiara la duplicazione come voluta (vincolo di scope).

**Call site nel pannello view IR** (i tre "campi R-H" del prompt, confermati — non ce ne sono altri):

| file:riga | campo | testo |
|---|---|---|
| `irTabs.tsx:114` | Name | «Display name of this view» |
| `ViewParentingFields.tsx:87` | Viewpoint | «The viewpoint this view is filed under. It follows the parent — use Move to viewpoint to change it.» |
| `ViewParentingFields.tsx:136` | Parent view | «Inherit settings from a parent view. The root entry files this view directly under its viewpoint.» |

**Call site nel tab Apply-to legacy** (`InfoData.tsx`, **non** nel pannello a cinque tab,
ma condivide `ViewParentingFields`): 10 — righe 153, 162, 182, 197, 204, 211, 230, 242, 260, 283.

**Call site nella card astratta**: **3**, tutti via la prop `tooltip` di
`PropertiesToggle` (`Info.tsx:97`, che rende `<InfoTooltip>`):
- `Info.tsx:115-116` Abstract — «Cannot be instantiated directly; must be subclassed»
- `Info.tsx:118-119` Interface — «Defines a contract without implementation»
- `Info.tsx:134-135` Allow cross-extend — «Allows extending classifiers from other metamodels»

→ **Misura per una futura conversione dell'astratta: 3 ⓘ.** È piccola. `PropertiesToggle`
è il solo consumatore, quindi la conversione è un cambio in un solo componente locale.

**2. `HelpText` — helper inline grigio.** `frontend/src/components/ui/HelpText/HelpText.tsx`.
API: `{ children, icon?: boolean = true, className?, id? }`. Rende un `<p>` con
un `<i class="bi bi-info-circle">` opzionale + `<span>`.

**Finding non ovvio e determinante per U-4**: dentro la card il glifo ⓘ di `HelpText`
è **nascosto via CSS**, quindi l'helper è già "solo testo":

```scss
// properties-with-tree-view.scss:444-446
p > i.bi-info-circle { display: none; }
```
con il commento (`:439-443`): «The (i) glyph is dropped inside the card: in the mockup a
hint is a quiet line of text, not an annotated callout». Regola card-scoped: fuori dalla
card `HelpText` conserva l'icona. Un solo call site passa `icon={false}` esplicitamente
(`VertexAuthoringPanel.tsx:366`), ridondante rispetto alla regola CSS.

Stile risolto in card: `properties-with-tree-view.scss:431-437` — `margin-left: 26px`
(`$pc-hint-indent`, allineamento sulla colonna della label), `max-width: 290px`,
13px, line-height 1.5, `#94a3b8`. Base fuori card: `HelpText.module.css:5-14`.

Densità d'uso: `HelpText` compare **~30 volte** nei soli pannelli IR (Matching 5, Vertex 2,
Row 5, Edge 14, EnableIRPanel 5, FieldCompartmentListEditor 2, BadgeListEditor 1).

**3. `HelpButton` — drawer contestuale.** `components/HelpButton.tsx:13-32`, dispatch di
`JjodelEvents.HELP_OPEN`. Due call site, **stesso `helpKey`**: `Info.tsx:913` (astratta,
dentro `.props-header`) e `ViewData.tsx:211` (view, portalato nella riga PROPERTIES).

→ U-4 ("helper inline come unico sistema di aiuto nel pannello view") ha come bersaglio
concreto **le 3 ⓘ di `irTabs.tsx:114` e `ViewParentingFields.tsx:87,136`**. Attenzione:
`ViewParentingFields` è **condiviso** con il tab legacy (§D10.2), quindi togliere quelle
due ⓘ le toglie anche lì. `HelpButton` non è toccato da U-4 come l'ho letto.

---

## D8 — Empty state (per U-8)

### Il pattern "No X." + bottone dashed è UN componente condiviso

`frontend/src/components/ui/ListEditor/ListEditor.tsx`.

- messaggio vuoto: `:43-45`, `<div className={styles.empty}>{emptyHint}</div>`;
  stile `ListEditor.module.css:7-12` — 12px, `--color-text-tertiary`, **corsivo**;
- bottone: `:86-90`, `<button className={styles.addBtn}><i class="bi bi-plus-lg"/> {addLabel}</button>`;
  stile `ListEditor.module.css:104-125` — full-width, `1.5px dashed #cbd5e1`, radius 12,
  label `#0ea5e9` 15px/500, hover `#e0f2fe`.

**Il bottone è renderizzato indipendentemente dal fatto che la lista sia vuota**
(`:86` è fuori dal ramo `items.length === 0`): quindi il caso "vuoto" mostra **sia** il
messaggio **sia** l'azione. U-8 su queste liste è **già soddisfatto**.

Call site e testi:

| file:riga | `emptyHint` | `addLabel` |
|---|---|---|
| `FieldCompartmentListEditor.tsx:130-131` | `No compartments.` | `Add compartment` |
| `FieldCompartmentListEditor.tsx:225-226` (segments annidata) | `No segments.` | `Add segment` |
| `BadgeListEditor.tsx:57-58` | `No badges.` | `Add badge` |
| `LabelListEditor.tsx:59-60` | `No labels — the node renders without text.` | `Add label` |
| `RowAuthoringPanel.tsx:369-370` | `No segments — a row must render at least one segment.` | `Add segment` |

→ 5 call site, **nessun markup ripetuto**. La disomogeneità residua è solo redazionale:
tre `emptyHint` sono una frase secca ("No badges."), due spiegano la conseguenza.

### L'altro empty state, quello dell'astratta

`ui/EmptyState` (`EmptyState.tsx`) è un componente **diverso e più ricco**
(icona in cerchio, titolo, descrizione, `action` opzionale, `hints`). Nel pannello
Properties è usato **una sola volta**, da `components/editors/Empty.tsx:38` (nessun
elemento selezionato). Gli altri 6 call site sono `ProjectEditor.tsx` e `DocumentationTab.tsx`.
→ **Non è il componente delle liste**, e non va confuso con esso in Fase 2.

Terzo empty state, ancora diverso: `.props-empty-state`
(`Info.tsx:1331`, CSS `info-improvements.scss:1324-1330` — 12px, `#94a3b8`, centrato,
corsivo). Unico call site: «No custom state defined».
Quarti: `.jj-contents-empty` («No classes yet» ecc., `Info.tsx:249,277,304`) e
`.jj-slot-empty` («No values», «No slots defined», `Info.tsx:816,584`).

### ADVANCED STATE — U-8 decade

`Info.tsx:1328-1338`:
```tsx
{advanced && (
  <CollapsibleSection title="ADVANCED STATE" defaultOpen={false}>
    {!ddata || Object.keys(ddata._state).length === 0
      ? <div className="props-empty-state">No custom state defined</div>
      : <div className="object-state" …><JsonViewer src={ddata._state} collapsed={1} name={"state"} /></div>}
  </CollapsibleSection>
)}
```

**Non esiste alcun flusso UI di aggiunta di custom state.** Il contenuto è un
`JsonViewer` in sola lettura. Verificati tutti gli scrittori di `_state` nel repo
(`grep -rn "'_state'"`):
- `joiner/classes.ts:2173` (reset a `{}`), `:2239-2240` (`set_state`, il setter del proxy);
- `components/project/ProjectEditor.tsx:1699` (una `SetFieldAction` mirata su un `DModel`);
- `common/Dummy.ts:649` (dispatch interno).

Nessuno di questi è raggiungibile dalla card. → **U-8 non si applica ad ADVANCED STATE**:
non c'è un'azione da offrire. Dichiararlo esplicitamente in Fase 2, come chiede il prompt.

Per contrasto, gli empty state di `MetamodelContents` («No classes yet», `Info.tsx:249`)
**hanno** un'azione — ma è fuori dal blocco vuoto, nell'header di gruppo
(`Info.tsx:231` `+ Add`, `:260`, `:288`). Lì U-8 sarebbe una ricollocazione, non
un'aggiunta.

---

## D9 — Inventario lingua italiana del pannello view (per la pass R-4)

Solo inventario. **La traduzione non è nella Fase 2 né nel suo primo commit.**
Le label dei cinque tab sono già in inglese (`irTabs.tsx:27-33`).

### `MatchingSection.tsx` (Applies to del vertex) — 11

| riga | stringa | ruolo |
|---|---|---|
| 76 | «Questi campi decidono quando la view si applica; per le view IR sostituiscono il tab Apply-to, che su di esse non ha effetto.» | HelpText |
| 80 | `Metaclassi` | label |
| 84 | `Tutte le metaclassi (*)` | toggle |
| 95 | `Rimuovi` | title |
| 101 | «Con la lista vuota la view non si applica a nulla.» | HelpText |
| 107 | `Aggiungi metaclasse…` | placeholder |
| 113 | «Cambiare metaclasse non invalida i path già scritti nei predicate o nei campi condizionali; …» | HelpText |
| 118 | `Condizione` | label |
| 122 | `Applica solo se (predicate)` | toggle |
| 137 | «Senza predicate la view si applica a ogni istanza delle metaclassi selezionate.» | HelpText |
| 143 | `Priorità` | label |
| 148 | «Vince la priorità più alta; a parità, la specificità (esatta > ereditata > wildcard), poi l'ordine di dichiarazione.» | HelpText |
| 153 | `Esclusiva` | label |
| 160 | «Le view decorative (exclusive disattivato) non sono ancora supportate dal resolver IR: …» | HelpText |

### `RowAuthoringPanel.tsx` — righe 265, 272, 285, 289, 300, 306, 312, 318, 323, 327, 342, 348, 353
(«Una row view rende un child…», `Metaclassi`, `Tutte le metaclassi (*)`, `Rimuovi`,
«Con la lista vuota la row view non si applica a nessun child.», `Aggiungi metaclasse…`,
«Le feature del PathBuilder si risolvono dalla prima metaclasse della lista.», `Condizione`,
`Applica solo se (predicate)`, «Senza predicate la row view…», `Priorità`, «Vince la priorità…»,
+ il messaggio di metaclasse ambigua a `:272`)

### `EdgeAuthoringPanel.tsx` — il file più italiano, 30+

righe **59-60** (`NATURE_OPTIONS`: «Reference (stila una reference M1)», «Object (oggetto reso come linea)»),
**53-55** (i tre hint costanti, incluso `ENDPOINT_ARRAY_ERROR`),
**360** `(qualsiasi reference)`, **450-451**, **458**, **471** (`Metaclasse sorgente` / `Metaclasse dell'oggetto`),
**475**, **483**, **486**, **496**, **503-504**, **510**, **516-518**, **527** (`Reference`), **533**,
**539**, **543**, **559-560**, **566** (`Priorità`), **571**, **585** (`Natura`), **591-593**,
**600** (`Capi`), **601**, **603** (`Capo sorgente`), **615** (`Capo destinazione`), **633-636**,
**645** (`Linea`), **647** (`Colore`), **659** (`Spessore`), **671** (`Tratto`), **692** («Manhattan (default)»),
**698-699**, **705** (`Terminazioni`), **707** (`Sorgente`), **715** (`Destinazione`), **733** (`Label al centro`), **748-749**.

Misto già presente nello stesso file: `LINE_STYLE_OPTIONS` (`:62-66`) e
`TERMINATION_OPTIONS` (`:76-83`) sono **in inglese**, le label dei campi che li ospitano
in italiano.

### `FieldCompartmentListEditor.tsx` — 4
righe 188 («sorgente non supportata: … (preservata)»), 194 (`Filtro children`),
196 («predicate avanzato (preservato)»), 202 («filtra per metaclasse (isKind)»),
236 («Le righe sono rese dalla row view di ciascun child…»).
Nello **stesso componente**, in inglese: `Id`, `Source`, `Row segments`, `Separator`,
`Visible`, `Add compartment`, `No compartments.`

### `EnableIRPanel.tsx` — 7
righe 72, 112, 127, 130, 132, 135, 137, 142 (`Abilita authoring IR`).
Non è nel pannello a cinque tab (è il tab `IR` delle view senza `ir`), ma è la stessa famiglia.

### `TextStyleEditor.tsx` — 2
riga 244 (`Colore`), 258 (`Rimuovi (Default)`). Più i nomi di riga citati nel commento a `:133`
(«Font, Dimensione, Peso, Stile, Colore»).

**Totale ordine di grandezza: ~75 stringhe utente in italiano nel pannello view**,
contro **0** nella card astratta (`Info.tsx` è interamente in inglese).

---

## D10 — Vincoli trasversali

### D10.1 — La skin B4 riveste ENTRAMBE le card ⚠️ FLAG PRINCIPALE

`properties-with-tree-view.scss:237-475` è un blocco ancorato su
`.properties-panel-container`. Quel container ospita, nello **stesso** `.properties-panel-body`:

```tsx
<div className="properties-panel-body">                PropertiesWithTreeView.tsx:477
    <Info mode={…} overrideSelected={…} … />           :478-482     ← astratta E view
    {advanced && <div className="properties-node-section"> … <NodeEditor/> … </div>}   :485-502
</div>
```

e `Info` a sua volta rende **o** la card astratta (`Info.tsx:1292-1351`) **o**, se la
selezione è una view/viewpoint, `ViewData` (`Info.tsx:1199-1217`).

→ **Ogni regola della skin B4 vale per tutte e due le card.** In particolare valgono su
entrambe: `.jj-field-label` a 14px (`:372-375`), gli input/select a 15px con radius 12
(`:378-397`), lo stepper rivestito (`:401-422`), l'helper indentato a 26px con glifo
nascosto (`:431-446`), il bottone secondario ghost (`:449-467`).

**Conseguenza per la Fase 2**: un intervento su U-3 o U-5 fatto dentro la skin B4 tocca
l'astratta anche se il prompt parla solo della view — è esattamente il caso della regola 20
di CLAUDE.md (cambiamento che propaga a un layer non nominato). Va deciso in anticipo se
la Fase 2 lavora **dentro** B4 (impatto su entrambe, che è il senso di "uniformare") o
**sotto** un modificatore nuovo.

Nota già registrata nel file stesso (`:242-249`): i componenti CSS-module (Checkbox,
HelpText, Button, NumberInput) **non sono raggiungibili** da questo foglio, quindi le
regole usano hook strutturali (`:has()`, ruoli ARIA, classi `.jj-field*`, classi
Bootstrap). Sono aggangi fragili: un cambio di markup nei primitivi li stacca in silenzio.

### D10.2 — Componenti realmente condivisi fra le due superfici

| componente / classe | astratta | view IR | Apply-to legacy | flag |
|---|---|---|---|---|
| `.props-header` (base CSS) | `Info.tsx:905` | `ViewData.tsx:222` (+ `--view`) | — | ⚠️ **una modifica al base tocca entrambe** |
| `.jj-type-badge` (base) | `Info.tsx:910` | `ViewData.tsx:227` | — | ⚠️ modificatori in due file diversi |
| `.jj-field`, `.jj-field-label`, `.jj-field-required` | sì | sì | sì | ⚠️ globali |
| `ui/NumberInput` | 3 call site | 5 call site | — | ⚠️ **API change impatta 8** |
| `ui/Toggle` | via `PropertiesToggle` | 16+ call site | 2 | ⚠️ |
| `ui/HelpText` | no | ~30 | no | ok, isolato |
| `ui/ConditionalEditor` | **no** | 11 | no | ✅ isolato sulla view |
| `ui/ListEditor` | no | 5 | no | ✅ isolato |
| `ui/FormSection` | no | 9 (solo Vertex) | no | ✅ isolato |
| `ui/SegmentedControl` | **0** | **0** | **0** | ✅ nessun consumatore |
| `ViewParentingFields` | no | `irTabs.tsx:123` | `InfoData.tsx:299` | ⚠️ **un componente, due host** |
| `HelpButton` | `Info.tsx:913` | `ViewData.tsx:211` | — | ⚠️ stesso `helpKey` |
| `InfoTooltip` | copia locale | copia locale ×2 | copia locale | ⚠️ **4 copie da tenere allineate** |
| `.properties-panel-header__actions` (slot) | mai riempito | riempito per portal | — | ⚠️ lookup globale (§D1.3) |

### D10.3 — La sezione NODE non è nella card

`properties-node-section` (`PropertiesWithTreeView.tsx:486-501`, CSS
`properties-with-tree-view.scss:994-1030`) è **sorella** di `<Info>`, non figlia:
sta sotto, nello stesso `.properties-panel-body` scrollabile, visibile solo in modalità
advanced, e apre `<NodeEditor />` (sintassi **concreta**). Conferma il finding 5 del
discovery del 2026-08-08 sul segmented. → Ogni intervento che cambia l'ingombro verticale
delle card cambia anche la posizione di NODE.

### D10.4 — Classi SCSS che la Fase 2 NON deve rinominare (regola 2 e P2)

API interne, con consumatori multipli e spesso in file diversi da quello che le definisce:

```
.props-header  .props-header--view  .props-header__icon  .props-header__name  .props-header__badge
.props-section  .props-section__header  .props-section__header-row  .props-section__header-right
.props-section__title  .props-section__chevron  .props-section__chevron--open  .props-section__body
.props-empty-state  .props-label-entry-split  .properties-fields
.jj-context-bar  .jj-context-bar__segment  .jj-context-bar__segment--current  .jj-context-bar__sep
.jj-type-badge  .jj-type-badge--{class,attribute,reference,operation,enum,literal,metamodel,model,package,view,viewpoint}
.jj-field  .jj-field-label  .jj-field-required  .jj-field-hint  .jj-field-detached
.jj-toggle-row  .jj-toggle-row__label  .jj-toggle-row__badge  .jj-divider
.jj-info-icon-wrapper  .jj-info-icon  .jj-info-tooltip
.jj-viewpoint-row  .jj-viewpoint-row__name  .jj-viewpoint-row__state  .is-active
.jj-move-vp  .jj-move-vp__{open,select,note,actions,cancel,confirm}
.jj-slot  .jj-slot-*  .jj-contents-*  .jj-conformance-bar  .jj-conformance-dot
.properties-tab  .properties-panel  .properties-panel--empty
.properties-panel-container  .properties-panel-header  .properties-panel-header__actions
.properties-panel-pin-btn  .properties-panel-toggle-btn  .properties-panel-body
.properties-node-section  .properties-node-section__header  .properties-node-section__content
.view-editor-root  .view-editor-header  .view-entity-header  .view-editor-tabs
.view-editor-tab-bar  .view-editor-tab  .view-editor-tab-content
.path-list  .path-element  .path-separator
```

Segnalazione specifica: **`.properties-tab` e `.properties-panel` sono usate dalla card
astratta e da tutti e quattro i pannelli IR** (`Info.tsx:1200,1254,1294`;
`VertexAuthoringPanel.tsx:256`; `RowAuthoringPanel.tsx:263`; `EdgeAuthoringPanel.tsx:447`;
`EnableIRPanel.tsx:70,110`; `InfoData.tsx:148`; `ViewData.tsx:142`). La regola di padding
`properties-with-tree-view.scss:367-369` le usa insieme con `!important`.

---

## 3. Dipendenze e rischi per la Fase 2

1. **`ViewParentingFields` è condiviso** (irTabs + InfoData): ogni cambio su Viewpoint /
   Parent view / Move to viewpoint / ⓘ atterra su due superfici. Va dichiarato nel prompt
   di Fase 2 o il diff sfora lo scope dichiarato.
2. **La skin B4 riveste entrambe le card** (§D10.1): U-3 e U-5 sono trasversali per
   costruzione, non per errore.
3. **Il portal dell'header è fragile** (§D1.3): `document.querySelector` globale + deps
   vuote. Se U-1 sposta altro nella riga PROPERTIES, il meccanismo va rivisto, non esteso.
4. **`NumberInput` non consente di svuotare la casella** (`NumberInput.tsx:36-43`): U-5,
   se vuole un placeholder al posto del valore, richiede un cambio di API del primitivo →
   8 call site → regola 19 (>5 file) e regola 11 (interfaccia esportata).
5. **`ConditionalEditor` e `.appbar-mode-switch` sono copie già divergenti**
   (§D4): allineare il primo a D1 rompe la parentela dichiarata col secondo. Serve una
   decisione, non un fix.
6. **Le view IR salvate non hanno VersionFixer** (R-B9, `decisions.md`): nessun intervento
   di Fase 2 deve toccare gli identificatori persistiti nell'`ir`. Tutto ciò che è in
   discussione qui è UI, ma va tenuto presente su U-5 (se un "default come placeholder"
   comportasse la rimozione della chiave dall'ir, sarebbe un cambio di dati, non di UI).
7. **Nessuno dei 10 punti tocca la critical zone** (§3.1 di CLAUDE.md): niente
   `useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`,
   `VersionFixer.tsx`, `DV.tsx`. → Layer Impact Report **not-required** per la Fase 2,
   *a meno che* U-5 non finisca a scrivere nell'IR.
8. **Conteggio file, per la regola 19.** Una Fase 2 che facesse U-1+U-2+U-3+U-6+U-7 tutti
   insieme toccherebbe almeno: `ViewData.tsx`, `irTabs.tsx`, `ViewParentingFields.tsx`,
   `viewParentingOptions.ts`, `MatchingSection.tsx`, `RowAuthoringPanel.tsx`,
   `EdgeAuthoringPanel.tsx`, `VertexAuthoringPanel.tsx`, `LabelEntryEditor.tsx`,
   `FieldSegmentEditor.tsx`, `FieldCompartmentListEditor.tsx`, `BadgeListEditor.tsx`,
   `ConditionalEditor.module.css`, `properties-with-tree-view.scss`, `_form-system.scss`
   → **15 file**. Va spezzata.

## 4. Tensioni con le ratifiche esistenti (segnalate, non risolte)

- **U-2 vs R-H (2026-08-06)**: R-H dice esplicitamente «Breadcrumb rinviata finché parent
  e viewpoint non sono distinguibili». Con la voce 4 (2026-08-07) **lo sono**: `d.viewpoint`
  è derivato e read-only, `father` ha un writer solo. La condizione sospensiva di R-H
  risulta soddisfatta — ma è una lettura mia, e va ratificata da Alfonso prima che U-2
  parta (Q2).
- **U-1 vs R-A (2026-08-05)**: R-A vieta `autoFocus` / `focus()` / `scrollIntoView` nei
  sotto-editor di authoring e in `components/ui/`. Il primitivo `SegmentedControl` gestisce
  le frecce con `select()` che **non** sposta il focus DOM (`SegmentedControl.tsx:59-63`,
  chiama solo `onChange`): compatibile. Se U-6 lo adottasse, la roving-tabindex
  (`tabIndex={selected ? 0 : -1}`, `:105`) resta senza `focus()` esplicito → il focus
  visivo non segue la selezione da tastiera. Limite noto del primitivo, da valutare.
- **U-6 vs D1 (2026-08-05)**: la spec D1 descrive un controllo; oggi ne esistono **tre**
  implementazioni parallele (`ConditionalEditor`, `.appbar-mode-switch`, `SegmentedControl`).
  U-6 come formulato allinea solo la prima. Se l'obiettivo è "una sola pillola nel prodotto",
  è un arco più largo di U-6.
- **U-4 vs R-B (2026-08-05)**: i messaggi cross-tab («…nel tab Applies to», «…nel tab
  Structure») sono `HelpText`/`ErrorText`, quindi già nel canale che U-4 elegge a unico.
  Nessuna tensione.
- **Nessuna tensione rilevata** con R-B9/R-B10/R-B12 (routing), R-C, R-D, C-1..C-4, R-F,
  R-G, D-4-1..D-4-8, R-2/3.6: nessuno dei punti U tocca quei write path.

## 5. Domande aperte per Alfonso

**Q1 — la casella vuota degli stepper (blocca U-5).** Il codice dice che Priorità rende
`0` (`MatchingSection.tsx:144`) e Width rende `1` (`VertexAuthoringPanel.tsx:239,348`).
Non riesco a riprodurre lo stato osservato dal DOM. Serve: (a) su quale view era aperto
il pannello, (b) di che kind era l'`ir`, (c) meglio ancora, il valore di
`windoww.store.getState().idlookup['<viewId>'].ir` per quella view. Se invece il controllo
osservato era il Priority del tab **Apply-to legacy** (`InfoData.tsx:244-253`, che rende
davvero vuoto con placeholder `automatic: undefined`), allora U-5 riguarda una superficie
diversa da quella dichiarata e va riscoperto.

**Q2 — la sospensiva di R-H su U-2.** Confermi che la condizione «finché parent e
viewpoint non sono distinguibili» è sciolta dalla voce 4, e che U-2 può partire?

**Q3 — quante pillole vuoi nel prodotto (U-6).** Tre opzioni, escludenti:
(a) allineo solo `ConditionalEditor` ai valori D1, lasciando `.appbar-mode-switch` dov'è
(due copie che tornano a divergere); (b) sostituisco il markup interno di
`ConditionalEditor` con il primitivo `SegmentedControl` (un consumatore reale, ma cambia
il DOM su cui poggiano gli hook strutturali della skin B4 — vedi §D10.1);
(c) come (b), più la migrazione di `.appbar-mode-switch`, che è però fuori dal pannello
Properties e quindi fuori scope dichiarato.

**Q4 — dove finisce l'help dell'astratta (U-1).** Se il back della view va nella riga
PROPERTIES, l'`HelpButton` dell'astratta resta dentro `.props-header` (`Info.tsx:913`)
mentre quello della view sta nella riga sopra. Uniformo anche l'help, o U-1 riguarda solo
il back?

**Q5 — la label che porta informazione (U-7).** Su `Metaclassi`/`Tutte le metaclassi (*)`,
`Condizione`/`Applica solo se (predicate)`, `Esclusiva`/`exclusive` la seconda label dice
qualcosa che la prima non dice. Preferisci: sopprimere la seconda e riscrivere la prima,
oppure sopprimere la **prima** (che è ridondante col contesto) e tenere quella del toggle?

**Q6 — U-8 su ADVANCED STATE.** Confermo che non esiste alcun flusso UI di aggiunta di
custom state (§D8): registro U-8 come **decaduto** per quella sezione, o vuoi che la Fase 2
proponga un'azione nuova (che sarebbe una feature, non un'uniformazione)?

**Q7 — perimetro della skin B4 (§D10.1).** La Fase 2 può modificare regole dentro
`.properties-panel-container`, sapendo che toccano anche la card astratta? Se no, serve un
modificatore nuovo e le due card restano tipograficamente diverse — cioè U-3 non converge.

---

*Fase 1 chiusa con questo file. Nessun file sorgente modificato, nessun commit.
Il report resta untracked ed entra nel primo commit della Fase 2 insieme alla entry di
`docs/claude-code-log.md`.*
