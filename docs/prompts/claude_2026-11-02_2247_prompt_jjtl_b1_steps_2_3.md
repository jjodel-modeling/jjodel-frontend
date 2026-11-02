# JjTL B1 continued: called rules tested, then the environment

Prompt-ID: P-2026-11-02-2247
Chat: C-2026-11-02-1541
Front: hw-notation
Status: da eseguire
Lane: full (continues P-2026-11-02-2224 after its context ceiling)
Depends: P-2026-11-02-2224
Worktree: ~/jjodel-w-jjtlcalled, branch jjtl-called-rules (the same tree, at the commit that adds this prompt)
Request: none (continuation; Alfonso's GO of 2026-11-02 22:21)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlcalled` on
`jjtl-called-rules`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2247 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Read only `~/.jjodel-lanes/P-2026-11-02-2224/handoff.md` and the sections it names; the specification is the COSA of `docs/prompts/claude_2026-11-02_2224_prompt_jjtl_b1_called_lazy_rules.md`. Print little.

## COSA

The chat committed step 2 as a wip commit: it is untested. Only two steps here, with a stop after each commit if context runs short:

Step 2: write its tests, run them and `tsc`, fix what fails, commit. The `= expression` form and the `Main` entry class stand as provisional, unattended (RC-25); depth limit 256.

Step 3: the environment as specified, with its tests: the acceptance case (2), capture, and implicit resolution inheriting the environment to the leaves. Commit.

Steps 4 and 5 are the next lane: list what remains in your closing report.

## DOVE

`frontend/src/jjtl/` (executor, tests, SPEC.md), `docs/log-inbox/hw-notation.md`, the `Status:` lines of this prompt and of P-2026-11-02-2224. Not `frontend/src/jjel/`; no CLAUDE.md 3.2 file. Stop with `Outcome: question` if either proves necessary.

## COME

Named paths only. Gates after each step: `frontend/src/jjtl/` tests and `tsc`; before closing, the full suite and `check:docs`. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line. The repo is public: name no partner company.
