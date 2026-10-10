# Memo: proposal on the guard core of JjEL and on guard evaluation errors (input to R-SIM-145)

**Status:** proposal, not ratified. Alfonso, 2026-10-10 20:17, agreed that it be brought to the owner
chat of the simulator. It does not decide anything by itself.
**Origin:** Jjodel Development project chat of 2026-10-10 (afternoon), while writing the formal semantics
of guards and actions for the paper now in `~/jjodel-research/stc-papers/stc-semantics/`. The formal
text is `~/jjodel-research/sosym-stc/sections/04b-guards.tex` (definitions Core syntax,
Well-formedness, Core semantics, Firing with actions; propositions Totality and Strict connectives;
lemma Correspondence with nuXmv).
**Why now:** R-SIM-145 is reserved for guard evaluation errors and awaits its report. The paper fixes a
semantics; if the engine decides otherwise, the paper must follow the engine, so the two should be
settled together.

## The idea in one paragraph

Because the model is frozen during a run (spec of the computational model), every navigation of the model in a guard or
action denotes a constant; only the marking, the state σ, the event and the inputs vary. Guards in use
are boolean combinations of comparisons, with no quantifier (Alfonso, 2026-10-10). A small core of JjEL
can therefore be given a semantics of its own, checked at Reset on the frozen model, and translated
almost literally into nuXmv expressions. With the checks of point P1, the only error left at run time is
arithmetic.

## Proposals

**P1. Guard core, checked at Reset.** Guards and actions are restricted to: constants (boolean, integer,
enumeration); paths `self`, `event`, `model` followed by single-valued references; attribute reads
`π.f` (boolean, integer, enumeration); state reads `π.[x]`; the marking read; input variables;
`not`, `and`, `or`, unary minus, `+ - * div mod`, `= != < <= > >=`, and object equality. Excluded:
collections and every operation on them (size, select, quantifiers), strings, operation calls,
conditional expressions, `node`. A path through a reference with upper bound greater than one is a
defect even when the model gives it one target. Everything outside the core is a compile defect on the
line of R-SIM-61, in the problems registry as every compile defect (R-SIM-70).

**P2. Errors propagate strictly; no short-circuit.** If any operand is an error, the result is an error.
Reason: the guard of a transition is the conjunction of several bound attributes in no particular order
(R-SIM-90), and the catalog requires that combination be commutative and idempotent. With a
left-to-right short-circuit, `false and error` is false but `error and false` is error, so the meaning of
a transition would depend on the order in which two attributes are stored. Consequence for the code:
the evaluator must evaluate both operands, or compute the error condition separately and strictly.

**P3. A guard evaluation error halts the run (candidate content of R-SIM-145).** If a transition whose
trigger and marking conditions hold has a guard that evaluates to an error, the step halts the run with
the expression as the reason, as for a marking above the bound. An error is never read as false (which
would silently disable a transition) nor as true. The alternative, excluding the transition and reporting
the defect, is what the SoSyM draft described; it makes the error invisible to the model checker,
because the exported model would simply lack the transition.

**P4. Actions out of domain halt.** An action whose value is an error or lies outside the declared domain
of the state attribute halts the run, never saturates nor wraps. Two assignments of one step whose
paths denote the same location (for instance `self.[n]` and `self.next.prev.[n]`) are a Reset defect:
paths are frozen, so the conflict is decidable.

**P5. `div` and `mod` truncate towards zero** (what `Math.trunc(n / d)` and `n % d` compute, and, to be
verified in the manual, what nuXmv computes). A divisor that reads neither the marking, the state nor an
input and is zero is a Reset defect; a zero divisor that depends on the run is an error under P3.

**P6. `model` is a path root** denoting the root object, so `model.counter` reads the frozen attribute
and `model.[counter]` the state, as the paper's motivating example already assumes. Probably the
current behaviour; to be confirmed.

## Tension with R-SIM-144 (ratified today)

R-SIM-144 lets an unset attribute read what the frozen M holds, `null` for an optional attribute without
default, compares `null` as false (true for `== null`), and lists unset read attributes in a warning at
Reset. The core instead treats a read of an unset slot on a frozen path as a Reset defect (its
well-formedness condition (iii)): that is what makes guards total and removes the absent value at run
time. Two ways out:
(a) keep R-SIM-144 as is, and the paper extends the core with `null` and its comparisons, losing the
totality result; (b) for guards and actions, promote the R-SIM-144 warning to a defect, amending
R-SIM-144. The paper prefers (b), but R-SIM-144 rests on measurements the paper did not make, and the
choice belongs to the owner chat and to Alfonso. Note that P3 of R-SIM-144 (a read of `event` where no
event can be present is a defect) is already the core's condition (ii).

## What a discovery should measure before ratifying

Whether the evaluator short-circuits `and`/`or` today; what happens today when a guard throws, returns a
non-boolean, or divides by zero; how `model` resolves; which constructs actually appear in the guards and
actions of the demo projects (DemoPEST, DemoPetri, DemoESM, DemoFlowB) and of the reference models;
how far the current static checker (the subset that expands to finite formulas over the frozen model) is
from the core of P1.
