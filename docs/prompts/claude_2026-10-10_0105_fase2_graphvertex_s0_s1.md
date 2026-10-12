[P-2026-10-10-0105] Phase 2 GO: slices S0 and S1 of your plan (§I). Non-visual. Hard stop after S1.

Prompt-ID: P-2026-10-10-0105
Chat: C-2026-10-10-0057
Lane: full (IR schema extension, §3.1 zone `viewpoint/ir/`)

## Ratification

Alfonso ratified everything on 2026-10-10 at 08:27 ("ratifico tutto"):

- the eight «Decisions taken (unattended)» of §I as you recommended them (D-a seed, D-b two views, D-c rows win with an `irValidate` warning, single visual parent fixed in the interpreter with innermost-wins, pool channel via `laneSets.values[0]`, the name `layout` with `mode: 'free' | 'partitions'`, v1 limited to the root form, `containment.edges` defaulting to `show` with the seed writing `hide` on non-composition channels);
- the four «Decisions awaiting Alfonso» as recommended: (1) critical-zone go-ahead slice by slice: S1, S2 and S4 in the §3.1 zone are granted now, and S3 gets its own go-ahead with its own LIR in `docs/lir/` if it touches `canvasToJjom.ts`; (2) strategy (β), computed placement in absolute coordinates, which amends spec v1.2 §8; (3) graphVertex becomes authorable, which amends R-6 (2026-08-04) and R-IRN-4, effective when S1 has landed; (4) S5 gets a separate read-only discovery before any code. The chat launches that discovery as its own lane (P-2026-10-10-0830, branch `nested-vertices`). This lane does not touch S5;
- the three open questions: (1) MessageFlow endpoints: the §G1 typing (only Participant, Task, StartEvent and EndEvent are `InteractionNode`) is the OMG restriction, so no extra check; (2) a pool without `processRef` draws as a thin band (an S2 concern, record it only); (3) lanes are `collapsible: false` and persist no `irCollapsed`.

## COSA

**S0. Spec addendum and registry.** Write `docs/spec/claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md`, in English, covering:

- every §G3 key with type, default when absent and validation rules;
- the amendment of spec v1.2 §8: absolute coordinates, computed placement (β), `layout` optional, and the v1.1 values `vertical | horizontal | grid` withdrawn as never implemented;
- the single-visual-parent rule;
- the D-c precedence;
- channel-edge suppression;
- the membership modes, including the creation-owner rule of §D3;
- the partition geometry rule of §E2.

Then register the ratified decisions in `docs/decisions.md` as one new R- series. Pick the prefix with a search plus a positive control, and call it something like `R-GV` only if it is free. Each row says "ratified by Alfonso 2026-10-10". Two of the rows record the amendments, of R-6 / R-IRN-4 and of spec v1.2 §8, and point back to the rows they amend. Do not edit the amended rows.

**S1. Schema, compile, validate, channel resolution, geometry. Pure code, no rendering change.**

- `irTypes.ts`. On `GraphVertexViewIR`, add `containment.children`, `containment.layout`, `containment.membership` and `containment.edges`, plus `visible`, `resizable` and `defaultSize` for parity with the vertex kind. Widen `LabelPosition` with `'header'` and add `LabelSpec.orientation`. All keys are optional (Rule 11).
- `irCompile.ts` compiles the new keys. Absent keys compile to today's values.
- `irValidate.ts` gets the §G3 rules and the D-c warning.
- `irContainment.ts`:
  - resolve a declared `children` PathExpr channel;
  - apply the single visual parent: innermost claimant wins, then canvas order;
  - expose the multiply-claimed and unclaimed sets in the containment model (wiring them into `problems/` belongs to S2);
  - expose the slot ids a non-composition channel reads, so that S2 can add them to the memo signature of `useIRContainment` (the R-B16 risk you flagged).
- New pure module `irPartitions.ts`: the §E2 geometry. It takes the container box, the header band, the axis and each partition's `{h, isResized}` or content size, and returns the partition boxes. It also covers the paired-border resize that keeps the sum constant.

Invariant: with no new key present, every existing view resolves, compiles and renders exactly as today. Prove it with a test that compiles the existing graphVertex fixtures before and after.

Tests: extend `ir.test.ts` and `irValidate.test.ts`, and add `irPartitions.test.ts`. Write the §G2 IR as a fixture and assert that it compiles and validates clean. Run a mutation bench on `irPartitions.ts` and the channel resolver. List each mutant with the test that kills it, and report survivors honestly.

## DOVE

`docs/spec/` (the new addendum), `docs/decisions.md`, and `frontend/src/components/editor-v2/viewpoint/ir/` (`irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `irContainment.ts`, new `irPartitions.ts`, plus their tests). Nothing else.

## COME

- Write the Layer Impact Report first if CLAUDE.md §3 requires one for `viewpoint/ir/`. The go-ahead is granted.
- Gates: `npx tsc --noEmit`, the vitest suites you touched plus the whole `viewpoint/ir` suite, then `npm run build`. All green, or stop with `Outcome: blocked`.
- Commits, each with an explicit pathspec and the `Model:` trailer (P6): one `docs(spec)` commit for S0 (addendum plus decisions rows), then `feat(ir)` commit(s) for S1. Use one inbox entry in `docs/log-inbox/ir-graphvertex.md` via the `log-entry` skill.
- Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso» (RC-26).

## NON FARE

- No file outside DOVE. In particular, do not touch `useIRContainment.ts`, `IRContainmentHulls.tsx`, `IRNodeContent.tsx`, `ObjectNode.tsx`, `EditorV2.tsx`, `sync/` or `hooks/`. Those belong to S2, S3 and S5.
- No rendering change, no authoring panel, no seed (S4).
- No `irVersion` bump and no VersionFixer.
- Do not touch the `Status` line of the prompt.

## HARD STOP

After the S1 commits with green gates, stop with `Outcome: hard-stop`. S2 (visual) comes as the next GO in this session.
