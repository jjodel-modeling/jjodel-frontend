# Gates reference

The verification gates and development commands of `CLAUDE.md` §17, in one document (report
`docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §5.2, batch B1,
P-2026-10-18-0100). The root `CLAUDE.md` keeps the same lists until B5a moves them out; until
then, if the two disagree, `CLAUDE.md` §17 is the one that binds.

## Development commands

Run from `frontend/`.

```bash
npm start            # Vite dev server
npm run build        # vite build (production bundle)
npm run typecheck    # tsc --noEmit (real type gate; vite/esbuild does not type-check)
npm run test         # vitest run
npm run test:watch   # vitest (watch mode)
npm run smoke        # smoke tests (frontend/scripts/smoke/)
npm run dev          # docker-compose dev stack, not the dev server (use npm start)
```

No `lint` script: ESLint is not installed, so do not run it. No coverage script.

## Verification gates before commit

- `npm run build` must pass (exit 0, only the pre-existing chunk-size warning).
- `npm run typecheck` must exit 0, with no `error TS` line. The baseline is zero from
  2026-10-12: P-2026-10-12-2000 and P-2026-10-12-2001 cleared the 14 errors it had carried
  (RC-48, `docs/decisions.md`). An error on your tree is yours, or a regression of the tip that
  you prove by running the typecheck on the tip; it is never recorded as pre-existing, and no
  list of known errors is kept. Fix it or stop.
- `npm run test` where the touched area has tests. The suite has known failures: nine files fail
  at import with `ReferenceError: window is not defined` (through the `monaco-editor` import)
  and collect no test:
  - `src/jjscript/__tests__/context-binding.test.ts`
  - `src/jjtl/__tests__/abstract-target.test.ts`
  - `src/jjtl/__tests__/ai-prompt-sanitization.test.ts`
  - `src/jjtl/__tests__/circular-refs.test.ts`
  - `src/jjtl/__tests__/executor-bridge.test.ts`
  - `src/jjtl/__tests__/executor-llayer.test.ts`
  - `src/jjtl/__tests__/forall-mapping.test.ts`
  - `src/jjtl/__tests__/source-alias.test.ts`
  - `src/utils/__tests__/UDComparator.test.ts`

  Do not treat any other red as pre-existing without checking.

## The `check:*` scripts

- `npm run check:agents`, when you touch any `CLAUDE.md`. It regenerates every `AGENTS.md` into
  a temp directory and compares it byte for byte with the committed one. When red, run
  `npm run gen:agents` and include the regenerated files in the same commit; never hand-edit
  them.
- `npm run check:docs`, when you touch `CLAUDE.md`, `docs/PROTOCOL.md`,
  `docs/claude-code-log.md` or a lane inbox `docs/log-inbox/*.md`. It rejects a §21.2
  entry-format block that is not byte-identical to `docs/PROTOCOL.md` P9, and a recent entry, in
  the active log or in an inbox, that lacks the fields of its type (`Corregge` and `Causa` for a
  task; `Ticket`, `Priority` and `Found in` for a ticket). If a recent entry uses prose instead
  of the strict format, note it in `**Notes**` rather than failing the gate.
- `npm run check:scripts`, when you add or edit any file under `frontend/scripts/`. It rejects a
  compound assignment, or `x = x <op> ...`, whose right side awaits: `failures += await run()`
  reads the counter before the await and overwrites the increments made during it, and printed
  ALL GREEN over failures on 2026-09-24. Fix: `const r = await run(); failures += r;`. It reads
  the disk, gitignored `_tmp_*` probes included, so its verdict depends on the untracked files of
  the worktree it runs in, and it runs only when someone runs it.

## Running the gates

- The quiet runner, `node scripts/run-quiet.mjs LABEL -- CMD ...` from `frontend/`, keeps the
  whole log of a build, test or type-check in `.agent-logs/LABEL-YYYYMMDD-HHMMSS.log` at the
  repository root of the tree that holds the runner, and prints the exit code, the error lines
  and the tail.
- The output-budget hook denies those commands outside the runner. The marker
  `# allow-large-output` in a command lets it through and is logged in
  `.agent-logs/guard-overrides.log`.
- The measurement source for what a lane spent against the plan limits is
  `node frontend/scripts/lane-usage.mjs <Prompt-ID>` (`npm run lane:usage`), which reads the
  lane folder in `~/.jjodel-lanes/`.
