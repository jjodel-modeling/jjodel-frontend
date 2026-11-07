# Ticket #656, Phase 1: the identity slot of objects created by JjScript and on the canvas (discovery, Layer Impact Report)

Prompt-ID: P-2026-11-07-0654
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-07 · discovery · stopped at the context limit, continued by P-2026-11-07-0720 · handoff ~/.jjodel-lanes/P-2026-11-07-0654/handoff.md
Lane: discovery (read-only, two-phase; Phase 2 only after the chat's GO)
Depends: P-2026-11-07-0253 (name-slot discovery), P-2026-11-07-0344 (option A, merged), R-TXT-45, R-TXT-46, R-TXT-56; ticket https://github.com/jjodel-modeling/jjodel-lanes/issues/656
Worktree: ~/jjodel-w-slot656, branch slot-identity-656
Request: Alfonso 2026-11-07 06:50, «Via libera per il ticket 656»

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Read CLAUDE.md, frontend/src/model/CLAUDE.md (§3.12, §9) and docs/claude-code-log.md first. Every reply opens with [P-2026-11-07-0654 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. No code change in this phase: probes live in the lane folder or a temporary worktree removed after.

## COSA

Ticket #656 has two parts, both left open by docs/discovery/discovery_2026-11-07_textual_name_slot.md (§5.2-5.4, §6, §6.1 draft Layer Impact Report, §8 N1 and N5).

(1) **Option B, the JjScript create.** `create instance of C "h"` (jjscript/executor/commands/instance.ts:686-703) names `DObject.name` and `initialName` but never writes the identity slot, so conformance CHECK 2 flags it and the XMI export omits the name (B1 of that report). Design the fix in the executor: where the slot write goes, how it waits for the object's features (model/CLAUDE.md §9.1/§9.2, or the executor's own `hasReadyInstance`-style wait), and how it lands inside the run's undo step (one Undo removes the object and its slot). Measure, by probe on HEAD: a console `create instance of C "x"` today (slot raw, CHECK 2, XMI name); the same with a prototype of the write in a temporary worktree (slot ["x"], CHECK 2 clean, XMI name="x", one Undo); a script creating 50 objects, run time before and after; the Text tab apply with option A already in (the same-value `set` after the create must stay idempotent: no second SetFieldAction storm, no double undo step). Also list every other caller of `executeCreateInstance` or of the handle path that the change reaches (Jjodie scripts, transformations, tests).

(2) **The canvas case (N5).** An object dropped on the v2 canvas (`canvasToJjom.syncCreateObject`, components/editor-v2/sync/canvasToJjom.ts:1495-1538) has an empty slot and only its auto-name; CHECK 2 flags a `[1..1]` name on it and the export omits it. Lay out the options with evidence, at least: (a) seed the slot with the auto-name at the canvas create, inside the same undo step; (b) leave the slot empty and let CHECK 2 and the export read a never-written slot through `data.name` / `initialName` as `get_name` / `get_values` already do (R-TXT-45 D1); (c) leave both as they are. For each: what the user sees (tree, label, Properties, conformance panel, export), what an old saved model does, and which files change. Measure (a) and (b) by prototype in a temporary worktree.

(3) **Classification.** For every file a fix would touch, its row against CLAUDE.md §3.1 (critical zone) and §3.2 (triggers), as the name-slot report's §6.1 does. Write the final Layer Impact Report for the recommended fix, filled from the measurements (not the draft's guesses), with the smoke scenarios Alfonso will run on localhost:3001.

(4) **Lane plan and decisions.** Lanes in order (≤ 5 files each), and one recommendation per decision: where the executor's write goes; whether (1) and (2) ship together; which canvas option; old models (migrate, heal on next edit, or leave, as R-TXT-46 D8 did); whether option A's textual `set h.name` stays once B is in.

## DOVE

Read anywhere. Write only: the discovery report docs/discovery/discovery_2026-11-07_slot_identity_656.md (naming `discovery_<date>_<description>.md` in docs/discovery/, OBBLIGATORIO before the hard stop), the log entry in docs/log-inbox/codegen.md via the log-entry skill (Layer Impact Report: draft in the report), and the Status flip. Report, log entry and Status flip are committed by you in one docs commit, report first in the message (discovery reports are committed by the lane). Probes and prototypes: ~/.jjodel-lanes/P-2026-11-07-0654/ or a temporary worktree you remove before the end.

## COME

Phase 1 only, then HARD STOP with Outcome: hard-stop and the report path. Do not start Phase 2. The report's minimum: objective, files read with full paths, findings with file:line, measurements with the probe and its log path, dependencies and risks, the final Layer Impact Report, lane plan, decisions with recommendations, open questions for Alfonso. Final message: the report path, the recommendations in one line each, Decisions taken (unattended), then the Outcome.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_textual_name_slot.md (§4 B1 and C1, §5, §6.1, §8 N1 and N5, §9); docs/decisions.md R-TXT-45, R-TXT-46, R-TXT-56; frontend/src/model/CLAUDE.md §3.12 and §9; CLAUDE.md §3.1, §3.2; ticket #656.
