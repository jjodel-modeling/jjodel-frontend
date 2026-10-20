# Ontological instantiation in one model: creation menu, slot synthesis, links (discovery)

Prompt-ID: P-2026-10-20-1835
Chat: C-2026-10-20-1835
Front: instance-of
Lane: full (new service in the editor, the slot synthesis may touch the instance creation path; Phase 1 read-only)
Status: eseguito 2026-10-20 · lane oi-discovery · report ad405b00b, log dda6af79c · no visual check (Phase 1, no product code)
Request: none (the chat URL is not available to the chat; Alfonso's words are kept in request.md, RC-43)
Depends: none
Corregge: —
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oidisc`, branch `oi-discovery`, cut from `alfonso-frontend-jjtl` at the commit that adds this
prompt, `frontend/node_modules` symlinked (P14). Model and tier: heavy, as pinned (RC-16), effort `xhigh`. Before
anything else check `pwd`, the branch and a clean `git status`; otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-10-20-1835 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Every gate runs in the foreground (P16). No push, no merge. This is Phase 1 only: it ends with a hard stop on the
discovery report; no product code is edited. Nothing of this front enters release 3.2 (freeze 2026-10-23).

## COSA

Alfonso wants a UML class diagram editor and an object diagram editor in Jjodel, built on one metamodel that defines
both classes and instances of classes (UML `InstanceSpecification` and `Slot`). The decisions are R-OI-1..5 in
`docs/decisions.md`; read them first. In short: one M1 model holds classes and instances (two ontological levels in one
linguistic level); the instantiation is a relation declared on the metamodel and known to Jjodel as such, with roles
(type reference, feature container, optional generalization, slot container, defining feature, slot value holder);
three services hang on it: (1) a creation menu that offers the instantiable classes of the model, (2) slot synthesis
when an instance is created, inherited features included, (3) non-destructive reconciliation when a class changes
(ghost rows, orphan slots as problems, an explicit «sync slots» action). Links as instances of associations come in a
later slice, but the discovery must design for them now. Deep instantiation and potency are out of scope, and the design
must not preclude them.

The first client already exists on paper: `docs/archivio/claude_2026-10-14_uml_class_object_notation.md` (metamodel
§2, viewpoints §4, rules C1..C9 and O1..O8 §5, example §6, deviations §7). Its fixture lane P-2026-10-14-1955 runs in
parallel and builds that project through the L-API (`frontend/scripts/probe/uml-class-object-fixture.ts`); do not edit
it, do not wait for it. Note what that metamodel implies: `EnumerationLiteral` is an `InstanceSpecification`, links are
`InstanceSpecification`s classified by an `Association`, values are `ValueSpecification` objects, not EAttribute values.

Answer each question with file and line evidence, and a number where one exists:

1. **Where the relation is declared.** Compare at least: annotations on the metaclasses and references of the
   metamodel (what Jjodel stores today, `annotations` in `frontend/src/joiner/classes.ts`, and whether it round-trips
   through export, import and Ecore); a project-level role binding like the Simulation roles of the simulator
   (`frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `simRolesDraft.ts`, the STC); the `type-reference` role
   of JjScript dependencies (`frontend/src/jjscript/executor/dependencies.ts:33`). Recommend one, and say how a second
   application of the relation (a third ontological level) would be declared without changing the first.
2. **The creation menu.** List every place where the user creates an M1 object today (palette, canvas context menu,
   outline, properties panel, keyboard), with the component and the call it makes. Recommend where the «New instance of
   ▸ <Class>» entry goes and what it lists: concrete classes only, closure over the generalization, how enumerations and
   associations are excluded or routed (O1).
3. **Slot synthesis.** Trace the creation of an M1 object down to the store (L-API `addObject`, `DObject.new`, the canvas
   sync). Find the narrowest point where creating the instance and its slots is one undoable step. State whether that
   point is in the critical zone (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`,
   `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`); if it is, write the Layer Impact Report draft and propose the
   alternative that avoids it. Say how a slot gets its default value (`Property.defaultValue`) and its value object type.
4. **Reconciliation and ghost rows.** How a view can show a row for a feature that has no slot object (IR
   FieldCompartmentSpec with a `children` source in `viewpoint/ir/irTypes.ts`, or a derived source), and what writing the
   first value into a ghost row must do. How an orphan slot reaches the problems registry
   (`frontend/src/components/editor-v2/problems/`, the existing `*ProblemSync.tsx`), and where the «sync slots» quick fix
   would live.
5. **Conformance.** Can O1..O8 run as user-defined validation today (R-VAL), or only as built-in checks? Which ones need
   the relation to be known (O2, O5 need the closure over generalization). R-VAL-4 holds: nothing blocks a write.
6. **Links.** How the link menu would offer only the associations whose member ends accept the types of the two
   instances, and whether drawing an edge between two instances on the canvas can route to it.
7. **Genericity check.** Pick one non-UML metamodel already in the repository or the gallery where the same relation
   applies (for example an ER or a Petri net type/instance split) and show the role binding it would need. If none
   exists, say so.

## DOVE

Read anything. Write only `docs/discovery/discovery_2026-10-20_ontological_instantiation.md`, the discovery report
(mandatory, CLAUDE.md: objective, files read with full paths, findings per question, dependencies and risks, open
questions for Alfonso, and a Phase 2 plan in slices, each slice with its files, whether it touches the critical zone,
and its acceptance checks). Expected slices, to confirm or redraw: S1 declaration of the relation and its reader; S2
creation menu and slot synthesis; S3 ghost rows, orphan problems, «sync slots»; S4 links; S5 conformance rules.

## COME

1. Baseline: `npm run typecheck` through `node scripts/run-quiet.mjs` from `frontend/` (zero errors expected, RC-48).
2. Read, trace, and where a claim depends on runtime behaviour, measure it with a throwaway probe run by
   `lane-run probe` and not committed; record the command and the number in the report.
3. Commit the report alone in one `docs:` commit (`git add` by path, `Model:` trailer, P6), then hard stop.

## RIFERIMENTI

R-OI-1..5 and R-VAL-4 (`docs/decisions.md`); `docs/archivio/claude_2026-10-14_uml_class_object_notation.md`;
`docs/prompts/claude_2026-10-14_1955_prompt_uml_class_object_fixture.md`; the Simulation roles (R-SIM) as the precedent
for roles declared on a metamodel; R-NEST-1 for the list of objects of a model; the literature names the pattern
type-object, and the orthogonal classification architecture (Atkinson, Kühne) frames it as two ontological levels in
one linguistic level.
