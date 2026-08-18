# Schema formale della ViewpointIR — contratto dell'interprete EditorV2 (v1.2)

**Data**: 2026-07-18
**Stato**: supersede la v1.1 (`spec_2026-06-08_ir_schema_v1_1.md`). Recepisce le decisioni della sessione 2026-07-17_2 (opzione B confermata) e i findings dello spike Fase 1.
**Emendamenti**: 2026-07-18 — fallback normativo della palette derivata (sez. 6); delega delle default migrate al rendering nativo (sez. 11). 2026-07-19 — perimetro esteso di `persistWaypoints` e persistenza su DVertex (sez. 7-8). 2026-07-21 — fix render multi-hop, navigazione draw-semantic via `navigateRefHop`/`ReadCtx.getRef` (sez. 9, 12; commit `a479e489d`). Decisioni Alfonso, sessioni test. Fusione delle due copie divergenti (docs/spec e docs/specs) il 2026-08-10, ratifiche R-FS1..R-FS7.
**Versione schema IR**: `ir-1.2`
**Target**: **interprete di EditorV2** (flow). Il lowering IR → quadrupla `(oclCondition, jsxString, SCSS, opzioni)` della v1.1 diventa legacy/migration-only.

---

## 1. Retarget: da formato intermedio a contratto

La v1.1 compilava l'IR verso il classic editor perché il classic era l'unico interprete di sintassi concreta. Con la deprecazione del classic (discovery 2026-07-17, opzione B confermata) la ViewpointIR diventa il contratto della superficie di editing di EditorV2:

- L'interprete NON valuta l'albero IR a render time. All'attivazione del viewpoint compila un **render plan**: accessor PathExpr e predicati in closure, Conditional in funzioni valore, stili statici come classi CSS per view, risoluzione indicizzata per metaclasse (implementazione di riferimento: `components/editor-v2/viewpoint/ir/`).
- `DViewElement` resta il carrier: campo `ir?` persistito (opzionale, additivo, serializzazione generica), identità stabile, `irVersion` per migrazione.
- `jsxString` muore col classic. Sui `DViewElement` con `ir` il campo resta solo come fallback classic durante la coesistenza (Fase 2-4) e sparisce dallo write-path alla Fase 5.
- La sezione 6 della v1.1 (lowering verso quadrupla) resta valida SOLO per la migration inversa (Fase 4) e non è più il cuore della spec.

## 2. Semantica di risoluzione (nuova sezione, normativa)

La risoluzione della view per un elemento è dichiarata nello schema, non ereditata dagli accidenti implementativi del classic (formula score, bonus id-based, TTL cache OCL: tutti esclusi).

**Regola d'ordine deterministica** per le view candidate (stessa metaclasse o antenata, predicato che passa):

1. `priority` esplicita (maggiore vince; assente = 0);
2. specificità di metaclasse: match esatto (la metaclasse dell'oggetto è dichiarata in `metaclasses`) > match per ereditarietà (una antenata è dichiarata) > wildcard (`metaclasses: '*'`); a parità di antenata, distanza minore vince;
3. ordine di dichiarazione della view nel viewpoint.

Il **wildcard** `metaclasses: '*'` esiste per le default view (erede della semantica per-livello delle classic default: si applicano a ogni oggetto del livello). Ha sempre specificità minima: qualunque view dichiarata per metaclasse la batte a parità di priority.

**Vincoli dell'interprete**:
- risoluzione indicizzata per metaclasse: costruzione dell'indice all'attivazione del viewpoint, dispatch O(#view candidate), mai O(model);
- un predicato che lancia = no match, mai crash;
- `exclusive=true` (default): esattamente una main view per elemento. `exclusive=false` = view decorative, impilate sopra la main (sez. 8);
- un viewpoint è IR **oppure** classic, mai entrambi: i due resolver coesistono senza sovrapposizione fino alla rimozione del classic. Un viewpoint misto rende gli elementi con view IR via interprete e ignora le view classic (comportamento transitorio documentato, non contratto).

## 3. Primitive (invariate dalla v1.1, con una precisazione)

`PathExpr`, `Literal`, `Predicate`, `Conditional<T>`, `MetaclassRef`, `ColorToken`, `BorderSpec`, `TextStyle` come v1.1 sez. 3.

**Precisazione PathExpr multi-hop**: la navigazione concatenata (`$ref.value.$name.value`) è nel contratto, ma la reattività cross-oggetto richiede il dependency set esteso (sez. 9). Fino a quel punto l'interprete valuta i multi-hop eagerly senza garanzia di invalidazione sul target navigato (limite dichiarato, ereditato dallo spike).

**`EndpointExpr` (nuova primitiva, emendamento 2026-08-17, R-B13)**: `EndpointExpr = PathExpr | 'container'`, tipo dei soli endpoint di un edge (sez. 7). `PathExpr` non si allarga: il token resta illegale in predicati, label, `Conditional`, `TextSource` e `childFilter`, dove non avrebbe semantica. La grafia `$container.value` continua a essere un `PathExpr` ordinario su una feature di nome `container`: le due grafie non collidono.

**`marked` (ottavo ramo di `Predicate`, emendamento 2026-08-18, R-MK-1/R-MK-10)**: `{ op: 'marked'; path?: PathExpr }`, vero quando l'elemento porta la **marcatura effimera** della sessione. La marcatura non è un valore e non è dato di modello: vive nel run-state fuori Redux (R-SIM-1), l'interprete la legge attraverso `ReadCtx.isMarked` (semantica totale: non marcato è `false`, mai `undefined`) e nessuna espressione la può interpolare in una label, perché una marcatura è booleana per costruzione. Compone con `and`/`or`/`not` e si innesta in ogni `Conditional<T>` già nello schema (`fill`, `form`, `marker`, `visible`, `line.*`, ogni asse di `TextStyle`, ...). Senza `path` interroga `self`; con `path` interroga l'elemento raggiunto da **un solo hop su reference**, risolto con `ReadCtx.getRef` e non con l'accessor di valore: il multi-hop è **rifiutato a compile** in v1, perché non esiste un modo di compilazione «PathExpr → element id» e costruirlo è fuori dalla fetta. Punto di estensione **riservato e non implementato** (R-MK-3): un futuro `mark?: string` per marcature nominate, con default sull'unica marcatura di oggi. Come per `EndpointExpr`, la v1.1 sez. 3.3 non si tocca: il delta vive qui.

## 4. Struttura di alto livello

Come v1.1 sez. 4 (`ViewpointIR`, `ViewIR` unione discriminata sui 5 kind, `ViewCommon`), con questi delta:

```typescript
interface ViewCommon {
  irVersion: string;
  id?: string;
  metaclasses: MetaclassRef[] | '*';   // '*' = wildcard delle default view (specificità minima, sez. 2)
  predicate?: Predicate;
  priority?: number;            // primo criterio della regola di risoluzione (sez. 2)
  exclusive?: boolean;          // default true
  label?: string;
  migratedFrom?: 'classic-default' | 'classic-custom';  // NUOVO: marcatura della migration inversa (sez. 11)
}
```

`kind: 'raw'` è **registrato e rifiutato dal validatore** (seam per l'escape hatch jsxString, rinviato — decisione 2026-07-17).

## 5. Editabilità (nuovo)

L'IR descrive un editor, non un viewer. Le superfici di scrittura sono dichiarate per label e per segmento:

```typescript
interface LabelSpec {
  position: 'top' | 'center' | 'inside' | 'bottom';
  source: TextSource;
  visible?: Conditional<boolean>;
  style?: TextStyle;
  editable?: boolean | { widget: 'text' | 'textarea' | 'select' | 'checkbox' | 'color' };  // NUOVO
}

type FieldSegment =
  | { kind: 'name' }
  | { kind: 'type' }
  | { kind: 'value'; path?: PathExpr;
      editable?: boolean | { widget: 'text' | 'textarea' | 'select' | 'checkbox' | 'color' } }  // NUOVO
  | { kind: 'multiplicity' }
  | { kind: 'literal'; text: string }
  | { kind: 'badge'; badge: BadgeSpec };
```

- `editable: true` = widget inferito dal tipo della feature (boolean → checkbox, enum → select, altrimenti text).
- Il **commit passa dal path canonico delle azioni** esistente (stesso write path dei widget di EditorV2: `syncUpdateFeatureValue` / `SetFieldAction` via canvasToJjom), MAI da write path nuovi. I dettagli finali dei gesti sono vincolati alla micro-discovery write path (prerequisito Fase 3).

## 6. Interaction (nuovo sotto-schema, livello viewpoint)

```typescript
interface ViewpointIR {
  irVersion: string;
  name?: string;
  metamodel?: string;
  views: ViewIR[];
  interaction?: InteractionSpec;   // NUOVO
}

interface InteractionSpec {
  // Palette: metaclassi creabili. Assente = derivata dalle view vertex/graphVertex del viewpoint.
  palette?: { metaclass: MetaclassRef; label?: string; icon?: string }[];
  // Connect: quale reference scrive il gesto di connessione tra due elementi.
  // Assente = derivato: object-as-edge da edge.source/target; reference-as-edge dalla struttura.
  connect?: { from: MetaclassRef; to: MetaclassRef; reference: string }[];
  // Containment drop: quale feature scrive il drop dentro un graphVertex.
  // Assente = derivato dalla containment reference della metaclasse contenitore.
  containmentDrop?: { container: MetaclassRef; child: MetaclassRef; feature: string }[];
}
```

Il default "assente = derivato" è normativo: un viewpoint senza `interaction` è pienamente editabile con i gesti derivati dalla struttura. `interaction` esplicito serve a restringere o rietichettare. Dettagli finali dopo la micro-discovery write path (Fase 3).

**Connect rule su endpoint `container` (normativo, emendamento 2026-08-17, R-B16)**: la connect rule derivata da una view object-as-edge legge la feature del primo hop di ciascun endpoint. Il token `container` non è una feature e non ne ha una: su quell'estremo la regola non è derivabile, e una regola incompleta non viene registrata. Conseguenza dichiarata: il gesto di connessione non crea un figlio contenuto. Creare il contenimento non è connettere. Comportamento dichiarato, non difetto.

**Fallback della palette derivata (normativo, emendamento 2026-07-18)**: se l'insieme derivato dalle view, intersecato con le metaclassi instanziabili alla radice, è vuoto, l'interprete mostra la palette completa (tutte le rootable) con una notice; il filtro derivato è un aiuto di focusing, non una restrizione. Solo `interaction.palette` esplicita può restringere la palette fino a vuoto.

## 7. Edge (delta sulla v1.1)

`EdgeCap`/`EdgeSpec` come v1.1 sez. 5.7 con questi delta:

```typescript
type EndpointExpr = PathExpr | 'container';   // NUOVO (2026-08-17, R-B13): sez. 3

interface EdgeSpec {
  source?: EndpointExpr;
  target?: EndpointExpr;
  line?: { color?: Conditional<ColorToken>; width?: Conditional<number>;
           style?: Conditional<'solid' | 'dashed' | 'dotted'> };
  terminations?: { sourceEnd?: EdgeTermination; targetEnd?: EdgeTermination };
  routing?: 'orthogonal' | 'straight' | 'curved';
  labels?: {
    source?: TextSource;
    center?: TextSource;
    target?: TextSource;
    placement?: 'auto' | 'above' | 'below';   // NUOVO: placement della label center
  };
  persistWaypoints?: boolean;                  // NUOVO: default true; chiude il gap #6
}
```

- **Waypoints e layout override**: per gli **edge sintetici (object-as-edge)** la persistenza è IMPLEMENTATA (2026-07-19): campi opzionali additivi `DVertex.irEdgeLayout` (lati degli endpoint + waypoints, mai gli handle id: l'indice è sessione-relativo) sul vertex del nodo nascosto dell'oggetto-edge; write-through a fine gesto via write path canonico, idratazione una-tantum per graph all'attivazione di un viewpoint IR, sessione vince sul persistito. Per gli **edge reali** (reference/inheritance) la persistenza resta una fase futura separata (carrier naturale: DVoidEdge).
- **Perimetro di `persistWaypoints` (chiarimento, emendamento 2026-07-19)**: il flag governa l'intero layout override dell'edge, waypoints e pin di lato degli endpoint. `persistWaypoints: false` significa routing sempre derivato: nessun override di layout viene persistito per le view che lo dichiarano; gli override restano al più stato di sessione.
- **Policy endpoint non renderizzati (normativa, semantica fissa dell'interprete, non campo per-view)**:
  - endpoint nascosto (es. dentro un graphVertex collassato) → **lift-to-ancestor**: l'edge si aggancia al primo antenato renderizzato (semantica UML del collasso);
  - entrambi gli endpoint nascosti sotto lo stesso antenato → soppressione dell'edge;
  - espressione endpoint che non risolve → **card di fallback esplicita** (erede della EdgeFallbackCard), MAI sparizione silenziosa.
- **Endpoint `container` (normativo, emendamento 2026-08-17, R-B13)**: il token riservato `container`, minuscolo e nudo, è un valore di `EndpointExpr` e risolve al parent di contenimento dell'oggetto-edge invece di navigare un `PathExpr`. Ammesso su `source`, su `target` o su entrambi: due token producono un self-loop sul contenitore, forma legittima e non un errore di grammatica. Il token è persistito verbatim e la grafia è definitiva, perché le view IR salvate non hanno VersionFixer (R-B9). L'oggetto-edge non deve possedere un vertice proprio: il vertice resta obbligatorio ai soli endpoint (R-B14), quindi anche un oggetto annidato, assente da `DModel.objects`, si rende come linea.
- **Fuori scope dichiarato** (invariato): anchor su Field, `DEdgePoint`, bending Arc/QT/CS, label per-segmento, zoom per-elemento.

## 8. graphVertex e collasso (delta)

```typescript
interface ContainmentCap { containment: Containment; }
interface Containment {
  layout: LayoutSpec;
  childFilter?: Predicate;
  collapsible?: boolean;                        // NUOVO: il nodo offre il toggle di collasso
  collapsed?: {                                 // NUOVO: rappresentazione collassata
    shape?: Partial<Shape>;                     // override della shape quando collassato
    badge?: BadgeSpec;                          // indicatore "contiene N elementi"
  };
}
```

La policy lift-to-ancestor (sez. 7) è la semantica fissa del collasso; non è configurabile per view. Coordinate dei figli: relative al contenitore (sistema RF parentNode); clipping e routing al bordo sono responsabilità dell'interprete (aperture implementative della Fase 2b, non dello schema). **Persistenza del collasso (2026-07-19)**: campo opzionale `DVertex.irCollapsed` sul vertex del contenitore, condiviso tra viewpoint come le posizioni; non governato da `persistWaypoints`.

## 9. Dependency set e reattività (nuovo, vincolo dell'interprete)

Per ogni view compilata, l'interprete deriva staticamente dai PathExpr l'insieme delle feature lette:

- **self**: nomi di feature letti sul primo hop → subscription sullo snapshot dell'elemento (implementato nello spike);
- **cross-oggetto** (multi-hop): coppie (hop, feature) → subscription sugli oggetti navigati. NON implementato nello spike (limite noto); richiesto per Fase 2b/2c (i predicati dei graphVertex e gli endpoint edge navigano). L'interprete DEVE invalidare il render di un elemento quando cambia una feature nel suo dependency set, e NON DEVE re-renderizzare per feature fuori dal set.

**Il dependency set ha due parti (normativo, emendamento 2026-08-18, R-MK-5)**: le **feature**, sopra, e i **canali dichiarati**. Un canale è una dipendenza **non-feature**: un contatore di versione globale che l'interprete può sottoscrivere, nominato in un vocabolario chiuso e allargabile per ratifica. Due membri alla nascita: `mark` (la marcatura effimera, `getSimVersion` del run-state) e `container` (il debito di R-B16, vedi il capoverso seguente). I canali sono un insieme **separato** dal feature set, mai pseudo-feature prefissate: `irCrossDeps` concretizza il feature set in id di DValue, e una `@mark` avvelenerebbe quella concretizzazione con un `unresolved` spurio. Un canale è **derivato** dalla presenza dell'operatore che lo legge, non dichiarato in un campo dell'ir.

La **clausola restrittiva si conserva su entrambe le parti**: l'interprete DEVE invalidare un elemento quando bumpa un canale che l'elemento dichiara, e **NON DEVE** re-renderizzare per un canale che non dichiara. Concretamente: una view che non nomina `marked` non acquisisce nessuna sottoscrizione nuova, e un viewpoint che non la nomina da nessuna parte si invalida esattamente come prima dell'emendamento.

**Granularità dei canali in v1 (dichiarata, R-MK-6)**: l'unione dei canali è esposta a livello di **indice** (`IRViewpointIndex.channelsInUse`), non per elemento. Non è una scorciatoia: nel punto in cui il resolver decide se appendere la versione del canale alla propria firma, la view **non è ancora risolta** (la risoluzione sta dentro il memo, per costruzione), quindi non può sapere se *quella* view dichiara il canale. Un bump invalida perciò la risoluzione di ogni elemento del viewpoint quando una qualunque view dell'indice dichiara il canale. Il precedente è `oaeSlotsSig`, che unisce allo stesso modo i dependency set delle view object-as-edge. La granularità per elemento è un raffinamento futuro, da aprire su una misura e con ratifica propria.

**Endpoint `container` e dependency set (normativo, emendamento 2026-08-17, R-B13/R-B16)**: il token non è una feature e non contribuisce al dependency set, che resta derivato dai soli `PathExpr`. L'invalidazione di un endpoint `container` passa quindi dai canali generici del sync, l'hash per-vertice di `useJjomSync` e `m1RefValuesSig` di `useM1ReferenceEdges`, misurati sul re-parent il 2026-08-17 prima dell'adozione. Le ottimizzazioni future di quei due hash devono preservare questa invalidazione (R-B16). Una nozione esplicita di dipendenza dal contenitore dentro il dependency set ha ora la sua ratifica: è R-MK-5 (aggiornamento del 2026-08-18), che l'assorbe nella nozione unica di canale dichiarato invece di prendersi una riga propria. La **migrazione** di `container` sul canale è la fetta M3 e **non è fatta**: fino ad allora l'invalidazione dell'endpoint `container` resta quella descritta qui, dai due hash generici del sync.

Il dependency set è derivato, mai dichiarato nello schema — e questo vale per entrambe le sue parti: `mark` si deriva dalla presenza dell'operatore `marked`, esattamente come un nome di feature si deriva da un `PathExpr`. La navigazione multi-hop (sia il render sia la concretizzazione del dependency set) è draw-semantic per costruzione, via l'helper unico `navigateRefHop` / `ReadCtx.getRef`: vedi la nota in sez. 12.

## 10. Fallback espliciti (contratto dell'interprete)

Artefatti standard, non campi dello schema:

- **edge non risolto** → card di fallback con la ragione (endpoint mancante, espressione fallita);
- **view in errore di compilazione** → la view è esclusa dall'indice con warning in console; l'elemento cade sulla view successiva nella regola d'ordine o sul rendering astratto di EditorV2;
- **elemento senza view IR applicabile** → rendering astratto di EditorV2 (comportamento identico a "nessun viewpoint").
- **`marked` su un elemento senza marcatura** → `false`, mai `undefined`: la semantica di `ReadCtx.isMarked` è totale (emendamento 2026-08-18, R-MK-7);
- **`marked` con un `path` che si esaurisce** (slot assente, array vuoto, hop `values` intero) → `false`, **senza throw**: `ReadCtx.getRef` ritorna `null` su tutti i casi di esaurimento, quindi il fallback è soddisfatto per costruzione e non da un guard che si potrebbe dimenticare;

Mai sparizioni silenziose: ogni degrado ha un artefatto visibile o un log.

**Diagnostica di `marked` (emendamento 2026-08-18, R-MK-7 con l'interpretazione a registro)**: un canale runtime → pannello non esiste nell'interprete IR — le uniche diagnostiche del percorso sono la stringa **statica** di `validateIR` e i `console.warn` one-shot di `irCrossDeps`. La clausola «ragione visibile nella diagnostica di authoring» si legge perciò in due metà. La metà **statica** è implementata e visibile nel pannello: `path` malformato, `path` multi-hop fuori profilo, e `op` fuori dal vocabolario chiuso di `Predicate` (emendamento 2026-08-18, R-MK-11 — regola propria di `validateIR`, che sostituisce il `TypeError` nudo con cui il ramo `default` di `compilePredicate` faceva cadere l'intera view e congelava l'authoring). La metà **runtime** — un `path` che si esaurisce mentre la simulazione gira — oggi **è silenziosa**: rende `false` e non emette nulla. Il warn one-shot sul modello di `warnUnresolvedCrossDeps` previsto dall'interpretazione di R-MK-7 **non è implementato in M1** ed è dichiarato qui come tale, invece di essere descritto come esistente.

**Deroga per l'oggetto-edge senza vertice (dichiarata, emendamento 2026-08-17, R-B14)**: un oggetto-edge privo di vertice proprio (forma annidata, `father` di className `DValue`) i cui endpoint non risolvono resta invisibile, senza card di fallback. Non è una sparizione introdotta qui: quegli oggetti non rendono nulla nemmeno prima del token, e la card richiederebbe un ancoraggio a canvas che per costruzione manca. La regola generale della sezione resta valida per gli oggetti-edge che un vertice ce l'hanno.

## 11. Migrazione e marcatura (nuovo)

Per la Fase 4 (migration inversa, VersionFixer):

- view default classic riconosciute dai marker (`CLASSIC_*_VIEW_MARKER`, `V2_3_TO_V3_DETECT_MARKER`, ...) → rigenerate come IR default con `migratedFrom: 'classic-default'`;
- view custom non riconosciute → stato legacy: l'elemento si rende col rendering astratto e la view porta un placeholder esplicito ("questa view richiedeva il classic editor"); nessun sandbox (escape hatch rinviato);
- `updateDefaultView` e la catena VersionFixer 2.222→2.225 (che oggi riscrivono VERSO il classic) vengono neutralizzate PRIMA dello spegnimento del classic;
- `irVersion` per-view guida le migrazioni future dello schema IR stesso.

**Delega delle default migrate (normativo, emendamento 2026-07-18)**: le view con `migratedFrom: 'classic-default'` che restano strutturalmente identiche alla factory `defaultObjectViewIR()` rendono col rendering astratto nativo di EditorV2 (delega: parità con "nessun viewpoint" garantita per costruzione). Un edit successivo le fa divergere dalla factory e tornano all'interprete come view custom, con stile proprio. Lo stesso vale per la default wildcard built-in (`IR_DEFAULT_OBJECT_VIEW_ID`). L'interprete rende solo le view IR non-default.

**Amendment (2026-08-13, R-IRN-3)**: the explicit canvas placeholder for unrecognized custom views is superseded. Degradation is signaled in the authoring surface: the Template tab is read-only with a notice, keyed on `irLegacyClassic`. The element renders through the native abstract rendering as per section 10; this is the normative fallback, not an error state. A marker in the tree view list is a possible future addition and is not prescribed here.

## 12. Persistenza (invariata, con nota ReadCtx)

Come v1.1 sez. 8 (`ir?` additivo, serializzazione generica, IR master, identità = id del DViewElement). Nota di implementazione: gli accessor compilati leggono attraverso l'interfaccia stretta `ReadCtx` con due backend intercambiabili (proxy L / D-diretto, default proxy L). Lo switch resta swappabile finché il benchmark comparativo (Fase 4) non decide; la differenza semantica (il proxy coerce/tronca a upperBound) è documentata nel modulo.

**Emendamento 2026-07-21 (fix render multi-hop)**: la navigazione degli hop non-terminali di un PathExpr è draw-semantic (risolta per pointer id) su entrambi i backend, tramite l'helper unico `navigateRefHop` esposto come `ReadCtx.getRef`; solo il valore dello step terminale passa dal backend attivo (preservando la coercizione del proxy L dove presente). Il proxy L, letto con `.value` su una reference, restituisce nome/proxy e non il pointer id: senza questa risoluzione la navigazione multi-hop degradava a vuoto. Lo stesso helper alimenta la concretizzazione dei dependency set cross-oggetto (sez. 9), così render e reattività non divergono sulla semantica di navigazione.

## 13. Fuori dalla v1.2

- Escape hatch jsxString (`kind: 'raw'`): seam registrato, rifiutato dal validatore, non implementato.
- Anchor a livello di Field, DEdgePoint, zoom per-elemento, bending Arc/QT/CS, label per-segmento.
- Authoring strutturato dell'IR (editor al posto di TemplateEditor Monaco): workstream separato post-interprete.
- Backward lift jsxString custom → IR: best-effort, fuori dal core.

---

## Prossimi passi

1. Fase 2a: default view M1/M2 rigenerate come IR (vertex+field) secondo questa spec.
2. Fase 2b: graphVertex + collasso (sez. 8) + dependency set cross-oggetto (sez. 9).
3. Fase 2c: edge view IR (sez. 7) con policy endpoint.
4. Micro-discovery write path widget → chiusura dei dettagli di sez. 5-6.
5. Fase 4: migration inversa (sez. 11) + benchmark comparativo che decide il backend ReadCtx.
