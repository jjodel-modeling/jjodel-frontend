# Textual syntax: plan after T7 (IDE-level editor)

Chat C-2026-11-03-1037, front `codegen`. Decision: R-TXT-34 in `docs/decisions.md`. This replaces steps 3 to 6 of the earlier plan.

## Rules, unchanged

One lane per step, merges one at a time, a 5-minute load average under 40, crops for every visible change, and a statement of exactly what was verified: a direct model write in a probe is not a canvas gesture, a unit test is not a check in the app. Tests first, mutation bench where a lane writes to a model. Push, deletions and worktree removal wait for Alfonso. Crops of B and E go to him.

## Architecture

One language service derived from grammar and metamodel, wired to the Monaco providers. No code specific to a metamodel. Acceptance on a non-hardware metamodel first; the Briefs stay a read-only regression check.

## Gate before A

T7 finishes and merges, with the rule on positional paths settled (`docs/discovery/discovery_2026-11-03_textual_positional_paths.md`). Then Alfonso's hand test. A starts after it.

## Order

**A. Tolerant parser with positions, and T9.** Concrete syntax tree, comments survive an application (R-TXT-20). Starts with a short discovery measuring how the parser holds up on incomplete text. R-TXT-21 (8) stands: what is recovered from a broken text shows as outline and markers and is never applied.

**B. Navigation and reading.** Semantic highlighting (keywords, types, resolved and unresolved references, values); an outline inside the Text tab, left of the text, collapsible, following the cursor and filterable; breadcrumb; folding; go to definition; find references; hover with metaclass, multiplicity and documentation.

**C. Compact notation.** Expression notation (`driver` as `st & (is_sw)`, round trip to the model), T4b (annotations form), T5 (other styles). Test case: a port on one line, `input instr : Word(32)`. To settle at its start: R-TXT-16 (3) speaks of a class as a binary operator, while Conj/Disj hold an `ops` list, so the annotation has to cover n-ary containment; redundant parentheses have no model element and survive only through the tree of A; precedence has to fit the LL(1) check of T3.

**D. Writing aids.** Contextual completion (allowed keywords, valid targets, enum literals), errors on the line with quick fixes, including conformance violations and validation rules; safe rename; formatting.

**E. T10 and synced selection.** Scenario 2 and selection synced between text and canvas, both ways, checked with a real canvas gesture. If it enters the critical zone: Layer Impact Report and Alfonso's go-ahead.

**F. Embedded JjEL and tracing.** JjEL strings with highlighting and checking; from a generated line to the model line. Then T8.

## Out for now

Debugger, terminal, multi-file editing. The minimap only if Monaco offers it at no cost. References between models stay a later question.
