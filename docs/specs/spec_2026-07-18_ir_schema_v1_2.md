# Schema formale della ViewpointIR — contratto dell'interprete EditorV2 (v1.2)

**Data**: 2026-07-18
**Stato**: supersede la v1.1 (`spec_2026-06-08_ir_schema_v1_1.md`). Recepisce le decisioni della sessione 2026-07-17_2 (opzione B confermata) e i findings dello spike Fase 1.
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

**Fallback della palette derivata (normativo)**: se l'insieme derivato dalle view, intersecato con le metaclassi instanziabili alla radice, è vuoto, l'interprete mostra la palette completa (tutte le rootable) con una notice; il filtro derivato è un aiuto di focusing, non una restrizione. Solo `interaction.palette` esplicita può restringere la palette fino a vuoto.

## 7. Edge (delta sulla v1.1)

`EdgeCap`/`EdgeSpec` come v1.1 sez. 5.7 con questi delta:

```typescript
interface EdgeSpec {
  source?: PathExpr;
  target?: PathExpr;
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

- **Waypoints**: `edge.data.waypoints` degli edge RF diventano persistiti (oggi `canvasToJjom` non li scrive: gap #6 del report). Il campo di persistenza è lato DEdge/DVertex esistente, non nello schema IR; `persistWaypoints: false` opta fuori per view che vogliono routing sempre derivato.

  > **Perimetro di `persistWaypoints` (chiarimento, emendamento 2026-07-19)**: il flag governa l'intero layout override dell'edge, waypoints e pin di lato degli endpoint. `persistWaypoints: false` significa routing sempre derivato: nessun override di layout viene persistito per le view che lo dichiarano; gli override restano al più stato di sessione.
- **Policy endpoint non renderizzati (normativa, semantica fissa dell'interprete, non campo per-view)**:
  - endpoint nascosto (es. dentro un graphVertex collassato) → **lift-to-ancestor**: l'edge si aggancia al primo antenato renderizzato (semantica UML del collasso);
  - entrambi gli endpoint nascosti sotto lo stesso antenato → soppressione dell'edge;
  - espressione endpoint che non risolve → **card di fallback esplicita** (erede della EdgeFallbackCard), MAI sparizione silenziosa.
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

La policy lift-to-ancestor (sez. 7) è la semantica fissa del collasso; non è configurabile per view. Coordinate dei figli: relative al contenitore (sistema RF parentNode); clipping e routing al bordo sono responsabilità dell'interprete (aperture implementative della Fase 2b, non dello schema).

## 9. Dependency set e reattività (nuovo, vincolo dell'interprete)

Per ogni view compilata, l'interprete deriva staticamente dai PathExpr l'insieme delle feature lette:

- **self**: nomi di feature letti sul primo hop → subscription sullo snapshot dell'elemento (implementato nello spike);
- **cross-oggetto** (multi-hop): coppie (hop, feature) → subscription sugli oggetti navigati. NON implementato nello spike (limite noto); richiesto per Fase 2b/2c (i predicati dei graphVertex e gli endpoint edge navigano). L'interprete DEVE invalidare il render di un elemento quando cambia una feature nel suo dependency set, e NON DEVE re-renderizzare per feature fuori dal set.

Il dependency set è derivato, mai dichiarato nello schema.

## 10. Fallback espliciti (contratto dell'interprete)

Artefatti standard, non campi dello schema:

- **edge non risolto** → card di fallback con la ragione (endpoint mancante, espressione fallita);
- **view in errore di compilazione** → la view è esclusa dall'indice con warning in console; l'elemento cade sulla view successiva nella regola d'ordine o sul rendering astratto di EditorV2;
- **elemento senza view IR applicabile** → rendering astratto di EditorV2 (comportamento identico a "nessun viewpoint").

Mai sparizioni silenziose: ogni degrado ha un artefatto visibile o un log.

## 11. Migrazione e marcatura (nuovo)

Per la Fase 4 (migration inversa, VersionFixer):

- view default classic riconosciute dai marker (`CLASSIC_*_VIEW_MARKER`, `V2_3_TO_V3_DETECT_MARKER`, ...) → rigenerate come IR default con `migratedFrom: 'classic-default'`;
- view custom non riconosciute → stato legacy: l'elemento si rende col rendering astratto e la view porta un placeholder esplicito ("questa view richiedeva il classic editor"); nessun sandbox (escape hatch rinviato);
- `updateDefaultView` e la catena VersionFixer 2.222→2.225 (che oggi riscrivono VERSO il classic) vengono neutralizzate PRIMA dello spegnimento del classic;
- `irVersion` per-view guida le migrazioni future dello schema IR stesso.

**Delega delle default migrate (normativo, emendamento 2026-07-18)**: le view con `migratedFrom: 'classic-default'` che restano strutturalmente identiche alla factory `defaultObjectViewIR()` rendono col rendering astratto nativo di EditorV2 (delega: parità con "nessun viewpoint" garantita per costruzione). Un edit successivo le fa divergere dalla factory e tornano all'interprete come view custom, con stile proprio. Lo stesso vale per la default wildcard built-in (`IR_DEFAULT_OBJECT_VIEW_ID`). L'interprete rende solo le view IR non-default.

## 12. Persistenza (invariata, con nota ReadCtx)

Come v1.1 sez. 8 (`ir?` additivo, serializzazione generica, IR master, identità = id del DViewElement). Nota di implementazione: gli accessor compilati leggono attraverso l'interfaccia stretta `ReadCtx` con due backend intercambiabili (proxy L / D-diretto, default proxy L). Lo switch resta swappabile finché il benchmark comparativo (Fase 4) non decide; la differenza semantica (il proxy coerce/tronca a upperBound) è documentata nel modulo.

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
