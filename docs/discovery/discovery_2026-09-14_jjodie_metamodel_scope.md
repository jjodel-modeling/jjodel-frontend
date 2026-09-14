# Discovery — Jjodie metamodel scope: how class names are resolved when Jjodie writes

**Date**: 2026-09-14
**Phase**: READ-ONLY (lane B, phase 1). No source touched, no test created. **HARD STOP** after this report.
**Prompt**: `docs/prompts/claude_2026-09-14_1630_prompt_lane_b_jjodie_scope_discovery.md` (2026-09-14 16:30)
**Branch / HEAD at start**: `validation-skeleton` at `26d04febc`
**Depends on**: `docs/discovery/discovery_2026-09-11_name_resolution_scope.md` (read in full; its §4.6 and R6 are corrected in §0 below, not rewritten)

---

## 0. Two corrections before the findings

**0.1 `frontend/src/ai/` does not exist.** `ls frontend/src/ai` → `No such file or directory`. The files live in
`frontend/src/services/` (`JjodieContext.ts`, `JjodieActionExecutor.ts`, `JjodieActionParser.ts`,
`JjodieRagService.ts`), `frontend/src/components/Jodie/` and `frontend/src/jjodie-integration/`.
Declared and proceeded (RC-10). The 2026-09-11 report already noted the same.

**0.2 The defect as the prompt describes it is in code that nothing imports.** `JjodieActionExecutor`
— the class holding `findClassByName` — has **zero importers**, on this branch and on
`alfonso-frontend-jjtl`, and had zero at the commit that created it. Measurements:

| search | result |
|---|---|
| `command grep -rn "ActionExecutor" frontend/src` (no include filter, every file type) | 2 lines, both inside `services/JjodieActionExecutor.ts` itself (`:25`, `:681`) |
| `git grep -n "JjodieActionExecutor\|JjodieActionParser" -- . ':!docs'` | 4 lines, all self-declarations |
| same on `alfonso-frontend-jjtl` | the same 4 self-declarations |
| `command grep -rn "import(.*Jjodie" frontend/src` (dynamic import) | exit 1, none |
| `git grep` at `75fe8f2f5` (creation commit, 2026-02-20) excluding the file itself | exit 1, none |
| **positive control**, same commands: `JjodieContextService` | found in `Jodie.tsx`, `DocumentationService.ts`, `JjodieContext.ts` — on both branches and at `75fe8f2f5` |

The whole action family is unreachable: `JjodieActionParser` (0 importers), `components/Jodie/ActionConfirmation.tsx`
(0), `components/Jodie/MetamodelPreview.tsx` (0), `components/Jodie/ActionSuggestion.tsx` (referenced only
by `types/jjodieActions.ts`). `jjodie-integration/` is unreachable too: the only hits for the string
`jjodie-integration` under `frontend/src` are three comments (`uniqueModelName.test.ts:109`,
`TreeViewContent.tsx:2067`, `LModelElement.tsx:5010`), no import.

So the 2026-09-11 inventory's R6 («a live defect independent of whether the design is adopted») and its §4.6
risk `high` hold for the **code** and not for the **product**: `findClassByName` does take the first class of
that name project-wide (measured there as P4-a), but no user action reaches it. Every live Jjodie write
goes through the JjScript executor (§4). Where the live path can still write outside the scope Jjodie
showed, it does so for different reasons, listed in §6.

**0.3 The call-site count is 14, not 13.** The 2026-09-11 row (`:253`) says «13 call sites» and then lists
14 line numbers. Re-measured: 14 (§3).

---

## 1. Objective

Prepare the fix of the known defect «Jjodie shows the model one metamodel's names and writes into the
first metamodel that has a class with that name», by establishing how scope is computed, how names are
resolved at write time, what the LLM sees, and which paths are live.

## 2. Files read (full paths)

- `/Users/alfonso/jjodel/CLAUDE.md`, `/Users/alfonso/jjodel/docs/decisions.md`, `/Users/alfonso/jjodel/docs/claude-code-log.md` (head)
- `/Users/alfonso/jjodel/docs/discovery/discovery_2026-09-11_name_resolution_scope.md` (full)
- `/Users/alfonso/jjodel/docs/prompts/claude_2026-09-14_1631_prompt_lane_c_type_resolution_kinds.md` (for overlap)
- `/Users/alfonso/jjodel/frontend/src/services/JjodieContext.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/services/JjodieActionExecutor.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/services/JjodieActionParser.ts` (1-60, validation lines 281-454 via grep)
- `/Users/alfonso/jjodel/frontend/src/services/JjodieRagService.ts` (70-278, 320-398)
- `/Users/alfonso/jjodel/frontend/src/services/export/JsonModelService.ts` (89-124, 136-186, 217-350, 481-528)
- `/Users/alfonso/jjodel/frontend/src/services/AIProviderService.ts` (grep: `chat`, system prompt build `:75-79`)
- `/Users/alfonso/jjodel/frontend/src/services/PromptService.ts` (12-40)
- `/Users/alfonso/jjodel/frontend/src/constants/defaultPrompts.ts` (grep over the full file + 250-266)
- `/Users/alfonso/jjodel/frontend/src/components/Jodie/Jodie.tsx` (full)
- `/Users/alfonso/jjodel/frontend/src/components/Jodie/ChatMessages.tsx` (340-480)
- `/Users/alfonso/jjodel/frontend/src/components/Jodie/console/providers/jjodieProvider.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/components/Jodie/console/providers/jjscriptProvider.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/components/common/MarkdownRenderer.tsx` (60-140)
- `/Users/alfonso/jjodel/frontend/src/jjscript/components/ScriptBlock.tsx` (grep + 190-225)
- `/Users/alfonso/jjodel/frontend/src/jjscript/services/JjScriptService.ts` (23-62)
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/executor.ts` (30-119, 300-350)
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/utils.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/resolvers.ts` (95-718) — read only, not modified
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/commands/create.ts` (236-310, 428-462, 684-712)
- `/Users/alfonso/jjodel/frontend/src/jjscript/executor/__tests__/resolvers.test.ts` (430-549)
- `/Users/alfonso/jjodel/frontend/src/jjodie-integration/JjodieAPIImpl.ts` (full)
- `/Users/alfonso/jjodel/frontend/src/joiner/classes.ts` (3378-3547, `LProject` getters)
- `/Users/alfonso/jjodel/frontend/src/model/nameLookup.ts` (full) — read only, not modified

Every count in this report comes from `command grep` (BSD grep, honours `--include`) or `git grep`, with a
positive control on the same tool. The interactive `grep` wrapper (`type grep` → shell function) was not used
for any count.

---

## 3. Findings

### Q1 — `resolveMetamodelScope`

`JjodieContext.ts:87-114`, `private static resolveMetamodelScope(project: LProject, activeArtifact?: ActiveArtifact): LModel | null`.

- No `activeArtifact` → `null` (`:91`); the caller then walks the whole project.
- `level === 'M2'` → `project.metamodels.find(mm => mm.id === activeArtifact.id) ?? null` (`:94-96`).
- `level === 'M1'` → first `activeArtifact.metamodelId` (`:99-102`), otherwise the M1 model's
  `instanceof ?? metamodel` id (`:103-112`); `null` if neither matches.
- It never reads the selection or an explicit user argument itself. The `ActiveArtifact` is built by the
  caller, `Jodie.tsx:137-155`, from `getActiveModel()` first and `getActiveMetamodel()` second
  (`jjscript/executor/utils.ts:126`, `:61`). Both resolve in the order: artefact cache set by
  `EDITOR_TYPE_CHANGE` (`utils.ts:31-50`, populated at `Jodie.tsx:176-198`) → DockManager active tab
  (`utils.ts:94-113`, `activeId || tabs[0]?.id`) → `_lastSelected.modelElement`'s model (`utils.ts:72-83`) → `null`.
- The pool is `project.metamodels`, i.e. `data.metamodels ∪ state.m2models`, deduplicated (`joiner/classes.ts:3382-3391`).

Callers (both inside the file, the method is private):

| caller | line | live? |
|---|---|---|
| `extractFromProject(project, activeArtifact?)` | `JjodieContext.ts:126` | reached with an artefact only via `getContextString` (`:318`), which has **no caller** outside the file (`command grep` exit 1). Reached **without** an artefact by `getProjectHash` (`:609`, used by `DocumentationService.ts:188`) → project-wide, scope `null`. |
| `getContextJSON(project, activeArtifact?)` | `JjodieContext.ts:340` | **live**: `Jodie.tsx:156`, inside the `projectContext` memo keyed on `[state.idlookup.clonedCounter, editorChangeCounter]` (`:159`). |

### Q2 — `findClassByName`

`JjodieActionExecutor.ts:612-615`:

```typescript
private static findClassByName(project: LProject, name: string): LClass | undefined {
    if (!project.classes) return undefined;
    return project.classes.find((c: LClass) => c.name === name);
}
```

- **Pool**: `project.classes`, project-wide. `LProject.get_classes` = `packages.flatMap(p => p.classes)`
  (`classes.ts:3513-3516`); `get_packages` = `metamodels.flatMap(m => m.allSubPackages)` (`:3509-3512`);
  `metamodels` as in Q1. Classes only: enumerators and datatypes are not searched.
- **Match**: exact (`===`), case-sensitive.
- **Plurality**: first match in `metamodels → allSubPackages → classes` order (`Array.find`); homonyms are never seen.
- **Miss**: `undefined` (also when `project.classes` is falsy). Twelve callers turn it into
  `Metaclass "…" not found`; two drop it silently: `:116-120` (superclass not set, class still created) and
  `:474-477` (reference retarget skipped, other changes applied).
- Adjacent, not a `findClassByName` site: `createMetaclass` writes into `project.packages?.[0]`
  (`:80`), i.e. the first package of the first metamodel, whatever the scope.

### Q3 — the 14 call sites

`command grep -rn "findClassByName" frontend/src` → 15 lines: 1 declaration (`:612`) + **14 calls**.
No function in the file has a scope in hand: `execute(action, project)` (`:29-32`) and every handler
`(action, project)` take no metamodel, and `resolveMetamodelScope` is `private` in another class. So
«scope available» and «passed on» are **no** on every row.

| # | file:line | Jjodie action | name looked up | scope available | passed on | on miss |
|---|---|---|---|---|---|---|
| 1 | `JjodieActionExecutor.ts:116` | `CREATE_METACLASS` | `data.superclass` | no | no | silent skip |
| 2 | `:145` | `DELETE_METACLASS` | `data.name` | no | no | error |
| 3 | `:178` | `ADD_ATTRIBUTE` | `data.metaclassName` | no | no | error |
| 4 | `:223` | `REMOVE_ATTRIBUTE` | `data.metaclassName` | no | no | error |
| 5 | `:265` | `ADD_REFERENCE` | `data.sourceMetaclass` | no | no | error |
| 6 | `:266` | `ADD_REFERENCE` | `data.reference.targetMetaclass` | no | no | error |
| 7 | `:321` | `REMOVE_REFERENCE` | `data.metaclassName` | no | no | error |
| 8 | `:363` | `ADD_CONSTRAINT` | `data.metaclassName` | no | no | error (the action itself writes nothing, `:370-372`) |
| 9 | `:397` | `MODIFY_ATTRIBUTE` | `data.metaclassName` | no | no | error |
| 10 | `:452` | `MODIFY_REFERENCE` | `data.metaclassName` | no | no | error |
| 11 | `:474` | `MODIFY_REFERENCE` | `changes.targetMetaclass` | no | no | silent skip |
| 12 | `:513` | `SET_SUPERCLASS` | `data.metaclassName` | no | no | error |
| 13 | `:514` | `SET_SUPERCLASS` | `data.superclassName` | no | no | error |
| 14 | `:558` | `REMOVE_INHERITANCE` | `data.metaclassName` | no | no | error |

The parser's validation (`JjodieActionParser.ts:281-454`, 14 `existingClasses.includes(...)` checks) works on a
bare name list with no metamodel either — the 2026-09-11 report's «parser and executor can disagree».
All of the above is unreachable (§0.2).

### Q4 — which path do Jjodie actions take

**Only the JjScript path is live.** The structured-action path (`JjodieActionParser` → `JjodieActionExecutor`
→ `ActionConfirmation`) has no importers (§0.2). Three live entry points, all ending in the JjScript executor:

1. **LLM reply with a JjScript block** (the default, and mandated: `constants/defaultPrompts.ts:57-63`,
   «JjScript is the ONLY way to create metamodel elements»). `MarkdownRenderer.tsx:92-125` shows «Run» on a
   JjScript-looking block → `ScriptBlock` (`:112-117`, no `availableTargets`, no target id consumed) →
   `ChatMessages.tsx:388-438` `handleJjScriptExecute` → `JjScriptService.execute(command)` (`:416`).
2. **Jjodie-mode offer** (typed input that parses as JjScript): `Jodie.tsx:489-500` → `handleOfferExecute`
   (`:655-673`) → `jjscriptProvider.run` → `JjScriptService.execute` (`jjscriptProvider.ts:21`).
3. **JjScript console mode**: `Jodie.tsx:433-484` → same provider.

`JjScriptService.execute` (`jjscript/services/JjScriptService.ts:23-62`) reads the UI **at execution time**:
`level = getActiveLevel()`; at M1, `targetMetamodelId` = the active model's `instanceof`; otherwise
`getActiveMetamodel()?.id` (`:47-49`). `executeCommand` (`executor.ts:337-346`) builds the context, and the
commands resolve through `resolvers.ts`. For `create attribute … in Person` (`create.ts:249-284`):

1. `getTargetMetamodel(context, project)` (`utils.ts:287-306`): `targetMetamodelId` → else active metamodel →
   **else `metamodels[0]`** (`:305`).
2. `resolveTargetInMetamodel(parent, targetMetamodel, parentKinds)` (`create.ts:260`) — scoped, silent,
   exact-first. `selectTarget`'s A1 ambiguity (`resolvers.ts:281-282`) can fire here only for homonyms
   **inside** the target metamodel, which `nameUniqueness` forbids.
3. Only on a scoped **miss**: `resolveTargetInProject` (`create.ts:262-268`), where A1 fires on a
   cross-metamodel exact plurality and `create.ts:301-309` returns
   `ambiguityMessage(...)` = `Ambiguous 'Person': A::Person, B::Person. Qualify as Metamodel::Name.`
   With a **single** candidate elsewhere it resolves there, silently.

Two JjScript sub-paths drop the A1 payload: superclass (`create.ts:434-441`) and reference type
(`:690-697`) fall back to `resolveElement(...)`, which returns `.element` only (`resolvers.ts:530-534`); an
ambiguity becomes `null` and the `extends`/`type` is silently not written. Those are lane C's territory
(`createReference`), noted as overlap, not analysed further.

### Q5 — what the LLM sees

The system prompt is `PromptService.getRendered('chat', { customVariables: { projectContext } })`
(`AIProviderService.ts:75-79`), injected at `defaultPrompts.ts:257-262`. `projectContext` is two things
concatenated (`jjodieProvider.ts:36-47`):

**(a) The structural context — scoped.** `getContextJSON` (`JjodieContext.ts:338-386`):

| active artefact | JSON sent | class names |
|---|---|---|
| M2 metamodel | `{ currentlyEditing, metamodel }` — `buildMetamodelDocumentLight(scope)` | **one metamodel**; bare `name` per class (`JsonModelService.ts:243-244`), grouped under `metadata.name` (`:521-528`) and `packages[].name` |
| M1 model | `{ currentlyEditing, model, conformance }` — metamodel embedded | one metamodel, bare |
| none resolves | `{ metamodels: [ … ] }` — every metamodel | **whole project**, bare, each document carrying its own `metadata.name` |

A cross-metamodel reference type is emitted as `{ name, package, metamodel: { name, nsURI } }`
(`JsonModelService.ts:329-343`; `id` is stripped by `LIGHT_OMIT_KEYS`, `:481-483`). No `Metamodel::Class`
string appears anywhere.

**(b) RAG «Relevant Information» — project-wide.** Appended when RAG is initialised, from the index built by
`JjodieRagService.projectToDocuments` (`:131-280`) over **`project.classes` and `project.enumerators`**:
an overview titled `# <project> Metamodel` listing every class of every metamodel (`:147-153`), one
`# Class: <name>` document per class (`:179-246`), no metamodel name in either. Re-indexed every 30 s
(`Jodie.tsx:299-301`). So with `B` in scope, a retrieved snippet can put `A`'s classes in front of the
model, unqualified.

**The prompt never teaches qualification.** `command grep -c "::" defaultPrompts.ts` → 2, both OCL
`context ClassName::…` (`:443`, `:447`); positive control `create attribute` → 21. The JjScript syntax
reference uses bare `in ClassName` (`:65-84`).

### Q6 — minimal repro for localhost

**Setup**: one project, metamodel `A` created first, then `B`; both declare a class `Person`. Open `B`'s
metamodel tab and click into it (fires `EDITOR_TYPE_CHANGE`). Open Jjodie, ask: «add an attribute `age` of
type int to Person». Expected reply: a block with `create attribute age in Person type int`. Click **Run**.

**Where the write lands today: in `B`.** Code path:
`Jodie.tsx:149-155` (artefact `B`, M2) → `getContextJSON` shows `B` only → Run → `ChatMessages.tsx:416` →
`JjScriptService.ts:36-49` (`level` M2, `targetMetamodelId = B`) → `create.ts:249` →
`utils.ts:291-293` returns `B` → `create.ts:260` `resolveTargetInMetamodel(Person, B, …)` → `B.Person`.
The scoped-first rule is covered by the committed bench: `resolvers.test.ts:538` (scoped to one metamodel,
no ambiguity) and `:433` (the scoped metamodel wins over another that spells the name the same way);
`npx vitest run src/jjscript/executor/__tests__/resolvers.test.ts` → **54 passed, 0 failed** on this tree.
**Not run on localhost in this round**: the verdict is from the code path and the bench, and the UI check
is Alfonso's.

The prompt's described outcome («first metamodel that has the class», i.e. `A`) is what
`JjodieActionExecutor.findClassByName` would do — unreachable. The variants below are the ones where the
**live** path writes outside the scope Jjodie showed; each is a code-path reading, none reproduced here:

| # | variant | what the LLM saw | where the write lands | why |
|---|---|---|---|---|
| V1 | no active artefact resolves (no editor tab reachable, nothing selected) | `metamodels: [A, B]` | **`A`**, silently | `JjScriptService.ts:48` gives `undefined`, `utils.ts:305` falls back to `metamodels[0]` |
| V2 | ask with `B` focused, then focus `A`'s tab, then click Run on the old reply | `B` | **`A`**, silently | the scope is read at Run time (`JjScriptService.ts:36-49`), not when the context was built (`Jodie.tsx:129-159`) |
| V3 | `Person` only in `A`, `B` focused, the model names `Person` (e.g. from a RAG snippet) | `B` + project-wide RAG | **`A`**, silently | scoped miss → project fallback with a single candidate (`create.ts:262-268`) |
| V4 | the model writes `A::Person` with `B` focused | `B` | **`A`**, explicitly | scoped walk misses on segment `A`, project walk resolves the qualified path |
| V5 | both declare `Person`, but `B`'s is named `person` | `B` | — | not analysed (case-only across metamodels on the scoped leg); listed so it is not assumed covered |

### Q7 — reuse the A1 payload, or resolve within the scope silently

Described, not decided. Costs given for both paths, because the live one and the one the prompt names are different.

**Option Q — the model qualifies, A1's payload is the feedback.**

- *Live path (JjScript)*: no resolver change — `ambiguityMessage` / `QUALIFY_ADVICE` already reach the
  result line through `create.ts:301-309`, and `Metamodel::Name` already resolves (`resolvers.test.ts:531`).
  What is missing is on Jjodie's side:
  - `constants/defaultPrompts.ts`: teach `Metamodel::Name` in the syntax reference and when to use it;
  - `services/PromptService.ts:25-34`: a `CRITICAL_MARKERS`/`PROMPT_VERSION` bump, or stored custom prompts
    keep the old text;
  - `services/JjodieRagService.ts:151,183` (and titles `:234`): qualify the RAG class names, or the snippets keep
    offering bare homonyms;
  - optionally `JjodieContext.getContextJSON`: a qualified list alongside the documents.
  - **Call sites changed: 0 resolver sites**; 2-3 files. Limit: A1 fires only on the project-wide leg, so
    in V1/V2 (scoped leg on the wrong metamodel) there is no ambiguity to feed back; and V4 shows that a
    qualified name deliberately crosses the active scope. Whether a failed Run line can be sent back to
    Jjodie was not verified: `onAskFromError` is wired to the JjScript-provider card (`Jodie.tsx:794`), and
    `command grep` finds no `onAskFromError`/`onAskJjodie` in `ScriptBlock.tsx` or `MarkdownRenderer.tsx` (exit 1).
- *Dead executor*: `findClassByName` would have to return `{ element, ambiguousWith }`; **14 call sites**
  change to handle the new shape, plus the parser's 14 name checks. 2 files.

**Option S — Jjodie resolves inside the scope it showed, silently.**

- *Live path (JjScript)*: pin the scope at the moment the context is built and carry it to Run, instead of
  re-reading the UI at click time. Touches:
  - `components/Jodie/Jodie.tsx` or `console/providers/jjodieProvider.ts`: stamp the scope id on the assistant message;
  - `types/jodie.ts`: one **optional** field on `ChatMessage` (rule 11 allows it);
  - `components/Jodie/ChatMessages.tsx`: `MessageBubble` binds the stamped id into `handleJjScriptExecute`;
  - `jjscript/services/JjScriptService.ts`: an optional `targetMetamodelId` override on `execute`.
  - **Call sites changed: 1** (`ChatMessages.tsx:416`); 0 resolver sites; 4 files. This closes V2. V1 (no
    scope at all) is not closable from Jjodie: it is `utils.ts:305`'s `metamodels[0]`, a JjScript-wide
    default. V3 is `create.ts:262-268`'s project fallback, also JjScript-wide.
- *Dead executor*: `findClassByName(project, name, scope)` — 1 signature + **14 call sites** + `execute`
  gaining a scope argument, + the parser's name list. 2 files.

---

## 4. Dependencies and risks

- **R1 — overlap with lane C.** Neither option's live variant edits `resolvers.ts` or `nameLookup.ts`.
  Option S touches `jjscript/services/JjScriptService.ts`; closing V1/V3 would touch `jjscript/executor/utils.ts`
  and `commands/create.ts`, which lane C is editing (`createReference`). Sequence after lane C closes.
- **R2 — the fix target.** A fix applied to `JjodieActionExecutor` changes nothing a user can observe.
  Rule 9 forbids removing «apparently unused» code without a decision; the family is 7 files
  (`JjodieActionExecutor.ts`, `JjodieActionParser.ts`, `ActionConfirmation.tsx`, `ActionSuggestion.tsx`,
  `MetamodelPreview.tsx`, `types/jjodieActions.ts`, and the `jjodie-integration/` directory).
- **R3 — RAG is project-wide and unqualified**, independent of the scope fix (§3 Q5b). Its change hash
  (`JjodieRagService.ts:81-126`) is built from bare names, so `A.Person` and `B.Person` contribute identical parts (`class:Person`) and
  the index cannot tell them apart.
- **R4 — prompt persistence.** A default-prompt change does not reach users with a stored custom `chat`
  prompt unless `CRITICAL_MARKERS` or `PROMPT_VERSION` moves (`PromptService.ts:25-34`). Not a VersionFixer
  matter (no `jsxString`).
- **R5 — `resolveElement` swallows A1** in the superclass and reference-type fallbacks (`create.ts:434-441`,
  `:690-697`, `resolvers.ts:530-534`). Lane C's.
- **R6 — no critical-zone file** (CLAUDE.md §3.1) in this perimeter. No Layer Impact Report due.

## 5. Open questions for Alfonso

1. **Target**: the live JjScript path (V1-V4), the dead executor, or both? The prompt's defect is only in the second.
2. **The dead action family** (R2): leave with `// TODO: cleanup`, delete in a lane of its own, or wire it back?
3. **Option Q vs S** for the live path, and whether a qualified name written by Jjodie may cross the active
   scope (V4) or must be refused.
4. **V1, no scope**: keep `metamodels[0]`, or refuse to run a Jjodie script when no metamodel is active?
   This is a JjScript-wide default, not a Jjodie one.
5. **V3, project fallback for `needsParent` types** (`create.ts:262-268`, «backward compatibility»): keep it
   for Jjodie-originated scripts, or restrict to the scope?
6. **RAG** (R3): scope retrieval to the active metamodel, qualify its names, or leave it?

---

**HARD STOP.** Phase 1 closed. No source modified. Working tree at the end carries the other lanes'
files unchanged (`ProjectEditor.tsx`, `ValidationRulesModal.*`, `discovery_2026-09-14_unique_model_name_delegation.md`,
the four prompt files), none staged by this lane.
