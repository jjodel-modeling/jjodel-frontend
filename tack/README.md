# Tack

Tack is a project-agnostic monitor for agent-assisted development: it reads what a coding agent
leaves behind (transcripts, git history, a self-assessment log) and shows how the work went.
It keeps metadata only, never message text, and needs no dependency beyond Node >= 24 (for
`node:sqlite`; on an older Node every command exits 2).

Status: slice 2 of 7. The contract, `tack check`, the event store and the Claude Code collector
exist; the git collector, metrics and board come in slices 3 to 5.

## Three data layers

1. **Transcripts and git**: sessions, cost, context, commits. Needs nothing from the repository.
2. **Identity**: a unit-of-work id (`P-YYYY-MM-DD-HHmm`) linking a prompt, its sessions and its
   commits, via the trailer `Unit: <id>` (canonical) or the subject suffix `(P-...)` (alias).
3. **Self-assessment log**: one append-only file, `.tack/log.jsonl`, one JSON entry per line.

Layers 2 and 3 are optional; panels that need them say "not adopted" instead of drawing empty charts.

## `tack check`

```
node bin/tack.mjs check [file]      # default: .tack/log.jsonl
```

Validates every line of a JSON Lines log against contract v1 (`contract/v1/`), then checks the
references between lines. Exit code 0 when clean, 1 when there are violations (one line each,
`file:line field rule: message`), 2 on a usage error.

## `tack scan` and `tack sessions`

```
node bin/tack.mjs scan [--root <dir>] [--store <file>]
node bin/tack.mjs sessions [--cwd <prefix>] [--json] [--store <file>]
```

`scan` reads the Claude Code transcripts under `~/.claude/projects` (`<dir>/<session>.jsonl` and
`<dir>/<session>/subagents/*.jsonl`) into one store per user, `~/.tack/store.db` (or `TACK_STORE`,
or `--store`), so no file is ever written in a scanned repository. It keeps ids, timestamps, model
ids, CLI versions, token counts, cost and the session `cwd`, never message text. Ingestion is
incremental from each file's byte offset; a file that shrank or whose mtime moved backwards is
re-read from 0. Transcripts deleted by Claude Code's retention keep their rows: the store is the
history.

`sessions` prints one row per session: cwd, UTC day, main-thread API calls (one per `message.id`,
subagent calls excluded), cost (max `cost-state.totalCostUSD`), context peak, span in minutes and
models.

## Tests

```
npm test        # node --test, from tack/
```

License: MIT.
