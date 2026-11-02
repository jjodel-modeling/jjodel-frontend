# JjTL B2 closed: rerun the probes, SPEC, tickets

Prompt-ID: P-2026-11-03-0009
Chat: C-2026-11-02-1541
Front: hw-notation
Status: da eseguire
Lane: full (continues P-2026-11-02-2338 after its context ceiling; no product code unless a probe fails)
Depends: P-2026-11-02-2338
Worktree: ~/jjodel-w-jjtlcalled, branch jjtl-called-rules (the same tree, at the commit that adds this prompt)
Request: none (continuation; Alfonso's GO of 2026-11-02 22:21)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlcalled` on
`jjtl-called-rules`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-0009 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Read only `~/.jjodel-lanes/P-2026-11-02-2338/handoff.md`. Print only summary lines of a probe.

## COSA

Do the remaining steps of the handoff: rerun the B2 probe, then the probes of P-2026-11-02-2108 and P-2026-11-02-1838, with figures; update the B2 list of SPEC 5.3.3; log entry; `check:docs`; the `Status:` lines of this prompt and of P-2026-11-02-2338.

File three tickets with `lane-run ticket --front hw-notation --found P-2026-11-02-2338`, each with what was measured:
- priority high: a many-valued reference holding one value reaches the rules as a single value (`ProjectEditor.tsx:1556-1574`), so `b.bindings.map` fails with `Unknown method 'map' for type Binding`. A transformation that works on two values breaks on one.
- priority medium: the same pointer listed twice in a source reference reaches the rules once.
- priority medium: writing a tree of 2,559 lowered objects took 17 s in the app against 603 ms in the executor: where the time goes, for trees of this size. Do not fix.

A probe failure that comes from B2's code is a regression: stop with `Outcome: question`, with what you measured. Do not fix the source-side problems.

## DOVE

`frontend/src/jjtl/SPEC.md`, `docs/log-inbox/hw-notation.md`, the two `Status:` lines. Probe files in `~/.jjodel-lanes/P-2026-11-02-2338/`.

## COME

Named paths only: SPEC in its own commit, docs in another. Do not merge. Close with the figures, «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line. The repo is public: name no partner company.
