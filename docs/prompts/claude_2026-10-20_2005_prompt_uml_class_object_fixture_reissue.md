# UML class and object diagrams (reissue): a fixture that builds the project and exports it

Prompt-ID: P-2026-10-20-2005
Chat: C-2026-10-20-1835
Request: https://claude.ai/code/session_015eDtjagjBtuPHhhhfUTTo5 (reissue; the original request of 2026-10-14 is quoted in P-2026-10-14-1955)
Front: instance-of
Lane: fast (one new probe file, no app code), unattended (RC-21)
Depends: none
Status: non completato 2026-10-20 · lane uml-fixture · context ceiling before any probe run, nothing committed · continued by P-2026-10-20-2330
Corregge: P-2026-10-14-1955, stopped on 2026-10-14 by an API rate limit after about 18 minutes with nothing committed; this prompt replaces it unchanged in scope

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-umlfixture`, branch `uml-fixture`, created from the trunk commit that adds this file, `frontend/node_modules` symlinked (P14). Before anything else check `pwd`, the branch and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-20-2005 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`; a question with one recommendation inside this perimeter is answered as recommended and recorded (unattended). Do not touch the `Status` line.

## Contesto (non rifare l'analisi)
The design is decided: `docs/archivio/claude_2026-10-14_uml_class_object_notation.md` (metamodel §2, viewpoints §4, rules §5, example §6). Read it whole. The scenes in `~/jjodel-demo-exports/graphvertex/` were made the same way this lane works: `frontend/scripts/probe/bpmn-lanes-fixture.ts` and `statechart-fixture.ts` build a project in the real app through the L-API and the canvas sync, and with `GV_SAVE` export it as the File menu's Download Project does (`saveScene`). Reuse their exported helpers (`openPage`, `createProject`, `buildModelShell`, `buildObjects`, `buildLinks`, `buildViewpoint`, `pickViewpoint`, `readNodes`, `readEdges`, `shoot`, `ev`, `saveScene`). Enumerations and typed attributes: `pkg.addEnumerator`, `en.addLiteral`, `cls.addAttribute(name, type)` with `Pointer_ESTRING`, `Pointer_EINT`, `Pointer_EBOOLEAN` or an enumeration id, as in `sim-event-attrs-browser.ts`. The IR vocabulary is in `viewpoint/ir/irTypes.ts` (FieldCompartmentSpec with a `children` source and RowViewIR, EdgeViewIR with object-as-edge `source`/`target` paths, terminations `hollowTriangle`, `filledDiamond`, `hollowDiamond`, end labels with multiplicity, TextStyle `underline`).

## COSA
1. New file `frontend/scripts/probe/uml-class-object-fixture.ts`. It builds, on its own dev server: the metamodel of §2 (package `UML`), the two viewpoints of §4 with one view per drawn metaclass plus a `visible: false` view for every metaclass the viewpoint does not draw, and the example model of §6 in one M1 model (class diagram nodes at x < 1300, object diagram nodes at x >= 1400, no two drawn boxes overlapping in either viewpoint).
2. With `GV_SAVE` set it exports the project, named `UML class and object diagrams`, to `~/jjodel-demo-exports/uml/uml-class-object.jjodel`, before any check that mutates the model.
3. It implements the rules C1..C9 and O1..O8 of §5 as checks on the store and asserts: all pass on the example (warnings reported, not failed); then, one at a time on the built model and undone after, each of these seeded violations is caught by its rule and by no other error rule: `nature` classified by Publication (O1); the year of `dune` as a LiteralString (O5); a second Member `bob` with a Borrowing link to `dune` (O7); a generalization from Publication to Book (C1); the `library` end of Holdings with upper -1 (C7).
4. DOM checks per viewpoint (P8, node transform and DOM text, never screenshots): class diagram draws 9 nodes (5 classes, Genre, 3 primitive types) and 5 edges and no InstanceSpecification; Book's rows read `- isbn : String` and `- genre : Genre`; Publication is marked abstract; Genre lists its three literals; the Generalization ends in a hollow triangle at Publication; Holdings has a filled diamond at Library, Membership a hollow one; end labels `0..*` and `0..3` are drawn. Object diagram draws 5 nodes and 5 edges and no Class; the header of `dune` reads `dune : Book` and is underlined (record where the computed `text-decoration` sits); `dune` shows `genre = fiction`.
5. Round trip: in a fresh page, Import Project of the exported file, open the model, both viewpoints give the same node and edge counts.
6. Screenshots of both viewpoints, light theme only, in `docs/discovery/assets/uml-class-object/`, with the measures JSON.

When the IR cannot express a rendering of §4 (visibility symbol, multiplicity hidden for 1..1, parameter list, italic on a condition, a predicate on a path), take the closest expressible fallback, make the check assert the fallback, and append one line per fallback to §7 of the design file. Never change app code to get there: an IR gap is a ticket in the log entry.

## COME
- Run: `node frontend/scripts/lane-run.mjs probe ~/jjodel-w-umlfixture frontend/scripts/probe/uml-class-object-fixture.ts --port 3085 --id P-2026-10-14-1955` with `GV_SAVE=~/jjodel-demo-exports/uml`. Never ports 3000 or 3001.
- Gates (reduced, fast lane): `npx tsc --noEmit` at its baseline of 14, `npm run check:docs`.
- Before naming the metaclasses and literals, check them against `jjscript/reservedIdentifiers.ts` and `TYPE_ALIASES`; keep the UML names (the fixture uses the L-API, not JjScript) and list in the entry which ones a JjScript user could not reference.
- Commits with explicit pathspec and the `Model:` trailer: the fixture and the assets in one commit, the design file §7 lines in a docs commit. One inbox entry in `docs/log-inbox/uml-fixture.md`. Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

## NON FARE
- No file under `frontend/src`. No §3.2 file. No change to the two existing fixtures. No new dependency, no `irVersion` bump.
- No `git stash`, no `git add .`, no push.

## HARD STOP
After the commits, with the probe green, the export written and the round trip passed, stop with `Outcome: hard-stop`. The chat verifies, and Alfonso gives the visual GO on the imported project.

## RIFERIMENTI
`docs/archivio/claude_2026-10-14_uml_class_object_notation.md`; `frontend/scripts/probe/bpmn-lanes-fixture.ts`, `statechart-fixture.ts`, `sim-event-attrs-browser.ts`; `viewpoint/ir/irTypes.ts`; spec addendum edge authoring and graphVertex in `docs/spec/`; R-VAL in `claude/spec_attive.md` for why the rules run in the probe.
