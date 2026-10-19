# Gallery previews readable at card size (L-C2)

Prompt-ID: P-2026-10-19-1651
Lane: full (build script change, seven binaries rewritten under SNAP_REWRITE)
Depends: P-2026-10-19-1617 (`snap-gallery.ts`, merged on `tpl-int`)
Chat: C-2026-10-19-1501
Front: notation-library
Status: eseguito 2026-10-19 · lane tpl-c2 · f120bd3cf · visual check owed to the chat (RC-23)
Corregge: P-2026-10-19-1617 (template previews land at 16–23 % in the card and are unreadable: measured by the lane, confirmed by the chat's visual check at 1440×900 on `tpl-int`)
Request: Alfonso, 2026-10-19 16:09, in the project chat: «Si velocissimo», on the lanes of P-2026-10-19-1510

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-tpl-c2`, branch `tpl-c2`, created by the chat from `tpl-int` plus this prompt. Dev server for the script: `npm start -- --port 3096 --strictPort`, stopped before the end.

Model and tier: as `lane-run` decides; effort `high`. Time limit 60 minutes.

## Lane discipline

Every reply opens with `[P-2026-10-19-1651 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Before anything else: `pwd`, branch and `git log -1` match the Worktree line; otherwise `Outcome: blocked`.

## Context

The five template previews (metamodels) fit the whole diagram into 300×136 and land at 16–23 %: faint lines, no readable name. The two example previews (42 %, 53 %) read well and stay as they are. The chat rejects the variant C fallback proposed in the L-C section: it would turn four of the five starters into lists and drop the variant D look Alfonso chose.

## COSA

1. In `frontend/scripts/library/snap-gallery.ts`, for templates only: capture a crop instead of the whole diagram. The crop has the card aspect (300:136) and a scale of at least 45 % when shown at 300×136, so class names read at about 6 px or more. Choose the crop around the root class (the container that owns the most containment references; tie: the first class) and its direct neighbours, keeping whole nodes inside the frame where possible; nodes cut by the edge are acceptable, a node cut through its name is not.
2. Rewrite the five template PNGs (`SNAP_REWRITE` for each), leave the two example PNGs untouched (verify by sha256 before and after).
3. Report, per template: the root class chosen, the scale, the classes fully inside the crop.

## DOVE

`frontend/scripts/library/snap-gallery.ts`, `frontend/public/library/gallery/{library,shapes,graph,state-machine,families-persons}/1.preview.png`; closing docs as below.

## Gates

`check:scripts`, `check:docs`, the negative control without `SNAP_REWRITE` (refuses all seven), the five PNGs shown inline in the report section.

## Closing (P13, RC-17), explicit pathspecs, no push

Code commits with `(P-2026-10-19-1651)` suffix, trailer `Model:` (P6). Then one docs commit: a section «P-2026-10-19-1651» appended to `docs/discovery/discovery_2026-10-19_templates_notations_file_new.md`, one entry in `docs/log-inbox/templates-ui.md`, this prompt's `Status:` flipped to `eseguito 2026-10-19 · lane tpl-c2 · <sha> · visual check owed to the chat (RC-23)`. Then `Outcome: done`.

## NON FARE

No file outside DOVE; no catalog, package or page change. No push.

## HARD STOP

None before the closing commit.
