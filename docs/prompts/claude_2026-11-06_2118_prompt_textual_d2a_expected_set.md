# Textual syntax, step D, lane D2a: the expected set at a cursor

Prompt-ID: P-2026-11-06-2118
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-06 · lane full · c4a545aa3, e23c3870c · gates green · parser only, no visual check · log entry and Status flip uncommitted (RC-17)
Lane: full (parser; tests)
Depends: P-2026-11-06-2040 (step D discovery, §3.3 C1 and §8 row D2a), R-TXT-53 (provisional, D2 and D10)
Worktree: ~/jjodel-w-textd, branch textual-d-writing-aids
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-06 20:34, «decidi tu in /lane auto»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-06-2118 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Each item: test red first, its own commit (RC-51, code first).

## COSA

Row D2a of docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §8, design §3.3 C1, decision D2 (the parser computes the set, not message parsing, not a second grammar walker) and D10 (step C tokens).

(1) An optional `cursor?: number` on the parse options. Under it the parser records, at the first token whose start is at or after the cursor, every grammar node it tested there with `canAt`/`hit`, nullable ones included, and returns them as an optional `expected?: readonly ExpectedItem[]` on the result. An item is a matcher plus the node kind it came from: `kw`/`p` (keywords and style tokens, a block's own tokens and the head prefix included), `lit` (enum rule), `xref` (targets, type, feature), `tok` (`NAME` of a head, a value of a type), `block` (open, or the rest of a multi-word close once begun). The set is computed before the EOF branch returns (F3 of the report).
(2) Tests in __tests__/completion.test.ts (new) on the seven cursors of the report's probe (§3.2) plus a per-block token, a head prefix and a half-typed multi-word close.
(3) The mutation note of CLAUDE.md §5: without `cursor` the parse result is identical on the whole textual corpus (a test that compares).
(4) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 baseline import reds; harness or order reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy.
(5) Log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Smoke visivo non applicabile, parser only), Status flip, uncommitted (RC-17). No push, no merge.

## DOVE

frontend/src/codegen/textual/parser.ts, frontend/src/codegen/textual/__tests__/completion.test.ts (new). Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §3, §8; docs/decisions.md R-TXT-21, R-TXT-28, R-TXT-51..53; probes ~/.jjodel-lanes/P-2026-11-06-2040/probe_expected.ts.
