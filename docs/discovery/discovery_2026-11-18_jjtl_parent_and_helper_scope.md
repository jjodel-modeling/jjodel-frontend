# Discovery 2026-11-18: JjTL `parent` as a property, lexical scope for helpers

- Prompt-ID: P-2026-11-18-1815 (Phase 1, read-only)
- Prompt file: `docs/prompts/claude_2026-11-18_1815_prompt_jjtl_parent_helper_scope.md`
- Chat: C-2026-11-18-1815
- Tree: worktree `~/jjodel-w-jjtl-parent`, branch `jjtl-parent-scope`, HEAD `4bfd26add`
- Executor model: Claude Opus 5.5 (`claude-opus-5-5`)

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it
downstream re-reads the real files.

## 0. Answer in brief

Added at the close of Phase 2 (GO given in chat with the answers to §10).

- Both readings confirmed by the probe of §4: `m.parent`, `self.parent`, `.parent` on a
  `{ __ref }` handle and on a `forall` element all read null, and helper bodies saw the
  caller's instance context.
- No helper depended on dynamic scope (§5), and the gallery ships none. The one fixture
  touched, W2 of class2relational, was a workaround for the missing `e.parent` (goal A).
- A landed in `6730df10b` (`parent` getter on source views and `{ __ref }` handles, one shared
  container lookup), B in `cbc8f5c86` (helper bodies evaluated in a lexical context), SPEC in
  `0e59c274c`; red tests in `94c1c4d47`.
- §10.1: W2 retired from `WORKAROUNDS` (10 to 7: `ownerColumn` needed a new W3 edit).
- §10.2: the `father` / `eContainer` / `owner` fallback is skipped for elements of the source
  array (string `id` plus `className` or `__type`, `sourceContainerOf`); a serialized root
  reads `parent` null.
- §10.3: free names in a helper read null with no warning; a member read on them warns.
- §10.4: `data` elements left out, recorded as a ticket.

## 1. Objective

Confirm why `helper isFemale(m : Member) -> Boolean { m.parent.mother == m }` always answers
false on Families2Persons, measure what depends on the dynamic scope of helper bodies, and
propose the change for goal A (`x.parent` on any source object) and goal B (a helper body sees
its parameters, builtins, helpers and `data` only).

## 2. Hypotheses under test

| # | Hypothesis | Verdict |
|---|------------|---------|
| H1 | `parent` is bound only as a bare name for the current instance; `x.parent` reads a missing property, so null | **holds** (measured, §4) |
| H2 | Helper bodies are dynamically scoped: the caller's `parent`, `self`, alias and attributes are visible | **holds** (measured, §4) |
| H3 | Some test, fixture, gallery template or doc example relies on H2 | **falsified** (measured + read, §5) |
| H4 | Goal A can be done in `executor.ts` alone, without `frontend/src/jjel/` or serialization | **holds** (measured with a reverted prototype, §7) |
| H5 | Goal A lands with the JjTL suite green inside the declared scope | **falsified**: one existing test pins the bug (§7.2) |

## 3. Files read (full paths)

- `/Users/alfonso/jjodel-w-jjtl-parent/frontend/src/jjtl/executor/executor.ts` (windows 195-284, 1180-1550, 2935-3010, 3340-3400, 3438-3457, 3815-3839)
- `/Users/alfonso/jjodel-w-jjtl-parent/frontend/src/jjtl/executor/__tests__/source-object-identity.test.ts` (whole, 119 lines)
- `/Users/alfonso/jjodel-w-jjtl-parent/frontend/src/jjtl/executor/__tests__/class2relational.test.ts` (windows 1-155)
- `/Users/alfonso/jjodel-w-jjtl-parent/frontend/src/jjtl/__tests__/fixtures/class2relational.ts` (windows 85-145)
- `/Users/alfonso/jjodel-w-jjtl-parent/frontend/src/jjtl/SPEC.md` (§3.4 lines 298-312, §4.2 lines 458-468, §7.3-7.4 lines 885-910)
- `/Users/alfonso/jjodel-w-jjtl-parent/frontend/src/jjel/evaluator/identity.ts` (grep only: `modelIdentityOf` reads own `__ref`, then `id`)
- `/Users/alfonso/jjodel-w-jjtl-parent/frontend/public/library/catalog.json` and `gallery/*/1.jjodel` (grep only)
- every helper declaration found by the search of §5

## 4. Probe results (measured, HEAD `4bfd26add`)

Probe: a throwaway test (`_tmp_probe_parent.test.ts`, deleted, not committed) reusing SOURCE
and TARGET of `source-object-identity.test.ts`, one rule `Member m -> Female where <guard>`,
both parse paths. Expected Female set for "is a mother": Cindy, Jackie.

| Case | Legacy parser | JjEL delegation |
|------|---------------|-----------------|
| guard `parent.mother == m` | Cindy, Jackie; 0 warnings | same |
| guard `m.parent.mother == m` | none; 9 warnings `Cannot access property 'mother' of null` | same (`JjelExpression`) |
| guard `self.parent.mother == self` | none; 9 warnings, same text | same |
| helper `m.parent.mother == m` | none; 9 warnings, same text | same |
| helper bare `parent.mother == m` | Cindy, Jackie (works by dynamic scope) | same |
| helper `true` | all 9 | all 9 |
| helper `parent.mother == self` (reads caller's `self`) | Cindy, Jackie (dynamic scope) | same |
| helper `nm(m) { firstName }` (reads caller's attribute) | all 9 named, i.e. `firstName` came from the caller | same |
| guard `parent.mother.parent.lastName == parent.lastName` (`.parent` on a `{ __ref }` handle) | none; 9 warnings `'lastName' of null` | same |
| `forall d in parent.daughters : d.parent.lastName` | parse error `Expected expression` (legacy) | none; 9 warnings `'lastName' of null` |

Note: the failure is not silent, 9 warnings are emitted; in the app they may go unseen.

The cause, read:

- `executor.ts:2982`: `if (sourceInstance && typeof sourceInstance === 'object' && bindings.parent === undefined) {` binds the bare name only, from `_containerId` (`:2984-2991`) or the fallback `:2994-2997` `(sourceInstance as any).father ?? (sourceInstance as any).eContainer ?? (sourceInstance as any).owner ?? null;`.
- `executor.ts:1347`: `const result = changed ? view : obj;` a Member (no `{ __ref }` feature) is bound as the raw object, which has `_containerId` and no `parent`.
- `executor.ts:1254-1261`: the handle of a `{ __ref }` gets a getter per own key of the target, so no `parent` either.
- `executor.ts:1496`: `const childCtx = ctx.child(bindings);` where `ctx` is the caller's context: dynamic scope. SPEC §3.4 (line 310) already says "each helper sees its own parameters only", which today holds for the shadowing of builtins, not for names in general.

## 5. Dynamic-scope dependency list (measured + read)

Search: `command grep -rcE "helper\s+[A-Za-z_]+\s*\(" --include='*.ts' --include='*.tsx' --include='*.md' --include='*.jjtl' --include='*.json' --include='*.js' frontend/src frontend/public docs backend`, BSD grep (bypasses the ugrep wrapper), exit 0. Positive control: the same command returns `frontend/src/jjtl/SPEC.md:5` and the probe file itself.

Helpers found and their free names (neither parameter, builtin, helper nor `data`):

| Path:line | Body | Free names |
|-----------|------|-----------|
| `frontend/src/jjtl/__tests__/jjel-delegation.test.ts:244,253,262,271,280` | `s.camelCase()`, `c.isAbstract ...`, `exists a in c.attributes ...`, `with c.parent do name ?? "root"`, `if c.isAbstract ...` | none (`name` in the `with` is bound by `with`); parse-only tests |
| `frontend/src/jjtl/__tests__/fixtures/parity-sources.json:260-496` | same five, `formatLabel`, `translateType` | none |
| `frontend/src/jjtl/__tests__/helper-multiline.test.ts:34,39` | `prefix + "_" + name`, `translateType` | none |
| `frontend/src/jjtl/__tests__/fixtures/class2relational.ts:100` | `e.parent.types.filter(...)` | none; uses `e.parent` (goal A), and its W3 rewrite at `:141` reads `data` (root-bound, stays visible) |
| `frontend/src/jjtl/executor/__tests__/env-value.test.ts:135` | `envValue(n) + "_w"` | none: `envValue` is root-registered (`executor.ts:3394`) and reads executor state, not the context |
| `frontend/src/jjtl/executor/__tests__/demand-as-value.test.ts:94,294` | `envLookup(n)` | none, same as above (`executor.ts:3388`) |
| `frontend/src/jjtl/executor/__tests__/method-failure.test.ts:132`, `builtin-error.test.ts:128` | `x.<method>`, `range(x.missing)` | none |
| `frontend/src/jjtl/executor/__tests__/helper-param-shadow.test.ts:39-75` | `pick`, `call`, `echo`, `app`, `inner`, `outer` | none (all helpers or parameters) |
| `frontend/src/jjtl/executor/__tests__/creation-blocks-accumulate.test.ts:76,112` | `t.name == "String" ...` | none |
| `frontend/src/jjtl/README.md:62,114`, `SPEC.md:313-321,1271`, `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md:539,549,960,964`, `docs/handover/2026-02-01-jjtl-transformation-language.md:444`, `docs/jjel-jjtl-audit.md:314` | examples | none |

Gallery: `frontend/public/library/gallery/*/1.jjodel` (7 projects) contain 0 occurrences of `helper ` and 0 of `transformation `, measured with `command grep -o`; `catalog.json` says of Families2Persons "The transformation is yours to write". No shipped helper exists, so none can break under B.

Empirical check: B applied temporarily (`ctx.child` replaced by `this.context.evalContext.child`, reverted with `git checkout`), `npx vitest run src/jjtl src/jjel`: **1553 passed, 1 file failed**, the known `ai-prompt-sanitization.test.ts` (window not defined), identical to the baseline run on HEAD (1553 passed, same file). Nothing depends on dynamic scope.

## 6. Where `data` is bound, what a helper sees today (read)

- `executor.ts:1357-1360`: root bindings `source` and `data` = the whole source model; `classes`, `instances` when present (`:1363-1368`). Helpers, `resolve`, `resolveAll`, `range`, called rules and the env builtins are registered on the same root context (`:1437`, `:1465`, `:1477`, `:1427`, `:3360`, `:3377-3394`).
- `createInstanceContext` (`:2947-3008`) is a child of the root with `source`, `self`, `it` = the instance (shadowing the root `source`), its features, alias, `parent`.
- Today a helper's body runs in a child of the call site, so it sees: from a `let`, the `$` bindings (`:1986`, `:2036`, `:2694`, `letCtx.child`); from a `forall`, the loop variable; from a called rule, its parameters, because `calledRuleSource` (`:3815-3818`) builds a record of them that `createInstanceContext` binds as features; from a lazy rule, its instance context.
- Under B, all of these disappear from the body; `data`, `classes`, `instances`, root `source` (the whole model, not the instance) and every builtin and helper remain.

## 7. Proposed change

### 7.1 Goal A: a non-enumerable `parent` getter on views and handles

- A private helper `sourceContainerOf(obj)` holding today's lookup: `_containerId` in the source array, else `father ?? eContainer ?? owner` dereferenced with `derefSourceRef`. `createInstanceContext` calls it instead of its inline code, so bare and dotted `parent` cannot drift.
- `defineParentGetter(target, obj)`: when `obj` has no own `parent` (a user feature wins) and has a container, define on `target` a getter `parent`, `enumerable: false`, `configurable: true`, returning `bindSourceValue(container)`.
- `sourceView`: call it on the view; a defined getter counts as a change, so a contained element always gets a view (never the raw input, which must not be mutated). Roots without container keep `changed ? view : obj`.
- `liftSourceRefs`: call it on the handle of a resolved `{ __ref }`. The unresolved Proxy handle is left as is (its reads are recorded as warnings).

Properties checked: survives `shallowToJjelValue` (passes objects through, `executor.ts:237-244`); out of `Object.keys`/JSON/`fromJjelValue` (non-enumerable, like the handle getters); no loop on cycles (lazy getter, views cached in `sourceViews`, handles in `sourceRefHandles`); `==` still by id (`modelIdentityOf` reads `__ref` then `id`, both unchanged); downstream identity of a view is by id (`asSourceElement`, `executor.ts:3830`), as it already is for Family views.

Prototype measured (applied, then reverted by copying back the saved file; `git status` clean): every case of §4 gives Cindy, Jackie on both paths, 0 warnings, including helper `m.parent.mother == m`, `self.parent`, alias `.parent`, `.parent` on a handle, and the cycle `m.parent.daughters.first().parent.daughters.contains(m)` (Brenda, Kelly). Not changed: `frontend/src/jjel/`, `identity.ts`, the parser, serialization, any exported interface.

### 7.2 What A breaks: `class2relational.test.ts:140` (measured)

With the prototype, `npx vitest run src/jjtl src/jjel`: 1552 passed, **1 failed**:

```
FAIL src/jjtl/executor/__tests__/class2relational.test.ts > Class2Relational > W2, W3: `x.parent` is null for an element other than the rule's own
AssertionError: expected false to be true   (class2relational.test.ts:142, result.success)
```

The test pins the bug: `class2relational.test.ts:140` `it('W2, W3: \`x.parent\` is null for an element other than the rule\'s own', ...`, with the workaround reason in the fixture `frontend/src/jjtl/__tests__/fixtures/class2relational.ts:119` `'W2: \`x.parent\` is null for any element but the rule\'s own; ...'`. Under A, the natural text up to W2 now resolves `a.parent.name` and stops on the next obstacle: 2 errors `Unknown method 'toLowerCase' for type String. Did you mean 'toLower'?` (W4) and 4 warnings `Cannot call method 'filter' on null` (from `e.parent.types`: the Integer type is not reached through the container, which is W3, still needed). W2 becomes unnecessary; W3 and W4 stay.

Both files are outside the Phase 2 scope (DOVE lists `executor.ts`, `SPEC.md`, the new test file, docs). The prompt says: "if the fix needs it, stop and say so". Hence the hard stop.

### 7.3 Goal B: the helper body in a child of the root context

`executor.ts:1496`: `this.context.evalContext.child(bindings)` instead of `ctx.child(bindings)`; `shadowedBuiltins` unchanged. Expected results to pin: a helper reading `self`, `firstName` or a caller alias reads null (with the evaluator's undefined-name behaviour, whatever it is on each path; the test records it); bare `parent` inside a helper is null; `data` is the whole model; a lambda passed as argument keeps its own closure. Measured: no test changes (§5).

## 8. Risks

1. **Family `parent` is its father (read + measured).** The fallback `father ?? eContainer ?? owner` (`executor.ts:2994-2997`) reads a user feature named `father` on a root: on Families, a Family's bare `parent` is its father Member today (probe `Family f -> Male { fullName := lastName + ":" + (parent.firstName ?? "none") }` gave `March:Jim`, `Sailor:Peter`). Goal A as written ("same resolution order") extends this to `f.parent`. Pre-existing, not introduced.
2. Elements reached by a raw path still lack the getter: `data.filter(...).first().parent` is null, because `data` is the raw array (`:1359`). Goal A lists current instance, alias, parameter, forall element and handle, not `data` elements. A forall over `data.filter(...)` is covered (`bindForAllElement` → `sourceView`), unless `fromJjelValue` copied the elements first.
3. L-layer proxy sources (`sourceModel` not an array) are passed through untouched (`bindSourceValue`, `:1296`); `.parent` there is whatever the proxy answers. Unchanged.
4. Every contained source element now gets a view copy (once, cached). Memory proportional to the model; no measurement taken.
5. B changes what a helper sees from a called rule, a `let` or a `forall`: a transformation written by a user against today's behaviour (not in the repo) reads null afterwards. No shipped one exists (§5).
6. SPEC §7.3 (line 888) says `self` → "the target instance (when available)"; the code binds the source instance (`executor.ts:2950`). To fix when §7.3 is touched.

## 9. Decisions taken (unattended)

- D1. Probe not committed (throwaway, deleted); Phase 2 red tests will be the committed form.
- D2. Getter, not an enumerable key: keeps `Object.keys`, JSON and the trace shape unchanged, like `liftSourceRefs`.
- D3. Same resolution order for bare and dotted `parent`, through one shared helper, as the prompt asks; risk 8.1 recorded, not changed.
- D4. Phase 2 not started: §7.2 needs files outside the declared scope.

## 10. Decisions awaiting Alfonso

1. Widen the Phase 2 scope to `frontend/src/jjtl/executor/__tests__/class2relational.test.ts` (rewrite the W2/W3 test so it pins the new state) and `frontend/src/jjtl/__tests__/fixtures/class2relational.ts` (retire W2 from `WORKAROUNDS`, length 10 → 6, as W5/W6 were retired)? Or the test only, keeping the fixture's W2 text?
2. Family-father fallback (risk 8.1): keep the order (bare and dotted agree, quirk stays), or skip the `father` fallback for elements of a serialized source array, which carry `_containerId` when contained (a root then has `parent` null)?
3. B: confirm that a helper reading `self`, an attribute or a caller's alias gets null (the SPEC §3.4 reading), not an error.
4. Include `data` elements (risk 8.2) in A, or leave them for a later lane?

## 11. Questions

1. Scope widening of §10.1: test only, or test and fixture?
2. Family-father fallback: keep or restrict?
3. B semantics for free names in a helper: null, or a dedicated warning?
4. `data` elements in A: now or later?
