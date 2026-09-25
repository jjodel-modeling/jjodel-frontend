# Prompt: the Vite dependency scan fails on every cold start

Prompt-ID: P-2026-09-25-1820
Chat: C-2026-09-25-1500
Lane: fast (dev tooling, one config file expected)
Status: da eseguire

Worktree: `~/jjodel-vite`, branch `vite-dep-scan`, created by the project chat from the trunk at the commit that adds this file. Setup, each a hard stop if it fails: `pwd` is `/Users/alfonso/jjodel-vite`; `git branch --show-current` is `vite-dep-scan`; `git status` empty; `git log -1` reads `docs: add prompt P-2026-09-25-1820, Vite dependency scan`. Every commit of this lane goes on `vite-dep-scan`. The merge into the trunk is a separate step.

**Other lanes.** `P-2026-09-25-1445` may be running in `~/jjodel-sim` (port 3002). Do not touch `~/jjodel`, `~/jjodel-release`, `~/jjodel-sim`, `~/jjodel-open`, `~/jjodel-gate`, `~/jjodel-harness`, their caches, nor any server you did not start (3000..3004 are not yours).

**Environment (P14).** This tree has no `node_modules`: create the temporary symlink `frontend/node_modules -> ~/jjodel/frontend/node_modules`, name it in the report, remove it at the end after checking it did not exist when the lane started. The Vite cache is this tree's `frontend/.vite-cache` (absent at start: that is the cold start this lane needs). Dev server on **3005** only, from this tree, after `lsof -nP -iTCP:3005 -sTCP:LISTEN` shows it free.

Single phase, with one hard stop (step 6).

## COSA

Ticket from `P-2026-09-25-1500` (`docs/log-inbox/simulation.md`, priority medium). On a cold start the Vite dependency scan fails: esbuild rejects `src/components/forEndUser/MTM.tsx:27` (`import {Nearley} from "../../DSL/nearley/nearley"`), pointing at `src/DSL/nearley/nearley.tsx:34` (`export class Nearley`, preceded by `@RuntimeAccessible('Nearley')`) and suggesting `_Nearley`. Pre-bundling is skipped, every dependency (about 58) is discovered at runtime and the page reloads once. Present since `0787639fd`; the 3001 server fails silently (its `_metadata.json` had 58 optimized, 0 from the scan), a fresh worktree prints the error. With lanes in worktrees, cold starts are the norm.

Known facts to start from: the app compiles decorators through Babel (`@babel/plugin-proposal-decorators`, legacy) inside `@vitejs/plugin-react`; the dependency scanner runs plain esbuild and does not see the Babel plugins. `tsconfig.json` has `experimentalDecorators: true`, target ES2020. The decorator `@RuntimeAccessible` is used on many classes, so the question is why this file (or only the first failing file) breaks the scan. `vite.config.ts` has `optimizeDeps: { include: ['svgpath'] }`, nothing else.

Wanted: a cold start on a fresh tree runs the scan without errors and pre-bundles the dependencies at startup, with no runtime "new dependencies optimized" reload on first page load. Production build unchanged. No source file under `src/` changed unless the config route is impossible (then stop and ask).

## COME

1. Preconditions: setup above; read `CLAUDE.md`, `docs/PROTOCOL.md` P13/P14, the Vite ticket in `docs/log-inbox/simulation.md`.
2. **Measure before**, saved in `docs/discovery/discovery_2026-09-25_vite_dep_scan.md` (mandatory): cold start on 3005 (`nohup npx vite --port 3005 --strictPort > /tmp/s5/vite3005.log 2>&1 &`, create `/tmp/s5`), load `http://localhost:3005/` once with `curl` (and, if you can drive a browser, once in a browser), stop the server. Record: the full esbuild error text (every error, not only the first), whether "new dependencies optimized" and a reload appear, and `frontend/.vite-cache/deps/_metadata.json` counts (optimized, discovered). Then find the cause with evidence: run the scanner's esbuild step alone if possible (`DEBUG=vite:deps npx vite --port 3005 --force`), and state whether the failure is the decorator syntax, the `export` placement after a decorator, a duplicate or circular export, or something else. Say why other decorated classes do not fail (or whether the scan simply stops at the first error).
3. **Fix, config only**, in `frontend/vite.config.ts`, the smallest change that makes the scanner parse what the app parses. Candidates, in order of preference, to be justified by step 2: `optimizeDeps.esbuildOptions` with `tsconfigRaw: { compilerOptions: { experimentalDecorators: true } }` (or the equivalent that matches the error); `optimizeDeps.entries` narrowed so the scan reads what it needs. No new dependency. Name check for any new identifier. If only a source change works, stop and ask before touching `src/`.
4. **Measure after**: delete this tree's own `frontend/.vite-cache` (only this one), cold start on 3005 again, same checks as step 2. Expected: no scan error, `_metadata.json` with the dependencies from the scan, no runtime optimize-and-reload on first load. Then a warm restart (cache present): no rescan, no reload.
5. Gates from `frontend/`: `npm run typecheck` (14, the §17 set), `npm run build` exit 0 and the same warnings as before (a production build does not use `optimizeDeps`; say so if the output differs), `npx vitest run` (the trunk total, 4629, 0 failed, same 9 red at import), `npm run check:docs` 4/4. `git status`: only `frontend/vite.config.ts` and the report.
6. **Hard stop.** Commit report and config (`git commit -- <paths>`, new files `git add` first), subject `chore(dev): let the Vite dependency scan parse decorators (P-2026-09-25-1820)`, body with before/after measurements, `Model:` trailer. Leave 3005 running from a cold start. Tell Alfonso to open `http://localhost:3005/` in a private window, open a healthy project, and confirm the page loads once without the automatic reload, and that the app works as on 3001. Wait.
7. After his OK, closure commit (P13, RC-17): Status flipped to `eseguito 2026-09-25 · lane vite-dep-scan · <code sha> · verifica visiva passata <date>`; entry in `docs/log-inbox/harness.md` (CLAUDE.md §21.2 format, `Layer Impact Report: not-required`, `Corregge:` the ticket of P-2026-09-25-1500). Subject `docs: close the Vite dependency scan lane (P-2026-09-25-1820)`. Stop 3005, remove the temporary symlink under the P14 rule.
8. Closing report opening with `[P-2026-09-25-1820 · session <id>]`: shas, before/after numbers, cause, branch state (not merged, not pushed).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, deleting any cache other than this tree's, killing a server on 3000..3004, push.

## RIFERIMENTI

- `frontend/vite.config.ts` (`plugins.react.babel`, `optimizeDeps`, `cacheDir`); `frontend/tsconfig.json`.
- `frontend/src/DSL/nearley/nearley.tsx:33-34`; `frontend/src/components/forEndUser/MTM.tsx:27`; `frontend/src/components/editors/MTM.tsx:25`.
- Ticket and evidence: `docs/log-inbox/simulation.md` (P-2026-09-25-1500 entry); `docs/prompts/claude_2026-09-25_1500_prompt_sim_event_from_trigger.md`.
- `docs/PROTOCOL.md` P13, P14; `docs/decisions.md` RC-17.
