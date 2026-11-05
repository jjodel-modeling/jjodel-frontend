# Discovery — the hand-written core JjTL transformation, in node on the trunk and in the app

Prompt-ID: P-2026-11-05-1400 · prompt `docs/prompts/claude_2026-11-05_1400_prompt_core_jjtl_called_rules_in_app.md`
Session: 69db1b64-0d30-4a3c-8e95-acab4799266a · tree `~/jjodel-w-corexf`, branch `hw-core-jjtl-app`, HEAD `5c744b50c`
Executor: claude-opus-5-5 (Opus 5.5) · lane full, unattended

This report is a set of hypotheses with evidence, not a reference. Whoever uses it rereads the real files.
Every figure is tagged **measured** (a run in this lane, on `5c744b50c`) or **read** (a file of this tree).
Inputs (read only, outside the tree, named by file name only): `CoreSpec.ecore`, `ArbiterSpec.ecore`,
`SyncRTL.ecore`, `CoreSpec2SyncRTL.jjtl` (500 lines), `CoreSpec2SyncRTL.generated.jjtl` (19,454 lines),
`ArbiterSpec2SyncRTL.jjtl`, the five XMI models, their `*-syncrtl.json` references, `syncrtl-classes.json`,
`xmi2json.py`, `hwproto_xform.test.ts`. Probes, logs and screenshots stay in the lane folder, outside the tree.

## 0. Answer in brief

1. **Node, current trunk: yes, it still matches** (measured). The hand-written transformation gives the reference
   tree on all four core models: `rv_mc4` 2,524 objects, `rv_pf4` 2,680, `rv_mc32` 2,524, `core_mc4` 961, zero
   differences after normalisation, no warning. The generated control also matches on `rv_mc4`.
   **The arbiter is not unchanged**: with the source text passed to the parser (the prototype's new path, and
   the app's path) `ArbiterSpec2SyncRTL.jjtl` **does not parse** (3 errors at line 74, `value := 0 -> type {...}`),
   so there is no output. Without the source text it parses and matches the reference (108 objects, 0 differences).
2. **App: the write-back is complete and fast, the model is not the reference** (measured, dev server, load 5-13).
   Both transformations settle in 13.0-16.2 s; 2,524 of 2,524 objects, 0 missing, per-class counts equal,
   containment order equal. But **136 of 1,999 attribute values differ** from the reference, identically for the
   hand-written and the generated transformation (their two app outputs are equal to each other). Cause: the
   XMI import stores `xlen` and `nregs` as strings (`"4"`), the source serialiser hands the raw strings to the
   executor, so `xlen.log2()` fails (27 warnings in the JjTL output panel) and copied integers are written as
   strings. The same 136 differences reappear in node when the source carries those integers as strings: the
   write-back itself loses nothing.
3. **Masks above EInt** (measured): one distinct value, 4,261,441,663, on 13 `Const` objects of `rv_mc4`. The
   import of `SyncRTL.ecore` accepts `Const.value : EInt` without a warning; the write-back stores 4,261,441,663
   in the D-layer; every read through the L-layer returns **2,147,483,647**, silently clamped; the model panel
   still says "Conforms to SyncRTL". No private `ELong` copy was needed.

Four tickets filed (section 6). Nothing fixed.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | On the current trunk the hand-written transformation still produces the reference model in node, on the four core models | **holds** (measured, §2) |
| H2 | The arbiter's output is unchanged now that the source text is passed to the parser | **falsified** (measured, §2.2): it no longer parses; unchanged only on the old path |
| H3 | In the app, the hand-written transformation writes back the same model as the reference | **falsified** (measured, §3): objects and order yes, 136 attribute values no |
| H4 | The defect, if any, is the write-back's | **falsified** (measured, §3.3): the executor's input differs; the write-back reproduces node exactly except unset nulls |
| H5 | The app refuses `Const.value : EInt` or the values above it | **falsified** (measured, §4): accepted, stored raw, clamped on read |

## 2. Node, current trunk

Method (measured). The prompt's `hwproto_xform.test.ts`, copied under `frontend/src/jjtl/executor/__tests__/`
for the runs only and deleted after (never committed; `git status` clean of it). A variant that calls
`new JjtlParser(tokens)` instead of `new JjtlParser(tokens, src.trim())` served the arbiter comparison.
Sources flattened from XMI as the app serialises them (`frontend/src/components/project/ProjectEditor.tsx:1548-1590`):
one object per element, pre-order, `id`, `name`, `className`, `__type`, attributes, containment as `[{__ref}]`,
`_containerId`; integers typed from the metamodel by `xmi2json.py`'s reader. Comparison: the same tree after
dropping keys that start with `__` other than `__type`, the key `className`, and `monitor: false`.
Positive control of the comparator: `rv_mc4` reference against the `rv_mc32` output reports 136 differences
(`width 4 vs 32`, the name), against `rv_pf4` 526 differences and 16 class-count mismatches.

### 2.1 Core

| model | objects ref / out | classes | differences | warnings | executor test time |
|---|---|---|---|---|---|
| rv_mc4 | 2,524 / 2,524 | 32 | 0 | 0 | 71 ms |
| rv_pf4 | 2,680 / 2,680 | 32 | 0 | 0 | 58 ms |
| rv_mc32 | 2,524 / 2,524 | 32 | 0 | 0 | 60 ms |
| core_mc4 | 961 / 961 | 28 | 0 | 0 | 44 ms |
| rv_mc4, generated control | 2,524 / 2,524 | 32 | 0 | 0 | 250 ms |

All measured, `success true`, one `Module`, byte-equal after normalisation.

### 2.2 Arbiter

Measured, `arbiter3` (7 source objects), `ArbiterSpec2SyncRTL.jjtl`:

- with the source text: `PARSE` errors, no AST, no output:
  `JjEL uses '.' for method calls, not '->' (which is OCL syntax)` at 74:47 and 74:57, `Failed to parse JjEL expression` at 74:44.
- without the source text: `success true`, 108 / 108 objects, 14 classes, 0 differences.

Line 74 of the input (read): `-> reset { -> Const { value := 0 -> type { -> Bool { } } } }`: an assignment and a
nested creation on one line. Why the two paths differ (read): with the source text the parser delegates the
right side of `:=` to JjEL and stops only at a newline or a closing brace,
`frontend/src/jjtl/parser/parser.ts:420-422`:

```
                expression = this.source !== undefined
                    ? this.parseJjELExpression([TokenType.NEWLINE, TokenType.RBRACE])
                    : this.expression();
```

so the expression text becomes `0 -> type { -> Bool {`, which JjEL rejects. The old `expression()` stops at
`->`. The app parses with the source text (read): `frontend/src/jjtl/hooks/useJjtlParser.ts:61`
`const parserResult = parse(lexerResult.tokens, source);`, and so do the editor markers,
`frontend/src/jjtl/editor/JjtlEditor.tsx:58`. The arbiter was not run in the app (not in scope); that it fails
there too is read, not measured. The core transformations do not contain this one-line form (they parse with
the source text, measured).

## 3. App

Method (measured). Dev server of this tree on port 3214 started and stopped by `lane-run probe` for each run.
Playwright, one fresh browser context and project per run: `CoreSpec.ecore`, `SyncRTL.ecore`, `rv_mc4.xmi`
through the app's hidden file inputs (`ProjectEditor.tsx:3377-3389`, the handlers at `:978` and `:1049`);
the transformation created in the New Transformation dialog (source `CoreSpec`, target `SyncRTL`), its text set
in the editor's Monaco model, run from the editor's Execute button on `rv_mc4` into `out1`. Settled = the
nested-materialisation event, the "Nested attribute setting complete" log, then 3 s with no long task and no
store dispatch; the figure is the end of the last long task or dispatch, from the click. out1 read from the
D-layer: containment in `DValue.values` order, attributes as stored. Load average (1 min) recorded at each run's
start and end; none above 20, so every timing stands.

### 3.1 Imports (measured)

| file | result | summary |
|---|---|---|
| CoreSpec.ecore | success | 3 classes, 7 attributes, 2 references, 3 enums, 0 warnings |
| SyncRTL.ecore | success | 38 classes, 13 attributes, 58 references, 1 enum, 0 warnings; `Const.value` type `EInt` |
| rv_mc4.xmi | success | single root, 1 root + 35 nested objects, 6 values, 0 warnings |

### 3.2 Runs (measured)

| run | transformation | load start → end | settled | objects out / ref | missing | attributes differing | panel warnings |
|---|---|---|---|---|---|---|---|
| new1 | hand-written | 6.27 → 5.62 | **13.0 s** | 2,524 / 2,524 | 0 | 136 / 1,999 | 27 |
| gen1 | generated | 5.11 → 5.46 | **13.8 s** | 2,524 / 2,524 | 0 | 136 / 1,999 | 27 |
| new2 | hand-written | 7.26 → 13.20 | **16.2 s** | 2,524 / 2,524 | 0 | as new1 | 27 |

Phases, new1 / gen1 (measured, ms from the click): executor result 160 / 164; root attributes written 1,168 /
1,172; nested attributes written ("1940 written") and walk event ("created 2523, unplaced []") 4,860 / 4,980;
last dispatch 8,171 / 8,965; last long task 13,006 / 13,829. Long tasks 11.2 s / 12.1 s in total, longest
1.45 s / 1.49 s; 18 dispatches each. No page error, no console error.
Editor markers: none for either text. new1 and gen1 give the **same** out1 tree (0 differences between them).

JjTL output panel (measured, new1; gen1 the same but "Processing 3 mappings" and "Created 1 target class types"; excerpt, timestamps and the source-model line dropped, the 20 listed warnings all `log2`):

```
Starting transformation execution...
Output model: out1
Processing 2 mappings...
Transformation completed successfully.
Created 32 target class types.
27 warning(s):
Warning: Expression evaluation failed (JjelExpression): Unknown method 'log2' for type String. Available: toUpper, toLower, ...
... and 7 more, listed in the Trace tab.
Nested objects in "out1": 2523 created, 0 not placed.
```

Status bar: "Valid", "27 Warnings", "Success 121ms". Model panel: "Conforms to SyncRTL". Screenshots
`new1-page.png`, `gen1-page.png`, `*-panel.png` and the panel text are in the lane folder. Other console
warnings, both runs: 28 react-redux "Selector unknown returned a different result" (dev only), 8 portDistribution
"handle overflow".

### 3.3 The 136 differences (measured, new1 and gen1 alike)

| kind | class.attribute | count | example (reference vs app) |
|---|---|---|---|
| type only | Word.width | 57 | `4` vs `"4"` |
| type only | Array.size | 2 | `4` vs `"4"` |
| missing in the app | Slice.hi | 32 | `3` |
| missing in the app | Word.width | 25 | `3` |
| wrong value | Extend.width | 10 | `12` vs `"4"` |
| wrong value | Word.width | 10 | `12` vs `"4"` |

No other attribute differs; no difference of shape, order or class. Cause, in three steps:

- (read) The XMI importer writes every attribute value as a string, `frontend/src/services/export/XMIService.ts:898`
  `const rawValue: string = String(itemJson[attrKey]);` and `:913` `values = [rawValue];`.
- (read) The source serialiser hands the raw D-layer values to the executor, `ProjectEditor.tsx:1567-1573`
  (`serializeFeatureValues((feature as any).__raw?.values, ...)`), so no cast to the declared `EInt` happens.
- (measured) In the app's source, `Core.xlen` and `Core.nregs` are `"4"` raw and `4` through the L-layer. In
  node, the same transformation on a source with those integers as strings gives the 27 `log2` warnings and
  an out1 equal to the app's except for 57 attributes the executor sets to `null` (`Slice.hi`, `Word.width`),
  which the write-back leaves unset. So the write-back loses nothing; the executor's input is not the model.

Through the L-layer (measured, new2) the 79 string widths and sizes read back as numbers (`"4" -> 4`), so the
type-only differences are invisible to JjEL and the views; the 57 missing and the 20 wrong values are not.

## 4. `Const.value : EInt` and the masks (measured unless marked)

- One distinct value above 2^31-1 in `rv_mc4`: **4,261,441,663** on 13 `Const` objects (also in the other core
  references: 13 in `rv_pf4` and `rv_mc32`, 5 in `core_mc4`). The other large literals of the transformation
  (1,073,741,875, 1,073,762,323, 1,073,762,355) are below 2^31-1. The prompt speaks of two masks; one distinct
  value exceeds `EInt` on these inputs.
- The import does not refuse `EInt` (no warning); no `ELong` copy was used.
- D-layer after the write-back: 4,261,441,663 (`number`), on all 13. The reference comparison of §3.3 reads
  raw values, so the masks count as equal there.
- L-layer read of the same 13 slots: **2,147,483,647**. Read: `frontend/src/model/logicWrapper/LModelElement.tsx:7769-7771`
  sets `numbermax = 2147483647` for `EInt`, and `:7661` clamps on every numeric read,
  `v = Math.min(numbermax, Math.max(numbermin, v));`. No warning, and the model panel reports
  "Conforms to SyncRTL" (screenshot `gen1-page.png`).

## 5. Dependencies and risks

- Every M1 model imported from XMI feeds strings for its integers into JjTL; any arithmetic builtin
  (`log2` here) fails or concatenates. Models built in the app were not measured.
- A one-line `attr := expr -> feature { ... }` parses in node without the source text and fails with it: the
  prototype's harness and the app now agree, so the arbiter transformation needs either the parser or the text
  changed.
- The clamp makes an out-of-range `EInt` look valid and smaller, everywhere the L-layer is read (views, JjEL,
  any later transformation on out1). The metamodel is the inputs' to change, not this lane's.
- The welcome-modal key in the smoke seed is stale (read: `frontend/scripts/smoke/states.ts:186-187` set
  `jjodel_welcome_3_1_seen`, `frontend/src/components/WelcomeModal/WelcomeModal.tsx:6` reads
  `jjodel_welcome_3_1_1_seen`); the probe set the current key itself. Every Playwright probe built on `seed`
  meets the backdrop (measured: the first run timed out on it).

## 6. Tickets filed

1. high — XMI-imported integer attributes reach JjTL as strings (`log2` fails, ints written as strings).
2. medium — the arbiter's one-line `value := 0 -> type {...}` does not parse when the source text is passed.
3. medium — an `EInt` value above 2^31-1 is stored raw and silently clamped on every L-layer read; conformance says it conforms.
4. low — the smoke seed sets a stale welcome-modal key.

## 7. Open questions

1. Should the fix of ticket 1 cast in the XMI importer (store numbers) or in the source serialiser (cast by declared type), or both?
2. Is `CoreSpec2SyncRTL.jjtl` meant to guard `xlen.log2()` against a string source, or is a typed source a precondition?
3. Should the arbiter's line 74 be split over lines in the input, or should `parseJjELExpression` stop at `->`?
4. Is `Const.value` to become `ELong` in `SyncRTL.ecore`, given the clamp?
5. Should the app run of the other three core models and of the arbiter follow, once ticket 1 is fixed?
