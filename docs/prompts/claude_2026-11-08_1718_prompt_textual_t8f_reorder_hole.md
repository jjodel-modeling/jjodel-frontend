# T8f: the null hole after a homonym reorder on apply (found by P-2026-11-08-1705)

Prompt-ID: P-2026-11-08-1718
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-08 · lane textual-t8e-match · 000a8f1f4
Lane: full, root cause first (two-phase inside the lane: diagnosis report, then a fix only if it stays in frontend/src/codegen/textual/)
Depends: T8e (P-2026-11-08-1625, 1705), T7 reorder path
Worktree: ~/jjodel-w-textt8e, branch textual-t8e-match (same worktree; T8e is not merged until this is settled)
Request: Alfonso 2026-11-08 16:23 «procedi in lane auto»

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Read the final message of P-2026-11-08-1705 (~/.jjodel-lanes/P-2026-11-08-1705/log.jsonl, the result line) and its probe first. No CLAUDE.md 3.1 file, no core, no change outside frontend/src/codegen/textual/; if the cause is in jjscript/, the store or the reducer, stop after the report with Outcome: question and a Recommended line. Every reply opens with [P-2026-11-08-1718 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole log. If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-1718/handoff.md first.

## COSA

Observed by 1705: re-importing the turnstile text with two swapped homonym transitions, confirm turns Initial.transitions [48, 53, 63] into [53, 48, 63] in 6 of 8 runs and into [53, 48, null, 63] in 2 of 8 (same shape), no console error, reprinted text equal to the file. The apply script is the T7 reorder: -= and += of the two transitions. Unverified guess: the last += writes at index 3, the length before its -= landed.

(1) **Reproduce** deterministically: first in node (the apply path of textApply.ts and textDiff.ts with the real LModel or the test harness the T7 tests use), then in the app probe if node cannot. Find what makes it intermittent (timing, batching, a stale length, an await). Measure, do not guess.

(2) **Report** in docs/discovery/discovery_2026-11-08_t8f_reorder_hole.md (create docs/discovery/ if missing): objective, files read with paths, the reproduction and how to rerun it, the root cause with file:line, whether order-only pairing could already hit it before T8e (any reorder of a multi-valued containment), options for the fix with cost, a Recommended line. Commit it.

(3) **Fix**, only if the cause and the fix are inside frontend/src/codegen/textual/: test red first (deterministic), then the fix, one commit each. Then rerun the 1705 probe at least 10 times: 0 holes; and the T8d bench (no row worse than the T8e after table).

(4) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 import reds baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(5) **Docs**: one log entry in docs/log-inbox/codegen.md via the log-entry skill covering T8e and T8f together (Prompt-IDs 1625, 1705 and this one; commits; the T8e bench in short, Recommended keep 0.6 and 0.2; the hole and its fix; read path _lastSelected.node; Notes under 500 characters; Corregge and Causa the dash unless the fix corrects a logged prompt, then name it and give the Causa in parentheses), Status flips of the 1625, 1705 and this prompt; left uncommitted (RC-17). Edit only your new entry's lines. No push, no merge. Final message: the cause, the fix or why not, what was verified, Decisions taken (unattended), then the Outcome.

## DOVE

Read anything. Write only frontend/src/codegen/textual/ (textApply.ts, textDiff.ts, their tests) and the report; docs/log-inbox/codegen.md (your entry only); the three prompts' Status lines.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-1705/ (result, probe, crops 1-swap, 2-offscreen); ~/.jjodel-lanes/P-2026-11-08-1625/handoff.md; the T7, T8c and T8d log entries in docs/log-inbox/codegen.md.
