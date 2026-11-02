# JjTL A0: register the two open rulings, exercise the write-back in the running app

Prompt-ID: P-2026-11-02-1838
Chat: C-2026-11-02-1541
Front: hw-notation
Status: eseguito 2026-11-02 · lane hw-notation · docs-only, the closure commit is the one carrying this line · probe in ~/.jjodel-lanes/P-2026-11-02-1838/probe/
Lane: fast (docs and one probe outside the repo; no product code)
Depends: P-2026-11-02-1742
Worktree: ~/jjodel-w-jjtlgeneric, branch jjtl-generic-transformation (the same tree, at the commit that adds this prompt)
Request: none (Alfonso's approval of 2026-11-02 18:35, words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlgeneric` on
`jjtl-generic-transformation`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-1838 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Keep context low.

## COSA

1. Add to the R-JTG section of `docs/decisions.md`, ratified by Alfonso 2026-11-02:
   - **R-JTG-6**: a containment resolves (source, rule, caller's environment) and creates the entry on demand when absent: under A a lookup, under B a new environment gives a fresh subtree. A call of a rule not declared `unique` always creates a fresh subtree, even under an environment seen before, so one expression may be placed twice with the same bindings. The double-claim error of R-JTG-4 applies to implicit resolutions and to `unique` rules.
   - **R-JTG-7**: rules meant for lowering are declared `lazy`: they never match in pass 1 and create a target only when a resolution or a call reaches the node. Matched rules stay for the elements the transformation maps as such. Containment under A alone therefore does not serve library expressions; that value arrives with B.
2. Replace the Open block of `frontend/src/jjtl/SPEC.md` section 5.3.2 with these two rulings, planned where not implemented. Keep the count of `transformation` code blocks in SPEC.md at 6.
3. Probe in the running app, never exercised for A0: with `lane-run probe` and a free port, in a project with a source and a target metamodel, run a JjTL transformation with a reference between two rules (the parent is created by one rule, the referenced target by another), in both rule orders. Then read the target model: the reference points at the real target element, in both orders, and the fallback warnings do not fire. Also run one nested creation (P-2026-10-30-1330) and one two-rule cycle (a -> b -> a): the app neither throws nor hangs, and the pointers are as expected. Probe files stay in `~/.jjodel-lanes/P-2026-11-02-1838/probe/`. Report what was measured from the DOM or the model, with figures.

If the probe shows a regression, do not fix it: report it with `Outcome: question`. No product code changes in this lane.

## DOVE

`docs/decisions.md`, `frontend/src/jjtl/SPEC.md`, `docs/log-inbox/hw-notation.md`, the `Status:` line of this prompt. The repo is public: name no partner company.

## COME

`check:docs` and the parity test. One docs-only commit, `git add` of those paths only. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
