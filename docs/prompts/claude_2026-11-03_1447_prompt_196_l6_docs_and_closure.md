# #196 L6 lane 3/3: CLAUDE.md §16 and CODEBASE-MAP for src/services/ai, L6 closure

Prompt-ID: P-2026-11-03-1447
Chat: C-2026-11-03-1227
Front: ai-provider
Lane: full
Depends: P-2026-11-03-1446
Status: da eseguire
Corregge: —
Request: none (no URL: Juri asked in a local Claude Code session on 2026-11-03, «continua a lavorare per chiudere la issue 196»; his words are `request.md` in the lane folder, RC-43)
Model: claude-opus-5-5
Limite: 45 minuti

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the RC-26 list,
the digest, the visual check), Juri decides for this lane.

Critical zone: none. Rule 19 is confirmed by Juri for the three lanes of L6 (R-AI-23). Rule 1c: `AGENTS.md` is
regenerated, never hand-edited, and it is in DOVE.

Worktree: `/Users/juridirocco/development/jjodel-196-l6`, branch `feat/196-l6-consolidation`; `frontend/node_modules`
is a symlink (P14: **never run `npm install` here**). Before anything else: `pwd`, branch, `git log -8 --oneline`
(HEAD is `docs: add prompt P-2026-11-03-1447, lane 3/3 of chain-P-2026-11-03-1445`; under it lanes 2 and 1),
`git status --short` empty, `test -L frontend/node_modules`, and `test ! -e frontend/src/types/jodie.ts`. Read the
handoffs `~/.jjodel-lanes/P-2026-11-03-1445/handoff.md` and `~/.jjodel-lanes/P-2026-11-03-1446/handoff.md`. Otherwise
stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-11-03-1447 · session <id>]` (`session unknown` if you cannot see it, never invented).
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`. Every question carries
`Recommended: <one line>`. A message with another Prompt-ID, or none, is not acted on (P13). Unattended (RC-21, RC-25)
except the RC-26 list. No subagents, no background tasks. Context discipline (CLAUDE.md §0.1). Docs only: P13 keeps
docs and code in separate commits, and this lane writes no code.

## COSA

1. **`CLAUDE.md` §16 «AI Provider System»**: rewrite it for `src/services/ai` (spec §7 L6 «Docs»). Today it names
   `useAIProviderPreference`, which does not exist, and `<ProviderSelector feature="chat" compact />`, a deleted file.
   Same length class as today (a short section). Cover: the module and its public surface (`services/ai/index.ts`); how
   a feature reads its provider and model (the real helpers, as measured in the tree: `FeaturePreferenceStore`,
   `preferredProviderId` / `preferredModelId` in `ProviderModelSelector.tsx`, or wherever lanes 1-2 left them); the
   per-feature IDs (`AI_FEATURES`, measured); the resolution order (feature override → global default → first
   configured, verify it in code); the UI-side `providerVisuals.ts`; that `src/services/ai` imports neither `joiner` nor
   UI; the discovery reference updated to the L0 report and the frozen spec. No emoji, no rule renumbering, nothing
   else of `CLAUDE.md` touched (rule 8).
2. `npm run gen:agents`, then `npm run check:agents` green. The regenerated `AGENTS.md` files go in the same commit as
   `CLAUDE.md` (§17).
3. **`docs/CODEBASE-MAP.md`**: §19 key files gains the AI layer (`src/services/ai/`, `components/common/providerVisuals.ts`,
   `components/Jodie/types.ts`, `src/types/documentation.ts`). The Worker paragraph near line 37 **stays** (R-AI-22:
   the folder still exists).
4. **Closure**: one entry for all of L6 at the END of `docs/log-inbox/196-ai-refactor.md` (P9 format, the
   `log-entry` skill), naming the three Prompt-IDs, the commits of each lane, the gates and probe scores from the
   handoffs, the CHANGELOG entry, and what is still owed: Juri's visual check (lane 2's checklist), the Worker removal
   (R-AI-22), the merge. `Status:` of the three prompts (`claude_2026-11-03_1445_…`, `_1446_…`, `_1447_…`) edited **by
   hand** to `eseguito <date> · lane feat/196-l6-consolidation · <last commit of that lane>`.
5. **Gates**: `npm run check:docs`, `npm run check:agents` green; `npm run typecheck` exit 0 (unchanged tree, a
   sanity run).
6. **Commits**: `docs: CLAUDE.md §16 for src/services/ai, #196 L6` (CLAUDE.md + AGENTS.md files); `docs: …
   CODEBASE-MAP …`; the closure commit (inbox + three Status lines). Final message: lane 2's visual checklist for
   Juri, copied verbatim, and the list of decisions taken unattended across the chain. End with `Outcome: done`.

## DOVE

- `CLAUDE.md` (§16 only) and the `AGENTS.md` files `npm run gen:agents` regenerates
- `docs/CODEBASE-MAP.md` (§19 only)
- closure: `docs/log-inbox/196-ai-refactor.md`, the `Status:` lines of the three L6 prompts

## HARD STOP

- `gen:agents` changes an `AGENTS.md` beyond what the §16 edit explains.
- A fact the §16 text needs contradicts lanes 1-2's handoffs and the code (say which).

## NON FARE

No code, no test. No edit to other `CLAUDE.md` sections or nested `CLAUDE.md` files, to `docs/PROTOCOL.md`, to
`cloudflare-worker/`. No merge, no push, no issue comment. No emoji.
