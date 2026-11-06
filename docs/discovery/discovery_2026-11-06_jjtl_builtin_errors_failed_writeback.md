# Discovery 2026-11-06: builtin errors name the rule (R-FA-13), and what the app writes after a failed run

- Prompt-ID: P-2026-11-06-2305 (`docs/prompts/claude_2026-11-06_2305_prompt_jjtl_builtin_errors_and_failed_writeback.md`)
- Session: 27103d64
- Tree: `~/jjodel-w-jjtlbuiltin`, branch `jjtl-builtin-errors`; code `860597f15`, SPEC `8ef186680`
- Executor model: Anthropic Claude Opus 5.5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads
  the real files.

Tags: **measured** = a run in this session, on the commit named; **read** = a file or a doc.

## 0. Answer in brief

- A builtin that fails inside a JjTL expression now names the rule and the source element, with R-FA-12's wording:
  `Builtin 'range' failed in expression at line L, column C (rule 'Core -> M', source element 's'): <reason>`.
  Same in a binding, a `where` guard, a `forall` collection and a helper body, on both parse paths (measured,
  `860597f15`).
- Tests first: the new and changed cases of `builtin-error.test.ts` were red 8/10 before the change, green after
  (measured). The only existing expectations that changed are the two cases of that file (forall collection,
  larger expression), each on both paths. JjTL + JjEL + `jjtlSourceValues.test.ts`: 1,254/1,254, only the known
  import-red file (measured).
- Node regression on the P-2026-11-05-1400 inputs: 6/6 SAME, byte-equal after normalisation, success true,
  0 warnings, 0 errors (measured, `860597f15`).
- Item 2: **the app writes nothing for a failed run.** With `xlen="four"` (kept as text by the import, R-XMI-1),
  `CoreSpec2SyncRTL.jjtl` fails; no `out1` model is created, the project keeps 3 models and 36 objects, 0 objects
  created by JjTL, no output tab opens (measured, two app runs). The output panel and a toast both show the error
  naming rule and source element. No ticket filed: no partial model is written.
- The executor itself does return a partial target model on failure (node: 938 of 2,524 objects); the app discards
  it by returning before the model is created, `ProjectEditor.tsx:1606-1610` (measured + read).

## 1. Hypotheses under test

1. *Setting the origin where R-FA-12 sets it for a method is enough for a builtin too.* Holds: the same helper
   now serves both kinds (§2). Measured.
2. *Only `builtin-error.test.ts` asserts a builtin message.* Holds: a search for `Builtin '|failed in expression|' failed:`
   over `frontend/src` with BSD grep found four files, two of them tests already in scope plus `executor.ts` and
   `jjtlSourceValues.test.ts` (whose assertion is a method error, unchanged); the suite run confirms it, no other red
   (§3). Measured.
3. *The change leaves real transformations byte-equal.* Holds on six node runs (§4). Measured.
4. *The app writes a partial target model beside the error of a failed run.* Falsified (§5). Measured.

## 2. The change (read, `860597f15`)

`frontend/src/jjtl/executor/executor.ts`, the new private method:

```
private withOrigin(error: JjtlBuiltinError): JjtlBuiltinError {
    const { currentRuleName, currentInstanceName } = this.context;
    if (!error.origin && currentRuleName) error.origin = ` (rule '${currentRuleName}', source element '${currentInstanceName ?? '?'}')`;
    return error;
}
```

It is called at both places that locate a `JjtlBuiltinError`: the legacy fast path for a standalone call
(`this.withOrigin(error).locate(expr);` in the `FunctionCall` branch of `evaluateExpression`) and the JjEL
delegation catch, where it also replaces the inline origin code of R-FA-12's method branch. The innermost
`evaluateExpression` sets the origin; enclosing ones keep it, as they keep `locate`'s outermost expression. The
`JjtlBuiltinError` class, its constructor and `locate` are unchanged; JjEL is not touched, so JjEL outside JjTL
throws what it threw before (read: no file under `frontend/src/jjel/` in the diff, `git diff --stat`).

## 3. Tests (measured)

`frontend/src/jjtl/executor/__tests__/builtin-error.test.ts`, both parse paths:

| case | before | after |
|---|---|---|
| forall collection (existing, expectation changed) | red | green |
| larger expression in a binding (existing, expectation changed) | red | green |
| guard (new) | red | green |
| helper body (new) | red | green |
| name that resolves to nothing (existing, unchanged) | green | green |

Red run: 8 failed, 2 passed (10), every failure the missing ` (rule 'Core -> M', source element 's')`. Green: with
`method-failure.test.ts`, 34/34. JjTL + JjEL + `jjtlSourceValues.test.ts`: 51 files passed, 1 failed (the known
import-red `ai-prompt-sanitization.test.ts`), 1,254/1,254 tests (1,250 before + 4 new). `npm run typecheck` exit 0,
`npm run build` ok (`built in 1m 3s`). The full `npm run test` was not run.

## 4. Node regression (measured, `860597f15`)

The P-2026-11-05-1400 harness copied temporarily under `executor/__tests__/` and deleted after, the references of
that lane, its `cmp.mjs`. Sources: that lane's flat JSON; `rv_pf4` flattened again with its `xmi2flat.py` (system
python 3.9: the Homebrew 3.14 build has a broken `pyexpat`), positive control `rv_mc4` flattened the same way,
byte-equal to that lane's file (`cmp`).

| run | elements | result |
|---|---|---|
| rv_mc4 | 2,524/2,524 | SAME |
| rv_pf4 | 2,680/2,680 | SAME |
| rv_mc32 | 2,524/2,524 | SAME |
| core_mc4 | 961/961 | SAME |
| generated control on rv_mc4 | 2,524/2,524 | SAME |
| arbiter3 (source-text path) | 108/108 | SAME |

All byte-equal after normalisation, success true, 0 warnings, 0 errors.

Negative control, `rv_mc4` with `xlen` the string `"4"` (that lane's `rv_mc4-str.json`): success false, 2 errors
(`-> regs` at line 449, column 13 and `-> wires` at line 461, column 14, both `Method 'log2' ... (rule 'Core -> Module',
source element 'rv_mc4')`), and the harness still wrote a Module of **938 objects** against 2,524. P-2026-11-05-1530
reported 1 error on its own `"4"` input; the difference was not investigated (§7, question 2).

## 5. Item 2: the app after a failed run (measured, `860597f15`)

Setup: dev server of this tree on port 3217 through `lane-run probe` (stopped by it; port free after, `lsof`), the
P-2026-11-05-1400 app probe adapted (imports of this tree, no settle wait), a fresh project, imports of
`CoreSpec.ecore`, `SyncRTL.ecore` and a private copy of `rv_mc4.xmi` with `xlen="four"`, transformation
`CoreSpec2SyncRTL.jjtl` run into `out1`. Two runs, `fail1` and `fail2`; the second only adds the project panel.
Load at the runs 24.65 and 19.33 (1-minute average); no timing is reported.

- Import: `success-with-warnings`, one warning, `Attribute "xlen" on "Core": value "four" is not an integer (EInt), kept as text` (R-XMI-1 holds).
- Result: a toast `Transformation Failed` with the error, first signal within 8.4 s of the click; no
  `jjtl-execution-result` event, no long write-back (1 long task, 0 store dispatches during the run).
- Output panel, verbatim (5 lines):
  ```
  Starting transformation execution...
  Source model: Pointer1794004460782_USER_173
  Output model: out1
  Processing 2 mappings...
  Transformation failed: Failed to map (creation) -> wires: Method 'log2' failed in expression at line 461, column 14 (rule 'Core -> Module', source element 'rv_mc4'): Unknown method 'log2' for type String. Available: ...
  ```
- Store after the run: models `CoreSpec` (metamodel), `SyncRTL` (metamodel), `rv_mc4` (36 objects); 36 `DObject`s in
  the project, 0 with `__createdBy: 'JjTL'`; dock tabs `XF_fail2`, `CoreSpec2SyncRTL`, no output tab.
- Model panel (project leftbar, verbatim excerpt): `METAMODELS CoreSpec SyncRTL ... MODELS rv_mc4 New model TRANSFORMS CoreSpec2SyncRTL`.
  No `out1`.
- Screenshots: `docs/discovery/assets/jjtl-failed-writeback/output-panel-and-toast.png`,
  `docs/discovery/assets/jjtl-failed-writeback/project-panel-after-run.png`.

Positive control for the absence of `out1`: the same store scan lists the two metamodels and `rv_mc4` with its 36
objects; P-2026-11-05-1400's probe, with the same scan, found and serialised `out1` after a successful run.

Why (read), `frontend/src/components/project/ProjectEditor.tsx:1606-1610`:

```
if (!result.success) {
    U.alert('e', 'Transformation Failed', result.errors.join('\n'));
    isExecutingTransformation = false;
    return result;
}
```

The model creation (`CREAZIONE MODELLO`, from line 1612) and the write-back come after this return. The toast and
the panel name only the `wires` error, where the node run on `"4"` gives two; whether the app's `result.errors`
held more than one was not measured (the panel line and the toast may show the first only).

Ticket: none. The prompt asks for one only if a partial model is written beside the error; it is not.

## 6. Dependencies and risks

- The guard that keeps a failed run out of the project is one early return in `ProjectEditor.tsx`, not covered by
  a test as far as this session saw (not searched). A refactor that moves model
  creation before the success check would write the 938-object partial model the executor returns.
- An existing project whose transformation relied on a builtin error message's exact text (no origin) sees a
  longer message; no test or tool in this tree parses it (§1, hypothesis 2).

## 7. Open questions

1. Should the executor drop `targetModel` when `success` is false, so the partial model cannot leak through a future
   caller (recommended, small, out of this lane)?
2. Why does the node `"4"` input give two errors (`regs`, `wires`) where P-2026-11-05-1530 reported one and the app on
   `"four"` shows one?
3. Should a test pin `ProjectEditor`'s early return on a failed run?
