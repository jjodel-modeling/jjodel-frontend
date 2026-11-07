# Textual syntax, lane F1e: `self.<feature>` name check inside the islands

Prompt-ID: P-2026-11-07-1736
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (pure check in jjelIslands, warning markers, tests; app check with crops)
Depends: F1a..F1d (this branch starts from F1d's tip a8b7c4b57, which contains F1a, F1b and F1c), R-TXT-55 (F5)
Worktree: ~/jjodel-w-textf1e, branch textual-f1e-names (from a8b7c4b57, own node_modules)
Request: none (lane auto, «Procedi con E e poi F»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency. Every reply opens with [P-2026-11-07-1736 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole probe or gate log, grep its summary lines. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-07-1736/handoff.md (what is committed, what is left, the next command) before anything else.

## COSA

Row F1e of docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md §8.1, decision F5 of §8.2 (R-TXT-55), designed in §4.3 «Names»; risk R4 of §9.

(1) **Name check**, pure, in `jjelIslands.ts` next to F1c's `checkIslands`: in an island that parses, every `self.<f>` (and `self?.<f>`, `self.[<f>]` if the grammar has them; read the JjEL lexer and parser, do not guess) whose `<f>` is not a feature of the owner's class, from the same class model F1d's completion uses (the `TextMetamodel`, inherited features included), gives one diagnostic on the `<f>` token, raw offsets through the island's map, message naming the class. Only `self`; nothing for other receivers (§4.3). A parse error in the island means no name check there (F1c's warning is enough). Tests in `__tests__/jjelIslands.test.ts`: a known feature gives nothing; an unknown one is placed on its token in the C-like and Pascal styles, also after an escape; an inherited feature gives nothing; another receiver gives nothing; a malformed island gives only F1c's diagnostic. Mutation bench on the feature lookup and the receiver test.

(2) **Markers**: the same warning path as F1c (owner, severity warning, source `jjel`), never blocking the apply. If F1c's wiring in `ui/TextualTab.tsx` already takes every diagnostic `checkIslands` returns, do not touch that file; otherwise only the marker lines.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(4) **App check** with crops in ~/.jjodel-lanes/P-2026-11-07-1736/, reusing the probe of ~/.jjodel-lanes/P-2026-11-07-1622/ (copy it and what it imports) on its own port: 1-known (`self.guard` in a Transition guard: no warning), 2-unknown (`self.gard`: warning on `gard`, hover names the class, source jjel), 3-pascal (same in the Pascal style). Measure from Monaco's markers and the DOM, not from the screenshot.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines, never the file as a whole. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/jjelIslands.ts, __tests__/jjelIslands.test.ts, ui/TextualTab.tsx (marker lines only, and only if needed). Nothing else; ask first. Before a new identifier, grep the codebase for it.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md (§4.3, §8, §9 R4); docs/decisions.md R-TXT-55; the F1c and F1d log entries in docs/log-inbox/codegen.md.
