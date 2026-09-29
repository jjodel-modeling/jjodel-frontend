# Prompt: Petri notation, lane 2 of 2: the name outside the shape, and the serif face

Prompt-ID: P-2026-09-29-1017
Chat: C-2026-09-28-1936
Lane: full (Phase 2, lane 2 of the Petri notation plan; view IR, additive; tests first). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-petri2`, branch `petri-notation-l2` (cut by the chat from `alfonso-frontend-jjtl` at `0fbb550ea`, after the merge of lane 1; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-petri2`, branch `petri-notation-l2`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Implement lane (2) of `docs/discovery/discovery_2026-09-29_petri_notation.md` §6, under R-VP-15 (ratified by Alfonso 2026-09-29): the name outside the shape and the serif face, then switch the Petri derivation to use them.

- `LabelPosition 'outside'` with `LabelSpec.anchor`: a label drawn outside the node's box, not clipped by the two `overflow: hidden` the report names; anchors at least `nw` and `e` (the discovery's list of anchors if it gives one). Place: `nw`. Transition: `e`.
- `FontFamilyToken 'serif'`: a serif face token next to `sans` and `mono`, mapped to a system serif stack (no web font, no new dependency). Petri names: italic serif.
- Additive only: widened unions and optional keys, no `irVersion` bump, `validateIR` accepts the new values (the report measured it does); every existing view renders byte-identical; the default notation, the other profiles and the demo scenes' readings are unchanged.

Alfonso approved editing the §3.1 files of `viewpoint/ir/` and `viewpoint/authoring/` for this lane (`irTypes.ts`, `irCompile.ts`, `IRNodeContent.tsx`, `irStyle.ts`, `shapeRegistry.ts`, `notationCatalog.ts`, as the report lists). Nothing in the critical zone (`useJjomSync.ts`, `portDistribution.ts`); if a change needs one, stop with `Outcome: question`.

Out of this lane: the thin `bar` form and the `hollowCircle` termination (lane 3), curved routing, subscripts, vertical bars.

## DOVE

- The files §6 lists for lane 2, exactly; list them before the first edit. Grep every new identifier and CSS class first.
- Closure: `docs/log-inbox/views.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (§6, Rule 11, §21.2, critical zone, SCSS and naming rules), `docs/PROTOCOL.md` P16, RC-15, RC-20..RC-22, RC-26, RC-33, RC-34, R-B9, R-VP-15, R-MCID-1, R-MCID-2, and the discovery end to end.
2. Baseline: typecheck count, vitest of the touched folders.
3. Tests first (red, then green): the IR accepts `outside` + anchor and `serif`; the compiled node places the label outside for each anchor and does not clip it; a view without the new keys compiles byte-identical to today (pin with digests on existing fixtures); the derived DemoPetri views carry Place `nw`, Transition `e`, italic serif; without roles the derivation is unchanged. Mutation bench on the new branches.
4. Gates: `npm run typecheck` (14, the known set), touched vitest folders green, full vitest with the 9 known reds only, `npm run build`, `check:docs` 4/4, `check:addonly`.
5. A lane probe on port 3048 (`lane-run probe`, never 3001), light theme: DemoPetri bound with the Petri preset, Apply, «Derive viewpoint», open its tab; crop the canvas at `sips -Z 600` under `docs/discovery/harness/_tmp_petri2_*.png` (gitignored); re-score the 19 traits, measured; confirm names are not clipped and do not overlap arcs at the demo layout (report any overlap). Then one existing viewpoint of another scene, unchanged.
6. Commits one per layer, then one docs commit (log entry, Status). Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the gates, the trait score and the crop path.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, dark-theme work, a new dependency, an `irVersion` bump.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-29_petri_notation.md` (§0, §5, §6); R-VP-15; the lane 1 commits `1cee1e7e4`, `3a1753b73`.
