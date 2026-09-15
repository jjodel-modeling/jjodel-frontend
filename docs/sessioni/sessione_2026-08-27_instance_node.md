# Sessione 2026-08-27 — nodo istanza del View Designer (slice rendering)

Handoff di riferimento: `docs/design/design_handoff_instance_node/`.
Perimetro concordato in apertura: **solo rendering**. Il nodo, i renderer di
valore, i token e i quattro preset esistono e sono applicati al render; nessuna
superficie di authoring scrive ancora la cascata, quindi si parte dal default
neutro. IR e persistenza non sono toccati.

## 1. Che cos'e' il «nodo istanza» in questo repo

Il ramo **nativo** di `nodes/ObjectNode.tsx` (prima `:462-664`). Il ramo IR
(`irResolution && !irDelegated`) e' authoring e resta fuori. Il difetto che il
handoff descrive — `color =`, `tags =`, valori in corsivo, `=` disallineati,
header ambra — era esattamente quel ramo.

## 2. Divergenze fra il handoff e il codice, misurate

### 2.1 `entityMeta.ts` non ha piu' colori
Il handoff dice di leggere la coppia categoriale da `entityMeta.ts`. Quel file
dichiara in testa di non contenere colori dal 2026-08-11 (R-RAIL-30): la scala
vive nei token `--color-entity-<kind>-{bg,fg}`. Per `object` la coppia e'
`#F4E5EA` / `#6B4B56`, non l'ambra del handoff. Seguita **l'istruzione** del
handoff («leggi la coppia per il tipo di entita' reale invece di cablare
l'ambra») e non il suo letterale: `CATEGORICAL_ACCENT = var(--color-entity-object-fg)`.

Stessa logica per il glifo: il handoff scrive `m` («model instances»), ma
`resolveEntityType('DObject')` da' `object`, la cui lettera e' `O`. Usata `O`,
per stare con la coppia di colori che le corrisponde.

### 2.2 `Status { Green, Amber, Red }` non passa la regola 3 come scritta
La regola 3 e' «ogni letterale mappa su un nome di colore CSS noto», e l'unico
esempio che il handoff porta per quella regola e' `Status { Green, Amber, Red }`,
dichiarato passante. **`amber` non e' e non e' mai stata una keyword CSS.** Alla
lettera, quindi, l'esempio della regola fallisce, e con lui il semaforo — il caso
per cui la regola piu' ovviamente esiste. Il test lo ha intercettato al primo giro.

Risolto tenendo il criterio e allargando il vocabolario di una parola sola:
`NON_CSS_COLOR_WORDS = { amber: '#f59e0b' }` in `valueRenderer.ts`. Ogni aggiunta
li' allarga la regola 3, quindi la lista non e' un dizionario di sinonimi.

### 2.3 Il dark non e' progettato, e la derivazione ovvia sbaglia
Il handoff dichiara il dark fuori perimetro. La derivazione del blocco FORM VIEWS
(«aliasa il ruolo semantico vicino») **non** vale qui: quei ruoli descrivono la
chrome dell'app, il cui fondo scuro e' quasi nero (`#0f1012`), mentre la tela ha
il suo (`#1e293b`) e ogni nodo ci sta **sopra**, a `#334155`. Aliasato
`--color-bg-secondary` al primo tentativo, il nodo istanza usciva piu' scuro
della tela mentre classi, enum e package restavano piu' chiari. Misurato con la
sonda (check N-17, luminanza 63.5 contro 40.0 dopo la correzione).

## 3. Fatti sul modello, non deducibili leggendo

- **`DObject.new` non apre gli slot.** Un `DObject` creato col costruttore nudo
  ha `features` vuoto e `$attr` undefined, per sempre: il nodo mostra solo i
  placeholder di co-evoluzione. La via che apre gli slot e' `lModel.addObject(json,
  metaclass, true)` per l'oggetto — che apre il solo slot identita' `name`, e la
  L-layer lo filtra da `features` — poi `obj.addValue(undefined, featureId, values,
  false)` uno per slot (la stessa di `LModelElement.tsx:6497`).
- **Il campo e' `upperBound`, non `upperbound`.** Il camelCase e' il canonico
  (`LModelElement.tsx:1203`, `:1511`). Scritto minuscolo, `SetFieldAction` scrive
  un campo che nessuno legge: l'attributo resta mono-valore e la cardinalita' non
  compare. `scripts/smoke/_tmp_canvas_menus_light.ts` ha lo stesso refuso a
  `:78` e `:96`, latente perche' le sue asserzioni non ne dipendono.
- **Le righe reference c'erano gia' nei dati.** `jjomTransformers.ts:318` produce
  `featureKind: 'reference'` da sempre; `ObjectNode.tsx:387` le filtrava via. Ne
  mancavano gli **id** dei target (solo i nomi, concatenati): senza quelli la pill
  non e' navigabile. Aggiunti come `refTargets`, campo opzionale.

## 4. Verifica

Tre sonde, tutte con controllo positivo nella stessa query (CLAUDE.md §5).

| Sonda | Esito | Copre |
|---|---|---|
| `_tmp_instance_node.ts` | 18/18, 0 errori di pagina | default neutro: contenitore, header, griglia, i cinque renderer, marca dell'edge, selezione, dark, figura/sfondo |
| `_tmp_instance_node_presets.ts chip` | 9/9 | barra a sinistra, header riempito, chip del tipo, footer «3 slot vuoti» e la sua apertura, `+2` e la sua apertura |
| `_tmp_instance_node_presets.ts badge` | 8/8 | barra in alto, badge 20x20 con lettera `O`, `emptyBehavior: hide`, sottolineato UML anche fuori da inline |

Le due varianti preset non sono raggiungibili dall'utente in questo slice (il
default e' neutro e niente scrive la cascata), quindi sono state esercitate
ribaltando **temporaneamente** `INSTANCE_NODE_STYLE_DEFAULT` e rimettendolo
byte-identico subito dopo, verificato con `diff`. Codice mai eseguito non e'
codice verificato: il giro ha trovato un difetto vero — `.mm-node__header` centra
a (0,1,0) e senza una dichiarazione esplicita il centraggio sopravviveva anche a
chip e badge, che il handoff vuole a sinistra.

Le due prove della sonda che erano rosse per colpa della sonda e non del codice:
`margin-left: auto` si legge risolto in px da `getComputedStyle` (asserito il
**posto** del chip, non il valore), e `querySelectorAll('.mm-object__collapsed-footer')[0]`
cliccava il footer di Shape_0, che ne ha uno anche lui.

## 5. Scelte prese e da ratificare

1. **Il nodo sostituisce il default per tutte le istanze del canvas.** Il ramo IR
   non e' toccato.
2. **Gli slot opzionali non valorizzati** (prima placeholder con `""` / `0` /
   `-- Select --`) diventano slot vuoti col trattino, **ma restano cliccabili**:
   l'affordance di editing sopravvive, il valore di default sparisce dalla vista.
3. **La selezione spegne l'outline generico** sul solo nodo istanza. Anello del
   handoff piu' outline della tela sono due marche di selezione sullo stesso
   raggio da 8px.
4. **`min-width` da 140 a 200px**, perche' la griglia a due colonne a 140 lascia
   ~34px ai valori. La larghezza resta guidata dal contenuto (il 320px del
   riferimento e' un comodo, non un vincolo: il nodo e' ridimensionabile).
5. **Header inline**: tenuti i tre span esistenti con i loro pesi (600 / 400 /
   500) invece dell'unico run a 600 dell'HTML. L'HTML e' autoritativo, ma la
   gerarchia esistente e' proprio quella che il handoff invoca al §«problema»
   («il tipo e' secondario»), ed e' comportamento committato.

## 6. Non progettato, non fatto

Elencati dal handoff e ancora aperti: reference rotta (target cancellato),
troncamento e tooltip dei nomi molto lunghi, soglia di leggibilita' allo zoom out,
compartimento delle operazioni. In piu', trovato qui: uno **swatch bianco** su
superficie bianca e' invisibile — il handoff specifica lo swatch senza bordo e la
specifica e' stata seguita alla lettera.
