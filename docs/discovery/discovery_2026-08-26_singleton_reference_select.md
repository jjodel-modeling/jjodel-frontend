# Discovery — la reference verso un singleton si assegna da una select (commit B, Fase 1)

**Data**: 2026-08-26
**Branch**: `alfonso-frontend-jjtl`, HEAD `1ef180323` (il prompt cita `957516083`; fra i due c'è solo
`docs:` — R-SGL-9f e il prompt stesso. Nessun file di prodotto è cambiato: verificato con
`git diff 957516083 HEAD --stat` sul perimetro, vuoto.)
**Fase**: 1 di un two-phase. Read-only: nessun file di prodotto toccato, nessun `git add`.
**Prompt**: `docs/prompts/claude_2026-08-26_1720_prompt_singleton_discovery_B.md`
**Ratifiche**: R-SGL-4 (questo commit), R-SGL-6 (perché `concreteSubclasses` non si filtra), R-SGL-9

> **Natura delle misure.** Lettura statica del sorgente più conteggi di ricerca con exit status
> verificato. Nessuno scenario eseguito nel browser. Dove una conclusione dipende da un
> comportamento a runtime lo dichiaro e lo porto in §10 invece di darlo per acquisito. Due fatti
> qui riportati sono misure di **sessioni precedenti** (sonde del 2026-07-20), citate come tali.

---

## 0. Obiettivo

Rispondere alle sette domande della sezione 3 del prompt, così che la Fase 2 sia una lista chiusa
di edit con il Layer Impact Report già abbozzato.

**Risultati principali, anticipati.**

1. **Il ramo nativo non ha righe reference**: `ObjectNode.tsx:387` filtra
   `featureKind === 'attribute'`. R-SGL-4 non ha una riga da rendere editabile lì — applicarla
   significherebbe **aggiungere un compartimento reference al nodo nativo**, che è una feature
   diversa e più grande. Il ramo IR è l'unico perimetro sensato.
2. **`syncUpdateFeatureValue` non basta e non va riusata**: su uno slot reference **vuoto**
   `.value =` è un no-op silenzioso (misura in-browser del 2026-07-20, citata a
   `EditorV2.tsx:1897-1899`). La forma canonica in casa è `slot.values = [...meaningful, id]`.
   Serve un secondo entry point.
3. **La domanda che decide il LIR (D5) ha una risposta scomoda**: la soppressione dei singleton è
   applicata **solo nel percorso di init** di `useJjomSync` (`:1204-1212`, filtro sul `nodeCache`),
   **non** in quello incrementale (`:1302`, filtro su `subElementIds`, che i vertici soppressi li
   contiene). Assegnare una reference verso un singleton nascosto crea quindi un arco RF verso un
   nodo che non esiste. E il difetto **esiste già oggi**, senza commit B: nascondere i singleton
   lascia in stato RF gli archi che li toccavano, perché il ramo `hide` del toggle fa solo
   `setNodes`.
4. **Un guard morto trovato per strada**: `useJjomSync.ts:670` e `:764` chiamano
   `isSingletonSuppressed(objId)` con l'id di un **DObject**, mentre il Set contiene id di
   **DVertex**. Sempre falso.
5. **`.ir-node-content` ha `overflow: hidden`** (`irStyle.ts:72`), mentre `.mm-node` ce l'ha
   **commentato** (`EditorV2.scss:1625`). È la differenza esatta per cui il popover dell'enum
   funziona nel ramo nativo: riusato tale e quale dentro l'IR verrebbe tagliato.

---

## 1. File letti (path completi)

Perimetro dichiarato dal prompt:

- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (intero)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (60-145, 200-240, 275-330, 390-420, 490-520)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` (intero)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` (100-150)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/sync/canvasToJjom.ts` (1460-1580)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/hooks/useJjomSync.ts` (655-680, 755-775, 1195-1215, 1245-1345)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` (intero)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/sync/syncState.ts` (150-179)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/EditorV2.tsx` (628-670, 676-822, 1880-1935, 3979, 4160)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (160-170, 340-390, 498-600)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/components/InlineEnumSelect.tsx` (intero)
- `/Users/alfonso/jjodel/frontend/src/model/logicWrapper/LModelElement.tsx` (4600-4650, 6760-6900, 7570-7660, 7700-7850)

Allargamenti, tutti dichiarati:

- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/IRRow.tsx` (intero, 37 righe) — chiude D1 sul ramo dispatch con una lettura invece che con un'assunzione.
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (20-60, 70-130, 160-180) — è dove vivono `overflow`, `z-index` e `ir-row__value--editable`: D6 e D7 non sono rispondibili senza.
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/contexts/EditorContext.tsx` (intero) — il canale candidato di D3.
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/EditorV2.scss` (1620-1630, 2339-2360, 4132-4136) — `.mm-node` overflow e `.inline-type-select`.
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/hooks/useEditorMode.ts` (225-240, 300-320) — costo di `getMetaclassInfo`, per D2.

Documentazione: `CLAUDE.md`; `docs/decisions.md` (serie R-SGL, 1-9f);
`docs/discovery/discovery_2026-08-26_singleton_instantiability.md` (§2.2, §7);
`docs/claude-code-log.md` (coda, incluse le due entry del commit A).

---

## 2. D1 — Dove si rende una riga reference

### 2.1 Ramo IR — l'unico con righe reference

`IRNodeContent.tsx` costruisce le righe da `compartmentSig` (`:120-142`), che separa attributi e
reference sul `kind` (`'A'` / `'R'`, `:131`), e le distribuisce in `rows.attributes` /
`rows.references` (`:144-156`). Il compartimento sceglie la sorgente a `:399`:

```ts
const source = fc.source === 'references' ? rows.references : rows.attributes;
```

Il segmento `value` è reso a `:413-443`, e l'editabilità è:

```ts
const editable = row.editableValue && (seg as any).editable !== false;   // :414
```

con `editableValue: kind === 'A'` (`:151`). **Le righe reference sono rese, ma mai editabili.**
Il valore mostrato (`row.value`) è la lista dei nomi degli oggetti puntati, calcolata nel
selettore a `:135-138`.

Perimetro di R-SGL-4: **questo `case 'value'`**, e solo per `kind === 'R'`.

### 2.2 Ramo nativo — non ha righe reference

`ObjectNode.tsx:387`:

```ts
const existingAttrs = data.features?.filter(f => f.featureKind === 'attribute') ?? [];
```

e `:388` `hasFeatures = existingAttrs.length > 0 || missingAttributes.length > 0`. Il corpo del
nodo (`:507-658`) itera `existingAttrs` e `missingAttributes` (placeholder di co-evoluzione,
anch'essi attributi: `:162-170`). **Nessuna reference compare come riga.** Le reference nel ramo
nativo si vedono solo come **archi**.

Conseguenza per R-SGL-4: non c'è «stesso gesto» da applicare. Renderla applicabile richiederebbe
un compartimento reference nuovo in `ObjectNode`, con il suo modello dati (`ObjectNodeData.features`
oggi porta solo attributi), la sua co-evoluzione dei placeholder e il suo stile. **Stima: fronte a
sé, dello stesso ordine di grandezza di B intero.** Raccomandazione: ramo nativo **fuori** da B,
dichiarato — con i singleton nascosti e un viewpoint classic, la reference resta non assegnabile.
→ §10, Q1.

### 2.3 Ramo dispatch — fuori per costruzione, confermato

`IRRow.tsx` (37 righe, letto per intero) rende un figlio di composizione come riga di testo e il
suo docblock dichiara: *«Read-only (spec R2 P2: no selection, no inline editing — nothing but
rendering)»*. Il template è `compiled.template.map(seg => <span>)` (`:29-32`): nessun segmento
`value`, nessun handler. **Confermato fuori.**

---

## 3. D2 — Il predicato «singleton-conforme» a livello di riga

### 3.1 Cosa serve, e quando

Due domande diverse, con costi diversi:

| Domanda | Quando | Dato che serve |
|---|---|---|
| La riga è editabile? | **a ogni render** di ogni nodo IR | il tipo dichiarato `T` della riga, e se `T` è singleton-conforme |
| Quali sono i candidati? | **all'apertura** della select, una volta | le istanze conformi a `T`, singleton, nel modello corrente |

Metterle sullo stesso piano è l'errore da evitare: la prima è nel percorso caldo.

### 3.2 Da dove viene la `DReference` della riga

**Oggi non c'è.** `compartmentSig` emette per feature
`${kind};${fid};${feat.name};${typeObj?.name};${display}` (`:139`), dove `fid` è l'id del
**`DValue`** (lo slot), non della `DReference`. Il nome del tipo c'è, **l'id no**.

Ma il selettore **legge già** `feat.type` una riga sopra (`:136`):

```ts
const typeObj = typeof feat.type === 'string' ? lookup?.[feat.type] : null;
```

quindi aggiungere l'id costa un token nella stringa e zero letture nuove. Proposta:

```ts
parts.push(`${kind};${fid};${feat.name ?? ''};${typeObj?.name ?? ''};${feat.type ?? ''};${display}`);
```

**Effetto sulla firma**, da dichiarare: la stringa cresce di un campo per feature, e diventa
sensibile al **retarget del tipo verso una classe omonima** — oggi un cambio di `type` che non
cambia il nome non invalida la memo di `rows`. È un miglioramento, non una regressione, ma è un
cambio di comportamento della firma e va detto. `CompartmentRowData` guadagna `typeId: string`.

Alternativa senza toccare la firma: risolvere `fid → dv.instanceof → feat.type` da `idlookup` **a
ogni render, per ogni riga**. Costa due letture di dizionario per riga ma **fuori dal selettore**,
quindi non memoizzate e ripetute a ogni re-render del nodo. Peggiore. Scarto.

### 3.3 Da dove viene `MetaclassInfo` — e perché NON `getMetaclassInfo` per render

`getMetaclassInfo(modelId)` (`useEditorMode.ts:234`) è `resolveM1Info` puro: raccoglie ogni id di
classe del metamodello scendendo nei package, risolve un L-proxy per ciascuna, costruisce
`attributes` + `allAttributes` + `references` per ognuna, poi un secondo passo ricorsivo per
`concreteSubclasses` e un terzo per i composition target. **Nessuna memoizzazione**: è ricalcolato
per intero a ogni chiamata (il commento a `:227-229` lo dice: «Pure over store.getState() + L-proxies»).

Chiamarlo dentro `IRNodeContent` significherebbe O(metamodello) **per nodo, per render**. Su un M1
con 50 nodi e un metamodello di 30 classi è un ricalcolo completo 50 volte per ogni tocco dello
store. **Da escludere.**

Nota di layer: `viewpoint/ir/` oggi importa da `useEditorMode` **solo il tipo**
(`irInteraction.ts:20`, `import type`). Un import runtime sarebbe il primo.

### 3.4 La forma proposta: precalcolo in EditorV2, consumo via context

`EditorV2` ha già `modeInfo` da `useEditorMode`, **memoizzato** sulla firma di reattività — che
dopo il commit A include `isSingleton` (`useEditorMode.ts:173`). Da lì si deriva una volta:

```ts
// EditorV2, accanto a irPalette
const singletonConformTypeIds = useMemo(() => {
    const out = new Set<string>();
    for (const c of modeInfo.allClasses) {
        if (c.isSingleton) { out.add(c.id); continue; }
        // R-SGL-4: tipo i cui sottotipi concreti sono TUTTI singleton (e ce n'è almeno uno)
        if (c.concreteSubclasses.length > 0 && c.concreteSubclasses.every(s => s.isSingleton)) out.add(c.id);
    }
    return out;
}, [modeInfo.allClasses]);
```

e si passa nel context (§4). Il costo per render di riga diventa **un `Set.has`**.

Attenzione a un dettaglio di R-SGL-4: *«classe i cui sottotipi concreti sono tutti singleton»*.
`concreteSubclasses` è popolato con i discendenti **non astratti** (`useEditorMode.ts:466-478`), e
il commit A **non lo filtra** per singleton, di proposito (R-SGL-6) — quindi qui contiene
esattamente ciò che serve. Il caso `concreteSubclasses.length === 0` va deciso: una classe
concreta non singleton senza sottotipi non è conforme (già escluso dal primo ramo); una classe
**astratta senza sottotipi concreti** non ha istanze possibili — `every` su array vuoto è `true`,
da qui la guardia `length > 0`. → §10, Q2.

### 3.5 I candidati, all'apertura

Filtro completo, come da prompt:

1. conformità: `conformsToRefTarget(ref, o.instanceof, classById)` (`irInteraction.ts:107-111`) —
   direttamente `T`, oppure discendente concreto di `T`;
2. `isSingleton` sulla metaclasse;
3. **`o.model` uguale al modello dell'oggetto della riga**.

Il punto 3 non è opzionale: `DClass.instances` è piatto sul progetto (report di A §7b,
`LModelElement.tsx:2642`), quindi senza il filtro la select offrirebbe i singleton **degli altri
M1**, che conformano al tipo ma non sono valori legittimi per questo oggetto.

Il modello dell'oggetto: `IRNodeContent` ha `objectId` e `vertexId`, non `modelId`. Tre vie —
`lookup[objectId].father` (vale solo per un oggetto radice: per un figlio di composizione `father`
è un `DValue`), `LPointerTargetable.fromPointer(objectId).model.id` (corretto ma è un proxy), o
**il `modelid` che EditorV2 già ha**, passato nel context insieme al resto. La terza è la sola che
non aggiunge letture. Raccomandata.

---

## 4. D3 — Lo stato «nascosti» in modo reattivo

### 4.1 I tre canali di oggi, e perché nessuno serve così com'è

| Canale | Dove | Reattivo per un figlio? |
|---|---|---|
| `localStorage['jjodel.showSingletons.<modelid>']` | scritto da `Navbar.tsx:660`, letto da `EditorV2.tsx:793` | no (e il prompt vieta di leggerlo da `viewpoint/ir/`) |
| `suppressedSingletonIds` (Set di modulo) | `syncState.ts:159-179` | **no**: Set mutabile, nessuna sottoscrizione |
| evento `TOGGLE_SINGLETONS` | `Navbar.tsx:663` → `EditorV2.tsx:817` | sì, ma solo per chi si registra |

### 4.2 Il precedente esatto è già in casa

`EditorV2.tsx:635-666` è un blocco intitolato **«View toggles — mirror state»**: quattro
`useState` seminati da `localStorage` e aggiornati da altrettanti listener sugli eventi del menu
View. Uno di questi — `showEdgeLabels` (`:642-644`) — **viaggia già dentro `EditorContext`**
(`EditorContext.tsx:15-16`, valore a `EditorV2.tsx:3979`) ed è consumato dai nodi.

`showSingletons` è lo stesso identico problema, con una sola differenza: la chiave e l'evento sono
**per modello** (`detail: { modelId, show }`, `Navbar.tsx:663`), quindi il mirror deve filtrare
`eventModelId !== modelid` esattamente come fa `handleToggleSingletons` a `:678`.

**Proposta (raccomandata)**: estendere il blocco mirror e `EditorContext`.

```ts
// EditorV2, nel blocco :635-666
const [showSingletons, setShowSingletons] = useState(() => {
    try { return localStorage.getItem(`jjodel.showSingletons.${modelid}`) === 'true'; } catch { return false; }
});
// nel useEffect dei listener, accanto agli altri quattro:
const handleSingletons = (e: Event) => {
    const d = (e as CustomEvent).detail;
    if (d?.modelId !== modelid) return;
    setShowSingletons(!!d.show);
};
```

Costo: ~8 righe in `EditorV2.tsx`, 3 campi nuovi opzionali su `EditorContextValue`
(`showSingletons`, `singletonConformTypeIds`, `modelId`), zero file nuovi, zero
`localStorage` dentro `viewpoint/ir/` — il vincolo del prompt è rispettato per costruzione.
`IRNodeContent` legge con `useEditorContextSafe()` (`EditorContext.tsx:29-31`), che ritorna `null`
fuori dal provider e non lancia: importante, perché `IRNodeContent` è montato anche in contesti di
anteprima dell'authoring.

**Scartate**: un context nuovo dedicato (un secondo provider per un booleano, quando quello
esistente porta già un booleano gemello); il `useState` locale con listener dentro
`viewpoint/ir/` (duplicherebbe il mirror per ogni nodo — N listener invece di uno, e leggerebbe
`localStorage` dove il prompt lo vieta).

**Nota di correttezza sul mirror**: `EditorV2` monta un solo editor per `modelid`, ma il seme
iniziale dipende da `modelid`, che può cambiare. Il `useState` con initializer lo legge **una sola
volta**; serve un `useEffect` di risemina al cambio di `modelid`, oppure la stessa chiave di
remount che l'editor già usa. → §10, Q3.

---

## 5. D4 — Il write path per una reference

### 5.1 Cosa accetta `featureProxy.value = x`

`LValue.set_value` sta a **`LModelElement.tsx:7803`**, non a `:4609` come dice il prompt: quella
riga è `LEnumLiteral.set_value`, che scrive l'**ordinale** di un letterale enum. Segnalo la
citazione, non la ricostruisco (RC-10).

```ts
protected set_value(val: D["values"][0], c: Context): boolean {          // :7803
    let v: ValueDetail = this.get_value(c, false, false, false, true, true);
    let val_id = (val as any)?.id || val;                                // :7805
    if (Pointers.isPointer(val_id) && c.data.values.includes(val_id as any) && this.get_isContainment(c)) { return true; }
    let r = this.get_setValueAtPosition(c)(v?.index || 0, val_id || val);
    Log.e(!r.success,  r.reason);
    return r.success;
}
```

- **Accetta entrambi**: `(val as any)?.id || val` normalizza un proxy in id (`:7805`). ✔
- È una **sostituzione alla posizione corrente** (`v?.index || 0`), non un append.
- `setValueAtPosition` (`:7606`) rifiuta con `{success:false, reason:"identical assignment"}` se
  `oldval === val`, e con `"invalid pointer"` se l'id non risolve; per un `DObject` bersaglio fa i
  side-effect di `pointedBy` e, se la reference è containment, di `father`.

### 5.2 Il no-op sullo slot vuoto — misura, non deduzione

`EditorV2.tsx:1897-1899`, commento di `handleObjectEdgeSelected`:

> *Write shape: `.values = [...meaningful, id]` like syncCreateReferenceLink — on an EMPTY
> reference slot `.value =` is a silent no-op (verified with an in-browser probe 2026-07-20).*

È una misura di un'altra sessione, **non riprodotta qui**. Ma è coerente con due fatti che ho
letto: `set_value` calcola l'indice da `get_value(...)`, che su uno slot senza valori non ha una
posizione da restituire; e **tutti e tre** i siti che scrivono una reference M1 in editor-v2 usano
la forma con `values`, mai `.value`:

- `canvasToJjom.ts:1543-1548` (`syncCreateCompositionLink`): `refProxy.values = [...meaningful, childObject.id]`
- `EditorV2.tsx:1900-1905` (`writeSlot` di object-as-edge): identico
- `useM1ReferenceEdges` non scrive slot (crea solo archi)

Il commento a `canvasToJjom.ts:1541-1545` aggiunge il perché del `meaningful`: il getter L-layer
`.values` **imbottisce di `undefined`** gli slot vuoti fino a `lowerBound`, e quella imbottitura
faceva finire il target all'indice 1 invece che a 0 su una reference `[1..1]`. Da qui la lettura
da `__raw.values` e il filtro.

### 5.3 `syncUpdateFeatureValue` basta? No

`canvasToJjom.ts:1472-1497`. La firma è
`(objectVertexId, featureName, newValue: string | number | boolean | null)` e il corpo fa
`featureProxy.value = newValue` dentro una `TRANSACTION`. Un id è una stringa, quindi
**compilerebbe**; ma:

1. sullo slot vuoto — il caso normale della prima assegnazione — è il no-op di §5.2;
2. non sa distinguere `replace` da `append`, e per `0..N` R-SGL-4 vuole l'append;
3. il suo nome e il suo tipo dichiarano «valore scalare»: passarci un id di oggetto è un abuso che
   la prossima persona non si aspetta.

**Serve il secondo entry point**, come propone il prompt:

```ts
export function syncSetReferenceValue(
    objectVertexId: string,
    featureName: string,
    targetObjectId: string | null,          // null = clear, solo per replace
    mode: 'replace' | 'append',
): void
```

Corpo, sulla forma canonica:

```ts
TRANSACTION(`EditorV2 set ref ${featureName}`, () => {
    const slot = (lObject as any)['$' + featureName];
    if (!slot) return;
    const meaningful = (slot.__raw?.values ?? []).filter((v: any) => v != null && v !== '');
    if (mode === 'append') slot.values = [...meaningful, targetObjectId];
    else slot.values = targetObjectId ? [targetObjectId] : [];
});
```

### 5.4 Un solo passo di undo

Sì, e per lo stesso meccanismo verificato nel commit A: `set_values` (`:7707`) apre la propria
`TRANSACTION` (`:7746`), che annidata dentro quella del chiamante gira a profondità > 0 e non
chiude nulla; `FINAL_END` emette una sola `CompositeAction`; l'undo lavora su un delta per dispatch
(`reducer.ts:1260`). ✔

**Ma attenzione**: l'arco che ne consegue **non** nasce nella stessa transazione.
`useM1ReferenceEdges` è un `useEffect` che scatta sul cambio della firma, quindi dopo il commit —
`DVoidEdge.new2` apre la sua transazione, secondo dispatch, **secondo passo di undo**. È già così
oggi per ogni assegnazione da pannello Slots; B non lo peggiora, ma il vincolo «un solo undo» vale
per la scrittura del valore, non per l'arco. Da dichiarare nel LIR. → §10, Q4.

---

## 6. D5 — L'arco, con i singleton nascosti e quando tornano visibili

**È la domanda che decide il LIR, e la risposta è che il terreno è già rotto.**

### 6.1 La soppressione è applicata in un percorso su due

`suppressedSingletonIds` (`syncState.ts:159`) contiene **id di DVertex** — lo scrivono
`EditorV2.tsx:785` (`vid` da `graph.subElements`) e `:812` (`seId`, idem).

| Sito | Percorso | Chiave usata | Filtro degli archi |
|---|---|---|---|
| `useJjomSync.ts:1204` | init (full transform) | vertice ✔ | `nodeCache.has(source) && nodeCache.has(target)` (`:1211`) → **il nodo soppresso non è in cache, l'arco è escluso** ✔ |
| `useJjomSync.ts:1280` | incrementale, aggiunta nodi | vertice ✔ | — |
| `useJjomSync.ts:1302` | incrementale, aggiunta archi | — | `currentIds.has(source) && currentIds.has(target)` — `currentIds` è `new Set(subElementIds)`, e **il vertice soppresso è in `subElements`** ✗ |

Quindi: **in init la coerenza c'è, in incrementale no.** Un arco creato mentre il bersaglio è
nascosto viene spinto nello stato RF con un `target` che non ha nodo.

### 6.2 Scrivere una reference verso un singleton nascosto

Catena completa, letta:

1. `slot.values = [...]` → `SetFieldAction` su `DValue.values`;
2. `useM1ReferenceEdges` si risveglia (la sua firma `m1RefValuesSig`, `:64-85`, è esattamente
   l'elenco delle triple `objId:refMetaId:tgtId`);
3. costruisce `vertexByModel` da `graph.subElements` (`:110-113`) — **senza consultare
   `isSingletonSuppressed`**: il vertice del singleton nascosto c'è, quindi `tgtV` risolve;
4. crea il `DVoidEdge` (`:168-177`). **Il D-layer è corretto**: l'arco esiste e persiste;
5. `subElements` cambia → sync incrementale → `:1302` lo lascia passare → `setEdges` con un
   `target` assente dai nodi RF.

Cosa fa React Flow con un arco il cui nodo bersaglio non è nell'array dei nodi: lo scarta al
rendering e logga. **Non l'ho verificato in browser** — è il punto che la verifica visiva della
Fase 2 deve misurare, console compresa. → §10, Q5.

### 6.3 Il caso inverso, già possibile oggi senza commit B

Assegnare la reference con i singleton **visibili** (tirando l'arco), poi **nasconderli**. Il ramo
`hide` di `handleToggleSingletons` (`EditorV2.tsx:770-791`) fa:

```ts
for (const vid of vertexIdsToHide) suppressSingleton(vid);
setNodes(nds => nds.filter(n => !vertexIdsToHide.includes(n.id)));
```

**Nessun `setEdges`.** Gli archi che toccavano quei nodi restano nello stato RF. Stessa condizione
del §6.2, raggiunta da un'altra strada, e **presente da prima di questo fronte**. È il difetto che
B renderà evidente, non un difetto che B introduce.

### 6.4 Quando il toggle li rimostra

Il ramo `show` (`:693-763`) toglie la soppressione e riaggiunge i nodi con
`jjomVertexToRFNode` + `setNodes`. Non tocca gli archi. Due sotto-casi:

- se l'arco era **rimasto** nello stato RF (§6.2, §6.3), ricompare da sé appena il nodo torna;
- se l'arco non c'era mai stato perché la sessione era partita con i singleton nascosti (init a
  `:1211` lo aveva escluso correttamente), **non torna**: nulla rifà il full transform,
  `initializedRef` resta `true` (`:1190`), e l'aggiunta incrementale non scatta perché
  `subElements` non è cambiato. Serve un reload.

Il secondo è un buco vero, e sta **sul percorso corretto**: è il prezzo di aver filtrato bene in
init e mai più.

### 6.5 Il guard morto

```ts
// useJjomSync.ts:670 e :764
for (const objId of (rawModel.objects ?? [])) {
    ...
    if (vertexIdByModelId.has(objId)) continue;
    if (isSingletonSuppressed(objId)) continue;     // ← objId è un DObject
```

`isSingletonSuppressed` interroga un Set di **id di DVertex** (§6.1). La condizione è **sempre
falsa**. Oggi è mascherata dalla riga precedente — un singleton nascosto il suo vertice ce l'ha,
quindi il `continue` scatta prima. Si scopre solo nel caso «singleton senza vertice + nascosti»,
dove Step 4 creerebbe un vertice per un nodo che non va mostrato. Registrare, non correggere qui.
→ §10, Q6.

### 6.6 Cosa ne segue per la Fase 2

La scelta non è fra «fare» e «non fare», ma fra due perimetri:

- **(α) minimo**: B scrive il valore e basta; §6.2-§6.4 restano come sono. La feature funziona
  (il valore è scritto, la riga lo mostra) ma la console si sporca e mostrare/nascondere non è
  simmetrico.
- **(β) coerente**: B allinea il percorso incrementale a quello di init — `:1302` filtra anche
  su `isSingletonSuppressed`, e il ramo `hide` toglie dallo stato RF anche gli archi incidenti.
  Sono due modifiche piccole ma **dentro `useJjomSync.ts`**, cioè in piena critical zone §3.1,
  con tutto ciò che comporta.

Non raccomando da qui: è una decisione di rischio. → §10, Q5.

---

## 7. D6 — Il componente

### 7.1 `InlineEnumSelect` così com'è: no

`InlineEnumSelect.tsx` è keyed **sui nomi**: `value: string`, `literals: {name}[]`,
`onChange(value: string)` (`:7-14`, `:31-33`, `:116`). Per le reference il valore è un **id**, e i
nomi delle istanze non sono garantiti unici (nulla lo impone in `DObject`). Mappare nome→id nel
chiamante funziona finché due candidati non condividono il nome, e poi rompe in silenzio scegliendo
il primo. Su un `Color` con `Red`/`Green`/`Blue` è innocuo; su istanze rinominate a mano no.

### 7.2 Tre ostacoli concreti, tutti verificati per lettura

**(a) `overflow: hidden`.** `irStyle.ts:72`:

```
.ir-node-content { box-sizing: border-box; background: ...; overflow: hidden; }
```

mentre `.mm-node` ha `// overflow: hidden;` **commentato** (`EditorV2.scss:1625`). Il popover è
`position: absolute; top: 100%` dentro un `.inline-type-select { position: relative }`
(`EditorV2.scss:2339-2349`): nel ramo nativo esce dal nodo, **nel ramo IR verrebbe tagliato**. È la
stessa famiglia del gotcha §15.2 di `CLAUDE.md`. Peggio: le forme `diamond` e `cylinder`
rimettono `overflow: visible` (`irStyle.ts:106`, `:122`), quindi il taglio dipenderebbe dalla forma
— incoerenza peggiore del taglio.

Rimedi possibili: un portal su `document.body` con posizionamento calcolato (come fa il
`ContextMenu` del canvas), oppure un `overflow: visible` condizionato alla presenza della select
aperta. Il primo è più codice ma non tocca il box del nodo; il secondo è una riga ma cambia il
clipping del nodo mentre la select è aperta. → §10, Q7.

**(b) `nodrag` / `nowheel`.** Nel repo `nodrag` esiste, usato dagli stub di `ClassNode`
(`:508`, `:659`, con il commento «`nodrag` stops ReactFlow from panning the node»).
`InlineEnumSelect` **non lo porta**: si affida a `stopPropagation` sugli eventi sintetici React
(`:100-101`). Se questo basti dentro un nodo React Flow non è decidibile staticamente — la
sottoscrizione di drag è nativa sull'elemento del nodo, e la propagazione sintetica di React
risale dal root del documento, cioè **dopo**. Nel ramo nativo il componente è in produzione, il che
è evidenza d'uso ma non prova che non ci sia un micro-drag. Nel ramo IR la catena di antenati è
diversa. **Da misurare in Fase 2**, con `nodrag`/`nowheel` come rimedio già in casa.

**(c) `(none)` e i duplicati.** `InlineEnumSelect` mette `(none)` **sempre** in testa (`:27`).
Per una reference `0..1` significa svuotare — corretto. Per `0..N` in modalità append non ha
senso, e il componente non sa distinguere. E per `0..N` le opzioni devono escludere i valori già
presenti: `InlineEnumSelect` non ha il concetto.

### 7.3 Proposta

Un componente nuovo, **stessi stili**, nessuno SCSS nuovo: riusa le classi
`.inline-type-select*` (`EditorV2.scss:2339`, `:4132`), che sono già condivise fra
`InlineTypeSelect` e `InlineEnumSelect` — il precedente di riuso c'è ed è dichiarato nel docblock
di `InlineEnumSelect:17-18`.

Nome verificato con `grep -r` su tutto `frontend/src`: **`InlineObjectSelect` è libero** (exit 1;
controllo positivo `InlineEnumSelect` = 7 riscontri). Forma:

```ts
interface InlineObjectSelectProps {
    value: string | null;                       // id corrente (replace) o null
    typeName: string;                           // intestazione del gruppo
    options: Array<{ id: string; name: string }>;
    allowNone: boolean;                         // 0..1 sì, 0..N no
    onChange: (objectId: string | null) => void;
    onClose: () => void;
}
```

Il resto (tastiera, click fuori, Escape, scroll dell'evidenziato) si copia da `InlineEnumSelect`:
è ~60 righe e riscriverle a mano è più rischioso che clonarle. Alternativa da valutare:
generalizzare `InlineEnumSelect` a `{value, label}` e usarlo per entrambi — meno codice totale, ma
tocca un componente in produzione nel ramo nativo. → §10, Q8.

---

## 8. D7 — Visualizzazione del valore

`row.value` è già la lista dei nomi (`IRNodeContent.tsx:135-138`): con una sola istanza singleton
assegnata mostra il suo nome, che è esattamente ciò che serve.

L'affordance esistente è `ir-row__value--editable` (`irStyle.ts:174-175`):

```
.ir-node-content .ir-row__value--editable { cursor: text; }
.ir-node-content .ir-row__value--editable:hover { background: rgba(14,165,233,0.08); border-radius: 3px; }
```

L'hover ciano è quello giusto e non costa nulla riusarlo. **Il `cursor: text` invece è
semanticamente sbagliato** per qualcosa che apre una select: dice «qui si scrive».

Proposta minima, senza SCSS nuovo: riusare la classe e accettare il cursore sbagliato **non** è
onesto; una riga in `irStyle.ts` è il costo reale:

```
.ir-node-content .ir-row__value--select { cursor: pointer; }
```

più la classe applicata insieme a quella esistente. Il chevron dell'enum nativo
(`mm-field__enum-chevron`) lo scarterei: nel ramo IR le righe sono strette e il segmento `value` è
uno fra molti in un `flex` con `gap: 4px` (`irStyle.ts:54`), un glifo in più stringe il testo.
Con `overflow: hidden; text-overflow: ellipsis` su ogni span (`:55`), il nome dell'istanza è già
il primo a essere tagliato. → §10, Q9.

---

## 9. Bozza del Layer Impact Report (per la Fase 2)

```
LAYER IMPACT REPORT — assegnazione di una reference singleton da select

Layers touched:
  [x] D-layer      — SetFieldAction su DValue.values (via LValue.set_values)
  [x] L-layer      — nessun setter nuovo: si usa set_values esistente
  [ ] JjOM         — nessuna entità creata o distrutta
  [x] Canvas v2-flow — la riga diventa interattiva; l'arco lo crea useM1ReferenceEdges
  [ ] Canvas classic — non toccato
  [?] Sync layer   — SOLO se si sceglie il perimetro (β) di §6.6
  [ ] Persistence  — nessuna migrazione: nessun jsxString, nessun campo D nuovo

D-layer — cosa cambia:
  Una sola SetFieldAction su DValue.values dello slot della riga, nella forma canonica
  `values = [...meaningful, id]` (replace: `[id]`; clear: `[]`).
  NON cambia: nessun DObject creato, nessun DVertex, nessuna DReference.
Cross-layer:
  L'arco NON nasce in questa transazione: useM1ReferenceEdges reagisce alla firma dopo
  il commit e apre la propria (DVoidEdge.new2). Due dispatch, due passi di undo — già
  così oggi per il pannello Slots. Il vincolo «un solo undo» copre la scrittura del valore.
Side-effect safety:
  set_values → setValueAtPosition fa i side-effect di pointedBy e, per una containment,
  di father. Le reference singleton-conformi non sono containment per costruzione
  (un singleton non è figlio di nessuno), ma il codice non lo assume.
Nessun `.new()` avvolto: nessun creatore entra in una TRANSACTION esterna.

Smoke-test scenarios:
  - singleton nascosti → doppio click su riga `color: Color` → select con Red/Green/Blue
    → scelta → il nome compare nella riga, un solo ⌘Z lo toglie
  - stesso gesto con i singleton VISIBILI → la riga NON è editabile, resta l'arco
  - 0..N: due scelte successive aggiungono, non sostituiscono
  - due M1 sullo stesso M2: la select mostra solo i singleton del modello corrente
  - toggle mostra/nascondi dopo l'assegnazione → §6.2-§6.4, console compresa
```

---

## 10. Domande aperte per Alfonso

**Q1 — Il ramo nativo resta fuori?** Non ha righe reference (`ObjectNode.tsx:387`), quindi non c'è
il «doppio click sulla riga» di R-SGL-4 da abilitare. Renderlo capace significa aggiungergli un
compartimento reference: fronte a sé. Confermi che B è solo IR, e che con un viewpoint classic la
reference verso un singleton nascosto resta non assegnabile?

**Q2 — «tutti i sottotipi concreti singleton»: e se non ce ne sono?** Propongo di richiedere
`concreteSubclasses.length > 0`, così un tipo astratto senza discendenti concreti non risulta
conforme per vacuità. Confermi.

**Q3 — Il mirror di `showSingletons` al cambio di `modelid`.** Gli altri quattro toggle del blocco
(`EditorV2.tsx:635-666`) hanno chiavi globali e il problema non ce l'hanno; questo ha la chiave per
modello. Rissemina con un `useEffect` su `modelid`, o ci si appoggia al remount dell'editor? Serve
sapere se l'editor rimonta davvero al cambio di tab modello.

**Q4 — Due passi di undo per valore + arco: si accetta?** È il comportamento di oggi del pannello
Slots, non una regressione. Se si vuole un solo passo serve creare l'arco nella stessa transazione,
il che significa mettere un creatore (`DVoidEdge.new2`) dentro la transazione della scrittura —
**esattamente ciò che §3.3 di `CLAUDE.md` vieta**. Quindi: si accetta, o si apre un fronte a sé.

**Q5 — Perimetro (α) o (β) di §6.6?** È la domanda del LIR. (β) tocca `useJjomSync.ts`, critical
zone, per due modifiche piccole ma vere: il filtro degli archi in incrementale (`:1302`) e la
pulizia degli archi nel ramo `hide` del toggle. (α) lascia il difetto — che **è pre-esistente**,
§6.3 — e accetta la console sporca e l'asimmetria mostra/nascondi. La mia inclinazione è (α) per B,
con (β) come fronte suo con il suo LIR: mescolare una feature e una correzione di sync in un solo
commit è ciò che rende poi illeggibile la bisection. Ma è una tua chiamata.

**Q6 — `isSingletonSuppressed(objId)` a `useJjomSync.ts:670` e `:764`.** Confronta id di DObject
con un Set di id di DVertex: sempre falso, oggi mascherato dal `continue` precedente. Registro come
R-SGL-9g, o entra in (β)?

**Q7 — Il popover dentro `overflow: hidden`.** Portal su `body` con posizionamento calcolato, o
`overflow: visible` condizionale sul nodo mentre la select è aperta? Il primo non tocca il box, il
secondo è una riga ma cambia il clipping del nodo per la durata dell'interazione.

**Q8 — Componente nuovo (`InlineObjectSelect`, nome libero) o generalizzazione di
`InlineEnumSelect` a `{value,label}`?** Il secondo tocca un componente in produzione nel ramo
nativo; il primo duplica ~60 righe di tastiera/click-fuori.

**Q9 — Il cursore.** Riusare `ir-row__value--editable` (che dà `cursor: text`, sbagliato per una
select) o aggiungere una riga in `irStyle.ts` per `cursor: pointer`? Il prompt chiedeva «senza
SCSS nuovo se possibile»: è possibile, ma il cursore mente.

---

## 11. Note di metodo

- Le asserzioni di assenza sono accompagnate dal controllo positivo, come chiede `CLAUDE.md` §5:
  `nodrag`/`nowheel` in `viewpoint/ir/` → nessun riscontro (exit 1) con controllo positivo su
  `editor-v2/` interno = 4 righe in `ClassNode.tsx`; `InlineObjectSelect` → nessun riscontro
  (exit 1) con controllo positivo `InlineEnumSelect` = 3 riscontri.
- Tutte le ricerche via `command grep` (BSD grep), non il wrapper `ugrep` interattivo, perché
  usano `--include`.
- **Riferimenti del prompt che non reggono**: `LValue.set_value` **non** è a `:4609` (lì c'è
  `LEnumLiteral.set_value`, l'ordinale); è a **`:7803`**, e `set_values` a **`:7707`**. L'append
  citato come `:6875` è corretto (`get_add`). `getMetaclassInfo` è a `useEditorMode.ts:234` ✔.
  `IRNodeContent.tsx:151` (`editableValue: kind === 'A'`) ✔; il `case 'value'` è a **`:413`** ✔;
  `syncUpdateFeatureValue` a **`:1472-1497`** ✔; `syncCreateCompositionLink` a **`:1507`** (il
  prompt dice `:1505`, è la riga del docblock).
- Due fatti sono **misure di sessioni precedenti**, citate come tali e non riprodotte:
  il no-op di `.value =` su slot vuoto e l'imbottitura di `undefined` del getter `.values`
  (sonde in-browser del 2026-07-20, registrate nei commenti di `EditorV2.tsx:1897-1899` e
  `canvasToJjom.ts:1541-1545`).
