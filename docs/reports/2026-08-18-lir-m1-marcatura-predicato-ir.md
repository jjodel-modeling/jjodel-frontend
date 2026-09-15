# Layer Impact Report — M1: la marcatura come predicato dell'interprete IR (Fase 2)

**Tipo**: Layer Impact Report (CLAUDE.md §3.2), obbligatorio prima del diff per R-MK-9.
**Base**: branch `alfonso-frontend-jjtl`, HEAD `28da8c815`, working tree pulito all'avvio
(`git status --short` vuoto).
**Governanti**: R-MK-1..R-MK-11 (`docs/decisions.md:803-918`, con gli aggiornamenti del 2026-08-18).
**Materiale di partenza**: sezione «Materiale per il Layer Impact Report» del report di Fase 1
(`docs/discovery/discovery_2026-08-18_m1_marcatura_predicato_interprete.md`), verificata durante
la lettura dei sorgenti e aggiornata dove la lettura ha aggiunto informazione.
**Fetta**: due commit — M1a (deposito: operatore, canali, `isMarked`) e M1b (consumo: canale
innestato nella risoluzione e nella decorazione).

---

## Baseline misurate prima del diff

| Gate | Comando | Valore |
|---|---|---|
| typecheck | `npx tsc --noEmit`, output integrale, `command grep -c "error TS"` | **33** (baseline dichiarata) |
| test editor-v2 | `npx vitest run --root frontend src/components/editor-v2` | **20 file, 399 passed, 0 failed** |
| test suite intera | `npx vitest run --root frontend` | **1284 passed**, 9 file rossi noti (`window is not defined`), 49 verdi su 58 |

Conteggi presi su output completo, mai su una finestra `tail`/`head` (CLAUDE.md §5).

---

## Layer toccati

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)      — in LETTURA, solo M1b
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] Interprete IR (compile / ReadCtx / resolve)  — non è una riga del template, è il soggetto
```

### D-layer (Redux raw data) — NON toccato

- **Cosa cambia**: nulla. Nessuna azione, nessun creator, nessun `SetFieldAction`,
  `SetRootFieldAction`, `DeleteElementAction`, nessuna `TRANSACTION`, nessun
  `DVertex.new` / `DVoidEdge.new2` / `new3`. Le regole §3.3 non hanno superficie su cui applicarsi.
- **Cosa NON cambia**: tutto. La sorgente della marcatura è il singleton di modulo
  `sim/simRunState.ts` (R-SIM-1), che per costruzione sta fuori Redux: niente history, niente
  socket collaborativo, niente persistenza.
- **Interazione cross-layer**: `isMarked` legge un `Set` in memoria, non `state.idlookup`.
- **Sicurezza rispetto agli altri layer**: un bump di marcatura non produce nessuna azione
  dispatchata, quindi non attraversa reducer, undo, o `Collaborative`.

### L-layer (proxy) — NON toccato in scrittura, e nemmeno in lettura

- **Cosa cambia**: nulla. `isMarked` **non** passa dai proxy L. Sul backend lproxy è una delega
  strutturale al backend draw, esattamente come `isKindOf` e `getRef`
  (`irReadCtxLproxy.ts:45-48`, criterio dichiarato nel commento `:42-44`).
- **Cosa NON cambia**: `getValue` / `getValues` restano gli unici metodi con coercizione L.
- **Interazione cross-layer**: `marked.path` risolve con `ctx.getRef` (R-MK-10), che è
  draw-semantic su entrambi i backend. È la ragione per cui **non** eredita il difetto di
  `isKind` con `path` (discovery Q7/R3), che legge il terminale con `ctx.getValue`.
- **Sicurezza**: `isKind` non viene toccato. Il suo difetto resta registrato in
  `docs/TECH-DEBT.md` e la micro-slice di convergenza parte solo dopo la verifica in console
  di Alfonso (R-MK-10).

### JjOM — NON toccato

Nessuna entità di modello creata, letta per scrittura o modificata.

### Canvas v2-flow (ReactFlow) — toccato IN LETTURA, solo nel commit 2

- **Cosa cambia**: `useIRContainment` acquisisce una dipendenza in più nel `useMemo` di
  decorazione (`useIRContainment.ts:189`), **gated** sul canale dichiarato dall'indice. Quando il
  canale è dichiarato, un bump di marcatura fa girare la passata di decorazione, che restituisce
  array **nuovi** di `nodes` / `edges`.
- **Cosa NON cambia**: la passata di decorazione è la stessa che già gira per `collapseVersion` e
  `edgeInteractionVersion`; nessuna logica di decorazione è modificata, nessun nodo o edge nuovo è
  sintetizzato, nessuna scrittura verso il canvas o verso il modello è introdotta.
- **Interazione cross-layer**: il pattern è precedente (due canali di questa forma esistono già);
  **cambia la frequenza**: uno step di simulazione contro un toggle manuale dell'utente.
- **Sicurezza**: se nessuna view dichiara `marked`, l'espressione di gate vale `0` costante e la
  lista di dipendenze è **identica byte a byte** al comportamento odierno. È la clausola
  restrittiva di spec §9 resa operativa, non una promessa.

### Canvas classic — NON toccato

Nessun file del resolver classic nel diff.

### Sync layer (`useJjomSync`, `useM1ReferenceEdges`, `canvasToJjom`) — NON toccato

Fuori perimetro per R-MK-9: è M3 (migrazione del canale `container`) a entrarci, con la propria
discovery e il proprio Layer Impact Report.

### Persistenza (VersionFixer / jsxString) — NON toccata

- Le view IR non hanno VersionFixer (R-B9), e non ne acquisiscono uno qui.
- `marked` è **additivo**: un ir che non lo dichiara compila come oggi, non raccoglie canali, e il
  campo `channels` resta **assente** (non vuoto) sul `Compiled*`.
- Nessun file di `defaultViewTemplate.ts` / `DV.tsx` nel diff, quindi §3.9 non si applica.

---

## Deroghe dichiarate alla regola 11 (interfacce esportate)

### 1. `ReadCtx.isMarked` — metodo OBBLIGATORIO (deroga, come prescritto da R-MK-4)

`ReadCtx` (`irReadCtx.ts:17-32`) è un'interfaccia esportata e la regola 11 ammette solo
l'aggiunta di **proprietà opzionali**. `isMarked(elementId: string): boolean` è dichiarato
obbligatorio. È la lettera di R-MK-4 («Semantica totale — non marcato è `false`, mai `null`») e la
deroga si dichiara qui invece di prendersi in silenzio.

Perché è sicura, misurato:

- **Implementor strutturali in-repo: due**, entrambi aggiornati nello stesso commit.
  `: ReadCtx = {` / `satisfies ReadCtx` / `as ReadCtx` → **0** occorrenze; controllo positivo con
  la stessa forma di comando, `ReadCtx` in `frontend/src` → 84 righe. Le sole fabbriche sono
  `makeDrawReadCtx` (`irReadCtx.ts:129`) e `makeLproxyReadCtx` (`irReadCtxLproxy.ts:19`).
- **Le annotazioni di parametro `: ReadCtx` sono controvarianti**: un metodo in più non le tocca.
- **I due doppi di test sopravvivono**: `ir.test.ts:201` e `:696` sono spread di un contesto
  completo (`{...makeDrawReadCtx(...), getValue: ...}`), quindi ereditano il metodo nuovo, e sono
  passati con `as any` ai call site.
- **Nessun consumatore fuori dal repo.**

Alternativa scartata: `isMarked?:` con i chiamanti difensivi, che reintrodurrebbe il rischio di un
backend che se ne dimentica senza errore di compilazione.

### 2. `Predicate` — ramo nuovo nell'unione (additivo, nessuna deroga)

`{ op: 'marked'; path?: PathExpr }` accanto a `isKind`. Additivo per i produttori. Per i
consumatori l'unione è esaustiva solo se qualcuno fa un `never`-exhaustiveness check: verificato
in Fase 1 che **nessuno dei quattro siti di dispatch** su `Predicate.op` lo fa, quindi nulla si
rompe a compile.

### 3. `CompiledView` / `CompiledEdgeView` / `CompiledRowView` — `channels?: string[]` OPZIONALE

Nessuna deroga: campo opzionale, per la lettera della regola 11 e per il precedente della slice 2a
(nota 2 della entry di log 2026-08-17 17:35), esplicitamente confermato dall'emendamento R-MK-5.

### 4. `IRViewpointIndex.channelsInUse` — OPZIONALE, per la regola 11

Il prompt lo annota senza `?`. Come nella 2a, la regola 11 prevale sulla lettera del prompt: il
campo nasce `channelsInUse?: ReadonlySet<string>`, **sempre popolato** dall'unico costruttore in
repo (`getIRIndex`, `irResolveCore.ts:224`; misurato: nessun altro literal `IRViewpointIndex` in
`frontend/src`, nemmeno nei test), e letto con `?.` nei tre siti di consumo. La deroga alla regola
11 resta quindi **una sola**, quella ratificata da R-MK-4.

---

## Interfaccia `ReadCtx`: la forma dell'iniezione, e la purezza di `irReadCtx.ts`

R-MK-4 aggiornata fissa la forma. Verificata riga per riga contro il codice:

- `makeDrawReadCtx(idlookup, isMarked: (id: string) => boolean = () => false)`. Il default `false`
  è confinato alle costruzioni dirette del draw, che sono **solo nei test** (misurato: 26 chiamate
  a `makeDrawReadCtx`, tutte in `__tests__/` tranne quella interna a `makeLproxyReadCtx`).
- **`irReadCtx.ts` resta a zero import.** È la ragione dello split con `irReadCtxLproxy.ts`
  (dichiarata a `irReadCtxLproxy.ts:1-6`): il draw deve restare importabile nell'env node dei test,
  dove il joiner trascina monaco e `window`.
- L'unico punto di iniezione è `irReadCtxLproxy.ts`, **già impuro** (importa il joiner a `:8`).
  Importa `isSimActive` da `../../sim/simRunState` e lo inietta in entrambi i backend.
- **I 6 siti di chiamata di `makeReadCtx` non si toccano**: `irResolve.ts:85`, `irResolve.ts:142`,
  `useIRContainment.ts:123`, `IRNodeContent.tsx:142`, `EditorV2.tsx:171`, `EditorV2.tsx:967`.
  Nessuno di questi file entra nel diff per questa ragione.

---

## Il rischio che questa fetta esiste per non correre (R1 della discovery)

Il `dependencySet` delle view di **nodo** e di **riga** è un dead write: unica lettura applicativa
in produzione `useIRContainment.ts:87`, e solo per il bucket object-as-edge. Un `channels`
depositato accanto a esso sarebbe **corretto nella forma e inerte nell'effetto**.

Conseguenza operativa accettata e dichiarata:

- il **commit 1 è inerte per costruzione**. Un test che asserisce `compiled.channels` contiene
  `'mark'` passa senza che la feature funzioni;
- l'effetto arriva solo col **commit 2**, e i test del commit 2 asseriscono il **consumo**
  (`channelsInUse` sull'indice e la semantica del gate), non il deposito;
- la verifica finale è a schermo, con i cinque scenari qui sotto. Il commit 1 non è dichiarato
  «funzionante»: è dichiarato depositato.

---

## Scenari di smoke potenzialmente affetti

I cinque della sezione LIR del report di Fase 1, da eseguire da Alfonso su
`http://localhost:3001/` con hard-refresh:

1. **Caso principe (percorso gratuito)** — vertex view su `State` con
   `fill: { when: {op:'marked'}, then: '#ef4444', else: '#e2e8f0' }`; Reset + Step dal
   `SimulationPanel`. Atteso: **solo il colore cambia**. Controllo che sia colore e non modello:
   `windoww.store.getState().idlookup[<objectId>]` invariato prima/dopo, e Ctrl+Z dopo dieci step
   non annulla gli step.
2. **Caso che oggi non funziona (misura l'innesto in `useIRView`)** — `marked` nel `predicate` di
   applicabilità di due view concorrenti sulla stessa metaclasse, priorità diverse. Atteso: lo
   step cambia **quale view** rende il nodo.
3. **Caso edge (misura l'innesto in `useIRContainment`)** — object-as-edge `Transition` con
   `line.color` condizionato su `{op:'marked'}`. Atteso: la linea cambia colore allo step.
4. **Non-regressione dei viewpoint che non autorano `marked`** — canvas identico, `sim-active`
   continua a funzionare (R-MK-8).
5. **Compatibilità del pregresso** — un ir salvato prima di M1 compila e rende identico.

---

## Verifica anti-regressione dovuta prima del commit 2

Conteggio delle risoluzioni per bump su un canvas denso, con un `console.time` **temporaneo** su
`resolveIRView`, rimosso dal diff committato (CLAUDE.md §2: nessuna strumentazione nel commit).

`compileCache` / `edgeCompileCache` / `rowCompileCache` / `indexCache` reggono **per costruzione**
(R8 della discovery): memoizzano la **closure** compilata, non il valore del predicato, e
`isMarked` è letto a ogni invocazione. **Nessuna cache va invalidata su un bump di marcatura**, e
nessuna riga di invalidazione entra nel diff.

---

## Propagazione a layer non nominati dal prompt

Nessuna (regola 20). Il perimetro dichiarato dal prompt è chiuso: nessun file di D-layer, L-layer,
sync, view classic o JjOM entra nel diff. `ObjectNode.tsx` entra per **una sola riga di commento**,
dichiarata nel prompt (R5 della discovery) e senza alcuna modifica di comportamento.

**Incertezza sulla propagazione**: nessuna che giustifichi uno stop. L'unico punto non misurabile
in repo è il costo in millisecondi del re-render per bump su un progetto reale, che richiede il
browser e il progetto di Alfonso: è dichiarato come non misurato, non stimato.

---

## Espansione di perimetro trovata durante il diff (regola 20) — dichiarata, non silenziosa

**File**: `frontend/src/components/ui/PredicateBuilder/PredicateBuilder.tsx`, **non** nell'elenco
del prompt, che anzi lo esclude esplicitamente («Niente UI di authoring: `PredicateBuilder` è M2»).
**Entità**: una riga, di soli tipi.

**Che cosa è successo, misurato.** Aggiunto il ramo `{ op: 'marked' }` a `Predicate`, `npx tsc
--noEmit` è passato da **33** a **39**: sei errori nuovi, tutti in `PredicateBuilder.tsx`
(`:299,300,303,309,310,313`), della forma
`Property 'left' does not exist on type '{ op: "lt" | "eq" | ... } | { op: "marked"; path?: string }'`.

**Perché la Fase 1 non l'ha visto.** Il report di discovery aveva verificato che nessuno dei
quattro siti di dispatch su `Predicate.op` usa un `never`-exhaustiveness check, e ne aveva
concluso «nessuno rompe a compile». È vero sull'exhaustiveness e falso sul **narrowing**: il ramo
`default:` di quello switch (`:291`) non enumera nulla, quindi il tipo che TypeScript gli assegna
è il **residuo** dell'unione — fino a ieri i soli sei comparatori, che `left`/`right` ce l'hanno.
Un ramo nuovo senza `left`/`right` entra in quel residuo e rompe i sei accessi.

**Perché non è aggirabile restando nel perimetro.** Qualunque ramo nuovo privo di `left`/`right`
produce lo stesso effetto; l'unica alternativa dentro il perimetro sarebbe dare a `marked` dei
campi `left`/`right` fittizi, cioè corrompere lo schema per compiacere un componente di UI. E il
gate non è negoziabile: con 39 errori non è committabile **niente** della fetta, né M1a né M1b.

**Che cosa è stato fatto.** Il residuo del `default` è **fissato** al ramo dei comparatori:

```typescript
const c = value as Extract<Predicate, { left: PathExpr | Literal }>;
```

- **Solo tipi**: `as` è erasa al build. Il bundle non cambia di un byte.
- **Comportamento preservato**: un operatore che il builder non conosce continua a rendere due
  `OperandEditor` su operandi assenti — esattamente il comportamento odierno descritto in Q5 della
  discovery, né migliorato né peggiorato.
- **Nessuna capacità di authoring aggiunta**: `'marked'` non entra in `PREDICATE_KIND_OPTIONS`, il
  Select non lo propone, `forPredicateKind` non lo produce. Lo scopo del divieto di R-MK-9 — «un'UI
  che autora un operatore non ancora compilato salva IR che non rende» — resta intatto, e in ogni
  caso in M1 l'operatore *è* compilato.
- Il commento a codice dichiara la ragione e indica M2 come la fetta che ritira il pin.

**Registrato**: qui, nel messaggio del commit 1, nel report di chiusura in chat, e nella entry di
log con `Out-of-scope changes: yes` e `Causa: (c)`.
