# Token economy: output budget hook, quiet runner, effort default, explorer subagent

Prompt-ID: P-2026-10-13-1930
Chat: C-2026-10-13-1930
Front: harness
Status: eseguito 2026-10-18 · lane harness · 6e910eb68 · closed by P-2026-10-17-1945
Supersedes: P-2026-10-13-1920 (written against `validation-skeleton` by mistake; never run it)

## COSA

Context. A token audit of the Claude Code logs from 2026-09-07 to 2026-10-12 (ccusage plus a per-session analysis, run by the architect's chat on 2026-10-13) shows that Jjodel sessions run with an average context of 270k to 515k tokens per API call, peaking near 1M, and that cache reads are about half of the list-price cost. The main inflow of context is tool output read through Bash: across Jjodel sessions, `sed -n` accounts for about 25M characters over 4,100 calls, `grep` for 6.7M, `cat -n` for 3.6M, `git show` and `git diff` for about 3.5M together. The existing `bash-guard.mjs` guards git safety and does not bound output. CLAUDE.md section 0 makes `xhigh` the default effort for all real tasks, and `.claude/settings.json` sets `effortLevel: xhigh`.

This prompt implements four changes. Lane lifecycle, screenshot handling and the slimming of CLAUDE.md are out of scope: they will come as separate prompts. The model pin (`claude-opus-5-5`, single source of truth in `.claude/settings.json`) is not touched.

### 1. Output budget hook

A new PreToolUse hook on Bash, `frontend/scripts/hooks/output-budget.mjs`, built on `lib.mjs` (`readInput`, `decide`, `runHook`, `parseShell`) in the same style as `bash-guard.mjs`, and registered in `.claude/settings.json` as a second Bash PreToolUse entry, after `bash-guard.mjs`, with the same timeout. Keep it a separate file: `bash-guard.mjs` is about safety, this one is about context cost, and they evolve for different reasons. Like the other hooks it FAILS OPEN.

It denies the patterns below, with a one-line reason that names the alternative:

a. `cat`, `cat -n`, `less`, `more` on a file, unless a later pipeline segment bounds the output. Alternative: the Read tool with `offset` and `limit`.

b. `sed -n` without a line range, or with a range wider than 120 lines. Alternative: Read with `offset` and `limit`.

c. Recursive `grep` (`-r`, `-R`) or `rg` with unbounded output. Allowed with `-l`, `-c`, `-m N` (N up to 50), or a bounding segment.

d. `git show <rev>` without `--stat`, `--name-only`, a path restriction or a bounding segment; `git diff` under the same rule; `git log` without `-n N` / `-N` (N up to 30) or a bounding segment.

e. Build, test and type-check commands (`npm test`, `npm run build`, `npm run test*`, `npx vitest`, `npx tsc`, `npx playwright`) not invoked through the quiet runner of item 2. Before writing this rule, list the `npm run` scripts the lane tooling and the gates invoke (`lane-run.mjs`, `gates/`, `smoke/`) and make sure none of their own child processes goes through a Bash tool call that this rule would deny; if any would, exempt it explicitly and say so in the log entry.

A bounding segment is a later pipeline segment `head -n N` or `tail -n N` (N up to 80), `wc`, or `grep -c`. Use `parseShell` so compound commands, wrappers and heredocs are handled as in `bash-guard.mjs`. When a command cannot be classified with confidence, allow it: the goal is to stop the expensive common cases, not to sandbox the shell.

Escape hatch: a command containing the marker `# allow-large-output` passes, and the hook appends one line (ISO timestamp and command, truncated to 300 characters) to `.agent-logs/guard-overrides.log`.

### 2. Quiet runner

`frontend/scripts/run-quiet.mjs LABEL -- CMD [ARGS...]` (Node, no dependencies) runs the command, writes the full stdout and stderr to `.agent-logs/LABEL-YYYYMMDD-HHMMSS.log` at the repository root, and prints only: the exit code, the log path, the line count, up to 40 lines matching `error|Error|FAIL|failed`, and the last 25 lines. It exits with the command's exit code. Add `.agent-logs/` to `.gitignore`. Add an `allow` entry for the runner in `.claude/settings.json`. Rule e accepts a command whose program is the runner.

### 3. Effort default

In `.claude/settings.json` set `effortLevel` to `high`; change nothing else in that file except the hook registration and the runner `allow` entry.

In CLAUDE.md section 0 change only the effort bullets: default `high`; `xhigh` for critical-zone work (section 3) and visual-bug diagnosis (section 5), set with `/effort` at the start of such a task and lowered back to `high` afterwards; `medium` for trivial work outside the critical zone; never `max` unless the prompt explicitly asks. Leave the model paragraph as it is.

Add a short output-discipline subsection (six to ten lines, where it fits best): read code with Read and `offset`/`limit`; keep searches bounded; run builds and tests through the quiet runner; the output budget hook exists, what it denies, and that the override marker is for exceptional cases that must be justified in the reply; prefer the explorer subagent for broad searches and long logs. Then run `npm run gen:agents` and `npm run check:agents`.

### 4. Explorer subagent

Create `.claude/agents/explorer.md`. Frontmatter: `name: explorer`; a `description` that says when to use it (broad code search across many files, reading long logs, where and how questions) and that it returns conclusions with `file:line` references, not file contents; `model: sonnet`; `tools: Read, Grep, Glob, Bash`. Body: answer in at most 40 lines, cite `file:line`, never paste whole files or logs, and note that the output budget hook applies.

## DOVE

Branch `alfonso-frontend-jjtl`, working tree `~/jjodel-release`. Files you may create or modify:

- `frontend/scripts/hooks/output-budget.mjs` (new)
- `frontend/scripts/hooks/__tests__/outputBudget.test.ts` (new)
- `frontend/scripts/run-quiet.mjs` (new)
- `.claude/agents/explorer.md` (new)
- `.claude/settings.json` (effortLevel, hook registration, runner allow entry)
- `.gitignore` (one line)
- `CLAUDE.md` (section 0 effort bullets and the new output-discipline text only) and the `AGENTS.md` files regenerated by `npm run gen:agents`
- `docs/claude-code-log.md`, and this prompt file (Status line only)

Anything else: stop and ask. `lib.mjs` and `bash-guard.mjs` are read-only for this prompt; if `lib.mjs` lacks something you need, stop and ask.

## COME

### Before writing

- Read `CLAUDE.md`, `docs/PROTOCOL.md` (commit rules), `.claude/settings.json`, `frontend/scripts/hooks/lib.mjs`, `bash-guard.mjs`, and `__tests__/bashGuard.test.ts` with `hookRunner.ts`.
- Grep for any new exported identifier before introducing it.

### Tests

`outputBudget.test.ts`, in the style of `bashGuard.test.ts`, with at least: `cat src/a.ts` denied; `cat src/a.ts | head -n 20` allowed; `sed -n 10,60p f.ts` allowed; `sed -n 1,400p f.ts` denied; `grep -rn foo src` denied; `grep -rln foo src` allowed; `grep -rn foo src | head -n 30` allowed; `git show HEAD` denied; `git show --stat HEAD` allowed; `git diff -- src/a.ts` allowed; `git log -n 10 --oneline` allowed; `npm run build` denied; the same build through the runner allowed; `cat big.log # allow-large-output` allowed and logged; `ls -la && git status` allowed; a malformed payload allowed (fail open).

Run the quiet runner once on the type-check or the build and paste its output in the log entry.

### Commits

Per `docs/PROTOCOL.md`: code and docs in separate commits, pathspec after `--`, `Model:` trailer, subject within 72 characters plus the prompt ID. In the `docs/claude-code-log.md` entry: files changed, test results, the final list of denied patterns, any exemption made under rule e, and any case where the hook falls back to allow.
