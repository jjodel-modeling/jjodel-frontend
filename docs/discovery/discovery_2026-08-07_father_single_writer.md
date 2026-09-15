# Discovery — voce 4: writer unico di `father`, viewpoint derivato, move con cascata

**Data**: 2026-08-07
**Tipo**: discovery Fase 1, read-only (corsia completa, RC-3)
**Branch**: `alfonso-frontend-jjtl`
**HEAD**: `7450eb256 fix(editor-v2): drop empty routing key, placeholder Manhattan (default)`
**git status all'apertura**: pulito (nessun file modificato, nessun untracked riportato da
`git status --short`)

```
7450eb256 fix(editor-v2): drop empty routing key, placeholder Manhattan (default)
eea50266f feat: warn on author-modified global !important css at viewpoint activation
785da04ef docs: discovery on the style window channel (3.6 phase 0)
acf0249ce docs: point AGENTS.md regeneration check to check:agents
6db2361ac docs: refresh viewpoint-codebase-map §3 for the IR five-tab bar
a6058b805 chore(tooling): add AGENTS.md alignment gate, fix check:docs resolver key
5fcef39ef docs: land the voce 5 entry and close the arco A queue
363f8166d chore: regenerate AGENTS.md
```

## Obiettivo

Verificare, prima di qualsiasi diff, le cinque aree della voce 4: la forma reale di
`set_father` e dei suoi call site (A), lo stato delle superfici UI a HEAD dopo R-H (B), e
cosa dicono i dati disponibili sulle gerarchie di view (C). Le decisioni D-4-1..D-4-5 del
2026-08-07 orientano le domande ma non sono state applicate: nessun file di codice è stato
toccato.

## Rettifiche agli ancoraggi del prompt

Due riferimenti del prompt non reggono a HEAD e vanno corretti prima di leggere il resto.

1. **`ViewProperties.tsx` non replica il doppio writer.** A HEAD il file ha **un solo**
   controllo su `father` — il Select "Parent view" (`:121-134`, write a `:126`). Non esiste
   nessun Select "Viewpoint". Le righe `:70-73` sono la sola lista di parent con il filtro
   per viewpoint. Il difetto "due tendine sullo stesso campo" vive **solo** in
   `InfoData.tsx` e nella sua ricollocazione `irTabs.tsx`.
2. **`ViewProperties.tsx` è codice morto a HEAD.** Il suo unico host è
   `components/editors/viewpoint/WorkbenchProperties.tsx:58`, e `WorkbenchProperties` non è
   importato da nessun file del repo (unica occorrenza esterna: un commento in
   `properties/ViewpointProperties.tsx:4`). L'intera directory
   `components/editors/viewpoint/` (workbench, ViewTree, WorkbenchEditors, properties/)
   non ha importatori fuori da sé stessa. **D-4-5 andrebbe quindi applicata a UI non
   raggiungibile**: è una domanda aperta per Alfonso (vedi §Domande, Q4).
3. **Path del censimento**: il prompt cita
   `docs/discovery/discovery_2026-08-04_legacy_view_census_real_projects.md`, che non
   esiste. Il file reale è `discovery_2026-08-05_legacy_view_census_real_projects.md`
   (esiste anche `discovery_2026-08-04_legacy_viewpoint_census.md`, che è quello superato).
   Letto il primo.

Gli ancoraggi restanti sono **confermati a HEAD**: `InfoData.tsx:306` e `:323` hanno
entrambi `field={'father'}`; `Input.tsx:252-254` è il fallback `data[field] = …`;
`view.tsx:224/239/273` sono `subViews`/`viewpoint`/`father`; `view.tsx:1456` è il
riallineamento del denormalizzato; `irResolveCore.ts:99-113` legge `d.viewpoint`.
`set_father` è a `view.tsx:1445` (il prompt diceva `:1456`, che è una riga interna).

## File letti

- `frontend/src/view/viewElement/view.tsx` (integrale nelle zone rilevanti: 200-360,
  420-500, 940-1010, 1400-1520, 1560-1600, 1640-1745)
- `frontend/src/view/viewPoint/viewpoint.ts` (integrale)
- `frontend/src/joiner/classes.ts` (552-610, 1090-1200, 2260-2330, 1428-1450, 2394-2412)
- `frontend/src/joiner/proxy.ts` (370-400, 440-505)
- `frontend/src/redux/action/action.ts` (100-300)
- `frontend/src/redux/selectors/selectors.ts` (392-440, 520-570)
- `frontend/src/redux/VersionFixer.tsx` (270-310, 405-445, 1130-1200, elenco migrazioni)
- `frontend/src/common/Dummy.ts` (50-145, `get_delete`)
- `frontend/src/common/Defaults.ts` (60-120)
- `frontend/src/components/forEndUser/Input.tsx` (90-270)
- `frontend/src/components/editors/views/data/InfoData.tsx` (integrale)
- `frontend/src/components/editors/views/ViewData.tsx` (integrale)
- `frontend/src/components/editors/views/NestedView.tsx` (240-270, 425-450, 493)
- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` (integrale)
- `frontend/src/components/editors/viewpoint/properties/ViewProperties.tsx` (1-160)
- `frontend/src/components/editors/viewpoint/WorkbenchProperties.tsx` (1-80)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (70-140)
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (1180-1330)
- `frontend/src/utils/lastViewpoint.ts` (30-80)
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (grep mirato su view/father)
- `frontend/src/examples/*.ts` (parsing read-only dei blob di stato, §C)

---

## Area A — `set_father` e l'invariante

### A1 — Testo integrale e forma di `set_father`

`frontend/src/view/viewElement/view.tsx:1445-1494`, metodo di `LViewElement`.

```
1445  set_father(v, c, manualDview?, preserveOrder = false)
1446-1452   pvid = v && Pointers.from(v)
            data = manualDview || c.data ; id = data.id ; oldpvid = data.father
            if (pvid === oldpvid) return true                       ← guardia no-op
            dfather = (v oggetto) ? v.__raw||v : DPointerTargetable.fromPointer(pvid)
1454  TRANSACTION('change <name>.parent', () => {
1455      SetFieldAction.new(id, 'father', pvid, '', true)
1456      if (data.viewpoint !== dfather.viewpoint)
              SetFieldAction.new(id, 'viewpoint', dfather.viewpoint, '', true)
1457-1464 se oldpvid: SetFieldAction.new(oldpvid, 'subViews', {[id]:…}, '-=', true)
1465-1491 se pvid:    calcolo peso/ordine, SetFieldAction.new(pvid,'subViews',subViews,'+=',true)
1492  }, c.proxyObject.father?.name, dfather.name || dfather.className)
1493  return ret
```

**Ordine**: father → viewpoint (solo del nodo mosso) → `-=` sul vecchio parent → `+=` sul
nuovo. **Nessun tocco ai discendenti**: il riallineamento di `viewpoint` a `:1456` è
puntuale sul solo `id`.

**Dentro TRANSACTION, ma pura.** Il corpo contiene esclusivamente `SetFieldAction`: nessun
`.new()/.new2()/.new3()`. È esattamente il caso dichiarato **SAFE** da CLAUDE.md §3.3
("TRANSACTION di sole azioni, senza creatori"). Aggiungere altre `SetFieldAction` (la
cascata) **non cambia questa classificazione**.

**Distanza dal sync layer**: nulla. `useJjomSync.ts` non nomina mai `DViewElement`,
`LViewElement` né `father` di view — le tre occorrenze di "father" nel file sono commenti
sulla reference `father` di Families.ecore (`:508`, `:655-656`, `:942`). Vedi regola di
uscita 1.

**Nota su `dfather` a `:1452` e sul valore "None"** (rilevante per D-4-2):
`DPointerTargetable.fromPointer` ritorna l'input quando è falsy (`classes.ts:1446`,
`if (!ptr) return ptr`). Quindi:
- con `father = ''` (opzione "None" di `InfoData.tsx:326` / `irTabs.tsx:152`, che passa la
  stringa vuota): `dfather === ''`, `''.name` è `undefined` — nessun throw — e `:1456`
  esegue `SetFieldAction(id, 'viewpoint', undefined)`. **La view perde il viewpoint
  denormalizzato.** Da lì sparisce dall'indice IR (`irResolveCore.ts:113` confronta
  `d.viewpoint !== vp`) e fa esplodere lo scoring classico
  (`selectors.ts:553-556`, `DPointerTargetable.fromPointer(dview.viewpoint)` → `undefined`,
  poi `dvp.id`).
- con `father = undefined` (è ciò che passa `ViewProperties.tsx:126`,
  `e.target.value || undefined`): `dfather === undefined` e l'argomento `:1492`
  `dfather.name` **solleva TypeError prima ancora che TRANSACTION venga invocata** (gli
  argomenti sono valutati per primi). Su codice oggi non raggiungibile (§Rettifiche 2), ma
  è la forma in cui il pattern verrebbe riesumato.

**Nota su un difetto latente nel calcolo del peso** (`:1466-1489`, non chiesto ma trovato
leggendo): `let copyPos = name.indexOf("Copy")` vale `-1` — cioè **truthy** — per ogni nome
che non contiene "Copy". Il ramo `if (copyPos)` viene quindi preso quasi sempre;
`name.substring(0, -1)` è `''`, `'' in oldSubViews` è falso, e il ciclo di fallback
(`key.indexOf('') === 0`, sempre vero) fissa `insertBefore` alla **prima chiave** di
`oldSubViews`. La riga `:1489` sovrascrive allora il `1.5` appena assegnato con
`subViews[insertBefore]`, cioè il peso di un fratello arbitrario. Effetto: ogni reparent
attribuisce alla view un boost di priorità copiato da un fratello a caso, che moltiplica il
punteggio nel classico (`selectors.ts:421-422`, `pvScore`). Segnalato, non corretto.

### A2 — Call site di `set_father` e di ogni scrittura su `father`

`set_father` non è mai invocato per nome nel repo (l'unica occorrenza è commentata,
`view.tsx:1691`). Si raggiunge solo per assegnazione via proxy: `proxy.ts:476-478` cerca
`'set_' + propKey`, e `proxy.ts:467` aliasa `parent → father`. Elenco completo dei writer
del campo su un `DViewElement`:

| # | Sito | Via | Vivo? | Rapporto con la cascata D-4-4 |
|---|------|-----|-------|-------------------------------|
| 1 | `InfoData.tsx:303-311` Select "Viewpoint" | `Input.tsx:254` → `set_father` | sì (view non-IR) | **avvantaggiato**: oggi riparenta alla radice e lascia i discendenti con `viewpoint` stantio |
| 2 | `InfoData.tsx:320-327` Select "Parent view" | idem | sì (view non-IR) | **avvantaggiato**: cambiando parent nello stesso vp la cascata è un no-op; è l'unico modo di renderla corretta se il parent è in un altro vp |
| 3 | `irTabs.tsx:129-137` Select "Viewpoint" | idem | sì (view IR) | come 1 |
| 4 | `irTabs.tsx:146-153` Select "Parent view" | idem | sì (view IR) | come 2 |
| 5 | `ViewProperties.tsx:126` `setField('father', …)` | `lview['father'] = v` → `set_father` | **no** (host orfano) | come 2 |
| 6 | Creazione: `Constructors` `setPtr('father', father)` (`classes.ts:582-586`) + `setPtr('viewpoint', vp)` (`:1186`) + `setExternalPtr(father,'subViews','+=')` (`:1189`) | non passa da `set_father` | sì | **indifferente**: alla nascita non ci sono discendenti |
| 7 | `LViewElement.duplicate` (`view.tsx:1653-1745`) | `new2` sul clone; il `case 'father'` a `:1688-1692` è deliberatamente vuoto; il deep ricorre con `{pvid: dclone.id}` (`:1679-1683`) | sì | **indifferente**: ogni clone nasce già sotto il parent giusto |
| 8 | `VersionFixer['2.2 -> 2.201']:427` `c.father = c.viewpoint` | mutazione D grezza in migrazione | sì (progetti legacy) | **indifferente**: pone `father = viewpoint`, quindi il denormalizzato è per costruzione coerente |
| 9 | `Dummy.get_delete` (`common/Dummy.ts:84-93`) | non scrive `father`, ma `SetFieldAction(dDeleted.father,'subViews', id,'-=')` e cancella ricorsivamente i figli | sì | **indifferente**, ed è un precedente: vedi A3 |

**Nessun call site si aspetta la semantica non-cascata.** Regola di uscita 2: non scatta.

Fuori perimetro ma da registrare: `examples/StateMachine/index.ts:129-130,180-181,212-213`
scrive `viewpoint` e `subViews` con `SetFieldAction` dirette, scavalcando `set_father`.
`frontend/src/examples/` è codice morto (nessun importatore; confermato di nuovo con grep,
e già accertato dal censimento del 2026-08-05).

### A3 — Cascate, guardie o riallineamenti già esistenti

**Non esiste alcuna cascata su `viewpoint`.** I soli writer del campo denormalizzato sono:
`viewpoint.ts:43` (un viewpoint punta a sé stesso alla nascita), `classes.ts:1186`
(creazione), `view.tsx:1456` (il nodo mosso, e solo quello), `VersionFixer:427`, e le tre
righe morte di `examples/StateMachine`. Grep esaustiva su `SetFieldAction(... 'viewpoint')`
e `.viewpoint =`.

**Esiste però una cascata sullo stesso sottoalbero, nel delete.** `LViewElement.children` è
alias di `subViews` (`view.tsx:1574-1575`), e `Dummy.get_delete:84-87` fa
`for (child of lDeleted.children) child.delete()`. Cancellare una view cancella l'intero
sottoalbero. È il precedente più vicino a D-4-4 e usa `subViews` come indice dei figli.

**Manutenzione dell'opposite `subViews`** — i writer vivi sono tre e sono tutti allineati:
creazione (`classes.ts:1189`), `set_father` (`view.tsx:1462`/`:1490`), delete
(`Dummy.ts:92`). Più uno grezzo: `NestedView.tsx:254` e `:438` scrivono
`pv.subViews = {...pv.__raw.subViews, [d.id]: +v}` per l'editor di boost. Quella
assegnazione **non passa da un setter di dominio**: il proxy cerca `set_subViews`
(minuscolo, `proxy.ts:476`) e in `LViewElement` esiste solo `set_SubViews` con la S
maiuscola (`view.tsx:955`) — quindi cade su `_defaultSetter` (`view.tsx:500` →
`classes.ts:2268/2296`), che emette una `SetFieldAction` generica. Nell'uso attuale riscrive
la mappa intera preservando le chiavi, quindi non rompe l'opposite, ma è un canale aperto.

Per la stessa ragione **`set_SubViews` (`view.tsx:955-962`) e `setSubViewScore`
(`view.tsx:965-982`) sono codice morto**: zero call site, e il proxy non li raggiunge per
via del nome. Se un giorno venissero cablati, entrambi potrebbero aggiungere o togliere una
voce di `subViews` senza toccare il `father` corrispondente.

Nessuna risalita `fatherChain` in scrittura: `get_fatherChain` (`view.tsx:1411-1422`) e
`get_allSubViews` (`:985-1006`) sono getter puri.

### A4 — Come enumerare il sottoalbero

Due indici disponibili, con affidabilità diversa.

**`subViews` (`get_allSubViews`, `view.tsx:987-1006`)**: BFS su `Object.keys(subViews)` con
`idmap` come visited set — **quindi già a prova di ciclo**, non va in loop e non duplica.
Legge `store.getState()` una volta sola all'inizio. È l'indice usato oggi da
`allPossibleParentViews` e, indirettamente, dal delete ricorsivo.

Rischio: nei progetti migrati da schema pre-2.201 l'opposite può essere **incompleto**.
Misurato sui blob (§C): in tutti e sei, `subViews` è un **array** di pointer, non un
dizionario, e `father` è assente. La migrazione `2.2 -> 2.201` (`VersionFixer:427`) pone
`father = viewpoint` ma **non converte `subViews` né popola le voci reciproche**; nessuna
delle 31 migrazioni successive tocca `subViews` (grep: sole occorrenze `:297-298` e `:1234`,
la prima è il purge dei pointer nulli, la seconda un campione fittizio). Un progetto
sopravvissuto a quel percorso può quindi avere `father` valorizzato e il parent che non lo
elenca in `subViews`.

**Scansione su `father`**: `state.viewelements` (o `idlookup` filtrato su
`className === 'DViewElement'`) confrontando `e.father`. Più lento ma indipendente
dall'opposite; è la stessa disciplina di CLAUDE.md §3.6 (iterare sui backward link, non
sulle collezioni forward). Va scritta con visited set esplicito perché non ha la protezione
di `get_allSubViews`.

**Cicli**: dalla UI **non** sono creabili. `allPossibleParentViews` (`view.tsx:435-448`)
sottrae `allSubViews` e sé stessa dall'insieme di tutte le view, quindi né un discendente né
sé stessa sono offerti; e tutte e tre le superfici usano quella lista. Restano creabili da
console (`windoww.store` / assegnazione diretta sul proxy). Un caso di bordo:
per un **DViewPoint** `get_viewpoint` ritorna sé stesso (`view.tsx:1429`) e `:446`
lo reinserisce dopo il `delete allviews[c.data.id]` di `:444` — quindi la lista di un
viewpoint contiene sé stesso. In `InfoData` è innocuo (i due Select stanno dentro il gate
`{isV && …}` di `:239`), ma `IRIdentityFields` **non ha quel gate**: un DViewPoint che
portasse un `ir` di kind autorabile riceverebbe la barra a cinque tab
(`ViewData.tsx:82-83` calcola `irKind` senza escludere i viewpoint) e con essa l'opzione
"me stesso come parent". Oggi non c'è UI che assegni un `ir` a un viewpoint, quindi il caso
è irraggiungibile, non impossibile.

### A5 — Lettura di stato appena scritto dentro `set_father`

**Non è un problema, ma la forma sicura è comunque quella di calcolare prima.**

`TRANSACTION` (`redux/action/action.ts:210-225`) fa `BEGIN(); await func(); END([])`, e
`BEGIN/END` (`:103-181`) accumulano le azioni in `t.pendingActions`: il `fire()` della
`CompositeAction` avviene **solo** in `FINAL_END`, quando la profondità torna a zero
(`:152-181`). Quindi, **dentro il corpo di `func`, `store.getState()` restituisce sempre lo
stato pre-transazione**: una `get_allSubViews` invocata a metà corpo leggerebbe i `father`
vecchi. Per la cascata questo è esattamente ciò che serve (il sottoalbero da riallineare è
quello *precedente* alla mossa, e i link `father` interni non cambiano), ma dipendere da
quell'ordine è fragile: **calcolare il sottoalbero prima della prima `SetFieldAction`** lo
rende indipendente dalla semantica di batching.

Due dettagli collaterali da tenere presenti in Fase 2:

- `TRANSACTION` è `async` e `set_father` **non la attende** (`view.tsx:1454`, nessun
  `await`, e il metodo ritorna `ret` a `:1493`). Il corpo gira sincrono fino al primo
  `await`, quindi le azioni sono tutte accodate prima del `return`; ma il dispatch avviene
  in una microtask successiva. Dopo `view.father = x` lo store non è ancora aggiornato.
- `get_allSubViews` a `:988` esegue `delete c.data.subViews.clonedCounter`, cioè **muta
  l'oggetto Redux in place** durante una lettura. Non introdotto da noi, ma la cascata lo
  chiamerebbe: da non peggiorare.

---

## Area B — Le superfici UI a HEAD

### B1 — Dove vivono oggi i due Select

`ViewData.tsx` (ultimo tocco `e15eb5081`, 2026-08-06, la commit di R-H) è lo smistatore:

- `:82-83` calcola `irKind` da `view.ir`;
- `:88` costruisce `identity = { viewpoints, readOnly }`;
- `:106-110`: se `irKind` è definito, la barra è quella a cinque tab e **il tab legacy
  `apply-to` non viene proprio costruito** — `InfoData` non è montato;
- `:110-119`: altrimenti barra legacy, `apply-to` → `<InfoData …>`.

Per le view IR i due Select stanno quindi in `irTabs.tsx:107-157` (`IRIdentityFields`,
Name + Viewpoint + Parent view), montato dai tre pannelli di authoring:
`VertexAuthoringPanel.tsx:274`, `RowAuthoringPanel.tsx:280`, `EdgeAuthoringPanel.tsx:466`,
sempre come `{identity && <IRIdentityFields view={view} {...identity} />}` in testa al body
`Applies to`.

`InfoData` **serve ancora** due percorsi: le view **senza `ir`** (incluse le legacy classic
e quelle con `isEdge`) e i **viewpoint** (per i quali il blocco Viewpoint/Parent è escluso
dal gate `{isV && …}` di `:239`). Unico montaggio: `ViewData.tsx:116`. `ViewData` a sua
volta è montato da `Info.tsx:1208` e da `NestedView.tsx:493`.

Conseguenza per la Fase 2: i due Select **vivono in due file**, con markup e binding
identici per costruzione (R-H li ha ricollocati verbatim, come il commento
`irTabs.tsx:99-105` dichiara). Toccarne uno solo lascia il difetto vivo sull'altra metà
delle view.

### B2 — `ViewProperties.tsx` a HEAD

Vedi §Rettifiche. Riassunto: un solo Select su `father` (`:121-134`), la lista di parent con
filtro per viewpoint a `:70-73`, il write a `:126` con la variante `undefined` che rompe
`set_father` (A1). Montato solo da `WorkbenchProperties.tsx:58`, che nessuno importa.

### B3 — Read-only sulle default view

Catena unica e verificata:

1. `ViewData.tsx:53` — `const readOnly = !debug && Defaults.check(view.id)`, con `debug` da
   `state.debug` (`:277`).
2. `Defaults.check` (`common/Defaults.ts:101-103`) è una **whitelist statica di id**:
   `defaultViewsMap || defaultViewPointsMap || defaultTypesMap`, costruite da
   `Defaults.views/viewpoints/types` (`:89-93`). Sono i `Pointer_View*`.
3. `readOnly` entra in `identity` (`ViewData.tsx:88`) → `IRIdentityFields` → prop
   `readOnly` di `Input`/`Select` (`irTabs.tsx:120,130,147`), stessa cosa in
   `InfoData.tsx:157,304,321`.
4. In `Input.tsx` la prop blocca sia `onChange` (`:193`) sia `confirmValue` (`:248`).

Rete di sicurezza indipendente: `Input.tsx:158-161` — se la prop `readOnly` è `undefined`,
l'`Input` si auto-gattiglia con `Defaults.check(data?.id)`. Quindi anche un controllo nuovo
che dimenticasse di propagare `readOnly` resterebbe read-only sulle default (ma **non** se
gli si passa `readOnly={false}` esplicito).

Ne segue che la prova A-7 del 2026-08-06 (Name/Viewpoint/Parent in sola lettura sulle
default) è garantita dalla whitelist di id, non da una proprietà del dato. Con D-4-1 il
Viewpoint diventa una riga di testo e il problema si estingue per quel controllo; il Select
"Parent view" deve continuare a ricevere `readOnly`.

### B4 — Da dove viene la lista dei parent, e se filtra già per viewpoint

**Il filtro esiste già, identico nelle tre superfici**:

```
InfoData.tsx:326       view.allPossibleParentViews.filter(v => v.viewpoint?.id === vpid)
irTabs.tsx:152         (view as any).allPossibleParentViews.filter(v => v.viewpoint?.id === vpid)
ViewProperties.tsx:72  lview.allPossibleParentViews.filter(v => v.viewpoint?.id === viewpointId)
```

`get_allPossibleParentViews` (`view.tsx:435-448`): tutte le view del progetto, meno i propri
discendenti, meno sé stessa, **più la propria radice reinserita esplicitamente** a `:445-446`.
La radice supera il filtro perché per un `DViewPoint` `get_viewpoint` ritorna sé stesso.

**Il vincolo di co-appartenenza di D-4-2 è quindi già soddisfatto dalla lista attuale**: la
Fase 2 non deve costruire un filtro nuovo, deve togliere il Select "Viewpoint" e lasciare
questo unico writer. L'opzione `{ value: '', label: 'None' }` in testa (`:326` / `:152`) è
invece da decidere: come da A1, "None" azzera il denormalizzato e fa sparire la view da
entrambi i renderer.

**Attenzione a quale `viewpoint` si legge.** In tutte e tre le superfici `vpid` viene da
`view.viewpoint` **L-layer**, cioè `get_viewpoint` (`view.tsx:1427-1437`), che **risale la
catena `father`** e non legge il denormalizzato. D-4-1 chiede invece una riga read-only che
mostri `d.viewpoint` (il campo persistito, quello che il resolver IR usa davvero). Se in un
progetto i due divergono — ed è esattamente lo scenario che la cascata esiste per impedire —
la riga read-only e il filtro della lista racconterebbero due storie diverse. Da scegliere
una sola fonte (vedi Q2).

Trappola aggiuntiva di `get_viewpoint`: se `father` è assente, `:1429` ritorna **la view
stessa** come proprio viewpoint. Una view orfana si dichiara viewpoint di sé.

### B5 — Superfici candidate per "Move to viewpoint" (D-4-3)

Nessuna UI di "sposta in…" esiste oggi nel repo (grep su `move to` / `moveTo`: solo il
comando `M` dei path SVG in `InteractivePathCanvas.tsx`). Le superfici **già presenti** su
cui la voce potrebbe atterrare, elencate senza sceglierne una:

1. **Slot azioni della riga view nel Tree View** —
   `TreeViewContent.tsx:1226-1243`: `actions` è un frammento di bottoni hover-reveal, oggi
   Duplicate (`bi-copy`, `:1229-1235`) e Delete (`bi-trash`, `:1236-1242`), passato a
   `EntityRow` come prop `actions` (`:1259`). Aggiungere una terza icona è meccanico. Nota:
   le righe view **non hanno context menu** — `useClassifierContextMenu` (`:440-497`) è
   cablato solo su classi, package e metamodelli (`:796`, `:888`, `:1052`).
2. **Il body `Applies to` stesso** — un bottone secondario sotto la riga read-only del
   viewpoint, dentro `IRIdentityFields` (`irTabs.tsx:107-157`) e nel corrispondente blocco
   di `InfoData.tsx:297-328`. È l'unico posto che copre **entrambe** le nature (IR e
   non-IR) con un solo intervento, e sta accanto all'informazione che l'azione modifica.
3. **Header della card Properties** — `ViewData.tsx:206-213` porta già una `CommandBar` con
   Back + Help, portalata in `.properties-panel-header__actions` (`:202-204`). Ospita azioni
   di livello elemento, non di campo.
4. **Riga della view in `NestedView`** — `NestedView.tsx:240-266` ha una zona
   `view-entry__right` con controlli per view; è la lista legacy dei viewpoint.

Non candidabili: `ViewProperties.tsx` (morto), context menu delle view (inesistente).

---

## Area C — I dati reali

### C1 — Cosa è misurabile da Claude Code, e cosa no

**Il censimento del 2026-08-05 non è riproducibile da qui.** Quel documento dichiara in
testa: corpus = `localStorage['projects']` della sessione di sviluppo, misura *"eseguita in
chat di progetto, non da Claude Code"*. Non esiste nel repo alcun blob di progetto reale:
`find` su `*.json`/`*.jjodel` restituisce solo config, benchmark e artefatti di build.

L'unico corpus locale sono i sei blob di `frontend/src/examples/`, che lo stesso censimento
del 2026-08-05 ha declassato a **codice morto** ("quei quattro blob non sono importati da
nessun file del repo"). Riverificato a HEAD: nessun importatore di `examples/index.ts`,
`stateExamples`, né di `examples/StateMachine`. Li ho misurati lo stesso, come unico dato
disponibile, dichiarandone il limite.

Script usato (read-only, in scratchpad, non committato): estrae il JSON dal literal, e per
ogni `DViewElement`/`DViewPoint` classifica `father`, la profondità della catena, lo stato
di `viewpoint` e la coerenza dell'opposite.

| blob | DViewPoint / DViewElement | `father` → VP | `father` → view | `father` assente | prof. max | viol. co-appartenenza |
|------|---------------------------|---------------|-----------------|------------------|-----------|-----------------------|
| `first.ts` | 3 / 22 | 0 | 0 | 22 | 0 | 0 |
| `second.ts` | 2 / 19 | 0 | 0 | 19 | 0 | 0 |
| `sequence.ts` | 2 / 22 | 0 | 0 | 22 | 0 | 0 |
| `shapes.ts` | 2 / 19 | 0 | 0 | 19 | 0 | 0 |
| `statechartplus.ts` | 3 / 22 | 0 | 0 | 22 | 0 | 0 |
| `statechartplus_old.ts` | 1 / 22 | 0 | 0 | 22 | 0 | 0 |
| `conflictsimulation.ts` | 2 / 23 | 0 | 0 | 23 | 0 | 0 |

Lettura: **tutti e sei precedono l'introduzione stessa di `father`** (`state.version` è
`undefined`, il campo non compare su nessun elemento) e portano `subViews` come **array** di
pointer, non come dizionario. Sono cioè il corpus che la migrazione `2.2 -> 2.201`
(`VersionFixer:427`) è nata per convertire: dopo di essa avrebbero `father = viewpoint`,
gerarchia piatta, profondità 1, zero view figlie di view — e, come detto in A4, l'opposite
`subViews` **non** ricostruito.

**Zero evidenza di gerarchie annidate; zero evidenza di violazioni preesistenti.** Ma è
evidenza su un corpus morto e obsoleto: **non dice nulla sui progetti reali di Alfonso**.

### C2 — Conseguenza per la Fase 2

Sì, dichiarato esplicitamente: **nessun dato disponibile a Claude Code contiene una
gerarchia di view annidata**, quindi la Fase 2 deve **fabbricare** il caso di test della
cascata (viewpoint A con view radice → figlia → nipote, move di "figlia" verso il viewpoint
B, verifica che `viewpoint` di figlia *e* nipote sia B e che gli indici IR e classico li
vedano sotto B).

Se serve il numero vero sui progetti reali, va rifatto in browser come nel 2026-08-05. Lo
snippet minimo, da incollare in console con un progetto caricato — read-only, nessuna
scrittura:

```js
(() => {
  const idl = windoww.store.getState().idlookup, ve = [];
  for (const k in idl) { const e = idl[k];
    if (e && (e.className === 'DViewElement' || e.className === 'DViewPoint')) ve.push(e); }
  const by = Object.fromEntries(ve.map(e => [e.id, e]));
  let toVP = 0, toView = 0, none = 0, dangling = 0, viol = 0, maxd = 0, oppMissing = 0;
  for (const v of ve.filter(e => e.className === 'DViewElement')) {
    const f = v.father;
    if (!f) none++; else if (!by[f]) dangling++;
    else if (by[f].className === 'DViewPoint') toVP++; else toView++;
    if (f && by[f] && by[f].viewpoint !== v.viewpoint) viol++;
    if (f && by[f] && !(v.id in (by[f].subViews || {}))) oppMissing++;
    let d = 0, cur = v, seen = new Set();
    while (cur?.father && !seen.has(cur.id)) { seen.add(cur.id); const n = by[cur.father]; if (!n) break; d++; cur = n; }
    if (d > maxd) maxd = d;
  }
  console.table({ toVP, toView, none, dangling, coMembershipViolations: viol, maxDepth: maxd, oppositeMissing: oppMissing });
})()
```

---

## Dipendenze e rischi

**Chi legge il `viewpoint` denormalizzato** — è il raggio d'azione del difetto che la
cascata chiude:

- `irResolveCore.ts:84` (firma dell'indice) e `:113` (costruzione dell'indice per
  metaclasse). Una view con `viewpoint` stantio **non entra nell'indice** del viewpoint
  giusto e non renderizza in editor-v2.
- `selectors.ts:553-559` — lo scoring classico risolve `dview.viewpoint` per decidere
  `VP_Explicit / VP_Default / VP_Decorative / VP_MISMATCH`. Con `viewpoint` `undefined`,
  `dvp.id` a `:556` solleva TypeError.
- `view.tsx:1512` e `:1559` — `updateSize` delega la persistenza della size al viewpoint
  (`c.proxyObject.viewpoint`, via catena `father`).
- `DV.tsx:1730,1776` — nome del viewpoint nella default view.

**Perimetro reale della cascata.** I `father` *interni* al sottoalbero non cambiano mai: la
cascata deve riscrivere **solo `viewpoint`** sui discendenti, e solo quando cambia. Il conto
delle azioni è quindi *1 + 1 + 2 + N* (`father`, `viewpoint` del nodo, i due `subViews`, più
N discendenti), tutte `SetFieldAction`, tutte nella stessa TRANSACTION pura. Su un
sottoalbero grande resta una singola `CompositeAction`, quindi un solo dispatch e un solo
passo di undo — coerente con la semantica attuale di `set_father`.

**Rischio TRANSACTION**: nessuno di tipo §3.3 (nessun creatore). L'unico accorgimento è
calcolare il sottoalbero **prima** della prima scrittura (A5).

**Rischio opposite**: se la cascata enumera via `subViews` eredita l'eventuale incompletezza
descritta in A4; se enumera via scansione di `state.viewelements` su `father` è immune ma
diverge dal delete ricorsivo, che usa `subViews`. Scegliere consapevolmente (Q1).

**Rischio invisibile in dev**: `set_father` non ha test. `find` su `__tests__` non trova
nulla su view/father; il solo test che nomina `father` in area view è
`redux/__tests__/versionfixer_2227_migration.test.ts:132`, che è sui `DValue` M1. Una
regressione della cascata non verrebbe intercettata da nulla.

---

## Regole di uscita — verdetto

| # | Condizione | Esito |
|---|-----------|-------|
| 1 | `set_father` accoppiato al sync layer / in TRANSACTION tale da portarlo in critical zone | **NON scatta.** TRANSACTION di sole `SetFieldAction` (§3.3 SAFE), zero riferimenti a view/`father` in `useJjomSync.ts`. Layer Impact Report non obbligatorio per §3.2; resta la scelta di produrlo comunque (Q5) |
| 2 | Esiste un call site che la cascata romperebbe | **NON scatta.** Nove writer censiti (A2): quattro avvantaggiati, cinque indifferenti, nessuno dipendente dalla semantica non-cascata |
| 3 | `subViews` inaffidabile come opposite | **SCATTA, in forma condizionata.** Nessun disallineamento osservato nel codice vivo (i tre writer sono coerenti), ma: (a) due setter morti (`set_SubViews`, `setSubViewScore`) lo scriverebbero senza toccare `father`; (b) `NestedView.tsx:254,438` lo scrive via `_defaultSetter`, fuori da ogni setter di dominio; (c) i progetti migrati da pre-2.201 possono avere `father` valorizzato e `subViews` non ricostruito (`VersionFixer:427` non lo popola, nessuna migrazione successiva lo fa) |
| 4 | Violazioni preesistenti di co-appartenenza in quantità | **NON misurabile.** Zero violazioni sul corpus locale, ma il corpus è morto e pre-`father` (C1). Sui progetti reali il dato non è raggiungibile da Claude Code; serve lo snippet in browser |

---

## Domande aperte per Alfonso

**Q1 — Indice del sottoalbero.** La cascata enumera i discendenti via `subViews`
(coerente col delete ricorsivo, già protetto dai cicli, ma esposto all'opposite incompleto
dei progetti legacy) o via scansione di `state.viewelements` su `father` (immune, coerente
con la disciplina §3.6, ma introduce un secondo modo di dire "figli di una view")?
Raccomandazione: **scansione su `father`**, con visited set esplicito, e una nota nel codice
che spiega perché non usa `subViews`.

**Q2 — Quale `viewpoint` mostra la riga read-only di D-4-1.** Il denormalizzato
`d.viewpoint` (ciò che il resolver IR usa davvero, quindi la verità operativa) o
`view.viewpoint` L-layer (la risalita di `father`, che è ciò che le tre superfici usano oggi
per filtrare la lista dei parent)? Se non sono la stessa cosa, la riga e la lista si
contraddicono. Raccomandazione: **`d.viewpoint`**, perché è ciò che decide se la view
renderizza; ed è anche la scelta che rende la divergenza *visibile* invece che mascherata.

**Q3 — L'opzione "None" del Select Parent view.** Oggi porta `father = ''` e, per
`view.tsx:1456`, azzera `viewpoint`: la view sparisce dall'indice IR e fa esplodere lo
scoring classico. Con D-4-2 ("parent = radice del viewpoint o view dello stesso viewpoint")
l'opzione "nessun parent" è concettualmente **"la radice"**, non "niente". Si rimuove
"None", o si mantiene rimappandola sulla radice del viewpoint corrente?

**Q4 — `ViewProperties.tsx`.** D-4-5 chiede la stessa cura, ma il file è irraggiungibile a
HEAD (host orfano, §Rettifiche 2). Tre opzioni: (a) allinearlo comunque, per non lasciare il
pattern sbagliato in giro se un giorno la workbench torna; (b) lasciarlo intatto e
registrare la cosa; (c) trattare la morte della directory
`components/editors/viewpoint/` come voce separata. Nota che il suo write
(`e.target.value || undefined`) è quello che **solleva TypeError** in `set_father`: se resta,
resta anche quel difetto.

**Q5 — Layer Impact Report.** Formalmente non richiesto (regola di uscita 1 non scatta:
`view.tsx` non è tra i file di §3.1/§3.2). La Fase 2 tocca però L-layer condiviso e il campo
persistito che pilota due renderer. Lo produco lo stesso o no?

**Q6 — Il difetto del peso in `set_father:1466-1489`** (A1, `indexOf("Copy") === -1` truthy):
si corregge dentro la stessa slice, in un commit separato, o si registra come voce a sé? È
fuori dal perimetro dichiarato della voce 4, ma sta nelle stesse venti righe che la Fase 2
riscrive.

**Q7 — Collocazione di "Move to viewpoint"** (D-4-3): la §B5 elenca quattro superfici
esistenti. La 2 (dentro il body `Applies to`) è l'unica che copre view IR e non-IR con un
intervento solo; la 1 (slot azioni del Tree View) è la più economica ma vale solo lì.

---

# Addendum — seconda sessione del 2026-08-07

**Metodo**: R-E/E-1 (2026-08-05). Il report sopra esisteva già al path indicato dal prompt:
non è stato riscritto né modificato. È stato letto per intero e verificato punto per punto
sul codice a HEAD; qui in coda stanno **solo** le cose non coperte.

**HEAD invariato**: `7450eb256`, lo stesso su cui il report è stato scritto — quindi gli
ancoraggi `file:riga` sono attesi validi, e la verifica serviva a confermarli, non a
riallinearli. `git status --short` riporta un solo untracked: questo stesso file.

## Esito della verifica punto per punto

| Punto | Esito |
|-------|-------|
| A1 | **Confermato integralmente**, testo per testo: `view.tsx:1445-1493`, TRANSACTION di sole `SetFieldAction`, ordine father → viewpoint → `-=` → `+=`. Confermato anche il difetto del peso: `let copyPos = name.indexOf("Copy")` a `:1467` con `if (copyPos)` a `:1471`, e la sovrascrittura a `:1489`. Confermato `classes.ts:1446` (`if (!ptr) { return ptr as any; }`), da cui discendono i due comportamenti di "None"/`undefined` |
| A2 | **Confermato**, con due integrazioni (N4, N5) e una lacuna colmata (N6) |
| A3 | **Confermato**, con un writer vivo in più (N4) |
| A4 | **Confermato**: `get_allSubViews` è ciclo-safe (`view.tsx:996`, `if (idmap[vid]) continue`); `allPossibleParentViews` sottrae discendenti e sé stessa e reinserisce la radice (`view.tsx:435-448`). Integrazione sui cicli: N7 |
| A5 | **Confermato**: `TRANSACTION` a `action.ts:210` fa `BEGIN(); await func(); END([])`, `FINAL_END` accumula in `t.pendingActions` e fa `ca.fire()` solo a profondità 0. `set_father` non attende la promise |
| B1 | **Confermato**: `ViewData.tsx:82-83` (`irKind`), `:88` (`identity`), `:106-110` (barra IR, `InfoData` non montato), `:116` (`InfoData` per le view senza `ir` e per i viewpoint). `InfoData.tsx:239` è il gate `{isV && …}` |
| B2 | **Confermato**: `ViewProperties.tsx` è importato solo da `WorkbenchProperties.tsx:5`, e `WorkbenchProperties` non ha importatori (unica occorrenza esterna: il commento in `properties/ViewpointProperties.tsx:5`) |
| B3 | **Confermato**: `Defaults.check` è `common/Defaults.ts:101-103`, whitelist di id; `Input.tsx:159-161` è l'auto-gate quando la prop manca, `:193` e `:248` i due blocchi, `:254` il fallback `data[field] = …`. `proxy.ts:466-467` è l'alias `parent → father` |
| B4 | **Confermato**: il filtro `v.viewpoint?.id === vpid` è già presente e identico nelle tre superfici (`InfoData.tsx:326`, `irTabs.tsx:152`, `ViewProperties.tsx:72`), e `vpid` viene ovunque dall'L-layer (`irTabs.tsx:109-110`, `InfoData.tsx:79-80`) |
| B5 | **Confermato**, e ora **chiuso**: le quattro superfici sono l'elenco completo (N8) |
| C1 | **Confermato** nella sostanza, con una correzione di conteggio (N10) |
| C2 | **Confermato**, con una via pratica in più per fabbricare il fixture (N11) |

Nessuna rettifica sostanziale: il report regge. Segue quello che non copriva.

## N1 — `set_viewpoint` esiste ed è un no-op dichiarativo (e la trappola che ne discende)

`view.tsx:1441-1444`:

```
1441  public set_viewpoint(v, c, manualDview?, preserveOrder = false): boolean {
1442      Log.exDevv('setViewpoint() should not be called, call view.setFather(viewpoint) instead');
1443      return true;
1444  }
```

Due conseguenze, nessuna delle due nel report.

**(a) D-4-1 non è una decisione nuova, è l'allineamento della UI a una regola che il modello
già dichiara.** Il codebase ha già eletto `father` a writer unico e ha lasciato in piedi
`set_viewpoint` come dead-end esplicito con messaggio. La riga read-only di D-4-1 e la
rimozione del Select "Viewpoint" fanno esattamente ciò che quel `Log.exDevv` chiede da
sempre. Utile citarlo nel prompt di Fase 2: è l'argomento più forte a favore di D-4-1, e
viene dal codice, non da noi.

**(b) Trappola concreta per la cascata di D-4-4.** La cascata **non deve** riallineare i
discendenti con l'assegnazione via proxy `child.viewpoint = <vp>`: quella rotta finisce in
`set_viewpoint` (`proxy.ts:474-478` cerca `set_` + propKey, e il metodo esiste), che
**logga e ritorna `true` senza scrivere nulla**. Silenziosamente inerte, con `ret === true`
a mascherare il fallimento. La cascata deve emettere
`SetFieldAction.new(childId, 'viewpoint', vpid, '', true)` diretta, come già fa `:1456` per
il nodo mosso.

## N2 — Invalidazione dei due renderer: già corretta, niente da aggiungere in Fase 2

Il report elenca *chi legge* `viewpoint`, ma non verifica se quei consumatori **reagiscono**
a una sua riscrittura. Verificato: **sì, entrambi**, e senza bisogno di hook nuovi.

- **IR (editor-v2)** — `irResolveCore.ts:76-89` `computeIRSignature` costruisce la firma
  iterando `state.viewelements` e saltando `d.viewpoint !== vp` (`:84`); `getIRIndex`
  (`:99-113`) è memoizzato su quella firma. Una view che entra nel viewpoint attivo aggiunge
  una parte alla firma, una che ne esce la toglie: in entrambi i casi la firma cambia e
  l'indice si ricostruisce. Coerente anche il caso senza `ir`: quelle view non entrano nella
  firma (`:86`) e non entrano nell'indice (`:115`).
- **Classico** — `selectors.ts:553-556` ricalcola `tnv.viewPointMatch` da `dview.viewpoint`
  **a ogni passata** del ciclo su `allViews` (non è memoizzato), e `:561`
  (`if (!needsorting && (oldVpMatch !== tnv.viewPointMatch)) needsorting = true`) forza il
  riordino quando la classificazione cambia.

Quindi la cascata è sufficiente da sola: scrivere `viewpoint` sui discendenti li fa comparire
sotto il viewpoint giusto in entrambi i renderer, senza toccare cache o segnali.

## N3 — I tre indici di appartenenza, e perché la cascata è necessaria *e* sufficiente

Sapere quale superficie usa quale indice spiega esattamente il perimetro della cascata. Ne
esistono tre, non due:

| # | Indice | Chi lo usa |
|---|--------|-----------|
| 1 | `d.viewpoint` (denormalizzato) | `irResolveCore.ts:84,113` (firma + indice IR); `selectors.ts:553-559` (classificazione VP nello scoring classico) |
| 2 | `subViews` (opposite, ricorsivo) | Tree View sidebar: `TreeViewContent.tsx:2290,2312` (`buildSubViewTree`), `:1385`, `:1721`; `NestedView.tsx:81` (`getSubElements`); `Tree.tsx:241`; `lastViewpoint.ts:170`; scoring classico per il boost del parent (`selectors.ts:421-422`) e `Selectors.getViewIdFromName` (`:406`) |
| 3 | catena `father` (L-layer `get_viewpoint`, `view.tsx:1427-1437`) | i tre filtri della lista parent (B4); `updateSize` (`view.tsx:1512,1559`) |

In un move cross-viewpoint del solo nodo N: i `father` **interni** al sottoalbero non
cambiano, quindi l'indice 2 resta corretto per costruzione (i discendenti restano sotto N, e
N si sposta con tutto ciò che gli pende sotto) e l'indice 3 pure (la catena risale a N e da N
al nuovo viewpoint). **Solo l'indice 1 resta indietro sui discendenti** — ed è quello che
decide se una view renderizza. La cascata di D-4-4 tocca quindi esattamente e solo
`viewpoint` sui discendenti: è il minimo che riporta i tre indici a concordare, ed è anche il
massimo (scrivere `subViews` o `father` dei discendenti sarebbe sbagliato, non
conservativo).

Corollario per Q2: **dopo** la cascata i due candidati della riga read-only (`d.viewpoint` e
`view.viewpoint` L-layer) coincidono sempre. Divergono solo nei progetti che la cascata non
ha mai attraversato — cioè esattamente i casi che si vuole rendere visibili.

## N4 — Quarto writer vivo di `subViews`, non censito in A3

A3 elenca tre writer vivi (creazione, `set_father`, delete) più il canale grezzo di
`NestedView`. Ne manca uno **vivo e non banale**:

`LViewElement.updateDefaultView` (`view.tsx:1751-1758`), riga `:1758`:

```
newView.subViews = {...newView.subViews, ...v.subViews};
```

Rigenera una **default view** dal blocco di fabbrica e vi fonde i `subViews` salvati.
Mutazione D grezza su `s.idlookup[v.id]`, fuori da ogni azione e da ogni setter di dominio.
Call site vivi: `VersionFixer.tsx:144` (durante il caricamento progetto, per ogni default) e
`NestedView.tsx:399` (bottone di rigenerazione nella lista legacy).

Impatto sulla cascata: **nullo nel caso normale** — la fusione preserva le chiavi esistenti,
quindi non perde figli. Ma unisce anche le chiavi *di fabbrica*, cioè può reintrodurre in
`subViews` voci che un utente aveva staccato via `set_father`, senza toccare il `father`
corrispondente. È il quarto ingresso della regola di uscita 3, e il solo che agisce in
automatico al caricamento del progetto.

## N5 — Seconda migrazione che scrive `father`, non censita in A2

Oltre a `2.2 -> 2.201` (`VersionFixer.tsx:427`, `c.father = c.viewpoint`), scrive `father`
anche la **FASE C** di `2.226 -> 2.227` (`:1167`):

```
if (typeof e.father === 'string' && reparent.has(e.father)) e.father = reparent.get(e.father);
```

Gira su **tutto** `idlookup`, quindi anche sui `DViewElement`. La mappa `reparent` è però
costruita solo da dedup di slot M1 (`:1083`, popolata a `:1119` con `loser.id → survivor.id`
di `DValue`), quindi in pratica nessuna view la intercetta. Registrato per completezza del
censimento: è una riscrittura di `father` che **non** mantiene né `viewpoint` né `subViews`,
e se un domani la mappa includesse view diventerebbe un writer da cascata.

## N6 — JjScript: zero writer (domanda esplicita del prompt, non coperta dal report)

Il prompt A2 chiedeva conto anche di JjScript. Verificato: in tutto `jjscript/` non esiste
alcuna scrittura di `father`, `viewpoint` o `subViews` su view. Le sole occorrenze sono
**letture M1** in `jjscript/executor/commands/eval.ts:773-781`, che risalgono
`rawObj.__raw.father` per trovare il `DValue` proprietario e poi `fatherData.father` per
l'oggetto. Nessun impatto sulla voce 4.

## N7 — Cicli: `get_allSubViews` è protetto, `get_viewpoint` e `get_fatherChain` non lo sono

Il report registra che i cicli non sono creabili dalla UI (vero: `allPossibleParentViews`
sottrae i discendenti) e che `get_allSubViews` è ciclo-safe. Manca la conseguenza dell'altro
lato: le due risalite **non** hanno visited set.

- `get_fatherChain` (`view.tsx:1413-1422`): `while (current) { ret.push(current); current = current.father; }`
- `get_viewpoint` (`view.tsx:1427-1437`): `while (curr) { let prev = curr.father; if (!prev) return curr; curr = prev; }`

Con un ciclo, entrambe **non ritornano**: non è un dato sbagliato, è il tab che si pianta —
e `get_viewpoint` è nel percorso di ogni filtro della lista parent e di `updateSize`. Se la
Fase 2 introduce una guardia anti-ciclo, il posto giusto è il momento della scrittura
(`set_father`, che ha già il sottoalbero in mano per la cascata: rifiutare il move se il
nuovo parent è nel sottoalbero costa zero in più), non le risalite.

## N8 — B5 chiuso: non esiste nessun drag & drop su view

Verificato per escludere che una superficie di "move" esistesse già di fatto:
`TreeViewContent.tsx` non contiene **nessuna** occorrenza di `draggable`, `onDrop`,
`onDragStart`, `onDragOver`, `dataTransfer`. Le uniche `draggable` del repo fuori da canvas
ed editor-v2 sono `FeaturesPalette.tsx:65` (elementi di metamodello) e la prop `draggable`
delle view (`Measurable.tsx`, `ViewProperties.tsx:175`) — che è un attributo *della* view
renderizzata, non un gesto sull'albero. Le quattro superfici di B5 sono quindi l'elenco
completo, e nessuna riparenta view oggi.

## N9 — Copertura a test: zero, confermato per grep diretta

`grep -rl "set_father\|subViews" --include="*.test.ts" --include="*.test.tsx"` non restituisce
**nessun file**. Il rischio segnalato dal report ("una regressione della cascata non verrebbe
intercettata da nulla") è confermato nella forma più forte: non c'è nemmeno un test che
nomini `subViews`.

## N10 — Correzione minore a C1: i blob sono sette, non sei

La prosa di C1 dice "i sei blob di `frontend/src/examples/`" e "in tutti e sei", ma la
tabella ne elenca sette e `ls examples/*.ts` ne conferma sette
(`first`, `second`, `sequence`, `shapes`, `statechartplus`, `statechartplus_old`,
`conflictsimulation`, più `index.ts`). La misura e la conclusione non cambiano: zero
gerarchie annidate su tutti e sette. Confermata anche l'assenza di importatori esterni.

## N11 — C2: il fixture della cascata è fabbricabile dalla UI esistente

Il report conclude che la Fase 2 deve fabbricare il caso di test. Precisazione utile: **non
serve la console**. Il Select "Parent view" offre già `allPossibleParentViews` filtrate per
viewpoint corrente, cioè **qualsiasi view dello stesso viewpoint**, quindi la gerarchia si
costruisce con la UI di oggi:

1. viewpoint A, tre view R, F, N (una qualsiasi, anche IR);
2. su F: Parent view → R (profondità 2);
3. su N: Parent view → F (profondità 3);
4. il move da testare: F verso il viewpoint B, con verifica che `d.viewpoint` di **F e N**
   diventi B, che l'indice IR le veda sotto B (`irResolveCore.ts:113`) e che lo scoring
   classico le classifichi su B (`selectors.ts:553-559`).

Con il codice attuale il passo 4 non è nemmeno esprimibile (il Select "Viewpoint" riparenta
alla radice di B e stacca F da R): il fixture serve a misurare la Fase 2, non lo stato
attuale.

## Domanda aperta aggiuntiva

**Q8 — La cascata gira sempre o solo quando il viewpoint cambia?** La forma minima riallinea
i discendenti solo quando il nodo mosso cambia viewpoint. La forma "sempre" (per ogni
discendente, scrivi `viewpoint` **se diverso** da quello del nodo, a ogni reparent anche
intra-viewpoint) costa una scansione già fatta e **sana in modo lazy** le divergenze
preesistenti del sottoalbero toccato — comprese quelle che i progetti legacy possono avere
ereditato da `2.2 -> 2.201` (che pone `father = viewpoint` senza ricostruire `subViews`,
A4). È la risposta economica alla regola di uscita 4: nessun VersionFixer nuovo, la
guarigione avviene quando l'utente tocca il ramo. Da ratificare, perché cambia il predicato
di uscita anticipata di `set_father`.

## Regole di uscita — verdetto dopo la verifica

Invariato rispetto al report, con un'integrazione:

- **1 (sync layer)**: NON scatta, **riconfermato per grep diretta** —
  `useJjomSync.ts` non nomina `DViewElement`/`LViewElement`/`viewpoint`; le sole occorrenze
  di "father" sono tre commenti sulla reference `father` di Families.ecore (`:508`,
  `:655-656`, `:942`). Nessun Layer Impact Report obbligatorio; resta aperta Q5.
- **2 (call site rotto dalla cascata)**: NON scatta. Nessuno dei writer aggiunti da questo
  addendum (N4, N5, N6) dipende dalla semantica non-cascata.
- **3 (`subViews` inaffidabile)**: **scatta, e con un ingresso in più** rispetto ai tre del
  report: `updateDefaultView` (N4), che agisce in automatico al caricamento del progetto.
  Rafforza la raccomandazione di Q1 (enumerare via scansione su `father`).
- **4 (violazioni preesistenti)**: NON misurabile da qui, invariato. Q8 propone la risposta
  che non richiede di misurarle prima.
