# Tack

Tack is a project-agnostic monitor for agent-assisted development: it reads what a coding agent
leaves behind (transcripts, git history, a self-assessment log) and shows how the work went.
It keeps metadata only, never message text, and needs no dependency beyond Node >= 24 (for
`node:sqlite`; on an older Node every command exits 2).

Status: slice 4 of 7. The contract, `tack check`, the event store, the Claude Code collector, repository
identity, the git collector and the layer-1 metrics (`tack metrics`) exist; the board comes in slice 5,
layers 2 and 3 in slice 6.

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
models, how the session was linked to a repository (`link`, below), and commit within the hour. Its day
is the UTC day of the first event; `tack metrics` uses local days.

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

### Linking a session whose directory is gone

A `path-gone` cwd (a deleted worktree) is still linked when the evidence allows, and `link` says how.
Nothing is inferred for the other missing reasons (`not-a-git-work-tree`, `no-cwd`, ...).

| link | meaning |
|---|---|
| `direct` | the cwd exists and sits in a repository |
| `branch` | the session's first `gitBranch` other than `HEAD` names a branch of exactly one known repository: a ref name (heads, and remotes with the remote prefix dropped) or a branch name parsed in memory from the merge subjects of `git log --all --merges` (git, GitHub, remote-tracking and `merge: X into ...` forms; nothing of the subject is stored) |
| `sibling` | the nearest existing ancestor of the cwd holds the present work trees (`git worktree list`) of exactly one repository, and the branch, if it names any repository, names that one |
| `none` | not linked; `link_reason` is `branch-conflicts-sibling`, `branch-ambiguous` (the branch exists in several repositories, e.g. `main`), `sibling-ambiguous` or `no-candidate` |

A linked `path-gone` session keeps `missing = path-gone` and gets its `repo_key`. The method is
evidence, not proof: a branch name can be reused across clones, which is why an ambiguous one is left
unlinked rather than guessed.

Numstat is computed with `--no-renames` even when the user's git config turns rename detection on
(`diff.renames=copies`), so a rename counts as a delete plus an add on every machine.

## `tack metrics`

```
node bin/tack.mjs metrics [--repo <key|path>] [--since <YYYY-MM-DD>] [--json] [--store <file>]
```

Reads the store only. `--repo` takes a repository key (or a prefix) or a path inside it; `--since`
keeps the sessions whose first event is on or after that day. Layer 1 needs nothing from the
repository:

| metric | definition |
|---|---|
| `sessions_per_day` | sessions by the day of their first event; undated counted apart |
| `cost_per_day` | known session cost (max `cost-state.totalCostUSD`) by the day of the first event; sessions with unknown cost counted apart, never as 0 |
| `tokens_per_day` | input, output, cache read and cache write tokens of every call, subagents included, by the day of the call |
| `context_peak` | largest main-thread context (input + cache read + cache write) per session, median, and sessions at or above 200,000 tokens |
| `calls_per_session` | main-thread API calls per session, one per message id |
| `waits` | gaps strictly above 5 minutes between consecutive calls of one session (subagent calls included), counted in full, per session and per day of the gap start |
| `overlap` | most sessions of one repository active at one instant (first to last event, closed intervals), per day; a session spanning midnight counts on every day it spans |
| `commit_proximity` | share of sessions with a commit of their repository within the window (default 1 h) after the session; proximity, not authorship; sessions without a repository kept apart as unknown |
| `subagent_share` | subagent calls over all calls, and subagent cost over known cost (estimate, below) |

Layer 2 (`commits_per_unit`, `cost_per_unit`, `resumes_per_unit`) and layer 3 (`outcome`,
`first_shot`, `cause_tally`, `regression_rate`, `out_of_scope_rate`) are listed with the store field
that would enable them and print `not adopted` while it is absent; when the field exists they print
`adopted, not implemented` (slice 6), never a number.

**Days are local**: the calendar day of the machine running `tack` (`TZ`), the day the person at the
keyboard lived. The API (`loadSelection(db, { utc: true })`) switches every metric to UTC days; there is
no command-line flag for it yet, and `tack sessions` keeps printing UTC days. Session-level metrics
(sessions, cost) use the day of the first event, so a session that crosses midnight is booked whole on
its first day; tokens use each call's day and waits the day the gap started. The tests pin
`TZ=Europe/Rome`.

**Subagent cost is an estimate.** The transcript gives one cost per model per session, not per call.
For each model, its known cost is split between main-thread and subagent calls in proportion to
price-weighted tokens (input 1, output 5, cache read 0.1, cache write 1.25, the same ratio for every
Claude model). A billed model with no call in the transcript is reported as unattributed, and sessions
with cost but no per-model cost are counted apart. The absolute cost always comes from the transcript;
only the split is estimated.

The store is at schema version 3 (`sessions.git_branch`, `session_repo.link_method` and
`link_reason`, `session_models`); older stores are migrated on open, and the next `scan` re-reads main
transcripts once to fill the branch and the per-model costs (rows are matched, none added).

## Tests

```
npm test        # node --test, from tack/
```

License: MIT.
