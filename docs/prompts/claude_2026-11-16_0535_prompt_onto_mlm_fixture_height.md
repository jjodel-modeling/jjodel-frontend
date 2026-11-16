# Ontological instantiation, multilevel: clabject fixture node height

Prompt-ID: P-2026-11-16-0535
Chat: C-2026-10-25-2159
Front: instance-of
Lane: fast (one probe fixture file and a re-export; no product code)
Status: eseguito 2026-11-16 · lane fast · d6c2425db
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-16 02:00: «vai adesso in /lane auto ma non ti fermare e prosegui dritto dritto fino all'implementazione»; the export is what he will open first)
Depends: P-2026-11-16-0500
Corregge: P-2026-11-16-0430
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-ml`, branch `oi-multilevel`, its tip this prompt's `docs:` commit, whose parent is `2d578b899`.
Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier:
heavy, effort `xhigh`. Probe ports outside 3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-16-0535 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Time limit 40 minutes. Short tool output; one probe run per call, `uptime` before it, load under 20. No push,
no merge. Product code out of scope.

## COSA

The low ticket of L4b (`docs/log-inbox/instance-of.md`, P-2026-11-16-0500): every fixture clabject is drawn at the
fixture's 60 px `defaultSize` (`frontend/scripts/probe/mlm-clabject-fixture.ts:138,141`), its content needs more, so
labels are squeezed and rows below the second are cut. A clabject created in the session sizes itself and renders whole.

1. In the fixture only, give the Clabject view a size that fits its content, the way a node created in the session gets
   it (prefer the same auto-size path; else a height that holds the header, the slots compartment with two rows plus one
   ghost row, and the fields compartment with two rows). No other change to the fixture.
2. Rerun the fixture (10/10) and re-export `~/jjodel-demo-exports/mlm-clabject/mlm-clabject.jjodel`; then
   `onto-mlm.ts` on the new export (M0..M9 green). Crops (`sips -Z 1200`) of the three level viewpoints to
   `~/.jjodel-lanes/P-2026-11-16-0535/crops/`; look at them: every row visible, `Book`'s `isbn : String` and the ghost
   row readable.
3. One `chore(probe)` commit with the fixture; one docs commit: the ticket marked closed in the inbox entry, this
   prompt's `Status:` flipped. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. If the rows are still cut with any size, stop with
`Outcome: question` and the measure.
