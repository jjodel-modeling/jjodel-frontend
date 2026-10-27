# Prompt: Phase 1 and 2 in cascade, name-ink marks outside a coloured node keep the notation ink

Prompt-ID: P-2026-10-02-2356
Chat: C-2026-10-01-2220
Lane: Phase 1 then Phase 2 in cascade, outside the critical zone. Tier: light.
Status: eseguito 2026-10-03 · lane ir-ink-outside · 770b3ddc9, cce1ecfef · non fuso: hard-stop, outside labels and the entry mark of a coloured node keep the notation ink (light rgb(15, 23, 42), dark rgba(255, 255, 255, 0.92)), lane probe on 3098 (light and dark) 50/50 and the base run 20/20, the four default scenes 0 px, mutation bench 13/14 (the survivor equivalent), crops in frontend/scripts/smoke/_tmp_inkout_crops/ (gitignored), R-VP-51, verifica visiva alla chat
Worktree: `~/jjodel-w-inkout`, branch `ir-ink-outside`, created from the trunk at `7c9ae4e0d`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-inkout`, branch `ir-ink-outside`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`. Keep the `frontend/node_modules` link if you create one: the direct merge runs its gates in this worktree (ticket of P-2026-10-02-2315 in `docs/log-inbox/merge-gate.md`).

## COSA

Ticket «name-ink marks outside a coloured node take its text colour» (`docs/log-inbox/views.md`, found in P-2026-10-02-2045, priority medium). With «Color by metaclass» on, `metaclassColoringVars` (`metaclassPalette.ts`, about line 474) sets `--color-inode-name` to the node's text colour inline on `.ir-node-content`, so everything that node draws on the canvas in the name ink follows it. Measured on 3097, light: the entry mark (dot and arrow) of a derived Statechart (UML) Initial and the outside name label of a classic Petri place go from `rgb(15, 23, 42)` to `rgb(0, 0, 0)`. R-VP-30 says outside labels keep their ink; in dark they would be black on the dark canvas.

Alfonso asked to proceed (2026-10-02 about 23:55, verbatim: «procedi»). Rule to implement: a mark a coloured node draws OUTSIDE its box (outside labels, `ir-label--outside`; the Initial entry mark; any other canvas-side mark the report finds) keeps the notation's ink in both themes, exactly as with coloring off. What is inside the box keeps today's colouring (the text colour picked by WCAG, R-VP-30). Notation glyphs (R-VP-50) are not affected.

## DOVE

Phase 1 (read-only): a short report `docs/discovery/discovery_2026-10-02_ir_ink_outside.md`, opening with `## 0. Answer in brief` (at most 40 lines). Content:

1. Every place that paints with `var(--color-inode-name)` (or the name ink by another route) and can sit outside the node box: file, line, selector, what it draws. Which of them are inside the box and must keep following the text colour.
2. The fix you propose. Expected shape: a token in `frontend/src/styles/tokens/` (CLAUDE.md rule 28: no CSS variables in component files) that holds the canvas ink and is not rebound by `metaclassColoringVars`, used by the outside marks only; or the coloring rebinding a narrower token. Recommended: the one with the smaller diff that keeps every existing class and token name. Verify by global grep that a new token name is free.
3. Dark theme: the value of the ink token in `_colors-dark.scss`, and how the probe measures it.
4. Whether any persisted data, scene file or exported viewpoint stores the ink. Expected: no.

Questions with `Recommended:`. Commit the report (`docs:`) and go on to Phase 2 in cascade, unless a question has no single recommendation, or the fix needs a change to persisted data, a scene file or a migration: then stop with `Outcome: hard-stop` and the options.

Phase 2, files: `frontend/src/view/viewPoint/metaclassPalette.ts`, `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`, the IR style file that holds the outside-label rules (`irStyle.ts` or the file the report names), the token files under `frontend/src/styles/tokens/` (light and dark), and their tests. Docs: the report, one row in `docs/decisions.md`, a log entry in `docs/log-inbox/views.md` that names the ticket it closes (the ticket entry itself stays as it is, add-only), this prompt's Status. Anything else: stop and ask.

The decision row is **R-VP-51** (ratified by Alfonso 2026-10-02, evidence: measured, reversible: branch), a conformance fix of R-VP-30 under R-VP-50. The trunk ends at R-VP-50 and the unmerged `elk-layout-disc` holds R-VP-40..49; check both and take the next free number if another branch landed one, saying so in the report. Do not edit the text of earlier rows (add-only).

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6, rule 28), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, R-VP-22, R-VP-27..31, R-VP-37..39, R-VP-50, and `docs/discovery/discovery_2026-10-02_vp_glyph_nocolor.md` (its Q5 tried a fix and reverted it: read why).
2. Phase 1 report, committed.
3. Tests first: with coloring on, the outside label of a classic Petri place and the entry mark of a Statechart (UML) Initial resolve to the notation ink in light and in dark; the text inside a coloured node keeps the WCAG text colour; coloring off is unchanged. Red before the change, green after. A test that only checks markup is not enough: the Q5 attempt passed markup and failed in the browser, so the probe measures computed colours. Mutation bench on the fix (token rebound by the coloring, token missing in dark, inside text switched to the ink); report the score.
4. Implement with the smallest diff. No renaming of existing classes, props, tokens or functions.
5. Gates in the foreground: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
6. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light AND dark. DemoPetri on Petri net (classic) and DemoPEST on Statechart (UML), coloring on and off: computed colour of every outside label and of the entry mark equals the ink with coloring off; text inside coloured boxes unchanged from `7c9ae4e0d`; glyph nodes (R-VP-50) unchanged. Crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_inkout_crops/` (gitignored). The four demo scenes in the default viewpoint, coloring off: 0 px from `7c9ae4e0d`.
7. Commits: `fix:` code and tests, `docs:` report, row, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures (light and dark), the mutation score, the questions adopted. The merge waits for Alfonso's visual GO: it changes what the demos show.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree (no `/tmp` either), a call to an AI model, renaming or removing an existing IR property, class or token, changing the default viewpoint, changing the palette algorithm of R-VP-37..39 or the glyph rule of R-VP-50.

## RIFERIMENTI

Ticket in `docs/log-inbox/views.md` («name-ink marks outside a coloured node take its text colour»); `metaclassPalette.ts` (`metaclassColoringVars`, `isNotationGlyph`); `IRNodeContent.tsx` (outside labels, entry mark); `irStyle.ts:228-229` (outside-label overflow rules); R-VP-22 (Initial entry mark), R-VP-30 (outside labels keep their ink), R-VP-50 (glyphs); discovery `discovery_2026-10-02_vp_glyph_nocolor.md` Q5.
