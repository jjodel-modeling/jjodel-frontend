# JjTL: a non-hardware acceptance case, Class2Relational

Prompt-ID: P-2026-11-03-1434
Chat: C-2026-11-03-1020
Front: hw-notation
Status: eseguito 2026-11-03 · lane full · 8a064bbbd · fixture and test committed; app probe, tickets and report completed by P-2026-11-03-1505 after the context ceiling (unattended)
Lane: full (acceptance measure; product code only for a one-line local fix)
Depends: none
Worktree: ~/jjodel-w-jjtlc2r, branch jjtl-class2relational (at the commit that adds this prompt)
Request: none (Alfonso's request of 2026-11-03 10:20, plan for the open JjTL points; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlc2r` on
`jjtl-class2relational`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1434 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Print only summary lines. Read `frontend/src/jjtl/SPEC.md` sections 5.3 and 12, the rows R-JTG-5, 6, 7 of `docs/decisions.md`.

## COSA

The whole of slices A and B has been accepted on hardware cases only. This checks that the design is general. Write Class2Relational: classes, attributes, multi-valued attributes to join tables, inheritance, references, with matched, called and lazy rules where they are natural. Use no hardware vocabulary or shape.

1. As a test fixture run by the executor, with source and target metamodels and a source model that exercises every case.
2. As an app probe on a free port, through the real Execute dialog, the output model read back: the expected tables, columns, keys and join tables. Save and reopen: same tree.
3. In the same probe, show the warning of #445 in the output panel: a binding to a feature the target class does not declare. Capture the line. Nobody has seen it in the app yet.
4. Report, `docs/discovery/discovery_2026-11-03_jjtl_class2relational.md`, in English, beginning with `## 0. Answer in brief`: what is written naturally, what is awkward, what fails; size and readability figures (lines per rule, rules by kind, what a hand-written reader must know). Each figure marked measured or read.

Each failure is a ticket (`lane-run ticket --front hw-notation --found P-2026-11-03-1434`); a fix only if it is one local line. Do not bend the fixture around a failure without saying so: write the natural version first, and record the workaround separately. If it shows that R-JTG-5, 6 or 7 fit only the hardware shape, stop and report it with `Outcome: question`: this is the finding Alfonso most needs. Do not try to fix it.

## DOVE

New fixture and test under `frontend/src/jjtl/`, the report, `docs/log-inbox/hw-notation.md`, the `Status:` line. Probes in `~/.jjodel-lanes/P-2026-11-03-1434/`. `ProjectEditor.tsx` is not touched; no CLAUDE.md 3.2 file. The repo is public: name no partner company.

## COME

Named paths. Gates: `tsc`, full vitest (3 files red at import are the baseline now: `context-binding`, `ai-prompt-sanitization`, `UDComparator`), build, `check:docs`. A probe is not a hand run. If context runs short, commit what is green and write the handoff. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
