# Tack

Tack is a project-agnostic monitor for agent-assisted development: it reads what a coding agent
leaves behind (transcripts, git history, a self-assessment log) and shows how the work went.
It keeps metadata only, never message text, and needs no dependency beyond Node >= 24 (for
`node:sqlite`; on an older Node every command exits 2).

Status: slice 3 of 7. The contract, `tack check`, the event store, the Claude Code collector, repository
identity and the git collector exist; metrics and board come in slices 4 and 5.

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
subagent calls excluded), cost (max `cost-state.totalCostUSD`), context peak, span in minutes,
models, and commit within the hour (below).

## Repository identity and the git collector

```
node bin/tack.mjs repos [--json] [--store <file>]
```

After the transcripts, `scan` resolves every distinct session `cwd` to a repository, then reads the
git history of every repository it found. A `cwd` that no longer exists (`path-gone`), is not inside
a git work tree (`not-a-git-work-tree`), is in a repository with no commit (`no-commits`), or where
git fails (`git-error`) is **missing**, with that reason, never "no commit". Otherwise the cwd gives
its toplevel and its git common dir, so the linked worktrees of one clone share one identity. A
repository is keyed by its **lowest root commit** (`git rev-list --max-parents=0 --all`): clones that
share a root commit are one repository, and two clones of the same project whose roots are disjoint
(a shallow clone, a history rewritten from the root) are two repositories even when their remote is
the same. The `origin` URL is kept normalised (`host/path`, credentials and `.git` dropped); `repos`
prints only its host. A repository with no clone left on disk is marked `gone` and keeps its commits.

Per commit the store keeps the sha, the number of parents, author and commit time, the numstat
totals (files, insertions, deletions; renames off, merges count no file), the unit id with the form
that matched (`trailer` for `Unit: <id>`, `suffix` for a subject ending in `(P-...)`; the trailer
wins), and whether a `Co-Authored-By:` trailer names Claude. The message is parsed in memory and
dropped: no subject, body, author name, email or file path is stored.

Every git command is read-only (`rev-parse`, `rev-list`, `log`, `for-each-ref`, `worktree list`,
`remote get-url`) and runs with `GIT_OPTIONAL_LOCKS=0`; nothing is fetched. Reading is incremental:
the refs and their tips (and every worktree `HEAD`) are remembered per clone, and a repository whose
tips did not move is skipped. When they moved, a single-clone repository reads only the commits not
reachable from the old tips and then compares its stored count with `git rev-list --all --count`; a
difference means history was rewritten or a ref deleted, and the repository is re-read in full. A
repository with several clones is re-read in full. The stored commits of a repository are therefore
exactly `git log --all` of its clones.

**Commit within the hour** (proximity, not authorship) is computed at query time, not stored: `yes`
when any commit of the session's repository, by any author, has a commit time between the session's
first event and one hour after its last event; `no` otherwise; `unknown` when the repository is
missing. `repos` prints, per repository: key (12 chars), toplevels, remote host, commits, commits
with a unit id per form, Claude co-authored commits, sessions, sessions with a commit within the
hour; then the missing cwds grouped by reason.

The store is at schema version 2; a version 1 store is migrated on open.

## Tests

```
npm test        # node --test, from tack/
```

License: MIT.
