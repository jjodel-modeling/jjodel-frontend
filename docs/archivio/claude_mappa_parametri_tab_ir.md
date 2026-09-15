# Mappa dei parametri del tab IR, per tipologia di view

**Data**: 2026-08-04
**Fonte**: sorgenti a HEAD del branch `alfonso-frontend-jjtl` (`viewpoint/ir/irTypes.ts`, `irDefaults.ts`, `irValidate.ts`, `irCompile.ts`, `pathExpr.ts`; `viewpoint/authoring/*.tsx`), incrociati con `spec_2026-07-18_ir_schema_v1_2.md`, l'addendum edge del 2026-07-26 e le ratifiche E-obj del 2026-08-02.
**Scopo**: dire, per ogni tipologia, quali parametri sono obbligatori, quali sono opzionali con default, e quali il tab IR non espone.

## Tre livelli di "obbligatorio"

Il documento distingue tre cose che nel linguaggio corrente si confondono:

- **S** (schema): il campo non ha `?` in `irTypes.ts`. Senza di esso l'IR non è del tipo dichiarato.
- **V** (validazione): la sua assenza o malformazione fa fallire `validateIR`, quindi il pannello non committa. `validateIR` non è uno schema-checker: è la compilazione vera (`compileView` / `compileEdgeView` / `compileRowView`), e i throw espliciti sono pochissimi.
- **F** (funzionale): il compile passa, ma la view non produce nulla a canvas. È la categoria pericolosa, perché è silenziosa.

Un campo può essere S senza essere V (nessuno controlla `metaclasses`) e F senza essere né S né V (i capi di una object-as-edge).

## Campi comuni a tutte le tipologie

Non esiste un tipo `ViewCommon` in codice: i campi comuni sono duplicati in ciascuna interfaccia. Questa è la loro presenza reale.

| Campo | vertex | row | edge | Obbligo | Autorato nel tab |
|---|---|---|---|---|---|
| `irVersion` | sì | sì | sì | S | no (scritto dal seed) |
| `kind` | `'vertex'` | `'row'` | `'edge'` | S | scelto una volta in EnableIRPanel, poi immutabile |
| `metaclasses: string[] \| '*'` | sì | sì | sì | S, non V | sì |
| `predicate` | sì | sì | sì | opzionale | sì |
| `priority` | sì | sì | sì | opzionale, default 0 | sì |
| `exclusive` | sì | **assente dal tipo** | sì | opzionale, default true | solo vertex |
| `label` | sì | sì | sì | opzionale | vertex e row sì, edge no |

Nota su `metaclasses`: il pannello scrive `'*'` col toggle wildcard e `[]` quando lo si spegne. Entrambi passano la validazione; `[]` significa "non si applica a nulla" e i pannelli lo dicono con una HelpText, non con un errore.

## Vertex (`kind: 'vertex'`)

Unica tipologia con gating Basic/Advanced. In Basic il tab espone General, Shape, Fill, Border, Sizing, Labels; Field compartments, Badges e Matching sono Advanced.

### Obbligatori

| Parametro | Livello | Perché |
|---|---|---|
| `shape` | S | `compileView` dereferenzia `ir.shape.form` senza guardia: se manca, `validateIR` restituisce un TypeError JS, non un messaggio `[ir]` |
| `shape.form` | S, V | unico campo obbligatorio di `ShapeSpec`; fallback di compile `'rect'` |
| `metaclasses` | S | vedi sopra |
| per ogni label: `position`, `source` | S, V | `l.source` viene dereferenziato |
| per ogni compartment: `id`, `source`, `rowFormat.segments` | S, V | `rowFormat` resta richiesto dal contratto anche con `source.from === 'children'`, dove poi viene ignorato al render |
| per ogni badge: `icon`, `position`, `visible` | S | in `BadgeSpec` i tre campi non hanno `?`, a differenza di `LabelSpec.visible` |

### Opzionali autorati nel tab

| Sezione | Parametro | Widget | Default |
|---|---|---|---|
| General | `label` | Input | assente |
| Shape | `shape.form` | ConditionalEditor + Select (rect, rounded, ellipse, circle, diamond) | `'rect'`; ramo conditional gatato su Advanced |
| Fill | `shape.fill` | ConditionalEditor + ColorPicker | assente = nessun override; conditional gatato su Advanced |
| Border | `shape.border.color` / `.width` / `.style` | ColorPicker, NumberInput, Select | `#334155`, `1`, `solid`. Mai conditional. Toccare un solo sotto-campo materializza tutto l'oggetto `border` |
| Sizing | `resizable` | Toggle | assente = derivato dalla forma (true per ellipse, circle, diamond; false per rect, rounded). Campo top-level, non dentro `shape` |
| Sizing | (Propagate size) | Button | non è un campo IR: dispatcha `PROPAGATE_VIEW_SIZE` |
| Labels | `shape.labels[].position` | Select (top, center, inside, bottom) | `'bottom'` sulle nuove |
| Labels | `shape.labels[].source` | TextSourceEditor (intrinsic / path / literal) | `{from:'literal', text:''}` |
| Labels | `shape.labels[].editable` | Toggle | assente. La variante `{widget:...}` è chip read-only preservata verbatim |
| Labels | `shape.labels[].visible` | ConditionalEditor + Toggle | `true`; conditional gatato su Advanced |
| Labels | `shape.labels[].style` (fontFamily, fontSize, fontWeight, fontStyle, color) | TextStyleField in popover | ogni asse assente = default CSS; seed per asse: sans, 12, normal, normal, `#334155` |
| Field compartments (Adv) | `[].id` | Input | `''`; nessun check di unicità nel pannello |
| Field compartments (Adv) | `[].source.from` | Select (attributes, references, children) | `'attributes'`; un `from` sconosciuto è chip read-only preservato |
| Field compartments (Adv) | `[].source.filter` | Toggle isKind + Select metaclasse | assente. Solo per `children`. Un predicate diverso da `{op:'isKind', class}` è chip read-only "avanzato (preservato)" |
| Field compartments (Adv) | `[].rowFormat.segments[]` | ListEditor (name, type, value, literal) | nuovo segmento `{kind:'literal', text:''}`. Per `children` non è esposto: le righe le rende la row view del child |
| Field compartments (Adv) | `[].separator` | Toggle | pannello mostra false quando assente; il compile applica `separator !== false`, quindi il default reale è **true** |
| Field compartments (Adv) | `[].visible` | ConditionalEditor + Toggle | `true` |
| Badges (Adv) | `shape.badges[].icon` | ConditionalEditor + Input | `''`; classe Bootstrap Icons |
| Badges (Adv) | `shape.badges[].position` | Select (tl, tr, bl, br) | `'tr'` |
| Badges (Adv) | `shape.badges[].visible` | ConditionalEditor + Toggle | `true` |
| Badges (Adv) | `shape.badges[].tooltip` | Input | assente |
| Matching (Adv) | `metaclasses` | Toggle wildcard + lista + Select | dal seed |
| Matching (Adv) | `predicate` | Toggle + PredicateBuilder | assente; attivandolo seeda un literal true |
| Matching (Adv) | `priority` | NumberInput | `0` |
| Matching (Adv) | `exclusive` | Toggle | `true`. Metterlo a false fa sparire la view dal canvas (limite corrente del resolver) |

### Non autorati

`irVersion`, `kind`, `migratedFrom`. `GraphVertexViewIR` (`kind: 'graphVertex'`, con `containment` obbligatorio nel tipo) esiste nello schema e nel compile ma **non ha alcun pannello**: è autorabile solo da console.

## Row (`kind: 'row'`)

Nessun gating Basic/Advanced: tutti i campi sempre visibili, conditional sempre permesso.

### Obbligatori

| Parametro | Livello | Perché |
|---|---|---|
| `template: TextSource[]` non vuoto | S, V | unico throw strutturale esplicito di tutto il compile: `[ir] row view requires a non-empty template`. Con template vuoto il commit è bloccato e l'errore compare in ErrorText |
| `metaclasses` | S, non V | il seed di EnableIRPanel parte da `[]`, quindi una row view appena creata non si applica a nulla finché non si nomina una metaclasse |

### Opzionali autorati

| Sezione | Parametro | Widget | Default |
|---|---|---|---|
| Matching | `metaclasses` | Toggle wildcard + lista + Select | `[]` dal seed |
| Matching | `predicate` | Toggle + PredicateBuilder | assente |
| Matching | `priority` | NumberInput | `0` |
| Template | `template[]` | ListEditor di TextSource | nuovo segmento `{from:'literal', text:''}` |
| Visible | `visible` | ConditionalEditor + Toggle | **la sezione appare solo se `visible` è già presente nell'IR**: il pannello non lo seeda mai, quindi in pratica si vede solo su IR importati o scritti a mano |
| Label | `label` | Input | assente |

### Assenti per costruzione

`exclusive` (non esiste su `RowViewIR`, ed è la ragione per cui il pannello non riusa `MatchingSection`, tipizzata `VertexViewIR`), `shape`, `resizable`, `fieldCompartments`, `badges`.

Nota: il seed di `EnableIRPanel` per row (`metaclasses: []`) diverge da `defaultRowViewIR()` (`metaclasses: '*'`). La default row view built-in resta il fallback runtime e non viene mai persistita.

## Edge, parte comune alle due nature (`kind: 'edge'`)

Nessun gating Basic/Advanced. Il primo controllo del pannello è **Natura**, che non è un campo IR: `natureOf(ir)` restituisce `object` se e solo se `edge.source` e `edge.target` sono entrambi presenti, altrimenti `reference`. La derivazione vive in `irCompile.ts` (`isObjectAsEdge: !!(sourceExpr && targetExpr)`).

Cambiare natura droppa le chiavi dell'altro substrato: verso object rimuove `reference`, verso reference rimuove `edge.source` e `edge.target`.

### Obbligatori

| Parametro | Livello | Perché |
|---|---|---|
| `edge` | S | oggetto obbligatorio, ma tutti i suoi campi sono opzionali: `edge: {}` è legale ed è esattamente il seed |
| `metaclasses` | S, non V | vedi le due nature per il significato |

### Opzionali comuni

| Sezione | Parametro | Widget | Default (pannello = compile) |
|---|---|---|---|
| Matching | `metaclasses` | Toggle wildcard + lista + Select | dal seed |
| Matching | `predicate` | Toggle + PredicateBuilder | assente. Valutato sempre sull'oggetto sorgente: non esiste UI per un predicate sul target |
| Matching | `priority` | NumberInput | `0` |
| Linea | `edge.line.color` | ConditionalEditor + ColorPicker | assente; fallback di compile `''` |
| Linea | `edge.line.width` | ConditionalEditor + NumberInput | assente; fallback `1` |
| Linea | `edge.line.style` | ConditionalEditor + Select | assente; fallback `'solid'` |
| Terminazioni | `edge.terminations.sourceEnd` | Select | `'none'` |
| Terminazioni | `edge.terminations.targetEnd` | Select | `'openArrow'` |
| Label | `edge.labels.center` | Toggle + TextSourceEditor | assente. Spegnendo il toggle si droppa la chiave, e se `labels` resta vuoto si droppa anche `edge.labels` |

Valori di `EdgeTermination`: `none`, `openArrow`, `closedArrow`, `hollowTriangle`, `filledDiamond`, `hollowDiamond`.

### Non autorati (round-trip verbatim)

`irVersion`, `kind`, `exclusive` (ratifica R-5: il resolver edge non lo legge, esporlo autorerebbe un controllo morto), `label` top-level, `edge.routing` (dichiarato-inerte, routing congelato a Manhattan in v1), `edge.persistWaypoints` (default true), `edge.labels.placement` (default `'auto'`).

## Edge, natura reference (reference-as-edge)

La linea esiste già: è la reference M1. La view ne decide solo aspetto ed etichetta.

| Parametro | Obbligo | Note |
|---|---|---|
| `metaclasses` | S | è la metaclasse dell'oggetto **sorgente** della reference. Il wildcard `'*'` è ammesso e va nel bucket `edgeWildcard` |
| `reference` | opzionale | Select con `(qualsiasi reference)` in testa: selezionarlo droppa la chiave. Le opzioni vengono dalle reference della prima metaclasse in lista; un valore persistito non risolvibile resta elencato come `"X (non risolta)"`. Una reference specifica ha priorità sul match generico |
| `edge.source` / `edge.target` | **devono restare assenti** | sono la definizione stessa dell'altra natura: valorizzarli entrambi trasforma la view in object-as-edge |

Tutto il resto è la parte comune.

## Edge, natura object (object-as-edge)

L'istanza della metaclasse **è** la linea: il suo nodo viene nascosto e si disegna un edge sintetico.

| Parametro | Obbligo | Note |
|---|---|---|
| `metaclasses` con almeno un nome | F (silenzioso, non intercettato da `validateIR`) | il wildcard sul ramo object **non è esprimibile**: `irResolveCore` non ha un bucket wildcard per object-as-edge, quindi la view non finisce in nessun indice e non produce nulla senza warning. Il pannello disabilita il toggle wildcard e mostra un ErrorText informativo se il draft è già `'*'`. Anche `[]` finisce in nessun bucket |
| `edge.source` | S di fatto, F | PathExpr sull'oggetto che risolve all'oggetto capo sorgente |
| `edge.target` | S di fatto, F | idem per il capo destinazione |
| `reference` | **non esposto** | il resolver object non lo legge mai |

Vincoli sui capi, tutti implementati nel pannello:

1. **PathBuilder sulle sole reference**: `endpointFeatures` azzera gli attributi (`{attributes: [], references: features.references}`). Un capo che punta a un attributo compilerebbe e poi risolverebbe a nulla in silenzio.
2. **Divieto di array intero**: un capo che termina in `.values` è rifiutato (`isUsableEndpointExpr`). La forma indicizzata `$ref.values[0]` è accettata. `toId` rifiuta gli array e l'effetto a canvas sarebbe un fallback silenzioso.
3. **Scrittura atomica** (ratifica R-1): i due capi entrano nell'IR insieme o non entrano affatto. Se uno dei due manca o è inutilizzabile, `applyEndpoints` cancella entrambe le chiavi. Motivo: un IR con un capo solo compila a `isObjectAsEdge = false`, cioè una reference-as-edge viva con un PathExpr inerte e zero diagnostica. Un IR così non è più producibile dalla UI.
4. **Conseguenza voluta**: finché i capi non sono completi la view resta una reference-as-edge e il canvas non cambia.
5. I capi si risolvono dalla **prima** metaclasse della lista (limite v1 del multi-target picker).

## Vincolo trasversale: la grammatica PathExpr

Vale per ogni campo che accetta un path: `shape.labels[].source.expr`, gli operandi dei predicati (`eq`, `neq`, `lt`, `lte`, `gt`, `gte`, `exists`, `empty`, `isKind.path`), `edge.source`, `edge.target`, `edge.labels.center` con `from: 'path'`, ogni segmento di `template` con `from: 'path'`, e i predicati dentro qualsiasi `Conditional`.

Step ammessi: `$feature`, `value`, `values`, `values[N]`. Costrutti vietati: `?.`, `??`, `?`, `:`, `(`, `)`.

Errori restituiti:

| Condizione | Messaggio |
|---|---|
| costrutto vietato | `[ir] forbidden construct in PathExpr: <expr>` |
| step non valido | `[ir] invalid PathExpr step "<tok>" in <expr>` |
| `.value` senza `$feature` | `[ir] dangling .value in <expr>` |
| `.values` senza `$feature` | `[ir] dangling .values in <expr>` |
| path vuoto | `[ir] empty PathExpr: <expr>` |

## Cosa nessun livello controlla

Sono le zone dove un IR sintatticamente valido non fa quello che l'autore crede:

- **Esistenza reale delle metaclassi e delle feature** citate nei path: nessun controllo. Al rename di una metaclasse i path non vengono invalidati e il fallimento è silenzioso (rischio già a mappa).
- **Unicità di `fieldCompartments[].id`**: nessun check, né nel pannello né nel compile.
- **IR ibridi**: `reference` più i due capi, oppure un capo solo, passano `validateIR`. Il pannello non li produce più dopo R-1 e R-2, ma restano accettati se scritti da console. Il check incrociato è una slice separata che tocca `irCompile` e `irValidate` e può invalidare view persistite.
- **Object-as-edge con `metaclasses: '*'` o `[]`**: passa la validazione, non finisce in nessun bucket, non rende nulla.
- **`metaclasses: []` su qualunque tipologia**: valido, non si applica a niente.

## Riferimenti

- `irTypes.ts`, `irDefaults.ts`, `irValidate.ts`, `irCompile.ts` (`compileEdgeView` intorno a `:382-430`), `pathExpr.ts`, `irResolveCore.ts` (indicizzazione, `:116-141`).
- `authoring/EnableIRPanel.tsx`, `VertexAuthoringPanel.tsx`, `RowAuthoringPanel.tsx`, `EdgeAuthoringPanel.tsx`, `MatchingSection.tsx`, `FieldCompartmentListEditor.tsx`, `TextSourceEditor.tsx`, `TextStyleField.tsx`.
- `claude/spec_2026-07-18_ir_schema_v1_2.md`, `claude/spec_2026-07-26_ir_edge_authoring_addendum.md`, `claude/ratifiche_2026-08-02_eobj_object_as_edge.md`, `claude/mappa_sintassi_concreta.md`.
