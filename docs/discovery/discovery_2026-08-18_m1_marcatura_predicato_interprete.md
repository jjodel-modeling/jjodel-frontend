# Discovery 2026-08-18 — M1: la marcatura come predicato dell'interprete IR (Fase 1, read-only)

**Tipo**: discovery read-only (Fase 1 di RC-3, corsia completa). Nessuna modifica a file sorgente.
**Base**: branch `alfonso-frontend-jjtl`, HEAD `e8caceaca` («docs: M1 phase-1 discovery prompt»),
working tree pulito all'avvio.
**Governanti**: R-MK-1..R-MK-9 (`docs/decisions.md:803-869`), memo
`docs/ratifiche/claude_2026-08-18_memo_ratifica_marcatura_predicato_ir.md`, coordinamento R-J5 /
R-B14 / R-B16 (`decisions.md:775-786`, `:161-168`, `:177-186`).
**Obiettivo**: rispondere alle nove domande del prompt con citazione file:riga, perché la Fase 2
(implementazione M1) si scriva su fatti misurati e non su premesse.

---

## Sintesi in cinque righe

1. **Il `dependencySet` delle view di nodo e di riga non ha nessun consumatore in produzione.**
   L'unico lettore è `useIRContainment.ts:87`, e legge solo quello delle **edge view
   object-as-edge**. Un `channels` modellato «come `dependencySet`» erediterebbe una tubatura
   che per i nodi è già un dead write (Q1).
2. **Il canale `mark` sui nodi è già agganciato, per accidente.** `ObjectNode.tsx:195` chiama
   `useSimVersion()` incondizionatamente e in tutto `editor-v2` non esiste un `React.memo`: un bump
   re-renderizza ogni `ObjectNode` e, con lui, `IRNodeContent`, che rivaluta `form`/`fill`/label a
   ogni render. R-MK-6 non aggiunge costo ai **conditional**; lo aggiunge alla **risoluzione**
   della view e agli **edge**, che quel bump non lo vedono (Q2, Q3).
3. **`isMarked` costringe a toccare due soli file** (`irReadCtx.ts`, `irReadCtxLproxy.ts`): non
   esiste nessun altro implementor strutturale di `ReadCtx`, e i due doppi di test sono spread di
   un contesto completo, quindi sopravvivono. Il vincolo vero non è il conteggio ma la **purezza**
   di `irReadCtx.ts`, che oggi non ha nemmeno un import (Q4).
4. **Oggi `{op:'marked'}` non «passa»: fa saltare l'intera view.** Misurato eseguendo il
   compilatore: `TypeError: Cannot read properties of undefined (reading 'split')`, intercettato da
   `getIRIndex` che scarta la view con un warn, e da `validateIR` che con quell'errore **blocca
   ogni commit successivo del pannello di authoring** (Q6).
5. **`marked.path?` non può copiare `isKind` verbatim.** Il ramo `path` di `isKind`
   (`irCompile.ts:156-161`) legge il terminale con `ctx.getValue`, che sul backend di produzione
   (`lproxy`) su una reference restituisce un proxy L e non un pointer: `typeof target === 'string'`
   è falso e il predicato torna sempre `false`. I test lo mancano perché girano sul backend `draw`
   (Q7, R3).

---

## Metodo, e i controlli positivi

Tutte le ricerche con `command grep` (BSD grep 2.6.0-FreeBSD, verificato con
`command grep --version`) per bypassare il wrapper `ugrep --ignore-files` della shell
(`type grep` → «shell function»; CLAUDE.md §5). `--include` è usato **solo** con `command grep`,
dove filtra davvero.

Ogni asserzione di assenza porta il proprio controllo positivo, dichiarato in linea. Due note di
metodo prodotte da questa sessione:

- **Un controllo positivo sbagliato per differenza di maiuscole.** Cercando `React.memo` in
  `editor-v2` ho usato `useMemo(` come controllo: **non ha segnale**, perché `useMemo` contiene
  `Memo(` e non `memo(`. Il sospetto di un grep rotto era infondato e la sonda l'ha mostrato
  (`memo` → 0, `Memo(` → 2, `emo(` → 2 sullo stesso file). Controllo rifatto con la **stessa forma
  di comando su uno scope più largo**: `memo(` in `frontend/src` → **21** occorrenze (prima riga
  `jjscript/components/JjScriptOutput.tsx:19`), in `frontend/src/components/editor-v2` → **0**.
  Quello sì ha segnale, e la conclusione «nessun `React.memo` in editor-v2» regge.
- **`exit=$?` dopo una pipe misura l'ultimo comando.** Ripreso dalla discovery del 17/8 e
  rispettato: ogni conteggio di questo report è preso con `wc -l` o `grep -c`, mai leggendo
  l'exit status a valle di `head`.

**Misure eseguite** (non lette):

- Il compilatore IR è stato **eseguito** su predicati con `op` sconosciuto. `irCompile.ts`,
  `irTypes.ts`, `pathExpr.ts`, `irReadCtx.ts` sono stati copiati in scratchpad (repo intatto), i
  soli specificatori di import relativi riscritti con estensione `.ts`, e caricati con
  `node --experimental-strip-types` (node v23.3.0). Nessun file di test scritto, nel repo o fuori:
  è una sonda usa-e-getta, coerente col divieto della Fase 1.
- Baseline test riprodotta: `npx vitest run` → **1284 passed**, 9 suite rosse note
  (`window is not defined`, es. `src/utils/__tests__/UDComparator.test.ts` via
  `PerformanceMetrics.ts:220`); `npx vitest run src/components/editor-v2` → **20 file, 399
  passed**. Il 394 citato dal prompt è la baseline della slice **2a**; la 2b ha aggiunto 5 test in
  `irValidate.test.ts` (394 + 5 = 399), quindi il numero corrente per il sottoinsieme editor-v2 è
  **399**, non 394.
- `import('react')` in node ESM puro dalla cartella `frontend`: `useSyncExternalStore` è
  `function`, react **18.3.1**.

---

## File letti (con range)

Interprete IR (`frontend/src/components/editor-v2/viewpoint/ir/`):
- `irTypes.ts` — intero (450 righe); in dettaglio :17, :24-36, :51-54, :230, :304-323, :325-351,
  :353-371, :373-397, :399-403
- `irCompile.ts` — intero (479 righe); in dettaglio :37-64, :66-109, :111-123, :125-184, :186-205,
  :225-232, :234-340, :342-367, :369-428, :430-472, :474-479
- `irReadCtx.ts` — intero (165 righe)
- `irReadCtxLproxy.ts` — intero (54 righe)
- `pathExpr.ts` — intero (84 righe)
- `irCrossDeps.ts` — intero (209 righe)
- `irValidate.ts` — intero (85 righe)
- `irResolve.ts` — intero (152 righe)
- `irResolveCore.ts` — intero (394 righe)
- `useIRContainment.ts` — intero (190 righe)
- `IRNodeContent.tsx` — :1-175 (compilazione della testa del componente, `compartmentSig`,
  `rowChildSig`), più :191-220 (applicazione inline di `fill`)

Simulazione e canvas:
- `frontend/src/components/editor-v2/sim/simRunState.ts` — intero (90 righe)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` — :44-123, :180-210, :402, :457, :665
- `frontend/src/components/editor-v2/problems/useNodeProblems.ts` — :20-32
- `frontend/src/components/editor-v2/EditorV2.tsx` — :160-180 (`isIREdgeLayoutPersistable`),
  :950-1000 (propagazione dimensione)

Authoring (letto per Q5, non toccato):
- `frontend/src/components/ui/PredicateBuilder/PredicateBuilder.tsx` — intero (335 righe)
- `frontend/src/components/ui/PredicateBuilder/predicateDefaults.ts` — intero (96 righe)
- `frontend/src/components/ui/PathBuilder/PathBuilder.tsx` — :20-145
- `frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx` — :85-210
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` — :100-180
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` — :28-40,
  :160-210

Core (letto in sola lettura, per Q7):
- `frontend/src/model/logicWrapper/LModelElement.tsx` — :7290-7330 (`LValue.get_values`, mapper dei
  valori di reference)

Test e configurazione:
- `frontend/vitest.config.ts` — intero (18 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/edgeAuthoring.test.ts` — :1-45
  (intestazione: convenzione di import-safety)
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` — :196-264, :688-712
  (doppi `lproxyLike`), più scansione dei riferimenti a `dependencySet`
- listato di `viewpoint/ir/__tests__/` (12 file)

Spec e governance:
- `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` — intero (228 righe)
- `docs/spec/spec_2026-06-08_ir_schema_v1_1.md` — :33-48 (§2), :49-99 (§3.1-3.4)
- `docs/decisions.md` — :1-32, :126-190, :700-870
- `docs/ratifiche/claude_2026-08-18_memo_ratifica_marcatura_predicato_ir.md` — intero
- `docs/discovery/discovery_2026-08-17_state_attributes_data_node.md` — intero (R-E/E-1)
- `docs/discovery/discovery_2026-08-17_sim_slice1_fondamenta.md` — intero (R-E/E-1)
- `docs/claude-code-log.md` — :1-120 (ultime 8 entry)

---

## Q1 — Residenza e consumatori del dependency set compilato

### Origine → deposito → consumatori

| Origine (`deps: Set<string>`) | Alimentato da | Deposito | Consumatori in produzione |
|---|---|---|---|
| `compileView` `irCompile.ts:241` | `compilePredicate` (:244), `compileConditional` su form/fill/marker (:245-251), label (:257), badge (:280), `fieldCompartments` (:295-297), `containment` (:305-312) | `CompiledView.dependencySet` — `irCompile.ts:328`, tipo `irTypes.ts:386` | **nessuno** |
| `compileEdgeView` `irCompile.ts:376` | `compilePredicate` (:379), `compileExpr` (:381-386), `line.*` (:411-413), `compileTextSource` (:419) | `CompiledEdgeView.dependencySet` — `irCompile.ts:423`, tipo `irTypes.ts:330` | **`useIRContainment.ts:87`** (solo il bucket `objectAsEdgeByMetaclass`) |
| `compileRowView` `irCompile.ts:450` | `compilePredicate` (:453), `compileTextSource` per segmento (:454), `visible` (:455) | `CompiledRowView.dependencySet` — `irCompile.ts:465`, tipo `irTypes.ts:365` | **nessuno** |

Misura: `command grep -rn "dependencySet" frontend/src --include="*.ts" --include="*.tsx"` → **15
righe**, di cui 6 sono le tre dichiarazioni di tipo più le tre scritture, 6 sono asserzioni di test
(`ir.test.ts:105,160,828`; `irCrossDeps.test.ts:64,65`; `markerRegistry.test.ts:122`) e **una sola**
è una lettura applicativa: `useIRContainment.ts:87`. Controllo positivo con la stessa forma di
comando: `crossPaths` → **28** righe.

Il sito unico, verbatim:

```typescript
useIRContainment.ts:85-88
    const featNames = new Set<string>();
    for (const entries of index.objectAsEdgeByMetaclass.values()) {
        for (const e of entries) e.compiled.dependencySet.forEach(f => featNames.add(f));
    }
```

`objectAsEdgeByMetaclass` (`irResolveCore.ts:78`, popolata a `:149-156`) contiene solo
`EdgeIndexEntry`, quindi il `dependencySet` letto è **sempre** quello di una edge view
object-as-edge. Il `dependencySet` delle `CompiledView` e delle `CompiledRowView` è un **dead
write**: calcolato a ogni compile e mai letto (è esattamente il caso che CLAUDE.md §5 chiede di
verificare prima di modificare un output «che sembra portante»).

**Nota su `IRNodeContent.tsx:99-151`** — il prompt lo indica come possibile lettore. Non lo è:
`compartmentSig` (:99-120) e `rowChildSig` (:139-143) non nominano `dependencySet` (misurato: 0
occorrenze nel file; controllo positivo `compiled.` nello stesso file → presente in decine di
righe). Neppure `irCrossDeps.ts` lo legge: quel modulo consuma `crossPaths` (`irCrossDeps.ts:63`),
che è un campo diverso.

### Conseguenza per R-MK-5

Il vincolo di forma di R-MK-5 («insieme separato, mai pseudo-feature prefissate») è corretto e
già motivato dal codice: `resolveCrossDeps` (`irCrossDeps.ts:60-102`) concretizza i nomi in id di
DValue via `findFeatureRaw` (`irReadCtx.ts:39-52`), e una `@mark` produrrebbe un `unresolved`
spurio a `irCrossDeps.ts:87` più un `console.warn` a `:184`. Ma il vincolo **non basta**: se
`channels` vive accanto a `dependencySet` sui `Compiled*`, per le view di **nodo** vive accanto a
un campo che nessuno legge, e non basta depositarlo per farlo funzionare.

Il deposito è la parte facile; la parte che decide è **chi lo consuma**, ed è Q2.

Precedente di forma già nel file, da non ignorare: `crossPathSink` (`irCompile.ts:47`, con il
commento :37-46) è un accumulatore **module-scoped** introdotto proprio perché
«threading a second accumulator through all of them would touch every signature» — dove «all of
them» sono `compileOperand`, `compilePredicate`, `compileTextSource`. R-MK-5 dice
«`compilePredicate` riceve un secondo insieme accanto a `deps`»: le due cose sono compatibili
(l'insieme esiste comunque), ma il codebase ha già scelto una volta la forma sink per la stessa
ragione e sullo stesso percorso di chiamata. Vedi domanda aperta 1.

---

## Q2 — Meccanica di invalidazione odierna, end-to-end

Ci sono **tre** superfici di risoluzione IR, con tre meccaniche indipendenti. Nessuna passa dal
`dependencySet` delle view di nodo.

### (a) Nodi — `useIRView` (`irResolve.ts:47-96`)

Selettore (`:48-71`), che compone la firma:

```
irSig  = computeIRSignature(state)                       (irResolveCore.ts:100-113)
       + objectId  (= idlookup[vertexId].model)          (:55)
       + dObject.instanceof                              (:59)
       + per OGNI DValue dell'oggetto: `${fid}=${JSON.stringify(dv.values)}`   (:60-65)
       + crossDepsSignature(lookup, vertexId)            (:69)
```

Il commento a `:51-53` è esplicito: *«Kept unconditional (not filtered by dependency set) to avoid
a resolve inside the selector»*. **Lo snapshot self è totale**, non filtrato: è la ragione per cui
il `dependencySet` dei nodi può essere dead senza che nulla si rompa.

Il `useMemo` (`:76-95`) dipende da `[signature, vertexId, instanceOfClassId]` e fa tre cose: risolve
la view (`resolveIRView`, :86), concretizza i cross-dep (`resolveCrossDeps`, :90) e li pubblica
(`publishCrossDeps`, :91). La pubblicazione è **a due fasi**: il render pubblica, il selettore del
render successivo legge (`crossDepsSignature`, `irCrossDeps.ts:159-168`).

**Punto chiave**: la risoluzione della view — cioè la valutazione di `ir.predicate` a
`irResolveCore.ts:267` — avviene **dentro il memo**. Un predicato che non dipende da nessuno slot
non fa cambiare la firma, quindi non viene mai rivalutato.

### (b) Righe — `useIRRowView` (`irResolve.ts:113-152`)

Identico ad (a), chiavato sul `childObjectId` invece che sul vertice (firma :114-129, memo
:133-151).

### (c) Edge e containment — `useIRContainment` (`useIRContainment.ts:70-189`)

Deps del memo (`:189`): `[nodes, edges, irSig, collapseVersion, edgeInteractionVersion,
oaeSlotsSig]`. `oaeSlotsSig` (:80-111) è l'unico segnale «di modello»: unisce i `dependencySet`
delle object-as-edge view (:85-88), scandisce `state.objects` filtrando per nome esatto di
metaclasse (:91-94), e appende gli slot che portano uno di quei nomi (:95-101) più i cross-dep
degli edge-object pubblicati al giro precedente (:106-109).

### `compartmentSig` / `rowChildSig` (`IRNodeContent.tsx`)

Sono **sotto** la risoluzione: girano dentro il componente già montato, non decidono quale view si
applica.

- `compartmentSig` (:99-120): fast path `''` se la view non ha `fieldCompartments`; altrimenti per
  ogni `fid` di `dObject.features` concatena `${kind};${fid};${featName};${typeName};${display}`
  (`kind` = `R` se `DReference`, `A` altrimenti; `display` = valori risolti per nome quando sono
  pointer). Consumato dal `useMemo` a :122-132, che lo riesplode in `rows.attributes` /
  `rows.references`.
- `rowChildSig` (:139-143): fast path `''` se nessun compartimento ha `source === 'children'`;
  altrimenti `rowRenderedChildren(compiled, makeReadCtx(lookup), objectId, lookup).join(',')`.
  Consumato dal `useMemo` a :144.

Nessuno dei due è filtrato per dependency set, e nessuno dei due partecipa alla scelta della view.

### Dove va `channels ∋ 'mark' ? versione : 0`

Sono **tre** punti di innesto, uno per superficie, e non sono intercambiabili:

| Superficie | Punto | Cosa si ottiene |
|---|---|---|
| nodi | `useIRView` selettore (`irResolve.ts:48-71`) o dep del memo (`:95`) | ri-**risoluzione** della view: serve solo se `marked` sta nel `predicate` di applicabilità |
| righe | `useIRRowView` (`irResolve.ts:114-129` / `:151`) | idem per le row view |
| edge / containment | `oaeSlotsSig` (`useIRContainment.ts:80-111`) o un dep in più a `:189` | ri-**decorazione**: senza questo un `marked` in `line.color` di una edge view non si aggiorna mai |

I `Conditional<T>` **dentro** una view di nodo già risolta non hanno bisogno di nessuno dei tre:
si rivalutano a ogni render del componente, e il render arriva già oggi (Q3).

### Granularità: la firma è per-nodo, il segnale è globale

La firma di `useIRView` è per `vertexId`, quindi tecnicamente esiste un punto che invalida il
singolo elemento. Ma nel selettore la view **non è ancora risolta** (per costruzione: la
risoluzione sta nel memo), quindi il selettore non può sapere se *questa* view dichiara il canale.
Le due uscite sono: (i) appendere la versione quando l'**indice** dichiara il canale da qualche
parte, che è il precedente esatto di `oaeSlotsSig` (unione a livello di indice, :85-88) e la lettura
naturale di R-MK-6; (ii) tenere lo snapshot per elemento come `problems/useNodeProblems.ts:26-32`
(`useIsHighlighted(nodeId)` con snapshot funzione dell'id), che darebbe la granularità fine ma che
R-MK-6 rimanda esplicitamente a una misura. Il report registra la scelta come già presa: (i).

---

## Q3 — Meccanica di sottoscrizione al canale: il costo di oggi è già quello

**Il costo di R-MK-6 sui nodi esiste già, a schermo, da ieri.**

```
ObjectNode.tsx:194   const simObjectId = useSelector((state: any) => state.idlookup?.[id]?.model ?? null);
ObjectNode.tsx:195   useSimVersion();
ObjectNode.tsx:196   const isSimActiveNode = typeof simObjectId === 'string' && isSimActive(simObjectId);
```

`useSimVersion` (`simRunState.ts:88-90`) è `useSyncExternalStore(subscribe, getSimVersion,
getSimVersion)` su un contatore **globale** (`:18`, bump a `:21-24`). La chiamata è nuda e
incondizionata (il commento a `:191-193` lo dichiara: «Both hooks unconditional (rules of hooks)»),
quindi **ogni `ObjectNode` montato è sottoscritto**, marcato o no, in un viewpoint IR o no.

**Che cosa lo attenua: strutturalmente, niente.**

- Nessun `React.memo` in `editor-v2`: `memo(` in `frontend/src/components/editor-v2` (`*.tsx`) →
  **0**; stessa forma di comando su `frontend/src` → **21** (controllo positivo con segnale, prima
  riga `jjscript/components/JjScriptOutput.tsx:19`).
- `IRNodeContent` non è memoizzato (`export default IRNodeContent`, nessun wrapper), quindi ogni
  re-render del padre lo re-renderizza.
- La memoizzazione interna di React Flow sta **a monte** del componente: non può impedire un
  re-render che il componente si procura da sé con `useSyncExternalStore`.
- L'unica attenuazione reale è a valle del render: `isSimActiveNode` entra solo in una template
  string di className (`:402` ramo IR, `:457` ramo nativo), quindi se il valore non cambia il diff
  DOM è vuoto. Si risparmia il commit, non il render.

**Conseguenza non ovvia e favorevole a M1**: `IRNodeContent` ricalcola `form` e `fill` in testa al
corpo del componente (`IRNodeContent.tsx:84-85`) e applica il fill **inline**
(`inlineStyle.background = fill`, `:194`), non via CSS di view. Quindi un `fill` condizionato su
`{op:'marked'}` **si aggiornerebbe già oggi** a ogni step di simulazione, senza aggiungere nessuna
sottoscrizione, per il solo fatto che `ObjectNode` si re-renderizza. Il caso d'uso principe di
R-MK-1 («colora di rosso lo stato attivo») cade nel percorso gratuito.

**Costo di oggi vs costo dopo M1**, separato come chiede il prompt:

| | oggi | dopo M1 |
|---|---|---|
| re-render di ogni `ObjectNode` per bump | sì (`:195`) | invariato |
| rivalutazione dei `Conditional` della view già risolta | sì, per re-render | invariato (è il percorso di `marked` nei conditional) |
| ri-**risoluzione** della view (`resolveIRView`) | **no** | **sì**, se `marked` sta nel `predicate` e il canale entra nella firma di `useIRView` |
| ri-decorazione edge/containment | **no** | **sì**, se il canale entra in `useIRContainment` |

I due «sì» nuovi sono il costo aggiunto vero di M1, ed è un costo per bump e per canvas, non per
nodo: una `resolveIRView` per nodo (ordinamento dei candidati + valutazione dei predicati,
`irResolveCore.ts:244-272`) e una passata completa di `useIRContainment` (:113-184).

**Non misurato**: il costo in millisecondi. Richiede il browser e un progetto reale, che vivono
nello storage di Alfonso. Qui è tracciato leggendo il codice, e lo dichiaro invece di spacciarlo
per misura.

R-MK-8 ha una conseguenza operativa che vale la pena scrivere: **finché `sim-active` resta, il
percorso gratuito dei conditional resta**. Il giorno in cui l'highlight di R-SIM-3 si ritira,
`useSimVersion()` sparisce da `ObjectNode` e quel percorso va ricomprato dal canale. Chi aprirà la
fetta di ritiro deve saperlo.

---

## Q4 — I due backend `ReadCtx` e tutti gli implementor

### Localizzazione

| Cosa | File:riga |
|---|---|
| interfaccia `ReadCtx` (6 metodi) | `irReadCtx.ts:17-32` |
| switch di backend `IR_READ_BACKEND = 'lproxy'` | `irReadCtx.ts:15` |
| **backend draw** — `makeDrawReadCtx(idlookup): ReadCtx` | `irReadCtx.ts:129-164` |
| **backend lproxy** — `makeLproxyReadCtx(idlookup): ReadCtx` | `irReadCtxLproxy.ts:19-50` |
| fabbrica pubblica `makeReadCtx` | `irReadCtxLproxy.ts:52-54` |

Il backend draw **non era da localizzare altrove**: sta nello stesso file dell'interfaccia. Lo
split di file esiste per la ragione scritta a `irReadCtxLproxy.ts:1-6`: tenere il draw importabile
nei test node, perché il lproxy importa il joiner (`LPointerTargetable`, :8) che trascina
monaco/`window`.

### Siti di costruzione

`makeReadCtx` è chiamata in 6 punti, tutti consumatori:
`irResolve.ts:85`, `irResolve.ts:142`, `useIRContainment.ts:123`, `IRNodeContent.tsx:142`,
`EditorV2.tsx:171`, `EditorV2.tsx:967`. Nessuno di questi costruisce un `ReadCtx` a mano.

### Implementor strutturali — l'elenco completo

Misura: `: ReadCtx = {` / `: ReadCtx> = {` / `satisfies ReadCtx` → **0**; `as ReadCtx` → **0**;
controllo positivo con la stessa forma di comando: `ReadCtx` in `frontend/src` → **84** righe.
Gli 84 si distribuiscono in: la definizione, due fabbriche, annotazioni di **parametro**
(`irResolveCore.ts:241,288,327,364`; `irEdgeViews.ts:40,123,175`; `irContainment.ts:126,170,195`;
`IRNodeContent.tsx:56,72`; `irResolve.ts:35,101`), tipi di funzione compilata
(`irTypes.ts:401-403`), commenti, e i test.

Le annotazioni di parametro sono **controvarianti**: aggiungere un metodo all'interfaccia non le
tocca.

### I doppi di test: sopravvivono

Due soli doppi, entrambi in `ir.test.ts`:

```typescript
ir.test.ts:200-208   function lproxyLike(idlookup) {
                         const base = makeDrawReadCtx(idlookup);
                         return { ...base, getValue: (…) => … };
                     }
ir.test.ts:696-703   const proxyCtx = { ...base, getValue: (…) => … };
```

Sono **spread di un contesto completo**: un metodo nuovo su `makeDrawReadCtx` arriva
automaticamente nello spread. Inoltre entrambi sono passati con `as any` ai call site
(`:235`, `:243`, `:251`, `:262`, `:708`), quindi non c'è nemmeno un controllo strutturale da
soddisfare.
Misura degli spread di contesto in tutto `frontend/src`: 43 righe `...base|...draw|...ctx`, di cui
solo 2 riguardano `ReadCtx` (`ir.test.ts:203`, `:699`); le altre sono stili react-select, opzioni
monaco e patch di IR.

### Conteggio dei file che `isMarked(elementId): boolean` costringe a toccare

**Due**:

1. `irReadCtx.ts` — la firma nell'interfaccia (:17-32) e l'implementazione in `makeDrawReadCtx`
   (:129-164).
2. `irReadCtxLproxy.ts` — `makeLproxyReadCtx` (:19-50) restituisce un **object literal tipizzato
   `ReadCtx`**: senza la nuova proprietà è errore TypeScript. La forma naturale è una riga in più
   nel blocco delle deleghe strutturali (`getName`/`getMetaclassName`/`isKindOf`/`getRef`,
   :45-48), perché la marcatura non è un valore coerced dal proxy — esattamente il criterio che il
   commento a :42-44 già enuncia.

Sotto il limite di corsia. **Ma il vincolo che conta non è il conteggio, è la purezza**:
`irReadCtx.ts` oggi non ha **nessun import** (misurato: prima riga di codice a :15, nessun
`import` nel file). Farlo importare `../../sim/simRunState` gli darebbe una dipendenza transitiva
da `react` (`simRunState.ts:15`). Verificato che react è importabile nell'env node dei test
(`import('react')` → `useSyncExternalStore` è `function`, react 18.3.1) e che vitest gira
`environment: 'node'` (`vitest.config.ts:14`), quindi **non è un blocco tecnico**; è una scelta di
contratto sul modulo, e la Fase 2 la deve prendere esplicitamente. Vedi domanda aperta 2.

### Perimetro reale della Fase 2

`isMarked` costa 2 file, ma la fetta M1 nel suo insieme ne tocca almeno:
`irReadCtx.ts`, `irReadCtxLproxy.ts`, `irTypes.ts`, `irCompile.ts`, il punto (o i punti) di innesto
della reattività (`irResolve.ts` e/o `useIRContainment.ts`), la spec v1.2, i test
(`ir.test.ts` e/o un file nuovo), `docs/claude-code-log.md`. **Sette o otto file**: sopra la soglia
della regola 19. È un input per il perimetro della Fase 2, non un permesso di allargarlo: il prompt
di Fase 2 deve elencarli uno per uno con il cambiamento atteso, come ha fatto la 2b.

---

## Q5 — Tutti i punti che smistano su `Predicate.op`

Misura (`case 'isKind'|case 'exists'|case 'empty'|.op === '|op: 'literal'` su `frontend/src`,
escludendo `__tests__`): **quattro** siti di dispatch, più due fabbriche che producono predicati.

| # | Sito | Che cosa fa con un `op` sconosciuto |
|---|---|---|
| 1 | `irCompile.ts:125-184` `compilePredicate` | cade nel `default` (:165-182) e lo tratta come comparatore → **throw** (Q6) |
| 2 | `ui/PredicateBuilder/PredicateBuilder.tsx:188-319` `body()` | cade nel `default` (:291-318) e disegna due `OperandEditor` |
| 3 | `ui/PredicateBuilder/predicateDefaults.ts:43-65` `forPredicateKind` | `default` (:57-64): se non è un comparatore ritorna `{op:'literal', value:true}`. È una **fabbrica**, gira solo quando l'utente cambia il Select |
| 4 | `authoring/FieldCompartmentListEditor.tsx:34` | `filter.op === 'isKind' && filter.path === undefined` → modalità `'basic-iskind'`, **altrimenti `'advanced'`, che preserva il predicato verbatim** (:28-34) |

### `irValidate` non valida la forma dei predicati

`validateIR` (`irValidate.ts:30-85`) ha esattamente **due** regole proprie, entrambe sugli edge:
`edge.routing` nel vocabolario chiuso (:35-42) ed endpoint utilizzabile (:64-74). Tutto il resto è
delegato al compilatore dentro un `try/catch` (:77-84), secondo la dottrina R-B9-bis: la validazione
struttura **è** il compilatore. Quindi un `op` sconosciuto oggi **fallisce**, ma per effetto
collaterale del compile e con il messaggio del `TypeError`, non con una diagnostica propria.

### Il `PredicateBuilder` oggi: preserva finché non lo si tocca

Aprendo una view il cui predicato porta un `op` che il builder non conosce:

- `kind = value.op` (:181) finisce in `<Select options={PREDICATE_KIND_OPTIONS} value={kind}>`
  (:324-329). `PREDICATE_KIND_OPTIONS` (`predicateDefaults.ts:20-34`) elenca 13 voci; `'marked'`
  non c'è, quindi il Select mostra un valore non abbinato. **Nessun `onChange` parte da solo**: la
  sanificazione richiede un gesto.
- `body()` cade nel ramo comparatore (:291-318) e monta due `OperandEditor` su `c.left` / `c.right`
  che sono `undefined`. `isLiteralOperand(undefined)` è `false` (`predicateDefaults.ts:71-73`:
  `typeof undefined === 'object'` è falso), quindi modalità `'path'` e `<PathBuilder value={undefined}>`.
  **Non crasha**: `PathBuilder.parseExpr` (`PathBuilder.tsx:38`) passa da `singleHopOf`
  (`pathExpr.ts:73-84`), che è non-throwing per contratto e ritorna `null`, da cui
  `{feature:'', take:'value', index:0}` e la preview «— pick a feature —» (:140-141).
- Il pannello ospite non riscrive nulla all'apertura: il commit è gated su `dirtyRef.current`
  (`VertexAuthoringPanel.tsx:138`) e su `validateIR` (:139-141). Il `seed()` clona l'ir com'è.

**Quindi oggi si preserva, come vuole il precedente R-B15** — ma per assenza di gesti, non per
disciplina scritta. Al primo tocco su un operando l'`onChange` a :300 / :312 scrive
`{op:'marked', left:'…', right: undefined}` e corrompe il nodo; al primo tocco sul Select del kind
`forPredicateKind` lo sostituisce in blocco (che è il comportamento voluto, non una corruzione).

**E c'è un secondo effetto, più grave della UI**: siccome `validateIR` fallisce sull'intero ir
(l'errore è del compile, non del singolo predicato), il pannello **non committa più nulla** finché
il predicato ignoto è lì (:141 `if (!v.ok) return;`, e lo stesso guard al flush di unmount, :170).
Un utente su un build vecchio non vede solo la view sparire: vede l'authoring di quella view
congelarsi. Vedi Q6 e R2.

### Serializzatori

Nessuno. L'ir è persistito con `JSON.stringify` generica dell'intero `idlookup`
(`U.tsx:427-441`, catena documentata nella discovery del 17/8 §Q2) e riletto verbatim: non esiste
un serializzatore che enumeri gli `op`. Niente da toccare in M1 su quel fronte.

---

## Q6 — Forward-compat del ramo `default` di `compilePredicate`

### Che cosa succede, misurato eseguendo il codice

Il `default` (`irCompile.ts:165-182`) chiama `compileOperand((p as any).left, deps)` e
`compileOperand((p as any).right, deps)`. Per `{op:'marked'}` entrambi sono `undefined`:
`isLiteral(undefined)` è `false` (`:111-113`), quindi si va in `compilePath(undefined)` →
`parsePathExpr(undefined)`. Lì `FORBIDDEN_PATH.test(undefined)` (`pathExpr.ts:32`) coerce a
`"undefined"`, che non contiene `?:()`, quindi passa; poi `expr.split('.')` (:35) esplode.

Esito misurato (sonda `node --experimental-strip-types`, vedi §Metodo):

```
THROW | parsePathExpr(undefined)                       | TypeError: Cannot read properties of undefined (reading 'split')
THROW | compileView pred={op:"marked"} (no path)       | TypeError: Cannot read properties of undefined (reading 'split')
THROW | compileView pred={op:"marked",path:"$x.value"} | TypeError: Cannot read properties of undefined (reading 'split')
THROW | compileView pred={op:"zzzUnknown"}             | TypeError: Cannot read properties of undefined (reading 'split')
THROW | compileView fill conditional when={op:"marked"}| TypeError: Cannot read properties of undefined (reading 'split')
THROW | compileEdgeView pred={op:"marked"}             | TypeError: Cannot read properties of undefined (reading 'split')
OK    | compileView pred={op:"eq",...}      [controllo]| object
OK    | compileView pred={op:"isKind",...}  [controllo]| object
```

I due controlli positivi girano nella stessa sonda e passano: il compilatore funziona, il throw è
del soggetto e non dello strumento. Nota: la presenza di `path` **non cambia niente** — il ramo
`default` legge `left`/`right`, non `path`.

**Il throw è un `TypeError` nudo, non un `Error` con prefisso `[ir]`.** Tutti gli altri errori del
compilatore sono messaggi curati che `validateIR` mostra all'utente (`pathExpr.ts:2-13` lo dichiara:
«The messages are not internal: validateIR reuses the compiler as a validator and surfaces them in
the authoring panel»). Questo no.

### Chi lo intercetta

| Percorso | Sito | Effetto |
|---|---|---|
| render, view di nodo | `irResolveCore.ts:193-200` | `console.warn('[ir] compile failed for view', vid, e)` + `continue`: **la view intera esce dall'indice** |
| render, edge view | `irResolveCore.ts:141-147` | idem |
| render, row view | `irResolveCore.ts:169-177` | idem |
| authoring | `irValidate.ts:77-84` | `{ok:false, error:"Cannot read properties of undefined (reading 'split')"}` → `setError` in pannello, **e nessun commit** (`VertexAuthoringPanel.tsx:141`, `:170`) |

Da spec §10 (:186) il degrado è quello dichiarato: *«view in errore di compilazione → la view è
esclusa dall'indice con warning in console; l'elemento cade sulla view successiva nella regola
d'ordine o sul rendering astratto»*. Il comportamento è **conforme alla spec**, ma la granularità è
la view, non il predicato: un `marked` in un `fill` condizionale butta via anche label, badge e
compartimenti.

### Che cosa ne segue per la Fase 2

1. **Ordine dell'edit non negoziabile**: il `case 'marked'` va **prima** del `default`
   (`irCompile.ts:165`), nella stessa posizione in cui sta `isKind` (:154). Metterlo dopo è
   irraggiungibile: `default` in uno `switch` cattura tutto ciò che non ha un `case`, quindi la
   posizione fisica nel sorgente conta solo per leggibilità, ma il `case` **deve esistere**: senza,
   nessun ordine lo salva.
2. **`validateIR` per un ir con `marked` aperto da un build più vecchio**: il build vecchio non ha
   il case, quindi produce il `TypeError` e blocca l'authoring della view. Non è un comportamento
   che M1 possa cambiare (il build vecchio è già scritto), ed è la ragione tecnica dietro
   «M2 dopo M1, non negoziabile» di R-MK-9: un IR autorato prima che l'interprete compili
   l'operatore è esattamente questo scenario, dentro la stessa build. Ciò che M1 **può** decidere è
   se aggiungere in `validateIR` una regola propria sulla forma di `Predicate` — che oggi non
   esiste per nessun operatore — così che un `op` fuori vocabolario dia un messaggio leggibile
   invece del `TypeError`. Vedi domanda aperta 3.
3. **Il ramo `default` resta una trappola generale**, non specifica di `marked`: qualunque
   operatore futuro senza `case` la ripercorre. Registrato come rischio R2, non risolto qui.

---

## Q7 — Cosa sanno fare i path nei predicati, oggi

### I path dei predicati partecipano ai cross-deps: sì, misurato

`compileOperand` (`irCompile.ts:115-123`) chiama `compilePath` (:72-109), e `compilePath` scrive
nel `crossPathSink` module-scoped (:103-107) **indipendentemente da chi l'ha chiamata**. Il sink è
installato in testa a ogni compile top-level (`:242-243`, `:377-378`, `:451-452`) e raccolto in
fondo (`:318`, `:424`, `:456`). Quindi predicati, label, endpoint e template contribuiscono allo
stesso insieme.

Misurato sulla sonda:

```
predicate {op:'exists', path:'$owner.value.$name.value'}
  → deps ["owner","name"]  crossPaths [{hops:[{owner,value}], terminal:{name,value}}]
predicate {op:'isKind', class:'Final', path:'$next.value'}
  → deps ["next"]          crossPaths []          (single-hop: coperto dallo snapshot self)
predicate {op:'isKind', class:'Final', path:'$a.value.$b.value'}
  → deps ["a","b"]         crossPaths [{hops:[{a,value}], terminal:{b,value}}]
```

**Il multi-hop nei predicati funziona e non è single-hop de facto**: il commento «KNOWN LIMIT …
only single-hop self paths are fully reactive» in testa a `compilePath` (`irCompile.ts:66-70`) è
stantìo — lo stesso rilievo che la discovery del 17/8 (`discovery_2026-08-17_sim_slice1_fondamenta.md`
§Q6, «Incoerenza documentale trovata per strada») ha già registrato. Non toccato qui.

Attenzione a **quale** reattività è quella che arriva: per i nodi i `crossPaths` sono consumati
davvero (`irResolve.ts:90-91` → `crossDepsSignature` a `:69`), mentre il `deps` che alimentano non
lo è (Q1). Non è un problema, perché lo snapshot self di `useIRView` è totale.

### Il difetto che `marked.path?` non deve ereditare

Il ramo `path` di `isKind`:

```typescript
irCompile.ts:156-161
    if (p.path) {
        const acc = compileOperand(p.path, deps);
        return (ctx, id) => {
            const target = acc(ctx, id);
            return typeof target === 'string' ? ctx.isKindOf(target, cls) : false;
        };
    }
```

`acc` è l'accessor di `compilePath`, il cui **step terminale** legge con il backend attivo
(`irCompile.ts:91-94`: `ctx.getValue` / `ctx.getValues`). Su una reference, il backend di
produzione non restituisce un pointer:

- `IR_READ_BACKEND = 'lproxy'` (`irReadCtx.ts:15`);
- `makeLproxyReadCtx.getValue` (`irReadCtxLproxy.ts:22-31`) legge `lObj['$'+feature].value`;
- `LValue.get_values` mappa i valori di una feature tipizzata `DClass` non primitiva con
  `r => r && LPointerTargetable.fromPointer(r)` (`LModelElement.tsx:7308`), cioè un **proxy L**;
- `typeof <proxy> === 'string'` è `false` → il predicato ritorna `false`, sempre.

Il codebase **documenta già l'insidia** e la evita altrove: il commento a `irReadCtxLproxy.ts:42-44`
dice testualmente che «lproxy `.value` on a reference yields a name/proxy, not the pointer id needed
to navigate», ed è per questo che `getRef` è delegato al draw (:48) e che la spec v1.2 §12 ha
l'emendamento del 2026-07-21 (:210). Il ramo `path` di `isKind` è l'unico posto che legge un
**elemento** attraverso `getValue` invece che attraverso `getRef`.

I test non lo vedono perché costruiscono il contesto con `makeDrawReadCtx` (30 occorrenze di
`isKind` sotto `__tests__`), dove `getValue` su una reference torna la stringa pointer
(`irReadCtx.ts:130-134`). I due doppi `lproxyLike` (`ir.test.ts:200-208`, `:696-703`) simulano il
proxy, ma sono usati per label e endpoint, non per `isKind` con path.

**Grado di certezza**: tracciato leggendo il codice più la catena di tipi, **non eseguito** contro
il backend lproxy (richiede il joiner, cioè il browser). Lo dichiaro invece di spacciarlo per
misura, come vuole §5. È verificabile in un minuto in console su un progetto reale.

### Che cosa può onestamente promettere `marked.path?` in v1

- **Se il path è single-hop su una reference** (il caso d'uso normale: «l'oggetto puntato da
  `$next` è marcato»): la risoluzione deve passare da `ctx.getRef(id, feature, take)`
  (`irReadCtx.ts:31`, implementato da `navigateRefHop`, :70-82), che ha semantica draw su entrambi i
  backend e ritorna `string | null`. È la stessa primitiva che `compilePath` usa per gli hop **non**
  terminali (:86).
- **Se il path è multi-hop**: tutti gli step vanno navigati con `getRef`, incluso il terminale. Non
  esiste oggi un helper che faccia «risolvi un PathExpr a un element id»: `compilePath` produce
  sempre un accessor che legge un **valore** in coda. Serve o un secondo modo di compilazione, o la
  restrizione dichiarata a single-hop in v1.
- **Fallback**: `getRef` ritorna `null` sui casi di esaurimento (slot assente, array vuoto, hop
  `values` intero, `irReadCtx.ts:76-81`), quindi «path che si esaurisce → `false`» di R-MK-7 è
  soddisfatto per costruzione, senza throw.
- **Reattività identica a `exists`/`isKind`**: il path entra in `deps` e, se multi-hop, in
  `crossPaths`, con i consumatori misurati sopra. La marcatura in sé no: quella la porta solo il
  canale.

**Nota di prudenza**: se la Fase 2 sceglie `getRef` per `marked.path` e lascia `isKind` com'è, le
due forme di `path?` avranno semantiche diverse a parità di aspetto. Se invece corregge anche
`isKind`, esce dal perimetro M1 e cambia comportamento committato (regola 3). È una domanda per
Alfonso, non una decisione del report (domanda aperta 4).

---

## Q8 — Le sezioni di spec da emendare, con testo corrente

File: `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` (228 righe).

### Dove è normato `Predicate`: per rinvio, in v1.2; nel corpo, in v1.1

```
v1.2 §3 «Primitive (invariate dalla v1.1, con una precisazione)»   righe 38-44
  riga 40:  «`PathExpr`, `Literal`, `Predicate`, `Conditional<T>`, `MetaclassRef`,
             `ColorToken`, `BorderSpec`, `TextStyle` come v1.1 sez. 3.»
  riga 42:  precisazione PathExpr multi-hop
  riga 44:  «**`EndpointExpr` (nuova primitiva, emendamento 2026-08-17, R-B13)**: …»
```

Il corpo normativo di `Predicate` sta in `docs/spec/spec_2026-06-08_ir_schema_v1_1.md`:

```
v1.1 §3.3 «Predicate (booleano chiuso)»   righe 75-89
  righe 77-88: il blocco typescript con i sette rami dell'unione
  riga 89:     «`isKind` senza `path` testa il tipo di `self`; con `path` testa il tipo
                dell'oggetto navigato … La metaclasse propria della view non passa di qui»
v1.1 §2, riga 39: «**Grammatica chiusa, due lowering.** Predicati e condizioni dell'IR
                   vivono in un'unica grammatica chiusa (`Predicate`).»
```

**Precedente di forma già usato per un caso identico**: R-B13 ha introdotto `EndpointExpr` con un
**delta in v1.2 §3 (riga 44)**, senza toccare la v1.1. Lo stesso schema si applica a `marked`: un
capoverso in v1.2 §3 che estende l'unione `Predicate` con l'ottavo ramo, la sua semantica e il
punto di estensione riservato `mark?` (R-MK-3), lasciando la v1.1 intatta. Da confermare (domanda
aperta 5).

### §9 — dependency set e reattività: righe 170-179

Heading a riga 170. Testo corrente, integrale:

```
riga 172:  «Per ogni view compilata, l'interprete deriva staticamente dai PathExpr l'insieme
            delle feature lette:»
riga 174:  «- **self**: nomi di feature letti sul primo hop → subscription sullo snapshot
            dell'elemento (implementato nello spike);»
riga 175:  «- **cross-oggetto** (multi-hop): coppie (hop, feature) → subscription sugli oggetti
            navigati. NON implementato nello spike (limite noto); richiesto per Fase 2b/2c (i
            predicati dei graphVertex e gli endpoint edge navigano). L'interprete DEVE invalidare
            il render di un elemento quando cambia una feature nel suo dependency set, e NON DEVE
            re-renderizzare per feature fuori dal set.»
riga 177:  «**Endpoint `container` e dependency set (normativo, emendamento 2026-08-17,
            R-B13/R-B16)**: il token non è una feature e non contribuisce al dependency set, che
            resta derivato dai soli `PathExpr`. L'invalidazione di un endpoint `container` passa
            quindi dai canali generici del sync … Una nozione esplicita di dipendenza dal
            contenitore dentro il dependency set è estensione futura, con ratifica propria.»
riga 179:  «Il dependency set è derivato, mai dichiarato nello schema. La navigazione multi-hop …
            è draw-semantic per costruzione, via l'helper unico `navigateRefHop` / `ReadCtx.getRef`
            …»
```

La **clausola restrittiva** è l'ultima frase di riga 175. Da R-MK-5 va conservata su entrambe le
parti: «niente re-render per un canale non dichiarato dall'elemento».

La **riga 177 va aggiornata, non solo affiancata**: dichiara oggi che una nozione esplicita di
dipendenza dal contenitore è «estensione futura, con ratifica propria», e l'aggiornamento del
2026-08-18 a R-B16 (`decisions.md:184-186`) dice che quella ratifica è R-MK-5 e che la migrazione è
la fetta M3. Emendare §9 in M1 senza toccare la riga 177 lascerebbe in spec un rinvio a una
ratifica che nel frattempo esiste. Attenzione: **la migrazione del canale `container` è M3, non
M1** — il testo nuovo deve dichiarare il canale nell'insieme senza dichiarare fatta la migrazione.

La riga 179 («derivato, mai dichiarato nello schema») resta vera per i canali: `mark` è derivato
dalla presenza dell'operatore, non dichiarato in un campo dell'ir.

### §10 — fallback espliciti: righe 181-191

```
riga 185:  «- **edge non risolto** → card di fallback con la ragione …;»
riga 186:  «- **view in errore di compilazione** → la view è esclusa dall'indice con warning in
            console; l'elemento cade sulla view successiva nella regola d'ordine o sul rendering
            astratto di EditorV2;»
riga 187:  «- **elemento senza view IR applicabile** → rendering astratto di EditorV2 …»
riga 189:  «Mai sparizioni silenziose: ogni degrado ha un artefatto visibile o un log.»
riga 191:  deroga per l'oggetto-edge senza vertice (R-B14)
```

R-MK-7 («elemento senza marcatura: `false`; `path` che si esaurisce: `false`, con la ragione
visibile nella diagnostica di authoring; `marked` non lancia») si innesta qui. **Ma la seconda metà
della clausola non ha un canale**: vedi rischio R4 e domanda aperta 6.

### §13 — fuori dalla v1.2: righe 212-217

**Non cita il dependency set.** Misura: `dependency` nelle righe 212-218 → **0**; controllo
positivo sullo stesso file: `dependency set` → **6** occorrenze. Nessun emendamento dovuto a §13.

### Riepilogo dei bersagli per la Fase 2

| Sezione | File | Righe | Intervento |
|---|---|---|---|
| §3 | v1.2 | 38-44 | capoverso nuovo: ottavo ramo di `Predicate`, sul modello della riga 44 (R-B13) |
| §9 | v1.2 | 170-179 | due parti del dependency set (riga 175 conservando la clausola restrittiva); riga 177 allineata all'aggiornamento R-B16 del 2026-08-18 |
| §10 | v1.2 | 181-191 | fallback di `marked` (R-MK-7) |
| §3.3 | v1.1 | 75-89 | **non toccare** (precedente R-B13) |
| §13 | v1.2 | 212-217 | nessuno |

---

## Q9 — Panorama test e import-safety

### File di test esistenti nel perimetro

`frontend/src/components/editor-v2/viewpoint/ir/__tests__/` — 12 file:

| File | Rilevanza per M1 |
|---|---|
| `ir.test.ts` (72 KB) | **il file naturale**: `irReadCtx (draw backend)` a :62, semantica di `Predicate`/`Conditional`, i doppi `lproxyLike` (:200-208, :696-703), asserzioni su `dependencySet` (:105, :160, :828) |
| `irValidate.test.ts` | 5 test aggiunti dalla 2b; sede naturale per una eventuale regola nuova su `Predicate` |
| `pathExpr.test.ts` | grammatica: **non si tocca in M1** (R-MK-1, R-J7) |
| `irCrossDeps.test.ts` | `dependencySet` + `crossPaths` (:64-65) |
| `markerRegistry.test.ts` | precedente di «predicato dentro un conditional entra nel dependencySet» (:105-122) |
| `edgeEndpoints.test.ts`, `irCreationSeed.test.ts`, `metaclassPin.test.ts`, `notationCatalog.test.ts`, `shapeRegistry.test.ts`, `symbolRecognition.test.ts` | fuori perimetro |

Fuori cartella ma nel perimetro concettuale:
`viewpoint/authoring/__tests__/edgeAuthoring.test.ts` (convenzione di import-safety).

### Baseline misurate su HEAD `e8caceaca`

- `npx vitest run` → **1284 passed**, 9 file rossi noti (`window is not defined`), 49 verdi su 58.
- `npx vitest run src/components/editor-v2` → **20 file, 399 passed, 0 failed**.

Il **394** del prompt è la baseline della slice 2a; la 2b ha aggiunto 5 test in `irValidate.test.ts`
(394 + 5 = 399). Il numero da usare come baseline per la Fase 2 è **399** sul sottoinsieme
editor-v2 e **1284** sull'intera suite.

### Convenzioni di import-safety (env vitest `node`)

`vitest.config.ts:14` fissa `environment: 'node'`, `:16` include `src/**/__tests__/**/*.test.ts`.
La convenzione è enunciata nell'intestazione di `edgeAuthoring.test.ts:12-21`:

> EdgeAuthoringPanel / EnableIRPanel are NOT import-safe in the node vitest env (they import
> joiner → monaco-editor → `window` undefined), so — as in rowAuthoring.test.ts — the seeds are
> asserted as mirrored literals driven through validateIR / compileEdgeView … The panel's endpoint
> decisions are NOT mirrored: they live in ir/edgeEndpoints, a pure module, and are imported below.

Regola operativa: **si importano i moduli puri, si rispecchiano i letterali dei componenti**.

### Import-safety dei due moduli che la Fase 2 tocca

| Modulo | Import a runtime | Import-safe in node? |
|---|---|---|
| `irCompile.ts` | `./irTypes` (`CONTAINER_ENDPOINT`, :345), `./pathExpr` (:35); `ReadCtx` è `import type` (:34), erased | **sì, già dimostrato**: importato da `edgeAuthoring.test.ts:25` e da `ir.test.ts` in una suite verde |
| `irTypes.ts` | nessuno a runtime (`ReadCtx` è `import type`, :399) | **sì** |
| `pathExpr.ts` | nessuno (`PathExpr` è `import type`, :18); «Pure by contract» dichiarato a :14-16 | **sì** |
| `irReadCtx.ts` | **nessun import** | **sì**, ed è per questo che il lproxy vive in un file a parte (:1-6) |
| `sim/simRunState.ts` | `useSyncExternalStore` da `'react'` (:15) | **sì**: verificato che `import('react')` in node ESM espone `useSyncExternalStore` come `function` (react 18.3.1). L'import non chiama l'hook; le altre sei funzioni esportate sono pure sul `Set` di modulo |
| `irReadCtxLproxy.ts` | `LPointerTargetable` dal joiner (:8) | **no** (è l'eccezione dichiarata) |

**Conseguenza per la Fase 2**: test nuovi che coprano `{op:'marked'}` in `compileView` /
`compileEdgeView` / `compileRowView`, il `false` di default, il `path` e l'insieme dei canali sono
scrivibili nell'env node importando i moduli reali; il pilotaggio della marcatura si fa chiamando
`simReset` / `simApplyStep` / `simClear` direttamente (`simRunState.ts:41`, `:64`, `:72`), che è
sincrono e non richiede React. Il **backend lproxy resta non testabile** in node: se si vuole una
regressione sul difetto di Q7, va scritta con un doppio `lproxyLike` come i due esistenti.

Attenzione a un dettaglio operativo: il `Set` di `simRunState` è un **singleton di modulo**
condiviso da tutti i test dello stesso file. Un `simClear()` in `beforeEach` è dovuto, come lo è
`clearCompileCache()` (`irCompile.ts:475`) prima di ogni compile che riusa un `viewId` — pattern già
in uso (`ir.test.ts:230`, `:238`, `:246`, `:254`).

---

## Rischi individuati

**R1 — Il `dependencySet` dei nodi è un dead write, e modellare `channels` su di esso lo
replicherebbe.** Un `channels: string[]` depositato accanto a `dependencySet` su `CompiledView`
sarebbe corretto nella forma e inerte nell'effetto: nessuno lo legge (Q1). L'effetto lo dà solo
l'innesto in `useIRView` / `useIRRowView` / `useIRContainment` (Q2). Un test che asserisce
`compiled.channels` contiene `'mark'` **passerebbe senza che la feature funzioni**: è il caso di
scuola di CLAUDE.md §5 («verify consumers before assuming an output is load-bearing»).

**R2 — Il ramo `default` di `compilePredicate` è una trappola generale, non un caso di `marked`.**
Qualunque `op` senza `case` produce un `TypeError` nudo che (a) butta via l'intera view al render
(`irResolveCore.ts:198`) e (b) **congela l'authoring** di quella view, perché `validateIR` fallisce
e il commit è gated (`VertexAuthoringPanel.tsx:141`, `:170`). M1 chiude il caso `marked`; il ramo
resta. Chiuderlo davvero significherebbe un `case` esplicito per i sei comparatori e un `default`
che lancia un `[ir] unknown predicate operator "<op>"`: fuori perimetro M1, da valutare.

**R3 — `isKind` con `path` è verosimilmente inerte sul backend di produzione, e `marked.path?` ne
erediterebbe il difetto se copiasse la forma.** Catena in Q7; grado di certezza: tracciato a codice,
non eseguito contro lproxy. Se confermato, è anche una regressione latente **già presente** che M1
non ha il mandato di correggere (regola 3 in senso inverso: non degradare, ma neppure allargare il
perimetro senza chiedere).

**R4 — R-MK-7 chiede una diagnostica di authoring che non esiste.** «`path` che si esaurisce →
`false`, con la ragione visibile nella diagnostica di authoring»: oggi le uniche diagnostiche del
percorso IR sono (i) la stringa d'errore di `validateIR`, che è **statica** (compile-time), e (ii)
i `console.warn` one-shot di `irCrossDeps.ts:170-200`, che non arrivano al pannello. Misura:
`diagnos` sotto `editor-v2/viewpoint` → 5 righe, tutte commenti o l'header di quella sezione;
controllo positivo `error` nello stesso scope → 41. Un path che si esaurisce **a runtime** oggi
produce silenzio (è ciò che fa `exists` su un path morto). Nessuna superficie da riusare.

**R5 — Il costo gratuito di oggi dipende da R-MK-8.** I `Conditional` su `marked` si aggiornano
senza nuova sottoscrizione solo perché `ObjectNode.tsx:195` è lì. Se la fetta di ritiro
dell'highlight lo rimuove senza che il canale sia già innestato in `useIRView`, i viewpoint che
autorano `marked` smettono di aggiornarsi in silenzio. Da scrivere nel commento del codice, non solo
qui.

**R6 — Perimetro della Fase 2 sopra la soglia della regola 19.** Sette-otto file (Q4). Va elencato
uno per uno nel prompt con il cambiamento atteso, e riesposto all'hard stop prima del commit.

**R7 — Purezza di `irReadCtx.ts`.** Oggi zero import; `isMarked` gliene darebbe uno verso
`sim/simRunState`, quindi verso `react`. Tecnicamente innocuo (misurato), contrattualmente una
scelta: il modulo è quello che il resto del codebase tratta come «puro», ed è la ragione dello split
con `irReadCtxLproxy.ts`.

**R8 — La cache di compilazione non è un rischio, ed è utile dirlo.** `compileCache`
(`irCompile.ts:234`), `edgeCompileCache` (:369), `rowCompileCache` (:432) e `indexCache`
(`irResolveCore.ts:115`) memoizzano su `(viewId, irHash)` e sulla firma del viewpoint: memoizzano la
**closure**, non il valore. `isMarked` viene letto a ogni invocazione del predicato, quindi nessuna
cache va invalidata su un bump di marcatura. Nessun intervento dovuto.

---

## Materiale per il Layer Impact Report (Fase 2)

**Layer toccati dalla fetta M1**, per come la discovery li vede:

- **D-layer (Redux raw)**: NON toccato. Nessuna azione, nessun creator, nessun `SetFieldAction`. La
  sorgente è il singleton di modulo, fuori Redux per costruzione (R-SIM-1).
- **L-layer (proxy)**: NON toccato in scrittura. `isMarked` non passa dai proxy; sul backend lproxy
  è una delega strutturale al draw, come `isKindOf` (`irReadCtxLproxy.ts:47`).
- **JjOM**: NON toccato.
- **Canvas v2-flow**: toccato **in lettura**. Se il canale entra in `useIRContainment` (:189), la
  memo di decorazione gira a ogni bump e restituisce array nuovi di `nodes`/`edges`: è il percorso
  che già gira per `collapseVersion` e `edgeInteractionVersion`, quindi il pattern è precedente, ma
  la frequenza cambia (uno step di simulazione contro un toggle manuale).
- **Canvas classic**: NON toccato.
- **Sync layer (`useJjomSync`, `useM1ReferenceEdges`, `canvasToJjom`)**: NON toccato in M1. È M3
  (migrazione del canale `container`) a entrarci, con la sua discovery.
- **Persistenza (VersionFixer / jsxString)**: NON toccata. Le view IR non hanno VersionFixer (R-B9),
  e `marked` è additivo: un ir senza l'operatore compila esattamente come oggi.

**Interfacce esportate modificate** (regola 11 — solo aggiunte):
- `ReadCtx` (`irReadCtx.ts:17`): metodo nuovo **obbligatorio**. È un'interfaccia esportata e la
  regola 11 vieta di modificarla «except to add optional properties». Un metodo obbligatorio è la
  lettera di R-MK-4 e rompe la lettera della regola 11: i due implementor sono entrambi in-repo e
  vengono aggiornati nello stesso diff, quindi non c'è consumatore esterno da rompere, ma la deroga
  va **dichiarata nel Layer Impact Report**, non presa in silenzio. Alternativa: `isMarked?:` con i
  chiamanti difensivi, che però reintroduce il rischio di un backend che lo dimentica.
- `Predicate` (`irTypes.ts:24`): ramo nuovo in un'unione. Additivo per i produttori, **esaustivo per
  i consumatori** — verificato che nessuno dei quattro siti di dispatch (Q5) usa un
  `never`-exhaustiveness check, quindi nessuno rompe a compile.
- `CompiledView` / `CompiledEdgeView` / `CompiledRowView`: campo `channels` nuovo. Se obbligatorio,
  ogni costruttore va aggiornato (sono tre, tutti in `irCompile.ts`); il precedente della 2a
  (nota 2 della entry di log del 2026-08-17 17:35) ha preferito i campi **opzionali** proprio per la
  regola 11.

**Scenari di smoke candidati** (per la verifica visiva della Fase 2):

1. **Il caso principe, gratuito**: viewpoint con una vertex view su `State` che dichiara
   `fill: { when: {op:'marked'}, then: '#ef4444', else: '#e2e8f0' }`; reset + step dal
   `SimulationPanel`. Atteso: **solo il colore cambia**, il modello no. Controllo che è modello e
   non colore: `windoww.store.getState().idlookup[<objectId>]` invariato prima/dopo lo step, e
   nessuna entry nuova di undo (Ctrl+Z dopo dieci step non annulla gli step).
2. **Il caso che oggi non funziona**: `marked` nel `predicate` di applicabilità di due view
   concorrenti sulla stessa metaclasse (una «marcata», una no, priorità diverse). Atteso: lo step
   cambia **quale view** rende il nodo. È lo scenario che misura l'innesto in `useIRView`; senza,
   il nodo resta sulla view risolta al mount.
3. **Il caso edge**: object-as-edge `Transition` con `line.color` condizionato su `{op:'marked'}`
   sull'edge-object. Atteso: la linea cambia colore allo step. Misura l'innesto in
   `useIRContainment`; senza, non cambia nulla.
4. **Non-regressione dei viewpoint che non autorano `marked`**: aprire un progetto con viewpoint IR
   esistenti e verificare che il canvas sia identico e che `sim-active` continui a funzionare
   (R-MK-8).
5. **Compatibilità del pregresso**: un ir salvato prima di M1 compila e rende identico (`marked`
   assente = nessun canale = nessuna sottoscrizione nuova).

**Verifica anti-regressione dovuta prima del diff**: contare le compilazioni. Se `channels` entra
nella firma di `useIRView`, un bump invalida la memo di ogni nodo; il `compileCache` regge (R8), ma
`resolveIRView` gira per nodo. Su un canvas denso vale un `console.time` temporaneo, rimosso nel
commit di cleanup (§2 di CLAUDE.md).

---

## Domande aperte per Alfonso

1. **`channels` come secondo parametro o come sink di modulo?** R-MK-5 dice «`compilePredicate`
   riceve un secondo insieme accanto a `deps`». Il codice ha già affrontato lo stesso bivio per i
   cross-path e ha scelto il **sink module-scoped** (`irCompile.ts:47`) con una motivazione scritta:
   «threading a second accumulator through all of them would touch every signature». Le firme
   coinvolte sono `compileOperand`, `compilePredicate`, `compileConditional` (chiamata ~25 volte),
   `compileTextStyle`, `compileTextSource`. Si segue la lettera della ratifica (parametro, diff
   larga e meccanica) o il precedente del file (sink, diff stretta)? Le due sono equivalenti nel
   risultato.

2. **`irReadCtx.ts` importa `sim/simRunState`, o `isMarked` viene iniettato?** Il modulo oggi non ha
   nessun import ed è tenuto puro per contratto (:1-13 e il commento di `irReadCtxLproxy.ts:1-6`).
   Tre forme: (a) import diretto, semplice, aggiunge `react` alla catena — verificato innocuo nei
   test node; (b) `makeDrawReadCtx(idlookup, isMarked?)` con la funzione iniettata dal chiamante,
   che tiene la purezza ma tocca i 6 siti di `makeReadCtx`; (c) split di `simRunState` in un core
   react-free più il file dell'hook, che è pulito ma tocca un file appena committato e verificato
   (R-SIM). Preferenza da fissare prima del diff.

3. **`validateIR` acquisisce una regola sulla forma di `Predicate`?** Oggi non ne ha nessuna: la
   validazione dei predicati **è** il compile, e un `op` fuori vocabolario dà un `TypeError` nudo
   (Q6). Una regola «`op` deve appartenere al vocabolario chiuso» darebbe un messaggio leggibile e
   sarebbe la seconda regola authoring-time dopo quella degli endpoint, coerente con R-B9-bis. Ma è
   perimetro in più rispetto a R-MK-9, che elenca «`{op:'marked'}` in irTypes + irCompile, insieme
   dei canali, emendamento §9, test».

4. **Il difetto di `isKind` con `path` (R3): si corregge, si aggira o si registra?** Tre opzioni:
   (a) `marked.path` usa `getRef` e `isKind` resta com'è — due `path?` con semantiche diverse a
   parità di aspetto; (b) si corregge anche `isKind` nello stesso diff — cambia comportamento
   committato, fuori dal mandato M1; (c) si registra e basta, e `marked.path` copia `isKind` — la
   feature nasce inerte in produzione. La (c) la sconsiglio. Prima di scegliere fra (a) e (b) vale
   una verifica in console su un progetto reale (una view con `{op:'isKind', class:'X',
   path:'$ref.value'}` che dovrebbe matchare e non matcha).

5. **`marked` si emenda in v1.2 §3 o in v1.1 §3.3?** Il precedente identico (R-B13, `EndpointExpr`)
   ha scelto il delta in v1.2 lasciando la v1.1 intatta, e la stessa scelta qui tiene la v1.1 come
   documento storico. Confermi?

6. **La «diagnostica di authoring» di R-MK-7 su un path che si esaurisce: che cos'è?** Non esiste un
   canale runtime→pannello (R4). Le uscite realistiche: (i) accontentarsi del `console.warn`
   one-shot sul modello di `warnUnresolvedCrossDeps` (`irCrossDeps.ts:176-190`), che è ciò che il
   codebase fa oggi per un cross-dep irrisolto; (ii) restringere la clausola alla parte statica
   (path malformato → `validateIR`), che già funziona; (iii) costruire il canale, che è una fetta a
   sé. La (i) sembra la lettura più fedele all'intento senza allargare M1.

7. **Il `sim-active` di R-MK-8 e il percorso gratuito (R5).** Vale la pena scrivere subito nel
   codice, accanto a `ObjectNode.tsx:195`, che quella riga è anche il canale di invalidazione dei
   conditional `marked`? Sarebbe una riga di commento in un file fuori dalla lista di M1: chiedo
   invece di farlo.
