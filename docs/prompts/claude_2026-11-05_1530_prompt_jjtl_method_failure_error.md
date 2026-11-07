# JjTL: a JjEL method that fails stops the mapping (R-FA-11 extended)

Prompt-ID: P-2026-11-05-1530
Chat: C-2026-11-03-1202
Front: hw-notation
Status: eseguito 2026-11-05 · lane full · 32e777031
Lane: full (unattended; measure first, then the smallest fix in this same lane)
Depends: P-2026-11-05-1446
Worktree: ~/jjodel-w-jjtlmeth, branch jjtl-method-failure-error
Request: none (Alfonso's words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlmeth` on `jjtl-method-failure-error`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-05-1530 · session <id>]`. No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. The repo is public: name no partner company, cite no path outside this tree in anything committed.

## COSA

Read `docs/discovery/discovery_2026-11-05_xmi_typed_integers.md` section 0 item 4, and R-FA-11 in `docs/decisions.md`. Alfonso ratified on 2026-11-05 that R-FA-11 extends to JjEL methods: a method that does not exist for the value's type (`"4".log2()`) and a library method that throws stop the mapping with an error on every path, never a warning with `null`. A transformation that goes on writes a target model that is wrong and looks done.

Register in `docs/decisions.md`, as ratified by Alfonso 2026-11-05 15:29: this extension (next free row of its series, or an amendment of R-FA-11, as the register's practice has it); R-XMI-1 ratified as it stands, a value that does not parse is kept as text and reported, the import is not refused; no migration of saved projects, re-importing the XMI heals them.

Out of the extension, unchanged: a name that resolves to nothing and a property read on null or on a missing feature. If the code cannot tell these apart from a failed method, stop with `Outcome: question` and a recommendation.

1. Failing tests first, on the executor: a missing method on a string, a library method that throws, each in a binding, a guard, a `forall` collection and a helper body, on the source-text path and on the legacy one. A test that asserts the same value on an unresolved name, which must stay a warning.
2. The fix, in the smallest place. List every existing test whose expectation changes and why; an existing transformation fixture that now fails is a finding, not something to silence.
3. Node regression on the inputs, read only, in `~/.jjodel-lanes/pending/corexf-inputs/`: `CoreSpec2SyncRTL.jjtl` on `rv_mc4`, `rv_pf4`, `rv_mc32`, `core_mc4`; the generated control on `rv_mc4`; the arbiter on `arbiter3`. All must stay byte-equal to the references after the normalisation of P-2026-11-05-1400. Then the negative case: `rv_mc4` with `xlen` as a string must now stop with an error naming the rule and the method.
4. The JjTL section of the docs that describes the error, in `frontend/src/jjtl/SPEC.md`.

Report: `docs/discovery/discovery_2026-11-05_jjtl_method_failure.md`, in English, beginning with `## 0. Answer in brief`, each figure marked measured or read. Close the ticket filed by P-2026-11-05-1446 for this defect in the log entry.

## DOVE

Written: the JjTL executor and, if it must, the JjEL evaluator's error type only, their tests, `SPEC.md`, the report, `docs/decisions.md`, `docs/log-inbox/hw-notation.md`, the `Status:` line. Stop with `Outcome: question` if the fix changes what JjEL does outside JjTL (console, Jodie, validation, templates), needs a critical-zone file, or breaks an exported interface outside this lane.

## COME

The usual gates. Atomic commits, named paths. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
