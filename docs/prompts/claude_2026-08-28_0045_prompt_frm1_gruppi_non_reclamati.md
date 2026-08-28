# R-FRM-1: i fieldCompartments ordinano la form, non la filtrano

**Data**: 2026-08-28 00:45
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: `fix` (allineamento del codice a una ratifica di spec)
**Fase unica, niente discovery**: la ricognizione è già stata fatta in chat e i suoi risultati sono qui sotto in RIFERIMENTI. Nessun file della critical zone è coinvolto (`useJjomSync.ts` e `portDistribution.ts` non si toccano), quindi non serve né discovery report né Layer Impact Report.

## COSA

Oggi, quando la view risolta dichiara `fieldCompartments`, la form rende **solo** le feature che i compartimenti reclamano. Una view con un unico compartimento `{ from: 'attributes' }` fa sparire dalla form tutte le reference e tutti i figli di composizione dell'oggetto, senza che nessuno lo abbia chiesto e senza alcun indizio a schermo.

La spec ratificata il 2026-08-28 (`docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md`, §7, ratifica **R-FRM-1**) dice il contrario: i compartimenti **ordinano e intitolano**, non filtrano. L'unico gesto che toglie un campo dalla form è `FormSpec.features[nome] === 'hidden'`.

Da implementare, alla lettera della spec:

1. Le sezioni dei compartimenti restano come sono: una per compartimento, nell'ordine autorato, con il titolo autorato.
2. **Dopo** di esse vanno i gruppi naturali che **nessun** compartimento reclama, con i titoli standard `Attributes`, `References`, `Children`, in quest'ordine.
3. `source` reclama un gruppo intero (`attributes` | `references` | `children`), quindi il calcolo è su un insieme di tre valori, non per singola feature. Due compartimenti sullo stesso `source` lo reclamano una volta sola.
4. Il ramo senza compartimenti non cambia in nulla: stesse tre sezioni, stessi titoli, **stesse chiavi**.

## DOVE

- `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx`: funzione locale `buildSections` (righe 126-144 circa), helper locale `sectionTitle` (riga 103 circa), interfaccia locale `Section` (riga 120 circa), unico call site alla riga 236 circa.
- **Nuovo file**: `frontend/src/components/editor-v2/viewpoint/ir/formSections.ts`
- **Nuovo file**: `frontend/src/components/editor-v2/viewpoint/ir/__tests__/formSections.test.ts`

Nessun altro file. In particolare **non** toccare `useFormWidgets.ts`, `irCompile.ts`, `irTypes.ts`, `irFormStyle.scss`, né il markup di IRForm oltre alla riga del call site.

## COME

### 1. Estrarre la partizione in un modulo puro

Sposta `Section`, `sectionTitle` e `buildSections` in `formSections.ts`, esportando `Section` e la funzione, che si chiamerà **`buildFormSections`** (nome nuovo perché il simbolo è nuovo in quanto esportato; `sectionTitle` resta interno al modulo, non esportarlo). In `IRForm.tsx` cancella le tre definizioni locali, importa da `./formSections`, e cambia solo il nome nella chiamata alla riga 236.

L'estrazione è **richiesta dal prompt**, non è refactoring opportunistico: `IRForm.tsx` importa il barrel del framework, che tira dentro Monaco, che tocca `window` a import time, quindi un test in ambiente node non può caricarlo. È lo stesso motivo per cui `formDiagnostics.ts` e `slotValues.ts` sono già moduli separati, e il nuovo modulo segue quel precedente. Nessun'altra parte di `IRForm.tsx` va spostata.

Firma invariata rispetto a oggi:

```typescript
export function buildFormSections(
    fields: FormFieldDescriptor[],
    compartments: CompiledFieldCompartment[],
): Section[]
```

### 2. La regola nuova

```
gruppi naturali:  attributes = !isReference && !isComposition
                  references = isReference
                  children   = isComposition        (invariati, sono già così)

compartments.length === 0  ->  [attributes, references, children] con chiavi
                               'attributes' | 'references' | 'children'   (INVARIATO)

altrimenti  ->  una sezione per compartimento, ordine autorato, chiave `${c.id}-${i}`  (INVARIATO)
                +  in coda, per ogni gruppo il cui nome NON compare in
                   new Set(compartments.map(c => c.source)),
                   nell'ordine fisso attributes, references, children:
                   { key: `residual-${gruppo}`, title: 'Attributes'|'References'|'Children', fields: ... }
```

Tre vincoli che non sono dettagli:

- **Le chiavi esistenti non si toccano.** `key` è ciò con cui il collasso delle sezioni viene persistito in `jjodel.formPrefs.<viewId>.collapsed`: cambiare una chiave esistente farebbe riaprire sezioni che l'utente aveva piegato. Le sezioni di coda usano il prefisso `residual-`, che non può collidere con `${c.id}-${i}` (quello finisce sempre con `-<numero>`).
- **Il filtro delle sezioni vuote resta dov'è**, nel call site di `IRForm.tsx` (`.filter(s => s.fields.length > 0)`). `buildFormSections` restituisce anche le sezioni vuote, così i test verificano la partizione e non l'effetto combinato.
- **`hidden` e Basic/Advanced non entrano qui.** `buildFormSections` riceve già i campi filtrati (`visible`): non deve conoscere né `FormSpec` né la modalità.

### 3. Cosa NON fare

- Non valutare `CompiledFieldCompartment.visible` nella form: oggi non è valutato, richiede `readCtx` e `objectId`, ed è fuori da questa ratifica. Lasciarlo esattamente com'è.
- Non deduplicare le sezioni quando due compartimenti dichiarano lo stesso `source`: quel gruppo compare due volte oggi e continua a comparire due volte, è una scelta dell'autore della view. La deduplicazione riguarda solo il calcolo di **cosa resta fuori**.
- Non introdurre un titolo `Other` né una sezione mista: i gruppi non reclamati tengono i loro titoli standard.
- Non rinominare `Section`, né i titoli `Attributes` / `References` / `Children`, né le chiavi del ramo senza compartimenti.

### 4. Test (`formSections.test.ts`)

Stile e ambiente come `formDiagnostics.test.ts`: `vitest`, fixture di oggetti semplici castati a `FormFieldDescriptor` (servono solo `name`, `isReference`, `isComposition`), compartimenti come oggetti letterali castati a `CompiledFieldCompartment` (servono solo `id`, `source`, `title`). Nessuno store, nessun React.

Casi minimi:

1. Nessun compartimento: tre sezioni, chiavi `attributes` / `references` / `children`, nell'ordine, con i campi giusti in ciascuna.
2. Un solo compartimento `attributes`: prima la sua sezione, poi due sezioni di coda `residual-references` e `residual-children` **con i loro campi dentro** (è la regressione che questa ratifica chiude).
3. Compartimenti su tutti e tre i source: nessuna sezione di coda.
4. Due compartimenti sullo stesso `source`: quel gruppo compare due volte nelle sezioni autorate e **non** compare in coda.
5. Titolo: compartimento con `title` usa quello; senza `title` usa l'id capitalizzato.
6. Ordine della coda: con un solo compartimento `children`, la coda è `residual-attributes` poi `residual-references`, in quest'ordine.

## RIFERIMENTI

- Spec: `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md` §7 (ratifica R-FRM-1) e §12 (tabella dei delta). La spec è la fonte: se questo prompt e la spec divergono, fermati e segnalalo.
- `CompiledFieldCompartment` è in `irTypes.ts` riga 609: `source` è **già appiattito a stringa** dal compile (`irCompile.ts` riga 363, `source: fc.source.from`), quindi il confronto `c.source === 'references'` che vedi in `buildSections` è corretto e va conservato. La forma autorata `{ from: ... }` non arriva mai qui.
- `FormFieldDescriptor` è in `useFormWidgets.ts`: `isReference` è la reference non-composizione, `isComposition` il containment; sono mutuamente esclusivi e la composizione vince, come in `Info.value`.
- La persistenza del collasso è in `IRForm.tsx`, `PREF_PREFIX = 'jjodel.formPrefs.'`, con `FormPrefs { mode?, collapsed? }`.

## GATE

Da `frontend/`:

1. `npm run typecheck`, la baseline è 33 errori preesistenti. Non deve salire.
2. `npm test`, verde, inclusi i nuovi test.
3. `npm run build`, deve compilare.

`check:docs` fallisce già in baseline su `docs/claude-code-log.md` (3 check, 9 errori): non è compito di questo task ripararlo, e non aggiungere una entry che lo peggiori.

Verifica visiva: la faccio io a schermo dopo il commit, sulla fixture `Form 1b fixture` con la viewpoint `IR Demo State`. Non tentare screenshot.

## SCOPE E COMMIT

`git add` solo di questi file, mai `git add .`: nel working tree ci sono modifiche non committate di altre sessioni.

```
git add frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx \
        frontend/src/components/editor-v2/viewpoint/ir/formSections.ts \
        frontend/src/components/editor-v2/viewpoint/ir/__tests__/formSections.test.ts
```

Messaggio: `fix(rail): compartments order the form without filtering it (R-FRM-1)`

Poi l'entry in `docs/claude-code-log.md` secondo CLAUDE.md §21.2, con `Notes` sotto i 500 caratteri: la motivazione lunga sta nella spec, citala per nome invece di ripeterla.

## HARD STOP

Fermati e chiedi, senza implementare, se:

- il ramo senza compartimenti risultasse toccato da qualcosa oltre la sostituzione del nome della funzione;
- l'estrazione in `formSections.ts` richiedesse di spostare altro da `IRForm.tsx` (un import che tira dentro il barrel, per esempio): in quel caso descrivi cosa serve e aspetta;
- `typecheck` salisse sopra 33 errori;
- trovassi un secondo call site di `buildSections` oltre alla riga 236.
