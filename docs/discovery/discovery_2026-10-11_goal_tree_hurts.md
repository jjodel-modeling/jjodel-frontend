# Discovery 2026-10-11: goal tree, new softgoals, correlations and the pass for hurts

Prompt-ID: P-2026-10-11-1650 · chat C-2026-10-10-0840 · session f0c421e6 · branch `goal-tree` from `f6e14efad`
(the prompt commit). Files: `docs/goals/softgoals.json`, `docs/goals/contributions.json`, `docs/goals/conflicts.json`,
`docs/goals/goal-tree.json` (new), `docs/goals/correlations.json` (new), `docs/goals/README.md`.

## 0. Answer in brief

- **Done.** SG-8 to SG-12 written and all kept (35 to 183 contributing rows each, threshold 5). Five macro goals in
  `goal-tree.json`, every softgoal in one. 550 contributions added (447 on the new softgoals, 103 from the cost pass),
  3 first-draft entries removed and 37 updated by the sample: 998 entries on 442 rows. 53 correlations (24 negative,
  29 positive) and 2 new conflicts (13 in all).
- **The model now shows costs.** Negative links went from 8% to 19% (181 `some-`, 12 `hurt`, no `make` or `break`).
  The 12 `hurt` are the first of the model, each on a row that states or measures the damage (§3).
- **What hurts what (§5, §6).** Usability pays for most of the others: 8 negative links end in SG-1 or SG-8 (from
  fidelity, expressive power, reversibility, learnability). Five softgoals restrict expressive power (SG-3, SG-4,
  SG-6, SG-11, SG-12). Reversibility splits maintainability both ways. Every core or critical-zone gain costs the
  harness. Determinism (SG-5) still has no recorded cost.
- **Independent check (RC-27), 677 items.** New contributions: 515 of 571 confirmed as written (90.2%), 35 regraded,
  21 rejected; the cost pass drew most rejections (17 of 120). Correlations: 25 of 64 confirmed, 28 regraded, 11
  rejected. Conflicts: 2 of 2 confirmed.
- **Precision of the first draft (40 sampled, seed 20261011).** 32 confirmed as written (80.0%, Wilson 65.2% to
  89.5%); direction right on 37 (92.5%). The 3 rejections are all SG-3 entries that read «scenes unchanged» as demo
  readiness (§8).
- **Not recordable today:** 27 negatives on rows that already help the same softgoal (one entry per pair, §4).

**Decisions taken (unattended)**: eleven, in §9; the main ones: drafting and checking by fresh-context subagents;
SG-12 covering edit-time writes that lose persisted data; R-DEL-4 moved to the hurt side of SG-10; a correlation
witness counts only when one decision carries both effects.

**Decisions awaiting Alfonso (RC-26)**: none.

**Questions, none blocking (§10):**
- Q1. The Requirements tab's opposing pairs grow from 612 to 6569.
  Recommended: time the tab in the RC-23 check; if slow or noisy, a follow-up lane shows correlations instead.
- Q2. Record mixed rows (27 known)?
  Recommended: allow a second entry of opposite sign per pair, with `joinGoals`, tests and README in one lane.
- Q3. Recheck the remaining first-draft SG-3 «scenes unchanged» entries?
  Recommended: yes, a fast lane with this lane's checker rubric.
- Q4 to Q6: SG-1 to SG-7 for the 42 newer rows; SG-5's missing cost; checking the 374 `verified: none` entries.

## 1. Objective and hypotheses

Objective: under the five macro goals Alfonso approved in chat (C-2026-10-10-0840), add the softgoals the first draft
lacked (SG-8 to SG-12), record what each row costs and not only what it buys, and add the side effects between
softgoals as i* correlation links, so the model can say which choices help and which damage each aspect of Jjodel.

Hypotheses this lane set out to falsify:

- H1, «each new softgoal is reached by at least 5 R- rows». Step 1 keeps a softgoal only if it holds.
- H2, «asking each positive row what it costs finds negative links the first draft did not record». The first draft
  had 36 negative links of 451, all `some-`.
- H3, «the register states its costs rarely enough that most new negatives are `inferred` and `some-`».
- H4, «a second agent with a fresh context confirms at least 80% of what this lane adds, and of a sample of the first
  draft».

Results. H1 held: 35 to 183 rows per new softgoal. H2 held: 157 new negative contributions, 103 of them from the cost
pass, and the first 12 `hurt` of the model. H3 held for the kind and failed for the evidence: 145 of the 157 new
negatives are `some-`, but 80 are `read` and 6 `measured` against 71 `inferred`; when a row names a cost, it names it
plainly. H4 held for the contributions (515 of 571 confirmed as written, 90.2%) and for the sample at the threshold
(32 of 40, 80.0%, lower bound 65.2%), and failed for the correlations: 25 of 64 confirmed as written, 28 regraded
(mostly witnesses dropped), 11 rejected. Reading a witness is where the judgement is hardest.

## 2. Method

1. **Inventory.** The parser of the first draft (a row opens with `- **<id>` or `**<id>` followed by `**`, a comma
   or ` (A)**`, and runs to the next row start or heading; session scratch `/tmp/gt1650/parse.mjs`) reads 523 R- row
   blocks with 522 ids: 479 ids judged on 2026-10-05, R-GOAL-1, and 42 rows added since (R-SIM-137 to R-SIM-146,
   R-GEN-1 to R-GEN-17, R-GV-1 to R-GV-16). R-STR-6 keeps its (A) and (B) forms under one id. RC rows (40) and D-UI
   rows (7) are not judged, as in the first draft. Every id passes the row predicate of the contract check.
2. **Softgoals (step 1).** SG-8 to SG-12 were written before the draft, each citing the texts that state the
   principle (CLAUDE.md rules 6, 9, 14, §5, §12.6, §20.2; `docs/DESIGN-SYSTEM.md` §5, §7; the note on P8 in
   `docs/PROTOCOL.md`; D-5-1) and anchor rows found by a keyword pass over the register, with the boundary sentence
   the prompt asks for. SG-1 to SG-7 are unchanged.
3. **Draft (steps 3 and 4).** The 522 rows were cut into eight chunks of about 90 KB, in register order. Each row
   carried its existing entries and a `[POS]` mark when one of them is positive (289 rows). Eight subagents with a
   fresh context, one per chunk, applied one written rubric (Appendix C): task A, every row, SG-8 to SG-12 in both
   directions; task B, every `[POS]` row, the cost question, with negative entries on any softgoal not already
   occupied by the row. A negative the row supports on a softgoal it already has an entry for cannot be recorded (one
   entry per pair, existing entries untouched): those went to a `blocked` list, reported in §4. Each drafter listed
   every row it reviewed; coverage was checked mechanically.
4. **Independent check (step 6, RC-27).** Fresh-context subagents, in batches of 40 to 54 items, saw only the twelve
   softgoal descriptions, the scale, the row text and the entry, and returned `confirm`, `regrade` or `reject`
   (Appendix D). Applied as the prompt says: `verified: agent` on confirmed and regraded entries, the regrade written
   into the entry, rejected entries removed.
5. **Precision sample.** 40 of the 414 `verified: none` entries of the first draft, stratified by softgoal
   (proportional with a floor of 3, largest remainder: SG-1 8, SG-2 4, SG-3 6, SG-4 8, SG-5 4, SG-6 6, SG-7 4), drawn
   with mulberry32, seed 20261011, a Fisher-Yates shuffle per softgoal over the entries in file order (Appendix B).
   Same checker rubric as step 4.
6. **Correlations (step 5).** Candidates computed from the checked contributions by a script in `/tmp`
   (`/tmp/gt1650/corr.mjs`): for each ordered pair, the rows positive on `from` and negative on `to`; for each
   unordered pair, the rows positive on both. Kept when at least 3 rows, or when one row or one declared conflict names
   the trade-off. The witnesses were then read and each link checked by a fresh-context subagent.

## 3. Kinds per softgoal, before and after

Before (`HEAD:docs/goals/contributions.json`, the first draft, 451 entries on 304 rows):

| Softgoal | make | help | some+ | some- | hurt | break | total | rows | negative |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SG-1 | 0 | 33 | 65 | 7 | 0 | 0 | 105 | 105 | 7% |
| SG-2 | 0 | 18 | 15 | 5 | 0 | 0 | 38 | 38 | 13% |
| SG-3 | 0 | 15 | 49 | 2 | 0 | 0 | 66 | 66 | 3% |
| SG-4 | 0 | 48 | 60 | 2 | 0 | 0 | 110 | 110 | 2% |
| SG-5 | 0 | 15 | 11 | 0 | 0 | 0 | 26 | 26 | 0% |
| SG-6 | 0 | 17 | 54 | 2 | 0 | 0 | 73 | 73 | 3% |
| SG-7 | 0 | 3 | 12 | 18 | 0 | 0 | 33 | 33 | 55% |
| all | 0 | 149 | 266 | 36 | 0 | 0 | 451 | 304 | 8% |

After (998 entries on 442 rows):

| Softgoal | make | help | some+ | some- | hurt | break | total | rows | negative |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SG-1 | 0 | 33 | 65 | 24 | 0 | 0 | 122 | 122 | 20% |
| SG-2 | 0 | 18 | 15 | 6 | 0 | 0 | 39 | 39 | 15% |
| SG-3 | 0 | 14 | 47 | 2 | 0 | 0 | 63 | 63 | 3% |
| SG-4 | 0 | 48 | 60 | 3 | 0 | 0 | 111 | 111 | 3% |
| SG-5 | 0 | 14 | 12 | 0 | 0 | 0 | 26 | 26 | 0% |
| SG-6 | 0 | 17 | 54 | 4 | 0 | 0 | 75 | 75 | 5% |
| SG-7 | 0 | 3 | 12 | 24 | 0 | 0 | 39 | 39 | 62% |
| SG-8 | 0 | 23 | 74 | 31 | 0 | 0 | 128 | 128 | 24% |
| SG-9 | 0 | 44 | 30 | 28 | 3 | 0 | 105 | 105 | 30% |
| SG-10 | 0 | 4 | 15 | 10 | 6 | 0 | 35 | 35 | 46% |
| SG-11 | 0 | 33 | 107 | 41 | 2 | 0 | 183 | 183 | 23% |
| SG-12 | 0 | 17 | 46 | 8 | 1 | 0 | 72 | 72 | 13% |
| all | 0 | 268 | 537 | 181 | 12 | 0 | 998 | 442 | 19% |

Evidence after: `read` 675, `inferred` 237, `measured` 86. Verified after: `agent` 624, `none` 374. SG-1 to SG-7 moved
only through the cost pass (27 negative entries added: SG-1 17, SG-7 6, SG-6 2, SG-2 1, SG-4 1) and the sample (3
entries removed on SG-3, 5 regraded). The share of negative links went from 8% to 19%; the 12 `hurt` entries are the
first of the model, each on a row that states or measures the damage:

| Row | Softgoal | evidence | the damage, in the row's words |
|---|---|---|---|
| R-IRN-20 | SG-11 | read | the adapter body «va duplicato nel test e le due copie possono divergere» |
| R-IRN-33 | SG-12 | read | migrated projects keep «la vecchia forma verbatim nel proprio ir» |
| R-SIM-26 | SG-9 | read | «OR-join alla BPMN, reti non limitate, reti colorate, reti temporizzate» excluded |
| R-SIM-55 | SG-9 | read | «Esclusi: stati gerarchici, regioni ortogonali, history, composizione di macchine, object flow, tempo» |
| R-MK-14 | SG-9 | read | «'Un figlio qualsiasi è marcato' e 'tutti i figli sono marcati' non sono esprimibili in v1» |
| R-MK-6 | SG-10 | read | «uno step di simulazione re-renderizza tutti i nodi la cui view legge marked» |
| R-DEL-4 | SG-10 | measured | «0.57 ms a 10k, 4.72 ms a 50k, 23.75 ms a 200k», the 0.0005 ms option declined |
| R-JS-1 | SG-10 | measured | an absent superclass «impiega fino a 500 ms a essere rifiutata» |
| R-JS-2 | SG-10 | read | «Accepted cost: a bare name ... waits 500 ms» |
| R-JS-3 | SG-10 | read | «a forward reference with a required dependency costs up to 500 ms per pass» |
| R-JS-7 | SG-10 | read | «a retried command whose name never resolves waits MAX_WAIT_MS per retry pass» |
| R-SGL-10 | SG-11 | read | «InlineObjectSelect, clone di InlineEnumSelect ...; unificazione a debito» |

Of the 550 entries added, 447 came from task A (the new softgoals, both directions) and 103 from task B (the cost
pass); 157 are negative (`read` 80, `inferred` 71, `measured` 6). 361 rows gained at least one entry; 37 entries sit
on the 42 rows added to the register after the first draft.

## 4. The softgoals of step 1, and what the model cannot record

**Kept: all five.** Rows contributing after the check, in either direction: SG-8 128, SG-9 105, SG-10 35, SG-11 183,
SG-12 72, every one far above the threshold of 5. No number is left unused. SG-1 to SG-7 are byte-identical to the
first draft (checked by comparing the first seven objects with `HEAD`).

Edits to the new descriptions during the lane, all before the gates:
- SG-10 first cited R-DEL-4 as a row that serves it («bound a cost and measure it»). The drafter recorded R-DEL-4 as
  SG-10 `hurt` (measured), the checker confirmed it, and the row does accept a cost that grows with `idlookup` and
  declines the cheaper option. R-DEL-4 now sits on the hurt side of the description; the serve side reads «cut a wait
  and measure it» (R-JS-11).
- SG-11 cited rule 9 as «mark rather than remove apparently unused code» and counted «remove dead code» as a help.
  Two checkers saw the tension. It now reads «mark rather than remove code that only looks unused» and «remove code a
  census proved dead», which is what the R-DEAD rows do.
- At the close, every row a new description cites as an example was matched against the checked entries. Three did
  not carry an entry in the stated direction and were replaced: R-EDGE-3 on SG-8 (no entry; now R-SIM-97 and
  R-VAL-19-bis), R-VP-25 among SG-9's notations (no entry), R-SIM-90 as SG-9's restriction (its entry is a net `help`;
  now R-SIM-55, `hurt`).

**Blocked: 27 negatives the rows support and the contract cannot hold.** One entry per (req, softgoal) pair, and the
existing entries are not to be changed: a row that helps a softgoal by one clause and hurts it by another keeps only
its first-draft entry. The drafters listed these instead of recording them (not checked by RC-27):

| Softgoal | n | rows |
|---|---:|---|
| SG-1 | 5 | R-RAIL-34, R-IRN-39, R-SIM-47, R-SIM-100, R-CR2-2 |
| SG-2 | 5 | R-SIM-63, R-SIM-65, R-SIM-98, R-SIM-104, R-LAY-16 (panels that grow upward with the run) |
| SG-4 | 6 | R-D, R-UNDO-1, R-SGL-7, R-STR-1, R-VP-28, R-VAL-9 |
| SG-5 | 1 | R-SIM-122 (Clock and Play «in arrival order», a tick during the dialog «is dropped») |
| SG-6 | 4 | R-SIM-17, R-SIM-33 (hurt: a self-loop halts «dove la lettura sequenziale di UML li accetterebbe»), R-SIM-91, R-VAL-13 |
| SG-7 | 6 | R-RAIL-27, R-RAIL-28, R-RAIL-29, R-RAIL-32, R-RAIL-37, R-RAIL-45 |

These are mixed rows, and part of why the first draft looked one-sided on SG-4, SG-5 and SG-6: the cost and the gain
sit in the same row, and only the gain was recorded. The model would need either a net judgement per pair or two entries per pair (a «both» kind);
see Q2.

## 5. Correlations and conflicts

### 5.1 How the links were found

The candidate script found 41 ordered pairs with at least 3 rows positive on `from` and negative on `to`, and 48
unordered pairs with at least 3 rows positive on both; three more candidates came from declared conflicts that name a
trade-off (R-EDGE-2/R-EDGE-3 for SG-4 against SG-6, R-VP-39/R-STR-2 for SG-1 against SG-2 in both directions): 92 in
all. Counting is not reading. Eight fresh-context drafters (rubric in Appendix E) read every witness, the full row
whenever the two `why` lines did not settle it, and kept a witness only when the same decision of the row carries both
effects. A row that adds a control (SG-1 cost) and, by a separate clause, keeps its key additive (SG-4 gain) is not a
witness of SG-4 against SG-1. Positive pairs were split by the softgoal each witness pursues, so a direction exists
only with its own witnesses. 35 candidates ended with no link (co-occurrence, not a side effect); the drafters wrote 65
links, one of which (SG-2 to SG-1, negative) had no valid witness and was dropped before the check.

### 5.2 The check

The 64 drafted links went to eight fresh-context checkers with the full texts of their witnesses: 25 confirmed, 28
regraded (mostly witnesses dropped, kind and evidence kept; to `inferred`: SG-12 to SG-6, SG-6 to SG-1 negative,
SG-4 to SG-1, SG-4 to SG-11 negative; SG-11 to SG-1 from `measured` to `read`; SG-11 to SG-10 from `read` to
`measured`; SG-9 to SG-5 from `help` to `some+`), 11 rejected. Rejected: SG-1 to SG-2 (the conflict's wording is the
first draft's, not R-STR-2's), SG-2 to SG-1 positive (one row, no general relation), SG-4 to SG-6 (the quoted
«reversibility bought with conformance» is the first draft's conflict text, not in R-EDGE-3; the side effect of
R-EDGE-3 lands on SG-12, which SG-4 to SG-12 records), SG-6 to SG-10 (R-DEL-4 protects reference integrity, not
fidelity), SG-8 to SG-3 (no witness names the demo), SG-9 to SG-11 negative, SG-11 to SG-7, SG-12 to SG-7, SG-9 to SG-8
positive, SG-1 to SG-12 positive and SG-3 to SG-8 negative (fewer than 3 valid witnesses, no row naming the trade-off). **53 links remain, 24 negative and 29 positive**, all `verified: agent`; evidence `read` 44, `measured` 5,
`inferred` 4. Nine links stand on one or two witnesses, each because a witness names the trade-off itself (the
README's rule): SG-4 to SG-8 and SG-4 to SG-9 and SG-12 to SG-9 (R-MK-2's «una ratifica additiva» against «una
migrazione»), SG-6 to SG-8 (R-VAL-12), SG-6 to SG-9, SG-6 to SG-1 positive, SG-8 to SG-1 negative (R-VAL-2,
«Conseguenza accettata»), SG-11 to SG-10 (R-VP-38, «No memo (Rule 6)» against 28.6 µs to 60.9 µs per call, measured),
SG-12 to SG-10 (R-DEL-4 and R-UNDO-3, measured).

### 5.3 The links

**Negative links (24)**: serving `from` costs `to`.

| from | to | kind | evidence | n | witnesses |
|---|---|---|---|---:|---|
| SG-1 | SG-8 | some- | read | 5 | R-SIM-97, R-SIM-107, R-VAL-11, R-VAL-19-bis, R-NV-1 |
| SG-1 | SG-11 | some- | read | 3 | R-SIM-86, R-SGL-4, R-FORM-14 |
| SG-3 | SG-7 | some- | read | 3 | R-SIM-76, R-SIM-85, R-VP-60 |
| SG-3 | SG-9 | some- | read | 4 | R-SIM-79, R-SIM-82, R-SIM-93, R-VP-16 |
| SG-4 | SG-1 | some- | inferred | 6 | R-SIM-78, R-SIM-94, R-VP-22, R-VP-24, R-VP-26, R-VAL-9 |
| SG-4 | SG-7 | some- | read | 3 | R-EDGE-2, R-IRN-34, R-DEAD-4 |
| SG-4 | SG-8 | some- | read | 2 | R-SKIN-4, R-NV-1 |
| SG-4 | SG-9 | some- | read | 1 | R-MK-2 |
| SG-4 | SG-11 | some- | inferred | 5 | R-SIM-68, R-UNDO-5, R-SGL-2, R-EE-3, R-MCID-1 |
| SG-4 | SG-12 | some- | read | 3 | R-EDGE-3, R-IRN-33, R-SIM-38 |
| SG-6 | SG-1 | some- | inferred | 3 | R-SIM-19, R-SIM-88, R-VAL-12 |
| SG-6 | SG-7 | some- | read | 3 | R-EDGE-2, R-SIM-17, R-SIM-33 |
| SG-6 | SG-8 | some- | read | 1 | R-VAL-12 |
| SG-6 | SG-9 | some- | read | 2 | R-SIM-75, R-VAL-12 |
| SG-6 | SG-11 | some- | read | 4 | R-SIM-118, R-SGL-2, R-SGL-6, R-CR2-4 |
| SG-8 | SG-1 | some- | read | 2 | R-VP-26, R-VAL-2 |
| SG-9 | SG-1 | some- | read | 5 | R-SIM-88, R-VP-22, R-VP-24, R-VP-26, R-EE-1 |
| SG-9 | SG-7 | some- | read | 3 | R-SIM-17, R-SIM-108, R-VP-26 |
| SG-9 | SG-8 | some- | read | 4 | R-IRN-31, R-SIM-83, R-SIM-91, R-SIM-92 |
| SG-11 | SG-9 | some- | read | 3 | R-SIM-14, R-SIM-38, R-J7 |
| SG-11 | SG-10 | some- | measured | 1 | R-VP-38 |
| SG-12 | SG-9 | some- | read | 1 | R-MK-2 |
| SG-12 | SG-10 | some- | measured | 2 | R-UNDO-3, R-DEL-4 |
| SG-12 | SG-11 | some- | read | 3 | R-IRN-20, R-SIM-68, R-CR2-4 |

**Positive links (29)**: serving `from` also serves `to`.

| from | to | kind | evidence | n | witnesses |
|---|---|---|---|---:|---|
| SG-1 | SG-8 | some+ | read | 17 | R-RAIL-35, R-RAIL-41, R-IRN-10, R-IRN-38, R-IRN-40, R-SIM-34, R-SIM-103, R-SIM-109, R-UNDO-1, R-STR-4, R-STR-6, R-FORM-14, R-FORM-15, R-S1-3, R-VP-54, R-VAL-18, R-NV-3 |
| SG-1 | SG-11 | help | read | 6 | R-IRN-9, R-IRN-22, R-IRN-38, R-SIM-38, R-VAL-18, R-NV-3 |
| SG-2 | SG-12 | some+ | read | 4 | R-B10, R-LAY-5, R-LAY-14, R-LAY-15 |
| SG-3 | SG-1 | some+ | read | 3 | R-SIM-79, R-SIM-105, R-VP-54 |
| SG-3 | SG-4 | some+ | read | 3 | R-SIM-85, R-SIM-101, R-SIM-109 |
| SG-3 | SG-8 | some+ | read | 5 | R-SIM-79, R-SIM-80, R-SIM-98, R-VP-26, R-VP-54 |
| SG-4 | SG-2 | help | read | 3 | R-B10, R-LAY-5, R-LAY-14 |
| SG-4 | SG-11 | some+ | read | 5 | R-B9-bis, R-IRN-16, R-SIM-67, R-SIM-94, R-J4 |
| SG-4 | SG-12 | some+ | measured | 15 | R-B9, R-B10, R-IRN-34, R-SIM-55, R-SIM-78, R-SIM-90, R-SIM-99, R-SIM-123, R-SIM-134, R-MK-2, R-LAY-5, R-LAY-14, R-STR-1, R-VP-28, R-VP-21 |
| SG-5 | SG-11 | some+ | read | 3 | R-SIM-100, R-SIM-101, R-SIM-136 |
| SG-6 | SG-1 | some+ | read | 2 | R-SIM-72, R-VP-1 |
| SG-6 | SG-5 | help | read | 7 | R-SIM-7, R-SIM-19, R-SIM-21, R-SIM-25, R-SIM-73, R-SIM-88, R-SIM-110 |
| SG-6 | SG-8 | some+ | read | 3 | R-SIM-29, R-SGL-1, R-MCID-1 |
| SG-6 | SG-9 | some+ | read | 3 | R-SIM-21, R-SIM-89, R-MCID-1 |
| SG-6 | SG-11 | some+ | read | 4 | R-SIM-7, R-SIM-33, R-SIM-47, R-VAL-13 |
| SG-6 | SG-12 | some+ | measured | 3 | R-SIM-17, R-FORM-9, R-CR2-4 |
| SG-8 | SG-1 | some+ | read | 13 | R-IRN-22, R-SIM-57, R-SIM-61, R-SIM-62, R-SIM-77, R-SIM-80, R-SIM-81, R-SIM-96, R-SIM-113, R-STR-2, R-VAL-14, R-VAL-15, R-VAL-17 |
| SG-8 | SG-11 | help | read | 8 | R-IRN-22, R-IRN-38, R-IRN-41, R-STR-6, R-FORM-15, R-S1-5, R-VAL-18, R-NV-3 |
| SG-9 | SG-1 | some+ | read | 3 | R-IRN-35, R-SIM-18, R-VP-54 |
| SG-9 | SG-3 | some+ | read | 3 | R-VP-22, R-VP-24, R-VP-26 |
| SG-9 | SG-5 | some+ | read | 3 | R-SIM-22, R-SIM-73, R-SIM-88 |
| SG-9 | SG-6 | some+ | read | 18 | R-SIM-17, R-SIM-19, R-SIM-22, R-SIM-23, R-SIM-24, R-SIM-30, R-SIM-31, R-SIM-50, R-SIM-51, R-SIM-53, R-SIM-64, R-SIM-73, R-SIM-74, R-SIM-83, R-SIM-84, R-SIM-88, R-SIM-91, R-SIM-92 |
| SG-9 | SG-11 | some+ | read | 4 | R-MK-1, R-GEN-4, R-GEN-16, R-GV-8 |
| SG-11 | SG-1 | some+ | read | 8 | R-RAIL-13, R-J3, R-STR-4, R-STR-6, R-FORM-15, R-S1-3, R-DMV-1, R-NV-2 |
| SG-11 | SG-6 | some+ | read | 4 | R-SIM-8, R-FORM-15, R-GT-1, R-VAL-16 |
| SG-11 | SG-8 | some+ | read | 6 | R-SGL-1, R-STR-4, R-S1-2, R-S1-3, R-M2U-1, R-VAL-2 |
| SG-12 | SG-4 | help | measured | 7 | R-B9-bis, R-B15, R-SIM-68, R-SIM-116, R-STR-2, R-VP-39, R-VP-50 |
| SG-12 | SG-6 | some+ | inferred | 3 | R-F, R-SIM-45, R-DEL-4 |
| SG-12 | SG-11 | some+ | read | 5 | R-B9-bis, R-IRN-15, R-SIM-67, R-WCX-3, R-NV-4 |

What the links say, in short:
- **Usability pays for most of the others.** Eight negative links end in SG-1 or SG-8: fidelity (SG-6), expressive power
  (SG-9), reversibility (SG-4) and learnability itself add distinctions, notations and controls to hold in mind.
- **Five softgoals restrict expressive power.** SG-3 (constructs deferred for the demo), SG-4 and SG-12 (R-MK-2:
  exposing a key is an additive ratification, withdrawing one is a migration), SG-6 (faithful semantics bans forms the
  user could write: R-SIM-75, R-VAL-12) and SG-11 (R-J7: the profile is the one extension point of the grammar).
- **Reversibility splits the code base both ways.** SG-4 to SG-11 is positive (compatibility kept in one place, 5
  witnesses) and negative (a fallback branch, a dual form or a duplicated test body, 5 witnesses). The same holds for
  SG-12 and SG-6 against SG-11.
- **SG-4 and SG-12 reinforce each other** (additive keys that round-trip byte for byte, 15 and 7 witnesses) **except**
  where an old form is kept unmigrated (SG-4 to SG-12 negative: R-EDGE-3, R-IRN-33, R-SIM-38).
- **The harness pays for the critical zone.** SG-3, SG-4, SG-6 and SG-9 to SG-7 are all negative: a core or
  critical-zone change brings its own lane, discovery and Layer Impact Report.
- **Performance appears only as a price**: SG-11 to SG-10 (rule 6, no memo) and SG-12 to SG-10 (integrity scans).

### 5.4 Conflicts

Two conflicts added, both named by the row that defers the other and both confirmed by the checker (13 in all):
- R-SIM-53 against R-SIM-82 on SG-9: Decision E keeps the demo flowchart on FinalNode, «R-SIM-53 e else verso Fork/Join
  dopo MODELS».
- R-SIM-91 against R-SIM-93 on SG-9: the engine reads Accepting, yet «I quattro preset nascosti (DFA, NFA, Moore,
  Mealy) restano nascosti», «dopo MODELS (decisione H)».

The drafters reported no trade-off named between rows outside these. Left out on purpose: R-VAL-19 against
R-VAL-19-bis on SG-8 (the second falsifies the presuppositions of the first, an evolution link, though its point (c)
names a cost to discovery), and the mixed rows of §4, whose cost and gain are in one row.

## 6. The macro-goal view

Links between the softgoals of each ordered pair of macro goals (`+` positive, `−` negative; row = macro goal of
`from`, column = macro goal of `to`). MG-1 Usability is SG-1, SG-2, SG-8; MG-2 Expressiveness SG-6, SG-9; MG-3
Scalability SG-10, SG-11; MG-4 Dependability SG-4, SG-5, SG-12; MG-5 Delivery SG-3, SG-7.

| from \ to | MG-1 Usability | MG-2 Expressiveness | MG-3 Scalability | MG-4 Dependability | MG-5 Delivery |
|---|---|---|---|---|---|
| **MG-1 Usability** | SG-1+SG-8, SG-1−SG-8, SG-8+SG-1, SG-8−SG-1 |  | SG-1+SG-11, SG-1−SG-11, SG-8+SG-11 | SG-2+SG-12 |  |
| **MG-2 Expressiveness** | SG-6+SG-1, SG-6−SG-1, SG-6+SG-8, SG-6−SG-8, SG-9+SG-1, SG-9−SG-1, SG-9−SG-8 | SG-6+SG-9, SG-6−SG-9, SG-9+SG-6 | SG-6+SG-11, SG-6−SG-11, SG-9+SG-11 | SG-6+SG-5, SG-6+SG-12, SG-9+SG-5 | SG-6−SG-7, SG-9+SG-3, SG-9−SG-7 |
| **MG-3 Scalability** | SG-11+SG-1, SG-11+SG-8 | SG-11+SG-6, SG-11−SG-9 | SG-11−SG-10 |  |  |
| **MG-4 Dependability** | SG-4−SG-1, SG-4+SG-2, SG-4−SG-8 | SG-4−SG-9, SG-12+SG-6, SG-12−SG-9 | SG-4+SG-11, SG-4−SG-11, SG-5+SG-11, SG-12−SG-10, SG-12+SG-11, SG-12−SG-11 | SG-4+SG-12, SG-4−SG-12, SG-12+SG-4 | SG-4−SG-7 |
| **MG-5 Delivery** | SG-3+SG-1, SG-3+SG-8 | SG-3−SG-9 |  | SG-3+SG-4 | SG-3−SG-7 |

- MG-1 to MG-1: 2 positive, 2 negative
- MG-1 to MG-3: 2 positive, 1 negative
- MG-1 to MG-4: 1 positive, 0 negative
- MG-2 to MG-1: 3 positive, 4 negative
- MG-2 to MG-2: 2 positive, 1 negative
- MG-2 to MG-3: 2 positive, 1 negative
- MG-2 to MG-4: 3 positive, 0 negative
- MG-2 to MG-5: 1 positive, 2 negative
- MG-3 to MG-1: 2 positive, 0 negative
- MG-3 to MG-2: 1 positive, 1 negative
- MG-3 to MG-3: 0 positive, 1 negative
- MG-4 to MG-1: 1 positive, 2 negative
- MG-4 to MG-2: 1 positive, 2 negative
- MG-4 to MG-3: 3 positive, 3 negative
- MG-4 to MG-4: 2 positive, 1 negative
- MG-4 to MG-5: 0 positive, 1 negative
- MG-5 to MG-1: 2 positive, 0 negative
- MG-5 to MG-2: 0 positive, 1 negative
- MG-5 to MG-4: 1 positive, 0 negative
- MG-5 to MG-5: 0 positive, 1 negative

Reading. MG-2 Expressiveness is the strongest source of side effects (16 links to other macro goals, 3 within), and
the one that costs Usability most (4 negative links into MG-1). MG-1 Usability receives the most (14 links in), then
MG-3 Scalability (12). From MG-4 Dependability to MG-3 Scalability the links split evenly, 3 positive and 3 negative,
and none runs back: keeping saved forms and committed behaviour costs a second code path as often as it concentrates
compatibility in one place. MG-5 Delivery helps Usability (scenes made readable) and costs Expressiveness and its own
harness budget. No link enters MG-3 from MG-1 negatively except SG-1 to SG-11 (aligning the UI with what runs adds a
second path), and no link ever reaches SG-5 negatively: determinism, like in the first draft, has no recorded cost.

## 7. The independent check (RC-27), every count

Every entry this lane added went to a fresh-context checker that read only the row text and the entry (14 batches of
18 to 54 items, rubric in Appendix D), plus the 40 entries of the precision sample. Applied: `verified: agent` on
confirmed and regraded entries, the regrade written in, rejected entries removed.

**Contributions added (`contributions.json`), by softgoal**: 571 drafted, 515 confirmed, 35 regraded, 21 rejected, so
550 kept.

| Softgoal | checked | confirmed | regraded | rejected |
|---|---:|---:|---:|---:|
| SG-1 | 19 | 16 | 1 | 2 |
| SG-2 | 1 | 0 | 1 | 0 |
| SG-4 | 1 | 1 | 0 | 0 |
| SG-6 | 2 | 2 | 0 | 0 |
| SG-7 | 6 | 5 | 1 | 0 |
| SG-8 | 132 | 120 | 8 | 4 |
| SG-9 | 108 | 105 | 0 | 3 |
| SG-10 | 36 | 32 | 3 | 1 |
| SG-11 | 190 | 169 | 14 | 7 |
| SG-12 | 76 | 65 | 7 | 4 |
| all | 571 | 515 | 35 | 21 |

By task and sign: task A positive 396 (373 confirmed, 20 regraded, 3 rejected); task A negative 55 (51, 3, 1); task B
negative, the cost pass, 120 (91, 12, 17). The cost pass is where the checker disagreed most: 14% rejected against 1%
for the positive links, mostly costs the row does not state (a control the row does not show, a duplication the row
does not name, a «stale» form the row calls inert). The 35 regrades lowered `read` to `inferred` 28 times, `measured`
to `read` once (R-SIM-75 SG-12: the measure found the loss, not its closure), `hurt` to `some-` 3 times (R-VAL-19-bis
SG-8, R-GEN-13 SG-11, R-IRN-31 SG-11) and `help` to `some+` 3 times (R-SIM-99 SG-12, R-SIM-131 SG-11, R-J7 SG-11), and
raised one evidence to `measured` (R-NV-1 SG-8, the cited corollary `98e6fd6cb`); one regrade changed both fields.

**By batch** (contribution batches; `vs-1` is the sample):

| Batch | items | confirmed | regraded | rejected |
|---|---:|---:|---:|---:|
| va-1 | 50 | 49 | 1 | 0 |
| va-2 | 50 | 45 | 4 | 1 |
| va-3 | 50 | 41 | 6 | 3 |
| va-4 | 50 | 45 | 4 | 1 |
| va-5 | 50 | 48 | 2 | 0 |
| va-6 | 18 | 16 | 2 | 0 |
| vb-1 | 54 | 49 | 0 | 5 |
| vb-2 | 54 | 48 | 5 | 1 |
| vb-3 | 51 | 48 | 3 | 0 |
| vc-1 | 32 | 30 | 1 | 1 |
| vc-2 | 31 | 24 | 4 | 3 |
| vd-1 | 41 | 36 | 2 | 3 |
| vd-2 | 40 | 36 | 1 | 3 |
| vs-1 | 40 | 32 | 5 | 3 |

**Correlations (`correlations.json`)**: 64 checked, 25 confirmed, 28 regraded, 11 rejected, so 53 kept (§5.2). One
more drafted link had no valid witness and was dropped before the check. **Conflicts (`conflicts.json`)**: 2 checked, 2
confirmed (K0, K1), so 13 in all. By batch (the two conflicts sat in `vx6` and `vx7`):

| Batch | items | confirmed | regraded | rejected |
|---|---:|---:|---:|---:|
| vx1 | 8 | 3 | 3 | 2 |
| vx2 | 8 | 3 | 4 | 1 |
| vx3 | 8 | 3 | 5 | 0 |
| vx4 | 9 | 3 | 3 | 3 |
| vx5 | 8 | 1 | 6 | 1 |
| vx6 | 8 | 5 | 2 | 1 |
| vx7 | 8 | 4 | 3 | 1 |
| vx8 | 9 | 5 | 2 | 2 |

**Totals across the lane**: 677 items checked (571 contributions, 64 correlations, 2 conflicts, 40 sample entries);
574 confirmed, 68 regraded, 35 rejected.

## 8. Precision of the first draft

The sample: 40 of the 414 `verified: none` entries, stratified by softgoal, seed 20261011 (Appendix B).

| Softgoal | sampled | confirmed | regraded | rejected |
|---|---:|---:|---:|---:|
| SG-1 | 8 | 8 | 0 | 0 |
| SG-2 | 4 | 3 | 1 | 0 |
| SG-3 | 6 | 2 | 1 | 3 |
| SG-4 | 8 | 8 | 0 | 0 |
| SG-5 | 4 | 3 | 1 | 0 |
| SG-6 | 6 | 6 | 0 | 0 |
| SG-7 | 4 | 2 | 2 | 0 |

- **Confirmed as written: 32 of 40, 80.0%** (Wilson 95% 65.2% to 89.5%).
- **Direction right (confirmed or regraded): 37 of 40, 92.5%** (Wilson 95% 80.1% to 97.4%), the same figure as the
  first draft's own sample on 2026-10-05 (37 of 40, seed 20261005).
- **Rejected: 3, all SG-3**: R-IRN-38, R-SIM-89 and R-VP-31, each an entry that reads «the four demo scenes 0 px from
  the base run» as a contribution to demo readiness. The checker's reason, three times: the measure shows the row
  leaves the demo as it was; it adds nothing a scene shows, and the non-regression belongs to RC-31, not to the row.
  This is the first draft's open Q2 («keep the 21 SG-3 links that only measure the four scenes unchanged?»), answered
  by sampling: 3 of the 6 SG-3 entries drawn fail it. The other entries of that kind stay as they are (outside the
  sample, not to be touched by this lane); see Q3.
- **Regraded: 5.** Evidence `read` to `inferred` on R-RAIL-43 and R-RAIL-45 (SG-7: the rows speak of correctness, not
  of harness cost) and on R-SIM-116 (SG-2); kind `help` to `some+` on R-SIM-81 (SG-3) and R-SIM-122 (SG-5: the clock
  adds a wall-clock input with arrival-order outcomes, «containment, not a gain»).
- By softgoal, SG-1, SG-4 and SG-6 were confirmed 22 of 22; SG-3 is the weak spot (2 of 6 as written).

## 9. Decisions taken (unattended)

- **D1. Drafting and checking by subagents.** Eight drafters for the contributions, eight for the correlations, 22
  checkers (14 contribution batches including the sample, 8 correlation batches, the conflicts inside them), all with a
  fresh context. The session wrote the softgoals, the tree, the rubrics and the scripts, reviewed every drafter's
  report, and applied the verdicts mechanically (`/tmp/gt1650/assemble.mjs`, `/tmp/gt1650/corr-final.mjs`).
- **D2. The judged set.** All 522 R- ids for SG-8 to SG-12; the cost pass on the 289 rows with a positive entry. The 42
  rows added since the first draft got no SG-1 to SG-7 judgement: neither step 3 nor step 4 asks for it (Q4).
- **D3. Mixed rows.** A negative on a softgoal the row already has an entry for is not recorded; 27 such cases are
  listed in §4 (Q2).
- **D4. SG-12 covers edit-time writes that lose persisted data**, after R-SIM-75 («Chiude la perdita di dati
  misurata»: the table rewrote records on the first edit). Seven entries rest on that reading (R-FORM-9, R-FORM-11,
  R-WCX-1, R-WCX-3, R-DEL-4, R-CR2-3, R-CR2-4).
- **D5. Descriptions edited during the lane** (SG-10 and SG-11 on a checker's finding, SG-8 and SG-9 examples at the
  close; §4). Four checkers were running when the file
  changed; each re-read it and reported no verdict changed.
- **D6. The precision sample** is stratified by softgoal, not drawn flat as on 2026-10-05, so that every softgoal is
  estimated (floor of 3).
- **D7. The witness rule of a correlation** is the same decision carrying both effects; positive pairs split by
  purpose; one ordered pair may hold one positive and one negative link (the gate keys uniqueness on from, to and sign).
- **D8. A link with one or two witnesses** stands when a witness names the trade-off, at `read` as the prompt says or at
  `measured` when the checker raised it (SG-11 to SG-10, SG-12 to SG-10).
- **D9. Correlations computed after the check of the contributions**, so every witness is a checked entry.
- **D10. Conflicts.** Only trade-offs a row names were added (2); R-VAL-19 against R-VAL-19-bis left out as evolution.
- **D11. The lane header names no RC-3 trigger** (`Lane: full (data and docs only: ...)`). The one that applies is
  «more than 3 files»: six files in one docs commit, all named in step 10's pathspec, which stands as the confirmation
  rule 19 asks for (RC-11).

**Decisions awaiting Alfonso (RC-26)**: none. No item of this lane is on the RC-26 list: no critical-zone file, no code,
no ratified row amended, no file or persisted data deleted (three first-draft entries removed from a data file on the
checker's verdict, as step 6 prescribes), nothing the demo shows.

## 10. Open questions for Alfonso

- **Q1. The Requirements tab now lists 6569 opposing pairs instead of 612.** req-trace pairs every realized row that
  helps a softgoal with every realized row that hurts it, so the pairs grow with the product of the two: SG-11 2001,
  SG-8 1480, SG-9 1197, SG-1 1098. The groups are closed by default, but the RC-23 check should look at the tab's
  render time and at whether ungrouped pairs still say anything.
  Recommended: in the RC-23 check, time the Requirements tab; if it is slow or the pair groups are noise, a follow-up
  lane shows correlations instead of raw pairs.
- **Q2. Mixed rows.** 27 negatives are known and unrecorded because the row already helps the same softgoal.
  Recommended: allow a second entry of the opposite sign per (req, softgoal), in a lane that also updates `joinGoals`,
  its tests and the README.
- **Q3. The first-draft SG-3 entries that only measure «four scenes unchanged».** The first draft counted 21; the
  sample drew 3 of them and the checker rejected all 3.
  Recommended: a fast lane checks the remaining ones with the same rubric and removes those that fail.
- **Q4. The 42 rows added after the first draft have no SG-1 to SG-7 judgement.**
  Recommended: a fast lane judges them, task A of this rubric restricted to SG-1 to SG-7.
- **Q5. SG-5 has no negative link and no negative correlation.** The checker lowered R-SIM-122 SG-5 from `help` to
  `some+` (the clock adds a wall-clock input with arrival-order outcomes), and the cost pass found the same row's SG-5
  cost but could not record it (blocked).
  Recommended: decide with Q2; the clock rows are the test case.
- **Q6. 374 first-draft entries are still `verified: none`**, with an estimated 80% confirmed as written.
  Recommended: one lane runs the checker on all of them (about 8 batches) with this lane's rubric.

## 11. Risks and limits

- **The cost pass finds stated costs.** 71 of the 157 new negative entries are `inferred`, and the checker rejected 14%
  of the cost-pass entries against 1% of the positive ones. A cost no row states stays invisible.
- **Calibration across softgoals.** SG-11 reaches 183 rows partly because the register often says «modulo puro»; SG-10
  reaches 35. The counts compare softgoals' visibility in the register, not their weight in the product.
- **What the checkers saw.** Row texts only, no section intros, no ratification memos; a `measured` the row does not
  cite in its own text could read `read`.
- **req-trace misses three rows.** R-D, R-2/3.6 and R-B12 do not parse in `parseRegister`, so 7 entries in the file do
  not reach the tab (998 in the file, 991 on rows).
- **Correlations age with contributions.** A new or removed entry can move a witness; the link is not recomputed.

## 12. Files read

`CLAUDE.md`; `docs/PROTOCOL.md` (P4, P6, P9, P16); `docs/decisions.md` (every R- row through the parser, RC-17,
RC-21 to RC-28, RC-35 to RC-39 directly); `docs/goals/README.md`, `softgoals.json`, `contributions.json`,
`conflicts.json`; `docs/discovery/discovery_2026-10-05_goal_model.md`; `docs/DESIGN-SYSTEM.md` §4.2, §4.3, §5, §7,
§8, §9; `frontend/scripts/req-trace.mjs` (`parseRegister`, `joinGoals`, `trace`);
`frontend/scripts/lane-board/requirements.js` (goal model rendering); `docs/claude-code-log.md` (head);
`docs/log-inbox/harness.md`, `docs/log-inbox/goals.md`.

## Appendix A. The gate of step 9, run

`/tmp/gt1650/gate.js`, run from the worktree root (`GOALS_DIR` lets a negative control point it at a copy):

```js
// Step 9 gates, run from the worktree root: node /tmp/gt1650/gate.js
const fs = require('fs');
const errs = []; const D = process.env.GOALS_DIR || 'docs/goals/';
const load = (f) => { try { return JSON.parse(fs.readFileSync(D + f, 'utf8')); } catch (e) { errs.push(f + ': does not parse: ' + e.message); return null; } };
const sg = load('softgoals.json'), co = load('contributions.json'), cf = load('conflicts.json'), tree = load('goal-tree.json'), corr = load('correlations.json');
const text = fs.readFileSync('docs/decisions.md', 'utf8');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const isRow = (id) => /^R-/.test(id) && new RegExp('^(?:- )?\\*\\*' + esc(id) + '(?:\\*\\*|,| \\([A-Z]\\)\\*\\*)', 'm').test(text);
const ids = new Set((sg || []).map((s) => s.id));
const KIND = ['make', 'help', 'some+', 'some-', 'hurt', 'break'], EV = ['measured', 'read', 'inferred'], VF = ['none', 'agent', 'alfonso'];
const keys = (o, ks, w) => { if (JSON.stringify(Object.keys(o).sort()) !== JSON.stringify([...ks].sort())) errs.push(w + ': keys ' + Object.keys(o).join(',')); };
(sg || []).forEach((s, i) => keys(s, ['id', 'name', 'description'], 'softgoals[' + i + ']'));
if (sg && ids.size !== sg.length) errs.push('softgoals: duplicate id');
const seen = new Set();
(co || []).forEach((c, i) => { const w = 'contributions[' + i + '] ' + c.req + '/' + c.softgoal; keys(c, ['req', 'softgoal', 'kind', 'evidence', 'verified', 'why'], w);
  if (!isRow(c.req)) errs.push(w + ': req not an R- row'); if (!ids.has(c.softgoal)) errs.push(w + ': unknown softgoal');
  if (!KIND.includes(c.kind)) errs.push(w + ': kind'); if (!EV.includes(c.evidence)) errs.push(w + ': evidence'); if (!VF.includes(c.verified)) errs.push(w + ': verified');
  if (!c.why || !c.why.trim()) errs.push(w + ': empty why'); const k = c.req + '|' + c.softgoal; if (seen.has(k)) errs.push(w + ': duplicate'); seen.add(k); });
(cf || []).forEach((c, i) => { const w = 'conflicts[' + i + '] ' + c.a + '~' + c.b; keys(c, ['a', 'b', 'softgoal', 'why', 'evidence'], w);
  for (const r of [c.a, c.b]) if (!isRow(r)) errs.push(w + ': ' + r + ' not an R- row'); if (c.a === c.b) errs.push(w + ': a = b');
  if (!ids.has(c.softgoal)) errs.push(w + ': unknown softgoal'); if (!EV.includes(c.evidence)) errs.push(w + ': evidence'); });
const member = new Map();
(tree || []).forEach((m, i) => { const w = 'goal-tree[' + i + '] ' + m.id; keys(m, ['id', 'name', 'description', 'softgoals'], w);
  if (!/^MG-\d+$/.test(m.id)) errs.push(w + ': id'); (m.softgoals || []).forEach((s) => { if (!ids.has(s)) errs.push(w + ': unknown ' + s); member.set(s, (member.get(s) || 0) + 1); }); });
for (const s of ids) if (member.get(s) !== 1) errs.push('goal-tree: ' + s + ' in ' + (member.get(s) || 0) + ' macro goals');
const cseen = new Set();
(corr || []).forEach((c, i) => { const w = 'correlations[' + i + '] ' + c.from + '>' + c.to; keys(c, ['from', 'to', 'kind', 'witnesses', 'evidence', 'verified', 'why'], w);
  if (!ids.has(c.from) || !ids.has(c.to)) errs.push(w + ': unknown softgoal'); if (c.from === c.to) errs.push(w + ': from = to');
  if (!KIND.includes(c.kind)) errs.push(w + ': kind'); if (!EV.includes(c.evidence)) errs.push(w + ': evidence'); if (!VF.includes(c.verified)) errs.push(w + ': verified');
  if (!Array.isArray(c.witnesses) || !c.witnesses.length) errs.push(w + ': no witnesses'); (c.witnesses || []).forEach((r) => { if (!isRow(r)) errs.push(w + ': witness ' + r + ' not an R- row'); });
  const k = c.from + '>' + c.to + (['make', 'help', 'some+'].includes(c.kind) ? '+' : '-'); if (cseen.has(k)) errs.push(w + ': duplicate (from, to, sign)'); cseen.add(k); });
// no em dash in text this lane writes: new softgoals, tree, correlations, and entries absent from the base file
const base = JSON.parse(require('child_process').execSync('git show HEAD:docs/goals/contributions.json', { encoding: 'utf8' }));
const baseKey = new Set(base.map((c) => JSON.stringify(c)));
const baseCf = new Set(JSON.parse(require('child_process').execSync('git show HEAD:docs/goals/conflicts.json', { encoding: 'utf8' })).map((c) => JSON.stringify(c)));
const baseSg = new Set(JSON.parse(require('child_process').execSync('git show HEAD:docs/goals/softgoals.json', { encoding: 'utf8' })).map((c) => JSON.stringify(c)));
const mine = [...(sg || []).filter((s) => !baseSg.has(JSON.stringify(s))), ...(co || []).filter((c) => !baseKey.has(JSON.stringify(c))), ...(cf || []).filter((c) => !baseCf.has(JSON.stringify(c))), ...(tree || []), ...(corr || [])];
const dash = mine.filter((o) => /\u2014/.test(JSON.stringify(o)));
dash.forEach((o) => errs.push('em dash in: ' + JSON.stringify(o).slice(0, 100)));
for (const f of ['docs/goals/README.md', 'docs/discovery/discovery_2026-10-11_goal_tree_hurts.md']) if (fs.existsSync(f)) {
  const added = require('child_process').execSync('git diff --no-color -U0 HEAD -- ' + f + ' ; git ls-files --others --exclude-standard -- ' + f, { encoding: 'utf8' });
  const lines = fs.existsSync(f) && !require('child_process').execSync('git ls-files -- ' + f, { encoding: 'utf8' }).trim() ? fs.readFileSync(f, 'utf8').split('\n') : added.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1));
  lines.forEach((l, i) => { if (/\u2014/.test(l)) errs.push(f + ': em dash in a line this lane writes: ' + l.slice(0, 80)); });
}
console.log('softgoals ' + (sg || []).length + ', contributions ' + (co || []).length + ', conflicts ' + (cf || []).length + ', macro goals ' + (tree || []).length + ', correlations ' + (corr || []).length + ', lane-written objects ' + mine.length + ', errors ' + errs.length);
errs.slice(0, 30).forEach((e) => console.log('  ' + e)); process.exit(errs.length ? 1 : 0);
```

Run on 2026-10-11, node from the worktree root:

```
$ node /tmp/gt1650/gate.js
softgoals 12, contributions 998, conflicts 13, macro goals 5, correlations 53, lane-written objects 652, errors 0
exit 0

$ GOALS_DIR=<copy with a duplicate pair, R-NOPE-1, SG-1 in two macro goals, a link to SG-13 with an em dash> node /tmp/gt1650/gate.js
softgoals 12, contributions 1000, conflicts 13, macro goals 5, correlations 54, lane-written objects 655, errors 5
  contributions[998] R-EDGE-2/SG-7: duplicate
  contributions[999] R-NOPE-1/SG-4: req not an R- row
  goal-tree: SG-1 in 2 macro goals
  correlations[53] SG-1>SG-13: unknown softgoal
  em dash in: {"from":"SG-1","to":"SG-13",...}
exit 1
```

## Appendix B. The sampling script

```js
// Stratified sample of existing verified:none entries: 40 over SG-1..SG-7, proportional with a floor of 3,
// largest remainder; within each softgoal a mulberry32 Fisher-Yates over the entries in file order.
import fs from 'node:fs';
const [file, n = '40', seed = '20261011'] = process.argv.slice(2);
const co = JSON.parse(fs.readFileSync(file, 'utf8'));
let a = Number(seed) >>> 0;
const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pool = co.map((c, i) => ({ i, c })).filter(x => x.c.verified === 'none');
const sgs = [...new Set(pool.map(x => x.c.softgoal))].sort((x, y) => Number(x.slice(3)) - Number(y.slice(3)));
const N = Number(n), FLOOR = 3;
const cnt = Object.fromEntries(sgs.map(s => [s, pool.filter(x => x.c.softgoal === s).length]));
const alloc = Object.fromEntries(sgs.map(s => [s, FLOOR]));
let left = N - FLOOR * sgs.length;
const rest = Object.fromEntries(sgs.map(s => [s, cnt[s] - FLOOR]));
const restTot = Object.values(rest).reduce((p, q) => p + q, 0);
const quota = sgs.map(s => ({ s, q: left * rest[s] / restTot }));
quota.forEach(({ s, q }) => alloc[s] += Math.floor(q));
let used = Object.values(alloc).reduce((p, q) => p + q, 0);
quota.sort((x, y) => (y.q % 1) - (x.q % 1)).forEach(({ s }) => { if (used < N) { alloc[s]++; used++; } });
const picked = [];
for (const s of sgs) {
  const idx = pool.filter(x => x.c.softgoal === s).map(x => x.i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  picked.push(...idx.slice(0, alloc[s]));
}
picked.sort((x, y) => x - y);
console.error('pool', pool.length, 'alloc', JSON.stringify(alloc));
console.log(JSON.stringify(picked.map(i => ({ index: i, ...co[i] })), null, 1));
```

Run as `node sample.mjs <HEAD contributions.json> 40 20261011`. Indices drawn: 12, 14, 30, 32, 44, 51, 53, 56, 57, 61,
63, 64, 85, 89, 106, 116, 133, 138, 149, 157, 183, 201, 209, 210, 217, 234, 244, 268, 273, 276, 313, 315, 317, 325,
341, 360, 364, 371, 409, 429.

## Appendix C. The drafting rubric, verbatim

### Rubric: new softgoals and the pass for hurts (P-2026-10-11-1650)

You judge rows of the decision register `docs/decisions.md` of the repository `/Users/alfonso/jjodel-w-goaltree`
(read-only for you: never write in it, never run a git command that changes state). The twelve softgoals are in
`/tmp/gt1650/softgoals-12.json`: read it first, every description in full, the scope and boundary sentences included.
SG-1..SG-7 already have contributions; SG-8..SG-12 are new. The contract and the scale are in
`/Users/alfonso/jjodel-w-goaltree/docs/goals/README.md` (read its Fields section).

Short form:
- SG-1 low cognitive load (what a user who knows the tool must hold in mind; Basic/Advanced; one place and one name for one thing)
- SG-2 no layout shift (fixed dimensions, no reflow on state change, positions and sizes stable across reloads)
- SG-3 demo readiness (the MODELS 2026 simulator demo, four scenes; merge freeze 2026-10-07)
- SG-4 reversibility (undo; saved projects keep opening after a tool change; decisions that can be reverted)
- SG-5 determinism of the simulation engine (same net, state, inputs give the same run and trace)
- SG-6 fidelity to the formalism (executed or checked semantics equal the formalism's; M1-to-M2 conformance)
- SG-7 cost of the harness (human time and tokens on prompts, lanes, gates, logs, reports, waits for Alfonso; lower is better)
- SG-8 learnability (a newcomer can find a feature and tell what it does: hints, empty states, consistent gestures and names)
- SG-9 expressive power of the languages and notations (constructs of JjEL, JjTL, JjScript, simulation profiles, notations)
- SG-10 performance on large models (time and memory the user waits on: editing, loading, validating, simulating)
- SG-11 maintainability of the code base (duplication, coupling, size of the critical zone, pure modules, dead code)
- SG-12 integrity of saved projects (no loss or corruption on save, load, export, import, migration)

#### Input

Your chunk is `/tmp/gt1650/chunk-<k>.txt` (k in your prompt). Each row is
`<<<ROW <id> (decisions.md:<lines>; section: ...)[ POS]>>>`, its text, then `EXISTING ENTRIES`: the contributions the
row already has in `contributions.json`, then `<<<END <id>>>`. `[POS]` marks a row with at least one positive
existing entry (make, help or some+).

#### Two tasks per row

**Task A, every row.** Decide the contributions of the row to SG-8, SG-9, SG-10, SG-11, SG-12, in either direction.

**Task B, only rows marked [POS]: the pass for hurts.** The register states what a row buys and rarely what it gives
up. For each [POS] row ask: what does this decision cost, and which softgoal pays? The usual costs:
- a control, option, mode or concept added: SG-1 and/or SG-8;
- a notation or language construct removed, restricted or deferred: SG-9;
- a runtime cost, a wait, a re-render or a computation that grows with the model: SG-10;
- code, a second code path, a duplicated body, a hand coupling, or a new touchpoint in the critical zone: SG-11;
- a step, a gate, a document, a commit, a lane or a wait for Alfonso added to the process: SG-7;
- a saved form left unmigrated, ill formed or stale: SG-6 and/or SG-12;
- something moved late or deferred that a demo scene uses: SG-3;
- an undo step split or lost, a decision made final: SG-4;
- a size or position that now depends on content or late data: SG-2;
- an order, a timing or a randomness that now decides an outcome: SG-5.
Add the negative entries the row supports, on any softgoal SG-1..SG-12, EXCEPT a softgoal already listed in the
row's EXISTING ENTRIES (no duplicate (req, softgoal) pair is allowed and existing entries are never changed). If the
row supports a negative on a softgoal it already has an entry for, put it in `blocked` instead (see output).

There is no quota and no target ratio. An empty row is better than an invented link. Many rows will get nothing.

#### Rules (binding)

1. A contribution is recorded only when the row's text supports it. You may open a ratification memo or discovery
   report the row cites by path, when the row names an effect and you need its source; time-box it, it is optional.
2. `kind`, one per (req, softgoal):
   - `help` / `hurt`: the row clearly moves the softgoal toward / away from satisfaction, partially.
   - `some+` / `some-`: the direction is clear, the extent small, indirect or conditional.
   - `make` / `break`: only when the row by itself satisfies / denies the softgoal. Expect none.
   - Use `hurt` or `break` ONLY when the row states or measures the damage (e.g. «accepted cost: ... waits 500 ms»,
     «le due copie possono divergere», «perde il vecchio valore»). A cost you infer is `some-`.
3. `evidence`: `measured` when a probe, bench, test or measurement cited by the row measured THAT effect; `read` when
   the row, its ratification memo or its discovery states the effect on the softgoal's concern; `inferred` when the
   effect follows from what the row decides without being stated.
4. `verified`: always the string `"none"`.
5. `why`: one line, at most 220 characters, in English; quote the row's own words in «...» (Italian is fine) or cite
   them, so a reader can find the support in the row. No speculation beyond the row. NEVER use the em dash character
   (U+2014) or the en dash (U+2013) anywhere in your output: use a colon, a comma, a semicolon or parentheses.
6. Do not derive contributions from header metadata alone (`reversible:`, `provisional`, `unattended`, `verified:`).
7. Calibration of the new softgoals:
   - SG-8 needs something about finding or understanding a feature: a hint, a label, a declared empty state, the same
     gesture or name across surfaces (help); a capability reachable only by a hidden gesture or a mode the user must
     already know, two names or behaviours for one thing, a feature kept but hard to find (hurt side). Gating a
     control behind Advanced is SG-1 help; it is SG-8 some- only when the row makes a capability harder to find.
   - SG-9 needs a construct of a language, a profile or a notation: added or lifted (help), removed, restricted,
     excluded or deferred (hurt side). UI wiring is not SG-9. A notation that can draw more of the metamodel helps.
   - SG-10 needs a runtime cost or saving the user waits on, or a measured timing. «lazy», «memo», «re-render»,
     «O(n)», «ms» are signals; async alone is not. Build time and harness time are SG-7, not SG-10.
   - SG-11 needs the row to speak to code structure: a pure module tests import, shared not copied, one source, dead
     code removed (help); a duplicated body, a mirror by copy, a hand coupling, two coexisting implementations, a
     widened critical zone (hurt side). A feature does not hurt SG-11 merely because it adds code.
   - SG-12 needs the persisted project: an additive key that round-trips byte for byte, a measured save/reopen or
     export/import, a closed data loss (help); a value lost or corrupted on save/load/import, a stale or ill-formed
     saved form left unmigrated, a migration that carries a wrong form (hurt side). Viewer preferences that are lost on
     reload by design are not SG-12. A row that avoids a migration helps SG-4; it helps SG-12 only if the saved form
     stays complete and correct, and hurts SG-12 if the form it keeps is ill formed or stale.
8. SG-1..SG-7 keep their existing calibration (the descriptions in softgoals-12.json). SG-3 only when the row ties it
   to the demo, MODELS, the freeze or a scene. SG-5 and SG-6 concern the simulator and modeling semantics, not UI wiring.
9. `tradeoffs`: only when the row's text (or its ratification memo or discovery) NAMES a trade-off with ANOTHER row
   (by id) on one softgoal, or explicitly gives up one softgoal for another row's sake. `a` pulls toward the softgoal,
   `b` away. Evolution links (amends, supersedes, refines, renumbered, «emenda», «sostituisce», «superata») are not
   trade-offs. Do not repeat these 11 existing conflicts: R-EDGE-2/R-EDGE-3 SG-6, R-SIM-31/R-SIM-20 SG-6,
   R-UNDO-5/R-SGL-10 SG-4, R-VP-39/R-STR-2 SG-2, R-DMV-1/R-VAL-2 SG-1, R-SIM-18/R-SIM-42 SG-1, R-SIM-55/R-SIM-79 SG-1,
   R-B10/R-VP-41 SG-2, R-SIM-105/R-SIM-101 SG-1, R-VP-4/R-VAL-12 SG-1, R-VP-27/R-VP-39 SG-1.
10. Ids: use the row id exactly as in the `<<<ROW` line.

#### Output

Write ONE file, `/tmp/gt1650/part-<k>.json`, and nothing else anywhere (a validation script, if you need one, goes
under `/tmp/gt1650/scratch-<k>/`):

```
{
  "reviewed": ["<every row id of the chunk, in order, including rows with no new entry>"],
  "contributions": [ {"req": "R-...", "softgoal": "SG-n", "kind": "...", "evidence": "...", "verified": "none", "why": "...", "task": "A" | "B"} ],
  "blocked": [ {"req": "R-...", "softgoal": "SG-n", "kind": "some-|hurt", "why": "..."} ],
  "tradeoffs": [ {"a": "R-...", "b": "R-...", "softgoal": "SG-n", "evidence": "read|inferred", "why": "..."} ]
}
```

`task` says which task produced the entry (a negative on SG-8..SG-12 found while asking the cost question of a [POS]
row is `B`). Before finishing, validate your file with node: it parses; every `contributions[].req` is in `reviewed`;
`reviewed` equals the chunk's row ids in order; `kind` in make|help|some+|some-|hurt|break; `evidence` in
measured|read|inferred; `verified` is "none"; `softgoal` in SG-1..SG-12; no duplicate (req, softgoal), and no pair
that repeats an EXISTING entry of the row; no U+2014 or U+2013 in any string. Then reply with: rows reviewed; rows with
at least one new entry; new entries per softgoal and per kind; every `hurt`/`break` with its id; and the rows you
found hard to judge (id plus one line). Keep the reply under 40 lines.

## Appendix D. The checker rubric, verbatim

### Independent check (RC-27): goal-model entries (P-2026-10-11-1650)

You are a second agent with a fresh context. You did not draft these entries. For each item of your batch you read
ONLY the row text given in the item and the entry, and you decide whether the row supports the entry as written.
Do not open the repository, do not search for other sources: the row text is your evidence.

#### The softgoals

Read `/tmp/gt1650/softgoals-12.json` first, every description in full, the scope and boundary sentences included.
Twelve softgoals: SG-1 low cognitive load, SG-2 no layout shift, SG-3 demo readiness (MODELS 2026 simulator demo,
freeze 2026-10-07), SG-4 reversibility, SG-5 determinism of the simulation engine, SG-6 fidelity to the formalism,
SG-7 cost of the harness (lower cost is the satisfied direction), SG-8 learnability, SG-9 expressive power of the
languages and notations, SG-10 performance on large models, SG-11 maintainability of the code base, SG-12 integrity
of saved projects.

#### The scale

- `kind`: `make` / `break` when the row by itself satisfies / denies the softgoal; `help` / `hurt` for a clear
  partial effect; `some+` / `some-` when the direction is clear and the extent small, indirect or conditional.
  `hurt` and `break` require the row to state or measure the damage; an inferred cost is at most `some-`.
- `evidence`: `measured` when a probe, bench, test or measurement cited by the row measured that effect; `read` when
  the row states the effect on the softgoal's concern; `inferred` when it follows from what the row decides without
  being stated.
- A row with no support for an entry should have no entry: an empty row is better than an invented link.

#### Item types

- `contribution`: {req, softgoal, kind, evidence, why} and the row text. Question: does the row move that softgoal in
  that direction, at that strength, on that evidence?
- `conflict`: {a, b, softgoal, evidence, why} and the texts of both rows. A conflict is a pair of rows pulling the
  same softgoal in opposite directions, or a row naming a trade-off with the other: `a` toward, `b` away. Evolution
  links (amends, supersedes, refines) are not conflicts. Question: do the rows (or one of them) name or show this
  trade-off on that softgoal?
- `correlation`: {from, to, kind, witnesses, evidence, why} and the texts of the witness rows. A correlation is a side
  effect between softgoals (i* correlation link): rows that serve `from` also hurt `to` (negative kind) or also serve
  `to` (positive kind). Question: do the witness rows, read in full, show that side effect, in that direction and at
  that strength? A witness that does not show it does not count; fewer than 3 valid witnesses and no row naming the
  trade-off means reject.

#### Verdicts

For each item, one of:
- `confirm`: the entry stands as written.
- `regrade`: the direction is right but the kind or the evidence is wrong; give the corrected `kind` and/or
  `evidence` (for a correlation, also the witnesses that remain valid).
- `reject`: the row text does not support the entry (or, for a contribution, the direction is wrong).

Be strict and independent: a plausible link the row does not state or clearly imply is a `reject` or a downgrade to
`inferred` / `some-` / `some+`. Do not reward fluent `why` texts; check them against the row.

#### Output

Write ONE file, the path given in your prompt, and nothing else anywhere:

```
[ {"id": "<item id>", "verdict": "confirm" | "regrade" | "reject", "kind": "<only on regrade>", "evidence": "<only on regrade>", "witnesses": ["<only on regrade of a correlation>"], "reason": "<one line, at most 200 characters, no U+2014 or U+2013>"} ]
```

One object per item, every item id of the batch exactly once. Validate the file with node before finishing (parses,
every id present once, verdict values valid, regrade carries at least one of kind/evidence/witnesses). Reply with the
counts: items, confirm, regrade, reject, and the ids you found hardest (id plus one line). Under 25 lines.

## Appendix E. The correlation rubric, verbatim

### Rubric: correlation links between softgoals (P-2026-10-11-1650)

A goal model over the decision register of Jjodel has twelve softgoals (read `/tmp/gt1650/softgoals-12.json` first,
every description in full) and, for each R- row, contributions to them (scale: make, help, some+ positive; some-,
hurt, break negative). You now judge **correlation links** in the i* sense: side effects between softgoals. A link
`from -> to` says that serving `from`, the way the rows serve it, costs `to` (negative kind) or also serves `to`
(positive kind). Write nothing in the repository; read-only.

#### Input

Your file `/tmp/gt1650/cc-<k>.txt` holds candidates computed mechanically from the contributions:
- `sign=negative`, key `SG-a>SG-b`: rows positive on SG-a and negative on SG-b.
- `sign=positive`, key `SG-a~SG-b`: rows positive on both, direction not yet decided.
- `NAMED`: a declared conflict names the trade-off; its text is given.
Each witness lists its two contributions (kind, evidence, why). The full row text is at the path given: open it
whenever the two `why` lines do not settle the question, and for every witness you keep in a link that is `read`.

#### What makes a witness valid

A witness is valid only when the row shows a **side effect**: the way the row serves `from` is what costs `to`, or
what also serves `to`. The same decision, mechanism or clause carries both effects. It is NOT valid when the row
simply does two independent things, one good for `from` and one bad (or good) for `to`.
- Valid positive example: an additive optional key that round-trips byte for byte serves SG-4 (saved projects keep
  opening) and SG-12 (the saved form comes back complete) by one mechanism.
- Invalid example: a row adds a control (SG-1 cost) and, separately, makes the new key additive (SG-4 gain); SG-4
  does not cause the SG-1 cost, so it is not a witness of SG-4 -> SG-1.
- Valid negative example: a row keeps an old saved form unmigrated to keep projects opening (SG-4), and that is
  exactly why an ill-formed form stays (SG-6 or SG-12).
- Valid negative example: a scene-critical surface is kept or reopened for the demo (SG-3) at the price of a second
  path or control the row names (SG-1).

#### Decision per candidate

1. Mark each witness valid or invalid, with a short reason for the invalid ones.
2. A link exists when at least **3 valid witnesses** remain, or when one valid witness or the named conflict states
   the trade-off between the two concerns in so many words (then `evidence: read` is required).
3. Direction. Negative: `from` and `to` as given. Positive: `from` is the softgoal the valid witnesses pursue (the
   purpose of the decision), `to` the side effect. If the valid witnesses split, each direction needs its own 3
   witnesses (or a named statement); otherwise record only the direction that has them. Never record both
   directions without witnesses for each.
4. `kind`: negative `some-` by default; `hurt` only when at least half the valid witnesses carry hurt or break on
   `to`, or the named statement states damage. Positive `some+` by default; `help` when at least half the valid
   witnesses carry help or make on `to`. Never make or break.
5. `evidence`: `read` when at least one valid witness row (or the named conflict) states the side effect between the
   two concerns; `measured` only when a witness measured it; otherwise `inferred`.
6. `witnesses`: the valid ones only, as R- ids, in the order given.
7. `why`: at most 300 characters, English, no U+2014 or U+2013 anywhere: the mechanism in one sentence, citing one or
   two witnesses with their own words in «...».
8. `verified`: always "none".

Expect many candidates to end with no link: co-occurrence in a row is not a side effect. An empty result is better
than an invented link.

#### Output

Write ONE file, `/tmp/gt1650/corr-part-<k>.json` (scratch only under `/tmp/gt1650/scratch-c<k>/`):

```
[ {"candidate": "<key>", "decision": "link" | "no-link",
   "links": [ {"from": "SG-…", "to": "SG-…", "kind": "…", "witnesses": ["R-…"], "evidence": "…", "verified": "none", "why": "…"} ],
   "invalid": [ {"req": "R-…", "reason": "<one line>"} ],
   "note": "<one line, optional>"} ]
```

One object per candidate of your file, in order. Validate with node before finishing: parses; every candidate
present once; every link has 3 or more witnesses unless evidence is `read`; witnesses are a subset of the candidate's
witnesses; kinds and evidence in their sets; no U+2014 or U+2013. Reply with: candidates, links written (negative and
positive), the no-link candidates in one line each. Under 30 lines.
