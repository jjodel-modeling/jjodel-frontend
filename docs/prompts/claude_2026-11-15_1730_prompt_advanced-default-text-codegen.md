# Textual notation and code generation on by default in Advanced mode (3.2)

Prompt-ID: P-2026-11-15-1730
Chat: C-2026-11-15-1010
Front: codegen
Lane: full, two phases (Phase 1 discovery read-only with a saved report and a hard stop; Phase 2 the change, after the chat's GO)
Status: da eseguire
Request: Alfonso, chat of 2026-11-15 17:25: "sintassi testuale e generazione di codice diventano attive di default in Advanced prima del tag 3.2" (decision already stated on 2026-11-11, recorded in the codegen front)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-advanced-default`, branch `advanced-default-text-codegen`, cut from `alfonso-frontend-jjtl` at
the commit that adds this prompt. Model and tier as pinned (RC-16), effort `xhigh`. Before anything else run `pwd`,
`git branch --show-current`, `git log -1` and `git status`; if they differ from this header, stop.

## Lane discipline

Every reply opens with `[P-2026-11-15-1730 · session <id>]`; every final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 90 minutes. No push, no merge. The critical zone
(`useJjomSync.ts`, `portDistribution.ts`) is out of scope.

## COSA

Today the textual notation (the textual entry of the viewpoint picker, the Text tab, export and import of text) and
code generation (the Code pill, the GENERATORS section of the project, the generator entries of the left bar, the
oracle) are behind one experimental setting, `jjodel.experimental.codegen` in `src/codegen/setting.ts`, off unless
the key holds `'true'`, and behind the build flag `VITE_CODEGEN` (true in the development, staging and production
env files). The book of Jjodel 3.2 says, in a dozen places, that both are available in Advanced mode, with no
experimental switch to turn on.

The rule for 3.2, Alfonso's decision: with the build flag on, textual notation and code generation are available in
Advanced mode by default. In Basic mode they stay hidden. Settings → Advanced keeps a switch so a user can turn them
off; it is no longer labelled Experimental, and it is on unless the user turned it off (`'false'` stored). With the
build flag off nothing changes: no module of the generator loads (R-GEN-2).

## DOVE

Read only in Phase 1. `src/codegen/setting.ts` and its tests; every reader of `useCodegenEnabled` and
`getCodegenEnabled` (today `components/editor-v2/Toolbar.tsx`, `components/editor-v2/EditorV2.tsx`,
`components/project/ProjectEditor.tsx`, `pages/components/LeftBar.tsx`, `pages/settings/AdvancedSettings.tsx`,
`codegen/oracle/oracle.ts`); `codePillVisible`; the lazy gate `scripts/gates/check-codegen-lazy.ts`; where Advanced
mode lives (`state.advanced`, `hooks/useInterfaceMode.ts`).

## COME

Phase 1, read only. Map every reader and say, for each, what changes when the rule is "flag on, Advanced, not turned
off". Decide where Advanced mode is read (the setting module or each caller) without breaking the lazy gate: the
setting module may import nothing of the generator. List the tests whose expectations change (setting.test.ts and
any test that assumes off by default). Save the report as
`docs/discovery/discovery_2026-11-15_advanced_default_text_codegen.md` (objective, files read with full paths,
findings, risks, open questions with one `Recommended:` each). Hard stop with `Outcome: hard-stop`.

Phase 2, only after GO: the smallest change that implements the rule; tests updated and added for the four cases
(flag off; Basic; Advanced with no key; Advanced with `'false'`); gates green (typecheck, build, the codegen lazy
gate, vitest on codegen and the touched components); one commit `feat(codegen): ...`, `git add` by file name; log
entry in `docs/log-inbox/`. Visual check owed to Alfonso on a probe port (never 3000, 3001, 3003): in Advanced mode,
with a clean localStorage, the textual entry is in the viewpoint picker of a model tab and the Code pill shows; in
Basic mode neither shows.

## RIFERIMENTI

- `CLAUDE.md`, `docs/PROTOCOL.md`, R-GEN-2, R-GEN-42, R-TXT-23.
- Book chapters that depend on this (`%% DEPENDS (advanced-default)` markers): Ch1, Ch5, Ch6, Ch7, Ch8, Ch9,
  Code Generation, Ch18 in `~/jjodel-book-w-book32/author`.
