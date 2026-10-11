# Governance drift of the agentic harness: dataset and first numbers for a CAIN 2027 short paper, discovery

Prompt-ID: P-2026-10-11-1630
Chat: C-2026-10-10-1145
Request: https://claude.ai/code/session_01FWUFsDDVN1SMB4MGco19GJ
Front: harness
Lane: full (discovery; read-only on the code; writes only a report and data files under `docs/research/cain-2027/`). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: P-2026-10-11-1150, P-2026-10-11-1430, P-2026-10-11-1540
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-caindata`, branch `cain-data`, cut from the trunk tip that carries the docs commit adding this
prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1630 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended (lane auto): a question with one recommendation inside this lane's perimeter is answered as recommended
(RC-21).

## Context (settled by the chat, do not redo)
Alfonso will submit a short paper (5 pages + 2 of references, IEEE template, double-anonymous) to CAIN 2027
(deadline 2026-10-30). Topic: **governance drift in an agentic development harness**. The harness delegates
decisions to agents under written rules: RC-25 (decisions proceed, ratification is asynchronous), RC-26 (a closed
list of decision classes that must wait for the human), RC-27/28 (verification, digests), RC-18 (a measured budget
for harness-only work), and a header grammar for decision rows enforced by `frontend/scripts/gates/docs-digest.ts`.
Today's work measured that these rules drifted:

- digest P-2026-10-11-1430 (`docs/ratifiche/claude_ratifiche_2026-10-11_provisional_digest.md`): 77 provisional
  rows, none ever acknowledged through a digest; 8 rows in RC-26 classes decided without waiting (R-JS-7, R-JS-10,
  R-SIM-120, R-VP-31, R-UNDO-8, R-VP-42, R-VP-46, RC-38); 49 headers outside the grammar; 165 rows invisible to the
  generator; a config switch (`53aed9baa`) with no register row;
- RC-18 measured by the chat on 2026-10-11 (7 days): 33 of 69 code lanes harness-only, share 0.48 against 0.25;
- discovery P-2026-10-11-1150 (`docs/discovery/discovery_2026-10-11_insights_more_cards.md`): decision autonomy
  (113 questions, 26 adopted by the chat, 12 by Alfonso, 1 overturned), `Corregge` almost empty since 2026-10-05,
  lead times;
- lane P-2026-10-11-1540 ratified 76 rows on 2026-10-11 and fixed the headers (merge `c6804f3d3`).

The paper needs these findings as a **time series with a method**, not as a one-off count. Reuse the 1150 and 1430
reports; remeasure only what they do not give over time.

## WHAT (read-only Phase 1)
Measure, do not assume. Probe scripts go in `/tmp/p1630/`; the final extraction script is kept in
`docs/research/cain-2027/scripts/` so the numbers can be regenerated (a script there is research material, not
harness code: do not wire it into `package.json` or any gate).

1. **Decision register over time.** For every row of `docs/decisions.md` (RC-, R-, any prefix), from its history
   (`git log -L` or `git log -S` on the header, across the archive files if rows moved): id, date of introduction,
   commit, adopting chat or author, status at introduction (ratified / provisional / other), date and commit of
   ratification if any, latency to ratification, `evidence`/`verified`/`reversible` as first written.
   CSV `data/decisions.csv`.
2. **RC-26 crossings.** For each row, whether its class is on the RC-26 list (critical zone, exported interface
   breaking a consumer, amendment of a ratified row, deletion, demo, model/effort/cost, push), with the rule used
   and a hand check of every positive and of a random sample of 30 negatives (report precision on that sample).
   Whether it waited (decided by Alfonso, or provisional with a waiting marker) or not. Only rows dated on or after
   2026-09-26 (RC-26) count as crossings; earlier ones are the baseline. CSV column in `decisions.csv`.
3. **Grammar conformance over time.** Run the header parser of `docs-digest.ts` (import it, do not copy it) against
   `docs/decisions.md` at one commit per day since the grammar was ratified (RC-25..27): rows, rows parsed, rows
   failing by kind, rows invisible (no `- `, non-`R` id). CSV `data/conformance_daily.csv`. Same for the moment each
   failure first appeared and the row and chat that introduced it.
4. **RC-18 over time.** The harness-only share of code lanes on a 7-day sliding window, daily, since RC-18
   (2026-09-25), with the definition of the row (code commits touching only `frontend/scripts/`, `.claude/`,
   `docs/`) and the lane id from the commit subjects and trailers. Say how a lane id is attached to a commit and
   the share of commits without one. CSV `data/rc18_daily.csv`.
5. **Autonomy over time.** From the 1150 method: questions per lane and the answer class (adopted by chat, by
   Alfonso, overturned, bare GO) by week. CSV `data/autonomy_weekly.csv`.
6. **Rule timeline.** Dates of introduction and amendment of RC-18, RC-21, RC-25..RC-30, RC-38..40, the digest
   generator and every gate that enforces a rule mechanically (hooks, `check:*`). This is the x-axis of the
   paper's figure: which rules had a mechanical check and which were text only, and whether drift differs between
   the two. CSV `data/rules.csv` with a column `enforced_by` (script path or `none`).
7. **The central comparison.** For each rule: violations over time, split by "enforced by a check" vs "text only".
   One table and one small figure description (no plotting library needed; a CSV the paper can plot). This is the
   paper's main claim to test: drift concentrates in rules without mechanical enforcement. Say plainly if the data
   does not support it.
8. **Anonymization.** List every identifying string the paper or its artifact would expose (project name, org,
   repository URLs, people, chat and session ids, file paths with the product name) and propose a cover name and a
   mapping. Write the mapping to `docs/research/cain-2027/anonymization.md`; the CSVs keep real ids (they stay in the
   repo), and the report says which columns must be rewritten for the public artifact.
9. **Threats.** One project, one human decider, descriptions written by the agents themselves, the register edited
   by the same agents it governs, today's ratification wave (76 rows on 2026-10-11) as an intervention that changes
   the series. Say what each threat does to the numbers.

Write the report to `docs/research/cain-2027/discovery_2026-10-11_governance_dataset.md` (P4: hypothesis under test,
goal, files read with full paths, findings with `file:line` or commit and verbatim quotes, the tables, dependencies
and risks, open questions each with `Recommended:`). End with a section «Numbers for the paper»: at most 12 lines,
each a single quotable number with its definition and the CSV it comes from.

Commit the report, the CSVs, the script and `anonymization.md` with an explicit pathspec, one commit:
`docs(research): governance drift dataset for CAIN 2027 (P-2026-10-11-1630)`. Log entry in
`docs/log-inbox/harness.md` uncommitted (RC-17). Then stop with `Outcome: hard-stop`.

## HARD STOP
After that commit. No paper text, no code changes, no merge.

## DO NOT
- Change `docs/decisions.md`, any gate, any script outside `docs/research/cain-2027/scripts/`, or `package.json`.
- Write into `~/.jjodel-lanes/` or other worktrees; read them freely.
- Publish anything, push, or contact any service.

## REFERENCES
- `docs/decisions.md` RC-18, RC-21, RC-25..RC-30, RC-38..RC-40; `docs/digest/README.md`;
  `frontend/scripts/gates/docs-digest.ts`; `docs/PROTOCOL.md` P4, P9, P14, P16; RC-17.
- `docs/ratifiche/claude_ratifiche_2026-10-11_provisional_digest.md`,
  `docs/discovery/discovery_2026-10-11_insights_more_cards.md`,
  `docs/discovery/discovery_2026-10-10_lane_board_model_insights.md`.
