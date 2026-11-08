# T8e acceptance after the settle fix, and the T8e log entry

Prompt-ID: P-2026-11-08-1927
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full, verification and docs only (no source change)
Depends: T8e (P-2026-11-08-1625, 1705, 1718), the settle fix (P-2026-11-08-1759, merged on the trunk), trunk merged into this branch at 16f7302f6
Worktree: ~/jjodel-w-textt8e, branch textual-t8e-match
Request: Alfonso 2026-11-08 17:58 «si a tutto»: T8e merged after the settle fix lands

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No source change: if a check fails, stop with Outcome: question and a Recommended line. Every reply opens with [P-2026-11-08-1927 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole log. If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-1927/handoff.md first.

## COSA

(1) **Gates** on this tree, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 import reds baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(2) **Acceptance**: the 1705 probe (~/.jjodel-lanes/P-2026-11-08-1705/, copied with what it imports) on its own port, 1-swap at least 20 times: 0 holes in Initial.transitions, pairing right, ids kept; 2-offscreen once. Crops 1-swap, 2-offscreen in ~/.jjodel-lanes/P-2026-11-08-1927/. Measure from the DOM, Monaco and the store.

(3) **Docs**: one log entry in docs/log-inbox/codegen.md via the log-entry skill for T8e (Prompt-IDs 1625, 1705, 1718 and this one; commits 723eb1233, ad25337a7, 52c8422ea; bench wrong uncertain 5564 to 213 over 30225 objects, no row worse; grid, Recommended keep 0.6 and 0.2; read path _lastSelected.node; the hole was the JjScript settle race, fixed by P-2026-11-08-1759; the acceptance numbers; Notes under 500 characters; Corregge and Causa the dash; Layer Impact Report not-required), Status flips of the 1625, 1705, 1718 prompts and this one; left uncommitted (RC-17). Edit only your new entry's lines. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

No source file. docs/log-inbox/codegen.md (your entry only), the four prompts' Status lines, files in ~/.jjodel-lanes/P-2026-11-08-1927/.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-1625/handoff.md, the 1705 result and probe, the T8f report docs/discovery/discovery_2026-11-08_t8f_reorder_hole.md, the settle fix log entry in docs/log-inbox/codegen.md.
