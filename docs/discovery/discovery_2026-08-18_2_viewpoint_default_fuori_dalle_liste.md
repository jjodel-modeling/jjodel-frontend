# Discovery 2026-08-18 (2) — Il viewpoint `Default` fuori dalle liste, e il selettore come controllo della sintassi (Fase 1, read-only)

**Tipo**: discovery read-only. Nessun file di codice modificato.
**Base**: branch `alfonso-frontend-jjtl`, HEAD `7092b30dd`, working tree pulito all'avvio.
**Sigle proposte dal prompt**: R-IRN-9 (visibilità del `Default`) e R-IRN-10 (selettore = controllo della sintassi).
**Governanti**: R-IRN-7 e R-IRN-8 (`docs/decisions.md:683-698`).
**Obiettivo**: chiudere le dieci domande del prompt sul codice reale, con citazione `file:riga`, perché la Fase 2 si scriva su fatti misurati.

---

## Sintesi in sei righe

1. **`LProject.views` non ha nessun consumatore funzionale.** Zero. L'asse che il prompt indicava come potenziale bloccante è libero (Q1).
2. **`LProject.viewpoints` ne ha otto, e uno è funzionale, non contabile**: `ViewParentingFields` usa la lista come **destinazioni di «Move to viewpoint…»**. In un progetto con un solo viewpoint autorato quel bottone **sparisce** (Q2, R1).
3. **Due conseguenze fuori dalla cornice «sola visibilità», entrambe su `Dashboard.tsx`**: le soglie che scelgono l'illustrazione (`length <= 2` / `> 2`) si spostano di uno, e la frase «(including the default ones)» diventa falsa (Q2, R2/R3).
4. **`Pointer_ViewPointDefault` NON sta in `data.viewpoints`**, e questa volta non è un ragionamento: è misurato sui due stati serializzati in repo che hanno un record `DProject`, con controllo positivo che ha segnale (Q6).
5. **Ma può essere il viewpoint ATTIVO di un progetto salvato**: `statechartplus.ts` porta `"activeViewpoint": "Pointer_ViewPointDefault"`. La normalizzazione del punto 3b del prompt **non è opzionale**: senza, quel progetto mostra un `<select>` vuoto (Q8, R6).
6. **Il perimetro della pill è pulito**: tre occorrenze in tutto il repo, nessuno snapshot. Ma l'affermazione di `CLAUDE.md` §7.2 sul residuo `var(--accent)` è **stantìa**: sono cinque, non uno (Q10, R7).

---

## Metodo, e i controlli positivi

Tutte le ricerche con `command grep` — verificato che `grep` in questa shell è una funzione (wrapper `ugrep --ignore-files`) e che `command grep` è **BSD grep 2.6.0-FreeBSD**, dove `--include` filtra davvero (`CLAUDE.md` §5). `frontend/src/examples/` escluso da ogni ricerca a tappeto, come prescrive il prompt.

Ogni asserzione di assenza porta il proprio controllo positivo **con la stessa forma di comando**. I conteggi sono presi su output completo (`wc -l` / `grep -c`), mai leggendo l'exit status a valle di `head`.

Due misure sono **eseguite**, non lette:

- il corpus di stati serializzati in `frontend/src/examples/` è stato **parsato** con Python per estrarre i record `DProject` e leggerne i campi `viewpoints` e `activeViewpoint` (Q6, Q8). È l'unico corpus di progetti salvati che vive nel repo;
- il conteggio dei token `var(--accent)` è stato distinto da `--accent-muted` / `--accent-subtle` con una regex esplicita, invece di fidarsi del prefisso (Q10).

---

## File letti (con range)

- `frontend/src/common/Defaults.ts` — intero (119 righe)
- `frontend/src/joiner/classes.ts` — :1175-1220, :2895-2935, :3020-3025, :3135-3150, :3290-3345, :3440-3455
- `frontend/src/redux/store.tsx` — :150-170, :228-250, :300-335
- `frontend/src/redux/reducer/reducer.ts` — :455-480
- `frontend/src/redux/selectors/selectors.ts` — :95-105
- `frontend/src/components/editor-v2/Toolbar.tsx` — :55-80, :185-210, :410-450
- `frontend/src/components/editor-v2/EditorV2.scss` — :452-500
- `frontend/src/components/editor-v2/types.ts` — :118-132
- `frontend/src/components/editor-v2/EditorV2.tsx` — :2090-2118
- `frontend/src/components/abstract/tabs/EditorSwitch.tsx` — :74-112
- `frontend/src/utils/lastViewpoint.ts` — :40-70
- `frontend/src/components/project/ProjectEditor.tsx` — :205, :806-830, :850-866, :2616-2640, :2755-2775, :2869
- `frontend/src/components/megamodel/MegamodelView.tsx` — :30-45, :140-165
- `frontend/src/components/editors/views/NestedView.tsx` — :43-70, :490-545
- `frontend/src/components/editors/views/ViewData.tsx` — :50, :87, :119, :256-280
- `frontend/src/components/editors/views/data/InfoData.tsx` — :63, :284, :301-320
- `frontend/src/components/viewParenting/ViewParentingFields.tsx` — :1-120
- `frontend/src/components/editors/Info.tsx` — :1345-1360
- `frontend/src/pages/components/Dashboard.tsx` — :360-395, :455-480
- `frontend/src/pages/components/LeftBar.tsx` — :270-295, :368
- `frontend/src/pages/Project.tsx` — :65-90
- `frontend/src/api/persistance/projects.ts` — :85-105
- `frontend/src/examples/` — parsing mirato dei record `DProject` (7 file)

---

## Q1 — Consumatori di `LProject.views`

**Risposta: nessuno. Zero letture funzionali, in tutto il repo.**

Misura: `command grep -rn "\.views" frontend/src --include="*.ts" --include="*.tsx"`, escluso `examples/` → **11 righe**. Nessuna è una lettura di `.views` su un `LProject`/`DProject`:

| Riga | Che cos'è |
|---|---|
| `joiner/classes.ts:3296` | commento dentro `get_views` |
| `joiner/classes.ts:3304` | stringa d'errore di `set_views` (`Log.exx`) |
| `joiner/classes.ts:3308` | dentro il corpo **commentato** di `set_views` (blocco `/* */` :3305-3312) |
| `joiner/classes.ts:3448` | `data.views` — D-layer raw dentro `subElements`, non il getter L |
| `components/abstract/DockLayout.tsx:95,123,144,243,269` | **tutte commentate** |
| `common/Defaults.ts:87` | `Defaults.views`, l'array statico |
| `common/UX.tsx:162` | `props.viewsid` — falso positivo del pattern |

Forme di accesso alternative, cercate separatamente:
- `['views']` / `["views"]` → **2 righe**, ed entrambe sono le firme `get_views`/`set_views` (`classes.ts:3295`, `:3303`);
- destructuring `{ views }` → **0**.

Controllo positivo per la seconda ricerca, stessa forma di comando: `'viewpoints'` → **9 righe**. La ricerca raggiunge il suo soggetto.

**Conseguenza**: la clausola del prompt («se esiste una lettura funzionale, fermarsi») **non scatta**. Il getter `get_views` (`classes.ts:3295-3301`) deriva da `get_viewpoints` e perderebbe le venti view di default insieme al viewpoint, ma nessuno lo legge.

**Nota**: `get_views` **deduplica** (`duplicateRemover`, :3297-3300), a differenza di `get_viewpoints`. Vedi Q7.

---

## Q2 — Consumatori di `LProject.viewpoints`

Otto letture funzionali, più le scritture. Elenco completo:

| # | Sito | Uso | Effetto della fetta |
|---|---|---|---|
| 1 | `components/project/ProjectEditor.tsx:205` | `const viewpoints = project.viewpoints \|\| []` — alimenta sezione VIEWPOINTS (:2616-2640), megamodel (:2762), **due export JSON** (:818, :859), lista nomi (:2869) | il `Default` sparisce da tutte e cinque |
| 2 | `components/editors/views/NestedView.tsx:543` | `ret.project.viewpoints.filter(vp => !!vp)` — albero delle view | il nodo «Default» sparisce dall'albero |
| 3 | `components/TreeViewSidebar/TreeViewContent.tsx:2297` | `project.viewpoints \|\| []` → `ret.viewpoints` (:2316) | idem, sidebar |
| 4 | `components/editors/Info.tsx:1352` | `.map(vp => vp.id)` → prop `viewpoints` di `ViewData` | vedi #8 |
| 5 | `pages/components/LeftBar.tsx:275` | `pViewpoints` → sezione «Viewpoints» (:368) | il `Default` sparisce dalla sidebar di progetto |
| 6 | `pages/Project.tsx:72` | `vparr` → `allViews` → `viewsDeDuplicator` | **nessuno: il risultato non è mai letto** (vedi R9) |
| 7 | `pages/components/Dashboard.tsx:369-372, 390, 463` | soglie immagine, frase di riepilogo, lista di card | **tre effetti distinti, due fuori cornice** (vedi R2/R3/R4) |
| 8 | `api/persistance/projects.ts:97` | `project.viewpoints.length` → `viewpointsNumber` | vedi Q3 |

### Il consumatore funzionale, e perché non è contabile (R1)

La catena #4 non finisce in un conteggio. `Info.tsx:1352` → `ViewData` (prop `viewpoints`, :256/:278) → `InfoData` (`viewpointsID`, :301/:316) → **`ViewParentingFields`** (`InfoData.tsx:284`, e anche `irTabs.tsx:177`).

Lì la lista **è la lista delle destinazioni di un'azione**:

```typescript
ViewParentingFields.tsx:53
    // A move to the viewpoint it is already in is not a move.
    const moveTargets = (viewpoints || []).filter((vp) => vp && vp.id !== facts.viewpointId);

ViewParentingFields.tsx:99
    {!readOnly && moveTargets.length > 0 && (   // ← gate dell'intero bottone «Move to viewpoint…»
```

Conseguenze, entrambe reali:

- **positiva e voluta**: non si può più spostare una view *dentro* il `Default`. Coerente con «è un layer di sistema».
- **da dichiarare**: in un progetto con **un solo viewpoint autorato**, oggi `moveTargets = [Default]` e il bottone c'è; dopo la fetta `moveTargets = []` e **il bottone «Move to viewpoint…» sparisce**. Non è una regressione di correttezza — non c'è dove spostare — ma è un cambiamento di affordance che la cornice «sola visibilità» non copre.

La riga «Viewpoint» del pannello (`:93`) legge `facts.viewpointName` da `readViewParenting`, **non** dalla prop: una view che sta dentro il `Default` continua a mostrare correttamente «Default». Nessun buco lì.

---

## Q3 — `viewpointsNumber`

**Confermato: il contatore è oggi inflazionato di uno.**

```typescript
api/persistance/projects.ts:93-97
    static async save(project: LProject): Promise<DProject> {
        const dProject = {...project.__raw} as DProject;
        dProject.lastModified = Date.now();
        dProject.viewpointsNumber = project.viewpoints.length;
```

Il parametro è tipato `LProject`, quindi `project.viewpoints` è **il getter con il prepend** (`classes.ts:3324`), non `data.viewpoints`. Il numero salvato è `1 + (viewpoint autorati)`.

**Dove viene mostrato all'utente**: un solo sito, `pages/ProjectsInfo.tsx:22`:

```
{p.name} (State: {p.state.length}, M2: {p.metamodelsNumber}, M1: {p.modelsNumber}, VP: {p.viewpointsNumber})
```

Gli altri usi sono di trasporto, non di display: `api/DTO/UpdateProjectRequest.ts:40`, `api/persistance/projects.ts:223` (`SetFieldAction` di rientro), e le tre dichiarazioni nei DTO.

**Attenzione**: la card di progetto della Dashboard **non** usa `viewpointsNumber` — legge `project.viewpoints.length` dal vivo (Q2 #7). Quindi l'effetto «il contatore scende di uno» annunciato dal prompt si vede **subito** sulla Dashboard (getter) e **al primo salvataggio** su `ProjectsInfo` (campo persistito). Sono due superfici e due tempi.

---

## Q4 — Root `state.viewpoints`

**Confermato il push generico.** `reducer.ts:465-469`:

```typescript
elem.className = elem.className || (elem.constructor as typeof RuntimeAccessibleClass).cname || elem.constructor.name;
let statefoldername = elem.className.substring(1).toLowerCase() + 's';
derivedActions.push(
    Action.parse(SetRootFieldAction.create(statefoldername, elem.id,'[]', true)));
```

`DViewPoint` → `substring(1)` → `ViewPoint` → `.toLowerCase()+'s'` → **`viewpoints`**. Nessun filtro: ogni `DViewPoint` creato finisce nella root array, `Pointer_ViewPointDefault` incluso.

**Consumatori della root array — elenco completo**:

| Sito | Uso |
|---|---|
| `components/editor-v2/Toolbar.tsx:191` | `useSelector(state => state.viewpoints)` — **la lista del selettore** |
| `components/abstract/tabs/EditorSwitch.tsx:89` | `store.getState().viewpoints` — validazione del viewpoint salvato per modello |
| `redux/VersionFixer.tsx:428` | `s.viewpoints` — migrazione `cssIsGlobal` |
| `redux/selectors/selectors.ts:100` | `Selectors.getViewpoints()` — **codice morto**, vedi R8 |

**Questo è il punto architetturale della fetta**: il passo 2 del prompt cambia `get_viewpoints`, che legge `data.viewpoints`; la root array **non è toccata** e continua a contenere il `Default`. Ecco perché il passo 3a deve filtrare *di nuovo*, in `Toolbar.tsx`, con lo stesso predicato. Le due esclusioni non sono una ridondanza: sono due sorgenti diverse.

Il commento a `EditorSwitch.tsx:80-81` («the plural array IS scrubbed by VersionFixer, unlike the singular state.viewpoint») resta vero e **non è toccato** dalla fetta.

---

## Q5 — Megamodel

**Il filtro è raggiunto.** `ProjectEditor.tsx:2762` passa `id: vp.id || vp.name`; per il `Default` `vp.id` è `'Pointer_ViewPointDefault'`, che è truthy, quindi l'id arriva intatto e `MegamodelView.tsx:150` (`if (SYSTEM_VIEWPOINT_IDS.has(vp.id)) continue;`) lo scarta. Nessun buco: il canvas del megamodel è già pulito oggi.

**Le due esportazioni JSON non sono filtrate.** `ProjectEditor.tsx:818` e `:859` passano lo **stesso** `viewpoints` di riga 205 senza attraversare `MegamodelView`:

```typescript
viewpoints: viewpoints.map(vp => ({ id: vp.id || vp.name, name: vp.name || 'Unnamed' })),
```

Quindi **oggi il `Default` finisce nel file esportato**, in entrambe le esportazioni. Confermata l'ipotesi del prompt: si puliscono da sole con la sola modifica al getter, e non serve toccare `ProjectEditor.tsx`.

**Trovato per strada, non nel prompt**: `ProjectEditor.tsx:2869` passa `existingNames={viewpoints.map(vp => vp?.name || '')}` alla creazione di un viewpoint nuovo. Oggi «Default» è un nome occupato; dopo la fetta si libera. Coerente con «match per puntatore e mai per nome» (un viewpoint utente chiamato `Default` è legittimo e distinto), ma va detto invece che scoperto a schermo. Stesso effetto su `NestedView.tsx:49` (`viewpointNames` per `U.increaseEndingNumber`).

---

## Q6 — Il `Default` può stare dentro `data.viewpoints`?

**Risposta: no. Misurato, non dedotto.**

### La ragione a codice

Le vie di scrittura additiva in `data.viewpoints` sono due, e nessuna delle due ci arriva:

1. **Il costruttore `DViewPoint()`** (`classes.ts:1207-1213`):
   ```typescript
   DViewPoint(): this {
       const thiss: DViewPoint = (this.thiss) as any;
       const user: LUser = LUser.getUser();
       const project = LProject.getProject();
       if (!project) return this;              // ← esce prima di registrarsi
       this.setExternalPtr(project.id, 'viewpoints', '+=');
   ```
   Il seed gira in `store.tsx:246` dentro `init_editor`, quando il progetto non è ancora in `idlookup`: la guardia scatta.

2. **`set_viewpoints`** (`classes.ts:3326-3331`) scriverebbe `Pointers.from(val)` verbatim, quindi un `project.viewpoints = [...project.viewpoints, vpNuovo]` ci farebbe rientrare il prepend. Misura: **zero chiamanti**. Le cinque assegnazioni `.viewpoints =` trovate sono tutte su `ret` (oggetti di `mapStateToProps`: `NestedView.tsx:543`, `ViewData.tsx:278`, `InfoData.tsx:316`, `TreeViewContent.tsx:2316`) o su `pointers`, un oggetto piano di persistenza (`projects.ts:337`). **Nessuna su un `LProject`.**

L'unica altra scrittura è una **rimozione**: `common/Dummy.ts:97`, `SetFieldAction.new(projectid, 'viewpoints', deletedID, '-=', false)`.

### L'evidenza empirica

Parsati i sette file di `frontend/src/examples/`, estratti i record `"className":"DProject"` e letto il campo `viewpoints` nella stessa finestra:

| File | record `DProject` | `data.viewpoints` |
|---|---|---|
| `shapes.ts` | 1 | `["Pointer1705376874098_USER_18704"]` |
| `statechartplus.ts` | 1 | `["Pointer1704689488582_USER_102"]` |
| `conflictsimulation.ts` | 1 | campo assente nella finestra |
| `first.ts`, `second.ts`, `sequence.ts`, `statechartplus_old.ts` | 0 | — |

**Controllo positivo, ed è quello che rende il risultato una prova**: `Pointer_ViewPointDefault` compare **37 volte** in `shapes.ts` e **43 volte** in `statechartplus.ts` (come record in `idlookup`, come `viewpoint` delle view, come `activeViewpoint`). Il token *è* nel corpus, e ciò nonostante **non è in `DProject.viewpoints`**. Il silenzio è un risultato negativo, non una ricerca rotta.

**Conseguenza per la Fase 2**: il filtro aggiunto in `get_viewpoints` è una cintura di sicurezza, non un requisito. Va messo lo stesso — costa una riga e copre i salvataggi che il repo non contiene — ma la fetta non dipende da lui.

---

## Q7 — Duplicati

**Confermato.** `get_viewpoints` (`classes.ts:3323-3325`) concatena e basta:

```typescript
return LViewPoint.fromPointer([...Defaults.viewpoints, ...(context.data.viewpoints || [])]);
```

Nessun `duplicateRemover`, a differenza di `get_views` (`:3297-3300`), che ne ha uno esplicito. Se il `Default` fosse in entrambe le liste comparirebbe **due volte** — ed è esattamente lo scenario che Q6 esclude empiricamente.

---

## Q8 — Il valore attivo residuo

**Sì, `state.viewpoint` può valere `'Pointer_ViewPointDefault'`, e c'è un caso reale nel repo.**

Due strade indipendenti:

1. **Dalla lista attuale**: oggi il `Default` è nel dropdown (root array, Q4), quindi un utente può selezionarlo e `activateViewpoint` scrive `SetRootFieldAction.new('viewpoint', vpId)` (`lastViewpoint.ts:60`).
2. **Da un salvataggio**, e questo è misurato: `frontend/src/examples/statechartplus.ts` porta, sul suo record `DProject`:
   ```
   "activeViewpoint": "Pointer_ViewPointDefault"
   ```
   (`shapes.ts`, per contrasto, ha `"activeViewpoint": "Pointer1705376874098_USER_18704"` — il controllo che il campo non sia costante nel corpus.)

C'è anche una terza strada, di default: `get_activeViewpoint` (`classes.ts:3334-3336`) ritorna `Defaults.viewpoints[0]` quando `data.activeViewpoint` è vuoto, e `DProject.activeViewpoint` è dichiarato `Pointer<DViewPoint, 1, 1> = Defaults.viewpoints[0]` (`classes.ts:2924`). È la cardinalità 1..1 che il prompt dichiara fuori scope, e che qui si vede all'opera.

### Che cosa mostra il `<select>` con un valore senza `<option>`

```typescript
Toolbar.tsx:421-431
    <select value={activeViewpointId || ''} ... >
        <option value="">No viewpoint</option>
        {viewpoints.map(vp => <option key={vp.id} value={vp.id}>{vp.name}</option>)}
    </select>
```

React assegna `select.value = activeViewpointId`; il DOM, per specifica, quando il valore non corrisponde a nessuna option porta `selectedIndex` a **-1**, e il controllo si disegna **vuoto** — non ripiega sulla prima voce, e non emette nessun errore né warning.

**Grado di certezza**: derivato dalla specifica HTML e dal comportamento noto di React su `<select>` controllati, **non eseguito in un browser in questa sessione**. Lo dichiaro invece di spacciarlo per misura.

**Conseguenza per la Fase 2 (R6)**: il punto **3b non è un rifinimento, è un requisito**. Il punto 3a toglie il `Default` dalla lista; su `statechartplus` — cioè su un progetto che esiste — senza 3b il selettore si presenterebbe **vuoto** invece che «Abstract syntax». La normalizzazione di sola lettura chiesta dal prompt è esattamente la cura, e la sua clausola «non scrivere niente nello store da qui» è corretta: scrivere significherebbe mutare `activeViewpoint` all'apertura di ogni progetto vecchio.

---

## Q9 — Viewpoint e canvas M2

**Confermato su tutti e quattro i punti.** Il selettore su M2 è inerte, e l'evidenza è questa:

**(a) `ClassNode.tsx` non risolve IR.** Misura: pattern `useIRView|getIRIndex|IRNodeContent|irResolve|viewpoint/ir` su `ClassNode.tsx` → **0**. Controllo positivo, stessa forma di comando su `ObjectNode.tsx` → **11**. La ricerca ha segnale.

**(b) Il ramo `jsxString` di `ClassNode.tsx:424` è irraggiungibile in editor-v2.** Misura: `jsxString:` (assegnazione) sotto `components/editor-v2/` → **1 riga**, ed è la dichiarazione della prop di `ViewpointRenderer` (`ViewpointRenderer.tsx:4`). Controllo positivo su `frontend/src` → **8 righe**, tutte fuori da editor-v2 (`classes.ts:1086`, `UX.tsx:260`, `view.tsx:326,336,798`, `viewpoint.ts:32`, `store.tsx:192`). Le costruzioni di `ClassNodeData` sono letterali espliciti senza spread (`EditorV2.tsx:2093-2098`, `:2107-2112`), quindi `data.jsxString` non arriva nemmeno per propagazione.
*Residuo di incertezza dichiarato*: `ClassNodeData` ha un index signature `[key: string]: unknown` (`types.ts:128`), quindi un ipotetico spread futuro potrebbe iniettarlo senza errore di tipo. Oggi non succede.

**(c) `getIRIndex` alimenta solo il mondo M1.** Consumatori (esclusi i test): `EditorV2.tsx:167` (`isIREdgeLayoutPersistable`) e `:965` (propagazione dimensione), `useIRContainment.ts` (4 siti), `irResolve.ts` (4 siti). Nessuno passa da `ClassNode`, `PackageNode` o `EnumNode`.

**(d) `activateViewpoint` scrive stato globale di progetto, non per modello.** `utils/lastViewpoint.ts:49-62`: `SetFieldAction` su `project.activeViewpoint` più `SetRootFieldAction` su `state.viewpoint`. Nessuna chiave per modello. La preferenza *per modello* esiste (`writeEditorPrefs`), ma è un'altra cosa e la scrive `EditorSwitch`.

**(e) La rehydration per modello esce subito su M2.** `EditorSwitch.tsx:86-87`:
```typescript
useEffect(() => {
    if (isMetamodel) return;
```

**Sintesi**: un selettore attivo su un tab M2 cambierebbe `project.activeViewpoint` — stato **globale** — e quindi la resa dei tab **M1**, senza cambiare un pixel dove lo si è usato. La scelta del prompt (mostrarlo `disabled`, con la sola voce «Abstract syntax») è coerente con la misura.

---

## Q10 — Perimetro della pill

**Tre occorrenze in tutto il repo, su qualunque tipo di file:**

| Sito | Che cos'è |
|---|---|
| `components/editor-v2/Toolbar.tsx:435` | `className` del `<button>` (con i due modificatori `--concrete` / `--active`) |
| `components/editor-v2/Toolbar.tsx:438` | `<span className="toolbar-syntax-pill__dot" />` |
| `components/editor-v2/EditorV2.scss:458` | apertura del blocco SCSS |

Il blocco SCSS va da **457** (commento di sezione `// ── Abstract / Concrete syntax pill ──`) a **493**, e contiene `&--active`, `&--concrete`, `&__dot`. Rimosso il bottone, resta senza consumatori.

**Nessun test e nessuno snapshot**: `find . -name "*.snap"` → **0 file** nell'intero repo. Non esiste la categoria di artefatto che potrebbe dipenderne.

Controllo positivo con la stessa forma di comando: `toolbar-viewpoint-selector|toolbar-viewpoint-group` → **4 righe** (`Toolbar.tsx:418,420`, `EditorV2.scss:411,418`). La ricerca raggiunge il suo soggetto.

**Correzione a `CLAUDE.md` §7.2 (R7)**: §7.2 dichiara «1 residual `var(--accent)` in `EditorV2.scss` awaiting cleanup». Misurato oggi: `var(--accent[,)]` → **5 occorrenze** (righe 475, 900, 2298, 2327, 2343), di cui **una sola** dentro il blocco della pill (:475). Le altre 14 righe che contengono `var(--accent` usano `--accent-muted` / `--accent-subtle`, che sono token diversi e non nella lista legacy. Rimuovere la pill porta il residuo **da 5 a 4**: **non chiude il ticket**, e il commit non deve dichiarare di averlo chiuso.

---

## Rischi individuati

**R1 — `ViewParentingFields` perde una destinazione, e in un caso perde il bottone.** In un progetto con un solo viewpoint autorato, `moveTargets` passa da `[Default]` a `[]` e il gate `moveTargets.length > 0` (`ViewParentingFields.tsx:99`) nasconde «Move to viewpoint…». È l'unica lettura **funzionale** della lista. Non è una rottura, ma non è «sola visibilità».

**R2 — `Dashboard.tsx:369-372`: le soglie dell'illustrazione si spostano di uno.** Le quattro immagini sono scelte su `project.viewpoints.length <= 2` / `> 2`. Con il prepend, `length = 1 + N`; senza, `length = N`. La soglia effettiva passa da «almeno 2 viewpoint autorati» a «almeno 3». Progetti con esattamente 2 viewpoint autorati cambiano illustrazione. Il file **non è nel perimetro della Fase 2**.

**R3 — `Dashboard.tsx:390`: una frase diventa falsa.** «These models are explored and analyzed through **N viewpoints** (including the default ones)». Dopo la fetta il numero non include più le default, e la parentetica va tolta o riscritta. Anche questo è fuori perimetro dichiarato.

**R4 — `Dashboard.tsx:463` è una quarta lista utente non censita.** `project.viewpoints.map(vp => ...)` rende una riga per viewpoint con Open / Duplicate / Delete. Oggi il `Default` è lì ed è **duplicabile e cancellabile** dall'utente; dopo, sparisce. È un miglioramento, ma va nella lista dei controlli visivi, che nel prompt si ferma a tre superfici.

**R5 — «Default» si libera come nome utente.** `ProjectEditor.tsx:2869` e `NestedView.tsx:49` costruiscono le liste di nomi occupati dalla stessa sorgente. Coerente con la scelta «per puntatore e mai per nome», ma è un cambiamento osservabile.

**R6 — Il punto 3b è obbligatorio, non opzionale.** Vedi Q8: esiste nel repo un progetto salvato con `activeViewpoint = Pointer_ViewPointDefault`. Applicare 3a senza 3b gli darebbe un selettore **vuoto**.

**R7 — L'affermazione di `CLAUDE.md` §7.2 sul residuo `--accent` è stantìa** (5, non 1). Vedi Q10. Da correggere in un giro di calibrazione, non in questa fetta.

**R8 — `Selectors.getViewpoints()` (`selectors.ts:98-101`) è codice morto.** Misura: `getViewpoints()` → **1 riga**, la definizione. Controllo positivo con segnale: `Selectors.<metodo>(` fuori da `selectors.ts` → **48 righe**. Non toccarlo in questa fetta (regola 9: non rimuovere codice apparentemente inutilizzato), ma è rilevante: se qualcuno lo risvegliasse leggerebbe la root array, non il getter filtrato.

**R9 — `pages/Project.tsx:72-77` calcola e butta via.** `vparr` → `allViews` → `viewsDeDuplicator`: nessuno dei tre è letto, il `return` rende solo `<Dashboard>` e `<CollaborativeAttacher>`. Nessun impatto dalla fetta; registrato perché è l'unico sito che chiama `vp.allSubViews` fuori dal getter.

---

## Domande aperte per Alfonso

1. **R2/R3 — `Dashboard.tsx` entra nel perimetro o no?** Le soglie dell'illustrazione e la frase «(including the default ones)» sono conseguenze dirette della modifica al getter, su un file che la Fase 2 non elenca. Tre uscite: (a) allargare il perimetro di un file e sistemare soglie e copy nello stesso commit; (b) lasciarle e aprire una fetta di coda; (c) lasciare le soglie (sono decorative) e correggere la sola frase, che è l'unica cosa *falsa*. Propendo per (c), ma è una scelta di prodotto.

2. **R1 — il bottone «Move to viewpoint…» che sparisce nei progetti a un viewpoint: accettabile?** Tecnicamente corretto (non c'è dove spostare) ma è un'affordance che oggi c'è e domani no. Se non va bene, la cura non è in questa fetta: sarebbe una voce «New viewpoint…» nel menu di spostamento.

3. **R4 — la lista di card in `Dashboard.tsx:463` va nei controlli visivi?** Oggi permette di **duplicare e cancellare** il `Default`. Vale la pena verificarlo prima e dopo, e forse è la superficie che rende più evidente il senso della fetta.

4. **Q10/R7 — la correzione a `CLAUDE.md` §7.2 la faccio in questa fetta o in un giro di calibrazione a sé?** È una riga di documentazione che oggi dice un numero sbagliato.

5. **Q6 — il filtro difensivo in `get_viewpoints` resta, dato che la misura dice che non serve?** Costa una riga e copre i salvataggi fuori repo, che sono la maggioranza. Consiglio di tenerlo, ma il commento dovrebbe dire che è una cintura e non un requisito, altrimenti il prossimo lettore assume che il caso si verifichi.

---

## Hard stop

Fase 1 chiusa. **Nessuna modifica al codice**: `git status --porcelain` su `frontend/` vuoto a fine task. Fase 2 non iniziata, in attesa di go-ahead esplicito.
