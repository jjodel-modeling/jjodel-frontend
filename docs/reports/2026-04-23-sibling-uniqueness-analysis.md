# Sibling uniqueness validation — Analysis (2026-04-23)

> **Scope:** diagnostic-only. Mapping how "rootable unique" (punto 4) is implemented today, to inform a later fix for "siblings unique per-parent" (punto 5). Zero code changes in this phase.
>
> **Target runtime:** editor-v2 (React Flow based) — model level (M1, DObject instances).

---

## ⚠️ Discrepanza preliminare con la descrizione del prompt

Il prompt descrive il punto 4 come *"validazione soft: warning/badge sull'elemento, il salvataggio non viene bloccato"*.
L'implementazione attuale è invece **hard-blocking** via `U.alert('e', ...)`: l'utente riceve un modale di errore e il rename NON viene applicato.

Non ho trovato tracce di un meccanismo soft paralelo (badge, stato derivato, hook di validazione live) né nei nodi (`ObjectNode`, `ClassNode`), né nell'Info panel, né in hook dell'editor-v2, né in selettori Redux. Le uniche icone `bi-exclamation-triangle*` nei nodi riguardano enum letterali stale e nulla di relativo ai nomi.

**Domanda per l'utente prima di procedere alla Fase 2:** la descrizione "validazione soft" è la semantica attesa/desiderata (da implementare al posto dell'alert attuale), oppure è una descrizione imprecisa del comportamento corrente? La risposta cambia radicalmente lo scope del fix del punto 5 (e probabilmente richiede anche una modifica al punto 4).

Tutto il resto del report descrive lo stato corrente osservato nel codice.

---

## 1. Localizzazione check rootable

- **File:** `frontend/src/joiner/classes.ts`
- **Funzione:** `set_name` (metodo base dichiarato sulla classe antenato comune di `LModelElement`, invocato da tutti i named element tramite l'ereditarietà del sistema L-proxy)
- **Linee:** 2111–2133

Snippet (`joiner/classes.ts:2111-2133`):

```typescript
protected set_name(val: this["name"], c: Context): boolean {
    let name = val;
    if (c.data.name === name) return true;
    const father: LPointerTargetable = (c.proxyObject as LModelElement).father;
    if (father) {
        const check = (father as LModelElement).children?.filter((child) => {
            return child.id !== c.data.id && (D.fromPointer(child.id) as DNamedElement).name === name;
        });
        if (check.length > 0) {
            U.alert('e', 'Cannot rename the selected element since this name is already taken.');
            return true;
        }
    }

    TRANSACTION(this.get_name(c)+'.name', ()=>{
        let nameattribute = (c.proxyObject as any).$name;
        if (nameattribute && nameattribute.className === 'LValue') {
            nameattribute.value = val;
        }
        SetFieldAction.new(c.data, 'name', name, '', false);
    }, undefined, val)
    return true;
}
```

Note importanti:
- Il setter è generico: non distingue tra elementi metamodello (LClass, LAttribute, LReference…) ed elementi modello (LObject). Si applica a **qualsiasi** `LNamedElement` attraverso `father.children`.
- `return true;` dopo l'alert significa che il metodo ritorna con successo apparente, ma **non apre alcuna TRANSACTION**, quindi lo store non viene modificato e il nome non cambia. Dal punto di vista undo/redo non resta traccia del tentativo.
- Override specifici del setter:
  - `LClass.set_name` (`LModelElement.tsx:3048-3053`) — chiama `super.set_name(...)` e dispatcha `SetRootFieldAction` di notifica: **eredita il check**.
  - `LModel.set_name` (`LModelElement.tsx:5288-5302`) — reimplementa con scope globale (confronta contro tutti gli `LModel` nello store) e **bypassa** il check su `father.children`.
  - `LObject.set_name` — dichiarazione presente ma **commentata** (`LModelElement.tsx:5971`): `// protected set_name(val: string, context: Context): boolean { return this.cannotSet("name"); }`. Quindi LObject eredita `set_name` generico e passa attraverso il check `father.children`.

## 2. Meccanismo segnalazione

- **Kind:** `U.alert('e', message)` — modale di errore globale. NON è un badge sul nodo, NON è uno stato derivato, NON persiste nello store.
- **Messaggio:** hardcoded: `'Cannot rename the selected element since this name is already taken.'` — nessuna i18n, nessun suggerimento.
- **Comportamento:** il rename viene **bloccato** (hard). L'input sul nodo/Info panel tipicamente torna al valore precedente al primo re-render del proxy (il selettore Redux legge `data.name` che non è cambiato). Il listener locale in `ObjectNode.commitName` (`ObjectNode.tsx:186-198`) imposta `lastCommittedName.current = name` prima di sapere se il setter ha avuto successo — quindi lo stato locale del nodo potrebbe transitoriamente mostrare il nome nuovo fino al prossimo giro di sync.

### Componenti visivi esistenti nei nodi (non correlati al check nome)

- `mm-field__enum-stale-icon` (`ObjectNode.tsx:405`, `M1PropertiesPanel.tsx:86`) — triangolo giallo per valori enum non più validi. Stile definito in `EditorV2.scss`.
- `singleton-badge` (`ObjectNode.tsx:347-351`) — diamante per singleton.
- `mm-node__badge` (`PackageNode.tsx:74`) — lettera "P" per package.
- Tree-view badge: `frontend/src/components/common/element-badge.scss` — colorati per tipo di elemento. Non c'è un variante `warning` o `conflict`.

Il componente generico `Badge` (quello citato nel prompt) non esiste nella forma di `components/common/Badge/Badge.tsx`: c'è solo il sistema class-based `element-badge--*`. Per un warning di duplicato serve comunque codice nuovo (icona + stile + eventuale tooltip).

## 3. Definizione rootable

"Rootable" nel codebase ha **due accezioni distinte** ed è importante non confonderle:

1. **Classificazione metamodello (M2):** una classe è *rootable* se è concreta e non è target di alcuna reference di composizione. Calcolata come proprietà derivata in:
   - `useEditorMode.ts:434-460` — passo M1 che popola `rootableClasses` per la palette;
   - `LClass.get_rootable` (`LModelElement.tsx:2917-2921`) — getter proxy.
   - Il flag `DClass.rootable` può essere override manuale (campo `undefined = auto`).
   Uso: limitare la palette drag&drop in editor-v2 (`EditorV2.tsx:1428-1430`, `1563-1567`) e filtrare le classi istanziabili al root.

2. **Istanza "rootable" (M1):** l'oggetto è figlio diretto dell'LModel (padre = LModel), non contenuto in un altro LObject. Non esiste un flag persistente: si deduce dalla catena `father`.

Il check a `joiner/classes.ts:2111` **non usa** il concetto (1): usa solo la catena `father` e `father.children`. Per un'istanza root-level il check ha effetto come se fosse "unica tra tutti gli oggetti del modello" (vedi sezione 4), il che copre implicitamente anche il caso rootable.

## 4. Modello dati parent/children

### Getter rilevanti

| Accessor | File:line | Ritorna |
|----------|-----------|---------|
| `LModelElement.father` | `LModelElement.tsx:117`, `172` | Pointer al padre nella catena di containment |
| `LModelElement.get_father` | `LModelElement.tsx:703-705` | `LPointerTargetable.from(c.data.father)` |
| `LModelElement.set_father` | `LModelElement.tsx:706-720` | **nessun check di unicità nome** sui siblings del nuovo padre |
| `LNamedElement.name` / `.get_name` | `LModelElement.tsx:1153`, `joiner/classes.ts:2101-2109` | nome tipico, con fallback a `$name` LValue |
| `LObject.get_name` | `LModelElement.tsx:5715-5717` | **override**: preferisce `$name.value` → `data.name` → `instanceof.name` |
| `LObject.children` (`LValue[]`) | `LModelElement.tsx:5680`, `5783-5806` | **sorted LValues (features)**, NON child LObjects |
| `LObject.subObjects` (`LObject[]`) | `LModelElement.tsx:5701` | istanze figlie effettive |
| `LObject.deepSubObjects` (`LObject[]`) | `LModelElement.tsx:5700` | istanze figlie ricorsive |
| `LModel.get_children_idlist` | `LModelElement.tsx:5303-5309` | per M2: `packages`; per M1: `allSubObjects.map(o => o.id)` (flat, ricorsivo) |
| `LModel.get_allSubObjects` → `_getallSub` | `LModelElement.tsx:5455-5486` | scan globale degli oggetti via `Selectors.getAll(DObject)` filtrato per `lmodel.id` |

### Comportamento reale del check `father.children` nei due casi M1

**Caso A — istanza root-level (punto 4):**
- `father` = `LModel`
- `father.children` = base `get_children` (`LModelElement.tsx:727`) → `get_children_idlist` (override LModel a 5303) → per M1 ritorna **tutti gli oggetti del modello** (`allSubObjects`, flat ricorsivo)
- Il filtro a `classes.ts:2116-2118` confronta quindi il nome contro **ogni oggetto dell'intero modello** (non solo rootable).
- **Conseguenza:** l'utente percepisce "rootable unique", ma l'implementazione è più forte: è "whole-model unique per la gerarchia oggetti".

**Caso B — istanza annidata (punto 5):**
- `father` = un altro `LObject`
- `father.children` = `LObject.get_children` (`LModelElement.tsx:5783-5806`) → ritorna `LValue[]` (features, cioè valori di attributi/references), NON child LObjects.
- Il filtro a `classes.ts:2116-2118` confronta il nome dell'istanza contro i nomi delle features (che sono tipicamente `name`, `age`, `owner`, ecc. — nomi di attributi del metamodello).
- **Conseguenza:** il check non trova mai un match semanticamente sensato → duplicati tra sibling-LObject annidati passano silenziosamente.

### Nome dell'istanza vs feature `name`

Il `get_name` di LObject (`LModelElement.tsx:5715-5717`) preferisce `proxyObject.$name?.value` — cioè il valore della feature `name` (se il metamodello la definisce) — e solo se manca cade su `c.data.name`. La feature `name` (LValue, `instanceof = DAttribute`) e il nome intrinseco dell'istanza (`DObject.name`) sono **due cose diverse** ma convergono via `get_name`.

Il check a `classes.ts:2117` legge `(D.fromPointer(child.id) as DNamedElement).name` — cioè `DObject.name` (il campo raw), NON la feature `name`. Questo è incoerente con il getter (che preferisce la feature): **un conflitto sulla feature `name` non verrebbe rilevato**. È un edge case da menzionare nell'analisi ma probabilmente non critico per il punto 5 (l'utente rinominare tipicamente aggiorna entrambi via `set_name` che scrive `$name.value` E `c.data.name` nel TRANSACTION).

## 5. Trigger del check

Il setter `set_name` si attiva ogni volta che viene assegnata la proprietà `name` su un proxy L-layer. Canali identificati nell'editor-v2:

| Trigger | Entry point | Path fino a set_name |
|---------|-------------|----------------------|
| **Rename inline su ObjectNode** (doppio-click sull'header) | `ObjectNode.tsx:186-198` (`commitName`) | `syncNodeLabel` (`canvasToJjom.ts:351-362`) → `model.name = newName` → proxy setter → `set_name` base |
| **Rename inline su ClassNode** | `ClassNode.tsx:141-153` (`commitName`) | idem → `LClass.set_name` (chiama `super.set_name` → check base) |
| **Rename da Info panel** | `Info.tsx:292` (`<Input data={data} field={'name'} type={'text'} />`) | `Input` commit → proxy setter → `set_name` |
| **Creazione nuovo elemento** (drop da palette) | `ClassNode`/`ObjectNode` `useEffect` su `data.autoEdit` | Il primo commitName dopo la creazione usa lo stesso path. Il nome di default può già essere duplicato — e passa perché non c'è alcun check al momento della creazione; scatta solo quando l'utente lo cambia manualmente. |
| **Drag&drop reparent** (spostare un nodo dentro/fuori un altro) | `set_father` (`LModelElement.tsx:706-720`) | **Nessun check nome**. Lo spostamento di un'istanza in un nuovo padre può produrre collisioni non rilevate. |
| **Import modello** (ecore/XMI/JSON) | ProjectEditor import handlers | **Nessun check nome**: i duplicati preesistenti vengono caricati senza segnalazione. |
| **JjTL execution** (trasformazioni) | `JjtlExecutor` → crea DObject via `DObject.new` + `setTimeout` deferred attribute setting (vedi CLAUDE.md) | **Nessun check nome**: scrive via SetFieldAction o proxy `$name.value`, non invoca `set_name` diretto → bypassa il controllo. |
| **JjScript rename** | `jjscript/executor/commands/rename.ts:132-166` (`checkNameConflict`) | Implementazione **separata** e parallela: walking `parent.classifiers/attributes/references/operations/parameters/subPackages/literals` (per elementi metamodello). Non copre `LObject`, non copre sibling-in-parent-DObject. |

## 6. Gap analysis per punto 5

### Riutilizzabile as-is

- **La struttura del setter**: il pattern `if father → filter children → if duplicate return` è direttamente applicabile. Cambia solo la resolution dei siblings.
- **`LObject.subObjects` / `deepSubObjects`**: già esistono e ritornano effettive istanze figlie. Il fix può usarle.
- **Il campo `LObject.father`**: già popolato correttamente durante `DObject.new`/`set_father`.
- **`LObject.get_name`**: resta la fonte di verità per il confronto; non serve toccarlo.
- **`U.alert` come infrastruttura di segnalazione**: se si accetta che anche il punto 5 sia hard-blocking, non serve codice nuovo di segnalazione. (Se invece si vuole il soft warning promesso dal prompt, serve una pipeline UI nuova — vedi sotto.)

### Modifica minima

- **Introdurre un override `LObject.set_name`** (al momento commentato) che:
  - Risolve i siblings corretti in base al tipo del padre:
    - father instanceof LModel (rootable) → `father.objects` (o `father.allSubObjects` filtrato per `father`) invece di `father.children`
    - father instanceof LObject → `father.subObjects` invece di `father.children`
  - Applica lo stesso filtro `child.id !== self.id && child.name === name`
  - Chiama TRANSACTION identica al base
- **Decidere la semantica per i rootable:** la scelta corrente (scope whole-model via `allSubObjects`) è più restrittiva di "solo-rootable". Se si vuole portare la semantica a "sibling-only" anche per il root, il rootable case va gestito come `father.objects` (figli diretti dell'LModel) invece di `allSubObjects` (tutto il modello).

### Codice nuovo

- **Helper `getInstanceSiblings(lObject: LObject): LObject[]`** — centralizza la logica: guarda il padre e ritorna la collezione giusta. Dipendenze: niente, usa solo API L-layer esistenti.
- **[opzionale, se si va di soft warning]** Un hook tipo `useNameCollisionCheck(nodeId)` nel `ObjectNode.tsx` che:
  - Legge i siblings dal Redux store (via `useSelector` su `state.idlookup`)
  - Confronta i nomi
  - Ritorna `{ hasCollision: boolean, collidingWith?: string[] }`
  - Il nodo renderizza un `<i className="bi bi-exclamation-triangle-fill mm-object__name-warning">` quando ha collisioni
  - Stile SCSS nuovo in `EditorV2.scss`, seguendo il pattern di `mm-field__enum-stale-icon`
  - Pannello Info (`M1PropertiesPanel.tsx`): mirror dello stesso stato accanto al field `name`

### Trigger aggiuntivi (da coprire oltre al punto 4 attuale)

- **`set_father`** (drag&drop reparent): deve rivalutare il check sui siblings del nuovo padre. Sia il punto 4 che il punto 5 lo ignorano oggi.
- **Creazione oggetto con nome di default**: aggiungere al momento del `DObject.new` una deduplication automatica (es. suffix numerico), simile a come `syncReferenceEdge` gestisce i nomi reference (`canvasToJjom.ts:180-200`).
- **Import modello / JjTL execution**: se si vuole coerenza, il check dovrebbe essere post-hoc (marker sui duplicati preesistenti). Più invasivo: decisione separata.

## 7. Punti aperti

1. **Hard-block vs soft-warning.** Come detto in apertura: l'implementazione corrente è hard (`U.alert` + return). Il prompt descrive punto 4 come soft. È un'inconsistenza da sanare prima del fix al punto 5. Opzioni:
   - (a) portare il punto 4 a soft (badge non bloccante) e fare il punto 5 uniforme;
   - (b) mantenere hard per entrambi;
   - (c) soft su entrambi ma con persist-on-save che rifiuta (approccio a due fasi).

2. **Scope per rootable.** Il check corrente per un rootable è whole-model (tutti gli oggetti M1). Vogliamo restringere a "solo figli diretti dell'LModel"? Se sì, nei modelli con metamodelli che ammettono containment composizionale si potrà avere `Packet.name == OtherPacket.name` purché non siano entrambi root — è quello che si vuole?

3. **Figli diretti vs ricorsivi per punto 5.** `father.subObjects` ritorna figli diretti; `father.deepSubObjects` include nipoti. Quale dei due è il "siblings" previsto dal prompt? Dalla descrizione ("due children dello stesso parent DObject") suona come solo diretti.

4. **Drag&drop tra parent diversi.** Quando un oggetto viene spostato da P1 a P2, il check deve:
   - (a) rivalutare solo contro i siblings di P2 (il nuovo contesto);
   - (b) rivalutare entrambi (ma P1 non è più parent, quindi non dovrebbe contare);
   - (c) non fare niente (comportamento attuale).
   Raccomandazione implicita: rivalutare contro P2, con lo stesso hook di set_name.

5. **Duplicati preesistenti.** Un modello caricato da import/JjTL può già contenere collisioni. Il check va applicato solo alle nuove modifiche, o anche retroattivamente (es. mostrando badge su tutti i sibling in collision al primo load)?
   - Hard semantics: solo nuove modifiche (pratico)
   - Soft semantics: retroattivo + badge (utile per data cleanup)

6. **Metamodello vs modello.** Il check base scatta anche per LClass. Nei metamodelli esistenti è tollerato perché gli utenti rispettano l'unicità naturalmente; cambiare la semantica per LObject non tocca LClass. Però: vale la pena allineare il comportamento LClass a "uniforme con LObject" (es. se punto 5 introduce soft warning, anche LClass potrebbe beneficiarne)? Fuori scope, ma da decidere se si vuole consistenza UX.

7. **Feature `name` vs `DObject.name`.** Come spiegato in sezione 4, il check legge `DObject.name` mentre il getter preferisce la feature `$name.value`. Un conflitto esclusivamente sulla feature non viene rilevato. Edge-case, ma da considerare.

## 8. Rischi regressione

### Test esistenti

**Non applicabile:** non esistono test che coprono l'unicità dei nomi a qualsiasi livello. Grep su `/frontend/src/**/__tests__/` per `set_name` / `rename` / `uniqueness` non restituisce risultati. Zero signal di regressione dai test.

### Codice che potrebbe rompersi con name uniqueness enforcement

- **Lookup name-based nel proxy L-layer.** `LObject.isKindOf` (`LModelElement.tsx:5753-5779`) fa `model[name]` e `model['$'+name]` per cercare classi per nome. Assume "first match" — se dovessero esistere due classi con stesso nome (possibile oggi sui metamodelli se importati), questo ritorna solo la prima. Non si romperebbe col fix al punto 5, ma testimonia un'abitudine del codebase a tollerare name duplication.
- **`canvasToJjom.syncReferenceEdge`** (`canvasToJjom.ts:180-200`) fa già deduplication per reference names; è coerente con enforcement di unicità.
- **Undo/redo dual-system (vedi git log 2026-04-22/23).** Il punto 4 attualmente non lascia TRANSACTION quando c'è collisione, quindi non inserisce voci nello stack undo. Il fix dovrà preservare questa proprietà o esplicitamente documentare lo shift.

### Interazioni con co-evolution attributi (2026-04-23)

- `LObject.get_children` ritorna `LValue[]` (features) — usato da co-evolution per ricostruire orphan values quando un attributo viene rimosso/rinominato. **Cambiare la semantica di `get_children`** per far passare la check (cosa che un fix naive potrebbe tentare) spaccherebbe la co-evolution. Non farlo. Il fix corretto è aggiungere un `LObject.set_name` override che usa `subObjects`, NON toccare `get_children`.

### Interazioni con fix recenti (undo/attr_0, inherited features)

- Il fix undo/attr_0 (`e35369c8e`, 2026-04-23) tocca `reconcileJjomAfterUndoRedo` nel rename branch. Se il fix punto 5 introduce un nuovo path rename-aware, va verificato che il riconciliatore continui a funzionare con i nuovi invarianti (es. nome uniqueness nei siblings).
- Co-evolution via ID-based OrphanFeatures: indipendente dal nome, quindi non dovrebbe essere toccato.

### Bug preesistente correlato (non fixare in questa fase)

Il check a `classes.ts:2117` legge `(D.fromPointer(child.id) as DNamedElement).name` — cioè il DObject raw — mentre il getter preferisce `proxyObject.$name?.value`. Un nome sbilanciato tra i due (ad esempio perché una TRANSACTION ha aggiornato solo uno dei due) può dare false-negatives. Segnalato qui come known-issue; fix fuori scope.

## 9. Proposta di approccio per Fase 2 (fix)

Sintesi suggerita, da validare con l'utente dopo aver risolto i punti aperti #1 e #2:

**Opzione A — hard-block minimale (consistente con punto 4 attuale):**
1. Introdurre `LObject.set_name` override in `LModelElement.tsx:5671-...` (scommentare lo stub e riscriverlo).
2. Risoluzione sibling: helper privato `getInstanceSiblings(self, father): LObject[]` che ritorna `father.subObjects` se father è LObject, `father.objects` se father è LModel.
3. Se trova collisione → stesso `U.alert` + return senza TRANSACTION.
4. Opzionale: estendere anche a `set_father` per coprire drag&drop reparent.
5. Nessun componente UI nuovo; stessa UX del punto 4.

**Opzione B — soft-warning (se il prompt descriveva intent futuro):**
1. Introdurre hook `useNameCollision(lObject)` in editor-v2 che calcola `{collisions: LObject[]}` reattivamente via selettore Redux.
2. Rendering di badge giallo sul nodo (ObjectNode + M1PropertiesPanel) con tooltip "Duplicated name".
3. `set_name` NON blocca; fa solo il log di warning. (Eventuale commit-time validation per feature exports / save.)
4. Applicare lo stesso meccanismo retroattivamente anche al punto 4 (rimuovendo l'attuale hard alert) → migrazione pulita.

**Opzione C — ibrida:** soft warning live + hard block su save/export (due rete di sicurezza). Più codice ma più forgiving.

Raccomandazione: scegliere tra A e B **prima** di pianificare il fix, perché l'opzione B richiede circa 3x il lavoro di A ma è l'unica coerente con la descrizione del prompt.
