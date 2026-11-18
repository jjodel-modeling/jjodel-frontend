# R-FA-12: close the lane after its context ceiling

Prompt-ID: P-2026-11-05-2225
Chat: C-2026-11-03-1202
Front: hw-notation
Status: eseguito 2026-11-05 · lane full · 32e777031
Lane: full (continues P-2026-11-05-1530 after its context ceiling; unattended)
Depends: P-2026-11-05-1530
Worktree: ~/jjodel-w-jjtlmeth, branch jjtl-method-failure-error (the same tree, with its uncommitted work)
Request: none (continuation of P-2026-11-05-1530)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlmeth` on `jjtl-method-failure-error`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-05-2225 · session <id>]`. No subagents, no background tasks. One probe run per tool call. Print only summary lines. The repo is public: name no partner company, cite no path outside this tree in anything committed.

## COSA

Read only `~/.jjodel-lanes/P-2026-11-05-1530/handoff.md` and `git status`. Do not redo the design. Do, in this order:

1. Commit the fix, its tests and the changed expectation of `jjtlSourceValues.test.ts` as soon as typecheck and the JjTL and JjEL suites are green; docs in a separate commit (`SPEC.md`, `docs/decisions.md`).
2. Build and the full vitest suite on the final code. Report only what differs from the known import-red files.
3. Write `docs/discovery/discovery_2026-11-05_jjtl_method_failure.md`, in English, beginning with `## 0. Answer in brief`, from the handoff: figures marked measured or read, the mark instead of a subclass and why, the changed test, the node regression table, the negative case. State that whether the app writes back a failed run was not measured, and measure it only if a probe from `~/.jjodel-lanes/P-2026-11-05-1400/` runs it in one call with load under 20.
4. The log entry in `docs/log-inbox/hw-notation.md` closing the ticket, `check:docs`, the `Status:` lines of this prompt and of P-2026-11-05-1530, all as docs-only commits with named paths.

## DOVE

Only the files named in the handoff's Scope, this prompt's `Status:` line and P-2026-11-05-1530's. No new product change. Do not merge.

## COME

Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
