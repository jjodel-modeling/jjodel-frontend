[P-2026-10-10-1600] Phase 2 GO: fix F1 only. Critical-zone go-ahead granted by Alfonso on 2026-10-10 at 17:16. Hard stop after F1.

Prompt-ID: P-2026-10-10-1600
Chat: C-2026-10-10-0057
Lane: full (§3.1 sync layer, `hooks/useM1ReferenceEdges.ts`; RC-30 go-ahead)

## Accepted

Your report (`9e1b0b7b8`) and probe (`46bcfcb92`) are accepted, with your unattended decisions. Alfonso's answers to your four questions are your recommendations:

1. F1 alone, in this lane, before nested-vertices S2. Yes.
2. F3 (a general net in `useJjomSync`): not here. It is recorded as an option for nested S2.
3. No scrub of `edgesIn`/`edgesOut`. Your ticket stands.
4. No migration of dangling ids in saved projects.

## COSA

F1 exactly as in report §7: inside the existing delete-only TRANSACTION of `useM1ReferenceEdges.ts:190-196`, add `SetFieldAction.new(graphId, 'subElements', e.id, '-=', true)` and its import. Nothing else changes in that file.

## COME

- **First step: the Layer Impact Report** in `docs/lir/lir_2026-10-10_stale_m1_edge_f1.md`, from your draft §7.4. If writing it shows that another CLAUDE.md §3.2 file must change, stop with `Outcome: question`.
- **Tests.** The new fake-barrel test of the hook you describe, red before the fix and green after. Then a mutation bench on the delete block.
- **Acceptance.** Turn the probe into acceptance checks: after R1, R2 and R3 no stale React Flow edge remains at 1 s and 5 s, the pane draws the right count (17), and the live edge keeps its handle. Run it on a dev server port of your own (not 3000). Save the JSON under `docs/discovery/assets/stale-m1-edge/` with an `-after` suffix next to the existing ones.
- **Control.** The reference-delete scenario of P-2026-09-30-1542 still behaves as that lane measured it.
- **Gates.** `npx tsc --noEmit` (baseline only), the editor-v2 and hooks suites, the full suite, `npm run build`.
- **Commits.** Explicit pathspec and the `Model:` trailer: `docs(lir)` first, then `fix(sync)` with the test, then `chore(probe)` for the acceptance checks, then `docs` for the measurements and the inbox entry. Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

## NON FARE

- No edit to `useJjomSync.ts`, `sync/m1EdgeGate.ts` or `m1EdgeSweep.ts`. No F3.
- No migration, no VersionFixer, no `edgesIn`/`edgesOut` scrub.
- No `git stash`, no `git add .`, no push. Do not touch the `Status` line.

## HARD STOP

After the commits, with green gates and the measurements saved, stop with `Outcome: hard-stop`.
