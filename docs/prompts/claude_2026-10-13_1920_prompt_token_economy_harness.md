# Token economy: Bash guard, quiet runner, effort and model settings

Prompt-ID: P-2026-10-13-1920
Chat: C-2026-10-13-1920
Status: da eseguire

## COSA

Context. A token audit of the Claude Code logs from 2026-09-07 to 2026-10-12 (ccusage plus a per-session analysis, run by the architect's chat on 2026-10-13) shows that Jjodel sessions run with an average context of 270k to 515k tokens per API call, peaking near 1M, and that cache reads are about half of the list-price cost. The main inflow of context is tool output read through Bash: across Jjodel sessions, `sed -n` accounts for about 25M characters over 4,100 calls, `grep` for 6.7M, `cat -n` for 3.6M, `git show` and `git diff` for about 3.5M together. No hook bounds any of this. In addition, `.claude/settings.json` pins `effortLevel` to `xhigh` (overriding the user-level `medium`) and pins the model to `claude-opus-4-8`, while CLAUDE.md section 0 says Opus 5 and the logs show Opus 5.5.

This prompt implements four changes. Lane lifecycle, screenshot handling and the slimming of CLAUDE.md are out of scope: they will come as separate prompts.

### 1. Bash guard hook

A PreToolUse hook on the Bash tool: `.claude/hooks/bash-guard.mjs` (Node, no dependencies), registered in `.claude/settings.json` with a command that runs `node` on `$CLAUDE_PROJECT_DIR/.claude/hooks/bash-guard.mjs` (quote the variable as the hooks documentation recommends). It reads the hook JSON from stdin, inspects `tool_input.command`, and blocks the patterns below with exit code 2 and a reason on stderr, which Claude Code feeds back to the agent. Each reason names the alternative in one line.

a. `cat`, `cat -n`, `less`, `more` on a file, unless a later segment of the same pipeline bounds the output (see below). Alternative: the Read tool with `offset` and `limit`.

b. `sed -n` without a line range, or with a range wider than 120 lines. Alternative: Read with `offset` and `limit`.

c. Recursive `grep` (`-r`, `-R`) or `rg` with unbounded output. Allowed with `-l`, `-c`, `-m N` (N up to 50), or when piped into a bounding segment.

d. `git show <rev>` without `--stat`, `--name-only`, a path restriction or a bounding segment; `git diff` under the same rule; `git log` without `-n N` (N up to 30) or a bounding segment.

e. Build, test and type-check commands (`npm test`, `npm run build`, `npm run test*`, `npx vitest`, `npx tsc`, `npx playwright`) that are not invoked through the quiet runner of item 2.

A bounding segment is a later pipeline segment `head -n N` (N up to 80), `tail -n N` (N up to 80), `wc`, or `grep -c`. Split compound commands on `|`, `&&`, `||` and `;` and check every segment. Keep the parser simple and conservative: when a command cannot be classified with confidence, allow it. The goal is to stop the expensive common cases, not to sandbox the shell.

Escape hatch: a command whose text contains the marker `# allow-large-output` passes, and the hook appends one line (ISO timestamp and command) to `.agent-logs/guard-overrides.log`, so overrides are auditable.

### 2. Quiet runner

`scripts/agent/run-quiet.sh LABEL -- CMD [ARGS...]` runs the command, writes the full stdout and stderr to `.agent-logs/LABEL-YYYYMMDD-HHMMSS.log`, and prints only: the exit code, the log path, the line count, up to 40 lines matching `error|Error|FAIL|failed`, and the last 25 lines. It exits with the command's exit code. Add `.agent-logs/` to `.gitignore`. Add `Bash(scripts/agent/run-quiet.sh *)` to the `allow` list in `.claude/settings.json`. Rule e of the guard accepts a command whose first token is the runner.

### 3. Settings and CLAUDE.md section 0

In `.claude/settings.json`: remove the `model` pin, so the user-level setting selects the model; set `effortLevel` to `high`; keep every other key as it is.

Rewrite CLAUDE.md section 0: the agent runs on Claude Opus 5.5; default effort is `high`; `xhigh` is for critical-zone work (section 3) and visual-bug diagnosis (section 5), set with `/effort` at the start of such a task and lowered back to `high` afterwards; `medium` is fine for trivial work outside the critical zone; never `max` unless the prompt explicitly asks. Keep a minimum Claude Code version line only if you can verify it on this machine.

Add a short output-discipline subsection (six to ten lines, in the section where it fits best): read code with Read and `offset`/`limit`; keep searches bounded; run builds and tests through the quiet runner; the guard exists, what it blocks, and that the override marker is for exceptional cases that must be justified in the reply; prefer the explorer subagent (item 4) for broad searches and for reading long logs. Then run `npm run gen:agents` and `npm run check:agents`.

### 4. Explorer subagent

Create `.claude/agents/explorer.md`. Frontmatter: `name: explorer`; a `description` that says when to use it (broad code search across many files, reading long logs, answering where and how questions) and that it returns conclusions with `file:line` references, not file contents; `model: sonnet`; `tools: Read, Grep, Glob, Bash`. Body: answer in at most 40 lines, cite `file:line`, never paste whole files or whole logs, and remember that the Bash guard applies.

## DOVE

Files you may create or modify:

- `.claude/hooks/bash-guard.mjs` (new)
- `.claude/hooks/bash-guard.test.mjs` (new)
- `.claude/agents/explorer.md` (new)
- `.claude/settings.json`
- `scripts/agent/run-quiet.sh` (new, executable)
- `.gitignore` (one line)
- `CLAUDE.md` (section 0 and the new output-discipline text only) and the `AGENTS.md` files regenerated by `npm run gen:agents`
- `docs/claude-code-log.md`, and this prompt file (Status line only)

Anything else: stop and ask.

Branch: these files must reach every worktree, so the change belongs on the trunk. If the main working tree is not on the trunk when you start, stop and ask.

## COME

### Before writing

- Read `CLAUDE.md` and `.claude/settings.json`.
- Check the PreToolUse payload and exit-code semantics against the Claude Code version installed here. During development, dump one real payload to `.agent-logs/` to confirm the field names, then remove the dump code.
- The user-level `~/.claude/settings.json` defines only Notification and Stop hooks (sounds). Do not touch it.

### Tests

`.claude/hooks/bash-guard.test.mjs`, runnable with `node --test`, with a table of commands and expected outcomes. At least: `cat src/a.ts` blocked; `cat src/a.ts | head -n 20` allowed; `sed -n 10,60p f.ts` allowed; `sed -n 1,400p f.ts` blocked; `grep -rn foo src` blocked; `grep -rln foo src` allowed; `grep -rn foo src | head -n 30` allowed; `git show HEAD` blocked; `git show --stat HEAD` allowed; `git diff -- src/a.ts` allowed; `git log -n 10 --oneline` allowed; `npm run build` blocked; `scripts/agent/run-quiet.sh build -- npm run build` allowed; `cat big.log # allow-large-output` allowed and logged; `ls -la && git status` allowed.

Run the quiet runner once on the type-check or the build and paste its output in the log entry, to show the shape.

### Report

In the `docs/claude-code-log.md` entry: files changed, test results, the final list of blocked patterns, and any case where the guard falls back to allow. Commit per the repository conventions, citing P-2026-10-13-1920.
