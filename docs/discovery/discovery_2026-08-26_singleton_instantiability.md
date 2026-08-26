# Discovery — il singleton come valore del linguaggio: instanziabilità e ciclo di vita (commit A, Fase 1)

**Data**: 2026-08-26
**Branch**: `alfonso-frontend-jjtl`. **Stato del repo durante la lettura**: HEAD era `6b66ffe3a`
all'inizio della sessione (il prompt cita `472afeefe`; i riferimenti a riga del prompt erano letti su
`778fbe0df`). **Durante la sessione un'altra corsa ha committato `3222b210a` e lasciato modifiche non
committate** in `editor-v2/` (`EditorV2.tsx`, `EditorV2.scss`, `ContextMenu.tsx`, `_themes.scss`,
`components/EdgeTypePopup.*`). Ogni riga citata qui sotto è stata letta **sul working tree**, quindi su
quello stato. Verificato che l'interferenza è nulla per questo report: l'unico hunk su `EditorV2.tsx`
è a `@@ -3002,7 +3002,10 @@` e l'unico su `EditorV2.scss` a `@@ -3706,69 +3706,151 @@` — entrambi
**sotto** ogni riga citata (massimo citato: `EditorV2.tsx:2989`, `EditorV2.scss:2177`). Nessuna
numerazione qui riportata si sposta. Dove il numero differisce da quello del prompt lo dichiaro nel
punto (elenco completo in §10).
**Fase**: 1 di un two-phase. Read-only: nessun file di prodotto toccato, nessun `git add`.
**Prompt**: `docs/prompts/claude_2026-08-26_1435_prompt_singleton_discovery_A.md`
**Ratifiche di riferimento**: R-SGL-1, R-SGL-2, R-SGL-3, R-SGL-5 (`docs/decisions.md`)

> **Natura delle misure.** Tutto quanto segue è **lettura statica del sorgente** più conteggi di
> ricerca con exit status verificato. Nessuno scenario è stato eseguito nel browser, nessuna sonda
> è stata scritta. Dove una conclusione dipenderebbe da un'esecuzione lo dichiaro esplicitamente e
> lo porto in §9 (domande aperte) invece di darlo per acquisito.

---

## 0. Obiettivo

Rispondere alle sei domande della sezione 3 del prompt con path e righe, così che la Fase 2 del
commit A (R-SGL-1, 2, 3) possa essere scritta come lista chiusa di edit.

**Risultato principale, anticipato.** L'ipotesi di lavoro della chat — *«basta aggiungere
`isSingleton` a `MetaclassInfo` e usarlo nei due filtri (`useEditorMode.ts:500`,
`compositionCompat.ts:163-170`)»* — **non è sufficiente**, per tre ragioni indipendenti:

1. i filtri che decidono «questa classe è instanziabile dall'utente» in editor-v2 sono **sei**, non
   due, e uno di essi (`irInteraction.ts:136`, la connect gesture object-as-edge) è un percorso di
   creazione a tutti gli effetti;
2. la firma di reattività di `useEditorMode` (`:173`) **non include `isSingleton`**: aggiungere il
   campo senza toccare la firma produce una palette che non si aggiorna quando il flag cambia;
3. esistono due vie di instanziazione **fuori da editor-v2 e fuori da `MetaclassInfo`** — il comando
   JjScript `create instance` (usato anche da Jjodie) e la materializzazione dell'output JjTL — che
   oggi creano un'istanza di classe singleton senza alcun rifiuto.

E, sul fronte R-SGL-2, un **secondo risultato che contraddice la ratifica**: l'ordine
«flag prima, cancellazione poi dentro la stessa `TRANSACTION`» **non libera il guard** di
`LModelElement.tsx:6428`. Le azioni di una `TRANSACTION` non toccano lo store finché non si chiude
(§3.1): il guard rilegge lo stato committato e vede `isSingleton` ancora `true`. Serve un
meccanismo diverso, e la Fase 2 non può limitarsi a scegliere l'ordine.

---

## 1. File letti (path completi)

Codice — perimetro dichiarato dal prompt:

- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/hooks/useEditorMode.ts` (intero)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/utils/compositionCompat.ts` (intero)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/EditorV2.tsx` (660-830, 1480-1580, 1840-1900, 2035-2330, 2410-2470, 2560-2630, 2780-2880, 2960-3160, 4150-4170)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (75-100, 395-515)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/_notations.scss` (1-95)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/EditorV2.scss` (1660-1720, 1985-1998, 2170-2182)
- `/Users/alfonso/jjodel/frontend/src/model/logicWrapper/LModelElement.tsx` (159-215, 580-600, 2148-2160, 2640-2700, 2740-2935, 3180-3195, 5425-5445, 5528-5660, 6390-6470, 6827-7100, 7144-7165)
- `/Users/alfonso/jjodel/frontend/src/joiner/classes.ts` (256-275, 925-975, 1380-1430, 2394-2440, 4116-4175)
- `/Users/alfonso/jjodel/frontend/src/components/editors/Info.tsx` (175-205, 675-700)
- `/Users/alfonso/jjodel/frontend/src/services/JjodieContext.ts` (45-175)

Codice — allargamenti, tutti dichiarati:

- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/panels/PalettePanel.tsx` (60-175) — è la superficie che mostra `rootableClasses`; senza leggerla D1 sarebbe incompleta.
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` (intero) — contiene il **sesto** filtro e la connect rule; il prompt non lo cita.
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/sync/canvasToJjom.ts` (355-475, 1310-1420) — solo `syncDeleteVertex` / `syncCreateObject` / `createVertexForObject`, per D3, come consentito dal §4 del prompt.
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/hooks/useJjomSync.ts` (1180-1345) — solo il ramo di rimozione dei nodi RF, per D3.
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/utils/jjomTransformers.ts` (399-417)
- `/Users/alfonso/jjodel/frontend/src/common/Dummy.ts` (48-270) — la cascata di `get_delete`, richiesta da D3.
- `/Users/alfonso/jjodel/frontend/src/redux/action/action.ts` (1-360) — `BEGIN/END/FINAL_END/Action.fire`, necessario per rispondere sull'ordine dentro la `TRANSACTION`.
- `/Users/alfonso/jjodel/frontend/src/redux/reducer/reducer.ts` (1250-1345) — history e `undo`, per il vincolo «un solo passo di undo».
- `/Users/alfonso/jjodel/frontend/src/joiner/proxy.ts` (45-80) e `/Users/alfonso/jjodel/frontend/src/common/U.tsx` (177) — `livePatches` / `liveStateChanges`.
- `/Users/alfonso/jjodel/frontend/src/components/contextMenu/ContextMenu.tsx` (320-420) — il menu classic «Add child», una via di instanziazione.
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/commands/instance.ts` (215-300, 355-395) e `commands/set.ts` (1-230).
- `/Users/alfonso/jjodel/frontend/src/pages/components/Navbar.tsx` (635-670, 1480-1495) — il toggle View > Show singletons.
- `/Users/alfonso/jjodel/frontend/src/components/project/ProjectEditor.tsx` (1735-1760) — materializzazione output JjTL.
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts` (55-70) — per verificare la citazione «orphanStore per i DValue».
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` (930-970) — le uniche fixture `MetaclassInfo`-shaped.

Documentazione:

- `/Users/alfonso/jjodel/CLAUDE.md`
- `/Users/alfonso/jjodel/docs/decisions.md` (processo + serie R-SGL)
- `/Users/alfonso/jjodel/docs/claude-code-log.md` (ultime 7 entry)
- `/Users/alfonso/jjodel/docs/discovery/discovery_2026-08-07_singleton_stereotype.md` (§0-§1, per il contesto della notazione)

**Non letto per vincolo di prompt** (§4, fronte del commit B): `IRNodeContent.tsx`, e di
`canvasToJjom.ts` tutto ciò che sta fuori dalle funzioni citate sopra.

---

## 2. D1 — Vie di instanziazione

### 2.1 Il quadro

Un `DObject` nasce da due write path distinti, con protezioni **asimmetriche**:

| Write path | Chi lo usa | Guard D-layer sul singleton |
|---|---|---|
| `LValue/LModel.addObject(json, metaclass)` → `getInstantiableClasses` | classic (drop e context menu) | **sì** — `LModelElement.tsx:6858` ricalcola `instantiable = !(abstract \|\| interface \|\| isSingleton)` e con `loose=false` filtra (`:6896`). Errore utente a `:7010`. |
| `DObject.new(...)` diretta | **tutto editor-v2** (`syncCreateObject`, `canvasToJjom.ts:1394`), JjScript, JjTL, import XMI | **no** — nessun controllo. |

`addObject` ha una scappatoia esplicita: `forceCreation = true` salta il filtro
(`LModelElement.tsx:7003-7004`). È il canale con cui il sistema crea *lui* i singleton —
`set_singleton` (`:2887`) e `classes.ts:942` lo usano entrambi. Va preservato.

### 2.2 Siti che passano da `MetaclassInfo` (editor-v2)

Sei filtri distinti, tutti oggi ciechi al singleton. Il numero fra parentesi quadre è il predicato.

| # | Sito | Riga | Predicato oggi | Singleton passa? |
|---|---|---|---|---|
| 1 | `rootableClasses` (sorgente della palette M1) | `useEditorMode.ts:499-501` | `!c.isAbstract && !compositionTargetIds.has(c.id)` | **sì** |
| 2 | Palette IR, gruppo «extra» droppabile nei container | `EditorV2.tsx:1499-1501` | `!present.has(c.id) && !c.isAbstract && droppable.has(c.name)` | **sì** |
| 3 | Drop sul canvas (gate rootable) | `EditorV2.tsx:2130` | `mi.rootableClasses.some(...)` | **sì** (eredita 1) |
| 4 | Drop dentro un container IR + feedback `dragOver` | `compositionCompat.ts:48` (`getCompatibleContainmentRefs`), consumato da `EditorV2.tsx:2110` e `:2283` | `dropped && !dropped.isAbstract` | **sì** |
| 5 | Menu contestuale «Add \<Classe\> (\<ref\>)» sui figli di composizione | `compositionCompat.ts:164` e `:169` (`getCompositionChildOptions`), consumato da `EditorV2.tsx:2989` | `!targetClass.isAbstract` + `concreteSubclasses` | **sì** |
| 6 | **Connect gesture → creazione dell'edge-object** | `irInteraction.ts:136` (`matchConnectRules`), consumato da `EditorV2.tsx:1554-1559` → `handleObjectEdgeSelected` → `syncCreateObject` (`EditorV2.tsx:1882`) | `!edgeClass \|\| edgeClass.isAbstract` → skip | **sì** |

Il #6 è il sito che il prompt non elenca e che rompe l'ipotesi «due filtri»: trascinare un arco fra
due nodi conformi **crea un `DObject`** della metaclasse edge. Se quella metaclasse è singleton,
oggi l'istanza nasce.

Nota su `deriveDroppableChildMetaclasses` (`irInteraction.ts:170-171`): anche lì il filtro è
`!target.isAbstract`, e alimenta il #2. È **per nome**, non per id — ereditando il limite di
collisione fra omonimi già dichiarato nel modulo.

Nota su `concreteSubclasses`: **non va filtrato**. Serve a due scopi diversi — costruire opzioni di
creazione (#5) e decidere la *conformità* di un endpoint (`conformsToRefTarget`,
`irInteraction.ts:107-111`; `getCompatibleReferences`, `compositionCompat.ts:115`). Il secondo è
esattamente ciò su cui poggia R-SGL-4: una reference il cui tipo dichiarato è astratto con
sottotipi singleton deve continuare a considerarli conformi. Filtrare `concreteSubclasses`
alla sorgente ucciderebbe il commit B. Il filtro va messo **al consumo**, nei siti 1-6.

### 2.3 Siti che NON passano da `MetaclassInfo`

| # | Sito | Riga | Comportamento oggi |
|---|---|---|---|
| 7 | Drop classic dalla palette (`application/jjodel-classic`) | `EditorV2.tsx:2296-2312`, payload posato in `PalettePanel.tsx:89` | La palette è la stessa lista rootable (#1), quindi la voce c'è; la scrittura è `lModel.addObject({}, lClass)` senza `forceCreation` → **il D-layer rifiuta**, con `Log.ee` a `LModelElement.tsx:7010-7013`. Difetto attuale: la UI offre un'azione che fallisce. |
| 8 | Context menu classic «Add \<Classe\>», ramo a opzione singola | `ContextMenu.tsx:381` | Nessun check di `instantiable` (il ramo multi-opzione a `:391` invece lo fa). Stesso esito del #7: voce offerta, scrittura rifiutata. |
| 9 | **JjScript `create instance <Class>`** | `instance.ts:231-241` (check) e `:271-279` (scrittura) | Il check è **solo su `abstract`**. La scrittura è `DObject.new` diretta. → **l'istanza di un singleton viene creata.** Buco pieno. |
| 10 | **Jjodie (chat)** | instrada su JjScript (`Jodie.tsx` → `JjScriptService.execute` → `executor.ts` → `commands/instance.ts`; i moduli `JjodieCommandParser.ts` / `JjodieActionExecutor.ts` non hanno importer esterni a sé stessi — codice orfano, già registrato nel log del 2026-05) | eredita il #9 |
| 11 | Materializzazione dell'output JjTL | `ProjectEditor.tsx:1750` | `DObject.new` diretta, nessun check. La classe la sceglie la trasformazione, non l'utente: fuori dal perimetro letterale di R-SGL-1 («per nessuna via» riferito all'utente), ma va deciso. |
| 12 | Import XMI / JSON | `XMIService.ts:657`, `:681`, `:1018`; `api/data.ts:594` | `DObject.new` diretta. Verificato che né `EcoreService.ts` né `XMIService.ts` né `api/persistance/` nominano `singleton` (ricerca a vuoto con controllo positivo: `abstract` in `EcoreService.ts` = 3 occorrenze, `DObject` in `api/data.ts` = 13). Il flag è un'estensione Jjodel non serializzata in Ecore: un `.ecore` importato non può portare `isSingleton: true`. |
| 13 | Duplicate / paste sul canvas | `EditorV2.tsx:2415-2432` e `:2579-2617` | Creano nodi **solo React Flow** (id `objectNode_<timestamp>`), nessun `DObject`. Non instanziano; producono un doppione visivo che sparisce al reload. Difetto pre-esistente, fuori scopo. |

### 2.4 Risposta secca alla domanda del prompt

> «dire se basta aggiungere `isSingleton` (o `instantiable`) a `MetaclassInfo` e usarlo nei due
> filtri, o se ci sono siti che non passano da `MetaclassInfo`».

**Non basta.** Servono, come minimo:

- il campo su `MetaclassInfo` **più** la firma di reattività (§3);
- il predicato applicato in **sei** punti (§2.2), non due;
- una decisione sui siti 7-8 (oggi già rifiutati dal D-layer ma offerti dalla UI: risolvendo #1 e #5
  spariscono anche loro, perché leggono le stesse liste);
- una decisione sul **#9/#10**, che è l'unico buco che nessuna modifica a editor-v2 chiude: va
  aggiunto un check in `instance.ts`, gemello di quello su `abstract`, oppure la Fase 2 dichiara
  R-SGL-1 non coperta su JjScript. → §9, Q1.

---

## 3. D2 — `MetaclassInfo`

### 3.1 Chi costruisce letterali fuori da `resolveM1Info`

Ricerca su tutto `frontend/src` (`--include` onorato via `command grep`):

- **`compositionCompat.ts:148-155`** — l'unico letterale vero: lo stand-in cross-metamodel quando la
  classe target vive in un altro metamodello e manca da `allClasses`.
- **`ir.test.ts:937-941`** — due factory (`ref`, `cls`) che producono oggetti `as any`; non tipizzati
  come `MetaclassInfo`, quindi indifferenti alla forma dell'interfaccia.
- **`JjodieContext.ts:50-65`** — `interface MetaclassInfo` **locale al file, tipo diverso e non
  imparentato** con quello di `useEditorMode`. Non importa nulla da editor-v2. Il letterale a `:153`
  costruisce quel tipo lì. **Non va toccato** e non è impattato dalla modifica.
- `PathBuilder.tsx:10` — solo un commento che nomina il tipo.
- I tre pannelli di authoring (`VertexAuthoringPanel`, `RowAuthoringPanel`, `EdgeAuthoringPanel`) e
  `irCreationSeed.ts` **consumano** `getMetaclassInfo()`, non costruiscono letterali.

**Conferma richiesta dal prompt**: con il campo **opzionale** (regola 11, esattamente come
`allAttributes` a `useEditorMode.ts:47-51`) nessuno di questi siti cambia. `compositionCompat.ts:148`
continua a compilare; le fixture di test sono `as any`. ✔

### 3.2 Nome e semantica proposti

**`isSingleton?: boolean`**, letto da `cls.isSingleton` accanto a `isAbstract` in
`useEditorMode.ts:429-437`, con la stessa forma difensiva (`!!(cls as any).isSingleton`).

Motivi, in ordine:

1. `concreteSubclasses` resta invariato per costruzione (§2.2) e R-SGL-4 non viene toccata;
2. il filtro nei sei siti è esplicito e leggibile (`!c.isAbstract && !c.isSingleton`), mentre un
   `instantiable` calcolato nasconderebbe *quale* delle tre condizioni ha escluso la classe — e la
   UI del #2 («Not in this viewpoint») distingue già i motivi di esclusione;
3. `MetaclassInfo.isAbstract` è **già** un predicato composto (`abstract || interface`,
   `useEditorMode.ts:432`): aggiungerne un secondo composto renderebbe il tipo ambiguo su chi copre
   cosa.

Alternativa scartata: `instantiable?: boolean` letto da `cls.instantiable`. È vero che
`LClass.get_instantiable` (`LModelElement.tsx:2893`) dice già il vero — ma il consumo in editor-v2
richiederebbe comunque un secondo campo per distinguere «astratta» da «singleton» nella UI, e
`isAbstract` resterebbe lì accanto, ridondante e in disaccordo.

### 3.3 Il difetto che il campo da solo non risolve — la firma di reattività

`useEditorMode` memoizza su quattro dipendenze (`:296`):
`[modelId, explicitMode, metamodelRefFromStore, metamodelClassSignature]`.

`metamodelClassSignature` (`:154-176`) costruisce per ogni classe:

```ts
parts.push(`${id}:${cls.name}:${cls.abstract}:${refCount}:${refNames}:${attrNames}`);   // :173
```

**`isSingleton` non c'è.** Neanche `interface`, per la cronaca. Conseguenza misurabile per lettura:
accendere o spegnere il flag da `Info.tsx` non cambia la stringa, il `useMemo` non ricalcola,
`modeInfo.rootableClasses` resta quello di prima e **la palette continua a mostrare la classe**
finché non cambia qualcos'altro (un nome, una feature, il modello).

Nota di attenuazione, non di assoluzione: `set_singleton(true)` scrive anche `final: true`
(`LModelElement.tsx:2880`) — anch'esso assente dalla firma — e crea istanze **nei modelli M1**, che
non sono classi del metamodello e quindi non entrano nella firma. Nessuna scrittura collaterale
salva la reattività.

`getMetaclassInfo()` (`:230`, non-hook) ricalcola a ogni chiamata: i consumatori dell'authoring IR
non hanno il problema. È il ramo hook — cioè la palette e i gate di drop — a essere stantio.

→ **La Fase 2 deve aggiungere `${cls.isSingleton}` alla firma di `:173`.** È una riga, ed è
l'unica modifica di questo commit che tocca un percorso di reattività: va dichiarata nel Layer
Impact Report.

### 3.4 Un predicato corretto esiste già nell'L-layer, ma non va delegato

`LClass.get_rootable` (`LModelElement.tsx:2926-2930`):

```ts
if (c.data.rootable !== undefined) return c.data.rootable;
else return this.get_instantiable(c) && !this.get_isComposed(c);
```

cioè esattamente ciò che `resolveM1Info` reimplementa a `:499-501` — ma **con** `isSingleton`
dentro `instantiable`. Sembrerebbe la via pulita («leggi `cls.rootable` invece di ricalcolarlo»).
**Non lo è**, per il primo ramo: `data.rootable` è un flag esplicito che l'utente può accendere
(`Info.tsx:188`, chip «Rootable»), e quando è definito **vince su tutto**, singleton compreso. Una
classe singleton con `rootable: true` esplicito tornerebbe instanziabile.

Quindi: il filtro singleton va scritto in editor-v2 **in aggiunta**, non delegato. Registro però
che oggi editor-v2 e L-layer hanno due nozioni divergenti di «rootable», e che la divergenza è
pre-esistente e più larga di questo commit (→ §9, Q5).

---

## 4. D3 — Rimozione dell'istanza allo spegnimento del flag

### 4.1 L'ordine dentro la `TRANSACTION` non funziona — e questo emenda R-SGL-2

R-SGL-2 dice: *«l'ordine dentro la `TRANSACTION` è flag prima, cancellazione poi»*. La lettura del
motore dice che questo **non libera il guard**. Catena verificata:

1. `TRANSACTION(name, func)` (`action.ts:210-225`) fa `BEGIN()`, esegue `func`, poi `END([])`.
2. `BEGIN` incrementa `t.transactionDepthLevel` e alza `t.hasBegun` (`action.ts:100-108`).
3. Ogni `Action.fire()` con `t.hasBegun` vero **accoda** in `t.pendingActions` e non dispatcha
   (`action.ts:329-331`). Il dispatch avviene solo in `FINAL_END` (`:153-181`), quando la profondità
   torna a 0, e come **una sola** `CompositeAction`.
4. L'unica finestra di visibilità intra-transazione sarebbe `transientProperties.livePatches`
   (`action.ts:326-328`, letta dai proxy in `proxy.ts:57-63`), ma è gated su `U.liveStateChanges`,
   che vale **`false`** (`U.tsx:177`; unico assegnamento nel repo).

Quindi `store.getState()` e ogni `c.data` risolto durante la transazione riportano lo stato
**pre-transazione**. Il guard:

```ts
protected get_delete(context: Context): () => void {      // LModelElement.tsx:6425
    return () => {
        let c: LClass | undefined = this.get_instanceof(context);
        if(c && c.isSingleton) {                          // :6428  ← legge c.data.isSingleton
            Log.ww('Object is a singleton and cannot be removed, ...');
            return;
        }
        super.get_delete(context)();
    }
}
```

risolve un proxy nuovo su `c.data.instanceof` e legge `isSingleton` dallo stato committato: **ancora
`true`**. La cancellazione viene rifiutata silenziosamente (solo un `Log.ww`) e il `SetFieldAction`
sul flag va a buon fine da solo → il flag si spegne, l'istanza resta. Che è esattamente il
comportamento di oggi, non il comportamento voluto.

L'ordine inverso (cancella poi spegni) è peggio: il flag è ancora acceso a maggior ragione.

**Tre vie possibili per la Fase 2** (nessuna è raccomandata qui: è una decisione, → §9 Q2):

- **(α) token di rientranza a livello di modulo.** `set_singleton` marca un id (o un flag booleano
  di sessione) prima di chiamare `.delete()`; `LObject.get_delete` salta il guard quando il marcatore
  è attivo, e lo consuma. Idioma già in casa: `markDropCreated` / `consumeDropCreated`
  (`syncState.ts`), `suppressSingleton`. Costo: una funzione esportata in più e un accoppiamento
  esplicito fra `set_singleton` e il guard, entrambi nello stesso file.
- **(β) parametro interno sul percorso di cancellazione.** Es. `Dummy.get_delete` invocato
  direttamente da `set_singleton` bypassando l'override di `LObject` (`super.get_delete(context)()`
  è già la chiamata che il guard protegge). Costo: `set_singleton` deve costruirsi il `context`
  dell'oggetto, cosa che oggi non fa.
- **(γ) due transazioni** (spegni, poi in `AFTER_TRANSACTION` cancella). **Viola il vincolo del
  prompt**: due dispatch = due delta = **due passi di undo** (§4.4). Da scartare, salvo che Alfonso
  accetti l'asimmetria.

### 4.2 Cosa fa la cascata canonica, e cosa **non** fa

`.delete()` su un `LObject` → `LObject.get_delete` (`:6425`) → `super` → `Dummy.get_delete`
(`Dummy.ts:50`). Copertura verificata riga per riga:

| Aspetto | Dove | Esito |
|---|---|---|
| I `DValue` **dell'istanza** (le sue feature) | `Dummy.ts:84-87`, ricorsione su `lDeleted.children` | cancellati ✔ |
| L'entrata in `model.objects` | `Dummy.ts:106-113` (rete di sicurezza `-=` su `father.objects`) + `case 'objects'` nello stesso gruppo `:182-206` | rimossa ✔ (doppia, idempotente) |
| **I `DValue` di ALTRI oggetti che puntano all'istanza** | `Dummy.ts:183` `case 'values'` → `SetFieldAction.new(dObj.id, field, deletedID, '-=', true)` (`:205`) | l'entrata sparisce dall'array `values` dello slot reference ✔. Lo slot **non** viene cancellato né azzerato: perde l'elemento. Per un `0..1` resta un array vuoto; per un `0..N` gli altri valori restano. *(Letto, non eseguito.)* |
| Gli edge di grafo che puntano all'elemento via `model` | `Dummy.ts:222-233` `case 'model'`, ramo `className.includes('Edge')` | cancellati ✔ |
| Oggetti che puntano via `instanceof` | `Dummy.ts:211-216` | orfanati (`instanceof` svuotato), non cancellati — riguarda la cancellazione di una *classe*, non di un'istanza |
| **Il `DVertex` dell'istanza** | `Dummy.ts:254`: `if (lDeleted.nodes) lDeleted.nodes.map(node => node.delete())` | **NON cancellato.** Vedi §4.3. |

### 4.3 `lDeleted.nodes` è una scrittura morta

`LModelElement.get_nodes` (`:586-587`):

```ts
return Object.values(transientProperties.modelElement[context.data.id]?.nodes || {}).filter(n=>n&&n.html);
```

`DataTransientProperties.nodes` è inizializzato a `{}` nel costruttore (`classes.ts:4116-4123`) e
**nessuno lo popola mai**. Misura, con exit status:

- `command grep -rnE "\.nodes\s*\[[^]]+\]\s*=" frontend/src --include="*.ts" --include="*.tsx"` → nessun match, **exit 1**;
- controllo positivo sullo stesso comando e stesso perimetro: `modelElement\[` → **64 righe**;
- gli unici due `new DataTransientProperties()` nel repo sono `ocl.tsx:81` (che non tocca `.nodes`) e
  `reducer.ts:1093` (**commentato**).

Quindi `get_nodes` restituisce sempre `[]`, la riga `Dummy.ts:254` è inerte, e il commento in
`canvasToJjom.ts:449-455` — *«...e ogni DVertex attraverso i grafi (nodes)»* — **descrive un
comportamento che non c'è**. Nemmeno `syncDeleteVertex` cancella il vertice: lette tutte le 96 righe
della funzione (`canvasToJjom.ts:383-471`), il solo `DeleteElementAction` è sugli edge connessi
(`:427`), e per `DObject` si chiama `modelElement.delete()` (`:461`) — mai `vertexProxy.delete()`.

Conseguenza operativa per la Fase 2: **la cancellazione dell'istanza deve cancellare esplicitamente
il `DVertex`**, in tutti i grafi in cui esiste. La via canonica è `.delete()` sul proxy del vertice,
che via `Dummy.ts:181-205` `case 'subElements'` toglie l'id da `graph.subElements` — che è
esattamente il canale su cui si aggancia la UI (§4.4). Fatto dentro la stessa `TRANSACTION`, resta
un solo passo di undo.

### 4.4 Il canvas: nessun evento, ma il canale c'è già

`useJjomSync` rimuove i nodi RF nel sync incrementale, diffando **`graph.subElements`**:

```ts
for (const id of prevIds) {                               // useJjomSync.ts:1330
    if (!currentIds.has(id)) {
        if (rfNodeCache.current.delete(id)) removedNodeIds.add(id);   // :1333
        ...
```

e la lista `removedNodeIds` filtra lo stato RF a `:1464`. Quindi:

- **se** la Fase 2 cancella il `DVertex` (§4.3), il nodo sparisce dal canvas **da sé**, senza evento
  custom, in modo omogeneo con ogni altra rimozione strutturale;
- **se non lo cancella**, il nodo resta a schermo per tutta la sessione, e al reload
  `jjomVertexToRFNode` restituisce `null` sul `model` non risolvibile
  (`jjomTransformers.ts:400-402`) → vertice fantasma persistito nel grafo, la classe di inquinamento
  già dichiarata in `canvasToJjom.ts:456-460`.

Residuo minore: `suppressSingleton(vertexId)` (`syncState.ts:161`; chiamanti a
`EditorV2.tsx:785` e `:812`) lascia l'id nel Set di modulo anche dopo la cancellazione; viene ripulito solo
allo smontaggio (`EditorV2.tsx:820`, `clearSuppressedSingletons`). Nessun effetto osservabile
perché l'id non tornerà mai — ma se la Fase 2 aggiunge la cancellazione, vale una riga di cleanup.

### 4.5 Un solo passo di undo: sì, se tutto sta in una transazione

L'undo lavora su **delta di stato per dispatch** (`reducer.ts:1260-1261` accoda un delta per azione
dispatchata; `undo()` a `:1319` ne applica uno). Poiché `FINAL_END` fa un solo `CompositeAction.fire()`
per transazione di livello 0, tutto ciò che sta dentro la `TRANSACTION` di `set_singleton` — comprese
le `TRANSACTION` **annidate** aperte da `Dummy.get_delete` (`Dummy.ts:265`), che a profondità > 0 non
chiudono nulla — finisce in **un solo delta**. ✔

**Asimmetria da dichiarare**: il percorso di *accensione* non ha già oggi questa proprietà.
`set_singleton(true)` → `m1.addObject(..., true)` (`:2887`) → `get_addObject` fase 4, che rimanda
l'inizializzazione dei valori a `setTimeout(() => TRANSACTION(...))` (`LModelElement.tsx:7062`):
secondo dispatch, secondo passo di undo. Se il vincolo «un solo passo» è simmetrico, va aperto un
fronte a parte (→ §9, Q3).

### 4.6 Chi spegne il flag: tre scritture, non una

| Scrittura | Riga | Passa da `set_singleton`? |
|---|---|---|
| Chip «Singleton» nel Properties | `Info.tsx:187` → proxy set → `set_isSingleton` (`:2873`) → `set_singleton` (`:2874`) | **sì** |
| `set_final(false)` | `LModelElement.tsx:2867` — `if (!val) SetFieldAction.new(c.data, 'isSingleton', false)` | **no**, `SetFieldAction` diretta |
| `set_sealed([...])` con lista non vuota | `LModelElement.tsx:2850` — idem | **no** |

Le ultime due sono raggiungibili dalla UI: `Info.tsx:186` espone anche il chip «Final», e spegnere
Final su una classe singleton spegne il singleton senza passare da `set_singleton`. Se la Fase 2
aggancia la rimozione solo a `set_singleton`, R-SGL-2 resta scoperta su due percorsi. → §9, Q2.

C'è anche un quarto candidato, che però **oggi non scrive il campo giusto**: JjScript
`set <Classe>.singleton = <bool>` (`commands/set.ts:105`) emette
`SetFieldAction.new(element, 'singleton', ...)` dopo `mapPropertyName` (`:218-230`), che **non ha una
voce per `singleton`** e lo lascia com'è; il campo D è `isSingleton` (`classes.ts:969`,
`LModelElement.tsx:2658`). Letto, non eseguito: la scrittura finirebbe su un campo `singleton` che
nessuno legge. Se è così, il comando è inerte da sempre. → §9, Q6.

### 4.7 Sulla citazione «l'orphanStore per i DValue»

Non trovato riscontro. `orphanStore` (`useOrphanFeatures.ts:60`) è la Map di modulo che cattura i
valori M1 quando si cancella un **attributo M2**, per reidratarli se l'attributo viene riaggiunto
(entry di log 2026-05-22, `discovery_2026-05-22_cluster1_attrtype_format.md`). Non ha nulla a che
vedere con la cancellazione di un `DObject`: i `DValue` dell'istanza cancellata sono rimossi dalla
ricorsione su `children` (§4.2) e non transitano da lì. Segnalo la citazione come da correggere nel
knowledge base, non la ricostruisco (RC-10).

---

## 5. D4 — Coerenza col toggle View > Show singletons

### 5.1 Il ramo di creazione serve ancora

Il ramo è `EditorV2.tsx:729-761` («For singleton classes without a DVertex, create DObject +
DVertex»), dentro l'handler `handleToggleSingletons` (`:676`), ramo `show` (`:693`).

Perché una classe singleton possa trovarsi **senza istanza** in un M1 salvato servono generatori.
Li ho cercati tutti; ne restano due, più uno ipotetico:

1. **Progetti salvati prima della feature.** `set_singleton` crea le istanze all'accensione
   (`:2883-2888`) e `classes.ts:942` le crea alla nascita di ogni M1. Ogni progetto salvato prima che
   quei due esistessero può avere il flag e non l'istanza. Non databile da qui (il flag è persistito
   come semplice campo, e `VersionFixer.tsx:407` si limita a booleanizzarlo). **Generatore reale, non
   quantificabile staticamente.**
2. **`LModel.set_instanceof` (`LModelElement.tsx:5430-5440`)** assegna il metamodello a un modello
   **dopo** la costruzione e **non** crea i singleton (a differenza del costruttore,
   `classes.ts:936-945`). Non ho trovato in-repo un chiamante che ri-punti un M1 esistente a un M2
   — tutte le nascite di M1 passano il metamodello a `DModel.new` (`Navbar.tsx:98`,
   `XMIService.ts:593`, `api/data.ts:518`, `ProjectEditor.tsx:1659`) — ma il setter è pubblico e
   attivo. **Generatore latente.**
3. **Cancellazione manuale dell'istanza**: oggi **impossibile** da ogni percorso che ho letto. Il
   guard `:6428` copre `syncDeleteVertex` (che anzi ha un bail-out anticipato dedicato,
   `canvasToJjom.ts:390-400`), il context menu classic e JjScript `delete instance`
   (pre-check a `instance.ts:369-383`). Il tree M1 non cancella istanze (in
   `TreeViewContent.tsx` i soli `.delete()` sono su view, righe 1422, 1824, 1835). **Non è un
   generatore.**

Un generatore che **non** esiste, e che vale la pena registrare perché lo si sospetterebbe: l'import
Ecore/XMI (§2.3 #12) non porta mai il flag acceso.

**Proposta**: **tenere il ramo, come fallback dichiarato**, con un commento che nomina i due
generatori sopra. Motivo forte: dopo il commit A, con la palette e i menu chiusi al singleton,
**il ramo diventa l'unica via di riparazione in UI** per un M1 in stato (1) o (2). Toglierlo
lascerebbe quei progetti senza singleton e senza modo di ricrearlo se non via JjScript (che a sua
volta lo crea per il buco del §2.3 #9 — cioè per un difetto, non per disegno).

**Limite del fallback, da dichiarare**: la voce di menu esiste solo in modalità *advanced*
(`Navbar.tsx:1486`, `!props.advanced ? null : ...`) e la riparazione scatta solo sulla transizione
OFF→ON del toggle. In modalità base un M1 in stato (1) resta senza istanza e senza affordance.
→ §9, Q4.

### 5.2 La soppressione al mount non dipende dal ramo di creazione

Il blocco è `EditorV2.tsx:792-816` (il prompt lo cita come `:793-815`). Verificato: legge
`localStorage['jjodel.showSingletons.<modelid>']`, poi itera `graph.subElements` dal solo
`store.getState().idlookup`, risolve `vertex.model.instanceof` e chiama `suppressSingleton(seId)` se
`dClass.isSingleton`. **Nessun riferimento al ramo di creazione, nessuna dipendenza da
`modeInfoRef`.** ✔

Residuo: a `:796` c'è `const mi = modeInfoRef.current;` che in quel blocco **non viene mai usato**
(il ramo `show` a `:684` invece lo usa). Variabile locale morta. Non la toccherei in questo commit
(regola 8/9); al più un `// TODO: cleanup`.

### 5.3 Con l'istanza garantita, il toggle resta puro mostra/nascondi

Confermato che il resto dell'handler è già mostra/nascondi puro: ramo `show` passi 1-2
(`:695-726`) riscopre i `DVertex` esistenti, toglie la soppressione e reidrata il nodo RF; ramo
`hide` (`:767-790`) sopprime e filtra. Solo il passo 3 crea.

---

## 6. D5 — Stereotipo

### 6.1 Nessuna regola SCSS resta orfana

- La base `.mm-node__stereotype` è dichiarata **una volta**, sotto `.mm-node`, a
  `EditorV2.scss:1706-1714`. Condivisa; `ClassNode.tsx:721` continua a emetterla → **resta**.
- L'impilamento verticale è `&:has(.mm-node__stereotype)` su `&__header`
  (`EditorV2.scss:1678-1683`), anch'esso sotto `.mm-node` e usato da `ClassNode` → **resta**.
- I tre `display: none` di `_notations.scss` (**12** simplified, **27** compact, **83** ER) sono
  scoped alla notazione (`.editor-v2.notation-*`), non al tipo di nodo → **restano**, e continuano a
  servire `ClassNode`.
- **Non esiste alcuna regola scoped all'istanza.** Ricerca su tutto `frontend/src` per
  `mm-node__stereotype`: 7 occorrenze in totale (3 TSX + 1 commento, 1 in `EditorV2.scss`
  `:has()`, 1 base, 3 in `_notations.scss`) — nessuna nella forma `.mm-object .mm-node__stereotype`
  o simile. Il blocco `.mm-object` di `EditorV2.scss` (che finisce a `:2178`) non contiene regole di
  stereotipo: contiene solo il **commento** `:2175-2177` che spiega la rimozione del vecchio badge
  a rombo.
- Il wrapper di `ObjectNode` non porta la classe `singleton` in nessuno dei due rami
  (`:416` IR, `:471` nativo) — a differenza di `ClassNode.tsx:478` che la porta. Nulla da ripulire
  lato classi.

**Effetto collaterale, non un orfano**: rimuovendo il blocco nativo (`ObjectNode.tsx:496-498`) il
`&:has()` a `EditorV2.scss:1679` smette di scattare sugli object node — che è esattamente ciò che si
vuole (header a riga singola). Nessun altro elemento dell'header dipende da quel selettore.

**Commento che diventa stantio**: `EditorV2.scss:2175-2177` dice *«...sostituito dalla riga di
stereotipo «singleton» nell'header (ObjectNode, sia il ramo nativo sia quello IR)»*. Dopo A la
frase è falsa. Aggiornarlo è la sola modifica utile in quel file; è dentro il perimetro del prompt
(«solo le regole di `.mm-node__stereotype`») solo per interpretazione estensiva → §9, Q7.

### 6.2 `liveMetaclassInfo` in `ObjectNode`

`ObjectNode.tsx:81-90`:

```ts
const liveMetaclassInfo = useSelector((state: any) => { ... return { name, isSingleton } });   // :81-86
const liveMetaclassName = liveMetaclassInfo.name;                                              // :87
const isSingleton = liveMetaclassInfo.isSingleton;                                             // :88
const metaclassName = liveMetaclassName ?? (data.instanceOfClassId ? data.instanceOfClassName : 'Orphan');  // :89-90
```

`liveMetaclassInfo` **serve e resta**: alimenta `metaclassName`, cioè la metà destra dell'header
`nome : Classe` (`:513`) — è la reattività del **rename della metaclasse**. Va lasciato intatto,
selettore compreso: restituire un oggetto con due chiavi anziché una sola stringa è un dettaglio di
forma, e ridurlo cambierebbe l'identità del valore memoizzato senza motivo.

Ciò che diventa davvero morto è la sola `const isSingleton` di `:88`, uniche consumatrici essendo
`:434` e `:496`. Le uniche tre occorrenze di `isSingleton` nel file sono quelle
(verificato: `ObjectNode.tsx:83, 85, 88, 434, 496`, dove 83/85 sono dentro il selettore).
Due opzioni, entrambe difendibili: togliere anche `:88` e la chiave `isSingleton` dal selettore
(diff più pulito, ma tocca il selettore), oppure lasciare `:88` con `// TODO: cleanup` per regola 9.
→ §9, Q7.

### 6.3 Perimetro confermato di R-SGL-3

`ClassNode.tsx:444/478/720-722` invariato ✔ · tree M1 `TreeViewContent.tsx:856-887` e `:2346-2374`
(badge `bi-braces`, singleton in testa) invariato ✔ · view classic `DV.tsx:1449` (`bi-1-square`),
`redux/defaults/views.ts:647` / `:682`, `defaultViewTemplate.ts:148/230-236`
(`CLASSIC_SINGLETON_VIEW_MARKER`) invariati ✔.

**Conseguenza sulla regola 14 di CLAUDE.md**: il commit A **non tocca** `DV.tsx` né
`defaultViewTemplate.ts`, quindi **nessuna migrazione VersionFixer è dovuta**. Da dichiarare
esplicitamente nel Layer Impact Report della Fase 2, perché «singleton» e «view di default» sono
abbastanza vicini da far scattare il dubbio.

---

## 7. D6 — Modelli esistenti dopo il commit A

Nessuna migrazione è prevista. Comportamento dei tre casi, così com'è deducibile dal codice:

### (a) Classe singleton **senza** istanza in un M1 salvato

- Palette, drop, menu contestuale, connect gesture: **la classe non appare più** (§2.2, tutti e sei
  i filtri chiusi). L'utente non può crearla.
- Nulla, all'apertura del modello, ricrea l'istanza: `classes.ts:942` è un
  `_persistCallback` della **costruzione** del `DModel`, non del caricamento; `VersionFixer` non
  crea nulla (`:407` booleanizza e basta).
- **L'unica riparazione è il ramo del toggle** (§5.1), advanced-only.
- Rischio residuo: se una reference obbligatoria punta a quella classe, il modello resta non
  conforme senza via d'uscita in UI base.

### (b) **Due** istanze della stessa classe singleton

- Sopravvivono entrambe. Entrambe sono **incancellabili** dal guard `:6428` finché il flag è acceso.
- Il flag **non può essere riacceso** dopo uno spegnimento: `set_singleton` rifiuta con
  `instances.length > 1` (`:2876`). E qui c'è un dettaglio che vale per tutti i progetti, non solo
  per questo caso: **`DClass.instances` è piatto su tutto il progetto**, non per-modello
  (`LModelElement.tsx:2152-2156`, `:3183-3187`; il campo D è `instances: Pointer<DObject,0,'N'>`,
  `:2642`). Con due M1 che hanno **una istanza legittima ciascuno** — cioè lo stato **normale** di
  un singleton su due modelli — `instances.length` vale 2 e l'accensione è rifiutata. Il flag si può
  accendere solo quando il progetto ha al più un'istanza in tutto.
- **Il commit A migliora questo caso**: se lo spegnimento cancella *tutte* le istanze,
  `instances.length` torna a 0 e il giro OFF→ON si riapre. Va però scritto esplicitamente che il
  ciclo di cancellazione **itera `get_instances(c)` per intero** — non «una per modello».
- Provenienza plausibile di uno stato (b): il buco JjScript del §2.3 #9, oppure progetti anteriori
  al guard.

### (c) Istanza di una classe che **non è più** singleton

- Non succede nulla, e va bene così: la rimozione è agganciata alla **transizione** del flag, non
  allo stato. Con il flag già spento l'istanza è un oggetto ordinario, il guard `:6428` non scatta
  più, ed è cancellabile da ogni percorso normale.
- Caso limite adiacente, per completezza: cancellare la **metaclasse** singleton lascia l'istanza
  viva e orfana (`Dummy.ts:211-216`, `case 'instanceof'` su `DObject` → svuota `instanceof`, non
  cancella). `ObjectNode` la rende con `mm-object--orphan` (`:471`). Pre-esistente, invariato da A.

**Riassunto per la decisione di Alfonso**: nessuno dei tre casi produce un crash o una perdita di
dati dopo A. Il solo che lascia l'utente senza via d'uscita è **(a) in modalità base**, ed è il
motivo per cui in §5.1 raccomando di tenere il ramo di creazione.

---

## 8. Dipendenze e rischi per la Fase 2

**Perimetro file atteso** (7 file di prodotto, sopra la soglia della regola 19 → la Fase 2 deve
elencarli e farsi confermare prima di procedere):

| File | Cosa cambia | Layer |
|---|---|---|
| `hooks/useEditorMode.ts` | `isSingleton?: boolean` su `MetaclassInfo` (:43-56); popolamento (:429-437); `isSingleton` nella firma (:173); filtro in `rootableClasses` (:499-501) | canvas v2-flow + lettura L-layer |
| `utils/compositionCompat.ts` | filtro in `getCompatibleContainmentRefs` (:48) e `getCompositionChildOptions` (:164, :169) | canvas v2-flow |
| `viewpoint/ir/irInteraction.ts` | filtro in `matchConnectRules` (:136); valutare `deriveDroppableChildMetaclasses` (:170) | canvas v2-flow |
| `EditorV2.tsx` | filtro nel ramo `extra` della palette IR (:1499-1501); eventuale commento sul fallback del toggle (:729) | canvas v2-flow |
| `nodes/ObjectNode.tsx` | rimozione dei due blocchi stereotipo (:434-436, :496-498) e della `const isSingleton` (:88) | resa |
| `model/logicWrapper/LModelElement.tsx` | ramo di rimozione in `set_singleton` (:2874-2891); meccanismo per superare il guard (:6425-6433) | **D-L proxy** |
| `jjscript/executor/commands/instance.ts` | check singleton gemello di quello su `abstract` (:231-241) — **solo se** Alfonso chiude Q1 | comandi |

**Rischi**, in ordine di gravità:

1. **Il guard non si libera con l'ordine** (§4.1). È il rischio che può far fallire la Fase 2 in
   silenzio: il flag si spegne, la `Log.ww` finisce in console, l'istanza resta e il diff «sembra»
   corretto. Qualunque via si scelga fra α/β/γ, la verifica deve essere **osservazionale**
   (l'istanza sparisce davvero dal modello e dal canvas), non la lettura del codice.
2. **Il `DVertex` va cancellato a mano** (§4.3). Se lo si dimentica, il nodo resta sul canvas per
   tutta la sessione e diventa un vertice fantasma dopo il reload. Nessun test lo intercetterebbe:
   non esistono test né per `useEditorMode` né per `compositionCompat` (le uniche suite in
   `editor-v2/utils/__tests__/` sono `handlePosition`, `nodeAvoidance`, `portDistribution`,
   `refEdgeReconcile`, `reLayoutWatcher`; in `hooks/__tests__/` solo `useAutoAnchor`).
3. **La firma di reattività** (§3.3). Se si dimentica, il difetto è *intermittente*: la palette
   sembra corretta ad apertura del modello e sbagliata dopo un toggle del flag. È il caso peggiore
   per lo smoke visivo.
4. **Le tre scritture del flag** (§4.6). Agganciare solo `set_singleton` lascia due percorsi UI che
   spengono il flag senza rimuovere l'istanza — cioè esattamente il difetto che A vuole chiudere,
   ma su un'altra strada.
5. **La regola 20 di CLAUDE.md scatterà**: `LModelElement.tsx` è D-L proxy, `set_singleton` scrive
   nel D-layer e la rimozione tocca JjOM + canvas. La Fase 2 richiede **Layer Impact Report** ex
   §3.2, e va dichiarato che nessuna `TRANSACTION` esterna avvolge un `.new()` (le `SetFieldAction` +
   `DeleteElementAction` di cui sopra sono nel caso «TRANSACTION pura» esplicitamente consentito da
   §3.3 di CLAUDE.md).
6. `MetaclassInfo` è un'interfaccia **esportata**: regola 11 → il campo deve essere **opzionale**.
   Con `isSingleton?: boolean` nessun letterale esterno cambia (§3.1). ✔

**Gate**: typecheck baseline 33, build, `npm run test` sui file toccati (nessuno dei file di
prodotto sopra ha una suite propria oggi; `ir.test.ts` copre `matchConnectRules` e va ri-eseguita).

---

## 9. Domande aperte per Alfonso

**Q1 — JjScript / Jjodie: dentro o fuori dal commit A?**
`create instance <Singleton>` oggi riesce (§2.3 #9) e non passa da `MetaclassInfo`. È l'unico buco
che nessuna modifica a editor-v2 chiude. Tre righe in `instance.ts:231-241`, gemelle del check su
`abstract`, oppure R-SGL-1 resta dichiaratamente non coperta su quel fronte. *Preferenza mia:
dentro, perché «non instanziabile per nessuna via» con un comando che la instanzia è una spec che si
contraddice; ma allarga il perimetro a 7 file.*

**Q2 — Come si supera il guard, e a quante scritture del flag si aggancia la rimozione?**
Due sotto-decisioni accoppiate: (i) α token di rientranza / β chiamata diretta alla cascata / γ due
transazioni con due undo (§4.1); (ii) solo `set_singleton`, o anche `set_final(false)` e
`set_sealed([...])` che spengono il flag con `SetFieldAction` diretta (§4.6). Se la risposta a (ii)
è «tutte e tre», la α diventa nettamente la più economica: le tre scritture stanno a 25 righe di
distanza nello stesso file.

**Q3 — Il vincolo «un solo passo di undo» è simmetrico?**
Lo spegnimento può stare in un solo delta (§4.5). L'**accensione** oggi non ci sta, per il
`setTimeout` di `addObject` fase 4 (`:7062`). Se la simmetria conta, è un fronte separato; se non
conta, va scritto che vale solo per lo spegnimento.

**Q4 — Il fallback del toggle basta, dato che è advanced-only?**
Raccomando di tenere il ramo `:729-761` (§5.1), ma la riparazione è raggiungibile solo in modalità
advanced e solo sulla transizione OFF→ON. Se non basta, serve un secondo canale (per esempio una
riparazione all'apertura del modello) — che però è una feature nuova, non parte di A.

**Q5 — La divergenza «rootable» fra L-layer e editor-v2 si registra o si chiude?**
`LClass.get_rootable` (`:2926-2930`) e `resolveM1Info` (`:499-501`) calcolano due cose diverse, e il
ramo `data.rootable` esplicito (chip «Rootable» in `Info.tsx:188`) può riaprire l'instanziabilità di
un singleton anche dopo A. In A propongo di **non toccarlo** e di applicare il filtro singleton
in aggiunta; ma la divergenza resta a registro.

**Q6 — `set <Classe>.singleton = <bool>` di JjScript scrive il campo sbagliato?**
Lettura (non esecuzione): `commands/set.ts:105` emette `SetFieldAction` sul nome `'singleton'`,
`mapPropertyName` (`:218-230`) non lo rimappa, il campo D è `isSingleton`. Se confermato, il comando
è inerte da sempre — che è una buona notizia per A (non è un quarto writer da agganciare) e una
cattiva per JjScript. Serve una prova a runtime prima di aprire un fronte.

**Q7 — Due micro-scelte di stile, per chiudere il diff:**
(a) in `ObjectNode.tsx`, togliere anche `const isSingleton` (`:88`) e la chiave dal selettore, o
lasciarla con `// TODO: cleanup` per regola 9;
(b) aggiornare il commento ormai falso in `EditorV2.scss:2175-2177`, o lasciarlo (regola 8).

---

## 10. Note di metodo

- Tre asserzioni di assenza in questo report sono accompagnate da controllo positivo sullo stesso
  comando e stesso perimetro, come richiede CLAUDE.md §5: nessuna scrittura su
  `DataTransientProperties.nodes` (exit 1; controllo: 64 righe su `modelElement[`); nessuna menzione
  di `singleton` in `services/export/` (controllo: 3 righe su `abstract` in `EcoreService.ts`) e in
  `api/persistance/` (controllo: 13 righe su `DObject` in `api/data.ts`).
- Tutte le ricerche sono passate da `command grep` (BSD grep), non dal wrapper `ugrep` interattivo,
  perché usano `--include`. `type grep` conferma il wrapper: la distinzione è quella misurata in
  CLAUDE.md §5.
- I riferimenti a riga del prompt che risultano spostati su `6b66ffe3a`: `LModelElement.tsx:2892` →
  **2893** (`get_instantiable`); `:6429` → **6428** (la riga del guard; il metodo apre a 6425);
  `EditorV2.tsx:793-815` → **792-816**; `compositionCompat.ts:161-172` → **161-175**;
  `useEditorMode.ts:500` → **499-501**. Gli altri coincidono.
