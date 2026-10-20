# Discovery — JjEL bit-vector values: where the type enters and what it breaks

- Prompt-ID: P-2026-10-20-2055 (chat C-2026-10-20-2055, front `hw-notation`)
- Prompt: the lane prompt committed in `19ea86152` (docs: R-BV-1..6, front hw-notation, prompt P-2026-10-20-2055)
- Session: `78cddac7-cf6a-4038-a1bc-2b7588aae474`
- Tree: `~/jjodel-w-bitvector`, branch `jjel-bitvector`, HEAD `19ea86152`, clean at start
- Executor: Claude Opus 5.5 (`claude-opus-5-5`), effort xhigh
- Phase 1, read-only. No file under `frontend/src` was edited. This report is a set of hypotheses with evidence, not a
  reference: whoever uses it downstream rereads the real files.

Tags: **[M]** measured in this phase (a run on HEAD `19ea86152`), **[R]** read in a file on the same HEAD. Line numbers
marked **[R, verified]** were reopened by the executor with `sed -n`; the others come from three read-only explorer
subagents and are cited as they reported them.

## 0. Baseline

- [M] `npm run typecheck` through `node scripts/run-quiet.mjs`: exit 0, no `error TS` line (log
  `.agent-logs/typecheck-20261020-210055.log`, 6 lines). Matches the zero baseline of `CLAUDE.md` §17.
- [M] `npx vitest run src/jjel`: 5 files, 299 tests, all passed, exit 0 (log `.agent-logs/vitest-jjel-20261020-210208.log`).
- [M] Temporary symlink `frontend/node_modules -> ~/jjodel/frontend/node_modules` created by this lane at 21:00 (it did
  not exist before), removed at the end (P14).
- Probes: `frontend/.vite-cache/bv-probe/` (gitignored, `.gitignore:46`), an esbuild bundle of `frontend/src/jjel/index.ts`
  driven by small `.mjs` scripts. Not committed.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | A new value kind can be added to the JjEL evaluator without changing what any existing expression means | **Holds**, with one exception: global builtin names shadow context variables (§3.2) |
| H2 | Today every operator would silently misbehave on a bit-vector object rather than fail | **Partly**: `+ - * / % unary-` give `null`; `+` with a string, `<`/`<=`, `not`, `and`, `or` give a wrong answer; interpolation and `distinct` throw (§2.3) |
| H3 | The names of R-BV-5 are free | **Partly**: `slice` and `trunc` exist as string/number methods; no reserved-name clash (§3.1) |
| H4 | The lexer can take `8'hFF` without breaking existing tests | **Holds** for sized literals; **falsified** for unsized `'d3` (§3.3) |
| H5 | The width can come from the model data without a new metamodel type | **Holds** for the evaluator; the D-layer cannot hold a `BigInt` and `EInt`/`ELong` lose bits above 2^53 (§4) |
| H6 | The simulator can store a bit-vector in σ | **Partly**: σ survives it (copy-on-write `Map`s), the types and the domain checks refuse it (§5.1) |
| H7 | A `.smv` exporter exists to extend with `word[N]` | **Falsified**: there is none (§5.3) |
| H8 | The Web Worker runner carries `BigInt` | **Holds** for the transport; the JS target's runtime and literal printer do not know it (§6) |
| H9 | `jjel-multivalued` overlaps the S1 sites | **Falsified**: no shared hunk, the merge is clean (§8) |
| H10 | Verilator or Icarus is available as an oracle on this machine | **Falsified**: neither is installed (§9) |

## 2. Value representation and operators (item 1)

### 2.1 Values are raw JavaScript values

- [R, verified] `frontend/src/jjel/evaluator/context.ts:15-22`: `export type JjelValue = | null | boolean | number | string | JjelValue[] | JjelObject | JjelFunction;`
  No `bigint`, no tag. `frontend/src/jjel/types/` holds only `ast.ts` and `tokens.ts`; the value type lives in `evaluator/context.ts`.
- [R] Model objects are plain bags recognised by shape: `isJjelObject` is "non-null, typeof object, not array, not
  function" (`context.ts:44-46`). The only real tag is `__jjelFunction: true` (`context.ts:35`).
- [R, verified] A `__type` field is already honoured: `evaluator.ts:1164` `if ('__type' in value) return String(value.__type);`
  (`getTypeName`), and `is` reads `__type` (`context.ts:80`).
- [R] A precedent for an opaque value kind exists: `JjelTextHost` (`context.ts:279-300`, R-GEN-10), hooked into `+`
  (`evaluator.ts:285`), `join` (`:753`) and `stringify` (`:1146`).
- [R] `toJjelValue` has no `bigint` branch and falls to `return null`; an object is recursed key by key
  (`context.ts:~498-533`), so a host value carrying a `BigInt` would be turned into `null` at the boundary.

### 2.2 Equality, ordering, truthiness, printing

- [R, verified] `isEqual` (`evaluator.ts:1102`): identity, then same `typeof`, then arrays and objects key by key.
- [R, verified] `compare` (`evaluator.ts:1123`) knows number, string, boolean; the fallback is `evaluator.ts:1141`
  `return String(a).localeCompare(String(b));`.
- [R, verified] `isTruthy` (`evaluator.ts:1093-1099`) ends in `return true;`: any object is truthy.
- [R, verified] `stringify` (`evaluator.ts:1144-1154`): `if (isJjelObject(value)) return JSON.stringify(value);`.
- [R] Copies of the same logic: `collections.ts:513-532` (`compare`), `collections.ts:534-553` (`deepEqual`), and the JS
  target's runtime `$eq`, `$cmp`, `$truthy` (`codegen/target/js/printer.ts:156-185`).

### 2.3 What an object with a `BigInt` payload does today

[M] Probe `val.mjs`, context `a = {__type:'BitVector', width:8, signed:false, value:255n}`, `a2` equal to `a`,
`b` the same with `value:1n`:

| Expression | Result | Reading |
|---|---|---|
| `a == a2` / `a == b` | `true` / `false` | key-wise equality works on a `BigInt` field |
| `a < b`, `b < a` | `false`, `false` | both stringify to `[object Object]`, `localeCompare` gives 0 |
| `a <= b` | `true` | same: **silently wrong** |
| `a + b`, `a - b`, `-a`, `a + n` | `null` | the `typeof number` gates refuse, no error |
| `'x' + a` | `x[object Object]` | the string branch of `+` (`evaluator.ts:296-297`) applies: **silently wrong** |
| `not a` | `false` | `isTruthy` returns `true`: **silently wrong** |
| `String(a)` | `[object Object]` | builtin `String` (`evaluator.ts:99-102`) |
| `xs.distinct()` | throws `Do not know how to serialize a BigInt` | key `JSON.stringify(item)` (`collections.ts:221`, verified) |
| `xs.contains(a2)` | `true` | `deepEqual` |
| `a.value` | `255n` | a raw `bigint` leaks into JjEL, a type `JjelValue` does not have |
| template `"v=${a}"` | throws `Do not know how to serialize a BigInt` | `stringify` → `JSON.stringify` |

### 2.4 Operator sites

- [R, verified] `evaluator.ts:294-300`: `case '+': if (typeof left === 'string' || typeof right === 'string') { return String(left ?? '') + String(right ?? ''); } if (typeof left === 'number' && typeof right === 'number') { return left + right;`
- [R] `-` (`:308`), `*` (`:314`, string repeat `:317`), `/` (`:323`), `%` (`:330`), unary `-` (`:379`) require
  `typeof number`; `==`/`!=` call `isEqual` (`:338,341`); `<`..`>=` call `compare` (`:344-353`); `and`/`or`/`not` go
  through `isTruthy` (`:357,360,376`).
- [R, verified] Both operands are always evaluated, no short-circuit: `evaluator.ts:280-281`.
- [R, verified] `jjel/types/ast.ts:82-88`: `BinaryOperator` is the closed union `'+' | '-' | '*' | '/' | '%' | '==' | '!=' | '<' | '>' | '<=' | '>=' | 'and' | 'or'`. There are **no bitwise operators and no shifts** in JjEL.
- [R] Other sites: builtin `Number()` (`evaluator.ts:104-112`); `sum` (`collections.ts:417`); `min`, `max`, `sortBy`
  through the collections `compare` (`:454,479,263,278`); `distinct`, `distinctBy`, `groupBy` keyed on `JSON.stringify`
  (`:221,244,374`); the JS target runtime `$add` `$sub` `$mul` `$div` `$mod` `$neg` (`printer.ts:190-205`, `$add` verified).
- [R, verified] The legacy JjTL arithmetic `executor.ts:3088` `return (Number(left) || 0) + (Number(right) || 0);` is
  `@deprecated` (`executor.ts:3066`) and private; the only occurrence of `_evaluateBinaryExpressionLegacy` in the file is
  its definition (`executor.ts:3068`), so it is unreachable. JjTL evaluates through JjEL (`executor.ts:377`
  `new JjelEvaluator()`, `astBridge`).
- [R, verified] Sites branching on `isJjelObject(` outside tests (`command grep -rn`, quoted `--include`): 13 in
  `jjel/evaluator/evaluator.ts`, 5 in `context.ts`, 2 in `model/simulation/actionEvaluator.ts`, 1 each in
  `derivedEvaluator.ts`, `stcChecks.ts`, `codegen/target/js/printer.ts`. A tagged object would fall into every one of
  them unless a bit-vector guard runs first. `JjelValue` is imported by 31 non-test files.

### 2.5 The smallest change

A fourth kind of non-collection value, distinct from `JjelObject`:

```ts
export interface JjelBitVector {
    readonly __type: 'BitVector';
    readonly width: number;     // 1..W_MAX, integer
    readonly signed: boolean;
    readonly bits: bigint;      // canonical: 0 <= bits < 2^width, always (BigInt.asUintN)
}
```

frozen, built only by the constructors, added to the `JjelValue` union, with `isBitVector(v)` tested **before**
`isJjelObject(v)` at every site of §2.4. Canonical unsigned storage makes `isEqual` key-wise correct (two values with
the same width, signedness and bits are equal) and makes signedness an interpretation used only by comparisons,
`sext`, arithmetic right shift and printing. [M] `BigInt.asUintN(8, 256n)` gives `0n`, `BigInt.asIntN(8, 255n)` gives
`-1n`, `1n + 1` throws `Cannot mix BigInt and other types` (probe `clone.mjs`, Node 26.8.1).

Every site that would otherwise apply JavaScript arithmetic silently, and so must get a bit-vector branch or an explicit
refusal in S1: `+` (string branch), `compare`, `isTruthy`, `stringify`, builtin `String`, `distinct`/`distinctBy`/
`groupBy`, collections `compare` (`sortBy`, `min`, `max`), `getTypeName`, `callMethod` (object branch,
`evaluator.ts:790-793`), `toJjelValue`/`fromJjelValue`.

## 3. Syntax (item 2)

### 3.1 Registration and collisions

- [R] Global functions: `registerGlobalBuiltins` (`evaluator.ts:88-121`) through `EvaluationContext.registerBuiltin`
  (`context.ts:460`); resolution in `evaluateFunctionCall` (`evaluator.ts:718-724`, verified: `const builtin = ctx.getBuiltin(expr.name); if (builtin) return builtin.call(args, ctx);`).
- [R] Methods: `callMethod` (`evaluator.ts:735-818`) dispatches by receiver type: arrays (`collections.ts:567`),
  strings (`strings.ts:305`), dates, numbers (`numbers.ts:271`), then `obj[method]` on objects, else "Unknown method".
  Autocomplete metadata is hand-kept in `jjel/metadata/builtins.ts`.
- [R, verified] `slice` is a string method (`strings.ts:155` `export function slice(str: string, start: number, end?: number): string {`);
  `trunc` is a number method (`numbers.ts:49` `export function trunc(num: number): number {`). Dispatch by receiver
  type means `bv.slice(hi, lo)` and `bv.trunc(w)` do not clash at run time; they share only autocomplete entries and
  the docs, where the meaning differs (`'abcd'.slice(1, 3)` is half-open from the left, `x.slice(7, 4)` is inclusive
  from the top).
- [R] `concat` exists only as `JjelTextHost.concat` (`context.ts:290`), not as a JjEL name. `bits`, `sbits`, `bit`,
  `replicate`, `zext`, `sext` occur nowhere in `jjel/` (explorer word-grep, positive control `slice`/`trunc` hit).
- [R, verified] `jjel/stateReserved.ts:18-22`: roots `['self', 'event', 'model', 'node']`, read-only attributes
  `['marked', 'tokens']`. None of the R-BV-5 names. `jjscript/reservedIdentifiers.ts:19-44`: no hit for the nine names
  (word-grep exit 1; the explorer read the lists to confirm, no positive control on that file).
- **[M] Builtins shadow context variables.** `evaluator.ts:218-223` (verified): `// Check for builtins first if (ctx.hasBuiltin(expr.name)) { return ctx.getBuiltin(expr.name)!;`.
  Probe `shadow2.mjs`: context `{bits: 42}` plus a registered builtin `bits`; the bare identifier `bits` evaluates to
  the builtin function, not 42. `extractAttributeValues` puts every attribute of the current object into the context
  under its bare name (`modelContext.ts:50-53`, verified), so a hardware metamodel with an attribute `bits`, `trunc` or
  `concat` would lose its bare-name read in JjTL and in the simulator the moment those names become globals. `self.bits`
  (member access) is unaffected.

### 3.2 Consequence for R-BV-5

Only the two constructors need to be global: `bits(w, v)` and `sbits(w, v)`. Everything that has a receiver becomes a
method on the bit-vector, dispatched by receiver type exactly as strings and numbers are: `x.slice(hi, lo)`, `x.bit(i)`,
`x.concat(y, ...)` (Verilog `{x, y}`, `x` in the high bits), `x.replicate(n)`, `x.zext(w)`, `x.sext(w)`, `x.trunc(w)`,
and for R-BV-4 the bitwise and shift operations that have no operator in JjEL (§3.3): `x.and(y)`, `x.or(y)`, `x.xor(y)`,
`x.not()`, `x.shl(n)`, `x.shr(n)`, `x.ashr(n)`, plus `x.asSigned()`, `x.asUnsigned()` (`$signed`, `$unsigned`) and
`x.toNumber()` (refused above 2^53). Two globals instead of nine reduce the shadowing risk to two names; the S1 prompt
lists them and the docs say a metamodel feature called `bits` or `sbits` must be read as `self.bits`.

### 3.3 Verilog literals and operators in the lexer

- [R, verified] `jjel/lexer/lexer.ts:241-243`: `case "'": this.singleQuotedString(); break;` — the apostrophe opens a
  single-quoted string. Numbers are decimal digits with an optional fraction, no hex, no binary, no underscore
  (`lexer.ts:529-544`); number literals become `parseFloat(token.value)` (`parser.ts:492`, verified), so integer
  literals above 2^53 lose precision. JjTL has its own lexer with the same rules (`jjtl/lexer/lexer.ts:174-176`,
  `:308-322`) [R]. JjScript has its own lexer and passes `eval` expressions to JjEL as raw text
  (`jjscript/executor/commands/eval.ts:12,28,40`) [R].
- [M] Probe `lex2.mjs` (tokens of the JjEL lexer, errors of the lexer result):

| Input | Tokens today |
|---|---|
| `8'hFF` | `NUMBER:"8" ERROR:"'hFF"`, error `Unterminated string` |
| `4'b1010` | `NUMBER:"4" ERROR:"'b1010"`, `Unterminated string` |
| `'d3` | `ERROR:"'d3"`, `Unterminated string` |
| `8'abc'` | `NUMBER:"8" STRING:"abc"`; `jjelEval` returns `8` |
| `0xFF` | `NUMBER:"0" IDENTIFIER:"xFF"`; `jjelEval` returns **`0`** |
| `a & b`, `a ^ b`, `~a` | `ERROR` token, `Unexpected character` |
| `a << 2`, `a >> 2` | `LT LT`, `GT GT`; `jjelEval("a << 2")` → parse error `Expected expression` |
| `a <> b` | `LT GT` |

  [M] `jjelEval("9007199254740993")` returns `9007199254740992`, and `9007199254740993 == 9007199254740992` is `true`.
- So a **sized** literal `<digits>'<base><digits>` with `base ∈ {b, o, d, h}` (optionally `s` before the base) occupies a
  space that is a lexer error today. The only accepted input whose meaning would change is `<digits>'<text>'`, a number
  followed by a string, which the lenient `parse()` reads as the number and drops the rest (`parser.ts:79-89`,
  verified; `parse` returns the first expression). [R] The explorer's search over `*.test.ts` for
  `[0-9]'[A-Za-z0-9_]`: 0 lines in `jjel`, `jjtl` and `jjscript` tests; positive control `[a-z]'[A-Za-z]` matches 3
  lines in `jjel` tests, `'` matches 880 lines over the 5 files. No existing test would change.
- An **unsized** literal `'d3` cannot be taken: `'d3'` is a valid string today. Refused, not deferred.
- `|` is the token `PIPE` (`tokens.ts:82`, verified: `PIPE = 'PIPE', // | (alias for 'such that')`), used by
  `exists x in S | P`. An infix bitwise or `|` would collide with it. `&`, `^`, `~` are free (errors today); `<<` and
  `>>` are two tokens today and could become one each, which changes `a < <b` style inputs only (none in tests, not
  measured further). Infix bitwise operators are therefore an S4 question, `|` excluded.
- Side finding, out of scope: `0xFF` evaluating silently to `0` is the known lenient-`parse()` defect
  (`docs/spec/concern_languages.md:102`, "`parse()` non valida EOF, accetta token spuri"), and it is the most likely
  mistake a hardware user makes. Worth a ticket.

## 4. Persistence (item 3)

- [R, verified] The D-layer value: `LModelElement.tsx:6807` `values: PrimitiveType[] | Pointer<...> = [];` with
  `joiner/types.ts:69` `export type PrimitiveType = string | number | boolean | null | undefined;`.
- [R, verified] Writes are loose: `LModelElement.tsx:7972` `// loose checks, i can assign any primitive to any primitive (will cast on get)`.
- [R, verified] Save: `common/U.tsx:443-444` `let str = JSON.stringify(state, proxyToIdReplacer); return await compressToUTF16(str);`,
  and the replacer returns every non-proxy value untouched (`model/unproxy.ts:79-85`). [M] `JSON.stringify` of an
  object holding `255n` throws `TypeError: Do not know how to serialize a BigInt` (probe `clone.mjs`). **A `BigInt`
  anywhere in the D-layer breaks the save of the whole project.** Bit-vectors must never be written into a `DValue`.
- [R, verified] Read coercion for numbers: `LModelElement.tsx:7646-7647` `v = Math.min(numbermax, Math.max(numbermin, v)); return round ? Math.round(v) : v;`,
  with `ELong` bounds `9223372036854775807` (`:7759-7761`), a double: above 2^53 an `ELong` attribute is not exact.
- [R] Metamodel primitives (`common/U.tsx:3326-3345`): `EVoid, EChar, EString, EDate, EBoolean, EByte, EShort, EInt,
  ELong, EFloat, EDouble, Expression, Action`. `EBigInteger` is only a name in a UI set
  (`components/ui/PredicateBuilder/predicateDefaults.ts:80`). Ecore maps `ELong` both ways
  (`services/export/EcoreService.ts:736-737`, `api/data.ts:160`), not `EBigInteger`.
- [R, verified] JjEL reads an attribute as its `.value` (`modelContext.ts:50-53`): a JS `number` for `EInt`/`ELong`, a
  `string` for `EString`.

Options for a bit-vector attribute of a model object (a reset value, a constant, an opcode):

| Option | Persisted shape | Exact width | Migration | Cost |
|---|---|---|---|---|
| (a) `EInt`/`ELong` value + `EInt` width | number | ≤ 53 bits | none | `bits(self.width, self.value)` in JjEL |
| (b) `EString` value (decimal, `0x…`, or `8'hFF` text) + `EInt` width, or width inside the literal | string | any | none | `bits(w, s)` accepts a string; editable in today's widgets; XMI export already `String(v)` (`XMIService.ts:264`) |
| (c) new datatype `EBits` | new primitive id | any | **forced** (precedent `VersionFixer.tsx:1327-1350`, `'2.228 -> 2.229'`) | enum, `Defaults`, `get_values`, Ecore/JSON maps, conformance |

**Recommendation: (a) and (b), no (c).** The width is a sibling attribute read from model data and passed explicitly,
`bits(self.width, self.resetValue)`; `bits` accepts a safe-integer number or a string. A number that is not a safe
integer is a defect, never a silent rounding. No VersionFixer migration, no critical-zone file. This is R-BV-1 as
written ("width read from the model data, not a parameter of a metamodel type"), made concrete: the code supports it
only through an explicit argument, there is no implicit link between a value attribute and a width attribute, and none
is proposed.

## 5. Simulator (item 4)

### 5.1 Guards, actions, σ

- [R] `.[` is one token `DOT_LBRACKET` (`jjel/lexer/lexer.ts:141-143`); the parser builds `StateAccess`
  (`parser.ts:446-456`); an action target must end in `.[attr]` (`parser.ts:117`); reads go through
  `ctx.stateAccess.read` (`evaluator.ts:1012`, `context.ts:244`).
- [R, verified] Five separate evaluators, path B of R-SIM-14: `guardEvaluator.ts:54`, `actionEvaluator.ts:69`,
  `derivedEvaluator.ts:509`, `boardOutputs.ts:201`, `stcChecks.ts:80`, each `const EVALUATOR = new JjelEvaluator();`.
  S1 reaches all of them with no simulator change.
- [R, verified] `netTypes.ts:24` `export type SimValue = boolean | number | string;` and `netTypes.ts:27-30` `Domain` =
  `boolean` | `range {min, max}` (numbers) | `enum {literals}`.
- [R, verified] `actionEvaluator.ts:215-218`: `if (!isSimValue(rhs.value)) return \`the value is ${describeType(rhs.value)}, not a boolean, a number or a string\`;`
  with `isSimValue` at `:135-136`. **Today an action that assigns a bit-vector is refused as an action defect**: S1
  alone is safe in the simulator, it cannot corrupt σ.
- [R, verified] `netStep.ts:226-233` `inDomain`: `case 'range': return typeof value === 'number' && Number.isInteger(value) && ...`.
- [R] σ is immutable `Map`s with copy-on-write (`netStep.ts:240-247`); step back slices kept configurations
  (`simRunState.ts:406-418`) or replays `step` from the initial configuration (`simRunState.ts:328-333`); no
  `structuredClone`, no JSON on σ. Only M is deep-frozen (`guardContext.ts:127`). A `BigInt` in σ survives snapshot and
  step back. [R] JSON is used on the declaration records (`stateAttributesCodec.ts:82`), where `initial` is literal text.
- [R, verified] `stateAttributesCodec.ts:96-103` `parseInitialLiteral` accepts a `Literal`, a negated number literal or
  a bare identifier (enum literal); `bits(8, 0)` would return `null` (refused).

What S2 needs for a stored bit-vector attribute: `SimValue` widened with `JjelBitVector`; a fourth `Domain` kind
`{kind: 'word', width, signed}`; `inDomain` (same width and signedness), `domainOf` and the codec; `parseInitialLiteral`
accepting a number or `bits(w, n)`/`sbits(w, n)` literal call, checked against the domain; display of σ values
(`simBridge.ts:1003` `outputValues`, not read). **Open point**: R-BV-1 wants the width from model data, but a σ
declaration is per metaclass with one `Domain` (R-SIM-19, R-SIM-67). Two registers of the same metaclass with widths 8
and 16 need either a domain whose width is read per element from the frozen M (`{kind:'word', widthFeature:'width'}`,
resolved at compile time, constant for the run, so nuXmv still gets one static `word[N]` per element), or one metaclass
per width. The first keeps R-BV-1; it is a design decision of S2, recorded below.

### 5.2 Translatable subset

- [R] `model/simulation/subsetChecker.ts`: `checkGuardSubset` (`:387`) walks every node (`:261`); no whitelist, codes
  in three severities (`:42-47`). [R, verified] `subsetChecker.ts:88-89`: `ORDERING = new Set(['<', '<=', '>', '>='])`,
  `ARITHMETIC = new Set(['+', '-', '*', '/', '%'])`; `/` and `%` are `T-DIV`/`T-MOD` not-verifiable; methods are
  `T-METHOD` not-verifiable unless listed. S2 adds the bit-vector methods of §3.2 as translatable (all have a nuXmv word
  operator, below) and keeps `toNumber` out.

### 5.3 The `.smv` exporter

- [R] **Absent.** Explorer search `command grep -rn -m3 "MODULE main\|\.smv'" frontend/src frontend/scripts`: exit 1;
  positive control `command grep -rl "MODULE main" docs`: 3 files. The same search over every `~/jjodel-w-*` worktree:
  none. Prior reports agree: `discovery_2026-10-03_sim_io_board.md:49` "No code emits `.smv`",
  `discovery_2026-10-10_sim_event_attributes.md:422` "There is no `.smv` exporter in the code."
- The only specification is `docs/spec/claude_spec_2026-09-13_computational_model.md` §8 (lines 212-236 [R]).
- Emission for R-BV-6 when the exporter is built: `VAR r : unsigned word[8];` / `signed word[8];` for a `word` domain;
  constants `0ud8_255`, `-0sd8_1`; operators `+ - *` (modular), `&`, `|`, `xor`, `!`, `<<`, `>>` (arithmetic on signed
  words), `::` (concatenation), `x[hi:lo]` (selection), `extend(x, n)` (sign or zero by the operand's type),
  `resize(x, n)`, `signed(x)`/`unsigned(x)`, comparisons signed or unsigned by type. The frame condition of R-SIM-19
  (`TRUE : x`) is unchanged. Since the exporter does not exist, S2 cannot "extend its table": S2 delivers the simulator
  side and a pure function from a bit-vector expression to nuXmv text, unit-tested, which the exporter lane consumes.

## 6. Code generation (item 5)

- [R, verified] The pilot is in this tree (`frontend/src/codegen/`: engine, runner, oracle, target/js, ui). Only target:
  JavaScript. `command grep -rli verilog` over `codegen jjel model`: no file (the pipeline's exit 0 is `head`'s; no line
  printed).
- [R] Templates: interpolation goes through `evaluateInterpolatedString` (`evaluator.ts:1043`) and, under a text host,
  holes rendered by `this.stringify(value, host)` (`:1067-1086`). [R, verified] The codegen host has its own formatter,
  `codegen/engine/origin.ts:194-202` `plain()`: numbers and booleans `String(value)`, other objects
  `JSON.stringify(value)` with `catch { return '[Object]'; }`. [M] The evaluator's `stringify` throws on a bit-vector
  object (probe `interp.mjs`: `"v=${a}"` → `TypeError Do not know how to serialize a BigInt`; `"raw=${a.value}"` →
  `raw=255`).
- [R, verified] Runner: `codegen/runner/runner.ts:113` `worker.postMessage({ code: request.code, calls: request.calls });`;
  results `codegen/runner/runner.worker.ts:119` `results.push(structuredClone(value));`. No JSON in the path. [M] Node
  `structuredClone` and a `worker_threads` round trip carry `255n` as `bigint` (probe `clone.mjs`: `worker roundtrip
  bigint 256n`). Node's workers use the HTML structured-clone algorithm the browser uses; the browser itself was not run.
- [R, verified] Hazards in the JS target: `codegen/target/js/access.ts:277-285` `valueLiteral` prints anything that is
  not string, number, boolean, array or object as `'null'` (a `bigint` in σ would be emitted as `null` silently, and a
  bit-vector object as an object literal with `bits: null`); the runtime prelude `$add` and siblings are `typeof number`
  gated (`printer.ts:190-205`) and would return `null`.
- What a Verilog template needs (R-BV-6): a value that knows its width and signedness (S1), and a method that prints it
  in Verilog form, `x.toVerilog()` → `8'hff` / `8'sh..` (hex padded to `ceil(width/4)` digits, two's complement for
  negative signed values), with `stringify` and `plain()` printing a bit-vector in that same form instead of throwing.
  Explicit widths on every operand are the generator's job (the expression printer of a Verilog target profile,
  R-GEN-6), not the value's: no Verilog target profile exists yet.

## 7. Conformance and the problems registry (item 6)

- [R, verified] `model/jjelTriState.ts:40-44` `verdict`: `true` → satisfied, `false` → violated, else `'not-boolean'`.
  [R] `NotEvaluableReason = 'exception' | 'non-boolean' | 'absent-identifier'` (`jjelTriState.ts:25`); a non-boolean
  verdict is a `notEvaluable` entry with `reason: 'non-boolean'` (`validationEvaluator.ts:329-334`), not a registry
  entry (`validationToProblems.ts:18`). `describeType` returns `typeof value` (`jjelTriState.ts:48-52`).
- [R] Simulator: compile defects at Reset, `CompileDefect` reasons (`components/editor-v2/sim/simBridge.ts:399-410`)
  `'parse-error' | 'subset' | 'undeclared' | 'locality' | 'double-assignment' | 'declaration' | 'read-only' |
  'unresolved' | 'value' | 'else-alone' | 'event' | 'event-feature' | 'trigger-position'`; run-time halts `HaltReason`
  (`netTypes.ts:343-351`) including `'action-defect'` and `'domain'`; published on the registry channel `'simulation'`.
- [R] Attribute conformance: `model/conformance/ConformanceValidator.ts` CHECK 3 `type_mismatch` (`:200-272`) sees one
  attribute at a time; no check relates two attributes; `ELong` has no branch; `EInt` is checked for integer-ness only.

Where each bit-vector error lands:

| Error | Detected | Channel | Kind |
|---|---|---|---|
| Width or signedness mismatch in an operator | evaluation (JjEL has no static types, `concern_languages.md:111`) | validation: `notEvaluable` `exception`; simulator guard/action: defect or halt `action-defect` | defect of the rule or action (R-VAL-13 analogue) |
| Bit-vector where a boolean is expected (`not`, `and`, `or`, guard verdict) | evaluation | as above; a verdict is already `not-boolean` | defect of the rule or action |
| Number mixed with a bit-vector in `+ - * == <` | evaluation | as above | defect |
| `bits(8, 300)`, `slice(9, 0)` on 8 bits, `bit(8)` | evaluation | as above | defect of the expression, even when 300 came from the model |
| A model value out of range for its sibling width | only when an expression builds the vector | as above | a model fault reported as an expression defect: the honest gap (below) |
| Assignment to a `word` attribute of another width | S2: `inDomain` at the step; literal widths at Reset when the checker can see them | `'domain'` halt / `'value'` defect | defect |

A conformance check "value fits width" for model data needs to know which attribute is the width of which: the
metamodel does not say so. It belongs to a later slice (an annotation on the value attribute, or a validation rule the
user writes); S1 does not add it.

## 8. Overlap with `jjel-multivalued` (item 7)

- [M] `git diff --stat 0c8a1832f 796839cc8` (merge base to tip): 4 files, `frontend/src/jjel/evaluator/evaluator.ts`
  `| 10 +-`, `frontend/src/jjel/evaluator/modelContext.ts` `| 28 +-`, a new test and its discovery report.
- [M] Hunks: `evaluator.ts` `evaluateForAll` and `evaluateExists` (around `:935-960`): a non-collection now throws
  `'forall' needs a collection`; `modelContext.ts` `extractAttributeValues` reads by declared multiplicity
  (`readSlot`, `isMultiValued`) and binds `null` for an unset single-valued feature.
- [M] `git merge-tree --write-tree --name-only HEAD 796839cc8`: exit 0, tree `e6350f3f2…`, no conflict. HEAD carries 511
  commits since the merge base, none of which touches either file
  (`git log 0c8a1832f..HEAD -- evaluator.ts modelContext.ts`: empty).
- S1 sites (§2.5, §3.2): `context.ts` union and conversions, `evaluator.ts` `:88-121`, `:280-380`, `:718-818`,
  `:1093-1164`, `collections.ts`, a new `builtins/bitvectors.ts`. No line of S1 is in a hunk of `jjel-multivalued`;
  S1 does not touch `modelContext.ts`.
- One semantic contact: after `jjel-multivalued`, `self.width` of an unset single-valued `width` reads `null` instead of
  an absent name; `bits(null, …)` must be a defect either way. **No ordering is required.** Merging it first costs one
  clean rebase of nothing; merging it after costs the same. Recommendation: S1 does not wait for it.

## 9. Oracle (item 8)

- [M] `command -v` for `verilator`, `iverilog`, `yosys`, `nuXmv`, `nuxmv`, `NuSMV`: all absent (exit 1 each);
  positive control `command -v node` → `/Users/alfonso/.hermes/node/bin/node`. Homebrew offers `verilator 5.052` and
  `icarus-verilog 13.0`, both `installed: 0` (`brew info --json=v2`). Docker is installed but its daemon is not
  running; no image was pulled.
- Proposed oracle:
  1. **The case table**, `frontend/src/jjel/__tests__/fixtures/bv-cases.json`, generated once by a script and committed:
     for each operator of R-BV-4 and each function of R-BV-5, widths `{1, 4, 7, 8, 16, 32, 33, 53, 54, 64, 65, 128}`,
     both signednesses, operands from the edge set `{0, 1, 2^(w-1)-1, 2^(w-1), 2^w-1}` plus seeded random values,
     shift amounts `{0, 1, w-1, w, w+1}`. Inputs only, as hex text.
  2. **Expected values** come from the external simulator, not from the evaluator: a script (S-oracle, outside the
     test suite) writes one Verilog module per table, `$display("%0d %h", i, result)` per case, with every operand
     sized and signed explicitly, runs `verilator --binary` (Icarus as second opinion), parses the output and writes
     `expected` back into the table. Until it has run, S1 carries a short hand-checked golden set (about 40 rows taken
     from IEEE 1364/1800 examples: wrap-around, signed comparison of `8'sh80`, arithmetic shift of a negative,
     `sext` of `1'b1`, concatenation order), each row cited in a comment.
  3. **The test** reads the table and checks the evaluator row by row; the same table later drives the nuXmv
     printer (S2) and the Verilog emission (S3), so the three back ends answer the same rows.
  4. Two-state only (R-BV-2): every operand is defined, so Verilator's two-state model and the evaluator agree by
     construction of the inputs, not by luck.

## 10. Verdicts on R-BV-1..6

- **R-BV-1 — amended.** Confirmed: a value carrying width, signedness and a `BigInt` payload, no parametric type,
  exact up to 128 bits and beyond (`BigInt`). Amendment: (1) the payload is canonical unsigned, `0 ≤ bits < 2^width`,
  and signedness is an interpretation; (2) the value never enters the D-layer (it would break the save, §4); model data
  holds the width as an `EInt` attribute and the value as an `EInt` (≤ 53 bits) or an `EString`, and an expression
  builds the vector with `bits(self.width, self.value)`; (3) in σ a stored bit-vector attribute has a `word` domain
  whose width may be read per element from the frozen model (§5.1).
- **R-BV-2 — confirmed.** Nothing in JjEL, σ or the JS target models X or Z. Precision: JjEL `null` is not X; a `null`
  operand of a bit-vector operator is a defect.
- **R-BV-3 — amended.** Confirmed: equal widths, explicit `zext`/`sext`/`trunc`, a mismatch is a defect of the holding
  rule or action. Amendment: binary operators also require **equal signedness** (stricter than Verilog, which silently
  makes a mixed expression unsigned), with `asSigned()`/`asUnsigned()` as the explicit casts; shift amounts, indices,
  widths and `replicate` counts are plain numbers; any other mix of a number and a bit-vector (`x + 1`, `x == 0`,
  `x < 3`) is a defect, never a conversion — the user writes `x + bits(8, 1)`. Measured that this breaks no existing
  expression: no value of the new kind exists before S1, every arithmetic site is `typeof`-gated (§2.4), so numbers stay
  numbers. The one way S1 can change an existing meaning is name shadowing by global builtins (§3.1), handled by R-BV-5.
- **R-BV-4 — amended.** Operator list confirmed. Amendment: JjEL has no bitwise or shift operators and `|` is taken by
  `such that`; `+`, `-`, `*`, unary `-`, `==`, `!=`, `<`, `<=`, `>`, `>=` are overloaded for bit-vectors in S1; bitwise
  operations and shifts are methods (`and`, `or`, `xor`, `not`, `shl`, `shr`, `ashr`); `and`, `or`, `not` as keywords
  stay boolean and refuse a bit-vector (defect). Comparisons return booleans; `x.bit(i)` returns a 1-bit vector.
- **R-BV-5 — amended.** Functions first confirmed; literals later confirmed and measured feasible. Amendment: only
  `bits` and `sbits` are global; `slice`, `bit`, `concat`, `replicate`, `zext`, `sext`, `trunc` are methods of the
  bit-vector (receiver dispatch, no shadowing). Sized literals `<w>'[s]<b|o|d|h><digits>` take a lexer-error space today
  and change no test (0 occurrences, controlled); unsized `'d3` is refused because `'d3'` is a string today. The
  literal must be lexed by both the JjEL and the JjTL lexers.
- **R-BV-6 — amended.** Confirmed as the goal; "by construction" is not true of the code today. Amendment: the
  semantics lives in one module (`jjel/evaluator/builtins/bitvectors.ts`, pure, BigInt) that the evaluator calls and
  that the JS target's runtime prelude reuses as text; there is no `.smv` exporter and no Verilog target yet, so the
  nuXmv and Verilog printers are new code driven by the same case table, and the table's expected values come from
  Verilator (§9). Today the operator semantics already exists in three copies (evaluator, collections, JS runtime
  prelude, §2.2), before any nuXmv or Verilog printer is written.

## 11. Slice plan

**S1 — the value and its operations in the evaluator.**
Files: `frontend/src/jjel/evaluator/context.ts` (union member `JjelBitVector`, `isBitVector`, `toJjelValue` and
`fromJjelValue` branches); new `frontend/src/jjel/evaluator/builtins/bitvectors.ts` (pure semantics and method table);
`frontend/src/jjel/evaluator/evaluator.ts` (constructors in `registerGlobalBuiltins`, operator branches, `isTruthy`,
`compare`, `stringify`, `getTypeName`, `callMethod`, builtin `String`); `frontend/src/jjel/evaluator/builtins/collections.ts`
(`distinct`/`distinctBy`/`groupBy` keys, `compare`); `frontend/src/jjel/metadata/builtins.ts` (autocomplete);
`frontend/src/jjel/SPEC.md`; tests `frontend/src/jjel/__tests__/bitvector.test.ts` and the case table fixture. Nine
files: Rule 19 pause expected. `model/jjelTriState.ts` `describeType` prints `object` for a vector; widening it is out of
S1 unless the typecheck asks.
Tests: constructors and range defects; each operator on the golden rows; mismatch defects (width, signedness, number);
boolean-position defects; equality and `distinct`; printing (`8'hff`); the 299 existing JjEL tests unchanged.
Gates: typecheck 0, `vitest run src/jjel src/jjtl src/model/simulation src/codegen`, build, the mutation bench below.

**S2 — the simulator.** `model/simulation/netTypes.ts` (`SimValue`, `Domain` `word`), `netStep.ts` (`inDomain`),
`stateAttributesCodec.ts` (`domainOf`, `parseInitialLiteral`), `actionEvaluator.ts` (`isSimValue`), `subsetChecker.ts`
(bit-vector methods translatable), the declaration dialog's domain editor, a pure `bvToSmv` printer with its tests. Tests:
a register `r : word 8` incremented 256 times is 0; step back restores `bits`; Reset defects on a width-mismatched
literal; trace parity on the existing demo models (no `word` domain → identical traces). Gates as S1 plus the sim
suite.

**S3 — code generation.** `codegen/engine/origin.ts` (`plain` prints Verilog form), `codegen/target/js/access.ts`
(`valueLiteral` for vectors), `codegen/target/js/printer.ts` (runtime prelude: a vector class built from the S1
module's semantics, `$add` and siblings dispatching to it); a Verilog target profile skeleton only if R-GEN scope
allows (expression printer with explicit widths). Tests: the oracle compare of R-GEN-8 on a counter model; the runner
round trip of a vector (structured clone). Then **S-oracle**: the script that runs the case table through Verilator,
on a machine where it is installed.

**S4 — Verilog literals.** JjEL and JjTL lexers, parser literal node with `width`/`signed`/`bits`, `parseInitialLiteral`;
tests that `8'abc'` and `'d3'` keep their string readings where they still parse, and that every existing test passes.
Allowed: §3.3 shows no existing test changes.

## 12. Layer Impact Report — S1

```
LAYER IMPACT REPORT (S1)

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] Outside the list: the JjEL language core (exported type JjelValue)

JjEL core:
  - What changes: JjelValue gains JjelBitVector; two global builtins (bits, sbits); a method table on the new kind;
    operator, equality, ordering, truthiness and printing branches for it; collection keys.
  - What does NOT change: lexer, parser, AST, any existing value's behaviour, modelContext, the D-layer value path.
  - Cross-layer interaction: every consumer of JjelValue (31 non-test files) sees a wider union. The simulator refuses a
    vector in σ (actionEvaluator.ts:217) until S2; the codegen formatter prints '[Object]' until S3 (origin.ts:202).
  - Side-effect safety: a vector can never reach a DValue through S1 (no write path builds one; JjEL is read-only on M).
    The only meaning change is name shadowing by `bits`/`sbits` for bare identifiers.

Smoke-test scenarios potentially affected:
  - open the MODELS demo, run each simulation demo to completion → identical traces (no expression uses the new names)
  - JjTL transformation demo → identical target model
  - a validation rule using `distinct` and interpolation → unchanged results
```

RC-26 and Rule 11: widening the exported `JjelValue` union is an exported-type change. It goes to Alfonso only if it
breaks a consumer outside the lane; S1's typecheck is the measure, and S1 stops if any non-JjEL file stops compiling.

## 13. Mutation-bench plan for the operators

Each mutation is applied to `bitvectors.ts` by hand on a scratch copy, the suite runs, and the test that kills it is
named in the S1 commit message (`CLAUDE.md` §5, last two sub-rules). The module is importable in vitest (the JjEL
suite runs without `window`, §0).

| Mutation | Must be killed by |
|---|---|
| drop `asUintN` after `+` (no wrap) | `add wraps 8'hff + 8'h01 to 8'h00` |
| drop `asUintN` after `*` | `mul keeps the low w bits` (16×16 at width 8) |
| `-` as `b - a` | `sub is not commutative` |
| signed comparison as unsigned | `8'sh80 < 8'sh01 when signed` |
| unsigned comparison as signed | `8'h80 > 8'h01 when unsigned` |
| `ashr` as `shr` | `ashr of 8'sh80 by 1 is 8'shc0` |
| shift by ≥ w not zero (JS `<<` semantics) | `shl by w gives zero` |
| `sext` as `zext` | `sext of 4'b1000 to 8 is 8'hf8` |
| `slice` with exclusive `hi` | `slice(7, 4) of 8'hab is 4'ha` |
| `concat` order swapped | `concat puts the receiver high` |
| `replicate(n)` gives n-1 copies | `replicate(3) of 2'b10 is 6'b101010` |
| `trunc` keeps the high bits | `trunc of 16'h1234 to 8 is 8'h34` |
| width check removed | `8 + 16 bits is a defect` |
| signedness check removed | `signed + unsigned is a defect` |
| number accepted as operand | `x + 1 is a defect` |
| equality ignores `signed` | `bits(8,255) != sbits(8,-1)` |
| `bits(8, 300)` truncates instead of failing | `out-of-range constructor is a defect` |
| `isTruthy` branch removed (vector truthy again) | `not x is a defect` |
| `stringify` branch removed | `interpolation prints 8'hff` |

## 14. Dependencies and risks

- Shadowing of `bits`/`sbits` on bare identifiers (§3.1): a metamodel feature with those names is read with `self.`.
- Rule 19: S1 is about nine files; the S1 prompt lists them.
- R-GEN freeze 2026-10-23 (spec §2): S3 touches the codegen pilot near the 3.2 freeze; S3 should not land before 3.2
  ships unless the chat decides otherwise.
- No exporter: R-BV-6's nuXmv back end depends on a lane that does not exist yet.
- The oracle needs Verilator on a machine (§9).
- Not read: `derivedEvaluator.ts`, `watchEvaluator.ts`, `boardOutputs.ts` and `simBridge.ts` internals (σ display); the
  JjScript lexer on a Verilog literal in an `eval` line; the JjTL lexer was read, not probed.

## 15. Open questions

1. Should a σ `word` domain read its width per element from a model feature (keeps R-BV-1) or be fixed per metaclass?
2. Does `x.bit(i)` return a 1-bit vector (algebraically closed, recommended) or a boolean?
3. Is `0xFF` → `0` worth a ticket on the lenient `parse()` before hardware users meet it?
4. Should S3 wait for the 3.2 release (2026-10-26)?

## Decisions taken (unattended)

1. Value shape: a frozen `{__type:'BitVector', width, signed, bits}` with canonical unsigned `bigint` bits, a new
   `JjelValue` member tested before `isJjelObject` (§2.5).
2. Only `bits` and `sbits` are globals; all other operations are methods of the vector (§3.2).
3. Equal width **and** equal signedness for binary operators; number mixing is a defect except for indices, widths,
   counts and shift amounts (§10, R-BV-3).
4. Bitwise and shift operations are methods in S1; no infix `|` ever (taken by `such that`), `& ^ ~ << >>` left to S4.
5. No new metamodel datatype and no VersionFixer migration: model data holds `EInt` width plus `EInt` or `EString`
   value (§4).
6. Unsized Verilog literals are refused; sized literals are S4, both lexers.
7. `jjel-multivalued` is not a prerequisite of S1 (§8).
8. The case table's expected values come from Verilator in a separate S-oracle step; S1 ships a cited golden set.
   Installing Verilator through Homebrew is named in that step's prompt; no `package.json` dependency is involved.
9. `x.bit(i)` returns a 1-bit vector; comparisons return booleans.

## Decisions awaiting Alfonso

1. Only if S1's typecheck shows a consumer outside JjEL broken by the wider `JjelValue` union (RC-26, exported
   interface): none is expected, none is measured yet.

None of the other items is on the RC-26 list.
