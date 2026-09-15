# Discovery — R-FRM-3: il canone del valore enum (importer XMI + CHECK 10)

**Data**: 2026-08-28
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: discovery, Fase 1, read-only sul codice. Nessun file `.ts`/`.tsx`/`.scss` modificato.
**Prompt**: `docs/prompts/claude_2026-08-28_0146_discovery_r_frm3_enum_canone.md`
**Protocollo**: P1..P10.

---

## 0. Stato del working tree all'avvio, e perché non mi sono fermato

L'hard stop 2 del prompt dice di fermarsi se il working tree non è pulito. **Non lo è**, ma la
condizione che quella regola protegge non si presenta, quindi ho proseguito dichiarandolo.

Il tree contiene lavoro non committato di un'altra sessione (il nodo istanza): `ObjectNode.tsx`,
`types.ts`, `jjomTransformers.ts`, `EditorV2.scss`, `StatusBar.*`, `featureSignature.ts`, i due
`_colors-*.scss`, più file nuovi in `nodes/`. **Nessuno dei file oggetto di questa discovery è
toccato**: verificato con

```
git status --short -- frontend/src/model/conformance/ \
    frontend/src/services/export/XMIService.ts \
    frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts \
    frontend/src/api/data.ts
```

che esce vuoto. Tutto ciò che ho letto è quindi la versione in HEAD, non una versione a metà.
Il prompt immediatamente precedente della stessa serie (R-FRM-1, 00:45) dava già per presente il
lavoro non committato di altre sessioni e prescriveva `git add` stretto: in questo repo il tree
non è mai pulito in senso letterale, e leggere «pulito» alla lettera renderebbe ineseguibile
qualunque task.

**Ipotesi che questa discovery sta falsificando**: che rendere il validatore tollerante e
l'importer canonico richieda un helper di risoluzione nuovo e attraversi più moduli.
Falsificata su entrambi i punti (findings A3 e B7).

---

## 1. Obiettivo

Rendere chirurgici i due commit della Fase 2 — prima il validatore tollerante a entrambe le forme
del valore enum, poi l'importer che scrive il pointer — rispondendo alle domande A1-A5, B6-B10,
C11-C13 sul codice reale.

---

## 2. File letti (path completi)

- `frontend/src/model/conformance/ConformanceValidator.ts` (519 righe)
- `frontend/src/model/conformance/__tests__/ConformanceValidator.test.ts` (CHECK 10, righe 163-202 e 300-315)
- `frontend/src/services/export/XMIService.ts` (1290 righe: `processAttribute`, `findMetafeatureByName`, `serializeFeatures`, `populateReferenceValue`, i due import entry point)
- `frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts` (`normalizeEnumValues`)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (`LEnumerator.get_literals`, `LEnumLiteral`, `LValue.get_validTargets`, `DValue.values`, `setValueAtPosition`)
- `frontend/src/api/data.ts` (`linkAllNames`, il mapper ordinali → pointer, `parseDEnumLiteral`)
- `frontend/src/redux/VersionFixer.tsx` (righe 270-280)
- `frontend/src/components/editors/Info.tsx` (opzioni degli enum)
- Spec: `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md` §7, §10, §12

**Ancore del prompt**: tutte confermate salvo scarti di poche righe, riportati sotto dove
rilevante. Nessun refactor intervenuto, quindi l'hard stop 3 non si applica.

---

## A. Validatore (primo commit della Fase 2)

### A1. Che cosa sono gli oggetti in `attrType.literals`, ed espongono l'id?

**Sono proxy `LEnumLiteral`, e sì, espongono `id` oltre a `name`.** È il risultato che semplifica
di più la Fase 2.

`attrType` è `attr.type`, dove `attr` viene da `classInMM.allAttributes`
(`ConformanceValidator.ts:137`), quindi è un `LAttribute` e `type` è un `LClassifier`. Per un
enum è un `LEnumerator`, il cui getter è:

```ts
// LModelElement.tsx:4763
protected get_literals(context: Context): this["literals"] {
    return context.data.literals.map((pointer) => {
        return LPointerTargetable.from(pointer)
    }).filter(e=>!!e) as any; }
```

Restituisce proxy, uno per pointer. `LEnumLiteral` dichiara sia l'id sia il nome:

```ts
// LModelElement.tsx:4548 e 4556
id!: Pointer<DEnumLiteral, 1, 1, LEnumLiteral>;
name!: string;
```

La forma dell'id è la pointer string ordinaria del codebase (`Pointer<numero>_<SCOPE>_<n>`), la
stessa che finisce in `DValue.values`.

**Conseguenza per la Fase 2**: il validatore può costruire **due insiemi dallo stesso array che
già percorre**, uno di nomi e uno di id, senza cambiare da dove legge e senza alcuna nuova
navigazione. La tolleranza costa una riga in più nella costruzione dell'insieme e un `||` nel
confronto.

**Attenzione, e non è un dettaglio**: `.filter(e=>!!e)` scarta i pointer non risolvibili, ma un
proxy risolto di un literal cancellato può comunque avere `name` `undefined`. L'insieme degli id
va filtrato come quello dei nomi lo è già oggi (`.filter(n => n !== null && n !== undefined)`),
altrimenti `undefined` entra nell'insieme e un valore `undefined` — che però `scalarValues` già
esclude, vedi A2 — matcherebbe.

### A2. Quali forme assume un valore enum in `scalarValues`, e da quale writer

`scalarValues` è raccolto a `ConformanceValidator.ts:255-272` (ancora del prompt: ~253-272,
confermata). Legge **`feat.__raw.values`** quando c'è, con fallback su `feat.values` / `feat.value`,
e scarta `null`, `undefined` e `''`. Il commento dice perché legge il raw: il getter L tronca a
`upperBound` e **mappa gli enum in oggetti `LEnumLiteral`**, che romperebbe il confronto.

Tre forme, con la loro provenienza:

| Forma | Esempio | Writer | Raggiunge `scalarValues`? |
|---|---|---|---|
| **nome del literal** (stringa) | `'normal'` | importer XMI, `processAttribute` (B6) | sì, per il path `__raw.values` |
| **pointer id** (stringa) | `'Pointer17878..._USER_31'` | editor: form (`setSlotValue(..., isPtr: true)`) e pannello classico (`Info.tsx`, opzioni con `value: object.id`) | sì, per il path `__raw.values` |
| **oggetto `LEnumLiteral`** | `{ id, name, ... }` | nessun writer: è il **getter L** che lo produce | solo per il ramo di fallback `feat.values`, cioè le fixture piatte dei test |

Sulla seconda riga, la catena verificata nel codice: `setSlotValue` chiama
`setValueAtPosition(index, val, {isPtr:true})`; lì `Pointers.from(val)` su una stringa restituisce
la stringa stessa e il ramo che rimpiazzerebbe `val` è gated su `(val as any)?.className`, che una
stringa non ha; quindi in `values.<index>` finisce **l'id, invariato**. E le opzioni da cui l'id
proviene sono chiavizzate per id in un solo posto per tutti:

```ts
// LModelElement.tsx, LValue.get_validTargets
return {value: object.id, label: name, title: name}
```

Il commento a `ConformanceValidator.ts:311` che menziona la terza forma è quindi corretto ma
descrive un caso che nel prodotto reale non si presenta: nel prodotto vince sempre
`__raw.values`. Va tenuto lo stesso, perché è la forma che le fixture dei test usano (A4).

### A3. Serve un helper per risolvere un pointer verso un `DEnumLiteral`?

**No. La Fase 2 non ha bisogno di risolvere nulla, quindi non ha bisogno di alcun helper e non
importa niente di nuovo.**

È la risposta che rende il primo commit banale. Il validatore non deve prendere un id e cercare
il literal: ha già `attrType.literals`, che (A1) contiene sia gli id sia i nomi. Il confronto
diventa «il valore appartiene all'insieme dei nomi **oppure** all'insieme degli id», e nessuna
delle due appartenenze richiede un lookup.

Per completezza, gli helper che esistono e che **non servono qui**:

- `LPointerTargetable.fromPointer(id)` / `LPointerTargetable.from(pointer)` — tirano dentro il
  joiner, che il validatore oggi non importa (importa solo `type`, righe 1-13). Usarli
  cambierebbe la natura del modulo, che è una funzione pura.
- `state.idlookup[v]` con controllo `className === 'DEnumLiteral'` — è ciò che fa l'export
  (`XMIService.serializeFeatures`, C11), ma richiede lo store, che il validatore non ha.
- `normalizeEnumValues` (`useFormWidgets.ts`) — risolve nome → id da un elenco di opzioni. È il
  **riferimento di semantica** per la tolleranza in lettura, non codice riusabile: lavora su
  `FormFieldOptionGroup`, non su `LEnumLiteral[]`. La sua regola vale però anche qui: *un valore
  che non matcha nessuna delle due forme resta com'è e la diagnostica lo dirà*.

### A4. Copertura di CHECK 10 nei test, e cosa aggiungere

Quattro casi in `describe('CHECK 10 — invalid_enum_literal')` (righe 165-201), più due asserzioni
in un test di integrazione a 308-314. Tutte le fixture usano **il nome**:

```ts
const enumType = { name: 'Color', isEnum: true, literals: [{ name: 'RED' }, { name: 'GREEN' }] };
// ... features: [val('a', { value: 'BLUE' })]
```

Casi coperti: valore non literal → flag; valore literal → nessun flag; literal rimosso dall'enum
(stale) → flag; valore vuoto → ignorato (territorio di CHECK 2).

**Due fatti che condizionano il primo commit.**

1. **Le fixture non hanno `id` sui literal.** `literals: [{ name: 'RED' }]` produce `l?.id ===
   undefined` per ognuno. Se l'insieme degli id venisse costruito senza filtrare gli `undefined`,
   conterrebbe `undefined`; oggi nessun valore `undefined` arriva a CHECK 10 (`scalarValues` li
   scarta), quindi non ci sarebbero falsi negativi, ma è una bomba a orologeria. **Il filtro sugli
   id va messo**, ed è la stessa riga che già esiste per i nomi.
2. **Le fixture usano il ramo di fallback** `feat.values`, non `__raw.values`: `val('a', {value:
   'BLUE'})` è un oggetto piatto senza `__raw`. Quindi i test esercitano un percorso di lettura
   diverso da quello del prodotto. Non è un difetto da correggere in Fase 2, ma va saputo prima di
   dedurre dai test il comportamento reale.

Da aggiungere: un caso con il valore come **pointer id** presente fra i literal (non deve
flaggare), uno con un id **non** fra i literal (deve flaggare), e uno con le due forme mescolate
sullo stesso attributo multivalore. Le fixture di questi casi devono dare ai literal sia `name`
sia `id`, altrimenti non provano nulla.

### A5. Il messaggio di violazione

```ts
message: `Object "${objName}": attribute "${attr.name}" has value "${vName}" which is not a
literal of enum "${attrType.name}"`
```

`vName` è `v.name` se `v` è un oggetto, altrimenti `v` stesso. Con un pointer id non risolto
stampa **l'id grezzo**, che per un utente non dice niente:

> `attribute "kind" has value "Pointer1787818382120_USER_31" which is not a literal of enum "StateKind"`

Dopo la Fase 2 questo messaggio comparirà solo quando il valore è davvero fuori dall'enum, cioè
molto più di rado, ma continuerà a essere illeggibile in quel caso. Il rimedio è a portata e non
richiede lookup: avendo già `attrType.literals`, si può stampare il nome quando l'id è noto e
l'id quando non lo è. Vale la pena decidere se farlo nel primo commit o lasciarlo fuori (domanda
aperta 3).

---

## B. Importer (secondo commit della Fase 2)

### B6. Il tipo del `metaFeature` è interrogabile per sapere che è un enum?

**Sì, e con lo stesso accesso che usa il validatore.**

`metaFeature` viene da `findMetafeatureByName` (ancora del prompt ~742; posizione reale:
è definita subito prima di `processAttribute`), che restituisce elementi di
`metaClass.allAttributes` / `allReferences`, cioè **proxy L**:

```ts
private static findMetafeatureByName(metaClass: LClass, name: string): LAttribute | LReference | null {
    const attrs = (metaClass as any).allAttributes ?? [];
    for (const a of attrs) if (a?.name === name) return a as LAttribute;
    ...
}
```

Che siano proxy è già dimostrato dall'uso che `processAttribute` ne fa: legge
`(metaFeature as any).className === 'DReference'` e `(metaFeature as any).upperBound`. Quindi
`(metaFeature as any).type` è un `LClassifier` e **`type.isEnum`** è disponibile — è esattamente
il predicato che CHECK 10 usa (`attrType.isEnum`), definito su `LEnumerator`
(`LModelElement.tsx:4718`, `isEnum!: true`) contro `false` sulle altre classi (`:2775`).

Il criterio alternativo `typeClass === 'DEnumerator'` funziona altrettanto ed è quello che usa la
form (`useFormWidgets.describeSlot`). `isEnum` è preferibile qui perché è già il criterio del
validatore, cioè dell'altro attore che questa ratifica allinea.

### B7. Come si risolve il nome nel pointer, in quel punto

`(metaFeature as any).type.literals` — lo stesso array del finding A1, con gli stessi proxy che
espongono `name` e `id`. Path completo di navigazione, tutto in memoria e senza store:

```
metaFeature (LAttribute)  ->  .type (LEnumerator)  ->  .literals (LEnumLiteral[])  ->  { name, id }
```

Il metamodello **è già caricato** quando `processAttribute` gira: `metaClass` arriva come
parametro e `findMetafeatureByName` ne ha appena percorso `allAttributes`. Nessun caricamento
lazy, nessuna attesa.

Quindi anche il secondo commit non ha bisogno di helper: costruisce una mappa `name -> id` dai
literal e la applica per elemento.

### B8. Cosa succede se il nome non matcha nessun literal

**Scrivere il nome invariato preserva il comportamento voluto dalla spec, e va fatto così.**

Oggi la stringa passa e CHECK 10 la flagga con `invalid_enum_literal`, severità `warning`. Dopo
la Fase 2, un nome che non risolve resta un nome, quindi:

- non appartiene all'insieme degli id (non è un id),
- non appartiene all'insieme dei nomi (per ipotesi non è un literal),

e CHECK 10 continua a flaggarlo. Il warning di conformance è ciò che la spec vuole: l'import non
deve rifiutare il file, deve caricarlo e segnalare. Nessun cambiamento osservabile su questo caso,
che è la definizione di «non regredire».

È la stessa politica di `normalizeEnumValues` sul lato form, e conviene che i tre attori la
condividano: *quando non sai risolvere, non inventare — lascia il valore e lascia parlare il
validatore*.

### B9. Multivalore e i due path di scrittura

**Entrambi i path ricevono lo stesso array, quindi risolvere prima li copre tutti e due.** È il
punto che rende il secondo commit una sola modifica e non due.

`processAttribute` costruisce `values: string[]` una volta sola — split whitespace se
`upperBound !== 1`, altrimenti `[rawValue]` (ancora del prompt ~863-871, confermata) — e poi lo
consegna a uno dei due rami senza toccarlo:

```ts
const conformitySlot = XMIService.getConformitySlot(dObject, metaFeature.id, ctx);
if (conformitySlot) {
    SetFieldAction.new(conformitySlot.id, 'values', values as any, '', false);
    SetFieldAction.new(conformitySlot.id, 'isMirage', false, '', false);
} else {
    const dValue: DValue = DValue.new(undefined, metaFeature.id as any, values, dObject.id, true, false);
    (dObject.features as Pointer<DValue>[]).push(dValue.id);
}
```

Il punto di innesto è quindi **subito dopo la costruzione di `values` e prima del `getConformitySlot`**,
con un `values = values.map(resolve)` gated su `type.isEnum`. Nessuno dei due rami va toccato.

Nota di tipo: `DValue.values` è dichiarato
`PrimitiveType[] | Pointer<DObject|DEnumLiteral, 1, 'N', LObject|LEnumLiteral>`
(`LModelElement.tsx:6565`), quindi un array di pointer di literal è **già** una delle forme
previste dal tipo. Il commento a `XMIService.ts:1179` lo dice esplicitamente per il caso delle
reference: «both shapes share one canonical pattern». Il quinto argomento di `DValue.new` è il
flag di persistenza, non `isPtr`, quindi non c'è nulla da cambiare nella chiamata.

### B10. Censimento degli altri path che scrivono nomi di literal

| Path | File | Scrive enum per nome? |
|---|---|---|
| `importFromXML` | `XMIService.ts:393` | è l'entry point che smista; l'M1 va a `importM1FromXML` |
| `importM1FromXML` | `XMIService.ts:539` | **sì**, attraverso `processAttribute`: è il path che la Fase 2 corregge |
| `EcoreParser` (`.jmm`) | `api/data.ts` | **no, e converte già in pointer** — vedi sotto |
| JjScript `create` / `copy` | `jjscript/executor/commands/` | creano `DEnumLiteral` nel **metamodello** (`create.ts:761`, `copy.ts:346`), non valori M1: fuori tema |
| JjScript `eval` | `jjscript/executor/commands/eval.ts:671-720` | legge gli enum per generare valori di default; da guardare in Fase 2 solo per confermare che non regredisca |
| `DSL/` | — | **nessuna occorrenza** di `DEnumLiteral` o `eLiterals`: non scrive enum |
| `JsonModelService` | `services/export/JsonModelService.ts` | 2 occorrenze, da censire se la Fase 2 lo tocca; non è un import path M1 |

Il caso interessante è `api/data.ts`, che **ha già un normalizzatore di canone** e nessuno lo
aveva citato:

```ts
// api/data.ts:355-370, dentro linkAllNames
// fix from ordinals to Pointer<DEnumLiteral>
function getLiteral(id, ordinal) { return LPointerTargetable.fromD(DfromPtr(id))?.ordinals[ordinal]?.__raw; }
for (let elem of parsedElements) {
    if (elem.className !== DValue.cname) continue;
    ...
    let mapper = (v: unknown): Pointer<DEnumLiteral> => {
        if (typeof v !== "number") { Log.ee("found non-numeric value in a literal value.", v, dval); return v as any; }
        let l = getLiteral(type.id, v);
        return l ? l.id : v as any;
    }
    dval.values = dval.values.map( mapper );
}
```

Cioè: il caricamento `.jmm` converte gli **ordinali numerici** in pointer di literal, per
elemento, e **lascia il valore invariato quando non risolve**. È esattamente la politica di B8 e
lo stesso `map` per elemento di B9, già in produzione su un altro formato. Vale come precedente
da citare nel commit dell'importer, e come conferma che il canone pointer è già la direzione del
codebase e non una novità di questa spec.

Ha però un difetto da registrare (non da correggere qui): la guardia è
`type.className !== DEnumLiteral.cname`, mentre `type` è il **tipo dell'attributo**, che per un
enum è un `DEnumerator`, non un `DEnumLiteral`. Se la lettura è giusta, quel `continue` scatta
sempre e il mapper non gira mai. Da verificare in Fase 2 con una misura, non da assumere.

---

## C. Contorno e rischi

### C11. Consumer dei valori enum raw

| Consumer | Con i pointer | Con i nomi legacy |
|---|---|---|
| **Export XMI** (`serializeFeatures`, ~256-262) | ✅ già gestito | ✅ |
| **CHECK 10** | ❌ oggi flagga (è il difetto) | ✅ |
| **Form** (`normalizeEnumValues`) | ✅ | ✅ normalizza in lettura |
| **Pannello classico** (`Info.value`) | ✅ scrive e legge id | ⚠️ una select su un valore-nome non trova l'opzione e mostra vuoto, come la form prima del fix di D2 |
| **`conformanceToProblems.ts`** | ✅ indifferente: copia `message` e `metamodelElementName`, non guarda i valori | ✅ |
| **JjScript `eval`** | da verificare in Fase 2 | da verificare in Fase 2 |

L'export è quello che conta di più e sta bene in entrambe le forme, per costruzione:

```ts
const rendered = rawValues.map((v) => {
    if (typeof v === 'string') {
        const target = state.idlookup[v];
        if (target && target.className === 'DEnumLiteral') return this.escapeXml(target.name || '');
    }
    return this.escapeXml(String(v));
});
```

Un pointer risolve al nome del literal; un nome non risolve in `idlookup` e cade su `String(v)`,
che è il nome stesso. **Il round-trip XMI produce lo stesso file con entrambe le forme**, il che
significa che il secondo commit della Fase 2 non cambia l'output dell'export: buona notizia per
i test di round-trip esistenti.

Segnalo una riga da tenere d'occhio: il commento sopra `serializeFeatures` (~235-238) dice che si
legge il raw proprio per evitare il getter L «che mappa i pointer in proxy e renderebbe
`String(v)` = garbage». È la terza conferma indipendente che `__raw.values` è il posto giusto da
cui leggere i valori.

### C12. Modelli salvati e migrazioni

**Nessun `VersionFixer` tocca `DValue.values`, e quello che lo farebbe è commentato:**

```ts
// VersionFixer.tsx:277
// VersionFixer.removeNullPtrs(out, s, lookup, 'DValue', [...common, 'values'])
```

`removeNullPtrs` gira su `DEnumerator.literals` (`:275`) — cioè sul metamodello — ma mai sui
valori M1. Quindi i modelli salvati che contengono nomi restano com'è, per sempre, e **la
tolleranza in lettura non ha una data di scadenza**, come dice la spec. Non è una fase di
transizione: è uno stato permanente.

Corollario per la Fase 2: nessuna migrazione da scrivere, nessun bump di versione, e il primo
commit (validatore tollerante) è quello che porta il valore, perché è l'unico che ripara anche i
modelli già su disco. Il secondo (importer) migliora solo ciò che entra da qui in avanti.

### C13. Baseline, misurate oggi

| Gate | Valore |
|---|---|
| `npx tsc --noEmit` | **33 errori** (baseline attesa, confermata) |
| `npx vitest run` | **1589 test passati**, 65 file passati, **9 file falliti all'import** per `window is not defined` (baseline nota, tutti in `jjtl/`, `jjscript/`, `utils/`) |

Nessun comando che modifichi file è stato eseguito.

---

## 3. Dipendenze e rischi

| # | Rischio | Evidenza | Mitigazione |
|---|---|---|---|
| R1 | L'insieme degli id costruito senza filtro raccoglie `undefined` dalle fixture dei test | A4: `literals: [{name:'RED'}]`, nessun `id` | filtrare come già si fa per i nomi |
| R2 | I test di CHECK 10 esercitano il ramo `feat.values`, non `__raw.values` | A4 | i casi nuovi vanno scritti sapendolo; non dedurre il comportamento reale dai test |
| R3 | Il messaggio resta illeggibile quando il valore è un id fuori enum | A5 | decidere se risolverlo nel primo commit (domanda aperta 3) |
| R4 | Il mapper di `api/data.ts` sembra non girare mai per una guardia sul className sbagliato | B10 | misurare in Fase 2, non assumere; è comunque fuori dai due commit |
| R5 | Il pannello classico su un valore-nome mostra la select vuota | C11 | pre-esistente, stesso difetto che D2 ha chiuso sulla form; da registrare, non da correggere qui |
| R6 | JjScript `eval` legge gli enum e non è stato analizzato | B10 | censito; da confermare in Fase 2 che non regredisca |

**Nessun rischio sull'ordine dei due commit**: sono indipendenti. Il validatore tollerante non
richiede l'importer canonico, e l'importer canonico non richiede il validatore tollerante — anche
se, invertendo l'ordine, per un attimo i modelli appena importati verrebbero flaggati come lo
sono oggi quelli editati. L'ordine del prompt (validatore prima) è quello che non ha mai una
finestra peggiorativa.

---

## 4. Domande aperte per Alfonso

1. **L'insieme degli id va costruito da `literals` o si accetta anche un id che punti a un literal
   di un ALTRO enum?** La lettura stretta — un valore è valido se è fra i literal *di questo* enum
   — è quella che descrivo sopra ed è anche la sola che conservi il senso del check. Confermi che
   un pointer a un `DEnumLiteral` estraneo deve continuare a essere flaggato?

2. **Il flag di CHECK 10 sui valori-nome resta un `warning`?** Dopo la Fase 2 un nome è forma
   legacy accettata, quindi non è più una violazione: la tolleranza lo rende valido e il check
   tace. Ma allora un modello importato oggi e mai toccato smette di produrre qualunque segnale
   sulla forma legacy. Va bene così — la spec dice che il nome è accettato — o vuoi un segnale
   informativo separato che dica «questo modello usa la forma legacy»? Io **non** lo aggiungerei:
   sarebbe rumore su un modello corretto.

3. **Il messaggio di violazione va sistemato nel primo commit o dopo?** (A5) È due righe usando
   `attrType.literals` che il codice ha già in mano, ma allarga il diff di un commit che
   altrimenti è di tre righe. La mia preferenza è **farlo lì**: un check che dopo il fix parla
   ancora per id è un mezzo lavoro, e non c'è un momento migliore.

4. **`api/data.ts` (R4)**: se la guardia sul className è davvero sbagliata, il caricamento `.jmm`
   non converte gli ordinali da chissà quanto, e i `.jmm` salvati contengono numeri dove il canone
   vuole pointer — una **terza** forma, che né il validatore né la form gestiscono. Vuoi che la
   Fase 2 lo misuri e apra una voce, o preferisci un task a sé?

---

## 5. Hard stop

Fase 1 chiusa. Nessun file `.ts`/`.tsx`/`.scss` toccato. La Fase 2 parte da un prompt nuovo dopo
il go-ahead in chat, e le sole risposte che ne cambiano la forma sono la 3 (perimetro del primo
commit) e la 4 (se `api/data.ts` entra o resta fuori).
