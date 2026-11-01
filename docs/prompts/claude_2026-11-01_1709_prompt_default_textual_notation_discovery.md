# Codegen: a default textual notation for every model, derived from its metamodel (discovery)

Prompt-ID: P-2026-11-01-1709
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: discovery (read-only; probes in the running app; one report, one docs-only commit)
Depends: none (trunk tip 06bbed9a0)
Worktree: ~/jjodel-w-defaulttext, branch default-textual-notation (from 06bbed9a0)
Request: the hardware generator prototype (`~/Downloads/micron-proto/prompts/P-2026-11-01-1709-jjgen-default-textual-notation.md`, 2026-11-01 17:09), forwarded by Alfonso to the project chat; motivated by P-2026-10-31-1320 and P-2026-10-31-1735

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-defaulttext` on
`default-textual-notation`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-1709 · session <id>]`.
No subagents, no background tasks. No code change: this prompt asks for a report and a proposal, nothing else.

## The case

A DSL defined in Jjodel is edited as diagrams. Its models also need to be read as text: to diff two versions in git,
to review a model without opening the editor, to hand it to an LLM. The hardware prototype has two DSLs (CoreSpec, a
RISC-V core; ArbiterSpec, a bus arbiter) and, for each, a read-only textual view printed by a JjGen template written
by hand for that metamodel:

```
core rv_pf32 {
  xlen 32
  registers 32
  microarch pipe3_forward
  instructions {
    reg_reg add sub and or xor slt sltu sll srl sra
    control jal jalr beq bne blt bge bltu bgeu
  }
  require isa_conformance
  require no_hazard
}
```

Most of such a template is not specific to the DSL. It follows a rule any metamodel admits, in the spirit of OMG's
HUTN (2004) and of the default grammar Xtext derives from an Ecore model:

| Rule | Model | Text |
| --- | --- | --- |
| D1 | an object of class C | `c <name> { ... }`, class name in lower case; `<name>` only if C has a `name` attribute |
| D2 | a single-valued attribute a, set | `a <value>` on its own line; not printed when unset |
| D3 | a value | integers in decimal; booleans; an enumeration literal in lower case; a string as is if it is an identifier, quoted otherwise |
| D4 | a containment reference r | its objects, each by D1, in model order, inside `r { ... }` |
| D5 | a non-containment reference r | `r <name of the target>` |
| D6 | order | features in the metamodel's declaration order |
| D7 | keywords | the class, attribute and reference names used by D1 to D5 are reserved |

What is specific to one DSL is a small set of overrides on top of the default: a keyword renamed (`registers` for
`nregs`), a containment printed one line per object (`requester cpu priority 0`), a list grouped by a classification
computed from the data, a shorthand that omits a value equal to a default.

## 1. Discovery (read-only)

Answer from the code and by running JjEL inside the app (a generator run in the dock tab, not a node probe), with the
commands and their output. Start from what is already established and do not re-derive it:
`docs/discovery/discovery_2026-10-31_codegen_metaclass_dispatch.md` (H2: the argument's `instanceOf` is the shared
class shell, with `superTypes`; `eval.ts:586-588`) and `docs/discovery/2026-06-11_jjel_m1_navigation_discovery.md`
(attribute and reference slots did not resolve on extent handles).

1. On the objects a generator receives, does the class shell behind `o.instanceOf` carry `attributes` and
   `references` with name, type, containment, lower and upper bound, and for a reference its target class? Are
   inherited features reachable through `superTypes`, and in what order (D6 with inheritance)?
2. Does `o[featureName]`, with the name as a string, read the value of that feature (attribute and reference, single
   and multi-valued) on such an object, as `evaluateIndexAccess` suggests? Is the 2026-06-11 finding still true, and
   on which surfaces exactly?
3. Can an enumeration literal, an integer, a boolean and a string be told apart at run time, and can an attribute's
   type be read from its metaclass (to choose the spelling of D3)?
4. Does Jjodel distinguish an unset attribute from one holding its type's default (Ecore's `eIsSet`)? If not, D2's
   «not printed when unset» cannot be implemented as written: say what can be.
5. A template call returns a traced Text; `f(x) == ""` and `xs.filter(s => s != "")` over results of template calls
   do not do what they read as (measured in the prototype). Is that by design (see
   `discovery_2026-10-31_codegen_origins_through_concat.md`)? Is there a documented way to test a Text for emptiness,
   or should a template always test the model instead?
6. Names: are object names unique in a model, per class, or not at all (the homonym work of 2026-09-19 says not
   always)? What does D5 print when two targets share a name, or the target has no `name`?

## 2. Proposal (to discuss, not to implement)

If 1.1 and 1.2 hold, the default rule can be one generator written once, by reflection, valid for every metamodel.
Assess, for each point, what the platform would need, what exists, and which you would do first:

- a built-in `defaultText(o)` implementing D1 to D7 over `o.instanceOf`;
- per DSL, optional overrides per metaclass or per feature that the default calls instead of its own rule. Say
  whether the run-time metaclass dispatch of P-2026-10-31-1235 already is this mechanism (the default as the
  fallback rule of the dispatch) rather than a new name-based lookup;
- the grammar the default and its overrides produce, printed as EBNF from the same information, so that a parser
  and an editor can be derived later (not asked now).

Review the rules themselves, since a later parser depends on them, and say for each whether it is sound or what it
needs: D2 says nothing of multi-valued attributes; D3 prints a string unquoted when it is an identifier, which clashes
with D7 keywords and with enumeration literals; D3 lowercases literals and D1 lowercases class names, lossy when two
differ only by case; D7 reserves every feature name, so an object named like a feature needs quoting; D5 depends on
the answer to 1.6.

## Lane discipline

Report at `docs/discovery/discovery_2026-11-01_default_textual_notation.md`: goal, files read with paths and lines,
the JjEL commands run with their output, findings per question, the proposal, risks, questions for Alfonso. Probes on
a port in the 30xx range outside 3000, 3001, 3003; screenshots only if a finding depends on them. `git add` the report,
the log entry in `docs/log-inbox/` and the `Status:` flip of this prompt, in one docs-only commit
`docs(codegen): discovery of a default textual notation (P-2026-11-01-1709)`. No push, no merge. End with
«Decisions taken (unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
