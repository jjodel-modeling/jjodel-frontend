# Fase 0 — verifica mirata prima del seed IR alla creazione

**Data**: 2026-08-13 18:00
**Tipo**: verifica read-only, quattro punti. Propedeutica a C2/C3 della slice 1 R-IRN.
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Documento prompt**: 2026-08-13 18:00

Report sintetico, non una discovery: risponde alle quattro domande che decidono la sede del
wiring e la forma del seed. La discovery estesa a monte è
`docs/discovery/discovery_2026-08-13_view_creation_sites_ir_native.md`.

**Esito complessivo: nessuna STOP condition raggiunta.** C3 può usare la **Preferenza 1**
(wiring dentro `newDefault`).

---

## Pre-check del prompt

| Verifica | Comando | Esito |
|---|---|---|
| Report della discovery grande presente | `ls docs/discovery/discovery_2026-08-13_view_creation_sites_ir_native.md` | presente, 45584 byte, untracked |
| Serie R-IRN non ancora a registro | `command grep -n "R-IRN" docs/decisions.md` | exit 1, zero hit |
| Nome del modulo libero | `command grep -rn "irCreationSeed\|computeCreationSeed" --include='*.ts' --include='*.tsx' .` | exit 1, zero hit |

Controllo positivo sulla terza grep (asserzione di assenza, CLAUDE.md §5):
`command grep -rln "irDefaults" …` → 5 file. La ricerca ha segnale.

---

## Punto 1 — Grafo di import: nessun ciclo possibile

Chiusura transitiva completa delle dipendenze del seed, enumerata riga per riga:

| File | Import |
|---|---|
| `irDefaults.ts` | `./irCompile` (`:19`), `./irTypes` (`:20`, type-only) |
| `metaclassPin.ts` | `./irTypes` (`:25`, type-only) |
| `irValidate.ts` | `./irCompile` (`:13`), `./irTypes` (`:14`, type-only) |
| `irCompile.ts` | `./irTypes` (`:33`, `:339`), `./irReadCtx` (`:34`, type-only), `./pathExpr` (`:35`) |
| `irTypes.ts` | `./irReadCtx` (`:353`, type-only) |
| `irReadCtx.ts` | **nessuno** |
| `pathExpr.ts` | `./irTypes` (`:18`, type-only) |

**Sette file, tutti in `frontend/src/components/editor-v2/viewpoint/ir/`, ogni import è
relativo `./`. Zero import fuori dalla cartella**: niente React, niente Redux, niente
`joiner`, niente `view/`. La catena termina su `irReadCtx.ts`, che non importa nulla.

Conseguenza: `view/viewElement/view.tsx` che importa `irCreationSeed.ts` **non può creare un
ciclo**, perché nessun anello della chiusura risale verso `view.tsx` o `joiner/classes.ts`.
Vale identicamente per `utils/lastViewpoint.ts` (C2), che peraltro importa già da
`components/` (`../components/Toast/toastDispatch`, `:8`): la direzione utils → components è
precedente stabilito.

**Decisione: C3 usa la Preferenza 1** — seed dentro `newDefault`, nella callback di `new2`.
La Preferenza 2 (call site in `ContextMenu.tsx`) non serve, e con essa cade il residuo di
`jsxString` che avrebbe comportato.

Nota di direzione architetturale, non un blocco: `view.tsx` non importa oggi da `components/`
(i suoi 8 import stanno in `joiner`, `DSL`, `model`, `utils`, `react`). Questo seed introduce
la prima dipendenza `view/` → `components/editor-v2/`. È accettabile perché il target è un
modulo puro per contratto — la stessa proprietà che `metaclassPin.ts:19-22` si dichiara
esplicitamente («Pure by contract, on the model of pathExpr.ts: no React, no Redux, no runtime
import from editor-v2») — ma va messo agli atti: se un domani qualcuno aggiunge un import di
Redux dentro `irDefaults.ts` o `irCompile.ts`, il ciclo si apre da lì, non da qui.

---

## Punto 2 — Forma del pin, e il caso degli enumeratori

**Tipo** (`irTypes.ts:139`):

```ts
export type AuthoringMetaclassPins = { [metaclassName: string]: string };
```

Presente, opzionale e additivo, su tutti e tre i kind autorabili: `VertexViewIR` (`:147`),
`EdgeViewIR` (`:211`), `RowViewIR` (`:254`).

**Forma esatta che `withMetaclassPins` scrive** (`metaclassPin.ts:135-148`), letta e non
dedotta:

```ts
const pins: AuthoringMetaclassPins = {};
for (const name of list) {
    const hit = resolveMetaclassId(name, { ...ctx, pins: prev.authoringMetaclassPins });
    if (hit) pins[name] = hit.id;          // nome della metaclasse -> pointer id
}
if (Object.keys(pins).length === 0) {      // :142-146
    // la CHIAVE viene rimossa dall'oggetto, mai scritta come {} né come undefined
}
```

La regola del drop della chiave è normativa (commento `:125-127`: «An empty result drops the
KEY instead of writing `{}` or `undefined`, keeping the ir byte-identical to one authored
without any pin»). Il seed la replica.

### Il tipo non è vincolato a `DClass`, ma la catena di risoluzione sì

Il prompt prevedeva la contingenza «se il tipo è vincolato a pointer di `DClass`, per
`DEnumerator` seminare senza pin». Il tipo è un dizionario `string → string`, quindi non
vincolato. **La conclusione operativa però è la stessa, per un'altra via.**

`resolveMetaclassId` (`metaclassPin.ts:74-91`) guarda ogni passo della catena con

```ts
const declared = (id: string) => candidates.some((c) => c.id === id);   // :80
```

e `candidates` è, in tutti e tre i pannelli, `getMetaclassInfo(mm.id, mm.id).allClasses`
(`VertexAuthoringPanel.tsx:107-117` e gemelli). `allClasses` è costruito da
`useEditorMode.ts:275-296` leggendo `container.classes ?? container.classifiers` sull'oggetto
**D** — e nel D-layer `DPackage.classes` è `Pointer<DClass>[]` (`LModelElement.tsx:1741`),
mentre gli enumeratori stanno in una collezione separata `enumerators`
(`LModelElement.tsx:1742`). `classifiers` esiste solo sul proxy L (`:1805`), non sul D, quindi
il fallback non scatta mai su un `DPackage` raw.

**`allClasses` contiene quindi solo `DClass`.** Un pin scritto con l'id di un `DEnumerator`
verrebbe respinto da `declared()` a ogni lettura, la catena cadrebbe comunque sul match per
nome, e il campo resterebbe scritto ma inerte: peggio che assente, perché mente sulla propria
autorità.

**Deciso per C2**: il ramo enumeratore semina `metaclasses: [elementName]` e **nessun pin**.
Il tipo non viene esteso, `allClasses` non viene toccato.

**Osservazione registrata, fuori dallo scope della slice**: una view IR vertex con
`metaclasses: ['NomeEnum']` non matcha nulla a runtime, perché il resolver è interrogato da
`ObjectNode` su `data.instanceOfClassId` e un enumeratore non è instanziato come `DObject` in
M1. Il seed sull'enumeratore rende quindi la view coerente nella superficie di authoring (il
tab Applies to mostra il nome giusto invece del wildcard) ma non produce pixel. È lo stesso
esito di oggi, dove la view resta senza `ir` e non rende comunque: nessuna regressione, nessun
guadagno. Se serva un kind per gli enumeratori è una domanda separata, non aperta qui.

---

## Punto 3 — `newDefault`: ritorno, e dove innestare il seed

`DViewElement.newDefault(forData?, forSelf = false)` — `view/viewElement/view.tsx:315-361`.

| Domanda | Risposta |
|---|---|
| Cosa ritorna | `DViewElement`, cioè l'oggetto **D grezzo** restituito da `new2` (`:355`), non un proxy L |
| Dove viene assegnato `jsxString` | **Non nella callback.** È il 2º argomento posizionale di `new2` (`:355`), calcolato in `const jsx = DEFAULT_VIEW_JSX_STRING` a `:317` |
| Cosa fa la callback oggi | `d.css`, `d.palette`, `d.css_MUST_RECOMPILE`, `d.oclCondition` (`:356-359`) — assegnazioni dirette sul D grezzo |
| La callback gira prima o dopo la persistenza | **Prima.** `Constructors.end(cb)` chiama `simpledatacallback(this.thiss, this)` a `joiner/classes.ts:683` e solo dopo `Constructors.persist(this.thiss)` a `:688` |

Ne segue che `d.ir = seed` dentro la callback finisce nell'oggetto persistito: **la view nasce
con l'`ir`, senza una seconda action**. È esattamente il pattern che `irDemoFixture.ts` usa
già (`:106`, `:112`: `(d as any).ir = baseViewIR(...)` dentro la callback di `new2`).

Per far nascere le view seedate con `jsxString = ''` basta rendere condizionale la costante di
`:317`: il seed va calcolato **prima** della chiamata a `new2`, perché il suo esito decide sia
il 2º argomento sia il contenuto della callback. Una sola chiamata, nessuna action aggiuntiva.

Nome e id sono già letti a `:348-349` (`let l = forData && L.from(forData); if (l?.name) …`):
la cattura dal proxy avviene prima di qualunque altra operazione, come vuole la regola
generale del prompt.

---

## Punto 4 — `validateIR` accetta tutti i seed di riferimento

**Dove vive**: `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts:28`,
`validateIR(viewId, ir): {ok:true} | {ok:false, error}`.

**Cosa valida**, in due tempi:
1. vocabolario chiuso di `edge.routing` (`:33-41`) — `'orthogonal' | 'straight' | 'curved'`,
   con l'assenza della chiave deliberatamente ammessa come default;
2. il compilatore strutturale reale (`compileEdgeView` / `compileRowView` / `compileView`,
   `:43-50`), che lancia su `PathExpr` e predicati invalidi. La validazione scalda anche la
   cache di compile, keyed `(viewId, irHash)`.

**Misura eseguita**, non dedotta. Probe vitest usa-e-getta in
`viewpoint/ir/__tests__/__fase0probe.test.ts`, eseguito con
`npx vitest run …/__fase0probe.test.ts` e **cancellato subito dopo** (mai committato):

| Seed provato | Esito |
|---|---|
| vertex, `{...defaultObjectViewIR(), metaclasses:['State'], label}` | `ok: true` |
| vertex, `metaclasses: '*'` (fallback wildcard) | `ok: true` |
| row, letterale di `EnableIRPanel` verbatim (`metaclasses: []`, `template:[{from:'intrinsic',prop:'name'}]`) | `ok: true` |
| edge, `{...defaultEdgeViewIR(), metaclasses: []}` | `ok: true` |
| edge, `{...defaultEdgeViewIR(), metaclasses: ['State']}` | `ok: true` |
| vertex ed edge **con `authoringMetaclassPins`** | `ok: true` entrambi |

```
Test Files  1 passed (1)
      Tests  6 passed (6)
```

**Nessuna STOP condition**: `EnableIRPanel` non scrive un IR invalido, e i seed sono
replicabili così come sono. L'ultima riga della tabella è un'aggiunta mia al perimetro chiesto:
serviva accertare che il pin, che il pannello non scrive mai al momento dell'enable, non faccia
inciampare il compilatore quando lo scrive il seed. Non lo fa.

---

## Riepilogo delle decisioni che questa Fase 0 chiude

1. **C3 usa la Preferenza 1**: seed dentro `newDefault`, callback di `new2`, `jsxString = ''`
   sui casi seedati. Nessun residuo da annotare.
2. **Il pin si scrive** come `{ [nome]: id }`, e **la chiave si omette** quando non c'è nulla
   da scrivere.
3. **Gli enumeratori ricevono il nome ma non il pin**, perché `allClasses` non li contiene e il
   pin sarebbe respinto a ogni lettura.
4. **I seed passano `validateIR`**, pin incluso.

## Limiti

- Il probe del punto 4 gira in ambiente `node` con `environment: 'node'` (vitest.config.ts:14)
  e non tocca lo store: verifica la validità strutturale dell'IR, non il comportamento a
  runtime del resolver. Il match effettivo delle view seedate è oggetto della verifica visiva
  degli hard stop, non di questa fase.
- Il punto 2 conclude sull'assenza degli enumeratori da `allClasses` leggendo le due strategie
  di raccolta di `useEditorMode.ts` (`:275-296` raw, `:322-356` fallback LProxy) e la
  dichiarazione D di `DPackage` (`LModelElement.tsx:1741-1742`). Non ho eseguito
  `getMetaclassInfo` su un metamodello reale con enumeratori.
