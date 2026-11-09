# Megamodel included edges: close the lane after its context ceiling

Prompt-ID: P-2026-11-08-1720
Chat: C-2026-11-03-1202
Front: hw-notation
Status: eseguito 2026-11-08 · lane full · 295c5429b, 7c172384a (code), 17abe0030 (SPEC), f28299521 (R-JTG-35), f9ca9cd8c (report) · gates green (typecheck 0, build, check:docs, vitest 15450 passed with the 3 baseline import reds) · ticket #781 · not merged
Lane: full (continues P-2026-11-08-1612 after its context ceiling; unattended)
Depends: P-2026-11-08-1612
Worktree: ~/jjodel-w-megainc, branch jjtl-megamodel-included (the same tree, with its uncommitted code)
Request: none (continuation of P-2026-11-08-1612)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-megainc` on `jjtl-megamodel-included`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1720 · session <id>]`. No subagents, no background tasks. Print only summary lines of suites. Commit as soon as each item's gates are green. The repo is public: name no partner company and no path outside this tree in anything committed.

## COSA

Read only `~/.jjodel-lanes/P-2026-11-08-1612/handoff.md` and `git status`. Do not redo the design. The chat viewed the replaced crop and accepts it: three distinct tracks, short pills.

1. Typecheck and the tests of the two touched test files, then the two code commits the handoff describes (edge builder first, then tracks and pill), named paths.
2. Answers of the chat to the two open points: included models get only `instanceInputOf`, no `sourceOf` (one edge per included model, as decided); the default visibility of `instanceInputOf` stays as it is today, out of scope, and the report says that a multi-source run shows its included edges only once the kind is turned on.
3. File a ticket with `lane-run ticket --front hw-notation --found P-2026-11-08-1612` for the two `conformsTo` pills that touch `model_1` and `model_1 (1)` in the crop (pre-existing, not caused by this lane), with the probe check as reproduction. Do not fix it.
4. R-JTG-35 next to R-JTG-34, header format as R-JTG-33/34, stating: one `instanceInputOf` edge per included model with pill `included` and full text in tooltip, and separate vertical tracks 8px apart for edges sharing a gap, both ratified by Alfonso 2026-11-08 16:49; the optional field and the no-migration rule decided by the chat under delegation 2026-11-08 16:04; registered by P-2026-11-08-1612 and P-2026-11-08-1720. SPEC §9; the report addendum; the log entry; the `Status:` lines of this prompt and of P-2026-11-08-1612.
5. Gates: typecheck, the FULL vitest suite, build, `check:docs`.

## DOVE

The five files of the handoff, their commits, the decisions file holding R-JTG-34, `frontend/src/jjtl/SPEC.md`, the report `docs/discovery/discovery_2026-11-08_jjtl_megamodel_included.md`, the log. Stop with `Outcome: question` for a critical-zone file or a renamed CSS class.

## COME

Atomic commits, named paths, docs and code never in one commit. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line. Context ceiling: write `handoff.md` and stop with `Outcome: hard-stop`.
