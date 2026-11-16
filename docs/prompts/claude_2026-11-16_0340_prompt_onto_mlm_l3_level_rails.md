# Ontological instantiation, multilevel L3: viewpoint level and rails

Prompt-ID: P-2026-11-16-0340
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (UI surfaces of the instance level; no critical-zone file, no core change)
Status: eseguito 2026-11-16 · lane full · fa2909f19
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-16 02:00: «vai adesso in /lane auto ma non ti fermare e prosegui dritto dritto fino all'implementazione»; the discovery's recommended answers adopted unattended, RC-21)
Depends: P-2026-11-16-0300
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-ml`, branch `oi-multilevel`, its tip this prompt's `docs:` commit, whose parent is `041d0f3a7`
(L2 closed). Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`.
Model and tier: heavy, effort `xhigh`. Probe ports outside 3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-16-0340 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 90 minutes.

- **Context economy**: short tool output; grep and windows of at most 60 lines; never a whole diff, never
  `EditorV2.tsx`, `PalettePanel.tsx` or `instantiate.ts` whole. Commit the code as soon as its gates are green, before
  the probes. Near the ceiling, write `handoff.md` in the lane folder and stop with `Outcome: hard-stop`.
- One test or probe run per call; `uptime` in a separate call before each probe, start it only with the 1-minute load
  under 20; never a sleep over 60 s. Probe assets under `/tmp`.
- Code, probe and docs in separate commits (RC-13). Subjects at most 72 characters, `Model:` trailer.
- No push, no merge. No edit to `reducer.ts`, a CLAUDE.md §3.1 or §3.2 file, `editor-v2/problems/`, or an exported
  interface (new exports are fine; `OntoLevel` stays as is); if one becomes necessary, stop with `Outcome: question`.
- `EditorV2.tsx`: only the option lists of the instance surfaces and the drop guard. The seven `=== 'class'` readers
  stay unedited (discovery §3.3).
- First reply: the list of files with what changes in each (rule 19), then proceed.

## Source

`docs/discovery/discovery_2026-11-16_onto_multilevel_level_potency.md` §3.3 and **§6 item 3 (L3)**; L1's reader
(`ontoLevel`, `clabjectPotency`, `dueFeatures`) and L2's entry in `docs/log-inbox/instance-of.md`. Adopted answers
(§7, RC-21): `instance` means every level below the top; `_state.ontoLevel` stays a string (`class`, `instance`,
`both`, `'2'`, `'1,2'`); the Attributes group shows at a level ≥ 1 for a clabject when the record's instance metaclass
conforms to the owner of `featureContainer`; the select adds «Level 0» to «Level 4» only when the binding declares
`potency` or `featurePotency`.

## COSA

1. `hooks/instantiate.ts`: `ontoLevelsOf(get, vp)` as §3.3; `ontoLevelOf` returns `'class'` exactly when the set is
   {0}; the level filter of the creation options (a classifier c is offered when `ontoLevel(c) + 1` is in the set).
2. `EditorV2.tsx`: rail «Instances of», pane «New instance of ▸», node «New instance» and the drop use the filtered
   lists; the drop re-checks the level (R-OI-20, one guard read at the drop).
3. `ViewpointProperties.tsx`: the select's extra levels, written through the existing path (`:128`).
4. `panels/PalettePanel.tsx` only if the rail needs it for the Attributes group of a clabject.
5. Tests for `ontoLevelsOf`, `ontoLevelOf` on every string form, the filter on a three-level view, UML unchanged.
   Gates: typecheck 0; the ontological suite, `instantiate.test.ts`, `undoGroup.test.ts`, the problems tests green;
   `npm run build` 0. Code commit.
6. Probes, one run each, unchanged: `onto-binding-editor.ts` (10/10), the split-pane probe (28/28), the UML level probe
   (R-OI-19/20), `onto-s2-instantiate.ts` (57/57), all on
   `UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`. Crops (`sips -Z 1200`) to
   `~/.jjodel-lanes/P-2026-11-16-0340/crops/`: the select with the extra levels on a binding with `potency` (build the
   three-level model in the probe, as L1's vitest fixture), its absence on UML, and the rail at levels 0, 1 and 2.
   `chore(probe)` commit if a probe file changed.
7. Mutants, each red and reverted, to `~/.jjodel-lanes/P-2026-11-16-0340/bench.txt`: the level filter dropped; the drop
   guard dropped; `instance` read as {1} only.
8. Docs commit: `docs/decisions.md` row **R-OI-29** (2026-11-16, provisional, unattended, decided by the chat on
   Alfonso's 02:00 instruction, reversible: branch): `ontoLevel` as a string of aliases or integers, the level filter of
   the instance surfaces, `ontoLevelOf` unchanged on the aliases, the select's extra levels. `parseRows` reads it. One
   entry in `docs/log-inbox/instance-of.md`; flip this prompt's `Status:`. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier with `Outcome: question` as stated, or if a UML
probe count changes.

## RIFERIMENTI

The discovery report above; `docs/decisions.md` R-OI-1..30; CLAUDE.md §3.1, §3.2, rules 11, 12, 19 and 28.
