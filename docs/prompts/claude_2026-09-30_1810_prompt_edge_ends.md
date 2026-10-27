# Prompt: Phase 1 and 2 in cascade, slice E (edge ends): richer, conditional terminations and end labels

Prompt-ID: P-2026-09-30-1810
Chat: C-2026-09-30-1810
Lane: Phase 1 then Phase 2 in cascade (no critical zone expected; no go-ahead given). Tier: heavy.
Status: eseguito 2026-09-30 · lane edge-ends · 77c2f946b, 8f3e7c307, 462fba92d · non fuso: hard-stop, lane probe on 3093 (light and dark, widths 1 and 2) 16/16, crops in frontend/scripts/smoke/_tmp_edgeends_crops/ (gitignored), mutation bench 22/23 (the survivor equivalent), R-EE-1..4 nel commit docs, verifica visiva alla chat
Worktree: `~/jjodel-w-edgeends`, branch `edge-ends`, created from the tip of `viewpoint-notations` at `30f3d8a81` (not from the trunk: that branch already adds `hollowCircle` and validates terminations, and it merges on the trunk before this one). A fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-edgeends`, branch `edge-ends`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso, 2026-09-30: edges need more choices for their head and tail, the standard conventions of ER (multiplicities) and the other notations that decorate an edge end to give it a meaning. This slice builds the mechanism once, generically, inside release 3.1.0. It does not bind any derived notation to it: what the derived viewpoints and the MODELS demo show is decided later by Alfonso.

Today `EdgeViewIR.terminations` is `{ sourceEnd?: EdgeTermination; targetEnd?: EdgeTermination }`, a flat union of seven values fixed for every instance of the view, and the only edge label is `labels.center`. After this slice:

1. **Vocabulary.** `EdgeTermination` gains, additively (R-B9: persisted names, never renamed): `'filledCircle'`, `'bar'`, `'cross'` (UML non-navigable end), and the four crow's foot ends `'erZeroOrOne'`, `'erExactlyOne'`, `'erZeroOrMany'`, `'erOneOrMany'`. The crow's foot ends are drawn by composing primitives: the glyph nearest the node gives the maximum (bar = one, crow = many), the glyph farther along the edge gives the minimum (circle = zero, bar = one). Grep every new name first (CLAUDE.md rule on new identifiers); on a collision, stop with a question.
2. **Conditional ends.** `sourceEnd` and `targetEnd` accept `Conditional<EdgeTermination>`, exactly as `line.color` accepts `Conditional<string>`. A plain value stays valid and byte-identical. The compiled form (`terminations: { sourceEnd: EdgeTermination; targetEnd: EdgeTermination }`) stays a resolved value per edge instance, so its consumers do not change. If `Conditional<T>` does not already admit a plain `T`, the declared type is the union of the two; the report says which.
3. **End labels.** `labels.sourceEnd?` and `labels.targetEnd?`, each `{ multiplicity?: TextSource; role?: TextSource }`, optional. They cover UML multiplicities and role names and ER Chen `N`, `(0,N)`. Anchor them with the existing cardinality anchor (`computeCardinalityAnchor` in `edgeUtils.ts`, grep it), multiplicity on one side of the edge and role on the other. `portDistribution.ts` and `handlePosition.ts` stay untouched (critical zone): if the anchor cannot be computed without them, stop with a question.
4. **Rendering.** The line stops at the glyph's back so it never shows through hollow glyphs. Hollow glyphs are filled with the canvas background token in both themes, not transparent. Glyph stroke follows the edge's resolved line color and width. Orientation follows the last segment (axis-aligned on the Manhattan router) and the tangent on `curved` and `arc` edges.
5. **Validation and editor.** `validateIR` accepts every new value and the Conditional form, and still rejects an unknown termination and a malformed end label. `EdgeAuthoringPanel` lists the new ends grouped (Arrows, UML, ER, Petri), keeps the existing options and their order, edits the Conditional form with the control the panel already uses for Conditional line fields (Advanced), and offers the end labels in Advanced. Basic stays as it is apart from the longer list.

Every addition is optional: a view that uses none of them compiles and renders byte-identically.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-09-30_edge_ends.md` with: where terminations are declared, validated, compiled, drawn and edited today (file and line); how `Conditional<T>` is typed and resolved for `line`; how the cardinality anchor works and whether it serves end labels; the exact file list for Phase 2 with a size estimate; the proposed glyph geometry (numbers in px at width 1 and 2); risks; questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade, unless a question has no single recommendation, or Phase 2 needs a file of the critical zone (CLAUDE.md §3.2) or a derived-notation file (`notations.ts`, `viewpointDerivation.ts`, `deriveViewpoint.ts`).

Phase 2: expected, to be confirmed by the report: `irTypes.ts`, `irValidate.ts`, `irCompile.ts` or `irEdgeViews.ts` (whichever resolves edge Conditionals), `UnifiedEdge.tsx`, `edgeUtils.ts`, the marker drawing module the report names, `EdgeAuthoringPanel.tsx` (and its scss if needed), their tests; a log entry in `docs/log-inbox/views.md`; decision rows R- in `docs/decisions.md` written `provisional, unattended` (RC-25); this prompt's Status.

Out of scope: `notations.ts`, `viewpointDerivation.ts`, `deriveViewpoint.ts`, every demo project, the critical zone, `docs/CHANGELOG.md` (the merge adds the line), jjodel-docs.

## COME

1. Read `CLAUDE.md` (§3.1, §3.2, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, R-VP-15, R-VP-24, R-VP-25, and the edge rows of `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` (§1 rows 3, 4, 9).
2. Phase 1 as above, committed.
3. Tests first: `validateIR` on each new value, on the Conditional form, on end labels, and its negative controls (an unknown termination, a label with an unknown key must fail in the same run); compile round-trip with byte identity for a view without the new fields; a Conditional end resolved per instance (fixture: a reference view whose `targetEnd` is `erZeroOrMany` when `upperBound` is -1 and `erExactlyOne` otherwise, on two references of the same view); the line trim for hollow and filled ends; the end label anchors on the four sides. Mutation bench on the resolver and the trim; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: a `lane-run probe` on a free port (not 3000, 3001, 3003), Playwright, isolated profile, with a fixture viewpoint that draws every termination at both ends and a pair of end labels, light and dark, widths 1 and 2, on straight, orthogonal and curved edges; crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_edgeends_crops/`; the four demo scenes in the default viewpoint unchanged (pixel-identical before and after).
6. Commits: `feat:` code and tests, `docs:` report, R- rows, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the crop paths, the mutation score, the decisions taken (unattended) and the decisions awaiting Alfonso.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, Alfonso's browser, a call to an AI model.

## RIFERIMENTI

`EdgeTermination` and `EdgeViewIR.terminations` in `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`; `TERMINATION_OPTIONS` in `viewpoint/authoring/EdgeAuthoringPanel.tsx`; `hollowCircle` in `edges/UnifiedEdge.tsx` (the most recent end added, R-VP-24, the pattern to follow); `computeCardinalityAnchor` in `edgeUtils.ts`; `markerRegistry.ts` (vertex markers; the vertex `x` marker is a different concept, do not reuse its name).
