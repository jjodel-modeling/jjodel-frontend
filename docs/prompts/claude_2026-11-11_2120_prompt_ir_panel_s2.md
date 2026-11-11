# IR view panel S2: rules table on every remaining Conditional control

Prompt-ID: P-2026-11-11-2120
Chat: C-2026-11-11-1925
Front: maintenance
Lane: fast (missing controls listed by P-2026-11-11-1925, slice S2 of its report §6, R-IPC-11; UI only, the shared `ConditionalEditor` already supports `rulesTable`; outside the critical zone)
Depends: P-2026-11-11-2035, P-2026-11-11-2036, P-2026-11-11-2037
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R2kJaz9XevLeJNUgpJ

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt states an exception).

Worktree: `~/jjodel-w-ips2`, branch `ir-panel-s2`, HEAD at the commit that adds this prompt. Before anything else:
`pwd` is that worktree, `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with
`Outcome: blocked`. Model and tier as pinned.

## Lane discipline

Every reply, including interim ones, opens with `[P-2026-11-11-2120 · session <id>]`; the final message ends with
`Outcome: done | hard-stop | question | blocked`; one `Recommended:` line per question. Gates through
`node scripts/run-quiet.mjs`, in the foreground. Closing log entry to `docs/log-inbox/maintenance.md` (skill
`log-entry`); flip `Status:` in this file in the same docs-only commit. Commit subjects at most 72 characters.

Rules for this lane: no subagents and no background tasks; one probe run per call; `git add <specific files>` only,
never `git add .`; commit as soon as the gates are green; all code, comments, UI strings, commit messages and docs in
English. Read `CLAUDE.md` first. Read only the files you change and the lines a step names.

## COSA (what)

The coverage audit `docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md` (§1.0) found that a
`ConditionalEditor` (CE) mounted without `rulesTable` lets the user edit a constant and when/then/else, but shows a saved
multi-rule value as a read-only chip («conditional (multiple rules, not yet editable)», CE:93-96). Some mounts already
pass `rulesTable` (vertex `shape.form`, `cornerRadius`, `marker`; graphVertex `shape.form`, `fill`, border axes); the
rows below do not, so they are `partial`. This lane passes `rulesTable` on each of them, exactly as the covered mounts do.

- V-28 / G-30 `labels[].visible`: `LabelEntryEditor.tsx:199-208`.
- V-32 `badges[].icon` and V-34 `badges[].visible`: `BadgeListEditor.tsx:65-78`, `:92-100`.
- V-56 field compartment `visible`: `FieldCompartmentListEditor.tsx:288-296` (S1a added rows to this file: reread it).
- X3 the six Conditional axes of `TextStyle`: `TextStyleEditor.tsx:131-139` (S1c added two scalar rows: reread it).
- G-12 graphVertex `visible`: `GraphVertexAuthoringPanel.tsx:434-443`.
- E-13..15 `edge.line.{color,width,style}`: `EdgeAuthoringPanel.tsx:808-846`; E-16..17 `edge.terminations.{sourceEnd,
  targetEnd}` through `renderEnd` (`:535-551`, mounts `:870`, `:874`). S1b added rows to this file: reread it.
- R-10 row `visible`: `RowAuthoringPanel.tsx:427-440` shows the control only when the key is already present. Pass
  `rulesTable` and also offer it when absent (add-from-absent, the same affordance the vertex panel uses for its
  optional Conditional rows); absent stays absent until the user sets it.

Line numbers were read at `bb7821a10`; the files changed since. Reread before editing.

## DOVE (where)

- `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/BadgeListEditor.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/TextStyleEditor.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/GraphVertexAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx`
- tests in `authoring/__tests__/`

`GraphVertexAuthoringPanel.tsx` is near the Containment section that lane P-2026-11-11-1110 (another chat) edits in
`ContainmentSection.tsx` and `graphVertexAuthoring.ts`: do not touch those two files.

Out of scope: `ConditionalEditor` itself and `RulesModeEditor`, `irTypes.ts`, `irValidate`, VersionFixer, readers and
renderers, the critical zone, every other row of the audit.

## COME (how)

### Steps

1. Grep one covered mount (vertex `cornerRadius` with `rulesTable` in `VertexAuthoringPanel.tsx`) and copy how it
   passes `rulesTable` and whatever context the rules table needs (metaclass, feature candidates). Apply the same to
   every row above. Build no new component and change no shared one.
2. If a mount cannot get the context the rules table needs without an exported interface change, leave that one mount
   as it is, list it in the report with the reason, and go on with the others. Stop with `Outcome: question` only if
   more than two mounts are in that state.
3. In Basic mode the existing «conditional (edit in Advanced mode)» chip stays: this is disclosure, not a gap.
4. Tests: for each mount, a saved `rules` value renders the rules editor in Advanced (not the read-only chip), an edit
   of one rule writes the normal form through the existing writer, and every other key of the IR is unchanged. For R-10,
   add from absent writes the key, reset removes it. Negative control: drop `rulesTable` from one mount, see its test
   fail, restore.
5. Gates: typecheck, authoring tests, full unit suite, build. Commit code and tests, then the docs-only commit with the
   log entry and the Status flip.

### Visual check

One probe run if the smoke harness has a scene that opens one of these editors; otherwise skip it and say so. Alfonso's
visual GO on localhost:3000 follows the merge.

## RIFERIMENTI

`docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md` (§1.0, §1 rows above, §6 S2), `docs/decisions.md`
R-IPC-1..11, R-IRN-35 (normal form of `Conditional`).

P-2026-11-11-2120
