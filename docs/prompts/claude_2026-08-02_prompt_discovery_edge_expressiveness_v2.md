# Prompt Claude Code: Fase 1 discovery, arco "Espressivita' edge v2"

**Documento prompt**: 2026-08-02 17:20
**Tipo**: discovery read-only (Fase 1 di un arco a tre slice)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Hard stop**: al termine del report. Nessuna modifica al codice, nessun commit.

## Prima di iniziare

1. Leggere `CLAUDE.md`. In caso di conflitto con questo prompt, segnalare senza procedere.
2. Leggere `docs/discovery/discovery_2026-08-02_eobj_object_as_edge_authoring.md` e `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md`. Questa discovery ne e' la continuazione: non ripetere findings gia' scritti, citarli e ri-verificarli solo dove serve. Gli anchor dei due report sono attendibili a `b65bfe78f`, ma il ramo e' avanzato: ri-ancorarsi via grep.
3. Fase read-only assoluta. Nessun edit, stash, checkout, commit, push. Il working tree contiene WIP estraneo: fotografarlo se rilevante, non toccarlo.

## CONTESTO (autocontenuto)

Con E-obj (`d1dc55649`) la superficie di authoring degli edge e' chiusa: rendering IR-driven, natura reference, natura object. Restano tre esigenze di **espressivita'**, raccolte in un arco a tre slice (ratifiche in `ratifiche_2026-08-02_edge_expressiveness_v2.md`):

- **E-mark**: registro dei marker di terminazione, anteprima grafica nelle Select del pannello, famiglia estesa (zampe di gallina ER e simili), opzione **custom** in cui l'autore fornisce il solo contenuto dell'attributo `d` di un path SVG.
- **E-lab**: label agli **estremi** (source e target) oltre alla centrale, per le molteplicita' scritte tipo `0..1` e `1..*`; **flag di editabilita'** della label con vera scrittura verso il modello.
- **E-route**: routing autorabile fra **manhattan, direct, bezier**, per entrambe le nature. Riapre D3, che aveva congelato il routing proprio per tenere l'authoring fuori dalla critical zone.

Le tre slice partono dagli stessi file (renderer dell'edge, spec IR degli edge, pannello di authoring): questa discovery mappa il substrato condiviso una volta sola. **Non deve proporre implementazioni**: deve rendere possibile scrivere tre prompt di implementazione senza altre esplorazioni, e deve dire quale delle tre e' piu' economica di quanto sembri e quale e' piu' cara.

Vincoli architetturali gia' in vigore, da non violare nemmeno nelle opzioni proposte: la natura di una edge view resta **strutturale** (derivata da `!!(sourceExpr && targetExpr)`, `irCompile.ts:430`); la scrittura atomica dei capi non si indebolisce; ogni estensione dello schema deve essere **additiva e opzionale**, senza bump di `irVersion`.

## OBIETTIVO

Rispondere alle OQ-1..OQ-16 con `file:riga` verificati a HEAD.

### Area A — Marker e terminazioni (E-mark)

**OQ-1**. Come sono disegnate oggi le terminazioni? Sono `<marker>` SVG in un `<defs>`, path inline, componenti React, o altro? Definizioni condivise o per-edge? Riportare il sito esatto del disegno e la mappatura completa dai sei valori di `EdgeTermination` (`irTypes.ts:145-151`) al glifo prodotto.

**OQ-2**. **Il sistema di coordinate**: viewBox o equivalente, punto di aggancio (refX/refY o analogo), `markerUnits`, orientamento rispetto alla direzione della linea, dimensione e come scala con lo spessore. Questa risposta e' il contratto che verra' documentato all'autore per i marker custom: va data in modo che si possa copiare in una riga di help.

**OQ-3**. Come i marker ereditano il colore della linea (comportamento E0b): il colore e' applicato al marker, ereditato via `context-stroke`/`currentColor`, o duplicato? Serve a sapere se un path custom eredita gratis o va trattato a parte.

**OQ-4**. Gli stessi marker sono usati anche dalle **edge classiche non-IR**? Se si', quali e dove: e' la superficie di regressione di E-mark.

**OQ-5**. Esiste gia' nel codebase un registro o una mappa di icone/glifi riusabile come modello (o addirittura come sede) per il registro dei marker? Il progetto ammette solo Bootstrap Icons come libreria di icone: dire se e come questo vincolo interagisce con glifi disegnati a mano.

**OQ-6**. Che forma ha oggi il tipo `EdgeTermination` e cosa comporterebbe renderlo **aperto** (valori noti piu' un custom che porta una stringa `d`), restando additivi: quali punti del codice fanno match esaustivo sul tipo e si romperebbero, quali no. Elencarli tutti.

**OQ-7**. Nel pannello, le due Select delle terminazioni (`EdgeAuthoringPanel.tsx`, blocco terminazioni): che componente `Select` e' e **ammette contenuto JSX nelle opzioni** o solo stringhe? Da questa risposta dipende se l'anteprima grafica e' gratis o richiede un widget nuovo.

### Area B — Label (E-lab)

**OQ-8**. Dove e come e' renderizzata la label centrale di un edge, e come e' posizionata. `edge.labels.placement` che valori ammette e chi lo consuma.

**OQ-9**. Esistono gia' punti geometrici agganciabili agli **estremi** della linea (in prossimita' dei marker) utilizzabili per posizionare label di source e target? La geometria attuale li espone, o vanno calcolati? Con quale costo e in quale file.

**OQ-10**. Estensione additiva di `edge.labels` con `source` e `target`: cosa toccherebbe fra `irTypes.ts`, `irCompile.ts`, `irValidate.ts` e il renderer. Dire se e' additiva pura.

**OQ-11**. **Edit della label**: dove nasce l'affordance, che gesture la attiva, dove finisce oggi il valore scritto e perche' non raggiunge il modello. Se nel frattempo e' stato eseguito il fix `fix(editor-v2): disable inline editing of IR-authored edge labels`, descrivere lo stato **dopo** quel fix e citare il report `discovery_2026-08-02_edge_label_editability.md` invece di rifare il lavoro.

**OQ-12**. **Percorso di scrittura all'indietro**: per un edge object-as-edge, dal sito di edit e' raggiungibile `data.irObjectId`? Da li', qual e' il percorso idiomatico nel progetto per scrivere uno slot dell'oggetto (LModel, `$attr.value`), e **passa o non passa da `canvasToJjom.ts`** (critical zone)? Per reference-as-edge: esiste un bersaglio scrivibile sensato, o la label e' sempre derivata da un oggetto terzo? Rispondere con evidenza, non per analogia.

**OQ-13**. Data una label la cui sorgente e' un `TextSource`, come si stabilisce se e' **scrivibile**: literal mai, path solo se risolve a uno slot singolo, intrinsic dipende. Esiste gia' una funzione che valuta la scrivibilita' di un path, o va scritta? Il tipo `PathExpr` e' single-hop (`pathExpr.ts`), il che dovrebbe semplificare.

### Area C — Routing (E-route)

**OQ-14**. Dove e' calcolato il path ortogonale (`computeManhattanPath` o nome reale), in quale file, e **chi sceglie gli handle**, cioe' da quale lato del nodo esce e entra la linea. La scelta degli handle e' accoppiata al routing ortogonale o e' indipendente?

**OQ-15**. **La domanda che decide il costo di E-route**: direct e bezier possono riusare gli handle scelti dalla logica attuale cambiando solo il path disegnato, oppure pretendono una politica di ancoraggio propria? Nel secondo caso, quali file entrano in gioco e **quanti di essi stanno nella critical zone** (`portDistribution.ts`, `edgeUtils` o equivalente)? Se la risposta e' "entra la critical zone", dirlo in evidenza nel report: cambia il profilo di rischio dell'intera slice e richiede go-ahead esplicito piu' Layer Impact Report.

**OQ-16**. Che fine fanno i **waypoint e i side pin persistiti** in `DVertex.irEdgeLayout`, che sono artefatti ortogonali, se la stessa edge passa a direct o bezier: vengono ignorati, producono geometria incoerente, o rompono qualcosa? E: la versione di ReactFlow in uso espone gia' helper di path (straight, bezier, smoothstep) utilizzabili, o il progetto disegna tutto da se'?

## DISCOVERY REPORT (obbligatorio)

Salvare in `docs/discovery/discovery_2026-08-02_edge_expressiveness_v2.md` (creare la cartella se manca). La Fase 1 non e' conclusa finche' il file non e' scritto: l'analisi in chat parte dal report salvato.

Contenuto minimo: obiettivo; file letti con path completi; findings per area, OQ per OQ, con i `file:riga` che li sostengono; **dipendenze e rischi**, con evidenza esplicita su quali slice toccano la critical zone e quali no; **domande aperte per Alfonso**, come alternative con il costo di ciascuna; **mappa dei file candidati**, separata per slice (E-mark, E-lab, E-route), con una riga per file sul tipo di intervento previsto.

Aggiungere una sezione finale **"Costo relativo delle tre slice"**: per ciascuna, ordine di grandezza dell'intervento, se e' additiva o invasiva, e se il perimetro resta fuori dalla critical zone. Serve a decidere l'ordine di implementazione, che oggi e' solo indicativo.

## Vincoli

- Read-only assoluto. Nessuna patch proposta nel report: opzioni con costo, non soluzioni scritte.
- Leggere per intero i file prima di citarli; correggere nel report gli anchor sbagliati ereditati dai documenti precedenti.
- Critical zone in sola lettura, e solo dove una OQ lo richiede.
- Se una OQ non e' rispondibile con la sola lettura, scriverlo come tale invece di inferire.

## Output e chiusura

1. Report salvato.
2. Entry in `docs/claude-code-log.md`, tipo `docs`, che cita questo documento prompt con data e ora (2026-08-02 17:20).
3. **HARD STOP**. In chat: sintesi in dieci righe con la risposta a OQ-15 in prima posizione (e' quella che decide il rischio dell'arco) e le due cose che piu' cambiano il progetto delle slice.

## RIFERIMENTI

- Ratifiche dell'arco: `ratifiche_2026-08-02_edge_expressiveness_v2.md` (KB), R-A1..R-A8.
- Addendum edge: `spec_2026-07-26_ir_edge_authoring_addendum.md` (KB), D1..D9; D3 (routing congelato) e §5 (slice future) sono cio' che questo arco riapre.
- Ratifiche E-obj: `ratifiche_2026-08-02_eobj_object_as_edge.md` (KB), vincoli ancora in vigore.
- Discovery precedenti: `docs/discovery/discovery_2026-08-02_eobj_object_as_edge_authoring.md`, `discovery_2026-07-26_edge_authoring_substrate.md`, ed eventualmente `discovery_2026-08-02_edge_label_editability.md`.
- Mappa di copertura: `mappa_sintassi_concreta.md` (KB), sezione Edge.
