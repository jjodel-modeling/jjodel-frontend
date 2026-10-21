# graphVertex F2 and F3, Phase 2 (continuation of P-2026-10-21-1926 after the context ceiling)

Prompt-ID: P-2026-10-21-1950
Chat: C-2026-10-20-0003
Front: graphvertex
Lane: full (reducer.ts core, EditorV2.tsx, PalettePanel.tsx, two new modules, tests, probe)
Status: da eseguire
Request: https://claude.ai/code/session_01Mk7LmH7N6YcSQiKx7oNZP5 (Alfonso, 2026-10-21 19:15: «ok alle raccomandazioni procedi in modalita lane auto»)
Corregge: —
Depends: P-2026-10-21-1926
Autonomy: continuation
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Worktree: `~/jjodel-w-gvf2`, branch `gv-f2-f3` (Phase 1 at 249225d5f plus the commit that adds this prompt). Before anything else: `pwd`, branch, `git log -1` and a clean `git status --short`; otherwise stop with `Outcome: blocked`.
Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-21-1950 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`. Read every file above 500 lines with `offset`/`limit` or `rg`, never whole. If you approach the context ceiling again, write `~/.jjodel-lanes/P-2026-10-21-1950/handoff.md` and stop with `Outcome: hard-stop`.

## Start here

Read `~/.jjodel-lanes/P-2026-10-21-1926/handoff.md` (scope of the GO, decisions, line references, the checks in order) and §§ F2, F3 of `docs/discovery/discovery_2026-10-21_gv_f2_readonly_views_f3_palette_click.md`. Do not redo the reading those files record.

## COSA (the GO of P-2026-10-21-1926, unchanged)

1. Tests first, red: the F2 filter (pure module `frontend/src/common/defaultViewsRegistry.ts` or the name the handoff records) and `canvasCentre.ts`; mutation check on the F2 filter. Extend the probe `frontend/scripts/probe/gv-f2-f3.ts` for the before/after gates (scope expansion accepted by the chat; say so in the entry).
2. `fix(F2)`: `reducer.ts` 1111-1117 registers only ids starting with `Pointer_View`, through the pure module. `feat(F3)`: `createFromPalette(type, metaclassId, point)` from the drop handler body in `EditorV2.tsx`; a click (and Enter/Space) in `PalettePanel.tsx` calls it with the canvas centre in flow coordinates; no snap (the drop does not snap); no offset on repeated clicks.
3. File as a ticket in `docs/log-inbox/graphvertex.md` (not implemented): projects missing `Pointer_ViewPointDefault` get it back.
4. Gates: typecheck at baseline (CLAUDE.md §17), vitest on the touched areas and every test importing `reducer.ts`, `EditorV2.tsx` or `PalettePanel.tsx`, `npm run build`, `npm run smoke`; the probe before/after: F2 user views editable after an open and built-in views still read-only, also on the four MODELS demo fixtures (read-only check); F3 one click creates one element at the canvas centre, inside its container when the centre falls in one (BPMN lane scene).
5. Commits by path: test, `fix(F2)`, `feat(F3)`, each with trailer `Model:` (P6).
6. Start a dev server on port 3023 from this worktree (detached, PID in `~/.jjodel-lanes/P-2026-10-21-1950/dev.pid`), save crops under `~/.jjodel-lanes/P-2026-10-21-1950/crops/` (a reopened project with its user view editable; the palette before and after a click on one item, Basic and Advanced), write the log entry and the `Status:` flips of P-2026-10-21-1926 and of this prompt uncommitted (RC-17), and stop with `Outcome: hard-stop` for the visual check. On the GO: one docs commit, stop the dev server, `check:docs`, `Outcome: done`.

## DOVE

`frontend/src/redux/reducer/reducer.ts` (lines 1111-1117 only), the new F2 module and its test, `frontend/src/components/editor-v2/EditorV2.tsx` (drop handler and the new function), `PalettePanel.tsx`, `canvasCentre.ts` and its test, `frontend/scripts/probe/gv-f2-f3.ts`, `docs/log-inbox/graphvertex.md`, the two prompts. Verify the exact paths in the handoff.

## NON FARE

No critical-zone file (`useJjomSync.ts`, `canvasToJjom.ts`, `portDistribution.ts`): if one is needed, stop with `question`. No change to persisted data. The classic editor stays out. No dev server on 3000, 3001 or 3003. No push, no merge.

## RIFERIMENTI

The handoff and the report above; R-IRN-15 and R-GV rows in `docs/decisions.md`; CLAUDE.md.
