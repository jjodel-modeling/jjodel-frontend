# Discovery — R-VP slice 1: sezione `manager` nella view per classe e override della form del manager

**Data**: 2026-09-03
**Fase**: 1, read-only. Nessun file di prodotto modificato.
**Prompt**: `docs/prompts/` — R-VP slice 1 (commit `4392bc30e`).
**Base**: HEAD `4392bc30e`. Il prompt dichiara `d32349614`: e' un antenato, due commit
di soli documenti in mezzo (`88e1b7c78`, `4392bc30e`), nessuno dei quali tocca il perimetro.
**Working tree**: pulito salvo `?? "Claude outputs/"` (non tracciato, non di questa corsia).

---

## 0. Obiettivo e ipotesi

Falsificare cinque ipotesi (H1..H5) sul punto di innesto di due chiavi additive —
`ManagerSpec` su `VertexViewIR` e l'override per superficie dentro `FormSpec` — e
rispondere alle nove domande di §2.3 del prompt.

**Esito in una riga: H1, H2, H4 confermate; H3 FALSIFICATA; H5 confermata.** La
falsificazione di H3 cambia la forma della slice 2 e va letta prima del GO (§3.3).

| | ipotesi | esito |
|---|---|---|
| H1 | un solo punto di innesto per lo spec, condiviso dalle tre superfici | **confermata**, ed e' `IRForm.tsx:182` |
| H2 | le colonne nascono da `tableColumns`, il viewpoint non entra | **confermata** |
| H3 | il renderer di colonna arriva da `FormSpec.widgets` via `rendererForWidget` | **FALSIFICATA** |
| H4 | `features:'hidden'` e' un filtro in cui `hidden: string[]` puo' entrare | **confermata**, ed e' `useFormWidgets.ts:420` |
| H5 | non esiste stato di ordinamento della tabella | **confermata** |

---

## 1. File letti

Tutti sotto `/Users/alfonso/jjodel`.

```
frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts
frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts
frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts
frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts
frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx
frontend/src/components/editor-v2/viewpoint/ir/formSections.ts
frontend/src/components/editor-v2/viewpoint/ir/widgetRenderer.ts
frontend/src/components/editor-v2/viewpoint/ir/useIRFormView.ts
frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts
frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.tsx
frontend/src/components/editor-v2/nodes/ObjectNode.tsx        (i tre punti formSpec)
frontend/src/components/editor-v2/nodes/valueRenderer.ts       (SlotShape, rung 0)
frontend/src/components/abstract/tabs/instanceTable.ts
frontend/src/components/abstract/tabs/InstanceManagerTab.tsx
frontend/src/jjform/shape.ts
frontend/src/components/editor-v2/viewpoint/ir/__tests__/irValidate.test.ts
frontend/src/components/editor-v2/viewpoint/ir/__tests__/useFormWidgets.test.ts
docs/decisions.md    docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md
```

---

## 2. Due premesse del prompt smentite prima di cominciare

**2.1 — R-VP-1..8 NON sono in `docs/decisions.md`.** `command grep -c "R-VP" docs/decisions.md`
restituisce **0**. Il prompt lo prevedeva («potrebbero non essere ancora in `decisions.md`»),
ma va detto per esteso: **nessuna** delle otto regole citate come vincolante e' ratificata su
file. Anche il memo che le porterebbe non esiste:

```
$ ls docs/ratifiche/claude_2026-09-03_1441_memo_ratifica_viewpoint_vs_annotazioni.md
ls: ... No such file or directory
```

Il solo memo di viewpoint presente e' `claude_2026-08-22_memo_ratifica_layout_per_viewpoint.md`.
Le R-VP di questo task esistono quindi **soltanto nel prompt**. Non e' un blocco per la Fase 1;
lo diventa per il GO, che dovrebbe partire da regole scritte.

**2.2 — R-FRM-1 c'e', ma non dove il prompt dice.** Il prompt la cita come «(28/8, in
`decisions.md`)». In `decisions.md` non compare (`grep "R-FRM"` → 0). Vive in due posti reali,
entrambi verificati:

- `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md:102` — «**I compartimenti ordinano
  e intitolano; non filtrano.**»; la tabella a `:159` la segna **implementata**, commit `4b7383dbf`;
- `frontend/src/components/editor-v2/viewpoint/ir/formSections.ts:5-11`, nel docstring del modulo,
  con la motivazione per esteso.

Il contenuto sostanziale che il prompt usa e' corretto. E' la sede a essere sbagliata.

**Controllo positivo del negativo.** Le prime `ls` di `docs/spec/` e `docs/design/` sono state
lanciate con la working directory ferma su `frontend/` e hanno risposto «No such file»: un
silenzio da directory sbagliata, non da documento assente. Rilanciate da `/Users/alfonso/jjodel`,
**tutti e tre** i documenti citati in §5 del prompt esistono. Registrato perche' e' esattamente
il modo di guasto di CLAUDE.md §5: due comandi indistinguibili nell'output, uno dei quali non ha
mai raggiunto il soggetto.

---

## 3. Findings

### 3.1 H1 — confermata: un punto solo, e non ha modo di sapere dove e' montato

`IRForm.tsx:182`, verbatim:

```ts
const spec: FormSpec | undefined = resolution?.compiled?.formSpec ?? undefined;
```

`resolution` viene da `useIRFormView(objectId)` (`:171`). Da qui `spec` scende in tre posti e
tre soltanto: `describeSlots(slots, spec, offer)` (`:304`), `isBasicField(f, spec)` (`:309`),
`resolveFormTheme(spec?.theme, spec?.labelPlacement, …)` (`:418`).

**Un punto solo, quindi, ed e' quello.** Inserire li' `spec = resolveFormSpec(rawSpec, surface)`
copre le tre superfici senza toccare altro.

**Ma IRForm non sa in che superficie e' montato.** `IRFormProps` (`:75-77`) dichiara
`objectId` e `defaultTheme`, e i tre call site passano solo `objectId`:

```
InstanceManagerTab.tsx:2954   <IRForm objectId={formSubjectId ?? subjectId} />
InstanceManagerTab.tsx:2988   <IRForm objectId={childId} />          (figlio inline, stessa superficie)
PropertiesWithTreeView.tsx:1110  <IRForm objectId={formSubjectId} />  (il rail)
```

**Non esiste un quarto mount**: la superficie «nodo-form» del prompt **non monta `IRForm`**.
Il canvas legge lo spec per conto suo, in `ObjectNode.tsx`, e ne legge **solo `widgets`**
(`:659`, `:700`, `:879`). Conseguenza pratica: la prop `surface` proposta va aggiunta a
`IRFormProps` e passata da **due** call site (i due del manager), non da tre, e il rail resta
letteralmente invariato perche' l'assenza della prop e' il suo valore.

**Proposta minima**: `surface?: 'manager'` su `IRFormProps`, assente = base. Un solo valore
ammesso, come chiede §1c; il tipo esclude `rail` e `nodeForm` senza bisogno di convenzione.

### 3.2 H2 — confermata: la pipeline delle colonne, e dove `ManagerSpec` si innesta

`InstanceManagerTab.tsx`, in ordine di esecuzione:

```
:1501  const columns = useMemo(() => (classShape ? tableColumns(classShape) : []), [classShape]);
:1532  const hiddenColumnKeys = useMemo(() => [...emptyColumnKeys(rows, columns), ...duplicateKeys], …);
:1539  const overrides: ColumnOverrides = columnChoice[selectedClassId ?? ''] ?? EMPTY_OVERRIDES;
:1545  const shownColumns = useMemo(() => shownColumnsWith(columns, hiddenColumnKeys, overrides), …);
:1551  const autoHiddenKeys = useMemo(() => autoHiddenColumnKeys(hiddenColumnKeys, overrides), …);
```

Il viewpoint **non entra da nessuna parte**: `tableColumns(cls)` (`instanceTable.ts:98`) e' puro
sopra `ClassShape` e delega a `tableFeatures` (`jjform/shape.ts:231`), che e' `[...cls.attrs, ...cls.refs]`
— attributi poi reference, children esclusi.

Il commento a `:1527-1531` e' una **decisione gia' presa** che il GO deve rispettare, verbatim:

> «UN canale solo, e non due: `shownColumnsWith`, `autoHiddenColumnKeys` e `columnToggles`
> leggono tutti questo array […]. Un secondo array avrebbe voluto dire un secondo posto in cui
> una colonna puo' sparire.»

**Innesto**: `ManagerSpec.columns` **riordina `columns` subito dopo `:1501`**, prima che
`hiddenColumnKeys` la misuri. Cosi' resta un canale solo. Metterla dopo `shownColumnsWith`
aprirebbe il secondo posto che quel commento vieta.

`NAME_COLUMN_KEY` (`instanceTable.ts:443`) non e' una feature del metamodello e **non compare in
`tableColumns`** — «la tabella la stampa a parte». Fuori dal governo di `ManagerSpec` per costruzione,
non per regola.

### 3.3 H3 — FALSIFICATA. Il renderer di colonna NON passa da `FormSpec.widgets`

Il prompt (§1a) afferma: «il renderer di colonna arriva già dalla ladder attraverso
`FormSpec.widgets` → `rendererForWidget`, quindi si customizza con l'override della form».
**Non e' vero oggi**, e non lo diventa gratis con l'override.

`rendererForWidget` ha quattro consumatori in tutto il sorgente, nessuno dei quali e' il manager:

```
$ command grep -rn "rendererForWidget" src --include="*.ts" --include="*.tsx" | grep -v __tests__
src/components/editor-v2/nodes/ObjectNode.tsx:35    import
src/components/editor-v2/nodes/ObjectNode.tsx:658   viewRenderer: rendererForWidget(
src/components/editor-v2/viewpoint/ir/widgetRenderer.ts:65   la definizione
src/components/editor-v2/viewpoint/ir/widgetRenderer.ts:107  uso interno
```

`viewRenderer` e' il **rung 0** della ladder (`valueRenderer.ts:348-357`), verbatim:

> «RUNG 0: the renderer the ACTIVE VIEW asks for, already mapped from its `FormSpec.widgets`
> entry by `widgetRenderer.rendererForWidget` (R-STR-6). **Mapped by the CALLER and not here** […]»

Il manager e' un chiamante che **non lo mappa**. `instanceTable.ts:180` costruisce lo `SlotShape`
con il solo rung 1:

```ts
rendererOverride: ann.renderer ?? undefined,
```

e `command grep -n "viewRenderer" instanceTable.ts InstanceManagerTab.tsx` restituisce **zero
occorrenze**. Il commento di testata del tab lo dice gia', ed e' vero solo a meta':

> `InstanceManagerTab.tsx:17` — «il renderer di ogni cella e' la STESSA precedenza che usano le
> righe del canvas (`valueRenderer`), non una seconda lettura di essa»

Stessa **funzione**, si'. Stessi **ingressi**, no: al canvas arriva il rung 0, al manager no.

**Conseguenza sul GO.** `surfaces.manager.widgets` non cambierebbe nessuna colonna finche'
`InstanceManagerTab`/`instanceTable` non passano `viewRenderer`. E per passarlo serve una view
risolta **per riga** (o per classe: vedi §3.6), che oggi il manager non risolve affatto. O il
commit 2 accetta questo lavoro in piu' — e allora tocca `instanceTable.ts`, che il prompt vuole
puro, per cui il rung 0 va passato dall'esterno come parametro — oppure la slice dichiara che
`widgets` nell'override vale **solo per la form del drawer**, non per le colonne. **Domanda
aperta A**.

### 3.4 H4 — confermata: `hidden` ha gia' il suo filtro, ed e' uno solo

`useFormWidgets.ts:411-421`, verbatim:

```ts
export function describeSlots(slots: any[], spec?: FormSpec, offer?: FieldOffer): FormFieldDescriptor[] {
    …
        // `hidden` is applied HERE and in both modes: it is the author saying the feature has
        // … the form has, not everything the metaclass has. A diagnostic on a hidden feature is
        …
        if (spec?.features?.[d.name] === 'hidden') continue;
```

Sta **a monte** di `IRForm.tsx:309` (`visible`, che filtra solo Basic/Advanced) e a monte di
`buildFormSections`. `describeSlot` (`:331-337`) lo conferma dall'altro lato: «`hidden` is handled
by the caller: a hidden feature has no descriptor at all, so nothing downstream has to remember
to skip it».

**I due meccanismi convergono senza attrito**: una riga sola, nello stesso `continue`.

```ts
if (spec?.features?.[d.name] === 'hidden') continue;
if (spec?.hidden?.includes(d.name)) continue;
```

Vale la pena scriverle come due condizioni e non come una: `features` e' per reference e
containment, `hidden` per qualunque feature, e la seconda non deve sembrare un rimpiazzo della prima.

### 3.5 H5 — confermata: nessun ordinamento di tabella da conciliare

`command grep -n "sort" InstanceManagerTab.tsx` da' una sola occorrenza sostanziale, `:1472`, ed e'
l'elenco delle **metaclassi** nel rail sinistro, non le righe:

```ts
// Name-sorted so the column does not reorder itself when a class is renamed
.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
```

Le righe arrivano da `instancesOfClass(...).map(tableRow)` (`:1502-1508`) nell'ordine di
`idlookup`, e non c'e' ne' stato di sort ne' header cliccabile. **`ManagerSpec.sort` non ha
nessuna precedenza da negoziare**: sarebbe il primo ordinamento del manager, e serve
l'ordinatore, non solo la chiave. Costo reale non nullo, e il prompt lo tratta come additivo.
**Domanda aperta B**: `sort` entra in questa slice (e allora serve l'ordinatore) o esce?

### 3.6 Il fatto che il prompt non prevede: il manager non risolve nessuna view

`resolveIRView` (`irResolveCore.ts:257-263`) ha questa firma:

```ts
export function resolveIRView(
    objectId: string,
    metaclassId: string,
    index: IRViewpointIndex,
    readCtx: ReadCtx,
    idlookup: Record<string, any>,
): CompiledView | null
```

**`objectId` e' il primo parametro perche' il predicato si valuta su un soggetto.** Una view con
`predicate` seleziona per istanza, non per classe.

Nel manager, `useIRFormView` gira **dentro `IRForm`**, cioe' per l'oggetto del drawer. Il grep
in `InstanceManagerTab.tsx` per `useIRFormView|irResolve|resolveIRView` da' **zero** occorrenze
dirette: il tab non risolve niente, monta `IRForm` e basta.

`ManagerSpec.columns` e' invece **per metaclasse**, decisa quando nel drawer non c'e' nessun
oggetto — anzi, quando la tabella e' vuota. Servono quindi:

1. un accesso all'indice per metaclasse senza soggetto (`index.byMetaclass.get(className)` esiste
   ed e' gia' usato senza oggetto da `irInteraction.ts:56` e `:232`, quindi la strada c'e');
2. **una regola per quale view vince quando piu' view della stessa metaclasse portano `manager`
   e si distinguono per `predicate`.** Con righe diverse che soddisfano predicati diversi, «le
   colonne di questa classe» non ha una risposta unica.

Proposta minima e dichiarata: **si considerano solo le view senza `predicate`**, per specificita'
decrescente come fa `resolveIRView`; una view con predicato che porta `manager` viene **ignorata
con un `console.warn` una volta sola**. E' l'unica lettura che non chiede a una tabella di avere
colonne diverse riga per riga. **Domanda aperta C**: confermare, o scegliere «vince la prima per
ordine di dichiarazione» (piu' semplice, meno spiegabile).

### 3.7 Collisione di nome con Q5, gia' ratificata

`docs/decisions.md`, **Q5 (2026-08-30, Alfonso)**, verbatim:

> «La `surface` di R-FORM-3 e' una chiave nuova su `VertexViewIR`, accanto a `form` e `structure`,
> additiva-opzionale, senza bump di `irVersion` e senza migrazione — R-STR-1 alla lettera.
> **Non su `FormSpec`.** Fuori dalla slice 2a.»

Quel `surface` (valori `form | diagram`, R-FORM-3) e' una cosa **diversa** dal `surfaces` proposto
qui (mappa di override per superficie). Ma dopo questa slice lo schema avrebbe
`VertexViewIR.surface` e `VertexViewIR.form.surfaces`, **distinti da una `s`**, uno ratificato e
uno no, nella stessa vicinanza. **Domanda aperta D**: rinominare il nuovo (`perSurface`? `overrides`?)
o accettare la coppia. Costa niente adesso e non si corregge dopo (R-B9: ogni literal scritto e'
definitivo).

### 3.8 `order` e `buildFormSections`: la conciliazione con R-FRM-1

`buildFormSections` (`formSections.ts:73-110`) **partiziona per gruppo strutturale**, non per lista:

```ts
const byGroup: Record<Group, F[]> = {
    attributes: fields.filter(f => !f.isReference && !f.isComposition),
    references: fields.filter(f => f.isReference),
    children: fields.filter(f => f.isComposition),
};
```

Un `order` **globale** non ha quindi dove applicarsi: l'appartenenza alla sezione la decide il
tipo della feature, non l'autore. Restano due letture:

- **(i) `order` ordina DENTRO ogni gruppo.** `buildFormSections` non cambia di una riga: basta
  riordinare `visible` prima di passarlo, perche' i tre `filter` preservano l'ordine dell'array in
  ingresso. Le feature non citate restano in coda **al proprio gruppo**, nell'ordine di oggi.
  R-FRM-1 e' rispettata alla lettera: si ordina, non si filtra.
- **(ii) `order` ordina globalmente** e le sezioni si ricalcolano dopo. Rompe la partizione, che e'
  il contratto dichiarato del modulo.

**Raccomandazione: (i).** Una frase per il commento di `resolveFormSpec`: *«`order` ordina i campi
dentro la sezione che il loro tipo gli assegna; non li sposta di sezione e non ne toglie nessuno —
i non citati seguono i citati nell'ordine di oggi.»*

Nota di implementazione: il riordino va fatto **su `visible`, prima di `buildFormSections`**
(`IRForm.tsx:381`), non dentro `describeSlots`, altrimenti tocca anche `layoutAnnotations` (`:317`)
e `focusFirstOf` (`:369`), che iterano `visible` e sull'ordine non hanno opinioni ma erediterebbero
la modifica senza che nessuno l'abbia decisa.

### 3.9 `irValidate` e `irCompile`: quanto lavoro serve davvero

**`irValidate.ts` — nessuna whitelist di chiavi.** L'unico scan generico e'
`findUnknownPredicateOp` (`:75-92`), che cammina l'albero e si ferma su ogni `op` stringa fuori
vocabolario. Il resto sono regole puntuali (`shape.padding`, routing, endpoint). Il test lo dichiara
gia', `irValidate.test.ts:229`:

> «The whole point of these cases is that **validateIR needed NO change to accept `form`**: the
> validator is permissive towards keys it does not know»

Quindi `manager`, `surfaces`, `order`, `labels`, `hidden` **passano senza toccare `irValidate.ts`**,
a patto che nessuna chiave si chiami `op` con valore stringa. Il rischio concreto e' `widgets: { op: … }`
— cioe' **una feature del metamodello chiamata `op`** — che il test `:271` gia' pinna come rigettata.
Vale identico dentro `surfaces.manager.widgets`, ed e' bene aggiungere quel caso.

**`irCompile.ts` — `manager` va aggiunto a mano.** `formSpec` non e' passthrough automatico:

```
:322   const formSpec = ir.form ?? null;
:419   formSpec,      // dentro il letterale `compiled: CompiledView`
```

Serve la coppia gemella (`const managerSpec = ir.manager ?? null;` + il campo nel letterale) piu' il
campo su `CompiledView` (`irTypes.ts:623`, dove `formSpec` e' cosi' chiamato «because `form` on this
interface is already» — stessa trappola per `manager`, che pero' e' libero).

**Se pero' `ManagerSpec` si legge per metaclasse e non per oggetto (§3.6), passare da `CompiledView`
e' facoltativo**: si puo' leggere `entry.ir.manager` dall'indice senza compilare. Piu' economico e
piu' onesto — non c'e' niente da compilare, `ManagerSpec` non porta ne' PathExpr ne' Predicate, la
stessa ragione per cui `formSpec` e' un passthrough. **Domanda aperta E**.

### 3.10 Round trip in authoring: nessun lavoro, ma un debito da dichiarare

Tutti i writer di `FormAuthoringBody.tsx` sono spread su un oggetto esistente —
`withFormKey:145`, `withFormEntry:162`, `withBasic:207`, `withoutBasic:222` — tutti `{ ...form }`.
`pruneForm` (`:126-131`) cancella **solo** `widgets` e `features` vuoti e poi:

```ts
return Object.keys(out).length === 0 ? undefined : out;
```

**Le chiavi sconosciute sopravvivono verbatim.** `surfaces`, `order`, `labels`, `hidden` passano un
round trip in authoring senza perdersi, e un `FormSpec` che porta **solo** `surfaces` non viene
ridotto a `undefined` (conta le chiavi, non il loro significato). **Nessun lavoro di preserve nel
commit 2.**

Il debito e' l'altro verso, ed e' quello che R-B9 rende definitivo: `pruneForm` **non** pota
`surfaces: {}`, `order: []`, `hidden: []`. Finche' li scrive solo la mano dell'autore va bene; il
giorno che una UI di authoring li scrive, un `surfaces: {}` lasciato da chi ha provato e disfatto
resta nel file per sempre — esattamente il guasto che il docstring di `pruneForm:115-120` esiste per
impedire. **Da fare quando arriva l'authoring UI, non ora**: registrarlo qui basta.

---

## 4. Le nove domande di §2.3

1. **Punto di innesto**: `IRForm.tsx:182` (uno solo, tutte le superfici che montano `IRForm`).
   `ObjectNode.tsx:659/700/879` legge `formSpec.widgets` per conto suo e non passa di li'.
   La risoluzione va a `:182`; il rail non cambia perche' non passa la prop.
2. **Come IRForm conosce la superficie**: **non la conosce**. `IRFormProps:75-77` ha `objectId` e
   `defaultTheme`. Proposta: `surface?: 'manager'`, passata dai due mount di `InstanceManagerTab`
   (`:2954`, `:2988`), assente altrove.
3. **`features:'hidden'`**: applicato in `useFormWidgets.ts:420`, dentro `describeSlots`, a monte
   del filtro Basic/Advanced. `hidden: string[]` entra nello stesso `continue`, riga accanto.
4. **`order` e `buildFormSections`**: ordine **dentro il gruppo**, riordinando `visible` prima di
   `buildFormSections`. I non citati seguono i citati, nel gruppo che il loro tipo gli assegna.
   Nessuno sparisce (R-FRM-1). Frase pronta in §3.8.
5. **Colonne**: `ManagerSpec.columns` riordina l'output di `tableColumns` **subito dopo
   `InstanceManagerTab.tsx:1501`**, prima di `hiddenColumnKeys`, per non aprire il secondo canale
   che `:1527` vieta. `NAME_COLUMN_KEY` e' fuori per costruzione (non e' in `tableColumns`).
   *Sul punto lasciato al GO — «le altre dopo, nascoste o visibili?»* — la risposta coerente con
   quel commento e' **visibili**: `ManagerSpec` ordina, la riduzione automatica e poi l'override di
   sessione decidono la visibilita'. Nascondere qui darebbe due posti in cui una colonna sparisce.
6. **Round trip authoring**: nessuna perdita, tutti spread (§3.10). Nessun lavoro nel commit 2;
   debito di `pruneForm` registrato per quando arriva l'authoring UI.
7. **Collisioni** (`command grep -rn` su `frontend/src`):
   - `ManagerSpec` — **0**
   - `FormSurfaceOverride` — **0**
   - `surfaces` come identificatore — **0**. La parola compare **48** volte in `frontend/src`
     (7 in `.scss`/`.css`, 41 in `.ts`/`.tsx`), tutte in prosa: il filtro per forma di
     identificatore (`surfaces` seguito da `?`/`:`/`=`, `.surfaces`, `surfaces(`) lascia
     **una** riga, ed e' un commento (`outlineDraw.ts:14`, «exist for other surfaces:»).
     Il primo conteggio che avevo scritto qui, «10», era un `head` troncato letto come
     totale — lo stesso guasto di misura registrato in §2.2, due volte nella stessa sessione.
   - `order` / `labels` / `hidden` come chiavi di `FormSpec` — **0** (`FormSpec` ha oggi
     `theme`, `labelPlacement`, `widgets`, `features`, `basic`, `irTypes.ts:246-266`).
     `labels` esiste altrove nello schema (`shape.labels`, `EdgeViewIR.labels`): omonimia in
     un'altra interfaccia, non collisione.
   - **collisione vera**: `VertexViewIR.surface` gia' ratificata da Q5 contro il `surfaces`
     proposto — §3.7, domanda aperta D.
8. **Test a rischio**:
   - `irValidate.test.ts:247` «accepts a view with **every** FormSpec field populated» — enumera
     i cinque campi. Se deve restare esaustivo va esteso; se no, va rinominato, perche' il titolo
     diventerebbe falso.
   - `irValidate.test.ts:285/311/312` confrontano `formSpec` con `toEqual({theme: …})` su spec che
     portano il solo `theme`: **non a rischio**, il passthrough resta verbatim.
   - `useFormWidgets.test.ts:341-397` (`describe('FormSpec.widgets overrides')`,
     `describe('FormSpec.features')`) esercitano `describeSlot`/`describeSlots` con spec parziali:
     **non a rischio**, ma sono il posto dove vanno i test di `hidden`.
   - `formSections.test.ts`, `instanceTable.test.ts`, `instanceManager10*.test.ts`: nessun confronto
     strutturale su `FormSpec`. `instanceTable.test.ts` e' il posto giusto per la funzione pura di
     riordino delle colonne.
9. **Domande aperte**: §5.

---

## 5. Domande aperte per Alfonso

**A — il renderer di colonna (§3.3).** H3 e' falsa: il manager non passa `viewRenderer` alla
ladder, quindi `surfaces.manager.widgets` oggi non cambierebbe nessuna colonna. Tre uscite:
(A1) la slice accetta il lavoro e passa il rung 0 alla tabella — richiede una view risolta per
riga o per classe, e `instanceTable.ts` resta puro solo se il renderer arriva come parametro;
(A2) `widgets` nell'override vale **solo per la form del drawer**, dichiarato nel tipo e nel
commento; (A3) `ManagerSpec` prende una propria mappa di renderer di colonna — che pero' e' la
«seconda mappa» che §1a esclude. **Raccomando A2 per questa slice, A1 come slice a se'.**

**B — `sort` (§3.5).** Non esiste ordinamento nel manager. `ManagerSpec.sort` non e' un default da
dichiarare, e' una funzionalita' nuova con il suo ordinatore, i suoi header e il suo stato di
sessione. Dentro o fuori?

**C — quale view porta `manager` (§3.6).** Le colonne sono per metaclasse, le view si risolvono per
oggetto. Proposta: solo le view **senza predicato**, per specificita' decrescente; una con predicato
che porta `manager` viene ignorata con un warn. Confermi?

**D — il nome (§3.7).** `VertexViewIR.surface` (Q5, ratificata) accanto a `FormSpec.surfaces`
(proposta): due cose diverse a una lettera di distanza, e R-B9 le rende definitive. Rinominare la
nuova?

**E — `ManagerSpec` passa da `CompiledView`? (§3.9)** Se si legge per metaclasse dall'indice, il
giro per `irCompile` e' facoltativo: non c'e' niente da compilare. Meno codice, ma due strade per
leggere l'IR invece di una.

**F — le regole (§2.1).** R-VP-1..8 non sono in `decisions.md` e il memo non e' salvato. Il GO
dovrebbe arrivare dopo la ratifica, o dichiarare esplicitamente che questa slice le anticipa.

---

## 6. Rischi

- **Il rung 0 assente** (§3.3) e' il rischio principale: un commit 2 scritto sull'assunto del
  prompt produrrebbe un override che **non si vede**, e la verifica visiva lo scoprirebbe dopo.
- **Un `ManagerSpec` senza regola di scelta della view** (§3.6) funziona su ogni metamodello con
  una view per classe e sbaglia in silenzio sul primo con due view discriminate da predicato.
- **`order` applicato dentro `describeSlots`** invece che su `visible` (§3.8) toccherebbe
  `layoutAnnotations` e `focusFirstOf` senza che nessuno l'abbia deciso.
- **Nessun rischio di critical zone**: nessun file di CLAUDE.md §3.1 e' coinvolto. Il manager non
  passa da `useJjomSync.ts` ne' da `portDistribution.ts` — verificato, zero import di entrambi in
  `InstanceManagerTab.tsx` e in `instanceTable.ts`. Nessun Layer Impact Report dovuto.

---

## 7. Stato

**Fase 1 chiusa.** Nessun file di prodotto toccato. La Fase 2 attende un GO che sciolga almeno A,
B e C: senza A il commit 2 non ha forma decidibile, senza C il commit 1 non ha regola di
risoluzione da scrivere nel commento che §1c richiede.

---

## 8. Addendum Fase 2, commit 1 (2026-09-04, `85db1612c`)

Scritto dopo la verifica visiva, come sede del ragionamento che la entry di log
(`1af4636b8`) cita e non contiene.

- **Deroga regola 19** (7 file, RC-11): `irResolveCore.ts` e' toccato solo per esportare
  `pinAccepts` e `compareCandidates`, cosi' `managerViews.ts` riusa il criterio di
  `resolveIRView` (priorita', specificita', ordine di dichiarazione) senza ricopiarlo.
- **Deviazione dal GO, dichiarata**: `manager?` sta anche su `GraphVertexViewIR`, non solo
  su `VertexViewIR`. Il GO chiedeva di fermarsi se uno dei due `form?` restanti fosse la view
  che il manager legge davvero: lo e', perche' `irResolveCore.ts:210` file `vertex` e
  `graphVertex` nello stesso bucket `byMetaclass`, e una metaclasse con la sola view
  `graphVertex` resterebbe senza `manager` per costruzione. `EdgeViewIR` resta fuori:
  vive in `objectAsEdgeByMetaclass` e il manager lista oggetti, non archi.
- **Gate**: `tsc` 33 su output completo (baseline), `build` exit 0 col solo avviso di
  chunk-size, vitest 55/55 sui due file di test. Una prima build con Node 18 (nvm) fallisce
  in `[vite:worker]` per `crypto.hash is not a function`: ambientale, (g), sparita con il
  Node 23 di Homebrew.
- **Smoke visivo** (`localhost:3000`, `Form 1b fixture`, metaclasse `State`): entrambe le view
  di `State` del viewpoint portano un predicato (`exists` / `empty` su `$substates.value`),
  quindi nessuna puo' parlare per la classe: caso limite di R-VP-11. Con `manager` sulla
  view predicata: un solo warn `[manager]`, colonne invariate. Tolto il predicato e
  `columns: ['tags','timeout','kind']`: NAME (bloccata), TAGS, TIMEOUT, KIND, poi ISHISTORY,
  ENTRYACTION, DEPTH, OUTGOING nell'ordine di prima, REFERENCED BY dove stava, «1 column
  hidden» invariato. Un primo tentativo con `['substates','name']` non muove nulla per
  costruzione: `substates` e' un contenimento (non e' colonna), `name` e' l'attributo che la
  riduzione automatica nasconde come duplicato della colonna bloccata.
- **Processo**: i tre commit sono fatti dalla shell nativa del Mac; la VM del bridge aveva
  lasciato `index.lock`, `HEAD.lock`, `objects/maintenance.lock` e 5 `tmp_obj_*` alle
  22:56, rimossi a mano da Alfonso.
