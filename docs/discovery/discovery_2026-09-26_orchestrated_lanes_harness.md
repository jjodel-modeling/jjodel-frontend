# Discovery: orchestrated lanes in the harness (RC-20..24), Phase 1

**Prompt-ID**: P-2026-09-26-1640. **Prompt**: `docs/prompts/claude_2026-09-26_1640_prompt_harness_orchestrated_lanes.md`.
**Session**: `a73c8ba6-ce94-46d5-bb3d-ad7a58887d1a` (interactive). **Tree**: `~/jjodel-release`, branch
`alfonso-frontend-jjtl`, HEAD `df9d7a5e0`. **Executor**: Opus 5.5 (`claude-opus-5-5`), as the session banner
shows. **Claude Code**: 2.1.283.

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the
real files. Tags: **[M]** measured in this phase, **[R]** read from a file.

## 0. Precondition, deviation

The prompt requires `git log -1` to be the commit that adds it (`d0f040002`). At session start HEAD was
`80a9eb9fd`: two later commits (`1f3167136`, `80a9eb9fd`) change only the opening `<svg>` line of
`docs/harness/lane-lifecycle-bpmn.svg` [M]. The session stopped with a question. Alfonso then paused commits on
the trunk for the merge `P-2026-09-26-1615` and released it with «il tronco è di nuovo libero». HEAD is now
`df9d7a5e0`, and between `80a9eb9fd` and HEAD the tree gained only `0e3c507ed`, `cc388d5dd` (merge) and
`df9d7a5e0`. None of them touches a DOVE file: `git diff --stat 80a9eb9fd HEAD` lists 14 files, none of them
`docs/PROTOCOL.md`, `docs/HARNESS-DOCS.md`, `CLAUDE.md`, `frontend/scripts/` or `docs/claude-code-log.md` [M].
`git status` was empty [M].

## 1. Objective and hypotheses

Objective: measure what Phase 2 must not break (skill anchors, Check A) and what `lane-run` must rely on
(stream-json, `--resume`, the shell of `osascript`) before writing either.

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | P16 and the P13 amendment can be written without moving any anchor the skills read | holds, with a placement constraint (§2) |
| H2 | The amendments leave the two blocks of Check A untouched | holds, with one constraint (§3) |
| H3 | The prompt template and the Prompt-ID rule live in HARNESS-DOCS §4.1, CLAUDE.md §6.4 and PROTOCOL P13 | partly: the rule is in P13 only; no "lane discipline section" exists anywhere in the repo (§4) |
| H4 | `claude -p ... --output-format stream-json` gives the session id in its first event, and `--resume <id>` takes a `-p` prompt | partly: the literal command fails without `--verbose`; with it, both hold, but a resume runs in the caller's cwd (§5) |
| H5 | A usable `node` and `claude` are reachable from the shell of `osascript` | falsified for an empty environment: `node` is v16.15.0, `claude` is absent (§6) |
| H6 | (added) A `-p` session launched in this tree can commit, and is gated as RC-19 and RC-20 expect | partly: it commits only in `bypassPermissions`; it runs Opus 5, not 5.5; the push gate of RC-19 is not on the trunk (§7) |

## 2. What the skills extract live (question 1)

Three skills inject a clause with `awk`, and abort on an empty extraction (`END{if(!d)exit 2}`) [R]:

- `.claude/skills/discovery-report/SKILL.md:12`:
  `` !`awk '/^## P4 /{f=1} /^## P5 /{if(f){d=1;exit}} f{print} END{if(!d)exit 2}' "${CLAUDE_PROJECT_DIR}/docs/PROTOCOL.md"` ``
- `.claude/skills/log-entry/SKILL.md:12`:
  `` !`awk '/^## YYYY-MM-DD .* type: short description$/{f=1} f{print} f&&/^\*\*Prompt document name\*\*: YYYY-MM-DD HH:mm$/{d=1;exit} END{if(!d)exit 2}' "${CLAUDE_PROJECT_DIR}/CLAUDE.md"` ``
- `.claude/skills/status-flip/SKILL.md:13`:
  `` !`awk '/^- \*\*Every prompt file carries a Status line/{f=1} /^## P14 /{if(f){d=1;exit}} f{print} END{if(!d)exit 2}' "${CLAUDE_PROJECT_DIR}/docs/PROTOCOL.md"` ``

Anchors in `docs/PROTOCOL.md` today [R]: `## P4 — Two-phase e discovery report` (line 32), `## P5 — Critical zone`
(45), `- **Every prompt file carries a Status line, flipped once, in the lane's closure commit.**` (256),
`## P14 — Worktrees and cherry-picks` (271). The log-entry anchor is in `CLAUDE.md`, which this lane does not
touch.

Consequences for Phase 2:

1. **No anchor has to move.** `## P16 — ...` matches none of `^## P4 `, `^## P5 `, `^## P14 ` (the trailing space
   excludes `P14`..`P16` from `^## P1`-style prefixes, and no skill uses one).
2. **The status-flip window is the Status bullet through the line before `## P14 `.** Text appended to P13 below
   the Status bullet is injected into that skill. The P13 amendments go above the Status bullet: the RC-24 text
   near the opening paragraph, the `Outcome` and `Recommended` sentences inside the Prompt-ID bullet (240-250).
3. P16 goes after P15 (ends at line 344) and before the `---` of «Nota di implementazione per P8» (346).

## 3. What Check A compares (question 2)

`frontend/scripts/gates/check-docs.ts:64-65` [R]:

```
const BLOCK_START = '## YYYY-MM-DD — type: short description';
const BLOCK_END = '**Prompt document name**: YYYY-MM-DD HH:mm';
```

`extractBlock` (106-149) splits the file on `\n`, requires **exactly one** line equal to `BLOCK_START` («start anchor
appears N times ... extraction would be ambiguous», 122), takes lines up to the first `BLOCK_END`, and
`checkBlockIdentity` (151-210) compares the two strings byte for byte. In `docs/PROTOCOL.md` the block is lines
98-109 (inside P9) [R].

Constraint: no amended text may contain a line equal to `BLOCK_START`. A P8 or P16 sentence that quoted the
entry heading as a line of its own would turn Check A red with «ambiguous», not with a diff. Lines 97-110 stay
untouched.

Check B does not lint `Smoke visivo`: `command grep -n -i 'smoke' frontend/scripts/gates/log-tools.ts` returns
nothing, while the control `command grep -c -i 'causa'` on the same file returns 10 [M]. So the RC-23 value
`passato — chat, unattended, <n>/<n>` passes the gate as it stands. It carries an em dash, which is part of the
ratified form and is quoted as such, not written as prose.

## 4. Where the template and the Prompt-ID rule live (question 3)

- **Prompt-ID rule**: `docs/PROTOCOL.md:240-250`, the bullet «Every prompt has an ID, and every message on it carries
  the ID.» [R]. It holds the reply form `[P-YYYY-MM-DD-HHmm · session <id>]` and the `session unknown` rule.
- **`CLAUDE.md` §6.4** (line 360) is a pointer only: «Moved to `docs/PROTOCOL.md` (P13) on 2026-09-18 ...
  prompt-ID discipline on messages (RC-13, `docs/decisions.md`).» [R]. It holds no rule, so this lane does not
  touch `CLAUDE.md`. P15 owes nothing: this is the trunk, the one home of `CLAUDE.md` (`docs/PROTOCOL.md:325`).
- **`docs/HARNESS-DOCS.md` §4.1** (101-146) has the only prompt skeleton in a normative file (117-132) [R]:
  `> **Nome del documento prompt**: YYYY-MM-DD HH:mm`, the protocol line, `Leggi CLAUDE.md. Branch: ...`, and the
  sections `Contesto / COSA / HARD STOP / NON FARE / RIFERIMENTI`. It has **no** `Prompt-ID`, `Chat`, `Lane` or
  `Status` line, although P13 requires three of them (252-269), and no lane discipline section.
- **"Lane discipline section"**: the phrase appears only in `docs/decisions.md:149` (RC-20) and in the ratification
  memo. `command grep -rln -i 'lane discipline\|disciplina di corsia'` over `docs/ CLAUDE.md .claude/` finds no
  template holding such a section [M]. Control on the same search: it does find
  `docs/prompts/claude_2026-09-15_1030_prompt_lane_h_claude_md_two_rules.md:31` («## Parallel-lane discipline»).
  The two knowledge-base templates of P10 have repo copies in `docs/archivio/template-task-visivi.md` (11 lines)
  and `docs/archivio/template-ir-authoring.md` (25 lines), last touched `e14c2b17d` (2026-08-14). Both are recovery
  checklists, not skeletons, and neither has an ID, Lane, Status or reply line [R].
- **What the prompts actually use**: recent prompts (`claude_2026-09-26_1535_...:1-9`, `..._1615_...:10`,
  `..._1640_...:3-13`) open with `Prompt-ID`, `Chat`, `Lane`, `Status`, then a Worktree paragraph with the
  preconditions and «Every reply of this session opens with ...» [R]. The skeleton the chat writes them from is
  not in the repo. Its likeliest home is the chat's project instructions or knowledge base, which this session
  cannot read.

This meets a stop condition of the prompt («the prompt template lives in a place this prompt did not name»):
question 6.

Stale references to the clause range [M], `command grep -rn 'P1\.\.P15'`: `CLAUDE.md:14`, `CLAUDE.md:108`,
`docs/PROTOCOL.md:11`, `docs/HARNESS-DOCS.md:122`, `:344`, `:358`. The last four are in DOVE. The two in `CLAUDE.md`
are outside the §6.4 perimeter: question 9.

The P13 limit that RC-24 replaces, «at most two sessions on the shared tree on disjoint files», **is not in P13**.
`command grep -rn -i 'two sessions\|due sessioni\|at most two'` over `docs/PROTOCOL.md docs/HARNESS-DOCS.md
CLAUDE.md docs/decisions.md .claude/ frontend/scripts/` finds only `docs/decisions.md:183` (RC-24 itself) [M]. On
all of `docs/`, the nearest source is a session checkpoint, `docs/sessioni/claude_sessione_2026-08-05_5.md:50`:
«Mai due sessioni che scrivono su KB o repo in contemporanea senza perimetri di file disgiunti dichiarati in
apertura.» P13 opens the other way round (`docs/PROTOCOL.md:210-211`): «Piu' sessioni lavorano sullo **stesso
working tree** nello stesso momento. Non e' un caso limite: e' la condizione normale di questo repo». Question 7.

## 5. The dry run of `claude -p` (question 4)

All runs were made in `/private/tmp/claude-501/.../scratchpad/`, outside the repo (`git rev-parse` there: «fatal:
not a git repository»), with `env -i HOME USER PATH=$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin`, so that no
variable of this session leaks into the child [M]. Nothing was committed to the repo.

**Command 1, as the prompt writes it** [M]:

```
$ claude -p "Reply with the single word ok" --output-format stream-json
Error: When using --print, --output-format=stream-json requires --verbose
```

Exit 1, empty stdout. The command fails, so this is question 2, not a workaround.

**Command 1 with `--verbose`**, recorded as a measure for the question and not adopted [M]:

```
$ claude -p "Reply with the single word ok" --output-format stream-json --verbose
{"type":"system","subtype":"commands_changed","commands":[{"name":"deep-research","description":"Deep research harness — fan-out web searches, ...
```

Exit 0, 7 lines. Events in order: `system/commands_changed` (37089 bytes, the whole command list),
`system/commands_changed`, `system/init`, `assistant` (text `ok`), `rate_limit_event`, `system/commands_changed`,
`result/success` (`"result":"ok"`, `num_turns` 1, `duration_ms` 4427). **Every event carries `session_id`**, the
first one included: `"session_id":"467dcf71-a51c-4c15-a72b-c459bd6fa05c"`. The first event is not `system/init`,
so `lane-run` takes the id from the first line that has one, not from a named event type. `init.model` was
`claude-opus-5-5` (no project settings there), `init.permissionMode` was `auto`. Cost of the call: 0.13 USD.

**Command 2, resume with a new prompt** [M]:

```
$ claude -p --resume 467dcf71-a51c-4c15-a72b-c459bd6fa05c "What was the single word you replied last time? Reply with that word followed by the word two" --output-format stream-json --verbose
{"type":"system","subtype":"commands_changed","commands":[{"name":"deep-research","description":"Deep research harness — fan-out web searches, ...
```

Exit 0, 5 events, all with the **same** `session_id`, assistant text `ok two`: `--resume` accepts a `-p` prompt and
keeps the context.

**Resume from another directory** [M]: the same resume run from a sibling directory `othercwd/` succeeded, same
`session_id`, and its `system/init` reported `"cwd":".../scratchpad/othercwd"`. A resume runs in the caller's
cwd, not in the session's original one. A `lane-run resume` launched from the wrong place would put the resumed
lane on another tree, which is the incident class of P13. Question 3.

**Prompt on stdin** [M]: `claude -p ... < prompt.txt` works, as the §7 probes did. Either argv or stdin can carry the
prompt file's content.

## 6. The Node of a non-interactive launch (question 5)

Login shell [M]: `which -a node` gives `/opt/homebrew/opt/node@22/bin/node` first (v22.23.3), then
`~/.local/bin/node` (v26.8.1, a symlink to `~/.hermes/node/bin/node`), `/opt/homebrew/bin/node` (v23.3.0) and
`/usr/local/bin/node` (v16.15.0). `claude` is `~/.local/bin/claude` -> `~/.local/share/claude/versions/2.1.283`.

`osascript` inherits the environment of its caller, so there are two measures [M]:

- Called from this session: `do shell script` sees this session's full PATH (node@22 first). This does not
  represent the chat's launch.
- Called with an empty environment (`env -i HOME USER /usr/bin/osascript -e 'do shell script "..."'`): PATH is
  `/usr/gnu/bin:/usr/local/bin:/bin:/usr/bin:.`. `command -v node` gives `/usr/local/bin/node`, **v16.15.0**, and
  `command -v claude` exits 1. The control `command -v git` gives `/usr/bin/git` through the same call. (`which
  node` printed nothing in the same shell, so the verdict rests on `command -v`.)

The chat's bridge environment is not measurable from here. Inside the launched session the hooks need nothing
above node 16 (`frontend/scripts/hooks/lib.mjs:5-7`). But `npm run check:docs` and `check:scripts` run
`node --experimental-strip-types` (`frontend/package.json:100,102`), which v16 does not have. A launched lane
whose PATH starts with `/usr/local/bin` would fail its own gates. Question 11.

## 7. Can a launched session commit, and under which gates (added, H6)

Probes in fresh `git init` repositories under the scratchpad, each with a `.claude/settings.json` that copies the
trunk's pin and `ask` list (`"model": "claude-opus-5"`, `"ask": ["Bash(git commit*)", "Bash(git push*)"]`) [M]:

| Mode | `init.model` | Outcome | `permission_denials` |
|---|---|---|---|
| `--permission-mode default` | `claude-opus-5` | «refused ... this session is non-interactive so it can't be granted here» | 2 (the commit, then `echo x > f.txt`) |
| `--permission-mode bypassPermissions` | `claude-opus-5` | `committed`, `311110a probe` in the probe repo | 0 |

A PreToolUse hook that answers `ask` (like `critical-zone.mjs` on the trunk), under `-p` and `bypassPermissions`:
the Write was refused with the hook's reason as `tool_result` («probe: hook ask», `is_error: true`), listed in
`permission_denials`, and no file was written. The hook log recorded `{"tool":"Write","mode":"bypassPermissions"}`
[M]. This is RC-20's «an `ask` is a refusal with its reason», measured.

What follows for the trunk:

1. `.claude/settings.json:3` pins `"model": "claude-opus-5"` [R], and the project pin overrides the user default
   (both probes ran `claude-opus-5` while the user default is Opus 5.5) [M]. RC-16's `claude-opus-5-5` is on
   `harness-bypass` (`cd5eb9eb5`, «pin Opus 5.5»), 3 commits not in the trunk
   (`git merge-base --is-ancestor harness-bypass HEAD`: not an ancestor) [M]. An orchestrated lane in
   `~/jjodel-release` today runs Opus 5.
2. Without `bypassPermissions` a launched lane cannot commit. With it, the settings `ask` on `git commit*` does not
   hold (0 denials). By the same mechanism the `ask` on `git push*` would not hold either (inferred, not measured:
   no push was attempted). The push deny of RC-19 is in `bash-guard.mjs` on `harness-bypass`, not on the trunk.
   Question 5.
3. The critical-zone gate holds in a launched session, as a refusal (the hook's `ask`).

## 8. Where the tests go

`frontend/vitest.config.ts:16` [R]: `include: ['src/**/__tests__/**/*.test.ts', 'scripts/gates/__tests__/**/*.test.ts',
'scripts/hooks/__tests__/**/*.test.ts']`. A test at `frontend/scripts/__tests__/lane-run.test.mjs` would not be
collected, neither by its folder nor by its extension, and adding a glob means editing `vitest.config.ts`, which
is outside DOVE. The folder the hook tests use is collected as it stands, and its runner already has the
mutation-bench switch (`HOOKS_DIR`, `frontend/scripts/hooks/__tests__/hookRunner.ts:5-7`). Question 10.

`check:scripts` walks `frontend/scripts` including `.mjs` (`check-scripts.ts:32`) [R]: `lane-run.mjs` falls under
it. `typecheck:scripts` includes `smoke/**/*.ts` and `gates/**/*.ts` only (`frontend/scripts/tsconfig.json`)
[R]: neither the hooks nor `lane-run.mjs` are type-checked, as today.

## 9. Name checks

`command grep -rln 'lane-run' .` [M], exit 0, 4.1 s: `docs/ratifiche/claude_ratifiche_2026-09-26_orchestrated_lanes.md`
and `docs/prompts/claude_2026-09-26_1640_prompt_harness_orchestrated_lanes.md`, the two documents that commission
the script, and nothing else. The prompt's «must be empty» holds for every file except those two. Positive control,
same command: `bash-guard` matches `frontend/scripts/hooks/bash-guard.mjs`, its test, `.claude/settings.json`,
`docs/HARNESS-DOCS.md` and more. `P16`: `command grep -rn '\bP16\b'` over the normative files, skills and scripts
returns nothing, while `P13` counts 3 in `docs/HARNESS-DOCS.md` through the same tool [M].

## 10. Risks

1. The status-flip window (§2.2): an amendment placed under the Status bullet changes what `/status-flip` injects,
   silently. Not a failure, but a drift.
2. A resume from the wrong cwd (§5) runs a lane on the wrong tree, and nothing in `claude` refuses it.
3. The trunk is behind RC-16 and RC-19 (§7): Opus 5 instead of 5.5, and no push deny under bypass. RC-20's first
   orchestrated lane (lane C of the simulator) would run in `~/jjodel-sim`, whose pin is also `claude-opus-5`
   [M, `git show simulation-engine:.claude/settings.json`].
4. `osascript`'s PATH (§6): a launched lane that finds node 16 first fails its own gates, and the chat reads that as
   the lane's failure.
5. The first event of the stream is 37 KB: a reader that buffers per line is fine, but one that scans for
   `system/init` waits needlessly.

## 11. Files read

`/Users/alfonso/jjodel-release/CLAUDE.md`; `/Users/alfonso/jjodel-release/docs/PROTOCOL.md` (whole);
`/Users/alfonso/jjodel-release/docs/decisions.md` (1-20, 84-186); `/Users/alfonso/jjodel-release/docs/ratifiche/claude_ratifiche_2026-09-26_orchestrated_lanes.md`;
`/Users/alfonso/jjodel-release/docs/HARNESS-DOCS.md` (1-12, 95-147, 211-276, 332-430); `/Users/alfonso/jjodel-release/docs/claude-code-log.md` (1-30, headings);
`/Users/alfonso/jjodel-release/docs/log-inbox/harness.md`; `/Users/alfonso/jjodel-release/.claude/skills/{discovery-report,log-entry,status-flip}/SKILL.md`;
`/Users/alfonso/jjodel-release/.claude/settings.json` (model, permissions, hook keys); `/Users/alfonso/jjodel-release/frontend/scripts/gates/check-docs.ts` (1-215);
`/Users/alfonso/jjodel-release/frontend/scripts/gates/check-scripts.ts` (1-40); `/Users/alfonso/jjodel-release/frontend/scripts/hooks/bash-guard.mjs` (1-40);
`/Users/alfonso/jjodel-release/frontend/scripts/hooks/lib.mjs` (1-30); `/Users/alfonso/jjodel-release/frontend/scripts/hooks/__tests__/hookRunner.ts` (1-40);
`/Users/alfonso/jjodel-release/frontend/scripts/hooks/__tests__/bashGuard.test.ts` (1-30); `/Users/alfonso/jjodel-release/frontend/scripts/gates/__tests__/checkDocs.test.ts` (60-100);
`/Users/alfonso/jjodel-release/frontend/scripts/tsconfig.json`; `/Users/alfonso/jjodel-release/frontend/vitest.config.ts` (include line);
`/Users/alfonso/jjodel-release/docs/archivio/template-task-visivi.md`; `/Users/alfonso/jjodel-release/docs/archivio/template-ir-authoring.md`;
`/Users/alfonso/jjodel-release/docs/prompts/claude_2026-09-26_1535_prompt_sim_petri_else_panel_lines.md` (1-16);
`harness-bypass:docs/discovery/discovery_2026-09-25_harness_bypass_gates.md` (by grep); `harness-bypass:.claude/settings.json`.

## 12. Questions

Each carries one recommendation, in the form of RC-21.

1. Log entry: the prompt says `docs/claude-code-log.md`, but P9 (`docs/PROTOCOL.md:128`), the log-entry skill and the existing `docs/log-inbox/harness.md` say inbox, and the active log is at 40 entries, where one more turns Check D red.
   Recommended: write the entry and any ticket in `docs/log-inbox/harness.md`, not in the active log.
2. `stream-json` under `-p` requires `--verbose` (§5).
   Recommended: `lane-run` always passes `--output-format stream-json --verbose`.
3. A resume runs in the caller's cwd (§5).
   Recommended: `start` records the absolute worktree in `<dir>/worktree.txt`; `resume` runs there and refuses without it; one more test and mutant.
4. Permission mode: a launched lane cannot commit in `default` mode (§7), and RC-19 runs sessions in bypass.
   Recommended: `lane-run` always passes `--permission-mode bypassPermissions`, and a test asserts the fake `claude` received it.
5. The trunk is behind RC-16 and RC-19 (Opus 5 pin, no push deny under bypass; `harness-bypass` not merged, §7).
   Recommended: `lane-run` passes no `--model` (RC-16: one place); a high-priority ticket asks to merge `P-2026-09-25-1022` into the trunk and the simulator branch before the first orchestrated launch.
6. The prompt template has no lane discipline section anywhere in the repo, and the skeleton in HARNESS-DOCS §4.1 predates the P13 header (§4).
   Recommended: in §4.1 replace the skeleton's header with the P13 fields (`Prompt-ID`, `Chat`, `Lane`, `Status`, the worktree preconditions) and add a "Lane discipline" block with the reply-ID line, the `Outcome` line and the `Recommended:` form; the chat updates its own copy.
7. The text RC-24 replaces is not in P13, which declares shared trees the normal condition (§4).
   Recommended: amend P13 with a dated paragraph right after its opening one (RC-24: one worktree and one branch per lane, merges one at a time, RC-22's checks at launch; the shared-tree rules below stay for trees that still host more than one session), above the Status bullet.
8. P16's position (§2).
   Recommended: after P15 and before the `---` of the P8 implementation note; bump PROTOCOL to 1.6 and the range line to `P1..P16` in `PROTOCOL.md:11` and in HARNESS-DOCS 122, 344, 358.
9. `CLAUDE.md:14` and `:108` say `P1..P15`, outside the §6.4 perimeter.
   Recommended: leave `CLAUDE.md` untouched in this lane and record a low-priority ticket (a fix there regenerates `AGENTS.md`, two files outside DOVE).
10. Test location (§8).
    Recommended: `frontend/scripts/hooks/__tests__/laneRun.test.ts`, collected by the existing include, with a `LANE_RUN` switch for the mutation bench like `HOOKS_DIR`; `vitest.config.ts` untouched.
11. Node and PATH for the launch (§6).
    Recommended: the chat runs `~/.local/bin/node <tree>/frontend/scripts/lane-run.mjs ...` by absolute path; the script resolves `claude` on PATH, else `~/.local/bin/claude`, and puts the directory of its own `process.execPath` first on the child's PATH, so the lane's gates find node 26.
