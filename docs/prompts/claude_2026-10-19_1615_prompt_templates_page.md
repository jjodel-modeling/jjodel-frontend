# Templates page, catalog fields and filters (L-B1)

Prompt-ID: P-2026-10-19-1615
Lane: full (UI page, catalog schema, tokens, test; six files)
Depends: P-2026-10-19-1510 (branch `tplui-disc`, report §7)
Chat: C-2026-10-19-1501
Front: notation-library
Status: da eseguire
Corregge: none (new work)
Request: Alfonso, 2026-10-19 16:09, in the project chat: «Si velocissimo», on the lanes and the Q3/Q4 recommendations of P-2026-10-19-1510

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Worktree: `~/jjodel-w-tpl-b1`, branch `tpl-b1`, created by the chat from `tplui-disc` plus this prompt. Dev server for your own screenshots: `npm start -- --port 3101 --strictPort`, stopped before the end.

Model and tier: as `lane-run` decides; effort `high`. Time limit 90 minutes.

## Lane discipline

Every reply opens with `[P-2026-10-19-1615 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list; decisions you take go in a «Decisions taken (unattended)» list in your report section. Read `docs/decisions.md`, the logs and every file above 500 lines with `offset`/`limit` or `rg`, never whole. Before anything else: `pwd`, branch and `git log -1` match the Worktree line; otherwise `Outcome: blocked`. `frontend/node_modules` is a symlink (P14), leave it. Before introducing any new identifier (class, token, export, event) `rg` it under `frontend/src` (CLAUDE.md, name check); use the `tpl-` page prefix where the report §5 says the plain name is taken.

## Sources (read first)

- `docs/design/claude_2026-10-19_design_handoff_templates_notations_file_new.md` (the handoff; artboards on the Design canvas «Jjodel Templates page»).
- `docs/discovery/discovery_2026-10-19_templates_notations_file_new.md` (the L-A report: §1 page, §2 menu, §3 creation, §4 snapshots, §5 tokens, §6 catalog, §7 lane split).
- Trunk rows R-LIB-11..20: `git show alfonso-frontend-jjtl:docs/decisions.md | rg -n -A8 'R-LIB-(1[1-9]|20)'`. R-LIB-20 fixes the 3.2 cut and the Q3 values.

## Closing (P13, RC-17), explicit pathspecs, no push

Code commits as the work needs, conventional type, `(P-2026-10-19-1615)` suffix, trailer `Model:` (P6). Then one docs commit: a section «P-2026-10-19-1615» appended to the L-A report (what was done, measurements, unattended decisions, how to see it), one entry in `docs/log-inbox/templates-ui.md`, and this prompt's `Status:` flipped to `eseguito 2026-10-19 · lane <branch> · <sha> · visual check owed to the chat (RC-23)`. Gates: `npm run -s check:docs` and the gates named below. Then `Outcome: done`.

## NON FARE

No file outside DOVE. No `decisions.md`, `PROTOCOL.md`, `CLAUDE.md`, handoff edits. No new dependency. No push. No dark-theme work (D-UI-15). Nothing from the deferred list of R-LIB-20 (Notations page, Built-in tab, notation entries, Collections).

## COSA

Implement handoff §2.2, §2.3, §2.5 and §7 on the Templates page, within R-LIB-13..17 and R-LIB-19.

1. **Catalog fields** (R-LIB-19). In `docs/library/catalog.json` and its identical copy `frontend/public/library/catalog.json`, add to each gallery entry `level`, `concepts` (array of slugs), optional `callout`, and `preview` = `<id>/<n>.preview.png` (the path L-C writes; the files may not exist yet). No `kind` field: the section comes from `tier`. Counts of metamodels and models are derived from the package or the existing entry data, never written. `GalleryEntry` (`Templates.tsx`) gains optional fields only. Values, ratified in R-LIB-20:

| id | level | concepts |
|---|---|---|
| library@1 | beginner | containment, inheritance, references |
| shapes@1 | beginner | inheritance, containment |
| graph@1 | beginner | references, containment |
| state-machine@1 | intermediate | enumerations, containment, validation; callout «Contains one validation error on purpose. Find it and fix it.» |
| families-persons@1 | intermediate | multiple-metamodels, containment, inheritance; description «Source and target of the classic Families2Persons transformation, with a model of each. The transformation is yours to write.» |
| turnstile@1 | intermediate | code-generation, simulation |
| petri-producer-consumer@1 | advanced | code-generation, references, simulation |

2. **Page.** Header (H1 «Templates», lead text, labelled search «Search templates» with placeholder «Name or concept», matching name, description and concept labels). Start here panel linking to card anchors in this order: Library, Shapes, StateMachine, Families and Persons, Turnstile. Concept chips: All, Containment, Inheritance, References, Enumerations, Validation, Multiple metamodels, Simulation, Code generation. Level chips with colour dot and live count. AND combination, dashed grey chip at count 0, «Clear filters», empty state as in §2.2. Two sections «Starters» (tier template) and «Worked examples» (tier example) with their one-line contracts, hidden when empty. Grid `repeat(auto-fill, minmax(300px, 1fr))`, gap 20px, max width 1200px.
3. **Card** (§2.3): preview area 136px high with the dot grid painted in CSS and the PNG on top when it loads (`object-fit: contain`); while the PNG is missing, the dot grid alone. Title and level badge; counts with `ElementBadge` (report §5, no new hex for M/m); description; callout; concept tags; footer with the id in `--font-mono` 12px shown only in Advanced mode (`useSelector(s => s.advanced) || isAdvancedMode()`, report §1.6), «Preview» ghost and «Clone» secondary with a copy icon (Bootstrap Icons), both `Button` from `components/common/Button`. «Preview» opens the existing read path if one exists on this branch; if none exists, it is not rendered and you say so in the report (no new flow).
4. **Tokens.** Level colours as new tokens in `frontend/src/styles/tokens.css` (names `--color-level-*`, 0 hits per report §5): beginner green-700 on green-100, intermediate blue-700 on blue-100, advanced violet-700 on violet-100 (violet has no grade: add the two values as level tokens only). Focus `outline: 2px solid var(--color-border-focus); outline-offset: 2px`.
5. **Accessibility** (§7): chips are `<button aria-pressed>`, rows `role=group` with `aria-label`, preview images `alt=` empty and `aria-hidden`, every input labelled.
6. **Test.** Extend `frontend/src/library/__tests__/gallery.test.ts`: every gallery entry has a valid `level`, a non-empty `concepts` from the closed vocabulary above, `preview` equal to `<id>/<n>.preview.png`, and the two catalog copies stay identical.

## DOVE

`frontend/src/pages/Templates.tsx`, `frontend/src/pages/Templates.scss`, `docs/library/catalog.json`, `frontend/public/library/catalog.json`, `frontend/src/library/__tests__/gallery.test.ts`, `frontend/src/styles/tokens.css`; closing docs as above. Six source files, declared here: the rule 19 pause does not apply.

## Gates

`npx tsc --noEmit -p frontend` (or the repo's typecheck script), the gallery test, `check:docs`. Screenshots of the page at 1440×900 in Basic and Advanced, one with a filter giving the empty state, under `docs/discovery/assets/tpl-b1/`.

## HARD STOP

None before the closing commit. `Outcome: question` only for a choice inside the RC-26 list.
