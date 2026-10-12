# Discovery: Jjodie and reserved identifiers, the single list and a pre-execution gate

Prompt-ID: P-2026-10-10-0045 · prompt `docs/prompts/claude_2026-10-10_0045_prompt_jjodie_reserved_identifiers.md` · chat C-2026-10-10-0039 · session `b4facabd-2752-46bc-8546-595f8c7602b2` · tree `~/jjodel-w-jjodiereserved`, branch `jjodie-reserved`, base and read HEAD `571392718` (clean at start) · executor Claude Opus 5.5 (`claude-opus-5-5`). This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the files. [M] = measured in this phase on `571392718` (vitest probe on the parser, node probe on `parse`, Playwright probe against this tree's own Vite on port 3047 with the model endpoint mocked). [R] = read. Every probe was temporary; §7 has the inputs and commands.

## 0. Answer in brief

**Answer.**
- `copy` is reserved by the JjScript **lexer**, as a command word (`jjscript/types.ts:580`, `lexer.ts:371`). No other layer is involved: not JjEL, not JjTL, not the L-proxy [M, R].
- The exact error is `Expected element name, found 'copy'` (`parser.ts:1312`) [M].
- The hypothesis is **partly falsified**. Jjodie's script does meet a whole-script check before execution: `validateScriptIntegrity` at `ScriptBlock.tsx:464` parses every line. It refused the `copy` script with **0 commands executed** and the model unchanged [M].
- What is missing [R]:
  - the check is about syntax, not reserved names;
  - nothing sends the failure back to the model;
  - Step skips the check.
- The JjScript lexer reserves **63 words**, all case-sensitive and lowercase [M]:
  - 24 can never be a name (22 commands, `true`, `false`).
  - 39 can be declared, but the element can then not be used as a parent, nor deleted or renamed by name.
  - Jjodie's rule 8 names 14 of the 63. It misses 49, `copy` among them. Its other 4 words (`String`, `int`, `boolean`, `Date`) are not lexer-reserved; they are primitive type names that hide a class of the same name in a `type` clause.
- **The freeze is not caused by the run or by `copy`** [M]:
  - Every Jjodie chat message is first parsed as JjScript (`Jodie.tsx:508`). A message that starts with `do` opens a `do…end` block (`parser.ts:173-180`).
  - The block loop never advances past a non-command word (`parser.ts:182-186`, `:1041`). It allocates until the heap runs out.
  - `do not use copy` blocked the tab's **main thread**: `press('Enter')` never returned, and the renderer crashed about 16 s later. The model was never called.
  - The same two runs with a second message that does not start with `do`: 7/7 commands executed, maximum heartbeat gap 402 ms.

**Recommendation.** Phase 2 as designed, with three amendments:
- the shared list is exact-case, matching what the lexer rejects;
- the repair loop sits where the reply arrives (`Jodie.tsx:600` and `:645`), the only place that can call the model again;
- the refusal of a still-violating script sits in `ScriptBlock` Run and Step.

That is 9 files (§4.5), above rule 19's five, so they are listed for the GO. Open the freeze as its own lane, high priority (§4.4).

**Decisions awaiting Alfonso (RC-26):**
1. **Case.** The prompt's D wants `isReservedIdentifier('Copy')` to be true. The lexer accepts `Copy`, `Class`, `Package`, `Model` and `Project` as names, and they run today [M]. A case-insensitive gate would force Jjodie to rename them, in exactly the metamodels of modelling languages where they are the domain words.
   Recommended: exact lowercase match, so `copy` is reserved and `Copy` is not; rule 8's wording follows.
2. **Primitive type names.** They are not lexer-reserved. A class named `Date`, `Object` or `String` parses, but every `type Date` resolves to the primitive, in any case (`grammar.ts:224`, `:235-239`) [M].
   Recommended: render them in rule 8 from `TYPE_ALIASES` (no hand-typed copy) and gate only class and enum declarations against them, case-insensitively.
3. **What the user sees after a repair.**
   Recommended: only the repaired reply, with one line naming the replaced identifiers. If the repair fails, the reply shows with Run refused and the names listed.

**Questions:** §6, four, each with its `Recommended:` line.

## 1. Hypotheses under test and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | `copy` is reserved by the JjScript lexer | **holds** | `COMMANDS` contains it (`types.ts:578-583`); `classifyIdentifier` returns `COMMAND` (`lexer.ts:371-373`); the parser accepts only `IDENTIFIER`/`KEYWORD` as a name (`parser.ts:1308`) and throws `Expected element name, found 'copy'` [M §4.1] |
| H1b | `copy` collides at the L-proxy level | **falsified** | no `copy` member in `LModelElement.tsx`, `joiner/classes.ts` or `joiner/proxy.ts`; no `get_copy`/`set_copy` anywhere [R, positive control §4.1.4] |
| H2 | Jjodie's output reaches the executor with no validation step in between | **partly falsified** | Run passes through `validateScriptIntegrity` (`ScriptBlock.tsx:464`), which parses every line and refuses the whole script: the `copy` script ran 0 commands [M]. It is a syntax check, not a name check: the 39 soft-reserved words pass it. Step (`ScriptBlock.tsx:621`) does not call it [R]. No path feeds a failure back to the model [R] |
| H3 (context) | the freeze follows the failed run | **falsified** | the freeze is the parse of the second chat message, before any model call [M §4.4] |

## 2. Goal

Answer the prompt's five items: where `copy` is reserved; every definition of reserved names; the path from Jjodie's reply to the executor; atomicity of a failed run and the two-run sequence; and the module and file list for Phase 2.

## 3. Files read (full paths under `/Users/alfonso/jjodel-w-jjodiereserved/`)

- `frontend/src/jjscript/types.ts` (1-70, 540-600)
- `frontend/src/jjscript/parser/lexer.ts` (100-200, 340-476)
- `frontend/src/jjscript/parser/parser.ts` (40-330, 526-575, 997-1095, 1268-1388)
- `frontend/src/jjscript/parser/grammar.ts` (215-240)
- `frontend/src/jjscript/executor/scriptValidator.ts` (whole)
- `frontend/src/jjscript/executor/runPasses.ts` (whole)
- `frontend/src/jjscript/executor/executor.ts` (55-130, 215-236, 380-470)
- `frontend/src/jjscript/executor/commands/eval.ts` (305-320, 605-620)
- `frontend/src/jjscript/executor/errors.ts` (91)
- `frontend/src/jjscript/components/ScriptBlock.tsx` (110-122, 165, 278-290, 360-620, 620-640, 824-950, 1190-1195)
- `frontend/src/jjscript/autocomplete/context.ts` (50-60, 120-136)
- `frontend/src/jjscript/autocomplete/types.ts` (345-400)
- `frontend/src/jjel/lexer/lexer.ts` (11-30, 403-440)
- `frontend/src/jjel/types/tokens.ts` (108-127)
- `frontend/src/jjel/stateReserved.ts` (whole)
- `frontend/src/jjtl/lexer/lexer.ts` (330)
- `frontend/src/jjtl/types/tokens.ts` (`JJTL_KEYWORDS`)
- `frontend/src/constants/defaultPrompts.ts` (1-30, 95-145, 673-706)
- `frontend/src/jjodie-integration/jjscriptGenerationPrompt.ts` (1-80)
- `frontend/src/services/PromptService.ts` (99-125)
- `frontend/src/services/AIProviderService.ts` (25-135, 273-334, 929-979)
- `frontend/src/types/jodie.ts` (159-240, 274-291, 379, 440-470)
- `frontend/src/components/Jodie/Jodie.tsx` (450-520, 575-665)
- `frontend/src/components/Jodie/console/providers/jjodieProvider.ts` (40-70)
- `frontend/src/components/Jodie/console/providers/jjscriptProvider.ts` (30-50)
- `frontend/src/components/Jodie/ChatMessages.tsx` (395-440)
- `frontend/src/components/common/MarkdownRenderer.tsx` (90-110)
- `frontend/src/model/conformance/nameShape.ts` (whole)
- `frontend/src/model/conformance/ConformanceValidator.ts` (1-40)
- `frontend/src/common/U.tsx` (1045-1165)
- `frontend/src/joiner/proxy.ts` (276-430)
- `docs/spec/claude_spec_2026-09-08_user_defined_validation.md` (§10, §12, §13)
- `docs/spec/concern_languages.md` (searched; no mention of reserved names, §4.2)
- `docs/decisions.md` (R-VAL-7, R-VAL-8, R-JS-3..11)
- `docs/PROTOCOL.md`

A read-only sub-agent traced the reply-to-executor chain. The hops this report quotes were re-read in this session: `Jodie.tsx`, `jjodieProvider.ts`, `jjscriptProvider.ts`, `ChatMessages.tsx`, `MarkdownRenderer.tsx`, `PromptService.ts` and `ScriptBlock.tsx`. The agent alone read three hops, and §4.3 marks them [R-agent]: `MarkdownRenderer.tsx:124-131/183/203`, `ChatMessages.tsx:71-75/175-179` and `MarkdownMessage.tsx:46-57`.

## 4. Findings

### 4.1 Where `copy` is reserved (item 1)

1. **The lexer** [R]:
   - `jjscript/types.ts:578-583`: `export const COMMANDS: CommandType[] = [ 'create', 'delete', 'rename', 'set', 'add', 'remove', 'move', 'copy', 'list', …`.
   - `jjscript/parser/lexer.ts:371-373`: `if (COMMANDS.includes(value as any)) { return 'COMMAND'; }`. The lookup is case-sensitive (`lexer.ts:365`: "Keywords are CASE-SENSITIVE and must be lowercase.").
2. **The parser** [R]. `parser.ts:1302-1313`, `expectIdentifierOrQualified`, accepts `QUALIFIED_NAME`, `IDENTIFIER` and `KEYWORD`. Anything else throws: `throw new Error(\`Expected ${what}, found '${token.value}'\`)`. `parseCreateCommand` calls it with `'element name'` (`parser.ts:278`).
3. **Reproduction** [M]. A vitest probe parsed the three lines `create class Library`, `create class Book` and `create reference copy in Library type Book`.
   - The first two parse.
   - The third gives `success=false`, errors `[{"message":"Expected element name, found 'copy'","position":{"line":1,"column":18}}]`.
   - Its tokens are `COMMAND:create KEYWORD:reference COMMAND:copy KEYWORD:in IDENTIFIER:Library KEYWORD:type IDENTIFIER:Book`.
   - At run time it is `PARSE_ERROR` (`executor.ts:75-85`).
   - In the browser, the integrity check showed `Syntax error at line 6: Expected element name, found 'copy'`, `Script not executed: 1 error`, `Nothing was executed.` and `0 commands executed` (§4.4).
4. **Other layers, ruled out**:
   - JjEL (`jjel/types/tokens.ts:108-127`, 18 words) and JjTL (`JJTL_KEYWORDS`, 26 words) do not contain `copy` [R]. Both tokenize `copy` as `IDENTIFIER` [M: `jjel copy: IDENTIFIER:x DOT:. IDENTIFIER:copy`, `jjtl copy: IDENTIFIER:x IDENTIFIER:copy`].
   - L-proxy [R]. `command grep -n -i -w "copy"` returned:
     - 0 lines in `model/logicWrapper/LModelElement.tsx`;
     - 0 lines in `joiner/proxy.ts` (exit 1);
     - 1 line in `joiner/classes.ts`, a string (`:3686` `c.data.name + ' Copy'`).

     `command grep -rn -w -E "get_copy|set_copy"` over `src` found nothing. The positive control on the same files was `command grep -c -w "get_name"`: 98 in `LModelElement.tsx` and 37 in `classes.ts`.
   - The proxy resolves members first (`proxy.ts:399`, `if (propKey in this.l || propKey in this.d || (this.l as GObject)[this.g + (propKey as string)])`), so a feature called `copy` would collide only if one of those held. None does.
   - The prompt's condition was "if `copy` collides at the proxy level, the list must include proxy member names". It does not hold, so the list stays lexer-only. Proxy-level collisions do exist for other names, outside this lane: for example `parent`, which the proxy maps to `father` (`proxy.ts:389`), and `json`.
5. **Which names are actually reserved, measured** [M]. A matrix probe ran 90 words through 9 positions: the name of a class, attribute, reference, containment, enum or literal; `rename … to <w>`; `in <w>`; and `type <w>`. The results:
   - **Hard, 24 words.** The 22 `COMMANDS` plus `true` and `false` give `ERR` in every position. Declaration is impossible, so the integrity check refuses any script that does it.
   - **Soft, 39 words.** These are the single-word `ELEMENT_TYPES` and the `KEYWORDS` that are not also commands. They are accepted as a declared name in all 7 declaring positions and as a `type` target. They are refused as `in <w>`: `parseQualifiedNameToken` (`parser.ts:1207-1215`) accepts only `QUALIFIED_NAME` and `IDENTIFIER`.
   - A second probe tried the use positions on 9 soft words (`type`, `class`, `in`, `to`, `containment`, `default`, `model`, `instance`, `of`). All are refused in:
     - `delete class <w>` and `rename class <w> to …`;
     - `create class Sub extends <w>` and `create literal L in <w>`;
     - `delete attribute <w> in Book` and `rename attribute <w> in Book to …`.

     `<w> extends Base` falls through to `eval` instead of `extends`. `set b.<w> = 1`, `… in lib.<w>` and `in Pkg::<w>` work, because the dotted or qualified form is a single token.

     So a soft-reserved element runs on the line that declares it, and a later script cannot address it by its bare name.
   - **Not reserved.** `Copy`, `COPY`, `copyOf`, `Type`, `String`, `null`, `name`, `exists`, `do`, `end`, `toString` and `constructor` are `IDENTIFIER` and `ok` in every declaring position.
   - The union is **63 words**:
     `abstract add annotation as attribute brief cascade class clear composition containment copy create deep default delete derived enum enumeration eval export extends false forall force from full help implements import in instance interface let list literal metamodel model move of operation opposite ordered package parameter project readonly redo reference remove rename set show to transient tree true type undo unique validate volatile with`
     Counts: `COMMANDS` 22, `ELEMENT_TYPES` 18 (one of them `abstract class`, two words), `KEYWORDS` 25. Three overlaps: `abstract` and `extends` are in both `COMMANDS` and `KEYWORDS`; `containment` is in both `ELEMENT_TYPES` and `KEYWORDS`.
6. **Primitive type names, a different kind of reservation** [M]. `parse('create reference r in Library type <w>')` gives `{"kind":"primitive",…}` for `Date`, `date`, `DATE`, `Object`, `Any`, `Integer`, `String`, `Str`, `Float` and `Void`, and `{"kind":"class",…}` for `Library` and `Copy`.
   - Two lookups decide it: `grammar.ts:224` `const normalizedType = TYPE_ALIASES[raw];` (exact), then `grammar.ts:235-239`, a case-insensitive loop over `TYPE_ALIASES`.
   - `TYPE_ALIASES` (`types.ts:548-572`) has 23 keys, 12 distinct lowercase forms: `str string int integer bool boolean float double date any object void`.
   - So a class or enum with one of those names can be declared, but it can never be the type of a feature: every `type <name>` becomes the primitive.

### 4.2 Inventory of reserved-name definitions (item 2)

| Definition | `file:line` | Contents | Case | Lookup | Role |
|---|---|---|---|---|---|
| JjScript `COMMANDS` | `jjscript/types.ts:578-583` | 22 commands (`copy` among them) | sensitive, lowercase | `Array.includes` (`lexer.ts:371`) | lexer: `COMMAND` token; never a name |
| JjScript `ELEMENT_TYPES` | `jjscript/types.ts:585-591` | 18 (`abstract class` included) | sensitive | `Array.includes` (`lexer.ts:377`) | lexer: `KEYWORD`; soft-reserved |
| JjScript `KEYWORDS` | `jjscript/types.ts:593-598` | 25 | sensitive | `Array.includes` (`lexer.ts:388`) | lexer: `KEYWORD`; soft-reserved |
| JjScript booleans | `jjscript/parser/lexer.ts:382` | `true`, `false` | sensitive | `===` | `BOOLEAN`; never a name |
| JjScript first-token triggers | `jjscript/parser/parser.ts:56`, `:129-180` | `exists`, `with`; `forall`, `abstract`, `do` | insensitive (`toLowerCase`) | `Array.includes` / `===` | only as a command's first token; not name positions |
| JjScript `TYPE_ALIASES` | `jjscript/types.ts:548-572` | 23 keys, 12 lowercase forms | exact, then insensitive | `obj[raw]` (`grammar.ts:224`), then loop | a classifier with that name is shadowed in a `type` clause |
| Jjodie prompt rule 8 | `constants/defaultPrompts.ts:129-143` | 14 keywords + `String`, `int`, `boolean`, `Date` | stated "case-insensitive" | prose | advice to the model only |
| Autocomplete copy | `jjscript/autocomplete/context.ts:57-59` | 15 commands, 10 element types, 19 keywords | insensitive (`toLowerCase`, `:126`) | `Array.includes` | highlighting/completion only |
| Autocomplete keyword defs | `jjscript/autocomplete/types.ts:353` | 14 keyword objects | — | `find` by name | completion only |
| Error suggestions | `jjscript/executor/errors.ts:91` | `VALID_COMMANDS`, 8 | — | — | suggestion text only |
| JjEL `JJEL_KEYWORDS` | `jjel/types/tokens.ts:108-127` | 18 | insensitive (`textLower`, `jjel/lexer/lexer.ts:427`) | **`obj[key]`** (`:430`) and **`in`** on `OCL_METHOD_MESSAGES` (`:414`) | JjEL lexer |
| JjTL `JJTL_KEYWORDS` | `jjtl/types/tokens.ts` | 26 | insensitive | **`obj[key] \|\| IDENTIFIER`** (`jjtl/lexer/lexer.ts:330`) | JjTL lexer |
| JjEL state roots | `jjel/stateReserved.ts:14-23` | `self event model node`, `marked tokens` | sensitive | frozen arrays | simulator guards; "None of these names is a lexer keyword" |
| JS reserved words | `common/U.tsx:1056-1108` | ECMAScript keywords + `null true false` | sensitive | `Array.includes` (`:1160`) | skips scope keys in `evalInContextAndScope`; not a name rule |
| Conformance name shape | `model/conformance/nameShape.ts:18-22` | regexes only | — | — | no reserved list (positive: its three verdicts) |
| Jjodie generation prompt | `jjodie-integration/jjscriptGenerationPrompt.ts:6` | no reserved list | — | — | never sent: no importer outside its folder (`command grep -rn -E "JJSCRIPT_GENERATION_PROMPT\|jjodie-integration"` finds only comments elsewhere; control `jjscriptProvider` 4 hits in `Jodie.tsx`) |

**Differences that matter** [M/R]:
- Rule 8 states "case-insensitive", but the lexer reserves only lowercase. `create class Type` is listed as FORBIDDEN in rule 8 and runs fine [M].
- Rule 8 misses 49 of the 63 lexer-reserved words, `copy` included [M]. Its 4 primitive names are not lexer-reserved; they belong to the `TYPE_ALIASES` category.
- The autocomplete copy (`context.ts:57-59`) has drifted too: it lacks `export`, `import`, `eval`, `let`, `forall` and `abstract` among the commands. It only colours tokens.

**The prompt's neighbour question: does JjScript have the JjEL prototype pattern?**
- The JjScript **lexer does not**: it uses `Array.includes`. `toString` and `constructor` tokenize as `IDENTIFIER` and are accepted as names [M].
- The JjScript **grammar does**, in the type clause: `TYPE_ALIASES[raw]` at `grammar.ts:224`. `type toString` and `type constructor` give `{"kind":"primitive"}` with a function as the type [M].
- `eval.ts:318` has a third case: `if (name in variables) continue;` silently skips a class named `toString` as a top-level variable [R].
- Measured in the neighbours:
  - JjEL tokenizes `x.constructor` and `x.toString` as `ERROR`, through the `in` check at `:414`;
  - JjTL tokenizes `constructor` with a **function** as its token type.

  None of these is fixed here.

### 4.3 Path from Jjodie's reply to execution (item 3)

1. `Jodie.tsx:450`, `handleSendMessage`. In Jjodie mode it first runs `if (jjscriptProvider.detect?.(content))` (`:508`). That is `parse(input, { strict: true }).success` (`jjscriptProvider.ts:41-46`), a parse of **the user's message** (see §4.4).
2. `Jodie.tsx:600`: `const { entries } = await jjodieProvider.run(content, ctx);`, then `jjodieProvider.ts:53-55`: `const response = await AIProviderService.chat(input, providerToUse, history, augmentedContext, ctx.images, ctx.documents, chatModel,);`
3. `AIProviderService.ts:83`: `const systemPrompt = PromptService.getRendered('chat', context);`. Then `PromptService.ts:111-117`: a global override replaces the whole text (`if (globalPrompt) { return globalPrompt.content; }`); otherwise `return DEFAULT_PROMPTS[type];`. A customized chat prompt carries whatever rule 8 it had when it was copied.
4. The reply is wrapped as an assistant `ChatMessage` (`jjodieProvider.ts:57-64`) and stamped with `jjodieScope` (`Jodie.tsx:602`).
5. Rendering [R-agent]:
   - `ChatMessages.tsx:175-179` → `MarkdownMessage.tsx:46-57`. User messages are plain text, so they never get a script block.
   - `MarkdownRenderer.tsx:183` (`/language-(\w+)/`) → `:93-97`: a multi-line block tagged `jjscript`/`jjs`, or one that `isJjScriptCode` recognizes.
   - A first **Run as JjScript** button (`:124-131`) only mounts `ScriptBlock` (`MarkdownRenderer.tsx:103-108` [R]).
6. `ScriptBlock.tsx`, a second **Run**:
   - `handleExecute` → `validateScriptIntegrity(code)` (`:464`). If it fails: `setExecutionErrorInfo`, `setExecutionState('error')`, return (`:465-504`).
   - Otherwise `runPasses(commands, executeLine, isDeferrable, …)` (`:552`).
   - `executeLine` → `onExecute([commands[i]], …)` (`:386`) → `ChatMessages.tsx:397` `handleJjScriptExecute` → `JjScriptService.execute(command, scope)` (`:437`) → `executor.execute` → `parse` (`executor.ts:71`).
7. **Step** (`ScriptBlock.tsx:621`, `handleStep`) runs line by line and never calls `validateScriptIntegrity`. The only call site is `:464` (`command grep -n validateScriptIntegrity ScriptBlock.tsx`: the import at `:17`, a comment at `:111`, the call at `:464`).

**Answers**:
- **Is the script parsed before it runs?** Yes on Run, line by line with the executor's parser, not strict. No on Step.
- **Is there a natural place for a gate?**
  - A **repair** needs the model, and only `Jodie.tsx` holds both the whole reply and the call: after `jjodieProvider.run` at `:600` (send) and `:645` (`askJjodie`).
  - A **refusal** belongs next to the integrity check in `ScriptBlock.handleExecute` (`:464`), and in `handleStep` (`:621`), which has none.
  - `ScriptBlock` is mounted only from `MarkdownRenderer` for assistant replies [R-agent]. The JjScript console (`Jodie.tsx:452` → `jjscriptProvider.run`) does not use it, so typed scripts are untouched.
- **How is the model called, and is there a follow-up helper?**
  - `AIProviderService.chat(message, provider, history, projectContext, …): Promise<string>`, non-streaming (`:163` `data.choices[0].message.content`).
  - The follow-up helper exists: `askJjodie(input)` at `Jodie.tsx:632-663`, "send `input` to the LLM and append the reply, WITHOUT changing mode".
  - No path today sends a ScriptBlock failure back to the model [R-agent].
- **Dead code.** `jjodie-integration/` (`useMetamodelGeneration`, `JjodieAPIImpl`, `JJSCRIPT_GENERATION_PROMPT`) is not imported anywhere (§4.2, last row). Phase 2 leaves it alone.
- **Critical zone.** No file on this path is in CLAUDE.md §3.1.

### 4.4 Atomicity and the freeze (item 4)

**Atomicity** [R; M where marked]:
- A Run refused by the integrity check executes nothing [M: classes before and after R1 identical; `0 commands executed`].
- A Run that fails in the executor halfway **does not roll back**:
  - pass 1 runs every line and never pauses (`runPasses.ts:198-245`);
  - lines that succeeded stay applied;
  - deferrable failures are retried for at most 3 passes (`:68`, `:241`);
  - the header (`:11-14`) holds that a deferrable failure writes nothing.
- Step applies lines one at a time with no whole-script check, so a `copy` line reached by Step would leave the earlier lines applied [R].
- No flag is left set [R]:
  - `retryPassDepth` is lowered in a `finally` (`runPasses.ts:217-222`);
  - `abortRef` is reset at each Run (`ScriptBlock.tsx:518`);
  - the refusal sets `executionState` to `'error'`, a run to `'completed'`, and a refusal never enters `'running'`.
- After R1 was refused, R2 ran in the same session (7/7) [M].

**Two-run sequence, Playwright** [M]. This tree's Vite on port 3047. The OpenAI endpoint was mocked (R1 declares `create reference copy in Loan type Book`; R2 is the same script with `bookCopy`). The path was the real one: chat → CodeBlock → ScriptBlock → Run.

| Variant | Second message | Result |
|---|---|---|
| A | `do not use copy` (Alfonso's) | R1 refused, 0 executed, model unchanged. On the second send, `locator.press('Enter')` never returned; **`Target crashed`** 16 s later (22:53:56 → 22:54:12). Mock call #2 never happened: the hang precedes the model call |
| B | `Please rename it, avoid copy.` | R1 refused, 0 executed. Call #2 roles `system,user,assistant,user` (R1 in history). R2: `Script executed`, `7 commands executed`; classes `Book, Library, Loan` and features `bookCopy, books, dueDate, title` added. Main thread: heartbeat max gap 402 ms, one long task 342 ms, `evaluate` 0-2 ms; no page errors |

**Cause of the freeze** [M + R]:
- `detect` parses the chat message (`jjscriptProvider.ts:46`).
- `do` as the first token enters the standalone block branch (`parser.ts:173-180`: `token.value.toLowerCase() === 'do'` → `parseBlockBody()`).
- In `parseBlockBody`, `commands.push(this.parseCommand())` (`:1041`) loops `while (!this.isAtEnd() && !this.check('EOF'))` (`:1025`). `parseCommand` on a non-command word returns an `eval` node through `remainingInput()` (`:182-186`, `:1009-1012`), and that call **consumes no token**. The loop pushes forever.
- Node probe with a 256 MB heap: `do not use copy`, `Do not use copy`, `do it again` and `Do the same without copy end` each end in `FATAL ERROR: … JavaScript heap out of memory`, exit 134, strict and loose alike. The controls return in ≤ 1 ms: `please avoid copy`, `don't use copy` and `do create class A end`.
- **It hangs the main thread (the whole tab), not only the Jjodie UI, and then crashes the renderer.**
- The same loop is reachable by any parse of a line that starts with `do` and has a non-command word in its body [R]: the JjScript console mode (`Jodie.tsx:452`), and a ScriptBlock line such as `do x.name end`.

This lane removes the reason to type such a message, not the loop. Proposed ticket, high priority, its own lane: *"A Jjodie chat message starting with `do` hangs the tab: `parseBlockBody` does not advance on an `eval` body (parser.ts:182-186, :1041)."*

### 4.5 Proposal (item 5)

**Module.** New `frontend/src/jjscript/reservedIdentifiers.ts`, pure, with no imports.
- The name is free: `command grep -rn -i -E "reservedIdentifier|isReservedIdentifier|RESERVED_IDENTIFIERS|reservedNames|RESERVED_NAMES"` over `src` returns only `U.reservedWords` (`common/U.tsx:1056`, `:1160`), which is the positive control and is unrelated.
- It holds the three word lists, moved verbatim from `types.ts`, plus `true`/`false`.
- `RESERVED_IDENTIFIERS: ReadonlySet<string>`: the union, 63 lowercase single words.
- `isReservedIdentifier(name)`: `Set.has`, so the prototype is never walked. Its case is decision 1.
- `types.ts` keeps `COMMANDS`, `ELEMENT_TYPES` and `KEYWORDS` with the same names and types, built from the module, so its consumers are untouched (rule 2): parser, autocomplete, `JjScriptInput`.
- The lexer classifies with the module's sets by **exact** match, which is today's behaviour (`lexer.ts:365-369` keeps `Attribute` a class name).

**Can the JjEL lexer import it now?** Not in this lane.
- JjEL's list is a different set: 18 words, case-insensitive, mapped to token types.
- R-VAL-8 asks for one list shared by **JjEL and JjTL** (spec §10.2).
- Moving `JJEL_KEYWORDS` into a `Set`-based module would also change the `obj[key]` lookup (`jjel/lexer/lexer.ts:430`). That is a behaviour change this prompt forbids.
- The module can host the JjEL/JjTL table later, as named exports, in their own lane.

**Files Phase 2 would touch (9, above rule 19's 5, listed for the GO):**
1. `frontend/src/jjscript/reservedIdentifiers.ts` (new): the lists, `RESERVED_IDENTIFIERS`, `isReservedIdentifier`.
2. `frontend/src/jjscript/types.ts`: the three arrays become views of the module (same exports).
3. `frontend/src/jjscript/parser/lexer.ts`: `classifyIdentifier` reads the module, exact match.
4. `frontend/src/constants/defaultPrompts.ts`: rule 8's lists interpolated from the module (and from `TYPE_ALIASES` per decision 2); `chat` version 6 plus one changelog line (the file's bump rule, `:9-25`).
5. `frontend/src/components/Jodie/reservedIdentifierGate.ts` (new, pure, node-testable). It holds:
   - `findReservedDeclarations(replyText)`, which tokenizes each `jjscript` block with the JjScript lexer, since `parse` fails on hard words. It reads `create [abstract] <kind> <name>`, `rename … to|as <name>` and `create enum E: A, B`.
   - `gateReply(reply, ask)`: one repair round at most.
6. `frontend/src/components/Jodie/Jodie.tsx`: call the gate after `jjodieProvider.run` at `:600` and `:645`.
7. `frontend/src/jjscript/components/ScriptBlock.tsx`: refuse a script with reserved declarations in `handleExecute` (beside `:464`) and in `handleStep` (`:621`), listing the names.
8. `frontend/src/jjscript/__tests__/reservedIdentifiers.test.ts` (new).
9. `frontend/src/components/Jodie/__tests__/reservedIdentifierGate.test.ts` (new): the gate with a mocked `ask` (exactly one repair call, nothing executed), and the rendered `DEFAULT_PROMPTS.chat` containing every word (`defaultPrompts.ts` imports only types, so it loads under node).

`Jodie.tsx` and `ScriptBlock.tsx` do not load in the node bench (`runPasses.ts:21-23`), so their wiring is verified by the Playwright probe of §7, adapted: the mock answers `copy` twice → 2 model calls and the model unchanged.

## 5. Dependencies and risks

- **Rule 3, Jjodie's behaviour.** The gate makes refusals that were advice until now. Under decision 1 "case-insensitive", names that run today would be refused. Under exact case, soft words used as feature names (`type`, `default`, `model`) still trigger a repair where the script would have run. That is accepted by the prompt's own list (`type` is in rule 8 today).
- **Customized chat prompts.** `PromptService.ts:111-113` replaces the whole text, so a user with a custom prompt keeps the old rule 8. The gate still protects them; the prompt does not.
- **Prompt length.** 63 words plus the primitive names in rule 8, compared with 18 today.
- **Tokenizing, not parsing.** The gate reads declarations by tokens because `parse` rejects hard words. A `create` line it does not recognise passes, so the integrity check stays the backstop.
- **The freeze** (§4.4) stays reachable from any `do …` message until its own lane fixes `parseBlockBody`.
- **Committed instrumentation.** `[JjScript-TIMING]` logs, marked `TEMP-DISCOVERY`, ship in `executor.ts` (13 lines) and `ScriptBlock.tsx` (3 lines), since `6a6cfade9` (2026-07-13), against CLAUDE.md §2. Recorded only.

## 6. Open questions

1. Case of the reservation (decision 1). Recommended: exact lowercase, as the lexer; `isReservedIdentifier('Copy')` false, and the prompt's D test adjusted.
2. Primitive type names (decision 2). Recommended: render them in rule 8 from `TYPE_ALIASES`; gate class and enum names only, case-insensitive.
3. The user's view of a repair (decision 3). Recommended: show only the repaired reply with a one-line notice of the replaced names; after a failed repair, show the reply with Run refused and the names listed.
4. The freeze ticket. Recommended: a high-priority `ticket:` entry in this lane's closure inbox entry, and its own fix lane (`parseBlockBody` must consume or stop on an `eval` body).

## 7. Probes and reproduction (all temporary)

- **Parser matrix (vitest)**: a probe under `frontend/src/jjscript/__tests__/`, deleted after the run (copy kept outside the tree). It ran `parse()` and `tokenize()` over 90 words × 9 declaring positions and 19 words × 11 use positions, the `TYPE_ALIASES` type clause, and the JjEL/JjTL tokenizers. Result `Test Files 1 passed`, exit 0.
- **The `do` loop (node)**: `frontend/scripts/smoke/_tmp_jjres_doloop.ts` (gitignored), run as `perl -e 'alarm 6; exec @ARGV' env NODE_OPTIONS=--max-old-space-size=256 npx tsx scripts/smoke/_tmp_jjres_doloop.ts "<message>" strict|loose`.
- **Two runs (Playwright)**: `frontend/scripts/smoke/_tmp_jjres_tworun.ts` (gitignored). It sets the GPT provider and `jjodel_provider_chat` in `localStorage`, routes `https://api.openai.com/v1/chat/completions`, opens a new project and metamodel, sends, clicks **Run as JjScript** and then **Run**, and reads the DOM, the store and a heartbeat.
  - Variant A: `SMOKE_URL=http://localhost:3047 npx tsx scripts/smoke/_tmp_jjres_tworun.ts`, exit 1 (`Target crashed`).
  - Variant B: the same with `JJRES_MSG2="Please rename it, avoid copy."`, exit 0.
  - The Vite process (this tree's, port 3047) was stopped after the runs. `git status` is empty apart from the gitignored probes, which are kept for Phase 2.
- The system prompt captured from request #1 contains rule 8 with its 18 words: `keywords: create, delete, rename, class, abstract, attribute, reference, containment, enum, literal, extends, in, to, type` and `primitive types: String, int, boolean, Date`.

## Addendum 2026-10-10, Phase 2 (GO of C-2026-10-10-0039)

The chat decided the three open points under RC-25, each as its `Recommended:` line:
1. Exact lowercase match.
2. Primitive type names are rendered from `TYPE_ALIASES` and checked on class and enum names in any case, never on feature names.
3. Only the repaired reply is shown, with one notice line. A reply that still violates is shown with Run and Step refused.

The freeze is fixed by lane P-2026-10-10-0810 (`do-freeze`), which owns `parser.ts`. This lane did not touch that file.

**Code** (the nine files of §4.5):
- `377070258` moves the lists verbatim to `jjscript/reservedIdentifiers.ts`. `types.ts` keeps `COMMANDS`, `ELEMENT_TYPES` and `KEYWORDS` as copies, and adds `JJSCRIPT_PRIMITIVE_TYPE_NAMES`. The lexer reads the Sets.
- `b5e9ed415` renders rule 8 from the list. The prompt goes to version 6.
- `07bf5c3ee` adds `components/Jodie/reservedIdentifierGate.ts`, wired in `Jodie.tsx` (send and `askJjodie`) and in `ScriptBlock.tsx` (Run and Step).

**Two departures from §4.5:**
- Step now checks the script on every press, not only the first. Without that, a second press after a refusal would start at line 1.
- The gate reads `create` and `rename`, as the prompt defines it. It does not read `add` or `copy … as` [R].

**Measured on `07bf5c3ee`** [M]:
- Tests first: both new files were red on the base (module absent), then 30/30 green.
- Mutation bench: 12 of 12 mutations killed, with a green control after restore.
- Gates:
  - typecheck: 14 errors, the §17 set;
  - `src/jjscript` plus the gate test: 571 passed, with `context-binding.test.ts` red at import (known);
  - build: exit 0.
- Playwright on this tree's Vite (port 3047), with the model endpoint mocked:
  - Variant (a), `copy` twice: 2 model calls; the repair turn's roles were `system,user,assistant,user`. Step and Run were refused, both naming `'copy' (line 6)`, with the model unchanged, and a second press of Step ran nothing either. 12/12 checks passed.
  - Variant (b), `copy` then `bookCopy`: only the repaired reply was shown, with the notice naming `copy`. Run applied 7 commands, and `bookCopy` is in the model. 11/11 checks passed.
- The probe's own negative controls:
  - With the gate call removed from `Jodie.tsx`, 4 checks failed (calls=1).
  - With the `ScriptBlock` check removed, 5 checks failed. Step applied `Library` and then `Book`, the base behaviour.
