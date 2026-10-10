# Discovery: lane board Insights, model use against success and code-area difficulty

- Prompt-ID: P-2026-10-10-1520 · prompt `docs/prompts/claude_2026-10-10_1520_prompt_lane_board_model_insights_discovery.md`
- Session: `d1b66023-b001-4afc-8e62-fee75d20c6b6` · chat C-2026-10-10-1512
- Tree: `~/jjodel-w-modelinsights`, branch `lane-board-model-insights`, HEAD `3bc597b32` (the trunk tip at the cut)
- Executor: Claude Opus 5.5 (`claude-opus-5-5`)
- Measured 2026-10-10 between 15:25 and 16:40 on the lane folders as they stood then (379, this lane included)
  and on `git log --all` of the shared repository. Throwaway probes in `/tmp/p1520/` (listed in §8), none in the repo.
- This report is a set of hypotheses with evidence, not a reference. Whoever builds on it rereads the real files.

## 0. Answer in brief

1. **Model attribution is solid.** `init` names the model for 274/379 lanes (the other 105 are direct merges: no
   session, no model); `modelUsage` agrees on 272/272; no lane changed model on resume; every subagent ran Opus 5.5.
   Haiku and Fable never ran a lane (Fable 5.1 is the chat's model). Cost and tokens are in every `result`.
2. **"Every lane folder has tier.txt" is false:** 178/379, from P-2026-09-28-1015 (lane-run v3) on.
3. **Lane → files works through the subject suffix `(P-…)`:** 313 of the 322 lane-attributable code commits; the
   other 44 code commits since 2026-09-26 are not lane work (issue branches, harness commits made by the chat).
4. **Signals:** outcome 379/379; resume text 153/196 resumes; Corregge → 23 corrected lanes; reverts 2 lanes (a
   scope decision, not a defect); the Status line never records a failed visual check (0/368), by P13's design.
5. **First-shot, proposed:** outcome done or hard-stop, no corrective resume, no Corregge pointing at the lane, no
   reverted commit, no blocked or over-90-minute run. Holds for 310/379 (215/274 session lanes); rework 27 lanes.
6. **The model effect cannot be separated today.** Size drives it: ≤200 changed lines, first-shot Opus 27/29 and
   Sonnet 15/17; >200 lines Opus 74/102, Sonnet 3 lanes of 20. 23/24 Sonnet lanes came from an explicit
   `--tier light`. Every Sonnet × area cell has n<10.
7. **Areas** (151 code lanes, by changed lines, §5): rework viewpoint 23%, harness 20%, model core 18%, simulator
   13%, canvas 6%, languages 0%. The six §3.2 files: 4 lanes, never primary, so a flag, not a row.
8. **Today's tab mis-bins kind:** 203 lanes "Not recorded" (`header()` reads only `input-1.md`), 28 merges as
   "Full / Phase 2" (`Lane: full (merge…`), 18 full lanes as Discovery.
9. **Integration:** a separate `/api/insights`; per-lane log facts in the per-lane cache (key `v6`), git facts
   keyed on a `for-each-ref` hash (0.01 s); a full rebuild is 1.5 s (logs) + 1.5–3.0 s (git). Shape in §7.4.
10. **RC-22:** `lane-tracking` touches nothing under `frontend/scripts/lane-board/`; its `Front:` header (RC-44)
    is a future grouping with no history before 2026-10-10.

Decisions awaiting Alfonso (RC-26): none; this report changes no model, effort or cost.

Questions (§11, each with its line):
1. First-shot as in point 5? Recommended: adopt it, recovery and self-assessment shown apart.
2. Area attribution? Recommended: primary by changed lines, per-touch column beside it, critical zone as a flag.
3. Matrix threshold? Recommended: n always shown, rate hidden below 5, cell greyed below 10.
4. Stratify the model view by size? Recommended: yes, four bands (≤50, 51–200, 201–800, >800 lines).
5. Fix `kindOf`/`header()` in the same Phase 2? Recommended: yes, every new view groups by kind.
6. Where does it live? Recommended: `/api/insights`, server side, caches as in point 9.
7. Log source? Recommended: `git show alfonso-frontend-jjtl:<path>`, not the `~/jjodel` working tree.
8. Corregge empty since 2026-10-05? Recommended: a ticket for the chat to fill it on rework prompts.
9–10. Held-out check of the resume heuristic; README plist path. Recommended: both yes (§11).

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|-----------|---------|----------|
| H1 | The chat's counts hold: 378 folders; 273 with a model (249 Opus 5.5, 18 Sonnet 5.5, 6 Sonnet 5); `modelUsage` on `result`; `tier.txt` in every folder | **partly** | Counts hold (379 with this lane: 250/18/6). `modelUsage` on 272/274 sessions. `tier.txt` **falsified**: 178/379 (§2.1) |
| H2 | The `init` model is a reliable primary source and agrees with `modelUsage` and the `Model:` trailer | **holds** for `init`; **partly** for the trailer | `init` vs `modelUsage`: 0/272 disagree. Trailer: 13 lanes "disagree" only because chat commits (Fable 5.1) carry the lane's suffix (§2.2) |
| H3 | A lane's code commits are found by the `(P-…)` suffix of the subject | **holds** | 313/322 lane-attributable code commits since 2026-09-26 21:00 (§3) |
| H4 | A per-lane success signal resolves from artifacts for most lanes | **partly** | outcome 379/379, resume text 153/196 resumes, Corregge 23 lanes, revert 2 lanes, visual Status 0 failures ever (§4) |
| H5 | Code areas differ in difficulty with an n that reads | **partly** | 7 areas with n≥8; rework 0–23% by primary area; the critical zone has n=4 (§5) |
| H6 | The model effect can be read off a model × area matrix | **falsified on today's data** | size and selection explain the gap; no Sonnet cell reaches n=10 (§6) |
| H7 | `/api/timeline` already carries what the new views need | **falsified** | no model, cost, commits, files or rework; kind mis-binned for 249/379 lanes (§7.1) |

## 2. Model attribution (WHAT 1)

### 2.1 Coverage per source (measured, `/tmp/p1520/scan.mjs`, `models.mjs`)

| Source | Lanes resolved | Notes |
|---|---|---|
| `init` event, field `model` | 274/379 | The 105 without one are all direct merges: `direct.json` present, `log.jsonl` starts `{"type":"system","subtype":"direct",…}`, no session |
| Final `result`, `modelUsage` | 272/379 | Missing for P-2026-09-29-1017 (exited with no `result`) and P-2026-10-10-1520 (this lane, running) |
| `assistant` events, `message.model` | 274/379 | `<synthetic>` appears in 13 lanes (API-error stubs); exclude it |
| `Model:` trailer on the lane's commits | 361 lanes have ≥1 suffixed commit with a trailer | 33 distinct spellings across all commits (`Anthropic Claude Opus 5.5` 675, `claude-opus-5-5` 112, `chat via lane-run` 151, …); must be normalized |
| `tier.txt` | 178/379 | From P-2026-09-28-1015 (lane-run v3, RC-32) on. Absent for the 96 session lanes before it and for all 105 direct merges |

Primary model by `init`: `claude-opus-5-5` 250 (2026-09-26 → 2026-10-10), `claude-sonnet-5-5` 18 (2026-09-29 →
2026-10-10), `claude-sonnet-5` 6 (2026-09-28 only, P-2026-09-28-1015 … P-2026-09-28-2230).

### 2.2 Disagreements and multi-model lanes (measured)

- `init` vs the model with the most output tokens in the last `modelUsage`: **0** disagreements of 272.
- `init` vs the model written in `tier.txt`: **0** of 178 (heavy → Opus 5.5: 154; light → Sonnet 5: 6; light → Sonnet 5.5: 18).
- Lanes whose runs started on more than one model: **0** (`init` events of every run compared). This matches
  `frontend/scripts/lane-run.mjs:194`: «A resume passes no --model: the session keeps its own».
- Lanes with more than one session id: 0. A resume keeps the session.
- `modelUsage` with more than one model in one `result`: 0.
- Subagents (`assistant` events with `parent_tool_use_id`): 25 lanes, every one `claude-opus-5-5`. **No Haiku in any
  lane log**: the search covered every `message.model` of 274 logs, with Opus found 250 times as the control.
- Fable never ran a lane. `claude-fable-5-1` appears only in commit trailers written by the chat, for example
  «claude-fable-5-1 (project chat C-2026-09-26-1702)» (20 commits) and «claude-opus-5-5 (lane session 9f77c390),
  committed by claude-fable-5-1 (project chat C-2026-09-26-1702)».
- Trailer vs `init`: 253 lanes agree. 95 lanes have a trailer and no `init`: direct merges, whose trailer is the
  chat's («none (lane-run go, direct merge; chat via lane-run)»). 13 lanes "disagree". In every case the extra
  model is Fable, from a chat commit (`docs(prompts):`, Status flip) that carries the lane's suffix. **Read the
  model from `init`, never from trailers.**
- Claude Code CLI: 2.1.283 on 102 lanes (to P-2026-09-28-2001), 2.1.284 on 172 (from P-2026-09-28-2211); one
  lane spans both. That is one more era marker.

### 2.3 Where a per-worktree override would leave a trace

`docs/decisions.md:112` (RC-16): «Le deroghe passano dal `settings.local.json` del worktree e si dichiarano nel
prompt». Measured over the 99 worktrees of `git worktree list`: one `.claude/settings.local.json` exists
(`~/jjodel`), with keys `permissions`, `outputStyle`, `prefersReducedMotion` and no `model`. Control:
`.claude/settings.json` was found in 99/99 by the same loop. The file is gitignored (`.gitignore:63`), so git
keeps no trace, and a removed worktree takes it away. The durable trace is the lane log. An override would show
as an `init.model` different from the model `tier.txt` names (`heavy (settings pin)` means `claude-opus-5-5`).
Measured: 0 cases of 178.

### 2.4 Tokens and cost

Every `result` carries `total_cost_usd` and `modelUsage` with input, output and cache tokens and `costUSD` per
model. They are present from the first lane (P-2026-09-26-2340) on, in 272/274 session lanes. Direct merges have
none. Measured totals: $3,705, of which Opus 5.5 $3,542 over 250 lanes (median $7.92), Sonnet 5.5 $106 over 18
(median $3.03) and Sonnet 5 $57 over 6. The figure is list price, not billing: `modelUsage` reads
`"costBasis":"list"` (P-2026-10-01-2230/log.jsonl, last `result`).

## 3. Linking a lane to its commits and files (WHAT 2)

Measured on `git log --all --since=2026-09-25`: 1694 commits, of which 1471 non-merge and 223 merges.
Probes: `link.mjs`, `window.mjs`.

| Route | Coverage | Verdict |
|---|---|---|
| A. Subject suffix `(P-YYYY-MM-DD-HHmm)` (CLAUDE.md §6.2) | 368/379 lanes have ≥1 such commit; 956 commits | **Primary route** |
| A + run window (author date in [run start − 1 min, max(run end, start + `duration_ms`) + 2 min]) | 734 suffixed commits inside a run, 30 outside; 265 lanes with ≥1 inside, 156 with code | Separates the lane's commits from the chat's; needed for the trailer, not for files |
| A′. `Prompt-ID:` trailer in the body | 4 commits; 2 code commits not covered by A | Marginal, keep as a second regex |
| B. `session.txt` id in a commit message | 0 full ids. 2 lanes by an 8-character prefix inside a `Model:` trailer (P-2026-09-27-0140 `cd30882e`, P-2026-09-27-0150 `9f77c390`); control: the string «lane session 9f77c390» is found by the same search | Unusable |
| C. `Claude-Session:` trailer | 219 commits; it holds the claude.ai URL of the chat (e.g. `https://claude.ai/code/session_015Px4yAHrpWDZQo31DjapvA`), not the lane session | Links the requester, not the lane (RC-43) |
| D. Status line sha | 336 lanes «eseguito + sha»; P13 names one sha, the last code commit (`docs/PROTOCOL.md:300`) | One commit per lane, not the set |
| E. Merge commits | P-ids in merge subject or body for 362 lanes; `merge^1..merge^2` lists the branch side | Good for merge lanes; heavy for the rest |
| F. Branch through `worktree.txt` | 123/206 non-merge lanes still have their worktree; 33 share a branch with another lane | Fallback only |

Code commits since 2026-09-26 21:00, the first lane folder: 359. Of these, 313 link by suffix to a lane folder,
2 more by trailer, and 322 cite some lane ID somewhere. The 44 unlinked are not lane work:

- 27 issue-branch commits (`fix(#157)`, `feat(#168)`, `fix(#173)`, …). Their 17 Prompt-IDs carry a suffix but
  have no lane folder, so these sessions were not launched by `lane-run`.
- 8 harness commits the chat made directly, e.g. `73af7bbac feat(harness): every prompt names its front, Check E
  (RC-44)` and `79c0307dc feat(harness): prompts name the request they answer (RC-43)`.
- 3 CHANGELOG commits and 6 others.

Files touched, excluding `docs/`: from the suffixed commits of the lane, deduplicated by subject + author date (2
cherry-picked duplicates found). Suffixed code commits outside every run window: 3 lanes, all the lane's own work
(P-2026-09-26-2340, launched before orchestration; P-2026-09-26-2350; P-2026-09-30-1808). **Recommended rule:**
take the files by suffix alone, and use the window only to read the `Model:` trailer.

## 4. Success signals (WHAT 3)

### 4.1 Coverage of each signal

| Signal | Resolves for | Notes |
|---|---|---|
| a. Final outcome (`lane-run status --all`) | 379/379 | done 231, hard-stop 114, blocked 14, none 11, question 8, unparsed 1 |
| a. Blocked runs | 8 lanes with a run whose `Outcome:` is blocked; 14 final blocked | 12 of the 14 are merges: 10 direct merges (red gates; three closed by hand as «red gate load-induced»), 2 merge sessions |
| a. Over-time runs (`duration_ms` > 90 min, RC-20) | 7 runs in 7 lanes | P-2026-10-01-1655 121 min, P-2026-10-01-2215 111 min, … |
| a. API-error ends (`terminal_reason: api_error`) | 12 lanes | Environment, not task |
| b. Runs per lane | 470 runs in 274 sessions; 196 resumes in 140 lanes | |
| b. Resume text kept | 153/196 resumes: 107 `input-k.md` (from P-2026-09-28-1545), 46 `msg-k.md` (earlier lanes) | 43 resumes of 2026-09-26/27 lanes have no text; 239/274 session lanes are complete |
| c. Corregge (log, archive, 19 inboxes on the trunk tip) | 1676 entries parsed, 82 tickets. Since 2026-09-26: 331 entries, 309 lanes with an entry of their own; 37 Corregge filled, 37 resolved to a Prompt-ID, 30 to a lane folder → 23 corrected lanes, 4 of them self-corrected | 0 Corregge filled since 2026-10-05 (39 entries) |
| c. Prompt text saying it corrects another | 1/385 prompts with a header line; 17 body sentences, mostly citations of a heading or «superseded» merge Status lines | Not a relation: drop |
| d. Reverts (`This reverts commit`) | 2 commits: `04c13e039` reverts `6756eddd2` (P-2026-10-03-1920, A3), `dd21d2e45` reverts `04c13e039` (P-2026-10-10-0915) | 2 lanes; both are scope decisions, not defects (below) |
| e. Visual result in the Status line | passed 175, not applicable 7, no visual clause 166, open 12, other 8; **failed 0** | Cannot discriminate (below) |

Verbatim:

- `04c13e039` body: «A3 of P-2026-10-03-1920 (R-VP-60) is dropped before the MODELS demo: it touches the handle
  code in the critical zone, its gain is a few pixels after an Auto layout only».
- `dd21d2e45`: «Alfonso asked to resume A3 after Malaga».

**The Status line never shows a failure, by construction.** P13 says the Status line is «flipped once, in the
lane's closure commit» and «For a lane with a human visual check it follows Alfonso's GO» (`docs/PROTOCOL.md:293`,
`:296-298`). The search: `/fallita/` over the Status lines of the 368 prompts on the trunk tip returned 0. The
control `/passata/` through the same scan returned 175. The two `/failed/` hits (P-2026-09-29-2140, -2158) are
words after «verifica visiva passata». A failed check surfaces instead as a corrective resume or as a Corregge
entry with Causa (d).

### 4.2 Telling GO, ACK, answer and rework apart (WHAT 3b)

Heuristic, first non-empty line after the `[P-…]` tag, in this order (`/tmp/p1520/classify.mjs`, v2):

1. `recovery`: «The Mac went to sleep / lost», «Your (last turn|session) ended», «The (previous resume|session)
   ended», «The chat stopped this session»
2. `corrective`: «Rework», «Chat check: one fix», «Correction(s)», «Two corrections», «Fix», «Redo», «Not yet»,
   «Failed», «with one fix before the GO»
3. `ack`: `^ACK`
4. `answer`: «Answer(s)», «Q<n>», «Recommended answer», «Recommendation adopted», «Chat decision», «… adopted /
   ratified as recommended»
5. `go`: «GO», «Visual GO», «Phase 2 GO», «Visual check by the chat»
6. `closure`: `/status-flip`; else `other`

v3 (`classify3.mjs`) adds one body rule. Outside a recovery, and when the first line does not say «Phase 2», a
body that asks for «one|two|three|<n> (precise) fix(es)» or a «fix before the GO» is `corrective`. The «Phase 2»
guard keeps «GO. Phase 2 with three fixes, one commit each» (P-2026-10-01-2136) a GO, since its fixes come from
the report and are not rework.

Tally over the 107 `input-k.md`, v2: go 64, answer 15, ack 11, recovery 11, corrective 5, closure 1. v3 moves 2
rows to corrective.

**Hand check on 20.** The sample is deterministic: rows ⌊i × 107/20⌋, i = 0…19. Each row was hand-labelled
from up to 900 characters of its text, not from the first line:

| # | Lane, k | Hand | v2 | v3 |
|---|---|---|---|---|
| 1 | P-2026-09-28-1837, 2 | go (closure) | go | go |
| 2 | P-2026-09-29-1230, 2 | go (Phase 2) | go | go |
| 3 | P-2026-09-29-2122, 2 | answer | answer | answer |
| 4 | P-2026-09-30-2143, 2 | go | go | go |
| 5 | P-2026-10-01-2136, 2 | go (Phase 2 with fixes from the report) | go | go |
| 6 | P-2026-10-02-1450, 3 | answer | answer | answer |
| 7 | P-2026-10-02-1645, 2 | recovery | recovery | recovery |
| 8 | P-2026-10-02-2109, 2 | go | go | go |
| 9 | P-2026-10-03-0120, 2 | **corrective** | answer ✗ | corrective |
| 10 | P-2026-10-03-1015, 2 | go | go | go |
| 11 | P-2026-10-03-1304, 5 | ack (+ next-step GO) | ack | ack |
| 12 | P-2026-10-03-1304, 10 | go | go | go |
| 13 | P-2026-10-03-1550, 2 | go | go | go |
| 14 | P-2026-10-03-1901, 2 | go | go | go |
| 15 | P-2026-10-04-0935, 2 | go (visual GO after a 90-min stop) | go | go |
| 16 | P-2026-10-04-1213, 2 | go | go | go |
| 17 | P-2026-10-05-1648, 2 | answer | answer | answer |
| 18 | P-2026-10-05-2315, 2 | go | go | go |
| 19 | P-2026-10-10-0105, 4 | go (Phase 2 slice) | go | go |
| 20 | P-2026-10-10-0945, 2 | answer | answer | answer |

v2 scored 19/20. Its one error is the costly kind: row 9 begins «Visual check by the chat (RC-23) on the six
crops: … your four lane choices are adopted as recommended. Two precise fixes, same files…», and the
«adopted as recommended» rule caught it before any corrective rule could.

v3 scores 20/20, but v3 was written after reading these rows, so **20/20 is not an independent error**. A keyword
sweep over all 107 inputs found 7 corrective rows: v2 caught 5 of them, v3 all 7, on the same data. The held-out
check is open: question 9.

The heuristic matters less than it seems. Rework is mostly a new lane that `Corregge` the old one: 23 lanes are
corrected that way, against 7 lanes with a corrective resume.

### 4.3 Proposed definition of first-shot success

**first-shot(L)** holds when all of these do:

- the final outcome is done or hard-stop;
- no corrective resume (v3);
- no log entry has a `Corregge` resolving to L, whether by another lane or by L itself;
- no commit of L was later reverted;
- no run of L ended blocked or ran past 90 minutes.

It is computable for 379/379 lanes. The resume clause is complete for 239/274 session lanes, and partial for the
lanes of 2026-09-26/27. Results:

- **310/379 first-shot** (215/274 session lanes, 95/105 direct merges).
- Not first-shot, by cause (59 session lanes): corrected 15; final none 10, of which 7 are lanes from
  2026-09-27/28 that ended without an `Outcome:` line, plus P-2026-09-29-1017, P-2026-10-10-0105 (blocked) and
  this running lane; question 8, never resumed because the chat answered with a new lane; over-time only 5;
  blocked-run only 4; corrective only 3; unparsed 1; reverted only 1; combinations 12.
- Kept **apart, not as failure**: recovery resumes (11 lanes, environment) and the lane's own self-assessment
  (`Outcome` ⚠️ 19 of 331 entries, `Regressions` yes 6 and unknown 20). They are secondary columns (prompt,
  Context).
- By kind: full 86/115, fast 46/60, discovery 21/30, merge 61/68 (sessions) and 95/105 (direct).

## 5. Code areas (WHAT 4)

### 5.1 The eight areas, and the counts that support them

Rule order matters: the first match wins. Probes (`frontend/scripts/probe/`, `_tmp_` files) are not attributed:
they follow the area they probe (18 lanes touched a probe file).

| Area | Rule | Lanes touching | Primary n | Files | Changed lines |
|---|---|---|---|---|---|
| critical-zone | the six files of CLAUDE.md §3.2 (`useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`, `useM1ReferenceEdges.ts`, `VersionFixer.tsx`) | 4 (`canvasToJjom.ts` 3, `useJjomSync.ts` 1) | 0 | 2 | 174 |
| viewpoint | `editor-v2/viewpoint/**`: `ir/` 30 lanes, `derive/` 21, `authoring/` 11 | 43 | 35 | 85 | 21,643 |
| simulator | `editor-v2/sim/**`, `model/simulation/**` | 63 | 54 | 107 | 38,897 |
| canvas | the rest of `editor-v2/**`: `EditorV2.tsx` 12 lanes, `hooks/` 5, `nodes/`, `edges/`, `utils/`, `problems/` | 42 | 16 | 53 | 8,985 |
| languages | `src/jjscript`, `jjel`, `jjtl`, `codegen` | 10 | 8 | 59 | 9,923 |
| model-core | `src/model` (not simulation), `redux`, `joiner`, `view`, `common`, `api`, `services` | 15 | 11 | 23 | 4,558 |
| harness | `frontend/scripts/**` (not probes), `.claude/`, `CLAUDE.md`, `AGENTS.md`, `package.json`, `vitest.config.ts` | 21 | 20 | 41 | 15,643 |
| other-ui | everything else under `frontend/src` (`components/*` outside editor-v2, `editors`, `pages`, `styles`) | 28 | 7 | 116 | 10,839 |

151 lanes have attributed code: 99 in one area, 52 in more than one. In a multi-area lane the primary area holds
a median 85% of the changed lines. The §3.1 table, read as directories (`viewpoint/ir`, `authoring`, `problems`,
`DV.tsx`, `defaultViewTemplate.ts`, plus the six), is touched by 38 lanes. That is the wider zone; the §3.2
trigger is the six files.

**Attribution, recommended:** one primary area per lane, by changed lines, for every rate, so each lane counts
once and the rows sum. Show a per-touch count beside it. Show the critical zone as a flag on the lane, not as a
row: with primary attribution it is never chosen.

### 5.2 Difficulty per area, over all lanes regardless of model (primary attribution)

| Area | n | Rework | Blocked / over-time | First-shot | Median working time | Causa (correcting entries + own entry) |
|---|---|---|---|---|---|---|
| viewpoint | 35 | 23% (8) | 9% | 69% | 44 min | a 9, c 7, f 4, d 1 |
| simulator | 54 | 13% (7) | 9% | 78% | 31 min | a 7, c 5, f 4, d 1 |
| harness | 20 | 20% (4) | 0% | 75% | 14 min | a 7, c 2, g 2 |
| model-core | 11 | 18% (2) | 0% | 82% | 48 min | a 4, c 3, g 1 |
| canvas | 16 | 6% (1) | 13% | 81% | 45 min | a 3, c 1 |
| languages | 8 | 0% | 0% | 100% | 32 min | g 1 |
| other-ui | 7 | 0% | 14% | 86% | 35 min | a 1, c 1 |
| critical-zone | 0 (4 touching: 3 first-shot, 1 over-time, median 72 min) | | | | | |

Per-touch attribution moves canvas to 19% rework (n=42) and model-core to 27% (n=15). The other areas stay
within ±3 points.

These are 1 to 8 events per row. A difference of one lane moves a rate by 3–14 points, so read the order, not the
decimals.

### 5.3 The ten files most often touched by lanes later corrected or reverted

Set: the 27 lanes with any rework signal, 22 of them with code. Counts are "lanes in the set touching the file / all
lanes touching it".

| Rank | Lanes | File |
|---|---|---|
| 1 | 7/20 | `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` |
| 2 | 5/15 | `frontend/src/components/editor-v2/sim/simulation-panel.scss` |
| 2 | 5/28 | `frontend/src/components/editor-v2/sim/SimulationPanel.tsx` |
| 2 | 5/13 | `frontend/src/components/editor-v2/viewpoint/derive/__tests__/viewpointDerivation.test.ts` |
| 5 | 4/11 | `frontend/scripts/lane-run.mjs` |
| 5 | 4/8 | `frontend/src/components/editor-v2/viewpoint/derive/__tests__/erChen.test.ts` |
| 5 | 4/9 | `frontend/src/components/editor-v2/viewpoint/derive/__tests__/notations.test.ts` |
| 8 | 3/… | nine files tied at 3: `hooks/__tests__/laneRun.test.ts` 3/10, `lane-templates/merge-into-trunk.md` 3/3, `lane-templates/trunk-into-branch.md` 3/3, `nodes/ObjectNode.tsx` 3/8, `sim/__tests__/DeriveViewpointDialog.test.ts` 3/7, `sim/__tests__/simRoleStatus.test.ts` 3/12, `sim/simRoleStatus.ts` 3/11, `viewpoint/derive/__tests__/activityUml.test.ts` 3/7, `viewpoint/derive/notations.ts` 3/9 |

`viewpoint/derive/` dominates: the notation derivation of 2026-09-30 to 2026-10-03, with the Corregge chain
P-2026-09-30-1552 → 1720 → 1935 and P-2026-10-01-2230.

## 6. Confounders (WHAT 5)

### 6.1 Model by date

| Model (lane) | First lane | Last lane | Lanes |
|---|---|---|---|
| `claude-opus-5-5` | P-2026-09-26-2340 | P-2026-10-10-1520 | 250 |
| `claude-sonnet-5` | P-2026-09-28-1015 | P-2026-09-28-2230 | 6 |
| `claude-sonnet-5-5` | P-2026-09-29-0219 | P-2026-10-10-0840 | 18 |
| (no model: direct merges) | 2026-09-28 | 2026-10-10 | 105 |

The chat ran Fable 5.1 throughout (trailers). The CLI moved from 2.1.283 to 2.1.284 between P-2026-09-28-2001 and
P-2026-09-28-2211. There are no lane folders for 2026-10-07 to 2026-10-09.

### 6.2 Harness events by date (`docs/decisions.md`, RC-15 onward)

| Id (line) | Date | Event |
|---|---|---|
| RC-15 (:84) | 2026-09-21 | hooks and deny list as enforcement |
| RC-16 (:110) | 2026-09-25 | pin `claude-opus-5-5` |
| RC-17 / 18 / 19 (:118, :126, :132) | 2026-09-25 | one docs closure commit; harness budget; `bypassPermissions` |
| RC-20 … RC-24 (:145–:183) | 2026-09-26 | orchestrated lanes: `claude -p`, Outcome line, 90-min limit, RC-21 adoptions, parallel by default, visual check by the chat |
| RC-25 … RC-28 (:192–:212) | 2026-09-26 | ratification by invariants |
| RC-29, RC-30, RC-31 (:224, :236, :253) | 2026-09-27 | commit gate in hooks; critical-zone go-ahead; merges before the freeze |
| RC-32, RC-33, RC-34 (:263, :272, :274) | 2026-09-28 | model by activity (tier, Sonnet); chat IDs; add-only gate. Same day: lane-run v3 (direct merge, chain) |
| RC-35 … RC-41 (:281–:287) | 2026-10-03 | issue-driven auto lanes, shadow mode on |
| RC-42 (:288) | 2026-10-05 | `Depends:` header |
| RC-43 (:289) | 2026-10-10 | `Request:` header |

RC-15 to RC-19 predate the first lane folder (2026-09-26 23:40), so they are a constant of the dataset, not a
step in it. First-shot by era (session lanes):

| Era | Session lanes first-shot | Opus 5.5 | Sonnet 5 | Sonnet 5.5 | Direct merges |
|---|---|---|---|---|---|
| A 09-26..09-27 (RC-20..31) | 63/82 | 63/82 | | | |
| B 09-28..10-02 (RC-32..34) | 92/113 | 80/99 | 4/6 | 8/8 | 52/62 |
| C 10-03..10-04 (RC-35..41) | 31/42 | 26/35 | | 5/7 | 25/25 |
| D 10-05..10-10 (RC-42, 43) | 29/37 | 27/34 | | 2/3 | 18/18 |

Era D is right-censored: a correction of a lane from 2026-10-10 has had hours to appear, not days.

### 6.3 Tier by model

| Model | heavy | light | no `tier.txt` |
|---|---|---|---|
| Opus 5.5 | 154 | 0 | 96 (before P-2026-09-28-1015) |
| Sonnet 5 | 0 | 6 | 0 |
| Sonnet 5.5 | 0 | 18 | 0 |
| direct merge | | | 105 |

Tier reasons, read from `tier.txt`:

- Light: 23 of the 24 light lanes come from an explicit `--tier light (the rule: …)`. Only 1 came from the rule
  itself («Lane: discovery, DOVE writes docs only»).
- Heavy: 60 by explicit `--tier heavy`, 47 by «Lane: full», and the rest by critical-zone or governance names.

**The model is chosen by the chat, lane by lane.**

### 6.4 Lane kind by model (kind as measured in §7.1, not the board's)

| Model | full | fast | discovery | merge |
|---|---|---|---|---|
| Opus 5.5 | 114 | 38 | 29 | 68 (sessions) |
| Sonnet 5 | | 6 | | |
| Sonnet 5.5 | 1 | 16 | 1 | |
| none | | | | 105 (direct) |

### 6.5 The confounder that decides: change size

| Changed lines (code, excl. probes) | Opus 5.5 first-shot | Sonnet 5 | Sonnet 5.5 |
|---|---|---|---|
| ≤ 50 | 15/16 | | 7/8 |
| 51–200 | 12/13 | 3/3 | 5/6 |
| 201–800 | 47/60 | | 1/1 |
| > 800 | 27/42 | 0/1 | 0/1 |

Code lanes: Opus median 534 changed lines over 6 files, Sonnet 5.5 median 41.5 over 3. Within a size band the
two models do not separate on these n. A raw table (Opus 196/250 = 78%, Sonnet 5.5 15/18 = 83%) would show size
and selection, as the prompt's Context foresaw.

Model × area matrix (primary area, first-shot/n):

| Model | viewpoint | simulator | canvas | languages | model-core | harness | other-ui |
|---|---|---|---|---|---|---|---|
| Opus 5.5 | 18/28 | 39/49 | 12/15 | 8/8 | 9/11 | 11/15 | 4/5 |
| Sonnet 5 | | 2/2 | | | | 1/2 | |
| Sonnet 5.5 | 6/7 | 1/3 | 1/1 | | | 3/3 | 2/2 |

At a threshold of n ≥ 10, five Opus cells read and no Sonnet cell does.

## 7. Integration (WHAT 6)

### 7.1 How the Insights tab gets its data today (read)

- `insights.js:244`: «try { data = await (await fetch('/api/timeline', { cache: 'no-store' })).json(); render(); }».
  `compute()` (`insights.js:44-60`) aggregates client-side over `data.lanes`, filtered by range.
- `/api/timeline` (`lane-board.mjs:571-576`) serves `timeline()` (`:339`), which is cached 10 s (`CACHE_MS`, `:29`).
  It builds one object per lane (`:353`): id, launcher, title, chat, worktree, kind, tier, state, outcome, live,
  turns, cites, depends, request. There is no model, cost, commit, file or rework field.
- Per lane, `laneTimeline()` (`:212`) reads `log.jsonl` whole through `results()` (`:172`). Its result is kept in
  `~/.jjodel-lanes/board/timeline-cache.json` (313,514 bytes measured) under
  «const key = ['v5', size(join(dir, 'log.jsonl')), mtime(exitP), inputs.length, mtime(join(dir, 'request.md'))].join('/');»
  (`:217`), reused only once the lane has exited (`:219`).
- `collect()` (`:100`), 10 s, spawns `lane-run status --all` (measured 3.3 s wall, 1.3 s user).
- `promptCommits()` (`:287`) runs `git log --all --diff-filter=A` every 5 minutes (measured 0.77 s).
- **Kind is mis-binned today.** `header()` reads only `input-1.md` (`:56`: «const text = readTrim(join(dir,
  'input-1.md')).slice(0, 4000);»), and `input-1.md` exists only from P-2026-09-28-1545 on. `kindOf` tests
  «if (/^merge/.test(l)) return 'merge';» (`:64`) while merge prompts declare `Lane: full (merge; …`, so these
  fall to «if (/phase ?2|implementation|full/.test(l)) return 'phase2';» (`:67`). Measured with the board's own
  rule over the 379 lanes:
  - 203 «Not recorded»: 145 merges, 25 full, 22 fast, 10 discovery, 1 unknown;
  - 28 merges counted as «Full / Phase 2»;
  - 18 full lanes counted as Discovery, because their Lane line contains the word «discovery».

  The «Outcome by kind» card of today's tab is affected.
- The live board runs from `~/jjodel-release` (process
  `/opt/homebrew/bin/node /Users/alfonso/jjodel-release/frontend/scripts/lane-board/lane-board.mjs --refresh 30`,
  and the plist agrees). `README.md:80` still shows `/Users/alfonso/jjodel/frontend/scripts/lane-board/lane-board.mjs`,
  which does not exist (`ls`: No such file or directory). `REPO` defaults to `~/jjodel` (`:285`). That tree is
  `validation-skeleton` at `843c11162` (2026-09-30). It is harmless for `git log --all`, but wrong for any read of
  `docs/` from a working tree.

### 7.2 Costs measured (warm page cache, this Mac, load as at 16:00)

| Operation | Time |
|---|---|
| One pass over the 379 `log.jsonl` (598 MB), parsing only `init`, `result` and `assistant` lines | 1.4–1.5 s |
| `git log --all --since=2026-09-25 --no-merges --numstat` | 3.0 s first, 1.5 s warm |
| `git log --all --since=… --format=%H%x1f%s` | 0.06 s |
| `git for-each-ref` (387 refs) | 0.01 s |
| Parse of log + archive + 19 inboxes (≈25k lines) | negligible |

On a 30 s refresh a full rebuild (≈3–5 s) is too much. An incremental one costs tens of milliseconds: stat the log
sizes, and run `for-each-ref`.

### 7.3 Where the computation lives (proposal)

Server side, in a **separate endpoint `/api/insights`**. Not in `collect()`, which serves the Lanes tab every 10 s.

- Per-lane log facts are read in the same pass as `results()` and stored in the per-lane cache, with the key bumped
  to `v6`: model from `init`, models used and subagent models, cost and tokens, each run's duration and outcome,
  and the resume class. They cost nothing for exited lanes.
- Git facts come from one `--numstat` log since the first lane date. Its cache is in memory, keyed on a hash of
  `git for-each-ref --format='%(objectname) %(refname)'`, and rebuilt only when a ref moves. Reverts come from the
  same pass.
- Log entries are read with `git show alfonso-frontend-jjtl:<path>`: the active log, the archive and
  `docs/log-inbox/*.md` (`git ls-tree`). They are keyed on the trunk sha, and are independent of the `~/jjodel`
  working tree.
- Aggregation stays client-side in `insights.js`, by range, like today.

### 7.4 Proposed `/api/insights` shape (v1)

```json
{
  "v": 1, "now": 1760100000000, "trunk": "3bc597b32",
  "sources": { "lanes": 379, "sessions": 274, "commitsScanned": 1471, "logEntries": 1676, "since": "2026-09-26" },
  "areas": [ { "key": "viewpoint", "label": "Viewpoint (IR, authoring, derive)", "rule": "frontend/src/components/editor-v2/viewpoint/**" } ],
  "harness": [ { "id": "RC-32", "date": "2026-09-28", "title": "lane-run picks the model by activity" } ],
  "lanes": [ {
    "id": "P-2026-10-01-2230", "day": "2026-10-01", "kind": "full",
    "model": "claude-sonnet-5-5", "subagentModels": {}, "tier": "light", "tierReason": "--tier light (…)",
    "cliVersion": "2.1.284",
    "runs": [ { "start": 1759350718275, "ms": 1157421, "outcome": "hard-stop", "input": "first" } ],
    "final": "done", "workMs": 1157421, "costUSD": 2.55, "outTokens": 51467,
    "commits": ["690ca002e", "c3b0556d6"], "lines": { "viewpoint": 18, "canvas": 2 }, "primaryArea": "viewpoint",
    "criticalZone": false, "sizeBand": "≤50",
    "signals": { "corrective": false, "correctedBy": [], "selfCorrected": false, "reverted": [],
                 "blockedRun": false, "overTime": false, "recovery": false, "resumeTextComplete": true },
    "firstShot": true,
    "selfAssessment": { "outcome": "✅", "regressions": "no", "causa": "a", "corregge": "P-2026-09-30-1720", "smoke": "passato" },
    "ageDays": 9
  } ]
}
```

The values are illustrative. `ageDays` lets the timeline grey the last days as censored. `input` is the resume
class of §4.2: first, go, ack, answer, corrective, recovery, closure, other or unknown. Lanes with no model
(direct merges) carry `"model": null` and stay out of the model views.

### 7.5 Minimum n per matrix cell

Show n in every cell, hide the rate below 5, and grey the cell below 10. The Wilson 95% interval at p = 0.75 spans
0.34–0.95 at n = 5, 0.44–0.92 at n = 10 and about ±0.18 at n = 20. Below 10 a rate says nothing a reader should
act on. Today that leaves five readable cells, all of them Opus (§6.5).

## 8. Files and folders read

- `/Users/alfonso/jjodel-w-modelinsights/CLAUDE.md` (session context).
- `docs/PROTOCOL.md`, whole.
- `docs/decisions.md`: lines 1–40 and 84–300.
- `docs/claude-code-log.md`: lines 1–80 read; all three log sources parsed whole by `logs.mjs`.
- `docs/claude-code-log-archive.md`, `docs/log-inbox/*.md` (19 files): parsed by `logs.mjs`.
- `docs/prompts/*.md`: header lines (Prompt-ID, Status, Lane) and body sentences, by probe.
- `frontend/scripts/lane-board/README.md` (117 lines), `insights.js` (249), `lane-board.mjs` (585), all whole.
- `frontend/scripts/lane-run.mjs`: lines 180–240, 283–292, 345–365, 500–600.
- `/Users/alfonso/.jjodel-lanes/P-*/`, 379 folders: `log.jsonl`, `tier.txt`, `session.txt`, `worktree.txt`,
  `prompt.txt`, `input-*.md`, `msg-*.md`, `exit.txt`, `started.txt`, `result.json`, `direct.json`. Also
  `~/.jjodel-lanes/board/` (listing), `~/.jjodel-lanes/auto/` (listing), and `lane-run status --all` (read-only).
- `~/Library/LaunchAgents/io.jjodel.lane-board.plist` (`plutil -p`); `ps` for the live board process.
- `.claude/settings.local.json` and `.claude/settings.json` of the 99 worktrees of `git worktree list`.
- `git log --all` of the shared repository since 2026-09-25 (subjects, bodies, numstat; merges apart).
- Branch `lane-tracking`, through `git log`, `git diff --stat` and `git show` only:
  `docs/harness/fronts.json`, `docs/decisions.md` (RC-44 row), `docs/PROTOCOL.md`.
- Not read: `frontend/scripts/lane-board/timeline.js`. No claim here depends on it.

Probes, in `/tmp/p1520/` and not in the repo:

| Probe | What it does |
|---|---|
| `scan.mjs` | one pass over the lane logs |
| `models.mjs` | §2 |
| `link.mjs`, `window.mjs` | §3 |
| `inputs.mjs`, `classify.mjs`, `classify3.mjs` | §4.2 |
| `logs.mjs` | §4.1 c |
| `master.mjs`, `metrics.mjs` | §4.3–§6 |

## 9. Risks

1. **Selection, not effect.** The chat picks the tier per lane: 23/24 light lanes by explicit `--tier light`, and
   Sonnet gets small lanes. Any model column has to be read inside a size band (§6.5).
2. **Era confounding.** Sonnet 5 lived one day, 2026-09-28, the same day as lane-run v3, RC-32, RC-33, RC-34 and
   the CLI change.
3. **Right-censoring.** Corregge and reverts arrive later, so recent lanes look better. Carry `ageDays`.
4. **Corregge drift.** No entry since 2026-10-05 fills it (39 entries). The rework signal there may be zero
   because nobody wrote it, not because nothing was reworked.
5. **Trunk-tip logs only.** Inbox entries of unmerged branches are not seen until the merge.
6. **Self-assessment is self-reported.** It stays a secondary column, as the prompt asks.
7. **The resume heuristic was tuned on its own sample.** The 20/20 of v3 is not independent.
8. **Tiny n per area.** 1–8 rework events per row.
9. **Cost is list price.** `costBasis: list`.
10. **The area rule order is a choice.** `editor-v2/viewpoint/` wins over canvas, and `model/simulation/` over
    model-core. A reordering moves a few lanes.
11. **RC-22.** `git diff --stat alfonso-frontend-jjtl...lane-tracking -- frontend/scripts/lane-board/` printed
    nothing, exit 0. The same command without the path lists 12 files (control). So `lane-tracking` touches no
    board file, and a Phase 2 here has a disjoint DOVE from it. Its `Front:` header (RC-44, registry
    `docs/harness/fronts.json` with 7 fronts) is a grouping a later view may add. Only lanes from 2026-10-10 on
    carry it.

## 10. Decisions taken (unattended) and decisions awaiting Alfonso

Taken in this report, as methodological choices for Phase 2 to adopt or reject (none is written to
`docs/decisions.md`):

- the model comes from `init`;
- files come from the subject suffix;
- the run window is used only for trailers;
- the v3 resume classifier;
- the eight area rules and the probe exclusion;
- the first-shot definition of §4.3.

Awaiting Alfonso (RC-26 list): none.

## 11. Open questions

1. First-shot as defined in §4.3?
   Recommended: adopt it; recovery resumes and the log self-assessment are shown as separate columns, not folded in.
2. Area attribution?
   Recommended: primary area by changed lines (docs and probes excluded), per-touch count beside it, critical zone as a lane flag.
3. Minimum n per cell?
   Recommended: n always shown, rate hidden below 5, cell greyed below 10.
4. Stratify the model view by change size?
   Recommended: yes, four bands by changed lines (≤50, 51–200, 201–800, >800), the measured confounder.
5. Fix `header()` (fall back to `prompt.txt`) and `kindOf` (merge detection) in the same Phase 2?
   Recommended: yes, it is in `lane-board.mjs`, already the Phase 2 file, and every new view groups by kind.
6. Where does the computation live?
   Recommended: a separate `/api/insights`, per-lane facts in the `v6` per-lane cache, git facts keyed on a `for-each-ref` hash.
7. Source of the log entries?
   Recommended: `git show alfonso-frontend-jjtl:<path>`, not the `~/jjodel` working tree (`validation-skeleton`, 2026-09-30).
8. Corregge empty since 2026-10-05?
   Recommended: a low-priority ticket for the chat to fill it on every rework prompt; no rule change.
9. Validate the resume heuristic on held-out data?
   Recommended: re-check 20 resumes of lanes after 2026-10-10 by hand once Phase 2 ships, and report the error.
10. Update `README.md:80` to the `~/jjodel-release` path the plist actually uses?
    Recommended: yes, in the Phase 2 commit that touches the board.
