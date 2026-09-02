# TXT1 — l'annotation `multiline` sul metamodello (Fase 1)

Data: 2026-09-01. Protocollo: `docs/PROTOCOL.md` P1..P10, **P4 two-phase**: questo referto
chiude la Fase 1 e nessun codice e' stato scritto. Sonde: `_tmp_txt1_recon.ts` (18/18 ALL
GREEN, zero errori di pagina) e `_tmp_txt1_vfx.ts` (diagnostica di un braccio).

## 0. La risposta alla clausola d'arresto

> Il grafo D porta metadati per-attributo scrivibili e persistiti, oggi, senza toccare il core?

**Si'.** Misurato, non dedotto, con una chiave gia' esistente (`jjodel/renderer=code`) su un
`EString` scalare del fixture `rowviews`:

| domanda | misura |
|---|---|
| la scrittura crea un `DAnnotation`? | si': `Pointer…_96`, `className: 'DAnnotation'`, `source: 'jjodel/renderer=code'` |
| il puntatore finisce su `DAttribute.annotations`? | si': `annotations.length` 0 → 1 |
| `readRowViewAnnotations` lo rilegge? | si': `{}` → `{renderer: 'code'}` |
| un attributo non toccato, nello stesso giro? | `{}` (controllo negativo) |
| finisce nel JSON dello stato? | si', con la sua `source` |
| sopravvive a `VersionFixer.update`? | si' |
| sopravvive al `LoadAction`, cioe' al riapri? | si' |

**Scostamento dichiarato**: il giro misurato e' `JSON.stringify` → `JSON.parse` →
`VersionFixer.update` → `LoadAction`, che e' esattamente cio' che fa `SaveManager.load`
(`components/topbar/SaveManager.ts:40-57`). Il **trasporto** verso il backend
(`ProjectsApi.save`) non e' esercitato: la sonda non lo raggiunge, e P8 ricorda che nemmeno
lo smoke apre mai un progetto salvato. Quello che e' provato e' che il carrier attraversa
serializzazione, migrazione e reidratazione.

La Fase 2 puo' quindi procedere sulla forma minima del prompt. **Ma tre delle premesse
elencate sotto «cosa ho gia' misurato» non reggono alla verifica**, e due di esse cambiano
cosa va scritto nel referto e nella spec. Sono in §2.

## 1. File letti

`components/editor-v2/nodes/rowViewAnnotations.ts`, `rowViewAnnotationsWrite.ts`,
`displayAnnotationFields.ts`, `DisplayAnnotations.tsx`, `valueRenderer.ts` (`DECLARABLE_RENDERERS`);
`jjform/layout.ts`, `jjform/shape.ts`, `jjform/themes.ts`;
`components/editor-v2/viewpoint/ir/{IRForm.tsx, IRFormField.tsx, useFormWidgets.ts, formAutoLayout.ts, widgets/index.ts}`;
`components/editor-v2/utils/jjomTransformers.ts`, `components/abstract/tabs/instanceTable.ts`,
`components/editor-v2/hooks/shapeDraw.ts`;
`api/data.ts` (`parseDAnnotation`), `api/__tests__/parseDAnnotation.test.ts`,
`services/export/EcoreService.ts`, `model/logicWrapper/LModelElement.tsx` (`DAnnotation`,
`DAnnotationDetail`), `redux/VersionFixer.tsx`, `components/topbar/SaveManager.ts`,
`docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md`.

## 2. Tre premesse del prompt che la verifica smentisce

### 2.1 `parseDAnnotation` NON ritorna `[]` alla prima riga — e' implementata

Il prompt la da' per stubbata («ritorna `[]` alla prima riga», `api/data.ts:650`). Non e'
piu' vero: `api/data.ts:691-709` la implementa, ha un contratto scritto e un test dedicato
(`api/__tests__/parseDAnnotation.test.ts`, con la sua sonda `_tmp_annotation_parse.ts`
citata a 5/5). Il commento in testa a `rowViewAnnotations.ts` che la dichiara stubbata e'
**anch'esso stale** — e' la fonte da cui il prompt ha preso la premessa.

E c'e' di piu', ed e' un regalo per TXT1: quando l'annotation Ecore ha dei `details`, il
parser emette

```ts
DAnnotation.new(source ? source + '/' + key + '=' + value : key + '=' + value, [], parent.id)
```

cioe' **esattamente il nostro formato di filo**. Un `.ecore` che porta

```xml
<eAnnotations source="jjodel"><details key="multiline" value="true"/></eAnnotations>
```

importa gia' oggi come `jjodel/multiline=true`, senza una riga di codice in piu'. La via
Ecore per dichiarare `multiline` esiste sul lato **import** ed e' gratis.

Resta vero, verificato: `DAnnotationDetail` (`LModelElement.tsx:192`) e' una classe il cui
corpo e' `// todo`. Il parser aggira il problema appiattendo i details in `source`, e
dichiara lo scostamento nel proprio commento.

### 2.2 La perdita del round-trip `.ecore` e' sull'EXPORT, non sull'import

`services/export/EcoreService.ts` **non emette alcuna annotation**. L'unica occorrenza
utile e' `includeAnnotations?: boolean` (`:42`), un'opzione **dichiarata e mai letta**: un
`grep` su `includeAnnotations` da' una riga sola, la sua definizione. Il commento di
`exportDataType` (`:500`) rimanda `eAnnotations` a «W5/W4».

Controllo positivo della ricerca, nello stesso comando: `EAttribute`/`eStructuralFeatures`
danno 5 occorrenze nello stesso file — la ricerca girava.

Il round trip perde quindi le dichiarazioni **all'uscita**, non al rientro. La frase da
scrivere nel referto di Fase 2 e nella spec cambia di conseguenza, e cambia anche dove
andrebbe speso l'eventuale lavoro futuro (`EcoreService`, non `parseDAnnotation`).

### 2.3 `featureFlags` sta in `shapeDraw.ts`, non in `jjform/shape.ts`

Il paragrafo «Allineamento con AUTO1» colloca `featureFlags(idlookup, a.id)` in
`jjform/shape.ts`. La funzione e' in `components/editor-v2/hooks/shapeDraw.ts:70`, ed e'
chiamata da li' (`:120`, `:138`). `jjform/shape.ts` dichiara `derived` e `readOnly` su
`AttrShape` (`:86-89`) ma non ospita il lettore. **La disgiunzione dei due perimetri resta
valida** — flag D per AUTO1, annotation per TXT1, `AttrShape` non si allarga — ma il file
da non toccare ha un altro nome, e va corretto prima che qualcuno lo cerchi. Nessun codice
di AUTO1 e' ancora in albero: nel repo c'e' solo il suo referto, non tracciato.

## 3. Il buco, misurato

Tre misure sulla stessa `EString` scalare (`_tmp_txt1_recon.ts`, arms 4 e 5):

| ingresso | verdetto di `widthOf` |
|---|---|
| nudo | `{kind: 'string', span: 6, widget: 'text', rung: 'type'}` |
| `renderer: 'code'` | `{kind: 'code', span: 6, widget: 'code', rung: 'annotation'}` |
| **`multiline: true`** | **identico al nudo** — il rung 2 non lo vede |
| `renderer: 'inventato'` | identico al nudo (il rung 2 non e' un passa-tutto) |
| typeName `EText` | `{kind: 'text', span: 12, widget: 'textarea', rung: 'syntax'}` |

E a monte, il carrier lo scarta gia': `annotationKeyOf('jjodel/multiline=true')` → `null`,
`parseRowViewAnnotations([...])` → `{}`, mentre `jjodel/renderer=code` passa. L'unione e'
chiusa a quattro come dichiarato, e la quinta chiave e' il gradino che manca.

La meta esiste gia' e ha una sola strada: **rinominare il tipo**. E' il costo che il prompt
descrive, ed e' misurato — `EText` arriva a span 12 e widget `textarea` per via sintattica.

## 4. Le due `textarea`: il criterio regge

`extendedWidgetFor` (`formAutoLayout.ts:395-408`), misurato sui quattro rami:

| descriptor | risultato |
|---|---|
| `widget === derivedWidget` (derivazione intatta) | `'textarea'` → `GrowTextWidget` |
| `widget: 'textarea'`, `derivedWidget: 'text'` (override d'autore) | `null` → dispatch legacy, box JjEL |
| `isReadOnly` | `null` |
| `isComposition` | `null` |
| nome fuori dal registro (`'text'`) | `null` |

L'hint JjEL e' condizionato su `field.widget === 'textarea' && field.derivedWidget !== 'textarea'`
(`IRFormField.tsx:463`). Una via che non tocca la derivazione di `useFormWidgets` lascia
quindi l'hint spento **per costruzione**, senza toccarne la condizione — come il prompt
ipotizza. Confermato.

## 5. Canvas e tabella: inerti per costruzione, e si vede

I due consumatori fuori dalla form leggono le quattro chiavi **per nome**, mai per
enumerazione:

- canvas — `jjomTransformers.ts:456-459`: `rendererOverride: declared.renderer`,
  `unit: declared.unit`, `min: declared.min`, `max: declared.max`;
- tabella — `instanceTable.ts:168-171`: gli stessi quattro campi dentro `SlotShape`.

Una quinta chiave sull'oggetto restituito da `parseRowViewAnnotations` non e' letta da
nessuno dei due. Non e' una speranza: e' la forma della destrutturazione. Vale anche per
`DisplayAnnotations.tsx` (quattro campi nominati) e per `FormAuthoringBody.tsx:301-303`.

E il motivo per cui `multiline` **non** puo' essere un valore di `renderer` resta quello
del prompt, confermato: `DECLARABLE_RENDERERS` (`valueRenderer.ts:299-301`) e' tipata
`RendererKind[]`, e un nome nuovo si propagherebbe allo switch di `RowValue`, cioe' al
canvas.

## 6. La collisione di id sull'emendamento: confermata, e A3 e' libero

- `jjform/layout.ts:60` e `:425` chiamano il cap «amendment A2 (10k, 01-09-2026)»;
- `STRETCH_MAX` non compare nella spec: `grep -rn "STRETCH_MAX"` su tutto il repo da' cinque
  righe, tutte in `jjform/layout.ts` e nel suo test, **zero** in
  `docs/design/design_handoff_jjodel_form_views/`;
- nella spec `A2` e' un altro emendamento: «the legacy `FormTheme` literals are mapped, never
  renamed» (`form-autolayout-spec.md:81`). Gli emendamenti presenti sono **A1** e **A2**.

Il prossimo id libero e' quindi **A3**, come il prompt prevede. L'`A2` nel commento di
`layout.ts` non si rinomina (regola 2): l'emendamento nuovo dichiara la corrispondenza.

Il contenuto che A3 deve fissare e' gia' scritto nel codice e in nessun altro posto —
`layout.ts:70-71`: «NOT a base width: `WIDTH_MAP` still gives `text` and `richtext` a span
of 12, and a field that STARTS at 12 keeps it. The cap is on what the packer adds.»

## 7. Un difetto latente trovato per strada, FUORI PERIMETRO

Il braccio 3 e' morto al primo giro con `«missing version adapter from "2.228"»` su uno
stato che era **gia'** all'ultima versione. Non e' la persistenza: e' l'inizializzazione
statica di `VersionFixer` (`redux/VersionFixer.tsx:33-34`), dove i due campi si
inizializzano in ordine di dichiarazione,

```ts
private static versionAdapters = VersionFixer.setup();   // setup() porta highestVersion a 2.228
private static highestVersion: number = 0;               // e la riga dopo lo rimette a 0
```

A classe inizializzata gli adapter ci sono (30, l'ultimo `'2.227 -> 2.228'`) e
`highestVersion` vale **0**. `update()` salta `setup()` proprio perche' gli adapter sono
truthy (`:112`), e cicla `while (currVer !== 0)`: al primo giro cerca un adapter *da* 2.228,
non lo trova, e alza le mani.

Misurato per contrasto (`_tmp_txt1_recon.ts` arm 3.0, su un'istanza fresca del modulo):
`versionAdapters` 30 voci, `highestVersion` **0**; dopo una chiamata a
`get_highestversion()` — che rifa' `setup()` quando il massimo e' 0 (`:82`) — vale
**2.228**. L'app non lo vede perche' qualcosa chiama `get_highestversion()` durante il boot:
`_tmp_txt1_vfx.ts` misura `highest_app` = 2.228 sull'istanza dell'applicazione.

**Non riparato qui**: `redux/VersionFixer.tsx` non e' nel perimetro dichiarato ed e' in
critical zone (§3.1). Va aperta una corsia sua. Chi la apre: la riparazione e' una riga
(togliere l'inizializzatore `= 0`, o invertire l'ordine dei due campi), ma tocca il percorso
di caricamento di ogni progetto salvato e vuole il Layer Impact Report.

## 8. Cosa cambia nella forma minima del prompt

La forma a quattro punti regge. Precisazioni che nascono dalle misure:

1. **Chiave e parsing.** `parseRowViewAnnotations` tratta oggi due famiglie: `min`/`max`
   passano da `Number.isFinite`, gli altri scartano solo la stringa vuota. `multiline` e'
   una terza famiglia, booleana: `'true'` → `true`, `'false'` → `false`, **qualunque altra
   cosa scartata**, per lo stesso argomento del `NaN`. Va scritta come tale, non appoggiata
   al ramo delle stringhe.
2. **Rung 2.** Il ramo `renderer` fa `return` solo se `RENDERER_WIDTH_KIND` conosce il
   valore; `multiline` va **dopo** quel blocco, cosi' `renderer=code` continua a vincere e
   `renderer=inventato` (che non decide una larghezza) non blocca `multiline`. La condizione
   sul tipo va scritta sulla famiglia gia' decisa dal rung 1: `attr.type` string o unknown,
   `!feature.many`, non una reference.
3. **Proiezione in `IRForm.tsx:262-266`.** Una chiave in piu' nell'oggetto letterale.
   `LayoutAnnotations` va allargata a `{ renderer?: string; multiline?: boolean }`.
4. **Superficie di dichiarazione.** Il gating di `displayFieldsFor` calcola gia' `textual`
   con la lettura larga che serve; `multiline` e' un quarto campo che segue `code`. Da
   decidere in Fase 2, e da dichiarare: se `renderer=code` e `multiline` possano stare
   accesi insieme nella UI, dato che sul verdetto vince `code`. La strada coerente con
   `showCodeToggle` (`DisplayAnnotations.tsx:101`, che nasconde il toggle quando un altro
   renderer e' dichiarato) e' mostrarli entrambi e lasciare che la scala decida — ma va
   scritto, non lasciato implicito.

## 9. Domande aperte

- Il round-trip `.ecore`: import si', export no (§2.2). Da dichiarare nel referto di Fase 2
  e, se si vuole chiudere, e' `EcoreService` che va toccato — corsia sua.
- Il commento in testa a `rowViewAnnotations.ts` descrive `parseDAnnotation` come stubbata.
  E' stale (§2.1). Correggerlo e' una riga, ma il file **e'** nel perimetro: se la Fase 2 lo
  tocca per la quinta chiave, conviene correggere anche quel paragrafo nello stesso diff, e
  dichiararlo.
- `VersionFixer` (§7): corsia separata, critical zone.
- `richtext` resta irraggiungibile da qualunque rung che non sia il nome del tipo. Fuori
  scope qui, ma la seconda riga a span 12 della tabella non ha ancora una strada.
