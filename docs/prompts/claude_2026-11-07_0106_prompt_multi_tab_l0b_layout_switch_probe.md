# Multi-tab, lane L0b probe: does a switch between two exclusive viewpoints still move the nodes to the new layout?

Prompt-ID: P-2026-11-07-0106
Chat: C-2026-11-06-2333
Front: multi-tab
Status: da eseguire
Lane: full (measurement only, no source change; the fix, if any, is a critical-zone lane of its own)
Depends: R-MT-13, R-LAY-14, R-LAY-18, docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §3.4, §6, §7 row L0b
Worktree: ~/jjodel-w-mtl0b, branch multi-tab-l0b, at this prompt's commit on alfonso-frontend-jjtl (node_modules by the P14 symlink, removed at the end)
Request: none (lane L0b of the discovery's plan, launched under /lane auto)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No source changes on any branch: probes and fixtures only in the lane folder ~/.jjodel-lanes/P-2026-11-07-0106/. No subagents. A dev server for the probe is allowed: start it on a free port (check with lsof first; never 3000, 3001, 3003), stop it before the report. Every reply opens with [P-2026-11-07-0106 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe log; one probe run per tool call.

## COSA

The discovery read (§3.4, not measured) that since `242a82bcd` (2026-10-21) nothing in the incremental sync of `components/editor-v2/hooks/useJjomSync.ts` re-runs when only the layout key changes (`:1406`, `:1617` at `6fcf5d5df`), so after switching from one exclusive viewpoint to another the nodes may stay at the previous key's positions instead of `layoutByViewpoint[newKey]`.

(1) Fixture: one model with three classes, two exclusive syntax viewpoints, and different stored positions per viewpoint (move the nodes under each viewpoint through the app, so the records are written by the real path).
(2) Measure, on this commit and on `242a82bcd~1` (a second worktree of your own in the lane folder, detached, removed at the end): switch A → B → A from the toolbar picker; at each step read the React Flow node positions from the DOM and `layoutByViewpoint[key]` of each vertex from the store; also after a reload on B. Three runs per commit. One table per commit: expected position, rendered position, match yes/no.
(3) Verdict: regression confirmed, not confirmed, or confirmed only under a condition you name. If confirmed, name the smallest change in `useJjomSync.ts` (a dependency on the layout key plus a re-transform of every vertex on change, R-LAY-18) and what a Layer Impact Report for it must cover; write no code.

Report, mandatory: docs/discovery/discovery_2026-11-07_layout_switch_after_242a82bcd.md (hypothesis, objective, files read with full paths, findings with file:line and verbatim quotes, the tables, verdict, risks, open questions, «Decisions taken (unattended)», «Decisions awaiting Alfonso», a «## 0. Answer in brief» at the top), committed on branch multi-tab-l0b, plus the Status flip left uncommitted (RC-17). Remove the node_modules symlink. Hard stop after the report. No push, no merge.

## HARD STOP

After the report is committed. Any change outside the report and the lane folder is a stop with Outcome: blocked.

## DOVE

Read: frontend/src/components/editor-v2/hooks/useJjomSync.ts, frontend/src/components/editor-v2/utils/jjomTransformers.ts, frontend/src/components/editor-v2/viewpoint/layout/, docs/discovery/discovery_2026-10-21_jjomsync_incremental.md (open point at :221-223). Write: the report and the lane folder.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §3.4; docs/decisions.md R-LAY-14, R-LAY-16, R-LAY-18, R-MT-13; commit 242a82bcd.
