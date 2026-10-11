# CAIN 2027 full paper: tables per research question, RC-26 review sheet, anonymized replication package

Prompt-ID: P-2026-10-11-1725
Chat: C-2026-10-10-1145
Request: https://claude.ai/code/session_01FWUFsDDVN1SMB4MGco19GJ
Front: harness
Lane: full (research material only; read-only on the code; writes only under `docs/research/cain-2027/` and one archive outside the repo). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: P-2026-10-11-1630, P-2026-10-11-1719
Status: eseguito 2026-10-11, lane P-2026-10-11-1725 (cain-rq, 67f9ecfce), merged f35e75a07 (P-2026-10-11-1846)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-cainrq`, branch `cain-rq`, cut from the trunk tip that carries the docs commit adding this
prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a clean
`git status`; check that `docs/research/cain-2027/discovery_2026-10-11_governance_dataset.md` exists. Otherwise stop
with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1725 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended (lane auto): a question with one recommendation inside this lane's perimeter is answered as recommended
(RC-21).

## Context (decided by Alfonso on 2026-10-11, do not reopen)
Format: full research paper, 10+2 pages, IEEE, double-anonymous; fallback to short at the 2026-10-20 gate. If on
2026-10-20 the numbers do not answer the research questions quantitatively, the paper is compressed to a short.

The dataset of P-2026-10-11-1630 (`docs/research/cain-2027/`, report `discovery_2026-10-11_governance_dataset.md`,
CSVs in `data/`, scripts in `scripts/`, `anonymization.md`) is the base and is not redone. Its §0 narrow claim is the
paper's spine: a mechanical check holds a rule only on the path where it runs; rules whose compliance needs a
judgment, and checkable rules whose check nobody runs, drift until a human-triggered batch repairs them.

The open questions of its §11 are settled as recommended: (1) the narrow claim; (2) the series end before merge
`c6804f3d3`, and 2026-10-11 is treated as an intervention, reported separately; (3) the public artifact ships CSVs
only, commit shas replaced by HMAC, verbatim quotes paraphrased; (4) Alfonso reads the RC-26 positives himself before
submission (this lane prepares the sheet, it does not judge); (5) the lane folders are frozen in an archive.

Research questions, partitioned by the nature of the rule (not by the presence of a check):
- **RQ1, checkable rules.** How well is a checkable rule kept, depending on where its check runs? Positions: hook on
  the commit, blocking check at launch, warning only, no check, check that exists but nobody runs (the header
  grammar and `docs-digest.ts`).
- **RQ2, judgment rules.** How much do rules that need a judgment drift (RC-26, RC-25, RC-18), and who notices?
- **RQ3, detection and repair.** How is drift detected and repaired: silent failure, latency, batch repair.

## WHAT
Measure, do not assume. Reuse the 1630 scripts (import or call them; do not fork them). New scripts go in
`docs/research/cain-2027/scripts/`, probe scripts in `/tmp/p1725/`. Do not wire anything into `package.json` or a gate.

1. **RQ1 table.** One row per (checkable rule, check position, commit path), where the commit path is lane, project
   chat, or `lane-run` itself. Columns: rule, check position, enforced_by (script path or `none`), path, n, violations,
   rate, repaired later (count and median latency). Cover at least: `Model:` trailer, subject length, prompt header
   lines `Front:` / `Request:` / `Depends:`, the decision-header grammar. CSV `data/rq1_check_position.csv`. State in the
   report whether the ordering by check position is monotone, and where it is not.
2. **RQ2 table.** For RC-26, RC-25, RC-18: crossings or violations per day up to the day before `c6804f3d3`, and the
   intervention day separately. For each crossing, how and when it was noticed (a digest, a lane report, the chat,
   Alfonso, never), with the evidence (commit or file:line). CSV `data/rq2_judgment.csv`.
3. **RC-26 review sheet for Alfonso.** `docs/research/cain-2027/review/rc26_review.md`: the 71 positives and the 30
   sampled negatives of the 1630 report, one row each: id, date, header as written, one-line summary of what it
   decides, RC-26 class matched and by which rule, waited (yes/no, with the marker), delegation cited if any, and an
   empty column `verdict` (values Alfonso will write: `mine` / `delegated` / `not-RC-26`). Ordered by date. Add at the
   top the three-line instruction for filling it, and a script `scripts/rc26_apply_review.*` that reads the filled
   sheet and recomputes the RC-26 numbers (crossings, share that did not wait, precision) into
   `data/rc26_reviewed.csv`. Run it on the empty sheet and check that it reports "0 reviewed" without failing.
4. **RQ3 table.** One row per drift episode (every non-conforming header of `conformance_failures.csv`, every RC-25
   row ratified late, every RC-18 day over budget): introduced (date, commit, chat), first detected (date, by what or
   whom), repaired (date, commit), latency introduced→detected and detected→repaired, and whether the repair was part
   of a batch (more than 10 repairs in one commit or merge). CSV `data/rq3_detection_repair.csv`.
5. **Period confound.** The hook arrived on 2026-09-21 and the judgment rules on 2026-09-26. For RQ1, recompute the
   rates restricted to commits on or after 2026-09-26, so the two families are compared on the same window. One
   small table in the report, plus one sentence saying how much the RQ1 gradient changes.
6. **Threats, as material.** Expand §9 of the 1630 report into a structured list (construct, internal, external,
   conclusion validity), each threat with what it does to which number and what the paper can do about it. File
   `docs/research/cain-2027/threats.md`. Material for the authors, not paper prose.
7. **Replication package.** Build `docs/research/cain-2027/replication/` following `anonymization.md` §3:
   anonymized copies of every CSV the paper uses, shas replaced by HMAC-SHA256 truncated to 12 hex characters, with
   the key read from `~/.jjodel-cain-key` (create it with 32 random bytes if absent; it stays outside the repo and is
   never printed or committed); identifying strings rewritten with the mapping; free-text columns paraphrased or
   dropped; a `README.md` in English (what each file is, column definitions, how the numbers in the report derive
   from them, what was removed and why). Then a check script `scripts/check_anonymity.*` that greps the whole
   `replication/` folder for every identifying string of `anonymization.md` (case-insensitive, also inside URLs and
   paths) and for any 40- or 7..12-hex string that matches a real commit of the repo; it must report zero hits. Put its
   output in the report.
8. **Archive.** Freeze the lane folders: `tar czf ~/jjodel-cain-archive/lanes_2026-10-11.tar.gz -C ~ .jjodel-lanes`
   (create `~/jjodel-cain-archive/` if absent; read-only on `~/.jjodel-lanes/`). Record path, size, sha256 and the
   file count in the report. The archive stays outside the repo.

Write the report to `docs/research/cain-2027/discovery_2026-10-11_rq_tables.md` (P4: goal, files read with full
paths, findings with commit or file:line, the tables, risks, open questions each with `Recommended:`). End with a
section «Gate 2026-10-20»: for each RQ, one line saying whether it is answered quantitatively today, by which number,
and what is still missing (for RQ2, say explicitly which numbers wait for Alfonso's review).

Commit everything under `docs/research/cain-2027/` with an explicit pathspec, one commit:
`docs(research): RQ tables, RC-26 review sheet and replication package for CAIN 2027 (P-2026-10-11-1725)`.
Log entry in `docs/log-inbox/harness.md` uncommitted (RC-17). Then stop with `Outcome: hard-stop`.

## HARD STOP
After that commit. No paper text, no code changes, no merge, no verdicts in the review sheet.

## DO NOT
- Change `docs/decisions.md`, any gate, any script outside `docs/research/cain-2027/scripts/`, or `package.json`.
- Change the 1630 CSVs in place: new numbers go in new files.
- Write into `~/.jjodel-lanes/` or other worktrees; read them freely.
- Commit, print or log the HMAC key.
- Publish anything, push, or contact any service.

## REFERENCES
- `docs/research/cain-2027/discovery_2026-10-11_governance_dataset.md` (§0, §8, §9, §11, §13), `anonymization.md` §3,
  `data/*.csv`, `scripts/`.
- `docs/decisions.md` RC-18, RC-21, RC-25..RC-28; `frontend/scripts/gates/docs-digest.ts`; `docs/PROTOCOL.md` P4,
  P9, P14, P16; RC-17.
