# Prompt: Phase 1 and 2 in cascade, notation glyphs out of «Color by metaclass»

Prompt-ID: P-2026-10-02-2045
Chat: C-2026-10-01-2220
Lane: Phase 1 then Phase 2 in cascade, outside the critical zone. Tier: light.
Worktree: `~/jjodel-w-vpglyph`, branch `vp-glyph-nocolor`, created from the trunk at `1ff8ab314`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-vpglyph`, branch `vp-glyph-nocolor`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

With «Color by metaclass» on (R-VP-27..31, palette R-VP-37..39), the nodes that a derived notation draws as a solid ink glyph are painted with their metaclass colour too, and lose the shape that carries their meaning. The chat asked Alfonso (2026-10-02): «vuoi escludere i glifi di notazione (barre fork/join, pallini iniziale e finale) dalla colorazione per metaclasse? Io consiglio di sì». His answer, 2026-10-02 about 20:40 (verbatim): «ok».

Rule to implement: a node whose notation draws it as a glyph keeps the notation's own fill, border and text colours when coloring is on, exactly as with coloring off. Glyphs named by Alfonso: the Activity (UML) fork and join bars, the initial dot, the final bull's-eye (`dot-large`), in every derived notation that has them (Activity UML, Statechart UML, State machine, Flowchart ISO if any). Every other node keeps today's behaviour.

## DOVE

Phase 1 (read-only): a short report `docs/discovery/discovery_2026-10-02_vp_glyph_nocolor.md`, opening with `## 0. Answer in brief` (at most 40 lines). Content:

1. How a node is recognised as a glyph today: the IR symbol or shape names (`bar`, `dot`, `dot-large` or whatever the IR uses), where they are declared (`viewpointDerivation.ts`, `notations.ts`, the shape registry), and the single predicate you propose (name, file, signature). Verify by global grep that the name is free.
2. Where the colour is applied: `ObjectNode.tsx` (lines about 1185 and 1243), `IRNodeContent.tsx` (about 487), `metaclassPalette.ts` (`resolveMetaclassColoring`, `metaclassColorTable`), `ViewpointProperties.tsx`. Which of these must consult the predicate.
3. The full list of glyph candidates per derived notation, with a screenshot-free description. Open case: the classic Petri transition bar (R-VP-24) is also a solid ink bar but a real metaclass with many instances. Recommended: treat it as a glyph too (same rule: solid ink fill means notation glyph); state it so Alfonso can veto at the visual GO.
4. Palette assignment: a glyph metaclass may keep or release its palette slot. Recommended: keep the assignment unchanged (glyph classes are simply not painted), so no other class changes colour; the viewpoint panel's colour table shows those rows as not coloured with a short reason («notation glyph»), no swatch picker.
5. Whether a per-class override already set on a glyph class (R-VP-38 overrides) must be ignored. Recommended: ignored while the class is a glyph, kept in the data (no data migration).

Questions with `Recommended:`. Commit the report (`docs:`) and go on to Phase 2 in cascade, unless a question has no single recommendation, or the fix needs a change to persisted data, a scene file or a migration: then stop with `Outcome: hard-stop` and the options.

Phase 2, files: `frontend/src/view/viewPoint/metaclassPalette.ts`, `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`, `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx` (only the table row state and its text), the file that hosts the predicate if the report places it elsewhere, and their tests. Docs: the report, one row in `docs/decisions.md`, a log entry in the inbox the viewpoint work writes to (`docs/log-inbox/views.md`), this prompt's Status. Anything else: stop and ask.

The decision row is **R-VP-40** (ratified by Alfonso 2026-10-02, evidence: measured, reversible: branch), amending R-VP-27 on the scope of the coloring. The trunk ends at R-VP-39; check it before writing and take the next free number if another branch landed one, saying so in the report. Do not edit the text of R-VP-27..39 (add-only).

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, R-VP-24..39, and the reports of the coloring lanes (`docs/discovery/` files about metaclass colors and pastel).
2. Phase 1 report, committed.
3. Tests first: for each glyph kind, a node with coloring on renders the same fill, border and text colour as with coloring off; a non-glyph node is still coloured; the colour table marks glyph rows as not coloured; assignments of the other classes are byte-identical to `1ff8ab314`. Red before the change, green after. Mutation bench on the predicate (drop each glyph kind, invert it); report the score.
4. Implement with the smallest diff. No renaming of existing classes, props or functions.
5. Gates in the foreground: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
6. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme only. DemoFlowB on Activity (UML) and DemoPEST on Statechart (UML), coloring on: from the DOM, the computed fill and border of the fork, the join, the initial and the final nodes equal those with coloring off, and two ordinary nodes still carry their palette colour. DemoPetri on Petri net (classic) for the transition bar case. Crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_vpglyph_crops/` (gitignored). The four demo scenes in the default viewpoint, coloring off: 0 px from `1ff8ab314`.
7. Commits: `fix:` code and tests, `docs:` report, row, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the mutation score, the questions adopted. The merge waits for Alfonso's visual GO: it changes what the demo shows.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree (no `/tmp` either), a call to an AI model, renaming or removing an existing IR property, changing the default viewpoint, changing the palette algorithm of R-VP-37..39.

## RIFERIMENTI

R-VP-24 (classic Petri bar), R-VP-26 and R-VP-36 (Activity bar 7×120), R-VP-27..31 (coloring, selected header), R-VP-37..39 (pastel palette, overrides). `metaclassPalette.ts` (`resolveMetaclassColoring`, `metaclassColorTable`, `metaclassColoringVars`), `ObjectNode.tsx:1185,1243`, `IRNodeContent.tsx:487`, `view.tsx:287-291`.
