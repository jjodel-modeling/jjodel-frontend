# Discovery: the Form authoring tab (Slice 2, Fase 1, read-only)

**Data**: 2026-08-28 16:15. Branch `alfonso-frontend-jjtl`. HEAD `e88fe0db5`.
**Prompt**: `docs/prompts/claude_2026-08-28_1615_discovery_form_tab_slice2.md` (2026-08-28 16:15).
**Stato**: Fase 1 di un two-phase. Nessun file sotto `frontend/src` toccato.

## Obiettivo

Raccogliere i fatti di codice che servono a scrivere il prompt di Fase 2 senza riaprire i file.
La Fase 2 aggiunge un tab `Form` (id `ir-form`) alla barra dell'authoring, per il solo kind
`vertex`, con quattro controlli che scrivono `draft.form` nel ciclo draft / validate / commit di
`VertexAuthoringPanel`: `theme`, `labelPlacement`, la tabella `widgets` e le righe `features`.
`basic` resta fuori (Slice 2b) e deve round-trippare verbatim.

La base normativa e' `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md`, §2 (struttura),
§5 (derivazione), §6 (visibilita'), §7 (sezioni e R-FRM-1), §13 (fallback), §14 (cosa e' Slice 2).
Il riferimento visivo e' `docs/design/design_handoff_jjodel_form_views/README.md`, sezione
«Authoring panel (6a/6b)».

## File letti

Tutti sotto `frontend/src` salvo dove indicato.

- `components/editor-v2/viewpoint/authoring/irTabs.tsx`
- `components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`
- `components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx`
- `components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx`
- `components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx`
- `components/editor-v2/viewpoint/authoring/LabelListEditor.tsx`
- `components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx` (solo la costante `CHIP`)
- `components/editor-v2/viewpoint/authoring/__tests__/edgeAuthoring.test.ts`
- `components/editor-v2/viewpoint/authoring/__tests__/rowAuthoring.test.ts`
- `components/editor-v2/viewpoint/authoring/__tests__/symbolBoxPreview.test.ts` (solo gli import)
- `components/editors/views/ViewData.tsx`
- `components/editor-v2/viewpoint/ir/irTypes.ts`
- `components/editor-v2/viewpoint/ir/useFormWidgets.ts`
- `components/editor-v2/viewpoint/ir/formSections.ts`
- `components/editor-v2/viewpoint/ir/irValidate.ts`
- `components/editor-v2/viewpoint/ir/irCompile.ts`
- `components/editor-v2/viewpoint/ir/IRForm.tsx` (parziale: 185-260)
- `components/editor-v2/viewpoint/ir/IRFormField.tsx` (parziale: grep su label/required/mono)
- `components/editor-v2/viewpoint/ir/irFormStyle.scss` (parziale: marcatori e mono)
- `components/editor-v2/viewpoint/ir/__tests__/useFormWidgets.test.ts`
- `components/editor-v2/viewpoint/ir/__tests__/formSections.test.ts`
- `components/editor-v2/hooks/useEditorMode.ts`
- `components/ui/index.ts`, `components/ui/Select/Select.tsx`,
  `components/ui/SegmentedControl/SegmentedControl.tsx`,
  `components/ui/InfoTooltip/InfoTooltip.tsx`, `components/ui/HelpText/HelpText.tsx`,
  `components/ui/ListEditor/ListEditor.tsx`, `components/ui/FormSection/FormSection.tsx`,
  `components/ui/PathBuilder/PathBuilder.tsx` (solo `PathBuilderFeatures`)
- `events/registry.ts`

**Import seguiti fuori dal perimetro dichiarato** (Rule 1: dichiarati qui):

- `model/logicWrapper/LModelElement.tsx`, per rispondere a D4 (`isEnum`, `type`).
- `view/viewElement/view.tsx`, per `set_ir` / `get_ir` (D3, D10).
- `components/editor-v2/viewpoint/ir/slotValues.ts`, solo la lista degli import (D5).
- `styles/tokens/_colors-light.scss` e `_colors-dark.scss`, solo per il token del pallino (D7).

**Comando eseguito**: `npx vitest run` sui tre file di test puri
(`useFormWidgets.test.ts`, `formSections.test.ts`, `rowAuthoring.test.ts`): 3 file, 61 test,
tutti verdi. E' il controllo positivo di D5 e nient'altro: nessun file scritto.

---

## D1. Consumatori della barra

`irTabs.tsx` esporta quattro cose che la Fase 2 tocca: `IRTabId` (19), `IR_TAB_LABELS` (31),
`irTabsForKind` (49), `irTabBodyStyle` (70). I consumatori sono tre file soltanto, piu' i tre
pannelli che usano `irTabBodyStyle`.

### Deve cambiare

1. **`irTabs.tsx:19-26`, l'unione `IRTabId`**: aggiungere `'ir-form'`.
2. **`irTabs.tsx:31-38`, `IR_TAB_LABELS`**: e' un `Record<IRTabId, string>` **esaustivo**, quindi
   il compilatore obbliga ad aggiungere `'ir-form': 'Form'`. Questo e' un effetto voluto e non un
   rischio: dimenticare l'etichetta e' un errore di tipo, non un tab senza nome a runtime.
3. **`irTabs.tsx:49-59`, `irTabsForKind`**: la lista per `vertex` e' oggi
   `['ir-applies-to', 'ir-structure', 'ir-symbol']` (54-56), poi `advanced` appende `'ir-source'`
   (58). Il Form va inserito nel ramo `vertex` e in nessun altro. Ordine della barra secondo il
   mockup: `Applies to | Structure | Symbol | Form | Source`, quindi in coda al `content` del
   ramo vertex, prima dell'append di Source. La superficie e' raggiungibile in Basic (theme e
   labelPlacement sono Basic), quindi il tab **non** va messo dietro `advanced`: e' il gating
   dentro il corpo a nascondere le due sezioni Advanced (vedi D8).
4. **`VertexAuthoringPanel.tsx`**: serve un nuovo `<div className="ir-tab-body ir-tab-body--form"
   style={body('ir-form')}>` con dentro il corpo. **Questo passo non e' opzionale.**
   `irTabBodyStyle` (irTabs.tsx:70-71) restituisce `display:none` per ogni id diverso
   dall'attivo: se `activeTab === 'ir-form'` e nessun corpo porta quell'id, **tutti** i corpi si
   nascondono e il pannello resta vuoto, senza errore ne' warning. Il pattern delle classi
   stabili e' quello dei corpi esistenti (387 per Structure, 598 per Source): il commento a
   361-364 spiega perche' servono (le classi di `FormSection` sono CSS module hashati).

### Non deve cambiare, e non cattura il tab per sbaglio

- **`ViewData.tsx:105-113`**, costruzione della barra: e' un `.map` su `irTabsForKind`, con
  `label: IR_TAB_LABELS[id]` (107) e `render` che devia solo su `id === 'ir-symbol'` (110-112).
  Ogni altro id cade su `renderIRPanel(id)` (112), che e' esattamente quello che serve. **Zero
  modifiche in questo file**, purche' il corpo esista nel pannello.
- **`ViewData.tsx:39`**, `type TabId = ... | IRTabId`: unione aperta, si allarga da sola.
- **`ViewData.tsx:93-101`, `renderIRPanel`**: instrada su `irKind`, non sull'id del tab. Nessuno
  switch esaustivo sugli id. Non va toccato.
- **`ViewData.tsx:193`, `useState<TabId>(tabs[0].id)`** e **197**,
  `tabs.find(t => t.id === activeTab) ?? tabs[0]`: il tab attivo iniziale e' sempre il primo
  della lista (`ir-applies-to` per un vertex), e se il tab attivo sparisce dall'elenco (cambio di
  kind vertex -> row, uscita da Advanced) lo stato **non** viene aggiornato ma il descrittore
  ripiega sul primo. Conseguenza da conoscere: dopo un giro row -> vertex il tab torna da solo su
  Form se `activeTab` era rimasto `'ir-form'`. E' il comportamento gia' in essere per `ir-source`
  e non introduce niente di nuovo.
- **`SymbolEditorModal.tsx:43`**, `MODAL_TABS: readonly IRTabId[] = ['ir-appearance', 'ir-text']`:
  e' una **lista**, non un Record, quindi allargare l'unione non la rompe e non la costringe.
  Il modale non offrira' il tab Form, che e' corretto: il modale e' l'anatomia del simbolo.
  `SymbolEditorModal.tsx:110`, `useState<IRTabId>('ir-appearance')`, resta valido.
  `IR_TAB_LABELS[id]` a 322 legge solo gli id di `MODAL_TABS`. **Zero modifiche.**
- **`RowAuthoringPanel.tsx` e `EdgeAuthoringPanel.tsx`**: usano `IRTabId` solo come tipo della
  prop e come argomento di `irTabBodyStyle` (289 e 513 rispettivamente). Non enumerano gli id.
  Non vanno toccati, e non renderanno mai il tab perche' `irTabsForKind` non lo offre ai loro
  kind.

### Effetto collaterale da mettere in conto

Il modale monta `VertexAuthoringPanel` (SymbolEditorModal.tsx:327) e i corpi sono **tutti
montati** in ogni mount (strada B, `irTabs.tsx:11-16`): il corpo Form calcolera' le sue righe
anche dentro il modale, dove non e' raggiungibile. Il calcolo deve quindi essere memoizzato e a
costo basso, oppure guardato su `activeTab === 'ir-form'`. Non e' una regressione, e' la stessa
condizione di Structure e Source oggi, ma la tabella widget e' l'unico corpo che deriva una riga
per feature.

---

## D2. Navigazione fra tab dal corpo

**Non esiste**, in nessuna forma. Misurato:

- `activeTab` e' uno `useState` locale di `ViewData` (`ViewData.tsx:193`), scritto solo dagli
  `onClick` dei bottoni della barra (241). Nessun setter esce dal componente.
- `VertexAuthoringPanel` riceve `activeTab` come prop di sola lettura
  (`VertexAuthoringPanel.tsx:28`) e non ha alcuna callback di ritorno verso l'host: le uniche
  props sono `view`, `activeTab`, `identity` (22-33).
- Nessun evento di navigazione fra i tab IR nel registry. `JjodelEvents.ACTIVE_TAB`
  (`events/registry.ts:9`) esiste ma e' un'altra cosa: lo emette `Dock.tsx:352` per i tab del
  dock, lo ascoltano `StatusBar.tsx:304` e `Navbar.tsx:1735`. Usarlo per la barra IR
  significherebbe far reagire quei tre consumatori a un evento che non li riguarda.
- Nessuna traccia del tab attivo IR in Redux: `mapStateToProps` di `ViewData` (272-281) legge
  `viewpoints`, `debug`, `advanced`, `view`, e nient'altro.

### Pattern da seguire

Il pattern del codebase per un corpo che chiede qualcosa all'host e' il **CustomEvent tipizzato
dal registry** (CLAUDE.md §8.6 e §8.7). Ci sono due precedenti esatti, entrambi partiti da dentro
un pannello di authoring:

- `SymbolCard.tsx:67` emette `JjodelEvents.SYMBOL_EDITOR_OPEN` con `detail: { viewId }`, e
  `SymbolEditorModal.tsx:120-129` lo ascolta su `window`;
- `VertexAuthoringPanel.tsx:534-536` emette `JjodelEvents.PROPAGATE_VIEW_SIZE` con
  `detail: { viewId }`.

Per il link «Edit compartments» la Fase 2 dovra' quindi:

1. aggiungere una costante al registry, gruppo `JjodelEvents`, nella sezione «UI Navigation»
   (`events/registry.ts:8-16`). Nome coerente con i vicini, per esempio
   `IR_AUTHORING_TAB: 'jjodel:ir-authoring-tab'`. Vietato lo string literal inline (Rule 25);
2. emetterlo dal corpo Form con `detail: { viewId: view.id, tab: 'ir-structure' }`;
3. ascoltarlo in `ViewData`, con un `useEffect` accanto allo stato del tab
   (`ViewData.tsx:193-197`), e chiamare `setActiveTab(detail.tab)`.

**Vincolo sul listener**: `ViewData` puo' essere montato piu' di una volta contemporaneamente (la
Properties card e l'host NestedView, distinti da `showBack`, `ViewData.tsx:204` e 254-262). Il
listener deve quindi filtrare su `detail.viewId === view.id`, altrimenti un click in un pannello
sposta il tab anche nell'altro. Deve inoltre ignorare un `tab` che non e' nell'elenco corrente
(`tabs.some(t => t.id === detail.tab)`), altrimenti si finisce nello stato «corpo tutto nascosto»
descritto in D1.

Questo e' l'unico punto della slice che tocca un file fuori dal perimetro authoring/ir
(`events/registry.ts` e `ViewData.tsx`). Va dichiarato nel prompt di Fase 2.

---

## D3. Ciclo di commit del draft

### Firma di `patch`

`VertexAuthoringPanel.tsx:232-235`:

```typescript
const patch = (next: VertexViewIR) => {
    dirtyRef.current = true;
    setDraft(withMetaclassPins(draft, next, pinCtx));
};
```

Prende l'ir **intera**, non una patch parziale. Alza `dirtyRef` (che e' cio' che abilita
validate e commit) e passa da `withMetaclassPins`, che riconcilia i pin solo se `metaclasses` e'
cambiata: per un edit di `form` e' un passaggio inerte. Il Form tab chiamera' quindi sempre
`patch({ ...draft, form: nextForm })` oppure `patch({ ...draft, form: undefined })`.

Non esiste un `patchForm` analogo a `patchShape` (335-336): la Fase 2 puo' introdurne uno locale
al pannello, sullo stesso modello.

### Rimozione di una chiave opzionale

Nel codebase convivono **tre** idiomi. Vanno distinti, perche' non producono lo stesso oggetto.

1. **Rebuild senza la chiave** (`FieldCompartmentListEditor.tsx:57-59`, `withChildFilter`):
   ```typescript
   return { ...comp, source: next === undefined ? { from: 'children' } : { from: 'children', filter: next } };
   ```
   La chiave non esiste proprio. E' l'idioma piu' pulito e quello che il commento chiama
   «round-trips byte-identical».
2. **`delete` su una copia** (`FieldCompartmentListEditor.tsx:67-72`, `withRowStyle`):
   ```typescript
   const rowFormat = { ...comp.rowFormat };
   if (style === undefined) delete rowFormat.style;
   ```
   Stesso risultato.
3. **Spread con `undefined` esplicito** (`VertexAuthoringPanel.tsx:492`, il Padding;
   `VertexAuthoringPanel.tsx:512`, il Marker): `patchShape({ padding: undefined })` produce un
   oggetto che **ha la chiave** con valore `undefined`.

L'idioma 3 e' il piu' diffuso nel pannello ed e' innocuo in pratica, perche' `JSON.stringify`
elimina le chiavi `undefined`: sono equivalenti per la persistenza, per `irHash`
(`irCompile.ts:285-289`, che e' `JSON.stringify` piu' djb2) e per il tab Source
(`irTabs.tsx:190`, che e' `JSON.stringify(ir, null, 2)`). Non sono equivalenti per l'oggetto in
memoria fra il patch e il primo `seed()` successivo, che ripassa da `clone` (JSON round-trip,
`VertexAuthoringPanel.tsx:74` e 89).

**Raccomandazione per la Fase 2**: usare l'idioma 1 per la rimozione delle chiavi dentro
`FormSpec`, ed estenderlo al caso in cui `FormSpec` si svuota. Un `form: {}` residuo non e' un
errore (vedi sotto), ma e' rumore persistito per sempre (R-B9: la ir salvata non ha
VersionFixer). Un helper puro `withFormKey(form, key, value)` che elimina la chiave sul default e
restituisce `undefined` quando l'oggetto resta vuoto e' la forma giusta, ed e' testabile in node.

### Dove gira `validateIR`, e cosa fa con `form`

`VertexAuthoringPanel.tsx:145-158`: un `useEffect` su `[draft, view.id]` che esce subito se
`dirtyRef.current` e' falso (146), chiama `validateIR(view.id, draft)` (147), mostra l'errore
inline e **non committa se non valido** (149). Se valido, `setTimeout` di
`COMMIT_DEBOUNCE_MS = 300` (69) e poi `(view as any).ir = draft` (154). C'e' un secondo flush
sincrono all'unmount (162-180, D15), con le stesse guardie piu' il controllo sul `kind`.

`irValidate.ts` con `form`:

- **`findUnknownPredicateOp` (77-95) attraversa tutta la ir**, `form` inclusa, e tratta ogni
  chiave `op` con valore stringa come operatore di predicato. E' esattamente il vincolo che
  `irTypes.ts:238-241` e la spec §2 dichiarano: **nessuna chiave `op` stringa dentro
  `FormSpec`, a qualunque profondita'**. La struttura decisa in chat non ne ha (i valori sono
  `Record<string, WidgetKind>` e `Record<string, FeatureTreatment>`), ma il vincolo va scritto nel
  prompt perche' vale per ogni estensione futura, e la violazione produce un messaggio sui
  predicati che non nomina la form.
- Non esiste **nessun'altra** regola su `form` in `irValidate`. Le due regole di vocabolario
  (`VALID_PADDING_VALUES` 40, `VALID_ROUTING_VALUES` 27) non lo toccano.
- Dopo lo scan, `validateIR` chiama `compileView(viewId, ir)` (172). `compileView` fa
  `const formSpec = ir.form ?? null` (`irCompile.ts:322`): **passthrough puro**, nessun compile,
  nessun accessor, nessun contributo a `deps` / `crossPathSink` / `channelSink`. Il commento a
  316-321 lo dichiara, e la spec §3 lo ratifica.

**Cosa succede a `form: {}`**: passa. `{} ?? null` e' `{}`, che e' truthy, quindi
`CompiledView.formSpec` diventa un oggetto vuoto invece di `null`. A valle,
`useFormWidgets.describeSlot` legge `spec?.widgets?.[name]` e `spec?.features?.[name]` con optional
chaining (241, 258), `isBasicField` fa `Array.isArray(declared)` su `spec?.basic` (297-299), e
`IRForm.tsx:210` risolve il tema con `spec?.theme ?? defaultTheme`. **Un `form: {}` e' quindi
funzionalmente indistinguibile da `form` assente**: nessun crash, nessuna resa diversa. Resta
sporcizia persistita, non un bug.

### Round-trip verbatim di `draft.form`

Confermato, per costruzione. Il commit e' un **whole-object replace** del draft clonato
(`VertexAuthoringPanel.tsx:154`), e il draft nasce da `clone((view as any).ir ?? defaultObjectViewIR())`
(89), cioe' `JSON.parse(JSON.stringify(...))` (74). Ogni campo che nessun editor tocca viene
riscritto identico: e' la garanzia che il commento di modulo (80-84) dichiara gia' per
`fieldCompartments`, `badges` e i Conditional, e vale per `form` allo stesso titolo. In
particolare **`form.basic`, fuori scope in questa slice, sopravvive** finche' il Form tab non
riscrive `draft.form` da zero. Da qui una regola operativa per la Fase 2: gli helper devono
partire da `{ ...draft.form }` e cambiare una chiave, **mai** costruire un `FormSpec` nuovo dai
soli quattro controlli, che cancellerebbe `basic` in silenzio.

`set_ir` (`view/viewElement/view.tsx:591-604`) scrive l'oggetto **per riferimento**
(`SetFieldAction.new(c.data, "ir", val, '', false)`) dentro una TRANSACTION che aggiorna anche
`appliableTo` quando il `kind` lo richiede. Nessuna copia, nessuna normalizzazione: quello che il
draft contiene e' quello che finisce nello store.

---

## D4. Feature della metaclasse target

### Cosa restituisce `featureInfo`

`VertexAuthoringPanel.tsx:248-303`. Il memo restituisce
`{ features: PathBuilderFeatures | null, metamodelsWithClass: number, targetName: string | null }`.
Risoluzione (252-286): prende `draft.metaclasses[0]` come nome, risolve l'**id** con
`resolveMetaclassId` sulla catena pin -> appliesTo -> candidates (256-260), poi scorre i
metamodelli del progetto chiamando `getMetaclassInfo` e cerca la classe **per id**, con fallback
al primo match per nome (263-285). Il commento 240-247 spiega perche' l'identita' vince sul nome:
due metamodelli possono dichiarare la stessa classe.

La proiezione finale (287-297) e' **lossy** rispetto a quello che serve al Form tab:

```typescript
features: {
    attributes: (target.allAttributes ?? target.attributes ?? []).map((a) => ({
        name: a.name, type: a.type, upperBound: a.upperBound,
    })),
    references: (target.references ?? []).map((r) => ({
        name: r.name, targetClassName: r.targetClassName, upperBound: r.upperBound,
    })),
}
```

Perde `lowerBound` su entrambi, perde `containment` sulle reference, e non ha mai avuto un flag
enum. Il tipo di arrivo e' `PathBuilderFeatures` (`components/ui/PathBuilder/PathBuilder.tsx:13-16`),
che e' proprio quei tre campi per lato.

### Cosa serve al Form tab

Per attributo: `name`, `type`, `lowerBound`, `upperBound`, e **se il tipo e' un enum**.
Per reference: `name`, `containment`, `upperBound` (e `lowerBound`, per coerenza con la spec §6,
anche se `basic` e' fuori slice).

Tutto tranne l'enum e' gia' in `MetaclassInfo` (`useEditorMode.ts:43-59`):
`MetaclassAttribute` (62-68) ha `id, name, type, lowerBound, upperBound`; `MetaclassReference`
(70-79) ha `id, name, targetClassId, targetClassName, containment, aggregation, lowerBound,
upperBound`. Il campo si chiama **`containment`**, non `composition`, ed e' popolato da
`containment: !!(ref.composition)` (`useEditorMode.ts:412`).

**Raccomandazione**: NON allargare `PathBuilderFeatures` (vedi D10). Allargare invece il tipo di
ritorno del memo `featureInfo`, che e' un tipo **anonimo locale** dichiarato inline a 248-251,
aggiungendo `target: MetaclassInfo | null`. `MetaclassInfo` e' gia' importato
(`VertexAuthoringPanel.tsx:5`). Il Form tab legge allora
`featureInfo.target?.allAttributes ?? featureInfo.target?.attributes` e
`featureInfo.target?.references`, con tutti i campi. Il ramo di uscita anticipata a 253-255 e
quello a 286 devono restituire `target: null`.

### Il flag enum: quale idioma

Su `attr.type` sono disponibili **entrambe** le forme, e sono la stessa cosa:

- `attr.type.isEnum`: l'accessor e' `get_isEnum` in
  `model/logicWrapper/LModelElement.tsx:1690-1692`, dichiarato sulla classe `LClassifier`
  (1634), e il corpo e' `return context.data.className === DEnumerator.cname;`.
- `attr.type.className === 'DEnumerator'`: legale e coerente con CLAUDE.md §3.13 (un proxy L
  riporta il className del D layer).

`attr.type` **e' un proxy `LClassifier`**: `LStructuralFeature` dichiara `type!: LClassifier`
(`LModelElement.tsx:2126`), e `LAttribute` ne discende. Quindi `get_isEnum` e' definito su quel
proxy e non c'e' rischio di `undefined`.

**Idioma da usare: `attr.type?.isEnum`.** Motivi: e' l'accessor dichiarato, e' gia' quello che il
codebase usa in `get_enumType` (`LModelElement.tsx:1366`) e in
`model/conformance/ConformanceValidator.ts:303` (`if (attrType && attrType.isEnum)`), e non
duplica la conoscenza del nome di classe D. La forma `className === 'DEnumerator'` esiste anche
lei nel codebase, in `useFormWidgets.ts:222` (`const isEnum = featureClass === 'DAttribute' &&
typeClass === 'DEnumerator';`), ma li' si legge da fixture di test che sono oggetti piatti, non
da proxy: e' un contesto diverso e non e' un precedente per questo punto.

### Dove aggiungere `isEnum?: boolean`

Tre punti in `components/editor-v2/hooks/useEditorMode.ts`:

1. **`interface MetaclassAttribute` (62-68)**: aggiungere `isEnum?: boolean;`. Opzionale, quindi
   compatibile con Rule 11 (aggiungere proprieta' opzionali a un'interfaccia esportata e'
   permesso) e con i letterali `MetaclassInfo` costruiti altrove. Documentare come fa gia'
   `isSingleton` (47-50) e `allAttributes` (52-55).
2. **popolamento `attributes` (376-387)**: dentro il `push`, aggiungere
   `isEnum: !!attr.type?.isEnum,`. Il blocco e' gia' dentro un `try/catch` che assorbe le
   eccezioni dei proxy (386).
3. **popolamento `allAttributes` (392-403)**: identico, stesso `try/catch` (402).

**Nota**: `references` non ha bisogno di niente, `containment` c'e' gia' (412).

**Alternativa senza toccare `useEditorMode.ts`**: leggere `isEnum` direttamente sui proxy dentro
il Form tab. Sconsigliata: significherebbe rifare la risoluzione della classe target, che
`featureInfo` fa gia' e fa per identita'. Vale la pena dichiarare l'estensione dei tre punti nel
prompt di Fase 2, dato che `useEditorMode.ts` non e' nel perimetro `authoring/`.

---

## D5. Riuso di `useFormWidgets.ts`

### `overrideIsCompatible`

`useFormWidgets.ts:117-137`. E' `function overrideIsCompatible(derived: WidgetKind, override:
WidgetKind): boolean`, **non esportata**. Unico chiamante: la riga 242 dello stesso file.
Esportarla e' **puramente additivo**: nessun altro simbolo si chiama cosi' nel modulo, non c'e'
un barrel che riesporti `useFormWidgets` (i consumatori importano il path diretto, misurato:
`IRFormField.tsx:25-26`, `formSections.ts:20`, `IRForm.tsx:27`, e i quattro widget sotto
`ir/widgets/` che importano solo il tipo `FormFieldOptionGroup`), e nessun test la referenzia. Il
commento di 106-116 anticipa gia' l'uso di Slice 2: «the AUTHORING surface may well want to
refuse such an override at commit time (the R-B9-bis criterion). That belongs to Slice 2».

La tabella che il Form tab deve costruire, cioe' «le sole alternative che `overrideIsCompatible`
accetta», si ricava scorrendo `WidgetKind` (`irTypes.ts:224-226`, otto valori: `text`,
`textarea`, `select`, `checkbox`, `color`, `number`, `reference`, `link`) e filtrando su
`overrideIsCompatible(derived, k)`. Dalla lettura del corpo, il risultato e':

| derived | override accettati oltre a se stesso |
|---|---|
| `text` | `textarea`, `link` |
| `textarea` | `text`, `link` |
| `number` | `text` |
| `select` (enum) | nessuno |
| `reference` | `select` |
| `checkbox` | nessuno |
| `color`, `link` | nessuno (ramo `default`) |

**Nota per la Fase 2**: `color` non compare come `derived` in nessun ramo, quindi cade nel
`default: return false` (136). Un attributo non arriva mai a `color` per derivazione
(`widgetForPrimitive` non lo produce mai), quindi il caso non si presenta partendo dal tipo. Puo'
presentarsi come **override persistito**: `widgets: { foo: 'color' }` su una `EString` viene oggi
scartato, perche' `overrideIsCompatible('text', 'color')` e' falso. Questo e' il caso «override
incompatibile gia' persistito» del prompt, che va reso come chip «ignored» con `Clear` e mai
riscritto in silenzio. La lista dei chip si calcola confrontando ogni chiave di `draft.form.widgets`
con il derivato della feature omonima: chiave senza feature corrispondente **oppure** override che
`overrideIsCompatible` rifiuta.

### Importabilita' in ambiente node

**Confermata, con controllo positivo eseguito.**

- Catena di import di `useFormWidgets.ts` (27-29): `react` (solo `useMemo`), `./irTypes`
  (`import type`, cancellato in compilazione), `./slotValues`. `slotValues.ts` **non ha nessuna
  riga di import** (grep su `^import`: zero risultati), e il suo commento di modulo (6-9)
  dichiara proprio che esiste per non tirare `../../../../joiner` e quindi Monaco e quindi
  `window` a import time. `irTypes.ts` ha un solo import, `import type { ReadCtx } from
  './irReadCtx';` a 574, anch'esso type-only.
- `__tests__/useFormWidgets.test.ts` importa `../useFormWidgets` direttamente (16-21) e gira in
  ambiente node su fixture piatte.
- Eseguito: `npx vitest run` sui tre file puri -> **3 file, 61 test, tutti verdi**.

`widgetForPrimitive` e' gia' esportata (92) e prende **un nome di tipo**, non uno slot: e'
esattamente quello che serve al Form tab, che deriva il widget da `MetaclassAttribute.type` senza
avere nessun oggetto M1 sotto mano. Con `isEnum` (D4) la derivazione lato authoring diventa:

```
isEnum            -> 'select'
containment || reference -> 'reference'
altrimenti        -> widgetForPrimitive(typeName).widget
```

che e' la stessa cascata di `describeSlot` (`useFormWidgets.ts:226-238`), riordinata sui dati del
metamodello invece che sugli slot. **Non e' riusabile `describeSlot`**: prende uno slot L-proxy
(`slot.instanceof`, `slot.__raw.values`, `slot.validTargetOptions`) che in authoring non esiste,
perche' non c'e' nessuna istanza. La duplicazione della cascata e' quindi inevitabile e va
dichiarata, come `useFormWidgets` dichiara la propria rispetto a `Info.value` (10-15).

---

## D6. Adattatore per `buildFormSections`

### Campi letti

`formSections.ts:59-95`. Da `CompiledFieldCompartment` legge **tre campi e basta**:

- `c.source` (78, per il gruppo; 88, per l'insieme `claimed`);
- `c.id` (77, chiave `${c.id}-${i}`; e in `sectionTitle`, 39-42, come fallback del titolo);
- `c.title` (via `sectionTitle`, 38).

Non legge `segments`, `visible`, `separator`, `childFilter`, `rowStyle`. La firma di
`sectionTitle` e' **gia'** `Pick<CompiledFieldCompartment, 'id' | 'title'>` (38), il che conferma
l'intenzione.

Da `FormFieldDescriptor` legge **due campi**: `f.isReference` e `f.isComposition` (65-67). Non
legge `name`, che compare solo nei test.

### Allargare la firma

Il problema vero non e' il lato compartimenti, e' il lato campi: **in authoring non esistono
`FormFieldDescriptor`**, perche' non c'e' nessun oggetto M1 e nessuno slot. Il Form tab ha righe
derivate dal metamodello. Sintetizzare `FormFieldDescriptor` finti (con `slot: null`, `values: []`,
`slotId: ''`) e' possibile ma sporco e fragile.

**Forma raccomandata**, additiva e compatibile:

```typescript
export interface Section<F = FormFieldDescriptor> { key: string; title: string; fields: F[]; }

export function buildFormSections<F extends Pick<FormFieldDescriptor, 'isReference' | 'isComposition'>>(
    fields: F[],
    compartments: Pick<CompiledFieldCompartment, 'id' | 'source' | 'title'>[],
): Section<F>[]
```

Compatibilita' verificata sui due chiamanti attuali:

- **`IRForm.tsx:193`**: `buildFormSections(visible, resolution?.compiled?.fieldCompartments ?? [])`.
  `visible` e' `FormFieldDescriptor[]` (146), i compartimenti sono `CompiledFieldCompartment[]`.
  L'inferenza da' `F = FormFieldDescriptor` e i compartimenti soddisfano il `Pick`. Il `.filter(s
  => s.fields.length > 0)` che segue resta valido.
- **`__tests__/formSections.test.ts`**: costruisce i suoi input con dei cast
  (`{ name, isReference, isComposition } as FormFieldDescriptor` a 21-23,
  `{ id, source, title } as CompiledFieldCompartment` a 25-26) e importa `type Section` (13).
  Con il default generico `Section<FormFieldDescriptor>`, `const names = (s: Section | undefined)`
  (32) continua a compilare. **Nessuna modifica al test e' necessaria.**

Con questa firma l'adattatore di authoring diventa una riga: mappare i `FieldCompartmentSpec` del
draft in `{ id: fc.id, source: fc.source.from, title: fc.title }` e passare le righe derivate dal
metamodello, che devono solo esporre `isReference` e `isComposition`.

**Alternativa senza generico**: lasciare la firma com'e' e castare in authoring. Funziona, ma
sposta il debito nel chiamante nuovo e non dichiara che i due campi sono gli unici letti.

### `title` sul lato spec e sul lato compilato

- `FieldCompartmentSpec.title?: string` esiste, **`irTypes.ts:147`** (con il commento a 141-146:
  assente = l'`id` con la prima lettera maiuscola, ignorato dal renderer del simbolo, additivo).
- `irCompile.ts:361-370` lo copia **verbatim e solo se presente**:
  `...(fc.title !== undefined ? { title: fc.title } : {})`. Il commento a 366-368 dichiara la
  ragione: il fallback appartiene all'host della form, e materializzarlo in compilazione
  renderebbe indistinguibile un titolo autorato da uno derivato.
- Il fallback vive quindi in un posto solo, `formSections.sectionTitle` (38-42). **Non e'
  esportata**, ma non serve esportarla: se l'adattatore di authoring passa `title: fc.title`
  (anche `undefined`), `buildFormSections` applica da se' lo stesso fallback che la form
  applichera'. Titoli identici garantiti per costruzione, non per copia.

**Difetto trovato, da segnalare ad Alfonso**: `FieldCompartmentSpec.title` **non e' autorabile da
nessuna parte**. `FieldCompartmentListEditor.tsx` (letto per intero) offre Id, Source, filtro
children, Row segments, Row style, Row separators, Visible: nessun campo Title. Quindi oggi il
titolo di sezione che la form mostra e' sempre l'id capitalizzato, per ogni view creata
dall'interfaccia. Non e' nello scope di questa slice, ma il tab Form mostrera' quei titoli
derivati accanto al link «Edit compartments», e la domanda «dove cambio il titolo» arrivera'
subito.

---

## D7. Primitive UI disponibili

Barrel: `components/ui/index.ts`. Diciannove componenti esportati.

### Segmented control

**Esiste**: `SegmentedControl` (`components/ui/SegmentedControl/SegmentedControl.tsx`), esportato
dal barrel con `SegmentedControlProps` e `SegmentedControlOption`. E' il pattern dichiarato per
una scelta esclusiva fra pochi valori (commento 39-52, decisione D1 del 2026-08-05). Firma:

```typescript
interface SegmentedControlOption<T extends string = string> { value: T; label: string; icon?: string; }
interface SegmentedControlProps<T extends string = string> {
    options: SegmentedControlOption<T>[]; value: T; onChange: (value: T) => void;
    ariaLabel: string;      // obbligatorio
    disabled?: boolean;     // disabilita TUTTO il controllo
    id?: string;
}
```

Consumatori attuali: `ConditionalEditor.tsx:107` e `IRForm.tsx:221` (il toggle Basic/Advanced
della form). `Toggle` e' un'altra cosa, l'interruttore orizzontale on/off di `_switch.scss`.

**Lacuna, ed e' quella che il prompt chiede**: non c'e' **disabilitazione per segmento** e non c'e'
tooltip per segmento. `disabled` (36) e' del gruppo intero e ricade su ogni bottone (103). Per
«`Inline` disabilitato con tooltip sulle multivalore» servono due proprieta' opzionali su
`SegmentedControlOption`, per esempio `disabled?: boolean` e `title?: string`, e due righe nel
render (100-115) per non selezionare un segmento disabilitato e per passare il `title` al bottone.
E' un'aggiunta di **proprieta' opzionali a un'interfaccia esportata**, quindi ammessa da Rule 11,
ma tocca `components/ui/`, che e' fuori dal perimetro authoring: va dichiarata nel prompt di
Fase 2 e messa in conto come modifica a un primitivo condiviso con due consumatori esistenti.

Alternativa senza toccare il primitivo: non renderizzare affatto il segmento `Inline` sulle
multivalore, e mettere la spiegazione in un `InfoTooltip` accanto al nome della feature. Costa
zero modifiche condivise. E' una decisione di design, non di codice: sta ad Alfonso.

### Select con opzione disabilitata e tooltip

`Select` **supporta l'opzione disabilitata**: `SelectOption` ha `disabled?: boolean`
(`Select/Select.tsx:6-10`) e il render lo passa all'`<option>` sia nel ramo piatto (124) che nei
gruppi (114). **Non supporta un tooltip per opzione**: nessun `title` sull'`<option>`, e il
browser non lo mostrerebbe in modo affidabile. Altre due cose utili: `placeholder` con default
`'Select...'` viene sempre reso come prima `<option value="">` (111), e `options` accetta sia una
lista piatta sia gruppi `<optgroup>` (`SelectOptions`, 26). Per la riga widget serve la lista
piatta, con la prima voce `Default (<derivato>)` a `value: ''`. Attenzione: l'`<option value="">`
del placeholder verrebbe **in piu'**, quindi conviene passare `placeholder` con l'etichetta del
default e non aggiungere una voce propria, che e' l'idioma gia' usato dal Padding
(`VertexAuthoringPanel.tsx:487-495`, e la nota «Select condiviso, 2026-08-08» a 481-484: un
vocabolario chiuso non persiste mai `''`).

### InfoTooltip, HelpText, ListEditor, FormSection

```typescript
// InfoTooltip/InfoTooltip.tsx:37-48
type InfoTooltipProps = { text: string; title?: string };

// HelpText/HelpText.tsx:16-34
interface HelpTextProps { children: React.ReactNode; icon?: boolean /* default true */; className?: string; id?: string }

// ListEditor/ListEditor.tsx:4-21
interface ListEditorProps<T> {
    items: T[]; renderItem: (item: T, index: number) => React.ReactNode;
    onRemove: (index: number) => void; onMove: (index: number, delta: number) => void;
    onAdd?: () => void; addLabel?: string; emptyHint?: string;
    itemLabel?: (item: T, index: number) => string;
}

// FormSection/FormSection.tsx:4-20
interface FormSectionProps { title: string; divider?: boolean /* default true */; children: React.ReactNode }
```

`ListEditor` **non serve** al Form tab: le righe widget e features non sono riordinabili ne'
aggiungibili, sono derivate dalla metaclasse. Serve `FormSection` per i gruppi, con
`divider={false}` come ovunque nel pannello.

### Pattern di riga tabellare «nome in mono + controllo a destra»

**Non esiste nell'authoring.** Misurato su tutti gli editor di riga del pannello:

- `FieldSegmentEditor.tsx:49-74`: un `div.jj-field` con dentro i controlli in colonna, nessun nome
  in mono, nessuna griglia.
- `LabelListEditor.tsx` e `LabelEntryEditor.tsx`: delegano a `ListEditor`, che rende una intestazione
  di riga (`itemLabel`, default `#<n>`) e sotto il corpo.
- `FieldCompartmentListEditor.tsx`: idem, tutto in `div.jj-field` con `label.jj-field-label` sopra
  il controllo.

Il pannello di authoring e' interamente costruito sulle classi globali `jj-field` /
`jj-field-label` / `jj-field-hint`, la cui casa e' **`styles/components/_form-system.scss`** (unico
foglio che le dichiara insieme a `components/editors/properties-with-tree-view.scss`), piu' stili
inline dove serve. Non ha uno SCSS proprio: gli unici due fogli in `authoring/` sono
`SymbolCard.scss` e `SymbolEditorModal.scss`.

Il mono in griglia esiste invece **nella form**, non nell'authoring:
`irFormStyle.scss:397-399` (`.ir-field__control--mono`, `font-family: var(--font-mono)`),
`:304` e `:314` (`.ir-field__hint` e `.ir-field__mult`, mono a `var(--text-2xs)`). Sono classi del
pannello form, non riusabili come sono in un altro componente senza importare quel foglio.

**Conseguenza per la Fase 2**: la tabella widget del mockup 6a (riga 30px, nome feature in mono
12px, select 110px) **non ha un pattern esistente da riusare**. Va costruita, e la scelta e' fra
stile inline (l'idioma del pannello, cfr. `CHIP` sotto e i molti `style={{...}}` in
`VertexAuthoringPanel`) e un nuovo foglio `.scss` accanto al componente (l'idioma di
`SymbolCard.scss`). Serve una decisione, la registro fra le domande aperte.

### Chip read-only «preserved verbatim»

**Non e' una classe CSS: e' una costante `React.CSSProperties` inline, duplicata tre volte.**

- `FieldCompartmentListEditor.tsx:75-84`, `const CHIP`, con il commento «Same visual convention as
  LabelEntryEditor's CHIP, inline style, no new CSS class».
- `FieldSegmentEditor.tsx:12-21`, byte per byte la stessa.
- `LabelEntryEditor.tsx:15`, la terza copia.

Contenuto: `display:inline-block`, `fontSize: var(--font-size-sm)`,
`color: var(--color-text-tertiary)`, `fontStyle: italic`, `padding: 2px 6px`,
`border: 1px dashed var(--color-border-primary)`, `borderRadius: var(--radius-sm)`.

Usi attuali: `unsupported source: <x> (preserved)`, `advanced predicate (preserved)`,
`editable: advanced widget`. Il chip «ignored» degli override incompatibili e' esattamente lo
stesso registro e va reso con la stessa costante. **Nota**: sarebbe la quarta copia. Il commento
di `useFormWidgets.ts:10-15` fissa la regola del progetto per i duplicati deliberati: «If a third
appears, extract then». Qui siamo alla quarta. Estrarla e' una modifica a `components/ui/` fuori
scope: la segnalo e basta, non la propongo dentro questa slice.

### Pallino ciano «overridden default»

Esistono **due** marcatori tondi, entrambi in `irFormStyle.scss`, entrambi sullo **stesso token**:

- `.ir-field__required` (286-292): 4px, `background: var(--color-marker-required)`. Il commento a
  284-285 spiega la scelta: un pallino e non un asterisco, ciano e non rosso, perche' il rosso e'
  riservato alla diagnostica.
- `.ir-field__dirty-dot` (365-372): 6px, stesso `background`, piu' `box-shadow: 0 0 0 2px
  var(--color-form-dirty-halo)`. Il commento a 363-364 dice perche' 6 e non 4: deve leggersi come
  stato accanto al pallino di obbligatorieta', con cui puo' convivere sulla stessa riga.

Token: **`--color-marker-required`**, definito in `styles/tokens/_colors-light.scss:408`
(`#0ea5e9`) e in `_colors-dark.scss:302` (`#38bdf8`, con la nota «sky-400: #0ea5e9 loses contrast
on #0f1012»). E' il token giusto: il mockup chiede «5px cyan dot» e il design system riserva il
ciano `#0ea5e9` proprio a marcatori e stati attivi (CLAUDE.md §7.1).

Le due classi vivono pero' nel foglio della **form**, non dell'authoring. Il pannello non importa
`irFormStyle.scss`. Quindi: token riusabile subito, classi no. Il pallino della tabella widget
sara' `background: var(--color-marker-required)` in inline style, oppure una classe nuova nel
foglio nuovo, secondo la decisione di cui sopra.

---

## D8. Gating Advanced dentro un tab

`advanced` arriva al pannello da Redux, in sola lettura:
`VertexAuthoringPanel.tsx:99`, `const advanced = useSelector((s: any) => !!s.advanced);`. Il
commento 94-98 dichiara che il write path e' altrove (l'intestazione della Properties card) e che
Redux e' il canale di broadcast che ogni scrittore di modalita' aggiorna.

Nel pannello convivono **due** meccanismi, con significati diversi:

1. **Rendering condizionale della sezione**: `{advanced && (<FormSection title="Padding" ...>)}`,
   `VertexAuthoringPanel.tsx:486-497`. E' l'unico caso oggi, ed e' il pattern per «Widgets» e
   «References and children».
2. **`allowConditional={advanced}`** passato a `ConditionalEditor` (446, 462, 516) e a
   `LabelListEditor` (589): non nasconde la sezione, disabilita solo il ramo condizionale. Non
   serve al Form tab, dove nessun valore e' `Conditional`.

C'e' anche un gating **a livello di barra**, `irTabsForKind` con `'ir-source'` (`irTabs.tsx:58`),
che il tab Form **non** deve usare: la sua meta' Basic (theme, labelPlacement) e' raggiungibile in
Basic per decisione di slice, ed e' esattamente il rovescio di Source.

**Pattern da seguire per la Fase 2**:

```
Theme            -> sempre reso
Labels           -> sempre reso
{advanced ? (Widgets + References and children) : (nota informativa)}
```

La nota informativa in Basic e' `<HelpText icon={false}>` , che e' l'idioma del pannello dentro la
Properties card (commento a `VertexAuthoringPanel.tsx:527-528`: senza il glifo (i), come riga
indentata sotto il label). Contenuto, dal mockup 6a: «info note that widgets derive from feature
types». La nota deve dire anche **dove** stanno i controlli nascosti, cioe' che passando ad
Advanced compaiono; e' la stessa logica cross-tab di `FEATURES_HINT`
(`VertexAuthoringPanel.tsx:73`), che nomina il tab dove sta la causa.

Un dettaglio da non sbagliare: il commento a `irTabs.tsx:44-47` fissa la regola vigente, «Source
is the only advanced-gated tab (R-3): every other tab is reachable in Basic, matching included».
Aggiungere il Form in Basic la rispetta; metterlo dietro `advanced` la violerebbe e andrebbe
ratificato.

---

## D9. Test esistenti da estendere

### Cosa coprono i due test di authoring

`__tests__/edgeAuthoring.test.ts` (308 righe). **Non renderizza niente.** Il commento di modulo
(14-18) e' esplicito: «EdgeAuthoringPanel / EnableIRPanel are NOT import-safe in the node vitest
env (they import joiner -> monaco-editor -> `window` undefined)», quindi i seed del pannello sono
**letterali rispecchiati** guidati attraverso `validateIR` / `compileEdgeView` / `getIRIndex`, le
stesse funzioni che il pannello usa. Gli helper puri veri (`isUsableEndpointExpr`,
`nextEdgeForEndpoints`, `dropEndpoints`) sono invece **importati** da `ir/edgeEndpoints`, perche'
li' vivono in un modulo puro.

`__tests__/rowAuthoring.test.ts` (174 righe). Stessa architettura, e per questa discovery e' il
precedente esatto: importa **quattro helper puri esportati da un componente**
(`isKnownCompartmentSource`, `classifyChildFilter`, `withChildFilter`, `withCompartmentSource`,
righe 15-20) e li esercita in node. Funziona perche' quegli helper sono dichiarati **prima** del
componente e il file, pur importando `../../../ui`, viene caricato... verificato eseguendo: il
file passa (61 test verdi complessivi sui tre file). I `describe` sono cinque
(38, 53, 73, 99, 118) piu' uno sul seed di `EnableIRPanel` (142), e coprono: riconoscimento dei
source, classificazione del filtro children, rimozione della **chiave** e non del valore
(`74: 'undefined drops the filter KEY (bare {from:children}), not filter:undefined'`), non
mutazione dell'input, preserve-verbatim di source sconosciuti e filtri avanzati.

`__tests__/symbolBoxPreview.test.ts` (54 righe): due helper puri importati dal componente
(`captionForBox`, `fitScale`).

### Test su `irTabsForKind`

**Non esiste.** Grep su `irTabsForKind` e `activeTab` in tutti i `*.test.ts` / `*.test.tsx`: zero
risultati. La partizione a cinque tab non ha copertura.

### Dove vanno i test della Fase 2

**`frontend/src/components/editor-v2/viewpoint/authoring/__tests__/formAuthoring.test.ts`**, nuovo
file, sul modello di `rowAuthoring.test.ts`. Cosa deve coprire, tutto in node e senza render:

1. **mappa etichette dei widget**: per ogni `derived`, l'elenco delle alternative offerte coincide
   con quelle che `overrideIsCompatible` accetta (una volta esportata, D5). Il test la importa da
   `ir/useFormWidgets` e la incrocia con la lista di opzioni prodotta dall'helper del Form tab:
   e' il modo per non far divergere due copie della tabella.
2. **calcolo del derivato da tipo**: la cascata enum -> reference/containment ->
   `widgetForPrimitive`, sui casi dello Statechart che gia' usa `useFormWidgets.test.ts`.
3. **rimozione della chiave sul default**: `theme` su «Host default», `labelPlacement` su
   `above`, un widget su `Default`, un treatment sul valore derivato dalla molteplicita'. Le
   asserzioni vanno scritte come in `rowAuthoring.test.ts:74-80`, cioe' su
   `Object.prototype.hasOwnProperty` / `JSON.stringify`, non su `=== undefined`, che passerebbe
   anche con la chiave presente.
4. **`basic` preservata**: partire da `form: { basic: ['name'] }`, cambiare il tema, verificare che
   `basic` esca identica. E' il round-trip che D3 identifica come il rischio numero uno.
5. **adattatore delle sezioni**: `FieldCompartmentSpec[]` del draft -> l'input di
   `buildFormSections`, con l'assert che i titoli coincidono con quelli che la form produce
   (stessa funzione, quindi l'assert e' sull'adattatore) e che i gruppi non reclamati portano la
   chiave `residual-<gruppo>`.
6. **degrado `inline` su multivalore**: il valore che l'authoring propone come «derivato» per una
   feature con `upperBound !== 1` e' `list`, coerente con `describeSlot`
   (`useFormWidgets.ts:259-262`).

I test di `useFormWidgets` e `formSections` **non vanno modificati**, tranne eventualmente un caso
in piu' su `overrideIsCompatible` se la si esporta. La firma generica proposta in D6 li lascia
compilare senza tocchi (verificato leggendo i cast a `formSections.test.ts:21-26`).

---

## D10. Rischi

**R1. `PathBuilderFeatures` non va esteso.** E' dichiarato in
`components/ui/PathBuilder/PathBuilder.tsx:13-16`, e' esportato dal barrel `ui` e ha tre
consumatori nell'authoring (`MatchingSection`, `FieldCompartmentListEditor`, `LabelListEditor`,
`BadgeListEditor`, `TextStyleField`, tutti via la prop `features`). Aggiungerci `lowerBound`,
`containment` o `isEnum` significherebbe portare concetti della form dentro il costruttore di
path, e obbligherebbe ogni produttore del tipo a riempirli. La strada e' D4: `featureInfo`
restituisce anche `target: MetaclassInfo | null` e il Form tab legge da li'.

**R2. Il commit e' whole-object: un `FormSpec` ricostruito da zero cancella `basic`.** Vedi D3.
Gli helper devono partire da `{ ...draft.form }`. Questo e' il rischio piu' probabile della slice,
perche' non produce nessun errore: `basic` semplicemente scompare, e la form torna all'euristica
`lowerBound >= 1` senza dirlo. Un test lo copre (D9 punto 4).

**R3. Il flush all'unmount (D15) committa anche il Form.** `VertexAuthoringPanel.tsx:162-180`:
alla smontata, se il draft e' sporco, valido e dello stesso `kind`, viene scritto sincronicamente.
Vale anche per un edit del tab Form fatto un istante prima di chiudere il modale o di cambiare
selezione. E' il comportamento voluto, ma va tenuto presente per un caso preciso: se il Form tab
introduce uno stato intermedio non valido (per esempio un `FormSpec` a meta' durante una
sequenza di edit), quello stato puo' essere flushato. La regola e' che ogni chiamata a `patch`
deve lasciare il draft in uno stato committabile, che e' gia' l'invariante di tutti gli altri
editor del pannello.

**R4. Il modale del simbolo monta il corpo Form.** Vedi D1. Nessuna rottura, ma calcolo inutile a
ogni apertura e, se il corpo Form introducesse un `useEffect` con effetti (per esempio una
scrittura di preferenze), quello girerebbe anche li'. Il corpo Form deve essere **puramente
presentazionale**, senza effetti.

**R5. Ordine delle chiavi nella ir persistita, e il tab Source.** `irTabs.tsx:180-192` rende
`JSON.stringify(view.ir, null, 2)`, che segue l'ordine di inserimento. Un `form` aggiunto con
`{ ...draft, form: X }` a un draft che non ce l'aveva finisce **in coda**, dopo
`fieldCompartments`. Se il draft ce l'aveva gia', lo spread ne conserva la posizione. Conseguenze
misurate:

- **Sul Source tab**: cambia solo dove si legge il blocco `form`. Nessun problema.
- **Su `irHash`** (`irCompile.ts:285-289`, djb2 su `JSON.stringify`): due ir semanticamente
  identiche con ordine di chiavi diverso danno hash diversi, quindi un **cache miss** e una
  ricompilazione. Non e' un errore di correttezza, e' un costo trascurabile in authoring.
- **Sulle chiavi a `undefined`**: `JSON.stringify` le elimina, quindi `{ ...draft, form: undefined }`
  e un draft senza `form` hanno lo **stesso** hash e la stessa forma persistita. L'idioma 3 di D3
  non inquina la cache.

**R6. Il vincolo `op` (spec §2, `irValidate.ts:77-95`).** Nessuna chiave `op` con valore stringa
dentro `FormSpec`, a qualunque profondita'. La struttura attuale non ne ha, ma le chiavi di
`widgets` e `features` sono **nomi di feature scelti dall'autore del metamodello**: una feature
chiamata `op` produrrebbe `widgets: { op: 'text' }`, dove `op` e' una chiave il cui **valore** e'
una stringa. `findUnknownPredicateOp` (89) legge `(node as {op?: unknown}).op` **su ogni oggetto**,
quindi `widgets` con una chiave `op` verrebbe scambiato per un predicato e la view sarebbe
rifiutata con un messaggio sugli operatori. Non e' teorico: `op` e' un nome di attributo
plausibile. **Va verificato in Fase 2 con un test** e, se confermato, dichiarato come limite noto
(la spec §2 lo prevede come vincolo sulla struttura, non sulle chiavi dinamiche, quindi e' un caso
che la spec non copre).

**R7. Modifiche fuori dal perimetro `authoring/`.** La slice, come e' disegnata, tocca:
`components/ui/SegmentedControl/` (D7, se si vuole il segmento disabilitato con tooltip),
`components/editor-v2/hooks/useEditorMode.ts` (D4, `isEnum` in tre punti),
`components/editor-v2/viewpoint/ir/useFormWidgets.ts` (D5, un `export`),
`components/editor-v2/viewpoint/ir/formSections.ts` (D6, firma generica),
`components/editors/views/ViewData.tsx` e `events/registry.ts` (D2, il link cross-tab).
Sono cinque file oltre a `irTabs.tsx` e `VertexAuthoringPanel.tsx`: **sette in tutto, sopra la
soglia di cinque della Rule 19**. Il prompt di Fase 2 deve elencarli con cosa cambia in ciascuno,
e prevedere la pausa di conferma. In alternativa la slice si spezza: 2a senza il link cross-tab e
senza il tooltip sul segmento (cinque file), 2b con quelli.

**R8. Nessuno dei file toccati e' in critical zone** (CLAUDE.md §3.1). Nessun Layer Impact Report
dovuto. `useEditorMode.ts` legge lo store ma non scrive; `set_ir` e' gia' il write path esistente e
non cambia.

---

## Dipendenze e ordine consigliato per la Fase 2

1. `useEditorMode.ts`: `isEnum?` sull'interfaccia e nei due popolamenti. Indipendente, verificabile
   da solo.
2. `useFormWidgets.ts`: `export` su `overrideIsCompatible`. Una parola.
3. `formSections.ts`: firma generica. Verificabile con i test esistenti, che non cambiano.
4. `irTabs.tsx`: id, etichetta, ramo `vertex` di `irTabsForKind`.
5. `VertexAuthoringPanel.tsx`: `target` su `featureInfo`, helper puri del Form, corpo
   `ir-tab-body--form`.
6. `formAuthoring.test.ts`: il nuovo file di test.
7. (Eventuale) `registry.ts` + `ViewData.tsx` + `SegmentedControl`: il link cross-tab e il segmento
   disabilitato.

I passi 1-3 sono additivi e non cambiano nessun comportamento: si possono committare a parte, con
i test verdi, prima di scrivere una riga di UI.

---

## Domande aperte per Alfonso

Solo quelle che il codice non decide.

**Q1. Il segmento `Inline` disabilitato: primitivo condiviso o niente segmento?**
`SegmentedControl` non ha disabilitazione per segmento (D7). Due strade: (a) aggiungere
`disabled?: boolean` e `title?: string` a `SegmentedControlOption`, che e' additivo e permesso da
Rule 11 ma tocca un primitivo con due consumatori; (b) non rendere affatto il segmento `Inline`
sulle multivalore e spiegare il perche' in un `InfoTooltip` accanto al nome della feature, senza
toccare niente di condiviso. La (b) costa meno e dice la stessa cosa; la (a) e' piu' fedele al
mockup, che mostra tre segmenti sempre.

**Q2. Come si veste la tabella widget: inline o un foglio nuovo?**
Non esiste un pattern «nome in mono a sinistra, controllo a destra» nell'authoring (D7). Il
pannello e' costruito su `jj-field` piu' stili inline; le classi mono e i pallini stanno nel foglio
della form, che il pannello non importa. Due strade: (a) stile inline, coerente con il resto del
pannello e con la costante `CHIP`; (b) un `FormAuthoringBody.scss` accanto al componente, come
`SymbolCard.scss`, con classi proprie sui token esistenti. La (b) rende meglio le 24px/30px del
mockup e non porta variabili CSS nei componenti (Rule 28), ma aggiunge un foglio.

**Q3. Sette file superano la soglia della Rule 19: slice unica con pausa, o 2a + 2b?**
Vedi R7. Se la risposta a Q1 e' (b), il conto scende a sei; senza il link cross-tab scende a
cinque, cioe' dentro soglia. La domanda e' se il link «Edit compartments» verso Structure e'
requisito di questa slice o della successiva.

**Q4. Il titolo dei compartimenti non e' autorabile da nessuna parte.**
`FieldCompartmentSpec.title` esiste nello schema (`irTypes.ts:147`) e la form lo usa, ma
`FieldCompartmentListEditor` non lo offre (D6). Il tab Form mostrera' i titoli derivati dall'id
accanto al link verso Structure, dove non c'e' un campo per cambiarli. Va aggiunto in questa slice
(una `Input` nel compartment editor, tre righe), rimandato, o registrato come debito?

**Q5. Una feature chiamata `op` rompe la view (R6).**
`widgets: { op: 'text' }` verrebbe letto da `findUnknownPredicateOp` come un predicato con
operatore sconosciuto, e la view sarebbe rifiutata al commit. Va verificato con un test in Fase 2.
Se confermato, le strade sono: accettare il limite e dirlo nella spec; oppure escludere
`widgets`/`features` dalla scansione, che pero' tocca `irValidate.ts` e la sua garanzia
«generica anziche' mirata» (commento 57-70), che e' proprio quello che quel modulo difende.
