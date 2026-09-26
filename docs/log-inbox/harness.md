# log-inbox — lane «harness»

Entries written by the harness lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

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

## 2026-09-26 — chore(dev): allow the shared node_modules in the Vite serving list (P-2026-09-26-1335)
**Prompt**: `claude_2026-09-26_1335_prompt_bootstrap_icons_font.md`, fast lane, single phase on `icons-font` in `~/jjodel-icons`, one hard stop (Alfonso's check on 3005). On every worktree dev server the Bootstrap Icons font returned 403 and the icons rendered as empty squares: the P14 `node_modules` symlink makes Vite serve the font from its real path under `~/jjodel`, outside the default `server.fs.allow`.
**Files touched**: report `ad64eaa34`: `docs/discovery/discovery_2026-09-26_bootstrap_icons_font_403.md` (new). Code `b1ba29157`: `frontend/vite.config.ts` (`server.fs.allow` = `searchForWorkspaceRoot(__dirname)` + the real `node_modules`, guarded `realpathSync`). Docs, this commit: this entry, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: 2026-09-26 11:00 (observation of chat C-2026-09-26-1100: Bootstrap icons as empty squares on 3001, font 403 there, 200 on 3000)
**Causa**: (g)
**Regressions**: no. On 3005 the font went from 403 to 200 `font/woff2`; the controls `/@fs/.../jjodel/frontend/package.json` and `/@fs/etc/hosts` stayed 403. Gates on `b1ba29157`: typecheck 14, the §17 set; typecheck:scripts exit 0; build exit 0, same 51 warning lines, `dist/` md5-identical to a HEAD-config build (3494 files); vitest 4818 passed, 0 failed, the same 9 red at import; `check:docs` 4/4.
**Out-of-scope changes**: no — one config file as declared. Report and config in two commits instead of one, per P13.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso on 3005, private window, 2026-09-26: the Bootstrap icons render)
**Notes**: Mechanism: Vite realpaths resolved modules but not the allow entries; the CSS passes via safeModulePaths, its url() font does not. ~/jjodel unaffected: its real node_modules is inside its root. Code commit first made as 5a890a0df and amended at the ACK to add the name check to its body; tree identical. Vitest 4818 measured on 9290c17be. Temporary symlink frontend/node_modules created and removed. Detail: the report, §2-§4.
**Prompt document name**: 2026-09-26 13:35
**Ticket** (priority low, not a slot). `frontend/vite.config.ts` is type-checked by no gate (`tsconfig.json` includes `src` only). A manual `tsc` on it reports one TS2769, `css.preprocessorOptions.scss` (`api`, `includePaths`) not assignable to `SassPreprocessorOptions`, identical on the HEAD config and after this fix (report §4).
