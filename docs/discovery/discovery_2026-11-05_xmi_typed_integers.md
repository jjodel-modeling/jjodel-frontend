# Discovery — XMI import: attribute values typed by the metamodel (#607)

Prompt-ID: P-2026-11-05-1446 · prompt `docs/prompts/claude_2026-11-05_1446_prompt_xmi_typed_integers.md`
Session: xmiints (lane full, unattended) · tree `~/jjodel-w-xmiints`, branch `xmi-typed-integers`, fix at `36e67e7da`
(parent `782262393`) · Executor: claude-opus-5-5 (Opus 5.5)

This report is a set of hypotheses with evidence, not a reference. Whoever uses it rereads the real files.
Every figure is tagged **measured** (a run in this lane) or **read** (a file of this tree). Inputs (read only, outside
the tree, named by file name only): `CoreSpec.ecore`, `SyncRTL.ecore`, `CoreSpec2SyncRTL.jjtl`,
`ArbiterSpec2SyncRTL.jjtl` (the multi-line edit), `rv_mc4.xmi`, `rv_pf4.xmi`, their `*-syncrtl.json` references,
`arb3-syncrtl.json`, `syncrtl-classes.json`, `hwproto_xform.test.ts`. Probes, logs and outputs stay in the lane
folder, outside the tree.

## 0. Answer in brief

1. **Fixed in the XMI import** (`36e67e7da`, measured). Each primitive attribute value is cast by its declared type
   name: EByte, EShort, EInt, ELong to integers; EFloat, EDouble to finite numbers; EBoolean to `true`/`false`.
   A value that does not parse keeps its text and is reported as an import warning, never NaN or 0. Strings and
   enumerations are unchanged. Test first: 3 new tests red on `782262393` (3 failed), green on `36e67e7da`.
2. **App, fixed code** (measured): `rv_mc4` gives **0 attribute differences** of 1,999 (2,524 / 2,524 objects,
   byte-equal after normalisation, no warning in the JjTL panel); `rv_pf4` **0 of 2,111** (2,680 / 2,680, byte-equal).
   The only thing left is #609: 13 `Const.value` slots hold 4,261,441,663 in the D-layer and read 2,147,483,647 through
   the L-layer. The reference comparison reads raw values, so it does not see it.
3. **Projects saved before the fix** (measured): they exist as a case and **do not heal**. A project saved by the
   pre-fix code (`782262393`) and reopened on the fixed code still holds `Core.xlen = "4"`; the run gives the same
   27 `log2` warnings and the same 136 differences, out1 byte-equal to the P-2026-11-05-1400 run `new1`. Re-importing
   the XMI heals it. No migration written; whether to write one is awaiting Alfonso.
4. **Why warnings and not R-FA-11's error** (read): R-FA-11 is implemented for builtins registered on the JjTL
   context only. `"4".log2()` fails in JjEL method dispatch with `Unknown method 'log2' for type String`, a plain
   evaluation error, which the executor treats like a name that resolves to nothing: a warning and `null`, by design
   and by test. The purpose of R-FA-11 (a run that goes on writes a wrong model that looks done) is what happened.
   Ticket filed; not the same code path, not fixed here.
5. **Arbiter, node, source-text path** (measured): the multi-line `ArbiterSpec2SyncRTL.jjtl` parses with the source
   text, `success true`, 108 / 108 objects, 14 classes, byte-equal to `arb3-syncrtl.json`, no warning.
6. **#609 with `Const.value : ELong`** (measured, private copy): the app reads **4,261,441,663 back unclamped**: 0 of
   1,969 attribute values differ between the D-layer and the L-layer read; out1 is still byte-equal to the reference.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Casting in the XMI import by the declared type removes the 136 differences | **holds** (measured, §3): 0 on `rv_mc4`, 0 on `rv_pf4` |
| H2 | The fix needs no change outside the import (no JjTL, no serialiser, no critical-zone file) | **holds** (read and measured): one file plus its test |
| H3 | Projects saved before the fix read correctly after it | **falsified** (measured, §4): still strings, still 136 differences |
| H4 | R-FA-11 covers `xlen.log2()` on a string | **falsified** (read, §5): it covers context builtins only |
| H5 | The edited arbiter parses and matches on the source-text path | **holds** (measured, §6) |
| H6 | With `Const.value : ELong` the clamp of #609 disappears | **holds** (measured, §7) |

## 2. The fix (read, `36e67e7da`)

Where the values were written as text (read on `782262393`), `frontend/src/services/export/XMIService.ts:898`
`const rawValue: string = String(itemJson[attrKey]);`, then `values = [rawValue];` or the whitespace split.

Now, after the enum mapping, `XMIService.ts:1006-1019`:

```
        } else if (featType && typeof featType.name === 'string') {
            ...
            values = values.map((v) => {
                const cast = castXmiPrimitive(v, featType.name);
                if (cast.problem) {
```

The cast is keyed on the type **name**, the same key the L-layer reader switches on, `get_values` in
`frontend/src/model/logicWrapper/LModelElement.tsx:7585` `let typestr: string = this.get_typeString(context);` with
`get_typeString` returning `context.data.name` (`:1791-1792`). Writer and reader agree on what the type is.

`castXmiPrimitive`, `XMIService.ts:131-170`, by type:

| type | accepted | stored | not parsing |
|---|---|---|---|
| EByte, EShort, EInt, ELong | `^[+-]?\d+$` after trim (EMF's decimal form) | the number | text kept, warning |
| same, outside the type's range | — | the number, **unclamped**, warning | — |
| ELong beyond 2^53 | — | text kept, warning (a JS number cannot hold it exactly) | — |
| EFloat, EDouble | decimal with optional exponent, finite | the number | text kept, warning (`NaN`, `Infinity`, `abc`) |
| EBoolean | `true` / `false`, any case (EMF's `booleanValueOf`) | the boolean | text kept, warning |
| anything else (EString, EChar, EDate, user data types) | — | the text, as before | — |

Enumerations are taken by the branch above it (`featType.isEnum`), unchanged.

Tests (measured): `frontend/src/services/export/__tests__/xmi-import-skip.test.ts:258`, a new `describe` in the existing
harness that executes `importM1FromXML` on a fake D-layer: typed values written for all seven types plus a
multi-valued EInt, strings and enums as before; six non-parsing values kept as text with six warnings; an EInt and an
EByte out of range stored unclamped with a warning each, an ELong past 2^53 kept as text. On `782262393`: 3 failed,
7 passed. On `36e67e7da`: 10 passed; the export suite 101 / 101 in 6 files.

Gates on `36e67e7da` (measured): `npm run typecheck` exit 0; `npm run build` exit 0; `vitest run src/jjtl` 661 passed,
1 file red at import (`ai-prompt-sanitization.test.ts`, `window is not defined`, the known one of CLAUDE.md §17).

## 3. App, fixed code (measured)

Method: the P-2026-11-05-1400 Playwright probe, copied to this lane's folder and parametrised by model; dev server of
this tree on port 3246, started and stopped by `lane-run probe` for each run. Fresh browser context and project;
`CoreSpec.ecore`, `SyncRTL.ecore` and the model through the app's file inputs; the hand-written
`CoreSpec2SyncRTL.jjtl` set in the editor and run into `out1`; out1 serialised from the D-layer; compared with the
lane's `cmp.mjs` (tree) and `cmpapp.mjs` (attribute kinds).

| run | source raw `Core.xlen` / `nregs` | panel warnings | objects out / ref | attribute differences | L-layer read ≠ raw | settled |
|---|---|---|---|---|---|---|
| `rv_mc4` | `4` / `4` (number) | 0 | 2,524 / 2,524 | **0 / 1,999** | 13 (`Const.value` 4,261,441,663 → 2,147,483,647) | 13.4 s |
| `rv_pf4` | `4` / `4` (number) | 0 | 2,680 / 2,680 | **0 / 2,111** | 13 (the same) | 16.9 s |

Both: `SAME`, byte-equal after normalisation, 32 classes, no count mismatch; no page error, no console error;
import warnings 0 for all three files. Load average at run start 6.55 and 6.14.
The panel ends at `Nested objects in "out1": 2523 created, 0 not placed.` (`rv_mc4`).

What remains on `rv_mc4`: nothing in the D-layer; in the L-layer only the 13 clamped masks of #609 (§7).

## 4. Projects saved with string integers (measured)

Method: a temporary detached worktree at `782262393` (pre-fix; `castXmiPrimitive` absent, grep count 0), its dev
server on port 3247: new project, the three imports, `SaveManager.save()`, localStorage dumped. Then the fixed tree
on port 3246, the dump restored before boot, the same project reopened, a transformation created and run. The
temporary worktree was removed afterwards.

- Saved by the pre-fix code: `Core.xlen` and `Core.nregs` raw `"4"` (string); project state 27,408 characters.
- Reopened on the fixed code: raw still `"4"`; through the L-layer `4`. Panel: `27 warning(s)`, all
  `Unknown method 'log2' for type String`. out1 against the reference: type-only 59, missing 57, wrong value 20,
  that is the 136 of P-2026-11-05-1400; against that lane's `new1-out1.json`: `SAME`, byte-equal.

So the case exists for every M1 model imported from XMI before `36e67e7da` that has a numeric or boolean attribute,
and opening it does not change it: the fix acts at import only, and nothing on load (VersionFixer included) recasts
slot values. Re-importing the XMI produces typed values (§3). A migration would have to cast a slot's values by the
same table as §2 on load; it is not written, and whether to write it is a decision awaiting Alfonso.

## 5. Why `log2` gave warnings under R-FA-11 (read)

R-FA-11 (`docs/decisions.md:7382`): "a builtin that fails inside a JjTL expression stops the mapping with an error on
every path, never a warning with `null`".

What it is implemented on, `frontend/src/jjtl/executor/executor.ts:390-407`: the JjTL context wraps every builtin
registered on it, `throw new JjtlBuiltinError(name, ...)` (`:403`). The comment says which ones: "Every builtin
registered on it (range, resolve, helpers, called rules, the environment functions)".

What `xlen.log2()` is: a JjEL method call. On a string receiver the evaluator finds no string or date method named
`log2` and throws a plain evaluation error, `frontend/src/jjel/evaluator/evaluator.ts:975` and `:982`:

```
        let errorMsg = `Unknown method '${method}' for type ${typeName}`;
        ...
        throw new JjelEvaluationError(errorMsg);
```

The executor rethrows only `JjtlBuiltinError`, `executor.ts:2993-3000`; anything else is "logged and falls back to
null": `this.warnings.push(\`Expression evaluation failed (${expr.type}): ${errorMessage}\`); return null;`.
The test of R-FA-11 fixes this carve-out for a name that resolves to nothing,
`frontend/src/jjtl/executor/__tests__/builtin-error.test.ts:109` "a name that resolves to nothing is not a failing
builtin: a warning and null, no error". An unknown method for the receiver's type falls on that side.

Verdict: not a regression of R-FA-11's implementation, which does what its test says; a gap between the rule's
purpose and its scope. A method of the JjEL library that does not exist for the value's type (or that throws inside,
read: `getNumberMethod(...)` results are called bare at `evaluator.ts:946-948`) yields `null` and a successful run.
On this input that was 77 wrong or missing values under "Transformation completed successfully". Ticket filed (§8).
Not the code path of the fix; not fixed here.

## 6. Arbiter, node, source-text path (measured)

`hwproto_xform.test.ts` copied for the run only under `frontend/src/jjtl/executor/__tests__/` (not gitignored; deleted
right after, `git status` clean), on `36e67e7da`. It parses with `new JjtlParser(tokens, src.trim())`, the app's path.
Source `arbiter3` flattened by the P-2026-11-05-1400 lane (`xmi2flat.py`).

Result: `success true`, `modules 1`, no warning, no error; against `arb3-syncrtl.json`: `SAME`, 108 / 108 objects,
14 classes, byte-equal after normalisation. The input's line 74 is now split over lines
(`-> reset { -> Const {` / `value := 0` / `-> type { -> Bool { } }` / `} }`, read), which is what removed the parse
error of #608 for this file; the parser itself is unchanged, so the one-line form still fails (not measured here).

## 7. #609 with a private `Const.value : ELong` (measured)

A private copy of `SyncRTL.ecore` in the lane folder, one line changed (line 95, `//EInt` → `//ELong`); the input is
untouched. App run as §3 on `rv_mc4`: import reports `Const.value` type `ELong`; out1 `SAME` as the reference; the
L-layer read differs from the raw D-layer value on **0 of 1,969** attribute values, so the 13 masks read back as
4,261,441,663. With `EInt` (§3) the same 13 read 2,147,483,647. The clamp is the EInt bound of `get_values`,
`LModelElement.tsx:7769-7772` (read); `ELong` uses `±9223372036854775807` (`:7773-7776`). #609 is not fixed here.

## 8. Ticket filed

1. medium — JjTL: a JjEL method unknown for the receiver's type (`"4".log2()`) gives a warning and `null`, not
   R-FA-11's error; the run reports success with wrong values.

## 9. Dependencies and risks

- The fix covers the XMI import only. Other ways an M1 value can arrive as text (another importer, a form, a
  JjScript write) were not measured.
- A value kept as text in a numeric slot still reads as a number through the L-layer (`U.getFirstNumber`), so
  `"4x"` reads 4: the import warning is the only signal. Whether conformance flags it was not measured.
- An EInt above 2^31-1 now enters the D-layer as a number from XMI too (reported); the L-layer clamps it (#609).
- Projects saved before `36e67e7da` keep strings until the XMI is re-imported or a migration is written (§4).

## 10. Open questions

1. Should a migration recast the values of saved projects by their declared type on load, or is re-importing enough?
2. Should R-FA-11 extend to a JjEL method unknown for the receiver's type, and to a library method that throws?
3. Should a value that does not parse for its type refuse the import, as EMF does, instead of being kept as text?
4. Should `Const.value` become `ELong` in `SyncRTL.ecore` (§7 measures that the app then reads the masks unclamped)?
