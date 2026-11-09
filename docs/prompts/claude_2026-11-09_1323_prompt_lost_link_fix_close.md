# Close the queued appends fix: final gates and docs

Prompt-ID: P-2026-11-09-1323
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-09 · lane lost-link-fix · 3b7e06289
Lane: full, critical (continuation of P-2026-11-09-1227, stopped at the context ceiling; launched with `--critical-zone-goahead P-2026-11-09-1323`)
Go-ahead: Alfonso 2026-11-09 12:24 «go-ahead per la zona critica, «A»» (same fix)
Depends: P-2026-11-09-1227 commits 6b66f67ad (LIR), f9b8f2e2a (helper), 3d567c77a (sites), c3eabab15 (probe), 0971567bb (bench tests); handoff ~/.jjodel-lanes/P-2026-11-09-1227/handoff.md
Worktree: ~/jjodel-w-lostfix, branch lost-link-fix, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. Read the handoff first; it holds the measures. No code change unless a gate is red because of the fix (then the smallest fix in the files of P-2026-11-09-1227's DOVE, and say it). No reducer, L-layer or core change. No subagents, no background tasks. Every reply opens with [P-2026-11-09-1323 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline: summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log; grep only MEAS, FAIL, DONE, error lines.

## COSA

(1) **Gates on the final tree**: typecheck, typecheck:scripts, full vitest (baseline 3 known import reds; any other red: rerun alone; a red caused by the sites is fixed, a load red is named), build, check:docs. Read each exit code.

(2) **LIR addendum** in `docs/discovery/lir_2026-11-09_queued_appends.md`: the two-drops table of the handoff (same tick, 60 ms, 700 ms; kept, edges, undos before and after: unchanged undo grouping, one undo removes both drops inside the reducer's time window, as before the fix). Commit.

(3) **Docs**: one log entry in docs/log-inbox/dcn.md via the log-entry skill for the whole fix (Prompt P-2026-11-09-1227 and this one; Notes at most 480 characters by `wc -m`; Corregge: the ticket of P-2026-11-08-1939; Causa one line; Layer Impact Report: the LIR path; Smoke visivo: probe MEAS, no crop; mutation 15/17 with M10, M17 equivalent; ticket paragraphs: `LModelElement.tsx:7425` and `applyMembershipOps` (`EditorV2.tsx:1793`) have the same read-modify-write shape, not routed; the drone fixture's EX-1 and EX-2 need `GV_SAVE`). Status flip of this prompt and of `docs/prompts/claude_2026-11-09_1227_prompt_lost_link_fix.md`. Remove the `frontend/node_modules` link. `git add` only named files. No push, no merge. Final message: gate table, files and commits, Decisions taken (unattended), then the Outcome.

## DOVE

docs/discovery/lir_2026-11-09_queued_appends.md; docs/log-inbox/dcn.md; the two prompts' Status lines; the fix files of P-2026-11-09-1227 only if a gate needs it. Nothing else; ask first.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-09-1227/handoff.md; docs/prompts/claude_2026-11-09_1227_prompt_lost_link_fix.md; docs/discovery/discovery_2026-11-09_lost_containment_write.md.
