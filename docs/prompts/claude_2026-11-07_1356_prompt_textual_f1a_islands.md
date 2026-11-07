# Textual syntax, lane F1a: JjEL islands, the attributes that hold JjEL and their raw text

Prompt-ID: P-2026-11-07-1356
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (metamodel flag, pure islands module, tests; a probe)
Depends: D, E1, E2a, #687 (merged), R-TXT-55 (F1-F12)
Worktree: ~/jjodel-w-textf1a, branch textual-f1a-islands (from trunk 945db7ab8)
Request: none (lane auto, «Procedi con E e poi F»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency. Every reply opens with [P-2026-11-07-1356 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each item: test red first, its own commit (RC-51, code first).

## COSA

Row F1a of docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md §8.1, decisions F1 and F11 of §8.2 (R-TXT-55), designed in §3.2, §4.3 and §5.3; risks R1 and R3 of §9.

(1) **Measure first (R1)**, in a probe on one model of the port corpus or the state-machine fixture: what `String(a.type)` gives for an attribute typed by `Pointer_EXPRESSION` / `Pointer_ACTION` in the app, and whether `a.type?.id` is readable at `ui/TextualTab.tsx:161`. Also the ids check of §5.3. Write the readings in your final message; if the primitive's id cannot be read there, stop with Outcome: question.

(2) **`TextAttribute.jjel`** (optional) in `metamodel.ts`, set from the primitive's id as conformance keys it (F1); EString attributes are not JjEL (F11). The one line at `ui/TextualTab.tsx:161` that passes the type id, nothing else in that file.

(3) **`jjelIslands(parsed, mm)`**, pure, new `jjelIslands.ts`: every value of a `jjel` attribute in the parsed text as an island with its text span and the value-to-raw map per style (§4.3), so a JjEL offset maps to a text offset across escapes (`\"`, `\\`, Pascal's `''` and `#10`, R3). Tests in new `__tests__/jjelIslands.test.ts`: islands found for EXPRESSION and ACTION attributes in the C-like and Pascal styles, none for EString, the offset map across each escape, a value split by an escape at a token boundary. Mutation bench on the escape cases.

(4) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(5) **No visual change** in this lane (F1b colours them); no crops beyond the probe readings.

(6) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip, both left uncommitted (RC-17). Edit only your new entry's lines. No push, no merge. Final message: the R1 readings, what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/metamodel.ts, jjelIslands.ts (new), __tests__/jjelIslands.test.ts (new), ui/TextualTab.tsx (line :161 only). Nothing else; ask first. Before a new identifier, grep the codebase for it.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md (§3.2, §4, §5.3, §8, §9); docs/decisions.md R-TXT-55.
