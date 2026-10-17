# Lean context and model routing (Sonnet / Opus / Haiku): Phase 1 discovery

Prompt-ID: P-2026-10-15-1725
Chat: C-2026-10-15-1724
Front: harness
Lane: full (RC-3: normative documents, interfaces consumed by board and tests, more than three files in Phase 2)
Status: eseguito 2026-10-16 · lane harness · 0dd7ed3b5 · hard-stop, Phase 1 report; RC-26 ratification in §7 and RC-49

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else: `pwd`, branch, `git log -1` and `git status`. If the branch differs, stop with `Outcome: blocked`. If `git status` shows uncommitted changes, do not touch them: list them in the report (§1) and say whether any of them is on a file that Phase 2 would modify (`CLAUDE.md` in particular; at launch time `CLAUDE.md` carries an uncommitted change of 13 insertions and 3 deletions that is not this lane's). Phase 1 is read-only, so a dirty tree does not stop it.

Model and tier: heavy, Opus 5.5 as pinned in `.claude/settings.json` (RC-16, RC-32), effort xhigh. This lane is not eligible for the RC-45 draw (`Lane: full`, discovery) and is launched with `--tier heavy`. If `lane-run` nonetheless prints a `draw:` line assigning a tier to this lane, stop with `Outcome: question` before any work: a lane that designs the routing must not become a sample of the routing experiment. Effort is high on purpose; the token discipline is in the method, not in the model: aggregates through scripts, never whole files or transcripts in the context (§2, NON FARE).

## Lane discipline
Every reply of this session opens with `[P-2026-10-15-1725 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Time limit: 90 minutes (RC-20). Priority order if time runs short: §1 and §2 complete first, then §3, then §4. At 75 minutes, write the report with what you have and mark the missing parts as not measured. The plan may be partial; the baseline may not, because a plan without a baseline cannot be evaluated.

## Goal

Evolve the Jjodel harness towards:

- Sonnet 5.5 as the ordinary coder;
- Opus 5.5 for high-risk work and escalation;
- Haiku 5.5 for reporting and mechanical operations;
- a smaller initial context and fewer intermediate outputs;
- the same architectural constraints, the same gates and the same quality of verification.

Savings are a result to measure. Do not claim quality parity or percentage reductions without evidence.

This prompt covers Phase 1 only. Phase 2 needs Alfonso's approval of the plan, the scope and the amendments, and its prompt is written by the project chat from your report, not by this session.

## Context (do not redo the analysis)

These already exist and must be read, not rebuilt: `.claude/settings.json`, `frontend/scripts/lane-run.mjs`, `CLAUDE.md` and the generated `AGENTS.md` (root and `frontend/src/jjtl/AGENTS.md`), local instructions in subfolders, `docs/PROTOCOL.md`, `docs/decisions.md`, `docs/HARNESS-DOCS.md`, the hooks in `frontend/scripts/hooks/`, the skills in `.claude/skills/` (`log-entry`, `discovery-report`, `status-flip`).

Previous prompt on the same theme: `docs/prompts/claude_2026-10-13_1930_prompt_token_economy_harness.md`. Its `Status` line alone does not prove what was or was not done: check implementations, tests and commits, and report the real state.

Decisions to read with their later amendments: RC-16, RC-19, RC-26, RC-32, RC-36, RC-45, RC-46, RC-47. RC-32 already routes by activity; RC-45 already runs a randomised experiment. Do not duplicate either.

## COSA

### 1. Current behaviour

With `file:line` references, establish:

- which instructions enter the context automatically, and their size in tokens;
- which documents are read by obligation at session start;
- how `lane-run` selects the model on `start` and on `resume`, and which overrides can change it;
- how effective model, effort and usage are recorded;
- which mechanisms govern scope, critical zone, commits and output (hooks, deny list, skills, prose);
- which token-economy optimisations are already implemented (from the 2026-10-13 prompt and elsewhere);
- which consumers depend on the current tier interface (heavy/light): board, automations, tests.

Token measurement. There is no official local tokenizer for the 5.5 models. Use the `count_tokens` API endpoint only if it is reachable without new credentials and outside the probe budget of §3; otherwise use characters divided by 4 as a declared estimate, and calibrate the ratio on the `usage` fields of the transcripts (input tokens of the first call of a session against the byte size of the files that call loads). State which method each figure comes from.

Establish the state of the RC-45 experiment from the real data. Do not touch assignments, ledger or collected results.

### 2. Baseline

Sample: the last 20 closed lanes, or the last 14 days if fewer than 20 lanes closed in that window. Use local transcripts and measurements already available; do not export them, and do not read whole transcripts into the context: extract with scripts and read only the aggregates.

For the sample, separate:

- uncached input; cache read; cache write;
- output, and reasoning where available;
- tool output;
- number of calls and retries;
- rework (`Corregge` chains), escalations, gate outcomes;
- estimated API cost and plan consumption, where observable.

Plan consumption: if it is not observable, write «not measured». Do not derive it from the API cost estimate.

Do not sum overlapping categories. State period, sample size, missing data and method. Name the three largest real consumers before proposing any optimisation, each as a share of a declared denominator (uncached input plus cache read plus cache write, unless you justify another), with the same denominator for all three.

### 3. Models and runtime

Verify the Claude Code version, the provider and the effective support for `claude-sonnet-5-5`, `claude-opus-5-5`, `claude-haiku-5-5`.

Use official documentation first. Probe budget: at most one minimal call per model (a prompt of a few tokens asking for a fixed one-word reply), three calls in total. Nothing beyond that; if more is needed, propose it in the plan.

Do not rely on floating aliases as proof of the version. Do not silently replace an unavailable model. A sentence in a prompt does not change the model: routing must go through mechanisms the runtime actually supports, and the effective model must be observable in the record.

Verify whether a model change on `resume` is supported, or whether escalation needs a new session.

### 4. Implementation plan

Write the report at `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` (P4 content, plus the sections below). The hard stop is not reached until this file exists and is committed (docs-only commit, pathspec on the file).

The report contains:

1. baseline and the main sources of waste;
2. the minimal architecture proposed;
3. a table of the rules preserved, with their current and future location and the trigger that loads each moved rule;
4. the decisions to amend, with the proposed text, marked as RC-26 items for Alfonso;
5. the exact list of files to modify or create (the DOVE of Phase 2);
6. batches of at most five files each, with the batches that touch `.claude/` marked as needing an interactive session (protected path, RC-19, RC-36);
7. tests and acceptance criteria;
8. rollback;
9. open questions, each with `Recommended:`.

Do not write the Phase 2 prompt.

## Design constraints for the Phase 2 proposal

### A. Lean context

Reduce the initial context while keeping: universal invariants; scope and preservation rules; triggers that load specialist rules; authorisations and hard stops; verification commands; pointers to the relevant decisions.

Indicative target for the root document: 1,500 to 2,500 tokens, only if compatible with full rule coverage. Never drop a rule to meet the number.

Move historical rationale and long examples into references loaded on demand; keep evidence and archive reachable. For every moved rule, show that its trigger makes it available before the action it governs. An instruction like "read the relevant document" is not a sufficient guarantee: prefer mechanical triggers (hook on path, skill invoked by the runner, local `CLAUDE.md` in the subtree). Do not rely on the current directory alone: consider every file declared in the lane and every file discovered during it.

### B. Selective documentation

One canonical normative source stays canonical.

Propose a deterministic index of decisions with at least: ID, status, scope or path, one-line operational summary, source, superseding or related decisions. Retrieval must include dependencies and applicable amendments. If the index is missing, stale or ambiguous, the fallback is the canonical text, or a reported error; never a guess.

For the log, propose reads by file, front and Prompt-ID. Replacing the mandatory read of the latest entries needs an explicit amendment, listed in §4.4.

Logs under the add-only check are preserved in full. History is never rewritten to shrink the context.

`AGENTS.md` stays generated from its source (`npm run gen:agents`, `npm run check:agents` on all generated files).

### C. Model routing

Extend the existing mechanism (RC-32, `lane-run`); do not add a second orchestrator.

Proposed policy for new lanes, after the amendments are approved:

| Activity | Model |
|---|---|
| Ordinary implementation with clear scope and acceptance | Sonnet 5.5 |
| Critical zone, migrations, cross-layer invariants, ambiguous architectural choices | Opus 5.5 |
| Data extraction, classification, report formatting, deterministic operations | Haiku 5.5 |

Keep the heavy/light contract consumed by other components, or propose an explicit, tested migration.

RC-45 is separate: lanes already assigned keep their assignment. Propose how the new routing coexists with the experiment, or how to amend its rule prospectively; never stop it implicitly.

Do not open a Haiku session for trivial operations: counts, format checks and deterministic transforms go to the existing scripts.

No change to the user's global settings. Model IDs live in one authoritative place, compatible with the current pin.

### D. Escalation

Verifiable triggers, for example: a critical-zone file enters the diff; a migration turns out to be needed; an unplanned cross-layer propagation; a persistent failure attributable to the implementation after one corrective attempt; an architectural choice beyond the lane contract.

An environmental error or a pre-existing failing test does not justify Opus by itself.

Escalation changes the model's capability, never the lane's authorisations.

At most one automatic Sonnet to Opus escalation per ordinary lane; beyond that, return the block with evidence (`Outcome: blocked`). Experimental lanes follow only the policy approved for RC-45.

Record previous model, next model, reason, phase, available usage and outcome, and keep the genealogy of lane and rework. If the runtime cannot change model on `resume`, propose a compact checkpoint for the new session: task, scope, decisions, evidence, current diff, remaining checks.

### E. Reporting with Haiku

The coder produces structured evidence; Haiku may turn it into readable reports. Preserved at minimum: real outcome and incomplete work; files and commits; commands with exit codes; comparison with the baseline; regressions and uncertainty; visual checks and mutation bench; decisions and authorisations; escalations and corrections.

Haiku does not certify code correctness and never turns a partial result into a completed one.

The log entry format is the §21.2 block, verified byte for byte by `npm run check:docs`, and the `log-entry` skill already reads it live. Haiku's output must pass `check:docs`; on failure the fallback is the `log-entry` skill with the original data, not a new template. Do not create a second copy of the format.

### F. Output and verification

Reuse existing quiet runners and hooks. Full logs stay out of the ordinary context; the context shows a summary with exit code, new errors and the path to the evidence. Detail stays reachable for diagnosis.

Targeted checks during iterations; all final gates required by the repository at the end. Build, typecheck, smoke, visual check and mutation bench are never removed to meet a budget.

## Acceptance and measurement (to be planned, not run)

The plan provides:

- tests of routing and its overrides; of `start`, `resume` and escalation; of the effective model recorded;
- tests of the document triggers, including negative cases (a rule must not load where it does not apply, and must load where it does);
- tests for incomplete reports, missing usage and unavailable model;
- proof that critical controls and already-started lanes are preserved;
- separate measurement of the document effect and of the model effect: first current harness against lean harness on the same model, then models against each other on the same harness;
- historical tasks with executable acceptance criteria as the benchmark. A handful of successful runs is not proof of equivalence: report quality, violations, rework, cost and the limits of the sample.

The Phase 2 result includes a rollback applicable without rewriting logs or losing running lanes.

## HARD STOP

After the report is committed. Close with `Outcome: question`. The question asks Alfonso to approve the plan, the Phase 2 scope (file list) and the amendments listed in §4.4, and carries `Recommended:`.

## NON FARE

- No change to configuration, runner, hooks, skills or normative documents in this phase. The only file written is the report.
- No change to Jjodel's application behaviour.
- No new dependency, no global environment change.
- No gate reduced to save tokens.
- No merge, no push, no benchmark launched beyond the probe budget of §3.
- No touch to RC-45 assignments, ledger or results.
- No reading of whole transcripts or whole log files into the context.
- Respect lane ownership and concurrent changes: staging by explicit path only. The uncommitted change on `CLAUDE.md` is not yours.

## RIFERIMENTI

`docs/PROTOCOL.md` (P4, P9, P13, P14, P16); `docs/HARNESS-DOCS.md` §4, §6, §7; `docs/decisions.md` (RC-16, RC-19, RC-20, RC-21, RC-25, RC-26, RC-32, RC-36, RC-44, RC-45, RC-46, RC-47); `CLAUDE.md` §3.2, §17, §21; `docs/prompts/claude_2026-10-13_1930_prompt_token_economy_harness.md`.
