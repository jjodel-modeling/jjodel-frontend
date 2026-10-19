# Tack

Tack is a project-agnostic monitor for agent-assisted development: it reads what a coding agent
leaves behind (transcripts, git history, a self-assessment log) and shows how the work went.
It keeps metadata only, never message text, and needs no dependency beyond Node >= 22.

Status: slice 1 of 7. Only the contract and `tack check` exist; the collectors, store, metrics and
board come in slices 2 to 5.

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

## Tests

```
npm test        # node --test test/
```

License: MIT.
