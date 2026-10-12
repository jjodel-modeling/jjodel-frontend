# Ratification: Claude Code mods and the harness (2026-10-11)

Chat: C-2026-10-11-1735. Ratified by Alfonso in chat, 2026-10-11 18:16 («si» to the four recommendations).
Report: `docs/discovery/discovery_2026-10-11_claude_code_mods_harness.md` (P-2026-10-11-1745, branch `mods-disc`,
commits `5bf908b25`, `7ad49c552`). Rows: RC-46, RC-47 in `docs/decisions.md`.

## What the report measured

Claude Code 2.1.296 loads mods in a `claude -p` session given `--plugin-dir`; `lane-run` passes none, so lanes today
fold only the built-ins `cc-plugin-agents-md` and `cc-plugin-telemetry`. A loaded mod stands above every RC-15 layer:
it overrode a deny-list `deny` (s2-allow) and a `bash-guard` `deny` (s5), skipped both hooks and the deny list by
answering a call itself (s2-answer), and ran host commands through `$.process.run` that no permission layer sees
(s2-run). `cc-plugin-sec-default`, the protection public reports rely on, is seated only by managed settings or a
Team/Enterprise organization; it is not seated on this machine. A lane in `bypassPermissions` can write
`~/.claude/settings.json` and `~/.claude/plugins/`, and nothing refuses those paths: one lane could arm a mod for
every later session. Mods fail open by default (throw at once, hang after 10 s) and closed with a refusing `.catch`.
The Prompt-ID guard prototype blocked a wrong-ID message before the model (P13), blocked a missing `Outcome:` line
once, and kept the ID across `--resume` in `$.store`; the reply prefix can only be flagged.

## Decisions

1. **RC-46, guard against mods (report Q2), first.** `lane-run start` and `resume` refuse to launch when the
   environment carries `CLAUDE_CODE_PLUGIN_DIRS`, or when the fold would hold a hooks module the harness did not
   name; writes to `~/.claude/settings.json`, `~/.claude/plugins/` and any `.claude-plugin/` under a skills folder
   are refused to lane sessions. `sec-default` (report Q3) is not seated now: it is a system-wide change, measured
   later in a lane Alfonso authorises, after RC-46 lands.
2. **RC-47, the Prompt-ID checks as a repo-held mod (Q1), with telemetry (Q4).** After RC-46. `lane-run` loads one mod
   from the repo with `--plugin-dir`, and nothing else. Checks 1, 2 and 4 block; check 3 is a flag recorded for the
   chat, never a rewrite. Every gating hook carries a refusing `.catch`. The same mod writes per-turn `usage` and
   `session.measure` into the lane folder; no export of its own.

## Alternatives set aside

Moving the deny list or the hooks into a mod: no gain against the model, none against another mod (report §3.6).
Rewriting the reply prefix: it would forge compliance instead of checking it. Seating `sec-default` first: it
changes the whole machine and does not yet answer whether it protects project rules (Q3).

## Notes on the lane

Probe s5 forced `git commit -m jjprobe` past `bash-guard`, and the probes ran `git log`, where the prompt allowed
`git stash list` and nothing else. Outcome harmless (nothing staged), scope exceeded: recorded here, since the log
entry is append-only. The report heading reads «The six answers» instead of «Answer in brief» (P16).
