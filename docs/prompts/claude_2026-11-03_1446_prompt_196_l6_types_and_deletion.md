# #196 L6 lane 2/3: types move, types/jodie.ts and aiModelCatalog.ts deleted

Prompt-ID: P-2026-11-03-1446
Chat: C-2026-11-03-1227
Front: ai-provider
Lane: full
Depends: P-2026-11-03-1445
Status: da eseguire
Corregge: —
Request: none (no URL: Juri asked in a local Claude Code session on 2026-11-03, «continua a lavorare per chiudere la issue 196»; his words are `request.md` in the lane folder, RC-43)
Model: claude-opus-5-5
Limite: 90 minuti

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the RC-26 list,
the digest, the visual check), Juri decides for this lane.

Critical zone: none. No Layer Impact Report owed. Rule 19 is confirmed by Juri for the three lanes of L6 (R-AI-23).

Worktree: `/Users/juridirocco/development/jjodel-196-l6`, branch `feat/196-l6-consolidation`; `frontend/node_modules`
is a symlink (P14: **never run `npm install` here**). Before anything else: `pwd`, branch, `git log -5 --oneline`
(HEAD is `docs: add prompt P-2026-11-03-1446, lane 2/3 of chain-P-2026-11-03-1445`; under it the commits of lane 1),
`git status --short` empty, `test -L frontend/node_modules`. Read `~/.jjodel-lanes/P-2026-11-03-1445/handoff.md` first:
it is lane 1's state. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-11-03-1446 · session <id>]` (`session unknown` if you cannot see it, never invented).
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`. Every question carries
`Recommended: <one line>`. A message with another Prompt-ID, or none, is not acted on (P13). Unattended (RC-21, RC-25)
except the RC-26 list. No subagents, no background tasks. Context discipline (CLAUDE.md §0.1). Keep
`~/.jjodel-lanes/P-2026-11-03-1446/handoff.md` current after each commit (RC-51). Commit early.

## Context (read, do not trust: re-read the real files, P3)

- Spec §7 «L6» (destinations of the types, the corrected importer list, the docs of lane 3). Decisions: **R-AI-1** (no
  compat facade; the `@RuntimeAccessible` registrations of `AI`, `AIConfig`, `JodieConfig` go with the file; the new
  classes are not registered; the CHANGELOG announces the break), **R-AI-12** (O-4: the Doc group goes to
  `src/types/documentation.ts`), **R-AI-23**.
- After lane 1, every remaining import of `types/jodie.ts` outside tests should be type-only (lane 1's handoff says so;
  re-measure).

## COSA

1. **Measure** (P3, P12): every remaining import of `types/jodie.ts` and of `services/aiModelCatalog.ts` in
   `frontend/src` (static, `import(`, tests included), with names, and a positive control. A value import outside
   tests → HARD STOP (lane 1 missed it).
2. **Move the types**, verbatim (same names, same shapes), to the spec's destinations:
   - `src/services/ai/types.ts`: the AI types the spec lists that are not already there (`AIFeature` and the rest; reuse
     `ProviderId` where `TAIProvider` was used, and measure first which `TAIProvider` values exist in persisted data or
     code: `Llama`/`Copilot` are parked. If narrowing to `ProviderId` breaks a live path, keep a
     `TAIProvider`-equivalent alias in `services/ai/types.ts` and say so);
   - new `src/components/Jodie/types.ts`: chat/console types (`ChatMessage`, `ChatImage`, `ChatDocument`, `ChatState`,
     `ConsoleEntry`, `CodeEntry`, `CodeWarning`, `ConsoleMode`, `ConsoleModeSwitchVia`, `CodeFlavor`, `CONSOLE_MODES`,
     `CONSOLE_MODE_LABELS`, `JjodieScope`, `isChatEntry`, `isCodeEntry`);
   - new `src/types/documentation.ts`: `DocumentationSectionType`, `DocumentationSection`, `DocumentationStatus`,
     `ProjectDocumentation`;
   - `CatalogFailure`/`CatalogProvider` and anything else of `aiModelCatalog.ts` still imported: to `src/services/ai`
     if it has the equivalent, else beside its only consumer.
   Then repoint every importer of item 1.
3. **Tests**: `services/ai/__tests__/legacyKeyPrecedence.test.ts`, `providerStatus.test.ts`, `registry.test.ts`,
   `services/__tests__/aiModelCatalog.test.ts`, lane 1's `providerVisuals` test: those that compare the new module
   with the old file keep their assertions on the new side with the old values as literals (copied from the old file
   before it goes, cited in the test), and drop the import of the old file. A test that only exercised the old file
   goes. List each fate in the handoff.
4. **Delete** `frontend/src/types/jodie.ts`, and `frontend/src/services/aiModelCatalog.ts` with its test if nothing
   imports it. Search the whole `frontend/` (not only `src`) for the path and the names `AIConfig`, `JodieConfig`,
   `RuntimeAccessible('AI` afterwards; a reference left in code outside DOVE → HARD STOP; in comments: fix the ones in
   DOVE files, list the others in the handoff.
5. **`CHANGELOG.md`** (repo root, Keep a Changelog): one entry under the unreleased section (create it if missing, in
   the file's own format): the OCL/JjEL runtime names `AI`, `AIConfig`, `JodieConfig` are no longer registered
   (R-AI-1), the AI layer is `src/services/ai`, the AI proxy Worker is no longer called by the frontend.
6. **Probes**: the three `_tmp_196_*` probes lane 1 left (port 3195, same command form as lane 1, `SMOKE_URL` set),
   same scores as lane 1's after state.
7. **Gates**: `npm run typecheck` exit 0; `npm run build` exit 0; full `npm run test` with only the nine known reds
   (a test count change matches the deleted tests, stated); `npm run check:docs` green. Count the `dist` files that
   contain `RuntimeAccessible` names `AIConfig` / `JodieConfig` before and after (expected: gone).
8. **Commits**: `refactor(ai): …, #196 L6 lane 2` (one or more, pathspec on the commit); `docs(changelog): …` alone.
   No log entry, no `Status:` flip (lane 3). Handoff final: item 1 table, the type destinations, the test fates, the
   comments left outside DOVE, probe scores, and **a visual checklist for Juri** (settings provider list and avatars,
   Test connection, model list of Claude with a live catalog, Jodie chat with a provider avatar, documentation
   generation, a stored documentation still loads). End with `Outcome: done`.

## DOVE

- the remaining importers of item 1 (expected from spec §7 L6: `components/Jodie/JodieWindow.tsx`, `Jodie.tsx`,
  `ChatInput.tsx`, `ChatMessages.tsx`, `JodieMinimized.tsx`, `JodieHeader.tsx`, `console/types.ts`,
  `console/providers/jjelProvider.ts`, `jjscriptProvider.ts`, `jjodieProvider.ts`, `components/common/AIDisclaimer.tsx`,
  `ProviderModelSelector.tsx`, `providerVisuals.ts`, `components/settings/AISettingsContent.tsx`,
  `pages/settings/*` of lane 1, `jjtl/services/AIMatcher.ts`, `MappingSuggestionService.ts`, `services/JjodieContext.ts`,
  `services/DocumentationService.ts`, `components/abstract/tabs/DocumentationTab.tsx`), import lines only unless a
  type rename forces more
- `frontend/src/services/ai/types.ts` (added types only)
- new: `frontend/src/components/Jodie/types.ts`, `frontend/src/types/documentation.ts`
- the tests of item 3
- delete: `frontend/src/types/jodie.ts`; `frontend/src/services/aiModelCatalog.ts` and its test (if item 1 allows)
- `CHANGELOG.md`
- gitignored, not committed: `frontend/scripts/smoke/_tmp_196_*`

## HARD STOP

- A value import of `types/jodie.ts` outside tests at item 1.
- A reference outside DOVE that the deletion breaks (code, not comment).
- A type move that cannot be verbatim (a shape must change) on a live path.
- A probe arm green after lane 1 goes red and cannot be fixed inside DOVE.

## NON FARE

No behaviour change. No edit to `CLAUDE.md`, `AGENTS.md`, `docs/CODEBASE-MAP.md` (lane 3), `cloudflare-worker/`
(R-AI-22). No compat facade or re-export file at `types/jodie.ts` (R-AI-1). No new dependency, no `npm install`. No
real key. No vite on 3001. No merge, no push, no issue comment. No emoji, no `console.log` left in code.
