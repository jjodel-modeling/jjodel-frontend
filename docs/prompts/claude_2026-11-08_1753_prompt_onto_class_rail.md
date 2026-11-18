# Levels lane 2: the class-level rail from the binding

Prompt-ID: P-2026-11-08-1753
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (no §3.1 file; new pure reader, rail and pane menu at the `class` level)
Status: eseguito 2026-11-08 · lane full · b8b9bfe30
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 12:25 finding 2: the class diagram's rail offers classes, attributes, associations from the metamodel and its bindings; 16:03 «decidi tu»; the discovery's recommended answers adopted unattended, RC-21)
Depends: P-2026-11-08-1726
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `0b12cf59a`
(levels lane 1 closed). Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome:
blocked`. Model and tier: heavy, effort `xhigh`. Alfonso's dev server runs from this worktree on port 3005 and reloads
on save: do not stop it; probe ports outside 3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-08-1753 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 90 minutes.

- **Context economy**: windows of at most 50 lines; never a whole diff, never `EditorV2.tsx` or `PalettePanel.tsx`
  whole, never a whole probe log (grep its summary). **Commit the code as soon as its gates are green**, before the
  probes. At the ceiling, write `handoff.md` in the lane folder and stop with `Outcome: hard-stop`.
- `uptime` in a separate call before each probe; start only with the 1-minute load under 20; one probe run per call.
  The S2 suite leaves the side panel closed: reopen it with the toolbar button before reading the rail (lane 1's fix).
- Code, probe and docs in separate commits (RC-13). Subjects at most 72 characters, `Model:` trailer.
- No push, no merge. No edit to a CLAUDE.md §3.1 or §3.2 file (`viewpoint/ir/` included), to `reducer.ts`, or to an
  exported interface beyond optional props; if one becomes necessary, stop with `Outcome: question`.
- First reply: the list of files and what changes in each (rule 19).

## Source

`docs/discovery/discovery_2026-11-08_onto_levels_class_rail_links.md` §4 (the empty linguistic block, what the class
rail lists, where a created element goes), §8 **lane 2**, §12. Implement lane 2 as written there. Answers adopted (RC-21):
- Q2: at `class`, the pane menu offers «New ▸ <metaclass>» with the same items as the class rail.
- Q3: Associations are listed in the class rail but disabled (tooltip: «An association is drawn between two classes»);
  their creation gesture is lane 3's.
- Q4: a created element goes into the composition reference that accepts its metaclass, owned by the sole instance of
  that reference's owner (in UML, the model's Package), otherwise the model root.
- The groups are derived from the `object` record of the binding: the classifier metaclasses the type reference accepts
  (Class, Enumeration, DataType, PrimitiveType…), the properties through `featureContainer` («Add attribute» on a
  selected class, or a rail item that needs a selected class), generalizations through `generalization.via`. With no
  binding, the class rail shows the linguistic block as today (fix its «No rootable classes found» only if §4 shows it is
  a defect, not a design choice; say which).
- At `class`, the «Declare binding…» empty state lands here when no binding is declared (it was hidden by lane 1).

## COSA

1. A pure reader in `frontend/src/model/ontological/` (classifier metaclasses, property and generalization roles from
   the record; the container rule) and its tests (the UML fixture; a metamodel with no generalization; mutants on the
   container rule and on the metaclass filter). `PalettePanel.tsx` (the class-level section), `EditorV2.tsx` (the class
   pane menu «New ▸», the drop and click going through one undo entry), `hooks/instantiate.ts` only if the write joins
   its queue. Gates: typecheck 0; the new tests, `instantiate.test.ts`, `undoGroup.test.ts`, `bindingDetect.test.ts`
   green; `npm run build` 0 (read its exit status). Code commit.
2. Probe checks (in `onto-s2-instantiate.ts` level block or `onto-levels.ts`) on
   `UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`, class tab at `class`, object tab at `instance`: the
   class tab lists the groups; a drop of Class creates a Class under the model's Package with one undo entry and one
   Cmd+Z removes it; «New ▸ Class» from the pane menu does the same at the click; adding an attribute to a selected
   class works and undoes in one step; the object tab lists none of this; the S2 suite and the level block stay green.
   Regression, one run each: `onto-s3a-slot-problems.ts`, `onto-binding-editor.ts`. Crops to
   `~/.jjodel-lanes/P-2026-11-08-1753/crops/` (shrink only above 1200 px): the class rail, the class pane menu, the canvas
   after a drop (the new class at the cursor), the class with its new attribute. `chore(probe)` commit.
3. Mutants, each red and reverted, to `~/.jjodel-lanes/P-2026-11-08-1753/bench.txt`: the container rule falls back to
   the root; the metaclass filter dropped; the class pane menu shown at `instance`.
4. Docs commit: rows **R-OI-21** (the class rail groups), **R-OI-22** (the container rule), **R-OI-23** (the class pane
   menu), 2026-11-08, provisional, decided by the chat on Alfonso's «decidi tu», reversible: branch; `parseRows` reads
   them. One entry in `docs/log-inbox/instance-of.md`; flip this prompt's `Status:`. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier with `Outcome: question` as stated.

## RIFERIMENTI

The discovery report above; `docs/decisions.md` R-OI-1, R-OI-18, R-OI-19, R-OI-20; the levels entry of
`docs/log-inbox/instance-of.md`; CLAUDE.md §3.1, §3.2, rule 19.
