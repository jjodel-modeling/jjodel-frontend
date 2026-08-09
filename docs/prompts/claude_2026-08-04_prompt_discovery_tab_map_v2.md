# Discovery (read-only) — Tab map v2 delle view IR-authored: triage dell'autorità e collocazione dei parametri

**Documento prompt**: 2026-08-04 15:40
**Sostituisce**: `2026-07-24_prompt_discovery_tab_map_ir_authored.md`, mai eseguito. Quella versione è di un'epoca in cui esisteva solo l'authoring vertex: non comprendeva row ed edge, non aveva la domanda sull'autorità, e non conosceva la frizione F1 del dogfooding.

> Fase 1 di un two-phase. **Read-only: nessun edit al codice.** L'unico file che puoi scrivere è il discovery report. Al termine, HARD STOP: la tab map la decide Alfonso in chat.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

## Contesto e vincoli già decisi

Non stai esplorando a campo aperto: due cose sono già ratificate e **non vanno rimesse in discussione**.

1. **La barra target per una view IR-authored è `Applies to · Shape · Content`**, più il tab Events legacy già marcato inerte (`b32c2dbd9`). Un quarto tab **Behavior** (State e Actions) nascerà col modello di stato e non è oggetto di questa discovery.
2. **La frizione da chiudere è sottrattiva** (F1, dogfooding 2026-08-04): il fastidio non è che manchino parametri nel tab IR, è che i tab dell'editor v1 coesistano con esso sulla stessa view. Il deliverable è quindi la **triage dell'autorità**, non un elenco di feature.

La triage ha tre secchi, e ogni tab visibile oggi su una view IR-authored deve finire in uno solo:

- **morto**: nessuno legge quello che scrive, per nessuna view. Si rimuove.
- **ridondante**: qualcuno lo legge, ma sulle view IR-authored l'autorità è l'IR. Si rimuove per quelle view.
- **autoritativo**: scrive qualcosa che l'IR non sa esprimere e che il render usa davvero. Deve **migrare** dentro Shape o Content, e la discovery deve dire dove e a che costo.

Un tab in cui due sorgenti scrivono lo stesso pixel con precedenza decisa da accidenti di CSS o di ordine di render non è "coesistenza": è un bug latente. Trovarlo e nominarlo è parte del lavoro.

## OBIETTIVO

Rispondere alle aree OQ qui sotto con `file:riga` verificati a HEAD, in modo che dopo la lettura del report si possa scrivere il prompt di implementazione senza altre esplorazioni.

### Area 1 — Censimento reale delle superfici

**OQ-1**. Elenco dei tab a HEAD in `components/editors/views/ViewData.tsx` (atteso `TabId` intorno a `:34`, ri-ancorati via grep): id, label esatta in UI, condizione di visibilità, componente che li rende. Se il set varia per tipo di view (viewpoint, object, class, enum, edge) riportalo.

**OQ-2**. Esistono **altre** superfici che editano gli stessi campi di una view fuori da `ViewData`? Verificare almeno `components/editors/viewpoint/properties/ViewProperties.tsx` e il pannello Properties del workbench. Se una seconda superficie scrive gli stessi campi, va nel report: la tab map che tocca una sola superficie lascia l'altra a divergere.

### Area 2 — Tabella tab → campo persistito → consumatore → verdetto

**OQ-3**. Il cuore del report. Per **ogni** tab del censimento, con `file:riga`:

| Tab | Campo/i su DViewElement | Forma del dato | Chi lo legge a render-time | Lo legge anche per una view con `ir`? | Verdetto |
|---|---|---|---|---|---|

Il verdetto è uno dei tre secchi. Deve essere **argomentato con evidenza**, non asserito: "morto" richiede un grep negativo esibito (comando e risultato), "ridondante" richiede il punto in cui il ramo IR scavalca, "autoritativo" richiede il consumatore che legge davvero.

Attenzione particolare a `Template` (jsxString), `Style` (PaletteData), `Events` (già marcato inerte: confermare che sia morto e non solo marcato), `Options` (GenericNodeData), `Apply to` (InfoData), `Components` (solo viewpoint).

### Area 3 — Collisioni sullo stesso pixel

**OQ-4**. **Style contro IR**: il CSS del tab Style viene ancora iniettato su una view IR-authored? Con quale specificità rispetto agli inline di `IRNodeContent.tsx` e alle regole `BASE_CSS` di `irStyle.ts`? Un inline vince su un CSS senza `!important`: verificare se lo Style tab può emettere `!important` e quindi scavalcare l'authoring IR, e in quali condizioni.

**OQ-5**. **Events contro il DOM IR**: gli handler assumono la struttura DOM classica o funzionano su `.ir-node-content`? Elencare selettori e assunzioni che si romperebbero. Se il runtime è rimosso (ratifica R-1), dirlo con l'evidenza.

**OQ-6**. **Options contro IR**: quali opzioni toccano aspetto, dimensioni o collasso e sono quindi duplicate dall'authoring IR. Elenco puntuale: è ciò che serve per decidere cosa si rimuove e cosa migra.

**OQ-7**. **Template contro interprete**: per una view IR-authored il `jsxString` viene ancora valutato? Dove si sceglie il ramo? Il template resta persistito e inerte, o viene scavalcato solo a render-time?

### Area 4 — Applicabilità esterna all'IR (area nuova)

Verificato in chat il 2026-08-04 e da confermare a HEAD nel report, perché cambia cosa deve sopravvivere dentro "Applies to":

**OQ-8**. `irResolveCore.ts` (intorno a `:99-113`) scarta ogni view con `d.viewpoint !== state.viewpoint`. Confermare, e stabilire se il campo D `DViewElement.viewpoint` (`view/viewElement/view.tsx:239`) è **l'unico** parametro fuori dall'IR che decide l'ingresso nell'indice del resolver. Confermare anche il delta col classic, che ammette tre fonti (viewpoint attivo, `Pointer_ViewPointDefault`, viewpoint decorativi non esclusivi: `redux/selectors/selectors.ts:552-559`), mentre l'IR ne ammette una sola.

**OQ-9**. Confermare con grep esibito che `father`, `subViews`, `fatherChain`, `allSubViews` **non compaiono** in `components/editor-v2/viewpoint/`, e che `appliableToClasses` vi compare solo nei pannelli di authoring (seed una tantum in `EnableIRPanel`, disambiguazione metaclasse nei tre panel), mai nel resolver. Serve a stabilire quali campi del tab Apply-to classico siano morti per le view IR.

**OQ-10**. In `InfoData.tsx` il Select "Viewpoint" (atteso `:306`) e il Select "Parent view" (atteso `:323`) risultano scrivere entrambi `field={'father'}` senza setter custom, con `getter={() => vpid}` sul primo a mascherare la differenza in lettura. Verificare e descrivere l'effetto reale di ciascuna delle due tendine in scrittura, incluso se scegliere un viewpoint perda il parent view precedente. Verificare se `ViewProperties.tsx` (atteso `:121-133`) replica lo stesso pattern. **Questo è un bug indipendente dalla tab map**: va nel report come finding a sé, non va corretto qui.

**OQ-11**. Alla luce di OQ-8..OQ-10: cosa deve sopravvivere dentro "Applies to" dai campi **non** IR? Proporre il contenuto minimo (per esempio: appartenenza a viewpoint con stato attivo/non attivo, e la catena `viewpoint › parent › questa view` in sola lettura) senza deciderlo.

### Area 5 — Collocazione dei parametri IR nei tre tab

**OQ-12**. Prendere l'inventario completo dei parametri autorabili (fonte: `claude/mappa_parametri_tab_ir.md`, ricavata dai sorgenti a HEAD) e assegnare **ciascuno** a uno fra `Applies to`, `Shape`, `Content`, per ciascuna delle quattro tipologie (vertex, row, reference-as-edge, object-as-edge).

Il deliverable vero non è l'assegnazione facile: sono gli **orfani**, cioè i parametri che non cadono naturalmente in nessuno dei tre. Elencarli esplicitamente, perché sono il test empirico di se tre tab bastano. Candidati orfani già noti, da valutare senza pregiudizio:

- i capi `edge.source` / `edge.target` e il selettore di natura: strutturali, non "shape" e non "content" in senso stretto;
- le label del vertex, il `template` della row e la label center dell'edge: producono testo, e la loro collocazione in Shape o in Content è una scelta, non un fatto;
- i campi che oggi fanno round-trip verbatim e nessuna UI mostra (`irVersion`, `kind`, `migratedFrom`, `edge.routing`, `edge.persistWaypoints`, `edge.labels.placement`, `exclusive` sulle edge, le varianti `editable: {widget}`): valutare se serva una superficie di sola ispezione e in quale tab vivrebbe.

**OQ-13**. Le tre dipendenze che oggi stanno nello stesso scroll e con la partizione diventerebbero invisibili: PathBuilder disabilitato per assenza di metaclasse; errore wildcard più natura object; ambiguità di metaclasse fra metamodelli. Per ciascuna, dire quale tab possiede il campo e quale tab mostra l'effetto, e censire i precedenti in casa per segnalare un errore su un tab non attivo (badge sull'header, striscia a livello di pannello).

### Area 6 — Meccanica e reversibilità

**OQ-14**. Dove vive il predicato "questa view è IR-authored" (campo, funzione, entry-point) e se è già usato per condizionare UI. Qualunque tab map avrà bisogno di quel predicato.

**OQ-15**. Esiste un'operazione di **disabilitazione** dell'authoring IR? Se sì, l'oggetto `ir` viene cancellato o resta orfano, e il template classico è ancora quello di prima o è stato svuotato all'abilitazione? Se non esiste, dirlo esplicitamente. Determina se la tab map è reversibile o un punto di non ritorno.

**OQ-16**. Precedenti in casa per tab condizionali, disabilitati o read-only (progressive disclosure, Basic/Advanced, tab condizionali): `file:riga` di un esempio concreto riusabile, per non inventare un meccanismo nuovo.

**OQ-17**. Vincolo implementativo da verificare, non da progettare: oggi ogni pannello di authoring tiene **un solo draft** con `dirtyRef` e commit debounced a 300 ms. Alcuni sotto-editor tengono stato UI locale prima della scrittura (caso noto: `sourceExpr`/`targetExpr` dei capi prima della scrittura atomica in `EdgeAuthoringPanel`). Censire questi stati locali: se la partizione smonta il componente al cambio tab, quello stato si perde. È la stima di costo che serve ad Alfonso per decidere se la partizione tocca codice già verificato (rami E-ref ed E-obj).

## Report OBBLIGATORIO

Salva il report in:

```
docs/discovery/discovery_<data-di-esecuzione>_tab_map_v2_authority.md
```

con `<data-di-esecuzione>` in formato `YYYY-MM-DD`. Crea `docs/discovery/` se non esiste.

Contenuto minimo: obiettivo, file letti con path completi, i findings per area con `file:riga`, la **tabella della triage** (OQ-3) come sezione in evidenza, la **tabella di collocazione dei parametri** con la lista degli orfani (OQ-12), i rischi ordinati per gravità, le domande aperte per Alfonso.

Sezione finale **"Opzioni"**: le alternative che il codice rende praticabili per i tab autoritativi (migrare dentro Shape, migrare dentro Content, tenere un tab in più, superficie di sola ispezione). Per ciascuna: cosa richiederebbe toccare e quale rischio introduce. **Non raccomandare una vincente**: la scelta è di Alfonso.

## HARD STOP

Dopo aver scritto il report, **FERMATI**. Nessun edit al codice, nessun refactoring, nessun rename, nessuna correzione del bug OQ-10.

Il report puoi committarlo da solo: `git add` del **solo** file del report (mai `git add .`, mai `git commit -a`), messaggio `docs: discovery tab map v2 and authority triage for IR-authored views`, più l'entry in `docs/claude-code-log.md` nella forma prescritta (attenzione: il gate `check:docs` è rosso da prima del 2026-08-04 per entry malformate; la tua deve essere conforme). Poi torna in chat col contenuto del report.

## COME

- Solo lettura. Grep globali sui nomi dei tab, sui campi persistiti, sul predicato IR-authored.
- Ogni verdetto "morto" richiede il grep negativo esibito: comando e risultato.
- Non toccare la critical zone (`useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `syncState`).
- Se un componente atteso non esiste con quel nome, **non concludere che la feature non esiste**: cerca per campo persistito e per stringa UI, e segnala l'incertezza nel report.
- I `file:riga` citati in questo prompt vengono da letture del 2026-08-04 e possono essere sfasati: ri-ancorati sempre via grep sui nomi, mai sui numeri di riga.

## RIFERIMENTI

- Inventario dei parametri autorabili: `claude/mappa_parametri_tab_ir.md` (input di OQ-12).
- Proposta di partizione discussa in chat, da usare come materiale, non come decisione: `claude/proposta_2026-08-04_tab_ir_partizione.md`.
- Interprete e painting: `components/editor-v2/viewpoint/ir/` (`IRNodeContent.tsx` per gli inline border/fill, `irStyle.ts` per `BASE_CSS` e la neutralizzazione di `.mm-node`, `irTypes.ts` per lo schema, `irResolveCore.ts` per l'indice).
- Pannelli di authoring: `components/editor-v2/viewpoint/authoring/` (`EnableIRPanel`, `VertexAuthoringPanel`, `RowAuthoringPanel`, `EdgeAuthoringPanel`, `MatchingSection`).
- Ramo IR del nodo: `components/editor-v2/nodes/ObjectNode.tsx`.
- Ratifica del tab Events inerte: commit `b32c2dbd9`; capitolo stato e azioni in `claude/ratifiche_2026-08-03_state_actions_events.md`.
- Discovery recenti come modello di formato: `discovery_2026-08-04_viewpoint_selector_rehydration.md`, `discovery_2026-08-02_eobj_object_as_edge_authoring.md`.
