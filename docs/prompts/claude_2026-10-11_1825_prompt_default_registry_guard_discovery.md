# Default registry guard: user views read-only after a page load (discovery)

Prompt-ID: P-2026-10-11-1825
Chat: C-2026-10-11-1814
Request: Alfonso, 2026-10-11 18:14: «F2, alta priorità: in un progetto, dopo un ricaricamento della pagina, le viste e i viewpoint dell'utente diventano di sola lettura»
Front: maintenance
Lane: full (core: `redux/reducer/reducer.ts`, CLAUDE.md rule 5; Phase 1 discovery with a probe, hard stop; Phase 2 only on the chat's GO, never under `--auto` if the fix touches a §3.2 file)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-defaultguard`, branch `default-guard`, created from the trunk commit that adds this file, `frontend/node_modules` symlinked. Before anything else check `pwd`, the branch and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-10-11-1825 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`. Do not touch the `Status` line.

## Context (do not redo this analysis, verify it)

Read first `docs/discovery/discovery_2026-10-11_new_model_instantiate.md` §3.2 (F2) and §4 (F2 candidates), the inbox ticket in `docs/log-inbox/new-model-instantiate.md`, the S4 finding in `docs/log-inbox/ir-graphvertex-s4.md`, and `docs/decisions.md` R-IRN-12 and R-IRN-15.

The measured mechanism, in short:

1. The `Default` viewpoint record exists only in the store seeded at boot (`redux/store.tsx:247`, closed at `:324` with `Defaults.Pointer_ViewPointDefault`). A project opened by a page load of its URL does not carry it: `idlookup['Pointer_ViewPointDefault']` is `undefined`, `state.viewpoints` is `[]`. A project opened from its card in the same session carries it.
2. `common/Defaults.ts:91-93` start `defaultViewsMap` and `defaultViewPointsMap` with `true` per system id. The reducer (`reducer.ts:1110-1117`) replaces them only once the `Default` record is an object, and until then registers every view and viewpoint it finds. After a page load the guard never closes, so every view and viewpoint the user creates later is registered too (measured: the map grows from 20 to 22 keys).
3. `Defaults.check` (`Defaults.ts:108-110`) answers `true` for those ids, and its consumers treat them as system defaults: `ViewData.tsx:58` read-only, `view.tsx:655` undeletable, `lastViewpoint.ts:98` `isDefault`.

Line numbers come from a report written on the trunk at `58a407501`: re-read them, the trunk has moved.

## Phase 1 (read-only on sources)

1. **Lifecycle of the guard.** Trace every way a project enters the store: card open, page load of the project URL, import of a project file, a project saved before R-IRN-12 (2026-08-18) if one is available in the fixtures. For each: is the `Default` viewpoint record present, does the guard at `reducer.ts:~1110` close, and when. Say why the record is missing after a page load: never persisted, persisted and dropped on load, or never seeded on that path (`projectMissingFromBatch`). Quote `file:line` verbatim.
2. **Census of the consumers.** Every reader of `Defaults.check`, `defaultViewsMap`, `defaultViewPointsMap`, `defaultTypesMap` (search declared in the report, with the command, tests excluded, and a positive control). For each site, one row: what happens to a **user** id that wrongly answers `true`. Give priority to anything on a persistence, save, export, copy or undo path: if any of them skips «default» ids, user views are at risk of not being saved, and that changes the priority of everything else. Say explicitly whether such a site exists, with the search behind the answer (R-RAIL-28).
3. **Value shape.** Does any reader use the map value as an object (`defaultViewsMap[id].x`, iteration over values) rather than as a truth value? Candidate (a) below keeps `true` for system ids and depends on the answer.
4. **`defaultTypesMap`.** Same pattern or not.
5. **Probe.** Extend or reuse `frontend/scripts/probe/new-model-instantiate.ts` (or a new `frontend/scripts/probe/default-registry-guard.ts`), run by `lane-run probe` on a port of your own (not 3000, 3001, 3003, 3080). Scenarios at least: `card` (open from the card, create a viewpoint and a view), `reload` (same project, page load, create a viewpoint and a view), `reload-existing` (views created before the reload, then reload). Record per scenario: `typeof Defaults.defaultViewPointsMap['Pointer_ViewPointDefault']`, the key counts of both maps, `Defaults.check` on each user view and viewpoint, read-only state in the view editor (DOM), whether delete is offered and works, whether the views survive a save and a second page load.
6. **Age of the defect.** If cheap, run the `reload` scenario on a tag from before 2026-08-18 to say whether R-IRN-12 introduced it or exposed it. Not mandatory: say if skipped.
7. **Candidates.** Evaluate, with risks and the sites each one changes:
   - (a) a dedicated one-shot flag closes the guard after the first pass, independent of the seed record;
   - (b) seed the `Default` viewpoint record on project load when missing (note that R-IRN-12 and R-IRN-15 moved away from this);
   - (c) the registration loop admits only the static system ids (`Defaults.views` and the viewpoint list), so a user id can never enter the maps whatever the guard does;
   - any other you find. Recommend one, and say whether it needs a cleanup of ids already registered in the running session.
8. **Report.** Write `docs/discovery/discovery_2026-10-11_default_registry_guard.md` (P4, `## 0. Answer in brief` first): hypotheses and verdicts, the census table, the probe results, the recommendation, the files the fix touches, whether any is in CLAUDE.md §3.1 or §3.2 (if yes, a draft Layer Impact Report; `reducer.ts` is core in any case, so include a short impact section either way), the test plan (a pure unit test where possible, importing nothing from `joiner`; a mutation bench on the guard), and an acceptance criterion in one mechanical sentence.
9. Commit probe and report with explicit pathspec and the `Model:` trailer, then stop with `Outcome: hard-stop`.

## HARD STOP

After step 9. No Phase 2 without the chat's GO carrying this Prompt-ID.

## NON FARE

- No edit under `frontend/src/` in Phase 1.
- No `git stash`, no `git add .` or `-A`, no push, no merge. Do not touch the `Status` line.
- Do not «fix» the read-only state in the view editors: the defect is the registry, not its readers.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-11_new_model_instantiate.md` §3.2, §4, §6; `docs/decisions.md` R-IRN-12, R-IRN-15; CLAUDE.md rule 5, §3.1, §3.2; PROTOCOL P4, P13, P14.
