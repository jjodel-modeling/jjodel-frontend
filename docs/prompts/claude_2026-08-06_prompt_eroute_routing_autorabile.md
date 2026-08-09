# Prompt Claude Code: E-route, routing autorabile degli edge IR (Manhattan / Direct / Bezier)

**Documento prompt**: 2026-08-06 02:33
**Tipo**: implementazione (Fase 2 dell'arco "Espressività edge v2", slice E-route; la discovery di arco è già stata eseguita il 2026-08-03)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Contesto di esecuzione**: in parallelo alla coda arco A, per decisione esplicita di Alfonso (2026-08-06). Da qui le regole sui file sporchi in Fase 0. Questa sessione non esegue nulla della coda arco A e non tocca i suoi file (`Jsx.tsx`, `ViewData.tsx`, `TemplateData.tsx`, `CLAUDE.md`, `.gitignore`).

## Prima di iniziare

1. Leggere `CLAUDE.md` nella root del repo. In caso di conflitto con questo prompt, segnalare senza procedere.
2. Leggere `docs/claude-code-log.md` per il contesto recente.
3. Se esiste `docs/decisions.md`, leggerlo: contiene decisioni vincolanti; questo prompt vi aggiunge le proprie in chiusura. Se non esiste, segnalarlo e proseguire (la sua creazione appartiene alla coda arco A, non a questa slice).
4. Leggere `docs/discovery/discovery_2026-08-03_edge_expressiveness_v2.md`, Area C (OQ-14, OQ-15, OQ-16) e la sezione rischi. Gli anchor risalgono a inizio agosto e il ramo è avanzato: la Fase 0 li ri-verifica via grep, non fidarsi dei `file:riga` di allora.
5. Il working tree è presumibilmente NON pulito (coda arco A in corso in parallelo). Nessuno stash, checkout, reset. Ogni `git add` è per file espliciti, mai `git add .`.

## CONTESTO (autocontenuto)

Gli edge IR (editor-v2, React Flow) sono renderizzati da `UnifiedEdge` con routing ortogonale fisso in stile Manhattan. Il campo `edge.routing` esiste già in `EdgeViewIR` (`irTypes.ts`) ed è compilato da `compileEdgeView` con default `null` (`irCompile.ts`), ma è un **dead write**: nessuno lo consuma. Questa slice ne implementa il consumo end-to-end: rendering più Select nel pannello di authoring. Vale per **entrambe le nature** (reference-as-edge e object-as-edge) con un solo campo, perché pannello e renderer sono condivisi.

Decisioni già ratificate (2026-08-03), vincolanti:

- **R-B9, vocabolario**: gli identificatori persistiti sono `'orthogonal' | 'straight' | 'curved'`, quelli già dichiarati nel tipo. NON rinominarli e non introdurre un secondo vocabolario: le view IR salvate non hanno VersionFixer. Le etichette UI sono libere; qui si usano "Manhattan", "Direct", "Bezier".
- **R-B10, waypoint**: con routing non ortogonale le gesture dei waypoint spariscono (`SegmentHandles` non montato, creazione disabilitata). I waypoint già persistiti in `DVertex.irEdgeLayout` NON si cancellano e NON si riscrivono: tornano vivi se si torna a `orthogonal`.
- **R-B11, label**: `computeLabelPosition` cammina i punti di una polilinea; su un path non polilinea restituirebbe l'origine del canvas. Questa slice si fa carico dell'ancoraggio della label centrale per `straight` e `curved`.
- **R-B12, gate**: `registerEdgePath` è un registry globale condiviso con gli edge classici, usato per il rilevamento degli incroci; un edge curvo che vi registrasse la polilinea ortogonale fantasma degraderebbe gli altri edge. Le classi dei marker in `EditorV2.scss` sono condivise con gli edge M2 e non si toccano.
- **Semantica del default**: campo assente, `null` e `'orthogonal'` rendono in modo identico all'attuale. Ogni view esistente resta identica a video. Gli edge classic e M2 (class diagram del metamodello) sono fuori dal path IR e NON cambiano in alcun modo.
- Nessuna estensione di schema, nessun bump di `irVersion`: il carrier esiste già.

## FASE 0: re-ancoraggio e fotografia (read-only)

Prima di ogni edit:

1. Fotografare `git log --oneline` dal 2026-08-04 a HEAD e `git status`, e riportarli nel report: servono a sapere cosa della coda arco A è atterrato e cosa è sporco.
2. Ri-ancorare via grep, con `file:riga` a HEAD:
   - **(a)** `edge.routing` in `irTypes.ts`: il tipo dichiara esattamente `'orthogonal' | 'straight' | 'curved'`? `compileEdgeView` in `irCompile.ts` lo compila con default `null`?
   - **(b)** `routing` ha davvero zero consumatori a valle della compile (dead write confermato)? `irValidate` accetta i tre valori, o ignora il campo?
   - **(c)** In `UnifiedEdge.tsx`: dove viene costruito il `d` del path (`computeManhattanPath` o nome reale), e conferma che la scelta degli handle/lati è indipendente dal disegno del path. Questa indipendenza è la condizione che tiene la slice fuori dalla critical zone.
   - **(d)** `SegmentHandles`: sito di mount e condizione attuale di montaggio.
   - **(e)** `registerEdgePath`: tutti i call site, cosa registrano, e come i consumatori del registry usano le polilinee (assumono ortogonalità o trattano polilinee generiche?).
   - **(f)** `computeLabelPosition`: firma e TUTTI i consumatori dei punti della polilinea (label centrale, overlay edgePoint/anchor, `SegmentHandles`, registry). Questo elenco è la superficie completa che oggi assume l'ortogonalità.
   - **(g)** Versione di React Flow in `package.json` e disponibilità di `getStraightPath` / `getBezierPath` (ed eventuali `labelX`/`labelY` restituiti).
   - **(h)** `git status` dei file bersaglio della Fase 1 (almeno `UnifiedEdge.tsx`, `EdgeAuthoringPanel.tsx`, i moduli di path/label): quali sono sporchi.

**DISCOVERY REPORT OBBLIGATORIO**: salvare in `docs/discovery/discovery_2026-08-06_eroute_reanchor.md` con: obiettivo; file letti (path completi); esito punto per punto (a..h) con i `file:riga`; dipendenze e rischi; domande aperte per Alfonso. La Fase 0 non è conclusa finché il report non è scritto.

**REGOLE DI USCITA (hard stop condizionato)**. Fermarsi dopo il report, senza toccare codice, e riportare in chat se una qualsiasi è vera:

1. Un file che la Fase 1 deve toccare è sporco nel working tree con WIP non appartenente a questa slice. Attenzione particolare a `EdgeAuthoringPanel.tsx`, storicamente con WIP dell'arco tab IR: un `git add` su un file misto committerebbe anche il WIP altrui.
2. La scelta degli handle risulta accoppiata al routing ortogonale, cioè `straight`/`curved` richiederebbero una politica di ancoraggio propria: la slice entrerebbe in critical zone (`portDistribution.ts`) e serve go-ahead esplicito più Layer Impact Report.
3. `edge.routing` risulta già consumato da qualcosa, o i valori nel tipo non sono `'orthogonal' | 'straight' | 'curved'`, o `irValidate` li rifiuta.
4. Qualsiasi altra assunzione del CONTESTO non regge a HEAD.

Se nessuna regola scatta, procedere direttamente alla Fase 1 (deciso da Alfonso: esecuzione in un'unica sessione, senza round-trip in chat sul re-ancoraggio verde).

## FASE 1: implementazione

### COSA

1. **Consumo di `edge.routing` nel renderer** (`UnifiedEdge.tsx`), solo dentro il ramo IR già gated su `data.irEdgeViewId` (pattern E0/D1):
   - assente, `null`, `'orthogonal'`: percorso attuale, invariato;
   - `'straight'`: segmento tra gli endpoint attuali (stessi handle); preferire `getStraightPath` di React Flow se disponibile;
   - `'curved'`: bezier tra gli stessi endpoint; preferire `getBezierPath` di React Flow (control point derivati da `sourcePosition`/`targetPosition`); solo in assenza degli helper, costruzione locale minimale con control point sull'asse dell'handle e offset proporzionale alla distanza;
   - handle e ancoraggio NON si toccano (altrimenti regola di uscita 2).
2. **Label centrale su path non polilinea** (R-B11): per `straight` midpoint del segmento; per `curved` il punto della curva (se gli helper RF restituiscono `labelX`/`labelY`, usare quelli; altrimenti valutazione della cubica a t=0.5 in formula chiusa, senza `getPointAtLength` dal DOM). Il caso ortogonale non cambia di un pixel.
3. **Gating dei waypoint** (R-B10): con routing non ortogonale `SegmentHandles` non viene montato e la gesture di creazione waypoint è disattivata, per il solo edge interessato. `DVertex.irEdgeLayout` non si legge per il disegno e non si scrive mai in questa slice.
4. **Gating di `registerEdgePath`** (R-B12): la regola discende dall'esito del punto (e) della Fase 0, per entrambi gli stili nuovi. Se i consumatori del registry trattano polilinee generiche senza assumere ortogonalità: registrare per `'straight'` la polilinea a due punti e per `'curved'` un campionamento della curva a 16 punti. Se invece assumono segmenti ortogonali (anche un segmento diagonale sarebbe fuori contratto): NON registrare nulla per gli edge non ortogonali e documentare con un commento breve nel codice che il crossing detection li ignora. In nessun caso registrare la polilinea ortogonale fantasma. Il modulo del registry non si modifica.
5. **Altri consumatori della polilinea** (dall'elenco del punto f): ogni consumatore non coperto dai punti 2, 3, 4 (per esempio l'overlay edgePoint/anchor) va gatato sull'ortogonale o adattato in modo banale, e l'esito riportato nella sintesi finale. Nessun consumatore deve ricevere punti privi di significato.
6. **Pannello** (`EdgeAuthoringPanel.tsx`): un Select "Routing" a tre voci nella sezione dello stile linea (accanto a color/width/dash), per entrambe le nature, senza gate di natura:
   - etichette: `Manhattan`, `Direct`, `Bezier` (solo testo, niente anteprime: deciso il 2026-08-06);
   - valori scritti nel draft: `'orthogonal' | 'straight' | 'curved'` (R-B9); se l'autore non tocca il campo, non scrivere nulla (assente ≡ `orthogonal`);
   - stesso componente Select e stesso flusso di commit/dirty degli altri campi stile già presenti nel pannello;
   - nessun identificatore nuovo (classi CSS, nomi campo, eventi) senza grep globale preventivo di collisione.
7. **Niente altro**: nessuna modifica a `irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `useJjomSync.ts`, `EditorV2.scss` (classi marker), `markerPresets.ts`, né al modulo del registry. Se una di queste sembra necessaria, fermarsi e riportare.

### DOVE

File bersaglio attesi (la Fase 0 conferma i path reali): `UnifiedEdge.tsx`; il modulo di path/label se `computeManhattanPath`/`computeLabelPosition` vivono fuori da `UnifiedEdge.tsx`; `EdgeAuthoringPanel.tsx`. Elencare nel report ogni file aggiuntivo strettamente necessario (per esempio un import) prima di toccarlo.

### COME

- Diff minimale, zero refactoring opportunistico, mai rinominare identificatori esistenti.
- TypeScript tipizzato; `npm run build` verde al termine.
- Edge classic e M2 identici byte per byte: tutto il comportamento nuovo sta dentro il gate `irEdgeViewId`.
- Un solo commit per la slice, DOPO la verifica visiva: `feat(editor-v2): consume edge.routing in IR edges (manhattan/direct/bezier)`. `git add` dei soli file toccati, elencati uno per uno. Niente push se non richiesto esplicitamente.

## HARD STOP: verifica visiva prima del commit

A build verde, fermarsi e consegnare in chat la checklist per Alfonso (verifica su http://localhost:3001/ con hard refresh):

1. Edge view IR esistenti senza il campo: identiche a prima (Manhattan), waypoint funzionanti.
2. reference-as-edge nei tre stili, cambiati a caldo dal pannello e riflessi sul canvas.
3. object-as-edge nei tre stili.
4. Label centrale ben posizionata nei tre stili; su Bezier al midpoint della curva, non all'origine del canvas.
5. Marker e terminazioni corretti nei tre stili (orientamento del marker sulla tangente in ingresso e in uscita).
6. Su Direct/Bezier: niente maniglie di segmento, niente creazione waypoint; tornando a Manhattan i waypoint preesistenti ricompaiono.
7. Edge M2 del class diagram: invariati.
8. Incroci: gli edge ortogonali tra loro invariati; comportamento con edge curvi come documentato al punto 4 del COSA.
9. Nature miste con stili misti sullo stesso canvas.

Il commit parte solo dopo il GO di Alfonso.

## Chiusura (dopo il GO)

1. Commit come sopra.
2. Entry in `docs/claude-code-log.md`: tipo `feat`, nome del documento prompt "2026-08-06 02:33 E-route routing autorabile", file toccati, esito.
3. Se `docs/decisions.md` esiste, aggiungere in coda: vocabolario `orthogonal|straight|curved` con etichette UI libere (R-B9); waypoint nascosti e mai cancellati su routing non ortogonale (R-B10); gate di `registerEdgePath` per gli edge non ortogonali (R-B12); assente ≡ `orthogonal`; deroga d'ordine del 2026-08-06 decisa da Alfonso (E-route eseguita in parallelo alla coda arco A, prima di F2/F3 e di E-mark/E-lab).

## RIFERIMENTI

- Nel repo: `docs/discovery/discovery_2026-08-03_edge_expressiveness_v2.md` (Area C e rischi); `CLAUDE.md`; `docs/claude-code-log.md`.
- Nel KB di progetto (tracciabilità; non servono per eseguire, questo prompt è autocontenuto): `ratifiche_2026-08-03_edge_expressiveness_decisioni.md` (R-B9..R-B12), `ratifiche_2026-08-02_edge_expressiveness_v2.md` (R-A7), `spec_2026-07-26_ir_edge_authoring_addendum.md` (D3, che questa slice riapre formalmente).
