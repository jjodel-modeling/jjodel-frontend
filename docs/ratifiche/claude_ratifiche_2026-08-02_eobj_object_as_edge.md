# Ratifiche E-obj (authoring object-as-edge)

**Data**: 2026-08-02
**Fonte**: `docs/discovery/discovery_2026-08-02_eobj_object_as_edge_authoring.md` (Q1..Q8 + rischi 1..10).
**Stato**: ratificato in chat. Vincolante per il prompt di implementazione `2026-08-02_prompt_faseEobj_object_as_edge_authoring.md`.
**Rapporto con l'addendum**: emenda `spec_2026-07-26_ir_edge_authoring_addendum.md` §D8 su un punto (vedi R-3). Nessuna modifica allo schema IR, nessun bump di `irVersion`.

## Il fatto che governa tutto

`isObjectAsEdge` è calcolato, non dichiarato: `irCompile.ts:430` lo deriva da `!!(sourceExpr && targetExpr)`. Non esiste un campo che nomini la natura. Ne discendono tre conseguenze che il pannello deve governare, non aggirare:

- una edge view senza capi **è** una reference-as-edge, viva sul canvas;
- con un solo capo resta reference-as-edge e la PathExpr è inerte, senza alcun segnale;
- appena entrambi i capi risolvono, ogni istanza della metaclasse **sparisce come nodo** (`irEdgeViews.ts:226`) e i suoi edge reali vengono soppressi (`:228`).

La strategia ratificata è una sola idea applicata dappertutto: **rendere la scrittura dei capi atomica**. Se il pannello non può mai scrivere un IR con un capo solo, il discriminante strutturale è sempre corretto, la natura è sempre ri-derivabile, e non serve nessun campo nuovo.

## R-1 (Q2, dominante) — La natura resta strutturale

Nessun campo `nature` nello schema. La natura vive in stato locale React, derivata al seed e a ogni reset con `deriveNature(ir) = !!(ir.edge?.source && ir.edge?.target)`.

Rationale: introdurre un campo esplicito crea una seconda fonte di verità per un fatto già derivabile dai dati, e apre il caso divergente (dichiarata object, capi assenti) che qualcuno dovrà poi risolvere con una precedenza arbitraria. Il costo dichiarato dalla discovery per la variante consumata dal resolver (5-8 righe che cambiano la semantica di risoluzione di **ogni** edge view esistente) è sproporzionato rispetto al problema, che è di sessione e non di persistenza.

**Meccanismo che lo rende sicuro (R-2)**: i due capi si scrivono e si cancellano insieme. Il draft riceve `edge.source` e `edge.target` solo quando entrambe le espressioni sono valorizzate e valide; se una viene svuotata o invalidata, **entrambe le chiavi vengono droppate**. Un IR con un capo solo non è più producibile dalla UI. L'unico caso perso è l'autore che sceglie object, valorizza un capo e chiude: nulla è stato persistito, quindi alla riapertura la view è coerentemente reference. È il comportamento onesto.

## R-2 (Q1) — La natura si sceglie dentro il pannello

Una sola voce `edge` in `EnableIRPanel`, con un selettore di natura in cima a `EdgeAuthoringPanel`.

Rationale: sotto R-1 due voci distinte nel selettore di kind produrrebbero **lo stesso identico seed**, cioè una scelta che la UI dichiara e i dati non registrano; è una bugia di interfaccia che si scopre alla prima riapertura del pannello. La natura deve vivere dove vivono i campi che governa. In più `ViewData.tsx` non si tocca (routing per kind, OQ-7) e `irDefaults.ts` non serve una seconda factory.

Su `EnableIRPanel` cambiano due stringhe: l'etichetta `Edge (reference)` diventa `Edge` (`:11`) e il testo di aiuto del ramo edge (`:128-133`) diventa neutro rispetto alla natura. Sono label, non identificatori: la regola sui rinomini non è violata.

**Transizioni di natura**, esplicite e simmetriche: reference verso object droppa `reference`; object verso reference droppa `edge.source` e `edge.target`. Entrambe marcano dirty e passano dal commit debounced normale. Nessuna conversione silenziosa, nessun campo lasciato orfano: chiude il rischio 5 (IR ibridi accettati dalla validazione) alla sorgente, senza toccare `irValidate`.

## R-3 (Q3) — Matching inline, `MatchingSection` non si tocca (emenda D8)

Il ramo object riusa il matching inline già scritto in E-ref. `MatchingSection.tsx` resta com'è, tipizzata `VertexViewIR`, con un solo consumer.

Rationale: l'addendum D8 ipotizzava di allargarla quando il pannello edge non esisteva ancora. Oggi il matching inline è scritto, verificato e **già neutro rispetto alla natura** (metaclassi, predicate, priorità). Adottare `MatchingSection` significherebbe cancellare circa 130 righe verificate dal ramo reference per sostituirle con un componente che comunque non sa ospitare `reference`: costo reale alto, beneficio nullo, e il rischio si concentrerebbe esattamente sul ramo landato senza smoke documentato (rischio 1). Il costo della strada inline misurato dalla discovery è di circa due righe di gate.

Conseguenza: `exclusive` resta fuori (R-5 di E-ref confermata). La discovery ha verificato che il campo è **inerte per entrambe le nature** del kind edge (`irResolveCore.ts:168` è irraggiungibile dal ramo edge, `CompiledEdgeView` non lo espone): esporlo autorerebbe un controllo che nessun resolver legge.

## R-4 (Q4) — Wildcard disabilitato sul ramo object

Sul ramo object il toggle "Tutte le metaclassi" è reso **disabilitato**, non nascosto, con un hint che dice perché.

Rationale: `metaclasses:'*'` con natura object non è una scelta sconsigliabile, è **non esprimibile**: il gate `irResolveCore.ts:126` la lascia fuori da ogni bucket e la view non produce nulla, senza warning. Impedire batte informare quando la cosa impedita non esiste nel modello. Disabilitato anziché nascosto perché l'affordance sparita alla commutazione di natura genera la domanda "dove è finito", mentre l'hint la risponde in anticipo.

Se il draft arriva già con `metaclasses:'*'` e l'autore passa a object, nessuna conversione silenziosa: `ErrorText` che chiede di nominare almeno una metaclasse, e i picker dei capi restano disabilitati finché non lo fa. Cade quasi da sé, perché `featureInfo` pinna la classe sul primo nome di `draft.metaclasses` e con il wildcard non risolve nulla: `PathBuilder` è già progettato per `features: null` più `disabledHint`.

## R-5 (Q5) — `PathBuilder` con feature filtrate nel pannello, più guardia sull'array

I due capi usano `PathBuilder` passando `features={{ attributes: [], references: features.references }}`. Nessuna modifica al widget.

Rationale: la restrizione è del chiamante, non del componente. Aggiungere una prop `only` a un widget usato da otto superfici per soddisfare un solo call-site è il modo standard di far crescere un design system per accumulo.

**Guardia sull'array**: un'espressione che termina in `.values` (array intero) è rifiutata con `ErrorText`, perché `toId` (`irEdgeViews.ts:194-198`) rifiuta gli array e l'effetto sarebbe il fallback silenzioso, cioè il modo peggiore di sbagliare. La forma indicizzata `$ref.values[0]` resta ammessa: i capi multi-valore sono legittimi e bloccarli escluderebbe metamodelli reali. La guardia vale come pre-condizione della scrittura atomica: espressione non valida equivale a capo assente, quindi entrambe le chiavi restano fuori dall'IR.

Resta aperto e **fuori scope** il comportamento di `handleReconnect` su slot multi-valore (`EditorV2.tsx:1886` scrive `slot.value` con semantica single-value): va registrato tra i rischi noti, non risolto da E-obj.

## R-6 (Q6) — `persistWaypoints` fuori dal pannello

Non esposto. Round-trip verbatim come `routing`.

Rationale: è un interruttore di persistenza il cui effetto è invisibile nel punto in cui lo si tocca (metterlo a `false` fa smettere di rileggere waypoint e side pin già scritti sul DVertex, `EditorV2.tsx:1329` e `:1353`). Un controllo che non si può spiegare in una riga di help non entra in un pannello che ha come obiettivo dichiarato la riduzione del cognitive load. Il default di compile è `true`, che è il comportamento giusto.

## R-7 (Q7) — Avviso sull'effetto "nodo nascosto", senza conferma

`HelpText` sempre visibile nella sezione Capi del ramo object, che dice in modo piatto che le istanze della metaclasse verranno disegnate come linee e non appariranno più come nodi. Nessun modale di conferma.

Rationale: è il rischio 3, quello che fa pensare all'utente di aver rotto il progetto. Va detto prima, non dopo. Ma la scrittura atomica concentra l'effetto in un istante unico e deliberato (il completamento del secondo capo), e l'operazione è reversibile svuotando un capo: un modale aggiungerebbe attrito a un'azione già informata e reversibile.

## R-8 (Q8) — Banco costruito a mano

Verifica visiva su un metamodello `StateMachine { State{name}, Transition{src: State, tgt: State} }`, creato dalla UI, con due o tre State e due Transition. Entrambi i capi single-valued.

Rationale: è esattamente il fixture `edgeWorld()` dei test (`ir.test.ts:526-548`), quindi il comportamento atteso è già codificato e falsificabile. `Graph.ecore` porta due variabili estranee alla cosa da verificare (importer non coperto da alcun test, `target` multi-valore che attiva la semantica di reconnect non verificata): resta come stress test successivo sui capi multi-valore, non come banco di prima verifica.

## Rischi accettati e registrati (non risolti da E-obj)

1. **Reconnect su reference multi-valore** (`EditorV2.tsx:1886`): semantica single-value su slot `upperBound=-1`, non verificata. Va nella mappa tra i rischi noti.
2. **IR ibridi accettati da `validateIR`** (`reference` più capi, oppure un capo solo): il pannello non li produce più, ma la validazione continua ad accettarli se arrivano da console o da un IR scritto a mano. Un check incrociato tocca `irCompile`/`irValidate` e potrebbe invalidare view già persistite: slice separata, da ratificare a parte.
3. **Superficie di interazione** (rischio 6 della discovery): indicizzare una object-as-edge view cambia palette e connect rules (`irInteraction.ts:64-78`). Comportamento già vivo da E0, non introdotto da E-obj, ma va dichiarato nel report di chiusura della Fase 2.
4. **Gap di processo**: il landing di E-ref (`9bd8cad9a`, 2026-07-28) non ha entry in `docs/claude-code-log.md`. Da colmare con un backfill nella stessa Fase 2.

## Perimetro atteso della Fase 2

Tre file di codice più il log: `EdgeAuthoringPanel.tsx` (principale), `__tests__/edgeAuthoring.test.ts` (estensione), `EnableIRPanel.tsx` (due stringhe), `docs/claude-code-log.md` (entry più backfill E-ref).

Non si toccano: `irTypes.ts`, `irCompile.ts`, `irResolveCore.ts`, `irDefaults.ts`, `MatchingSection.tsx`, `VertexAuthoringPanel.tsx`, `PathBuilder.tsx`, `ViewData.tsx`, e per nessun motivo la critical zone.
