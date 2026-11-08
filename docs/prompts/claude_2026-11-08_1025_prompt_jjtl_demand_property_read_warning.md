# JjTL: a property read on a demand warns instead of reading null in silence

Prompt-ID: P-2026-11-08-1025
Chat: C-2026-11-03-1202
Front: hw-notation
Status: da eseguire
Lane: fast (one executor change and its tests; unattended)
Depends: P-2026-11-08-0835
Worktree: ~/jjodel-w-demandread, branch jjtl-demand-read
Request: none (Alfonso's words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-demandread` on `jjtl-demand-read`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1025 · session <id>]`. No subagents, no background tasks. Print only summary lines of suites. Commit as soon as the gates are green. The repo is public: name no partner company and no path outside this tree in anything committed.

## COSA

R-JTG-30 left a property read on a demand (`envLookup(n).name`) reading `null` with no warning and `success true` (measured by P-2026-11-08-0835). Decided by the chat under Alfonso's «decidi tu» of 2026-11-08 10:22: such a read gives a warning naming the rule, the source element and the property, and still reads `null`, the treatment R-FA-12 gives a read on a missing feature. Not an error: a read is not a use as a value.

1. Failing tests first in `demand-as-value.test.ts`, both parser paths: a property read on `envLookup(n)` and on a called rule's result warns once per expression and site; a null-safe read `?.` warns the same; the run stays `success true`.
2. The change, in the evaluator subclass of S2 in `executor.ts`.
3. One row after R-JTG-30: decided by the chat under Alfonso's «decidi tu» 2026-11-08 10:22, registered by P-2026-11-08-1025, evidence: measured, verified: none, reversible: trunk; checked with `scripts/gates/docs-digest.ts`.

Gates: typecheck, the FULL vitest suite, `check:docs`; the node baseline of the two kernel Briefs in `~/.jjodel-lanes/pending/kgaps-inputs/` keeps its SHA prefixes (arbiter `5c0d9731c4bb9632`, core `2a34b97ab348ce64`) and gives 0 new warnings.

## DOVE

Written: `frontend/src/jjtl/executor/executor.ts`, `demand-as-value.test.ts`, `frontend/src/jjtl/SPEC.md` §10, `docs/decisions.md`, `docs/log-inbox/hw-notation.md`, the `Status:` line.

## COME

Docs and code in separate commits, named paths. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
