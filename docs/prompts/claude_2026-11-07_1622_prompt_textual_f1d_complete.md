# Textual syntax, lane F1d: completion inside a JjEL island

Prompt-ID: P-2026-11-07-1622
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-07 · lane full · eb1bbfb10 (red), c933ffbcf, d20872c26 (red), 2666906fa · gates green (vitest: 3 import reds baseline, 7 load reds green alone) · probe 20/20, crops in ~/.jjodel-lanes/P-2026-11-07-1622/ · log entry in docs/log-inbox/codegen.md
Lane: full (completion delegated to the template completion, trigger, tests; app check with crops)
Depends: F1a, F1b, F1c (this branch starts from F1c's tip e8d4c0f39, which contains F1a and F1b), R-TXT-55 (F4)
Worktree: ~/jjodel-w-textf1d, branch textual-f1d-complete (from e8d4c0f39, own node_modules)
Request: none (lane auto, «Procedi con E e poi F»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/, no new dependency. Every reply opens with [P-2026-11-07-1622 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole probe or gate log, grep its summary lines. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-07-1622/handoff.md (what is committed, what is left, the next command) before anything else.

## COSA

Row F1d of docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md §8.1, decision F4 of §8.2 (R-TXT-55), designed in §4.3 «Completion».

(1) **Delegation** in `completionsAt` (`languageService.ts`, near `:549`): before the parser's expected set, a cursor inside an island (F1a's `jjelIslands`, with its value-to-raw map) delegates to the template completion of `codegen/ui/templateCompletion.ts`, with `self` bound to the owner's class and `stc` and `target` left out. Add to the template completion only an option to leave those two out and a parameter for `self`'s class; existing callers unchanged (default behaviour identical, tested). The class model comes from the `TextMetamodel`, so the textual layer stays free of the joiner. Offsets go through the island's map in both directions: the replace range is in raw text, across escapes. Tests in `__tests__/completion.test.ts`: after `self.` in an EXPRESSION island the owner's features are offered and `stc`/`target` are not; after an escape (`\"`, Pascal `''`) the range is right; outside an island nothing changes; an existing template-completion test stays green.

(2) **Trigger**: `.` as a trigger character if `CATALOG_TRIGGERS` (`ui/textualMonaco.ts:44`) lacks it; check that `.` outside an island offers nothing new (no popup inside paths or numbers). If adding it would change completion outside islands, stop with Outcome: question and a Recommended line.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(4) **App check** with crops in ~/.jjodel-lanes/P-2026-11-07-1622/, reusing the probe of ~/.jjodel-lanes/P-2026-11-07-1522/ (copy probe.mjs, common.mjs and what they import into this lane's folder) on its own port: 1-self-dot (typing `self.` in a guard opens the suggest widget with the owner's features), 2-accept (accepting one inserts it inside the string, quotes intact), 3-pascal (same in the Pascal style), 4-outside (typing `.` in a path outside a string opens nothing new). Measure from the DOM (suggest widget rows) and the editor value, not from the screenshot.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines, never the file as a whole. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/languageService.ts, frontend/src/codegen/ui/templateCompletion.ts, frontend/src/codegen/textual/ui/textualMonaco.ts, frontend/src/codegen/textual/__tests__/completion.test.ts. Nothing else; ask first. Before a new identifier, grep the codebase for it.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md (§4.1, §4.3, §8, §9); docs/decisions.md R-TXT-55; the F1a..F1c log entries in docs/log-inbox/codegen.md.
