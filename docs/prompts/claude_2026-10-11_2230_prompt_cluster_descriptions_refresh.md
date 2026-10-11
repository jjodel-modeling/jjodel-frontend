# Requirements tab: refresh the drifted cluster descriptions

Prompt-ID: P-2026-10-11-2230
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Front: harness
Lane: fast (one data file, `docs/goals/cluster-descriptions.json`; no code)
Depends: P-2026-10-11-1510, P-2026-10-11-2025
Status: eseguito

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-cdrefresh`, branch `cluster-desc-refresh`, cut from the trunk tip that carries the docs commit
adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a
clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-2230 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: a question with one recommendation inside this lane's perimeter is answered as recommended (RC-21).

## Context (measured, do not redo the analysis)
P-2026-10-11-2025 taught `req-trace.mjs` three more row heads (R-D, R-2/3.6, R-B12); they joined the co-citation graph
and the Louvain partition moved from 17 to 16 clusters. The chat read `/api/requirements` on the live board after the
merge (trunk `04dcdde9b`): orphan descriptions `R-IRN-3` and `R-JS-1`; drift on `R-A` (+2), `R-EDGE-1` (−9), `R-B9`
(+9), `R-SIM-3` (+6), `R-GEN-1` (+15), `R-SIM-1` (+2), `R-LAY-19` (−1); a new cluster `R-GV-16` (2 rows) without a
description; the other clusters unchanged. `docs/goals/README.md` («Cluster descriptions») says how to refresh: reread
the rows of each drifted cluster, rewrite its description, set `members`, `written` and `by` again; an orphan's text
moves to the cluster that took its rows, or is dropped.

## WHAT
1. Run `node frontend/scripts/req-trace.mjs --no-cache` and take the clusters, drift and orphans from it (they may
   differ slightly from the list above if the trunk moved; the run wins, report any difference).
2. For each drifted cluster and each cluster without a description: read its member rows in `docs/decisions.md` and
   write 2 to 4 sentences in English, as P-2026-10-11-1510 did (what the cluster is about, its sub-themes when it has
   more than one, realized versus open from req-trace's `realized`). Concrete nouns from the rows, no filler, no em
   dash. Set `members` (req-trace's order), `written: "2026-10-11"`, `by: "P-2026-10-11-2230"`.
3. For each orphan: if most of its old members now sit in one cluster, fold what still holds of its text into that
   cluster's new description; then remove the orphan key. Say in the report where each orphan went.
4. Leave untouched every cluster with no drift.
5. Independent check (RC-27): a fresh-context subagent reads, for each rewritten cluster, only the member rows and the
   description, and reports unsupported claims and missed major themes. Fix, and report findings and fixes.
6. Gates: the file parses; after the change req-trace reports no drift and no orphan; no em dash in the file;
   `npm run check:docs` from `frontend/`. Paste two of the new descriptions in the report.
7. One docs commit with an explicit pathspec, subject
   `docs(goals): refresh drifted cluster descriptions (P-2026-10-11-2230)`. Log entry in `docs/log-inbox/harness.md`,
   uncommitted (RC-17), and stop with `Outcome: hard-stop (review due)`. No merge.

## DO NOT
- Touch any file other than `docs/goals/cluster-descriptions.json` (and the uncommitted log entry).
- Change the clustering, req-trace, the tab, or `docs/decisions.md`.
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- `docs/goals/README.md` «Cluster descriptions»; `docs/prompts/claude_2026-10-11_1510_prompt_cluster_descriptions.md`.
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-21, RC-27.
