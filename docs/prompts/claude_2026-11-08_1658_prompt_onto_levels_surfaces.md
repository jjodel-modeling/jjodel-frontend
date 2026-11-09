# Ontological instantiation, levels lane 1: level-aware creation surfaces

Prompt-ID: P-2026-11-08-1658
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (no §3.1 file; one Advanced control in the viewpoint properties)
Status: eseguito 2026-11-08 · lane full · b8fbddd72
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 12:25 findings 1-3; 16:03 «decidi tu»: the level is declared by the viewpoint; the discovery's recommended answers adopted unattended, RC-21)
Depends: P-2026-11-08-1635
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `4d736d663`.
Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier:
heavy, effort `xhigh`. Alfonso's dev server runs from this worktree on port 3005 and reloads on save: do not stop it;
probe ports outside 3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-08-1658 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 90 minutes.

- **Context economy**: grep and windows of at most 50 lines; never a whole diff, never `EditorV2.tsx` or
  `PalettePanel.tsx` whole, never a whole probe log (grep its summary lines). **Commit the code as soon as its gates are
  green**, before the probes. At the ceiling, write `handoff.md` in the lane folder and stop with `Outcome: hard-stop`.
- `uptime` in a separate call before each probe; start only with the 1-minute load under 20; never a sleep over 60 s.
  One probe run per call. If a probe rewrites committed assets under `docs/discovery/assets/`, restore them.
- Code, probe and docs in separate commits (RC-13). Subjects at most 72 characters, `Model:` trailer.
- No push, no merge. No edit to a CLAUDE.md §3.1 or §3.2 file (`viewpoint/ir/` included), to `reducer.ts`, or to an
  exported interface beyond optional props; if one becomes necessary, stop with `Outcome: question`.
- First reply: the list of files and what changes in each (rule 19).

## Source

`docs/discovery/discovery_2026-11-08_onto_levels_class_rail_links.md` (this branch), §3, §5, §8 **lane 1**, §12.
Implement lane 1 as written there. Answers adopted (RC-21, Alfonso to be told):
- Q1: the level is `_state.ontoLevel` on the viewpoint, values `class | instance | both`; absent reads as `both`
  (today's behaviour); the control never deletes the key.
- Q2: at `class` the pane menu shows nothing in this lane (lane 2 adds «New ▸ <metaclass>»).
- Read the level through **the tab's viewpoint** (R-MT), never through `useIRInteractionPlan` (it follows the root, §3.3).
- At `class`, the «Declare binding…» empty state is hidden until lane 2 gives it a home.

## COSA

1. `ontoLevelOf(get, viewpointId)` (pure, in `hooks/instantiate.ts`) and its tests (undefined, null, no key, each
   value; a mutant per guard). The five gating points of §5 in `EditorV2.tsx`: the pane menu «New instance of ▸», the
   class node menu «New instance», the «Instances of» section, its drop branch and its click. The select in
   `ViewpointProperties.tsx`, Advanced only, one undo entry per change. Gates: typecheck 0; the new tests,
   `instantiate.test.ts`, `undoGroup.test.ts`, `bindingDetect.test.ts` green; `npm run build` 0. Code commit.
2. Probe checks (in `onto-s2-instantiate.ts` or a new `onto-levels.ts`) on
   `UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`, after setting «UML class diagram» to `class` and
   «UML object diagram» to `instance` through the new control: on the class tab no pane menu, no section, no node «New
   instance», a synthetic drop writes nothing; the object tab and a viewpoint with no level keep R-OI-18's S2 suite
   (28/28); the control's write is one undo entry and undoes cleanly. Regression, one run each: `onto-s3a-slot-problems.ts`,
   `onto-binding-editor.ts`. Crops (`sips -Z 1200` only if larger) to `~/.jjodel-lanes/P-2026-11-08-1658/crops/`: the
   rail and the right-click on the empty pane on the class tab, the same on the object tab, the control in the viewpoint
   properties. `chore(probe)` commit.
3. Docs commit: rows **R-OI-19** (the level, `_state.ontoLevel`, three values, absent = both) and **R-OI-20** (the gating
   points; amends R-OI-10 and R-OI-18), both 2026-11-08, provisional, decided by the chat on Alfonso's «decidi tu»,
   reversible: branch; `parseRows` reads them. One entry in `docs/log-inbox/instance-of.md` for P-2026-11-08-1605,
   P-2026-11-08-1635 and this lane (adopted Q1, Q2, Q4, Q6, Q7 as recommended; Q5 asked to Alfonso). Flip `Status:` of
   the three prompts. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier with `Outcome: question` as stated.

## RIFERIMENTI

The discovery report above; `docs/decisions.md` R-OI-1, R-OI-10, R-OI-18, R-MT-*; CLAUDE.md §3.1, §3.2, rule 19.
