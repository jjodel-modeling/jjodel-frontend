# Gallery preview snapshots (L-C)

Prompt-ID: P-2026-10-19-1617
Lane: full (new build script driving headless Chromium, seven binaries)
Depends: P-2026-10-19-1510 (branch `tplui-disc`, report §4)
Chat: C-2026-10-19-1501
Front: notation-library
Status: da eseguire
Corregge: none (new work)
Request: Alfonso, 2026-10-19 16:09, in the project chat: «Si velocissimo», on the lanes and the Q3/Q4 recommendations of P-2026-10-19-1510

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Worktree: `~/jjodel-w-tpl-c`, branch `tpl-c`, created by the chat from `tplui-disc` plus this prompt. Dev server for the script: `npm start -- --port 3096 --strictPort`, stopped before the end.

Model and tier: as `lane-run` decides; effort `high`. Time limit 90 minutes.

## Lane discipline

Every reply opens with `[P-2026-10-19-1617 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list; decisions you take go in a «Decisions taken (unattended)» list in your report section. Read `docs/decisions.md`, the logs and every file above 500 lines with `offset`/`limit` or `rg`, never whole. Before anything else: `pwd`, branch and `git log -1` match the Worktree line; otherwise `Outcome: blocked`. `frontend/node_modules` is a symlink (P14), leave it. Before introducing any new identifier (class, token, export, event) `rg` it under `frontend/src` (CLAUDE.md, name check); use the `tpl-` page prefix where the report §5 says the plain name is taken.

## Sources (read first)

- `docs/design/claude_2026-10-19_design_handoff_templates_notations_file_new.md` (the handoff; artboards on the Design canvas «Jjodel Templates page»).
- `docs/discovery/discovery_2026-10-19_templates_notations_file_new.md` (the L-A report: §1 page, §2 menu, §3 creation, §4 snapshots, §5 tokens, §6 catalog, §7 lane split).
- Trunk rows R-LIB-11..20: `git show alfonso-frontend-jjtl:docs/decisions.md | rg -n -A8 'R-LIB-(1[1-9]|20)'`. R-LIB-20 fixes the 3.2 cut and the Q3 values.

## Closing (P13, RC-17), explicit pathspecs, no push

Code commits as the work needs, conventional type, `(P-2026-10-19-1617)` suffix, trailer `Model:` (P6). Then one docs commit: a section «P-2026-10-19-1617» appended to the L-A report (what was done, measurements, unattended decisions, how to see it), one entry in `docs/log-inbox/templates-ui.md`, and this prompt's `Status:` flipped to `eseguito 2026-10-19 · lane <branch> · <sha> · visual check owed to the chat (RC-23)`. Gates: `npm run -s check:docs` and the gates named below. Then `Outcome: done`.

## NON FARE

No file outside DOVE. No `decisions.md`, `PROTOCOL.md`, `CLAUDE.md`, handoff edits. No new dependency. No push. No dark-theme work (D-UI-15). Nothing from the deferred list of R-LIB-20 (Notations page, Built-in tab, notation entries, Collections).

## COSA

Build the pipeline recommended in report §4.3 (R-LIB-16, unattended decisions 2..5 and 8 of the report).

1. New `frontend/scripts/library/snap-gallery.ts`, sibling of `build-gallery.ts` and reusing its pattern (seed, `STORE`, `DockManager.open2`, settle, `CanvasExportService.renderTarget` + PNG). It never rewrites a package; for each catalog gallery entry `<id>@<n>` it writes `frontend/public/library/gallery/<id>/<n>.preview.png`, refusing to overwrite unless `SNAP_REWRITE=<id>@<n>` names it. Usage and env vars in a header comment, in English.
2. Diagram per entry: templates show their metamodel (families-persons: the Families metamodel); examples show their model in the notation (turnstile `demoESM`, petri `producerConsumer`).
3. Output: PNG, pixelRatio 2, transparent background (the card paints the dot grid).
4. Variant D for metamodels: a capture-only stylesheet injected with `page.addStyleTag` over the metamodel editor's class names (white node header, slate-300 hairline, 8px radius, 600 names, slate-500 edges), no source file changed. Check it visually on the seven PNGs; if it proves brittle, drop it, capture the plain editor and say so.
5. Legibility: the card is 136px high, about 2.2:1. Measure for each PNG the scale at which it lands in a 300×136 box and report it; propose (do not implement) a readability rule if any falls below 25 %.
6. Run it once for the seven entries and commit the PNGs.

## DOVE

`frontend/scripts/library/snap-gallery.ts` (new), `frontend/public/library/gallery/<id>/1.preview.png` ×7 (new); closing docs as above, with the seven PNGs also shown inline in the report section. No catalog edit (L-B1 writes `preview`).

## Gates

`check:scripts` if the repo has it, `check:docs`, a second run without `SNAP_REWRITE` that refuses all seven (negative control), timings per entry.

## HARD STOP

None before the closing commit.
