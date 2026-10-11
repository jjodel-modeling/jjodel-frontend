# Code generation S7a: readable element names in the generated JavaScript

Prompt-ID: P-2026-10-11-1052
Chat: C-2026-10-10-0046
Lane: full (JS target profile, printer, the two lecture examples; a light visual check). Model: the default of
`.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: P-2026-10-10-2029, P-2026-10-10-2027, P-2026-10-11-1105
Front: codegen-pilot
Request: https://claude.ai/code/session_01QYGEHstF7K66SVXwe8L7ep
Status: da eseguire
Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-codegen-names`, branch `codegen-names`, cut from the trunk tip that carries S1..S6 and the S5b
fixes and the fix of P-2026-10-11-1105; the branch carries the docs commit adding this prompt. `frontend/node_modules` symlinked (P14). Before
anything else: `pwd`, branch, `git log -1`, a clean `git status`, and `frontend/src/codegen/oracle/oracle.ts`,
`frontend/src/codegen/target/js/access.ts`, `frontend/src/codegen/examples/turnstile/turnstile.json` present.
Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-11-1052 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)

Contract: spec `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md` §7, §8; **R-GEN-16** and **R-GEN-17** in
`docs/decisions.md`. Read the log entries in `docs/log-inbox/codegen-*.md` first, S4 (runner, printer) and S6
(oracle) above all.

The problem, seen in the S6 crops: the generated program of both lecture examples is full of raw element ids
(`'Pointer1791659970959_USER_48'`), and the Petri preset is printed as compact JSON
(`[{"place":"Pointer…_9","weight":1}]`). The program runs and the oracle passes, but a student cannot read it. The
ids come from three places:

- `printer.ts`: `$E(${q(id)})` for element values (line ~328) and `$read(state, ${q(id)}, ${q(attr)})` for attribute
  reads (line ~381);
- `access.ts`: `initial: JSON.stringify(toJsState(net.initial))` (line ~346) and whatever else `jsTarget` returns as
  JSON text;
- the example templates, which interpolate ids and JSON directly.

R-GEN-17 (provisional, taken by the chat on Alfonso's "decidi tu", 2026-10-11) fixes the shape: **every element id
appears exactly once in the generated program, in one frozen table `const $ID = Object.freeze({ … })` near the top;
everywhere else the program refers to an element as `$ID.<name>`.** `<name>` is the element's `name` passed through
`mangle` and made unique by `JsIdentifierTable` (`target/js/identifiers.ts`); an element without a usable name gets
`<metaclass>_<n>` in model order, mangled the same way. The values at run time do not change (they are still the id
strings), so `observe`, `step` and the oracle comparison are untouched.

## WHAT

1. **Tests first**, run on the base commit to record that they fail.
   - The name table: two elements with the same name get distinct identifiers; a name that is a JS reserved word or a
     runtime name (`state`, `event`, `next`) is mangled; an unnamed element gets `<metaclass>_<n>`; the table is
     deterministic (same model, same text).
   - The printer: a guard reading an attribute of an element prints `$read(state, $ID.<name>, 'attr')`; an element
     value prints `$E($ID.<name>)`; with no table in the context the printer prints exactly what it prints today
     (the S4 differential test stays green unchanged).
   - Each lecture example: the generated text contains no id literal outside the `$ID` block (assert by scanning for
     every id of the model), and the oracle on its recorded scenario still passes, in node, as in S6's tests.
2. **Printer**: an optional field on `JsPrintContext` that maps an element id to the JS expression naming it. When
   present, `$E(...)` and `$read(...)` use it; when absent, today's output. No other change to the printer's
   semantics.
3. **Target profile** (`access.ts`, R-GEN-16): `target` gains `ids` (the text of the `$ID` declaration, ready to
   interpolate) and `ref(element)` (the expression `$ID.<name>` for one element); `guard(site)` and `actions(site)`
   print through the table; `initial` and every other JSON-shaped value that contains ids is printed as a JS object
   literal with computed keys or `$ID` references (for example `{ [$ID.ready]: 1 }`), not as JSON. Say in the log
   entry which `target` members changed shape.
4. **Examples**: update the turnstile and Petri producer-consumer template sets to emit `target.ids` once and use
   `target.ref(...)` (or the printed guards and actions) everywhere else; the preset and postset of a Petri transition
   print as `[{ place: $ID.ready, weight: 1 }]`. Update the two READMEs where they show generated code. The
   comment headers keep naming the element in plain words as today.
5. **Probe**: extend `frontend/scripts/probe/codegen-oracle.ts` (or add `codegen-names.ts`, say which) on a free port
   between 3080 and 3099 (never 3001): for each example, generate, assert no id literal outside the `$ID` block,
   run the oracle through `window.__jjodelOracle`, assert pass. Crops of the two examples in the Code panel, Output
   tab, scrolled to the `$ID` block and to the transition table (four crops), light theme, into the lane folder's
   `crops/`.
6. **Gates**: `npx tsc --noEmit` (same set as base), `src/codegen` and `src/model/simulation` suites (base counts plus
   new), `npm run build`, `npm run check:codegen-lazy`, `typecheck:scripts`, `check:scripts`, the probe. Mutation
   bench (P11), in the commit body: the table drops the uniqueness suffix; the printer ignores the table for
   `$read`; `initial` printed as JSON again; an example template interpolates one raw id. Survivors are reported.
7. **Commits**: one `feat(codegen): …` commit with code, tests, examples and probe; then the log entry with the
   `log-entry` skill into `docs/log-inbox/codegen-names.md` in a docs commit. Stop with `Outcome: hard-stop` after the
   crops. No merge.

## DOVE

`frontend/src/codegen/target/js/{printer,access,identifiers}.ts` and their tests,
`frontend/src/codegen/examples/**`, the probe under `frontend/scripts/probe/`, `docs/log-inbox/codegen-names.md`.
Also `frontend/src/codegen/oracle/__tests__/exampleFixture.ts`, only `swapTarget`: it finds the postset by the JSON
text `"place":"<id>"`, which this slice removes; rewrite it against the new text (the `$ID.<name>` of the place)
and keep its throw when the text has no such place. The same holds for the mutation of the S6 probe
(`frontend/scripts/probe/codegen-oracle.ts`), which must stay green.

## NON FARE

- No edit to `frontend/src/codegen/ui/` (lane P-2026-10-11-1053 works there in parallel), `runner/`, `oracle/`,
  `engine/`, `stcAccess.ts`, `frontend/src/jjel/`, `frontend/src/model/simulation/` or `components/editor-v2/sim/`.
  A gap there stops the lane with `Outcome: question` and a `Recommended:` line.
- No change to `observe`, to the `step` contract, or to scenario files.
- No dependency, no `git add .`, no `git stash`, no push.

## RIFERIMENTI

- Spec §7, §8; R-GEN-7, R-GEN-11, R-GEN-16, R-GEN-17; S4 and S6 log entries.
- `CLAUDE.md` §5, §21; `docs/PROTOCOL.md` P8, P9, P11, P13, P14, P16.
