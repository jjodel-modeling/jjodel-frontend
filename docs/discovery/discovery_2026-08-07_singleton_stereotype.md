# Discovery — notazione singleton: da sottolineato+rombo a stereotipo «singleton»

**Data**: 2026-08-07
**Branch**: `alfonso-frontend-jjtl` (HEAD `0eb281ce7`)
**Fase**: 1 di un two-phase. Read-only: nessun file di prodotto toccato.
**Prompt**: 2026-08-07 discovery notazione singleton stereotipo

---

## 0. Obiettivo

Mappare **dove** vive oggi la notazione di singleton (nome sottolineato sulla metaclasse;
nome sottolineato + glifo a rombo sull'istanza) e **quali strati** dovrebbe toccare la
sostituzione con uno stereotipo testuale `«singleton»` su rigo proprio sopra il nome,
identico su metaclasse e istanza.

Punto fermo non rimesso in discussione: `abstract` resta invariato (corsivo). La divergenza
di trattamento fra `abstract` e `singleton` è voluta.

**Risultato principale (anticipato)**: la resa descritta nel prompt **non è una sola**, e
nessuna delle due passa da un template classic autorabile. Esistono **due binari
indipendenti**, con notazioni oggi *diverse fra loro*:

| | metaclasse singleton | istanza di singleton |
|---|---|---|
| **editor-v2 (flow, React)** | nome **sottolineato** (`.mm-class.singleton`) | badge **rombo pieno** in alto a destra + nome sottolineato **come tutte le istanze** |
| **classic (jsxString + scss)** | glifo **`bi-1-square`** ("1" in un quadrato), nessun sottolineato | card minimale, nome sottolineato **come tutti gli oggetti** + glifo `bi-1-square` da css legacy |

La combinazione esatta descritta nel prompt ("sottolineato + rombo") è quella di
**editor-v2**, ed è codice React nativo (TSX + SCSS), non un `jsxString`.

---

## 1. File letti (path completi)

Codice:

- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/nodes/ObjectNode.tsx`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/nodes/ClassNode.tsx`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/EditorV2.scss`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/EditorV2.tsx` (righe 180-230, 620-775, 2980-3000)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/types.ts`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/utils/jjomTransformers.ts`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/sync/syncState.ts`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irDemoFixture.ts`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/LabelListEditor.tsx`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx`
- `/Users/alfonso/jjodel/frontend/src/common/DV.tsx` (righe 1380-1520, 571, 1715)
- `/Users/alfonso/jjodel/frontend/src/utils/defaultViewTemplate.ts`
- `/Users/alfonso/jjodel/frontend/src/styles/classic-object-view.scss`
- `/Users/alfonso/jjodel/frontend/src/redux/defaults/views.ts` (righe 520-700)
- `/Users/alfonso/jjodel/frontend/src/redux/VersionFixer.tsx` (righe 400-425, 1000-1060)
- `/Users/alfonso/jjodel/frontend/src/model/logicWrapper/LModelElement.tsx` (righe 2640-2900)
- `/Users/alfonso/jjodel/frontend/src/joiner/classes.ts` (righe 940-975, 1110-1120)
- `/Users/alfonso/jjodel/frontend/src/view/viewElement/view.tsx` (righe 420-490)

Documentazione:

- `/Users/alfonso/jjodel/CLAUDE.md`
- `/Users/alfonso/jjodel/docs/claude-code-log.md` (coda)
- `/Users/alfonso/jjodel/docs/decisions.md` (coda)
- `/Users/alfonso/jjodel/docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (grep mirato)
- `/Users/alfonso/jjodel/docs/discovery/discovery_2026-07-27_ts1_textstyle_label.md` (grep mirato)

---

## Q1 — Rendering attuale dell'istanza singleton (sottolineato + rombo)

**Risposta: non è un template. È `ObjectNode.tsx` (editor-v2), codice React nativo.**

### Q1.a — Il rombo

`frontend/src/components/editor-v2/nodes/ObjectNode.tsx:460-464` (ramo nativo):

```tsx
            {isSingleton && (
                <span className="singleton-badge">
                    <i className="bi bi-diamond-fill" />
                </span>
            )}
```

Lo **stesso blocco è duplicato** nel ramo IR, `ObjectNode.tsx:408-412`:

```tsx
                {isSingleton && (
                    <span className="singleton-badge">
                        <i className="bi bi-diamond-fill" />
                    </span>
                )}
```

Il ramo IR sta *prima* del `return` nativo (`ObjectNode.tsx:377` `if (irResolution && !irDelegated) {`),
quindi i due sono mutuamente esclusivi ma il badge è emesso identico in entrambi, **fuori** da
`IRNodeContent` (nel wrapper `.mm-node.mm-object`).

Stile del badge — `frontend/src/components/editor-v2/EditorV2.scss:1737-1755`:

```scss
    // Singleton badge — small diamond icon in top-right corner
    .singleton-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        background: #334155;
        border-radius: 3px;
        font-size: 9px;
        color: #fff;
        pointer-events: none;

        i { font-size: 9px; }
    }
```

Il flag che lo condiziona è letto **live da Redux sulla metaclasse**, non sul nodo —
`ObjectNode.tsx:75-83`:

```tsx
    // Live metaclass name + singleton flag from Redux (reacts to metamodel changes)
    const liveMetaclassInfo = useSelector((state: any) => {
        const classId = data.instanceOfClassId;
        if (!classId) return { name: null, isSingleton: false };
        const dClass = (state.idlookup?.[classId] as any);
        return { name: dClass?.name ?? null, isSingleton: !!dClass?.isSingleton };
    });
    const liveMetaclassName = liveMetaclassInfo.name;
    const isSingleton = liveMetaclassInfo.isSingleton;
```

### Q1.b — Il sottolineato

**Attenzione: il sottolineato dell'istanza NON è condizionato da `isSingleton`.** È la
convenzione UML applicata a *tutte* le istanze M1.

`frontend/src/components/editor-v2/EditorV2.scss:1662-1667`:

```scss
    .mm-object__name {
        text-decoration: underline;           // UML instance convention
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
```

Markup corrispondente, `ObjectNode.tsx:468-490`:

```tsx
            {/* Header: objectName : ClassName — underlined per UML convention */}
            <div
                className="mm-node__header mm-object__header"
                ...
                    <span className="mm-node__name mm-object__name">
                        <span className="mm-object__instance-name">{name}</span>
                        <span className="mm-object__separator"> : </span>
                        <span className="mm-object__class-name">{metaclassName}</span>
                    </span>
```

**Conseguenza per la Fase 2**: "togliere il sottolineato al singleton" sull'istanza significa
o (a) toglierlo a *tutte* le istanze M1 — rottura della convenzione UML, fuori dalla decisione
presa — oppure (b) non toccarlo affatto, perché l'unico marcatore singleton-specifico
sull'istanza è il rombo. **Va deciso esplicitamente da Alfonso** (vedi §8, domanda D1).

### Q1.c — Il binario classic (per completezza: non produce un rombo)

Nel classic esiste una view dedicata `Singleton` (`Pointer_ViewSingleton`), con template in
`frontend/src/utils/defaultViewTemplate.ts:229-237`:

```typescript
export const CLASSIC_SINGLETON_VIEW_JSX: string = `
/* jjodel-classic-singleton v3 */


<View className={'singleton jjodel-classic-singleton'}>
    <div className={'jjodel-classic-object__header jjodel-classic-singleton__header'}>
        <span className={'jjodel-classic-object__name'}>{data.name}</span>
    </div>
</View>`;
```

Il sottolineato arriva dal riuso della classe BEM dell'object,
`frontend/src/styles/classic-object-view.scss:66-68`:

```scss
    // atomic inline-flex ::after that the ancestor (__title) underline cannot
    // span, so we underline the parts directly — one visual line, no seam (delta 7).
    &__name { text-decoration: underline; color: inherit; }
```

Il glifo, invece, **non è un rombo**: è `bi-1-square`, iniettato via css legacy della view in
`frontend/src/redux/defaults/views.ts:668`:

```typescript
            view.css += '.singleton::before {position: absolute; left: 10px; font-family: bootstrap-icons; content: "\\F799";}\n';
```

Verificato: `frontend/node_modules/bootstrap-icons/font/bootstrap-icons.css:1700` →
`.bi-1-square::before { content: "\f799"; }`.

Il resto della card (`frontend/src/styles/classic-object-view.scss:173-182`) è chrome neutro:

```scss
// Singleton — same header band (reuses `.jjodel-classic-object__header` in the
// template), minimal card. Compound on the root to win over legacy `.singleton`
// (which set `background: var(--accent)`, a deprecated token) on un-migrated
// projects.
.singleton.jjodel-classic-singleton {
    background: var(--node-bg);
    ...
}
```

---

## Q2 — Rendering attuale della metaclasse dichiarata singleton (solo sottolineato)

**Risposta: file distinto da Q1, e in un solo binario dei due.**

### Q2.a — editor-v2: sottolineato, come descritto nel prompt

`frontend/src/components/editor-v2/nodes/ClassNode.tsx:443-444, 478`:

```tsx
    const isAbstract = data.isAbstract ?? false;
    const isSingleton = data.isSingleton ?? false;
...
            className={`mm-node mm-class ${selected ? 'selected' : ''} ${isAbstract ? 'abstract' : ''} ${isSingleton ? 'singleton' : ''} ${dragOver ? 'drop-target' : ''} ${hlClass}`}
```

`frontend/src/components/editor-v2/EditorV2.scss:1574-1578`:

```scss
    &.singleton {
        .mm-node__name {
            text-decoration: underline;
        }
    }
```

Il flag entra nel `data` del nodo RF dal transformer,
`frontend/src/components/editor-v2/utils/jjomTransformers.ts:164-168`:

```typescript
        data: {
            label: lClass?.name ?? 'Class',
            isAbstract: !!lClass?.abstract,
            isSingleton: !!lClass?.isSingleton,
```

(Nota l'asimmetria di naming già qui: `abstract` sul L-layer, `isSingleton` sul L-layer — vedi Q3.)

### Q2.b — classic: NON sottolineato, ma un glifo `bi-1-square`

`frontend/src/common/DV.tsx:1448-1449` (header del template `class`, Abstract Syntax v2.2):

```tsx
        {/* Singleton icon */}
        {data.isSingleton && <i className='bi bi-1-square' style={{color: '#64748b'}}></i>}
```

Verificato per grep: **nessun** `text-decoration` / `underline` in `DV.tsx` né in
`redux/defaults/views.ts`. Nel classic la metaclasse singleton non è sottolineata.

**Conseguenza**: la premessa "nome sottolineato sulla metaclasse" vale **solo per
editor-v2**. Se la Fase 2 deve rendere la notazione uniforme sui due editor, il classic parte
da un punto diverso (icona) e va toccato con un intervento non simmetrico.

---

## Q3 — Nome del flag a livello di metaclasse

**Risposta: si chiama `isSingleton` a ogni livello (D e L). Non c'è la doppia forma che affligge
`abstract`.**

Dichiarazione D-layer — `frontend/src/model/logicWrapper/LModelElement.tsx:2658`
(dentro `DClass`, accanto a `abstract`/`interface` alle righe 2640-2641):

```typescript
    isSingleton!: boolean;
```

Dichiarazione L-layer — `frontend/src/model/logicWrapper/LModelElement.tsx:2744-2746`
(dentro `LClass`):

```typescript
    isSingleton!: boolean;
    __info_of__singleton: Info = {type: 'boolean', txt:'A singleton element is always present exactly 1 time in every model.' +
            '\n A single instance is created dynamically and cannot be created by the user.'}
```

Getter/setter L — `LModelElement.tsx:2871-2891` (nota: `isSingleton` e `singleton` sono
**alias sullo stesso campo D `isSingleton`**):

```typescript
    get_isSingleton(c: Context): LClass['isSingleton'] { return this.get_singleton(c); }
    get_singleton(c: Context): LClass['isSingleton'] { return c.data.isSingleton; }
    set_isSingleton(val: boolean, c: Context): boolean { return this.set_singleton(val, c); }
    set_singleton(val: boolean, c: Context): boolean {
        val = U.fromBoolString(val);
        if (c.data.instances.length > 1) { U.alert('e', 'Class cannot become a singleton since there are multiple instances already.','Delete some and retry.'); return true; }
        if (this.get_extendedBy(c).length > 0) { U.alert('e', 'Class cannot become a singleton unless is also final, and is currently extended.', 'Remove the subclasses before.'); return true; }
        TRANSACTION(this.get_name(c)+'.singleton', ()=>{
            SetFieldAction.new(c.data, 'isSingleton', val);
            if (val) {
                SetFieldAction.new(c.data, 'final', true);
                ...
```

Inizializzazione a `false` alla costruzione della DClass —
`frontend/src/joiner/classes.ts:969`:

```typescript
        thiss.isSingleton = false;
```

Popolamento / scrittura, siti censiti:

| Sito | Cosa fa |
|---|---|
| `LModelElement.tsx:2879` | scrittura canonica (`set_singleton`) |
| `LModelElement.tsx:2850`, `:2867` | reset a `false` quando la classe diventa `sealed`/non-`final` |
| `redux/VersionFixer.tsx:418` | `c.isSingleton = !!c.isSingleton; // booleanize the undefined` |
| `joiner/classes.ts:942` | `if (d.isSingleton) lthis.addObject({name: d.name}, c, true);` — creazione automatica dell'istanza |
| `jjomTransformers.ts:167` | lettura L → `data.isSingleton` del nodo RF (metaclasse) |
| `ObjectNode.tsx:80` | lettura D diretta da `idlookup` (istanza) |
| `EditorV2.tsx:632`, `:755` | lettura D per il toggle di visibilità delle istanze singleton |
| `EditorV2.tsx:2993`, `contextMenu/ContextMenu.tsx:477` | pannello proprietà |

**Nota importante per lo stereotipo sull'istanza**: sull'istanza il flag **non esiste**. Non c'è
un `DObject.isSingleton`. Il ramo istanza risale sempre alla metaclasse via
`data.instanceOfClassId` (editor-v2, `ObjectNode.tsx:78-80`) o via `data.instanceof.isSingleton`
(classic, `views.ts:647`). Ogni implementazione dello stereotipo sull'istanza dovrà fare la
stessa risalita.

---

## Q4 — Confine con la famiglia `isKnownDefault`

**Risposta: nel classic, ramo singleton e ramo object sono due `DViewElement` distinte,
separate da una `jsCondition` e da una priorità calcolata. `isKnownDefault` non le distingue
affatto — le tratta come *la stessa* famiglia e le migra sullo stesso IR.**

### Q4.a — Cosa distingue il ramo singleton dal ramo object (runtime classic)

View `Object` — `frontend/src/redux/defaults/views.ts:540-544`:

```typescript
    static object(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Object', DV.objectView(), vp, (view)=>{
            view.appliableToClasses = [DObject.cname];
            view.adaptWidth = true;
            view.adaptHeight = true;
            view.oclCondition = 'context DObject inv: true';
```

View `Singleton` — `frontend/src/redux/defaults/views.ts:643-648`:

```typescript
    static singleton(vp: DViewElement): DViewElement {
        const view = DViewElement.new2('Singleton', DV.singletonView(), vp, (view)=>{
            view.appliableToClasses = [DObject.cname];
            view.adaptWidth = false; view.adaptHeight = false;
            view.jsCondition = 'return data?.instanceof?.isSingleton';
            //view.oclCondition = 'context DObject inv: true';
```

Quindi:

- **stesso** `appliableToClasses = [DObject.cname]` e **stesso** `appliableTo = 'Vertex'`;
- l'unico discriminante è la `jsCondition` `return data?.instanceof?.isSingleton`
  — **`isSingleton === true` sulla metaclasse, nessuna condizione aggiuntiva**;
- il vincitore è deciso dalla priorità, che per entrambe è **calcolata** (nessuna
  `explicitApplicationPriority` esplicita: `joiner/classes.ts:1115` la lascia `undefined`).

Formula — `frontend/src/view/viewElement/view.tsx:456-458`:

```typescript
    get_explicitApplicationPriority(c: Context): this["explicitApplicationPriority"] {
        if (c.data.explicitApplicationPriority !== undefined) return c.data.explicitApplicationPriority;
        else return (c.data.jsCondition?.length || 1) + (c.data.oclCondition?.length || 1); }
```

Conto concreto:

| view | `jsCondition` | `oclCondition` | priorità |
|---|---|---|---|
| Object | `''` → 1 | `'context DObject inv: true'` (25) | **26** |
| Singleton | `'return data?.instanceof?.isSingleton'` (36) | `''` → 1 | **37** |

Su un'istanza di metaclasse singleton entrambe matchano; vince Singleton per 37 > 26. La
separazione **non è strutturale, è numerica e incidentale** (dipende dalla lunghezza delle
stringhe di condizione).

> **Rischio diretto sul fix**: se la Fase 2 tocca la `jsCondition` della view Singleton
> (per esempio riscrivendola più corta), **cambia la priorità** e può farla perdere contro
> Object. Qualunque edit alla `jsCondition` va accompagnato da un
> `explicitApplicationPriority` esplicito, oppure evitato del tutto.

### Q4.b — Cosa fa `isKnownDefault` (e perché non c'entra col ramo)

`frontend/src/redux/VersionFixer.tsx:1021-1031` (migration `2.225 -> 2.226`):

```typescript
        const isKnownDefault = (jsx: string): boolean =>
            jsx === DEFAULT_VIEW_JSX_STRING
            || jsx === DEFAULT_VIEW_JSX_V2_3_LEGACY
            || jsx.includes(V2_3_TO_V3_DETECT_MARKER)
            || jsx.includes(V2_2_TO_V2_3_DETECT_MARKER)
            || jsx.includes(LEGACY_PLACEHOLDER_MARKER)
            || jsx.includes('jjodel-default-view')
            || jsx.includes(CLASSIC_EDGE_RELATION_MARKER)
            || jsx.includes(JJODEL_ABSTRACT_SYNTAX_MARKER)
            || jsx.includes(CLASSIC_EDGEPOINT_VIEW_MARKER)
            || jsx.includes(CLASSIC_ANCHOR_OVERLAY_MARKER)
            || jsx.includes(CLASSIC_VOID_VIEW_MARKER);
```

`isKnownDefault` è un **predicato di riconoscimento tool-generated vs authored**, usato solo
come ramo *else* della classificazione. La distinzione object/singleton/value avviene **prima**,
sui marker — `VersionFixer.tsx:1039-1050`:

```typescript
            const jsx: string = e.jsxString;
            if (jsx.includes(CLASSIC_OBJECT_VIEW_MARKER) || jsx.includes(CLASSIC_SINGLETON_VIEW_MARKER)) {
                e.ir = { ...defaultObjectViewIR(), migratedFrom: 'classic-default' };
                migratedToIR++;
            } else if (jsx.includes(CLASSIC_VALUE_VIEW_MARKER)) {
                e.irLegacyClassic = true;
                markedLegacy++;
            } else if (!isKnownDefault(jsx)) {
                e.irLegacyClassic = true;
                markedLegacy++;
            }
```

**Object e Singleton sono nello stesso `if`, e collassano sullo stesso IR
(`defaultObjectViewIR()`).** Le tre famiglie sono object+singleton (→ IR), value (→ legacy),
resto (→ `isKnownDefault`).

La ragione è documentata a codice —
`frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts:88-94`:

```typescript
/*
 * No singleton IR default: singleton-ness lives on the metaclass
 * (DClass.isSingleton), which the Predicate grammar deliberately cannot reach,
 * and ObjectNode renders the singleton diamond badge natively on the IR branch
 * (the badge sits outside IRNodeContent in the wrapper). The classic
 * CLASSIC_SINGLETON_VIEW_JSX therefore migrates onto defaultObjectViewIR.
 */
```

**Risposta netta alla domanda del prompt**: un fix su singleton *nel binario classic*
(template/`jsCondition`/css della view Singleton) **non tocca** il ramo object, perché sono due
record distinti. Un fix *sulla classificazione* in `VersionFixer` invece li toccherebbe entrambi,
perché condividono il ramo `if`. Un fix *in editor-v2* (`ObjectNode.tsx`) tocca **tutte** le
istanze, singleton e non, perché il componente è uno solo.

---

## Q5 — Il precedente più vicino: dove vive oggi `abstract`

**Risposta: `abstract` è corsivo, ed è nativo in entrambi i binari. Il badge `bi-asterisk`
NON esiste nel codice: è solo un esempio di schema.**

### Q5.a — Il corsivo

editor-v2, `frontend/src/components/editor-v2/EditorV2.scss:1564-1572`:

```scss
    &.abstract {
        .mm-node__header {
            background: var(--class-abstract-header-bg);
        }

        .mm-node__name {
            font-style: italic;
        }
    }
```

classic, `frontend/src/common/DV.tsx:1459-1468`:

```tsx
        {/* Class name - lighter weight */}
        <span style={{
            fontSize: '12px',
            fontWeight: 400,
            color: '#1e293b',
            fontFamily: "'IBM Plex Mono', Monaco, Consolas, monospace",
            fontStyle: data.abstract ? 'italic' : 'normal'
        }}>
            <Input data={data} field={'name'} hidden={true} autosize={true} />
        </span>
```

Da notare: il classic legge **`data.abstract`** (senza prefisso `is`), l'editor-v2 legge
`data.isAbstract` sul nodo RF, alimentato da `jjomTransformers.ts:166`
`isAbstract: !!lClass?.abstract`. Il campo D è `abstract` (`LModelElement.tsx:2640`).
Per `singleton` questa doppia forma **non c'è** (§Q3).

### Q5.b — Il badge `bi-asterisk`: non è cablato, non esiste

Verifiche eseguite:

- `grep -rn "bi-asterisk"` su tutto il repo (esclusi `node_modules`): **zero occorrenze**,
  in codice, in scss e in docs.
- Il documento citato dal prompt, `spec_2026-06-08_ir_schema_v1_1.md`, **non è nel repo**:
  `find . -iname "*ir_schema*"` restituisce solo
  `docs/specs/spec_2026-07-18_ir_schema_v1_2.md`, e
  `git log --all --name-only | grep -i ir_schema` conferma che v1_1 non è mai stato committato.
  Anche nel v1_2, `abstract`/`asterisk` non compaiono (grep mirato: solo la riga 82,
  `| { kind: 'badge'; badge: BadgeSpec }`, che è la grammatica, non un esempio).
- L'unico `BadgeSpec` cablato in tutto il codice è la fixture dev,
  `frontend/src/components/editor-v2/viewpoint/ir/irDemoFixture.ts:70-77`:

```typescript
            badges: [
                {
                    icon: 'bi-play-circle-fill',
                    position: 'tr',
                    visible: { when: { op: 'eq', left: `$${boolAttrName}.value`, right: { kind: 'boolean', value: true } }, then: true, else: false },
                    tooltip: boolAttrName,
                },
            ],
```

  registrata da `window.__jjodelInstallIRDemo` (import dev-only in `ObjectNode.tsx:39`), su una
  metaclasse fittizia `State`/`isInitial`. **Non è una metaclasse in uso.**

**Conclusione Q5, che è il punto operativo**: `abstract` è **ancora classic/nativo su entrambi
i binari** e non passa dall'IR. Non esiste un precedente IR da imitare. Lo strato in cui ha senso
intervenire su singleton è quindi lo **stesso strato nativo** (`ObjectNode.tsx` / `ClassNode.tsx`
+ `EditorV2.scss` per il flow; `DV.tsx` + `defaultViewTemplate.ts` + `classic-object-view.scss`
per il classic), **non l'IR**.

Corollario architetturale già scritto a codice: il singleton **non è esprimibile in IR**, perché
`DClass.isSingleton` è fuori dalla portata della grammatica dei `Predicate`
(`irDefaults.ts:89-91`, citato in Q4.b). Uno stereotipo `«singleton»` reso come label IR
condizionale **non è implementabile** senza estendere la grammatica del Predicate al M2 — che è
un cantiere a sé, non incluso in questa decisione.

---

## Q6 — Multi-label `position: 'top'` nel binario IR

**La condizione del prompt è soddisfatta** (la resa passa *parzialmente* dall'IR: il ramo IR di
`ObjectNode.tsx:377-443` è quello attivo sui viewpoint IR, e il badge rombo è emesso anche lì,
`:408`), quindi rispondo.

### Q6.a — Cosa succede oggi con due label `position: 'top'`

**Si impilano nell'ordine dell'array.** Nessuna sovrascrittura, nessun overlay. Il caso non è mai
stato esercitato in codice né in test, ma il comportamento è determinato e prevedibile.

Rendering — `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx:204, 224-236`:

```tsx
            {compiled.labels.map((l, i) => {
                if (!l.visible(readCtx, objectId)) return null;
                ...
                return (
                    <span
                        key={`label_${i}`}
                        className={`ir-label ir-label--${l.position}`}
                        style={resolveTextStyle(l.style, readCtx, objectId)}
                        ...
                    >
                        {text}
                    </span>
                );
            })}
```

`labels` è un array (`irTypes.ts:119` `labels?: LabelSpec[];`, compilato in
`irTypes.ts:348` `labels: CompiledLabel[];`), mappato 1:1 su `<span>` con `key` indicizzata.
Nessuna deduplicazione per `position` in `IRNodeContent`, e nessuna in
`irCompile.ts:275` e dintorni (i label sono compilati uno per uno).

Layout — `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts:18-23`:

```css
.ir-node-content { position: relative; display: flex; flex-direction: column; min-width: 0; width: 100%; height: 100%; }
.ir-node-content .ir-label { font-size: 11px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ir-node-content .ir-label--top { order: 0; text-align: center; font-weight: 600; }
.ir-node-content .ir-label--center { order: 1; text-align: center; margin: auto 0; font-weight: 600; }
.ir-node-content .ir-label--inside { order: 2; text-align: left; padding: 0 8px; }
.ir-node-content .ir-label--bottom { order: 4; text-align: center; margin-top: auto; }
```

Il contenitore è `display: flex; flex-direction: column`, e i badge (che invece sono
`position: absolute`, `irStyle.ts:24`) non partecipano. Due `.ir-label--top` hanno lo **stesso
`order: 0`**: in flexbox, a parità di `order` vale l'ordine di documento. Quindi due label `top`
diventano **due righe centrate impilate**, la prima dell'array sopra.

Questo è esattamente il layout che serve allo stereotipo: `«singleton»` come label `top` #0 e
il nome come label `top` #1 (o viceversa) darebbe due righe. Nota però il vincolo:
`.ir-label` ha `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` — ogni riga
clippa da sola, non c'è wrapping.

### Q6.b — Superficie di authoring

`position: 'top'` è offerta nel pannello — `LabelEntryEditor.tsx:7-12`:

```tsx
const POSITION_OPTIONS = [
    { value: 'top', label: 'Top' },
    { value: 'center', label: 'Center' },
    { value: 'inside', label: 'Inside' },
    { value: 'bottom', label: 'Bottom' },
];
```

e nulla impedisce di aggiungerne due (`LabelListEditor.tsx:7, 58`):

```tsx
const newLabel = (): LabelSpec => ({ position: 'bottom', source: { from: 'literal', text: '' } });
...
            onAdd={() => onChange([...labels, newLabel()])}
```

Nessun vincolo di unicità per `position`, né in authoring né in `irValidate`.

### Q6.c — Il default IR usa una sola label top

`frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts:38-43`:

```typescript
        shape: {
            form: 'rect',
            labels: [
                { position: 'top', source: { from: 'intrinsic', prop: 'qualifiedName' } },
            ],
        },
```

Tutti gli usi di `position: 'top'` in repo sono singoli (grep: `irDefaults.ts:41`,
`__tests__/irCrossDeps.test.ts:95`, `__tests__/irValidate.test.ts:25`,
`__tests__/ir.test.ts:97,108,111,157,323`). **Nessun test copre due label `top`.**

### Q6.d — TextStyle non ha `decoration`

`frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts:68-74`:

```typescript
export interface TextStyle {
    fontFamily?: Conditional<FontFamilyToken>;
    fontSize?: Conditional<number>;              // px
    fontWeight?: Conditional<FontWeightToken>;
    fontStyle?: Conditional<'normal' | 'italic'>;
    color?: Conditional<string>;                 // same shape as ShapeSpec.fill
}
```

Confermato: nessun asse `textDecoration`. Per lo stereotipo `«singleton»` non serve (è testo
normale su rigo proprio), **ma** significa che via IR non si può togliere il sottolineato
ereditato dal css nativo — se mai servisse, andrebbe fatto in SCSS.

---

## 7. Rischi e dipendenze individuate

**R1 — Il sottolineato dell'istanza è condiviso con tutte le istanze M1.**
`EditorV2.scss:1662-1667` e `classic-object-view.scss:61,68,83,93,100` applicano
`text-decoration: underline` a *ogni* oggetto, non ai soli singleton. Rimuoverlo "per il
singleton" è impossibile senza una regola aggiuntiva `.mm-object.singleton`, che oggi **non
esiste** (l'istanza non porta alcuna classe `singleton`: `ObjectNode.tsx:447` non la emette).
La decisione di design va precisata prima di scrivere il diff.

**R2 — Due binari, due punti di partenza diversi.** La metaclasse singleton è sottolineata in
editor-v2 (`EditorV2.scss:1574`) e marcata con `bi-1-square` nel classic (`DV.tsx:1449`).
Lo stereotipo uniforme richiede due interventi non simmetrici. Toccare `DV.tsx` fa scattare la
**Regola 14 / §3.9**: serve una migration `VersionFixer` che riscriva i `jsxString` persistiti
(la view `class` classic è generata da `DV.class()` e persistita).

**R3 — Toccare `CLASSIC_SINGLETON_VIEW_JSX` richiede marker + migration.**
Il marker `CLASSIC_SINGLETON_VIEW_MARKER = 'jjodel-classic-singleton v3'`
(`defaultViewTemplate.ts:148`) è consumato da due migration (`2.222 -> 2.223` per il rewrite,
`2.225 -> 2.226` per la classificazione IR). Cambiare il template **senza** bump del marker
lascia i progetti salvati sul vecchio jsxString; cambiarlo **con** bump del marker richiede di
allineare entrambe le migration e di verificare l'idempotenza della `2.225 -> 2.226` (che oggi
salta i record con `ir !== undefined`, `VersionFixer.tsx:1037`).

**R4 — La `jsCondition` della view Singleton è anche la sua priorità.**
Vedi Q4.a: 37 vs 26. Un edit alla stringa cambia il vincitore della risoluzione view. Se la
Fase 2 la tocca, deve fissare `explicitApplicationPriority` esplicitamente.

**R5 — Lo stereotipo non è esprimibile in IR.** `DClass.isSingleton` è fuori dalla grammatica
dei `Predicate` per scelta (`irDefaults.ts:89-91`). Una label IR condizionale su singleton
richiederebbe di estendere il Predicate al M2. **Va escluso dallo scope della Fase 2** se non
diventa un cantiere dichiarato.

**R6 — Il badge nel ramo IR è duplicato.** `ObjectNode.tsx:408-412` e `:460-464` sono lo stesso
blocco. Se la Fase 2 sostituisce il rombo, entrambi vanno toccati o il ramo IR resta col rombo.
Un test/grep di chiusura su `singleton-badge` e `bi-diamond-fill` è la verifica minima.

**R7 — Il ramo viewpoint di `ClassNode` perde già oggi sia `abstract` che `singleton`.**
`ClassNode.tsx:424-439`: quando `data.jsxString` è presente il componente ritorna prima, con
`className` `mm-node mm-class viewpoint-wrapper …` — **senza** `abstract` né `singleton`.
Una metaclasse resa da un viewpoint custom non mostra oggi né corsivo né sottolineato. Lo
stereotipo, se implementato come classe css sul wrapper, erediterebbe lo stesso buco.

**R8 — Le istanze singleton possono essere nascoste sul canvas v2.** Esiste un toggle
"Show singleton instances" (`EditorV2.tsx:620-766`, evento `JjodelEvents.TOGGLE_SINGLETONS`)
che sopprime i vertici via `suppressSingleton` (`syncState.ts:148-176`) e li fa saltare a
`useJjomSync` (`:670, :764, :1204, :1275`). Lo smoke visivo della Fase 2 deve verificare
esplicitamente lo **stato del toggle**, o rischia di "non vedere" l'istanza e concludere male.

**R9 — Il glifo `bi-1-square` del classic arriva da css legacy rigenerato.**
`views.ts:668` inietta `.singleton::before { content: "\F799" }`. Come annotato in
`classic-object-view.scss:16-22`, `updateDefaultView` rigenera il css dai sorgenti anche dopo che
`VersionFixer 2.222->2.223` lo ha ripulito. Rimuovere il glifo richiede di toccare `views.ts`,
non solo lo scss.

**R10 — File di feature in working tree sporco.** `frontend/src/view/viewElement/view.tsx`
risulta modificato (`M`) e ci sono `frontend/src/view/viewElement/__tests__/` e
`viewSubtree.ts` non tracciati. `view.tsx` è il file che ospita `explicitApplicationPriority`
(R4). Se la Fase 2 dovesse toccarlo, va prima chiarito lo stato di quelle modifiche.

---

## 8. Domande aperte per Alfonso

**D1 (bloccante per la Fase 2) — Il sottolineato dell'istanza.**
Il prompt dice "nessun sottolineato". Ma sull'istanza il sottolineato **non è la notazione
singleton**: è la convenzione UML per *tutte* le istanze (`EditorV2.scss:1663`, commento
verbatim `// UML instance convention`). Tre letture possibili:
  - (a) `«singleton»` sostituisce **solo** il rombo; il nome dell'istanza resta sottolineato come
    ogni altra istanza — la coerenza UML è preservata;
  - (b) il nome dell'istanza singleton **non** è più sottolineato: serve una nuova classe css
    `.mm-object.singleton` (oggi inesistente) e la notazione diverge dallo standard UML M1;
  - (c) nessuna istanza M1 è più sottolineata — fuori scope, sarebbe una decisione separata.
  Quale?

**D2 — Quali binari.** Solo editor-v2, o anche il classic? Se anche il classic, la Fase 2
tocca `DV.tsx` + `defaultViewTemplate.ts` + `views.ts` + una migration `VersionFixer`,
supera i 5 file e ricade nella **Regola 19** (pausa + conferma preventiva). Se solo editor-v2,
il diff è ~3 file (`ObjectNode.tsx`, `ClassNode.tsx`, `EditorV2.scss`) e nessuna migration.

**D3 — Il glifo `bi-1-square` sulla metaclasse classic.** Se il classic entra nello scope:
va rimosso (`DV.tsx:1449` + `views.ts:668`) e rimpiazzato dallo stereotipo, o resta come
marcatore secondario?

**D4 — Lessema esatto e caratteri.** `«singleton»` con guillemet U+00AB/U+00BB, o `<<singleton>>`
ASCII? Minuscolo confermato? Il font monospace del classic (`'IBM Plex Mono'`, `DV.tsx:1456`) e
il font sans dell'editor-v2 rendono i guillemet in modo diverso; va fissato per evitare un
secondo giro.

**D5 — Stile del rigo dello stereotipo.** Il prompt dice "rigo proprio sopra il nome". Dimensione,
peso e colore: eredita dall'header o è più piccolo/attenuato (tipico UML: stesso corpo, spesso
non-grassetto)? Serve per non dover ricalibrare a occhio in Fase 2.

**D6 — Il precedente IR citato non esiste.** `spec_2026-06-08_ir_schema_v1_1.md` non è nel repo
né in git history, e `bi-asterisk` non compare da nessuna parte (§Q5.b). Se il badge abstract era
un esempio di chat di progetto e non una feature, va confermato — perché toglie l'unico
precedente su cui poggiare una resa IR, e conferma che l'intervento è nativo.

---

## 9. HARD STOP

Fine Fase 1. Nessun file di prodotto toccato; l'unica scrittura è questo report.
Nessuna implementazione dello stereotipo. `abstract` non toccato.
