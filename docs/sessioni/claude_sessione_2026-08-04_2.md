# Sessione 2026-08-04 (2) — Dogfooding eseguito: tre frizioni di authoring e un buco nell'undo

## Stato a fine sessione

Prima sessione in cui l'evidenza arriva dall'uso e non dall'analisi. Il dogfooting è stato
fatto su viewpoint veri; ne escono **tre frizioni**, tutte concentrate sull'authoring degli
edge e sull'organizzazione dei tab, e **un buco che l'analisi aveva mancato**: non esiste
undo per gli edit di valore del modello.

**Git**: HEAD `fc0af70d2`, allineato a `origin/alfonso-frontend-jjtl`. Il push dei 4 commit
era già stato fatto prima dell'apertura della sessione, insieme alla rimozione di `_finish.sh`
e del lock; il punto 1 della ripresa era già chiuso.

**Working tree**: il commit di igiene docs è **preparato ma non eseguito**. Modificati
`CLAUDE.md`, `docs/claude-code-log.md`, `docs/claude-code-log-archive.md`; nuovo
`docs/discovery/discovery_2026-08-04_viewpoint_selector_rehydration.md`. Il commit e il push
sono in `_finish.sh` alla root, da lanciare con `bash _finish.sh`.

## Decisioni prese

**[2026-08-04] Risequenziamento dell'arco edge v2: authoring prima di espressività.**
Le due frizioni di authoring uscite dal dogfooding (scaffold dell'object-as-edge incompleto,
risalita al parent di composition) passano **davanti** a E-mark, E-lab ed E-route.
Motivazione: tutte e tre le frizioni osservate stanno sull'authoring, nessuna
sull'espressività; il collo di bottiglia oggi è scrivere un edge, non renderlo meglio.
Modifica esplicita alla ratifica del 2026-08-03, che metteva E-mark per prima.

**[2026-08-04] La rettifica delle due entry di log malformate va in un task suo.**
Non in coda al commit docs di oggi. Vedi "Igiene in coda".

**[2026-08-04] Criterio di rotazione del prompt log: per timestamp, non per posizione.**
L'ordine posizionale del log attivo non è cronologico (prepend nel periodo recente, append in
quello precedente), quindi tagliare dal fondo archivierebbe entry più recenti di altre che
restano. Il taglio segue il timestamp del campo `Prompt document name`. Criterio annotato
nell'intestazione dell'archivio, quindi ripetibile.

**[2026-08-04] La regola sui discovery report estende la regola 16 di `CLAUDE.md`.**
Non apre una regola 21 nuova, che avrebbe rinumerato le otto successive per tre righe di
contenuto. Testo: *"A discovery report is committed in the task that produced it, never left
untracked (P4)."* La casa canonica della disciplina resta P4 in `docs/PROTOCOL.md`, ora citata
per numero dalla regola.

**Il capitolo stato e azioni non è stato aperto.** Resta ratificato che si apre dopo il
dogfooding, e il dogfooding di oggi non ha prodotto frizioni che lo riguardino.

## Bug chiusi e confermati

- **[CHIUSO] Verifica post-C0**: toggle Basic/Advanced con una tab M1 aperta, le tab restano.
  Era classificata [MEDIA, non confermata] dal 31 luglio.
- **[CONFERMATO] Rehydration del viewpoint selector**: hard-refresh a fine sessione su
  viewpoint veri con contenuto, tutto al suo posto. La chiusura del 2026-08-04 non poggia più
  su un viewpoint di prova.
- **[DECLASSATO] Scrittura no-op su blur senza digitazione**. Il test chiedeva di accorgersi
  di una cosa invisibile per costruzione, quindi la domanda era mal posta. Conclusione tratta
  senza test: il dirty flag non si accende (R12 lo gata sul cambio reale) e, dato il buco
  sull'undo qui sotto, non esiste una history utente che quella scrittura possa sporcare.
  Nessuna conseguenza osservabile oggi. Torna a contare nel momento in cui gli edit di modello
  entrano in un canale di undo, perché a quel punto ogni blur a vuoto si mangia uno step.

## Il finding principale: nessun undo per gli edit di valore del modello

Osservazione di Alfonso: Ctrl+Z non fa niente, l'icona nella headerbar sì ma ripristina
modifiche strutturali (una cancellazione), non il testo.

Verificato: **le due cose sono lo stesso handler**. `Toolbar.tsx:299` passa `onUndo`, cablato
su `handleUndo` (`EditorV2.tsx:3931`); Ctrl+Z arriva a `EditorV2.tsx:2495` e chiama lo stesso
`handleUndo`. Il tooltip del pulsante dice "Undo (Ctrl+Z)". Non ci sono due sistemi in
competizione: ce n'è **uno solo**, `useHistory(getNodes, getEdges)` (`EditorV2.tsx:930`), che
fotografa `nodes` ed `edges` di React Flow.

Da qui discende tutto:

- ripristina le cancellazioni perché una cancellazione fa sparire un nodo dall'array `nodes`;
- non ripristina i valori perché gli slot vivono in Redux e sono letti a render-time, quindi
  uno snapshot pre-edit è **identico** al post-edit;
- il tasto sembra non funzionare mentre il pulsante sì per una ragione separata e banale:
  `onKeyDown` ha due early return, `if (target.tagName === 'INPUT') return` e lo stesso per
  `SELECT` (`EditorV2.tsx:2485-2486`), ed è un handler React, quindi richiede il focus dentro
  il sottoalbero dell'editor. Il pulsante non dipende dal focus.

**Perché conta.** Il 2026-08-03 la domanda D1 fu chiusa in negativo con il ragionamento
giusto: uno snapshot del canvas prima di un edit inline sarebbe inerte. Vero e verificato. Ma
la conclusione tratta fu "quindi non si fa niente", mentre la domanda vera era un'altra:
**quale undo possiede gli edit di valore del modello?** Risposta di oggi: nessuno. Rinomini
una classe inline e non torni indietro, sotto un pulsante che si chiama Undo. È il tipo di
buco che l'analisi non produce: dal codice D1 sembrava una non-domanda, dall'uso è un buco.

Prima di poterlo trasformare in una slice serve sapere se un undo Redux **esiste** ed è
raggiungibile. La lista di verifica di R12 Fase 2 ne citava uno; in questa sessione è stato
verificato solo che la toolbar non è cablata su quello. Discovery corta e ben posta.

## Le tre frizioni del dogfooding

Osservazione trasversale: **tutte e tre stanno sull'authoring degli edge o
sull'organizzazione dei tab. Nessuna sul vertice, nessuna sulla riga.** Con tre punti non si
fa statistica, ma il segnale è coerente: gli archi vertice e riga sono maturi abbastanza da
sparire nell'uso. È l'evidenza su cui poggia il risequenziamento ratificato sopra.

### F1 — Il tab IR è un insieme indifferenziato di parametri generali

Riorganizzare quei parametri in altri tab, rimuovendo i tab dell'editor v1.

Non cambia il bersaglio ratificato (Applies to · Shape · Content), cambia **ordine e
perimetro**. La decisione del 2026-08-03 assumeva un lavoro additivo (spaccare il tab IR);
la frizione dice che il fastidio è la **coesistenza** di due superfici di authoring sulla
stessa view, cioè la parte **sottrattiva**, che è anche la più economica e la meno rischiosa.

La discovery tab map guadagna la domanda che oggi non ha, e che diventa il suo deliverable
principale: **per ogni tab visibile su una view IR-authored, chi è l'autorità?** Tre secchi:

- **morto**: nessun consumatore vivo, si rimuove (caso Events, precedente R-1);
- **ridondante**: l'IR è l'autorità, si rimuove il tab;
- **autoritativo**: unico posto da cui si scrive, deve migrare dentro Shape o Content.

Questa triage **è** l'unificazione dell'autorità sui tab, oggi in lista come voce separata.
Le due cose sono lo stesso lavoro.

### F2 — L'object-as-edge incompleto rende con la sintassi di default

Richiesta: una sintassi di default diversa che faciliti la definizione di source e target.

**La trappola**: "un oggetto che deve essere visualizzato come edge" presuppone
un'**intenzione**, e l'architettura ratificata rifiuta deliberatamente di conservarla
(`irCompile.ts:391`, `isObjectAsEdge: !!(sourceExpr && targetExpr)`; la natura è una
conseguenza, non un campo). Introdurre un campo per lo scaffold ricrea la doppia sorgente di
verità che E-obj era stata disegnata per evitare.

Ma gli stati oggi sono **tre**, non due:

| endpoint | `isObjectAsEdge` | resa |
|---|---|---|
| nessuno | `false` | sintassi di default (la frizione) |
| **esattamente uno** | `false` | pinnato dai test (`edgeAuthoring.test.ts:156,162`); il commento a `EdgeAuthoringPanel.tsx:157` dice che compila come reference-as-edge viva |
| entrambi | `true` | object-as-edge |

Lo stato di mezzo è già una condizione **strutturale distinguibile** (`sourceExpr` XOR
`targetExpr`) ed è una conseguenza, non una dichiarazione: uno scaffold su quello stato non
costa nessun campo nuovo.

Per lo stato a zero endpoint la posizione proposta è: **l'intenzione appartiene alla
superficie di authoring, non al modello**. Lo scaffold si mostra mentre la sezione edge del
pannello è aperta, e vive nello stato transiente del pannello. Al primo capo l'intenzione
diventa strutturale gratis.

Alternativa scartata per ora: far portare all'IR degli **slot** presenti ma vuoti,
distinguendo "nessuno slot" da "slot vuoti". Sarebbe ancora una conseguenza della forma
dell'IR, ma introdurrebbe un terzo stato in una derivazione che il progetto ha deciso di
tenere binaria.

Nota di lessico non cosmetica: chiamarlo **scaffold** e non "sintassi di default alternativa".
Una sintassi entra nel vocabolario dell'IR e chiede di essere persistita; uno scaffold è una
resa di supporto dell'authoring.

**Da verificare prima della slice**: lo stato XOR oggi non è neutro, rende già qualcosa. Lo
scaffold cambierebbe una resa esistente, non riempirebbe un vuoto. Se quella resa è
intenzionale e usata, il disegno cambia.

### F3 — Risalire al parent di composition nel source dell'object-as-edge

Esempio: `State` compone `Transition`; dalla transition si vuole risalire allo state.

Stato di fatto: `STEP_RE` in `pathExpr.ts` accetta `$feature | value | values | values[N]` e
nient'altro. **Nessuna navigazione verso l'alto esiste**: zero occorrenze di `eContainer`,
`$parent`, `father` nella cartella `ir/`. Il multi-hop **verso il basso** invece esiste già
come `CompiledCrossPath` (`irCompile.ts:103-106`, `hops` più `terminal`): la macchina per le
catene c'è, manca la direzione.

C'è anche un cancello deliberato da spostare: `singleHopOf` ritorna `null` sul multi-hop, e il
commento del modulo dice che è voluto (*"converging on the shared parser does not widen the
authoring surface to multi-hop"*). Un passo verso il parent è per natura un secondo hop.

**Domanda di design aperta: risalita tipata o non tipata.** Proposta: **nominare la feature di
composizione, non il tipo del parent**, per esempio `$^transitions` come inverso della
containment reference. L'inverso di una composizione è verificabile staticamente sul
metamodello; il tipo del parent ne è una conseguenza. Alternativa `$parent` nudo: più
leggibile, fallimento più tardivo, richiede un validatore che la rifiuti quando il metamodello
ammette più contenitori per quella classe. **Non ratificata.**

**Conseguenza di scheduling**: la quinta copia della grammatica, `isUsableEndpointExpr`
(`EdgeAuthoringPanel.tsx:78`, `!/\.values$/`), passa da micro-debito sbloccato a
**prerequisito di F3**. Estendere il linguaggio lasciandola lì significa che l'endpoint
accetta ciò che il compilatore rifiuta.

## Verifiche non eseguite e perché

- **R-9 (isolamento per modello dei singleton di sessione): parcheggiata.** Metà della
  risposta è statica e agli atti: `collapsed` (`irCollapseState.ts:11`) e `anchorOverrides`
  (`irEdgeInteraction.ts:29`) **non hanno alcuna funzione di azzeramento esportata**, quindi
  non si svuotano mai; `selectedSynthetic` (`:30`) ha `clearSyntheticEdgeSelection()`,
  chiamato da cinque punti di `EditorV2.tsx` (2570, 2589, 2593, 2610, 2614), ed è l'unico che
  si autopulisce. La metà runtime non è stata eseguita perché **Alfonso non ha collassato
  nulla** costruendo i viewpoint: l'occasione non si è presentata, che è letteralmente ciò che
  la ratifica R-9 prevedeva ("si verifica alla prima occasione utile").
- **R-2 (collasso condiviso fra viewpoint): resta aperta.** Il test parte da un collasso, e
  non essendocene stati non ha evidenza sotto. Meglio lasciarla sospesa che chiuderla su un
  test non fatto.
- La sonda console `getCollapsedSet()` ha restituito `[]`, risultato **non conclusivo** per la
  stessa ragione. Trappola da ricordare quando si rifarà: senza hard-refresh preventivo,
  l'import da console può prendere un'istanza fresca del modulo (query `?t=` dell'HMR) e dare
  un falso negativo.

## Documenti aggiornati

**Nel repo, preparati ma NON committati** (in attesa di `bash _finish.sh`):

- `docs/discovery/discovery_2026-08-04_viewpoint_selector_rehydration.md` portato sotto
  controllo di versione;
- `docs/claude-code-log.md`: 6 entry ruotate fuori (le cinque del 2026-07-31 più quella delle
  2026-08-01 01:06), più la nuova entry. Da 25 a 20 entry attive;
- `docs/claude-code-log-archive.md`: le 6 entry accodate più la nota di batch
  nell'intestazione, da 656 a 662;
- `CLAUDE.md`: regola 16 estesa.

**Fuori dal repo**: `protocollo_dogfooding_2026-08-04.md`, consegnato in chat.

## Prompt generati per Claude Code

Nessuno. Le tre frizioni sono in fase di design, non di implementazione; il buco sull'undo
richiede prima una discovery. `_finish.sh` non è un prompt, è uno script di chiusura per
aggirare il limite del bridge.

## Prompt pendenti

- **Discovery tab map, prompt del 2026-07-24**, mai eseguito. Da aggiornare al perimetro
  attuale (allora non comprendeva row ed edge) **e** alla domanda sull'autorità dei tab
  introdotta da F1.

## Prossimi passi

1. **Lanciare `bash _finish.sh`** per chiudere il commit docs.
2. **Discovery tab map**, col perimetro allargato alla triage dell'autorità (morto /
   ridondante / autoritativo per ogni tab su una view IR-authored).
3. **Discovery undo dei valori di modello**: esiste un canale Redux, è raggiungibile, cosa
   costerebbe farci entrare gli edit inline.
4. **Micro-slice `isUsableEndpointExpr`**, prerequisito di F3.
5. **Scaffold dell'object-as-edge** (F2), preceduto dalla verifica su cosa rende oggi lo stato
   XOR.
6. **Risalita al parent** (F3), dopo la decisione sulla sintassi.
7. Arco edge v2 (E-mark, E-lab, E-route), ora **dietro** F2 e F3 per ratifica di oggi.
8. Capitolo stato e azioni, invariato: si apre sull'evidenza del dogfooding.

## Igiene in coda

- **`check:docs` è rosso, e lo era già prima di questa sessione.** Falliscono le due entry del
  2026-08-03 (R8 e R12): `Corregge` e `Causa` sono riempiti con prosa libera invece che con la
  forma prescritta (`Corregge` vuole un nome di documento prompt o il sentinel `—`; `Causa`
  vuole una lettera della tassonomia §21.3). Ratificato oggi che la rettifica va in un task
  suo. La rettifica pulita è portare i due valori a `—` e spostare la prosa, che è buona,
  dentro `**Notes**`. Il fatto da indagare insieme alla rettifica: il gate è atterrato il
  2026-08-02 ed è stato violato dalle **due entry immediatamente successive**, quindi o non
  viene eseguito a fine task o viene eseguito e ignorato. Oggi quel linter non misura niente.
- `.claude/scheduled_tasks.lock` risulta tracciato (`git ls-files .claude/`), da togliere
  dall'indice con `git rm --cached`, in un commit suo.

## Info strutturali scoperte

Riferimenti verificati in questa sessione, utili alle prossime.

**Undo**
- `EditorV2.tsx:930` — `useHistory(getNodes, getEdges)`, unico sistema di undo dell'editor.
- `EditorV2.tsx:2343` — `handleUndo`, chiamato sia da Ctrl+Z (`:2495`) sia dal pulsante
  (`Toolbar.tsx:299`, tooltip "Undo (Ctrl+Z)", cablaggio a `EditorV2.tsx:3931`).
- `EditorV2.tsx:2485-2486` — early return di `onKeyDown` su `INPUT` e `SELECT`.
- `EditorV2.tsx:2354` — `reconcileJjomAfterUndoRedo` dopo il ripristino, in `isJjomMode`.

**Singleton di sessione**
- `irCollapseState.ts:11` `collapsed`, `:30` `getCollapsedSet()` esportato, `:40`
  `hydrateCollapsed` puramente additivo. Nessun clear.
- `EditorV2.tsx:1363` unica chiamata a `hydrateCollapsed`, con guardia once-per-graph (nota a
  `:135`): **lo stato di sessione vince sul persistito**.
- `irEdgeInteraction.ts:29` `anchorOverrides` (nessun clear), `:30` `selectedSynthetic`
  (`clearSyntheticEdgeSelection()` a `:107`).
- Nessuno dei tre espone la dimensione tranne `collapsed` via `getCollapsedSet()`.

**Object-as-edge e PathExpr**
- `irCompile.ts:391` — `isObjectAsEdge: !!(sourceExpr && targetExpr)`.
- `irTypes.ts:269-271` — `isObjectAsEdge`, `sourceExpr`, `targetExpr`.
- `irResolveCore.ts:125` — unico consumatore di `isObjectAsEdge` fuori dal compilatore.
- `pathExpr.ts` — `FORBIDDEN_PATH`, `STEP_RE` (`$feature | value | values | values[N]`),
  `parsePathExpr`, `singleHopOf` (non-throwing, gate single-hop deliberato).
- `irCompile.ts:103-106` — `crossPathSink`, multi-hop verso il basso già raccolto.

**Bridge Cowork, fatti operativi aggiornati**
- `rm` **vietato** (Operation not permitted), confermato con test diretto. `git commit` quindi
  fallisce.
- **`mv` è permesso**, anche sopra un file esistente. Fatto nuovo e utile: i file si
  modificano scrivendo un `.tmp` e rinominandolo, senza mai chiamare unlink.
- `python3` 3.10.12 disponibile: la chirurgia sui file grandi si fa lì, senza portarli in
  contesto.
- `node` v22.22.3 sulla VM del bridge: **`npm run check:docs` gira**. `vitest` no
  (`node_modules` per macOS).
- `git log`, `git push`, `git --no-optional-locks status` non prendono il lock e funzionano.
- **Nessun hook pre-commit** nel repo (né `.husky`, né `core.hooksPath`, né hook non-sample):
  un gate rosso non blocca meccanicamente il commit.

## Nota di processo

Tre dei sei controlli del protocollo di dogfooding non sono stati eseguiti perché li avevo
scritti in sigla ("R-9", "R-2") invece che descrivendo l'azione. Le sigle sono etichette di
report interni che Alfonso non porta in testa. Costo: metà della batteria di verifiche
runtime, in una sessione in cui l'app era aperta e quelle verifiche erano gratis. Regola per i
protocolli futuri: **descrivere il gesto, non citare l'etichetta.**

## Cronologia

Apertura sulla coda di igiene. Il punto 1 della ripresa risulta già chiuso: HEAD e origin
allineati, `_finish.sh` e lock già rimossi. Preparazione del commit docs (rotazione del log,
riga in `CLAUDE.md`) e scoperta che `rm` resta vietato dal bridge mentre `mv` funziona, il che
apre il pattern write-tmp-and-rename. `check:docs` eseguito dal bridge rivela un gate rosso
pre-esistente, non causato dalla sessione.

Consegna del protocollo di dogfooding con le sei verifiche runtime batchate. Alfonso esegue.
Ritornano tre frizioni, tutte sull'authoring edge e sui tab, e la scoperta che l'undo copre
solo metà delle modifiche. Discussione architetturale sulle tre frizioni con lettura mirata
del codice: la trappola dell'intenzione in F2, l'assenza totale di navigazione verso l'alto in
F3, la triage dell'autorità come vero deliverable della tab map in F1.

Chiusura sui sei verdetti: due chiusi in positivo, uno declassato senza test, due parcheggiati
per mancanza di occasione, uno riformulato come il finding principale della giornata. Due
ratifiche.

## Riferimenti

- Snapshot corrente: `contesto_progetto.md`.
- Checkpoint precedente: `claude/sessione_2026-08-04.md` (chiusura rehydration, slice R12/R8).
- Ratifiche stato e azioni: `claude/ratifiche_2026-08-03_state_actions_events.md` (R-1..R-9).
- Ratifiche edge: `claude/ratifiche_2026-08-03_edge_expressiveness_decisioni.md`,
  `claude/ratifiche_2026-08-02_eobj_object_as_edge.md`.
- Discovery della sessione precedente:
  `docs/discovery/discovery_2026-08-04_viewpoint_selector_rehydration.md`.
