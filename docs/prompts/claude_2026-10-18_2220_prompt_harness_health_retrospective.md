# Harness health signals: catalogue and retrospective backtest (discovery)

Prompt-ID: P-2026-10-18-2220
Chat: C-2026-10-18-2220
Front: harness
Lane: full (discovery, read-only on product and governance; heavy by rule, not drawn)
Status: eseguito 2026-10-18 · lane health-disc · hard-stop, Phase 1 report
Depends: P-2026-10-18-2207
Corregge: —
Request: Alfonso, 2026-10-18 21:58-22:15, in the project chat: an indicator of the harness's instantaneous health and its trend over time, able to warn before problems like past ones; a retrospective analysis; «lancialo pure» at 22:15

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 does not apply, no UI.

Worktree: `~/jjodel-w-health`, branch `health-disc`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high` (AM-7).

## Lane discipline
Every reply opens with `[P-2026-10-18-2220 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes (RC-20). Context ceiling RC-51 applies: at soft, write the handoff and stop. Output discipline (CLAUDE.md §0.1): read the log, its archive and `docs/decisions.md` with `offset`/`limit` or through scripts, never whole. If time or context runs short, priority is: step 1 committed, then signals S1 to S4 of step 3, then the rest; anything not reached is named in §Open questions of the report.

This is Phase 1 only. It ends with a hard stop: `Outcome: hard-stop`.

## Context (do not redo the analysis)
Alfonso wants to know the harness's health now and its trend, to act before problems repeat. Decided with him in chat: no composite index. The instantaneous state is the **worst** signal (green, yellow, red, plus the name of the signal that set it), the trend is per signal on a rolling 4-week window, with regime changes marked on the axis (RC rows, model changes Sonnet 5 → Opus 5 → Opus 5.5, AM batches, RC-20 orchestration from 2026-09-26, log format changes). A signal enters the catalogue only if, recomputed on history, it would have fired **before** at least one known incident and does not fire continuously in quiet periods. Same dataset as the CAIN 2027 paper: everything must be reproducible from versioned scripts.

Prior material: section «chat C-2026-10-18-1750», point 5, of the KB checkpoint (summarised here): first-call context is not pure harness weight (it includes the prompt and the AM-5 injection, 7 to 12 KB per lane), so split the cached prefix (CLAUDE.md, rules, agents) from the per-lane part; stratify by kind (fast/full, Phase 1/Phase 2, merge session) and by model/tier, because RC-45 draws moved Sonnet lanes into wk42; `Stop:` needs three values (planned, ceiling, unplanned); resumes per lane must count only fix requests (`inputClass` of `input-k.md`), not planned GOs; weekly n per kind is small (wk42 n=35). Existing script: `~/.jjodel-lanes/board/scratch/drift-2026-10-18.py` (373 lanes, wk39 to wk42). Existing reader: `frontend/scripts/lane-usage.mjs`.

## COSA

1. **Freeze the incidents first.** Compile the list of known harness incidents from `docs/sessioni/`, `docs/archivio/triage_kb_*.md`, `docs/decisions.md` (rows that exist because something broke) and the log `Causa` fields. Seeds, to be confirmed and dated from the sources: KB at 339 documents (2026-08-14); two chats writing prompts for the same gate (2026-09-19); Phase 2 file of P-2026-09-18-2219 lost (2026-09-18); false visual ACK of P-2026-09-22-2105 (2026-09-22/24); log rotation threshold never matching practice (to 2026-08-18); CLAUDE.md §17 at 33 typecheck errors against 14 real; Petri discovery P-2026-10-10-1020 at 116 minutes; two chats on the harness front (2026-10-18, prompts P-2026-10-18-2125 and -2220). For each: date of the incident, date it was noticed, source with path, class (execution, harness weight, governance hygiene, coordination, cost). Write it as §1 of the report and **commit it alone, before computing any signal** (commit 1). The git order is the proof of the freeze; do not edit §1 afterwards, add a dated addendum instead.

2. **Data inventory by depth.** For each source, from when it exists and what it can and cannot give: git history (all); log fields `Corregge`/`Causa` (from 2026-08-02; before, only the outcome emoji), active log, archive and `docs/log-inbox/`; lane folders under `~/.jjodel-lanes/P-*` and `lane-usage.mjs` (from wk39). No back-filling (HARNESS-DOCS §9): a signal is undefined where its data does not exist, never imputed.

3. **Signals.** Compute as weekly and rolling-4-week series, each stratified as far as n allows:
   - S1 rework: share of lanes or log entries with `Corregge` filled, by cause (a) to (g).
   - S2 unplanned stops: time limit exceeded, `blocked`, ceiling; planned hard stops separate.
   - S3 context per lane: first call split into cached prefix and per-lane part, and peak; by kind and model.
   - S4 governance hygiene, as dated invariant breaks reconstructed from git: KB count where known, active log entries over 40, decisions cited in memos and not in `decisions.md` (time to registration), RC-26 items waiting, prompts left `da eseguire` after their lane closed, merged branches and worktrees not removed (as far as git shows).
   - S5 coordination: two distinct `Chat:` (or `Claude-Session` trailers) emitting prompts with the same `Front:` within a window; propose the window from the data.
   - S6 spend per day and per kind (from wk39), against the plan.
   Add a signal only if the incidents of step 1 call for one; say why.

4. **Backtest with a split.** Choose thresholds on 2026-08-01..2026-09-30, then evaluate unchanged on 2026-10-01..2026-10-18. For every signal and incident: fired or not, lead time (fire date to noticed date), false alarms in quiet weeks. A signal that works only on the tuning period is reported as such and not proposed. Compare within a regime; when a series steps at a regime change, say which.

5. **Report**, at `docs/discovery/discovery_2026-10-18_harness_health_retrospective.md` (P4: hypothesis under test, objective, files read with full paths, findings with `file:line` or commit sha, dependencies and risks, open questions). Sections after §1: data inventory; per-signal results with the backtest table; proposed catalogue (kept, kept as diagnosis only because they fire late, dropped) with thresholds; what the signals cannot see (decisions that were wrong but well executed, defects passing all gates, mutually inconsistent rules), stated with the incidents that prove it; a proposal for Phase 2: governance first (closing fields the signals need, a row for «a chat opening a front reads the health state first»), then `frontend/scripts/harness-health.mjs` on top of `lane-usage.mjs`, then a Health tab and banner on the lane board. No Phase 2 code here.

6. Scripts: one entry point, `docs/discovery/harness/harness-health-retro.mjs` (node v26, no new dependencies), reading only; it writes intermediate data to `docs/discovery/harness/harness-health-retro/` as CSV if the total stays under 1 MB, otherwise to `~/.jjodel-lanes/health/` with a note in the report. `drift-2026-10-18.py` may be read for method, not copied as is. Running it twice gives identical output (state it, with the hash of the outputs).

## DOVE
`docs/discovery/discovery_2026-10-18_harness_health_retrospective.md` (new), `docs/discovery/harness/harness-health-retro.mjs` (new), `docs/discovery/harness/harness-health-retro/` (new, data), `docs/log-inbox/harness.md`, this prompt's Status line. Nothing else: no change to `lane-run.mjs`, `lane-usage.mjs`, the board, hooks, `CLAUDE.md`, `PROTOCOL.md`, `decisions.md`.

## Gates
`check:docs` after each docs commit. The script runs from a clean checkout of the branch with the documented command.

## Commits (P13, RC-17), explicit pathspecs, no push
Commit 1: `docs: harness incidents frozen before the health backtest (P-2026-10-18-2220)`, §1 only (report file holding §1 and the headings).
Commit 2: the script and its data.
Commit 3: the full report, the log entry in `docs/log-inbox/harness.md` («Decisions taken (unattended)» names thresholds and windows chosen; «Decisions awaiting Alfonso» names any RC-26 item), the Status flip. Trailer `Model:` (P6) on each.

## NON FARE
No composite index. No imputation of missing periods. No threshold retuned on October data. No Phase 2 code. No reading of whole multi-megabyte files into context.

## HARD STOP
At the end of Phase 1, always: `Outcome: hard-stop`. Earlier with `Outcome: question` only if the incident list cannot be dated from the sources for more than half the seeds.

## RIFERIMENTI
`docs/HARNESS-DOCS.md` §4.2, §4.5, §6, §9; `docs/decisions.md` RC-20, RC-45, RC-49, RC-50, RC-51, RC-52; `frontend/scripts/lane-usage.mjs`; `~/.jjodel-lanes/board/scratch/drift-2026-10-18.py`; `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §3 (baseline method).
