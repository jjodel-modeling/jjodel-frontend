# Ontological instantiation, multilevel L4: the clabject fixture and its probe

Prompt-ID: P-2026-11-16-0430
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (probe scripts and a demo export only; no product code)
Status: eseguito 2026-11-16 · lane full · 0901f717d (continued by P-2026-11-16-0500)
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-16 02:00: «vai adesso in /lane auto ma non ti fermare e prosegui dritto dritto fino all'implementazione»; tested on a clabject metamodel ProductType → Product → item; the discovery's recommended answers adopted unattended, RC-21)
Depends: P-2026-11-16-0410
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-ml`, branch `oi-multilevel`, its tip this prompt's `docs:` commit, whose parent is `1b247fe8a`
(L3 closed). Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`.
Model and tier: heavy, effort `xhigh`. Probe ports outside 3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-16-0430 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 90 minutes.

- **Context economy**: short tool output; grep and windows of at most 60 lines; never a whole diff, never a whole
  product file. Read `dcn-drone-fixture.ts` and `uml-class-object-fixture.ts` in windows, for the pattern only.
  Commit the fixture as soon as it builds and exports, before the checks. Near the ceiling, write `handoff.md` in the
  lane folder and stop with `Outcome: hard-stop`.
- One probe run per call; `uptime` in a separate call before each probe, start it only with the 1-minute load under 20;
  never a sleep over 60 s. Probe assets under `/tmp`. **Each project in its own fresh browser context** (L3 found two
  projects in one page share a metamodel id).
- Product code (`frontend/src`) is out of scope. If a check fails for a real product defect, record it with the failing
  check and its measure, and stop with `Outcome: question` and a `Recommended:` fix (file, lines, test); do not fix it.
- Probe, export and docs in separate commits (RC-13). Subjects at most 72 characters, `Model:` trailer. The export is
  not committed.
- No push, no merge.
- First reply: the list of files with what each contains (rule 19), then proceed.

## Source

`docs/discovery/discovery_2026-11-16_onto_multilevel_level_potency.md` §3.4 (the `MLM` metamodel, the binding record
with `potency` and `featurePotency`, the model ProductType → Book / DVD → mobyDick, the three level viewpoints, the
Clabject node with the slots compartment first) and **§6 item 4 (L4)**; L1..L3's entries in
`docs/log-inbox/instance-of.md`; L3's level probe `scripts/probe/onto-ml-levels.ts` (or the name it used) for the
three-level setup.

## COSA

1. `scripts/probe/mlm-clabject-fixture.ts` on the pattern of `dcn-drone-fixture.ts`: builds the `MLM` metamodel, the
   binding, the model and the viewpoints («MLM / level 0», «level 1», «level 2», `ontoLevel` `'0'`, `'1'`, `'2'`; the
   default stays `both`) through the app, and exports to `~/jjodel-demo-exports/mlm-clabject/mlm-clabject.jjodel`.
   `chore(probe)` commit with the fixture.
2. `scripts/probe/onto-mlm.ts` on that export, checks numbered M0..Mn: an unset `EInt` reads `undefined`; at level 1,
   «Instances of ▸ ProductType» creates `Book` with exactly one slot (`taxRate`); at level 2, an instance of `Book`
   gets `isbn` and `price` and no `taxRate`; `mobyDick` (potency 0) is absent from the rail, the pane menu and the
   node menu at every level; a slot one level off shows as an orphan with the «… levels below» text; the ghost rows of
   a clabject land under its slots compartment; one Cmd+Z after a creation removes it whole. Regression, one run each:
   `onto-s2-instantiate.ts` (57/57) on `UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`. Crops
   (`sips -Z 1200`) to `~/.jjodel-lanes/P-2026-11-16-0430/crops/`: the three level viewpoints on the canvas, `Book`
   with its slot, the instance of `Book` with its two slots. `chore(probe)` commit.
3. Mutants on the probe's view of the product, each red and reverted, to
   `~/.jjodel-lanes/P-2026-11-16-0430/bench.txt`: `dueFeatures` back on `featureClosure` (in `instantiate.ts`
   synthesis); the potency-0 gate dropped in `instantiableClassifiers`; the level filter dropped. Revert each with
   `git checkout -- <file>` and check `git status` clean after.
4. Docs commit: `docs/decisions.md` row **R-OI-31** (2026-11-16, provisional, unattended, decided by the chat on
   Alfonso's 02:00 instruction, reversible: branch): the clabject fixture, its viewpoints, its probe as the acceptance
   of multilevel. `parseRows` reads it. One entry in `docs/log-inbox/instance-of.md`; flip this prompt's `Status:`.
   `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier with `Outcome: question` as stated.

## RIFERIMENTI

The discovery report above; `docs/decisions.md` R-OI-1..30; `scripts/probe/dcn-drone-fixture.ts`,
`scripts/probe/uml-class-object-fixture.ts`; CLAUDE.md rules 19 and 28.
