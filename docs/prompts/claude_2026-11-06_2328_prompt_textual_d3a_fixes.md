# Textual syntax, step D, lane D3a: structured fixes on parse errors

Prompt-ID: P-2026-11-06-2328
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (parser; tests)
Depends: D2a-D2c merged (77a912e14), trunk 8049bf81b, R-TXT-53 (D6: a quick fix is a text edit only), docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §4.3 and §8 row D3a
Worktree: ~/jjodel-w-textd, branch textual-d-writing-aids, fast-forwarded to the trunk tip
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-06 23:10, «d parti»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-06-2328 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Each item: test red first, its own commit (RC-51, code first).

## COSA

Row D3a of the report §8, design §4.3. An optional `fix` on `TextParseError` (optional field, CLAUDE.md Rule 11), each a pure text edit (D6), never a model write:
(1) a missing token the repair inserted: the fix inserts it at the error point;
(2) an unknown reference with near names among the valid targets (edit distance, a small bound): one fix per near name, written as the printer writes it (D2b's exported writer), path when the name is not unique, `@"id"` never;
(3) a misspelled keyword or style token where the expected set (D2a) holds a near one: replace it;
(4) nothing for errors with no fixable shape. Tests red first in __tests__/tolerant.test.ts for each kind and for no fix; the mutation note of CLAUDE.md §5: without fixes asked, the parse result is identical on the whole textual corpus.
(5) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 baseline import reds; harness or order reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy.
(6) Log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Smoke visivo non applicabile, parser only), Status flip, uncommitted (RC-17). No push, no merge.

## DOVE

frontend/src/codegen/textual/parser.ts, frontend/src/codegen/textual/__tests__/tolerant.test.ts. If the near-name writer needs printer.ts, import it; do not change it. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §4, §8; docs/decisions.md R-TXT-21, R-TXT-28, R-TXT-53.
