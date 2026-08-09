# Prompt Claude Code: Discovery READ-ONLY del substrato edge (verso l'edge authoring IR)

**Data**: 2026-07-26 11:27
**Aggiornato**: 2026-07-26 — recepita la decisione di Alfonso: **object-as-edge E reference-as-edge sono entrambe in scope** (nessuna delle due e' rinviata). Aggiunte le quattro domande obbligatorie in testa al report e la distinzione delle due nature nelle aree 1, 3, 4, 5, 6, 7.
**Tipo**: discovery (Fase 1 del two-phase; READ-ONLY sul codice)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Prerequisito**: HEAD = `4273317f8` (shape A+B) e working tree PULITO (`git status`). Se non lo e', STOP e segnala.
**Hard stop**: dopo la scrittura del report. Nessuna modifica al codice, nessun commit di codice.

## Perche' questo task

L'arco della sintassi concreta lato nodi e' completo (vertex + row, R1..R3, shape). Il
capitolo mancante piu' grosso e' l'**edge authoring**: oggi gli edge sono resi dal
substrato esistente e assorbiti da `decorateEdges` quando un capo e' soppresso, ma non
esiste (o non e' completo) un percorso IR per definirne e autorarne l'aspetto: label,
stile linea, marker, routing. La prossima slice si progetta in chat di progetto SOLO
dopo questa discovery. Questo task mappa lo stato reale, non decide nulla.

**Due nature di edge, entrambe in scope.** Il design a valle deve coprirle tutte e due,
quindi la discovery deve distinguerle sito per sito, non trattarle come un blocco unico:

- **object-as-edge (edge sintetico)**: un `DObject` che reifica una relazione, reso come
  linea; capi da PathExpr sull'oggetto (`EdgeSpec.source`/`target`); matcha sulla propria
  metaclasse (chiave singola, come un vertice). Carrier: DVertex nascosto (cfr.
  `DVertex.irEdgeLayout`, spec v1.2 §7).
- **reference-as-edge (edge reale)**: l'edge e' una EReference (es. `eSuperTypes`, una
  reference di dominio), senza oggetto proprio; capi intrinseci al link; matcha su una
  chiave composta (metaclasse sorgente + nome reference + eventuale target).

La differenza operativa e' UNA: **su cosa matcha la view**. Compiled view, rendering e
widget di authoring sono condivisi tra le due nature. Per questo la discovery deve dire,
per ogni sito, se riguarda una natura, l'altra, o entrambe.

## Vincoli assoluti

- **READ-ONLY sul codice.** Uniche scritture ammesse: il report in `docs/discovery/` e
  l'entry finale in `docs/claude-code-log.md`.
- NON toccare la critical zone (`useJjomSync.ts`, `portDistribution.ts`): si LEGGE
  soltanto, e solo per i punti di contatto con gli edge.
- Nessuna proposta implementata "gia' che ci sono": le proposte vanno nel report.
- Ogni finding con riferimento `file:riga` (path completi). Se un'ipotesi di questo
  prompt risulta falsa nel codice reale, dirlo esplicitamente nel report: la mappa vale
  piu' della conferma.

## Prima di iniziare

1. Leggere `CLAUDE.md`; in caso di conflitto con questo prompt, segnalare senza procedere.
2. Leggere `docs/claude-code-log.md` (contesto recente: R3, shape A+B) e, per il pattern
  gia' consolidato dei kind IR, `docs/discovery/discovery_2026-07-25_row_view_dispatch.md`.

## Output obbligatorio: quattro domande in testa al report

Il report DEVE aprirsi con una sezione **"Risposte nette alle quattro domande"**, PRIMA
dei findings per area. Ogni risposta con evidenza `file:riga`; se il codice non permette
una risposta netta, dirlo e spiegare cosa manca. Queste quattro sono l'output che serve
alla chat di progetto per ratificare il design: non vanno diluite nell'area 7.

1. **Quale natura rende il substrato oggi** sul testbed CD3 (`Pointer_CD3_*`):
   object-as-edge (da oggetti reificati con source/target), reference-as-edge (da
   reference values: eSuperTypes / reference di dominio), o entrambe? Con evidenza dal
   transformer e dal componente edge.
2. **Il dato edge di React Flow porta gia' la provenienza?** Cioe' il nome della
   EReference d'origine + le metaclassi dei due capi (source/target), reperibili sul dato
   edge RF (`edge.data`?). Se si', reference-as-edge e' quasi gratis; se no, dire dove
   andrebbe aggiunto (candidato `jjomTransformers.ts`) e **confermare che quel sito e'
   FUORI dalla critical zone**.
3. **Su cosa chiavizza il bucket edge esistente nel resolver**: sulla metaclasse
   dell'oggetto-edge (estendibile con un sub-indice per nome-reference) o su altro? Da
   questo dipende se reference-as-edge ESTENDE il bucket per-metaclasse o ne AFFIANCA uno
   nuovo. Riportare la struttura reale dei bucket in `IRViewpointIndex`.
4. **Quanto dello scaffolding edge e' vivo e cablato** (`CompiledEdgeView`, bucket edge,
   gate kind `edge`, route in `ViewData.tsx`, hook resolve): quanto e' gia' funzionante e
   quanto e' solo dichiarato nello schema? Da questo dipende se un E-obj parte gia' oltre
   un ipotetico E1.

## COSA (aree da mappare)

### 1. Substrato edge in editor-v2 (React Flow)
- Dove NASCONO gli edge: il transformer (`sync/jjomTransformers.ts`?) che produce gli
  edge React Flow. **Distinguere le due nature**: quali edge nascono da oggetti reificati
  (object-as-edge, con source/target sull'oggetto) e quali da reference values
  (reference-as-edge: eSuperTypes, reference di dominio). Riportare la shape del dato edge
  RF per ciascuna e, in particolare, **se l'edge porta il nome della reference d'origine e
  le metaclassi dei due capi** (input diretto alla domanda 2 in testa).
- Componente/i edge custom: path di rendering, tipo di curva, dove vive la regola
  Manhattan (`|dy|<5` = dritto, altrimenti curva) citata nelle convenzioni di progetto.
- Marker/frecce (arrowhead), stile linea, colore: dove sono decisi oggi (hardcoded?
  per-tipo? CSS?). Questo e' il punto che il rendering IR-driven dovra' sostituire.
- Label sugli edge: esistono? dove sono rese e da quale dato.
- Interazione: creazione edge via drag (chi scrive il reference value), selezione,
  cancellazione; ancoraggio ai nodi (handle/port): SOLO il punto di aggancio verso
  `portDistribution.ts`, senza entrarci.
- Persistenza: cosa dell'edge viene salvato (geometria? nulla?). Per object-as-edge
  verificare se `DVertex.irEdgeLayout` (waypoints/lati) e' davvero implementato e vivo o
  solo dichiarato nella spec (input alla domanda 4).

### 2. Residui del substrato classic
Dal discovery row: "substrato classic: rendering deleted, vive il motore di scoring".
Verificare cosa resta lato edge del percorso classic (view edge classiche, scoring,
`appliableTo: 'Edge'`?) e se qualcosa e' ancora vivo o riusabile.

### 3. Stato IR per kind `edge`
- `irTypes.ts`: esiste una `EdgeViewIR` (o equivalente)? Con quali campi? **Il matching
  dichiarato oggi copre solo la metaclasse (object-as-edge), oppure c'e' gia' una qualche
  struttura per matchare su reference (source / refName / target)?** Confrontare con le
  spec v1.1/v1.2 §7 (`EdgeSpec`: line / terminations / routing / labels /
  persistWaypoints); se nel repo non c'e' copia delle spec, riportare solo il lato codice
  e segnalarlo.
- `irCompile.ts`: esiste un percorso di compile per edge (`CompiledEdgeView`? cache?),
  visto che `CompiledRowView` e' stato modellato "come edge"? Verificare cosa significa in
  concreto e **se e' cablato a un rendering** o e' scheletro morto.
- `irResolveCore.ts`: esistono bucket/percorsi resolver per kind `edge`? **Su quale chiave
  chiavizzano** (input alla domanda 3)? `compareCandidates` (il comparatore condiviso
  estratto in R1) e' gia' adottato dal resolver edge? Ranka su metaclasse singola: cosa
  servirebbe per uno **score composto** (reference + coppia sorgente/target) richiesto da
  reference-as-edge?
- `irResolve.ts`: esiste un hook tipo `useIREdgeView`? Chi lo chiamerebbe (il componente
  edge RF)?
- `editors/views/ViewData.tsx`: il routing per kind `edge` esiste (placeholder
  read-only? pannello?). Riportare lo stato esatto.
- `authoring/EnableIRPanel.tsx`: quali kind offre il seed dopo R3 (vertex/row); cosa
  servirebbe per un seed `edge`. Nota il rischio noto D_LEVEL_TYPES duplicato.
- **Runtime**: oggi QUALCOSA viene reso a canvas a partire da una view IR di kind `edge`
  (per una delle due nature), o il kind esiste solo nello schema? Risposta netta, con
  evidenza (input alla domanda 4).

### 4. `decorateEdges`
File, contratto, input/output: come assorbe gli edge dei row children soppressi; cosa
del suo meccanismo e' riusabile per un futuro rendering IR-driven degli edge; rischi se
un giorno l'edge stesso avesse una view IR (interazione soppressione/decorazione).
**Per reference-as-edge**: il lift-to-ancestor cambia il capo effettivo dell'edge, quindi
valutare se il matching di una edge view va valutato sui capi ORIGINALI (semantici, prima
del lift) o su quelli post-lift (renderizzati). Riportare come stanno le cose oggi e quale
delle due e' compatibile col matching su source/target.

### 5. Confine con la critical zone
Punti di contatto edge <-> `portDistribution.ts` (ancore/porte) e edge <-> `useJjomSync.ts`
(sync degli edge col modello): elenco dei siti, SOLO lettura. Includere esplicitamente
`jjomTransformers.ts` (il transformer) come sito candidato per la **provenienza edge** e
confermare che aggiungere refName + metaclassi dei capi al dato edge NON tocca
portDistribution/useJjomSync. Concludere: quali capacita' edge (label, stile, marker,
matching su metaclasse E su reference) sono implementabili SENZA toccare la critical zone,
e quali (routing configurabile? ancoraggio? persistenza waypoint override?) la
sfiorerebbero, richiedendo go-ahead + Layer Impact Report.

### 6. Superficie di authoring
- Cosa assume `MatchingSection` (tipizzata `VertexViewIR`, include `exclusive`): riusabile
  per il branch object-as-edge (matching su metaclasse) o serve matching inline come nel
  RowAuthoringPanel (R3)?
- **Branch reference**: un futuro `EdgeAuthoringPanel` deve esporre un toggle di natura
  (matcha su oggetto-edge / matcha su reference). Il branch reference vuole picker
  metaclasse sorgente + nome reference + target opzionale. Valutare cosa e' riusabile per
  entrambi i branch e cosa e' nuovo.
- Componenti riusabili senza modifiche: `PredicateBuilder`, `TextSourceEditor`,
  `ListEditor`, `ConditionalEditor`, pattern di persistenza del draft (stesso canale del
  vertex/row panel?). Widget nuovi presumibili: editor stile linea (color/width/dash),
  picker terminazione/marker.
- Grep preventivo (solo censimento, non creare nulla): `EdgeAuthoringPanel`,
  `useIREdgeView`, `CompiledEdgeView`, `defaultEdgeViewIR`, `refMatch` gia' in uso?

### 7. Domande aperte per Alfonso (input al design in chat)
Elencare nel report, come minimo:
- **Matching, per natura**: object-as-edge matcha sulla metaclasse propria dell'oggetto
  (confermato dal precedente vertex/row); reference-as-edge su cosa deve matchare in
  concreto (metaclasse sorgente + refName? con target opzionale? predicate sul link?), e
  con quale precedenza rispetto alla cascata esistente (priority > specificita' >
  declaration order)?
- feature set candidato v1 (label centrale con template TextSource? stile linea? marker
  alle estremita'? conditionals?), condiviso tra le due nature;
- rapporto con la regola Manhattan esistente (si tocca o resta fissa in v1?);
- cosa fare degli edge "assorbiti" se il child soppresso ha una riga (stato attuale ok?);
- ordine di landing tra le due nature: quale conviene per prima dato cosa rende il CD3
  (domanda 1) e dato il costo della provenienza (domanda 2)?
- aggiungere le domande che emergono dalla lettura.

## Report (unica scrittura, oltre al log)

`docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md`, in questo ordine:

1. **Risposte nette alle quattro domande** (sezione in testa, vedi sopra).
2. Obiettivo; file letti (path completi).
3. Findings per ciascuna delle 7 aree con `file:riga`, distinguendo object-as-edge da
   reference-as-edge dove il sito le tratta diversamente.
4. Dipendenze e rischi (in particolare il confine critical zone del punto 5 e la
   provenienza del punto 2).
5. **Proposta di fasizzazione**: valutare un taglio **per natura** (E-obj = object-as-edge
   full stack; E-ref = aggiunge il matching su reference, riusando compiled-view +
   rendering + widget di E-obj), oppure per layer se il codice reale lo suggerisce.
   Proposta, NON decisione.
6. Domande aperte per Alfonso.

## COME
- Leggere per intero i file citati prima di riportarne findings; niente tour del
  codebase oltre le aree elencate.
- HARD STOP dopo il report + entry di log (tipo `chore`, discovery). In chat: le quattro
  risposte in testa, poi sintesi per area, conclusione e domande aperte.

## RIFERIMENTI
- Mappa di copertura sintassi concreta: `claude/mappa_sintassi_concreta.md` (KB progetto;
  edge authoring = capitolo mancante piu' grosso).
- Discovery row dispatch: `docs/discovery/discovery_2026-07-25_row_view_dispatch.md`
  (pattern bucket/compile/resolve per kind; substrato classic; provenienza persa dai
  containmentChildren, OQ-8).
- Spec IR edge: `claude/spec_2026-07-18_ir_schema_v1_2.md` §7 (`EdgeSpec` completo:
  line/terminations/routing/labels/persistWaypoints; policy endpoint lift-to-ancestor) e
  §6 (`InteractionSpec.connect`).
- Checkpoint: `claude/sessione_2026-07-25_2.md` (R3 + shape landed, info strutturali;
  testbed = "Class Diagram IR v3", id `Pointer_CD3_*`).
- Commit di riferimento: `4273317f8` (HEAD atteso), `d1e6f9992` (R3), `d12a54aa0` (R2),
  `8a650833b` (R1).
