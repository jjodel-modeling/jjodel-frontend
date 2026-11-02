# JjTL abstraction for one generic transformation (Phase 1: discovery, design proposal, LIR)

Prompt-ID: P-2026-11-02-1425
Chat: C-2026-11-02-1541
Front: hw-notation
Status: da eseguire
Lane: full (discovery only in this prompt; one report, one docs-only commit)
Depends: none
Worktree: ~/jjodel-w-jjtlgeneric, branch jjtl-generic-transformation (from the trunk commit that adds this prompt)
Request: none (forwarded by Alfonso from the hardware prototype on 2026-11-02; his words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlgeneric` on
`jjtl-generic-transformation`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-1425 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. No code change.

## COSA

Execute only Phase 1 of the source prompt below: discovery, design proposal, Layer Impact Report. Parts A and B are the
decisive ones and get the depth; C and D may follow them; E is a question only. Phase 2 is out of this prompt: each
approved slice will be its own lane under its own prompt.

Save the report as `docs/discovery/discovery_2026-11-02_jjtl_generic_transformation.md`, in English. It must contain the
recommended order of the parts with the reason, and for each part what exists already (file and line, verified in the
code at this branch's tip) and what would be needed.

Verify the premises, do not inherit them. The source prompt was written at e94541c13 and the trunk has moved since. SPEC.md
section 12.3 and section 3.2 may be stale against the executor: state for each cited gap (1, 5, 7, 8, 9, 10 and section
3.2) whether the code confirms it. The nested materialization and multi-variable forall lanes (P-2026-10-30-1330,
P-2026-11-02-1331) are on the trunk: say what they change for A and B.

Questions the report must answer explicitly:

1. Trace identity under an environment. Part A assumes one target per source element; part B lowers the same source
   element several times with different bindings (one `op.result` in several template positions, in the design and in a
   pattern). What is the key of the trace (source element, rule, environment)? What does A resolve to when several
   targets exist for a source, and does an implicit `-> left : left` inherit the caller's environment? Can A ship before
   B without a semantic that B then has to break? This decides the order.
2. Environment reaching the leaves: an explicit parameter threaded through bindings, or a dynamically scoped context of
   the rule application? Give one recommendation, with its effect on trace, `unique` lazy rules and error reporting.
3. Containment moves: what happens to a resolved element placed in a new container when it was already a root or is
   claimed by two containers. Reported, never silent.
4. Rule scheduling: the current execution order, and whether resolution needs a second pass or lazy creation.
5. Fallback for C: whether one model holding copies of the others is cheaper as a first step, with the cost of what it
   duplicates.
6. E: read `docs/discovery/discovery_2026-10-20_ontological_instantiation.md` and the R-OI rows of `docs/decisions.md`,
   and check the slices actually merged: may a slot hold a contained fragment rather than a literal, and what would it
   need? Answer the question only; propose no change to those lanes.
7. Size estimate: read how much of `transformation/` and of the builder in `~/Downloads/micron-proto/` A and B would
   really remove, and whether the target (hundreds of lines, same SyncRTL models) is credible. Say so if it is not.

## DOVE

Read only. The only files written: the report above, `docs/claude-code-log.md` for the prompt's log entry (P4), per the
protocol. Read as context: `frontend/src/jjtl/` (SPEC.md, parser, executor, tests), and outside the repo
`~/Downloads/micron-proto/docs/brief-kernel.md`, `~/Downloads/micron-proto/docs/brief-kernel-example.md`,
`~/Downloads/micron-proto/transformation/`, `~/Downloads/micron-proto/tools/`. Those outside files stay outside the
repo: do not copy them in. The repo is public: name no partner company, and quote from them only what the argument needs.

## COME

Commit the report and the log entry as one docs-only commit, `git add` of those two paths only, then end at the hard
stop: no Phase 2, no scaffold, no test file. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and
the `Outcome:` line.

## Source prompt (verbatim, from the hardware prototype)


Branch `alfonso-frontend-jjtl` (tip e94541c13 at the time of writing). A request for implementation, in two phases:
Phase 1 is a discovery with a design proposal and a Layer Impact Report, no code; Phase 2 implements the slices
Alfonso approves, one lane each. Motivated by the hardware generator prototype (the one behind P-2026-10-31-1320,
P-2026-10-31-1735 and P-2026-11-01-1709). Check that the id is free before committing.

## The case

The prototype generates verified hardware from a high-level model (a "Brief") through a JjTL transformation to a
low-level synchronous RTL metamodel (SyncRTL), then JjGen templates print nuXmv SMV and SystemVerilog. Today each
device family has its own Brief metamodel and its own transformation. The one for a small RISC-V core is 19,454 lines
of JjTL, and nobody writes it: a 554-line Python script does, because JjTL cannot share a fragment between rules or
build one fragment from another. One line of that script, the signed comparison

```python
def slt(x, y): return N(B("Le", B("BitXor", y, MSB()), B("BitXor", x, MSB())))
```

becomes about 50 lines of nested creations in the JjTL, repeated for every place it is used, in every rule. The
ratio, 35 lines of JjTL per line of the script, measures what is missing.

The decision now taken is to have **one Brief metamodel and one transformation that knows no domain**. What is domain
specific moves into models the transformation reads:

- a **library** model per standard, whose elements carry their semantics as expression trees (for an instruction:
  the value it writes, `rs1 + rs2`; its branch condition; its memory access);
- **templates**: a realization written as a parametric low-level model, with an iteration over the operations a
  Brief selects (`for each op in operations: wire is_<op> = ...`) and places where an operation's expression is
  inserted with its operands bound to the template's signals (`op.result [rs1 := a, rs2 := b]`);
- **patterns**: requirements written the same way, over a fixed set of observables;
- the **Brief** itself, which selects a library, a template, operations and patterns.

The transformation then does one thing, everywhere: copy a model fragment into the target, replacing references
(a parameter by its value, an operand by the expression it is bound to, a name built from the current operation).
The expression classes of the low-level metamodel are reused in the high-level one (the high-level metamodel imports
the low-level expression package), so most of the copy is class to same class. Design note in the prototype:
`docs/brief-kernel.md`; worked example in `docs/brief-kernel-example.md` (attached to the handover, not in this repo).

What JjTL needs for it is already on its own gap list (`frontend/src/jjtl/SPEC.md` section 12.3 and section 3.2).

## Required features

### A. Implicit trace resolution for references and containments (gaps 1 and 5)

With one rule per source metaclass (`Add -> Add`, `Le -> Le`, `Const -> Const`, ...), each rule fires on every source
instance, contained ones included (section 4.2: the source array is `allSubObjects`). What is missing is the link: in
the rule for `Add`, the binding of `left` must place in the target's `left` the target element created from the
source's `left`, through the trace, as section 5.3 describes. Required:

- for a **containment** feature, the resolved target element is placed inside the new container (and is no longer a
  root of the target model);
- for a **non-containment** reference, the feature points at the resolved element;
- a collection feature resolves element by element, in order;
- ambiguity (two rules matching the same source element) is resolved as section 5.3 proposes, or reported, never
  silent;
- source and target metamodels share classes here (the high-level metamodel imports the low-level expression
  package), so a rule `SyncRTL.Add -> SyncRTL.Add` from the source model to the target model must not be treated as
  endogenous: the trace is per model.

Without this, an expression tree whose shape the transformation does not know in advance (one written by a user in a
library) cannot be lowered at all.

### B. Called rules with parameters, and lazy rules (gaps 8 and 9)

Template expansion instantiates the same fragment once per selected operation, with the operation bound, and inside
it lowers that operation's expression with a substitution (`rs1` replaced by the template's `a`). Required:

- a rule that is called explicitly, with arguments (`rule LowerExpr(e, env) -> Expr`), from a binding or a `forall`
  body, returning the created element so that it can be placed in a feature;
- the arguments visible in the rule's body and in its guard;
- a way for the rules applied implicitly by A to receive the same environment, so that a substitution reaches the
  leaves of a tree (an `OperandRef` deep in an expression is replaced by the bound expression, itself lowered);
- a lazy rule: created only when called, once per distinct arguments if declared `unique`.

### C. Multi-model sources (gap 7)

`from Brief, Library, Templates, Patterns to SyncRTL`, with qualified types, and navigation of references that cross
models (a Brief's operations reference instances in a library model). A transformation that receives one model
containing copies of the others remains the fallback: say whether that is cheaper as a first step.

### D. Inheritance-based source matching and rule inheritance (section 3.2, gap 10)

A rule on an abstract source class applies to its subclasses; the most specific rule wins; `abstract` and `extends`
between rules, so that the common bindings of a family of classes are written once.

### E. Discovery only: slots that hold model fragments

The ontological instantiation lanes (discovery of 2026-10-20, S2 to S5) give a slot a literal value. A library needs
a slot whose value is a contained expression tree (an instruction's semantics). Is that compatible with the design
of those lanes? What would it need?

## Acceptance (Phase 2)

Tests in `frontend/src/jjtl/executor/__tests__/` on a toy pair of metamodels, which the lane writes:

- source: `Expr` (abstract) with `Add(left, right)`, `Const(value)`, `Var(name)`, `Bind(expr, bindings)`,
  `Binding(var, expr)`; plus `Op(name, semantics: Expr)` and `Template(each: Op[*] references, body)`;
- target: `Add`, `Const`, `Ref(name)`.

Cases: (1) a tree of depth 5 copied by one rule per class, with containments resolved (A); (2) `Bind(Add(Var x,
Const 1), [x := Var a])` lowered to `Add(Ref a, Const 1)` through a called rule carrying the environment (B); (3) a
template expanding one target element per referenced `Op`, each with its semantics lowered and its operands bound
(A and B); (4) the same with `Op`s in a second source model (C); (5) a rule on `Expr` applying to all its subclasses,
with a more specific rule overriding it (D). Existing tests unchanged.

Measurable on the prototype once A and B land: the RISC-V transformation rewritten by hand in JjTL, without the
script, at a size of the order of the script (hundreds of lines, not thousands), producing the same low-level models.

## Closing

Phase 1: discovery report in `docs/discovery/`, with the design proposal for A to E, what exists, what each needs,
the order you recommend and a Layer Impact Report for the critical zones touched; committed with the prompt's log
entry (P4). No code change in Phase 1. Phase 2 after Alfonso's GO, one lane per approved slice. Outcome line as usual.
