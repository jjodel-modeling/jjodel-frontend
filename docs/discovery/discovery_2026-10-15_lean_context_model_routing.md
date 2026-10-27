# Discovery 2026-10-15: lean context and model routing (Sonnet / Opus / Haiku), Phase 1

- Prompt-ID: P-2026-10-15-1725 · prompt `docs/prompts/claude_2026-10-15_1725_prompt_lean_context_model_routing.md`
- Session: `a8509849-473e-4240-96e1-2af54e7def41` · tree `~/jjodel-release`, branch `alfonso-frontend-jjtl`, HEAD `d37ce9a09`
- Executor: Opus 5.5 (`claude-opus-5-5`, init event of the lane log), effort `xhigh` (`CLAUDE_EFFORT=xhigh` in the session environment, from `.claude/settings.json:4`); `lane-run` tier line: `heavy (settings pin): --tier heavy`, draw line `not eligible: the rule forces heavy (Lane: full)`
- Dirty tree at start: `M CLAUDE.md` (13 insertions, 3 deletions, §0 effort bullets and a new §0.1 "Output discipline"). Not this lane's. Phase 2 would modify `CLAUDE.md`, so it collides with it (question 1).
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

Tags: **measured** = run in this phase on the state named; **read** = read in a file by this session; **read (agent)** = reported with `file:line` by one of the two read-only `explorer` subagents of this session and not re-read by me.

## 0. Answer in brief

1. **The baseline (measured, 20 closed lanes from 2026-10-11 17:46 to 2026-10-15 17:37, all on Opus 5.5).** Total input context D was 452.5M tokens: 98.15% cache read, 1.85% cache write, 4,954 uncached. Output was 2.65M tokens, 1.27M of them thinking. The list-price estimate is $197.47, median $7.85 per lane.
   - Cache reads are 45% of that cost, cache writes 29%, output 27%.
   - Plan consumption per lane: not measured. Seven-day utilization rose from 0.77 to 1.0 inside the window, and the latest readings are `status: rejected` with `isUsingOverage: true`.
2. **The three largest consumers, as shares of D:**
   - Tool output that stays in the main session's context and is re-read on every later call: 35.7%. This is estimated at a calibrated 2.16 chars/token; at the declared chars/4 it is 19.3%.
   - Subagent contexts: 25.3%, measured. 19 of 20 subagent runs were the built-in `Explore` and `general-purpose` agents, and they ran on Opus.
   - Re-reads of the initial context: 19.4%, measured. The median first call is 48,232 tokens. About 25.1k of that is the Claude Code base, which loads even in an empty directory (probe), and about 18.6k is project context, mostly the root `CLAUDE.md`.
3. **The root `CLAUDE.md` costs about 17k tokens per call (estimated), not the ~11k that chars/4 suggests.** Three calibrations agree on roughly 1.8 to 2.6 chars/token for this tokenizer.
   - Slimming it to the target saves about 5 to 7% of D and about 2 to 3% of list cost.
   - That is useful, but the bigger levers are tool output, subagents and output tokens.
4. **The 2026-10-13 token-economy lane is half applied.**
   - Committed: `output-budget.mjs`, its tests, `run-quiet.mjs` and the `explorer` agent.
   - Never done: the hook is not registered in `.claude/settings.json`, so it denies nothing. The runner has no allow entry. `effortLevel` is still `xhigh`. The CLAUDE.md §0/§0.1 text is uncommitted. No log entry exists.
5. **Runtime (measured, three probes, Claude Code 2.1.300, provider firstParty, OAuth with no API key).**
   - All three IDs are served as requested: `claude-haiku-5-5`, `claude-sonnet-5-5` and `claude-opus-5-5`.
   - `claude -p --resume <id> --model <other>` switches the model inside the same session id, with the history carried. Escalation therefore needs no new session.
   - In a result event, `modelUsage` and `total_cost_usd` are cumulative over a session's resumes, while `usage` covers one invocation.
6. **Model effect on cost is bounded.** Opus 5.5 and Sonnet 5.5 have the same cache-read price ($0.20/MTok), and cache reads dominate.
   - At equal behaviour, a Sonnet lane would cost 12 to 28% less, depending on the tokenizer factor. On one prompt I measured Sonnet counting 1.21x the tokens of Opus.
   - Behaviour (calls, rework) will dominate that figure, so it must be measured, not claimed.
7. **Recommended architecture (detail in §2):**
   - The root keeps the 28 rules verbatim plus a trigger index.
   - Specialist rules move to nested `CLAUDE.md` files (a new `frontend/src/CLAUDE.md`) and to their canonical PROTOCOL clauses. They are loaded by three mechanical triggers: nested files on Read, a deny-once hook on the first Edit or Write under a mapped path, and `lane-run` injecting the rules for the DOVE paths.
   - Decisions and the log are read by ID, file, front or Prompt-ID through two read-only CLIs, never as "the last N".
   - Routing extends `tierRule`. The heavy/light contract stays, with effort and requested/effective model recorded in `runs.jsonl`. Escalation is a single `lane-run escalate`, at most once per lane, never on RC-45 drawn lanes. Haiku formats the log entry from structured evidence behind `check:docs`.
8. **Awaiting Alfonso (RC-26):** the routing policy, effort per tier and subagent model; the amendments AM-1 to AM-7 of §4; the Phase 2 file list of §5; the benchmark budget.

Recommended: approve the plan and the §5 file list. First close the 2026-10-13 leftovers in an interactive lane that corrects P-2026-10-13-1930, then run batches B1 to B7 in order, with AM-1 to AM-7 as written.

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | Most of the cost of a lane is the initial instruction context (CLAUDE.md and the mandatory docs) | **Falsified, partly.** The initial context is 19.4% of D. Tool output (35.7% est.) and subagents (25.3%) are larger | §3.3 |
| H2 | The 2026-10-13 optimisations are in force | **Falsified.** Hook unregistered, effort unchanged | §2.6 |
| H3 | `lane-run` can change model on `resume` without a new session | **Holds (measured).** Probe 2 | §4.2 |
| H4 | The three 5.5 IDs are usable from this runtime | **Holds (measured).** Three probes | §4.1 |
| H5 | Switching ordinary lanes from Opus to Sonnet halves the cost | **Falsified as stated.** Same cache-read price; estimated −12 to −28% at equal behaviour | §3.5 |
| H6 | A third tier value can be added without breaking consumers | **Falsified.** The `lane-run` ledger and the Insights tab hard-code `heavy\|light` | §2.7 |
| H7 | RC-46/RC-47 (repo mod, per-turn usage) already record usage | **Falsified.** Not implemented on this branch | §2.5 |

## 2. Current behaviour

### 2.1 What enters the context automatically

All measured on the lanes' init events and the probes.

- **The Claude Code base**, loaded even in an empty directory: system prompt, tools, user-level skills, plugins and MCP instructions.
  - Probe 3 (Opus, `/tmp`, no CLAUDE.md) shows a first-call context of 25,125 tokens.
  - The lane's own init event lists 103 tools, 68 skills (most of them unrelated to Jjodel: `osint-investigator:*`, `legal:*`, social-media skills), 15 MCP servers (plugin ones mostly `needs-auth`), 7 plugins and 9 agents.
  - `lane-run` passes `--strict-mcp-config` only to automatic lanes: `frontend/scripts/lane-run.mjs:322` reads `const AUTO_FLAGS = ['--disallowedTools', 'WebFetch,WebSearch', '--strict-mcp-config'];`.
- **The root `CLAUDE.md`:**
  - 43,665 bytes, 42,969 chars in the working copy; HEAD holds 42,040 bytes.
  - Estimated at 10.7k tokens (chars/4) or about 17k tokens (calibrated, §3.2). The section sizes are in §5.1 below.
- **Nested `CLAUDE.md`** load on demand when a file in their subtree is read. The eight files total 26,986 bytes: model 9,686; editor-v2 5,255; jjtl 4,900; styles 3,052; redux 1,942; export 812; jjscript 741; jjel 632 (read (agent)). `AGENTS.md` files are generated copies and are not loaded by Claude Code.
- **The lane prompt**, through stdin. A regression over 114 Opus lanes since 2026-10-04 gives the first-call context ≈ 43,755 + 0.557 × prompt chars, with a residual sd of 2,011 tokens (measured).
- **The project-specific delta** is the lane intercept minus the empty-directory probe: 43,755 − 25,125 = 18,630 tokens. That is CLAUDE.md plus project skills, agent and memory listings and the git-status block (measured, same model).

### 2.2 Documents read by obligation at session start

Each obligation is read verbatim:
- `CLAUDE.md:59`: "16. Read docs/claude-code-log.md (last 5–10 entries) at session", and `:62`: "Read docs/decisions.md too: the active operational constraints,".
- `docs/PROTOCOL.md:20` (P1): "Leggi `CLAUDE.md` nella root all'inizio di ogni sessione e i `CLAUDE.md` di sottocartella pertinenti ai file che tocchi."
- `docs/PROTOCOL.md:105` (P9): "Leggi il log a inizio sessione per il contesto sulle modifiche recenti."
- `docs/decisions.md:4`: "Claude Code legge questo file a inizio sessione, come CLAUDE.md."

Sizes:
- `docs/decisions.md` is 643,253 bytes, 6,089 lines and 467 `- **` rows. That is about 160k tokens at chars/4, so nobody can comply literally (measured).
- `docs/claude-code-log.md` is 69,923 bytes over 40 entries; the 10 newest total 15,939 bytes (read (agent)).
- `docs/log-inbox/` holds 50 files, 645,501 bytes and 366 entries (read (agent)).

What the sampled lanes actually read, in the main sessions (measured, tool-result chars):

| Document | Calls | Lanes (of 20) | Result chars |
|---|---|---|---|
| `docs/PROTOCOL.md` | 35 | 16 | 310,680 |
| `docs/log-inbox/*` | 99 | 20 | 260,985 |
| `docs/decisions.md` | 82 | 18 | 159,133 |
| `docs/claude-code-log.md` | 3 | 3 | 46,861 |
| `docs/HARNESS-DOCS.md` | 5 | 2 | 37,277 |
| `CLAUDE.md` (explicit reads) | 39 | 18 | 33,065 |

Together that is about 848k chars, 16% of all main-session tool output. The obligation is met by grepping and partial reads, whose size the rule does not bound.

### 2.3 How `lane-run` picks the model

All read:
- **Heavy** passes no `--model` and runs the pin: `.claude/settings.json:3` is `"model": "claude-opus-5-5",`.
- **Light**: `frontend/scripts/lane-run.mjs:306` is `const LIGHT_MODEL = 'claude-sonnet-5-5';`. It can be overridden by `LANE_RUN_LIGHT_MODEL` (`:629-633`).
- **The rule** is `tierRule` at `:607-627`. Heavy is forced by the go-ahead, a merge, the governance go-ahead, a critical name in the header or DOVE, a governance file in DOVE, `Lane: full`, or a discovery writing outside `docs/`. Light is given only by `(lane === 'fast' || lane === 'discovery') && docsOnly` (`:622`). Everything else is heavy "in doubt" (`:623-626`).
- **Overrides:** `--tier heavy|light` (`:636-651`; light is refused where the rule forces heavy), and the RC-45 draw (`:659-860`, `--no-draw "<reason>"`).
- **Start** launches with `...(tier.model ? ['--model', tier.model] : [])` (`:915`).
- **Resume** launches with `['-p', '--resume', session, ...FLAGS, ...(autoRun ? AUTO_FLAGS : [])]` (`:990`): no `--model`. Its comment at `:272-273` reads "A resume passes no --model: the session keeps its own".
- **Effort:** no `--effort` anywhere in `lane-run` (read (agent), grep exit 1). Every lane runs `effortLevel` from `.claude/settings.json:4`, which is `"effortLevel": "xhigh",`, Sonnet lanes included.

The RC-45 state (measured, `~/.jjodel-lanes/rc45-draws.jsonl`, not touched): 2 draws in 5 days, both light: P-2026-10-10-1756 (by hand, n=1) and P-2026-10-10-2027 (by lane-run, n=2). The window is open until 40 draws or 2026-11-08. At that rate the experiment will not reach 40; it is starved because most lanes are `Lane: full` or docs-only.

### 2.4 How model, effort and usage are recorded

- **`tier.txt`**, one line per lane. The real model is written only for light; heavy says `settings pin` (`lane-run.mjs:649`, read).
- **`log.jsonl`**, stream-json (measured on the logs):
  - The `system/init` event carries `model`, `claude_code_version`, `apiKeySource` (`none`) and `permissionMode`.
  - Each `assistant` event carries `message.usage`.
  - A `result` event carries `usage` for one invocation, plus `modelUsage` per model and `total_cost_usd`, both cumulative per session, and `subagent_stats`.
  - A `rate_limit_event` carries the plan windows.
- **Readers:**
  - `lane-board.mjs` `logFacts` (`:625-647`) takes the first init model and the maximum `total_cost_usd`.
  - `trace-index.ts:397-403` keeps the last init model and the last cost.
  - `auto-intake.mjs:660-777` turns `rate_limit_event` into plan readings and sums `modelUsage` (read (agent)).
- **Effort** is recorded nowhere per lane (read (agent)).
- **The `Model:` trailer** is free text: `bash-guard.mjs:223` tests `/^Model: \S/m` (read (agent)).

### 2.5 Mechanisms that govern scope, critical zone, commits and output

From `.claude/settings.json:19-36` and `:38-61` (read) and the agent reports:

| Concern | Mechanism | Fails |
|---|---|---|
| Whole-tree git, stash, `--no-verify`, `rm -rf`, `.env` reads | deny list `settings.json:19-36` | closed |
| Commit pathspec, `Model:` trailer, subject ≤72, docs/code split, push deny under bypass | hook `bash-guard.mjs` (registered `:41-48`) | open |
| Critical-zone files, D-layer creators, `SetFieldAction` in `sync/` | hook `critical-zone.mjs` (registered `:50-58`); deny under bypass unless `JJODEL_CRITICAL_ZONE_GOAHEAD` | open |
| Output budget | `output-budget.mjs` exists, **not registered** (`grep -c output-budget .claude/settings.json` = 0, read (agent); my own unbounded `cat` of `~/.claude/settings.json` passed in this session) | — |
| Log entry format | skill `log-entry` (awk-injects CLAUDE.md §21.2 live) + `check:docs` | gate |
| Discovery report shape | skill `discovery-report` (injects P4 live) + `lane-run status` brief warning | gate partial |
| AGENTS.md | `gen:agents` / `check:agents` | gate |
| Tier / heavy-when-in-doubt | `tierRule` in `lane-run.mjs` | closed (refuses) |
| Automatic lanes outside critical zone | RC-36 post-session diff guard in `lane-run` | closed |
| Scope (Rule 1), preservation, "discovery before action", Corregge/Causa honesty | prose only | — |
| RC-46/RC-47 mod (Prompt-ID block, `Outcome:` block, per-turn usage) | **not implemented**: `command grep -rl` for `plugin-dir\|CLAUDE_CODE_PLUGIN_DIRS\|session.measure\|prompt.submit` exit 1 with positive control `RC-47` in decisions exit 0 (read (agent)); only prototypes under `docs/discovery/harness/mods/` | — |

### 2.6 What the 2026-10-13 token-economy prompt actually delivered

Read:
- **Committed in `a7ab0a663`:** `.claude/agents/explorer.md` (19 lines, `model: sonnet`), `output-budget.mjs` (550 lines), its test (310 lines), `run-quiet.mjs` and the `.gitignore` line.
- **Not done:**
  - The hook registration that the prompt required. Its line 16: "registered in `.claude/settings.json` as a second Bash PreToolUse entry".
  - The runner `allow` entry.
  - `effortLevel: high`; it is still `xhigh` at `settings.json:4`.
  - The CLAUDE.md §0/§0.1 text, which is uncommitted in the working tree. Working-copy `CLAUDE.md:108` claims "The hook `frontend/scripts/hooks/output-budget.mjs` denies the unbounded forms", which is false today.
  - `gen:agents`; `check:agents` would be red on the working copy (read (agent)).
  - A log entry: no `P-2026-10-13-1930` in `docs/claude-code-log.md` or `docs/log-inbox/` (grep, no hits; the same grep finds other IDs).
- The Status line still reads `Status: da eseguire` (prompt file `:5`).

### 2.7 Consumers of the heavy/light interface

All read (agent):
- **`lane-run.mjs`:**
  - `TIERS = ['heavy','light']` (`:307`) also validates the ledger: `:684` refuses any row whose tier is not in `TIERS`. A row with a third value would block every later `start`.
  - The Lane-line regex is `(heavy|light)` (`:713`). Merges accept `--tier heavy` only (`:1690`).
  - Chain state re-passes `--tier` (`:2345-2422`).
- **`lane-board.mjs`:**
  - The row tier takes the first token of `tier.txt` (`:468`: `split(/[\s:]/)[0]`), which is tolerant.
  - Insights is strict: `:1064` `/^(heavy|light)\b/`, `:1067`, and a ledger filter at `:1054`. A third value silently drops the lane from the drawn view.
  - `insights.js:251` counts only heavy/light.
- **`trace-index.ts:776`** treats `tier.txt` as an opaque string.
- **Tests:**
  - `laneRun.test.ts`: 98 lines with heavy/light, 55 `expect` lines, 20 of 121 test titles.
  - `laneRunDirect.test.ts`: chain `['light','heavy']`.
  - `autoIntake.test.ts`: 6 hits.
  - `laneBoard.test.ts:602`: a fixture in the old format.
- Not consumers: `auto-intake.mjs`, `lane-tracking.mjs` and `.claude/commands/lane.md`.

Consequence: keep `tier ∈ {heavy, light}` and add new facts as new fields or files. Do not add tier values.

## 3. Baseline

### 3.1 Sample and method

All measured. Scripts are in `/tmp/lean1725/` and are not in the repo; their logic is proposed as B1.

- **Sample:** the last 20 lanes whose folder in `~/.jjodel-lanes/` holds `exit.txt` and a `log.jsonl` with at least one `result` event. They are sorted by `exit.txt` mtime, and this lane is excluded.
  - Four direct merges without a session were excluded (P-2026-10-11-2328, -2111, -1903, -1846).
  - 179 lanes with sessions closed in the 14 days before 2026-10-15 19:00, which is at least 20, so the rule "last 20" applies.
  - Period: exit times from 2026-10-11 17:46 to 2026-10-15 17:37.
  - 26 sessions/invocations (P-2026-10-11-2230 has 6, P-2026-10-11-1716 has 2).
- **Composition:**
  - All 20 are heavy on Opus 5.5: `Lane: full` 17, "in doubt: Lane: fast, no DOVE" 2, critical-zone go-ahead 1. No light lane is in the sample.
  - Over all lane folders, `tier.txt` says heavy 225, light 28; over the last 14 days, heavy 160, light 19.
- **Method:**
  - Per session, the last `result` event's `modelUsage` gives tokens and `costUSD` (the `list` basis). It is cumulative per session, which probe 2 proves.
  - Per call, `assistant` events are deduplicated by `message.id`. Main session versus subagents is decided by `parent_tool_use_id`.
  - Tool output is the text length of `tool_result` blocks.
- **Consistency check:** the sum of per-call contexts, main (338.2M) plus subagents (114.7M), equals D (452.5M) to the token, so the categories partition D.
- **Missing data:**
  - Plan consumption per lane is not measured: `rate_limit_event` gives window utilization only, and lanes overlap.
  - Effort is not recorded.
  - Reasoning tokens are available as `thinkingTokens`.
  - Tool output reaching subagents is counted, but not attributed by residency.

### 3.2 chars/token calibration

There is no local tokenizer and no `count_tokens`: no `ANTHROPIC_API_KEY`, and `apiKeySource: none`. Three estimates, all measured:

| Method | chars/token |
|---|---|
| (a) Context delta between consecutive main calls separated by exactly one tool result ≥ 8,000 chars, minus the previous output | median 2.16, IQR 1.97 to 2.38, n=127 pairs |
| (b) Regression of first-call context on prompt chars, 114 Opus lanes | 1.80 (slope 0.557 tok/char) |
| (c) Project-specific delta (18,630 tokens) against the root CLAUDE.md alone (42,969 chars) | ≥ 2.31 (the delta includes the other project listings) |

The declared chars/4 under-counts tokens by a factor of about 1.6 to 2.2 on this content. Figures below give both where it matters.

Tokenizer differs by model (measured, probes 1 to 3, the same content in an empty directory): first-call context was Opus 25,125 tokens, Sonnet 30,517 and Haiku 30,207. On this one prompt, Sonnet counts 1.21x Opus.

### 3.3 Where D goes

| Category | Tokens | Share of D | Method |
|---|---|---|---|
| A. Initial-context re-reads, main sessions (first-call context × calls) | 87.7M | 19.4% | measured |
| B. Tool-output residency, main sessions (chars of each result × later calls ÷ ratio) | 161.5M | 35.7% (19.3% at chars/4) | estimated |
| C. Subagent contexts | 114.7M | 25.3% | measured |
| R. Remainder of main context (assistant text, tool_use, thinking re-read, user turns, reminders) | ≈ 89M | ≈ 19.7% | residual = main − A − B |
| Total D = uncached + cache read + cache write | 452.5M | 100% | measured |

- **D split:** uncached 4,954 (0.00%); cache read 444.2M (98.15%); cache write 8.38M (1.85%).
- **Output:** 2.65M tokens, of which thinking 1.27M. Output is not part of D.
- **Inside A:** the median first call is 48,232 tokens (min 44,661, max 55,260).
  - About 25.1k is the Claude Code base.
  - About 18.6k is project-specific; the root CLAUDE.md is the bulk.
  - About 4.4k is the prompt.
  - Resumed sessions restart at 70,937 to 248,094 tokens: the whole conversation is re-written to cache once the TTL has expired.
- **Inside B:**
  - Main tool output totals 5.41M chars; subagents add 3.96M.
  - By tool (calls in parentheses): Read 2.80M (198), Bash compound `cd …` 1.98M (754), `git` 1.33M (445), `sed` 0.95M (205), `cat` 0.41M (105), `command …` 0.31M (149).
  - Mandatory-doc reads (§2.2) are about 0.85M of the total.
- **Inside C:**
  - 20 subagent runs: `general-purpose` 11, `Explore` 8, `explorer` 1. Subagent assistant events were Opus 1,557 and Sonnet 94.
  - One lane (P-2026-10-11-1812) made 323 subagent calls.
- **Calls:** 1,712 main and 767 subagent; median 86 main calls per lane; 1,914 turns.
- **Errors and rework signals:** 0 retries, 1 API error, 0 compactions, 8 permission denials.

**The three largest consumers** (denominator D for all three):
1. Tool-output residency: 35.7% (estimated; 19.3% at chars/4).
2. Subagent contexts: 25.3% (measured).
3. Initial-context re-reads: 19.4% (measured).

R (≈19.7%) is of the same size, but it is a residual and depends on B's estimate.

### 3.4 Cost, outcomes and rework

Cost (measured, list basis):
- $197.47 in total: Opus $196.35, Sonnet $1.12 (the one `explorer` run). Median $7.85 per lane.
- Top three lanes: P-2026-10-11-1725 $32.15, P-2026-10-11-1812 $24.69, P-2026-10-12-0010 $13.11.
- Split for Opus at $4 / $20 / $0.20 cache read: cache read $87.9 (45%), output $52.4 (27%), cache write about $56.0 (29%). The write figure is the remainder, so its implied average of $6.8/MTok mixes the 5-minute ($5) and 1-hour ($8) TTLs.

Plan consumption: «not measured» per lane.
- Inside the window, the seven-day utilization read by the lanes went from 0.77 (oldest lane) to 1.0 (newest).
- The newest readings are `status: rejected`, `rateLimitType: seven_day`, `isUsingOverage: true`.
- So the latest lanes ran on overage.

Outcomes (measured):
- Final `Outcome:` lines: hard-stop 19, missing 1 (P-2026-10-14-1955).
- Log entries were found for 11 of the 20 lanes. The others are Phase 1 discoveries whose entry comes with Phase 2, or are not yet written.
- Of those 11: ✅ 9 and ⚠️ 2 (P-2026-10-12-0116 `(a)`, P-2026-10-12-0012 `(c)`). `Regressions`: no 10, unknown 1.
- `Corregge` is filled in 2: P-2026-10-11-2230 corrects 2026-10-11 15:10, and P-2026-10-11-2025 corrects 2026-10-05 17:25.
- None of the 20 has yet been corrected by a later entry; the window is short, at 4 days.
- Escalations: 0, since no mechanism exists. Gate outcomes: only as prose inside `Regressions`/`Notes`, so they are not counted.

### 3.5 What the model choice can and cannot buy

Estimate, list prices from the `claude-api` reference cached 2026-10-06:

| Model | Input | Output | Cache read |
|---|---|---|---|
| Opus 5.5 | $4 | $20 | $0.20 |
| Sonnet 5.5 | $2 | $10 | $0.20 |
| Haiku 5.5 | $0.10 (≤100K prompt; $0.50 above) | $0.50 ($2.50 above) | — |

Cache writes are 1.25x input (5-minute TTL) or 2x (1-hour). The Haiku cache-read rate is not in the excerpt read.

Re-pricing the sample's token profile on Sonnet at equal behaviour gives $142 to $172 against $196, that is −28% to −12%, depending on whether the 1.21x tokenizer factor holds. The model effect is bounded because the largest line, cache reads, costs the same on both.

## 4. Models and runtime

### 4.1 Version, provider, IDs

All measured:
- `claude --version` is `2.1.300 (Claude Code)`. The init events show `apiKeySource: none` (OAuth subscription), and `modelUsage` shows `provider: firstParty`.
- Three probes, each the prompt "Reply with exactly one word: pong", run from the empty `/tmp/lean1725/probe`:

| # | Command | init model | served by | reply | context | cost |
|---|---|---|---|---|---|---|
| 1 | `--model claude-haiku-5-5` | claude-haiku-5-5 | claude-haiku-5-5 | pong | 30,207 | $0.0039 |
| 2 | `--resume b33ece0e… --model claude-sonnet-5-5` | claude-sonnet-5-5 (same session id) | claude-sonnet-5-5 | pong | 30,517 | $0.0788 (session cumulative $0.0828) |
| 3 | `--model claude-opus-5-5 --no-session-persistence` | claude-opus-5-5 | claude-opus-5-5 | pong | 25,125 | $0.1185 |

Three calls in total, within the budget. No alias was used as proof; the full ID appears in the init event and in `modelUsage`. Nothing was substituted.

Official documentation (read): the `claude-api` reference lists `claude-opus-5-5`, `claude-sonnet-5-5` and `claude-haiku-5-5`. Haiku 5.5 supports effort from `low` to `max` with default `medium`, and adaptive thinking. `claude --help` documents `--model`, `--effort <level>`, `--fallback-model`, `--resume`, `--fork-session`, `--strict-mcp-config` and `--max-budget-usd`.

### 4.2 Model change on resume

Measured. `--resume <id> --model <other>` works: probe 2 kept session `b33ece0e-88c1-4032-a47a-c78bc495e354` and its history, and switched to Sonnet. Escalation can therefore resume the same lane session with `--model claude-opus-5-5`.

Costs and limits:
- **Cache is per model.** The first Opus call re-writes the whole context, for example about $0.75 at 150k tokens (1.25x $4). This is read from the reference and not measured on a lane.
- **Thinking is tied to the model.** Sonnet thinking blocks are dropped by Opus, per the reference, and not measured.
- **Not covered by the probe.** Probe 2 had no thinking or tool-use history, so Phase 2 must re-test on a session with both (T-R4).
- **Fallback if that test fails:** a checkpoint file (§6.4).

## 5. Implementation plan

### 5.1 Proposed architecture (minimal)

**A. Lean root `CLAUDE.md`, about 9 to 10.5k chars.** That is 2.3 to 2.6k tokens at chars/4, or about 4.2 to 4.8k calibrated. The calibrated 1.5 to 2.5k target cannot be met without dropping rules, because the 28 rules alone are about 4.5k chars, so it is met at chars/4 only. The root keeps:

1. The header and the regeneration line.
2. NON-NEGOTIABLE rules 1 to 28, verbatim.
3. §0 runtime in 4 lines: where the IDs live, who sets effort, `/effort` for interactive sessions.
4. §0.1 output discipline in 3 lines; the hook's deny reasons carry the detail.
5. §1 protocol pointer.
6. §2 preservation and the gate command list (no baseline tables).
7. A **trigger index** table: path or event, then the rule doc, then the mechanism that loads it.
8. The §21.2 block, kept here so that `check:docs` and the `log-entry` skill stay unchanged (question 8).

Current section sizes in the working copy (chars, approximate): NON-NEGOTIABLE and header 5,053; §5 9,094; §21 about 6,079; §3 4,945; §17 3,131; §0 2,482; §12 2,230; §6 2,187; §8 1,806; §15 1,076; §1 972; others under 700 each.

**B. Specialist rules move to canonical homes, each with a mechanical trigger (§5.3).**
- A new `frontend/src/CLAUDE.md` takes §8 conventions, §10 removed components, §15 gotchas and the §16 pointer. It loads on any Read under `frontend/src/`, and Claude Code requires a Read before every Edit of an existing file.
- PROTOCOL P5 takes the §3.1 table and the §3.2 Layer Impact Report template.
- PROTOCOL P11/P12 take the §5 sub-rules (probe, positive control, mutation bench, grep wrapper). They already overlap them today.
- PROTOCOL P6 takes §6.
- `docs/CODEBASE-MAP.md` takes §2.5.
- `jjel/`, `jjtl/` and `jjscript/CLAUDE.md` take §12.6.
- §21.3 goes to PROTOCOL P9; `log-entry` reads it live.
- §17 baseline lists go to `docs/harness/gates.md`.

**C. Three triggers, one map.** `docs/harness/rule-triggers.json` maps globs to docs, for example `{"glob": "frontend/src/components/editor-v2/**", "docs": ["frontend/src/components/editor-v2/CLAUDE.md"]}`. It is consumed by:
1. **`lane-run start`**, which matches the DOVE paths and appends a "Rules in scope" block naming the docs to the lane input. That block is kept in `stdin.md`, so it can be audited.
2. **A new `rule-trigger.mjs` PreToolUse hook on Edit|Write.** On the first write under a mapped path in a session, it denies once with the doc paths as the reason, with a marker keyed by `session_id` in the OS temp dir. This covers files discovered mid-lane and new files, which need no prior Read.
3. **Nested `CLAUDE.md` loading on Read**, the native behaviour.

`check:triggers` (in B4) fails when a moved rule has no map entry or a map target is missing. Bash-based edits (`sed -i`, heredoc) bypass trigger 2; that is a residual gap, covered by trigger 1 for DOVE files.

**D. Selective docs.**
- `npm run decisions -- <ID…>` parses `docs/decisions.md` on demand with the row grammar of `docs-digest.ts` and prints, for each ID, its canonical row text plus the rows it amends or supersedes and the rows that amend or supersede it. Relations are parsed from "Amends/Emenda/Amended/Supersedes/Sostituisce"; 105 lines carry such a marker (measured `grep -c`). Status (active, provisional, superseded under `## Superate` at `:6071`) comes from the section and the row fields.
- Nothing is cached, so nothing can be stale. An unparsable row or an unresolved relation exits 2 with the line, so a gap is reported, never guessed.
- `lane-run start` resolves the decision IDs cited in the prompt (`RC-\d+`, `R-[A-Z]+-\d+`, `D-UI-\d+` …) and appends their canonical rows with amendments.
- `npm run log:find -- --file <path> | --front <slug> | --prompt <P-ID>` prints matching entry headers and locations (bounded) from the log, the inboxes and the archive, with `--full` for bodies. It does not rewrite or rotate anything.

**E. Routing (extends RC-32, no second orchestrator).** `tierRule` returns `{tier, model, effort, reason}`, and `tier` stays `heavy|light`.
- **heavy (Opus 5.5)**, as today: forced classes, migrations (`VersionFixer.tsx`, `DV.tsx`, `defaultViewTemplate.ts` in DOVE are already critical names), `Lane: full`.
- **light (Sonnet 5.5)**: today's docs-only lanes, plus, after AM-2, `Lane: fast` code lanes outside critical and governance paths that are not RC-45-eligible or not drawn. While RC-45 is open, every eligible lane is still drawn, unchanged.
- **report role (Haiku 5.5):** not a lane tier. A subagent `reporter` with `model: claude-haiku-5-5` turns `evidence.json` into the P9 entry. Counts, format checks and transforms stay in scripts.
- **Effort** is passed with `--effort` on every launch: heavy `xhigh` when the critical zone or a visual bug applies, else `high`; light `high`. It is recorded.
- **Recording:** one line per launch in `~/.jjodel-lanes/<id>/runs.jsonl`: `{at, kind: start|resume|escalate, session, tier, requestedModel, effort, reason, escalation?}`. After exit, `lane-run status` adds the effective model from `init`, the per-invocation `usage` and the cumulative `modelUsage`. `tier.txt` is unchanged.

**F. Escalation.** `lane-run escalate <Prompt-ID> --trigger <id> [message]` resumes the same session with `--model <heavy id>` and the same flags. It never adds `--critical-zone-goahead` and never removes `AUTO_FLAGS`.

Triggers are verifiable from files:
- **T1:** a `CRITICAL_FILES` path or D-layer creator in the branch diff against the cut sha. This reuses RC-36's guard.
- **T2:** a `critical-zone` deny in the log.
- **T3:** `VersionFixer.tsx`, `DV.tsx` or `defaultViewTemplate.ts` in the diff or a deny.
- **T4:** a diff path in a layer (`sync/`, `model/`, `redux/`, `editor-v2/`) that no DOVE path covers.
- **T5:** the same gate red after one corrective resume. Environmental patterns (port in use, missing `node_modules`, the nine §17 `window is not defined` files, network) do not count.
- **T6:** a final message line `Escalation-request: <reason>`.

Limits:
- At most one automatic escalation per lane (counted in `runs.jsonl`). A second trigger gives `Outcome: blocked` with the evidence.
- RC-45 drawn lanes never escalate.
- Escalation changes capability only, never authorisations.
- `runs.jsonl` keeps the genealogy; `Corregge` keeps the rework chain.

**G. Reporting with Haiku.**
- `frontend/scripts/lane-evidence.mjs` extracts from `log.jsonl`, `runs.jsonl` and git: commands with exit codes, files, commits, gate lines, outcome and escalations. It writes `evidence.json`. The coder adds the fields only it knows: visual check, mutation bench, decisions, uncertainty.
- The `reporter` writes the entry with the §21.2 block read live, through the same awk line as `log-entry`.
- `check:docs` runs, plus a script check that the entry's Outcome symbol equals `evidence.outcome` (✅ only for `done` with every gate green).
- On any failure, the fallback is the `log-entry` skill on the main model with the same evidence. There is no second template.

**H. Output and verification.**
- Register `output-budget.mjs` and the runner allow entry; those are the 2026-10-13 leftovers.
- Measure, then decide, `--strict-mcp-config` and a per-lane `--settings` overlay disabling unrelated plugins for every lane. These are per-session flags; `~/.claude/settings.json` is untouched.
- No gate is removed.

### 5.2 Rules preserved: current place, future place, trigger

| Rule / section | Now | Future | Loaded by (before the action) |
|---|---|---|---|
| NON-NEGOTIABLE 1–28 | root | root, verbatim | auto |
| §0 model/effort | root | root (4 lines) + `lane-run` flags | auto; `--effort` |
| §0.1 output discipline | root (uncommitted) | root (3 lines) | auto; `output-budget` deny reasons |
| §1, §2, §17 gate commands | root | root | auto |
| §17 baseline lists, known red tests | root | `docs/harness/gates.md` | quiet-runner log tail + trigger index; `check:*` print their own baselines |
| §2.5 active areas | root | `docs/CODEBASE-MAP.md` + map entries per hot file | trigger 1/2 |
| §3.1 critical files, §3.2 LIR template | root | PROTOCOL P5 | `critical-zone` deny reason (names P5 and `docs/lir/`); trigger 1 via `CRITICAL_NAMES`; trigger 2 |
| §3.3–3.13 | nested (already) | unchanged | nested on Read; trigger 2 |
| §5 visual-bug spec (observed/expected/acceptance) | root | root (4 lines), sub-rules to P11/P12 | auto |
| §5 sub-rules (absence proof, grep wrapper, sort validation, source-text tests, mutation bench) | root | PROTOCOL P11/P12 | trigger 2 on `**/__tests__/**`, `*.test.ts`; trigger 1 for prompts with a visual checklist |
| §6 commit discipline | root | PROTOCOL P6 | `bash-guard` deny reasons on `git commit` |
| §8 conventions, §10 removed V3, §15 gotchas | root | `frontend/src/CLAUDE.md` (new) | nested on Read of any `frontend/src/**`; trigger 2 for new files |
| §12.6 language boundaries | root | `frontend/src/{jjel,jjtl,jjscript}/CLAUDE.md` | nested; trigger 2 |
| §16 AI providers | root | nested file of the provider subtree (path found in B5) | nested; trigger 2 |
| §18–19 maps | stub in root | `docs/CODEBASE-MAP.md` | trigger index line |
| §21.2 entry format | root + P9 twin | unchanged | `log-entry`, `check:docs` |
| §21.3 self-assessment semantics | root | PROTOCOL P9 | `log-entry` / `reporter` read it live |
| Rule 16 reads | root | root (amended, AM-5) | `lane-run` injection + `decisions`/`log:find` |

### 5.3 Trigger guarantees, including negative cases

A moved rule counts as available only when one of these holds:
- (i) its doc is named in the lane input before the session starts (DOVE match);
- (ii) Claude Code loads it on the Read that must precede an Edit;
- (iii) the first Edit or Write under its path is denied with the doc named.

A rule must not load where it does not apply. The map entries are path-scoped, and the tests T-D2 and T-D4 assert both directions.

### 5.4 Decisions to amend (RC-26 items for Alfonso), proposed text

- **AM-1 (amends RC-16, RC-32), one place for model IDs.** "The three model IDs live in `.claude/settings.json`: `model` (heavy, the pin), `env.JJODEL_LIGHT_MODEL`, `env.JJODEL_REPORT_MODEL`. `lane-run` reads them, refuses to launch when one is missing or malformed (no fallback chain), passes `--model` for light and on escalation and `--effort` on every launch, and records requested and effective model and effort in `runs.jsonl`. Agent and skill files that name a model are checked equal to these values by a test. `LANE_RUN_LIGHT_MODEL` stays as a test override."
- **AM-2 (amends RC-32), light for ordinary code lanes.** "`tierRule` gives light to `Lane: fast` lanes whose DOVE names no critical-zone, governance or migration path. For lanes eligible under RC-45 this applies only after the draw closes and only if Alfonso, on the RC-45 report, does not veto it; until then the draw decides."
- **AM-3 (new), escalation.** "A lane escalates from light to heavy only through `lane-run escalate`, on one of the triggers T1–T6, at most once; a second trigger is `Outcome: blocked`. RC-45 drawn lanes never escalate. Escalation never adds a go-ahead or lifts `AUTO_FLAGS`. Each escalation is a `runs.jsonl` line with previous and next model, trigger, phase, cumulative usage and outcome."
- **AM-4 (new), reporting.** "The closing entry may be formatted by the `reporter` subagent (Haiku 5.5) from `evidence.json`. It passes only if `check:docs` passes and its Outcome equals the evidence; otherwise the `log-entry` skill writes it from the same evidence. The reporter certifies nothing."
- **AM-5 (amends CLAUDE.md rule 16, `docs/decisions.md:4`, PROTOCOL P9 `:105`), targeted reads.** "At session start, read the decisions the prompt cites, with their amendments (`npm run decisions -- <IDs>`, injected by `lane-run`), and the log entries for the DOVE files, the front and the cited Prompt-IDs (`npm run log:find`). Reading the last N entries or the whole register is no longer required. A missing or unparsable decision is reported, not guessed."
- **AM-6 (amends PROTOCOL P1), triggers.** "Pertinent subfolder rules are delivered by `docs/harness/rule-triggers.json` through `lane-run`, the `rule-trigger` hook and nested `CLAUDE.md`; a rule moved out of the root has a map entry or the gate `check:triggers` fails."
- **AM-7 (CLAUDE.md §0, RC-26 effort), effort per tier.** "Heavy: `xhigh` for the critical zone and visual bugs, otherwise `high`; light: `high`; reporter: `low`. Set by `lane-run --effort`; `effortLevel` in `.claude/settings.json` is the interactive default (`high`)."

### 5.5 Phase 2 DOVE: exact files

New:
- `frontend/scripts/lane-usage.mjs`
- `frontend/scripts/lane-evidence.mjs`
- `frontend/scripts/gates/decisions-query.ts`
- `frontend/scripts/gates/log-find.ts`
- `frontend/scripts/gates/check-triggers.ts`
- `frontend/scripts/hooks/rule-trigger.mjs`
- `docs/harness/rule-triggers.json`
- `docs/harness/gates.md`
- `frontend/src/CLAUDE.md` and its generated `frontend/src/AGENTS.md`
- `.claude/agents/reporter.md`
- tests: `frontend/scripts/hooks/__tests__/laneUsage.test.ts`, `laneEvidence.test.ts`, `ruleTrigger.test.ts`, `decisionsQuery.test.ts`, `logFind.test.ts`, `checkTriggers.test.ts`, and fixtures under `__tests__/fixtures/lane-usage/`

Modified:
- `frontend/scripts/lane-run.mjs`
- `frontend/scripts/lane-board/lane-board.mjs` and `frontend/scripts/lane-board/README.md`
- `frontend/scripts/hooks/critical-zone.mjs`
- `frontend/scripts/hooks/__tests__/laneRun.test.ts`, `laneRunDirect.test.ts`, `laneBoard.test.ts`, `criticalZone.test.ts`
- `frontend/package.json` (script entries only)
- `.claude/settings.json`
- `.claude/agents/explorer.md` (model ID)
- `.claude/skills/log-entry/SKILL.md`
- `CLAUDE.md`, `AGENTS.md`
- `frontend/src/{jjel,jjtl,jjscript}/CLAUDE.md` and their `AGENTS.md`
- `docs/PROTOCOL.md`, `docs/HARNESS-DOCS.md`, `docs/CODEBASE-MAP.md`, `docs/decisions.md` (rows AM-1 to AM-7 only)

Owed to the trunk by the log, not part of the DOVE: `docs/claude-code-log.md` or the lane inbox.

### 5.6 Batches (≤ 5 files each)

The prerequisite **B0** is outside this plan: close P-2026-10-13-1930 by registering the hook and the runner allow entry, deciding `effortLevel`, committing CLAUDE.md §0/§0.1 with `gen:agents`, and writing the log entry. **Interactive** (`.claude/`, RC-19, RC-36).

| Batch | Files | Session |
|---|---|---|
| B1 measurement | `lane-usage.mjs`, `laneUsage.test.ts`, fixtures dir, `docs/harness/gates.md` | orchestrated |
| B2 selective docs | `decisions-query.ts`, `log-find.ts`, `decisionsQuery.test.ts`, `logFind.test.ts`, `frontend/package.json` | orchestrated |
| B3a routing | `lane-run.mjs`, `laneRun.test.ts`, `laneRunDirect.test.ts` | orchestrated heavy (governance file `lane-run.mjs`, RC-36: not `--auto`) |
| B3b board | `lane-board.mjs`, `lane-board/README.md`, `laneBoard.test.ts` | orchestrated |
| B4 triggers | `rule-triggers.json`, `rule-trigger.mjs`, `ruleTrigger.test.ts`, `check-triggers.ts`, `checkTriggers.test.ts` | orchestrated |
| B4b critical zone | `critical-zone.mjs`, `criticalZone.test.ts` | orchestrated heavy |
| B5a lean root | `CLAUDE.md`, `AGENTS.md`, `frontend/src/CLAUDE.md`, `frontend/src/AGENTS.md` | heavy, governance go-ahead |
| B5b nested and normative | `jjel/`, `jjtl/`, `jjscript/` `CLAUDE.md` + generated `AGENTS.md` (6 files: split in two) | heavy |
| B5c protocol | `docs/PROTOCOL.md`, `docs/HARNESS-DOCS.md`, `docs/CODEBASE-MAP.md`, `docs/decisions.md` | heavy, docs only |
| B6 reporting | `lane-evidence.mjs`, `laneEvidence.test.ts`, `.claude/agents/reporter.md`, `.claude/agents/explorer.md`, `.claude/skills/log-entry/SKILL.md` | **interactive** (`.claude/`) |
| B7 settings | `.claude/settings.json` (rule-trigger registration, env model IDs) | **interactive** (`.claude/`) |

Order: B0, B1, B2, B3a, B3b, B4, B4b, B7, B5a, B5b, B5c, B6.
- B5 goes after B4 and B7, so that no rule leaves the root before its trigger exists.
- AM-1 to AM-7 land in B5c only after Alfonso's approval.

### 5.7 Tests and acceptance criteria

- **Routing:**
  - **T-R1**: `tierRule` table tests for every class, plus AM-2 with the draw open and closed.
  - **T-R2**: `start` passes `--model` and `--effort` as the class requires and writes `runs.jsonl`.
  - **T-R3**: `resume` keeps the model unless `escalate` is used.
  - **T-R4**: an `escalate` integration probe on a real Sonnet session with thinking and tool-use history (one probe, budgeted).
  - **T-R5**: a second escalation gives `blocked`.
  - **T-R6**: a drawn lane refuses `escalate`.
  - **T-R7**: a missing or malformed model ID in settings refuses, with no silent substitute.
  - **T-R8**: an unavailable model reported by the CLI (non-zero exit, no init) ends `blocked` with stderr kept.
  - **T-R9**: a third tier value never reaches `tier.txt` or the ledger.
  - **T-R10**: lanes started before the change (no `runs.jsonl`) render, resume and merge unchanged.
- **Documents:**
  - **T-D1**: `check-triggers` fails on a moved rule without a map entry or a dangling target.
  - **T-D2**: the hook denies once on the first write under `editor-v2/**`, allows the retry, and never fires on a path outside the map (negative).
  - **T-D3**: `lane-run` injects exactly the docs of the DOVE globs, and none for a docs-only DOVE (negative).
  - **T-D4**: a Haiku probe confirms that a nested `CLAUDE.md` appears in context after a Read inside its subtree and not after a Read outside it. This needs two probes, budgeted.
  - **T-D5**: `decisions RC-32` returns RC-32 plus RC-45 (amends it) plus RC-16 (amended by it). An unknown ID or an unparsable row exits 2.
  - **T-D6**: `check:agents`, `check:docs` and `check:addonly` are green.
- **Reporting:**
  - **T-E1**: `lane-evidence` on fixture logs, including a partial run and a log without `result` (usage missing reported as missing, not zero).
  - **T-E2**: a reporter entry with ✅ against `evidence.outcome = hard-stop` is rejected.
  - **T-E3**: when the reporter fails, the fallback path writes the entry and `check:docs` passes.
- **Preservation:**
  - Hook tests are green: bashGuard, criticalZone, outputBudget.
  - The deny list is unchanged.
  - RC-45 ledger and assignments are byte-identical before and after (`sha256` in the log entry).
  - Running lanes are untouched: lane-run changes are additive, and settings load per session.
- **Gates** at the end of every batch, through the quiet runner: `typecheck` against the branch baseline (§17 says 14; RC-48 "baseline zero" exists only on `staging`, commit `8a8575ec0`, so check which one applies), `build`, `test` on the touched areas, `check:scripts`, `check:docs`, `check:agents`.

**Measurement**, planned and not run. The budget is an RC-26 item.
1. **Document effect (same model, Sonnet 5.5).** Current harness against lean harness on 6 historical tasks whose acceptance is executable, for example lanes that added tests to `frontend/scripts/hooks/__tests__/` or a pure module with a mutation bench. Replay in a temporary worktree at each task's base sha, 2 trials per arm. Report:
   - A, B, C and R as in §3.3, first-call context, cost, calls;
   - pass of the original acceptance tests, diff ⊆ DOVE, gate results, hook denials.
2. **Model effect (lean harness).** Sonnet against Opus on the same 6 tasks, then read the RC-45 drawn subset when it closes.

With n=6 and 2 trials, the result is an effect size with its range and a list of violations, not proof of equivalence. The report says so.

### 5.8 Rollback

- Every batch is its own commit(s).
- Rollback is `git revert` of the batch, with no log rewriting: logs are add-only and `check:addonly` stays green.
- `lane-run` keeps the v1 rule behind `LANE_RUN_ROUTING=v1` for one release, so the routing can be reverted without a revert commit.
- `runs.jsonl` is optional for every reader, and the new hook fails open.
- Moved rules keep their text verbatim at the new home, so reverting B5a alone restores the old root.
- Running lanes keep the settings they loaded (RC-29 note), and lanes already drawn keep their tier.

## 6. Dependencies, risks, open questions

### 6.1 Risks

1. **The uncommitted CLAUDE.md belongs to another lane.** Phase 2 must not start B5 on top of it.
2. **Nested `CLAUDE.md` loading on Read is documented behaviour that this phase did not measure.** T-D4 measures it before B5 relies on it.
3. **A deny-once hook can confuse a lane** that edits through Bash. Covered only by injection.
4. **Escalation re-writes the cache**, at a cost proportional to the context. Opus may handle Sonnet's dropped thinking worse; this is untested (T-R4).
5. **RC-45 is starved** (2/40). AM-2 makes the Sonnet default wait on an experiment that may close by date with little data.
6. **The tokenizer factor of 1.21 comes from one prompt.** Cost projections carry that uncertainty.
7. **The output-budget hook can deny commands that lane tooling needs.** Its own prompt asked for exemptions; review them at B0.

### 6.2 Files read

`.claude/settings.json`; `~/.claude/settings.json` (read only, not modified); `.claude/agents/explorer.md`; `CLAUDE.md` (working copy, and `git diff -- CLAUDE.md`); `docs/decisions.md:1-30,105-294` (window) and `grep` counts; `docs/PROTOCOL.md:20,105,430-440` (window); `docs/prompts/claude_2026-10-13_1930_prompt_token_economy_harness.md` (whole); `frontend/scripts/lane-run.mjs:240-319,600-660,862-996` (windows) and greps; `frontend/scripts/gates/docs-digest.ts:1-30`; `frontend/scripts/hooks/output-budget.mjs:1-4`; `frontend/scripts/lane-board/lane-board.mjs:468,1064`; `frontend/package.json` (script lines); the `claude-api` skill reference (`SKILL.md`, `shared/models.md`, `shared/prompt-caching.md`, `shared/cost-optimization.md`, grep windows).

Lane folders under `~/.jjodel-lanes/` were read by script: `log.jsonl`, `tier.txt`, `exit.txt`, `input-1.md`/`stdin.md` and `rc45-draws.jsonl` (read only).

Through the two `explorer` subagents: `docs/PROTOCOL.md`, `docs/HARNESS-DOCS.md` §4/§6/§7, the nested `CLAUDE.md`s, `scripts/generate-agents.mjs`, the skills, `critical-zone.mjs`, `bash-guard.mjs`, `lane-board.mjs`, `insights.js`, `trace-index.ts`, `auto-intake.mjs` and the hook tests.

### 6.3 Decisions taken (unattended)

1. Sample = the last 20 closed lanes with a session. The 4 direct merges are excluded.
2. Denominator = D (uncached + cache read + cache write), for all three consumers.
3. Cost and tokens come from the last `result` per session, after probe 2 showed they are cumulative. The first pass summed them and overstated P-2026-10-11-2230.
4. The Sonnet probe was run as a resume of the Haiku session, to answer the resume question inside the three-call budget.
5. chars/token is reported three ways, beside the declared chars/4.

### 6.4 Decisions awaiting Alfonso (RC-26 list items only)

1. **Model, effort and cost of sessions:** AM-1, AM-2, AM-7, the subagent model, and the benchmark budget of §5.7.
2. **Amendments of ratified rows and normative rules:** AM-1 (RC-16, RC-32), AM-2 (RC-32), AM-5 (rule 16, decisions header, P9), AM-6 (P1).
3. **New process rows:** AM-3 and AM-4. They change how sessions spend, so they belong to item 1.

Checkpoint, if T-R4 fails. A new Opus session gets `checkpoint.md` written by `lane-run escalate`, containing:
- the prompt path;
- the DOVE;
- the decisions cited, with their rows;
- the `git diff --stat` and the diff path;
- the gates run, with exit codes from `evidence.json`;
- the failing trigger;
- the remaining checks.

This needs no extra decision.

### 6.5 Open questions

1. Who closes the 2026-10-13 leftovers (the uncommitted CLAUDE.md §0/§0.1, the unregistered hook, `effortLevel`, the missing log entry)?
   - Recommended: a short interactive lane that corrects P-2026-10-13-1930, run before any Phase 2 batch.
2. Should the Sonnet default for RC-45-eligible lanes wait for the draw to close?
   - Recommended: yes. Leave RC-45 untouched and decide at its report.
3. Should all three model IDs live in `.claude/settings.json` (`model` + `env`) instead of the pin plus `LIGHT_MODEL`?
   - Recommended: yes, with a consistency test (AM-1).
4. Effort per tier as in AM-7?
   - Recommended: adopt AM-7 and record effort in `runs.jsonl`.
5. Should the built-in `Explore`/`general-purpose` subagents (25.3% of D, on Opus) run on Sonnet in lanes?
   - Recommended: measure first in B1 and §5.7. Verify the mechanism in the official docs (agent frontmatter, per-call `model`, or an environment variable) before choosing.
6. `--strict-mcp-config` and a plugin-disabling `--settings` overlay for every lane?
   - Recommended: two Haiku probes to measure the saving; adopt if it is ≥ 3k tokens and no sampled lane used an MCP tool.
7. AM-5: replace "last 5–10 entries" and "read decisions.md" with targeted reads?
   - Recommended: yes, together with B2.
8. Where should the canonical home of the §21.2 block be?
   - Recommended: keep it in the root. Move only §21.3, so that `check:docs` and `log-entry` stay unchanged.
9. Benchmark budget: 6 tasks × 2 arms × 2 trials, twice?
   - Recommended: approve one Sonnet document-effect run first (estimated $100–200 list), then decide the model run.
10. Haiku reporter as a subagent or as a skill with `model:`?
    - Recommended: a subagent with `evidence.json`, behind `check:docs` and the Outcome check (AM-4).
11. Do `frontend/package.json` script entries (no dependency) fall under rule 4?
    - Recommended: no, treat script entries as allowed; confirm.

## 7. Ratification (Alfonso, 2026-10-16)

Source: Alfonso's RC-26 ratification. His text is dated 2026-10-15 and reached the lane in the ACK of 2026-10-16 09:37. It is recorded as RC-49 in `docs/decisions.md`; RC-48 is taken on `origin/staging` (`8a8575ec0`), so 49 is the next free number on every branch, measured with `git show <ref>:docs/decisions.md` over all local and remote refs. Sections 0 to 6 above are unchanged.

New input: `docs/archivio/claude_2026-10-15_nota_concentrazione_costi_sessioni.md` (`ba192edb0`), hereafter "the note". Its figures come from 185 Claude Code sessions with more than two turns over the 14 days to 2026-10-15, with D = 3.97B tokens. This report's figures come from 20 closed lanes, with D = 452.5M. The two samples are cited separately and never summed.

### 7.1 Decisions

| Status | Item |
|---|---|
| Approved now | B0 first (closure of P-2026-10-13-1930's leftovers) |
| Approved now | AM-1: the model IDs in one place |
| Approved now | AM-5: targeted reads of decisions and log |
| Approved now | AM-7: effort per tier |
| Approved now | The read-only subagents `Explore` and `explorer` run on Sonnet 5.5 |
| Approved with a condition | `general-purpose` on Sonnet, after the B1 measurement |
| Approved with a condition | AM-2 and AM-3, after RC-45 closes, subject to Alfonso's veto on the RC-45 report |
| Approved with a condition | AM-6 and B5, only after B4 and a passing `check:triggers` |
| Deferred | AM-4 (Haiku reporter) and the benchmark of §5.7, to be reconsidered after B1 |
| New, accepted in principle | AM-8, a context ceiling per session (threshold and text to be ratified, §7.3) |
| New, accepted in principle | AM-9, one slice per session (text to be ratified, §7.4) |

This row records approval. It does not apply anything: the text of AM-1, AM-5 and AM-7 enters the normative documents only in the batch §7.5 assigns it to.

### 7.2 The criterion: plan usage, not dollars

The harness stays on the subscription, so Phase 2 is governed by usage against the plan limits. The dollar figures of §3.4 and §3.5 stay only as relative weights between cost lines. They are not a target.

Recorded today, and usable as a proxy for plan usage (measured in §3.1 and §3.4):
- `rate_limit_event.rate_limit_info.unifiedWindows.five_hour.utilization`;
- `seven_day.utilization`, with `resetsAt`;
- `status`, `isUsingOverage` and `overageStatus`.

These fields are in every lane `log.jsonl`. `auto-intake.mjs` already parses them (`toReading`, `:639-651`, read (agent)). Two limits:
- They are window-level. A lane's share is the change between its first and last reading, and that change is valid only when no other session ran in the same interval.
- The resolution observed is two decimals of the window. In the sample, 0.77 to 1.0 over 4 days.

Recorded today, and not a proxy:
- `total_cost_usd` and `modelUsage.costUSD`, which carry `costBasis: list` (measured): they are list-price dollars.
- Token totals by class, whose weights in the plan, by model and by class (cache read, cache write, output), are not published and not observed.

B1 must record, per launch:
1. The first and the last rate-limit reading, all fields above.
2. The overlap with other lanes and sessions in the same interval (lane folders' `started.txt`/`exit.txt`; interactive sessions are not visible to `lane-run` and must be stated as a gap).
3. Tokens per model and per class.
4. The per-call main context series that AM-8 needs.

From launches that ran alone, a regression of utilization change on token class and model estimates the plan weights. Until then, every saving is reported in tokens per class, not in dollars.

The note's price claim (Sonnet 5.5 cache read at $0.10 from 2026-10-07) is not verified here. The `claude-api` reference read in this lane was cached on 2026-10-06. Under this criterion the claim changes only the relative weights of §3.5.

### 7.3 AM-8 (new): context ceiling per session

The data:
- **The note:** first-turn context median 48k, about 19% of its D; last-turn context median 264k, p90 467k, max 863k; median 72 turns per session (findings 3 and 4). A 150k cap gives at most −25% on its 14-day Opus figure, as an upper bound, because it truncates instead of restarting (finding 5).
- **This report:**
  - Median first-call context 48,232 tokens.
  - Resumed sessions restarted at 70,937 to 248,094 tokens (§3.3).
  - 86 main calls per lane at the median.
  - 0 compactions.

Restart cost (estimated):
- A fresh session starts at the base of about 48k. It adds `handoff.md`, at most 8k when the diff is cited by path and stat, not inlined, and a re-read of the working files, about 20 to 40k.
- So it rebuilds roughly 80 to 100k, which is written to cache once.

Break-even, with the API weights as the only available proxy (cache write 1.25x input, Opus 5.5 cache read 0.05x input), for a session growing linearly from 48k at about 2.5k per call:

| Threshold | Median session (86 calls, ends near 264k) | p90-like session (about 170 calls) |
|---|---|---|
| 150k | crossing at call 41; 45 calls left; net saving about +22k input-equivalents | net saving about +275k |
| 200k | crossing at call 61; 25 calls left; net saving about +25k input-equivalents | net saving about +487k |
| 250k | crossing at call 81; 5 calls left; net saving about −72k (loss) | — |

The gain is in the tail, which is where the note's ten most expensive sessions are. The arithmetic is rough; B1 recalibrates it on real per-call series.

**Proposed thresholds**, on the main-session context of one call, meaning `input_tokens + cache_read_input_tokens + cache_creation_input_tokens` of the latest main `assistant` event:
- **Soft: 200,000 tokens.** The session finishes the current step, writes `handoff.md` in the lane folder, and exits with `Outcome: hard-stop`. The file has these sections: task, scope (DOVE), decisions taken, evidence (commands with exit codes, gate results), current diff (`git diff --stat` against the cut sha plus the path of a full diff file), remaining checks.
- **Hard: 250,000 tokens.** The stop is immediate: every tool is denied except writing `handoff.md` and running `git status`/`git diff`, and the session exits with `Outcome: hard-stop`.
- If the model fails to write `handoff.md`, `lane-run` writes a mechanical one from the prompt, the DOVE, `git diff --stat` and the gate lines of the log, and marks it `mechanical`.
- Alternative: 150k / 200k, more aggressive and closer to the note's simulation. It costs more restarts on median sessions for the same tail gain.

**Where the context size can be read.**
- **After an invocation:** `lane-run` can read it from `log.jsonl`. Each `assistant` event carries `message.usage`; measured in §3.1, where the per-call sums equal D to the token. `result.usage` does not give it, because it is a per-invocation total.
- **During a run:** `lane-run` itself is not running. `start` returns once it has the session id (`lane-run.mjs:925-931`), and the session runs detached (`launch`, `:471-490`, `detached: true`). The log is written live by the wrapper, and a running lane's log was read mid-run by a subagent of this session (§2.4).
- **The closest supported mechanism is therefore an in-session `PreToolUse` hook,** `frontend/scripts/hooks/context-ceiling.mjs`, matcher `*`. On each tool call it reads the tail of the lane's `log.jsonl`, whose path `launch` exports as `JJODEL_LANE_LOG` beside `JJODEL_CRITICAL_ZONE_GOAHEAD` (`lane-run.mjs:475-477`).
  - At the soft threshold it denies once, with the handoff instruction as the reason.
  - At the hard threshold it denies everything except the handoff writes.
  - It fails open like the other hooks, and the RC-20 90-minute limit stays the backstop.
- Interactive sessions have no lane log. The hook input field `transcript_path` is documented by Claude Code but used nowhere in this repo and not measured here, so it is a candidate for those sessions only.

**`lane-run resume --fresh <Prompt-ID>`** starts a new `claude -p` session, without `--resume`, in the same lane folder and under the same Prompt-ID.
- **Input:** `handoff.md`, the prompt's DOVE, and the closing input of `closingInput` (`:473`).
- **Validation:** it refuses when `handoff.md` lacks one of the six sections.
- **Session file:** it overwrites `session.txt` only after recording the old session in `runs.jsonl`. `start` refuses a second session today (`:897`), so `--fresh` is the one sanctioned way.
- **Plain resume:** a plain `resume` of a session whose last main context is at or above the soft threshold is refused, with `--fresh` named.

**How it composes:**
- **RC-20:** a ceiling stop is an ordinary `Outcome: hard-stop`, which the chat reads from the line. A `--fresh` session is new by construction ("A session without `--resume` is new by construction"), and the 90-minute limit applies per launch.
- **AM-3** (deferred until RC-45 closes): an escalation whose last context is at or above the soft threshold goes through `--fresh --model <heavy>` from `handoff.md`, instead of resuming a large context into a cold Opus cache. It still counts as the one escalation.
- **RC-45:** a drawn lane keeps its tier and model across `--fresh`, read from the ledger and `tier.txt`. A ceiling stop is neither a failure nor a relaunch on the other tier. `runs.jsonl` counts sessions per lane so that the RC-45 report can show them.

Proposed text: "**RC-xx (AM-8): every lane session has a context ceiling.** At a main-session context of 200,000 tokens (input plus cache read plus cache write of the latest main call) the session finishes its step, writes `handoff.md` (task, scope, decisions, evidence, current diff, remaining checks) in the lane folder and ends with `Outcome: hard-stop`; at 250,000 the `context-ceiling` hook stops it at once, leaving only the handoff writes. Work resumes with `lane-run resume --fresh`, never by resuming the full transcript. The thresholds are recalibrated on the B1 measurements and changed only by a ratified row. A drawn lane (RC-45) keeps its tier; RC-20's time limit stays."

### 7.4 AM-9 (new): one slice per session

Proposed text: "**RC-xx (AM-9): one slice per session.** A prompt that declares several slices (`## Slice <n>` sections, or a `Slices:` header) runs each in its own session: `lane-run start` runs slice 1, and `lane-run next <Prompt-ID>` starts slice n+1 as a `--fresh` session from the prompt's slice section and the committed result of slice n (its commit shas, `git diff --stat` against the cut, its log or inbox entry, its report path), never from its transcript. `start` refuses a prompt with several slices and no slice selection. A `resume` stays for answering a question and for the GO of the same slice."

To be ratified with it, as an option: Phase 2 after a Phase 1 hard stop, and a rework after a failed visual GO, are new slices and start fresh from the committed report or Phase 2 prompt. This amends RC-20 for those two cases.
- Recommended: yes. The note's ten most expensive sessions are discovery plus fix in one session (finding 4).
- `lane-run chain` already runs separate prompts one per session and is unchanged.

### 7.5 Effect on the batches

Every batch has at most five files.

| Batch | Change | Files |
|---|---|---|
| B0 | Unchanged and first. It may also carry the read-only subagents on Sonnet, since it is already an interactive `.claude/` session, once the mechanism for the built-in `Explore` is verified in the official documentation (agent override, per-call `model`, or an environment variable). Otherwise this moves to B7. | — |
| B1 | Gains the plan-usage recording of §7.2 and the per-call context series of §7.3 | its files, unchanged |
| B3a | Reduced to AM-1 and AM-7 | — |
| B3c (new) | AM-2 and AM-3, after RC-45 closes and the veto window | `lane-run.mjs`, `laneRun.test.ts`, `laneRunDirect.test.ts` |
| B2b (new, governance, heavy) | Normative text of AM-1, AM-5 and AM-7. Includes `CLAUDE.md` line 62 ("one line per decision", stale for a 643 KB register, note finding 6), `decisions.md:4` and P9 `:105` | `CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`, `docs/decisions.md` (header line 4 only) |
| B8a (new, AM-8/AM-9 runner) | `--fresh`, `next`, slice refusal, `JJODEL_LANE_LOG`, mechanical handoff | `lane-run.mjs`, `laneRun.test.ts`, `laneRunDirect.test.ts`, `frontend/scripts/lane-templates/handoff.md` (new) |
| B8b (new, AM-8 hook) | — | `frontend/scripts/hooks/context-ceiling.mjs` (new), `frontend/scripts/hooks/__tests__/contextCeiling.test.ts` (new) |
| B7 (interactive) | Gains the registration of `context-ceiling.mjs` | `.claude/settings.json`, `.claude/agents/explorer.md`, plus `.claude/agents/` for `Explore` if not done in B0 |
| B8c (after ratification) | Text of AM-8 and AM-9 | `docs/PROTOCOL.md` (P13, P16), `docs/decisions.md` (their rows) |
| Deferred | B6 (AM-4) and the benchmark | — |

Updated order:
1. B0
2. B1
3. B2
4. B3a
5. B3b
6. B2b
7. B8a
8. B8b
9. B4
10. B4b
11. B7
12. B8c
13. Then B5a, B5b and B5c, only after B4 and a passing `check:triggers`

Waiting: B3c, after RC-45. Deferred: B6 and the benchmark, after B1. `general-purpose` on Sonnet: a settings change after B1, in B7 or a later interactive batch.

Tests added to §5.7:
- **T-C1:** the hook denies once at the soft threshold and allows the handoff writes at the hard threshold, on fixture logs.
- **T-C2:** it never fires below the soft threshold (negative).
- **T-C3:** `--fresh` refuses an incomplete `handoff.md`, keeps the tier of a drawn lane, and records the old session.
- **T-C4:** a plain `resume` above the soft threshold is refused.
- **T-S1:** `start` refuses a multi-slice prompt without a selection.
- **T-S2:** `next` starts from the committed result: its input contains the shas and no transcript text.
