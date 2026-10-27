# Prompt: the corners of an IR rect symbol on an M1 node are clipped at rest

Prompt-ID: P-2026-10-01-2336
Chat: C-2026-10-01-2336
Lane: fast (one SCSS rule, root cause already read by the chat). Phase 1 short, then Phase 2 in cascade. Tier: light.
Status: eseguito 2026-10-02 · lane ir-corner-clip · 0070222d8, 12800ede4 · Q1 adopted as recommended (irSelectionRing.test.ts in scope) · verifica visiva della chat sui crop OK (corners whole at rest, resting shadow, hover anchors whole), GO di Alfonso al merge 2026-10-02
Worktree: `~/jjodel-w-irclip`, branch `ir-corner-clip`, created from the trunk `alfonso-frontend-jjtl` at `4b9bc5836`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-irclip`, branch `ir-corner-clip`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso, on the trunk, sees an M1 node drawn with the `rect` symbol (an Activity action, `Action_0`) whose four corners fade out: the 1px border thins and breaks where the straight sides turn. Selecting the node brings the corners back.

Reading of the chat, to be confirmed by measurement, not assumed:

- `frontend/src/components/editor-v2/nodes/instanceNode.scss:22-28`: `.mm-node.mm-object` has `overflow: hidden` and `border-radius: 8px`, plus a 1px border. The clip is therefore the padding box with a 7px radius.
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts:73`: `.ir-node-content` fills that padding box with `border-radius: 4px` (the `rect` base radius, `baseCornerRadius` in `shapeRegistry.ts`). Its border arc lies outside the wrapper's 7px clip arc, so the corners of the stroke are cut. An authored radius of 0 is cut even more; a radius of 7 or more (the `rounded` form at 10px, the Activity action at 14px) escapes it. Polygon forms whose vertices sit on a box corner (`parallelogram`) should be cut the same way.
- `instanceNode.scss:688-690` already lifts the clip with `&.selected:has(> .ir-node-content) { overflow: visible; }`, which is why selection restores the corners. The comment there says the IR branch mounts no accent bar, so there is nothing to clip.
- Side effect of the same clip: the resting shadow `irStyle.ts` gives `.ir-node-content` (`box-shadow: 0 1px 3px ..., 0 4px 12px ...`) never shows at rest on M1 nodes, and appears on selection. M2 IR nodes (`.mm-node` without `.mm-object`, overflow unset) already show it at rest.

Fix, as recommended by the chat: lift the clip for every wrapper that hosts IR content, not only the selected one, i.e. turn the rule at `instanceNode.scss:688` into `&:has(> .ir-node-content) { overflow: visible; }` and rewrite its comment (English) to say why: the shape inside carries its own radius, clip and shadow, and the wrapper's 7px clip cut its corners. Result: rest and selection differ only by the ring and band, and M1 IR nodes match M2 IR nodes. If the measurement shows that something else inside the wrapper now spills out at rest (a child wider than the box, a label, a handle), stop with `Outcome: question` and a `Recommended:`, do not patch around it.

## DOVE

Phase 1 (read-only, short): report `docs/discovery/discovery_2026-10-01_ir_corner_clip.md` with `## 0. Answer in brief` first (under 40 lines), objective, files read (full paths), the measurement that confirms or refutes the reading (computed styles of the wrapper and of `.ir-node-content`, and crops), risks, questions with `Recommended:`. Commit it (`docs:`), then Phase 2 in cascade.

Phase 2: `frontend/src/components/editor-v2/nodes/instanceNode.scss` only (expected one rule and its comment), a log entry in `docs/log-inbox/views.md`, this prompt's Status. No other file. `irStyle.ts`, `shapeRegistry.ts`, the Symbol Editor preview and every critical-zone file are out of scope; if the preview in the Symbol Editor modal shows the same defect, record it in the report as a ticket, do not fix it here.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, then the two style sources above.
2. Measure with `lane-run probe` on a free port (not 3000, 3001, 3003), light theme, isolated profile: a model with an IR viewpoint showing M1 nodes in the forms `rect` (base radius, authored 0, authored 4), `rounded`, `parallelogram`, `hexagon`, `diamond`, `stadium`, `ellipse`; one Activity (UML) derived viewpoint (action at 14px). For each node, at rest and selected: computed `overflow`, `border-radius` of the wrapper and of `.ir-node-content`, and a 4x zoomed crop of the top-left corner. Report, committed.
3. Implement the one-rule change.
4. Gates: typecheck (the known count), vitest on `editor-v2` (the known reds at import only), build exit 0, `check:docs`, `check:addonly`.
5. Visual after the fix, crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_irclip_crops/` (gitignored): every corner of the forms in step 2 drawn whole at rest; rest and selected identical outside the ring and band (pixel diff of the corner crops, report the counts); the resting shadow now visible at rest on M1 IR nodes, same as an M2 IR node; M2 nodes and non-IR M1 nodes (classic `.mm-object` with accent bar) 0 px from `4b9bc5836`; the four demo scenes in the default viewpoint 0 px from `4b9bc5836` except the expected corner and shadow pixels, listed.
6. Commits: `fix:` the SCSS, `docs:` report, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the before/after corner crops, the diff counts, the decisions adopted.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, Alfonso's browser, a call to an AI model.

## RIFERIMENTI

`instanceNode.scss` (`.mm-node.mm-object` lines 22-28, selected lift lines 682-690); `irStyle.ts` lines 65, 73, 83, 149; `shapeRegistry.ts` (`baseCornerRadius`, `resolveCornerRadius`, slice 3 of Symbol Editor 1b, D5); P-2026-09-30-1720 (Activity action radius 14).
