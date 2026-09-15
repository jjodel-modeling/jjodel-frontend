# Discovery — Infrastruttura di validazione (conformance, invarianti JjEL, feedback UI)

**Data**: 2026-07-14 (il prompt nomina il file `discovery_2026-07-13_…`; nome-file mantenuto come da prompt, data reale 2026-07-14)
**Tipo**: Fase 1 discovery **READ-ONLY** (hard stop prima della Fase 2)
**Branch**: `alfonso-frontend-jjtl`
**Zona**: `model/conformance/`, `jjscript/`, `jjel/`, `jjtl/`, `model/logicWrapper/`, `redux/`, `common/`, `events/`, `services/export/`, `api/data.ts` — critical-zone (`useJjomSync.ts`, `portDistribution.ts`, `syncState.ts`) **solo letta per capire i flussi, mai modificata**.
**Metodo**: 5 sotto-agenti read-only paralleli, uno per gruppo di domande; ogni claim sotto è ancorato a `file:line` verificato sul working tree corrente.

> ⚠️ **Correzione di path**: il prompt cita path `src/...`. Nel working tree i file sono sotto `frontend/src/...`. Tutti i riferimenti sotto usano `frontend/src/…`.
> ⚠️ **Correzione di ipotesi del prompt**: (a) le classi D-layer M2 vivono in `frontend/src/model/logicWrapper/LModelElement.tsx`, **non** in `frontend/src/joiner/`; (b) il flag su `DAttribute` si chiama `isID`, non `iD` (`iD` è solo il nome di serializzazione Ecore, citato in un commento); (c) non esiste alcuna convenzione suffisso `(1)`/`(2)` — la dedup usa un suffisso numerico `_N`.

---

## Obiettivo

Fotografare lo stato reale dell'infrastruttura di validazione prima di ogni decisione di design per la feature a due livelli (Livello 0: conformance strutturale M1↔M2 built-in; Livello 1: invarianti utente in JjEL come assertion sopra l'evaluator). Nessuna decisione architetturale: solo fatti con `file:line`, dipendenze, rischi, e domande aperte.

---

## File letti/analizzati (path completi)

**Conformance module**
- `frontend/src/model/conformance/ConformanceValidator.ts`
- `frontend/src/model/conformance/ConformanceTypes.ts`
- `frontend/src/model/conformance/useConformance.ts`
- `frontend/src/model/conformance/ConformanceGuard.ts`
- `frontend/src/model/conformance/useConformanceGuard.ts`
- `frontend/src/model/conformance/ConformanceIndicator.tsx`

**JjScript**
- `frontend/src/jjscript/executor/commands/validate.ts`, `commands/index.ts`, `executor/executor.ts`, `executor/scriptValidator.ts`
- `frontend/src/jjscript/parser/parser.ts`, `parser/lexer.ts`, `types.ts`

**JjEL**
- `frontend/src/jjel/index.ts`, `evaluator/evaluator.ts`, `evaluator/index.ts`, `evaluator/context.ts`, `evaluator/modelContext.ts`, `evaluator/builtins/collections.ts`
- `frontend/src/jjscript/executor/commands/eval.ts` (`buildEvalContext`)
- `frontend/src/components/Jodie/jodieJjelContext.ts`, `frontend/src/jjtl/executor/executor.ts`

**D/L-layer & persistenza**
- `frontend/src/model/logicWrapper/LModelElement.tsx` (DModelElement, DClass, DModel, DAttribute, DAnnotation, LClass, LModel, forceConformity)
- `frontend/src/view/viewElement/view.tsx` (`DViewElement.appliableToClasses`)
- `frontend/src/joiner/classes.ts` (`fromPointer`, `fromD`, `defaultname`), `frontend/src/common/U.tsx` (`compressedState`, `increaseEndingNumber`, `alert`)
- `frontend/src/redux/VersionFixer.tsx`, `frontend/src/api/persistance/projects.ts`, `frontend/src/api/data.ts` (`parseDAnnotation`)
- `frontend/src/model/logicWrapper/nameUniqueness.ts`, `frontend/src/utils/LazyOCL.ts`

**UI feedback & trigger**
- `frontend/src/components/editor-v2/problems/{registry.ts, useNodeProblems.ts, NodeProblemIndicator.tsx, NodeProblemOverlay.tsx, UniquenessProblemSync.tsx}`
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`, `EditorV2.scss`
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`, `frontend/src/components/editors/Info.tsx`
- `frontend/src/jjtl/views/ProblemsPanel.tsx`, `frontend/src/components/abstract/tabs/TabDataMaker.tsx`
- `frontend/src/components/Toast/ToastContext.tsx`, `frontend/src/events/registry.ts`
- `frontend/src/components/Jodie/{ChatMessages.tsx, JodieHeader.tsx}`

**Identità metamodello (Q8)**
- `frontend/src/jjtl/components/sourceConformance.ts`, `ExecuteTransformationDialog.tsx`, `JjtlDevelopmentEnv.tsx`, `types/transformation.ts`
- `docs/discovery/discovery_2026-07-14_transformation_source_conformance.md`

---

## Q1 — Conformance esistente

### Q1a. `ConformanceValidator.ts` — check implementati

Unica funzione pura esportata: `validateConformance(model: LModel, metamodel: LModel): ConformanceResult` (`ConformanceValidator.ts:18-246`). **Nessun metodo per-check separato**: tutti i check sono blocchi inline dentro un `for (const obj of objects)` (`:43`) protetto da `try/catch` (`:25-229`), marcati `// CHECK N`.

| # | Check | Cosa valida | `file:line` | Severity / violationType |
|---|-------|-------------|-------------|--------------------------|
| 1 | Orphan object | La metaclasse dell'oggetto esiste nel metamodello (lookup **by-id OR by-name**, `:63`) | `:50-74` | `error` / `orphan_object` |
| 2 | Missing required attr | Attributo con `lowerBound > 0` ha **almeno un valore** (test binario di presenza) | `:95-117` | `error` / `missing_required_attr` |
| 3 | Attribute type | Compatibilità di tipo primitivo (int/bool/float/double; `EString` sempre pass; altri pass silenzioso) | `:119-151` | **`warning`** / `type_mismatch` (il commento dice `wrong_attr_type`) |
| 4 | Reference upper-bound | `valueCount > upperBound` (`ub = ref.upperBound ?? 1`; `-1` = illimitato) | `:182-192` | `error` / `multiplicity_upper_exceeded` |
| 5 | Reference lower-bound | `valueCount < lowerBound` | `:194-204` | **`warning`** / `multiplicity_below_min` |
| 6 | Dangling reference | L'oggetto target della reference esiste nel modello (set `objectIds`, `:38-41`) | `:206-218` | `error` / `dangling_reference` |

Roll-up status (`:231-245`): qualunque `error` → `'errors'`; altrimenti `warning` → `'warnings'`; altrimenti `'conformant'`; eccezione → `'unknown'`.

**Cosa NON controlla** (verificato leggendo, non inferito):
- **Tipo del target di una reference** — CHECK 6 verifica solo che il target *esista* (`:208`), mai che sia istanza della classe target dichiarata. Reference verso oggetto di tipo sbagliato = accettata.
- **Cardinalità sugli attributi** — gli attributi hanno solo il test di presenza (CHECK 2). Nessun conteggio upper/lower per attributi multi-valued (solo le reference contano, CHECK 4/5).
- **Istanziazione di classe astratta** — il flag `abstract` della metaclasse non viene mai letto qui.
- **Unicità** — nessun check `unique`, né id-uniqueness, né name-uniqueness (name-uniqueness vive altrove, vedi Q1d).
- **Consistenza containment / single-container / cicli di composizione** — la parola `containment`/`composition` non compare nel file.
- **eOpposite consistency**, **validità dei literal enum**, **lower-bound esatto sugli attributi** (`lowerBound > 1` trattato come `== 1`), **OCL/invarianti derivate**.

### Q1b. `useConformance.ts` — consumo, timing, shape

- **Consumatori**: **uno solo** — `ConformanceIndicator.tsx:2` (import), `:27` (`useConformance(modelId)`). Catena: `TabDataMaker.tsx:29` (`<ConformanceIndicator modelId={model.id}/>`) → dot colorato nel titolo del tab modello. Nient'altro nel codebase usa l'hook.
- **Timing**: **live sul cambio modello, debounce 500 ms**. `useEffect` (`useConformance.ts:23-61`), deps `[modelId, modelData]` (`:61`), con `modelData = useSelector(state => state.idlookup?.[modelId])` (`:21`); `DEBOUNCE_MS = 500` (`:8`), `setTimeout` (`:26`). Guardie: `null` se metamodello/mancante (`:29-32`); `status:'unknown'` se il modello non ha `instanceof` (`:35-43`).
- **Limite di scope sottile**: il selector si abbona solo a `state.idlookup[modelId]` (l'entry del modello). Edit su valori di attributo di DObject/DValue figli cambiano *le loro* entry idlookup, non necessariamente il reference dell'entry del modello → la re-validazione debounced **non è garantita** su ogni edit profondo di istanza; si ri-attiva in modo affidabile su add/remove di oggetti.
- **Shape output** (`ConformanceTypes.ts`): lista di violazioni con severity e messaggio human-readable.
  - `ConformanceResult { modelId, status, violations, checkedAt }` (`:49-54`)
  - `ConformanceStatus = 'conformant' | 'warnings' | 'errors' | 'unknown'` (`:47`)
  - `ViolationSeverity = 'error' | 'warning'` (`:36`)
  - `ConformanceViolation { objectId, objectName?, violationType, severity, message, metamodelElementName? }` (`:38-45`)

### Q1c. Guard / useConformanceGuard / Indicator

- **`ConformanceGuard.ts`** — 3 guardie *preventive* pure + emitter:
  - `checkLinkCreation` (`:17-100`) upper-bound su creazione link (legge `feat.__raw.values` per evitare il padding di `LValue.values`, `:52-68`).
  - `checkObjectCreation` (`:108-133`) esistenza classe (solo esistenza, **non** rifiuta le astratte).
  - `checkValueAssignment` (`:141-188`) compatibilità di tipo.
  - `emitGuardViolation` (`:261-264`) dispatch `JjodelEvents.GUARD_VIOLATION`. Tutte **fail-open** su errore/input irrisolto.
  - ⚠️ **Strumentazione committata** (viola la no-instrumentation rule del progetto): `featureTrace` `:47-65` + `console.log('[BUG-DIAG-GUARD] …')` `:70-78`. Helper morto `findObjectById2` `:194-202`.
- **`useConformanceGuard.ts`** (`:26-61`) ritorna `{guardLink, guardObject, guardValue}`; risolve `{model, metamodel}` via `resolveModelPair` (`:10-20`, fail-open).
- **`ConformanceIndicator.tsx`** (`:26-63`) dot Bootstrap + tooltip; ritorna `null` se `conformant` (`:39`) → il dot compare **solo** per warnings/errors/unknown.
- **Wiring reale**: solo **`guardLink`** è cablato, in `EditorV2.tsx:450` (destrutturato), usato a `:1521` e `:2446` (creazione ref-edge M1). `guardObject`/`guardValue` **non sono consumati da nessuna parte**. Import dei 4 guard in `LModelElement.tsx:96` è **morto** (nessuna chiamata nel file). Unico listener di `GUARD_VIOLATION`: `ToastContext.tsx:106-117`, gated su preferenza `enableGuardViolations`.

### Q1d. Sweep globale — la validazione è frammentata su ≥7 superfici indipendenti

1. **Reporter runtime** — `model/conformance/ConformanceValidator.ts` (6 check; solo report; dot nei tab via `useConformance`/`ConformanceIndicator`).
2. **Guard preventive** — `model/conformance/ConformanceGuard.ts` (solo `guardLink` cablato).
3. **Enforcement strutturale L-layer** — `LModelElement.tsx:6307-6339` `forceConformity`/`_forceConformity`/`_removeConformity`, invocati dalla transaction `set_instanceof` (`:6296,:6301`): **riscrive** l'oggetto per farlo combaciare con la metaclasse (crea/rimuove LValue). Il reporter Q1a solo *riporta*, questo *riscrive*.
4. **Banner inline classic-editor** — `components/editors/Info.tsx:532-566` calcola `conform` inline dal `values.length` vs `lowerBound/upperBound` e mostra "Conforms to / Does not conform to / Shapeless instance". **Bug latente**: `conform` è *assegnato* (non AND-accumulato) ad ogni iterazione (`:538`), sopravvive solo l'ultima feature. Entry-point "Force type" `forceConform(me)` (`:590-604`).
5. **Uniqueness** — `model/logicWrapper/nameUniqueness.ts` (`validateNameUniqueness :79-88`, `getSiblingNamespace :51-73`, `detectDuplicateNames :98-110`): **unico** validatore di unicità, blocco hard in `LObject.set_name`/`set_father`, e feed dei badge canvas.
6. **Conformance a import-time** — `services/export/XMIService.ts` rifiuta classi sconosciute / root non-classe al load (`:636 "Unknown class …"`, `:658`). Più forte del dangling-check runtime.
7. **Linting design-time JjScript/JjTL** — `jjscript/executor/commands/validate.ts` (lint M2) e `jjtl/executor/executor.ts:515-551` `validateTargetClasses` (rifiuta classi astratte come *target* di trasformazione — unico posto dove l'astratto-instanziazione è controllato, ma solo lato target).

**Altri hit rilevanti dello sweep**: `utils/LazyOCL.ts` `lazyEvaluateOCL` (`:201-242`) — cache di valutazione OCL per la *visibilità delle view* (`view.oclCondition`), non conformance del modello, ma è il layer di valutazione di un constraint-language già presente (esposto su `window.LazyOCL`). Megamodel `conformsTo` (`model/megamodel*.ts`) è una *relazione derivata*, non un check. `StatusBar.tsx`/`ProjectEditor.tsx:2583` mostrano "Conforms to X" (display only).

---

## Q2 — JjScript `validate`

**Non è uno stub, è cablato end-to-end, ma è un linter strutturale M2 — non tocca `ConformanceValidator` e non fa conformance M1↔M2.**

- Runtime: `executeValidate(args, context)` (`validate.ts:21`); scope via `validate all` = intero progetto, altrimenti `resolveElement` (`:43-60`); walker ricorsivo `validateElement` (`:146-185`) che dispatcha su `className.includes('Class'|'Attribute'|'Reference'|'Operation'|'Package'|'Enum')`. Regole hardcoded: `validateClass` (`:187-227`), `validateAttribute` (multiplicity sanity `:229-266`), `validateReference` (missing target type `:280`; opposite-consistency **stub vuoto** `:290-293`), `validatePackage`/`validateEnum`/`validateOperation` (`:309-366`). Output `errors/warnings/infos` (tipo locale `ValidationIssue` `:139-144`) formattato in `ExecutionResult.message` (`:79-122`). Import: solo `resolveElement, qualifiedNameToString, getProject, LProject` (`:6-15`) — **nessun** riferimento a `ConformanceValidator`.
- Reachability confermata: lexer `COMMANDS` (`lexer.ts:371`, keyword in `types.ts:573`) → parser `case 'validate' → parseValidateCommand()` (`parser.ts:232-234`, `:823-836`) → executor `case 'validate' → executeValidate` (`executor.ts:162-164`) → barrel `commands/index.ts:19`.
- **Lista completa comandi riconosciuti** (switch executor `executor.ts:119-190`, autoritativo): `create, delete, rename, set, add, remove, move, copy, list, show, help, undo, redo, clear, validate, extends, eval, let, forall, abstract, block(do…end)`. Pseudo-comandi parser-level: `forall…do`, `exists`/`with` → `eval` (`parser.ts:143-147`), `abstract <Class>` (`:152-162`), `X extends Y` (`:166-170`), `do…end` (`:173-179`), fallback qualsiasi token → `eval`/JjEL (`:181-185`). **`export`/`import`**: presenti nel `CommandType` union (`types.ts:55-56`) e in `COMMANDS`, ma **nessun case** in parser/executor → colpiscono `default: 'Unknown command'` (aspirazionali/morti).

---

## Q3 — JjEL come motore di assertion

### Q3a. Entry point di valutazione
- `jjelEval(source, variables?): JjelValue` (`jjel/index.ts:74`) — parse+evaluate, throw su parse-error, null-silenzioso su identificatori indefiniti.
- `jjelEvalWithDiagnostics(source, variables?): JjelEvalResult` (`jjel/index.ts:124`; `JjelEvalResult {value, warnings:JjelWarning[]}` `:97-100`) — stessa semantica di valore, ma **espone** i null-silenziosi (identifier indefinito, property-not-found, ambiguous-instance) via `evaluateWithDiagnostics` (`:137-139`). **È l'entry point giusto per un motore di assertion** (le warning diventano diagnostica).
- Basso livello: `evaluate(expr, ctx?)` (`evaluator/index.ts:5`, impl in `evaluator.ts`). Parse-only: `isValidJjel` (`index.ts:148`), `getJjelErrors` (`index.ts:159`).

### Q3b. Binding contesto M1 — parziale, manca l'harness per-istanza
- Builder M1 condiviso: `buildEvalContext(context)` (`jjscript/executor/commands/eval.ts:93`) espone `instances` (`:147-148`), per-classe `ClassName.instances`/`ClassName.allInstances` (subclass-inclusive, `:206-207`), `classes`, `attributes`, `data`=elemento selezionato, `node`=nodo selezionato (`:294,:298`); valori attributo M1 appiattiti via `extractAttributeValues` (`jjel/evaluator/modelContext.ts:23`, legge slot L-proxy `$attr.value`).
- **`self`** è definito solo in 2 punti stretti, **nessuno** un iteratore per-istanza-di-classe: (1) Jodie code-mode alias di `data` (`components/Jodie/jodieJjelContext.ts:40-46`); (2) JjTL executor, legato alla singola istanza sorgente per mapping (`jjtl/executor/executor.ts:1934`, whitelist `contextToRecord` `:2897-2901`).
- **Manca**: (1) nessun harness che iteri `ClassName.allInstances` legando `self` (o una var) a ciascuna istanza e valuti un booleano JjEL raccogliendo violazioni; (2) nessun layer assertion/invariant/constraint (grep `invariant|assert|constraint` in `jjel/`+`jjscript/` non-test = vuoto). Il primitivo su cui costruirlo esiste: `EvaluationContext.child({...})` (`jjel/evaluator/context.ts:270`) + `buildEvalContext` + `jjelEvalWithDiagnostics`. **Nessun codice li compone oggi in un assertion runner.**

### Q3c. Copertura costrutti NELL'EVALUATOR (non nella spec) — tutti implementati

| Costrutto | Stato | Handler `file:line` |
|-----------|-------|---------------------|
| `implies` | ✅ (vacuous-truth) | `evaluator.ts:899` `evaluateImplies`; dispatch `:182` |
| `exists x in S … pred` | ✅ (ritorna boolean) | `evaluator.ts:929` `evaluateExists`; dispatch `:186` |
| `forall x in S [\| f] [: proj]` | ✅ (**ritorna array**, set-comprehension) | `evaluator.ts:911` `evaluateForAll`; dispatch `:184` |
| `.all()` / `.any()` / `.none()` | ✅ | `collections.ts:139`/`122`/`156`; registrati `:563` |
| `.distinct()` / `.distinctBy()` | ✅ | `collections.ts:215`/`234`; registrati `:570-571` |
| `?.` null-safe member/method | ✅ | `evaluator.ts:388`/`682`; dispatch `:162`/`:166` |
| `??` null-coalesce | ✅ | `evaluator.ts:836`; dispatch `:172` |
| `is` type-check | ✅ (via `TypeRegistry.isInstance`) | `evaluator.ts:848`; dispatch `:174`; registry `context.ts:69-126` |
| lambda `=>` | ✅ | `evaluator.ts:857`; dispatch `:176` |
| `with … do` | ✅ | `evaluator.ts:944`; dispatch `:188` |

**Nota semantica**: `forall`/`exists` sono nodi-quantificatore language-level, separati dai builtin di collezione. Un booleano "tutte le istanze soddisfano P" si scrive `S.all(x: P)` o `exists`, **non** `forall` (che proietta un array). Rilevante per la sintassi delle invarianti.

---

## Q4 — Persistenza delle invarianti

### Q4a. Struttura D-layer M2
Catena: `DClass → DModelElement → DPointerTargetable`; `DModel → DNamedElement → DModelElement → DPointerTargetable` (tutto in `LModelElement.tsx`).
- `DModelElement` (base, `:111`) ha **`annotations: Pointer<DAnnotation,0,'N',LAnnotation> = []`** (`:122`) → **canale annotation EMF-style presente su OGNI elemento M2 per ereditarietà**.
- `DClass` (`:2617`): campi persistiti a `:2629-2662` (name, abstract, interface, instances, operations, features, references, attributes, extends, implements, isSingleton, sealed, final, …) + `annotations` (`:2633`). **Nessun campo dedicato a constraints/invarianti/metadata.**
- `DModel` (`:4694`): campi a `:4702-4714` + `annotations` (`:4705`) + **`metadata?: { xmiIdMap?: … }`** (`:4717`) — **campo optional free-form già esistente** (aggiunto dall'importer XMI M1 per round-trip). Precedente diretto di "metadata optional su D-object".
- `DAnnotation` (`:984`): `source!: string` (`:996`), `details!: DAnnotationDetail[]` (`:997`); `DAnnotationDetail` (`:150`) è uno stub senza campi (`// todo`).

### Q4b. eAnnotations all'import — riconosciute ma NON importate (stub)
L'importer Ecore è `EcoreParser` in `frontend/src/api/data.ts` (non in `components/import/`).
- `parseDAnnotation` (`data.ts:650`) ha come **prima istruzione `return []; // todo`** (`:651`) → tutto il corpo (creazione `DAnnotation.new()`, push su `parent.annotations`) è **codice morto**.
- `eAnnotations` è un `case` riconosciuto (`data.ts:768,820,850`) solo perché il `default: Log.exx('unexpected field')` non scatti; il valore viene **ignorato**. `getAnnotations` (`:1036`) estrae il JSON grezzo, ma il canale termina nello stub.
- Scaffolding completo esiste (`DAnnotation`/`LAnnotation` con `generateEcoreJson_impl` per l'**export**, `Constructors.DAnnotation()` `classes.ts:804`), ma **l'import è no-op**: annotazioni scritte in un `.ecore` sono silenziosamente perse. Nessun canale residuo attivo.

### Q4c. Precedente di metadata su elementi M2
- **`DViewElement.appliableToClasses!: string[]`** (`view.tsx:215`; wiring costruttore `classes.ts:1086,:1097`) — **`string[]` semplice, NON `Pointer<DClass>[]`**. Consumatori interpretano ogni entry come: nome-di-tipo D (`['DObject']`, `['DModel']` in `lastViewpoint.ts:158-197`), oppure id/nome di classifier o `{id,name}` (`EdgeOverlay.tsx:567-572`, con `'DObject'` wildcard), oppure stringa opaca (`NestedView.tsx:95-96`). Risolti manualmente a read-time, **mai via pointer-resolver del framework**.
- Alternative più pesanti: array di pointer tipati risolti dal framework (`DClass.extends: Pointer<DClass,0,'N'> = []` `:2648`, `implements`, `references`…); dizionari pointer-keyed (`DViewElement.subViews`/`size` `view.tsx:217,:250`); oggetto free-form optional (`DModel.metadata?` `:4717`).
- **Precedente meno invasivo**: un `string[]` (o oggetto/array optional) direttamente su un D-object, con id/nome-classe come stringhe risolte dai consumatori — esattamente il pattern `appliableToClasses`. Un array di invarianti (stringhe JjEL su `DClass`, o su `DModel`) rispecchierebbe questa forma; in alternativa riusare il canale `annotations`/`DAnnotation{source, details}`.

### Q4d. Conseguenze di aggiungere un campo persistito
- **VersionFixer** (`VersionFixer.tsx`): migrazioni = metodi privati `['<from> -> <to>'](s: DState): DState`, scoperti reflectively in `setup()` (`:83-106`); `highestVersion` (`:31`) **auto-computato** come max dei "to" (`:102`) — nessuna costante da bumpare; highest attuale `['2.224 -> 2.225']` (`:993`). Migrazioni no-op legittime (`return s;`, es. `:837`, `:609`). Backfill pattern: itera `s.idlookup`, filtra per `className`, aggiungi campo se assente (canonico `['2.209 -> 2.210']` `:596-603`). L'auto-refresh `jsxString` in `update()` (`:133-143`) tocca **solo** `DViewElement`/`DViewPoint` → un campo su `DClass` non causa side-effect di view.
  - **Serve una migrazione?** Per il *load*: **no** (un campo optional assente si legge `undefined`). Serve **solo** se i progetti salvati vanno backfillati con un default non-undefined; altrimenti basta un bump `return s;` o nulla.
- **Save path**: `Projects.save` → `U.compressedState(dProject)` (`projects.ts:107`; `U.tsx:427`). Copia **l'intero** `store.getState()`, ricostruisce `idlookup` copiando ogni oggetto **per intero** (`:434`; uniche mutazioni: reset `isSelected`, skip `DProject` esterni), poi **`JSON.stringify(state)`** (`:439`) + compress. **Nessuna whitelist di campi, nessun `toJSON`/filtro di serializzazione** (grep `toJSON`/`whitelist`/`transient` = nulla di rilevante). Qualsiasi nuova property enumerable su `DClass` è **auto-inclusa** nel salvataggio; il load (`VersionFixer.update`) solo aggiunge/normalizza, mai strippa campi sconosciuti → sopravvive al round-trip.

---

## Q5 — Substrato UI per il feedback

### Q5a. Warning icon amber per orphan instance (spec 2026-05-22) — NON implementata come da spec
Il widget esatto ("amber `bi-exclamation-triangle-fill` top-right della card, tooltip, per orphan") **non esiste**. Cosa esiste invece:
- Orphan **stilizzato, non icon-badged**: `ObjectNode.tsx:339` (`isOrphan = !data.instanceOfClassId`), classe `mm-object--orphan` (`:342`); trattamento = bordo tratteggiato + header desaturato (`EditorV2.scss:1685-1694`, `border:1.5px dashed`). Nessun triangolo sulla card.
- L'amber `bi-exclamation-triangle-fill` esiste ma per **enum-stale su campi istanza**: `ObjectNode.tsx:413` (`mm-field__enum-stale-icon`), `M1PropertiesPanel.tsx:86` (`properties-field__stale-icon`) — per-campo, non per-card, e segnala literal enum non più valido.
- Decorazioni top-right reali su `ObjectNode`: singleton badge `bi-diamond-fill` (`:353-357`) e `<NodeProblemIndicator nodeId={id}/>` (`:359`) = **dot** colorato (non triangolo), solo per NodeProblem registrati (oggi solo `duplicate-name`, mai orphan).

### Q5b. Pattern error/warning per-elemento
1. **Badge per-riga TreeView**: `TreeViewContent.tsx:644-650` (`bi-exclamation-triangle-fill tree-problem-icon` con `data-severity`+tooltip); sorgente `useNodeProblems(problemKey)` (`:586`) → legge il **registry NodeProblem** condiviso col canvas.
2. **Dot + overlay canvas**: `problems/NodeProblemIndicator.tsx` (`.node-problem-dot--{warning|error|resolved}` `:37-47`), click apre `NodeProblemOverlay.tsx`; su ogni `ObjectNode` (`:359`). Registry = `problems/registry.ts` — **`Map<string,NodeProblem>` module-level + subscriber** (`:51-55`), letto via `useNodeProblems` (`useSyncExternalStore`, `:10-16`). **Unico producer**: `UniquenessProblemSync.tsx:76` (`registerProblem`) per `duplicate-name`; l'header (`registry.ts:1-28`) dichiara esplicitamente conformance/orphan come "future". `NodeProblemKind = 'duplicate-name'` soltanto (`:28`).
3. **Banner Properties (Info.tsx)**: `jj-conformance-bar--error`/`--warning` (`:555-566`), check multiplicity locale (`:532-539`), banner model-level (`:342-348`); più stale-enum per-campo `M1PropertiesPanel.tsx:85-88`.
4. **Dot conformance sul titolo tab**: `ConformanceIndicator.tsx` (`bi-check/exclamation/x/question-circle-fill` `:9-14` + tooltip `:56-60`), montato `TabDataMaker.tsx:29`. **Per-model**, non per-elemento.
5. **Toast / Log**: `Toast/ToastContext.tsx` (`success/error/info/warning` `:97-100`); 2 listener window: `GUARD_VIOLATION` → warning toast (`:105-118`, gated) e `TOAST` (`:120-137`). `Log` (`common/Log`, `joiner/index.ts:127`) = logger dev console-level, non UI per-elemento.
6. **Guard preventivo → toast**: `ConformanceGuard.ts` + `emitGuardViolation` (`:261-263`) → `useConformanceGuard.ts` in `EditorV2.tsx:55,449-450,1518-1521,2446` (upper-bound su link M1). Feedback = toast, non decorazione.

### Q5c. Precedente "pannello problemi"
**Sì, ma scoped all'editor JjTL (errori di parser), non alla validazione del modello.**
- `jjtl/views/ProblemsPanel.tsx` — pannello collassabile, conteggi severity, tab filtro (All/Errors/Warnings), lista cliccabile (`Problem {id,severity,message,line,column,source}` `:9-16`, `SEVERITY_CONFIG :36-55`); montato `JjtlDevelopmentEnv.tsx:848` (import `:12`), alimentato da errori parser via `parserErrorToProblem` (`:26-34`). View diagnostiche JjTL correlate: `MappingTraceView.tsx`, `JjtlStatusBar.tsx:94`, `SuggestedMappingsPanel.tsx`.
- Lato canvas: modulo `editor-v2/problems/` (per-nodo, senza pannello aggregato).
- **NON esiste** un pannello aggregato di validazione del modello: `validateConformance` produce `ConformanceViolation[]` ma è consumato **solo** da `ConformanceIndicator` (dot+tooltip), mai renderizzato come lista.

---

## Q6 — Trigger reattivi (senza toccare la critical zone)

### Q6a. Custom DOM events (`events/registry.ts`) — segnali "modello cambiato"
- `JjScriptEvents` (`:63-71`): `EXECUTION_END` (`:66`), `METAMODEL_CREATED` (`:69`), `ELEMENT_MODIFIED` (`:70`) — segnali di mutazione più forti.
- `JjodieEvents` (`:81-85`): `METAMODEL_UPDATED` (`:82`).
- `JjodelEvents` (`:7-60`): `IMPORT_SUMMARY_SHOW` (`:59`, post import), `HISTORY_CHANGED` (`:50`, undo/redo), `GUARD_VIOLATION` (`:51`), `VIEW_CREATED` (`:29`), `ACTIVITY_LOGGED` (`:57`).
- `SystemEvents` (`:99-103`): `JJTL_EXECUTION_RESULT` (`:101`, post trasformazione).
- Dispatch osservati: `METAMODEL_CREATED`/`EXECUTION_END` ~10 siti in `ScriptBlock.tsx` (`:530…:1199`) e `jjodie-integration/useMetamodelGeneration.ts`; listener in `TreeViewPanelContext.tsx:288-299`, `FeaturesPanelContext.tsx:74`, `JodieWindow.tsx:182`.

### Q6b. Pattern di subscription Redux
- **`store.subscribe`** — solo **2 usi reali** (entrambi nel side-panel Jodie, coarse + change-guard): `ChatMessages.tsx:355` (`:357-365` diff guard) e `JodieHeader.tsx:115` (`:117-125`). (Un terzo hit `JjtlDialogManager.tsx:44` non è lo store Redux.)
- **`useSelector`** — 22 file. Il pattern canonico "ricalcola su cambio modello" è **`useConformance.ts`**: `useSelector(state => state.idlookup?.[modelId])` (`:21`) come trigger + `validateConformance` **debounced 500 ms** in `useEffect` su `[modelId, modelData]`. È il precedente più vicino a una validazione reattiva.

### Q6c. Costo qualitativo (solo da codice, nessun benchmark)
- **Pattern `useSelector(idlookup[modelId])`**: ri-fira su ogni action che produce un nuovo reference della radice `idlookup` — di fatto ogni edit, ogni `SetFieldAction`, ogni step di operazioni bulk (import, esecuzione JjTL/JjScript). Durante un import `.ecore` o una trasformazione = frequenza **molto alta** (write per-elemento). Mitigato **solo** dal debounce 500 ms (≤~2 pass/sec). Senza debounce, prohibitivo.
- **`store.subscribe` nudo** (Jodie): fira su **ogni** action senza debounce; sopravvive solo perché il callback è un recompute economico dietro shallow-diff. Una passata di conformance qui sarebbe molto più pesante.
- **Eventi JjScript** (`EXECUTION_END`, `METAMODEL_CREATED`, `ELEMENT_MODIFIED`): coarse, bassa frequenza (1 per run/creazione), ma `ScriptBlock` emette a ~10 siti per run → un listener dovrebbe dedupe/debounce.
- **`IMPORT_SUMMARY_SHOW`, `JJTL_EXECUTION_RESULT`, `METAMODEL_UPDATED`**: single-fire per operazione, **dopo** la mutazione bulk → i punti di aggancio più economici per una validazione one-shot.
- **Lettura pratica**: i trigger più economici sono gli **eventi di completamento** (`EXECUTION_END`, `IMPORT_SUMMARY_SHOW`, `JJTL_EXECUTION_RESULT`, `METAMODEL_UPDATED`), uno per operazione; il path selector `idlookup` è il più "live" ma richiede la disciplina del debounce 500 ms già presente. `useJjomSync.ts`/`portDistribution.ts` **non** sono necessari a questa stima (frequenze inferite dai call-site degli eventi + debounce di `useConformance`); letti solo per capire i flussi, **nessuna modifica proposta**.

---

## Q7 — Check pendenti dal sanity check co-evoluzione (2026-05-22)

### Q7a. Flag `isID` su DAttribute — nessuna validazione di unicità
- Campo **`isID`** (non `iD`): D-layer `LModelElement.tsx:4169`, L-layer `:4228` (entrambi `// ? exist in ecore as "iD" ?`). Getter/setter `get_isID`/`set_isID` (`:4311-4319`) = plain `SetFieldAction` senza validazione. Consumatori: `duplicate()` (`:4295`), template view `DV.tsx:130`, toggle UI `Info.tsx:480`.
- **Validazione di unicità del valore-id: NON esiste.** Nessun codice verifica che due istanze non condividano lo stesso valore dell'attributo-id. `ConformanceValidator.ts` ha **zero** riferimenti a `isID`/`unique`/`duplicate`. `isID` è puro flag di metadata senza enforcement runtime.

### Q7b. Dedup nomi classe — nessun suffisso `(1)`/`(2)`
- La convenzione reale è un **suffisso numerico `_N`** (`Concept_0 → Concept_1 → …`), non `(n)`.
- Helper riusabile: **`U.increaseEndingNumber(s, allowLastNonNumberChars?, allowDecimal?, increaseWhile?)`** (`U.tsx:1496`), bumpa il numero finale finché il predicate `increaseWhile` (il collision-check) è falso (loop `:1513`, cap 10000).
- Entry-point: `LPointerTargetable.defaultname(...)` (`classes.ts:1431`) chiama `U.increaseEndingNumber(prefix+'0', false, false, newname => childrenNames.indexOf(newname) >= 0)` (`:1443`). Usato per `Concept_`, `pkg_`, `attr_` (es. classi `LModelElement.tsx:2669`).

### Q7c. Blocco difensivo "abstract has instances" (caso C.8) — precedente più vicino a un vincolo M2 con feedback
- È **`LClass.set_abstract`** (`LModelElement.tsx:3137-3150`). Check a `:3141`: `if (val && data.instances.length > 0)` — scatta solo togglando *verso* abstract con istanze M1 presenti.
- **Blocco write**: la `SetFieldAction`/`TRANSACTION` viene semplicemente saltata (branch attorno); il setter ritorna comunque `true`, il flag D non viene mai flippato.
- **Feedback utente**: **toast** — `U.alert('e', 'Cannot change the abstraction level since there are instances.', '')` (`:3143`) + `console.error`. `U.alert` (`U.tsx:388`) dispatcha `JjodelEvents.TOAST` (`:402`, `'e'`→priority `error`); marcato deprecated a favore di `toast.*` (`:393`) ma ancora funzionante.
- Il controllo UI (toggle `Info.tsx:115`, `field={'abstract'}`) **non** è disabilitato — il blocco avviene sul write, con feedback. Nota: non esiste campo `standalone` separato; il soggetto è il flag `abstract`. La controparte JjScript `abstract.ts:84` **non** replica il check (write diretto).

---

## Q8 — Identità dei metamodelli

### Q8a. Fix ID-first di `sourceConformance.ts` — PRESENTE nel working tree ma NON COMMITTATO
- `git status --short frontend/src/jjtl/components/sourceConformance.ts` → `??` (untracked, nuovo file); `git log --oneline -5 -- …` → **vuoto** (mai committato). Chiamanti anch'essi modificati-non-committati: ` M ExecuteTransformationDialog.tsx`, ` M JjtlDevelopmentEnv.tsx`. Test (anch'esso untracked): `__tests__/sourceConformance.test.ts`.
- Logica ID-first con fallback nome per legacy (`sourceConformance.ts:41-52`):
  ```ts
  const mmId = resolveModelMetamodelId(model);
  if (sourceMetamodelId) return !!mmId && mmId === sourceMetamodelId;          // ID-first, esatto
  const mmName = resolveModelMetamodelName(model);
  return !!mmName && !!sourceMetamodelName && mmName === sourceMetamodelName;   // fallback nome legacy
  ```
  `resolveModelMetamodelId` (`:17-24`) legge `metamodelId || conformsTo || metamodel.id`. Threading end-to-end: type `transformation.ts:15` (`sourceMetamodelId?`), dialog prop `ExecuteTransformationDialog.tsx:29` usato in `compatibleModels` useMemo (`:77`, dep `:88`), forwarding `JjtlDevelopmentEnv.tsx:898`.
- Root cause originale (doc `discovery_2026-07-14_transformation_source_conformance.md`): il dialog confrontava **per nome** e non riceveva nemmeno `sourceMetamodelId`; un modello conforme per identità ma con `metamodelName` derivato veniva escluso. Il fix rispecchia il precedente `ConformanceValidator.ts:63` (`mmClassById.get(id) || mmClassByName.get(name)`).

### Q8b. API ID-first: `metamodelId` → LModel → classi
Un validatore deve risolvere **per ID (pointer stringa)** usando `fromPointer`, non `fromD`:
- **`LPointerTargetable.fromPointer(ptr, state?): RET`** (`classes.ts:2435`, body `:2450-2451`) — resolver canonico **id-string → L-proxy**. Per un metamodello: `LPointerTargetable.fromPointer(metamodelId) as LModel`.
- `LPointerTargetable.fromD(data)` (`classes.ts:2422-2432`) prende un **D-object** (o array), non un id grezzo.
- Enumerazione classi: **`LModel.get_classes(c, s?, includeCross?)`** (`LModelElement.tsx:5453`); per metamodello ritorna `_getallSub(...)` (`:5463`). Accessor property **`LModel.classes`** (campo `LModelElement.tsx:4859`, `LClass[] & Dictionary<"$name", LClass>`). Anche `LModel.packages`/`get_packages` (`:5411`), `LPackage.get_classes` (`:1896`).
- **Path canonico ID-first**:
  ```ts
  const lmodel = LPointerTargetable.fromPointer(metamodelId) as LModel;  // classes.ts:2435
  const classes = lmodel.classes;                                        // get_classes LModelElement.tsx:5453
  ```
  Immune a rename / suffissi di dedup / whitespace drift — la stessa proprietà su cui poggia il fix Q8a.

---

## Dipendenze e rischi individuati

1. **Frammentazione (rischio principale)**. La conformance è sparsa su ≥7 superfici (Q1d) con regole sovrapposte ma non identiche: un Livello 0 nuovo rischia di diventare l'ottavo silo. Il *reporter* canonico (`ConformanceValidator`) copre 6 check e ha già lo shape `ConformanceViolation[]` + severity + messaggi; è il candidato naturale da estendere invece di riscrivere. I gap noti (target-type reference, astratto-instanziazione runtime, cardinalità attributi, containment, enum-literal, unique) sono i primi candidati per il Livello 0.
2. **Il registry `problems/registry.ts` è già progettato come home futura di conformance/orphan** (header `:1-28`) ma ha un solo producer (`duplicate-name`). È il punto di aggancio meno invasivo per i badge canvas; oggi però `NodeProblemKind` è un'unione chiusa (`registry.ts:28`) → estenderla è un edit necessario e localizzato.
3. **Sink UI multipli e non allineati**: dot per-model nei tab (`ConformanceIndicator`), badge per-nodo canvas (`NodeProblemIndicator`/TreeView), banner Info.tsx (con bug latente `:538`), toast (`GUARD_VIOLATION`). Nessun pannello aggregato di problemi *del modello* (il `ProblemsPanel` è JjTL-only). Un Livello 0/1 completo probabilmente richiede una destinazione aggregata nuova o il riuso del pattern `ProblemsPanel`.
4. **Assertion engine (Livello 1)**: JjEL ha tutti i costrutti; manca **solo** l'harness per-istanza (iteratore su `ClassName.allInstances` + binding `self` + raccolta violazioni). Costruibile su `buildEvalContext` + `EvaluationContext.child` + `jjelEvalWithDiagnostics` **senza toccare l'evaluator** (coerente col pattern JjLet). Attenzione: `forall` in JjEL proietta un array, non un booleano — la sintassi di invariante deve usare `.all(x: P)`/`exists`.
5. **Persistenza**: aggiungere un campo optional su `DClass`/`DModel` è a basso rischio (nessuna whitelist, auto-JSON.stringify; migrazione solo per backfill). Canali già presenti: `annotations`/`DAnnotation{source,details}` (EMF-style, ma import stubbed) e `DModel.metadata?`. L'import Ecore delle eAnnotations è no-op (`data.ts:651`), quindi nessun canale residuo che possa collidere.
6. **Costo reattivo**: il path `idlookup` selector è "live" ma va sempre debounced (250-500 ms, come `useConformance`); gli eventi di completamento sono i trigger economici. Una validazione naive su `store.subscribe` per-action sarebbe proibitiva durante import/trasformazioni.
7. **Debiti pre-esistenti da NON toccare in questa fase ma da tenere presenti**: strumentazione committata in `ConformanceGuard.ts:47-78`; import morto in `LModelElement.tsx:96`; bug latente in `Info.tsx:538` (`conform` assegnato non AND-accumulato). Segnalati, non modificati.
8. **Identità**: il criterio ID-first (`fromPointer` → `lmodel.classes`) è già il precedente in `ConformanceValidator.ts:63` e nel fix uncommitted `sourceConformance.ts`. Il validatore deve usare lo stesso, mai il nome. Rischio: il fix Q8a è ancora uncommitted — se venisse scartato, il criterio ID-first resterebbe solo nel reporter.

---

## Domande aperte per Alfonso

1. **Livello 0 = estendere `ConformanceValidator` o nuovo motore?** Il reporter esistente ha già shape/severity/messaggi ma è cablato solo ai dot dei tab (un solo consumatore). Estenderlo con i gap noti (target-type, astratto, cardinalità attributi, containment, enum, unique) o partire pulito?
2. **Dove atterra il feedback?** Dot per-model (esistente) / badge per-nodo (registry `problems/`) / pannello aggregato nuovo (sul modello `ProblemsPanel`) / toast. Quali sink per Livello 0 e quali per Livello 1?
3. **Trigger**: live-debounced (pattern `useConformance` 500 ms) o on-demand (comando/pulsante)? O ibrido (live per Livello 0 leggero, on-demand per invarianti costose)?
4. **Persistenza invarianti**: campo `string[]` su `DClass` (stile `appliableToClasses`), collezione a livello `DModel`, o canale `annotations`/`DAnnotation`? Le invarianti sono per-classe (con `self`) o anche a livello modello/package?
5. **Sintassi invariante**: dato che `forall` JjEL proietta un array, si adotta `Class.allInstances.all(self: <expr>)` o una keyword `invariant`/`constraint` dedicata sopra JjEL (che il layer JjLet traduce)? Serve un nome simbolico o si riusa il binding `self`?
6. **`validate` JjScript**: mantenere separati il linter M2 (`validate.ts`) e la conformance M1↔M2, o `validate` deve delegare/estendersi al nuovo motore (es. `validate conformance`, `validate invariants`)?
7. **Well-formedness M2 (seconda battuta)**: sullo stesso motore assertion (invarianti su classi/reference M2) o su un check strutturale dedicato? I gap di `validate.ts` (opposite-consistency stub `:290-293`) rientrano qui.

---

## Hard stop

Nessuna implementazione, nessun diff, nessuna proposta di modifica al codice. Working tree invariato salvo questo report e l'entry di log. La Fase 2 parte solo dopo go-ahead esplicito in chat.
