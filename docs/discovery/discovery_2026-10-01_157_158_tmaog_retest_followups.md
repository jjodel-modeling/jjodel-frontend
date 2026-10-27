# Discovery — #157 / #158, seguiti del re-test di @tmaog (2026-09-29)

**Data**: 2026-10-01
**Branch**: `feat/157-environment-config` @ `b82d661e8`
**Fonti**: #157 issuecomment-5893727318, #158 issuecomment-5894315710, i 6 screenshot del primo
(progetto «AIM Pro»: 8 metamodelli, 5 modelli).
**Stato**: Fase 1 read-only. Nessun sorgente toccato.

## 0. Answer in brief

- **«New» inerte su Educator non è R3** (astratte / solo-containment). Il Configurator usa
  `models[0]` per TUTTI i tipi; in «AIM Pro» `models[0]` è `learningphase` (metamodello
  Scenario), Educator sta nel metamodello Educators: `classIdOf` per nome non lo trova,
  `applyCreate` ritorna `null`, il bottone tace. Stessa causa: le liste di Resource/Educator
  sono vuote anche se le istanze esistono in altri modelli.
- **Fix A (#157)**: ogni tipo risolve i propri modelli (gli M1 con `instanceof` = metamodello
  della classe). Lista = istanze di tutti quei modelli; New nel primo; dettaglio, delete e
  create figli sul modello dell'istanza; errore di create reso visibile.
- **R1 confermato M1 dal re-test**: con Ctrl+S tutto funziona. Due difetti di codice lo
  rendono probabile: il copy del wizard dice «Changes are saved to the project immediately»
  (falso) e nessuna scrittura del wizard accende `U.isProjectModified`, quindi niente
  «Unsaved» e niente prompt. «Done» salva solo la vecchia config EnvGen in localStorage.
- **Fix B (#157)**: dirty flag sulle scritture del wizard, copy corretto, Save esplicito.
- **#158**: Back da un target aperto dalla lista di un figlio inline torna al figlio
  (Phase_0) per una scelta voluta (`via` in `drillTo`); va fatto tornare alla form che era a
  schermo. Il click sulla riga selezionata deve aprire/chiudere il vicinato come il chevron.
- **Fix C (#158)**: `NavStep.passThrough?` + `backOf()` puro in `jjform/nav.ts`; click riga.

Decisioni per Juri (prodotto):
1. Tipo editabile senza nessun modello del suo metamodello nel progetto: creare il modello in
   automatico al primo New, oppure messaggio (+ «Create model» solo per il developer)?
   Recommended: creazione automatica, nome dal metamodello, visibile al developer.
2. «Done» del wizard: salva il progetto (come Ctrl+S) o solo dirty + promemoria?
   Recommended: Done salva il progetto.
3. Bottone Save nella topbar (mockup di @tmaog): per tutti o solo in consumer?
   Recommended: per tutti, accanto a «Saved/Unsaved».

Fuori da questo giro: R5 (atterraggio sul Configurator, mockup), R3-filtro (`rootableClasses`
in `MetaclassesStep`), F4b, R7 (guida su GitHub), P4-in-field e testata in drill-in (#158).

## 1. Ipotesi falsificate

- **H-R3** (triage 2026-09-28 §4 R3): «New inerte = metaclasse non creabile alla radice».
  Falsificata per Educator dagli screenshot: Educator è il tipo principale del metamodello
  Educators (gruppo «EDUCATORS» nello screenshot 1), e Scenario, nel metamodello del primo
  modello, crea. La spiegazione che regge tutti e due i casi è il modello sbagliato.
- **H-M2** (config duplicata): non osservata; il re-test con save esplicito è verde.

## 2. File letti

- `frontend/src/components/environment/ConfiguratorTab.tsx` (intero)
- `frontend/src/joiner/environmentConfig.ts` (intero)
- `frontend/src/components/editor-v2/hooks/createAdapter.ts:101-137, 491-602`
- `frontend/src/components/editor-v2/hooks/useEditorMode.ts:195-230, 505-520`
- `frontend/src/components/abstract/tabs/instanceManagerModel.ts:40-120`
- `frontend/src/model/logicWrapper/LModelElement.tsx` (DModel, ~4990-5040)
- `frontend/src/components/envgen/steps/MetaclassesStep.tsx:1-60`, `ProfilesStep.tsx` (scritture)
- `frontend/src/components/envgen/EnvGenWizardModal.tsx:60-72`, `hooks/useEnvGenWizard.ts:125-135`,
  `services/EnvGenPersistence.ts:1-40`
- `frontend/src/common/libraries/saveProject.tsx`, `lastSaved.ts:100-110`,
  `components/topbar/LastSavedIndicator.tsx`
- `frontend/src/pages/components/Navbar.tsx:90-115, 1960-1990`
- `frontend/src/jjform/nav.ts` (intero), `components/abstract/tabs/InstanceDetail.tsx:285-330, 585-655`
- `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx:1895-1905, 2008-2030, 2925-3015`
- `frontend/src/components/abstract/tabs/__tests__/instanceManagerFl6.test.ts:120-140`

## 3. Findings

### F1 — un modello per tutti i tipi
`ConfiguratorTab.tsx:75-78`:
```
// First cut: the Configurator targets the project's primary model. A model picker for
// multi-model projects is a later refinement.
const models = ((project as any)?.models ?? []) as Array<{ id: string }>;
const modelId: string | null = models[0]?.id ?? null;
```
`createAdapter.ts:135-136` risolve la classe per NOME dentro il metamodello di quel modello:
```
export function classIdOf(modelId: string, className: string): string | null {
    return classesByName(modelId)[className]?.id ?? null;
```
`createAdapter.ts:499`: `if (!classId) return { ok: false, id: null, reason: \`metaclass "${className}" is not in this model\` };`
`ConfiguratorTab.tsx:181-182`: `const id = applyCreate(...); if (id) setSelectedInstanceId(id);`
— il fallimento non ha nessun ramo visibile.

Legame M1→M2: `DModel.instanceof?: Pointer<DModel>` (`LModelElement.tsx:5007`). Una classe
risale al suo metamodello per `father` (`modelIdOfObject`, `instanceManagerModel.ts:57`, cammina
su qualunque elemento fino al `DModel`). `getMetaclassInfo` non segue `dependencies`: un M1
offre le classi del solo suo metamodello.

Copy minore (screenshot 3): `ConfiguratorTab.tsx:301` «No instances yet. Click New to create one.»
anche dove R4 ha tolto il New (tipi read only).

### F2 — il wizard non dichiara il progetto sporco
Scritture: `MetaclassesStep.tsx:43`, `ProfilesStep.tsx:81-82, 87, 91, 99` (`SetFieldAction` /
`DProfile.new`). Il dirty è opt-in: `U.isProjectModified = true` compare in `createAdapter.ts`,
`formWrite.ts`, `IRNodeContent.tsx`, `ProjectEditor.tsx`, e in nessun file di `components/envgen`
o `components/environment` (grep su quelle due cartelle vuoto; controllo positivo: lo stesso
grep sull'albero trova le occorrenze citate). L'indicatore legge solo quel flag
(`LastSavedIndicator.tsx:41`).
Copy: `MetaclassesStep.tsx:52` e `ProfilesStep.tsx:116` «Changes are saved to the project immediately.»
«Done» = `handleSaveAndClose` → `EnvGenPersistence.save` → `localStorage['jjodel_envgen_configs']`
(`EnvGenPersistence.ts:4`): non il progetto.
Il salvataggio unico esiste: `saveProjectWithFeedback` (`saveProject.tsx:60`), già chiamato da
menu, Ctrl+S e dal bottone Save del Data Manager.

### F3 — Back salta indietro di un livello che l'utente non ha aperto
`InstanceDetail.tsx:611`: `onOpen={(targetId, refKey) => drillTo(targetId, refKey, { id: childId, key: slot.key })}`
e in `drillTo` (`:306-308`) il figlio inline entra nel path come livello a sé. Il commento
(`:289-291`) lo dichiara: «Back from Antonio lands on Phase_0, not past it». `drillOut`
(`nav.ts:137-139`) toglie un solo livello.

### F4 — il click sulla riga seleziona e basta
`InstanceManagerTab.tsx:2939`: `onClick={() => selectOnly(row.id)}`; il toggle esiste già
(`toggleNeighborhood`, `:1900-1904`). Il test a testo sorgente
`instanceManagerFl6.test.ts:133-135` fissa la stringa `onClick={() => selectOnly(row.id)}`.

## 4. Piano (corsie, file)

**A — #157 tipo → modelli** (4 file): `joiner/environmentConfig.ts` (+ `metamodelOfClass`,
`modelsForType`, puri), `joiner/__tests__/environmentConfig.test.ts`,
`components/environment/ConfiguratorTab.tsx`, `components/environment/configuratorTab.scss`.
**B — #157 R1 salvataggio** (5 file): `envgen/steps/MetaclassesStep.tsx`,
`envgen/steps/ProfilesStep.tsx`, `envgen/EnvGenWizardModal.tsx`, `pages/components/Navbar.tsx`,
`pages/components/navbar.scss`.
**C — #158 Back e riga** (5 file): `jjform/nav.ts`, `jjform/__tests__/nav.test.ts`,
`jjform/index.ts`, `abstract/tabs/InstanceDetail.tsx`, `abstract/tabs/InstanceManagerTab.tsx`,
più l'aggiornamento della stringa fissata in `__tests__/instanceManagerFl6.test.ts`.

Nessun file di §3.1: `createAdapter.ts` e `viewpoint/ir/` sono chiamati, non modificati. Nessun
TRANSACTION nuovo; la creazione di un modello (se decisione 1 = automatica) replica i passi di
`createM1` (`Navbar.tsx:98-116`) senza `DockManager.open2`, nudi.

## 5. Rischi

- A: id temporanei alla creazione del modello (P5): l'istanza va creata quando il modello è
  risolto nello store, non nella stessa chiamata.
- A: tipi omonimi in metamodelli diversi: la risoluzione per modello li separa già.
- B: Save automatico su Done tocca il flusso di salvataggio: si chiama `saveProjectWithFeedback`
  com'è, nessuna copia.
- C: `NavStep` è un'interfaccia esportata: solo una proprietà opzionale nuova (Rule 11).

## 6. Domande aperte

Le tre decisioni del §0.

## 7. Decisioni di Juri (2026-10-01, in chat)

1. Tipo senza modello del suo metamodello: **messaggio**, e nella vista developer (niente
   `?profile=`) un bottone **«Create model»** che passa da `createM1`, il percorso del menu
   File → New → Model. Nessuna creazione automatica.
2. «Done» del wizard **salva il progetto** (`saveProjectWithFeedback`, come Ctrl+S).
3. Bottone **Save in topbar per tutti**, accanto all'indicatore «Saved/Unsaved».
4. Scope: **tutte e tre le corsie** (A, B, C), su `feat/157-environment-config`, un commit per corsia.
