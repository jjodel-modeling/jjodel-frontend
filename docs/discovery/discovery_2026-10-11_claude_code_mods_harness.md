# Discovery — Claude Code mods and the harness (P-2026-10-11-1745)

- Prompt: `docs/prompts/claude_2026-10-11_1745_prompt_claude_code_mods_harness_discovery.md`, chat `C-2026-10-11-1735`, front `harness`
- Session `da4a3bcc-12d7-4f24-a128-39c004b57d1d`, worktree `~/jjodel-w-mods`, branch `mods-disc`, base `44395bf59`
- Claude Code 2.1.296 (CLI, `~/.local/bin/claude -> ~/.local/share/claude/versions/2.1.296`); the VS Code extension 2.1.292
- Phase 1 only. Read-only on the repo. Every probe ran under `/tmp/jjodel-mods-probe/`, each session in `~/jjodel-w-mods` (or in `/tmp`)
  with lane-run's own flags, `-p --output-format stream-json --verbose --permission-mode bypassPermissions`, plus `--plugin-dir`.
  Probe model `claude-haiku-5-5` (the hook mechanics do not depend on it). Sources and measured output are in
  `docs/discovery/harness/mods/` (section 7). `git status` was clean after every probe; HEAD stayed at `44395bf59`.

## 0. The six answers

1. **Surfaces.** Mods are on in 2.1.296 and load in a `claude -p` session given `--plugin-dir` (measured, every probe). `lane-run`
   passes no plugin flag and sets no plugin variable, so a lane today folds exactly two hooks modules, both built in:
   `cc-plugin-agents-md` and `cc-plugin-telemetry`. No `sec-default`. The VS Code extension runs its own bundled engine (2.1.292), and that
   engine loads a mod the same way (measured, s6).
2. **API.** 46 engine events, the `classic.*` settings-hook events, and one event per call on `$`. Every hook is `($, e, next)`, and every
   gating hook **fails open unless its registration carries `.catch`**. The table is in section 3.2.
3. **Order and permissions.** The mod's `tool.call` is outermost. Next come the `PreToolUse` settings hooks (`bash-guard`,
   `critical-zone`), then `tool.check`, which carries the deny-list verdict, then the tool. Three ways around the guards, all measured:
   (a) a mod that answers the call itself skips both hooks and the deny list;
   (b) a mod's `tool.check` hook that answers `allow` overrides a deny-list `deny` (`git stash list` ran) and a `bash-guard` `deny`;
   (c) `$.process.run` runs a host command that no permission layer sees.
   `sec-default` is in the binary but not seated on this machine, and it can be seated only by managed settings, so the "with
   `sec-default`" arm was not run. Failures fail open by default: a throw passes at once, a hang after the 10 s budget. With `.catch`
   both fail closed.
4. **Prompt-ID guard.** All four checks are possible. The P13 refusal is a real block: the prompt is dropped and the model is never
   called. The `Outcome:` check is a block at `classic.Stop` that buys one retry. The reply-prefix check can only flag, or forge the
   prefix by rewriting.
5. **Telemetry.** Per turn: the four token counts and the model. Per measurement: context tokens, window and percent, and the cost in USD.
   All measured.
6. **Mapping.** Section 3.6. In short: the deny list, the two hooks and the three skills stay. The planned `Stop` hook is better carried by
   a mod, on one condition: `lane-run` loads a repo-held mod. `/lane` gains from a mod command, which spends no model turn.

The finding that weighs most is not on the list: **a mod sits above every RC-15 layer.** Whatever loads one can switch off the deny
list and both hooks. Section 4, R1.

## 1. Hypotheses under falsification, goal

- **H1** A lane launched by `lane-run` loads no mod. **Holds**: it loads two built-in ones, and no user, project or flag mod (3.1).
- **H2** A mod's `tool.call` handler runs before the `PreToolUse` hooks. **Holds** (3.3, s1, s4).
- **H3** The deny list resists a loaded mod. **Falsified**: without `sec-default` it does not (s2-allow).
- **H4** A mod that answers a tool call itself skips the hooks and the deny list. **Holds** (s2-answer, s2-run).
- **H5** A failing mod fails open. **Holds** by default, and the opposite holds with `.catch` (s9, s2-*catch).
- **H6m** A mod can carry the four Prompt-ID checks of the lane discipline. **Holds** for checks 1, 2 and 4, as blocks. Check 3 is a flag or
  a rewrite, never a block (3.4).
- **H7** A mod can read tokens and context per turn. **Holds** (3.5).

Goal: measure what mods change for the harness before any decision. This lane decides nothing.

## 2. Files read (full paths)

- `/Users/alfonso/jjodel-w-mods/CLAUDE.md`, `/Users/alfonso/jjodel-w-mods/docs/PROTOCOL.md` (P4, P6, P9, P13),
  `/Users/alfonso/jjodel-w-mods/docs/HARNESS-DOCS.md` §6 and §7, `/Users/alfonso/jjodel-w-mods/docs/decisions.md` (RC-15..RC-21, RC-44)
- `/Users/alfonso/jjodel-w-mods/docs/discovery/discovery_2026-09-21_harness_mechanization.md` (H6, R2, R7)
- `/Users/alfonso/jjodel-w-mods/.claude/settings.json`, `/Users/alfonso/jjodel-w-mods/.claude/commands/lane.md`
- `/Users/alfonso/jjodel-w-mods/frontend/scripts/lane-run.mjs`, `/Users/alfonso/jjodel-w-mods/frontend/scripts/lane-tracking.mjs` (`isGoMessage`),
  `/Users/alfonso/jjodel-w-mods/frontend/scripts/hooks/bash-guard.mjs` (docs/code split), `/Users/alfonso/jjodel-w-mods/frontend/scripts/gates/check-docs.ts` (prompt scan scope)
- `/Users/alfonso/jjodel-w-mods/docs/log-inbox/harness.md`, `/Users/alfonso/jjodel-w-mods/docs/claude-code-log.md` (head)
- The mods documentation the engine writes. The `plugin-authoring` skill writes it into
  `/private/tmp/claude-501/bundled-skills/2.1.296/4ee3eeae2d1b2755c1d3ea201559d00b/plugin-authoring/`:
  `types/claude-code.d.ts` ("// Written by Claude Code 2.1.296.", 21463 lines), `reference.md` and `examples/`. A copy is kept
  in `/tmp/jjodel-mods-probe/ref/`. Below, `types:N` is a line of that 2.1.296 file. The engine also laid the declarations into the scratch
  plugin (`/tmp/jjodel-mods-probe/probe/.claude-plugin/types/claude-code/index.d.ts`), last written by the 2.1.292 engine of s6:
  "// Written by Claude Code 2.1.292."
- `~/.claude/settings.json` (keys only), `claude --help`, `claude plugin --help`, `claude plugin list`
- `~/.vscode/extensions/anthropic.claude-code-2.1.292-darwin-arm64/` (`package.json`, `extension.js`, `resources/native-binary/claude`)
- The 2.1.296 binary, searched with fixed strings for `sec-default`: 17 hits at the byte offsets in `secdefault-offsets.txt`, and the
  context around each

## 3. Findings

### 3.1 Version and surfaces

- **Version.** `claude --version` reads `2.1.296 (Claude Code)`. `$.session.version()`, read from inside the mod, answers
  `{"version":"2.1.296","base":"2.1.296","builtAt":"2026-10-09T01:31:52Z"}` (`results.txt`, every `session.start` line).
- **Mods are on.** `reference.md:73`: "A headless `claude -p` always loads fresh". Measured: the probe's `session.start` fired in every
  session given `--plugin-dir`. `engine.create` reports the fold, managed plugins first, and it was always
  `["jjprobe","cc-plugin-agents-md","cc-plugin-telemetry"]`. The binary registers at least three built-in hooks
  modules (`ASe("cc-plugin-sec-default",…)`, `ASe("cc-plugin-agents-md",…)`, `ASe("cc-plugin-telemetry",…)`, offset 204175221), and two
  of them are seated here. The debug log of s7 names the two seated ones: "hooks module cc-plugin-agents-md@builtin loaded (native, …
  tier builtin); events: …,tool.call,…" and "hooks module cc-plugin-telemetry@builtin loaded".
- **Hot reload in this session is off.** System notice: "Mod hot-reloading is off in this session (nobody could be asked)". That is
  expected for a program-started session. `--plugin-dir` does not need it.
- **How `lane-run` launches.** `frontend/scripts/lane-run.mjs:320`
  `const FLAGS = ['--output-format', 'stream-json', '--verbose', '--permission-mode', 'bypassPermissions'];`;
  `:322` `const AUTO_FLAGS = ['--disallowedTools', 'WebFetch,WebSearch', '--strict-mcp-config'];`. The start is at `:915`
  `launch(f, claude, worktree, promptFile, ['-p', ...FLAGS, ...(autoRun ? AUTO_FLAGS : []), ...(tier.model ? ['--model', tier.model] : [])], goAhead, autoRun);`
  and the resume at `:990` `launch(f, claude, worktree, message, ['-p', '--resume', session, ...FLAGS, ...(autoRun ? AUTO_FLAGS : [])], goAhead || null, autoRun);`.
  The binary is the first `claude` on the PATH, then `~/.local/bin/claude` (`:411-417`). It runs through `/bin/sh -c WRAPPER … nohup "$@" < "$input"`
  (`:354-357`, `:484`), with `env = { ...process.env, PATH: … }` (`:474`) and the prompt file on stdin.
  `command grep -c -i plugin frontend/scripts/lane-run.mjs` returns `0` with exit 1, and the same for `CLAUDE_CODE_`. The positive
  control `permission-mode` returns 2. So `lane-run` passes neither `--plugin-dir` nor `--bare` nor `--safe-mode`, and sets no plugin
  variable. A `CLAUDE_CODE_PLUGIN_DIRS` in the chat's own environment would still reach the lane through `...process.env`.
  `~/.claude/settings.json` has no `env` block (its keys: permissions, model, hooks, enabledPlugins, effortLevel, modelSettings, tui,
  skipDangerousModePermissionPrompt, theme, inputNeededNotifEnabled, agentPushNotifEnabled). The two user plugins enabled there
  (`feature-dev`, `typescript-lsp`) add no hooks module: they are absent from the fold.
- **Flags that would turn plugins off.** `claude --help`: `--bare` "skip hooks (those defined in settings and by installed plugins …)";
  `--safe-mode` "Start with all customizations (CLAUDE.md, skills, installed plugins, hooks, …) disabled". Neither is used.
- **Project skills folder.** `reference.md:72` says an interactive session watches "a plugin auto-loaded from a skills folder
  (`~/.claude/skills/<name>`, the project's `.claude/skills/<name>`)". Measured under `-p` (s7): a copy of the probe at
  `/tmp/jjodel-mods-probe/skilldir-repo/.claude/skills/jjprobe/` was **not** loaded. The debug log lists the project skills path
  ("project=[/private/tmp/jjodel-mods-probe/skilldir-repo/.claude/skills]"), but no hooks module beyond the two built-ins, and no
  `probe.jsonl` was written. The interactive case was not measured.
- **VS Code.** The extension ships its own engine, `resources/native-binary/claude`, which reads `2.1.292 (Claude Code)`. That is newer
  than 2.1.287, the release that shipped mods. A probe run with that binary (s6) loaded the mod, folded the same three modules, gave
  the same order, and laid its declarations into the plugin folder ("// Written by Claude Code 2.1.292."). The types declare the surface:
  `e.surface` is `terminal`, `desktop`, `vscode` or `mobile` (`reference.md:111`). The extension contributes
  `claudeCode.environmentVariables` (`package.json`), and its `extension.js` names `CLAUDE_CODE_PLUGIN_DIRS` and
  `CLAUDE_CODE_PLUGIN_DIR_WATCH` in a table of variable names. The extension UI itself was not driven.
  Evidence, then: the engine VS Code runs loads mods. How the extension passes a plugin folder was read, not run.

### 3.2 API inventory

Source: `types:3950-4481` (`EngineEventOf`), `types:1257` (`ClassicEventOf`), `types:6844-7193` (`OpEventOf`), `reference.md`.

- **Registration.** `types:9309` `export type Register = (on: On, options: PluginOptions) => unknown;`. The module exports `register`, and
  `hooks/hooks.json` names it under `modules`. `on(event, matcher?, hook)` returns a registration that takes `.catch(handler)` at the call
  site and nowhere else (`claude plugin validate` refuses a kept value: "the value of on("tool.call") is kept …; it takes .catch(handler)
  where it is called and nothing else").
- **`next(e)`.** `types:6543` `export type Next<N …>`. It runs the plugins beneath, then core, and resolves to the event's result.
  `next({ ...e, x })` rewrites; returning without `next` answers in place. The members used here: `next.called`, `next.error`
  (`{kind:'throw'|'timeout', …}`, measured), `next.trace` (tier and plugin, measured as `[{"tier":"core","plugin":"engine"}]`),
  `next.signal` and `next.budget`.
- **Tiers.** `types:12618` `const TIERS: readonly ["prepend", "user", "append", "builtin", "core"];`. Outer means more authority: a
  user mod stands above the built-ins and above core.
- **Budget.** `types:5116` `readonly ms: 10_000;`, "A hook's budget per dispatch … past it the hook is absent (its `.catch` asked, else
  `next(e)` run on its behalf)"; `types:5124` `readonly catchMs: 1_000;`.
- **Failure default.** `types:3947`: "So a guard fails open unless its registration carries a `.catch` (Registration) that refuses in its
  place, at any event an answer refuses."
- **The classic chain.** `types:1250`: "The chain is [managed settings hooks, ...hooks modules, the other settings hooks as core], so a
  managed block ends it above every module." Project `.claude/settings.json` hooks are "the other settings hooks", which makes them
  core, beneath every mod.
- **`plugin.register`** (`types:4436`): "Fires once per hooks module about to join the chain … Return `{ refuse: reason }` and it never
  joins … Its judges, `$` whole, are the plugins admitted before it and the binary's; judge by `tier` and `uses`." Input fields:
  `name, tier, root, version?, provenance, uses` (`types:7676`).

Engine events, one line each. "Blocks" means an answer can refuse what was asked.

| Event | Fires | Reads (`e`) | Can change | Blocks |
|---|---|---|---|---|
| `tool.call` | the engine is about to run a tool | tool, `tool_use_id`, the arguments (`e.command`), `agentId` | arguments via `next`; answers `{result}` in place | yes, `{deny}`; "Managed-settings hooks' deny comes first" (`types:3957`) |
| `tool.check` | the permission decision, "after the `tool.call` and PreToolUse hooks and before the mode settles an ask" (`types:3964`) | tool, input, ceiling; `next(e)` = the engine's verdict (rule, hook) | the verdict, either way: "A hook may answer any verdict in either direction" (`types:12864`) | yes, and it can also **allow** |
| `tool.describe` | a tool schema is first rendered | the tool's description | description, `isDeferred` | no |
| `prompt.submit` | a prompt is submitted, before the turn | text, attachments, context, `turnId`, origin | text, context | yes, `{drop}`: "a broken plugin never blocks one" (`types:4104`) |
| `prompt.fill` / `prompt.suggest` / `prompt.edit` / `prompt.autocomplete` | draft box, suggestion, keystroke, typeahead | draft, splice | text, cursor, rows | keeps a fill or suggestion out |
| `prompt.section` / `prompt.compose` / `prompt.context` / `prompt.attachment` | system-prompt sections, first-message context, injected reminders | the computed text or blocks | add, replace, drop | no |
| `prompt.mention` | an `@path` is about to be read | path | path, context | yes, `{deny}` |
| `command.run` / `command.describe` | a slash command runs, or is listed | name, args | args, or answers `{text}` with no model turn | yes, by answering |
| `config.set` / `config.describe` | a `/config` row changes, or is listed | key, value | value, label | yes, `{deny}` |
| `skill.prompt` | a skill's prompt expands | skill, text | text | no |
| `attribution.text` | a commit or PR text the model is to write | kind, text | text | no |
| `agent.offer` / `agent.spawn` | an agent type is offered, or a subagent starts | type, model | model | yes, `{isOffered:false}` / `{deny}` |
| `session.start` | once per load, before the first prompt | cwd | (observe) | no |
| `session.append` | each row the conversation keeps, before it is stored | message (content blocks), door, origin, uuid, `agentId` | `content` only | no: "a row the engine appends is never refused" (`reference.md:141`) |
| `session.receive` / `session.send` | a delivery arrives, or a message leaves for another agent | text, origin, to | text, to | `{consumed}` / `{isDelivered:false}` |
| `session.compact` | before compaction | messages, instructions | both | `{skip}` |
| `session.measure` | after each main-thread turn, and when a rate window moves | context, rateLimits, cost, changed | (observe) | no |
| `session.attach` / `session.detach` | a remote surface joins or leaves | clientId, surface | (observe) | no |
| `session.end` | once at exit | reason, resume id | (observe, short bound) | no |
| `turn.start` | a model turn begins | text, `turnId` | (observe) | no |
| `turn.step` (streams) | each model request of a turn | the request; `next` = the response stream | model, effort; the chunks | an answer sends no request |
| `turn.complete` | a turn has ended | answer, durationMs, isAborted, `turnId`, usage | `{text}` shown **beneath** the answer only; "the transcript's record is never rewritten" | no |
| `ui.*` (render, resolve, press, input, select, message, fault, scroll, focus) | drawing and input on a surface | component, props, surface | the tree, the press | presses and focus only |
| `telemetry.log` / `telemetry.mark` | a record to the collector or to Anthropic | record (`to` pinned) | the record | `{deny}` rejects the caller |
| `plugin.register` | a hooks module is about to join | name, tier, root, provenance, uses | (judge) | yes, `{refuse}` |
| `engine.create` | `$` is being built, per load | plugins (the fold, managed first) | adds nouns; outside `user`, withholds | no |
| `classic.<Event>` | wherever a settings hook event runs, configured or not | the settings hook's stdin (`classic.Stop`: `last_assistant_message`, `stop_hook_active`, `types:12122`) | the classic result (`block`, `additionalContext`, …; `types:1287`) | yes, as the settings hook would (`block`, PreToolUse `deny`) |
| ops on `$` (`fs.*`, `process.run`/`spawn`, `http.fetch`, `store.*`, `state.*`, `env.*`, `model.*`, `session.*`, `ui.toast`/`status`/…) | each call a plugin makes | the call's arguments | the arguments, the value | `{deny}` rejects the call |

### 3.3 Order and permissions (measured)

Each session asked the model for exactly one call. Times are offsets within the session, from the probe's own JSONL and the
`--settings` logger (`order-settings.json` adds a `PreToolUse` logger beside the project's hooks). Full lines: `results.txt`.

**Order (s1, `git stash list`, mod in pass mode):** `tool.call:enter` +0 ms → `classic.PreToolUse:enter` +3 → settings `PreToolUse`
(the logger at +135, `bash-guard` returned `ask` at +168: "bash-guard: docs/PROTOCOL.md P13 and RC-13-bis: no git stash on a shared
tree. This form is outside the deny pattern …") → `tool.check` +180, verdict
`{"decision":"deny","reason":"Permission to use Bash with command git stash list has been denied.","rule":"Bash(git stash *)"}` →
`tool.call:exit` +184 `isError: true`. The deny list held with the probe loaded, and `permission_denials` was 1. The baseline with no
mod (s0) gives the same refusal text.

**`critical-zone` (s4):** a real `Edit` of `syncState.ts` follows the same order. The mod's `tool.call` came first, then
`classic.PreToolUse`, whose exit read `{"deny":"PreToolUse:Edit hook error: critical-zone: syncState.ts is a Layer Impact Report trigger
(CLAUDE.md 3.2, docs/PROTOCOL.md P5). critical-zone lane: relaunch this session without --dangerously-skip-permissions (RC-19)."}`. Then
`tool.check` read the verdict beneath as `"hook":"PreToolUse"`. The probe refused the Edit at `tool.check` in every case (`.catch`
refusing too), so nothing was written: `git diff` was empty. In s3, an `Edit` whose `old_string` is absent failed the tool's input
validation **before** `PreToolUse`: no `classic.PreToolUse` fired.

| Probe | Mod does | Hooks ran | Deny list consulted | Result |
|---|---|---|---|---|
| s0 | no mod | yes | yes, deny | refused |
| s1 pass | `next(e)` | yes | yes, deny | refused, denials 1 |
| s2-answer | returns `{result}` without `next` | **no** (no `classic.PreToolUse`, no logger line) | **no** (no `tool.check`) | fabricated result reached the model, denials 0 |
| s2-run | `$.process.run(['git','stash','list'])`, answers with its output | **no** | **no** | **the command ran on the host**: exit 0, 4 stash entries, denials 0 |
| s2-allow | `tool.check`: reads the `deny`, answers `{decision:'allow'}` | yes (`bash-guard` asked) | yes, then overridden | **`git stash list` ran**: the 4 entries, denials 0 |
| s5 | the same override on `git commit -m jjprobe` | `bash-guard` **denied** (no pathspec, no `Model:`) | — | **git ran**: "nothing to commit, working tree clean" (nothing was staged) |
| s3-wrapper | pass, on `sh -c 'git stash list'` | `bash-guard` `ask` | the verdict was `ask` | refused, denials 1: an `ask` under `bypassPermissions` in `-p` is a refusal |

`$.process.run` is documented without a permission step: "Runs a command on the host by its argument vector (no shell) … Git runs with
repo hooks off" (`types:3507-3512`).

**`sec-default`.** It is in the binary, and it is what public reports describe. The binary text (offset 84147845):
"Security default: seated outermost on a machine with managed settings and for Team and Enterprise organizations unless managed
prependPlugins is set, in which case the organization lists cc-plugin-sec-default@builtin there or not; keeps the organization's classic
hooks, prompt content, settings and tool policy out of reach of the plugins a person installs, and adds no policy of its own".
Its options are read from `pluginConfigs."cc-plugin-sec-default@builtin".options`, among them `allowModsToOverrideDenyRules` (the deny
rules stay protected unless it is `true`) and `allowManagedModsOnly` (offset 223040732). One refusal text: "the deny rules in your
settings could not be checked for this call, so it is refused" (offset 84146498). Its manifest says `enabledFromTrustedSettingsOnly:!0,
enabledFromPolicyOnly:!0` (offset 223043222). On this machine it is **not seated**: the fold of every probe lacks it, and
`/Library/Application Support/ClaudeCode/` does not exist ("No such file or directory"). It cannot be unloaded, because it is not
loaded, and seating it needs managed settings, a system-wide administrator change outside this lane. **The "with `sec-default`" arm was
not run.** Whether it would also protect the deny rules of a *project* `settings.json`, and the project's `PreToolUse` hooks, is an
open question (Q3).

**Throw and hang.**

| Probe | Hook | Failure | Outcome |
|---|---|---|---|
| s9-bare-control | `jjbare`, no `.catch`, denies `git log -1 --oneline` | none | refused: "jjbare: git log -1 is refused by the guard" |
| s9-bare-throw | same | throws before deciding | **ran**: `44395bf59 docs: add prompt …` (debug: "jjbare: tool.call hook skipped: threw Error …") |
| s9-bare-hang | same | never resolves | **ran** after the budget (debug: "jjbare: tool.call hook skipped: ran past its 10s budget"; session 20.3 s against 10.5 s) |
| s2-throwcatch | jjprobe, `.catch` denies | throws | **refused**: "jjprobe: guard failed, failing closed"; `next.error` `{"kind":"throw",…}` 2 ms after the throw |
| s2-hangcatch | same | hangs | **refused** at +10.006 s; `next.error` `{"kind":"timeout","budget":1000}` |
| s2-throw, s2-hang, s8-* | `.catch` that passes on | throw or hang | the chain went on to core, and the deny list refused (it sits beneath) |

So a mod fails **open** by default, at once on a throw and after 10 s on a hang. With a refusing `.catch` it fails **closed**. A
`.catch` that itself fails leaves the hook skipped, open again (`reference.md:79`, not measured).

### 3.4 Prompt-ID guard prototype

Source: `docs/discovery/harness/mods/prompt-id-guard/hooks/register.ts`. The Prompt-ID is read from the first user message: the
`Prompt-ID:` header line of the prompt file, else a `[P-…]` prefix. It is kept in `$.store` under `jjguard:<session id>`, so a
`claude -p --resume`, which is a new process with its module variables gone, still knows it. Measured: run 2 of g1 and runs 2 and 3
of g2 compared against the stored ID. `JJGUARD_MODE=refuse|warn`.

| Check | Possible | Event | On failure (refuse mode) | Measured |
|---|---|---|---|---|
| 1. Read the ID from the first message | yes | `prompt.submit` (+ `$.store`) | — (a first message with no ID is only recorded; `lane-run start` already refuses that) | g1, g2, g3: `first-message-id ok` |
| 2. A later message without the `[P-…]` prefix, or with another one, is not executed (P13) | yes | `prompt.submit` → `{drop}`, with `.catch` dropping too | **block**: the prompt never enters | g2 run 2 (`[P-2099-01-01-0002]`) and run 3 (no prefix): result `"Prompt dropped by a hook: jjguard (P13): this session runs P-2099-01-01-0001; a message with P-2099-01-01-0002 is not executed."`, `num_turns 0`, exit 0 |
| 3. Each reply opens with `[<ID> · session <id>]` | flag, or rewrite | `session.append {door:'response'}` (first text block of each response row) and `classic.Stop` (the final message) | **flag**: the row cannot be refused ("a row the engine appends is never refused"); a rewrite of `content` could prepend the prefix, which forges compliance instead of checking it; at the stop it joins check 4's block | g3: `reply-prefix ok:false` on "pong" |
| 4. The final message ends with `Outcome: done\|hard-stop\|question\|blocked` | yes | `classic.Stop` → `{block}` while `stop_hook_active` is false | **block once**: the model is sent back; the second failure is recorded, not blocked again, so the stop cannot loop | g3: blocked "pong", the model continued (`num_turns 2`) and wrote the prefix and `Outcome: done`, then added a sentence after it, so the second check failed and was recorded with `stopHookActive:true` |

The three scripted sessions (`guard-msgs/`, `guard-run.sh`):
- **g1, matching ID**: 6 verdicts, all `ok:true`; both replies read `[P-2099-01-01-0001 · session a7f3] … Outcome: done`.
- **g2, wrong ID, then no prefix**: run 1 `ok`; runs 2 and 3 dropped, as above.
- **g3, missing Outcome line**: `final-message ok:false` (`prefixOk:false, outcomeOk:false, last:"pong"`) → blocked → a retry that
  still failed (text after the `Outcome:` line) → recorded.

Notes. The model does not know its session id ("I don't have the session id in my context, so I wrote `session unknown`"). The check
therefore takes any token after `session`, and a strict check would need the id in the prompt. The guard's log was first kept in
memory and rewritten per process, which lost earlier verdicts across `--resume`. It now reads the file back before it writes; g1 and
g2 were rerun with that fix, and g3, a single process, was not affected. A dropped prompt leaves no `Outcome:` line, so
`lane-run status` would read `unparsed`, and its refusal text is the only trace.

### 3.5 Telemetry

Yes, in two forms, both measured (s1, `results.txt`):
- `turn.complete` carries `usage` (`types:13323` `usage?: TurnUsage;`):
  `{"input_tokens":4,"output_tokens":1155,"cache_read_input_tokens":57887,"cache_creation_input_tokens":37605,"model":"claude-haiku-5-5"}`,
  with `durationMs` and `turnId`.
- `session.measure` fires after each main-thread turn:
  `{"context":{"tokens":47295,"window":1000000,"percent":5},"changed":["context","rateLimits","cost"],"cost":{"usd":0.00785…}}`.
  `$.session.usage({ breakdown })` adds the `/context` breakdown by category (`types:10958-10983`; read, not run).

What it would give the CAIN dataset: per-turn tokens, cache split, context fill and cost, keyed by `turnId` and session, and so by
Prompt-ID, written by the session itself instead of reconstructed from transcripts. No export was built.

### 3.6 Mapping

| Harness piece | Verdict | Reason in RC-15 terms |
|---|---|---|
| deny list (`permissions.deny`) | **stays** | It holds honestly against the model: it fails closed and sees the literal form (s0, s1). It does not hold against a loaded mod (s2-allow), and nothing a mod adds would hold against another mod. The defence is control over what loads a mod (R1), not a second copy of the list. |
| `bash-guard` (`PreToolUse` Bash) | **stays**; a mod is a candidate later | It runs inside the mod chain, as core beneath every mod (`types:1250`, s1). A mod version would gain `.catch` (fail closed instead of open) and `$.fs.stat` realPath for the H6 wrapper gap. It would hold only in sessions that load the mod, which today means none. |
| `critical-zone` (`PreToolUse` Edit/Write) | **stays** | Same chain, same order (s4). Its `bypassPermissions` deny is measured and holds. A mod adds nothing until lanes load one. |
| skills `log-entry`, `discovery-report`, `status-flip` | **stay** | They give the artifact its form by reading clauses live. A `skill.prompt` hook could do the same, but holds no more honestly. Not a control, in either carrier. |
| planned `Stop` hook (Prompt-ID, `Outcome:`) | **moves to a mod** (or both) | A settings `Stop` hook covers checks 3 and 4 only. The mod covers 1 to 4 (3.4): the P13 refusal is a real block at `prompt.submit`, the `Outcome:` check a one-retry block at `classic.Stop`, and the session's ID survives `--resume` in `$.store`. It fails open by default and closed with `.catch` on checks 1 and 2. Condition: `lane-run` must pass `--plugin-dir <repo mod>`, an edit to its source (NON FARE here). |
| `/lane` command (`.claude/commands/lane.md`) | **both** | A mod command (`$.command.register` + `command.run` answering `{text}`) answers in place (`types:4246`, its doc: "return `{ text }` without it to answer in its place"), running `lane-run status` through `$.process.run`; the article in the prompt's context says such a command needs no model turn, against one model turn per call today (not measured here). It reads only: the failure mode is a missing line, not a missed guard. |

## 4. Dependencies and risks

- **R1, a mod is above the harness.** Measured: a loaded mod overrides the deny list (s2-allow), overrides a `bash-guard` deny (s5),
  skips both hooks and the deny list by answering (s2-answer), and runs host commands that no permission layer sees (s2-run). These are
  the ways a mod gets into a lane session: `--plugin-dir` (not passed), `CLAUDE_CODE_PLUGIN_DIRS` in the chat's environment or in
  `~/.claude/settings.json` `env` (absent today), an installed plugin with a hooks module (none today), and, interactively, a skills
  folder (docs; not loaded under `-p`, s7). A lane in `bypassPermissions` can write `~/.claude/settings.json` or `~/.claude/plugins/`.
  No deny rule or hook covers those paths today, so one lane could arm a mod for every later session. The deny list and the hooks
  "fail closed" or "fail open" only toward the model; toward a mod they do not apply at all.
- **R2, `sec-default` absent.** The protection the public reports rely on is seated only with managed settings or a Team or Enterprise
  organization. This machine has neither.
- **R3, the API moves.** "EARLY ACCESS: this surface may change between releases without notice" (types header). One case found:
  the 2.1.292 declarations lack the `tool.check` sentence "after the `tool.call` and PreToolUse hooks" that 2.1.296 has (`types:3964`).
  A repo-held mod pins nothing, and the VS Code engine trails the CLI by four releases.
- **R4, fail-open default.** It is the same mode as the RC-15 hooks, but silent in `-p`: the skip goes to the debug log only (s9).
  Every gating hook needs a refusing `.catch` to fail closed. `claude plugin validate` lists each "gating hook without .catch".
- **R5, side observations.** (a) An `ask` under `bypassPermissions` in `-p` is a refusal (s3-wrapper, denials 1). That is a measure of
  the open point in RC-19, for `-p` only. (b) `bash-guard`'s `ask` on the literal `git stash list` says the form "is outside the deny
  pattern of .claude/settings.json", yet the deny rule `Bash(git stash *)` matched that same call (s1): the message is inaccurate
  there, and the outcome is right.

## 5. Open questions

1. **Carrier for the Prompt-ID checks.** Should the planned `Stop` hook become a repo-held mod loaded by `lane-run --plugin-dir`?
   Recommended: yes for checks 1, 2 and 4, as a Phase 2 lane that edits `lane-run.mjs` and adds the mod under `frontend/scripts/`. Check 3
   stays a flag recorded for the chat.
2. **Guard against mods.** Should writes to `~/.claude/settings.json`, `~/.claude/plugins/` and `.claude/skills/*/.claude-plugin/` be
   refused, and should a lane refuse to start when the fold holds a module the harness did not name? Recommended: yes. `lane-run start`
   checks `CLAUDE_CODE_PLUGIN_DIRS` and the installed hooks modules before launching, and a `bash-guard` or deny row covers those paths
   (a decision row first, P15).
3. **`sec-default` on this machine.** Would seating it (managed `prependPlugins`, or a managed settings file) protect *project* deny
   rules and hooks against a user mod? Recommended: measure it in a lane Alfonso authorises, because it is a system-wide change.
4. **Telemetry for CAIN.** Should a mod write per-turn `usage` and `session.measure` to the lane folder? Recommended: only after
   question 1, inside the same mod, with no export of its own.

## 6. What this lane did not do

It did not touch `.claude/`, `frontend/scripts/hooks/`, `lane-run.mjs`, `CLAUDE.md`, `PROTOCOL.md` or `decisions.md`. It installed no
plugin or mod, made no push, and ran no probe on `~/jjodel` or `~/jjodel-release`. `git stash list`, and in s3 its `sh -c` wrapper, was the only
stash form requested. It executed, read-only, only in s2-allow and s2-run, through the mod: that execution is the measurement. Everywhere
else it was refused.

## 7. Probe material (`docs/discovery/harness/mods/`)

- `probe/`: the measuring mod `jjprobe` (`JJPROBE_MODE` = pass, answer, run, allow, throw, throwcatch, hang, hangcatch, throwbare,
  hangbare, czcheck), with a safety net that refuses every file tool except the probe Edit.
- `bare-guard/`: `jjbare`, a guard with no `.catch` (s9).
- `prompt-id-guard/`: the prototype `jjguard` (3.4).
- `run.sh` (one probe session with lane-run's flags), `guard-run.sh` (start plus resumes), `order-settings.json` (the `--settings`
  `PreToolUse` and `Stop` logger), `summarize.mjs`, `guard-msgs/` (the scripted messages; their IDs `P-2099-…` are fake and live outside
  `docs/prompts/`, which is the only folder the prompt scanners read).
- `results.txt`: every session's ordered events, tool results and verdicts (s0 to s9, g1 to g3).
