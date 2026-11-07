# Multi-tab, lane L4b: problem producers clear only when the last instance of a model unmounts

Prompt-ID: P-2026-11-07-0833
Chat: C-2026-11-07-0425
Front: multi-tab
Status: da eseguire
Lane: full (`problems/` subtree, CLAUDE.md §3.1; not critical zone)
Depends: docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §4.2 and §7 row L4b; R-MT-1..19
Worktree: ~/jjodel-w-mtl4b, branch multi-tab-l4b, at this prompt's commit on alfonso-frontend-jjtl (node_modules by the P14 symlink, removed at the end)
Request: none (lane L4b of the discovery's plan, launched under /lane auto)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents. No dev server and no app probe in this lane (the app check comes with L6, which makes two tabs on one model reachable). Every reply opens with [P-2026-11-07-0833 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or gate log. Context discipline: read only the line ranges you need, one commit per numbered item.

## Contesto (non rifare l'analisi)

Discovery §4.2: the problem producers mount per `EditorV2` instance (`EditorV2.tsx:5121-5124`) and write ids that two tabs on one model share, which is right. The defect: each unmount clears for the whole model (`ConformanceProblemSync.tsx:122-123`, `SimCheckProblemSync.tsx:65-66`, `ValidationFreshnessSync.tsx:74`), so closing one tab erases the badges of the other. The precedent for the fix is the ref count of `scriptPreviewStore.ts:117-139`. Verify the line numbers on this commit.

## COSA

(1) Tests first, red, committed: a mount counter per model in `problems/registry.ts`; two mounts and one unmount of the same model leave the problems in place; the last unmount clears them; different models never affect each other.

(2) The change: a ref count per model id in `problems/registry.ts` (acquire on mount, release on unmount, clear only when the count returns to zero), used by `ConformanceProblemSync.tsx`, `SimCheckProblemSync.tsx` and `ValidationFreshnessSync.tsx`. Check `UniquenessProblemSync.tsx` too and include it only if it has the same cleanup. No change to the problem ids or the values written. Tests green.

(3) Gates at the baselines of `CLAUDE.md` §17: `npm run typecheck`, `npx vitest run` (timing tests `languageService`, `outline`, `tolerant`, `laneBoard`, `irCollapsedRender`, `irSelectionRing`, `traceMonitor` rerun alone if red, report both), `npm run build`, `npm run check:docs`. Log entry in `docs/log-inbox/multi-tab.md` (P9) with `Smoke visivo: non applicabile (reachable from L6)`, and the Status flip; one docs commit for both (no visual check is due in this lane).

## HARD STOP

After (3). Any file outside `components/editor-v2/problems/` and its tests, the inbox and this prompt is a stop with Outcome: question. Remove the node_modules symlink before exiting. No push, no merge.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §4.2, §7; docs/decisions.md R-MT; CLAUDE.md §3.1.
