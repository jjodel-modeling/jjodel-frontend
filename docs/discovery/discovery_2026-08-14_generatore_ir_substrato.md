# Discovery — substrato del Generatore IR (D-GEN-1)

**Prompt**: `2026-08-14 01:30` — discovery read-only, Fase 1 del two-phase.
**Branch**: `alfonso-frontend-jjtl`, HEAD `c6edbb9f3` (working tree pulito all'apertura).
**Serve**: le ratifiche R-GEN-2 (innesto export), R-GEN-3 (perimetro ibridi), R-GEN-8 (innesto del gesto).
**Esito**: nessun file sorgente toccato. Una sonda eseguibile è stata fatta girare fuori
dal repo (vedi §0.2); non lascia tracce in albero.

---

## 0. Metodo e note preliminari

### 0.1 Strumenti

Tutte le ricerche con `command grep` (BSD grep 2.6.0-FreeBSD, verificato con `type grep`:
l'interattivo è un wrapper `ugrep --ignore-files`, CLAUDE.md §5 / R-RAIL-29). Ogni
asserzione di assenza in questo report porta il proprio controllo positivo, riportato
inline.

### 0.2 La sonda eseguibile

Tre delle domande di questo prompt — «il validatore rifiuta `kind: 'raw'`?», «rifiuta le
dichiarazioni di stato senza livello?», «accetta gli IR ibridi?» — sono domande sul
**comportamento** di una funzione, non sulla sua forma. CLAUDE.md §5 vieta di rispondere
leggendo il codice quando si può eseguirlo.

`validateIR` e la sua chiusura transitiva sono puri (nessun store, nessun React —
proprietà già misurata e messa a verbale dalla Fase 0 della slice 1, nota 8 della entry
`2026-08-13 18:00`). Sono quindi eseguibili in isolamento. La sonda è stata scritta nella
scratchpad di sessione, con una config vitest anch'essa fuori dal repo:

```
npx vitest run --config <scratchpad>/vitest.probe.config.ts --reporter=verbose --disable-console-intercept
# root: /Users/alfonso/jjodel/frontend — include: <scratchpad>/*.test.ts
# 6 passed (6)
```

Output integrale (è la prova, non un riassunto):

```
HYBRID both:       {"ok":true}
HYBRID src-only:   {"ok":true}
HYBRID tgt-only:   {"ok":true}
RAW no-shape:      {"ok":false,"error":"Cannot read properties of undefined (reading 'form')"}
RAW with-shape:    {"ok":true}
STATE no-level:    {"ok":true}
```

Nessun file è stato creato dentro `frontend/` né dentro `docs/`: la sonda e la sua config
vivono nella scratchpad di sessione e muoiono con essa.

### 0.3 File letti

Sorgenti (path completi, tutti sotto `frontend/src/`):

| File | Perché |
|------|--------|
| `components/editor-v2/viewpoint/ir/irValidate.ts` | il validatore (52 righe, intero) |
| `components/editor-v2/viewpoint/ir/irCompile.ts` | :225-450, i tre compilatori |
| `components/editor-v2/viewpoint/ir/irTypes.ts` | intero (405 righe) |
| `components/editor-v2/viewpoint/ir/irResolveCore.ts` | :60-199, indicizzazione per viewpoint |
| `components/editor-v2/viewpoint/ir/irDefaults.ts` | intero |
| `components/editor-v2/viewpoint/ir/irCreationSeed.ts` | intero |
| `components/editor-v2/viewpoint/ir/irDemoFixture.ts` | intero |
| `components/editor-v2/viewpoint/ir/metaclassPin.ts` | :100-149 (`withMetaclassPins`) |
| `components/editor-v2/viewpoint/ir/pathExpr.ts` | siti di `throw` |
| `components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` | intero |
| `components/editor-v2/viewpoint/authoring/irTabs.tsx` | intero |
| `components/editors/views/ViewData.tsx` | :55-235 (montaggio dei tab) |
| `view/viewElement/view.tsx` | :203-220, :280-425, :548-550 |
| `view/viewElement/viewSubtree.ts` | intero |
| `view/viewPoint/viewpoint.ts` | intero |
| `joiner/classes.ts` | :552-700 (`Constructors`), :1086-1210 (`DViewElement`/`DViewPoint`) |
| `utils/lastViewpoint.ts` | intero (310 righe) |
| `components/Jodie/JodieWindow.tsx` | intero (500 righe) |
| `components/Jodie/Jodie.tsx` | :88-190, :262-380, :420-610 |
| `components/Jodie/console/types.ts`, `console/languageRegistry.ts`, `console/providers/jjodieProvider.ts` | interi |
| `services/JjodieContext.ts` | :40-80, :242-302, firme |
| `types/prompts.ts` | intero |
| `components/project/ProjectEditor.tsx` | :1179-1216, :2612-2690, :2860-2875 |
| `components/project/NewViewpointDialog.tsx` | intero |
| `components/TreeViewSidebar/TreeViewContent.tsx` | :432-501, :1295-1410 |
| `components/editor-v2/Toolbar.tsx` | :176-215, :415-440 |
| `pages/components/Navbar.tsx` | :1355-1405 |

Documenti: `docs/claude-code-log.md` (ultime 10 entry), `docs/decisions.md` (intero),
`docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md`,
`docs/ratifiche/claude_ratifiche_2026-08-03_state_actions_events.md`,
`docs/archivio/claude_mappa_sintassi_concreta.md`,
`docs/archivio/artefatti/claude_snippet_2026-07-21_sm_ir_testbed_viewpoint.js`.

### 0.4 Riferimenti del prompt: due esistono, uno no, uno era altrove

| Riferimento del prompt | Stato |
|---|---|
| `claude/spec_2026-07-18_ir_schema_v1_2.md` | esiste come `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` |
| `spec_2026-06-08_ir_schema_v1_1.md` | esiste come `docs/spec/spec_2026-06-08_ir_schema_v1_1.md` |
| `claude/mappa_sintassi_concreta.md` | esiste come **`docs/archivio/claude_mappa_sintassi_concreta.md`** — è in archivio, non in `docs/` attivo. Nota di rischio: la mappa è dichiarata «documento vivo, aggiornare in place», ma sta in `archivio/`; ultimo aggiornamento **2026-08-06**, quindi non registra né la voce 4, né l'arco rail, né la slice 1 del collasso IR-nativo |
| `claude_snippet_2026-07-21_sm_ir_testbed_viewpoint.js` | **esiste**: `docs/archivio/artefatti/claude_snippet_2026-07-21_sm_ir_testbed_viewpoint.js`. La clausola di deroga del prompt (obiettivo 2.1) non è scattata |
| `2026-08-14_roadmap_arco_generatore_ir.md` | **non nel repo**. `find . -iname "*roadmap_arco_generatore*"` → vuoto, exit 0 (il comando è partito). Vive nel knowledge base della chat |
| `frontend/src/ai/` (DOVE del prompt) | **non esiste**. `ls` → «No such file or directory». Il provider system sta altrove: vedi §3.1 |

---

## 1. Obiettivo 1 — stato reale del validatore IR

### 1.1 Path e forma

**`frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts`** — 52 righe, un solo
export di funzione più una costante.

```typescript
export const VALID_ROUTING_VALUES: ReadonlyArray<NonNullable<EdgeViewIR['edge']['routing']>>
    = ['orthogonal', 'straight', 'curved'];                      // :25-26

export function validateIR(viewId: string, ir: AnyViewIR)
    : { ok: true } | { ok: false; error: string }                // :28
```

Il tipo di ritorno è un **union discriminato su `ok`**, con l'errore come **stringa
singola**. Non esiste codice d'errore, non esiste path del campo, non esiste array di
errori: il primo problema incontrato termina la validazione. È esattamente il vincolo che
R-B (2026-08-05) registra — «`validateIR` ritorna una stringa senza coordinate», da cui
il rinvio dei badge di errore per-tab e la scelta della striscia a livello di pannello.
Nulla è cambiato da allora.

### 1.2 Che cosa valida davvero, oggi

Due strati, e solo due.

**Strato 1 — l'unica regola scritta a mano** (`irValidate.ts:33-41`): vocabolario chiuso
di `edge.routing`. Il campo è letto **come `unknown`**, deliberatamente, perché i valori
che la regola esiste per catturare (la stringa vuota del placeholder di `Select`, la
tipizzazione di un provider AI, una scrittura da console) stanno fuori dall'union
dichiarata. `undefined` passa: l'assenza è il default `'orthogonal'` (`irTypes.ts:227-230`)
ed è la forma che il pannello scrive. Solo un valore **presente e fuori vocabolario** è
errore. Ratificata R-B9 / R-B9-bis.

**Strato 2 — tutto il resto è delega alla compile** (`irValidate.ts:43-50`): un try/catch
attorno a `compileEdgeView` / `compileRowView` / `compileView`. Ciò che la compile lancia
diventa l'errore; ciò che non lancia è valido. Da qui segue che il perimetro reale del
validatore è **l'insieme dei `throw` raggiungibili dai tre compilatori**, che è piccolo e
misurabile:

| Origine | Riga | Che cosa rifiuta |
|---|---|---|
| `irCompile.ts` | `:427` | row view con `template` non-array o vuoto — **l'unico `throw` esplicito di tutto `irCompile.ts`** |
| `pathExpr.ts` | `:33` | costrutto vietato in un PathExpr (`?.`, `??`, ternario, chiamata di funzione) |
| `pathExpr.ts` | `:40` | step di PathExpr che non matcha `STEP_RE` |
| `pathExpr.ts` | `:47`, `:50` | `.value` / `.values` penzolanti |
| `pathExpr.ts` | `:56` | PathExpr vuoto |
| — | (implicito) | `TypeError` da accesso a proprietà di un `undefined` strutturale: `compileView` legge `ir.shape.form` a `:245` senza guardia, quindi un vertex senza `shape` esplode e il catch lo trasforma in errore |

Misura di supporto: `command grep -n "throw" irCompile.ts` → **una** riga (`:427`).
Controllo positivo: la stessa forma di comando su `pathExpr.ts` torna cinque righe.

**Non esiste** alcun check su: i capi degli edge (`edge.source`/`edge.target`) in rapporto
a `reference` (§1.5); la coerenza fra `metaclasses` e i PathExpr che ne leggono le feature
(voce ⚠️ già a registro nella mappa, riga 82); la forma del wildcard (`'*'` stringa contro
`['*']`); `priority`; `exclusive`; `irVersion` (§1.6); `authoringMetaclassPins`;
`fieldCompartments[].id` (unicità); `badges[].position`; `labels[].position`.

### 1.3 Le due premesse del prompt sulla copertura: entrambe **false a codice**

Il prompt le dà per «note da spec e ratifiche». Nessuna delle due è implementata.

**(a) `kind: 'raw'` — registrato nella spec, NON rifiutato dal validatore.**

La spec v1.2 lo afferma due volte: «`kind: 'raw'` è **registrato e rifiutato dal
validatore**» (sez. 4, riga 61) e «Escape hatch jsxString (`kind: 'raw'`): seam
registrato, rifiutato dal validatore, non implementato» (sez. 13, riga 203).

Misura: `command grep -rn "'raw'" frontend/src/components/editor-v2/` → **exit 1, zero
righe**. Controllo positivo sullo stesso comando e sulle stesse cartelle con `'vertex'` →
12 file con hit. La stringa `'raw'` non compare in tutto `editor-v2`.

Che cosa succede davvero, misurato (§0.2): un ir con `kind: 'raw'` **non è discriminato**.
Cade nel ramo `else` di `irValidate.ts:46`, cioè `compileView`, che è tipizzato per
`NodeViewIR` e procede a leggere `ir.shape.form`. Due esiti, entrambi sbagliati per
ragioni diverse:

- senza `shape` → `{ok:false, error:"Cannot read properties of undefined (reading 'form')"}`.
  È un rifiuto per **incidente**, con un messaggio che non nomina né `raw` né il seam. Chi
  lo legge non impara nulla;
- con un qualunque `shape` → **`{ok:true}`**. L'ir viene accettato e persistito. A quel
  punto `getIRIndex` lo scarta in silenzio (`irResolveCore.ts:167`: `if (ir.kind !==
  'vertex' && ir.kind !== 'graphVertex') continue`), quindi la view non rende nulla e
  nessuno dice perché.

Il secondo caso è il vero rischio per l'arco generatore: un modello che «conosce» lo
schema dalla spec può emettere `kind: 'raw'` con una `shape` di cortesia, e il substrato
lo accetta.

**(b) Dichiarazioni di stato senza livello — R-4 è una ratifica di progettazione, non una
regola implementata.**

La fonte è `docs/ratifiche/claude_ratifiche_2026-08-03_state_actions_events.md` §R-4:
«ogni dichiarazione di stato e ogni azione che scrive nomina il livello di destinazione in
modo esplicito. Nessun default, nessuna inferenza. Il validatore rifiuta una dichiarazione
priva di livello.»

Lo stesso documento dice però, in «Tab map», che **Behavior (State più Actions) nasce
quando nasce il modello di stato, non prima**, e in R-8 elenca quattro slice prerequisite
non ancora tutte chiuse. Coerentemente: `irTypes.ts` non ha alcun concetto di stato
(`command grep -n "level" irTypes.ts` → una sola riga, `:43`, un commento su
`element-level properties`, niente a che vedere).

Misurato: un ir con una chiave `state` estranea passa (`STATE no-level: {"ok":true}`) —
non perché la regola sia lassa, ma perché **la regola non esiste ancora e la chiave è
semplicemente ignorata**. R-4 è un vincolo per il futuro capitolo, non un fatto sul
codice di oggi. Il prompt lo cita come stato dell'arte: non lo è.

### 1.4 Chiamanti

`command grep -rn "validateIR"` su `frontend/src/` — cinque siti di **chiamata** in codice
di prodotto, tutti dentro un unico flusso, più i test.

| Sito | Riga | Flusso |
|---|---|---|
| `authoring/VertexAuthoringPanel.tsx` | `:92` | **authoring** — gate del commit del draft |
| `authoring/RowAuthoringPanel.tsx` | `:88` | **authoring** — idem |
| `authoring/EdgeAuthoringPanel.tsx` | `:160` | **authoring** — idem |
| `authoring/EnableIRPanel.tsx` | `:102` | **authoring** — gate del seed di abilitazione |
| `ir/irCreationSeed.ts` | `:121` | **seeding alla creazione** (slice 1, R-IRN-4) — gate del seed; su `ok:false` ritorna `null` e la view nasce senza `ir` |

Test: `ir/__tests__/irValidate.test.ts`, `ir/__tests__/irCreationSeed.test.ts`,
`authoring/__tests__/edgeAuthoring.test.ts`, `authoring/__tests__/rowAuthoring.test.ts`.

**Zero chiamanti nel percorso di render.** È R-B9-bis (2026-08-09) applicata: le regole di
validazione vivono nell'authoring, mai in `compile*`, perché il render deve restare
permissivo verso i dati già persistiti. La quinta voce — `irCreationSeed` — è nuova
rispetto a quella ratifica (slice 1, 2026-08-13) e ne è la prima estensione: **il seeding
è un percorso di scrittura, non di render**, quindi sta dalla parte giusta della linea.

**Conseguenza diretta per l'arco generatore**: un generatore che scriva `ir` sulle view
per una via propria — senza passare da `validateIR` — non incontrerebbe **nessun** gate.
Il write path `LViewElement.set_ir` (`view.tsx:550`) è una `SetFieldAction` nuda, senza
validazione. Il gate è nei chiamanti, non nel setter.

### 1.5 La voce ⚠️ sugli IR ibridi: **confermata**, e più larga di come è scritta

Testo a registro (`docs/archivio/claude_mappa_sintassi_concreta.md`, riga 84): «`validateIR`
accetta IR ibridi ⚠️ — `reference` + capi, oppure un capo solo: il pannello non li produce
più (R-1/R-2), ma restano accettati se scritti da console».

**Confermata sul codice attuale.** `compileEdgeView` (`irCompile.ts:365-411`) non contiene
alcun confronto fra `ir.reference` e `e.source`/`e.target`. Le tre righe che decidono:

```typescript
const sourceExpr = compileExpr(e.source);        // :381
const targetExpr = compileExpr(e.target);        // :382
...
reference:      ir.reference ?? null,            // :390
isObjectAsEdge: !!(sourceExpr && targetExpr),    // :391
```

`reference` e i capi sono **campi indipendenti**, copiati entrambi nel compilato.
`isObjectAsEdge` è una congiunzione: **basta che uno dei due capi manchi perché l'ir venga
classificato reference-as-edge**, con `sourceExpr`/`targetExpr` compilati e appesi al
risultato, dove nessuno li leggerà.

Verifica eseguita (§0.2), tre casi, tutti `{"ok":true}`:

| Caso | `reference` | `edge.source` | `edge.target` | `validateIR` | `isObjectAsEdge` |
|---|---|---|---|---|---|
| ibrido pieno | `'source'` | `$src.value` | `$tgt.value` | ok | `true` — `reference` sopravvive e viene **ignorato** |
| ibrido a un capo | `'source'` | `$src.value` | — | ok | `false` — il capo compilato è **codice morto** |
| un capo solo | — | — | `$tgt.value` | ok | `false` — idem, e l'edge si comporta da reference-as-edge senza `reference`, cioè matcha **ogni** reference della metaclasse |

Due precisazioni che allargano la voce come è scritta:

1. il difetto non riguarda solo l'ir scritto «da console». Riguarda **qualunque
   scrittore che non sia i quattro pannelli**, e un generatore AI è esattamente uno di
   questi. La formulazione attuale sottostima il rischio nel contesto dell'arco;
2. il terzo caso della tabella (un capo, nessun `reference`) non è nominato dalla voce e
   **è il più insidioso**: nessun campo è palesemente in conflitto, l'ir è internamente
   plausibile, e il risultato è un edge applicato a tutte le reference della metaclasse
   sorgente — cioè una resa larga dove l'autore ne intendeva una stretta.

Costo del rimedio, per informare R-GEN-3: la regola sta in `validateIR` (authoring-time,
R-B9-bis), è una congiunzione su tre campi già in mano alla funzione, e **non tocca
`irCompile`**. Il rischio dichiarato dalla voce — «può invalidare view persistite» — resta
reale ma è confinato all'authoring: una view ibrida già salvata continua a rendere come
oggi, e diventa non-committabile solo se qualcuno la riapre e la modifica.

### 1.6 Difetti aggiuntivi trovati durante la verifica (non richiesti, a verbale)

- **`irVersion` ha zero lettori.** Sette siti lo scrivono (`irDefaults.ts` ×3,
  `irDemoFixture.ts` ×2, `irCreationSeed.ts` ×1, `EnableIRPanel.tsx` ×1); nessun sito di
  prodotto lo legge. Misura: `command grep -rn "irVersion"` meno i siti di scrittura →
  solo dichiarazioni di tipo in `irTypes.ts` (`:137,142,166,208,250`). Controllo positivo:
  lo stesso comando trova le dichiarazioni, quindi è partito. Conseguenza per l'arco: se
  l'AI emette `irVersion: 'ir-1.2'` nessuno lo verifica, e se ne emette uno inventato
  nessuno se ne accorge.
- **I valori scritti oggi non concordano fra loro**: `defaultObjectViewIR()` e
  `defaultEdgeViewIR()` scrivono `'ir-1.2'`, il seed row e i due fixture scrivono
  `'ir-1.0'`. Non è un bug osservabile (nessuno legge), ma è rumore in un campo che
  l'arco generatore userebbe come contratto.
- **`compileView` non ha guardia su `ir.shape`** (`:245`). Per un vertex autorato non è un
  problema — i pannelli scrivono sempre una shape — ma è il meccanismo che rende il
  rifiuto di `raw` un incidente invece che una regola (§1.3a).

---

## 2. Obiettivo 2 — creare e persistere un viewpoint IR per via programmatica

### 2.1 Lo snippet esiste

`docs/archivio/artefatti/claude_snippet_2026-07-21_sm_ir_testbed_viewpoint.js`, 168 righe.
Installa da console un viewpoint «IR Test Bed» completo per sm.ecore, con tre view: State
(vertex), Machine (graphVertex con containment), Transition (object-as-edge). È
**l'artefatto di riferimento del percorso programmatico**, e la sua ricetta coincide con
quella di `irDemoFixture.ts:90-120`, che è il gemello in-repo e compilato.

Nota: lo snippet dichiara nel proprio preambolo di essere «grounded on the real install
API» — e lo è ancora: le due firme che cita sono invariate a HEAD.

### 2.2 Il percorso, passo per passo

**Passo 1 — creare il viewpoint.**

```typescript
// view/viewPoint/viewpoint.ts:38
public static newVP(name: string, callback?: (d: DViewElement) => void,
                    persist: boolean = true, id?: string): DViewPoint
```

Corpo (`:39-45`): `new Constructors(new DViewPoint('dwc'), undefined, persist, undefined, id)
.DPointerTargetable()` → **`c.thiss.viewpoint = c.thiss.id`** (il viewpoint punta a se
stesso) → `.DViewElement(name, '')` → `.DViewPoint()` → `.end(callback)`.

L'auto-riferimento del passo intermedio è ciò che fa funzionare il passo 2: le view figlie
ereditano `viewpoint` dal padre, e per il padre-viewpoint quel valore è il proprio id.

L'`id` esplicito (quarto parametro) è ciò che rende idempotenti sia lo snippet
(`Pointer_TB_*`) sia `irDemoFixture` (`Pointer_IRDemo*`): si controlla
`store.getState().idlookup[vpId]` prima di creare.

**Passo 2 — creare le view con l'`ir` già dentro.**

```typescript
// view/viewElement/view.tsx:308
public static new2(name: string, jsxString: string, father0?: DViewElement,
                   callback?: (d: DViewElement) => void, persist: boolean = true,
                   id?: string): DViewElement
```

Corpo (`:310-315`): `father = father0 || Defaults.viewpoints[0]`; `vp = father.viewpoint ||
Defaults.viewpoints[0]`; poi `new Constructors(new DViewElement('dwc'), father.id, persist,
undefined, id).DPointerTargetable().DViewElement(name, jsxString, vp).end(callback)`.

Passando il `DViewPoint` come `father0` si ottiene in un colpo solo: `d.father =
vp.id` e `d.viewpoint = vp.viewpoint = vp.id`. **Non c'è un passo separato di
"associazione al viewpoint"**: l'associazione è il terzo argomento.

La scrittura dell'`ir` va nella **callback**, non dopo:

```typescript
DViewElement.new2(name, JSX, vp, (d) => {
    d.appliableToClasses = ['DObject'];
    d.appliableTo = 'Vertex';
    (d as any).ir = <IR>;
}, true, viewId);
```

Ragione, misurata: `Constructors.end()` (`joiner/classes.ts:680-691`) chiama la callback a
`:683` e `Constructors.persist(this.thiss)` a `:688` — **la callback gira prima della
persist**. L'`ir` nasce quindi già dentro l'oggetto persistito, in una sola action. È il
pattern che `irDemoFixture.ts:106,112` usa e che la slice 1 ha replicato in
`view.tsx:419-422` e `lastViewpoint.ts:287-290`.

**Passo 3 — attivare il viewpoint.**

```typescript
// utils/lastViewpoint.ts:49
export function activateViewpoint(viewpointId: string | null): void
```

Scrive due cose, **entrambe necessarie**: `SetFieldAction.new(projectId, 'activeViewpoint',
viewpointId, '', true)` (`:55`, letto dal renderer classico) e
`SetRootFieldAction.new('viewpoint', viewpointId || '', '', true)` (`:59`, cioè
`state.viewpoint`, che è quello che l'interprete IR legge — `irResolveCore.ts:77`). Il
commento del modulo (`:40-45`) spiega perché si usano le action dirette e non il setter del
proxy: batching asincrono delle TRANSACTION che interferiva con l'aggiornamento di
`activeViewpoint`.

Terza cosa, non ovvia e non evitabile: `activateViewpoint` chiama `warnOnGlobalCss` (`:63`),
che scandisce tutte le view e i viewpoint del progetto (R-2/3.6). È informativo e non scrive
nel modello, ma un generatore che attivasse il viewpoint appena creato ne pagherebbe la
scansione e potrebbe far comparire un toast.

Nota di chiusura del ciclo: `irDemoFixture.ts:115` chiama `clearCompileCache()` dopo aver
creato le view. Lo snippet no, e per questo si dichiara «idempotente fino a un hard
refresh». Un generatore che riscrive `ir` su view già compilate deve saperlo: la cache di
compile è keyed su `(viewId, irHash)`, quindi un ir **diverso** produce una chiave diversa
e non serve invalidare; serve solo se si ricrea una view con **lo stesso id e lo stesso
ir**.

### 2.3 §3.3 e §9 applicate a questo percorso

**§3.3 (nessuna TRANSACTION esterna attorno ai creator) — si applica, e per la stessa
ragione.** `Constructors.persist` apre la propria TRANSACTION, e il commento a
`joiner/classes.ts:689` lo dichiara testualmente: *«warning: there is a transaction at
.persist method, do not use BEGIN+END/TRANSACTION inside»*. `newVP` e `new2` terminano
entrambi in `.end()` → `persist`. Quindi:

```typescript
// SBAGLIATO — le action annidate vengono fuse via
TRANSACTION('install viewpoint', () => {
    const vp = DViewPoint.newVP(...);
    for (const v of views) DViewElement.new2(..., vp, ...);
});

// GIUSTO — ciclo nudo, come snippet e irDemoFixture
const vp = DViewPoint.newVP(...);
for (const v of views) DViewElement.new2(..., vp, ...);
```

Precisazione, perché §3.3 nomina `DVertex.new` / `DVoidEdge.new2` / `new3` e non le view:
il pericolo non è la classe D, è **`Constructors.persist`**, che è condiviso. La regola si
applica a `newVP` e `new2` per identità di meccanismo, non per analogia.

Sotto-nota: `Constructors.DViewElement` contiene già una `TRANSACTION('recompile jsx &
more', ...)` interna (`joiner/classes.ts:1195-1199`), pure-action (solo
`setExternalRootProperty`), quindi §3.3 «SAFE». Non è un problema di per sé — è un motivo
in più per non annidare.

**§9 (id temporanei di `DObject.new`) — NON si applica alle view.** Verificato risalendo il
costruttore: `Constructors.constructor` chiama `this.setID(id, isUser)` come **prima**
operazione (`:572`), e `setID` (`:592-594`) assegna `this.thiss.id = id ||
Constructors.makeID()`. L'id esiste prima di qualunque altra cosa ed è quello definitivo.

Prova d'uso indipendente: `createBlankViewInViewpoint` ritorna la `DViewElement` e il
chiamante ne usa subito l'`id` per pilotare il rename inline
(`TreeViewContent.tsx:1352-1356`, con il commento sul batching automatico di React 18 che
garantisce che il `<SubViewItem>` monti già con `renamingViewId === newView.id`). Se l'id
fosse temporaneo quel gesto non funzionerebbe.

Quindi: **niente `setTimeout`, niente lookup per nome, niente deferred attribute setting**.
Il percorso view è più semplice del percorso oggetto di §9.

### 2.4 Che cosa fa esattamente `EnableIRPanel`

`frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx`, 151 righe.

**Scrive esattamente un campo, con una sola scrittura**: `(view as any).ir = seed` (`:107`).
Nient'altro. Non tocca `appliableToClasses`, non scrive `migratedFrom`, **non scrive il
pin** — e questo benché la sua `resolveMetaclassNames` (`:34-46`) risolva `entry → LProxy →
l.name` e butti via `l.id`, che è precisamente il valore che il pin vuole. Il pin nasce
solo da `withMetaclassPins` dentro il `patch` dei pannelli
(`metaclassPin.ts:128-149`) e solo su un cambio reale di `metaclasses` (`:133`, guardia di
uguaglianza sulla lista).

Meccanismo della scrittura: l'assegnazione sul proxy L instrada su
`LViewElement.set_ir` → `SetFieldAction.new(c.data, "ir", val, '', false)`
(`view.tsx:550`). `ViewData` ri-renderizza e il tab IR passa dal gate al pannello di
authoring.

Prima della scrittura, due gate:

1. **guardia di non-sovrascrittura** (`:67-76`): se `view.ir` esiste già, il pannello rende
   un messaggio e **non modifica nulla**. Difende dal caso «ir di un kind non ancora
   autorabile»;
2. **`validateIR(view.id, seed)`** (`:102-103`): su fallimento imposta l'errore in UI e
   ritorna senza scrivere.

I tre semi che può produrre (`:83-101`):

| kind | `metaclasses` | resto |
|---|---|---|
| `vertex` | `names.length > 0 ? [...names] : '*'` | `...defaultObjectViewIR()`, più `label: view.name` se il nome c'è |
| `row` | `[]` (letterale minimale) | `template: [{from:'intrinsic', prop:'name'}]`, `irVersion: 'ir-1.0'` |
| `edge` | `names.length > 0 ? [...names] : []` | `...defaultEdgeViewIR()` |

`names` viene da `resolveMetaclassNames(view)`, che scarta i tipi D-level tramite
`D_LEVEL_TYPES` (`:22-25`). Come già misurato dalla discovery del 2026-08-13 (nota 4 della
entry `2026-08-13 16:00`), su una view nata da «Create View» `appliableToClasses` contiene
solo D-level, quindi `names` è sempre `[]` e il vertex cade sul wildcard. È esattamente il
difetto che `irCreationSeed` esiste per non ereditare (`irCreationSeed.ts:10-17`).

**Stato d'arco**: R-IRN-5 (2026-08-13) ne prescrive il **ritiro** insieme alla clausola
legacy di `showIRTab`, nella slice 2, dopo A3. Chi progetta il generatore non deve
appoggiarsi a questo pannello come innesto: è codice in uscita.

**Montaggio** (per l'obiettivo 3.3): un solo sito.
`components/editors/views/ViewData.tsx:145`, ramo `else` finale del tab `IR` della **barra
legacy** — cioè raggiungibile **solo** quando `showIRTab` è vero e `ir` è assente
(`ViewData.tsx:65`: `(isV && !ir && view.isEdge !== true)`). Una view che nasce con l'`ir`
(slice 1) prende la barra a cinque tab (`:104`) e non vede mai questo pannello.
Controllo: `command grep -rn "EnableIRPanel"` su `frontend/src/` → un solo import e un
solo uso JSX fuori dal file stesso, entrambi in `ViewData.tsx` (`:29`, `:145`).

### 2.5 Export inverso: come si enumerano le view di un viewpoint

**Il campo di collegamento è `d.viewpoint`**, denormalizzato su ogni `DViewElement`, e
l'enumerazione canonica è già scritta due volte in `irResolveCore.ts`:

```typescript
// irResolveCore.ts:110-115 (getIRIndex) — e identico a :81-86 (computeIRSignature)
const list: string[] = state.viewelements ?? [];
for (const vid of list) {
    const d = lookup?.[vid];
    if (!d || d.viewpoint !== vp) continue;
    const ir = (d as any).ir as AnyViewIR | undefined;
    if (!ir || typeof ir !== 'object') continue;
    ...
}
```

Tre fatti da non confondere fra loro:

- **`state.viewelements`** è la lista-radice dei pointer di **tutte** le `DViewElement` del
  progetto. I viewpoint **non ci sono dentro** (dichiarato in
  `viewSubtree.ts:34-35`: «Viewpoints are not in here, and cannot be children»). La
  lista-radice dei viewpoint è **`state.viewpoints`**, che è quella che il selettore della
  Toolbar consuma (`Toolbar.tsx:191`);
- **il filtro è `d.viewpoint === vp`, per uguaglianza sul campo persistito**, non una
  risalita della catena `father`. È lo stesso campo che D-4-1 rende read-only in UI e che
  Q2 (2026-08-08) impone alla breadcrumb — «`readViewParenting` (campo persistito
  `d.viewpoint`), **mai** `get_viewpoint`, che risale la catena `father` e potrebbe
  contraddire la riga read-only su dati legacy divergenti». **Un export deve usare
  `d.viewpoint`**, per essere d'accordo con ciò che il resolver rende;
- **non si passa da `subViews`.** `viewSubtree.ts:10-18` motiva: quattro scrittori vivi,
  uno dei quali (`LViewElement.updateDefaultView`, `view.tsx:1758`) è una mutazione grezza
  fuori da ogni action che gira a ogni caricamento progetto; e la migration `2.2 -> 2.201`
  scrive `father` senza ricostruire i reciproci. Se all'export servisse la **gerarchia** e
  non l'insieme piatto, l'enumeratore corretto esiste già ed è
  `collectViewSubtree(state, rootId)` (`viewSubtree.ts:43`), BFS su `father` con visited
  set, puro, senza accesso allo store.

**Dove vive il campo `ir` sul D-layer** — `view/viewElement/view.tsx:207-209`:

```typescript
// ViewpointIR (EditorV2 interpreter contract, spike 2026-07-17). Optional and additive:
// undefined for classic views; serialization is generic, no VersionFixer needed.
ir?: GObject;
```

Tipizzato `GObject` (cioè `any` strutturato), **non** `AnyViewIR`: il D-layer non conosce
lo schema IR. Serializzazione generica insieme al resto del `DViewElement`; nessun
VersionFixer, nessuna migrazione. Lettura via proxy: `get_ir` → `c.data.ir`
(`view.tsx:549`). Scrittura: `set_ir` → `SetFieldAction` diretta (`:550`).

Un dump già esiste ed è il precedente di forma per l'export: `IRSourceBody`
(`irTabs.tsx:122-140`), `JSON.stringify(ir ?? null, null, 2)` in un `<pre>`, gated su
advanced (`irTabsForKind`, `:45-50`), read-only per scelta dichiarata — mostra ciò che è
**persistito**, non il draft, «ed è esattamente ciò che rende visibile quel divario».

### 2.6 Il buco strutturale: `ViewpointIR` non esiste come tipo

Il prompt parla di «l'AI emette un `ViewpointIR` ir-1.2» e l'export inverso è descritto
come «viewpoint → `ViewpointIR` JSON». La spec v1.2 sez. 6 lo definisce come contenitore:

```typescript
interface ViewpointIR { irVersion; name?; metamodel?; views: ViewIR[]; interaction?: InteractionSpec; }
```

**Nel codice quel tipo non esiste.** Misura: `command grep -rn "ViewpointIR"` su
`frontend/src/` → 5 righe, **tutte commenti o docstring** (`irTypes.ts:2`,
`irValidate.ts:2`, `PredicateBuilder.tsx:167`, `view.tsx:207`, `view.tsx:548`). Controllo
positivo sullo stesso file: `AnyViewIR` in `irTypes.ts` → 2 occorrenze, quindi il comando
trova ciò che c'è. Il tipo esportato più alto è `AnyViewIR = NodeViewIR | EdgeViewIR |
RowViewIR` (`irTypes.ts:263`), che è **una view**, non un viewpoint.

Segue che:

- **l'unità di persistenza è la view**, una `DViewElement` per ciascuna, e il viewpoint è
  soltanto l'insieme di quelle con lo stesso `d.viewpoint`. Un generatore che riceva un
  `ViewpointIR` deve **decomporlo**: N `DViewElement.new2` sotto un `DViewPoint.newVP`;
- **`interaction` non ha né tipo, né campo, né lettore.** È spec pura. Un `ViewpointIR`
  generato che la contenesse non avrebbe dove essere scritto;
- **`id?` e `migratedFrom` di `ViewCommon` non sono in `irTypes`**: `migratedFrom` è letto
  solo come cast locale in `irDefaults.ts:138`, `id?` non esiste;
- `metaclasses: MetaclassRef[]` della spec è `string[] | '*'` nel codice, cioè **nomi**,
  con l'identità delegata al pin opzionale (`authoringMetaclassPins`, `irTypes.ts:139`).

Questa è la distanza più grande fra spec e substrato che la discovery abbia misurato, ed è
strutturale, non di dettaglio.

---

## 3. Obiettivo 3 — punti di innesto UX (anatomia, nessuna proposta)

### 3.1 Jjodie

**`JodieWindow.tsx` non monta azioni.** È un guscio presentazionale di 500 righe: geometria
(drag, resize a 8 direzioni, fullscreen, reset), persistenza di posizione/dimensione in
`JodieConfig`, un listener su `JjScriptEvents.EXECUTING`/`EXECUTION_END` per la barra
«Executing (n/m)», e il montaggio di quattro figli — `JodieHeader`, `ChatMessages`,
`ChatInput`, `AIDisclaimer`. **Tutte le 30+ callback sono props**: non decide nulla, le
inoltra.

L'orchestrazione sta in **`components/Jodie/Jodie.tsx`** (~35 KB). Da lì:

**Meccanismo estendibile — esiste, ed è il `LanguageProvider`.**
`components/Jodie/console/types.ts:59-70`:

```typescript
export interface LanguageProvider {
    id: LanguageProviderId;                  // 'jjodie' | 'jjscript' | 'jjel'  ← union CHIUSA (:52)
    displayName: string;
    run(input: string, ctx: ConsoleContext): Promise<ConsoleResult>;
    detect?(input: string): boolean;         // parse stretto: in modalità Jjodie OFFRE, non esegue
}
```

Registry: `console/languageRegistry.ts`, una `Map` con `register` / `get` / `list`, e un
singleton `consoleLanguageRegistry` con i tre built-in registrati a module load. Il
docstring dichiara che è «step 1 of the console v1 refactor (behavior-preserving)»: **il
registry esiste ma la decisione di routing non lo usa** — sta ancora inline in
`Jodie.tsx:433` (`consoleMode === 'jjscript'`) e `:489`
(`jjscriptProvider.detect?.(content)`). Estenderlo con un quarto provider richiede quindi
sia la registrazione sia un ramo di routing, e l'allargamento di `LanguageProviderId`.

**Il pattern «azione offerta» è già a codice ed è il precedente da guardare.** In modalità
Jjodie, se l'input parsa come comando JjScript completo, Jodie **non esegue e non chiama
l'LLM**: appende un messaggio con `jjscriptOffer: { input }` (`Jodie.tsx:489-500`), che
`ChatMessages.tsx:73-95` rende come card con i bottoni [Esegui] / [Chiedi a Jjodie]. È
deterministico e reversibile: la card è il canale con cui una capability propone
un'azione senza compierla.

**Contesto di progetto — due canali distinti, entrambi passati come stringa.**

1. **strutturale**: `JjodieContextService.getContextString(project, activeArtifact)`
   (`services/JjodieContext.ts:316`), ricalcolato in un `useMemo`
   (`Jodie.tsx:129-159`) con deps `[state.idlookup.clonedCounter, editorChangeCounter]`.
   Contenuto (`buildContextString`, `:242-302`): artefatto attivo con livello M1/M2, nome
   progetto, conteggio metaclassi, e **per ogni metaclasse** nome, flag abstract, `extends`,
   attributi `nome: tipo [molteplicità]`, reference `nome: target [molteplicità]` con
   glifo per tipo (`◆→` composition, `△→` inheritance, `→` association); poi gli enumeratori
   con i loro literal, e i package.

   **È già quasi esattamente l'input che un generatore di notazione vorrebbe.** Con una
   lacuna precisa: `MetaclassInfo` **ha** il campo `id` (`:49`) ma `buildContextString`
   **non lo emette mai**. L'LLM vede nomi, non pointer. Un `authoringMetaclassPins`
   generato dall'AI sarebbe quindi impossibile senza una risoluzione nome→id lato client;
2. **RAG**: `JjodieRagService`, inizializzato e re-indicizzato in un `useEffect` con
   `setInterval` a 30 s (`Jodie.tsx:272-302`). L'augmentazione avviene dentro
   `jjodieProvider.run` (`console/providers/jjodieProvider.ts:34-48`): `getAugmentedContext
   (input)` e concatenazione al contesto strutturale sotto l'intestazione `**Relevant
   Information:**`. Il fallimento del RAG è catturato e non propaga.

**Provider system — il path del prompt è sbagliato e la API di CLAUDE.md §16 non esiste.**

- `frontend/src/ai/` **non esiste** (`ls` → «No such file or directory»);
- `useAIProviderPreference` **non esiste come simbolo**. Misura: `command grep -rn
  "useAIProviderPreference"` su `frontend/src/` → **una sola riga**, e non è una
  definizione: `abstract/tabs/DocumentationTab.tsx:583`, dove il nome compare **dentro un
  commento** accanto alla chiamata reale:
  `const selectedProvider = AIConfig.getPreferred('documentation'); // useAIProviderPreference('documentation');`.
  CLAUDE.md §16 documenta un hook che non è mai stato scritto (o è stato ritirato lasciando
  il commento).

La API vera:

| Cosa | Dove |
|---|---|
| `AIConfig` (classe) — `getPreferred(feature)`, `setPreferred`, `getPreferredModel`, `get`, `isConfigured` | `frontend/src/types/jodie.ts:408-540` |
| chiamata LLM | `frontend/src/services/AIProviderService.ts` — `chat(input, provider, history, context, images, documents, model)` |
| selettori UI | `components/common/ProviderSelector.tsx`, `components/common/ProviderModelSelector.tsx`, `components/Jodie/ProviderSelector.tsx` (Jodie-specifico, distinto) |
| disclaimer | `components/common/AIDisclaimer.tsx`, per-feature |

**Sistema di prompt personalizzabili — esiste, con registry chiuso.**
`frontend/src/types/prompts.ts`: `PromptType` è una union di 7 valori (`chat`,
`documentation`, `validation`, `refactoring`, `ocl`, `import`, `mappings`), `PROMPT_REGISTRY`
ne porta metadati (nome, descrizione, categoria `assistant|generation|analysis`,
`supportsVariables`), e `services/PromptService.ts` gestisce override globali e
per-progetto con versionamento (`baseVersion`, changelog) e storage in localStorage
(`jjodel_prompt_global_*` / `jjodel_prompt_project_*`). UI in
`components/Settings/PromptsSettingsSection.tsx`.

Un gesto «genera notazione» che volesse un prompt di sistema personalizzabile avrebbe qui
la propria casa, al costo di **un valore in più nella union e una voce nel registry**.

**Codice morto nel vicinato, a verbale.** `services/JjodieActionExecutor.ts`,
`services/JjodieActionParser.ts` e `services/JjodieCommandParser.ts` hanno **zero
consumatori**. Misura: un loop di `command grep -rn "<nome>"` escludendo il file stesso →
nessuna riga per i tre. Controllo positivo nello stesso loop: `JjodieHelpSystem` torna due
righe (`CommandPalette.tsx:7,35`), quindi la ricerca è partita. Chi progettasse un
meccanismo di azioni AI non riparta da lì senza prima verificarne lo stato: i nomi
promettono più di quanto il codice tenga.

### 3.2 Flusso «New Viewpoint»

Una sola superficie viva, in due pezzi:

**Form** — `components/project/NewViewpointDialog.tsx` (159 righe). Modale con overlay,
ESC per chiudere, autofocus a 100 ms. Due campi soli:

- **Name** (obbligatorio, validato contro `existingNames` per unicità);
- **Type**, `<select>` su 5 valori (`ViewpointType`, definito in
  `view/viewPoint/viewpoint.ts:13`): `syntax` (l'unico esclusivo), `decoration`,
  `validation`, `semantics`, `editor_behavior`, ciascuno con una riga di descrizione sotto
  il select.

Nessun campo di metamodello, nessun campo di contenuto: il dialog crea un contenitore vuoto.

**Handler** — `ProjectEditor.tsx:1192-1216`, `handleCreateViewpoint`:

```typescript
const dVp = DViewPoint.newVP(data.name, (vp) => {
    switch (data.type) {                       // legacy booleans dal tipo
        case 'syntax':     vp.isExclusiveView = true;  vp.isValidation = false; break;
        case 'validation': vp.isExclusiveView = false; vp.isValidation = true;  break;
        default:           vp.isExclusiveView = false; vp.isValidation = false; break;
    }
    (vp as any).viewpointType = data.type;     // campo esplicito
});
setShowNewViewpointDialog(false);
DockManager.openViewpoint(dVp);                // apre subito il viewpoint appena creato
```

Il viewpoint nasce **senza alcuna view**. `getViewpointType` (`viewpoint.ts:16-21`) legge
`viewpointType` e ricade sui booleani legacy se assente.

**Due punti di lancio, stesso stato**: il bottone `+ New` della `SectionHeader` della
sezione VIEWPOINTS (`ProjectEditor.tsx:2620`) e un listener su evento
(`:443`, `handler = () => setShowNewViewpointDialog(true)`).

### 3.3 `EnableIRPanel`: dove è montato e da chi

Già risposto in §2.4: **un solo sito**, `components/editors/views/ViewData.tsx:145`,
ultimo `else` della catena del tab `IR` della barra **legacy**. Condizioni per vederlo
(`ViewData.tsx:65`): la view non è un viewpoint, non ha `ir`, e non è una edge-view
classica (`view.isEdge !== true`). Con la slice 1 landata, **le view create oggi dai due
gesti principali nascono con l'`ir`** e non passano più di qui.

### 3.4 Superfici che espongono il viewpoint come entità

Quattro, con capienza d'azione molto diversa.

| Superficie | File | Azioni per-viewpoint oggi | Capienza |
|---|---|---|---|
| **Lista VIEWPOINTS del ProjectEditor** | `ProjectEditor.tsx:2615-2700` | riga per viewpoint con badge di tipo, conteggio view ricorsivo, e **tre bottoni icona già montati**: View (`bi-eye` → `handleOpenViewpoint`), Duplicate (`bi-copy` → `vp.duplicate()`), Delete (`bi-trash`, nascosto sui due default) | **La più capiente.** Esiste già un contenitore `.list-card__actions` con tre bottoni: una quarta icona non richiede struttura nuova |
| **Riga Viewpoint del Tree** | `TreeViewContent.tsx:1299-1410` (`ViewpointNode`) | **una sola** azione inline, il `+` «Add view» (`:1359-1367`) che chiama `createBlankViewInViewpoint` e apre il rename inline. Nessun context menu sulla riga viewpoint | Lo slot `actions` di `EntityRow` accetta un solo nodo React oggi, ma è un nodo: la struttura non lo vieta. D-4-3 (2026-08-07) registra lo slot azioni del Tree come «aggiunta futura» |
| **Selettore viewpoint della Toolbar v2** | `Toolbar.tsx:189-201`, `:418-434` | `<select>` puro su `state.viewpoints` con opzione «No viewpoint»; `onChange` → `activateViewpoint`. Nessuna azione | Nulla. È un selettore, non un menu |
| **Menu File → Export** | `Navbar.tsx:1387-1404` | `Download Project` (`.jjodel`, via `buildProjectExportJson` + `U.download`) e `Export Canvas` (PNG/JPEG/SVG/clipboard, via `JjodelEvents.EXPORT_CANVAS`) | È **il precedente di forma** per un export a file: `U.download(filename, text, mimeType)` (`common/U.tsx:1780`) è la primitiva, e il pattern «voce di menu → CustomEvent → servizio» è già in uso |

Il context menu del Tree (`useClassifierContextMenu`, `TreeViewContent.tsx:442-501`) è
montato sui **classificatori** (DClass, DEnumerator, DModel, DPackage) e non sui viewpoint;
ha una voce sola, «Create View», gated su `isAdvancedMode()` (`:468`) dal commit
`c224fca1f`.

---

## 4. Dipendenze e rischi

**R1 — Il gate esiste solo dove qualcuno lo chiama.** `set_ir` è una `SetFieldAction` nuda.
I cinque chiamanti di `validateIR` sono tutti in authoring/seeding. Un generatore che
scriva per una via propria non incontra nessuna verifica. *Mitigazione naturale: il
generatore riusa `computeCreationSeed` come modello — un modulo puro che valida e ritorna
`null` invece di persistire spazzatura.*

**R2 — Il validatore non copre ciò che un'AI sbaglia.** Le regole vive sono una
(`edge.routing`) più i `throw` del parser di PathExpr. Restano fuori: `kind` fuori
vocabolario (§1.3a), ibridi reference/capi (§1.5), wildcard scritto `['*']` invece di
`'*'`, `irVersion` arbitrario (§1.6), unicità degli `id` di compartment. Sono precisamente
le classi di errore che un generatore produce.

**R3 — Il wildcard è una stringa e sbagliarlo è silenzioso.** `irResolveCore.ts:178`
confronta `ir.metaclasses === '*'` per identità di stringa. `['*']` archivierebbe la view
sotto una metaclasse chiamata letteralmente `*`, che non matcha nulla e non è digitabile.
Già misurato dalla slice 1 (nota 1 della entry `2026-08-13 18:00`) e già coperto da un
test in `irCreationSeed.test.ts`; **non** coperto da `validateIR`.

**R4 — Il pin ha bisogno di un pointer che il contesto AI non espone.**
`authoringMetaclassPins` è `{nome → id di DClass}` e la catena di risoluzione verifica l'id
contro le sole classi del progetto (`metaclassPin.ts:80`). `buildContextString` non emette
gli id (§3.1). Un pin lo deve calcolare il client, dopo la risposta, o non lo si scrive
affatto (un pin sbagliato è **peggio** di un pin assente: viene respinto a ogni lettura,
quindi è scritto e inerte).

**R5 — `ViewpointIR` è un contratto senza tipo.** §2.6. La decomposizione contenitore →
N view è lavoro del generatore, non del substrato, e `interaction` non ha dove atterrare.

**R6 — La mappa di copertura è in `archivio/` e ferma al 2026-08-06.** Si dichiara
«documento vivo, aggiornare in place». Le sue voci ⚠️ restano usate come stato dell'arte
(questo prompt lo fa) mentre il codice si è mosso di otto giorni.

**R7 — La spec v1.2 afferma una cosa falsa sul codice, in due punti** (sez. 4 riga 61 e
sez. 13 riga 203). Chi legge la spec per costruire il generatore conclude che il seam
`raw` è protetto. Non lo è (§1.3a).

**R8 — `EnableIRPanel` è in uscita** (R-IRN-5, slice 2). Non è un innesto su cui
appoggiarsi.

**R9 — CLAUDE.md §16 documenta una API inesistente** (`useAIProviderPreference`, §3.1). È
un difetto di documentazione, non di codice, ma indirizza male chi progetta.

**R10 — Tre servizi Jjodie dai nomi promettenti sono morti** (§3.1).

**R11 — `activateViewpoint` ha un effetto collaterale non ovvio**: la scansione CSS globale
di R-2/3.6, con possibile toast (§2.2, passo 3).

---

## 5. Domande aperte per Alfonso

**Q1 — R-GEN-3, perimetro degli ibridi.** La voce ⚠️ è confermata e più larga di come è
scritta: il caso «un capo, nessun `reference`» non è nominato e produce una resa larga
silenziosa. La regola andrebbe in `validateIR` (authoring-time, R-B9-bis), non tocca
`irCompile`, e rende non-committabile una view ibrida già salvata solo quando qualcuno la
riapre e la modifica. **Si chiude nell'arco generatore o resta la slice separata che la
mappa prevede?** E il terzo caso entra nel perimetro?

**Q2 — `kind: 'raw'`.** La spec dice due volte che è rifiutato; il codice lo accetta se
porta una `shape`, e poi lo scarta in silenzio al render. Tre esiti possibili: (a) scrivere
la guardia esplicita in `validateIR` e allineare il codice alla spec; (b) emendare la spec e
dichiarare il seam non protetto; (c) lasciare com'è e affidarsi al prompt del generatore.
**Quale?** La (a) costa tre righe.

**Q3 — R-GEN-2, forma dell'export.** Il codice non ha un tipo `ViewpointIR`: l'export
deve **comporre** il contenitore dalle N view (`state.viewelements` filtrate su
`d.viewpoint`). Domande dentro la domanda: si esporta l'insieme **piatto** delle view del
viewpoint, o la **gerarchia** `father` (per cui esiste già `collectViewSubtree`)? Si
includono le view **senza `ir`** (che dopo la slice 1 sono le default di init, R-IRN-1) o
si tacciono? Si scrive un `interaction` vuoto per fedeltà alla spec, o si omette il campo?

**Q4 — R-GEN-2, innesto dell'export.** Quattro superfici, ordinate per capienza reale: la
lista VIEWPOINTS del ProjectEditor ha già tre bottoni icona e ne ospiterebbe un quarto senza
struttura nuova; il Tree ha uno slot azioni con una sola voce e un rinvio a registro
(D-4-3); il menu File → Export ha il pattern del download già scritto (`U.download`); il
selettore della Toolbar non ha capienza. **Quale, e una o più di una?**

**Q5 — R-GEN-8, innesto del gesto.** Jjodie ha già il precedente giusto — la card «offerta»
che propone un'azione e non la compie (`jjscriptOffer`). Ma il registry dei provider esiste
e non è ancora la sede della decisione di routing (docstring: «step 1, behavior-preserving»),
quindi un quarto provider richiede anche un ramo inline in `Jodie.tsx` e l'allargamento di
una union chiusa. **Il gesto nasce come provider di console (`/genera-notazione`), come card
d'offerta su un intento riconosciuto, o come azione fuori da Jjodie — un bottone sulla
sezione VIEWPOINTS o sul metamodello?**

**Q6 — Prompt di sistema del generatore.** `PromptService` esiste con override globali e
per-progetto, versionamento e UI in Settings, ma `PromptType` è una union chiusa di 7
valori. **Il prompt del generatore entra lì come ottavo tipo — quindi personalizzabile
dall'utente — o resta una costante nel modulo?**

**Q7 — L'identità delle metaclassi nel contesto AI.** `buildContextString` emette i nomi e
non gli id, benché `MetaclassInfo.id` esista. Due strade: arricchire il contesto con gli id
(tocca un servizio condiviso da tutte le feature AI, non solo dal generatore), oppure
risolvere nome→id lato client dopo la risposta e scrivere il pin da lì. **Quale?** La
seconda non tocca nulla di condiviso.

**Q8 — `irVersion`.** Zero lettori, sette scrittori che non concordano (`ir-1.0` vs
`ir-1.2`). Se l'AI deve emetterlo come contratto, **vale la pena renderlo verificato** (una
riga in `validateIR`) e uniformare i sette siti, o resta un campo decorativo?

**Q9 — Manutenzione della mappa di copertura.** È in `docs/archivio/`, si dichiara viva,
ed è ferma al 2026-08-06 mentre le sue voci ⚠️ vengono citate come stato dell'arte.
**Torna in `docs/` attivo e si aggiorna in coda a questo arco, o si dichiara congelata?**

---

## 6. Riepilogo secco

| Domanda del prompt | Risposta |
|---|---|
| Path del validatore | `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` |
| Che cosa valida | 1 regola scritta (`edge.routing`) + i `throw` di `compileRowView` (template vuoto) e di `pathExpr` (5 siti) + i `TypeError` strutturali |
| Rifiuta `kind: 'raw'`? | **No.** Accettato se porta una `shape`; rifiutato per incidente altrimenti. La spec afferma il contrario |
| Rifiuta stato senza livello? | **No** — non esiste alcun concetto di stato nell'IR. R-4 è progettazione futura |
| Forma degli errori | `{ok:true} \| {ok:false, error:string}` — stringa singola, nessuna coordinata (R-B) |
| Chiamanti | 5: i 4 pannelli di authoring + `irCreationSeed`. Zero nel render (R-B9-bis) |
| Voce ⚠️ ibridi | **Confermata ed estesa**: anche «un capo senza `reference`», non nominato dalla voce |
| Snippet sm_ir_testbed | **Esiste**: `docs/archivio/artefatti/claude_snippet_2026-07-21_sm_ir_testbed_viewpoint.js` |
| Creazione programmatica | `DViewPoint.newVP(name, cb, persist, id)` → `DViewElement.new2(name, jsx, vp, cb, persist, id)` con `d.ir` nella callback (gira **prima** di persist) → `activateViewpoint(id)` |
| §3.3 | **Si applica**: `.end()` → `Constructors.persist` apre TRANSACTION. Ciclo nudo, mai TRANSACTION esterna |
| §9 | **Non si applica**: l'id di `new2` è assegnato nel costruttore ed è definitivo |
| `EnableIRPanel` scrive | **solo** `view.ir = seed` (`:107`), previa guardia di non-sovrascrittura e `validateIR`. Nessun pin, nessun `appliableToClasses` |
| Enumerazione per l'export | `state.viewelements` filtrata su `d.viewpoint === vp` (`irResolveCore.ts:110-115`). Mai `subViews`; gerarchia via `collectViewSubtree` |
| Campo `ir` sul D-layer | `view.tsx:209`, `ir?: GObject`, additivo, serializzazione generica, nessun VersionFixer |
| Jjodie | `JodieWindow` è un guscio; orchestrazione in `Jodie.tsx`; registry `LanguageProvider` esiste ma non è ancora la sede del routing; RAG = `JjodieRagService` + `JjodieContextService`; provider system in `types/jodie.ts` (`AIConfig`), **non** in `src/ai/`, e `useAIProviderPreference` non esiste |
| New Viewpoint | `NewViewpointDialog` (name + type su 5 valori) → `ProjectEditor.handleCreateViewpoint` → `newVP` + booleani legacy + `viewpointType` → `DockManager.openViewpoint`. Nasce vuoto |
| Superfici viewpoint | ProjectEditor lista (3 bottoni già montati) · Tree `ViewpointNode` (1 slot azione) · Toolbar select (nessuna) · File → Export (`U.download`) |
