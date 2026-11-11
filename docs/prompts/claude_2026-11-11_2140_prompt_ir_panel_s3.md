# IR view panel S3: edge label, label placement, persist waypoints, expression caption, with their validator checks

Prompt-ID: P-2026-11-11-2140
Chat: C-2026-11-11-1925
Front: maintenance
Lane: fast (missing controls listed by P-2026-11-11-1925, slice S3 of its report §6, R-IPC-11; UI plus three `irValidate` checks; outside the critical zone)
Depends: P-2026-11-11-2120
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R2kJaz9XevLeJNUgpJ

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt states an exception).

Worktree: `~/jjodel-w-ips3`, branch `ir-panel-s3`, HEAD at the commit that adds this prompt. Before anything else:
`pwd` is that worktree, `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with
`Outcome: blocked`. Model and tier as pinned.

## Lane discipline

Every reply, including interim ones, opens with `[P-2026-11-11-2140 · session <id>]`; the final message ends with
`Outcome: done | hard-stop | question | blocked`; one `Recommended:` line per question. Gates through
`node scripts/run-quiet.mjs`, in the foreground. Closing log entry to `docs/log-inbox/maintenance.md` (skill
`log-entry`); flip `Status:` in this file in the same docs-only commit. Commit subjects at most 72 characters.

Rules for this lane: no subagents and no background tasks; one probe run per call; `git add <specific files>` only,
never `git add .`; commit as soon as the gates are green; all code, comments, UI strings, commit messages and docs in
English. Read `CLAUDE.md` first. Read only the files you change and the lines a step names.

## COSA (what)

The coverage audit `docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md` lists four IR keys the view panel
cannot author. Three of them are also unchecked by `irValidate`: it has no unknown-key whitelist, so a key it does not
name is accepted with any value (report §6). This lane adds the four controls and the three checks.

- **E-10** edge view `label`, string (edge spec :60): a text field in the edge panel, in the style of the vertex view
  label.
- **E-21** `edge.labels.placement`, enum of three literals (edge spec :140): a SegmentedControl or Select in the labels
  section. Today `EdgeAuthoringPanel.tsx:512` keeps it untouched («`placement` (not authored here) survives»).
- **E-26** `edge.persistWaypoints`, boolean (edge spec): a Toggle in the routing or line section. Today
  `EdgeAuthoringPanel.tsx:158` round-trips it verbatim.
- **Caption** of the expression text source, `{ from: 'expression'; slot: string; caption?: string }`
  (`irTypes.ts:102`): an optional text field in `TextSourceEditor.tsx` beside the slot control (TSE:77-84). Every
  mount of `TextSourceEditor` gets it.

Validator: add checks for `placement` (one of the three literals), `caption` (string) and `persistWaypoints` (boolean)
in `irValidate.ts`, next to the checks of their sibling keys and with the same severity.

## DOVE (where)

- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/TextSourceEditor.tsx`
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` (find the file with grep: the report cites it as
  `IR/irValidate.ts`)
- tests in `authoring/__tests__/` and beside the existing `irValidate` tests

Out of scope: `irTypes.ts`, VersionFixer, readers and renderers, the critical zone, every other row of the audit.

## COME (how)

### Steps

1. **Validator first, read-only check.** Read how `irValidate` reports a bad value of a sibling key (for example
   `labels.center` or `curve`): warning, error that rejects the key, or error that rejects the whole view (the FormSpec
   addendum has such a rule for `op`). If the sibling severity would make a saved view with a bad `placement`, `caption`
   or `persistWaypoints` stop rendering, stop with `Outcome: question` and one `Recommended:` line before writing code:
   a new check must never take a working saved view off the canvas.
2. Add the three checks with the sibling severity and message style. Tests: a valid value passes, an invalid value is
   reported, an absent key passes.
3. Add the four controls in the style of their neighbours. Absent stays absent until the user sets a value; reset
   removes the key; a write spreads and replaces one key (R-IPC-7).
4. Tests for each control: set, change, reset, other keys untouched. Negative control: break one write, see the test
   fail, restore.
5. Gates: typecheck, authoring and ir tests, full unit suite, build. Commit code and tests, then the docs-only commit
   with the log entry and the Status flip.

### Visual check

One probe run if the smoke harness has a scene with an IR edge view; otherwise skip it and say so. Alfonso's visual GO
on localhost:3000 follows the merge.

## RIFERIMENTI

`docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md` (§1.3 rows E-10, E-21, E-26, §1.1 row V-27 note on
`caption`, §6 S3), `docs/decisions.md` R-IPC-1..11, `docs/spec/claude_spec_2026-07-26_ir_edge_authoring_addendum.md`.

P-2026-11-11-2140
