# Discovery: included source models in the megamodel

- Prompt-ID: P-2026-11-08-1612
- Prompt file: `docs/prompts/claude_2026-11-08_1612_prompt_jjtl_megamodel_included.md`
- Session: f9eef888-555f-4112-af0f-5427b51b89d5
- Tree: `jjtl-megamodel-included`, HEAD `65735858d`
- Model: Anthropic Claude Opus 5.5

This report is a set of hypotheses with evidence, not a reference: whoever uses it rereads the files.
Each claim is tagged **read** (a file at `65735858d`) or **measured** (a run in this phase). Phase 1 ran no code, so every figure below is read.

## 0. Answer in brief

- The record of a run already holds the included models. `buildRunRecord` writes `includedModelIds` on `_state.generatedBy` (read). Item 1 needs only the optional field on `ModelArtifact.generatedBy`.
- `_state` is saved with the whole `idlookup`, and the artifact builder passes `generatedBy` through whole, so nothing else is needed for save and load (read).
- The edge of the primary is built in `frontend/src/model/megamodelInference.ts`, outside the critical zone. No stop condition holds.
- The prompt's premise is «`sourceOf` or `instanceInputOf`, whichever the code uses». The code uses **both** for the primary. Only `instanceInputOf` runs from the source model, as the decision requires, so it is the one edge drawn per included model. Open question 1.
- Both kinds are hidden by default (`DEFAULT_HIDDEN_EDGES`), so the new edges are too. Open question 2.
- The «(included)» mark travels on the existing `MegamodelEdge.metadata`, so no interface changes beyond the one optional field.

## 1. Hypotheses

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | `generatedBy` is written in one place, on the run path | Holds |
| H2 | The run path must change to record the included models | Falsified: already written |
| H3 | `generatedBy` survives save and load | Holds, read only; the probe does not reopen a saved project |
| H4 | The primary has one edge, `sourceOf` or `instanceInputOf` | Falsified: it has both, plus `generatedBy` |
| H5 | The primary's edge is built in a critical-zone file | Falsified |
| H6 | Drawing the edges needs an interface change beyond one optional field | Falsified |
| H7 | Three edges need a new layout rule | Falsified on reading; the probe measures it |

## 2. Files read

Whole: `frontend/src/model/megamodelInference.ts`, `frontend/src/jjtl/components/sourceSelection.ts`, `frontend/src/components/megamodel/megamodelLayout.ts`.

Windows only: `frontend/src/components/megamodel/MegamodelView.tsx` 90-389, `frontend/src/components/megamodel/MegamodelEdge.ts` 50-119, `frontend/src/model/megamodel.ts` 25-99, `frontend/src/components/project/ProjectEditor.tsx` 125-149, 1415-1439, 1760-1839, `frontend/src/common/U.tsx` 430-445, `frontend/src/api/persistance/projects.ts` 160-180, 272-355, `frontend/src/jjtl/SPEC.md` 970-985.

## 3. Findings

**Write path (H1, H2), read.** `frontend/src/components/project/ProjectEditor.tsx:1809`:
`generatedBy: buildRunRecord(transformation.id, sourceModelId, includedModelIds, Date.now())`.
The search `command grep -rl "generatedBy" frontend/src` lists ten files; it is its own positive control, since it returns the file above. The only writer among them is that line.

`frontend/src/jjtl/components/sourceSelection.ts:40-41`:
`if (includedModelIds.length === 0) return { transformationId, sourceModelId, timestamp };`
`return { transformationId, sourceModelId, includedModelIds, timestamp };`
The field is absent when nothing is included. `orderIncludedIds` (:17-23) fixes the run order. Tests exist: `frontend/src/jjtl/components/__tests__/sourceSelection.test.ts:117-125`.

**Item 3, read.** The same `SetFieldAction` writes `_state` on the `DModel` created in that run (`ProjectEditor.tsx:1768`, `:1808`), so a new run cannot touch an older generated model's record.

**Reader, read.** `ProjectEditor.tsx:137`: `const generatedBy = rawState?.generatedBy ?? undefined;`. The whole object is passed on, so the new field arrives without a change there. The type is what omits it: `frontend/src/model/megamodelInference.ts:40-44`. `frontend/src/jjtl/SPEC.md:980`: «The megamodel reads `sourceModelId` only.»

**Save and load (H3), read.** `frontend/src/common/U.tsx:443`: `let str = JSON.stringify(state, proxyToIdReplacer);`, over the state whose `idlookup` keeps every non-project element (:433-438), `DModel` and its `_state` included. `ProjectsApi.save` stores that result (`frontend/src/api/persistance/projects.ts:161`, `:169`). `SaveManager.load` parses it back. The bench cannot import this path (`window is not defined`, as recorded in the header of `sourceSelection.test.ts`), so the round trip test can only pin the record through `JSON` and the artifact builder's contract.

**The primary's edges (H4, H5), read.** `frontend/src/model/megamodelInference.ts:171-211` builds three for one generated model:
- `generatedBy`, generated model to transformation (:176-183);
- `sourceOf`, generated model to source model (:191-197);
- `instanceInputOf`, source model to transformation (:204-210).

The file is not in the table of CLAUDE.md §3.1.

The decision asks for an edge «from the included model to the generated model or to the run», and item 2 for «one edge per included model». Only `instanceInputOf` has the source model as its source end (`frontend/src/model/megamodel.ts:39`: «source model → transformation»); `sourceOf` starts at the generated model. Phase 2 draws `instanceInputOf`.

**Duplicate ids, read.** The primary's id is `derived_${sourceModel.id}_instanceInputOf_${transformation.id}` (:205). Two runs from one source already produce two edges with one id; that stays, since the primary's edge is not to change. For the included models the new loop must not add to it: a model included in two runs, or primary in one and included in another, would otherwise draw twice over itself. The loop runs after the primary's and skips an id already present, so a pair drawn as primary keeps that edge and its plain label.

**Label and interfaces (H6), read.** The view shows a label from the kind: `frontend/src/components/megamodel/MegamodelView.tsx:209`: `label: styleDef.label,`. So the included edges need the same text plus «(included)». `MegamodelEdge` has `metadata?: Record<string, unknown>` (`frontend/src/model/megamodel.ts:73`), and `buildGraph` already reads it (`MegamodelView.tsx:222`). `MmEdge` stays as it is: its `label` is a string.

**Visibility, read.** `MegamodelView.tsx:379`: `const DEFAULT_HIDDEN_EDGES = ['instanceInputOf', 'sourceOf'];`. The probe has to turn the kind on from the legend (`:338-346`, `:1022`).

**Layout (H7), read.** `megamodelLayout.ts:145-169` stacks the models of a source metamodel in the left column, one per row, and `computeAnchorTs` spreads anchors sharing a side (`MegamodelView.tsx:306-334`). No new rule appears to be needed. The probe is the measurement.

## 4. Stop conditions

| Condition | State |
|---|---|
| The primary's edge is in `useJjomSync.ts` or `portDistribution.ts` | No |
| An interface change beyond one optional field | No |
| A new layout rule for three edges | No, pending the probe |

## 5. Plan of phase 2

`megamodelInference.ts`: the optional field and a second loop. `MegamodelEdge.ts`: a small exported label function the bench can import. `MegamodelView.tsx`: use it at `:209`. Tests in `frontend/src/model/__tests__/megamodel.test.ts` and `frontend/src/components/megamodel/__tests__/MegamodelEdge.test.ts`. `ProjectEditor.tsx` and `ExecuteTransformationDialog.tsx` do not change.

## 6. Open questions

1. Should an included model also get a `sourceOf` edge, for full parity with the primary? Phase 2 draws `instanceInputOf` only, per «one edge».
2. Should `instanceInputOf` stay hidden by default, now that it carries the provenance of a multi-source run?
