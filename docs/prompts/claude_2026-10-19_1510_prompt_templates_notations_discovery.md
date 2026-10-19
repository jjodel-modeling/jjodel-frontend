# Templates, Notations and File › New: discovery L-A (Phase 1, read-only)

Prompt-ID: P-2026-10-19-1510
Chat: C-2026-10-19-1501
Front: notation-library
Lane: full (discovery across five areas of the UI and a build pipeline; Phase 1 read-only)
Status: da eseguire
Depends: P-2026-10-19-0930 (branch `library-gallery`, HEAD `e1bb5db65`, not yet merged into the trunk)
Corregge: none (new work)
Request: Alfonso, 2026-10-19 15:01, in the project chat: commit the design handoff, run the read-only discovery lane L-A and propose the lanes

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 does not apply, no UI change.

Worktree: `~/jjodel-w-tplui-disc`, branch `tplui-disc`, created by the chat from `library-gallery` at `e1bb5db65` plus two cherry-picked docs commits (the design handoff and this prompt). Before anything else: `pwd`, branch and `git log -3` match; otherwise stop with `Outcome: blocked`. `node_modules` is a symlink to `~/jjodel/frontend/node_modules` (P14), left in place.

Model and tier: as `lane-run` decides; effort `high`. Time limit 90 minutes.

## Lane discipline

Every reply opens with `[P-2026-10-19-1510 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Read `docs/decisions.md`, the logs and every file above 500 lines with `offset`/`limit` or `rg`, never whole.

## Context (decided, not to be reopened)

The design handoff `docs/design/claude_2026-10-19_design_handoff_templates_notations_file_new.md` (read it whole first) redesigns the Templates page, adds card previews, a Notations page for the sealed notations, a New model dialog and a File › New submenu with Basic and Advanced variants. Its §9 is registered as provisional rows R-LIB-11..19 on the trunk; this branch does not carry them, read them with `git show alfonso-frontend-jjtl:docs/decisions.md | rg -n -A6 'R-LIB-'`. R-LIB-7 (trunk) keeps the sealed notations, the seal predicate (S3, branch `library-seal`) and the reducer guard (S6, branch `library-seal-guard`) out of 3.2. R-LIB-9 already has a catalog field `tier: template | example`; R-LIB-19 reads the handoff's `kind` as that field. The gallery and the Templates page of S1/S2 live on `library-gallery` (this branch's base), not on the trunk; the trunk has an older `frontend/src/pages/Templates.tsx`.

## COSA

Answer each item with paths and `file:line`, citing verbatim where the claim depends on it.

1. **Templates page.** The page component(s) and route on this branch, and how they differ from the trunk's `pages/Templates.tsx` (a short diff summary, not a dump). The card component, the clone action and its call chain, where `docs/library/catalog.json` (or its built copy) is read and with which schema; list the catalog's current fields per entry. The sidebar: where BROWSE and FILTERS (Private, Public, Collaborative) are defined, how the active item is styled today, whether a page can hide FILTERS. The quick tip «Right-click on elements for more options»: where it is triggered and how to suppress it per page. How Basic/Advanced mode is read in a component (the accessor to reuse for R-LIB-15).
2. **File menu.** Where the File menu and its items are defined; the menu component's support for nested submenus, section labels, separators and disabled items (how deep a cascade it renders today); the current File items verbatim; how mode (Basic/Advanced) gates items today; whether a project is open is known to the menu and how.
3. **Creation paths.** The functions that create today, from the UI, a project, a metamodel, a model conforming to a metamodel of the project, a viewpoint and a transformation; their signatures and where they are called. What would a New model dialog with a «Metamodel in this project» tab call. For the «Built-in notation» tab: what exists today for sealed notations on any branch (`library-seal`, `library-seal-guard`, the trunk): packages, canonical metamodels, a catalog section, an instantiate function. State plainly whether a user could create a model from a built-in notation in 3.2 under R-LIB-7, and what the smallest honest content of the Notations page and the Built-in tab would be if they shipped before the sealed notations.
4. **Offscreen snapshot of a viewpoint.** Whether a viewpoint can be rendered to SVG (or PNG) without a user's browser tab: existing export code (canvas export, `html-to-image` or similar dependencies in `package.json`), how the PNGs under `docs/discovery/assets/library-gallery/` were produced, whether `frontend/scripts/library/build-gallery.ts` could drive a headless browser (Playwright or Puppeteer already installed?) against a dev server to open a packaged `<id>/<n>.jjodel` and serialize the React Flow viewport, versus a pure SVG writer from the IR and the stored layout. Do not build the pipeline; you may run one throwaway probe under `/tmp` (or `lane-run probe` style, outside the repo), and if you need a dev server, start it with `npm start` on port 3096 and stop it before the end. Report what worked, its time per entry, and the recommended pipeline with the files it would touch.
5. **Tokens and components.** Where the categorical palette lives (the handoff guesses `tokens/entities.css`); whether IBM Plex Mono is loaded; the existing button variants (ghost, secondary), chip, modal, tabs and search field components to reuse; existing tokens near the handoff's level colours. No new identifier is chosen here; list the grep results that a later lane needs to avoid collisions.
6. **Catalog content against the handoff's §2.5 table.** For each of the seven entries, from the packaged `.jjodel` files: class count, enums, containment, inheritance, non-containment references, validation rules (and whether StateMachine really carries one error on purpose), transformations, codegen templates, viewpoints. Then the concepts each one really shows, set beside the handoff's proposal. This is input for Alfonso's Q3, not a decision.
7. **Lane split.** For the lanes L-B (Templates page, catalog fields, filters, sidebar), L-C (preview snapshot pipeline), L-D (Notations page and New model dialog), L-E (File › New): the file set of each, an overlap matrix, any critical-zone file (CLAUDE.md §3.2) or exported interface each would touch, which can run in parallel (RC-22), and which branch each should start from (`library-gallery` or the trunk after its merge). Say whether L-D and the Built-in parts of L-E can ship in 3.2 at all given item 3 and R-LIB-7, and propose the 3.2 cut.
8. Close the report with «Risks», «Decisions taken (unattended)» and «Decisions awaiting Alfonso» (RC-26). Conflicts between the handoff and ratified rows (R-LIB-1..10, D-UI-15) go in the last list, each with a recommendation.

## DOVE

`docs/discovery/discovery_2026-10-19_templates_notations_file_new.md` (new), `docs/log-inbox/templates-ui.md` (new, one entry), this prompt's `Status:` line. Throwaway probes live under `/tmp` and are not committed.

## Gates

`check:docs` after the commit.

## Commits (P13, RC-17), explicit pathspecs, no push

One commit: `docs(discovery): templates, notations, file new (P-2026-10-19-1510)`, with the 3.2 cut of item 7 in the body. Trailer `Model:` (P6).

## NON FARE

No change to any source file, script, catalog, packaged project, `decisions.md`, `PROTOCOL.md` or `CLAUDE.md`. No new dependency, no install. No edit to the design handoff. No push. Do not touch the other worktrees (`~/jjodel-w-gallery` has uncommitted closure files of P-2026-10-18-2300; leave them).

## HARD STOP

End of Phase 1: `Outcome: hard-stop` after the commit. `Outcome: question` only if an item cannot be answered from the sources.

## RIFERIMENTI

- Design handoff: `docs/design/claude_2026-10-19_design_handoff_templates_notations_file_new.md`; artboards on the Design canvas «Jjodel Templates page» (reference for later visual checks, not needed here).
- Decisions (trunk): R-LIB-1..19, D-UI-15, RC-22, RC-25, RC-26.
- `docs/discovery/discovery_2026-10-18_notation_library.md` (S1, S2, S3, S6 and the gallery sections).
- Prompts: P-2026-10-18-1800 (gallery and Templates page), P-2026-10-18-2300 (templates and examples), P-2026-10-19-0300 (example viewpoints).
