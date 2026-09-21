# Prompt: harness mechanization, Phase 1. From prose rules to enforcement (settings, hooks, skills)

Prompt-ID: P-2026-09-21-1620
Chat: C-2026-09-21-1620
Status: eseguito 2026-09-21 · lane harness · ff5e5a84f
Repo: `~/jjodel-release` (worktree of `alfonso-frontend-jjtl`, the trunk, HEAD `2183dc66b` or later,
origin at `2183dc66b`). Not `~/jjodel`, not `~/jjodel-sim`: a session whose last commit is dated
2026-09-20 is in the wrong tree; stop and say so.
Lane: harness lane, two-phase (P4). No file under `frontend/src/`. Out of the critical zone.
Effort: xhigh. Model: the one `CLAUDE.md` §0 names; the `Model:` trailer records the one the
session banner shows (P6), whatever it is.
Protocollo: docs/PROTOCOL.md, clausole P1..P15 applicabili (tutte salvo deroga esplicita nel prompt).
Read `CLAUDE.md` (§0, §1, §3.1, §3.2, §6, §21), `docs/PROTOCOL.md` (P4, P6, P9, P10, P13, P15),
`docs/HARNESS-DOCS.md` (§5, §6, §12) and the last ten entries of `docs/claude-code-log.md` first.
Gates run with `~/.local/bin/node` (v26) on the PATH: the nvm default is v18 and refuses
`--experimental-strip-types`.
Every message opens with `[P-2026-09-21-1620 · session <id>]`. A message with a different or
missing ID is not executed.

## Context (do not redo the analysis)

On 2026-09-19 Alfonso confirmed, in the project chat, the direction of the harness after a review of
current agent-harness practice: the norms that today live only in prose move to enforcement where a
machine can hold them, the three-actor model and the traces stay, and the visual GO stays but gets
measured. The prompt written that evening for this work, `P-2026-09-19-1835`, was never saved to
disk: on 2026-09-21 it is absent from `docs/prompts/` of the trunk (394 files, last of 19/9 are
1610, 1622, 1730, 1735, 1740, 1745), absent from the untracked files of `~/jjodel`, and cited by no
file of either tree. This prompt replaces it and does not reconstruct it: the direction is restated
here from the chat, and Phase 2 will ratify it in `docs/decisions.md`. The direction, in order:
mechanization (this lane), then oracles for the critical zone, then ablation of the prompt template
and of `CLAUDE.md` at every model change, then the decision on the visual gate, with data.

Measured on the trunk on 2026-09-21, before this lane:

- `.claude/settings.json` (trunk, 2026-09-14) pins `"model": "claude-opus-4-8"` and
  `"effortLevel": "xhigh"`; `permissions.allow` has `npm run *`, `npm start`, `npm test*`,
  `git status`, `git diff*`, `git log*`, `git add *`; `ask` has `git commit*`, `git push*`; `deny`
  has `git add .`, `git add -A*`, `rm -rf*`, `Read(./.env)`, `Read(./.env.*)`. No `hooks` key.
- `CLAUDE.md` §0 says the agent runs as Claude Opus 5. The S6 lane of 2026-09-21
  (`P-2026-09-21-1455`) ran on Sonnet 5 after a `/model` switch, and its commits say so in the
  trailer. Three sources, three answers: the doc, the settings file, the session.
- `~/.claude/settings.json` (user level, outside the repo) has `"model": "sonnet"`,
  `permissions.defaultMode: "auto"`, one `allow` entry, two sound hooks on `Notification` and
  `Stop`, and a plugin list. Quote from it only the keys named here.
- No `.claude/skills/`, no `.claude/commands/`, no `.claude/hooks/`, no `.mcp.json` in the repo.
  `.claude/projects/` exists (Claude Code's own state) and is not ours to edit.
- Claude Code on the Mac is `2.1.278`. `AGENTS.md` is generated from `CLAUDE.md` by
  `scripts/generate-agents.mjs` (`npm run gen:agents`, checked by `npm run check:agents`); §0 is
  treated specially there, so any §0 change goes through that script.
- The gates that exist as code: `frontend/scripts/gates/check-docs.ts` (Check A..D),
  `rotate-log.ts`, `log-tools.ts`, `check-agents.ts`, and `frontend/scripts/smoke/` (P8).

The rituals that today live only in prose, each with the clause that states it:

1. Discovery report on file before the hard stop (P4).
2. `git add` with explicit paths, pathspec on the commit, `Model:` trailer, no `--no-verify`,
   subject within 72 chars, docs and code never in the same commit (P6, §6, P13).
3. Log entry in `docs/log-inbox/<lane>.md` at lane end, P9 format verified byte for byte by
   `check:docs` against `CLAUDE.md` §21.2 (P9, §21).
4. Status line flip in the prompt file at lane end, and again after the visual check (P13 practice,
   written in the lane-discipline section of every prompt, not in `CLAUDE.md`).
5. Prompt-ID on every message; a session that receives another ID stops (P13).
6. Layer Impact Report before any edit in the critical zone, file list in §3.1 (P5, §3.2).
7. No `git stash`, no restore from `/tmp` copies, no `git checkout HEAD -- .` on a shared tree
   (RC-13-bis in P9, P13).
8. Session checkpoint at context saturation (HARNESS-DOCS §4.6).

## COSA

Phase 1 is read-only and produces one discovery report,
`docs/discovery/discovery_2026-09-21_harness_mechanization.md` (P4 naming; `_2` if a report of
that name exists). It falsifies these hypotheses, with evidence `file:line` and verbatim quotes:

- H1, the mapping. Each of the eight rituals above maps to exactly one mechanism among: a
  `permissions.deny` rule, a `PreToolUse` hook, a `Stop` hook, a project skill, or "stays prose".
  The report gives the table: ritual, clause, mechanism, what the check reads (the stdin JSON fields
  of the hook, or the `tool_input` pattern of the rule), the false-positive it can raise (the log
  rotation lane legitimately edits `docs/claude-code-log.md`; the docs lane legitimately commits only
  docs), and how the lane escapes it if it must (a declared derogation in the prompt, an env var, a
  marker file: list the candidates with their cost, do not choose). Rituals that no mechanism can
  hold honestly are marked "stays prose" with the reason.
- H2, the critical zone gate. A `PreToolUse` hook on `Edit|Write|MultiEdit|NotebookEdit`, matched
  on the §3.1 file list, can block the edit unless a Layer Impact Report exists for the lane. The
  open question is how the hook knows one exists: measure what the hook receives (`cwd`,
  `tool_input.file_path`, `session_id`, `prompt_id` if present) and list the candidates (a
  `docs/discovery/` file newer than the session start that names the file; a marker in the prompt
  file; the derogation line). Report the candidates with what each one costs a lane.
- H3, the log entry. A `Stop` hook that blocks stopping when the session made commits and no entry
  exists in `docs/log-inbox/` is possible (exit 2 on `Stop`) and dangerous (a lane that cannot
  stop). Measure what `Stop` receives (`last_assistant_message`, `stop_hook_active`), and report
  the two designs side by side: block, or warn through `systemMessage`/`additionalContext` and let
  the human see it. Do not choose.
- H4, the skills. Four project skills under `.claude/skills/`, `log-entry`, `discovery-report`,
  `status-flip`, `checkpoint`, would produce the artifacts in the exact format. The P9 block is
  verified byte for byte against `CLAUDE.md` §21.2 by `check:docs`: a third copy inside a skill
  would drift unless the gate covers it or the skill reads the block live at invocation. Verify
  whether a `SKILL.md` can inject file content at invocation in `2.1.278` (dynamic content), and
  which frontmatter keys govern invocation (`disable-model-invocation`, `user-invocable`). Report
  the design that keeps one source.
- H5, the model drift. Report, with the settings precedence from the docs (managed, command line,
  `.claude/settings.local.json`, `.claude/settings.json`, `~/.claude/settings.json`), why a session
  in `~/jjodel-release` opened on Sonnet 5 despite the project file pinning `claude-opus-4-8`: find
  where a `/model` choice persists in `2.1.278` (likely under `.claude/projects/` or
  `~/.claude/`), read it, quote it. Then the exact model ID string for the model `CLAUDE.md` §0
  names, taken from the running `claude` (its model list) or from the official docs, never
  guessed; whether `"xhigh"` is a value `effortLevel` accepts in `2.1.278`; the effect of the
  user-level `defaultMode: "auto"` on the project `ask` list. The proposal for Phase 2 is one line:
  `.claude/settings.json` is the only place a model is named, and §0 points to it.
- H6, the deny list. What P6/P13 forbid that `permissions.deny` cannot express as a pattern
  (`git commit` without pathspec, `git stash`, `--no-verify`, `git checkout HEAD -- .`,
  `git add -A` without a trailing star, `rm` outside `-rf`) and therefore needs a `PreToolUse`
  hook on `Bash` that reads `tool_input.command`. Measure what `tool_input.command` contains for a
  compound command (`a && b`, `a; b`, a heredoc): the check is only as good as the string it sees.
- H7, `.mcp.json`. Which MCP servers the lanes actually use today (grep the last twenty log entries
  and the smoke scripts for `playwright`, `chrome`, `mcp`). If none is used from Claude Code, the
  report says "no `.mcp.json` needed" and Phase 2 adds none: no ceremony.
- H8, the hook runtime. A hook command runs in the user's shell environment. Measure which `node`
  it sees (the nvm default v18 or `~/.local/bin/node` v26) and therefore whether hook scripts must
  be plain `.mjs` with an absolute interpreter path, or can share the `--experimental-strip-types`
  TypeScript of `frontend/scripts/gates/`. The measurement uses a throwaway settings file outside
  the repo: `claude -p "say ok" --settings /tmp/hook-probe.json` with a `PreToolUse` and a `Stop`
  hook whose command is `node --version >> /tmp/hook-probe.log; cat >> /tmp/hook-probe.log`. The
  log goes verbatim into the report appendix, the probe settings file too; then both are removed
  from `/tmp`. Nothing inside the repo changes for the probe.

The report ends with the Phase 2 scope as the evidence supports it: the list of files to create
or change, in the order they land (settings first, then hooks with their scripts and tests under
`frontend/scripts/hooks/`, then skills, then the `CLAUDE.md` §0 and §1 pointer lines with
`gen:agents`, then `HARNESS-DOCS.md` and the ratification line in `docs/decisions.md`), and the
open questions for Alfonso, numbered, one line each.

## DOVE

Phase 1 reads: `.claude/settings.json`, `~/.claude/settings.json` (only the keys named above),
`.claude/projects/` (names and the model state file, read only), `CLAUDE.md`, `docs/PROTOCOL.md`,
`docs/HARNESS-DOCS.md`, `docs/decisions.md` (RC-11, RC-12, RC-13, RC-13-bis, P-series lines),
`frontend/scripts/gates/*.ts` and their `__tests__/`, `frontend/scripts/smoke/*.ts`,
`scripts/generate-agents.mjs`, `docs/archivio/claude_backlog_2026-09-09_manutenzione_harness.md`
(voice 3, Check D) and `docs/archivio/claude_harness_claude-md_retiering_plan.md`,
`docs/log-inbox/symbol-editor.md` (the S6 entry, as the sample of ritual 3 and 4),
`docs/prompts/claude_2026-09-21_1455_prompt_symbol_editor_s6_underline_corner_rules.md` (its
header and its lane-discipline paragraph, as the sample of rituals 4 and 5), and the official
Claude Code docs for hooks, skills, settings, permissions and MCP (`code.claude.com/docs/en/`).

Phase 1 writes only the report, plus `docs/discovery/harness/probe_2026-09-21_hook_runtime.json`
if you prefer to keep the probe settings as a file next to the report instead of quoting it.
Nothing else: no `.claude/` file, no `CLAUDE.md`, no script, no `frontend/src/`. Phase 2 scope is
proposed in the report and authorized only by a GO from the chat.

## COME

Before anything: `git worktree list`, HEAD on `alfonso-frontend-jjtl`, `git status --short` empty,
`git log -3 --format=%B | grep Claude-Session` (a session id other than this chat's in the last
hours is a concurrent chat: stop and say so). The P14 symlink `frontend/node_modules ->
~/jjodel/frontend/node_modules` only if you run `check:docs`; remove it at the end; never commit it.

**Phase 1.** Read the files listed in DOVE whole (§6). Every claim of absence names the search
that supports it (R-RAIL-28), with a positive control (P12). Every claim about Claude Code
behaviour cites the doc page or the measurement; a claim that rests on memory of another version
is marked as such. The probe of H8 runs outside the repo as described; if `claude -p` refuses the
`--settings` flag or the hook does not fire, record the exact output and move on: a probe that
fails is a finding. `npm run check:docs` after writing the report (4/4 expected; the report is a
new file and Check B does not read discovery reports, say so if it does). The report goes in a
commit of its own, pathspec, subject `docs: Phase 1 report, harness mechanization from prose to
enforcement (P-2026-09-21-1620)`, body with the P6 `Model:` trailer in the same paragraph as
`Co-Authored-By`. No log entry yet (the entry comes at lane end, after Phase 2, in
`docs/log-inbox/harness.md`); no rotation (P13); no push. Report the sha, the numbered open
questions, and stop.

Stop-and-ask conditions: the installed version lacks a feature the direction assumes (`Stop`
blocking, hook `if` matching on file paths, skill frontmatter keys); the probe would need to write
inside the repo or under `.claude/projects/`; `~/.claude/settings.json` holds anything beyond the
keys named above that the report would need to quote; `check:docs` goes red for a reason the
report did not predict.

## RIFERIMENTI

- `docs/PROTOCOL.md` P4 (discovery report), P6 (commit and `Model:` trailer), P9 (log entry, P9
  format, RC-13-bis), P13 (concurrency, Prompt-ID), P15 (where the rules live).
- `CLAUDE.md` §0 (runtime), §3.1 and §3.2 (critical zone and Layer Impact Report), §6 (commit
  discipline), §21.2 and §21.3 (log entry format, self-assessment).
- `docs/HARNESS-DOCS.md` 1.3: §5 (normative hierarchy), §6 (what a machine checks and what stays
  discipline: the four points that ceded), §12 (invariants).
- `docs/archivio/claude_backlog_2026-09-09_manutenzione_harness.md`, voice 3 (Check D: discipline
  did not hold on the four points); `docs/archivio/claude_harness_claude-md_retiering_plan.md`.
- `docs/decisions.md`: RC-11 (derogations are declared), RC-12 (rotation verbatim), RC-13 and
  RC-13-bis (shared tree), the P-series lines.
- Official docs: `code.claude.com/docs/en/hooks.md`, `hooks-guide.md`, `skills.md`, `settings.md`,
  `permissions.md`, `mcp.md`. Read them for `2.1.278`; the chat's reading on 2026-09-21 says:
  hooks live under `"hooks"` in `.claude/settings.json`; events `PreToolUse`, `PostToolUse`,
  `Stop`, `SessionStart`, `UserPromptSubmit`, `PreCompact`; exit 2 blocks and `Stop` can block;
  JSON output with `hookSpecificOutput.permissionDecision`; skills at
  `.claude/skills/<name>/SKILL.md` with `disable-model-invocation` and `user-invocable`; settings
  precedence managed > command line > project local > project shared > user; `effortLevel` exists;
  deny patterns `Tool(specifier)` with `*`. Treat these as hypotheses to confirm, not as facts.
- `docs/prompts/claude_2026-09-21_1455_prompt_symbol_editor_s6_underline_corner_rules.md` and
  `docs/log-inbox/symbol-editor.md`: the last lane, as the worked sample of every ritual.
