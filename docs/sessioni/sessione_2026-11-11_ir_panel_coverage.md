# Session 2026-11-11: IR coverage of the view properties panel (chat C-2026-11-11-1925)

Front `maintenance`, run in /lane auto from 19:16 to 22:00 (Rome).

## State

- Audit P-2026-11-11-1925 (`docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md`, three sessions because of
  the context ceiling): 157 IR paths over vertex, graphVertex, edge and row; 82 covered, 38 partial, 21 missing, 15 out
  of scope, 1 in progress. Two data losses found (literal segment style, graphVertex conditional `cornerRadius`).
- R-IPC-1..11 in `docs/decisions.md` (6c77a7bce), ratified by Alfonso at 20:15.
- On the trunk, each with a `pre-ir-panel-*` rollback tag and its lane closed: S0 data losses (fix 999ea5d5a, merge
  919c9e2e0); S1a vertex (043b9cc02, merge 6ab5d35bb); S1b edge (5d9cc9ea6); S1c TextStyleEditor (f4c06dcc2); S2 rules
  table on the remaining Conditionals (941649249); S3 edge view label, placement, persistWaypoints, caption and three
  `irValidate` checks (16639fa43, merge 7397be79f).
- Worktrees to retire: `~/jjodel-w-irpanel`, `~/jjodel-w-ips0`, `~/jjodel-w-ips1a`, `~/jjodel-w-ips1b`,
  `~/jjodel-w-ips1c`, `~/jjodel-w-ips2`, `~/jjodel-w-ips3`, with their branches.

## Visual GO owed (localhost:3000)

1. graphVertex, Appearance tab: a conditional radius shows the chip in Basic and the rules table in Advanced.
2. Vertex: rows visible, entry, bar thickness; compartment exclude list; style on the literal segment.
3. Edge: curve, label template and style; General section with the view label; placement; «Save the layout».
4. TextStyle popover: letter spacing and case rows; rules table on the conditional axes in Advanced.
5. Rules table in Advanced on label, badge and compartment visible, badge icon, graphVertex visible, edge line and ends;
   row visible can be added when absent.
6. Caption field on expression text sources.

## Open

1. S4 (graphVertex parity with vertex, `separator`, then `frame`) waits for P-2026-11-11-1110 (another chat).
2. S5, decision-gated: graphVertex and edge `form` and where `form` lives (R-IPC-3, R-IPC-4), edge `exclusive`,
   `marked` and multi-hop PathBuilder (slice M2), `collapsed.*` Conditionals, widget-object `editable`.
3. Erratum to v1.2 §3-§4 for the v1.1 keys absent from code (R-IPC-8): not written.
4. Harness ticket #856: the handoff seal refuses suffixed section headings.

## Lessons

- A 157-path audit fits one lane only with continuations: the ceiling came after 5 and 10 minutes.
- Splitting S1 into three parallel lanes on disjoint files closed each in about 10 minutes; load peaked at 29 during the
  three builds.
- Prompt-ID 2110 was taken by another chat's lane within the minute; renumbered 2120 before the commit.
- No smoke scene opens the authoring panels: every visual GO of this front stays with Alfonso.
