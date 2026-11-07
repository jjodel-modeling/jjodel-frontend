# Ontological instantiation: discovery for an «Instances of» rail section and binding declaration from the UI

Prompt-ID: P-2026-11-08-0049
Chat: C-2026-10-25-2159
Front: instance-of
Lane: discovery (read-only; one report)
Status: da eseguire
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 00:35: «rail e dichiarazione e procedi in /lane auto» (on the chat's proposal of 00:34))
Depends: P-2026-11-07-1834 (oi-s3b on the trunk)
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit on the trunk. Check `pwd`, the
branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier: heavy, effort
`xhigh`. **Read-only**: the only file written is the report. No dev server, no probe.

## Lane discipline

Every reply opens with `[P-2026-11-08-0049 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 45 minutes. Short tool output: grep and windows of
at most 80 lines; never `EditorV2.tsx` or `reducer.ts` whole.

## Goal (Alfonso's choice, 2026-11-08 00:35)

Today the ontological binding (`model/ontological/bindingCodec.ts`, `bindingReader.ts`, `bindingCheck.ts`) lives in the
metamodel's `_state.ontoBindings` and can be declared only from the console (the probes write it; the export of
`uml-s3b` does not contain it). Instantiation is reachable only from the pane menu «New instance of ▸» (R-OI-10,
`EditorV2.tsx` `onPaneContextMenu` about `:3210`, `runInstantiate` about `:3230-3250`). One slice must add:

1. **Rail**: in the left rail of a model whose metamodel declares a binding, a second section «Instances of» below the
   linguistic classes, listing the model's classes instantiable under the `object` binding and the associations under
   `link`, grouped by binding. Drag (or click) on the canvas runs the same `instantiate()` path as the pane menu (same
   queue, same deadline, one undo step). With no binding declared, the section shows empty with a «Declare binding…»
   action.
2. **Declaration**: in the metamodel's properties, a binding editor: a «Detect» button that matches the roles to the
   metamodel's features by name (what the console snippet of the probes does: `onto-s2-instantiate.ts` setup), shows the
   proposed role table, lets the user fix any row and confirm; then writes `ontoBindings` through the codec in one undo
   step.

## COSA (questions the report must answer, with file:line)

1. The left rail: which component renders the linguistic classes in the model editor (start from
   `panels/PalettePanel.tsx`, `Toolbar.tsx`), how it gets the instantiable classes, how a drag or click creates a node
   (event, drop handler in `EditorV2.tsx`), whether a second section can be added without touching the linguistic path,
   and its SCSS class names (grep every new name you would propose; report collisions).
2. The instantiable set: which existing function lists the classes and associations of an M1 model eligible under a
   binding (the pane menu builds it: find it), abstract classes, generalization, how it reacts to edits of the model.
3. The drop entry: whether `instantiate()` (`hooks/instantiate.ts`) accepts a canvas point from a drop as it does from the
   menu (placement under `tabLayoutKey()`, R-MT), and whether a drop handler exists to reuse.
4. The metamodel properties panel: which component shows a DModel metamodel's properties, where a binding editor fits
   (progressive disclosure Basic/Advanced), how `_state` is written today with one undo step.
5. Detection: the role list of the codec, the name heuristics the probe snippet uses, what `bindingCheck.ts` already
   validates (so the editor shows its errors instead of new ones), and what happens to existing instances when a
   binding is changed or removed.
6. Critical zone and core: which candidate files are in CLAUDE.md §3.1/§3.2, whether `reducer.ts` or an exported
   interface must change (it should not).
7. A lane plan: two or three implementation lanes (for example rail, declaration editor, fixture regenerated with the
   binding in `~/jjodel-demo-exports/uml-s3b/`), each with files, tests, probe checks and the visual crops Alfonso will
   judge; and the decisions left to Alfonso, each with `Recommended:`.

## Output

Report `docs/discovery/discovery_2026-11-08_onto_rail_binding_declaration.md` (objective, files read with full paths,
findings with file:line, dependencies and risks, lane plan, open questions with `Recommended:`). One `docs:` commit with
the report only, `Model:` trailer. No log entry (the first implementation lane writes it).

## HARD STOP

After the report commit with `Outcome: done` and a clean tree.

## RIFERIMENTI

`docs/decisions.md` R-OI-1..17, R-MT-*; `docs/discovery/discovery_2026-10-21_onto_s3b_ghost_rows.md`;
`frontend/scripts/probe/onto-s2-instantiate.ts` (binding setup); CLAUDE.md §3.1, §3.2.
