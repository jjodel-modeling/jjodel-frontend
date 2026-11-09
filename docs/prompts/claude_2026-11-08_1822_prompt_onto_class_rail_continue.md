# Levels lane 2 continuation: probe the class rail, bench, docs

Prompt-ID: P-2026-11-08-1822
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (continuation of P-2026-11-08-1753 after its context ceiling; probe, bench and docs; product code only for a defect the probe proves)
Status: eseguito 2026-11-08 · lane full · 3f399f545
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 12:25 finding 2; 16:03 «decidi tu»)
Depends: P-2026-11-08-1753
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `b8b9bfe30`
(lane 2's code). Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome:
blocked`. Model and tier: heavy, effort `xhigh`. Alfonso's dev server runs from this worktree on port 3005: do not stop
it; probe ports outside 3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-08-1822 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 75 minutes.

- Context economy: windows of at most 50 lines; never a whole probe log (grep its summary); never a whole product file
  or diff. Commit each finished step at once.
- `uptime` in a separate call before each probe; start only with the 1-minute load under 20 (the Mac reached 194 at
  18:19 because of other lanes: wait in calls of at most 60 s, one `uptime` per call); one probe run per call.
- A product change only if the probe proves a defect in lane 2's code (under 15 lines, in lane 2's files); otherwise
  stop with `Outcome: question`.
- No push, no merge.

## Source

`~/.jjodel-lanes/P-2026-11-08-1753/handoff.md` (the exact probe plan), `handoff.diff`, the lane 2 prompt
`docs/prompts/claude_2026-11-08_1753_prompt_onto_class_rail.md` steps 2 to 4, and lane 2's result in
`~/.jjodel-lanes/P-2026-11-08-1753/log.jsonl`. Known: S2-L5 and S2-L6 assert lane 1's empty class tab; Q2 now puts the
class rail and «New ▸» there, so amend those two checks (say how), do not treat them as regressions. «No rootable
classes found» left as a design choice (§4). The extra test file `hooks/__tests__/classElement.test.ts` is accepted.

## COSA

1. Probe (lane 2's step 2), plus the three unverified points of the handoff, each measured and reported: a new contained
   element leaves no stray node or composition edge; a new attribute draws as a row of its class; the class view's edge
   drag creates (or not) a Generalization, which stays listed disabled in the rail whatever the result. Regression, one
   run each: `onto-s3a-slot-problems.ts`, `onto-binding-editor.ts`. Crops to `~/.jjodel-lanes/P-2026-11-08-1822/crops/`
   (shrink only above 1200 px): the class rail, the class pane menu, the canvas after a drop, the class with its new
   attribute. `chore(probe)` commit.
2. The three mutants of lane 2's step 3, each red and reverted, to `~/.jjodel-lanes/P-2026-11-08-1822/bench.txt`.
3. Docs commit: R-OI-21, R-OI-22, R-OI-23 as lane 2's step 4 states (`parseRows` reads them); one entry in
   `docs/log-inbox/instance-of.md` for 1753 and this lane (the amended S2-L5/L6, the extra test file, the three measured
   points); flip `Status:` of both prompts. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier as stated.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-08-1753/handoff.md`; `docs/discovery/discovery_2026-11-08_onto_levels_class_rail_links.md` §4, §8 lane 2.
