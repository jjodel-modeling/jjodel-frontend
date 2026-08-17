# Discovery 2026-08-17 — Fondamenta della slice 1 del pannello di simulazione

**Tipo**: discovery read-only (Fase 1). Nessuna modifica al codice applicativo.
**Base**: branch `alfonso-frontend-jjtl`, HEAD `77d468c99`, working tree pulito all'avvio.
**Governanti dichiarate dal prompt**: R-SIM-1..R-SIM-7.
**Obiettivo**: verificare sul codice le sette fondamenta che la slice 1 poggia (sede dei ruoli,
semantica del prototipo, montaggio del pannello, accesso al modello, aggancio della decorazione,
label edge cross-reference, collisioni di nomi), con citazione file:riga per ogni affermazione.

> **Nota di stato — la Fase 0 non è stata eseguita, perché era già fatta.**
>
> All'avvio della sessione il memo non esisteva e `R-SIM` era libera, con doppio controllo positivo:
> `ls docs/ratifiche/ | grep 2026-08-17` → exit 1 (stesso comando con `2026-08-15` → 2 file);
> `find . -name "*pannello_controllo_simulazione*"` → vuoto (stesso `find` con
> `*memo_ratifica_symbol*` → 1 file); `grep -n "R-SIM" docs/decisions.md` → exit 1 (controllo
> positivo `grep -c "R-IRN"` → 10). Coerente con l'hard stop prescritto dal prompt, la Fase 0 è
> stata sospesa e si è proceduto con la Fase 1.
>
> **A discovery in corso i file sono comparsi nel working tree**, scritti da una sessione Cowork
> parallela (entry di log «analisi ratificata del report state-attributes…», prompt document
> 2026-08-17 15:25). Stato finale: memo presente a
> `docs/ratifiche/claude_2026-08-17_memo_ratifica_pannello_simulazione.md` (nome **senza**
> `controllo`, diverso dal path citato dal prompt), e **R-SIM-1..6 già registrate** in
> `docs/decisions.md:667-698`.
>
> **Le decisioni ratificate divergono da quelle del prompt su un punto sostanziale** (§Riconciliazione).
> Nessuna entry è stata scritta da questa sessione: sarebbero state un duplicato in conflitto.

---

## Sintesi in sei righe

1. **Un campo additivo opzionale sul viewpoint non richiede VersionFixer.** Lo dichiara il codice
   accanto al precedente più vicino (`ir?`): *«serialization is generic, no VersionFixer needed»*.
   Tre precedenti vivi sulla stessa classe, l'ultimo di ieri. *(Domanda superata dalla ratifica:
   i ruoli vanno nel bag della M2, non nel viewpoint — vedi §Riconciliazione. Il finding resta
   valido e utile se il campo viewpoint tornerà in gioco.)*
2. **Il prototipo non ha alcuna nozione di evento**: `step()` fa scattare *tutte* le transizioni
   uscenti di *tutti* gli oggetti attivi. I ruoli `event` e `trigger` sono genuinamente nuovi. E
   un sesto ruolo già configurabile, `transition`, non è letto da nessuno.
3. **`Dock.tsx:280` non è un sito di montaggio.** I tab del gruppo `editors` sono orfani dal
   2026-07-29: mai spinti nel layout. Questo **corregge** un'affermazione della discovery
   precedente. Il pattern vivo è il pannello flottante montato in `Dashboard`.
4. **Il modello corrente si prende da `Selectors.getLastSelectedModel()`**, che restituisce già la
   coppia `{m1, m2}` — esattamente ciò che serve a leggere i ruoli dalla M2.
5. **L'aggancio della decorazione ha tre precedenti sovrapponibili**, tutti con la forma esatta di
   R-SIM-1/R-SIM-3: `irCollapseState` (singleton + `useSyncExternalStore`), `HighlightContext`
   (hook che ritorna una classe CSS, node data mai toccato) e il **problems overlay** citato dalla
   R-SIM-3 ratificata, che è il migliore dei tre perché ha lo snapshot **per nodo** invece del
   contatore globale.
6. **Verifica dovuta n. 1: risposta positiva.** Una edge view IR risolve una label attraverso un
   reference, con multi-hop e **con reattività**, purché sia una view *object-as-edge* — cioè
   esattamente il pattern Transition. Il ruolo decorativo dell'evento **non** entra nel fronte J.

---

## Riconciliazione — prompt (15:22) contro ratifica in repo (15:25)

Le due fonti non coincidono. Elenco delle divergenze, perché la Fase 2 deve partire dalla ratifica,
non dal prompt.

| Punto | Prompt di questa sessione | Ratificato in repo |
|-------|--------------------------|--------------------|
| Path del memo | `…_memo_ratifica_pannello_controllo_simulazione.md` | `…_memo_ratifica_pannello_simulazione.md` |
| Numero di decisioni | R-SIM-1..**7** | R-SIM-1..**6** (`decisions.md:667-698`) |
| **Sede dei ruoli** | «vive **nel viewpoint**, non nel bag della M2» (R-SIM-2 del prompt) | «**nel bag `data.state` del modello M2**, chiavi piatte prefissate `simNode`…`simNextState`, valori pointer» (R-SIM-2 ratificata) |
| Nome del modulo store | `simulationState.ts`, «accanto a `irCollapseState.ts`» | `simRunState.ts` (memo, §Prossimo passo) |
| Montaggio del pannello | «`SimulationPanel.tsx` nel Dock» | «montato in **editor-v2**, mai nello scope dei template» (R-SIM-3) |
| Precedente per l'highlight | non specificato | «pattern **problems overlay**» (R-SIM-3) |
| Scoping `node.state` | R-SIM-7 del prompt | assente dalla serie; assorbito negli addendum A1..A4 del report state-attributes |

**La divergenza che conta è la terza.** Il prompt mi ha fatto istruire la Q1 sulla fattibilità di un
campo additivo sul viewpoint; la ratifica mette i ruoli nel bag della M2 — cioè esattamente dove il
prototipo li ha già (§Q2). Il memo motiva la scelta (`§Razionale`: `MetaData.tsx` dimostra in
produzione la forma «pannello connect-ato che legge e scrive il bag con reattività», e la
configurazione «non richiede nulla di nuovo»). Il finding di Q1 resta agli atti perché risponde a
una domanda che tornerà — ma **non è la strada della slice 1**.

Due note di merito sulla ratifica, dalla Fase 1:

- **R-SIM-2 elenca `simTransition` fra le chiavi.** Nel prototipo il ruolo `transition` è
  configurabile e **non è letto da nessuno** (§Q2, misura: tre occorrenze in `Control.tsx`, nessuna
  nel motore). Portarlo nel contratto significa dichiarare che avrà una funzione, oppure ereditare
  una chiave morta.
- **R-SIM-3 cita il pattern problems overlay, e ha ragione**: è il migliore dei tre precedenti
  (§Q5), perché sottoscrive **per nodo** e non con un contatore globale. Il memo accetta invece
  esplicitamente il contatore globale («il version counter globale del singleton re-renderizza
  tutti i sottoscrittori a ogni step: accettato per la v1»). I due punti sono in tensione: il
  pattern citato non ha quel costo. Vedi domanda aperta 3.

---

## Metodo

Ricerche con `command grep` (BSD grep 2.6.0) per bypassare il wrapper `ugrep --ignore-files`
(CLAUDE.md §5). Ogni asserzione di assenza porta il proprio controllo positivo, dichiarato in linea.

Due avvertenze operative registrate durante la sessione:

- **`frontend/src/examples/` fa esplodere i grep**: contiene dump di stato serializzati su una sola
  riga (1.1 MB da un solo match). Va escluso esplicitamente, altrimenti l'output è illeggibile e la
  ricerca sembra fallita quando non lo è.
- **`exit=$?` dopo una pipe misura l'ultimo comando, non il grep.** Il primo giro di verifica
  collisioni (Q7) stampava `exit=0` per tutte e quattro le sigle: era il codice di `head`, non di
  `grep`. Rifatto contando le occorrenze con `wc -l`, che è la misura giusta per una asserzione
  di assenza.

## File letti

Registro e governance:
- `docs/decisions.md` — :1-40 (intestazione e processo), :614-668 (serie R-IRN, formato di
  riferimento), :667-698 (**serie R-SIM-1..6**, comparsa durante la sessione)
- `docs/ratifiche/` — listato completo (41 file all'avvio, 42 a fine sessione)
- `docs/ratifiche/claude_2026-08-17_memo_ratifica_pannello_simulazione.md` — :41-99 (Contratto,
  Razionale, Alternative scartate, Prossimo passo)
- `docs/claude-code-log.md` — :3-24 (entry della sessione parallela)
- `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` — §7 (:116-145), §11 (:182-193), §12

Q1 — sede dei ruoli:
- `frontend/src/view/viewPoint/viewpoint.ts` — intero (61 righe)
- `frontend/src/view/viewElement/view.tsx` — :210-245 (blocco dei campi additivi)
- `frontend/src/redux/VersionFixer.tsx` — :34-36, :82-97 (`highestVersion`), :721-1067 (elenco
  migrazioni), :1004-1048 (`2.225 -> 2.226`)
- `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx` — :25-40
- `frontend/src/components/project/ProjectEditor.tsx` — :1205-1215

Q2 — semantica dei ruoli:
- `frontend/src/components/forEndUser/Control.tsx` — :225-373 (`PanelComponent`), :379-426
  (`MetaElementPicker`)
- `frontend/src/model/logicWrapper/LModelElement.tsx` — :688-694, :6140-6143 (`get_model`)

Q3 — Dock:
- `frontend/src/components/abstract/Dock.tsx` — :255-340 (gruppi, dichiarazione dei tab, costruzione
  del layout), :340-380 (`handleLayoutChange`)

Q4 — accesso al modello:
- `frontend/src/redux/selectors/selectors.ts` — :64-88
- `frontend/src/utils/lastViewpoint.ts` — :40-60, :128-150
- `frontend/src/model/logicWrapper/LModelElement.tsx` — :4952 (dichiarazione), :5613-5645
  (`get_allSubObjects` / `_getallSub`)

Q5 — decorazione a canvas:
- `frontend/src/components/editor-v2/viewpoint/ir/irCollapseState.ts` — intero (62 righe)
- `frontend/src/components/editor-v2/contexts/HighlightContext.tsx` — intero (~50 righe)
- `frontend/src/components/editor-v2/problems/registry.ts` — :1-25 (convenzione dichiarata)
- `frontend/src/components/editor-v2/problems/useNodeProblems.ts` — :1-32
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` — :30-35, :40-80, :188, :390-400, :445-455
- `frontend/src/components/editor-v2/types.ts` — :196-214 (`ObjectNodeData`)

Q6 — label edge cross-reference:
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` — :55-109 (`compilePath`),
  :346-366 (`compileTextSource`), :370-416 (`compileEdgeView`)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` — :51-54 (`TextSource`), :300-322
  (`CompiledCrossPath`, `CompiledEdgeView`)
- `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` — :1-80 (`applyEdgeStyle`),
  :115-152 (`decorateReferenceEdges`, `ObjectAsEdgeResult`)
- `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` — :140-180
- `frontend/src/components/editor-v2/viewpoint/ir/irCrossDeps.ts` — elenco API esportate

---

## Q1 — Sede dei ruoli nel viewpoint

### Struttura di `DViewPoint`

`frontend/src/view/viewPoint/viewpoint.ts` è un file di 61 righe. `DViewPoint` **estende
`DViewElement`** e dichiara di proprio soltanto `id` (:28) e `name` (:29); il costruttore
d'istanza è `newVP` (:38-45). Tutti i campi reali stanno quindi su `DViewElement`
(`frontend/src/view/viewElement/view.tsx`). Un campo dei ruoli va aggiunto lì, oppure — se si
vuole limitarlo al solo viewpoint — dichiarato su `DViewPoint` con lo stesso idioma opzionale.

### Un campo additivo opzionale NON richiede VersionFixer

Lo dice il codice, nel commento del precedente più vicino:

```
view.tsx:229-231
    // ViewpointIR (EditorV2 interpreter contract, spike 2026-07-17). Optional and additive:
    // undefined for classic views; serialization is generic, no VersionFixer needed (spec IR sez. 8).
    ir?: GObject;
```

La ragione è quella misurata nella discovery precedente: la persistenza è una
`JSON.stringify` generica dell'intero `idlookup` (`common/U.tsx:427-441`), non uno schema
enumerato. Un campo nuovo viene serializzato appena esiste; un progetto salvato prima del campo si
ricarica con il campo **`undefined`**, e basta che le letture siano difensive.

**Tre precedenti vivi sulla stessa classe**, tutti opzionali e additivi, nessuno con una migrazione
di introduzione del campo:

| Campo | Riga | Introdotto |
|-------|------|-----------|
| `viewpointType?: ViewpointType` | `view.tsx:220` — commento: *«explicit viewpoint type (additive — legacy booleans still work)»* | con fallback ai booleani legacy |
| `ir?: GObject` | `view.tsx:231` | spike 2026-07-17 |
| `irStash?: GObject` | `view.tsx:236` | slice B, 2026-08-16 (commit `ca73c564a`) — il più recente |

`viewpointType` è il precedente più istruttivo perché è **esattamente la forma proposta**: un campo
di configurazione sul viewpoint, scritto attraverso il proxy L con cast
(`ViewpointProperties.tsx:35`, `(viewpoint as any).viewpointType = newType`; idem
`ProjectEditor.tsx:1210`) e letto con una funzione difensiva che degrada sui valori storici:

```typescript
viewpoint.ts:16-21
export function getViewpointType(vp: DViewElement): ViewpointType {
    if ((vp as any).viewpointType) return (vp as any).viewpointType;
    if (vp.isValidation) return 'validation';
    if (vp.isExclusiveView) return 'syntax';
    return 'decoration';
}
```

Verifica che non abbia avuto migrazione: `grep -n "viewpointType" frontend/src/redux/VersionFixer.tsx`
→ **exit 1**. Controllo positivo sullo stesso file e comando: `grep -c "jsxString"` → **29**.

### A che cosa serve invece un bump di VersionFixer

Non ad aggiungere un campo, ma a **riscrivere contenuto già persistito**. È la lettura di spec §11
(migrazione e marcatura) e delle migrazioni reali: `2.225 -> 2.226` (`VersionFixer.tsx:1009-1066`)
non introduce `ir`, lo **classifica** — scorre i `DViewElement` salvati e scrive `e.ir` o
`e.irLegacyClassic` secondo i marker. Le altre della stessa famiglia riscrivono `jsxString`
(CLAUDE.md §3.9). L'ultima migrazione presente è `2.226 -> 2.227` (`VersionFixer.tsx:1067`);
`highestVersion` è derivato dai nomi dei metodi (`:34`, `:82-97`), quindi non c'è costante da
alzare a mano.

**Conclusione per la slice 1**: il campo ruoli è additivo e opzionale → nessuna migrazione dovuta.
Servirebbe una migrazione solo se in futuro si volesse *popolare* i ruoli sui viewpoint esistenti,
o rinominare/ristrutturare il campo dopo che ha dei dati sul campo.

**Rischio da non sottovalutare** (R3 della discovery precedente): se il campo è un oggetto annidato,
le scritture parziali via proxy vanno fatte assegnando l'intero oggetto, non mutando un sotto-campo
in place — la mutazione annidata bypassa azione, delta, undo e re-render.

---

## Q2 — Semantica esatta dei ruoli nel prototipo

### Dove vivono i ruoli, oggi

Nel prototipo i ruoli **non** stanno nel viewpoint: stanno nel bag `_state` del **modello M2**.

- **Scrittura** (`Control.tsx:419-420`, dentro `MetaElementPicker`):
  ```typescript
  getter={()=>props.data.state[props.name]}
  setter={(value) => props.data.state={[props.name]: value}}
  ```
  Il valore scritto è l'`<option value>`, cioè un **id** (`:395`, `:399`, `:405`, `:411`:
  `<option value={c.id}>`). Quindi il ruolo è memorizzato come **pointer**, non come proxy —
  coerente con R-SIM-2 e con l'avvertenza del bag (*«do not set proxies in the state, set pointers
  instead»*, `joiner/classes.ts:2186`).
- **Lettura** (`Control.tsx:244-248`): `props.data.instanceof.state['<ruolo>']?.name`. Il getter del
  bag ri-risolve la stringa in proxy L (`attemptWrap`, `classes.ts:281-296`), da cui `.name`.
  `props.data.instanceof` su un modello M1 è il suo metamodello: **i ruoli si leggono dalla M2**.

### I sei ruoli, e che cosa puntano

| Ruolo | Picker | Insieme delle opzioni | Punta a |
|-------|--------|----------------------|---------|
| `node` | `:351` `meta='class'` | `model.classes.filter(c => !c.abstract)` (`:395`) | DClass concreta |
| `initial` | `:352` `meta='class'` | idem | DClass concreta |
| `terminal` | `:353` `meta='class'` | idem | DClass concreta |
| `transition` | `:356` `meta='class'` | idem | DClass concreta |
| `ownedTransitions` | `:357` `meta='containment'` | `model.references.filter(r => r.composition)` (`:405`) | DReference di composizione |
| `nextState` | `:358` `meta='reference'` | `model.references.filter(r => !r.composition && !r.aggregation)` (`:399`) | DReference non-contenitiva |

**Il ruolo `transition` è scritto e mai letto.** `grep -n "transition" Control.tsx` dà tre righe:
`:355` (testo del paragrafo), `:356` (il picker), `:501` (una CSS `transition: width 0.3s`, altro
significato). Il motore naviga solo `ownedTransitions` e `nextState`; la metaclasse della
transizione non gli serve perché ci arriva per navigazione. Da non riportare nella riscrittura
senza una funzione reale.

L'oggetto `meta` (`:243-249`) proietta cinque ruoli su **nomi**, non su id, e tutto il motore
confronta per nome (`o.instanceof.name === node`). Scelta fragile: due metaclassi omonime in
package diversi si confondono. Nella riscrittura conviene confrontare per **id**.

### Il motore, riga per riga

`resetSimulation()` (`:259-273`)
1. `data.model.allSubObjects` filtrato su metaclasse ∈ {`node`, `initial`, `terminal`} →
   `o.state = {active: false}` (`:261-265`);
2. gli oggetti di metaclasse `initial` → `o.state = {active: true}` (`:268-270`);
3. toast informativo (`:272`).

`stop()` (`:275-283`) — solo il passo 1 di reset: tutto a `false`, nessuna riattivazione.

`step()` (`:285-299`)
```typescript
if (allSubObjects.filter(o => o.instanceof.name === terminal && o.state.active).length === 0) {
    allSubObjects.filter(o => o.state.active).forEach(o => {
        o['$' + ownedTransition] && o['$' + ownedTransition].values.forEach(t => {
            if (t['$' + nextState] && t['$' + nextState].value) {
                t['$' + nextState].value.state = {active: true};
            }
            o.state = {active: false};
        })
    })
} else { U.alert('i', 'Execution terminated.'); }
```
- **Guardia di terminazione**: si ferma quando *qualunque* oggetto di metaclasse `terminal` è
  attivo.
- **Navigazione**: dall'oggetto attivo, slot di composizione `ownedTransitions` → per ogni
  transizione, slot `nextState` → `.value` è l'oggetto bersaglio, che viene attivato.
- **`$` accessor**: `o['$' + nomeFeature]` è l'accesso allo slot `LValue` (stesso idioma di
  CLAUDE.md §9.1); `.values` per il multivalore, `.value` per il singolo.

**Semantica implicita, da decidere esplicitamente nella riscrittura**:
- **nessun evento**: uno `step` fa scattare *tutte* le transizioni uscenti di *tutti* gli attivi.
  È una semantica a broadcast, tipo rete di Petri senza conflitto, non «l'utente triggera E».
  I ruoli `event` e `trigger` del memo sono aggiunta genuina, non recupero;
- **multi-attivo per costruzione**: nessun vincolo di stato singolo;
- **`o.state = {active:false}` sta dentro il `forEach` sulle transizioni** (`:293`): viene eseguito
  una volta per transizione, e **mai** se l'oggetto ha zero transizioni uscenti — un attivo senza
  uscite resta attivo per sempre;
- **dipendenza dall'ordine**: lo snapshot degli attivi è preso da `filter` prima delle scritture,
  quindi un bersaglio attivato in questo step non ri-scatta; ma un oggetto già attivo che è anche
  bersaglio di un altro può essere disattivato *dopo* essere stato riattivato, secondo l'ordine di
  iterazione. È il caso di nondeterminismo che la Fase 2 deve chiudere con una scelta esplicita;
- **costo**: `allSubObjects` è un getter che **scandisce tutti i `DObject` del progetto**
  (`LModelElement.tsx:5615` → `_getallSub` :5618-5645, che passa da `Selectors.getAll(DObject, …)`
  e filtra per `l.model.id`). `step()` lo invoca **due volte** (`:287`, `:288`). Nella riscrittura
  va calcolato una volta e passato al motore puro.

### Visibilità del pannello

`:304-305`: sul modello M1 il pannello compare solo se **tutti e cinque** i ruoli di `meta`
risolvono (`!Object.values(meta).some(v => !v)`); su M2 (`:336`) compare sempre il pannello di
configurazione «Control Flow Aspect». È la «abilitazione derivata» di R-SIM-3, già in forma.

---

## Q3 — Dock: il tab registrato a `Dock.tsx:280` non è montato

Questo finding **corregge** la discovery precedente
(`discovery_2026-08-17_state_attributes_data_node.md`), che dava `MetaData` per vivo «tab
Metadata, `Dock.tsx:280`». È falso: avevo dedotto il montaggio dalla presenza della `const` senza
verificare che raggiungesse il layout.

### Come si dichiara un tab

`Dock.tsx:275-291`. Forma: un oggetto letterale
`{id, title: <TabHeader tid={tid()}>…</TabHeader>, group, closable, content: <TabContent tid={tid()}>…</TabContent>}`.
`id()` e `tid()` sono contatori che vanno avanzati in coppia (`:274`). I gruppi sono definiti a
`:267-272`: `models` e `editors` (quest'ultimo con `tabLocked: true`).

### Ma il gruppo `editors` è orfano

Il layout viene costruito a `:325-327`, e ha **un solo `children.push`**:

```
Dock.tsx:327   layout.dockbox.children.push({tabs: [ModelsSummary], size: leftSize});
```

Il commento immediatamente sotto (`:329-337`) lo dichiara:

> F2 floating panels (2026-07-29): the right dock child (editors group — Properties, Node, Console,
> MTM, Logger) is no longer built. Properties + Tree now render as a floating overlay over the
> full-width canvas (Dashboard mount, portal to `<body>`). … `groups.editors` and the editors tab
> consts above are still left in place (**orphaned**).

Misura: `metadata`, `node`, `collaborative`, `logger`, `permissions`, `mtm` compaiono **una volta
sola** ciascuno in `Dock.tsx` (la propria dichiarazione). `console` ne ha 12, ma sono `console.log`
/ `console.error` — la `const` ombreggia il globale JS, non è un uso.
`<MetaData` in tutto `frontend/src`: 2 occorrenze, `Dock.tsx:280` (dichiarazione orfana) e
`MetaData.tsx:53` (il proprio export). Controllo positivo con la stessa forma di ricerca:
`<ModelsSummaryTab` → 3 occorrenze, di cui `Dock.tsx:275` e `:302` sono montaggi reali.

**Conseguenza per la slice 1**: aggiungere una `const` accanto a `metadata` non montrebbe nulla.
Il pannello di simulazione va montato con il pattern vivo — pannello flottante in `Dashboard` —
oppure il gruppo `editors` va rianimato, che è una decisione di layout fuori dal perimetro della
slice. Da sciogliere in chat prima della Fase 2.

Titoli dei tab esistenti (per la collisione di `Simulation`): il nome del progetto, `Metadata`,
`Node`, `Collaborative`, `Console`, `Logger`, `Permissions`, `Languages`. Nessun `Simulation`.

---

## Q4 — Accesso a modello e viewpoint correnti

### Modello

Due selettori, entrambi ancorati a `state._lastSelected.modelElement`:

- `Selectors.getActiveModel()` (`selectors.ts:64-73`) → `LModel | null`, risolve l'elemento
  selezionato e ne prende `.model`.
- `Selectors.getLastSelectedModel<RET>(state?)` (`selectors.ts:75-88`) → `{element, model, m1, m2}`.
  **È quello giusto per il pannello**: quando il modello selezionato non è un metamodello popola
  `m1 = model` e `m2 = m1.instanceof`, cioè esattamente la coppia che serve per leggere i ruoli
  dalla M2 e iterare le istanze sulla M1.

`.model` risale la catena dei padri fino al `DModel` (`LModelElement.tsx:688-690`, e la variante
`:6140-6143`).

### Viewpoint

`LProject.getProject()?.activeViewpoint` (uso reale a `utils/lastViewpoint.ts:136`). La scrittura
canonica è un `SetFieldAction` diretto sul progetto (`lastViewpoint.ts:53-55`). Il modulo documenta
(`:40-45`) che `project.activeViewpoint` è il canale usato dal renderer, affiancato da
`lastEditedViewpointId` per l'authoring — con una catena di fallback a tre gradini
(`:128-152`): id memorizzato → viewpoint attivo del progetto → viewpoint di default.

### Enumerare le istanze di una metaclasse

Non esiste un'API «istanze di X». Esiste `allSubObjects`, e si filtra:

```
LModelElement.tsx:4952    allSubObjects!: LObject[];
LModelElement.tsx:5615    protected get_allSubObjects(c, s?, includeCross?) { return this._getallSub(c, s, DObject, includeCross); }
LModelElement.tsx:5618    protected _getallSub(context, state, kind, includeCross?) { … }
```

`_getallSub` chiama `Selectors.getAll(kind, undefined, state, true, false)` e poi tiene gli elementi
il cui `l.model.id` è il modello del contesto (`:5634-5638`). Costo: **lineare su tutti i `DObject`
del progetto, a ogni accesso** — è un getter, non un campo. Varianti: `allCrossSubObjects`
(`:5613`) include i modelli dipendenti; `allSubValues` (`:5611`) fa lo stesso per i `DValue`.

Il risultato passa da `U.toNamedArray` (`:5643`), quindi è un array con anche accesso per nome.

Altri consumatori reali, come riferimento di stile: `nameUniqueness.ts:59,100`
(`(model.allSubObjects ?? []) as LObject[]`), `jjscript/executor/commands/eval.ts:109`
(`(m as any).allSubObjects || (m as any).objects || []`).

---

## Q5 — Aggancio della decorazione a canvas

Ci sono **due precedenti**, e insieme coprono l'intera forma richiesta da R-SIM-1 e R-SIM-3.

### Precedente A — lo store: `irCollapseState.ts`

Modulo di 62 righe: `Set` + contatore di versione + `Set` di listener (`:11-13`), `bump()` che
notifica (`:15-18`), e l'hook di sottoscrizione:

```typescript
irCollapseState.ts:54-62
function subscribe(fn: () => void): () => void { listeners.add(fn); return () => listeners.delete(fn); }
export function useCollapseVersion(): number {
    return useSyncExternalStore(subscribe, getCollapseVersion, getCollapseVersion);
}
```

L'intestazione dichiara la motivazione, che è testualmente R-SIM-1: *«Module singleton (per session,
not persisted) … Kept outside Redux by design: collapse is a per-user ephemeral view state, like
zoom»* (`:5-7`).

**Il punto esatto di sottoscrizione nel chrome del nodo** è una chiamata nuda all'inizio del corpo
del componente:

```
ObjectNode.tsx:65-67
    // Containment collapse state (Fase 2b) — cheap, unconditional (rules of hooks)
    useCollapseVersion();
```

Stesso idioma in `IRContainmentHulls.tsx:31` (`useCollapseVersion(); // re-render on toggle`) e
dentro il memo di containment (`useIRContainment.ts:71`).

### Precedente B — l'iniezione della classe: `HighlightContext.tsx`

È il precedente più vicino al bisogno «classe condizionale sul nodo senza toccare l'interprete», e
lo dichiara esplicitamente nella sua intestazione:

> Render-time injection (Opzione B della discovery): node.data / edge.data and the JjOM → RF
> transform are NOT touched — the consumer hooks return the CSS class.
> The map persists in localStorage keyed per model … it does NOT travel with the project file.

L'hook consumatore è tre righe:

```typescript
HighlightContext.tsx:36-40
export function useNodeHighlightClass(id: string): string {
    const hl = useContext(HighlightContext);
    if (!hl.active) return '';
    return hl.colorById[id] ? `hl-c${hl.colorById[id]}` : 'hl-dimmed';
}
```

con il gemello `useEdgeHighlightClass` (`:47-51`).

### Precedente C — quello citato da R-SIM-3: il problems overlay

È il più vicino al bisogno, e il migliore dei tre. Il registro
(`frontend/src/components/editor-v2/problems/registry.ts`) dichiara nella sua intestazione
(`:8-10`) la stessa scelta di R-SIM-1:

> Mirrors the OrphanStore pattern (module-level Map + subscribers), matching the codebase
> convention for **session-local UI-only** diagnostic state that is **immune to undo/redo and not
> persisted**.

L'hook consumatore sottoscrive **per nodo**, non con un contatore globale:

```typescript
problems/useNodeProblems.ts:26-32
export function useIsHighlighted(nodeId: string): boolean {
    return useSyncExternalStore(
        subscribe,
        () => getIsHighlighted(nodeId),
        () => getIsHighlighted(nodeId),
    );
}
```

Consumo in `ObjectNode.tsx:188` (`const isProblemHighlighted = useIsHighlighted(id);`), import a
`:32`, applicazione della classe in entrambi i rami (`:394`, `:449`).

Differenza operativa rispetto a `useCollapseVersion`: lo snapshot è una funzione **dell'id**, quindi
React ri-renderizza solo i nodi il cui valore è cambiato. `useCollapseVersion` restituisce un
contatore globale e ri-renderizza **tutti** i sottoscrittori a ogni toggle. Per una simulazione che
cambia pochi flag per step, il pattern problems costa meno e non richiede nulla in più.
Un quarto precedente della stessa famiglia, `OrphanStore`, è citato dal registry ed è la radice
della convenzione.

### Il punto di applicazione

`ObjectNode` è il componente dei nodi M1 — cioè le istanze che la simulazione deve decorare. La
classe si compone in una template string che **già porta più classi condizionali**:

```
ObjectNode.tsx:394 (ramo IR)
  className={`mm-node mm-object ${selected ? 'selected' : ''}${isProblemHighlighted ? ' mm-object--problem-highlighted' : ''} ${hlClass} ir-view-${irResolution.compiled.viewId}${canResize ? ' ir-resizable' : ''}${hasExplicitSize ? ' ir-sized' : ''}`}

ObjectNode.tsx:449 (ramo nativo/fallback)
  className={`mm-node mm-object ${selected ? 'selected' : ''} ${isOrphan ? 'mm-object--orphan' : ''}${isProblemHighlighted ? ' mm-object--problem-highlighted' : ''} ${hlClass}`}
```

`hlClass` viene da `useNodeHighlightClass(id)` a `ObjectNode.tsx:46`. Un `simClass` si affianca
identico: **due punti di applicazione** (entrambi i rami), un hook, zero righe nell'interprete.

**Attenzione alla chiave.** `useNodeHighlightClass` prende l'**id del nodo React Flow** (il vertice),
mentre la simulazione lavora su **DObject**. Nel ramo IR il DObject è disponibile come
`irResolution.objectId`; `ObjectNodeData` (`types.ts:196-203`) porta `instanceOfClassId` (la
metaclasse) e `label`, **non** l'id dell'oggetto. Quindi o l'hook prende `objectId` come parametro
(e il ramo nativo deve procurarselo), o lo store di simulazione si indicizza per id di vertice.
Punto da decidere in Fase 2; il ramo nativo va verificato prima di scegliere.

---

## Q6 — Edge label attraverso un reference: **sì, con reattività, per le object-as-edge**

Verifica dovuta n. 1 del memo. Risposta positiva, con un confine preciso.

### La label edge è un `TextSource`, e un `TextSource` può essere un PathExpr

```typescript
irTypes.ts:51-54
export type TextSource =
    | { from: 'path'; expr: PathExpr }
    | { from: 'literal'; text: string }
    | { from: 'intrinsic'; prop: 'name' | 'metaclassName' | 'qualifiedName' };
```

`compileEdgeView` compila la label center con lo stesso compilatore delle label dei nodi:

```
irCompile.ts:407   labelText: compileTextSource(e.labels?.center, deps),
irCompile.ts:346-351   if (src.from === 'path') { const { fn, featureNames } = compilePath(src.expr); … return fn; }
```

### `compilePath` naviga il multi-hop

```typescript
irCompile.ts:74-97
const fn: CompiledAccessor = (ctx, elementId) => {
    let currentId = elementId;
    for (let i = 0; i < steps.length; i++) {
        const isLast = i === steps.length - 1;
        if (!isLast) {
            const nextId = ctx.getRef(currentId, step.feature, step.take);   // hop di navigazione
            if (nextId == null) return undefined;
            currentId = nextId; continue;
        }
        // step terminale: getValue / getValues / getValues[N]
    }
};
```

Quindi `transition.trigger.name` si scrive, nella sintassi PathExpr,
**`$trigger.value.$name.value`** valutata sull'oggetto Transition, e risolve.

### E la reattività c'è, per le object-as-edge

`compilePath` registra il percorso cross-oggetto (`irCompile.ts:103-107`), `compileEdgeView` lo
raccoglie in `compiled.crossPaths` (`:412`), `synthesizeObjectAsEdges` lo espone per ogni oggetto-edge:

```typescript
irEdgeViews.ts:147-150
    /** Per edge-object, the resolved view id + its cross-object paths (spec v1.2
     *  sez. 9): the containment memo publishes these so edge labels re-render when
     *  a navigated endpoint's feature changes. */
    edgeObjectDeps: { objectId: string; viewId: string; crossPaths: CompiledCrossPath[] }[];
```

e il memo di containment li concretizza e pubblica:

```typescript
useIRContainment.ts:168-177
    for (const dep of oae.edgeObjectDeps) {
        const cross = resolveCrossDeps(state.idlookup, dep.objectId, dep.crossPaths);
        publishCrossDeps(dep.objectId, cross.fids);
        edgeKeys.push(dep.objectId);
        …
    }
    publishEdgeObjectKeys(edgeKeys);
```

**Il confine.** Questa pubblicazione avviene **solo** per le view *object-as-edge*.
`decorateReferenceEdges` (`irEdgeViews.ts:115-140`), che decora gli edge reference-as-edge, applica
`applyEdgeStyle` — quindi la label multi-hop **si risolve** — ma non raccoglie né pubblica
`crossPaths`: quelle label si aggiornano solo quando il memo ricalcola per altro motivo.

Per il caso d'uso in questione il confine non morde: Transition è il pattern object-as-edge
canonico, citato per nome nell'intestazione del modulo (`irEdgeViews.ts:12`, *«Object-as-edge
synthesis (Transition pattern)»*).

**Conseguenza**: il ruolo **decorativo** dell'evento — la label dell'edge che mostra il nome
dell'evento di trigger — è **già nel perimetro IR di oggi** e non richiede il fronte J. Resta al
fronte J solo il ruolo **attivo**: leggere lo stato di simulazione da un'espressione (il namespace
`state`), che è tutt'altra cosa.

**Incoerenza documentale trovata per strada** (non toccata): il docstring di `compilePath`
(`irCompile.ts:66-70`) dichiara ancora *«KNOWN LIMIT (v1.1, to be fixed in spec v1.2 dependency-set
work): only single-hop self paths are fully reactive»*. Quel lavoro è stato fatto, e sta nel corpo
della stessa funzione venti righe sotto (`:103-107`). Il commento è stantìo.

---

## Q7 — Collisioni di nomi

Grep su `frontend/src` (`*.ts`, `*.tsx`, `*.scss`), conteggio con `wc -l`:

| Nome proposto | Occorrenze |
|---------------|-----------|
| `simulationState` | **0** |
| `SimulationPanel` | **0** |
| `useSimulationState` | **0** |
| `sim-active` | **0** |

Estesa ai nomi effettivamente ratificati (memo §Contratto e §Prossimo passo), stessa misura:

| Nome ratificato | Occorrenze |
|-----------------|-----------|
| `simRunState` | **0** |
| `simNode` | **0** |
| `simInitial` | **0** |
| `simTerminal` | **0** |
| `simTransition` | **0** |
| `simOwnedTransitions` | **0** |
| `simNextState` | **0** |

Controllo positivo con la stessa forma di ricerca: `irCollapseState` → **7** occorrenze.

Titolo del tab `Simulation`: assente dai titoli esistenti del Dock (elenco a Q3).

Nessuna collisione, su nessuna delle due liste. Nota di collocazione: il prompt proponeva
`simulationState.ts` «accanto a `irCollapseState.ts`», cioè dentro `viewpoint/ir/` — il che
suggerirebbe appartenenza all'IR mentre R-SIM-3 dichiara la slice **fuori** dall'IR. Il nome
ratificato `simRunState.ts` non ha quel problema, ma la cartella resta da scegliere.

---

## Dipendenze e rischi

- **D1 — Il montaggio del pannello non è deciso** (Q3). Il Dock non monta più il gruppo `editors`;
  il pattern vivo è il pannello flottante montato in `Dashboard`. Questo cambia i file della Fase 2
  rispetto a quanto il prompt anticipa.
- **D2 — La chiave della decorazione** (Q5): vertice o DObject. Il ramo nativo di `ObjectNode` non
  ha l'id dell'oggetto in `data`; va verificato come lo ottiene prima di fissare l'API dello store.
- **D3 — `allSubObjects` è O(oggetti del progetto) per accesso** (Q4). Il motore puro deve
  riceverlo come parametro, calcolato una volta per step. Il prototipo lo chiama due volte per
  step (`Control.tsx:287-288`).
- **D4 — Il confronto per nome è fragile** (Q2). I ruoli sono pointer; il prototipo li degrada a
  nomi e confronta per nome. La riscrittura confronti per id.
- **D5 — Nondeterminismo e ordine** (Q2): lo `step` del prototipo ha un esito dipendente
  dall'ordine di iterazione, e lascia attivi per sempre gli oggetti senza transizioni uscenti.
  Sono due decisioni semantiche, non due bug da riprodurre.
- **D6 — Scritture annidate sul campo ruoli** (Q1): se il campo è un oggetto, va riassegnato
  intero. La mutazione in place bypassa azione, undo, re-render e sync (R3 della discovery
  precedente).
- **R1 — La correzione di Q3 tocca la base di evidenza della serie R-SIM.** La discovery
  `discovery_2026-08-17_state_attributes_data_node.md` afferma che `MetaData` è vivo («tab
  Metadata, `Dock.tsx:280`»); §Q3 misura che quel tab non è montato dal 2026-07-29. Quel report è
  citato come base di evidenza da `decisions.md:669` **e** dal memo, che poggia su `MetaData.tsx`
  la motivazione di R-SIM-2/R-SIM-3 («dimostra in produzione la forma pannello connect-ato che
  legge e scrive il bag con reattività»).
  **La conclusione del memo regge lo stesso**, ma per una ragione diversa da quella scritta:
  `MetaDataConnected` è un `connect` ordinario e la forma è corretta *come codice*; quello che non
  è vero è che sia *in produzione* oggi. La correzione va propagata, altrimenti la Fase 2 cerca un
  precedente vivo dove c'è codice orfano.
- **R2 — Chiave dello store: `elementId` o id di nodo RF.** R-SIM-1 dice «Set di **elementId**»;
  l'hook del pattern citato da R-SIM-3 sottoscrive per **nodeId** (`useIsHighlighted(id)`,
  `ObjectNode.tsx:188`). Le due chiavi non coincidono e la mappa fra loro, nel ramo nativo di
  `ObjectNode`, non è in `ObjectNodeData` (§Q5). Da chiudere prima di fissare l'API del singleton.

---

## Domande aperte per Alfonso

Riordinate dopo la ratifica: le due sulla sede del campo (viewpoint sì/no, forma del campo) sono
chiuse da R-SIM-2 e non compaiono più.

1. **Dove si monta il pannello, concretamente?** R-SIM-3 dice «montato in editor-v2, mai nello
   scope dei template», e Q3 conferma per esclusione che il Dock non è la sede: il gruppo `editors`
   non è più costruito dal 2026-07-29. Resta da scegliere il sito reale — pannello flottante
   montato in `Dashboard` come Properties/Tree (pattern vivo), o dentro l'albero di `EditorV2`.
   Determina i file della Fase 2.
2. **Chiave del singleton: `elementId` o id di nodo RF?** (R2 sopra). R-SIM-1 dice elementId, il
   pattern citato da R-SIM-3 sottoscrive per nodeId. Serve decidere chi fa la traduzione e dove.
3. **Contatore globale o snapshot per nodo?** Il memo accetta esplicitamente il contatore globale
   per la v1; il pattern che R-SIM-3 cita come modello (`useIsHighlighted`) usa lo snapshot per
   nodo e non ha quel costo. Costa uguale scriverlo bene subito: si conferma il contatore o si
   prende il pattern citato per intero?
4. **`simTransition` si mantiene?** È nel contratto ratificato (R-SIM-2) ma nel prototipo il ruolo
   omonimo è configurabile e non letto da nessuno (Q2). Gli si dà una funzione, o esce dalla lista?
5. **Semantica dello step, con gli eventi.** Il memo delega alla spec del pannello due punti
   (deadlock e criterio di terminazione) e fa bene; ne aggiungo un terzo che il prototipo nasconde:
   **l'ordine**. Lo `step()` attuale disattiva l'oggetto sorgente dentro il ciclo sulle transizioni
   (`Control.tsx:293`), quindi un oggetto che è insieme sorgente e bersaglio ha esito dipendente
   dall'ordine di iterazione. Con `event`/`trigger` la domanda diventa: uno step fa scattare solo
   le transizioni il cui trigger è l'evento premuto, e in caso di più transizioni abilitate sullo
   stesso stato — prima transizione con flag di ambiguità, o scelta esplicita dell'utente?
6. **La label dell'evento sull'edge entra nella slice 1?** Q6 risponde che è già possibile oggi,
   dentro l'IR, senza fronte J, per le view object-as-edge (il pattern Transition). Se entra, il
   perimetro cresce di una view IR autorata, non di codice.
7. **Correzione della discovery state-attributes** (R1): la annoto in coda a quel file — che nel
   frattempo ha già gli addendum A1..A4 della sessione parallela — oppure resta solo qui e nel log?
   È la base di evidenza citata da `decisions.md:669`, quindi propenderei per annotarla lì.
