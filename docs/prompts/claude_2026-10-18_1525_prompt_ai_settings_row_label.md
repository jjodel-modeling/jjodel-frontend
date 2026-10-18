# AI settings rows: the model always shown, the failure kind on the dot, no catalog summary

Prompt-ID: P-2026-10-18-1525
Chat: C-2026-10-18-0035
Front: release-3-2
Lane: fast (three files: AISettingsContent.tsx, AIProviderService.ts, types/jodie.ts; no critical zone)
Status: eseguito 2026-10-18 · branch ai-row-label · edaccffb0
Request: "nei settings vengono indicati i nomi di modelli, perché" (Alfonso, 2026-10-18 15:20), then "vai" (15:21) to the proposal below

Protocollo: docs/PROTOCOL.md: clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 (discovery report) does not apply: the chat read the code on the trunk at 989c603d9, the findings are in Context with file:line.

Worktree: `~/jjodel-w-ailabel`, branch `ai-row-label`, created from the trunk `alfonso-frontend-jjtl` at its current tip. Before anything else: `pwd`, branch, `git log -1` and `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-18-1525 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (read on the trunk, do not redo)

Each provider row in Settings > AI (`frontend/src/components/settings/AISettingsContent.tsx`) shows two model texts:

- left, grey, `ai-provider-row__models` (`:327`): `modelsSummary(name)` (`:216-221`), the first three catalog labels, truncated. It repeats what the row's model menu already shows in full, and Alfonso read it as the model in use.
- right, `ai-provider-row__state` (`:329-333`): a dot plus `activeModelLabel(name)` (`:226-229`), the model the chat uses, or `'Invalid key'` in red when `keyInvalid` (`:263`: `isConfigured && config.lastTested != null && config.lastTestOk === false`).

Two defects. The right slot carries both the model and the status, so on a failure the model disappears. And every failed test reads "Invalid key": `lastTestOk` is a boolean (`types/jodie.ts:520`), the failure kind is lost. The service already has the kinds for the catalog paths (`CatalogFailure = 'auth' | 'rate' | 'network' | 'server' | 'other'`, `services/aiModelCatalog.ts:40`; `ConnectionTestResult.failure`, `AIProviderService.ts:30`), but only three return sites set `failure`; the OpenAI-compatible tests (DeepSeek, Mistral, Groq, Kimi, Ollama, Custom, `:739` and following) and `testGemini` do not.

Alfonso's screenshot of 2026-10-18 15:20 shows two red "Invalid key" rows (one is Kimi) that may or may not be auth failures.

## WHAT

1. **Persist the failure kind.** Add an optional `lastTestFailure?: CatalogFailure` next to `lastTestOk` in `types/jodie.ts` (optional property, no change to existing ones), with a doc comment in the style of its neighbours. Set it where `lastTestOk` is set in `AISettingsContent.tsx` (`:170`, `:179`, `:189`): cleared on success, `result.failure ?? 'other'` on failure, `'network'` in the catch. Clear it wherever `lastTestOk` is invalidated by a credential edit (find those sites). Check how the config is persisted and that the new field survives a reload exactly as `lastTestOk` does.
2. **Every test path returns a kind.** In `AIProviderService.ts`, make `testOpenAICompatible` and `testGemini` (and any other test path without one) set `failure` on every failed return, with the same mapping the catalog uses: 401/403 → `auth`, 429 → `rate`, 5xx and 529 → `server`, a thrown fetch (DNS, CORS, refused) → `network`, anything else → `other`. Reuse the catalog's classifier if one exists rather than writing a second; search first. Do not change `failureDisablesProvider` (`:853`): it already disables only on `auth` or on a missing kind, and after this change a missing kind no longer happens on these paths. Say in the report whether that changes which providers get disabled on a non-auth failure, and how.
3. **Row, right slot.** Always show `activeModelLabel(name)`. The status moves to the dot only: green when the last test passed or nothing failed, red when `lastTestOk === false`. On a red dot the row also carries a native `title` tooltip (on the state span) with the kind in words: `auth` "Invalid key", `rate` "Rate limited", `network` "Provider unreachable", `server` "Provider error", `other` "Connection test failed". Keep the existing `ai-provider-row__state--error` class for the red dot; if that class also colours the model text red, keep the text in the normal state colour and colour only the dot (adjust in the TSX by class placement, not by renaming classes). The `Set up` branch for unconfigured rows is unchanged. Update the comment block at `:256-261` to describe the new behaviour.
4. **Row, left slot.** Remove the grey `ai-provider-row__models` span and the `description` use that feeds it. If `description` is ever reassigned to something other than `modelsSummary` (a notice, a hint), keep that text where it is and tell the chat; only the plain catalog summary goes. Leave `modelsSummary` in place if anything else calls it; remove it only if this was its single caller. Do not touch `AISettingsContent.scss` (an unused class is harmless; the chat removes it later if wanted).

## Checks

`npm run build` (or the project's typecheck) clean. Unit tests of `AIProviderService` and `aiModelCatalog` pass; add one case per new mapping in item 2 where the existing test layout makes it a few lines (fake fetch, no real key, no network).

Visual check (P8), for Alfonso on http://localhost:3001/ after a hard refresh, described in the closure message: a working provider shows green dot plus its model; a provider with a wrong key shows red dot plus its model, tooltip "Invalid key"; Ollama with the server stopped shows red dot plus its model, tooltip "Provider unreachable"; no grey summary on any row. Take the crops yourself if the lane's probe setup allows it, otherwise list the steps.

## DO NOT

- No files outside the three named, apart from tests and the closure files (this prompt's Status line, `docs/log-inbox/`).
- Do not rename any class, prop or identifier. Do not touch the model menu, the test button's transient result, or `failureDisablesProvider`.
- No new dependencies. Never print, log or commit an API key.

## Closure

Commit with pathspec only, conventional message in English, `Model:` trailer. Status line flipped to `eseguito <date> · branch ai-row-label · <sha>` in a docs-only commit, log-inbox entry as for the other release-3-2 lanes. Hard stop before any merge: the merge waits for Alfonso's visual GO. Exit with `Outcome: hard-stop`.

## REFERENCES

- CLAUDE.md (read first), docs/PROTOCOL.md (P8, P13, P16).
- `docs/discovery/discovery_2026-10-18_ai_provider_connection_and_models.md` (the failure kinds, §D).
