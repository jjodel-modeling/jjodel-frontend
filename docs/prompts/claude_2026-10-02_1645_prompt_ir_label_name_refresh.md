# Prompt: an IR name label keeps the old name after a canvas rename

Prompt-ID: P-2026-10-02-1645
Chat: C-2026-10-01-2349
Lane: fast (one subscription signature, root cause already read by the chat). Phase 1 short, then Phase 2 in cascade. Tier: light.
Status: da eseguire

Worktree: `~/jjodel-w-labelname`, branch `ir-label-name-refresh`, created from the trunk `alfonso-frontend-jjtl` at `adb5d9731`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-labelname`, branch `ir-label-name-refresh`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Found by lane P-2026-10-01-2349 (its report, ticket «stale label after rename»); Alfonso, 2026-10-02 about 16:40: «1. proceed». After a double-click rename of an M1 object whose class has no `name` attribute, the store holds the new name but the IR node keeps drawing the old label, even after 5 s and a tab round trip.

What the chat read on the trunk (verify, do not trust): `useIRView` (`frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts:49-72`) subscribes to a signature made of the IR signature, `objectId`, `dObject.instanceof`, the values of the object's own DValue slots and the cross-object deps. `dObject.name` is not in it. The memo below rebuilds `readCtx` from `store.getState().idlookup` only when the signature changes, so an intrinsic `name` / `qualifiedName` label reads the old lookup. When the class has a `name` attribute, the slot value changes and the signature moves, which is why only the attribute-less case is stale.

The fix: add the object's own name to the signature. Check in the same way whether `metaclassName` / `qualifiedName` go stale when the metaclass is renamed in the metamodel (the signature has the class id, not its name); if they do, add the metaclass name too. Nothing else changes in the hook.

## DOVE

Phase 1 (read-only): a short report `docs/discovery/discovery_2026-10-02_ir_label_name_refresh.md`: the root cause confirmed or corrected with file and line; the metaclass-rename case measured; any other reader of intrinsic text that bypasses `useIRView` (edge labels, row views via `resolveRowView`) and whether it has the same gap; questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade, unless a question has no single recommendation or the fix needs a file outside the list below: then stop with `Outcome: hard-stop`.

Phase 2: `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` (the signature selector only), and a test under `frontend/src/components/editor-v2/viewpoint/ir/__tests__/`. If the report shows that the signature belongs in `irResolveCore.ts` to be testable, that file too, additive only. Docs: the report, one row in `docs/decisions.md`, a log entry in `docs/log-inbox/views.md`, this prompt's Status. Anything else: stop and ask.

The decision row is **R-IRN-39** (provisional, unattended, RC-25; evidence: measured; reversible: branch). R-IRN-40 is reserved for the parallel lane P-2026-10-02-1646; do not use it.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, and the report `docs/discovery/discovery_2026-10-01_label_editable_toggle.md`.
2. Phase 1 report, committed.
3. Tests first, red before and green after: the signature changes when only `dObject.name` changes (and the metaclass name, if adopted); it does not change on an unrelated object's rename. Mutation bench (drop the name term, use the wrong object's name); report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme. An M1 object of a class without a `name` attribute, drawn by an IR view with an intrinsic name label: double-click, rename, Enter; the label shows the new name within one frame, and again after a tab round trip. The same with a class that has a `name` attribute (no regression). Count the re-renders of an unrelated node during the rename: it must not grow. The four demo scenes in the default viewpoint: 0 px from `adb5d9731`. Crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_labelname_crops/` (gitignored).
6. Commits: `fix:` code and tests, `docs:` report, row, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the mutation score, «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree (no `/tmp` either), a call to an AI model, renaming or removing an existing IR property or exported identifier, a VersionFixer migration, changing the default viewpoint.

## RIFERIMENTI

`irResolve.ts:49-72` (`useIRView` signature) and the memo after it; `irReadCtxLproxy.ts` (`makeReadCtx`, `getName`, `getMetaclassName`); `irCompile.ts:458-470` (intrinsic text accessors); `IRNodeContent.tsx:605-645`. Parallel lane on disjoint files: P-2026-10-02-1646 (`~/jjodel-w-segedit`, `FieldSegmentEditor.tsx`).
