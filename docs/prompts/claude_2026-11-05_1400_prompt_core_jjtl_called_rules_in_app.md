# A hand-written JjTL core transformation: node check on the trunk, then the app's write-back

Prompt-ID: P-2026-11-05-1400
Chat: C-2026-11-03-1202
Front: hw-notation
Status: da eseguire
Lane: full (discovery with probes; no product code; unattended)
Depends: none
Worktree: ~/jjodel-w-corexf, branch hw-core-jjtl-app (from the trunk commit this was cut from)
Request: none (Alfonso's words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-corexf` on `hw-core-jjtl-app`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-05-1400 · session <id>]`. No subagents, no background tasks. One probe run per tool call. Commit as soon as there is something to keep. The repo is public: name no partner company, cite no path outside this tree in anything committed.

## COSA

The hardware prototype's core transformation was 19,454 generated lines and is now 500 hand-written lines using called rules and helpers (`CoreSpec2SyncRTL.jjtl`). In node, on trunk 677fab23a, it produced the same model as the generated one. It has never run in the app. Answer two questions, in this order, and write the answers to `docs/discovery/discovery_2026-11-05_core_jjtl_called_rules_in_app.md`, in English, beginning with `## 0. Answer in brief`, each figure marked measured or read.

1. Node, current trunk. Does it still match? Copy `hwproto_xform.test.ts` under `frontend/src/jjtl/executor/__tests__/` for the run only, never commit it. Run the new file on `rv_mc4`, `rv_pf4`, `rv_mc32`, `core_mc4` and the arbiter transformation on `arbiter3` (`xmi2json.py` gives a nested tree; the source must be flat: objects with `id`, references as `{__ref}`). Compare with the matching `*-syncrtl.json` reference: same tree ignoring keys starting with `__` other than `__type`, `className`, and `monitor: false`. The arbiter's parser path changed for the prototype (source text is now passed): state whether its output is unchanged.

2. App. Against a dev server of this tree on a free port above 3010, never 3000, 3001 or 3003, with Playwright: import the two metamodels and `rv_mc4`, run the new transformation in the Transformation editor, wait until the write-back settles, then compare the model in the app with the reference: object count per class, every attribute value, containment order. Same run with `CoreSpec2SyncRTL.generated.jjtl` as the control. Report for both: time to settled, objects missing, attributes lost, warnings in the JjTL output panel, a screenshot of the output. Reuse what you can from the probes of `~/.jjodel-lanes/P-2026-11-03-0703/` and the later lanes on #475 and #547: read their handoff only. Load average above 20 invalidates a timing: say so and repeat once if it falls.

Known: `Const.value` is `EInt` in `SyncRTL.ecore` and two masks exceed it (4261441663). Report what the app does with them. Do not change the metamodel in the inputs; if the import refuses it, use a private copy with `ELong` and say so.

Do not fix anything. A defect becomes a ticket: `lane-run ticket --front hw-notation --found P-2026-11-05-1400`, with its reproduction.

## DOVE

Inputs, read only, outside the tree: `~/.jjodel-lanes/pending/corexf-inputs/`. Written: the report, `docs/log-inbox/hw-notation.md`, the `Status:` line of this prompt. Probes and screenshots stay in `~/.jjodel-lanes/P-2026-11-05-1400/`. Critical zone: none, read only.

## COME

`check:docs`. Docs-only commits, named paths. Do not merge. Stop the dev server you started. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
