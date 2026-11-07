# DCN L4.1 continuation: browser parity probe for the nucleus field

Prompt-ID: P-2026-11-07-0750
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (continuation of P-2026-11-07-0701, stopped at the context ceiling)
Corregge: 2026-11-07 07:01 (stopped at the soft context ceiling before the browser probe, RC-51)
Worktree: ~/jjodel-w-dcn-l41, branch dcn-l41, at the commit that adds this prompt on top of 8de3f6ae8
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the only changes are the uncommitted `docs/log-inbox/dcn.md` and the Status line of `docs/prompts/claude_2026-11-07_0701_prompt_dcn_l41_run_nucleus_field.md`; otherwise stop with Outcome: blocked. No subagents, no background tasks. Every reply opens with [P-2026-11-07-0750 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; grep only MEAS, PASS, FAIL lines of a probe log, never cat it. Before each probe run check uptime: wait while the 1-minute load is above 20.

## Contesto (non rifare l'analisi)

Read only ~/.jjodel-lanes/P-2026-11-07-0701/handoff.md (and handoff.diff if it holds the draft probe). It has the gesture script, the selectors with file:line, what to record, the fixture choice and the run and cleanup steps. The fixture decision is taken: `scene_3_DemoESM.jjodel` (the turnstile) set up as `sim-coverage-polish.ts` does, with an I/O board and one Clock bound to `coin` at 1000 ms written before Reset. Step back and slider in the browser read the kept configurations; the replay path is covered by the unit parity test and is not this probe's target.

## COSA

(1) Write the probe from the handoff under a `_tmp_` name in `frontend/scripts/probe/` that `git check-ignore` confirms ignored (if none is ignored, use a name under a gitignored folder the handoff names; never commit it).
(2) Run it on this worktree and on a temporary worktree at 28063e561 (the base), free ports in 3080..3099, and compare the recorded lines gesture by gesture: they must be identical. Take the panel crops at the end of each run in the light theme into ~/.jjodel-lanes/P-2026-11-07-0750/crops/.
(3) Remove the temporary worktree, the probe copies and the node_modules symlinks. Report the comparison line by line in short and the crop paths. Leave the two docs changes uncommitted. Outcome: hard-stop (the chat gives the GO).

## NON FARE

No source changes, no commits except none, no push, no merge.
