# Ticket #656, lane L1: `create instance of C "h"` writes the identity slot (executor)

Prompt-ID: P-2026-11-07-1003
Chat: C-2026-11-03-1037
Front: codegen
Status: dropped by R-TXT-58
Lane: full (executor, tests; probe; Layer Impact Report)
Depends: P-2026-11-07-0654 and P-2026-11-07-0720 (discovery), R-TXT-57 (Alfonso 09:53), R-TXT-45, R-TXT-56
Worktree: ~/jjodel-w-slot656, branch slot-identity-656
Request: Alfonso 2026-11-07 06:50 «Via libera per il ticket 656»; 09:53 «Dammi le 5 risposte» (R-TXT-57)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Read CLAUDE.md, frontend/src/model/CLAUDE.md (§3.12, §9) and the discovery report first. No CLAUDE.md 3.1 critical-zone file. This lane has a §3.2 trigger (a slot write next to a creator in non-test source): it carries a Layer Impact Report. Every reply opens with [P-2026-11-07-1003 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Test red first, its own commit (RC-51, code first).

## COSA

Lane L1 of docs/discovery/discovery_2026-11-07_slot_identity_656.md §10, as R-TXT-57 (1), (2) and (5) decide.

(1) **Prototype and measure the end-of-run write first**, in the lane worktree before any commit (reuse ~/.jjodel-lanes/P-2026-11-07-0720/proto.diff and the probe of P-2026-11-07-0720, copied into ~/.jjodel-lanes/P-2026-11-07-1003/): during a run, `executeCreateInstance` records each create with an explicit handle on a class with an identity attribute; at the end of the run (inside the run's undo step, where the executor closes it), every recorded object whose identity slot is still never written gets [handle], in one commit. Measure against the report's numbers: 50 console creates (base 71 ms), 50 through the Text tab path (base 6.2 s); the 5x race of a `set h.name` right after the create (the `set` must win 10/10); one Undo removes the run with its slots; CHECK 2 clean and XMI name="h"; the Text tab apply status and undo steps. Keep it only if all three R-TXT-57 (1) conditions hold. If one fails: stop with Outcome: question and the measurements, no fallback.

(2) **Implement the kept variant** in `jjscript/executor/commands/instance.ts` (and where the run ends, if that is another executor file: name it and ask first if it is not in DOVE), tests first and red on HEAD in a new test under `frontend/src/jjscript/executor/__tests__/`: a named create writes the slot; a nameless create does not; a class without an identity attribute is untouched; a `set h.name` in the same run wins; a slot written `[""]` stays. Silence the `identical assignment` console line for a same-value `set` (R-TXT-57 (5)) in the same file, with its own test. Mutation bench on the end-of-run condition. `m1Containment.test.ts` only if it pins the create's effects.

(3) **Layer Impact Report**, final, for the variant shipped (update §7 of the report's draft from your measurements), in the discovery report as a new section and in the log entry's Layer Impact Report field.

(4) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(5) **App check**, the report's smoke scenarios 1-7 of §7 that a probe can run with real gestures (Jodie console typing, Text tab typing, Undo by key), crops light theme scale 1 in the lane folder: 1-console-create (Properties name and Problems clean), 2-xmi (the exported name), 3-text-tab-apply, 4-undo. Stop your server.

(6) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge: #656 the identity slot of `create instance of C "h"`, Causa: the executor names `DObject.name` and `initialName` but never the slot, Layer Impact Report: the final one of (3)), Status flip, both left uncommitted (RC-17); the report section of (3) committed with the code. No push, no merge: the chat shows the Layer Impact Report to Alfonso before the merge. Final message: the measurements of (1), what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/jjscript/executor/commands/instance.ts, one new test file under frontend/src/jjscript/executor/__tests__/, frontend/src/jjscript/executor/__tests__/m1Containment.test.ts only if needed, docs/discovery/discovery_2026-11-07_slot_identity_656.md (new section), docs as above. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_slot_identity_656.md (§4, §5, §7, §10, §11); docs/decisions.md R-TXT-45, R-TXT-56, R-TXT-57; ~/.jjodel-lanes/P-2026-11-07-0720/ (proto.diff, probe); frontend/src/model/CLAUDE.md §3.12, §9; CLAUDE.md §3.2.
