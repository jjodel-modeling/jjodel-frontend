# DCN slice 5, lane 4: pure plan of the snapshot copy

Prompt-ID: P-2026-11-08-2124
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (one pure module and its test; no writes to the model, no UI)
Depends: R-DCN-27, R-DCN-30; discovery docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §B and §D lane 4
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 18:21, «Go su tutto»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 file, no D-layer or L-layer write, no new dependency. No subagents, no background tasks. Every reply opens with [P-2026-11-08-2124 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline from the first line: read only §B and §D of the report and the line ranges it cites; grep first, about 60 lines around; never read a whole file over 400 lines; summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log.

## COSA

(1) New pure module `frontend/src/components/editor-v2/sim/simSnapshot.ts` (grep the name first) exporting `planSnapshot(input)` that returns the ordered list of operations the write lane (lane 5) will execute to copy an M1 model into a new one and write σ over it, without executing anything:
- the new model's name: `<model> (snapshot step N)`, the uniqueness suffix left to `uniqueModelName` at write time (say so in a comment);
- create operations for every object of the source model (`collectModelObjectIds`, discovery §B) in containment order, each with a temporary key and its class;
- reference writes remapped from source ids to temporary keys (containment and plain references, `.values = [key]`), links copied from the model, never from σ (R-DCN-30);
- attribute writes copied from the model, then σ overrides for every attribute slot of a DCN instance at the shown step; a slot present in σ without a Slot object gets a create operation for it;
- nothing for dormant-only bookkeeping: σ keeps dormant values (R-DCN-3) and they are written like any other slot.
The input is plain data (read the shapes the write lane will have: the source model's objects with class, attributes and references, and σ keyed as in the DCN run). Define its type in the module.

(2) Test `frontend/src/components/editor-v2/sim/__tests__/simSnapshot.test.ts`, red first, on a small hand-built model (a class level with two classes and an association, two instances, one link, one attribute changed in σ, one slot only in σ): order (containers before contents), every reference remapped, no source id left in the plan, σ overrides applied, links from the model, name.

(3) Gates: typecheck, full vitest (baseline 3 known import reds; load reds rerun alone and named), build. Mutation bench (at least 6 mutants).

(4) Docs: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters by `wc -m`; Corregge and Causa the dash; Layer Impact Report not-required; Smoke visivo: non applicabile, no UI path). Status flip of this prompt. Commits: code with test, then docs. `git add` only named files. No push, no merge. Final message: the input and plan types, files and commits, gate table, mutants, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/simSnapshot.ts (new) and its test; docs/log-inbox/dcn.md; this prompt. Read-only elsewhere. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §B, §D; docs/decisions.md R-DCN-3, R-DCN-27, R-DCN-30; frontend/src/model/CLAUDE.md §9.3 (reference and attribute writes).
