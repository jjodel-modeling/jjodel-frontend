# IR view panel S0: stop two silent data losses (literal segment style, graphVertex corner radius)

Prompt-ID: P-2026-11-11-2025
Chat: C-2026-11-11-1925
Front: maintenance
Lane: fast (two UI defects found and read by P-2026-11-11-1925, slice S0 of its report §6, ratified as R-IPC-7; outside the critical zone)
Depends: P-2026-11-11-1925
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R2kJaz9XevLeJNUgpJ

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt states an exception).

Worktree: `~/jjodel-w-ips0`, branch `ir-panel-s0`, HEAD at the commit that adds this prompt. Before anything else: `pwd`
is that worktree, `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with
`Outcome: blocked`. Model and tier as pinned.

## Lane discipline

Every reply, including interim ones, opens with `[P-2026-11-11-2025 · session <id>]`; the final message ends with
`Outcome: done | hard-stop | question | blocked`; one `Recommended:` line per question. Gates through
`node scripts/run-quiet.mjs`, in the foreground. Closing log entry to `docs/log-inbox/maintenance.md` (skill
`log-entry`); flip `Status:` in this file in the same docs-only commit.

Rules for this lane: no subagents and no background tasks; one probe run per call; `git add <specific files>` only,
never `git add .`; commit as soon as the gates are green; all code, comments, UI strings, commit messages and docs in
English. Read `CLAUDE.md` first. Read only the files you change and the lines named here; reread them, the line numbers
were read at `bb7821a10`.

## COSA (what)

The coverage audit `docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md` found two controls in the view
properties panel that destroy a value already saved in the IR, without any user action on that value:

1. **Literal segment style.** `FieldSegmentEditor.tsx:64` rebuilds the segment on every text edit as
   `onChange({ kind: 'literal', text: e.target.value })`, so a persisted `literal.style` (R-VP-20, `irTypes.ts:162-164`)
   is dropped the moment the user types one character.
2. **graphVertex corner radius (report row G-14).** `GraphVertexAuthoringPanel.tsx:325-333` offers a constant-only
   `NumberInput` for `shape.cornerRadius`, which is a `Conditional<number>` (R-IRN-35). The reader
   (`IR/shapeRegistry.ts:467-468`) returns `undefined` for a non-number, so a persisted conditional radius displays as
   «default» and the first edit overwrites it with a constant. The writer is `graphVertexAuthoring.ts:321`, reset
   `withoutCornerRadius` at `:326`.

Goal: neither control may change a key the user did not edit.

## DOVE (where)

- `frontend/src/components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/GraphVertexAuthoringPanel.tsx`
- only if strictly needed: `frontend/src/components/editor-v2/viewpoint/authoring/graphVertexAuthoring.ts`. Lane
  P-2026-11-11-1110 (another chat, worktree `~/jjodel-w-gvframe`) edits this file for `containment.layout.frame`: if you
  must touch it, keep the hunk to the corner radius writer and say so in the report.
- tests beside the existing ones in `authoring/__tests__/`.

Out of scope: `shapeRegistry.ts` and every reader or renderer, `irValidate`, VersionFixer, the critical zone, every
other row of the audit (S1 and later).

## COME (how)

### Steps

1. **Literal style.** On a text edit, spread the current segment and replace only `text`
   (`{ ...segment, text: e.target.value }`), so `style` and any other key survive. Same treatment for any sibling
   handler in the same file that rebuilds a literal segment from scratch: list each one you change.
2. **Corner radius.** Replace the constant-only `NumberInput` with the `ConditionalEditor` mount used for the vertex
   corner radius in the Symbol Editor (grep the vertex mount of `cornerRadius` with `rulesTable`; reuse it, do not build
   a new control). It must show a persisted `Conditional<number>` as what it is, edit constant, when/then/else and rules,
   and write through the existing writer. Absent stays absent (no override, R-IRN-35). If reusing that mount needs a
   change to an exported interface or to `ConditionalEditor` itself, stop with `Outcome: question` and a
   `Recommended:` line.
3. **Tests.** (a) A literal segment with a persisted `style` keeps it, deep-equal, after a text change. (b) The
   graphVertex panel rendered on an IR whose `shape.cornerRadius` is a conditional writes nothing on mount and shows a
   conditional, not «default». (c) Editing the constant of a constant radius still writes a number. (d) Reset still
   removes the key. Negative control: run (a) once against the old line and record that it fails, then restore.
4. Gates: typecheck, the authoring tests, the full unit suite, through `run-quiet.mjs`. Commit code and tests
   (`fix(authoring): keep persisted literal style and conditional corner radius (P-2026-11-11-2025)`), then the
   docs-only commit with the log entry and the Status flip.

### Visual check

One probe run, if the smoke harness already has a scene with a graphVertex view; otherwise skip it and say so. Crop the
Structure tab row of the corner radius with a conditional value, save it in the lane folder, name the path in the
report. The project chat runs the RC-23 check from the crop.

## RIFERIMENTI

`docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md` (§1.1 row V-53 note, §1.2 row G-14, §6 S0),
`docs/decisions.md` R-IPC-7, R-IRN-35, R-VP-20.

P-2026-11-11-2025
