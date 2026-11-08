# Levels lane 1 continuation: probe the gating points, crops, docs

Prompt-ID: P-2026-11-08-1726
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (continuation of P-2026-11-08-1658 after its context ceiling; probe and docs; product code only for a defect the probe proves)
Status: da eseguire
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 12:25 findings 1-3; 16:03 «decidi tu»)
Depends: P-2026-11-08-1658
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `a709a12b1`
(lane 1's code). **Expected state**: one modified file, `frontend/scripts/probe/onto-s2-instantiate.ts` (lane 1's
uncommitted level block); anything else uncommitted means stop with `Outcome: blocked`. Model and tier: heavy, effort
`xhigh`. Alfonso's dev server runs from this worktree on port 3005: do not stop it; probe ports outside 3000, 3001, 3005,
3015.

## Lane discipline

Every reply opens with `[P-2026-11-08-1726 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 70 minutes.

- Context economy: windows of at most 50 lines; never a whole probe log (grep its PASS/FAIL summary); never a whole
  product file or diff. Commit each finished step at once.
- `uptime` in a separate call before each probe; start only with the 1-minute load under 20; one probe run per call.
- A product change only if the probe proves a defect in lane 1's code (under 15 lines, in lane 1's files); otherwise
  stop with `Outcome: question`.
- No push, no merge.

## Source

`~/.jjodel-lanes/P-2026-11-08-1658/handoff.md` (first remaining step: reopen the properties rail in the probe before the
level block), `handoff.diff`, the lane 1 prompt `docs/prompts/claude_2026-11-08_1658_prompt_onto_levels_surfaces.md`
steps 2 and 3, and its result in `~/.jjodel-lanes/P-2026-11-08-1658/log.jsonl` (the select reads Redux `advanced`, not
`useInterfaceMode`: keep it, report it).

## COSA

1. Make the level block run: set «UML class diagram» to `class` and «UML object diagram» to `instance` through the
   control; on the class tab no pane menu, no «Instances of» section, no node «New instance», a synthetic drop writes
   nothing; on the object tab and with no level the S2 suite passes in full (S2-R4 and S2-7 included); the control's
   write is one undo entry and undoes cleanly. Confirm `npm run build` exits 0 (read the exit status). Commit the probe
   (`chore(probe)`).
2. Regression, one run each: `onto-s3a-slot-problems.ts`, `onto-binding-editor.ts`.
3. Crops to `~/.jjodel-lanes/P-2026-11-08-1726/crops/` (shrink only if larger than 1200 px): rail and right-click on the
   empty pane on the class tab; the same on the object tab; the control in the viewpoint properties (Advanced).
4. Docs commit: rows R-OI-19 and R-OI-20 as lane 1's prompt step 3 states (`parseRows` reads them); one entry in
   `docs/log-inbox/instance-of.md` for P-2026-11-08-1605, 1635, 1658 and this lane (adopted Q1, Q2, Q3, Q4, Q6, Q7; Q5
   asked to Alfonso; Q8 declined; the select's Redux `advanced` gate); flip `Status:` of the four prompts. `check:docs`
   green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier as stated.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-08-1658/handoff.md`; `docs/discovery/discovery_2026-11-08_onto_levels_class_rail_links.md` §5, §8 lane 1.
