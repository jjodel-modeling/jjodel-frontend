# Spec: model-to-text code generation, the pilot

**Type**: design spec, normative for the code generation lanes. **Status**: ratified 2026-10-10
(R-GEN-1..R-GEN-9 in `docs/decisions.md`), before any discovery. The discovery `P-2026-10-10-0815`
(report `docs/discovery/discovery_2026-10-10_code_generation_pilot.md`) may reshape the points marked
*to be confirmed*; it may not reopen a decision without saying so.
**Supersedes**: nothing. As far as the chat knows, Jjodel has no model-to-text generator today
(*to be confirmed*).
**Chat**: `C-2026-10-10-0046`.

## 1. Purpose and scope

A user writes templates over a metamodel, applies them to a model and gets text in a target language.
When the target has a runner, the text runs right away in the browser. The work has two purposes:
teaching (a pilot in the MDE course, lecture at the end of October 2026) and research.

This spec fixes the pilot, and the decisions that must hold from the first line of code because they
are expensive to retrofit: origin tracking, flag isolation, additive persistence. It names the
research directions (oracle, round-trip, template authoring by an assistant) without fixing them.

## 2. Release and isolation (R-GEN-1, R-GEN-2)

The pilot ships in **3.2**, which absorbs the content planned for 3.1; no separate 3.1 tag. The course
sets the date: 3.2 is live by **2026-10-26**, the content freeze is **2026-10-23**, and any 3.1 item that
is not solid by the freeze stays out instead of delaying the release.

The generator sits behind a **user-level experimental setting, off by default**. Invariant: with the
setting off, no module of the generator is loaded (lazy chunk) and the application behaves exactly as a
build without the generator. A test proves it on the build output or the import graph, not in prose.

## 3. Persistence (R-GEN-3)

Additive, as for FormSpec: no `irVersion` bump, no VersionFixer migration. A project that holds
templates, opened and saved by a user with the setting off, keeps them intact. If templates are stored
as `jjodel/*` annotations, the known loss of those annotations in the `.ecore` round trip enters the
perimeter of the pilot. Where templates live (metamodel, project resource) is *to be confirmed*.

## 4. Templates (R-GEN-4)

A template is a named JjEL function whose result is **Text**: JjEL with string interpolation, no new
language. If the evaluator cannot host it, the extension is minimal and ratified on its own.

Text is not a string. It is a sequence of fragments, each with an optional origin (section 5).
Rendering to a string forgets the origins; the code panel keeps them. Two semantic features are part
of the contract, not of the syntax:

- **Block indentation**: a multi-line value interpolated at column *n* is indented by *n* on every
  line after the first (the semantics Xtend gives to its templates).
- **Origin**: every fragment knows where it came from.

## 5. Origin (R-GEN-5)

A fragment that copies a model value carries the triple **(element id, feature, transformation)**. The
transformation is the identity, a named invertible function, or opaque. A fragment that comes from the
literal text of a template carries its position in the template instead. The triple is recorded from
the first slice, although round-trip is outside the pilot: adding it later would mean rewriting the
evaluator's value path.

Consumers in the pilot: click from a line of generated code to the element on the canvas and back, and
runtime errors reported on the model element that produced the failing line.

## 6. Targets (R-GEN-6)

What depends on the target language is a **target profile** with three parts:

- an **identifier policy**: reserved words, case conventions, collisions; when it mangles a name it
  keeps the table, so the mapping stays invertible;
- an **expression printer** for the JjEL that guards and actions carry, restricted to a translatable
  subset (the one defined for nuXmv is the candidate, *to be confirmed*);
- a **runner**.

Generation is target-agnostic (any text). Execution exists only for targets with a runner. The pilot
has one: **JavaScript**, run in an isolated Web Worker, with a timeout, no network and no DOM.

## 7. Sources (R-GEN-7)

Templates are written against the concrete metamodel, with **read access to the roles of the
metamodel's semantic type class** (the STC of the simulator). A template written against roles applies
to every metamodel bound to that STC; a template written against metaclasses is the degenerate case of
an identity binding. Templates never write the model nor the simulator state.

## 8. Oracle (R-GEN-8)

Goal of the third week, not a requirement of the pilot. The generated program exposes a step function
with a fixed signature (fixed in Phase 2, after the discovery). It runs on the event sequence of a
scenario (R-SIM-139), and its trace is compared with the simulator's trace on the same scenario, with
the equality the scenario's `expect` defines. The simulator is the reference semantics: this is
differential testing between an interpreter and a compiler.

The oracle exists only for languages with a simulation STC. Structural generators (a class diagram to
SQL, say) get compilation and tests, a weaker guarantee; the asymmetry is stated, not hidden.

## 9. Round-trip (research, outside the pilot)

Three levels, by how much of the text is invertible by construction:

1. **Values.** A fragment whose origin has an invertible transformation can be edited in the text and
   put back into the feature. This is the criterion the IR already applies to editability (IR v1.2
   §5): generated text is a textual viewpoint, and its editable holes are its writable paths.
2. **Structure.** Adding a block that corresponds to a new element means using the template as a
   grammar and parsing the edit. Possible only for restricted templates; this is the territory of
   string lenses (Boomerang, Foster and Pierce).
3. **Free code.** Never put back: it lives in the hand-written subclass of the generation gap pattern.

When built, the acceptance criteria are the lens laws as property tests. **PutGet**: after a put-back,
regeneration returns exactly the edited text. **GetPut**: regenerating with no edit leaves the model
unchanged. The model stays the master; an edit outside the put-able holes is reported as a diff
against regeneration; edits on both sides are a conflict, never a silent merge.

## 10. Outside the pilot (R-GEN-9)

Round-trip (except the triple of section 5), targets other than JavaScript (Python through Pyodide
costs about ten megabytes), the assistant as template author (after the oracle, so that what it writes
is checked), protected regions (the generation gap pattern instead), target languages as models
(AST plus serializer).

## 11. Schedule

| Week | Work |
|---|---|
| 2026-10-12 to 10-17 | discovery, ratifications, pure engine module (templates, indentation, origin) with tests |
| 2026-10-19 to 10-24 | JavaScript runner, code panel with navigable origin, roles access, setting, 3.2 candidate |
| 2026-10-26 to 10-30 | 3.2 live, oracle, two lecture examples, Alfonso's dry run on 27 or 28, freeze the evening before the lecture |
