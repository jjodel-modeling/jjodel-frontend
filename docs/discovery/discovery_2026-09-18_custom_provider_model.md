# Issue #147: Custom provider model resolution

Objective: connection testing and chat must send the configured endpoint model when
the user selects the Custom registry entry.

Hypothesis confirmed by executing the public service: a persisted per-feature
placeholder overrides the real provider model. Before the fix, 3 of 7 regression
tests fail; the request contains `custom` instead of `anthropic/claude-sonnet-4`.

## Evidence and files read

- `frontend/src/types/jodie.ts:368`: `AI.Custom.add('custom', 'Custom', false, false);`
  The registry uses a placeholder. `AIConfig.getPreferredModel` returns it unchanged.
- `frontend/src/components/common/ProviderModelSelector.tsx:98`:
  `AIConfig.setPreferred(feature, popoverProvider, modelId);` persists that entry.
- `frontend/src/components/Jodie/console/providers/jjodieProvider.ts:52`:
  `const chatModel = AIConfig.getPreferredModel('chat');` passes it to public `chat()`.
- `frontend/src/services/AIProviderService.ts:59` (before correction):
  `let effectiveModel = resolveLegacyModelId(provider, model ?? config.model) ?? config.model ?? '';`
  gives the placeholder priority. `testConnection` instead reads `config.model` directly.
- Also inspected `frontend/src/components/settings/AISettingsContent.tsx`,
  `frontend/src/pages/settings/ProviderConfigModal.tsx`,
  `frontend/src/services/AIProviderPreferences.ts`,
  `frontend/src/hooks/useAIProviderPreference.ts`, `frontend/vitest.config.ts`,
  `frontend/src/services/__tests__/JjodieRagService.test.ts`,
  `docs/discovery/2026-06-13_ai-provider-subsystem.md`, and repository instructions.

## Correction and scope

Only the Custom provider's explicit `custom` selection falls back to current
`config.model`. Real explicit model IDs retain priority, including models present
in another provider's registry. Existing persisted preferences need no migration.
No D-layer, L-layer, sync, persistence schema or exported interfaces change.

Production scope: `frontend/src/services/AIProviderService.ts` (four added lines).
Regression coverage: `frontend/src/services/__tests__/AIProviderService.test.ts`.
Tests execute real preference reading, connection testing and public chat through
the HTTP body; only browser storage, the joiner runtime adapter, prompt rendering
and fetch are stubbed. Module state resets before each test. No real credentials
or paid endpoint calls are used.

## Verification

- Before fix: 3 failures / 4 passes. After fix: 7 passes.
- Typecheck: exit 2 before and after, 14 existing errors; full output identical.
- Production build: exit 0, existing chunk-size warning only.
- Visual smoke attempted: cannot start because the local installation lacks
  `@playwright/test` (ERR_MODULE_NOT_FOUND). No visual success is claimed.
- Real OpenRouter network behavior is not exercised; the regression checks the
  outgoing endpoint and JSON model with the issue's configuration.

The user's end-to-end instruction authorizes implementation and PR creation;
discovery and implementation proceed in this task without an intermediate stop.
No unresolved design questions.

## Delivery status

Branch `fix/147-custom-provider-model` created from staging `cb699ad58`.
The authorization request for staging and committing the code was rejected by
the user. No commit, push or PR was performed. Changes remain in the working tree.

### Resumed after user approval

The user confirmed "chiaro procedi pr". Code and regression tests are committed
as `c6e735b01`; publication targets `jjodel-modeling/jjodel-frontend:staging`.
Previous verification results still apply: no code changed during the resumption.
