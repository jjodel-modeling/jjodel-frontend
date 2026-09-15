# Discovery READ-ONLY: censimento delle view legacy e destino runtime di `irLegacyClassic`

**Data**: 2026-08-04. Sessione **read-only** su `/Users/alfonso/jjodel`, branch `alfonso-frontend-jjtl`, HEAD `79a0d90c2`. Nessuna modifica a file `.ts`/`.tsx`/`.scss`. Uniche scritture nel repo: questo report + l'entry in `docs/claude-code-log.md`. Lo script di censimento vive fuori dal repo (scratchpad di sessione) e **non è stato committato**.

**Documento prompt**: 2026-08-04 15:38.

**Stato del working tree all'avvio** (`git --no-optional-locks status`): **pulito, indice vuoto**. Il commit di igiene docs che il prompt segnalava come «preparato ma non eseguito» risulta **già eseguito** (`c43a296a3 docs: rehydration discovery, log rotation, mandatory report commits`, seguito da `79a0d90c2`); `_finish.sh` è **assente** dalla root. La condizione di stop prevista dal prompt («se l'indice risulta popolato, fermarsi») **non si è verificata**.

---

## Obiettivo

Stabilire se la perdita di notazione sui progetti salvati prima del bump `2.226` sia un problema **teorico** (tutti i progetti reali cadono nel secchio 1, indolore per costruzione) o se serva una strategia esplicita per il secchio 3. Non propone soluzioni: produce numeri e catene di codice.

**Esito in una riga**: **non è teorico.** Sui 4 blob raggiungibili dalla UI, **81 view su 85 cadono nel secchio 3**; dopo la rigenerazione dei default operata da `updateDefaultView` **ne sopravvivono 24**, di cui **13 sono template genuinamente autorati a mano** (immagini di sfondo, bottoni, forme condizionali). Nessuna di esse ha più un motore che la interpreti, e **nessun segnale lo comunica all'utente**.

---

## File letti (path completi)

**Migration e persistenza**: `frontend/src/redux/VersionFixer.tsx` (`:105-156` pipeline `update`, `:614-691` migration 2.211→2.212 e 2.213→2.214, `:915-985` 2.222→2.223 e 2.223→2.224, `:994-1040` 2.224→2.225 e **2.225→2.226**, indice completo delle 31 migration), `frontend/src/utils/defaultViewTemplate.ts` (`:16-200`, integrale sulle costanti esportate), `frontend/src/view/viewElement/view.tsx` (`:200-215` dichiarazione dei campi, `:1730-1775` `updateDefaultView`), `frontend/src/common/Defaults.ts` (`:1-45`, `:89`, `:102`).

**Risoluzione e rendering**: `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (`:94-207` costruzione dell'indice), `irResolve.ts` (152, integrale), `irDefaults.ts` (`:112-143`, `isMigratedDefaultView`), `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (`:50-90`, `:377-440`), `frontend/src/components/editor-v2/nodes/ClassNode.tsx` (`:410-460`), `frontend/src/components/editor-v2/viewpoint/ViewpointRenderer.tsx` (31, integrale), `frontend/src/components/editor-v2/types.ts` (`:125`).

**Authoring**: `frontend/src/components/editors/views/ViewData.tsx` (249, integrale).

**Corpus**: `frontend/src/examples/` — `index.ts`, `first.ts`, `second.ts`, `sequence.ts`, `statechartplus.ts`, `conflictsimulation.ts`, `shapes.ts`, `statechartplus_old.ts`, `examples/` (sottocartella duplicata), `StateMachine/index.ts` (ispezione della sola forma).

**Documenti**: `CLAUDE.md`, `docs/claude-code-log.md`, `docs/discovery/discovery_2026-08-04_tab_map_authority_triage.md` (§1.0, §1.1, §2.1 — riusato per l'Area C invece di rifare il lavoro).

**Critical zone**: `useJjomSync.ts` e `portDistribution.ts` **non sono stati letti**. Il tracciamento non li ha mai raggiunti: la catena di rendering delle view legacy si chiude dentro `ObjectNode`/`ClassNode`.

---

# Area B — Destino runtime dei tre secchi

*(svolta per prima, come da procedura: è la più economica e ridimensiona le altre due)*

## B.1 — La migration a HEAD, e il quinto secchio che il prompt non nomina

`VersionFixer.tsx:1007-1040`, metodo `['2.225 -> 2.226']`. Predicato di classificazione, verbatim (`:1010-1016` e `:1017-1035`):

```
const isKnownDefault = (jsx: string): boolean =>
    jsx === DEFAULT_VIEW_JSX_STRING
    || jsx === DEFAULT_VIEW_JSX_V2_3_LEGACY
    || jsx.includes(V2_3_TO_V3_DETECT_MARKER)
    || jsx.includes(V2_2_TO_V2_3_DETECT_MARKER)
    || jsx.includes(LEGACY_PLACEHOLDER_MARKER)
    || jsx.includes('jjodel-default-view');
…
if (e.ir !== undefined || e.irLegacyClassic) continue;                          // :1022 idempotenza
if (jsx.includes(CLASSIC_OBJECT_VIEW_MARKER) || jsx.includes(CLASSIC_SINGLETON_VIEW_MARKER)) {
    e.ir = { ...defaultObjectViewIR(), migratedFrom: 'classic-default' };       // :1026 secchio 1
} else if (jsx.includes(CLASSIC_VALUE_VIEW_MARKER)) {
    e.irLegacyClassic = true;                                                   // :1029 secchio 2
} else if (!isKnownDefault(jsx)) {
    e.irLegacyClassic = true;                                                   // :1032 secchio 3
}
```

**Costanti** — tutte in `frontend/src/utils/defaultViewTemplate.ts`:

| costante | riga | valore |
|---|---|---|
| `CLASSIC_OBJECT_VIEW_MARKER` | `:146` | `'jjodel-classic-object v3'` |
| `CLASSIC_VALUE_VIEW_MARKER` | `:147` | `'jjodel-classic-value v3'` |
| `CLASSIC_SINGLETON_VIEW_MARKER` | `:148` | `'jjodel-classic-singleton v3'` |
| `DEFAULT_VIEW_JSX_STRING` | `:82` | template v3 corrente |
| `DEFAULT_VIEW_JSX_V2_3_LEGACY` | `:16` | template v2.3 congelato |
| `V2_3_TO_V3_DETECT_MARKER` | `:63` | `'jjodel-default-view--edge-fallback'` |
| `V2_2_TO_V2_3_DETECT_MARKER` | `:117` | `'Customize this view'` |
| `LEGACY_PLACEHOLDER_MARKER` | `:105` | `'To add information here,'` |

> **Correzione al framing del prompt: i secchi non sono tre, sono cinque.** La cascata ha due esiti in più, entrambi silenziosi:
> - **secchio 4** — `e.ir !== undefined || e.irLegacyClassic` (`:1022`): record già trattati, saltati per idempotenza;
> - **secchio 5** — `isKnownDefault(jsx) === true` e nessun marker classic: **non riceve né `ir` né `irLegacyClassic`**. È il ramo `else if` finale che non scatta. Sono i default M2/graph (`jjodel-default-view`), che vengono comunque rigenerati a valle da `updateDefaultView`.
>
> Il secchio 5 conta: una view che finisce lì è indistinguibile, per ispezione dei campi, da una view mai passata dalla migration.

**Carry-over verificato**: `LViewElement.updateDefaultView` (`view.tsx:1751-1775`) preserva entrambi i campi —
`if ((v as any).ir !== undefined) (newView as any).ir = (v as any).ir;` (`:1762`) e
`if ((v as any).irLegacyClassic) (newView as any).irLegacyClassic = true;` (`:1763`).
Senza questo carry-over la migration verrebbe cancellata dallo stesso load che la applica (il commento a `:1759-1761` lo dichiara).

## B.2 — `irLegacyClassic`: **zero letture a runtime**

Grep esaustivo su `frontend/src` (`--include=*.ts --include=*.tsx`), **5 occorrenze in 2 file**:

| sito | tipo | nota |
|---|---|---|
| `view/viewElement/view.tsx:210` | **dichiarazione** | campo opzionale su `DViewElement` |
| `view/viewElement/view.tsx:1763` | **scrittura** | carry-over in `updateDefaultView` |
| `redux/VersionFixer.tsx:1022` | **lettura** | ma **solo dentro la guardia di idempotenza della migration stessa** |
| `redux/VersionFixer.tsx:1029` | **scrittura** | secchio 2 |
| `redux/VersionFixer.tsx:1032` | **scrittura** | secchio 3 |

> **Risultato più importante dell'area: `irLegacyClassic` è un flag scritto e mai consumato.** L'unica lettura è quella che la migration fa su sé stessa per non rieseguirsi. Nessun componente di rendering, nessun pannello, nessun selettore, nessun badge, nessun log lo interroga. Non esiste alcun punto del codice in cui il valore `true` produca un comportamento diverso da `undefined`.

## B.3 — `migratedFrom`: letto, e con quale criterio di uguaglianza

Grep: 12 occorrenze, di cui i siti funzionali sono tre.

- **Scrittura**: `VersionFixer.tsx:1026` — unico writer.
- **Lettura**: `irDefaults.ts:128-143`, funzione `isMigratedDefaultView`.
- **Consumatore finale**: `ObjectNode.tsx:65` — `const irDelegated = irResolution !== null && isMigratedDefaultView(irResolution.compiled);` usato come gate a `:377` (`if (irResolution && !irDelegated)`).

**Il confronto con la factory esiste davvero**, e il criterio è **identità strutturale profonda su hash canonicalizzato**, non confronto di campi né di id (`irDefaults.ts:134-140`):

```
if (ir.migratedFrom === 'classic-default') {
    const structural: Record<string, unknown> = { ...ir };
    delete structural.migratedFrom;
    if (factoryHash === null) factoryHash = irHash(canonicalize(defaultObjectViewIR()) as VertexViewIR);
    delegated = irHash(canonicalize(structural) as VertexViewIR) === factoryHash;
}
```

`canonicalize` (`:103-111`) ordina ricorsivamente le chiavi degli oggetti (gli array mantengono l'ordine, che è semantico); `irHash` (`irCompile.ts:226`) è `djb2` su `JSON.stringify`. Memoizzazione per riferimento in una `WeakMap` (`:116`, `:132-133`, `:141`), coerente con l'assunzione che il D-layer sostituisca il riferimento dell'`ir` a ogni edit. Corollario dichiarato nel commento (`:124-125`): **una view migrata e poi modificata dall'autore diverge dalla factory e torna all'interprete come view custom**. Secondo ramo di delega, indipendente: `compiled.viewId === IR_DEFAULT_OBJECT_VIEW_ID` (`:129`).

## B.4 — Cosa rende un elemento la cui unica view applicabile è di secchio 2 o 3

**Catena, tre passaggi.**

1. **La view non entra nell'indice IR.** `getIRIndex` (`irResolveCore.ts:94-207`) itera `state.viewelements` e scarta a `:114-115`:
   `const ir = (d as any).ir as AnyViewIR | undefined; if (!ir || typeof ir !== 'object') continue;`
   Una view di secchio 2 o 3 non ha `ir` ⇒ **non viene indicizzata in nessun bucket**. `irLegacyClassic` non è nemmeno guardato.

2. **La risoluzione restituisce `null`.** `useIRView` (`irResolve.ts:47-96`): se l'indice non contiene un candidato applicabile, `resolveIRView` restituisce `null` e l'hook esce con `null` (`:87`). Il JSDoc lo dichiara (`:44-45`): *«Returns null when the active viewpoint has no applicable IR view — in that case ObjectNode renders exactly as before the spike»*.

3. **`ObjectNode` prende il ramo nativo.** Il gate è `ObjectNode.tsx:377`: `if (irResolution && !irDelegated) { …ramo IR… }`. Con `irResolution === null` il ramo IR è saltato e si cade nel **ramo nativo astratto** (`mm-node`, la stessa resa di "nessun viewpoint attivo").

**Il `jsxString` non viene letto da nessuna parte in questa catena.** Verificato in due modi:
- `ObjectNode.tsx` **non compare** nell'elenco dei file che nominano `jsxString` (grep globale su `frontend/src`);
- l'unico ramo di rendering che lo nomina è `ClassNode.tsx:424` — `if (data.jsxString) { … <ViewpointRenderer jsxString={data.jsxString} context={data} /> }` (`:437`) — ma **nessuno popola quel campo**. `ClassNodeData.jsxString` è dichiarato opzionale (`types.ts:125`) e il grep di `jsxString:` su `components/`, `redux/`, `view/`, `utils/`, `joiner/`, `common/` non trova **alcun writer** che lo assegni dentro `node.data`. `ViewpointRenderer` (31 righe) ha **un solo importatore**, esattamente quel ramo irraggiungibile, e il suo stesso commento (`:10-11`) lo qualifica come segnaposto: *«In production, this will use the full DSL.parser → UX.parseAndInject → new Function pipeline»*.

> **Conclusione B.4**: per M1 il `jsxString` è ignorato del tutto; per M2 esiste un ramo che lo leggerebbe ma il cui input non viene mai riempito. **Nessuna pipeline viva interpreta i template classici.** Questo conferma e completa, dal lato *view legacy*, ciò che `discovery_2026-08-04_tab_map_authority_triage.md` §1.0 aveva stabilito dal lato *tab*.

**Effetto osservabile**: il progetto apre senza errori; gli elementi si vedono; la **notazione autorata è persa**, sostituita dal rendering astratto nativo (header `nome : Metaclasse` + compartimento attributi per gli oggetti, box UML per le classi).

## B.5 — Segnali all'utente: **nessuno**

Ricerca su badge, tooltip, righe di stato, warning e log:

- **grep `legacy|Legacy`** su `components/editors/views/` e `components/editor-v2/viewpoint/` escludendo import e commenti: **zero occorrenze**.
- **`NestedView.tsx`** (l'albero delle view, che possiede già una meccanica di badge — cfr. tab-map §1.1: badge per `isExclusiveView`, `oclCondition`, `jsCondition`, `explicitApplicationPriority`): **nessun riferimento a `irLegacyClassic` né a view prive di IR**.
- **`console.warn` del sottosistema IR** (`irResolveCore.ts:121`, `:151`, `:174`; `irCrossDeps.ts:184`, `:196`): riguardano tutti **IR malformati che falliscono la compilazione**, non view che l'IR non ce l'hanno. Una view legacy non ne emette nessuno — non arriva mai al compilatore.
- **L'unico output esistente** è il `console.log` della migration stessa, `VersionFixer.tsx:1037`:
  `[VersionFixer 2.225 -> 2.226] IR inverse migration: N default view(s) -> IR, M marked legacy-classic.`
  Emesso **una volta sola, al load**, nella console del browser. Non è una superficie utente e non sopravvive alla sessione.

> **Risposta a Q5: no, non esiste alcun segnale.** Una view degradata è indistinguibile da una view sana in ogni superficie visibile: albero, pannello Properties, canvas. L'unica traccia è un `console.log` al momento della conversione.

---

# Area A — Censimento del corpus

## A.1 Metodo, e la correzione che ha cambiato il risultato

Script usa-e-getta in `…/scratchpad/census.ts` (**fuori dal repo, non committato**), eseguito con
`node --disable-warning=ExperimentalWarning --experimental-strip-types census.ts`.

**I blob sono importati direttamente come moduli**, non parsati a mano: sono tutti privi di `import` (verificato: `imports=0` su tutti e 11), quindi caricabili in node. Allo stesso modo lo script importa **le costanti reali** di `utils/defaultViewTemplate.ts` (modulo di sole stringhe, zero import): **il predicato di classificazione non è riscritto, usa gli stessi valori della migration.**

> ### Correzione metodologica — il primo censimento era sbagliato, ed è istruttivo perché lo era
>
> La prima esecuzione classificava il blob **come sta su disco** e dava **100% secchio 3**. È un risultato spurio: la 2.225→2.226 **non vede mai il blob grezzo**.
>
> Nessuno dei blob dichiara un campo `version` (verificato: `grep '"version"'` → 0 occorrenze in tutti e 7). Quindi `VersionFixer.update:111` assegna `{n: 2.1}` e **l'intera catena di 31 migration gira prima** della 2.226. Quattro di esse **riscrivono `jsxString`** (grep `\.jsxString = ` su `VersionFixer.tsx` → 4 hit):
>
> | migration | riga | predicato | effetto |
> |---|---|---|---|
> | 2.211 → 2.212 | `:620-639` | `jsxString.includes(LEGACY_PLACEHOLDER_MARKER)` | → `DEFAULT_VIEW_JSX_STRING` |
> | 2.213 → 2.214 | `:673-691` | marker v2.2 presente **e** `'view.isEdge'` assente | → `DEFAULT_VIEW_JSX_STRING` |
> | 2.222 → 2.223 | `:928-952` | `'object-children'`/`'values_str'`/`'singleton'` **senza** il marker v3 | → `CLASSIC_*_VIEW_JSX` (**è questa che semina i marker del secchio 1**) |
> | 2.223 → 2.224 | `:966-985` | uguale al v2.3 congelato **o** marker v2.3 | → `DEFAULT_VIEW_JSX_STRING` |
>
> Lo script è stato corretto replicando queste quattro nell'ordine reale, con le stesse costanti (`runJsxRewritesBefore2226`). **Rischio di divergenza dichiarato**: sono replicate, non richiamate — `VersionFixer.tsx` importa il joiner e non è caricabile in node. Sono state copiate riga per riga dai blocchi citati; se una di esse cambia, il censimento va rifatto.

**Un secondo passaggio, dopo la catena**: `VersionFixer.update:135-144` esegue, per ogni view con
`v.version !== highestVersion && !v.clonedCounter`, la `updateDefaultView`, che **sostituisce la view in blocco** con quella di fabbrica — ma **solo se `Defaults.defaultViewsMap[v.id]` esiste** (`view.tsx:1753-1754`, `if (!newView) return;`). Le view dei blob hanno id **stabili di default** (`Pointer_ViewModel`, `Pointer_ViewClass`, …) con `clonedCounter === undefined` e `version === undefined`, quindi **la gran parte viene rigenerata**. La lista autoritativa è `common/Defaults.ts:5-28` (23 id).

Questo passaggio è modellato nel secondo script (`worstcase.ts`) con la lista dei 23 id copiata da `Defaults.ts` (**anche qui: copiata, non importata** — `Defaults.ts` importa il joiner).

## A.2 Ripartizione nei secchi

Predicati applicati **dopo** le quattro riscritture. `B5` = secchio 5 di §B.1; `B0` = record senza `jsxString`.

### Blob registrati in `index.ts` (raggiungibili dalla UI)

| blob | `version` | DViewPoint | DViewElement | B1 default marker | B2 CLASSIC_VALUE | **B3 custom** | B4 già IR | B5 default noto |
|---|---|---|---|---|---|---|---|---|
| `first.ts` | **assente → 2.1** | 3 | 22 (5 cloned) | 1 | 0 | **21** | 0 | 0 |
| `second.ts` | **assente → 2.1** | 2 | 19 (1 cloned) | 1 | 0 | **18** | 0 | 0 |
| `sequence.ts` | **assente → 2.1** | 2 | 22 (4 cloned) | 1 | 0 | **21** | 0 | 0 |
| `statechartplus.ts` | **assente → 2.1** | 3 | 22 (7 cloned) | 1 | 0 | **21** | 0 | 0 |
| **TOTALE** | | **10** | **85** | **4** | **0** | **81** | **0** | **0** |

### Blob non registrati (materiale morto o di test)

| blob | DViewElement | B1 | B2 | **B3** | B4 | B5 |
|---|---|---|---|---|---|---|
| `conflictsimulation.ts` | 23 (13 cloned) | 2 | 0 | **21** | 0 | 0 |
| `shapes.ts` | 19 (5 cloned) | 2 | 0 | **17** | 0 | 0 |
| `statechartplus_old.ts` | 22 (4 cloned) | 1 | 0 | **21** | 0 | 0 |
| `examples/examples/*` (4 file, duplicato della cartella padre) | 85 | 4 | 0 | **81** | 0 | 0 |
| **TOTALE** | **149** | **9** | **0** | **140** | **0** | **0** |

**Osservazioni**:
- **`B2` è vuoto ovunque.** Il secchio 2 (`CLASSIC_VALUE`) non è rappresentato nel corpus: i marker `v3` sono del 2026, i blob del 2023 (id `1695…`/`1696…`). Le view "value" del 2023 finiscono in B3 come tutte le altre.
- **`B1` vale 1 per blob** (2 su conflictsimulation e shapes): è esattamente la view che la 2.222→2.223 riscrive con `CLASSIC_OBJECT_VIEW_JSX`, guadagnando così il marker. Il secchio 1 esiste solo perché una migration precedente lo fabbrica.
- **`examples/examples/`** è un duplicato byte-identico dei quattro file registrati (stessi conteggi). È materiale morto: nessun `index.ts` di livello superiore lo importa.
- **`examples/StateMachine/`** è **fuori censimento e va dichiarato**: non è un blob JSON ma un costruttore programmatico (`index.ts` importa `joiner`, `M1/`, `M2/`, `views/` e crea le view via `DViewElement.new`). Non è caricabile in node né classificabile con lo stesso predicato. Le sue view nascono a runtime con il template corrente, quindi non passano dalla migration.

## A.3 Il numero che conta: quante sopravvivono a `updateDefaultView`

Delle view di secchio 3, quelle il cui id è in `Defaults.views` **e** con `clonedCounter` assente vengono rigenerate wholesale subito dopo (`VersionFixer.tsx:141`), tornando al template di fabbrica corrente. Le altre restano com'erano.

| blob | B3 | rigenerate | **sopravvivono** |
|---|---|---|---|
| `first.ts` | 21 | 14 | **7** |
| `second.ts` | 18 | 15 | **3** |
| `sequence.ts` | 21 | 15 | **6** |
| `statechartplus.ts` | 21 | 13 | **8** |
| **TOTALE registrati** | **81** | **57** | **24** |
| `conflictsimulation.ts` | 21 | 9 | 12 |
| `shapes.ts` | 17 | 13 | 4 |
| `statechartplus_old.ts` | 21 | 15 | 6 |

**Le 24 sopravvissute dei blob registrati si dividono in due famiglie:**

**(a) 11 view con id di default ma non rigenerabili** — o perché l'id **non è nella lista** `Defaults.views` (`Pointer_ViewDefaultPackage`, commentato a `Defaults.ts:46`; `Pointer_ViewVoid`, mai presente), o perché hanno `clonedCounter` valorizzato (`Pointer_ViewEdgePoint` cloned=1, `Pointer_ViewReference` cloned=1, `Pointer_ViewValue` cloned=1, `Pointer_ViewVoid` cloned=1 in statechartplus).

**(b) 13 view genuinamente autorate a mano** — id con timestamp, `clonedCounter` alto. Sono **il caso peggiore reale**:

| blob | id | name | cloned | template (primi 120 char) |
|---|---|---|---|---|
| `first.ts` | `1695977632558_…43851` | ClassView | 3 | `<div className={'root'} style={{border:'1px solid gray', backgroundImage:'linear-gradient(to top left,#b5c6e0,#ebf4f5)'…` |
| `first.ts` | `1695978290201_…16622` | ClassView | 2 | idem, con `padding: '10px'` |
| `first.ts` | `1695977722067_…79001` | View | 27 | `<div style={{border:'none'}} className={'root'}></div>` |
| `first.ts` | `1695978337837_…25882` | View | 27 | `<div style={{border:'none'}} className={'d-none'}></div>` |
| `second.ts` | `1695991481479_…93936` | model_1View | 16 | `<div className={'root model'}> {data.objects.filter(obj => obj.instanceof.name !== 'Edge')…` |
| `sequence.ts` | `1696058030740_…11212` | Model | 32 | `{data.objects.map((o,i) => { if(o.instanceof.name === 'Lifeline') …` |
| `sequence.ts` | `1696058267889_…108753` | Lifeline | 25 | `<strong>Lifeline</strong> <button className={'btn btn-primary'} onClick={e => {…` |
| `sequence.ts` | `1696059329152_…576` | Occurance | 56 | `<div className={'root bg-danger d-block'}> <label className={'text-white'}>Occurance</label>` |
| `sequence.ts` | `1696060260495_…34799` | Operation | 65 | `<section>Useless</section>` |
| `statechartplus.ts` | `1696213915306_…3761799` | Room_View | 95 | `backgroundImage:"url(https://images.freeimages.com/…)"` |
| `statechartplus.ts` | `1696218380589_…753947` | StudentView | 82 | `{progress.value!=="Finished" && <img src="https://cdn-icons-png.flaticon.com/512/10/10938.png" />}` |
| `statechartplus.ts` | `1696295293323_…11630` | State_View | 198 | `{data.instanceof.name == "InitialState" && <div style={{borderRadius:"999px", background:…` |
| `statechartplus.ts` | `1696301867204_…447171` | Model m1 view | 68 | `<div className="edges" …>` custom edge layer |

Questi sono template con immagini di sfondo, bottoni con handler, forme condizionali sul valore di uno slot, filtri sugli oggetti del modello. **Non sono varianti dei default sfuggite ai marker: sono notazione di dominio.** Oggi nessun motore li interpreta e nessun avviso lo dice.

## A.4 Estratti dei `jsxString` distinti di secchio 3

**35 template distinti** in tutto il corpus. Elenco integrale, primi 200 caratteri, whitespace normalizzato, ordinato per numero di occorrenze — è il materiale grezzo su cui poggia la lettura di §A.3, riportato per esteso perché serve a distinguere i template davvero custom dalle varianti di default sfuggite ai marker.

Colonna **fam.**: `INFRA` = infrastruttura del canvas classico 2023 (default incorporati dell'epoca, classificati "custom" solo perché i marker `v3` non esistevano ancora); `DOM` = notazione di dominio autorata.

| # | occ. | fam. | blob | primi 200 char |
|---|---|---|---|---|
| 1 | 26 | INFRA | tutti e 11 | `<div className={"hoverable edge hide-ep EdgeReference"} style={{overflow: "visible", width:"100vw", height:"100vh", pointerEvents:"none"}}> <svg style={{width:"100vw", height:"100vh", poin` |
| 2 | 22 | INFRA | tutti e 11 | `<div className={'w-100 root feature'}> <Select className={'p-1 d-flex'} data={data} field={'type'} label={data.name} /> </div>` |
| 3 | 11 | INFRA | tutti e 11 | `<div className={'w-100'}> <Select className={'p-1 root operation d-flex'} data={data} field={'type'} label={data.name + ' () => '} /> </div>` |
| 4 | 11 | INFRA | tutti e 11 | `<label className={'d-block text-center root literal'}>{data.name}</label>` |
| 5 | 11 | INFRA | tutti e 11 | `<div className={'round bg-white root void model-less p-1'}> <div>voidvertex element test</div> <div>data: {props.data ? props.data.name : "empty"}</div> </div>` |
| 6 | 11 | INFRA | tutti e 11 | `<div className={"hoverable edge hide-ep EdgeExtend"} style={{overflow: "visible", width:"100vw", height:"100vh", pointerEvents:"none"}}> <svg style={{width:"100vw", height:"100vh", pointer` |
| 7 | 11 | INFRA | tutti e 11 | `<div className={"hoverable edge hide-ep EdgeAggregation"} style={{overflow: "visible", width:"100vw", height:"100vh", pointerEvents:"none"}}> <svg style={{width:"100vw", height:"100vh", po` |
| 8 | 11 | INFRA | tutti e 11 | `<div className={"hoverable edge hide-ep EdgeComposition"} style={{overflow: "visible", width:"100vw", height:"100vh", pointerEvents:"none"}}> <svg style={{width:"100vw", height:"100vh", po` |
| 9 | 11 | INFRA | tutti e 11 | `<div className={"edgePoint"} tabIndex="-1" hoverscale={"hardcoded in css"} style={{borderRadius:"999px", border: "2px solid black", background:"white", width:"100%", height:"100%"}} />` |
| 10 | 9 | INFRA | first, second, sequence, statechartplus, statechartplus_old, +4 dup | `<div className={'root'}> <div className={'package-children'}> {data.children.map((child, index) => { return <DefaultNode key={child.id} data={child.id} /> })} </div` |
| 11 | 8 | INFRA | first, second, sequence, statechartplus_old, +4 dup | `<div className={'root'}> {!data && "Model data missing."} <div className="edges" style={{zIndex:101, position: "absolute", height:0, width:0, overflow: "visible"}}>{[ true && data.` |
| 12 | 8 | INFRA | first, second, sequence, statechartplus_old, +4 dup | `<div className={'round root bg-white package'}> <div className={'package-children'}> {data.children.map((child, index) => { return <DefaultNode key={child.id} data={child.id} /` |
| 13 | 8 | INFRA | first, second, sequence, statechartplus_old, +4 dup | `<div className={'round bg-white root class'}> <Input jsxLabel={<b className={'class-name'}>EClass:</b>} data={data.id} field={'name'} hidden={true} autosize={true} /> <hr/> <di` |
| 14 | 8 | INFRA | first, second, sequence, statechartplus_old, +4 dup | `<div className={'round bg-white root enumerator'}> <Input jsxLabel={<b className={'my-auto enumerator-name'}>EEnum:</b>} data={data.id} field={'name'} hidden={true} autosize={true} />` |
| 15 | 8 | INFRA | first, second, sequence, statechartplus_old, +4 dup | `<div className={'d-flex root value'} style={{paddingRight: "6px"}}> {props.data.instanceof && <label className={'d-block ms-1'}>{props.data.instanceof.name}</label>} {!props.data.instanceof` |
| 16 | 4 | INFRA | statechartplus, conflictsimulation, shapes | `<div className={'root'}> {!data && "Model data missing."} <div className="edges" style={{zIndex:101, position: "absolute", height:0, width:0, overflow: "visible"}}>{[ refEdges.map(` |
| 17 | 3 | INFRA | statechartplus, conflictsimulation, shapes | `<div className={'round bg-white root class'}> <Input jsxLabel={<b className={'class-name'}>EClass:</b>} data={data} field={'name'} hidden={true} autosize={true} /> <hr/> <div c` |
| 18 | 3 | INFRA | statechartplus, conflictsimulation, shapes | `<div className={'round bg-white root enumerator'}> <Input jsxLabel={<b className={'my-auto enumerator-name'}>EEnum:</b>} data={data} field={'name'} hidden={true} autosize={true} />` |
| 19 | 3 | INFRA | statechartplus, conflictsimulation, shapes | `<div className={'round root bg-white package'}> <div className={'package-children'}> {data.children.map((child, index) => { return <DefaultNode key={child.id} data={child} />` |
| 20 | 3 | INFRA | statechartplus, conflictsimulation, shapes | `<div className={'d-flex root value'} style={{paddingRight: "6px"}}> {instanceofname && <label className={'d-block ms-1'}>{instanceofname}</label>} {!instanceofname && <Input asLabel={true} d` |
| **21** | 3 | **DOM** | statechartplus, statechartplus_old, +1 dup | `<div className={'root bg-white d-flex'} style={{flexWrap: "wrap", backgroundSize: "100% 100%", backgroundImage:"url(https://images.freeimages.com/365/images/istock/previews/7398/73982903-linear-a` |
| **22** | 3 | **DOM** | statechartplus, statechartplus_old, +1 dup | `<div className={'root '} style={{border:"none"}}> {progress.value!=="Finished" && <img className="w-100 h-100" alt="Student" src="https://cdn-icons-png.flaticon.com/512/10/10938.png" />} {pr` |
| 23 | 3 | INFRA | statechartplus, statechartplus_old, +1 dup | `<div className={'root'}> {!data && "Model data missing."} <div className="edges" style={{zIndex:101, position: "absolute", height:0, width:0, overflow: "visible"}}>{ data && data.allSubObjects` |
| **24** | 2 | **DOM** | first, +1 dup | `<div className={'root'} style= {{ border: '1px solid gray', backgroundImage: 'linear-gradient(to top left, #b5c6e0, #ebf4f5)', borderRadius: '5px' }}> <div className={'text-center` |
| **25** | 2 | **DOM** | first, +1 dup | `<div style={{border: 'none'}} className={'root'}></div>` |
| **26** | 2 | **DOM** | first, +1 dup | `<div className={'root'} style= {{ border: '1px solid gray', backgroundImage: 'linear-gradient(to top left, #b5c6e0, #ebf4f5)', borderRadius: '5px', padding: '10px' }}> <div c` |
| **27** | 2 | **DOM** | first, +1 dup | `<div style={{border: 'none'}} className={'d-none'}></div>` |
| **28** | 2 | **DOM** | second, +1 dup | `<div className={'root model'}> {data.objects.filter(obj => obj.instanceof.name !== 'Edge') .map((obj, index) => { return(<DefaultNode key={index} data={obj.id} />) })}` |
| **29** | 2 | **DOM** | sequence, +1 dup | `<div className={'root model'}> {data.objects.map((o, i) => { if(o.instanceof.name === 'Lifeline') return(<DefaultNode key={i} data={o} />) if(o.instanceof.name ===` |
| **30** | 2 | **DOM** | sequence, +1 dup | `<div className={'root bg-white p-1'}> <strong className={'d-block text-center'}>Lifeline</strong> <button className={'p-1 btn btn-primary d-block mx-auto'} onClick={e => { const o =` |
| **31** | 2 | **DOM** | sequence, +1 dup | `<div className={'root bg-danger d-block'}> <label className={'text-white'}>Occurance</label> </div>` |
| **32** | 2 | **DOM** | sequence, +1 dup | `<section>Useless</section>` |
| **33** | 2 | **DOM** | statechartplus_old, +1 dup | `<div className={'h-100 w-100'} style={{border:"none"}}> {data.instanceof.name == "InitialState" && <div className="h-100" style={{borderRadius: "999px", background:(career.join("")==="")&&"green"||"` |
| **34** | 1 | **DOM** | statechartplus | `<div className={'h-100 w-100'} style={{border:"none", overflow:"visible"}}> {data.instanceof.name == "InitialState" && <div className="h-100" style={{borderRadius: "999px", background:(career.join("` |
| 35 | 1 | INFRA | conflictsimulation | `<div className={'root'}> {!data && "Model data missing."} <div className="edges" style={{zIndex:101, position: "absolute", height:0, width:0, overflow: "visible"}}>{ [ <Edge start={dat` |

*«+N dup» = le copie in `examples/examples/`, duplicato integrale senza importatori (§A.2).*

**Ripartizione**: **22 template `INFRA`** (righe 1-20, 23, 35) e **13 template `DOM`** (righe 21, 22, 24-34, evidenziate in grassetto).

**Il criterio di separazione, esplicito**: un template è `INFRA` quando è strutturale e generico — itera `data.children`/`data.objects`, monta un `<Input>`/`<Select>` su un campo, o disegna l'overlay di un arco — cioè fa ciò che oggi fanno nativamente `ObjectNode`/`ClassNode`/`UnifiedEdge`. È `DOM` quando codifica una decisione di notazione che il rendering nativo non esprime: un'immagine remota (21, 22), un gradiente e un bordo scelti (24, 26), una forma condizionale sul valore di uno slot (33, 34), un bottone con handler (30), un filtro sugli oggetti per metaclasse (28, 29), o l'occultamento deliberato di un elemento (25, 27, 32).

Due osservazioni che l'elenco integrale rende visibili e che il raggruppamento nascondeva:

- **le occorrenze alte sono tutte `INFRA`** (26, 22, 11×7): sono le view di default replicate identiche in ogni blob. **Le occorrenze basse sono quasi tutte `DOM`** (2 o 1): la notazione autorata è per definizione unica per progetto. La distribuzione delle frequenze è essa stessa il discriminante.
- **le righe 33 e 34 differiscono per due soli attributi** (`overflow:"visible"` e uno spazio) e sono la stessa `State_View` in due versioni del progetto statechart. Contano come due template distinti ma sono una sola decisione di notazione: **il numero di template distinti sovrastima leggermente il numero di notazioni distinte.**

> **Lettura**: la maggioranza numerica del secchio 3 è rumore storico che `updateDefaultView` ripara da sé (§A.3: 57 su 81 rigenerate). **Il segnale è la minoranza: 13 view su 85 nei blob raggiungibili (15%) sono notazione autorata che si perde in silenzio** — e i 13 template `DOM` di questa tabella sono esattamente il loro contenuto.

## A.5 Limite del corpus — da leggere prima di generalizzare

**Gli esempi del repo sono un proxy dei progetti reali degli utenti, non i progetti reali.** Tre precisazioni, nella direzione prescritta dal prompt:

1. Il corpus **contiene** il caso peggiore (13 view di dominio autorate a mano): non è possibile concludere «il caso peggiore non esiste». Il contrario è dimostrato.
2. I blob sono **tutti del 2023** e tutti privi di `version`: rappresentano il salto migratorio **massimo** (2.1 → 2.226+). Un progetto utente salvato più di recente parte da una versione più alta, salta le riscritture intermedie e può ripartirsi diversamente. **Il censimento misura il caso più lungo, non il caso medio.**
3. La proporzione 13/85 **non è trasferibile** a una popolazione reale: dipende da quanto un utente ha autorato. Un progetto molto personalizzato ha una percentuale più alta; uno lasciato ai default ha zero sopravvissute.

**Proposta (non eseguita, come da hard stop)**: `census.ts` è riusabile e costa ~130 righe. Se lo si vuole tenere, la sede naturale è `frontend/scripts/gates/`, accanto a `check-docs.ts`, che già usa lo stesso runner `node --experimental-strip-types`. Andrebbe però **richiamando** i predicati invece di replicarli, il che richiede prima di estrarre `isKnownDefault` e la lista `Defaults.views` in moduli puri — lavoro che non appartiene a questa fase.

---

# Area C — Superficie di authoring sulle view legacy

*Base condivisa: `docs/discovery/discovery_2026-08-04_tab_map_authority_triage.md` §1.1 (tab → campo → consumatore) e §2.1 (triage). Qui si aggiunge solo il **delta legacy**, senza rifare quella mappa.*

## C.1 `showIRTab` e i tab montati

`ViewData.tsx:61`, condizione esatta:

```
const showIRTab = (ir?.kind === 'vertex') || (ir?.kind === 'row') || (ir?.kind === 'edge')
                  || (isV && !ir && view.isEdge !== true);
```

**Per una view con `irLegacyClassic = true` (che per definizione non ha `ir`)**, il valore dipende **solo** dall'ultima clausola — `irLegacyClassic` **non compare nella condizione**:

| caso | `showIRTab` | tab montati |
|---|---|---|
| view legacy, `isEdge !== true` | **true** | `apply-to`, `template`, **`ir` → `EnableIRPanel`**, `style`, `events`, `options` |
| view legacy con `isEdge === true` | **false** | `apply-to`, `template`, `style`, `events`, `options` |
| viewpoint (`isVP`) | false | `apply-to`, `style`, `components` |

Nel primo caso il tab IR monta il **ramo di enable** (`:102`, `<EnableIRPanel view={view} />`), perché tutti i rami precedenti richiedono un `ir.kind`. Costruzione della lista: `apply-to` sempre (`:66-74`), `template` se `isV` (`:75-83`), `ir` se `showIRTab` (`:84-105`), `style` sempre (`:106-114`), `events` e `options` se `isV` (`:115-132`), `components` se `isVP` (`:133-141`).

> **Nota**: offrire l'enable IR su una view legacy è, in sé, l'affordance giusta — è l'unica via per riportarla in vita. Ma il pannello **non dice che la view è degradata**, e `EnableIRPanel` semina un IR nuovo senza alcun rapporto con il `jsxString` esistente: la notazione autorata non viene né migrata né citata.

## C.2 Triage dei tab **su una view legacy**

Rispetto al triage per view IR-authored (tab-map §2.1), su una view legacy **cambia una cosa sola ma è quella decisiva**: non c'è un IR che rivendichi lo stesso concern, quindi la categoria "ridondante" si svuota e i suoi occupanti scendono a "morto".

| tab | verdetto su view IR-authored (§2.1) | **verdetto su view legacy** | perché cambia |
|---|---|---|---|
| **apply-to** · Name | autoritativo | **autoritativo** | invariato: unico writer di `DViewElement.name`, letto da albero e header |
| **apply-to** · Viewpoint (`father`) | autoritativo | **autoritativo** | invariato: `irResolveCore.ts:113` filtra l'indice sul viewpoint — vale anche per decidere *se* una futura view IR sarà in quel viewpoint |
| **apply-to** · Applicable to | autoritativo (vertex) | **morto** | l'unico lettore vivo è il pin d'identità del `PathBuilder` (`VertexAuthoringPanel.tsx:118`), che esiste solo se c'è un IR. Senza IR nessuno lo legge |
| **apply-to** · Priority / Is Exclusive | ridondante | **morto** | erano ridondanti perché l'IR aveva `ir.priority`/`ir.exclusive`. Senza IR non c'è nemmeno il concorrente: il consumatore era `getAppliedViewsNew`, senza chiamanti |
| **apply-to** · OCL / JS condition | morto | **morto** | invariato |
| **apply-to** · Is Edge | morto-come-dato, vivo-come-flag | **morto-come-dato, vivo-come-flag** | `ViewData.tsx:61` lo legge come gate del tab IR; rimuovere il campo romperebbe `showIRTab` |
| **template** · JSX editor | morto | **⚠️ morto, e questo è il punto** | vedi §C.3 |
| **ir** | autoritativo | **n/a** (monta l'enable) | non c'è IR da autorare |
| **style** · palette / css / cssIsGlobal | morto in locale, pericoloso in globale | **identico** | il canale `compiled_css` → `Dashboard.tsx:603-615` non dipende dall'IR |
| **events**, **options**, **components** | morti | **morti** | invariati |

## C.3 Esiste un tab autoritativo su una view legacy?

Il prompt chiede di segnalare in particolare «se esiste un tab autoritativo su una view legacy: sarebbe il caso peggiore, cioè un pannello che funziona su un rendering che non c'è più».

**Risposta: no, e la formulazione va invertita — il caso peggiore è peggiore di così.**

Il tab **Template** è l'unico posto in cui la notazione classica di quelle 13 view è **esprimibile**, ed è l'unico posto in cui è **visibile**: apre Monaco sul `jsxString` reale, l'editor funziona, la scrittura persiste (`set_jsxString`, `view.tsx:682-684`, che innesca `VIEWS_RECOMPILE_jsxString` e il reducer ricompila). Per l'utente si comporta esattamente come prima.

Ma **non è autoritativo**, perché autoritativo significa "unico posto da cui il dato si scrive **e qualcuno lo legge**". Qui il lettore non esiste (§B.4): l'unico ramo di rendering che nomina `jsxString` è `ClassNode.tsx:424`, il cui input non viene mai popolato.

> **Il caso peggiore reale non è "un pannello autoritativo su un rendering assente": è un pannello che sembra autoritativo, mostra il contenuto giusto, accetta le modifiche, le salva — e non ha effetto.** È peggiore perché non è un controllo inerte e vuoto (come `Snap`, `readOnly` hardcoded, o `Components`, stub letterale): è un editor pieno del proprio dato, che continua a ricompilare qualcosa che nessuno eseguirà. Un utente che apre quelle 13 view non ha modo di distinguerlo da un editor funzionante.

Corollario sul flag: **`irLegacyClassic` non è nemmeno un indicatore affidabile di "view degradata"**, e per una ragione strutturale. L'ordine di `VersionFixer.update` è: catena di migration (la 2.226 marca) → **poi** `updateDefaultView` (`:135-144`), che rigenera le default non toccate **portandosi dietro il mark** (`view.tsx:1763`). Una view di default marcata legacy e poi rigenerata finisce quindi con il **template corrente** e con `irLegacyClassic = true` addosso. Nel censimento sono **57 view su 85** in questa condizione. Poiché nessuno legge il flag (§B.2) oggi non ha conseguenze; ma chiunque volesse usarlo come base di un segnale UI, di un filtro o di una bonifica, partirebbe da un insieme che contiene **più del doppio di falsi positivi che di casi veri** (57 rigenerate contro 24 sopravvissute).

---

# Dipendenze e rischi

1. **Il flag esiste ma non discrimina** (§B.2 + §C.3). `irLegacyClassic` è scritto su 81 view e ne descrive correttamente 24. Qualunque intervento che lo assuma come predicato di verità eredita 57 falsi positivi. Chi volesse un segnale affidabile deve ricalcolarlo, non leggerlo.

2. **Ordine migration → rigenerazione, non invertibile a cuor leggero.** La 2.226 marca *prima* che `updateDefaultView` ripari (`VersionFixer.tsx:117-144`). Invertire l'ordine cambierebbe i numeri di §A.3 ma toccherebbe la pipeline di load di ogni progetto: non è un ritocco locale.

3. **Il censimento replica quattro predicati invece di richiamarli.** `VersionFixer.tsx` e `Defaults.ts` importano il joiner e non sono caricabili in node. Le quattro riscritture di `jsxString` e la lista dei 23 id di default sono state copiate riga per riga dai siti citati. **Se uno di quei blocchi cambia, i numeri di questo report vanno rifatti.** È il rischio di divergenza che il prompt chiedeva di dichiarare.

4. **`updateDefaultView` non è stato simulato con la mappa reale.** `Defaults.defaultViewsMap` è popolata in due tempi — inizializzata a `true` (`Defaults.ts:89`, `acc[val] = true`, cioè un booleano, non una view) e sostituita con le istanze reali dal reducer (`reducer.ts:1110`). Lo script assume che al momento del load la mappa contenga le view vere. Se così non fosse, `updateDefaultView` farebbe `{...true}` → `{}` (`view.tsx:1755`) e il comportamento sarebbe un altro. **Non verificabile per sola lettura**: richiede un load reale strumentato.

5. **`examples/examples/` è un duplicato integrale** dei quattro blob registrati (stessi conteggi, stessi id). Nessun importatore. È materiale morto che raddoppia il corpus e falsa qualunque conteggio globale fatto senza distinguere.

6. **`examples/StateMachine/` è fuori censimento** (costruttore programmatico, non blob). Non classificabile con questo metodo.

7. **Il tab Template resta pienamente funzionante e persistente** su view che non renderizzano più (§C.3). Finché resta così, ogni sessione di authoring su una view legacy produce lavoro che non ha effetto.

8. **Nessuna slice di questo perimetro tocca la critical zone.** `useJjomSync.ts` e `portDistribution.ts` non sono stati letti e il tracciamento non li ha sfiorati: la catena si chiude in `ObjectNode`/`ClassNode`/`irResolve`. Un eventuale intervento su segnale o bonifica resterebbe fuori da §3.1.

---

# Domande aperte per Alfonso

**Q1 — Il problema è dimostrato non teorico. Qual è la soglia di intervento?**
Il corpus dà 13 view di dominio su 85 (15%) nei blob raggiungibili. Ma è il caso migratorio più lungo possibile (blob 2023, `version` assente) e un proxy dei progetti reali. Si interviene su questo dato, o si vuole prima una misura sui progetti reali (che richiede telemetria o un dump, entrambi fuori da qui)?

**Q2 — Il flag va riparato o sostituito?**
Oggi `irLegacyClassic` marca 81 view e ne descrive 24. Tre strade: (a) lasciarlo com'è e ricalcolare il predicato dove serve; (b) farlo scrivere **dopo** `updateDefaultView`, così marca solo chi sopravvive — ma significa toccare l'ordine della pipeline di load (rischio 2); (c) ritirarlo, visto che nessuno lo legge, e ricalcolare a vista quando servirà. Nessuna delle tre è gratis, e la (b) è la più invasiva.

**Q3 — Che cosa deve vedere l'utente, e dove?**
Non esiste nessun segnale (§B.5). Le superfici già dotate di badge sono l'albero delle view (`NestedView.tsx`, che ha già badge per exclusive/OCL/JS/priority) e l'header del pannello Properties (`ViewData.tsx:177-185`, che ha già il badge VIEW/VIEWPOINT). Un avviso sul canvas sarebbe più visibile ma molto più invasivo. Nessuna di queste è stata progettata qui.

**Q4 — Il tab Template su una view legacy: si lascia, si marca, o si chiude?**
È il caso peggiore di §C.3 — pieno, funzionante, senza effetto. Le tre opzioni hanno costi molto diversi e conseguenze opposte: lasciarlo com'è conserva il **contenuto** (l'unico posto dove quelle 13 notazioni sono ancora leggibili, quindi l'unica base per un'eventuale conversione futura); marcarlo con un avviso conserva il contenuto e toglie l'inganno; chiuderlo toglie l'inganno ma nasconde l'unica copia visibile del template. Da decidere insieme a Q3 perché sono lo stesso avviso.

**Q5 — Il secchio 5 va nominato?** (§B.1)
Una view che passa dal ramo `isKnownDefault` non riceve **nessun** campo ed è indistinguibile da una view mai migrata. Nel corpus è vuoto (i default del 2023 vengono riscritti prima e finiscono altrove), ma su progetti più recenti sarà il ramo più popolato. Serve distinguerlo, o l'indistinguibilità è accettabile perché quelle view sono comunque rigenerate?

**Q6 — Lo script di censimento diventa un gate?** (§A.5)
~130 righe, riusabile, ma oggi replica quattro predicati invece di richiamarli. Renderlo un gate richiede prima di estrarre `isKnownDefault` e `Defaults.views` in moduli puri importabili da node. È lavoro a sé; qui è solo segnalato.

---

## Riferimenti

- Migration: `frontend/src/redux/VersionFixer.tsx:1007-1040` (2.225→2.226), `:620-639`, `:673-691`, `:928-952`, `:966-985` (le quattro che riscrivono `jsxString`), `:109-156` (pipeline `update`).
- Costanti: `frontend/src/utils/defaultViewTemplate.ts:82,105,117,146,147,148`.
- Carry-over e rigenerazione: `frontend/src/view/viewElement/view.tsx:210`, `:1751-1775`; `frontend/src/common/Defaults.ts:5-28`, `:89`, `:102`.
- Delega: `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts:128-143`; `frontend/src/components/editor-v2/nodes/ObjectNode.tsx:65`, `:377`.
- Indice e risoluzione: `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts:114-115`; `irResolve.ts:44-45`, `:87`.
- `jsxString` senza lettori: `frontend/src/components/editor-v2/nodes/ClassNode.tsx:424`, `:437`; `viewpoint/ViewpointRenderer.tsx:10-11`; `components/editor-v2/types.ts:125`.
- Authoring: `frontend/src/components/editors/views/ViewData.tsx:61`, `:66-141`, `:102`.
- Discovery correlata, riusata e non ripetuta: `docs/discovery/discovery_2026-08-04_tab_map_authority_triage.md` §1.0, §1.1, §2.1.
- Commit dell'arco: `637a5e238` (migration inversa 2.225→2.226), `197b6c3d0` (spegnimento del classic, Fase 5a).
