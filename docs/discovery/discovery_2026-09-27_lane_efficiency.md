# Discovery: lane efficiency (direct merges, one closure commit, chained lanes, a model tier, short briefs)

Prompt-ID: P-2026-09-27-2330
Prompt: `docs/prompts/claude_2026-09-27_2330_prompt_harness_lane_efficiency.md`
Session: `536c46ab-85e7-4765-9606-8d5e2a804556`
Tree: `/Users/alfonso/jjodel-w-harness-eff`, branch `harness-lane-efficiency`, HEAD `0ff20a9bb`
Executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`)
Measured: 2026-09-27 night into 2026-09-28, on the lane folders of `~/.jjodel-lanes/` and on git as they stood then.

Phase 1, read-only: nothing in any tree was written but this file. The measurement scripts and the dry-run
transcripts live outside every tree, in `~/.jjodel-lanes/P-2026-09-27-2330/` (appendix B).

This report is a set of hypotheses with evidence, not a reference: whoever uses it rereads the files. Tags:
[M] measured in this phase, [R] read.

## 0. Answer in brief

- Direct merge: 23 of the 29 merge lanes of 2026-09-27 pass every `--direct` precondition [M]: 646 tool calls, 202 session-minutes, about 30 USD. 6 fall back: 2 governance, 2 take-trunk with code on both sides, 1 union hunk that edits, 1 dirty tree. One of the 23, `2049` (sim-modal), was stopped by its session on a prose embargo that no script can read.
- Union rule: `git merge-file --diff3` (trunk, base, branch), each conflict hunk a pure insertion resolved as trunk lines, one blank line, branch lines, reproduces 15 of the 16 union files of 09-26/27 byte for byte [M]. The 16th holds an edit hunk (a fold on the trunk) and must fall back.
- Every template step is deterministic but two: trunk-into step 5 (read the files changed on both sides) and the body's "Behaviour brought into force". Both go: no code file on both sides becomes a precondition, and the body quotes the branch prompts' titles.
- The gates take about five minutes (vitest 58 s, hooks 51 s, build 59 s in one merge lane [M]); the chat's shell call ends near 180 s. `--direct` must hand the merge and the gates to a detached worker that writes the lane folder, as `start` does.
- Closure: merge lanes already close in one docs commit. 7 launched lanes committed their Status twice, before and after the visual GO, because their prompt or the chat asked for a docs commit before the GO; the `log-entry` skill (rule 6) commits the inbox alone. Rule 2 moves no anchor of Check A or of the three skills [R].
- `claude -p --model claude-sonnet-5` beside the pin `claude-opus-5-5`: the flag wins, `init.model` and `modelUsage` both read `claude-sonnet-5`; a resume without `--model` keeps it; an unknown id still prints a session id, then exits 1 [M].
- Tier rule as written: `light` for 2 of 81 lanes, 3 with a stricter DOVE parse [M]. DOVE is prose and names paths it only reads, so the docs-only lanes reach `light` through `--tier light`, not through the default.
- Brief: 7 reports of 09-27 already open with `## 0. Answer in brief` (16 to 31 lines) [M]. `status` finds the report a lane wrote in the Write and Edit calls of its log (18 of 18 lanes); the prompt text also names the reports it reads.
- RC-31 (trunk `e87df1ff6`, after this branch was cut): a merge before the freeze carries a `pre-<branch>` tag and the four demo scenes. `--direct` can tag; the scenes stay with the chat, before `go`.

**Decisions awaiting Alfonso** (RC-26, model and cost of the sessions): the id of the light tier.
Recommended: `claude-sonnet-5` (half the per-token price of Opus 5.5, same 1M context, takes `xhigh`).

**Questions.**
1. Does `--direct` run the merge and the gates in a detached worker?
Recommended: yes: the foreground measures, checks, tags and commits the prompt; the worker merges, gates, writes `result.json` and `exit.txt`; the chat uses `wait`.
2. Is the union rule of section 4.3 the deterministic one, an edit hunk falling back?
Recommended: yes, as measured on 16 files.
3. Three more preconditions: no code file changed on both sides (both modes), no running lane in the receiving tree, no other direct merge running there?
Recommended: yes, all three.
4. Gate oracles: the typecheck set equal to the trunk tip's by file and code, vitest per file equal to the trunk tip plus the branch's changed test files at its tip?
Recommended: yes; the full run already holds the hook tests (`frontend/vitest.config.ts:16`).
5. Direct merge commit: deterministic body, the branch prompts' titles for the behaviour paragraph, trailer `Model: none (lane-run merge --direct)` plus the chat's, no `Co-Authored-By`?
Recommended: yes.
6. RC-31 tag: `pre-<branch>`, or `pre-<branch>-<Prompt-ID>` when taken (`pre-enum-step-b` exists)?
Recommended: yes.
7. Id of the RC-16 amendment row, RC-31 being taken on the trunk?
Recommended: RC-32, in a section after RC-30's, so the union at merge puts RC-31 first.
8. One P9 entry per merge, on both paths, in the one inbox the branch adds headings to (26 of 26 merges)?
Recommended: yes; the templates' "No log entry for the merge" goes.
9. Tier: the stricter parse as default, governance or critical-zone names forcing `heavy`, `--tier light` for the rest, `resume` without `--model`?
Recommended: yes.
10. Brief rule in P16 and in §4.1 as what a prompt asks (§4.2 is outside DOVE), counted from the heading to the next `## `, trailing blanks dropped?
Recommended: yes; §4.2 and the `discovery-report` skill go to one ticket.
11. Chain: stop when the tree has tracked changes before the next prompt; `--merge-after` parks the rendered prompt on a fallback, no launch?
Recommended: yes.

## 1. Objective and hypotheses

Objective: the six answers Phase 1 owes (prompt, COME, Phase 1), with enough evidence that Phase 2 can be
written without a second discovery.

| # | Hypothesis under test | Verdict |
|---|---|---|
| H1 | Most merge lanes of 2026-09-27 are mechanical: zero hard conflicts, governance unchanged, probes satisfied | holds: 23 of 29 (section 3) |
| H2 | The union rule the templates state is deterministic | holds, with one refinement and one fallback (section 4.3) |
| H3 | A script can run the whole merge template | partly: two judgement steps, both removable; the gates cannot run inside the chat's call (section 4) |
| H4 | The extra closure commits come from the templates | falsified: from the prompts the chat writes and from the `log-entry` skill (section 5) |
| H5 | `claude -p --model <id>` coexists with the settings pin | holds (section 7) |
| H6 | The tier can be read deterministically from the header and DOVE | partly: the header yes, DOVE only narrowly (section 7.3) |
| H7 | `status` can find the report a lane wrote from the prompt's DOVE | falsified: from the log (section 8) |

## 2. Files read

- `/Users/alfonso/jjodel-w-harness-eff/CLAUDE.md` (whole)
- `/Users/alfonso/jjodel-w-harness-eff/docs/PROTOCOL.md` (whole, 441 lines)
- `/Users/alfonso/jjodel-w-harness-eff/docs/decisions.md` lines 60-260 (RC-14 to RC-30 and the start of R-EDGE); RC-31 read from `git show e87df1ff6 -- docs/decisions.md`
- `/Users/alfonso/jjodel-w-harness-eff/docs/HARNESS-DOCS.md` lines 1-300 and 340-469 (§1 to §4.6, §5 to §8)
- `/Users/alfonso/jjodel-w-harness-eff/frontend/scripts/lane-run.mjs` (whole, 1024 lines)
- `/Users/alfonso/jjodel-w-harness-eff/frontend/scripts/lane-templates/merge-into-trunk.md`, `trunk-into-branch.md` (whole)
- `/Users/alfonso/jjodel-w-harness-eff/frontend/scripts/hooks/__tests__/laneRun.test.ts` (whole, 1184 lines)
- `/Users/alfonso/jjodel-w-harness-eff/frontend/scripts/hooks/critical-zone.mjs` lines 30-60, 93-126
- `/Users/alfonso/jjodel-w-harness-eff/frontend/scripts/gates/check-docs.ts` lines 1-150; `log-tools.ts` lines 1-140, 300-422; `docs-digest.ts` (grep of its row parser, lines 79-89)
- `/Users/alfonso/jjodel-w-harness-eff/.claude/skills/{discovery-report,log-entry,status-flip}/SKILL.md` (whole); `.claude/settings.json` lines 1-30
- `/Users/alfonso/jjodel-w-harness-eff/docs/log-inbox/harness.md` lines 1-60; `docs/claude-code-log.md` headings
- `/Users/alfonso/jjodel-w-harness-eff/docs/discovery/discovery_2026-09-26_orchestrated_lanes_harness.md` §5 and §7 (lines 123-215)
- `/Users/alfonso/jjodel-w-harness-eff/frontend/vitest.config.ts` line 16
- The lane folders `~/.jjodel-lanes/P-2026-09-26-2340` to `P-2026-09-27-2327` (81, this lane excluded): `log.jsonl`, `prompt.txt`, `goahead.txt`, `msg-*.md`
- The prompt files of those lanes under `docs/prompts/` (headers and DOVE), and the merge commits and bodies named below

## 3. Question 1: how many merge lanes `--direct` would have taken

Population [M]: the lane folders of 2026-09-27 whose prompt file is a merge (`_prompt_merge_`, title `merge ...`)
or a take-trunk (`_take_trunk`): 29. The prompt's 32 counts merge commits; `git log --all --merges` finds 35 on
2026-09-27, of which 6 were made inside other lanes or by hand (`Merge branch ...` subjects at 01:10, 01:49,
02:06, 10:57, 14:24) and so have no merge lane. Four early lanes (0135, 0250, 0300, 0345) carry, in the merge
subject, the Prompt-ID of the Phase 2 they merge; they were matched by hand to `24d8537fd`, `1b40eacd0`,
`fe4e3030b`, `db3e68cde`.

Method [M]: for each merge commit, parents `p1 p2`, base, `git merge-tree --write-tree --name-only p1 p2`; the
files changed on each side since the base; governance files changed on the branch side; branch prompts' Status at
the branch tip; the probes of `mergeProbes` (`lane-run.mjs:747-775`) counted on the real merge tree; and whether
the real merge tree equals the merge-tree result (clean merges) or the union rule of section 4.3 (union files).
Tool calls: `tool_use` blocks in `log.jsonl`; minutes: the sum of `duration_ms` of its `result` events; cost: the
largest `total_cost_usd` the stream reports.

| Lane | Kind | Merge | Conflicts | Gov. | Code both | Probes | `--direct` | Tool calls | Min |
|---|---|---|---|---|---|---|---|---|---|
| 0135 | into | `24d8537fd` | inbox | - | - | 22 ok | no: the union hunk edits (trunk folded the inbox) | 44 | 5.5 |
| 0250 | into | `1b40eacd0` | inbox | - | - | 16 ok | yes | 30 | 4.9 |
| 0300 | into | `fe4e3030b` | 0 | - | - | 13 ok | yes | 32 | 4.6 |
| 0325 | take | `93e62abbb` | decisions, inbox | - | 2 | 18 ok | no: code on both sides (step 5) | 42 | 6.8 |
| 0345 | into | `db3e68cde` | 0 | - | - | 5 ok | yes | 27 | 4.8 |
| 1119 | into | `a0fa9b428` | 0 | - | - | 6 ok | yes | 22 | 5.8 |
| 1125 | into | `5e8b67ac0` | inbox | - | - | 3 ok | yes | 27 | 5.9 |
| 1216 | into | `342707779` | 0 | - | - | 1 ok | yes | 19 | 5.1 |
| 1409 | into | `23c7a19dc` | 0 | - | - | 1 ok | no: tree dirty at launch (an untracked prompt) | 18 | 6.0 |
| 1428 | into | `6500fc4d9` | 0 | PROTOCOL.md | - | 3 ok | no: governance | 29 | 7.8 |
| 1450 | into | `964597641` | 0 | - | - | 1 ok | yes | 14 | 6.6 |
| 1458 | into | `385848551` | 0 | - | - | 2 ok | yes | 20 | 5.8 |
| 1504 | into | `c905b099e` | inbox | - | - | 5 ok | yes | 33 | 10.5 |
| 1521 | into | `11fd69ca4` | inbox | - | - | 5 ok | yes | 25 | 6.9 |
| 1536 | into | `2eeae9825` | inbox | - | - | 6 ok | yes | 25 | 8.4 |
| 1546 | into | `7c9956b40` | inbox | - | - | 2 ok | yes | 24 | 6.6 |
| 1621 | into | `c4c54a999` | 0 | PROTOCOL.md | - | 1 ok | no: governance | 24 | 7.6 |
| 1632 | into | `bbd9b7142` | inbox | - | - | 8 ok | yes | 38 | 7.7 |
| 1704 | take | `99d7bfff8` | inbox | - | 1 | 8 ok | no: code on both sides (step 5) | 48 | 10.2 |
| 1705 | into | `e4813a3cb` | 0 | - | - | 1 ok | yes | 21 | 7.0 |
| 1723 | into | `04bfb6b58` | inbox | - | - | 2 ok | yes | 23 | 7.0 |
| 1736 | into | `5176c70ac` | inbox | - | - | 3 ok | yes | 24 | 8.4 |
| 1751 | into | `c17f27d76` | 0 | - | - | 4 ok | yes | 22 | 6.2 |
| 1801 | into | `cbfb7bfad` | inbox | - | - | 3 ok | yes (the session hit an API outage, 32 min) | 35 | 32.0 |
| 2049 | into | `5eccdd4d2` | inbox | - | - | 5 ok | yes, but see below | 48 | 9.8 |
| 2146 | into | `ff5855d74` | 0 | - | - | 1 ok | yes | 21 | 5.3 |
| 2248 | into | `ff4bc0988` | 0 | - | - | 1 ok | yes | 19 | 7.4 |
| 2304 | take | `cadbf254e` | inbox | - | - | 13 ok | yes | 30 | 12.7 |
| 2327 | into | `c030871ff` | 0 | - | - | 12 ok | yes (its second run was the chat's demo readings) | 67 | 22.8 |

Totals [M]: `--direct` 23 lanes, 646 tool calls (median 25, range 14-67), 202.2 session-minutes (median 6.9),
30.05 USD reported; fallback 6 lanes, 205 tool calls, 43.9 minutes, 12.01 USD. For scale, the 52 other lanes of
the two days: 332.19 USD.

Every merge lane ran two sessions: the merge (median 22 tool calls) and a resume of 2 to 4 tool calls for the
Status flip after the GO. `--direct` removes both; the second becomes `go`.

What a script would not have seen. `2049` stopped with `Outcome: question`: the branch's own prompt said "the branch
is not merged on the trunk before 2026-10-04" (quoted by the session from
`docs/prompts/claude_2026-09-27_1740_prompt_sim_modal.md:14`). Every mechanical check passed. RC-31 has since
abolished that embargo, but the class stays: a prose condition in a branch prompt. `1409` stopped on an untracked
prompt file in the trunk tree; `--direct` refuses a dirty tree too, so it would have fallen back and the fallback
session would have stopped the same way.

Wall clock is not what `--direct` saves. The gates dominate a merge lane: in `P-2026-09-27-2248` the full vitest
reported `Duration 58.36s`, the hook tests `50.78s`, the build `built in 58.99s` [M, from its log]. With the
per-file oracle of question 4 (three vitest runs), a direct merge still takes about five to six minutes. It saves
the model: tool calls, tokens, about 1.3 USD a merge, and a transcript for the chat to read.

## 4. Question 2: the sequence the merge templates ask, step by step

### 4.1 `merge-into-trunk.md`

| Step | Template text (line) | Script? | How, or why not |
|---|---|---|---|
| guard | "Before anything else run `pwd` and `git branch --show-current`" (`:8`) | yes | `merge` already refuses outside the receiver's tree (`lane-run.mjs:929-933`) |
| other chats | "if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file ... stop" (`:10`) | yes | `git status --porcelain` empty, `git rev-parse -q --verify MERGE_HEAD` absent, measured and merged in one invocation |
| 1 | "`git status` empty; `MERGE_HEAD` absent; `{{branchTip}}` is the tip of `{{branch}}`; the prompt files of the branch read `Status: eseguito` ...; `git worktree list` shows `{{branch}}` only in ..." (`:36`) | yes | all measured by `measureMerge` (`:777-808`) |
| 2 | "`git merge-tree --write-tree --name-only` ... governance ... must be empty. No code file may have changed on both sides ... stop" (`:37`) | yes | `mergeFindings` (`:811-826`) |
| 3 | "Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> \| grep -c -F`" (`:38`) | yes | count of each row id and heading, each must be 1; the control id 0 |
| 4 | "`git merge --no-ff --no-commit {{branchTip}}`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's ..." (`:40`) | yes, with section 4.3 | an edit hunk falls back |
| 5 | "Commit the merge. Subject ... `{{mergeSubject}}`. Body in the shape of the precedent named in COSA" (`:41`) | mostly | every element of the precedent body is a measurement except "Behaviour this merge brings into force on 3001", a paraphrase (`ff4bc0988` body); replace it with the titles of the branch prompts |
| 6 | "Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; ... vitest: measure the trunk tip before step 4 and state the expected total first ... 0 failed, the same files red at import; hook tests ...; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS" (`:42`) | yes, detached | "§17 set": compare with the trunk tip's own typecheck by file and code; vitest: section 4.4 |
| 7 | "`Outcome: hard-stop`: 3001 runs from ... say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`" (`:43`) | yes | the synthetic `Outcome: hard-stop` line in `log.jsonl`, lsof result in `result.json` |
| 8 | "After the GO (a resume), one docs commit: this prompt's Status flipped ... No log entry for the merge" (`:44`) | yes | `go` on a direct lane (rule 2); the log entry is question 8 |

### 4.2 `trunk-into-branch.md`

The same, mirrored, with one step no script can do: "5. On the resolved tree, before committing, read every file
changed on both sides once from top to bottom ...; an auto-merge is a textual result, not a semantic one" (`:37`).
With no code file changed on both sides the step is empty, so `--direct` in this mode requires none; 0325 and 1704
had some and fall back. Step 1 (`:32`) asks the preconditions of `:8`, which a script measures.

### 4.3 The union rule, made deterministic [M]

Rule tested: `git merge-file -p --diff3 -L trunk -L base -L branch <trunk> <base> <branch>`; every conflict hunk
must have an empty base section (both sides only inserted); it is resolved as the trunk's lines, then one blank
line when the last trunk line and the first branch line are both non-blank, then the branch's lines. For
take-trunk the trunk version is passed first as well, so "the trunk's first, then the branch's" holds in both modes
(the templates say so at `merge-into-trunk.md:40` and `trunk-into-branch.md:35`).

Result on the 16 union files of 09-26/27: 15 byte-identical to what the sessions committed, among them
`docs/decisions.md` of `93e62abbb`. The plain `git merge-file --union` differs from 14 of them (13 inbox files and that
`docs/decisions.md`) by exactly that one blank line, and matches `docs/log-inbox/views.md` of `1b40eacd0` as is. The 16th, `docs/log-inbox/simulation.md` of `24d8537fd`, holds one hunk with a base
section: the trunk had folded the inbox, deleting 61 lines, and the session kept the deletion; a union would have
resurrected entries already in the log. The rule flags it (`edits=1`) and falls back.

"Each heading once" (`:35`) is then checked by the probes on the resolved file. Scripts: appendix B,
`union-rule.mjs`.

### 4.4 The gate oracle

The template asks for "the trunk tip plus the branch's new tests" (`merge-into-trunk.md:42`). With no code file
changed on both sides, every test file in the merge is byte-identical to the trunk's or to the branch's version, so
an oracle per file follows [R, reasoning]: run the full suite on the trunk tip in the receiving tree before the
merge (JSON reporter), run the branch's changed test files at the branch tip in the branch's worktree (read-only,
which the template allows), and require the merged run's count per file to equal the side it came from, 0 failed,
the same files red at import. The full run includes `scripts/hooks/__tests__` (`frontend/vitest.config.ts:16`), so
the hook count comes from the same JSON. Typecheck: the set of `(file, code)` of the merged tree equals the trunk
tip's, measured in the same tree before the merge, and counts 14.

### 4.5 Where the script must stop and not decide

Prose conditions (the `2049` embargo); a union hunk with a base section; code on both sides; a red gate after the
merge commit, which the script never undoes (prompt, COSA 1): `Outcome: blocked`, `result.json` naming the gate
and its output file.

## 5. Question 3: where the closure commits of a launched lane come from

Measured on git [M], docs commits whose subject carries the lane's Prompt-ID, the prompt commit excluded: of the
launched code lanes of 2026-09-26/27, 13 carry one, 5 two, 6 three, 1 four; of the 30 Prompt-IDs that name a merge
commit, 26 carry one (the Status flip), and the other 4 are Phase 2 lanes merged under their own id. Reading the subjects, the extra commits
are of four kinds: a second Status commit after the visual GO (`0110`, `1015`, `1611`, `1647`, `1740`, `1806`,
`2225`: "E2 Status, visual check passed" after "E2 closure, ... log entry, Status"); a Status commit to write the
lane's own sha (`0020`: "Status sha for P-2026-09-27-0020"); the Layer Impact Report of RC-30 (`1805`, `1806`,
legitimate); and discovery reports and the chat's answer commits (legitimate).

| Source | Line | What it says | Commits it implies |
|---|---|---|---|
| `docs/PROTOCOL.md` P13 | 278-291 | "One docs commit, the closure commit, carries all three. For a lane with a human visual check it follows Alfonso's GO" | one |
| same | 284-285 | "The sha is the last code commit of the lane (the report commit for a docs-only lane)" | a docs-only lane with no report has no sha to cite: the `0020` second commit |
| `docs/HARNESS-DOCS.md` §7 | 426-433 | "writes the LOG ENTRY and the Status flip, uncommitted while a visual check is due (RC-17)" ... "Claude Code commits the closure (entry, Status, visual line)" | one |
| `docs/HARNESS-DOCS.md` §4.1 | 114-142 | the prompt skeleton: `COSA`, `HARD STOP`, `NON FARE`: nothing on the closure | none; the prompt writer decides, and 7 prompts asked for a docs commit before the GO (the `1611` entry: "the docs commit precedes the visual GO, as the prompt's step 7 and the chat's GO order it, where RC-17 puts it after") |
| `docs/PROTOCOL.md` P9 | 105, 140 | the entry "in testa" to the log, or in `docs/log-inbox/<lane>.md` | no commit rule |
| `.claude/skills/log-entry/SKILL.md` | 21 | "Commit the inbox alone: `git add docs/log-inbox/<lane>.md`, then `git commit ... -- docs/log-inbox/<lane>.md`" | a separate commit: contradicts RC-17 |
| `.claude/skills/status-flip/SKILL.md` | 19 | "Commit: none here. The flip rides only in the lane's closure commit" | one |
| `.claude/skills/discovery-report/SKILL.md` | 22 | "The report is written before the hard stop, in a commit of its own" | the Phase 1 commit, legitimate |
| `frontend/scripts/lane-run.mjs` `go` | 666 | "Now the closure commit as the prompt says." | defers to the prompt |
| merge templates | `merge-into-trunk.md:44`, `trunk-into-branch.md:41` | "one docs commit: this prompt's Status flipped ... No log entry" | one |

So the fix for a launched lane is on the prompt side, which §4.1 shapes: the prompt's COME ends with the RC-17
closure (entry, Status without the visual suffix, visual line, uncommitted until the GO; then one commit), and for a
docs-only lane without a report the Status cites the sha of the lane's last commit before the closure. The skill's
rule 6 is outside this lane (`.claude/`): a ticket.

What `check:docs` compares, so that rule 2 moves no anchor [R]:

- Check A extracts from `CLAUDE.md` and `docs/PROTOCOL.md` the block between `## YYYY-MM-DD — type: short
  description` and `**Prompt document name**: YYYY-MM-DD HH:mm` (`check-docs.ts:64-65`), and fails if the start
  anchor appears more than once as a whole line (`:110-124`). P16 must therefore never hold that heading as a line
  of its own; quoting it inline is safe. The block sits at `PROTOCOL.md:110-121`, far from P16 (`:368-422`).
- The skills read `## P4 ` to `## P5 ` (`discovery-report/SKILL.md:12`), `- **Every prompt file carries a Status
  line` to `## P14 ` (`status-flip/SKILL.md:13`), and `CLAUDE.md` §21.2 (`log-entry/SKILL.md:12`). None of them
  reaches P16 or HARNESS-DOCS; an edit to P16 moves none, provided no new line starts with `## P`.
- Checks B and C lint the inbox entries (`log-tools.ts:398-422`): a task entry needs `Corregge` and `Causa`, each
  the em-dash sentinel or the allowed form, and `Notes` of at most 500 characters. An entry generated by `go` must
  cap its `Notes`.
- `docs:digest` parses decision rows as `- **<ID>**` (`docs-digest.ts:83-87`); the RC-16 amendment row keeps that
  shape.

## 6. Question 4: chains

How the pieces see a chain today [R]: `start` (`lane-run.mjs:267-318`) returns once the first event carries a
session id; the run itself lives in a `/bin/sh` wrapper spawned `detached`, `stdio: 'ignore'`, `unref()`ed, with
`nohup` inside (`:135-138`, `:216-230`). That is the pattern that survives the chat's `osascript` call returning:
every lane of 09-26/27 was started that way and ran on after the call (`1740`: 112.9 session-minutes over three
runs) [M]. `status` and `wait` read `pid.txt`, `started.txt`, `exit.txt` and the last `Outcome:` of the
assistant text (`:364-414`, `:434-466`); `status --all` lists only folders named like a Prompt-ID (`:420`).

A supervisor is the same pattern one level up: `lane-run chain ...` validates, writes `chain.json`, and spawns
`nohup node lane-run.mjs chain-run <chain dir>` detached; that process loops: commit the next parked prompt into
the tree (as `merge --launch` does, `:994-999`), `start` it, poll its lane folder every 2 s, read its outcome, and
continue only on `Outcome: done` with exit 0. It stops on any other outcome, a non-zero exit, a lane past the
limit, tracked changes in the tree before the next commit, or a stop request. `chain.json` is rewritten atomically
(temp file, rename), as `exit.txt` is.

Proposed `chain.json`, in `~/.jjodel-lanes/chain-<first Prompt-ID>/`:

```json
{
  "id": "chain-P-2026-09-28-0100",
  "worktree": "/Users/alfonso/jjodel-w-x",
  "branch": "x",
  "state": "running",
  "position": 2,
  "lanes": [
    { "id": "P-2026-09-28-0100", "prompt": "docs/prompts/claude_2026-09-28_0100_prompt_a.md", "committed": "abc123456", "tier": "heavy", "state": "done", "exit": 0, "outcome": "done" },
    { "id": "P-2026-09-28-0101", "prompt": "/Users/alfonso/.jjodel-lanes/pending/claude_2026-09-28_0101_prompt_b.md", "tier": "light", "state": "running" },
    { "id": "P-2026-09-28-0102", "prompt": "/Users/alfonso/.jjodel-lanes/pending/claude_2026-09-28_0102_prompt_c.md", "tier": "heavy", "state": "queued" }
  ],
  "mergeAfter": { "into": "alfonso-frontend-jjtl", "state": "queued" },
  "stoppedAt": null,
  "stopRequested": false,
  "supervisor": { "pid": 12345, "started": 1790550000000 }
}
```

`state` ends as `done`, `stopped` (`stoppedAt: { "id", "reason" }`, the reason one of `Outcome: hard-stop`,
`question`, `blocked`, `exit <n>`, `limit`, `tree dirty`, `--stop`) or `lost` (supervisor pid dead while `running`,
read by `status`). `status --all` prints one row per chain, `chain-P-...  running  2/3 P-2026-09-28-0101  12 min`,
and folds its lanes into it; `status chain-<id>` prints the chain and the running lane's status; `wait chain-<id>`
returns when `state` is no longer `running`, or at the deadline with the `timeout:` line. `chain --stop <id>` sets
`stopRequested`; the supervisor reads it before committing the next prompt and never kills the running lane.

`--merge-after` ends with `merge <branch> --into <trunk> --direct`, run with the trunk's worktree as its directory
(found by `git worktree list`, as `where()` does at `:839-842`). A fallback there parks the rendered prompt and
records the reason and the `by hand:` line in `chain.json` (question 11). A chain only advances on `done`, so it
suits lanes without a visual check, whose `done` follows their closure commit.

## 7. Question 5: model by activity

### 7.1 The dry run [M]

Directory `/tmp/p2330-model-nz9p`, outside every repository (`git rev-parse`: "fatal: not a git repository"),
holding only `.claude/settings.json` with `"model": "claude-opus-5-5"` and `"effortLevel": "xhigh"`, the pin of
`.claude/settings.json:3`. Environment `env -i HOME USER LOGNAME SHELL TMPDIR LANG PATH=$HOME/.local/bin:...`;
`claude` 2.1.283. A first attempt with `env -i HOME USER PATH` only, as the 1640 lane did, answered `"Not logged
in · Please run /login"` for all three runs: this version needs more of the environment to reach its credentials;
its `init.model` already read the requested model. Prompt: `"Reply with the single word ok"`,
`--output-format stream-json --verbose`.

| Run | First event | `init.model` | Assistant `model` | Result | Cost USD |
|---|---|---|---|---|---|
| no `--model` | `{"type":"system","subtype":"init","cwd":"/private/tmp/p2330-model-nz9p","session_id":"8af4a0ec-9704-4a56-a985-21479663ec4b",...` | `claude-opus-5-5` | `claude-opus-5-5` | `ok`, exit 0 | 0.121 |
| `--model claude-sonnet-5` | `{"type":"system","subtype":"commands_changed","commands":[{"name":"deep-research",...` (`session_id` `df4e5a9b-fbe7-4cc8-a1e0-a50617c17381`) | `claude-sonnet-5` | `claude-sonnet-5` | `ok`, exit 0 | 0.082 |
| `--model claude-haiku-4-5` | `{"type":"system","subtype":"commands_changed",...` | `claude-haiku-4-5` | `claude-haiku-4-5-20251001` | `ok`, exit 0 | 0.022 |
| `--model claude-nonexistent-9` | `{"type":"system","subtype":"commands_changed",...` (`session_id` `684cb97e-...`) | `claude-nonexistent-9` | `<synthetic>` | `"There's an issue with the selected model (claude-nonexistent-9). It may not exist or you may not have access to it..."`, `is_error` true, exit 1; stderr `[claude-code:unrecognized_model]` | 0 |
| resume of the Sonnet session, no `--model` | `init` on `df4e5a9b-...` | `claude-sonnet-5` | `claude-sonnet-5` | `two`, exit 0 | - |

`init` fields of the Sonnet run: `{"type":"system","subtype":"init","cwd":"/private/tmp/p2330-model-nz9p",
"model":"claude-sonnet-5","permissionMode":"auto","claude_code_version":"2.1.283"}`.

What follows: `--model` coexists with the pin and wins over it; a resume keeps the session's model, so `resume` and
`go` pass no `--model`, and the tier is fixed at `start`. An unknown id is not refused before the session: `start`
would print a session id and return 0, and the lane would exit 1 at once with `outcome: none`. So `lane-run`
validates the light id's shape (`claude-` plus letters, digits and dashes) and prints it at launch; the chat checks
it with one dry run when it fills the constant. The RC-29 ticket (a copied `settings.json` in a scratch repository
is not an oracle for permission rules) concerns permissions; model selection is a CLI flag against a settings key,
and the measured precedence is the one the CLI help states (`--model <model> Model for the current session`).

### 7.2 Which id the chat should put in the constant

From the model table of the bundled `claude-api` reference (cached 2026-06-24) [R]: Opus 5.5 `claude-opus-5-5`,
4 / 20 USD per million input / output tokens, 1M context; Sonnet 5 `claude-sonnet-5`, 2 / 10, 1M; Haiku 4.5
`claude-haiku-4-5`, 1 / 5, 200K, no effort control. The lanes read `docs/decisions.md` (4310 lines),
`CLAUDE.md` and long reports; `.claude/settings.json` sets `effortLevel: xhigh`, which Sonnet 5 accepts and Haiku
4.5 does not. Recommended: `claude-sonnet-5`. It is a cost and model decision, on Alfonso's RC-26 list.

### 7.3 The rule applied to the lanes of 2026-09-26/27 [M]

Rule as the prompt writes it: `heavy` for `Lane: full`, a critical-zone name in the header or DOVE,
`--critical-zone-goahead` (`goahead.txt`), a merge that falls back, `--governance-goahead`; `light` for
`Lane: fast` whose DOVE touches only `docs/` or `~/.jjodel-lanes`, and for discoveries whose DOVE writes only the
report; `heavy` in doubt. Critical-zone names: the basenames of `CRITICAL_FILES` (`critical-zone.mjs:37-44`,
importable: the hook runs only when it is the main module, `:126`) plus `DV.tsx` and `defaultViewTemplate.ts`
(rule 14).

| Tier | Literal rule | Stricter parse | Tool calls (literal) |
|---|---|---|---|
| none (`--direct` merge) | 23 | 23 | 646 |
| heavy | 54 | 53 | 4096 |
| light | 2 (`0020`, `2236`) | 3 (adds `2255`) | 175 |
| unknown (no prompt file) | 2 (`0030`, `1625`) | 2 | 103 |

81 lane folders, not 79: the prompt's figure was taken earlier in the evening. Per lane: appendix A.

Why so few: DOVE is prose. The docs-only fast lanes name code paths they only read or promise not to touch
(`1430`: `frontend/src/`; `1540`: `frontend/`; `1620`: `lane-run.mjs`, `CLAUDE.md`), and probes name gitignored
`_tmp_*` files and `~/` paths. The stricter parse counts as write targets only backticked paths under `frontend/`,
`docs/`, `scripts/`, `.claude/` or a governance file, and drops `_tmp_*` and `~/`; it still cannot tell "writes"
from "reads". By reading, about nine lanes were docs-only or read-only (`0020`, `1235`, `1430`, `1500`, `1540`,
`1738`, `2105`, `2236`, `2255`). Two more rules the prompt does not state, both toward `heavy`: a governance file in
DOVE (`docs/PROTOCOL.md` sits under `docs/`, so `1620`, the P16 lane, and this lane would read as docs-only), and a
header `Lane:` that is neither `fast` nor `full` (`harness` on `0051` and `0214`, `discovery` on three), which P13
does not know.

The trailer. A session writes the model its banner shows (P6), which is the tier's model by construction. The
commits `lane-run` makes itself (the prompt commit of `merge --launch` and of `chain`) carry today
`Model: chat via lane-run` or `JJODEL_MODEL_TRAILER` (`lane-run.mjs:914-918`); the tier and its reason can ride in
that trailer's value, `Model: chat via lane-run (lane tier heavy: Lane: full)`, and in `tier.txt` of the lane
folder.

## 8. Question 6: how `status` finds the report a lane wrote [M]

Three sources, measured on the 38 lanes of 09-26/27 whose prompt names a discovery report or whose log writes one:

- The prompt text: it names the report to write and the reports it reads (`1545` names
  `discovery_2026-09-27_sim_demo_readiness_2.md` and `discovery_2026-09-27_sim_post_models_engine.md` and wrote the
  second). Of the 18 lanes that wrote a report, the prompt's set equals the written one in 5. Not usable alone.
- The log: `tool_use` blocks named `Write` or `Edit` whose `file_path` ends in `docs/discovery/discovery_*.md`. In
  all 18 lanes it names one file, and each of the 18 is committed (`git log --all`, 18 of 18). A report written through a shell heredoc would be missed.
- Git: commits in the lane's worktree since `started.txt` whose subject carries the Prompt-ID and that add a file
  under `docs/discovery/`. The fallback for the case above.

Recommended order: the log, then git. The file is read from the lane's worktree (`worktree.txt`), since several
reports live only on their branch (`1725`, `1726`, `1727`, `2255` were not on the trunk when measured). Two RC-30
Layer Impact Reports written by `1805` and `1806` match `docs/discovery/*.md` but not `discovery_*`: the prefix
keeps them out.

The brief as it exists [M]: `sim_derived_attributes` 21 lines, `sim_profiles_panel` 31, `sim_demo_readiness` 30,
`sim_demo_readiness_2` 26, `sim_demo_hint_path_trunk` 16, `sim_post_models_engine` 28, `sim_canvas_state` 27; none
in `enum_step_b`, `sim_modal`, `enum_edge_guard` (first `##` headings: "0. Preconditions", "1. Objective and
hypotheses", "0. Preconditions and one deviation"). Counted as every line after `## 0. Answer in brief` up to the
next `## `, trailing blank lines dropped; the warning fires above 40 or when the heading is absent.

Where the rule is written: the prompt says HARNESS-DOCS §4.1, which is the card of the prompt (`:101-156`); the card
of the discovery report is §4.2 (`:158-183`), outside DOVE. Question 10.

## 9. Risks and dependencies

1. A direct merge commits code on the trunk without a model reading the branch. Mitigations: the preconditions,
   the gates, the chat's visual check before `go`, the RC-31 tag. Residual: prose conditions in branch prompts
   (`2049`).
2. The trunk moved after this branch was cut (`e87df1ff6`: RC-31 and a views inbox entry). Phase 2's
   `docs/decisions.md` row meets RC-31 at merge time: a union on `docs/decisions.md`, clean if the row is RC-32.
3. Merge log entries: one per merge fills the inboxes at the 09-27 rate, 23 a day, so the rotation at 40 comes
   daily (P9).
4. `--direct` in the trunk's tree while 3001 serves from it: the merge rewrites files under a running Vite (as the
   sessions did; 3001 is not restarted by the templates). No change, stated.
5. A light id that does not exist fails after `start` reports success (section 7.1).
6. The tier rule is only as good as the DOVE it parses; `heavy` in doubt keeps it safe and cheap to get wrong.
7. `log-entry` skill rule 6 keeps asking for a separate inbox commit until its ticket is done.
8. `lane-run.mjs` grows by five features in one lane; the tests use fake `claude` and `git` fixtures in temporary
   directories, and the mutation bench is per slice (prompt, COME).

Phase 2 touches, as DOVE declares (rule 19, more than five files): `frontend/scripts/lane-run.mjs` (the five
features); `frontend/scripts/lane-templates/merge-into-trunk.md` and `trunk-into-branch.md` (closure with the
entry, one commit); `frontend/scripts/hooks/__tests__/laneRun.test.ts` and a new
`frontend/scripts/hooks/__tests__/laneRunDirect.test.ts` if the direct and chain cases do not fit; `docs/PROTOCOL.md`
P16; `docs/HARNESS-DOCS.md` §4.1, §7, version line; `docs/decisions.md` (the RC-16 amendment row);
`docs/log-inbox/harness.md`; the Status line of the prompt; this report.

## 10. Questions

The eleven questions of section 0, with their `Recommended:` lines, are the questions of this report. The one
decision that waits for Alfonso is the light model id (RC-26).

## Appendix A: the tier rule, lane by lane

"Literal rule" and "Stricter parse" as in section 7.3. Minutes 0 mark a lane still running at measurement
(`2236`, `2324`).

| Lane | `Lane:` | Literal rule | Stricter parse | Reason (literal) | Tool calls | Min |
|---|---|---|---|---|---|---|
| 2026-09-26-2340 | full | heavy | heavy | names VersionFixer.tsx | 78 | 18.1 |
| 2026-09-26-2350 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 18 | 1.4 |
| 2026-09-27-0020 | fast | light | light | fast, DOVE docs only | 20 | 1.9 |
| 2026-09-27-0030 | - | ? | ? | no prompt file found | 9 | 0.7 |
| 2026-09-27-0035 | full | heavy | heavy | names useJjomSync.ts | 217 | 34.1 |
| 2026-09-27-0051 | harness | heavy | heavy | in doubt: harness, DOVE docs | 65 | 12.6 |
| 2026-09-27-0110 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 35 | 3.4 |
| 2026-09-27-0120 | full | heavy | heavy | names useJjomSync.ts | 130 | 44.4 |
| 2026-09-27-0135 | full | heavy | heavy | merge falls back to a session | 44 | 5.5 |
| 2026-09-27-0140 | full | heavy | heavy | Lane: full | 69 | 15.6 |
| 2026-09-27-0150 | full | heavy | heavy | Lane: full | 122 | 18.6 |
| 2026-09-27-0200 | full | heavy | heavy | Lane: full | 105 | 29.4 |
| 2026-09-27-0214 | harness | heavy | heavy | in doubt: harness, DOVE code or unparsed | 72 | 12.3 |
| 2026-09-27-0225 | full | heavy | heavy | Lane: full | 103 | 53.7 |
| 2026-09-27-0250 | full | none (direct) | none | merge, preconditions pass | 30 | 4.9 |
| 2026-09-27-0300 | full | none (direct) | none | merge, preconditions pass | 32 | 4.6 |
| 2026-09-27-0325 | full | heavy | heavy | merge falls back to a session | 42 | 6.8 |
| 2026-09-27-0345 | full | none (direct) | none | merge, preconditions pass | 27 | 4.8 |
| 2026-09-27-0405 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 25 | 2.9 |
| 2026-09-27-0830 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 51 | 10.2 |
| 2026-09-27-0935 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 52 | 6.1 |
| 2026-09-27-1015 | full | heavy | heavy | Lane: full | 70 | 31.2 |
| 2026-09-27-1030 | full | heavy | heavy | Lane: full | 88 | 16.6 |
| 2026-09-27-1035 | full | heavy | heavy | Lane: full | 85 | 32.5 |
| 2026-09-27-1105 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 39 | 6.2 |
| 2026-09-27-1110 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 107 | 22.6 |
| 2026-09-27-1119 | full | none (direct) | none | merge, preconditions pass | 22 | 5.8 |
| 2026-09-27-1125 | full | none (direct) | none | merge, preconditions pass | 27 | 5.9 |
| 2026-09-27-1145 | full | heavy | heavy | Lane: full | 71 | 15.9 |
| 2026-09-27-1216 | full | none (direct) | none | merge, preconditions pass | 19 | 5.1 |
| 2026-09-27-1225 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 41 | 6 |
| 2026-09-27-1235 | discovery | heavy | heavy | in doubt: discovery, DOVE code or unparsed | 62 | 27.5 |
| 2026-09-27-1310 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 46 | 15.5 |
| 2026-09-27-1409 | full | heavy | heavy | merge falls back to a session | 18 | 6 |
| 2026-09-27-1428 | full | heavy | heavy | merge falls back to a session | 29 | 7.8 |
| 2026-09-27-1430 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 43 | 7.8 |
| 2026-09-27-1437 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 30 | 4 |
| 2026-09-27-1440 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 37 | 10.6 |
| 2026-09-27-1450 | full | none (direct) | none | merge, preconditions pass | 14 | 6.6 |
| 2026-09-27-1458 | full | none (direct) | none | merge, preconditions pass | 20 | 5.8 |
| 2026-09-27-1500 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 66 | 17.4 |
| 2026-09-27-1501 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 55 | 11.2 |
| 2026-09-27-1504 | full | none (direct) | none | merge, preconditions pass | 33 | 10.5 |
| 2026-09-27-1521 | full | none (direct) | none | merge, preconditions pass | 25 | 6.9 |
| 2026-09-27-1536 | full | none (direct) | none | merge, preconditions pass | 25 | 8.4 |
| 2026-09-27-1540 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 17 | 2.1 |
| 2026-09-27-1545 | full | heavy | heavy | Lane: full | 85 | 19.4 |
| 2026-09-27-1546 | full | none (direct) | none | merge, preconditions pass | 24 | 6.6 |
| 2026-09-27-1610 | full | heavy | heavy | Lane: full | 88 | 20 |
| 2026-09-27-1611 | full | heavy | heavy | Lane: full | 116 | 35.6 |
| 2026-09-27-1620 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 17 | 1.5 |
| 2026-09-27-1621 | full | heavy | heavy | merge falls back to a session | 24 | 7.6 |
| 2026-09-27-1625 | - | ? | ? | no prompt file found | 94 | 18.9 |
| 2026-09-27-1632 | full | none (direct) | none | merge, preconditions pass | 38 | 7.7 |
| 2026-09-27-1645 | full | heavy | heavy | names VersionFixer.tsx | 121 | 33.6 |
| 2026-09-27-1646 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 53 | 13.7 |
| 2026-09-27-1647 | full | heavy | heavy | Lane: full | 176 | 61.8 |
| 2026-09-27-1704 | full | heavy | heavy | merge falls back to a session | 48 | 10.2 |
| 2026-09-27-1705 | full | none (direct) | none | merge, preconditions pass | 21 | 7 |
| 2026-09-27-1723 | full | none (direct) | none | merge, preconditions pass | 23 | 7 |
| 2026-09-27-1725 | full | heavy | heavy | Lane: full | 150 | 39.2 |
| 2026-09-27-1726 | full | heavy | heavy | Lane: full | 86 | 25.5 |
| 2026-09-27-1727 | full | heavy | heavy | Lane: full | 124 | 44.4 |
| 2026-09-27-1736 | full | none (direct) | none | merge, preconditions pass | 24 | 8.4 |
| 2026-09-27-1738 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 44 | 14.3 |
| 2026-09-27-1740 | full | heavy | heavy | Lane: full | 184 | 112.9 |
| 2026-09-27-1751 | full | none (direct) | none | merge, preconditions pass | 22 | 6.2 |
| 2026-09-27-1801 | full | none (direct) | none | merge, preconditions pass | 35 | 32 |
| 2026-09-27-1805 | full | heavy | heavy | --critical-zone-goahead | 91 | 40.2 |
| 2026-09-27-1806 | full | heavy | heavy | --critical-zone-goahead | 125 | 47.8 |
| 2026-09-27-2049 | full | none (direct) | none | merge, preconditions pass | 48 | 9.8 |
| 2026-09-27-2105 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 74 | 26.4 |
| 2026-09-27-2146 | full | none (direct) | none | merge, preconditions pass | 21 | 5.3 |
| 2026-09-27-2225 | fast | heavy | heavy | in doubt: fast, DOVE code or unparsed | 70 | 18.6 |
| 2026-09-27-2235 | full | heavy | heavy | Lane: full | 87 | 23.8 |
| 2026-09-27-2236 | discovery | light | light | discovery, DOVE the report only | 155 | 0 |
| 2026-09-27-2248 | full | none (direct) | none | merge, preconditions pass | 19 | 7.4 |
| 2026-09-27-2255 | discovery | heavy | light | in doubt: discovery, DOVE code or unparsed | 120 | 52.2 |
| 2026-09-27-2304 | full | none (direct) | none | merge, preconditions pass | 30 | 12.7 |
| 2026-09-27-2324 | full | heavy | heavy | Lane: full | 81 | 0 |
| 2026-09-27-2327 | full | none (direct) | none | merge, preconditions pass | 67 | 22.8 |

## Appendix B: evidence outside the tree

`~/.jjodel-lanes/P-2026-09-27-2330/`: `measure-lanes.mjs` and its output `lanes.json` (section 3), `union-check.mjs`
and `union-rule.mjs` (section 4.3), `tier.mjs`, `tier2.mjs` and `appendix-tier.md` (section 7.3),
`dryrun-model/` (section 7.1: `control2`, `sonnet2`, `haiku2`, `bogus2` and `resume-nomodel`, `.jsonl` and `.err`).
