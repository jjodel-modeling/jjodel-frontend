# JjTL generic transformation: write the discovery report from the handoff

Prompt-ID: P-2026-11-02-1612
Chat: C-2026-11-02-1541
Front: hw-notation
Status: eseguito 2026-11-02 · lane hw-notation · report docs/discovery/discovery_2026-11-02_jjtl_generic_transformation.md
Lane: fast (docs only, no code; continues P-2026-11-02-1425 after its context ceiling)
Depends: P-2026-11-02-1425
Worktree: ~/jjodel-w-jjtlgeneric, branch jjtl-generic-transformation (the same tree, at the commit that adds this prompt)
Request: none (continuation of P-2026-11-02-1425 after the context-ceiling hook; no new request from Alfonso)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlgeneric` on
`jjtl-generic-transformation`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-1612 · session <id>]`.
No subagents, no background tasks. No code change. Keep context low: the reading is already done.

## COSA

Write `docs/discovery/discovery_2026-11-02_jjtl_generic_transformation.md`, in English, from
`~/.jjodel-lanes/P-2026-11-02-1425/handoff.md`. Read that file and the COSA section of
`docs/prompts/claude_2026-11-02_1425_prompt_jjtl_generic_transformation_discovery.md`, then write the report: premises
verified, design proposal for A to E, questions 1 to 7 answered, recommended order with the reason, for each part what
exists and what is needed, Layer Impact Report. Reopen a source file only to confirm a `file:line` you are about to rely
on and doubt. Do not restart the discovery, and do not add decisions the handoff does not hold unless a check disproves one:
if it does, say so in the report.

## DOVE

Written: the report; the log entry in `docs/log-inbox/hw-notation.md` (PROTOCOL P9), covering both prompts; the `Status:`
lines of this prompt and of P-2026-11-02-1425. Nothing else. The outside files stay outside the repo, and the repo is
public: name no partner company.

## COME

Run `check:docs`. One docs-only commit, `git add` of those paths only, then stop. No Phase 2. Close with «Decisions taken
(unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
