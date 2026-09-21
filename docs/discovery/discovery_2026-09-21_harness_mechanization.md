# Discovery: harness mechanization, Phase 1 (from prose rules to enforcement)

Prompt-ID: P-2026-09-21-1620
Prompt: `docs/prompts/claude_2026-09-21_1620_prompt_harness_mechanization_phase1.md`
Session: `2f49e5d9-5f49-4083-843f-1100aa6f6aa9` (`CLAUDE_CODE_SESSION_ID`, equal to the transcript file name)
Tree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, HEAD `cb522e99f`, `git status --short` empty before and after.
Executor: Claude Sonnet 5 at effort xhigh (`CLAUDE_EFFORT=xhigh`), Claude Code `2.1.278`. `CLAUDE.md` §0 names Opus 5: the same drift H5 measures, live in this lane. The `Model:` trailer records Sonnet 5 (P6).
Lane: harness, Phase 1, read-only. Nothing under `frontend/src/`, `.claude/`, `CLAUDE.md` or any script was touched.

The report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the real files.

## 1. Hypotheses under test

- H1 each of the eight rituals maps to exactly one of: deny rule, `PreToolUse` hook, `Stop` hook, project skill, "stays prose".
- H2 a `PreToolUse` hook on the file-edit tools, matched on the §3.1 list, can block an edit unless a Layer Impact Report exists.
- H3 a `Stop` hook can block stopping when the session committed and no log-inbox entry exists, and that is dangerous.
- H4 four project skills (`log-entry`, `discovery-report`, `status-flip`, `checkpoint`) can produce the artifacts in exact format while keeping one source for the P9 block.
- H5 the model drift is explained by the settings precedence and a `/model` choice that persists somewhere readable.
- H6 P6/P13 forbid things `permissions.deny` cannot express, so a `Bash` hook reading `tool_input.command` is needed.
- H7 no `.mcp.json` is needed.
- H8 hook scripts must be plain `.mjs` with an absolute interpreter, or can share the strip-types TypeScript of `frontend/scripts/gates/`.

## 2. Objective

Give Alfonso the evidence to decide what Phase 2 builds: which rituals move to a machine, which stay prose, which premises of the prompt do not hold, and the list of files and questions that follow. No decision is taken here.

## 3. Files read (full paths) and how

Read whole: `/Users/alfonso/jjodel-release/docs/prompts/claude_2026-09-21_1620_prompt_harness_mechanization_phase1.md`, `.../docs/PROTOCOL.md`, `.../docs/HARNESS-DOCS.md`, `.../.claude/settings.json`, `.../docs/archivio/claude_backlog_2026-09-09_manutenzione_harness.md`, `.../docs/archivio/claude_harness_claude-md_retiering_plan.md`, `.../docs/log-inbox/symbol-editor.md`, `.../docs/log-inbox/harness.md`, `.../docs/prompts/claude_2026-09-21_1455_prompt_symbol_editor_s6_underline_corner_rules.md`, `.../frontend/scripts/gates/check-docs.ts`, `log-tools.ts`, `rotate-log.ts`, `check-agents.ts`, `.../scripts/generate-agents.mjs`. `CLAUDE.md` was loaded whole by the harness at session start; line numbers below come from `grep -n`.

Read in part, declared as such (§5 of `CLAUDE.md`, a count over a window is a count over that window):
- `docs/decisions.md`: lines 1-90 (RC-3 to RC-14) read; the rest (3417 lines) only by `grep`. It has no `P-2026-...` series lines outside citations.
- `docs/claude-code-log.md`: the entries at lines 1-130 (the ten newest); lines 1-60 seen with each line cut to 260 characters, lines 56-130 whole; counts over the whole file by `grep -c`.
- `frontend/scripts/gates/__tests__/log-tools.test.ts`: first 40 lines and the `describe`/`test` names (`grep -n`).
- `frontend/scripts/smoke/*`: `grep` only, for `playwright|puppeteer|chrome|mcp`, not read whole (H7 needs the absence claim, not the code).

Official docs, fetched 2026-09-21 from `https://code.claude.com/docs/en/<page>.md` into the scratchpad: `hooks` (329656 bytes), `hooks-guide` (82749), `skills` (115336), `settings` (59209), `settings-reference` (443819), `permissions` (83911), `permission-modes` (82879), `model-config` (111200), `mcp` (117610, fetched, not read beyond the protected-files table: no MCP server is used, see H7). These are the current published docs, not a `2.1.278` snapshot. Every claim below is tagged **[measured]** (a probe on `2.1.278` in this lane) or **[docs]** (read, not measured). A doc claim with a version gate (`prompt_id` 2.1.196, `if` path semantics 2.1.214, `PreModelSwitch` 2.1.251) is at or below `2.1.278`.

Probes, all outside the repo (details and verbatim logs in Appendix A): `claude` invoked with `-p` and `--settings` from `cwd` under the scratchpad, never inside the repo. Probe 1 as the prompt specifies. Each `claude -p` run wrote one session transcript under `~/.claude/projects/-private-tmp-...-probe-cwd/` (user-level Claude Code state, created by the tool, not the repo's `.claude/projects/`); see Q15.

## 4. Findings

### H1. The mapping (partly falsified)

Verdict: six rituals map to one mechanism as hypothesized; R2 and R7 need a deny list plus a `Bash` hook; R5 needs an event that is not in the prompt's list (`UserPromptSubmit`, with `Stop`); three premises of the prompt do not hold (see the end of this section).

| # | Ritual (clause) | Mechanism | What the check reads | False positive it can raise | Escape (see E1..E6) |
|---|---|---|---|---|---|
| R1 | Discovery report on file before the hard stop (P4, `PROTOCOL.md:32-43`) | **stays prose**; the `discovery-report` skill shapes the artifact (H4) | nothing: no event marks a hard stop. `Stop` fires at the end of every turn **[docs, hooks.md#stop]**, and the phase of a lane exists only in the prompt text | a `Stop` heuristic would fire on every answer that is not a hard stop | n/a |
| R2 | `git add` explicit paths, pathspec on commit, `Model:` trailer, no `--no-verify`, subject <= 72, docs and code apart (P6, §6, P13) | **`PreToolUse` on `Bash`** for the semantic checks, plus the **deny list** for the fixed forms (H6) | `tool_input.command`, the whole string, compound and heredoc included **[measured, probe 2]**; for staging the hook runs `git diff --cached --name-only` in `cwd` | heredoc bodies that name `git stash` or `--no-verify` reach the hook verbatim **[measured]**, so a naive regex blocks a commit message that merely quotes them (this lane's own commit messages would); a commit in a throwaway repo (probe 2 ran `git init` under the scratchpad) so scope by repo root; the subject rule is violated by 35 of 61 trunk-native commits since 2026-09-18 (the `(P-...)` suffix), and the subject the prompt mandates for this commit is 89 characters | E1, E3, E4 |
| R3 | Log entry in `docs/log-inbox/<lane>.md` at lane end, P9 format (P9, §21) | **project skill** `log-entry` for the form (H4); content stays with `check:docs` (A to D, exists) | n/a. The only event candidate is `Stop` (H3) | a `Stop` check fires at the Phase 1 hard stop, where this prompt says "No log entry yet" (`prompt:165-166`) | n/a |
| R4 | Status line flip in the prompt file, twice (prompt practice) | **project skill** `status-flip`, but only after a clause exists (measured: it is written nowhere, see the end of this section) | n/a. The second flip follows Alfonso's visual GO in chat: no machine signal | a hook would flip at the wrong moment | n/a |
| R5 | Prompt-ID on every message, a session that receives another ID stops (P13, `PROTOCOL.md:226-236`) | **`UserPromptSubmit`** (block a message whose leading `[P-...]` differs from the session's) **plus `Stop`** (the reply must open with `[P-... · session <id>]`) | `UserPromptSubmit`: `prompt`, `session_id`; `Stop`: `last_assistant_message`, `stop_hook_active`, `session_id` **[measured, probes 1 and 2]** | `/clear` mints a new `session_id` in the same process (this session's transcript opens with `/clear` at 14:11Z), so state keyed by `session_id` starts empty after it; how a pasted message reaches `prompt` is **not measured** (needs an interactive paste); slash commands and side questions without an ID would be blocked | E4 |
| R6 | Layer Impact Report before an edit in the critical zone (P5, §3.1, §3.2) | **`PreToolUse` on `Edit\|Write\|NotebookEdit`** (H2) | `tool_input.file_path` (absolute, measured), `cwd`, `session_id`, `agent_id` when a subagent edits | §3.1 rows are broader than the §3.2 trigger: 42 commits since 2026-09-01 touch §3.1 rows, 2 touch the six §3.2 files; Bash-mediated writes (`sed -i`, redirects, `git apply`) bypass an `Edit\|Write` matcher | E1, E4 |
| R7 | No `git stash`, no restore from `/tmp` copies, no whole-tree checkout (RC-13-bis, P13) | **deny list** for `git stash*` and named forms, `Bash` hook as the fallback for the wrapper forms (measured in H6) | the parsed subcommands (deny), the raw string (hook) | `sh -c 'git stash list'`, `git -C . stash list`, `/usr/bin/git stash list` all ran under a `Bash(git stash *)` deny **[measured, probe 9]**; a `cp /tmp/...` restore has no pattern | E3, E6 |
| R8 | Session checkpoint at context saturation (HARNESS-DOCS §4.6) | **stays prose** for Claude Code | hooks receive no context fill: the only surface with `context_window.used_percentage` is the status line **[docs, settings-reference]**; `PreCompact` fires at compaction (`trigger` manual or auto), cannot add context (`systemMessage` discarded) **[docs]** | n/a | n/a |

Escape candidates, with their cost (not chosen):

- E1, a declared derogation line in the prompt (`Deroga: ...`, `PROTOCOL.md:14`). Needs the hook to resolve session to prompt file: the `Prompt-ID:` header resolves for 16 of 19 prompts since 2026-09-17 (all 16 equal the file-name time, no duplicate ID in `docs/prompts/`) **[measured]**; the `Deroga:` line has been used once in all of `docs/prompts/`. Cost: a template line for the architect; a session with no resolvable prompt has no escape.
- E2, an environment variable set at launch. A hook inherits the launcher's environment **[docs]**; an `export` in a Bash tool call does not reach it, so the model cannot self-authorize. Cost: relaunch, so context is lost; no per-lane granularity.
- E3, a marker file, for example under the scratchpad or a gitignored path. Cost: low, but the model can create it, so it stops accidents and not the model.
- E4, `permissionDecision: "ask"` instead of `deny`: the human answers in the terminal. A hook `ask` prompts even in auto mode **[docs, hooks.md#pretooluse-decision-control]**. Cost: one prompt per call.
- E5, `.claude/settings.local.json` per lane. Cost: `.claude/` is a protected directory (prompt on every write, see Risks).
- E6, `--settings <lane file>` at launch: the command line outranks project settings **[docs, settings.md]**. Cost: relaunch.

The log rotation lane: it writes `docs/claude-code-log.md` through `rotate-log.ts` (Bash then node), invisible to an `Edit|Write` matcher, and `rotate-log.ts:77-92` already refuses to write unless `git status --porcelain` is clean for the four log files. A guard on `Edit|Write` of that path would therefore catch other lanes' direct edits without blocking the rotation; a deny on `Bash(npm run log:rotate*)` would be the false positive. The docs-only lane: RC-13 forbids docs and code in one commit, not docs-only commits; the mixed check must classify by path prefix. Mixed commits are rare: 2 in the last 200 non-merge commits **[measured]**.

Premises of the prompt that do not hold:

1. Ritual 4 ("written in the lane-discipline section of every prompt, not in `CLAUDE.md`"): the S6 prompt has a `Status:` header (`s6 prompt:4`) and no sentence about flipping it; `grep` for `Status:` returns 0 in `CLAUDE.md`, `PROTOCOL.md`, `HARNESS-DOCS.md`, `decisions.md` with a working control (`Prompt-ID` hits 2 in `PROTOCOL.md`). Only 9 of 66 September prompts carry a `Status:` header, in two forms (`da eseguire`, `eseguito <date> ...`). The practice is not written anywhere in the repo.
2. Ritual 8: `HARNESS-DOCS.md:277-296` (§4.6) says "Produttore: architetto". A `checkpoint` skill in Claude Code needs §4.6 amended first (Q9).
3. H6 names `rm` outside `-rf` and `git checkout HEAD -- .`: no clause in `CLAUDE.md`, `PROTOCOL.md` or `decisions.md` names `rm` (0 hits; the `rm -rf*` deny in `.claude/settings.json:23` has no clause behind it), and none names the whole-tree checkout, `git reset`, `git clean` or `git restore` (0 hits, control: `git stash` hits). `PROTOCOL.md:118` says a tracked file is restored "solo con `git checkout HEAD -- <path>`", and `<path>` may be `.`. A deny for those is a new rule, so it needs a clause first (P15).

### H2. The critical-zone gate

What the hook receives on `Edit` and `Write` **[measured, probe 2]**: `session_id`, `transcript_path`, `cwd`, `prompt_id` (a per-message UUID, not the lane ID `P-...`), `permission_mode`, `effort.level`, `hook_event_name`, `tool_name`, `tool_use_id`, and `tool_input` with `file_path` **absolute** (`Write`: `content`; `Edit`: `old_string`, `new_string`, `replace_all`). No `agent_id` in a main-thread call. `scratchpad_dir`, documented from 2.1.257, was absent in these `-p` runs. `MultiEdit` is not a tool in this build: it is not in this session's tool set and `grep -c MultiEdit` on the hooks doc returns 0 (control: `Write` matches); the matcher is harmless but inert.

How the hook could know a Layer Impact Report exists, and what each candidate costs:

- C1, read the chat text from `transcript_path`. **Rejected as a synchronous gate [measured, probe 7]**: the sentinel (`LIRPROBE-MARK`, produced only by the assistant, never in the prompt) was in the transcript at `PreToolUse` time in 1 of 3 runs and absent in the other 2, while all 3 final transcripts contained it. n=3, `-p` mode; consistent with the doc ("may lag the in-memory conversation", hooks.md#common-input-fields). A gate built on it blocks a lane that did write the report, about two times in three.
- C2, a file under `docs/discovery/` newer than the session start that names the edited file. Needs a session start time (a `SessionStart` marker or the transcript birth time). It changes `CLAUDE.md:200` ("The report goes in chat before the diff. Not in a commit.") into "a file", and rule 16 then requires it committed. Existence only: the model can write the file without doing the analysis.
- C3, the go-ahead line in the prompt. P5 already requires "go-ahead esplicito nel prompt più Layer Impact Report". The hook maps `session_id` to the P-ID (recorded by `UserPromptSubmit`, R5) to `docs/prompts/*` (E1's measured resolution) and reads a `Critical zone:` line. This holds the go-ahead half mechanically; the report half stays prose.
- C4, `ask` with no state (E4): the human confirms in the terminal, whatever the report says.
- C5, a marker file (E3): honor system.

The matcher set is the real decision. §3.1 lists 11 rows (`CLAUDE.md:152`), but the Layer Impact Report obligation of §3.2 (`CLAUDE.md:170`) names six files plus D-layer write paths. The log already reads it the narrow way: `docs/claude-code-log.md:90`, "`viewpoint/ir/` and `viewpoint/authoring/` are §3.1 rows, but no §3.2 file ... was touched" (`Layer Impact Report: not-required`, nine code files). Measured since 2026-09-01 on the trunk (545 commits): 42 touch a §3.1 row (authoring 14, ir 24, problems 8, `useJjomSync.ts` 1, `VersionFixer.tsx` 1), 2 touch the six named files. The S6 commit `94eb92a21` touched 7 files in `authoring/` and is logged `not-required`. In the log, `Layer Impact Report: produced` is 2 of 40 active entries and 67 of 1178 archived ones; `skipped` is 0 in both (so the field never recorded a violation, which says nothing on whether there were none). Q2 asks which set the gate matches.

### H3. The log-entry `Stop` hook

What `Stop` receives **[measured, probes 1 and 2]**: the common fields plus `stop_hook_active`, `last_assistant_message` (the final text, `"ok"`, `"done"`), `background_tasks`, `session_crons`, and `effort`. It fires when the agent stops responding, so once per turn end, not once per session **[docs]**.

Two designs, side by side:

| | Block (exit 2 or `decision: "block"`) | Warn (`systemMessage`, exit 0) |
|---|---|---|
| Measured | a hook that always exits 2: 9 `Stop` events (1 with `stop_hook_active: false`, 8 with `true`), 10 turns, final `result` empty, 0.153 USD for `say ok` **[probe 6A]** | 1 `Stop` event; delivered as `system/informational`, "Stop says: PROBE-WARN: ..." in `stream-json` **[probe 6B]** |
| Loop protection | the harness overrides after 8 consecutive blocks **[measured, and docs]** | none needed |
| At the Phase 1 hard stop of this very lane | blocks a legitimate stop: the entry is due at lane end, after Phase 2 (`prompt:165-166`) | prints a warning the human reads and ignores |
| Who sees it | the model (stderr becomes the continuation reason) | the human only **[docs: "shown to the user"]**; TUI rendering **not measured** (`-p` only) |
| Cost when wrong | 8 extra model turns and an empty last message | noise |
| Third variant [docs, not measured] | `hookSpecificOutput.additionalContext`: Claude sees it and continues once, no error notice, counts toward the same cap | |

Attribution is the hard part in a shared tree (P13 says concurrency is the normal state). "The session made commits" cannot be read from `git log` alone. The `Claude-Session:` trailer holds a claude.ai id (`session_01CsAN...`, `session_019j6k...`) that is not the local `session_id` UUID **[measured on the last 15 commits]**; the `(P-...)` in the subject is on 35 of the last 60 subjects. The only usable key is the P-ID, so H3 depends on R5's state. Do not choose here (Q4).

### H4. The skills

Dynamic content **[measured, probe 8]**: on `2.1.278` a `SKILL.md` line `` !`sed -n '/^## YYYY-MM-DD — type: short description/,/^\*\*Prompt document name\*\*: YYYY-MM-DD HH:mm/p' ${CLAUDE_PROJECT_DIR}/CLAUDE.md` `` is replaced at invocation by the block: 628 bytes, byte-identical (`cmp`) to `CLAUDE.md` §21.2 and to `PROTOCOL.md` P9, em dash preserved; a control that mutates one byte of the expected text differs, so the comparison discriminates. Conditions found:

- The injected command is permission-checked. My first attempt aborted with `Shell command permission check failed ... sed in '/Users/alfonso/jjodel-release/CLAUDE.md' was blocked ... only edit files in the allowed working directories`, because the file was outside the working directory of the probe. It passed with the copy inside the working directory, `${CLAUDE_PROJECT_DIR}`, `allowed-tools: Bash(sed *)`, `--permission-mode default`. Any non-zero exit >= 2 aborts the whole invocation **[docs]**.
- Empty output is not a failure: if §21.2's heading text changes, `sed` exits 0 with nothing and the skill loads without the block. The extraction needs a guard that exits >= 2 on an empty result **[docs on exit codes, guard not measured]**.
- `disableSkillShellExecution: true` (settings) would disable all injection **[docs]**.

Frontmatter that governs invocation **[docs, skills.md#control-who-invokes-a-skill]**: `disable-model-invocation: true` (only the user can invoke; the description is not in context), `user-invocable: false` (only Claude). `allowed-tools` grants tools for the turn.

The design that keeps one source: the skill holds no copy of the block. It injects §21.2 live from `CLAUDE.md`, and points at §21.3 for the field semantics (by reference, not pasted). `check:docs` Check A keeps comparing `CLAUDE.md` with `PROTOCOL.md` (`check-docs.ts:47-48`, the two anchors it compares). The alternative, a third copy inside `.claude/skills/`, needs Check A extended to a third file (`check-docs.ts` gets a change) and a new drift class. Q11.

Per skill: `log-entry` and `discovery-report` are supported (P9 block; P4 naming and minimum content). `status-flip` needs a clause first (premise 1). `checkpoint` is the architect's artifact (premise 2). Skills content survives compaction within a budget of 5000 tokens per skill **[docs]**.

### H5. The model drift

Precedence from the docs **[docs, settings.md#settings-precedence]**: managed, command line, `.claude/settings.local.json`, `.claude/settings.json`, `~/.claude/settings.json`; `ANTHROPIC_MODEL` outside the stack, above every file. The prompt's list is correct.

Why this repo's sessions run Sonnet 5 despite `.claude/settings.json:3` (`"model": "claude-opus-4-8"`) **[measured]**:

1. The two lane sessions before this one each begin with `/model sonnet` as their first entry (`05d05f8c...` at 2026-09-21T12:19:27Z, `e3a09e85...` at 13:17:11Z). Verbatim output, both times: "Set model to `Sonnet 5` and saved as your default for new sessions" and "`.claude/settings.json` pins `Opus 4.8` — that applies on restart".
2. A `/model` choice persists in `~/.claude/settings.json`, `model` field **[docs, model-config.md#setting-your-model]**. The user file holds `"model": "sonnet"` (an alias that resolves to Sonnet 5 on the Anthropic API **[docs, and measured: the session runs `claude-sonnet-5`]**), modified 15:17 local, the same minute as the 13:17Z event. There is no model state file under the repo's `.claude/projects/` (it holds two `memory/` files only) and none under `~/.claude.json` for this worktree (no `projects` entry).
3. The project pin wins at launch **[measured, probe 3]**: a replica project directory holding a copy of `.claude/settings.json`, user settings unchanged, `claude -p "say ok" --output-format json` reports `modelUsage` keyed `claude-opus-4-8`, and the `Stop` hook receives `effort.level: "xhigh"`. So the next launch in the repo opens on Opus 4.8, not on Sonnet 5 and not on Opus 5.
4. This session began with `/clear` at 14:11Z in a process that was already on Sonnet 5, so nothing restarted and the pin never applied. Every assistant message of this session is `claude-sonnet-5` (63 when counted, in the session transcript).

So three sources, three answers: `CLAUDE.md:93` "Claude Opus 5"; `.claude/settings.json` Opus 4.8; the session Sonnet 5. The pin has said `claude-opus-4-8` since commit `2b9a03827` (2026-05-29); the prompt's "2026-09-14" is the file's mtime. The §0 line naming Opus 5 arrived with `435c22da9` (2026-08-01) and the pin was never updated. The same two lines exist on `validation-skeleton` and `simulation-engine`; `master` has neither file. The merge lane already ran on Sonnet with a truthful trailer by decision (`docs/claude-code-log.md:70`).

Other measured facts:
- Exact ID for Opus 5: `claude-opus-5`. `claude -p ... --model claude-opus-5 --output-format json` answered with `modelUsage` key `claude-opus-5`; the alias `opus` resolved to the same key **[probe 4]**. The docs give the same example ("for example `claude-opus-5`"). `claude-opus-4-8` is still accepted on this account (probe 3).
- `effortLevel: "xhigh"` is a valid value **[docs, settings-reference#effortlevel: low, medium, high, xhigh]**, and is honored: the replica run reports `effort.level: "xhigh"` on `claude-opus-4-8`. Docs caveat: on Opus 4.8 (also Opus 4.7, Fable 5) Claude Code holds the model's default effort across sessions ahead of settings, and Opus 5 and Fable 5.1 have no hold **[docs, model-config.md#adjust-effort-level]**; on this account the hold did not show. The user file has an `effortLevel` key of its own; its value is not quoted here (stop-and-ask, Q14). Session effort is xhigh (`CLAUDE_EFFORT`).
- User-level `defaultMode: "auto"` does **not** cancel the project `ask` list **[measured, probe 5]**: with `--permission-mode auto`, `touch ctrl.txt` ran (control) and, with `permissions.ask: ["Bash(touch asked.txt)"]`, `touch asked.txt` was refused (`-p` has nobody to answer) and the file was not created. Docs say the same, and add that a hook `allow` does not lift an `ask` rule either **[docs, permissions.md#extend-permissions-with-hooks]**. So `git commit*` in `.claude/settings.json:17` prompts on every commit, hook or not.
- A `PreModelSwitch` hook exists since 2.1.251 and can block or `ask` on `/model` **[docs, not measured]**; it is outside the prompt's list and would put the pin on the switch itself.

Proposal for Phase 2, one line: `.claude/settings.json` is the only place a model is named, and §0 points to it.

### H6. The deny list and the `Bash` hook

What a deny rule expresses **[measured, probe 9; docs, permissions.md#bash]**, under `permissions.deny: ["Bash(git stash *)"]` with `Bash(git *)`, `Bash(sh *)` allowed so the deny is the only blocker; `PostToolUse` logged what actually ran:

| Command | Result |
|---|---|
| `git status` (control) | ran |
| `echo pre && git stash list` | **refused**: deny and ask apply when any subcommand matches |
| `sh -c 'git stash list'` | ran (bypass) |
| `git -C . stash list` | ran (bypass) |
| `/usr/bin/git stash list` | ran (bypass) |

So a deny rule is compound-aware and wrapper-blind. It can state `git stash*`, `git add -A*` (already at `.claude/settings.json:22`), `git add --all*`, `git add -u*`, `git checkout HEAD -- .`, and any `* --no-verify*`, with a `*` anywhere in the pattern **[docs]**. It cannot state a property of the command: `git commit` **without** a trailing `-- <paths>`, a missing `Model:` trailer, a subject over the limit. Those need the raw string, which is what `tool_input.command` holds **[measured, probe 2]**:

- `echo A && echo B; echo C | cat` arrives as that exact string, not split.
- A heredoc arrives whole, newlines and body included: `cat <<'XEOF'\nline one: git stash and --no-verify appear only as text\nline two\nXEOF`.
- The lane-shaped `git init -q . && git add x.txt && git commit -q -m "$(cat <<'XEOF'\ndocs: probe subject line\n\nModel: probe\nXEOF\n)" -- x.txt` arrives whole: subject, blank line, trailer and the trailing `-- x.txt` are all in the string. A hook can check the pathspec and the trailer; it cannot tell a commit message that quotes `git stash` from a command that runs it without parsing the shell.
- `-F file`, `--amend` with no `-m`, and multiple `-m` are other shapes; the string does not hold the message then.

The `if` field on a hook handler narrows when it runs, is best-effort, and the docs say to use permission rules, not a hook, for a hard deny **[docs, hooks.md#common-fields]**. A hook that exits 2 blocks before rules are evaluated; any other non-zero exit is a non-blocking error and the call proceeds **[docs, hooks.md#exit-code-output]**. **A hook guard fails open** on a crash or a missing interpreter (H8), while a deny rule is the fail-closed layer. That is the argument for putting every fixed form in the deny list and leaving to the hook only what a pattern cannot say.

The `ask` on `git commit*` cannot be removed by a hook (above), so a validating commit hook can only add refusals, not remove the human prompt (Q7). §6.2 says "Subject line <= 72 chars" (`CLAUDE.md:345`); measured on the trunk-native commits since 2026-09-18: 35 of 61 exceed 72, because the convention appends `(P-YYYY-MM-DD-HHmm)` (21 characters); the subject this prompt mandates for the Phase 1 commit is 89 characters. A hook enforcing 72 blocks the practice and this lane. Q6 must be answered before that check is written. Trailers over the same 61: 9 without `Model:` (3 cherry-picks authored 2026-09-14, 6 from the 2026-09-19 default-view lane), 4 without `Co-Authored-By`.

### H7. `.mcp.json`

None needed. Searches, with controls: the twenty newest log entries (lines 1-412 of the log, 20 entries counted, control `Phase 1` hits 7) match `chrome` twice, both the UI word ("object chrome"), 0 for `mcp|playwright|puppeteer`; `frontend/scripts/smoke/` uses `@playwright/test` as an npm library (`run.ts:32`, `calibrate.ts:29`, `states.ts:11`), not an MCP server (control: `goto` hits in `states.ts`); `git ls-files` returns no `.mcp.json` and no path containing `mcp`; of the 66 September prompts only this one matches `playwright mcp|mcp__|claude in chrome|\.mcp\.json|mcp server`; the four session transcripts of this worktree hold 0 `"name":"mcp__` tool calls against 17, 76, 76, 0 `"name":"Bash"` calls (control). The account has claude.ai connectors (Notion, Gmail and others) that are not project scoped and are not used by lanes. `.mcp.json` is a protected path anyway **[docs, permission-modes.md#protected-paths]**. Phase 2 adds none.

### H8. The hook runtime

Probe 1, verbatim in Appendix A: `command -v node` printed `/Users/alfonso/.local/bin/node` and `node --version` printed `v26.8.1` at `SessionStart`, `UserPromptSubmit`, `PreToolUse` and `Stop`, in every run **[measured]**. Hook commands run in shell form via `sh -c`, non-interactive, no profile **[docs, hooks-guide.md]**, so the interpreter is the first `node` on the PATH Claude Code inherited. Here that is the CLI session's PATH, which puts `~/.local/bin` first. This session is a CLI one (`CLAUDE_CODE_ENTRYPOINT=cli`); HARNESS-DOCS §1 also names the VS Code plugin, whose PATH was not measured.

Four `node` binaries on this Mac **[measured]**:

| Binary | Version | Runs `--experimental-strip-types t.ts` | Runs `t.ts` with no flag |
|---|---|---|---|
| `~/.local/bin/node` (a symlink into `~/.hermes/node/bin/node`, another tool's install, created 2026-09-09) | v26.8.1 | yes | yes |
| `/opt/homebrew/bin/node` | v23.3.0 | yes | no (syntax error) |
| `/usr/local/bin/node` | v16.15.0 | no (`bad option`) | no |
| `~/.nvm/versions/node/v18.20.8/bin/node` (nvm default) | v18.20.8 | no (`bad option`) | no |

With `PATH=/usr/local/bin:/usr/bin:/bin`, `sh -c 'node --version'` printed `v16.15.0`; with `PATH=/usr/bin:/bin` it printed `node: command not found`. That is the failure mode: an interpreter that is missing or wrong makes the hook exit non-zero, which is a non-blocking error, so the guard silently disappears (H6). Two other facts: `frontend/vitest.config.ts:16` collects `src/**/__tests__/**/*.test.ts` and `scripts/gates/__tests__/**/*.test.ts` only, so tests under `frontend/scripts/hooks/__tests__/` need a new `include` entry; `frontend/tsconfig.json` includes `src` only, so hook scripts do not move the typecheck baseline.

Options, with cost, not chosen: (a) plain `.mjs` with no TypeScript syntax, `node ...hook.mjs`: runs on v16 to v26, no flag, no dependency on the launcher; the hook tests import it from TypeScript tests (`allowJs` is on) and run it as a subprocess with stdin JSON (P11: the probe executes the subject). (b) TypeScript with `--experimental-strip-types`: shares the style of `frontend/scripts/gates/`, but needs node >= 22.6 and the flag below v26, so it depends on which `node` the launcher puts first. (c) a `.sh` wrapper that resolves `node` from a fixed list: more code, one more thing to test. In all three the interpreter name in `.claude/settings.json` is a committed string, and an absolute path is machine-specific (Q10).

## 5. Findings outside the eight hypotheses

- `.claude/` is a protected directory and `.mcp.json` a protected file: writes to them are prompted (`default`, `acceptEdits`), routed to the classifier (`auto`) or denied (`dontAsk`), and an `Edit(.claude/**)` allow rule does not change that **[docs, permission-modes.md#protected-paths]**. Phase 2's settings and skill files pay that per write.
- In `-p`, an untrusted directory ignores the project's `permissions.allow`: "Ignoring 7 permissions.allow entries from .claude/settings.json: this workspace has not been trusted" **[measured, probe 3]**. Probes and any future `-p` lane in a fresh directory do not see the project allow list.
- `generate-agents.mjs` replaces §0 with `docs/_agents/runtime-codex.md` or omits it (`:20-24`, `:93-114`), and skips dot-directories (`:65`): a §0-only edit is expected to leave `AGENTS.md` byte-identical, a §1 edit changes it, and `.claude/skills/` is not projected. That is read from the generator, not run: `npm run check:agents` decides.
- `docs/log-inbox/*.md` are outside Check B (`check-docs.ts:513-548` only counts them and warns), the ticket already open at `docs/claude-code-log.md:68`. A `log-entry` skill that lints against the live block reduces that gap without touching the gate.
- The backlog voice 3 (`docs/archivio/claude_backlog_2026-09-09_manutenzione_harness.md:48-65`) says three of the four discipline points ceded again; its Check D (now built: A to D in `check-docs.ts`) covers the other three, not "a discovery report written before the hard stop", which is R1 here and stays prose.
- `CLAUDE.md` §6.1 (`:331`) allows "pass the pathspec to the commit itself ... or diff `git diff --cached --name-only` against the declared file list". A hook that requires the pathspec is stricter than the text; the alternative form needs a declared list the hook does not have.

## 6. Dependencies and risks

- **Fail-open guards**: any hook error other than exit 2 lets the call through (H6, H8). Every fixed form goes to the deny list.
- **Self-consistency**: a `Bash` hook that reads commit messages would block this lane's own commit messages if they quote the forbidden commands; Phase 2's commits and log entry must be tested against it.
- **`.claude/` prompts**: each write under `.claude/` prompts or hits the classifier (protected path).
- **Ordering inside step 1**: a `hooks` block in `.claude/settings.json` that names a script that does not exist yet fails open on every call. The model pin and the deny list can land before the scripts; the `hooks` block lands with or after them.
- **Rule 5 and rule 19**: `vitest.config.ts` gains an `include` line (config, flagged), and the file count is above 5 (list in section 7, RC-11: listed and repeated in `Out-of-scope changes`).
- **Shared tree** (P13): hook state files must not sit in the repo; the scratchpad or a per-`session_id` path under `$TMPDIR`.
- **Branches**: `.claude/settings.json` on `validation-skeleton` and `simulation-engine` still pins 4-8 (Q13); `CLAUDE.md` changes are owed to the trunk only when made elsewhere (P15), and this lane is on the trunk.
- **Unmeasured**: how an interactive paste reaches the `UserPromptSubmit` `prompt`; TUI rendering of a `Stop` `systemMessage`; `PreModelSwitch`; the transcript lag in interactive mode (probe 7 is `-p`, n=3); the guard on empty extraction in a skill.

## 7. Phase 2 scope as the evidence supports it

In the order they land; each bullet a commit boundary, docs and code apart (P13).

1. **Settings** (code): `.claude/settings.json`: the model per Q1, extra `deny` entries for the forms Q12 accepts. Then, after step 2, its `hooks` block.
2. **Hooks** (code), under `frontend/scripts/hooks/`, one script per decision taken on Q2 to Q5: `bash-guard.mjs` (R2, R7 fallback), `critical-zone.mjs` (R6), `prompt-id.mjs` (R5, two events), `stop-log.mjs` (R3, H3), a shared `lib.mjs` (stdin parse, state path); tests `frontend/scripts/hooks/__tests__/*.test.ts` that run each script as a subprocess with real stdin JSON and carry a mutation bench (§5); `frontend/vitest.config.ts` (one `include` entry). Up to 11 files.
3. **Skills** (code): `.claude/skills/log-entry/SKILL.md`, `.claude/skills/discovery-report/SKILL.md`; `status-flip` only after Q8; no `checkpoint` unless Q9 amends §4.6.
4. **Docs, pointer lines**: `CLAUDE.md` §0 (points to `.claude/settings.json` for the model) and §1 (points to the hooks and skills), then `npm run gen:agents` and `npm run check:agents`, `npm run check:docs`; `docs/PROTOCOL.md` only if Q6 or Q8 need a clause (version bump).
5. **Docs, registers**: `docs/HARNESS-DOCS.md` (§6 gates table gains hooks and skills; §4.6 if Q9), the ratification line in `docs/decisions.md`, and at lane end the entry in `docs/log-inbox/harness.md`. Docs commits carry no code.

Gates per code commit: `npm run typecheck` at baseline (14 on Linux, 33 on macOS), `npx vitest run` with the count, `npm run build`; the visual smoke is not applicable.

## 8. Open questions for Alfonso

1. Which single model do `.claude/settings.json` and §0 name: `claude-opus-5` (measured accepted; pin is `claude-opus-4-8` since 2026-05-29) or Opus 4.8, and the full ID or the `opus` alias?
2. Does the critical-zone gate match the §3.2 trigger (six files plus D-layer writes; 2 commits since 2026-09-01) or the §3.1 table (adds `authoring/`, `ir/`, `problems/`, `DV.tsx`, `defaultViewTemplate.ts`; 42 commits, and S6 was logged `not-required`)?
3. For R6, which evidence: a `ask` with no state, the `Critical zone:` go-ahead line in the prompt (report content stays prose), or a marker file; the transcript is ruled out by probe 7.
4. `Stop`: block, warn (`systemMessage`), or the `additionalContext` variant, and what disarms a block at a phase hard stop.
5. Mechanize R5 (`UserPromptSubmit` plus `Stop`, an event outside the prompt's five) or leave the Prompt-ID rule as prose; the paste behaviour needs an interactive measurement first.
6. §6.2 says <= 72 and the `(P-...)` convention breaks it in 35 of 61 commits (and in the subject this prompt mandates, 89): amend the rule to exclude the ID suffix, or change the convention, before any hook checks it?
7. The project `ask` on `git commit*` prompts on every commit and no hook can lift it: keep it as the human gate, or move commits to `allow` plus a validating hook?
8. R4 has no written clause: write one (one flip or two, where the visual GO is recorded) before a `status-flip` skill, or drop the ritual?
9. R8: amend HARNESS-DOCS §4.6 so Claude Code may write a checkpoint (then a skill is possible), or leave it with the architect?
10. Hook interpreter: plain `.mjs` (any node 16 to 26), TypeScript with strip-types (node >= 22.6, flag below v26), or a `.sh` resolver; `~/.local/bin/node` is a symlink into another tool's directory.
11. Skill single source: live injection of §21.2 (no copy) or a third copy under Check A.
12. Deny extensions with no clause today (`git reset --hard`, `git restore .`, `git checkout -- .`, `git clean`, plain `rm`): write the clause first (P15), or leave them out?
13. Carry `.claude/settings.json` to `validation-skeleton` and `simulation-engine` (both pin 4-8), or leave them?
14. May the report quote the user-level `effortLevel` (a key `~/.claude/settings.json` has that the prompt does not name)? Left out under the stop-and-ask condition.
15. Each `claude -p` probe left a transcript under `~/.claude/projects/-private-tmp-...-probe-cwd/` (user-level state, outside the repo, created by the tool): delete it or leave it?
16. `frontend/vitest.config.ts` gains an `include` line for the hook tests: accepted as in scope?

## Appendix A. Probes (verbatim)

Each probe ran `claude -p` from a `cwd` under the scratchpad, never inside the repo; the repo's `git status --short` was empty after the last one. Failed attempts, kept as findings: probe 7 first ran with a settings file that was not valid JSON (quoting), the runs went through without the hook and wrote no log, and were discarded; probe 8 first aborted on the permission check (H4); the probe log was truncated by the operator between probe 1 and probe 2, so probe 1 was rerun with the identical command to regenerate its log.

Commands:

- P1: `claude -p "say ok" --settings /tmp/hook-probe.json` (as the prompt specifies).
- P2: a prompt asking for `echo A && echo B; echo C | cat`, a heredoc, `Write`, `Edit`, and a `git commit` inside a throwaway repo; `--settings /tmp/hook-probe.json --permission-mode acceptEdits --allowedTools "Bash" --no-session-persistence`.
- P3: cwd = a replica project directory holding a copy of `.claude/settings.json`; `claude -p "say ok" --output-format json --no-session-persistence --settings /tmp/hook-probe.json`.
- P4: `--model claude-opus-5` and `--model opus`, `--output-format json`.
- P5: `--permission-mode auto`, one run with and one without `permissions.ask: ["Bash(touch asked.txt)"]`.
- P6A and P6B: `Stop` hook that always exits 2, and one that prints `{"systemMessage":"PROBE-WARN: ..."}`.
- P7: a `PreToolUse` hook on `Write` that counts `LIRPROBE-MARK` in `transcript_path`, three runs.
- P8: a skill `probe-inject` with `disable-model-invocation: true`, `allowed-tools: Bash(sed *)`, one `` !`sed ...` `` line.
- P9: `permissions.deny: ["Bash(git stash *)"]`, allow `Bash(git *)`, `Bash(sh *)`, `Bash(echo *)`, `Bash(/usr/bin/git *)`, a `PostToolUse` hook logging what ran.

Probe settings file `/tmp/hook-probe.json`, verbatim:

~~~~
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "command -v node >> /tmp/hook-probe.log; node --version >> /tmp/hook-probe.log; cat >> /tmp/hook-probe.log; echo >> /tmp/hook-probe.log" } ] }
    ],
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "command -v node >> /tmp/hook-probe.log; node --version >> /tmp/hook-probe.log; cat >> /tmp/hook-probe.log; echo >> /tmp/hook-probe.log" } ] }
    ],
    "PreToolUse": [
      { "matcher": "*", "hooks": [ { "type": "command", "command": "command -v node >> /tmp/hook-probe.log; node --version >> /tmp/hook-probe.log; cat >> /tmp/hook-probe.log; echo >> /tmp/hook-probe.log" } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": "command -v node >> /tmp/hook-probe.log; node --version >> /tmp/hook-probe.log; cat >> /tmp/hook-probe.log; echo >> /tmp/hook-probe.log" } ] }
    ]
  }
}
~~~~

Hook log of probe 1 (`/tmp/hook-probe.log` right after the rerun), verbatim:

~~~~
/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"7508fd3d-64a9-4f21-9caf-a33379d66099","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-cwd/7508fd3d-64a9-4f21-9caf-a33379d66099.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-cwd","hook_event_name":"SessionStart","source":"startup"}

/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"7508fd3d-64a9-4f21-9caf-a33379d66099","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-cwd/7508fd3d-64a9-4f21-9caf-a33379d66099.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-cwd","prompt_id":"1693ec65-c982-4550-8b36-8dfe2e2f8e5f","permission_mode":"auto","hook_event_name":"UserPromptSubmit","prompt":"say ok"}

/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"7508fd3d-64a9-4f21-9caf-a33379d66099","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-cwd/7508fd3d-64a9-4f21-9caf-a33379d66099.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-cwd","prompt_id":"1693ec65-c982-4550-8b36-8dfe2e2f8e5f","permission_mode":"auto","effort":{"level":"medium"},"hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"ok","background_tasks":[],"session_crons":[]}
~~~~

Hook log of probes 2 and 3 (`/tmp/hook-probe.log` at the end of probe 3; probe 2's section opens with its `SessionStart`, probe 3's opens after the `##### probe 3` marker), verbatim:

~~~~
/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"192661e4-96ad-4d6f-9ff9-f1bb79d74488","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-cwd/192661e4-96ad-4d6f-9ff9-f1bb79d74488.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-cwd","hook_event_name":"SessionStart","source":"startup"}

/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"192661e4-96ad-4d6f-9ff9-f1bb79d74488","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-cwd/192661e4-96ad-4d6f-9ff9-f1bb79d74488.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-cwd","prompt_id":"340b2f18-5c81-4e70-ab7f-7352a71eaead","permission_mode":"acceptEdits","hook_event_name":"UserPromptSubmit","prompt":"Run these steps in order with the named tools, no commentary, then reply with the single word done.\n1. Bash tool, this exact command: echo A && echo B; echo C | cat\n2. Bash tool, this exact multi-line command (a heredoc):\ncat <<'XEOF'\nline one: git stash and --no-verify appear only as text\nline two\nXEOF\n3. Write tool: create the file x.txt in the current directory with the content hello\n4. Edit tool: in x.txt replace hello with world\n5. Bash tool, this exact command (it commits inside a throwaway repo):\ngit init -q . && git add x.txt && git commit -q -m \"$(cat <<'XEOF'\ndocs: probe subject line\n\nModel: probe\nXEOF\n)\" -- x.txt"}

/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"192661e4-96ad-4d6f-9ff9-f1bb79d74488","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-cwd/192661e4-96ad-4d6f-9ff9-f1bb79d74488.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-cwd","prompt_id":"340b2f18-5c81-4e70-ab7f-7352a71eaead","permission_mode":"acceptEdits","effort":{"level":"medium"},"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"echo A && echo B; echo C | cat"},"tool_use_id":"toolu_01Ba4gMdHrYY4VJWcFjtBZwV"}

/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"192661e4-96ad-4d6f-9ff9-f1bb79d74488","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-cwd/192661e4-96ad-4d6f-9ff9-f1bb79d74488.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-cwd","prompt_id":"340b2f18-5c81-4e70-ab7f-7352a71eaead","permission_mode":"acceptEdits","effort":{"level":"medium"},"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"cat <<'XEOF'\nline one: git stash and --no-verify appear only as text\nline two\nXEOF"},"tool_use_id":"toolu_01N3ny2oDUyQCoqAj6CJm4sg"}

/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"192661e4-96ad-4d6f-9ff9-f1bb79d74488","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-cwd/192661e4-96ad-4d6f-9ff9-f1bb79d74488.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-cwd","prompt_id":"340b2f18-5c81-4e70-ab7f-7352a71eaead","permission_mode":"acceptEdits","effort":{"level":"medium"},"hook_event_name":"PreToolUse","tool_name":"Write","tool_input":{"file_path":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-cwd/x.txt","content":"hello"},"tool_use_id":"toolu_01ToHpN2bxs1RsLgrM6NPvcv"}

/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"192661e4-96ad-4d6f-9ff9-f1bb79d74488","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-cwd/192661e4-96ad-4d6f-9ff9-f1bb79d74488.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-cwd","prompt_id":"340b2f18-5c81-4e70-ab7f-7352a71eaead","permission_mode":"acceptEdits","effort":{"level":"medium"},"hook_event_name":"PreToolUse","tool_name":"Edit","tool_input":{"file_path":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-cwd/x.txt","old_string":"hello","new_string":"world","replace_all":false},"tool_use_id":"toolu_011ahFvEmmvpDhJSKcQpZVnD"}

/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"192661e4-96ad-4d6f-9ff9-f1bb79d74488","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-cwd/192661e4-96ad-4d6f-9ff9-f1bb79d74488.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-cwd","prompt_id":"340b2f18-5c81-4e70-ab7f-7352a71eaead","permission_mode":"acceptEdits","effort":{"level":"medium"},"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"git init -q . && git add x.txt && git commit -q -m \"$(cat <<'XEOF'\ndocs: probe subject line\n\nModel: probe\nXEOF\n)\" -- x.txt"},"tool_use_id":"toolu_01L2ayKHKHBphV8czqgUKxEJ"}

/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"192661e4-96ad-4d6f-9ff9-f1bb79d74488","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-cwd/192661e4-96ad-4d6f-9ff9-f1bb79d74488.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-cwd","prompt_id":"340b2f18-5c81-4e70-ab7f-7352a71eaead","permission_mode":"acceptEdits","effort":{"level":"medium"},"hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"done","background_tasks":[],"session_crons":[]}

##### probe 3: replica project dir (copy of .claude/settings.json), no --model flag
/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"23932295-9e2b-4028-a0ba-e6faabb901be","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-project/23932295-9e2b-4028-a0ba-e6faabb901be.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-project","hook_event_name":"SessionStart","source":"startup"}

/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"23932295-9e2b-4028-a0ba-e6faabb901be","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-project/23932295-9e2b-4028-a0ba-e6faabb901be.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-project","prompt_id":"45809e9c-fce0-4e9d-b4f2-461c63235ddd","permission_mode":"auto","hook_event_name":"UserPromptSubmit","prompt":"say ok"}

/Users/alfonso/.local/bin/node
v26.8.1
{"session_id":"23932295-9e2b-4028-a0ba-e6faabb901be","transcript_path":"/Users/alfonso/.claude/projects/-private-tmp-claude-501--Users-alfonso-jjodel-release-2f49e5d9-5f49-4083-843f-1100aa6f6aa9-scratchpad-probe-project/23932295-9e2b-4028-a0ba-e6faabb901be.jsonl","cwd":"/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/probe-project","prompt_id":"45809e9c-fce0-4e9d-b4f2-461c63235ddd","permission_mode":"auto","effort":{"level":"xhigh"},"hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"ok","background_tasks":[],"session_crons":[]}
~~~~

Other settings used, verbatim:

`stop-A.json` (P6A), the scratchpad path stands for the probe directory:

~~~~
{"hooks":{"Stop":[{"hooks":[{"type":"command","command":"cat >> /private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/stop-A.log; echo >> /private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/stop-A.log; echo 'probe: no log-inbox entry yet' >&2; exit 2"}]}]}}
~~~~

`stop-B.json` (P6B):

~~~~
{"hooks":{"Stop":[{"hooks":[{"type":"command","command":"cat >> /private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/stop-B.log; echo >> /private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/stop-B.log; echo '{\"systemMessage\":\"PROBE-WARN: this session made commits and docs/log-inbox has no entry\"}'"}]}]}}
~~~~

`lir.json` and `lir-check.sh` (P7), run with `LIRLOG` set to a scratchpad file:

~~~~
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/lir-check.sh"
          }
        ]
      }
    ]
  }
}

#!/bin/sh
p=$(jq -r .transcript_path)
n=$(grep -c 'LIRPROBE-MARK' "$p" 2>/dev/null)
if [ -f "$p" ]; then e=yes; else e=no; fi
echo "marks_in_transcript_at_PreToolUse=$n transcript_exists=$e" >> "$LIRLOG"
~~~~

`deny.json`, `post-log.sh` and the prompt (P9):

~~~~
{
  "permissions": {
    "allow": [
      "Bash(git *)",
      "Bash(sh *)",
      "Bash(echo *)",
      "Bash(/usr/bin/git *)"
    ],
    "deny": [
      "Bash(git stash *)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/private/tmp/claude-501/-Users-alfonso-jjodel-release/2f49e5d9-5f49-4083-843f-1100aa6f6aa9/scratchpad/post-log.sh"
          }
        ]
      }
    ]
  }
}

#!/bin/sh
jq -c '{ran: .tool_input.command}' >> "$RANLOG"

Run these five commands, each as its own separate Bash tool call, in this order, without any retry or workaround if one is refused. After all five, reply with one line per command: the number and either ran or refused.
1. git status
2. echo pre && git stash list
3. sh -c 'git stash list'
4. git -C . stash list
5. /usr/bin/git stash list
~~~~

`probe-ask.json` (P5):

~~~~
{"permissions":{"ask":["Bash(touch asked.txt)"]}}
~~~~

`SKILL.md` of `probe-inject` (P8, second and passing form):

~~~~
---
name: probe-inject
description: probe of dynamic content injection
disable-model-invocation: true
allowed-tools: Bash(sed *)
---
BEGIN-INJECT
!`sed -n '/^## YYYY-MM-DD — type: short description/,/^\*\*Prompt document name\*\*: YYYY-MM-DD HH:mm/p' ${CLAUDE_PROJECT_DIR}/CLAUDE.md`
END-INJECT
Reply with the single word done.
~~~~

prompt of P2:

~~~~
Run these steps in order with the named tools, no commentary, then reply with the single word done.
1. Bash tool, this exact command: echo A && echo B; echo C | cat
2. Bash tool, this exact multi-line command (a heredoc):
cat <<'XEOF'
line one: git stash and --no-verify appear only as text
line two
XEOF
3. Write tool: create the file x.txt in the current directory with the content hello
4. Edit tool: in x.txt replace hello with world
5. Bash tool, this exact command (it commits inside a throwaway repo):
git init -q . && git add x.txt && git commit -q -m "$(cat <<'XEOF'
docs: probe subject line

Model: probe
XEOF
)" -- x.txt
~~~~

## Addendum 2026-09-21 (Phase 2, P-2026-09-21-1620): running the R5 probe

Question 5 of this report left open how a pasted message reaches `UserPromptSubmit`: `prompt` was measured only for a message passed on the command line. The settings file `docs/discovery/harness/probe_2026-09-21_userpromptsubmit.json` logs the stdin JSON of that event and of `Stop`, and nothing else. Run it by hand, interactively, outside the repo: `rm -f /tmp/userpromptsubmit-probe.log; mkdir -p /tmp/r5-probe && cd /tmp/r5-probe && claude --settings <absolute path of the file>`; paste a multi-line message that opens with `[P-2026-09-21-1620]`, the way a GO from the chat does; then, from another terminal, `jq -r '.prompt' /tmp/userpromptsubmit-probe.log`. Read three things: whether `prompt` starts with the `[P-...]` line, whether the paste arrives wrapped or altered, and whether the newlines survive. The `Stop` line of the same log shows `last_assistant_message`, which is what a reply-opening check would read. Delete the log when done; nothing in the repo changes.
