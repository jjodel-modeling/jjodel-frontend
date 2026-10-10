# Code generation S2: the template engine (Text, origin, block indentation, template records, codec)

Prompt-ID: P-2026-10-10-0945
Chat: C-2026-10-10-0046
Lane: full (new engine module, six source files and their tests; consumes the exported JjEL interface of S1).
Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead (none needed, discovery §I.3).
Depends: P-2026-10-10-0900
Status: eseguito 2026-10-10 · lane codegen-engine · code 67d74be39 · docs 0bebec308 · question on buildEvalContext answered as recommended (generate receives globals from its caller; real wiring owed to S5) · tsc 14 = base, src/codegen 100, src/jjel 279, src/model/simulation 685, src/jjscript 541, build exit 0, mutation bench 18/18 killed · no visual check (textual slice)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-codegen-engine`, branch `codegen-engine`, cut from the trunk tip that carries the docs commit
adding this prompt (S1 and S3 are already merged there), `frontend/node_modules` symlinked (P14). Before anything
else: `pwd`, branch, `git log -1`, a clean `git status`, and `frontend/src/codegen/stcAccess.ts` plus
`parseTemplate` in `frontend/src/jjel/index.ts` both present. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-0945 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)

Contract: `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md` (§4, §5, §3) and R-GEN-4, R-GEN-5, R-GEN-10,
R-GEN-12 in `docs/decisions.md`. Evidence: `docs/discovery/discovery_2026-10-10_code_generation_pilot.md`, read §A.3,
§A.4, §B (all), §C.3, §C.6, §I.4 (row S2) and the table of unattended decisions U1, U2, U9, U10.

What is already on the trunk:
- **S1** (`P-2026-10-10-0900`, log `docs/log-inbox/codegen-jjel.md`): `parseTemplate(source)` and the exported
  types `JjelTextHost` and `JjelTextPart` in `frontend/src/jjel/index.ts`. `JjelTextHost` has `isText(v)`,
  `interpolate(parts, expr)`, `concat(l, r)`, `join(items, sep)`, `stringify(t)` and an optional
  `evaluateHole(expr, evaluate)`; a hole part is `{kind:'hole', value, expr, location, render()}`. The context
  fields are `textHost` and `readObserver(target, property, value)`. Literal text between holes carries no source
  location: recover those spans from `tokenize(src, { interpolation: true })`, whose text tokens carry positions.
  Read the S1 log entry and `frontend/src/jjel/SPEC.md` §9.4 before writing code.
- **S3** (`P-2026-10-10-0901`, log `docs/log-inbox/codegen-stc.md`): `stcAccess(lookup, modelId, handleOf)` in
  `frontend/src/codegen/stcAccess.ts`, read-only, `null` when the metamodel has no STC. `trigger`, `source`,
  `target` return arrays; Petri nets expose input and output places through `net`, not `source`/`target`.
- The JjEL view of a model has one builder, `buildEvalContext` (`frontend/src/jjscript/executor/commands/eval.ts:122`);
  `frontend/src/model/simulation/guardContext.ts:14-15` forbids a second copy. Its handles carry `id` and plain
  feature keys (discovery §B.2).

## WHAT

1. **Tests first**, run on the base commit to record they fail. One file per module under
   `frontend/src/codegen/engine/__tests__/`, plus one end-to-end file. From discovery §I.4 (row S2):
   - indentation as property tests: a single-line value is unchanged; an n-line value interpolated on a line
     whose leading whitespace is `w` gains exactly n−1 prefixes `w`; indentation composes across nested template
     calls (a template that calls another inside an indented line indents the callee's whole block);
   - the origin triple, one test per row of the §B.3 table: bare feature read → `identity`; `toUpper` and the
     other character-aligned builtins → their name; sub-range builtins → name and arguments; lossy whole-value
     builtins → name; anything else → `opaque` with the set of reads observed in the hole; literal text → template
     name, offset, line and column;
   - the element id in an origin is the id of the object that owns the feature read, not the receiver of the
     outermost call (mutation below);
   - an absent value in a hole (navigation on null) becomes an error fragment with the hole's template position
     and the exception message, generation continues, and the result reports `hasErrors`; an explicit `null`
     renders `''` in interpolation and in a Text `join` (U10);
   - template records `{name, params, body}` are registered as builtins: a template calls another and itself
     (recursion over a containment tree), and a recursion depth above a fixed bound (state it) yields an error
     fragment, not a stack overflow;
   - `with … do` inside a template is refused with a template error before evaluation (discovery §B.1);
   - codec: round trip; unknown fields ignored; absent key read as no templates; an emptied list written as `[]`,
     never by removing the key; the D-layer save and load keep `genTemplates` intact with the experimental
     setting off (follow the precedent of the tests that keep `runScenarios` or `runWatches` across save and load);
   - end-to-end: on a small state machine fixture (reuse one of the fixtures S3's tests use), a template set that
     generates a JavaScript module from `stc.nodes` and `stc.transitions` produces an exact expected text, and the
     line that names a given transition maps back to that transition's id and feature.
2. **Modules**, all new, under `frontend/src/codegen/engine/`:
   - `text.ts`: the Text value, frozen `{__type:'Text', fragments}`, with fragment kinds literal, model, opaque and
     error, and `renderText(text): {code, map}` where `map` gives, for each output line and column range, the
     fragment and its origin (S5's panel and S4's runtime errors consume it);
   - `indent.ts`: block indentation as a pure function applied at render time;
   - `origin.ts`: the `JjelTextHost` implementation, the `readObserver`, the `evaluateHole` hook and the
     attribution rules of discovery §B.4; feature ids from `idlookup` through a side table keyed by handle
     (`WeakMap`), never by tagging strings;
   - `templates.ts`: template records, their registration as builtins on one evaluation context, the `with`
     refusal (reuse the AST walker of `frontend/src/model/simulation/subsetChecker.ts` by import, do not edit it),
     the recursion bound;
   - `templateCodec.ts`: `genTemplates` encode and decode, `{"v":1, ...}` per U2, and a reader from the metamodel's
     `_state` (no writer that dispatches: S5 writes through the existing `state` setter);
   - `generate.ts`: the one entry point, for example
     `generate(lookup, modelId, templates, entry, args?): {text, code, map, errors}`. It builds the JjEL context
     with `buildEvalContext`, binds `stc` through `stcAccess` with `handleOf` mapping ids to the same handles, sets
     `textHost` and `readObserver`, parses each template with `parseTemplate`, and evaluates the entry template.
     If `buildEvalContext` cannot be imported without React, Redux or the store, stop with `Outcome: question`
     and a `Recommended:` line instead of copying it.
3. **Gates.** `npx tsc --noEmit` (same error set as base), the new tests, `src/jjel`, `src/codegen`,
   `src/model/simulation` and `src/jjscript` suites with the base counts plus the new ones, `npm run build`. Gates
   in the foreground; above a load average of 20, wait and rerun before calling a red real.
4. **Mutation bench** (P11), listed in the commit body: no indent on continuation lines; origin set to the
   receiver id instead of the feature's owner; transformation name dropped; codec removing the key instead of
   writing `[]`; recursion bound removed. Survivors are reported, not repaired silently.
5. **Commits.** One `feat(codegen): …` commit with modules and tests, then the log entry written with the
   `log-entry` skill into `docs/log-inbox/codegen-engine.md` in a docs commit. Stop with `Outcome: done`. No merge.

## DOVE

`frontend/src/codegen/engine/{text,indent,origin,templates,templateCodec,generate}.ts` (new),
`frontend/src/codegen/engine/__tests__/*.test.ts` (new), `docs/log-inbox/codegen-engine.md` (new). Fixtures may be
imported read-only from existing test folders. Six source files exceed rule 19's threshold; this list is the
confirmation.

## NON FARE

- No edit to `frontend/src/jjel/` or `frontend/src/codegen/stcAccess.ts`. If the S1 interface is not enough, stop
  with `Outcome: question` and a `Recommended:` line.
- No UI, no setting, no runner, no target profile: S4 and S5.
- No edit to `buildEvalContext`, `subsetChecker.ts` or any file under `components/`.
- No `DState.languages`, no `DV.tsx`, no `VersionFixer.tsx` (R-GEN-13, critical zone).
- No dependency, no `git add .`, no `git stash`, no push.

## RIFERIMENTI

- Spec §3, §4, §5; R-GEN-4, R-GEN-5, R-GEN-10, R-GEN-12, R-GEN-13; discovery §A, §B, §C, §I.1 (row S2), §I.4.
- S1 and S3 log entries in `docs/log-inbox/codegen-jjel.md` and `docs/log-inbox/codegen-stc.md`.
- `CLAUDE.md` §5, §21; `docs/PROTOCOL.md` P9, P11, P13, P14, P16.
