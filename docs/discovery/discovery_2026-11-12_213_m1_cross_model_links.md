# Discovery — #213: set external (cross-model) references from JjScript

Date: 2026-11-12. Lane: `enh/213-set-external-references-from-jjscript`, HEAD `1a946444b` before the diff.
Prompt: issue [jjodel-frontend#213](https://github.com/jjodel-modeling/jjodel-frontend/issues/213); the fix plan is ratified in the issue comment of 2026-11-12 11:29, with its three settled decisions (§4 here). Full lane per RC-3: > 3 files, and the plan's file list is the scope (rule 19 pre-answered by the ratified plan).

## 1. The state before

| Piece | State | Where |
|---|---|---|
| `set` link-branch value resolution | The value is flattened to a string (`QualifiedName.raw`, or a `STRING` literal's value) and resolved **only inside the active model**: `resolveInstanceHandle(targetModel, name)` → `findInstanceByName` → `allModelInstances(targetModel)`. An instance that lives in any other model can never be addressed → dead-end `INSTANCE_NOT_FOUND: No instance named 'Other::p' to link to` | `executor/commands/instance.ts` `executeSetInstance`, link branch |
| Handle registry in resolution | `resolveInstanceHandle` is registry-WINS: a handle created in this run resolves by id. Handles are this run's instances of the ACTIVE model, so a qualified address must not consult the registry | `instance.ts` `resolveInstanceHandle`; `executor/handleRegistry.ts` |
| Type check | `linkTypeMismatch` reads the target's class **by pointer** (`LPointerTargetable.fromPointer(targetId).instanceof`) and tests `isExtending(refType)` — pointer-based, already valid across metamodels once the target resolves | `instance.ts` `linkTypeMismatch` |
| Write path | `refProxy.values = plan.write` (proxy setter) plus the by-value `SetFieldAction '-='` of `removeLinked` — the same forms the canvas writes graphically in `syncCreateReferenceLink` (`refProxy.values = [...meaningful, targetObject.id]`). Pointer ids carry no model constraint | `instance.ts` `planLink`/`removeLinked`; `components/editor-v2/sync/canvasToJjom.ts:1772` |
| Read side | JjEL `eval` fills reference slots by pointer id (`fillInstanceSlots`) — model-independent, no change needed | `executor/commands/eval.ts` |
| Lexer / parser | `Other::p` already lexes as one `QUALIFIED_NAME` (a word containing `::`, `lexer.ts:397`); the identifier charset is `[A-Za-z0-9_]`, so an unquoted name with a space never becomes one token — the quoted form (`"My Model::p"`) reaches the link branch as a `STRING` literal holding the same string. No parser or lexer change needed | `parser/lexer.ts`; `parser/parser.ts` `parseValueOrQualified` |
| `remove <Instance> from <Owner>.<ref>` | Folds into `executeSetInstance` with `operator: '-='`, `value: args.target` — one fix point covers `=`, `+=`, `-=` and `remove … from` | `instance.ts` `executeRemoveInstance` |
| Bound-scope guard | M2-only (`context.scopeBound && context.level !== 'M1'`) — not a blocker | `executor/executor.ts:143` |
| Element waiter, M1 branch | `findUnresolved` tests the value against the active model (`hasReadyInstance(m1Model, segments.join('::'))`); `Other::p` never matches there, so a required `value-reference` (every `remove` target, and every `set` value on a retry pass) burns `MAX_WAIT_MS` (500 ms) and the executor's `console.warn` on each pass | `executor/elementWaiter.ts` `findUnresolved`; the wait flow in `executor/executor.ts` |
| Retry pass | `INSTANCE_NOT_FOUND` is M1-deferrable (R-JS-8), so a cross-model miss requeues and re-waits on each of `MAX_RETRY_PASSES` passes | `executor/runPasses.ts` `M1_DEFERRABLE_ERROR_CODES` |
| Profile guard | `describeForGuard` resolves the link target with `resolveInstanceHandle(activeModel, targetName)` — active model only; under a profile the cross-model target is `unresolved` and refused `PROFILE_UNRESOLVED` before the handler runs | `executor/executor.ts:407-414` |

Measured, not inferred: the dead-end error follows from the link branch's flatten-then-active-model-only lookup; the canvas's cross-model write is the committed precedent in `syncCreateReferenceLink`; the waiter's 500 ms stall follows from `findUnresolved`'s filter plus the `MAX_WAIT_MS` loop; the quoted-form parse failure of `remove "…"` is the throw in `parseQualifiedNameToken` (`parser.ts:1264`) on a `STRING` token.

## 2. What changes

- **`executor/instanceAddress.ts` (new)** — pure decision core in the `referenceWrite.ts` style (benchable under `environment: 'node'`):
  - `parseInstanceAddress(raw)` — split on the **first** `::`: qualifier + instance, both halves verbatim; no `::` ⇒ bare name.
  - `pickModel(models, qualifier)` — exact name first, then a single case-insensitive match; two or more matches ⇒ `ambiguous`, none ⇒ `absent` (the project's models become the suggestion list).
  - `resolveInstanceAddress(raw, activeModel, models)` — `local` (a bare name, or a qualifier naming the active model: today's path exactly, `consultRegistry: true`) vs `cross` (`consultRegistry: false` — the registry-skip rule as data) vs `model-absent` / `model-ambiguous`.
  - `elsewhereSuggestion(instance, modelNames)` — the `Found in 'Other': qualify as Other::p.` sentence a bare name earns when other models hold it.
- **`executor/commands/instance.ts`** — the link branch of `executeSetInstance` resolves the address through the core. Qualified ⇒ the instance lookup runs in the model named (the same `findInstanceByName`, model-wide: roots and contained); the registry is not consulted; `MODEL_NOT_FOUND` (suggestion lists the project's M1 model names), `AMBIGUOUS_MODEL`, `AMBIGUOUS_INSTANCE` (the existing refusal, typed spelling), `INSTANCE_NOT_FOUND` naming the model. Bare name ⇒ today's path unchanged, plus — on a miss, when one or more other models hold the name — the `Found in …` suggestion. **No fallback**: a bare name never resolves outside the active model. `// TODO(#213)` marks the cross-model containment policy. Success messages keep the typed spelling (`Linked s.lead → Other::p`). One fix point covers `=`, `+=`, `-=` and `remove … from`.
- **`executor/elementWaiter.ts`** — the M1 branch of `findUnresolved` recognizes `<Model>::<instance>`: a cross-model target, an absent model and an ambiguous model are decided the moment the handler runs (a script cannot create instances outside the active model), so the wait ends at the first poll — no 500 ms stall, no executor warning on a retry pass. A qualifier that names the active model keeps the local `hasReadyInstance` wait: that instance a later line may still create.
- **Surface** — `help.ts` `set` section and the `JjScriptService` quick reference document `<Model>::<instance>` and the quoting rule for names with spaces.
- **Tests** — `executor/__tests__/crossModelLink.test.ts` (behavior; the `m1Operators.test.ts` harness — real parser, mocked `joiner`, every write recorded — extended with a second model `Other` and one named `My Model`) and `executor/__tests__/instanceAddress.test.ts` (pure decision bench).

## 3. Semantics (ratified in the issue's plan)

| Case | Behavior |
|---|---|
| `Other::p`, `p` unique in `Other` | Link/unlink; the success message keeps the typed spelling (`Linked s.lead → Other::p`) |
| `"My Model::p"` quoted, spaces in either part | Same path: string-level split on the **first** `::`, both halves verbatim |
| `p` ambiguous inside `Other` | `AMBIGUOUS_INSTANCE` (the existing refusal) |
| No model named `Other` | `MODEL_NOT_FOUND`; the suggestion lists the project's M1 model names |
| Two models named `Other` | `AMBIGUOUS_MODEL` |
| Model exists, no such instance | `INSTANCE_NOT_FOUND` naming the model |
| Qualifier = active model | Not cross-model: today's path exactly, handle registry included |
| Cross-model + containment slot | Writes as the canvas does today — no guard; the `// TODO(#213)` marker: composition policy for cross-model slots (father/orphan on removal) is off-topic until decided |
| Type check | Unchanged `linkTypeMismatch` — pointer-based, already cross-metamodel valid |
| Handle registry | **Not consulted for qualified addresses**: handles are this-run instances of the active model, and `Other::p` must never silently resolve to the run-local `p` |
| Bare `p` | **Active-model-only, unchanged**; on a miss, suggestion `Found in 'Other': qualify as Other::p.` when `p` lives in one or several other models |

All refusals are decided before any write; the slot is read only after `settlePendingWrites`, as today.

## 4. The three settled decisions (from the plan)

1. Bare names stay active-model-only (no project-wide fallback).
2. Cross-model containment is off-topic for now; kept as a `// TODO(#213)` marker where the cross-model branch writes.
3. Model names with spaces are addressed in the quoted form; no lexer change — extending the identifier charset is a language-level change with a blast radius across token classification and every command's parsing, while the quoted form fully covers the need (the same pre-existing limitation as every unquoted JjScript name).

## 5. What was measured

Bench (`vitest`, `environment: 'node'`):
- `instanceAddress.test.ts`: the pure core — first-`::` split (verbatim halves, multi-`::` addresses), `pickModel` exact/case-insensitive/ambiguous/absent, local-vs-cross incl. the active-model qualifier and the `consultRegistry` data point, the two suggestion spellings.
- `crossModelLink.test.ts` (the plan's nine cases): link by qualified address (`=` replaces on single-valued, `+=` appends), the quoted `"My Model::p"`, `remove Other::p from …` / `-=` by-value removal, the cross-model `TYPE_MISMATCH` (wrong class), the cross-**metamodel** link (the issue's actual scenario: `Other` conforms to a different metamodel whose class is the declared ref type), `Nope::p` → `MODEL_NOT_FOUND` with the real model names in the suggestion, `Other::nobody` → `INSTANCE_NOT_FOUND` naming the model, two models holding `p` → bare `p` refused with both `Model::p` spellings in the suggestion, the registry-leak guard (a run-local `p` in the active model is not what `Other::p` links), bare `p` only in `Other` → `INSTANCE_NOT_FOUND` + the `Other::p` suggestion, no write.
- Regression controls: `m1Operators` 25 and `m1AttributeVectors` unchanged (same-model link semantics, the refusals, the vector forms).

Mutation bench (recorded in the commit message): the tests die when (a) the qualified path consults the handle registry (the registry-leak guard), (b) the first-`::` split becomes a last-`::` or every-`::` split (a multi-`::` address), (c) model selection takes the first case-insensitive match over an exact hit (the `Other`/`other` pair), (d) a bare-name cross-model fallback is introduced (the bare-`p` refusal).

Gates: `npm run typecheck` (exit 0, zero-error baseline), `npm run build` (exit 0, pre-existing chunk-size warning only), `npm run test` (the jjscript suites green; the nine known red files fail at import with `window is not defined`), `npm run check:docs`.

Not measured: the visual smoke (two-model project, `set s.lead = Other::p` and `set s.lead = "My Model::p"` in the JjScript console → link visible, undo restores) — it needs a manual browser session.

## 6. Sharp edges carried

- **Profile guard**: `describeForGuard` (`executor.ts:407-414`) resolves the link target in the active model only; under a profile (stand-alone environment, #157) a cross-model target is refused `PROFILE_UNRESOLVED` before the handler runs. The committed guard behavior for every unresolvable value; not in this lane's file list; a candidate follow-up if profiles should allow cross-model links.
- **SPEC.md §5.2** documents the reference branch as `set <Instance>.<reference> = <OtherInstance>`; the qualified form is not added there (not in the plan's file list; a one-line follow-up).
- **Pre-existing, untouched**: `remove "…"` with a quoted name does not parse at all — `parseQualifiedNameToken` (`parser.ts:1264`) rejects `STRING`. The `set` quoted form works, so the link is reachable; `remove … from` keeps the unquoted spelling.
- **Retry behavior**: `MODEL_NOT_FOUND` / `AMBIGUOUS_MODEL` are not in R-JS-8's deferrable set, so a wrong or duplicated model name is final after pass 1; `INSTANCE_NOT_FOUND` (model exists, instance absent) stays deferrable and requeues up to `MAX_RETRY_PASSES` — each attempt now immediate (the waiter fix), not 500 ms.
- **Cross-metamodel note**: the type check is pointer-based, so a target whose metamodel differs from the active one passes as soon as its class conforms — the issue's actual scenario; no metamodel-identity check is added (the canvas's graphical link does not have one either).

## 7. Addendum (2026-11-12, same lane): a cross-model link records the target model as a dependency of the caller model

Prompt (user, in chat, same lane as #213): «Add a little improvement: when a external reference is added, add the target model (if not already set) as dependency of the caller model».

- **What, where**: the link branch of `executeSetInstance` captures the model the cross-model target lives in (`crossModel`, `instance.ts`) and, inside the link's own TRANSACTION, appends it to the caller model's `dependencies` — `ensureModelDependency`, one `SetFieldAction.new(callerModel.id, 'dependencies', targetModelId, '+=', true)` (pointer append, the `'+='` the `pointedBy` writes use), skipped when the id is already listed. Recorded on `=` (when the slot gains the target) and `+=` (append); never on `-=` / `remove … from` (removal is not an addition), never on refusals, never for local links. Same TRANSACTION: the undo of the link takes the dependency back with it.
- **Field semantics**: `DModel.dependencies` — «Include other models as prerequisite for this model, it is as if this model is \"extending\" other models» (`LModelElement.tsx:5155-5159`); `allDependencies` resolves it recursively (`:5233`). Consumers: `crossObjects` / `crossClasses` / `crossPackages` merge the dependency models' contents (`:5726`, `:5734`, the includeCross branch of `_getallSub`).
- **Why it matters in the UI**: the References section's select reads `LValue.validTargetsJSX` → `get_validTargets` (`LModelElement.tsx:8175`): `isCrossRef ? m1.allCrossSubObjects : m1.allSubObjects`, and `allCrossSubObjects` is the model's objects plus the `allDependencies` models' objects. A cross-model target written from JjScript therefore appears in the caller's reference select (and the cross-`*` getters) only once the dependency is recorded — before this addendum, the slot row existed but its select was empty, because the target instance was not in the options list.
- **Write precedents**: the Info panel «Depends from models» (`Info.tsx:533`, whole-list `l.dependencies = [ids]`), the delete cascade (`Dummy.ts`, `case 'dependencies'`, `'-='` by id); the reducer applies `'+='` generically to array fields. `DModel` seeds `dependencies: []` (`classes.ts:1010`) and loaded states guarantee it (`VersionFixer.tsx:519`) — safe to append.
- **The select's gate (pre-existing, untouched)**: `get_validTargets` uses the cross list only when the reference metaclass has `allowCrossReference` (`LModelElement.tsx:8139`; the Info panel's «Cross Reference» toggle, `Info.tsx:178`). The JjScript path is not gated by that flag (explicit addressing); the flag governs the select's *options*, the dependency governs *which* models' instances populate them.
- **Tests**: `crossModelLink.test.ts` +7 — `=` records `{id:'m1', field:'dependencies', value:'m2', op:'+='}`; `+=` records; already-listed → no write; local link → none; `-=` → none; refusal (`Nope::p`) → none; cross-metamodel records the model the instance lives in (`m2`), not its metamodel. Suite 25/25; the five affected suites (crossModelLink, m1Operators, m1AttributeVectors, m1Containment, instanceAddress) 124/124.
- **Mutation bench**: removing the `=`-path dependency write kills exactly the two `=`-path dependency tests (the `+=` path and its test stay green — the write was removed from the `=` transaction only).
