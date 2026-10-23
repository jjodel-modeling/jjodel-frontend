# graphVertex F2 (read-only views after a page load) and F3 (palette click), discovery

Prompt-ID: P-2026-10-21-1926
Chat: C-2026-10-20-0003
Front: graphvertex
Lane: full (Phase 1 read-only; F2 lands in core, reducer)
Status: da eseguire
Request: https://claude.ai/code/session_01Mk7LmH7N6YcSQiKx7oNZP5 (Alfonso, 2026-10-21 19:15: «ok alle raccomandazioni procedi in modalita lane auto»: F2 discovery lane, F3 click creates at the centre of the view)
Corregge: —
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Worktree: `~/jjodel-w-gvf2`, branch `gv-f2-f3`, created by the chat from the trunk; the commit that adds this prompt is on the branch. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.
Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-21-1926 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. Node: `~/.local/bin/node`. Read every file above 500 lines with `offset`/`limit` or `rg`, never whole. Phase 1 is read-only except the probe and the report.

## Context (from the 2026-10-11 session, re-measure: the trunk has moved about 1400 commits)

`docs/sessioni/sessione_2026-10-11_C-2026-10-10-0057.md`, items F2 and F3:
- F2 (high): after a page reload `Pointer_ViewPointDefault` is missing, the guard at `reducer.ts:1110` never closes, and every user view counts as a built-in default (`ViewData.tsx:58`), so user views open read-only. Ticket in the new-model-instantiate log inbox.
- F3 (ratified by Alfonso 2026-10-21): a click on a palette item creates nothing today (drag only); a click must create the element at the centre of the visible view.

## COSA (Phase 1)

1. F2: reproduce on the current trunk with a probe (a project with a user view, reload, check whether the view is editable). If it no longer reproduces, say which commit fixed it (bisect not required, `git log -S` is enough) and close F2 in the report. If it reproduces, trace the cause to the line, list every reader of `Pointer_ViewPointDefault`, and propose the smallest fix with its blast radius (core file: say which tests cover it).
2. F3: find the palette click and drag handlers, how a drop computes its position, and how to get the centre of the visible viewport in flow coordinates. Propose the change (same creation path as the drop, position = viewport centre, snapped as the drop is) and its tests.
3. Report (mandatory): `docs/discovery/discovery_2026-10-21_gv_f2_readonly_views_f3_palette_click.md` with objective, files read with full paths, findings, risks, open questions. Commit it alone, then the probe alone.

## DOVE

Read anything. Write only a probe under `frontend/scripts/probe/` and the report.

## HARD STOP

At the end of Phase 1 with `Outcome: hard-stop`. Phase 2 follows on a GO from the chat.

## NON FARE

No source change in Phase 1. No dev server on 3000, 3001 or 3003. No push, no merge.

## RIFERIMENTI

CLAUDE.md; R-GV rows in `docs/decisions.md`; the session file above; the new-model-instantiate inbox entry.
