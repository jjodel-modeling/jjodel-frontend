# Dynamic Classification Notation: metamodel, object level and simulation

Status: in force, ratified 2026-11-06 22:13 (Alfonso, «sì a tutti i consigli»), decisions R-DCN-1..8 in
`docs/decisions.md`. Not implemented. Front `dcn`, owner chat C-2026-11-06-2159.
Sources: Selić and Pierantonio, *Fixing Classification* (ISoLA 2021); ter Beek et al., *Towards Dynamic
Classification in Domain Modeling with Jjodel* (LNCS 16470, 2026); Bucchiarone, Pierantonio, Vangheluwe,
*Synergic modeling of coherent systems* (SoSyM 25, 2026).
Depends on: R-OI (front `instance-of`), R-SIM (front `simulator`), `docs/spec/concern_languages.md` (JjEL).

## 1. Scope

This spec defines the Dynamic Classification Notation (DCN) as a Jjodel language: class diagrams whose static
classes own viewpoints of dynamic classes, the corresponding object diagrams, and their simulation. It replaces
the ad hoc metamodel of the LNCS 16470 chapter (its Fig. 1 and Fig. 3) and adds the coherence constraints of the
SoSyM paper.

Out of scope for the first slices: fuzzy or graded membership (Selić §3), free LTL in trajectory constraints,
dynamic structure (links created or removed during a run), viewpoint hierarchies.

## 2. Decisions

| Id | Decision |
|---|---|
| R-DCN-1 | The DCN extends the UML metamodel of the instance-of front (R-OI). It is not a separate language with cross-link `instanceof` references. Classes and instances live in one model; the object diagram reuses R-OI instantiation, slot synthesis, Sync slots, ghost and orphan rows, and the `instantiation` problem kind. |
| R-DCN-2 | The dynamic classification of an instance is derived from its slot values through the invariants. It is never stored on the instance. |
| R-DCN-3 | An instance has slots for all features of its static class and of every dynamic class of its viewpoints. A slot of an inactive dynamic class is dormant: it keeps its value and cannot be read outside its class. Access is enforced by the static rule W1, not by a runtime tri-state. |
| R-DCN-4 | The default run policy is Interleave with Random choices. Sync stays available as a policy. |
| R-DCN-5 | Trajectory constraints in the first slice are limited to two bounded patterns, BoundedPersistence and BoundedResponse. Free LTL comes after the .smv exporter. |
| R-DCN-6 | Unbounded `Integer` attributes are simulated but rejected by the exporter with a problem. Only Boolean, Enumeration and Range are verifiable (the finite-domain decision of 2026-10-10). |
| R-DCN-7 | JjEL gains one accessor, `self.in(V::D)`, true when dynamic class D of viewpoint V is active. It goes through the languages concern before any lane implements it. |
| R-DCN-8 | DCN simulation is a second engine nucleus, "guarded commands over slots", next to the Petri nucleus and not inside it. It shares run state, panel, trace, watches, I/O board and exporter. |

## 3. Abstract syntax, class level

Inherited from the R-OI UML metamodel: `NamedElement`, `Classifier`, `Enumeration`, `Literal`, `Generalization`,
associations with their ends.

```
class StaticClass extends Classifier {
  isAbstract  : Boolean
  isSingleton : Boolean
  attributes  : Attribute[*]     (containment)
  operations  : Operation[*]     (containment)
  viewpoints  : Viewpoint[*]     (containment)
}

class Viewpoint extends NamedElement {
  isOverlapping : Boolean = false   // several classes may be active together
  isComplete    : Boolean = true    // every state must fall in at least one class
  classes       : DynamicClass[1..*] (containment)
}

class DynamicClass extends NamedElement {
  invariant  : Expression           // core type (R-SIM-17), boolean JjEL
  isCreation : Boolean              // supplies defaults at instance creation
  attributes : Attribute[*]         (containment)
  operations : Operation[*]         (containment)
  monitors   : Monitor[*]           (containment)
}

class Attribute extends NamedElement {
  type         : DataType           // Boolean | Enumeration | Range[lo..hi] | Integer | String
  defaultValue : Expression[0..1]
  lower, upper : Integer
}

class Operation extends NamedElement {
  parameters : Parameter[*]
  pre        : Expression[0..1]     // absent = true
  body       : Action[*]            // `<target> := <Expression>`, parallel assignment
  redefines  : Operation[0..1]      // a viewpoint override of a static-class operation
}

class Monitor extends NamedElement {
  body : Action[*]                  // runs at every tick while its class is active
}

class CoherenceConstraint extends NamedElement {
  context   : StaticClass
  pointwise : Expression[0..1]      // phi, over one state
  pattern   : TrajectoryPattern[0..1] // psi, over the trajectory
}

abstract class TrajectoryPattern
class BoundedPersistence extends TrajectoryPattern { condition : Expression; k : Integer }
class BoundedResponse    extends TrajectoryPattern { trigger : Expression; response : Expression; k : Integer }
```

Differences from the chapter's metamodel: invariants, bodies and monitors are core `Expression`/`Action` instead of
`EString`; `Relation`/`End`/`Association`/`Composition` are replaced by R-OI associations; `isOverlapping` and
`isCreation` from Selić are restored; `redefines` and `CoherenceConstraint` are new.

## 4. Abstract syntax, instance level

The R-OI instance level, unchanged: `InstanceSpecification` with its classifier, `Slot` with `definingFeature`
and values, `Link` for associations. The classifier of an instance is always a `StaticClass`.

Amendment to R-OI-13, owed to the instance-of front: a slot whose `definingFeature` belongs to a dynamic class of
the classifier is dormant, not orphan, and raises no problem.

## 5. Well-formedness

Static checks, reported in the problems registry.

- **W1** An invariant, precondition, operation body or monitor of dynamic class D reads only features of the
  static class, features of D, or features of another class D' under the guard `self.in(D')`.
- **W2** An expression of viewpoint V that reads the classification of viewpoint V' creates a dependency
  V → V'. The dependency graph is acyclic.
- **W3** An operation redefines at most one operation of its static class, with the same signature.
- **W4** Operation bodies and monitors assign only features visible in their class.
- **W5** Exclusivity (non-overlapping viewpoint) and completeness (complete viewpoint) of the invariants. Decided
  by enumeration or by the model checker when all read attributes are finite; otherwise checked at run time.
- **W6** Write ownership (R-DCN-23): two viewpoints never write the same property, and a static operation writes only
  properties no viewpoint writes. Deduced from the write targets of operation, redefinition and monitor bodies.

W5 is not theoretical. The drone model of the chapter violates both properties: `Empty` overlaps `Charging` by
design, so `Mode` must be overlapping; distance 50, speed 0, battery 40 falls in no class of `Mode`. `Alert` has
similar gaps. The simulator therefore reports "unclassified" as an explicit outcome.

## 6. Semantics

A configuration σ assigns a value to every slot of every instance; links are fixed. The classification of
instance o in viewpoint V is `C_V(o, σ) = { D in V | invariant_D(o, σ) }`, a derived function of σ.

Steps:

- **Invocation** `op(o, Op, args)`: an external event. Enabled when the owner class of Op is active for o
  (always, if the owner is the static class) and `pre` holds. Parameters are event attributes (`event.a`,
  R-SIM-144). Invoking a static operation F expands into F itself plus every redefinition of F in an active
  dynamic class.
- **Tick**: runs the monitors of every active dynamic class. Produced by the I/O board Clock, which is tied to
  the run (R-SIM-122).

Composition of contributions from different viewpoints (redefinitions of the same F, monitors of one tick):

- **Interleave** (default, R-DCN-4 as amended by R-DCN-22): each contribution of a viewpoint to a tick is a transition labelled with its viewpoint, and an invocation is always one transition with its active redefinitions; the order
  goes through the existing "Choices: Ask | Random" policy. This is the cross-viewpoint transition system of the
  SoSyM paper (Definition 3).
- **Sync**: all contributions in one parallel assignment read on the previous state; two contributions writing
  the same slot are a double assignment, a defect per R-SIM-17.

After every step the engine recomputes the classification and then checks, in order: ranges (out of range halts
the run, as "unsafe" does in Petri); completeness of complete viewpoints (empty classification halts);
exclusivity of non-overlapping viewpoints (multiple classes halt); coherence constraints (violation reported
as a watch hit).

## 7. Simulation

The object diagram seeds σ at Reset. The run never writes the model (R-SIM). An explicit gesture,
"Save snapshot as object diagram", materializes the current σ as new instances.

Coherence constraints are watches (R-SIM-137): φ as a state invariant, ψ as a counter automaton per instance.
Step back, scenarios and the slider work on σ unchanged.

With Random and a batch of N runs the panel estimates the coherence degree γ (SoSyM, Definition 8) as the
fraction of admissible traces.

Canvas rendering during a run: one compartment per viewpoint with the active class highlighted, the monitor
icon on classes with running monitors, dormant slots greyed.

## 8. Engine placement

The new nucleus does not know `DynamicClass`. It knows roles that a STC profile "Dynamic classification" maps
onto the metamodel: Viewpoint, dynamic classifier, Invariant, Operation, Redefinition, Monitor, Instance-of.
Another metamodel with viewpoints and invariants can use the same profile.

## 9. Export to nuXmv

| DCN | .smv |
|---|---|
| slot of a Boolean, Enumeration or Range attribute | `VAR` |
| classification `in(V::D)` | `DEFINE` |
| operation invocation | `IVAR` with guard |
| tick | transition on a tick input |
| φ | `INVARSPEC` |
| BoundedPersistence, BoundedResponse | bounded `LTLSPEC` |
| `Integer` attribute | problem, not exported (R-DCN-6) |

## 10. Slices

1. Discovery: how much of the R-OI instance level supports dormant slots, and where the second nucleus plugs
   into run state and panel (P-2026-11-06-2240).
2. Metamodel extension and W1..W4.
3. `self.in(V::D)` in JjEL (languages concern first).
4. Nucleus with Interleave and Sync, derived classification, run-time checks.
5. Canvas rendering, snapshot save, coherence watches, γ batch.
6. W5 by enumeration; exporter mapping of §9.
