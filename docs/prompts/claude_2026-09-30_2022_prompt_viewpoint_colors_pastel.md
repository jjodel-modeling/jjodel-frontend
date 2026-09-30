# Prompt: Phase 1 and 2 in cascade, «Color by metaclass» v2: pastel palette, per-metaclass colour editing, reference-aware assignment

Prompt-ID: P-2026-09-30-2022
Chat: C-2026-09-30-1815
Lane: full (persisted field extended, panel UI, palette algorithm; Phase 1 then Phase 2 in cascade; critical zone only if the report proves it necessary, Layer Impact Report first, go-ahead RC-30 given at launch). Tier: heavy.
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Corregge: 2026-09-30 18:15

Worktree: `~/jjodel-w-vppastel`, branch `viewpoint-colors-pastel`, created from the trunk `alfonso-frontend-jjtl` at `31999a630`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-vppastel`, branch `viewpoint-colors-pastel`, `git log -1` is the docs commit that added this prompt, `git status` clean; otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-09-30-2022 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Alfonso may be away (lane auto): the chat answers questions inside this lane's perimeter as recommended (RC-21, RC-25).

## Contesto (non rifare l'analisi)

«Color by metaclass» is on the trunk (P-2026-09-30-1815, merge `524bdd3f1`): toggle, «Base color», «Border»; field `metaclassColoring { enabled, baseColor, border }` on the viewpoint; `metaclassPalette.ts` (analogous hues around the base, R-VP-29); WCAG black/white text; selected header keeps the fill (R-VP-30); rows R-VP-27..31 provisional unattended. Read that lane's report and addendum (`docs/discovery/discovery_2026-09-30_viewpoint_metaclass_colors.md`) instead of rediscovering the render path.

Alfonso's review (2026-09-30, 20:15): (1) the colours must be pastel; (2) show the metaclasses in a dropdown and, beside it, a visual list of colours, so the colour of each metaclass can be changed; (3) choose the best colour considering the colours of the source and the target (of the references between metaclasses).

Decisions taken by the chat (provisional, unattended; amend the lane's own R-VP rows or add R-VP-32.., next free number on the trunk):

1. **Pastel palette.** A fixed set of 12 pastel swatches evenly spaced in hue (every 30°), HSL S 55..70 %, L 82..88 %, tuned so that adjacent swatches stay distinguishable (ΔE76 ≥ 10 between any two). With pastel fills the WCAG rule gives black text on all of them; keep the rule, do not hard-code black. Border on: same hue, L 55 %, 1 px. «Base color» stays as the seed: the swatch nearest in hue to the base colour is the first one used.
2. **Reference-aware assignment (Alfonso's point 3).** Build the undirected graph of metaclasses where two classes are adjacent when a reference (containment included) or a generalization connects them, in either direction. Assign swatches greedily in metamodel order: each class gets the free swatch that maximises the minimum hue distance to the swatches already assigned to its neighbours (source and target of its references), ties broken by distance from the seed and then by swatch order. Classes with no neighbours follow the analogous order around the seed. Deterministic, pure function in `metaclassPalette.ts` (or a sibling module): input metaclass ids in order, adjacency, seed, overrides; output id → colour.
3. **Per-metaclass editing.** In the viewpoint panel, under the toggle: a dropdown with the metaclasses of the metamodel (name, with a small swatch of the current colour), and beside it the row of the 12 pastel swatches; clicking a swatch sets that metaclass's colour; the current one is marked (outline in #334155). A «Reset» link (text button, 11 px) removes the override of the selected metaclass; «Reset all» removes every override. An override wins over the automatic assignment; the automatic assignment of the other classes accounts for overridden neighbours. Persisted as an optional map `overrides?: Record<string, string>` inside `metaclassColoring`, keyed by the metaclass id (not the name); an override pointing at a deleted metaclass is ignored, not an error. Undo/redo like the other fields. Only the 12 swatches are offered (no free picker per class), to keep the scheme pastel. No layout shift in the panel: the swatch row has a fixed height, and the dropdown has a fixed width with ellipsis.
4. Edges are not coloured (out of scope); say in the report whether colouring edges by source/target would be cheap, as a ticket.

## COSA

Items 1 to 3 end to end, with tests; the rest of the feature unchanged.

## DOVE

Phase 1 (read-only, short): report `docs/discovery/discovery_2026-09-30_viewpoint_colors_pastel.md` (naming `discovery_<date>_<description>.md`): how to read references, containments and generalizations of the metamodel from where the resolver runs (file:line), how metaclass ids are stable across reloads, the panel's existing dropdown component or class to reuse (grep first), the Phase 2 file list with a size estimate, critical-zone involvement, questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 unless a question has no single recommendation or the list exceeds eight source files.

Phase 2: `metaclassPalette.ts` and its test, the resolver, `ViewpointProperties.tsx`, `properties.scss`, the field declaration (additive optional only), their tests; a log entry in `docs/log-inbox/views.md`; the R-VP rows; this prompt's Status.

Out of scope: edge files, `irTypes.ts`, `irValidate.ts`, `irCompile.ts`, `notations.ts`, `viewpointDerivation.ts`, `deriveViewpoint.ts`, demo projects, `docs/CHANGELOG.md`, jjodel-docs.

## COME

1. Read `CLAUDE.md` (§3.1, §3.2, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, R-VP-27..31.
2. Phase 1 report, committed. Grep every new identifier, class or field name first.
3. Tests first: 12 swatches pastel (S, L in range) and pairwise ΔE76 ≥ 10; black text on all; seed picks the nearest swatch; for a chain A→B→C and a star, adjacent classes never share a swatch while free swatches remain and their hue distance is maximal under the greedy rule; determinism; overrides win and neighbours adapt; an override on a missing id is ignored; round trip of `overrides` through save/load. Mutation bench on the palette and resolver; report the score.
4. Implement. Gates: typecheck (known baseline), full vitest (known reds at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme. DemoESM and DemoFlowB with the toggle on: every pair of nodes whose metaclasses are connected by a reference has different fills (measure from the DOM, list the pairs); override one metaclass from the panel and measure its nodes; Reset restores the automatic colour; toggle off gives 0 px from `31999a630`; node boxes 0 px; the panel with the dropdown open and the swatch row. Crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_vppastel_crops/` (gitignored). The four demo scenes in the default viewpoint 0 px from `31999a630`.
6. Commits: `feat:` code and tests, `docs:` report, rows, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the mutation score, the decisions taken (unattended) and those awaiting Alfonso.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, Alfonso's browser or ports 3000/3001/3003, a call to an AI model.

## HARD STOP

After Phase 2 commits and the visual measures: `Outcome: hard-stop` (visual check due).

## RIFERIMENTI

P-2026-09-30-1815 and its report; `metaclassPalette.ts`; `ViewpointProperties.tsx`; R-VP-27..31.
