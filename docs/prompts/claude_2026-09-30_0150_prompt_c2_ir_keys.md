# Prompt: Phase 2, slice C2, text and edge-label IR keys for the generic notation

Prompt-ID: P-2026-09-30-0150
Chat: C-2026-09-29-2230
Lane: Phase 2 (critical zone, §3.1 files of `viewpoint/ir/`; Layer Impact Report required). Tier: heavy.
Status: eseguito 2026-09-30 · lane viewpoint-notations · 2360515f4 · non fuso: hard-stop, lane probe on 3072 (light) 46/46, crops in frontend/scripts/smoke/_tmp_c2_crops/ (gitignored), mutation bench 43/43, R-VP-20 nel commit docs, verifica visiva alla chat
Worktree: `~/jjodel-w-notations`, branch `viewpoint-notations`, on top of slice C1 (`3ed86119f`, `ddfb24dc1`, not merged yet), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-notations`, branch `viewpoint-notations`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Slice C2 of `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` §5 (rows 6, 8, 13, 15 of §1), then use the new keys in the C derivation of slice C1 (R-VP-19). Alfonso delegated to the chat, on 2026-09-29, the decision on additive and optional IR keys, with a Layer Impact Report; the chat decides these names:

1. `TextStyle.letterSpacing?: number` (em) and `TextStyle.textTransform?: 'uppercase' | 'lowercase' | 'none'`. The C eyebrow uses `letterSpacing: 0.08`, `textTransform: 'uppercase'` and the metaclass name as written (no longer uppercased in the literal).
2. On the `attributes` compartment source, `exclude?: string[]` (feature names). The C slot rows exclude `name`, so the name is not repeated.
3. On a row `literal` segment, `style?: TextStyle` (the grey `attr`/`op` prefix of later slices; C2 only adds and tests the key).
4. `edge.labels.template?: TextSource[]` (the precedent is the row `template`), rendered as the centre label when present. The C edges whose label is not expressible today get their template: attribute rows as `name = value` (for example `weight = 2`), and an unrecognised edge class prefixed by `«Metaclass»`.
5. `edge.labels.style?: TextStyle` plus a halo when declared: 12 px, weight 500, the quiet ink token, a 4 px halo in the canvas surface colour (the addendum TS3 vocabulary). Absent: today's label box, unchanged.

Every key is optional; an absent key renders exactly as today. Write the row `R-VP-20` in `docs/decisions.md` (format of R-VP-15..19, «ratified by the chat on Alfonso's delegation of 2026-09-29 evening»), listing the five persisted names: they are permanent once saved (R-B9).

## DOVE

The files §5 names for C2: `irTypes.ts`, `irCompile`, `irValidate`, `IRNodeContent.tsx`, `IRRow`, `irEdgeViews.ts`, `UnifiedEdge.tsx`, `EditorV2.scss`, plus `viewpointDerivation.ts` and its tests, `docs/decisions.md` (R-VP-20), a report `docs/discovery/discovery_2026-09-30_c2_ir_keys.md` holding the Layer Impact Report and the measures, this prompt's Status, a log entry in `docs/log-inbox/views.md`. Any other file: stop and ask.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, the discovery §1 and §2, R-VP-15..19, the TextStyle addendum.
2. Layer Impact Report first, in the report, before any code (discovery §2 as the base: R-B9, R-IRN-32, R-IRN-33 with `structuralHash`, Rule 11).
3. Tests first: `irHash` of every existing fixture view unchanged and a round-trip (`ir.test.ts`); `irValidate` accepts each new key and rejects a wrong type; render tests for each key present and absent; the C derivation counts of C1 updated (slot rows without the name, 4 edge templates). Mutation bench per key; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003, 3071 if still busy), light theme: the derived C viewpoint of the four demos and MDE ERD, crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_c2_crops/` (gitignored); and the four demo scenes in the default viewpoint byte-identical to the same scenes on `ddfb24dc1` (the C1 tip), by the same procedure C1 used.
6. Commits: `feat:` code and tests, `docs:` report, R-VP-20, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the crops' paths, the mutation score, any question with a `Recommended:` answer.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a call to an AI model, renaming or removing an existing IR property.

## RIFERIMENTI

Discovery `ee7206d0c` §1 rows 6, 8, 13, 15, §2; R-VP-19 (`ddfb24dc1`); `irTypes.ts:95-102`, `:128`, `:150`, `:618`, `:650`; `EditorV2.scss:2825-2827`.
