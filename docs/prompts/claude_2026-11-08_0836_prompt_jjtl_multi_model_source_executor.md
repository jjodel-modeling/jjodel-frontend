# JjTL: several source models of one metamodel, executor side (S3)

Prompt-ID: P-2026-11-08-0836
Chat: C-2026-11-03-1202
Front: hw-notation
Status: da eseguire
Lane: full (unattended; tests first, then the smallest change)
Depends: P-2026-11-08-0835
Worktree: ~/jjodel-w-multisrc, branch jjtl-multi-source
Request: none (Alfonso's words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-multisrc` on `jjtl-multi-source`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-0836 · session <id>]`. No subagents, no background tasks. One probe run per tool call. Print only summary lines. Commit as soon as the gates are green. The repo is public: name no partner company and no path outside this tree in anything committed.

## COSA

Read `docs/discovery/discovery_2026-11-08_jjtl_kernel_gaps.md` (item 7 and slice S3) and R-JTG-26 (several models of one metamodel first, objects united in pass 1, typed `from A, B` later). Executor side only: the app's dialog (R-JTG-27) is slice S4, not here.

1. The executor's input accepts a list of source models of one metamodel besides the single model it takes today; a single model keeps working unchanged. Say how a caller passes the list (the smallest addition to the signature or the source shape, optional, no breaking change).
2. Failing tests first: a rule matches objects of the second model; a reference from an object of one model to an object of another resolves through the trace (ids are unique across the models: state what happens when two models share an id, and make it an error); `resolve()` and implicit resolution see the union; roots of the target model are as with one model.
3. A node probe: split one kernel Brief of `~/.jjodel-lanes/pending/kgaps-inputs/` (copy it first) into the Brief proper and its library, template and patterns as separate models, run `Brief2SyncRTL.jjtl` on the list, and compare with the single-model output: the SHA-256 prefix must be the same (core `2a34b97ab348ce64`). If the split needs more than moving contained objects, say what and stop at the measure.
4. SPEC §4.2 and §9 for the input; one row in `docs/decisions.md` only if a choice was taken here that R-JTG-26 does not cover (provisional, unattended).

Gates: typecheck, the FULL vitest suite, build, `check:docs`.

## DOVE

Written: `frontend/src/jjtl/executor/` (executor and tests), `frontend/src/jjtl/SPEC.md`, `docs/decisions.md`, `docs/log-inbox/hw-notation.md`, the `Status:` line. Stop with `Outcome: question` if a caller outside `jjtl/` must change, if an exported type breaks outside this lane, or for a critical-zone file.

## COME

Atomic commits, named paths, docs and code never in one commit. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
