# Instance-of: discovery for multilevel instantiation in the instantiation STC (level and potency roles)

Prompt-ID: P-2026-11-16-0205
Chat: C-2026-10-25-2159
Front: instance-of
Lane: discovery (read-only; one report; throwaway probe runs allowed, never committed)
Status: da eseguire
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-16 01:53-02:00: the instantiation STC is its own STC, separate from the simulator's; multilevel goes into it with `level` and `potency` roles, tested on a clabject metamodel; «vai adesso in /lane auto ma non ti fermare e prosegui dritto dritto fino all'implementazione»)
Depends: P-2026-11-09-1209 (oi-rail on the trunk)
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-ml`, branch `oi-multilevel`, its tip this prompt's `docs:` commit, whose parent is `0efb75552`
(trunk). Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and
tier: heavy, effort `xhigh`. **Read-only**: the only committed file is the report. Probe ports outside 3000, 3001, 3005,
3015; assets under `/tmp`.

## Lane discipline

Every reply opens with `[P-2026-11-16-0205 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 60 minutes.

- **Context economy**: grep and windows of at most 50 lines; never `EditorV2.tsx`, `instantiate.ts` or `reducer.ts` whole;
  never a whole log. Write the report skeleton early and commit the report as soon as it stands alone; an addendum may
  follow. At the ceiling, `handoff.md` and `Outcome: hard-stop`.

## Background

R-OI-1 (ratified 2026-10-20): two ontological levels inside one linguistic level; deep instantiation, potency and a third
level out of scope but **not to be precluded**. Alfonso, 2026-11-16, now wants the third level and beyond. Today: the
instantiation STC is `_state.ontoBindings` (`model/ontological/bindingCodec.ts`, `bindingReader.ts`, `bindingCheck.ts`,
`bindingDetect.ts`, `classRail.ts`), records `object` and `link` with roles typeReference, featureContainer, slotContainer,
definingFeature, valueHolder, generalization, abstractFlag, featureType, defaultValue, valueKinds, featureSources;
consumers: `hooks/instantiate.ts` (instantiate, slots, ghost rows, queue), `problems/instantiationToProblems.ts`, the
«Instances of» and class rails, the pane menu, S4 links, the DCN (`dcnToProblems.ts`, `model/simulation/dcn/*`,
R-DCN-1). The viewpoint level is `_state.ontoLevel` = `class | instance | both` (R-OI-19, R-OI-20). The instantiation STC
is separate from the simulator's STC and stays so (Alfonso, 01:51): no shared catalog.

UML is not a multilevel language (an InstanceSpecification is not a Classifier); the test bed is a new minimal clabject
metamodel, e.g. ProductType → Product → item (Atkinson and Kühne's deep instantiation, Melanee/DeepJava style): a
Clabject metaclass that is both type and instance, with a `type` reference to a Clabject one level up, owned fields with
a `potency`, and slots for the fields its type's chain makes due at its level.

## COSA (questions the report answers, with file:line and measures where possible)

1. **Roles.** Which roles the clabject metamodel needs in the codec: whether the existing roles suffice when
   typeReference points from a clabject to a clabject (the same metaclass on both ends), and the new ones: `level`
   (declared integer feature, or derived: level(x) = level(type(x)) - 1, roots declared) and `potency` (on fields and on
   clabjects; a field with potency p becomes a slot p levels below, or at each level down to p, per the deep
   instantiation rule you choose to propose). Codec, reader and check changes; byte-equal round trip of today's UML and DCN
   bags (prove with the existing tests and a measure).
2. **Consumers with three levels.** What in `instantiate.ts` (slot synthesis, ghost rows, defaults), `instantiationToProblems.ts`
   (missing, orphan, cycle, O3, O5), the rails and the pane menu assumes «class above, object below», and the smallest
   change to make each level-generic. What S4 links mean across levels (a link's ends at the same level).
3. **Viewpoint level.** From `class | instance | both` to an integer (or a set of integers), aliases class = top, instance =
   bottom, both = all; R-OI-19/20 kept; where `ontoLevelOf` and the five gating points change.
4. **The clabject fixture.** A minimal metamodel and model to ship as a fixture (`~/jjodel-demo-exports/mlm-clabject/` or
   built by a probe): its classes, its binding, and two viewpoints or one viewpoint per level; how the existing «Derive
   viewpoint» or the UML views could draw it.
5. **Critical zone and core.** Files in CLAUDE.md §3.1/§3.2, `reducer.ts`, exported interfaces (should not change).
6. **Lane plan.** Implementation lanes in order (codec and reader; consumers; viewpoint level and rails; fixture and
   probe), each with files, tests, probe checks, crops; the decision rows to write (R-OI-25 onward, and the amendment of
   R-OI-1's scope clause, recorded as Alfonso's 2026-11-16 decision); the open questions, each with `Recommended:` (the
   chat adopts the recommended answers unattended).

## Output

`docs/discovery/discovery_2026-11-16_onto_multilevel_level_potency.md` (objective, files read with full paths, findings
with file:line, measures, dependencies and risks, lane plan, open questions with `Recommended:`). `docs:` commits with
the report only, `Model:` trailer.

## HARD STOP

After the report commit(s) with `Outcome: done` and a clean tree.

## RIFERIMENTI

`docs/decisions.md` R-OI-1..24, R-DCN-1, R-DCN-3; `docs/discovery/discovery_2026-11-08_onto_levels_class_rail_links.md`;
`docs/discovery/discovery_2026-11-08_onto_rail_binding_declaration.md`; `docs/archivio/claude_2026-10-14_uml_class_object_notation.md`;
CLAUDE.md §3.1, §3.2.
