# Harness effectiveness audit — 2026-11-05

## Hypothesis and scope

Request: «puoi verificare se le modifiche apportate all'harness di jjodel siano state efficaci?».
Hypothesis: the October harness interventions reduced oversized executor contexts and improved mechanical controls. Overall cost and product quality require separate evidence.
Read-only audit of operational code and archives at `6f1530d9c`; only this report and its log entry are added. No provider session, board, merge, push or operational change is launched. The implementation phase is not started.

## Findings

### 1. Oversized executor contexts fell substantially

Executed the current `frontend/scripts/lane-usage.mjs` reader, `laneUsage(id, new Map())`, over every directory matching `P-YYYY-MM-DD-HHmm` with `log.jsonl` in `/Users/alfonso/.jjodel-lanes` in two ID-date windows. Main assistant calls are deduplicated by message ID by that reader; context is ordinary input + cache read + cache creation. Interval metadata is deliberately omitted: no duration or overlap inference is made.

| Measure | Before: Oct 10–17 | After: Oct 19–Nov 5 |
|---|---:|---:|
| Directories with log.jsonl | 152 | 619 |
| Directories with measurable main calls | 99 | 478 |
| No measurable main calls, excluded | 53 | 141 |
| Reader exceptions / skipped JSON lines | 0 / 0 | 0 / 0 |
| Main calls | 8,322 | 26,480 |
| Median of each measured directory's peak context | 263,480 | 155,831 |
| Directories reaching at least 250k | 55/99 (55.6%) | 7/478 (1.5%) |
| Calls reaching at least 250k | 3,051/8,322 (36.7%) | 101/26,480 (0.38%) |
| Largest peak | 966,128 | 295,302 |
| Directories with at least two rate-limit readings | 98 | 364 |

The median peak falls about 40.9%. This is an observed association, not an isolated causal effect or a cost reduction estimate. Windows differ in length, task mix and number of resumes; directory IDs date prompts, not necessarily every call. Zero-call directories are not classified as zero-cost work. Oct 18, the rollout day, is excluded. Main-model presence: before Opus 94 / Sonnet 5; after Opus 445 / Sonnet 33 (counts of directories containing that model, not charges).

### 2. Mechanical controls execute and targeted tests pass

Fresh checks on this checkout:

- `check:agents`: exit 0, nine generated documents aligned.
- `check:triggers`: exit 0, eight entries.
- `check:docs`: exit 0, 5/5, **101 warnings**; 40 active entries, 1,843 archived entries, 633 entries in 119 inbox files.
- Focused Vitest: **244/244**, six files: `contextCeiling`, `criticalZone`, `outputBudget`, `ruleTrigger`, `agentModels`, `laneUsage`. Used `--configLoader runner` because the default loader writes through the node_modules symlink outside the writable checkout and fails EPERM.

Full hooks-suite verification was attempted, but board tests fail in this restricted environment. An independent minimal `net.createServer().listen(0, '127.0.0.1')` returns **EPERM**; these failures are not evidence of a board regression, nor is the full suite certified green. The broad run was interrupted (exit 130) after these failures; no classification of every failing test is claimed. No product build, full product test suite or browser smoke is claimed by this documentation-only audit.

On recheck after writing this audit, `check:docs` became **4/5, 102 warnings**: a concurrent new entry at `docs/log-inbox/hw-notation.md:1307` lacks `Corregge` and `Causa`. The gate identifies both missing fields. The foreign file was not edited. This also provides a live example that the gate discriminates a malformed entry rather than merely returning green.

Registration is real in `.claude/settings.json`: verbatim `"matcher": "*"` invokes `context-ceiling.mjs`; Edit/Write/NotebookEdit invoke critical-zone and rule-trigger; Bash invokes bash-guard and output-budget. This registers Claude Code hooks, not equivalent enforcement for Codex tools.

### 3. The context continuation work remains incomplete

`frontend/scripts/hooks/context-ceiling.mjs` declares `DEFAULT_SOFT = 200000` and `DEFAULT_HARD = 250000`. Its header explicitly states `It FAILS OPEN` when sources or hook inputs cannot be read. A soft stop allows subsequent calls below hard, and interactive sessions have no hard ceiling.

`frontend/scripts/lane-run.mjs:531` (`launch`) copies the environment but does not export `JJODEL_LANE_LOG`. A full-file search for both `JJODEL_LANE_LOG` and `--fresh` returned no matches (rg exit 1); the same search tool positively finds `function launch` at line 531. RC-51 in `docs/decisions.md:297` explicitly records that B8a has not landed and requires a new Prompt-ID continuation instead. The harness inbox also records a one-call transcript lag under `claude -p`. Therefore the observed improvement does not demonstrate complete enforcement or a working automatic fresh-session continuation.

### 4. Overall financial effectiveness is not established

Executed `architectOf(id)` independently over both complete directory sets: **none for all 152 before and all 619 after**. The missing architect side prevents a claim about total architect + executor savings. Rate-limit readings overlap other usage and are not per-task invoices. No USD/token conversion or subscription saving is inferred.

The existing independent observer's `tools/harness-observer/README.md` also warns: `A first observed snapshot is NOT proof of a fresh session`. Its accounting distinctions should be preserved in any financial follow-up. That observer was inspected, not rerun here.

### 5. Monitoring latency improved in recorded before/after experiments

`docs/log-inbox/harness.md:963` records the Oct 22 cache experiment verbatim: `8.7 s before, 8.5 s filling, 0.33 s hitting`; the merged-tree check at line 974 reports 0.31–0.63 s across 741 lanes. The board experiment at line 989 reports maximum event-loop stall 0.49 s after versus 6.6 s on a HEAD copy. These are historical measurements with commit references (`be184d551`, `ab4824a83`), **not measurements rerun today**.

## Assessment

Effective for limiting executor context and improving observability and mechanical consistency; incomplete for automated continuation and insufficiently measured for total cost, rework reduction or first-shot product correctness. A green documentation gate does not eliminate its warnings or validate the meaning of every self-reported log field.

Recommended next measurement: task-kind-matched before/after cohorts with accepted outcomes, rework, duration and complete architect accounting; separately close B8a and investigate the seven post-rollout directories above hard. No implementation is authorized by this report.

## Sources read and boundaries

All repository paths below are under `/Users/alfonso/jjodel-release/`:

- `AGENTS.md` supplied in the chat; `docs/PROTOCOL.md` (protocol clauses); `docs/decisions.md` (targeted RC-49–53 and related searches).
- `docs/claude-code-log.md` (first entries), `docs/HARNESS-DOCS.md` (gate descriptions).
- `docs/discovery/discovery_2026-10-18_harness_health_retrospective.md`; `docs/ratifiche/claude_2026-10-17_memo_harness_front_fable_trial.md`.
- `docs/log-inbox/harness.md`, `docs/log-inbox/harness-observer.md`; `docs/prompts/claude_2026-10-18_2220_prompt_harness_health_retrospective.md`.
- `frontend/package.json`, `frontend/vitest.config.ts`, `.claude/settings.json`.
- `frontend/scripts/lane-usage.mjs` (reader sections), `frontend/scripts/lane-run.mjs` (launch and whole-file symbol searches), `frontend/scripts/hooks/context-ceiling.mjs` (whole), `frontend/scripts/hooks/__tests__/laneBoard.test.ts` (listener setup).
- `tools/harness-observer/README.md` (identity/accounting contract).
- External archive: `/Users/alfonso/.jjodel-lanes/P-*/log.jsonl`, read by the current usage reader; architect state read separately. No transcript bodies are included in this report.

Some initial combined terminal reads were truncated; conclusions above use targeted reads, executed commands and complete counters, not the unseen portions of those outputs. Archives are mutable and were not frozen or independently reconciled in this audit. Unmatched task mix, incomplete architect accounting and the sandbox-limited broad suite are the principal uncertainties.
