# Prompt: VersionFixer, old saved states and the examples fail to load

Prompt-ID: P-2026-09-24-1610
Chat: C-2026-09-24-1005
Status: da eseguire

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop and say so; never work by absolute path on another worktree. Start only after `P-2026-09-24-1605` (merge) has closed: `git status` empty and the merge commit on HEAD.

Parallel lane: `P-2026-09-24-1520` runs on `simulation-engine` in `~/jjodel-sim`. Do not touch that worktree.

Two-phase. Phase 1 is read-only and ends with a saved report and a hard stop. Phase 2 starts only on a GO that opens with this ID. `frontend/src/redux/VersionFixer.tsx` is in the critical zone (§3.2 of `CLAUDE.md`): Phase 2 edits it only after a Layer Impact Report in chat and an explicit go-ahead.

## COSA

Two defects found by `P-2026-09-24-1455` (tickets in its entry in `docs/log-inbox/default-view-parity.md`), both high priority:

1. `'2.1 -> 2.2'` (`VersionFixer.tsx:408`) has an empty body and returns `void`. Every other step returns the state. A saved state with no `version` goes through `'0 -> 2.1'` and then crashes `VersionFixer.update` with a TypeError instead of loading or failing with a message.
2. Past that step, the 2023 example blobs fail at `'2.2 -> 2.201'`, which iterates `s.classs`. According to 1455, none of `frontend/src/examples/` loads today. The examples are teaching material.

The second claim needs measuring before any fix: which examples the UI actually offers, through which path they load (`common/Defaults.ts`, `components/editor-v2/Toolbar.tsx`, `components/devtools/SmokeBoot.tsx` and `joiner/classes.ts` import from `examples/`), and whether each one goes through `VersionFixer` at all.

Out of scope: rewriting the migration chain, changing any step other than the ones the root cause names, the IR migration `2.225 -> 2.226` (just changed by 1455), the example contents unless the root cause is in them.

## DOVE

Phase 1 reads: `frontend/src/redux/VersionFixer.tsx` (the `update` driver, the step registry, `'0 -> 2.1'`, `'2.1 -> 2.2'`, `'2.2 -> 2.201'` and every step that assumes a field of the old state shape), `frontend/src/examples/*`, the four importers above, the save/load path (`SaveManager.load` and what calls it). Tests that already exercise `VersionFixer`, if any.

## COME

### Phase 1 (read-only)

1. How `update` chains the steps: how it picks the next step, what it does with a step's return value, where a `void` return breaks it. File and line.
2. For each file in `frontend/src/examples/`: is it reachable from the UI (which menu or button), how it is loaded, which version it carries, and whether it loads on 3001 today. Measure in the app or with a probe that calls the real load path; report verbatim. The 1455 finding says none loads: confirm or correct it per example.
3. Root cause of the `s.classs` failure: is `classs` a field that old states really had and that a previous step removes or renames, is it a typo, or does the example blob not match the shape the step expects? Show the evidence (git history of the step, `git log -S classs`, the blob).
4. Minimal fix proposal for each defect, as a diff in prose, with the Layer Impact Report draft (layers: persistence, D-layer). Say what else could be broken the same way: other steps with an empty body or a `void` return, other steps reading a field that may be absent. List them; fix none that the root cause does not name.
5. **Open questions for Alfonso**: whether a state that cannot be migrated should fail with a user-visible message (and where it surfaces), and whether examples that cannot be repaired should be removed from the UI or fixed at the source.
6. Test plan with one mutation per rule: a state with no version loads (or fails with the message, per the answer to item 5); each reachable example loads; the steps before and after the fix produce the same state on an already-current project.
7. Baseline gates now: typecheck error set (14 expected), vitest count, build.

Save the report as `docs/discovery/discovery_2026-09-24_versionfixer_old_states.md`: objective, files read with full paths, item 2 as a table, findings, risks, open questions for Alfonso (item 5 first), the proposed Phase 2 diff in prose with the file list and the LIR draft. Commit it alone, with pathspec, on the trunk. Hard stop: the phase is not complete until the report is on disk and committed.

### Phase 2 (after GO)

1. Layer Impact Report in chat, hard stop, wait for the ACK before editing `VersionFixer.tsx`.
2. Implement what the GO ratifies. Tests per Phase 1 item 6, mutations reported.
3. Gates: typecheck with the same error set as the baseline, vitest, build, `npm run check:docs`, `npm run check:agents`.
4. Hard stop for Alfonso's visual check on 3001: each reachable example loads from the UI and renders; one current project still loads unchanged.
5. After the OK: one code commit with pathspec, then one docs commit with the entry in `docs/log-inbox/default-view-parity.md` (or a new `versionfixer.md` inbox with the standard header, declared in the report) and the Status flip of this file per P13. P6 trailer `Model: ...` in both bodies. Subjects end with `(P-2026-09-24-1610)` and stay within 72 characters without the suffix.

Never: `git add .`, `git stash`, `git reset --hard`, commits outside the trunk, push.

## RIFERIMENTI

- `docs/log-inbox/default-view-parity.md`, the `P-2026-09-24-1455` entry (tickets).
- `docs/discovery/discovery_2026-09-24_migrated_view_identity.md`.
- `CLAUDE.md` §3.2 (critical zone), `docs/PROTOCOL.md` P13, P14.
