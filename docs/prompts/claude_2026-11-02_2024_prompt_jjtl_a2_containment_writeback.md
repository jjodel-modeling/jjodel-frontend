# JjTL A2: close A1, then the app's write-back of placed targets

Prompt-ID: P-2026-11-02-2024
Chat: C-2026-11-02-1541
Front: hw-notation
Status: eseguito 2026-11-02 · lane hw-notation · 897e4fdca, 2481545b5, 784c0acc0 and the closure commit · verifica visiva passata 2026-11-02 (probe, port 3193)
Lane: full (JjTL write-back in the app; second lane of slice A)
Depends: P-2026-11-02-1956
Worktree: ~/jjodel-w-jjtlcontain, branch jjtl-containment (the same tree, at the commit that adds this prompt)
Request: none (Alfonso's GO of 2026-11-02 19:54 covers slice A; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlcontain` on
`jjtl-containment`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2024 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Keep context low: never print a whole log; read `~/.jjodel-lanes/P-2026-11-02-1956/handoff.md` first and repeat none of its reading.

## COSA

First close P-2026-11-02-1956: its inbox entry, the `Status:` line of its prompt, `check:docs`, one docs commit.

Then Layer Impact Report, `docs/discovery/lir_2026-11-02_jjtl_containment_writeback.md`, before any edit: it goes in your first code commit.

Then implement the write-back, covering the nine items of the handoff. Rulings, provisional and unattended (RC-25), which the chat reports to Alfonso:

1. Placements stay in `targetModel.containment`, as A1 left them: the write-back reads them there. Alfonso asked that placement go through the existing nested path: so the writer is the existing one in `nestedMaterialization.ts`, by id with its polling and caps, and no second writer is added. Update SPEC where it says a placement travels as `__nested`.
2. Elements on a containment cycle: leave A1 as it is. The run fails, and the app writes nothing.
3. A contained target that holds a pointer to a rule target must keep it: remove the drop at `nestedMaterialization.ts:207-214`, with a two-phase order if the pointed element does not exist yet.
4. A placed target is written once, inside its container, never also as a root. The one-target-per-source-id map at `ProjectEditor.tsx:1809` stays: it is B's.
5. Ticket #445 stays open: no fix to the `name` exemption at line 210.

## Measure in the running app

With `lane-run probe` on a free port, through the real Execute dialog, one fresh tab per scenario (ticket #446): a tree of depth 3 by one rule per class, both rule orders, model read back: each element inside its container, only the root at root level, no duplicates; a collection in order; a contained element with a pointer to a target outside the tree; a nested creation next to a placed target in one containment; a second claim, with the error visible and nothing written; save and reopen, same tree; the transformation of P-2026-11-02-1838's S1 to S4 unchanged. Undo once after a run: report what it does, change nothing. Probe files stay in `~/.jjodel-lanes/P-2026-11-02-2024/`.

## DOVE

`frontend/src/components/project/ProjectEditor.tsx` (the JjTL write-back steps only), `frontend/src/components/project/nestedMaterialization.ts`, their tests, `frontend/src/jjtl/SPEC.md`, the LIR, `docs/log-inbox/hw-notation.md`, the `Status:` lines of both prompts. No CLAUDE.md 3.2 file: if one proves necessary, stop with `Outcome: question`. An existing test that must change other than for this behaviour: `Outcome: question`.

## COME

Atomic commits, named paths only. Gates: `frontend/src/jjtl/` and `components/project` tests, full suite, `tsc`, `check:docs`. Do not merge. Close with the measured figures, «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line. The repo is public: name no partner company.
