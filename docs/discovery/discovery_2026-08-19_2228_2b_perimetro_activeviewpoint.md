# Discovery — perimetro delle dereferenziazioni di `activeViewpoint` (2.228, slice 2, commit 2b)

**Data**: 2026-08-19 · **Branch**: `alfonso-frontend-jjtl` · **HEAD locale**: `a957d9ceb`
**Prompt**: 2026-08-19 17:34 (sostituisce la sezione 2b di
`claude_2026-08-19_0115_prompt_2228_slice2_activeviewpoint.md`)
**Fase**: 1, read-only. Nessun file di codice modificato.

---

## 0. Obiettivo

Stabilire per lettura il perimetro **candidato** dei siti che dereferenziano `activeViewpoint`, e
raccogliere i fatti che il commit 2b-ii deve conoscere prima di scrivere l'adapter
`'2.227 -> 2.228'`. Il perimetro **reale** lo dichiara il compilatore in 2b-i: questo documento e'
la previsione contro cui misurare la delta.

---

## 1. File letti

- `frontend/src/joiner/classes.ts` (righe 1170-1195, 2890-2930, 3010-3025, 3345-3370, 3700-3712, 1685-1712)
- `frontend/src/components/editors/views/NestedView.tsx` (30-140, 300-345, 505-575)
- `frontend/src/redux/selectors/selectors.ts` (95-115, 515-560)
- `frontend/src/view/viewElement/view.tsx` (365-385, 895-910)
- `frontend/src/utils/lastViewpoint.ts` (135-170)
- `frontend/src/components/editor-v2/Toolbar.tsx` (195-240)
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (righe con `activeViewpointId`)
- `frontend/src/components/viewParenting/ViewParentingFields.tsx` (49-50)
- `frontend/src/api/persistance/projects.ts` (39-120, 202-300, 300-350)
- `frontend/src/components/topbar/SaveManager.ts` (30-60)
- `frontend/src/redux/VersionFixer.tsx` (85-160, 1056-1175)
- `frontend/src/redux/__tests__/versionfixer_2227_migration.test.ts` (1-60, struttura describe/it)
- `frontend/src/common/Defaults.ts` (100-115)

**Nota sulla ricerca.** `grep` interattivo qui e' `ugrep --ignore-files`; tutte le ricerche di questo
report sono state eseguite con `command grep` (BSD grep 2.6.0-FreeBSD) per avere `-I` e i flag reali.
Ogni asserzione di assenza porta il proprio controllo positivo, dichiarato sotto (R-RAIL-28).

---

## 2. Findings

### 2.1 Elenco completo dei siti (domanda 1)

Ricerca eseguita: `command grep -rlI "activeViewpoint" frontend/src frontend/scripts`, poi conteggio
per file e listato riga per riga. Dodici file, di cui tre esclusi come dati/sonda:
`examples/statechartplus.ts`, `examples/shapes.ts` (fixture JSON a riga singola),
`scripts/smoke/_tmp_2a.ts` (sonda temporanea non committata).
`utils/globalCssAudit.ts` compare come «Binary file matches» ma il match e' su
`activeViewpointId`, parametro locale, non sul campo.

**A — letture attraverso il proxy L, NUDE (candidate a errore di compilazione)**

| # | Sito | Testo | Previsione |
|---|---|---|---|
| A1 | `joiner/classes.ts:1181` | `LProject.getProject()?.activeViewpoint.id \|\| Defaults.viewpoints[0]` | errore: `?.` sta su `getProject()`, non sul campo |
| A2 | `components/editors/views/NestedView.tsx:82` | `let activeViewpointId: Pointer<DPointerTargetable> = project.activeViewpoint.id;` | errore |
| A3 | `redux/selectors/selectors.ts:529` | `let activevpid: Pointer<DViewElement> = project.activeViewpoint.id;` | errore |
| A4 | `utils/lastViewpoint.ts:146` | `const activeVP: LViewPoint \| undefined = LProject.getProject()?.activeViewpoint;` | errore: `\| null` non e' assegnabile a `LViewPoint \| undefined` |
| A5 | `view/viewElement/view.tsx:373` | `let activeVP: LViewPoint \| undefined = LProject.getProject()?.activeViewpoint;` | errore, stesso motivo di A4 |
| A6 | `components/editors/views/NestedView.tsx:544` | `ret.active = ret.project.activeViewpoint;` | errore: `StateProps.active` e' dichiarato `LViewPoint` |

**B — letture del proxy senza accesso a membro, gia' sicure**

| # | Sito | Testo | Previsione |
|---|---|---|---|
| B1 | `NestedView.tsx:110` | `const previousViewpoint = project.activeViewpoint;` | nessun errore: il tipo si allarga, e l'unico consumo (riga 114) e' `previousViewpoint?.id` |
| B2 | `NestedView.tsx:314` | idem, consumo a riga 317 | nessun errore |

**C — letture gia' guardate da optional chaining sul campo**

| # | Sito | Testo |
|---|---|---|
| C1 | `TreeViewSidebar/TreeViewContent.tsx:2328` | `ret.activeViewpointId = project?.activeViewpoint?.id \|\| undefined;` |
| C2 | `viewParenting/ViewParentingFields.tsx:49` | `LProject.getProject()?.activeViewpoint?.id` |

**D — scritture (non lette), nessun errore atteso**

| # | Sito | Testo |
|---|---|---|
| D1 | `NestedView.tsx:111`, `:315` | `project.activeViewpoint = ptr as any;` — il cast `as any` neutralizza la firma del setter |
| D2 | `utils/lastViewpoint.ts:60` | `SetFieldAction.new(projectId, 'activeViewpoint', viewpointId \|\| null, ...)` — scrittura D diretta, gia' allineata a `null` da 2a |

**E — letture del campo D grezzo (non passano dal proxy L)**

| # | Sito | Testo | Previsione |
|---|---|---|---|
| E1 | `view/viewElement/view.tsx:903` | `if (!(dproject && dproject.activeViewpoint === c.data.id)) return '';` | nessun errore: `===` fra `T \| null` e `T` e' lecito |
| E2 | `api/persistance/projects.ts:338` | `pointers.activeViewpoint = raw.activeViewpoint;` | nessun errore: il bersaglio si allarga, la sorgente resta |

**F — dichiarazioni e accessori, il perimetro dichiarato del commit**

| # | Sito | Testo |
|---|---|---|
| F1 | `classes.ts:2899` | `ProjectPointers.activeViewpoint: Pointer<DViewPoint, 1, 1> = Defaults.viewpoints[0];` |
| F2 | `classes.ts:2924` | `DProject.activeViewpoint: Pointer<DViewPoint, 1, 1> = Defaults.viewpoints[0];` |
| F3 | `classes.ts:3017` | `activeViewpoint!: LViewPoint;` (dichiarazione L) |
| F4 | `classes.ts:3352-3354` | `get_activeViewpoint` con fallback `\|\| Defaults.viewpoints[0]` |
| F5 | `classes.ts:3355-3362` | `set_activeViewpoint(val0: Pack1<this['activeViewpoint']>, ...)` |

**Conclusione sulla domanda 1.** I due siti censiti dall'architetto (A1, A3) e il terzo trovato dal
prompt (A2) sono **tre di sei**. Mancano A4, A5 e A6, tutti su superficie viva. La tesi di R-IRN-25 —
che l'enumerazione affidabile la fa il compilatore e non il grep — regge anche contro questo grep,
che e' piu' largo del precedente e resta una **previsione**, non un elenco.

### 2.2 `NestedView.tsx` (domanda 2)

- `NestedView.tsx:82` **non e' l'unico** punto del file che il compilatore toccherebbe: c'e' anche
  `:544` (A6). E' pero' l'unico deref **nudo con accesso a membro**; `:110` e `:314` leggono il proxy
  e lo consumano con `?.`.
- `StateProps.active` e' dichiarato `active: LViewPoint;` (riga 532) e alimentato da
  `mapStateToProps` a riga 544.
- Il consumatore e' `const active = props.active;` a riga 44. **`active` e' assegnato e mai letto.**
  Ricerca eseguita:
  `command grep -nIE '(^|[^a-zA-Z0-9_.$-])active([^a-zA-Z0-9_-]|$)' NestedView.tsx` → quattro righe,
  di cui la 44 e' l'unica occorrenza come identificatore; le altre tre sono `'active'` dentro
  template di className (368), testo di tooltip (409) e la dichiarazione dell'interfaccia (532).
  Controllo positivo sulla stessa espressione: la 44 stessa compare, quindi il pattern ha segnale.
  La catena `mapStateToProps → StateProps.active → const active` e' quindi **una scrittura morta**
  (§5, sub-rule «verify consumers»). Da censire, **non** da rimuovere in 2b (Rule 9): il minimo per
  chiudere l'errore e' allargare la dichiarazione a `LViewPoint | null`.

### 2.3 `Selectors.getViewpoint()` (domanda 3)

`selectors.ts:102-105`, dichiara `LViewPoint` e restituisce
`LPointerTargetable.fromPointer(state.viewpoint)`.

- **Zero chiamanti.** Ricerca eseguita: `command grep -rnI "getViewpoint\b" frontend/src` filtrata da
  `getViewpoints` → una sola riga, la definizione stessa.
- Controllo positivo sulla stessa forma di ricerca:
  `command grep -rnI "getAllViewElements" frontend/src` → tre righe, la definizione (89) piu' due
  chiamanti (522 in commento, 525 vivo). La ricerca ha segnale.
- **E' un quinto lettore della root `state.viewpoint`, morto**, che R-IRN-21 non nomina. R-IRN-21
  censisce quattro lettori vivi (`EditorSwitch.tsx:55`, `Toolbar.tsx:202`, `irResolveCore.ts:117`,
  `irResolveCore.ts:139`): il conteggio resta corretto per i lettori **vivi**. Nessuna conseguenza su
  2b, perche' legge la root e non il campo, e perche' nessuno lo chiama. Censito, non toccato.

### 2.4 Inizializzatori (domanda 4)

**Sono esattamente due.** Ricerca eseguita: `command grep -rnI "Defaults.viewpoints\[0\]" frontend/src`
→ otto occorrenze, di cui **due** sono inizializzatori di campo:

- `classes.ts:2899` — `ProjectPointers.activeViewpoint`
- `classes.ts:2924` — `DProject.activeViewpoint`

Entrambi `Pointer<DViewPoint, 1, 1> = Defaults.viewpoints[0]`. Le altre sei occorrenze sono: il
fallback di `newDefault` (1181, = A1), il fallback del getter (3353, = F4),
`lastViewpoint.ts:157` e `view.tsx:339-340` (fallback di risoluzione del viewpoint padre, fuori
perimetro, coperti da R-IRN-14 e R-IRN-23), `store.tsx:324` (assert di init). **Nessun terzo
inizializzatore.**

Controllo incrociato con `command grep -rnI "Pointer<DViewPoint" frontend/src`: le sole occorrenze
`Pointer<DViewPoint, 1, 1>` su `activeViewpoint` sono le due dichiarate. Le altre `1, 1` sono
`DViewPoint.id` / `LViewPoint.id` (`viewpoint.ts:28,53`), fuori perimetro.

### 2.5 Catena di migrazione (domanda 5)

- **L'ultimo adapter nell'albero locale e' `'2.226 -> 2.227'`** (`VersionFixer.tsx:1056-1173`),
  identico a origin. **`'2.227 -> 2.228'` non esiste.** Ricerca eseguita:
  `command grep -nI "private \['" frontend/src/redux/VersionFixer.tsx` → 30 adapter, l'ultimo e'
  `2.226 -> 2.227`; controllo positivo: la stessa ricerca elenca tutti gli altri, quindi ha segnale.
- **`get_highestversion()` non legge una costante**: `VersionFixer.setup()` (righe 85-108) enumera
  `Object.getOwnPropertyNames(VersionFixer.prototype)`, scarta una lista fissa di nomi di servizio,
  spezza ogni chiave residua su `' -> '`, e fa
  `VersionFixer.highestVersion = Math.max(VersionFixer.highestVersion, to)`. Aggiungere il metodo
  `['2.227 -> 2.228']` **e' sufficiente**: nessuna costante da incrementare, nessuna registrazione
  esplicita. `update()` (110-146) itera `while (currVer !== highestVersion)` e ha un assert di
  «missing version adapter» che si accende se la catena ha un buco.
- **Forma dell'adapter vicino** (`2.226 -> 2.227`): apre con
  `const idlookup: any = s.idlookup; if (!idlookup || typeof idlookup !== 'object') return s;`, cicla
  con `for (const k in idlookup)` e guardia `if (!e || typeof e !== 'object' || ...) continue;`,
  chiude con un log condizionato dal conteggio:
  `` console.log(`[VersionFixer 2.226 -> 2.227] bonifica: ${n} ...`) `` e `return s;`.
  Il nuovo adapter va inserito dopo la sua chiusura (riga 1173), prima della `}` di classe (1174).

### 2.6 Forma del test (domanda 6)

`frontend/src/redux/__tests__/versionfixer_2227_migration.test.ts`, 328 righe.

- **Testa (righe 1-19)**: blocco JSDoc che dichiara «PROOF / PROTOTYPE for the VersionFixer migration
  `2.226 -> 2.227`», che il corpo sotto **e' il codice esatto** da inlinare in `VersionFixer.tsx`,
  che e' **duplicato e non importato** per non trascinare le dipendenze pesanti in vitest node, e cita
  il discovery di riferimento. Poi elenca le assunzioni ratificate.
- **Corpo**: `export function migrate_2226_to_2227(s: DStateLike): DStateLike { ... }` — copia verbatim
  dell'adapter, preceduta da un commento a barre
  `// MIGRATION BODY — paste verbatim into VersionFixer.tsx as ['2.226 -> 2.227'].`
- **Tipi locali**: `type AnyRec = Record<string, any>;` e
  `interface DStateLike { idlookup: AnyRec; objects?: string[]; values?: string[]; version?: { n: number }; [k: string]: any; }`
  — evita di importare `DState`.
- **Struttura**: tre `describe` tematici, ciascuno con `it` singoli e fixture fabbricate a mano da
  funzioni factory; idempotenza verificata con `expect(twice).toEqual(onceSnapshot)`; no-op verificato
  con snapshot `JSON.parse(JSON.stringify(...))`.

---

## 3. Dipendenze e rischi per 2b-i

### 3.1 `Pack1` non ammette `null` — errore atteso dentro `classes.ts`

`Pack1` (`classes.ts:1700`) e' vincolato
`Pack1<LL extends orArr<LPointerTargetable> | undefined, ...>`. Con
`this['activeViewpoint'] = LViewPoint | null`, la firma `set_activeViewpoint(val0: Pack1<this['activeViewpoint']>, ...)`
(F5) **viola il vincolo**: `null` non e' assegnabile a `orArr<LPointerTargetable> | undefined`.

Ricerca eseguita: `command grep -rnI "Pack1<[^>]*null" frontend/src` → una sola riga, la definizione
**commentata** a 1687 (la versione viva a 1700 ha perso il `| null` che quella morta aveva). Non
esiste alcun precedente di campo puntatore L nullable: ricerca
`command grep -nE "^\s+[a-zA-Z_]+!?:\s*L[A-Za-z]+ \| null;"` su `classes.ts`, `view.tsx` e `model/*.tsx`
→ zero risultati. **`activeViewpoint` sarebbe il primo.**

Rimedio minimo previsto, da confermare col compilatore:
`Pack1<NonNullable<this['activeViewpoint']>> | null`. Non cambia comportamento — il corpo fa gia'
`Pointers.from(val0)`, e `null` arrivava comunque per la via `as any` di D1.

### 3.2 `fromPointer(null)` e' tipizzato `undefined`

Gia' noto (Fase 1 del fronte, §5.1) e ripetuto dal prompt: dove serve, firma dichiarata a mano piu'
cast, non rimozione del `||`. In 2b-i il getter **non si tocca**, quindi il punto si presenta solo in
2b-ii.

### 3.3 Il perimetro puo' allargarsi oltre la previsione

Sei errori previsti su cinque file (`classes.ts`, `NestedView.tsx`, `selectors.ts`,
`lastViewpoint.ts`, `view.tsx`), piu' quello di §3.1 dentro `classes.ts`. Se il compilatore ne
segnala altri fuori da questi cinque, il prompt prescrive **fermarsi e segnalare**. Il gate di
chiusura resta l'identita' byte a byte con la baseline.

### 3.4 Baseline di typecheck misurata ora

Eseguito `npm run typecheck` su `a957d9ceb` pulito: **exit 2, 33 errori**, output completo (non una
finestra `tail`). Distribuzione per file: `UnifiedSettingsModal.tsx` 7, `Settings/…/sections/index.ts` 7,
`Measurable.tsx` 6, `api/data.ts` 3, e 1 ciascuno in `Dashboard.tsx`, `SettingsModalContext.tsx`,
`ProvidersSection.tsx`, `PromptsSection.tsx`, `settings/…/index.ts`, `PromptsSettingsSection.tsx`,
`ProjectEditor.tsx`, `ChatMessages.tsx`, `EditorV2.tsx`, `Dummy.ts`.
`sha256` delle sole righe `error TS`, ordinate:
`e8f17ceecf7d9f70e89e2b9db80959de9a1631e094faca6c132d341f12cfb21e`.
Questo hash e' il riferimento contro cui si chiude 2b-i.

---

## 4. Fatti per 2b-ii — dove finisce `activeViewpoint` su disco

R-IRN-26 descrive la catena come: scrittura doppia (top-level del record + copia dentro il blob
compresso), **zero** riletture, campo che rinasce all'inizializzatore. La lettura conferma la catena
di scrittura e conferma la rilettura zero **sul percorso offline**, ma trova **una rilettura viva sul
percorso online**. Dettaglio:

- `ProjectsApi.save` (`projects.ts:92-119`) fa `{...project.__raw}`, quindi il campo e' nel record;
  `U.compressedState(dProject)` produce il blob; `Offline.save` **oppure** `Online.save` a seconda di
  `U.isOffline()`.
- `ProjectsApi.getAll` (`projects.ts:60-64`) smista allo stesso modo:
  - **`Offline.getAll` (`projects.ts:208-231`)**: ricostruisce con
    `DProject.new(project.type, project.name, project.state, [], [], project.id)` e ricopia i campi
    per nome con nove `SetFieldAction` (`creation`, `lastModified`, `description`,
    `viewpointsNumber`, `metamodelsNumber`, `modelsNumber`, `isFavorite`, `tagNames`, `version`).
    **`activeViewpoint` non c'e'.** R-IRN-26 confermata su questo ramo (dice «otto campi», sono nove;
    la sostanza — `activeViewpoint` assente — regge).
  - **`Online.getAll` (`projects.ts:300-347`)**: costruisce `pointers: ProjectPointers` e fa
    **`pointers.activeViewpoint = raw.activeViewpoint;`** (riga 338), poi `DProject.new2(pointers, ...)`.
    Sembra una rilettura del valore top-level, e **non lo e'**: verificato dopo l'hard stop 1, la
    Fase 1 del fronte lo aveva gia' stabilito in
    `discovery_2026-08-18_2228_seed_e_activeviewpoint.md` §5.4 — `GetAllProjects.ts` elenca dodici
    campi e `activeViewpoint` non e' fra questi, e `DProject.new2` (`classes.ts:2982-2992`) legge
    solo `pointers.father` e `pointers.id`. L'unico effetto vivo della riga e' mettere la chiave in
    `pointers` e cosi' **sopprimere** la copia successiva via `if (k in pointers) continue`
    (`projects.ts:343`). **Correzione a questo report**: la formulazione consegnata all'hard stop 1,
    «qui il valore top-level viene riletto, punto che R-IRN-26 non copre», e' sbagliata su entrambi
    i pezzi. Il punto e' coperto, e non e' una rilettura. R-IRN-26 come ratificata dice la cosa
    giusta.
- `SaveManager.load` (`SaveManager.ts:39-56`) lavora sul blob decompresso e, per i progetti **mai
  salvati**, inietta il record top-level dentro lo stato con
  `save.idlookup[project.id] = {...project, state:''}` (riga 51) — **prima** di
  `VersionFixer.update(save)` (riga 55). Quindi l'adapter vede anche quel caso.

**Conseguenza operativa.** La scelta di R-IRN-26 — l'adapter opera su `s.idlookup`, il campo top-level
non si tocca — e' corretta, e la superficie che `VersionFixer.update` vede resta una sola. La frase
«in rilettura non ne sopravvive niente» vale su **entrambi** i rami, per due ragioni diverse: offline
il campo non e' fra i nove ricopiati per nome; online la riga 338 scrive una chiave che nessuno
legge. Nessun percorso rimette `Pointer_ViewPointDefault` in `idlookup` scavalcando l'adapter.

---

## 5. Domande aperte per Alfonso

1. **Il documento prompt citato non esiste in repo.**
   `docs/prompts/claude_2026-08-19_0115_prompt_2228_slice2_activeviewpoint.md` non c'e'; la cartella
   si ferma a `claude_2026-08-18_1656_prompt_2228_fase2.md`. Ricerca eseguita:
   `ls docs/prompts/ | command grep -i "2228\|0115"` → tre file, nessuno dei quali e' quello. Non
   blocca 2b-i ne' 2b-ii, ma **la sezione «2c» vive in quel file** e serve dopo. Va recuperata prima
   di aprire 2c. Nota che nemmeno i prompt di slice 1 e 2a risultano committati: sembra una prassi
   recente, non un file perduto. Regola 15 di `CLAUDE.md` chiede lo stop su un path citato e assente:
   lo segnalo qui e non procedo oltre l'hard stop.
2. **`ProjectPointers.activeViewpoint` e' un tipo o un default?** L'inizializzatore F1 vive in una
   classe che `Online.getAll` usa come **DTO** (`let pointers: ProjectPointers = {} as any;`, riga 332):
   il valore di default non viene mai valorizzato per quella via, perche' l'oggetto nasce da `{}` con
   cast. Portarlo a `null` in 2b-ii e' comunque corretto e richiesto dal prompt, ma la previsione
   misurabile («un `Pointer_ViewPointDefault` che ricompare distingue migrazione-non-applicata da
   inizializzatore-dimenticato») ha potere solo su F2. Confermi che F1 si porta a `null` per igiene di
   coerenza, senza attendersi da lui un effetto osservabile?
3. **`NestedView.StateProps.active` e' morto (§2.2).** In 2b-i lo allargo a `LViewPoint | null` — la
   modifica minima. La rimozione della catena morta (riga 44, 532, 544) e' fuori perimetro: la lascio
   con un `// TODO: cleanup` o non la annoto affatto?
4. **`Selectors.getViewpoint()` e' morto (§2.3).** Lo lascio esattamente com'e'. Confermi, o vuoi che
   il censimento finisca in `decisions.md` invece che solo qui?

Risposte ricevute nell'addendum del 2026-08-19 17:52: #2 «portalo a `null` lo stesso, e registra qui
che l'effetto e' nullo»; #3 «allarga e annota, non rimuovere». Le domande 1 e 4 restano aperte e non
cambiano il diff.

---

## 6. Delta — previsione di Fase 1 contro elenco del compilatore (commit 2b-i)

Allargati `LProject.activeViewpoint` a `LViewPoint | null` e i due campi D a `Pointer<DViewPoint, 0, 1>`
(valori inizializzatori invariati), `npm run typecheck` passa da 33 a **40** errori. I sette nuovi:

| Errore del compilatore | Previsto come |
|---|---|
| `classes.ts(1181,23): TS2531 Object is possibly 'null'` | A1 |
| `NestedView.tsx(82,58): TS18047 'project.activeViewpoint' is possibly 'null'` | A2 |
| `selectors.ts(529,49): TS18047 'project.activeViewpoint' is possibly 'null'` | A3 |
| `lastViewpoint.ts(146,15): TS2322 'LViewPoint \| null' not assignable to 'LViewPoint \| undefined'` | A4 |
| `view.tsx(373,13): TS2322` idem | A5 |
| `NestedView.tsx(544,5): TS2322 'LViewPoint \| null' not assignable to 'LViewPoint'` | A6 |
| `classes.ts(3355,47): TS2344 'this["activeViewpoint"]' does not satisfy 'orArr<LPointerTargetable> \| undefined'` | §3.1 |

**Delta = zero.** Sei siti piu' il vincolo di `Pack1`, esattamente i sette previsti, sugli stessi
cinque file. Nessun errore fuori dal perimetro dichiarato, nessun errore della baseline sparito
(il `diff` contro la baseline ordinata non ha righe `<`). La previsione per lettura ha retto; resta
vero che a formularla e' servito il censimento a tabella di
`discovery_2026-08-18_2228_seed_e_activeviewpoint.md` §5.2, che gli stessi siti li elencava gia'
tutti — vedi §8.

Un ottavo errore si e' presentato **dopo** la riparazione, non prima:
`classes.ts(3356,33): TS2769 No overload matches this call`. `Pointers.from` dichiara sia
`from(data: null | undefined): null` sia le forme `Pack1`, ma la risoluzione degli overload non
distribuisce su una unione, quindi l'argomento `Pack1<...> | null` non ne soddisfa nessuno preso
singolarmente. Chiuso con un cast sul solo ramo `null`, commentato in loco.

### 6.1 Riparazioni applicate

| Sito | Prima | Dopo |
|---|---|---|
| `classes.ts:1181` | `getProject()?.activeViewpoint.id \|\| ...` | `getProject()?.activeViewpoint?.id \|\| ...` |
| `classes.ts:3355` | `val0: Pack1<this['activeViewpoint']>` | `val0: Pack1<NonNullable<this['activeViewpoint']>> \| null` |
| `classes.ts:3356` | `Pointers.from(val0)` | `Pointers.from(val0 as Pack1<NonNullable<this['activeViewpoint']>>)` + commento |
| `NestedView.tsx:82` | `let activeViewpointId: Pointer<DPointerTargetable> = ....id` | `... \| undefined = project.activeViewpoint?.id` |
| `NestedView.tsx:532` | `active: LViewPoint;` | `active: LViewPoint \| null;` + due righe di commento `TODO: cleanup` |
| `selectors.ts:529` | `let activevpid: Pointer<DViewElement> = ....id` | `... \| undefined = project.activeViewpoint?.id` |
| `lastViewpoint.ts:146` | `const activeVP: LViewPoint \| undefined` | `const activeVP: LViewPoint \| null \| undefined` |
| `view.tsx:373` | `let activeVP: LViewPoint \| undefined` | `let activeVP: LViewPoint \| null \| undefined` |

Nessuna riparazione cambia il comportamento: finche' il getter fa fallback (2b-i non lo tocca), il
campo non e' mai `null`, quindi ogni `?.` introdotto e' inerte e ogni annotazione allargata non
ammette valori che oggi arrivino. I tre consumatori dei due `| undefined` nuovi
(`NestedView.tsx:130,336,519`, `selectors.ts:556`) sono tutti confronti `===`, che con `undefined`
darebbero `false` senza sollevare.

### 6.2 `Pointers.from(null)` — verifica richiesta dall'addendum

Letta l'implementazione: `classes.ts:1671-1675` apre con **`if (!data) return null;`**, e la lista
degli overload dichiara esplicitamente `public static from(data: null | undefined): null;`
(`classes.ts:1666`). `Pointers.from(null)` restituisce quindi `null` sia a runtime sia nel tipo, non
un id spurio. **Nessuna guardia serve nel setter** prima della `SetFieldAction`; il valore che
arriverebbe a `SetFieldAction` con `val0 === null` e' `null`, cioe' la forma canonica di R-IRN-11.

### 6.3 `ProjectPointers.activeViewpoint` — effetto nullo, registrato

Come chiede l'addendum e come dice R-IRN-25: l'unico sito di costruzione di `ProjectPointers` e'
`projects.ts:331`, `let pointers: ProjectPointers = {} as any`. Un cast non esegue gli
inizializzatori di campo, quindi il valore dichiarato su F1 **non gira mai**. Si allinea comunque, in
2b-ii, perche' due dichiarazioni dello stesso campo che dicono cose diverse ingannano chi legge.
L'effetto osservabile del flip verra' tutto da F2, `DProject.activeViewpoint`.

---

## 7. Gate del commit 2b-i

Tutti misurati sull'albero con le modifiche, output completo e non su finestra.

| Gate | Baseline | Misurato | Esito |
|---|---|---|---|
| typecheck | exit 2, 33 errori, `sha256 e8f17cee…21e` | exit 2, 33 errori, `sha256 e8f17cee…21e` | **identico byte a byte** (`diff` vuoto) |
| build | exit 0 | exit 0, solo il warning di chunk-size | identico |
| vitest | 1315 passati, 9 suite rosse su 59 | 1315 passati, 9 rosse su 59 | identico |
| smoke | 10 passati, 0 falliti, 2 skip | 10 passati, 0 falliti, 2 skip | identico |
| console smoke | 3 righe `IMPROVED` sui duplicate key | le stesse 3, nessuna `NEW` | scostamento noto R-IRN-10, non riallineato |
| `check:docs` | 3/3 | 3/3 | pass |
| `check:agents` | pass | pass | pass |

---

## 8. Correzione al racconto di R-IRN-25 — segnalata, non applicata

R-IRN-25 e' stata appesa **verbatim** come prescritto. Il suo racconto dice pero' che dei sei siti
«le ultime tre, `lastViewpoint.ts:146`, `view.tsx:373` e `NestedView.tsx:544`, le ha trovate il
compilatore». Verificato dopo l'hard stop 1: **non e' cosi'**.
`docs/discovery/discovery_2026-08-18_2228_seed_e_activeviewpoint.md` §5.2 («B2 — gli undici siti di
lettura, rivisti uno per uno») contiene una tabella di tredici righe che li elenca gia' tutti e tre,
`NestedView.tsx:544` e `lastViewpoint.ts:136` (stessa riga, numerazione precedente) marcati
esplicitamente **«misurato»**, e `view.tsx:373-375` annotato con la catena di guasto fino a
`view.tsx:442`. Il documento e' in repo da prima di questa passata.

Quello che regge di R-IRN-25 e' la **conclusione operativa** — l'allargamento del tipo e' l'oracolo,
e il gate e' l'identita' byte a byte con la baseline — piu' il fatto che il perimetro *dichiarato nel
prompt* fosse di due siti. Quello che non regge e' l'attribuzione al compilatore di una scoperta che
un discovery precedente aveva gia' fatto. Non riscrivo una ratifica di mia iniziativa: la segnalo
qui, e la correzione del testo e' decisione di Alfonso.

---

## 9. Stato

Fase 1 chiusa, **commit 2b-i eseguito**. Ratifiche R-IRN-25 e R-IRN-26 in `decisions.md`, tipo
allargato, sette siti riparati, gate tutti identici alla baseline.
Prossimo passo, **su go-ahead dopo la verifica visiva**: commit 2b-ii (flip a `null` del getter e dei
due inizializzatori, adapter `'2.227 -> 2.228'`, test di R-IRN-20).
