# Prompt: one Vite cache per worktree, and P14 tells a permanent node_modules symlink from a temporary one

Prompt-ID: P-2026-09-25-1353
Chat: C-2026-09-25-1353
Lane: fast
Status: eseguito 2026-09-25 · lane harness · 465605cd7 · verifica visiva passata 2026-09-25

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl` (the trunk). Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop and say so. Do not touch `~/jjodel`, `~/jjodel-sim`, `~/jjodel-open`, `~/jjodel-gate`, `~/jjodel-harness`: not their files, not their `node_modules` symlinks, not their caches, not their dev servers.

Single phase, with one hard stop (step 6). Harness lane: three files, no visual check of the UI, but an environment check by Alfonso on 3001 before the closure.

## COSA

Two defects of the worktree setup, measured on 2026-09-25 when `http://localhost:3001/` went blank during the verification of the open-path merge:

1. **The permanent symlink was removed.** `~/jjodel-release/frontend/node_modules` and `~/jjodel-sim/frontend/node_modules` are permanent symlinks to `~/jjodel/frontend/node_modules`: the dev servers on 3001 and 3002 depend on them. P14 still describes `~/jjodel-release` as "a tree without `node_modules`" that gets a temporary symlink "removed afterwards". A lane applied that sentence literally and removed the permanent symlink. The chat recreated it (13:16).
2. **The Vite cache is shared by every worktree.** `vite.config.ts` sets no `cacheDir`, so Vite uses `<root>/node_modules/.vite`, and through the symlink every tree writes the same directory, `~/jjodel/frontend/node_modules/.vite`. The 0030 discovery rewrote it at 00:32 from its own tree, and the server on 3001 served a pre-bundle built for another tree.

The fix: each tree gets its own Vite cache inside its own `frontend/`, and P14 states which symlinks are permanent and what a lane may remove.

## DOVE

Three files, all on the trunk:

- `frontend/vite.config.ts`: add `cacheDir`.
- `.gitignore` (repo root): ignore the new cache directory.
- `docs/PROTOCOL.md`: amend the `node_modules` bullet of P14 and add one bullet on the Vite cache and the dev servers.

Closure commit (docs): this prompt's Status line and the entry in `docs/log-inbox/harness.md`.

Not in scope, and not touched: `frontend/vitest.config.ts` (it sets no `cacheDir` either, so the Vitest results cache stays shared; it only orders test files, and it is a ticket in the entry, not a change here); the stale directories `~/jjodel-release/frontend/.vite/` and `~/jjodel-sim/frontend/.vite/` (empty `deps/` of 2026-09-14, untracked) and `~/jjodel/frontend/node_modules/.vite` (left for Alfonso); CLAUDE.md; the skills; the other worktrees, which get the change when they merge the trunk.

## COME

1. Preconditions, each a hard stop if false: `git status` empty; `git log -1` is `268e964a0` or a descendant of it; `readlink frontend/node_modules` prints `/Users/alfonso/jjodel/frontend/node_modules`; `git worktree list` shows `alfonso-frontend-jjtl` only here.
2. Name check (CLAUDE.md, before a new identifier). The cache directory is `frontend/.vite-cache`. Run `command grep -rn -e '\.vite-cache' --exclude-dir=node_modules .` from the repo root and `ls -d frontend/.vite-cache`: both must find nothing. A hit: stop and report. Do not reuse `frontend/.vite`: a stale directory of that name already sits in two trees.
3. Positive control, before the edit, from `frontend/`:
   ```
   node --input-type=module -e "import {resolveConfig} from 'vite'; const c = await resolveConfig({root: process.cwd()}, 'serve'); console.log(c.cacheDir)"
   ```
   Expected: `/Users/alfonso/jjodel-release/frontend/node_modules/.vite`, which `realpath` resolves into `~/jjodel`. Record both lines. If the command does not run as written, fix the invocation, not the config, and say what you changed.
4. Edits:
   - `vite.config.ts`: inside the object returned by `defineConfig`, next to `server`, add `cacheDir: path.resolve(__dirname, '.vite-cache'),` with a one-line comment in English saying why (one cache per worktree; `node_modules` is a shared symlink). No other change in the file.
   - `.gitignore`: add `/frontend/.vite-cache/` next to the other `/frontend/...` entries. No other change.
   - `docs/PROTOCOL.md`, P14: replace the bullet that begins "A tree without `node_modules` (such as `/Users/alfonso/jjodel-release`)" with two bullets. First: `~/jjodel-release/frontend/node_modules` and `~/jjodel-sim/frontend/node_modules` are permanent symlinks to `~/jjodel/frontend/node_modules`, part of the setup and never removed by a lane; a tree that has none (today `~/jjodel-open`, `~/jjodel-gate`) can run the gates through a temporary symlink that the lane creates, names in its report and removes when done; before removing a symlink, the lane checks that it did not exist when the lane started; `git status` in that tree is empty before and after. Second: each tree keeps its own Vite cache in `frontend/.vite-cache` (`cacheDir` in `vite.config.ts`); a lane never writes, deletes or rebuilds another tree's cache, and starts a dev server only from its own tree, on a port no other tree is using (`lsof -nP -iTCP -sTCP:LISTEN`). Close with the measurement, as P13 does: "Measured 2026-09-25: a lane removed the permanent symlink of `~/jjodel-release`, and a discovery rewrote the shared cache; 3001 served a blank page." Italian or English: follow the language of the surrounding P14 text (it is English). No version bump: the header says the version tracks the set of clauses, and no clause is added.
5. Measure after the edit, from `frontend/`:
   - The command of step 3 prints `/Users/alfonso/jjodel-release/frontend/.vite-cache`.
   - `npm run typecheck`: 14 errors, the §17 set. `npm run build`: exit 0. `npm run check:docs`: 4/4. `npx vitest run`: the trunk total, unchanged; state the expected number before running.
   - Restart the server on 3001, the only server this lane may touch: find its pid with `lsof -nP -iTCP:3001 -sTCP:LISTEN`, check with `ps -o command= -p <pid>` and `lsof -p <pid> | grep cwd` that it runs from `~/jjodel-release/frontend` (anything else: stop, do not kill it), stop it, relaunch from `frontend/` with `nohup npx vite --port 3001 --strictPort > /tmp/s3/vite3001.log 2>&1 &` (create `/tmp/s3` if missing), wait until the log shows the local URL. Then `ls frontend/.vite-cache/deps | head` shows files, and `ls -la --time-style=full-iso ~/jjodel/frontend/node_modules/.vite/deps | head -3` shows no write from this restart (compare mtimes with a reading taken before the restart). Leave the servers on 3000 and 3002 alone.
   - `git status` shows exactly the three files. `frontend/.vite-cache/` does not appear (ignored).
6. **Hard stop.** Commit the code: `git commit -- frontend/vite.config.ts .gitignore docs/PROTOCOL.md`, subject `chore(harness): one Vite cache per worktree, P14 names the permanent symlinks (P-2026-09-25-1353)`, body with the measurements of steps 3 and 5, `Model:` trailer. Then tell Alfonso: hard-refresh `http://localhost:3001/`, open a healthy project, and confirm the page is not blank. Wait for his answer.
7. After his OK, the closure commit (P13, RC-17): this prompt's Status line flipped to `eseguito 2026-09-25 · lane harness · <code sha> · verifica visiva passata 2026-09-25`, and the entry in `docs/log-inbox/harness.md` (format of CLAUDE.md §21.2; `Layer Impact Report: not-required`; `Smoke visivo`: the 3001 check; one Ticket for the shared Vitest cache and one noting the two stale `frontend/.vite/` directories left in place). Subject `docs: close the worktree isolation lane (P-2026-09-25-1353)`, pathspec after `--`.
8. Closing report opening with `[P-2026-09-25-1353 · session <id>]`: the two shas, the measurements, the push state (the trunk ahead of origin; do not push).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `rm` of any symlink, `rm -rf` of any cache, killing a process on 3000 or 3002, push.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14; `docs/decisions.md` RC-3, RC-13, RC-17.
- Checkpoint `docs/sessioni/sessione_2026-09-25.md` (`4d225921a`): the 3001 incident, "Bug nuovi / Todo", the harness line.
- Vite `cacheDir`: default `node_modules/.vite`, relative to the project root.
