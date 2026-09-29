# Prompt: F3, render the collapsed graphVertex as declared (form, fill, badge)
Prompt-ID: P-2026-09-29-2122
Chat: C-2026-09-29-1840
Lane: full (Phase 2; critical zone `viewpoint/ir/` and the IR node, go-ahead given). Tier: heavy.
Status: da eseguire
Worktree: `~/jjodel-w-collapsed`, branch `ir-collapsed-render` (cut by the chat from `alfonso-frontend-jjtl` at `5626b3364`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run` with `--critical-zone-goahead P-2026-09-29-2122`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-collapsed`, branch `ir-collapsed-render`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-2122 · session <id>]` and ends with an `Outcome:` line (P16).

## COSA

Alfonso, 2026-09-29, ratified lane F3 of the discovery `docs/discovery/discovery_2026-09-29_ir_authoring_freeze.md` (commit `a50fa6607` on `ir-freeze-disc`; read it with `git show a50fa6607:...`) and gave the **critical-zone go-ahead (RC-30)** for it. Finding (point 2): `containment.collapsed.form`, `.fill` and `.badge` are compiled (`irCompile.ts:463-465`) and read nowhere; collapsed, a `graphVertex` keeps its expanded form (`ir-shape--rounded`), shows a count chip «4», and the declared badge (`bi-box-seam`) appears 0 times.

Decision the discovery left open, taken by the chat (inside the perimeter, recorded for Alfonso's morning digest): **the code's flat fields** (`collapsed.form`, `collapsed.fill`, `collapsed.badge`, as in `irTypes.ts` and the validator), not the spec's `collapsed.shape: Partial<Shape>` (IR v1.2 §8). No schema change, no migration. Write in the report a proposed amendment line for §8 (flat fields are the contract) as a question for Alfonso; do not edit `docs/spec/` or `docs/decisions.md`.

Behaviour: when a `graphVertex` is collapsed, the node renders `collapsed.form` and `collapsed.fill` when declared (each falls back to the expanded value when absent); when `collapsed.badge` is declared and visible, it replaces the count chip; when absent, the count chip stays as today.

## DOVE

- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (around `:912`, `:943-963`), `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (around `:206`, `:521`); read `IRContainmentHulls.tsx`, `irCollapseState.ts`, `irContainment.ts`.
- Layer Impact Report `docs/discovery/discovery_2026-09-29_collapsed_render_layer_impact.md` before the code commit.
- Log entry in `docs/log-inbox/views.md`, this prompt's Status.

## COME

1. Read `CLAUDE.md` (§3.1, the critical zone), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-23, RC-30, the discovery §0 point 2 and §6 F3.
2. Red first: a render test with a collapsed `graphVertex` declaring `form: 'cylinder'`, a fill and a badge: today the markup has `ir-shape--rounded` and the chip; record it.
3. Layer Impact Report (docs commit), then the fix, minimal diff, no refactor, no renamed identifier or CSS class; new classes checked with a global grep.
4. Gates from `frontend/`: typecheck at the §17 baseline, `typecheck:scripts` exit 0, vitest 0 failed (expected total stated first), build ok.
5. Visual evidence for RC-23: a lane probe (port 3060, never 3001) with the discovery's fixture (VP1 Shapes: `B` as a collapsible `graphVertex` with `collapsed: { form: 'cylinder', fill: '#e2e8f0', badge: { icon: 'bi-box-seam', position: 'tr', visible: true } }`), crops expanded and collapsed saved under `~/.jjodel-lanes/P-2026-09-29-2122/crops/`, plus a collapsed `graphVertex` without `collapsed` (control: unchanged from today).
6. Commits: the Layer Impact Report; `feat(ir): render the declared collapsed form, fill and badge (P-2026-09-29-2122)`; one docs commit with the log entry and Status `eseguito <date> · lane ir-collapsed-render · <sha> · non fuso`. Pathspec after `--`.
7. Stop with `Outcome: hard-stop`, the shas, the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, `useJjomSync.ts`, `portDistribution.ts`, `docs/spec/`, `docs/decisions.md`.

## RIFERIMENTI

- Discovery `a50fa6607` §0 point 2 and §6 F3; IR spec v1.2 §8; RC-23, RC-30; `docs/PROTOCOL.md` P9, P14, P16.
