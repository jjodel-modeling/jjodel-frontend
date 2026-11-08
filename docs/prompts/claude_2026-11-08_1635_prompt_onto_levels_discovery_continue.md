# Discovery continuation: levels, class rail, links (write the report)

Prompt-ID: P-2026-11-08-1635
Chat: C-2026-10-25-2159
Front: instance-of
Lane: discovery (continuation of P-2026-11-08-1605 after its context ceiling; read-only, one report)
Status: da eseguire
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 12:25 findings, 16:03 «decidi tu»; the lane's recommended answer adopted unattended, RC-21)
Depends: P-2026-11-08-1605
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `33455491b`. Check
`pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier: heavy,
effort `xhigh`. **Read-only** but for the report. Alfonso's dev server runs from this worktree on port 3005: do not stop
it; probe ports outside 3000, 3001, 3005, 3015, assets under `/tmp`, never committed.

## Lane discipline

Every reply opens with `[P-2026-11-08-1635 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 45 minutes.

- **Context economy first**: write the report skeleton with the findings already measured by P-2026-11-08-1605 **before**
  any probe run, and commit it as soon as it is complete enough to stand alone; the probe run then adds an addendum
  commit. Grep and windows of at most 50 lines; never a whole log, never a whole product file.
- `uptime` in a separate call before the probe; start it only with the 1-minute load under 20.

## Source

`~/.jjodel-lanes/P-2026-11-08-1605/handoff.md` (findings, file:line, the three invalid measures and why), assets in
`/tmp/p1605/`, and the prompt `docs/prompts/claude_2026-11-08_1605_prompt_onto_levels_discovery.md` (COSA 1 to 6, the
decision: level declared by the viewpoint).

## COSA

1. Write `docs/discovery/discovery_2026-11-08_onto_levels_class_rail_links.md` from the handoff, answering COSA 1 to 6
   of 1605, with the lane plan (three lanes) and the open questions with `Recommended:`. State plainly what is measured,
   what is read from code only, and what is still unmeasured. Note the finding that `useIRInteractionPlan` reads the
   root viewpoint, not the tab's. Commit (`docs:`).
2. **One more throwaway probe run** (the lane's recommended answer, adopted): the three script defects of 1605 fixed
   (a drag that actually starts, `connecting:true` checked first; `createInstance` called with the name, not the id;
   the class node menu read from the node's own menu), the control drag Book→Member kept. Measure: what a drag between
   two object nodes writes (store delta) and whether anything draws; whether a link with its two InstanceValues filled
   draws as an edge; the class node menu entries. Add the measures to the report as an addendum section and commit.
3. If finding 4 still does not reproduce («the relation shows in the properties panel but not on the canvas»), list
   the candidate gestures (edge drag from a port, the properties panel's reference editor, the node menu) with what each
   writes, so the chat can ask Alfonso which one he used.

## HARD STOP

After the report commits with `Outcome: done` and a clean tree.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-08-1605/handoff.md`, `handoff.diff`; `docs/decisions.md` R-OI-1, R-OI-5, R-OI-8, R-OI-10, R-OI-18; CLAUDE.md §3.1, §3.2.
