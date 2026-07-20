# Discovery: i 986/1000 edge del benchmark a scala 1000

Data: 2026-07-19. Sessione read-only su `/home/claude/jjodel-frontend`, branch `alfonso-frontend-jjtl`, build di produzione servita con `vite preview`. Strumentazione eseguita solo su copie fuori dal repo (`/home/claude/benchwork/`).

## Obiettivo

Il benchmark baseline (Fase 0) renderizza sempre 986 edge nello scenario 500 Task / 1000 next-link, identici su 6 run e 2 macchine. Obiettivo: identificare quali edge mancano e perché.

Risultato anticipato: il "14" del titolo è un artefatto di conteggio. Gli edge mancanti sono in realtà 514 su 1500 presenti nello store (22 `next` su 1000, più 492 `tasks` su 500). Il numero 986 nel DOM è la somma di 978 `next` renderizzati e 8 `tasks` renderizzati; confrontarlo con 1000 produce il "14" apparente. La root cause è unica e confermata: overflow dell'indice handle oltre `MAX_HANDLES_PER_SIDE`, con drop silenzioso dell'edge da parte di React Flow.

## File letti

- `/home/claude/jjodel-frontend/docs/benchmarks/README.md`
- `/home/claude/jjodel-frontend/frontend/scripts/benchmarks/bench_baseline.mjs`
- `/home/claude/jjodel-frontend/frontend/scripts/benchmarks/generate_synthetic_model.py`
- `/home/claude/jjodel-frontend/frontend/scripts/benchmarks/bench.xmi` (parsato per la distribuzione dei gradi)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/utils/portDistribution.ts`
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/components/DynamicHandles.tsx`
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/utils/jjomTransformers.ts` (`computeOptimalHandles`, `jjomEdgeToRFEdge`)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/hooks/useJjomSync.ts` (Step 2, 2bis, 4; sync incrementale; layout di default 3 colonne)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/EditorV2.tsx` (`applyDistribution` righe 955-1059, `handleAutoLayout` righe 3016-3070)
- `/home/claude/jjodel-frontend/frontend/src/components/editor-v2/hooks/useAutoAnchor.ts` (`computeGeometricAnchorsForAllEdges`)

Artefatti prodotti fuori dal repo: `/home/claude/benchwork/bench_missing_edges.mjs` (copia strumentata dell'harness), `/home/claude/benchwork/missing_edges.json` (dump completo del diff Redux vs DOM), `/home/claude/benchwork/flow.png`.

## Come conta l'harness

`bench_baseline.mjs` conta con una query DOM: `document.querySelectorAll('.react-flow__edge').length`, campionata ogni secondo fino a 30 s di stabilità. Il conteggio è quindi "edge effettivamente renderizzati da React Flow", di qualunque tipo (`instanceRef`, `composition`), non "edge next attesi". Qui sta l'errore di lettura: il grafo contiene anche i 500 edge di containment `tasks` (Board verso ogni Task), che il README non considera. Il DOM a settle contiene 986 edge = 978 `next` + 8 `tasks`. Il conteggio in sé è corretto e deterministico; è il denominatore 1000 a essere sbagliato.

## Distribuzione attesa del modello sintetico

Generatore deterministico (seed 42): 500 Task, 1000 link `next` distinti, nessun self-loop, nessuna coppia duplicata, 2 coppie bidirezionali (t101 e t366, t341 e t4). Gradi massimi: out-degree 7 (t112), in-degree 9 (t135). Nodi con out-degree > 4: 12 (eccedenza totale 15). Nodi con in-degree > 4: 29 (eccedenza totale 44). In piu il modello ha l'oggetto radice Board con 500 valori nel reference di containment `tasks`: da qui i 500 edge `composition` aggiuntivi nel canvas (out-degree 500 su un singolo nodo).

## Analisi statica della capacità handle

La pipeline degli handle funziona così:

1. `jjomTransformers.ts:computeOptimalHandles` assegna il lato iniziale per asse dominante (dy vs dx tra i centri dei vertici).
2. Al primo open con grafo appena creato, `EditorV2.tsx:handleAutoLayout` esegue il layout ELK, poi ricalcola i lati sulla geometria finale (`computeGeometricAnchorsForAllEdges`) e chiama `applyDistribution`.
3. `portDistribution.ts:computePortDistribution` STEP 1 raggruppa gli edge per bucket `(nodo, lato, ruolo)`; ogni edge non-inheritance è un gruppo a sé. STEP 3 (righe 162-178) assegna `handleId = ${side}-${index}` dove `index` è la posizione del gruppo nel bucket, SENZA alcun limite superiore. `MAX_HANDLES_PER_SIDE = 4` (riga 258) è usato solo da `getNextFreeHandleIndex`, non da `computePortDistribution`.
4. `DynamicHandles.tsx` (riga 220) renderizza esattamente `MAX_HANDLES_PER_SIDE` handle per lato: gli id esistenti nel DOM sono solo `side-0` .. `side-3`.
5. React Flow (@xyflow/react 12.10) scarta un edge il cui `sourceHandle` o `targetHandle` non corrisponde a nessun handle misurato sul nodo. In build di produzione il drop è silenzioso: la run strumentata ha catturato zero warning console.

Conseguenza: ogni bucket `(nodo, lato, ruolo)` con più di 4 edge produce indici 4, 5, 6... e quegli edge spariscono. La capacità teorica per nodo è 4 lati x 4 = 16 per ruolo, ma solo se la geometria distribuisce gli edge su tutti i lati; in pratica i lati utili sono 2 (asse dominante verticale nella maggior parte dei casi), quindi la capacità effettiva è circa 8 per ruolo.

Simulazione statica sulla griglia iniziale (3 colonne, 420x300, senza ELK): 22 edge `next` scartati. La geometria finale è però quella ELK, che cambia QUALI edge sfondano ma non l'ordine di grandezza: la conferma dinamica ha misurato di nuovo esattamente 22 `next` mancanti (insieme parzialmente diverso da quello della griglia). Per Board la stima è immediata: 500 edge in uscita, tutti i Task stanno sotto/a destra del Board (posizionato in alto a sinistra), quindi 2 lati x 4 = 8 renderizzabili e 492 scartati. Osservato: esattamente 8.

## Conferma dinamica

Procedura: copia strumentata dell'harness in `/home/claude/benchwork/bench_missing_edges.mjs` (stesso flusso: progetto offline fresco, import ecore + xmi, apertura modello, attesa settle con soglia 45 s), poi diff nel browser tra gli edge del grafo v2-flow in Redux (`windoww.store.getState()`, subElements con className Edge) e gli edge presenti nel DOM (`data-id` degli elementi `.react-flow__edge`). Mount a +486 s, settle confermato, 986 edge nel DOM, riproduzione esatta del valore del benchmark.

Numeri a settle:

| Categoria | Nello store | Nel DOM | Mancanti |
| --- | --- | --- | --- |
| `next` (instanceRef) | 1000 | 978 | 22 |
| `tasks` (composition, Board verso Task) | 500 | 8 | 492 |
| Totale | 1500 | 986 | 514 |

I 22 edge `next` mancanti (id istanza ricavati dal mapping vertice-oggetto, validati tutti contro bench.xmi):

t112 verso t249; t128 verso t497; t140 verso t23; t208 verso t47; t223 verso t310; t226 verso t282; t232 verso t325; t233 verso t282; t296 verso t310; t320 verso t122; t321 verso t124; t337 verso t98; t342 verso t442; t349 verso t127; t403 verso t405; t421 verso t232; t424 verso t337; t475 verso t276; t481 verso t441; t492 verso t135; t496 verso t47; t497 verso t440.

Tutti hanno reference `next`. Gli id Redux degli edge (formato `Pointer..._USER_...`) sono specifici della run e salvati in `/home/claude/benchwork/missing_edges.json` insieme a posizioni dei vertici e id dei vertex.

Verifica di coerenza con la root cause: 19 dei 22 edge hanno un endpoint con grado >= 5 (t135 indeg 9, t440 e t442 e t276 indeg 7, t310 e t124 indeg 6, t112 outdeg 7, ecc.). I 3 restanti (t140 verso t23, t337 verso t98, t349 verso t127) hanno target con indeg 4: il quinto edge che satura il bucket è l'edge `tasks` in arrivo dal Board sullo stesso lato. Gli 8 edge `tasks` renderizzati sono Board verso t0, t1, t2, t3 (un lato) e Board verso t25, t51, t77, t103 (altro lato): esattamente 4 + 4, la firma del clamp a 4 handle per lato.

Nota sul "14": il benchmark riportava 986/1000 assumendo che il DOM contenesse solo edge `next`. In realtà 8 dei 986 sono edge `tasks`. I mancanti veri sono 22 `next`, non 14. Il conteggio 986 resta deterministico perché layout ELK, ordinamento spaziale dei bucket e drop sono tutti deterministici a parità di input.

## Root cause

Confidenza: alta.

`computePortDistribution` (STEP 3, `portDistribution.ts` righe 162-178) assegna indici handle illimitati, mentre il pool DOM di `DynamicHandles.tsx` è fisso a `MAX_HANDLES_PER_SIDE = 4` per lato. Ogni edge che riceve un indice >= 4 punta a un handle inesistente e React Flow lo scarta silenziosamente (nessun warning in produzione). Succede su ogni bucket `(nodo, lato, ruolo)` con più di 4 edge: i nodi `next` ad alto grado (in-degree fino a 9 concentrato su 1-2 lati) e in modo massiccio il Board (500 edge `tasks` in uscita, 8 renderizzabili).

Evidenze: (1) riproduzione esatta del 986 con diff Redux vs DOM; (2) 514 mancanti tutti spiegati dalla saturazione dei bucket; (3) gli 8 `tasks` superstiti sono esattamente 4 + 4 su due lati; (4) i 3 edge mancanti con endpoint a grado 4 sono spiegati dal quinto edge `tasks` sullo stesso lato; (5) il conteggio è insensibile a timing e macchina, coerente con un meccanismo puramente geometrico-deterministico. Questo è lo scenario anticipato da CLAUDE.md §3.10 ("handle index overflow beyond MAX_HANDLES_PER_SIDE and missing edges"), qui confermato con numeri.

Le piste alternative sono escluse: il dedup Step 3/4 di useJjomSync non collassa nulla (le chiavi composite `${metaId}:${src}→${tgt}` sono tutte distinte: 1000 coppie distinte nel modello, verificato); lo store contiene tutti i 1500 edge; il conteggio DOM dell'harness è corretto per quello che misura.

## Fix candidato (non implementato)

Chirurgico, un solo file: `frontend/src/components/editor-v2/utils/portDistribution.ts`, STEP 3, riga 166.

Oggi:

```typescript
const handleId = `${side}-${index}`;
```

Proposta: clamp dell'indice alla capacità del pool.

```typescript
const handleId = `${side}-${Math.min(index, MAX_HANDLES_PER_SIDE - 1)}`;
```

Effetto: gli edge oltre il quarto per bucket condividono l'ultimo handle del lato invece di sparire. Visivamente si sovrappongono sull'ancora (accettabile a questa scala; è lo stesso comportamento di fallback di `getNextFreeHandleIndex`, che ritorna 0 quando il lato è pieno). Nessun edge perso: 1500/1500 renderizzati. `MAX_HANDLES_PER_SIDE` è già importato nel file (definito riga 258, prima del punto d'uso ma è una `const` a livello di modulo, hoisting non problematico perché STEP 3 è eseguito a runtime dentro la funzione).

Da valutare in seguito, non in questo fix: STEP 4 (righe 211-223) genera `PortInfo` con gli stessi indici illimitati, ma quell'output è scartato da EditorV2 (§3.10), quindi il clamp lì è facoltativo per coerenza. Alzare `MAX_HANDLES_PER_SIDE` invece NON è un fix: nessun valore ragionevole copre un hub con 500 edge in uscita.

Attenzione: file in critical zone (§3.1). Il task di fix richiede Layer Impact Report e go-ahead esplicito.

## Domande aperte per Alfonso

1. Il clamp fa condividere l'handle all'eccedenza: a scala 1000 le sovrapposizioni su nodi ad alto grado sono accettabili come baseline, o serve una policy di distribuzione (per esempio round-robin sugli indici del lato) per spalmare l'eccedenza sui 4 handle invece che accumularla sull'ultimo?
2. Gli edge `tasks` del Board (500 composition da un solo nodo) hanno senso nel benchmark? Se il confronto Fase 4 vuole misurare solo i `next`, conviene o correggere il denominatore nel README (986 su 1500, di cui 978/1000 next) o sopprimere il vertice Board nello scenario.
3. Il drop silenzioso di React Flow in produzione (zero warning) maschera qualunque futura regressione dello stesso tipo. Vale la pena aggiungere un guard di sviluppo (per esempio un `console.warn` in `applyDistribution` quando un indice supera il pool)?
4. Il README dei benchmark attribuiva i 14 mancanti al bug noto "edge non tracciabile nel flow" (discovery §5.3): con questa root cause quella nota va corretta; verificare se anche quel bug storico sia in realtà lo stesso overflow.
