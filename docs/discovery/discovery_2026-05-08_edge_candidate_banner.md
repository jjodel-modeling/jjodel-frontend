# Discovery — L2.x.1 + L2.x.2 (edge-candidate banner & Apply suggestions)

**Date**: 2026-05-08
**Branch**: `alfonso-frontend-jjtl`
**Phase**: A (read-only). Hard stop after this document; awaiting OK before Fase B.

---

## A.1 — File del pannello proprietà edge

- **Path**: `frontend/src/components/editors/views/data/InfoData.tsx`
- **Componente principale**: `InfoDataComponent` (interno), esportato come connected redux container `InfoData` (default + named export).
- **Variabile della view in editing**: `view` (alias di `props.view: LViewElement`, riga 44).
- **Variabile classifier in-context**: **assente**. Il pannello non riceve né deriva un "classifier corrente" esplicito. L'unico aggancio al classifier è indiretto via `view.appliableToClasses: string[]` (riga 219–225, multiselect Select).

Riferimenti chiave nel file:
- riga 79: `view.isEdge = checked` (toggle handler `handleEdgeToggle`)
- riga 84: `view.isEdge = !view.isEdge` (riga handler `handleEdgeRowClick`)
- riga 118: `<Toggle checked={view.isEdge} ...>` — il toggle Is Edge
- riga 125: `{view.isEdge && (...)}` — gating per gli input edge
- riga 132: `<Input data={view} field={'edgeSource'} ...>`
- riga 139: `<Input data={view} field={'edgeTarget'} ...>`
- riga 146-157: `<Select data={view} field={'edgeRouting'} ...>` (B.2)
- riga 219-226: `<Select data={view} field={'appliableToClasses'} isMultiSelect ...>`
- riga 88: `<section className={'properties-tab properties-panel'}>` — root selettore CSS del pannello

La sezione "Edge configuration" introdotta da B.1 è il blocco righe 112-160. Il banner, per spec, va inserito **prima** della riga 112 (sopra il toggle Is Edge), all'interno della stessa `<section>`.

---

## A.2 — Risoluzione del classifier in-context

**Scenario applicabile**: **(ii)** — derivare da `view.appliableToClasses[0]` quando `length === 1`.

Non esiste (i): nessuna variabile esplicita "classifier corrente" è disponibile in `InfoDataComponent`. Il pannello è data-driven sulla `view` e non riceve il nodo selezionato del canvas. Aggiungere una nuova prop sarebbe l'opzione più invasiva (richiederebbe toccare i caller).

`appliableToClasses` è un `string[]` (vedi `view/viewElement/view.tsx:215, 885`). Il commento inline è esplicito: `// class names: DModel, DPackage, DAttribute...`. Importante: l'array è eterogeneo:

- Può contenere "nomi di tipo astratti" (`'DClass'`, `'DAttribute'`, `'DModel'`, `'DReference'`, ...) — vedi `objectTypes` a `InfoData.tsx:51` e i defaults a `redux/defaults/views.ts:170` (`view.appliableToClasses = [DClass.cname]`).
- Oppure ID concreti di un classifier (`Pointer<DClass>`) — vedi `InfoData.tsx:60-62` (le opzioni della select usano `c.id` come `value`).

**Heuristic completa per `isEdgeCandidate`** (Fase B):

1. `view.isEdge !== true`
2. `view.appliableToClasses?.length === 1`
3. `LPointerTargetable.fromPointer(view.appliableToClasses[0])` ritorna un proxy con `className === 'DClass'` (oppure più precisamente: una `LClass` istanza). Se è invece un nome astratto come `'DClass'`/`'DAttribute'` la lookup ritornerà `undefined` o un proxy non-DClass — in entrambi i casi: **niente banner**.
4. Il classifier risolto ha `references.length === 2` (vedi A.3).

Se anche solo una condizione cade, banner nascosto. Coerente con la decisione di design: "il classifier deve essere univocamente determinato".

**Nota**: il caso `appliableToClasses` con 2+ classifier ID concreti — banner NON appare (length !== 1). Il caso 0 elementi — banner NON appare. Il caso 1 nome astratto — banner NON appare (LPointerTargetable.fromPointer non risolve a DClass).

---

## A.3 — Getter L-layer per le reference dichiarate

**Path**: `frontend/src/model/logicWrapper/LModelElement.tsx`

Sulla classe `LClass` (riga 2689) esistono **quattro** getter distinti per le reference:

| Nome              | Riga decl. | Riga getter | Cosa ritorna                                       | Inherited?                |
|-------------------|-----------:|------------:|----------------------------------------------------|---------------------------|
| `references`      | 2718       | 3212        | `LReference[]` da `context.data.references`        | **No (solo dichiarate)**  |
| `ownReferences`   | 2774       | 2936        | `LReference[]` da `context.data.references` (alias) | **No (solo dichiarate)**  |
| `inheritedReferences` | 2779   | n/d (in `LClassifier`) | solo ereditate                            | Solo inherited            |
| `allReferences`   | 2784       | n/d (in `LClassifier`) | unione + shadowed                          | **Sì**                    |

Il getter `get_references` (riga 3212) fa `context.data.references.map(p => LPointerTargetable.from(p)).filter(...)` — quindi legge la lista raw delle reference dichiarate sul DClass corrente, senza risalire la `extendsChain`.

**Getter da usare**: `lCls.references`. Stessa semantica di `ownReferences`, ma è il nome canonico riusato altrove nella codebase (es. `view/viewElement/view.tsx:5141`, `joiner/classes.ts:3342`).

**Tipo ritornato**: `LReference[]`. Ogni elemento ha `.name: string` (ereditato da `LNamedElement`).

Pattern d'uso nel banner:
```ts
const lCls = LPointerTargetable.fromPointer<LClass>(view.appliableToClasses[0]);
const refs = lCls?.references ?? [];
if (refs.length !== 2) { /* hide banner */ }
const ref0Name = refs[0].name;
const ref1Name = refs[1].name;
```

---

## A.4 — Setter chain via L-proxy

Tutte e quattro le scritture nel piano funzionano già via L-proxy. Nessun pattern alternativo necessario.

| Scrittura                                        | Conferma                                                                                          |
|--------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `view.isEdge = true`                             | Già usata in `InfoData.tsx:79` (handler `handleEdgeToggle`). Nessun `set_isEdge` esplicito → fallback su proxy setter generico. |
| `view.edgeSource = '$<refName>.value'`           | Usato via `<Input data={view} field={'edgeSource'} />` a riga 132; assegnazione diretta in `redux/VersionFixer.tsx:654` (`e.edgeSource = ''`). Nessun `set_edgeSource` esplicito. |
| `view.edgeTarget = '$<refName>.value'`           | Stesso pattern. `redux/VersionFixer.tsx:655` (`e.edgeTarget = ''`).                              |
| `view.appliableToClasses = [classifierId]`       | Setter esplicito in `view/viewElement/view.tsx:1584` (`set_appliableToClasses`) che wrappa in `TRANSACTION` autonoma. Già usato come writer via `<Select isMultiSelect>` a riga 219. |

**Side-effects fra setter**: nessuno. `set_appliableToClasses` (view.tsx:1584-1600) chiama `set_generic_entry`; non resetta `isEdge` né `edgeSource/edgeTarget`. I tre fields edge non hanno setter espliciti, scrivono via proxy generico, nessun effetto cascata.

**Ordine di scrittura**: la sequenza `isEdge → edgeSource → edgeTarget → appliableToClasses` (come da spec) è sicura. Ogni assegnazione apre la propria `TRANSACTION` interna; non c'è atomicità cross-field, ma per il flusso "Apply suggestions" in single-click handler è accettabile (il pattern usato dagli altri handler in InfoData.tsx — es. `handleEdgeToggle` — non wrappa più assegnazioni in una TRANSACTION condivisa).

**Nota di robustezza**: prima di scrivere `appliableToClasses` la spec impone il guard `if (!view.appliableToClasses || view.appliableToClasses.length === 0)` per non sovrascrivere valori esistenti. Confermato: la lettura `view.appliableToClasses` ritorna l'array attuale via `get_appliableToClasses` (view.tsx:1583, `c.data.appliableToClasses || []`), nessun side-effect.

---

## A.5 — Token visivi e classi CSS già in uso

### Sistema token attivo (single source of truth)

- `frontend/src/styles/tokens/_colors-light.scss` + `_colors-dark.scss`
- Entry point: `styles/tokens/index.scss`
- Radius: `styles/tokens/_radius.scss`

### Token rilevanti per il banner

**Slate accent (canonico jjodel — usato da Toggle, primary buttons, focus state)**

```
--color-accent           slate-700  #334155
--color-accent-hover     slate-800  #1e293b
--color-accent-active    slate-900
--color-accent-light     rgba(51,65,85,0.10)   bg subtle
--color-accent-muted     rgba(51,65,85,0.12)   bg / border subtle
--color-accent-subtle    rgba(51,65,85,0.06)   bg very subtle
--color-accent-lighter   rgba(51,65,85,0.05)
```

**Semantic info (blue, "subtle blue, not cyan" — per messaggi informativi)**

```
--color-info             blue-500   #3b82f6
--color-info-hover       blue-600   #2563eb
--color-info-bg          blue-50    #eff6ff
--color-info-muted       rgba(59,130,246,0.12)
--color-info-subtle      rgba(59,130,246,0.06)
```

**Border / Text**

```
--color-border-primary   slate-300
--color-border-secondary slate-250
--color-text-primary     slate-900
--color-text-secondary   slate-700
--color-text-tertiary    slate-600
--color-text-inverse     #ffffff
```

**Radius**

```
--radius-sm     4px
--radius-md     8px              (alias --radius-button, --radius-input)
--radius-lg    12px              (alias --radius-card)
```

### Discrepanza con la spec (richiede decisione utente prima di Fase B)

La spec usa la dicitura "**accent cyan**" (sfondo, foreground, border). **La codebase NON usa cyan per gli accent del pannello**:

- CLAUDE.md è esplicito: *"Cyan (#0ea5e9): MAI come background di bottoni. Solo focus states, active indicators, link."*
- L'accent canonico è **slate-700**. I toggle "Is Edge"/"Is Exclusive" che il banner introduce usano slate active (B.1 + Toggle component).
- L'unico cyan presente è `--color-canvas-accent: #06b6d4` (riservato a selezione canvas, hover nodi, focus input — vedi linee 205-217 / 234-246 di `_colors-light.scss`).

**Due opzioni per il banner**, entrambe coerenti col token system:

| Opzione | Background          | Border               | Foreground (icon, title) | Tono semantico                        |
|---------|---------------------|----------------------|--------------------------|---------------------------------------|
| **A — info-blue** (raccomandato) | `--color-info-bg` | `--color-info-muted` | `--color-info` | "Hint informativo" (lightbulb + blue tint) |
| **B — slate-accent** | `--color-accent-subtle` o `--color-accent-light` | `--color-accent-muted` | `--color-accent` | Tinta neutra slate, in linea col Toggle slate |

Raccomandazione: **A**. Il token group `--color-info-*` esiste esattamente per questo scopo (msg informativi, blue tint subtle). Il bottone "Apply suggestions" full-width può usare `--color-info` come background con `--color-text-inverse` come foreground.

Resta valida B se preferisci coerenza monocromatica con i toggle slate del pannello. **Rispondere con la scelta A o B prima di Fase B**.

### File SCSS dove aggiungere il blocco `.edge-candidate-banner`

InfoData.tsx importa due SCSS (righe 25-26):
- `viewapplyto.scss` — scoping `.view-editor-tab-content > section.properties-tab.properties-panel` (riga 28). È il file che già stylizza il pannello in cui vive la sezione Edge configuration. **Sede corretta**.
- `viewoptions.scss` — scoping `.editor-switch-v2-wrapper / .options-tab` (struttura tabs). Non pertinente al banner.

I selettori generici `.jj-field`, `.jj-field-label`, `.jj-toggle-row`, `.jj-info-icon-wrapper` vengono dal sistema form globale (`styles/components/_form-system.scss:939+`), fuori scope per questo task.

### Disponibilità della classe `edge-candidate-banner`

```
$ grep -rn "edge-candidate" /Users/alfonso/jjodel  →  0 hit
```

Tutti i nomi BEM proposti dalla spec sono liberi:

- `.edge-candidate-banner`
- `.edge-candidate-banner__header`
- `.edge-candidate-banner__text`
- `.edge-candidate-banner__title`
- `.edge-candidate-banner__body`
- `.edge-candidate-banner__apply`

---

## Aperti / decisioni da confermare prima di Fase B

1. **Scelta cromatica banner**: Opzione A (info-blue) o B (slate-accent)?
2. **Path discovery doc**: questo file è in repo root (`/Users/alfonso/jjodel/discovery_2026-05-08_edge_candidate_banner.md`) come da spec. Se preferisci la convenzione `docs/<date>_<topic>.md` usata ad es. da `docs/2026-05-08_packB_discovery_report.md`, posso spostarlo prima di Fase B.

Tutti gli altri elementi (heuristic, getter, setter chain, ordine di scrittura, file SCSS target, BEM naming) sono univocamente determinati.

---

**Fase A completata. Hard stop. In attesa di OK (e risposta sulla scelta A/B) prima di procedere a Fase B.**
