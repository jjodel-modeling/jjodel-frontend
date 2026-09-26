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

## 2026-09-25 — chore(dev): let the Vite dependency scan parse decorators (P-2026-09-25-1820)
**Prompt**: `claude_2026-09-25_1820_prompt_vite_dep_scan.md`, fast lane, single phase on `vite-dep-scan` in `~/jjodel-vite`, one hard stop (Alfonso's check on 3005). The ticket of P-2026-09-25-1500: on a cold start the dependency scan fails on `MTM.tsx:27` importing `Nearley`, nothing is pre-bundled and the first page load reloads once.
**Files touched**: report `59701d5f0`: `docs/discovery/discovery_2026-09-25_vite_dep_scan.md` (new). Code `8a4335402`: `frontend/vite.config.ts` (`optimizeDeps.esbuildOptions.tsconfigRaw`; `optimizeDeps.include` + `util` and three nodePolyfills shims). Docs, this commit: this entry, two tickets, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: 2026-09-25 15:00 (ticket: the Vite dependency scan fails on every cold start)
**Causa**: (g)
**Regressions**: no. Cold start before: scan error, 58 deps found at runtime, `reloading`, 3 navigations; after: no scan error, 64 pre-bundled at startup, 0 discovered, no reload, one document load; warm restart: no rescan, `_metadata.json` byte-identical. Gates on `8a4335402`: typecheck 14, the §17 set; build exit 0, `dist/` md5-identical to a HEAD-config build (3494 files); vitest 4629 passed, 0 failed, the same 9 red at import; `check:docs` 4/4.
**Out-of-scope changes**: no — one config file as declared; the `include` ids go beyond the prompt's candidates but stay in it, accepted at the hard stop. Report and config in two commits instead of one, per P13, accepted.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso on 3005, private window: a healthy project opens, one page load, no automatic reload, app as on 3001)
**Notes**: Cause: an esbuild 0.27.7 bug, not missing decorators: legacy decorators + `@dec export class X` naming `X` + a direct eval emit `export { _X }` with no alias. `U.tsx` has the same broken export, but only in the scan, which no longer uses legacy decorators, so this fix covers it: no ticket. Temporary symlink `frontend/node_modules` created and removed. Detail: the report, §2-§4.
**Prompt document name**: 2026-09-25 18:20

## 2026-09-25 — ticket: re-check the Vite scan override at the next esbuild upgrade
**Ticket**: `frontend/vite.config.ts` turns `experimentalDecorators` off for the dependency scan (`optimizeDeps.esbuildOptions.tsconfigRaw`) to dodge an esbuild 0.27.7 bug. At the next esbuild upgrade, run the three-ingredient minimal repro (legacy decorators; `@dec export class A { static f(s){ eval(s); return A; } }`; transform emits `export { _A }` instead of `export { A }`) and drop the override if it now emits `export { A }`.
**Priority**: low
**Found in**: P-2026-09-25-1820
**Detail**: docs/discovery/discovery_2026-09-25_vite_dep_scan.md (§2.2)

## 2026-09-25 — ticket: narrow optimizeDeps.entries to index.html and clean up public/
**Ticket**: The Vite dependency scan uses the default entries glob and reads `test.html`, `public/index.html` and 17 ace demo pages under `public/webjars/ace/1.3.3/`. Narrow `optimizeDeps.entries` to `index.html`, together with a cleanup of those 17 ace demo pages from `public/`.
**Priority**: low
**Found in**: P-2026-09-25-1820
**Detail**: docs/discovery/discovery_2026-09-25_vite_dep_scan.md (§1, §6)
