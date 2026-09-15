# Discovery — Parità visiva tra default IR migrate e rendering nativo abstract

**Data**: 2026-07-18
**Branch**: `cloud/ir-editorv2` @ `3f46884b0` (dabeac79a + fix palette fallback)
**Tipo**: Fase 1, discovery read-only. Nessuna modifica a codice/SCSS/spec. HARD STOP a report scritto.

---

## 1. Obiettivo e contratto

Con la migration inversa 2.225→2.226, il viewpoint Default rende gli oggetti M1 via
interprete IR (view con `ir` + `migratedFrom: 'classic-default'`). A collaudo sul progetto
state machine il rendering con Default attivo differisce visivamente dal rendering nativo
abstract di "nessun viewpoint", mentre pre-branch i due stati erano identici in flow.

**Contratto (Alfonso, 2026-07-18)**: parità totale — Default attivo e nessun viewpoint
visivamente identici (tipografia, colori, dimensioni). Criterio di accettazione del fix
futuro: screenshot Default vs no-viewpoint sul progetto state machine, pixel-identici a
occhio.

Delta osservati (riferimento screenshot):
1. Titolo nodo: nativo = "Nome : Tipo" sottolineato con banda header azzurrina; IR = testo piano su fondo bianco.
2. Valori attributi: nativo = corsivo blu, `=` grigio chiaro; IR = tutto nero uniforme.
3. Dimensioni nodo leggermente diverse (conseguenza di font/padding).

**Verdetto anticipato**: ipotesi di lavoro **confermata**. Non è una collisione CSS: i due
path producono markup con set di classi **disgiunti** (`mm-*` vs `ir-*`), e il CSS del path
IR è un foglio hardcoded (`BASE_CSS` in `irStyle.ts`) che non riusa né le classi né i token
di tema/schema del nodo nativo. Ogni delta osservato ha un'origine puntuale (§5).

---

## 2. File letti (path completi)

Letti per intero, salvo dove indicato:

| File | Ruolo |
|------|-------|
| `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` | Nodo M1: ramo nativo + innesto IR |
| `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | Renderer contenuto IR |
| `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` | `defaultObjectViewIR()`, `IR_DEFAULT_OBJECT_VIEW_ID` |
| `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` | `BASE_CSS`, `ensureViewCss`, tag `#ir-views-css` |
| `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` | Compile view → closures (label qualifiedName, segments) |
| `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` | Hook `useIRView` (wiring React) |
| `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` | Indice per-metaclasse, wildcard, ordering, lifecycle CSS |
| `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` | `VertexViewIR`, `CompiledView`, segments |
| `frontend/src/components/editor-v2/EditorV2.scss` | Sezioni `.mm-node` (1204-1350), `.mm-object` (1633-1738), `.mm-field` (1740-1892), header variants (3443-3536) |
| `frontend/src/components/editor-v2/_themes.scss` | Token tema base light/dark (sezioni token nodi/field) |
| `frontend/src/components/editor-v2/_color-schemes.scss` | Override `--object-header-bg` / `--field-type-color` per schema (1-110 + grep completo) |
| `frontend/src/components/editor-v2/utils/derivePalette.ts` | Palette custom da seed (header + consumer via grep) |
| `frontend/src/redux/VersionFixer.tsx` | Migration `2.225 -> 2.226` (righe 987-1040) |
| `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` | Sez. 10 (fallback) e 11 (migrazione e marcatura) |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` | Copertura test (elenco describe/it) |
| `git show c4b3b7c03` | Fase 2a — introduzione `defaultObjectViewIR()` |

Verifiche via grep mirato: consumer di `ensureViewCss`/`removeViewCss`, definizioni di
`--object-header-bg`/`--field-type-color`/`--node-header-text`/`--text-dim`, usi di
`migratedFrom`/`IR_DEFAULT_OBJECT_VIEW_ID`/`defaultObjectViewIR`, consumer di
`ViewpointRenderer` (solo `ClassNode.tsx:434` — non coinvolto nel path M1), wiring
`scheme-*` (`EditorV2.tsx:3577`).

**Nota**: il "Report di consegna 2026-07-18" citato dal prompt (checklist punto 2, nota
CSS) **non è nel repo** — è materiale della chat di progetto. La discovery ne fa a meno:
i fatti sono ricostruiti dal codice.

---

## 3. Path nativo abstract (nessun viewpoint)

### 3.1 Componente e attivazione

`ObjectNode.tsx` è il node type RF per i DObject. Il ramo nativo (righe 404-607) rende
quando `useIRView(...)` restituisce `null` — cioè quando il viewpoint attivo non ha view
IR applicabili o non c'è viewpoint (`computeIRSignature` ritorna `''` se `state.viewpoint`
è vuoto o nessuna view del viewpoint porta `ir`, `irResolveCore.ts:53-66`).

Questo spiega anche la parità pre-branch: con Default attivo ma view classic (senza `ir`),
`useIRView` era `null` e il rendering era comunque quello nativo — il canale jsxString in
EditorV2 è dead code (discovery 2026-07-17, finding 1). La 2.226 ha acceso per la prima
volta un rendering "da viewpoint" in flow.

### 3.2 Markup prodotto (ramo nativo)

```
div.mm-node.mm-object[.selected][.mm-object--orphan][.mm-object--problem-highlighted][hl-*]
├── NodeResizer / DynamicHandles / singleton-badge / NodeProblemIndicator
├── div.mm-node__header.mm-object__header          ← banda colorata + bordo sotto
│   └── span.mm-node__name.mm-object__name         ← underline (convenzione UML)
│       ├── span.mm-object__instance-name          ← "Nome"   (weight 600)
│       ├── span.mm-object__separator              ← " : "    (weight 400, opacity .7)
│       └── span.mm-object__class-name             ← "Tipo"   (weight 500, opacity .85)
├── div.mm-node__body
│   └── div.mm-node__fields                        ← grid 4 colonne (auto auto 1fr auto)
│       ├── div.mm-field.mm-object__feature        (per ogni attributo valorizzato)
│       │   ├── span.mm-field__name.mm-object__feature-name    ← nome (weight 500)
│       │   ├── span.mm-field__separator                       ← "="  (grigio, opacity .6)
│       │   └── span.mm-field__type.mm-object__feature-value   ← valore (corsivo, colore type)
│       └── div.mm-field.mm-object__feature.mm-object__feature--placeholder
│                                                  (per ogni attributo opzionale NON valorizzato
│                                                   — lazy co-evolution, opacity .45 italic)
└── div.mm-node__empty                             (solo se nessun field)
```

Editing: header → `input.mm-node__input`; valore → `input.mm-field__input`
(height 18px, max-width 100px); enum → popover `InlineEnumSelect` (non un input).

### 3.3 Origine degli stili (file:riga)

| Regola | Dove | Valori chiave |
|--------|------|---------------|
| `.mm-node` base | `EditorV2.scss:1208-1220` | bg `var(--node-bg)`, border 1px `var(--border-default)`, radius 4px, min-width 140, min-height 40, font `var(--font-sans)` **13px**, color `var(--text-primary)` |
| `.mm-node__header` | `EditorV2.scss:1247-1270` | flex center, padding **4px 8px**, min-height **22px**, weight 500, **13px**, color `var(--node-header-text)` |
| `.mm-object__header` (banda) | `EditorV2.scss:1640-1643` | background `var(--object-header-bg, rgba(180,130,50,.35))`, border-bottom 1px `var(--node-separator)` |
| `.mm-object__name` (underline) | `EditorV2.scss:1645-1650` | `text-decoration: underline` |
| 3 segmenti titolo | `EditorV2.scss:1652-1664` | instance-name 600 / separator 400 op .7 / class-name 500 op .85 |
| `.mm-node__body` | `EditorV2.scss:1324-1326` | padding 4px 0 2px |
| `.mm-node__fields` | `EditorV2.scss:1329-1333` | `display:grid; grid-template-columns: auto auto 1fr auto` |
| `.mm-field` (riga) | `EditorV2.scss:1744-1752` | grid subgrid, padding 2px 8px, min-height **20px**, **12px**, hover `var(--field-row-hover)` |
| `.mm-field__name` | `EditorV2.scss:1759-1771` | color `var(--field-name-color)`, weight 500 |
| `.mm-field__separator` (`=`) | `EditorV2.scss:1774-1778` | color `var(--text-dim)`, **opacity .6** |
| `.mm-field__type` (valore) | `EditorV2.scss:1781-1797` | color **`var(--field-type-color)`**, weight 400 |
| `.mm-object__feature-value` | `EditorV2.scss:1670-1673` | **font-style: italic** |
| placeholder lazy | `EditorV2.scss:1675-1683` | opacity .45, italic |

### 3.4 Da dove vengono i colori osservati ("banda azzurrina", "corsivo blu")

I colori sono **token CSS risolti per tema + schema**:

- Tema base light (`_themes.scss:160-228`): `--field-type-color: #0369a1` (blu),
  `--field-name-color: #1e293b`, `--text-dim: #94a3b8`, `--node-header-text: #ffffff`.
  **`--object-header-bg` NON è definito nel tema base**: senza schema attivo la banda usa
  il fallback SCSS `rgba(180,130,50,.35)` (ambrato).
- Schemi (`_color-schemes.scss`): es. Sapphire light definisce `--object-header-bg: #dbeafe`
  (azzurrino, riga 80), `--field-type-color: #2563eb` (blu, riga 86), `--node-header-text:
  #1e3a5f` (riga 84). La "banda azzurrina" degli screenshot è compatibile con Sapphire
  light (o una palette custom da seed blu via `derivePalette.ts:78`, che ripete gli stessi
  ~12 token). Wiring: `EditorV2.tsx:3577` applica `scheme-<nome>` sulla radice `.editor-v2`.
- Header variants A/B/C (`EditorV2.scss:3443-3536`) sono attivabili solo da DevTools
  (classe su `body`) — non rilevanti a runtime normale.

**Punto load-bearing**: il nodo nativo prende TUTTO da token per-tema/per-schema; qualunque
schema scelga l'utente, il nativo segue. Questo è il metro su cui va misurata ogni strada
di fix (§6).

---

## 4. Path IR (view default migrate)

### 4.1 Catena di risoluzione

1. `VersionFixer.tsx:1007-1040` (`2.225 -> 2.226`): le DViewElement con marker classic
   default object/singleton ricevono `e.ir = { ...defaultObjectViewIR(), migratedFrom:
   'classic-default' }` (riga 1026). Il `migratedFrom` vive **dentro l'oggetto `ir`**,
   non sulla DViewElement. Il jsxString classic resta come fallback (Fase 5).
2. `defaultObjectViewIR()` (`irDefaults.ts:24-47`): `kind: 'vertex'`, `metaclasses: '*'`
   (wildcard, specificità minima), una label `top` con `intrinsic: qualifiedName`, un
   fieldCompartment `attributes` con segmenti `[name, literal ' = ', value]`, `separator: true`.
3. `useIRView` (`irResolve.ts:37-73`) → `getIRIndex` + `resolveIRView`
   (`irResolveCore.ts:71-202`): la wildcard entra nell'indice con specificità 0; qualsiasi
   view dichiarata per metaclasse la batte a pari priority. Alla costruzione dell'indice
   `ensureViewCss(vid, ir)` (riga 141) inietta il CSS per-view.
4. `ObjectNode.tsx:356-402` (ramo IR): il wrapper resta
   `div.mm-node.mm-object[.selected][...] .ir-view-<viewId>` + `data-viewid`; NodeResizer,
   DynamicHandles, singleton-badge e NodeProblemIndicator invariati; il **contenuto** è
   `<IRNodeContent compiled objectId vertexId readCtx>`.

Quindi: **il guscio del nodo (sfondo bianco, bordo, ombra, min-size, selezione) è già
condiviso**; il delta è tutto nel contenuto.

### 4.2 Markup prodotto (IRNodeContent, view default)

```
div.ir-node-content.ir-shape--rect            (style inline solo se fill — default: nessuno)
├── span.ir-label.ir-label--top               ← "Nome : Tipo" in UN solo span
│                                                (stringa costruita da irCompile.ts:227)
└── div.ir-compartment                        ← border-top hardcoded, padding 4px 8px
    └── div.ir-row                            (per ogni feature VALORIZZATA, attributi)
        ├── span                              ← nome        (SENZA classe)
        ├── span                              ← " = "       (SENZA classe, literal)
        └── span[.ir-row__value--editable]    ← valore      (nessun colore/corsivo)
```

I segmenti `name`/`type`/`literal` sono `<span>` nudi (`IRNodeContent.tsx:162-193`); solo
il `value` editabile ha `ir-row__value--editable`. Le righe vengono da
`dObject.features` (solo valorizzate): **nessun placeholder lazy co-evolution**. Editing:
label → `input.ir-label__input`; valore → `input.ir-row__input` (anche per gli enum:
niente popover `InlineEnumSelect`).

### 4.3 Cosa finisce in `#ir-views-css`

`irStyle.ts` inietta un unico `<style id="ir-views-css">` con:

- **`BASE_CSS`** (righe 16-44), una volta sola. Regole rilevanti per il default:
  - `.ir-label`: **11px**, line-height 1.3, ellipsis (riga 18)
  - `.ir-label--top`: order 0, centrato, weight 600 (riga 19) — **niente padding,
    min-height, underline o background**
  - `.ir-compartment`: `border-top: 1px solid rgba(51,65,85,0.15)` **hardcoded**,
    padding 4px 8px (riga 28)
  - `.ir-row`: **11px**, line-height 1.4, `display:flex; gap:4px` (riga 30)
  - `.ir-shape--rect { border-radius: 0 }` (riga 32) — inerte per il default (contenuto
    trasparente)
- **CSS statico per-view** (`staticCssFor`, righe 62-73): classe `.ir-view-<viewId>` con
  solo `border`/`fill` statici. Il default non dichiara né l'uno né l'altro → **stringa
  vuota**. Il tag contiene quindi solo BASE_CSS per il caso in esame.

**Nessuna regola di BASE_CSS usa token `var(--...)`**: colori e metriche sono literal
(`rgba(51,65,85,…)`, `#334155`, `#0ea5e9`). Il testo eredita `color: var(--text-primary)`
dal wrapper `.mm-node` — ecco il "tutto nero uniforme". Corollario: il path IR è anche
**cieco a tema dark e schemi colore** (debito segnalato in §7).

---

## 5. Diff dei due path

### 5.1 Tabella markup/classi

| Elemento | Nativo (classi) | IR (classi) | Delta visivo |
|----------|-----------------|-------------|--------------|
| Wrapper nodo | `.mm-node.mm-object` (+selected/orphan/hl) | identico + `.ir-view-<id>` (manca solo `--orphan`, non applicabile) | nessuno |
| Titolo — contenitore | `.mm-node__header.mm-object__header`: banda `var(--object-header-bg)`, border-bottom, padding 4px 8px, min-height 22px, 13px w500 | `.ir-label.ir-label--top`: 11px w600, centrato, **senza** banda/bordo/padding/min-height | **Delta 1** |
| Titolo — testo | 3 span (`__instance-name` 600 / `__separator` 400 op.7 / `__class-name` 500 op.85) dentro span **underline** | 1 span unico, stringa `"nome : Tipo"`, niente underline | **Delta 1** |
| Corpo | `.mm-node__body` (padding 4px 0 2px) + `.mm-node__fields` **grid 4 colonne** | `.ir-compartment` (padding 4px 8px, border-top hardcoded) | Delta 3 (allineamento/padding) |
| Riga attributo | `.mm-field.mm-object__feature`: 12px, padding 2px 8px, min-height 20px, hover | `.ir-row`: 11px, flex gap 4px, nessun min-height/hover | **Delta 3** |
| Nome attributo | `.mm-field__name` → `var(--field-name-color)` w500 | span nudo → eredita `var(--text-primary)` | Delta 2 (parziale) |
| `=` | `.mm-field__separator` → `var(--text-dim)` opacity .6 | span nudo `" = "` → nero pieno | **Delta 2** |
| Valore | `.mm-field__type.mm-object__feature-value` → `var(--field-type-color)` (blu) + **italic** | span nudo/`.ir-row__value--editable` → nero, non corsivo | **Delta 2** |
| Placeholder attributi non valorizzati | `.mm-object__feature--placeholder` (op .45 italic, editabile) | **assenti** (righe solo da features valorizzate) | Delta 4 (righe in più/meno → altezza) |
| Editing valore | `input.mm-field__input` (18px, max-w 100) / popover `InlineEnumSelect` per enum | `input.ir-row__input` (90% width) / **niente popover enum** | Delta 4 |
| Separatore body | border-bottom dell'header = `var(--node-separator)` (token) | border-top compartment = `rgba(51,65,85,.15)` (hardcoded) | Delta 2/3 minore |
| Reattività a tema/schema | tutti token | solo `--text-primary` ereditato; resto hardcoded | Delta trasversale (dark mode, schemi) |

### 5.2 Origine esatta dei delta osservati

1. **Titolo piano su fondo bianco** — il path IR non ha alcun elemento header: la label
   `top` è un semplice span (`IRNodeContent.tsx:136-147`) stilato da `irStyle.ts:18-19`.
   Mancano: banda (`EditorV2.scss:1640-1643`), underline (`:1645-1650`), i tre pesi
   (`:1652-1664`), padding/min-height del header (`:1247-1270`). Inoltre `qualifiedName` è
   compilato come stringa unica (`irCompile.ts:227`), quindi anche applicando classi native
   non si riottengono i tre segmenti senza cambiare markup.
2. **Valori tutto nero** — i segmenti riga sono span senza classe
   (`IRNodeContent.tsx:162,193`) e nessuna regola IR assegna colore/corsivo: ereditano
   `color: var(--text-primary)` da `.mm-node` (`EditorV2.scss:1218`). Nel nativo il blu è
   `var(--field-type-color)` (`:1781-1788`; `#0369a1` tema base light, `#2563eb` Sapphire),
   il corsivo è `.mm-object__feature-value` (`:1670-1673`), il grigio dell'`=` è
   `var(--text-dim)` + opacity .6 (`:1774-1778`).
3. **Dimensioni diverse** — font 13px header/12px righe (nativo) vs 11px ovunque (IR);
   header con padding 4px 8px + min-height 22px vs label senza box; righe min-height 20px +
   padding 2px 8px vs line-height 1.4×11px; grid 4 colonne (allineamento colonne uniformi)
   vs flex per-riga con gap 4px. Il wrapper condiviso (min-width 140/min-height 40) limita
   il delta ma il contenuto IR è sistematicamente più compatto.

### 5.3 Conferma/smentita dell'ipotesi

**Confermata, con precisazione**. Non c'è collisione CSS (i namespace `mm-*` e `ir-*` sono
disgiunti; `#ir-views-css` non tocca regole native). Ma il problema non è solo "mancata
riappropriazione di classi": anche volendo applicare le classi native al markup IR, la
**struttura** differisce (header a 3 span vs label unica; grid vs flex; placeholder
assenti; widget enum assente). La parità pixel richiede o il markup nativo o una sua
replica fedele — non basta un mapping di classi.

---

## 6. Le tre strade di fix (valutazione, nessuna implementazione)

### (A) Riuso delle classi native nel renderer IR

Il renderer, quando la view è una default migrata, emette le classi SCSS native
(`mm-node__header`, `mm-field__*`, …).

- **File toccati**: `IRNodeContent.tsx` (ramo markup "native skin": header wrapper,
  split della qualifiedName in 3 span, righe come `.mm-field` in un `.mm-node__fields`
  grid, classi sui segmenti), `irTypes.ts` (proprietà opzionale `migratedFrom?` su
  `VertexViewIR` — additiva, ammessa), eventualmente `ObjectNode.tsx` (nessuna modifica
  se il gate sta in IRNodeContent). SCSS invariato.
- **Costo reale**: replicare a mano lo scheletro di render di ObjectNode dentro
  IRNodeContent. La coda lunga è pesante: subgrid delle colonne, placeholder lazy
  co-evolution (nel nativo sono un blocco di logica da ~60 righe con selettori Redux
  dedicati), popover enum, hover/edit affordances. Ogni pezzo non replicato è un delta
  residuo che il collaudo visivo becca.
- **Rischio drift**: ALTO. Due implementazioni dello stesso markup: ogni futura modifica a
  ObjectNode/EditorV2.scss va specchiata nel ramo IR. È il drift che il contratto vuole
  eliminare.
- **View IR custom**: nessun impatto se il ramo è gated su `migratedFrom` (le custom non
  hanno il marker e mantengono lo stile proprio).
- **Test**: `ir.test.ts` (30 test) intoccato — copre solo funzioni pure, non markup.
  Nessun test React esiste per IRNodeContent.

### (B) Delega: le view default migrate rendono col componente nativo

In `ObjectNode.tsx`, se la view risolta è la default migrata
(`(compiled.ir as any).migratedFrom === 'classic-default'`, e prospetticamente
`viewId === IR_DEFAULT_OBJECT_VIEW_ID` per la futura wildcard built-in — oggi
`IR_DEFAULT_OBJECT_VIEW_ID` non è mai installata a runtime, solo migration e fixtures),
si ignora la risoluzione e si esegue il ramo nativo esistente. L'interprete rende solo le
view IR non-default.

- **File toccati**: `ObjectNode.tsx` (una condizione sul ramo IR), `irDefaults.ts`
  (helper puro `isMigratedDefaultView(compiled)`, unit-testabile), + 1-2 test in
  `ir.test.ts`. Niente SCSS, niente `IRNodeContent`, niente critical zone.
- **Parità**: **per costruzione** — stesso componente, stesse classi, stessi token,
  stessi comportamenti (placeholder, popover enum, tab-navigation). Il criterio di
  accettazione (pixel-identici a occhio) è soddisfatto strutturalmente, non per
  convergenza asintotica.
- **Coerenza con la spec**: sez. 10 già definisce "elemento senza view IR applicabile →
  rendering astratto di EditorV2 (identico a nessun viewpoint)". La delega estende lo
  stesso contratto: "view default migrata → rendering astratto". Serve un emendamento a
  sez. 11 (una frase) in Fase 2.
- **Ordinamento risoluzione**: intatto. La default resta nell'indice con specificità 0;
  una view di metaclasse la batte; se il predicato di quella fallisce si ricade sulla
  default → delegata al nativo. La palette (`irInteraction`) già tratta le wildcard come
  non-restrittive (test "wildcard-only viewpoints impose no palette restriction").
- **Rischio drift**: ZERO per il default (fonte unica = nativo).
- **Rischi/subtleties**:
  1. *Edit futuro della default*: `migratedFrom` resta nel `ir` anche se l'utente un
     domani modifica la view (authoring IR). La delega ignorerebbe le sue modifiche.
     Mitigazione: delegare solo se `ir` è ancora strutturalmente uguale a
     `defaultObjectViewIR()` (confronto su hash, `irHash` esiste già in `irCompile.ts`);
     un edit rompe l'uguaglianza → l'interprete riprende la view (che a quel punto è una
     custom, e definisce il proprio stile — contratto rispettato). → OQ-1.
  2. *Dogfooding*: la default smette di essere un esercizio in produzione
     dell'interprete. Accettabile: le view custom e i fixture demo continuano a
     esercitarlo; la parità pixel col nativo non è comunque un obiettivo raggiungibile
     dall'interprete a costo ragionevole.
- **View IR custom**: nessun impatto (risolvono e rendono come oggi).
- **Test**: i 30 esistenti restano verdi (risoluzione invariata); +test per l'helper.

### (C) Estrazione: stili del nodo nativo → classi condivise

Estrarre gli stili di `.mm-object`/`.mm-field` in classi/mixin condivisi usati da entrambi
i markup, o far puntare `BASE_CSS` agli stessi token.

- **File toccati**: `EditorV2.scss` (refactor delle sezioni 1633-1892), `irStyle.ts`,
  `IRNodeContent.tsx`. Le classi SCSS sono API pubblica (CLAUDE.md §2): un refactor qui è
  regression-prone su comportamento committato e verificato.
- **Limite strutturale**: condividere le classi non basta — il markup IR resta diverso
  (label unica vs 3 span, flex vs grid, niente placeholder). Per arrivare alla parità si
  finisce comunque a replicare il markup ⇒ C degenera in A + un refactor SCSS in più.
- **View IR custom**: rischio opposto a quello richiesto — se le classi condivise entrano
  in `BASE_CSS` o nei default `.ir-*`, TUTTE le view IR ereditano la veste abstract,
  violando il requisito che le custom definiscano il proprio stile. Servirebbe comunque
  uno scoping per-view (= il gate di A).
- **Rischio drift**: medio (fonte unica per gli stili, doppia per il markup).
- **Test**: come A, più smoke visivo su tutto il canvas M2/M1 (il refactor SCSS tocca
  anche ClassNode/EnumNode via `.mm-field`).
- Utile solo in un futuro in cui entrambi i path debbano restare vivi a lungo termine con
  lo stesso contenuto — ma è esattamente ciò che B elimina.

### Sintesi comparativa

| | (A) riuso classi | (B) delega | (C) estrazione |
|---|---|---|---|
| Parità pixel | asintotica (coda lunga) | per costruzione | asintotica |
| Diff | medio (markup replicato) | minimo (~15 righe + helper) | grande (SCSS+markup) |
| Drift futuro | alto | zero | medio |
| View IR custom | ok se gated | ok | a rischio senza scoping |
| Critical zone / SCSS nativo | no / no | no / no | no / sì |
| Coerenza spec v1.2 | neutra | allineata a sez. 10 | neutra |

---

## 7. Raccomandazione

**Strada (B) — delega al componente nativo**, gated sul marker `migratedFrom:
'classic-default'` **e** (raccomandato, da confermare — OQ-1) sull'uguaglianza strutturale
con `defaultObjectViewIR()`, così un default successivamente editato dall'utente torna
all'interprete come view custom.

Motivazione: il contratto è "visivamente identici, verificati a occhio da Alfonso". Solo B
lo garantisce per costruzione, con il diff più piccolo, zero drift, zero impatto sulle
view IR custom e piena coerenza con il fallback della spec sez. 10 (il default migrato È
il comportamento di "nessun viewpoint", quindi è corretto che lo renda il componente che
implementa quel comportamento). A e C inseguono la parità per convergenza e istituiscono
una seconda implementazione da mantenere allineata — il costo che questa discovery
documenta essere già sfuggito una volta.

Debito collaterale da tracciare (fuori scope del fix): `BASE_CSS` in `irStyle.ts` hardcoda
colori light-ish (`#334155`, `rgba(51,65,85,…)`, `#0ea5e9`) → le view IR **custom** non
reagiscono a tema dark né agli schemi colore. Non blocca la parità del Default (risolta da
B), ma andrà tokenizzato quando si stabilizza lo styling IR.

## 8. Domande aperte per Alfonso

- **OQ-1 — Trigger della delega**: solo marker `migratedFrom: 'classic-default'`, oppure
  marker + uguaglianza strutturale con la factory (raccomandato)? Con il solo marker, un
  futuro edit della view default via authoring IR verrebbe silenziosamente ignorato.
- **OQ-2 — Perimetro**: la delega copre anche una futura default wildcard built-in
  (`IR_DEFAULT_OBJECT_VIEW_ID`, oggi mai installata a runtime)? Il prompt la include; il
  costo è lo stesso `if`.
- **OQ-3 — Spec**: emendare sez. 11 con una frase che formalizza la delega ("le view
  `migratedFrom: 'classic-default'` rendono col rendering astratto nativo finché non
  divergono dalla factory")? Proposta verbatim in Fase 2.
- **OQ-4 — Debito theming IR**: aprire un ticket separato per la tokenizzazione di
  `BASE_CSS` (dark mode/schemi per le view IR custom), o accorparlo a un futuro
  workstream styling IR?
- **OQ-5 — Parità comportamentale**: con B, placeholder lazy co-evolution e popover enum
  tornano automaticamente anche sotto Default. Confermare che è il comportamento voluto
  (era il comportamento pre-branch, quindi si assume di sì).
