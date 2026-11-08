# JjTL gaps measured on the generic Brief transformation (Phase 1: discovery)

Prompt-ID: P-2026-11-08-0125
Chat: C-2026-11-03-1202
Front: hw-notation
Status: da eseguire
Lane: full (discovery only, no product code; unattended)
Depends: P-2026-11-07-1125
Worktree: ~/jjodel-w-kgaps, branch jjtl-kernel-gaps
Request: none (Alfonso's words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-kgaps` on `jjtl-kernel-gaps`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-0125 · session <id>]`. No subagents, no background tasks. One probe run per tool call. Print only summary lines, never whole files of the inputs (one is 15 KB of JjTL, the models 150 KB each). Commit the report as soon as it is written. The repo is public: name no partner company and no path outside this tree in anything committed; call the case the hardware Brief kernel.

## Context

A prototype outside this repo lowers a hardware Brief to a synchronous RTL metamodel with one JjTL transformation that knows no domain (`Brief2SyncRTL.jjtl`, 328 lines). On trunk `02269f010` it gives the reference model on 21 Briefs and 42 identical printed files (measured 2026-11-07). Its author bent around five JjTL limits:

1. No inheritance-based source matching (SPEC 3.2, gap 10): libraries use generic items with integer props, string texts and expression slots instead of extending kernel classes.
2. No multi-model source (gap 7): library, template and patterns are copied into every Brief (about 2,000 objects each).
3. An explicit context, a list of `{k, v}` frames passed to every called rule, because `envLookup` yields a demand, realized only where a binding places it, so it cannot feed a name or an integer.
4. No many-valued attributes in its use: lists of names are space-separated strings.
5. `log2` returns a float: exact only on powers of two.

Inputs, read only, in `~/.jjodel-lanes/pending/kgaps-inputs/`: the transformation, its source and target metamodels, two Briefs (one core, one arbiter) as flat JSON, the node probe and its classes file, the design note `brief-kernel.md`.

## COSA

For each of the five, in order of what it costs the transformation, report: what the transformation does to get around it (file and line in the input, measured by reading), what exists in JjTL today (file and line on this branch), what the smallest change would be, what it breaks or interacts with (trace keys of R-JTG-6, R-JTG-13, R-FA-11..14, the app's write-back), and how it would be verified (the 21-Brief regression is the oracle; name the probe that would show the gain). Item 3 first: design a read-only context visible to called rules and helpers, captured at the call like the environment but outside the trace key, and say whether it needs grammar; compare with a transformation-level `let` and with extending `envLookup` to return values. Item 2: what a second source model means for pass 1, the trace and the app's Transformation editor (how a user would pick several models). Run the transformation once in node on the two Briefs as a baseline, with the probe copied under `frontend/src/jjtl/executor/__tests__/` and removed after.

End with a recommended order of slices, each one lane, and the decisions that are Alfonso's.

Report: `docs/discovery/discovery_2026-11-08_jjtl_kernel_gaps.md`, in English, beginning with `## 0. Answer in brief`, each figure marked measured or read; it is the deliverable of this lane.

## DOVE

Written: the report, `docs/log-inbox/hw-notation.md`, the `Status:` line. No product code, no grammar change. A Layer Impact Report is part of the report for any slice that would touch a critical-zone file.

## COME

`check:docs`. Docs-only commits, named paths. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
