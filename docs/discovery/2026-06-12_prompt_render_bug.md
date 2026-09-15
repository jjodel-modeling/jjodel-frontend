# Discovery — Jjodie prompt template not rendered: literal `{{projectContext}}` reaches the LLM

**Date**: 2026-06-12
**Type**: read-only discovery (no code modified)
**Follow-up of**: `docs/discovery/2026-06-12_jjscript_m1_coverage.md` (Q6/Q7) and the Part B work on `defaultPrompts.ts`.
**Symptom (runtime, DevTools)**: the `system` field of the Anthropic request is the user's settings prompt **verbatim and unrendered** — it literally contains `{{#if projectContext}} … {{projectContext}} … {{/if}}`. The metamodel context never reaches the model, which explains (a) M1/M2 routing only works when the user states the level in their message, and (b) generated M1 scripts hallucinate metaclass features the model never saw.

**Bottom line**: two stacked defects. The chain breaks **upstream** (the `projectContext` argument to `AIProviderService.chat` is `undefined` at call time), and a **renderer defect** then turns that into a literal-handlebars leak instead of clean text. Neither is in the sync/critical zone.

---

## Q1 — Renderer mechanics

`PromptService.getRendered(type, context, projectId?)` (`services/PromptService.ts:122-125`):

```ts
static getRendered(type, context?, projectId?): string {
    const template = this.get(type, projectId);   // cascading override resolution
    return this.renderTemplate(template, context);
}
```

`renderTemplate(template, context)` (`PromptService.ts:278-323`) is a hand-rolled Handlebars-subset:

- **`PromptService.ts:279` — `if (!context) return template;`** ← the load-bearing line. When `context` is `undefined`, the template is returned **verbatim, completely unprocessed** — `{{var}}`, `{{#if}}`, `{{#each}}` markers all survive into the output.
- `{{variable}}` substitution (`:284-287`): `result.replace(/\{\{(\w+)\}\}/g, …)` → value from `context[varName] ?? context.customVariables?.[varName]`, `undefined → ''`. (The `\w+` regex does **not** match `{{#if projectContext}}` or `{{/if}}` — `#`/`/`/space are non-word — so the inner `{{projectContext}}` is replaced without disturbing the block delimiters.)
- `{{#if var}}…{{/if}}` (`:290-296`): keeps the inner content iff the value is truthy, else `''`. Runs **after** variable substitution, so an already-substituted inner `{{projectContext}}` is preserved.
- `{{#each array}}…{{/each}}` (`:299-317`).
- Cleanup of triple blank lines + `.trim()` (`:319-322`).

**Behavior when the variable is undefined/empty:**
- **context object is `undefined`** → early-return at `:279`: markers left **literal** (this is the observed bug).
- **context object is defined but the variable is missing/empty-string** → `{{var}}` becomes `''` (`:286`) and `{{#if var}}…{{/if}}` is **stripped** (`:294`). i.e. with a *defined* context the renderer behaves correctly and never leaks markers.

So the renderer only leaks literal handlebars through the single `!context` early-return path. It does not throw.

---

## Q2 — Override path

**Storage** (`types/prompts.ts:123-125`, `35-57`): user-saved prompts live in `localStorage` as JSON `StoredPrompt { type, content, updatedAt, isCustom }`:
- global key: **`jjodel_prompt_global_chat`** (`PROMPT_GLOBAL_PREFIX + type`)
- project key: `jjodel_prompt_project_<projectId>_chat`

Saved by the Settings UI `PromptEditor.tsx:49` (`setGlobalPrompt`) / `:47` (`setProjectPrompt`); the saved `content` keeps the raw `{{…}}` markers (the editor's live preview renders them separately via `renderTemplate` at `PromptEditor.tsx:77`, but the stored string is raw).

**Resolution** (`PromptService.get`, `:98-117`): cascades **project → global → default**, returning the override's `.content` when present (`:105`/`:112`), else `DEFAULT_PROMPTS[type]` (`:116`).

**Is the override treated specially? No.** `getRendered` runs the override through the **same** `renderTemplate` engine as the default (`:123-124`). The override is **not** returned verbatim by design, and there is **no bypass**: a repo-wide grep shows the chat path's only renderer consumer is `AIProviderService.ts:67`:

```ts
const context = projectContext ? { customVariables: { projectContext } } : undefined;   // :64-66
const systemPrompt = PromptService.getRendered('chat', context);                          // :67
```

(Other `getRendered`/`get` callers are the Settings editor `PromptEditor.tsx`, the `usePrompt` hook, and `jjtl/services/AIMatcher.ts` for `'mappings'` — none on the Jodie chat send path.)

⇒ **H2 (caller bypasses PromptService for overrides) is FALSE.** The override is rendered through the normal engine; it only comes out verbatim because `context` is `undefined`, hitting `PromptService.ts:279`.

**Exact line where the unrendered string leaks:** `PromptService.ts:279` returns the override-derived template unprocessed → surfaces at `AIProviderService.ts:67` (`systemPrompt`) → sent at the provider call, e.g. `AIProviderService.ts:132` (`system: systemPrompt`). Because the *default* chat prompt also contains `{{#if projectContext}}`, this leak is **not** override-specific — the default would leak identically whenever `context` is `undefined`.

---

## Q3 — Context value at call time

The argument that becomes `context` is `augmentedContext` (`Jodie.tsx:501`, passed at `:519`), seeded from the `projectContext` memo:

```ts
const project = useMemo(()=> user.project, []);                       // :94  ← EMPTY DEPS
…
const projectContext = useMemo((): string | undefined => {
    if (!project) return undefined;                                   // :110
    try { … return JjodieContextService.getContextString(project, activeArtifact); }  // :131
    catch (err) { console.warn('Could not get project context:', err); }              // :133 → returns undefined
}, [state.idlookup.clonedCounter, editorChangeCounter]);              // :134
```

**Conditions under which `augmentedContext` is falsy at `chat()`** (any one ⇒ `context = undefined` ⇒ literal-marker leak):

1. **`project` is `undefined` — primary suspect.** `project` is memoized with **`[]` deps** (`Jodie.tsx:94`), so it is captured **once at mount** and never recomputed. Jodie is a long-lived shell component; if it mounts before the user's project finishes loading — or survives a project switch — `user.project` was `undefined` at mount and stays `undefined` forever. Then the `projectContext` memo hits `if (!project) return undefined` (`:110`) on **every** evaluation, permanently. This alone makes context absent for the whole session.
   - Note: when `project` *is* defined, `getContextString` is effectively always non-empty — `buildContextString` unconditionally pushes a `**Project**` + `**Metamodel Size**` header (`JjodieContext.ts:242-255`), even for an empty/zero-class scope. So an empty-but-defined `project` does **not** explain the leak; only a missing `project` does.

2. **Stale `handleSend` closure — secondary contributor.** `handleSend`'s `useCallback` deps are `[activeProvider, chatState.messages, state.idlookup.clonedCounter, userName]` (`Jodie.tsx:554`) — **`projectContext` is not listed** (the inline comment assumes `clonedCounter` covers it). `editorChangeCounter` (the tab-change trigger, in the memo's deps at `:134`) is **absent** from the callback deps, so a pure tab switch updates the memo but **not** the captured `projectContext` in `handleSend`. On the first sends / right after a tab change the callback can use a stale (mount-time, possibly `undefined`) value.

3. The `projectContext` memo `try` throwing → `catch` returns `undefined` (`:133`). Unlikely (`getActiveModel`/`getActiveMetamodel` and `getContextString` each have internal try/catch), listed for completeness.

4. RAG does **not** null it: `augmentedContext` starts as `projectContext` and RAG only *appends* (`Jodie.tsx:501-514`).

**Is the context also injected into the user message?** **No.** `AIProviderService.chat` puts `projectContext` only into the system prompt (`:64-67`); the user turn carries just `content` (+ images/documents) — e.g. Claude pushes `{ role:'user', content: message }` (`:119`) with no context. This reconciles with the parallel `messages[]` payload check: the model sees the context in **neither** `system` (literal markers) **nor** `messages[]` ⇒ it genuinely never receives the metamodel.

---

## Q4 — Verdict + minimal fix(es)

**The chain breaks at two stacked points (closest to "other", overlapping H1 and H3):**

- **Root (upstream):** `projectContext` is `undefined` when `AIProviderService.chat` is called, so `context` is built as `undefined` (`AIProviderService.ts:64-66`). Most probable cause: the **`[]`-deps `project` memo** (`Jodie.tsx:94`) freezing `project` to a mount-time `undefined`; aggravated by the **stale `handleSend` closure** (`projectContext`/`editorChangeCounter` missing from deps, `Jodie.tsx:554`).
- **Amplifier (downstream, = H1 mechanism):** with `context` undefined, `getRendered → renderTemplate` returns the (override-derived) template **verbatim** via the `if (!context) return template` early-return (`PromptService.ts:279`), so unrendered `{{…}}` is what ships.

**Why both matter / which alone fixes what:**

| Fix | Removes literal `{{…}}` from payload? | Injects the metamodel context? |
|---|---|---|
| **Fix 1 — restore a non-empty `projectContext` at call time** | ✅ (renderer now runs with a defined context → markers replaced/stripped) | ✅ |
| **Fix 2 — renderer no longer early-returns on empty context** | ✅ (markers stripped) | ❌ (context still absent) |

⇒ **Fix 1 is the one that resolves the real problem** (and incidentally clears the literal markers too). **Fix 2 alone only cleans the cosmetic symptom** — the model would get a context-free prompt with the handlebars removed. Ship **both**: Fix 1 for function, Fix 2 as defense-in-depth so a future empty context can never leak literal markers again.

### Proposed minimal fixes (no implementation here)

**Fix 1 — `components/Jodie/Jodie.tsx` (root, required).**
- Make `project` reactive instead of `useMemo(()=>user.project, [])` (`:94`): either read `user.project` *inside* the `projectContext` memo (so it re-reads each time the memo recomputes), or give the memo a dep that tracks the active project pointer / `state.idlookup.clonedCounter`. This ensures `project` is non-`undefined` once a project is loaded, even if Jodie mounted earlier.
- Make the send path use the *current* `projectContext`: add `projectContext` (and ideally `editorChangeCounter`) to `handleSend`'s `useCallback` deps (`:554`), **or** mirror `projectContext` into a `useRef` updated by an effect and read `ref.current` in `handleSend`. This removes the stale-closure window on first send / after tab change.
- Not critical-zone.

**Fix 2 — `services/PromptService.ts` (defensive, recommended).**
- Replace the `if (!context) return template;` early-return (`:279`) with a normalization such as `const ctx = context ?? {};` and let the existing `{{var}}`/`{{#if}}`/`{{#each}}` passes run. With an empty context they correctly emit `''` for missing vars and strip `{{#if}}` blocks — no literal handlebars can ever reach a provider, regardless of caller.
- Not critical-zone.

**Confirmation experiment for Alfonso (not run here):** in DevTools console, before opening Jodie vs. after a project is loaded, evaluate `L.fromPointer(DUser.current).project` — and temporarily log `augmentedContext` at `Jodie.tsx:519`. If `augmentedContext` is `undefined` while `getContextString` would return a non-empty string, Fix 1's `project`-memo hypothesis is confirmed. The parallel `messages[]` payload check should show no context there either (consistent with Q3: system-prompt-only injection).

---

## Critical-zone note

**None of the touched files are in the sync/D-L critical zone.** Fixes are confined to `components/Jodie/Jodie.tsx` and `services/PromptService.ts`. No `useJjomSync`, `canvasToJjom`, `syncState`, `portDistribution`, or `VersionFixer` involvement.
