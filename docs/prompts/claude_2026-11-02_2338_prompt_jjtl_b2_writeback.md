# JjTL B2: the app's write-back for called, lazy and fresh targets

Prompt-ID: P-2026-11-02-2338
Chat: C-2026-11-02-1541
Front: hw-notation
Status: da eseguire
Lane: full (JjTL write-back in the app; second lane of slice B)
Depends: P-2026-11-02-2321
Worktree: ~/jjodel-w-jjtlcalled, branch jjtl-called-rules (the same tree, at the commit that adds this prompt)
Request: none (Alfonso's GO of 2026-11-02 22:21 covers slice B)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlcalled` on
`jjtl-called-rules`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2338 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Read only SPEC 5.3.3 (its list for B2), `docs/discovery/lir_2026-11-02_jjtl_containment_writeback.md`, the JjTL write-back steps of `ProjectEditor.tsx` and `nestedMaterialization.ts`. Print little.

## COSA

Layer Impact Report first, `docs/discovery/lir_2026-11-02_jjtl_b_writeback.md`, in your first code commit. Then, from the list:

1. Lift the assumption of one target per source id at `ProjectEditor.tsx:1809` (confirm the line): several targets of one source element must all reach the model, each pointer to the target it holds by identity, not by source id. Matched targets keep working as today.
2. Remove the optional `isPlacedIn` of `nestedMaterialization.ts` and its uses in tests (R-JTG-9).
3. The old `trace` Map: list its consumers. If a consumer loses called, lazy or fresh targets, make the trace view show them; if none does, leave it and say so.
4. A lazy-rule selection error under a delegating matched rule becomes a per-binding error with the application stack, not a failed run, if that is local to the executor; otherwise report it and leave it.

Explicit `resolve()` of a lazy node: leave it as it is, documented in SPEC as finding matched targets only. `Decision awaiting Alfonso`, do not change it.

## Measure in the running app

With `lane-run probe` on a free port, through the real Execute dialog, one fresh tab per scenario, model read back: `Bind(Add(Var x, Const 1), [x := Var a])` gives `Add(Ref a, Const 1)`; the template per `Op`, one target per `Op` with operands bound; one expression placed twice with the same bindings, two separate subtrees; a pointer to a fresh target; `unique lazy` created once; unreached lazy nodes create nothing; a second implicit claim fails visibly with nothing written; a recursion hitting the depth limit fails visibly, without a hang; save and reopen, same tree. Rerun the probes of P-2026-11-02-2108 and P-2026-11-02-1838: same figures. Time a tree of about 2,500 lowered objects, one figure (the nested path has a 3 s cap per level). Probe files in `~/.jjodel-lanes/P-2026-11-02-2338/`.

## DOVE

`frontend/src/components/project/ProjectEditor.tsx` (JjTL write-back only), `frontend/src/components/project/nestedMaterialization.ts`, their tests, `frontend/src/jjtl/` (executor and trace, SPEC.md), the LIR, `docs/log-inbox/hw-notation.md`, the `Status:` line. No CLAUDE.md 3.2 file: if one proves necessary, stop with `Outcome: question`.

## COME

Named paths only. Gates: `frontend/src/jjtl/` and `components/project` tests, full suite, `tsc`, build, `check:docs`. Do not merge. Close with the figures, «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line. The repo is public: name no partner company.
