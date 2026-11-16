# Ontological instantiation, multilevel L2: consumers of the due features

Prompt-ID: P-2026-11-16-0300
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (critical zone `editor-v2/problems/`: Layer Impact Report owed; no core change)
Status: da eseguire
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-16 02:00: «vai adesso in /lane auto ma non ti fermare e prosegui dritto dritto fino all'implementazione»; the chat takes it as the critical-zone go-ahead for this front's planned lanes, L2 among them, and adopts the discovery's recommended answers unattended, RC-21)
Depends: P-2026-11-16-0232
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-ml`, branch `oi-multilevel`, its tip this prompt's `docs:` commit, whose parent is `a719ee51c`
(L1 closed). Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`.
Model and tier: heavy, effort `xhigh`. Probe ports outside 3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-16-0300 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 90 minutes.

- **Context economy**: short tool output; grep and windows of at most 60 lines; never a whole diff, never a whole
  `instantiate.ts`. Commit the code as soon as its gates are green, before the probes. Near the ceiling, write
  `handoff.md` in the lane folder (exact next commands, mutants still to run) and stop with `Outcome: hard-stop`.
- One test or probe run per call; `uptime` in a separate call before each probe, start it only with the 1-minute load
  under 20; never a sleep over 60 s. Probe assets under `/tmp`.
- Code, probe and docs in separate commits (RC-13). Subjects at most 72 characters, `Model:` trailer.
- No push, no merge. No edit to `reducer.ts`, `useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`,
  `portDistribution.ts`, `useM1ReferenceEdges.ts`, `VersionFixer.tsx`, `editor-v2/viewpoint/ir/`. Exported interfaces:
  only the two new members of `InstantiationFindingKind` (discovery §3.5); anything else, stop with `Outcome: question`.
- First reply: the **Layer Impact Report** (critical zone `editor-v2/problems/`) and the list of files with what changes
  in each (rule 19), then proceed.

## Source

`docs/discovery/discovery_2026-11-16_onto_multilevel_level_potency.md`, §3.2, §3.5 and **§6 item 2 (L2)**; L1's reader
API in `model/ontological/bindingReader.ts` (`dueFeatures`, `ontoLevel`, `typeChain`, `clabjectPotency`,
`featurePotencyOf`) and L1's entry in `docs/log-inbox/instance-of.md`. Adopted answers (§7, RC-21) bearing on this lane:
a field with potency below 1 or above its owner's never becomes a slot and raises a warning; a link's ends sit at one
level; no ghost-anchor change (the fixture puts slots first).

## COSA

1. `hooks/instantiate.ts`: `synthesisPlan` (`:504`) and `instanceRows`/ghost rows (`:663`) on `dueFeatures`;
   `linkOptions` (`:531`) also requires `ontoLevel(source) === ontoLevel(target)`. Nothing else in this file (L3 owns the
   level filter of the creation options).
2. `problems/instantiationToProblems.ts`: kinds `type-cycle` (error, one per cycle, anchored on its members) and
   `potency` (warning, on the field); the orphan text gets the variant «… is due N levels below» (or above) when the
   feature is in the type chain at another level. `InstantiationProblemSync.tsx:84` keeps working unchanged.
3. Tests: the two test files extended: three-level synthesis (`Book` gets `taxRate`, `mobyDick` gets `isbn`, `price`),
   the link same-level rule, both new kinds, the orphan variant, UML two-level outputs unchanged (pin them). Gates:
   typecheck 0; the ontological suite, `instantiate.test.ts`, `undoGroup.test.ts`, the problems tests green;
   `npm run build` 0. Code commit.
4. Probe regression on UML (`UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`), one run each and unchanged:
   `onto-s2-instantiate.ts` (57/57), the S4 links probe (14/14), `onto-s3a-slot-problems.ts` (8/8),
   `onto-s3b-ghost-rows.ts` (6/6). The cost of `instantiationToProblems` at 200 instances on the store, before and after
   (median of 5), in `bench.txt`. `chore(probe)` commit only if a probe file changed.
5. Mutants, each red and reverted, to `~/.jjodel-lanes/P-2026-11-16-0300/bench.txt`: synthesis back on
   `featureClosure`; the same-level guard dropped; the `potency` finding never emitted.
6. Docs commit: `docs/decisions.md` row **R-OI-30** (2026-11-16, provisional, unattended, decided by the chat on
   Alfonso's 02:00 instruction, reversible: branch): a link's two ends at one level, its association one level above;
   the two new finding kinds. `parseRows` reads it. One entry in `docs/log-inbox/instance-of.md` (critical-zone go-ahead
   recorded as above); flip this prompt's `Status:`. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier with `Outcome: question` as stated, or if a UML
probe count changes.

## RIFERIMENTI

The discovery report above; `docs/decisions.md` R-OI-1..28; CLAUDE.md §3.1, §3.2, rules 11, 12, 19 and 28.
