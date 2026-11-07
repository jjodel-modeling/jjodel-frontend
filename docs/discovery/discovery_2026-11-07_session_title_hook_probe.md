# Discovery: can a hook set the Claude Code session title? (P-2026-11-07-1830)

## Hypothesis
`SessionStart` (docs) and `UserPromptSubmit` (issue anthropics/claude-code #34243) accept
`hookSpecificOutput.sessionTitle`, with the effect of `/rename`. If so, a lane could title its session with
Prompt-ID and front at startup and at each resume.

## Goal
Measure, on `claude 2.1.314`, whether the title is set at startup, at resume, by `UserPromptSubmit`, from a file,
and where it is stored. Measure only: no change to `.claude/settings.json`, `frontend/scripts/hooks/`, `lane-run`.

## Files read
- `frontend/scripts/lane-run.mjs:371` `FLAGS = ['--output-format','stream-json','--verbose','--permission-mode','bypassPermissions']`
- `frontend/scripts/lane-run.mjs:1282` start: `claude -p ...FLAGS [--auto flags] --effort E [--model M]`, prompt on stdin
- `frontend/scripts/lane-run.mjs:1384` resume: `claude -p --resume <session> ...FLAGS --effort E`, no `--model`, message on stdin
- `frontend/scripts/lane-run.mjs:524-544` `launch`: `spawn('/bin/sh', ['-c', WRAPPER, ...])`, detached, `stdio: 'ignore'`,
  env = `process.env` + PATH, `JJODEL_CRITICAL_ZONE_GOAHEAD` set or deleted (and GH vars dropped for `--auto`). No tmux, not interactive.
- `claude --version`: 2.1.314 (Claude Code)
- Probe files (outside the repo): `/tmp/title-probe/{title.mjs,settings.json,hook.log}`; hooks in exec form (`node` + args),
  `SessionStart` matcher `startup|resume` and `UserPromptSubmit`, passed with `--settings`, `--model haiku`, cwd `/tmp/title-probe/work`.

## Findings (evidence)
Runs: 5 nested `claude` (limit 8).

| Run | Form | Env / file | Hook log | Stored title |
|---|---|---|---|---|
| M2 `d5647d85-8497-4d9a-85f5-9abcaff66463` | `-p --output-format json` | `PROBE_TITLE=probe-A` | SessionStart `startup`, then UserPromptSubmit | `probe-A` |
| M3 same id | `-p --resume` | `probe-B` | SessionStart `resume`, UserPromptSubmit | `probe-B` (changed) |
| M4 same id | `-p --resume` | `title.txt=probe-C`, `PROBE_TITLE=env-ignored` | both fire, env `env-ignored` | `probe-C` (file wins, as coded) |
| M5a `49dacdd9-8eaa-45e0-ba81-19f23d368175` | lane form (stdin, stream-json, bypassPermissions, effort low) | `probe-D` | both fire | `probe-D` |
| M5b same id | lane resume form | `probe-E` | SessionStart `resume`, UserPromptSubmit | `probe-E` (changed) |

- Resume with `-p --resume` keeps the same session id (no fork), so one id carries the title history.
- Storage: session JSONL `~/.claude/projects/<cwd with / and . as ->/<id>.jsonl`, as a pair of entries
  `{"type":"custom-title","customTitle":T,"sessionId":..}` and `{"type":"agent-name","agentName":T,..}`, appended (last wins).
  Three pairs sit in the file after M2 (the two hook events plus one more, origin not determined); the last one wins on resume.
  Index search: `history.jsonl`, `sessions/`, `session-env/`, `shell-snapshots/` of `~/.claude` do not contain the session id; `jobs/`, `state/`, `daemon*`, `cache/`, `debug/` and the desktop app's own storage were not searched.
- The hook output also appears as an `attachment` of type `hook_success` with `stdout` in the JSONL.
- `UserPromptSubmit` and `SessionStart` were registered together in every run, so their effects are not separated: each fires and
  returns a title, but a run with `UserPromptSubmit` alone was not made.
- The env of the `claude` process reaches the hook (`$PROBE_TITLE` logged in every line).
- Cost (M6): hook `durationMs` from the JSONL: SessionStart 104 ms (startup), 215 ms (resume). Bare `node title.mjs`: 50 ms CPU,
  0.395 s wall cold. Wall of a whole `-p` run: 7-8 s (dominated by the model call).

## One-line answers
- `SessionStart` at startup: yes, sets the title.
- `SessionStart` at resume: yes, replaces the title (matcher `resume` fires).
- `UserPromptSubmit`: fires and returns the title; the stored entries are consistent with it, but not isolated from SessionStart.
- File-driven title: works; the hook reads the file at each event and the result is the title.
- Storage: session JSONL, `custom-title` + `agent-name` entries (last wins), no other index found.

## Risks
- Visual effect is unverified: the desktop-app sidebar and `claude --resume` listing are for Alfonso to check (hard stop).
- The test used `--settings` with no project settings; in the repo, `.claude/settings.json` hooks merge with these, and a
  second hook returning a title would race (last wins).
- `lane-run` runs `-p`, non-interactive; the title is stored there too, but whether a sidebar reads it for headless runs is the open check.
- The desktop/Cowork reports of the title being ignored are not contradicted or confirmed by this probe (CLI only).

## Open questions
- Does the desktop sidebar show `custom-title` written by a hook for a `-p` session? (Alfonso)
- Is `UserPromptSubmit` alone enough? (one extra run would answer; not done)
- Lane derivation: the hook would need the Prompt-ID and front; a lane-run env var (e.g. `JJODEL_LANE_TITLE`) is inherited by the hook, as `$PROBE_TITLE` was.

## Session ids for the visual check
- M2, M3, M4: `d5647d85-8497-4d9a-85f5-9abcaff66463` (final title `probe-C`), cwd `/tmp/title-probe/work`
- M5: `49dacdd9-8eaa-45e0-ba81-19f23d368175` (final title `probe-E`), cwd `/tmp/title-probe/work`
