# Discovery: model-to-text code generation, the pilot

- **Prompt-ID**: P-2026-10-10-0815 (`docs/prompts/claude_2026-10-10_0815_prompt_codegen_pilot_discovery.md`)
- **Chat**: C-2026-10-10-0046
- **Session**: 1cd480b8-8a63-497d-bb7e-d797e481b328
- **Tree**: `~/jjodel-w-codegen`, branch `codegen-pilot`, HEAD `4dd5f0ee4` (the commit that adds the prompt; checked at start, tree clean)
- **Executor**: Anthropic Claude Opus 5.5
- **Phase**: 1, read-only. No source, test, spec, `docs/decisions.md` or `CLAUDE.md` was edited.

This report is a set of hypotheses with evidence, not a definitive reference: whoever uses it downstream re-reads the real files (P4).

**Method.** Four read-only sub-agents of this session searched sections A-B, C-D, E-F and G-H in parallel; the writer then re-read and re-quoted every line that carries a conclusion below (all quotes in §A-§H were re-run by the writer on HEAD `4dd5f0ee4` except where marked *agent*). Claims are tagged **read** (quoted from source or docs) or **measured** (a run in this phase). The only measurements are the A-section probes run by the A-B sub-agent: it bundled `frontend/src/jjel` with `esbuild` to stdout and piped the bundle to `node`, no file written; the writer did not re-run them, so they are tagged *measured (agent)*. Every claim of absence names its search and a positive control from the same invocation; searches use `command grep` (BSD), because the interactive `grep` is the ugrep wrapper (CLAUDE.md §5).

## 0. Answer in brief

1. **The hypothesis survives on the critical zone and the model layer, and is reshaped on three of its five points.** No Phase 2 slice touches a §3.1 file or `LModel`/`DObject` (§I.3). (1) holds in a stronger form than expected: the AST node and the evaluator case for interpolation already exist, only the lexer and parser are unfinished. (2) is reshaped: origin cannot be recorded by instrumenting reads alone, because every string operation returns a bare JS string; it needs a small, opt-in Text hook in the evaluator as well. (3) is reshaped: simulator configuration is not in `jjodel/*` annotations, it is in the D-layer `_state` bag of the model, and templates should go there too. (4) holds with a caveat (two helpers sit in a React-tainted file and must be rebuilt from core parts). (5) is reshaped: the generator can be a lazy chunk, but the JjEL extension is eager by nature, so it must be inert unless the generator calls it.
2. **The spec's premise «Jjodel has no model-to-text generator today» is false.** A legacy M2T subsystem exists: `DState.languages`, with engines `javascript` (`eval`), `handlebars`, `eta`, `nearley`, `ohm`, run by `doM2T` (`frontend/src/components/forEndUser/MTM.tsx:230`), seeded by `DV.defaultLanguages()` (`frontend/src/common/DV.tsx:51`), migrated by VersionFixer, eager through the joiner barrel, its «Languages» editor tab orphaned since 2026-07-29 (`Dock.tsx:309`). `frontend/src/jjel/SPEC.md:37` still says «M2T is handled separately by the existing Handlebars-based template engine». The pilot should not build on it (eager, `eval` on the main thread, no origin, seeded and migrated by two critical-zone files) and should not delete it (§H.1).
3. **Recommendation, in one line per area.**
   - Templates: records `{name, params, body}`, where the body is a JjEL interpolated string, each registered as a JjEL builtin (the JjTL helper precedent). No `def` syntax, no new language.
   - JjEL: an `interpolation` lexer option that is off by default (mirroring `actionMode`), a `parseTemplate` entry point, and two optional context fields inherited by children (mirroring `stateAccess`): `textHost` for Text values and `readObserver` for origins. With the fields absent, every existing path is byte-identical.
   - Persistence: one JSON key `genTemplates` in the metamodel's `_state`, written through the existing `state` setter, with no migration. It is lost in the `.ecore` round trip exactly like the STC roles already are.
   - Setting: a localStorage key plus a reader hook, toggled in Settings → Advanced; `React.lazy` mounts the panel.
   - Runner: a module Worker created inside the lazy chunk, one worker per run, terminated on timeout, with the network globals shadowed.
   - Lazy proof: a gate script over `vite build --manifest`.
4. **Plan**: six slices over the three weeks, of which three run in parallel in week 1 (§I.1). The oracle needs a per-step state comparison, not `expect`: `expect` is a single final predicate (§G.1).

**Decisions awaiting Alfonso** (RC-26 list items only, details in §I.6):
- A1. The JjEL extension of §A.7, which R-GEN-4 says is «ratified on its own». Recommended: ratify it as specified (opt-in lexer option, plus `textHost` and `readObserver` context hooks).
- A2. Amend R-GEN-8's «under the scenario's `expect`»: `expect` is a final boolean predicate, not a trace equality. Recommended: compare the per-step kind and a projection of σ, with `expect` checked as it is today.

**Questions** (each with its recommendation; the chat may adopt them under RC-21):
- Q1. Templates per metamodel in `_state` (not a project resource). Recommended: yes, `genTemplates` on the M2.
- Q2. The legacy `DState.languages` M2T coexists untouched. Recommended: yes, leave it, and add one sentence to `jjel/SPEC.md:37` in the docs commit of slice S1.
- Q3. Origin navigation to a transition drawn as an edge needs an edge-select path that `SELECT_NODE` lacks. Recommended: the pilot selects the source node and outlines the edge, with an edge event as a follow-up.

## 1. The hypothesis under test, and the verdicts

The chat's working hypothesis, quoted from the prompt: «The pilot needs no change in the critical zone and no change to the model layer. (1) … (5) …». Verdicts, with the evidence section:

| # | Point | Verdict | Evidence |
|---|---|---|---|
| 0 | No change in the critical zone, none to the model layer | **Holds**, provided the pilot does not reuse `DState.languages` (seeded in `DV.tsx`, migrated in `VersionFixer.tsx`, both in §3.1) | §H.1, §I.3 |
| 1 | JjEL hosts templates with a small additive extension | **Holds**, stronger: the AST node `InterpolatedStringExpr` and the evaluator case already exist; the lexer and parser are unfinished. Named functions need no syntax (builtin registry). | §A.2, §A.3, §A.7 |
| 2 | Origin by instrumenting feature reads, no `LModel`/`DObject` change | **Reshaped**. No `LModel`/`DObject` change: ids come from the handles `buildEvalContext` builds, feature ids from `idlookup`. But reads alone are not enough: origin dies at `+`, `join`, interpolation and every string builtin, so the evaluator needs an opt-in Text hook beside the read observer. | §B |
| 3 | Templates persist next to `sim*`, `simProfile`, `runScenarios`, `runWatches` | **Reshaped**: those keys are not annotations, they live in the model's D-layer `_state` bag. Unknown keys survive save and load verbatim, and no migration is needed. The `.ecore` export drops `_state` entirely. | §C |
| 4 | STC binding reachable as pure data outside React | **Holds with a caveat**: `netStcFromRoles`, `isKindOf` and `objectSlots` are pure core; `runBag`, `storedProfile` and `collectModelObjectIds` sit under `components/`, and `simBridge.ts` imports React through `simRunState.ts`. Rebuild them in a few lines from core parts. | §D |
| 5 | Lazy chunk keeps the bundle with the setting off equivalent to a build without the generator | **Reshaped**: true for the generator modules; the JjEL extension and the setting reader are eager by construction, so the invariant becomes «eager code changed only by inert, opt-in additions, byte-identical behaviour when off», proved by a manifest gate. | §E |

## 2. Objective

Establish, before any code, whether the pilot ratified as R-GEN-1..9 (`docs/spec/claude_spec_2026-10-10_code_generation_pilot.md`) can be built on the existing JjEL evaluator, persistence, STC roles, settings and build pipeline within three weeks without entering the critical zone; produce the Phase 2 slice plan; list the decisions taken and the ones that wait for Alfonso (RC-26).

## 3. Files read (full paths from the repo root)

Docs: `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md`; `docs/decisions.md` (R-GEN-1..9 at :5744-5784, RC-20..28 at :140-215, R-E/E-1 at :20, R-SIM-137..142 at :2675-2684, R-VAL-7/8 at :5403-5416); `docs/PROTOCOL.md` (P1-P6, P10-P13, P16); `docs/claude-code-log.md` (head); `docs/spec/claude_spec_2026-09-08_user_defined_validation.md` §5; `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` §5, §12; `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md` (*agent*); `docs/spec/claude_spec_2026-09-13_computational_model.md` §5.4, §8; `docs/spec/concern_languages.md` (*agent*); `frontend/src/jjel/SPEC.md`; `frontend/src/jjel/CLAUDE.md`; `frontend/src/model/CLAUDE.md`; `frontend/src/components/editor-v2/CLAUDE.md`; `frontend/src/services/export/CLAUDE.md` (*agent*).

Source, JjEL: `frontend/src/jjel/lexer/lexer.ts`, `frontend/src/jjel/parser/parser.ts`, `frontend/src/jjel/types/ast.ts`, `frontend/src/jjel/types/tokens.ts`, `frontend/src/jjel/evaluator/evaluator.ts`, `frontend/src/jjel/evaluator/context.ts`, `frontend/src/jjel/evaluator/modelContext.ts`, `frontend/src/jjel/evaluator/builtins/{strings,collections}.ts`, `frontend/src/jjel/index.ts`, `frontend/src/jjel/stateReserved.ts`, `frontend/src/jjscript/executor/commands/eval.ts`, `frontend/src/jjtl/executor/executor.ts` (helpers).

Source, simulation and persistence: `frontend/src/model/simulation/{scenarioCodec,watchCodec,netCompile,netStep,netTypes,isKindOf,objectSlots,guardContext,subsetChecker,types}.ts`, `frontend/src/components/editor-v2/sim/{simBridge,simRunState,simScenarios,simRoleStatus,SimulationPanel}.ts(x)`, `frontend/src/joiner/classes.ts` (`DPointerTargetable._state`, `set_state`, `DProject.transformations`, `Language`), `frontend/src/components/topbar/SaveManager.ts`, `frontend/src/common/U.tsx` (save serialisation), `frontend/src/services/export/EcoreService.ts`, `frontend/src/api/data.ts` (annotation import), `frontend/src/components/editor-v2/nodes/rowViewAnnotations.ts`, `frontend/src/redux/store.tsx`, `frontend/src/redux/VersionFixer.tsx` (languages steps, read only).

Source, legacy M2T: `frontend/src/components/forEndUser/MTM.tsx`, `frontend/src/components/editors/MTM.tsx` (*agent* grep), `frontend/src/common/DV.tsx` (`defaultLanguages`), `frontend/src/components/abstract/Dock.tsx`, `frontend/src/joiner/index.ts`, `frontend/src/joiner/components.tsx`.

Source, settings, build, workers: `frontend/src/components/settings/UnifiedSettingsModal/UnifiedSettingsModal.tsx`, `frontend/src/pages/settings/AdvancedSettings.tsx`, `frontend/src/hooks/useInterfaceMode.ts`, `frontend/src/components/Toast/toastTypes.ts`, `frontend/vite.config.ts`, `frontend/vitest.config.ts`, `frontend/package.json`, `frontend/src/index.tsx`, `nginx-standalone.conf`, `nginx-microservices.conf`, `Dockerfile` (*agent*), `frontend/src/components/editor-v2/EditorV2.tsx` (mount and `SELECT_NODE`), `frontend/src/components/editor-v2/problems/ValidationResultsModal.tsx`, `frontend/src/components/editor-v2/hooks/useJjomSelection.ts`, `frontend/src/events/registry.ts`.

---

## A. JjEL as a template host

### A.1 Pipeline (read, *agent* line counts)

8122 lines under `frontend/src/jjel`: lexer `lexer/lexer.ts` (531), parser `parser/parser.ts` (968, recursive descent), AST `types/ast.ts` (408, 22 node kinds), evaluator `evaluator/evaluator.ts` (1157), context `evaluator/context.ts` (465). Entry points: `parseExpression`, `parseExpressionStrict`, `parseAction` (`parser/parser.ts:905`, `:929`, `:951`); `JjelEvaluator` at `evaluator/evaluator.ts:74`, whose `evaluate` switches on `expr.type` (`:153-200`). Every evaluator method is `private` (`evaluator.ts:75` `private context: EvaluationContext;`, `:276` `private evaluateBinary`, `:1027` `private evaluateInterpolatedString`, `:1097` `private stringify`): a subclass cannot override them, so a Text-aware evaluator is either an edit in the class or a hook the class consults.

### A.2 Interpolation exists half-built (read; *measured (agent)*)

- Lexer, double-quoted strings, `lexer/lexer.ts:242` `private string(): void {`, `:244` `const parts: { type: 'text' | 'interpolation'; value: string }[] = [];` (never pushed to), `:273` `} else if (c === '$' && this.peekNext() === '{') {`, `:313` `this.addTokenWithValue(JjelTokenType.IDENTIFIER, exprValue); // Placeholder`, `:332` `if (parts.length === 0) {` (always true). Strings may span lines (`:250-251` `if (c === '\n') {` / `// Strings can span multiple lines`).
- Parser: imports the node types (`parser/parser.ts:43-44` `InterpolatedStringExpr,` / `InterpolatedStringPart,`) and never builds them; `primary()` matches only `STRING` (`:492` `if (this.match(JjelTokenType.STRING)) {`).
- Evaluator: already wired, `evaluator.ts:182-183` `case 'InterpolatedString':` / `return this.evaluateInterpolatedString(expr, evalCtx);`; `:1027-1040` evaluates each part and pushes `this.stringify(value)`; `stringify` (`:1097-1105`) maps `null` to `''` and arrays to `.join(', ')` (`:1101`).
- Spec: `frontend/src/jjel/SPEC.md:658` «The lexer detects `${}` syntax but the implementation is incomplete. The parser never produces `InterpolatedStringExpr` nodes.», `:662` «**Status:** Deferred.»
- *Measured (agent)*: `"Hello ${name}!"` lexes to `STRING_PART DOLLAR_LBRACE IDENTIFIER RBRACE STRING` with wrong offsets and the parser fails with `Expected expression`; backticks fail with `Unexpected character`; single-quoted strings never interpolate (`lexer.ts:340-341` «Parse a single-quoted string literal (no interpolation)»).
- Consequence: **every expression containing `"…${…}…"` fails today**, so finishing interpolation cannot change the meaning of any expression that currently works. It still changes what the console, the guards and the IR accept, which is why §A.7 gates it behind a lexer option.

### A.3 Concatenation, collections, lambdas, named functions (read; *measured (agent)*)

- Concatenation is `+` only: `evaluator.ts:287-288` `if (typeof left === 'string' || typeof right === 'string') {` / `return String(left ?? '') + String(right ?? '');`. *Measured (agent)*: `&` fails to lex; `"ab" * 3` → `"ababab"`.
- `map`: `frontend/src/jjel/evaluator/builtins/collections.ts:48` `return array.map(item => transformer.call([item], ctx));` (values pass through unchanged). `join`: `:388-389` `export function join(array: JjelValue[], separator: string = ''): string {` / `return array.map(v => String(v)).join(separator);`. `collect` does not exist (*measured (agent)* `Unknown method 'collect' for type Array`).
- Lambdas `x => e` and `(a, b) => e` (`parser.ts:541-542`, `:601-602`); there is no `let` (`docs/spec/concern_languages.md:56` «Niente `let` in JjEL standalone.»); `with … do` binds an object's keys (`evaluator.ts:959-960`).
- **Named functions have no syntax, and need none**: a call resolves builtins first, `evaluator.ts:710-711` `const builtin = ctx.getBuiltin(expr.name);` / `if (builtin) return builtin.call(args, ctx);`, and the context exposes `registerBuiltin(name: string, fn: JjelFunction)` (`context.ts:391`). JjTL already hosts user-defined named functions this way: `frontend/src/jjtl/executor/executor.ts:889-890` `this.context.helpers.set(helper.name, helperFn);` / `this.context.evalContext.registerBuiltin(helper.name, helperFn);`. A template is therefore a stored record `{name, params, body}` registered as a builtin, callable from other templates and from itself (recursion).

### A.4 The absent value (read; *measured (agent)*)

- `.` on null throws: `evaluator.ts:387-392` `if (obj === null) {` / `throw new JjelEvaluationError(` / `` `Cannot access property '${expr.property}' of null`, ``. A method on null throws too (`:680-685`, *agent*). `?.` returns null (`:400-401`, *agent*). A missing property returns null: `:522-523` `if (property in obj) {` / `return obj[property] ?? null;`.
- The validation spec builds the tri-state at the boundary: `docs/spec/claude_spec_2026-09-08_user_defined_validation.md:193-196` «JjEL non ha un tri-stato e la navigazione su un assente **lancia** `JjelEvaluationError` … Il tri-stato si costruisce quindi al confine della regola … Il linguaggio non si tocca.»
- Null renders inconsistently across the paths a template uses (*measured (agent)*): `String(null) + "|" + [null].join("") + "|" + (null + "")` → `"null|null|"`, so `join` writes `null` while `+` and interpolation write `''`.
- **What a template should do**: the same as a rule, at its own boundary. A hole whose evaluation throws becomes an *error fragment* (the hole's template position, the exception message, the receiver's origin when known) and generation continues; the code panel lists the errors and «Run» is refused while any exists. A hole whose value is `null` renders `''` (the interpolation semantics already in `stringify`), and the engine's Text `join` renders null items as `''`, not `null`, so the two paths agree inside templates.

### A.5 Reserved names (read; *measured (agent)*)

- `true`, `false`, `null` are keywords: `frontend/src/jjel/types/tokens.ts:116-118` `'true': JjelTokenType.TRUE,` / `'false': JjelTokenType.FALSE,` / `'null': JjelTokenType.NULL,`; the lookup lowercases first, `lexer.ts:427-430` `const textLower = text.toLowerCase();` … `const keywordType = JJEL_KEYWORDS[textLower];` (CLAUDE.md §12.6 cites `:397-400`; the lines have drifted).
- R-VAL-8 («L'elenco dei nomi riservati è unico e importato da entrambi i lexer», `docs/decisions.md:5410`) is **not implemented**: *agent* search `command grep -rn 'JJEL_KEYWORDS' frontend/src/jjtl` exit 1, control `JJTL_KEYWORDS` in `frontend/src/jjtl` exit 0.
- Effect on templates: a feature named like a keyword in any case (`in`, `is`, `do`, `with`, `not`, `that`, `such`, `exists`, `True`) cannot be read with `.` (*measured (agent)* `o.in` → `Expected property name after '.'`); `o["in"]` works. Two consequences: templates need the bracket form for such features (document it in the lecture examples), and the JavaScript identifier policy of R-GEN-6 is a separate table, unrelated to JjEL's keywords.

### A.6 Who sees a change in the grammar (read, *agent* search)

Consumers that import the JjEL parser, evaluator or AST outside `frontend/src/jjel` (*agent*: `command grep -rn … -E "from ['\"][./@a-zA-Z]*jjel(/[a-zA-Z/]*)?['\"]" frontend/src`, exit 0; dynamic `import(...jjel)` exit 1 with control `import\(['\"]` exit 0):

- parser: `jjtl/parser/parser.ts:51` (re-parses JjTL expression text through JjEL at `:739`), `components/editor-v2/viewpoint/ir/pathExpr.ts:21`, `model/simulation/{guardEvaluator,boardOutputs,derivedEvaluator,stateAttributesCodec,actionEvaluator}.ts`, `model/validation/validationEvaluator.ts:97`, `model/conformance/ConformanceValidator.ts:16`;
- evaluator: `jjtl/executor/executor.ts:48`, `jjscript/executor/commands/{eval,let,forall}.ts`, `components/editors/Console.tsx:48`, `components/Jodie/jodieJjelContext.ts:13`, `model/simulation/{guardContext,stcChecks}.ts`;
- AST types: `jjtl/types/ast.ts:8`, `jjtl/executor/astBridge.ts:30`, `model/simulation/subsetChecker.ts:39`, `model/jjelTriState.ts:21`.

With an opt-in lexer option (§A.7) none of them sees a change: they all lex without it. The subset checker already treats the node (`frontend/src/model/simulation/subsetChecker.ts:114` `case 'ArrayLiteral': case 'ObjectLiteral': case 'ForAll': case 'Lambda': case 'InterpolatedString': return true;`, `:197`, `:344`).

### A.7 The smallest additive extension (design, not prototyped)

1. **Lexer option** `interpolation?: boolean` on `JjelLexerOptions`, off by default, the exact precedent of `actionMode` (`lexer.ts:27-31` «`actionMode` lexes `:=` as `ASSIGN`, for `parseAction` (R-SIM-40). Off by default: in an expression `:=` stays an error.» / `export interface JjelLexerOptions {` / `actionMode?: boolean;`). With the option on, `string()` (`:242-337`) emits `STRING_PART`, a balanced hole token carrying the hole's source and its absolute offset, and the final part; the token types already exist (`types/tokens.ts:93-95`, *agent*).
2. **Parser entry** `parseTemplate(source)`, the twin of `parseAction` (`parser.ts:951-952` `export function parseAction(source: string): JjelActionParserResult {` / `const lexer = new JjelLexer(source, { actionMode: true });`): `primary()` gets one branch beside `:492` that builds `InterpolatedStringExpr`, sub-parsing each hole with the same options (nested interpolated strings inside lambdas are the normal case in templates) and shifting locations by the hole's offset. Strict end-of-input as in `parseExpressionStrict` (plain `parse()` drops trailing tokens: `docs/spec/concern_languages.md:102`, *agent*).
3. **Two context fields**, inherited by children like `stateAccess` (`context.ts:274-278` «The state `x.[a]` reads (R-SIM-43). `undefined`: no state here, and `.[a]` throws. Inherited by children, like `diagnostics`.» / `stateAccess?: JjelStateAccess;`, copied at `:356` `child.stateAccess = this.stateAccess;`):
   - `textHost?: JjelTextHost`. When set, `evaluateInterpolatedString` hands the host the literal parts and the evaluated hole values with their expressions and returns what the host builds (a Text). `+` with a Text operand, `join` on an array holding a Text, and `stringify` of a Text also delegate to the host. That is four sites in `evaluator.ts` (`:1027`, `:287`, `:1097`, plus the `join` dispatch) and one in `builtins/collections.ts:388`.
   - `readObserver?: (target, property, value) => void`, called at the member-read sites of §B.1.

   With both fields `undefined`, every path is the current one; no consumer of §A.6 sets them.
4. **Text representation**: a frozen object `{ __type: 'Text', fragments }`. `isJjelObject` (`context.ts:42-43` `return value !== null && typeof value === 'object' && !Array.isArray(value) && !isJjelFunction(value);`) would classify it as a model object. Excluding it there is a one-line change; leaving it costs nothing in the pilot, because templates never navigate into a Text.

The cost estimate for a fully parallel Text type, the alternative rejected here: about 15 sites inside `jjel` and 17 files outside that import `JjelValue` (*agent*, §B.4). The hook form keeps the change to the 5 sites above plus 2 fields.

## B. Origin

### B.1 Where a feature is read (read)

There is no single choke point. Member access reads at `evaluator.ts:522-523` (quoted in §A.4). The method dual form (`self.name()`) reads at `:776` `const methodValue = obj[method];`. Index access reads at `:979` (*agent*). `with … do` copies keys into scope at `:959-960`. State access reads at `:1016` (*agent*), with id and attribute both explicit. Before evaluation, `modelContext.ts:46-54` (*agent*) flattens attributes into scope. For templates, the observer needs `:522` and `:776`. The pilot forbids `with` in templates, through a template-subset check that reuses the walker of `subsetChecker.ts`, so `:959` drops out.

### B.2 Where the ids come from (read)

The JjEL view of a model is built by one function, `buildEvalContext` (`frontend/src/jjscript/executor/commands/eval.ts:122`), described in `frontend/src/model/simulation/guardContext.ts:14-15` as «the one builder of JjEL contexts over a model (validationContext.ts explains why no second copy may exist)».

- Its handles carry the element id: `eval.ts:571` `id: obj.id ?? '',`.
- Their features are plain keys: `:679` `handle[fname] = isMany ? resolved : (resolved.length ? resolved[0] : null);` and `:697` `handle[fname] = collapsed === null ? emptyAttributeDefault(meta) : collapsed;`.
- At fill time both the instance feature and its M2 feature `meta` are in hand (`:646-657`).

So the triple (element id, feature id, transformation) needs no `LModel` or `DObject` change. The generator walks the handles once and builds a side table `WeakMap<handle, Map<featureName, featureId>>` from `idlookup`. Handles are objects, so a WeakMap works. Primitives cannot key a WeakMap, which is why strings cannot be tagged this way. The observer then reports `(handle.id, featureIdOf(handle, property))`.

Two traps, both *agent*:
- A user feature may shadow `name` and `parent` on the handle (`eval.ts:651-652`, `:704`), so the table maps by feature, not by builtin name.
- Enum literals are collapsed to strings (`:628-644`), so their origin is the attribute, not the literal.

### B.3 Where an origin is lost (read)

Values pass through `map`, `filter` and `forall` unchanged (`collections.ts:48`).

Every operation that builds text returns a bare JS string, so origin dies at five places:
- `+` (`evaluator.ts:288`)
- `join` (`collections.ts:389`)
- interpolation through `stringify` (`evaluator.ts:1097`)
- `format` (`strings.ts:294`, *agent*)
- every string builtin

This is the falsifying evidence for point (2). An observer on reads records what was read; it cannot follow the value once a string operation has rebuilt it. The Text hook of §A.7 is what carries origin across composition.

String builtins of `frontend/src/jjel/evaluator/builtins/strings.ts`, grouped for the transformation field of the triple (*agent*, registry at `:305-345`):

| Class | Builtins | Transformation recorded |
|---|---|---|
| Identity | a bare feature read in a hole | `identity` |
| Named, character-aligned | `toUpper`, `toLower`, `capitalize`, `uncapitalize`, `reverse` | the name |
| Named, sub-range | `trim`, `trimStart`, `trimEnd`, `substring`, `slice`, `charAt` | the name and its arguments |
| Named, lossy whole-value | `camelCase`, `pascalCase`, `snakeCase`, `kebabCase`, `padStart`, `padEnd`, `quote` | the name |
| Opaque | `replace`, `replaceAll`, `format`, `repeat`, `*`, any multi-input expression | `opaque`, plus the set of reads observed in the hole |

R-GEN-5 says «the identity, a named invertible function, or opaque». Strictly, only identity is invertible: case changes and trims lose information. For the pilot, the recommendation is to record the name without claiming invertibility. Invertibility belongs to round-trip, which is outside the pilot (R-GEN-9), and the name is enough to decide it later.

### B.4 Attribution rule for a hole (design)

The hole is evaluated with `readObserver` set. Its fragment gets an origin by four rules:
1. **Model origin.** The outermost expression is a member read, or one named builtin applied to a member read. The fragment gets that read's (id, feature) and the builtin's name.
2. **Text value.** The hole's value is a Text, from a template call or from a nested interpolation evaluated under `textHost`. Its fragments are spliced in with their own origins.
3. **Opaque.** Anything else is one opaque fragment carrying the reads the hole performed.
4. **Literal text.** Text outside holes carries (template name, offset, line, column), per R-GEN-5.

Block indentation (spec §4, Xtend semantics) is a pure function at render time. A multi-line Text interpolated at column *n* of its template line gets that line's leading indentation prefixed to every line after the first.

### B.5 No static type checker (read, *agent*)

*Agent* search: `command grep -rn --include='*.ts' -i 'typeCheck\|inferType\|typeInference\|checkTypes' frontend/src/jjel` returned exit 1. Positive control: `class TypeRegistry` at `context.ts:62`, exit 0.

`TypeRegistry` is runtime-only, used by `is`. A Text type therefore needs no checker. Only the builtin catalog (`frontend/src/jjel/metadata/builtins.ts`, *agent*) would gain an entry if template authors are to see Text in autocomplete. Leave that out of the pilot.

## C. Persistence

### C.1 The simulator's configuration is in `_state`, not in annotations (read)

- Every D-object has a `_state` bag: `frontend/src/joiner/classes.ts:1436` `export class DPointerTargetable extends RuntimeAccessibleClass {`, `:1477` `_state: GObject = {};`.
- The L-proxy setter merges a patch, inside one TRANSACTION of `SetFieldAction`s (safe near sync by CLAUDE.md rule 12): `classes.ts:2398-2400` `TRANSACTION(this.get_name(c)+'.state', ()=>{` / `if (Object.keys(newState)) SetFieldAction.new(c.data, "_state", newState, '+=', false);` / `if (Object.keys(removedState)) SetFieldAction.new(c.data, "_state", removedState as any, '-=', false);`.
- Keys in use, all *agent* tables re-checked on the lines quoted here:
  - the role keys `sim*` and `simProfile`, on the M2;
  - `runWatches` and `runScenarios`, on the M1: `frontend/src/model/simulation/scenarioCodec.ts:43` `export const RUN_SCENARIOS_KEY = 'runScenarios';`.
- Two codec conventions any new key must follow:
  - **Not `sim*`.** `watchCodec.ts:13-15` «The key is not a `sim*` key on purpose: `runSignature` folds every `sim*` key of the model bag (simBridge.ts `modelRunBag`), so an edit under such a key would interrupt the run». The fold is at `frontend/src/components/editor-v2/sim/simBridge.ts:701` `for (const key of Object.keys(bag).filter(k => k.startsWith('sim')).sort()) sig += …`.
  - **Emptied, never removed.** `scenarioCodec.ts:25-26` «a stored list emptied is written `[]`, never removed: the undo of a removed bag key does not restore it (R-SIM-99).»
- No migration, by precedent: `scenarioCodec.ts:36-37` «Unknown fields are ignored. No VersionFixer step: a project saved before the key has none.»
- *Agent* search for an annotation-based sim key: `command grep -rnE --include='*.ts' --include='*.tsx' --exclude-dir=__tests__ "['\"\`]jjodel/" frontend/src`, exit 0. All hits are in `editor-v2/nodes/*` (row view) and `viewpoint/ir/*`, none in `sim/` or `model/simulation/`.

### C.2 Multi-line text and size (read)

- **Encoding.** A value is a plain string inside the state JSON. The save serialiser escapes newlines: `frontend/src/common/U.tsx:443` `let str = JSON.stringify(state, proxyToIdReplacer);`. Template bodies therefore survive with their newlines and indentation intact.
- **Size.** No per-key size limit exists; the codecs cap item counts only (`scenarioCodec.ts:46` `export const SCENARIO_MAX_STEPS = 1000;`).
- **Real ceiling.** The storage backend sets it: `localStorage.setItem` without a try (`data/storage.ts:26`, *agent*) offline, the persistence server online (limit unknown).
- **Recommendation.** Cap a template body at 64 KB in the codec and report the cap in the panel. This is a guard, not a measured limit.

### C.3 Unknown keys survive save and load (read)

- **Save** writes the whole `idlookup` (`U.tsx:433-443`, *agent* for the loop).
- **Load** parses it and runs `frontend/src/components/topbar/SaveManager.ts:56` `save = VersionFixer.update(save);`. Neither filters `_state` keys.
- *Agent* search for a filter: `delete …_state` / `_state = {}` across `src`, exit 0. The single hit is a VersionFixer seed of a new primitive class, not a filter.
- *Agent* search for a whitelist: `startsWith('jjodel/')`, exit 1. Positive control `startsWith(ROW_VIEW_ANNOTATION_PREFIX)`, exit 0 (`rowViewAnnotations.ts:114`).

So a project carrying `genTemplates`, opened and saved by a user with the setting off, keeps it byte for byte (R-GEN-3), because nothing reads the key. The Phase 2 test asserts this on a save-load round trip of the D-layer.

### C.4 `.ecore` export and import (read)

**Export.** It drops every `jjodel/*` annotation and the whole `_state` bag:
- `frontend/src/components/editor-v2/nodes/rowViewAnnotations.ts:44-48` «An `.ecore` round trip drops these, and the loss is on the EXPORT … `services/export/EcoreService.ts` emits no `eAnnotations` at all: its `includeAnnotations?: boolean` (`:42`) is declared and never read».
- Re-checked here: `command grep -n "includeAnnotations" frontend/src/services/export/EcoreService.ts` returns the declaration only, `:43` `includeAnnotations?: boolean;`.
- *Agent*: `_state` in `EcoreService.ts` exit 1, positive control `eStructuralFeatures` 4 hits.

**Import.** It reads annotations: `frontend/src/api/data.ts:733` `generated.push(DAnnotation.new(source ? source + '/' + key + '=' + value : key + '=' + value, [], parent.id));`.

**Net.** Templates in `_state` are lost on an `.ecore` round trip exactly as the STC roles are today. Annotations would buy nothing: the loss is on export either way. This enters the pilot's perimeter as a stated limitation. The Jjodel project file keeps them.

### C.5 Alternatives (read)

- **`DProject.transformations`.** A project-level list, written whole: `classes.ts:3101` `transformations: any[] = [];`; `frontend/src/components/project/ProjectEditor.tsx:227` `SetFieldAction.new(project.id, 'transformations', next, '', false);`.
- **FormSpec.** Additive inside a view's IR: «`ir-1.3`, additivo. Nessun bump di `irVersion`, nessuna migrazione, nessun backfill» (`docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md:6`, *agent*).
- **`jjodel/*` annotations.** These are creators (`DAnnotation.new`), one key/value per annotation, with newlines at risk in XML attributes. The XML point is an inference from the XML spec, not measured.

### C.6 Recommendation

One key **`genTemplates`** on the **metamodel's** `_state`, holding `{"v":1,"templates":[{"name","params","body","target"}]}`. The name has 0 hits in `frontend/src` (control `runScenarios`, 10 hits). It is written through the existing `state` setter, emptied as `[]` and never removed, with no VersionFixer step and no `irVersion`.

Reasons:
- **It travels with its STC.** The roles a template reads (R-GEN-7) live in the same bag.
- **It is invisible to runs.** It is not a `sim*` key, so it never interrupts a run.
- **No new write path.** It reuses the simulator's codec pattern.
- **No stale reference.** A project-level list would need a metamodel pointer that goes stale when a metamodel is copied into another project.

The cost: a template written against roles, which R-GEN-7 says applies to every metamodel bound to the STC, reaches a second metamodel by copy in the pilot, not by sharing. A library resource is a post-pilot item.

## D. STC roles

### D.1 The binding as pure data (read)

The chain over raw `idlookup` has four steps:
1. **The bag.** `lookup[mmId]._state`, where `mmId` is the M1's `instanceof`.
2. **The profile.** It is decoded or inferred from the bag. `storedProfile` is in `frontend/src/components/editor-v2/sim/simRoleStatus.ts:240-246` (`if (raw === undefined || raw === null || raw === '') return { profile: inferCustomProfile(bag).profile, custom: true, readable: true };` / `const profile = decodeProfile(raw);`), built on core `decodeProfile` and `inferCustomProfile` (`model/simulation/profileCodec.ts:68`, `:145`, *agent*).
3. **The run bag.** Off roles are dropped and the event is derived. `simBridge.ts:182-188` `export function runBag(raw: Record<string, unknown>, lookup: Lookup): Record<string, unknown> {` … `const derived = withDerivedEventRole(bag, lookup);`.
4. **The STC.** `frontend/src/model/simulation/netCompile.ts:85` `export function netStcFromRoles(bag: Record<string, unknown> | undefined): NetStc | null {`. Every role in the result is a pointer id (`netTypes.ts:129-174`, *agent*).

The «State» of the prompt is the role **`node`**, and the «Trigger» is a reference role, not a metaclass (`roleCatalog.ts:139-141`, *agent*). STCFromRoles itself only checks overlaps today (`stcFromRoles.ts:4-6`, *agent*).

### D.2 Instances of a role (read)

`frontend/src/model/simulation/isKindOf.ts:26-30`:
- `export function isKindOf(lookup: Record<string, any>, objectId: string, classId: string): boolean {`
- `const start = lookup[objectId]?.instanceof;`
- `if (typeof start !== 'string') return false;`
- `return classIsKindOf(lookup, start, classId);`

A transition's trigger: `objectSlots.ts:35-36` `export function objectReferences(lookup: Record<string, any>, objectId: string, referenceId: string): string[] {` / `return objectSlotValues(lookup, objectId, referenceId).filter(…)`. Slots are matched by feature pointer, not by name (`objectSlots.ts:25`, *agent*). Note that `isKindOf(node)` is not the set of compiled places: fork, join and event nodes are excluded at compile (`netCompile.ts:268-269`, *agent*). Templates that must agree with the simulator read the compiled net (`compileNet`, `netCompile.ts:515`, *agent*).

### D.3 Valid without the panel (read)

The core is pure: `frontend/src/model/simulation/types.ts:4` «Pure types: no React, no store, no import from `components/`.». *Agent* search for React, Redux or joiner imports across `frontend/src/model/simulation` returned exit 1, positive control `from './roleCatalog'` exit 0. No binding function reads the run state.

The caveat is three helpers under `components/`:
- `runBag` (`simBridge.ts:182`)
- `storedProfile` (`simRoleStatus.ts:240`)
- `collectModelObjectIds` (`simBridge.ts:139`)

`simBridge.ts` imports the run singleton (`:119` `import { getSimPolicy, getSimRun, simCommit, simSetView, withInputs } from './simRunState';`), and `simRunState.ts:57` `import { useSyncExternalStore } from 'react';`. The binding is valid without the panel open. The codegen accessor should rebuild those three helpers, about 15 lines in total, from core parts instead of importing `simBridge.ts`.

### D.4 A read-only accessor for templates (design)

A module `frontend/src/codegen/stcAccess.ts` (new; `codegen` has 0 hits in `frontend/src`) binds one root `stc` in the template context, with these fields:
- `stc.profile`: the profile's name and shape.
- `stc.nodes`, `stc.transitions`, `stc.initial`, `stc.events`: arrays of the handles of §B.2, by `isKindOf` over the M1's objects.
- `stc.trigger(t)`, `stc.source(t)`, `stc.target(t)`: handles, via `objectReferences`, with the `ownedTransitions` fallback of `netCompile.ts:285-287`, *agent*.
- `stc.guard(t)`, `stc.actions(t)`: the JjEL source text, for the expression printer.
- `stc.net`: the compiled places and transitions with their ids, for the oracle.

Every field is a frozen value; there is no write path. Role names come from `ROLE_CATALOG` (28 ids, `roleCatalog.ts:24-31`, *agent*), and the eight system profiles from `simProfiles.ts:139-169`, *agent*.

## E. Experimental setting and lazy loading

### E.1 No experimental setting exists (read, *agent* search)

*Agent* search: `command grep -rniE --include='*.ts' --include='*.tsx' 'experimental' frontend/src`, exit 1. Positive control `PerformanceMetrics\.isEnabled`, exit 0. The hits for `flags`, `beta` and `isEnabled(` are Ecore feature flags, a benchmark switch and a «(beta)» label (*agent*). The closest gate is the Basic/Advanced mode, which also gates the simulator (`frontend/src/components/editor-v2/sim/simRoleStatus.ts:297-300` `export function simPillVisible(` … `if (!advanced) return false;`).

### E.2 Where settings live (read)

**Sections.** `frontend/src/components/settings/UnifiedSettingsModal/UnifiedSettingsModal.tsx:18` `export type SettingsSection = 'profile' | 'security' | 'providers' | 'prompts' | 'appearance' | 'notifications' | 'advanced';`. The «Advanced» section renders `frontend/src/pages/settings/AdvancedSettings.tsx`, whose only option is «Developer Options» → «Enable debug mode» (`:66-76`), stored at `:17` `localStorage.setItem('debug-mode', String(enabled));`. *Agent*: that key is read nowhere else.

**The precedent to copy** is a localStorage key plus a reader:
- `frontend/src/hooks/useInterfaceMode.ts:17` `const STORAGE_KEY = 'jjodel.interfaceMode';`
- `:22-29` `export function getInterfaceMode(): InterfaceMode {` … `return 'basic'; // Default to basic mode`
- a hook with cross-tab sync, plus a registry event (*agent*, `:57`, `:69-70`, `:87`)

**Alternatives.** A boolean on `DUser` (`autosaveLayout`, `classes.ts:2785`, *agent*) changes a D-layer class. A JSON preferences object (`frontend/src/components/Toast/toastTypes.ts:45` `export const TOAST_PREFS_KEY = 'jjodel-toast-preferences';`) also works.

**Recommendation.** Key `jjodel.experimental.codegen` (0 hits), a tiny eager module `frontend/src/codegen/setting.ts` (`getCodegenEnabled`, `useCodegenEnabled`, a registry event), and one checkbox in `AdvancedSettings.tsx` under a new «Experimental» label. «User-level» means per browser here, like every other preference. The «Clear local data» button (`AdvancedSettings.tsx:22-24`) resets it to off, which is the default anyway.

### E.3 Dynamic import and chunking (read)

**No `build` block.** `frontend/vite.config.ts` has none. Search: `command grep -n "^  build\|^\s*build:" frontend/vite.config.ts`, exit 1; positive control `^  server:`, exit 0 (`:52`). Vite's defaults apply: `assets/[name]-[hash].js`, no manifest.

**Live dynamic imports that split** (*agent*):
- `frontend/src/components/devtools/SmokeBoot.tsx:48` `import('../../examples/RowViewSmoke')`
- `frontend/src/components/editor-v2/sim/SimBoardEditor.tsx:133` (the icons JSON)

**No feature is lazy today.** Every other dynamic import has a static twin, and no `React.lazy` is live: `SaveManager.lazy.tsx` is commented out (*agent*).

**The legacy M2T engines are eager** through the joiner barrel: `frontend/src/joiner/index.ts:15` `import Handlebars from 'handlebars';` and `frontend/src/joiner/components.tsx:20` `export {T2M, M2T} from "../components/forEndUser/MTM";`.

**Design.** EditorV2 renders `React.lazy(() => import('../../codegen/ui/CodePanel'))` only when the setting is on. All generator code (engine, accessor, printer, runner, worker, panel) lives under `frontend/src/codegen/` and is imported only from that dynamic import. The eager residue is:
- `codegen/setting.ts`
- the lazy mount line
- the JjEL lexer option and context fields of §A.7

### E.4 Proving it (design; read for the precedents)

*Agent* search for an existing bundle or graph check: `madge|dependency-cruiser|rollup-plugin-visualizer|source-map-explorer|manifest|manualChunks|chunkFileNames` over `frontend/scripts`, `frontend/src`, `frontend/package.json`, the vite and vitest configs and `.github`, exit 1. Positive control `'vitest run' frontend/package.json`, exit 0. Nothing inspects the build output today.

Recommended gate, `frontend/scripts/gates/check-codegen-lazy.ts`:
1. Run `npx vite build --manifest --outDir <tmp>`. The CLI flag avoids a `vite.config.ts` edit.
2. Read `<tmp>/.vite/manifest.json`.
3. Compute the closure of `imports` from the `index.html` entry.
4. Fail when any chunk in that closure has a `src` under `src/codegen/` other than `src/codegen/setting.ts`.
5. Fail too unless `src/codegen/ui/CodePanel.tsx` appears as a `dynamicImports` target. This second clause is the positive control: it proves the walk saw the generator.

The gate needs a mutation bench. Add a static `import` of the engine to `EditorV2.tsx` and the gate must go red. Delete the dynamic import and the control clause must go red.

A runtime probe complements it, on the precedent of `frontend/scripts/probe/tree-crossing.ts:269` (*agent*), which routes on dev-server module URLs. With the setting off, open a project and the simulator: zero requests whose URL contains `/src/codegen/` apart from `setting.ts`. With the setting on: the chunk loads once the panel opens.

## F. JavaScript runner

### F.1 Workers today (read)

The only workers are Monaco's, via Vite `?worker` in the eager entry: `frontend/src/index.tsx:21-22` `// @ts-ignore` / `import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';`, dispatched at `:37-44` `(self as any).MonacoEnvironment = {` / `getWorker(_: any, label: string) {`. *Agent* search: `command grep -rnE "new Worker\(" frontend/src` hit only lines inside the commented block of `index.tsx:46-77`; `find frontend/src -iname '*worker*'` printed nothing (control: `index.tsx` found). `vite-env.d.ts` deliberately omits `vite/client`, so every `?worker` import carries `// @ts-ignore` (*agent*, `:6-9`).

### F.2 Headers and CSP (read)

There is no CSP and no COOP/COEP. Search: `command grep -rnIil -E 'Content-Security-Policy|worker-src' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=webjars .`, exit 1. Positive control in the same run: `X-Frame-Options`, exit 0, in `nginx-standalone.conf` and `nginx-microservices.conf`. Without `--exclude-dir=webjars` the only hits are the vendored Ace CSP highlighter.

The headers that do exist are `nginx-standalone.conf:13-15` `add_header X-Frame-Options "SAMEORIGIN" always;` / `add_header X-Content-Type-Options "nosniff" always;` / `add_header X-XSS-Protection "1; mode=block" always;`. Nothing blocks a module Worker or a `blob:` Worker. The Azure deployment named in `.github/workflows/dotnet-backend-integration_test-jjodel.yml:4` (*agent*) may set headers outside the repo; this cannot be verified from here.

### F.3 Precedents for running code (read, *agent*)

Every precedent runs on the main thread, synchronously, with no timeout:
- the legacy M2T `eval` (`frontend/src/components/forEndUser/MTM.tsx:411-418`, re-read: `let m2t = "("+func_str+")";` … `try { func = eval(m2t); }`)
- user operations (`LModelElement.tsx:2488`)
- view JSX (`reducer.ts:1013`)
- `U.evalInContextAndScope` (`U.tsx:1116`)

The only execution limits are count-based (`jjtl/executor/executor.ts:1067` `MAX_INSTANCES_PER_MAPPING = 10000`). The runner is the first sandbox of its kind in the codebase.

### F.4 Runner design (findings only, no prototype)

**Creation.** `new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' })`, written inside `src/codegen/runner/` so Vite emits the worker as its own asset, reachable only from the lazy chunk.

**One run.** One worker per run, with this protocol:
- `{code, entry, inputs, timeoutMs}` in, `{ok, trace|error, line}` out.
- The main thread calls `worker.terminate()` at `timeoutMs` (default 2000, the panel shows it).
- A runtime error carries the generated line, which the Text maps back to its fragment and origin (R-GEN-5, «runtime errors reported on the model element»).

**No DOM.** A worker has none by construction.

**No network.** Before evaluating the code, the worker deletes or shadows `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `importScripts`, `WebTransport`, `BroadcastChannel` and `indexedDB` on `self` and on its prototype chain. It captures `postMessage` first.

This is a best-effort sandbox, not a security boundary. A hard guarantee needs a CSP on the worker script's response, `connect-src 'none'` and `script-src 'self'` plus what the evaluation needs, set in nginx and Azure. That is outside the pilot's files. It is stated as a limitation, consistent with a teaching pilot that runs the user's own generated code in the user's own tab.

**Tests.** `frontend/vitest.config.ts:14` `environment: 'node',` has no `Worker`. Protocol, timeout and error mapping are tested in vitest with a fake worker; the real worker is exercised by a Playwright probe.

## G. Oracle and expression printer

### G.1 Scenario, trace, `expect` (read)

**Scenario.** From `frontend/src/model/simulation/scenarioCodec.ts`:
- `:54-57` `export interface ScenarioInput {` / `readonly element: string;` / `readonly attr: string;` / `readonly value: boolean | number | string;`
- `:61-65` `export interface ScenarioStep {` / `readonly event: string | null;` / `readonly selector: string | null;` / `readonly kind: ScenarioStepKind;` / `readonly inputs?: readonly ScenarioInput[];`
- `:69-72` `export interface ScenarioRecord {` / `readonly name: string;` / `readonly steps: readonly ScenarioStep[];` / `readonly expect?: string;`

Elements are named by id, so a scenario survives renames (`:5-13`, *agent*).

**Trace.** `frontend/src/components/editor-v2/sim/simRunState.ts:70-78` `export interface SimTraceStep {` / `readonly event: string | null;` / `readonly selector: string | null;` / `readonly kind: 'fired' | 'halted' | 'discard' | 'quiescence';` …. Past configurations are recoverable: `:320` `export function configAt(run: SimRun, n: number): NetConfiguration | null {`.

**Outcome.** `frontend/src/components/editor-v2/sim/simScenarios.ts:91-94` `export type ScenarioOutcome =` / `| { readonly kind: 'passed'; readonly steps: number }` / `| { readonly kind: 'failed'; … }` / `| { readonly kind: 'diverged'; … }`.

**`expect` is one predicate on the final configuration**: `:107-113` `/** The final condition read like an invariant on the run's configuration, with the M frozen at Reset. */` … `const watch = compileWatch({ name: 'expect', kind: 'invariant', text }, …);` / `return evaluateWatch(watch, snapshot, run.net, run.config.state);`. Replay compares the kind and the selector offered per step, never σ (*agent*, `:74-88`, `:134-136`).

This refutes the spec's wording, which says the trace is compared «with the equality the scenario's `expect` defines» (spec §8): `expect` defines no equality. The comparison has to be built. See §G.2 and decision A2.

### G.2 What a generated program must expose (read + design)

The configuration is `frontend/src/model/simulation/netTypes.ts:98-102` `export interface SimState {` / `readonly marking: ReadonlyMap<string, number>;` / `readonly attrs: ReadonlyMap<string, ReadonlyMap<string, SimValue>>;` / `readonly presentation: …`, with `derived?` at `:107`, and `(σ, e)` at `:111-114`. The step is `frontend/src/model/simulation/netStep.ts:264-266` `export function step(` / `net: CompiledNet, cfg: NetConfiguration, selector: string | null, guards: GuardOracle, actions: ActionOracle,` / `derived?: DerivedOracle,`. Assignments are parallel (`:286`, *agent*). There are seven halt reasons (`netTypes.ts:343-353`, *agent*).

**Fixed signature** proposed for Phase 2 (R-GEN-8 says it is fixed after the discovery). Every id is the model's id; the identifier policy maps ids to JS names and keeps the table.

| Export | Meaning |
|---|---|
| `initial(): State` | `{ marking: {placeId: n}, attrs: {elementId: {attr: v}}, derived: {…} }`, presentation excluded |
| `step(state, event: string \| null, selector: string \| null, inputs: {element, attr, value}[]): { kind: 'fired' \| 'halted' \| 'discard' \| 'quiescence' \| 'inadmissible', next: State, reason?: string }` | The scenario already provides `(event, selector, inputs)` per step |
| `observe(state): object` | Canonical projection: sorted non-zero marking, semantic attrs, derived values |

**Oracle** (week 3):
1. The simulator replays the scenario (existing code).
2. The generated program runs the same `(event, selector, inputs)` sequence in the worker.
3. Per step, the oracle compares `kind`, then `observe(next)` with the same projection of `configAt(run, n).state`.
4. `expect` stays the simulator's final check.

The first mismatch is reported with the step, the transition id and the fragment that generated that transition's code. That gives a navigable origin for the failure.

### G.3 The translatable subset in code (read)

**The spec.** The subset is stated in `docs/spec/claude_spec_2026-09-13_computational_model.md:182-186`: «Guards and action expressions must lie in the subset of JjEL that expands to finite formulas over a frozen model: boolean and arithmetic on bounded integers, enumeration comparison, navigation on M (resolved to constants at translation), quantifiers over model collections (expanded to finite conjunctions/disjunctions). Out: strings and dates in state components, variable-size collections in state, calls with effects.» §8 (`:212-235`, *agent*) is the nuXmv correspondence table, not the subset.

**In code** there is a blacklist walker, not a whitelist: `frontend/src/model/simulation/subsetChecker.ts:4-12` «Walks a parsed guard and reports, without evaluating anything, the constructs that make it a defect, the ones that make it risky, and the ones the `.smv` exporter will not translate. … `not-verifiable`: the guard runs and simulates; the exporter will refuse it.», entry at `:387` `export function checkGuardSubset(expr: JjelExpression, source?: string): SubsetDiagnostic[] {`, with an exhaustive `switch` over the 22 node kinds (`:261-381`, *agent*). The only AST-to-text function is `:160` `function printPath(p: JjelExpression): string {`, for navigation paths.

*Agent* searches:
- `'toJs\b|toJavaScript|compileToJs|jjelToJs|emitJs|printJs|JsPrinter|ExpressionPrinter'`, exit 1.
- `'MODULE main|next\([a-zA-Z_]+\) *:='`, exit 1, with positive control `NOT_VERIFIABLE_METHODS`, exit 0.
- `'(ALLOWED|TRANSLATABLE|…)_(NODES|…)'`, exit 1, with a positive control, exit 0.

**It can drive a printer.** The JS expression printer of the target profile is a second exhaustive walker with the same `switch` skeleton. It refuses every node that `checkGuardSubset` marks `error` or `not-verifiable`, and prints the rest. Navigation on M is folded to constants the way `judgeActionTarget` folds action targets (`actionEvaluator.ts:165-177`, *agent*).

**Semantics the printer must reproduce** (read):
- `and` and `or` evaluate both operands before combining: `evaluator.ts:347-351` `return this.isTruthy(left) && this.isTruthy(right);`, with both sides evaluated at `:277-278` (*agent*).
- `/` and `%` by zero return null (*agent*, `:315`, `:322`).
- `+` concatenates when either operand is a string (`:287-288`).

A differential property test (§I.4) checks the printer against the evaluator on random σ.

### G.4 Guards and actions (read, *agent*)

- **Guards.** They compile with `parseExpressionStrict` and `checkGuardSubset` (`guardEvaluator.ts:60`). They evaluate tri-state on a frozen snapshot (`guardContext.ts:159-176`).
- **Actions.** They have a language of their own: `<target>.[attr] := <expr>`, parsed by `parseAction` (`parser.ts:951`). The AST is `JjelAction` (`ast.ts:399-403`). The semantics are parallel assignment on σ (spec §5.3).

The printer therefore has two entries, one for guard expressions and one for actions. The latter emits `next.attrs[id][attr] = <expr on state>` after evaluating every right-hand side on the old state.

## H. Prior art in the repo

### H.1 A legacy M2T subsystem exists (read; found by the writer, missed by the G-H sub-agent's term list)

**Search.** `command grep -n -i "handlebars\|mustache\|ejs\"\|nunjucks\|\"eta\"\|liquid" frontend/package.json` hit `:35` `"eta": "^4.5.1",` and `:36` `"handlebars": "^4.7.8",`, with exit 0. The control `'"react"'` hit `:53`. *Agent*'s term list (`generateCode|toCode|emitCode|…`) did not include `M2T`. This is the reason its claim of absence did not hold.

**Engine.** `frontend/src/components/forEndUser/MTM.tsx:230` `export function doM2T(data0: LPointerTargetable | Pointer | null | undefined, language: string): string{`.
- It reads `:242` `let languageObj = s.languages[language].m2t;`.
- It selects a per-class fragment, falling back to `Default` (`:266-279`).
- It dispatches on the engine: `:295` `case 'eta':`, `:372` `case 'handlebars':` (`:379` `try { template = Handlebars.compile(func_str); }`), `:409` `case 'javascript':` (`:412` `try { func = eval(m2t); }`).

The T2M direction is `parseT2M`, at `:35`, with `ohm`, `nearley` and `javascript` engines. The public API is `M2T(data, language)`, exported on `window` at `:611` `(window as any).M2T = M2T;`.

**Data.** `frontend/src/redux/store.tsx:221` `languages!: Dictionary<string, Language> & {_selected: string};`. The class `Language` is at `frontend/src/joiner/classes.ts:4212`. The defaults come from `frontend/src/common/DV.tsx:51` `static defaultLanguages()`: `JSON` (`:55`), `Emfatic` (`:65`, engine handlebars), `flexmi/YAML` and `flexmi/XMI` (`:397-398`, Eta and Ohm), `eCore/JSON` (`:400`), `eCore/XMI` (`:417`) and `testLanguage` (`:421`). `DState` seeds the field at `classes.ts:704` `thiss.languages = windoww.DV.defaultLanguages();`.

**Migrations.** `frontend/src/redux/VersionFixer.tsx:471` `private ['2.203 -> 2.204'](s: DState): DState {` reseeds languages that were not edited. `:548-556` (`'2.207 -> 2.208'`) renames `str` to `__str`.

**UI.** The «Languages» tab is declared and orphaned. `frontend/src/components/abstract/Dock.tsx:309` `const mtm = {id: id(), title: <TabHeader tid={tid()}>Languages</TabHeader>, …};` is the only occurrence: `command grep -c -E '\bmtm\b' …Dock.tsx` returns 1, against the control `ModelsSummaryTab`, which returns 3. `:347-352` explains «the editors-group tab consts … are still left in place (orphaned)» since «F2 floating panels (2026-07-29)».

**Eager.** It is part of the eager bundle (§E.3).

**Docs.** `frontend/src/jjel/SPEC.md:37` «Model-to-Text generation (M2T) is handled separately by the existing Handlebars-based template engine. JjTL does not cover M2T.» and `:660` «Full M2T remains in the Handlebars engine.»

**Verdict.**
- The spec's «Supersedes: nothing … no model-to-text generator today» is refuted. The pilot supersedes nothing either, though: the legacy engine has no origin, runs `eval` on the main thread, is eager, and is seeded and migrated by `DV.tsx` and `VersionFixer.tsx`, both in §3.1. Building on it would put the pilot in the critical zone.
- Recommended: leave it untouched. Rule 9 forbids removing apparently unused code, and deleting persisted data is an RC-26 item.
- Recommended: correct `SPEC.md:37` and `:660` in slice S1's docs commit, so the language's own spec stops pointing M2T at Handlebars.

### H.2 Other text writers (read, *agent* table re-sampled)

These are structural serialisers. None has origin or templates:
- `.ecore` XML: `frontend/src/services/export/EcoreService.ts:94` `static exportToXML(…)`
- XMI: `XMIService.ts:120-123`
- clean JSON: `JsonModelService.ts:3`
- Markdown and HTML documentation: `frontend/src/services/DocumentationGenerator.ts`
- mappings to JjTL text: `frontend/src/jjtl/views/SuggestedMappingsPanel.tsx:176` `function generateJjtlCode(`
- a per-device nuXmv line, display only: `frontend/src/components/editor-v2/sim/simBoard.ts:527-552`

Jjodie generates JjScript, not target code (`frontend/src/jjodie-integration/jjscriptGenerationPrompt.ts:10`). `frontend/src/ai/` does not exist: *agent* `ls` failed, and a `find` for an `ai` directory returned only the Jjodie folders, with control `jjtl` found. *Agent* absences, each with a control in the same invocation: `graphviz|digraph` exit 1, `mermaid|generateCode|toCode\b|emitCode|json[ -]?schema` exit 1 (control `class DocumentationGenerator` exit 0), `\bXtend\b|Acceleo` exit 1.

### H.3 Viewers a code panel can build on (read, *agent*)

- `frontend/src/jjscript/components/ScriptBlock.tsx:1163-1168` decorates each line through `lineProps` on react-syntax-highlighter, with a gutter at `:965-988`. This is the closest «lines with identity» component, and `lineProps` can carry `onClick`.
- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx:246-250` is a deliberate `<pre>`, «so Monaco would weigh on every panel and would also swallow keystrokes in capture phase».
- `frontend/src/components/editors/monacoConfig.ts:134-144` defines `readOnlyMonacoOptions`, which nothing consumes.

Recommended for the pilot: a `<pre>`-based panel with a line gutter and per-line spans (the `irTabs` and `ScriptBlock` precedents). It is light, has no capture-phase keyboard trap, and carries a span per fragment for origin hover and click.

**Navigation events exist.** `frontend/src/events/registry.ts:23-24` `CANVAS_ELEMENT_SELECTED: 'jjodel:canvas-element-selected',` / `SELECT_NODE: 'jjodel:selectNode',`.
- **Code to canvas.** `frontend/src/components/editor-v2/problems/ValidationResultsModal.tsx:87-88` dispatches `new CustomEvent(JjodelEvents.SELECT_NODE, {` / `detail: { nodeId: elementId, modelId },`, handled at `EditorV2.tsx:1051-1056`, which selects the node and recentres.
- **Canvas to code.** `frontend/src/components/editor-v2/hooks/useJjomSelection.ts:72-73` dispatches `CANVAS_ELEMENT_SELECTED` with `detail: { elementId, className }`.
- **Gap.** The `SELECT_NODE` handler deselects every edge (`EditorV2.tsx:1055` `setEdges(eds => eds.map(e => ({ ...e, selected: false })));`). A transition drawn as an edge cannot be selected from code. See Q3.

---

## I. Phase 2 plan

### I.1 Slices, in order

New identifiers checked before proposing them. `command grep -rn --include='*.ts' --include='*.tsx' -F "<id>" frontend/src | wc -l` returned 0 for each of `genTemplates`, `codegen`, `TextFragment`, `experimentalCodegen`, `jjodel.experimental` and `CodePanel`. The control `runScenarios` returned 10.

| Slice | Week | Files (DOVE) | Parallel with | Visual check |
|---|---|---|---|---|
| **S1 `jjel-template`**: lexer option `interpolation`, `parseTemplate`, context fields `textHost` and `readObserver`, `join` delegation; `SPEC.md` §9.4 and :37 updated | 1 (10-12..10-14) | `frontend/src/jjel/lexer/lexer.ts`, `frontend/src/jjel/parser/parser.ts`, `frontend/src/jjel/evaluator/evaluator.ts`, `frontend/src/jjel/evaluator/context.ts`, `frontend/src/jjel/evaluator/builtins/collections.ts`, `frontend/src/jjel/index.ts`, `frontend/src/jjel/__tests__/templateInterpolation.test.ts`; docs commit `frontend/src/jjel/SPEC.md` | S3 | no |
| **S2 `codegen-engine`**: `Text`, fragments and origin, block indentation, template records registered as builtins, the hole attribution rule of §B.4, codec `genTemplates` | 1 (10-14..10-17) | `frontend/src/codegen/engine/{text,indent,origin,templates,templateCodec}.ts` and `frontend/src/codegen/engine/__tests__/*.test.ts` | S3; after S1 (it consumes S1's `JjelTextHost` interface, so RC-22's second check fails until S1 merges) | no |
| **S3 `codegen-stc`**: the read-only accessor of §D.4 | 1 (10-12..10-16) | `frontend/src/codegen/stcAccess.ts`, `frontend/src/codegen/__tests__/stcAccess.test.ts` | S1, S2 | no |
| **S4 `codegen-runner`**: JS target profile (identifier policy with table, expression and action printer), worker, protocol, timeout | 2 (10-19..10-22) | `frontend/src/codegen/target/js/{identifiers,printer}.ts`, `frontend/src/codegen/runner/{runner,runner.worker,protocol}.ts`, tests under `frontend/src/codegen/target/js/__tests__/` and `frontend/src/codegen/runner/__tests__/`, probe `frontend/scripts/probe/codegen-runner.ts` | S5 | no (textual and probe) |
| **S5 `codegen-panel`**: setting, lazy mount, code panel with origin navigation, lazy gate | 2 (10-19..10-23) | `frontend/src/codegen/setting.ts`, `frontend/src/pages/settings/AdvancedSettings.tsx`, `frontend/src/components/editor-v2/EditorV2.tsx` (one lazy mount line and a pill), `frontend/src/codegen/ui/{CodePanel.tsx,CodePanel.scss,TemplateEditor.tsx}`, `frontend/src/styles/tokens/` (one tokens file if the panel needs new variables, rule 28), `frontend/src/events/registry.ts` (one event: setting changed), `frontend/scripts/gates/check-codegen-lazy.ts`, `frontend/package.json` (one script entry, no dependency), probe `frontend/scripts/probe/codegen-panel.ts` | S4 | **yes** |
| **S6 `codegen-oracle`**: `observe` projection, step comparison against `configAt`, two lecture examples | 3 (10-26..10-29) | `frontend/src/codegen/oracle/{oracle,observe}.ts` and tests, example fixtures under `frontend/src/codegen/examples/` | — | yes (the examples), light |

The 3.2 candidate is cut after S5 merges, on 10-23, the content freeze (R-GEN-1). S6 lands in 3.2.x, or, if the freeze allows it, behind the same setting (it is code in the lazy chunk). Five files each for S1 and S5 exceed rule 19's threshold of five. The prompts list them, which serves as the confirmation (the precedent in the 2026-10-01 log entries).

### I.2 Parallelism (RC-22)

The three checks of RC-22 were applied to each pair of lanes:
- **S1 and S3**: disjoint DOVE lists and no shared interface, so they launch together on 10-12.
- **S2** consumes `JjelTextHost` and `readObserver` from S1. It starts when S1 merges, with S3 still running.
- **S4 and S5**: disjoint lists. S5 is the one lane with a visual check, and S4 is textual. They launch together on 10-19.
- **S6** depends on S2, S4 and S3.

### I.3 Critical zone

**None, confirmed.** The union of the DOVE lists above was checked against the CLAUDE.md §3.1 table and does not include:
- `useJjomSync.ts`, `useM1ReferenceEdges.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`
- `VersionFixer.tsx`, `defaultViewTemplate.ts`, `DV.tsx`
- `viewpoint/authoring/`, `viewpoint/ir/`, `problems/`

Two conditions keep it so:
- Templates must not go into `DState.languages`. That would touch `DV.tsx` and `VersionFixer.tsx`.
- No slice may add a VersionFixer step. None is needed (§C.3).

`EditorV2.tsx` is a hot file (4664 lines) but not in §3.1, and its edit is one lazy mount plus a pill. There are no D-layer creators: templates are written through the `state` setter, which is pure `SetFieldAction` (rule 12's safe case).

### I.4 Test strategy

All suites are vitest (node) unless marked probe. The probe for each lane runs on a port from 3080 to 3099.

**S1**
- Lexing and parsing with offsets, for nested holes, holes in lambdas and the escapes `\$`.
- **Off-by-default identity**: without the option, `"a ${b}"` fails exactly as today, same message. With `textHost` absent, `evaluate` returns the same values on the whole existing JjEL suite.
- With a fake host: Text through `+`, `join` and interpolation.

**S2**
- Indentation as property tests:
  - a single-line value is unchanged;
  - an n-line value gains exactly n−1 prefixes;
  - indentation composes across nested templates.
- The origin triple, one test per row of the §B.3 table.
- Error fragments on an absent value.
- Codec: round trip, unknown fields ignored, absent key read as empty, emptied written as `[]`.
- Save and load keep the key with the setting off. This is a D-layer round trip, not a source read.

**S3**
- Fixture idlookups from the simulator tests, for state machine, Petri net and flowchart.
- `stc.nodes` equals `isKindOf` over the objects; `stc.net` equals `compileNet`.

**S4**
- Printer, one test per accepted node kind and one per refused code.
- **Differential property test**: for random σ over bounded domains, `new Function(printed)(σ)` equals the JjEL evaluator on the same guard and context. This is the test that catches the eager `and`/`or` and the null on division by zero.
- Identifier policy: reserved words, collisions, and a table that is invertible on every generated name.
- Runner protocol and timeout with a fake worker.
- Probe: a real worker runs, a `while(true)` is terminated at the timeout, and `fetch` is undefined inside the worker.

**S5**
- The lazy gate (§E.4) with its two clauses.
- Probe: zero `/src/codegen/` requests with the setting off; the panel, its navigation and the visual contract (§I.5).

**S6**
- The oracle on the two lecture examples: a passing scenario, and a mutated generated program that must diverge at a named step.

**Mutation bench** (CLAUDE.md §5, P11). Each mutation is declared in the slice's commit message with the test that kills it:

| Slice | Mutations the tests must kill |
|---|---|
| S1 | interpolation on by default; drop the offset shift; `textHost` ignored in `join` |
| S2 | no indent on continuation lines; origin set to the receiver id instead of the feature's owner; transformation name dropped; codec removing the key instead of writing `[]` |
| S3 | `isKindOf` replaced by an exact-class match; trigger matched by name instead of pointer |
| S4 | short-circuit `&&` printed for `and`; `/` printed without the null guard; `terminate` removed; network shadowing removed |
| S5 | a static import of the engine in `EditorV2.tsx`; the dynamic import deleted |

Surviving mutations are reported, not repaired silently (P11).

### I.5 The code panel, visual contract (template-task-visivi)

**Now, measured on HEAD by read:**
- The «Advanced» settings section holds one option, «Enable debug mode» (`AdvancedSettings.tsx:66-76`).
- No setting, pill or panel for code generation exists: 0 hits for `codegen`, `CodePanel` and `jjodel.experimental` in `frontend/src`.
- The only floating editor panel over the canvas is the simulation panel, mounted at `EditorV2.tsx:4638` and gated by Advanced mode plus `simEnabled`.

**Then:**
- With the setting off: Settings, the editor, the simulation panel and every node box are byte-identical to today on the four demo scenes. No request to `/src/codegen/` is made except `setting.ts`.
- With the setting on: a «Code» pill appears next to the simulation pill on a model whose metamodel has `genTemplates`, or in Advanced mode on any metamodel.
- The pill opens a floating panel with two tabs, «Templates» (name, params, body) and «Output» (generated text with a line gutter, «Run», a timeout field and the run's output or error).
- Hovering an output span outlines its fragment and shows its origin as «element · feature · transformation».
- Clicking a model-origin span selects that element on the canvas (`SELECT_NODE`); selecting an element on the canvas highlights every span whose origin is that element (`CANVAS_ELEMENT_SELECTED`).
- A runtime error points at the generated line and at the element whose fragment produced it.

**Acceptance criterion (mechanical):** on the state-machine lecture example, for every output span whose origin is (id, feature), clicking it makes `document.querySelector('[data-id="<id>"]')` the only selected node within 400 ms, and selecting that node on the canvas gives the class `code-span--linked` to exactly the spans whose origin id is `<id>`. With the setting off, the probe counts 0 requests matching `/src/codegen/(?!setting)` and a 0 px delta on every node box of the four demo scenes.

### I.6 The five points of the hypothesis, closed

See the table of §1. Point 0 (critical zone, model layer) holds. Points (1) and (4) hold, (4) with the helper caveat. Points (2), (3) and (5) are reshaped.

### Decisions taken (unattended)

| # | Decision | Recommendation adopted | Reason |
|---|---|---|---|
| U1 | Template definition form | Stored record `{name, params, body}`, body a JjEL interpolated string, registered as a builtin | Zero grammar for definitions; recursion for free; the JjTL helper precedent (`executor.ts:889-890`) |
| U2 | Template storage | `genTemplates` in the metamodel's `_state`, codec `{"v":1,…}`, emptied as `[]` | Same bag as the STC roles; unknown keys survive save and load; no migration; not `sim*`, so runs are not interrupted (§C) |
| U3 | `.ecore` round-trip loss | Accepted and stated in the panel's help | `_state` is already lost on export for the STC roles; annotations would not help, because export drops them too (§C.4) |
| U4 | Setting storage | localStorage `jjodel.experimental.codegen` with a hook, toggled in Settings → Advanced | The `useInterfaceMode` precedent; `DUser` would change a D-layer class (§E.2) |
| U5 | Code panel widget | `<pre>`-based with per-fragment spans, not Monaco | The `irTabs.tsx:246-250` reasoning: weight and capture-phase keys; spans carry origin |
| U6 | Runner isolation | Module worker per run, `terminate()` on timeout, network globals shadowed | No CSP exists to rely on; best-effort sandbox declared, CSP left to deployment (§F.4) |
| U7 | Lazy proof | Gate over `vite build --manifest` plus a dev probe on module URLs | Measures the build output (R-GEN-2) without editing `vite.config.ts` |
| U8 | Accessor dependencies | Rebuild `runBag`, `storedProfile` and `collectModelObjectIds` from core parts in `codegen/stcAccess.ts` | `simBridge.ts` pulls React and the run singleton (§D.3) |
| U9 | Transformation field | Record the builtin's name, without claiming invertibility | Only identity is strictly invertible; the name is enough to decide later (R-GEN-9) |
| U10 | Absent value in a hole | Error fragment, generation continues, «Run» refused while errors exist; `null` renders `''` in interpolation and in Text `join` | Mirrors the rule boundary of the validation spec; aligns the two null renderings |

### Decisions awaiting Alfonso (RC-26 items only)

- **A1. The JjEL extension of §A.7.** R-GEN-4 says it is «ratified on its own»; rule 5 also asks approval for core changes. It is a lexer option off by default, `parseTemplate`, and two optional context fields (`textHost`, `readObserver`) inherited like `stateAccess`, with byte-identical behaviour when unused. Recommended: ratify as specified.
- **A2. Amending ratified R-GEN-8.** Its text says «compared … under the scenario's `expect`». `expect` is a single final predicate (§G.1). Recommended: the oracle compares the per-step `kind` and `observe(σ)` against `configAt`, and `expect` stays the simulator's final check.

## Dependencies and risks

1. **Schedule.** S1 gates S2, so a slip in S1 moves the engine past 10-17. Mitigation: S2 can write `text.ts`, `indent.ts` and the codec on the first day without S1, because they do not use the evaluator.
2. **Origin on edges.** Origin navigation to transitions drawn as edges needs an edge-select path (§H.3, Q3).
3. **Network isolation.** It is best-effort without a CSP (§F.4). A determined program can escape the shadowing.
4. **Printer and evaluator semantics.** They can diverge (eager `and`/`or`, null on division by zero, structural `==`). The differential property test is the guard.
5. **Keyword features.** A metamodel feature named like a JjEL keyword needs `o["in"]` in a template (§A.5). The lecture examples should avoid such names or show the form.
6. **The legacy M2T stays in the eager bundle and on `window`.** Two M2T systems coexist. The JjEL SPEC must stop calling Handlebars the M2T engine (§H.1).
7. **Agent-sourced lines.** Where marked *agent*, the writer did not re-quote. Downstream lanes re-read them (P4).
8. **Load.** The probes and the full vitest run under other lanes have produced load-induced reds before (log entry of 2026-10-01). Gates run in the foreground and at low load.

## Open questions

1. Q1: templates per metamodel in `_state`, not a project resource? Recommended: yes, `genTemplates` on the M2.
2. Q2: leave the legacy `DState.languages` M2T untouched and correct `jjel/SPEC.md:37` and `:660` in S1's docs commit? Recommended: yes.
3. Q3: origin navigation for transitions drawn as edges? Recommended: in the pilot, select the source node and outline the edge through the code panel's own overlay; an edge-select event is a follow-up.
4. Q4: is S6 (oracle) in 3.2 behind the setting, or 3.2.x? Recommended: behind the setting in 3.2 if it is green by 10-23, else 3.2.x. R-GEN-8 makes it a goal, not a requirement.
