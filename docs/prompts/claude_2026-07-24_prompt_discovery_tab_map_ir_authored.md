# Discovery (read-only) — Tab map delle view IR-authored: Template / Style / Events / Options vs interprete IR

> Fase 1 di un two-phase. **Read-only: nessun edit al codice.** L'unico file che puoi scrivere è il
> discovery report. Al termine, HARD STOP: la decisione sulla tab map la prende Alfonso in chat.
>
> Questo è il **passo 4 (ultimo) della chiusura del mega task IR**. I passi 1-3 sono chiusi:
> verifica post-chore fatta, branch pushato, dogfooding sbloccato.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

## Contesto

Una view di Jjodel ha storicamente un set di tab di editing (attesi: **Template**, **Style**,
**Events**, **Options**; l'elenco reale va confermato). Con l'arco authoring IR, una view può ora
essere "IR-authored": il suo aspetto è descritto dall'oggetto `ir` e reso dall'interprete IR
(`IRNodeContent` e dintorni), non dal Template JSX classico.

Questo apre una domanda di UX e di architettura che **non è ancora stata decisa**: per una view
IR-authored, cosa succede a quei tab? Restano attivi e coesistono? Diventano read-only? Vengono
nascosti? Uno di essi resta autoritativo su un pezzo del rendering (per esempio Style che inietta
CSS che può sovrascrivere quello che dipinge l'interprete)?

Oggi non lo sappiamo con precisione, e il rischio concreto è **doppia autorità sullo stesso pixel**:
due sorgenti che scrivono lo stesso aspetto, con precedenza determinata da accidenti di CSS o di
ordine di render invece che da una decisione di design.

**Obiettivo della discovery**: mappare il comportamento reale, non proporre la soluzione. La tab map
la decide Alfonso a partire dal tuo report.

## COSA mappare (con `file:riga` per ogni finding)

### 1. Censimento dei tab

Elenco **reale** dei tab di editing di una view: nomi esatti come compaiono in UI, componente che li
rende, file:riga della definizione della lista. Se il set di tab varia per tipo di view (object /
class / enum / edge / package), riportalo.

### 2. Cosa persiste ciascun tab

Per **ogni** tab, con file:riga:

- quale campo del data model scrive (nome del campo sul DViewElement o equivalente);
- forma del dato (stringa JSX? blocco CSS? handler? flag?);
- chi lo legge a render-time.

È il cuore del report: serve una tabella tab → campo persistito → consumatore a render-time.

### 3. Punti di collisione con l'interprete IR

Per ciascun tab, stabilisci se il suo output **coesiste**, **viene ignorato**, o **compete** con
l'interprete IR quando la view ha `ir` popolato. In particolare:

- **Template**: quando una view è IR-authored, il Template JSX classico viene ancora valutato?
  Chi decide il ramo (grep del punto in cui si sceglie tra rendering classico e ramo IR, atteso in
  `ObjectNode.tsx` o in un resolver a monte)? Il Template resta persistito e inerte, o viene
  scavalcato solo a render-time?
- **Style**: il CSS del tab Style viene ancora iniettato per una view IR-authored? Se sì, con quale
  specificità rispetto agli stili dell'interprete IR (che dipinge border/fill **inline** su
  `.ir-node-content`, più le regole `BASE_CSS` di `irStyle.ts`)? Un inline dell'IR vince su un CSS
  dello Style tab senza `!important`: verifica se lo Style tab può emettere `!important` e quindi
  scavalcare l'authoring IR.
- **Events**: gli handler sono ortogonali all'aspetto o toccano anche il rendering? Restano validi
  su un nodo IR-authored (il DOM è diverso: `.ir-node-content` invece della struttura classica)?
  Segnala se ci sono selettori o assunzioni sul DOM classico che si romperebbero.
- **Options**: quali opzioni hanno effetto sull'aspetto e sono quindi potenzialmente duplicate
  dall'authoring IR (per esempio shape, dimensioni, collapse)? Elenco puntuale, è quello che serve
  per decidere cosa nascondere.

### 4. Dove vive il flag "questa view è IR-authored"

Come si stabilisce, a runtime e in UI, che una view è IR-authored: campo, predicato, entry-point
("Abilita authoring IR", `EnableIRPanel`). File:riga. Serve perché qualunque tab map si deciderà
avrà bisogno di questo predicato per condizionare la UI.

### 5. Reversibilità

Cosa accade se si **disabilita** l'authoring IR su una view che lo aveva (se l'operazione esiste):
l'oggetto `ir` viene cancellato o resta orfano? Il Template classico è ancora quello di prima, o è
stato sovrascritto/svuotato all'abilitazione? Questo determina se la tab map può essere una scelta
reversibile o un punto di non ritorno. Se l'operazione di disabilitazione **non esiste**, dillo
esplicitamente.

### 6. Precedenti in UI

Esiste già nel codebase un pattern di tab disabilitato/nascosto/read-only condizionale (progressive
disclosure, Basic/Advanced, tab condizionali) che si possa riusare per la tab map? File:riga di un
esempio concreto. Serve per non inventare un meccanismo nuovo quando ce n'è già uno in casa.

## Report OBBLIGATORIO

Salva il report in:

```
docs/discovery/discovery_<data-di-esecuzione>_tab_map_ir_authored_views.md
```

con `<data-di-esecuzione>` in formato `YYYY-MM-DD` (se lo esegui il 25 luglio 2026:
`discovery_2026-07-25_tab_map_ir_authored_views.md`). Crea `docs/discovery/` se non esiste.

Contenuto minimo: obiettivo, file letti con path completi, i sei findings con `file:riga`, la
**tabella tab → campo persistito → consumatore a render-time** (punto 2), i punti di collisione
(punto 3) ordinati per gravità, rischi, domande aperte per Alfonso.

Aggiungi una sezione finale **"Opzioni di tab map"** in cui elenchi, senza scegliere, le
alternative che il codice rende praticabili (per esempio: nascondere i tab ridondanti; lasciarli
read-only con avviso; coesistenza con precedenza dichiarata; tab Style come override esplicito
sopra l'IR). Per ciascuna: cosa richiederebbe toccare, e quale rischio introduce. **Non
raccomandare una vincente**: la scelta è di Alfonso.

## HARD STOP

Dopo aver scritto il report, **FERMATI**. Nessun edit al codice. Il report puoi committarlo da solo
con `git add` del **solo** file del report (mai `git add .`, mai `git commit -a`), messaggio
`docs: discovery tab map for IR-authored views`, più l'entry in `docs/claude-code-log.md`. Poi torna
in chat col contenuto del report.

## COME

- Solo lettura. Grep globali sui nomi dei tab, sui campi persistiti, sul predicato IR-authored.
- Zero modifiche al codice, zero refactoring, nessun rename.
- Non toccare la critical zone (`useJjomSync.ts`, `portDistribution.ts`).
- Se un componente atteso non esiste con quel nome, **non concludere che la feature non esiste**:
  cerca per campo persistito e per stringa UI, e segnala l'incertezza nel report.

## RIFERIMENTI

- Interprete IR e painting: `frontend/src/components/editor-v2/viewpoint/ir/` (`IRNodeContent.tsx`
  per il render e gli inline border/fill, `irStyle.ts` per `BASE_CSS` e la neutralizzazione di
  `.mm-node` via `:has(> .ir-node-content)`, `irTypes.ts` per lo schema).
- Entry-point dell'authoring: `EnableIRPanel` ("Abilita authoring IR"), pannello
  `VertexAuthoringPanel.tsx`. **Non toccare** il memo `featureInfo` di quest'ultimo.
- Ramo IR del nodo: `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`.
- Discovery recenti utili come modello di formato: `discovery_2026-07-24_shapes_circle_diamond.md`,
  `discovery_2026-07-23_ir_feature_picker_stale.md`.
