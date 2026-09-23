# Discovery / Piano — #157 Configurator + ambienti jjodel per ruolo

**Data**: 2026-09-23
**Branch (doc)**: `docs/157-standalone-configurator-plan`
**Stato**: **pianificazione, non implementato**. Nessun file di codice toccato. Questo documento
è la base di lavoro per l'esecuzione a fasi; le decisioni architetturali sono state prese
(§2) e le fasi sono descritte con criteri di accettazione (§5).
**Issue**: [FEATURE] Configurator screen for top-level model element access and role-based
customization (#157, autore @tmaog) — estesa dal committente (Juri) verso "ambienti jjodel
per ruolo" (§1.C).
**Autore piano**: Claude Code (Opus), sessione 2026-09-23.

---

## 1. La richiesta, riformulata come specifica

La #157 ha due parti; il committente ne aggiunge una terza, che è quella portante.

### 1.A — Configurator screen (base #157)
Una schermata che mostra **in alto** i tipi di elemento top-level del modello (es. dallo
screenshot dell'issue: `Scenario`, `CompetencyGoal`, `ClusterGoal`, `iSQD_Profile`) invece del
menu laterale delle metaclassi. Selezionando un tipo:
- si vede la lista delle istanze esistenti,
- si apre/edita il dettaglio di un'istanza,
- si crea una nuova istanza dalla stessa schermata.

Scopo: l'utente lavora sugli **elementi concreti** che ha creato, non naviga le metaclassi grezze.

### 1.B — Role-based customization (parte "additional" #157)
Definire, **per ruolo/profilo**, quali *tipi* di elemento e quali *campi* sono **visibili** e/o
**editabili** nel Configurator. Casi d'uso dell'issue:
- un *educator* crea `Scenario` ma NON modifica `CompetencyGoal` (li seleziona soltanto);
- un *pedagogical expert* crea `CompetencyGoal` ma non ha bisogno di vedere `iSQD_Profile`.

### 1.C — Ambiente jjodel dedicato per ruolo (estensione del committente)
Il configuratore genera un "ambiente" raggiungibile a un **URL specifico** dove il fruitore
lavora **solo** su: modelli (M1), sintassi concrete (viewpoint già definiti), Data Manager /
Configurator. **Non** sono editabili né visibili: metamodelli (M2), viewpoint/authoring della
sintassi concreta, validazione. Un solo *language developer* lavora nel jjodel classico; N
*fruitori* lavorano negli ambienti ristretti.

> Nota terminologica: "stand alone" è fuorviante — non è un'app separata, è una **modalità
> ristretta dello stesso jjodel**, risolta a partire dall'URL.

**Criterio di accettazione complessivo**: dato un progetto con metamodello + almeno una sintassi
concreta + Data Manager configurati dal developer, un fruitore che apre l'URL del proprio ruolo
può creare/editare istanze dei soli tipi consentiti (nel Configurator e/o sul canvas con la
sintassi concreta), e non ha **alcun** percorso UI per aprire M2/viewpoint-authoring/validazione.

---

## 2. Decisioni architetturali (prese)

Tre scelte, decise dal committente il 2026-09-23, determinano il phasing.

| # | Decisione | Scelta | Conseguenza |
|---|-----------|--------|-------------|
| D1 | Enforcement della restrizione | **Solo frontend (soft)** | Nessun lavoro backend. Il gate vive in LeftBar/DockManager/Toolbar/IRForm. |
| D2 | Come si "genera" l'ambiente | **Stesso progetto + ruolo in URL** | Sorgente di verità unica; niente snapshot/pubblicazione. |
| D3 | Dove vive la configurazione | **Entità dedicata nel D-layer** (non campi su `DProject`) | Nessun tocco al core `DProject`; versionabile con VersionFixer. |

**Modello risultante**: un "ambiente" è la coppia **(progetto, ruolo)**. URL:
`#/project?id=<PROJECT_ID>&role=<ROLE_ID>` (nome del parametro da fissare in F0). Senza `role` →
jjodel classico (developer). Con `role` → shell ristretta risolta dalla config.

### 2.1 ⚠️ Caveat di sicurezza (D1)
Con enforcement **solo frontend**, la restrizione è **UX, non sicurezza**: chi manipola URL,
Redux devtools o lo stato può aggirarla, e l'intero stato del progetto arriva comunque al client.
Va comunicato esplicitamente agli stakeholder della #157. Se in futuro serve confidenzialità
reale (nascondere dati a un ruolo, non solo i controlli), è un lavoro **backend** separato
(validazione identità/ruolo lato API/persistenza) — fuori da questo piano.

---

## 3. Analisi del sistema esistente (parti rilevanti)

### 3.1 Modello progetto e accesso via URL
- `DProject` — [joiner/classes.ts:3042](../../frontend/src/joiner/classes.ts#L3042): `type: 'public'|'private'|'collaborative'`
  ([:3052](../../frontend/src/joiner/classes.ts#L3052)), `author`, `collaborators: Pointer<DUser>[]`,
  `metamodels`, `models`, `graphs`, `viewpoints`, `activeViewpoint`. **Nessun** campo di ruolo,
  permesso o editabilità per-elemento.
- Apertura da URL query: `#/project?id=<ID>` → [pages/Project.tsx:101](../../frontend/src/pages/Project.tsx#L101)
  (`U.getProjectID_URL()`), reso da `Dashboard active='Project'`.
- Condivisione già esistente ma minimale: [utils/shareUtils.ts](../../frontend/src/utils/shareUtils.ts)
  genera l'URL pubblico e `canShareProject` = `type==='public'`. Unico gate = `type`.
- `duplicateProject` esiste ([api/persistance/projects.ts:253](../../frontend/src/api/persistance/projects.ts#L253))
  — non usato dal piano (D2 = stesso progetto), ma disponibile.

### 3.2 Lo shell e il "chrome" da restringere
- Shell = [pages/components/Dashboard.tsx](../../frontend/src/pages/components/Dashboard.tsx)
  (Navbar + LeftBar + DockManager + Toolbar + PropertiesWithTreeView).
- **Il menu laterale che l'issue vuole sostituire** è il *project sidebar* (`psb-*`) in
  [pages/components/LeftBar.tsx](../../frontend/src/pages/components/LeftBar.tsx): sezioni
  **Metamodels** / **Models** (con azione "instance manager") / **Viewpoints**, più azioni progetto
  (export, favorite, **share**, close) e creazione (`createM2`, create model, create viewpoint).
  È esattamente il chrome da nascondere in modalità fruitore.
- Tab system = [components/abstract/DockManager.tsx](../../frontend/src/components/abstract/DockManager.tsx):
  `open2()` (metamodel/model), `openManager()` (data manager, via :171), `openViewpoint()` (:246).
  Qui si decide cosa il fruitore può aprire.
- **Switch di sintassi concreta già esistente**: syntax picker del Toolbar
  ([components/editor-v2/Toolbar.tsx:82](../../frontend/src/components/editor-v2/Toolbar.tsx#L82), NAV2 / R-IRN-10)
  = "Abstract syntax" + una entry per viewpoint + la sentinella "Data manager"
  ([components/editor-v2/dataManagerOption.ts](../../frontend/src/components/editor-v2/dataManagerOption.ts)).
  Il fruitore **sceglie** la sintassi concreta; non la **edita**.

### 3.3 Sintassi concreta (viewpoint / IR)
- Uso/rendering: [components/editor-v2/viewpoint/ViewpointRenderer.tsx](../../frontend/src/components/editor-v2/viewpoint/ViewpointRenderer.tsx)
  + la pipeline `viewpoint/ir/` (irCompile, irResolve, IRNodeContent…). Questo è ciò che il fruitore **usa**.
- Definizione (authoring): `viewpoint/authoring/` (SymbolEditorModal, FieldSegmentEditor,
  MatchingSection, irTabs…). Questo è ciò che il fruitore **non** deve vedere.
- **Confine netto già presente**: `viewpoint/ir/` (uso) vs `viewpoint/authoring/` (definizione).
  Un ambiente ristretto monta il primo, non il secondo.

### 3.4 Data Manager = il motore del Configurator (riuso massimo)
- [components/abstract/tabs/InstanceManagerTab.tsx](../../frontend/src/components/abstract/tabs/InstanceManagerTab.tsx)
  (~3355 righe): metaclassi a sinistra → tabella istanze della metaclasse selezionata → dettaglio
  con **`IRForm`**; create via `DraftDialog`/`openCreate`.
- [components/abstract/tabs/instanceManagerModel.ts](../../frontend/src/components/abstract/tabs/instanceManagerModel.ts):
  `instancesOfClass`, `instanceCountsByClass`, `uninstantiableReason` (astratte non istanziabili),
  `MetaclassInfo`. **Tutto ciò che serve per "tipi top-level → istanze"**.
- Il Configurator (1.A) è quindi il Data Manager con (a) una **top bar** di tipi *curati* invece
  del rail completo delle metaclassi, e (b) un filtro di visibilità/editabilità per-ruolo (1.B).

### 3.5 Editabilità di campo già esistente (aggancio per 1.B)
- `IRForm`/`formAutoLayout` calcola `readOnly`/`isReadOnly` per campo
  ([components/editor-v2/viewpoint/ir/formAutoLayout.ts:106](../../frontend/src/components/editor-v2/viewpoint/ir/formAutoLayout.ts#L106),
  [IRFormField.tsx:205](../../frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx#L205)).
  Oggi deriva dal metamodello (derived/multivalued). **È il punto d'iniezione naturale** per il
  read-only per-ruolo: si aggiunge un override, non si costruisce da zero.

### 3.6 Il gap
Non esiste: (1) un modello di **ruoli/profili**, (2) una **configurazione** "quali tipi top-level
/ quali campi, per ruolo", (3) una **modalità shell ristretta**, (4) risoluzione ruolo dall'URL.
Questi sono il nuovo lavoro. (L'enforcement d'accesso *reale*, punto 5, è fuori scope per D1.)

---

## 4. Approfondimento tecnico — l'entità di config e VersionFixer (Fase 0)

Misurato il 2026-09-23 leggendo `joiner/classes.ts`, `redux/VersionFixer.tsx`, `model/megamodel.ts`.

1. **Le entità persistite NON stanno in `megamodel.ts`.** [model/megamodel.ts](../../frontend/src/model/megamodel.ts)
   è un grafo **derivato** (nodi ricalcolati dagli artefatti del progetto, solo gli edge
   user-defined sono persistiti) — interfacce, non entità. Le entità persistite sono
   `DPointerTargetable` in [joiner/classes.ts](../../frontend/src/joiner/classes.ts), decorate
   `@RuntimeAccessible('X')`, con un builder in `Constructors` ([:556](../../frontend/src/joiner/classes.ts#L556))
   + uno `static new()`, esportate da `joiner/index.ts`. **Persistono da sole** perché lo stato
   serializza tutto `idlookup`. Quindi "entità dedicata nel megamodello" (D3) si concretizza come
   una nuova entità D-layer che *appare* come nodo derivato nel megamodello, non come una struttura
   dentro `megamodel.ts`.

2. **Aggancio al progetto senza toccare il core `DProject`.** La config porta
   `father: Pointer<DProject>` (back-pointer) e si scopre con uno scan di `idlookup`
   (`className==='DEnvironmentConfig' && father===projectId`), lo stesso pattern di
   `modelIdOfObject` in `instanceManagerModel.ts`. **Nessun** campo nuovo su `DProject` né su
   `DState` → nessuna approvazione core (Rule 5).

3. **VersionFixer NON è necessario in Fase 0** se la config si crea **lazy** (alla prima apertura
   del pannello di authoring o del Configurator): una entità in idlookup persiste da sola, senza
   migrazione. VersionFixer serve solo per (a) migrazioni **future** della forma della config,
   (b) l'eventuale **seed** di una config di default sui progetti esistenti se in futuro decidiamo
   che debba esistere prima dell'uso. Meccanismo (misurato): `versionAdapters` keyed by
   from-version, ogni adapter `['<from> -> <to>'](s: DState): DState` muta lo stato, e si bumpano
   `highestVersion` e `DState.version.n` ([redux/VersionFixer.tsx:31-137](../../frontend/src/redux/VersionFixer.tsx#L31)).

4. **Impatto file di Fase 0 (onesto).** L'entità tocca `joiner/classes.ts` (D class + L class +
   builder in `Constructors`) + `joiner/index.ts` (export) + probabilmente `joiner/types.ts` per i
   Pointers → **corsia completa RC-3**. Con la mini-UI di authoring si sfora la soglia dei 5 file
   (Rule 19). **Conviene spezzare**: **F0a** = entità + lettura/scrittura (nessuna UI), **F0b** =
   mini-UI developer per marcare i top-level types e creare i ruoli.

---

## 5. Piano incrementale per fasi

Ogni fase è autonoma, consegnabile e verificabile. Le prime danno valore anche da sole.
Ordine consigliato: **F0 → F1** (chiudono la base #157); **F2 e F3** indipendenti tra loro dopo F0;
entrambe prerequisiti pieni di F4.

### Fase 0 — Fondamenta: entità di configurazione

**F0a — entità `DEnvironmentConfig` (+ `DRole`), read/write, niente UI**
- **Obiettivo**: introdurre lo *schema dati* persistito. `DEnvironmentConfig` con `father →
  DProject`; contiene: `topLevelTypes` (metaclassi marcate come entry-point, ordinate) e `roles:
  DRole[]`. `DRole`: `id`, `name`, e la matrice permessi (per tipo, e per campo: `hidden | read |
  edit`; default = `edit`, override espliciti).
- **Riuso**: pattern `DProject`/`DViewPoint` per D+L class; `MetaclassInfo` per i candidati.
- **Nuovo**: `joiner/classes.ts` (2 D + 2 L class + builder in `Constructors`), export in
  `joiner/index.ts`, helper di lettura (`getEnvironmentConfig(projectId)`, scan idlookup) e di
  scrittura (create lazy, `SetFieldAction`/`TRANSACTION`).
- **Criterio**: da un test/console si crea una config per un progetto, si aggiungono top-level
  types e un ruolo con override; la config sopravvive a save→reopen (idlookup). `typecheck`/`build`
  invariati; nessuna migrazione VersionFixer (creazione lazy).
- **Protocollo**: corsia completa; **niente** tocco a `DProject`/`DState`; Layer Impact Report non
  richiesto (nessun file §3.1 — è nuova entità, non sync/portDistribution) ma da confermare in fase.

**F0b — mini-UI developer**
- **Obiettivo**: nel jjodel classico, il developer marca quali metaclassi sono top-level (+ordine)
  e crea/edita i ruoli con la matrice permessi.
- **Riuso**: sezioni LeftBar/pannelli esistenti come contenitore.
- **Criterio**: il developer marca 4 tipi e crea 2 ruoli via UI; persistono.

### Fase 1 — Configurator screen (base #157, senza ruoli)
- **Obiettivo**: schermata/tab "Configurator" con la **top bar** dei tipi (da F0) → selezione tipo
  → lista istanze → apri/edita (`IRForm`) → crea nuovo.
- **Riuso pesante**: `instancesOfClass`/`instanceCountsByClass`, il pattern lista→dettaglio→create
  di `InstanceManagerTab`, `IRForm`, `openCreate`/`DraftDialog`. Idealmente si **estrae il motore**
  del Data Manager e il Configurator è una *skin* con barra in alto invece del rail a sinistra.
- **Nuovo**: `ConfiguratorTab` (o modalità di `InstanceManagerTab`) + voce `DockManager`.
- **Criterio**: su progetto reale, click su un tipo in alto → lista istanze; crea nuova istanza →
  compare in lista; apri → form editabile. **Nessuna** dipendenza dai ruoli. Chiude la base #157.
- **Protocollo**: probabile sforo 5 file + estrazione motore → corsia completa, pausa/conferma con
  elenco file.

### Fase 2 — Ruoli/permessi applicati (parte "additional" #157)
- **Obiettivo**: applicare la matrice del ruolo: tipi `hidden` spariscono dalla top bar; tipi
  `read` sono selezionabili ma non creabili/modificabili; campi `hidden`/`read` filtrati nel form.
- **Riuso**: l'override su `isReadOnly`/`readOnly` (formAutoLayout/IRFormField, §3.5);
  `uninstantiableReason` come modello per "perché è sola-lettura per te".
- **Nuovo**: risolutore permessi (default → override) + iniezione in Configurator/IRForm.
- **Criterio**: ruolo "educator" → `CompetencyGoal` read-only, `iSQD_Profile` nascosto; "pedagogical
  expert" coerente. Verificato a runtime.

### Fase 3 — Modalità ambiente ristretto (estensione 1.C, cuore del lavoro)
- **Obiettivo**: shell "consumer" che espone solo modelli / sintassi concrete / Configurator-Data
  Manager. LeftBar senza Metamodels/Viewpoints/creazione; niente authoring; niente editor di
  validazione; syntax picker mantenuto (scelta, non authoring).
- **Riuso**: stessa `Dashboard`/`DockManager` in **modalità ristretta** (una prop/flag che filtra
  le sezioni LeftBar e le voci apribili); `ViewpointRenderer` per il canvas.
- **Nuovo**: flag di modalità derivato da `&role` in URL; gate in `LeftBar`, `DockManager.open*`,
  `Toolbar`; risoluzione ruolo→config all'apertura del progetto.
- **Criterio**: aprendo l'URL dell'ambiente come fruitore, **nessun** percorso (menu, tab,
  scorciatoia) apre M2/viewpoint-authoring/validazione; canvas + Configurator funzionano.
- **Protocollo**: **propaga a più layer** (view/shell/persistenza) → **Layer Impact Report
  obbligatorio**, pausa/conferma (regole 19/20).

### Fase 4 — "Da chi": assegnazione ruolo (soft)
- **Obiettivo**: legare i ruoli a utenti e generare/copiare gli URL d'ambiente per ruolo dallo
  share esistente.
- **Riuso**: `collaborators`/`DUser`, `shareUtils`.
- **Nuovo**: mapping utente→ruolo per progetto (nell'entità di config); UI di condivisione ambiente
  (genera l'URL `?id=...&role=...`). **Nessun backend** (D1).
- **Criterio**: il developer assegna ruoli e copia l'URL per ruolo; aprendolo si entra nell'ambiente
  giusto.

### Fase 5 — Rifiniture
- Canvas in modalità sintassi concreta con editing conforme ai permessi (drag/create gated);
  validazione come **feedback** (non editor) per il fruitore; documentazione utente; eventuali
  migrazioni `VersionFixer` se la forma della config cambia.

---

## 6. Rischi e vincoli di protocollo

- **Critical zone (§3 CLAUDE.md)**: F3 tocca shell/DockManager/Toolbar e sfiora la resa canvas; se
  in futuro F0/F2 persistono cambi di forma → `VersionFixer` (Rule 14).
- **Core (Rule 5)**: evitato — la config è entità dedicata, `DProject` **non** si tocca (D3).
- **>5 file (Rule 19) e multi-layer (Rule 20)**: F0 (con UI), F1, F3 sforano → corsia completa
  RC-3, pausa/conferma con elenco file, Layer Impact Report dove pertinente.
- **Sicurezza vs UX**: enforcement soft (D1) = non è sicurezza. Da comunicare (§2.1).
- **Estrazione del motore Data Manager (F1)**: rischio di regressione sul Data Manager esistente.
  Mitigazione: estrarre senza cambiare comportamento, coperto dai test `instanceManager*`.

---

## 7. Domande aperte / da decidere in fase

1. **Nome del parametro URL** del ruolo: `?role=` vs `?env=` vs `?as=`. (F0/F3)
2. **Granularità permessi in v1**: solo per-tipo (hidden/read/edit) o anche per-campo subito? La
   #1.B cita entrambi; proposta: per-tipo in F2, per-campo come sotto-fase se serve.
3. **Configurator: tab dedicato o modalità del Data Manager?** Proposta: modalità/skin che riusa il
   motore, per non duplicare 3355 righe.
4. **Ruoli: liberi (definiti dal developer) o preset?** Proposta: liberi, con la matrice permessi.
5. **Un ruolo "anonimo" di default** per l'URL pubblico senza `?role`? Da decidere con la #1.C.

---

## 8. Riferimenti (file chiave)

| Area | File |
|------|------|
| Modello progetto | `joiner/classes.ts:3042` (DProject), `pages/Project.tsx:101` (URL) |
| Condivisione | `utils/shareUtils.ts` |
| Shell / chrome | `pages/components/Dashboard.tsx`, `pages/components/LeftBar.tsx`, `components/abstract/DockManager.tsx`, `components/editor-v2/Toolbar.tsx:82` |
| Data Manager | `components/abstract/tabs/InstanceManagerTab.tsx`, `components/abstract/tabs/instanceManagerModel.ts` |
| Sintassi concreta | `components/editor-v2/viewpoint/ir/` (uso), `components/editor-v2/viewpoint/authoring/` (definizione), `components/editor-v2/viewpoint/ViewpointRenderer.tsx` |
| Editabilità form | `components/editor-v2/viewpoint/ir/formAutoLayout.ts:106`, `.../IRFormField.tsx:205` |
| Persistenza / entità | `joiner/classes.ts:556` (Constructors), `joiner/index.ts`, `redux/VersionFixer.tsx` |
