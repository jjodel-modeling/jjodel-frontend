# Patch 3.1.2: app check of the layout-key fix on the 3.1.1 base

Prompt-ID: P-2026-11-07-1536
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-07 · PR #210 merged ec4f2543e, tag 3.1.2 · verifica visiva OK Alfonso 2026-11-07 17:38
Lane: full (measurement only; no commit in the worktree)
Depends: R-MT-19, R-MT-23; fix on the trunk da2af3bf7; probes of P-2026-11-07-0628
Worktree: ~/jjodel-w-rel312p, branch release/3.1.2-patch at ea287b0f0 (origin/dotnet-backend-integration e080ab534, i.e. 3.1.1, plus the four fix commits and the 3.1.2 release commit), node_modules by the P14 symlink, removed at the end. This prompt is kept outside every worktree (another chat blocks the trunk); the chat commits it to the trunk with its Status flip.
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (Alfonso 2026-11-07 09:29 «Ok alle raccomandazioni» (2026-11-07 15:32 «2»: 3.1.2 cut from 3.1.1 with the fix only, checked on that base))

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P13 Status flip and log entry are written by the chat on the trunk, because this lane must not commit on a release branch (motivo: the patch branch carries only the fix and its tests).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is ea287b0f0 and the tree is clean, otherwise stop with Outcome: blocked. No commits, no source changes. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 4700), stopped before exit. Every reply opens with [P-2026-11-07-1536 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe or test log; one probe run per tool call. Check `uptime` before each probe run; above 40 on the 1-minute load, wait.

## COSA

(1) Copy the layout and container probes and their dev-server configs from `~/.jjodel-lanes/P-2026-11-07-1008/` (they already set the 3.1.1 welcome-screen key in the seed) into `~/.jjodel-lanes/P-2026-11-07-1536/`; adapt only ports and paths. Never edit the originals.
(2) Layout probe, three runs on this branch: expect 3/3 at every step. Container probe, one run: 0 failures.
(3) The same layout probe once on `origin/dotnet-backend-integration` (a detached worktree of your own in the lane folder, removed at the end): expect the regression (nodes at the previous viewpoint's positions), which confirms the probe sees it on this base.
(4) Crops in light theme, at most three, in the lane folder.
(5) Write `results-1536.md` in the lane folder with the tables. Exit with Outcome: hard-stop (visual check due).

## HARD STOP

After (5). Remove the extra worktree, the node_modules symlink, stop every dev server. No commit, no push, no merge.

## RIFERIMENTI

docs/discovery/lir_2026-11-07_layout_key_resync.md; ~/.jjodel-lanes/P-2026-11-07-0555/handoff.md; docs/decisions.md R-MT-19, R-MT-23.
