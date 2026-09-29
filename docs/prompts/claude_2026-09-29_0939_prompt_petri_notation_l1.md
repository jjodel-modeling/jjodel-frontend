# Prompt: Petri notation, lane 1 of 2: the derivation and the token dots

Prompt-ID: P-2026-09-29-0939
Chat: C-2026-09-28-1936
Lane: full (Phase 2, lane 1 of the Petri notation plan; tests first). Tier: heavy.
Status: eseguito 2026-09-29 · lane petri-notation-l1 · 1cee1e7e4, 3a1753b73 · non fuso: hard-stop, lane probe 11/11 on 3048 (light), traits 11/19, run readings equal to the trunk's, crop in docs/discovery/harness/_tmp_petri1_canvas.png (gitignored), verifica visiva alla chat

Worktree: `~/jjodel-w-petri1`, branch `petri-notation-l1` (cut by the chat from `petri-notation-disc` at `f9c1b8d52`, which is the trunk `385807485` plus the discovery; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-petri1`, branch `petri-notation-l1`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Implement lane (1) of `docs/discovery/discovery_2026-09-29_petri_notation.md` §6 (on this branch): the derivation, and the `dots-2`, `dots-3`, `dots-4` rows in `markerRegistry.ts`. Alfonso, 2026-09-29, ratified every recommendation of the report (quote: «Sì, tutte»), and approved lanes 1 and 2 before the freeze; lanes 3 and 4 only if lane 2 is on the trunk by 2026-10-01 12:00:

- the persisted names: `LabelPosition 'outside'` with `LabelSpec.anchor` (Place `nw`, Transition `e`), `FontFamilyToken 'serif'`, `ShapeForm 'bar'`, `EdgeTermination 'hollowCircle'`, markers `dots-2`, `dots-3`, `dots-4`;
- tokens of the initial marking as dots up to 4, a number from 5, the run's badge unchanged;
- every Petri arc `straight`;
- ink `var(--color-inode-name)` for place borders, arcs and arrowheads; the bar keeps `#334155`;
- with no role binding, the derivation keeps today's boxes (the notation is keyed on the Petri profile).

Record this as one row in `docs/decisions.md`, next to the viewpoint rows (the next free `R-VP-n`; grep), header exactly in this form: `- **R-VP-n** (2026-09-29, ratified by Alfonso 2026-09-29, evidence: measured, verified: none, reversible: branch).`, body citing the discovery and the list above. This lane uses only the parts that belong to lane 1; the row covers both lanes.

Lane 1 touches no `viewpoint/ir/` or `viewpoint/authoring/` file other than the marker rows the report names (Alfonso's go-ahead covers them). Lane 2 (outside label, serif) is a separate prompt after this merges.

## DOVE

- The files the report's §6 lists for lane 1, exactly; `docs/decisions.md` (the row, add-only).
- Closure: `docs/log-inbox/views.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (§6, Rule 11, §21.2, critical zone, naming), `docs/PROTOCOL.md` P16, RC-15, RC-20..RC-22, RC-26, RC-33, RC-34, R-MCID-1, R-MCID-2, R-B9, the R-VP rows, and the discovery end to end. Grep every new identifier first.
2. Baseline: typecheck count, vitest of the touched folders.
3. Tests first (red, then green): on DemoPetri with the Petri roles bound, the trait table of the report (§5) for the lane 1 traits; `dot`/`dots-2..4`/number from 5; straight arcs; the ink; without roles, the output is unchanged from today (byte-equal documents); every document passes `validateIR`. Mutation bench on the new branches.
4. Gates: `npm run typecheck` (14, the known set), touched vitest folders green, full vitest with the 9 known reds only, `npm run build`, `check:docs` 4/4 (the row parses in `docs:digest`), `check:addonly`.
5. A lane probe on port 3048 (`lane-run probe`, never 3001), light theme: import DemoPetri, bind with the Petri preset, Apply, «Derive viewpoint», open its tab; crop the canvas at `sips -Z 600` under `docs/discovery/harness/_tmp_petri1_*.png` (gitignored); re-score the 19 traits, measured. Then run the scene as the demo script does and confirm the run readings are unchanged.
6. Commits one per layer, then one docs commit (row, log entry, Status). Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the gates, the trait score and the crop path.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree (the demo exports included), a critical-zone file, dark-theme work, a new dependency.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-29_petri_notation.md` (§0, §5, §6); `docs/discovery/discovery_2026-09-29_viewpoint_derivation.md`; R-VP rows; R-B9.
