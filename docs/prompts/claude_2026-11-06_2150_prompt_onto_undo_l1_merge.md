# Ontological instantiation, undo groups L1: merge the trunk into oi-s2u, resolved with option (c)

Prompt-ID: P-2026-11-06-2150
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (core: `redux/reducer/reducer.ts`; Layer Impact Report in the discovery, §6)
Status: eseguito 2026-11-06 · lane full · 197ae1fd1
Request: none (Alfonso: «ok», 2026-11-06 21:45, to option (c) with the chat's two amendments and the core go-ahead)
Depends: P-2026-11-06-2105
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s2u`, branch `oi-s2u` at `53834b0b2` plus this prompt's `docs:` commit, clean. Check `pwd`,
the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier: heavy, effort
`xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-06-2150 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 75 minutes.

- **No subagent, no task in background.** Gates in the foreground (P16), through `node scripts/run-quiet.mjs`.
- **One test run per tool call.** Short tool output; never a whole diff, never `reducer.ts` or `EditorV2.tsx` whole
  (grep, then windows of at most 80 lines).
- **Commit the merge as soon as typecheck, the unit tests below and the build are green.** Commit subject at most 72
  characters, `Model:` trailer.
- No push, no merge into the trunk. Do not touch `Status`. No CLAUDE.md 3.2 file. No file outside DOVE; if one becomes
  necessary, stop with `Outcome: question`.

## Decisions (Alfonso, 2026-11-06 21:45)

The plan is `docs/discovery/discovery_2026-11-06_onto_undo_groups_reconcile.md` on branch `oi-undo-discovery` (read it
with `git show oi-undo-discovery:<path>`, by windows: §1, §2, §3 option (c), §5, §6).

1. **Option (c).** The trunk's `beginUndoGroup()` / `endUndoGroup()` API and depth nesting stay exactly as on the trunk.
   oi-s2u's post-close exact merge is added back, rebuilt on `composeUndoDeltas`: after the outermost end, a late
   graph-keyed write that the legacy path would merge shallowly into the group's entry, while that entry is on top,
   composes exactly (restores `idlookup` on Cmd+Z). The tail is set at the outermost end and cleared on push, undo, redo
   and begin. Dropped: the 10 s cap in the reducer, group ids, `undoGroupState` and `window.undoGroupState`, the
   `userHasInteracted` join gate.
2. Undo or redo while a group is open: the trunk's behaviour (the group stays open).
3. No safety cap in the reducer. **The instance-of client owns its own cap** (lane L1b, not this lane).
4. Overlapping instantiations are **serialized in the menu** (lane L1b, not this lane), so one instantiation stays one
   undo entry.
5. Order: oi-s2u first, then oi-s3a and oi-s3b rebuilt on it; the trunk untouched until the 3.2.0 tag.

## COSA

1. First reply: the discovery's Layer Impact Report (§6), restated, amended for decisions 2..4.
2. `git merge --no-ff alfonso-frontend-jjtl` in this worktree (message per P14). Resolve per §5 of the report:
   `EditorV2.tsx` takes the trunk's four preview-aware handlers plus oi's `onPaneContextMenu` line; `reducer.ts` takes
   the trunk side of the marker hunk, then remove oi's silent duplicates (the second `beginUndoGroup` and
   `endUndoGroup`, the `:1225-1290` block, `dropUndoGroup()` on undo and redo, the old tail branch,
   `clearUndoGroupTail('push')`) and add the (c) tail; `undoGroup.test.ts` is the trunk file plus oi's cases (report:
   `:198`, `:206`, `:214`, `:227`, `:284`) ported to the trunk API, plus one case for the (c) tail (a graph-keyed write
   after the outermost end composes exactly and one undo removes it from `idlookup`).
3. Port every `endUndoGroup(group)` call site in `instantiate.ts` to `endUndoGroup()` (the typecheck finds them,
   TS2554). Nothing else changes in `instantiate.ts` in this lane.
4. Gates: typecheck at its trunk baseline (record the count on the trunk first, `git show` not needed: run it after the
   merge and compare with the trunk's `CLAUDE.md` §17 baseline); `undoGroup.test.ts`, `instantiate.test.ts` and the
   reducer tests green; `npm run build` 0. Commit the merge.
5. Mutation bench on the new tail, one mutant per call, each red, each reverted: T1 the tail not cleared on push; T2 the
   late write merged shallowly (the old path); T3 the tail set at an inner end instead of the outermost. Counts, failing
   test names and load average to `~/.jjodel-lanes/P-2026-11-06-2150/bench.txt` (not committed).

## DOVE

`frontend/src/redux/reducer/reducer.ts`, `frontend/src/redux/reducer/__tests__/undoGroup.test.ts`,
`frontend/src/components/editor-v2/EditorV2.tsx` (conflict hunk only), `frontend/src/components/editor-v2/hooks/instantiate.ts`
(call sites only), plus whatever the merge brings from the trunk unchanged. Nothing else.

## HARD STOP

After step 5 with `Outcome: done` and a clean tree. Earlier with `Outcome: question` if a trunk test of the script
Apply, `createModelFromText` or the JjTL run goes red because of the (c) tail, with the test name and the evidence.

## RIFERIMENTI

`docs/discovery/discovery_2026-11-06_onto_undo_groups_reconcile.md` (branch `oi-undo-discovery`); `docs/decisions.md`
(R-OI-12, R-OI-14, R-OI-15, R-JJD-6, R-PLG-5, R-JTG-14); CLAUDE.md §3, §6, §17; PROTOCOL.md P14.
