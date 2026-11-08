# Ontological instantiation: discovery for level-aware viewpoints, the class diagram rail, and S4 links

Prompt-ID: P-2026-11-08-1605
Chat: C-2026-10-25-2159
Front: instance-of
Lane: discovery (read-only; one report)
Status: da eseguire
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 12:25, four findings on `oi-rail`; 16:03 «decidi tu» on the chat's proposal: the ontological level is declared by the viewpoint)
Depends: P-2026-11-08-0241
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `fe6e1b22c`.
Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier:
heavy, effort `xhigh`. **Read-only**: the only file written is the report. Alfonso's dev server runs from this worktree
on port 3005: do not stop it. One throwaway probe run is allowed (port outside 3000, 3001, 3005, 3015, assets under
`/tmp`, never committed) to measure finding 4.

## Lane discipline

Every reply opens with `[P-2026-11-08-1605 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 50 minutes. Short tool output: grep and windows
of at most 60 lines; never `EditorV2.tsx`, `PalettePanel.tsx` or `reducer.ts` whole.

## Alfonso's findings (2026-11-08 12:25, on `oi-rail` at :3005)

1. Class diagrams sit one ontological level above object diagrams (R-OI-1: two ontological levels inside one M1 model).
2. The class diagram's left rail must offer the creation of classes, attributes, associations and the like, derived
   from the metamodel and from the bindings declared in the metamodel's configuration.
3. In a class diagram the context menu «New instance of ▸» must not appear (today R-OI-10's pane menu and the new
   «Instances of» rail section show on every canvas of the model).
4. A relation drawn between two instances on the object diagram shows in the properties panel but not on the canvas.

## Decision (the chat, on Alfonso's «decidi tu», 16:03)

Each viewpoint declares its ontological level, `class` or `instance` (absent: today's behaviour, both surfaces). The
creation surfaces follow the level of the tab's viewpoint (R-MT: per-tab viewpoint): `class` gets the class-level rail
and no instance surfaces; `instance` gets «Instances of» and the pane menu, and no class creation. Rejected: declaring
the levels in the binding (couples the metamodel's configuration to the views; a metamodel with one binding and many
notations would need a mapping anyway).

## COSA (questions the report must answer, with file:line)

1. **Where the level lives.** How a viewpoint stores a property today (the IR viewpoint record, `_state` or an existing
   field), how the active tab's viewpoint is read at the rail and at `onPaneContextMenu` (R-MT plumbing, `tabLayoutKey()`
   and its sibling for the viewpoint), and how the UML fixture's two viewpoints («UML class diagram», «UML object
   diagram») would carry it. Where it is set in the UI (viewpoint properties, Advanced).
2. **The empty linguistic block.** Why the rail shows «No rootable classes found» on `uml-s3b` (`PalettePanel.tsx`, the
   rootable filter, the UML metamodel's containment: classes live in a Package), and what the class-level rail should
   list instead, derived from the binding: the classifier metaclasses (type reference targets: Class, Enumeration,
   Association, DataType…), properties through `featureContainer`, generalizations through `generalization.via`. How a
   created element finds its container (the package of the canvas or the model root).
3. **Gating the instance surfaces.** The exact points to gate: R-OI-10 pane menu (`EditorV2.tsx` `onPaneContextMenu`),
   «New instance» on the class node menu, the «Instances of» section and its drop branch; what the `class` level shows
   instead in the pane menu (if anything).
4. **The relation between two instances.** Which gesture Alfonso most likely used (edge drag between two object nodes
   in the object diagram viewpoint): what it writes today (measure it once on `uml-s3b` with the throwaway probe: the
   store delta), why the object diagram viewpoint draws no edge (the IR's link rule draws only an InstanceSpecification
   classified by an Association, spec `docs/archivio/claude_2026-10-14_uml_class_object_notation.md` §4 and the
   addendum on `oi-notation` `cfd39d6c5`), and what S4 (R-OI-8, R-OI-5) needs: the gesture creating a link instance
   with its two end slots, checked against the end types; the view drawing a link, and a reference slot whose target is
   on the canvas as an edge.
5. **Critical zone and core.** Which candidate files are in CLAUDE.md §3.1/§3.2 (S4 may reach `useM1ReferenceEdges` or
   `portDistribution`), whether `reducer.ts` or an exported interface must change.
6. **Lane plan.** Three implementation lanes (level-aware surfaces; class-level rail from the binding; S4 links and
   their edges), each with files, tests, probe checks, crops for Alfonso and a decision row (R-OI-19 onward); what in
   `oi-rail`'s lane A (R-OI-18) changes; the decisions left to Alfonso, each with `Recommended:`.

## Output

Report `docs/discovery/discovery_2026-11-08_onto_levels_class_rail_links.md` (objective, files read with full paths,
findings with file:line, measures, dependencies and risks, lane plan, open questions with `Recommended:`). One `docs:`
commit with the report only, `Model:` trailer.

## HARD STOP

After the report commit with `Outcome: done` and a clean tree.

## RIFERIMENTI

`docs/decisions.md` R-OI-1, R-OI-5, R-OI-8, R-OI-10, R-OI-18, R-MT-*; `docs/discovery/discovery_2026-11-08_onto_rail_binding_declaration.md`;
`docs/sessioni/sessione_2026-11-08_instance-of.md`; CLAUDE.md §3.1, §3.2.
