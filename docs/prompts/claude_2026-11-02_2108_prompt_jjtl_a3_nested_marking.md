# JjTL A3: placed targets also marked __nested

Prompt-ID: P-2026-11-02-2108
Chat: C-2026-11-02-1541
Front: hw-notation
Status: da eseguire
Lane: full (JjTL executor output and write-back; third lane of slice A)
Depends: P-2026-11-02-2024
Worktree: ~/jjodel-w-jjtlcontain, branch jjtl-containment (the same tree, at the commit that adds this prompt)
Request: none (Alfonso's answer of 2026-11-02 20:38; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlcontain` on
`jjtl-containment`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2108 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Keep context low.

## COSA

Alfonso's ruling: a placed target also carries the `__nested` format. The executor marks a target placed in a containment `__nested`, and the write-back replaces `v.__nested || isPlacedIn(...)` with one test. `targetModel.containment` stays, for ownership and errors.

First list every reader of `__nested` (executor, `ProjectEditor.tsx`, `nestedMaterialization.ts`, tests). A rule target marked `__nested` is still a rule target: its trace entry, its bindings and the pointers to it must keep working, and A0's identity must hold. If a reader cannot tell the two cases apart, or the single test cannot be kept, stop with `Outcome: question` and say why, keeping what is committed.

Update SPEC 5.3 and 9.2 and the parity test's serializer if it depends on the marker. Add tests for the marker on a placed target, and for a marked target that is pointed at.

Rerun `~/.jjodel-lanes/P-2026-11-02-2024/probe/` on a free port: same figures expected for every scenario. Report them.

## DOVE

`frontend/src/jjtl/executor/`, `frontend/src/jjtl/__tests__/jjel-path-parity.test.ts`, `frontend/src/components/project/ProjectEditor.tsx` (the JjTL write-back only), `frontend/src/components/project/nestedMaterialization.ts`, their tests, `frontend/src/jjtl/SPEC.md`, `docs/log-inbox/hw-notation.md`, the `Status:` line. No CLAUDE.md 3.2 file.

## COME

Named paths only. Gates: `frontend/src/jjtl/` and `components/project` tests, full suite, `tsc`, build, `check:docs`. Do not merge. Close with the figures, «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line. The repo is public: name no partner company.
