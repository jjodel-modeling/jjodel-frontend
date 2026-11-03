# Discovery: JjTL Class2Relational, a non-hardware acceptance case

- Prompt-ID: P-2026-11-03-1434 (fixture and test), closed by P-2026-11-03-1505 (app probe, tickets, this report)
- Prompt files: `docs/prompts/claude_2026-11-03_1434_prompt_jjtl_class2relational.md`,
  `docs/prompts/claude_2026-11-03_1505_prompt_jjtl_class2relational_close.md`
- Sessions: 3371fb28 (P-2026-11-03-1434, stopped at the context ceiling), 5366ad4c (P-2026-11-03-1505)
- Tree: `~/jjodel-w-jjtlc2r`, branch `jjtl-class2relational`, HEAD `7ec6305ae` when this was written;
  the fixture, test and one-line fix are in `8a064bbbd`
- Model: Anthropic Claude Opus 5.5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it rereads the real files.

## 0. Answer in brief

- **The design is general.** Class2Relational (classes, attributes, multi-valued attributes to join tables,
  joined inheritance, references) runs through the executor and through the real Execute dialog, and the output
  equals the expected schema: 1 schema, 3 types, 6 tables, 14 columns, 3 foreign keys, keys and foreign-key columns
  being the table's own columns by identity. Save, reload and reopen give the same tree. Measured.
- **R-JTG-5, 6 and 7 do not fit only the hardware shape.** Nothing in this case contradicts them. All six
  workarounds are grammar or implementation, apart from one design gap at the edge of R-JTG-6: a target created by a
  called rule cannot be referenced a second time (§5).
- **The main finding is W5, and its output is silently wrong.** `let $id = idColumn(c) in { columns := [$id] ... key := [$id] }`
  runs the called rule at each use of `$id`. That gives 8 extra Columns at the model root, and keys and the super FK point outside
  their table, with no warning. Ticket #515, high.
- **#445 is not visible in the app.** The warning is computed with the right line and column
  (`Rule 'Attribute -> Column', binding 'nullable' at line 27, column 5: ...`) and travels in the execution result,
  but the output panel never prints it. Seen in the panel: **no**. Ticket #520, medium.
- **Size.** The natural text has 74 lines and 12 rules (6 matched, 5 called, 1 helper). The running text has 71 lines and 12 rules
  (8 matched, 3 called, 1 helper), reached by 21 edits in six groups, 10 of them for W5. Measured.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The A and B slices express a non-hardware model-to-model transformation with matched, called and lazy rules | **Holds**, with six workarounds (§3) |
| H2 | The executor output is the expected relational schema | **Holds** for WORKAROUND, measured by the test and by the app probe |
| H3 | The app path (Execute dialog, real containment, `_containerId` from the serializer) gives the same output as the executor test | **Holds**, measured: `schemaEqualsExpected: true` on both runs |
| H4 | Save and reopen keep the output tree | **Holds**, measured: `sameTreeAsBeforeSave: true` for `out1` and `out2` |
| H5 | The #445 warning is shown in the output panel | **Falsified**, measured (panel) and read (cause) |
| H6 | R-JTG-5, 6, 7 fit only the hardware shape | **Falsified** (§5), with one design gap named |

## 2. What was run

- **Executor test**, measured at `8a064bbbd`: `frontend/src/jjtl/executor/__tests__/class2relational.test.ts`, 12 tests, all
  green. Fixture `frontend/src/jjtl/__tests__/fixtures/class2relational.ts`: `NATURAL` (the text as one writes it first),
  `WORKAROUNDS` (each `{why, from, to}`), `WORKAROUND` (NATURAL with all of them applied, `:192-197`), `SHOP` (source
  model, flat, `{__ref}` and `_containerId`), `EXPECTED_SCHEMA` (`:292-301`).
- **App probe**, measured on HEAD `7ec6305ae`, port 3242: `~/.jjodel-lanes/P-2026-11-03-1434/probe/c2r.ts`, results in
  `c2r.json` and `probe-c2r.log` there. The probe builds `ClassDiagram` and `Relational` in a fresh project
  (`isAbstract` and `multiValued` as EBoolean). It builds `shop` with real containment: children through
  `LValue.addObject`, so `_containerId` comes from the app's serializer, `ProjectEditor.tsx:1575-1581`:
  `if (fatherData?.className === 'DValue' && fatherData.father) { result._containerId = String(fatherData.father); }`.
  It then puts the committed `WORKAROUND` text into the editor of a new transformation tab and runs it through the
  Execute dialog (`#source-model`, `#output-model-name`), then does the same with `nullable := false` added to the first
  `Attribute -> Column` rule.
- **Probe fidelity, corrected within the phase.** The first full run typed the text with `keyboard.insertText`:
  Monaco auto-indented each newline (5192 characters for 2032), and the #445 warning read `column 45`. With the editor's
  own `setValue` the text is verbatim (2032 and 2054 characters) and the warning reads `column 5`, as in the executor
  test. Only the second run counts. The insertText log is kept as `probe-c2r.insertText.log`.

Probe output, run 1 (measured):

```
counts {"Schema":1,"Type":3,"Table":6,"Column":14,"ForeignKey":3}, objectCount 27, schemaEqualsExpected true
panel: "Processing 8 mappings..." / "Transformation completed successfully." / "Created 5 target class types." /
       "Nested objects in \"out1\": 26 created, 0 not placed."
reopened: out1 27 objects, sameTreeAsBeforeSave true; shop 16 objects
```

## 3. Natural against running: the six workarounds

Each one is recorded in `WORKAROUNDS` (fixture `:109-190`) and pinned by a test that runs the natural form.

| W | Natural form | What happens (measured unless marked) | Running form | Class | Ticket |
|---|---|---|---|---|---|
| W1 | a binding continued on the next line starting with `+` | parse error `23:13 Expected source attribute name`, which does not name the newline | the whole expression on one line (longest line 105 to 153 chars) | grammar | #518 low |
| W2 | `a.parent.name` for an element other than the rule's own | null, `Cannot access property 'name' of null`; join tables lose name, owner column name, Integer type | bare `parent`, owner passed as an argument | implementation: only the keyword is bound, `executor.ts:2827-2840` (read): ``// `parent` keyword: evaluates to the eContainer (owning DObject) of the current source instance.`` | #516 medium |
| W3 | an Integer type found from any element, `e.parent.types...` | depends on W2; and there is no `allInstances` (read: searched `frontend/src/jjtl/` and `frontend/src/jjel/`, positive control `resolveAll`, P-2026-11-03-1434) | `data.filter(t => t.className == "DataType" and t.name == "Integer").first()` | language surface | #519 low |
| W4 | `toLowerCase()` | run-time message `Did you mean 'toLower'?` | `toLower()` | writer's slip, the message is right | none |
| W5 | `let $id = idColumn(c) in { columns := [$id] ... key := [$id] }` | each use of `$id` runs the called rule: 8 extra Columns at the root (6 `id`, `customerId`, `orderId`), keys and super FK point outside their table, **no warning** | a second matched rule per role (`Class c -> Column`, `Attribute a -> Column where a.multiValued`), and `resolve(x, "T")` at each use (R-JTG-3) | implementation, with the design gap of §5 | #515 high |
| W6 | `resolve(x, Column)`, bare type name, inside `[...]` or a lambda | `Column` evaluated as a variable, null; the call throws the very ambiguity it was written to settle | `resolve(x, "Column")`, quoted | implementation: intercepted only as a whole right-hand side, `executor.ts:4004-4011` (read): `if (fc.callee.type === 'Identifier' && (fc.callee as IdentifierAST).name === 'resolve') {` | #517 medium |

Fixed in P-2026-11-03-1434 (one line, allowed by that prompt), `executor.ts:3899`:
`const match = entries?.find(e => (expectedTarget ? e.targetClass === expectedTarget : e.rule === chosenRule));`
Before it, `resolve(x, "T")` took the first rule to T and threw `Unresolved reference` when x had matched another rule
to T (three `Attribute -> Column` rules with disjoint guards). Mutation bench: reverting the line kills 5 of 12 tests
(measured, P-2026-11-03-1434).

Rejected forms (measured, tests `:171`, `:176`): `unique rule f(x)` is a parse error; `unique lazy Class c -> Column`
beside the matched `Class c -> Table` fails before pass 1 with an error naming Class.

Written naturally, no workaround (measured): matched rules with `where`, disjoint guards on one class, implicit trace
resolution of references (`type := a.type`, `column := a`), containment placement through `tables`, `columns`, `types`,
`foreignKeys`, `flatMap`/`filter`/`map`, `is Class` by className, list `+`, `if then else` in a binding, called rules
for single-use targets (`valueColumn`, `refFk`, `superFk`), and `unique lazy DataType -> Type`, which gives the same schema
(test `:165`).

App-only findings (measured by the probe, P-2026-11-03-1505):

- **#445 not in the panel** (#520, medium). The execution result carries
  `Rule 'Attribute -> Column', binding 'nullable' at line 27, column 5: 'nullable' is not a feature of target class 'Column'; the value is not written to the model.`
  The panel shows the same 7 lines as run 1, and the toast reads `Created model "out2" with 1 instances.`
  Cause (read), `jjtl/components/JjtlDevelopmentEnv.tsx:358-360`:
  `addOutputMessage('Transformation completed successfully.');` and
  ``addOutputMessage(`Created ${result.targetModel?.instances?.size || 0} target class types.`);``. Nothing on the success
  path prints `result.warnings`. The Problems tab was not measured.
- **Floating Execute partly under the scrollbar** (#521, low). A pointer click at the centre of
  `.jjtl-editor-action-btn--primary` lands on Monaco's `div.visible.scrollbar.vertical` (`executePointerClickable: false`
  on both runs, screenshot `c2r-run1-exec-covered.png`). The probe clicked the same button through the DOM.

## 4. Size and readability

All figures were measured by `~/.jjodel-lanes/P-2026-11-03-1434/probe/sizes.ts`, run on the committed fixture. A rule body
is the lines between the header and the closing brace.

| | NATURAL | WORKAROUND |
|---|---|---|
| lines / non-blank, non-comment | 74 / 60 | 71 / 55 |
| characters | 1902 | 2032 |
| rules: matched / called / lazy / helper | 6 / 5 / 0 / 1 | 8 / 3 / 0 / 1 |
| body lines per rule, min / max / mean | 1 / 7 / 2.75 | 1 / 4 / 2.33 |
| `resolve(` calls / `let` | 0 / 2 | 9 / 0 |
| longest line | 105 | 153 |
| edits from NATURAL | | 21: W1 1, W2 4, W3 4, W4 1, W5 10, W6 1 (one rewrite of all 9 calls) |

The `unique lazy DataType -> Type` variant (test `:165`) makes it matched 7, lazy 1.

Size does not separate the two: the running text is shorter and its rules are smaller. The cost is in what a
hand-written reader must know, which is read off the running text:

1. A matched rule applies to every element of its class, and its `where` guards must be disjoint (R-JTG-3).
2. A reference to a source element in a binding becomes its trace target implicitly (`type := a.type`).
3. When a class has more than one rule, every resolution names the target: `resolve(x, "T")`, **quoted** (W6).
4. A called rule creates afresh at every call and at every use of a `let` bound to it (W5). A target placed once and
   referenced again must therefore come from a matched rule.
5. `parent` is the keyword of the rule's own source. `x.parent` is not navigation (W2).
6. `data` is the whole source model (W3), and the string method is `toLower` (W4).
7. A binding ends at the end of its line (W1).

Points 1 and 2 belong to any rule language of this family. Points 3 to 7 belong to this grammar and implementation.

## 5. R-JTG-5, 6, 7 against this shape, and the question on `unique`

Rows read from `docs/decisions.md:7200-7211`.

- **R-JTG-5** (called and lazy rules, environment dynamically scoped, values as closures, trace key (source, rule,
  environment)). Class2Relational needs no environment: its called rules are plain functions of their arguments, and
  they worked (`valueColumn`, `refFk`, `superFk`). The decision is vacuous here, not contradicted. W5 touches it at one point:
  the executor treats a `let` value like an environment value, a closure evaluated at each use. R-JTG-5 says
  "values as closures" of the environment and says nothing about `let`. Whether `let` binds a value or a closure is an
  **implementation** choice that W5 makes visible. It is not forced by the decision.
- **R-JTG-6** (`docs/decisions.md:7204-7206`: "A call of a rule not declared `unique` always creates a fresh subtree, even
  under an environment seen before, so one expression may be placed twice with the same bindings"). The hardware shape
  wants this: one expression lowered at two places is two subtrees. In the relational shape, the key column is
  **placed once and referenced again** (`key`, `ForeignKey.column`, both non-containment). R-JTG-6 speaks only of
  containment, and the only way to create once and reference many times is a matched rule plus `resolve()`. This is the one
  **design** gap the case shows. It does not make the decision hardware-only: the matched-rule form works and reads as
  ordinary ATL-style practice. The gap is the missing form for a called rule.
  The decision's own wording, "a rule not declared `unique`", presupposes that a called rule can be declared `unique`.
  Today it cannot: `unique` exists only on lazy rules, and `unique rule f(x)` does not parse (measured, test `:171`).
- **R-JTG-7** (lazy rules never match in pass 1, create on reach). `unique lazy DataType -> Type` is natural here and
  gives the same schema (measured). One rejection needs a reading: a lazy rule on `Class` beside the matched
  `Class c -> Table` fails before pass 1 (measured, test `:176`). If lazy rules never match in pass 1, they should not
  enter the R-JTG-3 conflict check of pass 1. Read as implementation, pending the question below.

**Verdict.** The decisions fit a non-hardware shape. What failed is grammar (W1, W6 in part), implementation (W2, W5, W6),
the language surface (W3) and a writer's slip (W4). The design point is the one above: R-JTG-6 needs a create-once form
for called rules.

**Recommendation on `unique` for called rules.** Admit `unique rule f(args) -> T`, with trace key (arguments, rule,
environment). The first call creates, and later calls with the same key return the same target, under the R-JTG-4
double-claim error for a second containment. This is the form R-JTG-6's wording already assumes, it closes W5's case
without a second matched rule, and it costs the hardware shape nothing: rules not declared `unique` keep R-JTG-6's
fresh subtree. The `let` question (value or closure) is separate, and #515 tracks it.

## 6. Dependencies and risks

- The app probe uses the committed fixture text by import, so a change to `WORKAROUND` changes what the probe runs.
- `JjtlDevelopmentEnv.tsx` is not in the critical zone. The #520 fix is local, but it was not done here: no product code was in
  scope.
- The source model of the probe is built through the L-layer (`addObject`, `$attr.value`, `setValueAtPosition`). The repeated
  `identical assignment` console errors in `pageErrors` (not counted) come from the probe re-setting a name that `addObject` had already set. They are not
  a product error.

## 7. Questions

1. Should `unique` be admitted on called rules, with trace key (arguments, rule, environment)? Recommended: yes (§5).
2. Should `let` bind the value of its expression, evaluated once, rather than a closure? This would make W5's natural form correct (#515).
3. Should a `lazy` rule on a class that also has a matched rule be excluded from the R-JTG-3 pass-1 conflict check (test `:176`)?
4. Is `data` the idiom for "every instance of T", or should `T.allInstances` exist (#519)?
