# Prompt: a Symbol label that shows one attribute can be edited on the canvas

Prompt-ID: P-2026-10-02-1647
Chat: C-2026-10-01-2349
Lane: full (a small feature across the label predicate, the compiler and the node renderer). Phase 1, then Phase 2 in cascade.
Status: da eseguire

Worktree: `~/jjodel-w-pathlabel`, branch `path-label-edit`, created from the trunk `alfonso-frontend-jjtl` at `adb5d9731`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-pathlabel`, branch `path-label-edit`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Found by lane P-2026-10-01-2349 (ticket «single-attribute path label», estimated at about four source files); Alfonso, 2026-10-02: «ok».

Today only an intrinsic `name` / `qualifiedName` label edits on the canvas (R-IRN-38, `ir/irLabelEdit.ts`): a `path` label is drawn but never editable, and its «Editable» toggle is disabled with the hint «Only a name label can be renamed on the canvas.» This lane makes a `path` label editable when its expression is one step to a single-valued attribute of the object itself: double-click opens the same inline input the name label uses, Enter writes the attribute, Escape cancels.

Decisions taken by the chat (Phase 1 confirms or argues against with evidence):

1. **Opt-in for paths.** A path label edits only with `editable: true`; absent stays not editable, so no existing view (derived viewpoints use path labels) changes behaviour. The name label keeps «absent = editable». The per-source default lives in the R-IRN-38 predicates, so the toggle and the canvas still read one function.
2. **Scope v1:** one step, own object, single-valued attribute of a string type. Numbers and booleans only if the row value editing already parses them through a reusable function; otherwise the toggle stays disabled for them with a hint naming the reason. Multi-step paths, references, multi-valued features: disabled, hint.
3. **One write path.** The edit writes through the same mechanism the compartment rows use for an inline value (`IRNodeContent.tsx` around 764), with its undo snapshot; no new write code if that one can be reused.
4. The hint text for a path label that cannot edit says why in a few words (for example «Only a single attribute of this object can be edited on the canvas.»), and the name-label hint stays as it is when the source is literal or metaclassName.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-10-02_path_label_edit.md`: how a path expression is represented and whether «one step, own attribute» is decidable at compile time from the metamodel or only at render; the inline value write path of the rows and whether it is reusable for a label; the attribute types it supports; the tests that pin `labelCanRename` / `labelEditsName` and the disabled toggle; the derived-viewpoint labels that must not change; questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade, unless a question has no single recommendation, the write path needs `useJjomSync.ts` or another critical-zone file, or the fix needs a file outside the list below: then stop with `Outcome: hard-stop`.

Phase 2: `frontend/src/components/editor-v2/viewpoint/ir/irLabelEdit.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (the label block), `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (an optional field on `CompiledLabel` only, additive), `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (the label render and edit), `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx` (toggle and hint), their tests under `__tests__/`. Docs: the report, one row in `docs/decisions.md`, a log entry in `docs/log-inbox/symbol-editor.md`, this prompt's Status. Anything else: stop and ask.

The decision row is **R-IRN-41** (provisional, unattended, RC-25), amending R-IRN-38 on the path case only; do not edit the text of R-IRN-38 (add-only). R-IRN-39 and R-IRN-40 belong to the parallel lanes P-2026-10-02-1645 and P-2026-10-02-1646.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, R-IRN-38 and `docs/discovery/discovery_2026-10-01_label_editable_toggle.md`.
2. Phase 1 report, committed.
3. Tests first, red before and green after: the predicates over sources × {absent, true, false, widget} × {one-step string attribute, multi-step, reference, multi-valued, unsupported type}; the compiled label carries the edit target only when the predicate says so; the toggle reads and writes as decided (path: ON writes `true`, OFF removes the key); name labels unchanged. Mutation bench; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme. A user Symbol view with a path label on a string attribute: toggle OFF at rest; ON, double-click opens the input, Enter writes the attribute (the Properties panel and a compartment row showing it agree), Escape leaves it unchanged, undo restores it; a multi-step path label: toggle disabled with its hint. A name label behaves exactly as on the trunk. The four demo scenes and the derived viewpoints of DemoFlowB: 0 px and no new editable label from `adb5d9731`. Crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_pathlabel_crops/` (gitignored).
6. Commits: `feat:` code and tests, `docs:` report, row, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the mutation score, «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree (no `/tmp` either), a call to an AI model, an edit to a critical-zone file, renaming or removing an existing IR property or exported identifier, a VersionFixer migration, changing the default viewpoint or a derived viewpoint's output.

## RIFERIMENTI

R-IRN-38; `ir/irLabelEdit.ts`; `irCompile.ts:455-480`; `IRNodeContent.tsx:605-645` (label edit) and `:700-780` (row value edit); `irTypes.ts:80-125` (`TextSource`, `LabelSpec`) and `:940-950` (`CompiledLabel`); `LabelEntryEditor.tsx`. Parallel lanes on disjoint files: P-2026-10-02-1645 (`irResolve.ts`), P-2026-10-02-1646 (`FieldSegmentEditor.tsx`).
