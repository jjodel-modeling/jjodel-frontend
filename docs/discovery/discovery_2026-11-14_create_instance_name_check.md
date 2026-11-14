# Discovery: `create instance` checks the name against the whole model

- Prompt-ID: P-2026-11-14-2146
- Prompt file: `docs/prompts/claude_2026-11-14_2146_prompt_jjscript_create_instance_name_check.md`
- Session: 6984ca61-a4e2-4296-a675-2554a46009bc
- Tree: `~/jjodel-w-create-instance-name`, branch `create-instance-name`, HEAD `22cf59a25`
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- Phase 1, read-only. This report is a set of hypotheses with evidence, not a reference: whoever uses it
  re-reads the real files.

Everything below was **read** on HEAD `22cf59a25`. Nothing was run in this phase. The book probe results
quoted in section 1 were **measured** by book lane P-2026-11-14-2100 on the trunk of that day.

## Objective

Find where `create instance` names an instance, which checks it applies, and what `rename instance` and the
canvas check. Then propose the smallest change that makes `create instance` refuse a name another instance of
the model already bears, with the scope and error `rename instance` uses.

## Hypotheses under test

1. **H1** `create instance` applies no model-wide name check. **Holds** (F2).
2. **H2** Two creates with one name in one run are already refused. **Holds**, with `HANDLE_IN_USE`, not
   `NAME_CONFLICT` (F2).
3. **H3** `rename instance` checks names in a function that `create` can call as it is. **Partly**: the check
   is inline in `executeRenameInstance`. Its lookup, `findInstanceByName`, is exported and reusable (F3).
4. **H4** Every runtime path reaches one handler. **Holds** for the executor. The preview and dry run do not
   reach it: they reach a mirror in `effectsPlanner.ts` that has to change too (F1).
5. **H5** A generated name can collide with an existing one. **Falsified** (F2).
6. **H6** The canvas checks a narrower scope (the container), and JjScript does not call that check.
   **Holds** (F4).
7. **H7** No test, probe, example or prompt text relies on a duplicate. **Holds** on the files searched
   (F6). This was read, not run.

## Files read (full paths)

- `/Users/alfonso/jjodel-w-create-instance-name/frontend/src/jjscript/executor/commands/instance.ts` (lines 125-304, 596-763, 895-998)
- `/Users/alfonso/jjodel-w-create-instance-name/frontend/src/jjscript/executor/commands/create.ts` (lines 228-238, 366-395)
- `/Users/alfonso/jjodel-w-create-instance-name/frontend/src/jjscript/executor/effectsPlanner.ts` (lines 400-461, 574-590, plus a grep outline)
- `/Users/alfonso/jjodel-w-create-instance-name/frontend/src/jjscript/executor/executor.ts` (lines 255-268, 455-525)
- `/Users/alfonso/jjodel-w-create-instance-name/frontend/src/jjscript/executor/runPasses.ts` (lines 94-143)
- `/Users/alfonso/jjodel-w-create-instance-name/frontend/src/jjscript/executor/handleRegistry.ts` (grep outline)
- `/Users/alfonso/jjodel-w-create-instance-name/frontend/src/jjscript/executor/errors.ts` (lines 440-459)
- `/Users/alfonso/jjodel-w-create-instance-name/frontend/src/jjscript/executor/commands/forall.ts`, `let.ts` (grep)
- `/Users/alfonso/jjodel-w-create-instance-name/frontend/src/model/logicWrapper/nameUniqueness.ts` (lines 1-60, 245-275)
- `/Users/alfonso/jjodel-w-create-instance-name/frontend/src/components/Jodie/consumerProposalModel.ts` (grep, line 342)
- `/Users/alfonso/jjodel-w-create-instance-name/frontend/src/constants/defaultPrompts.ts` (lines 232-253)
- `/Users/alfonso/jjodel-w-create-instance-name/frontend/src/jjscript/executor/__tests__/m1Containment.test.ts` (lines 1-60)
- `/Users/alfonso/jjodel-w-create-instance-name/frontend/src/jjscript/executor/__tests__/effectsPlanner.test.ts` (lines 96-106, 185-200)
- `/Users/alfonso/jjodel-book-w-book32/author/discovery/discovery_2026-11-14_gpt_review_third_part.md` (section 12, lines 362-397)
- An explorer subagent read every executing hit of `command grep -rliE "create +instance"` over `frontend/src`,
  `frontend/scripts` and `docs`. It decoded the probe fixtures `scripts/probe/fixtures/*.jjodel` to list
  their instance names. Its gap: `src/__tests__/fixtures/xmi-m1/*` was not decoded (F6).

## Findings

### F1. Where `create instance` runs (item 1)

**Runtime.** Every path ends in `executeCreateInstance`:

- `create.ts:234-236`: `// M1 routing: 'create instance <ClassName>' delegates to the instance handler.` /
  `return executeCreateInstance(args, context, project);`
- The single entry point is `JjScriptExecutor.execute` → `executeAST`, at `executor.ts:95` and `:102`.
- A `do … end` block loops through `executeAST`: `executor.ts:265`, `lastResult = await this.executeAST(cmd, context);`.
- `forall … do` goes through the same call: `forall.ts:94`, `const result = await executor.executeAST(resolvedBody, childContext);`.
  `let` does as well, at `let.ts:55`.
- A batch, `executeBatch`/`executeScript` at `executor.ts:480-519`, calls `executor.execute(trimmed)`.
- Run in a script block calls `runPasses` (`ScriptBlock.tsx:606`, `:958`).
- Jodie's Apply calls `JjScriptService.execute` (`ChatMessages.tsx:541`). That function wraps `executeCommand`
  (`JjScriptService.ts:60`).
- The Console calls `executeCommand` (`JjScriptConsole.tsx:51`, `jjscriptProvider.ts:38`).
- The preview bar calls `JjScriptService.execute` (`PreviewBar.tsx:89`).

**Preview and dry run.** These paths never call the executor. They call `planEffects` (`effectsPlanner.ts:1055`),
and its create is `planCreate` (`:416`), a line-by-line mirror of the handler:
`/** \`executeCreateInstance\` (\`instance.ts:491-658\`) and \`resolveContainerSlot\` (\`:415-485\`). */`. The
mirror's line references predate the current file. Four callers use it: `ScriptTab.tsx:137`,
`scriptPreviewStore.ts:102`, `ScriptEditorView.tsx:91` and `ScriptCard.tsx:102`. **The fix must land in both
places**, or the preview will show a create that Apply then refuses.

**Retry passes.** `NAME_CONFLICT` is not in either deferrable set (`runPasses.ts:94-110`), so a refusal is
final on pass 1. This is right: the name is taken now. A create deferred on an unresolved container
(`INSTANCE_NOT_FOUND`) runs the name check again when it is retried.

### F2. How it names the instance (items 2 and 5)

- The explicit name is read at `instance.ts:614-617`:
  `args.options?.defaultValue?.kind === 'string' ? args.options.defaultValue.value : undefined`.
- The only name check is at `instance.ts:688-703`:
  `const instanceName = explicitInstanceName ?? generateInstanceName(className, targetModel, getReservedHandles());`
  followed by `if (hasHandle(instanceName)) { … code: 'HANDLE_IN_USE' …`. The comment at `:690-692` says:
  "An explicit handle can only be claimed once per script run". **No lookup in the model.** This matches the
  book probe (report section 12, lines 372-375): `"t"` is created in a sibling slot, in another container
  and at the root, and only a second `"t"` in the same run is refused.
- **Generated names cannot collide** (H5 falsified). `generateInstanceName` at `instance.ts:286-297` takes
  every name in the model (`allModelInstances`, roots and contained) and the handles reserved in this run,
  then returns `<Class>`, `<Class>2`, and so on, free of both: `// Model-wide (R-JS-10): a name a contained
  instance holds would make the new one ambiguous.`
- **Within one run** (item 5), `hasHandle` is what sees the instances just created. The model cannot see them
  yet: `instance.ts:163-167` says `DObject.new` puts the object in the store at once, but its "place in the
  model land[s] … about 300 ms later". So `findInstanceByName` alone would miss an instance created a few
  lines earlier. The registry is cleared on `EXECUTION_START` (`handleRegistry.ts:97-104`). A rename moves the
  handle (`renameHandle`, `instance.ts:979`), and a delete unregisters it (`instance.ts:868`). So
  `create S; rename S to "T"; create S` stays legal, and the planner test at `effectsPlanner.test.ts:193`
  pins that.
- **Preview** (item 5): `planCreate` checks the simulated handles in the same way
  (`effectsPlanner.ts:449`, `if (sim.handles.has(name)) return fail('HANDLE_IN_USE', …)`). Its `sim.live()`
  (`:313`) holds the world's elements (every instance of the model, roots and contained, per `planWorld.ts:13`)
  plus those the plan created, minus those it deleted. So a check over `sim.live()` sees the preview state.

### F3. What `rename instance` checks (item 3)

`instance.ts:953-965`, inline in `executeRenameInstance`:

```
const conflicts = findInstanceByName(targetModel, args.newName)
    .filter((o: any) => o?.id !== lObject.id);
if (conflicts.length > 0) {
    return { success: false, command: 'rename',
        message: `An instance named '${args.newName}' already exists`,
        errors: [{ code: 'NAME_CONFLICT', message: `Pick a different name` }] };
```

- The scope is the whole model: `findInstanceByName` (`:130-132`) filters `allModelInstances` (`:140-160`).
- The check is not a function `create` could call. Its reusable part, `findInstanceByName`, is already in
  scope in `instance.ts`.
- The planner mirrors it at `effectsPlanner.ts:583-585`:
  `sim.live().some((o) => o.name === args.newName && o.id !== e.id)` → `NAME_CONFLICT`.
- The match is case-sensitive, and the empty name is refused earlier (`INVALID_NAME`, `:909-917`).
- `rename` does not consult the run's handles, only the model.

**What the dialog shows**: `errorFromResult` takes `result.message || first?.message` (`errors.ts:445`) and
maps an unknown code to `OPERATION_FAILED` (`:449-451`). The visible sentence is therefore the top-level
`message`, so the name of the holder has to go there.

### F4. What the canvas checks (item 4)

The canvas scope is the siblings under one father. `nameUniqueness.ts:17-21`: "the namespace is the set of
SIBLINGS under the same father … Rootable LObject (father is an LModel): whole-model namespace. Nested LObject
…: the other LObjects held in the same containment."

- Its consumers are listed at `:39-42`: `set_name`, `set_father`, `addObject` and `createAdapter`.
- `:43-45` says "Declared and NOT closed in S1a: the three creates that call `DObject.new` directly (jjscript,
  ProjectEditor seeding, canvasToJjom)".
- Note the asymmetry. A root's namespace there is the whole model only for the roots, because
  `getNamespaceOf` takes `father.allSubObjects` for an `LModel` (`:175-177`). A contained `t` in
  `cooking.transitions` and another in `idle.transitions` are legal on the canvas.

This lane leaves the canvas alone. JjScript's model-wide rule is narrower in what it allows, so a script can
no longer create what the canvas would allow in two different containers. That is the decision.

### F5. M2 for comparison (item 7)

M2 creates consult the shared rule before writing. `create.ts:376-381`:
`uniqueness = checkM2NameUniqueness({ father: parentElement, kind: m2kind, name }); const refusal =
duplicateNameRefusal(…); if (refusal) return refusal;`. The translation into a result lives in
`m2CreateGuard.ts:90`. M2 `rename` uses the same function (`rename.ts:140`), with `NAME_CONFLICT` at
`rename.ts:148`. M2 is untouched here.

### F6. What breaks (item 6)

These are explorer results (read, not run). **No test, probe, example or prompt text relies on creating a
duplicate.** Four places need care:

1. **`effectsPlanner.test.ts:96-106`** asserts `['ABSTRACT_CLASS', 'SINGLETON_CLASS', 'HANDLE_IN_USE']` for a
   second `"S"` in one script. It relies on `HANDLE_IN_USE` coming first. If the new check stays after the
   handle check, the test stays green. If the new check came first, or replaced the handle check, the test
   would change. It relies on the refusal, not on a duplicate being created.
2. **`effectsPlanner.test.ts:193`** runs `create S; rename S to "T"; create S` and expects two creates named
   `S`. A check over current names passes it, because after the rename no live element is called `S`. It
   relies on the name being free again, which is correct.
3. **`m1Containment.test.ts:20-30`**: the mocked `DObject.new` stores the object by id but never adds it to
   `model.objects`. So in a test there, a same-run duplicate is visible only through the handle registry,
   which is what F2 says about the real runtime. No test creates one name twice today.
4. **`scripts/probe/petri-drag-loop.ts:506-508`** creates p1-p3, t1, t2 and a1-a4. These names exist in
   `scene_2_DemoPetri.jjodel`, but the probe runs them on a fresh `createM1` model (`:339`), so it is clean.
   `codegen/examples/petri-producer-consumer/petri-producer-consumer.json:651` holds 19 creates with distinct
   names. Its README (`:130-134`) says to run them on a new model. Run on the model the same JSON imports,
   they would now be refused. That refusal is the intended behaviour.

**Clean.** These are the remaining executing tests, with their fixture names checked against the names they
create:

- `effectsPlannerM2.test.ts`, `planWorld.test.ts`, `scriptPreview.test.ts` and `scriptCardModel.test.ts`.
- `consumerProposal.test.ts` (it does not execute), `runPasses.test.ts` (mocked executor) and
  `permissionGuard.test.ts`.
- The Jodie probes (`jjodie-*.ts`, `refactoring-*.ts`, `jjscript-m1-containment.ts` E1-E6), which run on fresh
  models, and the example prompt in `defaultPrompts.ts:286-291` (`start` and `Start` differ by case).
- Parser, formatter, highlighter and validator tests do not execute.
- The `codegen/textual` generators already avoid taken names (`modelLines.ts:102`, `textDiff.ts:492-503`).

**Positive control for the absence claims.** The same grep (`command grep -rliE "create +instance"`) returned
the files listed in the starting set, so the search reached them. Its gap: the XMI fixtures under
`src/__tests__/fixtures/xmi-m1/` were not decoded. Only `nested-vertices.ts` uses them, creating `ProbeChild`
and `ProbeRoot`.

**A consumer that would print `undefined`.** `consumerProposalModel.ts:342` renders `NAME_CONFLICT` as
``Another element is already called "${step.newName}".``, but only a rename step has `newName`
(`:219-222`). A create step carries its name in `subject` (`:188`). Once `create` can return
`NAME_CONFLICT`, Jodie's consumer proposal would print `called "undefined"`. Found by
`command grep -rn "NAME_CONFLICT\|HANDLE_IN_USE"` over `frontend/src`, outside tests and the two executor
files. The only hit was this file.

### F7. Where the command is documented

- **There is no JjScript SPEC or command reference in this repository.** The search was
  `command grep -rl "create instance"` over `docs`, `frontend/public` and `frontend/src` for `.md`, `.html` and
  `.json`, excluding discovery, logs, prompts and archives. It returned `docs/spec/concern_languages.md`
  (lines 41 and 70, grammar only), `docs/jjom-api-extracted.md`, `docs/decisions.md`, `jjtl/SPEC.md` and the
  Petri example, so the search ran.
- No hit describes the names `create instance` accepts or the error catalogue.
- `help.ts` has no line about instances (`command grep -n "instance"` returned nothing).
- The reference is the book's `appendix-jjscript.tex`, in the other repository, which the chat updates after
  this lane.
- The only text in this repository that tells an author how to name a created instance is Jodie's system
  prompt, at `defaultPrompts.ts:244-246`: "Always pass an explicit quoted `"instanceName"` so the instance can
  be referenced later …". It does not say "a name no other instance holds".

## Dependencies and risks

- **Critical zone and layers.** The change adds a read-only lookup before `DObject.new` in `instance.ts`. It
  adds no new write and no TRANSACTION, and does not touch `useJjomSync.ts` or `portDistribution.ts`.
  `instance.ts` contains a D-layer creator, so the `PreToolUse` hook of RC-15 (2) may ask for the Layer Impact
  Report. I will write it in chat before the Phase 2 diff.
  `consumerProposalModel.ts` is a Jodie UI file, a layer the prompt does not name (rule 20). It is flagged
  here and goes in only with the GO.
- **Order of the checks.** The new check goes after the `HANDLE_IN_USE` check and after the container
  resolution, so the existing codes and the deferral of an unresolved container keep their meaning. A same-run
  duplicate stays `HANDLE_IN_USE`, which pins F6.1. A duplicate of an instance the model already shows becomes
  `NAME_CONFLICT`.
- **Model lag.** The model check cannot see an instance created in this run until it lands (F2). The handle
  check covers that window. That gap is the residual loophole below.
- **Residual loophole, out of this lane.**
  - `set x.name = "y"` writes the name attribute with no JjScript check, and the `HANDLE_IN_USE` text says
    so: "the 'name' attribute can still be set to any (even duplicate) value afterwards" (`instance.ts:700`).
  - The handle `x` keeps pointing at the instance now called `y`. A later `create … "y"` in the same run
    can slip through the model lag.
  - The canvas rename is sibling-scoped (F4), so two containers can still end up holding one name.
- **Behaviour change for the user.** A script that recreates the names of a model it is run on (the Petri
  example run twice, a Jodie proposal applied twice) is now refused at its first create instead of producing
  unaddressable twins.

## Proposed change for Phase 2

Six files, which is more than five (rule 19). They are listed here so that the GO confirms them.

1. **`frontend/src/jjscript/executor/commands/instance.ts`**, `executeCreateInstance`. Right after the
   `HANDLE_IN_USE` block (`:693-703`), before `DObject.new`:
   ```ts
   const holders = findInstanceByName(targetModel, instanceName);
   if (holders.length > 0) {
       const c = toCandidate(holders[0]);
       return { success: false, command: 'create',
           message: `An instance named '${instanceName}' already exists: ${c.className ? `${c.className} (${c.id})` : c.id}`,
           errors: [{ code: 'NAME_CONFLICT', message: 'Pick a different name' }] };
   }
   ```
   - The scope, code and `errors[0].message` are those of `rename instance`. The top-level message adds the
     holder, because the dialog shows that line (F3).
   - The holder is named in the `Class (id)` form that `describeAmbiguity` already uses (`:223-229`).
   - The check also runs on a generated name, where it never fires (F2). It is a no-op there that proves the
     invariant.
   - No identifier is renamed, and no helper is created.
2. **`frontend/src/jjscript/executor/effectsPlanner.ts`**, `planCreate`. After `:449`, add
   `const holder = sim.live().find((e) => e.name === name);` and, when it is found, `fail('NAME_CONFLICT', …)`
   with the same sentence built from `holder.className` and `holder.id`. This keeps the preview, the dry run
   and Jodie's script card in step with Apply.
3. **`frontend/src/components/Jodie/consumerProposalModel.ts:342`**: `step.newName ?? step.subject`, so a
   refused create reads `Another element is already called "t".` (F6). This is outside the named layers and
   needs the GO.
4. **`frontend/src/jjscript/executor/__tests__/m1Containment.test.ts`**, executor tests on the in-memory model:
   - an existing root `idle`: `create instance of State "idle"` → `NAME_CONFLICT`, `h.created` empty, and the
     message names `idle`'s class;
   - the probe case, a contained `t` in `idle.transitions`: `"t" in cooking.transitions`, `"t" in
     idle.transitions` and `"t"` at the root are each refused, with nothing created;
   - one script, `"s"` twice: the second is refused (`HANDLE_IN_USE`), one created;
   - two different names both pass;
   - a fixture holding `State` and `State2`: a create with no name produces `State3` and is created;
   - `rename instance ta to tb` with `tb` in another container stays `NAME_CONFLICT` with the unchanged message
     `An instance named 'tb' already exists`.
5. **`frontend/src/jjscript/executor/__tests__/effectsPlanner.test.ts`**:
   - creating `M` (a root of the world) and `A` (a contained instance of the world) each fails with
     `NAME_CONFLICT` at its line, with nothing in `plan.created`;
   - the existing tests at `:96` and `:193` stay unchanged and green.
6. **`frontend/src/components/Jodie/__tests__/consumerProposal.test.ts`**: `failureText` of a create step with
   `NAME_CONFLICT` names the subject.

**Docs.** No in-repo SPEC or command reference describes `create instance` or the error catalogue (F7), so
the docs update the prompt asks for has no target here. See Q2 and Q3. The log entry goes in
`docs/log-inbox/maintenance.md`, closing ticket #938.

**Gates.**
- `npm run typecheck` (zero errors).
- The JjScript tests, `vitest run src/jjscript`, plus `consumerProposal.test.ts`.
- `npm run build`.

**Visual line**, in the Console of an M1 model that has an instance `x`:
`create instance of <Class> "x"` → `An instance named 'x' already exists: <Class> (<id>)`. In Jodie's script
panel, the same line shows the refusal in the preview before Apply.

## Open questions for Alfonso

1. Should the refusal name the holder as `Class (id)`, as the ambiguity message does, or by its place
   (`Transition in idle.transitions` / `at the root`)? The place needs a new path builder.
   Recommended: `Class (id)`.
2. With no in-repo SPEC, should `defaultPrompts.ts:244` gain one clause ("a name no other instance of the
   model holds"), as a seventh file? Recommended: yes.
3. Is the book appendix, updated by the chat, the only command reference to change? Recommended: yes.
4. Should the `consumerProposalModel.ts` fix (F6, a Jodie UI file) be included? Recommended: yes, it is one
   expression and without it the refusal reads `"undefined"`.
5. Should the `set x.name = …` loophole (risks) be filed as a ticket, out of this lane? Recommended: yes,
   low priority.
