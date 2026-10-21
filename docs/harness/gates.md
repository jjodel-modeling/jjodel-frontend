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
- `scripts/hooks/__tests__/agentModels.test.ts` (AM-1, B8c, P-2026-10-18-2125), when you touch `.claude/settings.json`, `.claude/agents/` or a skill's frontmatter: the three IDs of the settings are present and well formed, every `model:` of an agent or skill frontmatter is one of them, and `Explore`, `explorer` and `general-purpose` name `env.JJODEL_LIGHT_MODEL`. It reads the `.claude/` of the tree it runs in.

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

## What `lane-run` records and injects (AM-5, AM-7)

- `~/.jjodel-lanes/<Prompt-ID>/runs.jsonl`, one JSON line per launch, appended at launch: `at`, `kind` (`start`, `resume`, `merge`, `chain`), `session` (null at a start), `tier`, `requestedModel` (the settings pin for heavy, the light model for light, null for a resume), `effort`, `reason`, `injectedBytes` (starts only), `logFrom` (the byte offset of the run in `log.jsonl`), `errFrom` (its byte offset in `stderr.log`).
- `lane-run status <id>` (and `--all`, each lane once) completes the last line after the run exits, written back once: `effectiveModel` (the first `init` event of the run), `outcome` (`done`, `hard-stop`, `question`, `blocked`, `unparsed`, `none`) and `exit`. A lane without the file prints `runs: none`; `tier.txt` is unchanged.
- `lane-run status` reads the `Outcome:` line of the latest run only, from the `logFrom` of the last `runs.jsonl` line (issue #181): an exited latest run without one prints `limit` when its last `result` event or its `stderr.log` tail (from `errFrom`) carries the usage-limit message, `died` on any other non-zero exit, else `none`.
- The effort passed as `claude -p --effort <level>`: heavy `xhigh` for `--critical-zone-goahead`, a CLAUDE.md §3.2 file in DOVE or `visual bug` on the Lane line, else `high`; light `high`; `--effort` overrides it; a resume reuses the last line's.
- `## Decisions in scope (injected by lane-run, AM-5)`, appended by `start` and `merge --launch` to `stdin.md` after the prompt and before the closing reminder: `npm run decisions -- <IDs> --no-related`, the related rows at depth one, the IDs `not found`. The IDs are the prompt's tokens the worktree's register has, and its series' `<SERIES>-<n>` tokens it lacks.
- `## Log entries in scope (injected by lane-run, AM-5)`: the headers of `npm run log:find -- --prompt <Depends> --front <Front> --limit 10`, then the `Depends:` entries `--full`, dropped above 40,000 characters (`injected: trimmed to headers`). A CLI failure other than an ID not found refuses the start.

## Rule triggers (B4, P-2026-10-18-1420)

- `docs/harness/rule-triggers.json`, schema 1: entries `{ glob, docs, why }`, a doc being `<repo path>[#<heading fragment>]`; one entry per nested `CLAUDE.md`, glob `<its directory>/**`. The root `CLAUDE.md` has none (it loads by itself).
- `frontend/scripts/hooks/rule-trigger.mjs`, PreToolUse on `Edit|Write|NotebookEdit`: the first write of a session under an entry's glob is denied with the entry's docs named (read them, retry the same write), once per session and entry (marker `jjodel-rule-trigger-<session_id>.json` in `os.tmpdir()`); fails open. Registered in `.claude/settings.json` by B7 (P-2026-10-18-1655), after `critical-zone.mjs` in the `Edit|Write|NotebookEdit` entry.
- `npm run check:triggers`, when you touch the map or add a nested `CLAUDE.md`: fails on a missing doc or `#fragment`, a glob matching no tracked file, a nested `CLAUDE.md` no entry covers, a duplicate glob; exit 2 on a map that is not JSON or not schema 1.

## Context ceiling (B8b, P-2026-10-18-1530; RC-51)

- `frontend/scripts/hooks/context-ceiling.mjs`, PreToolUse on every tool (AM-8, report §7.3). Source: `JJODEL_LANE_LOG` when set and readable, else the hook input's `transcript_path`; the measure is input + cache_read + cache_creation of the latest main `assistant` event, read from a 512 KB tail. Thresholds soft 200000, hard 250000, ratified by RC-51 (2026-10-18, B8c), overridable by `JJODEL_CONTEXT_SOFT`/`JJODEL_CONTEXT_HARD`; a change of the defaults needs a ratified row.
- Lane session (lane folder by `session.txt` under `~/.jjodel-lanes/`, or `JJODEL_LANES_DIR`): at soft, once per session (marker `jjodel-context-ceiling-<session_id>.json` in `os.tmpdir()`), deny naming `handoff.md`, `handoff.diff` and `Outcome: hard-stop`; at hard, deny all but the handoff writes and one unchained `git status`/`git diff`. Interactive session: once at soft, no hard stop. Fails open. Registered by B7 (P-2026-10-18-1655, merge `b93c3fd46`) in `.claude/settings.json`, its own PreToolUse entry with matcher `*`.
- Under `claude -p` the measure lags one call: at the first PreToolUse of a fresh session the transcript does not exist yet (fail open), and at call n the transcript holds the `assistant` events of calls 1..n-1 only. The first call of a session is never stopped, and calls issued in parallel in one message are all measured on the previous call (B7; ticket for B8a).

## Settings env and agent models (AM-1, B7, P-2026-10-18-1655)

- `.claude/settings.json` `env`: `JJODEL_LIGHT_MODEL` `claude-sonnet-5-5` (read by `lane-run` for the light tier, which otherwise falls back to the constant with `light model: constant (settings env not set, B7)`) and `JJODEL_REPORT_MODEL` `claude-haiku-5-5`. Never `JJODEL_CONTEXT_*`: those belong to a launch, not to the project.
- `.claude/agents/`: `explorer.md`, `Explore.md` (overrides the built-in) and `general-purpose.md` (overrides the built-in, every tool kept) all name `model: claude-sonnet-5-5`, the full ID, equal to `JJODEL_LIGHT_MODEL`. The agent `model` field accepts the full ID, and a project agent with a built-in's name overrides it (measured in B7). `agentModels.test.ts` compares the agent and skill files with the settings keys (B8c).
