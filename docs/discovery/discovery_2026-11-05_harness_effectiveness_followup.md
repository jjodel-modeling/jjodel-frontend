# Harness effectiveness: continuations, comparable cohorts and ceiling exceptions

Date: 2026-11-05. Request: «se sei in grado procedi», following the proposed comparison of similar tasks including restarts and corrections. This is a new read-only audit, not an implementation phase.

## Hypotheses and verdict

1. The reduction in context also corresponds to lower resource use on comparable work: **supported at the lane/category level**, not proved for fully accepted objectives.
2. The advantage disappears when continuations are counted: **not in the small harness cohorts examined**, although the advantage shrinks materially.
3. Product defects and human intervention decreased: **not established** by the available records.
4. Every directory exceeding 250k demonstrates a failed ceiling: **false**. Four contain actual denials and handoffs, one is a different repository, two have no recorded ceiling denial and need investigation.

The unit matters: a directory can include several invocations of one provider session; an objective can span several directories. A short context is not a complete cost or acceptance metric.

## Reproducible method and coverage

Artifacts:

- `docs/discovery/harness/audit_2026-11-05_effectiveness.mjs`: read-only analysis; emits metadata JSON to stdout, no network/provider/operational commands.
- `docs/discovery/harness/audit_2026-11-05_effectiveness.json`: committed snapshot, 772 archive directories (152 before, 620 after), their log hashes, matching decisions, aggregates and continuation candidates. No transcript bodies.

Command, from `/Users/alfonso/jjodel-release`:

```sh
node docs/discovery/harness/audit_2026-11-05_effectiveness.mjs /Users/alfonso/.jjodel-lanes > /tmp/jjodel-effectiveness-replay.json
```

Windows remain Oct 10–17 and Oct 19–Nov 5; Oct 18 is excluded. Windows use Prompt-ID dates, not the timestamp of every call. Independent reader/accounting: `tools/harness-observer/reader.mjs` and `accounting.mjs`, not the operational board's cost reader. Call deduplication is session/message based, including subagents in consumption. CLI cumulative counters are taken once per session rather than summed on resumes. Technical totals are admitted only when stream input reconciles exactly with CLI snapshots and identity/source checks pass. Output comes from CLI counters, not partial streamed output.

Measured main-call directories: 99 before / 479 after. Reconciled: 96 / 467. No archive read exceptions. No duplicated session/message observations across the directory set were detected. The one extra post directory compared with the first audit is present in this later mutable archive snapshot; old figures are not silently rewritten. Neither snapshot is an atomic archive freeze.

Same-model comparison excludes foreign-repository, merge, unknown-kind and duplicated-archive rows. It leaves 73 before / 399 after on main Opus. Matching then requires the same declared Front and Lane kind, at least five per period. Only two strata meet that requirement: **both on the harness front**. Consequently this is not a matched evaluation of product changes across all Jjodel fronts. Classification maps `phase2` to full; a declaration explicitly containing discovery/Phase 1 is discovery. Initial input resolves multi-document Prompt-IDs where available.

Seven Prompt-IDs occur in multiple prompt documents. Some are sequential phase documents; this is not proof of seven operational collisions. This ambiguity is retained in `duplicatePromptIds`, rather than selecting the last filename silently.

## Resource and runtime results

Technical tokens below mean input + cache read + cache creation + CLI output, including observed subagents. They are **not subscription charges**, nor proof that all historical session consumption was observed. Runtime is the sum of non-notification CLI `duration_ms` records, including resumes; it excludes waiting for people and is **not time to acceptance**.

| Matched lane category, main Opus | Before / after n | Median technical tokens before → after | Change | Median CLI runtime before → after |
|---|---:|---:|---:|---:|
| Harness fast | 5 / 6 | 7.94M → 3.74M | −52.9% | 8.74 → 8.24 min (−5.6%) |
| Harness full | 13 / 10 | 15.90M → 7.76M | −51.2% | 20.24 → 14.44 min (−28.6%) |

All rows of those two strata reconcile. Raw per-directory main-call context, all models, agrees with the original operational reader when rerun against this snapshot. In these cohorts model identity is controlled, but difficulty, deliverables and effort are not. Before-full includes research-paper/documentation work; after-full includes menu-bar app slices. A common front/category is a coarse match, not equivalent task complexity. No significance or causal estimate is claimed.

### Continuation sensitivity: a necessary correction

The script collects explicit continuation links from prompt headers/titles and matched task log descriptions. Ordinary dependencies alone do not form links. The 81 connected components are **candidates**, not certified semantic task IDs: planned slices and unplanned continuations can share a component, links may be absent, and roots can cross the observation boundary.

For the matched harness cohorts the relevant components were inspected against their prompt headers:

- Before, `P-2026-10-10-1330` + `1532`: lane-tracking discovery and the projection implementation. Other tracking slices exist; this component is not an exhaustive goal boundary.
- After, `P-2026-10-19-1125` + `1148`: settings/theme work, continued after the context ceiling. The continuation's Request also adds Quit, so scope is not perfectly fixed.
- After, `P-2026-10-19-1130` + `1157` + `1215`: two planned restyle slices and the second slice's ceiling continuation.

Expanding matched rows to those entire explicit components and counting each component once:

| Sensitivity view | Before / after groups | Median technical tokens | Median CLI runtime |
|---|---:|---:|---:|
| Harness fast | 5 / 6 | 7.94M → 3.74M (−52.9%) | 8.74 → 8.24 min |
| Harness full | 13 / 7 | 15.90M → 10.17M (**−36.0%**) | 20.24 → 15.72 min (**−22.3%**) |

The apparent full-lane saving shrinks from 51.2% to 36.0% when those continuations are included. It does not disappear in this sample. This remains a sensitivity analysis, **not a measured 36% saving per accepted feature**. Discovery, implementation, later fixes and integration are not completely joined into independent accepted objectives. The snapshots contain the exact included IDs so this limit is reviewable.

## Quality, rework and human effort

The fixed-seven-day follow-up exercise uses task entries with explicit `Corregge` links, starting only post tasks through Oct 29 so the full seven days fit before the cutoff. In the coarse same-model base, seven of 73 before roots have an explicit correction link within seven days; 26 of 208 mature after roots do. Of the after roots, six have a continuation-labelled link and 21 have another link (one root belongs to both). These are incomplete declarations, not defect incidence. They do not show a reliable reduction in defects.

Limitations observed in the source:

- `docs/log-inbox/hw-notation.md` records corrections that are actually ceiling continuations, e.g. `Corregge: 2026-11-03 07:03 (... continued after its context ceiling)`.
- `Status: eseguito` and agent `Outcome: done` differ markedly: 88 vs 38 before and 407 vs 289 after. They answer different lifecycle questions and are not interchangeable acceptance labels.
- A `question` outcome may be a design question, approval, missing information or a technical blocker. Counting it as one human intervention would invent equivalence and omit chat-side work.
- No complete architect accounting exists in the inspected archive windows, as established in the first audit. Git/CLI records cannot reconstruct that missing effort.

Therefore neither first-shot success nor elapsed time to user acceptance nor total human+agent productivity can be certified from these counters. Requiring a small, consistently recorded acceptance/defect record per objective would improve future evidence; this audit adds no operational requirement.

## The seven hard-threshold exceptions

Full log searches, not screenshots or remembered fixtures. A denial is a user tool-result message containing `context-ceiling:` with the exact soft/hard phrase. Counts are messages, not independent incidents. Source hashes are retained in `breaches`.

| Prompt-ID suffix | Peak context | Soft / hard denial messages | Handoff | Assessment |
|---|---:|---:|---|---|
| 10-19-0300 | 278,460 | 0 / 0 | no | Gallery/viewpoint lane: no recorded ceiling enforcement; cause unresolved |
| 10-19-0930 | 290,844 | 0 / 0 | no | Simulation active predicate lane: no recorded ceiling enforcement; cause unresolved |
| 10-20-0010 | 295,302 | 0 / 0 | no | Book chapter in another repository; exclude from Jjodel software enforcement claims |
| 10-20-0015 | 294,297 | 1 / 4 | yes | Actual hard blocks recorded; high peak alone is not evidence the hard block failed |
| 10-20-1830 | 257,220 | 1 / 2 | yes | Actual blocks and handoff, but multiple resumes of the same session |
| 10-20-2005 | 252,922 | 1 / 1 | yes | Actual blocks; continuation practice was inconsistent with fresh-session intent |
| 10-21-1145 | 260,627 | 1 / 2 | yes | Actual blocks and handoff |

Concrete distinction: the 10-20-0015 log records a soft denial at 200,172 and hard denials measuring 251,856, yet the stream peak reaches 294,297. The hook restricts tools; it does not prevent every further model call or the allowed handoff work. The first audit's fraction above hard was useful as an exposure measure, but must not be read as a hook-failure rate.

In 10-20-2005, `runs.jsonl` records a start and two resumes with the same session ID, at 20:05, 23:03 and 23:16. RC-51's interim rule says to use a new Prompt-ID/handoff after a ceiling stop. The latest status says it continued with P-2026-10-20-2330. The older-session resumes are visible, not inferred from a long duration. Two other breached lanes similarly contain several init events but only one distinct session. No current worktree configuration can prove which hooks were loaded in a historical invocation; absence of a denial is not proof of a particular root cause.

All seven observed exceptions date Oct 19–21. There are no further >=250k peaks in the later inspected Prompt-ID-date directories; this does not exclude calls stored elsewhere or outside the archive.

## Validation and remaining uncertainty

- Independent observer test command: `node --test tools/harness-observer/test/observer.test.mjs`: **25 passed, 1 skipped, 0 failed**. The skipped original-archive integration test is not claimed as executed.
- The audit itself executes assertions for median/classifier controls, cohort minimum size, population partition and unchanged breach-log hashes between reader and denial extraction. It completed without exceptions. This is not a mutation-tested product test suite.
- Two initial full audit runs had identical substantive aggregates, strata, correction links and components. Byte equality failed because a live zero-main-call directory `P-2026-11-05-2346` changed its source hash. The final snapshot records its own source fingerprint. No byte-identical/atomic-archive claim is made.
- No product sources or operational harness settings are modified. Product build/browser smoke are not measures of this offline analysis and were not rerun.
- Final `check:docs`: **4/5, 103 warnings**. The only blocking findings are the same foreign `docs/log-inbox/hw-notation.md:1307` entry already seen in the first audit, missing `Corregge` and `Causa`. Neither this entry nor other lanes were edited. Snapshot cross-checks (population, both reconciled cohorts and four hard-denial cases) pass; `git diff --check` is clean for tracked changes.

Follow-ups ranked by what this audit actually found: investigate the two Oct 19 missing-denial cases; implement the already-approved fresh-session continuation separately; record a stable objective ID, accepted outcome and subsequent defect/continuation distinction, plus architect usage. Those changes require their own implementation scope and are not performed here.

## Files read, dependencies and risks

All repository paths are rooted at `/Users/alfonso/jjodel-release/`: root instructions supplied in chat; `docs/PROTOCOL.md` as already read in this session; current `docs/decisions.md` RC-49–52; first entries of `docs/claude-code-log.md`; previous `docs/discovery/discovery_2026-11-05_harness_effectiveness_audit.md` and its inbox; `frontend/scripts/lane-usage.mjs` (reader, interval and output semantics); `tools/harness-observer/reader.mjs`, `accounting.mjs`, `providers/claude-stream.mjs`, `cli.mjs`, README and its tests. All prompt files in the two windows and active/archive/inbox log blocks were parsed by the audit; explicit tracking/monitor/restyle headers were inspected manually. `/Users/alfonso/.jjodel-lanes/P-*/` sources are enumerated and hashed by the independent reader's allowlist; only metadata is exported.

Initial broad terminal listings sometimes truncated; findings rely on complete programmatic counts, saved JSON and targeted source reads. Risks: mutable archive, reused prompt IDs, current status differing from launch state, declarations instead of user acceptance, incomplete goal linkage, coarse task matching, and missing architect effort. The previous audit is preserved unchanged.
