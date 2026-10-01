# Phase 1 report: the Activity (UML) fork and join bar declared 7 px
Prompt-ID P-2026-10-01-2230 · `docs/prompts/claude_2026-10-01_2230_prompt_activity_bar_7px.md` · Chat C-2026-10-01-2220 · session: started by `lane-run`, id not shown to the executor · tree `~/jjodel-w-forkbar`, branch `activity-bar-7`, HEAD `ff6c01f57` (code as `ac3890b7e`: the only commit after it is the prompt, docs) · executor Anthropic Claude Sonnet 5.5. A set of hypotheses with evidence, not a reference. [R] read in this phase, [M] measured in this phase.

## 0. Answer in brief
- **One constant, one use** [M, `command grep -rn ACTIVITY_BAR_SIZE frontend/src docs`, exit 0, positive control `ACTIVITY_DECISION_SIZE` found at `:773`, `:845`]: declared at `viewpointDerivation.ts:778`, read once at `:848`. Nothing else in `src` or `scripts` names it.
- **Three tests and two comments say 5×120.** Two tests pin the derived document and move with the change: `derive/__tests__/activityUml.test.ts:295-299` and `nodes/__tests__/nodeSizing.test.ts:174-175`. One pins a pure function with the same numbers and stays: `nodeSizing.test.ts:61` (`defaultBoxFor({ width: 5, height: 120 }, ...)`, it tests the floor's absence, not the notation). The two comments are `viewpointDerivation.ts:775` and `:796`.
- **A derived viewpoint stores the size.** `createDerivedViewpoint` copies the document onto each view (`(d as any).ir = v.ir`, `utils/deriveViewpoint.ts:73`) and the node reads `compiled.ir.defaultSize` from that stored view (`IRNodeContent.tsx:275`). A viewpoint derived and saved before this change keeps `defaultSize` 5 until it is derived again. No render-time fallback exists. This is the same state R-VP-25 accepted for the arrowheads («Viewpoints already derived keep what they saved»).
- **What makes the demo show 7 is a derivation done after the change.** There is no committed scene file for the MODELS demo [M, `git ls-files`, full output, see H4], and `docs/demo/models_2026_simulator_demo.md:328` builds the metamodel by hand. The dialog derives on DemoFlowB with Activity (UML) preselected (R-VP-26 (4)), so a fresh derive carries 7. No scene file, persisted project or migration is edited by this lane; an already-saved `DemoFlowB (derived)` viewpoint in Alfonso's project must be deleted and derived again to show 7. That is a step for Alfonso, not an edit by the lane.
- **No migration is owed.** No IR key is added, no `irVersion` bump (R-VP-26 (5), R-IRN-32); Rule 14 (VersionFixer) is about `DV.tsx` and `defaultViewTemplate.ts`, neither touched. `derive/` is not in the §3.1 table: Layer Impact Report not-required, light tier.
- **Expected paint**: node 7×120, painted bar 5×118 (the wrapper keeps a transparent 1 px border, `discovery_2026-09-30_activity_sizes.md` §0, last bullet). Measured in Phase 2, not assumed.

Recommended: proceed to Phase 2 in cascade; no question lacks a single recommendation; nothing needs a scene, project or migration edit.

**Decisions taken (unattended)**: the questions below, adopted as recommended (RC-21).
**Decisions awaiting Alfonso** (RC-26): none new. Visible effect for him: the next derive of DemoFlowB shows the thicker bar; a saved derived viewpoint does not change until derived again.

**Questions**
1. Viewpoints already derived. Recommended: leave them at 5, no migration; re-derive to get 7 (R-VP-25's precedent).
2. `nodeSizing.test.ts:61`. Recommended: leave it, it pins `defaultBoxFor`, not the notation; the rename of the neighbour at `:174` is the only edit in that file.
3. Bar height, fill, border, the classic Petri bar (`CLASSIC_BAR_SIZE`, 10×44). Recommended: unchanged, as the prompt says.
4. The decision row R-VP-36 amends R-VP-26 (2) on the thickness only; R-VP-26's text is add-only and is not edited. Recommended: as the prompt says.

## 1. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | `ACTIVITY_BAR_SIZE` has one caller | **holds** [M] | `const ACTIVITY_BAR_SIZE = { width: 5, height: 120 } as const;` (`viewpointDerivation.ts:778`); `size = ACTIVITY_BAR_SIZE;` (`:848`); `command grep -rn "ACTIVITY_BAR_SIZE" frontend/src docs`, exit 0: those two plus the prompt file |
| H2 | Only the Activity tests pin 5×120 | **partly** [M] | `command grep -rnE '"width": ?5[,}]|width: 5,|5 by 120|5x120|5×120|5 px thick|bar 5' frontend/src frontend/scripts` (`.ts .tsx .json .snap .mjs .js`), exit 0: `nodeSizing.test.ts:61` (function pin, stays), `:174` (derived document, moves), `activityUml.test.ts:295`, `:299` (moves), `viewpointDerivation.ts:775`, `:778`, `:796`. No snapshot file exists (`toMatchSnapshot` grep over `derive/` and `nodes/`, exit 0, no hit; control: the first grep found its hits through the same tool) |
| H3 | A saved derived viewpoint reads the size at render from the code | **falsified** [R] | `(d as any).ir = v.ir;` (`utils/deriveViewpoint.ts:73`); `useContentDrivenSize(vertexId, form, contentRef, 'defaultSize' in compiled.ir ? compiled.ir.defaultSize : undefined);` (`viewpoint/ir/IRNodeContent.tsx:275`); the hook calls `authoredDefaultSize(defaultSize)` on that argument (`useContentSize.ts:158`) |
| H4 | Showing 7 in the demo needs a scene file, a persisted project or a migration | **falsified** [M] | `git ls-files \| command grep -iE "demo\|scene" \| command grep -vE "^docs/\|__tests__\|\.md$\|^frontend/public/webjars/"`, full output: one file, `viewpoint/ir/irDemoFixture.ts`, a console helper for a generic «IR Demo» viewpoint with no bar, fork or Activity (`command grep -nE "bar\|fork\|join\|defaultSize\|Activity"` finds only the import line, `:18`); control, the same pipeline without the last filter: 62 paths. The demo's DemoFlowB is built by hand (`docs/demo/models_2026_simulator_demo.md:328`, «Metamodel `DemoFlowB` (builder)») and derived through the dialog, which reads `ACTIVITY_BAR_SIZE` at derivation (`viewpointDerivation.ts:848`) |
| H5 | Changing the constant moves another notation's documents | **falsified** [R] | the only use is in the `fork`/`join` branch of `deriveActivityViewpointIRs` (`:846-848`); `CLASSIC_BAR_SIZE` is its own constant (`:877`, used at `:959`); the Flowchart and the other notations do not call it |
| H6 | A migration of persisted views is owed | **falsified** [R] | no key added, no `irVersion` change (R-VP-26 (5)); `validateIR` accepts any `defaultSize` axis finite and > 0 (`irValidate.ts:303-308`); Rule 14 concerns `DV.tsx` and `defaultViewTemplate.ts` |
| H7 | The bar paints 5×118 at the declared 7×120 | **to be measured** in Phase 2 | the 2026-09-30 measure was node 5×120, painted 3×118 (`discovery_2026-09-30_activity_sizes.md` §6); the rule is node minus 2 on each axis |

## 2. Files and lines per change (Phase 2)
1. `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts`: `:778` the constant to 7; the comment `:775` («5 px thick») and `:796` («5 by 120 px»).
2. `frontend/src/components/editor-v2/viewpoint/derive/__tests__/activityUml.test.ts`: `:295`, `:299`.
3. `frontend/src/components/editor-v2/nodes/__tests__/nodeSizing.test.ts`: `:174-175` (the name and the expectation).
4. Docs: this report, one row R-VP-36 in `docs/decisions.md`, an entry in `docs/log-inbox/views.md`, the Status of the prompt.
Seven files over the lane, two commits (code three, docs four, P13). Rule 19 (more than 5 files) asks for the list and a confirmation: the list is the one above and the prompt's DOVE, which names each of them and was given by Alfonso, so it is taken as the confirmation. Recorded in the log entry.

## 3. Dependencies and risks
- A viewpoint saved before the change keeps 5; the same project can hold two derived viewpoints with two bar thicknesses. Visible, harmless, ticketed by R-VP-25's precedent.
- The edge router's end offset leaves the flows 5 px short of every symbol (`discovery_2026-09-30_activity_sizes.md` §6, read on the crops). Unchanged by this lane; the thicker bar makes it less visible, not more.
- The authoring panels do not name a 5 px bar: `command grep -rnE "width: ?5\b" frontend/src/components/editor-v2/viewpoint/authoring`, exit 1; control, `width: ?\w` on the same path, hits in `TextStyleField.tsx:91` and `SymbolEditorModal.scss:27`.

## 4. Files read (under `/Users/alfonso/jjodel-w-forkbar/`)
`CLAUDE.md` (the rules block, §3, §5, §6, §17, §21), `frontend/src/components/editor-v2/CLAUDE.md` (whole), `docs/PROTOCOL.md` P16 (`:368-433`) and the P4, P6 lines, `docs/decisions.md:4515-4660` (R-VP-24..35), `docs/discovery/discovery_2026-09-30_activity_sizes.md` (whole), the headings and §0 of `discovery_2026-09-30_activity_uml_notation.md` and `discovery_2026-09-30_activity_decision_merge.md` by grep; `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts:760-870`, `frontend/src/utils/deriveViewpoint.ts` (whole), `viewpoint/ir/useContentSize.ts:105-130`, `:200-215`, `viewpoint/ir/IRNodeContent.tsx:265-280`, `nodes/nodeSizing.ts:40-85`, the tests `nodes/__tests__/nodeSizing.test.ts:50-70`, `:160-200` and `derive/__tests__/activityUml.test.ts:280-310`; outside the tree, read only: `~/jjodel-w-notations/frontend/scripts/smoke/_tmp_actsize_probe2.ts` (whole), the model of this lane's probe.
