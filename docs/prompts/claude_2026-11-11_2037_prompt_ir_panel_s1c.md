# IR view panel S1c: text style controls for letter spacing and text transform

Prompt-ID: P-2026-11-11-2037
Chat: C-2026-11-11-1925
Front: maintenance
Lane: fast (missing controls listed by P-2026-11-11-1925, slice S1 of its report §6, R-IPC-11; UI only, `irValidate` already names every key; outside the critical zone)
Depends: P-2026-11-11-2025
Status: eseguito 2026-11-11 · lane fast · f4c06dcc2 · gates green (typecheck 0, build, authoring 376/376, unit 16099 passed, 3 known import failures) · visual check skipped (no smoke scene opens a TextStyle popover) · log entry in docs/log-inbox/maintenance.md
Request: https://claude.ai/code/session_01DQt9R2kJaz9XevLeJNUgpJ

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt states an exception).

Worktree: `~/jjodel-w-ips1c`, branch `ir-panel-s1c`, HEAD at the commit that adds this prompt. Before anything else:
`pwd` is that worktree, `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with
`Outcome: blocked`. Model and tier as pinned.

## Lane discipline

Every reply, including interim ones, opens with `[P-2026-11-11-2037 · session <id>]`; the final message ends with
`Outcome: done | hard-stop | question | blocked`; one `Recommended:` line per question. Gates through
`node scripts/run-quiet.mjs`, in the foreground. Closing log entry to `docs/log-inbox/maintenance.md` (skill
`log-entry`); flip `Status:` in this file in the same docs-only commit. Commit subjects at most 72 characters.

Rules for this lane: no subagents and no background tasks; one probe run per call; `git add <specific files>` only,
never `git add .`; commit as soon as the gates are green; all code, comments, UI strings, commit messages and docs in
English. Read `CLAUDE.md` first. Read only the files you change and the lines a step names. Two sibling lanes run in
parallel on disjoint files (P-2026-11-11-2035 on the vertex panel and compartment/segment editors, P-2026-11-11-2036 on `EdgeAuthoringPanel.tsx`): do not touch their files.

## COSA (what)

The coverage audit `docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md` lists IR keys that the view
properties panel cannot author: the user can reach them only through the read-only Source tab. This lane adds a control
for each key below. Every key is already typed in `irTypes.ts` and already checked by `irValidate`, so the work is UI
only: no type, validator, VersionFixer or migration change.

- **X3** `TextStyle.letterSpacing` and `TextStyle.textTransform` (TextStyle addendum): `TextStyleEditor` edits the
  other axes but has no control for these two, so every TextStyle slot in the panel is partial. Add both, in the
  editor's existing row style, with the types and literals of `irTypes.ts`. Every mount of `TextStyleField` gets them
  for free; do not edit the mounts.

## DOVE (where)

- `frontend/src/components/editor-v2/viewpoint/authoring/TextStyleEditor.tsx`
- only if it holds the axis list the editor iterates: `TextStyleField.tsx` (say so in the report)
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
`docs/decisions.md` R-IPC-1..11, TextStyle addendum (ir-1.3).

P-2026-11-11-2037
