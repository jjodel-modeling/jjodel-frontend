# Discovery: the empty raw `name` slot of an object created from text

- Prompt-ID: P-2026-11-07-0253 (`docs/prompts/claude_2026-11-07_0253_prompt_textual_name_slot_discovery.md`)
- Chat: C-2026-11-03-1037 · Front: codegen · Lane: full (discovery, read only)
- Session: 67bd0065-810e-4ab4-bddd-2a7acec6d063
- Tree: `~/jjodel-w-textns`, branch `textual-name-slot`, HEAD `e47437874` (the prompt's commit, on `04b782a5b`)
- Executor model: claude-opus-5-5
- Depends: P-2026-11-07-0157 (D3b found the symptom: `~/.jjodel-lanes/P-2026-11-07-0157/probe.out.txt`, crop
  `d3b-3-conformance-warning.png`)

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the
real files.

## 1. Objective

A model created from the Text tab shows `Module cpu` everywhere (labels, tree, text) while its raw identity slot reads
`[]`, and conformance warns that a named Module lacks its required `name`. Find the root cause before any fix: reproduce
it on the port corpus with controls, trace the write, place the cause in a layer, and plan the fix lane.

## 2. Hypotheses under test

- H1. The textual apply writes the name somewhere other than the identity slot (a `name` property, not the `name`
  attribute's value). **Holds, partly**: the textual layer writes nothing at all for these objects; the name comes from
  the JjScript `create instance of C "h"` handle, which reaches `DObject.name` and `initialName` but not the slot (§4).
- H2. The name is visible because a reader falls back from the empty slot to a derived name. **Holds**: `get_name`
  yields to `data.name` and `get_values` to `initialName` over a never-written slot (§4.4).
- H3. The cause is in the core (LModel / DObject / the apply transaction). **Falsified**: each core piece behaves as its
  own comments declare; the defect is the textual layer's assumption that the creation handle names the object, which
  the JjScript executor does not honour for the slot (§5).
- H4. Only the Module is affected. **Falsified**: every object whose handle equals its name has an empty slot (`cpu`,
  the Port `result`, the Ref `ready`); only `Module.name [1..1]` makes conformance say so. The XMI export drops all three
  names (§3, E).

## 3. Files read (full paths)

- `/Users/alfonso/jjodel-w-textns/frontend/src/codegen/textual/textApply.ts` (whole, 99 lines)
- `/Users/alfonso/jjodel-w-textns/frontend/src/codegen/textual/textDiff.ts` (lines 440-599, `diffLines`)
- `/Users/alfonso/jjodel-w-textns/frontend/src/codegen/textual/modelLines.ts` (lines 1-20 and 136-144)
- `/Users/alfonso/jjodel-w-textns/frontend/src/codegen/textual/ui/TextualTab.tsx` (grep hits only: 125, 180-189, 306-330,
  368, 1314-1330)
- `/Users/alfonso/jjodel-w-textns/frontend/src/jjscript/executor/commands/instance.ts` (lines 573-740,
  `executeCreateInstance`; grep hits of the set path at 947-950, 1101-1102)
- `/Users/alfonso/jjodel-w-textns/frontend/src/model/logicWrapper/LModelElement.tsx` (lines 6090-6124 `DObject.new` /
  `new3`, 6190-6225 `LObject.get_name`, 7780-7810 `get_values` identity fallback)
- `/Users/alfonso/jjodel-w-textns/frontend/src/model/conformance/ConformanceValidator.ts` (lines 27-40, 130-210, CHECK 2)
- `/Users/alfonso/jjodel-w-textns/frontend/src/components/editor-v2/sync/canvasToJjom.ts` (lines 1495-1538,
  `syncCreateObject`)
- `/Users/alfonso/jjodel-w-textns/frontend/src/components/editor-v2/hooks/createAdapter.ts` (lines 25-60, 486-500,
  565-580)
- `/Users/alfonso/jjodel-w-textns/frontend/src/services/export/XMIService.ts` (lines 288-327, `serializeFeatures`)
- `/Users/alfonso/jjodel-w-textns/frontend/src/codegen/textual/__tests__/{textDiff,nestedDiff,modelLines,textualEdit}.test.ts`
  (grep hits of `create instance of` with two lines of context)
- `~/.jjodel-lanes/P-2026-11-07-0157/probe.mjs` (whole) and `probe.out.txt` (whole)
- Decisions R-TXT-44, R-TXT-45, R-TXT-46, RC-17, RC-51 as injected in the prompt.
