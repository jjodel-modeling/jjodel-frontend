# Textual syntax: replace the timing bound of the printer linearity test with an operation count (#205)

Prompt-ID: P-2026-11-04-0302
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: fast (one test file and, if needed, one counter in the printer)
Depends: P-2026-11-04-0250 (merged)
Worktree: ~/jjodel-w-textfix205, branch textual-fix-205
Request: none (ticket #205; the test blocked the merges of steps A and B under load)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: the tree is clean on the stated branch, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md or the core. Every reply opens with [P-2026-11-04-0302 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. Never cat a gate log: summary lines only, through node scripts/run-quiet.mjs LABEL -- CMD.

## COSA
frontend/src/codegen/textual/__tests__/tolerant.test.ts, test (viii) «linear name resolution in the printer» (around line 366) compares wall-clock time of 6,001 objects against 1,001 with a bound of 12x: measured 13.3 to 14.2 under full-suite load, 53/53 alone. Replace the time ratio with a load-independent check: count the resolver's lookups through an optional, test-only hook or counter on the printer's name resolution (an optional addition, no interface change), and assert the count grows linearly in the number of objects (at most c·n with c fixed by the first measurement, and strictly less than the quadratic figure). Keep a loose absolute time guard only as a sanity bound (one second). Red first: the old quadratic printer (git show 2daef6982~ or the pre-lane commit named in the test) must fail the count check; say how you proved it. Do the same for the parser's linearity test if it uses a ratio. Gates, one tool call each, from frontend/: npx tsc --noEmit; the textual suite; full npx vitest run (3 files red at import are the baseline); npm run build; npm run check:docs. Log entry in docs/log-inbox/codegen.md (Notes under 500 characters) and Status flip, written and committed: no visual check applies. Close #205 in the entry. No push, no merge. Public repo: name no partner company. Final message: what was verified and how, then Outcome: done.
