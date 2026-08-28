# Discovery — I singleton come pill (Fase 1, read-only)

Data: 2026-08-28
Prompt: «Singleton instance nodes render as pills», consegnato in chat (nessun
documento di prompt preesistente: vedi §1).
Protocollo: `docs/PROTOCOL.md` P1..P10.

---

## 1. Ipotesi che questa discovery sta falsificando

| # | Ipotesi del prompt | Esito |
|---|---|---|
| H1 | Esiste `docs/design/design_handoff_instance_node/PROMPT_singleton_pill.md` | **FALSA** |
| H2 | Il design di riferimento e' «Instance Node Proposal.dc.html», sezione «Turno 4» (opzioni 4a-4d) | **FALSA** |
| H3 | I singleton oggi si disegnano con fill e bordo ciano | **NON RIPRODOTTA** nel ramo nativo di editor-v2 |
| H4 | `singleton` e' un flag della *view* dell'istanza | **FALSA** — sta sulla metaclasse |
| H5 | `valuedSlotCount` e' «lo stesso conteggio gia' usato per il suffisso `[k]` e per il footer degli slot collassati» | **PARZIALE** |
| H6 | Esiste un lavoro «level-3 Row-view» in corso da estendere | **VERA**, ma **non committato** |

Ciascuna e' documentata sotto con la misura che l'ha decisa.

---

## 2. File letti

```
docs/PROTOCOL.md
docs/decisions.md                                        (coda, R-SGL-4..10)
docs/claude-code-log.md                                  (intestazioni + entry 2026-08-27 nodo istanza)
docs/design/design_handoff_instance_node/README.md       (§ Node anatomy, Value renderers,
                                                          Design Tokens, The three-level style model)
docs/design/design_handoff_instance_node/Instance Node Proposal.dc.html
frontend/src/components/editor-v2/nodes/ObjectNode.tsx           (976 righe)
frontend/src/components/editor-v2/nodes/instanceNodeStyle.ts     (156)
frontend/src/components/editor-v2/nodes/instanceNode.scss        (355)
frontend/src/components/editor-v2/nodes/valueRenderer.ts         (249)
frontend/src/components/editor-v2/nodes/nodeSizing.ts            (45)
frontend/src/components/editor-v2/types.ts                       (ObjectNodeData, FeatureValueRow)
frontend/src/components/editor-v2/utils/jjomTransformers.ts      (objectVertexToRFNode, 290-400)
frontend/src/components/editor-v2/EditorV2.scss                  (.mm-node 1618+, .mm-object 2069-2180)
frontend/src/components/editor-v2/EditorV2.tsx                   (690-710, 840-870)
frontend/src/components/editor-v2/sync/syncState.ts              (130-200)
frontend/src/styles/tokens/_colors-light.scss                    (ruoli --color-inode-*, 419-455)
frontend/src/styles/tokens/_colors-dark.scss                     (329-354)
frontend/src/styles/tokens/_typography.scss                      (--font-mono)
frontend/src/styles/classic-object-view.scss                     (170-183)
frontend/src/model/logicWrapper/LModelElement.tsx                (DClass 2617-2665, set_singleton 2935)
frontend/src/joiner/classes.ts                                   (DModel persist callback 930-950)
frontend/scripts/smoke/_tmp_instance_node.ts                     (1-80, fixture)
```

---

## 3. Findings

### 3.1 (H1) Il documento di prompt citato non esiste, e non e' mai esistito

```
$ ls docs/design/design_handoff_instance_node/
Instance Node Proposal.dc.html   Instance Node.dc.html   README.md
Style Tab.dc.html                Use Cases.dc.html       screenshots/

$ find . -path ./node_modules -prune -o -name "PROMPT_*" -print
(vuoto)

$ git log --all --oneline -- "*PROMPT_singleton_pill*"
(vuoto)
```

Controllo positivo sullo stesso comando: `find docs/design -name "README.md"` restituisce
due percorsi noti. La ricerca funziona; il file non c'e' e non e' stato cancellato.
La cartella stessa e' untracked (`??` in `git status`).

### 3.2 (H2) «Turno 4» non esiste nel bundle di design

`Instance Node Proposal.dc.html` contiene due sole sezioni di turno:

- riga 31 — `Turno 3 · Default e derivati`
- riga 174 — `Turno 2 · Preset di stile`

```
$ command grep -rin "singleton" docs/design/design_handoff_instance_node/ ; echo $?
1
$ command grep -rc "Turno 2" "Instance Node Proposal.dc.html"
Instance Node Proposal.dc.html:1        <- controllo positivo, la ricerca ha segnale
```

La parola «singleton» **non compare in nessuno dei quattro `.dc.html` ne' nel README**.
Le citazioni «4a», «4b», «4c», «4d» del prompt non hanno referente nel repo.

**Conseguenza operativa.** Le quattro citazioni servono da corroborazione visiva, non
da sorgente di requisiti: geometria, colori, tipografia, risoluzione dell'etichetta e
criteri di accettazione sono tutti scritti per esteso nel prompt. La Fase 2 e'
eseguibile sul solo testo, **ma senza il riscontro visivo che il prompt presuppone**:
qualunque scelta non fissata dal testo (l'ordine `superclasse : istanza` sul canvas
rispetto al `nome : Tipo` del rettangolo, per dire) resta una mia interpretazione e
non un riscontro sul disegno.

### 3.3 (H4) `singleton` sta sulla metaclasse, non sulla view

`DClass` (`LModelElement.tsx:2617-2665`):

```typescript
abstract: boolean = false;              // :2640  — NOME D-layer: `abstract`, non `isAbstract`
extends: Pointer<DClass, 0, 'N', LClass> = [];   // :2648 — superclassi DIRETTE, in ordine
isSingleton!: boolean;                  // :2659
```

`LClass` espone `abstract` (`:2719`) e `isSingleton` (`get_singleton`, `:2936`).
**Non esiste `isAbstract` sul layer L**: `isAbstract` in `ClassNodeData` e' una rinomina
del transformer. Chi legge da `idlookup` deve usare `.abstract`.

L'istanza singleton nasce col nome della classe (`joiner/classes.ts:942`):

```typescript
for (let c of lmodel.classes) {
    let d: DClass = c.__raw;
    if (d.isSingleton) lthis.addObject({name: d.name}, c, true);
}
```

Questa riga e' la causa esatta del difetto 2 del prompt: `Red : Red` e' ridondante
perche' l'istanza *prende* il nome della classe alla creazione.

`extends` e' l'unica lista di superclassi **dirette**; `superclasses` e `extendsChain`
sono transitive (`LModelElement.tsx:2765-2767`, commenti `__info_of__`) e non vanno
usate per `firstAbstractDirectSuperclass`.

**Il modello dell'accettazione, ricostruito**: `Color` astratta, con sottoclassi
concrete singleton `Red`/`Green`/`Blue`; ogni singleton ha la sua istanza omonima.
E' esattamente il «tipo singleton-conforme» di R-SGL-10 punto 2
(`EditorV2.tsx:697-698`). `Config` e' singleton senza superclasse astratta.

### 3.4 (H3) Il ciano dei singleton non e' riproducibile nel ramo nativo

Ricerca esaustiva del trattamento singleton negli SCSS:

- `EditorV2.scss` — nessuna regola `.mm-object` condizionata al singleton. Il commento a
  `:2191` dice l'opposto: *«No singleton marker on the instance»*.
- `_color-schemes.scss` — 18 definizioni di `--object-header-bg`: ambra, blu, rosa, verde,
  arancio, rosso, slate, `transparent`. **Nessun ciano.**
- `instanceNode.scss` — il ciano compare in due soli posti, entrambi corretti per il
  prompt: `.mm-object__ref-pill` (pill di riferimento) e `&.selected` (bordo + anello +
  header). `--color-inode-selected-header-bg: #e0f7fa`.

L'unico ciano-da-singleton che ho trovato e' fuori da editor-v2, in
`styles/classic-object-view.scss:174-177`:

> *«Compound on the root to win over legacy `.singleton` (which set
> `background: var(--accent)`, a deprecated token) on un-migrated projects.»*

cioe' la **vista classica** su progetti non migrati, il cui `jsxString` persistito porta
`background: var(--accent)`. Quella superficie e' governata da `defaultViewTemplate.ts`
(marker `CLASSIC_SINGLETON_VIEW_MARKER = 'jjodel-classic-singleton v3'`, `:148`) e
toccarla fa scattare CLAUDE.md §3.9 — migrazione `VersionFixer` obbligatoria, critical zone.

**Non sto affermando che il ciano non esista**: lo screenshot puo' venire dal progetto
reale, dove una view di viewpoint o un progetto non migrato lo producono. Affermo che
**non l'ho riprodotto nel ramo che il prompt mi chiede di modificare**, e che il perimetro
scritto nel prompt (README.md, token `styles/tokens/`, parita' riga/canvas di livello 3)
identifica senza ambiguita' il ramo nativo di `ObjectNode`, non la vista classica.
Il rimedio non cambia in nessuno dei due casi — la pill e' bianca e il ciano resta alla
selezione — ma **la premessa «oggi e' ciano» resta non verificata** e va confermata da te
prima di darla per chiusa. Vedi la domanda aperta D1.

### 3.5 (H5) `valuedSlotCount`: il conteggio esiste, ma non e' quello citato

In `ObjectNode.tsx` la nozione di «slot valorizzato» esiste gia', per negazione:

```typescript
// :493-517 — ogni riga porta la sua decisione
isEmpty: decision.kind === 'empty',
// :537
const emptyRowCount = useMemo(() => slotRows.filter(r => r.isEmpty).length, [slotRows]);
```

`decision.kind === 'empty'` viene da `isEmptySlot` (`valueRenderer.ts:186-192`), che gia'
tratta il caso multi-valore, la stringa vuota e l'em-dash. Quindi:

```
valuedSlotCount === slotRows.filter(r => !r.isEmpty).length
                === slotRows.length - emptyRowCount
```

Due precisazioni rispetto al testo del prompt:

1. **Il footer degli slot collassati usa `emptyRowCount`, il complemento** (`:962`,
   `emptySlotsLabel(emptyRowCount)`), non `valuedSlotCount`.
2. **Il suffisso `[k]` non e' quel conteggio.** `[k]` e' per-slot, il numero di valori
   *dentro un singolo slot multi-valore*: `cardinality: f.isMany ? `[${held.length}]` : null`
   (`:513`). Un `Config` con `debug = true, level = 2` ha `valuedSlotCount = 2` e nessun
   `[k]` da nessuna parte, perche' nessuno dei due slot e' multi-valore.

La formula operativa resta univoca e la implemento cosi'; segnalo la citazione perche' il
prompt la usa per giustificare «lo stesso conteggio gia' in uso», e le due meta' della
giustificazione non reggono entrambe.

**Nota sulle righe placeholder.** `slotRows` include gli attributi della metaclasse
ancora senza slot (co-evoluzione pigra, `:521-534`), tutti con `isEmpty: true`. Contano
correttamente come non-valorizzati, quindi non alterano `valuedSlotCount`.

### 3.6 (H6) La base che il prompt estende non e' committata

```
$ git status --short
 M frontend/src/components/editor-v2/EditorV2.scss
 M frontend/src/components/editor-v2/nodes/ObjectNode.tsx
 M frontend/src/components/editor-v2/types.ts
 M frontend/src/components/editor-v2/utils/jjomTransformers.ts
 M frontend/src/styles/tokens/_colors-dark.scss
 M frontend/src/styles/tokens/_colors-light.scss
?? frontend/src/components/editor-v2/nodes/__tests__/
?? frontend/src/components/editor-v2/nodes/instanceNode.scss
?? frontend/src/components/editor-v2/nodes/instanceNodeStyle.ts
?? frontend/src/components/editor-v2/nodes/valueRenderer.ts
```

L'entry di log del 2026-08-27 («il nodo istanza del View Designer, difetto per difetto»,
`docs/claude-code-log.md:8143`) dichiara questi dieci percorsi come `Files touched` con
esito ✅, ma **nessuno di essi e' in HEAD**. `942ac99a5` e' un commit di documentazione.

P6 impone di segnalarlo prima di toccare qualsiasi cosa. Conseguenza concreta: un
`git add frontend/src/components/editor-v2/nodes/ObjectNode.tsx` in Fase 2 mette in stage
**anche la slice precedente**, e il commit della pill conterrebbe il nodo istanza intero.
Vedi la domanda aperta D2.

Nel working tree ci sono anche modifiche **estranee a questo fronte**, da non toccare:
`frontend/src/common/featureSignature.ts`, `frontend/src/components/StatusBar.tsx`,
`frontend/src/components/StatusBar.scss`, `docs/sessioni/sessione_2026-08-26_singleton.md`,
piu' `docs/sessioni/sessione_2026-08-28_2.md` gia' **in stage** (`A `).

### 3.7 Dove si attacca la pill: due posizioni, un componente

**Canvas.** `ObjectNode.tsx:835-975` e' il ramo nativo. La radice porta gia'
`data-type-display` e `data-header-fill` e tre custom property inline; un
`data-shape="pill"` si aggiunge nello stesso modo.

**Riga.** `renderSlotValue`, ramo `row.decision.kind === 'reference'` (`:688-707`):

```typescript
{targets.map((t, i) => (
    <span key={`${t.id}_${i}`} className="mm-object__ref-pill"
          title={`Vai a ${t.name}`}
          onClick={(e) => { e.stopPropagation(); revealReferenceTarget(t.id); }}>
        <i className="bi bi-link-45deg" />
        {t.name}
    </span>
))}
```

E' qui che `Blue` compare dentro la riga `color` di `Shape_0`.

**Nota su R-SGL-10 punto 1.** La decisione del 2026-08-26 afferma che *«il ramo nativo di
`ObjectNode` non ha righe reference (`:387`, solo attributi)»*. **Non e' piu' vero dal
2026-08-27**: la slice del nodo istanza ha aggiunto le righe reference con la ref-pill.
La decisione va aggiornata quando si riapre quel fronte; non lo faccio qui.

**Il dato che manca alla riga.** `FeatureValueRow.refTargets` e' `Array<{id, name}>`
(`types.ts:230`): nome e id, nient'altro. Per decidere pill-vs-ref-pill e per comporre
`Color : Blue` servono, del **bersaglio**, la metaclasse, il suo `isSingleton`, la sua
prima superclasse diretta astratta, e il suo `valuedSlotCount`.

Due vie:

- **(a)** allargare `refTargets` in `jjomTransformers.ts` con proprieta' opzionali.
  Ammesso da Rule 11 (solo proprieta' opzionali), ma il transformer gira alla
  trasformazione del grafo e non rifa' il giro quando la metaclasse cambia.
- **(b)** leggere da Redux dentro `ObjectNode` con un `useSelector` che produce una
  **firma serializzata**, come il file gia' fa tre volte (`liveMetaclassInfo` `:117`,
  `liveFeatureNameSig` `:128`, `metaclassAttrSig` `:161`).

**Raccomando (b)**: reattiva al toggle di `isSingleton` e all'aggiunta di una superclasse,
zero modifiche a `types.ts` e a `jjomTransformers.ts`, e ricalca un pattern gia' triplicato
nel file. Costo: una `useSelector` in piu' su `idlookup`.

### 3.8 Vincoli CSS da neutralizzare per la pill

Tre regole ereditate lavorano contro una pill, tutte misurate:

| Regola | File:riga | Specificita' | Effetto sulla pill |
|---|---|---|---|
| `min-width: 140px; min-height: 40px` | `EditorV2.scss:1618` (`.mm-node`) | (0,1,0) | pill larga almeno 140px |
| `min-width: 140px` | `EditorV2.scss:2070` (`.mm-object`) | (0,1,0) | idem |
| `min-width: 200px` | `instanceNode.scss:22` (`.mm-node.mm-object`) | (0,2,0) | **vince**: pill larga almeno 200px |
| `height: 100%` | `EditorV2.scss:2059-2063` | (0,1,0) | pill alta quanto il box RF |
| `text-decoration: underline` su `.mm-object__name` | `EditorV2.scss:2087` | (0,1,0) | sottolinea **tutta** la run |

Il precedente in-repo per l'annullamento e' `.mm-node.viewpoint-wrapper`
(`EditorV2.scss:1651-1657`): `min-width: auto`, bordo e ombra rimossi. Un
`.mm-node.mm-object.mm-object--pill` sta a (0,3,0) e li batte tutti senza `!important`.

Sulla sottolineatura: oggi copre `nome : Tipo` per intero. Il prompt la vuole sulla sola
`.mm-object__instance-name`, che nella pill sta **a destra** (`Color : Red`) invece che a
sinistra come nel rettangolo (`Red : Color`). La regola si scrive dentro `--pill`, quindi
il rettangolo non cambia di un pixel.

**`NodeResizer` non e' un problema**: `isNodeResizable('objectNode')` restituisce `false`
(`nodeSizing.ts:29`, `objectNode: { adaptWidth: true, adaptHeight: true }`), quindi il
ramo `:845` e' gia' morto per questo tipo di nodo.

### 3.9 Token: cosa c'e' e cosa manca

Il prompt nomina cinque ruoli. Quattro esistono gia' nella famiglia `--color-inode-*`
(`_colors-light.scss:430-455`, `_colors-dark.scss:329-354`), che e' quella giusta:

| Ruolo chiesto | Token esistente | Light | Dark |
|---|---|---|---|
| superficie (bianco) | `--color-inode-surface` | `#ffffff` | `#334155` |
| bordo (slate-300) | `--color-inode-border` | `$slate-300` | `rgba(255,255,255,0.16)` |
| testo secondario (slate-500) | `--color-inode-label` | `$slate-500` | `rgba(255,255,255,0.55)` |
| testo primario | `--color-inode-name` | `$slate-900` | `rgba(255,255,255,0.92)` |
| separatore (slate-300) | `--color-inode-quiet` | `$slate-300` | `rgba(255,255,255,0.3)` |
| bordo selezione `#0891b2` | `--color-inode-selected-border` | `#0891b2` | `#22d3ee` |
| anello `rgba(6,182,212,0.18)` | `--color-inode-selected-ring` | esatto | `rgba(34,211,238,0.28)` |
| ombra `rgba(0,0,0,0.04)` | `--color-inode-shadow` | esatto | `rgba(0,0,0,0.4)` |
| `--font-mono` (badge) | `_typography.scss:16` | IBM Plex Mono | idem |

**Il quinto e' un problema.** Il prompt chiede `--color-bg-hover` per l'hover della pill.
Il token esiste, ma i suoi due valori non sono omogenei:

```
_colors-light.scss:84   --color-bg-hover: #{$slate-150};              /* #e9eff6, OPACO */
_colors-dark.scss:17    --color-bg-hover: rgba(255,255,255,0.06);     /* TRASLUCIDO */
```

In chiaro funziona. In scuro, `background: var(--color-bg-hover)` **sostituisce** la
superficie invece di sovrapporsi: la pill diventa quasi trasparente e sull'hover si vede
la tela attraverso, cioe' si **scurisce** invece di schiarirsi. E' la stessa classe di
errore gia' misurata nella slice precedente e annotata nel log del 2026-08-27, misura (2):
*«Aliasare `--color-bg-hover` per il dark metteva il nodo SOTTO la tela»*.

Serve quindi **un ruolo nuovo e opaco**, `--color-inode-pill-hover`, in entrambi i file:
light `#{$slate-150}` (identico al valore che il prompt chiede), dark un opaco che
schiarisca `#334155`. `color-mix()` non e' un'opzione: zero occorrenze nel repo, sarebbe
un costrutto nuovo introdotto di straforo.

Il badge di cardinalita' chiede «slate-500» per il glifo e `<border>` per il cerchio:
`--color-inode-label` e `--color-inode-border`, nessun token nuovo.

### 3.10 I singleton sul canvas si possono nascondere

`syncState.ts:157-179` tiene un `Set` di `DVertex` id soppressi, popolato dal toggle
`JjodelEvents.TOGGLE_SINGLETONS` (`EditorV2.tsx:840-862`, che risolve
`vertex.model -> DObject.instanceof -> DClass.isSingleton`). Con il toggle spento i
singleton non hanno nodo RF, e la pill non ha nulla da disegnare: e' coerente, non e' un
conflitto, ma la sonda di Fase 2 deve **verificare che il toggle sia acceso** prima di
misurare, o misurera' l'assenza e la leggera' come un fallimento.

R-SGL-9 punto (g) segnala inoltre che `useJjomSync.ts:670` e `:764` chiamano
`isSingletonSuppressed(objId)` con un id di `DObject` contro un Set di id di `DVertex`
— sempre falso. E' il fronte (β), pre-esistente, **fuori da questo lavoro**.

### 3.11 Fixture: non esiste nel repo

`__tests__/fixtures/xmi-m1/Shapes.ecore` esiste ma e' un altro modello
(`Canvas`/`Shape`/`Circle`/`Square`, nessun singleton, nessun `Color`). Il modello
dell'accettazione — `Color` astratta, `Red`/`Green`/`Blue` singleton, `Config` — **non e'
in nessuna fixture**.

La slice precedente ha risolto lo stesso problema costruendo il modello in pagina dentro
la sonda: `scripts/smoke/_tmp_instance_node.ts:56-120` costruisce M2 + M1 con
`DModel.new`/`LPackage.addClass`/`addObject`. E' il precedente da seguire, esteso con
`isSingleton = true` sulle tre classi colore.

Attenzione al guard R-SGL-8: `set_singleton(true)` rifiuta se un M1 ha piu' di
un'istanza della classe. Nella fixture le classi colore nascono vuote, quindi il flag si
accende prima di creare istanze, e l'istanza omonima la crea da se' il persist callback
di `DModel` (`joiner/classes.ts:942`).

---

## 4. Dipendenze e rischi

| # | Rischio | Mitigazione |
|---|---|---|
| R1 | La base non committata (§3.6) finisce nel commit della pill | Commit per pathspec, oppure `git add -p`; decisione tua, D2 |
| R2 | La pill in dark diventa traslucida sull'hover (§3.9) | Ruolo opaco nuovo `--color-inode-pill-hover` |
| R3 | `min-width: 200px` rende la pill un rettangolo mascherato (§3.8) | Modificatore a (0,3,0), precedente `viewpoint-wrapper` |
| R4 | La logica dell'etichetta scritta due volte (riga e canvas) | Modulo puro condiviso + un solo componente, come chiede il prompt |
| R5 | Gli archi verso una pill si ancorano male | **Fuori scope dichiarato dal prompt.** `DynamicHandles` resta montato: gli archi esistenti continuano a collegarsi, la geometria sul raggio pieno non si tocca |
| R6 | La premessa «oggi e' ciano» non verificata (§3.4) | D1 |

**Nessun file di CLAUDE.md §3.1 e' nel perimetro.** `useJjomSync.ts`, `syncState.ts`,
`canvasToJjom.ts`, `portDistribution.ts`, `VersionFixer.tsx`, `defaultViewTemplate.ts`,
`DV.tsx`: nessuno viene toccato. **Layer Impact Report: non richiesto** — salvo che la
risposta a D1 sposti il bersaglio sulla vista classica, nel qual caso §3.9 di CLAUDE.md
impone una migrazione `VersionFixer` e il LIR diventa obbligatorio.

---

## 5. Perimetro proposto per la Fase 2

Sette file di sorgente (Rule 19: oltre cinque, serve conferma esplicita) piu' tre di
documentazione.

| # | File | Cosa cambia | Stato |
|---|---|---|---|
| 1 | `editor-v2/nodes/singletonShape.ts` | **nuovo**, puro: `resolveSingletonShape`, `firstAbstractDirectSuperclass`, `singletonLabelParts` | nuovo |
| 2 | `editor-v2/nodes/SingletonPill.tsx` | **nuovo**: il componente unico, `variant: 'node' \| 'row'` | nuovo |
| 3 | `editor-v2/nodes/ObjectNode.tsx` | selector per i bersagli; ramo pill sul canvas; ramo pill nella riga reference | gia' modificato (base non committata) |
| 4 | `editor-v2/nodes/instanceNode.scss` | blocco `--pill`, badge di cardinalita', neutralizzazioni §3.8 | untracked |
| 5 | `styles/tokens/_colors-light.scss` | `--color-inode-pill-hover` | gia' modificato |
| 6 | `styles/tokens/_colors-dark.scss` | idem | gia' modificato |
| 7 | `editor-v2/nodes/__tests__/singletonShape.test.ts` | **nuovo**: forma, etichetta, casi limite | nuovo |
| — | `docs/discovery/discovery_2026-08-28_singleton_pill.md` | questo file | nuovo |
| — | `docs/prompts/claude_2026-08-28_<hhmm>_prompt_singleton_pill.md` | il prompt, che non esiste (§3.1) | nuovo |
| — | `docs/claude-code-log.md` | entry P9 | modificato |

`types.ts` e `jjomTransformers.ts` **restano fuori** se si sceglie la via (b) di §3.7.

---

## 6. Domande aperte

**D1 — La premessa del ciano.** Il ramo nativo di editor-v2 non colora di ciano i
singleton (§3.4). Lo screenshot da cui nasce il difetto 1 viene dalla vista classica su un
progetto non migrato, da una view di viewpoint, o da altro? Se e' la vista classica, il
bersaglio non e' `ObjectNode` ma `defaultViewTemplate.ts`, e con esso arrivano la critical
zone e una migrazione `VersionFixer` (CLAUDE.md §3.9). **Procedo su `ObjectNode`**, che e'
quello che il resto del prompt descrive; dimmi se sbaglio bersaglio.

**D2 — Il commit.** La slice del nodo istanza e' nel working tree e non in HEAD (§3.6).
Tre opzioni: (i) committare prima quella slice, poi la pill sopra; (ii) un commit unico che
le contiene entrambe; (iii) la pill per pathspec sui soli file nuovi, lasciando
`ObjectNode.tsx` e i token non committati. La (i) e' la piu' pulita e la sola che tenga le
due cose separabili.

**D3 — La riga con un singleton rettangolare.** Cosa mostra la riga `cfg` di `Shape_0`
quando punta a un `Config` **con** slot valorizzati, quindi rettangolo e non pill? Un
rettangolo dentro una riga non sta in piedi. Assumo: **ref-pill ciano di oggi**, invariata.
Nessun criterio di accettazione copre il caso.

**D4 — Il ramo IR.** La parita' di livello 3 vale anche per i widget di riferimento del
viewpoint IR (`viewpoint/ir/widgets/ReferenceWidget.tsx`) e per la form del rail? Il
prompt dice «compartment row», che nel ramo nativo e' `.mm-object__compartment`. Assumo
**solo il ramo nativo**; l'IR resta com'e'.

**D5 — Il tipo nella pill senza superclasse astratta.** `Config` senza superclasse astratta
si legge `Config` e basta: il tipo sparisce del tutto. Confermi che e' voluto — cioe' che
in quel caso l'utente non ha modo di sapere dalla pill di che metaclasse sia l'istanza,
oltre al fatto che nome e tipo coincidono per costruzione (§3.3)?

---

## 7. Esiti (aggiunto a fine Fase 2, 2026-08-28)

Questa sezione chiude il report: cosa hanno risposto le domande aperte e cosa la
misura ha smentito di quanto scritto sopra. Il resto del documento resta com'era
al hard stop — e' il verbale della Fase 1, non un riferimento aggiornato.

**D1 — la premessa del ciano: ritirata dall'autore.** Non c'era alcun trattamento
ciano dei singleton da rimuovere; il ciano nello screenshot era lo stato di
selezione. §3.4 sopra aveva misurato correttamente («NON RIPRODOTTA»). La
conseguenza pratica e' che il difetto 1 del prompt e' diventato un **vincolo** —
il ciano resta alla selezione, i singleton non prendono riempimento di alcuna
tinta — e il bersaglio e' rimasto il ramo nativo di `ObjectNode`, senza critical
zone e senza migrazione `VersionFixer`.

**D2 — commit**: opzione (i). La slice del nodo istanza e' `82bf16815`, la pill
la segue come diff a se'. `StatusBar.*` e `featureSignature.ts` fuori da
entrambe.

**D3 — riga verso un singleton rettangolare**: confermata l'assunzione. Resta la
pill di riferimento ciano di oggi, ed e' diventata il criterio di accettazione 7.

**D4 — ramo IR**: fuori. Solo ramo nativo.

**D5 — pill senza tipo**: voluta.

### 7.1 Quello che la misura ha corretto

**Lo slot identita' falsava il conteggio.** `countValuedSlots` come scritto in
Fase 2 contava ogni `DValue` in `DObject.features`. Misurato sul singleton `Blue`
con `_tmp_singleton_pill.ts`: il record D porta uno slot con `values: ["Blue"]` e
**nessun `instanceof`** — e' lo slot identita' di §3.12 di `CLAUDE.md`, che su
una classe senza attributo `name` non punta a nessuna feature — mentre
`LObject.features` sullo stesso oggetto restituisce **zero** entry. Il proxy L lo
scarta, quindi il compartimento non lo rende e il conteggio del nodo non lo vede:
le due meta' della parita' rispondevano diverso sullo stesso oggetto.

Il difetto era **intermittente e a comparsa tardiva**, che e' la parte che
conta: alla prima misura (fase 1 della sonda) la riga `color` era correttamente
una pill, e solo dopo qualche secondo di rendering lo slot identita' compariva e
la riga ribaltava a pill ciano. Una verifica fatta subito dopo il mount lo
avrebbe mancato.

Corretto in `countValuedSlots`: si contano solo gli slot il cui `instanceof`
risolve, che e' lo stesso criterio del proxy L. Due casi di test nuovi
(`singletonShape.test.ts`), entrambi col controllo positivo che lo slot c'e'
davvero prima di verificare che non venga contato.

**La formula di §3.5 regge.** `valuedSlotCount = slotRows.length - emptyRowCount`
sul lato canvas, e il conteggio su `idlookup` sul lato riga, danno lo stesso
numero una volta applicato il filtro qui sopra.

### 7.2 Verifica

`scripts/smoke/_tmp_singleton_pill.ts` (non committata), **30/30 verdi**, zero
errori di pagina, due temi. La fixture costruisce il modello dell'accettazione in
pagina: `Color` astratta con `Red`/`Green`/`Blue` singleton concrete, `Config`
singleton senza superclasse, `Shape_0` con `color = Blue` e `cfg = Config`.

Il perno e' `Config`, misurato **due volte**: vuoto (pill) e con due slot scritti
(rettangolo con badge). Stesso oggetto, stessa metaclasse, stesso flag: se la
forma non si ribaltasse fra le due misure, la regola starebbe guardando il flag e
non il contenuto.

**Nota sulla fixture**: le istanze singleton sono create esplicitamente e non dal
persist callback di `DModel` (`joiner/classes.ts:942`). Misurato: dentro la
stessa `page.evaluate` che crea M2 e M1, il callback trova `lmodel.classes`
ancora vuota — il ritardo di batching dei reducer sulle forward-link di §3.6 — e
non crea nulla. La sonda prova la resa, non quel meccanismo; ma il meccanismo
merita una verifica sua, perche' e' la via per cui i singleton nascono nell'uso
reale.

### 7.3 Rettifica su H2 (2026-08-28 15:50)

**H2 era falsa sulla copia in repo, non sul bundle.** `SIngleton.zip` porta
`Instance Node Proposal.dc.html` a 47384 byte con `Turno 4 · Istanze singleton`
a riga 31 e le opzioni 4a-4d, piu' il `PROMPT_singleton_pill.md` di §3.1. La
copia misurata in Fase 1 era ferma a 35239 byte: la misura era corretta, il
soggetto era la copia sbagliata. Bundle installato e committato, cosi' i
riferimenti nei commenti di `instanceNode.scss` e `instanceNodeStyle.ts` non
restano appesi.

Il riscontro visivo conferma geometria, selezione, parita' e badge come
implementati. L'unica divergenza dal prototipo e' deliberata: il separatore e'
`::` senza spazi invece del `:` spaziato di 4a (decisione di Alfonso, motivata
nel documento di prompt).
