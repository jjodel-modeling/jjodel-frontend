# IR view panel S1a: vertex controls for visible, entry, bar thickness, compartment exclude, literal style

Prompt-ID: P-2026-11-11-2035
Chat: C-2026-11-11-1925
Front: maintenance
Lane: fast (missing controls listed by P-2026-11-11-1925, slice S1 of its report §6, R-IPC-11; UI only, `irValidate` already names every key; outside the critical zone)
Depends: P-2026-11-11-2025
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R2kJaz9XevLeJNUgpJ

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt states an exception).

Worktree: `~/jjodel-w-ips1a`, branch `ir-panel-s1a`, HEAD at the commit that adds this prompt. Before anything else:
`pwd` is that worktree, `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with
`Outcome: blocked`. Model and tier as pinned.

## Lane discipline

Every reply, including interim ones, opens with `[P-2026-11-11-2035 · session <id>]`; the final message ends with
`Outcome: done | hard-stop | question | blocked`; one `Recommended:` line per question. Gates through
`node scripts/run-quiet.mjs`, in the foreground. Closing log entry to `docs/log-inbox/maintenance.md` (skill
`log-entry`); flip `Status:` in this file in the same docs-only commit. Commit subjects at most 72 characters.

Rules for this lane: no subagents and no background tasks; one probe run per call; `git add <specific files>` only,
never `git add .`; commit as soon as the gates are green; all code, comments, UI strings, commit messages and docs in
English. Read `CLAUDE.md` first. Read only the files you change and the lines a step names. Two sibling lanes run in
parallel on disjoint files (P-2026-11-11-2036 on `EdgeAuthoringPanel.tsx`, P-2026-11-11-2037 on `TextStyleEditor.tsx`): do not touch their files.

## COSA (what)

The coverage audit `docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md` lists IR keys that the view
properties panel cannot author: the user can reach them only through the read-only Source tab. This lane adds a control
for each key below. Every key is already typed in `irTypes.ts` and already checked by `irValidate`, so the work is UI
only: no type, validator, VersionFixer or migration change.

- **V-12** `visible`, `Conditional<boolean>` (graphVertex spec §2.6): the graphVertex panel already has it
  (`GraphVertexAuthoringPanel.tsx:434-443`); mount the same control in the vertex panel.
- **V-21** `shape.entry`, `EntryMark` (R-VP-22): a control in the shape section, literals from `irTypes.ts`.
- **V-22** `shape.barThickness`, number (R-VP-57): a number control in the shape section, shown only for shapes that
  use it if the type or R-VP-57 says so; otherwise always.
- **V-48** field compartment `source.exclude`, `string[]` (R-VP-20): a list of feature names in the compartment editor.
  Also stop `withCompartmentSource` (`FieldCompartmentListEditor.tsx:45-49`) dropping `exclude` when the source changes.
- **V-53** literal segment `style`, `TextStyle` (R-VP-20, `irTypes.ts:164`): mount `TextStyleField` on the literal
  segment, as the other segment kinds do if they have one.

## DOVE (where)

- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx` (S0 changed its text handler: keep it)
- tests in `authoring/__tests__/`

Out of scope: `irTypes.ts`, `irValidate`, VersionFixer, readers and renderers, `ConditionalEditor` and every shared
editor component not listed above, the critical zone, every other row of the audit.

## COME (how)

### Steps

1. For each row, reread the type in `irTypes.ts` and the existing controls of the same section, then add the control
   in the style of its neighbours (same row layout, same Basic/Advanced placement, labels in sentence case). Reuse the
   shared controls already used in the file (Select, SegmentedControl, NumberInput, Toggle, `ConditionalEditor` with
   `rulesTable`, `TextStyleField`, `TextSourceEditor`, list editors); build no new primitive.
2. Writes: absent stays absent until the user sets a value; a reset removes the key; a write never rebuilds a sibling
   object from scratch (spread, replace one key). This is the S0 lesson (R-IPC-7).
3. If a control needs an exported interface change, a new shared component, or a change to `irTypes.ts`, stop with
   `Outcome: question` and one `Recommended:` line.
4. Tests beside the existing ones in `authoring/__tests__/`: for every key, set, change, reset, and «other keys
   untouched» (deep-equal of the rest of the IR). One negative control: break one write on purpose, see the test fail,
   restore.
5. Gates: typecheck, authoring tests, full unit suite, build. Commit code and tests, then the docs-only commit with the
   log entry and the Status flip.

### Visual check

One probe run if the smoke harness has a scene with the right view kind; otherwise skip it and say so. If you take
crops, save them in the lane folder and name the paths. Alfonso's visual GO on localhost:3000 follows the merge.

## RIFERIMENTI

`docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md` (§1, §6 S1, §8 for the absence searches),
`docs/decisions.md` R-IPC-1..11, R-VP-20, R-VP-22, R-VP-57.

P-2026-11-11-2035
