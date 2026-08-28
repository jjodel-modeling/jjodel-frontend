# Addendum spec IR — FormSpec, la resa a form di una view (ir-1.3)

**Data**: 2026-08-28
**Stato**: **ratificato** (Alfonso, 2026-08-28). Estende `claude_spec_2026-07-18_ir_schema_v1_2.md` (sez. 4, 5, 10) e convive con l'addendum row dispatch e con l'addendum TextStyle.
**Basato su**: Slice 1a e Slice 1b implementate e verificate a schermo (commit `816b34e9d`, `9db0b03f8`, `706a441a6`, `28ba0ba2b`, `1f3ddf961`, log `fdfc5576c`); discovery `docs/discovery/discovery_2026-08-26_form_views_slice1.md`; checkpoint `docs/sessioni/sessione_2026-08-27_form_views_1b.md`.
**Versione schema IR**: `ir-1.3`, additivo. Nessun bump di `irVersion`, nessuna migrazione, nessun backfill: una view senza `form` si comporta esattamente come prima.

Questo addendum ha una parte descrittiva, che fissa ciò che il codice fa già, e tre ratifiche che il codice non implementa ancora, marcate **R-FRM-1**, **R-FRM-2**, **R-FRM-3** e raccolte in §12.

## 1. Scope

Una view della ViewpointIR descrive come un elemento M1 appare **sul canvas**. `FormSpec` estende la stessa view con una seconda resa, **a form di widget editabili**, senza duplicare la metà di applicabilità: `metaclasses`, `authoringMetaclassPins`, `predicate`, `priority`, `exclusive` restano uno solo e valgono per entrambe le rese.

Una view può portare `shape` soltanto, `form` soltanto (nel senso che `shape` resta ma nessun host di canvas la usa), oppure entrambe. `form` assente non significa "nessuna form": significa che la form si costruisce dal metamodello (§4).

Fuori scope, e trattato altrove: la superficie di authoring che scrive `FormSpec` (Slice 2), il form document a piena pagina (Slice 3), la validazione che rifiuta un `FormSpec` incoerente al commit.

## 2. Struttura

```typescript
type FormTheme = 'plain' | 'card' | 'compact' | 'inspector';

type WidgetKind =
    | 'text' | 'textarea' | 'select' | 'checkbox' | 'color'   // vocabolario già persistito
    | 'number' | 'reference' | 'link';                        // nuovi con la form

type FeatureTreatment = 'inline' | 'list' | 'hidden';

interface FormSpec {
    theme?: FormTheme;                              // assente = default dell'host
    labelPlacement?: 'above' | 'left';              // assente = 'above'; 'left' onorato solo da 'compact'
    widgets?: Record<string, WidgetKind>;           // chiave = NOME della feature
    features?: Record<string, FeatureTreatment>;    // chiave = NOME della feature
    basic?: string[];                               // nomi visibili in Basic
}
```

Aggancio: `form?: FormSpec` su `VertexViewIR`, `GraphVertexViewIR` e la view di riga. Tutti e tre opzionali e additivi.

Due vincoli che non sono stilistici:

- **Le chiavi sono nomi di feature, non PathExpr.** La form enumera gli slot propri del soggetto (`LObject.features`) e li scrive per indice; non naviga. Un percorso multi-hop non avrebbe un valore scrivibile in fondo. È anche la chiave che il resto del codebase usa già per le feature (`syncUpdateFeatureValue`, `resolveReferenceIdByName`, il `metamodelElementName` della conformance).
- **Nessuna chiave `op` con valore stringa può comparire dentro `FormSpec`, a qualsiasi profondità.** `irValidate.findUnknownPredicateOp` percorre tutta la ir e tratta ogni `op` stringa come operatore di predicato, respingendo l'intera view con un messaggio sui predicati. Il vincolo vale per ogni estensione futura di questa struttura.

  Il vincolo non è solo sulla struttura: **le chiavi di `widgets` e `features` sono nomi di feature**, quindi una metaclasse con una feature chiamata `op` produce `widgets: { op: 'text' }`, che ricade nel vincolo e fa respingere la view al commit. Misurato il 2026-08-28 con un test di caratterizzazione (`authoring/__tests__/formAuthoring.test.ts`). È un **limite noto e non corretto**: rendere mirata la scansione di `findUnknownPredicateOp` è esattamente ciò contro cui argomenta la doc di quel modulo, e la genericità vale più del caso limite. Chi incontra il problema rinomina la feature.

Poiché la ir salvata non ha VersionFixer (R-B9), **ogni letterale scritto qui è definitivo una volta persistito**.

## 3. Compilazione: passthrough, non compile

`CompiledView.formSpec` è il `FormSpec` autorato tale e quale, o `null`. Non è una struttura compilata: `FormSpec` non contiene PathExpr né Predicate, quindi non produce accessor, non estende il dependency set, non dichiara canali, non alimenta `crossPathSink`.

Il campo compilato si chiama `formSpec` e non `form` perché `CompiledView.form` è già la **forma** compilata del simbolo (`rect` / `ellipse` / `diamond`), letta dal renderer di canvas. Il nome persistito nella ir resta `form`.

`theme` **non** viene defaultato in compilazione, a differenza di `padding`. Il default dipende dall'host (§7): materializzarlo qui congelerebbe ogni view sulla scelta di un host solo.

## 4. Risoluzione e fallback

L'host della form risolve la view sull'**id del DObject**, non su un DVertex: il soggetto può essere selezionato nell'albero, stare in un grafo chiuso o non essere su nessun canvas.

Tre esiti distinti, che l'host deve saper distinguere:

| Esito | Significato | Resa |
|---|---|---|
| `null` | nessun oggetto da rendere | placeholder vuoto |
| `{ compiled: null }` | l'oggetto esiste, nessuna view del viewpoint attivo lo intercetta | **form derivata dal metamodello** |
| `{ compiled: view }`, `view.formSpec === null` | una view lo intercetta ma non dichiara `form` | **form derivata dal metamodello**, con le sezioni della view |
| `{ compiled: view }`, `formSpec` presente | view con supplemento form | form autorata |

La form derivata dal metamodello è il fallback esplicito della spec v1.2 sez. 10: nessun default silenzioso e nessuna form vuota. È lo stato in cui si trova ogni modello prima che qualcuno autori un `form`.

## 5. Derivazione dei campi

Per ogni slot del soggetto la form calcola un descrittore. Il widget si deriva dal tipo dichiarato, poi `widgets` lo sovrascrive:

- enum, cioè `DAttribute` il cui tipo è `DEnumerator`: `select`;
- `DReference`, con o senza `composition`: `reference`;
- primitivi: la tabella di `Info.value` verbatim (`EChar` text/maxLength 1, `EInt`/`ELong`/`EShort`/`Byte` number step 1, `EFloat` number step 0.1, `EDouble` number step 0.01, `EBoolean` checkbox, tutto il resto text).

`composition` vince su `reference` nella classificazione, come in `Info.value`.

**Un override incompatibile col tipo è ignorato, non onorato e non fatale.** Un `checkbox` su una `EString` (una svista d'autore, un edit a mano, un suggerimento AI) degrada al widget derivato e la form rende. È la stessa permissività che l'interprete applica ovunque: meglio una view che rende con un default che una view scomparsa. La superficie di authoring può invece rifiutare l'override al commit (criterio R-B9-bis); è un lavoro di Slice 2, non dell'interprete.

`derived === true` o `changeable === false` rendono il campo read-only, con il lucchetto.

## 6. Visibilità: hidden, treatment, Basic

**`features[nome] === 'hidden'`** toglie la feature dalla form **in entrambe le modalità**. È l'autore che dice che quella feature non ha posto in questa form, e Advanced non lo scavalca: Advanced mostra tutto ciò che la form ha, non tutto ciò che la metaclasse ha. Una diagnostica su una feature nascosta resta contata nel residuo (§9).

**`inline` / `list`** decidono come rende una reference o un containment: un controllo solo, oppure una riga per valore. Assente, il default segue la molteplicità: `inline` per `upperBound === 1`, `list` per le multivalore. Un `inline` dichiarato su una feature multivalore **degrada a `list`**, non viene onorato e non viene respinto: un controllo singolo non può mostrare tre valori.

**Basic/Advanced è una proprietà del lettore, non del modello.** `basic`, quando l'autore lo dichiara, è la risposta completa, **anche quando omette una feature obbligatoria**: è una scelta di authoring legittima, non un errore da correggere in silenzio. Assente, l'euristica è `lowerBound >= 1`, cioè le feature senza le quali il metamodello dice che un'istanza non sta in piedi.

## 7. Sezioni e fieldCompartments

Senza compartimenti la form usa i tre gruppi naturali: Attributes, References, Children. Un gruppo vuoto non rende nulla.

Con `fieldCompartments`, ogni compartimento diventa una sezione nell'ordine autorato, con il titolo autorato (o l'id reso presentabile), e prende i campi che il suo `source` seleziona.

**R-FRM-1 (ratifica, delta sul codice). I compartimenti ordinano e intitolano; non filtrano.** Le feature che nessun compartimento reclama finiscono in una sezione di coda, non spariscono. Oggi il codice le lascia fuori: una view con un solo compartimento `attributes` fa scomparire reference e children dalla form.

Motivo: `features: 'hidden'` è già il gesto esplicito per togliere un campo, e deve restare l'unico. I compartimenti nascono per il **simbolo sul canvas**, dove lo spazio è finito e il filtro è il punto; una form è la superficie dove si edita tutto, e usare lo stesso costrutto come filtro implicito dà due meccanismi per una cosa sola, con l'effetto peggiore dei due: dati che non compaiono senza che nessuno l'abbia chiesto.

Forma precisa della coda: `source` reclama un **gruppo intero** (`attributes`, `references`, `children`), non singole feature, quindi ciò che resta fuori sono gruppi interi. La coda è l'insieme dei gruppi che nessun compartimento reclama, reso con i titoli standard nell'ordine naturale (Attributes, References, Children), dopo tutte le sezioni autorate. Due compartimenti sullo stesso `source` lo reclamano una volta sola.

Le sezioni di coda seguono le regole di tutte le altre: i loro campi rispettano `hidden` e la partizione Basic/Advanced, e una sezione vuota non rende nulla.

Nota di corrispondenza: un compartimento `children` prende le **feature di composizione del soggetto**, viste dai suoi slot. Non è lo stesso insieme che il row-dispatch rende sul canvas, che risolve gli **oggetti** figli e dà a ciascuno la sua row view. I due convergono sugli stessi figli da capi opposti; la form legge gli slot posseduti perché è lì che vivono molteplicità e obbligatorietà.

## 8. Scrittura

Ogni mutazione di un campo passa da un unico modulo, che passa da `LValue`: `setValueAtPosition` per set e clear, `SetFieldAction` con `+=` per l'append. **Non è un secondo write path accanto a quello del canvas: è lo stesso path un gradino più in basso.** L'editing inline delle righe risolve `lObject['$feature'].value = v`, e quell'assegnazione finisce nello stesso `setValueAtPosition`. La form ha bisogno del gradino più basso perché il path alto è chiavato sul DVertex (che può non esistere), scrive solo la posizione 0 (nessuna multivalore raggiungibile) e non ha né append né clear.

`U.isProjectModified` si alza **solo su un cambiamento reale**. Entrambi i commit di un campo scattano anche sul blur, quindi lasciare un campo intatto arriva comunque alla scrittura: sporcare il progetto per un edit che non ha editato niente produce un avviso di uscita ingiustificato.

**R-FRM-2 (ratifica). Rimuovere un valore da una lista lascia una posizione vuota, e la posizione grezza non è parte del contratto.** La lista logica di una feature multivalore è la **sequenza dei valori pieni**; nessuna view, nessun widget e nessuna espressione può dipendere dall'indice grezzo di un valore dentro lo slot. I vuoti hanno forma mista (`undefined` o `null`) e vanno trattati come equivalenti.

Così è normata la situazione attuale (rimozione = `clearSlotValue`, come nel pannello classico, perché `removeByIndex` non tronca ma duplica l'ultimo valore, misurato su tre casi) senza promettere che resti per sempre: il giorno in cui `removeByIndex` viene corretto e le liste si compattano, la spec non cambia e nessun consumatore si rompe.

Il limite superiore è una condizione della scrittura, non della resa: `Add` è disabilitato quando i valori pieni raggiungono `upperBound`, e `upperBound === -1` non è mai al limite.

## 9. Diagnostica

**La form non valida nulla.** Ogni messaggio che mostra viene dal registry dei problemi, che il validatore di conformance riempie. La form decide solo **dove** dirlo.

L'attribuzione è **per nome**: `field.name === detail.metamodelElementName`. Il registry non ha un id di feature da offrire, il validatore nomina l'elemento del metamodello e si ferma lì. I nomi sono unici tra le feature proprie di una classe, ed è questo che rende sana l'attribuzione. Una violazione che nomina una **classe** (`orphan_object`, `abstract_instantiation`) non trova nessun campo e finisce nel residuo, che è l'esito corretto e non un caso mancato.

**Niente si perde.** Una violazione che non trova campo conta lo stesso nel riepilogo, così il pannello e il badge sul canvas non possono mai dissentire su quanti problemi ha un oggetto. La formula di conteggio è quella dell'indicatore, copiata e pinnata da un test.

## 10. Enum: il canone è l'id

**R-FRM-3 (ratifica, delta su importer e validatore). Lo slot di un attributo enum contiene il pointer al literal.** Il nome del literal è accettato **solo in lettura**, come forma legacy prodotta dall'importer, e normalizzato all'id; un id passa invariato, un nome sconosciuto passa invariato.

Motivo: nel D layer ogni valore non primitivo è un pointer, e un literal ha identità stabile solo attraverso il suo id. Il nome si rompe al primo rename.

Conseguenze da portare a termine, dichiarate qui perché la ratifica le apre:

- l'importer XMI, che oggi salva il nome, va allineato a scrivere l'id;
- il validatore di conformance (CHECK 10) ragiona per nome e quindi **flagga ogni edit fatto dagli editor**: va reso tollerante a entrambe le forme finché l'importer non è allineato e i progetti salvati non sono passati.

Finché quei due punti non sono chiusi, la form resta l'unico posto che normalizza, e lo fa in lettura soltanto.

## 11. Tema e preferenze

`theme` è del modello; **la modalità e il collasso delle sezioni sono del lettore**. Le preferenze vivono in `localStorage` sotto `jjodel.formPrefs.<viewId>`, una voce per view con dentro `mode` e `collapsed`, non una chiave per concern. Una voce corrotta o illeggibile non è un motivo per rompere il pannello: si legge come assente.

Nessuna preferenza per una view significa **eredita la modalità globale dell'interfaccia**, non `basic` fisso: una form aperta la prima volta concorda col resto dell'applicazione invece di contraddirla.

Il tema è la pelle del pannello, non un altro insieme di campi: i quattro temi renderizzano lo stesso markup con la stessa griglia di slot; cambiano altezze dei controlli e cornici, mai cosa si vede. Solo `inspector` espone il controllo di collasso, ma lo stato del collasso si tiene in tutti i temi, così cambiare tema e tornare indietro non perde quello che l'utente aveva piegato.

Il campo di identità (il nome dell'oggetto) compare **solo quando la metaclasse non ha uno slot `name`**. Quando ce l'ha, quello slot è già l'editor del nome: scriverlo propaga su `DObject.name` attraverso il legame di identità (CLAUDE.md 3.12), e renderli entrambi metterebbe due controlli sullo stesso valore.

## 12. Stato dei delta

| Id | Cosa | Dove | Stato |
|---|---|---|---|
| R-FRM-1 | Gruppi non reclamati resi in coda | `formSections.buildFormSections` | **implementata**, `4b7383dbf` (2026-08-28) |
| R-FRM-2 | Nessuno: ratifica il comportamento attuale e vincola i consumatori futuri | | vigente per costruzione |
| R-FRM-3 | Importer XMI scrive l'id del literal; CHECK 10 tollerante a id e nome in transizione | importer XMI, `ConformanceValidator` | aperta |

Nessuno dei tre tocca la critical zone. R-FRM-3 tocca il validatore, quindi vale il two-phase con discovery report.

Note di implementazione di R-FRM-1, per chi legge la spec accanto al codice:

- La partizione vive in `formSections.ts`, modulo puro, separato da `IRForm.tsx` per la ragione di `formDiagnostics` e `slotValues`: IRForm importa il barrel del framework, quindi Monaco, quindi `window` a import time, e un test in ambiente node non lo caricherebbe.
- Le chiavi di sezione sono il contratto della persistenza del collasso. Quelle esistenti sono invariate (`attributes` / `references` / `children` senza compartimenti, `${id}-${i}` con); la coda usa `residual-<gruppo>`, che non può collidere perché una chiave autorata finisce sempre con `-<indice>`. Un test lo fissa sul caso peggiore, un compartimento di id `residual`.
- Effetto collaterale voluto: un `source` che non è nessuno dei tre gruppi (ir persistita a mano, `from` sconosciuto) non cade più silenziosamente sugli attributi. La sua sezione resta vuota e gli attributi compaiono comunque in coda, perché nessun compartimento li ha reclamati. Nessun dato sparisce, che è il punto della ratifica.

## 13. Fallback espliciti (riepilogo)

L'interprete non inventa default silenziosi. In ordine di frequenza:

- `form` assente: form derivata dal metamodello;
- `theme` assente: default dell'host (`plain` nel rail, `card` nel form document);
- `labelPlacement` assente: `above`; `left` onorato solo da `compact`;
- `widgets[nome]` assente o incompatibile: widget derivato dal tipo;
- `features[nome]` assente: `inline` se `upperBound === 1`, altrimenti `list`;
- `features[nome] === 'inline'` su multivalore: degrada a `list`;
- `basic` assente: `lowerBound >= 1`;
- compartimenti assenti: i tre gruppi naturali;
- titolo di compartimento assente: l'id reso presentabile.

## 14. Fuori da questo addendum

Superficie di authoring del `FormSpec` (tabella widget, toggle Basic, ordinamento dei compartimenti): **Slice 2**. Stato al 2026-08-28: la **Slice 2a** implementa il tab `Form` del pannello vertex per `theme`, `labelPlacement`, `widgets` e `features`; restano alla **Slice 2b** l'authoring di `basic`, il link dal tab Form ai compartimenti nel tab Structure e il campo che scrive `FieldCompartmentSpec.title`, che oggi nessuna superficie offre. Form document a piena pagina: **Slice 3**. Rifiuto al commit di un `FormSpec` incoerente: Slice 2, criterio R-B9-bis. Widget `link`: dichiarato nel vocabolario, nessuna resa ancora. `EDate` mappa a `text`: inventare un widget data che nessun artboard specifica sarebbe progettare, non implementare.
