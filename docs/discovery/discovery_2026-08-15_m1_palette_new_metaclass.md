# Discovery 2026-08-15: metaclasse concreta assente dal rail M1 + classi astratte in "Force Type"

Fase 1 read-only. Nessun file di codice modificato. Branch `alfonso-frontend-jjtl`,
working tree pulito (solo `.claude/settings.local.json` e `_to_delete/` untracked).

## Obiettivo

Due sintomi segnalati da Alfonso:

1. In un modello M1 conforme a un metamodello, l'aggiunta di una metaclasse concreta
   e istanziabile non fa comparire la voce corrispondente nel rail "Instances"
   dell'editor di modello v2, benche' il metamodello registri regolarmente la classe.
2. Il dropdown "Force Type" del pannello Properties elenca anche metaclassi astratte,
   che non dovrebbero essere selezionabili.

## File letti

- `frontend/src/components/editor-v2/panels/PalettePanel.tsx` (272 righe, letto per intero)
- `frontend/src/components/editor-v2/hooks/useEditorMode.ts` (517 righe, letto per intero)
- `frontend/src/components/editor-v2/EditorV2.tsx` (righe 1340-1400, 3920-3940; call site `useEditorMode(modelid)` a riga 445)
- `frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` (righe 30-175)
- `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` (righe 1-90)
- `frontend/src/components/editors/Info.tsx` (righe 580-700, metodo `forceConform`)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (righe 1890-1930, 2893, 3136-3147, 5525-5545, 6830-6880)
- `docs/decisions.md` (coda, serie R-IRN), `docs/claude-code-log.md` (ultime entry)

## Sintomo 2: "Force Type" (causa accertata)

`Info.forceConform` (`Info.tsx`, ~riga 683) popola il `<select>` con
`(mm.classes || []).map(c => <option .../>)`. Nessun filtro.

Il predicato canonico esiste gia' nel L-layer:

    // LModelElement.tsx:2893
    get_instantiable(c: Context): LClass['instantiable'] {
        return !(c.data.abstract || c.data.interface || c.data.isSingleton);
    }

Lo stesso predicato e' replicato in `LModelElement.tsx:6858` nel motore di schema
matching (`instantiable = !(raw.abstract || raw.interface || raw.isSingleton)`), a
conferma che "istanziabile" nel codebase significa non-astratta, non-interfaccia e
non-singleton. Filtrare solo su `abstract` sarebbe piu' stretto della semantica del
dominio.

Nota di completezza: `LModel.get_classes` (riga 5533) per un metamodello delega a
`_getallSub`, quindi `mm.classes` include gia' le classi annidate nei package. Il
perimetro dell'elenco e' corretto; manca solo il filtro.

Fix candidato, una riga, fuori dalla critical zone:

    {(mm.classes || []).filter(c => c.instantiable).map(c => ...)}

Da verificare al momento del diff: che `instanceof` corrente resti selezionabile anche
se punta a una classe diventata astratta a posteriori (altrimenti il `value` del select
non matcha nessuna option e il campo appare vuoto).

## Sintomo 1: rail M1 (tre ipotesi, non ancora discriminate)

La catena che alimenta il rail:

    useEditorMode(modelid)            -> modeInfo.rootableClasses
      EditorV2.tsx:1381 irPalette     -> applyIRPaletteFilter(candidates, irInteractionPlan)
      EditorV2.tsx:3934               -> <PalettePanel rootableClasses={irPalette.classes} />
    PalettePanel.tsx:129              -> lista "Instances"

Ci sono due filtri semantici in serie piu' un possibile problema di reattivita'.

### H1 — Filtro "rootable": la classe e' target di una composition

`useEditorMode.ts`, terzo passo di `resolveM1Info`:

    const compositionTargetIds = new Set<string>();
    for (const cls of rawClasses)
      for (const ref of cls.references)
        if (ref.containment) { add(ref.targetClassId); add(...targetInfo.concreteSubclasses) }

    const rootableClasses = rawClasses.filter(
        c => !c.isAbstract && !compositionTargetIds.has(c.id)
    );

Una metaclasse concreta che sia bersaglio di una qualunque composition esce dal rail
**per costruzione**. Il rail dichiara solo le radici trascinabili sul canvas; i figli
si creano con il right-click sul nodo padre (vedi la sezione hint di `PalettePanel`,
"right-click on a node to add children"). Il caso d'uso tipico (aggiungo una metaclasse
e la aggancio come figlia di una classe esistente) ricade esattamente qui.

Se l'ipotesi regge, non c'e' un bug di propagazione: c'e' un disaccordo tra il nome
della sezione ("Instances", percepito come "metaclassi istanziabili") e la semantica
implementata ("classi radice"). La correzione e' una decisione di design, non un fix.

### H2 — Filtro IR: il viewpoint attivo non dichiara view per la nuova metaclasse

`irInteraction.ts:166`:

    if (!plan?.paletteMetaclasses) return { classes: rootable, fallback: false };
    const filtered = rootable.filter(c => plan.paletteMetaclasses!.includes(c.name));
    if (filtered.length > 0) return { classes: filtered, fallback: false };
    return { classes: rootable, fallback: rootable.length > 0 };

`paletteMetaclasses` viene da `deriveIRInteraction`, che raccoglie i nomi delle
metaclassi presenti in `index.byMetaclass` e `index.objectAsEdgeByMetaclass`, cioe' le
metaclassi per cui il viewpoint attivo dichiara una view IR. Una metaclasse appena
creata, priva di view IR, non e' nell'insieme e viene scartata. Il fallback normativo
(spec v1.2 sez. 6) scatta **solo** se l'intersezione e' vuota: con le altre classi
ancora dichiarate, l'intersezione e' non vuota e la nuova classe sparisce in silenzio,
senza il notice `palette-notice`.

Condizione di attivazione: `useIRInteractionPlan()` non nullo, cioe'
`computeIRSignature(state)` non vuota. Su un progetto senza view IR autorate il piano
e' `null` e H2 e' esclusa. La serie R-IRN (decisioni 2026-08-13) sposta pero' il
progetto verso view IR-native con seed alla creazione (R-IRN-4), quindi H2 e' tanto piu'
probabile quanto piu' il progetto e' avanti su quel fronte.

### H3 — Memo congelata (reattivita')

`useEditorMode` ricalcola su `[modelId, explicitMode, metamodelRefFromStore,
metamodelClassSignature]`. La firma `metamodelClassSignature` e' costruita solo se
`metamodelRefFromStore` e' valorizzata; quella selector legge
`state.idlookup[modelId].instanceof ?? .metamodel` e ritorna `null` se il valore non e'
una stringa (o il primo elemento di un array).

Se per qualsiasi ragione la ref non e' leggibile dal raw, il ramo di fallback su LProxy
(righe 196-210) risolve comunque la modalita' M1 al primo render, ma la firma resta `''`
e **non cambia mai**: la memo si congela allo stato di mount e nessuna aggiunta di
metaclassi la ridesta. `DModel.instanceof` e' dichiarato `Pointer<DModel>` (stringa),
quindi nel caso nominale la selector funziona; l'ipotesi resta aperta solo per stati
anomali.

Discriminante operativo: se dopo un reload della pagina o una riapertura del tab del
modello la metaclasse compare, e' H3. Se non compare nemmeno da fredda, e' H1 o H2.

## Rischi e vincoli

- `useEditorMode.ts` non e' nell'elenco §3.1 della critical zone, ma alimenta
  `EditorV2` e il write path di creazione istanze (`isRootable` a `EditorV2.tsx:2010` e
  `:2151` gatea il drop). Allargare `rootableClasses` cambia anche cosa e' droppabile
  sul canvas: non e' un ritocco di sola presentazione.
- `applyIRPaletteFilter` ha copertura a test (`viewpoint/ir/__tests__/ir.test.ts:874`).
  Qualunque modifica alla semantica del fallback va riflessa li' e verificata contro la
  spec v1.2 sez. 6, che qualifica il filtro derivato come ausilio di focus e non come
  restrizione.
- `Info.tsx` e' fuori dalla critical zone: il fix del sintomo 2 e' indipendente e
  committabile da solo.

## Domande aperte per Alfonso

1. Dopo un reload della pagina (o chiusura e riapertura del tab del modello) la nuova
   metaclasse compare nel rail? Serve a separare H3 dalle altre due.
2. La nuova metaclasse e' bersaglio di una composition da un'altra classe del
   metamodello? Se si', H1 spiega il sintomo per costruzione.
3. Il progetto ha un viewpoint attivo con view IR autorate? Se si', H2 e' in gioco.
4. Semantica attesa del rail "Instances": solo classi radice (stato attuale), oppure
   tutte le concrete istanziabili con il drop gatato per compatibilita' del contenitore?
   La risposta decide se il lavoro e' un fix o un cambio di spec.

## Esito della discriminazione (risposte di Alfonso, 2026-08-15)

1. La metaclasse non compare nemmeno dopo reload -> **H3 esclusa** (nessun problema di
   reattivita': la memo si ricalcola, il risultato e' lo stesso).
2. La metaclasse non e' bersaglio di composition -> **H1 esclusa**: passa il filtro
   rootable (concreta e non contenuta), quindi e' in `modeInfo.rootableClasses`.
3. Viewpoint IR attivo -> **H2 confermata**. `applyIRPaletteFilter` intersecca le
   rootable con `plan.paletteMetaclasses` e la nuova classe, priva di view IR
   dichiarata, cade fuori. Il fallback non scatta perche' l'intersezione con le classi
   preesistenti resta non vuota.
4. Semantica del rail confermata: solo classi radice. Nessun cambio al filtro rootable.

### Perimetro reale del difetto

`deriveIRInteraction` (`irInteraction.ts:54`) costruisce `paletteMetaclasses` **solo** da
`index.byMetaclass` e `index.objectAsEdgeByMetaclass`, cioe' dalle view con
`ir.metaclasses` esplicite. Restano fuori:

- le metaclassi coperte da una view wildcard (`ir.metaclasses === '*'`, raccolte in
  `index.wildcard`), che rendono regolarmente;
- le metaclassi senza alcuna view, che rendono astratte per costruzione (spec §10,
  ratificato in R-IRN-1/R-IRN-3 come fallback normativo, non stato di errore).

Il filtro tratta quindi "senza view dedicata" come "non istanziabile", che e' piu' forte
di quanto la spec v1.2 sez. 6 autorizzi: il filtro derivato e' dichiarato ausilio di
focus, e solo un `interaction.palette` esplicito puo' restringere.

Conseguenza operativa misurata sul codice: la classe sparisce **senza segnale**. Il
notice `palette-notice` e' legato al solo `fallback`, che qui e' `false`.

### Cosa NON e' coinvolto

Il gate del drop (`EditorV2.tsx:2010` e `:2151`) usa `mi.rootableClasses`, non
`irPalette.classes`. Il filtro IR e' quindi puramente presentazionale: rimettere la
classe nel rail non tocca il write path di creazione istanze ne' la sync. Il Layer
Impact Report resta non richiesto se il diff si ferma a `irInteraction.ts` +
`PalettePanel.tsx`.

### Opzioni di correzione

- **A. Gruppo secondario nel rail.** Il gruppo primario resta la lista IR-dichiarata; le
  rootable non dichiarate finiscono in una sezione separata e visivamente attenuata
  ("Not in this viewpoint"). Il focus del viewpoint sopravvive, la trappola silenziosa
  no. Il drop di una di queste crea un nodo che rende astratto, che e' anche il punto di
  partenza naturale per autorarne la view.
- **B. Union piatta.** `applyIRPaletteFilter` ritorna filtrate + non dichiarate senza
  distinzione visiva. Minimo diff, ma il viewpoint perde ogni valore di focus.
- **C. Solo notice.** Si tiene il filtro e si aggiunge una riga di avviso con il conteggio
  delle rootable escluse. Toglie il silenzio, non l'attrito.
- **D. Wildcard nel piano.** Ortogonale alle precedenti e comunque dovuta: se
  `index.wildcard` non e' vuoto il viewpoint dichiara una view valida per ogni
  metaclasse, quindi `paletteMetaclasses` va posto a `null` (nessuna restrizione).
  Oggi una wildcard view non contribuisce al piano e viene ignorata.

Raccomandazione: **A + D**, con i test di `ir.test.ts:874` estesi ai due casi nuovi.
