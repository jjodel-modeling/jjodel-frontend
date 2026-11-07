# Probe: can a hook set the Claude Code session title for a lane?

Prompt-ID: P-2026-11-07-1830
Chat: C-2026-11-07-1824
Front: harness
Status: da eseguire
Lane: fast (probe, no product code, no change to the repo's `.claude/`)
Request: none (Alfonso in chat, «lancialo tu», 2026-11-07 18:32)
Model: claude-opus-5-5, effort medium

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-titleprobe`, branch `title-probe`, from the trunk tip. Before anything else: `pwd`, branch,
`git log -1` and `git status`: HEAD is this prompt's commit and the tree is clean, otherwise stop with
`Outcome: blocked`. No `node_modules` needed: this lane runs no app and no gate.

## Lane discipline
Every reply of this session opens with `[P-2026-11-07-1830 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Never `cat` a transcript or a debug log: `grep` or `jq` the lines you need.

## Context (do not redo the analysis)
The hooks reference (code.claude.com/docs/en/hooks) says `SessionStart` accepts `hookSpecificOutput.sessionTitle`;
a closed issue (anthropics/claude-code #34243) says `UserPromptSubmit` accepts it too, with the same effect as
`/rename`. Users report it ignored on Cowork and doubt it on the desktop app. Hooks inherit the environment of the
`claude` process. We want lane sessions titled with their Prompt-ID and front, refreshed at each resume.
This lane only measures. It does not edit `.claude/settings.json`, `frontend/scripts/hooks/` or `lane-run`.

## COSA
All probe files live in `/tmp/title-probe/`, outside the repo. The nested runs use `--model haiku` and a
`--settings /tmp/title-probe/settings.json` file, so no project settings and no workspace trust are involved.

- M0. Read how `lane-run` launches and resumes `claude` (command line, `-p` or interactive, tmux, env passed).
  Record `claude --version`. Ten lines in the report, with `file:line`.
- M1. Write `/tmp/title-probe/title.mjs`: reads stdin JSON, appends one line (event, session_id, source,
  `$PROBE_TITLE`) to `/tmp/title-probe/hook.log`, prints
  `{"hookSpecificOutput":{"hookEventName":<event>,"sessionTitle":<title>}}` where the title is the content of
  `/tmp/title-probe/title.txt` if it exists, else `$PROBE_TITLE`; prints nothing if both are empty. Register it in
  `settings.json` for `SessionStart` (matcher `startup|resume`) and `UserPromptSubmit`, exec form (`node` + args).
- M2. Startup: `PROBE_TITLE=probe-A claude -p "reply ok" --model haiku --settings ... --output-format json` from
  `/tmp/title-probe/work`. Record the session id. Does the hook fire? Where does the title land: grep the session
  JSONL under `~/.claude/projects/` for `probe-A` and record the entry type; check any session index file.
- M3. Resume: same session with `--resume <id>` and `PROBE_TITLE=probe-B`. Does the stored title change?
- M4. File-driven title: write `probe-C` to `title.txt`, resume once more, check the title.
- M5. Repeat M2 and M3 in the exact form `lane-run` uses, if M0 shows it differs from `-p`.
- M6. Cost: wall time each hook adds (from `hook.log` timestamps or `time`).

## HARD STOP
After M6, write the report and stop with `Outcome: hard-stop`, listing the session ids of M2..M5 so Alfonso can look
for them in the desktop app sidebar and in `claude --resume`. That visual check is his; do not claim it.

## NON FARE
No edit to tracked files except the report and the log-inbox entry. No change to `~/.claude/settings.json`.
No more than eight nested `claude` runs.

## Deliverables
- Discovery report `docs/discovery/discovery_2026-11-07_session_title_hook_probe.md` (P4 content: hypothesis,
  goal, files read with paths, findings with evidence, risks, open questions). Answer in one line each: does
  `SessionStart` set the title at startup, at resume; does `UserPromptSubmit`; does the file-driven title work;
  where the title is stored.
- Log-inbox entry (P9) in `docs/log-inbox/harness.md`.
- One docs commit with explicit pathspec for both files.

## RIFERIMENTI
`docs/PROTOCOL.md` P4, P9, P13; `docs/HARNESS-DOCS.md` §4.2; `frontend/scripts/hooks/bash-guard.mjs` (for the
exec-form pattern only, do not edit it).
