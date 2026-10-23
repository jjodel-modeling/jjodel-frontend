# Code generation: port the R-GEN rows of 2026-10-23 into the decision register

Prompt-ID: P-2026-10-24-0000
Chat: C-2026-10-23-2009
Front: codegen
Lane: fast (docs only, one file of the register)
Depends: P-2026-10-23-2255
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-23 23:54, in the project chat (kept locally in the chain folder as `request.md`)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (the three reports named below). P8 does not apply (no UI).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-24-0000 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit:
30 minutes. No subagents, no background tasks. Never `cat` a whole large file: grep and read ranges.

## COSA

Append to `docs/decisions.md`, right after the last R-GEN row (today R-GEN-18), in the exact row format the
register already uses for R-GEN-18 (bold id, parenthesis with date, ratification, evidence, verified, reversible;
then the bold one-line rule and its body, two-space indent). Copy each rule's text from its report; do not
rewrite its substance.

1. R-GEN-19..R-GEN-24 from `docs/discovery/discovery_2026-10-23_codegen_authoring.md` §6, as `provisional,
   unattended` (they were never ratified by Alfonso; RC-25). Check first that R-GEN-24 there is what the
   2026-10-23 viewpoint report says it is («taken by the authoring report §6»); if the numbering collides with the
   text-mode report, stop with `Outcome: question` and the collision.
2. R-GEN-25..R-GEN-30 from `docs/discovery/discovery_2026-10-23_codegen_textmode_safety.md` (its decisions section),
   same marker.
3. R-GEN-31..R-GEN-38 from `docs/discovery/discovery_2026-10-23_codegen_generator_viewpoint.md` §9.1, marked
   `ratified by Alfonso 2026-10-23 «si su tutto»`, with two changes: R-GEN-37 gets the note «superseded by
   R-GEN-40» and R-GEN-38 the note «superseded by R-GEN-43».
4. Five new rows, same ratification marker, evidence `read`, verified `none`, reversible `branch`:
   - **R-GEN-39.** 3.2 ships code generation as it is on the trunk (`genTemplates`, one template list per
     metamodel); several generators per metamodel ship in 3.3. The 3.3 work lives on branch `cg-generators` and is
     not merged into `alfonso-frontend-jjtl` before the 3.2 tag. The double authoring surface of 3.2 (Templates
     tab of the floating Code panel and the Template Editor tab) is a known limit for its CHANGELOG.
   - **R-GEN-40.** One dock tab per generator is the only authoring surface: the generator's template list on the
     left, the editor (with the completion of S4) in the middle, and on the right a pane with the conforming-model
     chooser and three modes, Preview (live generation), Run and Check. The floating Code panel stops being an
     editor: the pill on the canvas opens the tab of the generator last used on that metamodel (else the default),
     and on a model canvas (M1) the tab opens with that model chosen. Supersedes R-GEN-37 and the G3/G4 split of
     R-GEN-38. The default generator's tab keeps the id `codegen_tpl_<metamodelId>`.
   - **R-GEN-41.** Provenance is navigable both ways in the generator tab, in every mode: a fragment that comes
     from a model element selects that element on the canvas (as `selectOnCanvas` does in the 3.2 panel); every
     fragment also leads to the template that produced it, opened and selected in the same tab. The generator id
     travels on the generation result (R-GEN-36), the template name on the fragment origin.
   - **R-GEN-42.** The project's left bar gains a GENERATORS section, beside TRANSFORMS, listing each metamodel's
     generators (setting on only; absent otherwise), with a «New generator» entry; a click opens the generator
     tab. The left bar is eager code: it reads the keys only through `codegen/setting.ts` and reaches the tab only
     through a dynamic import, so the lazy gate (R-GEN-2) stays green.
   - **R-GEN-43.** Slice order on `cg-generators`: G1 codec, G2 generation per file with the generator's target,
     G3 generator tab with the panel reduced to a launcher and two-way provenance, G4 the left-bar section. Each
     slice is its own lane in one chain.

## DOVE

`docs/decisions.md`, `docs/log-inbox/codegen.md` (one log entry), this prompt's `Status:` line. Nothing else.

## Gates and close

`npm run check:docs` from `frontend/` if the script exists, else say so. One commit
`docs(decisions): R-GEN-19..43 to the register (P-2026-10-24-0000)` with the register and the log entry, then the
`Status:` flip in the same commit: `eseguito 2026-10-24 · lane codegen · <parent sha> · rows 19..43`.
`Outcome: done`.

## NON FARE

No change outside DOVE. No renumbering of existing rows. No push, no merge.
