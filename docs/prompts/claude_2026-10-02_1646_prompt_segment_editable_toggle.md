# Prompt: the «editable inline» toggle of a value segment reads the wrong default

Prompt-ID: P-2026-10-02-1646
Chat: C-2026-10-01-2349
Lane: fast (one authoring component, the same fix as R-IRN-38 on a sibling editor). Phase 1 short, then Phase 2 in cascade. Tier: light.
Status: da eseguire

Worktree: `~/jjodel-w-segedit`, branch `segment-editable-toggle`, created from the trunk `alfonso-frontend-jjtl` at `adb5d9731`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-segedit`, branch `segment-editable-toggle`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Found by lane P-2026-10-01-2349 (ticket «FieldSegmentEditor toggle»); Alfonso, 2026-10-02: «decidi tu». The chat decided: fix it now, the same way R-IRN-38 fixed the label toggle.

What the chat read on the trunk (verify, do not trust): `FieldSegmentEditor.tsx:52-58` draws the «editable inline» toggle of a `value` segment as `checked={valueEditable === true}` and writes `editable: c`. The runtime (`IRNodeContent.tsx:706`) treats absent as editable: `row.editableValue && seg.editable !== false`. So a seeded value segment shows OFF while it is editable inline, and ON changes nothing.

The fix, mirroring R-IRN-38 (`ir/irLabelEdit.ts`, `LabelEntryEditor.tsx`): the toggle reads `editable !== false`; OFF writes `editable: false`; ON removes the key. The widget-object variant keeps its chip. Whether the toggle should also be disabled when the row cannot be edited at all (`row.editableValue` false, for instance a reference compartment or a derived attribute) is a Phase 1 question: the authoring panel may not know the row, in which case the answer is no and the report says why.

## DOVE

Phase 1 (read-only): a short report `docs/discovery/discovery_2026-10-02_segment_editable_toggle.md`: the bug confirmed or corrected with file and line; what `forKind('value')` seeds; every caller of `FieldSegmentEditor`; the tests that pin the current toggle; whether a small predicate next to `irLabelEdit.ts` is worth it or an inline expression is enough (recommend one); questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade, unless a question has no single recommendation or the fix needs a file outside the list below: then stop with `Outcome: hard-stop`.

Phase 2: `frontend/src/components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx`, its test under `__tests__/`, and, only if Phase 1 recommends a predicate, a new small module under `viewpoint/ir/` with its test. `IRNodeContent.tsx` and `irLabelEdit.ts` are read-only. Docs: the report, one row in `docs/decisions.md`, a log entry in `docs/log-inbox/symbol-editor.md`, this prompt's Status. Anything else: stop and ask.

The decision row is **R-IRN-40** (provisional, unattended, RC-25; evidence: measured; reversible: branch). R-IRN-39 is reserved for the parallel lane P-2026-10-02-1645; do not use it.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, R-IRN-38 and `docs/discovery/discovery_2026-10-01_label_editable_toggle.md`.
2. Phase 1 report, committed.
3. Tests first, red before and green after: absent reads ON; `false` reads OFF; `true` reads ON; OFF writes `false`; ON removes the key; widget chip unchanged. Mutation bench on the read and the write; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme. A Structure view with an attributes compartment whose row format has a `value` segment: the toggle reads ON at rest and the value edits inline on the canvas; OFF, the value no longer edits inline; ON again, it edits and the IR has no `editable` key. The four demo scenes in the default viewpoint: 0 px from `adb5d9731`. Crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_segedit_crops/` (gitignored).
6. Commits: `fix:` code and tests, `docs:` report, row, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the mutation score, «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree (no `/tmp` either), a call to an AI model, renaming or removing an existing IR property or exported identifier, a VersionFixer migration, changing the default viewpoint.

## RIFERIMENTI

`FieldSegmentEditor.tsx:25-62`; `irTypes.ts:142` (`FieldSegment.value.editable`); `IRNodeContent.tsx:700-716`; R-IRN-38 and its code (`ir/irLabelEdit.ts`, `LabelEntryEditor.tsx`). Parallel lane on disjoint files: P-2026-10-02-1645 (`~/jjodel-w-labelname`, `irResolve.ts`).
