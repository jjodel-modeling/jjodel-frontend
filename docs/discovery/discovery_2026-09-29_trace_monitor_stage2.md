# Discovery: trace monitor stage 2, requirement files, the `Requirement:` header and the T6 changes

**Prompt-ID**: P-2026-09-29-0404. **Prompt**: `docs/prompts/claude_2026-09-29_0404_prompt_discovery_trace_monitor_stage2.md`.
**Chat**: C-2026-09-28-1936. **Session**: `ce7f4739-75b4-402e-b917-fb2951aeec45` (launched by `lane-run`, tier heavy).
**Tree**: `~/jjodel-w-trace2`, branch `trace-stage2-disc`, HEAD `a3721aaa3` (the trunk `1430054fe` plus this prompt).
**Executor**: Opus 5.5 (`claude-opus-5-5`), as the session banner shows. **Claude Code**: 2.1.284.

This report is a set of hypotheses with evidence, not a reference: whoever uses it downstream rereads the real files.
Tags: **[M]** measured in this phase (repo at `a3721aaa3`, trunk tree `~/jjodel-release` at `1430054fe`, lanes
`~/.jjodel-lanes/` at 2026-09-29 04:05-04:15 CEST), **[R]** read from a file.

## 0. Answer in brief

Stage 2 is writable without guesses. `REQ-`, `docs/requirements`, `Requirement:` are still free, `Check:` is free in
prompt headers and scripts (§3) [M]. The stage 1 indexer on the trunk: 2991 nodes, 1839 edges, 284 misses, 1.2 s; 0
requirement nodes, 0 `Requirement:` or `Check:` lines in 574 prompt headers (§2) [M]. Stage 1 tests: 29 green [M].

- **Format.** `docs/requirements/REQ-<n>.md` as stage 1 §8.4, plus one header `Check: <repo path of a tracked probe>`.
- **Prompt header.** One optional line `Requirement: REQ-<n>[, REQ-<m>]` or `Requirement: —`. Its absence is never
  a miss, so every old prompt stays valid; the header readers of `lane-run` (id, Status, Lane, tier) ignore it (§4).
- **T6, four rules**, each a miss or a computed attribute, never a failure (§5):
  1. Reserved: `REQ-n` cited by a `Requirement:` or `Parent:` links only if `docs/requirements/REQ-n.md` is in the
     trunk tree (`git ls-tree <trunk>`); otherwise a miss.
  2. Fresh: a run verifies only when it ran on a tree containing the latest implementing commit (a commit citing a
     realizing prompt and touching outside `docs/`). Measured on today's 28 dated checks: counting docs commits too,
     20 would be stale (the closure commit always follows the probe); counting code commits only, 7 of 25 are, the
     lanes that probed before committing, which is what the rule rejects.
  3. `Check:` names a tracked script, joined to runs by the `probe=` line `lane-run probe` writes. Today every run
     record names an untracked script (89 of 89), 23 of 24 distinct scripts are `_tmp_*`, 9 of 24 no longer exist.
  4. Retired: a prompt at `Status: da eseguire` citing a `retired` REQ is a miss (5 open prompts today, 4 of them
     stale since 2026-09-18).
- **Gates.** `trace:index` is not among `lane-run merge`'s gates and exits 0 whatever its misses; `check:docs` reads
  no prompt file. Stage 2 adds no gate, so no merge of today can be blocked by it (§6). Rule 11 applies: the
  exported `ParsedPrompt`, `RepoInput` and `CheckInput` only gain optional properties.

Recommended: one Phase 2 lane, heavy tier, seven files in this order: `lane-run.mjs` (`head=` and `dirty=` in
the probe log) with `laneRun.test.ts`; `trace-index.ts` with `traceIndex.test.ts`; `trace-monitor.ts` (re-index
on `docs/requirements`) with `traceMonitor.test.ts`; `docs/HARNESS-DOCS.md` (§3, §4.1, a new card, §8). The P16
line is written by the chat on the trunk after the merge, as for stage 1 (`df0487f94`). After MODELS (§8).

**Decisions awaiting Alfonso.** A1: which requirements exist and who writes them. Recommended: the chat writes a
REQ file at `proposed` from his request; `accepted` and `retired` only on his word, quoted with its date.

**Questions.** Q1: freshness by ancestry (`head=`) or by time? Recommended: ancestry, time only for legacy logs.
Q2: does RC-27 apply to the two probe-log lines of U3? Recommended: yes, one second opinion on U3 before the GO.

## 1. Hypotheses

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | `REQ-`, `docs/requirements`, `Requirement:`, `Check:` are free names | **holds** for the first three; `Check:` **partly**: 5 bold `**Check:**` lines in two unrelated docs, none in a prompt header or a script (§3) |
| H2 | the stage 1 indexer already carries the stage 2 types | **holds**: `requirement` node, `realizes`, `parent`, `verifies` edges declared, never produced (§2) |
| H3 | a `Requirement:` header is additive for every current reader | **holds** (§4) |
| H4 | today's probe logs can decide freshness | **partly**: 29 of 108 checks carry `end=`, 2 of those without a date, none records the tree it ran on (§5.2) |
| H5 | the check a REQ names can be found again later | **falsified today**: every run names an untracked script (§5.3) |
| H6 | a stage 2 rule can block today's merges | **falsified**: neither `check:docs` nor the merge gates read what stage 2 adds (§6) |

## 2. The stage 1 indexer on the trunk [M]

Probe `frontend/scripts/smoke/_tmp_trace_stage2_probe.ts` (gitignored by `.gitignore:68`), `npx tsx`, exit 0, calling
`collect()` of `frontend/scripts/gates/trace-index.ts` on each tree with the real `~/.jjodel-lanes`. Control: the
trunk ref and the HEAD of `~/jjodel-release` are both `1430054fe`.

| Tree | Nodes | Edges | Misses |
|---|---|---|---|
| `~/jjodel-release` (trunk, `1430054fe`), 1164 ms, 1246 sources | 2991: chat 26, check 108, commit 908, decision 235, lane 138, logEntry 1388, prompt 188 | 1839: cites 735, citesDecision 201, closedBy 160, corrects 25, decidedIn 120, foundIn 29, measures 108, openedBy 173, reports 155, runs 133 | 284: commit 168, decision 28, lane 5, logEntry 40, prompt 43 |
| this tree (`a3721aaa3`), 1563 ms, 1247 sources | 2992 (prompt 189) | 1842 (cites 736, openedBy 174, runs 134) | 282 (commit 167, lane 4) |

The one-prompt difference is this lane's prompt: on the trunk its lane folder has no prompt (lane miss 5 vs 4).
Miss reasons on the trunk, largest first: `commit | cites no prompt` 146, `logEntry | Prompt document name names P-…,
no such prompt` 28, `commit | cites P-…, no such prompt` 22, `prompt | no Lane: line` 22, `decision | no prompt or
chat cited` 17, `decision | near miss` 11, `prompt | no Chat: line` 11, `logEntry | Corregge names P-…` 9, `prompt |
no Status: line` 8, lane 5, `logEntry | no Prompt document name` 2, `prompt | no Prompt-ID` 2, `Found in` 1.

Stage 2 hooks already in place [R]: `trace-index.ts:49` «`| 'check' | 'requirement'`»; `:50-52` edge types end with
«`'measures' | 'realizes' | 'parent' | 'verifies'`»; no function creates either. Tests: `npx vitest run` on
`traceIndex.test.ts` and `traceMonitor.test.ts`, **29 passed**, exit 0 [M].

## 3. Names [M]

`git grep` without `\b` (the stage 1 report, §6.1, found `\b` broken under `git grep -E`). Control: `git grep -c -E
'RC-[0-9]' -- docs/decisions.md` → 77.

| Search | Result |
|---|---|
| `git grep -I -n -E 'REQ-[0-9]'` | 0 lines |
| `git grep -I -n 'REQ-'`, `'docs/requirements'`, `'Requirement:'` | only the stage 1 report, the stage 1 prompt and this prompt |
| `git ls-tree -r --name-only alfonso-frontend-jjtl -- docs/requirements` (control `docs/ratifiche`: 61 files) | exit 0, 0 files |
| `git grep -I -n -E '^\**Check\**:'` | 5 lines: `docs/ai-agents/README.md:281,289,297,305`, `frontend/src/jjel/SPEC.md:496`, all `**Check:**` in prose |
| `^Check:` in the header (before the first `## `) of the 574 prompt files (control `^Chat:` in the same loop: 185) | 0 |
| `git grep -n -E 'Check=\|CHECK=\|REQ=' -- frontend/scripts` | 0 |
| the same on the 64 local branch tips (control `RC-[0-9]` in `docs/decisions.md`: 57 tips) | `REQ-[0-9]` 0; `^Requirement:` 0; `^Check:` only the two prose files; no `docs/requirements` tree |
| key census of the lanes' `probe-*.log` lines `^[A-Za-z_]+=` | `CFG` 92, `EXIT` 96, `end` 90, `probe` 88, `server` 92, `url` 88: `head` and `dirty` are free |

## 4. The requirement file and the prompt header

### 4.1 `REQ-<n>.md` [R]

Stage 1 §8.4 (`docs/discovery/discovery_2026-09-27_trace_monitor.md:389-411`), unchanged but for one line, the T6
`Check:` header (memo `docs/ratifiche/claude_ratifiche_2026-09-28_open_lanes_answers.md:9` «a machine-readable
`Check:` header names the measuring check»):

```
# REQ-<n>: <title, one line>

Status: proposed | accepted | retired
Parent: REQ-<m>            (optional, one level)
Chat: C-YYYY-MM-DD-HHmm
Requested: YYYY-MM-DD
Check: <path from the repo root of a tracked probe script>   (optional until accepted)

## Statement
## Rationale
## Acceptance
```

Location `docs/requirements/`, as D4 fixes it (`claude_2026-09-27_1030_prompt_trace_monitor_discovery.md:26`
«Requirements live in `docs/requirements/REQ-<n>.md`, written by the project chat from Alfonso's request»). Read by
the indexer from the working tree of `--repo`, as the prompts are (`trace-index.ts:684-688`), plus the trunk listing
for rule 1. Header parsing reuses the shape of `parsePrompt` (`:122-125`, `field()` on the lines before the first
`## `). Misses: file name and `# REQ-n` disagree; `Status` outside the three words; `Parent` unknown or itself with a
parent; `Check:` absent on an `accepted` REQ; `Check:` path not tracked on the trunk.

Computed, never written (D5, `…_1030_…discovery.md:27`): `implemented` (a realizing prompt is `eseguito`),
`verified` and `stale` (§5.2), `citedOpen` (open prompts citing it).

### 4.2 The `Requirement:` header [R] [M]

One line in the header: `Requirement: REQ-3` or `Requirement: REQ-3, REQ-7` or `Requirement: —`; the ids read with
`/REQ-\d+/g`. Edge `realizes` prompt → requirement, declared in the prompt (born later, D2). A line that is not `—`
and names no id is a miss. No `Requirement:` line is **never** a miss, from any date: the 574 files, 196 with a
Prompt-ID [M], stay valid.

Other readers of the header, none affected [R]: `lane-run.mjs:264` `headerPromptId` (the `Prompt-ID` line only);
`:989-992` `headerStatus` (`^Status:`); `:433` `tierRule` reads `^Lane:` and `:440` looks for critical-zone names in
the header, which a line of REQ ids cannot contain; `trace-index.ts:138-146` reports only `Chat`, `Lane`, `Status`
and the id as missing. `check:docs` does not read prompts: `command grep -n prompts
frontend/scripts/gates/check-docs.ts` 0 lines (control `log-inbox` 3). The template to amend is
`docs/HARNESS-DOCS.md:119-124` (the header block of §4.1), one optional line after `Status:`.

## 5. The T6 changes as rules, with their tests

Source of the four: memo `docs/ratifiche/claude_ratifiche_2026-09-28_open_lanes_answers.md:9` [R]. Each test name
states the mutation that kills it (CLAUDE.md §5).

### 5.1 Reserved ids

Rule: an id cited by a prompt's `Requirement:` or a REQ's `Parent:` links only when `docs/requirements/REQ-<n>.md`
is in `git ls-tree -r --name-only <trunk> -- docs/requirements`; a REQ file present in the working tree and absent
on the trunk is a node flagged `reserved: false` and a miss `REQ-n not reserved on the trunk`. The trunk commit of
the file is the reservation; two chats picking the same `n` in the one trunk tree meet the file, not a merge.
Chat-scoped ids (the memo's alternative) are not needed with one trunk tree. `RepoInput` gains an optional
`reserved?: Set<string>`, read in `readRepo` beside the `rev-list` of `:698`.
Test: *kills "reservation read from the working tree"*: REQ-2 in the tree, not in the trunk listing, cited → miss,
no `realizes` edge; with REQ-2 in the listing → the edge.

### 5.2 Freshness [M]

Today's probe logs [M]: 108 check nodes; 32 with `EXIT=`, 31 of them 0; 29 with `end=`. Kinds: `probe-*` with
`EXIT=` and `end=` 27; `probe-*` with neither 76 (the scene probes of the merges and sessions, e.g.
`P-2026-09-27-2105/probe-sm.log`, written without `lane-run probe`); `chat_probe*` 5, of which 2 with an undated
`end=03:19:59`. `lane-run probe` writes `probe=`, `CFG=`, `url=`, `server=` before the run and `EXIT=`, `end=` after
(`lane-run.mjs:853`, `:865`): nothing records the tree's commit or whether it was dirty.

Measure of the rule on today's data (each dated check against the commits that cite its lane's prompt):

| Latest implementing commit counted as | Fresh | Stale | Other |
|---|---|---|---|
| any citing commit | 8 | 20 | 1 lane with no citing commit |
| a citing commit touching outside `docs/` | 18 | 7 | 3 with no such commit |

The first row makes every closure docs commit (RC-17) invalidate the probe before it: the implementing commit must
exclude docs-only commits. The 7 stale in the second row are real (e.g. `P-2026-09-27-1501/probe-after.log`, end
15:12:40 CEST, code commit `50c198da5` at 15:14:55): a lane that probes, then commits, has not verified the commit.

Rule: `verified` when some run of the REQ's `Check:` script has `EXIT=0`, no `^FAIL`, and its `head=` contains the
latest implementing commit (`git merge-base --is-ancestor`) with `dirty=0`; a legacy run without `head=` falls back to
`end=` ≥ the commit's committer date and is marked `freshness: time`; an undated `end=` is a miss. `stale` when a run
passed but none is fresh. `lane-run probe` adds `head=<sha>` and `dirty=<n>` (lines of `git status --porcelain`) to
the header it already writes at `:853`; `parseCheck` (`trace-index.ts:446-456`) ignores unknown keys, so old and new
logs parse alike. `CheckInput` gains optional `probe?`, `head?`, `dirty?`.
Tests: *kills "docs commits count as implementing"*, *kills "a probe before the commit verifies it"*, *kills "a dirty
run verifies"*, *kills "the time fallback used when head= is there"*; in `laneRun.test.ts`, *kills "head= not written"*.

### 5.3 The `Check:` header [M]

Join: the run's `probe=` path ends with `/` + the REQ's `Check:` path (the `probe=` value is absolute in the lane's
worktree). Only folders named `P-…` are read (`trace-index.ts:739-742`): a run meant to verify needs `lane-run probe
--id`; the only non-`P-` folder today is `probe-kit`, not a probe run. Measured: 24 distinct `probe=` scripts, 23 of
them `_tmp_*`; 89 of 89 run records name an untracked file (positive control through the same `git ls-files
--error-unmatch`: `frontend/scripts/lane-run.mjs` tracked); 9 of the 24 no longer exist. The counts move: the lane
P-2026-09-29-0356 was appending probe runs meanwhile (`probe=` lines 88 in the probe at 04:07, 89 at this grep, 90
at 04:12), so the figures of §2 and §5 hold for their minute. A verification whose script
is gone cannot be rerun, so `Check:` names a tracked path, and an untracked one is a miss.
Tests: *kills "the join by basename"* (two worktrees, same name, other path), *kills "an untracked Check accepted"*.

### 5.4 Retired and still cited

Rule: a prompt whose Status reads `da eseguire` (`parsePrompt`, `trace-index.ts:153`) and whose `Requirement:` names
a `retired` REQ is a miss; an executed prompt citing it is history, no miss. Today 5 prompts are open [M]:
P-2026-09-18-1930, -1940, -2055, -2110 (Status never flipped) and this one.
Test: *kills "executed prompts reported"*, *kills "retired not read"*.

## 6. Gates [R] [M]

- `lane-run.mjs:1332` «`const GATES = ['typecheck', 'typecheck:scripts', 'vitest', 'build', 'check:docs',
  'check:agents', 'check:scripts'];`» plus `check:addonly` (`:1672`): `trace:index` is not one.
- `trace-index.ts:30` «Exit 0 when the index is built, whatever its misses». Every stage 2 rule is a miss.
- `check:docs` (`check-docs.ts:3-29`, checks A-D) reads `CLAUDE.md`, `PROTOCOL.md`, the log, the archive and the
  inboxes; no prompt, no REQ file. `check:addonly` covers the three log files only: a REQ file edited from
  `proposed` to `accepted` is outside it.
- What stage 2 does add to the gates: its tests join `vitest`; its code must pass `typecheck:scripts` and
  `check:scripts` (CLAUDE.md §17). A future `check:trace` gate (misses above a baseline fail) is stage 3's question.

## 7. Phase 2 file list (rule 19: more than five files, the Phase 2 prompt lists them)

| # | File | Change |
|---|---|---|
| 1 | `frontend/scripts/lane-run.mjs` | `probe`: `head=` and `dirty=` in the header write of `:853` |
| 2 | `frontend/scripts/hooks/__tests__/laneRun.test.ts` | the two lines written |
| 3 | `frontend/scripts/gates/trace-index.ts` | `parseRequirement`; `Requirement:` in `parsePrompt`; trunk listing in `readRepo`; `realizes`, `parent`, `verifies` edges; the rules of §5; optional properties only (rule 11) |
| 4 | `frontend/scripts/gates/__tests__/traceIndex.test.ts` | the tests of §4 and §5 |
| 5 | `frontend/scripts/gates/trace-monitor.ts` | `repoSignature` (`:123`) watches `docs/requirements` too |
| 6 | `frontend/scripts/gates/__tests__/traceMonitor.test.ts` | a REQ file added re-indexes |
| 7 | `docs/HARNESS-DOCS.md` | §3 row, §4.1 optional header line, a card for the REQ file, §8 naming row |

Order: 1-2 first (independent, one commit), then 3-4, then 5-6, then 7 in the closure commit. No `docs/requirements/`
file is written by the lane (A1). `docs/PROTOCOL.md` is a governance file (`lane-run.mjs:202`): the P16 line is the
chat's on the trunk, as `df0487f94` did for stage 1.

## 8. Dependencies and risks

- **R1** `lane-run.mjs` is the machine of every lane in the freeze week (freeze 2026-10-01 evening, RC-31); the
  checkpoint plans stage 2 after MODELS (`docs/sessioni/sessione_2026-09-28_3.md:41`).
- **R2** A `probe=` path in a worktree removed later still joins by suffix; the run's `head=` is what matters.
- **R3** Freshness costs a probe rerun after the code commit on 7 of 25 of today's measurable lanes.
- **R4** `Status: da eseguire` is stale on four 2026-09-18 prompts: «open» is only as good as the Status flips.

## 9. Decisions taken (unattended, RC-25)

- **U1** Reservation by the trunk file, not chat-scoped ids (§5.1).
- **U2** `Check:` in the REQ header, naming a tracked script, joined by the `probe=` path suffix (§5.3).
- **U3** Freshness by ancestry through two new probe-log lines, time as a marked fallback, docs-only commits
  excluded (§5.2). A persisted format gains two lines: Q2 asks whether RC-27 applies.
- **U4** No `Requirement:` line is never a miss; no new gate in stage 2 (§4.2, §6).

## 10. Decisions awaiting Alfonso

- **A1** Which requirements exist and who writes them (D4 names the chat; the prompt names it Alfonso's).

## 11. Files read

`CLAUDE.md`; `docs/PROTOCOL.md` P10, P16; `docs/decisions.md:110-285` (RC-16..RC-34);
`docs/HARNESS-DOCS.md:72-175`, `:394-420`, `:499-520`; `docs/discovery/discovery_2026-09-27_trace_monitor.md`
(whole); `docs/sessioni/sessione_2026-09-28_3.md` (whole); `docs/ratifiche/claude_ratifiche_2026-09-28_open_lanes_answers.md`
(whole); `docs/prompts/claude_2026-09-27_1030_prompt_trace_monitor_discovery.md:14-50`;
`frontend/scripts/gates/trace-index.ts` (whole); `frontend/scripts/gates/trace-monitor.ts:1-36`, `:114-200`;
`frontend/scripts/gates/__tests__/traceIndex.test.ts:1-60` and its test names; `frontend/scripts/gates/check-docs.ts:1-60`;
`frontend/scripts/lane-run.mjs` (`:60-80`, `:202`, `:431-470`, `:638-672`, `:791-870`, `:1023-1048`, `:1332`,
lines with `check:`, `header`, `Status:`); `docs/log-inbox/harness.md` (head and headings); `frontend/package.json`
(script lines); `.gitignore:68-71`; `~/.jjodel-lanes/*/probe-*.log` (key census, `probe=` lines).
