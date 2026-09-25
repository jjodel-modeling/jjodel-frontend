# log-inbox — lane «harness»

Entries written by the harness lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-25 — chore(harness): one Vite cache per worktree, P14 names the permanent symlinks (P-2026-09-25-1353)
**Prompt**: `claude_2026-09-25_1353_prompt_harness_worktree_isolation.md`, fast lane, one hard stop (Alfonso's check on 3001). Two defects of the worktree setup, measured when 3001 went blank during the open-path merge: P14 called `~/jjodel-release` a tree without `node_modules` and told a lane to remove the gate symlink; with no `cacheDir`, every tree wrote the Vite cache in `~/jjodel/frontend/node_modules/.vite` through the shared symlink.
**Files touched**: code `465605cd7`: `frontend/vite.config.ts` (`cacheDir` = `frontend/.vite-cache`), `.gitignore` (`/frontend/.vite-cache/`). Docs, this commit: `docs/PROTOCOL.md` (P14: two bullets replace the `node_modules` one, permanent symlinks and one Vite cache per tree), this entry, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: 2026-09-25 11:15 (the open-path merge, whose gates removed the `node_modules` symlink 3001 needed; the merge has no log entry by precedent)
**Causa**: (g)
**Regressions**: no. `cacheDir` resolved to `frontend/node_modules/.vite` (realpath in `~/jjodel`) before, `frontend/.vite-cache` after. 3001 restarted from `~/jjodel-release/frontend` (pid 49582 stopped, cwd checked; pid 61660): its own cache got 2300 deps files at 14:00:05, the shared deps kept 13:19:28 with 0 files newer than the restart (control: 2301 in the own cache). Gates: `npm run typecheck` 14 errors, the §17 set; `npm run build` exit 0; `check:docs` 4/4; vitest 4620 passed, unchanged, the same 9 files red at import.
**Out-of-scope changes**: yes — the P14 amendment in `docs/PROTOCOL.md` moved from the code commit, where the prompt put it, to this closure commit, per P13 (docs and code never in one commit; `bash-guard` denies the mixed pathspec). The code commit's subject drops "P14 names the permanent symlinks" to match its content. No file outside the prompt's three plus the closure pair.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso, 3001 after a hard refresh: a healthy project opens, the page is not blank)
**Notes**: Second cause (a): the P14 text. Measured in P-2026-09-25-1115: at 12:5x `ls` found no `~/jjodel-release/frontend/node_modules`; that lane created a link and removed its own, so who removed the permanent one earlier is not measured. The body of `465605cd7` says the split was "ruled in chat": inaccurate, it was the lane's proposal under P13, accepted in session; not rewritten. The name check's only `.vite-cache` hits were the prompt's own text: accepted.
**Prompt document name**: 2026-09-25 13:53

**Ticket** (opened, not fixed here). The Vitest results cache is still shared by every tree: `frontend/vitest.config.ts` sets no `cacheDir`, so Vitest writes `node_modules/.vite/vitest/.../results.json`, which the symlink resolves into `~/jjodel`. Measured: this lane's `npx vitest run` from `~/jjodel-release` wrote `~/jjodel/frontend/node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json` at 13:57:38. It only orders test files by past duration and failure, so no result is wrong; a `cacheDir` in `vitest.config.ts` is its own change.

**Ticket** (opened, not fixed here). Two stale Vite directories left in place, untracked: `~/jjodel-release/frontend/.vite/` (`deps/` of 2026-09-14 12:59) and `~/jjodel-sim/frontend/.vite/` (`deps/` of 2026-09-14 15:07). Nothing reads them after this lane (`cacheDir` is `.vite-cache`); `~/jjodel/frontend/node_modules/.vite` stays too, for Alfonso. Removing them is his call; no lane runs `rm -rf` on a cache.
