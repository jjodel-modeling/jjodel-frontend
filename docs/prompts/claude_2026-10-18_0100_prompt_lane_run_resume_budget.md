# lane-run: resume budget (run count and cumulative cost, refusal past the threshold)

Prompt-ID: P-2026-10-18-0100
Chat: C-2026-10-18-0035
Front: harness
Lane: fast (one script and its tests; no UI, no normative file)
Status: da eseguire
Request: "solo se tutto cio rende la gestione dell'harness piu economica" (Alfonso, 2026-10-18 00:58), then "si" to the resume budget (01:00)

Protocollo: docs/PROTOCOL.md: clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 (visual check) does not apply, no UI is touched. P4 (discovery report) does not apply: the evidence is in the Context below, measured by the chat on 2026-10-18.

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else: `pwd`, branch, `git log -1` and `git status`. If the branch differs or the tree is not clean, stop with `Outcome: blocked`. The lane P-2026-10-18-0045 runs in `~/jjodel-w-aiproviders`: do not touch that worktree or its lane folder.

## Lane discipline
Every reply of this session opens with `[P-2026-10-18-0100 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (measured, do not redo)

The chat read the `result` events of every `~/.jjodel-lanes/P-*/log.jsonl` (350 lanes with data out of 502). The cost is concentrated: the 10 most expensive lanes are 56% of the total, the 30 most expensive 67%. One lane, P-2026-10-11-1650 (goal model, data and docs only), is about 35% of all history on its own, with 36 runs in one session; P-2026-10-11-1135 had 14 runs, P-2026-10-03-1304 had 10. The median lane has 1 or 2 runs. Every `resume` reloads the whole accumulated context, so each further run costs more than the previous one. The lever is a cap on resumes: past the cap, the lane closes with a written checkpoint and the work continues in a new lane with a new Prompt-ID and a clean context.

## WHAT

1. **Run count and cumulative cost on every resume.** Before `resume` launches (`frontend/scripts/lane-run.mjs`, `function resume`, about line 963), compute for the lane: the number of runs so far (the `input-<n>.md` files the lane folder already holds, see the start/resume header comment) and the cumulative `total_cost_usd` of the `result` events in `log.jsonl` (a malformed line is skipped, never fatal). Print one line before the launch: `budget: run <n+1>, <cost so far> USD so far (cap <cap> runs)`.
2. **Refusal past the cap.** The cap is 6 runs already done (so the 7th run is refused). Past it, `resume` refuses through the existing `refuse()` with a message that says what to do: write a checkpoint of the lane's state in the lane's worktree, close the lane, and start a new lane with a new Prompt-ID whose prompt points to that checkpoint. An explicit override lets it through: `--over-budget "<reason>"`; the reason is printed and appended to the lane folder in a file `budget.txt` (one line per override: ISO time, run number, cost so far, reason). Verify with a global search that `--over-budget` and `budget.txt` are not already in use (CLAUDE.md, name verification); if they are, pick another name and say so.
3. **Every caller of `resume`.** `resume` is also reached from inside the script (the standard GO around line 1417, and the call sites around lines 1220 and 2881, and any other you find). For each caller say whether the cap applies and what happens on refusal. The rule: the cap applies to every path that launches a new run in an existing session; an automatic lane (`--auto`) past the cap stops with the refusal and is not resumed, so the chat sees it as a question. A path that only reads or updates a tracking card is not a run and is not counted.
4. **Status.** `lane-run status <id>` shows the same two figures (runs, cost so far). `status --all` gains them only if it costs one short column; otherwise leave it.
5. **Tests.** If the script has tests (look next to it and in the repo's test layout), add cases: under the cap prints the budget line and launches; at the cap refuses; with `--over-budget` launches and writes `budget.txt`; a log with a malformed line still counts. Use a fake lane folder, never a real one, and never launch `claude` from a test.
6. **Header comment.** Document the cap, the override and `budget.txt` in the usage comment at the top of the script, next to `resume`.

The cap is one constant near the other constants of the script, named and commented, so that the chat can change it later in one place. No environment variable, no config file.

## DO NOT

- Do not touch any file outside `frontend/scripts/` (and its tests), apart from the closure files named below (this prompt's Status line, `docs/log-inbox/harness.md`). No change to CLAUDE.md, docs/PROTOCOL.md or the RC rows: the chat writes the RC entry after the merge.
- Do not change the behaviour of `start`, `merge`, `chain` or `status` beyond item 4.
- Do not add dependencies.
- Do not read or alter real lane folders except read-only to check the counting on two lanes (P-2026-10-11-1650 must give 36 runs, P-2026-10-11-1135 14 runs; report the costs you find).

## Closure

Run the script's tests and `node frontend/scripts/lane-run.mjs status P-2026-10-11-1650` as a check. Commit with pathspec only, conventional message in English, `Model:` trailer, then the Status line of this prompt flipped to `eseguito <date> · lane harness · <sha>` in a second docs-only commit. Add the entry to `docs/log-inbox/harness.md` as for the other harness lanes. Exit with `Outcome: done`.

## REFERENCES

- CLAUDE.md (read first), docs/PROTOCOL.md (P13, P16).
- `frontend/scripts/lane-run.mjs` (resume, refuse, the lane folder layout in the header comment).
