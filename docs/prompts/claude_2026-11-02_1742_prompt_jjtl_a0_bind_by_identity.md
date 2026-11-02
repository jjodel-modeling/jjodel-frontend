# JjTL A0: bind resolved targets by identity, report the silent fallbacks, write A's specification

Prompt-ID: P-2026-11-02-1742
Chat: C-2026-11-02-1541
Front: hw-notation
Status: fermo 2026-11-02 · lane hw-notation · step 1 committed (d2e2c8574) · stopped on a question at the step 2 inventory (jjel-path-parity relies on the copy); steps 3-6 not done
Lane: full (JjTL executor behaviour that is committed changes; first Phase 2 slice of P-2026-11-02-1425)
Depends: P-2026-11-02-1425, P-2026-11-02-1612
Worktree: ~/jjodel-w-jjtlgeneric, branch jjtl-generic-transformation (the same tree, at the commit that adds this prompt)
Request: none (Alfonso's GO of 2026-11-02 17:38 for slice A0; his words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlgeneric` on
`jjtl-generic-transformation`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-1742 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Keep context low:
read `docs/discovery/discovery_2026-11-02_jjtl_generic_transformation.md` sections 3.1 to 3.4, 4 (Part A), 5 (Q1 to Q4),
not the whole executor. Line numbers below are from `445cdc94f`: confirm them before relying on them.

## COSA

Only slice A0. Part A's containment placement, part B, C and D are out: each is its own lane on its own GO.

Step 1, confirming test first. Add a test in `frontend/src/jjtl/executor/__tests__/` that demonstrates today's copy on
bind: a parent bound to a resolved target holds a copy taken at bind time, and pass-2 rule order decides what it holds
(`jjel/evaluator/context.ts:575-591`, called at `executor.ts:1671`). Run it and commit it green before any change. If
the code does not behave as the report says, stop with `Outcome: question`.

Step 2, inventory. List every existing test and every saved transformation that relies on the copy: the tests under
`frontend/src/jjtl/` and anywhere else that runs the executor, the `.jjtl` sources and project templates in the repo, and
`~/Downloads/micron-proto/transformation/` with what `~/Downloads/micron-proto/probes/` reads from the in-memory tree.
**If anything beyond `source-collections-in-expressions.test.ts:136` relies on it, stop with `Outcome: question` before
changing the behaviour**, naming each case and what would change. Alfonso answers this one himself: do not adopt a
recommendation on it.

Step 3, binding by identity. A resolved target is bound as the live target instance, not as a copy. Update the
confirming test and `source-collections-in-expressions.test.ts:136` to the new behaviour. Identity makes cyclic object
graphs possible where the copy could not (a -> b -> a between rule targets): check every consumer that walks the output
tree (serialisation, `fromJjelValue` itself, nested materialization, the write-back) and test a two-rule cycle. If a
consumer outside DOVE breaks on it, stop with `Outcome: question`.

Step 4, report the silent fallbacks, each naming source element and rule, through the executor's existing warning or
error channel, without changing what the executor returns:
`executor.ts:2910-2911` (a className object with no rule passes through as the source object), `executor.ts:2974-2975` (a
reference to a type without a rule resolves to null), `executor.ts:2994` (several trace entries from one rule, first one
picked). One test per case. A healthy transformation must not start printing warnings: if a common pattern (a reference to
a class deliberately left unmapped, for instance) fires one on existing tests, report it in the closing report and pick
warning over error.

Step 5, specification, no code. Rewrite `frontend/src/jjtl/SPEC.md` section 5.3, which is stale (it says NOT IMPLEMENTED),
and update section 12.3's gaps 1 and 5. It describes what is implemented after this lane and specifies A and B's frame as
ratified below, marked as planned where not implemented. The trace key is (source element, rule, environment), never one
target per source; implicit resolution inherits the caller's environment, vacuous until B. The specification must also say
explicitly how these two points relate, or name them as open if the ratified text does not settle them: (a) a containment
under A places the target found through the trace, while under B (Q3 of the report) it creates a fresh subtree and never
consults the trace; (b) a matched rule per class fires on every contained node of a library expression, creating targets
that are only ever lowered through called rules. Alfonso has not ruled on these two: state the conflict and one
recommendation, and list it under «Decisions awaiting Alfonso».

Step 6, register. Add to `docs/decisions.md`, as a new section after R-FA, these rows, ratified by Alfonso 2026-11-02:

- **R-JTG-1**: order A0, A, B, C0, D, C1 if needed; each slice its own lane, prompt and GO.
- **R-JTG-2**: A0 alone and first: a confirming test of copy on bind, then binding by identity, then the silent fallbacks reported with source element and rule.
- **R-JTG-3**: two rules on one source keep the throw naming both; with D the most specific rule wins and the throw remains for equal specificity. No declaration-order flag.
- **R-JTG-4**: a second containment claim is an error naming both containers; a containment cycle is an error; leaving roots is recorded, not warned.
- **R-JTG-5**: called and lazy rules adopt the sketch of `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md:268-322`, with the environment dynamically scoped, reified as a named parameter of called rules, values as closures; trace key (source, rule, environment). A's specification is written in those terms now, vacuous until B.

Also add the missing `## 0. Answer in brief` to the discovery report (P16), a short one, and note in it that the
ratification is in R-JTG. Whether an M1 model can depend on another M1, and who owns a textual notation for template and
library models, stay open: do not answer them here.

## DOVE

`frontend/src/jjtl/executor/` (code and tests), `frontend/src/jjtl/SPEC.md`, `docs/decisions.md`, the discovery report,
`docs/log-inbox/hw-notation.md`, the `Status:` line of this prompt. Read only: everything else, `frontend/src/jjel/` and
`frontend/src/components/project/` included. No CLAUDE.md 3.2 file is in scope; if one proves necessary, stop with `Outcome: question`
and write a Layer Impact Report first. The repo is public: name no partner company.

## COME

Atomic commits, `git add` of named paths only: confirming test; identity; fallbacks; SPEC; decisions and report. Gates:
all of `frontend/src/jjtl/` tests, the full test gate the harness requires for the executor, `tsc`, `check:docs`. The existing
tests stay unchanged except those named in Step 3 and any Alfonso approves. Do not merge. Close with the inventory of Step
2, «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
