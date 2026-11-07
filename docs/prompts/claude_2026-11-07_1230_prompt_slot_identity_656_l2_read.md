# Ticket #656, lane L2: conformance and XMI export read a never-written identity slot

Prompt-ID: P-2026-11-07-1230
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (conformance, export, tests; app check)
Depends: P-2026-11-07-0654/0720 (discovery), P-2026-11-07-1003 (L1, dropped), R-TXT-45, R-TXT-57, R-TXT-58 (Alfonso 12:27 «a»)
Worktree: ~/jjodel-w-slot656, branch slot-identity-656
Request: Alfonso 2026-11-07 12:27 «a»

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file (ConformanceValidator.ts feeds editor-v2/problems/, a §3.1 directory: read it, do not change it), no new dependency. Every reply opens with [P-2026-11-07-1230 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Test red first, its own commit (RC-51, code first).

## COSA

Lane L2 of docs/discovery/discovery_2026-11-07_slot_identity_656.md §10, canvas option (b) of its §8, as R-TXT-58 decides (L2 alone; no executor change).

(1) **CHECK 2** in `frontend/src/model/conformance/ConformanceValidator.ts` (:172-187 in the report): an identity attribute whose slot was never written (raw `[]`) counts as filled when the object has a name by the `get_values` fallback (`LModelElement.tsx:7806-7808`: `writtenEmpty ? data.name : (initialName || data.name)`), not by `data.name` alone (the report's §4 O found that prototype disagreeing with Properties). A slot written `[""]` stays empty and is still flagged (R-TXT-45). Reuse the core's reading if it is exported; do not change `LModelElement.tsx`; if the fallback cannot be read without a core change, stop with Outcome: question.

(2) **XMI export** in `frontend/src/services/export/XMIService.ts` (:309-310): the same reading for a never-written identity slot, so the export writes `name="..."`; other features unchanged; `[""]` exports no name.

(3) **Tests first**, red on HEAD, in the existing tests of those two files (or one new test each): a console-created `create instance of C "x"` (slot `[]`, initialName `x`): CHECK 2 clean, XMI `name="x"`; a canvas-created object (auto-name): clean and exported; an old saved model with a never-written slot: clean on load; `[""]`: flagged and no name; a written name: unchanged. Mutation bench on the never-written condition.

(4) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(5) **App check**, real gestures where they exist (Jodie console typing, a canvas drop, the Problems panel, the Export XMI menu): crops light theme scale 1 in ~/.jjodel-lanes/P-2026-11-07-1230/: 1-console-create-problems (no missing-name problem), 2-canvas-drop-problems, 3-xmi (the exported names), 4-empty-name (a `[""]` slot still flagged). Stop your server.

(6) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge: #656 CHECK 2 and the XMI export on a never-written identity slot, Causa: both read the raw slot while Properties reads the `get_values` fallback, Layer Impact Report not-required unless your change meets a §3.2 trigger), Status flip; also flip the Status of P-2026-11-07-1003 to «dropped by R-TXT-58». Leave them uncommitted (RC-17). Edit only your new entry's lines in the log. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/model/conformance/ConformanceValidator.ts, frontend/src/services/export/XMIService.ts, their tests (≤ 2 test files). Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_slot_identity_656.md (§4 O, §5, §6, §8, §10); docs/decisions.md R-TXT-45, R-TXT-46, R-TXT-57, R-TXT-58; frontend/src/model/CLAUDE.md §3.12.
