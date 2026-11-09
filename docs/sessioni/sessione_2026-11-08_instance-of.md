# Session 2026-11-07/08: front instance-of, oi-s3b on the trunk, binding editor and «Instances of» rail

Chat C-2026-10-25-2159 (session https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S), from 2026-11-07 15:10 to
2026-11-08 03:10 (Rome); `/lane auto` from 00:35. Supersedes `docs/sessioni/sessione_2026-11-07_instance-of.md` for this
front.

## State at the end

- Trunk: `oi-s3b` (with `oi-s2u` and `oi-s3a`) merged as `e5add4d95` (P-2026-11-07-1834), pushed with the trunk;
  Status flip and log entry `f9c15fbb2` (not yet pushed). Rollback tag `pre-oi-s3b` on `f5fc80aaf`.
- Branch `oi-rail` (`~/jjodel-w-oi-rail`), tip the commit of this checkpoint, not merged, waiting for Alfonso's
  visual GO:
  - discovery P-2026-11-08-0049, report `e138a09ca`
    (`docs/discovery/discovery_2026-11-08_onto_rail_binding_declaration.md`);
  - lane B, binding editor with «Detect»: code `c55874212` (P-2026-11-08-0113), probe `d680fce0d` and docs `5ae75efd0`
    (P-2026-11-08-0151). `onto-binding-editor.ts` 10/10; one Cmd+Z after Confirm removes the key, one after Remove
    restores the bag byte-equal; mutants 3/3 red;
  - lane A, «Instances of» rail: code `910558ef4` (P-2026-11-08-0212), probe `ba69124a9` and docs with R-OI-18
    `0688d25fa` (P-2026-11-08-0241). S2 28/28 with S2-R0..R4; s3a 8/8, s3b 6/6, binding editor 10/10; mutants 3/3 red.
- Branch `oi-notation` (`~/jjodel-w-oi-notation`, `cfd39d6c5`): the object diagram visual reference in
  `docs/archivio/claude_2026-10-14_uml_class_object_notation.md` §4 (Alfonso «ok» 00:57). Base of the notation slice.
- Dev server for Alfonso on http://localhost:3005 from `~/jjodel-w-oi-rail` (restarted 03:02).
- Lane C (fixture `uml-s3c` with the binding inside) not run: it needs the app to declare and export; Alfonso can make
  it with the new editor in two clicks, or a probe lane can.

## Decisions

- Alfonso 00:35: rail and declaration in one slice, `/lane auto`.
- Discovery answers adopted unattended (RC-21): Q1 the link group listed, disabled until S4; Q2 the section in Basic only
  when a binding exists, empty state with «Declare binding…» in Advanced; Q3 Detect's `link` record with the four slot
  roles; Q4 «Instances of», no rename of the linguistic block; Q5 one modal from `Info.tsx` and from the rail; Q6 an
  undecodable bag shows its errors and offers «Replace with detected» behind a confirmation; Q7 order B, A, C; Q8 fixture
  folder `uml-s3c`.
- Constraint added by the chat: Confirm and Remove keep every record they do not edit (the DCN records, R-DCN-1) and
  every unknown key; tested and benched.
- Lanes' own choices: Confirm allowed with `checkBindings` defects (R-VAL-4); value kinds editable, not addable; group
  subtitles «Objects» and «Links»; drop tolerance 8 px × zoom (16 px grid snap); S2-R4 runs on the Petri export because
  the linguistic block of `uml-s3b` is empty.
- R-OI-18 (provisional, unattended): the rail section as a creation surface beside R-OI-10's pane menu.
- Object diagram notation: Enterprise Architect structure adopted; no generalization between instances, no slot row
  that repeats a drawn link, design-system colours.

## Tickets

1. Value kinds cannot be added by hand (medium).
2. Defect messages show raw `Pointer…` ids (`bindingCheck.ts`, low).
3. Five object-only roles shown as empty rows on `link` (low, UI call for Alfonso).
4. Prompt-ID collisions: three in two days, one with two prompts of one ID on the trunk; `lane-run` needs an atomic ID
   check (lock or exclusive `mkdir` of the lane folder).
5. Carried: `check:addonly` on `hw-notation.md` (trunk `3f7f6f7f4`); no multi-tab probe of the problem producers; a
   canvas beside a Script tab never gets `ACTIVE_TAB`; `new-model-instantiate.ts` out of date.

## Next

1. Alfonso's visual GO on `oi-rail` at :3005 (hard refresh, import `~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`):
   Advanced, metamodel UML, «Ontological binding…», Detect, Confirm, one Cmd+Z; the rail on `library`, drag and click of
   a class, links disabled, Basic mode.
2. After the GO: merge `oi-rail` into the trunk; lane C fixture; then the notation slice on `oi-notation` (class and
   object diagrams, the four IR gaps), S4 links, S5 conformance.

## Lessons

- Both implementation lanes hit the context ceiling; a short continuation from `handoff.md` finished each in one run.
- A collision check in a slow osascript call can time out while the shell goes on: check only the lane folder and the
  trunk's `docs/prompts`, and commit and start in the same call.
- A lane launched before the Request line carries the chat URL is refused (RC-43): the URL goes first.

## Update 2026-11-08 23:20: levels, class rail, S4 links (all on `oi-rail`, waiting for Alfonso's visual GO)

Alfonso's findings of 12:25 (class diagrams one level above object diagrams; the class rail from the metamodel and the
binding; no «New instance of» on a class diagram; a relation between two instances not drawn) and his 16:03 «decidi tu»
(the level is declared by the viewpoint), 20:11 «1 yes» (lane 3 and its critical zone) and «drawing it from the source to
the target object».

- Discovery P-2026-11-08-1605/1635: `940959760`, `4d736d663`. Answers Q1..Q4, Q6, Q7 adopted as recommended.
- Levels lane 1 (1658/1726): `a709a12b1`, `b8fbddd72`, `0b12cf59a`; R-OI-19 (`_state.ontoLevel` class | instance | both,
  absent = both), R-OI-20 (gating of the instance surfaces).
- Levels lane 2 (1753/1822): `b8b9bfe30`, `3f399f545`, `7da4590f6`; R-OI-21..23 (class rail groups, container rule, class
  pane menu «New ▸»).
- Lane 3, S4 (2012/2041, critical zone go-ahead): `d9b1912f9`, `21cf3a99e`, `2bed6cb5c`, `459ac12e4`; R-OI-24. Drag
  between two objects → associations whose ends accept both classifiers (closure), one auto-selected, link with both end
  values in one undo entry, in `Package.packagedElements`; `useIRContainment.ts` and `irEdgeViews.ts` unchanged.
- Fix lane (2146/2214): `a5f657409`, `a102c23a5`, `4ee0983ac`, `355ee1537`. New attribute `+ property1 : String` [1..1];
  owner box grows; generalization in `<specific>.generalizations`; one Cmd+Z removes it (undo group around the deferred
  writes at level `class`). Drop reach: connects up to 30 px from a handle, not at 45 (`connectionRadius` 40).
- Probes at the end: S2 57/57, S4 14/14, binding editor 10/10, s3a 8/8, s3b 6/6.
- Tickets: «Link Reference» popup title on links; duplicate links allowed; a drop farther than about 40 px from a handle
  does nothing silently; at level `both` one undo after a class-to-class drag still leaves the object (other notations
  share the path, unmeasured, medium); the placement of a link guarded only by the probe; five-row cascade fit
  unmeasured; value kinds not addable by hand; raw `Pointer…` ids in binding defects.
- Next: Alfonso's visual GO on `oi-rail`, then its merge into the trunk (he pushes); then the notation slice on
  `oi-notation` (`cfd39d6c5`), S5 conformance.
