# IR view panel S4b: graphVertex partition separator

Prompt-ID: P-2026-11-11-2316
Chat: C-2026-11-11-1925
Front: maintenance
Lane: fast (missing controls listed by P-2026-11-11-1925, slice S4 of its report §6, R-IPC-11; UI only, `irValidate` already names every key; outside the critical zone)
Depends: P-2026-11-11-2140, P-2026-11-11-1110
Status: eseguito 2026-11-11 · lane fast · ad99a39c0 · gates green (typecheck 0, build, unit 16200 passed, 3 known import failures) · visual check skipped (no smoke scene with a graphVertex view) · log entry in docs/log-inbox/maintenance.md
Request: https://claude.ai/code/session_01DQt9R2kJaz9XevLeJNUgpJ

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt states an exception).

Worktree: `~/jjodel-w-ips4b`, branch `ir-panel-s4b`, HEAD at the commit that adds this prompt. Before anything else:
`pwd` is that worktree, `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with
`Outcome: blocked`. Model and tier as pinned.

## Lane discipline

Every reply, including interim ones, opens with `[P-2026-11-11-2316 · session <id>]`; the final message ends with
`Outcome: done | hard-stop | question | blocked`; one `Recommended:` line per question. Gates through
`node scripts/run-quiet.mjs`, in the foreground. Closing log entry to `docs/log-inbox/maintenance.md` (skill
`log-entry`); flip `Status:` in this file in the same docs-only commit. Commit subjects at most 72 characters.

Rules for this lane: no subagents and no background tasks; one probe run per call; `git add <specific files>` only,
never `git add .`; commit as soon as the gates are green; all code, comments, UI strings, commit messages and docs in
English. Read `CLAUDE.md` first. Read only the files you change and the lines a step names. One sibling lane runs in
parallel on disjoint files (P-2026-11-11-2315 on `GraphVertexAuthoringPanel.tsx`): do not touch their files.

## COSA (what)

The coverage audit `docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md` lists IR keys of the graphVertex
view that its panel cannot author, although the vertex panel already authors the same keys. This lane brings the
graphVertex panel to parity for the rows below. Every key is already typed in `irTypes.ts` and checked by `irValidate`,
so the work is UI only.

- **G-44** `containment.layout.separator` (PartitionSeparator, graphVertex containment addendum): a control in the
  Containment section, visible only when Layout = Partitions, in the style of the «Frame» row that P-2026-11-11-1110
  added for Free (mirror that pattern: what happens to the key when the layout mode changes must match `frame`).

## DOVE (where)

- `frontend/src/components/editor-v2/viewpoint/authoring/ContainmentSection.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/graphVertexAuthoring.ts` (only the writer for `separator`)
- tests in `authoring/__tests__/`

Do not edit `GraphVertexAuthoringPanel.tsx` (the sibling lane owns it).

Out of scope: `irTypes.ts`, `irValidate`, VersionFixer, readers and renderers, `ConditionalEditor` and every shared
editor component, the critical zone, every other row of the audit.

## COME (how)

### Steps

1. Read how the «Frame» row of P-2026-11-11-1110 authors `frame`, and do the same for `separator`; reread the type in `irTypes.ts` and the existing controls of the same section, then add the control
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

`docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md` (§1, §6 S4, §8 for the absence searches),
`docs/decisions.md` R-IPC-1..11, graphVertex containment addendum, R-GV-15.

P-2026-11-11-2316
