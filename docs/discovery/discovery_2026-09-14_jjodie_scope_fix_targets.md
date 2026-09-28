# Discovery — Jjodie scope fix: the exact edit points

**Date**: 2026-09-14
**Phase**: READ-ONLY (lane B2, phase 1). No source touched. **HARD CHECKPOINT** after this report.
**Prompt**: `docs/prompts/claude_2026-09-14_1730_prompt_lane_b2_jjodie_scope_fix.md` (2026-09-14 17:30)
**Branch / HEAD at start**: `validation-skeleton` at `d79f994c9`
**Depends on**: `docs/discovery/discovery_2026-09-14_jjodie_metamodel_scope.md` (read in full). Its line numbers were
re-measured on this HEAD, after lane C (`3e3ab691a`) moved `create.ts` and `resolvers.ts`.

---

## 1. Objective

Confirm, file and line, where the Jjodie write path reads its scope, where the scope shown to the model is
built and where it can be stored, where the `metamodels[0]` fallback lives, where the RAG context emits class
names, how a name absent from the active metamodel is resolved today, and whether an explicit
`Metamodel::Name` crosses the active scope. Decision already taken (2026-09-14): option S, qualified RAG names,
V1 turned into an explicit error.

## 2. Files read (full paths)

- `/Users/alfonso/jjodel/CLAUDE.md`, `/Users/alfonso/jjodel/docs/claude-code-log.md` (head), `/Users/alfonso/jjodel/docs/decisions.md` (grep: the file is 284 KB)
- `/Users/alfonso/jjodel/docs/discovery/discovery_2026-09-14_jjodie_metamodel_scope.md` (full)
- `/Users/alfonso/jjodel/docs/prompts/claude_2026-09-14_1731_prompt_lane_g_parser_qualified_type.md` (overlap)
- `/Users/alfonso/jjodel/frontend/src/components/Jodie/Jodie.tsx` (full)
- `/Users/alfonso/jjodel/frontend/src/components/Jodie/ChatMessages.tsx` (full)
- `/Users/alfonso/jjodel/frontend/src/components/Jodie/MarkdownMessage.tsx` (35-70)
- `/Users/alfonso/jjodel/frontend/src/components/Jodie/JodieHeader.tsx` (70-100)
- `/Users/alfonso/jjodel/frontend/src/components/Jodie/console/providers/jjodieProvider.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/components/Jodie/console/providers/jjscriptProvider.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/components/Jodie/console/types.ts` (grep: `ConsoleResult`, `ConsoleContext`)
- `/Users/alfonso/jjodel/frontend/src/components/common/MarkdownRenderer.tsx` (60-130, 285-320)
- `/Users/alfonso/jjodel/frontend/src/jjscript/components/ScriptBlock.tsx` (130-245 + grep `onExecute`)
- `/Users/alfonso/jjodel/frontend/src/types/jodie.ts` (858-900)
- `/Users/alfonso/jjodel/frontend/src/services/JjodieContext.ts` (1-130, 330-390)
- `/Users/alfonso/jjodel/frontend/src/services/JjodieRagService.ts` (1-409)
- `/Users/alfonso/jjodel/frontend/src/services/AIProviderService.ts` (174-182, 380-388)
- `/Users/alfonso/jjodel/frontend/src/jjscript/services/JjScriptService.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/jjscript/types.ts` (488-508)
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/executor.ts` (30-175, 315-370)
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/utils.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/dependencies.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/elementWaiter.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/resolvers.ts` (1-20, 95-575, 740-770, 875-916) — read only
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/commands/create.ts` (1-340, 403-448)
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/commands/{extends,delete,set,rename}.ts` (resolution blocks), `abstract.ts` and `instance.ts` (grep)
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/__tests__/resolvers.test.ts` (1-80, 420-560)
- `/Users/alfonso/jjodel/frontend/vitest.config.ts` (grep: `environment: 'node'`, `include: src/**/__tests__/**/*.test.ts`)

Searches: `command grep` (BSD) and `git grep`, exit status read. The zsh `echo ===` separator aborted one compound
command before its second `grep` ran (`(eval):1: == not found`); that search was re-run with `printf` and is the
one reported. Two probes under the session scratchpad, run with `npx tsx` (§4): nothing written to the tree.

---

## 3. The six answers

### Q1 — where the scope is read at Run time

| site | what it reads |
|---|---|
| `jjscript/services/JjScriptService.ts:36` | `level = getActiveLevel()` |
| `JjScriptService.ts:37-38` | `modelId` = `getActiveModel()?.id` at M1 |
| `JjScriptService.ts:40-49` | `targetMetamodelId` = the M1 model's `instanceof`, else `getActiveMetamodel()?.id` (`:48`) |
| `JjScriptService.ts:52` | all three handed to `executeCommand` |

Callers of `JjScriptService.execute` (`command grep -rn "JjScriptService.execute(" . --include='*.ts' --include='*.tsx'`, 2 call lines):

- `components/Jodie/ChatMessages.tsx:416` — **Run on a Jjodie reply**, inside the shared `handleJjScriptExecute` (`:388-438`).
- `components/Jodie/console/providers/jjscriptProvider.ts:21` — the offer card (`Jodie.tsx:655-673`, run at `:660`) and JjScript mode (`Jodie.tsx:433-484`, run at `:456`). Both are user-typed input.

**Two further run-time reads inside the executor**, which carrying `targetMetamodelId` alone does not close:

- `jjscript/executor/utils.ts:291-301` `getTargetMetamodel`: the carried id wins only if it is found in `project.metamodels`; otherwise `getActiveMetamodel()` again (`:297`), otherwise `metamodels[0]` (`:305`).
- `utils.ts:248` `getDefaultParent` reads `getActiveMetamodel()` directly and ignores the context's id. It is reached from `commands/create.ts:283`, called **without** `context`, for `create class|abstract class|interface|enum|enumeration|package <Name>` with no `in`. So a Jjodie reply `create class Foo` run after a tab switch lands in the tab focused at Run time even with the id carried.

The executor singleton (`executor.ts:315-332`) rebuilds its context whenever `targetMetamodelId`, `level` or `modelId` differ, so a carried scope does reach the command context.

### Q2 — where the shown context is built, and where a scope can ride to Run

**Build.** `components/Jodie/Jodie.tsx:129-159`, the `projectContext` memo (deps `:159`: `clonedCounter`, `editorChangeCounter`).
`activeArtifact` is assembled at `:137-155` from `getActiveModel()` then `getActiveMetamodel()`, and passed to
`JjodieContextService.getContextJSON` at `:156`. There (`services/JjodieContext.ts:338-386`) the shown scope is
`resolveMetamodelScope(project, activeArtifact)` (`:340`; declared `private static` at `:87-114`):
M1 with a model → model document + conformance (`:353-368`); a resolved scope → one metamodel (`:370-371`);
no scope → every metamodel under `metamodels` (`:372-378`). Class names are bare; the metamodel name is the
document's `metadata.name` (prior report, `JsonModelService.ts:243-244`, `:521-528`).

**Hand-off to the model.** The memo's string goes into the provider context at `Jodie.tsx:572-581` (send) and
`:615-622` (`askJjodie`). `ConsoleContext` is `console/types.ts:32-49`; `ConsoleResult.entries` is `ConsoleEntry[]` (`:21-23`).

**The message.** Built in `console/providers/jjodieProvider.ts:57-64`, returned at `:66`, appended at
`Jodie.tsx:583-588` and `:623-628`. Type: `ChatMessage`, `types/jodie.ts:858-881`; every field but
`id`/`role`/`content`/`timestamp` is optional, and `jjscriptResult` / `jjscriptOffer` are the precedent for
feature-specific optional fields. History is not persisted (`Jodie.tsx:711`).

**The field does not leak to the LLM.** Every provider maps history to role and content only
(all 9 `history.map` sites in `AIProviderService.ts` read, e.g. `:176-181`, `:383-387`).

**Render chain to Run.** `ChatMessages.tsx:462-470` hands **one shared** `handleJjScriptExecute` to every
`MessageBubble` (`:58`) → `MarkdownMessage` (`:166-170`; `MarkdownMessage.tsx:40`, `:60`) → `MarkdownRenderer`
(`MarkdownRenderer.tsx:297-305`) → `CodeBlock` (`:73`) → `ScriptBlock onExecute` (`:103-106`).
`ScriptBlock`'s `onExecute(commands, targetId?)` (`ScriptBlock.tsx:40`) already has a second argument; it carries
`resolvedTarget?.id`, which is `undefined` without `availableTargets` (`:200-216`) — Jjodie passes none.

### Q3 — the V1 fallback

On the live write path:

| file:line | function | reached by |
|---|---|---|
| `jjscript/executor/utils.ts:305` | `getTargetMetamodel` | create (`create.ts:249`), extends (`extends.ts:42`), abstract (`abstract.ts:42`), set type (`set.ts:90`), eval (`eval.ts:131`, read-only), waiter (`elementWaiter.ts:64`) |
| `utils.ts:253`, `:258` | `getDefaultParent`, M2 branch | `create.ts:283` (create class/enum/package with no `in`) |

`JjScriptService.ts:47-48` yields `undefined` when nothing is active, which is what sends the first row to `:305`.

Not on the write path (listed so they are not mistaken for it):

- `resolvers.ts:755` — a private `getDefaultParent`, reachable only via `resolveParent` (`:570`), which has no call
  site: `command grep -rn "resolveParent" .` from `src` finds the declaration and the re-export at `jjscript/index.ts:58`
  (the positive control) and no call.
- `commands/show.ts:209` — read-only command.
- `ChatMessages.tsx:348` — `metamodelName` is computed and never read by `handleJjScriptExecute` (`:390`, `:399` read `hasProject` / `hasMetamodel` only).
- `components/Jodie/JodieHeader.tsx:86` — the header label.

### Q4 — the RAG context

`services/JjodieRagService.ts:131-287`, `projectToDocuments`, over `project.classes` and `project.enumerators` (project-wide):

| line | what is emitted | qualified today |
|---|---|---|
| `:138` | `# <project> Metamodel` overview title | — |
| `:149-152` | overview class list, `- **<name>**` | no |
| `:158-159` | overview enum list | no |
| `:181`, `:183` | `# Class: <name>` | no |
| `:193` | `**Extends:** <names>` | no |
| `:214` via `getTargetName` `:306-315` | reference target `→ <name>` | no |
| `:203` via `getTypeName` `:292-300` | attribute type (may be an enum) | no |
| `:234`, `:241` | document title, tag | no |
| `:254-256`, `:271`, `:277` | enum document | no |
| `:89-112` | change hash: `class:<name>`, `enum:<name>` | no — `A::Person` and `B::Person` hash identically; the re-index skip is `:328-333` |

The owner name is `element.model?.name`, the same source `resolvers.ts:217-226` (`qualifiedSpelling`, not exported)
uses for the A1 message; an element with no owning model (m3 primitives) is spelled bare there. The file imports
under node: `npx tsx` import of `JjodieRagService.ts` → OK (§4.2). The `.tsx` Jjodie files and `utils.ts` do not.

### Q5 — how `create.ts` resolves a name absent from the active metamodel

`commands/create.ts`, this HEAD:

- `:249` `targetMetamodel = getTargetMetamodel(context, project)`.
- `:259-261` scoped leg, `resolveTargetInMetamodel(parent, targetMetamodel, parentKinds)`.
- `:262-268` **the V3 site**: on a scoped miss (no element, no ambiguity) a `console.warn` and `resolveTargetInProject` — a single candidate elsewhere is taken silently (probe P4, §4.1).
- `:276-281` a second silent fallback, for `class`/`enum`/`package` parents: `resolveElement(parent, project)`, which also swallows A1 (`resolvers.ts:530-534`).
- `:283` default parent, no context (Q1).
- `:301-313` the A1 message, `ambiguityMessage(...)` + `QUALIFY_ADVICE`, fired from the project leg only.
- `:434-440` superclass: scoped, then `resolveElement(project)`.

**The same V3 shape outside `create.ts`** — every M2 writing command reaches a name project-wide:

| file:line | resolution |
|---|---|
| `extends.ts:45-50`, `:79-84` | scoped, then `resolveElement(project)` silently |
| `abstract.ts:45-50` | scoped, then `resolveElement(project)` silently |
| `set.ts:54` | **project only**, no scoped leg |
| `delete.ts:56`, `rename.ts:67` | **project only** (`resolveTargetInProject`, A1 surfaced) |
| `resolvers.ts:912-915` `resolveTypeTarget` | scoped, then project (probe P7) — used by create attribute/reference/operation/parameter and set |

**One choke point covers all of them.** `executor.ts:100-114`: before dispatch, `executeAST` runs
`extractDependencies(ast)` and `waitForDependencies`. `dependencies.ts:46-138` lists, per command, exactly the names
those handlers resolve: create parent, superclass(es), type, returnType, opposite, exceptions (`:145-209`); delete /
rename / set target and set's value reference; extends child and parent; add / move / copy / remove. The waiter
(`elementWaiter.ts:126-133`) already walks scoped-then-project, and only waits — it never refuses (`executor.ts:107-110`).
Sub-commands of `let` / `forall` come back through `executeAST` with a context override, so a check placed there runs per sub-command.

### Q6 — does an explicit `Metamodel::Name` resolve regardless of the active scope

**Yes.** Parser: `parser/grammar.ts:50` splits on `::` into segments. On the scoped leg,
`resolveByPathInMetamodel` (`resolvers.ts:442-474`) looks for segment `A` inside `B` and misses; the project leg
starts at `PROJECT_COLLECTIONS` `'metamodels'` (`:138-142`) and walks `A` → `Person`. Probe (§4.1):

- P1 — both declare `Person`, scope `B`, `A::Person` → scoped `null`, final `a-person`.
- P5 — `Person` only in `A`, scope `B`, `A::Person` → scoped `null`, final `a-person`.
- P2 — scope `B`, `B::Person` → found on the **scoped** leg (`:468`, the segment equal to the metamodel's own name is stepped over).

Bench: `resolvers.test.ts:532` (the qualified form resolves, project level) and `:539` (control, scoped). Two limits:
the intermediate walk is case-insensitive and first-match (`:452`, `:465`), so if `B` holds any element named `a`/`A`,
`A::Person` walks into it on the scoped leg; and a qualified **type** in `create … type A::X` does not parse today
(lane G's perimeter, `docs/prompts/claude_2026-09-14_1731_prompt_lane_g_parser_qualified_type.md`).

---

## 4. Probes

### 4.1 Resolution (`scratchpad/probe_b2_q6.mts`, `npx tsx`, exit 0)

Mirrors `create.ts:259-268` on hand-built fixtures (the `twoMetamodels` shape of `resolvers.test.ts`).

```
P1 both declare Person, scope B, "A::Person"      {"scoped":{"element":null,"amb":null},"final":{"element":"a-person","amb":null}}
P2 both declare Person, scope B, "B::Person"      {"scoped":{"element":"b-person","amb":null},"final":{"element":"b-person","amb":null}}
P3 both declare Person, scope B, bare "Person"    {"scoped":{"element":"b-person","amb":null},"final":{"element":"b-person","amb":null}}
P4 Person only in A, scope B, bare "Person" (V3)  {"scoped":{"element":null,"amb":null},"final":{"element":"a-person","amb":null}}
P5 Person only in A, scope B, "A::Person"         {"scoped":{"element":null,"amb":null},"final":{"element":"a-person","amb":null}}
P6 CONTROL scope A, bare "Person"                 {"scoped":{"element":"a-person","amb":null},"final":{"element":"a-person","amb":null}}
P7 resolveTypeTarget Person only in A, scope B    {"element":"a-person","amb":null}
```

P6 is the positive control: the same harness answers the scoped leg when the name is in scope.

### 4.2 Importability under node (`scratchpad/probe_b2_import.mts`, `npx tsx`, exit 0)

```
OK   services/JjodieRagService.ts
FAIL jjscript/executor/utils.ts   Unknown file extension ".css" … monaco-editor/…/standalone-tokens.css
OK   jjscript/executor/resolvers.ts   (the control: the bench already imports it)
```

`tsx` is not `vitest`; the vitest import of `JjodieRagService.ts` is to be confirmed when the test is written.

---

## 5. Surprises

1. **V2 is not closed by carrying the id.** `create class Foo` (no `in`) takes its parent from `getDefaultParent`, which re-reads the UI (`utils.ts:248`, via `create.ts:283`). Same for a carried id that no longer resolves (`utils.ts:297`).
2. **V3 is six commands, not one.** `create`, `extends`, `abstract`, `set`, `delete`, `rename` all reach names project-wide (§3 Q5). A per-command fix touches six handlers; the dependency pre-check in `executeAST` is a single site that sees the same names.
3. **`MarkdownRenderer` rebuilds its component map on every render** when `onJjScriptExecute` is set (`MarkdownRenderer.tsx:303-305`). A per-message wrapper created inline in `MessageBubble` would change identity each render, remount `CodeBlock`, and collapse an open `ScriptBlock` (its `jjscriptMode` is local state, `:75`). The binding must be memoized.
4. **The header can show a scope the model was not shown.** `JodieHeader.tsx:84-86` labels `metamodels[0]` when nothing is active, while the context carries every metamodel (V1). Outside this lane's named perimeter.
5. **Another lane's probe is in the tree**: untracked `frontend/src/jjscript/__tests__/zz_probeG.test.ts` (lane G). It matches the vitest include and will be picked up by a full run.

## 6. Proposed Phase 2 shape (for the go-ahead)

- **Capture** (`Jodie.tsx`): compute the shown scope in the same memo that builds `projectContext`, from the same `activeArtifact` and the same resolution as `getContextJSON` (`resolveMetamodelScope`, made callable), and stamp it on the reply entries after `jjodieProvider.run` at `:581` and `:622`. `jjodieProvider.ts` and `console/types.ts` are then not touched.
- **Message type** (`types/jodie.ts`): one optional field on `ChatMessage`, e.g. `jjodieScope?: { level: 'M1' | 'M2'; metamodelId: string; metamodelName: string; modelId?: string }`.
- **Carry** (`ChatMessages.tsx`): `MessageBubble` binds its message's scope into `onJjScriptExecute` with `useCallback`; `handleJjScriptExecute(commands, scope?)` returns the V1 error line when `scope` is absent, and otherwise calls `JjScriptService.execute(command, scope)`.
- **Service** (`JjScriptService.ts`): optional second parameter; when given, `level` / `modelId` / `targetMetamodelId` come from it and the context is marked bound.
- **Executor plumbing** (`jjscript/types.ts`, `executor.ts`): an optional `scopeBound?: boolean` on `ExecutionContext`, carried through `executeCommand` / `getExecutor` / constructor (optional trailing parameter).
- **Out-of-scope rule** (new pure module, e.g. `jjscript/executor/scopeGuard.ts`, importing `resolvers.ts` exports only; called once from `executeAST` after the wait, M2 only, bound contexts only): for each dependency with a **bare** name — scoped hit → pass; scoped ambiguity → pass (the handler reports it); scoped miss → project resolution: ambiguous → `ambiguityMessage(...)`; single hit → error «`Person` is not in `B`; qualify as `A::Person` to target another metamodel»; nothing → pass (the handler's not-found). Qualified names pass untouched (the escape hatch). Bound metamodel no longer in the project → error.
- **Default parent** (`utils.ts` + `create.ts:283`): `getDefaultParent` honours `context.targetMetamodelId` in the M2 branch; `getTargetMetamodel` does not fall back to the UI when the context is bound. For unbound typed commands the id already equals `getActiveMetamodel()?.id`, so their behaviour does not change.
- **RAG** (`JjodieRagService.ts`): `Metamodel::Name` for class and enum names, extends, reference targets and classifier-typed attributes; primitives stay bare; the hash uses the qualified spelling.
- **Tests**: the guard in `resolvers.test.ts` (or its own file next to it); RAG qualification in a new `services/__tests__/JjodieRagService.test.ts`. The `.tsx` plumbing and `utils.ts` are not importable: no source-text tests, gap stated in the log.

File count: 11 source + 2 test = **13** (rule 19). No critical-zone file (§3.1); no Layer Impact Report due.

## 7. Risks

- **R1 — lane G** edits the parser in parallel and must not touch `create.ts`. This lane would touch `create.ts:283` only. A bare cross-metamodel **type** becomes an error under a bound scope; its qualified form works for `set` today and for `create` only after lane G lands.
- **R2 — primitives spelled `EString`** parse as `kind: 'class'` and become type-reference dependencies (`dependencies.ts:179-186`). They live in no metamodel; the guard lets a project-wide miss through, so they are not refused. To verify in the test.
- **R3 — `let` variables** used as bare names in a sub-command: not found anywhere → pass. To verify.
- **R4 — offer card and JjScript mode** stay on read-at-click: they are user-typed, not shown to the model.
- **R5 — case-insensitive intermediate walk** (§3 Q6) can capture `A::Person` inside `B` when `B` holds an element named `a`.

## 8. Open questions for Alfonso

1. **Out-of-scope rule placement**: one pre-check in `executeAST` via a new pure module (recommended), or per-command edits in the six handlers?
2. **The 13-file list** (§6): confirm, rule 19.
3. **Offer card / JjScript mode**: unchanged (recommended), or stamp the offer with the scope at typing time too?
4. **Type references under a bound scope**: refuse a bare cross-metamodel type like any other name (recommended, it is the rule), or exempt `type` / `returnType`?

---

**HARD CHECKPOINT.** No source modified. The tree carries other lanes' files unchanged (`ValidationRulesModal.*`,
the prompt files, `zz_probeG.test.ts`), none staged by this lane.
