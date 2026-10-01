# Discovery — #157 R3, i tipi «top-level» devono essere creabili alla radice

**Data**: 2026-10-01
**Branch**: `feat/157-environment-config` @ `5dc9246b7`
**Fonte**: piano di triage 2026-09-28 §4 R3; osservazione di @tmaog del 2026-09-23 («phase» non si
crea da sola, è parte di «scenario»); screenshot di Juri del 2026-10-01 (Certification Design:
CompetencyCluster dentro Domain, Prerequisite dentro CompetencyCluster, Activity dentro
AssessmentBlueprint).
**Stato**: Fase 1 read-only. Go-ahead di Juri in chat: «prosegui con r3 e r7».

## 0. Answer in brief

- **Misurato** con la sonda `_tmp_157_r3_measure.ts` (Playwright, fixture con Scenario ◇pathway→
  Phase e una classe astratta Person, tutte e due segnate top-level): «New» su **Phase** crea
  `Phase_1` con `father` = `DModel`, cioè un pezzo di Scenario alla radice del modello, fuori da
  ogni Scenario; «New» su **Person** (astratta) crea `Person_0`. Nessun errore a schermo.
- Causa: `createInstance` chiama `addObject(json, classId, true)` con `forceCreation`, che salta i
  controlli di istanziabilità (`LModelElement.tsx:7313-7315`). Il wizard lascia segnare qualunque
  classe.
- Il core ha già la regola: `LClass.rootable` (`LModelElement.tsx:3091-3094`) = override esplicito
  del metamodello se c'è, altrimenti istanziabile (non astratta, non interfaccia, non singleton) e
  non composta. Misurato: Scenario true, Phase false (composta da Scenario), Learner true,
  Person false (astratta), Educator true.
- **Fix**: una funzione pura `topLevelReason` (perché un tipo non si crea alla radice, o null) letta
  da due posti: il wizard (classe non segnabile, con il motivo; se è già segnata si può solo
  togliere) e il Configurator (niente «New» su quel tipo, con il motivo; le istanze esistenti
  restano elencate e modificabili).
- Default scelti senza chiedere: usare la regola del core (che rispetta l'override del language
  developer) invece di quella del Data Manager (`newInstanceReason`, che non lo rispetta);
  tenere in lista i tipi già segnati, solo senza «New».
- 5 file, nessuno di §3.1.

## 1. Ipotesi falsificata

«Il "New" inerte segnalato su un tipo editable è una classe non creabile alla radice» (triage §4
R3). Per Educator era un'altra causa, corretta in `6b7891bae`. Per le classi davvero non creabili
il pulsante non è inerte: crea, e crea un'istanza sbagliata.

## 2. File letti

- `frontend/src/model/logicWrapper/LModelElement.tsx:3058-3104, 4110-4116, 7257-7345`
- `frontend/src/components/editor-v2/hooks/createAdapter.ts:491-560`
- `frontend/src/jjform/create.ts:170-215` (`newInstanceReason`)
- `frontend/src/components/editor-v2/hooks/shapeAdapter.ts:40-110` (`root` = `rootableClasses`)
- `frontend/src/components/editor-v2/hooks/useEditorMode.ts:505-520`
- `frontend/src/components/envgen/steps/MetaclassesStep.tsx`, `ui/Checkbox/Checkbox.tsx`
- `frontend/src/components/environment/ConfiguratorTab.tsx`

## 3. Findings

- `LModelElement.tsx:3093-3094`: `if (c.data.rootable !== undefined) return c.data.rootable;`
  `else return this.get_instantiable(c) && !this.get_isComposed(c);`
- `:3058`: `get_instantiable(c) { return !(c.data.abstract || c.data.interface || c.data.isSingleton); }`
- `:4113`: «if missing, only classes not contained, not abstract and not interface can be a model
  root. … If set, the criteria are overriden by your choice.»
- `useEditorMode.ts:511-512` (forma del Data Manager): `!c.isAbstract && !c.isSingleton &&
  !compositionTargetIds.has(c.id)`, senza l'override `rootable`. Divergenza preesistente, non
  toccata qui.
- `Checkbox.tsx` accetta `disabled`.

## 4. Piano (Fase 2)

1. `joiner/environmentConfig.ts` — `topLevelReason(flags)`, pura, zero import.
2. `joiner/__tests__/environmentConfig.test.ts` — casi e banco di mutazione.
3. `envgen/steps/MetaclassesStep.tsx` — classe non segnabile con il motivo; già segnata → solo
   togliere, con avviso.
4. `envgen/EnvGenWizardModal.scss` — stile del motivo.
5. `environment/ConfiguratorTab.tsx` — niente «New» su un tipo non creabile alla radice, con il motivo.

Verifica: la sonda di misura rifatta come verifica (prima/dopo), le due sonde precedenti, smoke.

## 5. Rischi

- Un progetto già configurato con tipi non creabili (forse «AIM Pro») li vede ancora nella
  colonna e nella lista, senza «New»: voluto, per non nascondere istanze esistenti.
- Singleton: per il core non è rootable senza override, anche quando non ne esiste ancora uno.
  Si segue il core.
