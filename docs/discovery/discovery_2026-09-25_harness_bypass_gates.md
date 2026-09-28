# Discovery: human gates off `ask` under bypass (RC-16, RC-17, RC-19), Phase 1

- **Prompt-ID**: P-2026-09-25-1022, `docs/prompts/claude_2026-09-25_1022_prompt_harness_bypass_gates.md` (on `alfonso-frontend-jjtl` at `afaea8756`)
- **Session**: b803cdf6-2268-40dc-9c40-7ef5a271b34a, in `bypassPermissions` (this session's transcript records `permissionMode: "bypassPermissions"` on 13 of the 13 lines that carry the field)
- **Tree**: `/Users/alfonso/jjodel-gate`, branch `harness-bypass`, created by `git switch -c harness-bypass alfonso-frontend-jjtl`, HEAD `afaea8756`. The tree was clean before the switch (`git status --porcelain`: 0 lines).
- **Executor**: Opus 5.5 (`claude-opus-5-5`), as the session banner shows it
- **Claude Code**: `2.1.282 (Claude Code)`, binary `/Users/alfonso/.local/share/claude/versions/2.1.282` (Mach-O arm64, 222245312 bytes)

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the real files.

Tags: **[M]** measured in this phase, **[R]** read (docs, a file, the installed binary), **[D]** deduced.

## 0. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The PreToolUse hook input carries `permission_mode`, and a session launched with `--dangerously-skip-permissions` sends `"bypassPermissions"` | **Holds** on the docs and the installed binary [R]; the field is measured in a real PreToolUse input on 2026-09-21 [M, earlier report]; the literal value `"bypassPermissions"` on a hook's stdin is **not** measured in this phase (§1.5) |
| H2 | The Phase 2 change is not inert: a hook `deny` holds under bypass, and the field reaches both hooks | **Holds** [R]: memo §3 counted 6 hook denials in bypass sessions; both hooks go through the same input builder (§1.2) |
| H3 | The texts describing the old behavior sit only in the six DOVE files | **Falsified**: two rows of `docs/HARNESS-DOCS.md` §6 are outside DOVE (§2) |
| H4 | The tests can pass `permission_mode` without touching `hookRunner.ts` | **Holds** [R] (§3) |
| H5 | The baseline of item 4 is green | **Holds** [M] (§4) |

## 1. Question 1: `permission_mode` in the PreToolUse input

### 1.1 The docs [R]

`https://code.claude.com/docs/en/hooks`, fetched 2026-09-25, section "Common input fields", row `permission_mode`, verbatim:

> Current [permission mode](/docs/en/permissions#permission-modes): `"default"`, `"plan"`, `"acceptEdits"`, `"auto"`, `"dontAsk"`, or `"bypassPermissions"`. The mode labeled **Manual** arrives as `"default"`, never as `"manual"`, so scripts that match `"default"` keep working. Not all events receive this field. Check the JSON example in each [hook event](#hook-events) section

The PreToolUse input example on the same page carries `"permission_mode": "default"`. On a hook `ask` or `deny` under `bypassPermissions`, the page says nothing that the fetch could quote.

### 1.2 The installed binary, 2.1.282 [R]

Read-only, a Python scan of the binary. The locations are byte offsets in this build, not lines.

- **The base input of every hook** (offset 183096857), function `ic(e,n,r,s)`:
  `return{session_id:e.id,transcript_path:Hg(e.id),cwd:n,scratchpad_dir:...,prompt_id:Yhe()??void 0,permission_mode:r,agent_id:s?.agentId,agent_type:g,effort:D}`
- **PreToolUse builds on it** (offset 183180733), `a6e(e,n,r,s,g,h,S=Da,w)`:
  `let z={...ic(s.session,ne(),g,s),hook_event_name:"PreToolUse",tool_name:e,tool_input:r,tool_use_id:n,..._G(e,s)};`
- **The mode passed in is the raw session mode** (offset 182454744), the caller `HIn`:
  `for await(let ve of a6e(n.name,s,r,e,fe(e).mode,e.abortController.signal))`
  No `ql()` mapping (the internal-to-external table) is applied on this path.
- **The flag sets the mode** (offset 196786275):
  `let m=e.dangerouslySkipPermissions?"bypassPermissions":e.permissionMode`
- **The mode table** (offset 174173101): `var Bs={default:{...},plan:{...},acceptEdits:{...},bypassPermissions:{title:"Bypass Permissions",...,external:"bypassPermissions"},dontAsk:{...},auto:{...}}`, then `function Yj(e){return e!=="bubble"}`. So the binary knows a seventh, internal mode, `bubble`, which the docs do not list.

### 1.3 `bubble` and subagents [R] [D]

`bubble` is the declared `permissionMode` of two built-in agent definitions: the fork agent (offset 182302311, `permissionMode:"bubble"`) and the coordinator worker (offset 195145404). When a subagent starts, the declared mode replaces the parent's only when the parent is not in bypass, acceptEdits or auto (offset 187857786):

`Re=Ee??e.permissionMode,...if(Re&&(Ee||w.mode!=="bypassPermissions"&&w.mode!=="acceptEdits"&&w.mode!=="auto")){...ee={...ee,mode:Pe}}`

[D] A subagent spawned from a bypass session keeps `bypassPermissions`, so it reaches the hook with that value and Phase 2 denies it the same way. A fork agent spawned from a `default` session reaches the hook with `"bubble"`. Phase 2's rule reads only `=== "bypassPermissions"`, so `bubble` falls on the `ask` side, which is the intended side for a non-bypass session. A spawn-time mode (`Ee`) is accepted only when it ranks at or below the parent's (`z4`, just before offset 174173101: `return Ks[e]<=Ks[n]?e:void 0`); the order of `Ks` was not read, so whether that rules out a raise to bypass is [D], not [R].

### 1.4 Measured values of the field [M]

- The 2026-09-21 probe, `docs/discovery/discovery_2026-09-21_harness_mechanization.md:77`: "What the hook receives on `Edit` and `Write` **[measured, probe 2]**: `session_id`, `transcript_path`, `cwd`, `prompt_id` (...), `permission_mode`, ...". The raw events in the appendix carry `"permission_mode":"acceptEdits"` on PreToolUse (lines 302 to 318) and `"permission_mode":"auto"` on UserPromptSubmit and Stop (lines 282, 286, 331, 335). That report does not state the build in the lines cited.
- `frontend/scripts/hooks/__tests__/hookRunner.ts:42-43`: "The field set a PreToolUse hook receives, as recorded by the H8 probe of the Phase 1 report (Appendix A, probe 2)", and line 50 `permission_mode: 'acceptEdits',`.
- This session: 13 of the 13 transcript lines carrying `permissionMode` read `bypassPermissions` (`~/.claude/projects/-Users-alfonso-jjodel-gate/b803cdf6-2268-40dc-9c40-7ef5a271b34a.jsonl`, 214 lines). That field belongs to the transcript, not to the hook input. It shows the mode that `fe(e).mode` holds in this session.

### 1.5 What is not established

- No hook stdin carrying `"bypassPermissions"` has been captured. Capturing one needs a hook that logs its input, and the prompt forbids adding one. The two running hooks write nothing unless they decide. The value rests on 1.1 and 1.2 [R], and on the field's measured presence [M].
- How a hook `ask` resolves under bypass (the memo §3 question) is not settled here. `HIn` passes an `ask` from a hook to `canUseTool` with the hook's decision forced (offset 182454744: `if(r.behavior!=="ask")return{decision:r,...};return{decision:await n.canUseTool(...,r),...}`). This read did not follow `canUseTool` in bypass to the end. The probe of memo §3 is Alfonso's and out of scope. Phase 2 does not depend on the answer: it replaces `ask` with `deny` exactly where bypass is on.

**Answer to 1.** Yes. On 2.1.282 the PreToolUse input carries `permission_mode`, with values `default`, `plan`, `acceptEdits`, `auto`, `dontAsk` and `bypassPermissions` (docs), plus the internal `bubble` for some subagents (binary). Under `--dangerously-skip-permissions` the value is `bypassPermissions` [R]. The stop condition "absent and not inferable" does not apply. Phase 2 still reads the field defensively (a non-string or absent value is the `ask` path), as the prompt already requires.

## 2. Question 2: texts that describe the old behavior

Searched with `command grep -nE` (BSD) over `CLAUDE.md`, `AGENTS.md`, `docs/HARNESS-DOCS.md`, `docs/PROTOCOL.md` and the three `.claude/skills/*/SKILL.md`, as a zsh array. A first run passed the list as one word and exited 2 ("No such file or directory"), so it searched nothing and is discarded. The rerun exited 0 with hits in every group, which is its own positive control. Patterns: `critical-zone`, `never denies`, `` `ask` ``, `ask`, `human gate`, `gate umano`, `cancello`, `git push`, `PreToolUse`, `hook`, `flip`, `visual-passed`, `visual-failed`, `Status`, `RC-15`, `bypass`, `permission`. A wider sweep of the whole tree followed, with `node_modules`, `.git`, `dist` and `build` excluded and the archival `docs/discovery`, `docs/prompts`, `docs/ratifiche`, `docs/archive`, `docs/log-inbox` and the log filtered out. It used `critical-zone|cancello umano|human gate|gate umano|never denies|two flips|due flip|visual-passed|visual-failed`.

| # | Where | Verbatim | Describes | In DOVE |
|---|---|---|---|---|
| T1 | `frontend/scripts/hooks/critical-zone.mjs:7-9` | "it answers `ask` with the 3.2 reason and the human confirms that the report was written in chat. No state, no marker file. It FAILS OPEN like every hook here; it never denies." | critical-zone ask-only | yes |
| T2 | `frontend/scripts/hooks/bash-guard.mjs:8-9` | "It only ever adds refusals: the `ask` on `git commit*` in settings stays the human gate." | commit `ask` as the human gate | yes |
| T3 | `docs/HARNESS-DOCS.md:381`, hook `bash-guard` row | "Solo rifiuti in più: l'`ask` su `git commit*` di `.claude/settings.json` resta il cancello umano" | commit `ask` as the human gate; no push rule | **no** |
| T4 | `docs/HARNESS-DOCS.md:382`, hook `critical-zone` row | "`ask` con il motivo di §3.2 sui sei file di §3.2 e sui percorsi di scrittura del D-layer (...). Non prova che il Layer Impact Report esista: lo chiede all'umano." | critical-zone ask-only | **no** |
| T5 | `.claude/skills/status-flip/SKILL.md:3` | "Flip the Status line of a prompt file, at lane end or after the human visual check." | two flips | yes |
| T6 | `.claude/skills/status-flip/SKILL.md:4` | `argument-hint: "closing\|visual-passed\|visual-failed <prompt-file> [lane] [sha]"` | two flips | yes |
| T7 | `.claude/skills/status-flip/SKILL.md:15` | "The three operations." | two flips | yes |
| T8 | `.claude/skills/status-flip/SKILL.md:18` | "`visual-passed <prompt-file>` and `visual-failed <prompt-file>`: only when the line already holds the closing form and no visual suffix yet. (...) This is the flip that follows Alfonso's ACK in the chat" | two flips | yes |
| T9 | `.claude/skills/status-flip/SKILL.md:20` | "Commit: the closing flip normally rides in the closing docs commit of the lane, in which case do not commit here. Otherwise commit the prompt file alone" | a separate Status commit, which RC-17 removes | yes |

**Clean** (hits in the search, none describing the old behavior):

- `CLAUDE.md:114-120` (and its projection `AGENTS.md:103-109`) names the hooks generically: "gli hook `PreToolUse`, che falliscono aperti e lo dichiarano". That stays true, since fail-open is unchanged, and it points to `docs/HARNESS-DOCS.md` §6 for detail.
- `docs/PROTOCOL.md:256-268` already holds the one-flip clause of RC-17. The `awk` extraction of the skill, run live on this tree, exits 0 and prints 15 lines, the first "- **Every prompt file carries a Status line, flipped once, in the lane's closure commit.**" [M]. Negative control: the same `awk` with an absent anchor prints 0 lines and exits 2 [M].
- `docs/decisions.md:97-98` (RC-15 decisions (7) and (8), "l'`ask` su `git commit*` resta", "due flip a mano") is already marked amended at line 109: "Emendata il 2026-09-25: la decisione (1) da RC-16, la (8) da RC-17, la (3) e la (7) da RC-19." Decisions are amended by note, not rewritten.

**Historical, not normative**: `docs/sessioni/sessione_2026-09-21_2.md:39-40` and `docs/sessioni/sessione_2026-09-23.md:41-42` ("l'`ask` su `git commit` resta come gate umano; P13 ha la clausola della riga Status (due flip, ...") are session checkpoints and dated records. They are listed for completeness and are not proposed for change, in line with the out-of-scope "rewriting old Status lines" and the add-only nature of records.

**Generated projections.** `npm run check:agents` regenerates 9 files: `AGENTS.md` and the eight under `frontend/src/` (`components/editor-v2`, `jjel`, `jjscript`, `jjtl`, `model`, `redux`, `services/export`, `styles`). Their source is the `CLAUDE.md` beside each one (`scripts/generate-agents.mjs:2-7`: "regenerate AGENTS.md as a projection of CLAUDE.md"). None of T1 to T9 is generated. `docs/HARNESS-DOCS.md`, `docs/PROTOCOL.md` and the skills are hand-written. `AGENTS.md` holds no old-behavior text, because its source `CLAUDE.md` holds none.

**Answer to 2.** Outside the six DOVE files, two texts describe the old behavior: `docs/HARNESS-DOCS.md:381` (T3) and `:382` (T4). Neither is generated. Inside DOVE, T1 and T2 are the headers the prompt already asks to rewrite, and T5 to T9 are the status-flip text that the COSA item on the skill covers.

## 3. Question 3: how `hookRunner.ts` feeds the input [R]

- `runScript(script, payload)` (`frontend/scripts/hooks/__tests__/hookRunner.ts:28-40`) spawns the script under `node` with `input` = `payload` if it is a string, else `JSON.stringify(payload)`. It reads the decision from `hookSpecificOutput.permissionDecision` on stdout.
- `bash(command, cwd)` and `file(tool, toolInput, cwd)` (`:59-65`) wrap `envelope()` (`:44-57`), which fixes `permission_mode: 'acceptEdits'` (`:50`).
- So every existing test in `bashGuard.test.ts` (helper `guard`, `:16-17`) and `criticalZone.test.ts` (helpers `zone`/`edit`, `:20-24`) runs in `acceptEdits`. Under Phase 2 they all stay on the non-bypass path, and their current expectations hold unchanged [D].
- A new test can set the mode without editing `hookRunner.ts` (which is not in DOVE): `runScript('critical-zone.mjs', { ...file('Edit', {...}), permission_mode: 'bypassPermissions' })`; absent: take the envelope and `delete` the key; non-string: `permission_mode: 7`. The string form of `payload` also allows a raw JSON body.

## 4. Question 4: baseline [M]

From `frontend/`, node v26.8.1. This worktree has no `frontend/node_modules`, so the gates ran through a temporary symlink to `/Users/alfonso/jjodel/frontend/node_modules` (P14). `git status --porcelain` read 0 lines before and after. The symlink was removed at the end of this phase and Phase 2 recreates it the same way.

| Gate | Exit | Result |
|---|---|---|
| `npm run check:docs` | 0 | 4/4 passed, 0 warnings (A, B, C, D; log at 40 entries, threshold 40) |
| `npm run check:agents` | 0 | 9 projected files regenerated, all aligned |
| `npx vitest run scripts/hooks` | 0 | 3 test files, 203 tests passed (`bashGuard`, `criticalZone`, `lib`) |
| `npm run typecheck:scripts` | 0 | no output |

## 5. Notes for Phase 2 [R] [D]

- **The push path in `bash-guard.mjs`.** `analyze()` (`:294-327`) resolves each simple command, strips assignments, `env`, `command`/`builtin`/`time`/`nohup`/`exec` (`resolveCommand`, `:50-68`), descends into `sh|bash|zsh|dash|ksh -c` payloads and `eval` (`:298-302`), and skips git's own options, `-C x` included (`gitCall`, `:79-89`). `git commit` branches at `:313`. A `g.sub === 'push'` branch in the same place covers the four forms of the prompt, `git push`, `git -C x push`, `env A=1 git push` and `bash -c "git push"`, on the same parsing path. The mode reaches `analyze` through `makeContext` (`:329-338`) or a parameter. `main()` reads `input` at `:341`.
- **What that path does not see** [D]: a git alias (`git -c alias.p=push p`, or an alias in the user's gitconfig), `gh` commands that push, and a push hidden behind an opaque word (`$CMD push`). These are the same blind spots as the commit rules. The `ask` on `git push*` in settings stays as the prompt requires.
- **`critical-zone.mjs`**: `main()` (`:80-90`) holds the one `decide('ask', ...)`. `evaluate()` (`:56-78`) takes `toolInput` only and keeps its signature. The mode is read from `input` in `main()`.
- **`bash-guard.mjs` has no `isMain` guard** (`:354`: `runHook('bash-guard', main);` at top level) and exports nothing. Its tests run it only as a subprocess. That is unchanged by Phase 2.
- **How far the deny reaches** [M]: `command grep -rlE` over `frontend/src` (`.ts/.tsx/.js/.jsx/.mjs`, tests excluded) finds 9 non-test files containing a D-layer creator token. Control: `useJjomSync.ts` is in the list. Five of them are outside the six 3.2 files: `components/editor-v2/utils/refEdgeReconcile.ts`, `hooks/neighborhoodDraw.ts`, `hooks/createAdapter.ts`, `components/project/ProjectEditor.tsx`, `examples/RowViewSmoke/index.ts`. Also `sync/m1EdgeSweep.ts` carries `SetFieldAction` in `sync/`. Under bypass, a `Write` of any of these files is denied, since `content` is the whole file. An `Edit` is denied only when its old or new text holds the token. That is the 3.2 trigger of RC-15 decision (2), now with `deny` instead of `ask`. It is stated here because a non-critical-zone lane editing, say, `createAdapter.ts` with `Write` will be told to relaunch.
- **This session will be under the new rule once Phase 2 lands**, since the hook scripts are read at each call. Phase 2 edits none of the trigger files and pushes nothing, so the rule does not block its own lane [D].

## 6. Dependencies and risks

1. The bypass value is read, not captured (1.5). If a future build renamed the mode on the hook path, the Phase 2 branch would silently fall to `ask`, which is today's behavior: it fails toward the old gate, not open. No test can see a rename, because the tests feed the value themselves.
2. `docs/HARNESS-DOCS.md:381-382` will contradict the hooks after Phase 2 unless the GO names that file (DOVE: "Only the texts that Phase 1 finds describing the old behavior may be added, and only after the GO names them").
3. RC-16 pins `claude-opus-5-5` in `.claude/settings.json`. In this worktree, `.claude/settings.local.json` (gitignored, `.gitignore:63`) holds `"model": "claude-sonnet-5"` [R]. RC-16 says a deviation goes through that file "e si dichiarano nel prompt", and this prompt declares none. The file is out of scope ("`settings.local.json` of any worktree"). The session banner shows Opus 5.5 all the same. The finding is recorded, not acted on.
4. Six code files plus the closure commit: the lane stays within its declared DOVE unless the GO adds `docs/HARNESS-DOCS.md`. That would be a docs file, in the closure commit or a docs commit of its own, never with the code (P13).

## 7. Open questions

1. Add `docs/HARNESS-DOCS.md` (rows `:381` and `:382`) to the lane? And if so, in the closure commit with the Status line and the inbox entry, or in a docs commit of its own before the closure?
2. For T9 (`status-flip` SKILL.md:20), should the skill keep an "otherwise commit the prompt file alone" path, or state only that the flip rides in the closure commit (RC-17)?
3. Should the `critical-zone` deny under bypass also cover the five non-3.2 files that hold a creator token (§5), as RC-15 decision (2) implies, or only the six files?
4. `settings.local.json` of `~/jjodel-gate` pins `claude-sonnet-5` (§6.3): leave it as it is, since it is out of scope, or should another lane handle it?

## 8. Files read

- `/Users/alfonso/jjodel-gate/CLAUDE.md`
- `/Users/alfonso/jjodel-gate/AGENTS.md` (by search)
- `/Users/alfonso/jjodel-gate/docs/claude-code-log.md` (lines 1-120)
- `/Users/alfonso/jjodel-gate/docs/decisions.md` (lines 1-20, 84-140)
- `/Users/alfonso/jjodel-gate/docs/PROTOCOL.md` (lines 1-64, 152-270, 271-314 by search)
- `/Users/alfonso/jjodel-gate/docs/HARNESS-DOCS.md` (headings; lines 365-400)
- `/Users/alfonso/jjodel-gate/docs/ratifiche/claude_2026-09-25_1015_memo_harness_recalibration.md`
- `/Users/alfonso/jjodel-gate/docs/prompts/claude_2026-09-25_1022_prompt_harness_bypass_gates.md`
- `/Users/alfonso/jjodel-gate/docs/discovery/discovery_2026-09-21_harness_mechanization.md` (by search; lines 77, 282-335)
- `/Users/alfonso/jjodel-gate/.claude/settings.json`, `/Users/alfonso/jjodel-gate/.claude/settings.local.json`
- `/Users/alfonso/jjodel-gate/.claude/skills/status-flip/SKILL.md`, `.../discovery-report/SKILL.md`, `.../log-entry/SKILL.md` (by search)
- `/Users/alfonso/jjodel-gate/frontend/scripts/hooks/critical-zone.mjs`, `bash-guard.mjs`, `lib.mjs` (lines 1-80)
- `/Users/alfonso/jjodel-gate/frontend/scripts/hooks/__tests__/hookRunner.ts`, `criticalZone.test.ts` (lines 1-30, 120-200), `bashGuard.test.ts` (by search)
- `/Users/alfonso/jjodel-gate/frontend/vitest.config.ts:16`, `/Users/alfonso/jjodel-gate/scripts/generate-agents.mjs` (lines 1-60)
- `/Users/alfonso/.local/share/claude/versions/2.1.282` (binary, byte offsets above)
- `https://code.claude.com/docs/en/hooks` (fetched 2026-09-25)
