# Prompt: discovery, the classic Petri net notation in the derived viewpoint

Prompt-ID: P-2026-09-29-0925
Chat: C-2026-09-28-1936
Lane: discovery (read-only; the viewpoint derivation, the view IR, the symbol renderer). Tier: heavy.
Status: eseguito 2026-09-29 · lane discovery petri-notation-disc · report docs/discovery/discovery_2026-09-29_petri_notation.md · hard-stop, two decisions and five questions for Alfonso in §0

Worktree: `~/jjodel-w-petrinot`, branch `petri-notation-disc` (cut by the chat from `alfonso-frontend-jjtl` at `385807485`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-petrinot`, branch `petri-notation-disc`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso, 2026-09-29: the Petri nets should look like the classic textbook notation. His reference is a textbook figure (places p1..p8, transitions t1..t10, as in Murata-style drawings). What it shows, described by the chat:

- a place is a plain circle, white fill, thin dark stroke, no compartments; its name sits outside, to the upper left, in italic serif with a subscript index (`p₁`);
- a transition is a thin solid black bar (horizontal, about 4:1), no text inside; its name sits beside it, to the right or left;
- an arc is a thin dark line with a small filled arrowhead; arcs are straight when they can be, a smooth curve when they go around (`p₅` to the right bar to `p₁`);
- tokens (not in the image, standard notation): black dots inside the place, a number when there are more than a few.

Alfonso chose the scope: improve what «Derive viewpoint» produces for the Petri profile (the views derived for the classes bound to Place, Transition, Arc, Inhibitor arc), so that deriving a viewpoint on DemoPetri gives this look. Additive: the default notation, the other scenes and every existing view stay as they are; the demo script is not changed.

Goal: the facts to decide what the view IR and the renderer can already express, and a Phase 2 plan.

## DOVE (read-only)

- `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` and its test; `utils/deriveViewpoint.ts`; the IR types, validator and renderer (grep `fieldCompartments`, `form`, `labels`, `irVersion`); the Symbol Editor catalogue (forms, the solid-bar family); the edge IR (arrowheads, routing, curves).
- The four demo exports in `/Users/alfonso/jjodel-demo-exports/` (read only), DemoPetri above all.
- Report: `docs/discovery/discovery_2026-09-29_petri_notation.md`, opening with `## 0. Answer in brief`, at most 40 lines; plus this prompt's Status and a log entry in `docs/log-inbox/views.md`.

## COME

1. Read `CLAUDE.md` (§6, the discovery rules, critical zone), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-33, R-MCID-1, R-MCID-2, the Symbol Editor rows, and the viewpoint derivation discovery of 2026-09-29.
2. For each element of the list above, answer with [M]/[R] evidence and file:line: expressible today in the IR and rendered as asked (which fields); expressible but rendered differently (what the renderer does); not expressible without an IR change (which change, whether additive, whether it touches `irTypes.ts` or the critical zone). In particular: a label outside the shape and its position; a shape with no compartments and no header; the bar's size and orientation; token dots versus a number; arrowhead style; straight versus curved arcs.
3. Measure with gitignored `_tmp_*` scripts under `npx tsx` (no dev server): derive DemoPetri today and list, per derived view, what differs from the reference.
4. `Recommended:` a Phase 2 file list and order that reaches the reference as closely as possible with additive changes only, and what remains out of reach before the freeze (2026-10-01 evening). Name every point that is Alfonso's decision.
5. One docs commit (report, log entry, Status). Stop with `Outcome: hard-stop` (or `question`), the sha and §0.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file, product code.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-29_viewpoint_derivation.md`; R-MCID-1, R-MCID-2; the Symbol Editor 1b rows.
