# Multi-tab, layout-key fix: cut the cost of the re-transform on a switch (continuation of P-2026-11-07-0430/0431)

Prompt-ID: P-2026-11-07-0555
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-07 · lane full · e6241d590, e6aa6c026, 8328662df · soft context ceiling, items 3-5 continued by P-2026-11-07-0628
Lane: full (critical zone: useJjomSync.ts; standing go-ahead of Alfonso 2026-11-07 04:23 for the R-MT-19 fix, launched with --critical-zone-goahead P-2026-11-07-0555)
Depends: P-2026-11-07-0430 (fix 03a093081), P-2026-11-07-0431 (measures in ~/.jjodel-lanes/P-2026-11-07-0431/results-0431.md), R-MT-19
Worktree: ~/jjodel-w-mtlk, branch multi-tab-layout-key, at this prompt's commit (node_modules by the P14 symlink, removed at the end)
Request: none (adopts the Recommended answer of P-2026-11-07-0431 under /lane auto, RC-21)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -3, git status --short: HEAD is this prompt's commit; the only uncommitted files are the 0430 inbox entry and Status flip; otherwise stop with Outcome: blocked. Leave those two files as they are. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 4700), stopped before exit. Every reply opens with [P-2026-11-07-0555 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe or test log; one probe run per tool call. Context discipline: read `results-0431.md` first, not the 0431 log; one commit per numbered item. Before each probe run check `uptime`: if the 1-minute load is above 40, wait and say so; never compare runs taken at different load bands.

## Contesto (non rifare l'analisi)

The fix is correct (0431: 3/3 on every step, container viewpoint unchanged). It costs +723 ms per switch on the 407-instance harness model (switch «Lane process (BPMN)» → «Lane process», fix 5687 ms mean wall against 4964 on the parent `753122b0b`, +713 ms over interleaved runs, slower in 5 of 6 pairs). The extra time is L-layer reads triggered by the one-time re-transform of every vertex: `joiner/proxy.ts` 198–219 ms against 75–93, `LModelElement` 58–78 against 27–34, `@xyflow/react` higher.

## COSA

(1) Profile one switch on the fix and name the vertex-transform work that a key change does not need. Hypothesis to falsify first: on a key change only position and size depend on the key, so a vertex whose snapshot differs only in `term:layoutKey` can take the existing patch path (position from `layoutByViewpoint[newKey]`, `patchedNodeSizes` / `measured` removal) without the full transform and its proxy reads. Write the finding as an addendum to `docs/discovery/lir_2026-11-07_layout_key_resync.md` before any code (commit alone).

(2) If the hypothesis holds: tests first (red, committed), extending `vertexSnapshotLayoutKey.test.ts`: a key-only change takes the cheap path and lands on the new key's position; a key change together with a content change still re-transforms that vertex; same-key runs re-transform nothing. Then the change, in `useJjomSync.ts` and `vertexSnapshot.ts` only. Tests green. If the hypothesis is false, stop after (1) with Outcome: question and the next cheapest option.

(3) Measure again with the 0431 probe copies (`~/.jjodel-lanes/P-2026-11-07-0431/`, copy into this lane's folder, do not edit): the cost scene interleaved fix/parent, three pairs, same load band; the correctness table of 0431 item (1), three runs; the container scene, one run. Target: head-minus-parent under 300 ms. Report the table whatever the result.

(4) Gates at the baselines of `CLAUDE.md` §17: typecheck, vitest (timing tests `languageService`, `outline`, `tolerant` and `laneBoard` rerun alone if red), build, check:docs.

(5) Closure, one docs commit: LIR addendum with the figures of 0431 and of this lane; the 0430 inbox entry with `Smoke visivo` from 0431 and this lane, and this lane's own entry; the Status flips of 0430, 0431 and 0555. Exit with Outcome: hard-stop (visual check due). Crops: reuse the five of 0431 unless positions changed.

## HARD STOP

After (5), or after (1) if the hypothesis is false. Any file outside `useJjomSync.ts`, `vertexSnapshot.ts`, their tests, the LIR, the inbox and the three prompts' Status lines is a stop with Outcome: question. Remove the node_modules symlink before exiting. No push, no merge.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-07-0431/results-0431.md; docs/discovery/lir_2026-11-07_layout_key_resync.md; docs/discovery/discovery_2026-11-07_layout_switch_after_242a82bcd.md §5, §6; docs/decisions.md R-MT-19; commits 03a093081, 242a82bcd, d9ea6a486.
