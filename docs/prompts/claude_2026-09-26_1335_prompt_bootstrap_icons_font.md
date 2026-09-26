# Prompt: the Bootstrap Icons font returns 403 on every worktree dev server

Prompt-ID: P-2026-09-26-1335
Chat: C-2026-09-26-1335
Lane: fast (dev tooling, one config file expected)
Status: da eseguire

Worktree: `~/jjodel-icons`, branch `icons-font`, created by the project chat from the trunk at the commit that adds this file. Setup, each a hard stop if it fails: `pwd` is `/Users/alfonso/jjodel-icons`; `git branch --show-current` is `icons-font`; `git status` empty; `git log -1` reads `docs: add prompt P-2026-09-26-1335, Bootstrap Icons font 403`. Every commit of this lane goes on `icons-font`. The merge into the trunk is a separate prompt.

**Other lanes.** `P-2026-09-25-1905` may be running in `~/jjodel-open` (port 3003) and the simulator lanes in `~/jjodel-sim` (port 3002). Do not touch `~/jjodel`, `~/jjodel-release`, `~/jjodel-sim`, `~/jjodel-open`, `~/jjodel-gate`, `~/jjodel-harness`, their caches, nor any server you did not start (3000..3004 are not yours).

**Environment (P14).** This tree has no `node_modules`: create the temporary symlink `frontend/node_modules -> ~/jjodel/frontend/node_modules`, name it in the report, remove it at the end after checking it did not exist when the lane started. The symlink is not only the environment here, it is the bug: keep it in place for every measurement. The Vite cache is this tree's `frontend/.vite-cache`. Dev server on **3005** only, from this tree, after `lsof -nP -iTCP:3005 -sTCP:LISTEN` shows it free; if 3005 is taken, stop and ask.

Single phase, with one hard stop (step 6).

## COSA

Measured on 2026-09-26 from chat `C-2026-09-26-1100`. On 3001 (`~/jjodel-release`, trunk `alfonso-frontend-jjtl`, tip `6aeda5de4`) every Bootstrap icon renders as an empty square; on 3000 (`~/jjodel`, `validation-skeleton`) the same icons render. `frontend/src/index.tsx:7` imports `bootstrap-icons/font/bootstrap-icons.css`; on 3001 that CSS points the font to `/@fs/Users/alfonso/jjodel/frontend/node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2`, which returns 403 on 3001 and 200 on 3000.

Cause, to be confirmed in step 2: in every worktree `frontend/node_modules` is a symlink to `~/jjodel/frontend/node_modules` (P14, `465605cd7`, `d2eb241a7`). Vite 7.3.2 resolves the real path, which lies outside the worktree root, and `server.fs.allow` (default: the workspace root found from the config file) refuses it. `~/jjodel` is unaffected because there the real path is inside the root. The same holds for 3002 and 3003.

Wanted: on a worktree dev server the font request returns 200 and the icons render; a request for a path outside both the worktree root and the real `node_modules` directory still returns 403; the production build is unchanged; no source file under `src/` changed; no absolute path hard-coded in the config.

## COME

1. Preconditions: setup above; read `CLAUDE.md`, `docs/PROTOCOL.md` P13/P14, `frontend/vite.config.ts` in full (last touched by `8a4335402` and `465605cd7`).
2. **Measure before**, saved in `docs/discovery/discovery_2026-09-26_bootstrap_icons_font_403.md` (mandatory): start the server (`mkdir -p /tmp/s5`, `nohup npx vite --port 3005 --strictPort > /tmp/s5/vite3005.log 2>&1 &`), then from a shell:
   - Follow the module graph as the browser does: `curl -s http://localhost:3005/src/index.tsx` and read the URL Vite rewrote for the `bootstrap-icons.css` import (record it; on a worktree it is expected to be an `/@fs/Users/alfonso/jjodel/frontend/node_modules/...` URL); fetch that CSS and extract the `url(...)` of the `.woff2` font from it.
   - `curl -o /dev/null -s -w '%{http_code} %{content_type}\n' 'http://localhost:3005<that url>'`. Expected 403. Record the matching line in `/tmp/s5/vite3005.log` (Vite prints the request as outside the serving allow list).
   - Negative controls, to be repeated after the fix with the same expected result: `/@fs/Users/alfonso/jjodel/frontend/package.json` (parent of the real `node_modules`, outside both roots) and `/@fs/etc/hosts`. Expected 403 each.
   - State the mechanism with evidence from the Vite 7.3.2 source in `node_modules/vite/dist/node/` (the allow check and the realpath step), and say what the default allow list is for this tree (`searchForWorkspaceRoot` result). Then stop the server.
3. **Fix, config only**, in `frontend/vite.config.ts`: add `server.fs.allow` listing (a) the workspace root Vite allows by default, obtained with `searchForWorkspaceRoot(__dirname)` from `vite` so the default is kept rather than replaced, and (b) the real `node_modules` directory, resolved at config time with `fs.realpathSync(path.resolve(__dirname, 'node_modules'))`, guarded so a missing `node_modules` does not throw at config load. No literal `/Users/...` anywhere. A one-line comment stating why (the P14 symlink). No new dependency. Name check for any new identifier. If this route does not make the font 200, stop and ask before trying `resolve.preserveSymlinks` or any change under `src/`.
4. **Measure after**: restart on 3005 (warm cache is fine, the allow list is read at startup). Same probes as step 2. Expected: the font URL returns 200 with a `font/woff2` content type; the two negative controls still return 403; the log shows no allow-list line for the font. Also confirm `~/jjodel` is unaffected by reading `searchForWorkspaceRoot` and the realpath value in a `node -e` one-liner or by reasoning from the config (do not start a server in `~/jjodel`).
5. Gates from `frontend/`: `npm run typecheck` (14, the §17 set; state the trunk tip count first), `npm run typecheck:scripts` exit 0, `npm run build` exit 0 with the same warnings, and `dist/` compared with a build of the unchanged config (build once before step 3 and copy `dist/` to `/tmp/s5/dist-before`, then compare the md5 lists after the fix, as the 1820 lane did; `git stash` is not an option here; a dev-only `server` option must leave `dist/` byte-identical), `npx vitest run` (the trunk total, 0 failed, the same red at import; measure the trunk figure on the tip if no closing report states it), `npm run check:docs` 4/4. `git status`: only `frontend/vite.config.ts` and the report.
6. **Hard stop.** Commit report and config (`git commit -- <paths>`, new files `git add` first), subject `chore(dev): allow the shared node_modules in the Vite serving list (P-2026-09-26-1335)`, body with before/after codes, the mechanism, and the negative controls; `Model:` trailer. Leave 3005 running. Tell Alfonso to open `http://localhost:3005/` in a private window, open a healthy project, and confirm the Bootstrap icons render (toolbar, panels, context menus) instead of empty squares, and that the app works as on 3000. Wait.
7. After his OK, closure commit (P13, RC-17): Status flipped to `eseguito 2026-09-26 · lane icons-font · <code sha> · verifica visiva passata <date>`; entry in `docs/log-inbox/harness.md` after the three entries already there (CLAUDE.md §21.2 format, `Layer Impact Report: not-required`, `Corregge:` the 3001 icons observation of chat `C-2026-09-26-1100`, dated 2026-09-26). Subject `docs: close the Bootstrap Icons font lane (P-2026-09-26-1335)`. Stop 3005, remove the temporary symlink under the P14 rule.
8. Closing report opening with `[P-2026-09-26-1335 · session <id>]`: shas, before/after codes for the font and the two controls, mechanism, `dist/` comparison, branch state (not merged, not pushed).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, deleting any cache other than this tree's, killing a server on 3000..3004, editing `src/`, push.

## RIFERIMENTI

- `frontend/vite.config.ts` (`server`, `cacheDir`, `optimizeDeps`); `frontend/src/index.tsx:7`.
- `frontend/node_modules/vite/dist/node/` (Vite 7.3.2: `server.fs.allow`, `searchForWorkspaceRoot`, the realpath check that produces the 403).
- P14 commits `465605cd7` (cache per worktree) and `d2eb241a7` (permanent symlinks); the 1820 lane on the same file: `docs/prompts/claude_2026-09-25_1820_prompt_vite_dep_scan.md`, `docs/discovery/discovery_2026-09-25_vite_dep_scan.md`.
- `docs/PROTOCOL.md` P13, P14; `docs/decisions.md` RC-17.
