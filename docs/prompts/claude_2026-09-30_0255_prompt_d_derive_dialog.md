# Prompt: Phase 2, slice D, the «Derive viewpoint» dialog, the notation binding and provenance

Prompt-ID: P-2026-09-30-0255
Chat: C-2026-09-29-2230
Lane: Phase 2 (one §3.1 key: `ir.generated` in `irTypes.ts`; Layer Impact Report for it). Tier: heavy.
Status: eseguito 2026-09-30 · lane viewpoint-notations · 64ea9f216 · non fuso: hard-stop, lane probe on 3074 (light) 58/58, crops in frontend/scripts/smoke/_tmp_d_crops/ (gitignored), mutation bench 44/45 (the survivor equivalent), R-VP-21 nel commit docs, verifica visiva alla chat
Worktree: `~/jjodel-w-notations`, branch `viewpoint-notations`, on top of C1 (`3ed86119f`, `ddfb24dc1`) and C2 (`2360515f4`, `97f91a7ac`), not merged, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-notations`, branch `viewpoint-notations`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Slice D of `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` §5, as §3 of that report describes it. Alfonso chose on 2026-09-29 evening: «Derive viewpoint» opens a dialog with a notation select (default Generic) and a metaclass → role table prefilled from signals, always editable. The chat decides the rest on his delegation:

1. **Notations offered in this slice:** Generic (variant C, R-VP-19/20), State machine, Petri net, Flowchart. The last three are today's role-keyed renderings (R-VP-15..18), unchanged; they now apply only when picked. ER and UML are added by their own slices, not shown here. This retires the automatic use of the stored simulation binding in the derivation (R-VP-15 (5), R-VP-17 «keyed on the roles»): write that amendment in the new row.
2. **Prefill:** for State machine, Petri net and Flowchart, `bindProfile(profile, sketchOfMetamodel(lookup, mm), bag)` (`profileBinder.ts:387`) with the stored simulation binding as `bag`, inverted per class; the profiles are `stateMachine`, `petri`, `flowchart`. When the metamodel has a stored simulation binding, the select opens on the matching notation instead of Generic (the demo metamodels open ready). For Generic the table is hidden (no roles).
3. **The dialog never writes the simulation binding.** Its binding is stored with the derived viewpoint only: flat keys in the new `DViewPoint`'s `_state`, written in `newVP`'s callback before persist (the channel `viewpointType` uses, `utils/deriveViewpoint.ts:55-59`): `derivedFrom`, `derivedNotation`, one `derivedRole_<classId>` per bound class.
4. **Provenance:** each derived view gets `ir.generated = { by: 'derive-2', notation, role?, hash }`, declared optional in `irTypes.ts` (question 3 of the report, Recommended adopted); `structuralHash` must ignore `generated` as it ignores `migratedFrom` (R-IRN-33).
5. **Regeneration before 2026-10-07:** «Derive viewpoint» on a metamodel that already has a derived viewpoint opens the dialog prefilled from the latest one's `_state` and creates a new viewpoint; no in-place update (question 4, Recommended adopted).
6. **One undo step** for the whole creation; the new viewpoint is not activated, only its tab opens, as today.
7. **Look:** the existing modal pattern of `SimRolesModal` / `ValidationRulesModal` (find the shared modal classes; no new visual language), Bootstrap Icons only, labels 11 px, light theme. Accessible: real `<select>` and `<label>`, focus order, Esc closes, Enter confirms.
8. **Row:** write `R-VP-21` in `docs/decisions.md` (format of R-VP-15..20, «ratified by the chat on Alfonso's delegation of 2026-09-29 evening»), amending R-VP-15 (5) and R-VP-17 as in point 1, and listing the `_state` keys and `ir.generated` as persisted names (R-B9).

Also adopted from C2's question (RC-21): an empty value in an edge label template drops the text written just before it (R-VP-20 as implemented).

## DOVE

New: `frontend/src/components/editor-v2/viewpoint/derive/notations.ts` (the notation list, the profile per notation, the prefill), `DeriveViewpointDialog.tsx` and its `.scss` (next to the modals it imitates; grep the names first, CLAUDE.md naming rule). Changed: `App.tsx` (mount), `events/registry.ts` (open event), `TreeViewContent.tsx` (the entry opens the dialog), `utils/deriveViewpoint.ts`, `viewpointDerivation.ts` (take the binding as input), `irTypes.ts` (`generated?` only), `irDefaults.ts` if `structuralHash` needs the exclusion, their tests. Docs: a short report `docs/discovery/discovery_2026-09-30_d_dialog.md` (Layer Impact Report for `generated`, measures), R-VP-21, a log entry in `docs/log-inbox/views.md`, this prompt's Status. Any other file: stop and ask.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, the discovery §3 and §0 questions 3, 4, R-VP-15..20, R-SIM-8.
2. Tests first: prefill per demo metamodel (the four exports) equals `bindProfile`'s output; Generic hides the table; the created viewpoint's `_state` keys; `ir.generated` present on every view and ignored by `structuralHash` (every existing fixture hash unchanged); one undo step removes viewpoint and views; the simulation binding is byte-identical before and after a derivation. Mutation bench; report the score.
3. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
4. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme: the dialog open on each of the four demo metamodels (crop), the viewpoint derived with the preselected notation and with Generic on DemoPEST, crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_d_crops/`; the four demo scenes in the default viewpoint identical to the C2 tip (same procedure as C1 and C2; the Jjodie launcher pulse is known noise).
5. Commits: `feat:` code and tests, `docs:` report, R-VP-21, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the crops' paths, the mutation score, any question with a `Recommended:` answer.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a call to an AI model, a change to the simulation binding code or data, renaming or removing an existing IR property.

## RIFERIMENTI

Discovery `ee7206d0c` §3, §5 D; R-VP-15..20; `profileBinder.ts:387-399`; `utils/deriveViewpoint.ts:55-59`; `joiner/classes.ts:2398-2401`; `irDefaults.ts:280-305`; `ProjectEditor.tsx:1204-1228`.
