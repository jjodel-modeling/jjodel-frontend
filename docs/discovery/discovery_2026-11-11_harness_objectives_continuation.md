# Harness objectives and fresh-session continuation

Date: 2026-11-11. Direct chat request: Alfonso's «ok» to prioritising objective-level measurement and fresh-session continuation. Discovery identifier: P-2026-11-11-1100 (no prompt file or lane/provider launch). Executor: OpenAI GPT-6, Codex; provider session ID unavailable.

Tree inspected: `/Users/alfonso/jjodel-release`, HEAD `1af0dfdf676194e9bba380aad2ecbcacd0863f96`. Report branch: `codex/harness-objectives-continuation`, isolated worktree `/tmp/jjodel-harness-objectives-continuation`, same starting HEAD.

This report is a set of hypotheses with evidence. It closes read-only discovery; operational implementation awaits approval of the file scope below (12 files including these two documentation artifacts). No product code, live lane, archive, model, effort, threshold, governance file or board state was changed.

## 0. Answer in brief

Implement the two requested improvements together, but first make every consumer understand multiple distinct sessions in one lane. Merely adding a fresh launch silently understates usage and can reuse the previous session's context reading.

The existing RC-51 design specifies a fresh session under the same Prompt-ID. Keep that contract. Add an explicit objective ID above Prompt-IDs so planned phases, context continuations and defect corrections have different relationships. Acceptance must have explicit evidence; `Outcome: done` is not acceptance.

Automatic continuation must be opt-in, bounded and limited to an identified context-ceiling stop with a valid handoff. Never treat any `hard-stop` as permission to continue. The first delivery should expose a one-continuation option on `wait`; it must not launch extra work when merely viewing board/status. No change to model, effort or thresholds.

## 1. Hypotheses and findings

### H1. A fresh launch can be implemented only in lane-run: falsified

Read at `frontend/scripts/lane-run.mjs:1384`:

> `['-p', '--resume', session, ...FLAGS`

Current resume deliberately reuses the recorded session. RC-51 and the original design (`docs/discovery/discovery_2026-10-15_lean_context_model_routing.md:688`) explicitly specify a new session in the same lane directory:

> **`lane-run resume --fresh <Prompt-ID>`** starts a new `claude -p` session, without `--resume`, in the same lane folder and under the same Prompt-ID.

Read at `frontend/scripts/lane-usage.mjs:115`:

> `Object.entries(results[results.length - 1].modelUsage)`

Measured by executing `laneUsage` with a temporary synthetic log containing two distinct sessions with output counters 10 and 20: output reported **20**, expected **30**. This is a compatibility defect for the proposed new input shape, not evidence that today's single-session lanes are broken.

Consumers verified: `frontend/scripts/lane-board/lane-board.mjs:741` sums `u.resultOutput`; the CLI also prints it at `lane-usage.mjs:270` and `:308`. The output is load-bearing.

Read at `frontend/scripts/lane-board/lane-board.mjs:818`:

> `Math.max(out.max, e.total_cost_usd)`

Read at `:909-910`: Insights likewise takes maximum cumulative cost and output. These need per-session accounting too. A reset cannot be identified solely by a falling counter: a new session may already have a higher total. Cache versioning and daily-spend calculations must be checked with the same fixtures.

### H2. Exporting the combined lane log is sufficient for ceiling measurement: falsified

Read at `frontend/scripts/hooks/context-ceiling.mjs:83`, `latestContext(text)` scans backward for the latest qualifying assistant event without a session constraint.

Measured: old session assistant context **250001**, old result, then new session `init` with no assistant call yet. `latestContext` returns **250001**. New-session context should be unknown at that point, not inherited. This reproduces the reader behavior; it does not assert the exact provider hook timing in a live launch.

Read at `frontend/scripts/lane-run.mjs:535`: launch builds `env` from `process.env`; this function does not set its lane log path. The new launch path must identify the active session/run when exposing the log. Keep the documented fail-open behavior for unavailable measurements, with explicit availability in reporting.

### H3. Existing outcome and architect fields already measure accepted objectives: falsified

Read at `frontend/scripts/lane-usage.mjs:162`, `architectOf(id)` reads a lane-local `architect.json`; absent data produces `state: 'none'`. This is reusable, but absence is not zero and overlapping architect intervals must not be added as independent work.

The November 5 audit, `docs/discovery/discovery_2026-11-05_harness_effectiveness_followup.md:65-76`, documents mixed defect/continuation links and incompatible completion labels. Its conclusion is:

> `neither first-shot success nor elapsed time to user acceptance nor total human+agent productivity can be certified from these counters`

Proposed additive metadata below addresses future work. Do not reconstruct old acceptance labels or invent missing architect consumption.

## 2. Proposed behavior

### Objective measurement

- Add an explicit, stable objective ID, separate from Prompt-ID and provider session ID. Store versioned lane metadata and append-only objective events under the configured lane root, not in product Redux or `docs/goals/` (the latter models requirements).
- Link each lane explicitly as discovery, implementation, continuation or correction. A continuation retains its objective. Reject cycles and conflicting relinks. Do not infer objective identity from `Depends:` alone.
- Record acceptance/reopening as explicit events with timestamp, actor and evidence reference. Provider `done` does not create acceptance. A correction records its target and reason; context exhaustion is a continuation, not a defect.
- Extend the usage CLI with an objective aggregate: component lanes/sessions, observed technical consumption, runtime, acceptance state and coverage. Preserve legacy lane output. Unknown output or architect coverage stays unknown/partial, never zero.
- Deduplicate by session plus message identity. Take the final cumulative result per distinct session, not per resume and not the maximum across unrelated sessions. Cross-lane duplicate sessions must be detected rather than summed twice. Preserve existing architect input; require provenance and non-overlap before any complete architect total is claimed.

### Continuation

- Implement the RC-51 `resume --fresh <Prompt-ID>` path. Preserve old input/log/run history and record the old session before replacing the current pointer. Keep tier, effective model, effort, worktree, automatic-lane restrictions and existing authorization scope. Refuse when required identity/model evidence is unavailable rather than silently changing routing.
- Validate the six handoff sections and bind the handoff to the stopped session, worktree and code state. Cite full diff by path; do not replay the full transcript or automatically apply patches. Preserve staged, unstaged and untracked work. Record missing semantic decisions as unknown in a mechanical handoff; an incomplete fallback cannot enable unattended continuation.
- Identify a context stop using session-bound evidence plus the current run outcome. A generic hard stop, approval request, provider quota, failure, incomplete handoff or running process is not eligible.
- Proposed opt-in `wait --continue-on-ceiling`: at most one fresh continuation per invocation, preserving the existing per-launch time limit; a second ceiling returns control. Reserve the transition atomically so concurrent waiters cannot double-launch. Read-only status and board polling never continue work.
- Plain resume of an exhausted session directs the caller to fresh continuation. Context reads must be scoped to the active session/run, including the gap before its first event. Tests must cover a launch that fails before reporting a new session ID.
- Multi-slice `next`/AM-9 scheduling remains a separately scoped part of B8a. This delivery must not claim all of B8a is complete.

## 3. Exact implementation scope proposed for approval

Paths relative to `/tmp/jjodel-harness-objectives-continuation`:

| File | Change |
|---|---|
| `frontend/scripts/lane-run.mjs` | Fresh launch, preserved lineage and execution settings, bounded opt-in continuation, objective attachment |
| `frontend/scripts/hooks/context-ceiling.mjs` | Active-session measurement and identifiable ceiling-stop evidence |
| `frontend/scripts/lane-usage.mjs` | Per-session accounting and objective aggregation with coverage |
| `frontend/scripts/lane-board/lane-board.mjs` | Correct multi-session cost/output/day/Insights consumers and invalidate affected caches; no layout change |
| `frontend/scripts/lane-objective.mjs` (new) | Small metadata/event module and explicit acceptance/reopening commands |
| `frontend/scripts/hooks/__tests__/laneRun.test.ts` | Fresh-session lifecycle, ordinary resume preservation, refusals, bounded/concurrent continuation |
| `frontend/scripts/hooks/__tests__/contextCeiling.test.ts` | New-session boundary, missing measurement and session-bound stop cases |
| `frontend/scripts/hooks/__tests__/laneUsage.test.ts` | Multiple sessions, resumes, missing counters and objective aggregates |
| `frontend/scripts/hooks/__tests__/laneBoard.test.ts` | Multi-session costs, daily totals, Insights and cache behavior |
| `frontend/scripts/hooks/__tests__/laneObjective.test.ts` (new) | Objective links, explicit acceptance, reopening, deduplication and incomplete coverage |
| `docs/discovery/discovery_2026-11-11_harness_objectives_continuation.md` | This discovery and later dated implementation evidence |
| `docs/log-inbox/harness-objectives-continuation.md` (new) | Phase records, kept separate from code commits |

No new dependency. No production frontend/model/sync change. This is 12 files total, 10 implementation/test files beyond the two discovery documents: approval required under root AGENTS.md rule 19. If implementation needs another consumer or a governance amendment, report that scope before editing it.

## 4. Validation and acceptance

Executed on inspected HEAD:

- `vitest run --configLoader runner scripts/hooks/__tests__/contextCeiling.test.ts scripts/hooks/__tests__/laneUsage.test.ts`, from `frontend`: **50 passed, 2 files, exit 0**.
- Synthetic reader bench described in H1/H2: **20 instead of 30 output; 250001 stale context before the new session's first call**, process exit 0. Temporary fixture removed. No real provider invoked.
- An initial test command used the repository root instead of `frontend` and exited 127; the corrected run above is the validation result. Two exploratory reads used stale/guessed paths (`frontend/vitest.hooks.config.ts`, `frontend/scripts/lane-board.mjs`); actual paths were discovered with `rg --files`, then read. No conclusion relies on those failed reads. Large truncated outputs were followed by targeted reads for the findings above.

Implementation acceptance: a synthetic objective spanning discovery, implementation and a ceiling continuation has one objective ID, separate provider sessions, exact reconciled totals and explicit acceptance evidence. A subsequent correction reopens it without deleting history. Two waiters start at most one fresh session. A question/approval hard stop launches none. New-session context never uses the prior session's call. Existing ordinary resume remains unchanged below the ceiling.

Required implementation checks: focused behavior tests with counterexample fixtures (and mutation checks for dropped session boundaries/double-counted resumes); script typecheck/check:scripts; product typecheck/build; relevant board tests and data-path smoke. No product build or visual smoke is claimed in this read-only phase.

## 5. Sources and boundaries

All source paths above were read under `/Users/alfonso/jjodel-release`. Additional reads: root `AGENTS.md` and the opening rules of `CLAUDE.md`; `docs/PROTOCOL.md` P4/P6/P9/P13/P14; `docs/decisions.md` RC-49 through RC-53; first task/ticket entries of `docs/claude-code-log.md`; `docs/log-inbox/harness.md` B8a/ceiling entries; `frontend/vitest.config.ts`, `frontend/package.json`; `tools/harness-observer/accounting.mjs`; `.claude/skills/discovery-report/SKILL.md` and `.claude/skills/log-entry/SKILL.md`. Reads of long files are targeted windows, not a claim of whole-file review.

No live archive was modified or new financial benchmark performed. The temporary synthetic bench establishes compatibility requirements, not expected financial savings. Existing observer code is a reference for accounting, not an automatic new dependency of the operational board. Acceptance evidence and architect data cannot be fabricated by automation.

## 6. Decision requested

1. Approve the 12-file scope in section 3 and the bounded opt-in continuation contract in section 2, so implementation can follow this discovery.

## 7. Implementation addendum — 2026-11-11

Alfonso approved the exact scope with «si» and subsequently instructed «prosegui». Implemented in `746c5a996`; the scope remains the 12 files above. Governance, model routing, thresholds, product components and dependencies were not edited. The `codex/harness-objectives-continuation` branch was aligned with trunk `1f6829e18`; its only intervening change is another activity's prompt document. The frontend tree after alignment is identical to the tested implementation.

### Delivered behavior and commands

- `lane-run start` optionally attaches an explicit objective via `--objective <ID>` (or `Objective:` in the prompt header), with `--objective-kind discovery|implementation`. Existing lanes remain unlinked unless explicitly attached. Link/accept/reopen/show commands are also exposed through `lane-run objective` and the standalone module.
- Objective events are append-only, versioned and serialized under `_objectives/events.jsonl` in the configured lane root. A lane cannot be relinked to another objective; parents must already belong to that objective, so immutable links cannot create cycles. Correction links require a reason and explicitly reopen an accepted objective. Neither `done` nor a commit creates acceptance.
- `lane-usage --objective` returns lane/session membership, technical consumption, invocation runtime, acceptance evidence and coverage issues. Inputs must reconcile with final CLI counters. Missing data, duplicated sessions across lanes and unreadable events prevent a complete total. Architect accounting requires source provenance, a valid interval and nonnegative counters; overlapping intervals of the same chat are not summed into a complete total. The existing lane reader and board retain their legacy single-session behavior; new multi-session output/cost/Insights readers and their caches are updated.
- The runner exports the lane log and the current invocation's byte offset. The ceiling hook reads only the matching session in that range and records session/run-bound evidence in `ceiling-stop.json`. New-session startup cannot inherit the old context. A plain resume above soft is refused.
- `lane-run handoff <Prompt-ID>` validates the six sections and seals the handoff, diff, original prompt, authorization and worktree fingerprint. The fingerprint includes HEAD, staged/unstaged differences and untracked file contents. No patch is applied. Missing handoffs get an explicitly incomplete mechanical recovery note that cannot restart unattended.
- `lane-run resume --fresh <Prompt-ID>` creates a different provider session from the original task plus the handoff, preserving effective model, tier, effort and automatic-lane restrictions. Old input and run records remain. Failed startup keeps the old pointer and a pending record, refuses plain resume and supports an explicit fresh retry after inspection. It never interprets a question or an unrelated hard stop as a context continuation.
- `lane-run wait <Prompt-ID> --continue-on-ceiling` opts into at most one eligible fresh launch during that wait invocation. It holds a transition lock through launch and verifies the session observed by that caller. Two waiters cannot launch twice. Status/board polling never launches work. `wait` retains its existing bounded polling window; a timeout requires another explicit wait, not a persistent background daemon.

Examples (placeholders below are illustrative; no live lane was launched during implementation):

```sh
node frontend/scripts/lane-run.mjs start <worktree> <prompt-file> --objective feature-example
node frontend/scripts/lane-objective.mjs link feature-example <Prompt-ID> --kind discovery --by operator --evidence <report-reference>
node frontend/scripts/lane-objective.mjs link feature-example <correction-Prompt-ID> --kind correction --parent <original-Prompt-ID> --reason <defect> --by operator --evidence <reproduction-reference>
node frontend/scripts/lane-objective.mjs accept feature-example --by operator --evidence <acceptance-reference>
node frontend/scripts/lane-usage.mjs --objective feature-example --json
node frontend/scripts/lane-run.mjs handoff <Prompt-ID>
node frontend/scripts/lane-run.mjs resume --fresh <Prompt-ID>
node frontend/scripts/lane-run.mjs wait <Prompt-ID> --continue-on-ceiling --max 170
```

The acceptance command records supplied evidence; it does not independently certify it. The architect's existing `architect.json` is never generated from guessed consumption. Future complete architect totals additionally need `source` and `launch.at`/`close.at` (epoch milliseconds or parseable timestamps).

For unattended continuation the handoff must declare `Continuation: context-ceiling`, meaning the remaining work needs no new approval. If no seal exists, automatic sealing additionally requires `Session: <current provider ID>`, `Head: <current commit>`, optional `Base: <diff base>` (defaults to HEAD), a matching `git diff --binary <base>` and no untracked files. Otherwise an operator must inspect and seal it explicitly. Stale seals, unknown mechanical placeholders, changed authorization and runs reaching the existing 90-minute limit stop the automatic path. These are checks on recorded evidence, not a substitute for the original task's authorization constraints.

### Validation evidence

- Main area: **307/307 tests** in `laneRun`, `laneBoard`, `laneUsage`, `contextCeiling`, `laneObjective`, with actual child processes and local API fixtures (exit 0).
- Connected paths: **57/57 tests** in `laneRunRouting`, `laneRunDirect`, `laneBoardInsights` (exit 0).
- Final incremental guard: **8/8 fresh-continuation tests** after adding the incomplete-mechanical-handoff refusal and ensuring fixture logs end with a newline (exit 0). Seven overlap the main run; one is additional. The tests include two actual concurrent wait processes, startup failure and retry, worktree/handoff drift, explicit approval stops, automatic sealing and the one-continuation limit.
- Mutation bench: **3/3 deliberately broken variants detected**, each exiting 1 with its intended assertion failure: (1) output from only the last session; (2) context reader ignoring session identity; (3) repeated automatic continuations using the current session instead of the original observed session and the one-shot guard. Mutations ran in separate temporary copies and were never applied to the working tree.
- `npm run typecheck`, `npm run typecheck:scripts`, `npm run check:scripts`, JavaScript syntax checks and `git diff --check`: exit 0.
- `npm run check:docs` on the aligned tree and both documentation updates: **5/5, exit 0, 124 warnings**. The warnings are not presented as a zero-warning result.
- `npm run build -- --configLoader runner`: exit 0, production build completed in 57.39 s with the chunk-size warning. The plain build attempt failed because Vite's bundled config loader writes through the shared node_modules symlink; the runner loader avoids that external write. No package/configuration change was required.
- The first unrestricted area run identified three compatibility failures; they were fixed (legacy running subtotal and missing-session refusal wording) before the passing 307-test run. An earlier restricted run could not open local test servers and was interrupted, exit 130; it is not counted as a passing run. One subsequent authorization-review attempt did not execute because the review service hit a usage limit; after Alfonso's «prosegui» the full local-server run was approved and passed.
- Product UI was not changed or visually smoke-tested. The dashboard's numeric paths were exercised through its real local API fixtures and rendering assertions; no live provider, live archive or subscription charge was used as a test fixture.

AM-9/multi-slice `next`, inferred historical objective identity, automatic architect capture, permanent restart supervision and new financial savings estimates remain outside this delivery. This implements the approved two priorities without claiming that every historical B8a item is finished.
