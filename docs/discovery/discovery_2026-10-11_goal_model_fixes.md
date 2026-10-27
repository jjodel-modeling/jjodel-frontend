# Discovery 2026-10-11: goal model fixes, req-trace heads, mixed entries, SG-3 recheck

Prompt-ID: P-2026-10-11-2025 · prompt `docs/prompts/claude_2026-10-11_2025_prompt_goal_model_fixes.md` · chat
C-2026-10-10-0840 · session bea43ea5 · worktree `~/jjodel-w-gmfix`, branch `goal-model-fixes` from `47539f7fe` (the
prompt commit) · executor Opus 5.5 (`claude-opus-5-5`). Files: `frontend/scripts/req-trace.mjs`, its two test files,
`docs/goals/README.md`, `docs/goals/contributions.json`, this report. Code commit `c5aa0e0c8`.

This report is a set of hypotheses with evidence, not a definitive reference: whoever uses it rereads the real files.
`measured` below means a run in this lane, on the tree named; `read` means read from a file.

## 0. Answer in brief

- **Parser.** `ROW_START` (`frontend/scripts/req-trace.mjs:65` at `47539f7fe`) required `**` right after the id, so a
  head with a label after a comma (R-D, R-B12) or a decimal sub-number (R-2/3.6) never opened a row. Widened to accept
  both; the whole register parses to **523 R rows instead of 520**, and the only ids that appear are R-D, R-2/3.6,
  R-B12 (none disappears, no other row changes a field). Contributions on rows: **991 to 998** with the old data.
- **Contract.** A (req, softgoal) pair now carries one entry, or two of opposite sign (README, Fields). req-trace
  already put a mixed row in both lists of `balance` and never paired it with itself; the one reader that assumed one
  entry per pair was the cluster totals, which would count a same-sign duplicate twice. **Chosen: refuse and report.**
  The first entry of a sign is joined, a second of the same sign is dropped from the join and listed in
  `goalModel.duplicates`.
- **Mixed entries.** Of the 27 negatives blocked in P-2026-10-11-1650, **25 added** and **2 not added** by this
  session, because their quote sits in a neighbouring bullet, not in the row (R-D SG-4, R-SIM-33 SG-6). The fresh-context
  check: **23 confirmed, 2 regraded, 0 rejected**, so 25 entries `verified: agent`. 16 of the 25 rows are realized.
  **SG-5 gets its first negative** (R-SIM-122, the clock's arrival order).
- **SG-3 recheck.** All 57 SG-3 entries still `verified: none`: **33 confirmed, 6 regraded, 18 rejected** (15
  non-regression only, 3 other). No SG-3 entry is `verified: none` any more.
- **Counts.** 998 to **1005** entries; on realized rows 675 to 678; opposing pairs **6569 to 7173**; per softgoal in §6.
- **Gates.** Data gate of 1650 step 9 with the new pair rule: 0 errors on the file, 2 of 2 on the negative control.
  Tests: the six new cases, 5 red on the base and 1 green there (it pins a behaviour the base already had), 11 of 11
  mutations killed.

**Decisions taken (unattended, RC-21), recorded here because `docs/decisions.md` is outside this lane's perimeter**:
eight, in §8, each `ratified as recommended, unattended` where a recommendation existed; the main ones: refuse and
report a same-sign duplicate; the row text is the row proper, cut at the next top-level bullet; the head label is read
with the row.

**Questions, none blocking (§9):** the cluster partition moved (17 to 16 clusters, one description now orphan); three
other parser truncations; R-SIM-17's one negative slot on SG-6; R-SIM-99's SG-3 cost; R-2/3.6 citations; correlations
not recomputed.

## 1. Hypotheses and verdicts

- **H1, «the three heads fail `ROW_START` for one reason that a narrow widening fixes without admitting non-rows».**
  Holds, for two reasons, not one: a comma label (R-D, R-B12) and a decimal sub-number (R-2/3.6). The widened regex
  admits exactly those three on the whole register (§2), and the one real near miss of the register stays prose.
- **H2, «req-trace already treats a mixed row correctly, so only the same-sign case needs code».** Holds for `balance`
  and `opposing` (the base passes those assertions, §7) and for the board (the base passes the board's mixed-row test).
  Falsified for the cluster totals of `joinGoals`, which count entries: a same-sign second entry would count twice.
- **H3, «most of the 27 blocked negatives are supported by their own row and survive a fresh check».** Holds: 25 of
  27 rest on the row proper, and the checker kept all 25 (23 as written).
- **H4, «the 1650 sample's rejections (3 of 6 SG-3 entries, all "scenes unchanged") generalize to the rest of the SG-3
  `verified: none` entries».** Partly: 18 of 57 rejected (32%), 15 of them as non-regression only. The rows that build
  a control or a line the panel shows held (24 confirmed as `changes a scene`), so the defect is the measured
  non-regression entries: 13 of the 21 SG-3 `measured` entries were rejected, 2 more lowered to `read`.

## 2. The parser change, measured

**Why the heads failed** (read, `47539f7fe`):

- `frontend/scripts/req-trace.mjs:65`: `const ROW_START = /^(?:- )?\*\*((?:RC|R)-[A-Za-z0-9/]+(?:-[A-Za-z0-9]+)*)\*\*/;`
  The id must be followed by `**`.
- `docs/decisions.md:369` opens `- **R-D, emendamento a R-1 di E-obj** (2026-08-05)` and `:471` opens
  `- **R-B12, gate del registry** (2026-08-03, implementato il 2026-08-06)`: a comma after the id.
- `docs/decisions.md:392` opens `- **R-2/3.6** (2026-08-07)`: `[A-Za-z0-9/]+` stops at the `.`, so `**` is not next.

**The change** (`frontend/scripts/req-trace.mjs:70` after the change):

```js
const ROW_START = /^(?:- )?\*\*((?:RC|R)-[A-Za-z0-9/]+(?:-[A-Za-z0-9]+)*(?:\.\d+)?)(?:,[^*\n]*)?\*\*/;
```

A decimal sub-number only at the end of the id, a label only after a comma and only up to the closing `**`. Two
consequences in the same file:
- `:233`, the sentence pass blanks the id only, not the whole head, so a label is read like the rest of the row:
  R-D now carries `evolves: [{ id: 'R-1', kind: 'amends' }]` (R-1 of E-obj is not a register row; kept on the row, as
  the parser already does for R-X-4 in its test). Measured: every other row's `evolves`, `cites`, `citedBy` identical.
- `familyOf` (`:79`) strips a trailing `.6` too, so R-2/3.6 is family `R-2/3`, not `R-2/3.`. The pattern changes only
  ids whose trailing digits follow a dot: R-2/3.6 alone in the register.

**The whole register, before and after** (measured, `/tmp/gm2025/ids.mjs` with the HEAD copy and the new file, over
`docs/decisions.md` of this tree):

| | before | after | appear | disappear |
|---|---:|---:|---|---|
| R rows | 520 | 523 | R-D, R-2/3.6, R-B12 | none |
| R and RC rows (`--with-rc`) | 562 | 565 | R-D, R-2/3.6, R-B12 | none |

Rows of the 562 with any field changed (title, date, status, line, evolves, cites, citedBy, text length): **0**.
Positive control for the comparison: the same script lists the three new rows with their fields (R-D title
«Scrittura atomica dei capi: entrambe le chiavi o nessuna, sempre; ...», date 2026-08-05, line 369).

**Near misses.** Every line of the register that opens with a bold `R-`/`RC-` id and that the new regex rejects
(measured, 2 lines):
- `:3693`, «R-STR-5 e' superata nella sua delimitazione», in bold, then «non nella sua lettura di `FormSpec`»: prose
  that cites a row, not a row. The test fixture copies it as the near miss.
- `:3662` `**R-STR-6 (B)** (2026-08-30, Alfonso)`: the (B) form of R-STR-6, which the contract check accepts
  (` (A)**`) and req-trace does not. Rejected before and after; not in this lane's three (§9 Q4).

**End to end** (measured, `req-trace.mjs --repo .` on trunk `alfonso-frontend-jjtl`, old data): rows 520 to 523,
realized 304 to 305 (R-B12, cited by `423f19f01 feat(editor-v2): consume edge.routing in IR edges` and by
`7b7ad1123`, whose body names it as a skipped row), contributions on rows 991 to 998: R-D carries 4, R-2/3.6 carries 3,
R-B12 none. Neither R-D nor R-2/3.6 is realized, so `balance` and `opposing` did not move with the parser alone.

**The cluster partition moved** (measured, same runs). Two more nodes and 17 more co-citation edges (4947 to 4964) move
Louvain to 16 clusters from 17 (modularity 0.7173 to 0.7211); 74 rows change cluster key. The R-DEAD-1 cluster (48 rows)
joins R-A, which brings R-A back to the 55 members its description was written for (drift 56 ids before, 2 after:
R-B12 and R-D added); R-LAY-19 with R-UNDO-1..7 leaves R-A and its orphan description attaches again; the R-JS-1
cluster (7 rows) joins R-B9, so R-JS-1's description becomes an orphan. Orphans: R-IRN-3 and R-LAY-19 before,
R-IRN-3 and R-JS-1 after. This is an effect of the three ids, not a fourth id; reported, not corrected (§9 Q1).

## 3. The contract change

`docs/goals/README.md`, Fields: a pair carries one entry, or two of opposite sign; the second says the same row buys
and costs the softgoal; neither is a net judgement of the other; each needs its own `why` quoting the part of the row
it rests on; two of the same sign are not allowed, req-trace refuses the second and lists it in
`goalModel.duplicates`; in the tab a mixed row sits on both sides of its bar and is never paired with itself.

**req-trace** (`frontend/scripts/req-trace.mjs:544-579` after the change, read): `joinGoals` keys each entry on
(req, softgoal, sign); a second key of one sign is refused (`continue`) and pushed to `duplicates`; `balance` was
already per side (`:570-571`, `pos` and `neg` filtered independently) and `opposing` already skipped `a.id === b.id`
(`:572`). `goalModel.duplicates` is a new key, `[]` when the goal model is absent. Measured on the new data:
`duplicates` empty, self pairs 0.

**Readers of `contributions`** under `frontend/scripts/` (`command grep -rn contributions`, positive control: the same
search finds the known readers in `req-trace.mjs` and `lane-board/requirements.js`; `softgoal` finds no file beyond
these two, their tests and the board README):
- `req-trace.mjs`: fixed as above.
- `lane-board/requirements.js:186`: the balance list picks `find((x) => x.softgoal === sg && kinds.has(x.kind))`, the
  entry of its own side, so a mixed row shows `help` in the help list and `some-` in the hurt list; `:241-243` counts a
  row once on each side of a matrix cell; `contribCell` (`:110`) draws one chip per entry. Correct as is, not touched
  (outside the perimeter), pinned by the board test (§7) and by mutation m11.

## 4. Mixed entries: recovered, added, checked

**Recovered**: all 27 from `/tmp/gt1650/draft-blocked.json` (still on disk), matching report 1650 §4 row for row.
Every one sits on a pair whose existing entry is positive (measured against `contributions.json` at `47539f7fe`). The
blocked list carried no `evidence`; this session assigned it before the check (`measured` where the row cites a
measure, `read` where it states the cost, `inferred` otherwise) and rewrote each `why` to quote the row exactly.

**Row text.** The 1650 parser ran a row to the next R/RC/D-UI head or heading, so a row's block could include a
neighbouring bullet. This lane cuts the block at the next top-level bullet (`- **`), the row proper; it equals
req-trace's own row text on all 79 rows of this lane except R-CR2-2 and R-VAL-13, where req-trace ends early (§9 Q4).
Every quote of the 25 `why` lines was checked to occur in the row proper (`/tmp/gm2025/quotes.mjs`: 25 entries, 0
problems; positive control: the first version of the same check, without normalizing bold markers, reported 3
missing quotes, the three that sit across a `**`).

**Not added by the session (2):**
- R-D SG-4: the quote «uscendo, l'edit incompleto si perde» is at `docs/decisions.md:374-375`, inside the bullet
  `- **C-1..C-4** (2026-08-05)` (`:373-377`), not in R-D (`:369-372`).
- R-SIM-33 SG-6 (`hurt`): «dove la lettura sequenziale di UML li accetterebbe» is at `:1843`, inside the bullet
  `- **Conseguenze accettate** (2026-09-25)` (`:1839-1843`), which speaks of «gli assegnamenti paralleli di R-SIM-17», not of
  R-SIM-33 («Il passo 3 in tre ondate», `:1831`). See §9 Q2.

**The check (RC-27).** Two fresh-context checkers, batches `mx-1` (13) and `mx-2` (12), the 1650 rubric (Appendix D of
`discovery_2026-10-11_goal_tree_hurts.md`) with the addendum of Appendix A here: judge the negative on its own, do not
net it against the gain. Applied as 1650: confirmed and regraded get `verified: agent`, rejected removed.

| Softgoal | added | confirmed | regraded | rejected | realized | rows |
|---|---:|---:|---:|---:|---:|---|
| SG-1 | 5 | 4 | 1 | 0 | 3 | R-RAIL-34, R-IRN-39, R-SIM-47, R-SIM-100, R-CR2-2 |
| SG-2 | 5 | 5 | 0 | 0 | 5 | R-SIM-63, R-SIM-65, R-SIM-98, R-SIM-104, R-LAY-16 |
| SG-4 | 5 | 5 | 0 | 0 | 2 | R-UNDO-1, R-SGL-7, R-STR-1, R-VP-28, R-VAL-9 |
| SG-5 | 1 | 1 | 0 | 0 | 1 | R-SIM-122 |
| SG-6 | 3 | 2 | 1 | 0 | 3 | R-SIM-17, R-SIM-91, R-VAL-13 |
| SG-7 | 6 | 6 | 0 | 0 | 2 | R-RAIL-27, R-RAIL-28, R-RAIL-29, R-RAIL-32, R-RAIL-37, R-RAIL-45 |
| all | 25 | 23 | 2 | 0 | 16 | |

Regrades: R-RAIL-34 SG-1 `read` to `inferred` (the row says the divergence becomes «meno visibile»; that it loads
the user is inferred); R-VAL-13 SG-6 `read` to `measured` (the divergence on `[]` is listed under «Misurato»). All
25 are `some-`; no `hurt` among the added ones. Each added entry sits right after the positive entry
of its pair in `contributions.json`.

## 5. The SG-3 recheck

Three fresh-context checkers (batches `d3-1`, `d3-2`, `d3-3`, 19 each) on all 57 SG-3 entries with `verified: none`,
the same rubric and the SG-3 addendum of Appendix A: a statement that the scenes still pass is a non-regression note,
not a contribution, unless the row changes what a scene shows or protects it by a gate; each reason names its case.

| Verdict | non-regression only | changes a scene | gate | other | all |
|---|---:|---:|---:|---:|---:|
| confirm | 0 | 24 | 8 | 1 | 33 |
| regrade | 0 | 2 | 4 | 0 | 6 |
| reject | 15 | 0 | 0 | 3 | 18 |

By batch: d3-1 14, 1, 4; d3-2 12, 1, 6; d3-3 7, 4, 8 (confirm, regrade, reject).

**Rejected (18)**, by row: non-regression only: R-IRN-40, R-IRN-39, R-IRN-41,
R-SIM-83, R-SIM-86, R-SIM-87, R-SIM-91, R-SIM-92, R-SIM-122, R-VP-19, R-VP-20, R-VP-23, R-VP-36, R-VP-53, R-EE-1;
other: R-SIM-62 (the «name (S → D)» step-line labels of the `why` are not in the row), R-SIM-99 (the scene change the
row makes is a cost, 7 clicks per scene where R-SIM-97 took 6; §9 Q3), R-VP-17 (landing before the freeze, no scene
use, no gate). By evidence: 13 `measured`, 3 `read`, 2 `inferred`.

**Regraded (6)**: R-SIM-77 `help` to `some+` (inferred: the row never names the demo); R-SIM-96 `help/read` to
`some+/inferred` («a DemoPetri-like net», no scene stated); R-VP-15 and R-VP-16 `help` to `some+` (a small gate:
deadline for lanes 3 and 4, no catalogue row until after the freeze); R-VP-21 and R-VP-22 `measured` to `read` (the
gate is stated, the measure is non-regression).

**Confirmed with a reason worth keeping**: R-SIM-76 (the change is an RC-26 point if the demo shows the panel, `gate`),
R-VP-34 (scoped to derived views so the demo «does not move», `gate`), R-VP-45 (only the toolbar runs the full layout,
`gate`), R-VP-48 (`some-`, the row says the full ELK layout may change what the scenes show), R-VP-24, R-VP-26, R-VP-54
and R-VP-18 (`changes a scene`).

The 1650 sample's three rejections (R-IRN-38, R-SIM-89, R-VP-31) are of the same kind as the 15 here. SG-3's realized
helping rows go from 50 to 37.

## 6. goalModel, before and after

Measured with `req-trace.mjs --repo . --cache-dir /tmp/gm2025/cache`, trunk `alfonso-frontend-jjtl`: «before» is the
HEAD script on the HEAD data, «after» the new script on the new data. Help and hurt count realized rows; «both» the
realized mixed rows.

| | before | after |
|---|---:|---:|
| rows / realized | 520 / 304 | 523 / 305 |
| entries in the file | 998 | 1005 |
| contributions on rows | 991 | 1005 |
| on realized rows | 675 | 678 |
| opposing pairs | 6569 | 7173 |
| realized mixed (row, softgoal) | 0 | 16 |
| `duplicates` | (no key) | 0 |

| Softgoal | help before | hurt before | help after | hurt after | both after | opposing before | opposing after |
|---|---:|---:|---:|---:|---:|---:|---:|
| SG-1 | 61 | 18 | 61 | 21 | 3 | 1098 | 1278 |
| SG-2 | 26 | 4 | 26 | 9 | 5 | 104 | 229 |
| SG-3 | 50 | 1 | 37 | 1 | 0 | 50 | 37 |
| SG-4 | 67 | 2 | 67 | 4 | 2 | 134 | 266 |
| SG-5 | 22 | 0 | 22 | 1 | 1 | 0 | 21 |
| SG-6 | 52 | 2 | 52 | 5 | 3 | 104 | 257 |
| SG-7 | 4 | 17 | 4 | 19 | 2 | 68 | 74 |
| SG-8 | 74 | 20 | 74 | 20 | 0 | 1480 | 1480 |
| SG-9 | 57 | 21 | 57 | 21 | 0 | 1197 | 1197 |
| SG-10 | 13 | 11 | 13 | 11 | 0 | 143 | 143 |
| SG-11 | 87 | 23 | 87 | 23 | 0 | 2001 | 2001 |
| SG-12 | 38 | 5 | 38 | 5 | 0 | 190 | 190 |

Every opposing count after equals help × hurt minus the mixed rows (SG-1: 61 × 21 − 3 = 1278). Correlation witnesses
checked against the new entries (each witness keeps its positive on `from` and its sign on `to`): 0 broken before, 0
after. The model's share of negative entries goes from 19.3% (193 of 998) to 21.7% (218 of 1005).

## 7. Tests and the mutation bench

New cases (`frontend/scripts/hooks/__tests__/`):
- `reqTrace.test.ts`, «a head with a label or a sub-number, and the near miss»: the three heads parse with head,
  date, title and family, R-D's text stops at the C- bullet; the R-STR-5 sentence is prose; R-D amends R-1.
- `reqTrace.test.ts`, «a mixed row, and a second entry of the same sign»: a mixed row is in both `balance` lists and
  opposes the others, never itself; a same-sign second entry is refused, the first in file order joined, the other in
  `duplicates`, the opposite sign still joins.
- `laneBoardRequirements.test.ts`: on the board, a mixed row is in its cluster's segment and a chip under SG-2's bar;
  each list shows the entry of its own side; `/api/requirements` has no self pair.

**On the base** (measured: `REQ_TRACE` and `LANE_BOARD` on copies of the HEAD files in `/tmp/gm2025/base1/`): 5 of
the 6 new cases fail, 55 others pass. The heads case fails on `['R-C', 'R-E']`; the near-miss and label cases fail
because R-B12 and R-D are absent; the mixed case fails only at `duplicates` (`expected undefined to deeply equal []`),
its balance and opposing assertions pass on the base; the same-sign case fails on `['first', 'second']`. The board's
mixed-row case **passes on the base**: the board and the base req-trace already drew a mixed row on both sides. It
pins that behaviour, and the bench shows it is the only guard of m11.

**Mutation bench** (`/tmp/gm2025/bench.mjs`, one mutation at a time on a `/tmp/gm2025/mut-<n>/` copy of `req-trace.mjs`
and `lane-board/`, both suites, 60 tests): **11 of 11 killed**.

| # | mutation | killed by |
|---|---|---|
| m1 | `ROW_START` without the comma label | heads; near miss; label |
| m2 | `ROW_START` without the sub-number | heads |
| m3 | a space opens a label (`[, ]`) | heads; near miss |
| m4 | the whole head blanked in the sentence pass | label |
| m5 | `familyOf` without the dot | heads |
| m6 | a same-sign entry joined (no `continue`) | same sign |
| m7 | one entry per pair, sign ignored | board mixed; mixed; same sign |
| m8 | self pair allowed | board mixed; mixed |
| m9 | the hurt side drops rows that also help | board mixed; mixed |
| m10 | the last of a same-sign pair joined, the first refused | same sign |
| m11 | `requirements.js`: the list entry ignores its side | board mixed |

## 8. Decisions taken (unattended)

Recorded here, not in `docs/decisions.md` (outside the perimeter); each `ratified as recommended, unattended` where the
prompt carried a recommendation (RC-21).
- **D1. Same sign: refuse and report.** The prompt asked to choose; the first entry in file order is joined, the
  second dropped from the join (so the cluster totals do not count it twice) and listed in `goalModel.duplicates`.
- **D2. The row text is the row proper**, the 1650 block cut at the next top-level bullet; this drops R-D SG-4 and
  R-SIM-33 SG-6 from the 27.
- **D3. The head label is read with the row** (R-D amends R-1), the id alone is blanked.
- **D4. `familyOf` strips a trailing `.N`**, so R-2/3.6 is family R-2/3.
- **D5. Evidence of the 25** assigned by the session before the check; the checker regraded 2.
- **D6. `ID_TOKEN` left as is**: a citation of R-2/3.6 elsewhere still reads `R-2/3` and resolves to nothing (§9 Q5).
- **D7. The cluster shift is reported, not corrected**: it follows from the three ids, the prompt's stop rule names
  ids, and no id other than the three appeared.
- **D8. The SG-3 addendum** spells out the cases the SG-3 description already names (what a scene shows, a surface
  brought into the demo build, a gate); a measure that the scenes are unchanged is RC-31's, not the row's.

**Decisions awaiting Alfonso (RC-26)**: none. No critical-zone file, no ratified row amended, no file deleted; 18 data
entries removed on the checker's verdict, as the prompt prescribes.

## 9. Open questions

1. **Q1.** The cluster partition moved with the parser: 16 clusters, R-JS-1's description orphaned, drift on seven
   described clusters. Recommended: the next cluster-description refresh (P-2026-10-11-1510's procedure) runs after
   this lane merges.
2. **Q2.** R-SIM-17 SG-6 holds one negative (the lexer defect, `some-`); the self-loop halt of «Conseguenze accettate»
   (`decisions.md:1839-1843`), a stated damage, concerns R-SIM-17 too and has no slot. Recommended: a later goals lane
   decides which negative the pair carries.
3. **Q3.** R-SIM-99's scene change is a cost to SG-3 (7 clicks per scene instead of 6); its positive entry was rejected
   and no negative was recorded (outside this lane). Recommended: add it with its own check in the next goals lane.
4. **Q4.** req-trace still cuts three rows short: R-CR2-2 at `decisions.md:4383` (a wrapped line opening with
   `**scartata**`), R-VAL-13 before its `**Todo separato**` paragraph (`:5468`), and R-STR-6's (B) form (`:3662`)
   is never read. Titles and citations only, not contributions. Recommended: a ticket on `parseRegister`'s
   continuation rule.
5. **Q5.** A citation of R-2/3.6 in another row, prompt or commit tokenizes as `R-2/3`. Recommended: leave it; one
   prompt and one docs commit cite it.
6. **Q6.** Correlations are not recomputed: the 25 negatives can add witnesses (SG-5 has its first negative).
   Recommended: the next correlation refresh.

## 10. Files read

`CLAUDE.md`; `docs/PROTOCOL.md` P4; `docs/decisions.md` (RC-17, RC-21, RC-23, RC-27; `:360-395`, `:466-476`,
`:1825-1850`, `:3660-3663`, `:3693`, `:4378-4386`, `:5450-5480`; every row through both parsers);
`docs/discovery/discovery_2026-10-11_goal_tree_hurts.md` (whole); `docs/goals/README.md`, `contributions.json`,
`softgoals.json`, `correlations.json`; `frontend/scripts/req-trace.mjs` (whole); `frontend/scripts/lane-board/requirements.js`
`:95-320`; `frontend/scripts/lane-board/lane-board.mjs` (imports, `:1255-1256`, `:1501-1518`);
`frontend/scripts/hooks/__tests__/reqTrace.test.ts` and `laneBoardRequirements.test.ts`; `/tmp/gt1650/draft-blocked.json`,
`parse.mjs`, `gate.js`; `docs/claude-code-log.md` (head).

## Appendix A. The checker addendum, verbatim

Appended to the 1650 rubric (`/tmp/gm2025/verify-rubric.md`, softgoals from `docs/goals/softgoals.json`):

> **Mixed entries (items `M..`).** The contract now allows a (row, softgoal) pair to carry two entries of opposite
> sign: the same row can buy and cost one softgoal (a positive and a negative contribution, as i* allows). Every `M`
> item is the NEGATIVE entry of such a pair; the row already has a positive entry on that softgoal, which is not under
> review and is not shown. Judge the negative entry on its own: does the row state or clearly imply this cost to this
> softgoal, at this strength, on this evidence? Do not net it against the gain, and do not reject it because the row
> also helps the softgoal. Reject it when the cost is not in the row text, or when it is a cost to a different
> softgoal.
>
> **SG-3 entries (items `D..`).** These are first-draft SG-3 (demo readiness) entries. A statement that the demo scenes
> still pass after the change (the four scenes «0 px» from a base run, «byte-identical», «readings identical», a probe
> that finds the scenes unchanged) is a **non-regression note**, not a contribution to demo readiness: it shows the
> row left the demo as it was, and that non-regression belongs to the harness rule that asks for the measure (RC-31),
> not to the row. Such an entry is a `reject`, **unless** the row also changes what a scene shows (a control, a line,
> a reading, a notation the scenes use or display, decided or built for the demo, or a surface the scenes use brought
> into the demo build before the freeze) or protects a scene by a gate (it keeps something out of the demo build,
> scopes a change away from what the demo shows, or makes a demo-visible change wait for a decision). Being dated
> before the freeze is not, by itself, a contribution. In the `reason` of every D item, say which case applies:
> `non-regression only`, `changes a scene`, `gate`, or `other: ...`.

## Appendix B. The data gate, run

`/tmp/gm2025/gate.js` is `/tmp/gt1650/gate.js` (report 1650, Appendix A) with two edits: the duplicate key is
(req, softgoal, sign), and the em-dash check reads this report instead of the 1650 one.

```
$ node /tmp/gm2025/gate.js
softgoals 12, contributions 1005, conflicts 13, macro goals 5, correlations 53, lane-written objects 122, errors 0
exit 0

$ GOALS_DIR=<copy + R-SIM-63/SG-2 hurt, R-B9/SG-4 some+, R-B9/SG-12 some-> node /tmp/gm2025/gate.js
softgoals 12, contributions 1008, conflicts 13, macro goals 5, correlations 53, lane-written objects 125, errors 2
  contributions[1005] R-SIM-63/SG-2: duplicate (req, softgoal, sign)
  contributions[1006] R-B9/SG-4: duplicate (req, softgoal, sign)
exit 1
```

The control adds a second negative to a mixed pair and a second positive to a single pair (both flagged) and a first
negative on a positive pair (accepted).
