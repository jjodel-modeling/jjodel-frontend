# Insights slice S1: why work is redone, how many lanes close a request, and the Corregge attribution fix

Prompt-ID: P-2026-10-11-2235
Chat: C-2026-10-10-1145
Request: https://claude.ai/code/session_01FWUFsDDVN1SMB4MGco19GJ
Front: harness
Lane: full (five files, RC-3). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: P-2026-10-11-1150, P-2026-10-11-1205
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-insights1`, branch `insights-s1`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-2235 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended (lane auto): a question with one recommendation inside this lane's perimeter is answered as recommended
(RC-21).

## Context (decided, do not reopen)
- The discovery P-2026-10-11-1150 (`docs/discovery/discovery_2026-10-11_insights_more_cards.md`) designed this
  slice: §2.1 to §2.4 (measures), §6 cards A and B (contract, titles, formulas, failing tests), §7 row 1 (files).
  Alfonso accepted its recommendations on 2026-10-11 at 14:25: S1 first, and the `Corregge` resolution fixed here,
  timestamp prefix first, as `check:docs` reads it.
- **RC-18 waiver.** The harness budget was over on 2026-10-10 and 2026-10-11 (0.327 and 0.396 against 0.25,
  `docs/research/cain-2027/data/rc18_daily.csv`). Alfonso waived it for this slice on 2026-10-11 at 22:27
  («RC-18: procedi»). The waiver covers S1 only; S2 and S3 still need the budget or a new waiver.
- P-2026-10-11-1205 (board loading and stale state, async `collect()`) is merged; build on its code.

## WHAT
1. **RC-22 check first.** List every worktree (`git worktree list`) and every lane folder without `exit.txt`; if any
   holds uncommitted or unmerged changes to one of the five files below, stop with `Outcome: question` naming it.
2. **`cPid` fix** (§2.3). In `logEntries()` (`frontend/scripts/lane-board/lane-board.mjs`, around `:968` on the
   1150 base; find it by content), resolve `Corregge` from the timestamp prefix first, then the file name, then a
   Prompt-ID inside the annotation. The two misattributions of §2.3 must resolve to P-2026-10-10-2029 and to the
   lane of the 2026-09-18 22:19 prefix.
3. **Card A, «Why work is redone»** and **card B, «How many lanes it takes to close a request»**: implement §6 A and
   §6 B exactly as written there (server fields `logCauses`, `logWeeks`, `correctionChains`, per-lane
   `signals.visualSendBack`; client drawing in `insights.js`; titles, subtitles, notes and thresholds `MIN_RATE` /
   `MIN_READ` as specified). New git calls only through `gitAsync`, never `spawnSync`. Before introducing a name,
   `grep -rn` it over `frontend/scripts/lane-board/` and the two board tests; the 1150 report lists names already
   checked.
4. **Tests that fail before**: the two of §6 A and the one of §6 B, in
   `frontend/scripts/hooks/__tests__/laneBoard.test.ts` and `laneBoardInsights.test.ts`. Run them red on the base,
   green after.
5. **README**: document the two cards and the `Corregge` resolution order in `frontend/scripts/lane-board/README.md`,
   in English.
6. Gates: `npm run typecheck:scripts`, the two board test files, `npm run check:scripts`, `npm run check:docs`.
7. **Visual check (RC-23).** Start a test board on port 4703 from this worktree (not 4700), open the Insights tab and
   record what the two cards show for the last 14 days: counts per Causa letter, the deepest chain, the median
   corrector cost. Leave 4703 running for Alfonso and say so.
8. Commit the five files with an explicit pathspec, one commit:
   `feat(lane-board): insights cards for rework causes and correction chains, Corregge by timestamp (P-2026-10-11-2235)`.
   Log entry in `docs/log-inbox/harness.md` uncommitted (RC-17). Stop with `Outcome: hard-stop (ready for the visual
   check)`.

## HARD STOP
After the commit and with 4703 running. No merge.

## DO NOT
- Touch any file outside the five: `frontend/scripts/lane-board/lane-board.mjs`,
  `frontend/scripts/lane-board/insights.js`, `frontend/scripts/lane-board/README.md`,
  `frontend/scripts/hooks/__tests__/laneBoard.test.ts`, `frontend/scripts/hooks/__tests__/laneBoardInsights.test.ts`.
- Start S2 or S3 work, rename existing fields (`rework`, `chains` keep their meaning), or change `lane-run.mjs`.
- Restart or stop the 4700 service, or write into `~/.jjodel-lanes/` and other worktrees.

## REFERENCES
- `docs/discovery/discovery_2026-10-11_insights_more_cards.md` §0, §2, §5, §6 A-B, §7, §10.
- `docs/decisions.md` RC-3, RC-17, RC-18, RC-21, RC-22, RC-23; CLAUDE.md §21.3 (Causa letters);
  `docs/PROTOCOL.md` P9, P14, P16.
