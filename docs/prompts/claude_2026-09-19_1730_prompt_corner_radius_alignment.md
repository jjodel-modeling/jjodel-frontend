# Prompt: pre-merge alignment on `validation-skeleton`, corner radius as a conditional axis (R-IRN-35)

Prompt-ID: P-2026-09-19-1730
Repo: `~/jjodel` (frontend in `frontend/`, scripts run from there). Branch: `validation-skeleton`. Do not touch `~/jjodel-release`.
Effort: xhigh. Read `CLAUDE.md`, `docs/PROTOCOL.md` and `docs/claude-code-log.md` first.
Every message opens with `[P-2026-09-19-1730 · session <id>]`. A message with a different or missing ID is not executed.
Sequence: runs after `P-2026-09-19-1735` (ratification on the trunk) and before `P-2026-09-19-1740` (merge). The tree has three modified paper files under `docs/mde-intelligence-2026/` and three untracked paths that belong to Alfonso: never stage them (RC-13), never `git add .`.

## COSA

Make the branch's corner radius carry the contract ratified as R-IRN-35 on 2026-09-19, so that the merge of `validation-skeleton` into `alfonso-frontend-jjtl` resolves the three IR files by text and not by a decision. Today the branch declares `ShapeSpec.cornerRadius?: number` (D5, scalar) and reads it from the source IR through `authoredCornerRadius`; the trunk declares `cornerRadius?: Conditional<number>` (R-IRN-31), compiles it through `compileConditional` into `CompiledView.cornerRadius: CompiledConditional<number | undefined> | null` (fallback not emitted, never 0), and resolves it at render. R-IRN-35 takes the trunk's type and compile path and the branch's rendering (polygons through `roundedPolygonPath`, clamp at render, absent is not zero, ignored only by `ellipse`, `circle`, `stadium`).

After this lane, on the branch:

1. `ShapeSpec.cornerRadius?: Conditional<number>`, declared in `irTypes.ts` with the same name, type and position (sibling of the border axes) the trunk uses at `alfonso-frontend-jjtl:frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` line 168, and `CompiledView.cornerRadius: CompiledConditional<number | undefined> | null` as at trunk line 733. Copy the trunk's doc comments where they fit; the merge must find the two declarations as close to identical as the surrounding border split allows.
2. `irCompile.ts` compiles the axis exactly as the trunk does (`git show alfonso-frontend-jjtl:frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`, lines 313-314 and 431): `compileConditional<number | undefined>` with an undefined fallback, `null` when absent.
3. `IRNodeContent.tsx` resolves `compiled.cornerRadius` with the read context, like the trunk at line 348, and feeds the resolved number into the branch's existing paint path (`cornerPaint`, `roundedPolygonPath`, `honorsCornerRadius`, clamp). `authoredCornerRadius(compiled.ir...)` at branch line 399 goes away from the renderer. The polygon behaviour, the clamp and the absent-is-not-zero rule do not change.
4. The other readers of the scalar (`authoredCornerRadius` in `SymbolEditorModal.tsx:341`, `SymbolPreview.tsx:104`, `VertexAuthoringPanel.tsx:413`, `irValidate.ts:133`, and `resolveCornerRadius` in `SymbolBoxPreview.tsx`) keep working for a literal value: a `Conditional<number>` whose value is a plain number must read as before. For a rule-driven value the authoring surface shows what the border axes show in the same situation (D1 pattern); S6 will add the control later, this lane adds no UI. `irValidate.ts` validates the literal form as today and the conditional form as it validates the border axes.
5. Tests: the existing corner-radius tests keep passing; add the tests that pin the new contract: literal `8` compiles to a resolved 8 on a box and on a diamond; absent compiles to `null` and renders the base radius; a conditional radius with one rule resolves per instance; `0` is honoured, not treated as absent. Each new test must fail on the pre-change code (mutation proof, CLAUDE.md §5): show the failing run in the report.

Out of scope: `border` (already per-axis on the branch, D1), the object seed, `EnableIRPanel`, any trunk file, the Symbol Editor controls (S6), docs beyond the discovery report and the inbox entry.

## DOVE

Phase 1 reads; Phase 2 writes only:

- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`, `irCompile.ts`, `IRNodeContent.tsx`, `irValidate.ts`, `shapeRegistry.ts` (only if `authoredCornerRadius`/`resolveCornerRadius` need to accept the literal form of a `Conditional<number>`).
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx`, `SymbolPreview.tsx`, `SymbolBoxPreview.tsx`, `VertexAuthoringPanel.tsx`: only the read sites listed above, minimal edits.
- Tests next to the existing corner-radius tests (find them in Phase 1; `ir.test.ts` and the authoring tests).
- `docs/discovery/discovery_2026-09-19_corner_radius_alignment.md` (Phase 1 report, mandatory), `docs/log-inbox/views.md` or the inbox the branch uses for the IR lane (Phase 2 entry), `docs/prompts/claude_2026-09-19_1730_prompt_corner_radius_alignment.md` (this file, if untracked).

## COME

**Phase 1, read-only, hard stop.** Read the seven files above on both refs (`git show alfonso-frontend-jjtl:<path>` for the trunk side; do not check it out). Report: the shape of `Conditional<T>` and `CompiledConditional<T>` on the branch and whether they are identical to the trunk's; every read site of `cornerRadius` on the branch with line numbers; how the border axes of D1 are compiled, resolved and shown in authoring when rule-driven (the pattern point 4 must follow); the existing tests on corner radius; the exact text of the trunk's three code sites you will mirror. Write `docs/discovery/discovery_2026-09-19_corner_radius_alignment.md` (objective, files read with full paths, findings, risks, open questions), commit it alone with pathspec, and stop. The analysis in chat starts from the saved report.

**Phase 2, after GO.** Edits as small as the contract allows; no renaming of existing identifiers; no change to `border`. Run from `frontend/`: `npm run typecheck` (compare with the baseline measured in Phase 1 on this branch, not with the trunk's 33), `npx vitest run`, `npm run build`. One code commit (with tests), then one docs commit (inbox entry, and this prompt file if untracked), pathspec only. Subjects in English with the Prompt-ID; body with the P6 `Model:` trailer from the session banner. No push: `P-2026-09-19-1740` pushes the branch before the merge.

After the code commit, measure the effect on the merge and put the numbers in the inbox entry: `git merge-tree --write-tree --name-only alfonso-frontend-jjtl validation-skeleton`, and `git merge-file -p` for `irTypes.ts`, `irCompile.ts`, `IRNodeContent.tsx` against the merge-base. The target is that every remaining hunk in the three files is a take-branch hunk (the trunk's `separatorColorStyle` rebuild is the merge lane's job, R-IRN-36). If a hunk still needs a decision, say which and stop.

Hard stop after Phase 2 commits. Alfonso's visual check comes with the merged tree, not here.

## RIFERIMENTI

- `docs/decisions.md` R-IRN-31 and R-IRN-33 (trunk), R-IRN-35 and R-IRN-36 (trunk, added by `P-2026-09-19-1735`; read them with `git show alfonso-frontend-jjtl:docs/decisions.md`).
- `docs/handoff/decisions-symbol-editor-1b.md` D1 (border per axis) and D5 (corner radius, superseded on the type by R-IRN-35).
- Gate report `docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md` section 5.6 (the two notions and the border dependency), trunk commit `7f16439ff`.
- Trunk parity commits `400095370`, `6ee6efcd5` for the compile and resolve code to mirror.
- CLAUDE.md §5 (a test is judged by the mutations it kills), §6.4 (Prompt-ID), RC-13 (docs and code never in one commit; staged work of others untouchable).
