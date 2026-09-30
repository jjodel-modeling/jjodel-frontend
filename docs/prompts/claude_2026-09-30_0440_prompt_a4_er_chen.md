# Prompt: Phase 2, slice A4, the ER (Chen) notation

Prompt-ID: P-2026-09-30-0440
Chat: C-2026-09-29-2230
Lane: Phase 2 (critical zone: `irTypes.ts`, `irCompile`, `irEdgeViews.ts`, `UnifiedEdge.tsx`, `edgeUtils.ts`; Layer Impact Report required). Tier: heavy.
Status: da eseguire
Worktree: `~/jjodel-w-notations`, branch `viewpoint-notations`, on top of C1, C2, D, A1+A3 (`74995f429`, `6daba2e7f`), not merged, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-notations`, branch `viewpoint-notations`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Slice A4 of `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` §5 (§1 rows 9 and 22, §3 «ER and UML signals»). Target: `docs/mockups/derived-viewpoints/er-A-chen.svg`. As for A1 and A3 (R-VP-22), it is a **new notation «ER (Chen)»** in the dialog; nothing existing changes.

Decisions of the chat (Alfonso's delegation of 2026-09-29 evening):

1. **Binding.** No simulation profile: the roles Entity, Relationship, Attribute, Key are prefilled by the name and structure signals of discovery §3, in a new pure module next to `notations.ts` (an entity holds a composition to a class with `type`; a relationship is a two-reference class or matches `/relat/`; a key matches `/key|id|primary/`; a cardinality matches `/card|mult/`), always editable in the dialog table.
2. **Symbols.** Entity: rectangle, radius 4, name 14 px weight 600, ink 1 px. Relationship: a diamond **node**, name inside 13 px, even when its class has two references (in Chen the relationship is a node; its references are drawn as plain lines to the entities, no arrowheads). Attribute, when its class is a node in the metamodel (as ERDLanguage's `Attribute`): an ellipse node linked to its owner by a plain line; the key attribute underlined (existing `underline` Conditional). When attributes are contained rows (MDE ERD), keep the C rows and say so in the report: Chen ellipses for contained attributes are out of this slice.
3. **Cardinalities.** New optional IR keys `edge.labels.sourceEnd?` / `edge.labels.targetEnd?` (`TextSource`, same style key as C2's labels), anchored with `computeCardinalityAnchor` (`edgeUtils.ts:1091`), absent = today. Chen shows `1`, `N`, `M` from the Cardinality role (or from a `max` / `upper` slot: `1` stays `1`, anything else becomes `N`, the second many-side on the same relationship `M`).
4. **Row:** write `R-VP-23` in `docs/decisions.md` (format of R-VP-15..22, «ratified by the chat on Alfonso's delegation of 2026-09-29 evening»): the notation, the two IR keys (persisted names, R-B9), the limit on contained attributes, and that no earlier row is amended.

Adopted from A1+A3's questions (RC-21): the 1.00 to 1.01 px arrow tips are accepted; A3's diamond from the class name stays, a Decision role is a separate lane.

## DOVE

`irTypes.ts`, `irCompile`, `irValidate`, `irEdgeViews.ts`, `UnifiedEdge.tsx`, `edgeUtils.ts`, `derive/notations.ts`, a new pure signals module beside it (grep the name first), `viewpointDerivation.ts`, the dialog only to list the new entry, their tests; a report `docs/discovery/discovery_2026-09-30_a4_er_chen.md` (Layer Impact Report first, measures), `docs/decisions.md` (R-VP-23), a log entry in `docs/log-inbox/views.md`, this prompt's Status. Any other file (`portDistribution.ts`, the sync hooks above all): stop and ask. If drawing a relationship's references as lines from a diamond node needs anything beyond IR data and the two keys above, stop with `Outcome: question` and the evidence.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, the discovery §1, §3, §4, R-VP-15..22.
2. Layer Impact Report in the report before any code.
3. Tests first: every existing fixture hash unchanged; `irValidate` for the two keys; the signal prefill on the three ERD exports (ERDLanguage ERD, MDE ERD ×2; decode as C1 did); the Chen views (diamond relationship node, ellipse attribute with underlined key, end labels); every other notation's output byte-identical to the A1+A3 tip. Mutation bench; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme: ERDLanguage ERD and one MDE ERD derived as ER (Chen) and as Generic, crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_a4_crops/`; the four demo scenes in the default viewpoint 0 px from the A1+A3 tip, with the same procedure and exclusions A1+A3 used (the right rail, the Jjodie launcher pulse, the binding written by the probe).
6. Commits: `feat:` code and tests, `docs:` report, R-VP-23, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the crops' paths, the measures, the mutation score, any question with a `Recommended:` answer.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a call to an AI model, renaming or removing an existing IR property, changing the output of an existing notation.

## RIFERIMENTI

Discovery `ee7206d0c` §1 rows 9, 22, §3, §4; R-VP-15..22; mockup `er-A-chen.svg`; `edgeUtils.ts:1091`; `UnifiedEdge.tsx:502`.
