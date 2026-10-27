# Prompt: Petri notation, lane 2 (revised by Alfonso): no token marks, centred names, a small transition, Manhattan arcs

Prompt-ID: P-2026-09-29-1021
Chat: C-2026-09-28-1936
Lane: full (Phase 2, Petri notation in the derived viewpoint; tests first). Tier: heavy.
Status: eseguito 2026-09-29 · lane petri-notation-l2b · 449c583b6, 7a254a52f · non fuso: hard-stop, lane probe 21/21 on 3048 (light), bar 48×12 against a place 64×64, names centred within 0.45 px, arcs orthogonal 6/6, run readings equal to the trunk's, crops in docs/discovery/harness/_tmp_petri2b_*.png (gitignored), verifica visiva alla chat

Worktree: `~/jjodel-w-petri2b`, branch `petri-notation-l2b` (cut by the chat from `alfonso-frontend-jjtl` at `0fbb550ea`, after the merge of lane 1; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-petri2b`, branch `petri-notation-l2b`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Lane 1 (R-VP-15, merged `0fbb550ea`) changed the Petri views that «Derive viewpoint» produces. Alfonso looked at it on 2026-09-29 and revised the plan (his words, verbatim):

> 2. remove the initial markers (eg in p1 and lock)
> 3. the text must be always centered
> 4. the transition must be much smaller in size
> 5. the edges should be using manhattan

This replaces the old lane 2 (outside label, serif), which is dropped, and takes the size part of lane 3. In the derived Petri views:

1. **No token marks.** Remove the marker rules (`dot`, `dots-2..4`) and the centre count label from the derived Place. Keep the three registry rows added by lane 1 (additive, harmless; do not remove persisted vocabulary).
2. **Names always centred** on the shape, for places and transitions, horizontally and vertically, and never clipped. Keep italic and the ink of R-VP-15; no serif, no outside label.
3. **A much smaller transition**: a thin solid bar, about 4:1, clearly smaller than a place (today a rect is floored at 140×40 in a 200 px wrapper, per the discovery §0). The name stays centred on it; if the bar is too small to hold the name, the name is centred on the bar and drawn over it without clipping. Use the smallest additive change: a size on the derived view or a `bar` form, whichever the discovery §6 lane 3 names; say which you chose and why.
4. **Manhattan arcs**: drop `routing: 'straight'` from Petri arcs, so they use the default orthogonal router (`irTypes.ts:598`). Keep the thin line, ink and the small filled arrowhead; the inhibitor keeps its termination.

Record this as a row **R-VP-16** in `docs/decisions.md` after R-VP-15, amending it, header exactly: `- **R-VP-16** (2026-09-29, ratified by Alfonso 2026-09-29, evidence: read, verified: none, reversible: branch).` Body: his four points quoted, what they replace in R-VP-15 (token dots, straight arcs, the planned outside label and serif), and the choice for point 3.

Alfonso's go-ahead on the §3.1 files of `viewpoint/ir/` and `viewpoint/authoring/` (2026-09-29) covers this lane. Additive only, no `irVersion` bump; every existing view renders byte-identical; without roles the derivation is unchanged; the default notation and the demo scenes' readings are unchanged. Nothing in the critical zone; if needed, stop with `Outcome: question`.

## DOVE

- `viewpoint/derive/viewpointDerivation.ts` and its test; the §3.1 files point 3 needs (list them before the first edit); `docs/decisions.md` (the row, add-only). Grep every new identifier and class first.
- Closure: `docs/log-inbox/views.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (§6, Rule 11, §21.2, critical zone, SCSS and naming rules), `docs/PROTOCOL.md` P16, RC-15, RC-20..RC-22, RC-26, RC-33, RC-34, R-B9, R-VP-15, and `docs/discovery/discovery_2026-09-29_petri_notation.md`.
2. Baseline: typecheck count, vitest of the touched folders.
3. Tests first (red, then green): derived DemoPetri has no marker rules and no count label; names centred on place and transition; the transition's rendered box is a thin bar much smaller than a place; Petri arcs carry no `routing` (orthogonal); without roles the documents match the lane 1 digests; existing views byte-identical. Mutation bench on the new branches.
4. Gates: `npm run typecheck` (14, the known set), touched vitest folders green, full vitest with the 9 known reds only, `npm run build`, `check:docs` 4/4 (the row parses in `docs:digest`), `check:addonly`.
5. A lane probe on port 3048 (`lane-run probe`, never 3001), light theme: DemoPetri bound with the Petri preset, Apply, «Derive viewpoint», open its tab; crop at `sips -Z 600` under `docs/discovery/harness/_tmp_petri2b_*.png` (gitignored); measure the bar's box against a place's, the name's centre against the shape's centre (both, px), and that arcs are orthogonal. Then run the scene as the demo script does: readings unchanged.
6. Commits one per layer, then one docs commit (row, log entry, Status). Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the gates, the measurements and the crop path.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, dark-theme work, a new dependency, an `irVersion` bump.

## RIFERIMENTI

- R-VP-15; the discovery (§0, §5, §6); lane 1 commits `1cee1e7e4`, `3a1753b73`.
