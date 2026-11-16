# Session 2026-11-16: front instance-of, multilevel instantiation through the instantiation STC

Chat C-2026-10-25-2159 (session https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S), 2026-11-16 01:50 to 06:00
(Rome); `/lane auto` from 02:00 on Alfonso's «vai adesso in /lane auto ma non ti fermare e prosegui dritto dritto fino
all'implementazione». Supersedes `docs/sessioni/sessione_2026-11-08_instance-of.md` for this front.

## State at the end

- Trunk `alfonso-frontend-jjtl` at `0efb75552` (oi-s3b and oi-rail merged earlier; not pushed by the chat).
- Branch `oi-multilevel` (`~/jjodel-w-oi-ml`, from `0efb75552`), not merged, waiting for Alfonso's visual GO. Tip: the
  commit of this checkpoint, over `5ab1c3ed0`.
- Export for the visual check: `~/jjodel-demo-exports/mlm-clabject/mlm-clabject.jjodel` (not committed).

## Decisions

- Alfonso 01:53 to 02:00: the instantiation STC is its own STC, with nothing shared with the simulator's; multilevel
  through `potency` roles, tested on a clabject metamodel. Recorded as the R-OI-1 amendment.
- Discovery Q1..Q12, Recommended adopted unattended (RC-21): DeepJava exact-level potency; level derived from the type
  chain, no `level` role; roles `potency` and `featurePotency` written after `featureSources`; `instance` = every level
  below the top; `_state.ontoLevel` a string (`'2'`, `'1,2'`); Attributes group at level ≥ 1 for a clabject; a field
  with potency below 1 or above its owner's is never a slot and raises a warning; «Level 0..4» in the select only when
  the binding declares a potency role; fixture with the slots compartment first; no links in the fixture;
  `featurePotency` with `featureSources` is a check defect.
- R-OI-25..28 (L1), R-OI-30 (L2), R-OI-29 (L3), R-OI-31 (L4), all provisional, unattended, reversible (branch).
- L2 touched the critical zone `editor-v2/problems/`: Alfonso's 02:00 instruction taken as the go-ahead, Layer Impact
  Report in the lane.
- L3's own choices, accepted by the chat: the clabject Attributes group needed wiring in `EditorV2.tsx` beyond the
  option lists (a selector, a memo, two optional `PalettePanel` props, interface not exported); the select checks every
  metamodel of the project for a potency role (a viewpoint has no metamodel link); the rail's link section is filtered
  by the same level rule.

## Lanes and commits (branch `oi-multilevel`)

| Lane | Prompt-ID | Commits | Result |
|---|---|---|---|
| Discovery | P-2026-11-16-0205 | `a93e6cca6` | report `discovery_2026-11-16_onto_multilevel_level_potency.md`, 207 tests green |
| L1 codec, reader, check | P-2026-11-16-0232 | `09404b07b`, `a719ee51c` | 233 tests; UML and DCN bags byte-equal; 5 mutants red |
| L2 consumers | P-2026-11-16-0300 | `e6d9a3e87`, `041d0f3a7` | 423 tests; UML probes S2 57, S4 14, s3a 8, s3b 6 unchanged; cost at 200 instances 2.11 → 2.23 ms |
| L3 level and rails | P-2026-11-16-0340, 0410 | `fa2909f19`, `1b247fe8a` | MLM level probe 6/6; binding editor 10/10, split 28/28, S2 57/57 |
| L4 fixture and probe | P-2026-11-16-0430, 0500 | `4c44bdb15`, `ad7e3515`, `901f717d`, `2d578b899` | fixture 10/10; `onto-mlm.ts` M0..M9; 3 mutants red; S2 57/57 |
| Fixture height | P-2026-11-16-0535 | `d6c2425db`, `5ab1c3ed0` | clabject nodes size to their content; M0..M9 green on the new export |

Crops: `~/.jjodel-lanes/P-2026-11-16-0340/crops/` (select and rail at levels 0, 1, 2) and
`~/.jjodel-lanes/P-2026-11-16-0535/crops/` (the three level viewpoints, ghost rows).

## Tickets

1. Two projects opened in one page give their metamodels the same id (`…_USER_4`), found by L3's probe. Probe-only or a
   product bug when a user imports two projects in one session: to check (medium until known).
2. Carried from 2026-11-09: «Link Reference» popup title; duplicate links allowed; a drop farther than about 40 px from a
   handle does nothing silently; at level `both` one undo after a class-to-class drag leaves the object; value kinds not
   addable by hand; raw `Pointer…` ids in binding defects; five object-only roles as empty rows on `link`; five-row
   cascade fit unmeasured; atomic Prompt-ID check in lane-run.

## Next

1. Alfonso's visual check from `~/jjodel-w-oi-ml` (dev server on :3005 on request), import
   `~/jjodel-demo-exports/mlm-clabject/mlm-clabject.jjodel`: viewpoints «MLM / level 0», «level 1», «level 2»; at level
   1 «Instances of ▸ ProductType» creates a clabject with the one slot `taxRate`; at level 2 an instance of `Book` gets
   `isbn` and `price`; `mobyDick` is offered nowhere; the select shows «Level 0..4» on MLM and not on UML. Then UML
   unchanged on `uml-s3b`.
2. After the GO: merge `oi-multilevel` into the trunk (merge lane), push by Alfonso.
3. Retire `~/jjodel-w-oi-rail` (already merged) on Alfonso's yes.
4. Then the notation slice on `oi-notation`.

## Lessons

- Four of six implementation lanes hit the context ceiling; each continuation from `handoff.md` finished in one run.
- A probe must open each project in its own fresh browser context.
- Probe clicks read a node's box from the DOM after fitting the view; a fixed point misses nodes off-screen.
