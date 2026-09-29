# Prompt: Phase 2, slice C1, the generic structural notation (variant C) as derivation data

Prompt-ID: P-2026-09-29-2350
Chat: C-2026-09-29-2230
Lane: Phase 2 (derivation data only; no §3.1 file). Tier: heavy.
Status: da eseguire
Worktree: `~/jjodel-w-notations`, branch `viewpoint-notations`, the same session tree as the discovery P-2026-09-29-2320 (report committed at `ee7206d0c`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-notations`, branch `viewpoint-notations`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Build slice C1 of `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` §5: the rules of variant C (the generic structural notation, mockups `docs/mockups/derived-viewpoints/*-C-generic.svg`) as IR data emitted by the derivation. No IR key is added in this slice: what needs one (letter spacing, the `attributes` exclude, edge label templates and style) waits for C2 and must degrade cleanly here.

Decisions for this slice (the chat, on Alfonso's delegation of 2026-09-29 evening; Alfonso chose «Derive viewpoint» opening a dialog with the notation select defaulting to Generic, and «C first»):

1. **Where C applies now.** When the metamodel has no simulation role binding, «Derive viewpoint» emits variant C instead of today's boxes. With a binding, the role-keyed path (R-VP-15..17) is unchanged, byte for byte. The dialog (slice D) will later make the choice explicit. This amends the last clauses of R-VP-15 (5) and R-VP-17 («no role bound: today's boxes»); write the row (item 7 below).
2. **Edges.** Keep today's edge recognition (5/5 demo edge classes, the 41 M1 edges of the corpus). An edge whose label is not expressible today stays unlabelled in C1; C2 adds the template.
3. **Rows (question 2 of the report, Recommended adopted).** A class held by a multi-valued composition owned by a node class becomes a row of that node (`children` compartment, `rowFormat` in mono 11 px, `name : Type` where the type is expressible), unless it types a plain (non-containment) reference, in which case it stays a node.
4. **Eyebrow.** A top label with the metaclass name as a literal, uppercased in the literal itself, 10 px, weight 600, the quiet text token (`--color-inode-quiet` or the token the report names for `#64748b`); letter spacing arrives with C2.
5. **Subclass mark (question 1, Recommended adopted).** Name signals only: `initial|start` gives a 2 px border in the name ink, `final|terminal|end|accept` the `double` border; otherwise the eyebrow alone.
6. **Look.** White fill, 1 px border in the existing slate-300 border token (find it; no new token), radius 10 (`.ir-shape--rounded`), name 14 px weight 600, ink `var(--color-inode-name)` as R-VP-15 (4) and R-VP-18 for lines and arrowheads (the mockups' `#334155` 1.5 px is not adopted: the ratified ink stays). Size from content; report (do not fix) the measured width of a derived box on the turnstile and which floor produces it (`irStyle.ts:82`, `instanceNode.scss:35`).
7. **R-row.** Append `R-VP-19` to `docs/decisions.md` (the format of R-VP-15..18): «The derived viewpoint draws the generic structural notation (variant C) when no role is bound», ratified by the chat on Alfonso's delegation of 2026-09-29 evening, source the discovery report and the mockups, amending R-VP-15 (5) and R-VP-17 last clause, listing rules 2 to 6 above.

## DOVE

`frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts`, `frontend/src/utils/deriveViewpoint.ts`, their tests under `derive/__tests__/`, `docs/decisions.md` (R-VP-19 only), this prompt's Status, a log entry in `docs/log-inbox/views.md`. Nothing else; a §3.1 file is out of scope (stop and ask if one seems needed).

## COME

1. Read `CLAUDE.md` (§3.1, §5 tests, §6), `docs/PROTOCOL.md` P16, RC-20..RC-34, the report §0 to §5 and R-VP-15..18.
2. Tests first: the §4 counts on the corpus fixtures (views, rows, eyebrows, edges, marks), byte pins proving the role-keyed paths unchanged, `validateIR` on every emitted view, a mutation bench (each rule 2 to 5 mutated must turn a test red; report the score).
3. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
4. Visual: a `lane-run probe` on a free port (not 3000, 3001, 3003): derive C on the four demo metamodels and on MDE ERD, light theme, crops at `sips -Z 600` under `frontend/scripts/smoke/_tmp_*` (gitignored), paths in the report; and the four demo scenes in the default viewpoint, pixel-identical to the trunk readings (`~/.jjodel-lanes/probe-kit/trunk_readings_2026-09-29b.txt` procedure).
5. Commits: code and tests in one `feat:` commit, docs (R-VP-19, log entry, Status) in one `docs:` commit; stage by explicit path.
6. Stop with `Outcome: hard-stop`, the shas, the crops' paths, the measured width and floor, the mutation score, and any question with a `Recommended:` answer.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a §3.1 file, a call to an AI model.

## RIFERIMENTI

`docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` (§0 questions 1, 2; §1 rows 13, 14, 15, 17; §4; §5 C1), `docs/mockups/derived-viewpoints/`, R-VP-15..18.
