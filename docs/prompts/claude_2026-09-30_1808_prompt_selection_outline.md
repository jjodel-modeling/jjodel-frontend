# Prompt: Phase 1 and 2 in cascade, missing cyan selection outline on selected IR-rendered nodes

Prompt-ID: P-2026-09-30-1808
Chat: C-2026-09-30-1806
Lane: fast (Phase 1 then Phase 2 in cascade, visual fix, no critical-zone go-ahead). Tier: heavy (settings pin).
Status: eseguito 2026-09-30 · lane selection-outline · 27a6b2d69 · non fuso: hard-stop, lane probe on 3083 (light) 24/24, unselected panes 0 px from c4846df0e, IR ring equal to the class card's and painted, box 0 px, mutation bench 5/5, crops in frontend/scripts/smoke/_tmp_selring_crops/ (gitignored), verifica visiva alla chat

Worktree: `~/jjodel-w-selring`, branch `selection-outline`, created from the trunk `alfonso-frontend-jjtl` at `c1e0376dc`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-selring`, branch `selection-outline`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso reported (screenshot, 2026-09-30): on a state/activity diagram rendered through a derived viewpoint (initial dot, `work`, `d1`, fork bar, `left`, `right`, join bar, final bull's-eye; guards `model.[count] < 2` and `model.[count] >= 2`), the node `work` is selected: its anchor points (the small grey port handles on top, bottom and right) are visible, but the node has no cyan selection outline (`#0ea5e9`, the outline every selected element normally shows). Its border stays the idle light grey. Only a faint light blue halo is perceptible, far from the standard selected look.

Expected: a selected node rendered by an IR view shows the same cyan selection outline as a selected native node, with no layout shift (outline or box-shadow, never a border width change), and the idle look stays byte-identical.

Root cause first: find why the selection class or style does not reach the painted shape (candidates: the IR renderer paints its own border on an inner element that covers or replaces the wrapper outline; the selected class is applied to a wrapper whose outline is clipped or `overflow: hidden`; a CSS specificity override from the IR shape's inline style; the selection state not propagated to IR-rendered nodes at all). Say which, with file and line.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-09-30_selection_outline.md` (naming `discovery_<date>_<description>.md`): the selection styling path for native nodes and for IR-rendered nodes, the root cause, the smallest fix, what else would move, questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade unless a question has no single recommendation, the fix needs a critical-zone file (CLAUDE.md §3.2: stop with `Outcome: hard-stop` and the Layer Impact Report, no edit), or the default viewpoint would change.

Phase 2: the files the report names for the fix (expected: one renderer component or its SCSS under `frontend/src/components/editor-v2/`), their tests; a log entry in `docs/log-inbox/views.md`; this prompt's Status. More than three files, or anything outside `editor-v2/`: stop and ask.

## COME

1. Read `CLAUDE.md` (§3, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34.
2. Phase 1 report, committed. Before introducing any new CSS class or identifier, grep the codebase to prove it is unused.
3. Tests first where the code allows it (a selected IR node carries the selection class or style on the painted element; an unselected one does not; a selected native node unchanged).
4. Implement the minimal fix. Gates: typecheck (the known baseline errors only), full vitest (the known reds at import only), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme: a derived-viewpoint diagram with the node selected (DemoFlowB as Activity (UML) or the state diagram of the report) and a native node selected in the default viewpoint; measure from the DOM the computed outline or box-shadow color of the selected shape (must resolve to `#0ea5e9` / `rgb(14, 165, 233)`) and that the node's bounding box is unchanged between selected and unselected (0 px). Crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_selring_crops/`; the default viewpoint scenes 0 px from `c1e0376dc` when nothing is selected.
6. Commits: `fix:` code and tests, `docs:` report, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the root cause in one line, the decisions taken (unattended) and awaiting Alfonso.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree (no `/tmp` either), a call to an AI model, renaming an existing CSS class or identifier, changing the default viewpoint, a border-width change on selection.

## RIFERIMENTI

Screenshot from Alfonso, 2026-09-30 18:05 (node `work` selected, handles visible, no cyan outline). Design tokens: selection cyan `#0ea5e9`, slate `#334155`. Related unmerged lane touching node sizing: `viewpoint-notations` (P-2026-09-30-1720, `nodes/nodeSizing.ts`, `markerRegistry.ts`): do not edit those two files.
