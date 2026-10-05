# Prompt: fix the two console errors E1 and E2 before the MODELS freeze

Prompt-ID: P-2026-10-05-1648
Chat: C-2026-10-05-1648
Lane: full (core files, tests first, probe with negative controls; no rendering change, so no visual check). Tier: heavy (RC-32: `LModelElement.tsx` and the load path). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead: none of the files is in §3.2.
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-consolefix`, branch `console-errors-fix` from the trunk `57ff86f5d`, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` (the docs commit adding this prompt, on top of `57ff86f5d`) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-05-1648 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Time limit: 90 minutes.

## Decision this lane executes

Alfonso, 2026-10-05: both errors are fixed **before the freeze of 2026-10-07**, against the report's recommendation (after Málaga). This answers «Decisions awaiting Alfonso» 1 of `docs/discovery/discovery_2026-10-04_console_errors_demo.md` (P-2026-10-04-1025). Record it in that report's §0 as a one-line addendum, not by rewriting the section.

## Context (do not redo the analysis)

The discovery is on branch `console-errors-disc` (`49a8a55f5`, not merged): report, probe `frontend/scripts/probe/console-errors-demo.ts`, closure. Step 1 brings it here. Read §0, §2, §3 and §5 of the report; the fixtures `frontend/scripts/probe/fixtures/scene_{1..4}_*.jjodel` are already on the trunk.

- **E1 «Invalid action path 0»**: on a hash open from the dashboard (20 of 20), `PathChecker.tsx:14` → `U.resetState` → `DState.init_editor` «init jodel state» (`store.tsx:245`) → `DViewPoint.newVP` → `setExternalPtr` (`classes.ts:636`) dispatches `SetFieldAction idlookup.<project>.viewpoints += Pointer_ViewPointDefault` on a reset state that holds no project; `reducer.ts:545-546` rolls the 56-action batch back. The final store equals a fresh open's (20 of 20).
- **E2 «Cannot serialize in ecore, found loop»**: `LModel.get_roots` returns every object (its `isRoot` filter is commented out), so the M1 branch of `generateEcoreJson_impl` (`LModelElement.tsx:5212`) meets a contained object again as a root. Fires 6 per Reset on PEST and ESM, plus 6 per model-tab open on ESM.

## COSA

1. `git merge --no-ff --no-edit console-errors-disc` (docs and probe only; a conflict means stop with `Outcome: question`).
2. **E2**: in the M1 branch of `LModel.generateEcoreJson_impl`, skip `obj` when `!obj.isRoot` (the one line of §5). Do not un-comment the filter in `get_roots` and do not touch `eval.ts` (the optional alias skip of §5 stays out).
3. **E1**: the guard goes in `DState.init_editor` (`frontend/src/redux/store.tsx`, the «init jodel state» transaction): do not create the Default viewpoint for a project id the state does not hold. Not in `setExternalPtr` (shared by every constructor), not in `U.resetState` (load order), not in the reducer (R-UNDO-7/8). If the guard cannot be written there without changing a shared constructor or the transaction's other writes, stop with `Outcome: question` and a `Recommended:` line.
4. Tests first: a vitest that reproduces each error on the current code (E2: serialize an M1 model with a containment, expect no loop error and each object once; E1: init the editor on a state without the project, expect no write to a missing path), red before the fix, green after.

## DOVE

Write: `frontend/src/model/logicWrapper/LModelElement.tsx` (one line), `frontend/src/redux/store.tsx` (the guard), the new tests next to the existing ones of each area, the report's §0 addendum, `docs/log-inbox/` entry, this prompt's Status. Read-only: everything else. Probe on port 3084 only, never 3000, 3001 or 3003.

## Tests and gates

- Typecheck (baseline 14, the §17 set), vitest (the 9 known suites red at import), build, `check:docs`.
- **Probe** `console-errors-demo.ts`, both modes, four scenes, 40 pages: E1 0 of 20 on hash opens, E2 0 on every Reset and model-tab open; the save round trip identical; `.ecore` and `.xmi` equal to the store field by field; the store after a hash open equal to a fresh open's by name, 20 of 20; the M1 `ecore` JSON of PEST and ESM now complete (every object once). `init_dash` stays: known, out of scope, count it apart.
- **Negative controls**: revert each fix alone and show the probe sees that error again with the report's counts; restore. A control that cannot fail is not a control.
- Mutation bench on the two changed sites.

## HARD STOP

After the code commit (`fix: no console errors E1 and E2 on the demo scenes (P-2026-10-05-1648)`, conventional, one line) and the gates: one closure commit of docs (RC-17) with the Status flip, the log entry and the report addendum. Then `Outcome: done`. Do not merge: the chat merges into the trunk.

## NON FARE

No change to `reducer.ts`, `classes.ts`, `U.tsx`, `eval.ts`, `get_roots`. No `git stash`, no `git add .`, no files outside the worktree, no push.

## RIFERIMENTI

`CLAUDE.md`; `docs/discovery/discovery_2026-10-04_console_errors_demo.md` (§0, §2, §3, §5, §6); `docs/discovery/discovery_2026-09-25_hash_change_open.md` (E3 emulation, background only); R-UNDO-7, R-UNDO-8.
