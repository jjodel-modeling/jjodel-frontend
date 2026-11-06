# Measure: how far the textual parser goes for template and library models

Prompt-ID: P-2026-11-02-1942
Chat: C-2026-11-02-1541
Front: hw-notation
Status: eseguito 2026-11-02 · lane hw-notation · docs-only, the closure commit is the one carrying this line · report docs/discovery/discovery_2026-11-02_textual_notation_for_templates.md · probes in ~/.jjodel-lanes/P-2026-11-02-1942/
Lane: discovery (read-only; one short report, one docs-only commit)
Depends: P-2026-11-02-1425
Worktree: ~/jjodel-w-jjtlnotation, branch jjtl-notation-measure (from the trunk commit that adds this prompt)
Request: none (Alfonso's ok of 2026-11-02 19:40 to the recommendation on Q6 of P-2026-11-02-1425; words in request.md)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlnotation` on
`jjtl-notation-measure`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-1942 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. No product code. Keep context low: aim for a short report.

## COSA

Q7 of `docs/discovery/discovery_2026-11-02_jjtl_generic_transformation.md` says template and library models cannot be
authored node by node, so a textual notation is a precondition outside JjTL. The default textual notation (R-TXT, `frontend/src/codegen/textual/`, slices T1 to T4) is now on the trunk. Measure what it already covers for those models, by running it where you can.

Take the excerpts of `~/Downloads/micron-proto/docs/brief-kernel-example.md`: an instruction with an expression semantics (`result rs1 + rs2`, with nesting and a conditional), a template fragment with a `for each` and a substitution (`op.result [rs1 := a, ...]`), and a pattern. Write a small metamodel for them and round-trip a fragment: text to model, model to text. Answer, with what was measured:

1. Does a deep containment tree of expression objects parse and print? Up to what size, at what cost in time, for about 2,500 objects (print and parse, no UI if you can)?
2. Is the default form usable to write by hand for expressions, or does `Add { left Ref { name a } right Const { value 1 } }` make it unusable? Count characters against the infix form of the example.
3. Does the notation offer, or plan, a custom concrete syntax for a class (infix expressions)? Cite the R-TXT rows. If not, what is the least that would be needed: a parser hook per class, a second grammar, or an expression sub-language?
4. Can a model in text refer to elements of another model (library references from a Brief)?
5. One recommendation: use what exists, extend it, or keep the prototype's own notation for now. Name the owner you recommend for the work; the chat's starting hypothesis, to be tested and not assumed, is the front `codegen`.

Report: `docs/discovery/discovery_2026-11-02_textual_notation_for_templates.md`, in English, beginning with `## 0. Answer in brief`.

## DOVE

Written: the report, `docs/log-inbox/hw-notation.md`, the `Status:` line of this prompt. Probes stay in `~/.jjodel-lanes/P-2026-11-02-1942/`. Outside files stay outside the repo; the repo is public: name no partner company.

## COME

`check:docs`. One docs-only commit, `git add` of named paths only. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
