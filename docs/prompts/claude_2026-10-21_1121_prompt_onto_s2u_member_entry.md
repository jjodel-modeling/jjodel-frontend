# Ontological instantiation, S2u: the late layout write of Member lands outside its undo group (diagnose and fix)

Prompt-ID: P-2026-10-21-1121
Chat: C-2026-10-20-1835
Front: instance-of
Lane: full (core: reducer.ts undo group; verification probe; no visual change expected)
Status: non completato 2026-10-21 · lane oi-s2u · efe348885 (S2-4u fixed), 13966af7a (core merge, no effect, reverted by 1219) · second press unexplained · continued by P-2026-10-21-1219
Request: https://claude.ai/code/session_015eDtjagjBtuPHhhhfUTTo5
Depends: none
Corregge: P-2026-10-21-1041, whose session (d02e1895) reached the context ceiling with S2-4u and S2-3b1 failing
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s2u`, branch `oi-s2u` at `09b06ba24`, clean. Check `pwd`, the branch, a clean `git status`;
otherwise stop with `Outcome: blocked`. Model and tier: heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1121 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Time limit 60 minutes. **No subagent, no background task.** Foreground gates and probes (P16). **Context
economy (this chain hit the ceiling three times):** read `~/.jjodel-lanes/P-2026-10-21-1041/handoff.md` first; grep,
`sed -n` on line ranges, never a whole file over 300 lines, never a whole diff, probe output through `tail`/`grep`;
commit each green step at once. No push, no merge. Do not touch `Status`. No §3.2 critical-zone file.

## COSA

Alfonso said yes (2026-10-21 11:18). One defect, one decision:

1. **Defect (fix it): S2-4u, Member is 2 undo entries.** The second entry is `instantiate.ts`'s own node-layout write,
   about 2.4 s after the group's first write. Either the group is already closed at that moment, or the reducer no
   longer recognises the group's entry (`reducer.ts:1253-1265`). Make the group state observable to the probe (a
   read-only test hook, e.g. on `window` only in dev, or a getter), find which of the two it is with one probe run,
   fix it in `reducer.ts` or `instantiate.ts`, add a unit test that reproduces it (a write after a delay longer than the
   old 450 ms window, inside an open group, joins the group's entry), and make S2-4u pass in three runs.
2. **Decision (do not chase): S2-3b1.** The extra entry from the class-node entry is a later sync write
   (`DEdge.pointedBy` only, about 3.3 s after), not part of the instantiation; the same write appears after other
   creations. Keeping a group open that long would swallow the user's own edits. Change the probe check S2-3b1 to
   assert 1 entry for the instantiation itself and record the later sync entry as a known measure, not a failure.

Then run the full probe three times (all checks pass, the S2-3b1 note as above), `frontend/scripts/probe/undo-inline-edit.ts`
on this branch and on `9bfc0cc78` (identical outcomes), refresh `docs/discovery/assets/onto-s2/`, `npm run build` exit 0.

## DOVE

`frontend/src/redux/reducer/reducer.ts` (group code only), `frontend/src/components/editor-v2/hooks/instantiate.ts`, their
tests, the probe `frontend/scripts/probe/onto-s2-instantiate.ts`, `docs/discovery/assets/onto-s2/`, and after the GO the
log entry in `docs/log-inbox/instance-of.md` (closing tickets a and c; opening the shallow-merge ticket from discovery
P-2026-10-21-0947 with the late `DEdge.pointedBy` sync entry as one of its cases; the surviving mutant M8 as a note).

## COME

Commits: `fix(core|onto): ...` with the cause in the body as soon as the unit test is green; `chore(probe): ...`;
assets in a separate `docs(onto):` commit (P13 guard). Report with the table of measures and stop for the GO.
