# Discovery — textual step C lane C2: the Syntax mode of the Text tab (T4b), and three follow-ups

Prompt: P-2026-11-04-2342 · Chat: C-2026-11-03-1037 · Front: codegen · Branch `textual-c2-syntax-form` from `c09e8f22f`
Read only: no source file changed. The probe of §1.2 lives in the lane folder, outside the repository.

## 0. Objective

(1) Design the third mode «Syntax» of the Text tab (R-TXT-40 D6): the fields the syntax record supports after C1 and
C1d, their current values, which `checkStyle` finding maps to which field, the component tree and its state, the live
preview, Save as one undo step, Basic and Advanced. (2) The `{"v":1}` left by a switch back to C-like. (3) The false
«the app named» after a name is removed. (4) A v2-flow reference to a nameless target drawn as `—`. (5) The lanes and
the decisions D1..Dn.

## 1. Inputs

### 1.1 Files read (full paths under `/Users/alfonso/jjodel-w-textc2/`)

| File | What was read |
|------|---------------|
| `docs/discovery/discovery_2026-11-04_textual_step_c.md` | §3 (F11-F14, §3.2), §4.2, §5, §8 D6 |
| `docs/decisions.md` | R-TXT-16, R-TXT-23, R-TXT-27, R-TXT-40, R-TXT-41, R-TXT-44, R-TXT-45, R-TXT-46, R-SIM-99 |
| `docs/log-inbox/codegen.md` | :1610-1620 (C3a, the `{"v":1}` open point), :1793-1805 (P-2026-11-04-2321) |
| `frontend/src/codegen/textual/annotations.ts` | whole file (326 lines) |
| `frontend/src/codegen/textual/syntaxRecord.ts` | whole file (220 lines) |
| `frontend/src/codegen/textual/style.ts` | whole file (89 lines) |
| `frontend/src/codegen/textual/styleCheck.ts` | :1-262, the `where` of every finding; `ll1Conflicts` :294-307 |
| `frontend/src/codegen/textual/concreteGrammar.ts` | every `refuse`/`remark` site (:232-601), `annotationIssues` :647-653 |
| `frontend/src/codegen/textual/textDiff.ts` | :420-636 (`diffLines`, `planTextEdit`) |
| `frontend/src/codegen/textual/ui/TextualTab.tsx` | :200-335, :545-596, :810-930, :1080-1160, :1285-1413 |
| `frontend/src/codegen/textual/ui/openTextualTab.tsx` | whole file (218 lines) |
| `frontend/src/codegen/textual/ui/TextualTab.scss` | the tokens it uses |
| `frontend/src/codegen/textual/__tests__/textualEdit.test.ts` | :730-784 (the `named` tests) |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | :298-457 (the reference branch of `objectVertexToRFNode`) |
| `frontend/src/components/editor-v2/nodes/valueRenderer.ts` | :381-387 (`isEmptySlot`) |
| `frontend/src/components/editor-v2/nodes/RowValue.tsx` | :232-341 |
| `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` | :540-560, :637-670, :860-880, :1088-1100, :1310-1331 |
| `frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx` | :147-161 (`displayValue`) |
| `frontend/src/components/editor-v2/utils/__tests__/namelessRefTarget.test.ts` | the assertions |
| `frontend/src/styles/tokens/_colors-light.scss`, `_spacing.scss` | accent and slate tokens, the spacing scale |
| `frontend/src/hooks/useInterfaceMode.ts` | exports (`useInterfaceMode`, `isAdvancedMode`) |
| `~/.jjodel-lanes/P-2026-11-04-2255/sD4-v2flow-peer-to-nameless.png` | the crop of item (4) |

### 1.2 Probe

`~/.jjodel-lanes/P-2026-11-04-2342/probe/c2.test.ts`, run with its own `vitest.config.mjs` (root `frontend/`) through
`run-quiet` (log `.agent-logs/c2probe-20261104-234416.log`, exit 0, 1 test passed); output
`~/.jjodel-lanes/P-2026-11-04-2342/probe/c2.out.txt` (24 lines). It measures (a) F13 again on the current code, on the
step C probe's library record at 1,000 objects and on the BOOL and PORT corpora; (b) F12 again, the findings of
`checkStyle` for the seven ambiguous records, and how many `textualNotation` issues (what the tab shows today) each
yields; (c) the record `{"v":1}` against no record on the three corpora, and the record a switch back from Pascal writes.
