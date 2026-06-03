# Discovery — creazione reference cross-metamodello: dov'è il gap (Fase 1, READ-ONLY)

**Nome documento prompt**: 2026-05-29 — discovery_reference_cross_mm_creation
**Branch**: `alfonso-frontend-jjtl`
**Modalità**: sola lettura. Nessun file sorgente modificato. Tutte le citazioni `file:riga` verificate sul working tree corrente.

## Sintesi esecutiva (leggere prima di R1..R7)

La catena **dati** di una reference cross-metamodello (picker -> azione -> persistenza) e' **gia' completa e speculare a quella dell'Extends**. Tutti e quattro gli anelli che il prompt sospetta rotti risultano **integri** all'analisi statica:

- il toggle "Cross Reference" e' collegato (`set_allowCrossReference`, scrive `DReference.allowCrossReference`);
- il type-picker della reference **si popola** con le classi cross quando il flag e' ON (`get_validTargets` commuta `allSubPackages -> allCrossSubPackages`);
- l'azione di scrittura del tipo **non rifiuta** una classe di un altro metamodello (nessuna validazione cross in `set_type`);
- il tipo **non** resta nullo: viene persistito come puntatore cross su `DReference.type`.

La **vera** divergenza Extends vs Reference non sta nel modello, ma in tre punti a valle (R5): (1) UI/discoverability del pannello, (2) gesto sul canvas, (3) rappresentazione visiva. Per le reference manca l'equivalente del **ghost-parent stub** appena introdotto per l'Extends cross (commit `2a540a92d`): una reference cross creata dal pannello **non ha alcuna rappresentazione sul canvas** (nessun arco verso il target off-canvas, nessuno stub in-node).

> **Caveat §5.1 (non eseguito).** Questa e' analisi del codice, non esecuzione. I quattro "anelli rotti" sono **falsificati staticamente**, ma la conclusione "la reference cross e' gia' creabile dal pannello oggi" va **confermata a runtime** (vedi "Aperto / Da decidere"). Il gap **certo** e indiscutibile e' visivo/canvas: non c'e' codice che disegni o consenta il gesto.

---

## R1 — Pannello reference e flag "cross"

**Flag**: `allowCrossReference`, **per-reference** (non globale), persistito sul `DReference` (D-layer). E' lo **stesso nome di campo** del flag di classe usato dall'Extends, ma su un oggetto diverso (DReference vs DClass).

**Toggle UI** (sotto la sezione ADVANCED del pannello feature, condivisa da attribute/reference):
- `Info.tsx:446` -> `<PropertiesToggle data={data} field={'allowCrossReference'} label="Cross Reference" />`
- Raggiungibile dal pannello `reference()` (`Info.tsx:461-471`) che richiama `this.feature(data, advanced, true)` (`Info.tsx:463`); la sezione ADVANCED e' gated su `advanced` (`Info.tsx:431`). Quindi il toggle compare **solo in advanced mode**.

**Persistenza/azione** (L-layer, `LTypedElement`):
- `LModelElement.tsx:1264` `get_allowCrossReference(c) { return c.data.allowCrossReference; }`
- `LModelElement.tsx:1265-1272` `set_allowCrossReference` -> `TRANSACTION(...) { SetFieldAction.new(c.data, 'allowCrossReference', v); }`
- D-layer init: `classes.ts:786` `thiss.allowCrossReference = false;` (dentro il builder `DReference()` a `classes.ts:746`).

**Getter derivati che gia' usano il flag** (`LModelElement.tsx:1253-1264`):
```typescript
get_hasCrossReference(c) { return this.get_crossReferences(c).length > 0; }
get_crossReferences(c) {
    if (!this.get_allowCrossReference(c)) return [];
    let refs = [this.get_type(c)];
    let mid = this.get_model(c).id;
    return refs.filter(r => r?.model?.id !== mid) as [LClass];   // type in altro metamodello
}
```
Quindi il modello **ha gia' un concetto** di "reference che punta a un tipo cross" (`hasCrossReference`/`crossReferences`), derivato da `allowCrossReference` + `type.model.id !== own model.id`.

---

## R2 — Creazione di una reference same-metamodello (baseline)

Due vie, entrambe **same-canvas / same-metamodello**:

**(a) Gesto canvas (la via "naturale")** — entrambi gli estremi sono vertici presenti sul canvas:
- `EditorV2.tsx:1058 onConnect` -> `EditorV2.tsx:1074 onConnectEnd` -> `EdgeTypePopup` (`EditorV2.tsx:3095`) -> `handleEdgeTypeSelected` (`EditorV2.tsx:1196`).
- `EditorV2.tsx:1275` `syncReferenceEdge(edgeSource, edgeTarget, refLabel, choice)` con `edgeSource`/`edgeTarget` = **id di DVertex sul canvas**.
- `canvasToJjom.ts:157 syncReferenceEdge`: risolve `sourceClass`/`targetClass` dai vertici (`:166-167`), poi in TRANSACTION (`:208`):
  ```typescript
  const lRef = sourceClass.addReference(uniqueName, targetClass.id);   // :209
  if (lRef && typeof lRef === 'object') { lRef.type = targetClass.id; lRef.upperBound = -1; }  // :211-213
  ```
- Crea anche il `DVoidEdge.new2` (`:232`) con il guard `markCanvasEdgePair` (`:230`) (§3.4).

**Firma azione di creazione feature** (`LModelElement.tsx:3106-3109`, su LClass):
```typescript
public addReference(name?, type?): LReference { ... }
get_addReference(context) {
    return (name?, type?) => LPointerTargetable.fromD(DReference.new(name, type, context.data.id, true));
}
```

**(b) Pannello/tree (senza arco)** — crea una reference **senza target reale**:
- `ContextMenu.tsx:320` `lClass.addReference(suggestedName)` (nessun `type` -> il `get_type` di fallback restituisce `c.data.father`, cioe' **la classe sorgente stessa**, `LModelElement.tsx:1404`).
- Stessa primitiva usata da `jjscript` (`create.ts:473 DReference.new(name, undefined, parentId, true)`) e dalla FeaturesPalette (`featureDefinitions.ts:78 'newReference'`).

**Conseguenza chiave per il cross**: il gesto canvas (a) richiede un **nodo target sul canvas**; con target in un altro metamodello (off-canvas) e' **impossibile**. La via (b) crea pero' una reference modificabile dal pannello, e da li' si puo' ritypizzare verso un target cross (vedi R3/R4).

---

## R3 — Type-picker del target della reference

**Stesso meccanismo dell'Extends a livello di dati, widget diverso.**

- Il tipo si sceglie con `<Select data={data} field={'type'} />` nel pannello feature (`Info.tsx:414`).
- Le opzioni del Select vengono da `validTargetsJSX`/`validTargetOptions` (`Input.tsx:85` e `Input.tsx:41`, `case 'type'`), entrambe calcolate da `get_validTargets`.
- `LReference` eredita `get_validTargets` da `LTypedElement` (catena: `LReference extends LStructuralFeature` a `LModelElement.tsx:3821`; `LStructuralFeature extends LTypedElement` a `:2108`; nessun override di `get_validTargets` in `LReference`).

**Riga discriminante (identica per ruolo a quella dell'Extends)** — `LModelElement.tsx:1287-1341`:
```typescript
get_validTargets(c, out?) {
    let isCrossRef = this.get_isCrossReference(c);          // :1293  = allowCrossReference della reference
    ...
    case DReference.cname: addClasses = true; break;        // :1297
    ...
    if (addClasses) {
        let m = this.get_model(c);
        let pkgs = isCrossRef ? m.allCrossSubPackages : m.allSubPackages;   // :1334  <-- commuta cross/same
        ...
    }
}
```

Quindi **quando il flag "Cross Reference" e' ON, il picker del tipo si popola con le classi dei metamodelli dipendenti** (`allCrossSubPackages`), esattamente come l'Extends. Non e' lo stesso *componente* (Extends usa `MultiSelect`, la reference usa `Select field='type'`), ma e' la **stessa logica** `allSubPackages` vs `allCrossSubPackages` guidata dal medesimo D-field.

`allCrossSubPackages` -> `get_allSubPackages(c, s, includeCross=true)` (`:5453`) -> per un metamodello `_getallSub(c, s, DPackage, true)` (`:5491`) che include i package i cui `model.id` stanno in `allDependencies` (`:5499-5508`). **Prerequisito**: il metamodello deve dichiarare la dipendenza (vedi R5, sezione "prerequisito comune").

---

## R4 — Azione di scrittura del tipo e supporto al cross

**L'azione accetta un tipo cross senza alcuna validazione che lo blocchi.**

- Select -> `Input.confirmValue` -> `data['type'] = serializeValue(...)` (puntatore della classe scelta) -> `LReference.set_type` (`:3966`) -> `super.set_type` (`LTypedElement.set_type`, `:1407`).
- In `set_type`, se `val` e' gia' un **puntatore** (caso del pick dal menu), il blocco di risoluzione-per-nome viene **saltato** (`if (ptr && typeof ptr === 'string' && !Pointers.isPointer(ptr))`, `:1412` -> falso per un id). Si arriva diretti a:
  ```typescript
  if (ptr === c.data.type) return true;                                   // :1464
  TRANSACTION(this.get_name(c)+'.type', ()=> {
      SetFieldAction.new(c.data, 'type', ptr, "", true);                  // :1467
  }, ...);
  ```
- L'**unica** guardia presente e' anti-loop di composizione (`ptr === c.data.father && composition`, `:1459-1463`), **non** una guardia cross-metamodello. Nessun controllo "stesso metamodello".

**Persistenza**: `DReference.type` e' un **singolo puntatore** a qualunque `DClassifier` (campo su `DTypedElement`, builder `DTypedElement(type?)` in `classes.ts`); a livello D non c'e' restrizione di metamodello: un puntatore cross-package e' un puntatore valido. L'export Ecore gia' gestisce i puntatori cross-package a livello XML (cfr. D5 discovery precedente; `LReference.generateEcoreJson_impl` usa `l.type.typeEcoreString`, `:3923`).

---

## R5 — Confronto Extends vs Reference (DOMANDA GUIDA: dove divergono)

### Percorso Extends cross-MM (funziona)
- **Flag**: class-level `allowCrossReference`, toggle "Allow cross-extend" (`Info.tsx:135`), sezione INHERITANCE.
- **Picker**: `MultiSelect` **sempre visibile** quando `advanced && hasDependencies` (`Info.tsx:121-132`); opzioni = `lclass.validTargetOptions` -> `LClass.get_validTargets` (`:2813`) con `pkgs = dclass.allowCrossReference ? m2.allCrossSubPackages : m2.allSubPackages` (`:2819`).
- **Azione**: `onChange={(v) => lclass.extends = v.map(e => e.value)}` (`Info.tsx:128`).
- **Persistenza**: `DClass.extends`, **array di puntatori**.
- **Visivo**: ghost-parent stub in-node (`jjomTransformers.ts:106-120` calcola `ghostParents` da `lClass.extends` filtrando `p.model.id !== lClass.model.id`; reso da `ClassNode.tsx:267-288`).

### Percorso Reference cross-MM
- **Flag**: reference-level `allowCrossReference`, toggle "Cross Reference" (`Info.tsx:446`), sezione ADVANCED.
- **Picker**: `Select field='type'` (`Info.tsx:414`); opzioni = `validTargetsJSX` -> `LTypedElement.get_validTargets` (`:1287`) con `pkgs = isCrossRef ? m.allCrossSubPackages : m.allSubPackages` (`:1334`).
- **Azione**: `set_type` -> `SetFieldAction.new(c.data, 'type', ptr)` (`:1467`).
- **Persistenza**: `DReference.type`, **singolo puntatore**.
- **Visivo**: **NESSUNO**. `jjomTransformers` calcola `ghostParents` solo dall'`extends`; non esiste `ghostTargets`/equivalente per le reference cross. L'arco reference (`jjomEdgeToRFEdge`) deriva il target da `edge.end` (vertice sul canvas): senza vertice target non c'e' edge.

### DOVE DIVERGONO (nero su bianco)
Le due catene **picker -> azione -> persistenza sono parallele e complete**. Non divergono in modo da **impedire la creazione del dato**. Divergono **a valle del modello**, in tre punti:

1. **Discoverability del pannello.** Extends ha un widget **dedicato e sempre visibile** (MultiSelect) accanto al proprio toggle, nella stessa sezione. La reference riusa il **Select generico del tipo** + un toggle "Cross Reference" **sepolto in ADVANCED**, in una sezione (TYPE & BOUNDS) diversa da quella del toggle. Non esiste un picker "scegli target cross" dedicato per le reference.

2. **Affordance sul canvas.** L'Extends cross **non si crea sul canvas** (e' panel-only via MultiSelect), quindi non ha mai dipeso da un gesto canvas. La reference **nasce naturalmente dal gesto** (drag arco, entrambi gli estremi on-canvas); con target off-canvas il gesto e' **strutturalmente impossibile** e non esiste affordance alternativa.

3. **Rappresentazione visiva.** Extends cross ha il **ghost-parent stub**. La reference cross **non ha alcun corrispettivo**: una volta creata dal pannello resta **invisibile** sul canvas.

**L'anello che "manca" nel percorso reference NON e' nella scrittura del modello** (e' completo), **ma e' l'overlay visivo + l'affordance** che l'Extends ha ricevuto (ghost-parent stub) e la reference no.

---

## R6 — Stato attuale: dove si rompe (classificazione del gap)

Categorie offerte dal prompt e verdetto statico:

| Ipotesi | Verdetto | Evidenza |
|---|---|---|
| toggle non collegato | **FALSO** | `set_allowCrossReference` scrive il D-field (`:1265-1272`); il Type Select legge lo stesso `data.allowCrossReference` via `get_isCrossReference` (`:1293`) |
| picker non popolato con classi cross | **FALSO** | `get_validTargets` commuta a `allCrossSubPackages` quando `isCrossRef` (`:1334`), identico all'Extends (`:2819`) |
| azione che rifiuta il cross | **FALSO** | `set_type` non ha guardia cross; scrive il puntatore diretto (`:1464-1468`) |
| reference creata ma tipo nullo | **FALSO** | il tipo persiste come puntatore cross su `DReference.type` |
| **altro** | **VERO** | mancano (a) gesto canvas per target off-canvas, (b) overlay visivo (ghost-target stub), (c) discoverability nel pannello |

**Classificazione**: il gap e' **"altro"**. In base al codice, la reference cross e' **gia' creabile dal pannello oggi** (modello advanced ON -> dichiarare la dipendenza del metamodello -> creare la reference -> toggle "Cross Reference" -> il Type Select elenca le classi cross -> selezionare A -> `DReference.type` = id di A cross). Cio' che manca e' tutto **a valle**: nessuna freccia/stub sul canvas, nessun gesto, e una UX di pannello poco scopribile (toggle in ADVANCED, picker generico, niente widget dedicato come l'Extends).

> **Trappola di prerequisito (comune a Extends e Reference).** Se il metamodello di B **non** dichiara la dipendenza dal metamodello di A, `allCrossSubPackages` contiene solo i package di B (`allDeps` vuoto -> `_getallSub` matcha solo `own model.id`, `:5508`). In quel caso il picker cross mostra solo classi same-mm e A non compare -> sembra "rotto" anche se e' solo dipendenza non dichiarata. La dipendenza si dichiara dal pannello del modello: DEPENDENCIES MultiSelect, `Info.tsx:328-343` (`l.dependencies = v.map(e => e.value)`).

---

## R7 — Modello dati

- **Reference**: `DReference` (D-layer, builder `classes.ts:746`) / `LReference` (L-layer, `LModelElement.tsx:3821`, estende `LStructuralFeature` -> `LTypedElement`).
- **Campo tipo target**: `type` su `DTypedElement` (`type!: LClass` su `LReference`, `:3834`), **singolo puntatore** a `DClassifier`. Getter/setter in `LTypedElement` (`get_type :1372`, `set_type :1407`).
- **Supporto cross nel modello dati**: **SI', gia' presente**, non solo nell'export Ecore.
  - `allowCrossReference` e' un D-field su `DReference` (init `classes.ts:786`), con getter/setter L (`:1264-1272`).
  - `hasCrossReference`/`crossReferences` (`:1253-1259`) derivano gia' "reference il cui tipo e' in un altro metamodello".
  - `type` accetta un puntatore cross-package senza vincoli (R4).
  - L'export Ecore tratta i puntatori cross-package a livello XML (`LReference.generateEcoreJson_impl :3916-3930`), ma il **supporto in-model precede l'export**: il puntatore cross e' gia' un cittadino di prima classe nel D/L-layer.

---

## Aperto / Da decidere in chat

1. **Confermare a runtime (§5.1, non eseguito).** Su una scena reale con metamodello B dipendente da A: advanced ON -> creare reference su B (es. via context-menu `addReference`) -> toggle "Cross Reference" -> aprire il Type Select e verificare che elenchi le classi di A -> selezionare A -> ispezionare `DReference.type` e confermare che punti alla classe di A. Se questo flusso **non** produce il dato, allora uno degli anelli che ho falsificato staticamente e' in realta' rotto a runtime (improbabile, ma va verificato prima di costruirci sopra).

2. **Cosa significa "creare" per l'utente.** Se "creare" = scrivere il dato nel modello, l'analisi dice che si puo' gia' fare dal pannello. Se "creare" = poterlo fare con un gesto e **vederlo** sul canvas, allora il lavoro e' (a) un overlay visivo per la reference cross (un "ghost-target stub" speculare al ghost-parent stub appena fatto per l'Extends) e (b) eventualmente un'affordance/gesto (es. drag dell'arco su uno stub, o un picker dedicato nel pannello reference). Da decidere quale dei due e' l'obiettivo.

3. **Riuso del ghost-parent stub.** Il punto di leva piu' vicino e' il pattern `ghostParents` (`jjomTransformers.ts:106-120` + `ClassNode.tsx:267-288`): si potrebbe calcolare in modo analogo un `ghostTargets` dalle `lClass.references` filtrando `ref.type.model.id !== lClass.model.id` (o usando `ref.hasCrossReference`/`crossReferences` gia' esistenti), e renderizzarlo come overlay in-node con la testa di freccia "association" invece del triangolo di generalizzazione. Decisione di design (forma, ancoraggio, click-to-navigate) da prendere con Alfonso; tutta fuori critical-zone (non tocca `useJjomSync`/`portDistribution`).

4. **Discoverability del pannello.** Valutare se aggiungere, nel pannello `reference()`, un widget cross dedicato (sul modello dell'Extends MultiSelect) o almeno spostare/segnalare meglio il toggle "Cross Reference", in modo che il flusso non richieda di conoscere l'ordine "toggle ADVANCED -> poi Type Select".
