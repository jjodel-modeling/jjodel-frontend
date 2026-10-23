# Code generation: the generator as a viewpoint, Phase 1 discovery

Prompt-ID: P-2026-10-23-2255
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (discovery; touches persistence of a shipped feature, a new viewpoint kind, possibly a migration)
Depends: P-2026-10-23-2145
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-23 20:09, in the project chat (kept locally in `~/.jjodel-lanes/P-2026-10-23-2255/request.md`)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-cgvp`, branch `cg-viewpoint`, at the commit that adds this prompt. Before anything else:
`pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-23-2255 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question with a recommendation carries
`Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. Read-only:
no edit outside the report and this prompt's `Status:` line. No subagents, no background tasks. Context
discipline from the first line: never `cat` a whole large file or log, read ranges and grep; the report is
written in stages as you go, not at the end.

## Contesto (non rifare l'analisi)

The code generator shipped behind the `VITE_CODEGEN` build flag and the Experimental setting «Code generation»
(R-GEN-2, R-GEN-18). Templates are stored per metamodel, one list, in the metamodel's `_state` under the key
`genTemplates` (R-GEN-12, codec in `frontend/src/codegen/engine/templateCodec.ts`). Today's slices S1..S3 and
S5..S7 (front `release-3-2`) added the Code panel on M2, the Template Editor tab, live preview and the safety
of text mode.

Alfonso's direction (2026-10-23): the specification of a generator lives in a viewpoint, so that one project
can have several generators (JavaScript today; Verilog for the hardware notation; documentation; others).
The chat's working model, to be confirmed or refuted by this discovery, not yet a decision:

1. A generator is a viewpoint of its own kind, distinct from the syntax viewpoints, on the precedent of
   R-VAL-1 and R-VAL-2 (validation as a concern with its own viewpoints, several and selectable).
2. A template has the placement of a view but not its type (the R-VAL-6 principle): it never enters the
   EditorV2 view dispatch and never is a candidate of the syntax interpreter.
3. The generation viewpoint declares what a syntax viewpoint does not have: the root template (entry point) and
   the map of output files.
4. Generators are independent in the first version: no inheritance, no cross-generator template reuse.
5. The binding to the simulation STC the templates read (R-GEN-3, `generate.ts:54-66`) is declared on the
   generation viewpoint.
6. With the Experimental setting off, generation viewpoints are inert data: they load, save and survive a
   round trip, are not interpreted, are absent from the syntax viewpoint picker, and no generator module is
   loaded (R-GEN-2).
7. The existing `genTemplates` list migrates into one default generation viewpoint of its metamodel.

## COSA

Answer, with `file:line` and verbatim quotes, each of the following. For each, say which part of the working
model it confirms, refutes or leaves open.

1. **Persistence today.** Every reader and writer of `genTemplates` (`grep -rn genTemplates frontend/src`):
   codec, CodePanel, Template Editor, `setting.ts`, the importable examples and their test. What a stored
   template carries (name, body, any id), how the root template is chosen today, and how output files are
   named today (one text or several).
2. **Provenance.** What the third element of the R-GEN-5 triple (the «transformation») holds today, and what
   it would hold with several generators per metamodel.
3. **Viewpoint machinery.** In `frontend/src/view/viewPoint/viewpoint.ts` and the D/L classes it uses: how a
   viewpoint is typed today (the «only syntax» rule, R-IRN), the Data Manager viewpoint singleton (R-DMV) as
   the one existing non-syntax precedent, how a viewpoint binds to a metamodel, how it is persisted, activated,
   listed in the picker and exported with the metamodel. Whether anything of R-VAL was implemented (the spec
   says not): report what exists, if anything.
4. **Where templates would live.** Compare, with concrete evidence of cost, at most three storage options for
   templates inside a generation viewpoint: (a) a list in the viewpoint's `_state`, same codec as today;
   (b) child elements of a new D-type; (c) any other the code makes cheaper. For each: core classes touched,
   exported interfaces changed, undo behaviour (one `SetFieldAction` per Save today, R-GEN-12), and whether the
   syntax interpreter or the view dispatch could ever see them.
5. **Migration.** Where the migration of `genTemplates` into a default generation viewpoint can run without
   touching `VersionFixer.tsx` (critical zone) and without loading the generator module while the setting is
   off: for instance lazily when the codegen module first loads on that metamodel. What happens to a project
   saved by 3.2 and reopened by a build with the setting off, and to the importable examples.
6. **UI consequences.** What the Code panel (on M1 and on M2) and the Template Editor must gain: choosing the
   generator, creating and deleting a generator, which generator Output, Run, Check and the oracle use.
7. **Release boundary.** The 3.2 content freeze is Tuesday 2026-10-27 (release-3-2 discovery, §4). Measure,
   do not decide: what the cost is of shipping 3.2 with `genTemplates` and migrating in 3.3, versus changing
   persistence before the tag. The choice is Alfonso's (RC-26: what ships in a release).
8. **Slices.** A slice plan for the change (DOVE per slice, gates, probes, the mutation each probe must kill),
   with the critical-zone and exported-interface items marked.

## DOVE

Read-only. Write only:

- the report `docs/discovery/discovery_2026-10-23_codegen_generator_viewpoint.md` (naming of P4; if the file
  exists, append an addendum, never rewrite);
- this prompt's `Status:` line.

Start from `frontend/src/codegen/` (engine, ui, setting, examples), `frontend/src/view/viewPoint/`,
`docs/spec/claude_spec_2026-10-10_code_generation_pilot.md`, the R-GEN rows of `docs/decisions.md`, the R-VAL
spec `docs/spec/claude_spec_2026-09-08_user_defined_validation.md` (§ on viewpoints only), and
`docs/discovery/discovery_2026-10-23_codegen_authoring.md` (§2, §3, §6).

## Report contents (P4)

The hypothesis under test (the seven points above), the objective, the files read with full paths, findings
with `file:line` and verbatim quotes, dependencies and risks, the slice plan, then the two closing sections:
«Decisions taken (unattended)» (provisional rows numbered from R-GEN-24, after checking the highest R-GEN id in
`docs/decisions.md` and in the 2026-10-23 authoring report) and «Decisions awaiting Alfonso» (the RC-26 items
only, the release boundary among them).

## HARD STOP

When the report is committed (`docs(codegen): generator-as-viewpoint discovery report (P-2026-10-23-2255)`,
pathspec: the report and this prompt), flip `Status:` in the same commit to
`eseguito 2026-10-23 · lane codegen · <sha of the report commit's parent> · discovery`, then stop with
`Outcome: hard-stop`.

## NON FARE

No code change, no test change, no new file under `frontend/`. No edit to `docs/decisions.md` (the rows go in
the report). Nothing in the critical zone. No push, no merge. Do not touch the `cg-safety` or `tpl-editor`
branches or their worktrees.

## RIFERIMENTI

R-GEN-1..18 in `docs/decisions.md`; R-GEN-19..23 (provisional) in
`docs/discovery/discovery_2026-10-23_codegen_authoring.md` §6; R-VAL-1, R-VAL-2, R-VAL-6, R-VAL-10; R-DMV;
RC-21, RC-25, RC-26; PROTOCOL P4, P13, P16.
