# DCN L2.2: the drone fixture, DCN metamodel on the UML fixture

Prompt-ID: P-2026-11-06-2335
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-07 · lane full · 0e2867ed8 · probe 17/17, no visual check owed (closure written by the chat C-2026-11-06-2159 from the handoff after the context ceiling)
Lane: full (new probe, a fixture other lanes will build on)
Depends: R-DCN-1, R-DCN-3, R-DCN-10, R-DCN-13, R-DCN-16, R-DCN-17, R-DCN-19, L2.1 (d51def3e7)
Worktree: ~/jjodel-w-dcn-l22, branch dcn-l22, from dcn at this prompt's commit (P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-06 23:29 «Si e si»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. Commit as soon as the probe is green. Every reply opens with [P-2026-11-06-2335 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; grep only the summary lines of a probe log (MEAS, PASS, FAIL), never cat it. Before launching a probe check `uptime`: wait while the 1-minute load is above 20.

## Contesto (non rifare l'analisi)

The DCN is an extension of the R-OI UML metamodel (R-DCN-1). The UML fixture `frontend/scripts/probe/uml-class-object-fixture.ts` builds that metamodel through the L-API in the browser (UML_CLASSES, UML_REFS, UML_ATTRS, `buildUmlMetamodel`) and writes the `ontoBindings` records. L2.1 added `featureSources` to the binding (`frontend/src/model/ontological/bindingCodec.ts`, `bindingReader.ts`, `bindingCheck.ts`): a list of reference paths applied from every classifier of the generalization closure, whose last hop yields features, with `dormantOwner` on the closure. Read the UML fixture's metamodel tables and its binding writer, then only what the new probe imports.

## COSA

A new browser probe `frontend/scripts/probe/dcn-drone-fixture.ts` (R-DCN-19), run with `lane-run probe` like the UML fixture (free port in 3080..3099, checked with `lsof`). It reuses the UML fixture's builders by import where they are exported; if a builder is not exported, copy the minimum and say so in the commit body (the UML fixture is not edited). It builds:

(1) **The DCN metamodel** (spec §3) on top of UML: `StaticClass` extends `Class` (it keeps `ownedAttributes`, `ownedOperations`, generalization) with `viewpoints: Viewpoint [0..*]` containment and `isSingleton: EBoolean`; `Viewpoint` extends `NamedElement` with `isOverlapping`, `isComplete` and `classes: DynamicClass [1..*]` containment; `DynamicClass` extends `NamedElement`, not `Classifier` (R-DCN-10), with `invariant: Expression`, `isCreation`, `attributes: Property [0..*]`, `operations: Operation [0..*]`, `monitors: Monitor [0..*]` containment; `Operation` gains `pre: Expression [0..1]`, `body: Action [0..*]`, `redefines: Operation [0..1]`; `Monitor` extends `NamedElement` with `body: Action [0..*]`; `Property` gains `rangeMin`, `rangeMax: EInt [0..1]` (R-DCN-13); `CoherenceConstraint`, `BoundedPersistence`, `BoundedResponse` as in spec §3. Measure (MEAS) whether `Expression` and `Action` are accepted as attribute types through the L-API and whether a multivalued `Action` attribute keeps its order.
(2) **The binding**: the `object` record of the UML fixture plus `featureSources: [{ path: [StaticClass.viewpoints, Viewpoint.classes, DynamicClass.attributes] }]` (M2 ids). Run `bindingCheck` on it (zero diagnostics expected) and measure `instantiableClassifiers`: `StaticClass` instances are offered, `DynamicClass` instances never (R-DCN-10).
(3) **The drone class level**, transcribed from the LNCS 16470 chapter Fig. 6 (the values are given here, do not look for the figure): static class `Drone` with `distance`, `speed`, `power`, `battery`, `vmax` (Integer; `battery` with rangeMin 0, rangeMax 100). Viewpoint `Mode` on `Drone`, `isOverlapping` true: `Charging` (inv `self.distance == 0 && self.speed == 0 && self.battery < 100`, one monitor), `Ready` (inv `self.distance == 0 && self.speed == 0 && self.battery == 100`, operation `takeOff()`), `Flying` (inv `self.battery > 0 && self.speed > 0`, operations `rampUp()`, `rampDown()`, one monitor), `Empty` (inv `self.battery == 0`). Static class `WeatherAssessmentUnit` composed by `Drone` (role `WAU`), owning the abstract `Sensor` (role `ownedSensors`); singleton static classes `TempSensor` (`value` Integer, `unit` String, `status` SensorStatus), `WindSensor` (`speed` Integer, `unit`, `status`), `RainSensor` (`intensity` Integer, `unit`, `status`, `presence` Boolean), `HumiditySensor` (`relative` Integer 0..100, `unit`, `status`), each with `injectFailure()` and `reset()`; enumeration `SensorStatus` (OK, Fault, Calibrating). Viewpoint `Alert` on `WeatherAssessmentUnit`, `isOverlapping` false, `isComplete` true: `Safe` (Wind.speed <= 8 && Temp.value >= 0 && Temp.value <= 35 && Humidity.relative <= 60 && Rain.intensity == 0), `Moderate` (Wind.speed > 8 && Wind.speed <= 12 && Temp.value >= -5 && Temp.value <= 35 && Humidity.relative <= 80 && Rain.intensity <= 2), `Adverse` (Wind.speed > 12 && (Temp.value < -5 || Temp.value > 35) && Humidity.relative > 80 && Rain.intensity > 2). The chapter reads the sensors by singleton name (`Wind.speed`); write each invariant in the JjEL navigation that parses today from `self` (a WeatherAssessmentUnit) through `ownedSensors`, and report (MEAS) which form parses, which does not, and why. Operation bodies and monitor bodies are placeholders that parse as `Action` (for instance `self.battery := self.battery + 1`); whether they parse is a measure, not a gate (lane L3.4 owns slot writes, R-DCN-12). Leave `PhysicalQuantity` and `Context` out, and say so.
(4) **Measures, the acceptance of L2.1 at class level**: `featureClosure` of `Drone` lists the five own features, then the features of the four Mode classes, with `dormantOwner` naming each class; the same for `WeatherAssessmentUnit` with Alert. The conformance validator on the class-level model: list every problem it reports (expected: none from DCN elements; any problem is a finding, not a fix). Export the project with GV_SAVE as `dcn-drone.jjodel` when set, as the UML fixture does.
(5) Commit the probe and its measures file (where the UML fixture writes its own) in one code commit; the log entry in `docs/log-inbox/dcn.md` (append at the end) and the Status flip in one docs commit. No visual check is owed beyond the probe's own screenshots, which the chat reads.

## HARD STOP

A need to edit any file under `frontend/src/`, or the UML fixture: stop with Outcome: question.

## NON FARE

No source changes, no edits to decisions or spec, no object-level instances (lane L2.5 waits for R-OI on the trunk), no push, no merge. Public repo: name no partner company.

## DOVE

New: `frontend/scripts/probe/dcn-drone-fixture.ts`. Read: `frontend/scripts/probe/uml-class-object-fixture.ts`, the builders it imports, `frontend/src/model/ontological/`.

## RIFERIMENTI

docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §3, §5; docs/decisions.md R-DCN-1..21; docs/discovery/discovery_2026-11-06_dcn_foundations.md §2.3.
