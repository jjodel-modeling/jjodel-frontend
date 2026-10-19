# Library gallery: hand-written viewpoints for the two examples (R-LIB-9, R-LIB-10)

Prompt-ID: P-2026-10-19-0300
Chat: C-2026-10-18-2254
Front: notation-library
Lane: full (build script, two packages, catalog, test, probe)
Status: da eseguire
Request: Alfonso, 2026-10-19 02:58, «Aggiungi i viewpoint, il 23 ottobre non vale più»
Depends: P-2026-10-18-2300 (templates and examples, branch `library-gallery`, HEAD `4a3c1db49`, closure pending Alfonso's visual OK)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-gallery`, branch `library-gallery`, HEAD `4a3c1db49` plus this prompt cherry-picked by the chat. Expected dirty state at start, left by P-2026-10-18-2300 for its closure: modified `docs/discovery/discovery_2026-10-18_notation_library.md`, `docs/log-inbox/notation-library.md`, `docs/prompts/claude_2026-10-18_2300_prompt_library_gallery_templates_examples.md`, PNGs under `docs/discovery/assets/library-gallery/` (modified and untracked). Do not commit, revert or edit any of those; you append to the report and the inbox after the 2300 text, and your additions stay uncommitted with them. Anything else dirty: `Outcome: blocked`. A dev server on port 3095 serves this tree for Alfonso: do not stop it.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high`. Time limit 90 minutes.

## Lane discipline
Every reply opens with `[P-2026-10-19-0300 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question with a recommendation carries `Recommended: <one line>`. Unattended (RC-21, RC-25): outside the RC-26 list take the recommended answer and record it. Append a section «Example viewpoints (P-2026-10-19-0300)» to `docs/discovery/discovery_2026-10-18_notation_library.md`, after the 2300 section.

## Context
R-LIB-9 (on the trunk, not on this branch): an *example* is a complete, realistic case of a whole language, held to the commercial-quality requirement and checked visually by Alfonso; curated material uses hand-written IR viewpoints, never derived ones. P-2026-10-18-2300 packaged `turnstile@1` and `petri-producer-consumer@1` unchanged from `public/examples/codegen/`: they carry only the `Default` viewpoint and open on abstract syntax (Transitions and Arcs as boxes, layout larger than the canvas). R-LIB-10 (trunk, 2026-10-19): the 3.2 freeze of 2026-10-23 no longer holds; the two examples get their viewpoints before `library-gallery` is merged. Version 1 of both is still unpublished (nothing has left the branch), so you rebuild version 1 (`GAL_REWRITE=<id>@1`), not a version 2.

## COSA
One hand-written viewpoint per example, written with the IR as the 2300 templates are (`build-gallery.ts`), active on open, named after the language: `Turnstile statechart` on `DemoESM`, `Petri net` on `DemoPetri` (both models of the Petri example use it). Read the derived notations in `components/editor-v2/viewpoint/derive/notations.ts` (`statechart`, `petri`, `petriClassic`) and the scene probes as references for shapes and paths only; write every view explicitly.

**turnstile (DemoESM).** Read the metamodel first and record its classes, references and enums in the report.
- `Initial` is a named state with behaviour (the model's `locked : Initial`), not a pseudostate: draw it as a state (rounded rectangle, name centred) told apart from a plain `State` by one visible mark that is not colour alone, for example a small filled dot with a short arrow attached to its left side drawn as part of the shape, or a thicker border. Recommended: the dot-and-arrow mark, since it reads as UML's initial transition.
- `State`: rounded rectangle, name centred; an `entry` action, when set, as a second line `entry / <action>` in a smaller size.
- `Terminal`: UML final state, bullseye about 28 px, name below (same as the state-machine template).
- `Transition`: an arc from its owning state to its `nextState` (check the reference names), labelled `event [guard] / effect`, each part only when set; the transition object itself is never a box.
- `Event`: not drawn as a node (it is vocabulary, shown in the arc labels). If hiding it leaves the transition-to-event reference drawn, draw that reference clear, as `SC_VIEWS` does.
- 0 containment arcs, 0 rows.

**petri-producer-consumer (DemoPetri).** Read the metamodel and the two models first and record them.
- `Place`: circle about 44 px, name outside below; the marking (`tokens`) inside: up to four tokens as dots, more as a number. Check whether the simulator overlays its own marking on places; if it does, the drawn marking must not double it during a run (say what you found).
- `Transition`: a solid black bar (vertical, about 10 × 40 px), name outside; a `guard`, when set, as a small label beside the bar.
- `Arc`: an arc from `src` to `tgt` with an open arrow; its `weight` as a label only when it is greater than 1.
- `InhibitorArc`: an arc ending in a small circle instead of an arrow.
- The net (container) not drawn; 0 containment arcs, 0 rows.

**Both.** Layout by the build, as for the templates: every vertex inside the visible canvas at 1440×900 with the panels as they open (the 2300 corner check), clear of the minimap; no arc label over another label or a node; no conformance warning badge. Simulation and code generation must work unchanged under the new viewpoint.

## DOVE
`frontend/scripts/library/build-gallery.ts`, `frontend/scripts/library/gallery/turnstile/**` and `petri-producer-consumer/**` (sources), `frontend/public/library/gallery/turnstile/1.jjodel` and `petri-producer-consumer/1.jjodel`, `docs/library/catalog.json` and `frontend/public/library/catalog.json` (sha256, `notes`), `frontend/src/library/__tests__/gallery.test.ts`, `frontend/scripts/probe/library-gallery-clone.ts`. `public/examples/codegen/` stays untouched (its README points at those files); record in the report that the gallery copies now differ from them by the viewpoint. No editor, IR, simulator or codegen change: if an item needs one, stop and ask with Recommended.

## Checks
Typecheck, build, `check:scripts`, the gallery test (per example: one non-Default viewpoint, active on open, the view kinds above; sha256 of each file equals the catalog's), the codegen example tests (`src/codegen/examples/__tests__/`) still green. Code generation: the generated text of each example before and after the rebuild is identical byte for byte (12 templates on turnstile; the Petri ones on each model). Clone probe on its own port (never 3000, 3001, 3003, 3095), 1440×900, light, `CLONE_ONLY=turnstile,petri-producer-consumer`: clone, open, assert the criteria from the DOM (vertex, arc and row counts, labels, no badge, corner check), screenshot `docs/discovery/assets/library-gallery/turnstile.png` and one per Petri model; then run the simulation (turnstile: Reset, `coin`, `push`; Petri: Reset and three steps) and screenshot each mid-run as `<id>-sim.png` (Petri: one model). Then rerun the probe on all seven entries once, so the templates are known still green.

## Commits (P13), explicit pathspecs
1. `docs(library): catalog sha256 of the example viewpoints (P-2026-10-19-0300)`. 2. `feat(library): hand-written example viewpoints (P-2026-10-19-0300)`. Report section, screenshots, inbox entry (in `docs/log-inbox/notation-library.md`, after 2300's) and this prompt's Status: uncommitted, for the chat's closure after the visual checks (RC-17, RC-23). No push, no merge (RC-19). `Outcome: hard-stop` at the end, with the port that serves this tree.
