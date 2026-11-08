# Levels fix lane: new attribute defaults, header clipping, generalization container

Prompt-ID: P-2026-11-08-2146
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (outside the critical zone; three defects found by levels lane 2)
Status: da eseguire
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 12:25 finding 2: the class diagram creates classes, attributes and associations as the metamodel and its bindings define them; the chat's fix of lane 2's measured defects, announced to Alfonso 19:31)
Depends: P-2026-11-08-2041
Corregge: P-2026-11-08-1753
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `459ac12e4`.
Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier:
heavy, effort `xhigh`. Alfonso's dev server runs from this worktree on port 3005: do not stop it; probe ports outside
3000, 3001, 3005, 3015; probe assets never under `docs/`.

## Lane discipline

Every reply opens with `[P-2026-11-08-2146 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 80 minutes.

- Context economy: windows of at most 40 lines; never a whole file, diff or probe log. Commit the code as soon as its
  gates are green. At the ceiling, `handoff.md` and `Outcome: hard-stop`.
- `uptime` in a separate call before each probe; start only with the 1-minute load under 20; one probe run per call.
- No push, no merge. If a fix needs a CLAUDE.md §3.1 or §3.2 file (node sizing in `viewpoint/ir/` or `nodeSizing.ts` /
  `jjomTransformers.ts`, see R-OI-16), `reducer.ts` or an exported interface: stop with `Outcome: question` and the
  evidence; do not edit it.
- First reply: root cause of each defect with file:line (read only), then the rule-19 file list.

## The three defects (measured by P-2026-11-08-1822, `~/.jjodel-lanes/P-2026-11-08-1822/log.jsonl`)

1. **A new attribute is empty.** «Add attribute» on a selected class creates `property1 : [ 0 .. 0 ]`: no type, no
   visibility, multiplicity 0..0. Expected, from the binding and UML defaults: name `attribute<N>` unique in the class
   (or the lane's existing naming if one exists), visibility public, multiplicity 1..1 (`lower = 1`, `upper = 1`), type
   the metamodel's `String` primitive when the binding's `featureType` role and a String PrimitiveType exist, else
   untyped; all in the same single undo entry.
2. **The class header clips** at the third row after an attribute is added (Book in the crop of 1822). Diagnose; fix
   only if the cause is outside the critical zone and the R-OI-16 rule (the UML instance view authors no `defaultSize`;
   check whether the class view does and whether a grow-at-the-gesture applies), else report.
3. **The class view's edge drag puts the Generalization at the model root.** It must go inside
   `<specific>.generalizations` (the binding's `generalization.via`), as in the fixture, with `general` set, in one
   undo entry; the edge still draws. If the drag path is the linguistic edge creation shared with every notation,
   change it only for a tab at level `class` with a declared binding, and say so.

Also measure (no fix): lane 3's new ticket, «a drop away from a target handle silently does nothing», on the class tab
and the object tab: how far from a handle a drop still connects; report it.

## COSA

1. Root causes, then the code fixes, with unit tests that fail without each fix (attribute defaults; generalization
   container), mutants red and reverted to `~/.jjodel-lanes/P-2026-11-08-2146/bench.txt`. Gates: typecheck 0; the new
   tests, `instantiate.test.ts`, `classElement.test.ts`, `undoGroup.test.ts`, `bindingDetect.test.ts` green;
   `npm run build` 0 (read the exit status). Code commit.
2. Probe checks in `onto-s2-instantiate.ts` level block: «Add attribute» gives `attribute1 : String [1]` (or the measured
   rendering) as one row, header not clipped, one Cmd+Z removes it; a class-to-class drag puts the Generalization in
   `Book.generalizations` with `general = Publication`, one undo entry, one edge. Regression, one run each: the S2 suite
   with the level block, `onto-s4-links.ts`, `onto-binding-editor.ts`. Crops to `~/.jjodel-lanes/P-2026-11-08-2146/crops/`:
   the class with its new attribute, the generalization edge, the properties panel of the new Generalization.
   `chore(probe)` commit.
3. Docs commit: one entry in `docs/log-inbox/instance-of.md` (root causes, fixes, the handle-distance measure); an
   amendment line on R-OI-22 only if the generalization rule is a new clause; flip `Status:`. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier as stated.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-08-1822/` (result, crops), `~/.jjodel-lanes/P-2026-11-08-2041/` (result); `docs/decisions.md`
R-OI-16, R-OI-21..24; `docs/discovery/discovery_2026-11-08_onto_levels_class_rail_links.md` §4; CLAUDE.md §3.1, §3.2.
