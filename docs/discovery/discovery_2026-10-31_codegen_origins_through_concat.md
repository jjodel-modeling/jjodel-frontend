# Discovery: codegen origins through `+` and `join`

- Prompt-ID: P-2026-10-31-1341
- Prompt file: `docs/prompts/claude_2026-10-31_1341_prompt_codegen_origins_through_concat.md`
- Session: C-2026-10-31-1328
- Tree: `~/jjodel-w-cgorigin`, branch `cg-origin-concat`, HEAD `7aa7df082`
- Executor model: Opus 5.5 (`claude-opus-5-5`)

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the files.
Every claim below is **read** on HEAD `7aa7df082` unless marked measured.

## Hypotheses under test

1. *A bare member read inside a `+` is opaque because `OriginHost.concat` turns each operand into a Text with
   `toText`.* **Partly.** That is the path only when one operand is already a Text. With two plain operands
   (`"logic " + r.name + ";"` in an expression body) the host is never consulted: the evaluator concatenates the
   strings itself, and the template call then wraps the whole string with `toText`, one opaque fragment with no read.
2. *`join` loses the items' origins the same way.* **Holds**, for the same two reasons: with plain items the host is
   not consulted; with a Text involved, each plain item goes through `toText`.
3. *The route "evaluate each operand through the host's read frame" can be taken without changing values.*
   **Holds**, if the host only observes: the value of `+`, `map` and `join` stays the evaluator's own computation,
   and the attribution travels in a side table of the host. Making `+` return a Text instead would change values
   (see §3).
4. *Existing codegen tests stay unchanged.* **Falsified for two rows.** `origin.test.ts:108-109` pins
   `${s.title + t.label}` and `${t.label + t.label}` as one opaque fragment; per-operand rule 1, as the prompt states
   it, makes them two model fragments. The generated code is the same.

## Files read

- `frontend/src/codegen/engine/origin.ts` (whole), `generate.ts` (whole), `templates.ts` (whole), `text.ts` 54-228,
  `indent.ts` (whole)
- `frontend/src/jjel/evaluator/evaluator.ts` 330-389, 784-1023, 1160-1289
- `frontend/src/jjel/evaluator/context.ts` 275-374
- `frontend/src/jjel/evaluator/builtins/collections.ts` 60-76, 405-434
- `frontend/src/codegen/engine/__tests__/origin.test.ts` 1-159, `textMode.test.ts` 70-95
- `docs/decisions.md` 6200-6220 (R-GEN-41)

## 1. How origins flow today

**A hole.** `evaluator.ts:1196-1197`:
> `const evaluate = () => this.evaluate(part.expr, ctx);`
> `const value = host.evaluateHole ? host.evaluateHole(part.expr, evaluate) : evaluate();`

`origin.ts:241-255` pushes a read frame, evaluates, pops it into the parent, then
`this.attribute(value, expr, reads, at.template)`. `attribute` (`origin.ts:311-322`) applies rule 1 through
`modelOrigin` (`origin.ts:325-338`), which needs the hole's own expression:
> `if (readName(expr) === last.property && last.value === value) {`

**`+`.** `evaluator.ts:357-361`:
> `if (host && expr.operator === '+' && (host.isText(left) || host.isText(right))) {`
> `    return host.concat(left, right);`

With two plain operands it falls to `applyBinaryOperator` (`evaluator.ts:378-380`,
`return String(left ?? '') + String(right ?? '');`). With a Text, `origin.ts:275-276`:
> `return this.budget.measure(concatTexts([this.toText(left), this.toText(right)])) as unknown as JjelValue;`

and `toText` (`origin.ts:288-291`) has no expression to attribute: `return opaque(plain(value));`.

**`join`.** `evaluator.ts:849-850` calls `joinWithTextHost` (`collections.ts:421-425`), which asks the host only
`if (host.isText(separator) || array.some(v => host.isText(v)))`; otherwise the plain `join`. The host's `join`
(`origin.ts:279-280`) again maps the items through `toText`. `callMethod` (`evaluator.ts:831`) receives the
receiver and arguments, not the call's expression.

**`map`.** `collections.ts:73`: `return array.map(item => transformer.call([item], ctx));`. A lambda body is
evaluated by `evaluateLambda` (`evaluator.ts:1008`) with no host involvement.

**The body of an expression-mode template.** `templates.ts:160`:
> `return budget.measure(host.toText(evaluator.evaluate(entry.expr, root.child(bindings))));`

No frame is pushed: the body's reads land in the caller's hole frame (or nowhere for the entry template), and a
plain string body becomes one opaque fragment with no read. This is where `"logic " + r.name + ";"` ends up.

## 2. Rendering does not depend on fragment boundaries

`indent.ts:32-57`: the prefix after a newline is `sharedPrefix(pending, f.indent)`, by level ids. Fragments built
from one value and spliced into the same hole all get `[level, ...f.indent]` with `f.indent` empty
(`origin.ts:269`), so cutting one opaque fragment into several leaves the code byte-identical. An empty fragment
would add a zero-width map entry (`text.ts:220-222`); `attribute` already returns `EMPTY_TEXT` for `''`
(`origin.ts:316`), and the route keeps that.

## 3. Route chosen and why

**Rejected: `+` returns a Text when an operand has a model origin.** A Text is opaque to JjEL
(`context.ts:305`, "JjEL never looks inside one"): `("x" + r.name).toUpper`, `.length`, `==`, `startsWith` on the
result would stop working in templates that use them today. That changes values for the one consumer, which is
the prompt's stop condition.

**Chosen: the host observes, values untouched.** Four optional members on `JjelTextHost` (additive, rule 11),
consulted only when `ctx.textHost` is set and has them:

- `evaluateConcat(expr, left, right, plain)`: the evaluator's `+` with a host. The host evaluates `left()` then
  `right()`, each in a read frame of its own (reads merged into the parent in order, exceptions propagate). A Text
  operand: the host's concatenation of the two operands **attributed** (rule 1 per operand). Otherwise the value is
  `plain(l, r)`, the evaluator's `applyBinaryOperator('+', ...)`, unchanged; when it is a string whose operands'
  texts join to it exactly, the host records an *assembly* for the `+` node: the two operands with their
  expressions and reads. Otherwise the node's record is cleared.
- `evaluatePart(expr, body)`: a lambda body, in a frame, recorded as the host's last part.
- `mapItems(items, call)`: `map` with a function, computed as `collections.map` does; the host keeps, per result
  array (`WeakMap`, by identity), the part each item came from.
- `evaluateJoin(expr, items, separator, plain)`: `join` with a host; `evaluateMethodCall` passes its node to
  `callMethod`. With a Text: the host's join, items attributed through the array's parts. Otherwise `plain()`, the
  call to `joinWithTextHost` made today, and an assembly for the `join` node when the items have parts.

At a sink (a hole, the body of an expression-mode template, an operand, a join item) a string value whose expression
has an assembly with that same value is materialised: each operand by rule 1, a literal or anything else opaque
with its own reads. Assemblies are captured at the moment the operand completes, so a lambda body evaluated once
per item keeps one assembly per item. Materialisation is lazy: a `+` in a loop does not copy fragment arrays.

The body of an expression-mode template goes through a new `OriginHost.evaluateBody` (frame, then `attribute`)
instead of `toText`, so `"logic " + r.name + ";"` and a bare `r.name` body both get their origins. This touches
`templates.ts:160`, not listed in DOVE but in the same engine directory: declared expansion.

Literal operands stay opaque. A literal origin would be cheap (`TemplateSources` lexes strings already), but it
changes the `${"x"}` row of `origin.test.ts:109`; not taken.

**No text host.** Every hook is behind `ctx.textHost` (`evaluator.ts:358`, `:849`) or the host's own optional
member; without a host the evaluator's paths are the lines quoted in §1, unchanged.

## 4. Grep for new identifiers

`command grep -rlw <name> frontend/src | wc -l` on HEAD, positive control `templateOf` (exists, `origin.ts:215`): 1.

| Name | Files |
|------|-------|
| `evaluateConcat`, `evaluatePart`, `evaluateJoin`, `mapItems`, `evaluateBody`, `templateAt`, `Assembly`, `assemblies`, `OperandValue`, `itemParts` | 0 each |

`Composition` (29 files) and `compositions` (13) are taken, so not used.

## 5. Risks

- Cost: every `+`, lambda body and `map` under a host now pushes a frame and allocates a small record. Bounded by
  evaluation steps; the budget (R-GEN-28) still checks the Texts the host builds.
- A stale assembly: guarded by the value check and by clearing a node's record on every evaluation that does not
  record one.
- `jjel/SPEC.md:702` says the host "takes over `+`, `join` ... when a Text is involved"; after this change it also
  observes them with plain operands, values unchanged. The SPEC line is out of scope here.

## Questions

1. The two `+` rows of `origin.test.ts:108-109` change from one opaque fragment to two model fragments: amend them
   (recommended, the prompt's rule) or keep `+` inside a hole opaque?
2. Literal operands of `+`: opaque (taken) or literal origin with their template position?
3. `jjel/SPEC.md:702`: update the textHost sentence in a follow-up docs lane?
