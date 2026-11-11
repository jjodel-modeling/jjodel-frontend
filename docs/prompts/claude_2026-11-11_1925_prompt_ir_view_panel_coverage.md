# IR coverage audit of the view properties panel (discovery only)

Prompt-ID: P-2026-11-11-1925
Chat: C-2026-11-11-1925
Front: maintenance
Lane: full (discovery only, hard stop at the end; no Phase 2 in this prompt; outside the critical zone, read-only)
Depends: none
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R2kJaz9XevLeJNUgpJ

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt states an exception).

Worktree: `~/jjodel-w-irpanel`, branch `ir-panel-coverage`, HEAD at the commit that adds this prompt. Before anything
else: `pwd` is that worktree, `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop
with `Outcome: blocked`. Model and tier as pinned, effort `xhigh`.

## Lane discipline

Every reply, including interim ones, opens with `[P-2026-11-11-1925 · session <id>]`; the final message ends with
`Outcome: done | hard-stop | question | blocked`; one `Recommended:` line per question. Gates, if any, through
`node scripts/run-quiet.mjs`, in the foreground. The discovery report goes through the skill `discovery-report`; the
closing log entry to `docs/log-inbox/maintenance.md` (skill `log-entry`). On close, flip `Status:` in this file
in the same docs-only commit as the log entry.

Rules for this lane: read-only on code (no edit outside `docs/`); no subagents and no background tasks; one probe run
per call; `git add <specific files>` only, never `git add .`; commit as soon as the report is written. All text in
English. Read `CLAUDE.md` first.

## COSA (what)

Alfonso wants to know whether every entry of the IR is reachable from the properties panel of a view. The question is
coverage: for each field a view can carry in its IR, does the panel offer a control that reads and writes it, or can
the user only reach it through the read-only Source tab (or not at all)?

The panel in scope is the one opened by selecting a view in the viewpoint tree in EditorV2 (its tabs, such as
Structure, Symbol, Form, Source: grep `irTabs.tsx` and the `*AuthoringPanel.tsx` files under
`frontend/src/components/editor-v2/viewpoint/authoring/`), together with the editors it opens (Symbol Editor modal,
TextStyle field popover, list editors). Anything reachable only from the canvas is not the panel: list it apart.

## DOVE (where)

The normative sources, in this order (if they disagree, report the disagreement, do not resolve it):

1. `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` (ViewpointIR v1.2, vigente).
2. Addenda, all vigenti: `claude_spec_2026-07-25_ir_row_dispatch_addendum.md`,
   `claude_spec_2026-07-26_ir_edge_authoring_addendum.md`, `claude_spec_2026-07-27_ir_textstyle_addendum.md`,
   `claude_spec_2026-08-28_ir_formspec_addendum.md`, `claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md`.
3. `docs/decisions.md`: R-IRN, R-GV, R-FRM and similar rows that add or change IR fields (for example `cornerRadius`
   as `Conditional<number>`, per-axis `borderColor`, `containment.layout.frame`).
4. The code ground truth: `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` and `irValidate`. A field in
   `irTypes.ts` that no spec mentions is drift: list it, with its kind.

The panel side: `frontend/src/components/editor-v2/viewpoint/authoring/` (panels, sections, editors, writers such as
`graphVertexAuthoring.ts`, `borderOverrides.ts`, `committableMatching.ts`).

Out of scope: the renderer, the interpreter, `useJjomSync.ts`, `portDistribution.ts` and every critical-zone file.
Known parallel work: lane P-2026-11-11-1110 (another chat, worktree `~/jjodel-w-gvframe`) adds a «Frame» control for
`containment.layout.frame`; record that field as «in progress in P-2026-11-11-1110», do not audit its branch.

## Fase 1: discovery (read-only, hard stop)

Save the report as `docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md` (add `_2` if the name exists). The
hard stop is not complete until the report is written and committed (`git add` of that file only).

Method. Build the field inventory from the sources above: one row per IR path, for each view kind (vertex,
graphVertex, row, edge), with its type (plain, `Conditional<T>`, `PathExpr`, `Predicate`, `TextStyle`, list, enum)
and the spec section that defines it. Then, for each row, find the panel control: grep the key in the authoring code,
follow it to the writer, and record file:line of both the control and the write. A key that only appears in a reader
is not covered. For every search that finds nothing, show a positive control: the same search pattern finding a key
known to be covered (for example `padding` or `header`), so an absent hit is not a broken grep.

Classify each row with exactly one of:

- `covered`: a control reads and writes the full type.
- `partial`: a control exists but does not reach the full type (a `Conditional<T>` settable only as a constant, an
  enum missing literals, a list without reorder or remove, a `PathExpr` limited to one step). Say what is missing.
- `missing`: no control; reachable only through Source or not at all.
- `out of scope by decision`: a ratified decision keeps it out of the panel (FormSpec authoring is Slice 2, outside
  its addendum). Cite the decision.
- `viewpoint-level`: the field lives on the viewpoint, not the view (Interaction §6, part of Editability §5). List
  these in their own table; they do not count as gaps of the view panel.
- `in progress`: covered by an open lane (P-2026-11-11-1110).

The report must contain:

1. The inventory and the classification, one table per view kind, columns: IR path, type, source (spec § or R-),
   class, control (file:line), writer (file:line), note.
2. The viewpoint-level table.
3. The drift list: fields in `irTypes.ts` not in any spec, and spec fields absent from `irTypes.ts`.
4. Controls in the panel that write something not in the IR (orphans), if any.
5. Totals per kind and class.
6. A proposed grouping of the `missing` and `partial` rows into Phase 2 slices, ordered by user value and by risk
   (which touch `irValidate`, VersionFixer or migration, which are UI only). Recommendation only: no code.
7. Decisions taken (unattended) and Decisions awaiting Alfonso.

Then stop with `Outcome: hard-stop`. No Phase 2 runs from this prompt: the project chat writes a separate prompt from
the report.

P-2026-11-11-1925
