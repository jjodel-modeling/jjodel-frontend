# Fix: queued appends overlay for slot writes (lost containment write, option A)

Prompt-ID: P-2026-11-09-1227
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full, critical (sync layer: `canvasToJjom.ts`, `EditorV2.tsx` append paths; launched with `--critical-zone-goahead P-2026-11-09-1227`)
Go-ahead: Alfonso 2026-11-09 12:24 «go-ahead per la zona critica, «A»»
Depends: discovery P-2026-11-09-1020 (docs/discovery/discovery_2026-11-09_lost_containment_write.md, b7b4817b1; probe frontend/scripts/probe/lost-containment-write.ts, 780b0b99e)
Worktree: ~/jjodel-w-lostfix, branch lost-link-fix, from lost-link-discovery, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No reducer change, no L-layer or `LModelElement.tsx` change (option D is not chosen; `LModelElement.tsx:7425` stays as a ticket), no signature change of exported functions, no new dependency, no TRANSACTION added around DVertex or DVoidEdge creation (Rule 12). No subagents, no background tasks. Every reply opens with [P-2026-11-09-1227 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline: read §6-§10 of the discovery report and the exact line ranges it cites (about 40 lines each); never read `EditorV2.tsx`, `canvasToJjom.ts` or `reducer.ts` whole; summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log; one probe run per tool call; before a probe run wait while the 1-minute load is above 20. One item per commit.

## COSA

(0) **Layer Impact Report first** (CLAUDE.md §3.2 format), saved as `docs/discovery/lir_2026-11-09_queued_appends.md` and committed alone before any code: sync layer only; what the overlay holds (per slot id, the ids appended but not yet in the store), when an entry is dropped (once the store's slot holds it, or after a bound for a write that never lands, e.g. an aborted transaction: say which bound and why), what does not change (reducer, L-layer, D-layer write actions, JjScript's `settlePendingWrites`), the undo interaction (two quick appends must undo as today, `reducer.ts` about 1237), smoke scenarios (Families.ecore import with 8 edges, open an existing project, save and reopen, two quick drops into one container). If the report finds the fix needs a reducer, L-layer or core change, stop with Outcome: question.

(1) **Helper.** One helper in the sync layer (next to `syncCreateCompositionLink` in `sync/canvasToJjom.ts`, or a small new module beside it; grep the name first) that plans an append to a slot as `[...meaningful values in the store, ...queued not yet landed, id]` and records the id as queued for that slot. Red test first (a unit test with a fake store: two appends to one slot before the store holds the first keep both, in order; an entry is dropped once landed; the bound drops a write that never lands; appends to different slots do not interfere). Commit.

(2) **Sites.** Route through the helper the append sites the report lists: `canvasToJjom.ts` about 1744 (`syncCreateCompositionLink`), about 1687 (`syncSetReferenceValue` append), about 1812 (`syncCreateReferenceLink`), `EditorV2.tsx` about 2360, `ContextMenu.tsx` about 395. Same synchronous signatures, same return values. Leave `LModelElement.tsx:7425` untouched and file it as a ticket paragraph. Commit.

(3) **Acceptance.** Run `frontend/scripts/probe/lost-containment-write.ts`: its forced arms (`sameSlotSameTick`, `sameSlotMacrotask`, `syncCommitBetween`) now keep both writes; update their expectations (they asserted the bug) and keep their detector as a regression check; the 10-run organic burst loses nothing. Add one arm through `performContainmentDrop` (two quick real drops into one container, the report §10 Q4): both children kept, both edges drawn, one undo per drop as today. Then run `frontend/scripts/probe/dcn-drone-fixture.ts` once: L-1 (lost writes) counts 0. MEAS lines; commit the probe changes.

(4) **Gates**: typecheck, typecheck:scripts, full vitest (baseline 3 known import reds; load reds rerun alone and named), build, check:docs. Mutation bench on the helper (at least 8 mutants). Smoke scenarios of the LIR that the probes reach; say which.

(5) **Docs**: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters by `wc -m`; Corregge: the ticket of P-2026-11-08-1939; Causa one line; Layer Impact Report: the LIR path; Smoke visivo: probe MEAS, no crop; ticket paragraph for `LModelElement.tsx:7425`). Status flip of this prompt. Remove any temporary node_modules link. `git add` only named files. No push, no merge. Final message: LIR summary, files and commits, gate table, mutants, probe MEAS, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sync/canvasToJjom.ts (and a new helper module beside it, if chosen) and its tests; frontend/src/components/editor-v2/EditorV2.tsx (the one append site only); frontend/src/components/editor-v2/ContextMenu.tsx (the one append site only); frontend/scripts/probe/lost-containment-write.ts; docs/discovery/ (the LIR); docs/log-inbox/dcn.md; this prompt. `frontend/scripts/probe/dcn-drone-fixture.ts` is run, not changed (`repairContainment` stays until the merge). Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-09_lost_containment_write.md §6-§10; CLAUDE.md §3.1, §3.2, Rule 12; frontend/src/model/CLAUDE.md §9.3; docs/log-inbox/dcn.md (ticket of P-2026-11-08-1939).
