# Discovery 2026-10-05: the goal model of the requirements, first draft

Prompt-ID: P-2026-10-05-1725 · chat C-2026-10-05-1648 · session 44ef05a8 · branch `harness-goal-model`
from `57ff86f5d` (prompt commit `ca3a4b8de`). Files: `docs/goals/softgoals.json`, `docs/goals/contributions.json`,
`docs/goals/conflicts.json`, `docs/goals/README.md`, row R-GOAL-1 (`docs/decisions.md:5715`).

## 0. Answer in brief

- **Done.** Seven softgoals (SG-1 to SG-7) are written and recorded as R-GOAL-1. All 479 R- row ids of the register
  were judged. 304 of them (63%) carry at least one contribution: 451 links in all, 11 conflicts.
- **The register records gains, not costs.** No `make`, `hurt` or `break`, and only 36 links are negative, all
  `some-`. A row states what it buys and rarely what it gives up, so a goal model read from it comes out optimistic.
- **The sample agreed.** A fresh-context agent agreed with 37 of 40 sampled links (92.5%, Wilson 95% 80% to 97%,
  seed 20261005). One link was dropped, two were downgraded, and one evidence label was lowered.
- **What to look at first (§7).**
  1. SG-6 on realized rows. State machines follow UML on `else` (R-SIM-31) but drop run-to-completion (R-SIM-20).
     Saved metamodels with class-to-enum references keep loading, unflagged (R-EDGE-3).
  2. SG-1. Seven negative links, all on realized rows and all of one shape: two readings of one thing (`node`,
     `path?`, «valido», override, colour coupling).
  3. SG-2. «Absent, not disabled» (R-STR-2, R-FORM-14) and «disabled, not hidden» (R-VP-39, R-IRN-10) both hold. No
     row chooses between them.
  4. SG-4. R-SGL-10 accepts two undo steps for one gesture, the one deliberate reversibility cost. The failing undo
     of R-IRN-41 is already closed by R-UNDO-8 (`ac64b213b`, on HEAD).
- **Clusters of P-2026-10-05-1720.** Not available: `harness-req-tab` holds only its prompt commit (`b9f8a43ec`), and
  this lane did not wait for it.

**Decisions taken (unattended)**: twelve, listed in §8, the main ones being:
- the draft split across five subagents and reviewed by this session;
- SG-6 extended to the metamodeling formalism;
- the SG-3 freeze read as 2026-10-07, not 2026-10-01;
- D-UI rows left out as not R- rows.

**Decisions awaiting Alfonso (RC-26)**: none. No item of this lane is on the RC-26 list.

**Questions, none blocking:**
- Q1. Keep SG-6's extension to the metamodeling formalism (28 of its 73 links)?
  Recommended: keep it; the alternative is an eighth softgoal with the same scope sentence.
- Q2. Keep the 21 SG-3 links that only measure the four scenes unchanged?
  Recommended: keep them; the tab can filter `some+` with `measured` on SG-3 when it wants new capability only.
- Q3. Judge the seven D-UI rows in a follow-up?
  Recommended: yes, a fast lane; D-UI-12 and D-UI-15 carry SG-2 and SG-4 content that is missing now.
- Q4. Should new R- rows name their cost in a short clause, so negative links stop resting on inference?
  Recommended: yes, as a line of the prompt template, not as a gate.

## 1. Objective and hypotheses

Objective: the softgoal level of a goal model (i* / GRL contribution links) over the R- rows of `docs/decisions.md`,
as data the Requirements tab of P-2026-10-05-1720 reads, under the contract that prompt fixes (§6 of it, verbatim:
«`softgoals.json` is `[{id: "SG-n", name, description}]`; `contributions.json` is `[{req, softgoal, kind: ...,
evidence: ..., verified: "none"|"agent"|"alfonso", why}]`; `conflicts.json` is `[{a, b, softgoal, why, evidence}]`»).

Hypotheses the lane set out to falsify, each with its result:

- H1, «most R- rows support at least one defensible contribution». Held: 304 of 479 (63%).
- H2, «the register states costs as often as gains». Falsified: 36 of 451 links are negative, all `some-`, with no
  `hurt` and no `break` (§3).
- H3, «a second agent with a fresh context agrees with at least 80% of the links». Held: 37 of 40, with a Wilson
  lower bound of 80.1% (§6).
- H4, «the conflicts are found among rows that cite each other». Mostly falsified. Of 14 citation-linked candidates
  with opposite signs, the script flagged 3 as evolution links only; judgement kept 1 as it was and re-paired 1. 9 of
  the 11 conflicts came from the hand pass over the 36 negative links (§5).

## 2. Method

1. **Inventory.** A parser (`/tmp/goal1725/parse.mjs`, session scratch) reads a row as a line opening
   `- **<id>` or `**<id>`, followed by `**`, a comma or ` (A)**`, with `<id>` of the form `R-…`, `RC-…` or `D-UI-…`. A
   row runs to the next row start or heading. That gives 480 R- row blocks with 479 ids: R-STR-6 has an (A) form at
   `:3576` and a (B) form at `:3625`, judged under the one id. Not judged: 36 RC rows (prompt) and 7 D-UI rows (not
   R- rows, decision D2). The project chat's count in P-2026-10-05-1720 (436 R- rows) uses another parser; the contract
   check of Appendix A accepts all 479 ids.
2. **Softgoals.** Each description cites the texts that state the principle: `CLAUDE.md` §8.8,
   `docs/DESIGN-SYSTEM.md` §4.2 and §4.3, the demo script, RC-17, RC-18, RC-25, RC-26, RC-31, RC-32, and rows that
   already serve each one. SG-3 was corrected during the lane: `docs/sessioni/sessione_2026-09-30_2.md:13` reads
   «Calendar: freeze of merges on 2026-10-07, Málaga, back 2026-10-09», while the script header still gives the first
   calendar (decision D5).
3. **Draft.** The register was split into five chunks of about 90 KB, in register order. Five subagents (the session's
   model) each judged one chunk under one written rubric, given verbatim in Appendix C. Each listed every row it
   reviewed, so coverage could be checked: 479 of 479, none missing, none extra. The session read all 445 drafted links
   and applied the post-pass of decision D5: 7 SG-3 links added for rows dated 2026-10-02 to 2026-10-06 that measure
   the four scenes unchanged, and R-SIM-109 on SG-3 moved from `some-` to `some+`. That made 452.
4. **Realized.** A proxy: the row id, or a range containing it, is cited in the message of a commit that touches
   `frontend/src` and is reachable from HEAD. 317 of 479 rows qualify. The proxy misses rows realized under a prompt id
   alone; R-UNDO, for example, reads 0 of 8.
5. **Conflicts.** First, a mechanical pass: pairs with opposite signs on one softgoal in which one row cites the other
   gave 14 candidates. A pair is flagged evolution-only when every citation sits next to «emend», «amend», «supersed»,
   «sostitu», «superat», «refin», «rinumer» or «replac»; 3 were. Next came the drafters' trade-offs (1). Last, a hand
   pass over all 36 negative links, looking for the row each one pulls against. Evolution links are left out.
6. **Verification (RC-27).** The sample is mulberry32 with seed 20261005, a Fisher-Yates shuffle of the 452
   post-pass links in file order, and the first 40 (Appendix B). A sixth subagent with a fresh context saw only the
   softgoals, rules 1 to 9 of the rubric, and each sampled link with its row text. Its verdicts were applied as the
   prompt asks: `verified: "agent"` on `supported`, the kind downgraded on `weaker kind`, the link dropped on
   `unsupported`. Final count: 451.

## 3. Counts per softgoal and kind

| Softgoal | make | help | some+ | some- | hurt | break | total | rows |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| SG-1 | 0 | 33 | 65 | 7 | 0 | 0 | 105 | 105 |
| SG-2 | 0 | 18 | 15 | 5 | 0 | 0 | 38 | 38 |
| SG-3 | 0 | 15 | 49 | 2 | 0 | 0 | 66 | 66 |
| SG-4 | 0 | 48 | 60 | 2 | 0 | 0 | 110 | 110 |
| SG-5 | 0 | 15 | 11 | 0 | 0 | 0 | 26 | 26 |
| SG-6 | 0 | 17 | 54 | 2 | 0 | 0 | 73 | 73 |
| SG-7 | 0 | 3 | 12 | 18 | 0 | 0 | 33 | 33 |
| all | 0 | 149 | 266 | 36 | 0 | 0 | 451 | 304 |

Evidence: `read` 281, `inferred` 111, `measured` 59. Verified: `agent` 37, `none` 414. Realized rows (proxy) carry
322 positive and 29 negative links.

Reading. SG-4 and SG-1 lead because the register is mostly UI and persistence decisions that state «no migration»
or «visible only in Advanced». SG-5 (26) and SG-6 (73, 45 of them on R-SIM rows) come almost entirely from the
simulator series. SG-7 is the only softgoal whose links are mostly negative (18 of 33): when an R- row speaks of
process at all, it usually adds a hard stop, a separate commit, a discovery or a Layer Impact Report. The RC rows,
which hold most of the harness, are outside this lane.

## 4. Rows with no contribution, by family

| Family | rows | without contribution | share |
|---|---:|---:|---:|
| R-SIM | 136 | 32 | 24% |
| R-VP | 60 | 24 | 40% |
| R-RAIL | 45 | 14 | 31% |
| R-IRN | 41 | 15 | 37% |
| R-VAL | 21 | 6 | 29% |
| R-LAY | 19 | 7 | 37% |
| R-FORM | 15 | 11 | 73% |
| R-MK | 14 | 9 | 64% |
| R-JS | 11 | 9 | 82% |
| R-B | 10 | 4 | 40% |
| R-SGL | 10 | 1 | 10% |
| R-UNDO | 8 | 2 | 25% |
| R-DMV | 8 | 3 | 38% |
| Arco A (R-A, R-C..R-H, R-2/3.6) | 7 | 2 | 29% |
| R-J | 7 | 4 | 57% |
| R-STR | 7 | 3 | 43% |
| R-DEAD | 6 | 4 | 67% |
| R-M2U | 6 | 5 | 83% |
| R-CR2 | 6 | 2 | 33% |
| R-ESEL | 5 | 4 | 80% |
| R-WCX | 5 | 4 | 80% |
| R-S1 | 5 | 2 | 40% |
| R-SKIN | 5 | 1 | 20% |
| R-HND | 4 | 4 | 100% |
| R-EE | 4 | 0 | 0% |
| R-NV | 4 | 1 | 25% |
| R-EDGE | 3 | 0 | 0% |
| R-GT | 2 | 0 | 0% |
| R-MCID | 2 | 1 | 50% |
| R-E/E-1 | 1 | 0 | 0% |
| R-DEL | 1 | 0 | 0% |
| R-M2 | 1 | 1 | 100% |
| all | 479 | 175 | 37% |

Reading. The families without links are the ones that decide internals with no user-visible or engine-visible
effect: write contracts (R-WCX), name-uniqueness mechanics (R-M2U), resize handles that were measured but never opened
(R-HND, «Fronte non aperto», `:3398`), JjScript timing (R-JS), and the R-FORM form-engine contract. R-SIM, R-SGL, R-EE
and R-EDGE are almost fully linked, because their rows state effects. Under rule 1 of the rubric an empty row is the
expected outcome, not a gap.

## 5. Conflicts

Eleven, in `docs/goals/conflicts.json`. Convention: `a` pulls toward the softgoal and `b` pulls away (decision D7).
Ranked by consequence: realized behaviour first, then semantics and persisted data before presentation. The first ten
are the ones the prompt asks for.

| # | a | b | SG | evidence | why |
|---:|---|---|---|---|---|
| 1 | R-EDGE-2 (`:303`) | R-EDGE-3 (`:310`) | SG-6 | read | The core refuses a non-class reference type, while saved ill-formed forms S1, S5b and S6 stay, because retyping «cancella gli edge orfani» (persisted data, RC-26): SG-4 bought with conformance. |
| 2 | R-SIM-31 (`:1808`) | R-SIM-20 (`:1717`) | SG-6 | inferred | `else` «come [else] in UML»; no run-to-completion: «senza di essa la verifica copre un sovrainsieme dei comportamenti UML». |
| 3 | R-UNDO-5 (`:3379`) | R-SGL-10 (`:3488`) | SG-4 | inferred | One rename is one dispatch, one ⌘Z; one select gesture is «Due passi di undo ... accettati», to keep a creator out of the transaction (CLAUDE.md §3.3). |
| 4 | R-VP-39 (`:4937`) | R-STR-2 (`:3521`) | SG-2 | inferred | «disabled, not hidden», measured «move nothing in the panel», against «assente, non disabilitata». The same split runs between R-FORM-14 (`:3902`) and R-IRN-10 (`:1082`). |
| 5 | R-DMV-1 (`:5276`) | R-VAL-2 (`:5362`) | SG-1 | read | Validation viewpoints are multiple «diversamente da R-DMV-1»; «valido» becomes relative to the active set, «da dichiarare in interfaccia». |
| 6 | R-SIM-18 (`:1686`) | R-SIM-42 (`:1929`) | SG-1 | read | One syntax per meaning, and a fallback name if `node` collides; R-SIM-42 keeps `node` with its Console, Jodie and validation meaning, «si documenta accanto». |
| 7 | R-SIM-55 (`:2019`) | R-SIM-79 (`:2277`) | SG-1 | read | Role groups go into the modal; the demo build reopens them inline, «scostamento dichiarato da R-SIM-55 fino alla corsia del modale, dopo MODELS» (SG-3 over SG-1). |
| 8 | R-B10 (`:462`) | R-VP-41 (`:5044`) | SG-2 | inferred | Persisted waypoints «tornano vivi al ritorno a orthogonal»; ELK routes are «drawn, never persisted», so a reload or a move redraws them. |
| 9 | R-SIM-105 (`:2540`) | R-SIM-101 (`:2523`) | SG-1 | inferred | «the compact panel stays the default»; the same compact panel gains a Choices row, Play and a k input. |
| 10 | R-VP-4 (`:4413`) | R-VAL-12 (`:5423`) | SG-1 | read | «Il viewpoint è override»; validation rules never override, and R-VAL-12 says «per analogia ci si aspetta l'override». |
| 11 | R-VP-27 (`:4526`) | R-VP-39 (`:4937`) | SG-1 | inferred | Colour by metaclass is off with its controls hidden; when it is on, one override moves other classes: «overriding Activity changed five other node classes». |

Where the 14 mechanical candidates went: 1 kept as it was (conflict 5), 1 re-paired (R-SIM-49 against R-SIM-20
became conflict 2, against R-SIM-31), 4 left out as evolution or rejected amendment, 8 left out because the citation
concerns something else (for example R-IRN-27 cites R-DEAD-5 as the slice that deletes the file). Left out on purpose:
- Evolution pairs: R-RAIL-42 and R-RAIL-44 («Emenda R-RAIL-42»); R-IRN-38 and R-IRN-41 («Amends R-IRN-38»); R-VP-22
  and R-VP-54 («amends R-VP-22»); R-SIM-16 and R-SIM-88 (R-SIM-88 rejects the options «che emenderebbero R-SIM-16»).
- R-IRN-41 against R-UNDO-8. The second fixes what the first recorded as a failing undo («per ogni scrittura inline sul
  canvas (riga IR, path label, cella ObjectNode)», `:3385`). That is a fix, not a tension (decision D8).

## 6. Sample agreement (RC-27)

Seed 20261005, n = 40 of 452, sample spread: SG-1 8, SG-2 7, SG-3 3, SG-4 10, SG-5 3, SG-6 5, SG-7 4;
`some+` 26, `help` 11, `some-` 3.

- Agreement: 37 `supported`, 2 `weaker kind`, 1 `unsupported`, so 92.5%, with a Wilson 95% interval of 80.1% to 97.4%.
- Applied:
  - R-IRN-26 SG-4 dropped. The row places the adapter and leaves alone a top-level field «scritto e mai riletto»;
    «lasciare invariati gli id utente» is R-IRN-20's rule, cited there and not decided here.
  - R-SIM-109 SG-4 `help` to `some+`: one clause applying RC-31.
  - R-SIM-136 SG-5 `help` to `some+`: accepted ticks still step.
  - R-RAIL-37 SG-7 evidence `read` to `inferred`, still `supported`.
- Contested but kept: R-SIM-109 on SG-3, which the session moved to `some+` (decision D5). The verifier notes it also
  fits SG-3's «scene-critical surface moved late» clause. It is the one SG-3 judgement to confirm.

| # | index | req | softgoal | drafted kind | drafted evidence | verdict |
|---:|---:|---|---|---|---|---|
| 1 | 3 | R-EDGE-2 | SG-6 | some+ | inferred | supported |
| 2 | 7 | R-A | SG-2 | help | read | supported |
| 3 | 8 | R-D | SG-4 | some+ | read | supported |
| 4 | 10 | R-H | SG-1 | some+ | read | supported |
| 5 | 13 | R-B9-bis | SG-4 | help | read | supported |
| 6 | 16 | R-B13 | SG-4 | some+ | inferred | supported |
| 7 | 45 | R-RAIL-35 | SG-1 | some+ | read | supported |
| 8 | 47 | R-RAIL-37 | SG-7 | some+ | read | supported; evidence inferred |
| 9 | 74 | R-IRN-26 | SG-4 | some+ | read | unsupported |
| 10 | 99 | R-SIM-7 | SG-5 | help | read | supported |
| 11 | 110 | R-SIM-18 | SG-1 | some+ | read | supported |
| 12 | 118 | R-SIM-22 | SG-5 | some+ | inferred | supported |
| 13 | 126 | R-SIM-27 | SG-6 | some+ | inferred | supported |
| 14 | 130 | R-SIM-29 | SG-6 | some+ | inferred | supported |
| 15 | 145 | R-SIM-38 | SG-4 | some+ | read | supported |
| 16 | 157 | R-SIM-50 | SG-6 | some+ | inferred | supported |
| 17 | 161 | R-SIM-55 | SG-1 | some+ | inferred | supported |
| 18 | 171 | R-SIM-62 | SG-1 | some+ | inferred | supported |
| 19 | 174 | R-SIM-63 | SG-3 | some+ | inferred | supported |
| 20 | 178 | R-SIM-66 | SG-2 | help | read | supported |
| 21 | 189 | R-SIM-75 | SG-6 | some+ | read | supported |
| 22 | 191 | R-SIM-76 | SG-7 | some- | read | supported |
| 23 | 209 | R-SIM-85 | SG-4 | some+ | read | supported |
| 24 | 220 | R-SIM-90 | SG-2 | some+ | read | supported |
| 25 | 238 | R-SIM-98 | SG-3 | some+ | read | supported |
| 26 | 258 | R-SIM-108 | SG-7 | some- | read | supported |
| 27 | 260 | R-SIM-109 | SG-3 | some+ | read | supported |
| 28 | 261 | R-SIM-109 | SG-4 | help | read | weaker kind (some+) |
| 29 | 278 | R-SIM-131 | SG-2 | help | measured | supported |
| 30 | 281 | R-SIM-136 | SG-5 | help | measured | weaker kind (some+) |
| 31 | 288 | R-MK-8 | SG-4 | some+ | read | supported |
| 32 | 302 | R-LAY-14 | SG-4 | help | read | supported |
| 33 | 305 | R-LAY-16 | SG-2 | some+ | inferred | supported |
| 34 | 310 | R-DEAD-5 | SG-7 | some- | read | supported |
| 35 | 344 | R-S1-3 | SG-1 | help | read | supported |
| 36 | 355 | R-CR2-5 | SG-1 | some+ | read | supported |
| 37 | 406 | R-VP-54 | SG-4 | help | read | supported |
| 38 | 407 | R-VP-57 | SG-2 | some+ | read | supported |
| 39 | 419 | R-DMV-5 | SG-1 | help | inferred | supported |
| 40 | 441 | R-VAL-19 | SG-2 | some+ | inferred | supported |

## 7. What Alfonso should look at first

Negative links on realized rows (proxy of §2.4), by softgoal:

| Softgoal | negative links | on realized rows | rows |
|---|---:|---:|---|
| SG-1 | 7 | 7 | R-SIM-42, R-SIM-101, R-MK-10, R-VP-22, R-VP-39, R-VAL-2, R-VAL-12 |
| SG-2 | 5 | 4 | R-RAIL-41, R-IRN-29, R-STR-2, R-VP-41 |
| SG-3 | 2 | 2 | R-SIM-88, R-VP-48 |
| SG-4 | 2 | 1 | R-IRN-41 |
| SG-5 | 0 | 0 |  |
| SG-6 | 2 | 2 | R-EDGE-3, R-SIM-20 |
| SG-7 | 18 | 13 | R-B15, R-RAIL-42, R-IRN-25, R-SIM-17, R-SIM-33, R-SIM-39, R-SIM-76, R-SIM-85, R-SIM-108, R-MK-9, R-MK-10, R-LAY-10, R-DEAD-5 |

1. **SG-6, the formalism of the demo's state machines.** R-SIM-20 (`:1717`) drops run-to-completion, so verification
   «copre un sovrainsieme dei comportamenti UML», while R-SIM-31 (`:1808`) follows UML on `else`. The state machine
   and ESM scenes run this semantics. Stability survives only as an optional exporter hypothesis, which R-SIM-49 lists
   among the profile's parameters. R-EDGE-3 (`:310`) leaves class-to-enum references in saved metamodels unflagged
   until the M2 rule its ticket names exists.
2. **SG-1, two readings of one thing.**
   - R-SIM-42 (`:1929`): `node`.
   - R-MK-10 (`:2836`): two `path?`, «divergenza temporanea e dichiarata» on 2026-08-18; whether its convergence
     micro-slice ran is not in the register.
   - R-VAL-2 (`:5362`): «valido» relative to the active set.
   - R-VAL-12 (`:5423`): no override, against the analogy of syntax viewpoints.
   - R-VP-39 (`:4937`): colour coupling.
   - R-VP-22 (`:4688`): twin notations, later converged for state machines by R-VP-54 (`:5104`).
   - R-SIM-101 (`:2523`): controls added to the compact panel.
3. **SG-2, no principle row.** «Absent, not disabled» and «disabled, not hidden» both hold (conflict 4).
   `docs/DESIGN-SYSTEM.md` §4.3 sides with keeping the box: «Toggle visibility with `opacity` + `pointer-events`, not
   `display: none`». R-A (`:351`) keeps `display: none` for inactive tabs, where a tab switch swaps the whole pane. A
   one-line R- row would settle the controls case.
4. **SG-4.** R-SGL-10 (`:3488`) is the one deliberate realized cost: two undo steps for one gesture, imposed by rule 12.
   It is realized by `1635e8450` (on HEAD), which the proxy misses because the commit message cites no row id.
   R-IRN-41's failing undo (`:1546`, «The failing item is undo») is closed by R-UNDO-8 (`ac64b213b`, an ancestor of
   HEAD).
5. **SG-5 has no negative link.** The clock rows (R-SIM-122 `:2603`, R-SIM-134..136) were judged positive because
   «The engine sees only events». The verifier lowered R-SIM-136 to `some+`. Wall-clock ticks are the first
   timing-dependent input, so this reading deserves a confirmation.
6. **SG-3.** 21 of its 66 links measure only that the four scenes did not change. R-VP-48 (`:5016`, ELK after an
   auto-layout «may change what the MODELS demo scenes show») and R-SIM-88 (`:2412`, the ESM script «va allineato»)
   are its two negative links.
7. **Clusters (P-2026-10-05-1720).** Not available at this lane's close: `git log harness-req-tab` reads `b9f8a43ec`
   (its prompt) on top of `57ff86f5d`, and `git ls-tree` finds no `frontend/scripts/board/`. The tab joins these files
   when it lands.

## 8. Decisions taken (unattended)

- **D1. Drafting split.** Five subagents, one chunk each, under one rubric. The session read and reviewed every
  drafted link, and a sixth subagent verified. Reason: 450 KB of rows inside the 90-minute limit; total wall time of
  the draft was 14 minutes.
- **D2. Judged set: the R- rows only, 479 ids.** RC rows are excluded by the prompt. The seven D-UI rows are not R-
  rows. The bullet for R-RAIL-44 in «## Superate» is not a row; R-RAIL-44 is judged in its own series.
- **D3. One id for R-STR-6.** Its forms (A) and (B) are judged under that id.
- **D4. SG-6 covers the metamodeling formalism too.** Conformance and metaclass identity are included, stated in its
  description; 28 of its 73 links fall there (Q1).
- **D5. SG-3's freeze is 2026-10-07.** Source: the checkpoint `sessione_2026-09-30_2.md:13`. The description cites
  both calendars. The drafts had applied 2026-10-01 (rubric rule 8 as first written); 7 links were added and 1 was
  flipped on that basis.
- **D6. «Realized» is a proxy** (§2.4), declared with its miss.
- **D7. Conflict convention.** `a` pulls toward, `b` away. Conflict 7 is recorded as a named trade-off even though
  R-SIM-79's net SG-1 link is `some+` (it hides presets).
- **D8. A fix is not a conflict.** R-IRN-41 against R-UNDO-8 is not recorded.
- **D9. Downgraded links stay `verified: "none"`.** The prompt sets `agent` on supported links only.
- **D10. Where R-GOAL-1 sits.** It is a new series «R-GOAL» placed just before «## Superate», where the live rows end.
  No other row is touched (`git diff` adds 16 lines and removes none).
- **D11. The lane header names no RC-3 trigger.** It reads `Lane: full (docs and data only, no code)`, which is none
  of RC-3's four. The trigger that applies in fact is «more than 3 files»: this lane writes 8 files over two commits, all
  named in the prompt's DOVE, which stands as the confirmation that rule 19 asks for (RC-11). Declared here per P13,
  and the lane did not stop for it.
- **D12. R-RAIL-44 is judged although D-UI-15 superseded it.** Its links record what it decided. A reader filtering
  live rows should drop it.

## 9. Risks and limits

- **The draft is inferred.** 111 links are `inferred`. The sample checks the direction and strength of 40 links out
  of 452, not their completeness: a missing link is invisible to it.
- **Five drafters, five calibrations.** Chunk 1 (R-SIM-1..100) linked 87 of 106 rows; chunk 4 (R-VP-24..R-MCID) 51 of
  87. Part of that gap is the rows (simulator rows state effects), and part may be the drafter.
- **Section intros were not seen.** The preambles under `###` headings, which often hold the measures, were not passed
  to the drafters. Some `measured` links may therefore read `read`.
- **The realized proxy undercounts** rows realized under a prompt id only.
- **The parser.** Its row boundaries were checked on every id by the contract check. Its family grouping is
  cosmetic: R-B mixes R-B (2026-08-05, Arco A) with R-B9 to R-B17.

## 10. Files read

`/Users/alfonso/jjodel-w-goals/` plus: `CLAUDE.md`; `docs/PROTOCOL.md`; `docs/decisions.md` (every R- row through the
parser, RC-15 to RC-41 and the R-EDGE, R-ESEL, R-SIM-134..136, D-UI-15 and D-UI-16 rows directly); `docs/DESIGN-SYSTEM.md`
§4.2 and §4.3; `docs/demo/models_2026_simulator_demo.md` (header and §1); `docs/sessioni/sessione_2026-09-30_2.md`
(head); `docs/ratifiche/claude_2026-09-25_1015_memo_harness_recalibration.md` §1 to §3;
`docs/claude-code-log.md` (head); `docs/log-inbox/harness.md`, `docs/log-inbox/simulation.md` (headers),
`docs/log-inbox/symbol-editor.md` (the R-IRN-41 ticket); `.claude/skills/log-entry/SKILL.md`;
`frontend/scripts/gates/check-docs.ts` (header); `docs/prompts/claude_2026-10-05_1720_prompt_harness_board_requirements_tab.md`
on `harness-req-tab`; `git log` of HEAD (messages, and the files under `frontend/src`).

## Appendix A. The contract check, run

The check reads the three files and the register. It fails when any of the following holds:
- a field is missing or extra;
- a `req` is not an R- row of `docs/decisions.md`;
- a softgoal is not in `softgoals.json`;
- a `kind`, an `evidence` or a `verified` value is outside its set;
- a `why` is empty;
- a (req, softgoal) pair appears twice;
- a conflict names a row that is not in the register, or names the same row twice.

```js
import fs from 'node:fs';
const [dir = 'docs/goals', reg = 'docs/decisions.md'] = process.argv.slice(2);
const load = (f) => JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8'));
const sg = load('softgoals.json'), co = load('contributions.json'), cf = load('conflicts.json');
const text = fs.readFileSync(reg, 'utf8'), errs = [];
const row = (id) => new RegExp(`^(?:- )?\\*\\*${id.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?:\\*\\*|,| \\([A-Z]\\)\\*\\*)`, 'm').test(text);
const keys = (o, ks, w) => { if (JSON.stringify(Object.keys(o).sort()) !== JSON.stringify([...ks].sort())) errs.push(`${w}: keys ${Object.keys(o)}`); };
const ids = new Set(sg.map((s) => s.id)), EV = ['measured', 'read', 'inferred'], seen = new Set();
sg.forEach((s, i) => { keys(s, ['id', 'name', 'description'], `softgoals[${i}]`); if (!/^SG-\d+$/.test(s.id)) errs.push(`softgoals[${i}]: id ${s.id}`); });
if (ids.size !== sg.length) errs.push('softgoals: duplicate id');
co.forEach((c, i) => { const w = `contributions[${i}] ${c.req}/${c.softgoal}`; keys(c, ['req', 'softgoal', 'kind', 'evidence', 'verified', 'why'], w);
  if (!/^R-/.test(c.req) || !row(c.req)) errs.push(`${w}: req not an R- row of ${reg}`); if (!ids.has(c.softgoal)) errs.push(`${w}: unknown softgoal`);
  if (!['make', 'help', 'some+', 'some-', 'hurt', 'break'].includes(c.kind)) errs.push(`${w}: kind ${c.kind}`); if (!EV.includes(c.evidence)) errs.push(`${w}: evidence ${c.evidence}`);
  if (!['none', 'agent', 'alfonso'].includes(c.verified)) errs.push(`${w}: verified ${c.verified}`); if (typeof c.why !== 'string' || !c.why.trim()) errs.push(`${w}: empty why`);
  if (seen.has(c.req + '|' + c.softgoal)) errs.push(`${w}: duplicate`); seen.add(c.req + '|' + c.softgoal); });
cf.forEach((c, i) => { const w = `conflicts[${i}] ${c.a}~${c.b}/${c.softgoal}`; keys(c, ['a', 'b', 'softgoal', 'why', 'evidence'], w);
  for (const r of [c.a, c.b]) if (!row(r)) errs.push(`${w}: ${r} not a row of ${reg}`); if (c.a === c.b) errs.push(`${w}: a = b`);
  if (!ids.has(c.softgoal)) errs.push(`${w}: unknown softgoal`); if (!EV.includes(c.evidence)) errs.push(`${w}: evidence ${c.evidence}`); });
console.log(`softgoals ${sg.length}, contributions ${co.length}, conflicts ${cf.length}, errors ${errs.length}`);
errs.slice(0, 20).forEach((e) => console.log('  ' + e)); process.exit(errs.length ? 1 : 0);
```

Run on 2026-10-05 with node v23.3.0, from the worktree root, on the code above extracted from this file (`awk` on the first `js` block, `diff` against the script that ran: identical):

```
$ node check.mjs docs/goals docs/decisions.md
softgoals 7, contributions 451, conflicts 11, errors 0
exit 0

$ node check.mjs <copy of docs/goals with one contribution to SG-9 appended> docs/decisions.md
softgoals 7, contributions 452, conflicts 11, errors 1
  contributions[451] R-SIM-21/SG-9: unknown softgoal
exit 1
```

Negative control: the appended contribution to `SG-9` turns the check red, exit 1. Positive control of the row predicate, run before the draft: a fixture with one contribution for each of the 479 ids passes with 0 errors, and the same fixture with `R-NOPE-1`, a `kind` of `helps`, a `verified` of `alfonso2`, an empty `why` and a duplicate pair added fails with exactly those 6 errors, exit 1.

## Appendix B. The sampling script

```js
import fs from 'node:fs';
const [file, n = '40', seed = '20261005'] = process.argv.slice(2);
const co = JSON.parse(fs.readFileSync(file, 'utf8'));
let a = Number(seed) >>> 0;
const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const idx = co.map((_, i) => i);
for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
console.log(JSON.stringify(idx.slice(0, Number(n)).sort((x, y) => x - y).map((i) => ({ index: i, ...co[i] })), null, 1));
```

Run as `node sample.mjs <post-pass file> 40 20261005`. Indices drawn: 3, 7, 8, 10, 13, 16, 45, 47, 74, 99, 110, 118, 126, 130, 145, 157, 161, 171, 174, 178, 189, 191, 209, 220, 238, 258, 260, 261, 278, 281, 288, 302, 305, 310, 344, 355, 406, 407, 419, 441.

## Appendix C. The drafting rubric, verbatim

Written before the draft and given to the five drafters; rules 1 to 9 also to the verifier. Rule 8 named the 2026-10-01 freeze, corrected by decision D5. Its headings are demoted to sit under this appendix.

### Rubric: goal-model contributions of the decision register (P-2026-10-05-1725)

You judge rows of `docs/decisions.md` (repo `/Users/alfonso/jjodel-w-goals`, read-only for you) against seven
softgoals. Their definitions are in `/Users/alfonso/jjodel-w-goals/docs/goals/softgoals.json`: read it first,
the scope sentences included. Short form:

- SG-1 low cognitive load (progressive disclosure, Basic/Advanced, one place and one name for one thing; the product's users only)
- SG-2 no layout shift (fixed dimensions, no reflow on state change, positions/sizes stable across reloads and viewpoint switches)
- SG-3 demo readiness (the MODELS 2026 simulator demo, four scenes: state machine, Petri, ESM, Flow B; build frozen 2026-10-01 evening)
- SG-4 reversibility (of the user's changes: undo, saved projects keep opening, no destructive migration; and of decisions)
- SG-5 determinism of the simulation engine (same net, state, inputs give same run and trace)
- SG-6 fidelity to the formalism (executed/checked semantics equal the formalism's: Petri, state machines, flows; by extension M1-to-M2 conformance and metaclass identity)
- SG-7 cost of the harness (human time and tokens spent on prompts, lanes, gates, logs, reports, round trips to Alfonso; lowering the cost helps)

#### What to produce

For every row of your chunk (each starts with a line `<<<ROW <id> (decisions.md:<lines>; section: ...)>>>`),
decide its contributions. Write ONE file, `/tmp/goal1725/part-<k>.json` (k given in your prompt), shaped:

{
  "reviewed": ["<every row id of the chunk, in order, including rows with no contribution>"],
  "contributions": [ {"req": "R-...", "softgoal": "SG-n", "kind": "...", "evidence": "...", "verified": "none", "why": "..."} ],
  "tradeoffs": [ {"a": "R-...", "b": "R-... or RC-... or D-UI-...", "softgoal": "SG-n", "why": "..."} ]
}

Write nothing else anywhere: never write in the repository, never run git commands that change state.

#### Rules (binding)

1. A contribution is recorded only when the row's text supports it (you may open a ratification memo or discovery
   report the row cites, when the row names an effect and you need its source; time-box that, it is optional).
   An empty row is better than an invented link. Expect many rows with none: implementation detail with no
   user-visible or engine-visible effect, bookkeeping, scope statements.
2. `kind` (GRL contribution scale), one per (req, softgoal):
   - `help` / `hurt`: the row clearly moves the softgoal toward / away from satisfaction, partially.
   - `some+` / `some-`: the direction is clear, the extent is small, indirect or conditional.
   - `make` / `break`: ONLY when the row by itself makes / breaks the softgoal. Expect almost none; the `why`
     must say why this one row suffices.
3. `evidence`:
   - `read`: the row's text (or its cited memo/discovery) states the effect on the softgoal's concern
     (e.g. «so the canvas does not jump», «visible only in Advanced», «saved projects stay valid, no migration»,
     «one undo step», «the guard stays pure», «the demo walks the dialog»).
   - `measured`: a probe, bench, test or measurement cited by the row measured THAT effect (not just
     something else about the row). E.g. «the four demo scenes 50/50 on the base and after» measures SG-3
     non-regression; «encodes byte for byte as before (tested)» measures SG-4.
   - `inferred`: the effect follows directly from what the row decides, but the text does not state it.
4. `verified`: always the string `"none"`.
5. `why`: one line, at most 220 characters, English; quote the row's own words in «...» (Italian is fine) or
   cite them, so a reader can find the support in the row. No speculation beyond the row.
6. Do not derive contributions from header metadata alone (`reversible: trunk|branch`, `provisional`,
   `unattended`, `verified: agent`): every recent row has them.
7. Product softgoals (SG-1..SG-6) come from what the row decides for the product or the engine. Process rules
   inside R- families (e.g. many R-RAIL rows from R-RAIL-19 on, R-DEAD method rows, R-LAY-7/10) usually touch
   SG-7 only, and only when the text speaks to cost: an added step, gate, document, commit or wait (hurt /
   some-), a removed one (help / some+), or a rule stated to stop rework measured in earlier lanes (help /
   some+, `read` or `measured` as the row supports).
8. SG-3 only when the row's text ties it to the demo, MODELS, the freeze, or a scene, or when the row builds a
   surface the demo script walks (the Simulation panel and pill, the roles dialog, Apply/Configure, the event
   buttons, the trace) before the freeze; a row dated after 2026-10-01 that does not say it enters the demo
   build does not help SG-3.
9. SG-5 and SG-6 concern the simulator and modeling semantics; do not stretch them to UI wiring. A row that
   resolves an ambiguity of the step semantics (an order, a priority, a tie-break, a purity constraint) is SG-5;
   one that aligns the executed semantics with the formalism (firing rule, inhibitor arcs, statechart
   priority, conformance) is SG-6. Both can hold.
10. `tradeoffs`: only when the row's text names a trade-off with ANOTHER row (by id), or explicitly gives up
    one softgoal for another row's sake. Evolution links (amends, supersedes, refines, renumbered, «emenda»,
    «sostituisce», «superata») are NOT trade-offs: leave them out.
11. Ids: use the row id exactly as in the `<<<ROW` line. One row id (R-STR-6) appears twice (forms A and B):
    list it once in `reviewed`, and judge both texts under the one id.

Before finishing, validate your file with node: it parses; every `contributions[].req` is in `reviewed`;
`kind` in make|help|some+|some-|hurt|break; `evidence` in measured|read|inferred; `verified` is "none";
`softgoal` in SG-1..SG-7; no duplicate (req, softgoal). Then reply with: the counts (rows reviewed, rows with
at least one contribution, contributions per softgoal and per kind), any `make`/`break` with its id, and any
row you found hard to judge (id plus one line). Keep the reply under 40 lines.
