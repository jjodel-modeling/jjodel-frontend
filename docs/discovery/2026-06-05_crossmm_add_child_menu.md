# Discovery — Cross-MM containment reference assente dal context menu "Add child" M1

**Data/ora**: 2026-06-05 11:00
**Tipo**: discovery (Fase 1, read-only)
**Branch**: `alfonso-frontend-jjtl`
**Esito**: ✅ completato — zero modifiche al codice. Root cause isolata con riga esatta.

---

## TL;DR

Il sintomo è nel **flow editor (v2-flow)**, non nel classic. Lo conferma il formato della
label nello screenshot: `Add ChildInTheSameMM (innerRelation)` con il nome reference fra
parentesi = `EditorV2.tsx:2318` (`Add ${cls.name} (${ref.name})`). Il classic usa invece
`Add ${name}` senza parentesi (`contextMenu/ContextMenu.tsx:383`).

**Root cause = caso (a) ACCIDENTALE**, una sola riga:

```
frontend/src/components/editor-v2/utils/compositionCompat.ts:138-139
    const targetClass = classById.get(ref.targetClassId);
    if (!targetClass) continue;          // ← crossMMrelation cade qui
```

La reference cross-MM **viene riconosciuta** (il suo `targetClassId` è risolto
correttamente via `get_type` L-proxy, cross-MM aware), passa il filtro containment, ma
viene scartata perché la sua classe target (`ChildInAnotherMM`, in metamodel_7) **non è
presente in `classById`** — e `classById` è costruito da `allClasses`, che
`useEditorMode.resolveM1Info` popola **solo dal singolo metamodello del modello**
(metamodel_6). Nessun filtro same-MM deliberato (nessun confronto `model.id`).

---

## Q1 — Siti di enumerazione

### Flow editor (v2-flow) — PERCORSO DEL SINTOMO

`EditorV2.tsx:2300-2335`, ramo `isModelMode && node?.type === 'objectNode'`:

```tsx
// EditorV2.tsx:2309-2335
const childOptions = getCompositionChildOptions(metaclass, modeInfo.allClasses);
for (const { ref, concreteOptions } of childOptions) {
    const guardResult = guardLink(sourceObjectId, ref.name);
    ...
    items.push({ label: `Add ${cls.name} (${ref.name})`, ... onClick: () => createCompositionChild(node, cls, ref.name) });
```

- **Sorgente dell'iterazione**: `getCompositionChildOptions(metaclass, modeInfo.allClasses)`
  (`compositionCompat.ts:128`), che itera su `parentMetaclass.references`
  (`compositionCompat.ts:134`). Le `references` di ogni `MetaclassInfo` sono costruite in
  `useEditorMode.ts:356-369`. **Non** è una lista derivata dagli edge.
- **Risoluzione della classe target**: per ogni voce, `classById.get(ref.targetClassId)`
  (`compositionCompat.ts:138`), dove `ref.targetClassId` è stato calcolato a build-time come
  **`ref.type?.id`** (`useEditorMode.ts:362`). `ref` è un L-proxy `LReference`, quindi
  `ref.type` è il getter `get_type` (cross-MM aware): `targetClassId` = id di
  `ChildInAnotherMM`, **corretto anche cross-MM**.
- **`lClass` passato alla creazione**: `createCompositionChild(node, cls, ref.name)` con
  `cls = concreteOptions[0]` (un `MetaclassInfo`). Il suo `.id` finisce in
  `syncCreateObject(graphId, childClass.id, ...)` come `metaclassId`
  (`EditorV2.tsx:2176`). **Non** si chiama mai `LValue.addObject` qui.

### Classic editor — NON è il percorso del sintomo (meccanismo diverso)

`contextMenu/ContextMenu.tsx:327-404`, helper `getAddChildren`, invocato per ogni
feature M1 dell'oggetto:

```tsx
// ContextMenu.tsx:411
let children = (ldata as LObject).features.map(feat => getAddChildren(feat, model, out))...
// ContextMenu.tsx:329-337
const lref = l.instanceof as LReference;
let dref = lref.__raw;
if (dref.className !== 'DReference') return [];
if (!(dref.aggregation || dref.composition)) return [];   // filtro containment
let type = lref.type;                                     // ← get_type, cross-MM aware
out = [type, ...type.allSubClasses].filter(e=>!!e);
```

- **Sorgente dell'iterazione**: `(ldata as LObject).features` = gli **slot di valore M1**
  (`LValue`) realmente presenti sull'oggetto (`get_features` → `get_children`,
  `LModelElement.tsx:6274`), **non** `lClass.references`.
- **Risoluzione della classe target**: `lref.type` (`ContextMenu.tsx:336`) = getter
  `get_type` via L-proxy → cross-MM aware. **Niente lookup contro una lista di classi
  per-metamodello**, quindi il classic **non ha il blind spot del flow**.
- **`lClass` passato**: `out[0]` / `lc` = la `LClass` ottenuta da `get_type`
  (`ContextMenu.tsx:380, 393`) → `l.addObject({}, out[0])`.

> **Conseguenza**: il classic mostrerebbe correttamente "Add ChildInAnotherMM" **a
> condizione che l'oggetto M1 abbia uno slot `DValue` per `crossMMrelation`**. Se quello
> slot esiste, il classic funziona già; il suo unico rischio è l'esistenza dello slot
> (auto-popolamento alla creazione dell'oggetto), non risolto in questa discovery — vedi
> Open question #6. Va riprodotto sul codice corrente (CLAUDE.md §5.1), non assunto.

---

## Q2 — Meccanismo dell'esclusione cross-MM → **caso (a), accidentale**

La riga esatta dello scarto (flow):

```ts
// compositionCompat.ts:130-141 (dentro getCompositionChildOptions)
const classById = new Map(allClasses.map(c => [c.id, c]));
...
for (const ref of parentMetaclass.references) {
    if (!ref.containment && !ref.aggregation) continue;     // :136 — filtro containment (passato)
    const targetClass = classById.get(ref.targetClassId);   // :138 — undefined per cross-MM
    if (!targetClass) continue;                             // :139 — SCARTO SILENZIOSO
    ...
}
```

`classById` è costruito da `allClasses`, e `allClasses` proviene da
`useEditorMode.resolveM1Info`, che raccoglie le classi **solo dal singolo metamodello del
modello**:

```ts
// useEditorMode.ts:218-219 — metamodel = lModel.instanceof (metamodel_6)
const metamodelRef = lModel?.instanceof ?? lModel?.metamodel ?? lModel?.__raw?.instanceof;
metamodelId = typeof metamodelRef === 'string' ? metamodelRef : metamodelRef?.id ?? null;
// useEditorMode.ts:234 — raccolta classi a partire da QUEL metamodello soltanto
const lMetamodel: any = LPointerTargetable.fromPointer(metamodelId);
// useEditorMode.ts:268-278 — traversal solo di metamodelId.packages/subpackages
```

`ChildInAnotherMM` vive in **metamodel_7**, mai raccolto → assente da `classById` →
`if (!targetClass) continue` lo droppa.

**Non esiste alcun filtro same-MM deliberato**: nessun confronto `model.id`, nessun
controllo "stesso package", nessun controllo che il target sia un vertice/edge già nel
grafo. Lo scarto è puramente un effetto collaterale del fatto che la lista classi è
mono-metamodello e il lookup fallisce in silenzio.

> Nota di precisione: il `targetClassId` **è** corretto (cross-MM aware). Quindi non è un
> caso di "raw `DReference.type` stale" (il fix self-loop D9 del 30/05): qui la risoluzione
> del target funziona; è la *risoluzione della MetaclassInfo* a valle a mancare il
> riferimento, perché la collezione di classi è ristretta.

---

## Q3 — Filtro containment

Entrambi i menu restringono alle sole reference containment/aggregation:

- **Flow**: `if (!ref.containment && !ref.aggregation) continue;` (`compositionCompat.ts:136`).
  `containment` mappato da `!!ref.composition`, `aggregation` da `!!ref.aggregation`
  (`useEditorMode.ts:364-365`). → le reference **non**-containment **non compaiono** nel
  menu add-child del flow.
- **Classic**: `if (!(dref.aggregation || dref.composition)) return [];`
  (`ContextMenu.tsx:333`). Stessa restrizione.

`crossMMrelation` è una **composizione** (`composition === true`), quindi **passa** questo
filtro in entrambi i casi. Il filtro containment **non** è la causa dello scarto; lo è il
lookup `classById.get` a valle (flow). Il filtro va lasciato intatto nel fix.

---

## Q4 — `addObject` / creazione child con classe cross-MM

- **Flow**: non usa `LValue.addObject`. Usa `syncCreateObject(graphId, childClass.id, ...)`
  → `DObject.new(metaclassId=childClass.id, modelId=modello-del-parent, DModel, ...)`
  (`canvasToJjom.ts:1142-1148`). `childClass.id` può essere una classe cross-MM; viene
  istanziata **nel modello M1 del parent**.
- **Classic**: `l.addObject({}, out[0])` con `out[0]` = `LClass` cross-MM da `get_type`. Il
  branch containment di `get_addObject` esegue il check di conformità
  `if (isDValue && !lmetaclass.isExtending(this.get_type(c)))` (`LModelElement.tsx:6828`),
  e `this.get_type(c)` è cross-MM aware → `ChildInAnotherMM.isExtending(ChildInAnotherMM)`
  = true → **passa**.
- **`fromPointer` su id cross-MM**: risolve senza errore. `idlookup` è **globale**
  (per-store, non per-modello): `LPointerTargetable.fromPointer(classId)` è usato
  genericamente su id di qualunque metamodello (es. `useEditorMode.ts:283`,
  `EditorV2.tsx:2306,2350`), e `get_type` (`LModelElement.tsx:1372-1404`) risolve
  `c.data.type` via `LPointerTargetable.from`/`fromPointer` senza vincolo di modello.
- **`get_type` per `crossMMrelation`** ritorna il proxy `LClass` di `ChildInAnotherMM` —
  **lo stesso** che usa `ghostTargets` (calcolato in `jjomTransformers.ts` da
  `lClass.references` via `ref.type`). Confermato: identica fonte di verità.

---

## Q5 — Sicurezza cross-MM degli helper di sync

**Nessun discriminatore cross-MM, nessun `model.id` che assuma parent e child nello
stesso modello, nessun `return null`/`continue` per cross-MM.** Gli helper sono
cross-MM agnostici e già corretti per lo scenario M1:

- `syncCreateObject` (`canvasToJjom.ts:1121-1160`): crea il `DObject` in
  `lGraph.model` = **modello del parent** (M1), qualunque sia il metamodello della
  metaclasse. Nessun check su metamodello.
- `createVertexForObject` (`:1076-1092`): crea il `DVertex` sul grafo del parent.
- `createCompositionEdgeForObjects` (`:1173-1212`) e `syncCreateCompositionLink`
  (`:1257`): edge di composizione parent→child, entrambi i vertici sullo stesso grafo,
  append a `parent.$ref.values`. Tutto **same-model**.

A M1 il child contenuto vive nel modello del parent → l'edge di composizione è
**same-model**, e gli helper lo trattano correttamente come tale. (`canvasToJjom.ts` è
critical-zone, ma il fix **non deve modificarlo**: confermato in sola lettura che è già
safe.)

---

## Q6 — Conferma semantica (dove finisce il child)

`get_addObject` branch containment (`LModelElement.tsx:6800-6803`):

```ts
let isContainment = (isDValue && this.get_containment(c)) || isDModel;   // true per composizione
...
father = isContainment ? c.data.id : this.get_model(c).id;              // father = la DValue (lo slot)
```

→ con containment, `father` = lo **slot `DValue`** (non un modello separato). Il child è
creato via `DObject.new3(constructorPointers, ...)` (`:6883`) con `father = DValue`, e il
link father auto-appende il child a `this.values` (commento `:6886`). **Il nuovo child vive
nel modello M1 corrente** (annidato sotto lo slot di containment del parent), **non** in un
modello separato conforme a metamodel_7. Assunzione del prompt confermata.

---

## Verdetto root cause

**Caso (a) — accidentale.** Riga responsabile dello scarto:

```
compositionCompat.ts:138-139   const targetClass = classById.get(ref.targetClassId);
                               if (!targetClass) continue;
```

Causa a monte: `allClasses` è **mono-metamodello** (`useEditorMode.resolveM1Info`
raccoglie classi solo da `metamodelId = lModel.instanceof`, `useEditorMode.ts:218,234`).
Nessun commento o contesto suggerisce un'esclusione deliberata cross-MM; il `continue` è il
guard difensivo standard "salta i ref con target non risolvibile", che diventa un falso
negativo quando il target è legittimamente in un altro metamodello.

---

## Mappa del fix (Fase 2)

Tutti i punti d'intervento sono **FUORI critical-zone**. Nessuna migrazione VersionFixer
(nessun file default-view / `jsxString` toccato).

| File | Ruolo nel fix | Critical-zone? |
|------|---------------|----------------|
| `hooks/useEditorMode.ts` | **Primario.** Includere in `allClasses` (o in un lookup supplementare) le classi target cross-MM referenziate da containment ref. | No |
| `utils/compositionCompat.ts` | Eventuale sito del fallback in `getCompositionChildOptions` quando `classById.get` manca. | No |

Due strategie possibili (decisione di design in chat, non implementare ora):

1. **Arricchire `allClasses` in `useEditorMode`**: dopo aver costruito `rawClasses`, per
   ogni `ref` il cui `targetClassId` non è in `classById`, risolvere la classe cross-MM via
   `LPointerTargetable.fromPointer(targetClassId)` e aggiungere un `MetaclassInfo` (con i
   suoi `concreteSubclasses` cross-MM, se la gerarchia cross-MM va supportata). Vantaggio:
   il fix si propaga a **tutti** i consumer di `allClasses` (drop-on-node, drag arco M1,
   menu del child stesso). Svantaggio: più invasivo; `getConcreteDescendants` oggi è
   calcolato solo sull'`extendsMap` mono-metamodello (Open question #4).

2. **Fallback locale in `getCompositionChildOptions`**: quando `classById.get` ritorna
   undefined, risolvere la target via `fromPointer` e costruire un `MetaclassInfo` minimale
   inline. Vantaggio: chirurgico, una funzione. Svantaggio: copre solo il menu add-child;
   gli altri consumer di `allClasses` restano ciechi al cross-MM.

**NON serve toccare**:
- `EditorV2.tsx` (il blocco menu 2300-2335 consuma e basta).
- `canvasToJjom.ts` helper (critical-zone, confermati safe in lettura — Q5).
- `contextMenu/ContextMenu.tsx` (meccanismo diverso, non affetto dal blind spot — Q1).
- `guardLink`/`checkLinkCreation` (cross-MM safe: risolve l'associazione per nome sulla
  metaclasse **source** che possiede `crossMMrelation`, `ConformanceGuard.ts:33`; fail-open
  se non trovata).

---

## Rischi e open question per la chat

1. **Conformità del modello M1**: è semanticamente lecito che un modello M1 istanza di
   metamodel_6 contenga un child tipizzato da una classe di metamodel_7? Il layer modello
   lo **permette** (il check `isExtending` in `addObject` usa `get_type` cross-MM aware), ma
   è una decisione di design da confermare prima del fix. (Coerente col fatto che a M2 la
   `crossMMrelation` è già renderizzata come ghost-target, quindi il cross-MM è già
   "cittadino" del metamodello.)

2. **Rendering e menu del child cross-MM (cascata della stessa root cause)**:
   - Il **nome** della metaclasse sul nodo child si risolve correttamente: `ObjectNode`
     legge `data.instanceOfClassId` dal Redux **globale** (`ObjectNode.tsx:41`), non da
     `allClasses` → il child cross-MM **renderizza** il nome giusto.
   - MA il **menu add-child del child stesso** fa
     `modeInfo.allClasses.find(c => c.id === objData.instanceOfClassId)`
     (`EditorV2.tsx:2303`): per un child cross-MM questo `find` **fallisce** (classe non in
     `allClasses`) → il child non potrebbe offrire i propri composition-children finché
     `useEditorMode` non include anche le classi cross-MM. La strategia di fix #1 risolve
     anche questo; la #2 no.

3. **`concreteSubclasses` cross-MM**: `getConcreteDescendants` (`useEditorMode.ts:408`) è
   costruito solo sull'`extendsMap` del metamodello locale. Se `ChildInAnotherMM` ha
   sottoclassi in metamodel_7 e le vogliamo istanziabili, il fix deve popolarne la
   gerarchia. Per il caso minimo (target concreto, nessuna sottoclasse) basta il target
   stesso.

4. **Property panel / persistenza del child cross-MM**: non investigati in questa
   discovery (fuori scope del prompt). Da verificare a valle del fix: editing attributi
   nel pannello proprietà, salvataggio/riapertura, export Ecore/XMI di un modello M1 con
   oggetto cross-MM-tipizzato.

5. **Classic menu — verifica runtime richiesta**: il classic *potrebbe* già mostrare
   "Add ChildInAnotherMM" se l'oggetto M1 ha lo slot `DValue` per `crossMMrelation`; non è
   stato confermato come/se quello slot viene auto-popolato alla creazione dell'oggetto.
   Da riprodurre sul codice corrente (CLAUDE.md §5.1, "non fidarsi delle fixture a
   memoria") prima di trarne conclusioni.

---

## HARD STOP rispettato

Nessun file sorgente modificato, nessun rename, nessun commit, nessuna build. Unico file
creato: questo report. In attesa dell'analisi in chat e del prompt di Fase 2.

**Nome documento prompt**: 2026-06-05 11:00
