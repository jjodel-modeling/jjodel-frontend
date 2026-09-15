# Discovery (read-only) — Tab map delle view IR-authored, con triage dell'autorità

> **Aggiorna e sostituisce** `2026-07-24_prompt_discovery_tab_map_ir_authored.md`, mai eseguito.
> Il perimetro di allora copriva il solo vertice; oggi l'arco IR comprende vertice, riga ed edge,
> il tab Events è già stato deciso, e il bersaglio della tab map è ratificato. Cambia quindi anche
> la domanda: non più "quali opzioni abbiamo", ma "chi è l'autorità, e cosa migra dove".
>
> Fase 1 di un two-phase. **Read-only: nessun edit al codice.** L'unico file che puoi scrivere è
> il discovery report. Al termine, HARD STOP.
>
> **Esecutore**: può essere Claude Code oppure la sessione Cowork sul repo montato (ratifica di
> processo 2026-08-03 sulla delega delle discovery). Se esegui dal bridge Cowork, ricorda che
> `git commit` non funziona da lì: prepara il file e delega commit e push ad Alfonso.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

## Contesto

Il dogfooding del 2026-08-04 ha prodotto la frizione con la frequenza più alta della sessione:
il tab IR è un **insieme indifferenziato di parametri generali**, e i tab dell'editor v1
coesistono con esso sulla stessa view. Il fastidio non è solo il sacco piatto: è dover sapere
quali tab sono morti prima di poter lavorare. La parte che pesa è quindi quella **sottrattiva**.

Il bersaglio è già ratificato (2026-08-03): per le view IR-authored la barra si ferma a
**Applies to · Shape · Content**. Quello che manca per arrivarci non è una decisione di design,
è una **mappa dell'autorità**: per ogni tab oggi visibile, chi è la sorgente di verità del dato
che scrive, e se qualcuno lo legge ancora.

Il rischio concreto resta quello identificato a luglio: **doppia autorità sullo stesso pixel**,
con precedenza determinata da accidenti di CSS o di ordine di render invece che da una decisione.

## Il censimento è già fatto: confermalo, non rifarlo

L'elenco dei tab è stato letto il 2026-08-04 in `frontend/src/components/editors/views/ViewData.tsx`,
array `tabs: TabDescriptor[]` (inizio ~`:65`). Stato al `fc0af70d2`:

| id | label | componente | condizione di visibilità |
|---|---|---|---|
| `apply-to` | Apply to | `InfoData` | sempre |
| `template` | Template | `TemplateData` | `isV` (non viewpoint) |
| `ir` | IR | route su `ir.kind` | `showIRTab`, `ViewData.tsx:61` |
| `style` | Style | `PaletteData` | sempre |
| `events` | Events | `EventsData` | `isV` |
| `options` | Options | `GenericNodeData` | `isV` |
| `components` | Components | `ComponentsTab` | `isVP` (solo viewpoint) |

Il route del tab IR (`:89-101`): `vertex` → `VertexAuthoringPanel`, `row` → `RowAuthoringPanel`,
`edge` → `EdgeAuthoringPanel`, `ir` presente ma di kind ignoto → messaggio "authoring non ancora
disponibile", nessun `ir` → `EnableIRPanel`.

Il gate (`:61`):
`showIRTab = (ir?.kind === 'vertex') || (ir?.kind === 'row') || (ir?.kind === 'edge') || (isV && !ir && view.isEdge !== true)`.

**Primo compito**: verifica che la tabella sia completa (l'array prosegue oltre `:140`, controlla
se ci sono altri tab) e ancora vera. Se è cambiata, correggila nel report e dillo esplicitamente.
Non ripartire da zero.

## COSA mappare

Ogni finding con `file:riga`. Dove il comportamento dipende da `ir.kind`, riporta le tre righe
separate: **vertex**, **row**, **edge**.

### 1. Cosa persiste ciascun tab

Per ognuno dei sette tab: quale campo del data model scrive (nome sul `DViewElement` o
equivalente), forma del dato (stringa JSX, blocco CSS, handler, flag, oggetto), e **chi lo legge
a render-time**. È la tabella tab → campo persistito → consumatore.

Il consumatore è la parte che conta. Un campo scritto e mai letto è la definizione operativa di
tab morto, e non si stabilisce leggendo il tab: si stabilisce col grep del lettore.

### 2. Triage dell'autorità (il deliverable principale)

Per ogni tab, e per ogni `ir.kind` dove il comportamento differisce, un verdetto in **uno di tre
secchi**, con l'evidenza che lo sostiene:

- **morto** — nessun consumatore vivo a render-time per una view IR-authored. Si rimuove.
- **ridondante** — c'è un consumatore, ma l'IR scrive lo stesso aspetto e vince. Si rimuove il
  tab, non il campo.
- **autoritativo** — è oggi l'unico posto da cui quel dato si scrive. Deve sopravvivere, e la
  domanda diventa dove migra fra Shape e Content.

**Il report deve contenere questa tabella.** Se esce una narrazione al posto della tabella, la
discovery non è azionabile e va rifatta. Dove non riesci a decidere il secchio, scrivi
**incerto** con la ragione precisa: un incerto motivato vale più di un verdetto inventato.

Attenzione particolare a **Style** (`PaletteData`): l'interprete IR dipinge border e fill
**inline** su `.ir-node-content`, più le regole `BASE_CSS` di `irStyle.ts`. Un inline vince su un
CSS senza `!important`. Verifica se il tab Style può emettere `!important`: se può, è
autoritativo per accidente, ed è esattamente il caso peggiore da documentare.

Attenzione anche a **Template** (`TemplateData`): quando una view è IR-authored, il JSX classico
viene ancora **valutato**, o solo persistito e inerte? Chi sceglie il ramo, e dove.

### 3. Le tre domande sospese, esplicitamente

Sono ferme da settimane in attesa di questa discovery. Il report deve rispondere a tutte e tre,
con evidenza, senza raccomandare la soluzione:

- **Unificazione dell'autorità sul matching**: quali superfici scrivono oggi il criterio di
  applicabilità di una view (`appliableToClasses`, `appliableTo`, predicati IR, altro), e se si
  sovrappongono. Il tab Apply to e l'IR sono entrambi in gioco.
- **Ritiro del Basic/Advanced locale**: il sub-tab `basic/advanced` interno a
  `VertexAuthoringPanel` (era a `:55`, verifica la riga attuale) è **scollegato** dal mode
  globale (`useInterfaceMode`, localStorage `jjodel.interfaceMode`, `U.interfaceMode`, evento
  `INTERFACE_MODE_CHANGE`, più Redux `state.advanced`). Cosa nasconde oggi, e chi si romperebbe
  se sparisse in favore del mode globale. Verifica se `RowAuthoringPanel` e `EdgeAuthoringPanel`
  hanno un sub-tab analogo o no: se divergono, è un finding.
- **Scioglimento di Options** (`GenericNodeData`): elenco puntuale delle opzioni che hanno
  effetto sull'aspetto e che l'authoring IR duplica (shape, dimensioni, collapse, altro). È
  quello che serve per decidere cosa sparisce e cosa migra.

### 4. Mappa di migrazione verso i tre tab ratificati

Per ogni controllo che il triage classifica **autoritativo**, indica dove atterrerebbe fra
**Shape** e **Content**, e su quale criterio. Se un controllo non sta comodo in nessuno dei due,
dillo: è il segnale che i due tab ratificati non bastano, ed è un'informazione che vale la
ratifica stessa.

Non serve progettare i due pannelli. Serve sapere che nessun controllo autoritativo resta senza
casa.

### 5. Reversibilità

Cosa accade se si **disabilita** l'authoring IR su una view che lo aveva, ammesso che
l'operazione esista: l'oggetto `ir` viene cancellato o resta orfano? Il Template classico è
ancora quello di prima, o è stato svuotato all'abilitazione? Determina se la tab map è una scelta
reversibile o un punto di non ritorno. **Se l'operazione non esiste, dillo esplicitamente**
invece di dedurre.

### 6. Precedenti UI per nascondere o marcare

Esiste già un pattern in casa per tab condizionale, disabilitato, o marcato inerte? Il caso
Events è il precedente diretto e recente (`b32c2dbd9`): guarda come è stato marcato e se quel
meccanismo si generalizza. `file:riga` di un esempio concreto. Serve per non inventare un
meccanismo nuovo quando ce n'è già uno.

## Cosa NON rifare

- **Events non si rimette in discussione.** È già ratificato (R-1): superficie di authoring sopra
  un runtime rimosso, marcato inerte in UI, sarà **sostituito e non riparato** quando nascerà il
  tab Behavior insieme al modello di stato. Nel triage entra come **morto, già deciso**, e serve
  solo come precedente per il punto 6.
- **Non proporre la tab map.** Il bersaglio Applies to · Shape · Content è ratificato. La
  discovery produce la mappa dell'autorità e quella di migrazione; la decisione su cosa rimuovere
  la prende Alfonso in chat, sul report.

## Report OBBLIGATORIO

Salva in:

```
docs/discovery/discovery_<YYYY-MM-DD>_tab_map_authority_triage.md
```

con la data di esecuzione. Crea `docs/discovery/` se non esiste.

Contenuto minimo: obiettivo, ipotesi che la discovery sta falsificando, file letti con path
completi, la tabella tab → campo persistito → consumatore (punto 1), la **tabella del triage**
(punto 2), le risposte alle tre domande sospese (punto 3), la mappa di migrazione (punto 4),
rischi, domande aperte per Alfonso.

**Il report va committato**, non lasciato untracked: `CLAUDE.md` regola 16 lo rende obbligatorio
nel task che lo produce. `git add` del **solo** file del report più l'entry in
`docs/claude-code-log.md`, mai `git add .`, mai `git commit -a`. Messaggio:
`docs: discovery on tab authority for IR-authored views`.

## HARD STOP

Dopo il report, **fermati**. Nessun edit al codice. Torna in chat col contenuto.

## COME

- Solo lettura. Grep globali sui campi persistiti e sui loro lettori.
- Zero modifiche al codice, zero refactoring, nessun rename.
- Non toccare la critical zone (`useJjomSync.ts`, `portDistribution.ts`).
- Se un componente atteso non esiste con quel nome, **non concludere che la feature non esiste**:
  cerca per campo persistito e per stringa UI, e segnala l'incertezza nel report.
- Il verdetto "morto" richiede un grep del **lettore**, non l'assenza apparente di effetto.

## RIFERIMENTI

Fatti già verificati, da non rigrepare.

- **Catena host del pannello**: `Dock.tsx:282` "Properties" → `PropertiesWithTreeView` →
  `editors/Info.tsx` (router per tipo) → `editors/views/ViewData.tsx` (`ViewDataComponent`,
  pannello condiviso State + Transition; diverge su `showIRTab` e nel corpo del tab IR per
  `ir.kind`).
- **Tabs**: definiti inline in `ViewData.tsx`; stili `.view-editor-tab*` in `nestedView.scss`,
  non condivisi con altri pannelli.
- **`.props-header*`** è condiviso fra `ViewData` e l'inspector metaclasse
  (`Info.tsx:905-913`): attenzione se il triage tocca l'header.
- **Basic/Advanced globale**: hook `useInterfaceMode` (localStorage `jjodel.interfaceMode`,
  `U.interfaceMode`, evento `INTERFACE_MODE_CHANGE`) più Redux `state.advanced`. Lo consuma
  `Info.tsx`; `ViewData` e i pannelli di authoring **no**.
- **Interprete IR e painting**: `editor-v2/viewpoint/ir/` (`IRNodeContent.tsx` per il render e
  gli inline border/fill, `irStyle.ts` per `BASE_CSS` e la neutralizzazione di `.mm-node` via
  `:has(> .ir-node-content)`, `irTypes.ts` per lo schema).
- **Ramo IR del nodo**: `editor-v2/nodes/ObjectNode.tsx`.
- **Write path di `ir`**: `LViewElement.set_ir` (`view.tsx:483-484`) =
  `SetFieldAction.new(c.data,'ir',val,'',false)`, non silenzioso. `set_jsxString`
  (`view.tsx:682-684`) fa la stessa scrittura **più** il segnale
  `SetRootFieldAction('VIEWS_RECOMPILE_jsxString', …)`.
- **Critical zone**: nessun import di `useJjomSync` / `portDistribution` nel pannello Properties,
  quindi niente Layer Impact Report.
- **Non toccare** il memo `featureInfo` di `VertexAuthoringPanel`.
- Discovery recenti utili come modello di formato:
  `discovery_2026-08-04_viewpoint_selector_rehydration.md`,
  `discovery_2026-08-03_state_actions_events.md`.

---
**Nome del documento prompt**: 2026-08-04 15:25 prompt_discovery_tab_map_v2_autorita
