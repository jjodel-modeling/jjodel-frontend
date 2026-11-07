# Multi-tab, layout-key fix: measure and close (continuation of P-2026-11-07-0555)

Prompt-ID: P-2026-11-07-0628
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-07 · lane full · closing docs commit · switch +474 ms over parent (300 ms target not met, the cost is a question for Alfonso); verifica visiva in attesa del GO (crops in ~/.jjodel-lanes/P-2026-11-07-0555/crops-0628/)
Lane: full (measurement and closure; no source change)
Depends: P-2026-11-07-0555 (tests e6aa6c026, fix 8328662df, LIR addendum e6241d590), handoff in ~/.jjodel-lanes/P-2026-11-07-0555/handoff.md
Worktree: ~/jjodel-w-mtlk, branch multi-tab-layout-key, at this prompt's commit (node_modules by the P14 symlink, removed at the end)
Request: none (continuation under /lane auto after the context ceiling)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -3, git status --short: HEAD is this prompt's commit and the only uncommitted files are the 0430 inbox entry and Status flip; otherwise stop with Outcome: blocked. No source changes. No subagents. Every reply opens with [P-2026-11-07-0628 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe, test or gate log; one probe run per tool call. Read `handoff.md` of 0555 first and nothing of its log. Before each probe run check `uptime`: above 40 on the 1-minute load, wait (no sleep longer than 60 s per call) and say so; never compare runs from different load bands.

## COSA

Items (3), (4) and (5) of `docs/prompts/claude_2026-11-07_0555_prompt_multi_tab_layout_key_cost.md`, exactly as the handoff lists them: recreate the parent worktree, run the probes from the 0555 lane folder, restore the 0431 crops from `crops-0431-backup` after the layout probe overwrites them, classify the vitest failures and rerun the timing tests alone, build, check:docs, closing docs commit (LIR addendum with the figures, inbox entries of 0430 and 0555 with `Smoke visivo`, Status flips of 0430, 0431, 0555 and 0628).

If head-minus-parent stays above 300 ms, do not change code: report where the remaining time goes (the 0555 estimate is about +500 ms, React Flow re-measuring the handles of nodes that really move) and close anyway. Whether that cost is accepted is a question for Alfonso, not for this lane.

Exit with Outcome: hard-stop (visual check due).

## HARD STOP

After the closure commit. Remove the parent worktree, the node_modules symlinks, and stop every dev server first. No push, no merge.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-07-0555/handoff.md; ~/.jjodel-lanes/P-2026-11-07-0431/results-0431.md; docs/discovery/lir_2026-11-07_layout_key_resync.md; docs/decisions.md R-MT-19.
