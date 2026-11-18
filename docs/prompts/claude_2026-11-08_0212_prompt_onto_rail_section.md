# Ontological instantiation, lane A: the «Instances of» rail section

Prompt-ID: P-2026-11-08-0212
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (a new creation surface: Layer Impact Report owed; no core change)
Status: eseguito 2026-11-08 · lane full · ba69124a9
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 00:35: «rail e dichiarazione e procedi in /lane auto»; the discovery's recommended answers adopted unattended, RC-21)
Depends: P-2026-11-08-0151
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `5ae75efd0`
(lane B closed). Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome:
blocked`. Model and tier: heavy, effort `xhigh`. Alfonso's dev server runs on port 3005 from `~/jjodel-release`: do not
stop it; probe ports outside 3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-08-0212 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 90 minutes.

- **Context economy**: lane B hit the context ceiling. Short tool output; grep and windows of at most 60 lines; never a
  whole diff, never `EditorV2.tsx` or `PalettePanel.tsx` whole. Commit the code as soon as its gates are green, before
  the probes. If you approach the ceiling, write `handoff.md` in the lane folder and stop with `Outcome: hard-stop`.
- One test or probe run per call; **check `uptime` in a separate call before each probe** and start it only with the
  1-minute load under 20 (lane 0151 breached this by running both in one call); never a sleep over 60 s. Probe assets
  under `/tmp`; if a probe rewrites committed assets under `docs/discovery/assets/`, restore them before committing.
- Code, probe and docs in separate commits (RC-13). Subjects at most 72 characters, `Model:` trailer.
- No push, no merge. No edit to `reducer.ts`, a CLAUDE.md §3.1 or §3.2 file, `problems/`, or an exported interface; if
  one becomes necessary, stop with `Outcome: question`.
- First reply: the Layer Impact Report and the list of files with what changes in each (rule 19), then proceed.

## Source

`docs/discovery/discovery_2026-11-08_onto_rail_binding_declaration.md` (this branch), §3.1 to §3.3, §4 and **§5 lane
A**: implement lane A as written there (files, the drag key as a module constant, tests, bench, probe checks S2-R0..R4,
crops). Decisions adopted from §6 (Alfonso away, RC-21):
- Q1: the `link` group is listed, its items disabled, tooltip «A link is drawn between two instances (S4)»; no drop of an
  unconnected link.
- Q2: in Basic mode the section shows only when a binding is declared; the empty state with «Declare binding…» shows
  in Advanced only.
- Q4: the section is titled «Instances of»; the linguistic block keeps its name.
- Q5: «Declare binding…» opens lane B's `OntoBindingModal` (`components/editor-v2/onto/`), the same modal as the
  `Info.tsx` row.

## COSA

1. Code as §5 lane A. A drop or click goes through `runInstantiate` (same queue, same deadline, one undo step, placement
   under `tabLayoutKey()`). Gates: typecheck 0; the new tests, `instantiate.test.ts`, `undoGroup.test.ts`,
   `bindingDetect.test.ts` green; `npm run build` 0. Code commit.
2. Probe checks S2-R0..R4 in `onto-s2-instantiate.ts` on
   `UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`; regression, one run each, `onto-s3a-slot-problems.ts`
   (default), `onto-s3b-ghost-rows.ts` (`uml-s3b`), `onto-binding-editor.ts`. Crops (`sips -Z 1200`) to
   `~/.jjodel-lanes/P-2026-11-08-0212/crops/`: the rail with the binding (both blocks, the gap between them, the disabled
   link group), the empty state with «Declare binding…» (Advanced), the same model in Basic without binding (no
   section), the canvas after a drop with the node at the cursor. `chore(probe)` commit.
3. Mutants, each red and reverted: the abstract filter dropped; the re-read of the record by name dropped; the drop
   bypasses `runInstantiate` (calls `instantiate()` without the tab key). To `~/.jjodel-lanes/P-2026-11-08-0212/bench.txt`.
4. Docs commit: `docs/decisions.md` new row **R-OI-18** (2026-11-08, provisional, unattended, decided by the chat on
   Alfonso's «rail e dichiarazione», reversible: branch): the rail section as a creation surface beside R-OI-10's pane
   menu, with Q1, Q2, Q4, Q5 as clauses; check `parseRows` reads it. One entry in `docs/log-inbox/instance-of.md`;
   flip this prompt's `Status:`. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier with `Outcome: question` as stated, or if S2-R4
(the linguistic drag) turns red.

## RIFERIMENTI

The discovery report above; `docs/decisions.md` R-OI-1..17, R-MT-*; lane B's entry in `docs/log-inbox/instance-of.md`;
CLAUDE.md §3.1, §3.2, rules 19 and 28.
