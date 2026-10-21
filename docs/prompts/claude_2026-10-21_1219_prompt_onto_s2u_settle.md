# Ontological instantiation, S2u: revert the unused core merge, settle the second press, close (continuation)

Prompt-ID: P-2026-10-21-1219
Chat: C-2026-10-20-1835
Front: instance-of
Lane: full (verification of a core change; visual check owed)
Status: eseguito 2026-10-21 · lane oi-s2u · revert 765b9f94f, probe 951feff3e + 3d5b3fd8a, assets a38d2fc4e, log 53834b0b2 · all probe checks pass in 3 runs (1 entry 1 press from cascade and class-node entry, Member 1 entry, placement within 4 px, S2-5o), undo-inline-edit 33/33 identical, build 0 · visual check passed
Request: https://claude.ai/code/session_015eDtjagjBtuPHhhhfUTTo5
Depends: none
Corregge: P-2026-10-21-1121, whose session (c83814fb) stopped with S2-4u fixed and the second press unexplained
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s2u`, branch `oi-s2u` at `13966af7a`, with the probe `frontend/scripts/probe/onto-s2-instantiate.ts`
modified and uncommitted. Check that state; otherwise stop with `Outcome: blocked`. Model and tier: heavy.

## Lane discipline

Every reply opens with `[P-2026-10-21-1219 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Time limit 60 minutes. **No subagent, no background task.** Every probe run is one run per foreground call
(three runs = three calls, never one call over 600 s). **Context economy:** read
`~/.jjodel-lanes/P-2026-10-21-1121/handoff.md` first; grep, `sed -n`, `tail`; never a whole diff. Commit each green
step at once. No push, no merge. Do not touch `Status`. No §3.2 file.

## COSA

The chat's decisions on the previous report:

1. **Revert `13966af7a`** (`git revert`, its own commit): it changes core undo merging and did not remove the extra
   press in the app. The core change keeps only the group itself (`55f3bd556`) and `efe348885`.
2. **Settle the second press** with the handoff's step 1: at the first Cmd+Z the group entry is on top, so the extra
   press is probably the probe's own pane click just before the presses («EditorV2 deselect», landing up to 300 ms
   later). Measure it: let the deselect land (wait for the store to be idle, or click before reading the baseline)
   and count presses. If the probe causes it, fix the probe and record it; if the app causes it with a real user
   sequence (create, then Cmd+Z), stop with `Outcome: question` and the numbers.
3. Then the acceptance, one run per call, three runs: all checks pass (S2-4u Member 1 entry; S2-3n and S2-3b1 one entry
   and one press after the fix of step 2; placement within 4 px; S2-5o; page errors `[]`). Commit the probe; refresh
   `docs/discovery/assets/onto-s2/` and commit them separately (P13 guard).
4. `undo-inline-edit.ts` on this branch (already 33 PASS) and on `9bfc0cc78` through a temporary worktree created with
   `git worktree add` and `lane-run probe` without `--id` (remove the worktree after): identical outcomes.
5. `npm run build` exit 0. Report with the measures table and stop for the GO. After the GO: the log entry in
   `docs/log-inbox/instance-of.md` closing tickets (a) and (c), opening the shallow-merge ticket (discovery
   P-2026-10-21-0947; note the late `DEdge.pointedBy` sync entry seen earlier), the M8 note, and the revert.

## DOVE

The revert; the probe; the assets; after the GO the log entry. Product code only if step 2 shows an app defect that
stays inside `instantiate.ts`.
