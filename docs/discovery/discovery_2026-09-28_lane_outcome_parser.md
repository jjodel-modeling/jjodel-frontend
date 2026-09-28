# Discovery: `Outcome: completed` read as unparsed by lane-run

- Prompt-ID: `P-2026-09-28-1120` (Lane: fast, Tier: light)
- Tree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, HEAD `447e4239b`. The working copy of
  `frontend/scripts/lane-run.mjs` is byte-identical to HEAD (md5 `10b8f2407aaf229208259340b1833a45`).
- Executor: Claude (Cowork, desktop bridge), not a lane session. Phase 1, read-only: no source file was edited.
- Tags: **[R]** read in a file of HEAD `447e4239b`; **[M]** measured on the lane logs in `~/.jjodel-lanes`.

---

## 0. Answer in brief

- **The parser behaves as specified and tested; the lane broke the contract.** RC-20 (PROTOCOL.md:268-272) fixes
  a closed vocabulary for the last line of every final message: `Outcome: done | hard-stop | question | blocked`.
  `laneRun.test.ts:949-955` and `:986` assert that a word outside it (`doneish`, `finished`) reads `unparsed`.
  So "unparsed" on `Outcome: completed` is the designed alarm, not a hole. **[R]**
- **Likely root cause of the violation:** the only `Outcome` the executor finds in `CLAUDE.md` (line 656) and
  `AGENTS.md` (line 645) is the log-entry field `**Outcome**: ✅ completed | ⚠️ partial | ❌ problems`. The RC-20
  vocabulary lives in `docs/PROTOCOL.md` only, and the lane prompt of `P-2026-09-28-1015` names only
  `Outcome: question`. A light-tier executor (Sonnet 5) closed with the log-entry word. **[R]**
- **The prompt's premise needs one correction:** the parser does not read the `result` event. `lastOutcome()`
  (lane-run.mjs:520-531) scans the text blocks of `assistant` events for the last line starting with `Outcome:`.
  In this log both carry the same line (log.jsonl:1035 assistant, :1036 result), so the diagnosis is unchanged. **[R][M]**
- **Frequency:** across every lane log in `~/.jjodel-lanes`, `Outcome: completed` occurs once, this lane. **[M]**
- **If the synonym is added anyway, false-positive risk is low but not nil.** `completed` cannot be mistaken
  for hard-stop, question or blocked. The real cost is on the contract: `chain` (lane-run.mjs:1804-1811) advances
  to the next lane only on `done` with exit 0, so a synonym widens what lets an unattended chain proceed, and it
  sets the precedent for `finished`, `complete`, `success`. The fix is one regex token, plus one test that
  contradicts nothing existing (the `doneish` test still holds thanks to `\b`, `completedly` stays unparsed).
- **Recommended: B + keep A optional.** B: add the RC-20 line to `CLAUDE.md` next to the log-entry template
  ("the log field is not the closing line; the closing line is `Outcome: done | hard-stop | question | blocked`"),
  which fixes the cause for every tier. A (the fix asked for) only if you want tolerance on top of it; if so, map
  `completed` to `done` in the capture so `status --all` and `chain` print `done`, not `completed`.

## 1. Where the parsing happens [R]

- `lane-run.mjs:187` `const OUTCOME = /^Outcome:\s*(done|hard-stop|question|blocked)\b/;`
  case-sensitive, no `i` flag, anchored at line start, word boundary after the outcome (so a suffix such as
  `Outcome: done · <shas>` parses, PROTOCOL.md:395).
- `lane-run.mjs:519-531` `lastOutcome(path)`: last trimmed line starting with `Outcome:` in assistant text.
- Three consumers of `OUTCOME`:
  - `status <id>` (line 566): prints the whole line when `OUTCOME.test` passes, else `unparsed: <line>`.
  - `status --all` (lines 629-630): prints the captured word `m[1]`, else `unparsed`.
  - `chain` supervisor (lines 1804-1811): `lane.outcome = m[1]`; any value other than `done` stops the chain.
- `laneState()` (line 551) returns `null` while the lane runs, so the Outcome of an earlier turn is not shown.

## 2. The real case [M]

- `~/.jjodel-lanes/P-2026-09-28-1015/`: `exit.txt` = `0`, `tier.txt` = `light (claude-sonnet-5)`.
- log.jsonl:125 earlier turn, `Outcome: question` (valid). log.jsonl:1035 last assistant text ends with
  `Outcome: completed`; log.jsonl:1036 `result`, subtype `success`, same closing line.

## 3. Tests that pin the current behaviour [R]

- `frontend/scripts/hooks/__tests__/laneRun.test.ts:942-947` suffix after the word parses.
- `:949-955` last line `Outcome: doneish` reads `unparsed: Outcome: doneish`.
- `:984-986` `status --all` row for `Outcome: finished` reads `unparsed`.
- A change under A leaves all three green and needs one new test (`Outcome: completed` reads done, in `status`
  and in `status --all`), per the P9 test discipline.

## 4. Options

- **A. Synonym in the parser (the fix asked for).** Minimal diff: line 187 becomes
  `/^Outcome:\s*(done|completed|hard-stop|question|blocked)\b/` and the two places that use `m[1]`
  (629-630, 1805-1807) normalise `completed` to `done`. Without the normalisation `chain` would stop on a
  completed lane, because it compares with `'done'`. So the "one regex token" is really three touch points.
  PROTOCOL.md changelog entry needed, since RC-20's vocabulary changes.
- **B. Fix the cause.** One sentence in `CLAUDE.md` (and its `AGENTS.md` mirror) beside the log-entry template.
  No code, no test. Governance file: needs your decision.
- **C. Do nothing.** `unparsed` already did its job: it made you look. Cost: the same confusion recurs on
  light-tier lanes.

## 5. Risks

- A widens the set of words that let an unattended `chain` advance; B does not.
- Case: the parser is case-sensitive for every outcome; A should stay case-sensitive for consistency.
- The main checkout `~/jjodel` is on `validation-skeleton`, not on the trunk: Phase 2 must run in `~/jjodel-release`.

## 6. Open questions for Alfonso

1. A, B, or A+B?
2. Under A: normalise `completed` to `done` (recommended) or print it as its own word?

Decided 2026-09-28 by Alfonso: **B** only. The parser is left as is; the sentence goes in `CLAUDE.md` §21.2, `AGENTS.md` regenerated.

## 7. Files read

- `frontend/scripts/lane-run.mjs` (HEAD `447e4239b`), lines 30-60, 180-195, 515-570, 620-635, 1795-1820
- `frontend/scripts/hooks/__tests__/laneRun.test.ts`, lines 940-995
- `docs/PROTOCOL.md`, lines 265-274, 395; `CLAUDE.md:656`; `AGENTS.md:645`
- `~/.jjodel-lanes/P-2026-09-28-1015/{log.jsonl,exit.txt,tier.txt,prompt.txt}`
- `docs/prompts/claude_2026-09-28_1015_prompt_demo_prep_3001.md` on branch `demo-prep`
- every `~/.jjodel-lanes/P-*/log.jsonl`, grep for `Outcome:` values
