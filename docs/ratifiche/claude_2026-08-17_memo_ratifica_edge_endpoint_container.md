# Memo di ratifica — Endpoint `container` per l'irKind Edge

**Data**: 2026-08-17
**Branch**: `alfonso-frontend-jjtl`
**Report di riferimento**: `docs/discovery/discovery_2026-08-17_edge_source_container.md`
(HEAD della discovery: `f6794dc81`), incluso l'addendum di misura in coda
**Ratificato da**: Alfonso, 2026-08-17, in chat di progetto, in due passi: le sette posizioni
dell'analisi, poi la posizione 1 aggiornata dopo la misura in console

## La misura che ha aggiornato il design

Le cinque istanze di `Transition` del progetto di test hanno tutte `father` di className
`DValue`: **forma (b), annidata**, prodotte dall'editor dello slot di containment. La forma (b)
è quindi il percorso di authoring naturale per gli oggetti contenuti, non un caso esotico da
API classica. Una v1 con precondizione «forma (a)» avrebbe tagliato il caso d'uso motivante.
Nota collaterale: la simulazione (serie R-SIM) ha funzionato su oggetti in forma (b): la
navigazione via proxy è indifferente alla forma; il gap è solo del canvas.

## La decisione

1. **La sintesi object-as-edge si disaccoppia dai vertici** (chiude R1 del report). Il walk di
   composizione dalle radici del modello produce due cose: la mappa completa `containerOf`
   (child → container) e l'insieme dei candidati object-as-edge, con o senza vertice. Il
   vertice resta obbligatorio **solo agli endpoint**. Forma (a): nodo nascosto ed edge propri
   filtrati, come oggi. Forma (b): niente da nascondere, ramo più semplice. Gli oggetti
   annidati non hanno bisogno di esistere come nodi: hanno bisogno di esistere come archi.
2. **`containerOf` è una seconda mappa in `ContainmentModel`**, completa e senza il filtro
   graphVertex; `parentOf` esistente resta intatta (R7 evitato). La mappa è passata a
   `synthesizeObjectAsEdges` come parametro: il modulo resta puro. **`ReadCtx` non si tocca**:
   la sua superficie resta riservata all'estensione `state` di R-SIM-4 (R8 dissolto).
3. **Reattività**: la v1 usa il segnale dei due hash generici del sync
   (`useM1ReferenceEdges.m1RefValuesSig`, hash per-vertice di `useJjomSync`), **previa misura
   obbligatoria** a fine slice 2a (scrittura dello slot di contenimento, l'edge sintetico deve
   riagganciarsi). La clausola entra nell'emendamento di spec §9; la «dipendenza dal
   contenitore» nel dependency set è estensione futura con ratifica propria.
4. **Grammatica**: `container` resta fuori da `PathExpr` (§3.1 v1.1 intatta); in spec §7 il
   tipo endpoint diventa `EndpointExpr = PathExpr | 'container'`. Vocabolario in costante
   esportata (precedente `VALID_ROUTING_VALUES`); grafia definitiva `container`, minuscolo,
   nudo (R-B9: le view IR salvate non hanno VersionFixer). `$container.value` resta una
   feature legale: le due grafie non collidono (misurato nel report, §Metodo).
5. **Authoring**: controllo dedicato «Reference path / Containing element» accanto al
   `PathBuilder` (opzione 2 del report §Q5). Il `PathBuilder` non vede mai il token, quindi il
   difetto di round-trip R5 si dissolve per costruzione. Un `container` già persistito si
   preserva sempre, mai sanificato (disciplina inversa di `dropInvalidRouting`).
6. **Doppio `container`** (source e target insieme): ammesso, self-loop sul contenitore.
   Nessun divieto in `validateIR`; si vieta dopo, se confonde, senza rompere il pregresso.
7. **R3 accettato, R4 no.** La connect rule spenta sull'estremo `container` è corretta e si
   dichiara: creare un figlio contenuto non è «connettere». La perdita del pin di lato al
   reconnect (R4) si corregge: il guard di `handleReconnect` va riordinato perché
   `setIREdgeAnchorOverride` giri anche quando l'estremo non ha feature.

## Contratto d'ordine (da R6 del report)

Render permissivo verso il token **prima** dell'autorabilità. Sequenza vincolante: compile
permissivo → risoluzione + render (`containerOf`, iterazione estesa) → **misura di
reattività** → regola in `validateIR` (prima regola endpoint) → UI → guard R4 → emendamenti
spec (§3, §6, §7, §9, §10) e righe di decisione. Due slice: **2a** fino alla misura inclusa,
hard stop; **2b** il resto.

Deroga a §10, dichiarata: un oggetto-edge senza vertice con endpoint irrisolvibile resta
invisibile com'è oggi (nessuna card di fallback in v1, nessuna regressione).

## Alternative scartate

1. **Precondizione «forma (a)»**: taglia il caso d'uso motivante (misura in console: 5/5 in
   forma b) e obbliga a fixture artificiali.
2. **Settimo metodo su `ReadCtx`**: contratto pulito ma collide con la superficie che
   R-SIM-4 assegna al namespace `state`; da sequenziare, quindi da evitare ora.
3. **Riuso di `parentOf`**: parziale per costruzione (solo figli di container con view
   graphVertex, `irContainment.ts:169-170`); accoppierebbe l'endpoint alla view del padre.
4. **Voce sentinella dentro `PathBuilder`**: sporca un componente condiviso con
   `PredicateBuilder` e `ConditionalEditor`, dove `container` non significa niente; e lascia
   vivo R5.
5. **Allargare `PathExpr`**: renderebbe il vocabolo legale in predicati, label, conditional,
   `TextSource`, `childFilter`, dieci posti dove non ha semantica.
6. **Divieto del doppio `container`**: regola in più senza guadagno.
7. **Dare un vertice agli oggetti annidati**: cambia la semantica del canvas ovunque per
   risolvere un problema che la sintesi disaccoppiata risolve localmente. Resta tema di
   backlog autonomo, se mai servirà per altre ragioni.

## Prossimo passo

Prompt della slice 2a (compile permissivo, `containerOf` + candidati, iterazione estesa,
misura di reattività, test unitari sul mondo edge di `ir.test.ts`), corsia completa. La 2b
(validateIR, authoring, R4, spec) parte solo dopo l'esito della misura.
