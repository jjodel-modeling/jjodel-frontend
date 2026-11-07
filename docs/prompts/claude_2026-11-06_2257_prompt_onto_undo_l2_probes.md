# Ontological instantiation, undo groups L2: cross-front regression probes on oi-s2u, closing entry for L1..L2

Prompt-ID: P-2026-11-06-2257
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (closes the core lane P-2026-11-06-2150; no product code)
Status: da eseguire
Request: none (Alfonso: «ok», 2026-11-06 21:45, to option (c) and its lane plan)
Depends: P-2026-11-06-2225
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s2u`, branch `oi-s2u`, its tip this prompt's `docs:` commit, whose parent is `9baae8d88`.
Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier:
heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-06-2257 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 75 minutes.

- **No product code, no probe edits.** A probe failure that needs either stops the lane with `Outcome: question`, the
  check name and the evidence.
- **One probe run per tool call**, `uptime` beside each; probe output: check lines only (grep PASS, FAIL, MEAS, DONE).
  Before each probe, if the 1-minute load average is above 20, wait for it to drop (one `uptime` per call, never a sleep
  longer than 60 s) and say so; a probe that fails only by a timeout under load is rerun once at lower load.
- Probe assets to `ONTO_OUT` or the probe's own env under `/tmp`, never into the repo.
- No push, no merge. Commit subject at most 72 characters, `Model:` trailer.

## COSA

1. Run on this branch, each once: `new-model-instantiate.ts`, `undo-inline-edit.ts`, `jjodie-s4c-apply-undo.ts`,
   `jjodie-udo-after-apply.ts`, `jjodie-rf2-run-from-tab.ts` (all under `frontend/scripts/probe/`; find each probe's run
   line in its header). Record pass/fail counts and the load average. For every failure, run the same probe once on the
   trunk worktree `~/jjodel-release` (read-only there: no commit, no file written in that tree; assets under `/tmp`) to
   tell a regression of this branch from a failure the trunk already has.
2. One closing entry in `docs/log-inbox/instance-of.md` (skill `log-entry`, format P9) covering P-2026-11-06-2105
   (discovery), P-2026-11-06-2150 (L1), P-2026-11-06-2225 (L1b) and this lane: shas (`5b1e2fe41` on
   `oi-undo-discovery`, `197ae1fd1`, `809d85ce1`, `9baae8d88`, `19abb1356`), gates, the benches from
   `~/.jjodel-lanes/P-2026-11-06-2150/bench.txt` (T1 survived as an equivalent mutant, accepted) and
   `~/.jjodel-lanes/P-2026-11-06-2225/bench.txt`, the probe table of step 1 with loads, `S2-3b1` lateSync 0 after the
   trunk's `pointedBy` fixes, the welcome-key fix in `scripts/smoke/states.ts` (also on the trunk, `54f38d163`), and as
   proposed tickets any trunk-side failure found in step 1 plus `templates-mode-restore.ts`, which seeds the welcome keys
   itself and lacks `jjodel_welcome_3_1_1_seen`. Notes within 500 characters; detail in
   `~/.jjodel-lanes/P-2026-11-06-2257/closing.md`.
3. In the same commit, flip `Status:` to `eseguito` in the prompts of P-2026-11-06-2150 and P-2026-11-06-2225 (both in
   `docs/prompts/` on this branch). `npm run check:docs` green. One `docs:` commit.

## DOVE

`docs/log-inbox/instance-of.md`, the `Status:` lines of `docs/prompts/claude_2026-11-06_2150_prompt_onto_undo_l1_merge.md`
and `docs/prompts/claude_2026-11-06_2225_prompt_onto_undo_l1b.md`. Nothing else in the repo.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier with `Outcome: question` as stated above.

## RIFERIMENTI

`docs/discovery/discovery_2026-11-06_onto_undo_groups_reconcile.md` (branch `oi-undo-discovery`, §5 lane table);
CLAUDE.md §21.2, §21.3; PROTOCOL.md P9, P13.
