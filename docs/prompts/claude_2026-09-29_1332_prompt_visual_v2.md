# Prompt: visual lane V2, legibility of the default notation (M2 header text, edge ink, M1 underline, generalization arrow)

Prompt-ID: P-2026-09-29-1332
Chat: C-2026-09-28-1936
Lane: full (Phase 2 of the visual concrete syntax discovery, lane V2; renderer and styles; tests first where testable). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-v2`, branch `visual-v2` (cut by the chat from `alfonso-frontend-jjtl` at `afa951c64`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-v2`, branch `visual-v2`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Implement lane V2 of `docs/discovery/discovery_2026-09-29_visual_concrete_syntax.md` (branch `visual-syntax-disc`; read it with `git show visual-syntax-disc:docs/discovery/discovery_2026-09-29_visual_concrete_syntax.md`), §5. Alfonso, 2026-09-29, approved V2 **before the freeze**, knowing it changes every demo screenshot. The measured defects (§0 of the report):

- M2 class headers: white text on `#7bafd4`, 2.4:1 (abstract 2.1:1). Make the header text dark (the design system's slate, `#334155`, or darker via an existing token; grep), reaching at least 4.5:1 on the header fill for concrete and abstract classes; keep the fill.
- Every edge outside Petri: `#94a3b8` on the `#f1f5f9` canvas, 2.34:1. Use a darker ink from the existing tokens reaching at least 3:1 (graphics) and ideally the Petri ink (`var(--color-inode-name)`), for default-notation edges; arrowheads follow the line.
- M1 quiet text (`[k]`, `—`), 1.48:1: raise to at least 3:1 with an existing token.
- The UML underline of `name : Class` on M1 objects: computed but not painted (`.mm-object__name`): make it paint.
- The generalization arrow in M2 paints as a downward «V» under the parent, its base hidden by the box: make the hollow triangle visible at the parent's edge, as UML draws it. If the fix reaches `portDistribution.ts` or `useJjomSync.ts` (critical zone), stop with `Outcome: question` and a `Recommended:` line instead.

Light theme only; tokens, no hard-coded colours where a token exists (grep; do not invent tokens unless none fits, then say so). No change to derived viewpoints (lane V1 runs in parallel on `viewpointDerivation.ts`: do not touch it), no change to Petri views.

Record a row **R-VP-18** in `docs/decisions.md` after the last R-VP row on this branch (grep; V1 adds R-VP-17 in parallel: use R-VP-18), header exactly: `- **R-VP-18** (2026-09-29, ratified by Alfonso 2026-09-29, evidence: measured, verified: none, reversible: branch).` Body: the five fixes with before/after contrast ratios.

## DOVE

- The files the report's §5 names for V2 (list them before the first edit; styles and the default M2/M1 notation, the edge renderer's default ink, the generalization marker); `docs/decisions.md` (the row, add-only).
- Closure: `docs/log-inbox/views.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (§6, Rule 11, §21.2, critical zone, SCSS and naming rules, design system), `docs/PROTOCOL.md` P16, RC-15, RC-20..RC-22, RC-33, RC-34, and the discovery end to end.
2. Baseline: typecheck count, vitest of the touched folders; crops «before» for the four demo scenes' M2 and M1 (default notation).
3. Tests where the value is testable (style tokens, class output); measured contrast by the probe otherwise.
4. Gates: `npm run typecheck` (14, the known set), touched vitest folders green, full vitest with the 9 known reds only (a `laneRun.test.ts` 5 s timeout under load is known: re-run that file alone and report), `npm run build`, `check:docs` 4/4, `check:addonly`.
5. A lane probe on port 3055 (`lane-run probe`, never 3001), light theme, 1600×1000; setup per the trunk (use `~/.jjodel-lanes/probe-kit/simgate/` and adapt): for the four demo scenes, M2 and M1 in the default notation: computed colours and contrast ratios before/after, the underline painted, the generalization triangle visible (DemoPetri has `Place`/`Transition` under `PNode`; say which scene shows one); crops at `sips -Z 600` under `docs/discovery/harness/_tmp_v2_*.png` (gitignored), before and after. Then run the four scenes as the demo script does: the run readings unchanged.
6. Commits one per layer, then one docs commit (row, log entry, Status). Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the gates, the ratios and the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, `viewpointDerivation.ts`, dark-theme work, a new dependency.

## RIFERIMENTI

- The visual concrete syntax discovery (§0, §5); the design system in `CLAUDE.md`.
