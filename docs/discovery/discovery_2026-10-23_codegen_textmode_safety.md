# Discovery 2026-10-23: code generation text mode, and the safety of generation

Prompt: P-2026-10-23-2010 (chat C-2026-10-22-1050, front release-3-2). Worktree `~/jjodel-w-cgsafety`, branch
`cg-safety`, base `2ec97ffa7`. Read-only: one temporary probe test was written under `frontend/src/jjel/__tests__/`,
run, and deleted (§3.1); no code change is committed.

## 0. Answer in brief

1. **Text mode is a parse entry, not a wrapper.** A `parseTemplateText` twin of `parseTemplate` (lexer option
   `textBody`: start inside the string at offset 0, `"` is literal, end of input closes, the only escape is `\${`)
   yields an `InterpolatedStringExpr` whose positions are already body coordinates: `templateMarkers` and
   `positionIn` need no mapping. Wrapping the body in quotes would need a hole-aware escaper and an offset table.
   Record field `mode?: 'text' | 'expression'`, written only when present; absent reads expression, so every saved
   template keeps its bytes and its output. New templates default to `text`. Gallery examples stay as they are.
2. **Generate runs synchronously on the main thread** (`CodePanel.tsx:274-292`, again on every template change
   while Output is open, `:295-297`); Run and Check run in a worker terminated at 2000 ms. A recursion bound already
   exists (`MAX_TEMPLATE_DEPTH = 64`, `templates.ts:41`) but it bounds nesting, not fan-out: a template calling itself
   twice per level stays under 64 and makes 2^64 calls. Holes swallow throws (`origin.ts:235-238`), so a limit must
   be **sticky**. Proposed: time 2000 ms and output 1,000,000 characters, checked at every template call and hole;
   only cooperative on the main thread (one builtin step cannot be interrupted). Generate in the worker needs the
   eval context rebuilt there (JjEL functions do not clone): 1.5 to 2 days, not before the freeze.
3. **Reproduced, and worse than reads.** `x.constructor`, `x?.constructor`, `x["constructor"]`, `x.__proto__`,
   `x["__proto__"]`, `x.toString`, `x.__defineGetter__` all yield values; `x.constructor.name` is `null`
   (functions are not readable, `context.ts:67-70`). Native functions are also **invoked**: `xs.map(x.toString)`
   gives `"[object Array]"` (collections call `.call` on any argument, `collections.ts:73`) and
   `"abc".replace("a", x.toString)` gives `"[object Undefined]bc"` (`strings.ts:135`). Method tables resolve
   inherited names (`methods[name]`, `collections.ts:634`). `{__proto__: x}.id` gives `"o1"`. No write and no path
   to `Function` was found: the barrier is the single line that keeps functions out of `isJjelObject`.
   Guard, both forms: `__proto__` and inherited `Object.prototype` names read as missing on every member path; a
   member read never yields a native function; method tables own-keys only; a literal `__proto__` key is an own key.
   Own attributes named `constructor` or `toString` stay readable. Own-only would break L-proxy values.
4. **Worker**: module worker from a same-origin Vite asset (`runner.ts:40-42`), code imported from a `blob:` URL.
   After shadowing it still reaches `import()` of any URL (same-origin GETs carry cookies), a nested `Worker` (fresh
   scope with `fetch`), `caches` (CacheStorage `add` fetches) and `navigator.storage`. In 3.2: add `Worker`,
   `SharedWorker`, `caches`, `navigator.storage` to the shadow list. `import()` is syntax: only a CSP on the worker
   script's response stops it, and no nginx config in the repo sends any CSP; that is hosting, outside 3.2.
5. **Slices**: S5 text mode, S6 JjEL guard, S7 limits and worker lockdown. Order S5, S6, S7, S3, S4. Floor: text
   mode and the JjEL guard, as proposed, **plus the time budget whenever S3 ships** (live preview without it
   freezes the editor on a runaway template). Cut first: S4, then the worker lockdown, then S3.
6. Six provisional rows R-GEN-25..30 (§6). Nothing awaits Alfonso from the RC-26 list; the push stays his.

## 1. Hypotheses under test

- H1: a text body can reuse the interpolated-string machinery with no position mapping. **Holds** if the lexer can
  start inside the string; it can (`lexer.ts:367-423` is self-contained, keyed on `this.start`).
- H2: generation has no bound but recursion depth. **Holds**, and depth is not a cost bound (§2).
- H3: the prototype reads are read-only. **Falsified in part**: natives are callable through two sinks (§3).
- H4: a CSP can be enforced from the Vite build alone. **Falsified**: a URL-loaded worker takes its CSP from its own
  response headers; a `<meta>` in `index.html` does not reach it (§4).

## 2. Text mode (COSA 1)

### 2.1 What exists

- `parseTemplate` (`jjel/parser/parser.ts:1060-1077`) lexes with `{ interpolation: true }` and parses strictly.
- The interpolated string lexer (`jjel/lexer/lexer.ts:367-423`): escapes `\n \t \r \" \\ \$` (`:381-391`), holes
  skipped by `skipHole` (`:431-454`), which already skips nested strings and `--` comments; each hole re-lexed and
  re-parsed by the parser with its positions shifted to the template's (`parser.ts:901-941`).
- The engine parses each record at `templates.ts:103` and reports parse errors with `positionIn(body, …)`
  (`:63-71`); `templateMarkers(body)` calls `parseTemplate` directly (`ui/templateMarkers.ts:38-45`).
- Literal origins: `TemplateSources.register` (`engine/origin.ts:73-94`) and `literalSpans` (`:134-155`), which
  re-lexes the string's source slice and assumes the first text token starts at an opening quote:
  `let at = start + tok.start + (i === 0 ? 1 : 0);` (`:145`).
- Block indentation: `interpolate` (`origin.ts:247-261`) computes hole prefixes from the text parts
  (`holePrefixes`); it does not care where the parts came from.
- New templates: `{ name, params: [], body: '""' }` at `ui/CodePanel.tsx:269` and `ui/TemplateEditorTab.tsx:188`.
- Codec: `encodeTemplates` writes `name, params, body, target?` (`engine/templateCodec.ts:52`); decode ignores
  unknown fields (`:73-85`), so a 3.1 build reads a text-mode record as an expression (forward only; noted).

### 2.2 Specification

- **Record.** `TemplateRecord.mode?: 'text' | 'expression'` (optional property, CLAUDE.md rule 11). Encoder writes
  `mode` after `body` and before `target`, only when the record has one (the `target` precedent), so a stored
  string without it re-encodes byte-identical. Decoder: a `mode` that is not one of the two strings is a defect of
  that template, the others decode. Absent means `expression`.
- **Parse path.** `parseTemplateText(source)` in `parser.ts`, exported from `jjel/index.ts`; lexer option
  `textBody` (implies `interpolation`), off by default, inert when unused (the R-GEN-10 discipline). The lexer runs
  `interpolatedString` from offset 0 with no opening quote; `"` and `'` are text; end of input emits the final
  `STRING`. The result is always an `InterpolatedStringExpr` (no holes: one text part; empty body: no part, an empty
  Text), never a `Literal`, so literal origins are uniform.
- **Escaping.** In text mode a backslash is literal (generated C, JS, SQL and regexes are full of them) except in
  `\${`, which writes `${`. To write a backslash right before a hole: `${"\\"}${x}`. Inside a hole, JjEL rules are
  unchanged (strings, escapes, nested `"…${…}…"`).
- **Newlines and indentation.** Newlines are text; no leading or trailing trim (the output is what was typed). The
  block indentation of R-GEN-4 applies unchanged.
- **Positions.** Tokens are in body coordinates, so `positionIn` and `templateMarkers` need no mapping.
  `literalSpans` needs one change: for the root of a text body, lex with `textBody` and drop the `+1`. One engine
  helper `parseTemplateBody(record)` (in `templates.ts`) dispatches on `mode` for both `registerTemplates` and
  `templateMarkers(body, mode)`, so the markers and the engine cannot disagree.
- **Monaco.** A second language id, `jjel-template-text`, sharing the `hole`, `braces`, `dstring`, `sstring` states
  of `templateLanguage.ts:31-72`; its root is a `text` state: `[^\\$]+` text, `\\\$\{` escape, `\$\{` pushes `@hole`,
  lone `\` and `$` text. `--` is text there. The tab's model (`TemplateEditorTab.tsx:241`) switches with
  `monaco.editor.setModelLanguage` on selection and on toggle. The panel's `TemplateEditor.tsx` is a textarea: it
  needs the toggle only.
- **Toggle.** «Text | Expression» next to the parameters, in the tab and in the panel. It is a draft edit (dirty),
  written by Save in one undo step (R-GEN-22): `DraftEdit` gains `mode`, `sameRecord` compares it
  (`ui/templateDrafts.ts:32-45`).
  - expression to text: only when `parseTemplate` gives a root `InterpolatedString` or string `Literal` whose
    location spans the whole trimmed body. Text parts re-emitted with `${` written `\${`; holes copied verbatim from
    the source slice. Refused, with a one-line reason and the mode unchanged, when the body is not one literal
    (`main + "x"`, `if … then "…"`: 3 of 13 templates of each example), when a comment sits outside the literal, or
    when a text part ends in `\` before a hole.
  - text to expression: always; text parts escaped for `"`, `\` and `$` before `{`; wrapped in quotes.
- **Gallery examples.** Keep as they are (no `mode`, read as expression). Converting them changes two example
  files pinned by `examples/__tests__/importable.test.ts` and `oracle/__tests__/examples.test.ts`, and buys
  nothing a user cannot do with the toggle. Counts measured on both JSONs: 13 and 12 templates, the `main` and
  `engine` bodies single literals (1579 to 7129 characters).

### 2.3 Test plan: every saved template generates the same bytes

| Test | Pins | Mutation that kills it |
|------|------|------------------------|
| T1 codec round trip: every stored string with no `mode` (both examples, the codec fixtures) decodes and re-encodes byte-identical | storage | encoder writes `mode: 'expression'` by default |
| T2 golden output: `generate(…, 'main')` on both examples, `code` hashed on the base `2ec97ffa7` before the change and asserted after | output | absence read as `text` |
| T3 `parseTemplateBody({ mode: undefined })` deep-equals `parseTemplate` for every body of the corpus | parse | dispatch on truthiness of `mode` with the default flipped |
| T4 for every convertible body, text form and expression form give identical `code`, and literal origins shifted by the dropped quote | converter | `${` not escaped in the converter |
| T5 text-mode markers: a broken hole at line 3, column 7 of the body marks 3:7 | positions | `+1` kept for a text root in `literalSpans` / lexer column from the quote |

## 3. JjEL prototype reads (COSA 3)

### 3.1 Probe

A temporary `frontend/src/jjel/__tests__/_tmp_probe_proto.test.ts` (written, run with
`node scripts/run-quiet.mjs probe-proto -- npx vitest run …`, exit 0, deleted; `git status` clean after) evaluated
expressions over `x = { __type: 'Object', id: 'o1', name: 'A' }`, `xs = [x]`:

| Expression | Result |
|------------|--------|
| `x.constructor`, `x?.constructor`, `x["constructor"]`, `x.__proto__.constructor` | native function `Object` |
| `x.__proto__`, `x["__proto__"]` | `Object.prototype` |
| `x.toString`, `x.hasOwnProperty`, `x.__defineGetter__` | native functions |
| `x.constructor()`, `x.toString()` | the native function itself (zero-argument dual form, `evaluator.ts:875-878`) |
| `x.constructor.name`, `x.constructor["name"]`, `"a".constructor`, `x.__proto__["__proto__"]` | `null` |
| `xs.constructor` | throws (collection property message) |
| `xs.map(x.toString).first` | `"[object Array]"`: native called with `this = [item]` |
| `"abc".replace("a", x.toString)` | `"[object Undefined]bc"`: native called by `String.prototype.replace` |
| `xs.map(x.__defineGetter__)` | throws `Object.prototype.__defineGetter__: Expecting function` |
| `{__proto__: x}.id` | `"o1"`: the literal set its own prototype |
| template `"${x.constructor} ${x.__proto__}"` | `"function Object() { [native code] } {}"` |

### 3.2 Every path that resolves a member

- Dot and `?.`: `evaluateMemberAccess` / `evaluateNullSafeMemberAccess` (`evaluator.ts:452-473`) into
  `getProperty` (`:475`), whose object branch reads `if (property in obj) { const value = obj[property] ?? null;`
  (`:596-597`). Interpolation holes are ordinary expressions and reach the same paths.
- Index: `evaluateIndexAccess`, `return (obj as any)[String(index)] ?? null;` (`:1074`).
- Method call, object branch: `const methodValue = obj[method];` (`:867`), dual form `:875-878`.
- Method tables: `return methods[name];` in `collections.ts:634`, `strings.ts:345`, `numbers.ts:309`,
  `dates.ts:477`: `xs.constructor(…)`, `"s".toString()` resolve to `Object` natives.
- Not affected: `with … do` copies `Object.entries` (own, `:1054`); identifiers resolve through `Map` scopes
  (`context.ts:392-408`); `className` has its own pedagogical branch (`:481-490`).
- Sinks that call a native: the non-lambda branch of collection methods (`evaluator.ts:828` into
  `transformer.call([item], ctx)`, `collections.ts:73` and siblings) and `replace` (`strings.ts:134-135`).

### 3.3 Guard

Both forms, in `evaluator.ts` and the four builtin tables:

- G1: a name is blocked when `name === '__proto__'`, or when `name in Object.prototype` and it is not an own
  property of the receiver. Blocked reads behave as a missing property (`null`, and the `property-not-found`
  diagnostic when a channel is on). Applied in `getProperty`, `evaluateIndexAccess` and the object branch of
  `callMethod`. Own attributes named `constructor`, `toString`, `valueOf` keep working.
- G2: a member read never yields a value of `typeof 'function'` (it reads `null`). That closes the source of every
  native, so the two sinks need no guard of their own; `wrapSelectedElement` already drops function values
  (`jjscript/executor/commands/eval.ts:938`), so plain contexts lose nothing.
- G3: the four method tables answer own keys only (`Object.hasOwn(methods, name)`).
- G4: an object literal defines its keys as own data properties (`Object.defineProperty`), so `__proto__` is a key.

Why not own-only: values with `__isProxy` (`evaluator.ts:553`) and class instances expose features through traps and
prototype getters; own-only would hide them in the Console, Jodie and JjTL contexts. Why not a fixed deny list
alone: membership in `Object.prototype` covers the twelve names and any future one.

**Impact.** The evaluator is shared by validation (`model/validation/validationEvaluator.ts`), the simulator
(`guardEvaluator`, `actionEvaluator`, `derivedEvaluator`, `boardOutputs`, `stcChecks`), JjTL, JjScript, the Console
and Jodie (16 files construct or call it). Only expressions reading an inherited `Object.prototype` name or a native
function change, and today they yield a native function or its source text: no meaningful program depends on it.
Gate: the whole vitest suite, not `src/codegen` only. Tests: a new `jjel/__tests__/memberGuard.test.ts` with the
rows of §3.1 as expectations, plus an own `constructor` attribute that stays readable; mutation bench dropping G1
in each of the three paths, G2, and G3 in one table.

## 4. Limits and the worker (COSA 2 and 4)

### 4.1 Where generation runs

- Generate: `setResult(generate(globals, lookup, targetId, templates, entryName));` (`CodePanel.tsx:286`), sync,
  main thread; re-run by an effect on `[tab, runGenerate]` (`:295-297`), so on every template list change. Check
  generates on the main thread too (`oracle/oracle.ts:344`).
- Run and Check: `runInWorker` (`CodePanel.tsx:311`, `oracle.ts:298`), one worker per run, terminated at
  `DEFAULT_TIMEOUT_MS = 2000` (`runner/protocol.ts:18`) or at start-up `30000` (`:26`).

### 4.2 Limits

- Depth: kept at 64 (`templates.ts:41`, check at `:128-130`).
- **Sticky budget.** A `GenerationBudget` created in `generate.ts`, passed to `registerTemplates` and the
  `OriginHost`. Once tripped, every checkpoint throws at once, so the `catch` of each hole (`origin.ts:237`) cannot
  let evaluation go on; `generate` then reports one error and returns empty `code`. `hasErrors` already disables
  Run and Check (`CodePanel.tsx:301-302`).
- Time: 2000 ms of `performance.now()`, the Run default; checkpoints at each template call (`templates.ts:124`) and
  each hole (`origin.ts:230`); clock injectable for tests. Error at the call or hole that tripped it:
  «Generation stopped after 2000 ms: template 'x' was still running».
- Output: 1,000,000 characters. A Text carries its length, summed in `makeText` (`text.ts:89-93`; the same order
  as the `flatMap` of `concatTexts`), checked in `interpolate`, `concat`, `join` and after each call. Error:
  «Generation stopped: the output passed 1,000,000 characters».
- **Enforceability.** Cooperative only. A step with no hole and no call (a `forall` nested three deep over the
  instances, `sortBy`, `"x".repeat(n)`) runs to its end; it is bounded by the model size, and `repeat` by the
  engine's string limit (a `RangeError` the hole catches). A checkpoint on every node would need an optional
  evaluator hook (the `readObserver` precedent of R-GEN-10); not proposed for 3.2.
- **Generate in the worker.** The globals of `buildEvalContext` hold JjEL functions (`createFunction` closures,
  `generate.ts:52-53`) and shared class objects: `structuredClone` refuses functions, so the worker would rebuild
  the context from a cloned idlookup, importing `jjscript` and the `joiner` barrel (the import chain that fails with
  `window is not defined` in the node bench, CLAUDE.md §17) into a second worker chunk, and send back code and
  map. Estimate 1.5 to 2 days plus the lazy-bundle gate: after 3.2.

### 4.3 The worker today

- Created as `new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' })` (`runner.ts:41`): a
  same-origin asset emitted by Vite; the code is imported from a `blob:` URL (`runner.worker.ts:71-74`).
- Removed before `ready`: `fetch, XMLHttpRequest, WebSocket, EventSource, importScripts, WebTransport,
  BroadcastChannel, indexedDB` (`:28-30`) and `postMessage` (`:145`), from the scope and its prototype chain.
- No DOM, no parent globals, no store: the only data inside is the generated code and the call arguments.
- Still reachable (by the platform's API surface; not measured here, no browser in this lane): `import()` of any
  URL (the file's own comment, `:14-18`), a nested `Worker`, `SharedWorker`, `caches`, `navigator.storage`.
- In 3.2, in `runner.worker.ts` only: add `Worker`, `SharedWorker`, `caches` to the list and shadow `storage` on
  the navigator's prototype; the existing «cannot remove, nothing runs» rule covers a failure.
- CSP: a worker loaded from a URL is governed by the CSP of its own script response; a `<meta>` in `index.html`
  does not apply, and Vite's `server.headers` / `preview.headers` are global (a `connect-src 'none'` there breaks
  the app). The header belongs on the hosting route of `assets/runner.worker-*.js`:
  `default-src 'none'; script-src 'self' blob:; worker-src 'none'` (`script-src` also governs `import()`; whether
  `'self'` can be dropped depends on the worker chunk's own imports, to be read on the built output).
  `nginx-standalone.conf:13-15`, `nginx-microservices.conf:67-70` and `frontend/default.conf` send no CSP at all;
  the release hosting of 3.2 is not in this tree. Outside 3.2: a ticket.

## 5. Slices (COSA 5)

Gates for each: `node scripts/run-quiet.mjs tc -- npm run typecheck`, `… build -- npm run build`,
`… test -- npx vitest run src/codegen` (S6: the whole suite), `npm run check:codegen-lazy` in both modes.

| Slice | When | DOVE | Probes | Visual check |
|-------|------|------|--------|--------------|
| **S5 Text mode** | Sat | `jjel/lexer/lexer.ts`, `jjel/parser/parser.ts`, `jjel/index.ts`, `jjel/__tests__/templateText.test.ts` (new); `codegen/engine/templates.ts`, `templateCodec.ts`, `origin.ts`; `codegen/ui/templateMarkers.ts`, `templateLanguage.ts`, `templateDrafts.ts`, `TemplateEditorTab.tsx`, `TemplateEditor.tsx`, `CodePanel.tsx`, `templateMode.ts` (new, the converter) + tests. Above five files: the prompt lists them (rule 19) | T1 to T5 (§2.3) | A new template opens in text mode; an SQL body with `"quoted"` identifiers and `${c.name}` generates; toggling turnstile `main` to text and back leaves Output identical; a broken hole is marked at its line |
| **S6 JjEL member guard** | Sun morning | `jjel/evaluator/evaluator.ts`, `builtins/collections.ts`, `strings.ts`, `numbers.ts`, `dates.ts`, `jjel/__tests__/memberGuard.test.ts` (new) | §3.3 rows; mutation bench per path | Turnstile: Generate, Run, Check unchanged; a validation rule and a simulator guard of the MODELS demo unchanged |
| **S7 Limits and worker lockdown** | Sun afternoon | `codegen/engine/generate.ts`, `templates.ts`, `origin.ts`, `text.ts`, `codegen/runner/runner.worker.ts` + tests | fan-out template (two self-calls per level) stops with one error under an injected clock; output cap trips at the bound; a nested `Worker` name is gone | A runaway template shows one error and the panel stays responsive |

Joint order: S5 (Sat), S6 (Sun morning; disjoint from S5's files, can run as a parallel lane), S7 (Sun afternoon),
S3 live preview (Sun evening to Mon morning: after S7, because it generates on every pause), S4 completion (Mon;
in text mode it offers only inside a hole), buffer Monday afternoon. S3 and S5 both edit `TemplateEditorTab.tsx`:
serial, never parallel.

Cut order if time runs short: (1) S4 completion; (2) the worker lockdown half of S7; (3) S3 live preview; (4) the
converter of S5 (mode, default and parse path stay); (5) the output cap. The time budget goes only with S3.

Floor for 3.2: text mode and the JjEL guard, agreed; plus the time budget if S3 ships.

## 6. Decisions

### Decisions taken (unattended)

Provisional rows, in this report only, marker `provisional, unattended` (RC-25):

- **R-GEN-25.** A template record has `mode?: 'text' | 'expression'`, absent read as `expression`; the codec writes
  it after `body` only when present. Templates created in the panel and in the Template Editor are `text`. The
  gallery examples keep their expression bodies.
- **R-GEN-26.** Text bodies parse through `parseTemplateText`, a lexer option `textBody` off by default: `"` is
  text, the only escape is `\${`, no trim, positions in body coordinates; one engine helper dispatches on `mode`
  for the engine and the markers. Monaco gets a `jjel-template-text` language sharing the hole states.
- **R-GEN-27.** The mode toggle converts: expression to text only when one string literal spans the body, text to
  expression always; a draft edit saved in one undo step.
- **R-GEN-28.** Generation limits: depth 64 kept; a sticky budget of 2000 ms and 1,000,000 output characters,
  checked at template calls and holes; when it trips, one error and no code. Generate stays on the main thread in
  3.2.
- **R-GEN-29.** JjEL member guard for every consumer of the evaluator: `__proto__` and inherited
  `Object.prototype` names read as missing on dot, `?.`, index and method paths; a member read never yields a
  native function; builtin method tables answer own keys only; object literal keys are own data properties.
- **R-GEN-30.** The runner worker also removes `Worker`, `SharedWorker`, `caches` and `navigator.storage`; a CSP
  on the worker's script response is a hosting matter, outside 3.2, filed as a ticket.

The probe file under `frontend/src/jjel/__tests__/` was written and deleted within the lane (DOVE allows the report
only): recorded here, nothing of it is committed.

### Decisions awaiting Alfonso

None from the RC-26 list: no critical-zone file (`jjel/` and `codegen/` are not in CLAUDE.md §3.1), no exported
interface broken (`mode` is optional), no ratified row amended, no deletion, no change to what the MODELS demo
shows (examples unchanged; R-GEN-29 changes only reads of inherited prototype names). R-GEN-29 is a change to the
shared evaluator (CLAUDE.md rule 5): the S6 prompt naming `jjel/evaluator/` in its DOVE is the approval. The
push stays his.

## 7. Files read

`frontend/src/codegen/engine/generate.ts`, `templates.ts`, `templateCodec.ts`, `text.ts`, `origin.ts` (60-160,
225-295); `frontend/src/codegen/runner/runner.ts`, `runner.worker.ts`, `protocol.ts` (constants);
`frontend/src/codegen/ui/templateLanguage.ts`, `templateMarkers.ts`, `templateDrafts.ts` (20-45),
`TemplateEditor.tsx` (1-30), `CodePanel.tsx` (270-320, greps), `TemplateEditorTab.tsx` (greps);
`frontend/src/codegen/examples/*/*.json` (the `genTemplates` key, by script); `frontend/src/jjel/lexer/lexer.ts`
(200-490); `frontend/src/jjel/parser/parser.ts` (865-955, 1040-1099); `frontend/src/jjel/evaluator/evaluator.ts`
(205-305, 450-650, 750-900, 985-1125); `frontend/src/jjel/evaluator/context.ts` (55-80, 330-412);
`frontend/src/jjel/evaluator/builtins/*.ts` (greps); `frontend/src/jjscript/executor/commands/eval.ts` (905-964);
`nginx-standalone.conf`, `nginx-microservices.conf`, `frontend/default.conf` (greps for headers);
`docs/discovery/discovery_2026-10-23_codegen_authoring.md` (§4 to §7).

Absence claims: «no CSP» rests on `command grep -n "add_header\|Content-Security"` over the three nginx files, whose
other `add_header` lines it found (control), and on `command grep -n "http-equiv" frontend/index.html` (empty, exit
status not recorded: weaker). «No path to `Function`» rests on the probe rows of §3.1 and the reading of
`isJjelObject`; it is not a proof over every context value a consumer may bind.
