# Prompt Claude Code: Fase 1 discovery, E-obj (authoring object-as-edge)

**Documento prompt**: 2026-08-02 15:34
**Tipo**: discovery read-only (Fase 1 di un two-phase)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Hard stop**: al termine del report. Nessuna modifica al codice, nessun commit.

## Prima di iniziare

1. Leggere `CLAUDE.md`. In caso di conflitto con questo prompt, segnalare il conflitto senza procedere.
2. Leggere `docs/claude-code-log.md` (ultime entry, in particolare quella della fase E-ref: serve l'hash del commit e la lista dei file toccati).
3. Leggere il discovery report precedente `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md`. Questa discovery ne è la continuazione: non ripetere findings già scritti là, citarli e verificarne solo la validità a HEAD dove serve.
4. Fase read-only. Nessun edit, nessuno stash, nessun checkout, nessun commit. Se il working tree contiene WIP, lasciarlo intatto e limitarsi a fotografarlo (Area 5).

## CONTESTO (autocontenuto)

Jjodel definisce la sintassi concreta dei modelli tramite un IR autorabile da UI. Le view IR hanno tre `kind`: `vertex` (nodo), `row` (riga dentro un compartimento), `edge` (linea). Per il kind `edge` esistono due nature:

- **reference-as-edge**: una EReference resa come linea. Matcha su metaclasse-sorgente più nome della reference. Capi intrinseci al link, nessun carrier di layout. Authoring **già landato** (fase E-ref, `EdgeAuthoringPanel.tsx`, verificato a HEAD origin `07cee5219`).
- **object-as-edge**: un `DObject` reificato reso come linea. Matcha sulla metaclasse propria. Capi presi da `edge.source` / `edge.target` (PathExpr). Carrier di layout = DVertex nascosto, persistenza già viva (`DVertex.irEdgeLayout`). Rendering già acceso dalla fase E0. Authoring **assente**: è l'oggetto di questa discovery.

La fasizzazione ratificata è E0 (rendering) → E-ref (authoring reference) → **E-obj (authoring object)**. E-obj è l'ultima voce aperta della superficie di authoring: chiuderla porta la sintassi concreta a v1 completo su vertici, righe ed edge.

Decisioni già ratificate che vincolano questa discovery:

- **D8**: `EdgeAuthoringPanel` è un pannello unico per il kind edge, non un pannello per natura. Per il ramo object, l'addendum ipotizzava di allargare `MatchingSection` a `EdgeViewIR`; il ramo reference usa invece matching inline. La scelta finale non è presa: questa discovery deve fornire il costo delle due strade.
- **R-3 (E-ref)**: il toggle di natura è stato deliberatamente rinviato a E-obj. Oggi in `EnableIRPanel` il kind edge seeda solo la natura reference.
- **D3/D4**: routing congelato (Manhattan, SNAP=8), nessun carrier di persistenza nuovo. Fuori scope.
- La critical zone (`useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `syncState`) resta **fuori** da E-obj. Se la discovery trova che il ramo object la richiede, è un finding di prima grandezza da scrivere in evidenza nel report.

## OBIETTIVO DELLA DISCOVERY

Rispondere, con `file:riga` verificati a HEAD, alle domande OQ-1..OQ-12 qui sotto. L'esito atteso è che dopo la lettura del report si possa scrivere il prompt di implementazione E-obj senza altre esplorazioni.

### Area 1 — Discriminante di natura (la domanda centrale)

**OQ-1**. Come il resolver assegna una `EdgeViewIR` al bucket `objectAsEdgeByMetaclass` invece che a `edgeByMetaclass` / `edgeWildcard`? Riportare il punto esatto della decisione (`irResolveCore.ts`, intorno a `:44-60` e `:116-141`, ri-ancorarsi ai nomi via grep) e dire se il discriminante è **esplicito** (un campo dell'IR che dichiara la natura) o **strutturale** (dedotto dalla presenza o assenza di `reference`, `edge.source`, `edge.target`).

**OQ-2**. Elencare il tipo `EdgeViewIR` completo da `irTypes.ts`: tutti i campi, quali obbligatori, quali esclusivi di una natura, e se esiste già un campo che nomina la natura. Verificare in `irValidate.ts` se esistono vincoli incrociati (per esempio: `reference` e `edge.source` mutuamente esclusivi) o se oggi una view ibrida passa la validazione.

**OQ-3**. `synthesizeObjectAsEdges` (in `irEdgeViews.ts`, cablato da `useIRContainment.ts:158`): cosa legge dalla compiled view per costruire nodo nascosto e linea sintetica? Quali campi sono **indispensabili** perché una object-as-edge view sia funzionante a canvas? Cosa succede oggi se `edge.source` / `edge.target` sono assenti, o se il path non risolve (crash, edge mancante, fallback silenzioso)? Questo determina cosa il pannello deve rendere obbligatorio in UI.

**OQ-4**. `compileEdgeView` (`irCompile.ts:382-428`): quali default applica, e differiscono fra le due nature? Serve per sapere quali chiavi il pannello deve poter droppare senza cambiare il rendering.

### Area 2 — Il pannello E-ref esistente

**OQ-5**. Struttura reale di `authoring/EdgeAuthoringPanel.tsx` a HEAD: sezioni del form, forma dello stato draft, `dirtyRef`, reset su cambio view, debounce di commit, quali chiavi scrive e quali droppa. Marcare esplicitamente **quali punti sono hardcoded sulla natura reference** (per esempio il Select delle reference della metaclasse sorgente) e quali sono già neutri rispetto alla natura (stile linea, terminazioni, label center, predicate, priority).

**OQ-6**. `authoring/EnableIRPanel.tsx`: forma attuale di `KIND_OPTIONS`, del tipo dello stato `kind`, del ramo di seed per edge, e del guard anti-reseed. Più `defaultEdgeViewIR()` in `ir/irDefaults.ts`. Indicare i punti minimi da toccare in due scenari alternativi: (a) due voci distinte nel selettore di kind (edge-reference / edge-object), (b) una voce edge unica più una scelta di natura dentro il pannello.

**OQ-7**. `editors/views/ViewData.tsx`: predicato `showIRTab` e routing del kind edge così come sono ora (intorno a `:57-58` e al blocco di routing). Dire se il routing dipende dalla natura o solo dal kind.

### Area 3 — Matching e widget riusabili

**OQ-8**. `authoring/MatchingSection.tsx`: firma, tipizzazione (è legata a `VertexViewIR`?), campi che tocca (`metaclasses`, `predicate`, `priority`, `exclusive`), e **chi la usa oggi**. Quantificare il costo reale delle due strade per il ramo object: allargare la tipizzazione a `EdgeViewIR` (rischio di regressione sul vertice, quanto grande) contro replicare il matching inline come già fa il ramo reference (quanta duplicazione, quante righe). Nessuna raccomandazione nel report: solo i due costi misurati.

**OQ-9**. Esiste un widget riusabile per autorare una **PathExpr** (il PathBuilder citato nei prompt R3)? Dove vive, qual è la sua API, in quali pannelli è già usato, e il tipo che produce coincide con quello che `edge.source` / `edge.target` si aspettano? Se non coincide, misurare la distanza: adattatore sottile o widget nuovo.

**OQ-10**. `exclusive`: è presente in `EdgeViewIR` e il resolver lo consuma per gli edge? La fase E-ref lo ha omesso dal pannello (R-5). Dire se per il ramo object c'è una ragione tecnica per introdurlo o se l'omissione resta coerente.

### Area 4 — Verifica e ambiente di prova

**OQ-11**. `__tests__/edgeAuthoring.test.ts`: cosa copre oggi, e quali casi si estendono naturalmente al ramo object (seed valido, drop delle chiavi, round-trip senza corruzione, routing del kind).

**OQ-12**. Ambiente per la verifica visiva di Alfonso. Esiste in repo uno snippet o un helper di console per seedare una object-as-edge view (residuo della fase E0)? Se sì, dove. Poi: fra i metamodelli di test presenti nel repo o citati nei documenti, ce n'è uno con una **relazione reificata** (una classe che rappresenta un collegamento, con due reference verso gli estremi) utilizzabile come banco di prova? Se non c'è, dire cosa servirebbe costruire, in due righe.

### Area 5 — Fotografia dello stato git (nessuna azione)

Riportare nel report, senza agire:

- output di `git log origin/alfonso-frontend-jjtl..HEAD --oneline` (commit locali non pushati);
- output di `git status --short` (WIP nel working tree);
- per ogni file che questa discovery indica come candidato all'edit in Fase 2, dire se ha modifiche non committate.

Serve ad Alfonso per decidere se pushare prima di aprire E-obj. Non pushare, non stashare, non committare.

## DISCOVERY REPORT (obbligatorio)

Al termine, salvare il report in `docs/discovery/discovery_2026-08-02_eobj_object_as_edge_authoring.md`. Se la cartella non esiste, crearla. La Fase 1 non è conclusa finché il file non è scritto: l'analisi in chat parte dal report salvato, non dall'output del terminale.

Contenuto minimo:

- **Obiettivo** della discovery, in tre righe.
- **File letti**, con path completi.
- **Findings** per area, organizzati OQ per OQ, ognuno con i `file:riga` che lo sostengono.
- **Dipendenze e rischi**: cosa può rompersi toccando i file candidati, in particolare regressioni sul ramo reference già verificato e sul vertice se si allarga `MatchingSection`.
- **Domande aperte per Alfonso**: le decisioni che la discovery non può prendere, formulate come alternative con il costo di ciascuna.
- **Mappa dei file candidati alla Fase 2**, con una riga per file sul tipo di intervento previsto.

## Vincoli

- Read-only assoluto: nessun edit, nessun commit, nessuno stash, nessun checkout, nessun push.
- Nessuna patch proposta nel report: opzioni con costo, non soluzioni scritte.
- Leggere per intero i file prima di citarli. Le righe indicate in questo prompt sono anchor indicativi presi da documenti precedenti: ri-ancorarsi ai nomi via grep e correggere gli anchor sbagliati nel report.
- Non aprire la critical zone se non per lettura, e solo se una OQ lo richiede.
- Se una OQ non è rispondibile con la sola lettura, scriverlo nel report come tale invece di inferire.

## Output e chiusura

1. Report salvato in `docs/discovery/discovery_2026-08-02_eobj_object_as_edge_authoring.md`.
2. Entry in `docs/claude-code-log.md`, tipo `docs`, che cita questo documento prompt con data e ora (2026-08-02 15:34).
3. **HARD STOP**. In chat: sintesi in dieci righe con le tre cose che più cambiano il progetto della Fase 2, e nient'altro.

## RIFERIMENTI

- Addendum ratificato: `spec_2026-07-26_ir_edge_authoring_addendum.md` (KB), decisioni D1..D9, fasizzazione §4, confine critical zone §3.
- Discovery precedente: `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md` (repo).
- Prompt della fase precedente: `2026-07-27_prompt_faseEref_edge_authoring_panel.md` (KB), utile per il perimetro file già toccato da E-ref.
- Template di pannello: `RowAuthoringPanel.tsx` (fase R3, commit `d1e6f9992`).
- Mappa di copertura: `mappa_sintassi_concreta.md` (KB), riga "Authoring object-as-edge (E-obj)".
- Siti chiave dai documenti precedenti, da riverificare: `irResolveCore.ts:44-60,116-141,256-320`, `irCompile.ts:382-428`, `irEdgeViews.ts:49-72,118-257`, `irContainment.ts:240-277`, `useIRContainment.ts:152,158`, `ViewData.tsx:57-58`, `EnableIRPanel.tsx:8-11`.
