# Core: an object can be nameless (R-TXT-45), discovery and Layer Impact Report

Prompt-ID: P-2026-11-04-1632
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-04 · lane full · 6cd4a8b27 · discovery only, awaiting Alfonso on D1-D10 of the report
Lane: full (discovery, read only, core)
Depends: R-TXT-45 (604273359)
Worktree: ~/jjodel-w-nameless, branch core-nameless-identity, from 604273359
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-04 16:28, «A», recorded as R-TXT-45)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 604273359 and the tree is clean, otherwise stop with Outcome: blocked. Read only: no source file changes; the only files you write are the discovery report and throwaway probes under the lane folder. Every reply opens with [P-2026-11-04-1632 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Read CLAUDE.md §3.1 and §3.2 and frontend/src/model/CLAUDE.md §3.12 first.

## COSA

R-TXT-45: the identity-slot read in frontend/src/model/logicWrapper/LModelElement.tsx (about lines 7786-7800, the fallback of an empty `name : EString` slot to the owner's initialName, then data.name) must fall back only while the slot has never been written; a slot written with the empty string reads as nameless. Measure, do not change.

(1) Every reader of the identity: who calls this read path, directly or through `name`, `initialName`, `identityAttribute` (LClass), `set_name`, `LValue.setValueAtPosition`; list file:line for each, grouped by layer (D, L, JjOM, canvas v2-flow, canvas classic, sync, persistence, JjEL, JjScript, export/serialisation, Text tab). Say for each whether an empty name would break it (a label, a lookup by name, a key, a JjEL `name` comparison, an Ecore/XMI export, the instance-name uniqueness of the executor, the outline and the hover of the Text tab).

(2) How to tell never written from written empty, with no new field if possible: what the slot holds in the two cases (`[]` versus `[""]`, as names-measure.md of P-2026-11-04-1605 measured: `set H.name = ""` stores `[""]` and DObject.name `""`), whether a saved and reopened project keeps the difference (VersionFixer, jsxString, the persistence round trip), and whether undo restores it. If a new field is unavoidable, say where and why, and stop there.

(3) The proposed change in a few lines of pseudo-diff, and the Layer Impact Report of CLAUDE.md §3.2 filled in, with the smoke scenarios: a nameless object on the canvas (classic and v2-flow) shows what label; JjEL `self.name` on it; export to Ecore/XMI and reimport; save, reopen, identical state; undo of the clear; the Text tab (C-like and Pascal) prints it nameless and the C1e reprint no longer fires. Mark every uncertainty about propagation explicitly: an uncertainty is an Outcome: question, not a guess.

(4) The tests that pin today's fallback (grep the test suites for initialName and the identity read), and which of them the change would turn red on purpose.

Discovery report, mandatory: docs/discovery/discovery_2026-11-04_core_nameless_identity.md (objective, files read with full paths, findings, the Layer Impact Report, risks, open questions for Alfonso), committed on the branch with its own commit, plus the Status flip of this prompt left uncommitted (RC-17). Hard stop after the report: no implementation in this lane. No push, no merge. Public repo: name no partner company. Final message: the findings in short, the LIR verdict, Decisions awaiting Alfonso, then the Outcome.

## DOVE

Read: frontend/src/model/ (logicWrapper/LModelElement.tsx, joiner/classes.ts), frontend/src/components/editor-v2/, the classic canvas, frontend/src/jjscript/executor/commands/instance.ts, the JjEL evaluator, VersionFixer.tsx, the Ecore/XMI exporters, frontend/src/codegen/textual/. Write: the report and the lane folder only.

## RIFERIMENTI

docs/decisions.md R-TXT-44, R-TXT-45; CLAUDE.md §3.1, §3.2; frontend/src/model/CLAUDE.md §3.12; ~/.jjodel-lanes/P-2026-11-04-1605/names-measure.md.
